// Accepted F2 §§2.3d/i. Owned complete source data, not reduction mint or access authority.
import type { SquareName } from "chessops/types";
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence, type VersionedEvidenceId } from "./evidence-contract.js";
import { COMPARISON_STRUCTURAL_ROUTES } from "./internal/comparison-structural-families.js";
import { assertRecordedPositionInvocation, invokeEvidenceValueRoute, readStructuralPopulationInvocation } from "./internal/evidence-value-routes.js";
import { recordedComparisonData, type RecordedComparisonSource } from "./recorded-comparison.js";
import type { RecordedPosition } from "./review-points.js";
import { STRUCTURAL_FEATURE_KINDS, observationIdentity, type StructuralObservation } from "./structure.js";

declare const structuralPopulationBrand: unique symbol;
export interface RecordedComparisonStructuralPopulation { readonly [structuralPopulationBrand]: true }
interface FamilyRow { readonly projection: VersionedEvidenceId; readonly items: readonly DeclaredEvidence<unknown>[] }
interface NodeRow { readonly pathIndex: number; readonly position: DeclaredEvidence<RecordedPosition>; readonly families: readonly FamilyRow[] }
interface Column { readonly branchId: string; readonly throughNodeId: string; readonly nodes: readonly NodeRow[] }
interface PopulationData { readonly comparison: RecordedComparisonSource; readonly columns: readonly [Column, Column] }
interface NamedStructurePayload { readonly id: string; readonly name: string; readonly squares: readonly SquareName[]; readonly provenanceNote: string }
export interface ScopedStructuralObservationChange {
  readonly observation: StructuralObservation;
  readonly namedStructure: Readonly<{ id: string; name: string }> | null;
}
interface Appearance {
  readonly nodeId: string;
  readonly plyOffset: number;
  readonly payload: ScopedStructuralObservationChange;
  /** Original source ordinals, retained through observation sorting/selection. */
  readonly occurrence: Readonly<{ column: number; pathIndex: number; family: number; item: number }>;
}
const populations = new WeakMap<object, PopulationData>();
const refs = Object.freeze(COMPARISON_STRUCTURAL_ROUTES.map(route => {
  const [id, version] = route.split("@");
  return Object.freeze({ id: id!, version: Number(version) });
}));
const exactRef = (ref: VersionedEvidenceId) => `${ref.id}@${ref.version}`;

/** Only the nominal comparison owner supplies original run/node and full granted columns. */
export function collectComparisonStructuralPopulation(input: Readonly<{ comparison: RecordedComparisonSource }>): RecordedComparisonStructuralPopulation {
  if (input === null || typeof input !== "object" || Reflect.ownKeys(input).length !== 1 || !Object.hasOwn(input, "comparison")) throw new TypeError("Structural collection requires exactly {comparison}");
  const { comparison } = input, { run, authority } = recordedComparisonData(comparison);
  const positions = new Map<string, DeclaredEvidence<RecordedPosition>>(), familiesByFen = new Map<string, readonly FamilyRow[]>();
  const columns = authority.columns.map((column, columnIndex): Column => {
    const nodes = authority.paths[columnIndex]!, forkIndex = nodes.findIndex(entry => entry.node.id === authority.forkNodeId);
    return Object.freeze({ ...column, nodes: Object.freeze(nodes.slice(forkIndex).map(({ node }, offset): NodeRow => {
      let position = positions.get(node.id);
      if (position === undefined) {
        position = invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: node.id });
        assertRecordedPositionInvocation(position, run, node.id);
        positions.set(node.id, position);
      }
      let families = familiesByFen.get(node.fen);
      if (families === undefined) {
        families = Object.freeze(COMPARISON_STRUCTURAL_ROUTES.map((route, family): FamilyRow => {
          const items = invokeEvidenceValueRoute(route, { fen: node.fen });
          readStructuralPopulationInvocation(items, route, node.fen);
          return Object.freeze({ projection: refs[family]!, items });
        }));
        familiesByFen.set(node.fen, families);
      }
      return Object.freeze({ pathIndex: forkIndex + offset, position, families });
    })) });
  }) as [Column, Column];
  const population = Object.freeze({}) as RecordedComparisonStructuralPopulation;
  populations.set(population, Object.freeze({ comparison, columns: Object.freeze(columns) }));
  // Verify the complete source before issuing it, even for later fork-only/zero-result selection.
  readComparisonStructuralPopulation(population);
  return population;
}

/** Private reader: no caller rows, array copies or nominal-symbol assertions authenticate data. */
export function readComparisonStructuralPopulation(population: RecordedComparisonStructuralPopulation): PopulationData {
  const data = population !== null && typeof population === "object" ? populations.get(population) : undefined;
  if (data === undefined) throw new TypeError("Structural population was not issued by its source owner");
  const { run, authority } = recordedComparisonData(data.comparison);
  for (const [columnIndex, column] of data.columns.entries()) {
    const grant = authority.columns[columnIndex]!, path = authority.paths[columnIndex]!, start = path.findIndex(entry => entry.node.id === authority.forkNodeId);
    if (column.branchId !== grant.branchId || column.throughNodeId !== grant.throughNodeId || column.nodes.length !== path.length - start) throw new TypeError("Structural population crosses its complete column grant");
    for (const [index, row] of column.nodes.entries()) {
      const node = path[start + index]!.node;
      if (row.pathIndex !== start + index || row.families.length !== COMPARISON_STRUCTURAL_ROUTES.length) throw new TypeError("Structural population dropped/reordered an original node or family");
      assertRecordedPositionInvocation(row.position, run, node.id);
      for (const [family, values] of row.families.entries()) {
        const route = COMPARISON_STRUCTURAL_ROUTES[family]!;
        if (exactRef(values.projection) !== route) throw new TypeError("Structural population family order/ref is not exact");
        readStructuralPopulationInvocation(values.items, route, node.fen);
      }
    }
  }
  return data;
}

