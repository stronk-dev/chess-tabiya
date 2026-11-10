// subject-safe §6.2: a finite stable permutation, not subsumption, new evidence or source risk.
// The caller authenticates the captured original ModuleFacts/current declarations first.
import type { ModuleFact } from "../module-reducers.js";
import type { FoundationEdge } from "../foundation-position-sources.js";
import type { FileAccessRevealed, FileStateChange, PawnFileGroupChange, PawnIslandTopologyChange } from "../foundation-pawn-sources.js";
import { readFoundationEventInvocation } from "./evidence-value-routes.js";

type Kind = "access" | "islands" | "state" | "group";
type Color = "white" | "black";
interface Entry<T> { readonly index: number; readonly kind: Kind; readonly fact: ModuleFact<T>; readonly edge: FoundationEdge }
function kind(fact: ModuleFact): Kind | undefined {
  const ref = `${fact.evidence.projection.id}@${fact.evidence.projection.version}`;
  switch (ref) {
    case "derived.activity.event.file_access_revealed@1": return "access";
    case "rules.structural.event.pawn_islands@2": return "islands";
    case "derived.activity.event.file_state@1": return "state";
    case "derived.structural.event.pawn_file_group@1": return "group";
    default: return undefined;
  }
}
function members(values: readonly string[]): readonly string[] {
  if (new Set(values).size !== values.length) throw new TypeError("MODULE_SUMMARY_DUPLICATE_MEMBER");
  return [...values].sort(); // Original front-to-rear / connectivity arrays remain untouched.
}
function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  const a = members(left), b = members(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
const sameEdge = (left: FoundationEdge, right: FoundationEdge): boolean => left.beforeFen === right.beforeFen
  && left.moveUci === right.moveUci && left.afterFen === right.afterFen;
function statePawns(state: FileStateChange, color: Color, side: "before" | "after"): readonly string[] {
  return color === "white" ? state[side].whitePawns : state[side].blackPawns;
}
function groupMatches<T>(entry: Entry<T>, edge: FoundationEdge, color: Color, file: string,
  before: readonly string[], after: readonly string[]): boolean {
  if (entry.kind !== "group" || !sameEdge(entry.edge, edge)) return false;
  const group = entry.fact.evidence.payload as PawnFileGroupChange;
  return group.subject.color === color && group.subject.file === file
    && sameMembers(group.before?.pawns ?? [], before) && sameMembers(group.after?.pawns ?? [], after);
}

/** Pure ordering over the caller's authenticated, once-captured list; no acquisition or mint. */
export function permutePostcommitSummaryFacts<T>(ordered: readonly ModuleFact<T>[]): readonly ModuleFact<T>[] {
  const entries: Entry<T>[] = ordered.flatMap((fact, index) => {
    const type = kind(fact);
    return type === undefined ? [] : [{ index, kind: type, fact, edge: readFoundationEventInvocation(fact.evidence).edge }];
  });
  const parent = ordered.map((_, index) => index);
  const root = (index: number): number => {
    while (parent[index] !== index) { parent[index] = parent[parent[index]!]!; index = parent[index]!; }
    return index;
  };
  const eligible: number[] = [];
  for (const summary of entries) {
    if (summary.kind !== "access" && summary.kind !== "islands") continue;
    const required: number[] = [];
    let complete = true;
    if (summary.kind === "access") {
      const access = summary.fact.evidence.payload as FileAccessRevealed;
      const invocation = readFoundationEventInvocation(summary.fact.evidence);
      const states = entries.filter(entry => entry.kind === "state" && sameEdge(entry.edge, summary.edge)
        && entry.fact.evidence === invocation.inputs[0] && entry.fact.evidence.payload === access.fileChange
        && (entry.fact.evidence.payload as FileStateChange).file === access.file);
      if (states.length === 0) continue;
      for (const entry of states) {
        const state = entry.fact.evidence.payload as FileStateChange;
        required.push(entry.index);
        let changes = 0;
        for (const color of ["white", "black"] as const) {
          const before = statePawns(state, color, "before"), after = statePawns(state, color, "after");
          if (sameMembers(before, after)) continue;
          changes++;
          const groups = entries.filter(group => groupMatches(group, summary.edge, color, state.file, before, after));
          if (groups.length === 0) complete = false;
          required.push(...groups.map(group => group.index));
        }
        if (changes === 0) complete = false;
      }
    } else {
      const islands = summary.fact.evidence.payload as PawnIslandTopologyChange;
      const beforeFiles = members(islands.before.flatMap(partition => partition.files));
      const afterFiles = members(islands.after.flatMap(partition => partition.files));
      members(islands.before.flatMap(partition => partition.pawns));
      members(islands.after.flatMap(partition => partition.pawns));
      const files = [...beforeFiles.filter(file => !afterFiles.includes(file)), ...afterFiles.filter(file => !beforeFiles.includes(file))];
      if (files.length === 0) continue;
      for (const file of files) {
        const before = islands.before.flatMap(partition => partition.pawns.filter(square => square[0] === file));
        const after = islands.after.flatMap(partition => partition.pawns.filter(square => square[0] === file));
        const states = entries.filter(entry => {
          if (entry.kind !== "state" || !sameEdge(entry.edge, summary.edge)) return false;
          const state = entry.fact.evidence.payload as FileStateChange;
          return state.file === file && sameMembers(statePawns(state, islands.color, "before"), before)
            && sameMembers(statePawns(state, islands.color, "after"), after);
        });
        const groups = entries.filter(entry => groupMatches(entry, summary.edge, islands.color, file, before, after));
        if (states.length === 0 || groups.length === 0) complete = false;
        required.push(...states.map(entry => entry.index), ...groups.map(entry => entry.index));
      }
    }
    // No partial graph is published: a missing sibling leaves this summary outside every link.
    if (!complete) continue;
    eligible.push(summary.index);
    for (const index of required) parent[root(index)] = root(summary.index);
  }
  const roots = new Set(eligible.map(root)), components = new Map<number, Entry<T>[]>();
  for (const entry of entries) {
    const id = root(entry.index);
    if (!roots.has(id)) continue;
    const component = components.get(id) ?? [];
    component.push(entry); components.set(id, component);
  }
  const rank: Readonly<Record<Kind, number>> = { access: 0, islands: 1, state: 2, group: 3 };
  const result = [...ordered];
  for (const component of components.values()) {
    const slots = component.map(entry => entry.index); // Already in the original total order.
    const summariesFirst = [...component].sort((a, b) => rank[a.kind] - rank[b.kind] || a.index - b.index);
    slots.forEach((slot, index) => { result[slot] = summariesFirst[index]!.fact; });
  }
  return Object.freeze(result);
}
