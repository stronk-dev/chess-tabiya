import { describe, expect, it } from "vitest";
import { PROVIDER_RESPONSE_PARSERS } from "./provider-parsers.js";
import { maiaInferenceTaskCommandImage, normalizeProviderRequest } from "./provider-requests.js";
import { digestEngineOptionImage, providerUtf8 } from "./provider-digest.js";
import { maiaActual, maiaRequest, START_FEN, transcript } from "./provider-test-fixtures.js";
import type { MaiaInferenceTaskRequest, ProviderExecutionCapture } from "./provider-types.js";

const operation = "maia.inference_task@1";
const optionImage = { advertisedUciOptionLines: ["option name SelfElo type spin default 1400 min 0 max 3000", "option name OppoElo type spin default 1500 min 0 max 3000"], appliedSetoptionCommands: [] };
const request = (overrides: Partial<MaiaInferenceTaskRequest> = {}): MaiaInferenceTaskRequest => ({
  ...maiaRequest({ kind: "exact_fen", fen: START_FEN }), sampleRequestId: "00000000-0000-4000-8000-000000000001", ...overrides,
});
function parse(lines: readonly string[], raw = request()) {
  const identity = normalizeProviderRequest(operation, raw);
  const capture: ProviderExecutionCapture<typeof operation> = {
    endpoint: { kind: "uci_supervisor", engineId: "maia-5m" },
    actualIdentity: { ...maiaActual(), optionImage, optionImageDigest: digestEngineOptionImage(optionImage) },
    generation: 1, contentEncoding: "uci-utf8", transport: null,
    responseBytes: transcript(maiaInferenceTaskCommandImage(identity.request, optionImage), lines),
  };
  return PROVIDER_RESPONSE_PARSERS[operation].parse(capture, identity);
}

describe("accepted Maia sampled task, not policy argmax or observed learner move", () => {
  it("keeps latest canonical move rows, rank gaps, missing mass and independent terminal sample", () => {
    const result = parse([
      "info multipv 1 policy 0.7 score cp 21 wdl 400 300 300 pv e2e4",
      "info multipv 3 policy 0.2 pv d2d4",
      "info multipv 1 score cp 8 wdl 350 400 250 pv e2e4",
      "bestmove g1f3",
    ]);
    expect(result.candidates).toEqual([
      { moveUci: "e2e4", rank: 1, mass: null, scoreCp: 8, wdl: { win: 350, draw: 400, loss: 250 } },
      { moveUci: "d2d4", rank: 3, mass: 0.2, scoreCp: null, wdl: null },
    ]);
    expect(result.termination).toEqual({ rawBestMoveUci: "g1f3", moveUci: "g1f3" });
    expect(result.coverage).toBe("bounded_reported_window");
  });

  it("does not borrow exact cp/WDL across a later bounded or operand-less row", () => {
    expect(parse(["info multipv 1 score cp 20 wdl 400 300 300 pv e2e4", "info multipv 1 score cp 30 lowerbound wdl 500 300 200 pv e2e4", "bestmove e2e4"]).candidates)
      .toEqual([{ moveUci: "e2e4", rank: 1, mass: null, scoreCp: null, wdl: null }]);
  });

  it.each([
    ["info multipv 1 pv e2e4", "info multipv 1 pv d2d4", "bestmove e2e4"],
    ["info multipv 0 pv e2e4", "bestmove e2e4"],
    ["info multipv 4 pv e2e4", "bestmove e2e4"],
    ["info multipv 1 policy NaN pv e2e4", "bestmove e2e4"],
    ["info multipv 1 policy -0.1 pv e2e4", "bestmove e2e4"],
    ["info multipv 1 wdl 500 500 1 pv e2e4", "bestmove e2e4"],
    ["info multipv 1 pv e2e5", "bestmove e2e4"],
    ["bestmove e2e5"], ["bestmove (none)"], ["bestmove 0000"],
    ["bestmove e2e4", "info multipv 1 pv d2d4"], ["bestmove e2e4 invalid"],
  ])("refuses malformed, crossed or ambiguous task output %j", (...lines) => expect(() => parse(lines)).toThrow());

  it("keeps a valid empty report separate from a sampled legal move or rules-terminal null", () => {
    const empty = parse(["bestmove e2e4"]);
    expect(empty.candidates).toEqual([]); expect(empty.termination.moveUci).toBe("e2e4");
    const terminal = request({ position: { kind: "exact_fen", fen: "7k/6Q1/5K2/8/8/8/8/8 b - - 0 1" }, requestedWidth: 8 });
    expect(parse(["bestmove (none)"], terminal).termination).toEqual({ rawBestMoveUci: null, moveUci: null });
    expect(parse(["bestmove 0000"], terminal).candidates).toEqual([]);
    for (const fen of ["8/8/8/8/8/8/k7/7K w - - 0 1", "8/8/8/8/8/8/k7/6BK w - - 0 1"]) {
      expect(parse(["bestmove (none)"], request({ position: { kind: "exact_fen", fen }, requestedWidth: 8 })).termination)
        .toEqual({ rawBestMoveUci: null, moveUci: null });
    }
  });

  it("uses the existing float32 mass tolerance without renormalizing rows", () => {
    const masses = [0.50000003, 0.50000003];
    expect(parse([`info multipv 1 policy ${masses[0]} pv e2e4`, `info multipv 2 policy ${masses[1]} pv d2d4`, "bestmove g1f3"]).candidates.map(row => row.mass)).toEqual(masses);
    expect(parse(["info multipv 1 policy 1.00000003 pv e2e4", "bestmove e2e4"]).candidates[0]!.mass).toBe(1.00000003);
    expect(() => parse(["info multipv 1 policy 0.6 pv e2e4", "info multipv 2 policy 0.6 pv d2d4", "bestmove e2e4"])).toThrow();
  });

  it("normalizes task width independently of legal count, while page width stays frozen", () => {
    const position = { kind: "exact_fen" as const, fen: "8/8/8/8/8/8/k7/7K w - - 0 1" };
    expect(normalizeProviderRequest(operation, request({ position, requestedWidth: 8 })).request.requestedWidth).toBe(8);
    expect(() => normalizeProviderRequest("maia.policy_page@1", maiaRequest(position, { requestedWidth: 8 }))).toThrow(/legal moves/u);
    for (const sampleRequestId of ["", "not-a-uuid", "00000000-0000-4000-8000-00000000000A"]) {
      expect(() => normalizeProviderRequest(operation, request({ sampleRequestId }))).toThrow();
    }
  });

  it("accepts only the captured auxiliary defaults and exact same-task command order", () => {
    const raw = request(), identity = normalizeProviderRequest(operation, raw);
    const commands = maiaInferenceTaskCommandImage(identity.request, optionImage);
    expect(commands.slice(0, 2)).toEqual(["setoption name SelfElo value 1400", "setoption name OppoElo value 1500"]);
    const capture: ProviderExecutionCapture<typeof operation> = { endpoint: { kind: "uci_supervisor", engineId: "maia-5m" },
      actualIdentity: { ...maiaActual(), optionImage, optionImageDigest: digestEngineOptionImage(optionImage) }, generation: 1,
      contentEncoding: "uci-utf8", transport: null, responseBytes: providerUtf8([...commands.slice(1).map(line => `> ${line}`), "< bestmove e2e4"].join("\n")) };
    expect(() => PROVIDER_RESPONSE_PARSERS[operation].parse(capture, identity)).toThrow(/command image/u);
  });
});
