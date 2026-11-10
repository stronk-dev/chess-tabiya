// Accepted Full Inspector source primitive. Full-consumer preflight, sparse-status delivery,
// presentation and source paging belong to the complete demand operation, not this supplier.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { assertDeclaredEvidence, assertProviderDelivery, deriveExplorerInspectorPopulation } from "@chess-tabiya/runtime";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { digestRunEventHead } from "@chess-tabiya/runtime/run-subject";
import { corpusPageRequest, type ExplorerPageAcquisition } from "./provider-corpus.js";
import type { CorpusQuery, CorpusSource } from "./corpus.js";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";

const PROJECTION = "derived.explorer.inspector_population@1";
type Page = Extract<ExplorerPageAcquisition, { kind: "page" }>["evidence"];
declare const explorerSourceBrand: unique symbol;
export interface InspectorExplorerSource { readonly [explorerSourceBrand]: true }
interface ExplorerImage {
  readonly context: InspectorRecordedContext;
  readonly projection: typeof PROJECTION;
  readonly sourceKey: string | null;
  readonly query: CorpusQuery;
  readonly page: Page | null;
  readonly result: ReturnType<typeof deriveExplorerInspectorPopulation> | null;
  readonly failure: Exclude<ExplorerPageAcquisition, { kind: "page" }> | null;
  readonly outcome: Readonly<{ kind: "available"; collected: 1 }>
    | Readonly<{ kind: "unavailable"; reason: "provider_unavailable" }>
    | Readonly<{ kind: "failed"; reason: "provider_failed" }>;
}

export class InspectorExplorerSourceOwner {
  readonly #sources = new WeakMap<object, { image: ExplorerImage; signal: AbortSignal; source: CorpusSource | undefined; queryImage: string }>();
  constructor(readonly contexts: InspectorRecordedContextOwner, readonly source: () => CorpusSource | undefined,
    readonly query: (context: InspectorRecordedContext) => CorpusQuery) {}

  async acquire(context: InspectorRecordedContext, signal: AbortSignal): Promise<InspectorExplorerSource> {
    if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector Explorer source requires an AbortSignal");
    signal.throwIfAborted(); const current = this.contexts.read(context);
    if (current.selection.context.kind !== "position") throw new InspectorContextError("source_contract_invalid");
    const query = this.query(context), queryImage = canonicalizeJson(query), source = this.source();
    const recheck = (): void => {
      signal.throwIfAborted(); this.contexts.read(context);
      if (this.source() !== source || canonicalizeJson(this.query(context)) !== queryImage) throw new InspectorContextError("stale");
      signal.throwIfAborted();
    };
    let page: Page | null = null, result: ExplorerImage["result"] = null, failure: ExplorerImage["failure"] = null;
    let outcome: ExplorerImage["outcome"];
    if (source?.page === undefined) outcome = Object.freeze({ kind: "unavailable", reason: "provider_unavailable" });
    else {
      recheck();
      const acquired = await source.page(query, { signal });
      recheck();
      if (acquired.kind !== "page") {
        failure = acquired; outcome = Object.freeze({ kind: "failed", reason: "provider_failed" });
      } else {
        page = acquired.evidence;
        assertDeclaredEvidence(page);
        const delivery = page.payload;
        assertProviderDelivery("lichess_explorer.position_page@1", delivery);
        const expected = corpusPageRequest(query, delivery.payload.request.timeoutMs);
        if (canonicalizeJson(delivery.payload.request) !== canonicalizeJson(expected)
          || canonicalizeJson(delivery.acquisition.requestedIdentity.request) !== canonicalizeJson(expected)) throw new InspectorContextError("source_contract_invalid");
        recheck();
        result = deriveExplorerInspectorPopulation(page);
        assertDeclaredEvidence(result);
        if (result.projection.id !== "derived.explorer.inspector_population" || result.projection.version !== 1
          || result.payload.page !== page || canonicalizeJson(result.payload.request) !== canonicalizeJson(expected)) throw new InspectorContextError("source_contract_invalid");
        outcome = Object.freeze({ kind: "available", collected: 1 });
      }
    }
    recheck();
    const sourceKey = result === null || page === null ? null : presentationDigest("inspector.source@1", {
      runId: current.run.id, decision: current.decision, selection: current.selection,
      viewer: { learnerId: current.principal.learnerId, role: current.role },
      requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
      eventHead: digestRunEventHead({ runId: current.run.id, headSeq: current.run.events.length, events: current.run.events }),
      projection: PROJECTION, query, page: evidenceValueReceipt(page), result: evidenceValueReceipt(result),
    });
    const image = Object.freeze({ context, projection: PROJECTION, sourceKey, query, page, result, failure, outcome });
    const token = Object.freeze({}) as InspectorExplorerSource;
    this.#sources.set(token, { image, signal, source, queryImage }); this.read(token); return token;
  }

  read(source: InspectorExplorerSource): ExplorerImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    owned.signal.throwIfAborted(); this.contexts.read(owned.image.context);
    if (this.source() !== owned.source || canonicalizeJson(this.query(owned.image.context)) !== owned.queryImage) throw new InspectorContextError("stale");
    owned.signal.throwIfAborted(); return owned.image;
  }
}
