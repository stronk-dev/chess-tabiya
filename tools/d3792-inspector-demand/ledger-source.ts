// DISPOSABLE D3841 ledger-source experiment. Synthetic reports, not measured chess truth,
// installed-source issuance, production acquisition, access authority or an Inspector API.
import assert from "node:assert/strict";
import { createRun, attachEvidence, recordedReadingEvidence, invokeRunRecordPosition, type RecordedReading } from "../../packages/runtime/src/index.js";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { evidenceValueReceipt, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { buildPositionEvidenceIndex, recordedReadingsAt } from "../../apps/server/src/position-evidence.js";
import { compileRecordedEvidenceSnapshot, resolveRecordedTablebase } from "../../apps/server/src/phase-source-composition.js";
import { validateLedger, validateManifest, linkage, assessmentGrounding } from "../../apps/server/src/sourcing/ledger-validation.js";
import type { EvidenceLedger, EvidenceRecord, SourceManifest, SourcingIssue } from "../../apps/server/src/sourcing/types.js";
import type { DrillPackDefinition } from "../../packages/schema/src/drill-pack/index.js";
import { presentationDigest } from "../../packages/runtime/src/presentation-contract.js";

export interface DraftRecordedCoverage {
  sourceKey: string; matchedRecords: number; admittedRecords: number; notAdmittedRecords: number;
  abstentions: { out_of_range: number; source_unavailable: number; no_data_at_band: number; licence_withheld: number };
}
const coverageReasons = ["out_of_range", "source_unavailable", "no_data_at_band", "licence_withheld"] as const;
export function parseRecordedCoverage(projection: string, outcome: { kind: string; reason?: string; collected?: number }, value: unknown): DraftRecordedCoverage | null {
  const ledger = projection === "recorded.engine.eval@1" || projection === "recorded.tablebase.result@1";
  const complete = outcome.kind === "available" || outcome.kind === "no_witness" || outcome.reason === "recorded_measurement_unavailable";
  if (!ledger || !complete) { assert.equal(value, null); return null; }
  assert(value !== null && typeof value === "object" && !Array.isArray(value));
  const row = value as Record<string, unknown>;
  assert.deepEqual(Object.keys(row).sort(), ["sourceKey", "matchedRecords", "admittedRecords", "notAdmittedRecords", "abstentions"].sort());
  assert(typeof row.sourceKey === "string" && row.sourceKey.length > 0);
  const count = (value: unknown): number => { assert(Number.isSafeInteger(value) && (value as number) >= 0); return value as number; };
  const matched = count(row.matchedRecords), admitted = count(row.admittedRecords), refused = count(row.notAdmittedRecords);
  assert(Number.isSafeInteger(admitted + refused)); assert.equal(matched, admitted + refused);
  assert(row.abstentions !== null && typeof row.abstentions === "object" && !Array.isArray(row.abstentions));
  const abstentions = row.abstentions as Record<string, unknown>;
  assert.deepEqual(Object.keys(abstentions).sort(), [...coverageReasons].sort());
  const total = coverageReasons.reduce((total, reason) => total + count(abstentions[reason]), 0);
  assert(Number.isSafeInteger(total));
  if (outcome.kind === "available") { assert(admitted > 0); assert.equal(outcome.collected, admitted); }
  else if (outcome.kind === "no_witness") { assert.equal(matched, 0); assert.equal(total, 0); }
  else { assert.equal(outcome.kind, "unavailable"); assert.equal(outcome.reason, "recorded_measurement_unavailable"); assert.equal(admitted, 0); assert(matched > 0 || total > 0); }
  return structuredClone(value) as DraftRecordedCoverage;
}

const digest = `sha256:${"a".repeat(64)}`, at = "2026-10-15T00:00:00.000Z";
const fen = "8/8/8/4k3/8/3PK3/8/1r2R3 w - - 0 1";
const canonical = (value: string) => canonicalFen(positionFromFen(value));
const withClocks = (half: number, full: number) => `${fen.split(" ").slice(0, 4).join(" ")} ${half} ${full}`;
const measurement = (kind: "engine_eval" | "tablebase_result", sourceId: string, anchor = fen): EvidenceRecord => ({
  kind, anchor: { fen: anchor }, sourceId, retrievedAt: at, grounds: "machine_validation", supports: [],
  values: kind === "engine_eval" ? { fen: anchor, centipawns: 31, depth: 12, multiPv: 1, perspective: "white",
    engineId: "synthetic", engineName: "Synthetic report (not an engine run)", engineVersion: "fixture" }
    : { fen: anchor, category: "draw", dtz: 0, precise_dtz: 0, dtm: null, pieceCount: 5,
      checkmate: false, stalemate: false, insufficient_material: false },
});
function artifact(records: readonly EvidenceRecord[], abstentions: EvidenceLedger["abstentions"] = []) {
  const ledger: EvidenceLedger = { schema: "tabiya.sourcing.evidence.v1", packId: "research", packVersion: "0.1.0",
    packDigest: digest, sourcedAt: at, records, abstentions };
  const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries:
    [...new Set([...records, ...abstentions].map(row => row.sourceId))].map(sourceId => ({ sourceId, retrievedAt: at,
      origin: { kind: "local-file", path: "synthetic-not-a-provider-report.json", sha256: digest, bytes: 1 },
      licence: { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null } })) };
  return { ledger, manifest };
}
function admittedArtifact(source: ReturnType<typeof artifact>, expectedDigest = digest) {
  const issues: SourcingIssue[] = [];
  const ledger = validateLedger(source.ledger, issues), manifest = validateManifest(source.manifest, issues);
  assert(ledger && manifest); linkage(manifest, ledger, issues);
  assert.deepEqual(issues, []); assert.equal(ledger.packId, "research"); assert.equal(ledger.packVersion, "0.1.0"); assert.equal(ledger.packDigest, expectedDigest);
  return ledger;
}
// Feasibility only: the proposed real issuer must read its own retained registry admission.
// This raw fixture helper is NOT a public or production source constructor.
function collect(source: ReturnType<typeof artifact>, kind: "engine_eval" | "tablebase_result", target: string) {
  const ledger = admittedArtifact(source), position = canonical(target);
  type Row = { ordinal: number; state: "admitted" | "not_admitted"; item: DeclaredEvidence<RecordedReading> | null; reason: string | null };
  const rows = ledger.records.flatMap<Row>((record, ordinal) => {
    if (record.kind !== kind || canonical(record.anchor.fen!) !== position) return [];
    if (record.values.fen !== undefined) assert.equal(canonical(record.values.fen as string), position);
    const route = kind === "engine_eval" ? "sourcing.ledger.engine_eval@1" : "sourcing.ledger.tablebase_result@1";
    const item = invokeEvidenceValueRoute(route, { record });
    const result = kind === "engine_eval" ? invokeEvidenceValueRoute("recorded.engine.eval@1", { ledger: item })
      : invokeEvidenceValueRoute("recorded.tablebase.result@1", { ledger: item });
    if (result.kind === "available") {
      assert.deepEqual(evidenceValueReceipt(result.value).sourceDigests, [evidenceValueReceipt(item).payloadDigest]);
      return [{ ordinal, state: "admitted" as const, item: result.value as DeclaredEvidence<RecordedReading>, reason: null }];
    }
    assert.equal(result.kind, "unavailable"); assert.equal(result.reason, "ledger_record_not_admitted");
    return [{ ordinal, state: "not_admitted" as const, item: null, reason: result.reason }];
  });
  const abstentions = ledger.abstentions.flatMap((row, ordinal) => row.kind === kind && canonical(row.anchor.fen!) === position ? [{ ordinal, row }] : []);
  const admitted = rows.filter(row => row.state === "admitted");
  return { rows, abstentions, admitted,
    state: admitted.length > 0 ? "available" : rows.length > 0 || abstentions.length > 0 ? "measurement_unavailable" : "no_witness" };
}

