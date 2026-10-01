import { searchSimilarChunks } from "../services/vectorSearchService.js";
import { generateQueryEmbedding } from "../services/queryEmbeddingService.js";

export async function searchCode(req, res) {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    console.log(`Searching for: ${query}`);

    const queryEmbedding = await generateQueryEmbedding(query);

    console.log(
      `Query embedding generated: ${queryEmbedding.length} dimensions`,
    );

    const results = await searchSimilarChunks(queryEmbedding, 5);

    return res.json({
      success: true,
      query,
      results,
    });
  } catch (error) {
    console.error("Vector search error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Vector search failed",
    });
  }
}
