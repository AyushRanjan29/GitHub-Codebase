import { getDatabase } from "../config/mongodb.js";

const COLLECTION_NAME = "code_chunks";

export async function insertChunks(chunks) {
  if (!chunks || chunks.length === 0) {
    return {
      insertedCount: 0,
      modifiedCount: 0,
      upsertedCount: 0,
    };
  }

  const db = getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const operations = chunks.map((chunk) => {
    const metadata = chunk.metadata;

    const chunkId =
      chunk.chunkId ||
      [metadata.repository, metadata.filePath, metadata.chunkIndex].join(":");

    return {
      updateOne: {
        filter: {
          chunkId,
        },

        update: {
          $set: {
            chunkId,

            content: chunk.content,

            embedding: chunk.embedding,

            metadata: {
              repository: metadata.repository,
              owner: metadata.owner,
              repo: metadata.repo,
              branch: metadata.branch,
              filePath: metadata.filePath,
              language: metadata.language,
              extension: metadata.extension,
              totalLines: metadata.totalLines,
              sha: metadata.sha,
              chunkIndex: metadata.chunkIndex,
              startLine: metadata.startLine,
              endLine: metadata.endLine,
            },

            updatedAt: new Date(),
          },

          $setOnInsert: {
            createdAt: new Date(),
          },
        },

        upsert: true,
      },
    };
  });

  const result = await collection.bulkWrite(operations);

  return {
    insertedCount: result.upsertedCount,

    modifiedCount: result.modifiedCount,

    upsertedCount: result.upsertedCount,

    matchedCount: result.matchedCount,
  };
}

export async function getExistingChunkIds(chunkIds) {
  if (!chunkIds || chunkIds.length === 0) {
    return new Set();
  }

  const db = getDatabase();

  const collection = db.collection(COLLECTION_NAME);

  const documents = await collection
    .find(
      {
        chunkId: {
          $in: chunkIds,
        },
      },
      {
        projection: {
          _id: 0,
          chunkId: 1,
        },
      },
    )
    .toArray();

  return new Set(documents.map((document) => document.chunkId));
}
