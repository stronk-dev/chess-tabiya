// `make longitudinal-worker-once` — the operator door (rfc/longitudinal-store.md §C). It opens the
// same canonical database with the same worker dependencies, claims at most one bounded batch, waits
// for those claims, prints the closed receipt and exits nonzero on a failed projection. It is not
// `longitudinal-rebuild`: once drains live queued work; rebuild compares/repairs durable projections.
import { LongitudinalStore } from "./longitudinal-store.js";
import { runLongitudinalBatch } from "./longitudinal-worker-core.js";
import {
  LONGITUDINAL_WORKER_DEFAULTS,
  fileBackedDatabaseIdentity,
  openLongitudinalDatabase,
} from "./longitudinal-worker-config.js";
import { STORAGE_VERSION } from "./storage.js";

const argument = process.argv.indexOf("--database");
const path = argument >= 0 ? process.argv[argument + 1] : process.env.DATABASE_PATH ?? "data/chess-tabiya.sqlite";
const identity = fileBackedDatabaseIdentity(path ?? "");
const database = openLongitudinalDatabase(identity, STORAGE_VERSION);
try {
  const receipt = runLongitudinalBatch(new LongitudinalStore(database), LONGITUDINAL_WORKER_DEFAULTS, `longitudinal-once-${process.pid}`);
  console.log(JSON.stringify({ event: "longitudinal_worker_once", database: identity.absolutePath, ...receipt }));
  if (receipt.failed > 0) process.exitCode = 1;
} finally {
  database.close();
}
