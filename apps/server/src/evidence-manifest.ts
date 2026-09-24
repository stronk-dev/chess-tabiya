import {
  EVIDENCE_CONTRACT_DECLARATIONS,
  compileEvidenceManifest,
  type CompiledEvidenceManifest,
  type EvidenceForm,
  type ProviderOffBehavior,
} from "@chess-tabiya/runtime";

import { F1_PROVIDER_PRODUCERS, availabilityAdmitsNewRequest, instanceOperationAvailability, type ProviderHealthCapabilities } from "@chess-tabiya/runtime";
import type { OpeningCatalogueAvailability } from "./opening-catalogue.js";
import { RECORDED_READING_DISPOSITIONS } from "./position-evidence.js";
import { EVIDENCE_KINDS } from "./sourcing/types.js";

export type EvidenceAvailabilityState = "available" | "honest_empty" | "unavailable";
export interface EvidenceProducerAvailability {
  readonly producerId: string;
  readonly version: number;
  readonly state: EvidenceAvailabilityState;
  readonly reason: string;
}
export interface EvidenceConsumerBindingSummary {
  readonly consumerId: string;
  readonly consumerVersion: number;
  readonly projectionId: string;
  readonly projectionVersion: number;
  readonly forms: readonly EvidenceForm[];
  readonly providerOff: ProviderOffBehavior;
}
export interface EvidenceManifestCapabilities {
  readonly digest: string;
  readonly counts: {
    readonly producers: number;
    readonly projections: number;
    readonly consumers: number;
    readonly bindings: number;
    readonly semanticEvents: number;
    readonly eligibility: number;
    readonly reasons: number;
    readonly selectionPolicies: number;
  };
  readonly availability: readonly EvidenceProducerAvailability[];
  readonly bindings: readonly EvidenceConsumerBindingSummary[];
}

export const RUNTIME_EVENT_PROJECTION_MAP = Object.freeze({
  eval: "live.stockfish.eval",
  wdl: "live.stockfish.wdl",
  bestline: "live.stockfish.pv",
  tablebase: "live.syzygy.category",
} as const);

export const SOURCING_PROJECTION_MAP = Object.freeze({
  opening_identity: "theory.opening_identity.record",
  position_legality: "rules.structural.predicate.piece_count",
  explorer_frequency: "human.explorer.population",
  explorer_position_census: "human.explorer.population",
  tablebase_result: "recorded.tablebase.result",
  engine_eval: "recorded.engine.eval",
  puzzle_provenance: "pack.authored.claim",
  citable_text: "sourcing.ledger.citable_text",
} as const);

export const RECORDED_READING_PROJECTION_MAP = Object.freeze({
  engine_eval: "recorded.engine.eval",
  tablebase_result: "recorded.tablebase.result",
} as const);

export const PACKET_FIELD_PROJECTION_MAP = Object.freeze({
  phase: "rules.phase.reading@2|pack.authored.phase",
  structures: "rules.structural.reading.named_structure@2",
  observations: "rules.structural.reading.piece_count",
  markers: "derived.pivotal.irreversibility|derived.pivotal.phase_change|derived.pivotal.human_divergence|derived.pivotal.option_collapse",
  endgame: "rules.endgame.classification",
  plans: "theory.shapes.firing",
  authored: "pack.authored.claim",
  readings: "recorded.engine.eval|recorded.tablebase.result",
} as const);

// Compiled once at module load. Application startup calls assertEvidenceManifest explicitly, while
// verification imports this same value; there is no second declaration set or generated snapshot.
export const EVIDENCE_MANIFEST: CompiledEvidenceManifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);

