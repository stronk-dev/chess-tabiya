/**
 * Test-side bindings between authored convention declarations and the code that computes them
 * (rfc/semantic-convention-provenance.md §1.2 "a future declaration is authored directly").
 *
 * Each function renders, from the executable code record, the exact definition/limitations/authority
 * text the registered declaration must carry. `evidence-conventions.test.ts` requires byte equality,
 * so a code operand, quote, stage, catalogue term or band boundary cannot change without a new
 * convention version. Not exported from the package barrel; not a runtime authority.
 */
import type { ConventionAuthority, ConventionDeclaration } from "../evidence-conventions.js";
import { ENDGAME_CONVENTION_SOURCES, ENDGAME_SETUP_CONVENTIONS, type EndgameSetupConvention } from "../endgame-setup.js";
import { ENDGAME_METHOD_CONVENTIONS, type EndgameMethodConvention } from "../endgame-method.js";
import { STRUCTURE_PREDICATES, type StructuralExpression } from "../structure.js";
import { DEVELOPED_MATERIAL_MIN, ENDGAME_MATERIAL_MAX, MIDDLEGAME_UNDEVELOPED_MAX, OPENING_UNDEVELOPED_MIN } from "../phase.js";

export const WIKIPEDIA_LICENCE = "CC BY-SA 4.0 (short verbatim quotation with attribution)";
export const QUOTATION_LICENCE = "short verbatim quotation with attribution";

function sourceAuthority(id: string): ConventionAuthority {
  const source = ENDGAME_CONVENTION_SOURCES.find((candidate) => candidate.id === id);
  if (source === undefined) throw new TypeError(`unknown endgame convention source ${id}`);
  return {
    kind: "published_source",
    citation: `${source.title}, ${source.url} (${source.revision}; retrieved ${source.retrieved})`,
    licence: source.url.startsWith("https://en.wikipedia.org/") ? WIKIPEDIA_LICENCE : QUOTATION_LICENCE,
  };
}

export function setupDeclaration(convention: EndgameSetupConvention): ConventionDeclaration {
  return {
    ref: { id: convention.id, version: convention.version },
    definition: `${convention.name} setup: a position matches only when every operand holds. ${convention.operands.map((operand) => `${operand.id}: ${operand.predicate}`).join(" ")} Ranks are relative to the named side (1 = its back rank).`,
    limitations: [
      "A match is geometry under this convention only; it carries no outcome, advice, reachability or significance.",
      ...convention.operands.filter((operand) => operand.operationalization !== null).map((operand) => `${operand.id}: ${operand.operationalization}`),
      ...convention.excluded.map((excluded) => `Not required in this version: ${excluded.condition}. ${excluded.reason}`),
    ],
    authority: convention.sources.map(sourceAuthority),
    disclosure: { kind: "definition_and_limitations" },
  };
}

export function methodDeclaration(convention: EndgameMethodConvention): ConventionDeclaration {
  return {
    ref: { id: convention.id, version: convention.version },
    definition: `${convention.technique} method stages observed along one exact recorded path anchored by a positive ${convention.setup.id}@${convention.setup.version} setup match, for the ${convention.beneficiary === "pawn_side" ? "pawn side" : "defender"}. ${convention.stages.map((stage) => `${stage.stage}${stage.after === null ? "" : ` (after ${stage.after})`}: ${stage.predicate}`).join(" ")}`,
    limitations: [
      "A method stage is a retrospective observation over an exact recorded path; it says nothing about whether the stage was best, whether the outcome was preserved, or whether the setup could have been reached or forced.",
      ...convention.stages.filter((stage) => stage.operationalization !== null).map((stage) => `${stage.stage}: ${stage.operationalization}`),
    ],
    authority: convention.sources.map(sourceAuthority),
    disclosure: { kind: "definition_and_limitations" },
  };
}

function term(expression: StructuralExpression): string {
  if (expression.kind === "feature") return `${expression.feature.kind}(${Object.entries(expression.feature).filter(([key]) => key !== "kind").map(([, value]) => String(value)).join(", ")})`;
  if (expression.kind === "pieceOnSquare") return `${expression.piece === null ? "no piece" : `${expression.piece.color} ${expression.piece.role}`} on ${expression.square}`;
  if (expression.kind === "all" || expression.kind === "any") return `${expression.kind}(${expression.of.map(term).join("; ")})`;
  throw new TypeError(`unsupported catalogue term ${expression.kind}`);
}

export function namedStructureDefinition(): string {
  return `A position matches a registered structure-catalogue entry when that entry's registered expression holds under the structural-feature vocabulary: ${Object.entries(STRUCTURE_PREDICATES).map(([id, expression]) => `${id} = ${term(expression)}`).join("; ")}. The payload carries the entry's id, catalogue name and catalogue provenance note.`;
}

export function phaseBandsDefinition(): string {
  return `Phase is computed from one FEN. Non-pawn material counts queen 9, rook 5, bishop 3, knight 3 per colour; undeveloped minors count each colour's bishops or knights standing on its own b, c, f or g back-rank square, role-agnostic. With M the larger colour's material and U the two colours' undeveloped-minor total: M <= ${ENDGAME_MATERIAL_MAX} is endgame; otherwise M < ${DEVELOPED_MATERIAL_MIN} is unclear (material transition gap); otherwise U >= ${OPENING_UNDEVELOPED_MIN} is opening, U <= ${MIDDLEGAME_UNDEVELOPED_MAX} is middlegame, and any U between them is unclear (development transition gap). The reading records exactly one of these five decision arms with its integer margin or distances.`;
}

export const SETUP_DECLARATIONS = (): readonly ConventionDeclaration[] => ENDGAME_SETUP_CONVENTIONS.map(setupDeclaration);
export const METHOD_DECLARATIONS = (): readonly ConventionDeclaration[] => ENDGAME_METHOD_CONVENTIONS.map(methodDeclaration);
