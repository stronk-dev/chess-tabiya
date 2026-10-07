// Disposable D3512 selection/custody, not new source admission or a profile.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { caseIdentity, loadCostPlan, sha, validateCostRows } from "./cost-contract.mjs";
import { selectBatchCases } from "./cost-batch.mjs";
import { inputPins } from "./cost-execution.mjs";
import { verifyIsolatedTriplet } from "./cost-case-isolation.mjs";

export const parentName = "d3262-cost-live-recursive-depth12-2026-10-07.json.gz";
export const parentDigest = "sha256:d8d2855784a4baadad3f36851294b2feef7c53b34a27a57f0d293b7ef0e5bf65";
const directory = "planning/semantic-consequence-search";
const protocolName = "d3512-source-isolation-preregistration-2026-10-07.md";
const instrumentNames = ["cost-case-isolation.mjs", "cost-isolation-selection.mjs"];
const check = (value, message) => { if (!value) throw new Error(`D3512_SELECTION: ${message}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hash = value => typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value);

/** Select source failures, never target success. Pure helper also exercises synthetic controls. */
export function selectDeadlineTriplets(groups) {
  check(Array.isArray(groups), "ordered original groups required");
  const identities = new Set(), selected = [];
  for (const group of groups) {
    const { name, digest, records } = group;
    check(typeof name === "string" && hash(digest) && Array.isArray(records) && records.length === 3,
      "original group identity/whole triplet");
    const cold = records[0];
    check(cold.raw.cell.regime === "cold", "cold first");
    for (const [i, regime] of ["cold", "warm", "provider_offline"].entries()) {
      const r = records[i], identity = caseIdentity(r.raw.cell);
      check(same(r.raw.cell, { ...cold.raw.cell, regime }) && identity === caseIdentity(r.row)
        && r.row.kind === r.raw.result.kind && r.row.rawCaptureDigest === sha(JSON.stringify(r.raw)),
      "crossed original regime/case/raw outcome");
      check(!identities.has(identity), "duplicate original case"); identities.add(identity);
    }
    const deadline = cold.raw.dependencies.some(d => d.state === "timed_out" && d.failure === "UCI operation deadline");
    if (!deadline) continue;
    check(cold.row.kind === "budget_exhausted", "deadline source failure differs from cold result");
    selected.push({ groupName: name, groupDigest: digest, cell: cold.raw.cell,
      originalRecords: records.map(r => ({ identity: caseIdentity(r.row), rawCaptureDigest: r.row.rawCaptureDigest })) });
  }
  return selected;
}

/** Original byte pin already has independent replay; this pass verifies selection custody, not all PVs again. */
export function loadIsolationParent() {
  const bytes = readFileSync(`${directory}/${parentName}`);
  check(sha(bytes) === parentDigest, "changed independently replayed parent bytes");
  const pack = JSON.parse(gunzipSync(bytes)), plan = loadCostPlan();
  check(pack.version === 1 && pack.authority === "lossless_partial_cost_capture_not_full_profile"
    && pack.metadata.start === 46320 && pack.metadata.limit === 6948
    && pack.metadata.planDigest === sha(`${JSON.stringify(plan, null, 2)}\n`)
    && same(pack.metadata.inputs, inputPins)
    && same(pack.metadata.cases, selectBatchCases(plan, 46320, 6948)), "changed parent population/input identity");
  check(same(Object.keys(pack.sourceSnapshot).sort(), Object.keys(pack.metadata.instrumentDigests).sort()),
    "missing/extra retained original sources");
  for (const [name, digest] of Object.entries(pack.metadata.instrumentDigests))
    check(sha(Buffer.from(pack.sourceSnapshot[name], "base64")) === digest, "changed retained original source");
  check(pack.groups.length === 2316 && same(pack.groups.map(({ name, digest }) => ({ name, digest })),
    pack.summary.groups), "parent groups/summary differ");
  const groups = pack.groups.map((g, i) => {
    const compressed = Buffer.from(g.base64, "base64");
    check(g.name === `triplet-${String(46320 + i * 3).padStart(6, "0")}.json.gz`
      && sha(compressed) === g.digest, "crossed original group order/bytes");
    return { name: g.name, digest: g.digest, records: JSON.parse(gunzipSync(compressed)) };
  });
  const records = groups.flatMap(g => g.records);
  check(same(records.map(r => r.raw.cell), pack.metadata.cases), "changed original case order/population");
  const admission = validateCostRows(plan, records.map(r => r.row));
  check(admission.admittedRows === 6948 && admission.pairedWarmCases === 2316, "incomplete parent structural custody");
  const entries = selectDeadlineTriplets(groups);
  check(entries.length === 697 && entries.filter(e => e.cell.setting === "recursive:depth12:top8:top8").length === 339
    && entries.filter(e => e.cell.setting === "recursive:depth12:top8:all_legal").length === 358,
  "affected population differs; do not trim to an expected count");
  return { pack, groups, entries, plan };
}

function currentSuccessorSources() {
  return Object.fromEntries(instrumentNames.map(name => {
    const bytes = readFileSync(new URL(name, import.meta.url));
    return [name, { digest: sha(bytes), base64: bytes.toString("base64") }];
  }));
}

export function buildIsolationSelection(parent = loadIsolationParent()) {
  const protocol = readFileSync(`${directory}/${protocolName}`), sources = currentSuccessorSources();
  // Original execution semantics must not change while filling their declared gaps.
  for (const [name, digest] of Object.entries(parent.pack.metadata.instrumentDigests))
    check(sha(readFileSync(new URL(name, import.meta.url))) === digest, `changed original execution source: ${name}`);
  return { version: 1, question: "D3512", authority: "frozen_failed_source_successor_selection_not_native_results",
    parent: { name: parentName, digest: parentDigest, planDigest: parent.pack.metadata.planDigest,
      sourceDigest: parent.pack.metadata.provider.sourceDigest, timeoutMs: parent.pack.metadata.provider.timeoutMs,
      instrumentDigests: parent.pack.metadata.instrumentDigests },
    protocol: { name: protocolName, digest: sha(protocol), base64: protocol.toString("base64") },
    successorSources: sources, entries: parent.entries, coldCases: 697, cases: 2091,
    nativeExecuted: false, productionProfileSelected: false };
}

export function freezeIsolationSelection(out) {
  const value = buildIsolationSelection(), bytes = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(out, bytes, { flag: "wx" });
  return { digest: sha(bytes), coldCases: 697, cases: 2091, nativeExecuted: false };
}

export function checkIsolationSelection(path) {
  const parent = loadIsolationParent(), expected = buildIsolationSelection(parent), bytes = readFileSync(path);
  check(bytes.toString("utf8") === `${JSON.stringify(expected, null, 2)}\n`,
    "selection/protocol/source bytes changed; never restamp a frozen selection");
  return { value: expected, parent, digest: sha(bytes) };
}

/** Keep both attempts and both outcomes. Does not promote complete-cost/profile counters. */
export function joinIsolationAttempts(selectionEntries, originalGroups, successorRecords, expectedSourceDigest, expectedTimeoutMs) {
  check(Array.isArray(selectionEntries) && selectionEntries.length && Array.isArray(originalGroups)
    && Array.isArray(successorRecords) && successorRecords.length === selectionEntries.length,
  "whole selected successor population required");
  check(hash(expectedSourceDigest) && Number.isSafeInteger(expectedTimeoutMs) && expectedTimeoutMs > 0
    && originalGroups.every(g => g.records.every(r => r.raw.dependencies.every(d => d.operands.sourceDigest === expectedSourceDigest))),
  "original/successor source identity required");
  const derived = selectDeadlineTriplets(originalGroups);
  check(same(selectionEntries, derived), "changed original failure selection");
  const originalByName = new Map(originalGroups.map(g => [g.name, g]));
  const seen = new Set(), pairs = []; let ready = 0, startupFailed = 0, previousEnd = 0;
  for (const [i, entry] of selectionEntries.entries()) {
    const original = originalByName.get(entry.groupName), successor = successorRecords[i];
    verifyIsolatedTriplet(successor);
    check(same(successor.trace.cell, entry.cell) && successor.trace.sourceDigest === expectedSourceDigest
      && successor.trace.timeoutMs === expectedTimeoutMs,
      "crossed successor original case/source");
    check(successor.trace.clock.started >= previousEnd, "overlapping/reordered source-isolated cases");
    previousEnd = successor.records[2].raw.clock.ended;
    check(successor.records.every(r => r.row.planDigest === original.records[0].row.planDigest), "crossed successor plan");
    ready += Number(successor.trace.startup.kind === "ready"); startupFailed += Number(successor.trace.startup.kind === "failed");
    for (const [j, record] of successor.records.entries()) {
      const identity = caseIdentity(record.row);
      check(identity === entry.originalRecords[j].identity && !seen.has(identity), "duplicate/foreign successor attempt");
      seen.add(identity);
      pairs.push({ identity, originalRawDigest: entry.originalRecords[j].rawCaptureDigest,
        originalKind: original.records[j].row.kind, successorRawDigest: record.row.rawCaptureDigest,
        successorKind: record.row.kind, successorLifecycleDigest: sha(JSON.stringify(successor.trace)) });
    }
  }
  return { authority: "structural_original_successor_pairing_requires_independent_replay_not_profile",
    originalRetainedCases: originalGroups.length * 3, successorCases: successorRecords.length * 3,
    readyColdProcesses: ready, failedStartupProcesses: startupFailed, pairs,
    qualifiedSettings: null, independentReplay: "not_established_by_this_join", productionProfileSelected: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  check(args.length === 2 && ["--freeze", "--check"].includes(args[0]) && args[1], "use --freeze|--check <selection.json>");
  const result = args[0] === "--freeze" ? freezeIsolationSelection(args[1]) : checkIsolationSelection(args[1]);
  process.stdout.write(`${JSON.stringify({ digest: result.digest, coldCases: 697, cases: 2091, nativeExecuted: false })}\n`);
}
