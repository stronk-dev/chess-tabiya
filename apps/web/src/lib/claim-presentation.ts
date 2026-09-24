import type { AuthoredFeedbackItem } from "./api.js";
import { PRIMARY_EVIDENCE_MANIFEST, assertConsumerEvidenceView, claimDeliveryEvidence, evidenceForConsumer, presentEvidenceItems, presentedSentence, type ConsumerEvidenceView } from "@chess-tabiya/runtime";

type ClaimItem = Extract<AuthoredFeedbackItem, { readonly kind: "claim" }>;

/**
 * rfc/evidence-presentation.md Checkpoint A ([[D1673]] vertical slice): the admitted
 * `pack.authored.claim_delivery@1` item becomes a sealed `claim` component through its registered
 * `guidance.authored_claim@1` adapter; the seat renders that component's equivalent sentence. The
 * evidence-type vocabulary renders through its total label registry, never as raw ids.
 */
export function claimProvenanceDeclared(view: ConsumerEvidenceView<ClaimItem>): string {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "guidance.authored_claim" || view.consumer.version !== 1 || view.items.length !== 1) {
    throw new TypeError("Expected one guidance.authored_claim@1 evidence item");
  }
  const [claim] = presentEvidenceItems(view as ConsumerEvidenceView<unknown>);
  if (claim === undefined || claim.component.id !== "claim") throw new TypeError("The authored claim has no claim component");
  return presentedSentence(claim);
}

export function claimProvenance(item: ClaimItem): string {
  const declared = claimDeliveryEvidence(item);
  return claimProvenanceDeclared(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "guidance.authored_claim", version: 1 },
    [declared],
  ));
}
