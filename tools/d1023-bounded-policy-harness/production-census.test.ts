// rfc/bounded-policy-targets.md acceptance criterion 1 / 15: the D1023 census rerun through the
// production service (`boundedTargetSourceEvidence` + `BoundedTargetBackgroundService.submit`).
// Permanent instrument behind `make bounded-target-census`; it records contrary evidence rather
// than adjusting a threshold.
import { writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { createBoundedTargetBackgroundService, type BoundedTargetBatchCompleted } from "../../packages/runtime/src/bounded-target.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { boundedTargetSourceEvidence } from "../../packages/runtime/src/evidence-operations.js";
import { authoredRows, importedRows, type ResearchRow } from "../research-chess/populations.js";

const OUTPUT = new URL("./production-census-output.md", import.meta.url).pathname;

interface Census {
  readonly decisions: number;
  readonly decisionsWithTargets: number;
  readonly targets: number;
  readonly playedRemoved: number;
  readonly playedPreserved: number;
  readonly playedIdentityLost: number;
  readonly alternativeRemoved: number;
  readonly alternativePreserved: number;
  readonly alternativeIdentityLost: number;
  readonly playedReintroduced: number;
  readonly playedUniversal: number;
  readonly budgetExhausted: number;
  readonly maxPairs: number;
  readonly maxBatchVisited: number;
  readonly positionP95Ms: number;
  readonly positionMaxMs: number;
}

const percentile = (values: readonly number[], fraction: number): number => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted.length === 0 ? 0 : sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)]!;
};

async function census(rows: readonly ResearchRow[]): Promise<Census> {
  const service = createBoundedTargetBackgroundService();
  let decisionsWithTargets = 0, targets = 0, maxPairs = 0, maxBatchVisited = 0, budgetExhausted = 0;
  let playedRemoved = 0, playedPreserved = 0, playedIdentityLost = 0, alternativeRemoved = 0, alternativePreserved = 0, alternativeIdentityLost = 0, playedReintroduced = 0, playedUniversal = 0;
  const durations: number[] = [];
  for (const row of rows) {
    const source = boundedTargetSourceEvidence(row.parentFen);
    if (source.exchanges.length === 0) continue;
    const started = performance.now();
    const result = await service.submit({ kind: "source_position_batch", ...source }, new AbortController().signal);
    durations.push(performance.now() - started);
    if (result.kind !== "completed") throw new Error(`${row.id}: ${result.kind} ${"reason" in result ? result.reason : ""}`);
    const completed = result as BoundedTargetBatchCompleted;
    decisionsWithTargets += 1;
    targets += completed.targets.length;
    maxBatchVisited = Math.max(maxBatchVisited, completed.visitedPositions);
    maxPairs = Math.max(maxPairs, completed.targets.reduce((total, target) => total + target.candidates.length, 0));
    for (const target of completed.targets) for (const candidate of target.candidates) {
      const uci = candidate.kind === "abstained" ? candidate.candidateUci : candidate.immediate.payload.candidateUci;
      const played = uci === row.uci;
      if (candidate.kind === "abstained") { if (played) playedIdentityLost += 1; else alternativeIdentityLost += 1; continue; }
      if (candidate.kind === "preserved") { if (played) playedPreserved += 1; else alternativePreserved += 1; continue; }
      if (played) playedRemoved += 1; else alternativeRemoved += 1;
      if (candidate.boundedReturn.kind === "abstained") { budgetExhausted += 1; continue; }
      if (!played) continue;
      const outcome = candidate.boundedReturn.item.payload.outcome.kind;
      if (outcome !== "not_reintroduced") playedReintroduced += 1;
      if (outcome === "survives_every_defence") playedUniversal += 1;
    }
  }
  await service.close();
  return { decisions: rows.length, decisionsWithTargets, targets, playedRemoved, playedPreserved, playedIdentityLost, alternativeRemoved, alternativePreserved, alternativeIdentityLost, playedReintroduced, playedUniversal, budgetExhausted, maxPairs, maxBatchVisited, positionP95Ms: percentile(durations, 0.95), positionMaxMs: Math.max(0, ...durations) };
}

const rate = (removed: number, preserved: number): number => removed / Math.max(1, removed + preserved);

