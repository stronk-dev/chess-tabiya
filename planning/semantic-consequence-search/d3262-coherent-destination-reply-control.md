# D3262 corrected destination control after exact replies

**Measured 2026-09-23.** Disposable research instrument, not a production classifier or hint.
Run `make semantic-search-coherent-destination-reply-check`; the checked output is
`d3262-coherent-destination-reply-control.json`, SHA-256
`d7ee3f9d4d760f1597b7713ba25a1784a5a156b1f91d7d86d89e3136344884cf`.
Its inputs are the separately frozen 182-cell coherent target comparison frame and the
complete 6,176-edge legal reply graph. The output includes exactly the 88 named
minor-destination cells and every one of their 3,070 legal immediate replies.

The instrument replays every reply and refuses a mismatched reply FEN. It tracks two
orthogonal facts after the candidate and one reply: whether the **named pawn at its
declared square** still attacks the **named destination square**, and whether the
**named minor** arrived there. Only on an arrival does it test whether the named pawn
has a legal, positive-exchange capture. It does not transfer a source outcome to a
natural alternative, infer a plan, or use an engine rank as a reason.

| Population | Cells | Legal replies | Pawn still controls | Direct minor arrivals | Named pawn wins arrival | Pawn controls after every reply |
|---|---:|---:|---:|---:|---:|---:|
| 32 source-observed pawn moves | 32 | 1,109 | 1,070 | 32 | 32 | 5 |
| 56 selected natural alternatives | 56 | 1,961 | 0 | 55 | 0 | 0 |

The source-control contrast is deliberately conditional on the authored pawn
identity. Its zero on alternatives does **not** say the alternatives leave the square
undefended by every other piece. The 39 source replies that remove this *named*
control include a concrete `d4d5` → `a5d5` (UCI) counterexample at root
`d1023:3e77bf53f9edd017`; the permanent fixture refuses a false retained-pawn
reading there. The 32 pawn-winning direct arrivals prove one short tactical
consequence, not that an opponent must choose that reply. The other 1,077 source
replies do not prove a long-term prevention claim; later moves are outside this arm.

**Consequence for the shared search/profile.** A learner-facing statement may say
that the pawn currently attacks the named destination, or—if the exact arrival is
shown—that the named pawn can win the arriving minor. It may not collapse either
into “the move prevents the bishop/knight from using that square,” nor attribute
the pawn move to Stockfish without the separate counterfactual concordance and
continuation checks. The five-arm proof/abstention/cost comparison remains open.
