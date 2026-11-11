/** Build/test-only legal input construction, not an expected classifier reading.
 * External Chessops supplies legal successor positions. Reference arithmetic must never
 * obtain an expected state, subject, event or risk label from a production collector.
 */
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeUci } from "chessops/util";
import type { NormalMove } from "chessops/types";

export interface ReferencePopulation {
  readonly id: string;
  readonly partner: string;
  readonly root: string;
  readonly plays: readonly string[];
  readonly edges: readonly (readonly [string, string])[];
}
export function referenceRulesPopulation(id: string, partner: string, root: string, plays: readonly string[]): ReferencePopulation {
  const position = Chess.fromSetup(parseFen(root).unwrap()).unwrap(), edges: [string, string][] = [];
  for (const [from, destinations] of position.allDests()) for (const to of destinations) {
    const promotions = position.board.get(from)?.role === "pawn" && (to < 8 || to >= 56)
      ? ["bishop", "knight", "queen", "rook"] as const : [undefined];
    for (const promotion of promotions) {
      const move: NormalMove = { from, to, ...(promotion === undefined ? {} : { promotion }) };
      const child = position.clone(); child.play(move); edges.push([makeUci(move), makeFen(child.toSetup())]);
    }
  }
  return { id, partner, root, plays, edges: edges.sort((a, b) => a[0].localeCompare(b[0])) };
}