/** An independently issued identical logical scope is valid; a different head/grant is not. */
export function assertComparisonStructuralPopulationScope(population: RecordedComparisonStructuralPopulation, comparison: RecordedComparisonSource): void {
  const data = readComparisonStructuralPopulation(population);
  if (evidenceDigest(recordedComparisonData(data.comparison).authority) !== evidenceDigest(recordedComparisonData(comparison).authority)) throw new TypeError("Structural population belongs to a different comparison scope");
}

function columnIndex(data: PopulationData, branchId: string): number {
  const index = data.columns.findIndex(column => column.branchId === branchId);
  if (index < 0) throw new TypeError("Structural selection branch is not a granted comparison column");
  return index;
}
function observations(row: NodeRow) {
  const values = row.families.flatMap((family, familyIndex) => family.items.map((item, itemIndex) => {
    const named = family.projection.id === "rules.structural.reading.named_structure", payload = item.payload as NamedStructurePayload;
    const observation: StructuralObservation = named
      ? Object.freeze({ kind: "named_structure", squares: payload.squares, provenanceNote: payload.provenanceNote })
      : item.payload as StructuralObservation;
    return { observation, namedStructure: named ? Object.freeze({ id: payload.id, name: payload.name }) : null, family: familyIndex, item: itemIndex,
      kind: STRUCTURAL_FEATURE_KINDS.indexOf(observation.kind), key: JSON.stringify(observation) };
  }));
  // The old view's locale ordering and stable family/item ties are deliberate, not a new rank.
  values.sort((left, right) => left.kind - right.kind || left.key.localeCompare(right.key));
  return values;
}

/** Whole-grant intersection and immediate-predecessor selection, never a whole-tip crop. */
export function comparisonStructuralAppearances(population: RecordedComparisonStructuralPopulation, branchId: string): readonly Appearance[] {
  const data = readComparisonStructuralPopulation(population), index = columnIndex(data, branchId);
  const views = data.columns.map(column => column.nodes.map(row => observations(row)));
  const unions = views.map(rows => new Set(rows.slice(1).flatMap(values => values.map(value => observationIdentity(value.observation)))));
  const common = new Set([...unions[0]!].filter(identity => unions[1]!.has(identity)));
  const column = data.columns[index]!, forkPly = column.nodes[0]!.position.payload.ply, output: Appearance[] = [];
  let previous = new Set<string>();
  for (const [ordinal, row] of column.nodes.entries()) {
    const values = views[index]![ordinal]!, current = new Set(values.map(value => observationIdentity(value.observation)));
    if (ordinal > 0) for (const value of values) {
      const identity = observationIdentity(value.observation);
      if (!previous.has(identity) && !common.has(identity)) output.push(Object.freeze({ nodeId: row.position.payload.nodeId,
        plyOffset: row.position.payload.ply - forkPly, payload: Object.freeze({ observation: value.observation, namedStructure: value.namedStructure }),
        occurrence: Object.freeze({ column: index, pathIndex: row.pathIndex, family: value.family, item: value.item }) }));
    }
    previous = current;
  }
  return Object.freeze(output);
}

/** Explicit future reduction input image: full scope, every empty invocation and every receipt. */
export function comparisonStructuralPopulationImage(population: RecordedComparisonStructuralPopulation, branchId: string) {
  const data = readComparisonStructuralPopulation(population); columnIndex(data, branchId);
  const encoded = (value: DeclaredEvidence<unknown>) => {
    assertDeclaredEvidence(value);
    return Object.freeze({ producer: value.producer, projection: value.projection, receipt: evidenceValueReceipt(value) });
  };
  return Object.freeze({ comparison: recordedComparisonData(data.comparison).authority, branchId,
    columns: Object.freeze(data.columns.map(column => Object.freeze({ branchId: column.branchId, throughNodeId: column.throughNodeId,
      nodes: Object.freeze(column.nodes.map(row => Object.freeze({ pathIndex: row.pathIndex, position: encoded(row.position),
        families: Object.freeze(row.families.map((family, index) => {
          const invocation = readStructuralPopulationInvocation(family.items, COMPARISON_STRUCTURAL_ROUTES[index]!, row.position.payload.fen);
          return Object.freeze({ projection: family.projection, items: Object.freeze(family.items.map(encoded)),
            invocation: Object.freeze({ factory: invocation.factory, fen: invocation.fen, inputDigest: invocation.inputDigest, convention: invocation.convention }) });
        })) }))) }))) });
}
