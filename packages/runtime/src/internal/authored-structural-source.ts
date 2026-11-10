// Package-private issuers: only the two validators and two registries may capture documents.
import { canonicalizeJson, assertStructuralConventionSelection, type DrillPackDefinition, type StructuralExpression, type SuccessCondition, type TransitionExpression } from "@chess-tabiya/schema/drill-pack";
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { evidenceDigest } from "../evidence-contract.js";
import { mirrorExpression } from "../structure.js";
import { isImmutableOwnData } from "./immutable-data.js";

type Document = DrillPackDefinition | ShapeEntryDefinition;
type Kind = "pack" | "shape";
type Stage = "draft_validation" | "registered";
declare const documentBrand: unique symbol;
export interface AuthoredStructuralDocument { readonly [documentBrand]: true }
declare const sourceBrand: unique symbol;
export interface AuthoredStructuralConditionSource { readonly [sourceBrand]: true }
export interface AuthoredDocumentImage {
  readonly kind: Kind; readonly stage: Stage; readonly documentId: string; readonly version: string;
  readonly digest: string; readonly document: Document;
}
interface DocumentData {
  readonly image: AuthoredDocumentImage; readonly sites: ReadonlyMap<string, StructuralExpression>;
  readonly plans: ReadonlyMap<string, string>; readonly shapes: ReadonlyMap<string, AuthoredStructuralDocument>;
  readonly assertCurrent: () => void;
  readonly recordIdentity?: object;
}
export interface AuthoredStructuralSubstitution {
  readonly path: string; readonly planClassPointer: string; readonly planClassId: string;
  readonly shape: AuthoredDocumentImage; readonly pointer: string; readonly expression: StructuralExpression;
}
export interface AuthoredStructuralSourceImage {
  readonly origin: AuthoredDocumentImage; readonly pointer: string;
  readonly authoredNode: unknown;
  readonly expression: StructuralExpression; readonly effectiveExpression: StructuralExpression;
  readonly substitutions: readonly AuthoredStructuralSubstitution[];
}
interface SourceData { readonly image: AuthoredStructuralSourceImage; readonly documents: readonly AuthoredStructuralDocument[] }
const DOCUMENTS = new WeakMap<object, DocumentData>(), DOCUMENT_HANDLES = new WeakMap<object, AuthoredStructuralDocument>();
const SOURCES = new WeakMap<object, SourceData>(), EXPRESSION_SOURCES = new WeakMap<object, AuthoredStructuralConditionSource>();
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}
const ptr = (path: string, token: string | number) => `${path}/${String(token).replaceAll("~", "~0").replaceAll("/", "~1")}`;

