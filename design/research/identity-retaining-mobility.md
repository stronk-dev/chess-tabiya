# Identity-retaining piece mobility

**Question.** Do exact per-piece legal and locally non-losing destination changes provide a sound
restriction/activity primitive beyond aggregate reach counts?

**Verdict.** `[V]` Retaining the piece identity and before/after square sets is useful infrastructure,
especially for touch/hover explanations, but generic legal restriction is background and generic
safe-mobility loss is only mildly selective. A rare transition to zero locally non-losing moves is
selective in the sealed imported sample and uncertain in the authored packs. It remains an exact
mobility event—not “trapped,” “dominated,” forced, bad or strategically important.

## 1. Convention and instrument

The disposable D783 harness evaluates bishops, knights, rooks and queens by exact identity. Legal
destinations come from chessops. A destination is locally non-losing when a capture has
`legal-exchange@1 >= 0`, or a quiet arrival has no opponent legal capture with positive
`legal-exchange@1`. `[V]` (`tools/d783-piece-mobility-harness/`; chessops source is linked and the
exchange convention justified in `legal-exchange-prerequisite.md`.)

Opponent-turn clones clear en passant and abstain if the resulting setup is invalid. Captured or
relocated opponent pieces are not silently re-identified. Every probe has its own eligible
denominator, and played/alternative rates use a paired position bootstrap. “Safe” here means only
locally non-losing under the declared exchange convention; it does not mean engine-safe, active or
good.

## 2. Cross-population result

| Exact transition | Authored lift | Imported lift | Disposition |
|---|---:|---:|---|
| opponent legal destinations decrease | 0.71× (0.53–0.91) | 1.03× (0.84–1.23) | background/negative; on-demand geometry only |
| opponent locally non-losing destinations decrease | 1.14× (1.03–1.26) | 1.35× (1.23–1.46) | mild contextual operand; no global hint |
| opponent minor locally non-losing destinations decrease | 1.04× (0.90–1.19) | 1.27× (1.12–1.42) | population disagreement; on demand |
| opponent piece loses every locally non-losing destination | 1.12× (0.64–1.63) | **2.58× (1.91–3.36)** | rare candidate requiring separate predicates and fixtures |
| non-capturing move decreases opponent safe mobility | 0.93× (0.82–1.05) | 1.05× (0.93–1.17) | background; total reduction is capture/context shaped |
| moved piece gains locally non-losing destinations | **1.20× (1.07–1.34)** | **1.29× (1.15–1.42)** | stable but modest activity operand |

`[V]` Full counts and denominators are in `tools/d783-piece-mobility-harness/output.md`: 717
authored decisions / 19,619 alternatives and 577 imported decisions / 18,842 alternatives.

The capture/non-capture split is the important decomposition. Safe-mobility loss disappears to
background when the learner's move is non-capturing. A module should therefore retain the move's
capture identity and the exact affected piece/squares rather than minting an independent
“restriction” narrative.

## 3. Product consequences

- **Touch/hover:** show legal versus locally unsafe destinations for the selected piece, with the
  exact newly lost/gained squares. This answers a square question without prose inflation.
- **Post-commit guidance:** safe-destination reduction alone does not spend a hint slot. It may be
  an operand inside a capture, pin, authored-theory or bounded-consequence module.
- **Review:** zero-safe transitions are eligible only with the exact piece and prior/new sets. A
  separate attack prerequisite and reply/consequence evidence are needed before “trapped.”
- **Bots:** exact mobility deltas are candidate-policy inputs. The bot policy, not the detector,
  determines whether activity or restriction affects selection.
- **Player habits:** count choices over eligible opportunities and by piece/phase. Raw frequency
  mostly measures positions encountered.

No content was relabelled. Production collectors must preserve the square sets; a count-only event
would discard the very evidence needed by the board overlay and by later tactical joins.
