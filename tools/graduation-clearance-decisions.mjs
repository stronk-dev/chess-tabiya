#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildGraduationPlan } from "./graduation-clearance-plan.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(ROOT, "planning/archive/graduation-clearance/author-decisions.json");
const TOKEN_STOP = new Set(["about", "after", "again", "against", "author", "authored", "because", "before", "black", "blocker", "cannot", "claim", "does", "entry", "from", "into", "pack", "still", "that", "their", "there", "these", "this", "those", "until", "what", "when", "where", "which", "white", "with"]);

const RESOLVED_POINTERS = Object.freeze({
  "anti-dutch-leningrad-white": {
    subject: "/spine/0/children/0/children/0/annotations/0",
    placeholder: "The f5 pawn stopped guarding e4 and d5.",
  },
  "anti-french-advance-white": {
    subject: "/planClasses/0/description",
    placeholder: "After ...Qb6, three black pieces directly attack d4.",
  },
  "najdorf-english-attack-black": {
    subject: "/spine/0/children/0/children/0/children/0/children/0/annotations/0",
    placeholder: "The f8 bishop has five destinations and the c8 bishop has one.",
  },
  "opening-principles-black": {
    subject: "/deviations/2/note",
    placeholder: "A knight on c6 attacks four central squares.",
  },
  "opening-principles-white": {
    subject: "/deviations/2/note",
    placeholder: "A knight on h3 attacks two central squares while a knight on f3 attacks four.",
  },
});

const RESOLVED_SHAPES = Object.freeze({
  "anti-caro-advance-early-c5": "/shapes/0",
  "anti-kid-classical-white": "/shapes/1",
  "anti-london-black": "/shapes/0",
  "kid-classical-black": "/shapes/1",
  "london-system-white": "/shapes/0",
});

const VACUOUS_TO_UNBUILT = new Set([
  "anti-french-advance-white/the-d4-attacker-defender-counts-stated-in-the-qb6-annota",
  "anti-italian-center-attack-black/the-iqp-white-reference-rests-on-hand-derived-census-ari",
  "closed-centre-chain-black-base-strike/the-plyhorizon-of-18-and-the-fenpredicate-are-authored-w",
  "closed-centre-chain-black-base-strike/the-fenpredicate-is-a-hand-copy-of-the-library-s-trigger",
  "french-advance-chain-white/the-shape-entry-closed-centre-chain-carries-its-own-ungr",
  "london-wedge-black-counterplay/the-plyhorizon-of-16-and-the-two-fenpredicates-are-autho",
  "open-centre-ruy-exchange/the-shape-entry-this-pack-references-fires-on-only-three",
  "philidor-passive-rook-convert/the-philidor-shape-entry-has-no-plan-for-the-back-rank-s",
  "philidor-third-rank-hold/cited-2026-08-16-the-third-rank-fence-and-drop-and-check",
  "queen-vs-pawn-seventh-convert/the-rook-pawn-drawn-file-claim-inside-the-drawn-files-pl",
  "rook-4v3-same-side-hold/the-still-holding-checkpoint-uses-a-materialbalance-trig",
]);

function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }

function pointerValue(document, pointer) {
  let value = document;
  for (const token of pointer.slice(1).split("/")) {
    if (value === null || typeof value !== "object" || !(token in value)) return undefined;
    value = value[token];
  }
  return value;
}

function tokens(value) {
  return new Set(String(value).toLowerCase().match(/[a-z][a-z0-9-]{2,}/gu)?.filter((token) => !TOKEN_STOP.has(token)) ?? []);
}

function score(statement, value) {
  const left = tokens(statement), right = tokens(value);
  let total = 0;
  for (const token of left) if (right.has(token)) total += Math.min(8, token.length);
  return total;
}

function spineCandidates(nodes, prefix = "/spine") {
  const result = [];
  for (const [index, node] of (nodes ?? []).entries()) {
    const path = `${prefix}/${index}`;
    result.push({ pointer: `${path}/moveUci`, context: JSON.stringify(node) });
    result.push(...spineCandidates(node.children, `${path}/children`));
  }
  return result;
}

function moveCandidates(document) {
  return [
    { pointer: "/start/fen", context: JSON.stringify(document.start ?? {}) },
    ...spineCandidates(document.spine),
    ...(document.deviations ?? []).map((node, index) => ({ pointer: `/deviations/${index}/moveUci`, context: JSON.stringify(node) })),
  ].filter(({ pointer }) => pointerValue(document, pointer) !== undefined);
}

function claims(document) {
  return (document.feedbackClaims ?? []).map((claim, index) => ({
    pointer: `/feedbackClaims/${index}/text`,
    context: claim.text,
  }));
}

