# UX — bringing games in, and owning your data

- **Date:** 2026-08-24
- **Author:** claude
- **Owner ask, verbatim:** *"we need to go from a user perspective per feature… what do they
  expect, what do competitors do, PROPER UX."* Standing note from the same conversation: import,
  account, privacy and data got mentions across six dossiers and no dedicated pass.
- **Scope.** Bringing games in, and owning your data: importing a game or a study, the account
  itself, sign-in, what is stored about a learner, export, and deletion.
- **Boundary with the sibling dossiers.** `ux-arrival-and-start.md` (2026-08-24) owns **arrival** —
  first run, home, choosing a drill, getting to the board — and it already asks the guest question
  as its **O-A2**. This dossier does not re-ask it; §4 supplies the half that dossier does not
  carry: what a pre-account learner does to the **storage inventory, export, deletion and
  disclosure** contracts, costed against the shipped schema. `ux-settings-and-identity.md`
  (2026-08-24) owns the **Settings screen** as a screen and asks whether appearance should follow
  the account (its Owner decision 3); this dossier owns the **Account section's content** — what it
  says a learner's record contains. Where they meet, this dossier takes disclosure and defers on
  seating.
- **Feeds:** `rfc/archive/portable-account-data.md`, `rfc/archive/learner-identity-and-authorization.md`,
  `rfc/archive/game-import-and-story.md`, `docs/account-data-lifecycle.md`,
  `docs/identity-and-authorization.md`, `docs/game-import-and-story.md`,
  `design/03-product-breadth.md` B6/B8, `design/02-product-shape.md` §Deployment,
  ledger [[D1130]] [[D1230]] [[D1346]] [[D1458]] [[D1463]] [[D1470]] [[D1473]].
- **Method.** Hands-on code measurement of the shipped tree at HEAD — every count and quotation
  below was read this pass, with the file and line given inline. Competitor claims are read from
  this repo's existing dossiers and carry **their** labels; per [[D1458]] **no competitor product
  was driven hands-on in this corpus**, so every competitor claim here is `[P]` at best regardless
  of the label the source dossier used for its own fetch. Labels per `design/research/README.md`.
- **Law 5.** `design/02-product-shape.md` and `design/03-product-breadth.md` are intent tier. They
  were read and **not edited**. Every place a recommendation needs intent to move is named in §10.

---

## 0. The finding, in one sentence

**Tabiya's only complete, honest statement of what it knows about a learner is the thing it shows
them on their way out the door.**

The deletion preview (`AssistanceSettings.svelte:97-108`) enumerates four categorised classes of
record with live counts, under `aria-live="polite"`, and it is excellent `[V]`. It is also the
**only** place in the product where a learner can see the shape of their own record — and it fires
only when they have already decided to leave. The Account section above it names five nouns
(`:90`); the storage inventory it summarises has **forty tables in twelve data classes**
(`account-data.ts:38-87`) `[V]`; the word *privacy* appears **zero** times in the entire web client
`[V]`.

Around that sits the second finding, which is the same defect in the other lane: **import is
correctly a capability and is built like an afterthought, while the account is incorrectly a gate
and is built like a vault.** Import ships as four unrelated forms on four screens, none of them
reachable from anything called "import" (§2.3). The account ships as an unrecoverable password wall
in front of every route (§4.3) — including in front of the only anonymous page the product serves,
whose sole call to action is a hardcoded link straight back into that wall (`service.ts:915`,
`productLink:"/"`) `[V]`.

Both are stated once here and used as the through-line.

---

## 1. The shipped baseline, measured this pass

Every row `[V]`, from the working tree at HEAD.

| Fact | Value | Where |
|---|---|---|
| Tables in the privacy inventory | **40**, in **12** data classes | `account-data.ts:38-87` |
| …excluded from export | 2 (`learner_sessions`, `progress_meta`) | `:40`, `:50` |
| …retained through account deletion | 3 (`progress_meta`, `registered_packs`, `registered_shapes`) | `:50`, `:57`, `:59` |
| …tombstoned rather than deleted | 11 | computed over `:38-87` |
| Data classes named in the Account section | **5** — "runs, progress, authored drafts, publications, and account-scoped activity" | `AssistanceSettings.svelte:90` |
| `behavioral_profiles` tables (rating, rated games, periods, cohort standing, standing membership, marks) | **6** | `account-data.ts:73-78` |
| …named anywhere in the Account section | **0** | `grep` over `AssistanceSettings.svelte:84-116` |
| Occurrences of `privacy`, `terms of service`, or `gdpr` in `apps/web/src` | **0** | `grep -rniE` over `*.svelte` |
| Retention disclosures shown at the moment they apply | **2**, both about publication | `App.svelte:999`, `:1023` |
| Routes reachable in the client without a session | **0** — `{:else if !learner}` replaces the whole app | `App.svelte:695-709` |
| Server routes that do **not** call `authenticate()` | `GET /capabilities`, `GET /packs`, `GET /packs/:id`, `GET /api/shared/:token/story`, `GET /api/shared/:token/join`, `GET /shared/:token` | `rest.ts:946`, `:1082`, `:1085`, `:956`, `:961`, `:969` |
| `authenticate()` call sites | **36** | `grep -c` over `rest.ts` |
| Public token scopes admitted | **2** — `story_read`, `session_join` | `docs/identity-and-authorization.md:83-88`, [[D1470]] |
| Call to action on the public story card | `<a href="/">Tabiya</a>`, with `productLink` hardcoded to `"/"` | `rest.ts:975`, `service.ts:915` |
| Separate import forms in the client | **4**, on 4 different screens | `App.svelte:836`, `:887`, `:1069`, `:987` |
| Nav destinations | **9**; none named Import, Account, Data or Privacy | `ShellFrame.svelte:25-35` |
| Hard rejections in the game-PGN parser | **6**, all all-or-nothing | `pgn-import.ts:26,28,30,34,37,45,52` |
| Account-screen disclosure of what is stored | export blurb only, one sentence | `AssistanceSettings.svelte:90` |
| Words on the registration screen about data | **0** | `App.svelte:696-709` |
| PGN tags stored and exported verbatim per import | **all**, no allowlist | `pgn-import.ts:63`, `account-data.ts:182` |
| Expiry on a `story_read` share link | **none** | `rfc/archive/adoption-wave-1.md:170-175` |
| IA areas named Account | **0** — account lifecycle is *"data"*, one of seven Settings destinations | `design/03-product-breadth.md:295` |

**Three things this baseline gets right**, which the rest of the dossier builds on rather than
replaces, and which are better than anything in the competitor set:

1. **The deletion preview is a genuine, digest-pinned consent artifact.** It is computed under
   `BEGIN IMMEDIATE`, and a changed fact produces `DELETION_PREVIEW_STALE` and no mutation
   (`docs/identity-and-authorization.md:61-63`) `[V]`. Almost nothing consumer-facing does this.
2. **The inventory is enforced, not documented.** `assertAccountDataInventory` throws at
   startup if a migration adds a table without an entry (`account-data.ts:89-99`) `[V]`. The
   privacy boundary cannot silently drift.
3. **Two retention notices fire at the moment they apply** — at publication, not in a policy page:
   *"those remain available with 'deleted account' attribution if you later delete your account"*
   (`App.svelte:999`) `[V]`. That is the correct pattern, shipped twice, and generalised nowhere
   (§8).

---

## 2. Import — bringing a game in

### 2.1 What a user expects

Start from the owner's person: **someone has a game they just lost and wants to work on it.** They
are, at that moment, on the site where they lost it, looking at the game.

What they expect, in order of how strongly every chess site has trained it:

1. **To hand over an identity, not a file.** The dominant pattern is *type your username, pick the
   game from a list.* This is what the person believes "import my game" means, because it is what
   the products they use do (§2.2). Paste is the fallback they reach for when the first thing is
   missing — and reaching for it feels like a downgrade.
2. **That whatever they paste will work.** They will not curate it. They will hit the button their
   current site offers — which is usually **Download PGN** or **Copy PGN** from an *analysis*
   board — and paste the result. That result routinely carries annotations, engine variations, or a
   whole archive of games. They do not know which of those we mind.
