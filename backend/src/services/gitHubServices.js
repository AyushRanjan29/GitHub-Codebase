import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function getRepository(owner, repo) {
  const response = await octokit.request("GET /repos/{owner}/{repo}", {
    owner,
    repo,
  });

  return response.data;
}

export async function getRepositoryTree(owner, repo, branch) {
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
    {
      owner,
      repo,
      tree_sha: branch,
      recursive: "true",
    },
  );

  return response.data;
}

export async function getFileContent(
  owner,
  repo,
  fileSha
) {
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/git/blobs/{file_sha}",
    {
      owner,
      repo,
      file_sha: fileSha,
    }
  );

  return response.data;
}