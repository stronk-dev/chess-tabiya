// DISPOSABLE research harness — platform-alignment R7. Not production code.
import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  PRIMARY_EVIDENCE_MANIFEST,
  commitMove,
  createRun,
  selectLocalSemanticEvidence,
  storyMoments,
} from "@chess-tabiya/runtime";

const ROOT = new URL("../../", import.meta.url);
const OUTPUT = new URL("./output.md", import.meta.url).pathname;
const at = "2026-08-21T21:00:00.000Z";
const digest = `sha256:${"7".repeat(64)}`;

function source(path: string): string { return readFileSync(new URL(path, ROOT), "utf8"); }

function castlingRun() {
  const beforeFen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
  const run = createRun({
    id: "r7-castle",
    session: { kind: "position", start: { fen: beforeFen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: digest,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 7,
    createdAt: at,
  });
  return { beforeFen, run: commitMove(run, "e1g1", { actor: "user", at }).run };
}

describe("R7 shipped Review Story audit", () => {
  it("proves F2 exact events and the current Story selector are separate paths", () => {
    const fixture = castlingRun();
    const node = fixture.run.nodes.at(-1)!;
    const selected = selectLocalSemanticEvidence({ id: "research.r2_candidate", version: 1 }, {
      beforeFen: fixture.beforeFen,
      moveUci: "e1g1",
      afterFen: node.fen,
    });
    const story = storyMoments(fixture.run, fixture.run.activeCursor.branchId);
    expect(selected.selected.some((fact) => fact.event.projection.id === "rules.transition.event.castled")).toBe(true);
    expect(story.evidence.some((evidence) => evidence.projection.id === "rules.transition.event.castled")).toBe(false);
    expect(story.moments.flatMap((moment) => moment.kinds)).toContain("irreversibility");
  });

  it("finds no semantic-event or avoidance projection in the compiled review.story consumer", () => {
    const consumer = PRIMARY_EVIDENCE_MANIFEST.consumers.find((value) => value.id === "review.story")!;
    expect(consumer.accepts.some((projection) => projection.id.includes(".event.") || projection.id.startsWith("derived.semantic_avoidance."))).toBe(false);
  });

  it("pins the private/public top-eight mismatch and false engine-only social footer", () => {
    const screen = source("apps/web/src/lib/GameStoryScreen.svelte");
    const service = source("apps/server/src/service.ts");
    expect(screen).toContain("story.rank.slice(0, 8)");
    expect(service).toContain("story.moments.slice(0,8)");
    expect(screen).toContain("rendered from recorded engine evidence · Tabiya");
    expect(screen).toContain("selected.sentences[0]");
  });

  it("counts one per-moment action door and emits the read-only baseline", () => {
    const screen = source("apps/web/src/lib/GameStoryScreen.svelte");
    const momentActionLabels = (screen.match(/>Re-enter and play from here<\/button>/g) ?? []).map(() => "Re-enter and play from here");
    expect(momentActionLabels).toEqual(["Re-enter and play from here"]);
    expect(screen).not.toMatch(/Open cited theory|Start a drill|Compare attempts/);

    const consumer = PRIMARY_EVIDENCE_MANIFEST.consumers.find((value) => value.id === "review.story")!;
    const rows = [
      "# R7 current Review Story baseline",
      "",
      "Disposable read-only research output; not a product specification.",
      "",
      `- review.story declared projections: ${consumer.accepts.length}`,
      `- F2 semantic/avoidance projections admitted: ${consumer.accepts.filter((projection) => projection.id.includes(".event.") || projection.id.startsWith("derived.semantic_avoidance.")).length}`,
      `- Per-moment replay/theory/drill/compare action labels: ${momentActionLabels.length} (${momentActionLabels.join(", ")})`,
      "- Private bound: rank top 8, then chronological display.",
      "- Public bound: chronological first 8; rank ignored.",
      "- Download card: first sentence only; engine-only footer regardless of admitted source.",
      "- Current selector families: pivotal marker, ≥150 cp eval pivot, last-level convention, first endgame, shape span, outcome/result.",
      "- Current ranking: fixed kind priority, then absolute recorded-eval delta, then ply.",
      "",
    ];
    writeFileSync(OUTPUT, rows.join("\n"));
  });
});
