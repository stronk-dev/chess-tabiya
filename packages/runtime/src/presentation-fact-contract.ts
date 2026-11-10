// D3948: one tuple drives an adapter's construction and received fact/caption validation.
// This is private adapter plumbing, not a renderer registry or an evidence issuer.
import type { SquareName } from "chessops/types";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import type { DeclaredEvidence } from "./evidence-contract.js";
import type { AdapterSpec, ComponentValue, FactOperandsByRenderer, FactStatementOperand, FactStatementRendererId, PresentationConventionId, PresentationKit, PresentedEvidenceRef, RelationOverlayOperand } from "./presentation-contract.js";
import { PresentationSchemaError } from "./presentation-schema.js";

export function bindFactStatement<R extends FactStatementRendererId>(
  build: PresentationKit["fact"], rendererId: R,
  binding: FactStatementOperand["binding"], convention: FactStatementOperand["convention"],
) {
  const operand = (operands: FactOperandsByRenderer[R]): FactStatementOperand => build(rendererId, binding, convention, operands);
  const assertOperand = (value: FactStatementOperand): void => {
    if (value.rendererId !== rendererId || value.binding !== binding || value.convention !== convention) {
      throw new TypeError("Presentation fact crosses its registered adapter renderer, binding or convention");
    }
  };
  return Object.freeze({
    operand,
    statement: (operands: FactOperandsByRenderer[R]): ComponentValue => ({ id: "fact_statement", operand: operand(operands) }),
    assertOperand,
    validateWireComponent: (component: ComponentValue): void => {
      if (component.id === "fact_statement") assertOperand(component.operand);
      else if (component.id === "square_set") assertOperand(component.operand.caption);
    },
  });
}

/** Internal consistency only; this does not authenticate the original source behind a digest. */
export function assertSquareSetGeometry(component: Extract<ComponentValue, { id: "square_set" }>, owner: string,
  squares: readonly SquareName[], brush: Parameters<PresentationKit["squareSet"]>[2]): void {
  const expected = new Set(squares);
  if (component.operand.brush !== brush || component.operand.owner.factRef !== owner
    || component.operand.squares.length !== expected.size || component.operand.squares.some(square => !expected.has(square))) {
    throw new TypeError("Board geometry crosses its registered caption witnesses, brush or owner");
  }
}

/** The declared footprint drives both source construction and received square-caption checks. */
export function bindSquareFactStatement<R extends FactStatementRendererId>(kit: PresentationKit, rendererId: R,
  binding: FactStatementOperand["binding"], convention: FactStatementOperand["convention"],
  squares: (operands: FactOperandsByRenderer[R]) => readonly SquareName[], brush: Parameters<PresentationKit["squareSet"]>[2]) {
  const bound = bindFactStatement(kit.fact, rendererId, binding, convention);
  return Object.freeze({ ...bound,
    square: (evidence: DeclaredEvidence<unknown>, operands: FactOperandsByRenderer[R]): ComponentValue => {
      const caption = bound.operand(operands);
      const footprint = squares(caption.operands as FactOperandsByRenderer[R]);
      if (footprint.length === 0) throw new PresentationSchemaError("A board caption requires actual square witnesses");
      return kit.squareSet(evidence, footprint, brush, caption);
    },
    validateWireComponent: (component: ComponentValue, evidence: PresentedEvidenceRef): void => {
      bound.validateWireComponent(component);
      if (component.id === "square_set") {
        // The exact renderer has been checked before reading its typed operands.
        assertSquareSetGeometry(component, evidence.evidenceDigest, squares(component.operand.caption.operands as FactOperandsByRenderer[R]), brush);
      }
    },
  });
}

/** One family's original relation semantics drive construction and received validation.
 * This checks the declared relation, not the source authenticity or unretained endpoints. */
interface RelationProfile {
  readonly answerDistance: RelationOverlayOperand["answerDistance"];
  readonly relation: RelationOverlayOperand["edges"][number]["relation"];
  readonly sign: RelationOverlayOperand["edges"][number]["sign"];
  readonly convention?: PresentationConventionId;
}
interface RelationFootprint {
  readonly nodes: RelationOverlayOperand["nodes"];
  readonly endpoints: readonly Pick<RelationOverlayOperand["edges"][number], "from" | "to">[];
}
/** Original first-occurrence normalization, shared by construction and correspondence. */
function relationGeometry(footprint: RelationFootprint, profile: RelationProfile) {
  const unique = new Map<string, RelationOverlayOperand["nodes"][number]>();
  for (const node of footprint.nodes) if (!unique.has(node.square)) unique.set(node.square, node);
  const edgeKeys = new Set<string>();
  const edges = footprint.endpoints.filter(edge => {
    const key = `${edge.from}${edge.to}`;
    if (edgeKeys.has(key)) return false;
    edgeKeys.add(key); return true;
  }).map(edge => ({ from: edge.from, to: edge.to, relation: profile.relation, sign: profile.sign }));
  return { nodes: [...unique.values()], edges };
}

