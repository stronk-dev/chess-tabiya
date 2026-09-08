#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EMITTER_GRADUATION_CLEARANCE_PLANS, EMITTER_TEMPLATE_IDS } from "../apps/server/src/graduation-blocker-templates.mjs";
import { canonicalizeJson } from "../packages/schema/src/drill-pack/digest.ts";

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

export const TEMPLATE_CLEARANCE_PLANS = EMITTER_GRADUATION_CLEARANCE_PLANS;

const SIDECAR = /\.(?:evidence|graduation|job|sources)\.json$/u;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROPOSAL = resolve(ROOT, "planning/archive/graduation-clearance/migration-proposal.json");
const AUTHOR_DECISIONS = resolve(ROOT, "planning/archive/graduation-clearance/author-decisions.json");

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

function field(status, source, value) {
  return Object.freeze({ status, source, ...(value === undefined ? {} : { value }) });
}

function pointerValue(document, pointer) {
  let value = document;
  for (const token of pointer.slice(1).split("/")) {
    if (value === null || typeof value !== "object" || !(token in value)) return undefined;
    value = value[token];
  }
  return value;
}

export function digestCanonicalSync(value) {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

export function contentDeclarationPayload(document, entryId, plan) {
  if (plan.kind !== "content_declared") throw new TypeError(`${entryId} is not a content-declared template`);
  return Object.freeze({
    schema: "tabiya.graduation.content-declaration-payload.v1",
    packId: document.id,
    entryId,
    templateId: plan.templateId,
    payload: Object.freeze(plan.payloadPointers.map((pointer) => Object.freeze({ pointer, value: pointerValue(document, pointer) ?? null }))),
  });
}

function templateMigration(document, entry) {
  const plan = TEMPLATE_CLEARANCE_PLANS[entry.id];
  if (plan === undefined) return {
    status: "requires_author",
    proposedState: "blocking",
    fields: { clearance: field("requires_author", "Entry id is not an emitter template; an author must select its predicate.") },
  };
  const fields = {
    "clearance.kind": field("derived", `emitter template ${entry.id}`, plan.kind),
    "clearance.instrument": field("derived", `emitter template ${entry.id}`, plan.instrument),
  };
  if (plan.subject !== undefined) fields["clearance.subject"] = field("derived", `emitter template ${entry.id}`, plan.subject);
  if (plan.expected !== undefined) fields["clearance.expected"] = field("derived", `emitter template ${entry.id}`, plan.expected);
  if (plan.templateId !== undefined) fields["clearance.templateId"] = field("derived", `emitter template ${entry.id}`, plan.templateId);
  if (plan.captureEmittedPayload === true) {
    fields["clearance.emittedPayloadDigest"] = field(
      "derived",
      `canonical emitted payload for template ${entry.id}`,
      digestCanonicalSync(contentDeclarationPayload(document, entry.id, plan)),
    );
  }
  return {
    status: "ready",
    proposedState: "blocking",
    fields,
  };
}

function draftBlockingMigration(file, entry) {
  const packKey = basename(file, ".json");
  const classification = classifyDraftEntry(packKey, entry);
  const kindSource = classification.source === "hand_table"
    ? `published hand assignment ${packKey}/${entry.id}`
    : `classifier ${classification.rule ?? "unclassified"}; author review required`;
  const fields = {
    "clearance.kind": field(classification.source === "hand_table" ? "derived" : "requires_author", kindSource, classification.kind ?? undefined),
  };
  switch (classification.kind) {
    case "assessment_grounded":
      fields["clearance.subject"] = field("derived", "kind A fixed subject grammar", "/objective/grading/assessedBy");
      fields["clearance.instrument"] = field("derived", "kind A deciding command", "make verify-draft");
      break;
    case "ledger_record":
      fields["clearance.subject"] = field("requires_author", "The evidence claim must be joined to one supported pack pointer.");
      fields["clearance.recordKind"] = field("requires_author", "The author must choose the evidence-record kind that bears on the statement.");
      fields["clearance.instrument"] = field("derived", "kind B deciding command", "make sourcing-check");
      break;
    case "claim_bound":
      fields["clearance.subject"] = field("requires_author", "The author must choose one /feedbackClaims/<i>/text pointer.");
      fields["clearance.instrument"] = field("derived", "kind C deciding command", "make sourcing-check");
      break;
    case "shape_firing":
      fields["clearance.subject"] = field("requires_author", "The author must choose the exact /shapes/<i> or /planClasses/<i>/shapePlan pointer.");
      fields["clearance.instrument"] = field("derived", "kind D deciding command", "make expression-census");
      break;
    case "pointer_authored":
      fields["clearance.subject"] = field("requires_author", "The author must choose the exact string pointer the statement names.");
      fields["clearance.placeholder"] = field("requires_author", "The placeholder must be copied from the chosen subject before migration.");
      fields["clearance.instrument"] = field("derived", "kind E deciding actor", "author");
      break;
    case "unbuilt":
      fields["clearance.subject"] = field("requires_author", "The author must choose the pack node whose missing instrument blocks clearance.");
      fields["clearance.blockedBy"] = field("requires_author", "The author must name the living RFC or backlog owner of the missing instrument.");
      break;
    case "unreachable":
      fields["clearance.subject"] = field("requires_author", "The author must name the pack node no source or instrument can reach.");
      break;
    default:
      fields.clearance = field("requires_author", "No candidate kind was produced.");
  }
  return { status: "requires_author", proposedState: "blocking", fields };
}

function resolvedMigration(entry) {
  if (entry.id.startsWith("engine-evidence-now-")) return {
    status: "ready",
    proposedState: "resolved",
    fields: {
      "resolved.clearance.kind": field("derived", "resolved family engine-evidence-now", "assessment_grounded"),
      "resolved.clearance.subject": field("derived", "kind A fixed subject grammar", "/objective/grading/assessedBy"),
      "resolved.clearance.instrument": field("derived", "kind A deciding command", "make verify-draft"),
    },
  };
  if (entry.id.startsWith("refuted-and-deleted-")) return {
    status: "ready",
    proposedState: "resolved",
    fields: {
      "resolved.clearance.kind": field("derived", "graduation-clearance §2.2a named special case", "referent_removed"),
      "resolved.clearance.subject": field("derived", "graduation-clearance §2.2a named special case", "/spine"),
      "resolved.clearance.absentIds": field("derived", "graduation-clearance §2.2a named special case", ["bxc5-recoup", "bxc5-trade"]),
    },
  };
  return {
    status: "requires_author",
    proposedState: "resolved",
    fields: { "resolved.clearance": field("requires_author", "The historical resolution needs an exact standing predicate and subject pointer.") },
  };
}

function acceptedMigration(entry) {
  const reason = entry.accepted?.ruling;
  if (typeof reason !== "string" || reason.trim() === "") return {
    status: "blocked_contract",
    proposedState: "accepted",
    fields: { "accepted.unreachableBecause": field("blocked_contract", "The accepted entry has no existing ruling text to preserve as its reason.") },
  };
  return {
    status: "ready",
    proposedState: "accepted",
    fields: { "accepted.unreachableBecause": field("derived", "existing accepted.ruling; no new claim", reason) },
  };
}

function decisionFields(decision, prefix) {
  return Object.fromEntries(Object.entries(decision.clearance).map(([name, value]) => [
    `${prefix}.${name}`,
    field("author_decision", decision.rationale, value),
  ]));
}

function applyAuthorDecisions(rows, decisions) {
  if (decisions === undefined) return rows;
  if (decisions.schema !== "tabiya.graduation.clearance-author-decisions.v1" || typeof decisions.rows !== "object" || decisions.rows === null) {
    throw new Error("Graduation author decisions have an invalid contract");
  }
  const required = new Set(rows.filter((row) => row.status === "requires_author").map((row) => row.key));
  const supplied = new Set(Object.keys(decisions.rows));
  const missing = [...required].filter((key) => !supplied.has(key));
  const extra = [...supplied].filter((key) => !required.has(key));
  if (missing.length > 0 || extra.length > 0) throw new Error(`Graduation author decisions do not equal the author-required rows: ${missing.length} missing / ${extra.length} extra`);
  return rows.map((row) => {
    if (row.status !== "requires_author") return row;
    const decision = decisions.rows[row.key];
    if (decision.entryId !== row.entryId || decision.state !== row.currentState || typeof decision.rationale !== "string" || decision.rationale.trim() === "") {
      throw new Error(`Graduation author decision identity is stale: ${row.key}`);
    }
    const prefix = row.currentState === "resolved" ? "resolved.clearance" : "clearance";
    return Object.freeze({ ...row, status: "ready", fields: Object.freeze(decisionFields(decision, prefix)) });
  });
}

function migrationRows(root, decisions) {
  const rows = ["content/drafts", "content/candidates"].flatMap((tier) => documents(join(root, tier)).flatMap(({ file, document }) =>
    document.provenance.graduationBlockers.map((entry, index) => {
      let proposal;
      if (entry.state === "accepted") proposal = acceptedMigration(entry);
      else if (entry.state === "resolved") proposal = resolvedMigration(entry);
      else if (tier === "content/candidates") proposal = templateMigration(document, entry);
      else proposal = draftBlockingMigration(file, entry);
      return Object.freeze({
        key: `${relative(root, file)}#/provenance/graduationBlockers/${index}`,
        file: relative(root, file),
        packId: document.id,
        entryId: entry.id,
        currentState: entry.state,
        ...proposal,
      });
    })));
  return applyAuthorDecisions(rows, decisions);
}

function countStatuses(rows) {
  return Object.freeze(Object.fromEntries(["ready", "requires_author", "blocked_contract"].map((status) => [status, rows.filter((row) => row.status === status).length])));
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

export function buildGraduationPlan(root = ROOT, options = {}) {
  const drafts = scanDrafts(join(root, "content/drafts"));
  const candidates = scanCandidates(join(root, "content/candidates"));
  const ruleSuggested = drafts.blocking.filter((row) => row.source === "rule").length;
  const includeAuthorDecisions = options.includeAuthorDecisions !== false;
  const decisions = includeAuthorDecisions && existsSync(AUTHOR_DECISIONS) ? JSON.parse(readFileSync(AUTHOR_DECISIONS, "utf8")) : undefined;
  const rows = migrationRows(root, decisions);
  return {
    schema: "tabiya.graduation.clearance-plan.v2",
    generatedFrom: "working-tree",
    mode: "read_only",
    hold: {
      ruling: "D3033",
      allowed: ["foundation implementation", "schema v0.28 migration", "atomic corpus and sidecar restamp"],
      forbidden: ["authored chess truth", "claim-binding wave", "official publication", "RFC archival before all criteria pass"],
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
    migration: {
      entries: rows.length,
      statuses: countStatuses(rows),
      templateContracts: Object.freeze(Object.fromEntries(Object.keys(TEMPLATE_CLEARANCE_PLANS).map((id) => [id, "ready"]))),
      rows: Object.freeze(rows),
    },
  };
}

export function assertKnownPlan(plan) {
  const errors = [];
  if (plan.classifier.draftUnclassified.length !== 0) errors.push(`unclassified draft entries: ${plan.classifier.draftUnclassified.length}`);
  const unknownIds = [...new Set(plan.classifier.candidateUnrecognised.map((entry) => entry.entryId))].sort();
  if (JSON.stringify(unknownIds) !== JSON.stringify([...KNOWN_CANDIDATE_EXCEPTIONS].sort())) errors.push(`candidate exceptions changed: ${unknownIds.join(", ") || "(none)"}`);
  if (plan.corpus.documents !== 92) errors.push(`corpus document count changed: ${plan.corpus.documents}`);
  if (plan.migration.entries !== plan.corpus.entries) errors.push(`migration coverage changed: ${plan.migration.entries}/${plan.corpus.entries}`);
  if (new Set(plan.migration.rows.map((row) => row.key)).size !== plan.migration.entries) errors.push("migration keys are not unique");
  for (const row of plan.migration.rows) {
    if (Object.keys(row.fields).length === 0) errors.push(`migration row has no field plan: ${row.key}`);
    if (!Object.values(row.fields).every((value) => ["derived", "author_decision", "requires_author", "blocked_contract"].includes(value.status) && typeof value.source === "string" && value.source !== "")) errors.push(`migration row has invalid field provenance: ${row.key}`);
  }
  if (Object.keys(plan.migration.templateContracts).sort().join("\n") !== [...EMITTER_TEMPLATE_IDS].sort().join("\n")) errors.push("template migration contracts do not equal the emitter registry");
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
    `Migration proposal: ${plan.migration.statuses.ready} ready / ${plan.migration.statuses.requires_author} author-required / ${plan.migration.statuses.blocked_contract} contract-blocked; ${plan.migration.entries} of ${plan.corpus.entries} entries covered.`,
    "", "D3033 boundary: foundation/schema migration is licensed; authored chess truth, claim binding, publication and premature archival remain held.", "",
  ].join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const plan = assertKnownPlan(buildGraduationPlan());
    const serialized = `${JSON.stringify(plan, null, 2)}\n`;
    if (process.argv.includes("--write")) {
      mkdirSync(dirname(PROPOSAL), { recursive: true });
      writeFileSync(PROPOSAL, serialized, "utf8");
      process.stdout.write(`wrote ${relative(ROOT, PROPOSAL)} (${plan.migration.entries} entries)\n`);
    } else if (process.argv.includes("--check")) {
      const committed = readFileSync(PROPOSAL, "utf8");
      if (committed !== serialized) throw new Error(`Graduation plan refused:\n- ${relative(ROOT, PROPOSAL)} is stale; run make graduation-plan-update`);
      process.stdout.write(`graduation migration proposal current: ${plan.migration.entries} entries\n`);
    } else process.stdout.write(process.argv.includes("--json") ? serialized : markdown(plan));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
