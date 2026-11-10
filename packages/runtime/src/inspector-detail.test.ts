import { beforeAll, describe, expect, it } from "vitest";
import type { DeclaredEvidence } from "./evidence-contract.js";
import { assertDeclaredEvidence, evidenceValueReceipt, evidenceConventionReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { canonicalSemanticEdge } from "./semantic-validation-operations.js";
import {
  INSPECTOR_DETAIL_SOURCES, DESTINATION_DETAIL_SETS, inspectorDetailSquares, parseInspectorDetailPayload,
  renderInspectorDetail, type InspectorDetailKind, type InspectorDetailPayload, type InspectorDetailScope, type InspectorDetailOccurrence,
} from "./inspector-detail.js";
import { modulePolicy } from "./module-policy.js";
import { collectInspectorDetailSource } from "./inspector-detail-source.js";
import type { RayClassificationReading, DefenderDutyReading } from "./tactics.js";
import type { SquareControlReading } from "./square-control.js";
import type { PieceDestinationsReading, PieceDestinationsEvent } from "./mobility.js";
import type { KingZoneReading } from "./king-state.js";
import { componentValueSentence, factStatementOperand, parseComponentValue } from "./presentation-contract.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const FENS = [
  INITIAL, INITIAL.replace(" w ", " b "), "4k3/8/8/8/8/8/8/4K3 w - - 0 1",
  "4k3/8/8/8/8/8/8/4R1K1 b - - 0 1", // checking clone stays unavailable for the other side
  "k7/8/8/8/2b5/8/5PPP/6KR w H - 0 1", // stationary castling is not an adjacent escape
  "4k3/8/8/8/1r6/1P6/PBP5/4K3 w - - 0 1",
  "7k/8/8/8/8/5n2/4Q3/4R1K1 w - - 0 1",
  "4k3/4r3/8/8/8/8/4R3/4K3 b - - 0 1",
  "4k3/8/8/8/8/2B~5/8/4K3 w - - 0 1",
  "7k/8/2N1N3/1N3N2/3P4/1N3N2/2N1N3/6K1 w - - 0 1", // eight complete co-defenders force a real word-budget boundary
];
const KINDS = ["rays", "square_control", "piece_destinations", "destination_changes", "king_zone", "defender_duties"] as const; // Original six ABI controls; current foundation kinds have their own complete-source cohort.
const EDGES = [
  { beforeFen: INITIAL, moveUci: "b1a3" },
  { beforeFen: INITIAL.replace(" w ", " b "), moveUci: "b8a6" },
  { beforeFen: "4k3/8/2p5/1p6/1p6/2pp4/2p5/1N2K3 w - - 0 1", moveUci: "b1a3" },
  { beforeFen: "k7/8/8/8/2b5/8/5PPP/6KR w H - 0 1", moveUci: "g1h1" },
] as const;
const edgeSources = () => EDGES.flatMap(edge => {
  const input = canonicalSemanticEdge({ kind: "edge", ...edge, afterFen: "" });
  return invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", { beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen });
});
const route = (kind: InspectorDetailKind) => `derived.inspector.detail.${kind}@1`;
const RENDERERS = {
  rays: "inspector.detail.rays@1", square_control: "inspector.detail.square_control@1",
  piece_destinations: "inspector.detail.piece_destinations@1", destination_changes: "inspector.detail.destination_changes@1",
  king_zone: "inspector.detail.king_zone@1", defender_duties: "inspector.detail.defender_duties@1",
} as const;
const source = (kind: InspectorDetailKind, fen: string): readonly DeclaredEvidence<unknown>[] => {
  if (kind === "destination_changes") {
    const input = canonicalSemanticEdge({ kind: "edge", beforeFen: INITIAL, moveUci: "b1a3", afterFen: "" });
    return invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", { beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen });
  }
  return [invokeEvidenceValueRoute(INSPECTOR_DETAIL_SOURCES[kind] as never, { fen } as never) as DeclaredEvidence<unknown>];
};
const detail = (kind: InspectorDetailKind, source: DeclaredEvidence<unknown>, start = 0, scope: InspectorDetailScope = { kind: "whole" }) => {
  const item = invokeEvidenceValueRoute(route(kind) as never, { source, scope, start } as never) as DeclaredEvidence<InspectorDetailPayload>;
  assertDeclaredEvidence(item);
  expect(item.projection).toEqual({ id: `derived.inspector.detail.${kind}`, version: 1 });
  return item;
};

