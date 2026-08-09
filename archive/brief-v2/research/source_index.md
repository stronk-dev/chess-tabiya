# Research source index

**Cut-off:** 2026-08-08

Vendor pages establish claimed capabilities. Forum sources establish demand or user experience, not effectiveness. Academic sources are marked with caveats.

## Core technical and learning sources

### R01 — Not All Practice Is Created Equal
- URL: https://journals.sagepub.com/doi/full/10.1177/09567976261452568
- Use: 44,213-player longitudinal study; deliberate-practice-aligned activities associated with 3.61× learning efficiency versus gameplay.
- Caveat: observational, target population skewed lower than this product's initial audience.

### R02 — Lichess open database
- URL: https://database.lichess.org/
- Use: CC0 game corpus, current scale, monthly archive sizes, streaming decompression.

### R03 — Stockfish UCI documentation
- URL: https://official-stockfish.github.io/docs/stockfish-wiki/UCI-Protocol-and-Stockfish-Commands.html
- Use: MultiPV, WDL, strength limiting, Syzygy integration and worker configuration.

### R04 — Maia-3
- URL: https://github.com/CSSLab/maia3
- Use: UCI human-move model, 5M/23M/79M, Elo conditioning, sampling, MultiPV, AGPL.

### R05 — Syzygy in python-chess
- URL: https://python-chess.readthedocs.io/en/stable/syzygy.html
- Use: WDL/DTZ semantics and seven-piece support.

### R06 — Syzygy tablebase repository
- URL: https://github.com/syzygy1/tb
- Use: six-piece WDL/DTZ storage figures.

## Directly relevant training products and methods

### R07 — ChessDojo Guides
- URL: https://www.chessdojo.club/learn/guides
- Use: opening sparring around moves 5–15, continue to 25–30, analyze afterward; bot/human guidance.

### R08 — ChessDojo Middlegame Sparring Position #3
- URL: https://www.chessdojo.shop/middlegames/middlegame-sparring-position-%233
- Use: repeat four games per color at 15+5.

### R09 — Chess Endgame Training
- URL: https://chess-endgame-trainer.web.app/
- Use: Syzygy/Stockfish play, win/draw goals, branch continuation, manual what-if, arbitrary FEN.

### R10 — Chess Endgame Training source
- URL: https://github.com/supertorpe/chessendgametraining
- Use: open-source implementation and product intent.

### R11 — Listudy opening-learning article
- URL: https://listudy.org/en/blog/learning-chess-openings
- Use: explicit statement that Listudy trains memorization and cannot replace theory learning.

### R12 — Listudy
- URL: https://listudy.org/
- Use: open-source spaced-repetition repertoire training.

### R13 — Chessdriller
- URL: https://github.com/denizsafak/chessdriller
- Use: self-hosted opening repertoire SRS.

### R14 — DrillChess extension
- URL: https://chromewebstore.google.com/detail/drill-chess/ggfielhhicpkogifcjhijclojjlibpmb
- Use: randomized Lichess-study move/chapter drilling.

### R15 — Chess From Position
- URL: https://lichess.org/@/NishAz/blog/chess-from-position-dive-into-real-random-chess-positions/QgL93ERv
- Use: real-game position generation, filters, Lichess AI/human challenge launch.

### R16 — Balanced middlegame generator forum thread
- URL: https://www.reddit.com/r/chess/comments/1oy1cm9/i_built_a_generator_that_gives_you_random/
- Use: Maia self-play plus Stockfish validation; user demand for middlegame position filters.

### R17 — Noctie
- URL: https://noctie.ai/
- Use: opening selection, full games, human-like bot, custom positions/endgames.

### R18 — Noctie opening training
- URL: https://noctie.ai/learn-chess-openings/
- Use: empirical opening responses and continuation into human-like play.

### R19 — Chessiverse
- URL: https://chessiverse.com/
- Use: human-like bot and position practice benchmark.

### R20 — SparringChess
- URL: https://sparringchess.com/
- Use: opening practice driven by real statistics.

### R21 — Chess.com Practice
- URL: https://www.chess.com/practice
- Use: drills and play-from-position benchmark.

