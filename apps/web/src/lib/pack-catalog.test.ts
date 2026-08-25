import { describe, expect, it } from "vitest";

import type { PackSummary } from "./api.js";
import { filterPacks, packDifficultyCopy, packModeCopy } from "./pack-catalog.js";

function pack(input: Partial<PackSummary> & Pick<PackSummary, "id" | "title">): PackSummary {
  return {
    version: "0.27",
    digest: `sha256:${"a".repeat(64)}`,
    mode: "plan",
    phase: "middlegame",
    difficulty: { minOnlineRapid: 1400, maxOnlineRapid: 2000, label: "Club player" },
    objectiveSummary: "Create a backward pawn on the c-file.",
    concepts: ["carlsbad-structure"],
    reviewStatus: "draft",
    channel: "community",
    ...input,
  };
}

describe("pack catalogue", () => {
  const packs = [
    pack({ id: "carlsbad", title: "Carlsbad minority attack" }),
    pack({ id: "lucena", title: "Lucena bridge", phase: "endgame", mode: "outcome", difficulty: { minOnlineRapid: 1000, maxOnlineRapid: 1600 }, objectiveSummary: "Build the bridge and promote.", concepts: ["rook-ending"] }),
    pack({ id: "najdorf", title: "Najdorf English Attack", phase: "opening", mode: "line", difficulty: { minOnlineRapid: 1800, maxOnlineRapid: 2200 }, objectiveSummary: "Continue beyond the opening fork.", concepts: ["sicilian-defense"] }),
  ];

  it("searches authored objectives and concepts, then composes phase and band filters", () => {
    expect(filterPacks(packs, { phase: "all", band: "all", search: "promote", sort: "recommended" }).map((entry) => entry.id)).toEqual(["lucena"]);
    expect(filterPacks(packs, { phase: "opening", band: "2000+", search: "sicilian", sort: "recommended" }).map((entry) => entry.id)).toEqual(["najdorf"]);
    expect(filterPacks(packs, { phase: "endgame", band: "2000+", search: "", sort: "recommended" })).toEqual([]);
  });

  it("renders learner-facing mode and difficulty language without inventing a rating", () => {
    expect(packModeCopy("line")).toBe("Recall the theory, then continue");
    expect(packModeCopy("outcome")).toBe("Convert, hold, save, or resist");
    expect(packDifficultyCopy(packs[0]!)).toBe("Club player");
    expect(packDifficultyCopy(packs[0]!, 1800)).toBe("Sits at your measured band");
    expect(packDifficultyCopy(packs[0]!, 1000)).toBe("A rung above your measured band");
    expect(packDifficultyCopy(packs[0]!, 2200)).toBe("Below your measured band — technique practice");
  });
});
