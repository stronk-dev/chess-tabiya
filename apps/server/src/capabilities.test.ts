import { runtimeBuildInfo } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import {
  assertSurfaceCapabilities,
  EngineCapabilities,
  type CapabilityEngineClient,
} from "./capabilities.js";
import type { EngineHealth, EngineIdentity } from "./engine-supervisor.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

function ready(identity: EngineIdentity): EngineHealth {
  return {
    id: identity.id,
    status: "ready",
    restartCount: 0,
    identity,
  };
}

function bandReady(identity: EngineIdentity): EngineHealth {
  return {
    ...ready(identity),
    bandOption: "Elo",
    options: [{ name: "Elo", type: "spin", default: "1500", min: 0, max: 5000 }],
  };
}

function healthClient(
  healthById: Readonly<Record<string, EngineHealth>>,
  observed: string[] = [],
): CapabilityEngineClient {
  return {
    health(engineId) {
      observed.push(engineId);
      return (
        healthById[engineId] ?? {
          id: engineId,
          status: "unavailable",
          restartCount: 0,
        }
      );
    },
  };
}

describe("engine capabilities", () => {
  it("reports engine providers from current supervisor readiness", async () => {
    const identities: Readonly<Record<string, EngineIdentity>> = {
      "stockfish-analysis": {
        id: "stockfish-analysis",
        kind: "judge",
        name: "Stockfish",
        version: "18",
        containerDigest: `sha256:${"a".repeat(64)}`,
        seedHonored: false,
        eloHonored: false,
      },
      "maia-5m": {
        id: "maia-5m",
        kind: "opponent",
        name: "Maia3",
        version: "1e13597",
        modelId: "maia3-5m@b6559de",
        containerDigest: `sha256:${"b".repeat(64)}`,
        seedHonored: false,
        eloHonored: true,
      },
    };
    const observed: string[] = [];
    const capabilities = new EngineCapabilities(
      healthClient(
        {
          "stockfish-analysis": ready(identities["stockfish-analysis"]!),
          "maia-5m": bandReady(identities["maia-5m"]!),
        },
        observed,
      ),
      ["stockfish-analysis", "maia-5m"],
      { engineMode: "maia", tablebase: "lichess" },
    );
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
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
        policyModes: ["human_common", "strong_engine", "theory_strict", "perfect_tablebase", "practical_resistance"],
        feedbackPolicies: ["delayed_checkpoint", "segment_end", "immediate_guard"],
        tempoVerdicts: ["unopened", "open", "in_time", "over_budget", "too_slow", "outpaced", "premature"],
        tempoGradeable: ["in_time", "over_budget", "too_slow", "premature", "outpaced"],
        tempoDefaults: { outpaced: "failed" },
        guardBasis: ["rules", "engine"],
        assessmentCategories: ["win", "loss", "draw", "cursed-win", "blessed-loss"],
        objectiveAssessmentSets: { win: ["win"], hold: ["draw", "cursed-win", "blessed-loss"], save: ["loss", "blessed-loss"], resist: ["loss", "blessed-loss"] },
        runSchemaVersion: runtimeBuildInfo.runSchemaVersion,
        policyProfiles: {
          strong_engine: {
            movetimeMs: 100,
            threads: 1,
            hashMb: 16,
            multiPv: 1,
          },
          human_common: {
            elo: {
              min: 0,
              max: 5000,
              default: 1500,
              source: "advertised",
              advertised: { min: 0, max: 5000 },
            },
          },
        },
        providers: { opponent: "maia", judge: "stockfish", llm: "none", corpus: "none", tts: "none", tablebase: "lichess" },
        surfaces: {
          play: "available",
          review: "available",
          learn: "available",
          live: "available",
          create: "available",
          justPlay: "available",
          fromPosition: "available",
        },
      });
      expect(observed).toEqual(["stockfish-analysis", "maia-5m"]);
    } finally {
      storage.close();
    }
  });

  it("reports mock opponent and judge without claiming real engines", async () => {
    const identity: EngineIdentity = {
      id: "mock-opponent",
      kind: "opponent",
      name: "Deterministic mock opponent",
      version: "1",
      seedHonored: true,
    };
    const descriptor = await new EngineCapabilities(
      healthClient({ [identity.id]: ready(identity) }),
      [identity.id],
      { engineMode: "mock", tablebase: "mock" },
    ).get();

    expect(descriptor.providers).toEqual({
      opponent: "mock",
      judge: "mock",
      llm: "none",
      corpus: "none",
      tts: "none",
      tablebase: "mock",
    });
    expect(descriptor.engines).toEqual([identity]);
    expect(descriptor.guardBasis).toEqual(["rules", "engine"]);
    expect(descriptor.feedbackPolicies).toContain("immediate_guard");
    expect(descriptor.surfaces.play).toBe("available");
    expect(descriptor.surfaces.justPlay).toBe("available");
  });

  it("reports an injected voice seam without inventing a provider by default", async () => {
    const capabilities = new EngineCapabilities(healthClient({}), [], { engineMode: "mock", llmAvailable: true });
    expect((await capabilities.get()).providers.llm).toBe("external");
    const absent = new EngineCapabilities(healthClient({}), [], { engineMode: "mock" });
    expect((await absent.get()).providers.llm).toBe("none");
  });

  it("reports corpus availability from explicit application wiring", async () => {
    const live = new EngineCapabilities(healthClient({}), [], { engineMode: "maia", corpus: "lichess-explorer" });
    const mock = new EngineCapabilities(healthClient({}), [], { engineMode: "mock", corpus: "mock" });
    expect((await live.get()).providers.corpus).toBe("lichess-explorer");
    expect((await mock.get()).providers.corpus).toBe("mock");
  });

  it("reports TTS only from explicit application wiring", async () => {
    const present = new EngineCapabilities(healthClient({}), [], { engineMode: "mock", tts: "external" });
    const absent = new EngineCapabilities(healthClient({}), [], { engineMode: "mock" });
    expect((await present.get()).providers.tts).toBe("external");
    expect((await absent.get()).providers.tts).toBe("none");
  });

  it("downgrades unhealthy real providers instead of reporting stale identities", async () => {
    const staleMaia: EngineIdentity = {
      id: "maia-5m",
      kind: "opponent",
      name: "Maia3",
      version: "1e13597",
      seedHonored: false,
    };
    const descriptor = await new EngineCapabilities(
      healthClient({
        "maia-5m": {
          ...ready(staleMaia),
          status: "restarting",
        },
        "stockfish-analysis": {
          id: "stockfish-analysis",
          status: "unavailable",
          restartCount: 2,
        },
      }),
      ["maia-5m", "stockfish-analysis"],
      { engineMode: "maia" },
    ).get();

    expect(descriptor.engines).toEqual([]);
    expect(descriptor.guardBasis).toEqual(["rules"]);
    expect(descriptor.providers).toEqual({
      opponent: "none",
      judge: "none",
      llm: "none",
      corpus: "none",
      tts: "none",
      tablebase: "none",
    });
    expect(descriptor.surfaces.play).toBe("unavailable-here");
    expect(descriptor.surfaces.justPlay).toBe("unavailable-here");
    expect(descriptor.policyModes).not.toContain("practical_resistance");
  });

  it("rejects planned or unknown values at the server response boundary", () => {
    expect(() =>
      assertSurfaceCapabilities({
        play: "available",
        review: "available",
        learn: "planned",
        live: "available",
        create: "available",
        justPlay: "unavailable-here",
        fromPosition: "unavailable-here",
      }),
    ).toThrow(/Surface learn/);
  });

  it("reports the deployment-effective strong-engine override", async () => {
    const identity: EngineIdentity = {
      id: "stockfish-analysis",
      kind: "judge",
      name: "Stockfish",
      version: "18",
      seedHonored: false,
    };
    const descriptor = await new EngineCapabilities(
      healthClient({ [identity.id]: ready(identity) }),
      [identity.id],
      {
        engineMode: "maia",
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
      healthClient({ [identity.id]: ready(identity) }),
      [identity.id],
      { engineMode: "maia" },
    ).get();
    const locusIdentity = { id: identity.id, version: identity.version };

    expect(descriptor.engines[0]).toMatchObject(locusIdentity);
    expect(Object.keys(descriptor.engines[0]!)).toEqual(
      expect.arrayContaining(["id", "version", "kind", "name", "seedHonored"]),
    );
  });
});
