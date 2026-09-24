/**
 * Memoised FEN parsing for the semantic census ([[D3300]]).
 *
 * A complete-population census (the longitudinal projector, the shared candidate packet) evaluates
 * the one-edge event closure over every legal move of a position, and every collector re-parses the
 * same before/after FENs. Successful parses are kept as private templates and handed out as clones,
 * so callers may still mutate what they receive; the cache is a bounded FIFO and failures are never
 * cached (they throw exactly as `chess.ts` does, on every call).
 *
 * This is deliberately a separate module rather than a change to `chess.ts`: `chess.ts` sits in the
 * provider parser's pinned import closure, whose digest is part of provider exchange identity, and a
 * performance cache must not move that identity. `canonicalFen`/`transposeKey` are re-exported so the
 * census modules import one position authority.
 */
import type { Chess } from "chessops/chess";

import { positionFromFen as parsePosition } from "./chess.js";

export { canonicalFen, transposeKey } from "./chess.js";

const TEMPLATES = new Map<string, Chess>();
const LIMIT = 4096;

export function positionFromFen(fen: string): Chess {
  const template = TEMPLATES.get(fen);
  if (template !== undefined) return template.clone();
  const position = parsePosition(fen);
  TEMPLATES.set(fen, position.clone());
  if (TEMPLATES.size > LIMIT) TEMPLATES.delete(TEMPLATES.keys().next().value!);
  return position;
}
