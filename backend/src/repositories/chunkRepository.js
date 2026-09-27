import { getDatabase } from "../config/mongodb.js";

const COLLECTION_NAME = "code_chunks";

export async function insertChunks(chunks) {
  if (!chunks || chunks.length === 0) {
    return {
      insertedCount: 0,
    };
  }

  const db = getDatabase();

  console.log("MongoDB database:", db.databaseName);
  console.log(
    "MongoDB collection:",
    db.collection(COLLECTION_NAME).collectionName,
  );

  const collection = db.collection(COLLECTION_NAME);

  const documents = chunks.map((chunk) => ({
    content: chunk.content,

    embedding: chunk.embedding,

    metadata: {
      repository: chunk.metadata.repository,
      owner: chunk.metadata.owner,
      repo: chunk.metadata.repo,
      branch: chunk.metadata.branch,
      filePath: chunk.metadata.filePath,
      language: chunk.metadata.language,
      extension: chunk.metadata.extension,
      totalLines: chunk.metadata.totalLines,
      sha: chunk.metadata.sha,
      chunkIndex: chunk.metadata.chunkIndex,
      startLine: chunk.metadata.startLine,
      endLine: chunk.metadata.endLine,
    },

    createdAt: new Date(),
  }));

  const result = await collection.insertMany(documents);
  console.log("MongoDB inserted:", result.insertedCount);

  return {
    insertedCount: result.insertedCount,
  };
}
