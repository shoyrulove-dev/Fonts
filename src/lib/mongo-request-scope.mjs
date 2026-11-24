import { AsyncLocalStorage } from "node:async_hooks";

export const mongoRequestScope =
  (globalThis[Symbol.for("bliss-fonts.mongoRequestScope")] ??= new AsyncLocalStorage());
