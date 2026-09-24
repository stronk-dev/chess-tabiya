// rfc/module-registration.md §2 steps 3–4 — the one shared module operation. Every `module.*`
// consumer in the evidence manifest names `compileModulePacket`: sealed evidence enters through
// `evidenceForConsumer` with the module's exact consumer id, is admitted against the compiled
// declaration (timing, per-entry restriction, capability union, denominator) and reduced by the
// module-reducers pipeline. It selects nothing by itself and renders nothing.

import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer, type CompiledEvidenceManifest, type DeclaredEvidence, type EvidenceRole } from "./evidence-contract.js";
import type { ModuleDeclaration, ModuleEmptyBehavior, ModuleId, ModuleTiming } from "./module-contract.js";
import { MODULE_REGISTRY } from "./module-registry.js";
import {
  NULL_REDUCTION_QUALITY_RECORDER,
  admitModuleFacts,
  orderAdmittedFacts,
  reduceModulePacket,
  type ModuleFact,
  type ReductionQualityRecorder,
} from "./module-reducers.js";

export type ModulePacketRefusal =
  | "module_has_no_evidence"
  | "module_blocked"
  | "timing_outside_module"
  | "role_outside_ceiling"
  | "session_outside_ceiling";

export interface ModulePacketRequest<T = unknown> {
  readonly module: ModuleId;
  readonly timing: ModuleTiming;
  /** The viewer's evidence role, already projected through `moduleEvidenceRole`. */
  readonly role: EvidenceRole;
  /** The run's workflow context; checked against the module's derived session ceiling. */
  readonly session: string;
  readonly evidence: readonly DeclaredEvidence<T>[];
  /**
   * `reduce` runs the whole reducer pipeline and the fact backstop. `admit` stops after exact
   * admission and ordering: it is for a surface whose budgeted unit is not this packet (the Review
   * Map's move-list rows; its moments are budgeted by `selectReviewMoments`).
   */
  readonly mode?: "reduce" | "admit";
  /** Nearest ancestor first; the admitted facts of earlier packets of the same module. */
  readonly ancestorFacts?: readonly (readonly ModuleFact<T>[])[];
  readonly recorder?: ReductionQualityRecorder;
}

export type ModulePacket<T = unknown> =
  | { readonly kind: "refused"; readonly module: ModuleId; readonly reason: ModulePacketRefusal }
  | {
      readonly kind: "packet";
      readonly module: ModuleId;
      readonly timing: ModuleTiming;
      readonly facts: readonly ModuleFact<T>[];
      /** Items the exact module consumer admitted before module-level admission. */
      readonly offered: number;
      /** Facts the module admitted (timing, per-entry, capability, denominator). */
      readonly admitted: number;
      readonly afterReducers: number;
      readonly noveltyAbstained: boolean;
      /** The declared empty behaviour, present exactly when no fact survived. */
      readonly empty: ModuleEmptyBehavior | null;
    };

function refusal<T>(module: ModuleId, reason: ModulePacketRefusal): ModulePacket<T> {
  return Object.freeze({ kind: "refused" as const, module, reason });
}

/** The single production module operation (`module.*` consumers' declared implementation). */
export function compileModulePacket<T>(request: ModulePacketRequest<T>, manifest: CompiledEvidenceManifest = PRIMARY_EVIDENCE_MANIFEST): ModulePacket<T> {
  const module: ModuleDeclaration | undefined = MODULE_REGISTRY.byId.get(request.module);
  if (module === undefined) throw new TypeError(`Unknown learner module ${String(request.module)}`);
  if (module.accepts.kind === "none") return refusal(module.id, "module_has_no_evidence");
  if (module.accepts.kind === "blocked_dependencies") return refusal(module.id, "module_blocked");
  if (!module.timings.some((value) => value.timing === request.timing)) return refusal(module.id, "timing_outside_module");
  if (!module.ceilings.roles.includes(request.role)) return refusal(module.id, "role_outside_ceiling");
  if (!module.ceilings.sessions.includes(request.session)) return refusal(module.id, "session_outside_ceiling");
  const view = evidenceForConsumer(manifest, { id: `module.${module.id}`, version: 1 }, request.evidence);
  if ((request.mode ?? "reduce") === "admit") {
    const facts = orderAdmittedFacts(module, admitModuleFacts(module, manifest, view, request.timing));
    return Object.freeze({
      kind: "packet" as const, module: module.id, timing: request.timing, facts, offered: view.items.length,
      admitted: facts.length, afterReducers: facts.length, noveltyAbstained: false,
      empty: facts.length === 0 ? module.emptyBehavior : null,
    });
  }
  const reduced = reduceModulePacket(module, manifest, view, {
    timing: request.timing,
    ...(request.ancestorFacts === undefined ? {} : { ancestorFacts: request.ancestorFacts }),
    recorder: request.recorder ?? NULL_REDUCTION_QUALITY_RECORDER,
  });
  return Object.freeze({
    kind: "packet" as const, module: module.id, timing: request.timing, facts: reduced.facts, offered: view.items.length,
    admitted: reduced.admitted, afterReducers: reduced.afterReducers, noveltyAbstained: reduced.noveltyAbstained,
    empty: reduced.facts.length === 0 ? module.emptyBehavior : null,
  });
}