export function bindRelationOverlay(kit: PresentationKit,
  validateCaption: NonNullable<AdapterSpec["validateWireComponent"]>,
  profile: RelationProfile) {
  const { answerDistance, relation, sign, convention } = profile;
  return Object.freeze({
    overlay: (evidence: DeclaredEvidence<unknown>, nodes: RelationOverlayOperand["nodes"],
      endpoints: readonly Pick<RelationOverlayOperand["edges"][number], "from" | "to">[]): ComponentValue => {
      return { id: "relation_overlay", operand: { ...relationGeometry({ nodes, endpoints }, profile),
        owner: { factRef: kit.factRef(evidence) }, answerDistance,
        ...(convention === undefined ? {} : { convention: kit.declared(evidence, convention) }) } };
    },
    validateWireComponent: (component: ComponentValue, evidence: PresentedEvidenceRef): void => {
      validateCaption(component, evidence);
      if (component.id !== "relation_overlay") return;
      const operand = component.operand;
      const fail = (): never => { throw new TypeError("Relation overlay crosses its registered source semantics, owner or convention"); };
      if (operand.owner.factRef !== evidence.evidenceDigest || operand.answerDistance !== answerDistance
        || operand.edges.some(edge => edge.relation !== relation || edge.sign !== sign)) return fail();
      const receipt = operand.convention;
      if (convention === undefined) { if (receipt !== undefined) return fail(); }
      else if (receipt === undefined || receipt.producer.id !== evidence.producer.id
        || receipt.producer.version !== evidence.producer.version || receipt.sourceProjection.id !== evidence.projection.id
        || receipt.sourceProjection.version !== evidence.projection.version || receipt.sourceEvidenceDigest !== evidence.evidenceDigest
        || receipt.perspective !== "not_applicable" || receipt.basis.kind !== "declared" || receipt.basis.convention !== convention) return fail();
    },
  });
}

/** D4049/D4050: one typed retained caption recipe, not source authentication. */
export function bindRelationFactStatement<R extends FactStatementRendererId>(kit: PresentationKit,
  fact: Omit<ReturnType<typeof bindFactStatement<R>>, "validateWireComponent"> & {
    readonly validateWireComponent: NonNullable<AdapterSpec["validateWireComponent"]>;
  }, profile: RelationProfile,
  recipe: (operands: FactOperandsByRenderer[R]) => RelationFootprint,
  validateCaption: NonNullable<AdapterSpec["validateWireComponent"]> = fact.validateWireComponent) {
  const relation = bindRelationOverlay(kit, validateCaption, profile);
  return Object.freeze({ ...relation,
    components: (evidence: DeclaredEvidence<unknown>, operands: FactOperandsByRenderer[R]): readonly ComponentValue[] => {
      const caption = fact.operand(operands);
      const footprint = recipe(caption.operands as FactOperandsByRenderer[R]);
      return [relation.overlay(evidence, footprint.nodes, footprint.endpoints), { id: "fact_statement", operand: caption }];
    },
    validateWireComposition: (components: readonly ComponentValue[], evidence: PresentedEvidenceRef): void => {
      const [board, statement] = components;
      if (components.length !== 2 || board?.id !== "relation_overlay" || statement?.id !== "fact_statement") {
        throw new PresentationSchemaError("Relation composition requires its original ordered arrow and statement");
      }
      relation.validateWireComponent(board, evidence);
      relation.validateWireComponent(statement, evidence);
      fact.assertOperand(statement.operand);
      const expected = relationGeometry(recipe(statement.operand.operands as FactOperandsByRenderer[R]), profile);
      if (canonicalizeJson(board.operand.nodes) !== canonicalizeJson(expected.nodes)
        || canonicalizeJson(board.operand.edges) !== canonicalizeJson(expected.edges)) {
        throw new PresentationSchemaError("Relation geometry crosses its own retained caption recipe");
      }
    },
  });
}