function collect(kind: InspectorDetailKind, input: DeclaredEvidence<unknown>, scope: InspectorDetailScope = { kind: "whole" }) {
  const pages: InspectorDetailPayload[] = [];
  let start = 0;
  do {
    const item = detail(kind, input, start, scope), value = item.payload;
    expect(evidenceValueReceipt(item).sourceDigests).toEqual([evidenceValueReceipt(input).payloadDigest]);
    expect(evidenceConventionReceipt(item)?.refs).toEqual(evidenceConventionReceipt(input)?.refs);
    expect(Object.isFrozen(value.members)).toBe(true);
    expect(parseInspectorDetailPayload(kind, JSON.parse(JSON.stringify(value)))).toEqual(value);
    expect(value.members.length).toBeLessThanOrEqual(8);
    const policy = modulePolicy("full_inspector").budgets;
    expect(renderInspectorDetail(value).normalize("NFKC").match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0).toBeLessThanOrEqual(policy.maxWords);
    expect(inspectorDetailSquares(value).length).toBeLessThanOrEqual(policy.maxMarks!);
    expect(value.range.start).toBe(start); pages.push(value);
    if (value.range.next === null) break;
    expect(value.range.next).toBeGreaterThan(start); start = value.range.next;
    expect(pages.length).toBeLessThan(500);
  } while (true);
  const members: InspectorDetailOccurrence[] = [];
  for (const page of pages) members.push(...page.members);
  expect(members.map(member => member.ordinal)).toEqual(Array.from({ length: pages[0]!.range.total }, (_, index) => index));
  expect(new Set(members.map(member => member.sourceOrdinal)).size).toBe(members.length);
  return { pages, members };
}

// Mutate nested grammar, not source authority. Optional absent fields remain optional;
// every required nested key and every closed object is exercised independently.
function malformedNested(value: unknown): readonly unknown[] {
  if (Array.isArray(value)) return value.flatMap((entry, index) => malformedNested(entry).map(bad => value.map((original, offset) => offset === index ? bad : original)));
  if (typeof value !== "object" || value === null) return [typeof value === "boolean" ? "false" : typeof value === "number" ? -1 : ""];
  const object = value as Readonly<Record<string, unknown>>;
  const result: unknown[] = [{ ...object, injected: "not an operand" }];
  for (const [key, entry] of Object.entries(object)) {
    if (key !== "promoted" && key !== "comparison") {
      const { [key]: _removed, ...rest } = object; result.push(rest);
    }
    for (const bad of malformedNested(entry)) result.push({ ...object, [key]: bad });
  }
  return result;
}

const MEMBER_KINDS = ["ray", "defender_duty", "control_relation", "control_empty_target", "control_unavailable",
  "destinations_unavailable", "destinations_empty_color", "destinations_empty_piece", "destination_membership",
  "destination_event_context", "destination_event_membership", "king_zone_member", "king_zone_relation", "king_empty_group",
  "king_shelter", "king_escape", "king_escapes_empty", "king_escapes_unavailable"] as const;

