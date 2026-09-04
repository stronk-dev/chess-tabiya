// DISPOSABLE fresh-review falsifier — D2598-D2602. Not production code.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  LONGITUDINAL_SOURCE_MUTATION_OPERATIONS,
  parseLongitudinalObservationRow,
  parseLongitudinalReadQuery,
  sourceDigestV2,
  type LongitudinalSourceImageV2,
  type ProjectionAdmission,
} from "../d2570-longitudinal-sixth-author-repair/contract.js";

const at = "2026-09-04T00:00:00.000Z";
const moveRef = (eventSeq: number, nodeId: string) => Object.freeze({ kind: "move" as const, nodeId, eventSeq });
const declaredAdmissions: readonly ProjectionAdmission[] = Object.freeze([
  Object.freeze({
    id: "rules.structural.event.backward_pawn",
    version: 1,
    pairs: Object.freeze([Object.freeze({ semanticSign: "gained" as const, sourceSign: "gained" as const })]),
  }),
]);

function observation(overrides: Readonly<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    learnerId: "learner",
    runId: "run",
    phase: "middlegame",
    decisionClass: "played",
    decisions: 2,
    observedAt: at,
    derivedRev: 1,
    projectionId: declaredAdmissions[0]!.id,
    projectionVersion: 1,
    semanticSign: "gained",
    sourceSign: "gained",
    sessionKind: "position",
    packId: null,
    opportunities: 1,
    occurred: 0,
    alternativeShareSum: 0,
    occurredRefs: [],
    opportunityRefs: [moveRef(1, "node-1")],
    ...overrides,
  };
}

describe("longitudinal-store sixth-repair fresh buildability review", () => {
  it("D2598 accepts more opportunities than the joined decision denominator", () => {
    const impossible = observation({
      decisions: 1,
      opportunities: 2,
      opportunityRefs: [moveRef(1, "node-1"), moveRef(2, "node-2")],
    });

    expect(parseLongitudinalObservationRow(impossible, declaredAdmissions)).toMatchObject({
      decisions: 1,
      opportunities: 2,
    });
  });

  it("D2599 lets caller data widen both persisted-row and query admission", () => {
    const inventedAdmissions: readonly ProjectionAdmission[] = Object.freeze([
      Object.freeze({
        id: "invented.editorial.grade",
        version: 77,
        pairs: Object.freeze([Object.freeze({ semanticSign: "state" as const, sourceSign: "state" as const })]),
      }),
    ]);
    const forgedRow = observation({
      projectionId: "invented.editorial.grade",
      projectionVersion: 77,
      semanticSign: "state",
      sourceSign: "state",
    });
    const forgedQuery = {
      learnerId: "learner",
      derivationRev: 1,
      through: { kind: "all_complete" },
      filter: { projections: [{ id: "invented.editorial.grade", version: 77 }] },
    };

    expect(parseLongitudinalObservationRow(forgedRow, inventedAdmissions).projectionId).toBe("invented.editorial.grade");
    expect(parseLongitudinalReadQuery(forgedQuery, inventedAdmissions).filter.projections?.[0]?.id).toBe("invented.editorial.grade");
  });

  it("D2600 digests malformed caller source bytes and changes identity after mutation", () => {
    const callerImage = {
      version: 2,
      runPrefix: { invented: true, events: "not a replayed event array" },
      ownerLearnerId: "learner",
      moveAuthorship: [
        { eventSeq: 9, nodeId: "foreign", learnerId: "learner" },
        { eventSeq: 9, nodeId: "foreign", learnerId: "learner" },
      ],
      importedMainlinePlies: -10,
      structureAttribution: "single_player",
    } as unknown as LongitudinalSourceImageV2;

    const before = sourceDigestV2(callerImage);
    expect(before).toMatch(/^sha256:[0-9a-f]{64}$/u);
    (callerImage.runPrefix as { invented: boolean }).invented = false;
    expect(sourceDigestV2(callerImage)).not.toBe(before);
  });

  it("D2601 calls a hand-written tuple set-equal while one member has no production symbol", () => {
    const production = [
      "apps/server/src/storage.ts",
      "apps/server/src/service.ts",
      "apps/server/src/live-session.ts",
      "apps/server/src/application.ts",
    ].map((path) => readFileSync(path, "utf8")).join("\n");
    const authorTests = readFileSync("tools/d2570-longitudinal-sixth-author-repair/contract.test.ts", "utf8");

    expect(LONGITUDINAL_SOURCE_MUTATION_OPERATIONS).toContain("startupLegacyClassification");
    expect(production).not.toContain("startupLegacyClassification");
    expect(authorTests.match(/LONGITUDINAL_SOURCE_MUTATION_OPERATIONS\)\.toContain/gu)).toHaveLength(2);
    expect(authorTests).not.toMatch(/set[-_ ]?equal|every\(|new Set\(/iu);
  });

  it("D2602 proves the invalidation model omits three durable states and their cleanup fields", () => {
    const model = readFileSync("tools/d2570-longitudinal-sixth-author-repair/contract.ts", "utf8");
    const start = model.indexOf("export interface ModeledJob");
    const end = model.indexOf("export function taintStructureAttribution", start);
    const modeledJob = model.slice(start, end);

    expect(modeledJob).toContain('readonly state: "pending" | "complete"');
    expect(modeledJob).not.toMatch(/running|retry_wait|quarantined/u);
    expect(modeledJob).not.toMatch(/claimToken|workerId|leaseExpiresAt|failureCode|nextAttemptAt|retryCount/u);
  });
});
