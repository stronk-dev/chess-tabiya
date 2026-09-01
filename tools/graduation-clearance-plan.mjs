#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EMITTER_TEMPLATE_IDS } from "../apps/server/src/graduation-blocker-templates.mjs";

export const CLEARANCE_RULES = Object.freeze([
  { rule: "unbuilt", kind: "unbuilt", keywords: [
    "no machine-readable evidence slot", "has no encoding", "no format slot", "nothing in the format",
    "the format still cannot", "the format should", "cannot be deviations in a follow", "fifty-move",
    "perfect_tablebase", "human-play evidence", "no human play", "maia",
    "unmeasurable with anything in this repository", "plan_signature_inlined", "no corpus instrument reaches",
    "wave-2 friction", "no shipped instrument", "authoring substitute", "becomes expressible", "cannot express",
    "nothing in this repo", "no evidence in this repo", "no shape-library entry", "no shapes reference",
  ] },
  { rule: "corpus", kind: "ledger_record", keywords: [
    "explorer", "unquantified", "more common", "scores better", "scores best", "most common", "rating band",
    "these bands", "at band", "frequency claim", "corpus measurement", "corpus evidence", "corpus-checked",
    "family root", "popularity", "unmeasured", "abstention floor", " games",
  ] },
  { rule: "citation", kind: "claim_bound", keywords: [
    "citable", "uncited", "unbacked", "no named source", "citation pass", "cited 2026-08-16", "no source",
    "model knowledge", "without a citation", "authored consensus", "still live after the 2026-08-16 pass",
    "the cited source",
  ] },
  { rule: "engine", kind: "ledger_record", keywords: [
    "engine-checked", "engine pass", "no engine", "engine evidence", "engine validation", "engine-checkable",
    "depth 22", "depth-22", "unevaluated", "unsettled by evaluation", "no evaluation",
    "engine and/or corpus evidence", "not the evaluation", "centipawn",
  ] },
  { rule: "tablebase", kind: "assessment_grounded", keywords: ["syzygy", "tablebase", "ledger-verified", "assessedby"] },
  { rule: "shape", kind: "shape_firing", keywords: [
    "shape entry", "shapes reference", "shape library", "shape-library", "shape reference", "shapeplan",
    "structural-feature vocabulary", "trigger", "fenpredicate", "named_structure",
  ] },
  { rule: "authored", kind: "pointer_authored", keywords: [
    "agent-authored", "is authored", "are authored", "authored doctrine", "authored claim", "authored prose",
    "hand-derived", "hand-counted", "hand copy", "placeholder", "authoring choice", "authored w",
    "hand-authored", "stays authored", "authored assessment", "remains authored", "authored liquidation",
    "authored spine",
  ] },
]);

export const HAND_ASSIGNMENTS = Object.freeze({
  "berlin-queenless-press/the-objective-s-achieved-signature-is-satisfied-at-none-": "unbuilt",
  "carlsbad-minority-attack/all-four-feedbackclaims-need-grounding-minority-target-a": "claim_bound",
  "grunfeld-exchange-fianchetto/no-timing-window-is-declared-and-the-measurement-that-de": "unreachable",
  "grunfeld-exchange-fianchetto/the-objective-s-achieved-signature-is-satisfied-at-none-": "unbuilt",
  "immediate-guard.browser/testing-fixture-only-do-not-publish-as-authored-chess-co": "unreachable",
  "iqp-black-tarrasch-defence/this-pack-declares-no-timing-window-the-measured-reason-": "unreachable",
  "london-wedge-black-counterplay/correction-after-d347-the-preceding-boundary-predicate-b": "pointer_authored",
  "london-wedge-black-counterplay/one-plan-class-is-listed-and-never-satisfied-black-fianc": "shape_firing",
  "open-centre-french-exchange-black/two-of-the-three-plan-classes-are-never-satisfied-on-thi": "shape_firing",
  "open-centre-ruy-exchange/this-pack-declares-no-timing-window-the-measured-reason-": "unreachable",
  "opening-principles-black/the-guard-threshold-250cp-encodes-the-same-authored-band": "unbuilt",
  "outcome-hold.browser/test-only-fixture-never-publish-as-chess-content": "unreachable",
  "outcome-resist.browser/test-only-fixture-never-publish-as-chess-content": "unreachable",
  "rook-4v3-same-side/the-w-ra8-w-ra7-line-asserts-that-1-rd2-concedes-a-pawn-": "ledger_record",
  "scandinavian-mainline-black/the-pack-s-central-corpus-claim-that-black-s-56-7-and-58": "unreachable",
  "stated-reasoning.browser/testing-fixture-only-do-not-publish-as-chess-instruction": "unreachable",
  "trajectory-legs.browser/mechanical-acceptance-fixture-only-it-asserts-no-chess-p": "unreachable",
});

