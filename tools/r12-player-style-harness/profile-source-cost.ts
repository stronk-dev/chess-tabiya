// DISPOSABLE D4159/D4147/D4149/D4181/D4200 parity and cost. Actual seven-family worker and Profile.
// Real SQLite claims, the complete production semantic projector, existing source factories and
// current profile are measured. Native sessions replay fixed CC0 moves; no human-style validity
// or semantic/human qualification is inferred. Only compact aggregates reach stdout.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { performance } from "node:perf_hooks";
import { appendOpponentPly, commitMove, createRun, decisionTraitPopulation, digestSessionSource, hasFianchettoConfiguration, holdsCastlingRight,
  readBackReplay, STYLE_METRICS, type DrillRun, type StyleContributorRef } from "../../packages/runtime/src/index.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { readFoundationRecordedPrefix } from "../../packages/runtime/src/recorded-foundation-source.js";
import { LearnerProfileService } from "../../apps/server/src/learner-profile.js";
import { readProfileGameSource } from "../../apps/server/src/profile-game-source.js";
import { OBSERVATION_DERIVATION_REV } from "../../apps/server/src/longitudinal-registry.js";
import { parseLongitudinalReadQuery } from "../../apps/server/src/longitudinal-contract.js";
import { normativeDecisions } from "../../apps/server/src/longitudinal-decisions.js";
import { projectObservations } from "../../apps/server/src/longitudinal-projector.js";
import { LongitudinalStore } from "../../apps/server/src/longitudinal-store.js";
import { runLongitudinalBatch } from "../../apps/server/src/longitudinal-worker-core.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "../../apps/server/src/longitudinal-worker-config.js";
import { loadOpeningCatalogue } from "../../apps/server/src/opening-catalogue.js";
import { parsePgnMainline } from "../../apps/server/src/pgn-import.js";
import { RunService } from "../../apps/server/src/service.js";
import { SQLiteRunStorage } from "../../apps/server/src/storage.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AT = "2026-11-05T00:00:00.000Z";
const owner = { learnerId: "research-profile-owner", handle: "research-profile-owner" };
const lease = { learnerId: owner.learnerId, writerId: "research-profile-writer" };
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
const round = (value: number) => Math.round(value * 100) / 100;
type Trait = "pawn" | "centerPawn" | "queen";
interface ChoiceProbe {
  readonly ref: StyleContributorRef;
  readonly eventSeq: number;
  readonly beforeNodeId: string;
  readonly sourcePly: number;
  readonly beforeFen: string;
  readonly afterFen: string;
  readonly moveUci: string;
  readonly moverColor: "white" | "black";
  readonly phase: string;
  readonly population: NonNullable<ReturnType<typeof decisionTraitPopulation>>;
}
const choiceGames: { readonly runId: string; readonly decisions: readonly ChoiceProbe[] }[] = [];
const metricTraits = [
  { id: "pawn_choice_residual", trait: "pawn", label: "pawn-choice", bound: Infinity, floor: 100 },
  { id: "center_pawn_choice_residual", trait: "centerPawn", label: "extended-center pawn", bound: Infinity, floor: 200 },
  { id: "early_queen_choice_residual", trait: "queen", label: "early-queen", bound: 16, floor: 100 },
] as const;

