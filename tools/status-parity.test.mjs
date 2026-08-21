import assert from "node:assert/strict";
import test from "node:test";

import {
  bodyStatus, checkP1, checkP2, checkP3, checkP4, checkP5, checkP6,
  parseDischarges, parseStatus,
} from "./status-parity.mjs";

const record = (token = "draft", pointer = null) => ({ rfc: "one.md", status: { token, pointer } });
const document = (status = "draft", discharge = "none") => `# RFC

- **Status:** ${status}

## Acceptance criteria

## Discharges

${discharge}

## Open questions
`;
const table = (rows) => `| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
${rows.join("\n")}`;

test("status parser strips emphasis and reads awaiting pointer", () => {
  assert.deepEqual(parseStatus("**awaiting — D3 (wave)**"), { token: "awaiting", pointer: "D3" });
  assert.equal(bodyStatus(document()).token, "draft");
});

test("P1 passes seven-token statuses and fails a disposition", () => {
  assert.deepEqual(checkP1([record()], { "one.md": document() }), []);
  assert.match(checkP1([record("blocked")], { "one.md": document() })[0], /invalid Active status/);
});

test("P2 passes parity and fails unequal leading tokens", () => {
  assert.deepEqual(checkP2([record()], { "one.md": document() }), []);
  assert.match(checkP2([record("accepted")], { "one.md": document() })[0], /Active accepted != body draft/);
});

test("P3 passes non-empty set equalities and terminal archive status", () => {
  assert.deepEqual(checkP3(["one.md"], ["one.md"], ["archive/done.md"], ["archive/done.md"], {
    "archive/done.md": document("implemented"),
  }), []);
});

test("P3 fails a file absent from both registers", () => {
  assert.match(checkP3(["one.md"], ["one.md", "lost.md"], ["archive/done.md"], ["archive/done.md"], {
    "archive/done.md": document("implemented"),
  })[0], /Active\/root mismatch/);
});

test("P4 passes none and fails awaiting without a live row", () => {
  assert.deepEqual(checkP4([record()], { "one.md": document() }).errors, []);
  assert.match(checkP4([record("awaiting", "D1")], { "one.md": document("awaiting — D1") }).errors.join("\n"), /no open discharge/);
});

test("P4 passes an awaiting pointer to an open row", () => {
  const markdown = document("awaiting — D1", table(["| `D1` | run the wave | `OWNER` | log | |"]))
  assert.deepEqual(checkP4([record("awaiting", "D1")], { "one.md": markdown }).errors, []);
});

test("P5 passes awaiting and fails implemented with an open row", () => {
  const row = { id: "D1", owner: "OWNER", discharged: "", rfc: "one.md" };
  assert.deepEqual(checkP5([record("awaiting", "D1")], { "one.md": document("awaiting — D1") }, { "one.md": [row] }, {}), []);
  assert.match(checkP5([record("implemented")], { "one.md": document("implemented") }, { "one.md": [row] }, {})[0], /implemented with an open discharge/);
});

test("P6 passes two valid owner forms", () => {
  const discharges = { "one.md": [
    { id: "D1", owner: "`OWNER`", discharged: "", rfc: "one.md" },
    { id: "D2", owner: "`planning/job/`", discharged: "", rfc: "one.md" },
  ] };
  assert.deepEqual(checkP6(discharges, ["one.md"], (name) => name === "planning/job/"), []);
});

test("P6 fails one archived owner among two cells", () => {
  const discharges = { "one.md": [
    { id: "D1", owner: "`OWNER`", discharged: "", rfc: "one.md" },
    { id: "D2", owner: "`archived-rfc`", discharged: "", rfc: "one.md" },
  ] };
  assert.match(checkP6(discharges, ["one.md"], () => false)[0], /invalid or archived owner/);
});

test("discharge parser rejects a section with neither declaration form", () => {
  assert.match(parseDischarges(document("draft", "commentary only"), "one.md").error, /neither none nor a valid table/);
});
