export function parseGitHubUrl(repoUrl) {
  try {
    const url = new URL(repoUrl);

    if (url.hostname !== "github.com") {
      throw new Error("URL must be a GitHub repository URL");
    }

    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length < 2) {
      throw new Error("Invalid GitHub repository URL");
    }

    const owner = parts[0];
    const repo = parts[1].replace(".git", "");

    return {
      owner,
      repo,
    };
  } catch (error) {
    throw new Error("Invalid GitHub repository URL");
  }
}