/** Typed document fields only. Prose, arbitrary metadata and equal AST copies are not addresses. */
export function authoredStructuralSites(kind: Kind, document: Document): ReadonlyMap<string, StructuralExpression> {
  const sites = new Map<string, StructuralExpression>();
  const expression = (node: StructuralExpression, path: string): void => {
    sites.set(path, node);
    if (node.kind === "all" || node.kind === "any") node.of.forEach((child, index) => expression(child, `${path}/of/${index}`));
    else if (node.kind === "not" || node.kind === "mirrored") expression(node.of, `${path}/of`);
    else if (node.kind === "feature" || node.kind === "quantified") assertStructuralConventionSelection(node.feature as unknown as Readonly<Record<string, unknown>>);
    else if (node.kind !== "pieceOnSquare" && node.kind !== "plan_signature") throw new TypeError("Unknown authored structural expression kind");
  };
  if (kind === "shape") {
    const shape = document as ShapeEntryDefinition;
    expression(shape.trigger, "/trigger");
    shape.plans.forEach((plan, index) => { if (plan.success.signature !== null) expression(plan.success.signature, `/plans/${index}/success/signature`); });
  } else {
    const pack = document as DrillPackDefinition;
    const transition = (node: TransitionExpression, path: string): void => {
      if (node.kind === "all" || node.kind === "any") node.of.forEach((child, index) => transition(child, `${path}/of/${index}`));
      else if (node.kind === "not") transition(node.of, `${path}/of`);
      else if (node.kind === "position") expression(node.expression, `${path}/expression`);
    };
    const success = (conditions: readonly SuccessCondition[] | undefined, path: string): void => {
      conditions?.forEach((condition, index) => {
        const at = ptr(path, index);
        if (condition.kind === "structural_feature") expression(condition.feature, `${at}/feature`);
        else if (condition.kind === "transition_feature") transition(condition.transition, `${at}/transition`);
        // The use-site is the actual plan_consequence object; its explicit plan reference is retained.
        else if (condition.kind === "plan_consequence") sites.set(at, freeze({ kind: "plan_signature", planClassId: condition.planClassId }));
      });
    };
    const fen = (node: Readonly<Record<string, unknown>>, path: string): void => {
      if (node.type === "structuralFeature") expression(node.feature as StructuralExpression, `${path}/feature`);
    };
    success(pack.objective.successConditions, "/objective/successConditions");
    pack.legs?.forEach((leg, index) => success(leg.objective.successConditions, `/legs/${index}/objective/successConditions`));
    pack.authoredBoundary?.fenPredicates?.forEach((node, index) => fen(node, `/authoredBoundary/fenPredicates/${index}`));
    pack.checkpoints.forEach((checkpoint, index) => {
      if ("fenPredicate" in checkpoint.trigger) fen(checkpoint.trigger.fenPredicate, `/checkpoints/${index}/trigger/fenPredicate`);
      if (checkpoint.interaction?.type === "stated_reasoning") checkpoint.interaction.keyPoints.forEach((point, pointIndex) => {
        if (point.ground.kind === "structural") expression(point.ground.expression, `/checkpoints/${index}/interaction/keyPoints/${pointIndex}/ground/expression`);
      });
    });
    pack.timingWindows?.forEach((window, index) => {
      if ("onTrigger" in window.opens && "fenPredicate" in window.opens.onTrigger) fen(window.opens.onTrigger.fenPredicate, `/timingWindows/${index}/opens/onTrigger/fenPredicate`);
      window.closes.forEach((close, closeIndex) => { if (close.kind === "position") expression(close.feature, `/timingWindows/${index}/closes/${closeIndex}/feature`); });
    });
  }
  return sites;
}
function readDocument(source: AuthoredStructuralDocument): DocumentData {
  const data = source !== null && typeof source === "object" ? DOCUMENTS.get(source) : undefined;
  if (data === undefined) throw new TypeError("Authored document is not an original issuer capture");
  data.assertCurrent(); return data;
}
function capture(kind: Kind, stage: Stage, original: Document, shapes: readonly AuthoredStructuralDocument[], assertCurrent: () => void, recordIdentity?: object): AuthoredStructuralDocument {
  canonicalizeJson(original); // Reject values outside the same RFC8785 document domain as the async digests.
  const document = freeze(structuredClone(original)), sites = authoredStructuralSites(kind, document);
  const shapeSources = new Map<string, AuthoredStructuralDocument>();
  for (const handle of shapes) {
    const shape = readDocument(handle).image;
    if (shape.kind !== "shape" || shape.stage !== "registered") throw new TypeError("Pack expansion needs actual registered shape document authority");
    if (kind === "pack" && stage === "registered" && !(document as DrillPackDefinition).requires.some(capability =>
      capability.id === `shape.${shape.documentId}` && capability.version.kind === "semver" && capability.version.value === shape.version)) {
      throw new TypeError(`Registered pack shape requirement does not admit ${shape.documentId}@${shape.version}; re-admit the pack with updated requirements`);
    }
    shapeSources.set(shape.documentId, handle);
  }
  const image = freeze({ kind, stage, documentId: document.id, version: document.version, digest: `sha256:${evidenceDigest(document)}`, document });
  const plans = new Map<string, string>();
  if (kind === "pack") (document as DrillPackDefinition).planClasses?.forEach((plan, index) => { if (!plans.has(plan.id)) plans.set(plan.id, `/planClasses/${index}/shapePlan`); });
  const handle = Object.freeze({}) as AuthoredStructuralDocument;
  DOCUMENTS.set(handle, { image, sites, plans, shapes: shapeSources, assertCurrent, ...(recordIdentity === undefined ? {} : { recordIdentity }) }); DOCUMENT_HANDLES.set(original, handle);
  return handle;
}
/** Actual validatePackDocument, after schema/static validation, before semantic probes. */
export function captureDraftPackStructuralDocument(document: DrillPackDefinition, shapes: readonly AuthoredStructuralDocument[] = []): AuthoredStructuralDocument {
  return capture("pack", "draft_validation", document, shapes, () => {});
}
/** Actual validateShapeEntry, after schema/static validation, before semantic probes. */
export function captureDraftShapeStructuralDocument(document: ShapeEntryDefinition): AuthoredStructuralDocument {
  return capture("shape", "draft_validation", document, [], () => {});
}
interface RecordImage<D extends Document> { readonly document: D; readonly digest: string; readonly summary: { readonly id: string; readonly version: string; readonly digest: string } }
function registered<D extends Document>(kind: Kind, record: RecordImage<D>, current: () => RecordImage<D> | undefined, shapes: readonly AuthoredStructuralDocument[]): AuthoredStructuralDocument {
  const document = record.document, summary = record.summary, digest = record.digest;
  const immutableDocument = isImmutableOwnData(document);
  const check = (initial = false) => {
    if (current() !== record || record.document !== document || record.summary !== summary || record.digest !== digest
      || document.id !== summary.id || document.version !== summary.version || digest !== summary.digest
      || (initial || !immutableDocument) && digest !== `sha256:${evidenceDigest(document)}`) throw new TypeError("Authored registered document/summary is not the issuer's current exact record");
  };
  // Hash actual bytes at issuance. Frozen owned bytes cannot change; identities still recheck on
  // every read. Mutable/shallow-frozen inputs keep the full byte check on every read.
  check(true); return capture(kind, "registered", document, shapes, check, record);
}
export function captureRegisteredPackStructuralDocument(record: RecordImage<DrillPackDefinition>, current: () => RecordImage<DrillPackDefinition> | undefined, shapes: readonly AuthoredStructuralDocument[] = []): AuthoredStructuralDocument {
  return registered("pack", record, current, shapes);
}
export function captureRegisteredShapeStructuralDocument(record: RecordImage<ShapeEntryDefinition>, current: () => RecordImage<ShapeEntryDefinition> | undefined): AuthoredStructuralDocument {
  return registered("shape", record, current, []);
}
/** F2 §2.4b: join the actual registry record, never a same-byte document or a draft. */
export function assertRegisteredShapeTriggerSource(source: AuthoredStructuralConditionSource,
  record: Readonly<{ recordIdentity: object; document: ShapeEntryDefinition; digest: string }>): void {
  const data = SOURCES.get(source);
  if (data === undefined || data.documents.length !== 1) throw new TypeError("Shape trigger lacks its original document source");
  const owner = readDocument(data.documents[0]!);
  if (owner.recordIdentity !== record.recordIdentity || owner.image.kind !== "shape" || owner.image.stage !== "registered"
    || owner.image.documentId !== record.document.id || owner.image.version !== record.document.version
    || owner.image.digest !== record.digest || data.image.pointer !== "/trigger"
    || data.image.origin !== owner.image || data.image.substitutions.length !== 0) throw new TypeError("Shape trigger crosses its original registered record");
}
export function authoredStructuralDocument(document: Document): AuthoredStructuralDocument {
  const handle = DOCUMENT_HANDLES.get(document);
  if (handle === undefined) throw new TypeError("Document has not passed an authored-source issuer");
  readDocument(handle); return handle;
}
export function maybeAuthoredStructuralDocument(document: Document): AuthoredStructuralDocument | undefined {
  const handle = DOCUMENT_HANDLES.get(document);
  if (handle !== undefined) readDocument(handle);
  return handle;
}

