// rfc/skills.md — the parts of the skills progression surface that build on shipped foundations
// without a migration: the five-category navigation (§3.1), the mechanical valence-admissibility
// rule and the valence register validator (§2.2, §2.5), the leaf model with its named blockers, the
// concept-mark derivation with the declinable-alternative rule (§6.2), and the refusals (§8).
// Nothing here writes `learner_marks`; a concept mark is derived at read time and never stored.
import type { EvidenceGrounding } from "./evidence-contract.js";

// ---------------------------------------------------------------------------------------------
// §3.1 — the top tier: five inherited category names, navigation only

export const SKILL_CATEGORIES = Object.freeze(["fundamentals", "openings", "tactics", "strategy", "endgame"] as const);
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];
export const SKILL_CATEGORY_LABELS: Readonly<Record<SkillCategory, string>> = Object.freeze({
  fundamentals: "Fundamentals",
  openings: "Openings",
  tactics: "Tactics",
  strategy: "Strategy",
  endgame: "Endgame",
});

/**
 * §8.4 — the two categories no admissible authority reaches ship empty with their reason, never a
 * zero and never filled from a weaker detector.
 */
export const EMPTY_CATEGORY_REASONS: Readonly<Partial<Record<SkillCategory, string>>> = Object.freeze({
  openings: "Opening identity says which opening a game reached, not whether a move in it was good, so nothing here can be credited yet.",
  strategy: "Structure, pawn, king and activity observations are neutral until an outcome or cited-theory join supplies a valence, so nothing here can be credited yet.",
});

// ---------------------------------------------------------------------------------------------
// §2.2 — the mechanical admissibility rule

/** A projection may serve as a valence authority iff its grounding is one of these five. */
export const VALENCE_ADMISSIBLE_GROUNDINGS = Object.freeze(["position_rules", "authored_claim", "cited_theory", "tablebase_exact", "bounded_search"] as const satisfies readonly EvidenceGrounding[]);
/** Admissible only when the convention itself is cited (§2.2 row 6). */
export const VALENCE_CONDITIONAL_GROUNDINGS = Object.freeze(["declared_convention"] as const satisfies readonly EvidenceGrounding[]);
/** Never a valence authority: Maia mass, popularity and the learner's own history (circular). */
export const VALENCE_REFUSED_GROUNDINGS = Object.freeze(["human_model", "human_corpus", "recorded_run"] as const satisfies readonly EvidenceGrounding[]);

export type ValenceBasis = (typeof VALENCE_ADMISSIBLE_GROUNDINGS)[number];

// ---------------------------------------------------------------------------------------------
// §2.5 — the valence register (content, validated here)

export const VALENCE_REGISTER_FORMAT = "tabiya.valence-register.v1" as const;

export interface ValenceDeclaration {
  readonly projectionId: string;
  readonly projectionVersion: number;
  readonly authorityId: string;
  readonly authorityVersion: number;
  readonly declarer: string;
  readonly declaredAt: string;
  readonly scope: string;
  readonly basis: ValenceBasis;
  readonly note: string;
}

export interface ValenceRegister {
  readonly formatVersion: typeof VALENCE_REGISTER_FORMAT;
  readonly declarations: readonly ValenceDeclaration[];
}

export interface ValenceRegisterIssue {
  readonly code:
    | "VALENCE_REGISTER_SHAPE"
    | "VALENCE_BASIS_INADMISSIBLE"
    | "VALENCE_AUTHORITY_UNDECLARED"
    | "VALENCE_AUTHORITY_GROUNDING_REFUSED"
    | "VALENCE_BASIS_MISMATCH"
    | "VALENCE_DECLARATION_DUPLICATE";
  readonly index: number | null;
  readonly message: string;
}

const DECLARATION_KEYS = ["projectionId", "projectionVersion", "authorityId", "authorityVersion", "declarer", "declaredAt", "scope", "basis", "note"] as const;

