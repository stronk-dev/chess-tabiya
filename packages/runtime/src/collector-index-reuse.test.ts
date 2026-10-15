import { normalizeMove } from "chessops/chess";
import type { SquareName } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";
import { expect, it, vi } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { STRUCTURAL_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";
import { structuralReading } from "./structure.js";
import { localSemanticEventClosure, structuralSemanticEventPayloads } from "./semantic-evidence.js";
import { STRUCTURAL_EVENT_FAMILIES } from "./evidence-catalog.js";
import * as evidenceContract from "./evidence-contract.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { squareControlEvents, squareControlReading, type ControlledSquare, type SquareControlEvent, type SquareControlEvents } from "./square-control.js";

function edge(fen: string, uci: string) {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return { beforeFen: fen, moveUci: makeUci(move), afterFen: canonicalFen(position) };
}

it("retains complete position authority, per-route isolation, frozen values and current admission", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 7912";
  const route = "rules.square.reading.control@1";
  const initial = invokeEvidenceValueRoute(route, { fen });
  const receipt = evidenceValueReceipt(initial);
  expect(Object.isFrozen(initial.payload)).toBe(true);
  expect(() => Object.assign(initial.payload, { corrupt: true })).toThrow();
  expect(evidenceValueReceipt(invokeEvidenceValueRoute(route, { fen }))).toEqual(receipt);
  for (const distinct of [fen.replace("0 7912", "1 7912"), fen.replace("0 7912", "0 7913"), fen.replace(" w ", " b ")]) {
    expect(evidenceValueReceipt(invokeEvidenceValueRoute(route, { fen: distinct })).inputDigest).not.toBe(receipt.inputDigest);
  }
  const mobility = invokeEvidenceValueRoute("rules.mobility.reading.piece_destinations@1", { fen });
  expect(mobility.projection.id).not.toBe(initial.projection.id);
  expect(evidenceValueReceipt(mobility).factory).not.toBe(receipt.factory);
  for (let repeat = 0; repeat < 2; repeat++) {
    expect(() => invokeEvidenceValueRoute(route, { fen: "invalid" })).toThrow();
    expect(() => invokeEvidenceValueRoute(route, { fen, extra: true } as unknown as { fen: string })).toThrow();
  }
  expect(evidenceValueReceipt(invokeEvidenceValueRoute(route, { fen }))).toEqual(receipt);
});

