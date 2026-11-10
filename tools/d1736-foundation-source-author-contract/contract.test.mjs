import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const plan = JSON.parse(readFileSync("planning/foundation-source-identity/projection-plan.json", "utf8"));
const rfc = readFileSync("rfc/foundation-source-identity.md", "utf8");

const key = (row) => row.projection;

test("group/file before-empty authority is a complete position snapshot, not absent positive rows", () => {
  const section = rfc.split("### 3.0 Reading cardinality and empty authority")[1].split("### 3.1")[0];
  const rows = section.split("\n").filter(line => /^\| (?:rules|derived)\./u.test(line));
  assert.equal(rows.length, 10);
  for (const projection of ["derived.structural.reading.pawn_file_group@1", "derived.activity.reading.file_state@1"]) {
    const row = plan.rows.find(value => value.projection === projection);
    assert.equal(row.resultCardinality, "one_complete_position_snapshot");
    assert.deepEqual(row.sourceDependencies, [{ kind: "projection", ref: "rules.structural.reading.pawn_connectivity@1" }]);
    assert.ok(rows.some(row => row.startsWith(`| ${projection} | one complete snapshot`)));
  }
  assert.ok(rfc.includes("emits only when a file's four-way state enum changes"));
  assert.ok(rfc.includes("Do not suppress a stationary sibling"));
  assert.ok(rfc.includes("identical\nfile partitions emit nothing"));
});

test("quiet backward advance uses complete original landing authority before empty replies", () => {
  const row = plan.rows.find(value => value.projection === "derived.pawn.consequence.backward_pawn_legal_advance@1");
  assert.deepEqual(row.sourceDependencies.map(value => value.ref).sort(), ["rules.exchange.reading.landing_captures@1", "rules.structural.reading.backward_pawn@3"]);
  const section = rfc.split("#### 3.2a Complete post-advance capture authority")[1].split("### 3.3")[0];
  for (const phrase of ["independently accepted", "original invocations", "precede an empty result", "every legal capture by an opposing pawn", "Zero such", "pinned"]) assert.ok(section.includes(phrase), phrase);
});

test("candidate role uses the complete legal domain and preserves rules-plane receipts", () => {
  const row = plan.rows.find(value => value.projection === "rules.mobility.reading.candidate_role@1");
  assert.deepEqual(row.sourceDependencies, [{ kind: "projection", ref: "rules.mobility.reading.legal_moves@1" }]);
  const section = rfc.split("### 3.8a Complete candidate-role domain")[1].split("## 4.")[0];
  for (const phrase of ["independently accepted", "rules-plane", "dependsOn", "actual original invocation", "canonical UCI membership", "promotion roles", "king landing square", "no recorded path ply"]) assert.ok(section.includes(phrase), phrase);
});

test("configuration sources are complete ten-snapshot members with exact centre authority", () => {
  for (const id of ["fianchetto_setup", "fianchetto_knight_screen"]) {
    const row = plan.rows.find(value => value.projection === `rules.structural.reading.${id}@1`);
    assert.equal(row.resultCardinality, "one_complete_position_snapshot");
    assert.deepEqual(row.sourceDependencies, id === "fianchetto_setup" ? [] : [{ kind: "projection", ref: "rules.structural.reading.fianchetto_setup@1" }]);
  }
  const section = rfc.split("### 3.8b Complete fianchetto snapshots")[1].split("## 4.")[0];
  for (const text of ["independently accepted", "| white | queenside | b2 | b3 | c3 |", "| white | kingside | g2 | g3 | f3 |", "| black | queenside | b7 | b6 | c6 |", "| black | kingside | g7 | g6 | f6 |", "available setups:[]", "genuine original candidate_role", "source role is pawn", "actual destination"]) assert.ok(section.includes(text), text);
});

test("replacement rows stay in their exact four-column table, separate from snapshot cardinality", () => {
  const section = rfc.split("### 2.1 Exact direct convention closure")[1].split("## 3. Exact projection image")[0];
  const rows = section.split("\n").filter(line => /^\| rules\./u.test(line)).map(line => line.split("|").slice(1, -1).map(cell => cell.trim()));
  assert.deepEqual(rows, [
    ["rules.structural.event.king_opposition@2", "king-opposition-blocker-blind@1", "king-opposition-unobstructed@1", "rules.structural.reading.king_opposition@3"],
    ["rules.structural.event.backward_pawn@2", "backward-pawn-legacy@1", "backward-pawn@1", "rules.structural.reading.backward_pawn@3"],
    ["rules.structural.predicate.king_opposition@2", "king-opposition-blocker-blind@1", "king-opposition-unobstructed@1", "rules.structural.reading.king_opposition@3"],
    ["rules.structural.predicate.backward_pawn@2", "backward-pawn-legacy@1", "backward-pawn@1", "rules.structural.reading.backward_pawn@3"],
    ["rules.structural.predicate.outpost@2", "maximal_pawn_reach@1", "outpost-candidate@1", "derived.structural.reading.outpost_candidate@1"],
  ]);
});

test("the source wave is one closed 23-projection image", () => {
  assert.equal(plan.schemaVersion, 2);
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
    { candidate: 4, edge: 7, frozen_prefix: 1, position: 10, recorded_decision: 1 },
  );
});

test("every projection has typed dependencies, conventions, owner, context and lifecycle state", () => {
  const owners = new Set(["shared-candidate-evidence-packet", "recorded-semantic-path", "recorded-clocks"]);
  for (const row of plan.rows) {
    assert.match(row.projection, /^(?:derived|rules|run)\.[a-z0-9_.]+@[1-9][0-9]*$/u, row.projection);
    assert.equal("authority" in row, false, row.projection);
    assert.ok(Array.isArray(row.sourceDependencies), row.projection);
    assert.ok(Array.isArray(row.conventions), row.projection);
    for (const dependency of row.sourceDependencies) {
      assert.ok(dependency.kind === "projection" || dependency.kind === "rfc", row.projection);
      assert.match(dependency.ref, dependency.kind === "projection"
        ? /^(?:derived|rules|run)\.[a-z0-9_.]+@[1-9][0-9]*$/u
        : /^[a-z0-9-]+$/u, row.projection);
    }
    for (const convention of row.conventions) assert.match(convention, /^[a-z0-9-]+@[1-9][0-9]*$/u, row.projection);
    assert.ok(owners.has(row.executionOwner), row.projection);
    assert.ok(row.contextRequirement === "none" || row.contextRequirement === "actor_decision", row.projection);
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

test("both duplicated authored-expression schema lanes are installed and have the same grammar", () => {
  const pack = JSON.parse(readFileSync("schemas/drill_pack.schema.json", "utf8"));
  const shape = JSON.parse(readFileSync("schemas/shape_entry.schema.json", "utf8"));
  assert.match(pack.$id, /0\.33/u);
  assert.match(shape.$id, /0\.4/u);
  for (const name of ["structuralFeature", "fileTemplateFeature", "squareTemplateFeature", "structuralExpression"]) assert.deepEqual(pack.$defs[name], shape.$defs[name]);
  const register = readFileSync("rfc/README.md", "utf8");
  assert.match(register, /\| 0\.33 \| `foundation-source-identity\.md` \| in-tree syntax/u);
  assert.match(register, /\| 0\.4 \| `foundation-source-identity\.md` \| in-tree syntax/u);
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
