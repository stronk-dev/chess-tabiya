import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const roster = read("rfc/bot-roster.md");
const register = read("rfc/README.md");
const calibration = JSON.parse(read("tools/d2236-bot-calibration-verdict-contract/manifest.json"));
const dispositions = JSON.parse(read("tools/d2234-bot-roster-author-repair/personality-dispositions.json"));

test("D2234 separates move policy from presentation identity in both mutation directions", () => {
  assert.match(roster, /behaviorDigest = sha256/u);
  assert.match(roster, /profileDigest  = sha256/u);
  assert.match(roster, /avatar-only mutation must change\s+`profileDigest` and preserve `behaviorDigest`/u);
  assert.match(roster, /policy-layer mutation must change both/u);
  assert.doesNotMatch(roster, /changing any policy or identity asset invalidates the receipt/u);
});

test("D2235 derives the only experiment population from the literal manifest", () => {
  const arms = calibration.experiment.arms;
  assert.equal(arms.length, 17);
  assert.equal(arms.reduce((sum, arm) => sum + arm.games, 0), 13_200);
  assert.match(roster, /manifest derives \*\*17 arms and 13,200 games\*\*/u);
  assert.match(roster, /Runner, progress, checkpoint and result receipt must consume the manifest/u);
});

test("D2236 exposes separate strength, distribution and band-identity verdicts", () => {
  for (const axis of ["strength", "distribution", "bandIdentity"]) {
    assert.ok(Object.hasOwn(calibration.verdicts, axis));
  }
  assert.match(roster, /Only `calibrated_relative \+ human_reference_equivalent \+ supported` permits a \*\*human-like\*\* label/u);
  assert.match(roster, /Holm–Bonferroni/u);
  assert.match(roster, /24,000 CC0 Lichess blitz decisions/u);
});

test("D2237 gives every candidate mechanism one closed disposition and source", () => {
  assert.equal(dispositions.schema, "tabiya.rfc.bot-roster.personality-dispositions.v1");
  const ids = dispositions.mechanisms.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 20, "the matrix must cover the measured and proposed mechanism breadth");
  const allowed = new Set([
    "measured_pass",
    "refused_exact_transform",
    "mechanism_pass_personality_unproven",
    "research_required",
    "population_blocked",
  ]);
  for (const row of dispositions.mechanisms) {
    assert.ok(allowed.has(row.disposition), `${row.id} has an unknown disposition`);
    assert.ok(row.source, `${row.id} has no evidence/debt source`);
    const file = row.source.split("#", 1)[0];
    assert.ok(existsSync(new URL(file, root)), `${row.id} source does not exist: ${file}`);
    if (row.disposition !== "measured_pass" && row.disposition !== "mechanism_pass_personality_unproven") {
      assert.equal(row.profilePath, null, `${row.id} must not have a profile path`);
    }
  }
});

test("the 4x3 population floor cannot masquerade as twelve behavioral personalities", () => {
  assert.deepEqual(dispositions.launchFloor.bands, [1000, 1400, 1800, 2200]);
  assert.deepEqual(dispositions.launchFloor.families, ["human-baseline", "guarded-human", "pawn-forward"]);
  assert.match(dispositions.launchFloor.claim, /not twelve behavioral personalities/u);
  assert.match(roster, /required \*\*4×3 launch floor\*\*/u);
  assert.doesNotMatch(roster, /Twelve is the 1\.0 roster/u);
  assert.match(roster, /Full bot depth additionally requires the registered route\/phase\/clock\/endgame paths/u);
});

test("the author repair keeps the returned dependency and implementation fence visible", () => {
  assert.match(roster, /still dependency-blocked on \[\[D2233\]\]/u);
  assert.match(roster, /BOT_POLICY_PROFILES` remains correctly\s+empty/u);
  assert.match(roster, /no implementation or calibration is authorized/u);
  assert.match(register, /bot-roster\.md.*D2233/u);
});
