import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}

const client = new MongoClient(uri);

let database;

export async function connectMongoDB() {
  if (database) {
    return database;
  }

  await client.connect();

  database = client.db("github_codebase_rag");

  console.log("MongoDB connected successfully");

  return database;
}

export function getDatabase() {
  if (!database) {
    throw new Error("MongoDB is not connected");
  }

  return database;
}
