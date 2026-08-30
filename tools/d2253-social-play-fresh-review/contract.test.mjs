import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/social-play.md", "utf8");
const roadmap = readFileSync("planning/roadmap-to-done.md", "utf8");
const service = readFileSync("apps/server/src/service.ts", "utf8");
const progress = readFileSync("apps/server/src/progress.ts", "utf8");
const live = readFileSync("apps/server/src/live-session.ts", "utf8");
const liveTypes = readFileSync("apps/server/src/live-types.ts", "utf8");
const normative = rfc.split("\n## Changelog\n", 1)[0];

test("D2253 one run-side is reused for both learner projections", () => {
  assert.match(service, /moverSide===run\.start\.side\?"user":"system"/u);
  assert.match(progress, /node\.actor === "user"/u);
  assert.doesNotMatch(progress, /participantSide|seatedSide/u);
  assert.match(normative, /two-human play \*\*counts toward the return loop/u);
});

test("D2254 creation directly seats named learners", () => {
  assert.match(live, /resolve\(input\.matchPlayers\?\.white\)/u);
  assert.match(live, /matchPlayers=Object\.freeze/u);
  assert.match(normative, /written when a named learner takes the seat/u);
  assert.doesNotMatch(normative, /creation may reserve[^.]*but may not seat/u);
});

test("D2255 public preview omits the agreement", () => {
  assert.match(live, /return Object\.freeze\(\{title:session\.title,hostHandle:host\.handle\}\)/u);
  assert.match(normative, /terms_requested/u);
  assert.doesNotMatch(live, /publicJoin[\s\S]{0,700}terms/u);
});

test("D2256 draw agreement has no proposal protocol", () => {
  assert.match(normative, /one-sided draw is a proposal on the session journal/u);
  assert.doesNotMatch(liveTypes, /draw\.(?:offered|withdrawn|declined|accepted)/u);
  assert.doesNotMatch(normative, /POST [^\n`]*draw/u);
});

test("D2257 run and session terminal authorities are not coordinated", () => {
  assert.match(live, /close\(sessionId:string/u);
  assert.match(normative, /game\.resigned/u);
  assert.match(normative, /draw\.agreed/u);
  assert.doesNotMatch(normative, /terminal coordinator|atomically[^.]{0,220}session\.closed/u);
});

test("D2258 rematch is a required unresolved verb", () => {
  assert.match(roadmap, /finish\/rematch and reach Review/u);
  assert.match(normative, /Does a rematch chain become new legs, a new session, or a new run/u);
});

test("D2259 timed pause has no authoritative clock rule", () => {
  assert.match(normative, /clocked, rated/u);
  assert.match(normative, /pause/u);
  assert.doesNotMatch(normative, /pause[^.]{0,240}(?:ClockReading|clock reading|flag race)/u);
});

test("D2260 accepted terms use a free variant string", () => {
  assert.match(normative, /variant: string/u);
  const terms = normative.match(/terms\s+\{[\s\S]*?\n\}/u)?.[0] ?? "";
  assert.doesNotMatch(terms, /rules|setupFamily|startFen|startPosition/u);
});
