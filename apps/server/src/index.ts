import { runtimeBuildInfo } from "@chess-tabiya/runtime";
import { schemaBuildInfo } from "@chess-tabiya/schema";

export {
  ServerError,
  engineUnavailable,
  policyModeUnsupported,
  type ServerErrorCode,
} from "./errors.js";
export {
  EngineSupervisor,
  type EngineHealth,
  type EngineIdentity,
  type EngineKind,
  type EngineRequest,
  type EngineSpec,
  type EngineStatus,
  type RestartBackoff,
  type TranscriptEntry,
} from "./engine-supervisor.js";
export {
  DEFAULT_MAIA_IMAGE,
  MAIA3_MODEL_ID,
  MAIA3_SOURCE_COMMIT,
  maiaDockerSpec,
  type MaiaDockerSpecOptions,
} from "./maia.js";
export {
  createHttpServer,
  createRestHandler,
  errorResponse,
  type RestHandler,
} from "./rest.js";
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
