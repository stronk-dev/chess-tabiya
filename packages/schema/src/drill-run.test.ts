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
  fen: "8/8/8/8/8/8/4K3/7k w - - 0 1",
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
};
const activeCursor = { nodeId: rootNode.id, branchId: branch.id };
const event = {
  seq: 1,
  type: "run.started",
  at,
  data: {
    id: "run-1",
    packId: "pack-1",
    packDigest,
    policyConfig,
    rootNode,
    branch,
    activeCursor,
  },
};
const validRun = {
  schemaVersion: DRILL_RUN_SCHEMA_VERSION,
  id: "run-1",
  packId: "pack-1",
  packDigest,
  policyConfig,
  nodes: [rootNode],
  branches: [branch],
  events: [event],
  activeCursor,
};

describe("drill_run.schema.json v0.4", () => {
  it("validates a path-keyed run with a sequenced start event", () => {
    expect(validate(validRun), JSON.stringify(validate.errors)).toBe(true);
    expect(schema).toMatchObject({
      $id: "urn:chess-tabiya:schema:drill-run:0.4",
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
});
