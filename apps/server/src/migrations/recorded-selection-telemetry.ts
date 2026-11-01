// Migration31 only. This frozen schema must not follow the application's current run version.
import { isDeepStrictEqual } from "node:util";
import type { DatabaseSync } from "node:sqlite";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readBackReplay, type DrillRunEvent } from "@chess-tabiya/runtime";
import schema from "./drill-run-v019.schema.json";

const ajv = new Ajv2020({ strict: true, allErrors: false });
addFormats(ajv);
const validate = ajv.compile(schema);
type Replay = (events: readonly DrillRunEvent[]) => Readonly<{ run: unknown }>;
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Called inside the storage coordinator's migration transaction. Never repairs event history. */
export function upgradeV018RecordedSelection(database: DatabaseSync, replay: Replay = readBackReplay): void {
  const rows = database.prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.18' ORDER BY id").all();
  const update = database.prepare("UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.19' WHERE id = ?");
  for (const row of rows) {
    if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") throw new TypeError("Migration31: invalid stored run row");
    const snapshot: unknown = JSON.parse(row.snapshot_json);
    if (!object(snapshot) || snapshot.schemaVersion !== "0.18" || snapshot.id !== row.id) throw new TypeError("Migration31: predecessor stamp or identity mismatch");
    const candidate = { ...snapshot, schemaVersion: "0.19" };
    if (!validate(candidate)) throw new TypeError(`Migration31: invalid run snapshot: ${ajv.errorsText(validate.errors)}`);
    const projected = replay(snapshot.events as readonly DrillRunEvent[]).run;
    if (!object(projected)) throw new TypeError("Migration31: invalid replay result");
    // Replay may report a later application version during an old-database upgrade. Only that
    // stamp is normalized; all original non-stamp JSON, including every event, must agree.
    const normalized: unknown = JSON.parse(JSON.stringify({ ...projected, schemaVersion: "0.19" }));
    if (!isDeepStrictEqual(candidate, normalized)) throw new TypeError("Migration31: snapshot disagrees with original-event replay");
    update.run(JSON.stringify(candidate), row.id);
  }
}
