// Synthetic protocol adversary only; never live/model evidence.
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { expectedMaiaReady } from "./cost-maia.mjs";
import { fenOf, replay } from "./cost-stockfish.mjs";
import { legalMoves } from "./exact-reply-enumeration.mjs";

export function syntheticMaiaPayload(operands) {
  const pos = replay(operands.rootFen, operands.historyUci), legal = legalMoves(pos).map(x => x.uci);
  const logits = legal.map((_, i) => -i / 2);
  const softmax = xs => { const weights = xs.map(Math.exp), total = weights.reduce((a, b) => a + b, 0); return weights.map(x => x / total); };
  const raw = softmax(logits), scaled = softmax(logits.map(x => x / operands.temperature));
  let cumulative = 0;
  const samplerOrder = legal.map((legalUci, index) => {
    cumulative += scaled[index];
    return { legalUci, index, mass: scaled[index], cumulativeMass: cumulative, kept: index === 0 || cumulative <= operands.topP };
  });
  const kept = samplerOrder.filter(x => x.kept), total = kept.reduce((a, b) => a + b.mass, 0);
  return { version: 1, operands, fen: fenOf(pos), historyFrames: operands.historyUci.length + 1,
    tokens: [1, ...operands.historyUci.map((_, i) => i + 2)], vocabularySize: 1000,
    rawFullLegal: legal.map((legalUci, index) => ({ legalUci, index, logit: logits[index], mass: raw[index] })),
    samplerOrder, configuredSupport: kept.map(x => ({ legalUci: x.legalUci, mass: x.mass / total })),
    authority: "configured_model_policy_not_human_frequency_or_move_reason" };
}
export const syntheticMaiaLine = (q, id = 1) => JSON.stringify({ kind: "result", id, payload: syntheticMaiaPayload(q) });

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] ?? "normal", ready = { ...expectedMaiaReady(), torchVersion: "synthetic", pythonVersion: "synthetic" };
  if (mode === "bad-ready") ready.modelCheckpointSha256 = "sha256:" + "0".repeat(64);
  if (mode === "extra-ready") ready.unlicensedSource = "other model";
  if (mode !== "no-ready") process.stdout.write(`${JSON.stringify(ready)}\n`);
  createInterface({ input: process.stdin }).on("line", line => {
    const request = JSON.parse(line);
    if (request.kind === "quit") process.exit(0);
    if (mode === "no-response" || mode === "no-ready") return;
    if (mode === "exit") process.exit(3);
    if (mode === "partial") { process.stdout.write('{"kind":'); return; }
    if (mode === "malformed") { process.stdout.write('not-json\n'); return; }
    if (mode === "oversize") { process.stdout.write("x".repeat(1024 * 1024 + 1)); return; }
    if (mode === "failure") { process.stdout.write(`${JSON.stringify({ kind: "failure", id: request.id, state: "invalid", message: "synthetic refusal" })}\n`); return; }
    const result = JSON.parse(syntheticMaiaLine(request.operands, mode === "wrong-id" ? request.id + 1 : request.id));
    if (mode === "bad-payload") result.payload.fen = "not a position";
    process.stdout.write(`${JSON.stringify(result)}\n`);
  });
}
