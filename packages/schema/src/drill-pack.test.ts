import { readFileSync } from "node:fs";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

import { DRILL_PACK_SCHEMA_VERSION } from "./index.js";
import {
  CHECKPOINT_ACTIONS,
  FEEDBACK_POLICIES,
  canonicalizeJson,
  digestDrillPack,
  formatDrillUrl,
  formatFenUrl,
  lintDrillPack,
  OBJECTIVE_TYPES,
  PACK_PHASES,
  RETRY_VARIANT_KINDS,
  parseDrillAddress,
  resolveDrillAddress,
  type DrillPackDefinition,
  type JsonValue,
} from "./drill-pack/index.js";

function json(relativeUrl: string): unknown {
  return JSON.parse(readFileSync(new URL(relativeUrl, import.meta.url), "utf8"));
}

function validator(schema: Record<string, unknown>) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

const schema = json("../../../schemas/drill_pack.schema.json") as Record<
  string,
  unknown
>;
const livingFixture = json("../../../schemas/drill_pack.example.json");
const validate = validator(schema);

const negativeFixtures = [
  "missing-feedback-policy.invalid.json",
  "prediction-without-source.invalid.json",
  "empty-authored-boundary.invalid.json",
  "deviation-without-class.invalid.json",
  "malformed-window-trigger.invalid.json",
] as const;

function negativeFixture(filename: string): unknown {
  return json(`../../../schemas/fixtures/drill-pack/${filename}`);
}

describe("drill_pack.schema.json v0.7", () => {
  it("validates the amended living Najdorf fixture against the living schema", () => {
    expect(validate(livingFixture), JSON.stringify(validate.errors)).toBe(true);
    expect(schema).toMatchObject({
      $id: "urn:chess-tabiya:schema:drill-pack:0.7",
    });
    expect(DRILL_PACK_SCHEMA_VERSION).toBe("0.7");
  });

  it("binds schema vocabularies to the shared constants", () => {
    const typed = schema as any;
    expect(typed.$defs.objectiveType.enum).toEqual([...OBJECTIVE_TYPES]);
    expect(typed.properties.feedbackPolicy.enum).toEqual([...FEEDBACK_POLICIES]);
    expect(typed.properties.phase.enum).toEqual([...PACK_PHASES]);
    expect(typed.properties.retryVariants.items.properties.kind.enum).toEqual([
      ...RETRY_VARIANT_KINDS,
    ]);
    expect(CHECKPOINT_ACTIONS).toEqual(["compare_branches"]);
  });

  it("requires the learner side at the authoring boundary", () => {
    const candidate = structuredClone(livingFixture) as any;
    delete candidate.start.side;
    expect(validate(candidate)).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        keyword: "required",
        instancePath: "/start",
        params: { missingProperty: "side" },
      }),
    );
  });

  it("keeps the frozen Najdorf fixture on the frozen v0.1 schema only", () => {
    const frozenSchema = json(
      "../../../archive/brief-v2/schemas/drill_pack.schema.json",
    ) as Record<string, unknown>;
    const frozenFixture = json(
      "../../../archive/brief-v2/schemas/drill_pack.example.json",
    );
    const validateFrozen = validator(frozenSchema);

    expect(validateFrozen(frozenFixture), JSON.stringify(validateFrozen.errors)).toBe(
      true,
    );
    expect(validate(frozenFixture)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: "required",
          params: { missingProperty: "feedbackPolicy" },
        }),
      ]),
    );
  });

  it.each(negativeFixtures)("rejects the RFC negative fixture %s", (filename) => {
    const fixture = negativeFixture(filename);
    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(false);
  });

  it("accepts every frozen simple-trigger kind and the timing-window form", () => {
    const base = livingFixture as DrillPackDefinition;
    const triggerVariants = [
      { atPly: 3 },
      { atSpineNode: "najdorf-e6" },
      {
        fenPredicate: {
          type: "pieceOnSquare",
          square: "e3",
          piece: { color: "white", role: "bishop" },
        },
      },
      {
        materialBalance: {
          perspective: "white",
          comparison: "atLeast",
          value: 0,
        },
      },
      {
        windowOpens: { atSpineNode: "najdorf-f3" },
        windowCloses: { atSpineNode: "najdorf-b5" },
        luxuryMoveBudget: 1,
      },
    ];

    for (const trigger of triggerVariants) {
      const candidate = {
        ...base,
        checkpoints: [{ ...base.checkpoints[0], trigger }],
      };
      expect(validate(candidate), JSON.stringify(validate.errors)).toBe(true);
    }
  });

  it("enforces the v0.2 rename, interaction, and on-ramp boundaries", () => {
    const base = livingFixture as DrillPackDefinition;
    expect(validate({ ...base, acceptedAlternatives: [] })).toBe(false);
    expect(
      validate({
        ...base,
        difficulty: { branchLengthTarget: 1 },
      }),
    ).toBe(false);
    expect(
      validate({
        ...base,
        provenance: { reviewStatus: "draft", sources: ["session_distilled"] },
      }),
    ).toBe(true);
    expect(
      validate({
        ...base,
        checkpoints: [
          {
            id: "legacy-action",
            trigger: { atPly: 1 },
            actions: ["capture_intent"],
          },
        ],
      }),
    ).toBe(false);
  });
});

