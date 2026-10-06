// Stronger, independent replay of the fixed source-off control. No timing mutation.
import assert from "node:assert/strict";
export function checkSourceOffControl(row) {
  assert.equal(row.modules.status, 200);
  const page = row.modules.body.page;
  assert.equal(page.protocol, "module.query_page@1");
  assert.equal(page.timing, "post_commit");
  for (const module of ["structure_nudge", "theory_breadcrumb"]) {
    assert(!page.suppressions.some(item => item.module === module));
    const packets = page.packets.filter(item => item.module === module);
    assert.equal(packets.length, 1, "exactly one requested-module packet");
    const packet = packets[0];
    // This fixed positive control must actually deliver, not merely permit an empty object.
    assert.equal(packet.empty, null);
    assert.equal(packet.timing, "post_commit");
    assert.equal(packet.receipt.protocol, "presentation.receipt@1");
    assert(packet.receipt.items.length > 0);
    assert.equal(packet.disclosure.module, module);
    assert.equal(packet.disclosure.decisionDigest, page.decision.digest);
    assert.equal(packet.disclosure.subject.nodeId, page.subjectNodeId);
    assert.deepEqual(packet.disclosure.componentDigests, packet.receipt.items.map(item => item.componentDigest));
  }
}
