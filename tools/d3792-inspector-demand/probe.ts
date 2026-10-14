// Disposable author evidence. Real authorities/reducers/adapters; no server or UI qualification.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { createRun, commitMove, revealFeedback } from "../../packages/runtime/src/runtime.js";
import { canonicalRunStart } from "../../packages/runtime/src/session.js";
import { compileAssistanceRequest, compileAuthoritativeAssistance, finalizeAssistanceEffects, serverAvailabilityFromProviders, MODULE_SOURCE_AUTHORITY } from "../../packages/runtime/src/assistance-exchange.js";
import { queryModules } from "../../packages/runtime/src/module-query.js";
import { recordedSemanticPath } from "../../packages/runtime/src/recorded-semantic-path.js";
import { evidenceValueReceipt } from "../../packages/runtime/src/evidence-contract.js";
import { ArrayReductionQualityRecorder } from "../../packages/runtime/src/module-reducers.js";
import { parsePresentationReceipt } from "../../packages/runtime/src/presentation-contract.js";
import { RECORDED_SEQUENCE_POSITIVES, RECORDED_SEQUENCE_HARD_NEGATIVES } from "../../packages/runtime/src/testing/recorded-sequence-fixtures.js";

const variant = process.argv[2];
assert(["baseline", "acquired", "derived_family"].includes(variant));
const at = "2026-10-14T00:00:00.000Z";
const availability = serverAvailabilityFromProviders({ opponent: "external", judge: "external", llm: "external", corpus: "external", tts: "external", tablebase: "external" });
const request = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(request, { origin: { kind: "run", sessionKind: "position", feedbackPolicy: "attempt_end" }, access: { deliveryOpen: true, role: "solo", seatedInContest: false, reviewing: false }, availability }), { authority: MODULE_SOURCE_AUTHORITY, availability });
const rows = [];
for (const [emits, cases] of [[true, RECORDED_SEQUENCE_POSITIVES], [false, RECORDED_SEQUENCE_HARD_NEGATIVES]] as const) {
  for (const fixture of cases.filter(row => row.projection !== "derived.exchange.trade_completed")) {
    let run = createRun({ id: `probe-${fixture.projection}`, session: { kind: "position", start: canonicalRunStart({ fen: fixture.fen, side: fixture.fen.split(" ")[1] === "b" ? "black" : "white" }), feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"c".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
    for (const move of fixture.moves) run = commitMove(run, move, { at }).run;
    run = revealFeedback(run, at).run;
    const saved = JSON.stringify(run);
    const expected = recordedSemanticPath(run, run.activeCursor.branchId);
    assert.equal(expected.kind, "available");
    if (expected.kind !== "available") throw new Error("canonical source refused");
    const exact = expected.events.filter(event => event.projection.id === fixture.projection && event.anchor.nodeId === run.activeCursor.nodeId);
    assert.equal(exact.length > 0, emits);
    const recorder = new ArrayReductionQualityRecorder();
    const { page } = queryModules({ run, assistance, role: "learner", session: "position", recorder, request: { timing: "review", nodeId: run.activeCursor.nodeId, requested: ["full_inspector"] } });
    const packet = page.packets.find(packet => packet.module === "full_inspector")!;
    assert(packet);
    parsePresentationReceipt(JSON.parse(JSON.stringify(packet.receipt)));
    for (const [unit, maximum] of Object.entries({ facts: 20, words: 400, marks: 20, arrows: 8 })) {
      assert(packet.budget.after[unit as keyof typeof packet.budget.after] <= maximum,
        `${variant} exceeded the unchanged Inspector ${unit} limit`);
    }
    const shown = packet.receipt.items.filter(item => item.evidenceRef?.projection.id === fixture.projection && item.evidenceRef.projection.version === 2);
    for (const item of shown) assert(exact.some(event => `sha256:${evidenceValueReceipt(event.evidence).payloadDigest}` === item.evidenceRef!.evidenceDigest));
    assert.equal(JSON.stringify(run), saved);
    if (!emits) assert.equal(shown.length, 0);
    if (variant === "derived_family" && emits) assert(shown.length > 0, `${fixture.projection} still cannot be inspected`);
    const quality = recorder.observations.find(row => row.moduleId === "full_inspector")!;
    rows.push({ projection: `${fixture.projection}@2`, emits, shown: new Set(shown.map(item => item.evidenceRef!.evidenceDigest)).size,
      admitted: quality?.admitted ?? null, beforeBackstop: quality?.afterReducers ?? null, backstopDropped: quality?.dropped ?? 0,
      displayed: packet.budget.after, windowBudgetDrops: packet.budget.dropped.filter(row => row.fact.startsWith(`${fixture.projection}@2#`)).map(row => row.exceeded) });
  }
}
const result = { variant, scope: "disposable in-memory candidate; fixed canonical ten-family population; not production, all-domain coverage, demand-driven collection or UI qualification", positives: rows.filter(row => row.emits).length,
  positiveReach: rows.filter(row => row.emits && row.shown > 0).length, falsePositiveReach: rows.filter(row => !row.emits && row.shown > 0).length, rows };
writeFileSync(`.cache/d3792-inspector-demand/${variant}.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ variant, positives: result.positives, positiveReach: result.positiveReach, falsePositiveReach: result.falsePositiveReach }));
