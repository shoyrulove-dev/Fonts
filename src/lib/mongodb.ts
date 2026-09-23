import { MongoClient, type Db } from "mongodb";

const dbName = process.env.MONGODB_DB || "bliss_fonts";

declare global {
  var _blissMongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  const clientPromise = global._blissMongoClientPromise ?? new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 10000,
  }).connect();
  if (process.env.NODE_ENV !== "production") global._blissMongoClientPromise = clientPromise;
  return (await clientPromise).db(dbName);
}
