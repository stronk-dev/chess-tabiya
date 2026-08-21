import { describe, expect, it } from "vitest";

import { evidenceForConsumer } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { consumePivotalMarkers, pivotalMarkerEvidence, type PivotalMarker } from "./pivotal.js";
import { declareEvidence } from "./evidence-contract.js";

const marker: PivotalMarker = Object.freeze({
  nodeId: "n1",
  kind: "phase_change",
  detail: Object.freeze({ from: "opening", to: "middlegame" }),
  provenanceNote: "Tabiya's pivotal-marker convention",
});

describe("pivotal marker consumer boundary", () => {
  it("admits marker evidence before timeline/modal delivery", () => {
    const declared = declareEvidence({ id: "rules.pivotal", version: 1 }, { id: "rules.pivotal.marker", version: 1 }, marker);
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "board.pivotal_marker", version: 1 }, [declared]);
    expect(consumePivotalMarkers(view)).toEqual([marker]);
    expect(pivotalMarkerEvidence([marker])).toEqual([marker]);
    if (false) {
      // @ts-expect-error Marker delivery rejects a bare marker list.
      consumePivotalMarkers([marker]);
    }
  });
});
