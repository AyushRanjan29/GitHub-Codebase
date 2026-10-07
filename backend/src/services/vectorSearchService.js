import { getDatabase } from "../config/mongodb.js";

const COLLECTION_NAME = "code_chunks";
const INDEX_NAME = "vector_index";
const VECTOR_PATH = "embedding";
const FILTER_PATH = "metadata.repository";
const SIMILARITY = "cosine";

const DEFAULT_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS) || 3072;

let indexReadyPromise = null;

/* --------------------------------------------------
   MongoDB collection
-------------------------------------------------- */

function getCollection() {
  return getDatabase().collection(COLLECTION_NAME);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* --------------------------------------------------
   Vector index
-------------------------------------------------- */

async function detectDimensions() {
  if (process.env.EMBEDDING_DIMENSIONS) {
    return Number(process.env.EMBEDDING_DIMENSIONS);
  }

  const sample = await getCollection()
    .aggregate([
      {
        $match: {
          [VECTOR_PATH]: {
            $type: "array",
          },
        },
      },
      {
        $limit: 1,
      },
      {
        $project: {
          _id: 0,
          n: {
            $size: `$${VECTOR_PATH}`,
          },
        },
      },
    ])
    .toArray();

  return sample[0]?.n || DEFAULT_DIMENSIONS;
}

function buildDefinition(numDimensions) {
  return {
    mappings: {
      dynamic: false,

      fields: {
        [FILTER_PATH]: {
          type: "token",
        },

        [VECTOR_PATH]: {
          type: "knnVector",
          dimensions: numDimensions,
          similarity: SIMILARITY,
        },
      },
    },
  };
}

function definitionIsCorrect(existingIndex, numDimensions) {
  const mappings =
    existingIndex?.latestDefinition?.mappings ||
    existingIndex?.definition?.mappings;

  if (!mappings) {
    return false;
  }

  const fields = mappings.fields || {};

  const repositoryField = fields[FILTER_PATH];

  const vectorField = fields[VECTOR_PATH];

  return (
    repositoryField?.type === "token" &&
    vectorField?.type === "knnVector" &&
    vectorField?.dimensions === numDimensions &&
    vectorField?.similarity === SIMILARITY
  );
}

async function waitUntilQueryable(timeoutMs = 120000) {
  const collection = getCollection();
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const [idx] = await collection.listSearchIndexes(INDEX_NAME).toArray();

    if (idx?.queryable) {
      return true;
    }

    await sleep(2000);
  }

  throw new Error(
    `Search index "${INDEX_NAME}" did not become queryable within ${
      timeoutMs / 1000
    }s`,
  );
}

export async function ensureVectorIndex() {
  if (indexReadyPromise) {
    return indexReadyPromise;
  }

  indexReadyPromise = (async () => {
    const collection = getCollection();

    const numDimensions = await detectDimensions();

    const definition = buildDefinition(numDimensions);

    const [existing] = await collection.listSearchIndexes(INDEX_NAME).toArray();

    if (!existing) {
      console.log(
        `Creating vector index "${INDEX_NAME}" (${numDimensions} dimensions)`,
      );

      await collection.createSearchIndex({
        name: INDEX_NAME,
        type: "vectorSearch",
        definition,
      });
    } else if (!definitionIsCorrect(existing, numDimensions)) {
      console.log(`Updating vector index "${INDEX_NAME}"`);

      await collection.updateSearchIndex(INDEX_NAME, definition);

      await sleep(3000);
    } else {
      console.log(
        `Vector index "${INDEX_NAME}" already has the correct definition`,
      );
    }

    await waitUntilQueryable();

    console.log(`Vector index "${INDEX_NAME}" is ready`);

    return true;
  })().catch((error) => {
    indexReadyPromise = null;
    throw error;
  });

  return indexReadyPromise;
}

/* --------------------------------------------------
   Embedding normalization
-------------------------------------------------- */

function normalizeEmbedding(queryEmbedding) {
  let vector = Array.isArray(queryEmbedding?.[0])
    ? queryEmbedding[0]
    : queryEmbedding;

  vector = Array.from(vector || [], Number);

  if (vector.length === 0 || vector.some((n) => Number.isNaN(n))) {
    throw new Error("queryEmbedding must be a non-empty array of numbers");
  }

  return vector;
}