/** The selector takes only an issued document and literal address, never an alternative AST. */
export function selectAuthoredStructuralCondition(document: AuthoredStructuralDocument, pointer: string): AuthoredStructuralConditionSource {
  const owner = readDocument(document), expression = owner.sites.get(pointer);
  if (expression === undefined) throw new TypeError(`Not an authored structural expression address: ${pointer}`);
  const documents: AuthoredStructuralDocument[] = [document], substitutions: AuthoredStructuralSubstitution[] = [];
  const expand = (node: StructuralExpression, path: string): StructuralExpression => {
    if (node.kind === "plan_signature") {
      if (owner.image.kind !== "pack") throw new TypeError("Shape expressions cannot resolve pack-local plans");
      const pack = owner.image.document as DrillPackDefinition;
      const candidates = pack.planClasses?.filter(row => row.id === node.planClassId) ?? [];
      if (candidates.length !== 1) throw new TypeError(`Authored plan identity is missing or ambiguous: ${node.planClassId}`);
      const reference = candidates[0]!.shapePlan;
      const shapeHandle = reference === undefined ? undefined : owner.shapes.get(reference.shape);
      const relation = pack.shapes?.find(row => typeof row === "string" ? row === reference?.shape : row.shape === reference?.shape);
      if (reference === undefined || shapeHandle === undefined || (typeof relation === "object" && relation.relation === "prospective")) throw new TypeError(`Required authored plan source unavailable: ${node.planClassId}`);
      const shape = readDocument(shapeHandle), entries = (shape.image.document as ShapeEntryDefinition).plans;
      const index = entries.findIndex(row => row.id === reference.plan), signature = entries[index]?.success.signature;
      if (signature == null) throw new TypeError(`Required authored shape signature unavailable: ${reference.shape}/${reference.plan}`);
      const signaturePointer = `/plans/${index}/success/signature`;
      for (const candidate of shape.sites.values()) if (candidate.kind === "plan_signature") throw new TypeError("Shape plan signatures cannot contain pack-local plan references");
      documents.push(shapeHandle);
      substitutions.push(freeze({ path, planClassPointer: owner.plans.get(node.planClassId)!, planClassId: node.planClassId, shape: shape.image, pointer: signaturePointer, expression: signature }));
      return signature;
    }
    if (node.kind === "all" || node.kind === "any") return freeze({ ...node, of: node.of.map((child, index) => expand(child, `${path}/of/${index}`)) as unknown as typeof node.of });
    if (node.kind === "not" || node.kind === "mirrored") return freeze({ ...node, of: expand(node.of, `${path}/of`) });
    return node;
  };
  // Every invocation/use-site owns a distinct AST identity, including shared shape signatures.
  const effectiveExpression = freeze(structuredClone(expand(expression, pointer)));
  // Substitution can introduce an unsupported mirror even when the original pack only named
  // a plan reference. Validate all expanded branches before issuing any executable source.
  const preflight = (node: StructuralExpression): void => {
    if (node.kind === "all" || node.kind === "any") node.of.forEach(preflight);
    else if (node.kind === "not" || node.kind === "mirrored") {
      preflight(node.of);
      if (node.kind === "mirrored") mirrorExpression(node.of, node.axis);
    } else if (node.kind === "feature" || node.kind === "quantified") assertStructuralConventionSelection(node.feature as unknown as Readonly<Record<string, unknown>>);
    else if (node.kind !== "pieceOnSquare") throw new TypeError("Unresolved or unsupported expanded structural expression");
  };
  preflight(effectiveExpression);
  let authoredNode: unknown = owner.image.document;
  for (const token of pointer.slice(1).split("/")) authoredNode = (authoredNode as Record<string, unknown>)[token.replaceAll("~1", "/").replaceAll("~0", "~")];
  const source = Object.freeze({}) as AuthoredStructuralConditionSource;
  const image = freeze({ origin: owner.image, pointer, authoredNode, expression, effectiveExpression, substitutions });
  SOURCES.set(source, { image, documents: Object.freeze(documents) });
  // Only real source-owned nodes and their computed expansions are bound, never equal caller copies.
  EXPRESSION_SOURCES.set(effectiveExpression, source);
  return source;
}
export function readAuthoredStructuralConditionSource(source: AuthoredStructuralConditionSource): AuthoredStructuralSourceImage {
  const data = source !== null && typeof source === "object" ? SOURCES.get(source) : undefined;
  if (data === undefined) throw new TypeError("Structural condition source is not original private issuance");
  data.documents.forEach(readDocument); return data.image;
}
export function sourceForAuthoredExpression(expression: StructuralExpression): AuthoredStructuralConditionSource {
  const source = EXPRESSION_SOURCES.get(expression);
  if (source === undefined) throw new TypeError("Expression does not carry an authenticated authored source");
  readAuthoredStructuralConditionSource(source); return source;
}
