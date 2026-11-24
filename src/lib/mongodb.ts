import { MongoClient, type Db } from "mongodb";
import { mongoRequestScope } from "./mongo-request-scope.mjs";

declare global {
  var _blissMongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  const createClient = () => new MongoClient(uri, {
    // Keep the Atlas cluster within its connection budget.
    maxPoolSize: 5,
    minPoolSize: 0,
    maxIdleTimeMS: 30000,
    waitQueueTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 10000,
  });
  const scope = mongoRequestScope.getStore();
  if (scope) {
    if (!scope.ready) {
      scope.client = createClient();
      scope.ready = scope.client.connect();
    }
    return (await scope.ready).db(process.env.MONGODB_DB || "bliss_fonts");
  }
  if (!global._blissMongoClientPromise) {
    const client = createClient();
    global._blissMongoClientPromise = client.connect().catch(async error => {
      global._blissMongoClientPromise = undefined;
      await client.close().catch(() => {});
      throw error;
    });
  }
  return (await global._blissMongoClientPromise).db(process.env.MONGODB_DB || "bliss_fonts");
}
