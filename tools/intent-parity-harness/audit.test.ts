// DISPOSABLE intent-parity harness — D640. Protected design remains owner/Claude-authored.
import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { INTENT_DEBT } from "./registry.js";

const ROOT = new URL("../../", import.meta.url);
const OUT = new URL("./output.md", import.meta.url);
function source(path: string): string { return readFileSync(new URL(path, ROOT), "utf8"); }

describe("D640 protected-intent parity", () => {
  it("proves the planning rulings exist", () => {
    const decisions = source("planning/platform-alignment/decision-queue.md");
    expect(decisions).toContain("O1 | **RULED 2026-08-20");
    expect(decisions).toContain("O3 | **RULED 2026-08-20");
    expect(decisions).toContain("O4 | **PARTIAL");
    expect(decisions).toContain("O13 | **RULED 2026-08-20 — Choice C**");
  });

  it("pins the contrary protected-design text until the owner/Claude amendment lands", () => {
    const product = source("design/02-product-shape.md");
    const breadth = source("design/03-product-breadth.md");
    const run = source("design/05-in-run-experience.md");
    expect(product).toContain("Deployment axis — SETTLED 2026-08-12 (owner ruling): hosted multi-user.");
    expect(product).toContain("## Platform — OPEN");
    expect(breadth).toContain("The UI exposes these as selectable evidence layers");
    expect(breadth).toMatch(/B4 — evidence.*True residual: Syzygy runtime rendering \+ full evidence-bound LLM rendering/u);
    expect(breadth).toMatch(/B8 — platform.*deployment shipped/u);
    expect(breadth).toMatch(/B10 — adaptive guidance.*shipped 2026-08-14/u);
    expect(run).toContain("*Nothing — within scope.* It is arithmetic over the position and makes no chess judgement.");
    expect(run).toContain("any rung may render in any form");
    expect(run).toMatch(/everything else is\s+the learner's per-context `AssistanceConfig`/u);
  });

  it("requires every amendment to name what remains open", () => {
    expect(INTENT_DEBT).toHaveLength(5);
    for (const row of INTENT_DEBT) {
      expect(row.requiredAmendment.length).toBeGreaterThan(80);
      expect(row.preserveOpen.length).toBeGreaterThan(20);
    }
  });

  it("emits the protected-intent handoff register", () => {
    const lines = [
      "# D640 protected-intent parity — raw output",
      "",
      "Five ruled/researched boundaries remain absent from living intent. F1/F12 may not draft until the relevant owner/Claude amendment lands.",
      "",
      "| ruling | intent home | contrary/stale text | required amendment | must remain open |",
      "|---|---|---|---|---|",
      ...INTENT_DEBT.map((row) => `| ${row.ruling} | ${row.home} | ${row.staleText} | ${row.requiredAmendment} | ${row.preserveOpen} |`),
      "",
    ];
    writeFileSync(OUT, lines.join("\n"));
  });
});
