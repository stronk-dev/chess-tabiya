// Disposable exact-history live source control, not a traversal/cost population.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createCostMaia, maiaPins, parseMaiaReceipt } from "./cost-maia.mjs";
import { sha } from "./cost-contract.mjs";
import { CostDependencies } from "./cost-stockfish.mjs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const referenceName = "planning/semantic-consequence-search/d3262-maia-history-replay.json";
const rootFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const histories = [["g1f3", "g8f6", "b1c3", "b8c6"], ["b1c3", "b8c6", "g1f3", "g8f6"]];
const check = (v, m) => { if (!v) throw new Error(m); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function checkMaiaProbe(value) {
  check(value.version === 1 && value.question === "D3262"
    && value.authority === "disposable_source_control_not_cost_population_or_human_frequency"
    && value.actualTraversalMeasured === false && value.productionProfileSelected === false, "False source-control scope");
  const ready = JSON.parse(value.readyLiteral);
  check(same(ready, value.ready) && Object.entries(maiaPins).every(([k, v]) => ready[k] === v), "Changed pinned source readiness");
  check(value.sourceDigest === sha(JSON.stringify({ imageId: value.imageId, ready, selfElo: 1400, opponentElo: 1400,
    temperature: 0.8, topP: 0.92, preRootHistory: "unavailable_not_invented" })), "Crossed composite source");
  check(value.controlSource.name === referenceName && value.controlSource.digest === sha(readFileSync(referenceName)), "Crossed frozen control");
  const control = JSON.parse(readFileSync(referenceName)).rows[0];
  check(value.receipts.length === 3, "Missing source controls");
  for (const receipt of value.receipts) {
    check(receipt.operands.sourceDigest === value.sourceDigest && same(parseMaiaReceipt(receipt.operands, receipt.lines), receipt.result), "Changed literal receipt");
    check(Number.isFinite(receipt.started) && Number.isFinite(receipt.ended) && receipt.started <= receipt.ended, "Invalid source clock");
  }
  const first = value.receipts[0];
  check(first.operands.rootFen === control.rootFen && same(first.operands.historyUci, [control.candidateUci]), "Wrong frozen control");
  for (const field of ["rawFullLegal", "configuredSupport"]) {
    const seen = first.result[field];
    check(same(seen.map(x => x.legalUci), control[field].map(x => x.legalUci))
      && seen.every((x, i) => Math.abs(x.mass - control[field][i].mass) <= 1e-6), `Frozen control differs: ${field}`);
  }
  for (const [index, history] of histories.entries()) check(value.receipts[index + 1].operands.rootFen === rootFen
    && same(value.receipts[index + 1].operands.historyUci, history), "Missing actual ordered transposition control");
  check(value.receipts[1].result.fen === value.receipts[2].result.fen
    && !same(value.receipts[1].result.tokens, value.receipts[2].result.tokens), "Transposition history collapsed");
  check([value.cold, value.warm, value.offline].every(x => x.length === 1), "Filtered source regime controls");
  const [cold, warm, offline] = [value.cold[0], value.warm[0], value.offline[0]];
  check(cold.state === "executed" && warm.state === "cached" && offline.state === "unavailable"
    && cold.receiptDigest === sha(JSON.stringify(first)) && warm.receiptDigest === cold.receiptDigest
    && offline.receiptDigest === null && [cold, warm, offline].every(x => same(x.operands, first.operands)
      && Number.isFinite(x.elapsedMs) && x.elapsedMs >= 0), "False source regime/receipt/cache joins");
  return { receipts: 3, legalMoves: value.receipts.reduce((n, x) => n + x.result.rawFullLegal.length, 0), actualTraversalMeasured: false };
}

export async function probeMaiaSource(out) {
  if (!out || existsSync(out)) throw new Error("Explicit new immutable output required");
  // Check before costly execution; wx also refuses a racing writer.
  const source = createCostMaia();
  try {
    await source.initialize();
    const controlName = referenceName;
    const bytes = readFileSync(controlName), control = JSON.parse(bytes).rows[0];
    const base = { provider: "maia", sourceDigest: source.sourceDigest, selfElo: 1400, opponentElo: 1400, temperature: 0.8, topP: 0.92 };
    const q = { ...base, rootFen: control.rootFen, historyUci: [control.candidateUci] };
    const cold = new CostDependencies(source, "cold");
    const actual = await cold.query(q);
    if (actual.state !== "executed") throw new Error(`Live control refused: ${JSON.stringify(cold.raw)}`);
    for (const field of ["rawFullLegal", "configuredSupport"]) {
      const seen = actual.result[field];
      if (JSON.stringify(seen.map(x => x.legalUci)) !== JSON.stringify(control[field].map(x => x.legalUci))
        || seen.some((x, i) => Math.abs(x.mass - control[field][i].mass) > 1e-6)) throw new Error(`Frozen ordered-history control differs: ${field}`);
    }
    const warm = new CostDependencies(source, "warm", cold.cache); await warm.query(q);
    const offline = new CostDependencies(source, "provider_offline"); await offline.query(q);
    const transpositions = [];
    for (const historyUci of histories) transpositions.push(await source.execute({ ...base, rootFen, historyUci }));
    if (transpositions[0].result.fen !== transpositions[1].result.fen
      || JSON.stringify(transpositions[0].result.tokens) === JSON.stringify(transpositions[1].result.tokens))
      throw new Error("Transposition control failed to retain distinct actual model history tokens");
    const receipts = [...cold.raw.filter(x => x.receipt).map(x => x.receipt), ...transpositions];
    receipts.forEach(x => parseMaiaReceipt(x.operands, x.lines));
    const artifact = { version: 1, question: "D3262", authority: "disposable_source_control_not_cost_population_or_human_frequency",
      createdAt: new Date().toISOString(), imageId: source.imageId, ready: source.ready, readyLiteral: source.readyLiteral,
      sourceDigest: source.sourceDigest, startupMs: source.startupMs, controlSource: { name: controlName, digest: sha(bytes) },
      receipts, cold: cold.ledger, warm: warm.ledger, offline: offline.ledger,
      productionProfileSelected: false, actualTraversalMeasured: false };
    checkMaiaProbe(artifact);
    writeFileSync(out, `${JSON.stringify(artifact, null, 2)}\n`, { flag: "wx" });
    return { out, digest: sha(readFileSync(out)), receipts: receipts.length, modelHistoryDistinct: true };
  } finally { await source.close(); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || !["--out", "--check"].includes(args[0])) throw new Error("Use --out <new file> or --check <capture>");
  process.stdout.write(`${JSON.stringify(args[0] === "--check" ? checkMaiaProbe(JSON.parse(readFileSync(args[1]))) : await probeMaiaSource(args[1]))}\n`);
}
