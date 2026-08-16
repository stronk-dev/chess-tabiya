// DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 (2026-08-16). Not production code.
//
// Controls the CET comparison for network and time of day. teardown-cet.md
// measured 80–224 ms per tablebase call on 2026-08-11 from a different machine
// and network; our own tablebase numbers were taken today. This arm hits the
// endpoint CET itself calls (tablebase.lichess.ovh, observed in CET's network
// log) and the one our LichessTablebaseSource calls
// (tablebase.lichess.org/standard) from THIS machine, back to back, on the same
// FENs, so the two per-call figures are comparable.
//
// Usage: node cet-endpoint-arm.mjs <fen-file> [samples]
import { readFile } from "node:fs/promises";

const fens = (await readFile(process.argv[2], "utf8")).split("\n").filter((line) => line.trim() !== "");
const samples = Number(process.argv[3] ?? 40);

function stats(durations) {
  const sorted = [...durations].sort((left, right) => left - right);
  const round = (value) => Math.round(value * 10) / 10;
  return {
    n: sorted.length,
    minMs: round(sorted[0]),
    medianMs: round(sorted[Math.floor(sorted.length / 2)]),
    p95Ms: round(sorted[Math.ceil(sorted.length * 0.95) - 1]),
    maxMs: round(sorted.at(-1)),
  };
}

const report = {};
for (const host of ["tablebase.lichess.ovh", "tablebase.lichess.org"]) {
  const durations = [];
  const failures = [];
  for (const fen of fens.slice(0, samples)) {
    const started = performance.now();
    try {
      const response = await fetch(`https://${host}/standard?fen=${encodeURIComponent(fen)}`, {
        headers: { "user-agent": "chess-tabiya-research/0.0.0 (K9 latency arm; repository-owner)" },
      });
      await response.json();
      if (!response.ok) failures.push(response.status);
      else durations.push(performance.now() - started);
    } catch (error) {
      failures.push(String(error).slice(0, 80));
    }
  }
  report[host] = { ...stats(durations), failures: failures.length };
}
console.log(JSON.stringify(report, null, 2));
