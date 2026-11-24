import type { AsyncLocalStorage } from "node:async_hooks";
import type { MongoClient } from "mongodb";

export const mongoRequestScope: AsyncLocalStorage<{
  client?: MongoClient;
  ready?: Promise<MongoClient>;
  publicCacheOrigin?: string;
  publicCacheResult?: "hit" | "miss";
  waitUntil?: (promise: Promise<unknown>) => void;
}>;
