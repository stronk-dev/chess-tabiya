// @vitest-environment happy-dom
// D3868: actual query → JSON → strict receiver → mounted seat. No caller-minted evidence.
import { tick } from "svelte";
import { afterEach, expect, it } from "vitest";
import {
  MODULE_IDS, MODULE_SOURCE_AUTHORITY, canonicalRunStart, commitMove,
  compileAssistanceRequest, compileAuthoritativeAssistance, createRun,
  finalizeAssistanceEffects, queryModules, revealFeedback, serverAvailabilityFromProviders,
} from "@chess-tabiya/runtime";
import { createComponentTestScope } from "./component-test-lifecycle.js";
import { parseModuleQueryPage, type ParsedModulePacket } from "./module-query-response.js";
import { composedSeats, type PlaySeatModule } from "./module-seats.js";
import ModuleSeats from "./ModuleSeats.svelte";

const scope = createComponentTestScope();
afterEach(async () => { await scope.cleanup(); document.body.replaceChildren(); });
const at = "2026-11-02T00:00:00.000Z";
const availability = serverAvailabilityFromProviders({ opponent: "external", judge: "external", llm: "external", corpus: "external", tts: "external", tablebase: "external" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "support", overrides: {},
  moduleOverrides: { include: [], exclude: MODULE_IDS.filter(id => id !== "threat_radar" && id !== "rules_floor") } } });
const assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(requested, {
  origin: { kind: "run", sessionKind: "position", feedbackPolicy: "attempt_end" },
  access: { deliveryOpen: true, role: "solo", seatedInContest: false, reviewing: false }, availability,
}), { authority: MODULE_SOURCE_AUTHORITY, availability });

it.each([
  ["white", "4k3/8/8/8/8/8/R7/4K3 w - - 0 1", "a2e2", "unavailable"],
  ["black", "4k3/r7/8/8/8/8/8/4K3 b - - 0 1", "a7e7", "unavailable"],
  ["white", "q6k/1B6/1nR5/8/8/8/7K/8 w - - 0 1", "c6b6", "available"],
  ["black", "8/7k/8/8/8/1Nr5/1b6/Q6K b - - 0 1", "c3b3", "available"],
] as const)("%s %s / %s: %s exposure survives the real receiver and seat", async (side, fen, move, state) => {
  const initial = createRun({ id: `threat-${side}`, session: { kind: "position", start: canonicalRunStart({ fen, side }),
    feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"c".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  const run = revealFeedback(commitMove(initial, move, { at }).run, at).run;
  const { page } = queryModules({ run, assistance, role: "learner", session: "position", request: {
    timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: ["threat_radar"],
  } });
  const parsed = parseModuleQueryPage(JSON.parse(JSON.stringify({ page })), {
    runId: run.id, subjectNodeId: run.activeCursor.nodeId, finalDigest: assistance.finalDigest,
  });
  const packet = parsed.packets.find(item => item.module === "threat_radar")!;
  if (state === "unavailable") {
    expect(packet.unavailable).toContainEqual({ projection: "derived.tactic.defender_exposure@2", reason: "invalid_turn_clone" });
    expect(packet.items).toHaveLength(0);
    expect(packet.empty?.kind).toBe("unavailable_source");
  } else {
    const exposure = packet.items.filter(item => item.evidenceRef?.projection.id === "derived.tactic.defender_exposure");
    expect(exposure, JSON.stringify({ empty: packet.empty, unavailable: packet.unavailable, items: packet.items })).toHaveLength(2);
    expect(exposure.every(item => item.evidenceRef!.projection.version === 2 && item.adapter.consumer.version === 2)).toBe(true);
    expect(exposure.find(item => item.component.id === "relation_overlay")?.component).toMatchObject({
      id: "relation_overlay", operand: { edges: [expect.objectContaining({ relation: "defends", sign: "lost" })] },
    });
    expect(exposure.some(item => item.component.id === "fact_statement" && item.component.operand.rendererId === "play.defender_exposure@1")).toBe(true);
  }
  const target = document.createElement("div"); document.body.append(target);
  scope.mount(ModuleSeats, { target, props: { seats: composedSeats(assistance), packets: new Map<PlaySeatModule, ParsedModulePacket>([["threat_radar", packet]]),
    pending: new Set<PlaySeatModule>(), failed: new Set<PlaySeatModule>(), expanded: "threat_radar", doorBlocked: {}, staged: undefined,
    onToggle: () => {}, onRequest: () => {}, onConfirmStaged: () => {}, onReviseStaged: () => {},
  } });
  await tick();
  if (state === "unavailable") expect(target.querySelector('[data-empty="unavailable_source"]')?.textContent).toBe("Some threat checks could not be completed for this position.");
  else expect(target.textContent).toContain("no longer defends");
  expect(target.textContent).not.toContain("No one-ply threat");
});
