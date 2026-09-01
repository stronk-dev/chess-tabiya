import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const candidate = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");
const values = readFileSync("rfc/evidence-value-authority.md", "utf8");
const collectors = readFileSync("rfc/semantic-collectors.md", "utf8");
const validation = readFileSync("rfc/semantic-validation-authority.md", "utf8");

test("D2468 correction leaves one exact-legal route across all three RFCs", () => {
  assert.match(candidate, /createRulesMobilityReadingLegalMovesV1Evidence\(fen: string\)/u);
  assert.match(values, /createRulesMobilityReadingLegalMovesV1Evidence/u);
  assert.match(collectors, /createRulesMobilityReadingLegalMovesV1Evidence/u);
  assert.match(values, /neither document may introduce a compatibility alias/u);
  assert.match(candidate, /caught \[\[D2468\]\] before implementation/u);
});

test("D2469 outside-domain member omits a legal map that precedence requires", () => {
  assert.match(collectors, /3\. geometry \+ `rules\.endgame\.tablebase_domain@1`/u);
  assert.match(collectors, /absent exact legal map returns\s+`input_abstained`/u);
  assert.match(collectors, /precedence is `no_opposing_passed_clear_paths`, then `input_abstained`, then\s+source resolution, local domain/u);
});

test("D2470 result algebra has no closed request or collector signature", () => {
  assert.match(collectors, /type PromotionRaceTablebaseResult =/u);
  assert.doesNotMatch(collectors, /(?:interface|type) PromotionRaceTablebaseRequest\b/u);
  assert.doesNotMatch(collectors, /declare function collectPromotionRaceTablebase\s*\(/u);
  assert.match(collectors, /A recorded item\s+takes member 1\. Otherwise the operation calls the provider scheduler/u);
});

test("D2471 invalid authority input is laundered into abstention", () => {
  assert.match(collectors, /Only missing,\s+invalid or unavailable upstream evidence returns `input_abstained`/u);
  assert.match(collectors, /missing\/invalid\/unavailable upstream evidence or an absent exact legal map returns\s+`input_abstained`/u);
  assert.match(collectors, /all fail before geometry calculation/u);
});

test("D2472 completed no-witness is encoded as unavailable", () => {
  assert.match(collectors, /kind: "unavailable";\s+reason: "no_opposing_passed_clear_paths"/u);
  assert.match(validation, /`omits` passes only on `completed`/u);
  assert.match(validation, /valid legal input and target count = 0/u);
  assert.match(validation, /`abstains` passes only when\s+the operation returns `unavailable`/u);
});
