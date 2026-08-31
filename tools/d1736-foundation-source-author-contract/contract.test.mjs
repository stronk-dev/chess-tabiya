import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const plan = JSON.parse(readFileSync("planning/foundation-source-identity/projection-plan.json", "utf8"));
const rfc = readFileSync("rfc/foundation-source-identity.md", "utf8");

const key = (row) => row.projection;

test("the source wave is one closed 23-projection image", () => {
  assert.equal(plan.schemaVersion, 1);
  assert.equal(plan.rows.length, 23);
  assert.equal(new Set(plan.rows.map(key)).size, 23);
  assert.deepEqual(
    Object.fromEntries([...Map.groupBy(plan.rows, (row) => row.family)]
      .map(([family, rows]) => [family, rows.length]).sort(([a], [b]) => a.localeCompare(b))),
    {
      backward_pawn: 3,
      file_activity: 3,
      king_opposition: 2,
      line_identity: 1,
      pawn_file_identity: 2,
      pawn_islands: 1,
      square_denial_outpost: 4,
      style_atoms: 7,
    },
  );
  assert.deepEqual(
    Object.fromEntries([...Map.groupBy(plan.rows, (row) => row.grain)]
      .map(([grain, rows]) => [grain, rows.length]).sort(([a], [b]) => a.localeCompare(b))),
    { candidate: 4, edge: 8, frozen_prefix: 1, position: 10 },
  );
});

test("every projection has literal authority, owner and lifecycle state", () => {
  const owners = new Set(["shared-candidate-evidence-packet", "recorded-semantic-path", "recorded-clocks"]);
  for (const row of plan.rows) {
    assert.match(row.projection, /^(?:derived|rules|run)\.[a-z0-9_.]+@[1-9][0-9]*$/u, row.projection);
    assert.match(row.authority, /^[a-z0-9-]+@[1-9][0-9]*$/u, row.projection);
    assert.ok(owners.has(row.executionOwner), row.projection);
    assert.ok(row.state === "new" || row.state === "successor", row.projection);
    assert.ok(rfc.includes(`\`${row.projection}\``), row.projection);
  }
});

test("external owners stay explicit and outside the source projection image", () => {
  assert.equal(plan.explicitExternalOwners.length, 9);
  const externalText = plan.explicitExternalOwners.join("\n");
  for (const required of [
    "named_structure@2",
    "semantic avoidance",
    "promotion",
    "provider receipts",
    "bounded target policy",
    "cited theory",
    "variant rules identity",
    "learner module migration",
    "validation admission",
  ]) assert.match(externalText, new RegExp(required, "u"));
  assert.ok(!plan.rows.some((row) => row.projection.includes("named_structure")));
  assert.ok(!plan.rows.some((row) => row.projection.includes("semantic_avoidance")));
  assert.ok(!plan.rows.some((row) => row.projection.includes("promotion")));
});

test("the RFC claims both duplicated authored-expression schemas and no product operation", () => {
  assert.match(rfc, /pack-schema \| lane 0\.33/u);
  assert.match(rfc, /shape-entry-schema \| lane 0\.5/u);
  assert.match(rfc, /Absence means the legacy v1/u);
  assert.match(rfc, /No automatic migration is allowed/u);
  assert.match(rfc, /This RFC deliberately stops at exact source identity/u);
  assert.match(rfc, /Landing source helpers with zero product callers is an honest intermediate state, not completion/u);
});

test("all handoffs and downstream completion boundaries remain named", () => {
  for (const name of [
    "king-opposition-author-repair-2026-08-26.md",
    "backward-pawn-author-repair-2026-08-26.md",
    "square-denial-outpost-author-repair-2026-08-26.md",
    "pawn-file-identity-author-repair-2026-08-26.md",
    "line-evidence-author-repair-2026-08-26.md",
    "file-activity-author-repair-2026-08-26.md",
    "pawn-island-identity-author-repair-2026-08-26.md",
    "legacy-reading-successor-author-repair-2026-08-26.md",
    "style-foundation-atoms-author-repair-2026-08-26.md",
  ]) assert.ok(rfc.includes(name), name);
  for (const owner of [
    "evidence-value-authority",
    "shared-candidate-evidence-packet",
    "recorded-semantic-path",
    "semantic-validation-authority",
    "module-registration",
  ]) assert.ok(rfc.includes(owner), owner);
});

test("source facts cannot silently become judgement or personality", () => {
  for (const refusal of [
    "intention, plan, prophylaxis, prevention, force or inevitability",
    "player type, habit, strength, weakness, mastery or recommendation",
    "An optional LLM may paraphrase a later sealed module item",
  ]) assert.ok(rfc.includes(refusal), refusal);
  assert.match(rfc, /It cannot choose a projection, repair a missing operand/u);
});
