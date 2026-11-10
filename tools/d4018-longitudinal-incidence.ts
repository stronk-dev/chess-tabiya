// OPT-IN D4018 criterion7 diagnostic, not a software/performance gate or source qualification.
// Every fixed run/PGN and every normative decision/legal alternative is included. Outputs only
// compact counts: no raw run/edge/collector dumps, new source hashes or persisted learner claims.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { commitMove, createRun, legalAlternativeEdges, localSemanticEventClosure, type DrillRun } from "../packages/runtime/src/index.js";
import { localSemanticCollectorOutcomes } from "../packages/runtime/src/semantic-evidence.js";
import { decisionPopulation, normativeDecisions, projectObservations } from "../apps/server/src/longitudinal-projector.js";
import { LONGITUDINAL_ADMITTED_IDENTITIES, LONGITUDINAL_INGEST_REGISTRY, OBSERVATION_DERIVATION_REV, identityKey } from "../apps/server/src/longitudinal-registry.js";
import { longitudinalRevisionFixtures } from "../apps/server/src/longitudinal-revision-fixtures.js";
import { sealLongitudinalSourceImageV4 } from "../apps/server/src/longitudinal-source.js";
import { AT } from "../apps/server/src/longitudinal-test-fixtures.js";
import { parsePgnMainline } from "../apps/server/src/pgn-import.js";

const PGNS = [
  "apps/server/src/sourcing/fixtures/masters-game-aAbqI4ey.pgn",
  "planning/platform-alignment/bot-policy/blind-review/pgn/B482856445.pgn",
  "planning/platform-alignment/bot-policy/blind-review/pgn/BA1DB43018.pgn",
] as const;
const authority = Object.freeze({ diagnostic: "D4018 fixed population" });
const owner = "incidence-fixture-owner";

function image(run: DrillRun) {
  return sealLongitudinalSourceImageV4(authority, {
    runId: run.id, requestedSeq: run.events.length, storedEvents: run.events,
    ownerLearnerId: owner, structureAttribution: "single_player",
    moveAuthorship: run.events.flatMap(event => event.type === "move.committed" && event.data.node.actor === "user"
      ? [{ eventSeq: event.seq, nodeId: event.data.node.id, learnerId: owner }] : []),
  });
}

