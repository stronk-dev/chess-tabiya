// DISPOSABLE research harness — platform-alignment R3. Not production code.
import { writeFileSync } from "node:fs";

import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  selectLocalSemanticEvidence,
} from "@chess-tabiya/runtime";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";

import { MODULES, compileModulePacket } from "./module-contract.js";
import { adaptSelectedEvidence } from "./real-packet.js";

const POLICY = { id: "research.r2_candidate", version: 1 } as const;
const OUTPUT = new URL("./real-packets.json", import.meta.url).pathname;

function after(fen: string, moveUci: string): string {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(moveUci)!);
  if (!position.isLegal(move)) throw new TypeError(`Illegal fixture move ${moveUci}`);
  position.play(move);
  return canonicalFen(position);
}

const FIXTURES = Object.freeze([
  { label: "Castle kingside", beforeFen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", moveUci: "e1g1" },
  { label: "Promote on a8", beforeFen: "4k3/P7/8/8/8/8/8/4K3 w - - 0 1", moveUci: "a7a8q" },
  { label: "Deliver checkmate", beforeFen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", moveUci: "g6g7" },
]);

describe("R3 real compiler-admitted packet bridge", () => {
  it("feeds sealed F2 selections into the disposable module contract without adding a grade or move", () => {
    const packets = FIXTURES.map((fixture) => {
      const afterFen = after(fixture.beforeFen, fixture.moveUci);
      return adaptSelectedEvidence(fixture.label, selectLocalSemanticEvidence(POLICY, {
        beforeFen: fixture.beforeFen,
        moveUci: fixture.moveUci,
        afterFen,
      }));
    });

    expect(packets).toHaveLength(3);
    expect(packets.every((packet) => packet.population.evaluatedAlternatives === packet.population.legalAlternatives)).toBe(true);
    expect(packets.every((packet) => packet.facts.length > 0 && packet.facts.length <= 2)).toBe(true);
    expect(packets.flatMap((packet) => packet.facts).every((fact) => fact.recommendedMoveUci === undefined && fact.principalVariation === undefined)).toBe(true);
    expect(packets.flatMap((packet) => packet.facts).every((fact) => !/best|good|bad|mistake|blunder/i.test(fact.text))).toBe(true);

    const nudge = MODULES.find((module) => module.id === "postcommit_nudge")!;
    for (const packet of packets) {
      const compiled = compileModulePacket(nudge, packet.facts);
      expect(compiled.abstained).toBe(false);
      expect(compiled.facts.map((fact) => fact.id)).toEqual(packet.facts.map((fact) => fact.id));
    }

    writeFileSync(OUTPUT, `${JSON.stringify(packets, null, 2)}\n`);
  }, 120_000);

  it("rejects an object that merely resembles an F2 selection result", () => {
    expect(() => adaptSelectedEvidence("forged", {
      policy: POLICY,
      consumer: { id: "research.semantic_selection", version: 1 },
      population: { legalAlternatives: 1, evaluatedAlternatives: 1 },
      selected: [],
      rejected: [],
    } as never)).toThrowError(expect.objectContaining({ code: "EVIDENCE_GENERIC_BYPASS" }));
  });
});
