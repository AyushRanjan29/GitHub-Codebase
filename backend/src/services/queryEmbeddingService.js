import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateQueryEmbedding(query) {
  if (!query || !query.trim()) {
    throw new Error("Query cannot be empty");
  }

  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: query,
  });

  return response.embeddings[0].values;
}