it.each(["white", "black"] as const)("D3840 shares a complete %s control population across the real event composition", color => {
  const fen = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${color === "white" ? "w" : "b"} KQkq - 0 7921`;
  const input = edge(fen, color === "white" ? "e2e4" : "e7e5");
  const spy = vi.spyOn(evidenceContract, "declareEvidence");
  const mints = () => spy.mock.calls.filter(([, projection]) => projection.id === "rules.square.event.control").length;
  try {
    const initial = invokeEvidenceValueRoute("rules.square.event.control@1", input);
    expect(initial.length).toBeGreaterThan(0);
    const receipts = initial.map(evidenceValueReceipt);
    expect(Object.isFrozen(initial)).toBe(true);
    expect(() => Object.assign(initial[0]!.payload, { corrupt: true })).toThrow();
    expect(mints()).toBe(initial.length);
    const actual = localSemanticEventClosure(input.beforeFen, input.moveUci, input.afterFen);
    // The composed event list has its own id ordering. Compare the complete receipt population,
    // not that different ordering; the whole-game byte comparison separately pins output order.
    const byDigest = (a: ReturnType<typeof evidenceValueReceipt>, b: ReturnType<typeof evidenceValueReceipt>) => a.payloadDigest.localeCompare(b.payloadDigest);
    expect(actual.events.filter(value => value.projection.id === "rules.square.event.control").map(value => evidenceValueReceipt(value.evidence)).sort(byDigest)).toEqual([...receipts].sort(byDigest));
    expect(mints()).toBe(initial.length);
    const repeated = invokeEvidenceValueRoute("rules.square.event.control@1", input);
    expect(repeated.map(evidenceValueReceipt)).toEqual(receipts);
    expect(mints()).toBe(initial.length);
    // One slot, not a growing history. A different legal edge evicts this population.
    invokeEvidenceValueRoute("rules.square.event.control@1", edge(fen, color === "white" ? "d2d4" : "d7d5"));
    const count = mints();
    expect(invokeEvidenceValueRoute("rules.square.event.control@1", input).map(evidenceValueReceipt)).toEqual(receipts);
    expect(mints()).toBe(count + initial.length);
    for (const distinct of [fen.replace("0 7921", "1 7921"), fen.replace("0 7921", "0 7923")]) {
      const scoped = invokeEvidenceValueRoute("rules.square.event.control@1", edge(distinct, input.moveUci));
      expect(scoped.length).toBe(initial.length);
      expect(evidenceValueReceipt(scoped[0]!).inputDigest).not.toBe(receipts[0]!.inputDigest);
    }
  } finally { spy.mockRestore(); }
});

it("D3840 retains an honest empty edge population without bypassing invalid requests", () => {
  const input = edge("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 7922", "e2e4");
  const route = "rules.transition.event.capture@1";
  const empty = invokeEvidenceValueRoute(route, input);
  expect(empty).toEqual([]);
  expect(Object.isFrozen(empty)).toBe(true);
  expect(invokeEvidenceValueRoute(route, input)).toBe(empty);
  for (let repeat = 0; repeat < 2; repeat++) {
    expect(() => invokeEvidenceValueRoute(route, { ...input, moveUci: "e2e5" })).toThrow();
    expect(() => invokeEvidenceValueRoute(route, { ...input, afterFen: input.beforeFen })).toThrow();
    expect(() => invokeEvidenceValueRoute(route, { ...input, afterFen: input.afterFen.replace("0 7922", "1 7922") })).toThrow();
    expect(() => invokeEvidenceValueRoute(route, { ...input, extra: true } as unknown as typeof input)).toThrow();
  }
  expect(invokeEvidenceValueRoute(route, input)).toBe(empty);
});

// The predecessor's hashed per-family join, independent of the production string keys.
function structuralReference(input: ReturnType<typeof edge>) {
  const key = (value: ReturnType<typeof structuralReading>["features"][number]) => {
    const image: Record<string, unknown> = { kind: value.kind };
    for (const field of ["color", "role", "file", "shade", "form", "zone"] as const) if (value[field] !== undefined) image[field] = value[field];
    image.squares = value.kind === "king_zone" ? [] : value.squares;
    return evidenceContract.evidenceDigest(image);
  };
  const before = structuralReading(input.beforeFen).features, after = structuralReading(input.afterFen).features;
  return STRUCTURAL_EVENT_FAMILIES.flatMap(family => {
    const left = new Map(before.filter(value => value.kind === family).map(value => [key(value), value]));
    const right = new Map(after.filter(value => value.kind === family).map(value => [key(value), value]));
    return [...new Set([...left.keys(), ...right.keys()])].map(subject => ({ before_fen: input.beforeFen,
      move_uci: input.moveUci, after_fen: input.afterFen, family, before: left.get(subject) ?? null, after: right.get(subject) ?? null }));
  });
}

it.each(["w", "b"])("uses exact private %s structural join keys without hashing or caching subjects", (turn) => {
  const fen = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${turn} KQkq - 0 7201`;
  const first = edge(fen, turn === "w" ? "e2e4" : "e7e5");
  const second = edge(fen, turn === "w" ? "d2d4" : "d7d5");
  const later = edge(first.afterFen, turn === "w" ? "e7e5" : "e2e4");
  const clock = edge(fen.replace(" 0 7201", " 12 7201"), first.moveUci);
  const inputs = [first, second, first, later, second, clock];
  const expected = inputs.map(structuralReference);
  const digest = evidenceContract.evidenceDigest;
  let hashed = 0;
  const spy = vi.spyOn(evidenceContract, "evidenceDigest").mockImplementation(value => {
    if (value !== null && typeof value === "object" && "kind" in value && "squares" in value) hashed++;
    return digest(value);
  });
  try {
    inputs.forEach((input, index) => {
      const actual = structuralSemanticEventPayloads(input.beforeFen, input.moveUci, input.afterFen);
      expect(JSON.stringify(actual)).toBe(JSON.stringify(expected[index]));
      expect(hashed).toBe(0);
      expect(Object.isFrozen(actual)).toBe(true);
    });
    const beforeFailure = hashed;
    expect(() => structuralSemanticEventPayloads(clock.beforeFen, clock.moveUci, second.afterFen)).toThrow();
    expect(hashed).toBe(beforeFailure);
    const again = structuralSemanticEventPayloads(clock.beforeFen, clock.moveUci, clock.afterFen);
    expect(JSON.stringify(again)).toBe(JSON.stringify(expected.at(-1)));
    expect(hashed).toBe(beforeFailure);
  } finally { spy.mockRestore(); }
});