export function runLedgerSourceResearch() {
  let assertions = 0;
  const check = (test: () => void) => { test(); assertions++; };
  const records = [measurement("engine_eval", "e0"), measurement("tablebase_result", "t0"),
    measurement("engine_eval", "e1", withClocks(9, 7)), measurement("tablebase_result", "t1", withClocks(9, 7)),
    measurement("engine_eval", "e2", withClocks(0, 7)), measurement("tablebase_result", "t2", withClocks(0, 7))];
  const source = artifact(records);
  admittedArtifact(source);
  const index = buildPositionEvidenceIndex({ ledger: source.ledger, grounding: "ledger_verified", packDigest: digest });
  let run = createRun({ id: "d3841-ledger", packId: "research", packDigest: digest, startFen: fen, seed: 1, createdAt: at,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  const node = run.nodes.find(node => node.id === run.activeCursor.nodeId)!;
  const legacy = recordedReadingsAt(index, node, run);
  check(() => assert.equal(legacy.filter(row => row.payload.kind === "engine_eval").length, 3));
  check(() => assert.equal(legacy.filter(row => row.payload.kind === "tablebase_result").length, 2));
  const snapshot = compileRecordedEvidenceSnapshot({ kind: "pack", packId: "research", packDigest: digest,
    recordedEvidence: { state: "verified", ledgerDigest: digest }, positionEvidence: index });
  check(() => assert.equal(resolveRecordedTablebase(invokeRunRecordPosition(run, node.id), snapshot).kind, "recorded"));
  const duplicates = artifact([measurement("tablebase_result", "duplicate0"), measurement("tablebase_result", "duplicate1")]);
  check(() => assert.equal(collect(duplicates, "tablebase_result", fen).admitted.length, 2));
  check(() => assert.throws(() => compileRecordedEvidenceSnapshot({ kind: "pack", packId: "research", packDigest: digest,
    recordedEvidence: { state: "verified", ledgerDigest: digest },
    positionEvidence: buildPositionEvidenceIndex({ ledger: duplicates.ledger, grounding: "ledger_verified", packDigest: digest }) }), /duplicate recorded tablebase/u));
  const sameRecord = measurement("engine_eval", "identical");
  const identical = collect(artifact([sameRecord, sameRecord]), "engine_eval", fen).admitted;
  check(() => assert.deepEqual(identical.map(row => row.ordinal), [0, 1]));
  check(() => assert.equal(evidenceValueReceipt(identical[0]!.item!).payloadDigest, evidenceValueReceipt(identical[1]!.item!).payloadDigest));
  for (const kind of ["engine_eval", "tablebase_result"] as const) check(() => assert.equal(collect(source, kind, fen).admitted.length, 1));
  run = attachEvidence(run, node.id, ["synthetic:live-eval"], { kind: "eval", source: "engine_validated", values: { centipawns: 20 } }, at).run;
  run = attachEvidence(run, node.id, ["synthetic:live-tb"], { kind: "tablebase", source: "tablebase_exact", values: { category: "draw", dtz: 0 } }, at).run;
  check(() => assert.equal(recordedReadingsAt(index, node, run).length, 0));
  check(() => assert.equal(resolveRecordedTablebase(invokeRunRecordPosition(run, node.id), snapshot).kind, "recorded"));
  for (const kind of ["engine_eval", "tablebase_result"] as const) {
    const one = measurement(kind, "same");
    const rejected = { ...measurement(kind, "refused"), grounds: "citable_source" as const };
    const abstention = { kind, anchor: { fen }, sourceId: "abs", retrievedAt: at, reason: "source_unavailable" as const, detail: "Synthetic source abstention" };
    const mixed = collect(artifact([one, rejected, { ...one, sourceId: "same-again" }], [abstention]), kind, fen);
    check(() => assert.equal(mixed.state, "available"));
    check(() => assert.deepEqual(mixed.rows.map(row => [row.ordinal, row.state]), [[0, "admitted"], [1, "not_admitted"], [2, "admitted"]]));
    check(() => assert.equal(mixed.abstentions.length, 1));
    check(() => assert.equal(collect(artifact([rejected]), kind, fen).state, "measurement_unavailable"));
    check(() => assert.equal(collect(artifact([], [abstention]), kind, fen).state, "measurement_unavailable"));
    check(() => assert.equal(collect(artifact([measurement(kind, "other", withClocks(1, 1))]), kind, fen).state, "no_witness"));
    check(() => assert.throws(() => collect(artifact([{ ...one, anchor: { fen: "not a FEN" } }]), kind, fen)));
    check(() => assert.throws(() => collect(artifact([{ ...one, values: { ...one.values, fen: withClocks(1, 1) } }]), kind, fen)));
    check(() => assert.equal(recordedReadingEvidence(rejected), undefined));
  }
  const invalid = { ...source, ledger: { ...source.ledger, records: [{ ...records[0]!, supports: "not an array" }] } };
  check(() => assert.equal(buildPositionEvidenceIndex({ ledger: invalid.ledger, grounding: "ledger_verified", packDigest: digest }).size, 0));
  check(() => assert.equal(buildPositionEvidenceIndex({ ledger: source.ledger, grounding: "unverified", packDigest: digest }).size, 0));
  check(() => assert.throws(() => admittedArtifact(invalid as unknown as ReturnType<typeof artifact>)));
  check(() => assert.throws(() => admittedArtifact(source, `sha256:${"b".repeat(64)}`)));
  check(() => assert.throws(() => admittedArtifact({ ...source, manifest: { ...source.manifest, entries: source.manifest.entries.slice(1) } })));
  // A valid measurement artifact is independent of a grading claim; this is not a pack validator.
  const nonMachineGrade = { objective: { grading: { assessedBy: { kind: "authored" } } } } as unknown as DrillPackDefinition;
  check(() => assert.equal(assessmentGrounding({ document: nonMachineGrade, documentDigest: digest, ...source }), "unverified"));
  check(() => assert.equal(collect(source, "engine_eval", fen).state, "available"));
  check(() => assert.equal(collect(source, "tablebase_result", fen).state, "available"));
  for (const kind of ["engine_eval", "tablebase_result"] as const) {
    const blackFen = fen.replace(" w ", " b ");
    check(() => assert.equal(collect(artifact([measurement(kind, "black-side", blackFen)]), kind, blackFen).admitted.length, 1));
    check(() => assert.equal(collect(artifact([measurement(kind, "wrong-side", blackFen)]), kind, fen).state, "no_witness"));
  }
  let coverageChecks = 0;
  const coverage: DraftRecordedCoverage = { sourceKey: "research-only:complete-ledger-source", matchedRecords: 3,
    admittedRecords: 2, notAdmittedRecords: 1, abstentions: { out_of_range: 0, source_unavailable: 1, no_data_at_band: 0, licence_withheld: 0 } };
  const available = { kind: "available", collected: 2 };
  const parse = (value: unknown, outcome = available, projection = "recorded.engine.eval@1") => parseRecordedCoverage(projection, outcome, value);
  const pass = (test: () => void) => { test(); coverageChecks++; };
  pass(() => assert.deepEqual(parse(coverage), coverage));
  pass(() => assert.throws(() => parse(null)));
  pass(() => assert.throws(() => parse(coverage, available, "rules.phase.reading@2")));
  for (const bad of [{ ...coverage, matchedRecords: 4 }, { ...coverage, admittedRecords: -1 },
    { ...coverage, extra: "raw ledger prose" }, { ...coverage, abstentions: {} },
    { ...coverage, abstentions: { ...coverage.abstentions, source_unavailable: 0.5 } }]) pass(() => assert.throws(() => parse(bad)));
  pass(() => assert.throws(() => parse(coverage, { kind: "available", collected: 3 })));
  pass(() => assert.throws(() => parse(coverage, { kind: "no_witness", collected: 0 })));
  const empty = { ...coverage, matchedRecords: 0, admittedRecords: 0, notAdmittedRecords: 0,
    abstentions: { out_of_range: 0, source_unavailable: 0, no_data_at_band: 0, licence_withheld: 0 } };
  pass(() => assert.deepEqual(parse(empty, { kind: "no_witness", collected: 0 }), empty));
  const refused = { ...empty, matchedRecords: 1, notAdmittedRecords: 1 };
  pass(() => assert.deepEqual(parseRecordedCoverage("recorded.tablebase.result@1", { kind: "unavailable", reason: "recorded_measurement_unavailable" }, refused), refused));
  const abstentionOnly = { ...empty, abstentions: { ...empty.abstentions, source_unavailable: 1 } };
  pass(() => assert.deepEqual(parseRecordedCoverage("recorded.engine.eval@1", { kind: "unavailable", reason: "recorded_measurement_unavailable" }, abstentionOnly), abstentionOnly));
  pass(() => assert.throws(() => parseRecordedCoverage("recorded.engine.eval@1", { kind: "unavailable", reason: "source_absent" }, refused)));
  const receiptBody = { sourceOutcome: { kind: "available" }, recordedCoverage: coverage };
  const receiptDigest = presentationDigest("inspector.disclosure_receipt@1", receiptBody);
  pass(() => assert.notEqual(receiptDigest, presentationDigest("inspector.disclosure_receipt@1", { ...receiptBody, recordedCoverage: null })));
  pass(() => assert.notEqual(receiptDigest, presentationDigest("inspector.disclosure_receipt@1", { ...receiptBody, recordedCoverage: { ...coverage, sourceKey: "research:other-ledger" } })));
  pass(() => assert.notEqual(receiptDigest, presentationDigest("inspector.disclosure_receipt@1", { ...receiptBody, recordedCoverage: { ...coverage, notAdmittedRecords: 0 } })));
  console.log(JSON.stringify({ scope: "D3841 synthetic ledger/legacy source semantics only; no installed issuer, provider truth or API proof",
    assertions, coverageChecks, legacyAtExactFen: { engine: 3, tablebase: 2 }, exactSourceEachKind: 1, legacyAfterLive: 0,
    exactSourceUnaffectedByLive: true, mixedRowsAndAbstentionsRetained: true,
    verifiedAbsenceDistinctFromRefusedAndAbstention: true, malformedOrCrossedSourceRefused: true,
    objectiveGroundingNotMeasurementAdmission: true, tablebaseMultiplicityNotCollapsedToPhaseSnapshot: true, productionChanges: 0 }));
}
