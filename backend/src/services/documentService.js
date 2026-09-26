import { getFileContent } from "./gitHubServices.js";
import { decodeBase64Content } from "../utils/contentDecoder.js";
import { getLanguage } from "../utils/languageDetector.js";

export async function createDocument({ owner, repo, branch, file }) {
    const blob = await getFileContent(owner, repo, file.sha);
    const content = decodeBase64Content(blob.content);
    const totalLines = content.length === 0 ? 0 : content.split("\n").length;

    return {
    content,

        metadata: {
        repository: `${owner}/${repo}`,
        owner,
        repo,
        branch,

        filePath: file.path,
        language: getLanguage(file.path),
        extension: "." + file.path.split(".").pop().toLowerCase(),
        totalLines,
        sha: file.sha,
        },
    };
}

export async function createRepositoryDocuments({
    owner,
    repo,
    branch,
    files,
}) {
    const documents = [];

    for (const file of files) {
        try {
            console.log(`Extracting: ${file.path}`);

            const document = await createDocument({
            owner,
            repo,
            branch,
            file,
            });

            documents.push(document);
        } catch (error) {
            console.error(`Failed to extract ${file.path}:`, error.message);
        }
    }

    return documents;
}
