import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it, vi } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceConventionReceipt, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import * as exchange from "./exchange.js";
import { evidenceValueRouteRegistry, invokeEvidenceValueRoute, type EvidenceValueRoute } from "./internal/evidence-value-routes.js";
import * as control from "./square-control.js";
import { defenderExposureValue } from "./internal/defender-exposure.js";

const ROUTE = "derived.tactic.defender_exposure@2";
const key = (value: { readonly id: string; readonly version: number }) => `${value.id}@${value.version}`;
function edge(fen: string, uci: string) {
  const position = positionFromFen(fen), beforeFen = canonicalFen(position);
  const move = normalizeMove(position, parseUci(uci)!);
  if (!position.isLegal(move)) throw new Error("exposure fixture must be a legal edge");
  position.play(move);
  return { beforeFen, moveUci: uci, afterFen: canonicalFen(position) };
}

const fixtures = [
  ["White two", "r3k3/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6", 2],
  ["Black two", "3k3r/8/8/8/5b2/6N1/6b1/3K3R b - - 0 1", "f4g3", 2],
  ["White one", "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6", 1],
  ["Black one", "3k3r/8/8/8/5b2/6N1/8/3K3R b - - 0 1", "f4g3", 1],
  ["White none", "r3k3/8/1n6/2B5/8/8/8/4K3 w - - 0 1", "c5b6", 0],
  ["Black none", "3k4/8/8/8/5b2/6N1/8/3K3R b - - 0 1", "f4g3", 0],
  ["White five", "r3k3/1P6/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6", 5],
  ["Black five", "3k3r/8/8/8/5b2/6N1/6p1/3K3R b - - 0 1", "f4g3", 5],
] as const;

