import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceDigest, evidenceValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { attachEvidence } from "./evidence.js";
import { commitMove, fork, rewind } from "./runtime.js";
import { digestRunEvidenceItem, resolveRunSubject } from "./run-subject.js";
import { recordedInspectorAttachment, recordedInspectorRun, recordedInspectorSelection, recordedInspectorSubject, RECORDED_INSPECTOR_AT as at } from "./testing/recorded-inspector-fixture.js";
import type { EvidenceAttachedEvent, EvidenceKind, EvidencePayload } from "./types.js";

const packets = [
  ["eval", "recorded.inspector.eval_packet@1", { centipawns: 31, bestMoveUci: "e2e4" }],
  ["wdl", "recorded.inspector.wdl_packet@1", { win: 300, draw: 600, loss: 100 }],
  ["bestline", "recorded.inspector.pv_packet@1", { pv: ["e2e4", "e7e5"] }],
  ["tablebase", "recorded.inspector.tablebase_packet@1", { category: "cursed-win", dtz: -7, preciseDtz: null, dtm: 15 }],
] as const;
const TB = "recorded.inspector.tablebase_packet@1", CATEGORY = "derived.inspector.tablebase_category@1", DISTANCE = "derived.inspector.tablebase_distance@1", MAIA = "recorded.inspector.maia_selection@1";
function attachment(kind: EvidenceKind, values: EvidencePayload["values"] = {}) {
  return recordedInspectorAttachment({ kind, source: kind === "tablebase" ? "tablebase_exact" : "engine_validated", values });
}

