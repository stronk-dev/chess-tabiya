import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const rfc = read("rfc/live-sources.md");
const normative = rfc.split("\n## Fresh independent buildability return", 1)[0];
const criteria = rfc.match(/## Acceptance criteria[\s\S]*?### 7\./u)?.[0] ?? "";
const registerRfc = read("rfc/import-source-protocol-register.md");
const additions = JSON.parse(read("planning/import-source-protocol-register/catalogue-additions.v1.json"));
const index = read("rfc/README.md");
const fixture = read("tools/d947-broadcast-roundtrip-harness/fixtures/finished-round-QxNfeqHA.pgn");

test("D2277 uses current observed-finished authority on both sides of the PGN read", () => {
  assert.match(normative, /finishedAt/u);
  assert.match(normative, /observation A[\s\S]*?roundPgnDigest[\s\S]*?observation B/u);
  assert.match(normative, /Unknown completion,[\s\S]*?ongoing:true[\s\S]*?refuses before `importGame`/u);
  assert.match(normative, /does not mean[\s\S]*?atomic or can never be reset/u);
  assert.doesNotMatch(normative, /ongoing board imports as a\s+partial game/u);
});

test("D2278 has one absent registered protocol and one exact first-lane claim", () => {
  assert.match(rfc, /import-source-protocol \| first lane 1 \| whole projection/u);
  assert.match(registerRfc, /import-source-protocol \| sequential\/canonical_resource@1\/absent/u);
  assert.equal([...registerRfc.matchAll(/^## Discharges$/gmu)].length, 1);
  assert.deepEqual(additions, {
    schemaVersion: 1,
    resources: [{
      id: "import-source-protocol",
      lifecycle: "sequential",
      projection: {
        adapter: "canonical_resource@1",
        rootSelector: "packages/runtime/src/import-source-protocol.ts#export:IMPORT_SOURCE_PROTOCOL_RESOURCE",
      },
      claimMode: "whole_projection",
      introducedBy: "import-source-protocol-register.md",
      introduction: "absent",
    }],
  });
  assert.match(index, /`import-source-protocol-register\.md`[\s\S]*?introduces absent `import-source-protocol`/u);
});

test("D2279 publishes stable choice identity, digest and stale retry", () => {
  assert.match(normative, /interface BroadcastBoardChoiceRequired/u);
  assert.match(normative, /roundId:[\s\S]*?observationDigest:[\s\S]*?gameId:/u);
  assert.match(normative, /returns HTTP 409\s+`BROADCAST_SELECTION_STALE`/u);
  assert.match(normative, /Player names and round order are display metadata only/u);
});

test("D2280 assigns framing to chessops and names every adversarial control", () => {
  assert.match(normative, /`chessops\/pgn\.parsePgn` as the\s+sole \*\*framing\*\* authority/u);
  for (const phrase of ["reordered/missing `Event`", "literal `[Event ...]` text", "CRLF", "header-only game"]) {
    assert.ok(normative.includes(phrase), `missing framing control: ${phrase}`);
  }
  assert.match(normative, /adjacent `\*`\s+games/u);
  assert.match(normative, /never\s+splits with a regex/u);
});

test("D2281 publishes the exact selected-game clock vector and lossless ambiguity", () => {
  const games = fixture.split(/(?=^\[Event\s)/gmu).filter((part) => /^\[Event\s/mu.test(part));
  const vector = games.map((game) => [...game.matchAll(/\[%clk\s+([^\]]+)\]/gu)].length);
  assert.deepEqual(vector, [134, 46, 60, 144, 210, 88, 65, 80, 75, 0]);
  assert.equal(vector.reduce((sum, value) => sum + value, 0), 902);
  assert.match(normative, /interface BroadcastClockToken[\s\S]*?gameId:[\s\S]*?ply:[\s\S]*?occurrence:[\s\S]*?raw:/u);
  assert.match(normative, /duplicate\s+and malformed clock-like annotations remain distinct raw rows/u);
});

test("D2282 defines streamed limits, typed refusal, abort and boundaries", () => {
  for (const value of ["2 MiB", "8 MiB", "128", "64 KiB", "32 KiB"]) assert.ok(normative.includes(value));
  assert.match(normative, /counts bytes before concatenation and aborts on `limit \+ 1`/u);
  assert.match(normative, /BROADCAST_SOURCE_TOO_LARGE/u);
  assert.match(normative, /exactly-at-limit acceptance, limit\+1 refusal, chunk\s+crossing/u);
});

test("D2283 declares the real blocked predecessors instead of accepted returned RFCs", () => {
  assert.match(normative, /migration predecessor[\s\S]*?accepted and implemented `campaign-catalogue-progression\.md`/u);
  assert.match(normative, /Returned\s+`longitudinal-store\.md`, `intent-presets\.md`, `recorded-clocks\.md`, `variants\.md`[\s\S]*?not/u);
  assert.match(index, /`live-sources\.md`[\s\S]*?first author repair completed 2026-09-06/u);
});

test("D2284 fails closed on every non-explicit-standard setup", () => {
  assert.match(normative, /exactly one `\[Variant "Standard"\]`/u);
  assert.match(normative, /must carry neither `SetUp`\s+nor `FEN`/u);
  for (const value of ["Missing Variant", "From Position", "Chess960", "Same-FEN/different-rules", "missing-FEN Chess960"]) {
    assert.ok(normative.includes(value), `missing rules refusal: ${value}`);
  }
});

test("D2285 makes the real browser journey part of the same delivery unit", () => {
  assert.match(normative, /Phase A is one vertical delivery unit, not a backend union/u);
  assert.match(normative, /URL → board choices → perspective → disclosure → submit/u);
  assert.match(normative, /360×680/u);
  assert.match(normative, /through the real REST client—not a component stub/u);
  assert.match(criteria, /Real REST\/browser journey/u);
  assert.match(criteria, /Recovery\/accessibility/u);
});

test("the repaired acceptance set is complete and still requires a fresh review", () => {
  assert.match(rfc, /Unit: able-to-fail criteria; total: 18/u);
  assert.equal([...criteria.matchAll(/^\d+\./gmu)].length, 18);
  assert.match(rfc, /another genuinely fresh independent review is required/u);
  assert.match(rfc, /No production,[\s\S]*?implementation is authorized/u);
});

test("the finished receipt is durable structured authority, not licence-note prose", () => {
  assert.match(rfc, /source_receipt_json retains the typed broadcast receipt/u);
  assert.match(normative, /ImportedGameRecord\.sourceReceipt/u);
  assert.match(normative, /never flattened\s+into the human-readable licence note/u);
  assert.match(normative, /CHECK requires a receipt\s+exactly when `source_kind = 'lichess_broadcast'`/u);
  assert.match(criteria, /Account export\/import\s+round-trips the typed receipt/u);
});
