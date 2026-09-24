import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { createApplication, createStorageMigrator, DEFAULT_DATABASE_PATH, type EngineMode } from "./application.js";
import { deploymentBoundaryFromEnv } from "./config.js";
import { ExternalHttpVoiceProvider } from "./external-voice.js";
import { ExternalHttpTtsProvider } from "./external-tts.js";
import { fileBackedDatabaseIdentity } from "./longitudinal-worker-config.js";
import {
  applicationRevisionFromEnv,
  errorReceipt,
  generateStorageOperationId,
  prepareStartOperation,
  ReceiptClock,
  recoverStorage,
  resolveStoragePaths,
  StorageLock,
  type StorageAdminReceiptV1,
} from "./storage-admin.js";

function integer(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new TypeError(`Invalid port: ${value}`);
  }
  return parsed;
}

const engineMode = (process.env.ENGINE_MODE ?? "mock") as EngineMode;
if (engineMode !== "mock" && engineMode !== "maia") {
  throw new TypeError(`Unsupported ENGINE_MODE: ${engineMode}`);
}

const development = process.env.NODE_ENV === "development";
// rfc/safe-deployment-profiles.md: one closed boundary; hybrids refuse before storage or HTTP opens.
const deployment = deploymentBoundaryFromEnv(process.env, { development });
const voiceMode = process.env.TABIYA_VOICE_PROVIDER;
if (voiceMode !== undefined && voiceMode !== "external_http") {
  throw new TypeError(`Unsupported TABIYA_VOICE_PROVIDER: ${voiceMode}`);
}
if (voiceMode === "external_http" && process.env.TABIYA_VOICE_PROVIDER_URL === undefined) {
  throw new TypeError("TABIYA_VOICE_PROVIDER_URL is required for external_http");
}
const voiceTimeout = process.env.TABIYA_VOICE_PROVIDER_TIMEOUT_MS === undefined
  ? 4_000
  : Number(process.env.TABIYA_VOICE_PROVIDER_TIMEOUT_MS);
if (!Number.isSafeInteger(voiceTimeout) || voiceTimeout < 1) {
  throw new TypeError("TABIYA_VOICE_PROVIDER_TIMEOUT_MS must be a positive safe integer");
}
const ttsMode = process.env.TABIYA_TTS_PROVIDER;
if (ttsMode !== undefined && ttsMode !== "external_http") throw new TypeError(`Unsupported TABIYA_TTS_PROVIDER: ${ttsMode}`);
if (ttsMode === "external_http" && process.env.TABIYA_TTS_PROVIDER_URL === undefined) throw new TypeError("TABIYA_TTS_PROVIDER_URL is required for external_http");
const ttsTimeout = process.env.TABIYA_TTS_PROVIDER_TIMEOUT_MS === undefined ? 4_000 : Number(process.env.TABIYA_TTS_PROVIDER_TIMEOUT_MS);
if (!Number.isSafeInteger(ttsTimeout) || ttsTimeout < 1) throw new TypeError("TABIYA_TTS_PROVIDER_TIMEOUT_MS must be a positive safe integer");
if ((process.env.DRAFT_PACK_FILE !== undefined || process.env.DRAFT_PACK_FILES !== undefined) && !development) {
  throw new TypeError("Explicit draft pack files require NODE_ENV=development");
}
const draftPackFiles = process.env.DRAFT_PACK_FILES?.split(",").map((path) => path.trim()).filter((path) => path.length > 0);
const externalVoice = voiceMode !== "external_http" ? undefined : new ExternalHttpVoiceProvider({
  url: process.env.TABIYA_VOICE_PROVIDER_URL!,
  ...(process.env.TABIYA_VOICE_PROVIDER_KEY === undefined ? {} : { key: process.env.TABIYA_VOICE_PROVIDER_KEY }),
  timeoutMs: voiceTimeout,
});

