import { describe, expect, it } from "vitest";

import { evidenceForConsumer, evidenceValueReceipt, identitySealedEvidenceWithoutValueReceipt } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { consumePivotalMarkers, pivotalMarkerEvidence, pivotalMarkerEvidenceItems, pivotalMarkers } from "./pivotal.js";
import { commitMove, createRun } from "./runtime.js";

const at = "2026-09-24T00:00:00.000Z";
const created = (id: string, fen: string) => createRun({ id, packId: "p", packDigest: `sha256:${"a".repeat(64)}`, startFen: fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });

describe("pivotal marker consumer boundary", () => {
  it("mints each pivotal kind under its own exact derived projection and authority inputs", () => {
    const queen = commitMove(created("queen", "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1"), "e2e7", { at }).run;
    const branchId = queen.activeCursor.branchId;
    const items = pivotalMarkerEvidenceItems(queen, branchId);
    expect(items.map((item) => item.payload)).toEqual(pivotalMarkers(queen, branchId));
    const irreversible = items.find((item) => item.payload.kind === "irreversibility")!;
    expect(irreversible.projection).toEqual({ id: "derived.pivotal.irreversibility", version: 1 });
    expect(irreversible.producer).toEqual({ id: "derived.pivotal", version: 1 });
    const derived = invokeEvidenceValueRoute("derived.pivotal.irreversibility@1", { run: queen, branchId })[0]!;
    expect(derived.inputs.map((value) => `${value.projection.id}@${value.projection.version}`)).toEqual(["rules.transition.reading.move_irreversibility.last_of_role@1", "run.record.position@1"]);
    expect(evidenceValueReceipt(derived.evidence).sourceDigests).toEqual(derived.inputs.map((value) => evidenceValueReceipt(value).payloadDigest));

    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "board.pivotal_marker", version: 1 }, items);
    expect(consumePivotalMarkers(view)).toEqual(items.map((item) => item.payload));
    const free = { workflowContext: "position" as const, deliveryOpen: true, role: "solo" as const, seatedInContest: false, reviewing: false };
    expect(pivotalMarkerEvidence(queen, branchId, free).map((marker) => marker.kind)).toEqual(["irreversibility"]);
    if (false) {
      // @ts-expect-error Marker delivery rejects a bare marker list.
      consumePivotalMarkers(items.map((item) => item.payload));
    }
  });

  it("cannot relabel a rule marker as human-model evidence or a Maia split as a rule marker", () => {
    const queen = commitMove(created("queen", "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1"), "e2e7", { at }).run;
    const branchId = queen.activeCursor.branchId;
    const rule = pivotalMarkerEvidenceItems(queen, branchId)[0]!;
    // The human-divergence factory computes from recorded model selections only: none exist here.
    expect(invokeEvidenceValueRoute("derived.pivotal.human_divergence@1", { run: queen, branchId })).toEqual([]);
    const relabelled = identitySealedEvidenceWithoutValueReceipt({ id: "derived.pivotal", version: 1 }, { id: "derived.pivotal.human_divergence", version: 1 }, rule.payload);
    expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "board.pivotal_marker", version: 1 }, [relabelled])).toThrow(/value-authority receipt/u);
    // The retired single-projection v1 id cannot be minted or bound.
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some((binding) => binding.projection.id === "rules.pivotal.marker")).toBe(false);
    const retired = identitySealedEvidenceWithoutValueReceipt({ id: "rules.pivotal", version: 1 }, { id: "rules.pivotal.marker", version: 1 }, rule.payload);
    expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "board.pivotal_marker", version: 1 }, [retired])).toThrow(/value-authority receipt/u);
  });
});
