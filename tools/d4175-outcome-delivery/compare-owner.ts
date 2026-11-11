// DISPOSABLE D4224 refactor equality. No source issuer, profiler or production hook.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CANDIDATE_EVENTS_SCOPE, CANDIDATE_READINGS_SCOPE, CANDIDATE_WIDE_SCOPE,
  compileCandidatePopulation, readCandidateCommonSources, readCandidateFoundationSources,
  type CandidatePopulationReceipt, type CandidateWideScope } from "../../packages/runtime/src/candidate-population.js";
import { evidenceValueReceipt, isDeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { completeEquality } from "./source-equality.js";
import { LITERAL_POSITIONS } from "./workload.js";

function graphDigest(value: unknown) {
  const seen = new Set<object>(), receipts: unknown[] = [];
  const walk = (node: unknown): void => {
    if (node === null || typeof node !== "object" || seen.has(node)) return;
    seen.add(node); if (isDeclaredEvidence(node)) receipts.push(evidenceValueReceipt(node));
    Object.values(node).forEach(walk);
  }; walk(value);
  return { digest: createHash("sha256").update(JSON.stringify({ value, receipts })).digest("hex"), receipts: receipts.length };
}
function equality() {
  const literal = LITERAL_POSITIONS.flatMap(position => [CANDIDATE_EVENTS_SCOPE, CANDIDATE_READINGS_SCOPE, CANDIDATE_WIDE_SCOPE].map(scope => {
    const result = compileCandidatePopulation({ beforeFen: position.fen, ruleset: "standard", scope });
    if (result.kind !== "ready") throw Error(JSON.stringify(result));
    const receipt = result.receipt;
    const graph = { receipt, ...(scope.events ? { common: readCandidateCommonSources(receipt) } : {}),
      ...(scope.events && scope.readings ? { foundation: readCandidateFoundationSources(receipt as CandidatePopulationReceipt<CandidateWideScope>) } : {}) };
    return { id: position.id, member: receipt.selectedMember, candidates: receipt.packet.candidates.length, ...graphDigest(graph) };
  }));
  assert.equal(literal.length, 48);
  return { literal, completeReview: completeEquality(false) };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--worker")) process.stdout.write(JSON.stringify(equality()));
  else {
    const run = (arm: string): ReturnType<typeof equality> => JSON.parse(execFileSync(process.execPath,
      [resolve(`.cache/outcome-delivery-cost/owner-${arm}.mjs`), "--worker"], { encoding: "utf8", timeout: 120_000, maxBuffer: 128 * 1024 }));
    const baseline = run("baseline"), candidate = run("candidate");
    assert.deepEqual(candidate, baseline, "Every full graph/input receipt and all thirteen outcome families must match");
    assert.equal(candidate.completeReview.length, 32);
    const text = JSON.stringify({ question: "D4224 private compiler-owner refactor equality", baselineSource: "0e5057d0:candidate-population.ts",
      scope: "Current dependency image; one controlled compiler-file substitution; ordinary fresh workers; all three scopes/16literal roots and32complete same-game source graphs with all13 factories/admission and original repeat inputs",
      limits: "Equality only, no scoped receipt, construction8, cancellation, capacity, latency or memory claim", ...candidate }, null, 2) + "\n";
    assert(Buffer.byteLength(text) < 32 * 1024);
    writeFileSync("planning/foundation-source-identity/owner-refactor-equality-2026-11-11.json", text);
    process.stdout.write("Owner refactor equality passes48scope graphs and32complete review graphs/all13 families.\n");
  }
}
