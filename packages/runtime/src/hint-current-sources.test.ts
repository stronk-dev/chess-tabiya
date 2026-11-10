// Accepted hint-distance §3a: actual source → packet → selected owner → exact-rung factory →
// module → JSON receipt. These cases add current-version falsifiers, not semantic qualification.
import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceConventionReceipt, evidenceValueReceipt } from "./evidence-contract.js";
import { HINT_COMPILER_VERSION, compileGuidedHintPacket, compileHintDeliveryReceipt, compileHintDisclosureV2, selectHintHorizon } from "./hint-distance.js";
import { hintDecisionStamp, hintReceiptDigest, hintRequestId, parseHintDeliveryReceipt } from "./hint-exchange.js";
import { HINT_DECLARATION_MATRIX, HINT_RUNGS, hintDeclarationRow } from "./hint-registry.js";
import { evidenceValueRouteRegistry, invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { createRun, revealFeedback } from "./runtime.js";
import { HINT_FAMILY_POSITIVES, HINT_ROOT, hintPackets, sealedHintLine, selectFixture } from "./testing/hint-fixture.js";

const key = (ref: { readonly id: string; readonly version: number }) => `${ref.id}@${ref.version}`;
const invoke = (route: string, input: unknown): unknown => invokeEvidenceValueRoute(route as never, input as never);

describe("sole current Guided Hint source/receipt image", () => {
  it.each([
    ["white", "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1", "b5c7"],
    ["black", "4k3/8/8/8/1n6/8/8/R3K3 b - - 0 1", "b4c2"],
  ])("retains %s's nonterminal fork through the actual current selected owner", (_side, fen, move) => {
    const selection = selectFixture(fen, [move]);
    if (selection.kind !== "selected") throw new Error("Expected a genuine local fork");
    expect(selection.horizon.payload.family).toBe("fork_survives_reply");
    expect(selection.horizon.projection.version).toBe(2);
    expect(compileHintDisclosureV2(selection.horizon, "pattern").projection.version).toBe(2);
  });

  it.each([
    ["white mate", "R5rk/5Q2/6K1/8/8/8/8/8 w - - 0 1", "f7g7", "mate_in_one"],
    ["black mate", "8/8/8/8/8/6k1/5q2/r5RK b - - 0 1", "f2g2", "mate_in_one"],
    ["white stalemate", "5K1k/6pp/7R/6Q1/3B4/8/8/8 w - - 0 1", "g5g6", "double_attack"],
    ["black stalemate", "8/8/8/3b4/6q1/7r/6PP/5k1K b - - 0 1", "g4g3", "double_attack"],
  ])("%s cannot disclose vacuous all-reply fork survival or hide the unchanged family", (_name, fen, move, family) => {
    const selection = selectFixture(fen, [move]);
    if (selection.kind !== "selected") throw new Error("Expected unchanged geometric/mate evidence");
    expect(selection.horizon.payload.family).toBe(family);
    const disclosure = compileHintDisclosureV2(selection.horizon, "pattern");
    const packet = compileGuidedHintPacket({ disclosure, role: "learner", session: "position" });
    if (packet.kind !== "rendered") throw new Error("Expected unchanged family admission");
    expect(packet.view.items[0]!.sentences.join(" ")).not.toContain("after every reply");
  });

  it("retains exactly ten successor rungs and twenty-five unchanged rungs, not two executable images", () => {
    const refs = HINT_DECLARATION_MATRIX.flatMap(row => Object.values(row.disclosures));
    expect(refs).toHaveLength(35);
    expect(refs.filter(ref => ref.version === 2)).toHaveLength(10);
    expect(refs.filter(ref => ref.version === 1)).toHaveLength(25);
    const routes = evidenceValueRouteRegistry().map(row => row.route);
    for (const family of ["fork_survives_reply", "promotion_pressure"] as const) {
      expect(routes).toContain(`derived.hint.horizon.${family}@2`);
      expect(routes).not.toContain(`derived.hint.horizon.${family}@1`);
      for (const rung of HINT_RUNGS) {
        expect(routes).toContain(`derived.hint.disclosure.${family}.${rung}@2`);
        expect(routes).not.toContain(`derived.hint.disclosure.${family}.${rung}@1`);
      }
    }
    expect(PRIMARY_EVIDENCE_MANIFEST.consumers.filter(value => value.id === "module.guided_hint").map(value => value.version)).toEqual([2]);
  });

  it.each(["fork_survives_reply", "promotion_pressure"] as const)("keeps %s's complete source/convention identity through every JSON rung", family => {
    const fixture = HINT_FAMILY_POSITIVES[family], line = sealedHintLine(fixture.fen, fixture.moves), packets = hintPackets(line);
    const selection = selectHintHorizon({ root: { ...HINT_ROOT, fen: fixture.fen }, line, packets });
    if (selection.kind !== "selected") throw new Error("Expected admitted occurrence");
    const row = hintDeclarationRow(family), horizon = selection.horizon;
    expect(horizon.payload.family).toBe(family);
    expect(horizon.projection).toEqual(row.horizon);
    const original = packets[0]!.packet.candidates.find(candidate => candidate.moveUci === fixture.moves[0])!.readings.find(value => key(value.projection) === key(row.source))!;
    expect(evidenceValueReceipt(horizon).sourceDigests).toEqual([evidenceValueReceipt(original).payloadDigest, evidenceValueReceipt(line).payloadDigest]);
    const expected = family === "fork_survives_reply" ? ["double-attack@1", "fork-survival@2", "legal-exchange@1"] : ["promotion-pressure-geometry@1"];
    expect(evidenceConventionReceipt(horizon)!.refs.map(key)).toEqual(expected);
    const run = revealFeedback(createRun({ id: HINT_ROOT.runId,
      session: { kind: "position", start: { fen: fixture.fen, side: family === "fork_survives_reply" ? "black" : "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"0".repeat(64)}`, seed: 1,
      createdAt: "2026-11-02T00:00:00Z", policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } }), "2026-11-02T00:00:01Z").run;
    for (const rung of HINT_RUNGS) {
      const disclosure = compileHintDisclosureV2(horizon, rung);
      expect(disclosure.projection).toEqual(row.disclosures[rung]);
      expect(evidenceValueReceipt(disclosure).sourceDigests).toEqual([evidenceValueReceipt(horizon).payloadDigest]);
      expect(evidenceConventionReceipt(disclosure)!.refs.map(key)).toEqual(expected);
      const packet = compileGuidedHintPacket({ disclosure, role: "learner", session: "position" });
      if (packet.kind !== "rendered") throw new Error("Expected actual module admission");
      const receipt = compileHintDeliveryReceipt({ requestId: "a".repeat(32), runId: run.id, decision: hintDecisionStamp(run), packet, voice: { state: "not_requested" } });
      expect(receipt).toMatchObject({ version: 2, projectionVersion: 2, family, rung });
      expect(parseHintDeliveryReceipt(JSON.parse(JSON.stringify(receipt)))).toEqual(receipt);
      const retag = (changes: object) => { const { receiptDigest: _digest, ...body } = { ...receipt, ...changes }; return { ...body, receiptDigest: hintReceiptDigest(body) }; };
      for (const projectionVersion of [0, 1, 3, undefined]) expect(() => parseHintDeliveryReceipt(retag({ projectionVersion }))).toThrow();
      expect(() => parseHintDeliveryReceipt(retag({ version: 1 }))).toThrow();
      const { projectionVersion: _version, ...oldShape } = retag({ version: 1 });
      expect(() => parseHintDeliveryReceipt(oldShape)).toThrow();
    }
    // Valid direct factory minting still does not confer selector ownership.
    const rebuilt = invoke(key(row.horizon), { source: original, line, ply: 1 }) as { value: typeof horizon };
    expect(() => compileHintDisclosureV2(rebuilt.value, "move")).toThrow(/not selected and owned/u);
    const edge = packets[0]!.packet.candidates.find(candidate => candidate.moveUci === fixture.moves[0])!;
    const oldSource = invoke(family === "fork_survives_reply" ? "derived.tactic.fork_survives_reply@1" : "derived.tactic.promotion_pressure@1",
      family === "fork_survives_reply" ? { doubleAttack: edge.events.find(value => value.projection.id === "rules.tactic.event.double_attack")!.evidence,
        breadth: edge.events.find(value => value.projection.id === "rules.tactic.consequence.reply_breadth")!.evidence } : { fen: edge.afterFen });
    expect(oldSource).toBeDefined();
    expect(() => invoke(key(row.horizon), { source: oldSource, line, ply: 1 })).toThrow();
  });

  it("separates current request identities from compiler1 even for unchanged family projections", () => {
    expect(HINT_COMPILER_VERSION).toBe("guided_hint_compiler@2");
    const input = { clientRequestId: "0".repeat(32), decisionDigest: "decision", rung: "pattern" as const, manifestDigest: "manifest", source: "search" };
    expect(hintRequestId({ ...input, compiler: HINT_COMPILER_VERSION })).not.toBe(hintRequestId({ ...input, compiler: "guided_hint_compiler@1" }));
  });
});