export function assertEvidenceManifest(): CompiledEvidenceManifest {
  if (EVIDENCE_MANIFEST.digest.length !== 64) throw new TypeError("Evidence manifest digest is unavailable");
  if (Object.keys(SOURCING_PROJECTION_MAP).sort().join("|") !== [...EVIDENCE_KINDS].sort().join("|")) throw new TypeError("Sourcing evidence kinds are not closed over the evidence manifest");
  const admitted = RECORDED_READING_DISPOSITIONS.filter((row) => row.disposition === "admitted").map((row) => row.kind).sort();
  if (admitted.join("|") !== Object.keys(RECORDED_READING_PROJECTION_MAP).sort().join("|")) throw new TypeError("Recorded reading dispositions are not closed over the evidence manifest");
  return EVIDENCE_MANIFEST;
}

/**
 * rfc/provider-health-degradation.md §8: the four provider-backed F1 producers read the live
 * registry snapshot of their one mapped instance; every other producer is local, recorded or
 * build-time. Provider-off applies the producer's consumer behavior and never reads as a domain
 * answer ("no games", "outside tablebase range").
 */
function providerState(producerId: string, health: ProviderHealthCapabilities, openingCatalogue?: OpeningCatalogueAvailability): EvidenceProducerAvailability {
  const result = (() => {
    const instanceId = (F1_PROVIDER_PRODUCERS as Readonly<Record<string, string>>)[producerId];
    if (instanceId !== undefined) {
      const snapshot = health.providers.find((row) => row.instanceId === instanceId);
      if (snapshot === undefined) throw new TypeError(`provider snapshot for ${instanceId} is missing`);
      const availability = instanceOperationAvailability(snapshot);
      const off = producerId === "live.syzygy" || producerId === "human.explorer" ? "honest_empty" : "unavailable";
      if (availabilityAdmitsNewRequest(availability)) return ["available", `${instanceId} is ${snapshot.state === "unverified" ? "ready to try (not yet verified)" : snapshot.state}.`];
      return [off, snapshot.state === "not_configured" ? `${instanceId} is not configured on this deployment.` : `${instanceId} is ${snapshot.state.replaceAll("_", " ")}${"reason" in snapshot && snapshot.reason !== null ? ` (${snapshot.reason})` : ""}; this is provider state, not a domain answer.`];
    }
    if (producerId === "theory.opening.runtime") return openingCatalogue?.kind === "available" ? ["available", "Pinned local runtime opening catalogue is available."] : ["unavailable", openingCatalogue?.reason ?? "artifact_missing"];
    return ["available", "Local, recorded or build-time declaration is available without an external provider."];
  })() as readonly [EvidenceAvailabilityState, string];
  return Object.freeze({ producerId, version: 1, state: result[0], reason: result[1] });
}

export function evidenceManifestCapabilities(health: ProviderHealthCapabilities, openingCatalogue?: OpeningCatalogueAvailability): EvidenceManifestCapabilities {
  assertEvidenceManifest();
  const consumerById = new Map(EVIDENCE_MANIFEST.consumers.map((consumer) => [consumer.id, consumer]));
  return Object.freeze({
    digest: EVIDENCE_MANIFEST.digest,
    counts: Object.freeze({ producers: EVIDENCE_MANIFEST.producers.length, projections: EVIDENCE_MANIFEST.projections.length, consumers: EVIDENCE_MANIFEST.consumers.length, bindings: EVIDENCE_MANIFEST.bindings.length, semanticEvents: EVIDENCE_MANIFEST.semanticEvents.length, eligibility: EVIDENCE_MANIFEST.eligibility.length, reasons: EVIDENCE_MANIFEST.reasons.length, selectionPolicies: EVIDENCE_MANIFEST.selectionPolicies.length }),
    availability: Object.freeze(EVIDENCE_MANIFEST.producers.map((producer) => providerState(producer.id, health, openingCatalogue))),
    bindings: Object.freeze(EVIDENCE_MANIFEST.bindings.map((binding) => Object.freeze({
      consumerId: binding.consumer.id,
      consumerVersion: binding.consumer.version,
      projectionId: binding.projection.id,
      projectionVersion: binding.projection.version,
      forms: binding.forms,
      providerOff: consumerById.get(binding.consumer.id)!.providerOff,
    }))),
  });
}
