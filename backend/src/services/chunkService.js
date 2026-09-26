export function chunkDocument(document, chunkSize = 100, overlap = 20) {
  const lines = document.content.split("\n");

  const chunks = [];

  let start = 0;
  let chunkIndex = 0;

  while (start < lines.length) {
    const end = Math.min(start + chunkSize, lines.length);

    const chunkLines = lines.slice(start, end);

    const content = chunkLines.join("\n");

    chunks.push({
      content,

      metadata: {
        ...document.metadata,

        chunkIndex,

        startLine: start + 1,

        endLine: end,
      },
    });

    chunkIndex++;

    if (end === lines.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
}