// Independent numeric reference, not the production interval function. FNV-1a uses BigInt
// modular arithmetic; the fixed Mulberry32 stream and rounded percentile rule are the existing
// public bootstrap convention. Each draw keeps all the selected decisions of a game together.
function referenceInterval(games: readonly { sum: number; count: number }[], seed: string) {
  let hash = 2166136261n;
  for (const char of seed) hash = ((hash ^ BigInt(char.charCodeAt(0))) * 16777619n) & 0xffffffffn;
  let state = Number(hash);
  const random = () => {
    state = (state + 1831565813) >>> 0;
    let mixed = Math.imul(state ^ state >>> 15, state | 1);
    mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, mixed | 61);
    return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
  };
  const draws: number[] = [];
  for (let sample = 0; sample < 1000; sample++) {
    let sum = 0, count = 0;
    for (let member = 0; member < games.length; member++) {
      const game = games[Math.trunc(random() * games.length)]!;
      sum += game.sum; count += game.count;
    }
    draws.push(sum / count);
  }
  draws.sort((left, right) => left - right);
  return { level: 0.95, method: "game_bootstrap", resamples: 1000, seed,
    lower: draws[Math.round(0.025 * 999)]!, upper: draws[Math.round(0.975 * 999)]! };
}
function signed(value: number) { const text = value.toFixed(3); return value > 0 ? `+${text}` : text === "-0.000" ? "0.000" : text; }
function referenceOrder(refs: readonly StyleContributorRef[]) {
  return [...refs].sort((a, b) => a.observedAt.localeCompare(b.observedAt) || a.runId.localeCompare(b.runId) || a.ply - b.ply);
}
function available<T>(result: { kind: "available"; value: T } | { kind: "unavailable"; reason: string }): T {
  if (result.kind !== "available") throw Error(result.reason); return result.value;
}
function scriptedSelection(moveUci: string) {
  return { moveUci, policyModeApplied: "enumerated" as const, candidates: [{ moveUci, rank: 1 }],
    engine: { id: "disposable-cc0-replay", name: "Scripted research replay", version: "1", seedHonored: true } };
}
async function native(id: string, moves: readonly string[], side: "white" | "black") {
  const session = { kind: "position" as const, start: { fen: START, side }, feedbackPolicy: "attempt_end" as const,
    opponentPolicy: { mode: "human_common" as const } };
  let run = createRun({ id, session, sessionDigest: await digestSessionSource(session), policyConfig, seed: 7, createdAt: AT });
  for (const [index, move] of moves.entries()) {
    run = ((index % 2 === 0) === (side === "white") ? commitMove(run, move, { at: AT })
      : appendOpponentPly(run, scriptedSelection(move), { at: AT })).run;
  }
  return run;
}

