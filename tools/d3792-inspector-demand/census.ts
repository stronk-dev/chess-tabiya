// Disposable D3795 author evidence, not production, semantic qualification or an ordinary CI gate.
// Inventory every accepted ref; measure real local/recorded values, never fabricate provider input.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { parsePgn, startingPosition } from "chessops/pgn";
import { makeFen } from "chessops/fen";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import { createRun, commitMove } from "../../packages/runtime/src/runtime.js";
import { canonicalRunStart } from "../../packages/runtime/src/session.js";
import { MODULE_CONSUMER_ACCEPTS, PRIMARY_EVIDENCE_MANIFEST, RECORDED_PATH_SUCCESSOR_REFS } from "../../packages/runtime/src/evidence-catalog.js";
import { evidenceForConsumer, evidenceValueReceipt, assertDeclaredEvidence, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { evidenceValueRouteRegistry, invokeEvidenceValueRoute, type EvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { moduleQuerySourceRoutes, routeReads, PACKET_ROUTE_KINDS } from "../../packages/runtime/src/module-query-sources.js";
import { compileModulePacket } from "../../packages/runtime/src/module-packets.js";
import { fitModulePresentation, inspectorFamily, witnessedEvidence, type ModuleBudgetTuple } from "../../packages/runtime/src/module-query.js";
import { presentEvidenceItems } from "../../packages/runtime/src/presentation-contract.js";
import { recordedSemanticPath } from "../../packages/runtime/src/recorded-semantic-path.js";
import { RECORDED_SEQUENCE_POSITIVES, RECORDED_SEQUENCE_HARD_NEGATIVES } from "../../packages/runtime/src/testing/recorded-sequence-fixtures.js";
import { detailPlan, detailPage, detailBatch, focusControl, DETAIL_REFS } from "./detail-model.js";
import type { Color, SquareName } from "chessops/types";
import { exactLegalMoves } from "../../packages/runtime/src/legal-moves.js";

type Sample = { label: string; fen: string; edge?: { beforeFen: string; moveUci: string; afterFen: string } };
const samples: Sample[] = [];
const games = parsePgn(readFileSync("tools/r2-selection-harness/imported-sample.pgn", "utf8")).slice(0, 8);
assert.equal(games.length, 8);
let importedEdges = 0;
for (const [index, game] of games.entries()) {
  const setup = startingPosition(game.headers);
  assert(setup.isOk, `sample ${index} has no legal start`);
  const position = setup.unwrap();
  samples.push({ label: `import-${index}-root`, fen: makeFen(position.toSetup()) });
  for (const [ply, move] of [...game.moves.mainline()].entries()) {
    const beforeFen = makeFen(position.toSetup()), parsed = parseSan(position, move.san);
    assert(parsed !== undefined, `sample ${index} ply ${ply} is illegal`);
    const moveUci = makeUci(parsed);
    position.play(parsed);
    const afterFen = makeFen(position.toSetup());
    samples.push({ label: `import-${index}-${ply + 1}`, fen: afterFen, edge: { beforeFen, moveUci, afterFen } });
    importedEdges++;
  }
}
samples.push(...[
  { label: "checkmate", fen: "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1" },
  { label: "stalemate", fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1" },
  { label: "kings-only", fen: "7k/8/6K1/8/8/8/8/8 w - - 0 1" },
]);
const refs = MODULE_CONSUMER_ACCEPTS.full_inspector;
const key = (ref: { id: string; version: number }) => `${ref.id}@${ref.version}`;
const metadata = new Map(evidenceValueRouteRegistry().map(row => [row.route, row]));
const production = new Set(moduleQuerySourceRoutes("full_inspector", refs.map(key)));
const accepted = new Set(refs.map(key));
const recordedRefs = new Set(RECORDED_PATH_SUCCESSOR_REFS.map(key));
const dimensions = ["facts", "words", "marks", "arrows"] as const;
const zero = (): ModuleBudgetTuple => ({ facts: 0, words: 0, marks: 0, arrows: 0 });
const rows = refs.map(ref => {
  const id = key(ref), meta = metadata.get(id);
  const source = routeReads(id, "fen") ? "position" : routeReads(id, "afterFen|beforeFen|moveUci") ? "incoming_edge"
    : recordedRefs.has(id) ? "recorded_window"
    : PACKET_ROUTE_KINDS[id] !== undefined && routeReads(id, "packet") ? "saved_packet" : "dependency_inputs";
  return { projection: id, family: inspectorFamily(ref.id), productionSource: production.has(id), source,
    authorityArms: meta?.arms.map(arm => Object.keys(arm).sort().join("|")) ?? [],
    calls: 0, sourceRefusals: 0, offered: 0, witnessed: 0, admitted: 0, presented: 0, fitted: 0, intrinsicOverflows: 0,
    adapterRefusals: 0, maxSoloCost: zero(), exceeded: [] as string[],
    firstAdapterRefusal: null as null | { sample: string; message: string },
    firstOverflow: null as null | { sample: string; cost: ModuleBudgetTuple; exceeded: readonly string[] } };
});
const byRef = new Map(rows.map(row => [row.projection, row]));
const detail = DETAIL_REFS.map(projection => ({ projection, values: 0, pages: 0, batches: 0, unavailableRows: 0, maxWords: 0, maxMarks: 0, maxArrows: 0, batchMaxWords: 0, batchMaxMarks: 0, batchMaxArrows: 0, refusalControls: 0 }));
const controlFocus = { requests: 0, unavailable: 0, batches: 0, maxMembers: 0, maxBatches: 0, maxWords: 0, maxMarks: 0, maxArrows: 0 };
function values(value: unknown): readonly DeclaredEvidence<unknown>[] {
  if (Array.isArray(value)) return value.flatMap(values);
  if (typeof value === "object" && value !== null && !("payload" in value)) {
    const wrapper = value as Record<string, unknown>;
    if (wrapper.kind === "unavailable" || wrapper.kind === "not_matched") return [];
    if ("evidence" in wrapper) return values(wrapper.evidence);
    if (wrapper.kind === "available") return values(wrapper.value);
  }
  assertDeclaredEvidence(value as DeclaredEvidence<unknown>);
  return [value as DeclaredEvidence<unknown>];
}
function measure(evidence: DeclaredEvidence<unknown>, sample: string): void {
  const row = byRef.get(key(evidence.projection));
  if (row === undefined) return;
  row.offered++;
  const plan = detailPlan(evidence);
  if (plan !== undefined) {
    const result = detail.find(entry => entry.projection === key(evidence.projection))!;
    const before = JSON.stringify(evidence);
    result.values++;
    for (const member of plan.rows) {
      const checkImmutable = (value: unknown): void => {
        if (typeof value !== "object" || value === null) return;
        assert(Object.isFrozen(value), "detail member contains mutable data");
        for (const child of Object.values(value)) checkImmutable(child);
      };
      checkImmutable(member.value);
      assert.equal(Reflect.set(member.value as object, "injected", "untrusted"), false);
      const page = detailPage(plan, member.ordinal, plan.digest);
      result.pages++;
      result.unavailableRows += member.kind.endsWith("unavailable") ? 1 : 0;
      result.maxWords = Math.max(result.maxWords, page.budget.words);
      result.maxMarks = Math.max(result.maxMarks, page.budget.marks);
      result.maxArrows = Math.max(result.maxArrows, page.budget.arrows);
    }
    const coverage: number[] = [];
    let start: number | null = plan.rows.length === 0 ? null : 0;
    while (start !== null) {
      const batch = detailBatch(plan, start, plan.digest);
      coverage.push(...batch.ordinals);
      result.batches++;
      result.batchMaxWords = Math.max(result.batchMaxWords, batch.budget.words);
      result.batchMaxMarks = Math.max(result.batchMaxMarks, batch.budget.marks);
      result.batchMaxArrows = Math.max(result.batchMaxArrows, batch.budget.arrows);
      start = batch.next;
    }
    assert.deepEqual(coverage, plan.rows.map(member => member.ordinal), "batch lost/duplicated a member");
    if (row.projection === "rules.square.reading.control@1") {
      for (const color of ["white", "black"] as const) for (const mode of ["geometric", "legal"] as const) for (let square = 0; square < 64; square++) {
        const target = `${"abcdefgh"[square % 8]}${1 + Math.floor(square / 8)}` as SquareName;
        const focused = focusControl(plan, color, mode, target);
        controlFocus.requests++;
        controlFocus.unavailable += focused.rows.some(member => member.kind.endsWith("unavailable")) ? 1 : 0;
        controlFocus.maxMembers = Math.max(controlFocus.maxMembers, focused.rows.length);
        let cursor: number | null = 0, batches = 0;
        const actual: number[] = [];
        while (cursor !== null) {
          const page = detailBatch(focused, cursor, focused.digest);
          actual.push(...page.sourceOrdinals);
          batches++; controlFocus.batches++;
          controlFocus.maxWords = Math.max(controlFocus.maxWords, page.budget.words);
          controlFocus.maxMarks = Math.max(controlFocus.maxMarks, page.budget.marks);
          controlFocus.maxArrows = Math.max(controlFocus.maxArrows, page.budget.arrows);
          cursor = page.next;
        }
        assert.deepEqual(actual, focused.rows.map(member => member.sourceOrdinal));
        controlFocus.maxBatches = Math.max(controlFocus.maxBatches, batches);
      }
      assert.throws(() => focusControl(plan, "white", "legal", "z9" as SquareName));
      assert.throws(() => focusControl(plan, "other" as Color, "legal", "e4"));
      assert.throws(() => focusControl(plan, "white", "wrong" as "legal", "e4"));
    }
    for (const invalid of [-1, plan.rows.length, 0.5, NaN]) { assert.throws(() => detailPage(plan, invalid, plan.digest)); result.refusalControls++; }
    assert.throws(() => detailPage(plan, 0, "wrong-source")); result.refusalControls++;
    assert.throws(() => detailPage({ ...plan, rows: [] }, 0, plan.digest)); result.refusalControls++;
    assert.equal(JSON.stringify(evidence), before);
  }
  if (!witnessedEvidence(evidence)) return;
  row.witnessed++;
  const digest = evidenceValueReceipt(evidence).payloadDigest;
  const packet = compileModulePacket({ module: "full_inspector", timing: "review", role: "learner", session: "position", evidence: [evidence] });
  assert.equal(packet.kind, "packet");
  if (packet.kind !== "packet") throw new Error("Inspector admission refused");
  row.admitted += packet.admitted;
  if (packet.facts.length === 0) return;
  try {
    const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 1 }, packet.facts.map(fact => fact.evidence)));
    row.presented++;
    const fit = fitModulePresentation("full_inspector", presented);
    for (const dimension of dimensions) row.maxSoloCost = { ...row.maxSoloCost, [dimension]: Math.max(row.maxSoloCost[dimension], fit.budget.before[dimension]) };
    if (fit.items.length > 0) row.fitted++;
    else {
      row.intrinsicOverflows++;
      const exceeded = [...new Set(fit.budget.dropped.flatMap(drop => drop.exceeded))].sort();
      row.exceeded = [...new Set([...row.exceeded, ...exceeded])].sort();
      row.firstOverflow ??= { sample, cost: fit.budget.before, exceeded };
    }
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    row.adapterRefusals++;
    row.firstAdapterRefusal ??= { sample, message: error.message.slice(0, 180) };
  }
  assert.equal(evidenceValueReceipt(evidence).payloadDigest, digest);
}
for (const row of rows.filter(row => row.source === "position" || row.source === "incoming_edge")) {
  for (const sample of samples) {
    if (row.source === "incoming_edge" && sample.edge === undefined) continue;
    row.calls++;
    let acquired: readonly DeclaredEvidence<unknown>[];
    try { acquired = values(invokeEvidenceValueRoute(row.projection as EvidenceValueRoute, (row.source === "position" ? { fen: sample.fen } : sample.edge!) as never)); }
    catch (error) { if (!(error instanceof TypeError)) throw error; row.sourceRefusals++; continue; }
    for (const evidence of acquired) measure(evidence, sample.label);
  }
}
for (const fixture of [...RECORDED_SEQUENCE_POSITIVES, ...RECORDED_SEQUENCE_HARD_NEGATIVES]) {
  const at = "2026-10-14T00:00:00.000Z";
  let run = createRun({ id: `solo-${fixture.projection}`, session: { kind: "position", start: canonicalRunStart({ fen: fixture.fen, side: fixture.fen.split(" ")[1] === "b" ? "black" : "white" }), feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"c".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: "2026-10-14T00:00:00.000Z" });
  for (const move of fixture.moves) run = commitMove(run, move, { at }).run;
  assert(run.events.every(event => event.at === at), "recorded fixture time is not deterministic");
  const saved = JSON.stringify(run), path = recordedSemanticPath(run, run.activeCursor.branchId);
  assert.equal(path.kind, "available");
  if (path.kind !== "available") throw new Error("Canonical recorded path refused");
  for (const event of path.events) if (accepted.has(key(event.projection))) measure(event.evidence, `sequence-${fixture.projection}`);
  assert.equal(JSON.stringify(run), saved);
}
assert.equal(new Set(rows.map(row => row.projection)).size, accepted.size);
// The accepted turn-clone control convention clears ep even for the moving side. Do not
// relabel it as the actual complete legal-move set when narrowing to a single target.
const epFen = "7k/8/8/3pP3/8/8/8/K7 w - d6 0 1";
assert(exactLegalMoves(epFen).some(move => move.uci === "e5d6"));
const epSource = invokeEvidenceValueRoute("rules.square.reading.control@1", { fen: epFen }) as DeclaredEvidence<unknown>;
const epPlan = detailPlan(epSource)!;
const epFocused = focusControl(epPlan, "white", "legal", "d6");
assert.equal(epFocused.rows.filter(member => member.kind === "control_relation").length, 0);
assert.match(detailBatch(epFocused, 0, epFocused.digest).text, /turn-clone \(en passant cleared\)/u);
const report = { scope: "disposable individual-fact fit over real imported/local/recorded inputs; provider/dependency refs unmeasured, not query/HTTP/UI or semantic qualification", importedGames: games.length, importedEdges,
  localSamples: samples.length, acceptedRefs: rows.length, measuredRefs: rows.filter(row => row.calls > 0 || row.offered > 0).length,
  oversizedRefs: rows.filter(row => row.intrinsicOverflows > 0).map(row => row.projection), refusedAdapters: rows.filter(row => row.adapterRefusals > 0).map(row => row.projection), detail, controlFocus, enPassantScopeControl: "actual legal move retained; clone-control absence explicitly labelled", rows };
const output = `${JSON.stringify(report, null, 2)}\n`;
assert(Buffer.byteLength(output) < 64 * 1024, "aggregate exceeded its small-report bound");
writeFileSync(".cache/d3792-inspector-demand/census.json", output);
console.log(JSON.stringify({ importedGames: report.importedGames, importedEdges, acceptedRefs: report.acceptedRefs, measuredRefs: report.measuredRefs, oversizedRefs: report.oversizedRefs, refusedAdapters: report.refusedAdapters }));
console.log(JSON.stringify({ disposableDetailOnly: true, detail, controlFocus }));
