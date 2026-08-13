import { readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  FEEDBACK_POLICIES,
  type DrillPackDefinition,
} from "@chess-tabiya/schema/drill-pack";
import { afterEach, describe, expect, it } from "vitest";

import { checkPackFile, formatPackIssue } from "./pack-check.js";
import {
  DECLARED_UNIMPLEMENTED_POLICY_MODES,
  SUPPORTED_POLICY_MODES,
} from "./capabilities.js";
import { PackRegistry, SIDECAR_BASENAMES } from "./pack-registry.js";
import { validatePackDocument } from "./pack-validation.js";

const fixture = JSON.parse(
  readFileSync(
    new URL("../../../schemas/drill_pack.example.json", import.meta.url),
    "utf8",
  ),
) as DrillPackDefinition;
const temporaryDirectories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "chess-tabiya-pack-authoring-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("pack authoring validation", () => {
  it("keeps declared pack vocabularies aligned with executable capabilities", () => {
    const schema = JSON.parse(
      readFileSync(
        new URL("../../../schemas/drill_pack.schema.json", import.meta.url),
        "utf8",
      ),
    ) as any;
    expect(new Set(schema.$defs.opponentPolicy.properties.mode.enum)).toEqual(
      new Set([
        ...SUPPORTED_POLICY_MODES,
        ...DECLARED_UNIMPLEMENTED_POLICY_MODES.map((entry) => entry.mode),
      ]),
    );
    const supportedModes = new Set<string>(SUPPORTED_POLICY_MODES);
    expect(
      DECLARED_UNIMPLEMENTED_POLICY_MODES.some((entry) =>
        supportedModes.has(entry.mode),
      ),
    ).toBe(false);
    expect(schema.properties.feedbackPolicy.enum).toEqual([...FEEDBACK_POLICIES]);
  });

  it("reports living-schema failures with JSON pointers", () => {
    const { title: _title, ...missingTitle } = structuredClone(
      fixture as unknown as Record<string, unknown>,
    );
    const result = validatePackDocument(missingTitle);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        source: "schema",
        severity: "error",
        code: "SCHEMA_REQUIRED",
        path: "/title",
      }),
    );
  });

  it("combines shipped chess lints and executable-policy checks", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate.spine![0] as { moveUci: string }).moveUci = "a1a8";
    (
      (candidate as unknown as Record<string, unknown>)
        .opponentPolicy as Record<string, unknown>
    ).mode = "plan_defense";
    const result = validatePackDocument(candidate);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "lint",
          code: "ILLEGAL_SPINE_MOVE",
          path: "/spine/0/moveUci",
        }),
        expect.objectContaining({
          source: "runtime",
          code: "UNSUPPORTED_OPPONENT_POLICY",
          path: "/opponentPolicy/mode",
        }),
      ]),
    );
  });

  it("rejects immediate blunder feedback at the schema stage", () => {
    const candidate = structuredClone(fixture) as unknown as Record<string, unknown>;
    candidate.feedbackPolicy = "immediate_blunder_guard";
    const result = validatePackDocument(candidate);
    expect(result.issues).toEqual([
      expect.objectContaining({
        source: "schema",
        code: "SCHEMA_ENUM",
        path: "/feedbackPolicy",
      }),
    ]);
  });

  it("allows draft packs with no sources or reviewers", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate as unknown as Record<string, unknown>).provenance = {
      reviewStatus: "draft",
      sources: [],
      reviewers: [],
    };

    expect(validatePackDocument(candidate).valid).toBe(true);
  });

  it("rejects a reviewed pack with no reviewer", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate as unknown as Record<string, unknown>).provenance = {
      reviewStatus: "reviewed",
      sources: ["Reviewed source"],
      reviewers: [],
    };

    const result = validatePackDocument(candidate);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({
      severity: "error",
      source: "runtime",
      code: "GRADUATION_REQUIRES_REVIEWERS",
      path: "/provenance/reviewers",
      message:
        "reviewed packs require at least one reviewer; see planning/content-era/plan.md §3b",
    });
  });

  it("allows a reviewed pack with sources and reviewers", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate as unknown as Record<string, unknown>).provenance = {
      reviewStatus: "reviewed",
      sources: ["Reviewed source"],
      reviewers: ["Named reviewer"],
    };

    expect(validatePackDocument(candidate).valid).toBe(true);
  });

  it("rejects checkpoint actions the client cannot execute", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate.checkpoints[0] as unknown as Record<string, unknown>).actions = [
      "stop",
    ];

    const result = validatePackDocument(candidate);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({
      severity: "error",
      source: "runtime",
      code: "UNSUPPORTED_CHECKPOINT_ACTION",
      path: "/checkpoints/0/actions/0",
      message:
        'checkpoint action "stop" is unsupported; allowed actions: compare_branches',
    });
  });

  it.each([{ actions: [] }, { actions: ["compare_branches"] }])(
    "accepts the executable checkpoint action set %j",
    ({ actions }) => {
      const candidate = structuredClone(fixture) as DrillPackDefinition;
      (candidate.checkpoints[0] as unknown as Record<string, unknown>).actions =
        actions;

      expect(validatePackDocument(candidate).valid).toBe(true);
    },
  );

  it("checks files without stack traces and keeps warnings non-fatal", async () => {
    const directory = await temporaryDirectory();
    const invalidPath = join(directory, "invalid.json");
    await writeFile(invalidPath, "{ not json", "utf8");
    const invalid = await checkPackFile(invalidPath);
    expect(invalid.valid).toBe(false);
    expect(formatPackIssue(invalid.issues[0]!)).toMatch(
      /^ERROR \/ \[INVALID_JSON\] /,
    );
    expect(formatPackIssue(invalid.issues[0]!)).not.toContain("\n");

    const warningPath = join(directory, "warning.json");
    const prediction = fixture.checkpoints.find(
      (checkpoint) => checkpoint.interaction?.type === "prediction",
    )!;
    await writeFile(
      warningPath,
      JSON.stringify({
        ...fixture,
        id: "warning-pack",
        checkpoints: [
          ...fixture.checkpoints,
          { ...prediction, id: "prediction-two" },
          { ...prediction, id: "prediction-three" },
        ],
      }),
      "utf8",
    );
    const warning = await checkPackFile(warningPath);
    expect(warning.valid).toBe(true);
    expect(warning.issues).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        code: "TOO_MANY_PREDICTIONS",
        path: "/checkpoints",
      }),
    );
  });

  it("refuses reserved sidecar names as pack files", async () => {
    const directory = await temporaryDirectory();
    const sidecar = join(directory, "evidence.json");
    await writeFile(sidecar, JSON.stringify(fixture), "utf8");
    const result = await checkPackFile(sidecar);
    expect(result).toMatchObject({ valid: false });
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "PACK_FILE_IS_RESERVED_SIDECAR_NAME" }),
    );
  });
});

