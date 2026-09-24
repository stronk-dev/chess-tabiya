// rfc/evidence-presentation.md §3 — pure view models for the fourteen client components. Every
// geometry and label below is derived from the SEALED operand only (never the DOM, never a caller
// range, never a query of the board or manifest). Colours are never chosen here: components map
// these roles onto theme tokens (§7), and no row is ever coloured by move quality (law 8).

import {
  DENOMINATOR_MEANINGS,
  MAGNITUDE_SCALE_POLICIES,
  RELATION_PHRASES,
  assertPresentedEvidenceItem,
  conventionAttribution,
  formatShare,
  presentedSentence,
  type ComponentValue,
  type ConventionReceipt,
  type PresentedEvidenceItem,
} from "@chess-tabiya/runtime";

export interface PresentedView {
  readonly id: ComponentValue["id"];
  readonly digest: string;
  /** The component's equivalent sentence — screen readers and provider-off deployments get these bytes. */
  readonly sentence: string;
  readonly component: ComponentValue;
}

export function presentedViews(items: readonly PresentedEvidenceItem[]): readonly PresentedView[] {
  return Object.freeze(items.map((item) => {
    assertPresentedEvidenceItem(item);
    return Object.freeze({ id: item.component.id, digest: item.componentDigest, sentence: presentedSentence(item), component: item.component });
  }));
}

/** §5c: the convention line rendered INSIDE the component root; never a sibling element. */
export function attribution(convention: ConventionReceipt | undefined): string | undefined {
  return convention === undefined ? undefined : conventionAttribution(convention);
}

export interface BarRow { readonly label: string; readonly share: string; readonly width: number; readonly withheld: boolean; readonly highlighted: boolean }

/** §3.1: proportional rows plus the explicit residual, so the bars sum to the whole. */
export function distributionRows(component: Extract<ComponentValue, { id: "distribution" }>): readonly BarRow[] {
  const operand = component.operand;
  const rows = operand.rows.map((row) => Object.freeze({
    label: row.move.san,
    share: row.withheld === undefined ? formatShare(row.share) : "below floor",
    width: row.withheld === undefined ? Math.round(row.share * 1000) / 10 : 0,
    withheld: row.withheld !== undefined,
    highlighted: operand.highlight?.uci === row.move.uci,
  }));
  const residual = operand.residual === null ? [] : [Object.freeze({ label: operand.residual.label === "other_moves" ? "other moves" : "unlisted", share: formatShare(operand.residual.share), width: Math.round(operand.residual.share * 1000) / 10, withheld: false, highlighted: false })];
  return Object.freeze([...rows, ...residual]);
}

export interface SplitSegment { readonly side: "white" | "draws" | "black"; readonly label: string; readonly share: string; readonly width: number }

/** §3.2: three segments from the one total; a withheld or empty split draws no bar at all. */
export function outcomeSegments(component: Extract<ComponentValue, { id: "outcome_split" }>): readonly SplitSegment[] {
  const operand = component.operand;
  if (operand.total === 0 || !operand.floor.met) return Object.freeze([]);
  const segment = (side: SplitSegment["side"], label: string, count: number): SplitSegment => Object.freeze({ side, label, share: formatShare(count / operand.total), width: Math.round((count / operand.total) * 1000) / 10 });
  return Object.freeze([segment("white", "White", operand.white), segment("draws", "Draw", operand.draws), segment("black", "Black", operand.black)]);
}

export interface TrailGeometry {
  readonly width: number;
  readonly height: number;
  readonly zeroY: number;
  readonly path: string;
  readonly points: readonly { readonly x: number; readonly y: number; readonly label: string }[];
  readonly extentLabel: string;
}

/**
 * §3.4: pixels derived from the REGISTERED scale policy only (fixed extent, centred zero, clamped
 * saturation) — identical evidence always yields byte-identical geometry, whatever a caller wants.
 */
export function trailGeometry(component: Extract<ComponentValue, { id: "magnitude_trail" }>): TrailGeometry {
  const operand = component.operand;
  const policy = MAGNITUDE_SCALE_POLICIES[operand.scalePolicy];
  const width = 240, height = 80, pad = 6;
  const plies = operand.points.map((point) => point.plyOffset);
  const first = Math.min(...plies), last = Math.max(...plies);
  const x = (ply: number): number => pad + (last === first ? 0 : ((ply - first) / (last - first)) * (width - 2 * pad));
  const y = (value: number): number => {
    const clamped = Math.max(-policy.extent, Math.min(policy.extent, value));
    return Math.round((height / 2 - (clamped / policy.extent) * (height / 2 - pad)) * 100) / 100;
  };
  const points = operand.points.map((point) => Object.freeze({
    x: Math.round(x(point.plyOffset) * 100) / 100,
    y: y(point.magnitude.value),
    label: `After ply ${point.plyOffset}: ${point.magnitude.unit.kind === "mate_in" ? `mate in ${Math.abs(point.magnitude.value)} for ${point.magnitude.value > 0 ? "White" : "Black"}` : `${point.magnitude.value >= 0 ? "+" : "−"}${(Math.abs(point.magnitude.value) / 100).toFixed(2)}`}`,
  }));
  return Object.freeze({ width, height, zeroY: height / 2, path: points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" "), points: Object.freeze(points), extentLabel: policy.label });
}

export interface RelationChip { readonly from: string; readonly to: string; readonly phrase: string; readonly sign: "state" | "gained" | "lost" }

/** §3.6a: one chip per retained edge; the renderer names only retained endpoints. */
export function relationChips(component: Extract<ComponentValue, { id: "relation_overlay" }>): readonly RelationChip[] {
  return Object.freeze(component.operand.edges.map((edge) => Object.freeze({ from: edge.from, to: edge.to, phrase: RELATION_PHRASES[edge.relation][edge.sign], sign: edge.sign })));
}

/** §3.7: the count, its denominator meaning and the component-computed proportion. */
export function countView(component: Extract<ComponentValue, { id: "count_with_denominator" }>): { readonly text: string; readonly width: number | null } {
  const operand = component.operand;
  const meaning = DENOMINATOR_MEANINGS[operand.denominatorMeaning].label;
  const drawn = operand.denominator > 0 && (operand.floor === undefined || operand.floor.met);
  return { text: `${operand.numerator} of ${operand.denominator} ${meaning}`, width: drawn ? Math.round((operand.numerator / operand.denominator) * 1000) / 10 : null };
}

/** Board paint for one presented bundle: square marks and ordered relation arrows (§4.5). */
export interface BoardPaint { readonly squares: readonly string[]; readonly arrows: readonly { readonly orig: string; readonly dest: string }[] }

export function boardPaint(items: readonly PresentedEvidenceItem[]): BoardPaint {
  const squares = new Set<string>();
  const arrows = new Map<string, { readonly orig: string; readonly dest: string }>();
  for (const item of items) {
    assertPresentedEvidenceItem(item);
    const component = item.component;
    if (component.id === "square_set") for (const square of component.operand.squares) squares.add(square);
    if (component.id === "relation_overlay") {
      for (const node of component.operand.nodes) squares.add(node.square);
      for (const edge of component.operand.edges) arrows.set(`${edge.from}${edge.to}`, { orig: edge.from, dest: edge.to });
    }
  }
  return Object.freeze({ squares: Object.freeze([...squares]), arrows: Object.freeze([...arrows.values()]) });
}
