import { describe, expect, it } from "vitest";
import { declareEvidence, evidenceForConsumer, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { collectFoundationAdvanceSource, collectFoundationSnapshotSource, type FoundationSnapshotSourceRef } from "./foundation-snapshot-source.js";
import { FOUNDATION_DETAIL_CONTEXTS, foundationDetailMembers, type FoundationDetailKind, type FoundationDetailMember } from "./foundation-snapshot-detail.js";
import { FOUNDATION_SNAPSHOT_SCHEMAS } from "./foundation-snapshot-presentation.js";
import { INSPECTOR_DETAIL_SOURCES, parseInspectorDetailPayload, renderInspectorDetail, inspectorDetailSquares, type InspectorDetailPayload, type InspectorDetailOccurrence } from "./inspector-detail.js";
import { collectInspectorDetailSource } from "./inspector-detail-source.js";
import { presentEvidenceItems, parsePresentationReceipt, serializePresentedEvidence } from "./presentation-contract.js";
import { modulePresentationBundleCost } from "./module-query.js";
import type { LegalExchangeBranch, LegalExchangeStep } from "./exchange.js";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "./position-cache.js";
const kinds = Object.keys(FOUNDATION_DETAIL_CONTEXTS) as FoundationDetailKind[];
const pawnFen = "1r5k/8/8/p1p5/8/1P6/2P5/7K w - - 0 1";
const emptyFen = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
const geometryFen = "7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1";
const advance = (fen = "1r5k/8/8/p1p5/8/1P6/8/1R5K w - - 0 1", uci = "b3b4") => {
  const before = positionFromFen(fen), beforeFen = canonicalFen(before), move = normalizeMove(before, parseUci(uci)!); before.play(move);
  return collectFoundationAdvanceSource({ beforeFen, moveUci: uci, afterFen: canonicalFen(before) })[0]!;
};
function source(kind: FoundationDetailKind, fen = kind === "outpost_candidates" || kind === "occupied_outposts" ? geometryFen : pawnFen) {
  return kind === "backward_pawn_advance" ? advance() : collectFoundationSnapshotSource(INSPECTOR_DETAIL_SOURCES[kind] as FoundationSnapshotSourceRef, fen)[0]!;
}
function pages(kind: FoundationDetailKind, original: DeclaredEvidence<unknown>) {
  const all: InspectorDetailPayload[] = [];
  let start = 0;
  for (;;) {
    const evidence = collectInspectorDetailSource(original, `derived.inspector.detail.${kind}@1`, { kind: "whole" }, start);
    const payload = parseInspectorDetailPayload(kind, evidence.payload);
    expect(payload.range.start).toBe(start); expect(payload.members.length).toBeLessThanOrEqual(8);
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [evidence]));
    expect(items).toHaveLength(1); expect(inspectorDetailSquares(payload)).toEqual([]);
    expect(modulePresentationBundleCost(items).words).toBeLessThanOrEqual(400);
    expect(parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))))).toEqual(items);
    expect(renderInspectorDetail(payload)).not.toMatch(/rules\.|derived\.|future_file|undefined|NaN|\{"/);
    all.push(payload);
    if (payload.range.next === null) return all;
    expect(payload.range.next).toBeGreaterThan(start); start = payload.range.next;
  }
}
function reseal(original: DeclaredEvidence<unknown>) {
  const r = evidenceValueReceipt(original);
  return declareEvidence(original.producer, original.projection, original.payload, { factory: r.factory, inputDigest: r.inputDigest, sourceDigests: r.sourceDigests, ...(r.convention === undefined ? {} : { convention: r.convention }) });
}