function imported(path: string, side: "white" | "black"): DrillRun {
  const parsed = parsePgnMainline(readFileSync(path, "utf8"), { requireMoves: true });
  // Same runtime imported-session and actor rule as the saved-run fixtures, including custom FEN.
  let run = createRun({
    id: `incidence-${path}-${side}`,
    session: { kind: "imported", start: { fen: parsed.rootFen, side }, movetextDigest: `sha256:${"b".repeat(64)}`,
      feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 } },
    sessionDigest: `sha256:${"c".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 2, createdAt: AT,
  });
  for (const move of parsed.moves) {
    const node = run.nodes.find(value => value.id === run.activeCursor.nodeId)!;
    run = commitMove(run, move.uci, { actor: node.fen.split(" ")[1] === side[0] ? "user" : "system", at: AT }).run;
  }
  assert.equal(run.nodes.length, parsed.moves.length + 1, "the diagnostic may not truncate a PGN");
  return run;
}

interface Counts {
  projectionId: string; projectionVersion: number; semanticSign: string; sourceSign: string;
  kind: "edge" | "population" | "path";
  sourceEmittingEdges: number; matchingPopulationEdges: number;
  establishedOpportunities: number; occurred: number; alternativeShareSum: number;
}

function measure(name: string, runs: readonly DrillRun[]) {
  const rows: Counts[] = LONGITUDINAL_ADMITTED_IDENTITIES.map(identity => ({
    projectionId: identity.projectionId, projectionVersion: identity.projectionVersion,
    semanticSign: identity.semanticSign, sourceSign: identity.sourceSign, kind: identity.kind,
    sourceEmittingEdges: 0, matchingPopulationEdges: 0, establishedOpportunities: 0, occurred: 0, alternativeShareSum: 0,
  }));
  for (const entry of LONGITUDINAL_INGEST_REGISTRY) if (entry.kind === "path") for (const sign of entry.signs) rows.push({
    projectionId: entry.projection.id, projectionVersion: entry.projection.version,
    semanticSign: sign, sourceSign: sign, kind: "path",
    sourceEmittingEdges: 0, matchingPopulationEdges: 0, establishedOpportunities: 0, occurred: 0, alternativeShareSum: 0,
  });
  const byIdentity = new Map(rows.map(row => [identityKey(row), row]));
  const reasons = new Map<string, { edges: number; decisions: number }>();
  let decisions = 0, complete = 0, unavailable = 0, forced = 0, populationEdges = 0;
  for (const run of runs) {
    const source = image(run), normative = normativeDecisions(source, run);
    const projected = projectObservations(source);
    assert.equal(projected.denominators.reduce((sum, row) => sum + row.decisions, 0), normative.length);
    const observed = new Map<string, { opportunities: number; occurred: number; share: number }>();
    for (const row of projected.observations) {
      // Compare at the store's actual phase/class grain. Summing already-grouped floating
      // shares across phases is a different operation order from summing all decisions.
      const key = `${identityKey(row)}\0${row.phase}\0${row.decisionClass}`, old = observed.get(key) ?? { opportunities: 0, occurred: 0, share: 0 };
      observed.set(key, { opportunities: old.opportunities + row.opportunities, occurred: old.occurred + row.occurred, share: old.share + row.alternativeShareSum });
    }
    const measured = new Map<string, { opportunities: number; occurred: number; share: number }>();
    for (const decision of normative) {
      decisions++;
      const alternatives = legalAlternativeEdges(decision.beforeFen, decision.moveUci);
      const committed = run.nodes.find(node => node.id === decision.ref.nodeId);
      assert(decision.ref.kind === "move" && committed !== undefined && committed.parentId !== null,
        "this fixed diagnostic population contains only original committed move decisions");
      const edges = [{ beforeFen: decision.beforeFen, moveUci: decision.moveUci, afterFen: committed.fen }, ...alternatives];
      populationEdges += edges.length;
      const decisionReasons = new Set<string>();
      for (const edge of edges) {
        const closure = localSemanticEventClosure(edge.beforeFen, edge.moveUci, edge.afterFen);
        for (const outcome of localSemanticCollectorOutcomes(closure)) {
          const key = `${outcome.projection}/${outcome.result.kind}/${outcome.result.reason}`;
          const count = reasons.get(key) ?? { edges: 0, decisions: 0 }; count.edges++; reasons.set(key, count);
          decisionReasons.add(key);
        }
        const emitted = new Set(closure.events.map(event => `${event.projection.id}@${event.projection.version}\0${event.sign}`));
        for (const identity of LONGITUDINAL_ADMITTED_IDENTITIES) {
          const row = byIdentity.get(identityKey(identity))!;
          if (emitted.has(`${identity.projectionId}@${identity.projectionVersion}\0${identity.semanticSign}`)) row.sourceEmittingEdges++;
          if (emitted.has(`${identity.matchProjectionId}@${identity.matchProjectionVersion}\0${identity.matchSign}`)) row.matchingPopulationEdges++;
        }
      }
      for (const reason of decisionReasons) reasons.get(reason)!.decisions++;
      const population = decisionPopulation(decision.beforeFen, decision.moveUci);
      if (population.kind === "unavailable") {
        if (population.reason === "forced_move") forced++; else unavailable++;
        continue;
      }
      complete++;
      for (const [key, membership] of population.memberships) {
        const row = byIdentity.get(key); assert(row, "an unadmitted identity cannot enter the measurement");
        row.establishedOpportunities++; row.occurred += Number(membership.occurred); row.alternativeShareSum += membership.share;
        const scope = `${key}\0${decision.phase}\0${decision.decisionClass}`;
        const prior = measured.get(scope) ?? { opportunities: 0, occurred: 0, share: 0 };
        measured.set(scope, { opportunities: prior.opportunities + 1, occurred: prior.occurred + Number(membership.occurred), share: prior.share + membership.share });
      }
    }
    assert.deepEqual([...measured].sort(), [...observed].sort(), "actual projector rows must equal the complete-population accounting");
  }
  assert.equal(decisions, complete + unavailable + forced);
  return { name, runs: runs.map(run => ({ id: run.id, plies: run.nodes.length - 1 })), decisions, complete, unavailable, forced,
    populationEdges, unavailableSources: Object.fromEntries([...reasons].sort()), identities: rows };
}

const revisionRuns = longitudinalRevisionFixtures();
assert.equal(revisionRuns.length, 27, "all19 original runs and eight successor fixtures are mandatory");
const report = {
  question: "D4018 criterion7 whole-population availability incidence; descriptive only, no quality threshold or qualification",
  derivationRevision: OBSERVATION_DERIVATION_REV,
  fixedPgnPopulation: PGNS,
  note: "Both learner colors, all PGN plies and every original legal alternative. Zero opportunities is not proof of no tendency. Path rows remain deferred; matchingPopulationEdges uses the exact base for avoidance.",
  cohorts: [measure("original revision pair", revisionRuns.slice(0, 19)), measure("eight successor controls", revisionRuns.slice(19)),
    measure("fixed existing PGNs both learner colors", PGNS.flatMap(path => [imported(path, "white"), imported(path, "black")]))],
};
const destination = resolve(".cache/verification/longitudinal-incidence.json");
mkdirSync(dirname(destination), { recursive: true });
const bytes = `${JSON.stringify(report)}\n`;
assert(Buffer.byteLength(bytes) < 256_000, "compact aggregate report only; never retain raw collector dumps");
writeFileSync(destination, bytes);
console.log(JSON.stringify({ report: destination, bytes: Buffer.byteLength(bytes), cohorts: report.cohorts.map(({ name, decisions, complete, unavailable, forced, populationEdges }) => ({ name, decisions, complete, unavailable, forced, populationEdges })) }, null, 2));
