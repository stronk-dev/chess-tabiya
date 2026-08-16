// DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 (2026-08-16).
// Not production code. It exists only to boot the shipped application with a
// stated configuration so latency can be measured under each arm. It mirrors
// apps/server/src/main.ts, minus the voice/TTS wiring, plus one switch:
// K9_REAL_TABLEBASE=1 injects the shipped LichessTablebaseSource so
// perfect_tablebase reaches the real Syzygy endpoint rather than the empty
// FixtureTablebaseSource that ENGINE_MODE=mock installs by default.
import { createApplication, type EngineMode } from "../../apps/server/src/application.js";
import { LichessTablebaseSource } from "../../apps/server/src/tablebase.js";

const port = Number(process.env.PORT ?? 4180);
const engineMode = (process.env.ENGINE_MODE ?? "mock") as EngineMode;
const development = process.env.NODE_ENV === "development";

const application = await createApplication({
  development,
  engineMode,
  databasePath: process.env.DATABASE_PATH ?? ":memory:",
  cookieSecure: false,
  staticDirectory: process.env.STATIC_DIRECTORY ?? "apps/web/dist",
  ...(process.env.K9_REAL_TABLEBASE === "1"
    ? { tablebaseSource: new LichessTablebaseSource() }
    : {}),
});

await new Promise<void>((resolve, reject) => {
  application.server.once("error", reject);
  application.server.listen(port, "127.0.0.1", () => resolve());
});
console.log(
  `k9 harness listening on http://127.0.0.1:${port} (engineMode=${engineMode}, development=${development}, realTablebase=${process.env.K9_REAL_TABLEBASE === "1"})`,
);

process.once("SIGINT", () => void application.close().then(() => process.exit(0)));
process.once("SIGTERM", () => void application.close().then(() => process.exit(0)));
