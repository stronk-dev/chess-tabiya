import { describe, expect, it } from "vitest";
import { parseRecordedAnalyzeLineOperands, renderRecordedAnalyzeLine } from "./recorded-analyze-presentation.js";

const typed = { kind: "line", sourceArm: "typed_pv", reviewedMove: { fullmove: 4, side: "black", san: "Nf6" },
  engine: { id: "stockfish-analysis", name: "Stockfish", version: "19" }, bound: { kind: "movetime", requestedMs: 100 },
  lineScope: { kind: "typed_request", maxPlies: 2, truncated: true },
  line: [{ fullmove: 4, side: "black", san: "d5" }, { fullmove: 5, side: "white", san: "exd5" }] };
const parse = (value: unknown) => parseRecordedAnalyzeLineOperands(value, "Analyze operands");

describe("accepted recorded Analyze closed prose operands (not source admission)", () => {
  it("retains Black-first numbering, exact engine/bound and original recorded ply scope", () => {
    const operands = parse(typed), sentence = renderRecordedAnalyzeLine(operands);
    expect(sentence).toContain("Stockfish 19 (100 ms search)");
    expect(sentence).toContain("4… Nf6"); expect(sentence).toContain("4… d5 5. exd5");
    expect(sentence).toContain("2 plies"); expect(sentence).toContain("longer line");
    expect(sentence).toContain("not advice"); expect(operands).toEqual(typed);
    expect(Object.isFrozen(operands)).toBe(true); expect(Object.isFrozen(typed)).toBe(false);
  });
  it.each(["recorded_bestline", "recorded_search_first"])("states only the saved report's attribution for %s", sourceArm => {
    const value = { ...typed, sourceArm, engine: { id: "saved-engine", name: null, version: null }, lineScope: { kind: "recorded_report" },
      line: sourceArm === "recorded_search_first" ? typed.line.slice(0, 1) : typed.line };
    const sentence = renderRecordedAnalyzeLine(parse(value));
    expect(sentence).toContain("saved report names saved-engine");
    expect(sentence).not.toContain("Stockfish 19"); expect(sentence).not.toContain("2 plies");
    if (sourceArm === "recorded_search_first") { expect(sentence).toContain("first move"); expect(sentence).not.toContain("principal variation"); }
    else expect(sentence).toContain("reported line");
  });
  it.each(["engine_unusable", "bound_unusable", "engine_and_bound_unusable"])("abstains truthfully for %s without private moves", reason => {
    const value = { kind: "unattributed", sourceArm: "recorded_bestline", reviewedMove: typed.reviewedMove, reason };
    const sentence = renderRecordedAnalyzeLine(parse(value));
    expect(sentence).toContain("not shown"); expect(sentence).toContain("4… Nf6");
    if (reason === "engine_unusable") { expect(sentence).toContain("engine attribution"); expect(sentence).not.toContain("search bound"); }
    if (reason === "bound_unusable") { expect(sentence).toContain("search bound"); expect(sentence).not.toContain("engine attribution"); }
    expect(sentence).not.toContain("d5");
    expect(() => parse({ ...value, line: typed.line })).toThrow();
  });
  it.each([
    { ...typed, extra: true }, { ...typed, line: [] }, { ...typed, bound: { kind: "movetime", requestedMs: 0 } },
    { ...typed, engine: { ...typed.engine, id: "" } }, { ...typed, engine: { ...typed.engine, name: null } },
    { ...typed, lineScope: { kind: "recorded_report" } }, { ...typed, lineScope: { kind: "typed_request", maxPlies: 1, truncated: true } },
    { ...typed, lineScope: { kind: "typed_request", maxPlies: 2, truncated: "true" } },
    { ...typed, line: [{ ...typed.line[0], fullmove: 5 }, typed.line[1]] },
    { ...typed, line: [typed.line[0], { ...typed.line[1], side: "black" }] },
    { ...typed, reviewedMove: { ...typed.reviewedMove, san: "not SAN" } },
    { ...typed, sourceArm: "recorded_bestline", engine: { id: "saved", name: "invented", version: null }, lineScope: { kind: "recorded_report" } },
    { ...typed, sourceArm: "recorded_search_first", engine: { id: "saved", name: null, version: null }, lineScope: { kind: "recorded_report" } },
  ])("rejects malformed/crossed/extra operands rather than reinterpreting them: %j", value => { expect(() => parse(value)).toThrow(); });
  it("does not execute getters or accept hidden/symbol fields, sparse arrays, prototypes or cycles", () => {
    let reads = 0;
    const getter = { ...typed }; Object.defineProperty(getter, "engine", { enumerable: true, get() { reads++; return typed.engine; } });
    const hidden = { ...typed }; Object.defineProperty(hidden, "private", { enumerable: false, value: true });
    const cycle: any = { ...typed }; cycle.line = [cycle];
    for (const value of [getter, hidden, { ...typed, [Symbol()]: 1 }, Object.create(typed), { ...typed, line: new Array(1) }, cycle]) expect(() => parse(value)).toThrow();
    expect(reads).toBe(0);
  });

  it.each([
    { kind: "movetime", requestedMs: 137, text: "137 ms search" },
    { kind: "depth", requestedDepth: 17, text: "depth 17 search" },
    { kind: "nodes", requestedNodes: 12345, text: "12345-node search" },
  ])("preserves the exact $kind bound without claiming a different instrument", ({ text, ...bound }) => {
    const result = parse({ ...typed, bound });
    expect(result).toMatchObject({ bound });
    expect(renderRecordedAnalyzeLine(result)).toContain(text);
  });

  it.each([0, -1, 0.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN])("refuses every unusable numeric bound and move/scope integer: %s", number => {
    for (const bound of [{ kind: "movetime", requestedMs: number }, { kind: "depth", requestedDepth: number }, { kind: "nodes", requestedNodes: number }]) {
      expect(() => parse({ ...typed, bound })).toThrow();
    }
    expect(() => parse({ ...typed, reviewedMove: { ...typed.reviewedMove, fullmove: number } })).toThrow();
    expect(() => parse({ ...typed, lineScope: { ...typed.lineScope, maxPlies: number } })).toThrow();
    expect(() => parse({ ...typed, line: [{ ...typed.line[0], fullmove: number }] })).toThrow();
  });

  it("keeps every White/Black SAN member, including castling, promotion and capture, without a second truncation", () => {
    // This is notation formatting, not a claim that this synthetic sequence is a legal line.
    // Complete legality and source numbering are the admitted source owner's responsibility.
    const value = { ...typed, reviewedMove: { fullmove: 20, side: "white", san: "Qh5+" },
      lineScope: { kind: "typed_request", maxPlies: 4, truncated: false },
      line: [{ fullmove: 20, side: "white", san: "O-O" }, { fullmove: 20, side: "black", san: "axb1=N+" },
        { fullmove: 21, side: "white", san: "exd6" }, { fullmove: 21, side: "black", san: "O-O-O#" }] };
    const sentence = renderRecordedAnalyzeLine(parse(value));
    expect(sentence).toContain("20. O-O axb1=N+ 21. exd6 O-O-O#");
    expect(sentence).toContain("Recorded scope: up to 4 plies.");
    expect(sentence).not.toContain("longer line");
  });

  it("detaches shared JSON aliases and every descendant without freezing or later reading caller data", () => {
    const input = structuredClone(typed);
    input.reviewedMove = input.line[0]!; // Serializable sharing is not a cycle.
    const result = parse(input);
    if (result.kind !== "line") throw new Error("Expected a line operand");
    expect(result.reviewedMove).toEqual(result.line[0]);
    expect(result.reviewedMove).not.toBe(result.line[0]);
    const descendants = [result, result.reviewedMove, result.engine, result.bound, result.lineScope, result.line, ...result.line];
    for (const value of descendants) expect(Object.isFrozen(value)).toBe(true);
    for (const value of [input, input.reviewedMove, input.engine, input.bound, input.lineScope, input.line, ...input.line]) expect(Object.isFrozen(value)).toBe(false);
    const before = renderRecordedAnalyzeLine(result);
    input.engine.name = "changed caller name";
    input.bound.requestedMs = 999;
    input.lineScope.truncated = false;
    input.line[0]!.san = "Qa1";
    input.line.push({ fullmove: 5, side: "black", san: "Qe7" });
    expect(renderRecordedAnalyzeLine(result)).toBe(before);
    expect(result.line).toHaveLength(2);
    expect(Reflect.set(result.line[0]!, "san", "Qa1")).toBe(false);
  });

  it("rejects nested getters and decorated arrays without executing them or consuming hidden data", () => {
    let reads = 0;
    const nestedGetter = structuredClone(typed);
    Object.defineProperty(nestedGetter.engine, "name", { enumerable: true, get() { reads++; return "private name"; } });
    const indexedGetter = structuredClone(typed);
    Object.defineProperty(indexedGetter.line, "0", { enumerable: true, get() { reads++; return typed.line[0]; } });
    const hidden = structuredClone(typed);
    Object.defineProperty(hidden.line[0]!, "private", { enumerable: false, value: "sentinel" });
    const symbol = structuredClone(typed);
    Object.defineProperty(symbol.bound, Symbol("private"), { enumerable: true, value: "sentinel" });
    const decorated = structuredClone(typed);
    Object.defineProperty(decorated.line, "private", { enumerable: true, value: "sentinel" });
    const nestedCycle = structuredClone(typed);
    Object.defineProperty(nestedCycle.engine, "cycle", { enumerable: true, value: nestedCycle.engine });
    const inherited = structuredClone(typed);
    Object.setPrototypeOf(inherited.reviewedMove, { private: "sentinel" });
    for (const value of [nestedGetter, indexedGetter, hidden, symbol, decorated, nestedCycle, inherited]) expect(() => parse(value)).toThrow();
    expect(reads).toBe(0);
  });

  it.each(["line", "engine", "bound", "lineScope", "candidates", "rawCapture", "text"])("does not admit private %s beside an unattributed reason", field => {
    expect(() => parse({ kind: "unattributed", sourceArm: "typed_pv", reviewedMove: typed.reviewedMove,
      reason: "engine_and_bound_unusable", [field]: field === "line" ? typed.line : "private-sentinel" })).toThrow();
  });

  it("never borrows the typed execution caveat or a ply-limit claim for either historical arm", () => {
    for (const sourceArm of ["recorded_bestline", "recorded_search_first"]) {
      const sentence = renderRecordedAnalyzeLine(parse({ ...typed, sourceArm,
        engine: { id: "literal saved engine", name: null, version: null }, lineScope: { kind: "recorded_report" },
        line: sourceArm === "recorded_search_first" ? typed.line.slice(0, 1) : typed.line }));
      expect(sentence).toContain("Historical report only, not independently verified engine execution");
      expect(sentence).not.toContain("This is the output of a bounded engine search");
      expect(sentence).not.toContain("Recorded scope:");
    }
  });
});
