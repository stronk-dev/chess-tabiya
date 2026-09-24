// Governance derivation for rfc/shared-candidate-evidence-packet.md §5.3 / criterion 9.
// Not production code: tools/generate-candidate-packet-projections.mjs bundles this module to emit
// and check packages/runtime/src/candidate-population-projections.generated.ts, and the runtime
// contract test imports it to prove the checked-in bytes are the derivation's output.
import {
  BREADTH_COLLECTOR_PROJECTION_IDS,
  BREADTH_EVENT_PROJECTION_IDS,
  CASTLING_EVENT_PROJECTION_IDS,
  DERIVED_EXCHANGE_EVENT_PROJECTION_IDS,
  DERIVED_TACTIC_EVENT_PROJECTION_IDS,
  PRIMARY_EVIDENCE_MANIFEST,
  SEMANTIC_WAVE_EVENT_PROJECTION_IDS,
  STRUCTURAL_EVENT_PROJECTION_IDS,
  TACTICAL_COLLECTOR_PROJECTION_IDS,
  TACTICAL_EVENT_PROJECTION_IDS,
  TACTICAL_STRUCTURAL_EVENT_PROJECTION_IDS,
  TRANSITION_EVENT_PROJECTION_IDS,
} from "../../packages/runtime/src/evidence-catalog.ts";
import type { CompiledEvidenceManifest } from "../../packages/runtime/src/evidence-contract.ts";

export type ProjectionGroups = Readonly<Record<string, readonly string[]>>;

/** Multi-move sequence projections are not outputs of a one-edge collector. */
const isSequenceProjection = (id: string): boolean => id.includes(".sequence.") || id.endsWith("_observed");
/** Provider projections (Maia, live engines) are joins, never local collector results (§8.2). */
const isProviderProjection = (manifest: CompiledEvidenceManifest, id: string): boolean => {
  const projection = manifest.projections.find((candidate) => candidate.id === id);
  return projection === undefined || projection.producer.id.startsWith("human.") || projection.producer.id.startsWith("live.");
};

/**
 * The one-edge collector composition, in `localSemanticEventClosure` order, plus the reading
 * collectors of the moved `candidateChildReadings` authority. Every id is resolved through the
 * compiled manifest to its literal `id@version` key.
 */
export function deriveCandidatePacketProjectionGroups(manifest: CompiledEvidenceManifest = PRIMARY_EVIDENCE_MANIFEST): { readonly groups: ProjectionGroups; readonly abstentions: ProjectionGroups } {
  const resolve = (id: string): string => {
    const matches = manifest.projections.filter((candidate) => candidate.id === id);
    if (matches.length !== 1) throw new TypeError(`candidate projection ${id} does not resolve to exactly one compiled manifest projection`);
    return `${matches[0]!.id}@${matches[0]!.version}`;
  };
  const events = (ids: readonly string[]) => ids.filter((id) => !isSequenceProjection(id)).map(resolve);
  const childReadingExclusions = new Set(["rules.exchange.predicate.legal_exchange", "derived.tactic.fork_survives_reply"]);
  const childReadings = [...new Set([...TACTICAL_COLLECTOR_PROJECTION_IDS, ...BREADTH_COLLECTOR_PROJECTION_IDS])]
    .filter((id) => !childReadingExclusions.has(id) && !isProviderProjection(manifest, id))
    .filter((id) => manifest.projections.find((candidate) => candidate.id === id)?.role === "reading")
    .map(resolve)
    .sort();
  const groups: ProjectionGroups = {
    "event.structural": events(STRUCTURAL_EVENT_PROJECTION_IDS),
    "event.pawn_island": events(TACTICAL_STRUCTURAL_EVENT_PROJECTION_IDS),
    "event.transition": events(TRANSITION_EVENT_PROJECTION_IDS),
    "event.tactical": events(TACTICAL_EVENT_PROJECTION_IDS.filter((id) => id !== "rules.tactic.event.loose_piece")),
    "event.loose_piece": events(["rules.tactic.event.loose_piece"]),
    "event.castling": events(CASTLING_EVENT_PROJECTION_IDS),
    "event.exchange": events(DERIVED_EXCHANGE_EVENT_PROJECTION_IDS),
    "event.discovered": events(DERIVED_TACTIC_EVENT_PROJECTION_IDS),
    "event.breadth": events(BREADTH_EVENT_PROJECTION_IDS),
    "event.duty": events(SEMANTIC_WAVE_EVENT_PROJECTION_IDS),
    "reading.child": childReadings,
    "reading.legal_exchange": [resolve("rules.exchange.predicate.legal_exchange")],
    "reading.fork_survival": [resolve("derived.tactic.fork_survives_reply")],
  };
  // The only abstention the packet compiler publishes in this landing: the loose-piece collector's
  // declared `invalid_turn_clone`. The reason must be one the manifest declares for that projection.
  const loose = manifest.projections.find((candidate) => candidate.id === "rules.tactic.event.loose_piece")!;
  if (!loose.abstention.reasons.includes("invalid_turn_clone")) throw new TypeError("rules.tactic.event.loose_piece no longer declares invalid_turn_clone");
  const abstentions: ProjectionGroups = { [resolve("rules.tactic.event.loose_piece")]: ["invalid_turn_clone"] };
  return { groups, abstentions };
}