describe("drill pack authoring lint", () => {
  it("walks every living-fixture spine path as legal chess", () => {
    const issues = lintDrillPack(livingFixture as DrillPackDefinition);
    expect(issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("rejects the schema-valid illegal-spine fixture", () => {
    const fixture = negativeFixture(
      "illegal-spine.invalid.json",
    ) as DrillPackDefinition;
    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);
    expect(lintDrillPack(fixture)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          code: "ILLEGAL_SPINE_MOVE",
          path: "/spine/0/moveUci",
        }),
      ]),
    );
  });

  it("rejects SAN that disagrees with an otherwise legal spine move", () => {
    const base = livingFixture as DrillPackDefinition;
    const first = base.spine![0]!;
    const pack = {
      ...base,
      spine: [{ ...first, moveSan: "Qh5" }],
    };

    expect(lintDrillPack(pack)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          code: "SPINE_SAN_MISMATCH",
          path: "/spine/0/moveSan",
        }),
      ]),
    );
  });

  it("warns above two predictions in a supplied segment grouping", () => {
    const base = livingFixture as DrillPackDefinition;
    const prediction = base.checkpoints.find(
      (checkpoint) => checkpoint.interaction?.type === "prediction",
    )!;
    const pack = {
      ...base,
      checkpoints: [
        ...base.checkpoints,
        { ...prediction, id: "predict-two" },
        { ...prediction, id: "predict-three" },
      ],
    };
    const issues = lintDrillPack(pack, {
      predictionSegments: [
        {
          id: "opening-segment",
          checkpointIds: ["predict-reply", "predict-two", "predict-three"],
        },
      ],
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          code: "TOO_MANY_PREDICTIONS",
        }),
      ]),
    );
    expect(lintDrillPack(pack)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "TOO_MANY_PREDICTIONS" }),
      ]),
    );
  });

  it("lints deviation legality, side, duplicates, and spine shadowing", () => {
    const base = livingFixture as DrillPackDefinition;
    const anchor = { spineNodeId: "najdorf-e6" } as const;
    const cases = [
      [{ at: anchor, moveUci: "b7b5", class: "wrong-side" }],
      [{ at: anchor, moveUci: "a1a8", class: "illegal" }],
      [
        { at: anchor, moveUci: "f1e2", class: "one" },
        { at: anchor, moveUci: "f1e2", class: "two" },
      ],
    ] as const;
    expect(lintDrillPack({ ...base, deviations: cases[0] })).toContainEqual(
      expect.objectContaining({ severity: "error", code: "DEVIATION_WRONG_SIDE" }),
    );
    expect(lintDrillPack({ ...base, deviations: cases[1] })).toContainEqual(
      expect.objectContaining({ severity: "error", code: "ILLEGAL_DEVIATION_MOVE" }),
    );
    expect(lintDrillPack({ ...base, deviations: cases[2] })).toContainEqual(
      expect.objectContaining({ severity: "error", code: "DUPLICATE_DEVIATION" }),
    );
    expect(lintDrillPack(base)).toContainEqual(
      expect.objectContaining({ severity: "warning", code: "DEVIATION_SHADOWS_SPINE_MOVE" }),
    );
  });

  it("warns when the boundary cap makes a listed node unreachable", () => {
    const base = livingFixture as DrillPackDefinition;
    expect(lintDrillPack({
      ...base,
      authoredBoundary: { ...base.authoredBoundary, plyHorizon: 1 },
    })).toContainEqual(expect.objectContaining({
      severity: "warning",
      code: "BOUNDARY_NODE_BEYOND_HORIZON",
    }));
  });

  it("warns for spine-authored prose no atSpineNode checkpoint can reveal", () => {
    const candidate = structuredClone(livingFixture) as DrillPackDefinition;
    const lateNode = candidate.spine![0]!.children[0]!;
    (lateNode as { annotations?: readonly string[] }).annotations = ["Too late"];
    (candidate as { checkpoints: DrillPackDefinition["checkpoints"] }).checkpoints = [
      { id: "early", trigger: { atSpineNode: "najdorf-be3" } },
    ];

    expect(lintDrillPack(candidate)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          code: "AUTHORED_PROSE_AFTER_LAST_CHECKPOINT",
          path: "/spine/0/children/0/annotations/0",
        }),
      ]),
    );
  });

  it("suppresses the tail-prose warning when any checkpoint is not node-resolvable", () => {
    const candidate = structuredClone(livingFixture) as DrillPackDefinition;
    const lateNode = candidate.spine![0]!.children[0]!;
    (lateNode as { annotations?: readonly string[] }).annotations = ["Maybe reachable"];
    (candidate as { checkpoints: DrillPackDefinition["checkpoints"] }).checkpoints = [
      { id: "dynamic", trigger: { atPly: 9 } },
    ];

    expect(
      lintDrillPack(candidate).filter(
        (issue) => issue.code === "AUTHORED_PROSE_AFTER_LAST_CHECKPOINT",
      ),
    ).toEqual([]);
  });
});

