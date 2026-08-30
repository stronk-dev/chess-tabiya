import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/live-following.md", "utf8");
const backlog = readFileSync("design/BACKLOG.md", "utf8");
const intent = readFileSync("rfc/intent-presets.md", "utf8");
const longitudinal = readFileSync("rfc/longitudinal-store.md", "utf8");
const importSource = readFileSync("apps/server/src/import-source.ts", "utf8");
const storage = readFileSync("apps/server/src/storage.ts", "utf8");
const rest = readFileSync("apps/server/src/rest.ts", "utf8");
const liveResearch = readFileSync("design/research/ux-live-and-social.md", "utf8");
const normative = rfc.split("\n## Changelog\n", 1)[0];
const original = normative.split("\n## Fresh independent buildability return", 1)[0];
const sourceSchema = original.match(/followed_sources\n  id[\s\S]*?followed_source_pushes\n/u)?.[0] ?? "";
const pushSchema = original.match(/followed_source_pushes\n  source_id[\s\S]*?Both tables/u)?.[0] ?? "";
const importedRecord = storage.match(/export interface ImportedGameRecord \{[\s\S]*?\n\}/u)?.[0] ?? "";

test("D2266 ruled questions and returned dependencies remain stale", () => {
  assert.match(backlog, /D1272[^\n]*ruled — Phase B unblocked/u);
  assert.match(normative, /ACCEPTANCE-BLOCKING — the B5 ruling/u);
  assert.match(normative, /blocked on the B5 ruling/u);
  assert.match(intent, /Status:\*\* draft — \*\*returned by second fresh independent/u);
  assert.match(longitudinal, /Status:\*\* draft — \*\*RETURNED by second fresh independent/u);
});

test("D2267 persisted source cannot represent its normative lifecycle", () => {
  assert.match(normative, /mark source contaminated/u);
  assert.match(normative, /connection loss[\s\S]{0,120}lock stays ON/u);
  assert.doesNotMatch(sourceSchema, /contaminated|connection_state|round_finished|reconciled|snapshot_digest/u);
});

test("D2268 push and cut records cannot compute supersession", () => {
  assert.match(normative, /read-time projection over\s*`followed_source_pushes`/u);
  assert.doesNotMatch(pushSchema, /divergence|snapshot_digest|previous_digest|run_id|cut/u);
  assert.doesNotMatch(importedRecord, /followedSource|followed_source|sourcePush|source_push/u);
});

test("D2269 release predicate re-locks after the terminal connection ends", () => {
  assert.match(normative, /only OFF cell is terminal ∧ finished ∧ connected/u);
  assert.match(normative, /follower connection lost \| \*\*ON\*\*/u);
  assert.match(original, /round end[\s\S]{0,220}\*\*only\*\* release trigger/u);
});

test("D2270 a cut has no durable liveness lookup", () => {
  assert.match(normative, /A cut is `importGame` with the source's current sanitized PGN, unchanged/u);
  assert.match(normative, /run-schema lane \| \*\*none/u);
  assert.doesNotMatch(importedRecord, /followedSource|followed_source|sourcePush|source_push/u);
});

test("D2271 the four-door census omits current evidence-bearing operations", () => {
  assert.match(original, /§3\.5 The four doors/u);
  for (const action of ["evidence", "analysis", "human-split", "corpus", "voice", "speech", "reasoning", "reasoning-review"]) {
    assert.equal(rest.includes(action), true, `missing current route action ${action}`);
  }
});

test("D2272 no production follower operation or update transport is specified", () => {
  assert.doesNotMatch(original, /FollowSourceRequest|FollowSourceResult|\/followed-sources|\/broadcast\/follow|EventSource|WebSocket/u);
  assert.doesNotMatch(importSource, /broadcast|followed source|stream\/broadcast\/round/u);
  assert.match(liveResearch, /discover broadcasts in-app|discovery is a list/u);
});

test("D2273 push admission has no digest, idempotency, or transaction", () => {
  assert.match(original, /onPush\(source, pgn\)/u);
  assert.doesNotMatch(pushSchema, /digest|idempot|command|transaction/u);
  assert.doesNotMatch(original, /BEGIN IMMEDIATE|atomic compare|push command id/u);
});

test("D2274 persisted sources have no ownership or account lifecycle", () => {
  assert.doesNotMatch(sourceSchema, /learner|owner|subscription|tenant/u);
  assert.doesNotMatch(original, /account export|backup\/restore|retention|source cache expir/u);
});

test("D2275 followed-source clocks are prose without a storage field", () => {
  assert.match(original, /clock\s+readings live on the \*\*followed source\*\*/u);
  assert.doesNotMatch(sourceSchema, /clock/u);
  assert.doesNotMatch(pushSchema, /clock/u);
});

test("D2276 variant admission and required revision measurement are unresolved", () => {
  assert.match(original, /Prefix revision — measure before implementing[\s\S]{0,180}Unmeasured/u);
  assert.doesNotMatch(sourceSchema, /rules|setup_family|variant/u);
  assert.doesNotMatch(original, /unsupported variant|rules \+ setupFamily/u);
  const instruments = readdirSync("tools").filter((name) => /live-follow.*revision|prefix-revision/u.test(name));
  assert.deepEqual(instruments, []);
});
