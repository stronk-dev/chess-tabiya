// DISPOSABLE fresh independent review harness — D2238-D2242. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/opponent-experience.md");
const base = rfc.slice(0, rfc.indexOf("## Fresh independent return"));
const composition = read("rfc/play-composition.md");

test("D2238: both declared bot dependencies are returned", () => {
  assert.match(rfc, /Depends on:[\s\S]*`bot-policy\.md` and `bot-roster\.md`/u);
  assert.match(read("rfc/bot-policy.md").slice(0, 600), /RETURNED/u);
  assert.match(read("rfc/bot-roster.md").slice(0, 600), /RETURNED/u);
});

test("D2239: the new bar and phone sheet contradict play composition", () => {
  assert.match(base, /bar immediately above the board frame/u);
  assert.match(base, /details sheet overlays only[\s\S]*never covers\/resizes the board/u);
  assert.match(composition, /Nothing above the board/u);
  assert.match(composition, /Expanding the sheet is an \*\*overlay\*\*[\s\S]*paints over the[\s\S]*board's lower edge/u);
});

test("D2240: historical fallback stores no renderable identity snapshot", () => {
  assert.match(base, /Resume resolves the exact stored profile id\/version\/digest/u);
  assert.match(base, /run remains readable and names the unavailable stored\s+identity/u);
  assert.doesNotMatch(base, /presentationSnapshot|historicalProfile|profileHistory|storedName|storedAvatar/u);
});

test("D2241: availability exposes a free reason string", () => {
  assert.match(base, /available: boolean;\s*unavailableReason: string \| null;/u);
  assert.doesNotMatch(base, /type OpponentPresentationState|interface OpponentPresentationState|retryable: boolean|action: "retry"/u);
});

test("D2242: recorded analytics have no sink or lifecycle", () => {
  assert.match(base, /records product-operation facts only/u);
  assert.match(base, /catalog viewed, profile selected, start/u);
  assert.doesNotMatch(base, /retention|ON DELETE|export inventory|telemetry sink|ephemeral structured log|consent/u);
});