const LITERAL_KEY = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+@[1-9][0-9]*$/u;

/** Check mode: every refusal the generator owes (missing, extra, duplicate, stale version, non-literal). */
export function checkCandidatePacketProjectionGroups(expected: ProjectionGroups, actual: Readonly<Record<string, readonly unknown[]>>): readonly string[] {
  const problems: string[] = [];
  const seen = new Map<string, string>();
  for (const group of Object.keys(actual)) if (!(group in expected)) problems.push(`extra group ${group}`);
  for (const [group, keys] of Object.entries(expected)) {
    const values = actual[group];
    if (values === undefined) { problems.push(`missing group ${group}`); continue; }
    for (const value of values) {
      if (typeof value !== "string" || !LITERAL_KEY.test(value)) { problems.push(`non-literal key ${String(value)} in ${group}`); continue; }
      const owner = seen.get(value);
      if (owner !== undefined) problems.push(`duplicate key ${value} in ${owner} and ${group}`);
      seen.set(value, group);
      if (!keys.includes(value)) {
        const id = value.slice(0, value.lastIndexOf("@"));
        problems.push(keys.some((key) => key.startsWith(`${id}@`)) ? `stale version ${value} in ${group}` : `extra key ${value} in ${group}`);
      }
    }
    for (const key of keys) if (!values.includes(key)) problems.push(`missing key ${key} in ${group}`);
  }
  return problems;
}

function renderGroups(name: string, groups: ProjectionGroups): string {
  const rows = Object.entries(groups).map(([group, keys]) => `  ${JSON.stringify(group)}: Object.freeze([\n${keys.map((key) => `    ${JSON.stringify(key)},`).join("\n")}\n  ] as const),`);
  return `export const ${name} = Object.freeze({\n${rows.join("\n")}\n} as const);\n`;
}

export function renderCandidatePacketProjections(manifest: CompiledEvidenceManifest = PRIMARY_EVIDENCE_MANIFEST): string {
  const { groups, abstentions } = deriveCandidatePacketProjectionGroups(manifest);
  return [
    "// GENERATED by tools/generate-candidate-packet-projections.mjs from PRIMARY_EVIDENCE_MANIFEST.",
    "// Do not edit by hand: `node tools/generate-candidate-packet-projections.mjs --check` fails on drift.",
    "// rfc/shared-candidate-evidence-packet.md §3.1/§5.3: the literal collector-output vocabulary and",
    "// the abstention reasons the packet row may carry. A closure, not a claim that all members fire.",
    "",
    renderGroups("CANDIDATE_COLLECTOR_PROJECTION_KEYS", groups),
    renderGroups("CANDIDATE_PACKET_ABSTENTION_REASONS", abstentions),
  ].join("\n");
}