function shapes(document) {
  return [
    ...(document.shapes ?? []).map((shape, index) => ({ pointer: `/shapes/${index}`, context: JSON.stringify(shape) })),
    ...(document.planClasses ?? []).flatMap((plan, index) => plan.shapePlan === undefined ? [] : [{ pointer: `/planClasses/${index}/shapePlan`, context: JSON.stringify(plan) }]),
  ];
}

function best(statement, candidates) {
  return [...candidates].sort((left, right) => score(statement, right.context) - score(statement, left.context) || left.pointer.localeCompare(right.pointer))[0];
}

function evidenceLedger(file) {
  const path = file.includes("/candidates/") ? resolve(ROOT, dirname(file), "evidence.json") : resolve(ROOT, file.replace(/\.json$/u, ".evidence.json"));
  return existsSync(path) ? readJson(path) : { records: [] };
}

function recordKind(statement) {
  const text = statement.toLowerCase();
  if (/tablebase|syzygy|dtz|dtm/u.test(text)) return "tablebase_result";
  if (/engine|centipawn|depth[- ]?22|evaluation/u.test(text)) return "engine_eval";
  if (/opening name|eco/u.test(text)) return "opening_identity";
  if (/legal|legality/u.test(text)) return "position_legality";
  if (/frequency|more common|most common|scores better|scores best|popularity|rating band| games/u.test(text)) return "explorer_frequency";
  return "explorer_position_census";
}

function ownerFor(statement) {
  const text = statement.toLowerCase();
  if (/shape|structure|fenpredicate|trigger/u.test(text)) return "rfc/semantic-collectors.md";
  if (/maia|engine|corpus|explorer|evidence|frequency/u.test(text)) return "rfc/breadth-collectors.md";
  if (/guard|assistance|hint/u.test(text)) return "rfc/assistance-config-register.md";
  if (/claim|citation|source|ground/u.test(text)) return "rfc/claim-semantic-anchors.md";
  return "rfc/pack-training-forms.md";
}

function documentarySubject(statement, document) {
  const text = statement.toLowerCase();
  if (/guard/u.test(text) && document.guard !== undefined) return "/guard";
  if (/window|timing/u.test(text) && document.timingWindow !== undefined) return "/timingWindow";
  if (/feedback/u.test(text)) return "/feedbackPolicy";
  if (/shape|structure|trigger/u.test(text) && shapes(document).length > 0) return best(statement, shapes(document)).pointer;
  if (/deviation/u.test(text) && (document.deviations?.length ?? 0) > 0) return `/deviations/0`;
  if (/plan/u.test(text) && (document.planClasses?.length ?? 0) > 0) return `/planClasses/0`;
  return "/objective";
}

function unbuilt(statement, document, originalKind) {
  return {
    clearance: { kind: "unbuilt", subject: documentarySubject(statement, document), blockedBy: ownerFor(statement) },
    originalKind,
    rationale: "Conservative author ratchet: the statement needs a predicate or producer the accepted clearance vocabulary cannot yet express; it is not weakened into an unrelated clearable condition.",
  };
}

function resolvedDecision(document, entry) {
  if (entry.id.startsWith("the-syzygy-root-assessment-is-declared-but-not-ledger-ve")) {
    return { clearance: { kind: "assessment_grounded", subject: "/objective/grading/assessedBy", instrument: "make verify-draft" }, rationale: "The production writer resolved this named first-run debt from the manifest-linked root assessment record; the same assessment predicate remains its standing proof." };
  }
  if (entry.id.startsWith("shape-entry-authored-") || entry.id.startsWith("resolved-in-v0-2-0-")) {
    const subject = RESOLVED_SHAPES[document.id];
    if (subject === undefined || pointerValue(document, subject) === undefined) throw new Error(`resolved shape entry has no reviewed shape subject: ${document.id}/${entry.id}`);
    return { clearance: { kind: "shape_firing", subject, instrument: "make expression-census" }, rationale: "The exact reusable shape newly referenced by this pack is the standing, reversible resolution predicate; a plan success signature would measure a different claim." };
  }
  if (entry.id.startsWith("prose-grounding-pass-")) {
    const decision = RESOLVED_POINTERS[document.id];
    if (decision === undefined || typeof pointerValue(document, decision.subject) !== "string") throw new Error(`resolved prose pointer is stale: ${document.id}`);
    return { clearance: { kind: "pointer_authored", ...decision, instrument: "author" }, rationale: "The historical incorrect sentence is the placeholder; the corrected current string differs and restoring the old text makes the predicate fail." };
  }
  throw new Error(`unhandled resolved author decision: ${document.id}/${entry.id}`);
}