/**
 * Criteria 1 and 3: every row names one of the five admissible groundings, and its authority —
 * resolved through the compiled evidence catalogue — is not one of the three refused groundings
 * and agrees with the declared basis.
 */
export function validateValenceRegister(
  value: unknown,
  groundingOf: (projectionId: string, version: number) => EvidenceGrounding | undefined,
): readonly ValenceRegisterIssue[] {
  const issues: ValenceRegisterIssue[] = [];
  const push = (code: ValenceRegisterIssue["code"], index: number | null, message: string): void => { issues.push(Object.freeze({ code, index, message })); };
  if (value === null || typeof value !== "object" || Array.isArray(value)) { push("VALENCE_REGISTER_SHAPE", null, "register is not an object"); return Object.freeze(issues); }
  const register = value as Record<string, unknown>;
  const keys = Object.keys(register).sort();
  if (keys.join(",") !== "declarations,formatVersion") push("VALENCE_REGISTER_SHAPE", null, "register must carry exactly formatVersion and declarations");
  if (register.formatVersion !== VALENCE_REGISTER_FORMAT) push("VALENCE_REGISTER_SHAPE", null, `formatVersion must be ${VALENCE_REGISTER_FORMAT}`);
  if (!Array.isArray(register.declarations)) { push("VALENCE_REGISTER_SHAPE", null, "declarations must be an array"); return Object.freeze(issues); }
  const seen = new Set<string>();
  register.declarations.forEach((raw: unknown, index: number) => {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) { push("VALENCE_REGISTER_SHAPE", index, "declaration is not an object"); return; }
    const row = raw as Record<string, unknown>;
    const rowKeys = Object.keys(row);
    if (rowKeys.length !== DECLARATION_KEYS.length || DECLARATION_KEYS.some((key) => !(key in row))) { push("VALENCE_REGISTER_SHAPE", index, `declaration must carry exactly ${DECLARATION_KEYS.join(", ")}`); return; }
    for (const key of ["projectionId", "authorityId", "declarer", "declaredAt", "scope", "note"] as const) {
      if (typeof row[key] !== "string" || (row[key] as string).trim() === "") push("VALENCE_REGISTER_SHAPE", index, `${key} must be a non-empty string`);
    }
    for (const key of ["projectionVersion", "authorityVersion"] as const) {
      if (!Number.isSafeInteger(row[key]) || (row[key] as number) < 1) push("VALENCE_REGISTER_SHAPE", index, `${key} must be a positive integer`);
    }
    const basis = row.basis;
    if (typeof basis !== "string" || !(VALENCE_ADMISSIBLE_GROUNDINGS as readonly string[]).includes(basis)) {
      push("VALENCE_BASIS_INADMISSIBLE", index, `basis ${String(basis)} is not one of the five admissible groundings`);
    }
    const key = `${String(row.projectionId)}@${String(row.projectionVersion)}`;
    if (seen.has(key)) push("VALENCE_DECLARATION_DUPLICATE", index, `${key} is declared twice`);
    seen.add(key);
    if (typeof row.authorityId === "string" && Number.isSafeInteger(row.authorityVersion)) {
      const grounding = groundingOf(row.authorityId, row.authorityVersion as number);
      if (grounding === undefined) push("VALENCE_AUTHORITY_UNDECLARED", index, `${row.authorityId}@${String(row.authorityVersion)} is not a declared projection`);
      else if ((VALENCE_REFUSED_GROUNDINGS as readonly string[]).includes(grounding)) push("VALENCE_AUTHORITY_GROUNDING_REFUSED", index, `${row.authorityId} is grounded in ${grounding}, which can never supply valence`);
      else if (grounding !== basis && !(grounding === "declared_convention")) push("VALENCE_BASIS_MISMATCH", index, `${row.authorityId} is grounded in ${grounding}, not ${String(basis)}`);
    }
  });
  return Object.freeze(issues);
}

// ---------------------------------------------------------------------------------------------
// Leaves: the author-written taxonomy rows and why each is (not yet) creditable

