// Synthetic replay controls, not timing or chess evidence.
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkSourceOffControl } from "./source-off-check.mjs";
function fixture() {
  return { modules: { status: 200, body: { page: {
    protocol: "module.query_page@1", timing: "post_commit", decision: { digest: "decision" }, subjectNodeId: "node", suppressions: [],
    packets: ["structure_nudge", "theory_breadcrumb"].map(module => ({ module, timing: "post_commit", empty: null,
      receipt: { protocol: "presentation.receipt@1", items: [{ componentDigest: "component" }] },
      disclosure: { module, decisionDigest: "decision", subject: { nodeId: "node" }, componentDigests: ["component"] },
    })),
  } } } };
}
test("fixed source-off control delivers both exact positive packets", () => checkSourceOffControl(fixture()));
for (const [name, corrupt] of [
  ["missing empty field", p => delete p.packets[0].empty],
  ["empty object instead of actual delivery", p => p.packets[0].empty = {}],
  ["no delivered items", p => p.packets[0].receipt.items = []],
  ["duplicate requested module", p => p.packets.push(p.packets[0])],
  ["suppressed module", p => p.suppressions.push({ module: "structure_nudge" })],
  ["wrong timing", p => p.packets[0].timing = "pre_commit"],
  ["wrong page protocol", p => p.protocol = "other"],
  ["wrong decision", p => p.packets[0].disclosure.decisionDigest = "other"],
  ["wrong subject", p => p.packets[0].disclosure.subject.nodeId = "other"],
  ["wrong component join", p => p.packets[0].disclosure.componentDigests = ["other"]],
]) test(`refuses ${name}`, () => { const row = fixture(); corrupt(row.modules.body.page); assert.throws(() => checkSourceOffControl(row)); });