describe("drill pack RFC 8785 digest", () => {
  it("canonicalizes object keys recursively and normalizes negative zero", () => {
    expect(
      canonicalizeJson({ z: -0, a: { second: 2, first: 1 }, list: [3, 2, 1] }),
    ).toBe('{"a":{"first":1,"second":2},"list":[3,2,1],"z":0}');
  });

  it("uses ECMAScript number serialization required by JCS", () => {
    expect(
      canonicalizeJson([
        333333333.33333329,
        1e30,
        4.5,
        2e-3,
        0.000000000000000000000000001,
      ]),
    ).toBe("[333333333.3333333,1e+30,4.5,0.002,1e-27]");
  });

  it("produces the same SHA-256 digest for different key serialization order", async () => {
    const left: JsonValue = {
      id: "digest-pack",
      version: "0.2.0",
      nested: { beta: 2, alpha: 1 },
    };
    const right: JsonValue = {
      nested: { alpha: 1, beta: 2 },
      version: "0.2.0",
      id: "digest-pack",
    };

    const leftDigest = await digestDrillPack(left);
    expect(await digestDrillPack(right)).toBe(leftDigest);
    expect(leftDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(await digestDrillPack({ ...left, version: "0.2.1" })).not.toBe(
      leftDigest,
    );

    const fixture = livingFixture as Record<string, unknown>;
    const reversedFixture = Object.fromEntries(Object.entries(fixture).reverse());
    expect(await digestDrillPack(reversedFixture)).toBe(
      await digestDrillPack(fixture),
    );
  });
});

describe("drill pack URL forms", () => {
  it("formats, parses, and resolves a versioned pack spine node", () => {
    const pack = livingFixture as DrillPackDefinition;
    const url = formatDrillUrl(pack.id, pack.version, "najdorf-e6");
    expect(url).toBe(
      "/drill/najdorf-transition-schema-example@0.2.0/najdorf-e6",
    );
    expect(parseDrillAddress(url)).toEqual({
      kind: "drill",
      packId: pack.id,
      version: pack.version,
      spineNodeId: "najdorf-e6",
    });
    expect(resolveDrillAddress(url, [pack])).toMatchObject({
      kind: "pack",
      pack,
      spineNodeId: "najdorf-e6",
    });
  });

  it("percent-encodes a full FEN as one segment and round-trips it", () => {
    const fen = "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6";
    const url = formatFenUrl(fen, "play_until_checkpoint");

    expect(url).toContain("%2F");
    expect(url).toContain("%20");
    expect(url.split("/")).toHaveLength(4);
    expect(parseDrillAddress(url)).toEqual({
      kind: "fen",
      fen,
      objectiveType: "play_until_checkpoint",
    });
    expect(resolveDrillAddress(url, [])).toEqual({
      kind: "fen",
      start: { fen },
      objective: { type: "play_until_checkpoint" },
    });
  });
});
