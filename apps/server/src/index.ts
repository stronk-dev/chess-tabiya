import { runtimeBuildInfo } from "@chess-tabiya/runtime";
import { schemaBuildInfo } from "@chess-tabiya/schema";

export { ServerError, type ServerErrorCode } from "./errors.js";
export { createHttpServer, createRestHandler, type RestHandler } from "./rest.js";
export {
  RunService,
  type EventsPage,
  type RewindTarget,
  type RunGraph,
} from "./service.js";
export {
  SQLiteRunStorage,
  type RunStorage,
  type StoredRun,
} from "./storage.js";

export const serverBuildInfo = Object.freeze({
  runtime: runtimeBuildInfo,
  schema: schemaBuildInfo,
  defaultStorage: "sqlite",
});
