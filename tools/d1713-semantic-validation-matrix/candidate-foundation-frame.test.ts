// DISPOSABLE D4167 research: one root owner shares six existing foundation prerequisites across
// real legal children, current seven event factories and retained reading views. This is NOT a
// production packet/issuer/ABI, semantic oracle, ordinary activation or timing budget.
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import * as routes from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/position-cache.js";
import { collectFoundationEdgeEvents, type FoundationEdgeSourceRef } from "../../packages/runtime/src/foundation-edge-source.js";
import { compileSemanticEvidenceEvent, type SemanticEvidenceEvent } from "../../packages/runtime/src/semantic-evidence.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { assertDeclaredEvidence, type DeclaredEvidence, type SemanticEventSign } from "../../packages/runtime/src/evidence-contract.js";
import { SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS } from "../../packages/runtime/src/semantic-validation.js";
import type { ExactLegalMove } from "../../packages/runtime/src/legal-moves.js";
import { deriveCandidatePacketProjectionGroups } from "../candidate-packet-projections/derive.js";
import { ONE_EDGE_EVENT_REFS } from "../../packages/runtime/src/module-registry.js";
import { matchesStructuralFeature } from "../../packages/runtime/src/structure.js";
import type { PawnFileGroupChange } from "../../packages/runtime/src/foundation-pawn-sources.js";

