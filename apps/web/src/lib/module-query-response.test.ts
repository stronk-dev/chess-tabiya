// @vitest-environment happy-dom
// D3948: actual module source/query → JSON → receipt parser → existing learner seat.
import { tick } from "svelte";
import { afterEach, expect, it } from "vitest";
import {
  MODULE_IDS, MODULE_SOURCE_AUTHORITY, canonicalRunStart, commitMove, compileAssistanceRequest,
  compileAuthoritativeAssistance, createRun, factStatementOperand, finalizeAssistanceEffects,
  moduleDisclosureDigest, presentationDigest, queryModules, revealFeedback, serverAvailabilityFromProviders,
  type PresentationReceipt,
} from "@chess-tabiya/runtime";
import { createComponentTestScope } from "./component-test-lifecycle.js";
import { parseModuleQueryPage, type ParsedModulePacket } from "./module-query-response.js";
import { composedSeats, type PlaySeatModule } from "./module-seats.js";
import ModuleSeats from "./ModuleSeats.svelte";

const scope = createComponentTestScope();
afterEach(async () => { await scope.cleanup(); document.body.replaceChildren(); });
const at = "2026-11-03T00:00:00.000Z";

function fixture() {
  const availability = serverAvailabilityFromProviders({ opponent: "external", judge: "external", llm: "external", corpus: "external", tts: "external", tablebase: "external" });
  const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "support", overrides: { guided: "live" },
    moduleOverrides: { include: ["structure_nudge"], exclude: MODULE_IDS.filter(id => id !== "structure_nudge" && id !== "rules_floor") } } });
  const assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(requested, {
    origin: { kind: "run", sessionKind: "position", feedbackPolicy: "attempt_end" },
    access: { deliveryOpen: true, role: "solo", seatedInContest: false, reviewing: false }, availability,
  }), { authority: MODULE_SOURCE_AUTHORITY, availability });
  const initial = createRun({ id: "d3948-structure", session: { kind: "position", start: canonicalRunStart({
    fen: "r1bqkbnr/pp1ppp1p/2n3p1/8/2PNP3/8/PP3PPP/RNBQKB1R b KQkq - 0 5", side: "black",
  }), feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"c".repeat(64)}`,
  policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  const run = revealFeedback(commitMove(initial, "g8f6", { at }).run, at).run;
  const { page } = queryModules({ run, assistance, role: "learner", session: "position", request: {
    timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: ["structure_nudge"],
  } });
  return { page, assistance, expected: { runId: run.id, subjectNodeId: run.activeCursor.nodeId, finalDigest: assistance.finalDigest } };
}

function redigest(receipt: PresentationReceipt): PresentationReceipt {
  const items = receipt.items.map(({ componentDigest: _digest, ...body }) => ({ ...body, componentDigest: presentationDigest("presentation.component@1", body) }));
  return { ...receipt, items, digest: presentationDigest("presentation.receipt@1", items) };
}

it("renders the actual recognized-structure query in its existing learner seat", async () => {
  const { page, assistance, expected } = fixture();
  const parsed = parseModuleQueryPage(JSON.parse(JSON.stringify({ page })), expected);
  const packet = parsed.packets.find(row => row.module === "structure_nudge")!;
  expect(packet, JSON.stringify({ page, assistance })).toBeDefined();
  expect(packet.items).toHaveLength(1);
  expect(packet.items[0]!.adapter.projection).toEqual({ id: "rules.structural.reading.named_structure", version: 2 });
  const target = document.createElement("div"); document.body.append(target);
  scope.mount(ModuleSeats, { target, props: { seats: composedSeats(assistance), packets: new Map<PlaySeatModule, ParsedModulePacket>([["structure_nudge", packet]]),
    pending: new Set<PlaySeatModule>(), failed: new Set<PlaySeatModule>(), expanded: "structure_nudge", doorBlocked: {}, staged: undefined,
    onToggle: () => {}, onRequest: () => {}, onConfirmStaged: () => {}, onReviseStaged: () => {},
  } });
  await tick();
  expect(target.textContent).toContain("Maroczy Bind");
  expect(target.textContent).not.toContain("play.named_structure");
});

it.each(["renderer", "binding", "convention"] as const)("refuses a re-digested actual module %s swap before display", field => {
  const { page, expected } = fixture();
  expect(page.packets.some(packet => packet.module === "structure_nudge"), JSON.stringify(page)).toBe(true);
  const packets = page.packets.map(packet => {
    if (packet.module !== "structure_nudge") return packet;
    expect(packet.receipt.items).toHaveLength(1);
    const items = packet.receipt.items.map(item => {
      if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "play.named_structure@1") throw new Error("Expected actual named-structure delivery");
      const operand = field === "renderer"
        ? factStatementOperand("play.castling_rights@1", "declared_convention", "board-rules@1", { white: { kingside: false, queenside: false }, black: { kingside: false, queenside: false } })
        : factStatementOperand("play.named_structure@1", field === "binding" ? "recorded_run" : "declared_convention",
          field === "convention" ? "pawn-structure@1" : "structure-catalogue@1", item.component.operand.operands);
      return { ...item, component: { id: "fact_statement" as const, operand } };
    });
    const receipt = redigest({ ...packet.receipt, items });
    const { digest: _digest, ...body } = packet.disclosure;
    const disclosure = { ...body, componentDigests: receipt.items.map(item => item.componentDigest) };
    return { ...packet, receipt, disclosure: { ...disclosure, digest: moduleDisclosureDigest(disclosure) } };
  });
  expect(() => parseModuleQueryPage(JSON.parse(JSON.stringify({ page: { ...page, packets } })), expected)).toThrow(/registered|renderer|binding|convention/u);
});