describe("source-owned defender exposure (accepted F2 §2.3m)", () => {
  it.each(fixtures)("retains full positive payloads with exactly two genuine inputs: %s", (_name, fen, move, count) => {
    const anchor = edge(fen, move), result = invokeEvidenceValueRoute(ROUTE, anchor);
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw new Error("positive/no-witness fixture unexpectedly unavailable");
    expect(result.value).toHaveLength(count === 0 ? 0 : 1);
    // Transitional comparison to the genuinely used predecessor, not a compatibility promise.
    const predecessor = invokeEvidenceValueRoute("derived.tactic.defender_exposure@1", anchor);
    expect(result.value.map(item => item.evidence.payload)).toEqual(predecessor.map(item => item.evidence.payload));
    for (const item of result.value) {
      expect(item.inputs.map(value => key(value.projection))).toEqual([
        "rules.square.event.control@1", "rules.exchange.reading.landing_captures@1",
      ]);
      expect(evidenceValueReceipt(item.evidence).sourceDigests).toEqual(item.inputs.map(value => evidenceValueReceipt(value).payloadDigest));
      expect(item.evidence.payload.captures).toHaveLength(count);
      const population = item.inputs[1]!.payload as exchange.LandingCaptureReading;
      expect(item.evidence.payload.captures).toEqual(population.captures.filter(value => value.resultUnits > 0));
      expect(population.landingSquare).toBe(item.evidence.payload.target.square);
      expect(population.fen.split(" ")[1]).toBe(fen.split(" ")[1]);
      expect(population.fen.split(" ")[3]).toBe("-");
      expect(item.evidence.payload.controllerEvent).toEqual(item.inputs[0]!.payload);
      expect(item.evidence.payload.defender).toEqual(item.evidence.payload.controllerEvent.controller);
      expect(evidenceConventionReceipt(item.evidence)!.refs).toEqual(evidenceConventionReceipt(predecessor[0]!.evidence)!.refs);
      expect(Object.isFrozen(item.inputs)).toBe(true);
    }
  });

  it.each([
    ["White", "r2k4/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6"],
    ["Black", "3k3r/8/8/8/5b2/6N1/6b1/4K2R b - - 0 1", "f4g3"],
  ])("returns typed unavailable before control/capture acquisition on a legal checking edge: %s", (_side, fen, move) => {
    const anchor = edge(fen, move);
    const controls = vi.spyOn(control, "squareControlEvents"), captures = vi.spyOn(exchange, "legalCaptureMovesTo");
    try {
      expect(invokeEvidenceValueRoute(ROUTE, anchor)).toEqual({ kind: "unavailable", reason: "invalid_turn_clone" });
      expect(controls).not.toHaveBeenCalled();
      expect(captures).not.toHaveBeenCalled();
    } finally { controls.mockRestore(); captures.mockRestore(); }
  });

  it("rejects a wrong full after-FEN before collecting sources or returning empty", () => {
    const anchor = edge("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "e2e4");
    const controls = vi.spyOn(control, "squareControlEvents"), captures = vi.spyOn(exchange, "legalCaptureMovesTo");
    try {
      expect(() => invokeEvidenceValueRoute(ROUTE, { ...anchor, afterFen: anchor.beforeFen })).toThrow();
      expect(controls).not.toHaveBeenCalled();
      expect(captures).not.toHaveBeenCalled();
    } finally { controls.mockRestore(); captures.mockRestore(); }
  });

  it("accepts only the closed legal-edge construction arm, never caller sources or output", () => {
    const anchor = edge(fixtures[0][1], fixtures[0][2]);
    for (const extra of [{ captures: [] }, { control: {} }, { reading: {} }, { kind: "available" }]) {
      expect(() => invokeEvidenceValueRoute(ROUTE as EvidenceValueRoute, { ...anchor, ...extra } as never)).toThrow();
    }
    expect(evidenceValueRouteRegistry().find(value => value.route === ROUTE)).toMatchObject({ shape: "derived", result: "availability" });
  });

  it("has no partial public consumer/event cutover at this internal-source checkpoint", () => {
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => key(value) === ROUTE)!;
    expect(declaration).toMatchObject({ role: "event", grounding: "declared_convention", exactness: "convention",
      confidence: "not_applicable", answerContent: ["fact"], disposition: { kind: "experimental" },
      derivation: { inputs: [{ id: "rules.square.event.control", version: 1 }, { id: "rules.exchange.reading.landing_captures", version: 1 }] } });
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some(value => key(value.projection) === ROUTE)).toBe(false);
    expect(PRIMARY_EVIDENCE_MANIFEST.semanticEvents.some(value => key(value.projection) === ROUTE)).toBe(false);
  });

  function sources() {
    const anchor = edge(fixtures[0][1], fixtures[0][2]), result = invokeEvidenceValueRoute(ROUTE, anchor);
    if (result.kind !== "available" || result.value.length !== 1) throw new Error("expected one exposure");
    const item = result.value[0]!;
    return { anchor, item, controller: item.inputs[0] as DeclaredEvidence<control.SquareControlEvent>,
      reading: item.inputs[1] as DeclaredEvidence<exchange.LandingCaptureReading> };
  }

  it("rejects copied, serialized, truncated and reordered capture populations, even empty", () => {
    const { anchor, item, controller, reading } = sources();
    const copies = [
      { ...reading }, JSON.parse(JSON.stringify(reading)),
      { ...reading, payload: { ...reading.payload, captures: [] } },
      { ...reading, payload: { ...reading.payload, captures: reading.payload.captures.slice(1) } },
      { ...reading, payload: { ...reading.payload, captures: [...reading.payload.captures].reverse() } },
    ];
    for (const copy of copies) expect(() => defenderExposureValue(anchor, controller, copy)).toThrow();
    expect(() => defenderExposureValue(anchor, { ...controller }, reading)).toThrow();
    expect(defenderExposureValue(anchor, controller, reading)).toEqual(item.evidence.payload);
  });

  it("rejects genuine sources from another full position or landing square before empty decisions", () => {
    const { anchor, controller, reading } = sources();
    const fields = reading.payload.fen.split(" ");
    const counter = [...fields]; counter[4] = String(Number(counter[4]) + 1);
    const turn = [...fields]; turn[1] = turn[1] === "w" ? "b" : "w";
    for (const fen of [counter.join(" "), turn.join(" ")]) {
      const crossed = invokeEvidenceValueRoute("rules.exchange.reading.landing_captures@1", { fen, landingSquare: reading.payload.landingSquare });
      expect(crossed.payload.fen).not.toBe(reading.payload.fen);
      expect(() => defenderExposureValue(anchor, controller, crossed)).toThrow(/another position or target/u);
    }
    const empty = invokeEvidenceValueRoute("rules.exchange.reading.landing_captures@1", { fen: reading.payload.fen, landingSquare: "d4" });
    expect(empty.payload.captures).toEqual([]);
    expect(() => defenderExposureValue(anchor, controller, empty)).toThrow(/another position or target/u);
    const otherEdge = edge(fixtures[0][1], "c5d6");
    const foreignControl = invokeEvidenceValueRoute("rules.square.event.control@1", otherEdge)[0]!;
    expect(() => defenderExposureValue(anchor, foreignControl, empty)).toThrow(/another edge/u);
  });

  it("does not conflate a genuine en-passant position with its EP-cleared pass clone", () => {
    const anchor = edge("r3k3/1B6/1n6/2BPp3/8/8/8/R3K3 w - - 0 1", "c5b6");
    const result = invokeEvidenceValueRoute(ROUTE, anchor);
    if (result.kind !== "available" || result.value.length === 0) throw new Error("expected exposure with EP bystanders");
    const item = result.value[0]!, controller = item.inputs[0] as DeclaredEvidence<control.SquareControlEvent>;
    const reading = item.inputs[1] as DeclaredEvidence<exchange.LandingCaptureReading>;
    const fields = reading.payload.fen.split(" "); fields[3] = "e6";
    const crossed = invokeEvidenceValueRoute("rules.exchange.reading.landing_captures@1", { fen: fields.join(" "), landingSquare: reading.payload.landingSquare });
    expect(crossed.payload.fen.split(" ")[3]).toBe("e6");
    expect(() => defenderExposureValue(anchor, controller, crossed)).toThrow(/another position or target/u);
  });

  it("rejects genuine wrong projection identities rather than reading similar payloads", () => {
    const { anchor, controller, reading } = sources();
    const singleCapture = invokeEvidenceValueRoute("rules.exchange.predicate.legal_exchange@1", {
      fen: reading.payload.fen, captureUci: reading.payload.captures[0]!.captureUci,
    })[0]!;
    expect(() => defenderExposureValue(anchor, controller, singleCapture as unknown as typeof reading)).toThrow(/complete landing-capture source/u);
    expect(() => defenderExposureValue(anchor, reading as unknown as typeof controller, reading)).toThrow(/square-control source/u);
  });
});
