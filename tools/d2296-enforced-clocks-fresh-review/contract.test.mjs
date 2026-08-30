import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const rfc = read("rfc/enforced-clocks.md");
const original = rfc.replace(
  /\n## Fresh independent buildability return[\s\S]*?\n## Acceptance criteria/u,
  "\n## Acceptance criteria",
);
const register = read("rfc/README.md");
const backlog = read("design/BACKLOG.md");
const runtimeTypes = read("packages/runtime/src/types.ts");
const outcome = read("packages/runtime/src/outcome.ts");
const storage = read("apps/server/src/storage.ts");
const service = read("apps/server/src/service.ts");
const webApp = read("apps/web/src/App.svelte");
const chessops = read("node_modules/.pnpm/chessops@0.15.1/node_modules/chessops/src/chess.ts");

test("D2296: the amended document still makes opposite timed-rating promises", () => {
  assert.match(original, /Timed games ARE rated/u);
  assert.match(original, /timed games are unrated in v1/u);
  assert.match(original, /R4 \| \*\*Rated timed games in v1\*\*/u);
  assert.match(original, /no v1 code\s+path\s+writes either/u);
  assert.match(original, /Creating a timed run with `rated: true` \*\*succeeds\*\*/u);
});

test("D2297: next-read expiry cannot autonomously close an abandoned game", () => {
  assert.match(original, /flagged\s+on the next authoritative read/u);
  assert.match(original, /removes the bias rather\s+than disclosing it/u);
  assert.doesNotMatch(original, /expiry (?:worker|sweeper)|deadline index|scheduled flag|durable deadline/iu);
});

test("D2298: flag fall has no deadline identity, command identity, or exact boundary", () => {
  const event = original.match(/export type ClockFlaggedEvent[\s\S]*?\n\}>;/u)?.[0] ?? "";
  assert.match(event, /remainingMs: 0/u);
  assert.doesNotMatch(event, /deadline|commandId|requestId|controlId|expectedSeq/u);
  assert.doesNotMatch(original, /now === deadline|at the deadline|compare-and-swap|BEGIN IMMEDIATE[\s\S]*clock/iu);
});

test("D2299: clock.flagged is not joined to the current terminal consumer set", () => {
  const consumers = [runtimeTypes, outcome, service, webApp];
  assert.ok(consumers.every((source) => !source.includes("clock.flagged")));
  assert.ok(consumers.filter((source) => source.includes("outcome.reached")).length >= 3);
  assert.doesNotMatch(original, /shared terminal predicate|terminal consumer census|set-equal[\s\S]*terminal/iu);
});

test("D2300: a shared match terminal event uses learner-relative RunOutcome", () => {
  assert.match(original, /readonly result: RunOutcome/u);
  assert.match(outcome, /learnerSide: "white" \| "black"/u);
  assert.match(outcome, /return position\.turn === learnerSide \? "loss" : "win"/u);
  assert.match(storage, /white_learner_id/u);
  assert.match(storage, /black_learner_id/u);
  assert.doesNotMatch(original, /winnerColor|winner: "white" \| "black"|derive.*seat/iu);
});

test("D2301: the FIDE-result rule names a nonexistent helper and tests only trivial arms", () => {
  assert.match(original, /opponentHasSufficientMatingMaterial/u);
  assert.doesNotMatch(chessops, /opponentHasSufficientMatingMaterial/u);
  assert.match(chessops, /hasInsufficientMaterial\(color: Color\)/u);
  assert.match(original, /queen on the board/u);
  assert.match(original, /lone king/u);
  assert.doesNotMatch(original, /possible series of legal moves|same-colou?r bishops|two knights|blocked pawn/iu);
});

test("D2302: native pause clears the only pause timestamp without preserving clock basis", () => {
  assert.match(original, /pause protocol already exists and is reused unchanged/u);
  assert.match(storage, /UPDATE match_states SET paused_at=NULL,pause_proposed_by=NULL/u);
  assert.doesNotMatch(storage, /paused_duration|clock_deadline|clock_remaining|clock_state/u);
  assert.doesNotMatch(original, /session_journal[\s\S]*clock|pause.*ClockReading|ClockPausedEvent/iu);
});

test("D2303: the clock state machine omits root state, both-side projection, and increment order", () => {
  assert.match(original, /\{ initialMs: number; incrementMs: number \}/u);
  assert.doesNotMatch(original, /whiteRemainingMs|blackRemainingMs|initial ClockReading|root clock|increment (?:before|after)/iu);
  assert.doesNotMatch(original, /deadline =|remainingMs =|elapsedMs =/u);
});

test("D2304: the ruled full bot arm is explicitly deferred", () => {
  assert.match(backlog, /\| D1041 [^\n]*bots need move-time models/u);
  assert.match(original, /The learner's clock runs; the bot's does not/u);
  assert.match(original, /two-sided bot clock defers/iu);
});

test("D2305: dependency metadata describes returned predecessors as build inputs", () => {
  assert.match(original, /Depends on:\*\* `rfc\/recorded-clocks\.md` \(draft/u);
  assert.match(register, /`recorded-clocks\.md` \| \*\*draft — RETURNED/u);
  assert.match(register, /`campaign-core\.md` \| \*\*draft — RETURNED/u);
  assert.match(register, /`bot-policy\.md` \| \*\*draft — RETURNED/u);
});

test("D2306: product-result semantics remain open while the RFC says ready for review", () => {
  assert.match(rfc, /RETURNED by fresh independent buildability review/u);
  assert.match(original, /Does a timed drill ever \*fail\* the learner/u);
  assert.match(original, /Does the solo pause protocol[\s\S]*learner-facing control/u);
  assert.match(original, /Does flagging lose a campaign encounter/u);
});

test("D2307: the learner journey is reduced to paint containment", () => {
  assert.match(original, /a tick\s+produces no layout write outside the readout's fixed box/u);
  assert.doesNotMatch(original, /clock operation|clock route|clock wire|client clock controller|browser journey|screen-reader announcement/iu);
  assert.doesNotMatch(webApp, /TimedControl|remainingMs|clock\.flagged/u);
});
