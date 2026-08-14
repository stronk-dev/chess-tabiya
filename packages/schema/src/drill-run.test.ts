import { readFileSync } from "node:fs";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

import { DRILL_RUN_SCHEMA_VERSION } from "./index.js";

const schema = JSON.parse(
  readFileSync(new URL("../../../schemas/drill_run.schema.json", import.meta.url), "utf8"),
) as Record<string, unknown>;
const invalidEvidenceFixture = JSON.parse(
  readFileSync(
    new URL(
      "../../../schemas/fixtures/drill-run/evidence-attached-missing-source.invalid.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Record<string, unknown>;
const invalidSelectionFixture = JSON.parse(
  readFileSync(
    new URL(
      "../../../schemas/fixtures/drill-run/opponent-selection-missing-seed.invalid.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Record<string, unknown>;

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const at = "2026-08-12T12:00:00.000Z";
const packDigest = `sha256:${"0".repeat(64)}`;
const rootNodeFen = "8/8/8/8/8/8/4K3/7k w - - 0 1";
const sessionDigest = `sha256:${"1".repeat(64)}`;
const start = {
  fen: rootNodeFen,
  side: "white",
} as const;
const opponentPolicy = { mode: "human_common" } as const;
const policyConfig = {
  seedMode: "per_branch",
  locus: {
    executedAt: "browser",
    engineIds: [],
    modelIds: [{ id: "mock-opponent", version: "1" }],
  },
};
const rootNode = {
  id: "run-1:node:0",
  parentId: null,
  fen: rootNodeFen,
  transposeKey: "8/8/8/8/8/8/4K3/7k w - -",
  moveUci: null,
  moveSan: null,
  ply: 0,
  actor: "system",
  branchId: "run-1:branch:0",
  checkpointRefs: [],
  objectiveState: "active",
  evidenceRefs: [],
  createdAt: at,
};
const branch = {
  id: "run-1:branch:0",
  forkNodeId: rootNode.id,
  label: "main",
  seed: 42,
  origin: "played",
};
const activeCursor = { nodeId: rootNode.id, branchId: branch.id };
const event = {
  seq: 1,
  type: "run.started",
  at,
  data: {
    id: "run-1",
    sessionKind: "pack",
    packId: "pack-1",
    packDigest,
    sessionDigest,
    start,
    feedbackPolicy: "delayed_checkpoint",
    opponentPolicy,
    policyConfig,
    rootNode,
    branch,
    activeCursor,
  },
};
const validRun = {
  schemaVersion: DRILL_RUN_SCHEMA_VERSION,
  id: "run-1",
  sessionKind: "pack",
  packId: "pack-1",
  packDigest,
  sessionDigest,
  start,
  feedbackPolicy: "delayed_checkpoint",
  opponentPolicy,
  policyConfig,
  nodes: [rootNode],
  branches: [branch],
  events: [event],
  activeCursor,
};

describe("drill_run.schema.json v0.11", () => {
  it("validates a path-keyed run with a sequenced start event", () => {
    expect(validate(validRun), JSON.stringify(validate.errors)).toBe(true);
    expect(schema).toMatchObject({
      $id: "urn:chess-tabiya:schema:drill-run:0.11",
      properties: { schemaVersion: { const: DRILL_RUN_SCHEMA_VERSION } },
    });
  });

  it("rejects events without the monotonic cursor field", () => {
    const { seq: _seq, ...eventWithoutSeq } = event;
    const invalidRun = { ...validRun, events: [eventWithoutSeq] };

    expect(validate(invalidRun)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ instancePath: "/events/0" })]),
    );
  });

  it("rejects a position-keyed shortcut without node path identity", () => {
    const { parentId: _parentId, ...positionOnlyNode } = rootNode;
    const invalidRun = { ...validRun, nodes: [positionOnlyNode] };

    expect(validate(invalidRun)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ instancePath: "/nodes/0" })]),
    );
  });

  it("accepts the pack format's fixed seed mode", () => {
    const fixedSeedRun = {
      ...validRun,
      policyConfig: { ...policyConfig, seedMode: "fixed" },
      events: [
        {
          ...event,
          data: {
            ...event.data,
            policyConfig: { ...policyConfig, seedMode: "fixed" },
          },
        },
      ],
    };

    expect(validate(fixedSeedRun), JSON.stringify(validate.errors)).toBe(true);
  });

  it("validates a position session and rejects invalid session pairings", () => {
    const positionFields = {
      sessionKind: "position",
      packId: null,
      packDigest: null,
      start,
      feedbackPolicy: "attempt_end",
      opponentPolicy,
    } as const;
    const positionRun = {
      ...validRun,
      ...positionFields,
      events: [{ ...event, data: { ...event.data, ...positionFields } }],
    };
    expect(validate(positionRun), JSON.stringify(validate.errors)).toBe(true);

    const invalidValues = [
      { ...positionRun, packId: "half-pack" },
      { ...positionRun, feedbackPolicy: "delayed_checkpoint" },
      { ...positionRun, opponentPolicy: { mode: "theory_strict" } },
      { ...validRun, feedbackPolicy: "attempt_end" },
    ];
    for (const invalid of invalidValues) {
      expect(validate(invalid)).toBe(false);
    }

    const { sessionKind: _sessionKind, ...withoutSessionKind } = positionRun;
    expect(validate(withoutSessionKind)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: "",
          keyword: "required",
          params: { missingProperty: "sessionKind" },
        }),
      ]),
    );

    const { sessionDigest: _sessionDigest, ...startWithoutDigest } = event.data;
    expect(
      validate({
        ...validRun,
        events: [{ ...event, data: startWithoutDigest }],
      }),
    ).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: "/events/0/data",
          keyword: "required",
          params: { missingProperty: "sessionDigest" },
        }),
      ]),
    );
  });

  it("validates imported sessions with the same non-pack policy boundary", () => {
    const importedFields = {
      sessionKind: "imported",
      packId: null,
      packDigest: null,
      start,
      feedbackPolicy: "attempt_end",
      opponentPolicy,
    } as const;
    const importedRun = {
      ...validRun,
      ...importedFields,
      events: [{ ...event, data: { ...event.data, ...importedFields } }],
    };
    expect(validate(importedRun), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...importedRun, packId: "not-a-pack" })).toBe(false);
    expect(validate({ ...importedRun, opponentPolicy: { mode: "theory_strict" } })).toBe(false);
  });

  it("validates feedback.revealed with a structural node reference", () => {
    const revealed = {
      seq: 2,
      type: "feedback.revealed",
      at,
      data: { nodeId: rootNode.id },
    };
    expect(
      validate({ ...validRun, events: [event, revealed] }),
      JSON.stringify(validate.errors),
    ).toBe(true);
    expect(validate({ ...validRun, events: [event, { ...revealed, data: {} }] })).toBe(false);
  });

  it("closes the outcome.reached result vocabulary", () => {
    const reached = {
      seq: 2,
      type: "outcome.reached",
      at,
      data: { nodeId: rootNode.id, outcome: "draw" },
    };
    expect(
      validate({ ...validRun, events: [event, reached] }),
      JSON.stringify(validate.errors),
    ).toBe(true);
    expect(
      validate({
        ...validRun,
        events: [event, { ...reached, data: { ...reached.data, outcome: "unknown" } }],
      }),
    ).toBe(false);
  });

  it("validates typed evidence attachment and rejects the negative fixture", () => {
    const evidenceRef = "analysis:stockfish:1";
    const evidenceEvent = {
      seq: 2,
      type: "evidence.attached",
      at,
      data: {
        nodeId: rootNode.id,
        evidenceRefs: [evidenceRef],
        payload: {
          kind: "eval",
          source: "engine_validated",
          values: { centipawns: 24, depth: 18 },
        },
      },
    };
    const evidencedRun = {
      ...validRun,
      nodes: [{ ...rootNode, evidenceRefs: [evidenceRef] }],
      events: [event, evidenceEvent],
    };

    expect(validate(evidencedRun), JSON.stringify(validate.errors)).toBe(true);
    expect(validate(invalidEvidenceFixture)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: "/events/1/data/payload",
          keyword: "required",
          params: { missingProperty: "source" },
        }),
      ]),
    );
  });

  it("validates a typed opponent selection and rejects incomplete engine identity", () => {
    const selectionEvent = {
      seq: 2,
      type: "opponent.move_selected",
      at,
      data: {
        nodeId: rootNode.id,
        branchId: branch.id,
        moveUci: "e2e4",
        selection: {
          moveUci: "e2e4",
          policyModeApplied: "human_common",
          candidates: [
            { moveUci: "e2e4", mass: 0.42, rank: 1 },
            { moveUci: "d2d4", rank: 2 },
          ],
          engine: {
            id: "maia-5m",
            name: "Maia3",
            version: "1e13597c42d4858b7cfd7cfdae01e297263364b2",
            modelId: "maia3-5m@test-model",
            containerDigest: `sha256:${"a".repeat(64)}`,
            seedHonored: false,
          },
        },
      },
    };

    expect(
      validate({ ...validRun, events: [event, selectionEvent] }),
      JSON.stringify(validate.errors),
    ).toBe(true);
    const missingApplied = structuredClone(selectionEvent);
    delete (missingApplied.data.selection as { policyModeApplied?: string }).policyModeApplied;
    expect(validate({ ...validRun, events: [event, missingApplied] })).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: "/events/1/data/selection",
          keyword: "required",
          params: { missingProperty: "policyModeApplied" },
        }),
      ]),
    );
    expect(validate(invalidSelectionFixture)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: "/events/1/data/selection/engine",
          keyword: "required",
          params: { missingProperty: "seedHonored" },
        }),
      ]),
    );
  });

  it("validates prediction.recorded with a typed distribution", () => {
    const selection = {
      moveUci: "e2e4",
      policyModeApplied: "human_common",
      candidates: [{ moveUci: "e2e4", mass: 0.42, rank: 1 }],
      engine: { id: "maia", name: "Maia", version: "3", seedHonored: true },
    };
    const prediction = {
      seq: 2,
      type: "prediction.recorded",
      at,
      data: {
        nodeId: rootNode.id,
        checkpointId: "predict-reply",
        predictedUci: "e2e4",
        predictedMass: 0.42,
        predictedRank: 1,
        candidateCount: 1,
        distribution: selection,
      },
    };
    expect(validate({ ...validRun, events: [event, prediction] }), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...validRun, events: [event, { ...prediction, data: { ...prediction.data, candidateCount: -1 } }] })).toBe(false);
  });

  it("validates the closed group.created wire shape and enumerated selections", () => {
    const distribution = {
      moveUci: "e2e4",
      policyModeApplied: "human_common",
      candidates: [
        { moveUci: "e2e4", mass: 0.42, rank: 1 },
        { moveUci: "d2d4", mass: 0.31, rank: 2 },
      ],
      engine: { id: "maia", name: "Maia", version: "3", seedHonored: false },
    };
    const group = {
      seq: 2,
      type: "group.created",
      at,
      data: {
        groupId: "run-1:group:1",
        sourceNodeId: rootNode.id,
        source: "human_replies",
        resistance: "fixed",
        members: [
          { branchId: "branch-a", seedMoveUci: "e2e4" },
          { branchId: "branch-b", seedMoveUci: "d2d4" },
        ],
        distribution,
      },
    };
    expect(validate({ ...validRun, events: [event, group] }), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...validRun, events: [event, { ...group, data: { ...group.data, extra: true } }] })).toBe(false);
    expect(validate({ ...validRun, events: [event, {
      seq: 2,
      type: "opponent.move_selected",
      at,
      data: {
        nodeId: rootNode.id,
        branchId: branch.id,
        moveUci: "e2e4",
        selection: { ...distribution, policyModeApplied: "enumerated" },
      },
    }] }), JSON.stringify(validate.errors)).toBe(true);
  });
});
