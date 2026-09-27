import {
  getRepository,
  getRepositoryTree,
} from "../services/gitHubServices.js";
import { parseGitHubUrl } from "../utils/gitHubParser.js";
import { isSupportedFile } from "../utils/fileFilter.js";
import { createRepositoryDocuments } from "../services/documentService.js";
import { chunkDocument } from "../services/chunkService.js";
import { embedChunks } from "../services/chunkEmbeddingService.js";
import { insertChunks } from "../repositories/chunkRepository.js";

export async function indexRepository(req, res) {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    const { owner, repo } = parseGitHubUrl(repoUrl);

    console.log(`Analyzing repository: ${owner}/${repo}`);

    const repository = await getRepository(owner, repo);

    const tree = await getRepositoryTree(
      owner,
      repo,
      repository.default_branch,
    );

    const files = tree.tree
      .filter((item) => item.type === "blob")
      .filter((item) => isSupportedFile(item.path))
      .map((item) => ({
        path: item.path,
        sha: item.sha,
        url: item.url,
      }));

    console.log(`Found ${files.length} supported files`);

    const documents = await createRepositoryDocuments({
      owner,
      repo,
      branch: repository.default_branch,
      files,
    });

    const chunks = documents.flatMap((document) =>
      chunkDocument(document, 100, 20),
    );

    console.log(`Extracted ${documents.length} documents`);

    const MAX_CHUNKS_FOR_TESTING = 20;
    const chunksToEmbed = chunks.slice(0, MAX_CHUNKS_FOR_TESTING);

    console.log(`Embedding ${chunksToEmbed.length} of ${chunks.length} chunks`);

    const embeddedChunks = await embedChunks(chunksToEmbed);
    const mongoResult = await insertChunks(embeddedChunks);

    console.log(`Stored ${mongoResult.insertedCount} chunks in MongoDB`);
    console.log(`Generated embeddings for ${embeddedChunks.length} chunks`);

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

      chunksSentForEmbedding: chunksToEmbed.length,

      totalEmbeddedChunks: embeddedChunks.length,

      storedInMongoDB: mongoResult.insertedCount,

      embeddingDimension: embeddedChunks[0]?.embedding.length || 0,

      chunks: embeddedChunks.map((chunk) => ({
        metadata: chunk.metadata,

        embeddingPreview: chunk.embedding.slice(0, 5),

        embeddingLength: chunk.embedding.length,
      })),
    });
  } catch (error) {
    console.error("Repository indexing error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to index repository",
    });
  }
}
