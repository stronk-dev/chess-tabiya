import {
  EVIDENCE_CONTRACT_DECLARATIONS,
  compileEvidenceManifest,
  type CompiledEvidenceManifest,
  type EvidenceForm,
  type ProviderOffBehavior,
} from "@chess-tabiya/runtime";

import type { CapabilityProviders } from "./capabilities.js";
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
} as const);

export const RECORDED_READING_PROJECTION_MAP = Object.freeze({
  engine_eval: "recorded.engine.eval",
  tablebase_result: "recorded.tablebase.result",
} as const);

export const PACKET_FIELD_PROJECTION_MAP = Object.freeze({
  phase: "rules.phase.reading|pack.authored.phase",
  structures: "rules.structural.reading.named_structure",
  observations: "rules.structural.reading.piece_count",
  markers: "rules.pivotal.marker",
  endgame: "rules.endgame.reading",
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

function providerState(producerId: string, providers: CapabilityProviders): EvidenceProducerAvailability {
  const result = (() => {
    if (producerId === "live.stockfish") return providers.judge === "none" ? ["unavailable", "Stockfish judge provider is unavailable."] : ["available", `Stockfish judge provider: ${providers.judge}.`];
    if (producerId === "live.syzygy") return providers.tablebase === "none" ? ["honest_empty", "Tablebase provider is unavailable; out-of-domain and provider-off are explicit."] : ["available", `Tablebase provider: ${providers.tablebase}.`];
    if (producerId === "human.maia") return providers.opponent === "none" ? ["unavailable", "Human-model opponent provider is unavailable."] : ["available", `Opponent provider: ${providers.opponent}.`];
    if (producerId === "human.explorer") return providers.corpus === "none" ? ["honest_empty", "Human corpus provider is unavailable."] : ["available", `Corpus provider: ${providers.corpus}.`];
    return ["available", "Local, recorded or build-time declaration is available without an external provider."];
  })() as readonly [EvidenceAvailabilityState, string];
  return Object.freeze({ producerId, version: 1, state: result[0], reason: result[1] });
}

export function evidenceManifestCapabilities(providers: CapabilityProviders): EvidenceManifestCapabilities {
  assertEvidenceManifest();
  const consumerById = new Map(EVIDENCE_MANIFEST.consumers.map((consumer) => [consumer.id, consumer]));
  return Object.freeze({
    digest: EVIDENCE_MANIFEST.digest,
    availability: Object.freeze(EVIDENCE_MANIFEST.producers.map((producer) => providerState(producer.id, providers))),
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
