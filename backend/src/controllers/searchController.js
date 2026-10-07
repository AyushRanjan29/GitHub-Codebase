import { searchSimilarChunks } from "../services/vectorSearchService.js";
import { generateQueryEmbedding } from "../services/queryEmbeddingService.js";
import { generateRAGAnswer } from "../services/geminiService.js";

export async function searchCode(req, res) {
  try {
    const { query, repository } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    if (!repository || !repository.trim()) {
      return res.status(400).json({
        success: false,
        message: "Repository is required",
      });
    }

    console.log(`Searching for: ${query}`);
    console.log(`Repository filter: ${repository}`);

    // Step 1: Generate embedding for the user's question
    const queryEmbedding = await generateQueryEmbedding(query);

    console.log(
      `Query embedding generated: ${queryEmbedding.length} dimensions`,
    );

    // Step 2: Retrieve relevant code chunks
    const results = await searchSimilarChunks(queryEmbedding, repository.trim(), 5);

    console.log(`Retrieved ${results.length} chunks`);

    // Step 3: Generate an answer using Gemini
    const answer = await generateRAGAnswer(query, results);

    // Step 4: Return the answer and source chunks
    return res.json({
      success: true,
      query,
      answer,
      sources: results.map((chunk) => ({
        filePath: chunk.metadata.filePath,
        startLine: chunk.metadata.startLine,
        endLine: chunk.metadata.endLine,
        score: chunk.score,
      })),
    });
  } catch (error) {
    console.error("RAG search error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "RAG search failed",
    });
  }
}
