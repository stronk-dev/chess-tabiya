import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";
import { deriveMaiaExactFenMoveOccurrence, deriveMaiaRunMoveOccurrence, recordedEdgeEvidence } from "./evidence-operations.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { resolveRunSubject } from "./run-subject.js";
import { fork, rewind } from "./runtime.js";
import { commitMove } from "./runtime.js";
import { occurrenceFixture, occurrencePage, occurrenceRef, occurrenceRun } from "./testing/maia-occurrence-fixture.js";
import { FIXTURE_AT } from "./provider-test-fixtures.js";

describe("exact Maia policy occurrence authority", () => {
  it("joins the full history-conditioned page to a historical edge, retaining its exact head", () => {
    const historical = occurrenceRun(["g1f3", "g8f6", "e2e4"]);
    const current = commitMove(historical, "e7e5", { at: FIXTURE_AT }).run;
    const page = occurrencePage({ kind: "history_conditioned", startFen: INITIAL_FEN, historyUci: ["g1f3", "g8f6"] }, "e2e4");
    const ref = occurrenceRef(current, historical.nodes.at(-1)!, historical.events.length);
    const resolved = resolveRunSubject(current, ref);
    const occurrence = deriveMaiaRunMoveOccurrence(page, resolved);
    expect(occurrence.projection).toEqual({ id: "derived.maia.run_move_occurrence", version: 1 });
    expect(occurrence.payload.page).toBe(page);
    expect(occurrence.payload.run).toEqual({ runId: current.id, eventHeadDigest: ref.eventHeadDigest,
      startFen: INITIAL_FEN, historyUci: ["g1f3", "g8f6"], reachedFen: historical.nodes.at(-2)!.fen, playedMoveUci: "e2e4" });
    expect(Object.isFrozen(occurrence.payload.run.historyUci)).toBe(true);
    expect(evidenceValueReceipt(occurrence).sourceDigests).toHaveLength(2);
  });

  it("refuses an equal final FEN reached by a different ordered history", () => {
    const moves = ["g1f3", "g8f6", "b1c3", "b8c6"];
    const transposed = ["b1c3", "b8c6", "g1f3", "g8f6"];
    const before = occurrenceRun(moves);
    expect(before.nodes.at(-1)!.fen).toBe(occurrenceRun(transposed).nodes.at(-1)!.fen);
    const played = commitMove(before, "e2e4", { at: FIXTURE_AT }).run;
    const resolved = resolveRunSubject(played, occurrenceRef(played));
    expect(() => deriveMaiaRunMoveOccurrence(occurrencePage({ kind: "history_conditioned", startFen: INITIAL_FEN, historyUci: transposed }), resolved)).toThrow(/history identity/u);
    expect(deriveMaiaRunMoveOccurrence(occurrencePage({ kind: "history_conditioned", startFen: INITIAL_FEN, historyUci: moves }), resolved).payload.run.historyUci).toEqual(moves);
  });

  it("refuses a changed starting clock and replays every prior stored edge", () => {
    const { page: _page, resolved } = occurrenceFixture();
    const clockChanged = occurrencePage({ kind: "history_conditioned", startFen: INITIAL_FEN.replace("0 1", "1 1"), historyUci: [] });
    expect(() => deriveMaiaRunMoveOccurrence(clockChanged, resolved)).toThrow(/history identity/u);
    const run = occurrenceRun(["e2e4", "e7e5", "g1f3"]);
    const events = run.events.map(event => event.type === "move.committed" && event.data.node.moveUci === "e2e4"
      ? { ...event, data: { ...event.data, node: { ...event.data.node, fen: event.data.node.fen.replace("0 1", "0 7") } } } : event);
    const corrupt = { ...run, events };
    const page = occurrencePage({ kind: "history_conditioned", startFen: INITIAL_FEN, historyUci: ["e2e4", "e7e5"] }, "g1f3");
    expect(() => deriveMaiaRunMoveOccurrence(page, resolveRunSubject(corrupt, occurrenceRef(corrupt)))).toThrow(/FEN|replay/u);
  });

  it("keeps branch occurrence receipts distinct even for equal paths and moves under one head", () => {
    const first = occurrenceRun();
    const root = first.nodes[0]!;
    const branch = fork(rewind(first, root.id, FIXTURE_AT).run, root.id, { at: FIXTURE_AT, label: "second" }).run;
    const current = commitMove(branch, "e2e4", { at: FIXTURE_AT }).run;
    const page = occurrencePage({ kind: "history_conditioned", startFen: INITIAL_FEN, historyUci: [] });
    const left = deriveMaiaRunMoveOccurrence(page, resolveRunSubject(current, occurrenceRef(current, first.nodes.at(-1)!)));
    const right = deriveMaiaRunMoveOccurrence(page, resolveRunSubject(current, occurrenceRef(current)));
    expect(left.payload.run).toEqual(right.payload.run);
    expect(evidenceValueReceipt(left).inputDigest).not.toBe(evidenceValueReceipt(right).inputDigest);
    expect(evidenceValueReceipt(left).sourceDigests).not.toEqual(evidenceValueReceipt(right).sourceDigests);
  });

  it("refuses crossed recorded edges, unknown/future heads and wrong subject grains", () => {
    const { page, run, resolved, edge } = occurrenceFixture();
    const another = occurrenceRun(["d2d4"], "other-run");
    const crossed = recordedEdgeEvidence(another, another.nodes[0]!, another.nodes[1]!);
    expect(() => invokeEvidenceValueRoute("derived.maia.run_move_occurrence@1", { page, resolved, edge: crossed })).toThrow(/edge identity/u);
    expect(() => resolveRunSubject(run, { ...occurrenceRef(run), eventHeadDigest: occurrenceRef(another).eventHeadDigest })).toThrow();
    const prefix = resolveRunSubject(run, { kind: "run_prefix", runId: run.id, eventHeadDigest: occurrenceRef(run).eventHeadDigest });
    expect(() => deriveMaiaRunMoveOccurrence(page, prefix)).toThrow(/run edge/u);
    expect(() => invokeEvidenceValueRoute("derived.maia.run_move_occurrence@1", { page, resolved, edge, historyUci: [] } as never)).toThrow(/extra/u);
  });

  it("never accepts bare/spread/JSON provider data or a forged run subject seal", () => {
    const { page, resolved } = occurrenceFixture();
    for (const candidate of [page.payload, page.payload.payload, { ...page }, JSON.parse(JSON.stringify(page))]) {
      expect(() => deriveMaiaRunMoveOccurrence(candidate as never, resolved)).toThrow();
      expect(() => deriveMaiaExactFenMoveOccurrence(candidate as never, "e2e4")).toThrow();
    }
    for (const candidate of [{ ...resolved }, JSON.parse(JSON.stringify(resolved))]) expect(() => deriveMaiaRunMoveOccurrence(page, candidate as never)).toThrow(/Unresolved/u);
  });

  it("separates history-conditioned from exact-FEN occurrences even at an equal position", () => {
    const { page, resolved } = occurrenceFixture();
    const exact = occurrencePage({ kind: "exact_fen", fen: INITIAL_FEN });
    expect(() => deriveMaiaRunMoveOccurrence(exact, resolved)).toThrow(/history-conditioned/u);
    expect(() => deriveMaiaExactFenMoveOccurrence(page, "e2e4")).toThrow(/exact-FEN/u);
    const occurrence = deriveMaiaExactFenMoveOccurrence(exact, "e2e4");
    expect(occurrence.payload).toEqual({ page: exact, position: { fen: INITIAL_FEN, observedMoveUci: "e2e4" } });
    expect(occurrence.payload).not.toHaveProperty("run");
    expect(evidenceValueReceipt(occurrence).sourceDigests).toHaveLength(1);
  });

  it("keeps a legal observed move absent from top-k unobserved instead of inventing probability zero", () => {
    const page = occurrencePage({ kind: "exact_fen", fen: INITIAL_FEN }, "d2d4");
    const result = deriveMaiaExactFenMoveOccurrence(page, "e2e4");
    expect(result.payload.page).toBe(page);
    expect(result.payload.page.payload.payload.candidates).toEqual([{ moveUci: "d2d4", probability: 0.4 }]);
    expect(result.payload).not.toHaveProperty("probability");
    expect(result.payload).not.toHaveProperty("quality");
    expect(() => deriveMaiaExactFenMoveOccurrence(page, "e2e5")).toThrow();
  });

  it("retains all six FEN fields and refuses noncanonical castling or promotion identities", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    const page = occurrencePage({ kind: "exact_fen", fen }, "e1g1");
    expect(deriveMaiaExactFenMoveOccurrence(page, "e1h1").payload.position).toEqual({ fen, observedMoveUci: "e1h1" });
    expect(() => deriveMaiaExactFenMoveOccurrence(page, "e1g1")).toThrow();
    const promoted = occurrencePage({ kind: "exact_fen", fen: "8/P7/8/8/8/8/8/k6K w - - 0 1" }, "a7a8q");
    expect(deriveMaiaExactFenMoveOccurrence(promoted, "a7a8n").payload.position.observedMoveUci).toBe("a7a8n");
    expect(() => deriveMaiaExactFenMoveOccurrence(promoted, "a7a8")).toThrow();
  });
});