assert.match(process.version, /^v24\./u, "run the configured Make target");
const input = "tools/r2-selection-harness/imported-sample.pgn";
const lines: string[][] = [];
let rejectedInputs = 0;
for (const game of readFileSync(input, "utf8").split(/\n(?=\[Event )/u)) {
  let parsed;
  try { parsed = parsePgnMainline(game, { requireMoves: true }); }
  catch { rejectedInputs++; continue; }
  if (parsed.rootFen !== START || parsed.moves.length < 64) continue;
  const moves = parsed.moves.slice(0, 64).map(move => move.uci);
  try { await native("research-validation", moves, "white"); }
  catch (error) {
    if (error instanceof Error && "code" in error && error.code === "RUN_TERMINATED") { rejectedInputs++; continue; }
    throw error;
  }
  lines.push(moves);
  if (lines.length === 10) break;
}
assert.equal(lines.length, 10, "the fixed fixture must supply ten legal64-ply lines");
const directory = mkdtempSync(join(tmpdir(), "tabiya-profile-source-research-"));
const storage = new SQLiteRunStorage(join(directory, "research.sqlite"), { onMigration: () => {} });
let workerDatabase: DatabaseSync | undefined;
try {
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: AT });
  const runs: DrillRun[] = [];
  for (let index = 0; index < 200; index++) {
    // Every line occurs equally on both learner sides. Repeated lines intentionally expose warm
    // reuse; this is a workload benchmark, not 200 independent observed human games.
    const run = await native(`research-profile-${String(index).padStart(3, "0")}`, lines[Math.floor(index / 2) % lines.length]!, index % 2 === 0 ? "white" : "black");
    storage.create(run, lease); runs.push(run);
  }
  workerDatabase = new DatabaseSync(storage.databasePath);
  workerDatabase.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
  const store = new LongitudinalStore(workerDatabase), service = new RunService(storage);
  const rows: { runId: string; setup: string | null; screen: string | null; eligible: boolean }[] = [];
  let operandMs = 0, projectorMs = 0, values = 0, completed = 0;
  let claimed = 0, leaseRenewals = 0, claimElapsedMs = 0;
  console.log(JSON.stringify({ instrument: "disposable D4159/D4147", node: process.version, input, sourceLicence: "CC0-1.0",
    nativeSessions: runs.length, learnerSides: { white: 100, black: 100 }, uniqueLines: lines.length, plies: 64, rejectedInputs,
    derivationRevision: OBSERVATION_DERIVATION_REV,
    scope: "Actual original claimed GAME/choice sources, current54-input same-WIDE projector, atomic seven-family publication, parsed snapshot and Profile paths; independent old-helper operands and full choice statistics/interval/contributor/share parity" }));
  const started = performance.now();
  for (;;) {
    const receipt = runLongitudinalBatch(store, LONGITUDINAL_WORKER_DEFAULTS, "research-profile-worker", {
      project(image, checkpoint, gameSource) {
        store.sourceDigest(image); // Genuine issuing worker store, never a copied V4 image.
        const begin = performance.now(), run = readBackReplay(image.runPrefix.events).run;
        assert.equal(run.events.length, image.runPrefix.requestedSeq);
        const path = run.nodes.filter(node => node.branchId === run.branches[0]!.id).sort((a, b) => a.ply - b.ply);
        const prefix = readProfileGameSource(gameSource).prefix;
        assert.equal(readFoundationRecordedPrefix(prefix).authority.eventHead.seq, image.runPrefix.requestedSeq);
        const baseline = available(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix })); values++;
        const decisions = normativeDecisions(image, run).filter(decision => decision.decisionClass === "played");
        const first = decisions.find(decision => path.some(node => node.id === decision.ref.nodeId))!;
        const firstNode = run.nodes.find(node => node.id === first.ref.nodeId)!;
        assert.equal(baseline.payload.firstDecisionNodeId, firstNode.parentId, "normal fixture's first-side/first-owner joins must agree");
        let setup: string | null = null, screen: string | null = null;
        for (const node of path.slice(1)) {
          const actual = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen: node.fen });
          const screened = available(invokeEvidenceValueRoute("rules.structural.reading.fianchetto_knight_screen@1", { source: actual })); values += 2;
          const present = actual.payload.setups.some(member => member.color === run.start.side);
          const covered = screened.payload.screens.some(member => member.setup.color === run.start.side);
          assert.equal(present, hasFianchettoConfiguration(node.fen, run.start.side, false));
          assert.equal(covered, hasFianchettoConfiguration(node.fen, run.start.side, true));
          if (present && setup === null) setup = node.id;
          if (covered && screen === null) screen = node.id;
          checkpoint();
        }
        rows.push({ runId: run.id, setup, screen, eligible: baseline.payload.rights.kingside || baseline.payload.rights.queenside });
        const expectedChoices = decisions.map(decision => {
          const node = path.find(node => node.id === decision.ref.nodeId)!;
          assert.ok(node.parentId !== null);
          const sourcePly = path.findIndex(parent => parent.id === node.parentId);
          assert.ok(sourcePly >= 0);
          const population = decisionTraitPopulation(decision.beforeFen, decision.moveUci);
          assert.ok(population, "Independent old helper must describe every genuine selected decision");
          const moverColor = decision.beforeFen.split(" ")[1] === "w" ? "white" : "black";
          return { ref: { runId: run.id, nodeId: node.id, ply: node.ply, moveSan: node.moveSan, observedAt: AT },
            eventSeq: decision.ref.eventSeq, beforeNodeId: node.parentId, sourcePly, beforeFen: decision.beforeFen,
            afterFen: node.fen, moveUci: decision.moveUci, moverColor, phase: decision.phase, population } satisfies ChoiceProbe;
        });
        choiceGames.push({ runId: run.id, decisions: expectedChoices });
        operandMs += performance.now() - begin;
        const projectStart = performance.now();
        const result = projectObservations(image, { checkpoint, gameSource }); // ALL production families/alternatives, real GAME consumer.
        const fact = result.gameFacts[0]!;
        assert.equal(fact.game.kind, "eligible");
        if (fact.game.kind !== "eligible" || fact.game.fianchetto.kind !== "observed" || fact.game.knightScreen.kind !== "observed" || fact.game.castling.kind !== "observed") throw Error("Actual GAME path did not observe the fully supported fixture");
        assert.equal(fact.derivedRev, OBSERVATION_DERIVATION_REV);
        assert.equal(fact.game.fianchetto.first?.nodeId ?? null, setup);
        assert.equal(fact.game.knightScreen.first?.nodeId ?? null, screen);
        assert.equal(fact.game.castling.kingside || fact.game.castling.queenside, holdsCastlingRight(first.beforeFen, run.start.side));
        projectorMs += performance.now() - projectStart;
        const compareStart = performance.now();
        assert.equal(result.choiceFacts.length, 1);
        const choice = result.choiceFacts[0]!;
        assert.equal(choice.learnerId, owner.learnerId); assert.equal(choice.runId, run.id);
        assert.equal(choice.completedSeq, image.runPrefix.requestedSeq); assert.equal(choice.derivedRev, OBSERVATION_DERIVATION_REV);
        assert.equal(choice.observedAt, AT); assert.equal(choice.primaryBranchId, run.branches[0]!.id);
        assert.equal(choice.cohort.kind, "eligible");
        if (choice.cohort.kind !== "eligible") throw Error("Choice cohort unavailable");
        assert.equal(choice.cohort.decisions.length, expectedChoices.length);
        for (const [index, actual] of choice.cohort.decisions.entries()) {
          const expected = expectedChoices[index]!;
          assert.deepEqual(actual.ref, { nodeId: expected.ref.nodeId, beforeNodeId: expected.beforeNodeId, eventSeq: expected.eventSeq, sourcePly: expected.sourcePly });
          assert.equal(actual.beforeFen, expected.beforeFen); assert.equal(actual.afterFen, expected.afterFen);
          assert.equal(actual.moveUci, expected.moveUci); assert.equal(actual.moverColor, expected.moverColor); assert.equal(actual.phase, expected.phase);
          assert.equal(actual.result.kind, "available");
          if (actual.result.kind !== "available") throw Error("Choice source unavailable");
          assert.deepEqual([...actual.result.legalUcis].sort(), [...expected.population.legalUcis].sort());
          assert.deepEqual(actual.result.chosen, expected.population.played);
          for (const trait of ["pawn", "centerPawn", "queen"] as const)
            assert.equal(actual.result.counts[trait] / actual.result.legalUcis.length, expected.population.share[trait]);
        }
        operandMs += performance.now() - compareStart;
        return result;
      },
    });
    assert.equal(receipt.failed, 0); assert.equal(receipt.conflicts, 0); assert.equal(receipt.abandoned, 0);
    claimed += receipt.claimed;
    completed += receipt.completed;
    leaseRenewals += receipt.renewals;
    claimElapsedMs += receipt.claimElapsedMs;
    if (receipt.completed > 0 && completed % 25 === 0) console.log(JSON.stringify({ completed, elapsedMs: round(performance.now() - started) }));
    if (receipt.claimed === 0) break;
  }
  assert.equal(claimed, 200); assert.equal(completed, 200); assert.equal(rows.length, 200);
  const subjectRows = workerDatabase.prepare("SELECT source_kind, occurred, count(*) AS rows, count(DISTINCT run_id) AS runs FROM learner_subject_observations GROUP BY source_kind,occurred ORDER BY source_kind,occurred").all();
  for (const kind of ["native_incidence", "condition_relation"]) {
    assert.ok(subjectRows.some(row => row.source_kind === kind && Number(row.rows) > 0), `Actual ${kind} subject rows must be published`);
  }
  assert.deepEqual(workerDatabase.prepare("SELECT DISTINCT derived_rev FROM learner_subject_observations").all().map(row => row.derived_rev), [OBSERVATION_DERIVATION_REV]);
  const workerAndProbeMs = performance.now() - started;
  // Count Profile’s explicit metadata reads. Request timing includes the store’s internal replay.
  let imageReads = 0;
  const actualImage = storage.longitudinalSourceImageV4.bind(storage);
  storage.longitudinalSourceImageV4 = (runId, seq) => { imageReads++; return actualImage(runId, seq); };
  const profile = new LearnerProfileService({ storage, longitudinalStatus: () => "ready",
    openingCatalogue: await loadOpeningCatalogue(join(process.cwd(), "apps/server/artifacts/runtime-opening-catalogue.json")) });
  const coldStart = performance.now(), cold = profile.profile(owner), coldMs = performance.now() - coldStart, coldReads = imageReads;
  assert.equal(cold.store.counted, 200); assert.equal(cold.store.pending + cold.store.failed + cold.store.unavailable, 0);
  const warmStart = performance.now(), warm = profile.profile(owner), warmMs = performance.now() - warmStart;
  assert.deepEqual(warm, cold);
  const coverageStart = performance.now();
  const fullRead = storage.readLongitudinalSnapshot(owner.learnerId, parseLongitudinalReadQuery({
    learnerId: owner.learnerId, derivationRev: OBSERVATION_DERIVATION_REV, through: { kind: "all_complete" },
    filter: {}, includeSubjectObservations: true,
  }));
  const fullReadMs = performance.now() - coverageStart;
  assert.equal(fullRead.kind, "complete");
  if (fullRead.kind !== "complete") throw new Error("Expected all 200 complete cuts");
  assert.equal(fullRead.cuts.length, 200);
  assert.equal(fullRead.coverage.sources.length, 54);
  assert.equal(fullRead.coverage.decisions.length, 6_400);
  const coverageRows = workerDatabase.prepare(`SELECT count(*) AS decisions, count(DISTINCT run_id) AS runs, derived_rev
    FROM learner_subject_evaluations GROUP BY derived_rev`).all().map(row => ({ ...row }));
  assert.deepEqual(coverageRows, [{ decisions: 6_400, runs: 200, derived_rev: OBSERVATION_DERIVATION_REV }]);
  const unavailableBySource = new Map<string, { decisions: number; members: number }>();
  for (const decision of fullRead.coverage.decisions) {
    for (const failure of decision.unavailable) {
      const key = `${failure.projection.id}@${failure.projection.version}:${failure.cause.kind}:${failure.reason}`;
      const count = unavailableBySource.get(key) ?? { decisions: 0, members: 0 };
      count.decisions++;
      count.members += failure.members.length;
      unavailableBySource.set(key, count);
    }
  }
  const results = ["fianchetto_setup_rate", "fianchetto_knight_screen_rate", "castle_kingside_rate", "castle_queenside_rate"].map(metricId => {
    const begin = performance.now(), detail = profile.styleCard(owner, metricId, 0, 1_000), detailMs = performance.now() - begin;
    assert.equal(detail.card.state, "measured"); if (detail.card.state !== "measured") throw Error("Not measured");
    const expected = metricId === "fianchetto_setup_rate" ? rows.filter(row => row.setup !== null)
      : metricId === "fianchetto_knight_screen_rate" ? rows.filter(row => row.screen !== null) : rows.filter(row => row.eligible);
    if (metricId.startsWith("fianchetto")) {
      assert.equal(detail.card.numerator, expected.length); assert.equal(detail.card.eligibleGames, 200);
      assert.deepEqual(detail.contributors.shown.map(ref => [ref.runId, ref.nodeId]).sort(),
        expected.map(row => [row.runId, metricId === "fianchetto_setup_rate" ? row.setup! : row.screen!]).sort());
    } else assert.equal(detail.card.eligibleGames, expected.length);
    const shareStart = performance.now(), shared = profile.shareCard(owner, metricId, true), shareMs = performance.now() - shareStart; assert.equal(shared.share.games, detail.card.games);
    return { metricId, games: detail.card.games, numerator: detail.card.numerator, eligibleGames: detail.card.eligibleGames, detailMs: round(detailMs), shareMs: round(shareMs) };
  });
  // The three adopted cards are reconstructed from the old helper on the ORIGINAL decisions;
  // no current stored choice row, card value, production residual or production bootstrap is the oracle.
  const choiceResults = metricTraits.map(({ id, trait, label, bound, floor }) => {
    const metric = STYLE_METRICS.find(metric => metric.metricId === id)!;
    assert.equal(metric.floor, floor, "The migration preserves the independently pinned existing floor");
    const selected = [...choiceGames].sort((a, b) => a.runId.localeCompare(b.runId))
      .map(game => ({ ...game, decisions: game.decisions.filter(decision => decision.sourcePly < bound) })).filter(game => game.decisions.length > 0);
    const byGame = selected.map(game => ({ count: game.decisions.length,
      sum: game.decisions.reduce((sum, decision) => sum + Number(decision.population.played[trait]) - decision.population.share[trait], 0) }));
    const decisions = byGame.reduce((sum, game) => sum + game.count, 0);
    const expectedValue = byGame.reduce((sum, game) => sum + game.sum, 0) / decisions;
    const expectedInterval = referenceInterval(byGame, `${id}@1`);
    const refs = referenceOrder(selected.flatMap(game => game.decisions.filter(decision => decision.population.played[trait]).map(decision => decision.ref)));
    const sentence = `Relative to the legal choices you received, your ${label} residual was ${signed(expectedValue)} across ${decisions} decisions in ${selected.length} measured games (95% interval ${signed(expectedInterval.lower)} to ${signed(expectedInterval.upper)}). This card's floor is ${metric.floor} games.`;
    const card = cold.style.cards.find(card => card.metricId === id)!;
    assert.equal(card.state, "measured"); if (card.state !== "measured") throw Error("Choice card must clear existing floor");
    assert.equal(card.games, selected.length); assert.equal(card.decisions, decisions); assert.equal(card.floor, metric.floor);
    assert.equal(card.version, 1); assert.equal(card.unit, "decision"); assert.equal(card.phaseScope, metric.phaseScope);
    assert.equal(card.timeControlScope, "all_recorded_games"); assert.equal(card.reference, null); assert.equal(card.baseline, null);
    assert.equal(card.value, expectedValue); assert.equal(card.valueText, `${signed(expectedValue)} per decision`);
    assert.deepEqual(card.interval, expectedInterval); assert.equal(card.numerator, null); assert.equal(card.eligibleGames, null);
    assert.deepEqual(card.window, { from: AT, to: AT }); assert.equal(card.sentence, sentence);
    assert.deepEqual(card.contributors, { total: refs.length, shown: refs.slice(0, 5), hiddenCount: Math.max(0, refs.length - 5) });
    const detailStart = performance.now(), actualRefs: StyleContributorRef[] = [];
    // Follow the actual UI/API contributor page size rather than bypassing its pagination.
    for (let offset = 0; offset < refs.length || offset === 0; offset += 100) {
      const detail = profile.styleCard(owner, id, offset, 100);
      assert.deepEqual(detail.card, card);
      assert.equal(detail.contributors.total, refs.length);
      assert.equal(detail.contributors.hiddenCount, Math.max(0, refs.length - offset - detail.contributors.shown.length));
      actualRefs.push(...detail.contributors.shown);
    }
    assert.deepEqual(actualRefs, refs);
    const detailMs = performance.now() - detailStart;
    assert.throws(() => profile.shareCard(owner, id, false), /consent/u);
    const shareStart = performance.now(), share = profile.shareCard(owner, id, true).share;
    const scope = "all of your recorded games (these cards are not grouped by time control)";
    assert.deepEqual(share, { metric: `${id}@1`, title: metric.title, sentence, games: selected.length, decisions, floor: metric.floor,
      interval: { lower: expectedInterval.lower, upper: expectedInterval.upper, level: 0.95 }, window: { from: AT, to: AT }, scope,
      text: `${metric.title}: ${sentence} Scope: ${scope}; ${AT.slice(0, 10)} to ${AT.slice(0, 10)}. Metric ${id}@1, measured by Tabiya.` });
    return { metricId: id, games: selected.length, decisions, contributors: refs.length, value: expectedValue, interval: expectedInterval,
      detailAllPagesMs: round(detailMs), shareMs: round(performance.now() - shareStart) };
  });
  console.log(JSON.stringify({ claimed, completed, leaseRenewals, claimElapsedMs: round(claimElapsedMs), workerAndProbeMs: round(workerAndProbeMs), experimentBeforeMismatchMs: round(performance.now() - started), productionProjectorMs: round(projectorMs),
    independentGameProbeAndChoiceHelperComparisonMs: round(operandMs), priorGameProbeFactoryCalls: values, coldProfileMs: round(coldMs), warmProfileMs: round(warmMs),
    coldProfileSourceImageReads: coldReads, laterProfileSourceImageReads: imageReads - coldReads, results, choiceResults,
    coverageRows, fullReadMs: round(fullReadMs), unavailableBySource: Object.fromEntries(unavailableBySource),
    choiceDecisionsCompared: choiceGames.reduce((sum, game) => sum + game.decisions.length, 0), subjectRows,
    limits: "Synthetic repeated64ply native replay,100each side; not independent human games or variable game lengths. No human/source-qualification or browser/network latency proof. New choice-source work is inside productionProjectorMs; independentGameProbeAndChoiceHelperComparisonMs times old GAME probes, old choice helper and comparison assertions, not isolated choice-factory cost; priorGameProbeFactoryCalls counts only the prior GAME probes." }));

  // D4149: an actual stored scripted first-side king move precedes the owner's first move.
  // This source fact remains true; it cannot replace the different published metric operand.
  const session = { kind: "position" as const, start: { fen: START, side: "white" as const },
    feedbackPolicy: "attempt_end" as const, opponentPolicy: { mode: "human_common" as const } };
  let mismatch = createRun({ id: "research-profile-baseline-mismatch", session, sessionDigest: await digestSessionSource(session),
    policyConfig, seed: 7, createdAt: AT });
  for (const [index, move] of ["e2e3", "e7e6", "e1e2", "g8f6", "g1f3"].entries()) {
    mismatch = (index === 4 ? commitMove(mismatch, move, { at: AT }) : appendOpponentPly(mismatch, scriptedSelection(move), { at: AT })).run;
  }
  storage.create(mismatch, lease);
  const control = runLongitudinalBatch(store, LONGITUDINAL_WORKER_DEFAULTS, "research-profile-mismatch");
  assert.equal(control.completed, 1); assert.equal(control.failed + control.conflicts, 0);
  const image = storage.longitudinalSourceImageV4(mismatch.id, mismatch.events.length);
  const firstOwner = normativeDecisions(image, mismatch).find(decision => decision.decisionClass === "played")!;
  const node = mismatch.nodes.find(candidate => candidate.id === firstOwner.ref.nodeId)!;
  const abort = new AbortController(), prefix = service.resolveFoundationRecordedPrefix(mismatch.id, owner,
    { branchId: mismatch.activeCursor.branchId, throughNodeId: mismatch.activeCursor.nodeId }, abort.signal);
  const baseline = available(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix }));
  assert.notEqual(baseline.payload.firstDecisionNodeId, node.parentId);
  assert.equal(baseline.payload.rights.kingside || baseline.payload.rights.queenside, true);
  assert.equal(holdsCastlingRight(firstOwner.beforeFen, "white"), false);
  const after = profile.profile(owner), card = after.style.cards.find(candidate => candidate.metricId === "castle_kingside_rate")!;
  assert.equal(after.store.counted, 201); assert.equal(card.state, "abstained");
  if (card.state !== "abstained") throw Error("Expected honest source/role abstention");
  assert.equal(card.abstention.code, "incomplete_card");
  const proved = profile.styleCard(owner, "castle_kingside_rate", 0, 1000);
  assert.equal(proved.contributors.total, 200, "Only independently proved rights enter the denominator detail; unknown201st is still counted overall");
  console.log(JSON.stringify({ control: "D4149 first-owner versus first-side", countedGames: after.store.counted,
    independentlyProvedEligibleGames: proved.contributors.total, cardState: card.state, abstention: card.abstention.code, sourceFirstNode: baseline.payload.firstDecisionNodeId,
    metricFirstNode: node.parentId, sourceRetainedRights: true, metricRetainedRights: false,
    consequence: "Count201 overall, retain200 independently proved eligible refs, abstain the whole affected card; never retarget the baseline or hide the game" }));
  abort.abort();
} finally {
  workerDatabase?.close(); storage.close(); rmSync(directory, { recursive: true, force: true });
}
