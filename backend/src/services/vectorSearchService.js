import { getDatabase } from "../config/mongodb.js";

export async function searchSimilarChunks(queryEmbedding, limit = 5) {
  const db = getDatabase();

  const collection = db.collection("code_chunks");

  const results = await collection
    .aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit,
        },
      },
      {
        $project: {
          _id: 0,
          content: 1,
          metadata: 1,
          score: {
            $meta: "vectorSearchScore",
          },
        },
      },
    ])
    .toArray();

  return results;
}