it.each(["w", "b"])("uses private %s structural join keys through the unchanged sealed family factory", turn => {
  const fen = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${turn} KQkq - 0 7203`;
  const inputs = [edge(fen, turn === "w" ? "e2e4" : "e7e5"), edge(fen, turn === "w" ? "d2d4" : "d7d5")];
  const expected = inputs.map(structuralReference);
  const digest = evidenceContract.evidenceDigest;
  let hashed = 0;
  const spy = vi.spyOn(evidenceContract, "evidenceDigest").mockImplementation(value => {
    if (value !== null && typeof value === "object" && "kind" in value && "squares" in value) hashed++;
    return digest(value);
  });
  try {
    inputs.forEach((input, index) => {
      const values = invokeEvidenceValueRoute("rules.structural.event.piece_count@1", input);
      expect(hashed).toBe(0);
      expect(JSON.stringify(values.map(value => value.payload))).toBe(JSON.stringify(expected[index]!.filter(value => value.family === "piece_count")));
      const receipts = values.map(evidenceValueReceipt);
      expect(values.length).toBeGreaterThan(0);
      expect(JSON.stringify(invokeEvidenceValueRoute("rules.structural.event.piece_count@1", input).map(evidenceValueReceipt))).toBe(JSON.stringify(receipts));
      expect(hashed).toBe(0);
    });
  } finally { spy.mockRestore(); }
});

it("never reuses a caller-injected structural reading or mistakes it for the production authority", () => {
  const input = edge("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 7202", "e2e4");
  let marker = 100;
  const read = (fen: string) => ({ ...structuralReading(fen), features: [Object.freeze({ kind: "piece_count" as const, color: "white" as const, role: "pawn" as const, squares: [], count: marker })] });
  const first = structuralSemanticEventPayloads(input.beforeFen, input.moveUci, input.afterFen, read);
  marker = 101;
  const second = structuralSemanticEventPayloads(input.beforeFen, input.moveUci, input.afterFen, read);
  expect(first).toHaveLength(1);
  expect(second).toHaveLength(1);
  expect(first[0]!.before?.count).toBe(100);
  expect(second[0]!.before?.count).toBe(101);
  const actual = structuralSemanticEventPayloads(input.beforeFen, input.moveUci, input.afterFen);
  const reference = structuralSemanticEventPayloads(input.beforeFen, input.moveUci, input.afterFen, fen => structuralReading(fen));
  expect(JSON.stringify(actual)).toBe(JSON.stringify(reference));
  expect(actual.length).toBeGreaterThan(20);
});

// An independent array/Set join, not the production indexed-map implementation.
function reference(input: ReturnType<typeof edge>): SquareControlEvents {
  const before = squareControlReading(input.beforeFen), after = squareControlReading(input.afterFen);
  const events: SquareControlEvent[] = [], legalAvailability: SquareControlEvents["legalAvailability"][number][] = [];
  const flattened = (squares: readonly ControlledSquare[]) => squares.flatMap(({ target, controllers }) => controllers.map((controller) => ({ target, controller })));
  const key = (entry: { target: SquareName; controller: ControlledSquare["controllers"][number] }) =>
    `${entry.target}:${entry.controller.square}:${entry.controller.piece.color}:${entry.controller.piece.role}:${entry.controller.piece.promoted ? 1 : 0}`;
  for (const color of ["white", "black"] as const) {
    const left = before.colors.find((reading) => reading.color === color)!;
    const right = after.colors.find((reading) => reading.color === color)!;
    legalAvailability.push({ color, before: left.legal.kind, after: right.legal.kind });
    for (const [mode, leftSquares, rightSquares] of [
      ["pseudo", left.pseudo, right.pseudo],
      ...(left.legal.kind === "available" && right.legal.kind === "available" ? [["legal", left.legal.squares, right.legal.squares] as const] : []),
    ] as const) {
      const leftEdges = flattened(leftSquares), rightEdges = flattened(rightSquares);
      const leftKeys = new Set(leftEdges.map(key)), rightKeys = new Set(rightEdges.map(key));
      for (const value of rightEdges) if (!leftKeys.has(key(value))) events.push({ ...input, color, mode, sign: "gained", ...value });
      for (const value of leftEdges) if (!rightKeys.has(key(value))) events.push({ ...input, color, mode, sign: "lost", ...value });
    }
  }
  events.sort((a, b) => a.color.localeCompare(b.color) || a.mode.localeCompare(b.mode) || a.target.localeCompare(b.target)
    || a.controller.square.localeCompare(b.controller.square) || a.sign.localeCompare(b.sign));
  return { events, legalAvailability };
}

it.each(["w", "b"])("serializes each structural sort operand once for %s without changing legacy ordering", (turn) => {
  const stringify = JSON.stringify;
  const calls = new Map<object, number>();
  const spy = vi.spyOn(JSON, "stringify").mockImplementation((value, ...args) => {
    if (value !== null && typeof value === "object" && "kind" in value && "squares" in value) {
      calls.set(value, (calls.get(value) ?? 0) + 1);
    }
    return stringify(value, ...args);
  });
  let reading: ReturnType<typeof structuralReading>;
  try { reading = structuralReading(`rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${turn} KQkq - 0 7001`); }
  finally { spy.mockRestore(); }
  expect(reading.features.length).toBeGreaterThan(20);
  for (const feature of reading.features) expect(calls.get(feature)).toBe(1);
  const expected = [...reading.features].sort((a, b) => STRUCTURAL_FEATURE_KINDS.indexOf(a.kind) - STRUCTURAL_FEATURE_KINDS.indexOf(b.kind)
    || stringify(a).localeCompare(stringify(b)));
  expect(stringify(reading.features)).toBe(stringify(expected));
  expect(Object.isFrozen(reading.features)).toBe(true);
});

it("reuses only four before indexes and rebuilds them after a different before position", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 7002";
  const first = edge(fen, "e2e4"), second = edge(fen, "d2d4"), later = edge(first.afterFen, "e7e5");
  const differentClock = edge(fen.replace("- 0 7002", "- 11 7002"), "d2d4");
  const inputs = [first, second, first, later, second, differentClock];
  const expected = inputs.map(reference); // Warm source readings, never the production indexes.
  const nativeSet = Map.prototype.set;
  const built = new Set<Map<unknown, unknown>>();
  const spy = vi.spyOn(Map.prototype, "set").mockImplementation(function(this: Map<unknown, unknown>, key, value) {
    if (value !== null && typeof value === "object" && "target" in value && "controller" in value) built.add(this);
    return nativeSet.call(this, key, value);
  });
  try {
    inputs.forEach((input, index) => {
      const actual = squareControlEvents(input.beforeFen, input.moveUci, input.afterFen);
      expect(JSON.stringify(actual)).toBe(JSON.stringify(expected[index]));
      expect(Object.isFrozen(actual.events)).toBe(true);
      expect(built.size).toBe([8, 12, 16, 24, 32, 40][index]);
    });
  } finally { spy.mockRestore(); }
});

it.each(["w", "b"])("reuses only the latest complete %s control delta, including refusals and immutable operands", (turn) => {
  const fen = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${turn} KQkq - 0 7101`;
  const first = edge(fen, turn === "w" ? "e2e4" : "e7e5");
  const second = edge(fen, turn === "w" ? "d2d4" : "d7d5");
  const expected = reference(first);
  const nativeSet = Map.prototype.set;
  const built = new Set<Map<unknown, unknown>>();
  const spy = vi.spyOn(Map.prototype, "set").mockImplementation(function(this: Map<unknown, unknown>, key, value) {
    if (value !== null && typeof value === "object" && "target" in value && "controller" in value) built.add(this);
    return nativeSet.call(this, key, value);
  });
  try {
    const initial = squareControlEvents(first.beforeFen, first.moveUci, first.afterFen);
    expect(JSON.stringify(initial)).toBe(JSON.stringify(expected));
    expect(built.size).toBe(8);
    expect(squareControlEvents(first.beforeFen, first.moveUci, first.afterFen)).toBe(initial);
    expect(built.size).toBe(8); // No repeated after-index construction or join/sort.
    const value = initial.events[0]!;
    expect(() => { (value.controller.piece as { role: string }).role = "king"; }).toThrow(TypeError);
    expect(() => { (initial.events as SquareControlEvent[]).pop(); }).toThrow(TypeError);
    for (let repeat = 0; repeat < 2; repeat++) {
      expect(() => squareControlEvents(first.beforeFen, first.moveUci, second.afterFen)).toThrow("After FEN does not match");
      expect(() => squareControlEvents(first.beforeFen, "a1a8", first.afterFen)).toThrow("Illegal move UCI");
      expect(() => squareControlEvents(first.beforeFen, first.moveUci, first.afterFen.replace(/ \d+ \d+$/u, " 17 7102"))).toThrow("After FEN does not match");
    }
    expect(squareControlEvents(first.beforeFen, first.moveUci, first.afterFen)).toBe(initial);
    expect(built.size).toBe(8); // Failed reads neither produce a hit nor replace the successful entry.
    squareControlEvents(second.beforeFen, second.moveUci, second.afterFen);
    expect(built.size).toBe(12);
    const rebuilt = squareControlEvents(first.beforeFen, first.moveUci, first.afterFen);
    expect(rebuilt).not.toBe(initial); // One retained result, not a per-edge history cache.
    expect(JSON.stringify(rebuilt)).toBe(JSON.stringify(expected));
    expect(built.size).toBe(16);
    const clock = edge(fen.replace(" 0 7101", " 12 7101"), first.moveUci);
    const changedClock = squareControlEvents(clock.beforeFen, clock.moveUci, clock.afterFen);
    expect(changedClock).not.toBe(rebuilt);
    expect(JSON.stringify(changedClock)).toBe(JSON.stringify(reference(clock)));
    expect(changedClock.events.every(event => event.beforeFen === clock.beforeFen)).toBe(true);
  } finally { spy.mockRestore(); }
});

