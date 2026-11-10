// Accepted Full Inspector supplier primitives. These do not register a partial module consumer,
// mint evidence, or publish task ancestry; the complete demand operation owns eventual delivery.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { deriveMaiaNodeCandidateWdl, deriveMaiaNodeDistribution, maiaNodeInputsFromSubject,
  type MaiaNodeInputs, type DeclaredEvidence } from "@chess-tabiya/runtime";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { digestRunEventHead, resolveRunSubject } from "@chess-tabiya/runtime/run-subject";
import { positionFromFen } from "../../../packages/runtime/src/chess.js";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";
import type { OpponentSelector, SelectMoveRequest } from "./opponent-selector.js";
import { ServerError } from "./errors.js";

export type InspectorMaiaProjection = "derived.maia.node_distribution@1" | "derived.maia.node_candidate_wdl@1";
declare const maiaSourceBrand: unique symbol;
export interface InspectorMaiaSource { readonly [maiaSourceBrand]: true }
interface MaiaImage {
  readonly context: InspectorRecordedContext;
  readonly projection: InspectorMaiaProjection;
  readonly sourceKey: string | null;
  readonly request: SelectMoveRequest;
  readonly inputs: MaiaNodeInputs | null;
  readonly result: ReturnType<typeof deriveMaiaNodeDistribution> | ReturnType<typeof deriveMaiaNodeCandidateWdl> | null;
  readonly values: readonly DeclaredEvidence<unknown>[];
  readonly outcome: Readonly<{ kind: "available"; collected: number }>
    | Readonly<{ kind: "unavailable"; reason: "provider_unavailable" | "source_absent"; disclosure?: string }>;
}
interface OwnedSource {
  readonly image: MaiaImage;
  readonly signal: AbortSignal;
  readonly selector: OpponentSelector | undefined;
  readonly requestImage: string;
  readonly registryGeneration: string | null;
}

export class InspectorMaiaSourceOwner {
  readonly #sources = new WeakMap<object, OwnedSource>();
  constructor(readonly contexts: InspectorRecordedContextOwner, readonly selector: () => OpponentSelector | undefined,
    readonly request: (context: InspectorRecordedContext) => SelectMoveRequest) {}

  #requireGeneration(selector: OpponentSelector | undefined, task: MaiaNodeInputs["task"], registryGeneration: string | null): void {
    const current = selector?.maiaTaskGenerationState();
    if (current === undefined || current.registry !== registryGeneration
      || current.task !== task.payload.acquisition.generation && !(current.task === null && registryGeneration !== null)) throw new InspectorContextError("stale");
  }

  async acquire(context: InspectorRecordedContext, projection: InspectorMaiaProjection, signal: AbortSignal): Promise<InspectorMaiaSource> {
    if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector Maia source requires an AbortSignal");
    signal.throwIfAborted();
    if (projection !== "derived.maia.node_distribution@1" && projection !== "derived.maia.node_candidate_wdl@1") throw new InspectorContextError("source_contract_invalid");
    const current = this.contexts.read(context);
    if (current.selection.context.kind !== "position") throw new InspectorContextError("source_contract_invalid");
    const request = this.request(context), requestImage = canonicalizeJson(request), selector = this.selector();
    const recheck = (): void => {
      signal.throwIfAborted(); this.contexts.read(context);
      if (this.selector() !== selector || canonicalizeJson(this.request(context)) !== requestImage) throw new InspectorContextError("stale");
      signal.throwIfAborted();
    };
    let inputs: MaiaNodeInputs | null = null, result: MaiaImage["result"] = null;
    let registryGeneration: string | null = null;
    let values: readonly DeclaredEvidence<unknown>[] = Object.freeze([]), outcome: MaiaImage["outcome"];
    if (positionFromFen(current.selected.fen).isEnd()) {
      outcome = Object.freeze({ kind: "unavailable", reason: "source_absent", disclosure: "This position has ended; no next-move model window is requested." });
    } else if (selector === undefined || !selector.hasMaiaTaskSource()) {
      outcome = Object.freeze({ kind: "unavailable", reason: "provider_unavailable" });
    } else {
      recheck();
      const { maiaEvidence, receipt } = await selector.selectWithMaiaEvidence(request, { signal });
      recheck();
      if (maiaEvidence === null) throw new ServerError("ENGINE_UNAVAILABLE", "The requested model observation is unavailable");
      registryGeneration = receipt.generations["maia-inference"] ?? null;
      this.#requireGeneration(selector, maiaEvidence, registryGeneration);
      const resolved = resolveRunSubject(current.run, { kind: "run_node", runId: current.run.id,
        branchId: current.selection.branchId, nodeId: current.selected.id,
        eventHeadDigest: digestRunEventHead({ runId: current.run.id, headSeq: current.run.events.length, events: current.run.events }) });
      inputs = maiaNodeInputsFromSubject(maiaEvidence, resolved);
      recheck();
      if (projection === "derived.maia.node_distribution@1") {
        result = deriveMaiaNodeDistribution(inputs); values = Object.freeze([result]);
        outcome = Object.freeze({ kind: "available", collected: values.length });
      } else {
        const wdl = deriveMaiaNodeCandidateWdl(inputs); result = wdl;
        if (wdl.kind === "available") {
          values = Object.freeze([wdl.value]); outcome = Object.freeze({ kind: "available", collected: values.length });
        } else {
          if (wdl.reason !== "empty_population") throw new InspectorContextError("source_contract_invalid");
          outcome = Object.freeze({ kind: "unavailable", reason: "source_absent", disclosure: "This model window has no reported candidate win/draw/loss data." });
        }
      }
    }
    recheck();
    const sourceKey = inputs === null ? null : presentationDigest("inspector.source@1", {
      runId: current.run.id, decision: current.decision, selection: current.selection,
      viewer: { learnerId: current.principal.learnerId, role: current.role },
      requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
      projection, request, inputs: [evidenceValueReceipt(inputs.task), evidenceValueReceipt(inputs.position)],
      outcome, values: values.map(value => evidenceValueReceipt(value)),
    });
    const image = Object.freeze({ context, projection, sourceKey, request, inputs, result, values, outcome });
    const token = Object.freeze({}) as InspectorMaiaSource;
    this.#sources.set(token, { image, signal, selector, requestImage, registryGeneration });
    this.read(token); return token;
  }

  read(source: InspectorMaiaSource): MaiaImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    owned.signal.throwIfAborted(); this.contexts.read(owned.image.context);
    if (this.selector() !== owned.selector || canonicalizeJson(this.request(owned.image.context)) !== owned.requestImage) throw new InspectorContextError("stale");
    if (owned.image.inputs !== null) this.#requireGeneration(owned.selector, owned.image.inputs.task, owned.registryGeneration);
    owned.signal.throwIfAborted(); return owned.image;
  }
}
