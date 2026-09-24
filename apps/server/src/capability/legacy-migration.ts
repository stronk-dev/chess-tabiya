// rfc/pack-capability-contract.md §5 and §5a — the two shipped disposition registers compiled into the
// semantic-disposition vocabulary, with the legacy `refused` label migrated by EXACT row identity.
//
// Non-refused rows map through the total table (reached→active, retired→withdrawn,
// unmeasured→unmeasured, impossible→impossible). Legacy `refused` is not a mapping rule: an absent
// implementation, an unanswered decision or a negative measurement must not be laundered into product
// intent, so each refused row names its destination here, and a `refused` destination must carry an
// authority that resolves — an owner-ruling ledger row marked ⚖, an anchor in protected intent, or
// an accepted RFC's criterion.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { capabilityId, type CapabilityId } from "@chess-tabiya/schema";
import { FORMAT_DISPOSITIONS, type FormatDisposition } from "@chess-tabiya/schema/drill-pack";
import type { RefusalAuthority, SemanticDisposition } from "@chess-tabiya/runtime";

import { CAPABILITY_DISPOSITIONS, type CapabilityDisposition } from "../capabilities.js";

export type LegacyIdentity =
  | { readonly register: "capability"; readonly instrument: string; readonly capability: string }
  | { readonly register: "format"; readonly pointer: string; readonly value?: string };

export interface LegacyDestination {
  readonly capability: CapabilityId;
  readonly disposition: SemanticDisposition;
}

export interface LegacyRefusalMigration {
  readonly legacy: LegacyIdentity;
  readonly destinations: readonly LegacyDestination[];
}

const D = (kind: "pending_decision", decisionRef: string): SemanticDisposition => ({ kind, decisionRef });
const refused = (reason: string, authority: RefusalAuthority): SemanticDisposition => ({ kind: "refused", reason, authority });
const cap = (instrument: string, capability: string): LegacyIdentity => ({ register: "capability", instrument, capability });

/** Stable identity for an instrument capability row: `instrument.<instrument>.<capability>` slugs. */
export function instrumentCapabilityId(instrument: string, capability: string): CapabilityId {
  const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") || "x";
  return capabilityId(`instrument.${slug(instrument)}.${slug(capability)}`);
}

const row = (legacy: LegacyIdentity, disposition: SemanticDisposition, capability?: CapabilityId): LegacyRefusalMigration => ({
  legacy,
  destinations: [{
    capability: capability ?? (legacy.register === "capability" ? instrumentCapabilityId(legacy.instrument, legacy.capability) : capabilityId(`format.${legacy.pointer.replace(/[^A-Za-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "")}${legacy.value === undefined ? "" : `.${legacy.value}`}`)),
    disposition,
  }],
});

/**
 * §5a's normative table, corrected 2026-09-24 against HEAD: the register grew by four refused rows
 * after drafting (multi-band queries, artificial move delay, topGames/recentGames, third-party
 * annotations), one row was renamed (MultiPV), and the cross-learner row is no longer the reversed
 * R10 — the cohort standing ships as its own reached row, and what remains refused is R10(a).
 */
