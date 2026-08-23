import { describe, expect, it } from "vitest";

import { CampaignRegistry } from "./campaign-registry.js";

const packs = Object.freeze({ get: (id: string) => id === "pack-one" ? Object.freeze({ id }) : undefined });

function document(version = 1): unknown {
  const node = (id: string, boss = false) => ({ id, encounter: { kind: "pack", packId: "pack-one" }, ...(boss ? { boss: true, suppress: ["guided_hint"] } : {}) });
  const act = (id: "act1" | "act2" | "act3") => ({ id, layers: [
    { choices: [node(`${id}-one`)] },
    { choices: [node(`${id}-two`)] },
    { choices: [node(`${id}-boss`, true)] },
  ] });
  return {
    id: "seed-endgames",
    title: "Seed endgames",
    version,
    acts: [act("act1"), act("act2"), act("act3")],
    economy: { startingCharges: 3, actGrants: { act1: 3, act2: 2, act3: 1 }, validation: "candidate" },
    startingModules: ["sight_on_request"],
  };
}

describe("campaign registry", () => {
  it("retains exact document versions for pinned campaign runs", async () => {
    const registry = await CampaignRegistry.fromDocuments([
      { source: "v2.json", value: document(2) },
      { source: "v1.json", value: document(1) },
    ], packs);
    expect(registry.list().map((entry) => [entry.id, entry.version, entry.nodeCount])).toEqual([
      ["seed-endgames", 1, 9], ["seed-endgames", 2, 9],
    ]);
    expect(registry.versions("seed-endgames").map((entry) => entry.document.version)).toEqual([1, 2]);
    expect(registry.required("seed-endgames", 1).source).toBe("v1.json");
    expect(registry.required("seed-endgames", 1).digest).not.toBe(registry.required("seed-endgames", 2).digest);
  });

  it("refuses duplicate identities, invalid documents, and absent pinned versions", async () => {
    await expect(CampaignRegistry.fromDocuments([
      { source: "one.json", value: document() }, { source: "two.json", value: document() },
    ], packs)).rejects.toMatchObject({ code: "CAMPAIGN_DOCUMENT_DUPLICATE" });
    const invalid = structuredClone(document()) as { acts: { layers: { choices: { encounter: { packId: string } }[] }[] }[] };
    invalid.acts[0]!.layers[0]!.choices[0]!.encounter.packId = "missing";
    await expect(CampaignRegistry.fromDocuments([{ source: "invalid.json", value: invalid }], packs)).rejects.toMatchObject({ code: "CAMPAIGN_DOCUMENT_INVALID" });
    const registry = await CampaignRegistry.fromDocuments([{ source: "v1.json", value: document() }], packs);
    expect(() => registry.required("seed-endgames", 2)).toThrowError(expect.objectContaining({ code: "CAMPAIGN_DOCUMENT_NOT_FOUND" }));
  });

  it("loads an absent default content directory as an honest empty registry", async () => {
    const registry = await CampaignRegistry.loadDefault(packs, "/tmp/tabiya-campaign-directory-that-does-not-exist");
    expect(registry.list()).toEqual([]);
  });
});
