# Live game and tournament relay as a drill source

- **Date:** 2026-08-16
- **Feeds:** `design/BACKLOG.md:594` (the ledgered question), `design/03-product-breadth.md`
  §Live + B5, `design/05-in-run-experience.md` §1 (*"the run is the sole source of chess
  truth"*), `docs/game-import-and-story.md`, `docs/outcome-drill-grading.md`,
  `design/research/broadcast-and-teacher-surfaces.md`, `BACKLOG:670` (events layer)
- **Trigger:** owner, 2026-08-16 — *"is there a way we can import easily the live game?
  like live tourneys or w/e? are those exposed from lichess or chess.org? I can imagine
  for streamers you want to cast a live game."*

---

## 0. What is measured and what is argued

**Measured `[V]` in this pass.** Every Lichess and Chess.com endpoint in §1.1–§1.3 was
*exercised* from this machine on 2026-08-16 between 14:33 and 14:52 UTC, unauthenticated,
one request at a time. Status codes, `content-type` headers, byte counts, game counts and
payload shapes are reproductions, not readings. Repo claims in §2 are greps and reads
against the working tree at `790a4de` plus the uncommitted deltas listed in the session
git status (none of which touch import, live sessions or grading).

**Read but not exercised `[P]`.** Everything taken from the Lichess OpenAPI source
(`https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/lichess-api.yaml`
v2.0.163 and its `tags/` files) that I did not separately reproduce — chiefly the two
documented limits on `/api/stream/game/{id}`, the tour/group stream variants, and
`POST /api/stream/games-by-users`. Also `[P]`: the Chess.com and Lichess terms-of-service
extracts obtained through a fetch-and-summarise tool rather than raw read (the Lichess
"Using our services" and "Licenses" sections *were* read raw and are `[V]`), the TWIC and
Chess-Results characterisations, the DGT/LiveChess Cloud pipeline, and the two 2016 court
decisions.

**Argued `[M]`.** §2.1's assessment of the framing, §2.4's build/reuse split, §3's
verdicts, and the ledger rows in §4.

**Law 8 note.** This dossier catalogues data sources. It makes no chess claim, grades no
move, and names no position as good or bad. §2.3(g) is the one place chess evaluation
appears, and it appears as a **hazard to strip** rather than a fact to use.

**Legal risk glyphs** in §1.5 mean legal risk only, never evidentiary confidence.

---

## 1. Part 1 — what is actually exposed

### 1.1 Lichess broadcasts: yes, fully, and without credentials

This is the answer to the owner's question, and it is a stronger yes than expected.

**Index — `GET /api/broadcast`** `[V]`. Returned `HTTP/2 200`,
`content-type: application/x-ndjson`, `access-control-allow-origin: *`, one JSON object
per line, each `{tour: {...}, rounds: [...]}`. No `Authorization` header sent. Query
params `nb` (1–100), `html`, and `live` (*"only broadcasts where a round is ongoing"*)
per the spec `[P]`.

**Index — `GET /api/broadcast/top?page=1`** `[V]`. `application/json`, keys
`{active, upcoming, past}`. At 2026-08-16T14:34:11Z it returned **67 active broadcasts,
of which 23 carried `round.ongoing === true`** — twenty-three tournaments with games in
progress at one arbitrary moment on a Sunday afternoon. The sample spans the top
(GCT Sinquefield Cup 2026, 2026 Cairns Cup, Esports World Cup 2026 Playoffs) and the
long tail (Kanizsa Open Hungary, Rubinstein Chess Festival, JESENIK Open, Oscar Romero
Open Hoorns Kampioenschap, Olomouc Chess Summer). Supply is not the constraint.

**Round PGN — `GET /api/broadcast/round/{roundId}.pgn`** `[V]`. Exercised on
`wmxrKVXz` (Kanizsa Open 2026, Group A, Top boards, Round 2 — an OTB Swiss in
Nagykanizsa, Hungary). Returned `HTTP/2 200`, `content-type: application/x-chess-pgn`,
`content-disposition: attachment; filename=lichess_broadcast_round-2_2026.03.25.pgn`,
**63,843 bytes, 42 games, and 42 of those 42 carried `[Result "*"]`** — every game in the
round was still being played. Tags include `Event`, `Site`, `Round "2.1"`, `White`,
`Black`, `WhiteElo`, `WhiteTitle`, `WhiteFideId`, `TimeControl`, `ECO`, `Opening`,
`UTCDate`, `UTCTime`, `BroadcastName`, `BroadcastURL`, `GameURL`. Movetext carries clock
comments: `1. c4 { [%clk 1:30:26] } 1... c6 { [%clk 1:30:22] } …`.

**Round stream — `GET /api/stream/broadcast/round/{roundId}.pgn`** `[V]`. Same content
type, chunked, held open. In a 90-second window on the same live round it delivered
**82,922 bytes containing 54 `[Event` chunks**: the 42-game round dump first, then **12
update pushes**. Each push is the **entire current PGN of one game**, identifiable by its
`[GameURL]` tag — I observed the same board (`Nithin Babu` vs `Banusz, Tamas`) pushed
twice within the window, at 20 plies then 20½ plies. The spec confirms the model `[P]`:

> This streaming endpoint first sends all games of a broadcast round in PGN format.
> Then, it waits for new moves to be played. As soon as it happens, the entire PGN of the
> game is sent to the stream. […] This is the best way to get updates about an ongoing
> round. Streaming means no polling, and no pollings means no latency, and minimum impact
> on the server.

`/api/stream/broadcast/tour/{tourId}.pgn` and `/api/stream/broadcast/group/{groupId}.pgn`
are the same mechanism widened `[P]`. The polled `.pgn` endpoint's own description says
polling it *"would be slow, and very inefficient"* `[P]` — the streaming form is the
sanctioned one.

**Annotation control** `[V]`. Both PGN endpoints take `clocks` and `comments`, each
defaulting to `true`. On round `ohv5F74c`, `?clocks=false&comments=false` took the
payload from **43,593 → 11,870 bytes** and removed **all 8** `%eval` occurrences plus all
prose annotations, leaving bare SAN. This matters — see §2.3(g).

**Authentication — a documented/observed discrepancy worth recording** `[V]` vs `[P]`.
The spec declares `security: - OAuth2: ["study:read"]` on the broadcast PGN and stream
endpoints `[P]`; `/api/broadcast`, `/api/broadcast/top` and `/api/broadcast/search`
declare `security: []`. **Every call above was made with no credentials and returned
200** `[V]`. The scope evidently gates *private/unlisted* broadcasts, not public ones.
Treat "public broadcast = no auth" as verified for the endpoints exercised and as an
assumption elsewhere.

**Rate limits** `[V]`, from the spec's own `info.description`:

> All requests are rate limited using various strategies […] **Only make one request at a
> time.** If you receive an HTTP response with a 429 status, you have exceded one of the
> rate limits. In most cases, **waiting one minute** before retrying will be sufficient,
> but some limits may require longer.

This is exactly the politeness contract `apps/server/src/import-source.ts:21,68,96`
already implements (a module-level `serial` promise chain plus a 10 s `AbortController`),
so the shipped adapter is already compliant.

**Does it cover third-party tournaments, or only Lichess games?** **It is built for
third-party tournaments**, and the spec says so in the Broadcasts tag description `[V]`:

> Relay chess events on Lichess. Official broadcasts are maintained by Lichess, but you
> can **create your own broadcasts to cover any live game or chess event**. You will need
> to publish PGN on a public URL so that Lichess can pull updates from it. Alternatively,
> you can push PGN updates to Lichess using this API endpoint.

The round-creation form confirms five sync sources — `push | url | urls | ids | users`
`[V]` (`schemas/BroadcastRoundForm.yaml`): push a PGN, poll one public PGN URL, poll
several, follow up to 100 Lichess game IDs, or follow up to 100 Lichess usernames. It
also carries **`delay`: 0–3600 seconds, "Delay in seconds for movements to appear on the
broadcast"** `[V]`, plus `onlyRound` and `slices` board filters.

**Two measured proofs that broadcast coverage is not Lichess-only** `[V]`:

1. `wmxrKVXz` is an over-the-board Swiss in Hungary with FIDE IDs and a 90min/40+30+30
   time control — no Lichess game exists behind it.
2. Round `ohv5F74c` is `[Event "2026 Esports World Cup Playoffs"]`, `[Site "Chess.com"]`,
   with per-game `[Site "https://www.chess.com/events/2026-esports-world-cup-playoffs/…"]`.
   **A Chess.com-hosted event is publicly readable, move by move, through the Lichess
   broadcast API** — which is the practical answer to §1.3's clean "no".

### 1.2 Lichess live-game streams: also yes, and separately

**`GET /api/stream/game/{id}`** `[V]`. Declares `security: []`. Exercised on `XMQBOfaV`
(a rated bullet game found via TV): `HTTP/2 200`, `application/x-ndjson`, first line a
game description (`id`, `variant`, `speed`, `rated`, `source`, `players` with titles and
ratings), then **one line per move** carrying `fen`, `lm` (the last move in UCI) and
`wc`/`bc` clock seconds. 68 lines in a 20-second window; the spec says a final
description is sent when the game finishes and the stream then closes `[P]`. Two
documented limits, read not measured `[P]`:

> **Ongoing games are delayed by 3 moves, as to prevent cheat bots from using this API.
> No more than 8 game streams can be opened at the same time from the same IP address.**

**`GET /api/tv/feed`** `[V]`. `application/x-ndjson`, no auth. Emits
`{"t":"featured","d":{id, orientation, players, fen}}` then `{"t":"fen","d":{fen, lm, wc,
bc}}` per move, switching games when Lichess TV switches. `GET /api/tv/channels` `[V]`
returns the twelve channels (`best`, `bullet`, `blitz`, `chess960`, `bot`, `computer`,
`atomic`, `horde`, …). `GET /api/tv/{channel}/feed` is the per-channel form `[P]`.

**`POST /api/stream/games-by-users`** `[P]`: up to 300 user IDs in the body, emits an
event when a game between two listed users starts or finishes, `withCurrentGames=true`
to seed with in-progress games. `security: []`.

**No per-game broadcast endpoint exists.** `GET
/api/broadcast/{slug}/{roundSlug}/{roundId}/{gameId}.pgn` (built from the `GameURL` tag)
returned **404 — Resource not found** `[V]`. **The round is the retrieval unit**: you take
all 42 boards and select client-side. That is a real design consequence (§2.3(f)).

### 1.3 Chess.com: a clean no for anything live, and it is the same no we already ship

**The PubAPI is finished-games-only, and its own documentation says so** `[V]`
(https://www.chess.com/news/view/published-data-api, updated 2026-04-22).

- Self-description: *"The PubAPI is a read-only REST API […] This is read-only data. You
  cannot send game-moves or other commands to Chess.com from this system."*
- The complete games section of its table of contents is: Current Daily Chess, Concise
  To-Move Daily Chess, Available Archives, Monthly Archives, Live Games by Time Control,
  Multi-Game PGN Download. **No live or in-progress endpoint appears anywhere in it.**
- Complete Monthly Archives is documented as *"Array of Live and Daily Chess games that a
  player has **finished**"* — "Live" there is a **time-class** label (blitz/rapid/bullet),
  not a liveness property. This is the single most load-bearing sentence in the section.
- `GET /pub/player/{username}/games` is *"Array of **Daily Chess** games that a player is
  currently playing"* — correspondence only, with `move_by` timestamps measured in days,
  `turn`, current `fen` and current `pgn`. Measured on `hikaru`: `{"games":[]}` `[V]`.
  It is a correspondence inbox, not a relay.
- Cadence, quoted: *"Cache invalidation: This endpoints refresh at most once every 12
  hours."* A twelve-hour cache is definitionally incompatible with a live board.
- Rate limits, quoted: *"Your serial access rate is unlimited. If you always wait to
  receive the response to your previous request before making your next request, then you
  should never encounter rate limiting"*, with 429 for parallel requests and a request to
  *"supply a recognizable user-agent that contains contact information"*.

**Probed for an undocumented live surface and found none** `[V]`:
`/pub/tournament/live` → 404, `/pub/events` → 404, `/pub/broadcast` → 404,
`/pub/games/live` → 404. `/pub/streamers` → 200, but it returns only usernames, avatars
and **Twitch URLs** — a directory of people, not a feed of games.

**Their broadcast/events product exposes nothing.** Chess.com Events is a viewing
product; no public endpoint for it exists in the PubAPI, and the four probes above cover
the plausible paths. `[V]` on the probes, `[P]` on the negative in general — an
undocumented internal endpoint could exist, but consuming one would be exactly the
scraping their terms prohibit (§1.5).

**Verdict on Chess.com: no, and this is the same answer the repo already reached for a
different reason.** `docs/game-import-and-story.md` refuses chess.com URLs *"because no
supported per-game public fetch contract exists"*, and `import-source.ts:49` emits the
hint *"download or copy the PGN from chess.com and paste it"*. That refusal generalises
cleanly: **there is no public fetch contract for a chess.com game, finished or live**;
finished games are reachable only through a player's own monthly archive after the fact,
and in-progress Live Chess is not reachable at all. **The one exception is
indirect and it is significant**: when Chess.com runs a marquee event, that event is
frequently relayed on Lichess as a broadcast, and *that* is public and unauthenticated
(§1.1, `ohv5F74c`). We would consume Lichess, not Chess.com.

### 1.4 The wider ecosystem: the data is ecosystem-owned, the aggregation is platform-owned

This is the part that answers "who actually owns tournament coverage", and the answer is
neither platform.

**The real OTB pipeline** `[P]`: DGT electronic boards write moves to a local machine
running DGT LiveChess; LiveChess exports PGN (and an "extended PGN" with tournament
metadata) either to a local folder or to **LiveChess Cloud**
(https://www.livechesscloud.com/, https://www.digitalgametechnology.com/), which exists
precisely because *"many clubs only run basic webservers not capable of handling the
highly dynamic load of live chess games"*. The organiser then hands out **a public PGN
URL**. That URL is the ecosystem's actual interchange format — not an API, a file that
changes.

**Lichess is a consumer of that pipeline, not its owner** `[V]`. The `syncUrl` field
(§1.1) polls exactly such a URL, and the official **Lichess Broadcaster** desktop app
(https://raw.githubusercontent.com/lichess-org/broadcaster/main/README.md) is a folder
watcher `[V]`:

> Some smart chess boards used in OTB events can write PGN files to a folder on your
> computer. This application monitors that folder and uploads the PGN file in real-time
> using the Lichess API. In practice, this means anyone with internet access can follow
> the ongoing OTB games live and with minimal additional effort from tournament
> organisers. Lichess freely provides the infrastructure to show the tournament games to
> thousands of spectators, which would otherwise be a costly or technically challenging
> task for organizers.

**TWIC** (https://theweekinchess.com/twic) is a weekly archive of **finished** events in
PGN and ChessBase formats, published Mondays `[P]`. Its terms are restrictive: *"TWIC
magazine is free for personal use only. All rights are reserved."* Its `/live` page does
**not** host a relay — it links out to Lichess, Chess.com and Chess-Results for live
coverage `[P]`. TWIC is a historical corpus, not a live source, and its licence would
block us from using it as one anyway.

**Chess-Results** (https://chess-results.com/) is the Swiss-Manager tournament results
server — 1.12M+ tournaments — publishing **pairings, standings and results**, with a game
search offering PGN download `[P]`. No API documentation, no live move feed. It answers
"who is playing whom on board 4" and "what was the result", not "what is the position
now".

**Synthesis `[M]`: tournament relay is ecosystem-owned at the source and
platform-owned at the aggregation layer.** The moves originate with the organiser's
hardware and are published by the organiser to a public URL. Lichess has done the
expensive part — fanning tens of thousands of those feeds into one normalised, rate-
limited, unauthenticated, streaming PGN API with stable IDs. **That fan-in is the entire
value, and it is exactly the work we should not repeat.** It is also why Lichess neither
claims nor could claim exclusivity: they are downstream of the same public URLs anyone
else could poll. Integrating at Lichess is not vendor lock-in; it is using the one place
the ecosystem already converged.

### 1.5 Terms and licensing

**Lichess — permissive, explicitly including commercial use, revocable at will** `[V]`,
read raw from https://lichess.org/terms-of-service, §"Using our services":

> In addition to publishing our website, we also offer services which we invite anyone to
> utilise so long as the relevant licenses and our rules are followed in using them. Our
> services include (but are not limited to): **API access, content, game databases**,
> puzzle sets, piece and board sets, streamer sections, coaches sections, user blogs,
> relying on our moderation or other expertise, and all or some of our software.
>
> **You can use our services for your own personal or commercial use, such as in your own
> applications, projects, research, or products.**

with two limits that must be quoted alongside it `[V]`:

> All use of our services are subject to **reasonable caps, limits, restrictions, or other
> bottle-necking which are purely determined at Lichess' discretion.**

> In addition, we reserve the right to change the licensing of our services […] We also
> reserve the right to give privileged access to certain categories of our services (such
> as special API access) **or revoke access temporarily or permanently as we see fit, at
> our sole discretion, and potentially without any advance warning.**

The §"Licenses" section `[V]` puts the Lila codebase under AGPL-3.0-or-later and says
*"Various parts of the website and services use different licenses. Anyone intending to
use or replicate the website and services should do their own research and due
diligence."* The API spec itself declares `license: AGPL-3.0-or-later` `[V]`. **🟢 Low
risk, with one operational caveat**: access is revocable without warning, so a live
relay must degrade to "the source is unavailable" rather than break a run.

**Chess.com — restrictive, and it forecloses the question we were not going to ask
anyway** `[P]` (https://www.chess.com/legal/user-agreement, read via fetch-and-summarise;
quotes are the tool's extracts and are fragmentary):

| Clause | Extract |
|---|---|
| §2(B) Limited License | *"license to access, display, view, use, play, and/or print one copy […] for your **personal, noncommercial use only**"* |
| §4(C) User Conduct | *"use any robot, spider, site search/retrieval application, or other manual or automatic device"* (prohibited); *"You agree not to reproduce, duplicate, copy, sell, trade, resell or exploit for any commercial purposes"* |
| §4(D) AI Restrictions | *"You may not use automated or artificial intelligence (AI) tools to access, scan, scrape, data mine, copy"* |
| §3 Content You Submit | *"Recording, relaying, and sharing videos of the use of the Chess.com interface (for example in videos for YouTube, on Twitch, etc) **is allowed**"* |

The PubAPI page adds a "Respecting Our Brand" section `[V]`: *"we do require that you
respect our IP: board color palettes, piece designs, sound effects, move classification
glyphs, and the other features recognized as Chess.com products."* **🔴 Do not scrape
chess.com for live data.** The one thing explicitly permitted is *video* relay of their
interface — a streamer casting their screen — which is not a data path. Our existing
refusal is the correct posture and this research does not disturb it.

**May a third party relay someone else's broadcast? The moves are facts; the risk is
contract, not copyright.** `[P]`, two 2016 decisions:

- **Commercial Court of the City of Moscow**, 25 Oct 2016 (reasoning 1 Nov), Agon/World
  Chess v. Chess24 over the Candidates: *"information about the chess moves is in the
  public domain and is not protected by law"*; the trade-secret theory failed and a
  clickwrap licence could not override public-domain status
  (https://www.chess.com/news/view/chess24-wins-court-case-agon-to-appeal-2210).
- **U.S. District Court, S.D.N.Y.**, 22 Nov 2016, World Chess US v. Chess24 and
  Chessgames: preliminary injunction **denied**. World Chess **did not plead copyright**
  — Chess24's position was that *"chess moves are purely factual in nature and thus not
  protectable by copyright"* — and pleaded hot-news misappropriation and breach of
  contract instead, on which it *"could not carry the burden […] at this early stage"*;
  the court found defendants were *"collecting factual data from secondary sources and
  expending their own resources to disseminate the news"*
  (https://natlawreview.com/article/pawn-to-e4-chess-website-kept-check-over-digital-rights-to-publish-players-moves).

**Reading `[M]`: 🟢 for us, and the reason is structural rather than a bet on those
cases.** The plaintiff's surviving theories were *contract* and *hot news*, both of which
attach to someone who took the data from the organiser under terms (a credentialed press
feed, an accepted clickwrap on the organiser's own site). **We would take it from a
public, unauthenticated Lichess API under terms that grant commercial use.** We accept no
organiser agreement, bypass no paywall, and free-ride on nothing — Lichess did the
relaying, with the organiser's participation, and republished it openly. The residual
risk is not legal exposure but **dependency**: Lichess may revoke, and an organiser may
ask Lichess to take a broadcast down.

**One thing to carry forward regardless:** the shipped `licenceNote` convention
(`import-source.ts:40,65,89` — `no-rights-asserted: public lichess export {url};
retrieved {ISO}`) is exactly the right artifact for this and already exists. A relay
import should record source URL, broadcast/round/game IDs and retrieval time in the same
form.

### 1.6 Per-source table

| Source | Live data exposed? | Format | Auth | Rate limits | Terms | Risk |
|---|---|---|---|---|---|---|
| **Lichess broadcasts** — `/api/broadcast`, `/top`, `/search`, `/round/{id}.pgn`, `/stream/broadcast/round\|tour\|group` | **Yes — in-progress OTB and online tournaments, worldwide.** 67 active / 23 ongoing at one sample `[V]` | NDJSON (index), `application/x-chess-pgn` (rounds); streaming form re-sends a full game PGN per update; `clocks`/`comments` toggles | **None** for public broadcasts `[V]` (spec declares `study:read`, evidently for private ones) | One request at a time; 429 → wait ≥1 min `[V]` | ToS grants personal **and commercial** use; revocable at Lichess's discretion `[V]` | 🟢 |
| **Lichess live games** — `/api/stream/game/{id}`, `/api/tv/feed`, `/api/tv/{ch}/feed`, `POST /api/stream/games-by-users` | **Yes — any ongoing Lichess game** | NDJSON: FEN + UCI last move + clocks per move `[V]` | **None** (`security: []`) `[V]` | Same, plus **3-move delay** on ongoing games and **max 8 concurrent game streams per IP** `[P]` | As above `[V]` | 🟢 |
| **Chess.com PubAPI** | **No.** Finished games only; in-progress **Daily/correspondence** only, on a 12-hour cache `[V]` | JSON-LD; monthly PGN bundles | None (public), UA with contact requested `[V]` | Serial unlimited; 429 on parallel `[V]` | Personal, **non**commercial; robots/AI scraping prohibited; video relay of the UI permitted `[P]` | 🔴 for data |
| **Chess.com Events / broadcasts** | **No public endpoint.** 4 plausible paths → 404 `[V]` | — | — | — | As above `[P]` | 🔴 |
| **DGT LiveChess / LiveChess Cloud** | **Yes — this is the origin.** Organiser publishes a public PGN URL | PGN / extended PGN over HTTP `[P]` | Per-organiser | Per-organiser | Per-organiser; no blanket licence `[P]` | 🟡 — per-event, unaudited |
| **TWIC** | **No** — weekly archive of finished events; `/live` links out `[P]` | PGN + CBV, zipped, weekly | None | — | *"free for personal use only. All rights are reserved."* `[P]` | 🔴 |
| **Chess-Results** | **No moves.** Pairings/standings/results; game search with PGN download `[P]` | HTML + PGN export; no API `[P]` | None | — | Impressum-linked; unexamined `[P]` | 🟡 |

---

## 2. Part 2 — what it would mean here

### 2.1 The framing: real, and sharper once one substitution is made `[M]`

The ledgered pitch is *"the game is at move 25 and a GM is thinking; you take over from
here and play the consequence — the one case where nobody can be shown the verdict
because there isn't one."*

**What is genuinely strong about it, and it is more than rhetoric.** The repo's standing
hazard is ADR-0005 / law 8 — the dashboard that renders an engine number as chess truth,
named in `AGENTS.md` as *"the failure shape the whole product dies in"*. On a still-live
root **there is no verdict to render**, so the failure mode is foreclosed by the object
itself rather than by a rule we have to keep enforcing. That is a rare property. Every
other root we ship — a pack position, an imported game, a puzzle re-cut — has a knowable
answer that the product must *choose* not to hand over; this one does not have one yet.
It is the cleanest possible instance of "commit before you learn", because the world has
not learned either.

**Where it breaks, first and worst: the comparison it invites is not the comparison the
product sells.** `design/05:38` states the original claim precisely — *"The comparison of
two preserved attempts **by the same player** is the product's one original claim."*
"You played Nf5, the GM played Rd1" is a different and much weaker object: one sample of
one human on one occasion, with no distribution behind it and no assessment attached. If
the surface renders that as feedback it is manufacturing chess truth from an appeal to
authority — the same anti-pattern in new clothes, and arguably worse, because it *looks*
grounded. **The thesis-safe framing is that the live position is a root and your two
attempts are still the comparison; the GM's continuation is provenance, and later,
context — never a grade.** This is the single most important constraint on the feature
and it should be written into any RFC's first paragraph.

**Second: "the root keeps moving" is a misframing, and killing it early is worth doing.**
A run's root is a FEN plus movetext, copied at creation (`docs/game-import-and-story.md`:
*"Its session identity includes a SHA-256 digest of the canonical root FEN and complete
UCI movetext"*). Once snapshotted, nothing about the source can alter the run. So
`design/05` §1 — *"the run is the sole source of chess truth […] every move, verdict and
disclosure is in the run's event log, replayable"* — **survives untouched, on one
condition: the snapshot must be a copy, not a live reference.** A run that *follows* a
broadcast would break the invariant outright and must never be built. The source moves;
the run does not. Stated that way, the collision the ledger flagged dissolves — but only
because we chose the copy semantics, so it belongs in the RFC as a named constraint
rather than an assumption.

**Third, and this is the beat the pitch actually has that nothing else in the product
has:** because the source keeps moving and the run does not, **a live root is the only
import with a "come back later and find out" moment.** You commit at move 25, play your
consequence, and forty minutes later the game itself has an answer you can *look at* —
not as a grade, but as the world's own continuation. That is a return-loop hook the
product already wants (`docs/return-and-progression.md`, and `league-as-return-loop.md`'s
finding that **imposed, evenly spaced deadlines** are the one randomised-evidence-backed
return lever, with no social component required). A live game supplies its own deadline
for free. **`[M]`, and I think it is the strongest thing in this dossier**: the feature's
best argument is not "drill a GM position", it is "the product finally has a reason to
come back that it did not have to invent."

### 2.2 The streamer surface

`design/03:81-83` promises: *"the streamer owns the live board; chat votes on plans or
moves; the host snapshots, rewinds, branches, compares, and exposes an overlay. Viewers
do not need full synchronized clients."* `broadcast-and-teacher-surfaces.md` §2.3
established `[V]` that essentially all of that ships, as `SESSION_KINDS =
["stream","academy","match"]` with `/live/overlay/:runId`, 2–8-option advisory votes, a
`chat:<adapter>:<key>` relay namespace, host-directed board control and a possession
journal — and that the remaining gap is a **chat bridge** (an out-of-repo bot), the
overlay's missing adapter-attribution line, and a vote form that only offers two options.

**A live relay slots into that with no new session machinery `[M]`.** The host creates an
`imported` run from a broadcast board and hosts it as a `stream` session; the overlay is
already a projection of the same `RunStateSnapshot`; viewers fork via the same
`story-reentry`/`session_join`/`public_tokens` paths. The one honest addition is that the
overlay would want to show *which* board it came from, which is one tag from the PGN.

**But the same dossier's §7.1 verdict binds here** `[P]`: the chat bridge is *"genuinely
blocked on B5's standing revival condition"* — B5 *"can not be validated by use without
other humans […] a streamer audience"* (`design/03:384-386`). **A live relay does not
relieve that condition; it makes the surface more attractive to a streamer we do not
have.** So the relay's value to B5 is real but unrealisable on the current gate, which
means the relay should be justified on the **solo** case (§2.1's return-loop beat) or not
at all. If it only pays off when a streamer shows up, it waits with the rest of B5.

### 2.3 Collisions, checked rather than assumed

**(a) Outcome grading — collides, and the collision is already solved.**
`docs/outcome-drill-grading.md` requires every outcome objective to carry
`grading.assessedBy`: *"either an authored root claim with a note, or a Syzygy
declaration"*, plus `grading.resolveAt` and a closed `successConditions` list. A live
broadcast position has **neither** — nobody has authored a claim about it and it is
nowhere near ≤7 pieces. So it cannot carry an outcome objective at all. **That is not a
new problem: it is exactly the status `imported` already has** — *"a non-pack,
`attempt_end` session: `packId` and `packDigest` are null and `theory_strict` is
unavailable"* (`docs/game-import-and-story.md`). A live root inherits the imported
answer wholesale. **Nothing to design.**

**(b) `design/05` §1 — survives, conditionally.** See §2.1. Copy, not reference.

**(c) The events layer — this is *not* that row `[M]`.** `BACKLOG:670` is *"pack nights,
cohorts, team relays"*, and `broadcast-and-teacher-surfaces.md` §4.4 resolved what that
object is: *"a cohort is a roster with a calendar"*, the scheduling half of the missing
teacher/roster aggregate, whose one shipped atom is the producer-less `scheduledFor`
field. **"Team relay" there means our teams playing each other in a scheduled event; it
does not mean relaying an external tournament.** Same word, different object — an
`imported`-kind source adapter versus a roster aggregate. They share no table, no
consent model and no trigger. **Keep them separate, and add a one-line disambiguation to
`BACKLOG:670` so the next agent does not re-collide on the word.**

**(d) The result state — already handled.** `apps/server/src/pgn-import.ts:57-60` reads
`Result` and normalises anything unrecognised to `"*"`; `docs/game-import-and-story.md`
specifies *"`Result "*"` is reported as unfinished"* and that the server *"never
fabricates a terminal event for a playable board"*. **Every one of the 42 games in the
live round I fetched was `[Result "*"]`** `[V]` — the exact state the importer was
already built to handle. This is the neatest fit in the whole assessment.

**(e) Variations — no conflict.** `pgn-import.ts:28,30` rejects any node with more than
one child. Broadcast round PGN is one mainline per game (verified across both rounds
fetched) `[V]`. The 300-ply cap at `pgn-import.ts:37` is far above any real game.

**(f) The round is the unit — a genuinely new selection surface.** One round PGN is 42
games / 63KB `[V]`; there is no per-game endpoint (§1.2). So a relay import needs
tournament → round → **board** selection that the current `/review` import form (one
textarea, one URL field) has no shape for. Small, but it is UI that does not exist.

**(g) The feed ships third-party move grades, and stripping them is mandatory `[M]`.**
Round `ohv5F74c` carries, inline in the movetext `[V]`:
`80... Kf8?? { [%eval 81.15] } { Blunder. Rf8 was best. }` and
`81... Rxf5?! { [%eval #18] } { Checkmate is now unavoidable. Ke7 was best. }`.
Those are **annotated move grades in prose, produced by someone else's engine**, arriving
inside a source we would render. Passing them through would ship precisely the
`"Stockfish: +0.54 / … 'Ne5 centralizes the knight'"` dashboard `AGENTS.md` forbids —
laundered through an import rather than authored, which makes it harder to notice, not
easier. **`?comments=false` removes all of it** (43,593 → 11,870 bytes, 8 → 0 `%eval`)
`[V]`, and the shipped game adapter already sets `evals=false&literate=false`
(`import-source.ts:73`) `[V]`. The convention exists; it must be applied to the new
adapter, and NAG/annotation stripping should be asserted in a test rather than left to a
query parameter default that Lichess could change.

**(h) Anti-cheat is an external constraint on assistance, and we have nowhere to put it
`[M]`.** Organisers can set a broadcast `delay` of up to 3600 s `[V]`, and Lichess delays
`/api/stream/game/{id}` by 3 moves *"to prevent cheat bots"* `[P]`. Both exist because
real-time engine access to a position being played is the attack. A Tabiya surface that
lets a viewer open a still-live position **and pull engine or Maia evidence on it** is
that attack channel, dressed as training. Three consequences: never re-derive a shorter
delay than the source published; never take an authenticated feed to get a shorter one;
and **lock rung-3 assistance while the source game is unfinished.** That third one is
new — it is the first assistance rule in the product with an *external, non-pedagogical*
justification. And there is nowhere to hang it: `broadcast-and-teacher-surfaces.md`
finding 2 `[P]` records that `permittedAssistance` **declares `sessionKind` and never
reads it** (`assistance.ts:22` vs `:28-29`), and that the three shipped preference keys
are `pack | position | imported`. A "source still live" condition would be the first real
consumer of a field that currently does nothing — which is an argument for fixing that
gap, not a blocker.

### 2.4 Source adapter versus new machinery `[M]`

**Overwhelmingly a source adapter.** `apps/server/src/import-source.ts` is 98 lines and
**already contains two Lichess adapters** — `resolveImportSource` (game export) and
`resolveStudySource` (study export) — sharing one module-level `serial` promise chain, a
10 s `AbortController`, an identical 404 / 429 / 5xx → `IMPORT_SOURCE_*` mapping, and the
`licenceNote` provenance string. A third adapter is the established pattern, not a new
one.

| Piece | Status |
|---|---|
| Politeness (serial, timeout, 429 handling) | **reuse verbatim** — `import-source.ts:21,35,68` `[V]`; already matches Lichess's stated rule |
| PGN parse, `Result "*"`, variation refusal, 300-ply cap | **reuse verbatim** — `pgn-import.ts:28,30,37,57-60` `[V]` |
| Run creation, provenance record, `imported` session kind | **reuse verbatim** — `POST /runs/import`, `imported_games`, migration 12 `[P]` |
| Forking into play | **reuse verbatim** — `story-reentry` branch on re-entry `[P]` |
| Streamer hosting, overlay, viewer forks, share links | **reuse verbatim** — `stream` session kind, `/live/overlay/:runId`, `session_join` / `story_read` `public_tokens` `[P]` |
| Broadcast URL normaliser + round-PGN splitter + board picker | **new, small** — one function, one split, one UI list |
| Annotation stripping asserted in test | **new, small** (§2.3(g)) |
| Assistance lock on "source still live" | **new, and blocked on a known gap** (§2.3(h)) |
| "Has the source moved on?" re-check | **new, and the interesting one** (§2.1) — the shipped import is one-shot; a *second, later* fetch of the same round is what makes the return beat work |
| Long-lived streaming connection | **new, and avoidable — recommend avoiding it.** Every outbound fetch in the server today is a bounded one-shot; `/api/stream/broadcast/round` is an open socket with reconnect, backpressure and lifecycle concerns the process has never had. **Two polite one-shot fetches — one at import, one when the learner returns — deliver the entire product value at zero architectural cost.** Take the stream only if a live spectator wall is later specified |

**The story layer should be skipped for live roots `[M]`.** `GET /runs/:id/story`
requires durable evaluation of **every** mainline node — *"An 80-ply game therefore
requests 81 jobs"* — and *"until every mainline node has durable evaluation or a current
recorded failure, the story says how many positions remain and disables re-entry"*
(`docs/game-import-and-story.md`). Running fifty engine jobs over a game still being
played is both wasteful and, per §2.3(h), the wrong instinct. **A live root should enter
play directly, not through a story.** That is a divergence from the imported flow and
needs saying out loud, because the natural implementation would inherit it by accident.

---

## 3. Verdicts

**3.1 Is it exposed? — Yes, comprehensively, and better than the question assumed.**
Lichess publishes in-progress third-party tournament games as streaming PGN, without
credentials, with stable IDs, under terms that grant commercial use, at a scale of dozens
of concurrent events. `[V]`

**3.2 Chess.com — no, cleanly, and it changes nothing we do.** Nothing live or
in-progress is publicly exposed beyond correspondence games on a 12-hour cache; their
events product has no public endpoint; their terms prohibit the scraping that would be
the only alternative. **Our existing refusal generalises rather than needing revision.**
The practical workaround is that their marquee events are frequently relayed on Lichess
and readable there. `[V]`/`[P]`

**3.3 Platform-owned or ecosystem-owned? — Both, at different layers, and that is the
useful answer.** The moves are ecosystem-owned: organiser hardware → DGT LiveChess →
a public PGN URL. The *aggregation* is platform-owned: Lichess has fanned tens of
thousands of those feeds into one normalised API. Integrating there is using a
convergence point, not accepting lock-in — and it is also why nobody can plausibly assert
exclusivity over the data. `[V]`/`[P]`

**3.4 The take-over-a-live-position framing — SCOPE, with one substitution and one
condition `[M]`.** It is stronger than it sounds for a reason the pitch does not state:
on a live root the law-8 failure mode is foreclosed by the object rather than by a rule.
It is weaker than it sounds in one specific way: **the GM's continuation must never be
rendered as a verdict on your move** — one human's one choice is not evidence, and
dressing it as feedback is the anti-pattern wearing a suit. Make that substitution and
the feature's best argument is not the drill at all, it is the **return beat**: a live
game supplies its own deadline, which is the one return lever `league-as-return-loop.md`
found randomised evidence for. Engineering cost is genuinely small — a third adapter
beside two existing ones — provided we take **two polite one-shot fetches, not a stream**.

**Condition, stated so it can fire without another ruling:** the solo return-beat case
must carry it. If the justification collapses to "a streamer would love this", it waits
behind B5's standing revival condition with the chat bridge, because §2.2 shows the
relay does not relieve that gate.

**3.5 Not the events row.** `BACKLOG:670`'s "team relays" is a roster-with-calendar
object; this is an `imported` source adapter. Word collision only. `[M]`

**3.6 Nothing here touches E1 or any kill criterion.** No competitor was found relaying
live games *into* a rehearsal runtime; Lichess and Chess.com both relay for spectating,
which `coverage-gap-sweep.md` already recorded as *"spectating without any training
tie-in"* `[P]`. Nothing to escalate under law 6.

---

## 4. Proposed ledger rows (report-only — `design/BACKLOG.md` not edited, per task boundary)

1. **Update `BACKLOG:594` (this row) from 💡 to researched**, with the finding:
   *answered `[V]` — Lichess broadcasts expose in-progress third-party tournaments as
   unauthenticated streaming PGN (67 active / 23 ongoing at one sample; a 42-board round
   fetched with 42/42 `[Result "*"]`); Chess.com exposes nothing live and its terms
   forbid scraping, so our existing refusal generalises; relay is ecosystem-owned at the
   source (DGT → public PGN URL) and platform-owned at the aggregation. Verdict: SCOPE,
   small — a third adapter beside the two in `import-source.ts`, two polite one-shot
   fetches not a stream. Two substitutions required: the GM continuation is provenance,
   never a grade (`05:38`); the snapshot is a copy, never a live reference (`05` §1).
   Outcome grading collides and is already solved — a live root inherits `imported`'s
   non-pack `attempt_end` status. The real product argument is the return beat, not the
   drill.*
2. **New defect / hazard row — imported feeds carry third-party move grades.**
   Lichess broadcast PGN ships `{ [%eval …] }` and prose like `{ Blunder. Rf8 was best. }`
   inline. `comments=false` strips it and `import-source.ts:73` already sets
   `evals=false&literate=false` for game export, but nothing asserts it. **Proposed: a
   test that no imported movetext retains `%eval`, NAGs, or annotation comments,
   independent of upstream query-parameter defaults.** This is a law-8 guard on a path
   that currently relies on a default we do not control.
3. **New row — assistance must be lockable on "source game still live."** Organisers set
   broadcast delays up to 3600 s and Lichess delays live game streams by 3 moves,
   explicitly as anti-cheat. Rung-3 evidence on a still-live position is that attack
   channel. **This would be the first consumer of `permittedAssistance`'s declared-and-
   unread `sessionKind`** (`broadcast-and-teacher-surfaces.md` finding 2), which
   strengthens the existing `DESIGN-GAP:` against `design/05:147` rather than adding a
   new one.
4. **Disambiguate `BACKLOG:670`.** Add one clause: *"'team relays' here means our teams
   in a scheduled event — not relaying an external tournament, which is `:594`."*
   Two agents have now had to establish this distinction from scratch.
5. **Note against `docs/game-import-and-story.md`'s chess.com clause (docs tier, not a
   change request).** The stated reason — *"no supported per-game public fetch contract
   exists"* — is now verified as the general case, not a per-game accident: the PubAPI
   exposes finished archives on a 12-hour cache and in-progress **correspondence** only,
   and their terms prohibit the alternative. The refusal is better-founded than its
   own sentence claims.

---

## 5. Residuals — what this dossier did not do

- **No broadcast was consumed end-to-end into a run.** Every endpoint was exercised with
  `curl`; nothing was fed through `pgn-import.ts`. The claim that a broadcast game parses
  cleanly rests on shape inspection (mainline-only, `Result "*"`, ≤300 plies), not on a
  round-trip. **A ~20-line disposable harness under `tools/` would settle it** and is the
  obvious next hands-on step if this moves toward an RFC.
- **The 3-move delay and 8-stream-per-IP limits are read, not measured** — both are `[P]`
  from the spec.
- **`/api/stream/broadcast/tour` and `/group` were not exercised**, nor was
  `POST /api/stream/games-by-users`.
- **No private/unlisted broadcast was tested**, so the inference that `study:read` gates
  only those is reasoning from the public case, not a measurement.
- **The Chess.com user agreement was read via fetch-and-summarise, not raw.** Its quotes
  are fragmentary extracts. If a chess.com path is ever reconsidered, read the agreement
  in full first — but the PubAPI evidence alone already closes the question.
- **No organiser-side terms were audited.** §1.4's 🟡 on DGT/LiveChess Cloud is a
  per-event unknown; it does not bind us while we consume Lichess, but it would if we
  ever polled an organiser's PGN URL directly. **Recommendation: never do that.**
- **No streamer was asked.** §2.2's assessment of the relay's value to B5 is structural
  reasoning over the shipped surface, and B5's own revival condition says that is not
  enough.
