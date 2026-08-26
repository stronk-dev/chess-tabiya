// DISPOSABLE research harness — D1675/D1676. Not production code.
import { INITIAL_FEN } from "chessops/fen";
import { parseVariant, startingPosition } from "chessops/pgn";
import type { Rules } from "chessops/types";
import { describe, expect, it } from "vitest";

import { parsePgnMainline } from "../../apps/server/src/pgn-import.js";

type SetupFamily =
  | "standard_default"
  | "standard_from_position"
  | "chess960"
  | "variant_default"
  | "variant_from_position";

interface RulesSetupIdentity {
  readonly rules: Rules;
  readonly setupFamily: SetupFamily;
}

const standardAliases = new Set(["chess", "standard", "classical", "normal"]);
const fromPositionAliases = new Set(["from position"]);
const chess960Aliases = new Set([
  "chess960", "chess 960", "fischerandom", "fischerrandom", "fischer random",
  "wild/0", "wild/1", "wild/2", "wild/3", "wild/4", "wild/5", "wild/6",
  "wild/7", "wild/8", "wild/8a",
]);

function setupIdentity(headers: Readonly<Record<string, string | undefined>>): RulesSetupIdentity {
  const raw = (headers.Variant ?? "chess").trim().toLowerCase();
  const rules = parseVariant(raw);
  if (rules === undefined) throw new TypeError("SETUP_VARIANT_UNKNOWN");
  const setup = headers.SetUp;
  const fen = headers.FEN;
  if ((setup === "1") !== (fen !== undefined)) throw new TypeError("SETUP_FEN_PAIR_REQUIRED");

  if (chess960Aliases.has(raw)) {
    if (fen === undefined) throw new TypeError("CHESS960_SETUP_REQUIRED");
    return Object.freeze({ rules: "chess", setupFamily: "chess960" });
  }
  if (fromPositionAliases.has(raw)) {
    if (fen === undefined) throw new TypeError("FROM_POSITION_SETUP_REQUIRED");
    return Object.freeze({ rules: "chess", setupFamily: "standard_from_position" });
  }
  if (standardAliases.has(raw)) {
    return Object.freeze({
      rules: "chess",
      setupFamily: fen === undefined ? "standard_default" : "standard_from_position",
    });
  }
  return Object.freeze({
    rules,
    setupFamily: fen === undefined ? "variant_default" : "variant_from_position",
  });
}

function capability(identity: RulesSetupIdentity) {
  return Object.freeze({
    maia: identity.rules === "chess" && identity.setupFamily !== "chess960",
    stockfishChess960: identity.setupFamily === "chess960",
    explorerVariant: identity.setupFamily === "chess960" ? "chess960" : identity.rules,
  });
}

const fromPositionWithoutFen = `[Event "Research"]
[Site "local"]
[Date "2026.08.26"]
[Round "1"]
[White "A"]
[Black "B"]
[Result "*"]
[Variant "From Position"]

1. e4 *`;

const chess960WithFen = `[Event "Research"]
[Site "local"]
[Date "2026.08.26"]
[Round "1"]
[White "A"]
[Black "B"]
[Result "*"]
[Variant "Chess960"]
[SetUp "1"]
[FEN "${INITIAL_FEN}"]

*`;

describe("D1675/D1676 rules plus setup-origin identity", () => {
  it("proves chessops collapses standard, from-position and 960 aliases to one rules value", () => {
    for (const alias of [...standardAliases, ...fromPositionAliases, ...chess960Aliases]) {
      expect(parseVariant(alias)).toBe("chess");
    }
    expect(new Set([...standardAliases, ...fromPositionAliases, ...chess960Aliases]).size).toBe(20);
    expect(parseVariant(undefined)).toBe("chess");
  });

  it("proves chessops startingPosition ignores SetUp and defaults missing FEN", () => {
    const fromPosition = new Map([["Variant", "From Position"]]);
    const chess960 = new Map([["Variant", "Chess960"]]);
    expect(startingPosition(fromPosition).unwrap().toSetup()).toEqual(startingPosition(chess960).unwrap().toSetup());
    expect(startingPosition(fromPosition).unwrap().rules).toBe("chess");
  });

  it("proves the current importer false-accepts From Position without FEN and false-refuses 960 with FEN", () => {
    expect(parsePgnMainline(fromPositionWithoutFen).rootFen).toBe(INITIAL_FEN);
    expect(() => parsePgnMainline(chess960WithFen)).toThrow("Unsupported PGN variant: Chess960");
  });

  it("separates rules from setup origin for all header families", () => {
    expect(setupIdentity({})).toEqual({ rules: "chess", setupFamily: "standard_default" });
    expect(setupIdentity({ Variant: "Standard", SetUp: "1", FEN: INITIAL_FEN })).toEqual({ rules: "chess", setupFamily: "standard_from_position" });
    expect(setupIdentity({ Variant: "From Position", SetUp: "1", FEN: INITIAL_FEN })).toEqual({ rules: "chess", setupFamily: "standard_from_position" });
    expect(setupIdentity({ Variant: "Fischer Random", SetUp: "1", FEN: INITIAL_FEN })).toEqual({ rules: "chess", setupFamily: "chess960" });
    expect(setupIdentity({ Variant: "Atomic" })).toEqual({ rules: "atomic", setupFamily: "variant_default" });
    expect(setupIdentity({ Variant: "Crazyhouse", SetUp: "1", FEN: INITIAL_FEN })).toEqual({ rules: "crazyhouse", setupFamily: "variant_from_position" });
    expect(() => setupIdentity({ Variant: "From Position" })).toThrow("FROM_POSITION_SETUP_REQUIRED");
    expect(() => setupIdentity({ Variant: "Chess960" })).toThrow("CHESS960_SETUP_REQUIRED");
    expect(() => setupIdentity({ Variant: "Standard", FEN: INITIAL_FEN })).toThrow("SETUP_FEN_PAIR_REQUIRED");
    expect(() => setupIdentity({ Variant: "Duck Chess" })).toThrow("SETUP_VARIANT_UNKNOWN");
  });

  it("proves identical FEN bytes can require different provider capability", () => {
    const standard = setupIdentity({ Variant: "Standard" });
    const chess960 = setupIdentity({ Variant: "Chess960", SetUp: "1", FEN: INITIAL_FEN });
    const standardStart = { fen: INITIAL_FEN, identity: standard };
    const chess960Start = { fen: INITIAL_FEN, identity: chess960 };
    expect(standardStart.fen).toBe(chess960Start.fen);
    expect(standardStart.identity).not.toEqual(chess960Start.identity);
    expect(capability(standard)).toEqual({ maia: true, stockfishChess960: false, explorerVariant: "chess" });
    expect(capability(chess960)).toEqual({ maia: false, stockfishChess960: true, explorerVariant: "chess960" });
  });
});