describe("recorded Inspector reports retain exact stored occurrence authority", () => {
  it.each(packets)("retains the complete %s attachment without upgrading its source label", (kind, route, values) => {
    const fixture = attachment(kind, values), value = invokeEvidenceValueRoute(route, { resolved: fixture.resolved, itemDigest: fixture.itemDigest });
    expect(value.payload).toEqual({ subject: fixture.resolved.subject, itemDigest: fixture.itemDigest, event: fixture.event, authority: "recorded_report_only" });
    expect(evidenceValueReceipt(value).sourceDigests).toEqual([]);
    expect(evidenceValueReceipt(value).inputDigest).toBe(evidenceDigest(value.payload));
    expect(Object.isFrozen(value.payload.event.data.payload.values)).toBe(true);
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === value.projection.id)).toMatchObject({ role: "source_record", plane: "record", grounding: "recorded_run", exactness: "measured", confidence: "reported" });
  });

  it.each(packets)("refuses copied subjects, wrong kinds, foreign heads and caller event injection: %s", (kind, route, values) => {
    const fixture = attachment(kind, values), inputs = { resolved: fixture.resolved, itemDigest: fixture.itemDigest };
    for (const resolved of [{ ...fixture.resolved }, JSON.parse(JSON.stringify(fixture.resolved))]) expect(() => invokeEvidenceValueRoute(route, { ...inputs, resolved })).toThrow();
    expect(() => invokeEvidenceValueRoute(route, { ...inputs, event: fixture.event } as never)).toThrow();
    const prefix = resolveRunSubject(fixture.run, { kind: "run_prefix", runId: fixture.run.id, eventHeadDigest: fixture.resolved.subject.eventHeadDigest });
    expect(() => invokeEvidenceValueRoute(route, { ...inputs, resolved: prefix })).toThrow();
    const later = commitMove(fixture.run, "e2e4", { at }).run;
    expect(() => invokeEvidenceValueRoute(route, { resolved: recordedInspectorSubject(later, fixture.run.activeCursor.nodeId), itemDigest: fixture.itemDigest })).toThrow();
    const other = attachment(kind === "eval" ? "wdl" : "eval", values);
    expect(() => invokeEvidenceValueRoute(route, { resolved: other.resolved, itemDigest: other.itemDigest })).toThrow();
    const model = recordedInspectorAttachment({ kind, values, source: "human_model_predicted" });
    expect(() => invokeEvidenceValueRoute(route, { resolved: model.resolved, itemDigest: model.itemDigest })).toThrow();
    const foreign = recordedInspectorAttachment({ kind, values, source: "engine_validated" }, recordedInspectorRun(undefined, "foreign-run"));
    expect(() => invokeEvidenceValueRoute(route, { resolved: foreign.resolved, itemDigest: fixture.itemDigest })).toThrow();
  });

  it.each(packets)("retains historical Black-to-move reports and isolates later caller mutation: %s", (kind, route, values) => {
    const rawValues = structuredClone(values), moved = commitMove(recordedInspectorRun(), "e2e4", { at }).run;
    const fixture = recordedInspectorAttachment({ kind, source: "engine_validated", values: rawValues }, moved);
    const value = invokeEvidenceValueRoute(route, { resolved: fixture.resolved, itemDigest: fixture.itemDigest });
    expect(value.payload.subject.fen.split(" ")[1]).toBe("b");
    const digest = evidenceValueReceipt(value).payloadDigest;
    const later = commitMove(fixture.run, "e7e5", { at }).run;
    expect(later.events.length).toBeGreaterThan(fixture.resolved.headSeq);
    expect(invokeEvidenceValueRoute(route, { resolved: fixture.resolved, itemDigest: fixture.itemDigest }).payload).toEqual(value.payload);
    (rawValues as Record<string, unknown>).unexpected = "caller mutation";
    expect(evidenceValueReceipt(value).payloadDigest).toBe(digest);
    expect(value.payload.event.data.payload.values).not.toHaveProperty("unexpected");
    expect(() => { (value.payload.event.data.payload.values as Record<string, unknown>).unexpected = true; }).toThrow();
  });

  it("retains duplicate reports as separate event occurrences and permits the same inherited node", () => {
    const first = attachment("eval", { centipawns: 31 });
    let run = attachEvidence(first.run, first.run.activeCursor.nodeId, ["synthetic:recorded-report"], first.event.data.payload, at).run;
    const second = run.events.at(-1)! as EvidenceAttachedEvent;
    run = fork(run, run.activeCursor.nodeId, { at, label: "inherited" }).run;
    const originalBranch = recordedInspectorSubject(run, first.run.activeCursor.nodeId, first.run.activeCursor.branchId), inherited = recordedInspectorSubject(run);
    const resolve = (subject: typeof inherited, event: EvidenceAttachedEvent) => invokeEvidenceValueRoute("recorded.inspector.eval_packet@1", {
      resolved: subject, itemDigest: digestRunEvidenceItem({ runId: run.id, eventHeadDigest: subject.subject.eventHeadDigest, eventSeq: event.seq, event }) });
    const left = resolve(originalBranch, first.event), right = resolve(originalBranch, second), shared = resolve(inherited, first.event);
    expect(left.payload.event.data.payload).toEqual(right.payload.event.data.payload);
    expect(left.payload.itemDigest).not.toBe(right.payload.itemDigest);
    expect(evidenceValueReceipt(left).payloadDigest).not.toBe(evidenceValueReceipt(right).payloadDigest);
    expect(shared.payload.event).toEqual(left.payload.event);
    expect(shared.payload.subject).not.toEqual(left.payload.subject);
  });

  it("refuses another equal-FEN node's attachment and altered complete event envelopes", () => {
    const initial = recordedInspectorRun(), played = commitMove(initial, "e2e4", { at }).run;
    const first = recordedInspectorAttachment({ kind: "eval", source: "engine_validated", values: {} }, played);
    const branched = fork(rewind(first.run, initial.activeCursor.nodeId, at).run, initial.activeCursor.nodeId, { at, label: "equal position" }).run;
    const repeated = commitMove(branched, "e2e4", { at }).run, resolved = recordedInspectorSubject(repeated);
    const itemDigest = digestRunEvidenceItem({ runId: repeated.id, eventHeadDigest: resolved.subject.eventHeadDigest, eventSeq: first.event.seq, event: first.event });
    expect(resolved.subject.kind === "run_node" && resolved.subject.fen).toBe(first.resolved.subject.kind === "run_node" && first.resolved.subject.fen);
    expect(() => invokeEvidenceValueRoute("recorded.inspector.eval_packet@1", { resolved, itemDigest })).toThrow();
    for (const event of [{ ...first.event, at: "2026-10-16T00:01:00.000Z" }, { ...first.event, data: { ...first.event.data, evidenceRefs: ["changed"] } }]) {
      const altered = digestRunEvidenceItem({ runId: repeated.id, eventHeadDigest: resolved.subject.eventHeadDigest, eventSeq: event.seq, event });
      expect(() => invokeEvidenceValueRoute("recorded.inspector.eval_packet@1", { resolved, itemDigest: altered })).toThrow();
    }
  });

  it.each([
    [{}, { kind: "not_recorded" }], [{ category: "unknown" }, { kind: "reported", value: "unknown" }],
    [{ category: "draw" }, { kind: "reported", value: "draw" }], [{ category: "made-up" }, { kind: "uninterpretable" }],
    [{ category: null }, { kind: "uninterpretable" }],
  ])("category view retains reported/absent/uninterpretable distinctions: %j", (values, expected) => {
    const fixture = attachment("tablebase", values), record = invokeEvidenceValueRoute(TB, { resolved: fixture.resolved, itemDigest: fixture.itemDigest });
    const result = invokeEvidenceValueRoute(CATEGORY, { record });
    expect(result.payload).toEqual({ record: record.payload, category: expected });
    expect(evidenceValueReceipt(result).sourceDigests).toEqual([evidenceValueReceipt(record).payloadDigest]);
  });

  it.each([[-7, { kind: "reported", value: -7 }], [0, { kind: "reported", value: 0 }], [null, { kind: "reported", value: null }],
    [1.5, { kind: "uninterpretable" }], ["4", { kind: "uninterpretable" }], [Number.MAX_SAFE_INTEGER + 1, { kind: "uninterpretable" }]])("distance view preserves signs/null and refuses noninteger interpretation: %j", (distance, expected) => {
    const fixture = attachment("tablebase", { category: "blessed-loss", dtz: distance, preciseDtz: distance, dtm: distance });
    const record = invokeEvidenceValueRoute(TB, { resolved: fixture.resolved, itemDigest: fixture.itemDigest }), value = invokeEvidenceValueRoute(DISTANCE, { record });
    expect(value.payload).toEqual({ record: record.payload, category: { kind: "reported", value: "blessed-loss" }, dtz: expected, preciseDtz: expected, dtm: expected });
  });

  it("does not manufacture missing distances or allow raw/copied/wrong-kind records and caller field paths", () => {
    const fixture = attachment("tablebase"), record = invokeEvidenceValueRoute(TB, { resolved: fixture.resolved, itemDigest: fixture.itemDigest });
    expect(invokeEvidenceValueRoute(DISTANCE, { record }).payload).toMatchObject({ dtz: { kind: "not_recorded" }, preciseDtz: { kind: "not_recorded" }, dtm: { kind: "not_recorded" } });
    const evalFixture = attachment("eval"), wrong = invokeEvidenceValueRoute("recorded.inspector.eval_packet@1", { resolved: evalFixture.resolved, itemDigest: evalFixture.itemDigest });
    for (const input of [record.payload, { ...record }, JSON.parse(JSON.stringify(record)), wrong]) {
      expect(() => invokeEvidenceValueRoute(CATEGORY, { record: input })).toThrow();
      expect(() => invokeEvidenceValueRoute(DISTANCE, { record: input })).toThrow();
    }
    expect(() => invokeEvidenceValueRoute(DISTANCE, { record, path: "values.dtz" } as never)).toThrow();
  });

  it("selection retains its entire report and stored requested band, not a calibrated strength claim", () => {
    const fixture = recordedInspectorSelection(), result = invokeEvidenceValueRoute(MAIA, { resolved: fixture.resolved, eventSeq: fixture.eventSeq });
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw new Error("expected recorded candidates");
    expect(result.value.payload).toEqual({ subject: fixture.resolved.subject, event: fixture.event, requestedTargetElo: 1450, authority: "recorded_report_only" });
    expect(evidenceValueReceipt(result.value).inputDigest).toBe(evidenceDigest(result.value.payload));
    expect(evidenceValueReceipt(result.value).sourceDigests).toEqual([]);
  });

  it("selection preserves source absence and absent requested band; D3870 holds the unreachable empty-array arm", () => {
    // The actual canonical source boundary refuses this before any factory. Do not forge a seal
    // or turn this negative into proof that the accepted successful-empty arm is implemented.
    expect(() => recordedInspectorSelection([])).toThrow(/fewer than 1 items/u);
    const existing = recordedInspectorSelection([{ moveUci: "e2e4", rank: 1 }], recordedInspectorRun()), result = invokeEvidenceValueRoute(MAIA, { resolved: existing.resolved, eventSeq: existing.eventSeq });
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw new Error("expected recorded data");
    expect(result.value.payload.requestedTargetElo).toBeNull();
    expect(result.value.payload.event.data.selection.candidates).toEqual([{ moveUci: "e2e4", rank: 1 }]);
    // Omit the optional field rather than inserting non-JSON undefined into an event image.
    const events = existing.run.events.map(event => {
      if (event.type !== "opponent.move_selected") return event;
      const { candidates: _candidates, ...selection } = event.data.selection;
      return { ...event, data: { ...event.data, selection } };
    });
    const run = { ...existing.run, events };
    expect(invokeEvidenceValueRoute(MAIA, { resolved: recordedInspectorSubject(run), eventSeq: existing.eventSeq })).toEqual({ kind: "unavailable", reason: "source_absent" });
  });

  it("selection refuses copied scope, invalid sequence, wrong node/branch/mode and caller overrides", () => {
    const fixture = recordedInspectorSelection();
    for (const eventSeq of [0, -1, 1.5, NaN, fixture.eventSeq + 1, 1]) expect(() => invokeEvidenceValueRoute(MAIA, { resolved: fixture.resolved, eventSeq })).toThrow();
    expect(() => invokeEvidenceValueRoute(MAIA, { resolved: { ...fixture.resolved }, eventSeq: fixture.eventSeq })).toThrow();
    expect(() => invokeEvidenceValueRoute(MAIA, { resolved: fixture.resolved, eventSeq: fixture.eventSeq, requestedTargetElo: 3000 } as never)).toThrow();
    const later = commitMove(fixture.run, "e2e4", { at }).run;
    expect(() => invokeEvidenceValueRoute(MAIA, { resolved: recordedInspectorSubject(later), eventSeq: fixture.eventSeq })).toThrow();
    for (const change of ["branch", "mode"] as const) {
      const run = { ...fixture.run, events: fixture.run.events.map(event => event.type === "opponent.move_selected" ? { ...event,
        data: { ...event.data, ...(change === "branch" ? { branchId: "foreign-branch" } : { selection: { ...event.data.selection, policyModeApplied: "strong_engine" as const } }) } } : event) };
      const resolved = recordedInspectorSubject(run);
      expect(() => invokeEvidenceValueRoute(MAIA, { resolved, eventSeq: fixture.eventSeq })).toThrow();
    }
  });

  it("keeps requested-band context, equal selections at different seqs and valid sibling origin distinct", () => {
    const first = recordedInspectorSelection(), second = recordedInspectorSelection(first.event.type === "opponent.move_selected" ? first.event.data.selection.candidates : [], first.run);
    const left = invokeEvidenceValueRoute(MAIA, { resolved: second.resolved, eventSeq: first.eventSeq }), right = invokeEvidenceValueRoute(MAIA, { resolved: second.resolved, eventSeq: second.eventSeq });
    if (left.kind !== "available" || right.kind !== "available") throw new Error("fixture must contain candidates");
    expect(left.value.payload.event.data.selection).toEqual(right.value.payload.event.data.selection);
    expect(evidenceValueReceipt(left.value).payloadDigest).not.toBe(evidenceValueReceipt(right.value).payloadDigest);
    const sibling = fork(second.run, second.run.activeCursor.nodeId, { at, label: "sibling origin" }).run;
    const wrongGrant = recordedInspectorSubject(sibling);
    expect(() => invokeEvidenceValueRoute(MAIA, { resolved: wrongGrant, eventSeq: first.eventSeq })).toThrow();
    const ownOrigin = recordedInspectorSubject(sibling, second.run.activeCursor.nodeId, second.run.activeCursor.branchId);
    expect(invokeEvidenceValueRoute(MAIA, { resolved: ownOrigin, eventSeq: first.eventSeq }).kind).toBe("available");
    const differentBand = recordedInspectorSelection(undefined, recordedInspectorRun(1800)), band = invokeEvidenceValueRoute(MAIA, { resolved: differentBand.resolved, eventSeq: differentBand.eventSeq });
    if (band.kind !== "available") throw new Error("fixture must contain candidates");
    expect(band.value.payload.event.data.selection).toEqual(left.value.payload.event.data.selection);
    expect(band.value.payload.requestedTargetElo).toBe(1800);
    expect(evidenceValueReceipt(band.value).inputDigest).not.toBe(evidenceValueReceipt(left.value).inputDigest);
  });

  it("does not bind internal historical reports as live engine, grade, packet or learner evidence", () => {
    const sources = ["recorded.inspector.eval_packet", "recorded.inspector.wdl_packet", "recorded.inspector.pv_packet", "recorded.inspector.tablebase_packet", "recorded.inspector.maia_selection", "derived.inspector.tablebase_category", "derived.inspector.tablebase_distance"];
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.filter(row => sources.includes(row.id))).toHaveLength(7);
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter(row => sources.includes(row.projection.id))).toEqual([]);
    for (const id of sources) expect(PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === id)).toMatchObject({ grounding: "recorded_run", exactness: "measured", confidence: "reported", disposition: { kind: "experimental" } });
    for (const id of ["derived.inspector.tablebase_category", "derived.inspector.tablebase_distance"]) expect(PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === id)!.derivation).toEqual({ inputs: [{ id: "recorded.inspector.tablebase_packet", version: 1 }] });
  });
});
