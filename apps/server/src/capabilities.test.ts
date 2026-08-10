import { runtimeBuildInfo } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { EngineCapabilities } from "./capabilities.js";
import type { EngineIdentity } from "./engine-supervisor.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

describe("engine capabilities", () => {
  it("reports warmed engine identities, policy modes, and the living run schema", async () => {
    const identities: Readonly<Record<string, EngineIdentity>> = {
      "stockfish-analysis": {
        id: "stockfish-analysis",
        kind: "judge",
        name: "Stockfish",
        version: "18",
        containerDigest: `sha256:${"a".repeat(64)}`,
        seedHonored: false,
      },
      "maia-5m": {
        id: "maia-5m",
        kind: "opponent",
        name: "Maia3",
        version: "1e13597",
        modelId: "maia3-5m@b6559de",
        containerDigest: `sha256:${"b".repeat(64)}`,
        seedHonored: false,
      },
    };
    const started: string[] = [];
    const capabilities = new EngineCapabilities(
      {
        async start(engineId) {
          started.push(engineId);
          return identities[engineId]!;
        },
      },
      ["stockfish-analysis", "maia-5m"],
    );
    const storage = new SQLiteRunStorage();
    try {
      const handler = createRestHandler(
        new RunService(storage),
        undefined,
        capabilities,
      );
      const response = await handler(
        new Request("http://server.test/capabilities"),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        engines: [identities["stockfish-analysis"], identities["maia-5m"]],
        policyModes: ["human_common", "strong_engine", "theory_strict"],
        runSchemaVersion: runtimeBuildInfo.runSchemaVersion,
        policyProfiles: {
          strong_engine: {
            movetimeMs: 100,
            threads: 1,
            hashMb: 16,
            multiPv: 1,
          },
        },
      });
      expect(started).toEqual(["stockfish-analysis", "maia-5m"]);
    } finally {
      storage.close();
    }
  });

  it("reports the deployment-effective strong-engine override", async () => {
    const identity: EngineIdentity = {
      id: "stockfish-play",
      kind: "opponent",
      name: "Stockfish",
      version: "18",
      seedHonored: false,
    };
    const descriptor = await new EngineCapabilities(
      { start: async () => identity },
      [identity.id],
      {
        strongEngineProfile: { movetimeMs: 175, threads: 2, hashMb: 32 },
      },
    ).get();

    expect(descriptor.policyProfiles.strong_engine).toEqual({
      movetimeMs: 175,
      threads: 2,
      hashMb: 32,
      multiPv: 1,
    });
  });

  it("is a strict superset of policyConfig.locus engine identity fields", async () => {
    const identity: EngineIdentity = {
      id: "maia-5m",
      kind: "opponent",
      name: "Maia3",
      version: "1e13597",
      modelId: "maia3-5m@b6559de",
      seedHonored: false,
    };
    const descriptor = await new EngineCapabilities(
      { start: async () => identity },
      [identity.id],
    ).get();
    const locusIdentity = { id: identity.id, version: identity.version };

    expect(descriptor.engines[0]).toMatchObject(locusIdentity);
    expect(Object.keys(descriptor.engines[0]!)).toEqual(
      expect.arrayContaining(["id", "version", "kind", "name", "seedHonored"]),
    );
  });
});
