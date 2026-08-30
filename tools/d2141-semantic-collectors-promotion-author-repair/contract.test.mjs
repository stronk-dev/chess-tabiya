// DISPOSABLE author contract for the D2141-D2143 promotion amendment repair.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/semantic-collectors.md", "utf8");

const promotion = rfc.slice(
  rfc.indexOf("#### 3.7 Promotion races"),
  rfc.indexOf("### §4 — Adjudication"),
);

test("D2141: geometry requires and retains the exact sealed pawn authority", () => {
  assert.match(promotion, /derivePromotionRaceGeometry\(contacts\)/u);
  assert.match(promotion, /assertPawnContactsEvidence\(value\)/u);
  assert.match(promotion, /type PawnContactsEvidence = DeclaredEvidence<PawnContactsReading>/u);
  assert.match(promotion, /type PromotionRaceGeometryEvidence = DeclaredEvidence<PromotionRaceGeometry>/u);
  assert.match(promotion, /input: PawnContactsEvidence/u);
  assert.match(promotion, /output: PromotionRaceGeometryEvidence/u);
  for (const negative of ["unsealed lookalike", "wrong producer/id/version", "mutations of `passed`, blocker"]) {
    assert.match(promotion, new RegExp(negative.replaceAll("/", "\\/"), "u"));
  }
});

test("D2142: recorded and live normalization retain whole original evidence items", () => {
  assert.match(promotion, /type PromotionRaceTablebaseSource =/u);
  assert.match(promotion, /type RecordedTablebaseEvidence = DeclaredEvidence<RecordedTablebaseReading>/u);
  assert.match(promotion, /kind: "recorded";[\s\S]*evidence: RecordedTablebaseEvidence/u);
  assert.match(promotion, /kind: "live";[\s\S]*ProviderEvidenceDelivery<LiveSyzygyPosition, "syzygy\.position@1">/u);
  assert.match(promotion, /evidence\.payload\.values/u);
  assert.match(promotion, /evidence\.payload\.payload\.position/u);
  assert.match(promotion, /assertProviderDelivery\("syzygy\.position@1", evidence\.payload\)/u);
  assert.match(promotion, /Neither[\s\S]*synthesizes `sourceId`, retrieval time, occurrence or acquisition fields/u);
  assert.match(promotion, /Crossed source kind, producer, occurrence, retrieval, acquisition,[\s\S]*category or DTZ substitutions fail/u);
});

test("D2143: outside-domain is a third literal grounded path in a total result algebra", () => {
  const members = promotion.slice(
    promotion.indexOf("1. geometry"),
    promotion.indexOf("Geometry, the legal map"),
  );
  assert.equal((members.match(/^\s*[123]\. /gmu) ?? []).length, 3);
  assert.match(members, /3\. geometry \+ `rules\.endgame\.tablebase_domain@1`/u);
  assert.match(promotion, /type PromotionRaceTablebaseResult =/u);
  for (const reason of ["outside_tablebase_domain", "provider_unavailable", "input_abstained"]) {
    assert.match(promotion, new RegExp(`reason: "${reason}"`, "u"));
  }
  assert.match(promotion, /source: DeclaredEvidence<ProviderLocalDomainResult<"syzygy\.position@1">>/u);
  assert.match(promotion, /collectPromotionRaceTablebase/u);
  assert.match(promotion, /provider scheduler itself for the exact geometry FEN/u);
  assert.match(promotion, /requires its branded digest to equal the local-domain envelope/u);
  assert.match(promotion, /Callers[\s\S]*cannot pass a structural `ProviderSourceFailure`/u);
  assert.match(promotion, /Substituting provider failure for domain evidence/u);
});
