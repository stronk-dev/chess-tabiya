// Prevalence/cost census for rfc/shared-candidate-evidence-packet.md §5.3. Governance instrument, not
// production and not schema: the closure is the generated code-derived map; this reports how often
// each member fires on a fixed sample and what compiling the sample cost.
import { readFileSync } from "node:fs";

import { CANDIDATE_WIDE_SCOPE, LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS, LOCAL_CANDIDATE_READING_PROJECTION_KEYS, compileCandidatePopulation } from "../../packages/runtime/src/candidate-population.ts";

const DEFAULT_POSITIONS = [
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "r2q1rk1/pp2bppp/2n1bn2/2pp4/3P4/2N1PN2/PP2BPPP/R1BQ1RK1 w - - 0 10",
  "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
  "4k3/P7/8/8/8/8/8/4K3 w - - 0 1",
  "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1",
  "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1",
];

export function runCandidateClosureCensus(positions: readonly string[]) {
  const closure = [...LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS, ...LOCAL_CANDIDATE_READING_PROJECTION_KEYS];
  const rowsWith = new Map<string, number>(closure.map((key) => [key, 0]));
  const timings: number[] = [];
  let rows = 0;
  let abstainingRows = 0;
  for (const fen of positions) {
    const started = performance.now();
    const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    timings.push(performance.now() - started);
    if (result.kind !== "ready") throw new TypeError(`census position did not compile: ${fen}: ${result.error.code}`);
    for (const row of result.receipt.packet.candidates) {
      rows += 1;
      if (row.abstentions.length > 0) abstainingRows += 1;
      const keys = new Set([...row.events, ...row.readings].map((value) => `${value.projection.id}@${value.projection.version}`));
      for (const key of keys) {
        if (!rowsWith.has(key)) throw new TypeError(`census observed a projection outside the closure: ${key}`);
        rowsWith.set(key, rowsWith.get(key)! + 1);
      }
    }
  }
  const observed = [...rowsWith].filter(([, count]) => count > 0).map(([key]) => key);
  const sorted = [...timings].sort((left, right) => left - right);
  return {
    positions: positions.length,
    rows,
    abstainingRows,
    closure: closure.length,
    observed: observed.length,
    neverObserved: [...rowsWith].filter(([, count]) => count === 0).map(([key]) => key).sort(),
    prevalence: Object.fromEntries([...rowsWith].sort(([left], [right]) => left.localeCompare(right)).map(([key, count]) => [key, rows === 0 ? 0 : Number((count / rows).toFixed(4))])),
    compileMs: { p50: sorted[Math.floor((sorted.length - 1) / 2)] ?? 0, max: sorted.at(-1) ?? 0 },
    note: "Prevalence on a fixed sample. A never-observed member is still in the closure (D1574): sampling is not schema.",
  };
}

const file = process.argv[2];
const positions = file === undefined ? DEFAULT_POSITIONS : readFileSync(file, "utf8").split("\n").map((line) => line.trim()).filter((line) => line !== "" && !line.startsWith("#"));
console.log(JSON.stringify(runCandidateClosureCensus(positions), null, 2));
