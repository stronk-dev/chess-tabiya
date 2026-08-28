// DISPOSABLE RFC review harness — D1962-D1967. Not production code.
import { readFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { parseSquare } from "chessops/util";
import { describe, expect, it } from "vitest";

const rfc = readFileSync(new URL("../../rfc/bounded-policy-targets.md", import.meta.url), "utf8");
const tactics = readFileSync(new URL("../../packages/runtime/src/tactics.ts", import.meta.url), "utf8");
const exchange = readFileSync(new URL("../../packages/runtime/src/exchange.ts", import.meta.url), "utf8");
const authorHarness = readFileSync(new URL("../d1652-bounded-target-repair-harness/contract-repair.test.ts", import.meta.url), "utf8");
const census = readFileSync(new URL("../d1023-bounded-policy-harness/exact-target.test.ts", import.meta.url), "utf8");

describe("bounded-target second repeat review", () => {
  it("D1962 privately duplicates the threat pass instead of consuming one exported authority", () => {
    expect(tactics).toMatch(/export function threats[\s\S]*position\.turn = opposite\(position\.turn\);[\s\S]*position\.epSquare = undefined/u);
    expect(tactics).not.toMatch(/export function (?:threatPass|passFen|passedThreatPosition)/u);
    expect(authorHarness).toMatch(/function passFen\(sourceFen: string\)/u);
    expect(rfc).toMatch(/registered threat pass transform/u);
    expect(rfc).not.toMatch(/`packages\/runtime\/src\/tactics\.ts` \|/u);
  });

  it("D1963 requires promotion provenance absent from exchange identity and standard FEN", () => {
    const identity = exchange.match(/export interface ExchangePieceIdentity \{([\s\S]*?)\n\}/u)?.[1] ?? "";
    expect(identity).toContain("color: Color");
    expect(identity).toContain("role: Role");
    expect(identity).toContain("square: SquareName");
    expect(identity).not.toContain("promoted");
    expect(rfc).toMatch(/`TrackedPieceIdentity` contains colour, role, promoted flag and square/u);

    const position = Chess.fromSetup(parseFen("4k3/8/8/8/8/8/8/Q3K3 w - - 0 1").unwrap()).unwrap();
    expect(position.board.get(parseSquare("a1")!)).toEqual({ color: "white", role: "queen", promoted: false });
  });

  it("D1964 target_captured is unreachable for a legal response by the victim's own side", () => {
    const source = Chess.fromSetup(parseFen("r3k3/8/8/8/8/8/8/Q3K3 w - - 0 1").unwrap()).unwrap();
    const victimSquare = parseSquare("a1")!;
    expect(source.turn).toBe("white");
    expect(source.board.get(victimSquare)?.color).toBe(source.turn);
    for (const [from, destinations] of source.allDests()) {
      expect(source.board.get(from)?.color).toBe(source.turn);
      expect(destinations.has(victimSquare)).toBe(false);
    }
    expect(rfc).toMatch(/\| "target_captured"/u);
    expect(census).not.toMatch(/type ImmediateCause[^;]*target_captured/u);
  });

  it("D1965 labels synchronous runtime work background without a worker or cooperative yield", async () => {
    const operationSection = rfc.match(/## 4\. Operation and sealing boundary([\s\S]*?)(?=## 5\.)/u)?.[1] ?? "";
    expect(operationSection).toMatch(/Promise<BoundedTargetDerivationResult>/u);
    expect(operationSection).toMatch(/background-only and cancellation-aware/u);
    expect(operationSection).not.toMatch(
      /bounded queue|maximum cancellation latency|yield every|setImmediate|scheduler\.yield/u,
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 0);
    for (let index = 0; index < 100_000; index += 1) Math.sqrt(index);
    expect(controller.signal.aborted).toBe(false);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    clearTimeout(timer);
    expect(controller.signal.aborted).toBe(true);
  });

  it("D1966 declares a whole-position multiplication cap on a one-item operation", () => {
    expect(rfc).toMatch(/at most \*\*512 target × candidate pairs\*\*/u);
    expect(rfc).toMatch(/readonly kind: "named_material_target"/u);
    expect(rfc).toMatch(/readonly kind: "immediate"/u);
    expect(rfc).toMatch(/readonly kind: "bounded_return"/u);
    expect(rfc).not.toMatch(/readonly kind: "source_position_batch"|readonly targets: readonly|readonly candidates: readonly/u);
  });
});
