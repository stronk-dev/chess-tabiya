# R2 selection harness output

External PGN SHA-256: `a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec`.
Imported selection: blitz/1000-1399=12, blitz/1400-1799=12, blitz/1800-2199=12, bullet/1000-1399=12, bullet/1400-1799=12, bullet/1800-2199=12, rapid/1000-1399=12, rapid/1400-1799=12, rapid/1800-2199=12; 579 fixed-ply decisions.
Authored selection: 754 transitions from 50 current draft packs.

Counterfactual specificity is `1 - same signed-family share among legal alternatives`. It is not usefulness, correctness, or valence.

## Surface comparison

| population / surface | decisions firing | cards or entries / decision | mean counterfactual specificity |
|---|---:|---:|---:|
| Authored spines / shipped raw gained observations | 94.96% | 8.70 | 18.65% |
| Authored spines / authored top-eight kinds | 31.56% | 0.40 | 81.85% |
| Authored spines / predeclared 20%, cap-two selector | 48.01% | 0.79 | 93.26% |
| Imported games / shipped raw gained observations | 99.65% | 11.42 | 18.23% |
| Imported games / authored top-eight kinds | 34.37% | 0.52 | 90.31% |
| Imported games / predeclared 20%, cap-two selector | 58.89% | 1.03 | 93.84% |

## Selector sensitivity and critical-event retention

| population | max alternative share | cap | decisions firing | cards/decision | specificity | critical retained |
|---|---:|---:|---:|---:|---:|---:|
| Authored spines | 10% | 2 | 33.95% | 0.56 | 96.87% | 50/50 |
| Authored spines | 20% | 1 | 48.01% | 0.48 | 93.57% | 50/50 |
| Authored spines | 20% | 2 | 48.01% | 0.79 | 93.26% | 50/50 |
| Authored spines | 20% | 3 | 48.01% | 1.01 | 93.02% | 50/50 |
| Authored spines | 30% | 2 | 62.60% | 1.07 | 88.39% | 50/50 |
| Imported games | 10% | 2 | 42.49% | 0.74 | 97.24% | 58/58 |
| Imported games | 20% | 1 | 58.89% | 0.59 | 94.08% | 58/58 |
| Imported games | 20% | 2 | 58.89% | 1.03 | 93.84% | 58/58 |
| Imported games | 20% | 3 | 58.89% | 1.34 | 93.71% | 58/58 |
| Imported games | 30% | 2 | 73.75% | 1.30 | 89.81% | 58/58 |

- Authored spines: 1032 alternative-only structural relations met the 30% `avoided` threshold; none receives good/bad wording. Selected sign mix: gained=250, lost=99, preserved=4, rule=29, transition=214.
  Critical events: rules:castling=22, rules:checkmate=6, rules:promotion=1, transition:move_irreversibility:last_of_role=21.
  Most-selected families: structure:gained:piece_count=53, transition:defended_squares_changed:gained=47, structure:gained:bishop_on_shade=41, structure:gained:king_zone=33, structure:lost:bishop_on_shade=33, transition:move_irreversibility:pawn_break=32, structure:lost:piece_count=31, structure:gained:king_opposition=25, transition:attacked_squares_changed:gained=25, transition:attacked_squares_changed:lost=25, rules:castling=22, structure:gained:doubled_pawn=22.
- Imported games: 522 alternative-only structural relations met the 30% `avoided` threshold; none receives good/bad wording. Selected sign mix: gained=271, lost=115, rule=24, transition=184.
  Critical events: rules:castling=23, rules:checkmate=1, transition:move_irreversibility:last_of_role=34.
  Most-selected families: structure:gained:piece_count=83, structure:lost:bishop_on_shade=44, structure:gained:bishop_on_shade=43, structure:lost:piece_count=37, transition:attacked_squares_changed:lost=35, transition:move_irreversibility:last_of_role=34, transition:defended_squares_changed:gained=29, structure:gained:half_open_file=28, transition:move_irreversibility:pawn_break=26, structure:gained:doubled_pawn=25, transition:defended_duties_changed:acquired=25, structure:gained:king_zone=24.

## Per-kind transfer: gained structural relation

Rank correlation across shared firing kinds: Spearman rho 0.667.

### Authored spines

| kind | played rate | legal-alternative rate | lift |
|---|---:|---:|---:|
| `pawn_safe_square` | 75.99% | 90.47% | 0.84x |
| `outpost` | 0.27% | 0.16% | 1.63x |
| `backward_pawn` | 2.79% | 2.17% | 1.28x |
| `isolated_pawn` | 1.72% | 0.52% | 3.32x |
| `doubled_pawn` | 2.92% | 0.42% | 6.98x |
| `passed_pawn` | 1.86% | 0.38% | 4.86x |
| `open_file` | 1.72% | 0.47% | 3.64x |
| `half_open_file` | 4.51% | 2.33% | 1.94x |
| `line_blockers` | 71.75% | 82.87% | 0.87x |
| `direct_attack_count` | 55.97% | 67.91% | 0.82x |
| `piece_reach_count` | 78.51% | 92.33% | 0.85x |
| `named_structure` | 0.53% | 0.06% | 9.46x |
| `bishop_on_shade` | 16.31% | 19.70% | 0.83x |
| `pawn_count` | 0.00% | 0.00% | n/a |
| `king_opposition` | 8.62% | 3.07% | 2.81x |
| `piece_count` | 13.53% | 3.71% | 3.65x |
| `king_zone` | 8.89% | 3.70% | 2.40x |
| `piece_distance` | 20.03% | 8.97% | 2.23x |

### Imported games

| kind | played rate | legal-alternative rate | lift |
|---|---:|---:|---:|
| `pawn_safe_square` | 97.41% | 94.27% | 1.03x |
| `outpost` | 1.55% | 0.68% | 2.27x |
| `backward_pawn` | 4.15% | 2.56% | 1.62x |
| `isolated_pawn` | 5.53% | 1.42% | 3.90x |
| `doubled_pawn` | 4.66% | 0.29% | 16.27x |
| `passed_pawn` | 2.42% | 0.90% | 2.70x |
| `open_file` | 3.28% | 1.19% | 2.75x |
| `half_open_file` | 9.67% | 2.79% | 3.47x |
| `line_blockers` | 87.56% | 86.48% | 1.01x |
| `direct_attack_count` | 79.10% | 76.57% | 1.03x |
| `piece_reach_count` | 97.06% | 95.15% | 1.02x |
| `named_structure` | 1.04% | 0.03% | 32.54x |
| `bishop_on_shade` | 18.31% | 16.56% | 1.11x |
| `pawn_count` | 0.00% | 0.00% | n/a |
| `king_opposition` | 2.94% | 3.87% | 0.76x |
| `piece_count` | 26.94% | 5.35% | 5.04x |
| `king_zone` | 5.18% | 3.60% | 1.44x |
| `piece_distance` | 6.04% | 6.04% | 1.00x |

## Machine-readable assertions

- predeclared selector has fewer entries than raw on authored: true
- predeclared selector has fewer entries than raw on imported: true
- predeclared selector specificity exceeds raw on authored: true
- predeclared selector specificity exceeds raw on imported: true
- all critical low-frequency events retained: 108/108
- valence output emitted: 0 (required abstention)
