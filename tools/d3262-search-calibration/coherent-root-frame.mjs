// Disposable D3262/D3289 corrected candidate population. It selects search
// questions from declared sources, not good moves or semantic explanations.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { manifestIdentity, manifestRows } from "./manifest.mjs";
import { validateMaiaCapture } from "./maia-capture-check.mjs";
import { rowFrame } from "./root-frame.mjs";
import { validateCoherentRecapture } from "./stockfish-coherent-recapture-check.mjs";

const directory = "planning/semantic-consequence-search";
const engineName = "d3262-stockfish-root-coherent-all.json";
const maiaName = "d3262-maia-capture.json";
const baselineName = "d3262-root-frame.json";
const oldEngineName = "d3262-stockfish-capture.json";
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }

export function compileCoherentRootFrame(engine, maia, baseline, digests) {
  check(engine.manifest === manifestIdentity.manifestDigest && maia.manifest === engine.manifest
    && baseline.manifest === engine.manifest && engine.rows.length === 66 && maia.rows.length === 66
    && baseline.roots.length === 66, "Crossed coherent candidate sources");
  const roots = manifestRows.map((root, index) => {
    check(engine.rows[index].rootId === root.id && engine.rows[index].fen === root.fen
      && baseline.roots[index].rootId === root.id, `Crossed coherent root ${index}`);
    return rowFrame(root, engine.rows[index], maia.rows[index]);
  });
  let added = 0, dropped = 0, rootsChanged = 0;
  for (let index = 0; index < roots.length; index += 1) {
    const current = new Set(roots[index].candidates.map((candidate) => candidate.moveUci));
    const prior = new Set(baseline.roots[index].candidates.map((candidate) => candidate.moveUci));
    const newCount = [...current].filter((uci) => !prior.has(uci)).length;
    const lostCount = [...prior].filter((uci) => !current.has(uci)).length;
    added += newCount; dropped += lostCount;
    rootsChanged += Number(newCount > 0 || lostCount > 0);
  }
  const candidates = roots.reduce((sum, root) => sum + root.candidates.length, 0);
  check(candidates === 193 && added === 3 && dropped === 6 && rootsChanged === 7,
    `Corrected candidate population drifted: ${candidates}, +${added}/-${dropped}, ${rootsChanged} roots`);
  for (const root of manifestRows.filter((row) => row.id.startsWith("tactical:") || row.id.startsWith("pressure:") || row.id.startsWith("quiet-plan:"))) {
    check(roots.find((item) => item.rootId === root.id)?.candidates.some((candidate) => candidate.moveUci === root.candidateUci),
      `Lost declared control ${root.id}`);
  }
  return { version: 1, profile: "d3262-coherent-root-v1", manifest: engine.manifest,
    authority: "coherent_root_candidate_population_not_move_grade", inputDigests: digests,
    comparison: { oldCandidates: 196, candidates, rootsChanged, added, dropped }, roots };
}

if (process.argv[1]?.endsWith("coherent-root-frame.mjs")) {
  const names = [engineName, maiaName, baselineName, oldEngineName];
  const bytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const [engine, maia, baseline, oldEngine] = bytes.map((value) => JSON.parse(value));
  check(sha(bytes[0]) === "sha256:790049cff06992eae6c48f7057d0b794c4388e503f2d76a59dfe64ce8dbe7c49"
    && sha(bytes[1]) === "sha256:0600008bbe017e05135bd6b5162113e7d8553a0b5597a837888ab3a219e41363",
  "Preregistered coherent-root provider digests changed");
  validateCoherentRecapture(engine, manifestRows.map((root) => ({ rootId: root.id, fen: root.fen })), oldEngine, "root-all");
  validateMaiaCapture(maia, oldEngine);
  const artifact = compileCoherentRootFrame(engine, maia, baseline,
    Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])));
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-root-frame.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Corrected candidate frame differs from preregistered sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(output), ...artifact.comparison }, null, 2)}\n`);
}