export { EMITTER_TEMPLATE_IDS };

export const KNOWN_CANDIDATE_EXCEPTIONS = Object.freeze([
  "immediate-blunder-guard-is-not-selectable-defect-d8-dela",
]);

const SIDECAR = /\.(?:evidence|graduation|job|sources)\.json$/u;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function files(root) {
  const result = [];
  for (const name of readdirSync(root)) {
    const file = join(root, name);
    if (statSync(file).isDirectory()) result.push(...files(file));
    else if (name.endsWith(".json") && !SIDECAR.test(name)) result.push(file);
  }
  return result.sort();
}

function documents(root) {
  return files(root).flatMap((file) => {
    const document = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(document?.provenance?.graduationBlockers) ? [{ file, document }] : [];
  });
}

export function classifyDraftEntry(packKey, entry) {
  const statement = entry.statement.toLowerCase();
  for (const candidate of CLEARANCE_RULES) {
    const matchedKeyword = candidate.keywords.find((keyword) => statement.includes(keyword));
    if (matchedKeyword !== undefined) {
      return { kind: candidate.kind, source: "rule", rule: candidate.rule, matchedKeyword };
    }
  }
  const key = `${packKey}/${entry.id}`;
  const kind = HAND_ASSIGNMENTS[key];
  return kind === undefined ? { kind: null, source: "unclassified" } : { kind, source: "hand_table" };
}

function countBy(rows, key) {
  return Object.fromEntries([...new Set(rows.map((row) => row[key]))].sort().map((value) => [value, rows.filter((row) => row[key] === value).length]));
}

function scanDrafts(root) {
  const docs = documents(root);
  const entries = docs.flatMap(({ file, document }) => (document.provenance.graduationBlockers ?? []).filter((entry) => typeof entry === "object").map((entry) => ({ file: relative(ROOT, file), packId: document.id, entry })));
  const blocking = entries.filter(({ entry }) => entry.state === "blocking").map(({ file, packId, entry }) => {
    const packKey = basename(file, ".json");
    return { file, packId, packKey, entryId: entry.id, statement: entry.statement, ...classifyDraftEntry(packKey, entry) };
  });
  return {
    documents: docs.length,
    entries: entries.length,
    states: countBy(entries.map(({ entry }) => entry), "state"),
    blocking,
    preHandRules: countBy(blocking.filter((row) => row.source === "rule"), "rule"),
    finalKinds: countBy(blocking.filter((row) => row.kind !== null), "kind"),
    handAssigned: blocking.filter((row) => row.source === "hand_table"),
    unclassified: blocking.filter((row) => row.source === "unclassified"),
  };
}

function scanCandidates(root) {
  const docs = documents(root);
  const entries = docs.flatMap(({ file, document }) => (document.provenance.graduationBlockers ?? []).filter((entry) => typeof entry === "object").map((entry) => ({ file: relative(ROOT, file), packId: document.id, entry })));
  const blocking = entries.filter(({ entry }) => entry.state === "blocking");
  const known = new Set(EMITTER_TEMPLATE_IDS);
  return {
    documents: docs.length,
    entries: entries.length,
    states: countBy(entries.map(({ entry }) => entry), "state"),
    templateMatched: blocking.filter(({ entry }) => known.has(entry.id)).map(({ file, packId, entry }) => ({ file, packId, entryId: entry.id })),
    unrecognised: blocking.filter(({ entry }) => !known.has(entry.id)).map(({ file, packId, entry }) => ({ file, packId, entryId: entry.id, statement: entry.statement })),
  };
}

