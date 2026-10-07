const SUPPORTED_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".h",
  ".html",
  ".css",
  ".json",
  ".md",
  ".txt",
  ".yml",
  ".yaml",
];

const IGNORED_DIRECTORIES = [
  "node_modules/",
  ".git/",
  "dist/",
  "build/",
  "coverage/",
  ".next/",
];

export function isSupportedFile(filePath) {
  const lowerPath = filePath.toLowerCase();

  // Ignore directories
  for (const directory of IGNORED_DIRECTORIES) {
    if (lowerPath.includes(directory)) {
      return false;
    }
  }

  // Ignore environment files
  if (lowerPath.includes(".env") || lowerPath.includes(".env.")) {
    return false;
  }

  // Check extension
  return SUPPORTED_EXTENSIONS.some((extension) =>
    lowerPath.endsWith(extension),
  );
}
