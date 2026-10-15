// DISPOSABLE D3857 source-population research. Uses the real installed catalogue and recorded
// positions, not the proposed source issuer, successor factory, access grant or Inspector API.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileLoadedOpeningCatalogue, deepestOpeningReached, recordedOpeningPosition, type OpeningCatalogueAvailability } from "../../apps/server/src/opening-catalogue.js";
import { branchPath, commitMove, rewind, fork, type DrillRun } from "../../packages/runtime/src/index.js";
import { importedRun, play, REVIEW_AT } from "../../packages/runtime/src/testing/review-evidence-fixture.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { evidenceValueReceipt, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { presentationDigest } from "../../packages/runtime/src/presentation-contract.js";

export function runOpeningSourceResearch() {
  let controls = 0;
  const check = (test: () => void) => { test(); controls++; };
  const catalogue = compileLoadedOpeningCatalogue(JSON.parse(readFileSync("apps/server/artifacts/runtime-opening-catalogue.json", "utf8")));
  const available: OpeningCatalogueAvailability = { kind: "available", catalogue };
  // Actual recorded legal moves with repeated endpoint positions at later observed plies.
  const run = play(importedRun("d3857-opening-history"), ["e2e4", "e7e5", "g1f3", "b8c6", "f3g1", "c6b8", "g1f3", "b8c6"]);
  function collect(input: DrillRun, branchId: string, throughNodeId: string) {
    const path = branchPath(input, branchId);
    const end = path.findIndex(node => node.id === throughNodeId);
    assert(end >= 0, "through-node is not on branch");
    const rows = path.slice(0, end + 1).map(node => {
      const position = invokeEvidenceValueRoute("run.record.position@1", { run: input, nodeId: node.id }) as DeclaredEvidence<{ nodeId: string; ply: number; fen: string }>;
      return { node, position, lookup: catalogue.currentEndpoint(node.fen, node.ply) };
    });
    // The legacy pure helper takes a different raw position envelope. Construct that real
    // envelope explicitly; do not pretend its projectionId exists inside a sealed position.
    const history = deepestOpeningReached(available, rows.map(({ position }) =>
      recordedOpeningPosition(position.payload.nodeId, position.payload.ply, position.payload.fen)));
    return { rows, history, image: { runId: input.id, branchId, throughNodeId, catalogue: catalogue.ref,
      rows: rows.map(({ node, position, lookup }) => ({ nodeId: node.id, position: evidenceValueReceipt(position), lookup })) } };
  }
  const path = branchPath(run, run.activeCursor.branchId);
  const complete = collect(run, run.activeCursor.branchId, run.activeCursor.nodeId);
  const short = collect(run, run.activeCursor.branchId, path[2]!.id);
  check(() => assert.equal(complete.rows.length, 9));
  check(() => assert.equal(short.rows.length, 3));
  check(() => assert.equal(complete.rows[0]!.lookup.kind, "absent"));
  check(() => assert.equal(complete.history.kind, "matched"));
  if (complete.history.kind !== "matched" || short.history.kind !== "matched") throw new TypeError("named fixture required");
  const completeHistory = complete.history;
  check(() => assert(completeHistory.visits.length > 1));
  check(() => assert.deepEqual(completeHistory.visits.map(visit => visit.nodeId), complete.rows.filter(row => row.lookup.kind === "matched").map(row => row.node.id)));
  check(() => assert.equal(completeHistory.deepest.observedPly, Math.max(...completeHistory.visits.map(visit => visit.ply))));
  check(() => {
    assert(completeHistory.visits.some((visit, index, visits) => visits.slice(0, index).some(previous => previous.endpoint.positionKey === visit.endpoint.positionKey && previous.ply !== visit.ply)));
    assert(complete.rows.some((row, index, rows) => row.lookup.kind === "absent"
      && rows.slice(0, index).some(previous => previous.lookup.kind === "matched")
      && rows.slice(index + 1).some(later => later.lookup.kind === "matched")), "actual exit/re-entry required");
  });
  check(() => assert(short.history.kind === "matched" && short.history.visits.every(visit => visit.ply <= 2)));
  const imageDigest = (image: unknown) => presentationDigest("disposable.opening-population", image);
  check(() => assert.notEqual(imageDigest(complete.image), imageDigest(short.image)));

  // The current production declaration has exactly one endpoint/position tuple, not a prefix.
  const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.opening.deepest_reached" && row.version === 1)!;
  assert(declaration.derivation && "inputs" in declaration.derivation);
  const inputs = declaration.derivation.inputs!;
  check(() => assert.deepEqual(inputs.map(ref => `${ref.id}@${ref.version}`), ["theory.opening.current_endpoint@1", "run.record.position@1"]));
  check(() => assert(complete.rows.length + completeHistory.visits.length > inputs.length));
  check(() => assert.equal(invokeEvidenceValueRoute("derived.opening.deepest_reached@1", { run, branchId: run.activeCursor.branchId }).kind, "unavailable"));

  // A genuine same-key re-entry is a later visit, not one deduplicated name.
  const repeatedEndpoint = catalogue.currentEndpoint(path[2]!.fen, 2);
  if (repeatedEndpoint.kind !== "matched") throw new TypeError("named e4/e5 fixture required");
  const repeated = completeHistory.visits.filter(visit => visit.endpoint.positionKey === repeatedEndpoint.positionKey);
  check(() => assert(repeated.some(visit => visit.ply > 2)));
  const laterVisit = repeated.at(-1)!;
  check(() => assert.notEqual(laterVisit.nodeId, repeated[0]!.nodeId));

  // A sibling's matches may not enter the selected prefix, even when some nodes are inherited.
  const rewound = rewind(run, path[2]!.id, REVIEW_AT);
  const branched = fork(rewound.run, path[2]!.id, { label: "different-opening", at: REVIEW_AT }).run;
  const sibling = commitMove(branched, "f1c4", { at: REVIEW_AT }).run;
  const selected = collect(sibling, sibling.activeCursor.branchId, sibling.activeCursor.nodeId);
  check(() => assert(selected.rows.every(row => row.node.id !== path[3]!.id)));
  check(() => assert.throws(() => collect(sibling, sibling.activeCursor.branchId, path[4]!.id), /not on branch/u));
  check(() => assert.throws(() => collect(sibling, "missing-branch", sibling.activeCursor.nodeId)));

  // Successful absence has actual recorded positions/negative lookups, not a fake endpoint.
  const emptyRun = importedRun("d3857-no-opening", "white", "8/8/8/4k3/8/3PK3/8/1r2R3 w - - 0 1");
  const empty = collect(emptyRun, emptyRun.activeCursor.branchId, emptyRun.activeCursor.nodeId);
  check(() => assert.equal(empty.rows.length, 1));
  check(() => assert.equal(empty.history.kind, "absent"));
  check(() => assert(empty.rows.every(row => row.lookup.kind === "absent")));
  const emptyLaterRun = commitMove(emptyRun, "e1e2", { at: REVIEW_AT }).run;
  const emptyLater = collect(emptyLaterRun, emptyLaterRun.activeCursor.branchId, emptyLaterRun.activeCursor.nodeId);
  check(() => assert.deepEqual(empty.history, emptyLater.history));
  check(() => assert.notEqual(imageDigest(empty.image), imageDigest(emptyLater.image)));

  // Exercise actual loader and history behavior, not an invented future source state.
  check(() => assert.throws(() => compileLoadedOpeningCatalogue({})));
  check(() => assert.throws(() => compileLoadedOpeningCatalogue({ ...catalogue.artifact, digest: `sha256:${"0".repeat(64)}` }), RangeError));
  for (const reason of ["artifact_missing", "artifact_invalid", "digest_mismatch"] as const) {
    const absentSource: OpeningCatalogueAvailability = { kind: "unavailable", reason };
    check(() => assert.deepEqual(deepestOpeningReached(absentSource, []), { kind: "abstained", projectionId: "derived.opening.deepest_reached@1", reason: "input_abstained" }));
  }
  console.log(JSON.stringify({ scope: "D3857 actual opening source population, NOT installed-source issuer/successor/API proof",
    controls, recordedPositions: complete.rows.length, matchedVisits: completeHistory.visits.length,
    declaredFixedInputs: inputs.length, negativeLookupPositions: emptyLater.rows.length,
    liveProviderCalls: 0, productionChanges: 0 }));
}
