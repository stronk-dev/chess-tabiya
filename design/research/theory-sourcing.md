# Theory Sourcing — Source Inventory for Drill-Pack Content

Date: 2026-08-11
Feeds: content phase (pack authoring), open questions Q6 (spine naming/skeleton) and Q7
(endgame position sourcing), and the coverage-matrix GAP row (where do positions and
prose come from that competitors license commercially?).
Rights frame (from prior ruling): original prose only OR compatibly-licensed prose with
attribution; moves and game-scores are uncopyrightable facts; Lichess data is CC0; our
code is AGPL-3.0. Content licensing is kept separate from code licensing.

Verification tags: [V] = fetched and confirmed at the URL given; [P] = partial (snippets
or fetch blocked); nothing below is asserted without one of the two.

## 1. lichess-org/chess-openings — spine-name backbone

- What: Lichess's aggregated dataset of chess opening names — the de facto community
  standard mapping ECO code + name <-> move sequence.
- License [V]: CC0-1.0. GitHub license API reports `spdx_id: CC0-1.0` (COPYING.txt).
  https://github.com/lichess-org/chess-openings
- Format [V]: five TSVs (`a.tsv`..`e.tsv`, one per ECO volume), columns `eco`, `name`,
  `pgn` (UCI/EPD are derivable). Downloaded and counted 2026-08-11: 3,815 lines total,
  3,810 data rows after headers (a: 817, b: 772, c: 1250, d: 614, e: 357).
- Names are hierarchical: `Sicilian Defense: Najdorf Variation, English Attack` — i.e.
  family/variation/subvariation structure we can hang spine nodes on directly.
- Pack need served: spine-skeleton (canonical names + checkpoint positions). Verdict:
  primary backbone, zero rights friction.

## 2. Lichess opening explorer API — popularity/result evidence

- What: aggregated stats per position: masters DB, rated Lichess games, per-player.
  Repo: https://github.com/lichess-org/lila-openingexplorer (AGPL-3.0) [V].
- Endpoints [V, from the OpenAPI spec at
  raw.githubusercontent.com/lichess-org/api/master/doc/specs/lichess-api.yaml]:
  `/masters`, `/lichess`, `/player`; params include `fen`, `play` (UCI moves),
  `variant`, `speeds`, `ratings` (rating buckets), `modes`, `since`/`until`. Docs state
  the hostname is `explorer.lichess.org` (historically `explorer.lichess.ovh`).
- Terms/rate limits [V, same spec]: "All requests are rate limited... Only make one
  request at a time"; on 429, wait at least one minute. No separate ToU for explorer.
- Live probe 2026-08-11 [V]: `tablebase.lichess.org` answered anonymously, but both
  explorer hostnames returned `401 Authorization Required` (with and without a
  User-Agent). Plan for OAuth-token requests; see residual unknowns.
- Pack need served: evidence (per-rating-band popularity and win rates to grade
  checkpoint moves). The API serves stats, not copyrightable text; underlying game
  data is CC0 (see §6).

## 3. Wikibooks "Chess Opening Theory" — idea prose

- What: community wikibook, one page per move sequence, with a theory table.
  https://en.wikibooks.org/wiki/Chess_Opening_Theory [V]
- License [V]: CC BY-SA 4.0 (footer: "Text is available under the Creative Commons
  Attribution-ShareAlike License"; deed link is to 4.0).
- Depth [V]: real per-line idea prose exists, not just tables. The Najdorf page
  (…/5._Nc3/5...a6) explains e.g. that 5...a6 "controls the b5 square. This is
  prophylaxis, removing White's options of Ndb5 or Bb5+, and supports ...b5 and ...b4".
  Coverage is uneven (book self-rates "50% developed"); mainlines good, sidelines thin.
- Composition with AGPL / our packs, honestly: CC BY-SA share-alike attaches to the
  *prose*, not to code that displays it. Keeping pack content data files separate from
  AGPL-3.0 code is a normal and defensible aggregation, same as Wikipedia-in-an-app.
  BUT any pack prose that adapts/translates Wikibooks text becomes a derivative and
  must itself be CC BY-SA 4.0 with attribution — which then constrains later
  relicensing of those packs. Two clean postures: (a) all-original prose, cite
  Wikibooks only as a reference; (b) declare pack prose CC BY-SA 4.0 wholesale and
  reuse freely. Do not mix per-paragraph — provenance tracking will not survive edits.
- Pack need served: prose (idea/checkpoint annotations), and a coverage checklist.

## 4. Chess Endgame Training's credited databases — Outcome Drill roots

Host app: https://github.com/supertorpe/chessendgametraining — GPL-3.0 [V from raw
LICENSE]. Its "3dparty resources" README section credits two position databases [V]:

- 4a. "ECO Chess Opening Codes Endgame database" ->
  https://ecochessopeningcodes.blogspot.com/2016/01/play-chess-endgame-positions-with.html [V].
  A Blogspot compilation of endgame FENs (post cites ~25,699 positions), itself credited
  to `http://elearning.usm.md/endgame/#`. **No license stated anywhere** in the post;
  upstream provenance unclear. Individual FENs are facts, but wholesale reuse of the
  curated compilation risks EU database right. Verdict: do not ingest; regenerate.
