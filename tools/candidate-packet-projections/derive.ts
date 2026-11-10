// Governance derivation for rfc/shared-candidate-evidence-packet.md §5.3 / criterion 9.
// Not production code: tools/generate-candidate-packet-projections.mjs bundles this module to emit
// and check packages/runtime/src/candidate-population-projections.generated.ts, and the runtime
// contract test imports it to prove the checked-in bytes are the derivation's output.
import {
  BREADTH_EVENT_PROJECTION_IDS,
  CASTLING_EVENT_PROJECTION_IDS,
  DERIVED_TACTIC_EVENT_PROJECTION_IDS,
  PRIMARY_EVIDENCE_MANIFEST,
  SEMANTIC_WAVE_EVENT_PROJECTION_IDS,
  STRUCTURAL_EVENT_PROJECTION_IDS,
  TACTICAL_EVENT_PROJECTION_IDS,
  TRANSITION_EVENT_PROJECTION_IDS,
} from "../../packages/runtime/src/evidence-catalog.ts";
import type { CompiledEvidenceManifest } from "../../packages/runtime/src/evidence-contract.ts";
import { CANDIDATE_CHILD_READING_ROUTES, CANDIDATE_CURRENT_SOURCE_ROUTES } from "../../packages/runtime/src/internal/candidate-child-reading-routes.ts";

export type ProjectionGroups = Readonly<Record<string, readonly string[]>>;

/** Multi-move sequence projections are not outputs of a one-edge collector. */
const isSequenceProjection = (id: string): boolean => id.includes(".sequence.") || id.endsWith("_observed");
/**
 * The one-edge collector composition, in `localSemanticEventClosure` order, plus the reading
 * collectors of the moved `candidateChildReadings` authority. Every id is resolved through the
 * compiled manifest to its literal `id@version` key.
 */
export function deriveCandidatePacketProjectionGroups(manifest: CompiledEvidenceManifest = PRIMARY_EVIDENCE_MANIFEST): { readonly groups: ProjectionGroups; readonly abstentions: ProjectionGroups } {
  // `@2` multi-edge successors read the exact recorded edge (`run.record.edge`), which exists only on
  // a recorded path (rfc/recorded-semantic-path.md); a candidate child is never a recorded edge.
  const resolve = (id: string, event = false): string => {
    // Exact current replacement slots are executed by the same collector. Registration alone
    // never chooses a successor; unrelated @2/@3 recorded-path sources remain excluded.
    const route = [CANDIDATE_CURRENT_SOURCE_ROUTES.materialEvent, CANDIDATE_CURRENT_SOURCE_ROUTES.defenderExposure]
      .find(value => value.startsWith(`${id}@`)) ?? `${id}@1`;
    const matches = manifest.projections.filter((candidate) => `${candidate.id}@${candidate.version}` === route
      && !candidate.dependsOn.some((dependency) => dependency.id === "run.record.edge")
      // An internal successor is not a collector output until its exact semantic-event
      // declaration lands with the actual collector cutover. Never guess from a base id.
      && (!event || manifest.semanticEvents.filter(value => value.projection.id === candidate.id && value.projection.version === candidate.version).length === 1));
    if (matches.length !== 1) throw new TypeError(`candidate projection ${id} does not resolve to exactly one compiled manifest projection`);
    return `${matches[0]!.id}@${matches[0]!.version}`;
  };
  const events = (ids: readonly string[]) => ids.filter((id) => !isSequenceProjection(id)).map(id => resolve(id, true));
  const exactLocalReading = (key: string): string => {
    const matches = manifest.projections.filter(candidate => `${candidate.id}@${candidate.version}` === key);
    if (matches.length !== 1 || matches[0]!.role !== "reading" || !matches[0]!.producer.id.startsWith("rules.") && !matches[0]!.producer.id.startsWith("derived.")) {
      throw new TypeError(`candidate reading ${key} does not resolve to exactly one compiled local reading`);
    }
    return key;
  };
  const childReadings = CANDIDATE_CHILD_READING_ROUTES.map(exactLocalReading).sort();
  const groups: ProjectionGroups = {
    "event.structural": events(STRUCTURAL_EVENT_PROJECTION_IDS.filter(id => ["king_zone", "passed_pawn", "piece_count", "direct_attack_count"].some(family => id === `rules.structural.event.${family}`))),
    "event.foundation": [
      "rules.structural.event.king_opposition@2", "rules.structural.event.backward_pawn@2",
      "derived.structural.event.pawn_file_group@1", "rules.transition.event.slider_ray@2",
      "derived.activity.event.file_state@1", "derived.activity.event.file_access_revealed@1",
      "rules.structural.event.pawn_islands@2",
    ].map(route => {
      const projection = manifest.projections.filter(value => `${value.id}@${value.version}` === route);
      const declarations = manifest.semanticEvents.filter(value => `${value.projection.id}@${value.projection.version}` === route);
      if (projection.length !== 1 || declarations.length !== 1) throw new TypeError(`candidate foundation ${route} lacks its exact compiled event declaration`);
      return route;
    }),
    "event.transition": events(TRANSITION_EVENT_PROJECTION_IDS.filter(id => id !== "rules.transition.event.slider_ray")),
    "event.tactical": events(TACTICAL_EVENT_PROJECTION_IDS.filter((id) => id !== "rules.tactic.event.loose_piece")),
    "event.loose_piece": events(["rules.tactic.event.loose_piece"]),
    "event.castling": events(CASTLING_EVENT_PROJECTION_IDS),
    // Actual one-edge composition; trade_completed requires two recorded capture anchors.
    "event.exchange": events(["derived.exchange.capture_class"]),
    "event.discovered": events(DERIVED_TACTIC_EVENT_PROJECTION_IDS),
    "event.breadth": events(BREADTH_EVENT_PROJECTION_IDS),
    "event.duty": events(SEMANTIC_WAVE_EVENT_PROJECTION_IDS),
    "reading.child": childReadings,
    "reading.candidate_role": [exactLocalReading(CANDIDATE_CURRENT_SOURCE_ROUTES.candidateRole)],
    "reading.pawn_extended_center": [exactLocalReading(CANDIDATE_CURRENT_SOURCE_ROUTES.extendedCenterDestination)],
    "reading.legal_exchange": [resolve("rules.exchange.predicate.legal_exchange")],
    "reading.fork_survival": [(() => {
      const route = CANDIDATE_CURRENT_SOURCE_ROUTES.forkSurvival;
      if (manifest.projections.filter(value => `${value.id}@${value.version}` === route).length !== 1) throw new TypeError(`candidate reading ${route} does not resolve to exactly one compiled manifest projection`);
      return route;
    })()],
  };
  // Both actual unavailable outcomes are independently retained by the current collector.
  const abstentions: Record<string, readonly string[]> = {};
  for (const id of ["rules.tactic.event.loose_piece", "derived.tactic.defender_exposure"]) {
    const route = resolve(id, true), declaration = manifest.projections.find(candidate => `${candidate.id}@${candidate.version}` === route)!;
    if (!declaration.abstention.reasons.includes("invalid_turn_clone")) throw new TypeError(`${route} no longer declares invalid_turn_clone`);
    abstentions[route] = ["invalid_turn_clone"];
  }
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
