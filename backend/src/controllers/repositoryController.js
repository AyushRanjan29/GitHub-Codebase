import {
  getRepository,
  getRepositoryTree,
} from "../services/gitHubServices.js";
import { parseGitHubUrl } from "../utils/gitHubParser.js";
import { isSupportedFile } from "../utils/fileFilter.js";
import { createRepositoryDocuments } from "../services/documentService.js";
import { chunkDocument } from "../services/chunkService.js";

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

      // documents,
      metadata: documents.map((document) => ({
        ...document.metadata,
      })),
    });
  } catch (error) {
    console.error("Repository indexing error:", error);

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

      chunks: chunks.map((chunk) => ({
        metadata: chunk.metadata,
        contentPreview: chunk.content.slice(0, 200),
      })),
    });
  }
}