3. **To be shown what we understood before it becomes a thing.** "We read 41 moves, White is
   Kasparov, you were Black, the game was lost on move 34 — right?" is the confirmation step every
   importer of anything offers.
4. **To be told where their game went, and that it is theirs.** Import creates a durable object;
   people expect to see it land somewhere they can find again, and expect it not to be shared.
5. **Not to be asked to import at all in order to use the product.** This one is ours, not theirs
   — and it is the rejected-list constraint. It cuts the other way too: a person who does *not*
   want to import must never feel they are using a crippled version.

### 2.2 What competitors do

All `[P]` per [[D1458]] — *"every competitor `[V]` in this repo means we read the vendor page or the
source, never we used it"* (`design/BACKLOG.md:1742`). Source dossier and its own label given per
row. **Four import modalities exist in the field; we ship one and a half.**

**(i) Username or linked account → your recent games, listed.** The dominant shape, and the reason
it is what people expect.

| Product | Evidence | Source |
|---|---|---|
| **Chessigma** | *"Enter your Chess.com or Lichess username, pick a game, and get a full chess analysis report in seconds. No daily limit, no premium tier, and no signup required to start analyzing."* `[V]` homepage | `teardown-chessigma-desk.md:39-42` |
| **Take Take Take** | *"When you connect your Lichess account, your games pull in automatically."* `[V]` | `teardown-taketaketake-desk.md:65-71` |
| **Chessbook** | PGN, Lichess games **and studies**, and linked Chess.com/Lichess accounts, or build move-by-move `[V]` | `teardown-chessbook-desk.md:87-89` |
| **En Croissant** | Lichess/Chess.com game import **plus a personal database** `[V]` repo README | `quickpass-…md:42-44` |
| **ChessMonitor** | Cross-platform aggregation — Chess.com + Lichess + uploads `[V]` | `quickpass-…md:65-71` |
| **ChessMind AI, ChessMotive, Aimchess, Quackmate, Chess Yourself, OpeningTree, Sensei** | username or account import, all `[V] desk` | `teardown-chessmindai-desk.md:95-97`; `teardown-chessmotive-desk.md:26-28`; `competitor-matrix.csv:60,38,53,64` |

**(ii) Paste one game, no account.** The shape we ship — and one competitor holds it as a
*position*, not a limitation. **Chess2Story**: *"Paste a game — a PGN, or a link"*, and the dossier
records the absence as a finding — *"No username/account sync, no auto-pull, no 'connect your
account' anywhere — import is one game at a time, by hand"* `[V] absence`
(`teardown-chess2story-desk.md:117-123`). **WintrChess**: paste-PGN → read-only report, no
re-entry (`quickpass-…md:28-30`).

**(iii) File upload.** **Noctie** documents sparring-position import via **PGN file** `[V]`, and
direct FEN paste is *not* confirmed anywhere (`teardown-noctie-desk.md:75-76`). **Zero products in
the corpus are documented as supporting drag-and-drop**, which is worth knowing before assuming it
is table stakes.

**(iv) Capture.** **chessvision.ai** turns scanned boards from books, sites and videos into
analysis `[V]` (`capability-watch.json:368-376`, family `capture_any_position`, mapped to
*Import/export and integrations*). Its register posture is already **defer**, with the reason
stated: *"Admit a provenance/confidence-bearing position adapter after the import and rights
contracts are stable."* Reviewers *"value fast, accurate capture"* `[P]`. This is the modality a
person actually uses for a game from a book, and it is correctly parked.

**Two anomalies worth more than the list.**

- **Chessigma's paid tier has no PGN import** — *"PGN import is the most requested feature still on
  the roadmap"* (`teardown-chessigma-desk.md:169`) `[V]`. A product built entirely on account
  linking is asked for paste, daily. **The two shapes are not substitutes; each is somebody's only
  path.**
- **The corpus's own verdict on our import**, written before this dossier
  (`teardown-chessigma-desk.md:174-177`): *"**We already serve this workflow, one game at a time and
  with the branch attached.** The gap is not the loop; it is the on-ramp — they take a username, we
  take a paste. Their version is worse pedagogy and much better funnel, and that trade is worth
  naming rather than winning on paper."*

**The extractable principle, and it is not "link accounts".** It is that **the source is chosen by
the learner from a list of shapes, and the product adapts to what arrives.** Every competitor
accepts more shapes than we do; the one that accepts fewest is asked for the missing one daily.

**One thing we do that nobody in the corpus does, and it is in this lane.** `rfc/live-sources.md`
strips third-party annotations *"with an assertion, not a hope"* (`:29-39`) `[V]`. Every competitor
that ingests a broadcast or an analysis PGN inherits another product's move grades; we have a rule
against it. §2.3 records that the rule does not yet cover the paste path.

### 2.3 What we ship — four forms and six refusals

**Four separate import surfaces, on four screens, sharing no vocabulary and no component** `[V]`:

| # | Screen | Heading | Accepts | Refuses by construction |
|---|---|---|---|---|
| 1 | `/review` (h1: *"Run history"*) | *"Import one game"* | Lichess **game** URL, or pasted PGN | chess.com URLs, by name |
| 2 | `/learn` | *"Repertoire gaps"* → *"Import repertoire"* | Lichess **study** URL, or a **multi-game, variation-bearing** PGN | — |
| 3 | `/live` match session | *"Position Arena legs"* | PGN textarea only | any URL |
| 4 | `/create` | *"Pack JSON"* | a pasted v0.8 pack document | PGN |

`App.svelte:836`, `:887`, `:1069`, `:987`. Two of these accept a Lichess URL and disagree about
which kind. **Form 2 explicitly accepts variation-bearing multi-game PGN; form 1 rejects both** —
the same product, two screens apart, telling a learner opposite things about the same file
(`repertoire.ts:81` vs `pgn-import.ts:26-31`) `[V]`.

**None of the nine nav destinations is called Import** (`ShellFrame.svelte:25-35`) `[V]`. The game
importer lives inside a screen titled *"Run history"* — a person who arrives wanting to work on
last night's loss must first guess that "Review" means "and also where you put games in".

**The game importer is all-or-nothing across six independent refusals**, every one of which throws
`IMPORT_INVALID_PGN` carrying the parser's own message (`service.ts:798-802`), rendered raw into
`<p role="alert">{importError}</p>` (`App.svelte:843`) `[V]`:

| `pgn-import.ts` | Message the learner sees | When it fires |
|---|---|---|
| `:26` | *"PGN must contain exactly one game"* | pasting a downloaded archive |
| `:28`, `:30` | *"PGN variations are not accepted"* | pasting from any analysis board |
| `:34` | *"Unsupported PGN variant: X"* | Chess960, atomic, … |
| `:37` | *"PGN exceeds 300 plies"* | long games |
| `:45` | *"PGN has an invalid starting position"* | malformed `FEN` header |
| `:52` | *"Illegal PGN move: Nf3"* | any transcription error, at any depth |

**The sharpest consequence, and it is self-inflicted.** The product's own guidance to chess.com
users is *"Chess.com: download or copy the PGN from the game page and paste it here. Tabiya never
links or mines your account."* (`App.svelte:844`) `[V]`. The copy path it recommends is the one
most likely to carry annotations and engine lines — and land on *"PGN variations are not
accepted"*. **We route people into our own narrowest refusal.**

**Two further import defects sit in this scope and are already ledgered, but their *user-facing*
half has not been stated.**

- **We store another product's verdicts on the learner's moves, verbatim** ([[D410]], [[D959]]).
  `parsePgnMainline` takes only `san`/`uci` (`pgn-import.ts:54`), so annotations are dropped at
  parse — but `importGame` stores `source.pgn` unchanged, and `docs/game-import-and-story.md:29`
  says so as a feature: *"pasted PGN is retained verbatim"* `[V]`. A chess.com analysis copy
  carries `{ Blunder. Rf8 was best. }`. That string is now in our database, in a field the account
  export ships (`account-data.ts:178-187`), and `rfc/live-sources.md` has an explicit assertion
  against exactly this for the broadcast path. **The paste path is the unguarded door to the same
  problem**, and the learner is told nothing about what their paste carried in.