export const LEGACY_REFUSED_MIGRATION: readonly LegacyRefusalMigration[] = Object.freeze([
  row(cap("Stockfish", "bestmove / MultiPV rank / bestline"), { kind: "unimplemented", implementationRef: "D1061" }),
  row(cap("Stockfish", "MultiPV > 1 outside enumerate and the all-legal legal-root measurement"), D("pending_decision", "D1037")),
  row(cap("Stockfish", "SyzygyPath / SyzygyProbeLimit / SyzygyProbeDepth / Syzygy50MoveRule"), D("pending_decision", "D1037")),
  row(cap("Stockfish", "UCI_LimitStrength / UCI_Elo / Skill Level"), refused("Weakened Stockfish is rejected doctrine", { kind: "protected_intent", document: "design/06-campaign.md", anchor: "weakened Stockfish is rejected doctrine" })),
  row(cap("Stockfish", "nodestime / Ponder / go mate"), D("pending_decision", "D1037")),
  row(cap("Stockfish", "Debug Log File / NumaPolicy"), D("pending_decision", "D1037")),
  row(cap("Stockfish", "Move Overhead"), { kind: "unmeasured", experiment: "D1049: separate the depicted/measured clock from unsupported prediction before any engine-clock control" }),
  row(cap("Stockfish", "EvalFile / EvalFileSmall"), D("pending_decision", "D1037")),
  row(cap("Maia", "band-conditioned resistance"), { kind: "refuted", reason: "Measured flat across 1100/1500/1900", evidenceRef: "design/research/maia-endgame-fidelity.md#6. Arm B" }),
  row(cap("Maia", "Temperature 0"), D("pending_decision", "D1037")),
  row(cap("Maia", "multi-band runtime queries"), { kind: "refuted", reason: "D817: multi-band disagreement does not track human band movement", evidenceRef: "rfc/bot-policy.md#runtime multi-band queries are excluded" }),
  row(cap("Bot policy", "artificial move delay"), D("pending_decision", "D820")),
  row(cap("Glicko-2", "rating from authored, engine- or tablebase-adjudicated outcomes"), refused("A pack's declared success is not a game result", { kind: "accepted_rfc", document: "rfc/learner-rating.md", criterion: "R2" })),
  row(cap("Glicko-2", "rating as an input to what is said about a move"), refused("A rating may select what is shown and never argues a rendering", { kind: "accepted_rfc", document: "rfc/learner-rating.md", criterion: "R15" })),
  row(cap("Glicko-2", "cross-learner comparison outside a joined cohort"), refused("No standing spans classrooms; there is no global table", { kind: "accepted_rfc", document: "rfc/learner-rating.md", criterion: "R10" })),
  row(cap("Syzygy", "dtm"), { kind: "unmeasured", experiment: "D87 tablebase-condition experiment family; partial publication is not refusal" }),
  row(cap("Explorer", "monthly history"), { kind: "refuted", reason: "Measured drift is below any actionable threshold", evidenceRef: "design/research/explorer-source-contract-closure.md#Full monthly history remains operator/research data" }),
  row(cap("Explorer", "topGames / recentGames"), refused("Product scope: the corpus panel renders population results, not games", { kind: "accepted_rfc", document: "rfc/famous-games.md", criterion: "2" })),
  row(cap("Imported game", "third-party annotations, NAGs and move verdicts"), refused("Commentary is copyrightable expression and another product's verdict on a move", { kind: "accepted_rfc", document: "rfc/famous-games.md", criterion: "8" })),
  row(cap("Supervisor", "stockfish-play identity"), D("pending_decision", "D1037")),
  row(cap("Supervisor", "EngineRequest.afterCommands"), { kind: "withdrawn", reason: "No production callers; request-scoped state replaced it", removedAt: "0.23", successor: null, noSuccessor: { kind: "no_migration_exists", reason: "request-scoped engine state replaced the hook; no caller migrates" } }),
  row({ register: "format", pointer: "/opponentPolicy/mode", value: "plan_defense" }, { kind: "unimplemented", implementationRef: "apps/server/src/capabilities.ts#DECLARED_UNIMPLEMENTED_POLICY_MODES" }, capabilityId("opponentPolicy.mode.plan_defense")),
  row({ register: "format", pointer: "/opponentPolicy/mode", value: "human_external" }, { kind: "unimplemented", implementationRef: "apps/server/src/capabilities.ts#DECLARED_UNIMPLEMENTED_POLICY_MODES" }, capabilityId("opponentPolicy.mode.human_external")),
  {
    legacy: { register: "format", pointer: "/retryVariants" },
    destinations: [
      { capability: capabilityId("catalogue.variant_relation", 1), disposition: { kind: "deprecated", successor: capabilityId("catalogue.variant_relation", 2), reasonCode: "superseded", reason: "retryVariants is a catalogue relation; variantOf is its successor" } },
      { capability: capabilityId("retryVariants.scheduler", 1), disposition: { kind: "active" } },
    ],
  },
]);

/** §5's total projection for every non-refused shipped disposition. */
export function projectedDisposition(kind: "reached" | "retired" | "unmeasured" | "impossible", detail: { readonly reason: string; readonly experiment?: string; readonly removedAt?: string }): SemanticDisposition {
  if (kind === "reached") return { kind: "active" };
  if (kind === "retired") return { kind: "withdrawn", reason: detail.reason, removedAt: detail.removedAt ?? "unrecorded", successor: null, noSuccessor: { kind: "no_migration_exists", reason: detail.reason } };
  if (kind === "unmeasured") return { kind: "unmeasured", experiment: detail.experiment ?? "" };
  return { kind: "impossible", reason: detail.reason };
}

export type LegacyMigrationErrorCode =
  | "CAPABILITY_REFUSAL_MIGRATION_MISSING"
  | "CAPABILITY_REFUSAL_MIGRATION_EXTRA"
  | "CAPABILITY_REFUSAL_AUTHORITY_INVALID"
  | "CAPABILITY_DISPOSITION_REFERENCE_DANGLING";

export class LegacyMigrationError extends TypeError {
  readonly code: LegacyMigrationErrorCode;
  constructor(code: LegacyMigrationErrorCode, message: string) { super(`${code}: ${message}`); this.code = code; }
}

