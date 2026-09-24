import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { CampaignRegistry } from "./campaign-registry.js";
import type { CampaignPackLookup } from "./campaign-validation.js";
import { PackRegistry } from "./pack-registry.js";

// rfc/campaign-core.md §6.0: {id, version, digest} identity; a second byte image at one id/version refuses.

const BOSS_FEN = "rnb3k1/pppp1ppp/8/n6N/n1B5/B2Q4/PPP2PPP/4R2K w - - 0 1";
const packs: CampaignPackLookup = Object.freeze({
  get: (id: string) => id === "line-boundary-browser" ? { start: { fen: "8/8/8/8/8/8/8/K6k w - - 0 1", side: "white" } }
    : id === "campaign-boss-browser-fixture" ? { start: { fen: BOSS_FEN, side: "white" } } : undefined,
});

function document(version = 1): any {
  const value = JSON.parse(readFileSync(new URL("../../../tests/browser/fixtures/campaign.browser.json", import.meta.url), "utf8"));
  value.version = version;
  for (const grant of value.durableRewards) grant.reward.campaignVersion = version;
  return value;
}

describe("campaign registry", () => {
  it("retains exact document versions for pinned campaign runs", async () => {
    const registry = await CampaignRegistry.fromDocuments([
      { source: "v2.json", value: document(2) },
      { source: "v1.json", value: document(1) },
    ], packs);
    expect(registry.list().map((entry) => [entry.id, entry.version, entry.nodeCount, entry.channel])).toEqual([
      ["browser-fixture-campaign", 1, 15, "community"], ["browser-fixture-campaign", 2, 15, "community"],
    ]);
    expect(registry.required("browser-fixture-campaign", 1).source).toBe("v1.json");
    expect(registry.required("browser-fixture-campaign", 1).digest).not.toBe(registry.required("browser-fixture-campaign", 2).digest);
  });

  it("refuses duplicates, mutated versions, invalid documents and absent pinned versions", async () => {
    await expect(CampaignRegistry.fromDocuments([{ source: "one.json", value: document() }, { source: "two.json", value: document() }], packs)).rejects.toMatchObject({ code: "CAMPAIGN_DOCUMENT_DUPLICATE" });
    const mutated = document(); mutated.title = "Another byte image";
    await expect(CampaignRegistry.fromDocuments([{ source: "one.json", value: document() }, { source: "two.json", value: mutated }], packs)).rejects.toMatchObject({ code: "CAMPAIGN_DOCUMENT_VERSION_MUTATED" });
    const invalid = document(); invalid.acts[0].layers[0].choices[0].encounter.packId = "missing";
    await expect(CampaignRegistry.fromDocuments([{ source: "invalid.json", value: invalid }], packs)).rejects.toMatchObject({ code: "CAMPAIGN_DOCUMENT_INVALID" });
    const registry = await CampaignRegistry.fromDocuments([{ source: "v1.json", value: document() }], packs);
    expect(() => registry.required("browser-fixture-campaign", 2)).toThrowError(expect.objectContaining({ code: "CAMPAIGN_DOCUMENT_NOT_FOUND" }));
  });

  it("loads an absent default content directory as an honest empty registry", async () => {
    const registry = await CampaignRegistry.loadDefault(packs, "/tmp/tabiya-campaign-directory-that-does-not-exist");
    expect(registry.list()).toEqual([]);
  });

  it("the installed draft pilot validates against the installed packs and is community, never official", async () => {
    const installed = await PackRegistry.loadDefault();
    const registry = await CampaignRegistry.loadDefault(Object.freeze({ get: (id: string) => installed.get(id)?.document }));
    const pilot = registry.list().find((entry) => entry.id === "draft-pilot-three-phases");
    expect(pilot).toMatchObject({ channel: "community", nodeCount: 21 });
  });
});