describe("D3792 actual bounded source-member factories", () => {
  it.each(KINDS)("keeps %s detail invocation inside the runtime source boundary", kind => {
    const original = kind === "destination_changes" ? edgeSources()[0]! : source(kind, INITIAL)[0]!;
    const expected = invokeEvidenceValueRoute(route(kind) as never, { source: original, scope: { kind: "whole" }, start: 0 } as never) as DeclaredEvidence<InspectorDetailPayload>;
    const result = collectInspectorDetailSource(original, route(kind), { kind: "whole" }, 0);
    expect(result.payload).toEqual(expected.payload);
    expect(evidenceValueReceipt(result)).toEqual(evidenceValueReceipt(expected));
    expect(() => collectInspectorDetailSource({ ...original } as DeclaredEvidence<unknown>, route(kind), { kind: "whole" }, 0)).toThrow();
    expect(() => collectInspectorDetailSource(original, "derived.inspector.detail.unknown@1", { kind: "whole" }, 0)).toThrow();
    const other = KINDS.find(candidate => candidate !== kind)!;
    expect(() => collectInspectorDetailSource(original, route(other), { kind: "whole" }, 0)).toThrow();
  });
  it.each(KINDS)("%s preserves complete source data through all bounded pages", kind => {
    const originals = kind === "destination_changes" ? edgeSources() : FENS.flatMap(fen => source(kind, fen));
    expect(originals.length).toBeGreaterThan(0);
    for (const original of originals) {
      const bytes = JSON.stringify(original), { pages, members } = collect(kind, original);
      expect(pages[0]!.sourceProjection).toBe(INSPECTOR_DETAIL_SOURCES[kind]);
      if (kind === "rays") expect(members.map(member => member.value)).toEqual((original.payload as RayClassificationReading).rays);
      if (kind === "defender_duties") expect(members.map(member => member.value)).toEqual((original.payload as DefenderDutyReading).duties);
      if (kind === "square_control") {
        const value = original.payload as SquareControlReading;
        for (const entry of value.colors) for (const [mode, state] of [["geometric", { kind: "available", squares: entry.pseudo }], ["legal", entry.legal]] as const) {
          const selected = members.filter(row => "color" in row.value && "mode" in row.value && row.value.color === entry.color && row.value.mode === mode);
          if (state.kind === "unavailable") expect(selected.map(row => row.kind)).toEqual(["control_unavailable"]);
          else {
            const actual = state.squares.map(square => ({ target: square.target, controllers: selected.filter(row => row.kind === "control_relation" && row.value.target === square.target).map(row => row.kind === "control_relation" ? row.value.controller : undefined) }));
            expect(actual).toEqual(state.squares);
            for (const square of state.squares) if (square.controllers.length === 0) expect(selected.filter(row => row.kind === "control_empty_target" && row.value.target === square.target)).toHaveLength(1);
          }
        }
      }
      if (kind === "piece_destinations") for (const entry of (original.payload as PieceDestinationsReading).colors) {
        if (entry.kind === "unavailable") expect(members.filter(row => row.kind === "destinations_unavailable" && row.value.color === entry.color).map(row => row.value)).toEqual([entry]);
        else {
          expect(members.filter(row => row.kind === "destinations_empty_color" && row.value.color === entry.color).map(row => row.value)).toEqual(entry.pieces.length === 0 ? [entry] : []);
          for (const piece of entry.pieces) {
          const rows = members.filter(row => row.kind === "destination_membership" && row.value.color === entry.color && row.value.piece.square === piece.piece.square);
          expect(members.filter(row => row.kind === "destinations_empty_piece" && row.value.color === entry.color && row.value.piece.square === piece.piece.square).map(row => row.value)).toEqual(piece.legal.length === 0 && piece.localNonLosing.length === 0 ? [{ color: entry.color, piece: piece.piece }] : []);
          expect(rows.filter(row => row.kind === "destination_membership" && row.value.legal).map(row => row.kind === "destination_membership" ? row.value.target : undefined)).toEqual(piece.legal);
          expect(rows.filter(row => row.kind === "destination_membership" && row.value.localNonLosing).map(row => row.kind === "destination_membership" ? row.value.target : undefined).sort()).toEqual([...piece.localNonLosing].sort());
          }
        }
      }
      if (kind === "destination_changes") for (const field of DESTINATION_DETAIL_SETS) expect(members.filter(row => row.kind === "destination_event_membership" && row.value.membership[field]).map(row => row.kind === "destination_event_membership" ? row.value.target : undefined)).toEqual([...(original.payload as PieceDestinationsEvent)[field]].sort());
      if (kind === "king_zone") for (const king of (original.payload as KingZoneReading).kings) {
        const rows = members.filter(row => "king" in row.value && row.value.king.square === king.king.square);
        expect(rows.filter(row => row.kind === "king_zone_member").map(row => row.kind === "king_zone_member" ? row.value.square : undefined)).toEqual(king.zone);
        for (const [group, participants] of [["attacker", king.attackers], ["defender", king.defenders]] as const) {
          expect(rows.filter(row => row.kind === "king_empty_group" && row.value.group === group).map(row => row.value)).toEqual(participants.length === 0 ? [{ king: king.king, group }] : []);
          for (const unit of participants) {
          expect(rows.filter(row => row.kind === "king_zone_relation" && row.value.group === group && row.value.participant.square === unit.square).map(row => row.kind === "king_zone_relation" ? row.value.square : undefined)).toEqual(unit.zoneSquares);
          }
        }
        expect(rows.filter(row => row.kind === "king_empty_group" && row.value.group === "shelter").map(row => row.value)).toEqual(king.shelter.length === 0 ? [{ king: king.king, group: "shelter" }] : []);
        expect(rows.filter(row => row.kind === "king_shelter").map(row => row.kind === "king_shelter" ? row.value.shelter : undefined)).toEqual(king.shelter);
        if (king.escapes.kind === "available") {
          expect(rows.filter(row => row.kind === "king_escape").map(row => row.kind === "king_escape" ? row.value.square : undefined)).toEqual(king.escapes.squares);
          expect(rows.filter(row => row.kind === "king_escapes_empty").map(row => row.value)).toEqual(king.escapes.squares.length === 0 ? [{ king: king.king, escapes: king.escapes }] : []);
        }
        else expect(rows.filter(row => row.kind === "king_escapes_unavailable").map(row => row.kind === "king_escapes_unavailable" ? row.value.escapes : undefined)).toEqual([king.escapes]);
      }
      expect(JSON.stringify(original)).toBe(bytes);
    }
  });

  it.each(KINDS)("%s rejects copied/foreign/changed authority and unsupported scope before empty shortcuts", kind => {
    const original = source(kind, FENS[2]!)[0]!;
    for (const bad of [{ ...original }, JSON.parse(JSON.stringify(original)), { ...original, payload: {} }, source(kind === "rays" ? "defender_duties" : "rays", FENS[2]!)[0]!]) {
      expect(() => detail(kind, bad)).toThrow();
    }
    for (const start of [-1, 0.5, NaN, Number.MAX_SAFE_INTEGER]) expect(() => detail(kind, original, start)).toThrow();
    expect(() => invokeEvidenceValueRoute(route(kind) as never, { source: original, start: 0, scope: { kind: "whole", path: "arbitrary" } } as never)).toThrow();
    expect(() => invokeEvidenceValueRoute(route(kind) as never, { source: original, start: 0, scope: { kind: "whole" }, members: [] } as never)).toThrow();
    if (kind !== "square_control") expect(() => detail(kind, original, 0, { kind: "control_target", color: "white", mode: "legal", target: "a1" })).toThrow();
  });

  it.each(KINDS)("%s registered fact component recomputes complete operands on both sides", kind => {
    for (const input of kind === "destination_changes" ? edgeSources() : FENS.flatMap(fen => source(kind, fen))) {
      for (const payload of collect(kind, input).pages) {
        const operand = factStatementOperand(RENDERERS[kind], "declared_convention", "piece-geometry@1", parseInspectorDetailPayload(kind, payload));
        expect(operand.operands).toEqual(payload);
        expect(operand.renderedText).toBe(renderInspectorDetail(payload));
        const component = { id: "fact_statement", operand } as const;
        const parsed = parseComponentValue(JSON.parse(JSON.stringify(component)));
        expect(parsed).toEqual(component);
        expect(componentValueSentence(parsed)).toBe(renderInspectorDetail(payload));
        expect(() => parseComponentValue({ ...component, operand: { ...operand, renderedText: "Invented chess advice." } })).toThrow();
        expect(() => parseComponentValue({ ...component, operand: { ...operand, operands: { ...payload, sentence: "Invented chess advice." } } })).toThrow();
        expect(() => factStatementOperand(RENDERERS[kind], "declared_convention", "piece-geometry@1", { ...payload, sentence: "Invented chess advice." } as never)).toThrow();
      }
    }
  });

  it("square-control target focus retains original ordinals, controllers and clone unavailability", () => {
    for (const fen of [INITIAL, FENS[3]!]) {
      const original = source("square_control", fen)[0]!;
      const all = collect("square_control", original).members;
      for (const color of ["white", "black"] as const) for (const mode of ["geometric", "legal"] as const) for (const target of ["a1", "e4", "h8"] as const) {
        const focused = collect("square_control", original, { kind: "control_target", color, mode, target });
        const expected = all.filter(row => (row.kind === "control_relation" || row.kind === "control_empty_target" || row.kind === "control_unavailable") && row.value.color === color && row.value.mode === mode && (!("target" in row.value) || row.value.target === target));
        expect(focused.members.map(({ ordinal: _ordinal, ...row }) => row)).toEqual(expected.map(({ ordinal: _ordinal, ...row }) => row));
        expect(focused.pages[0]!.fullSourceTotal).toBe(all.length);
      }
    }
  });

  describe("closed nested grammar from actual source members", () => {
    const samples = new Map<string, { kind: InspectorDetailKind; payload: InspectorDetailPayload; index: number }>();
    beforeAll(() => {
      for (const kind of KINDS) for (const input of kind === "destination_changes" ? edgeSources() : FENS.flatMap(fen => source(kind, fen))) {
        for (const payload of collect(kind, input).pages) payload.members.forEach((member, index) => {
          if (!samples.has(member.kind)) samples.set(member.kind, { kind, payload, index });
        });
      }
    });
    it("exercises all eighteen alternatives with real sealed collector sources", () => {
      expect([...samples.keys()].sort()).toEqual([...MEMBER_KINDS].sort());
    });
    it.each(MEMBER_KINDS)("%s refuses malformed fields at every nested depth", memberKind => {
      const sample = samples.get(memberKind)!;
      expect(sample, memberKind).toBeDefined();
      expect(parseInspectorDetailPayload(sample.kind, sample.payload)).toEqual(sample.payload);
      const original = sample.payload.members[sample.index]!;
      const mutations = malformedNested(original.value);
      expect(mutations.length).toBeGreaterThan(1);
      for (const value of mutations) expect(() => parseInspectorDetailPayload(sample.kind, {
        ...sample.payload, members: sample.payload.members.map((member, index) => index === sample.index ? { ...member, value } : member),
      }), `${memberKind} ${JSON.stringify(value)}`).toThrow();
    });
  });

  it("refuses contradictory range, ordinal, source, context and focused-scope images", () => {
    const input = source("square_control", INITIAL)[0]!, page = detail("square_control", input).payload;
    for (const bad of [
      { ...page, sourceProjection: INSPECTOR_DETAIL_SOURCES.rays },
      { ...page, fullSourceTotal: page.fullSourceTotal + 1 },
      { ...page, range: { ...page.range, count: page.range.count - 1 } },
      { ...page, range: { ...page.range, next: null } },
      { ...page, range: { ...page.range, start: 1 } },
      { ...page, context: { ...page.context, unexpected: true } },
      { ...page, scope: { kind: "control_target", color: "black", mode: "legal", target: "h8" } },
      { ...page, members: page.members.map((member, index) => index === 1 ? { ...member, sourceOrdinal: 0 } : member) },
      { ...page, members: page.members.map((member, index) => index === 0 ? { ...member, ordinal: 1 } : member) },
    ]) expect(() => parseInspectorDetailPayload("square_control", bad)).toThrow();
    const event = edgeSources()[0]!, eventPage = detail("destination_changes", event).payload;
    expect(() => parseInspectorDetailPayload("destination_changes", { ...eventPage, context: { ...eventPage.context, moved: !(eventPage.context as PieceDestinationsEvent).moved } })).toThrow();
    expect(() => detail("square_control", input, page.range.total)).toThrow();
    expect(() => detail("square_control", detail("square_control", input))).toThrow();
  });

  it.each(["constructor", "toString", "__proto__"])("rejects JSON own %s at every closed object layer", key => {
    const page = detail("piece_destinations", source("piece_destinations", INITIAL)[0]!).payload;
    const row = page.members.find(member => member.kind === "destination_membership")!;
    expect(row.kind).toBe("destination_membership");
    const extra = JSON.parse(`{"${key}":"not declared"}`) as Record<string, unknown>;
    const values = [
      { ...page, ...extra },
      { ...page, context: { ...page.context, ...extra } },
      { ...page, members: page.members.map(member => ({ ...member, ...extra })) },
      { ...page, members: page.members.map(member => ({ ...member, value: { ...member.value, ...extra } })) },
      { ...page, members: page.members.map(member => member.kind === "destination_membership" ? { ...member, value: { ...member.value, piece: { ...member.value.piece, occupant: { ...member.value.piece.occupant, ...extra } } } } : member) },
    ];
    for (const value of values) expect(() => parseInspectorDetailPayload("piece_destinations", JSON.parse(JSON.stringify(value)))).toThrow();
  });

  it("rejects inherited required fields rather than manufacturing own operands", () => {
    const page = detail("piece_destinations", source("piece_destinations", INITIAL)[0]!).payload;
    const inherited = page.members.map(member => {
      if (member.kind !== "destination_membership") return member;
      const { color, ...rest } = member.value.piece.occupant;
      const occupant: unknown = Object.assign(Object.create({ color }), rest);
      return { ...member, value: { ...member.value, piece: { ...member.value.piece, occupant } } };
    });
    expect(() => parseInspectorDetailPayload("piece_destinations", { ...page, members: inherited })).toThrow();
  });

  it("ends a page before the next complete member exceeds unchanged budgets", () => {
    let budgetBoundaries = 0;
    for (const kind of KINDS) for (const input of kind === "destination_changes" ? edgeSources() : FENS.flatMap(fen => source(kind, fen))) {
      const { pages, members } = collect(kind, input);
      for (const page of pages) {
        if (page.range.next === null || page.members.length === 8) continue;
        budgetBoundaries++;
        const candidate = parseInspectorDetailPayload(kind, {
          ...page,
          range: { ...page.range, count: page.range.count + 1, next: page.range.next + 1 === page.range.total ? null : page.range.next + 1 },
          members: [...page.members, members[page.range.next]!],
        });
        const words = renderInspectorDetail(candidate).normalize("NFKC").match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
        const policy = modulePolicy("full_inspector").budgets;
        expect(words > policy.maxWords || inspectorDetailSquares(candidate).length > policy.maxMarks!).toBe(true);
      }
    }
    expect(budgetBoundaries).toBeGreaterThan(0);
  });

  it("retains promoted flags and the scope of king-escape and zeroSafe captions", () => {
    const promoted = source("piece_destinations", FENS[8]!)[0]!;
    const retained = collect("piece_destinations", promoted).pages;
    // Orthodox Chess normalizes away FEN '~' history. Detail must preserve the actual
    // source flag, never infer promotion from the input spelling or manufacture true.
    const sourcePiece = (promoted.payload as PieceDestinationsReading).colors.flatMap(color => color.pieces).find(piece => piece.piece.square === "c3")!.piece.occupant;
    const retainedMembers: InspectorDetailOccurrence[] = [];
    for (const page of retained) retainedMembers.push(...page.members);
    const actual = retainedMembers.find(member => member.kind === "destination_membership")!;
    expect(actual.kind === "destination_membership" ? actual.value.piece.occupant : undefined).toEqual(sourcePiece);
    const page = retained[0]!;
    // Grammar-only round-trip controls are not minted/source-authorized evidence.
    for (const flag of [undefined, false, true]) {
      const members = page.members.map(member => {
        if (member.kind !== "destination_membership") return member;
        const { promoted: _flag, ...base } = member.value.piece.occupant;
        return { ...member, value: { ...member.value, piece: { ...member.value.piece, occupant: { ...base, ...(flag === undefined ? {} : { promoted: flag }) } } } };
      });
      const parsed = parseInspectorDetailPayload("piece_destinations", { ...page, members });
      expect(parsed.members[0]!.kind === "destination_membership" ? parsed.members[0]!.value.piece.occupant : undefined).toEqual({ color: "white", role: "bishop", ...(flag === undefined ? {} : { promoted: flag }) });
      if (flag !== undefined) expect(renderInspectorDetail(parsed)).toContain(flag ? "(marked promoted)" : "(not marked promoted)");
      else expect(renderInspectorDetail(parsed)).not.toContain("marked promoted");
    }
    const castle = collect("king_zone", source("king_zone", FENS[4]!)[0]!).pages;
    const empty = castle.find(page => page.members.some(member => member.kind === "king_escapes_empty" && member.value.king.square === "g1"))!;
    expect(empty).toBeDefined();
    expect(renderInspectorDetail(empty)).toContain("no adjacent legal turn-clone escape");
    expect(renderInspectorDetail(empty)).toContain("not a claim about every legal king move");
    const event = edgeSources().find(item => item.payload.beforeFen === EDGES[2].beforeFen && item.payload.piece.before.square === "b1")!;
    expect(event).toBeDefined();
    expect(event.payload.safeBefore).toEqual([]); expect(event.payload.safeAfter).toEqual([]); expect(event.payload.zeroSafe).toBe(false);
    const pages = collect("destination_changes", event).pages;
    expect(pages.map(renderInspectorDetail).join(" ")).toContain("lost its last local non-losing exchange destination no");
    for (const page of pages) expect(renderInspectorDetail(page)).toContain("knight on b1 before, knight on a3 after");
  });
});
