/** Whole-source admission for comparison decidedness; no raw provider fallback on failure. */
import {
  assertConsumerEvidenceView,
  assertProviderDelivery,
  compileEvidenceConsumerExecution,
  evidenceForConsumer,
  type ConsumerEvidenceView,
  type LiveSyzygyPosition,
  type ProviderEvidenceDelivery,
} from "@chess-tabiya/runtime";
import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";
import type { TablebasePosition, TablebaseSource } from "./tablebase.js";

type Delivery = ProviderEvidenceDelivery<LiveSyzygyPosition, "syzygy.position@1">;
const CONSUMER = Object.freeze({ id: "runtime.branch_decidedness", version: 1 });
const EXECUTION = compileEvidenceConsumerExecution(EVIDENCE_MANIFEST, CONSUMER);

export function consumeBranchDecidednessEvidence(view: ConsumerEvidenceView<Delivery>): Delivery {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== CONSUMER.id || view.consumer.version !== CONSUMER.version || view.items.length !== 1) {
    throw new TypeError("Branch decidedness requires exactly one admitted whole tablebase source");
  }
  const delivery = view.items[0]!.payload;
  assertProviderDelivery("syzygy.position@1", delivery);
  return delivery;
}

export async function branchTablebasePosition(source: TablebaseSource, fen: string): Promise<TablebasePosition> {
  // Standalone/mock sources have no modern receipt method. A failed modern source never
  // retries through this compatibility path or manufactures a source seal from bare data.
  if (source.probeEvidence === undefined) return source.probe(fen);
  const evidence = await source.probeEvidence(fen);
  if (!EXECUTION.bindings.some(row => row.binding.projection.id === evidence.projection.id && row.binding.projection.version === evidence.projection.version)) {
    throw new TypeError("Branch decidedness received an undeclared source projection");
  }
  const delivery = consumeBranchDecidednessEvidence(evidenceForConsumer(EVIDENCE_MANIFEST, CONSUMER, [evidence]));
  if (delivery.payload.fen !== fen || delivery.acquisition.requestedIdentity.request.fen !== fen) {
    throw new TypeError("Branch decidedness tablebase source does not match the exact leaf FEN");
  }
  return delivery.payload.position;
}
