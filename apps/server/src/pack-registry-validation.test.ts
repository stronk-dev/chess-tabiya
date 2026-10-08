import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PackRegistry } from "./pack-registry.js";
import * as validation from "./pack-validation.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";

const fixture = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"));
const documents = () => ["source", "variant"].map(id => ({ source: `${id}.json`, value: { ...structuredClone(fixture), id } }));
afterEach(() => vi.restoreAllMocks());

describe("pack catalogue validation passes", () => {
  it("fully validates each document once, rather than replaying its complete runtime", async () => {
    const validate = vi.spyOn(validation, "validatePackDocument");
    const catalogue = await PackRegistry.fromDocuments(documents());
    expect(catalogue.list()).toHaveLength(2);
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it("still refuses malformed documents and unknown or false sibling relations", async () => {
    const malformed = documents();
    malformed[1]!.value.start.fen = "not a FEN";
    await expect(PackRegistry.fromDocuments(malformed)).rejects.toMatchObject({ code: "PACK_INVALID" });
    for (const [packId, code] of [["absent", "VARIANT_PACK_UNKNOWN"], ["source", "VARIANT_RELATION_UNPROVEN"], ["variant", "VARIANT_SELF_REFERENCE"]] as const) {
      const entries = documents();
      entries[1]!.value = withDerivedRequires({ ...entries[1]!.value, variantOf: { packId, relation: { kind: "same_root_other_side" } } });
      await expect(PackRegistry.fromDocuments(entries)).rejects.toMatchObject({ code: "PACK_INVALID", details: { issues: expect.arrayContaining([expect.objectContaining({ code })]) } });
    }
  });

  it("accepts a proven sibling regardless of document order", async () => {
    for (const reverse of [false, true]) {
      const entries = documents();
      entries[1]!.value.start.side = entries[0]!.value.start.side === "white" ? "black" : "white";
      entries[1]!.value = withDerivedRequires({ ...entries[1]!.value, variantOf: { packId: "source", relation: { kind: "same_root_other_side" } } });
      const catalogue = await PackRegistry.fromDocuments(reverse ? entries.reverse() : entries);
      expect(catalogue.list()).toHaveLength(2);
    }
  });
});