### R22 — Chess.com custom position play
- URL: https://support.chess.com/en/articles/8583775-how-do-i-play-against-the-computer-from-a-custom-position
- Use: custom-position, side switch and bot play.

### R23 — Chessable bot from course position
- URL: https://www.chess.com/blog/Chessable/train-against-bots-the-highly-requested-feature-is-here
- Use: current ability to continue from course positions against a bot.

### R24 — ChessTempo opening training
- URL: https://chesstempo.com/opening-training/
- Use: repertoire tree and spaced repetition.

### R25 — ChessTempo FAQ
- URL: https://chesstempo.com/faq/
- Use: endgame distance-to-mate grading behavior.

### R26 — endgametrainer.com
- URL: https://endgametrainer.com/
- Use: human-selected endgame puzzles including drawing objectives.

### R27 — WhyThisMove open source
- URL: https://whythismove.com/open-source
- Use: open-source Stockfish + Maia + Lichess + LLM prior art.

### R28 — Maia Chess frontend
- URL: https://github.com/csslab/maia-platform-frontend
- Use: open-source Maia training/analysis platform.

### R29 — Chessstack
- URL: https://www.reddit.com/r/selfhosted/comments/1ryvgxd/i_built_chessstack_a_chess_opening_repertoire/
- Use: current self-hosted opening repertoire builder/trainer.

### R30 — Opening Thingy
- URL: https://github.com/kylepls/chess
- Use: Lichess-frequency opening simulation and Stockfish analysis.

### R31 — Lucas Chess
- URL: https://lucaschess.pythonanywhere.com/
- Use: local toolbox benchmark.

### R32 — ChessBase/Fritz
- URL: https://en.chessbase.com/
- Use: database, variation and local sparring workstation benchmark.

### R33 — ChessMood
- URL: https://chessmood.com/
- Use: authored opening/middlegame/endgame course benchmark.

### R34 — Chessload
- URL: https://chessload.com/
- Use: free strategic and endgame exercise benchmark.

## Forum problem signals

### R35 — How to actually learn openings, not memorize
- URL: https://www.reddit.com/r/chess/comments/1kuao9i/how_to_actually_learn_openings_not_memorize_but/

### R36 — What do you even do in the middlegame?
- URL: https://www.reddit.com/r/chess/comments/am7gqe/what_do_you_even_do_in_the_middle_game/

### R37 — Engine analysis does not teach this plan
- URL: https://www.reddit.com/r/chess/comments/17oaolo/ive_been_struggling_to_create_plans_in_the_middle/

### R38 — Endgame practice resources
- URL: https://www.reddit.com/r/chess/comments/437vt2/endgame_practice_resources/

### R39 — Practice opening endpoints as middlegames
- URL: https://www.reddit.com/r/chess/comments/1bqanlj/how_do_i_learn_basic_middlegame_ideas_based/

### R40 — Endgame draw-saving trainer announcement
- URL: https://www.reddit.com/r/chess/comments/15wkdec/i_made_endgametrainercom_a_website_with_2000/

## Optional future model sources

### R41 — ChessMimic
- URL: https://arxiv.org/abs/2606.04473
- Use: per-rating human move, clock and outcome prediction alternative.
- Caveat: preprint.

### R42 — Chessformer / Maia-3 paper
- URL: https://arxiv.org/abs/2605.19091
- Use: architecture and move-prediction research.

## APIs and human sparring infrastructure

### R43 — Lichess API
- URL: https://lichess.org/api

### R44 — Chess.com Published Data API
- URL: https://www.chess.com/news/view/published-data-api

### R45 — Lichess custom-position challenge discussion/API
- URL: https://lichess.org/forum/lichess-feedback/lichess-api-challenge-the-ai

### Lichess Puzzler — official open-source generator

- URL: https://github.com/ornicar/lichess-puzzler
- Evidence: generates puzzle candidates from the Lichess game database using Stockfish, followed by validation/categorization.
- Use: corrects the claim that Lichess puzzle positions never occurred; the real criticism is decontextualization and training distribution.
