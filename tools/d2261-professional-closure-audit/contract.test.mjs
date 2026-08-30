import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync("apps/web/src/App.svelte", "utf8");
const router = readFileSync("apps/web/src/lib/router.ts", "utf8");
const creation = readFileSync("apps/web/src/lib/live-creation.ts", "utf8");
const live = readFileSync("apps/server/src/live-session.ts", "utf8");
const casting = readFileSync("rfc/casting.md", "utf8");
const backlog = readFileSync("design/BACKLOG.md", "utf8");
const sourcePopulation = [
  readFileSync("apps/server/src/live-session.ts", "utf8"),
  readFileSync("apps/server/src/service.ts", "utf8"),
  readFileSync("apps/web/src/App.svelte", "utf8"),
  readFileSync("packages/runtime/src/presets.ts", "utf8"),
].join("\n");

test("D2261 live-followed casting and ordinary stream rehearsal are distinct", () => {
  assert.match(casting, /A cast is therefore \*\*four shipped objects wired together\*\*, plus a guard/u);
  assert.match(casting, /Casting a run that is not a cut of a followed source \| out of scope/u);
  assert.match(creation, /label: "Stream a rehearsal"/u);
  assert.match(creation, /if \(workflow !== "native_match"\) return undefined/u);
});

test("D2262 the worker-facing board has no declared streamer privacy state", () => {
  assert.match(app, /chrome=\{route\.name !== "live-overlay" && route\.name !== "run"\}/u);
  assert.doesNotMatch(router, /streamer-(?:mode|privacy)|privacy-(?:mode|chrome)/u);
  assert.doesNotMatch(app, /streamer-(?:mode|privacy)|privacy-(?:mode|chrome)/u);
});

test("D2263 Review Submission loses its subject at the generic run route", () => {
  assert.match(app, /Review @\{member\.handle\}'s run<\/button>/u);
  assert.match(app, /routePath\(\{name:"run",runId:submission\.runId\}\)/u);
  assert.doesNotMatch(router, /review-submission|assignmentId|submissionId/u);
});

test("D2264 classroom teacher identity does not grant a bounded coach capability", () => {
  assert.match(live, /member\.memberRole !== "teacher"/u);
  assert.match(live, /#requiredControl\(sessionId:string,principal:Principal\)/u);
  assert.match(live, /mayControlSession\(role\)/u);
  assert.doesNotMatch(live, /coachCapability|coachGrant|sessionCoach/u);
});

test("D2265 upcoming classroom sessions expose no admission action or state", () => {
  const upcoming = app.match(/<h4>Upcoming sessions<\/h4>[\s\S]*?<\/ul>/u)?.[0] ?? "";
  assert.match(upcoming, /classroomDetail\.upcomingSessions/u);
  assert.match(upcoming, /item\.title/u);
  assert.doesNotMatch(upcoming, /button|href|navigate|invitation|admission|join/u);
});

test("D1472 casting has not absorbed the ruled delayed-vote contract", () => {
  assert.match(backlog, /D1291 ⚖️[\s\S]*OWNER-CONFIGURABLE DELAY/u);
  assert.match(casting, /\| D3 \| Whether a \*\*delayed\*\* vote/u);
  assert.match(casting, /\| OWNER \| `planning\/platform-alignment\/decision-queue\.md` \| \|/u);
  assert.doesNotMatch(casting, /delayPly|delayPlies|delaySeconds|voteCursor/u);
});

test("the source-liveness dependency is still prose-only in production roots", () => {
  assert.doesNotMatch(sourcePopulation, /sourceGameLive/u);
  assert.match(casting, /`sourceGameLive` has \*\*zero matches in the tree\*\*/u);
});