it.each(["w", "b"])("shares the complete %s control delta inside the actual sealed semantic closure", (turn) => {
  const input = edge(`rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${turn} KQkq - 0 7103`, turn === "w" ? "e2e4" : "e7e5");
  const expected = reference(input);
  const nativeSet = Map.prototype.set;
  const built = new Set<Map<unknown, unknown>>();
  const spy = vi.spyOn(Map.prototype, "set").mockImplementation(function(this: Map<unknown, unknown>, key, value) {
    if (value !== null && typeof value === "object" && "target" in value && "controller" in value) built.add(this);
    return nativeSet.call(this, key, value);
  });
  try {
    const closure = localSemanticEventClosure(input.beforeFen, input.moveUci, input.afterFen);
    const controls = closure.events.filter(event => event.projection.id === "rules.square.event.control");
    expect(controls.length).toBe(expected.events.length);
    expect(controls.map(event => event.operands)).toEqual(expect.arrayContaining([...expected.events]));
    expect(built.size).toBe(8); // The control source and defender-exposure source share the same full delta.
    const receiptImage = (events: typeof closure.events) => events.map(event => ({
      event, receipt: evidenceValueReceipt(event.evidence), inputs: event.derivationInputs.map(evidenceValueReceipt),
    }));
    const repeated = localSemanticEventClosure(input.beforeFen, input.moveUci, input.afterFen);
    expect(JSON.stringify(receiptImage(repeated.events))).toBe(JSON.stringify(receiptImage(closure.events)));
    expect(repeated.abstentions).toEqual(closure.abstentions);
    expect(built.size).toBe(8);
  } finally { spy.mockRestore(); }
});

