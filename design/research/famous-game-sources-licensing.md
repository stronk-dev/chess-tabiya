# Famous-game sources and licensing — can we build packs from historical master games?

**Commissioned by** owner ruling **D1043** (2026-08-23): *resolve the famous-game licence
question properly rather than ruling around it.*
**Answers** the licence half of [[D329]] (owner question 2026-08-16: *"what if we want packs
based off of famous previous games?"*) and the unruled refusal at
`apps/server/src/capabilities.ts:159`.
**Method** — desk-legal research against primary sources plus **hands-on probes of the live
Lichess explorer endpoints** and a code census at HEAD (2026-08-23).
**Evidence labels** per `design/research/README.md` §House rules. 🟢/🟡/🔴 mark **legal risk
only**, never confidence.

> **Not legal advice; the author is not a lawyer.** This is a traceable evidence pack for an
> owner decision. Every legal claim carries a source URL or is explicitly marked uncertain.

---

## 0. The refusal record, quoted exactly

`apps/server/src/capabilities.ts:159` at HEAD `[V]`:

```ts
{ instrument: "Explorer", capability: "topGames / recentGames / masters database", disposition: "refused", reason: "Per-game scope and licence questions remain unresolved" },
```

Three things about that record `[V]`: it is a **single row bundling three capabilities** —
`topGames` and `recentGames` (parameters of the `/lichess` endpoint we already call) plus the
whole `/masters` database; its reason is a **conjunction of two unlike things** (*"per-game
scope"* is a product judgement about what the corpus panel renders, *"licence questions remain
unresolved"* is a falsifiable claim about the outside world, and only the second is this
dossier's business); and that reason is the **present continuous of an unanswered question** —
nothing in the repo ever asked it, and it has stood since 2026-08-16, the day D329 was raised.

The adjacent Explorer rows at `capabilities.ts:155-158` are `reached` for position and per-move
`white/draws/black`, whose recorded rationale is at `apps/server/src/sourcing/explorer.ts:23`
`[V]`:

```ts
export const EXPLORER_RATIONALE = "aggregate statistics are facts; the underlying Lichess game data is CC0; requests are serialized to follow the Lichess opening-explorer etiquette";
```

That rationale has **two independent legs**. Leg one (*aggregate statistics are facts*) is a
legal proposition that applies to `/masters` identically. Leg two (*the underlying data is CC0*)
is a source-specific fact that does **not** apply to `/masters`. Section 6 turns on which leg
the refusal was actually standing on — and the answer is that nobody recorded which.

`planning/rfc-drafting-queue.md:473` carries the NEEDS-OWNER question
(*"Are famous-game packs in scope as a first-class provenance axis?"*). **Citation defect,
noted in passing:** `planning/platform-alignment/refused-vs-asked.md:61` and
`design/BACKLOG.md:380` both cite that row as `planning/defect-triage.md:473`; at HEAD
`defect-triage.md:473` is inside the NEEDS-RFC narrative and the NEEDS-OWNER row lives in
`rfc-drafting-queue.md` `[V]`.

---

## 1. What the Lichess masters database actually is, and what its terms actually say

### 1a. The endpoint and its documented terms

The masters database is served by `lila-openingexplorer` on a **separate host**,
`explorer.lichess.org`. The API reference's *entire* Opening Explorer tag description is `[V]`
(https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/lichess-api.yaml:221-228):
*"Lookup positions from the Lichess opening explorer. Runs
<https://github.com/lichess-org/lila-openingexplorer>. [!important] The hostname for these
endpoints is `explorer.lichess.org` and not `lichess.org`."*

**There is no licence statement, no attribution requirement and no redistribution clause on
the Opening Explorer tag — for `/masters` or for `/lichess`** `[V]`. The absence is meaningful
because the same document *does* make such a statement elsewhere: the Puzzles tag says `[V]`

> Our collection of puzzles is in the public domain, you can
> [download it here](https://database.lichess.org/#puzzles).

So Lichess knows how to place a corpus in the public domain when it means to, and has not done
so for the masters database. **It has equally not asserted any right over it.** 🟡

The `/masters` endpoint spec itself (`doc/specs/tags/openingexplorer/masters.yaml`) documents
only mechanics — `fen`, `play`, `since` (default **1952**), `until`, `moves` (default 12),
`topGames` (default 15, **maximum 15**) — plus `security: OAuth2: []` `[V]`. There is a
companion endpoint `GET https://explorer.lichess.org/masters/pgn/{gameId}` returning *"The PGN
representation of the game"* with `Access-Control-Allow-Origin: *` `[V]`
(`doc/specs/tags/openingexplorer/masters-pgn-gameId.yaml`).

### 1b. Hands-on probe, 2026-08-23

Both explorer endpoints were probed live from this working copy `[V]`:

| Probe | Result |
|---|---|
| `GET explorer.lichess.org/masters?play=e2e4` (no token) | **HTTP 401** `Authorization Required` (nginx) |
| `GET explorer.lichess.org/lichess?variant=standard&fen=…` (no token) | **HTTP 401** — *identical* |
| `GET explorer.lichess.org/masters/pgn/aAbqI4ey` (no token) | **HTTP 200**, `content-type: application/x-chess-pgn`, `access-control-allow-origin: *`, `cache-control: public, max-age=2592000` |

**The access posture of `/masters` and `/lichess` is identical** `[V]` — same host, same OAuth
requirement, same undocumented-licence status, same tag. Our code already handles the 401 case
for `/lichess` (`apps/server/src/sourcing/explorer.ts:146`, abstention reason
`source_unavailable`, detail `"HTTP 401 Authorization Required"`) `[V]`. **Nothing at the terms
layer distinguishes the two endpoints.** The only real distinction is §1c.

The masters PGN body returned by the probe, verbatim and complete `[V]`:

```
[Event "Wch Blitz"] [Site "Astana"] [Date "2012.07.10"] [Round "23"]
[White "Carlsen, Magnus"] [Black "Chadaev, Nikolay"] [Result "1-0"]
[WhiteElo "2837"] [BlackElo "2580"]
1. e4 e5 2. f4 d5 3. exd5 exf4 … 43. Rxg7+ 1-0
```

**Seven Seven-Tag-Roster fields, two Elo fields, and a bare movetext. No comments, no NAGs, no
`%eval`, no variations, no annotator tag.** This is decisive for §3: the masters PGN endpoint
is structurally incapable of carrying third-party commentary.

### 1c. What the underlying data is, and the one real asymmetry

- The `/lichess` corpus is built from the monthly dumps at https://database.lichess.org/, which
  state `[V]`: *"Database exports are released under the Creative Commons CC0 license. Use them
  for research, commercial purpose, publication, anything you like. You can download, modify and
  redistribute them, without asking for permission."* The explorer README confirms the import
  path: *"Download database dumps from https://database.lichess.org/"* `[V]`.
- The masters corpus is **not published anywhere**. The explorer README lists it only as *"A
  database of master games"* with no source and no licence; the repository's own licence
  statement — *"Licensed under the GNU Affero General Public License v3"* — is **for the code**
  `[V]` (https://github.com/lichess-org/lila-openingexplorer).
- Community accounts, uncontradicted by any staff post found: the masters DB is *"comprised of
  OTB games of 2200+ FIDE rated players from 1952"*; *"Tony Rottella provided the initial
  Lichess master database when the opening explorer was introduced in 2016"*; *"the @lichess
  account is just one of the game importers"* `[P]`
  (https://lichess.org/forum/lichess-feedback/questions-about-the-masters-database). The
  `since` default of 1952 in the API spec corroborates the date floor `[V]`. Scale: the explorer
  README's `/monitor` example reports `masters_game=2519908u`, ~2.52M games `[P]`.
- Requests to publish the masters index as a dump have gone **unanswered by staff** in at least
  two forum threads `[P]`
  (https://lichess.org/forum/lichess-feedback/download-lichess-master-database,
  https://lichess.org/forum/lichess-feedback/opening-explorer-data-in-databaselichessorg).

**So the asymmetry is real but narrow:** for `/lichess` there is an affirmative CC0 grant over
the underlying games; for `/masters` there is **silence in both directions** — no grant, no
claim. 🟡

### 1d. Lichess's site-wide terms

https://lichess.org/terms-of-service `[V]`: visitors may *"use and reproduce our website for
your personal and commercial use, so long as you comply with the relevant licenses applicable
to the website"*; Lichess reserves the right to *"change the licensing of our services"* and to
*"give privileged access to certain categories of our services (such as special API access) or
revoke access temporarily or permanently as we see fit"*; and *"Lichess is not responsible for
a person … failing to do their own due diligence"* on the licences involved. **There is no
prohibition on using explorer data and no attribution obligation.** The revocation clause is an
operational risk, not a copyright one: access can be withdrawn at will 🟡.

Rate limiting is the one *stated* obligation that would ride any use, from the API reference
introduction `[V]`: *"All requests are rate limited … Only make one request at a time. If you
receive an HTTP response with a 429 status, you have exceded one of the rate limits."* Our
explorer client already serialises requests, caches by URL digest, and sends a contact-bearing
user-agent (`explorer.ts:104-132`) `[V]`.

---

## 2. Are chess game scores copyrightable?

**Short answer: almost certainly not in the US; very probably not in the EU; and honestly
under-litigated everywhere.** The confident half is well sourced; the uncertain half is stated
as uncertain.

### 2a. United States — strongest evidence

- **Feist Publications v. Rural Telephone Service, 499 U.S. 340 (1991)** `[V]`
  (https://www.law.cornell.edu/supremecourt/text/499/340): *"No one may claim originality as to
  facts"*; facts *"do not owe their origin to an act of authorship"*; *"A factual compilation is
  eligible for copyright if it features an original selection or arrangement of facts, but the
  copyright is limited to the particular selection or arrangement"*; "sweat of the brow"
  *"eschewed the most fundamental axiom of copyright law — that no one may copyright facts or
  ideas."* The controlling frame: a game score is a record of what happened.
- **World Chess U.S., Inc. v. Chessgames Services LLC**, No. 1:16-cv-08629-VM (S.D.N.Y., filed
  7 Nov 2016) `[P]`
  (https://natlawreview.com/article/pawn-to-e4-chess-website-kept-check-over-digital-rights-to-publish-players-moves).
  Agon/World Chess sought to stop chess24 and chessgames.com from republishing World
  Championship moves. Judge Victor Marrero **denied the preliminary injunction** on 22 Nov 2016,
  finding defendants were *"collecting factual data from secondary sources and expending their
  own resources to disseminate the news"* rather than free-riding, and that lost revenue was
  *"precisely the type of loss compensable by money damages."*
  **Honest caveat `[P]`:** this was a **preliminary-injunction denial on hot-news and contract
  theories**, not a merits copyright holding; commentary reports World Chess did not press a
  copyright claim in the moves *because* US law so clearly forecloses it
  (https://www.techdirt.com/2016/11/22/ridiculous-hot-news-copyright-battles-as-world-chess-seeks-to-block-others-broadcasting-moves/,
  https://ipkitten.blogspot.com/2016/03/check-but-not-checkmate-agon-sues-for.html). Cite Feist
  for *"moves are facts"*; cite Agon only for *"the one modern attempt to fence off move data
  failed."*
- Practitioner commentary: Aaron J. Moss (partner, Mitchell Silberberg & Knupp), *"Chess and
  Copyright: A Losing Gambit"*, Copyright Lately `[P]` — argues that while pictorial/graphic
  elements of a game may be protected, *underlying game mechanics are akin to ideas and facts
  that aren't protectable*, and chess moves are dictated entirely by rules and mechanics
  (https://copyrightlately.com/chess-and-copyright/; the page returned HTTP 403 to direct fetch
  and is cited from the search abstract, hence `[P]`).

### 2b. Europe — probable but with a named unknown

- The Swiss Federal Institute of Intellectual Property (IPI) — a **government IP office** —
  published *"Chess and copyright – a lost game?"* (Franziska Raaflaub, 15 Dec 2024) `[V]`
  (https://www.ige.ch/en/blog/blog-article/schach-und-urheberrecht-eine-verlorene-partie). Its
  own conclusion is the honest one: **"The question of whether chess games are protected by
  copyright cannot be answered conclusively due to the scarcity of case law and sources."** It
  reports that Walter Jung's 1931 dissertation and a **1994 legal opinion of the German Chess
  Federation** both concluded chess games lack the *"individual character"* copyright requires,
  and notes the 2016 SDNY ruling.
- **Database rights are the EU-specific exposure, and they are not about the moves.**
  Directive 96/9/EC `[V]`
  (https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A31996L0009): Art. 3(1) protects
  by copyright only databases whose *"selection or arrangement … constitute the author's own
  intellectual creation"*; Art. 7(1) gives a *sui generis* right to a maker showing
  *"substantial investment in either the obtaining, verification or presentation of the
  contents"* against extraction of *"the whole or of a substantial part"*; Art. 7(5) forbids
  *"repeated and systematic extraction and/or re-utilization of insubstantial parts … implying
  acts which conflict with a normal exploitation of that database."*
- **British Horseracing Board v William Hill**, C-203/02 (CJEU Grand Chamber, 9 Nov 2004) `[P]`
  (https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A62002CJ0203): the *sui generis*
  right does **not** extend to investment in *creating* the data, only in obtaining, verifying
  or presenting independently existing materials. Lichess *obtains* games created by others, so
  unlike BHB it plausibly falls on the protected side of that line 🟡.
- **The honest EU risk statement:** a *bulk harvest* of the masters index — walking positions
  systematically to reconstruct the corpus — is exactly the shape Art. 7(5) targets 🔴. Fetching
  a **hand-picked set of specific historical games** is not extraction of a substantial part by
  any reading, and those games are separately available elsewhere (§4) 🟢. **The database right
  constrains the harvesting method, not the game.**

### 2c. What is genuinely uncertain

- No court anywhere, on the evidence found, has issued a **merits holding** that a chess game
  score is or is not a copyrightable work `[V]` — the IPI article says as much in terms.
- Jurisdictions differ, and this project's owner is in the Netherlands while Lichess is a
  French non-profit; nothing here was checked against Dutch or French national law `[M]`.
- Nothing found addresses **performers'/players' rights** in a game, moral rights, or event
  organisers' contractual claims over on-site data 🟡 `[M]`. Agon's attempt to build such a
  right by contract failed on the facts of that case; that is not the same as its being
  impossible.

---

## 3. Annotations are the risk surface, and this repo already knows it

The line the sources draw is consistent and unambiguous, even though the sources themselves are
community-grade `[P]`
(https://www.chess.com/forum/view/general/chess-copyright,
https://groups.google.com/g/rec.games.chess.politics/c/k37HPvJGh2c,
https://www.ecforum.org.uk/viewtopic.php?t=7090):

| Object | Position | Risk |
|---|---|---|
| Move sequence, result, player names, event, date | Facts; not copyrightable (Feist) | 🟢 |
| Prose commentary, analysis, variation trees written by an annotator | Original expression; **copyrightable** | 🔴 |
| **NAGs and punctuation marks (`!`, `?`, `!?`)** | Reported as protectable: *"annotating games in any way, even with just ! and ?, creates protectable property"* `[P]` | 🟡 |
| A **selected and arranged collection** (e.g. *"The 100 Most Instructive Games Ever Played"*) | Protected **as a collection**, not in the individual games | 🟡 |
| A bulk unfiltered dump (*"1,000,000 games played on the internet"*) | Little or no selection originality | 🟢 |

The practical rule the sources converge on, quoted `[P]`: *"If you take a collection of games,
strip all commentary, select and reorder the games you do not violate the copyright."*

**Cross-reference to [[D410]] — the same principle, already shipped as a mechanism.** D410
(`design/BACKLOG.md:734`) records that Lichess broadcast PGN ships inline
`{ [%eval 81.15] } { Blunder. Rf8 was best. }` — *"another product's verdict on a move, entering
our corpus as authored-looking text"* — and the live-sources answer is to **strip third-party
grades at the record boundary**. At HEAD `[V]`: `import-source.ts:73` pins
`moves=true&tags=true&clocks=false&evals=false&opening=false&literate=false` on the Lichess
export; `pgn-import.ts` parses via `chessops/pgn` `mainlineNodes()` and keeps only
`{ san, uci }` per move plus headers and result, so **comments and NAGs never enter the run
model**; and [[D959]] (`design/BACKLOG.md:328`) records the residual hole —
`ImportedGameRecord.pgn` stores `source.pgn` **verbatim** (`service.ts:846`), so pasted
commentary survives at the record even though it is dropped at the run.

**The masters source is on the safe side of exactly this line by construction.** The §1b probe
shows its PGN endpoint returns a bare score with no comment tokens at all `[V]`; whatever risk
annotations carry, **`explorer.lichess.org/masters` does not carry it** 🟢. The risk lives in
*other* famous-game sources — books, Informant, ChessBase-annotated files — and in the paste
door D959 names.

**Law-8 note.** Reproducing annotations is also the *product* prohibition, not only a legal one:
an imported annotation is another party's move verdict entering our corpus as authored-looking
text — the D410 shape and the ADR-0005 anti-pattern. Legal answer and doctrinal answer point the
same way, which makes an annotation-scoped refusal cheap to justify and easy to enforce.

---

## 4. Public-domain and openly-licensed alternatives

| Source | Licence / terms | Coverage of "famous games" | Verdict |
|---|---|---|---|
| **Lichess broadcasts DB** — https://database.lichess.org/#broadcasts | **CC BY-SA 4.0**, verbatim: *"Broadcast games are released under the Creative Commons Attribution-ShareAlike 4.0 license."* **1,186,335** games `[V]` | Modern elite OTB only — Lichess-broadcast events, ~2019→present. Excellent for *"the game everyone watched last month"*; useless for Anderssen or Fischer | 🟢 **Best licensed source for contemporary famous games.** Note BY-SA's attribution *and* share-alike; and it is the D410 corpus, so it carries annotations |
| **Lichess standard-games DB** — https://database.lichess.org/ | **CC0**, verbatim: *"Use them for research, commercial purpose, publication, anything you like … without asking for permission"* `[V]` | Online rated games. No historical OTB classics | 🟢 Already our `/lichess` basis; wrong corpus for this question |
| **Lichess masters explorer** — `explorer.lichess.org/masters` | **No stated licence either way**; 401 without a token; per-game PGN publicly served with `ACAO: *` `[V]` | ~2.52M OTB games, 2200+ FIDE, from **1952** `[P]` — covers essentially every modern classic and most pre-modern ones | 🟡 The subject of §6 |
| **The Week in Chess (TWIC)** — https://theweekinchess.com/twic | *"TWIC magazine is free for personal use only. All rights are reserved."* `[V]` | 1994→present, weekly, 5–12k games/issue | 🔴 **Terms explicitly forbid the use we would make.** The moves inside are still facts, but taking them *from TWIC* runs against a stated term. Avoid |
| **chessgames.com** | Users may not *"copy, or in anyway display, reproduce, distribute, modify, or transmit the contents of the Site without prior written permission"*; commercial use prohibited `[P]` (https://www.chessgames.com/terms.html) | Deep historical coverage incl. annotations | 🔴 Avoid entirely |
| **Caissabase / PGN Mentor / Lumbra's Gigabase / Ajedrez Data** | Free downloads, **no clear licence grant**; Caissabase reported unavailable as of 2025 `[P]` (https://mattplayschess.com/free-large-db/, https://lumbrasgigabase.com/en/) | Millions of historical OTB games | 🟡 Usable as *evidence that a game exists in many places*; not a licence basis |
| **Wikipedia / Wikibooks** (e.g. *Kasparov's Immortal*, *Immortal Game*, *Evergreen Game*) | Article **text** CC BY-SA 4.0; the game score inside is a fact `[P]` (https://en.wikipedia.org/wiki/Kasparov%27s_Immortal) | The canonical famous-games shortlist, one article each, with move lists | 🟢 Excellent **corroboration and naming** source; taking the score is safe, taking the prose needs BY-SA attribution |
| **Project Gutenberg** — pre-1929 chess books | Public domain in the US; PG's own trademark/terms attach to the *ebook packaging*, not the underlying text `[P]` (https://www.gutenberg.org/) | Capablanca *Chess Fundamentals*, Ed. Lasker *Chess Strategy*, Staunton, Philidor, Bird's *Chess History and Reminiscences*, Edge's *Morphy* `[V]` (catalogue check 2026-08-23) | 🟢 **The only source of genuinely public-domain *annotated* games.** Morphy/Anderssen/Steinitz-era classics **with commentary we may quote** |

**Coverage honesty:** no single licensed source spans the famous-game canon. Broadcasts cover
2019+, Gutenberg covers pre-1929, and the 1930–2018 middle — Alekhine, Botvinnik, Fischer,
Kasparov — is covered *only* by sources with no affirmative grant. That middle is precisely
where the masters DB is irreplaceable, and precisely where the fact-not-work argument in §2 is
the load-bearing one 🟡.

---

## 5. What this product would actually do with a famous game, at HEAD

### 5a. D329's data claim, re-verified

D329 (`design/BACKLOG.md:983`) claims a famous-game pack is *"expressible as prose but not as
data."* **Verified at HEAD, and one detail is better than the row says** `[V]`:

- `schemas/drill_pack.schema.json` — `phase: ["opening","middlegame","endgame","cross_phase"]`
  and `mode: ["line","plan","outcome","trajectory"]`; both axes present as D329 describes.
  `$defs/provenance` requires only `reviewStatus`; its optional properties are
  `sources: string[]`, `licence: string`, `reviewers: string[]`, `attribution: object[]`,
  `graduationBlockers`; `additionalProperties: false`. `sourceGame` occurs **zero times** in
  `schemas/`, `apps/` or `packages/`. **D329's core claim holds.**
- **What D329 understates:** `provenance` already has a `licence` string *and* an `attribution`
  array (typed only `{ "type": "object" }` — unconstrained, but a slot). **An attribution
  obligation (§6) has somewhere to live today without a schema change**, and
  `sourcing/explorer.ts:247` already enforces that a pack's `provenance.sources` contains the
  explorer rationale before evidence may attach `[V]` — the mechanism for binding a licence
  basis to a pack exists and is tested.

### 5b. Does `importGame` already do most of it?

Partly, and the gap is instructive `[V]` (`apps/server/src/service.ts:788-858`,
`apps/server/src/import-source.ts`):

- `importGame` accepts **exactly two source kinds**: `{kind:"pgn"}` (pasted bytes) and
  `{kind:"lichess"}` (a `https://lichess.org/{8-char-id}` game URL). A famous OTB game has no
  lichess game URL, so **today the only route is paste**, with `licenceNote:
  "no-rights-asserted: learner-supplied bytes"` — honest for a learner, wrong for shipped
  content.
- It replays the mainline into a real `DrillRun` via `commitMove`, so **the consequence loop
  works on an imported historical game right now.** `ImportedGameRecord` already carries
  `sourceKind`, `sourceUrl`, `headers`, `result`, `movetextDigest` and a **`licenceNote`
  string** — a shipped per-source licence-basis precedent a masters lift could reuse verbatim.
- Missing for a *pack*: nothing maps `parsed.headers` (`White`/`Black`/`Event`/`Site`/`Date`)
  onto pack provenance. The run gets a display title
  (`` `${White} – ${Black} (${result})` ``) and that is all.

**So the build is genuinely cheap, as `planning/work-register.md:180-181` prices it:** a
`sourceGame` object on `provenance` carrying the fields the masters PGN already returns
(White, Black, Event, Site, Date, Round, Result, plus a source id), with `variantOf` as the
existing precedent for a structured relation. The licence question was never the expensive part.

### 5c. What is *not* answered here

The **product** question — *are famous-game packs in scope as a first-class provenance axis?* —
is still the owner's, and this dossier deliberately does not answer it. Its consumers
(cross-pack indexing, *"more from this game"*, campaign themes) are unbuilt, and D329's own
`rfc-drafting-queue.md:473` verdict — *"Cheap once ruled; not draftable before"* — stands.

---

## 6. Verdict and recommendation

### 6a. Is the refusal supported?

**No. It is over-broad, and on the licence limb it is unsupported.** `[V]` reasoning:

1. **Asked, the licence question has an answer, and the answer is not "no."** Lichess asserts
   no rights over the masters data and imposes no attribution or redistribution term (§1a, §1d).
   The strongest true statement is *"unlicensed, unclaimed"* — a 🟡, not a 🔴.
2. **The refusal's own neighbours contradict it.** `/lichess` and `/masters` share host, tag,
   OAuth posture and silence on terms (§1b). We call `/lichess` on the recorded basis that
   *"aggregate statistics are facts"* — true of `/masters` too if true at all. The refusal
   therefore rests on the *second* leg of `EXPLORER_RATIONALE` (CC0 of the underlying data)
   without ever saying so.
3. **The bundle hides a good refusal inside a bad one.** *"Per-game scope"* is defensible for
   the corpus panel — `explorer.ts:74-75` pins `topGames=0`/`recentGames=0`. Bundling the
   masters **database** into that row lets a judgement about a panel refuse an entire corpus.
4. **The real legal risk — annotations — is absent from this source:** the masters PGN endpoint
   returns a bare score (§1b, §3) 🟢. The residual risks are not licence risks: the EU database
   right constrains *bulk harvesting* (§2b) 🟡 and the ToS permits revoking access (§1d) 🟡.

### 6b. Recommended replacement

**A lift, scoped and obligated** — not unrestricted, not confirmed-refusal. Concretely, split
the one row at `capabilities.ts:159` into three:

```ts
{ instrument: "Explorer", capability: "topGames / recentGames", disposition: "refused",
  reason: "Per-game scope has no corpus-panel consumer; the panel renders population results, not games" },
{ instrument: "Explorer", capability: "masters database (position and per-move aggregates)", disposition: "reached",
  reason: "Same terms as the Lichess explorer — no rights asserted, no attribution required (design/research/famous-game-sources-licensing.md §1); aggregate statistics are facts", surface: "corpus panel" },
{ instrument: "Explorer", capability: "masters per-game PGN (explorer.lichess.org/masters/pgn/{id})", disposition: "reached",
  reason: "Bare game score; a record of fact, not a work (Feist, §2a). Hand-selected games only — no systematic walk of the index (EU database right, §2b). Third-party annotations are refused at the record boundary (D410)", surface: "pack provenance" },
```

…and a fourth, narrow, genuinely-supported refusal that generalises beyond Lichess:

```ts
{ instrument: "Imported game", capability: "third-party annotations, NAGs and move verdicts", disposition: "refused",
  reason: "Commentary is copyrightable expression and another product's verdict; stripped at the record boundary (D410/D959, law 8)" },
```

### 6c. Obligations that ride the lift

| Obligation | Source | Where it lives |
|---|---|---|
| **Serialise requests; back off on 429** | Lichess API reference §Rate limiting `[V]` | Already implemented (`explorer.ts:104-132`); extend to `/masters` |
| **Contact-bearing User-Agent + OAuth token** | 401 on both endpoints `[V]` | Already implemented; the token becomes a *hard* dependency, so record the ToS revocation clause as an availability risk |
| **No systematic index walk** | EU Directive 96/9/EC Art. 7(5) `[V]` | New: cap masters fetches to author-named games; refuse bulk enumeration in the sourcing lane |
| **No attribution text required by any Lichess term** | §1a, §1d `[V]` | But **record the source anyway** in `provenance.sources` / `licenceNote`, as `explorer.ts:247` already demands |
| **Attribution IS required for broadcast games** | CC BY-SA 4.0 `[V]` | `provenance.attribution` — and BY-SA share-alike must be assessed before a broadcast-sourced pack ships |
| **Strip annotations at the record boundary** | §3, D410/D959 | The one refusal that survives; close D959's paste hole in the same lane |
| **A `sourceGame` provenance object** | §5a | The D329 build; carries White/Black/Event/Site/Date/Round/Result + source id + licence basis |

### 6d. The decision put to the owner

> **Lift the masters-database refusal.** The licence question was never a licence problem: Lichess
> claims nothing over the masters data, imposes no attribution, and serves individual master
> games publicly as bare scores. Game scores are facts, not works — settled enough in the US
> (Feist), probable but formally open in Europe. Keep two narrow refusals in its place:
> **third-party annotations** (copyrightable, and law-8 forbidden anyway) and **systematic bulk
> extraction** of the masters index (the EU database right's actual target). Then D329's
> `sourceGame` axis is a one-schema-lane build with no legal blocker in front of it.

---

## DESIGN-GAP and escalation notes

- **No `DESIGN-GAP:`** — no `design/` doc asserts anything this dossier contradicts; the
  contradicted artefact is a **code record**, `capabilities.ts:159`, a register rather than an
  intent doc.
- **The general defect is worth escalating separately** (relates to [[D1036]], [[D1037]]): a
  `disposition: "refused"` whose reason is *"questions remain unresolved"* is a **deferral
  wearing a refusal's clothes**, and the capability contract cannot tell the two apart —
  `assertAdvertisedCapabilityDispositions` requires an `experiment` for every `unmeasured` row
  but nothing at all for a `refused` one (`capabilities.ts:167-188`, guard at `:183-186`) `[V]`.
  The cheapest way to make a question disappear is therefore to file it as a refusal. Candidate
  guard: **a `refused` row whose reason contains an open question must name a decision or a
  dossier.**

## Sources

All external sources are cited inline at the claim they support. Primary/authoritative:
Lichess ToS, the Lichess API OpenAPI spec and its Opening Explorer tag files,
`lila-openingexplorer`, database.lichess.org, *Feist* (Cornell LII), Directive 96/9/EC and
CJEU C-203/02 (EUR-Lex), the Swiss IPI blog, TWIC, Project Gutenberg. Secondary/`[P]`:
NatLawReview, Copyright Lately, Techdirt, IPKat, chessgames.com terms, MattPlaysChess, and
four Lichess forum threads.

Live probes 2026-08-23 `[V]`: `explorer.lichess.org/masters` (401),
`.../lichess` (401), `.../masters/pgn/aAbqI4ey` (200, bare PGN). Code census at HEAD `[V]`:
`capabilities.ts`, `sourcing/explorer.ts`, `import-source.ts`, `pgn-import.ts`, `service.ts`,
`schemas/drill_pack.schema.json`.
