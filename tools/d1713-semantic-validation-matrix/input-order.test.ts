// DISPOSABLE D4170 research. Genuine production events characterize receipt ordering;
// no chess oracle, validation case, production policy or rollout is added here.
import { describe, expect, it } from "vitest";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/position-cache.js";
import { evidenceValueReceipt, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { compileSemanticEvidenceEvent, localSemanticEvents } from "../../packages/runtime/src/semantic-evidence.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";

describe("D4170 actual factory receipt input order", () => {
  it.each([
    ["white", "r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1", "a1a7"],
    ["black", "r3k3/8/8/8/8/8/P7/R3K3 b - - 0 1", "a8a2"],
  ])("records genuine %s capture-class joins without manufacturing an output", (side, fen, uci) => {
    const before = positionFromFen(fen!), move = normalizeMove(before, parseUci(uci!)!), beforeFen = canonicalFen(before);
    expect(before.isLegal(move)).toBe(true); before.play(move);
    const event = localSemanticEvents(beforeFen, uci!, canonicalFen(before)).find(e => e.projection.id === "derived.exchange.capture_class");
    expect(event).toBeDefined(); if (event === undefined) throw Error("Actual shared closure did not emit capture class");
    expect(event.derivationInputs.map(e => e.projection.id)).toEqual(["rules.transition.event.capture", "rules.exchange.predicate.legal_exchange"]);
    expect(evidenceValueReceipt(event.evidence).sourceDigests).toEqual(event.derivationInputs.map(e => evidenceValueReceipt(e).payloadDigest));
    const attempt = (inputs: readonly DeclaredEvidence<unknown>[]) => {
      try { const result = compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: event.evidence, derivationInputs: inputs, anchor: event.anchor, sign: event.sign }); return { accepted: true, id: result.id }; }
      catch (e) { return { accepted: false, code: e instanceof Error ? e.message : String(e) }; }
    };
    const original = attempt(event.derivationInputs), reversed = attempt([...event.derivationInputs].reverse());
    expect(original.accepted).toBe(true);
    const missing = attempt(event.derivationInputs.slice(0, 1));
    const duplicate = attempt([event.derivationInputs[0]!, event.derivationInputs[0]!]);
    const extra = attempt([...event.derivationInputs, event.derivationInputs[0]!]);
    expect(missing.accepted).toBe(false); expect(duplicate.accepted).toBe(false); expect(extra.accepted).toBe(false);
    console.log(JSON.stringify({ question: "D4170", side, projection: `${event.projection.id}@${event.projection.version}`, inputs: event.derivationInputs.length,
      originalAccepted: original.accepted, reversedAccepted: reversed.accepted, sameIdIfReversed: reversed.accepted && reversed.id === original.id,
      missingAccepted: missing.accepted, duplicateAccepted: duplicate.accepted, extraAccepted: extra.accepted }));
  });
});

// D4167 reader preflight: original authority spelling and canonical payload differ legally.
describe("D4167 genuine castling alias source authority", () => {
  it.each([
    ["white", "8/8/8/8/8/6k1/8/4K2R w K - 0 1", "e1g1", "e1h1"],
    ["black", "4k2r/8/6K1/8/8/8/8/8 b k - 0 1", "e8g8", "e8h8"],
  ])("retains actual %s authority spelling without changing canonical source operands", (side, fen, alias, canonical) => {
    const position = positionFromFen(fen!), move = normalizeMove(position, parseUci(alias!)!);
    expect(position.isLegal(move)).toBe(true); position.play(move);
    const snapshot = (at: string) => {
      const result = invokeEvidenceValueRoute("rules.structural.reading.king_opposition@3", { position: invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: at }) });
      if (result.kind !== "available") throw Error("Real opposition snapshot unavailable");
      return result.value;
    };
    const before = snapshot(fen!), after = snapshot(canonicalFen(position));
    const collect = (moveUci: string) => {
      const result = invokeEvidenceValueRoute("rules.structural.event.king_opposition@2", { before, moveUci, after });
      if (result.kind !== "available" || result.value.length !== 1) throw Error("Expected real gained opposition source");
      return result.value[0]!;
    };
    const original = collect(alias!), normalized = collect(canonical!);
    expect(original.payload.moveUci).toBe(canonical);
    expect(original.payload.sign).toBe("gained");
    expect(original.payload).toEqual(normalized.payload);
    expect(evidenceValueReceipt(original).payloadDigest).toBe(evidenceValueReceipt(normalized).payloadDigest);
    expect(evidenceValueReceipt(original).inputDigest).not.toBe(evidenceValueReceipt(normalized).inputDigest);
    console.log(JSON.stringify({ question: "D4167", side, alias, canonical, actualSources: 2, samePayload: true, distinctInputAuthority: true }));
  });
});
