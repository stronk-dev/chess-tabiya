// DISPOSABLE planning harness — D639. It checks routing completeness, not research truth itself.
import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { RESEARCH_TRUTH, RFC_READINESS } from "./registry.js";

const ROOT = new URL("../../", import.meta.url);
const OUT = new URL("./output.md", import.meta.url);
function source(path: string): string { return readFileSync(new URL(path, ROOT), "utf8"); }
function ids(text: string, prefix: string): readonly string[] {
  return [...text.matchAll(new RegExp(`^\\| (${prefix}\\d+) \\|`, "gmu"))].map((match) => match[1]!).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

describe("D639 research sufficiency and RFC readiness", () => {
  it("covers every R, O and F node exactly once in its authoritative queue", () => {
    const researchIds = ids(source("planning/platform-alignment/research-queue.md"), "R");
    const decisionIds = ids(source("planning/platform-alignment/decision-queue.md"), "O");
    const candidateIds = ids(source("planning/platform-alignment/rfc-graph.md"), "F");
    expect(researchIds).toEqual(Array.from({ length: 19 }, (_, index) => `R${index + 1}`));
    expect(RESEARCH_TRUTH.map((row) => row.id)).toEqual(researchIds);
    expect(decisionIds).toEqual(Array.from({ length: 15 }, (_, index) => `O${index}`));
    expect(candidateIds).toEqual(Array.from({ length: 12 }, (_, index) => `F${index + 1}`));
    expect(RFC_READINESS.map((row) => row.id)).toEqual(candidateIds);
  });

  it("refuses to call protocols, blind packets or mechanical audits complete human evidence", () => {
    expect(RESEARCH_TRUTH.filter((row) => row.state === "done")).toHaveLength(5);
    expect(RESEARCH_TRUTH.filter((row) => row.state === "partial_external")).toHaveLength(4);
    expect(RESEARCH_TRUTH.filter((row) => row.state === "external_ready")).toHaveLength(1);
    expect(RESEARCH_TRUTH.filter((row) => row.state === "blocked")).toHaveLength(9);
    for (const row of RESEARCH_TRUTH.filter((candidate) => candidate.state !== "done")) {
      expect(row.missing).not.toBe("");
    }
  });

  it("allows only F1 and F12 to be research-ready and still names their non-research blocker", () => {
    const ready = RFC_READINESS.filter((row) => row.state !== "research_blocked");
    expect(ready.map((row) => row.id)).toEqual(["F1", "F12"]);
    expect(ready[0]!.reason).toContain("protected intent amendment");
    expect(ready[0]!.reason).toContain("shared-register/lifecycle");
    expect(ready[1]!.reason).toContain("protected design amendment");
  });

  it("emits the research sufficiency report", () => {
    const lines = [
      "# D639 research sufficiency — raw output",
      "",
      "Research nodes: 19. Complete internal evidence: 5. Partial/external: 4. External-ready protocol only: 1. Blocked: 9.",
      "Candidate RFC nodes: 12. Research-ready but legally blocked: F1 and F12. Research-blocked: F2-F11.",
      "",
      "## Research truth",
      "",
      "| ID | state | sufficient for | exact residue |",
      "|---|---|---|---|",
      ...RESEARCH_TRUTH.map((row) => `| ${row.id} | \`${row.state}\` | ${row.sufficientFor} | ${row.missing} |`),
      "",
      "## Candidate RFC readiness",
      "",
      "| node | state | reason |",
      "|---|---|---|",
      ...RFC_READINESS.map((row) => `| ${row.id} | \`${row.state}\` | ${row.reason} |`),
      "",
      "## Verdict",
      "",
      "Research is sufficient for the evidence-registry architecture (F1) and Choice-C release-platform architecture (F12), but neither may draft until its protected intent/process gate is closed. It is not sufficient for exact guidance defaults, Review Map semantics, theory-to-drill workflow, human-like bot claims, longitudinal coaching, campaign, coach/streamer composition or social/federation scope. Those gaps require the named participant/workflow evidence; more desk taxonomy would not close them.",
      "",
    ];
    writeFileSync(OUT, lines.join("\n"));
  });
});

