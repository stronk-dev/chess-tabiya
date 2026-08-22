# D778 decomposed king-state probe

**DISPOSABLE RESEARCH INSTRUMENT — not production code.** The prior shelter-loss + attacked-zone
conjunction was too sparse. This instrument measures its operands separately rather than inventing
a broader “king unsafe” label.

Pinned conventions:

- king zone = the up to eight adjacent squares, excluding the king square;
- zone attackers/defenders = distinct pieces attacking at least one zone square;
- shelter = same-color pawns one or two forward ranks from the king on its file or adjacent files;
- legal escapes = adjacent legal king moves only, excluding castling encodings;
- direct slider check = the moved bishop/rook/queen itself attacks the opposing king after the move.

The instrument also splits zone-defender loss by capture/noncapture and shelter increase by whether
the king stayed, castled, or relocated without castling. This prevents an ordinary capture or
castling move from masquerading as a deeper king-safety semantic.

Side-to-move clones clear en passant and abstain if invalid. The horizon bands are descriptive ply
bands, not phase truth. No probe means king safety, attack quality, exposure or a mating net.

Run only this instrument:

```sh
pnpm exec vitest run --config tools/d778-king-state-harness/vitest.config.ts
```

The run writes `output.md`.
