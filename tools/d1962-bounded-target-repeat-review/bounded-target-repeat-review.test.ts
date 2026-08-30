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

describe("bounded-target second repeat repair", () => {
  it("D1962 assigns the threat pass to one production authority", () => {
    expect(rfc).toMatch(/export `ThreatPassAnchor`\/`threatPassAnchor\(\)` and make `threats\(\)` consume the same transform/u);
    expect(rfc).toMatch(/no other implementation may reproduce the flip-side\/clear-en-passant mutation/u);
    expect(rfc).toMatch(/`packages\/runtime\/src\/tactics\.ts` \|/u);
    expect(authorHarness).toMatch(/prospectiveThreatPassAnchor/u);
  });

  it("D1963 does not invent initial promotion provenance", () => {
    const identity = exchange.match(/export interface ExchangePieceIdentity \{([\s\S]*?)\n\}/u)?.[1] ?? "";
    expect(identity).toContain("color: Color");
    expect(identity).toContain("role: Role");
    expect(identity).toContain("square: SquareName");
    expect(identity).not.toContain("promoted");
    expect(rfc).toMatch(/`TrackedPieceIdentity` contains exactly colour, current role and square/u);
    expect(rfc).toMatch(/no initial\s+promotion provenance is present or inferred/iu);

    const position = Chess.fromSetup(parseFen("4k3/8/8/8/8/8/8/Q3K3 w - - 0 1").unwrap()).unwrap();
    expect(position.board.get(parseSquare("a1")!)).toEqual({ color: "white", role: "queen", promoted: false });
  });

  it("D1964 removes the unreachable target_captured cause", () => {
    const source = Chess.fromSetup(parseFen("r3k3/8/8/8/8/8/8/Q3K3 w - - 0 1").unwrap()).unwrap();
    const victimSquare = parseSquare("a1")!;
    expect(source.turn).toBe("white");
    expect(source.board.get(victimSquare)?.color).toBe(source.turn);
    for (const [from, destinations] of source.allDests()) {
      expect(source.board.get(from)?.color).toBe(source.turn);
      expect(destinations.has(victimSquare)).toBe(false);
    }
    expect(rfc).not.toMatch(/\| "target_captured"/u);
    expect(rfc).toMatch(/`target_captured`\s+is deliberately absent as unreachable/u);
    expect(census).not.toMatch(/type ImmediateCause[^;]*target_captured/u);
  });

  it("D1965 specifies cooperative background execution and event-loop cancellation", async () => {
    const operationSection = rfc.match(/## 4\. Operation and sealing boundary([\s\S]*?)(?=## 5\.)/u)?.[1] ?? "";
    expect(operationSection).toMatch(/Promise<BoundedTargetBatchResult>/u);
    expect(operationSection).toMatch(/one active and eight queued/u);
    expect(operationSection).toMatch(/after every \*\*64 visited\s+positions\*\*/u);
    expect(operationSection).toMatch(/messageChannelMacrotaskYield/u);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 0);
    for (let index = 0; index < 100_000; index += 1) Math.sqrt(index);
    expect(controller.signal.aborted).toBe(false);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    clearTimeout(timer);
    expect(controller.signal.aborted).toBe(true);
  });

  it("D1966 puts the multiplication ceiling on the complete-set batch", () => {
    expect(rfc).toMatch(/above \*\*512 pairs\*\*/u);
    expect(rfc).toMatch(/readonly kind: "source_position_batch"/u);
    expect(rfc).toMatch(/readonly targets: readonly TargetDerivation\[\]/u);
    expect(rfc).toMatch(/readonly candidates: readonly CandidateDerivation\[\]/u);
    expect(rfc).toMatch(/no public per-item derivation path/iu);
  });
});
