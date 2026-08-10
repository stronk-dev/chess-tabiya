# Q1a hands-on teardown protocols

- **Feeds:** Q1a → E1; K9 (Chess Endgame Training speed bar); Q9 (any branch UX seen
  in the wild); `competitor-value-props.md` open verification items.
- **Date created:** 2026-08-11. **Status:** protocols ready, no teardown executed.
- **Method rule:** these sessions produce `[V]` evidence — record what you *did and
  observed*, with timestamps/screenshots where possible, not what the product claims.
  Each teardown lands as its own dossier (`teardown-<product>.md`) and updates the
  coverage matrix + `gates.md` E1 evidence column.
- **The question every teardown answers:** does this product already deliver
  commit → consequence → rewind → **preserved branch** → compare — and if not, which
  pieces does it actually have? Plus: what is its single best interaction we should
  steal (feeds `competitor-value-props.md` synthesis)?

Time budget: 30–60 min per product. Do not explore beyond the checklist; note
serendipitous findings in a "misc" section and move on.

## 1. Chess Endgame Training (free, no account — https://chess-endgame-trainer.web.app / see R-entry in archive index)

Claims under test: closest existing Outcome Drill; owner's field report "slow, poor
UX" (unbenchmarked — reproduce or retract); K9 requires us to be *materially* faster.

1. **Cold start:** time from URL open → first position playable. Record device/network.
2. **Restart latency:** finish or fail a position; time tap-to-board-ready for retry.
   Repeat 5×, note median. (Our budget to beat: effectively instant; <250 ms warm.)
3. **Between-position latency:** complete a position → next position ready. Time it.
4. **Opponent-move latency:** median delay after your move, over ~20 moves.
5. **Branching:** play a line, use the move list to go back and continue differently.
   Does the first line survive anywhere? Can you view both? (Expected: no persistent
   attempts — verify.)
6. **"What-if" mode:** what does it actually do? Screenshot.
7. **Objective handling:** does it grade W/D/L preservation or exact moves? Try a
   suboptimal-but-winning move — accepted or rejected?
8. **Verdict lines:** Is the owner's "slow/poor UX" reproducible with numbers? What is
   its best interaction? What would make our version *materially* better (K9 wording)?

## 2. Noctie (paid SaaS, account needed — https://noctie.ai)

Claims under test: closest paid sparring; `[V]` per-move Excellent→Blunder labels; no
persistent branch comparison; feedback move-level only.

1. **Human-likeness spot check:** play 10 minutes at a stated level; note any move
   that feels engine-artificial (log FEN + move).
2. **Takeback semantics:** blunder deliberately, take back, play differently. Is the
   original attempt retrievable *anywhere* (history, review screen)? Screenshot the
   post-game review.
3. **Play-from-position:** feed it a mid-game FEN (use the anti-Caro Advance tabiya).
   Can you drill it repeatedly? Does it remember anything between attempts?
4. **Feedback timing:** are labels shown during play or after? Can labels be hidden?
5. **Repertoire/opening drill flow:** import or select an opening, deviate on move 5
   — what happens? Forced back, allowed, commented?
6. **Verdict lines:** which of our five loop stages (commit/consequence/rewind/
   branch-preserve/compare) does Noctie actually cover? What's its best interaction?

## 3. Chessable (account, some free courses — https://www.chessable.com)

Claims under test: unit-is-a-card; bot-from-course-position exists but doesn't bridge
to plan execution.

1. **MoveTrainer loop:** run a free course chapter; confirm the interaction unit
   (recall next move vs anything deeper). Where does a variation *end*?
2. **Play-vs-bot from course position:** launch it from a strategic (non-tactical)
   chapter. Does the bot play level-appropriate or engine-ish? Is there any objective
   beyond "play on"? Any post-game tie-back to the course concepts?
3. **Deviation:** in trainer mode, play a sound alternative to the course move. What
   exactly happens (marked wrong / accepted / explained)?
4. **Verdict lines:** confirm or refute "the bridge from 'I recalled the move' to
   'I understand the structure' is absent." Best interaction to steal?

## 4. Chess.com Practice / Custom (account — https://www.chess.com/practice)

Claims under test: pieces exist (play from position, bots, drills) but orchestration
is absent; no multi-move redo; no color switching mid-flow.

1. **Custom position vs bot:** set up the anti-Caro tabiya, play 10 moves vs a
   ~1500 bot. Redo from move 3 — what's the actual gesture count, and is the first
   try preserved?
2. **Color switch:** replay the same position as Black. How many steps?
3. **Practice drills:** run one endgame drill — exact-move or outcome-graded?
   Restart latency (5× median).
4. **Bot human-likeness:** note obviously artificial moves (the weakened-engine
   signature: random blunders amid strong play).
5. **Verdict lines:** how much of our loop can a power user *manually assemble*, and
   how many clicks does one rewind-branch-compare cycle cost? (This is the "orchestration
   is the product" claim under direct test.)

## Cross-product synthesis (after all four)

Fill one table: product × our five loop stages (commit / consequence / rewind /
preserved branches / compare) with ✅/partial/❌ *as observed*, plus latency medians.
Then write the E1 verdict paragraph: is the integrated-loop whitespace confirmed,
narrowed, or refuted? Land it in `gates.md` E1 and flip Q1a's status accordingly.

Also close (or keep open with reason) the two dossier verification items:
chessfeed.ai's claimed saved-branch exploration, and DecodeChess's status.