type Scope = "events" | "readings" | "both";
type Edge = { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string };
const refs = SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS.map(ref => `${ref.id}@${ref.version}` as FoundationEdgeSourceRef);
const available = <T>(result: { readonly kind: "available"; readonly value: T } | { readonly kind: "unavailable"; readonly reason: string }): T => {
  if (result.kind !== "available") throw Error(result.reason); return result.value;
};
const once = <T>(build: () => T) => { let ready = false, value: T; return () => { if (!ready) { value = build(); ready = true; } return value; }; };
function cells(fen: string) {
  const legal = once(() => routes.invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen }));
  const connectivity = once(() => routes.invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen }));
  const opposition = once(() => available(routes.invokeEvidenceValueRoute("rules.structural.reading.king_opposition@3", { position: legal() })));
  const backward = once(() => available(routes.invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@3", { position: legal() })));
  const groups = once(() => available(routes.invokeEvidenceValueRoute("derived.structural.reading.pawn_file_group@1", { source: connectivity() })));
  const files = once(() => available(routes.invokeEvidenceValueRoute("derived.activity.reading.file_state@1", { source: connectivity() })));
  const values = once(() => Object.freeze([legal(), connectivity(), opposition(), backward(), groups(), files()]));
  return Object.freeze({ legal, connectivity, opposition, backward, groups, files, values });
}
type Cells = ReturnType<typeof cells>;
function actualChild(beforeFen: string, move: ExactLegalMove): Edge {
  const position = positionFromFen(beforeFen), parsed = parseUci(move.uci);
  if (parsed === undefined) throw Error("Original authority has no board move");
  const physical = normalizeMove(position, parsed);
  if (!position.isLegal(physical)) throw Error("Original candidate is not legal at this root");
  position.play(physical); return { beforeFen, moveUci: move.uci, afterFen: canonicalFen(position) };
}
function sharedEvents(edge: Edge, before: Cells, after: Cells): readonly SemanticEvidenceEvent[] {
  const files = available(routes.invokeEvidenceValueRoute("derived.activity.event.file_state@1", { before: before.files(), moveUci: edge.moveUci, after: after.files() }));
  const values: Readonly<Record<FoundationEdgeSourceRef, readonly DeclaredEvidence<unknown>[]>> = {
    "rules.structural.event.king_opposition@2": available(routes.invokeEvidenceValueRoute("rules.structural.event.king_opposition@2", { before: before.opposition(), moveUci: edge.moveUci, after: after.opposition() })),
    "rules.structural.event.backward_pawn@2": available(routes.invokeEvidenceValueRoute("rules.structural.event.backward_pawn@2", { before: before.backward(), moveUci: edge.moveUci, after: after.backward() })),
    "derived.structural.event.pawn_file_group@1": available(routes.invokeEvidenceValueRoute("derived.structural.event.pawn_file_group@1", { before: before.groups(), moveUci: edge.moveUci, after: after.groups() })),
    "rules.transition.event.slider_ray@2": routes.invokeEvidenceValueRoute("rules.transition.event.slider_ray@2", edge),
    "derived.activity.event.file_state@1": files,
    "derived.activity.event.file_access_revealed@1": files.flatMap(change => available(routes.invokeEvidenceValueRoute("derived.activity.event.file_access_revealed@1", { change }))),
    "rules.structural.event.pawn_islands@2": available(routes.invokeEvidenceValueRoute("rules.structural.event.pawn_islands@2", { before: before.connectivity(), moveUci: edge.moveUci, after: after.connectivity() })),
  };
  const anchor = { ...edge, side: positionFromFen(edge.beforeFen).turn };
  return Object.freeze(refs.flatMap(ref => values[ref].map(evidence => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
    evidence, derivationInputs: routes.readFoundationEventInvocation(evidence).inputs, anchor, sign: (evidence.payload as { readonly sign: SemanticEventSign }).sign,
  }))));
}
function population(beforeFen: string, scope: Scope, sharing: boolean) {
  if (!["events", "readings", "both"].includes(scope)) throw Error("Closed research scope required");
  const before = cells(beforeFen), originalLegal = before.legal();
  if (originalLegal.payload.fen !== beforeFen) throw Error("Canonical root required");
  const moves = Object.freeze(originalLegal.payload.pieces.flatMap(piece => piece.moves));
  const rows = moves.map(move => {
    const edge = actualChild(beforeFen, move), after = cells(edge.afterFen);
    const events = scope === "readings" ? Object.freeze([]) : sharing ? sharedEvents(edge, before, after) : collectFoundationEdgeEvents(edge, refs);
    const readings = scope === "events" ? Object.freeze([]) : after.values();
    // Private research witnesses remain even for a real quiet all-empty event population. They
    // model fields in the EXISTING packet-owner references, not another production seal/store.
    const originalAfter = sharing || scope !== "events" ? after.values() : Object.freeze([]);
    return Object.freeze({ edge, move, events, readings, originalAfter });
  });
  // The separate path does not need unused root snapshots merely to count its real work.
  const originalBefore = scope === "readings" || !sharing ? Object.freeze([originalLegal]) : before.values();
  const assertBefore = (supplied: readonly DeclaredEvidence<unknown>[]) => {
    if (supplied.length !== originalBefore.length || supplied.some((value, index) => value !== originalBefore[index])) throw Error("Not the owner's original complete root handoff");
    supplied.forEach(assertDeclaredEvidence);
  };
  const assertAfter = (row: typeof rows[number], supplied: readonly DeclaredEvidence<unknown>[]) => {
    if (!rows.includes(row) || supplied.length !== row.originalAfter.length || supplied.some((value, index) => value !== row.originalAfter[index])) throw Error("Not the owner's original complete child handoff");
    supplied.forEach(assertDeclaredEvidence);
  };
  return Object.freeze({ before, originalLegal, originalBefore, moves, rows: Object.freeze(rows), assertBefore, assertAfter });
}
const payloads = (events: readonly SemanticEvidenceEvent[]) => events.map(event => ({ projection: event.projection, sign: event.sign, operands: event.operands }));
const tupleFor = (ref: string, before: Cells, after: readonly DeclaredEvidence<unknown>[]) => {
  switch (ref) {
    case "rules.structural.event.king_opposition@2": return [before.opposition(), after[2]!];
    case "rules.structural.event.backward_pawn@2": return [before.backward(), after[3]!];
    case "derived.structural.event.pawn_file_group@1": return [before.groups(), after[4]!];
    case "derived.activity.event.file_state@1": return [before.files(), after[5]!];
    case "rules.structural.event.pawn_islands@2": return [before.connectivity(), after[1]!];
    default: return [];
  }
};
const inputs = [
  ["white", "1qr4k/8/8/8/1Q6/2n5/1P6/1R5K w - - 0 1"],
  ["black", "1r5k/1p6/2N5/1q6/8/8/8/1QR4K b - - 0 1"],
  ["same-file", "7k/2p5/2p5/1P6/3P4/8/8/7K w - - 0 1"],
  ["castle", "1k6/8/8/8/8/8/8/4K2R w K - 0 1"],
] as const;
afterEach(() => vi.restoreAllMocks());
describe("D4167 disposable original candidate-frame composition", () => {
  it.each(inputs)("%s shares original root/child values without changing any full event/reading payload", (name, fen) => {
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const separate = population(fen, "both", false), oldCount = calls.mock.calls.length; calls.mockClear();
    const joined = population(fen, "both", true), newCount = calls.mock.calls.length;
    expect(joined.rows.length).toBeGreaterThan(0); expect(joined.moves).toEqual(separate.moves);
    expect(joined.rows).toHaveLength(joined.moves.length);
    let fileReveal = 0;
    for (const [index, row] of joined.rows.entries()) {
      expect(row.move).toBe(joined.moves[index]); expect(row.edge).toEqual(separate.rows[index]!.edge);
      expect(payloads(row.events)).toEqual(payloads(separate.rows[index]!.events));
      expect(row.readings.map(value => ({ ref: value.projection, payload: value.payload }))).toEqual(separate.rows[index]!.readings.map(value => ({ ref: value.projection, payload: value.payload })));
      expect(row.readings).toBe(row.originalAfter); joined.assertAfter(row, row.readings);
      const changes = row.events.filter(event => event.projection.id === "derived.activity.event.file_state");
      for (const event of row.events) {
        const ref = `${event.projection.id}@${event.projection.version}`;
        if (ref === "derived.activity.event.file_access_revealed@1") {
          fileReveal++; expect(changes.some(change => event.derivationInputs[0] === change.evidence)).toBe(true);
        } else {
          const expected = tupleFor(ref, joined.before, row.originalAfter);
          expect(event.derivationInputs).toHaveLength(expected.length);
          expected.forEach((value, ordinal) => expect(event.derivationInputs[ordinal]).toBe(value));
        }
        const actual = routes.readFoundationEventInvocation(event.evidence).inputs;
        expect(actual).toHaveLength(event.derivationInputs.length); actual.forEach((value, ordinal) => expect(value).toBe(event.derivationInputs[ordinal]));
      }
    }
    if (name === "white" || name === "black") expect(fileReveal).toBeGreaterThan(0);
    const rootLegal = calls.mock.calls.filter(([route, value]) => route === "rules.mobility.reading.legal_moves@1" && (value as { fen: string }).fen === fen);
    const rootConnectivity = calls.mock.calls.filter(([route, value]) => route === "rules.structural.reading.pawn_connectivity@1" && (value as { fen: string }).fen === fen);
    expect(rootLegal).toHaveLength(1); expect(rootConnectivity).toHaveLength(1);
    expect(calls.mock.calls.filter(([route]) => route === "rules.mobility.reading.legal_moves@1")).toHaveLength(joined.rows.length + 1);
    expect(calls.mock.calls.filter(([route]) => route === "rules.structural.reading.pawn_connectivity@1")).toHaveLength(joined.rows.length + 1);
    expect(newCount).toBeLessThan(oldCount);
    process.stdout.write(JSON.stringify({ question: "D4167", scope: "six common foundation readings + seven event families", name, legalCandidates: joined.rows.length, separateRouteCalls: oldCount, ownerRouteCalls: newCount, latencyClaim: false, productionPacket: false }) + "\n");
  });
  it.each(["8/7k/8/8/8/8/8/K7 w - - 0 1", "k7/8/8/8/8/8/7K/8 b - - 0 1"])("retains empty sources and rejects equal-FEN replacement instances: %s", fen => {
    const owner = population(fen, "both", true);
    owner.assertBefore(owner.originalBefore);
    const foreignRoot = cells(fen).values();
    expect(foreignRoot.map(value => value.payload)).toEqual(owner.originalBefore.map(value => value.payload));
    expect(() => owner.assertBefore(foreignRoot)).toThrow(/original complete root/u);
    expect(() => owner.assertBefore(owner.originalBefore.slice(1))).toThrow();
    expect(owner.rows.length).toBeGreaterThan(0); expect(owner.rows.every(row => row.events.length === 0)).toBe(true);
    for (const row of owner.rows) {
      expect(row.readings).toHaveLength(6); owner.assertAfter(row, row.readings);
      const replacement = available(routes.invokeEvidenceValueRoute("rules.structural.reading.king_opposition@3", { position: row.originalAfter[0] as ReturnType<Cells["legal"]> }));
      expect(replacement).not.toBe(row.readings[2]); expect(replacement.payload).toEqual(row.readings[2]!.payload);
      const changed = [...row.readings]; changed[2] = replacement;
      expect(() => owner.assertAfter(row, changed)).toThrow(/original complete child/u);
      expect(() => owner.assertAfter(row, row.readings.slice(1))).toThrow();
      expect(() => owner.assertAfter({ ...row }, row.readings)).toThrow();
    }
    if (owner.rows.length > 1) expect(() => owner.assertAfter(owner.rows[0]!, owner.rows[1]!.readings)).toThrow();
  });
  it("reading-only scope has no before snapshot/event work; wide narrowing preserves original values", () => {
    const fen = inputs[2][1], calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const readings = population(fen, "readings", true);
    expect(readings.rows.length).toBeGreaterThan(0); expect(readings.rows.every(row => row.events.length === 0 && row.readings.length === 6)).toBe(true);
    expect(calls.mock.calls.filter(([route]) => refs.includes(route as FoundationEdgeSourceRef))).toHaveLength(0);
    expect(calls.mock.calls.filter(([route, value]) => route === "rules.structural.reading.pawn_connectivity@1" && (value as { fen: string }).fen === fen)).toHaveLength(0);
    const wide = population(fen, "both", true);
    const narrow = wide.rows.map(row => ({ move: row.move, events: row.events, readings: Object.freeze([]) }));
    narrow.forEach((row, index) => { expect(row.move).toBe(wide.rows[index]!.move); expect(row.events).toBe(wide.rows[index]!.events); });
    calls.mockClear(); expect(() => population(fen, "unknown" as Scope, true)).toThrow(); expect(calls).not.toHaveBeenCalled();
  });
  it.each(inputs)("%s direct events-only shares required sources without retaining readings", (_name, fen) => {
    const direct = population(fen, "events", true), wide = population(fen, "both", true);
    expect(direct.moves).toEqual(wide.moves);
    direct.rows.forEach((row, index) => {
      expect(row.readings).toHaveLength(0); expect(row.originalAfter).toHaveLength(6);
      expect(payloads(row.events)).toEqual(payloads(wide.rows[index]!.events));
      direct.assertBefore(direct.originalBefore); direct.assertAfter(row, row.originalAfter);
    });
  });
  it("audits the actual candidate image separately from the ordinary module fence", () => {
    const { groups } = deriveCandidatePacketProjectionGroups();
    const actual = Object.entries(groups).filter(([group]) => group.startsWith("event.")).flatMap(([, values]) => values);
    const ordinary = ONE_EDGE_EVENT_REFS.map(ref => `${ref.id}@${ref.version}`);
    expect(actual).toHaveLength(44); expect(new Set(actual).size).toBe(actual.length);
    expect(new Set(ordinary).size).toBe(ordinary.length);
    process.stdout.write(JSON.stringify({ question: "D4167", actualCandidateEventKeys: actual.length,
      actualOrdinaryFence: ordinary.length, candidateOnly: actual.filter(key => !ordinary.includes(key)),
      fenceOnly: ordinary.filter(key => !actual.includes(key)), activation: false }) + "\n");
  });
  it("audits a literal replacement proposal without changing production output or case meanings", () => {
    const withdrawn = [
      "rules.structural.event.backward_pawn@1", "rules.structural.event.king_opposition@1",
      "rules.structural.event.pawn_islands@1", "rules.structural.event.line_blockers@1",
      "rules.transition.event.slider_ray@1", "rules.structural.event.isolated_pawn@1",
      "rules.structural.event.doubled_pawn@1", "rules.structural.event.open_file@1",
      "rules.structural.event.half_open_file@1",
    ];
    const { groups } = deriveCandidatePacketProjectionGroups();
    const actual = Object.entries(groups).filter(([group]) => group.startsWith("event.")).flatMap(([, values]) => values);
    expect(withdrawn.every(ref => actual.includes(ref))).toBe(true);
    expect(refs.every(ref => !actual.includes(ref))).toBe(true);
    const proposed = [...actual.filter(ref => !withdrawn.includes(ref)), ...refs];
    expect(proposed).toHaveLength(42); expect(new Set(proposed).size).toBe(42);
    expect(proposed).toContain("derived.activity.event.open_file_occupancy@1");
    expect(proposed).toContain("derived.tactic.discovered_executed@1");
    const readings = Object.entries(groups).filter(([group]) => group.startsWith("reading.")).flatMap(([, values]) => values);
    expect(readings).toHaveLength(35); expect(new Set(readings).size).toBe(35);
    const document = JSON.parse(readFileSync(new URL("../../packages/runtime/src/semantic-validation-cases.json", import.meta.url), "utf8")) as {
      readonly cases: readonly { readonly subject: { readonly projection: { readonly id: string; readonly version: number } } }[];
    };
    const historical = document.cases.filter(row => withdrawn.includes(`${row.subject.projection.id}@${row.subject.projection.version}`));
    expect(document.cases).toHaveLength(875); expect(historical).toHaveLength(51);
    expect(historical.some(row => row.subject.projection.id === "rules.structural.event.king_opposition")).toBe(false);
    process.stdout.write(JSON.stringify({ question: "D4167", proposalOnly: true, withdrawnPublicRefs: withdrawn.length,
      proposedEventKeys: proposed.length, retainedReadingKeys: readings.length, priorCaseCount: document.cases.length,
      unchangedCasesRequiringHistoricalCustody: historical.length, proposedLiveCases: document.cases.length - historical.length,
      canonicalQualificationChange: false, activation: false }) + "\n");
  });
  it.each(inputs)("%s current native flags cover all former file-condition booleans", (_name, fen) => {
    const root = population(fen, "both", true);
    for (const source of [root.before, ...root.rows.map(row => cells(row.edge.afterFen))]) {
      const groups = source.groups().payload, files = source.files().payload;
      for (const file of ["a", "b", "c", "d", "e", "f", "g", "h"] as const) {
        const state = files.files.find(row => row.file === file)!;
        expect(state.state === "open").toBe(matchesStructuralFeature(files.fen, { kind: "open_file", file }));
        for (const color of ["white", "black"] as const) {
          const group = groups.groups.find(row => row.color === color && row.file === file);
          for (const kind of ["isolated_pawn", "doubled_pawn"] as const) {
            const flag = kind === "isolated_pawn" ? "isolated" : "doubled";
            expect(group?.[flag] ?? false).toBe(matchesStructuralFeature(groups.fen, { kind, color, file }));
          }
          expect(state.state === `half_open_${color}`).toBe(matchesStructuralFeature(files.fen, { kind: "half_open_file", color, file }));
        }
      }
    }
  });
  it("membership change is not an isolation/doubling toggle; unchanged conditions remain readings", () => {
    const fen = "7k/8/8/8/8/P7/P7/7K w - - 0 1", owner = population(fen, "both", true);
    const row = owner.rows.find(candidate => candidate.move.uci === "a3a4")!;
    const event = row.events.find(candidate => candidate.projection.id === "derived.structural.event.pawn_file_group")!;
    expect(event).toBeDefined(); expect(event.sign).toBe("membership_changed");
    const value = event.operands as PawnFileGroupChange;
    expect(value.before).toMatchObject({ pawns: ["a3", "a2"], isolated: true, doubled: true });
    expect(value.after).toMatchObject({ pawns: ["a4", "a2"], isolated: true, doubled: true });
    expect(value.before!.isolated).toBe(value.after!.isolated);
    expect(value.before!.doubled).toBe(value.after!.doubled);
    const quiet = owner.rows.find(candidate => candidate.move.uci === "h1g1")!;
    expect(quiet.events.filter(candidate => candidate.projection.id === "derived.structural.event.pawn_file_group"
      || candidate.projection.id === "derived.activity.event.file_state")).toHaveLength(0);
    expect((quiet.originalAfter[4] as ReturnType<Cells["groups"]>).payload.groups).toContainEqual(value.before);
  });
});