describe("current complete foundation source details", () => {
  it.each(kinds)("%s delivers every original expanded member through its exact factory/consumer/receiver", kind => {
    const original = source(kind), before = JSON.stringify(original);
    const expected = foundationDetailMembers(kind, original.payload as never), actual = pages(kind, original);
    const members = actual.flatMap<InspectorDetailOccurrence>(p => p.members);
    expect(members.map(({ ordinal: _o, sourceOrdinal: _s, ...member }) => member)).toEqual(expected.members);
    expect(members.map(row => row.sourceOrdinal)).toEqual(expected.members.map((_, i) => i));
    expect(actual.every(p => p.fullSourceTotal === members.length && p.range.total === members.length)).toBe(true);
    expect(actual.every(p => JSON.stringify(p.context) === JSON.stringify(expected.context))).toBe(true);
    const values = <K extends FoundationDetailMember["kind"]>(k: K) => members.filter(m => m.kind === k).map(m => m.value);
    const context = expected.context as { readonly fen?: string; readonly basis?: "future_file" };
    const reconstructed = kind === "backward_pawns" ? { fen: context.fen, pawnDomain: values("foundation_pawn_domain"), pawns: values("foundation_backward_pawn") }
      : kind === "pawn_file_groups" ? { fen: context.fen, groups: values("foundation_pawn_file_group") }
      : kind === "file_states" ? { fen: context.fen, files: values("foundation_file_state") }
      : kind === "future_file_challenges" ? { fen: context.fen, pawnDomain: values("foundation_pawn_domain"), challenges: values("foundation_future_challenge") }
      : kind === "capture_migration_reaches" ? { fen: context.fen, pawnDomain: values("foundation_pawn_domain"), reaches: values("foundation_migration_reach") }
      : kind === "outpost_candidates" ? { fen: context.fen, basis: context.basis, candidates: values("foundation_outpost_candidate") }
      : kind === "occupied_outposts" ? { fen: context.fen, basis: context.basis, occupied: values("foundation_occupied_outpost") } : undefined;
    if (reconstructed !== undefined) expect(reconstructed).toEqual(original.payload);
    expect(JSON.stringify(original)).toBe(before);
    for (const candidate of [{ ...original }, JSON.parse(JSON.stringify(original)), reseal(original)]) {
      expect(() => collectInspectorDetailSource(candidate, `derived.inspector.detail.${kind}@1`, { kind: "whole" }, 0)).toThrow();
    }
    expect(() => collectInspectorDetailSource(original, `derived.inspector.detail.${kind}@1`, { kind: "whole" }, members.length || 1)).toThrow();
    expect(() => collectInspectorDetailSource(original, `derived.inspector.detail.${kind}@1`, { kind: "control_target", color: "white", mode: "legal", target: "a1" }, 0)).toThrow();
  });
  it.each(kinds.filter(k => k !== "backward_pawn_advance"))("%s retains genuine zero populations and all eight open-file rows", kind => {
    const original = source(kind, emptyFen), actual = pages(kind, original), members = actual.flatMap<InspectorDetailOccurrence>(p => p.members);
    expect(members).toHaveLength(kind === "file_states" ? 8 : 0);
    expect(actual).toHaveLength(1);
    if (members.length === 0) expect(actual[0]!.range).toEqual({ start: 0, count: 0, total: 0, next: null });
    expect(() => collectInspectorDetailSource(reseal(original), `derived.inspector.detail.${kind}@1`, { kind: "whole" }, 0)).toThrow();
  });
  it("reconstructs the entire original exchange graph, chosen lines, stop decisions and reply subset from bounded pages", () => {
    const original = advance(), expected = FOUNDATION_SNAPSHOT_SCHEMAS.backward_pawn_advance(original.payload, "original");
    const all = pages("backward_pawn_advance", original), flat = all.flatMap<InspectorDetailOccurrence>(p => p.members) as readonly FoundationDetailMember[];
    const headers = flat.filter(m => m.kind === "foundation_capture_header");
    const captures = headers.map(header => {
      const { captureIndex, branchCount, chosenLineCount, stopDecisionCount, ...fields } = header.value;
      const nodes = flat.filter(m => m.kind === "foundation_exchange_branch" && m.value.captureIndex === captureIndex);
      type RebuiltBranch = { step: LegalExchangeStep; resultUnits: number; chosen: boolean; continuation: RebuiltBranch[] };
      const tree: RebuiltBranch[] = [];
      for (const node of nodes) {
        const v = node.value as Extract<FoundationDetailMember, { kind: "foundation_exchange_branch" }>["value"];
        const parent = v.path.slice(0, -1).reduce<RebuiltBranch[]>((children, index) => children[index]!.continuation, tree);
        parent[v.path.at(-1)!] = { step: v.step, resultUnits: v.resultUnits, chosen: v.chosen, continuation: [] };
      }
      expect(tree).toHaveLength(branchCount);
      for (const node of nodes) {
        const v = node.value as Extract<FoundationDetailMember, { kind: "foundation_exchange_branch" }>["value"];
        const rebuilt = v.path.reduce<RebuiltBranch[]>((container, index) => container[index]!.continuation, tree);
        expect(rebuilt).toHaveLength(v.continuationCount);
      }
      const chosenLine = flat.filter(m => m.kind === "foundation_exchange_chosen" && m.value.captureIndex === captureIndex).map(m => (m.value as Extract<FoundationDetailMember, { kind: "foundation_exchange_chosen" }>["value"]).step);
      const stopDecisions = flat.filter(m => m.kind === "foundation_exchange_stop" && m.value.captureIndex === captureIndex).map(m => { const { captureIndex: _c, index: _i, ...decision } = m.value as Extract<FoundationDetailMember, { kind: "foundation_exchange_stop" }>["value"]; return decision; });
      expect(chosenLine).toHaveLength(chosenLineCount); expect(stopDecisions).toHaveLength(stopDecisionCount);
      return { ...fields, branches: tree, chosenLine, stopDecisions };
    });
    expect(captures).toEqual(expected.landing.captures);
    const replies = flat.filter(m => m.kind === "foundation_pawn_reply").map(m => captures[m.value.captureIndex]);
    expect(replies).toEqual(expected.replies);
    expect(captures.some(c => c.capturer.role !== "pawn")).toBe(true);
    expect(flat.some(m => m.kind === "foundation_exchange_branch" && m.value.path.length > 1)).toBe(true);
    expect(all.length).toBeGreaterThan(1);
  });
  it("retains a qualifying advance with zero captures and zero pawn replies as an available detail page", () => {
    const original = advance("k7/8/8/p7/8/1P6/8/R6K w - - 0 1"), actual = pages("backward_pawn_advance", original);
    expect(actual).toHaveLength(1); expect(actual[0]!.members).toEqual([]);
    expect(actual[0]!.context).toMatchObject({ captureCount: 0, replyCount: 0, pawn: { controllers: [{ color: "black", square: "a5" }] } });
  });
});