export type SkillLeafSource = "registered_shape" | "pack_concept";

export type SkillLeafBlocker =
  | "category_unassigned"
  | "valence_unruled"
  | "opportunity_definition_missing"
  | "concept_identity_pack_local";

export const SKILL_LEAF_BLOCKER_TEXT: Readonly<Record<SkillLeafBlocker, string>> = Object.freeze({
  category_unassigned: "Its category has not been assigned by the owner yet (rfc/skills.md §3.3, Open question 3).",
  valence_unruled: "No valence declaration is admitted: whether any may be declared is the owner's open ruling (rfc/skills.md Open question 1).",
  opportunity_definition_missing: "A shape needs its own opportunity definition before a first can be credited (rfc/skills.md Discharge D3).",
  concept_identity_pack_local: "Concept ids are still pack-local; cross-pack identity lands with rfc/concept-registry.md.",
});

export interface SkillLeaf {
  readonly leafId: string;
  readonly label: string;
  readonly source: SkillLeafSource;
  readonly category: SkillCategory | null;
  readonly blockers: readonly SkillLeafBlocker[];
}

// ---------------------------------------------------------------------------------------------
// §6.2 — concept marks: an event, derived at read time, earned once, only over a declinable choice

/** A leaf admitted for credit: category assigned, valence declared, opportunity rule written. */
export interface AdmittedSkillLeaf {
  readonly leafId: string;
  readonly label: string;
  readonly category: SkillCategory;
  readonly authority: { readonly projectionId: string; readonly projectionVersion: number; readonly declarer: string; readonly declaredAt: string };
  /** The opportunity rule: which legal moves from `fen` exhibit the leaf's event. */
  readonly exhibits: (fen: string, moveUci: string) => boolean;
}

export interface SkillDecision {
  readonly runId: string;
  readonly branchId: string;
  readonly nodeId: string;
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly legalMoves: readonly string[];
  readonly occurredAt: string;
}

export interface ConceptMark {
  readonly kind: `first_concept:${string}`;
  readonly leafId: string;
  readonly category: SkillCategory;
  readonly occurredAt: string;
  readonly sentence: string;
  readonly link: { readonly runId: string; readonly branchId: string; readonly nodeId: string };
  readonly authority: AdmittedSkillLeaf["authority"];
}

/**
 * Earned when (a) at least one legal move exhibits the leaf's event and at least one declines it,
 * and (b) the played move exhibits it. The first qualifying decision (by time, then run and node)
 * earns the mark; repetition earns nothing (dedupe by kind).
 */
export function deriveConceptMarks(decisions: readonly SkillDecision[], leaves: readonly AdmittedSkillLeaf[]): readonly ConceptMark[] {
  const ordered = [...decisions].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.runId.localeCompare(right.runId) || left.nodeId.localeCompare(right.nodeId));
  const marks: ConceptMark[] = [];
  for (const leaf of leaves) {
    for (const decision of ordered) {
      if (!leaf.exhibits(decision.beforeFen, decision.moveUci)) continue;
      const exhibiting = decision.legalMoves.filter((move) => leaf.exhibits(decision.beforeFen, move)).length;
      const declining = decision.legalMoves.length - exhibiting;
      if (exhibiting < 1 || declining < 1) continue;
      marks.push(Object.freeze({
        kind: `first_concept:${leaf.leafId}` as const,
        leafId: leaf.leafId,
        category: leaf.category,
        occurredAt: decision.occurredAt,
        sentence: `First ${leaf.label} recorded.`,
        link: Object.freeze({ runId: decision.runId, branchId: decision.branchId, nodeId: decision.nodeId }),
        authority: leaf.authority,
      }));
      break;
    }
  }
  return Object.freeze(marks);
}

/** Criterion 12's copy guard, shared by the server view and the client surface test. */
export const SKILLS_SURFACE_FORBIDDEN = /%|\bscore\b|\bstreak\b|\brating\b|\branking\b|\d+\s*\/\s*\d+/i;
