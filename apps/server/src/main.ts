import { createApplication, type EngineMode } from "./application.js";
import { cookieSecureFromEnv } from "./config.js";
import { ExternalHttpVoiceProvider } from "./external-voice.js";

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

const port = integer(process.env.PORT, 3000);
const development = process.env.NODE_ENV === "development";
const cookieSecure = cookieSecureFromEnv(process.env.TABIYA_COOKIE_SECURE);
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
if (process.env.DRAFT_PACK_FILE !== undefined && !development) {
  throw new TypeError("DRAFT_PACK_FILE requires NODE_ENV=development");
}
const application = await createApplication({
  development,
  engineMode,
  databasePath: process.env.DATABASE_PATH ?? ":memory:",
  cookieSecure,
  ...(process.env.DRAFT_PACK_FILE === undefined
    ? {}
    : { draftPackFile: process.env.DRAFT_PACK_FILE }),
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
  ...(voiceMode !== "external_http" ? {} : {
    voiceProvider: new ExternalHttpVoiceProvider({
      url: process.env.TABIYA_VOICE_PROVIDER_URL!,
      ...(process.env.TABIYA_VOICE_PROVIDER_KEY === undefined ? {} : { key: process.env.TABIYA_VOICE_PROVIDER_KEY }),
      timeoutMs: voiceTimeout,
    }),
  }),
});

await new Promise<void>((resolve, reject) => {
  application.server.once("error", reject);
  application.server.listen(port, "0.0.0.0", () => resolve());
});
console.log(`chess-tabiya listening on http://0.0.0.0:${port} (${engineMode})`);

let closing = false;
async function shutdown(): Promise<void> {
  if (closing) return;
  closing = true;
  await application.close();
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
