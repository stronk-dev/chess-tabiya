// Current, request-scoped ledger supplier. Registry enumeration is not current access;
// this owner joins both and rechecks each before any retained result can be published.
import { invokeRunRecordPosition } from "@chess-tabiya/runtime";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";
import { PackRegistry, RecordedMeasurementSourceError, type RecordedMeasurementPopulation, type RecordedMeasurementProjection } from "./pack-registry.js";

declare const ledgerSourceBrand: unique symbol;
export interface InspectorLedgerSource { readonly [ledgerSourceBrand]: true }
type Population = ReturnType<PackRegistry["readRecordedMeasurements"]>;
type Admission = ReturnType<PackRegistry["resolveRecordedMeasurementSource"]>;
type Coverage = Population["counts"] & Readonly<{ sourceKey: string }>;
interface LedgerImage {
  readonly context: InspectorRecordedContext;
  readonly projection: RecordedMeasurementProjection;
  readonly sourceKey: string | null;
  readonly recordedCoverage: Coverage | null;
  readonly outcome: Population["outcome"] | Exclude<Admission, { kind: "available" }>;
  readonly population: Population | null;
}
export class InspectorLedgerSourceOwner {
  readonly #sources = new WeakMap<object, { image: LedgerImage; admission: Admission | null; population: RecordedMeasurementPopulation | null; signal: AbortSignal }>();
  constructor(readonly contexts: InspectorRecordedContextOwner, readonly registry: PackRegistry | undefined) {}

  acquire(context: InspectorRecordedContext, projection: RecordedMeasurementProjection, signal: AbortSignal): InspectorLedgerSource {
    signal.throwIfAborted();
    if (projection !== "recorded.engine.eval@1" && projection !== "recorded.tablebase.result@1") throw new InspectorContextError("source_contract_invalid");
    const current = this.contexts.read(context);
    if (current.selection.context.kind !== "position") throw new InspectorContextError("source_contract_invalid");
    let admission: Admission | null = null, population: RecordedMeasurementPopulation | null = null;
    let data: Population | null = null;
    let outcome: LedgerImage["outcome"] = Object.freeze({ kind: "unavailable", reason: "source_absent" });
    const pack = current.run.sessionKind === "pack" ? current.run.packDigest : null;
    if (pack !== null && this.registry !== undefined) {
      admission = this.#admission(pack);
      if (admission.kind !== "available") outcome = admission;
      else {
        try {
          const position = invokeRunRecordPosition(current.run, current.selected.id);
          population = this.registry.collectRecordedMeasurements({ source: admission.source, position, projection });
          data = this.registry.readRecordedMeasurements(population);
          outcome = data.outcome;
        } catch (error) {
          if (!(error instanceof TypeError)) throw error;
          outcome = Object.freeze({ kind: "failed", reason: error instanceof RecordedMeasurementSourceError ? error.reason : "source_contract_invalid" });
        }
      }
    }
    // Complete source identity: original context/head/permission and artifacts, every matching
    // occurrence and actual invocation/refusal, including successful zero populations.
    const sourceKey = data === null ? null : presentationDigest("inspector.source@1", {
      runId: current.run.id, decision: current.decision, selection: current.selection,
      viewer: { learnerId: current.principal.learnerId, role: current.role },
      requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
      projection, pack: { id: data.artifact.document.id, digest: data.artifact.packDigest,
        ledgerDigest: data.artifact.ledgerDigest, manifestDigest: data.artifact.manifestDigest },
      position: { payload: data.position.payload, receipt: evidenceValueReceipt(data.position), origin: data.origin },
      records: data.records.map(row => ({ ordinal: row.ordinal, sourceOrdinal: row.sourceOrdinal,
        record: row.record, source: row.source, ledger: evidenceValueReceipt(row.invocation.ledger),
        result: row.invocation.result.kind === "available"
          ? { kind: "available", value: evidenceValueReceipt(row.invocation.result.value) } : row.invocation.result })),
      abstentions: data.abstentions, counts: data.counts, outcome: data.outcome,
    });
    const recordedCoverage = data === null ? null : Object.freeze({ sourceKey: sourceKey!, ...data.counts });
    const image = Object.freeze({ context, projection, sourceKey, recordedCoverage, outcome, population: data });
    const source = Object.freeze({}) as InspectorLedgerSource;
    this.#sources.set(source, { image, admission, population, signal });
    this.read(source); // recheck cancellation/current access and original registry after work
    return source;
  }

  read(source: InspectorLedgerSource): LedgerImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    owned.signal.throwIfAborted();
    const current = this.contexts.read(owned.image.context);
    if (owned.admission !== null) {
      const now = this.#admission(current.run.packDigest!);
      if (now.kind !== owned.admission.kind || (now.kind === "available" && owned.admission.kind === "available"
        ? now.source !== owned.admission.source : "reason" in now && "reason" in owned.admission && now.reason !== owned.admission.reason)) throw new InspectorContextError("stale");
    }
    if (owned.population !== null && this.registry!.readRecordedMeasurements(owned.population) !== owned.image.population) throw new InspectorContextError("stale");
    owned.signal.throwIfAborted();
    return owned.image;
  }

  #admission(packDigest: string): Admission {
    try { return this.registry!.resolveRecordedMeasurementSource(packDigest); }
    catch (error) { return Object.freeze({ kind: "failed", reason: error instanceof TypeError ? "source_contract_invalid" : "source_lookup_failed" }); }
  }
}
