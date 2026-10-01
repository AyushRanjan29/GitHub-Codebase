import {
  getRepository,
  getRepositoryTree,
} from "../services/gitHubServices.js";

import { parseGitHubUrl } from "../utils/gitHubParser.js";
import { isSupportedFile } from "../utils/fileFilter.js";
import { createRepositoryDocuments } from "../services/documentService.js";
import { chunkDocument } from "../services/chunkService.js";
import { embedChunks } from "../services/chunkEmbeddingService.js";

import {
  insertChunks,
  getExistingChunkIds,
} from "../repositories/chunkRepository.js";

export async function indexRepository(req, res) {
  try {
    const { repoUrl } = req.body;

    // Validate repository URL
    if (!repoUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    // Parse GitHub URL
    const { owner, repo } = parseGitHubUrl(repoUrl);

    console.log(`Analyzing repository: ${owner}/${repo}`);

    // Get repository information
    const repository = await getRepository(owner, repo);

    // Get repository file tree
    const tree = await getRepositoryTree(
      owner,
      repo,
      repository.default_branch,
    );

    // Filter supported files
    const files = tree.tree
      .filter((item) => item.type === "blob")
      .filter((item) => isSupportedFile(item.path))
      .map((item) => ({
        path: item.path,
        sha: item.sha,
        url: item.url,
      }));

    console.log(`Found ${files.length} supported files`);

    // Extract file contents
    const documents = await createRepositoryDocuments({
      owner,
      repo,
      branch: repository.default_branch,
      files,
    });

    console.log(`Extracted ${documents.length} documents`);

    // Create chunks
    const chunks = documents.flatMap((document) =>
      chunkDocument(document, 100, 20),
    );

    console.log(`Generated ${chunks.length} chunks`);

    // Create a unique ID for every chunk
    const chunksWithIds = chunks.map((chunk) => ({
      ...chunk,
      chunkId: [
        chunk.metadata.repository,
        chunk.metadata.filePath,
        chunk.metadata.chunkIndex,
      ].join(":"),
    }));

    // Get all existing chunk IDs from MongoDB
    const chunkIds = chunksWithIds.map((chunk) => chunk.chunkId);

    const existingChunkIds = await getExistingChunkIds(chunkIds);

    console.log(`Already embedded: ${existingChunkIds.size}`);

    // Only embed chunks that don't already exist
    const chunksToEmbed = chunksWithIds.filter(
      (chunk) => !existingChunkIds.has(chunk.chunkId),
    );

    console.log(`Chunks remaining: ${chunksToEmbed.length}`);

    // Generate embeddings in batches
    const BATCH_SIZE = 5;

    let totalEmbeddedChunks = 0;
    let totalInsertedChunks = 0;

    for (let start = 0; start < chunksToEmbed.length; start += BATCH_SIZE) {
      const batch = chunksToEmbed.slice(start, start + BATCH_SIZE);

      console.log(
        `\nProcessing batch ${Math.floor(start / BATCH_SIZE) + 1}/${Math.ceil(
          chunksToEmbed.length / BATCH_SIZE,
        )}`,
      );

      // Generate embeddings for this batch
      const embeddedBatch = await embedChunks(batch);

      // Store this batch immediately
      const mongoResult = await insertChunks(embeddedBatch);

      totalEmbeddedChunks += embeddedBatch.length;

      totalInsertedChunks += mongoResult.insertedCount;

      console.log(`Stored ${mongoResult.insertedCount} chunks from this batch`);
    }

    console.log(`Total newly embedded: ${totalEmbeddedChunks}`);

    console.log(`Total newly stored: ${totalInsertedChunks}`);

    return res.json({
      success: true,

      repository: {
        name: repository.name,
        fullName: repository.full_name,
        description: repository.description,
        defaultBranch: repository.default_branch,
        language: repository.language,
      },

      totalFiles: files.length,

      totalDocuments: documents.length,

      totalChunks: chunks.length,

      alreadyEmbedded: existingChunkIds.size,

      chunksSentForEmbedding: chunksToEmbed.length,

      totalEmbeddedChunks,

      storedInMongoDB: totalInsertedChunks,
    });
  } catch (error) {
    console.error("Repository indexing error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to index repository",
    });
  }
}
