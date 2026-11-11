// Accepted module-registration §4.11a/D3836: exact dependency paths on one granted recorded edge.
// This operation uses existing factories; it neither mints evidence nor selects/ranks their output.
import { assertDeclaredEvidence, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute, type EvidenceValueRouteResults } from "./internal/evidence-value-routes.js";
import { assertRecordedEdgeEvidence, type RecordedEdge } from "./recorded-edge.js";
import type { DrillRun, Node } from "./types.js";

export const INSPECTOR_DEPENDENT_PROJECTIONS = Object.freeze([
  "derived.tactic.discovered_executed@1", "derived.tactic.nonterminal_fork_survival@1",
  "rules.tactic.predicate.overload_conflict@1", "rules.tactic.consequence.forced_mate_after_move@1",
  "rules.tactic.consequence.forced_mate_after_move@2",
  "derived.material.event.role_asymmetry@2",
  "derived.tactic.defender_exposure@2",
] as const);
export type InspectorDependentProjection = typeof INSPECTOR_DEPENDENT_PROJECTIONS[number];
type MateProjection = Extract<InspectorDependentProjection, `rules.tactic.consequence.forced_mate_after_move@${number}`>;
export type InspectorDependentRequest =
  | Readonly<{ projection: Exclude<InspectorDependentProjection, MateProjection> }>
  | Readonly<{ projection: MateProjection; parameters: Readonly<{ kind: "forced_mate"; maxAttackerMoves: 1 | 2 | 3 | 4 }> }>;

function exact(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype
    && Reflect.ownKeys(value).length === keys.length && keys.every(key => {
      const field = Object.getOwnPropertyDescriptor(value, key);
      return field !== undefined && field.enumerable && "value" in field;
    });
}
export function parseInspectorDependentRequest(value: unknown): InspectorDependentRequest {
  if (value === null || typeof value !== "object") throw new TypeError("Invalid Inspector dependency request");
  const field = Object.getOwnPropertyDescriptor(value, "projection");
  const projection: unknown = field !== undefined && "value" in field ? field.value : undefined;
  if (typeof projection !== "string" || !INSPECTOR_DEPENDENT_PROJECTIONS.some(ref => ref === projection)) throw new TypeError("Unknown exact Inspector dependency projection");
  if (projection === "rules.tactic.consequence.forced_mate_after_move@1" || projection === "rules.tactic.consequence.forced_mate_after_move@2") {
    if (!exact(value, ["projection", "parameters"]) || !exact(value.parameters, ["kind", "maxAttackerMoves"])
      || value.parameters.kind !== "forced_mate" || ![1, 2, 3, 4].includes(value.parameters.maxAttackerMoves as number)) throw new TypeError("Inspector mate source requires its explicit attacker-move horizon");
    return Object.freeze({ projection, parameters: Object.freeze({ kind: "forced_mate", maxAttackerMoves: value.parameters.maxAttackerMoves as 1 | 2 | 3 | 4 }) });
  }
  if (!exact(value, ["projection"])) throw new TypeError("Inspector dependency source forbids parameters/extra fields");
  return Object.freeze({ projection: projection as Exclude<InspectorDependentProjection, MateProjection> });
}

type Values = readonly DeclaredEvidence<unknown>[];
export interface InspectorDependentCollection {
  readonly edge: DeclaredEvidence<RecordedEdge>;
  readonly dependencies: Values;
  readonly values: Values;
  /** Original target-factory object, including availability/derived-input wrappers; null iff skipped. */
  readonly result: EvidenceValueRouteResults[InspectorDependentProjection] | null;
  readonly outcome: Readonly<{ kind: "available"; collected: number }> | Readonly<{ kind: "no_witness" }>
    | Readonly<{ kind: "unavailable"; reason: string }>;
}

/** Full current-run validation/permission belongs to the server's existing recorded-context grant. */
export function collectInspectorDependentEdge(run: DrillRun, parent: Node, child: Node, input: InspectorDependentRequest): InspectorDependentCollection {
  const request = parseInspectorDependentRequest(input); // malformed input performs no factory work
  const edge = invokeEvidenceValueRoute("run.record.edge@1", { run, parent, child });
  assertRecordedEdgeEvidence(edge);
  const { beforeFen, moveUci, afterFen } = edge.payload;
  const anchor = { beforeFen, moveUci, afterFen };
  let dependencies: Values = [], values: Values = [], unavailable: string | undefined;
  let result: InspectorDependentCollection["result"] = null;
  switch (request.projection) {
    case "derived.tactic.defender_exposure@2": {
      const computed = invokeEvidenceValueRoute(request.projection, anchor);
      result = computed;
      if (computed.kind === "unavailable") {
        if (computed.reason !== "invalid_turn_clone") throw new TypeError("Inspector defender exposure returned an undeclared reason");
        unavailable = computed.reason;
      } else {
        values = computed.value.map(item => item.evidence);
        dependencies = computed.value.flatMap(item => item.inputs);
      }
      break;
    }
    case "derived.material.event.role_asymmetry@2": {
      const computed = invokeEvidenceValueRoute(request.projection, anchor);
      result = computed; values = computed.map(item => item.evidence);
      break;
    }
    case "derived.tactic.discovered_executed@1": {
      const latency = invokeEvidenceValueRoute("rules.tactic.reading.discovered_latency@1", { fen: beforeFen });
      const rays = invokeEvidenceValueRoute("rules.transition.event.slider_ray@1", anchor);
      dependencies = [latency, ...rays];
      const computed = invokeEvidenceValueRoute(request.projection, { latency, rays });
      result = computed; values = computed.map(item => item.evidence);
      break;
    }
    case "derived.tactic.nonterminal_fork_survival@1": {
      const attacks = invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", anchor);
      dependencies = attacks;
      if (attacks.length === 0) break;
      if (attacks.length !== 1) throw new TypeError("Inspector fork source requires its sole complete double-attack event");
      const breadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", anchor);
      dependencies = [...attacks, breadth];
      result = invokeEvidenceValueRoute(request.projection, { doubleAttack: attacks[0]!, breadth });
      values = [result];
      break;
    }
    case "rules.tactic.predicate.overload_conflict@1": {
      const computed = invokeEvidenceValueRoute(request.projection, anchor);
      result = computed;
      if (computed.kind === "unavailable") unavailable = computed.reason;
      else values = computed.value;
      break;
    }
    case "rules.tactic.consequence.forced_mate_after_move@1":
    case "rules.tactic.consequence.forced_mate_after_move@2": {
      const breadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", anchor);
      dependencies = [breadth];
      const computed = invokeEvidenceValueRoute(request.projection, { beforeFen, breadth, maxAttackerMoves: request.parameters.maxAttackerMoves });
      result = computed;
      if (computed.kind === "unavailable") unavailable = computed.reason;
      else values = [computed.value];
      break;
    }
  }
  for (const value of [...dependencies, ...values]) assertDeclaredEvidence(value);
  for (const value of values) if (`${value.projection.id}@${value.projection.version}` !== request.projection) throw new TypeError("Inspector dependency source emitted a foreign projection");
  const outcome = unavailable !== undefined ? Object.freeze({ kind: "unavailable" as const, reason: unavailable })
    : values.length === 0 ? Object.freeze({ kind: "no_witness" as const }) : Object.freeze({ kind: "available" as const, collected: values.length });
  return Object.freeze({ edge, dependencies: Object.freeze([...dependencies]), values: Object.freeze([...values]), result, outcome });
}
