/** Registered whole-source admission before adapting to the existing durable packet. */
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
import type { TablebasePosition, TablebaseProbeOptions, TablebaseSource } from "./tablebase.js";

type Delivery = ProviderEvidenceDelivery<LiveSyzygyPosition, "syzygy.position@1">;
const CONSUMER = Object.freeze({ id: "runtime.queued_tablebase", version: 1 });
const EXECUTION = compileEvidenceConsumerExecution(EVIDENCE_MANIFEST, CONSUMER);

export function consumeQueuedTablebaseEvidence(view: ConsumerEvidenceView<Delivery>): Delivery {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== CONSUMER.id || view.consumer.version !== CONSUMER.version || view.items.length !== 1) {
    throw new TypeError("Queued tablebase work requires exactly one admitted whole source");
  }
  const delivery = view.items[0]!.payload;
  assertProviderDelivery("syzygy.position@1", delivery);
  return delivery;
}

export async function queuedTablebasePosition(source: TablebaseSource, fen: string, options: TablebaseProbeOptions): Promise<TablebasePosition> {
  // Only sources with no modern method use standalone compatibility. A modern failure
  // cannot become an exact durable fact through a bare-probe retry.
  if (source.probeEvidence === undefined) return source.probe(fen, options);
  const evidence = await source.probeEvidence(fen, options);
  if (!EXECUTION.bindings.some(row => row.binding.projection.id === evidence.projection.id && row.binding.projection.version === evidence.projection.version)) {
    throw new TypeError("Queued tablebase work received an undeclared source projection");
  }
  const delivery = consumeQueuedTablebaseEvidence(evidenceForConsumer(EVIDENCE_MANIFEST, CONSUMER, [evidence]));
  if (delivery.payload.fen !== fen || delivery.acquisition.requestedIdentity.request.fen !== fen) {
    throw new TypeError("Queued tablebase source does not match the exact job FEN");
  }
  return delivery.payload.position;
}
