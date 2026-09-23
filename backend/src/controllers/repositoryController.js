import { getRepository, getRepositoryTree } from "../services/gitHubServices.js";
import { parseGitHubUrl } from "../utils/gitHubParser.js";
import { isSupportedFile } from "../utils/fileFilter.js";

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

      files,
    });
  } catch (error) {
    console.error("Repository indexing error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to analyze repository",
    });
  }
}