- 4b. "Database with 100.000 checkmating pattern positions" ->
  https://github.com/calebjcourtney/chess-endgame-training [V]. Exists; `db.sqlite3`
  of 100k mate-in-N positions (10k per N), **derived from the Lichess open game
  database (CC0)**; repo license GPL-3.0. Verdict: legally reusable under GPL-3.0
  attribution, but the cleaner path is to re-derive equivalent positions ourselves
  from the CC0 Lichess dumps/puzzles — same source, no GPL string attached to data,
  and we control the mate-in-N distribution. The method is trivially reproducible.

## 5. Syzygy tablebases — ground-truth grading for endgame drills

- Generator: https://github.com/syzygy1/tb [V] — code GPL-2.0-only (plus BSD/other for
  bundled libs). Generated files, per the README: "All tablebase files generated using
  this generator may be freely redistributed. In fact, those files are free of
  copyright at least under US law (following Feist...) and under EU law (following
  Football Dataco...)." I.e. the data files are unrestricted.
- Lichess tablebase API [V live 2026-08-11]: `https://tablebase.lichess.org/standard?fen=…`
  answered anonymously with DTZ/DTM/category JSON — usable for grading positions by
  result (win/draw/loss) without hosting files. Same one-request-at-a-time etiquette.
- syzygy-tables.info [P]: fetch blocked by anti-bot (Anubis); its download mirrors not
  verified this pass.
- Pack need served: positions/grading — authoritative result labels for <=7-man
  Outcome Drill roots.

## 6. Other verified open sources

- Lichess database exports, https://database.lichess.org/ [V]: games, evaluations, and
  the **puzzle database: 6,057,356 rated+tagged puzzles**, CSV with `FEN, Moves,
  Rating, Themes, OpeningTags, …`. License quote: "Database exports are released under
  the Creative Commons CC0 license. Use them for research, commercial purpose,
  publication, anything you like." Serves: positions (endgame + tactic drills,
  filterable by rating and theme) — the single richest position source we have.
- Lichess puzzle-theme taxonomy [V]:
  raw.githubusercontent.com/lichess-org/lila/master/translation/source/puzzleTheme.xml —
  ~85-90 themes with names + one-line descriptions (fork, backRankMate, rookEndgame,
  queenEndgame, smotheredMate, mateIn2, …). File is part of lila (AGPL-3.0): reuse the
  theme *keys* (facts/API vocabulary) freely; write our own description prose.
- Wikipedia chess articles [V]: CC BY-SA 4.0 per
  https://en.wikipedia.org/wiki/Wikipedia:Copyrights ("…under the terms of the Creative
  Commons Attribution-ShareAlike 4.0 International License…"). Najdorf article is
  substantial (history, 6.Bg5/English Attack/Sozin sections). Same share-alike calculus
  as §3. Serves: prose (background/history), reference-checking.
- Lichess studies [V, https://lichess.org/terms-of-service]: authors "retain your
  rights in any content you submit"; the license grant runs to Lichess only. **No
  blanket third-party reuse right** — a study's annotations are the author's copyright.
  Usable only with per-author permission; the bare moves inside are still facts.

## Composition map

| Pack need | Source(s) | License posture |
|---|---|---|
| Spine skeleton (names <-> move trees, ECO) | chess-openings TSV (§1) | CC0 — unrestricted |
| Evidence (popularity/results per rating band) | Explorer API (§2), game dumps (§6) | Facts / CC0; API etiquette + auth caveat |
| Idea/checkpoint prose | Original writing; optionally Wikibooks/Wikipedia (§3, §6) | Original: ours. Adapted: CC BY-SA 4.0 + attribution, kept out of AGPL code tree |
| Endgame drill positions | Lichess puzzle DB (§6), re-derived mate-in-N (§4b method), curated original sets | CC0 / ours |
| Result grading for endgames | Syzygy via Lichess tablebase API or local files (§5) | Data copyright-free; generator GPL irrelevant to data |
| Theme taxonomy | Lichess puzzle theme keys (§6) | Keys as facts; own descriptions |

## Do not use

- **TWIC downloads** [V, theweekinchess.com/twic]: "TWIC magazine is free for personal
  use only. All rights are reserved." No commercial reuse/redistribution.
- **PGN Mentor collections** [V, pgnmentor.com/files.html]: no license or terms stated
  at all — silence is not permission for the curated compilations; skip.
- **ecochessopeningcodes endgame DB** (§4a): unlicensed compilation, murky provenance.
- **Lichess studies in bulk** (§6): author-owned; per-author permission only.
- **calebjcourtney db.sqlite3 verbatim** (§4b): usable in principle (GPL-3.0) but
  re-derive from CC0 instead to avoid GPL-on-data arguments.

## Residual unknowns

- Explorer API 401s: both hostnames refused anonymous requests from this machine on
  2026-08-11 despite docs implying open access — confirm whether an OAuth token (or a
  different network) resolves it before committing the evidence pipeline to live calls;
  fallback is precomputing evidence from the CC0 monthly dumps.
- Wikibooks per-line coverage breadth (how far past mainline move ~9 the prose goes)
  needs a systematic crawl, not spot checks, before relying on it for deep spines.
- Syzygy download mirror inventory (syzygy-tables.info blocked; exact Lichess mirror
  paths unverified) — only matters if we self-host tablebase files.
- elearning.usm.md/endgame (upstream of §4a) unfetched; irrelevant if we skip 4a.