- **Every PGN tag is stored and exported verbatim** — `Object.fromEntries(game.headers)`
  (`pgn-import.ts:63`) with no allowlist, surfaced in `ImportedGameExport.headers`
  (`account-data.ts:182`) `[V]`. A chess.com or Lichess PGN's headers name **both players by
  handle**, which means importing a game durably stores an identifier for a person who is not our
  learner and did not consent. This is not an argument for stripping them — provenance needs them —
  but it is a fact a learner should be told once, and §8's disclosure model is where it belongs.
- **Chess960 imports as standard chess** ([[D1033]]): the variant is refused on the header alone
  (`pgn-import.ts:32-35`), so a `Variant` header absent or spelled differently, with no `FEN`,
  silently yields the standard starting position — a variant game read by every downstream detector
  as normal chess.

And both of the top two refusals are refusals **by choice, not by capability** `[V]`:

- `parsePgn` has already returned an array; `:26` throws because `games.length !== 1`. The
  multi-game case is *parsed* and then discarded.
- `game.moves.mainline()` is called at `:36` regardless; lines `:28-31` exist **only** to walk the
  tree and refuse when a sibling child is found. The mainline is extractable at the moment we
  decline to extract it.

### 2.4 What we should do, and why it differs

**(a) One import surface, reached from one word.** A single `/import` destination that asks *what
are you bringing?* and routes to the four existing back-ends, which are all fine. This is an IA
change, not an engine change: the four forms already work and would become four modes of one
screen. It also gives the product somewhere to put a source it does not yet have (§2.4(d)) without
inventing a fifth screen.

**(b) Take the mainline and say so; take the game list and offer it.** Replace the two top
refusals with acceptance plus disclosure, which is exactly what `design/05`'s honesty invariant
asks for in the other direction:

- multi-game → parse all, render a **picker** of the games with their headers, import the chosen
  one. The data is already in hand at `pgn-import.ts:26`.
- variations → import the mainline and state the omission on the run: *"Imported the game as
  played. 12 analysis variations in your PGN were not imported."* The learner keeps their original
  bytes either way — `imported_games.original_pgn` retains them verbatim
  (`account-data.ts:178-187`) `[V]`, so nothing is lost and the claim is honest.

This is the single highest-value import change in the product and it converts our worst two error
messages into two sentences.

**(c) A confirmation step before the run exists.** Today `POST /runs/import` creates the run, the
provenance record, and up to 301 evaluation jobs atomically (`docs/game-import-and-story.md:35-38,
53-56`) `[V]` — the first thing a learner sees is a committed object. Show the parse result first:
players, date, result, ply count, detected side, and what was dropped. Side is currently a
`<select>` the learner sets **before** we have parsed anything (`App.svelte:841`), when the PGN's
own `White`/`Black` headers usually answer it.

**(d) Named as a capability, not built here: the username path.** Every competitor's entry is
*username → game list* (§2.2), and it is the shape people expect. It is also the shape closest to
the rejected list, so §10 Owner decision 3 states the boundary rather than assuming it. What is
worth recording now is that **the narrow version is already legal under the shipped doctrine**:
`docs/game-import-and-story.md:31-32` fetches one public lichess game with no credentials, and a
public-archive *listing* is the same posture one level up — no account link, no credential, no
background fetch, learner picks one game. That is materially different from *"mine games → detect
weaknesses"*, which stays rejected.

**(e) Ask for one thing the fetch currently throws away, using a mechanism that already landed.**
`import-source.ts:73` requests `clocks=false&evals=false&opening=false&literate=false` `[V]`.
Refusing `evals` is right and is the [[D410]] posture. **Clocks are different in kind, and the
corpus has already ruled on exactly why**: [[D1048]] — *"a clock reading is a **measured fact about
the game**, not another product's judgement of a move"* — and its fix, an **extract-before-strip**
amendment lifting `[%clk]` into a typed `{ply, remaining}[]` before the annotation strip, **landed
2026-08-23 for the broadcast path** `[V]`. So the hard part is built and the correct posture is
settled; the game-import path simply does not ask for the data. `time-as-a-difficulty-lever.md` and
`rfc/recorded-clocks.md` both want it.

Why this is the only time-sensitive item in the dossier: **data not requested at import cannot be
requested later.** Every other recommendation here can be applied retroactively to games already
imported; this one silently forecloses *"you had four seconds left when you played it"* for every
game imported before someone changes one word.

### 2.5 Cost and dependencies

- **(b) is two small changes to `pgn-import.ts` plus one list render.** No schema, no RFC — the
  parse already produces everything both paths need.
- **(c) needs one server route** (a dry-run parse returning `ParsedPgnMainline` without persisting)
  or a client-side parse; `chessops/pgn` is already a dependency.
- **(a) is routing plus moving four existing form bodies.** It touches `App.svelte`'s route table
  and `ShellFrame.svelte:25-35`, and it collides with `design/03`'s shell-route row — §10, Owner
  decision 4.
- **(d) is blocked on an owner ruling, not on engineering.**
- **(e) is one word, and it is time-sensitive in a way nothing else here is.**

---

## 3. Import is a capability — and today it is also invisible

The rejected list is satisfied: import gates nothing, `imported` is one session kind of three, and
`docs/game-import-and-story.md:6-7` says so in the document's third sentence `[V]`. **No
recommendation in §2 changes that**, and each was checked against it: a single `/import`
destination is a door in the wall, not the wall; accepting more PGN shapes narrows nothing; the
username path is named as a decision precisely because it is the one that could drift.

But there is a second failure mode the rejected list does not name, and we are in it. *"Import is
not the entry point"* has been implemented as *"import has no entry point"*. It is not in the nav,
it has no screen of its own, its own product doc calls it *"optional entry context"*, and the
strongest thing a person who has just lost a game could do with Tabiya is the thing they are least
likely to find.

**A capability nobody can find is not a capability held in reserve; it is a capability that is
missing.** The correct reading of the rejection is *import must never be the only door*, and a
product with one prominent door marked Play and another marked Import satisfies it exactly.

---

## 4. Arriving before an account exists (owner question 1)

### 4.1 What this section does and does not do

`ux-arrival-and-start.md` **O-A2** already asks the owner *"may a person play before creating an
account, with the run claimed at signup?"*, and records the ruling it reopens —
`design/02-product-shape.md:101-103`, *"the only anonymous access is a scoped token (`story_read`,
`session_join`)"* `[V]`. That question is asked; this section does not re-ask it. It supplies what
that dossier does not: **the shipped-schema cost of each option, and what each does to the export,
deletion and disclosure contracts.**

### 4.2 The question was already decided once, and the reason given no longer holds

`rfc/archive/learner-identity-and-authorization.md:298-300` refused it explicitly `[V]`:

> **"No guest accounts.** Registration is two fields. An anonymous principal that can own runs
> would require a merge-on-signup path and a second identity model, which is the over-build this
> RFC's scope rules forbid."

And `:1099-1101`: *"**No anonymous access of any kind**, including to read routes. That is the
change with the largest product consequence and it is intentional: on a hosted deployment, a run
belongs to somebody."*

**That is a real prior decision and it should be treated as one. But its stated reason is
measurably no longer true**, and this is the specific contribution this section makes:

- **"A merge-on-signup path" is not required.** Every table keys on `owner_learner_id` / `learner_id`
  and never on handle; the deletion design leans on exactly this property — *"Re-registering the
  deleted handle inherits nothing because relationships use learner ids"*
  (`docs/identity-and-authorization.md:58-59`) `[V]`. Claiming a guest row is therefore
  `UPDATE learners SET handle=?, password_hash=? WHERE id=?`. **Nothing moves, so nothing merges.**
- **"A second identity model" is not required either** — because one already exists. `__legacy` is
  *"a real but non-authenticating sentinel"* (`:49-51`) with `LEGACY_HASH = "!"` (`storage.ts:633`),
  a stored hash no scrypt output can equal `[V]`. The row shape a guest needs is in the schema,
  shipped, and load-bearing for deletion.

