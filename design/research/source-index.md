# Research source index (living)

Continuation of `archive/brief-v2/research/source_index.md` (**R01–R45**, cut-off
2026-08-08, frozen). New sources get **R46+** here; corrections to frozen entries are
noted here, never edited there.

Conventions (inherited): vendor pages establish claimed capabilities; forum sources
establish demand or user experience, not effectiveness; academic sources carry caveats.
Every entry: URL, Use, Caveat. Evidence labels per `design/research/README.md`
(`[V]/[P]/[M]`).

## Corrections to frozen entries

### R42 — Chessformer is not a Maia-3 alternative `[V]`

- Verified: 2026-08-09 against the official Maia-3 repository and ICLR 2026 paper.
- Correction: Chessformer is the architecture on which the Maia-3 human-move-prediction
  family is built. It is not a separate runnable policy to benchmark against Maia-3.
- URLs: https://github.com/CSSLab/maia3 · https://openreview.net/forum?id=2ltBRzEHyd
- Use: exploration Q5 engine/policy taxonomy.

## New sources

### R46 — chess.com forum: "How to respond to the Caro-Kann"
- URL: https://www.chess.com/forum/view/chess-openings/how-to-respond-to-the-caro-kann
- Use: demand signal — club players asking how to face the Caro-Kann as White.
- Caveat: `[P]` owner-supplied 2026-08-10, not yet fetched; anecdote, problem-shape only.

### R47 — r/chessbeginners: "Caro-Kann is so frustrating when White doesn't take"
- URL: https://www.reddit.com/r/chessbeginners/comments/10kxdjl/carokann_is_so_frustrating_when_white_doesnt_take/
- Use: demand signal — the anti-opening pain from the Black side; both sides find the structure hard.
- Caveat: `[P]` owner-supplied, not yet fetched; anecdote.

### R48 — r/chess: "Can White kill the game easily against the Caro-Kann?"
- URL: https://www.reddit.com/r/chess/comments/1mi5k5v/can_white_kill_the_game_easily_against_the/
- Use: demand signal — White players seeking a practical anti-Caro approach.
- Caveat: `[P]` owner-supplied, not yet fetched; anecdote.

### R49 — r/chess: "Am I crazy or is the Caro-Kann Advance super hard?"
- URL: https://www.reddit.com/r/chess/comments/17ljl82/am_i_crazy_or_is_the_carokann_advance_super_hard/
- Use: demand signal — the Advance (3.e5) specifically experienced as enticing-but-hard; supports the anti-opening pack candidate (BACKLOG).
- Caveat: `[P]` owner-supplied, not yet fetched; anecdote.

### R50 — Chessiverse: how its bots are created
- URL: https://chessiverse.com/articles/how-chessiverse-bots-are-created
- Use: first-party description of candidate curation, stronger-engine filtering, measured output
  traits, bot-specific/statistical opening repertoires and perceived-error complaints.
- Caveat: `[V]` for the vendor's documented mechanism and roadmap wording; `[P]` for effectiveness
  and user-response generalization because this pass did not inspect its implementation or recruit
  its users.

### R51 — Otter: time-aware, history-conditioned human chess AI
- URL: https://arxiv.org/html/2608.05206v1
- Use: history/time as human-policy base-model capabilities; paper-reported ablations and future
  adapter candidate.
- Caveat: `[P]` preprint; training, populations and headline comparison were not reproduced here.

### R52 — pinned Maia-3 UCI sampler source
- URL: https://github.com/CSSLab/maia3/blob/1e13597c42d4858b7cfd7cfdae01e297263364b2/maia3/uci.py
- Use: separates raw emitted policy from temperature/top-p `bestmove` sampling for R11.
- Caveat: `[V]` at the exact source commit packaged by `workers/maia/Dockerfile`; future pins must
  be re-audited.

### R53 — Set-dependent aggregation for choice prediction
- URL: https://proceedings.mlr.press/v119/rosenfeld20a.html
- Use: materially distinguishes a legal-set-conditioned choice model from D1297's independent
  candidate utility; source for the next non-Maia selector family.
- Caveat: `[V]` architecture/claims from the primary ICML paper; its three evaluations are not chess
  and no effectiveness transfers to Tabiya without measurement.

### R54 — Set Transformer
- URL: https://proceedings.mlr.press/v97/lee19d.html
- Use: permutation-invariant/equivariant interaction architecture over variable-size candidate sets;
  source for the legal-move-set symmetry requirement.
- Caveat: `[V]` architecture/complexity from the primary ICML paper; not evaluated on chess and too
  high-capacity to justify from Tabiya's 515-decision development set alone.

