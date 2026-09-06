import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const REVIEW_COMMIT = "ab246e75";
const atReview = (path) => execFileSync("git", ["show", `${REVIEW_COMMIT}:${path}`], {
  encoding: "utf8",
  maxBuffer: 4 * 1024 * 1024,
});
const rfc = atReview("rfc/live-sources.md");
const service = atReview("apps/server/src/service.ts");
const rest = atReview("apps/server/src/rest.ts");
const serverSource = atReview("apps/server/src/import-source.ts");
const webApi = atReview("apps/web/src/lib/api.ts");
const app = atReview("apps/web/src/App.svelte");
const harness = atReview("tools/d947-broadcast-roundtrip-harness/roundtrip.test.ts");
const backlog = atReview("design/BACKLOG.md");
const intent = atReview("rfc/intent-presets.md");
const longitudinal = atReview("rfc/longitudinal-store.md");
const campaign = atReview("rfc/campaign-core.md");
const original = rfc.split("\n## Fresh independent buildability return", 1)[0];
const criteria = rfc.match(/## Acceptance criteria[\s\S]*?### 7\./u)?.[0] ?? "";

test("D2277 finished-only scope admits ongoing boards into automatic evidence", () => {
  assert.match(original, /Phase A imports \*\*finished\s+boards from finished rounds\*\*/u);
  assert.match(original, /ongoing board imports as a\s+partial game/u);
  assert.match(service, /const jobs = this\.#ensureStoryEvidence\(run, run\.branches\[0\]!\.id\)\.enqueued/u);
  assert.doesNotMatch(original, /verifyRoundFinished|SOURCE_GAME_LIVE|refuse[^.]{0,120}ongoing round/u);
});

test("D2278 source request and durable kinds are duplicated across server and web", () => {
  assert.match(original, /server-code union member, not a versioned register entry/u);
  assert.match(serverSource, /export type ImportSource/u);
  assert.match(webApi, /export interface ImportGameRequest/u);
  assert.match(webApi, /sourceKind: "pgn_paste" \| "lichess_url"/u);
  assert.match(rest, /source\.kind must be pgn or lichess/u);
});

test("D2279 board choice has no typed stable request-result protocol", () => {
  assert.match(original, /board\?: string/u);
  assert.match(original, /BROADCAST_BOARD_CHOICE_REQUIRED/u);
  assert.doesNotMatch(original, /interface BroadcastBoard|type BroadcastBoard|snapshotDigest|choiceDigest|HTTP 409|HTTP 422/u);
});

test("D2280 splitter evidence has no adversarial framing controls", () => {
  assert.match(harness, /split\(\/\\n\(\?=\\\[Event /u);
  assert.doesNotMatch(original, /reordered Event|missing Event|Event tag inside|CRLF|adversarial split/u);
});

test("D2281 clock criterion calls the sanitizer at whole-round grain", () => {
  assert.match(criteria, /running\s+`sanitizeBroadcastPgn` over the committed finished-round fixture/u);
  assert.match(criteria, /array of \*\*exactly 902 entries\*\*/u);
  assert.match(original, /selected, sanitized game/u);
  assert.doesNotMatch(criteria, /per-game clock arrays|sum[^.]{0,80}902/u);
});

test("D2282 fetched round bytes have no upstream resource budget", () => {
  assert.match(original, /full\s+annotated round is 220 KB/u);
  assert.match(serverSource, /await response\.text\(\)/u);
  assert.doesNotMatch(original, /maximum round bytes|maxRoundBytes|maximum games|SOURCE_TOO_LARGE/u);
});

test("D2283 accepted dependency and migration states are stale", () => {
  assert.match(original, /`longitudinal-store` \(accepted/u);
  assert.match(intent, /Status:\*\* draft — \*\*returned/u);
  assert.match(longitudinal, /Status:\*\* draft — \*\*RETURNED/u);
  assert.match(campaign, /Status:\*\* draft — \*\*RETURNED/u);
  assert.match(original, /position behind campaign-core/u);
});

test("D2284 only Standard was exercised and known Chess960 risk is unowned", () => {
  assert.match(backlog, /D1033[^\n]*Chess960 import is refused/u);
  assert.match(harness, /fixtures[^\n]*Lichess broadcast|D414/u);
  assert.doesNotMatch(original, /rules \+ setupFamily|unsupported non-Standard|Chess960 header without/u);
});

test("D2285 current browser supports individual/verbatim import only", () => {
  assert.match(app, /Lichess game URL/u);
  assert.match(app, /original PGN verbatim/u);
  assert.doesNotMatch(app, /broadcast board|Choose board|lichess_broadcast/u);
  assert.doesNotMatch(webApi, /kind: "broadcast"/u);
});