Since that RFC was written, the surface it forbade has also been amended twice — `story_read`
(`rfc/archive/adoption-wave-1.md:137-144`, which states it is *"consciously amend[ing] one recorded
implementation limit"*) and `session_join` `[V]`. **The anonymous boundary has moved twice by RFC
without the design tier moving**, which is itself worth the owner's attention (§10).

**One hard constraint any option must respect,** from [[D216]]: `Principal` is `{learnerId, handle}`
with **no token variant**, so `publicStory` fabricates a principal out of the sharing host rather
than representing an anonymous caller (`service.ts:915`) `[V]`. What bounds the public story today
is a hand-written narrowing (`moments.slice(0, 8)`, five fields per moment), **not the
authorization layer**. The standing rule D216 draws is the right one for every option below: *any
new route must take its principal from `authenticate()` and never inherit one from a token path.*
Options C and E satisfy this by construction — a guest **is** an authenticated principal, just an
unclaimed one. **Option D does not**, and that is its real cost, larger than the abuse surface.

### 4.3 What is already anonymous, measured

Three facts that change the shape of the question `[V]`:

1. **The server already serves the catalogue anonymously.** `authenticate()` is a per-route helper
   called 36 times (`rest.ts:792`), and `GET /capabilities` (`:946`), `GET /packs` (`:1082`) and
   `GET /packs/:id` (`:1085`) do not call it. The pack list is a public endpoint today. **Only the
   client hides it**, via a single `{:else if !learner}` that replaces the whole application
   (`App.svelte:695`).
2. **The product already renders anonymous HTML with a sign-in form in it.** `rest.ts:105` serves
   the `session_join` card to an unauthenticated visitor with handle/password fields and *"Sign in
   or create a learner account to take this seat."* A public landing page that leads into
   registration is not a new pattern here — it ships.
3. **A non-authenticating learner row already exists in the schema.** `__legacy` is *"a real but
   non-authenticating sentinel"* (`docs/identity-and-authorization.md:49-51`) with
   `LEGACY_HASH = "!"` (`storage.ts:633`) — a stored hash no scrypt output can equal — and
   `identity.authenticate` rejects it explicitly (`identity.ts:147`). **The shape a guest row would
   need is already in the database.**

And one fact that makes the question urgent rather than theoretical: **the acquisition funnel is
built and terminates in a wall.** `/shared/:token` renders a public story card — title, result,
FEN, up to eight moment sentences — and its single call to action is `<a href="/">Tabiya</a>`, with
`productLink` hardcoded to `"/"` (`rest.ts:975`, `service.ts:915`) `[V]`. A stranger reads a
grounded story about someone's game, clicks the only link, and lands on *"Return to your
rehearsals."* with a password field and *"There is no password recovery yet."* (`App.svelte:698,
708`). The card does not say what Tabiya is; the page it links to does not either.

### 4.4 The options, with their costs. This dossier does not pick.

**Option A — keep the gate.** Cost is measured, not hypothetical: §4.3's funnel dead-end, plus the
[[D1473]] finding that the first screen is an unrecoverable-password gate before any evidence of
value. Nothing in the schema changes. This is a legitimate choice for a product that intends to
grow by invitation; it is not a legitimate choice alongside a public share card.

**Option B — anonymous read-only entry, no writes.** Unhide what is already public: the pack
catalogue, capability status, and a landing page that says what the product is. No learner row, no
new anonymous surface in `design/02`'s sense, since these are ordinary unauthenticated reads and
not capability tokens.
*Cost:* it shows the shelf and not the loop. The product's value is commit → consequence → rewind →
branch → compare, and every step of that is server-side run state keyed to `owner_learner_id`
(`storage.ts:4471`). **A visitor could read what packs exist and play nothing.** Risk worth
stating: a board that cannot rewind is a worse advertisement than no board.

**Option C — guest learner row, claimed later.** Mint a real `learners` row with a non-verifying
hash — the exact shape `__legacy` already has — bound to an ordinary session cookie. Everything
downstream works unmodified because every table is already keyed to a learner id, and claiming is
one `UPDATE` (§4.2). Satisfies D216 by construction.
*Costs, all specific:*
- `identity.authenticate` refuses `__legacy` by id (`identity.ts:147`); guests need a rule that
  separates *"cannot authenticate by password"* from *"cannot hold a session"*, which is a
  distinction the identity layer does not currently draw.
- `handle` is the public, lowercase-unique display identity used across grants, invitations and
  attribution; guests need a reserved namespace that cannot collide with or impersonate a claimed
  handle.
- **Export and deletion both re-confirm the password** (`docs/identity-and-authorization.md:73`).
  A guest therefore has **no path to their own data** — cannot export it, cannot delete it — until
  they claim. That inverts the product's own data-rights posture for precisely the people who have
  trusted it least. This is the cost the owner should weigh most heavily, and it is fixable
  (session-scoped export for unclaimed rows) but it is not free.
- Abandoned guest rows accumulate, which forces a retention rule, which is itself a disclosure
  obligation (§8) and a new row in `ACCOUNT_DATA_INVENTORY`'s enforced set.
- It touches `design/02:101` — a guest session is a third anonymous access shape beside
  `story_read` and `session_join`. It does **not** touch `design/02:98`'s *"never a privileged
  user"*: a guest is strictly less privileged, and the ruling is about administrative capability.

**Option D — a third public-token scope.** Extend `PublicTokenRecord` with a `trial` scope, keeping
the letter of *"the only anonymous access is a scoped token"*.
*Cost, and it is the worst of the five:* tokens today are minted **by an authenticated learner**
(`public_tokens.created_by`, `account-data.ts:68`), so a self-minted trial token needs an
unauthenticated mint endpoint, and `docs/identity-and-authorization.md:92` records that *"rate
limiting is per handle only"* — there is no handle to limit. **And it inherits [[D216]] head-on**:
a writing token scope would need a principal the type system cannot express, which is precisely
the hole D216 reports for the read-only scope that already ships. This option buys wording
compliance and pays for it in the one place the corpus has already found a defect.

**A fact that bears on D and on any share-link disclosure:** a `story_read` token has **no
expiry** — *"its lifetime is bounded only by explicit revocation and the creator cascade"*
(`rfc/archive/adoption-wave-1.md:170-175`) `[V]`. A learner who shares one game creates a permanent
public window, and nothing at the moment of sharing says so (§8).

**Option E — guest by default, claim at the moment of loss.** Option C plus a timing rule: the
claim prompt fires the first time the learner would otherwise **lose** something they made — the
first preserved branch, the first recorded attempt — rather than at arrival.
*Cost:* C's costs, plus one product decision about which moment counts. Its merit is that it states
the cost to the learner in the learner's terms, which is the one thing the single `[P]`-evidenced
competitor precedent does well: ChessMotive's bundle carries both *"Create my free account and keep
it all"* and *"Guests start from zero next visit"* (`teardown-chessmotive-desk.md:30-31`, and see
`ux-arrival-and-start.md:180-184` for the standing caveat that this is a **string read from a JS
bundle, not an observed flow** — nobody in this repo has played ChessMotive as a guest).

### 4.5 What breaks, stated by data class

The question *"what breaks if so?"* has a precise answer, because the inventory is exhaustive and
enforced. Under Options C/E, a guest generates rows in classes whose dispositions assume a
password-holder:

| Data class | Tables | What a guest breaks |
|---|---|---|
| `learner_identity` | 1 | `handle` is public and unique; needs a reserved guest namespace |
| `security` | 1 | works unchanged — sessions are already opaque and hashed |
| `owned_runs`, `progress`, `marks` | 8 | work unchanged; keyed by learner id, claimed by `UPDATE` |
| `behavioral_profiles` | 6 | **should not populate for a guest.** A rating record about an unidentified person is the least defensible row in the inventory, and `learner_rating`'s calibration means little from an unclaimed session |
| `live_social` | 13 | grants, invitations and attribution all render `@handle` to **other people**; a guest handle becomes visible to third parties |
| `publications` | 2 | `deletionDisposition: "retain"` — a guest must not be able to publish anything immutable and attributed |
| `drafts`, `repertoires` | 7 | work unchanged |
| `installation` | 1 | unaffected |

The clean rule that falls out: **a guest may accumulate their own record and may not enter anyone
else's.** Runs, branches, attempts, progress — yes. Rating, publication, classroom, live session,
share link — no, until claimed. That is one predicate over the existing inventory, not a new
subsystem, and it is worth writing down whichever option is chosen because it is also the honest
answer to *"what does a guest lose by not claiming?"*.

---

## 5. What the account screen owes a learner (owner question 2)

### 5.1 What a user expects

Two things, and the second is the one we fail.

**That the account is where their stuff is.** Not a settings sub-heading — a place with their name
on it that shows what they have.

**That the product can answer "what do you have on me" without being threatened.** The expectation
here has hardened fast: a person expects a plain-language list, in the product, in their own nouns,
that they can read without downloading anything and without starting a deletion. They expect
surprises to be absent — and a surprise is any category they would not have guessed. Of the twelve
classes we hold, a learner would confidently guess three: their games, their progress, their
account. **They would not guess that we keep a per-game record including why a rated game was
voided and how many they abandoned.**

### 5.2 What we ship `[V]`

- The Account section is `AssistanceSettings.svelte:84-116` — a section inside a page whose `<h1>`
  is *"This deployment"* (`App.svelte:1099`), below 72 assistance controls and a capability status
  list. It renders: the handle, Sign out, Download my data, Delete account. Four controls.
  **This seating is faithful to intent, not a drift from it**: `design/03-product-breadth.md:295`
  lists *"data"* as one of seven Settings destinations, and there is **no Account area in the IA
  table at all** `[V]`. The whole account lifecycle is a Settings sub-item by design. Whether that
  survives contact with §5.4's inventory is §10, Owner decision 4.
- **What is stored is stated once**, as a subordinate clause of the export blurb (`:90`): *"A
  portable copy of your runs, progress, authored drafts, publications, and account-scoped activity.
  Passwords, sessions, provider credentials, and preferences stored only on this device are
  excluded."* The exclusion half is precise and correct — it mirrors the five machine-readable
  exclusions in `account-data.ts:273-279`. The inclusion half is **five nouns for twelve classes**.
- **The deletion preview is the real disclosure surface**, and it fires only on the way out. Four
  headed lists with counts — *Permanently deleted*, *Kept read-only for collaborators*, *Access
  revoked*, *Published work retained* — plus the backup notice (`:101-108`). Its content comes from
  `planDeletion`, which already computes **per-kind counts and object ids** over twelve
  `DeletionEffectKind`s (`account-data.ts:483-502, 539-560`).
- **Registration says nothing about data.** `App.svelte:696-709` is eyebrow, headline, handle,
  password, button, mode toggle, and *"There is no password recovery yet. Keep your password
  somewhere safe."* — an honest and good sentence about **credentials**, and the only sentence
  there is.

### 5.3 The disclosure debt, named exactly

**`behavioral_profiles` is the debt.** Six tables (`account-data.ts:73-78`), and the account screen
names none of them. What they hold, from the export field lists that are already frozen in code
(`:148-152`) `[V]`:

- `learner_ratings` — rating, RD, volatility, seed band, `rated_games`, `voided_games`,
  **`abandoned_games`**, period number.
- `rated_games` — **one row per game**, with `opponent_band`, `learner_side`,
  `engine_identity_digest`, `state`, **`void_reason`**, `result`, `terminal_reason`, `ply_count`.
- `rating_periods`, `cohort_standings`, `standing_members`, `learner_marks` — period history,
  cohort membership, and what a learner has published to a classroom standing.

A learner reading *"runs, progress, authored drafts, publications, and account-scoped activity"*
has not been told that we keep a durable, per-game record of games they walked away from and the
reason each rated game was voided. That is not a legal problem; it is the exact category of
surprise §5.1 says people do not tolerate.

**And this repo has already measured why the class is special.** [[D604]]: *"A transparent style
vector is still behavioral identifying data. R12's 12 retained literal metrics **re-identify 35/36
accounts** across disjoint 100-game halves while a rotated-label control identifies 0/36."* `[V]`
The finding's own conclusion is that *"production profile storage, export/delete, sharing defaults
and any public 'GM twin' surface therefore belong to R18's privacy contract even when no opaque
embedding or username is stored."* `rfc/longitudinal-store.md:605-627` acts on it — learner
deletion is a hard cascade and the `__legacy` precedent is *"deliberately not used"*, because
*"given R12's re-identification result, retaining 'anonymized' observation rows would be retention
in disguise"* `[V]`.

So the corpus already holds a measured result saying behavioural rows identify a person, and two
RFCs already treat that class with extra care. **The one place that has not caught up is the
sentence a learner actually reads.** That is the whole of the disclosure debt, and it makes this
the class to name first rather than the class to fold into "activity".

**And the product already knows how to disclose it — one screen over.** `RatingScreen.svelte`
publishes `Rated games` and **`Abandoned`** as first-class values (`:135-136`), renders a
*"What this number means"* list from a server-supplied `disclosures` array (`:139-141`), and states
the boundary in the learner's terms: *"Band labels describe this calibrated Maia ladder. They are
not FIDE, Lichess, or Chess.com ratings."* (`:118`), *"This record never grades a move or changes
what a coach says about it."* (`:86`). This is good disclosure design, shipped, about one number.
**The screen that owns the whole record does less than the screen that owns one field of it.**

### 5.4 What honest disclosure looks like

**The principle:** disclosure is generated from the inventory, not written about it. Prose about
what a product stores goes stale the first time a migration lands; `ACCOUNT_DATA_INVENTORY` cannot,
because `assertAccountDataInventory` throws if it does (`account-data.ts:89-99`). **Anything a
learner is told about their record should be projected from the same frozen structure that already
governs export and deletion**, so that adding a table forces its disclosure the way it already
forces its disposition.

**Four moments, three of which do not exist today:**

**(i) Before the account exists** — one sentence on the registration screen, next to the honest one
already there. Not a policy link: *"Tabiya keeps the games you play here, what you got right, and
anything you author or publish. You can download all of it or delete it at any time."* Three
clauses, all true, all checkable against the inventory.

**(ii) Standing, on the account screen — "What Tabiya has recorded"**, the section that is missing.
Twelve rows, one per data class, each with a learner-facing noun, a live count, and a one-line
statement of what happens to it on export and on deletion. The counts are already computed:
`planDeletion` produces exactly this shape (`DeletionEffect { kind, count, objectIds, label }`) and
`storage.ts:1230-1251` already runs the queries. **The recommendation is to call the existing
preview machinery in a non-destructive mode and render it as an inventory rather than as a
farewell.** That is the whole change — the hard part shipped on 2026-08-23.

This also fixes an asymmetry that is currently indefensible on its face: **reviewing the deletion
preview is the only way to see your own inventory, and the button to do it sits under a heading
that says "Delete account".** A person who merely wants to know what we hold must approach the
destroy control to find out.

**(iii) Just-in-time, when a class first fills.** The product does this correctly twice — the two
publication retention notices (`App.svelte:999`, `:1023`) `[V]`, which appear at the moment of
publishing and state the post-deletion consequence in one sentence. Generalise it to the three
other moments that create durable records a learner did not explicitly ask for:
- **the first rated game** — a per-game behavioral record begins, including abandonment;
- **the first classroom join or assignment submission** — a teacher gains time-bounded read access
  to a named run, and `classroom_members` becomes shared history that archives rather than deletes;
- **the first share link** — an anonymous capability now exists that **has no expiry at all**:
  *"its lifetime is bounded only by explicit revocation and the creator cascade"*
  (`rfc/archive/adoption-wave-1.md:170-175`) `[V]`. The RFC's reasoning is sound — *"a share link is
  the sharer's standing intent"* — and standing intent is exactly the kind of thing a person should
  be told they are forming;
- **the first import** — a third party's move verdicts and both players' handles enter durable
  storage verbatim (§2.3), and the learner chose neither.

**(iv) At export and deletion** — already correct; leave it alone except for §6.

**What honest disclosure is *not*, and this is the part that keeps it from becoming a dashboard:**
it is a projection of storage facts and nothing else. No inference, no profile summary, no *"you
tend to abandon losing endgames"*. That sentence would be an ungrounded strategic claim about a
person, and it is the account-screen form of the law-8 anti-pattern. **We disclose what rows exist.
We do not narrate what they mean.**

### 5.5 Cost

- (ii) is the largest item and it is a projection plus a render: one non-destructive call path
  through machinery that already exists, twelve labels, one section. No schema, no RFC.
- (i) and (iii) are five sentences total, seated where the two existing retention notices already
  prove the pattern works.
- The dependency worth naming: labels for twelve data classes are learner-facing prose about what
  the product keeps, which is closer to intent tier than most implementation copy — §10, Owner
  decision 2.

---

## 6. Export — you can take it, and nothing can read it

**What we ship, and it is real** `[V]`: `POST /auth/export` returns deterministic canonical JSON
with a SHA-256 digest, closed field sets for every one of 36 table projections
(`account-data.ts:117-154`), five named machine-readable exclusions with human reasons (`:273-279`),
per-section `provenance` naming the source tables (`:264-272`), and runs exported as **replayable
event streams** with a diagnostic when a stored run cannot be replayed (`:285-310`). The client
downloads it as a file (`App.svelte:476-487`). This is a better export than most products ship.

**And it is, as far as this corpus can see, unmatched.** A targeted sweep of every teardown, the
matrix, the capability register and the love/hate sweep found **no competitor documented as
offering a "download all my data" account bundle, and no competitor privacy policy, GDPR posture,
retention statement or account-deletion flow described anywhere in `design/research/`** `[P]`
(absence across the corpus, not a claim that none exists). Every competitor export in evidence is
**PGN-shaped and often gated**: 365Chess's is supporter-only and per-list — *"Remember this is a
feature available only to our supporters"* `[V]` (`teardown-365chess-desk.md:82-85`); Chess2Story
offers a single *"DOWNLOAD PGN"* button `[V]` (`teardown-chess2story-desk.md:110-113`); Chessiverse
exports the main line plus variations `[V]` (`competitor-play-ux.md:124`). The two `privacy`
mentions applied to competitors anywhere in the register are both **`defer` postures on features we
have not built** (`capability-watch.md:41`, `capability-watch.json:53`).

**This is a real and undefended competitive position, and it is invisible.** The most
data-respectful thing the product does is a form field under a heading called "Download my data",
below 72 assistance switches, on a page titled "This deployment". Lichess's most-loved property is
*"everything free, no ads, no tracking, open source"* `[P]`
(`coverage-sweep-2-notability.md:149-151`) — the constituency that cares about this is the
constituency `quickpass-…md:60-61` names as ours, and we say nothing to it.

**Three UX gaps, in descending order.**

1. **It is a format nothing opens, including us.** The media type is
   `application/vnd.tabiya.account+json; version=1` (`:5`), and
   `docs/identity-and-authorization.md:104-105` states the boundary plainly: *"Account export is not
   an account-import format."* So the honest sentence a learner needs — and does not get — is: *this
   is a complete, readable copy of your data; it is not a backup you can restore, and no other chess
   product can read it.* The `.honest` class exists for exactly this kind of sentence and is used
   for the exclusions but not for this.
2. **Portability has an obvious partial answer we already own.** PGN export ships and defaults to
   all branches, writing rehearsal branches as legal PGN variations with `Tabiya branch` comments
   (`docs/game-import-and-story.md:100-104`) `[V]`. **The chess-portable part of a learner's record
   is already portable, per run** — and the account export does not mention it, offer it, or include
   it. "Download my games as PGN" is the request people will actually make.
3. **Export requires a password a learner may not have.** There is no recovery
   (`docs/identity-and-authorization.md:90-92`, disclosed at `App.svelte:708`) `[V]`, and export
   re-confirms it. A person locked out is locked out of their own data permanently, and the only
   place this is said is the sign-in screen, before they have anything to lose. B8 (§10) and the
   recovery gap meet here.

---

## 7. Deletion — the best surface in the product, seated badly

Nothing here is a criticism of the mechanism. Preview-then-confirm, digest-pinned against
concurrent change, `DELETION_PREVIEW_STALE` under `BEGIN IMMEDIATE`, tombstones that preserve
collaborators' read access, publications retained with *"deleted account"* attribution, anonymous
links revoked, `__legacy` reassignment, and a backup notice that admits what deletion cannot do —
*"account deletion cannot purge an existing backup"* (`account-data.ts:555`) `[V]`. That last
sentence is the most honest thing in the product.

Three things to change, all seating and wording:

1. **Split reading the inventory from starting the deletion** (§5.4(ii)). Same query, two entry
   points, one of which is not called "Delete account".
2. **Per-run deletion exists and is unfindable.** `POST /runs/:id/delete` ships with the same
   stale-safe preview flow, and the client's only entry point is a *"Delete this run"* button in a
   list under `/settings` headed *"Runs with exportable PGN"* (`App.svelte:1083-1087`) `[V]`. The
   natural place to delete a run is the run. This also matters for guests and for anyone who
   imported the wrong game: **the granular control that would prevent a full-account deletion is
   hidden behind the full-account deletion's own screen.**
3. **Say what deletion does not reach, before it is chosen, not only inside the preview.** The
   backup notice is currently rendered only after the preview loads (`:107`).

**`DESIGN-GAP:` two intent-tier sentences in this scope are falsified by shipped code.** Per
`design/research/README.md` §House rules this is flagged, not silently resolved, and the escalation
entry in `planning/exploration/log.md` is owed by whoever lands the correction (this pass was
scoped to write only this dossier).

1. **`design/03-product-breadth.md:330`** records the B8 residual as *"no account export/backup
   contract, deletion retains solo runs"*, corrected 2026-08-21 against `release-platform-audit.md`,
   which landed 2026-08-20 (`6303b8b2`) `[V]`. **Both halves are now false.** Export landed
   2026-08-23 (`b4d06547`, `16b0fb1e`) `[V]`, and `planDeletion` routes an unshared owned run to
   `hardDelete` labelled *"{title} is permanently deleted"* (`account-data.ts:545`) `[V]`. This is
   **not** a claim that B8 is met — the platform floor has other unmet parts and this dossier
   measured only the two clauses it touches.
2. **`design/02-product-shape.md:100`** — *"deleted learners' runs reassign to `__legacy`"* — was
   falsified by the same work, and `rfc/archive/portable-account-data.md:440-443` **already recorded
   the gap and correctly declined to edit it** under law 5 `[V]`. It has been outstanding since
   2026-08-23. That RFC's restraint was right; leaving the sentence standing a second time is what
   this flag is for.

Both are intent tier — flagged here, **not edited** (§10, Owner decision 1).

---

## 8. Privacy as a product surface, not a legal footnote

The word *privacy* appears **zero** times in `apps/web/src` `[V]`. That is not the defect — a
privacy *page* would satisfy the grep and change nothing. The defect is that the product's privacy
behaviour is genuinely good and is communicated at exactly one moment, and it is the wrong one.

**The rule this dossier proposes, and it is the product's own rule applied to data:**
`design/05-in-run-experience.md:41` — *"Absence is stated, never simulated. If the product does not
know, it says so."* The data-tier form is the same shape: **presence is stated, never assumed. If
the product keeps something, it says so, at the moment it starts keeping it.** The two publication
notices already are that rule, shipped, in the right place, in one sentence each.

That gives four moments and one standing surface, which is §5.4, and it gives the honest answer to
the trust question in §2.1(4). It is also worth noticing what the product **already tells** a
learner and gets right, because it is a short list and the pattern is consistent:
*"Saved in this browser only"* (`AssistanceSettings.svelte:58`), *"Tabiya never links or mines your
account"* (`App.svelte:844`), *"These are status facts, not account controls"* (`:81`), the two
publication notices, and the backup notice. Every one of them is one sentence, in place, at the
control it describes. **The product has a house voice for this and uses it six times.** Section 5's
recommendation is to use it in the four places where the stakes are highest.

---

## 9. Honest absence audit — import and account

| # | Violation | Evidence |
|---|---|---|
| 1 | The public story card's only CTA links to a password wall; neither the card nor the wall says what Tabiya is | `service.ts:915` `productLink:"/"`, `rest.ts:975`, `App.svelte:698` `[V]` |
| 2 | Two import forms disagree about whether a variation-bearing PGN is acceptable | `repertoire.ts:81` vs `pgn-import.ts:28-31` `[V]` |
| 3 | The product routes chess.com users to the copy path most likely to hit its own narrowest refusal | `App.svelte:844` vs `pgn-import.ts:28` `[V]` |
| 4 | Six distinct import failures render as one raw parser string in one alert | `service.ts:798-802`, `App.svelte:843` `[V]` |
| 5 | The account screen names 5 of 12 data classes and omits the behavioral one entirely | `AssistanceSettings.svelte:90` vs `account-data.ts:73-78` `[V]` |
| 6 | Reading your own inventory requires approaching the delete control | `AssistanceSettings.svelte:97-99` `[V]` |
| 7 | Export does not say it cannot be re-imported, though the doc says so plainly | `AssistanceSettings.svelte:90` vs `docs/identity-and-authorization.md:104-105` `[V]` |
| 8 | Registration discloses the credential risk and nothing about data | `App.svelte:708` `[V]` |
| 9 | Per-run deletion is seated under the account-deletion screen | `App.svelte:1083-1087` `[V]` |
| 10 | Sharing a story mints a link with no expiry and says nothing about it | `rfc/archive/adoption-wave-1.md:170-175` `[V]` |
| 11 | Importing a game stores a third party's move verdicts and both players' handles verbatim, undisclosed | `pgn-import.ts:63`, `docs/game-import-and-story.md:29`, [[D410]]/[[D959]] `[V]` |

Rows 1, 5, 6, 7, 8, 10 and 11 are the ones that bear on trust. None needs a new mechanism: rows 5
and 6 are `planDeletion` called in a second mode; rows 7, 8, 10 and 11 are one sentence each, seated
where the two shipped publication notices already prove the pattern; and row 1 is a landing page
plus a string that is currently `"/"`.

---

## 10. Owner decisions this dossier names (intent tier — not written)

1. **Two intent-tier sentences in this scope are known-false, and one of them has been known-false
   on the record since the RFC that falsified it.**
   - `design/03-product-breadth.md:330`'s B8 residual — *"no account export/backup contract,
     deletion retains solo runs"* — postdates neither claim: export landed 2026-08-23 and unshared
     owned runs hard-delete (§7) `[V]`, against a residual written from a 2026-08-20 audit. It does
     not by itself make B8 met; the platform floor has other unmet parts.
   - `design/02-product-shape.md:100` — *"deleted learners' runs reassign to `__legacy`"* — was
     falsified by the same work, and `rfc/archive/portable-account-data.md:440-443` **says so and
     declines to fix it**, verbatim: *"That sentence described the old implementation and now
     conflicts with the later D656 owner ruling… The protected design sentence requires an
     owner/Claude-on-ruling correction; this RFC does not edit it."* `[V]` The RFC behaved
     correctly under law 5 and the correction has been outstanding since. **Any dossier or agent
     quoting `02:100` is quoting a sentence the corpus already knows is wrong**, which is the
     argument for fixing it rather than re-flagging it a third time.
2. **Learner-facing labels for the twelve data classes.** §5.4(ii)'s standing inventory needs
   twelve nouns that describe what Tabiya keeps, in a learner's language. That is product prose
   about what the product is, adjacent to `design/02`'s adoption posture, and it should be ruled
   rather than drafted by an implementer.
3. **How far does "import is a capability, not a gate" permit the username path?** §2.4(d): a
   public-archive *listing* the learner picks one game from, with no credential and no background
   fetch, is arguably the same posture as the shipped single-game lichess fetch, one level up. It is
   also unmistakably adjacent to the rejected *"mine games → detect weaknesses"* identity. My
   reading is that the listing is legal and any *automatic* selection from it is not — but the
   rejection is a standing owner ruling and this sits on its edge. `[M]`
4. **A single `/import` destination changes `design/03`'s shell route table** (§2.4(a)), which names
   the shell routes as Play/Learn/Review/Live/Create/Library/Settings. Adding a tenth destination
   is an IA change to an intent doc.
5. **The guest question is `ux-arrival-and-start.md`'s O-A2 and is not re-asked here.** Three things
   §4 adds that should be weighed inside that same ruling:
   - **The prior refusal's stated reason no longer holds.**
     `rfc/archive/learner-identity-and-authorization.md:298-300` refused guest accounts because they
     *"would require a merge-on-signup path and a second identity model"*; neither is true against
     the shipped schema (§4.2) `[V]`. A ruling that still says no should say no for a current
     reason.
   - **A guest cannot exercise their own data rights.** Export and deletion both re-confirm a
     password a guest does not have (`docs/identity-and-authorization.md:73`) `[V]`. Shipping guest
     mode without a session-scoped export/delete path means holding data for exactly the people who
     trusted the product least while giving them the fewest controls.
   - **[[D216]] constrains which options are even reachable.** Options C/E work because a guest is
     an authenticated principal; Option D needs a principal shape the type system does not have.
6. **The anonymous boundary has moved twice by RFC while `design/02:101-103` stayed still.**
   That line records the scoped-token model as settled; `learner-identity-and-authorization.md:1099`
   said *"no anonymous access of any kind"*, `adoption-wave-1` then added `story_read` while
   explicitly *"consciously amend[ing] one recorded implementation limit"* (`:137-144`), and
   `social-match` added `session_join` `[V]`. [[D1470]] adds that no `live_view` scope exists
   against `design/03:83`/`:90`'s spectator promises. Whatever is ruled on guests, **the design
   tier's account of anonymous access is two amendments behind the code**, and that is a separate
   correction from the guest question itself.

---

## 11. Proposed ledger rows — NOT written, UNNUMBERED per [[D1130]]

Head at drafting was **D1478** `[V]`. Ids are deliberately omitted; assign from head at write time
per the block-registration convention at `design/BACKLOG.md:118-133`.

- **[dossier]** — this pass: the per-feature UX pass over game/study import, the account, sign-in,
  export, deletion and what a learner is told is kept; the four-moment disclosure model; the
  guest-option cost table against the shipped inventory.
- **🐞 The product's most complete disclosure of a learner's record fires only during deletion.**
  `planDeletion` computes per-kind counts and object ids over twelve `DeletionEffectKind`s
  (`account-data.ts:483-502, 539-560`) and the only way to see it is to click *Review deletion
  effects* under *Delete account* (`AssistanceSettings.svelte:97-99`). The Account section itself
  names five nouns for twelve data classes (`:90`). Sibling of [[D1463]].
- **🐞 `behavioral_profiles` is undisclosed.** Six tables including per-game `void_reason`,
  `terminal_reason` and `abandoned_games` (`account-data.ts:73-78, 148-152`) are named nowhere in
  the Account section, while `RatingScreen.svelte:135-141` already publishes `Abandoned` and a
  *"What this number means"* disclosure list for one field of it.
- **🐞 The import parser refuses two shapes it has already parsed.** `pgn-import.ts:26` throws on
  multi-game PGN after `parsePgn` returned the array; `:28-31` walks the move tree solely to refuse
  variations, while `:36` extracts the mainline regardless. Both are the shapes a learner's
  clipboard actually contains, and `App.svelte:844` routes chess.com users straight into the second.
- **🐞 Four import surfaces, four screens, no shared vocabulary, and no nav entry called Import.**
  `App.svelte:836` (game), `:887` (repertoire/study), `:1069` (arena leg), `:987` (pack JSON); two
  accept a Lichess URL and disagree about which kind; `/review`'s h1 is *"Run history"*;
  `ShellFrame.svelte:25-35` lists nine destinations and none is Import.
- **🐞 The acquisition funnel terminates in a password wall.** `/shared/:token` renders a public
  story card whose sole CTA is `productLink: "/"` (`service.ts:915`, `rest.ts:975`), landing an
  anonymous reader on *"Return to your rehearsals."* plus *"There is no password recovery yet."*
  (`App.svelte:698, 708`). Meanwhile `GET /packs` and `GET /capabilities` are already
  unauthenticated (`rest.ts:1082`, `:946`). Feeds [[D1473]] and `ux-arrival-and-start.md` O-A2.
- **🐞 Export does not say it cannot be re-imported.** `docs/identity-and-authorization.md:104-105`
  states *"Account export is not an account-import format"*; the learner-facing blurb
  (`AssistanceSettings.svelte:90`) does not, and PGN export — which *is* portable and ships
  (`docs/game-import-and-story.md:100-104`) — is not offered from the account screen.
- **🐞 Registration discloses the credential risk and nothing about data.** `App.svelte:696-709` —
  zero occurrences of `privacy`/`terms`/`gdpr` in `apps/web/src` `[V]`.
- **🐞 Per-run deletion is seated inside the account-deletion screen.** `POST /runs/:id/delete`
  ships with a full stale-safe preview; its only client entry is a button in a `/settings` list
  headed *"Runs with exportable PGN"* (`App.svelte:1083-1087`).
- **💡 A standing "What Tabiya has recorded" inventory on the account screen**, projected from
  `ACCOUNT_DATA_INVENTORY` rather than written about it, with live counts from the existing preview
  path, plus just-in-time notices at the first rated game, first classroom join and first share
  link — generalising the two publication retention notices (`App.svelte:999`, `:1023`) that already
  do this correctly. Needs Owner decision 2 for the twelve labels.
- **💡 Guest data-rights predicate.** Whichever way O-A2 is ruled: a guest may accumulate their own
  record and may not enter anyone else's (`behavioral_profiles`, `publications`, `live_social`
  withheld until claim), and a guest must have a session-scoped export/delete path because both
  currently re-confirm a password (`docs/identity-and-authorization.md:73`). One predicate over the
  existing inventory; `__legacy` (`storage.ts:633`, `identity.ts:147`) is the shipped precedent for
  the row shape.
- **💡 `import-source.ts:73` requests `clocks=false`, and the mechanism to handle clocks correctly
  already landed.** [[D1048]]'s extract-before-strip amendment ships for the broadcast path
  (2026-08-23) on the exact reasoning that applies here — *"a clock reading is a measured fact about
  the game, not another product's judgement of a move"*. The game-import path does not ask for the
  data. One word, wanted by `time-as-a-difficulty-lever.md` and `rfc/recorded-clocks.md`, and
  **irreversible for every game imported before it changes** — the only time-sensitive item in this
  dossier.
- **🐞 Import stores identifiers for people who are not our learner.** `pgn-import.ts:63` keeps every
  PGN tag verbatim with no allowlist, and `account-data.ts:182` exports them — so both players'
  platform handles enter durable storage and the account bundle from one paste. Sibling of the
  [[D410]]/[[D959]] annotation-retention pair, which sits in the same field
  (`ImportedGameRecord.pgn`) and which `rfc/live-sources.md` already guards for broadcasts and not
  for paste. Disclosure, not stripping, is the proposed remedy — provenance needs the tags.
- **📊 No competitor in this corpus is documented as shipping an account-data export, a privacy
  policy, a retention statement or an account-deletion flow.** A targeted sweep of every teardown,
  `competitor-matrix.csv`, `capability-watch.json` and `competitor-love-hate-sweep.md` returned
  competitor export evidence that is **entirely PGN-shaped and often gated** (365Chess
  supporter-only per-list, Chess2Story one button, Chessiverse mainline+variations) and **two
  `privacy` mentions, both `defer` postures on unbuilt features**. Absence across the corpus, not
  proof of absence in the world — but it means the product's strongest data-rights position is
  currently undefended **and unstated**, on a page titled *"This deployment"*.
- **📊 Two intent-tier sentences in this scope are known-false.** `design/03:330`'s B8 residual is
  three days stale in the product's favour — export landed `b4d06547`/`16b0fb1e` (2026-08-23) and
  unshared owned runs hard-delete (`account-data.ts:545`) — against a residual written from a
  2026-08-20 audit (`6303b8b2`). And `design/02:100`'s `__legacy` reassignment clause was falsified
  by the same work, with `rfc/archive/portable-account-data.md:440-443` recording that it *"requires
  an owner/Claude-on-ruling correction; this RFC does not edit it"*. Intent tier; Owner decision 1.
- **📊 The design tier's account of anonymous access is two RFC amendments behind the code.**
  `design/02:101-103` records the scoped-token model as settled;
  `learner-identity-and-authorization.md:1099` had ruled *"no anonymous access of any kind"*,
  `adoption-wave-1:137-144` amended it for `story_read` and says so, `social-match` added
  `session_join`, and [[D1470]] finds no `live_view` scope against `design/03:83`/`:90`. Owner
  decision 6.
- **🐞 A `story_read` link never expires and nothing says so at the moment of sharing.**
  `rfc/archive/adoption-wave-1.md:170-175`: *"its lifetime is bounded only by explicit revocation and
  the creator cascade."* The RFC's reasoning — *"a share link is the sharer's standing intent"* — is
  the reason the learner should be told they are forming one.

---

## Residuals and limits

- **No competitor product was driven hands-on, by me or by this corpus** ([[D1458]],
  `design/BACKLOG.md:1742`). Every competitor claim in §2.2, §4.4 and §6 is read from an existing
  dossier and is `[P]` regardless of the label the source used for its own fetch — *"every
  competitor `[V]` in this repo means we read the vendor page or the source, never we used it"*.
  The three most load-bearing here are Chessigma's *"no signup required"* / username-list entry
  (`teardown-chessigma-desk.md:39-42`), ChessMotive's guest-then-claim bundle strings
  (`teardown-chessmotive-desk.md:30-31`), and §6's competitor-export absence. The second carries an
  extra warning already on the record: `ux-arrival-and-start.md:180-184` states it is **a string
  read from a shipped JS bundle, not an observed flow — "nobody in this repo has played ChessMotive
  as a guest."** The single highest-value follow-up for this scope is a 30-minute hands-on pass over
  Chessigma's username→game-list import and Chessbook's three import shapes.
- **§6's competitor-export finding is an absence result and is labelled as one `[P]`.** It says the
  corpus contains no such evidence, not that no competitor ships such a feature. It is also the
  finding most likely to be wrong in the world and most cheaply checked: three privacy-policy fetches
  would settle it. `competitor-matrix.csv` has no column for data rights, which is why the sweep had
  nowhere to look — that is a matrix gap, not only a research gap.
- **No import was performed against a live Lichess URL this pass.** The fetch contract in
  `import-source.ts:63-100` was read, not exercised. The six parser refusals in §2.3 are read from
  `pgn-import.ts`, not reproduced by pasting.
- **§4.5's per-class breakage table is analysis over the shipped inventory `[M]`**, not a
  measurement of a guest implementation, because none exists. The inventory, dispositions and
  `__legacy` mechanics it reasons over are all `[V]`.
- **§5.4's four-moment model is `[M]`** — a synthesis over the product's own two shipped retention
  notices `[V]`, `RatingScreen`'s disclosure pattern `[V]`, and the enforced inventory `[V]`. No
  competitor was observed shipping a generated storage inventory.
- **The guest question is not answered here and is not mine to answer** — §4 supplies costs for
  `ux-arrival-and-start.md`'s O-A2 and adds three consequences to it (§10.5). The options are presented
  without a recommendation, as asked.
- **`design/02` and `design/03` are intent tier and were read, not edited.** Every implied change is
  in §10. `design/02:98`'s *"never a privileged user"* is untouched by everything proposed here: no
  option in §4 creates a more-privileged account, and a guest is strictly less privileged than a
  learner. `design/02:101`'s anonymous-access ruling **is** touched by §4 Options C/D/E and is named.
- **Nothing here proposes inferring anything about a person.** §5.4 discloses which rows exist and
  refuses to narrate what they mean; the rejected v1 identity (*"mine games → detect weaknesses →
  generate episodes"*) is not reachable from any recommendation in this dossier, and §2.4(d) names
  the one place a future change could drift toward it so that it is ruled rather than slid into.