export function buildGraduationPlan(root = ROOT) {
  const drafts = scanDrafts(join(root, "content/drafts"));
  const candidates = scanCandidates(join(root, "content/candidates"));
  const ruleSuggested = drafts.blocking.filter((row) => row.source === "rule").length;
  return {
    schema: "tabiya.graduation.clearance-plan.v1",
    generatedFrom: "working-tree",
    mode: "read_only",
    hold: {
      ruling: "D560",
      allowed: "classifier and migration plan",
      forbidden: ["schema v0.28 apply", "corpus mutation", "sidecar restamp", "RFC archival"],
    },
    corpus: {
      documents: drafts.documents + candidates.documents,
      entries: drafts.entries + candidates.entries,
      drafts: { documents: drafts.documents, entries: drafts.entries, states: drafts.states },
      candidates: { documents: candidates.documents, entries: candidates.entries, states: candidates.states },
    },
    classifier: {
      draftRuleSuggestions: ruleSuggested,
      draftHandTableAssignments: drafts.handAssigned.length,
      draftUnclassified: drafts.unclassified,
      preHandRules: drafts.preHandRules,
      finalKinds: drafts.finalKinds,
      candidateTemplateMatched: candidates.templateMatched.length,
      candidateUnrecognised: candidates.unrecognised,
      emitterTemplateIds: [...EMITTER_TEMPLATE_IDS],
    },
    judgementDebt: {
      draftKindReview: drafts.blocking.length,
      draftSubjectAndPredicateFields: drafts.blocking.length,
      candidateNonTemplateEntries: candidates.unrecognised.length,
      resolvedClearanceBackfills: drafts.states.resolved ?? 0,
      removedReferentSpecialCases: 1,
      acceptedUnreachabilityBackfills: drafts.states.accepted ?? 0,
      fixtureTransitions: 5,
      note: "Rules produce reviewable candidate kinds only. They do not choose subject pointers, recordKind, placeholder, blockedBy, absentIds, or acceptance rationale.",
    },
  };
}

export function assertKnownPlan(plan) {
  const errors = [];
  if (plan.classifier.draftUnclassified.length !== 0) errors.push(`unclassified draft entries: ${plan.classifier.draftUnclassified.length}`);
  const unknownIds = [...new Set(plan.classifier.candidateUnrecognised.map((entry) => entry.entryId))].sort();
  if (JSON.stringify(unknownIds) !== JSON.stringify([...KNOWN_CANDIDATE_EXCEPTIONS].sort())) errors.push(`candidate exceptions changed: ${unknownIds.join(", ") || "(none)"}`);
  if (plan.corpus.documents !== 92) errors.push(`corpus document count changed: ${plan.corpus.documents}`);
  if (errors.length > 0) throw new Error(`Graduation plan refused:\n- ${errors.join("\n- ")}`);
  return plan;
}

function markdown(plan) {
  const c = plan.classifier;
  const j = plan.judgementDebt;
  return [
    "# Graduation-clearance migration plan (read only)", "",
    `Corpus: ${plan.corpus.documents} documents / ${plan.corpus.entries} entries.`,
    `Draft classifier: ${c.draftRuleSuggestions} rule suggestions + ${c.draftHandTableAssignments} published hand-table assignments; ${c.draftUnclassified.length} unclassified.`,
    `Candidate inventory: ${c.candidateTemplateMatched} recognised emitter entries; ${c.candidateUnrecognised.length} non-template entries requiring judgement.`,
    `Existing-state backfill: ${j.resolvedClearanceBackfills} resolved + ${j.acceptedUnreachabilityBackfills} accepted; ${j.removedReferentSpecialCases} removed-referent special case; ${j.fixtureTransitions} fixture transitions.`,
    "", `Judgement boundary: ${j.note}`, "",
    "D560 hold: no schema, content, sidecar, or archive write was performed.", "",
  ].join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const plan = assertKnownPlan(buildGraduationPlan());
    process.stdout.write(process.argv.includes("--json") ? `${JSON.stringify(plan, null, 2)}\n` : markdown(plan));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
