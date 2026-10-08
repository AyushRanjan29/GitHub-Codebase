export function parseGitHubUrl(repoUrl) {
  try {
    const url = new URL(repoUrl);

    if (url.hostname !== "github.com") {
      throw new Error("Invalid GitHub repository URL");
    }

    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length < 2) {
      throw new Error("Invalid GitHub repository URL");
    }

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");

    if (!owner || !repo) {
      throw new Error("Invalid GitHub repository URL");
    }

    return {
      owner,
      repo,
    };
  } catch {
    const error = new Error("Invalid GitHub repository URL");
    error.code = "INVALID_GITHUB_URL";
    throw error;
  }
}
