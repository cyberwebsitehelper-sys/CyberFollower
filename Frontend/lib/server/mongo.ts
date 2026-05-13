import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGO_HOST || process.env.MONGODB_URI || "";
const dbName = process.env.MONGO_DB_NAME || "cyberportal";

let clientPromise: Promise<MongoClient> | null = null;

export function getMongoClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("Mongo connection string is missing. Set MONGO_HOST or MONGODB_URI.");
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}