describe("D1023 census through the production bounded-target service", () => {
  it("reproduces the measured lift, reintroduction and all-defences counts, or records the difference", async () => {
    const authored = await census(authoredRows());
    const imported = await census(importedRows());
    const line = (name: string, value: Census) => {
      const lift = rate(value.playedRemoved, value.playedPreserved) / rate(value.alternativeRemoved, value.alternativePreserved);
      return `| ${name} | ${value.decisionsWithTargets}/${value.decisions} | ${value.targets} | ${value.playedRemoved} / ${value.playedPreserved} / ${value.playedIdentityLost} | ${value.alternativeRemoved} / ${value.alternativePreserved} / ${value.alternativeIdentityLost} | ${lift.toFixed(2)}x | ${value.playedReintroduced}/${value.playedRemoved} | ${value.playedUniversal}/${value.playedRemoved} | ${value.budgetExhausted} | ${value.maxPairs} | ${value.maxBatchVisited} | ${value.positionP95Ms.toFixed(1)} / ${value.positionMaxMs.toFixed(1)} ms |`;
    };
    writeFileSync(OUTPUT, [
      "# D1023 census through production symbols",
      "",
      `Generated by \`make bounded-target-census\` over the primary manifest ${PRIMARY_EVIDENCE_MANIFEST.digest.slice(0, 16)}… with \`boundedTargetSourceEvidence\` and \`BoundedTargetBackgroundService.submit\` (default limits). A target is one positive material capture of \`threat@1\`; \`removed\`/\`preserved\` are exact local facts, not grades.`,
      "",
      "| population | decisions with target | targets | played removed / preserved / identity-lost | alternatives removed / preserved / identity-lost | removal lift | played reintroduced | played survives every defence | budget-exhausted | max pairs | max batch visited | position p95 / max |",
      "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
      line("authored pack spines", authored),
      line("sealed imported fixed-ply sample", imported),
      "",
    ].join("\n"));
    // Contrary evidence against the D1023 research receipt (exact-census-output.md: authored 120/27,
    // 69 reintroduced, 2 universal, 4.10x; imported 188/67, 130, 0, 2.85x), recorded rather than
    // hidden: (1) the harness replayed a pawn's tracked capture as `{from,to}` without its promotion
    // role, so eight e7xd8/e7xf8 promotion-capture targets at PjNuhBw6#32 were misread as
    // `capture_illegal`; production keeps the source capture's role and reads them `preserved`;
    // (2) the harness dropped positive captures that also mate, while §4 admits every positive
    // material exchange of the threat reading (+2 authored, +1 imported targets).
    expect([authored.playedRemoved, authored.playedPreserved, authored.playedReintroduced, authored.playedUniversal]).toEqual([122, 27, 71, 2]);
    expect([imported.playedRemoved, imported.playedPreserved, imported.playedReintroduced, imported.playedUniversal]).toEqual([180, 76, 130, 0]);
    expect(rate(authored.playedRemoved, authored.playedPreserved) / rate(authored.alternativeRemoved, authored.alternativePreserved)).toBeCloseTo(4.12, 2);
    expect(rate(imported.playedRemoved, imported.playedPreserved) / rate(imported.alternativeRemoved, imported.alternativePreserved)).toBeCloseTo(3.41, 2);
    // §4.1: the populations still refuse the request-thread envelope (some position ≥ 1,000 ms), and
    // the background envelope is enforced when BOUNDED_TARGET_TIMING=enforce (timings are host-load sensitive).
    expect(Math.max(authored.positionMaxMs, imported.positionMaxMs)).toBeGreaterThan(1_000);
    if (process.env.BOUNDED_TARGET_TIMING === "enforce") {
      expect(Math.max(authored.positionP95Ms, imported.positionP95Ms)).toBeLessThan(500);
      expect(Math.max(authored.positionMaxMs, imported.positionMaxMs)).toBeLessThan(5_000);
    }
    // Criterion 15: the fixed populations stay inside the admission ceilings.
    expect(Math.max(authored.maxPairs, imported.maxPairs)).toBeLessThanOrEqual(512);
    expect(Math.max(authored.maxBatchVisited, imported.maxBatchVisited)).toBeLessThan(100_000);
    expect(authored.budgetExhausted + imported.budgetExhausted).toBe(0);
  });
});
