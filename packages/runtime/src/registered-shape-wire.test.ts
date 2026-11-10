import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { factStatementOperand, parsePresentationReceipt, presentEvidenceItems, presentationDigest, serializePresentedEvidence } from "./presentation-contract.js";
import { registeredShapePointFixture } from "./testing/registered-shape-fixture.js";

const source = await registeredShapePointFixture([{ id: "actual-timing-node", fen: "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1" }]);
const evidence = invokeEvidenceValueRoute("theory.shapes.firing@3", { scan: source.scans.get("actual-timing-node")! });
const consumers = ["theory.shape_firing", "module.full_inspector", "module.structure_nudge", "module.theory_breadcrumb"];
const fields = ["name", "documentVersion", "channel", "publisherHandle", "documentDigest", "firstNodeId", "lastNodeId", "openEnded"] as const;

describe("D4091 exact full registered-shape wire retention", () => {
  for (const id of consumers) it.each(fields)(`${id} rejects re-digested %s paired with the genuine original evidence digest`, field => {
    const receipt = serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id, version: 2 }, evidence)));
    expect(parsePresentationReceipt(JSON.parse(JSON.stringify(receipt)))).toHaveLength(1);
    const changed = JSON.parse(JSON.stringify(receipt)) as typeof receipt;
    const item = changed.items[0]!;
    if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "inspector.registered_shape_firing@2") throw Error("Expected the actual current registered shape statement");
    const payload = item.component.operand.operands;
    if (field === "name") Object.assign(payload.authority, { name: "A different authored pattern" });
    if (field === "documentVersion") Object.assign(payload.authority, { documentVersion: "9.9.9" });
    if (field === "channel") Object.assign(payload.authority, { channel: "official" });
    if (field === "publisherHandle") Object.assign(payload.authority, { publisherHandle: "another_author" });
    if (field === "documentDigest") Object.assign(payload.authority, { documentDigest: `sha256:${"f".repeat(64)}` });
    if (field === "firstNodeId" || field === "lastNodeId") Object.assign(payload, { [field]: "other-timing-node" });
    if (field === "openEnded") Object.assign(payload, { openEnded: false });
    // Rebuild the legitimate component's own renderedText/sourceDigest too. Otherwise a
    // stale internal component digest would reject before the evidence-ref join is exercised.
    Object.assign(item, { component: { id: "fact_statement", operand: factStatementOperand("inspector.registered_shape_firing@2", "declared_convention", "shape-catalogue@1", payload) } });
    const { componentDigest: _old, ...body } = item;
    const items = [{ ...body, componentDigest: presentationDigest("presentation.component@1", body) }];
    const crossed = { ...changed, items, digest: presentationDigest("presentation.receipt@1", items) };
    expect(crossed.items[0]!.evidenceRef).toEqual(receipt.items[0]!.evidenceRef);
    expect(() => parsePresentationReceipt(crossed)).toThrow(/digest|retained|operand|source/u);
  });
});
