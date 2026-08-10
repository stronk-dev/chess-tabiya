import { readFileSync } from "node:fs";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

import { DRILL_RUN_SCHEMA_VERSION } from "./index.js";

const schema = JSON.parse(
  readFileSync(new URL("../../../schemas/drill_run.schema.json", import.meta.url), "utf8"),
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

describe("drill_run.schema.json v0.2", () => {
  it("validates a path-keyed run with a sequenced start event", () => {
    expect(validate(validRun), JSON.stringify(validate.errors)).toBe(true);
    expect(schema).toMatchObject({
      $id: "urn:chess-tabiya:schema:drill-run:0.2",
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
});
