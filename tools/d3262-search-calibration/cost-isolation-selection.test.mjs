import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { executeIsolatedTriplet, isolationSourceDigest } from "./cost-case-isolation.mjs";
import { selectDeadlineTriplets, joinIsolationAttempts } from "./cost-isolation-selection.mjs";
import { sha } from "./cost-contract.mjs";

const clone = value => JSON.parse(JSON.stringify(value));
const fixture = fileURLToPath(new URL("cost-case-isolation-fixture.mjs", import.meta.url));
const cell = { rootId: "synthetic", candidateUci: "e2e4", setting: "pv:depth12", horizon: 4, regime: "cold" };
const setting = { id: cell.setting, family: "provider_line", budget: "depth12" };
const subject = { rootFen: "4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1", definitions: [{ id: "ep", rootId: "synthetic", family: "material",
  target: { attacker: { color: "black", role: "pawn", square: "d4" }, target: { color: "white", role: "pawn", square: "e2" } } }] };
const planDigest = sha("synthetic selection plan");
const group = (record, i = 0) => ({ name: `triplet-${String(i * 3).padStart(6, "0")}.json.gz`,
  digest: sha(JSON.stringify(record.records)), records: record.records });

test("selection and qualification preserve both original failure and new success, never two unique population rows", async t => {
  const dir = mkdtempSync(join(tmpdir(), "d3512-selection-controls-")), counter = join(dir, "counter");
  writeFileSync(counter, "0");
  const args = [fixture, "first_silent", counter], sourceDigest = isolationSourceDigest(process.execPath, args);
  const options = { cell, setting, subject, planDigest, command: process.execPath, args,
    timeoutMs: 1000, expectedSourceDigest: sourceDigest };
  try {
    const original = await executeIsolatedTriplet(options), successor = await executeIsolatedTriplet(options);
    const originals = [group(original)], selected = selectDeadlineTriplets(originals);
    assert.equal(selected.length, 1);
    assert.equal(selected[0].originalRecords.length, 3);
    assert.equal(selected[0].originalRecords[0].rawCaptureDigest, original.records[0].row.rawCaptureDigest);
    const result = joinIsolationAttempts(selected, originals, [successor], sourceDigest, 1000);
    assert.equal(result.pairs.length, 3); assert.equal(result.originalRetainedCases, 3); assert.equal(result.successorCases, 3);
    assert.equal(result.pairs[0].originalKind, "budget_exhausted"); assert.equal(result.pairs[0].successorKind, "available");
    assert.equal(result.qualifiedSettings, null); assert.equal(result.readyColdProcesses, 1);
    assert.equal(result.independentReplay, "not_established_by_this_join");
    assert.equal(readFileSync(counter, "utf8"), "2");
    assert.deepEqual(selectDeadlineTriplets([group(successor)]), [], "success is not a selection predicate");

    const badSelections = {
      missing: x => x.pop(),
      duplicated: x => x.push(clone(x[0])),
      crossedGroup: x => x[0].groupName = "foreign",
      crossedGroupDigest: x => x[0].groupDigest = sha("foreign"),
      crossedCase: x => x[0].cell.candidateUci = "e2e3",
      crossedOriginalDigest: x => x[0].originalRecords[0].rawCaptureDigest = sha("foreign"),
      missingOriginalRegime: x => x[0].originalRecords.pop(),
    };
    for (const [name, mutate] of Object.entries(badSelections)) await t.test(`selection ${name}`, () => {
      const bad = clone(selected); mutate(bad);
      assert.throws(() => joinIsolationAttempts(bad, originals, [successor], sourceDigest, 1000));
    });
    await t.test("original failure removed", () => assert.throws(() => joinIsolationAttempts(selected, [], [successor], sourceDigest, 1000)));
    await t.test("original failure replaced by success", () => assert.throws(() => joinIsolationAttempts(selected, [group(successor)], [successor], sourceDigest, 1000)));
    await t.test("original raw bytes resealed into a false result", () => {
      const bad = clone(originals); bad[0].records[0].raw.result.kind = "available";
      bad[0].records[0].row.rawCaptureDigest = sha(JSON.stringify(bad[0].records[0].raw));
      assert.throws(() => selectDeadlineTriplets(bad));
    });
    await t.test("successor missing", () => assert.throws(() => joinIsolationAttempts(selected, originals, [], sourceDigest, 1000)));
    await t.test("successor duplicated", () => assert.throws(() => joinIsolationAttempts(selected, originals, [successor, successor], sourceDigest, 1000)));
    await t.test("successor deadline widened", () => {
      const bad = clone(successor); bad.trace.timeoutMs += 1;
      assert.throws(() => joinIsolationAttempts(selected, originals, [bad], sourceDigest, 1000), /original case\/source/);
    });
    await t.test("foreign expected source cannot reclassify both sides", () => assert.throws(() => joinIsolationAttempts(selected, originals, [successor], sha("foreign"), 1000)));
    await t.test("foreign successor plan", () => {
      const bad = clone(successor); bad.records.forEach(r => r.row.planDigest = sha("other plan"));
      assert.throws(() => joinIsolationAttempts(selected, originals, [bad], sourceDigest, 1000), /successor plan/);
    });
    await t.test("missing declared deadline", () => assert.throws(() => joinIsolationAttempts(selected, originals, [successor], sourceDigest)));
    await t.test("duplicate original identity", () => assert.throws(() => selectDeadlineTriplets([originals[0], originals[0]])));
    await t.test("changed original raw bytes", () => {
      const bad = clone(originals); bad[0].records[0].raw.cell.rootId = "foreign";
      assert.throws(() => selectDeadlineTriplets(bad));
    });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("node exhaustion, invalid PV and startup failure are not silently added to the deadline-selected successor", () => {
  const record = kind => {
    const records = ["cold", "warm", "provider_offline"].map(regime => {
      const raw = { cell: { ...cell, regime }, result: { kind }, dependencies: [] };
      return { row: { ...raw.cell, kind, rawCaptureDigest: sha(JSON.stringify(raw)) }, raw };
    });
    return { name: "control", digest: sha("synthetic bytes"), records };
  };
  for (const kind of ["budget_exhausted", "invalid_source", "source_unavailable", "no_target"])
    assert.deepEqual(selectDeadlineTriplets([record(kind)]), []);
});
