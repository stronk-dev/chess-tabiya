import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/campaign-catalogue-progression.md", "utf8");
const readme = readFileSync("rfc/README.md", "utf8");
const backlog = readFileSync("design/BACKLOG.md", "utf8");
const has = (...parts) => parts.forEach((part) => assert.ok(rfc.includes(part), `missing ${part}`));

test("catalogue is exposure rather than learner judgement", () => {
  has("exact exposure receipt", "It does not measure the learner", "no learner skill, mastery");
  assert.match(backlog, /D1171/);
});

test("two durable tables retain exact occurrence and projection state", () => {
  has("learner_catalogue_sightings(", "learner_catalogue_projection_state(", "projection_payload_digest", "catalogue_snapshot_digest");
});

test("shape and structure require exact evidence while concepts abstain", () => {
  has("theory.shapes.firing@1", "D1727", "no_position_scoped_occurrence_authority", "pack-wide concept reference");
  assert.match(backlog, /D2371/);
});

test("migration chain stays contiguous", () => {
  has("position behind campaign-core");
  assert.match(readme, /position behind campaign-core[^\n]*`campaign-catalogue-progression\.md`/);
  assert.match(readme, /position behind campaign-catalogue-progression[^\n]*`live-sources\.md`/);
});

test("server owns complete closed API and current rumor query is refused", () => {
  has("CampaignCatalogueService", "GET /campaign-runs/:id/catalogue", "shapeRecommendations", "second collection authority");
});

test("pack marks and act diff do not gate or grade", () => {
  has("New here:", "same content, order, emphasis and motion", "never disables the card", "does not measure the learner");
});

test("lifecycle and portability preserve evidence", () => {
  has("Deleting a source run cascades only its", "Backup/export/restore", "renewable lease", "set equality");
});

test("full journeys and CI are acceptance work", () => {
  has("home→Campaign→map→pack mark→encounter→act diff→exact Review link", "Phone, tablet, desktop", "same GitHub gates");
});
