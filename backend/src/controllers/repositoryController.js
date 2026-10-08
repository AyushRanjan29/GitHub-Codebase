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
  getRepositoryFileStates,
  deleteChunksByFiles,
} from "../repositories/chunkRepository.js";

export async function indexRepository(req, res) {
  try {
    const { repoUrl } = req.body || {};

    if (typeof repoUrl !== "string" || !repoUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required and must be a non-empty string.",
      });
    }

    const { owner, repo } = parseGitHubUrl(repoUrl.trim());

    const repositoryName = `${owner}/${repo}`;

    console.log(`Analyzing repository: ${repositoryName}`);

    // 1. Fetch repository information
    const repository = await getRepository(owner, repo);

    // 2. Fetch GitHub file tree
    const tree = await getRepositoryTree(
      owner,
      repo,
      repository.default_branch,
    );
    if (tree.truncated) {
      throw new Error(
        "GitHub returned a truncated file tree. Indexing stopped to avoid removing valid files.",
      );
    }

    // 3. Filter supported files
    const files = tree.tree
      .filter((item) => item.type === "blob")
      .filter((item) => isSupportedFile(item.path))
      .map((item) => ({
        path: item.path,
        sha: item.sha,
        url: item.url,
      }));

    console.log(`Found ${files.length} supported files`);

    // 4. Fetch previously indexed file SHAs
    const existingFiles = await getRepositoryFileStates(repositoryName);

    console.log(`Found ${existingFiles.size} previously indexed files`);

    // 5. Compare current GitHub files with MongoDB
    const currentFilePaths = new Set(files.map((file) => file.path));

    const filesToProcess = files.filter((file) => {
      const existingSha = existingFiles.get(file.path);

      return !existingSha || existingSha !== file.sha;
    });

    const changedFilePaths = filesToProcess
      .filter((file) => existingFiles.has(file.path))
      .map((file) => file.path);

    const deletedFiles = [...existingFiles.keys()].filter(
      (filePath) => !currentFilePaths.has(filePath),
    );

    const unchangedFiles = files.length - filesToProcess.length;

    console.log(`Unchanged files: ${unchangedFiles}`);
    console.log(`New/changed files: ${filesToProcess.length}`);
    console.log(`Deleted files: ${deletedFiles.length}`);

    // 6. Extract only new or changed files
    const documents = await createRepositoryDocuments({
      owner,
      repo,
      branch: repository.default_branch,
      files: filesToProcess,
    });

    console.log(`Extracted ${documents.length} documents`);

    // 7. Chunk only new or changed documents
    const chunks = documents.flatMap((document) =>
      chunkDocument(document, 100, 20),
    );

    console.log(`Generated ${chunks.length} chunks`);

    // 8. Generate version-aware chunk IDs
    const chunksWithIds = chunks.map((chunk) => ({
      ...chunk,
      chunkId: [
        chunk.metadata.repository,
        chunk.metadata.filePath,
        chunk.metadata.sha,
        chunk.metadata.chunkIndex,
      ].join(":"),
    }));

    // 9. Check existing chunk IDs
    const chunkIds = chunksWithIds.map((chunk) => chunk.chunkId);

    const existingChunkIds = await getExistingChunkIds(chunkIds);

    const chunksToEmbed = chunksWithIds.filter(
      (chunk) => !existingChunkIds.has(chunk.chunkId),
    );

    console.log(`Already embedded: ${existingChunkIds.size}`);
    console.log(`Chunks remaining: ${chunksToEmbed.length}`);

    // 10. Embed and store new chunks in batches
    const BATCH_SIZE = 5;

    let totalEmbeddedChunks = 0;
    let totalInsertedChunks = 0;

    for (let start = 0; start < chunksToEmbed.length; start += BATCH_SIZE) {
      const batch = chunksToEmbed.slice(start, start + BATCH_SIZE);

      console.log(
        `Processing batch ${
          Math.floor(start / BATCH_SIZE) + 1
        }/${Math.ceil(chunksToEmbed.length / BATCH_SIZE)}`,
      );

      const embeddedBatch = await embedChunks(batch);

      const mongoResult = await insertChunks(embeddedBatch);

      totalEmbeddedChunks += embeddedBatch.length;
      totalInsertedChunks += mongoResult.insertedCount;

      console.log(`Stored ${mongoResult.insertedCount} chunks from this batch`);
    }

    // 11. Delete old versions of successfully re-indexed files
    // and files removed from GitHub.
    const filesToReplace = [...changedFilePaths, ...deletedFiles];

    let totalDeletedChunks = 0;

    if (filesToReplace.length > 0) {
      const deleteResult = await deleteChunksByFiles(
        repositoryName,
        filesToReplace,
        // Preserve chunks belonging to the current GitHub SHA.
        new Map(filesToProcess.map((file) => [file.path, file.sha])),
      );

      totalDeletedChunks = deleteResult.deletedCount;

      console.log(`Deleted ${totalDeletedChunks} stale chunks`);
    }

    console.log(`Total newly embedded: ${totalEmbeddedChunks}`);
    console.log(`Total newly stored: ${totalInsertedChunks}`);

    // 12. Return indexing summary
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
      unchangedFiles,
      filesProcessed: filesToProcess.length,
      changedFiles: changedFilePaths.length,
      deletedFiles: deletedFiles.length,

      totalDocuments: documents.length,
      totalChunks: chunks.length,

      alreadyEmbedded: existingChunkIds.size,
      chunksSentForEmbedding: chunksToEmbed.length,
      totalEmbeddedChunks,
      storedInMongoDB: totalInsertedChunks,
      deletedChunks: totalDeletedChunks,
    });
  } catch (error) {
    console.error("Repository indexing error:", error);

    if (error.code === "INVALID_GITHUB_URL") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid GitHub repository URL.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to index the repository.",
    });
  }
}
