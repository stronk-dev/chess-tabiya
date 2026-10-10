// DISPOSABLE D3662 contract probe. Not a production adapter, trait or replay authority.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CANDIDATE_EVENTS_SCOPE, CANDIDATE_WIDE_SCOPE, assertCandidatePopulationReceipt,
  compileCandidatePopulation, type CandidatePopulationReceipt,
} from "../../packages/runtime/src/candidate-population.js";
import {
  compileBotLegalMoveMap, sealBotRootAuthority, type BotConsideredRow,
  type BotExactLegalMoveMap, type BotOperationRootAuthority,
} from "../../apps/server/src/bot-policy-compiler.js";
import { reconstructMaiaDistribution } from "../../apps/server/src/bot-policy-catalog.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const head = `sha256:${"a".repeat(64)}`;
const root = sealBotRootAuthority({ runId: "bot-contract", branchId: "main", nodeId: "root",
  preCommitEventHeadDigest: head, startFen: START, historyUci: [], seed: 7 });
const legal = compileBotLegalMoveMap(root);
function packet(fen = START, scope = CANDIDATE_WIDE_SCOPE): CandidatePopulationReceipt {
  const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope });
  if (result.kind !== "ready") throw new Error(JSON.stringify(result.error));
  return result.receipt;
}
const wide = packet();
type SourceRow = CandidatePopulationReceipt["packet"]["candidates"][number];
// The compiler must catch the obsolete declared path, not just a prose search.
// @ts-expect-error Receipt has packet.candidates, never rows[].features.
type ObsoleteRows = CandidatePopulationReceipt["rows"];
const stageAFeatures: BotConsideredRow["features"] = [];

function equalUnique(left: readonly string[], right: readonly string[]): boolean {
  const values = new Set(left);
  return values.size === left.length && new Set(right).size === right.length
    && left.length === right.length && right.every((value) => values.has(value));
}

// Pure join only. Root/legal/returned-provider admission must remain INSIDE the real
// compiler's existing private seal boundary; this probe does not simulate those seals.
function join(receipt: CandidatePopulationReceipt, ownedRoot: BotOperationRootAuthority,
  ownedLegal: BotExactLegalMoveMap, returned: readonly string[]) {
  assertCandidatePopulationReceipt(receipt);
  const source = receipt.packet;
  if (receipt.selectedMember !== "events_and_readings") throw new TypeError("narrow scope");
  if (source.beforeFen !== ownedRoot.beforeFen || ownedLegal.root !== ownedRoot.identity)
    throw new TypeError("crossed root");
  if (!equalUnique(source.legalMoves.map((move) => move.uci), ownedLegal.moves)
    || !equalUnique(source.candidates.map((row) => row.moveUci), ownedLegal.moves))
    throw new TypeError("crossed legal population");
  if (returned.length === 0 || new Set(returned).size !== returned.length)
    throw new TypeError("empty or duplicate Maia population");
  const byMove = new Map(source.candidates.map((row) => [row.moveUci, row]));
  const rows: SourceRow[] = returned.map((move) => {
    const row = byMove.get(move);
    if (row === undefined) throw new TypeError("illegal Maia move");
    return row;
  });
  const retained = new Set(returned);
  return Object.freeze({ packet: receipt, root: ownedRoot.identity,
    legalMapDigest: ownedLegal.digest, rows: Object.freeze(rows),
    omittedMoves: Object.freeze(ownedLegal.moves.filter((move) => !retained.has(move))),
    coverage: rows.length === ownedLegal.moves.length ? "legal_set_equal" : "bounded_subset" });
}

