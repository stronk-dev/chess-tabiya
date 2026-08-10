# Teardown: Chessable (desk research)

- Date: 2026-08-11
- Feeds: Q1a / E1 (does any incumbent bridge recall -> understanding/play?)
- Method: desk / experience mining — official blog + help center (fetched), third-party reviews (fetched), forums (partial). Product NOT run.
- Provenance tags: [V] = URL fetched and read; [P] = search-snippet only; [M] = model knowledge.

## Q1 — Bot-from-course-position: is there a post-game tie-back to the course?

Finding: **No. It is a one-way handoff to Chess.com; nothing connects the game back to the course.**

- Launch flow [V]: "In Learn or Review mode, or while browsing, simply click on the robot icon in the toolbar ... You'll be taken to Chess.com, where a bot game will start from this exact position." — official announcement, June 19, 2026: https://www.chessable.com/blog/train-against-bots-the-highly-requested-feature-is-here/
- In-game feedback is Chess.com's generic engine feedback, not course-linked [V]: "You can also choose your preferred level of feedback: either none, for a real-game experience, or a quick evaluation after every move you make." (same blog URL)
- Closing the loop is left to the user [V]: "The results of your bot games can help reveal which positions you truly understand and which ones deserve a closer look in your course." — i.e., Chessable itself frames the reflection step as manual; no automated post-game tie-in, no course-concept-referencing feedback is described. (same blog URL)
- Chess.com's bot-game assistance (the environment the learner lands in) is generic: Move Feedback "compare to the best move", eval bar, threat/suggestion arrows, engine lines [V]: https://support.chess.com/en/articles/8614091-how-can-i-play-against-the-chess-com-bots — no mention of Chessable or custom-position course context in that article.
- Evidence of absence: no mention of results syncing back to Chessable, post-game course-referenced review, or MoveTrainer scheduling reacting to bot-game outcomes in: the announcement blog post [V], Chessable help-center search results for "bot"/"practise against" (no matching support article surfaced) [P], or Chess.com's bot help article [V].

Bot human-likeness:

- Bots are Chess.com's personality/celebrity/engine bots, Elo 250–3200 ("GothamChess (2500)", "Steve Aoki (1000)", Magnus/Levy legends) [V] (Chessable blog above); Chess.com documents ~100+ personalities incl. adaptive ones plus a plain adjustable engine [V] (chess.com support article above).
- Per user reports these are engine-with-handicap, not human-like [V]: "Computers are not 800-rated ... They are 3800-rated with random mistakes thrown in ... Most humans are not going to play tactically perfect games and then hang their queen out of nowhere. Bots do that all the time." — https://www.chess.com/forum/view/for-beginners/is-playing-against-the-bots-good-practice (thread predates the Chessable integration but concerns the same bots).

## Q2 — Deviation handling in MoveTrainer when the learner plays a sound alternative

Finding: **Engine-vetted "soft fail": the sound alternative is acknowledged, not punished — but you are bounced back and must still produce the author's move. Alternatives are recognized, not taught.**

- Official definition [V]: https://support.chessable.com/en/articles/9043806-what-are-soft-fail-moves — openings: any move within a 0.3 eval margin of the best move (5s/position on a strong engine); tactics: mate-preserving or within 1.0; endgames: any tablebase-equivalent move. On playing one "you might see a 'Try Again' message" during review.
- Origin/behavior [V]: "if you play something other than the text move, you will not be penalised with a mistake. Instead, you get to try again. In this manner, you will not only learn the main line ... but easily start to recognise and remember viable alternatives." — https://www.chessable.com/blog/bringing-chess-books-life-introducing-new-features-make-possible/ (2017, "Soft error/alternative moves calculated by an engine")
- SRS interaction [V]: "play a different move to the text move without penalising you ... the system will recognise this and refresh your timer so that you have enough time to recall the text move." — https://www.chessable.com/blog/endgame-training-with-100-endgames-you-must-know/
- So: sound-but-off-book = no SRS failure, but no explanation of the alternative either, and the drill still converges on the single text move. Moves outside the margin are plain failures. A strictness setting exists ("you fail if you don't strictly make the move author envisioned") [P]: https://chessentials.com/chessable-honest-review/ (fetched [V], quote reproduced by extraction model).
- Soft fail is per-course batch computation, PRO-gated for self-made courses, "should" be on for all published courses [V]: https://support.chessable.com/en/articles/9043813-why-are-soft-fail-alternative-moves-not-enabled-on-my-course
- Author-provided "alternative lines" exist but are parallel flashcards, and Chessable advises pausing one to avoid recall interference [V]: "If you learn both and leave both active, you may have problems recalling the right move during review." — https://support.chessable.com/en/articles/9043278-what-are-alternative-lines

Continue past end of variation into free play with guidance?

- The only continuation paths are (a) the bot handoff above — free play, but guidance is Chess.com's generic eval, not course-linked [V] (bots blog), and (b) a plain analysis board ("search glass" icon: move pieces, engine, notes, PGN export) [V]: https://support.chessable.com/en/articles/9028901-how-do-i-easily-go-from-movetrainer-to-an-analysis-board-with-a-chess-engine
- No mode found that continues past a variation's end into free play with course-aware guidance, in any source searched.
- Third-party corroboration of the gap: "fantastic at memorization and weak at understanding ... memorized moves collapse the moment your opponent plays something off-book" [V]: https://checkmatex.app/blog/chessable-review-i-tried-it-for-30-days ; "When opponents deviate, you are on your own." [V, competitor page — bias noted]: https://chessiverse.com/compare/chess-opening-practice-tools-compared

## Residual uncertainty (needs hands-on)

- Whether the bot game result/PGN appears anywhere back on Chessable (account linkage exists via Chess.com login; blog is silent). Needs a real run of the robot-icon flow.
- Exact soft-fail UX in 2026 clients (web vs app): whether "Try Again" shows the alternative's eval or any text, and where the strict-mode toggle now lives.
- Whether soft fail counts toward "difficult move" stats or affects scheduling beyond the timer refresh.
- Chessable's own forum threads on alternatives (e.g. /discussion/thread/160684/, /937862/) are JS-rendered and were not readable ([P] titles only: "Alternative in move trainer", "Soft Fails/Alternatives"); user sentiment there unverified. Reddit was inaccessible to our crawler (domain blocks robots) — no Reddit evidence gathered either way.

## E1 verdict contribution (one line)

Chessable now owns the "play it out" step (June 2026 bot launch) but the bridge is a one-way link to a generic Chess.com engine-bot with no course-aware feedback before, during, or after the game, and MoveTrainer still converges every deviation back onto one memorized text move — the recall -> understanding gap claim survives, narrowed but intact.