function blockingDecision(row, document, entry) {
  const originalKind = row.fields["clearance.kind"]?.value ?? null;
  if (VACUOUS_TO_UNBUILT.has(`${document.id}/${entry.id}`)) return unbuilt(entry.statement, document, originalKind);
  if (row.file.includes("/candidates/") && row.entryId === "immediate-blunder-guard-is-not-selectable-defect-d8-dela") {
    return unbuilt(entry.statement, document, originalKind);
  }
  if (originalKind === "assessment_grounded") return {
    clearance: { kind: "assessment_grounded", subject: "/objective/grading/assessedBy", instrument: "make verify-draft" },
    originalKind,
    rationale: "The statement is exactly the root-assessment grounding debt and uses the fixed assessment subject.",
  };
  if (originalKind === "claim_bound") {
    const candidate = best(entry.statement, claims(document));
    if (candidate === undefined) return unbuilt(entry.statement, document, originalKind);
    if (/\ball\b|every feedbackclaim|claims? (?:need|remain)/iu.test(entry.statement) && claims(document).length > 1) return unbuilt(entry.statement, document, originalKind);
    return { clearance: { kind: "claim_bound", subject: candidate.pointer, instrument: "make sourcing-check" }, originalKind, rationale: "The selected feedback claim is the closest exact prose referent named by the blocker; the binding validator is the deciding authority." };
  }
  if (originalKind === "shape_firing") {
    const candidate = best(entry.statement, shapes(document));
    if (candidate === undefined) return unbuilt(entry.statement, document, originalKind);
    return { clearance: { kind: "shape_firing", subject: candidate.pointer, instrument: "make expression-census" }, originalKind, rationale: "The selected shape or shape-plan is the exact reusable structural referent named by the blocker; the corpus census decides whether it fires." };
  }
  if (originalKind === "ledger_record") {
    const kind = recordKind(entry.statement);
    const ledger = evidenceLedger(row.file);
    const available = moveCandidates(document).filter(({ pointer }) => !(ledger.records ?? []).some((record) => record.kind === kind && (record.supports ?? []).includes(pointer)));
    const candidate = best(entry.statement, available);
    if (candidate === undefined) return unbuilt(entry.statement, document, originalKind);
    return { clearance: { kind: "ledger_record", subject: candidate.pointer, recordKind: kind, instrument: "make sourcing-check" }, originalKind, rationale: "The blocker asks for this evidence family at the closest exact position/move referent not already supported in the current ledger." };
  }
  if (originalKind === "pointer_authored") return unbuilt(entry.statement, document, originalKind);
  if (originalKind === "unbuilt") return unbuilt(entry.statement, document, originalKind);
  if (originalKind === "unreachable") return {
    clearance: { kind: "unreachable", subject: documentarySubject(entry.statement, document) },
    originalKind,
    rationale: "The pointer names the existing document node whose asserted condition is permanently outside the product's evidence route.",
  };
  throw new Error(`unhandled blocking kind ${String(originalKind)}: ${row.key}`);
}

function buildDecisions() {
  const plan = buildGraduationPlan(ROOT, { includeAuthorDecisions: false });
  const rows = {};
  for (const row of plan.migration.rows.filter((candidate) => candidate.status === "requires_author")) {
    const document = readJson(resolve(ROOT, row.file));
    const index = Number(row.key.match(/\/graduationBlockers\/(\d+)$/u)?.[1]);
    const entry = document.provenance.graduationBlockers[index];
    const decision = row.currentState === "resolved" ? resolvedDecision(document, entry) : blockingDecision(row, document, entry);
    rows[row.key] = { entryId: row.entryId, state: row.currentState, ...decision };
  }
  return {
    schema: "tabiya.graduation.clearance-author-decisions.v1",
    authority: "owner-delegated predicate classification under D3033; records no new chess claim",
    reviewedAt: "2026-09-08",
    rows,
  };
}

const decisions = buildDecisions();
if (process.argv.includes("--write")) {
  writeFileSync(OUTPUT, `${JSON.stringify(decisions, null, 2)}\n`, "utf8");
  process.stdout.write(`wrote ${Object.keys(decisions.rows).length} author decisions\n`);
} else if (process.argv.includes("--check")) {
  if (readFileSync(OUTPUT, "utf8") !== `${JSON.stringify(decisions, null, 2)}\n`) throw new Error("author decisions are stale; run with --write");
  process.stdout.write(`author decisions current: ${Object.keys(decisions.rows).length}\n`);
} else process.stdout.write(`${JSON.stringify(decisions, null, 2)}\n`);
