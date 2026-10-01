import { generateEmbedding } from "./embeddingService.js";

export async function embedChunks(chunks) {
  const embeddedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    console.log(
      `Embedding chunk ${i + 1}/${chunks.length}: ${chunk.metadata.filePath} - chunk ${chunk.metadata.chunkIndex}`,
    );

    const embedding = await generateEmbedding(chunk.content);

    embeddedChunks.push({
      ...chunk,
      embedding,
    });
  }

  return embeddedChunks;
}