// rfc/storage-backup-recovery.md §§1, 5a, 6: this process owns the storage lock for its whole
// lifetime — through replacement recovery, prepare-start (pre-upgrade snapshot + staged migration)
// and HTTP service — so there is no unlock/relock boundary a maintenance command could enter.
const databasePath = fileBackedDatabaseIdentity(process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH()).absolutePath;
mkdirSync(dirname(databasePath), { recursive: true });
const storagePaths = resolveStoragePaths({ database: databasePath, backupRoot: process.env.TABIYA_BACKUP_ROOT ?? join(dirname(databasePath), "backups") });
const storageBase = { operationId: generateStorageOperationId(), applicationRevision: applicationRevisionFromEnv(), clock: new ReceiptClock() };
let storageLock: StorageLock;
let prepared: StorageAdminReceiptV1;
try {
  storageLock = StorageLock.acquire(storagePaths);
} catch (error) {
  console.error(JSON.stringify({ event: "storage_prepare_receipt", receipt: errorReceipt(storageBase, "prepare_start", error) }));
  process.exit(2);
}
try {
  const recovery = recoverStorage({ lock: storageLock, paths: storagePaths });
  if (recovery !== "none") console.info(JSON.stringify({ event: "storage_replacement_recovered", recovery }));
  const migrate = await createStorageMigrator({ development, ...(draftPackFiles === undefined ? {} : { draftPackFiles }), ...(process.env.DRAFT_PACK_FILE === undefined ? {} : { draftPackFile: process.env.DRAFT_PACK_FILE }) });
  prepared = await prepareStartOperation({ ...storageBase, lock: storageLock, paths: storagePaths, migrate });
} catch (error) {
  console.error(`storage prepare-start: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  prepared = errorReceipt(storageBase, "prepare_start", error);
}
console.info(JSON.stringify({ event: "storage_prepare_receipt", receipt: prepared }));
if (prepared.result !== "succeeded") {
  console.error("Storage preflight refused to start the server. The live database is unchanged; see docs/storage-backup-and-recovery.md (failed upgrade / last-known-good recovery).");
  storageLock.release();
  process.exit(prepared.result === "refused" ? 2 : 3);
}

const application = await createApplication({
  development,
  engineMode,
  databasePath,
  requirePreparedStorage: true,
  deployment,
  ...(process.env.DRAFT_PACK_FILE === undefined
    ? {}
    : { draftPackFile: process.env.DRAFT_PACK_FILE }),
  ...(draftPackFiles === undefined ? {} : { draftPackFiles }),
  ...(process.env.STATIC_DIRECTORY === undefined
    ? {}
    : { staticDirectory: process.env.STATIC_DIRECTORY }),
  ...(process.env.MAIA_HOST === undefined
    ? {}
    : { maiaHost: process.env.MAIA_HOST }),
  maiaPort: integer(process.env.MAIA_PORT, 7000),
  ...(process.env.STOCKFISH_PATH === undefined
    ? {}
    : { stockfishCommand: process.env.STOCKFISH_PATH }),
  ...(process.env.LICHESS_TOKEN === undefined ? {} : { corpusToken: process.env.LICHESS_TOKEN }),
  ...(externalVoice === undefined ? {} : { voiceProvider: externalVoice, reasoningReviewProvider: externalVoice }),
  ...(ttsMode !== "external_http" ? {} : {
    ttsProvider: new ExternalHttpTtsProvider({
      url: process.env.TABIYA_TTS_PROVIDER_URL!,
      ...(process.env.TABIYA_TTS_PROVIDER_KEY === undefined ? {} : { key: process.env.TABIYA_TTS_PROVIDER_KEY }),
      timeoutMs: ttsTimeout,
    }),
  }),
});

// The self-hosted appliance startup/upgrade receipt, including longitudinal reconciliation.
console.info(JSON.stringify({ event: "startup_receipt", ...application.startupReceipt }));

await new Promise<void>((resolve, reject) => {
  application.server.once("error", reject);
  application.server.listen(deployment.listenPort, deployment.listenHost, () => resolve());
});
console.log(`chess-tabiya ${deployment.profile} profile listening on ${deployment.listenHost}:${deployment.listenPort}; public origin ${deployment.publicOrigin} (${engineMode})`);
if (deployment.profile === "local") console.warn("The local profile is single-host HTTP: open it only at its loopback origin. Use appliance or hosted for other devices (docs/deployment.md).");

let closing = false;
async function shutdown(): Promise<void> {
  if (closing) return;
  closing = true;
  try {
    await application.close();
  } finally {
    storageLock.release();
  }
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