describe("D3662 actual Stage-B packet operands (disposable author probe)", () => {
  it("demonstrates the old path is absent without widening delivered Stage A", () => {
    expect(wide).not.toHaveProperty("rows");
    expect(wide.packet.candidates.every((row) => !("features" in row))).toBe(true);
    expect(stageAFeatures).toEqual([]);
  });
  it("retains each actual row and all three evidence collections by reference", () => {
    const subset = join(wide, root, legal, ["e2e4", "g1f3"]);
    expect(subset.coverage).toBe("bounded_subset");
    expect(subset.omittedMoves).toHaveLength(18);
    for (const row of subset.rows) {
      const original = wide.packet.candidates.find((value) => value.moveUci === row.moveUci)!;
      expect(row).toBe(original);
      expect(row.events).toBe(original.events);
      expect(row.readings).toBe(original.readings);
      expect(row.abstentions).toBe(original.abstentions);
      expect(row.events.length + row.readings.length).toBeGreaterThan(0);
    }
    expect(subset.packet).toBe(wide);
  });
  it("derives complete coverage from exact membership, not Maia requested width", () => {
    const subset = join(wide, root, legal, [...legal.moves].reverse());
    expect(subset.coverage).toBe("legal_set_equal");
    expect(subset.omittedMoves).toEqual([]);
    expect(subset.rows.map((row) => row.moveUci)).toEqual([...legal.moves].reverse());
  });
  it("keeps alternatives discarded by top-p and those with zero returned mass", () => {
    const sampled = reconstructMaiaDistribution([
      { moveUci: "e2e4", mass: 0.9 }, { moveUci: "d2d4", mass: 0.1 },
      { moveUci: "g1f3", mass: 0 },
    ], 0.8, 0.92);
    expect(sampled.rows.filter((row) => row.finalMass === 0).length).toBeGreaterThan(0);
    expect(join(wide, root, legal, sampled.rows.map((row) => row.moveUci)).rows).toHaveLength(3);
  });
  it.each([
    { moves: [] }, { moves: ["e2e4", "e2e4"] }, { moves: ["e2e5"] },
    { moves: ["e2e4", "e2e5"] },
  ])(
    "refuses a missing, duplicate or illegal returned population: $moves", ({ moves }) => {
      expect(() => join(wide, root, legal, moves)).toThrow();
    });
  it.each([
    { name: "castling", fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", moves: ["e1h1", "e1a1"] },
    { name: "en passant", fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", moves: ["e5d6"] },
    { name: "promotion", fen: "4k3/P7/8/8/8/8/8/4K3 w - - 0 1", moves: ["a7a8q", "a7a8r", "a7a8b", "a7a8n"] },
  ])("preserves exact $name identities rather than from/to or UCI arithmetic", ({ fen, moves }) => {
    const ownedRoot = sealBotRootAuthority({ runId: "special", branchId: "main", nodeId: "root",
      preCommitEventHeadDigest: head, startFen: fen, historyUci: [], seed: 7 });
    const receipt = packet(fen);
    const subset = join(receipt, ownedRoot, compileBotLegalMoveMap(ownedRoot), moves);
    expect(subset.rows.map((row) => row.moveUci)).toEqual(moves);
    for (const row of subset.rows)
      expect(row).toBe(receipt.packet.candidates.find((candidate) => candidate.moveUci === row.moveUci));
  });
  it("refuses a JSON copy even with byte-identical packet content", () => {
    expect(() => join(JSON.parse(JSON.stringify(wide)), root, legal, ["e2e4"])).toThrow();
  });
  it("refuses a narrower genuine receipt rather than treating missing readings as empty", () => {
    const result = compileCandidatePopulation({ beforeFen: START, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
    if (result.kind !== "ready") throw new Error("fixture unavailable");
    expect(() => join(result.receipt, root, legal, ["e2e4"])).toThrow("narrow scope");
  });
  it("refuses same-cardinality and duplicate legal populations", () => {
    for (const moves of [[...legal.moves.slice(1), "e2e5"], [...legal.moves.slice(1), legal.moves[1]!]])
      expect(() => join(wide, root, { ...legal, moves }, ["e2e4"])).toThrow("crossed legal population");
  });
  it("binds a reusable position packet to each exact operation root", () => {
    const other = sealBotRootAuthority({ runId: "another-run", branchId: "other", nodeId: "other-root",
      preCommitEventHeadDigest: head, startFen: START, historyUci: [], seed: 19 });
    expect(() => join(wide, other, legal, ["e2e4"])).toThrow("crossed root");
    const subset = join(wide, other, compileBotLegalMoveMap(other), ["e2e4"]);
    expect(subset.root).toBe(other.identity);
    expect(subset.root).not.toEqual(root.identity);
    expect(subset.packet).toBe(wide);
  });
  it("does not permit a packet from the wrong canonical position", () => {
    const moved = sealBotRootAuthority({ runId: "bot-contract", branchId: "main", nodeId: "next",
      preCommitEventHeadDigest: head, startFen: START, historyUci: ["e2e4"], seed: 7 });
    expect(() => join(wide, moved, compileBotLegalMoveMap(moved), ["e7e5"])).toThrow("crossed root");
  });
  it("keeps the production, versioned replay and real-profile gate explicit", () => {
    const rfc = readFileSync(new URL("../../rfc/bot-policy.md", import.meta.url), "utf8");
    expect(rfc).toContain("Persistence gate, explicitly unresolved");
    expect(rfc).toContain("Held for independent review");
    expect(rfc).not.toContain('CandidatePopulationReceipt["rows"][number]["features"][number]["id"]');
  });
});
