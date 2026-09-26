const LANGUAGE_MAP = {
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".py": "python",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
    ".h": "c",
    ".html": "html",
    ".css": "css",
    ".json": "json",
    ".md": "markdown",
};

export function getLanguage(filePath) {
    const extension = "." + filePath.split(".").pop().toLowerCase();
    return LANGUAGE_MAP[extension] || "text";
}