/* --------------------------------------------------
   Text processing
-------------------------------------------------- */

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "being",
  "by",
  "do",
  "does",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "this",
  "to",
  "what",
  "where",
  "which",
  "why",
  "with",
]);

function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-z0-9_./-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token));
}

/* --------------------------------------------------
   File helpers
-------------------------------------------------- */

const DOCUMENTATION_FILES = new Set([
  "readme.md",
  "readme",
  "changelog.md",
  "contributing.md",
]);

const CONFIG_FILES = new Set([
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

function getFileName(filePath = "") {
  return filePath.split("/").pop()?.toLowerCase() || "";
}

/* --------------------------------------------------
   Lexical relevance
-------------------------------------------------- */

/**
 * Calculates lexical relevance between the query
 * and a retrieved code chunk using token overlap.
 *
 * Gives more weight to:
 * - query terms found in code content
 * - query terms found in the file path
 */
function calculateLexicalScore(query, result) {
  const queryTokens = [...new Set(tokenize(query))];

  if (queryTokens.length === 0) {
    return 0;
  }

  const filePath = result.metadata?.filePath || "";

  const content = result.content || "";

  const pathTokens = tokenize(filePath);

  const contentTokens = tokenize(content);

  let contentMatches = 0;
  let pathMatches = 0;

  for (const queryToken of queryTokens) {
    if (contentTokens.includes(queryToken)) {
      contentMatches++;
    }

    if (pathTokens.includes(queryToken)) {
      pathMatches++;
    }
  }

  const contentCoverage = contentMatches / queryTokens.length;

  const pathCoverage = pathMatches / queryTokens.length;

  return contentCoverage * 0.65 + pathCoverage * 0.35;
}

/* --------------------------------------------------
   File-path relevance
-------------------------------------------------- */

function calculatePathRelevance(query, result) {
  const queryTokens = [...new Set(tokenize(query))];

  if (queryTokens.length === 0) {
    return 0;
  }

  const filePath = result.metadata?.filePath || "";

  const pathTokens = tokenize(filePath);

  const matchedTokens = queryTokens.filter((token) =>
    pathTokens.includes(token),
  );

  if (matchedTokens.length === 0) {
    return 0;
  }

  return Math.min(matchedTokens.length / queryTokens.length, 1);
}

/* --------------------------------------------------
   File-type adjustment
-------------------------------------------------- */

/**
 * Documentation/configuration files can be useful,
 * so penalties are applied only when the query does
 * not appear to be asking about documentation or
 * configuration.
 */
function calculateFileTypeAdjustment(query, result) {
  const filePath = result.metadata?.filePath || "";

  const fileName = getFileName(filePath);

  const normalizedPath = filePath.toLowerCase();

  const queryTokens = new Set(tokenize(query));

  const documentationQuery =
    queryTokens.has("readme") ||
    queryTokens.has("documentation") ||
    queryTokens.has("docs") ||
    queryTokens.has("document");

  const configurationQuery =
    queryTokens.has("config") ||
    queryTokens.has("configuration") ||
    queryTokens.has("configure") ||
    queryTokens.has("dependency") ||
    queryTokens.has("dependencies") ||
    queryTokens.has("package");

  const promptQuery = queryTokens.has("prompt") || queryTokens.has("prompts");

  /*
   * Documentation
   */

  if (DOCUMENTATION_FILES.has(fileName)) {
    return documentationQuery ? 0.05 : -0.08;
  }

  /*
   * Configuration
   */

  if (CONFIG_FILES.has(fileName)) {
    return configurationQuery ? 0.04 : -0.05;
  }

  /*
   * Prompt files
   *
   * Prompt files are useful when the user asks
   * about prompts, but shouldn't normally compete
   * with implementation files.
   */

  if (normalizedPath.includes("/prompts/")) {
    return promptQuery ? 0.04 : -0.04;
  }

  /*
   * Implementation files receive a small boost.
   */

  const implementationExtensions = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".cs",
    ".go",
    ".rs",
  ];

  const isImplementationFile = implementationExtensions.some((extension) =>
    fileName.endsWith(extension),
  );

  if (isImplementationFile) {
    return 0.02;
  }

  return 0;
}

/* --------------------------------------------------
   Final hybrid score
-------------------------------------------------- */

function calculateFinalScore(query, result) {
  const semanticScore = Number(result.score) || 0;

  const lexicalScore = calculateLexicalScore(query, result);

  const pathScore = calculatePathRelevance(query, result);

  const fileTypeAdjustment = calculateFileTypeAdjustment(query, result);

  /*
   * Semantic similarity remains the strongest
   * signal.
   */
  const finalScore =
    semanticScore * 0.6 +
    lexicalScore * 0.2 +
    pathScore * 0.2 +
    fileTypeAdjustment;

  return {
    semanticScore,
    lexicalScore,
    pathScore,
    fileTypeAdjustment,
    finalScore,
  };
}

/* --------------------------------------------------
   Reranking + source diversity
-------------------------------------------------- */

function rerankResults(query, results, limit) {
  const scoredResults = results.map((result) => {
    const scores = calculateFinalScore(query, result);

    return {
      ...result,

      rerankScore: scores.finalScore,

      rerankDetails: scores,
    };
  });

  scoredResults.sort((a, b) => b.rerankScore - a.rerankScore);

  /*
   * First pass:
   * Prefer one strong chunk from each
   * different file.
   */
  const diverseResults = [];
  const usedFiles = new Set();

  for (const result of scoredResults) {
    const filePath = result.metadata?.filePath || "";

    if (!usedFiles.has(filePath)) {
      diverseResults.push(result);
      usedFiles.add(filePath);
    }

    if (diverseResults.length >= limit) {
      break;
    }
  }

  /*
   * If there are not enough different files,
   * fill the remaining slots with the
   * next-best chunks.
   */
  if (diverseResults.length < limit) {
    for (const result of scoredResults) {
      if (!diverseResults.includes(result)) {
        diverseResults.push(result);
      }

      if (diverseResults.length >= limit) {
        break;
      }
    }
  }

  return diverseResults.slice(0, limit);
}

/* --------------------------------------------------
   Repository-aware vector search
-------------------------------------------------- */

export async function searchSimilarChunks(
  queryEmbedding,
  repository,
  limit = 5,
  query = "",
) {
  const collection = getCollection();

  const queryVector = normalizeEmbedding(queryEmbedding);

  await ensureVectorIndex();

  const numCandidates = Math.max(100, limit * 20);

  /* -----------------------------------------------
     1. Native repository-filtered vector search
  ------------------------------------------------ */

  let results = await collection
    .aggregate([
      {
        $vectorSearch: {
          index: INDEX_NAME,
          path: VECTOR_PATH,
          queryVector,

          numCandidates,

          limit,

          filter: {
            [FILTER_PATH]: {
              $eq: repository,
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          content: 1,
          metadata: 1,
          score: {
            $meta: "vectorSearchScore",
          },
        },
      },
    ])
    .toArray();

  /* -----------------------------------------------
     2. Atlas Local fallback
  ------------------------------------------------ */

  if (results.length === 0) {
    console.warn(
      `Native repository filter returned 0 results for "${repository}". Using fallback search.`,
    );

    results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: INDEX_NAME,
            path: VECTOR_PATH,
            queryVector,

            numCandidates: Math.max(1000, limit * 50),

            limit: Math.max(200, limit * 20),
          },
        },

        {
          $match: {
            [FILTER_PATH]: repository,

            "metadata.filePath": {
              $not: /(^|\/)package-lock\.json$/i,
            },
          },
        },

        {
          $project: {
            _id: 0,
            content: 1,
            metadata: 1,
            score: {
              $meta: "vectorSearchScore",
            },
          },
        },
      ])
      .toArray();
  }

  /* -----------------------------------------------
     3. Hybrid reranking
  ------------------------------------------------ */

  const rerankedResults = rerankResults(query, results, limit);

  return rerankedResults;
}