/** The allow-listed protected-intent inventory (law 5): design/00–06 and the agent guide's laws. */
export const PROTECTED_INTENT_DOCUMENTS = Object.freeze([
  "design/00-thesis.md", "design/01-training-model.md", "design/02-product-shape.md", "design/03-product-breadth.md",
  "design/04-content-architecture.md", "design/05-in-run-experience.md", "design/06-campaign.md", "CLAUDE.md",
]);

export interface AuthorityReader {
  readonly read: (path: string) => string | undefined;
}

export function repositoryReader(root: string): AuthorityReader {
  return { read: (path) => { const file = resolve(root, path); return existsSync(file) ? readFileSync(file, "utf8") : undefined; } };
}

function ledgerMarker(reader: AuthorityReader, id: string): string | undefined {
  const ledger = reader.read("design/BACKLOG.md") ?? "";
  return new RegExp(`^\\| ${id} (\\S+) \\|`, "mu").exec(ledger)?.[1];
}

function rfcAccepted(reader: AuthorityReader, document: string): boolean {
  if (document.startsWith("rfc/archive/")) return reader.read(document) !== undefined;
  const register = reader.read("rfc/README.md") ?? "";
  const name = document.replace(/^rfc\//u, "");
  const rowText = register.split("\n").find((line) => line.startsWith(`| \`${name}\``));
  return rowText !== undefined && /\*\*(implementing|accepted)\b/u.test(rowText);
}

function criterionResolves(text: string, criterion: string): boolean {
  if (/^\d+$/u.test(criterion)) {
    const section = text.slice(text.search(/^## Acceptance criteria/mu));
    return new RegExp(`^${criterion}\\. \\*\\*`, "mu").test(section);
  }
  return new RegExp(`\\*\\*${criterion.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\*\\*`, "u").test(text);
}

/** Validates one semantic disposition's references (§5a closing paragraph). */
export function assertDispositionAuthority(disposition: SemanticDisposition, reader: AuthorityReader, where: string): void {
  const fail = (message: string): never => { throw new LegacyMigrationError("CAPABILITY_REFUSAL_AUTHORITY_INVALID", `${where}: ${message}`); };
  if (disposition.kind === "refused") {
    const authority = disposition.authority;
    if (authority.kind === "owner_ruling") {
      const marker = ledgerMarker(reader, authority.ledgerRow);
      if (marker === undefined || !marker.startsWith("⚖")) fail(`owner ruling ${authority.ledgerRow} is not a ⚖ ledger row`);
    } else if (authority.kind === "protected_intent") {
      if (!PROTECTED_INTENT_DOCUMENTS.includes(authority.document)) fail(`${authority.document} is not protected intent`);
      if (!(reader.read(authority.document) ?? "").includes(authority.anchor)) fail(`${authority.document} has no anchor "${authority.anchor}"`);
    } else {
      if (!rfcAccepted(reader, authority.document)) fail(`${authority.document} is not an accepted RFC`);
      if (!criterionResolves(reader.read(authority.document) ?? "", authority.criterion)) fail(`${authority.document} has no criterion ${authority.criterion}`);
    }
  } else if (disposition.kind === "refuted") {
    const [path, anchor] = disposition.evidenceRef.split("#");
    if (path === undefined || anchor === undefined || !(reader.read(path) ?? "").includes(anchor)) throw new LegacyMigrationError("CAPABILITY_DISPOSITION_REFERENCE_DANGLING", `${where}: evidence ${disposition.evidenceRef} does not resolve`);
  } else if (disposition.kind === "pending_decision") {
    if (ledgerMarker(reader, disposition.decisionRef) === undefined) throw new LegacyMigrationError("CAPABILITY_DISPOSITION_REFERENCE_DANGLING", `${where}: ${disposition.decisionRef} is not a ledger row`);
  } else if (disposition.kind === "unimplemented") {
    const ref = disposition.implementationRef;
    const resolved = /^D\d+$/u.test(ref)
      ? ledgerMarker(reader, ref) !== undefined
      : (() => { const [module, symbol] = ref.split("#"); return module !== undefined && symbol !== undefined && new RegExp(`\\b${symbol}\\b`, "u").test(reader.read(module) ?? ""); })();
    if (!resolved) throw new LegacyMigrationError("CAPABILITY_DISPOSITION_REFERENCE_DANGLING", `${where}: ${ref} does not resolve`);
  } else if (disposition.kind === "unmeasured" && disposition.experiment.trim() === "") {
    throw new LegacyMigrationError("CAPABILITY_DISPOSITION_REFERENCE_DANGLING", `${where}: unmeasured without an experiment`);
  }
}

const identityKey = (identity: LegacyIdentity): string => identity.register === "capability"
  ? `capability|${identity.instrument}|${identity.capability}`
  : `format|${identity.pointer}|${identity.value ?? ""}`;

export interface CompiledInstrumentCapability {
  readonly legacy: LegacyIdentity;
  readonly capability: CapabilityId;
  readonly disposition: SemanticDisposition;
}

/**
 * Compiles both legacy registers into semantic dispositions. The exact refused population must
 * set-equal the migration table; every destination's authority must resolve.
 */
export function compileLegacyDispositions(options: {
  readonly capabilities?: readonly CapabilityDisposition[];
  readonly formats?: readonly FormatDisposition[];
  readonly migration?: readonly LegacyRefusalMigration[];
  readonly reader: AuthorityReader;
}): readonly CompiledInstrumentCapability[] {
  const capabilities = options.capabilities ?? CAPABILITY_DISPOSITIONS;
  const formats = options.formats ?? FORMAT_DISPOSITIONS;
  const migration = options.migration ?? LEGACY_REFUSED_MIGRATION;
  const refusedRows: LegacyIdentity[] = [
    ...capabilities.filter((entry) => entry.disposition === "refused").map((entry) => cap(entry.instrument, entry.capability)),
    ...formats.filter((entry) => entry.disposition === "refused").map((entry): LegacyIdentity => ({ register: "format", pointer: entry.pointer, ...(entry.value === undefined ? {} : { value: entry.value }) })),
  ];
  const byKey = new Map(migration.map((entry) => [identityKey(entry.legacy), entry]));
  if (byKey.size !== migration.length) throw new LegacyMigrationError("CAPABILITY_REFUSAL_MIGRATION_EXTRA", "a legacy row is migrated twice");
  for (const identity of refusedRows) if (!byKey.has(identityKey(identity))) throw new LegacyMigrationError("CAPABILITY_REFUSAL_MIGRATION_MISSING", `refused ${identityKey(identity)} has no migration entry`);
  const refusedKeys = new Set(refusedRows.map(identityKey));
  for (const key of byKey.keys()) if (!refusedKeys.has(key)) throw new LegacyMigrationError("CAPABILITY_REFUSAL_MIGRATION_EXTRA", `${key} names no refused legacy row`);
  const out: CompiledInstrumentCapability[] = [];
  for (const entry of migration) for (const destination of entry.destinations) {
    assertDispositionAuthority(destination.disposition, options.reader, identityKey(entry.legacy));
    out.push({ legacy: entry.legacy, capability: destination.capability, disposition: destination.disposition });
  }
  for (const entry of capabilities) {
    if (entry.disposition === "refused") continue;
    out.push({ legacy: cap(entry.instrument, entry.capability), capability: instrumentCapabilityId(entry.instrument, entry.capability), disposition: projectedDisposition(entry.disposition, entry) });
  }
  for (const entry of formats) {
    if (entry.disposition === "refused") continue;
    const legacy: LegacyIdentity = { register: "format", pointer: entry.pointer, ...(entry.value === undefined ? {} : { value: entry.value }) };
    out.push({ legacy, capability: formatCapabilityId(entry), disposition: projectedDisposition(entry.disposition, { reason: entry.reason, ...(entry.experiment === undefined ? {} : { experiment: entry.experiment }), ...(entry.removedAt === undefined ? {} : { removedAt: entry.removedAt }) }) });
  }
  const ids = out.map((row) => `${row.capability.id}@${row.capability.version.value}`);
  if (new Set(ids).size !== ids.length) throw new LegacyMigrationError("CAPABILITY_REFUSAL_MIGRATION_EXTRA", "two legacy rows compile to one capability identity");
  return Object.freeze(out);
}

/**
 * §4.2: the format register's rows keep their actual subject kinds — opponent modes are the schema's
 * vocabulary arms, legs resolve through trajectory evaluators, and the assistance and error rows are
 * an assistance surface and an error contract, never coerced to `vocabulary_arm`.
 */
export function formatCapabilityId(entry: FormatDisposition): CapabilityId {
  if (entry.pointer === "/opponentPolicy/mode" && entry.value !== undefined) return capabilityId(`opponentPolicy.mode.${entry.value}`);
  if (entry.pointer === "/legs/*/opponentPolicy") return capabilityId("trajectory.leg_opponent_policy");
  if (entry.pointer === "/legs/*/shapes") return capabilityId("trajectory.leg_shapes");
  if (entry.pointer === "assistance:arrows") return capabilityId("assistance.arrows");
  if (entry.pointer.startsWith("error:")) return capabilityId(`error.${entry.pointer.slice("error:".length)}`);
  if (entry.pointer === "/retryVariants") return capabilityId("catalogue.variant_relation", 1);
  throw new TypeError(`format disposition ${entry.pointer} has no capability identity`);
}
