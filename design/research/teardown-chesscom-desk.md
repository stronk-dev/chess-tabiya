# Teardown: Chess.com practice surfaces (desk research)

- **Date:** 2026-08-11
- **Feeds:** Q1a / E1 ("orchestration is the product")
- **Method:** desk / experience mining — no account, no hands-on. Help-center articles and chess.com forum threads fetched directly [V]; search-snippet-only evidence [P]; model knowledge [M]. All URLs below were actually fetched unless marked [P].

## Q1 — Multi-move redo vs bot from a custom position

**Verdict: not supported without losing the first try.** The first attempt is discarded; no user-visible variation tree of attempts survives.

- Custom-position play exists via Analysis board → "Set Up Position" → "Practice vs Computer" (website), or "Finish vs Bot" (mobile). The support article documents bot choice and side-switching but says nothing about preserving attempts. [V] https://support.chess.com/en/articles/8572788-how-can-i-play-the-computer-from-a-custom-position
- In regular bot games, back/forward review arrows were replaced by a single **Undo** that reverts the last move pair and makes the bot recalculate — "the original game is not preserved"; a moderator's workaround is tapping the move list to *view* (not branch from) earlier positions. [V] https://www.chess.com/forum/view/site-feedback/back-forward-arrow-changed-to-undo
- In Practice vs Computer, users comparing it to the older "Finish vs Computer" report takeback-then-branch was broken ("clicking the arrow moves my piece back but … the computer stubbornly just makes the original moves") and that the new mode "forgets" alternative paths; a moderator called the takeback failure a bug pending fix. [V] https://www.chess.com/forum/view/site-feedback/finish-vs-computer-disappeared
- Once the bot game *ends* (mate/stalemate), no rewind or branching at all; users' consensus workaround is copying the FEN and starting over elsewhere. "This abrupt undoable event is beyond maddening." [V] https://www.chess.com/forum/view/help-support/any-way-to-rewind-bot-match-after-end
- A long user-written "how to review with Practice vs Computer" guide describes exactly our loop assembled by hand — pick a bad move, practice from it, retry repeatedly — and contains **no** mechanism for keeping earlier attempts; each retry overwrites the line, with no side-by-side comparison of tries. [V] https://www.chess.com/forum/view/general/comprehensive-guide-on-how-to-properly-review-a-chess-game-using-practice-vs-computer
- Caveat [M]: the Self-Analysis board itself does keep variation branches when you move pieces freely — but there the engine only evaluates; it does not *play against you*. The bot-play modes and the variation-keeping mode are disjoint surfaces. (Support article on the analysis board is silent on variation persistence: [V] https://support.chess.com/en/articles/8583825-how-do-i-use-the-analysis-board)
- The official takeback article covers only "Takeback Daily" games (human vs human, unrated); it never mentions preservation of taken-back moves. [V] https://support.chess.com/en/articles/8594400-can-i-take-back-a-bad-move

**What histories show afterward:** only the final surviving line; earlier tries appear nowhere (move list, Game Review, or archive). Evidence of absence: searched forums + Reddit for takeback/undo + history/Game Review preservation; every thread found describes loss of the prior line, none describes preservation.

## Q2 — Replaying the same custom position as the other color

**Verdict: 1 click *if* you are inside Practice vs Computer; otherwise a full re-setup.**

- Website Practice vs Computer has a dedicated **"Switch Sides" icon** usable mid-game. [V] https://support.chess.com/en/articles/8572788-how-can-i-play-the-computer-from-a-custom-position
- Moderator Martin_Stahl: "You can only switch sides when you are using the Practice vs Computer option … you'll have a new icon at the bottom of the move list called Switch Sides." Users in the same thread report years of confusion finding it, and that in setup "if I set black as next to move, the computer automatically moves black and I'm still white." [V] https://www.chess.com/forum/view/help-support/how-to-swap-change-sides-when-playing-a-bot
- Outside that mode (regular Play Bots custom games) there is no switch; replaying as the other color means re-entering setup and recreating the position (multiple forum threads asking how: [P] https://www.chess.com/forum/view/help-support/how-to-switch-sides-with-the-bot , [P] https://www.chess.com/forum/view/site-feedback/cant-play-against-computer-as-black ).
- Net step count from a finished attempt: rewind to the start position (move list), click Switch Sides — ~2 interactions, but only within the one mode, and side-switch mid-drill restarts nothing automatically (bot immediately moves for the side to play). No batch "replay as both colors" concept exists anywhere.

## Q3 — Drills / endgame practice grading and retry flow

**Verdict: graded on the result, not exact moves (openings drills excepted); retry exists but no user reports praising or timing it were found.**

- Practice (formerly "Drills") has four types: Master Games, Openings, Drills, Custom Position (paste FEN). Openings drills use "a bot that plays the required moves" — i.e., scripted line-matching; engine strength is user-settable; full Practice is web-only. [V] https://support.chess.com/en/articles/8724749-what-is-practice-on-chess-com
- A moderator states drills "use live engine play without pre-defined responses" — you must beat/hold the engine, so success = achieving the outcome against a live defender, not reproducing a move sequence. Same thread: a user "lost 1 hour trying" one drill, implying unlimited rapid retries. [V] https://www.chess.com/forum/view/general/problems-with-some-drills
- Drill titles/goals are outcome-framed, e.g. "King vs King And Pawn: **Holding The Draw**" ("don't let your opponent's king get in front of the pawn"). Goal text from search snippet; the drill page itself is a JS shell to logged-out fetches. [P] https://www.chess.com/drills/practice/king-vs-king-and-pawn-holding-the-draw
- Hints are available during drill attempts. [V] https://www.chess.com/forum/view/community/how-do-the-drills-work-on-this-website
- Retry-flow speed: **evidence of absence.** Searched Reddit + chess.com forums + YouTube for "retry"/"try again"/restart reports on chess.com drills; found no first-person accounts of the retry UX. Closest adjacent report is a coach's "Groundhog Day" resign→review→restart loop over four days on MoveLibrary (not chess.com) vs Stockfish, illustrating the manual-orchestration pain we target. [V] https://litandchess.substack.com/p/groundhog-day
- A Danny Rensch walkthrough video exists but was not viewed. [P] https://www.youtube.com/watch?v=vzsbroy1J1Q

## Residual uncertainty (needs hands-on)

1. Whether the Practice-vs-Computer takeback bug is now fixed, and whether a successful takeback leaves any variation in the move list on exit back to analysis.
2. Exact click count and latency of drill fail→retry (button placement, whether engine/board state resets instantly).
3. Whether drill completion tolerates suboptimal-but-still-winning play (50-move-rule edge, engine resignation behavior).
4. Mobile parity for Switch Sides and custom-position drills.

## E1 verdict contribution (one line)

A chess.com power user can hand-assemble each piece of our loop (custom position → bot → retry → switch sides) across three disjoint surfaces, but attempt history is destroyed at every rewind and nothing links tries together — supporting "orchestration is the product."
