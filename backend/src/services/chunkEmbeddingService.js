import { generateEmbedding } from "./embeddingService.js";

export async function embedChunks(chunks) {
  const embeddedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      console.log(
        `Embedding chunk ${i + 1}/${chunks.length}: ${chunk.metadata.filePath}`,
      );

      const embedding = await generateEmbedding(chunk.content);

      embeddedChunks.push({
        content: chunk.content,

        embedding,

        metadata: {
          ...chunk.metadata,
        },
      });
    } catch (error) {
      console.error(`Failed to embed chunk ${i}:`, error);

      throw error;
    }
  }

  return embeddedChunks;
}
