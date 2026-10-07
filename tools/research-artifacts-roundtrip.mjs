// Opt-in integration proof using the actual retained store, not application CI.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkArtifacts, defaultStore, manifestPath, restoreArtifacts, validateManifest } from "./research-artifacts.mjs";

if (process.argv.length > 3) throw new Error("use [retained artifact store]");
const manifest = validateManifest(JSON.parse(readFileSync(manifestPath)));
const root = mkdtempSync(join(tmpdir(), "tabiya-retained-roundtrip-"));
try {
  const store = process.argv[2] || defaultStore, result = restoreArtifacts(root, manifest, store);
  if (result.restored !== manifest.entries.length) throw new Error("fresh target was not completely restored");
  checkArtifacts(root, manifest, store);
  const repeat = restoreArtifacts(root, manifest, store);
  if (repeat.restored !== 0) throw new Error("repeat restoration changed existing objects");
  console.log(JSON.stringify({ ...result, originalHashesUnchanged: true, repeatRestored: repeat.restored }));
} finally { rmSync(root, { recursive: true, force: true }); }