it.each([
  ["4k3/8/8/8/8/8/8/4K2R w K - 0 7003", "e1h1"],
  ["4k2r/8/8/8/8/8/8/4K3 b k - 0 7003", "e8h8"],
  ["4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 7003", "e5d6"],
  ["4k3/8/8/8/3Pp3/8/8/4K3 b - d3 0 7003", "e4d3"],
  ["1r6/P7/7k/8/8/8/8/7K w - - 0 7003", "a7b8q"],
  ["7k/8/8/8/8/7K/p7/1R6 b - - 0 7003", "a2b1q"],
])("keeps exact special-move deltas and turn-clone abstentions: %s %s", (fen, uci) => {
  const input = edge(fen, uci), expected = reference(input);
  const initial = squareControlEvents(input.beforeFen, input.moveUci, input.afterFen);
  expect(JSON.stringify(structuralSemanticEventPayloads(input.beforeFen, input.moveUci, input.afterFen))).toBe(JSON.stringify(structuralReference(input)));
  for (let repeat = 0; repeat < 2; repeat++) {
    const actual = squareControlEvents(input.beforeFen, input.moveUci, input.afterFen);
    expect(actual).toBe(initial);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
  }
  expect(expected.events.length).toBeGreaterThan(0);
});

it.each([
  { fen: "4k3/8/8/8/8/8/8/R6K w - - 0 7004", uci: "a1e1", color: "white" },
  { fen: "r6k/8/8/8/8/8/8/4K3 b - - 0 7004", uci: "a8e8", color: "black" },
])("keeps $color check's unavailable turn clone out of legal deltas", ({ fen, uci, color }) => {
  const input = edge(fen, uci), expected = reference(input);
  expect(expected.legalAvailability.find((value) => value.color === color)?.after).toBe("unavailable");
  expect(expected.events.some((value) => value.color === color && value.mode === "pseudo")).toBe(true);
  expect(expected.events.some((value) => value.color === color && value.mode === "legal")).toBe(false);
  const initial = squareControlEvents(input.beforeFen, input.moveUci, input.afterFen);
  for (let repeat = 0; repeat < 2; repeat++) {
    const actual = squareControlEvents(input.beforeFen, input.moveUci, input.afterFen);
    expect(actual).toBe(initial);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
  }
});
