# D1029 castling identity / destination consumer audit

**Checked:** 2026-08-23 working tree against owner ruling D1029
**Purpose:** amendment input; this does not authorize implementation before the RFC amendment lands

The ruling separates three bytes: Chess960-safe move identity (`king → rook`), semantic piece
destination (`king → c/g`) and SAN display. A production search found four direct consumers that
currently or formerly derive destination with `slice(2, 4)` and one canonicalizer that rewrites
identity. They cannot all remain correct under the ruling.

| consumer | HEAD/working behavior | required contract |
|---|---|---|
| `apps/web/src/lib/board-input.ts` | formerly rewrote identity to c/g; working implementation now submits king→rook while selection/active square use the exact map's separate `to` | retain this separation; SAN/text input normalizes to identity |
| `apps/web/src/lib/board-model.ts:39-48` | `parsedLastMove` highlights raw UCI target, so a castling identity highlights the rook's original square | needs the prior FEN or an already-derived semantic destination; guessing from the after-FEN is refused |
| `packages/runtime/src/compare-strips.ts:84-91` | piece routes append raw UCI target, routing the king onto the rook's original square | derive each edge through its parent FEN and retain the semantic destination |
| `packages/runtime/src/semantic-evidence.ts:287-304` | `canonicalMoveUci` rewrites castling identity to c/g and `canonicalAnchor` stores the rewritten byte | must validate/normalize input to king→rook identity without discarding the exact map's semantic destination |
| `packages/runtime/src/semantic-evidence.ts:365-371` | castling transition operands manufacture `to`/`resultingKingSquare` from the rewritten anchor target | retain `move_uci` identity but derive `to` and `resultingKingSquare` from the exact move's semantic destination |

The other `parseUci(moveUci)` sites generally feed chessops' internal move form and are compatible
with king→rook identity. They still need their existing castling tests, but the source search found
no other direct `slice(2,4)` destination projection in production beyond `board-model`,
`compare-strips`, and the semantic-event normalization above.

The amended RFC therefore needs acceptance coverage beyond the old three-way UCI set equality:

1. runtime, web submission and server successor identity agree on king→rook;
2. exact evidence, pointer destination, semantic-board destination, last-move highlight, comparison
   route and transition operands agree on c/g;
3. display remains `O-O`/`O-O-O`;
4. a Chess960 fixture places king and rook away from e/a/h and still satisfies all three layers.