describe("development draft registry", () => {
  it("uses one sidecar vocabulary for recursive discovery", async () => {
    const directory = await temporaryDirectory();
    const nested = join(directory, "candidate");
    await import("node:fs/promises").then(({ mkdir }) => mkdir(nested));
    await writeFile(
      join(nested, "pack.json"),
      JSON.stringify({ ...structuredClone(fixture), id: "sidecar-pack" }),
      "utf8",
    );
    for (const name of SIDECAR_BASENAMES) {
      await writeFile(join(nested, name), "{}", "utf8");
    }
    const registry = await PackRegistry.loadDefault({
      development: true,
      draftsDirectory: directory,
    });
    expect(registry.get("sidecar-pack")).toBeDefined();
    expect(registry.list().filter((pack) => pack.id === "sidecar-pack")).toHaveLength(1);
  });

  it("loads the four committed sourcing candidates without mistaking sidecars for packs", async () => {
    const candidates = new URL("../../../content/candidates/", import.meta.url);
    const registry = await PackRegistry.loadDefault({
      development: true,
      draftsDirectory: candidates.pathname,
    });
    expect(registry.list()).toHaveLength(5);
    expect(registry.list().filter((entry) => entry.reviewStatus === "draft")).toHaveLength(4);
  });

  it("ignores committed drafts in production and loads them in development", async () => {
    const directory = await temporaryDirectory();
    const draft = {
      ...structuredClone(fixture),
      id: "development-only-pack",
      title: "Development-only pack",
    };
    await writeFile(join(directory, "draft.json"), JSON.stringify(draft), "utf8");

    const production = await PackRegistry.loadDefault({
      development: false,
      draftsDirectory: directory,
    });
    expect(production.get(draft.id)).toBeUndefined();

    const development = await PackRegistry.loadDefault({
      development: true,
      draftsDirectory: directory,
    });
    expect(development.required(draft.id).summary.title).toBe(draft.title);
  });

  it("lets an explicit development draft replace its published id", async () => {
    const directory = await temporaryDirectory();
    const draftPath = join(directory, "replacement.json");
    await writeFile(
      draftPath,
      JSON.stringify({ ...structuredClone(fixture), title: "Draft replacement" }),
      "utf8",
    );

    const registry = await PackRegistry.loadDefault({
      development: true,
      draftsDirectory: join(directory, "empty"),
      draftFile: draftPath,
    });
    expect(registry.required(fixture.id).summary.title).toBe("Draft replacement");
    await expect(
      PackRegistry.loadDefault({ development: false, draftFile: draftPath }),
    ).rejects.toThrow("Draft packs may only be loaded in development mode");
  });
});