### R55 — Allie: human-aligned chess with time-adaptive search
- URL: https://arxiv.org/abs/2410.03893
- Use: sequence, pondering, resignation and search context as parts of a human-policy claim; online
  strength calibration comparison.
- Caveat: `[P]` paper-reported results, not reproduced here; not a released Tabiya adapter.

### R56 — ChessMimic: move, clock and outcome prediction by rating band
- URL: https://arxiv.org/abs/2606.04473
- Use: independent primary-source evidence that history, rating and clock are declared model inputs,
  not post-hoc bot cosmetics.
- Caveat: `[P]` recent preprint; results and released code were not reproduced in this pass.

### R57 — Lichess open database
- URL: https://database.lichess.org/
- Use: CC0 human-game source for the D1329 training-data census; documents Elo tags, `%clk`, BOT
  titles, variants, partial Zstandard decompression and known data issues.
- Caveat: `[V]` source contract and a fresh June-2026 prefix; chronological-prefix counts are not a
  representative month-wide population estimate.

### R58 — Chess.com Classroom official workflow
- URLs: https://support.chess.com/en/articles/8708915-how-do-i-use-classroom-on-chess-com ·
  https://www.chess.com/classroom
- Use: current entry, source loading, room media/management and participant board-control claims.
- Caveat: `[V]` primary-source capability record; no authenticated room was driven and vendor
  documentation does not establish reliability.

### R59 — Lichess Classes surface, source and authority warning
- URLs: https://lichess.org/class · https://github.com/lichess-org/lila/blob/master/conf/routes/ ·
  https://github.com/lichess-org/lila/security/advisories/GHSA-8738-rh94-9c27
- Use: managed class identities, progress/messaging scope, distinct class login, and a concrete
  route-vs-UI authority failure relevant to custodial-account design.
- Caveat: `[V]` primary/open-source/advisory claims; the product was not driven. The advisory is a
  report about Lichess, not evidence of a Tabiya defect.

### R60 — ChessKid classroom and institution workflows
- URLs: https://support.chesskid.com/en/articles/8867959-coach-how-can-i-review-my-students-games ·
  https://www.chesskid.com/learn/articles/new-chesskid-experience-for-your-teachers-schools-districts ·
  https://www.chesskid.com/learn/articles/how-to-use-the-chesskid-live-classroom-tool
- Use: report-card breadth, organization/group/teacher hierarchy, and live room with child-safe
  media, saved positions and learner board control.
- Caveat: `[V]` official capability record; effectiveness/testimonials `[P]`; no educator account
  or child account was used.

### R61 — Chessity teacher workflow
- URLs: https://www.chessity.com/en/school ·
  https://www.chessity.com/en/blog/1405/New_teacher_dashboard_now_available_ ·
  https://www.chessity.com/en/group-prices
- Use: curriculum, group management, progress/trouble-spot filters, and recommended-path versus
  free-navigation control.
- Caveat: `[V]` vendor-documented product shape; adaptive-effectiveness and testimonials `[P]`;
  no teacher dashboard was driven.

### R62 — Chess.Run lesson-centred LMS/CRM
- URLs: https://chess.run/en_gb/chess-school · https://chess.run/features/homework-progress ·
  https://chess.run/en-gb/features/first-online-lesson
- Use: material→live lesson→homework→review continuity plus the separate academy-operations seam.
- Caveat: `[V]` vendor-documented workflow; reliability, grading usefulness and learner data
  boundaries unverified; no trial account used.

### R63 — ChessPlay.io academy operating system
- URLs: https://chessplay.io/ · https://help.chessplay.io/
- Use: current academy-in-a-box capability census: classroom, homework, reports, parent access,
  tournament, fee and branding surfaces.
- Caveat: `[V]` for current vendor claims only; most detail is marketing, testimonials `[P]`, and
  the product was not driven.

### R64 — classroom love/hate and unmet-workflow reports
- URLs: https://www.chess.com/forum/view/general/classroom-problems-any-online-coaches-having-problems-too ·
  https://www.chess.com/forum/view/chess-lessons/best-format-for-getting-coaching ·
  https://lichess.org/forum/lichess-feedback/lichess-classes-what-is-it ·
  https://github.com/lichess-org/lila/issues/18341 ·
  https://lichess.org/forum/lichess-feedback/feature-request-for-lichess-classes-simultaneous-exhibitions-between-teacher-and-students
- Use: reported value (joined board/media, coach data, messaging) and friction (sync/reliability,
  material persistence, child login, teaching-specific simuls).
- Caveat: `[P]` anecdotal public reports, not prevalence or current-product proof. Chess.com
  reliability reports are from 2022–2023 and explicitly require current hands-on recheck.

*(next: R65)*
