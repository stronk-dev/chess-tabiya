// `make longitudinal-rebuild [WRITE=1]` — the operator comparison/repair instrument
// (rfc/longitudinal-store.md §C, criterion 11). It re-derives every complete current-revision job
// from its immutable owned events with the same registry, prefix projector and row algebra, names
// every missing/surplus/changed row by run and key, and with `--write` repairs them. It is never an
// upgrade prerequisite: startup reconciliation owns job population.
import { projectObservations } from "./longitudinal-projector.js";
import { LongitudinalStore } from "./longitudinal-store.js";
import { fileBackedDatabaseIdentity, openLongitudinalDatabase } from "./longitudinal-worker-config.js";
import { STORAGE_VERSION } from "./storage.js";

const write = process.argv.includes("--write");
const argument = process.argv.indexOf("--database");
const path = argument >= 0 ? process.argv[argument + 1] : process.env.DATABASE_PATH ?? "data/chess-tabiya.sqlite";
const identity = fileBackedDatabaseIdentity(path ?? "");
const database = openLongitudinalDatabase(identity, STORAGE_VERSION);
try {
  const store = new LongitudinalStore(database);
  const project = (image: Parameters<typeof projectObservations>[0]) => projectObservations(image);
  const report = store.rebuild({ write, project });
  const after = write && report.mismatches.length > 0 ? store.rebuild({ write: false, project }) : report;
  console.log(JSON.stringify({ event: "longitudinal_rebuild", database: identity.absolutePath, write, report, ...(after === report ? {} : { after }) }, null, 2));
  if (after.mismatches.length > 0) process.exitCode = 1;
} finally {
  database.close();
}
