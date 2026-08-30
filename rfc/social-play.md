# RFC: social-play — native human play, the games that arrive from elsewhere, and the boundary between them

- **Status:** draft — **RETURNED by fresh independent review 2026-08-30 on
  [[D2253]]–[[D2260]].** The native-first rebuild retains useful invitation/import machinery, but
  one run-side/actor projection cannot represent both learners; named opponents are seated without
  acceptance; the join preview cannot show the terms being accepted; agreed draw has no proposal
  protocol; terminal events do not atomically close the session/clock/rating/Review lifecycle;
  rematch remains open despite the 1.0 exit; timed coaching pauses have no clock semantics; and
  `variant: string` loses the ruled rules/setup identity. `make social-play-fresh-review` passes
  8/8. [[D1567]]'s public-pool owner decision remains open. No social schema, migration, route or UI
  implementation is authorized. **Prior status:** 2026-08-24, rebuilt on owner ruling [[D1414]].
  Replaces the 2026-08-23 draft
  that was **returned, not amended**: that document specified a hybrid in which rated and clocked play
  was delegated to a chess-network adapter, and [[D1414]] ruled 1.0 human play **native-first**. Its
  verified machinery is carried forward whole — the external envelope, the additive rebuild-free
  schema repair, the invitation and retrieval state machines, `ARENA_GAME_MISMATCH`, and the
  digest-pinned bot-event tables — because those are about *a game arriving from elsewhere*, which
  native-first does not abolish. What changed is which of them is the answer to *"I want to play a
  human"*.
- **Author:** claude (social-play rebuild), from `design/research/social-play-and-event-boundary.md`,
  `design/research/ux-live-and-social.md` §§1, 7, 8, 10, 11 (the user-facing half),
  `design/research/league-as-return-loop.md` §§4, C5, C6, C7 and
  `design/research/professional-workflow-conformance.md` §§2, 3
- **Created:** 2026-08-23 · **Rebuilt:** 2026-08-24
- **Design refs:** `design/03-product-breadth.md:53-55` (Position Arena's minimum, and its *"native
  clocks/matchmaking can deepen later"* clause — see Deviations), `:87-88` (the parked events row),
  `:327` (B5's shipped scope); `design/05-in-run-experience.md:41` (*"Absence is stated, never
  simulated"*) and `:42` (session machinery *"may never alter what the run says happened on the
  board"*); `design/02-product-shape.md:98-99` (*"No operator account exists… never a privileged
  user"* — **conformed to, not deviated from**, per [[D1481]])
- **Exploration gate:** owner ruling **[[D1414]]** (O12 — *1.0 human play is native-first; rated and
  clocked human play is built here, not delegated*), with **[[D1415]]** (two-human play counts toward
  the return loop, native or imported) and **[[D1416]]** (bot tournaments, leagues and operator
  accounts are **deferred past 1.0, not refused**; each owes a home and an owner). Upstream:
  [[D947]]'s live-games commission and [[D1272]]'s *"separate but integrated"* object ruling. The
  memo the owner ruled from is `planning/platform-alignment/o12-decision-memo.md`.
- **Depends on:** `rfc/archive/social-match.md` (the shipped `match_states`, the two-leg Arena and
  `importLeg` — repaired here, not replaced); `rfc/archive/game-import-and-story.md` (`imported_games`,
  `parsePgnMainline`, the import boundary); `rfc/archive/teacher-surface.md` (`classrooms`,
  `run_grants`, and the **delegated-capability model** [[D1481]] found already ships);
  `rfc/archive/portable-account-data.md` (the export column lists every new column must join);
  `rfc/learner-rating.md` (accepted — §7's label rule, §10a's cohort standing, §10a.2a's
  witnessed-play seam; **consumed, never re-decided** — and §7 of this RFC records the schema blocker
  native ratings hand back to it); `rfc/enforced-clocks.md` (draft — server-authoritative clocks,
  `RunSession.timedControl`, `clock.flagged`, and the run-event mechanism §3.4 reuses);
  `rfc/recorded-clocks.md` (draft — imported per-ply clock readings); `rfc/bot-policy.md`
  (implementing — `BotPolicyDecisionRecord` and its unlanded 0.18 persistence seam);
  `rfc/bot-roster.md` (draft — the profiles without which §6's event has no entrants)
- **Consumes without re-specifying:** `rfc/live-following.md` (the followed broadcast source and the
  [[D411]] liveness lock) and `rfc/casting.md` (the streamer surface). §5.3 states the seam between
  the two OAuth stories so the lanes cannot collide.
- **Parent / amends:** amends nothing. **Repairs** `archive/social-match.md`'s external handoff in
  place (§4), which that RFC shipped as transport and this one completes as identity.
- **Supersedes / superseded by:** supersedes its own returned 2026-08-23 draft.
- **Planning:** `planning/platform-alignment/social-play/`

```tabiya-claims
migration | position behind enforced-clocks | session_invitations and arena_legs gain provider identity, requested/accepted terms and retrieval state as additive ADD COLUMN with no CHECK, so no rebuild
run-schema | lane 0.23 | DrillRunEvent gains GameResignedEvent and DrawAgreedEvent (packages/runtime/src/types.ts:294-310 union of 16 members; a resignation and an agreed draw end a game with no move, so neither can be an outcome.reached)
```

## Summary

Three surfaces sit behind the word *social*. Before [[D1414]] the middle one was going to be
somebody else's. It is now ours.

**Native human play ships as a rehearsal toy and must become a game.** A friend match preserves
authorship, possession, pause-by-consent and the whole rehearsal loop, and deliberately has no clock,
no rating, no resignation verb, no agreed draw and no fair-play claim (`docs/live-sessions.md:46-47`).
The interface says none of that: `apps/web/src` contains **zero** occurrences of *casual*, **zero** of
*no clock*, **zero** of *increment* and **zero** of *timeControl*. [[D1414]] moves the first two out of
the refusals column and into ours; the fifth stays refused and must now be **stated as a promise
rather than inherited as an omission**. §3 specifies the terms, the label that projects them
([[D1472]]), the invitation lifecycle that today has zero producers for two of its three states
([[D1344]]), the two run events a real game needs and nobody owns, the creation form that decides a
product outcome neither of its controls names ([[D1470]]), and the return-loop repair [[D1415]] ruled.

**Games that arrive from elsewhere are an import path — one of three — and none of them is refused.**
`SessionInvitation` stores an arbitrary HTTPS string; `ArenaLeg` stores that string, a pasted PGN, a
result and a local branch. No provider, no challenge id, no game id, no accepted terms, no completion
state, and no path that observes the game finishing — [[D706]], measured. §4 closes it with a typed
envelope, a provider-agnostic adapter, automatic attributed return when authorized, and the pasted
PGN kept as the honest fallback. Under native-first this is **breadth over a complete core**, not the
mechanism the core depends on, which is a strictly weaker obligation than the returned draft carried
and makes criterion 8 a load-bearing assertion rather than a courtesy.

**The local bot event is specified in full and deferred past 1.0 by [[D1416]].** §6 keeps the whole
mechanism — `bot_events`/`bot_event_entrants`/`bot_event_games`, entrants pinned to `profileDigest`
([[D1347]]), a digest mismatch voiding rather than replaying, standings as arithmetic under a rendered
sentence — because a deferral with a named home and no content is the thing [[D1230]]'s repair exists
to prevent. It is out of this RFC's acceptance set and out of its migration claim, and it names the
owner who lands it.

**The one thing this RFC deliberately does not decide is the one the ruling left open.** Whether
native-first includes a **public matchmaking pool** in 1.0, or only private/friend play plus native
ratings, is Open question 1. Both branches are written, both are priced, and **neither is
recommended**: pairing strangers brings abuse handling, reporting and moderation with it, and pairing
friends does not. Nothing else in this document depends on the answer.

## Motivation

`rfc/live-following.md:74` fences this work out with a criterion:

> | Chat bridge, Twitch/YouTube/OAuth integration, editorial delay | B5's real work ([[D704]] measured all four absent). Refused for this RFC, fenced by criterion 12 |

A fence drawn by exclusion is a boundary with nothing on the other side of it. `casting.md` then
claimed the streamer half of that fence under [[D1272]], leaving the social half — the learner's own
game against another person, and our own bots playing each other — named by two RFCs and owned by
neither. That is [[D1330]]'s rank-2 live debt, and this RFC is it.

### The authority, stated correctly this time

**The returned draft's scope fence cited *"three prior rulings"* that do not exist** ([[D1400]],
confirmed at HEAD): `design/BACKLOG.md:630` records **D707** as `📊`, a measurement; `:633` records
**D710** as `📊`; `:631` and `:585` record **D708** and **D819** as `💡`, candidate rows; and **D709**
is `💡` whose status cell cites `planning/platform-alignment/social-play/o12-handoff.md` — so the
document cited this lane's own unruled recommendation back as its own authority. That is a circular
fence, and it is why the O12 memo existed.

The fence now rests on a ruling, and the ruling went the other way:

| authority | what it settles | what it leaves open |
|---|---|---|
| **[[D1414]]** ⚖️ owner, 2026-08-23 | 1.0 human play is **native-first**. Rated and clocked human play is built here. The provider round trip is **demoted to one import path among several**, not refused | whether native-first includes a **public matchmaking pool** — Open question 1, explicitly reserved by the ruling |
| **[[D1415]]** ⚖️ owner | two-human play **counts toward the return loop**, native or imported. The current asymmetry is an accident of which branch fires | nothing |
| **[[D1416]]** ⚖️ owner | bot tournaments, leagues and operator accounts are **deferred past 1.0, not refused**; each owes a home and an owner | the operator half — resolved since by [[D1481]] (§7.2) |
| **[[D1272]]** ⚖️ owner | the object model: a game from elsewhere is *"just a live game… you can open it like an imported game"*. No parallel truth model. Casting is separate but integrated | nothing this RFC touches |
| **[[D710]]** 📊 measurement | the Lichess OpenAPI declares rated/casual challenges, clocks, correspondence, arbitrary-FEN input, public seeks, event/game streams, export with clocks, and bulk pairings | **consumed as a fact about an import path**, no longer as the argument for delegation — [[D1414]] took the cost of not using it, knowingly |

**[[D710]] is not deleted from this document, and it is not the fence any more.** The owner ruled
native-first *against* it, with the substrate's existence on the table. Recording it as a measurement
that lost an argument is more honest than dropping the row.

What is **out of scope, each with a named home and a named owner**, is §7's two tables rather than a
prose fence. Per [[D1230]], nothing here is cut for size, and no arm is deferred without both.

## Specification

### §1 — The boundary as it actually is, measured at HEAD (`0319d6bc`)

#### §1.1 The two session shapes are disjoint by construction, and the discriminator is `boardControl`

`storage.ts:2968` opens the native-match branch on `input.boardControl === "match"` and inserts a
`match_states` row at `:2982`; `storage.ts:2984-2986` seeds the two `arena_legs` rows on
`input.kind === "match" && input.boardControl !== "match"`. The two branches cannot both fire. This is
the mechanical form of [[D252]] (*"`kind === "match"` and `boardControl === "match"` are not
interchangeable"*), and it is the discriminator every downstream projection keys on.

**One correction to the returned draft, carried forward from the O12 memo §4 and re-verified.** That
draft said the `countable: false` forcing fires *"only when a `match_states` row exists"*. The
operative discriminator is `boardControl` — `#matchContext` returns `undefined` unless
`session.boardControl === "match"` and **throws** `STORAGE_FAILURE` if the row is then missing
(`service.ts:2047-2052`), consumed at `:2124`. The consequence is unchanged; the mechanism is the
board-control branch, not the table's existence. §3.6 repairs it.

#### §1.2 What the current external handoff stores, exhaustively

`arena_legs` (`storage.ts:4061-4071`) has eight columns: `session_id`, `leg`,
`reference_player_handle`, `external_challenge_url`, `pgn`, `result`, `branch_id`, `imported_at`.
Exactly **two** carry a `CHECK` (`leg` at `:4063`, `result` at `:4067`); the other six do not.
`session_invitations` (`:4051-4060`) carries `CHECK`s on `leg`, `invited_role` and `state`.

That count is the reason §4.2's columns are additive. SQLite's `ALTER TABLE … ADD COLUMN` cannot edit
an existing `CHECK` on a `STRICT` table — which is why `live-sources` correctly claims a **rebuild**
for `imported_games.source_kind` — but adding an unchecked nullable column needs no rebuild at all.
Every column §4.2 adds is nullable and unchecked, its vocabulary enforced by the writer and asserted
by a test, exactly as `branch_id`, `pgn` and `imported_at` already behave.

#### §1.3 What native human play cannot express, and the three hard blockers [[D1414]] inherits

`docs/live-sessions.md:46-47`: *"Native matches have no clocks, ratings, matchmaking pool,
resignation event, or agreed-draw event."* Under native-first, three of those five stop being
descriptions and become work. Each has a **measured, structural** blocker, and none of the three is
soft:

| absent | blocker at HEAD | owner |
|---|---|---|
| **clock** | nothing in the shipped 16-state composition changes without a gesture; a server-authoritative clock must run while the tab is closed | `enforced-clocks.md` §2 (draft), run-schema lane 0.21 |
| **rating** | **`rated_games.run_id` is `PRIMARY KEY`** (`storage.ts:4567`) — one rated game per run — while a native two-human match is **one run with two learners**. `opponent_band INTEGER NOT NULL` (`:4570`) and `engine_identity_digest TEXT NOT NULL` (`:4575`) both presuppose a bot. On a `STRICT` table this is a **rebuild**, the `live-sources` class | `learner-rating.md` — Discharge D2, priced in §7.1 |
| **resignation / agreed draw** | `outcome.reached` must immediately follow its `move.committed` (`events.ts:330-333`) and the reducer re-derives `terminalOutcome`, throwing on a non-terminal node (`:344-345`, `outcome.ts:5-16`). A resignation and an agreed draw both end a game **with no move**, so neither can be an `outcome.reached` — appending one corrupts every subsequent read of that run, permanently | **nobody, until this RFC.** §3.4 |

The third row is why this RFC claims run-schema lane 0.23. `enforced-clocks` §3.1 established the
mechanism for flag-fall and explicitly declined resignation (`enforced-clocks.md:51-58`, quoting
`learner-rating` §11.3). `design/research/ux-live-and-social.md` §13 Q5 routed the pair to the owner
and found **no owner**. Under [[D1230]], an arm with no named home may not be sequenced away, so it is
in scope here.

#### §1.4 The five defects this RFC repairs, each verified at HEAD

| # | defect | evidence | repaired by |
|---|---|---|---|
| 1 | **The invitation lifecycle has a start state and no transitions.** `'open'` is written by the only producer (`storage.ts:3223-3224`); `'accepted'` and `'revoked'` are `CHECK` values (`:4058`) with **zero** producers — `grep "UPDATE session_invitations"` over `apps/` returns **0** — and `App.svelte:1068` renders `{invitation.state}` to the host | [[D1344]] | §3.3 |
| 2 | **Native private play never states its terms or its absent guarantees in the interface.** `docs/live-sessions.md:46-47` states them; `apps/web/src` contains **0** occurrences of *casual*, **0** of *no clock*, **0** of *increment* and **0** of *timeControl* | [[D1345]], [[D1472]] | §3.2 |
| 3 | **The creation form's two selects jointly decide which product you get and neither names it.** `kind: "match"` plus the **default** `boardControl: "host_directed"` (`live-session.ts:78`) silently yields a PGN-paste Arena (`storage.ts:2984-2986`) rather than a live game with a friend (`:2982`). Runs are listed with **no eligibility marking** (`App.svelte:1060`) against `live-session.ts:84`'s untouched-`position`-run rule, and `void createLive(item.id)` has **no catch**, so a throw renders nothing at all | [[D1470]] | §3.7 |
| 4 | **Two-human play's return-loop contribution is decided by which branch fires.** `service.ts:2124-2126` forces `countable: false` on the primary branch only where `#matchContext` resolves, i.e. only where `boardControl === "match"` (`:2047-2049`). Arena sessions are never that branch, so **an imported leg counts today and a native match does not** | [[D1348]], ruled by [[D1415]] | §3.6 |
| 5 | **Transport is stored where identity is needed.** No provider, challenge id, game id, accepted terms, retrieval state or source node on either table; and any PGN with the right starting position imports as any leg — `live-session.ts:243` checks the root position and nothing else | [[D706]], [[D1346]] | §4 |

#### §1.5 One thing the corpus records as a defect that is **not** one at HEAD

`design/research/ux-live-and-social.md` §7 F5, inheriting `broadcast-and-teacher-surfaces.md` §3.4,
reports a host/guest assistance asymmetry in a native match: *"the host may ask for the Maia
distribution over the position they are playing against each other and the guest may not."*

**Re-measured, that is false for two seated players.** `permittedAssistance` computes
`mayRequestSplit = deliveryOpen && !seatedInContest && (role === "solo" || role === "host" ||
reviewing)` (`packages/runtime/src/assistance.ts:32-34`), and `seatedInContest` **is** produced —
`service.ts:2059-2060` sets it true when the live session is open, a `match_states` row exists, and
the principal is its white or black learner, with a passing test at
`apps/server/src/teacher-surface.test.ts:165-167`. A seated host therefore gets `locked_off` /
`locked_off` / `sight` exactly as the seated guest does. The permissions of two seated players are
identical.

The asymmetry survives only in the case where the host is **not** one of the two players — which
`live-session.ts:85-88` permits, since a session needs one named player, not two. That host is a
spectator with a governance role, and their wider permission is by design. **This RFC therefore does
not repair F5**, and records the correction so the next pass does not build a fix for a bug that is
not there. The residual — that a non-seated host of a rated game between two other people sees more
than either of them — is real and belongs to `learner-rating`'s withholding set, not here
(Discharge D9).

### §2 — The three authorities under native-first, and the one sentence nothing may say

`social-play-and-event-boundary.md` §3 divides trust three ways. Native-first **moves one row and
deletes none**:

1. **Tabiya** owns the source position, consent, the local run, branch and review identity, its own
   evidence contract — **and, from 1.0, its own clock, its own rating and its own result** for a game
   played here.
2. **The chess network**, *where a game came from one*, owns its clock, pairing, rating, result and
   enforcement labels for **that** game.
3. **The learner** authorizes provider access and may revoke it.

**The normative consequence, stated once and enforced by criteria 10 and 12:** the product may say
*which venue reported which result under which terms*. It may never render *"Tabiya verified this
game"*, may never present a provider's evaluation or accuracy figure as a Tabiya grade, and **may
never move a provider's rating number into `learner_ratings`**. This is law 8 applied to a number we
did not compute: *an external game's result is a fact; its rating implication is that venue's, not
ours.*

Native-first sharpens the rule rather than relaxing it. We now compute a rating ourselves, which
makes the temptation to reconcile the two numbers real for the first time. §5.2 refuses it, and §7.1
records why the refusal now rests on a different foundation than it used to.

Provider analysis arriving inside an exported PGN is a special case of the same rule and is handled
at the boundary by §4.6, not by policy prose.

### §3 — Native human play

#### §3.1 Terms: requested, accepted, and stored once for both origins

A human game has **terms** — colour, clock, rated-or-not — and they exist in two states: what was
asked for, and what was agreed. That distinction was invented in the returned draft for the provider
case, where `social-play-and-event-boundary.md` §1 warns that *"rated arbitrary-FEN play may be
constrained by provider policy"* and an adapter must *"preserve and render the provider's accepted
response rather than infer terms from the request"*. **Under native-first the same split is needed for
a native game**, for a plainer reason: an invitation carries terms before anyone has agreed to them,
and a friend who accepts a link is agreeing to something specific.

So one object, three origins:

```text
terms  { rated: boolean,
         clock: { limitSeconds, incrementSeconds } | null,
         colour: "white" | "black" | null,
         variant: string }
```

- **native** — `terms_requested` is written when the invitation is minted; `terms_accepted` is
  written when a named learner takes the seat. The accepted clock is handed to
  `enforced-clocks`' `RunSession.timedControl`; the accepted `rated` flag is handed to
  `learner-rating`'s admission (§7.1). This RFC stores the terms and derives nothing from them.
- **provider** — `terms_accepted` is whatever the provider reported, never what we asked.
- **manual transport** — `terms_accepted` stays `NULL`, and the surface says the terms are not known,
  because they genuinely are not.

**Only the accepted terms may ever be displayed.** Where `accepted` is `NULL` the surface says so; it
does not fall back to the request. Criterion 5.

#### §3.2 The honest label is a projection, never a constant — [[D1472]]

Ledger: [[D1345]], [[D1472]] — the guarantees are documented and unrendered, and the returned draft's
fixed line is false on every native rated row.

The returned draft specified *"a fixed non-configurable line"* — **"Casual private match · no clock ·
no rating · no fair-play enforcement"** — for every `kind === "match"` session. Under native-first,
some of those games have a clock and a rating, so the constant is false **exactly where it was
written to protect**. The repair keeps the section's principle and drops its constancy: the line is a
**projection of the accepted terms**, assembled from three already-owned facts.

| the game is | assembled from | the line reads |
|---|---|---|
| native, no clock, unrated | terms only | Casual private match · no clock · no rating · **no fair-play enforcement** |
| native, clocked, unrated | terms + `RunSession.timedControl` | Private match · 10+5 · unrated · **no fair-play enforcement** |
| native, clocked, rated | terms + `timedControl` + the `rated_games` row | Rated match · 10+5 · rated on Tabiya's own ladder · **no fair-play enforcement** |
| Arena leg naming a provider, terms accepted | `arena_legs.terms_accepted` + `provider_id` | Rated · 10+5 · reported by Lichess |
| Arena leg naming a provider, terms unknown | `provider_id`, `terms_accepted IS NULL` | terms not yet confirmed by the provider |
| Arena leg naming no provider | — | Imported game · manual transport · terms not recorded |

**Two clauses survive unchanged, and they are why this is a repair rather than a rewrite.** Only
*accepted* terms are rendered, never requested ones (§3.1). And **no fair-play enforcement** is on
**every native row regardless of clock or rating** — [[D1414]] bought clocks and ratings and did not
buy an anti-cheat operation, and `docs/live-sessions.md:132-138` is explicit that the product does not
prevent a host cheating on themselves. `professional-workflow-conformance` §2 accepts that limitation;
saying it plainly is what makes it survivable. This is `design/05:41` applied to the surface that most
invites the wrong inference.

The clause is normative and load-bearing: **a rated native game whose label omits *no fair-play
enforcement* is a shipped lie**, and criterion 6 fails it.

#### §3.3 The invitation state machine gains its producers — [[D1344]]

No schema change; the `CHECK` at `storage.ts:4058` already admits all three values. What is missing is
every writer.

```text
open ──(a named Tabiya learner redeems the invitation and takes the seat)────────▶ accepted
open ──(the provider reports the challenge accepted, where provider_id is set)───▶ accepted
open ──(the host revokes)────────────────────────────────────────────────────────▶ revoked
open ──(the provider reports declined or expired)────────────────────────────────▶ revoked
```

`accepted` and `revoked` are both **terminal**. `accepted` is not reachable from `revoked` and
`revoked` is not reachable from `accepted`: a host who wants to undo an acceptance ends the session,
which is a different act with a different record. The transition is written in the same transaction as
the seat grant, so an accepted invitation and an unfilled seat cannot disagree. Criterion 2.

**No auto-expiry.** An unaccepted invitation sits in `open` until the host revokes it. An expiry timer
is a second clock with nothing to check it, and `session_join` tokens already carry their own
expiry — two expiries on one object is the class of defect [[D412]]'s lesson exists to prevent. Open
question 4 records the alternative.

#### §3.4 Resignation and an agreed draw are run events, on `enforced-clocks`' mechanism

Ledger: a new row — the two verbs a real game needs and no document owns.

`enforced-clocks` §3.1 established that flag-fall cannot be a fifth `terminal_reason`, because
`outcome.reached` must immediately follow its `move.committed` (`events.ts:330-333`) and the reducer
re-derives `terminalOutcome`, throwing *"references a non-terminal node"* on a board chess does not
consider terminal (`:344-345`; `outcome.ts:5-16` produces exactly four terminal cases). **A resignation
and an agreed draw have precisely that property**, so the identical mechanism applies and the identical
corruption follows from the obvious design. Two new run events, on lane 0.23, behind
`enforced-clocks`' 0.21:

```ts
export type GameResignedEvent = Event<"game.resigned", {
  readonly node: NodeRef;          // the node the game stood on
  readonly resignedBy: "white" | "black";
  readonly outcome: RunOutcome;    // derived from the side, never from the board
}>;

export type DrawAgreedEvent = Event<"draw.agreed", {
  readonly node: NodeRef;
  readonly offeredBy: "white" | "black";
  readonly acceptedBy: "white" | "black";
}>;
```

`DrillRunEvent` is a union of **16** members at HEAD (`packages/runtime/src/types.ts:294-310`);
`enforced-clocks` adds `ClockFlaggedEvent` on 0.21, and these are the two after it.

Three rules bind them:

1. **Both require two seated humans.** `game.resigned` and `draw.agreed` are refused on a run with no
   `match_states` row, because a solo learner resigning to a bot is `learner-rating` §11.3's
   abandonment problem wearing a verb, and the clock is that problem's ruled answer
   (`enforced-clocks.md:57-58`). Criterion 7.
2. **A draw needs two acts.** `offeredBy` and `acceptedBy` must be different sides and both must be
   seated. A one-sided draw is a proposal on the session journal, not a run event, and it never
   touches the run — `design/05:42`, session machinery *"may never alter what the run says happened
   on the board"* until it does so through the run's own event log.
3. **Neither derives anything from the board.** A resignation's outcome is a function of the
   resigning side alone. We do not check whether the position was lost, and we do not label it.

#### §3.5 What native play still refuses, stated as a promise

Not an omission and not an apology — the interface's own sentence, rendered at the same weight as
everything beside it (`design/research/ux-live-and-social.md` §9, answer 5):

> **Tabiya does not police this game.** There is no cheat detection, no report button and no
> adjudication. You are playing someone you invited.

Under Branch A of Open question 1, that sentence is complete. Under Branch B it is not, and the
difference is exactly what makes Open question 1 an owner decision rather than a scope choice.

#### §3.6 The return loop counts two-human play — [[D1415]]

Ledger: [[D1348]] — an accident nobody chose, now ruled.

`service.ts:2124-2126` rewrites the projection to force `countable: false` on the primary branch
whenever `#matchContext` resolves. `#matchContext` resolves only for `boardControl === "match"`
(`:2047-2049`), and Arena sessions are never that branch (`storage.ts:2984`) — so **an imported Arena
leg counts toward `/learn` today and a native friend match does not**. `league-as-return-loop` §4
item 6 reports this as *"two-human play contributes nothing to the return loop"*, which is true of a
native match and false of an Arena leg. Nobody made that choice; it fell out of which table gets a row.

**The repair, per [[D1415]]:** the override at `service.ts:2124-2126` is removed, so the primary
branch of a native match carries the `countable` value `projectAttempts` computed, exactly as every
other run does. `#matchContext`'s three other consumers (`:990`, `:2073`, `:2095`) are untouched —
they enforce opponent-selection refusal, the pause protocol and actor derivation, none of which is
about progress. Criterion 8 asserts the new value and would have failed at HEAD.

The interface says what the game contributed rather than accruing it silently: a completed friend game
appears in `/learn` beside drill attempts, labelled as a whole game.

#### §3.7 The creation surface — [[D1470]]

Three defects in one form, and the repair is one shape.

**(a) The product is chosen by a card, not by two selects.** `App.svelte:1058` offers `Kind` and
`Board` as independent controls whose *combination* decides the outcome, and the default value of the
second silently inverts the meaning of the first. The surface offers **named jobs** — *Play a friend*,
*Teach or coach*, *Cast to an audience* — and derives `kind` and `boardControl` together from the
chosen job, because they were never two decisions. *Play a friend* sets `kind: "match"` **and**
`boardControl: "match"`; the Arena is reached by its own named job, *Import a game we played
elsewhere*. Criterion 3.

**(b) Eligibility is rendered before the press.** `live-session.ts:82-88` throws four distinct
refusals — the kind/board pairing, an untouched `position` run, an unknown handle, a missing or
duplicate player. The run list at `App.svelte:1060` offers **every** hosted run with no marking. Each
refusal becomes a rendered predicate on the shipped `HonestControl` / `class="honest"` dialect (43
usages in `apps/web/src`), which `expectDisabledControlsExplained()` already build-enforces for
disabled controls (`screens.test.ts:64`, `app-shell.test.ts:176`). This is that contract applied to a
control that is currently *enabled and simply fails*.

**(c) The error path renders.** `createLive` is invoked as `void createLive(item.id)`
(`App.svelte:1060`) with no `catch`, so a rejected creation produces an unhandled rejection and no
message. Every `ServerError` from `live-session.ts:79-89` renders its message at the control that
produced it. Criterion 4.

The title is asked for rather than fabricated: `createLive` sends ``title: `${liveKind} session` ``
(`App.svelte:616`), so every stream a person ever hosts is called *"stream session"*.

### §4 — Games that arrive from elsewhere

Under [[D1414]] this section is **breadth over a complete core**, not the core. Nothing in §3 depends
on any of it, and criterion 9 asserts that mechanically.

#### §4.1 Three import paths, one envelope

| path | `provider_id` | how the game returns | ships today |
|---|---|---|---|
| **manual transport** | `NULL` | a human pastes the PGN | yes — `importLeg` (`live-session.ts:237-250`) |
| **own-game import by URL** | set, no challenge | the learner names a game they already played | yes — `resolveImportSource` (`import-source.ts:60-90`) |
| **provider round trip** | set, with a challenge | we create the challenge, observe it, and import the completion | **no** — this RFC |

All three write the same envelope, so the surface reads one shape and the difference is data:

```text
source:    runId + sourceNodeId + packId?
provider:  providerId? + challengeId? + gameId? + gameUrl?
terms:     requested { rated, clock, colour, variant }
           accepted  { rated, clock, colour, variant } | null
return:    importedRunId + branchId + result + retrievalState + witnessClass
```

Three rules give the shape its teeth.

**(a) An opaque link is a fallback, not a completed round trip.** A leg whose `provider_id` is `NULL`
is *manual transport* and is labelled as such; a leg that names a provider but carries no `game_id` is
*incomplete* and must not be described as returned. The R17 harness already encodes this —
`validAdapterEnvelope` rejects the same envelope with `gameId: ""`
(`tools/r17-social-play-harness/social-play.test.ts`). Criterion 1.

**(b) Only accepted terms render.** §3.1, applied identically to all three paths.

**(c) `sourceNodeId` is stored even though v1 constrains it.** `importLeg` anchors both legs to the run
root (`canonicalRunStart`, `live-session.ts:243`; leg 1 additionally requires an untouched run, `:246`).
The provider substrate accepts an arbitrary FEN ([[D710]]), so the constraint is ours and temporary.
Persisting the node **records** the constraint instead of assuming it, and makes challenging from a
mid-run node a later change to one validator rather than a schema migration. Open question 2.

#### §4.2 Schema — additive, no rebuild

`session_invitations` gains, all nullable, all unchecked:

| column | holds |
|---|---|
| `provider_id` | the adapter's id; `NULL` means the invitation is native or manual |
| `provider_challenge_id` | the provider's challenge identity |
| `terms_requested` | JSON, §3.1 — written for native and provider invitations alike |
| `terms_accepted` | JSON, §3.1; `NULL` until a seat is taken or a provider reports |

`arena_legs` gains, all nullable, all unchecked:

| column | holds |
|---|---|
| `provider_id` | as above |
| `provider_challenge_id` | joins the leg to its invitation's challenge |
| `provider_game_id` | the provider's game identity — §4.5's comparison operand |
| `provider_game_url` | the canonical provider URL, distinct from the pasted `external_challenge_url` |
| `source_node_id` | §4.1(c) |
| `terms_accepted` | JSON, provider-reported |
| `retrieval_state` | §4.3's vocabulary |
| `witness_class` | §5.1's two values, or `NULL` |

**Native and Arena are told apart by the session, not by a new column.** An invitation belongs to a
native match when its session has `boardControl === "match"` and to an Arena otherwise — the same
disjoint branch §1.1 measures. Re-using [[D252]]'s discriminator rather than minting a parallel one is
what keeps this migration additive.

`external_challenge_url` is **kept unchanged on both tables**. It is the fallback path's storage and
the migration's compatibility guarantee: every existing row remains valid and reads as manual
transport.

**Every new column joins `ACCOUNT_EXPORT_COLUMNS`** — `account-data.ts:140` lists
`session_invitations`' eight columns and `:141` lists `arena_legs`' eight, and both are projected at
`:271`. Criterion 13 makes that self-enforcing rather than remembered.

#### §4.3 The retrieval state machine

`arena_legs.retrieval_state` is a new five-value vocabulary, enforced by the storage writer and never
by a `CHECK` (that is the whole point of §1.2):

```text
awaiting_acceptance ─▶ playing ─▶ finished ─▶ imported
        │                 │           │
        └─────────────────┴───────────┴────▶ unreachable
```

`unreachable` is reachable from every non-terminal state and is **not** an error state: it means the
provider could not be observed and the manual PGN path remains open. `imported` is terminal and is the
only state in which `branch_id` is non-null. A manual-transport leg (no `provider_id`) occupies
`awaiting_acceptance` until it is imported and skips the two middle states — because we genuinely do
not know. Criterion 11.

#### §4.4 The adapter interface, and the boundary that is red at HEAD

One provider-agnostic interface, one implementation:

```ts
export interface ChessNetworkAdapter {
  readonly providerId: string;
  createChallenge(request: ChallengeRequest): Promise<ChallengeIdentity>;
  observe(identity: ChallengeIdentity): Promise<ProviderGameState>;
  exportGame(gameId: string): Promise<string>;
  parseGameId(pgnHeaders: Readonly<Record<string, string>>): string | undefined;
}
```

Four rules bind it:

1. **It is the only *new* code permitted to speak to a provider**, and the boundary is asserted by an
   allowlist rather than by a prohibition — see below.
2. **Requests to one provider are serialized, and a 429 stops that provider for 60 seconds.** The
   Lichess API tips are explicit — *"Only make one request at a time"*, and wait one minute after HTTP
   429 (`social-play-and-event-boundary.md` §3). This is the adapter's own correctness, not platform
   operations, so it is specified here. `import-source.ts:68` already serializes with a promise chain
   and the adapter reuses that shape.
3. **It never grades.** The adapter returns identity, terms, state, headers and PGN bytes. It has no
   return type that can carry an evaluation, a rating or an accuracy figure. §2's rule is enforced by
   the type, not by review.
4. **v1 uses named and open challenges only.** Public seeks (`apiBoardSeek`) and bulk pairings exist
   ([[D710]]) and are Deferral F3 — opponent *discovery* is a different product decision from opponent
   *connection*, and under Open question 1 it may not be ours at all.

**The criterion-7 repair — [[D1382]], red at HEAD with no remedy.** The returned draft asserted *"no
module outside the adapter issues a provider request"*, which is false at HEAD and would have been
false at landing. Measured now:

| module | line | what it reaches | class |
|---|---|---|---|
| `tablebase.ts` | `:30` | `https://tablebase.lichess.org/standard` | production, injectable `options.fetcher` |
| `import-source.ts` | `:36`, `:72-74` | `https://lichess.org/api/study/…`, `https://lichess.org/game/export/…` | production, injectable `fetchImpl` |
| `corpus.ts` | `:119` | the configured explorer endpoint | production, injectable `options.fetcher` |
| `external-tts.ts` | `:34` | the configured TTS URL | production, injected `#fetch` |
| `external-voice.ts` | `:41`, `:65` | the configured voice URL | production, injected `#fetch` |
| `line-probe.ts` | `:28` | Lichess explorer | **not production** — line 1: *"DISPOSABLE research instrument (D345 wave, 2026-08-16). Not production."* |
| `split-probe.ts` | `:23` | Lichess explorer | **not production** — line 1: *"DISPOSABLE research instrument (D148 wave, 2026-08-15). Not production."* |

**And two of the six modules [[D1382]] named do not fetch at all.** `opponent-selector.ts` and
`evidence-queue.ts` contain **zero** occurrences of `fetch` or `http`; they consume an injected
`TablebaseSource` and an `EngineRequest` (`evidence-queue.ts:13-16`). They are already on the correct
side of the boundary, and they are the pattern the criterion should demand rather than modules it
should indict. The finding is real and narrower than recorded.

So the criterion becomes a **set-equality against a derivation**, per [[D1240]] — never a prohibition
that a landing cannot satisfy:

> A test enumerates every module under `apps/server/src` that reaches `fetch` or a bare provider
> hostname literal, excluding files whose first line declares `DISPOSABLE research instrument`, and
> asserts the set is **equal** to an exported `NETWORK_EGRESS_MODULES` constant. This RFC's landing
> adds exactly one member: the adapter. No integer is asserted.

That is RED at landing in the way that matters: a convenience `fetch` added to `live-session.ts` or
`service.ts` fails the set-equality, which is the duplicate-rate-limiter failure the original criterion
was aiming at. Criterion 12.

#### §4.5 Return, and its verification — `ARENA_GAME_MISMATCH` with a named operand

Ledger: [[D1346]] — today any PGN with the right starting position imports as any leg.

When authorized, the adapter observes the game to completion and imports the PGN into the originating
run as a branch — the path `importLeg` already walks. Three verifications, two of which ship:

- **Root identity** — the PGN's start position must equal the source node's canonical start. Ships:
  `ARENA_ROOT_MISMATCH` (`live-session.ts:243`).
- **Single import** — `saveArenaImport` updates `WHERE session_id=? AND leg=? AND branch_id IS NULL`
  and throws when `changes !== 1` (`storage.ts:3254-3256`), so a duplicate return is refused by the
  write inside a `BEGIN IMMEDIATE` transaction (`:3246`), not by a check-then-act race. Ships.
- **Game identity — new, and the operand is named.** The returned draft threw `ARENA_GAME_MISMATCH`
  without saying what was compared to what, which is [[D1382]]'s third finding. The operands are:

  > **Left:** `arena_legs.provider_game_id`.
  > **Right:** `adapter.parseGameId(parsed.headers)`, where `parsed` is `parsePgnMainline`'s result —
  > which already returns the full header map (`apps/server/src/pgn-import.ts:9`, populated at
  > `:63`) and which `importLeg` currently computes at `live-session.ts:241` **and discards**. For the
  > Lichess adapter, `parseGameId` reads the `Site` header's trailing path segment.
  >
  > The comparison is a byte-exact string equality. It runs **iff** `provider_game_id` is non-null.
  > It **fails closed**: a `NULL` or unparseable right operand against a non-null left operand throws
  > `ARENA_GAME_MISMATCH`, because a provider-named leg whose return cannot be identified is not a
  > return.

  Criterion 14 asserts three arms: mismatch throws; match imports; and `provider_game_id IS NULL`
  never throws, which is the manual-path regression guard.

If completion cannot be fetched, the leg sits in `unreachable`, the surface says the game is awaiting
import, and the pasted PGN route still works.

#### §4.6 What the import boundary strips, and what it keeps

**Third-party grades — stripped, and asserted.** [[D410]] applies to anything imported back: a
provider's inline `{ [%eval …] }` and `{ Blunder. Rf8 was best. }` are *another product's verdict on a
move entering our corpus as authored-looking text*. `import-source.ts:73` already requests
`evals=false&literate=false`, which [[D410]] correctly calls *"reliance on an upstream default we do
not control, with no test"*. The adapter's `exportGame` therefore **asserts** the returned bytes carry
no `%eval` and no comment annotations, and strips them if they do. Criterion 15 — the assertion, not
the hope.

**Clocks — kept.** `[%clk]` readings are **not** annotations in [[D410]]'s sense; they record what the
player had, which is the same class as the move itself. `recorded-clocks` owns their typed storage
(`imported_games.clocks`, run-schema lane 0.19). One precision the adapter must not inherit: the
shipped own-game export requests `clocks=false` alongside `evals=false&literate=false`
(`import-source.ts:73`), so a returned clocked game would arrive today with its readings discarded at
the *request* rather than at the parser. The adapter's `exportGame` requests `clocks=true`, and
criterion 15's stripping assertion is scoped to annotations and **never** to `[%clk]`. Deferral F5.

**Termination — kept and attributed.** A provider game can end by flag-fall, resignation or
abandonment. From 1.0 our native game can express two of those three (§3.4) and `enforced-clocks`
adds the third — but an externally-returned game records the **provider's stated** termination
verbatim, attributed to the provider, and **derives nothing from it**. We do not convert a provider's
resignation into a `game.resigned` event on our run, because that event means *this learner resigned
here*, and a foreign result is a fact about another venue. Deferral F6.

### §5 — Seams consumed, not re-decided

#### §5.1 Witnessed play — [[D946]], and two warrants that must not be merged

`learner-rating` §10a.2a pins the seam and is explicit about its limits: *"the ruling reserves the
seam; it commissions no table, no route, no validator"*, and *"nothing is implemented until a real
cohort exists"*. **This RFC commissions none of those either.** What it contributes is the fact the
future predicate will have to read, and the vocabulary for it.

| `witness_class` | means | recorded by |
|---|---|---|
| `tabiya_session` | the game was played inside a live session that held at least one spectator `run_grant` at the time of the sealed result | shipped `run_grants` / live-session machinery — **no new mechanism**, exactly as §10a.2a requires |
| `provider` | the game was played on a named chess network, which reported the result under stated terms | §4's provider identity |

*We watched it* and *someone else says it happened* are different warrants, and a cohort that one day
requires witnessed play must be able to choose between them rather than be handed a boolean that
silently merges them. **Which values a cohort's predicate admits is not decided here** — that is
`learner-rating`'s, as Discharge D5. The column is written because the fact is free to record when the
game returns and impossible to reconstruct afterwards.

Native-first adds a third possibility and this RFC deliberately does **not** mint an enum member for
it: a native rated game played here is neither of the two above, it is simply *ours*, and its warrant
is the run's own event log. Inventing `tabiya_native` before a cohort exists would be exactly the
speculative table §10a.2a withheld.

#### §5.2 The cohort standing and the rating — this RFC writes neither

`learner-rating` §10a is accepted: one standing per classroom, entries created only by their subject,
ranked by results and **grouped — never ranked — by rating**.

**No route in this RFC writes `learner_ratings`, `rated_games`, `rating_periods`, `standing_members`
or `learner_marks`.** Criterion 16.

That sentence is unchanged from the returned draft. **Its reason is entirely different, and the
difference matters.** The returned draft refused because an external rated game's rating meaning
belonged to the provider and merging a Lichess number into an engine-anchored calibration would
manufacture a comparison neither instrument supports. That argument still holds for provider games —
but under native-first the interesting case is a **native** rated human game, where the number is
ours, and the old reason does not reach it.

The reason that does: **`learner-rating` is the single writer of every rating object, and admitting a
two-human game is a change to *its* preconditions, not a table this RFC may write into.** §3
precondition 3 requires `opponentPolicy.mode === "human_common"` with a ladder-rung `targetElo`
(`learner-rating.md:341`), and `POST /rated-games` creates a `position` run with a pinned bot policy
(`:1312`). A native human match satisfies none of that, and §1.3 records the structural blocker:
`rated_games.run_id` is `PRIMARY KEY` (`storage.ts:4567`) against one run with two learners, with
`opponent_band` and `engine_identity_digest` both `NOT NULL`. That is a `STRICT`-table rebuild and a
new admission predicate, and it is Discharge D2. This RFC supplies the **terms**, the **result** and
the **seating** and hands all three across the seam.

The human-anchor opportunity on the other side of the refusal also belongs there. `learner-rating`'s
open question 6 calls the human anchor *"the single highest-value unrun experiment this RFC creates"*,
and `league-as-return-loop` §C7 shows the external round trip is the cheapest instrument for it: a
returned game carries the learner's provider rating, the accepted terms, and a whole unassisted game
against a human of known strength. Discharge D3 routes it there rather than building a second rating
story here.

#### §5.3 Two OAuths, two lanes

Ledger: [[D1349]] — the collision this section exists to prevent.

`live-following.md:74` fences out *"Chat bridge, Twitch/YouTube/OAuth integration"*, and
`professional-workflow-conformance` §3 describes the vote adapter's provider bridge. Those are a
**chat** credential for a **streaming platform**, owned by the casting lane. This RFC's OAuth is a
**chess-network** credential for a **game provider**. They share a word and nothing else: different
provider, different scopes, different failure modes, different surface. Neither lane may implement the
other's, and Deferral F1's operational contract covers both under one secrets story without merging
them.

Likewise on objects: a followed broadcast game is *someone else's game that we watch*; an adapter game
is *the learner's own game on someone else's board*. `live-following` owns the first, this RFC owns the
second, and no code path converts one into the other.

**What the provider costs us operationally, priced here and owned elsewhere.** The adapter needs:
per-learner OAuth token storage with the exact scopes `challengeCreate`/`boardGameStream`/`gamePgn`
require; refresh and revocation, including the learner revoking at the provider without telling us;
one global event stream per account rather than per session; reconnect and idempotency across a
restart; 429 backoff (§4.4 rule 2); provider deletion propagating into our export and delete paths;
and provider-health surfacing that distinguishes *"we cannot reach them"* from *"the game has not
finished"*. Of those, **§4.4 rule 2 and §4.3's `unreachable` state ship here** because they are the
adapter's own correctness. **Token custody, scope grants, refresh/revocation and health reporting are
Deferral F1**, owned by `planning/platform-alignment/release-platform/`. This RFC does not implement an
OAuth flow and does not pretend the flow is small.

#### §5.4 The events row — [[D412]]'s disambiguation, scoped

`design/03:87-88`'s events row lists *"team relays"* among *"scheduled pack nights, invitations,
cohorts, two-leg position matches, team relays, and later native matchmaking"*. Two independent agents
have derived from scratch that this means a **roster with a calendar**, and that external tournament
relay is a different object entirely ([[D412]]).

For this RFC's scope the clause is normative: **team relays are not in it, and external relay is
`live-sources`/`live-following`'s.** Amending the design sentence is law 5's, and the proposal is filed
at `planning/platform-alignment/social-play/intent-amendment-2026-08-24.md` rather than written into
`design/`. Discharge D4.

### §6 — The local bot event: specified in full, deferred past 1.0 by [[D1416]]

**[[D1416]] defers bot tournaments past 1.0 and requires each deferral to owe a home and an owner.**
§6's object is a bot tournament — its `format` vocabulary is literally `round_robin` and
`double_round_robin` — so the whole of §6 is **out of this RFC's acceptance set and out of its
migration claim**. It is not deleted, thinned or summarised: a deferral whose content lives nowhere is
the failure [[D1230]]'s template repair exists to prevent, and the mechanism below is already verified
work. Its home is `planning/platform-alignment/social-play/`; its owner is `bot-roster.md`, which lands
the entrant pool §6.4 measures at zero, and which re-declares this migration and these criteria when
the deferral lifts.

#### §6.1 The provenance half already exists and exceeds the ask

Ledger: [[D1347]].

[[D708]] asked for *"event id, exact entrant policy ids and versions, every child game run, result,
Review target"*. Measured at HEAD, `BotPolicyDecisionRecord` already carries `profileId`,
`profileVersion` **and `profileDigest`** (`apps/server/src/bot-policy-catalog.ts:141-144`). The digest
is the stronger pin: a version number records what someone remembered to bump; a digest records what
the declaration actually was.

Entrants pin **all three**, and the digest does real work: if an entrant's digest at game time differs
from the digest recorded at entry, the game is **voided and recorded as voided**, not silently
replayed under the new declaration.

One dependency is honest: that record is computed but **not yet persisted** — `bot-policy`'s own status
line says so, and its persistence is the claimed run-schema lane 0.18 seam. Per-move policy provenance
for event games rides that seam; Discharge D6.

#### §6.2 The event envelope

```text
bot_events            eventId, format, createdAt, closedAt?
bot_event_entrants    eventId, entrantId, profileId, profileVersion, profileDigest
bot_event_games       eventId, gameNo, runId, whiteEntrantId, blackEntrantId,
                      result, reviewRunId, voidReason?
```

`format` is a closed two-value vocabulary: `round_robin` and `double_round_robin`. Knockouts need
seeding, and seeding is an ordering by strength — which §6.3 refuses. A knockout would need a seeding
rule that is not a strength claim, which is a new question, not a new enum value.

**Every child game is an ordinary run.** No parallel truth model, no event-specific event types, no
bespoke board. Review, story, evidence and the observation ledger consume an event game exactly as they
consume any other run — [[D1272]] applied — which is what makes the whole feature cheap.

#### §6.3 Standings are arithmetic, and say so

A standings table is permitted as deterministic arithmetic over recorded results: games, wins, draws,
losses, points. It renders beneath one fixed sentence, carried **in the payload** rather than in the
template:

> These are recorded results between named policy versions. They are not a strength measurement, and
> no entrant's rating is derived from them.

That is [[D819]] as a rendered constraint rather than a footnote: no vendor has validated a weakened-bot
label against humans, so a table ordering our own bots by points must not read as ordering them by
strength.

#### §6.4 The gate is arithmetic, and its criteria are repaired

`BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` — a literal empty array at
`bot-policy-catalog.ts:299`, under the comment *"D970 keeps the concrete band/profile roster closed
until the accepted RFC pins it."* The constructible-entrant pool at HEAD is **0**.

**[[D1382]]'s second finding was that the returned draft's criteria 14 and 15/16 were mutually
unsatisfiable at landing** — criterion 14 baked the zero-entrant pool in as an assertion while 15 and
16 each required a *played* event game. The root cause is a [[D1240]] violation: an integer was
asserted where a procedure belonged. The repair, carried into the deferral:

- **E1 — construction refuses below two distinct digests.** Asserted against a **derivation**: the test
  builds a catalogue with `compileBotPolicyCatalog([…])` and asserts that any input yielding fewer than
  two distinct `(profileId, profileVersion, profileDigest)` triples throws. `BOT_POLICY_PROFILES`'
  emptiness is a **drift tripwire in a comment**, never the assertion. *Wrong impl:* one that admits
  the same profile twice, or defaults a missing digest to the empty string — precisely the defect
  R17's harness caught in itself before publishing.
- **E2 — a child game is an ordinary run.** The test supplies a **two-profile catalogue of its own**,
  plays one event game, then deletes the event rows and runs Review, story and the evidence path over
  the surviving run with no event-aware branch. E1 and E2 are now jointly satisfiable, because E1
  asserts a refusal over a derivation and E2 supplies its own entrants.
- **E3 — a digest mismatch at game time voids and records `void_reason`**, rather than playing under
  the current declaration. *Wrong impl:* one that re-reads the profile by id.
- **E4 — the standings sentence is in the payload**, not only in the template that renders it.
  *Wrong impl:* copy a second client can omit.

### §7 — Deferred and refused, separated

[[D1416]] made this section's central distinction: a deferral owes a **home** and an **owner**; a
refusal owes **evidence**. The returned draft merged them into nine refusals, two of which the owner
has since converted.

#### §7.1 Deferred past 1.0 — each with a home and an owner

| # | deferred | home | owner | what lifts it |
|---|---|---|---|---|
| F1 | **OAuth token custody, scope grants, refresh, revocation, provider health, and provider-deletion propagation** — priced in §5.3 | `planning/platform-alignment/release-platform/` | the F12 platform contract that already owns secrets, backup and the deployment floor | that contract's next revision |
| F2 | **The local bot event** (§6) — tables, entrants, standings and its four criteria | `planning/platform-alignment/social-play/` | `bot-roster.md` | a non-empty profile catalogue, plus [[D1416]]'s post-1.0 window |
| F3 | **Opponent discovery through the adapter** — public seeks and bulk pairings exist ([[D710]]); v1 uses named/open challenges only | `planning/platform-alignment/social-play/` | a successor drafted from this lane | Open question 1, whose answer decides whether discovery is ours or a provider's |
| F4 | **A hosted league**, and — per [[D1481]] — **a round/pairing aggregate plus a declared result** (§7.2) | `planning/platform-alignment/social-play/` | a successor drafted from this lane | the numeric trigger below, or an owner ruling |
| F5 | **Per-ply clock readings from a returned external game** (§4.6) | `recorded-clocks.md` lane 0.19 | that RFC | its implementing commit |
| F6 | **Provider-stated termination reasons for returned games** (§4.6) | `enforced-clocks.md` lane 0.21 | that RFC | its implementing commit |
| F7 | **Federation** — cross-instance discovery, portable identity, federated moderation | R19/O14 | `planning/platform-alignment/decision-queue.md:51` (O14, DEFERRED) | a separate promotion ruling the dossier already requires |

**F4's reopen trigger is a number, not a feeling.** `league-as-return-loop` §C6 measures a real
league's minimum input: Season 49 fields **352 rostered players plus a 121-deep bench**, and the bench
covers 13% of boards in a single round — *"it needs not just players but spare players"*. Against
`fun-mechanics-outside-roguelikes.md:1039`, *"this deployment has one learner."* The trigger is
**enough learners to fill one section with a bench**. Below that the question is not open. §5.4 of that
dossier adds an independent second ground: randomised evidence against the obligation mechanism itself
(n ≈ 250,000, P = 0.115 on completion).

#### §7.2 The operator half of [[D1416]] is closed by [[D1481]], and the deferral is re-homed

[[D1416]] instructed that the operator account be checked for redundancy against the shipped Teacher
surface before a lane was opened for it. [[D1481]] ran that check and closed it:

- **The account form is refused on its own terms.** `design/02:98-99` — *"No operator account exists…
  Administrative capability lives in environment and configuration, never a privileged user."*
- **The capability already ships.** `rfc/archive/teacher-surface.md` delivered a per-classroom
  **delegated capability** on the run-grant model — bounded population, authority scoped to one
  classroom, symmetric exit, addressing, calendar, a results table and two-human seating — with every
  classroom-minted grant an ordinary `run_grants` row (`teacher-surface.md:373`). That is exactly the
  shape `league-as-return-loop` §C5 named as the survivor: *per-league delegated capability, not a
  platform operator.*
- **Two objects are genuinely missing**, and they are what the deferral should have named all along:
  a **round/pairing aggregate** (an assignment addresses a *pack*; nothing addresses an *opponent*)
  and a **declared result**, which collides with `teacher-surface`'s *"received-or-not, never marked"*
  rule (`teacher-surface.md:239`) and its counts-only reads.

**So F4 is those two objects, not an account.** Nothing in this RFC asks for a privileged user, and
this document therefore **conforms to** `design/02:98-99` rather than deviating from it.

#### §7.3 Refused, with the evidence that refuses it

| # | refused | why | reopen trigger |
|---|---|---|---|
| R1 | **Anti-cheat, fair-play adjudication, reporting and blocking** | not bought by [[D1414]]; `docs/live-sessions.md:132-138` is explicit that we do not prevent a host cheating on themselves. §3.2's label is the honest alternative, and §3.5 states it as a promise | **Branch B of Open question 1 reopens exactly this** — pairing strangers requires reporting and moderation, and that is the branch's whole cost |
| R2 | **Rendering any provider's rating, evaluation or accuracy figure as ours** | §2; law 8; §4.6's stripping assertion | none |
| R3 | **Relaying or organising a broadcast** | `live-following` §6 — we consume, we do not relay-operate. Restated here so this RFC is not read as reopening it | none |
| R4 | **Raw chat ingestion** | `professional-workflow-conformance` §6; and §5.3's lane separation | none |

**Two refusals the returned draft carried are gone, and are not quietly absent.** Its refusal 1
(*native public matchmaking*) is **Open question 1**, not a refusal — [[D1414]] reserved it explicitly.
Its refusal 2 (*native ratings for human-vs-human play*) is **overturned outright** by [[D1414]] and is
now §3's work, with its structural blocker priced in §1.3 and handed to `learner-rating` as
Discharge D2.

## Deviations from design

1. **`design/03:53-55` sequences native clocks after the Position Arena minimum** — *"at minimum,
   two-leg fixed-position sparring through invitation/Lichess handoff plus PGN return; **native
   clocks/matchmaking can deepen later** without erasing the surface."* [[D1414]] puts native clocks
   and native ratings **in 1.0**, so the word *later* no longer describes the plan. The sentence is not
   contradicted — nothing here erases the Arena surface, and §4 keeps the Lichess handoff and the PGN
   return intact — but its ordering is now wrong. **A proposed intent amendment is filed in the same
   commit** at `planning/platform-alignment/social-play/intent-amendment-2026-08-24.md`, per AGENTS.md's
   2026-08-24 clause. This RFC does not edit `design/`.
2. **`design/03:87-88`'s *"later native matchmaking"* and `:327`'s *"Native matchmaking stays outside
   minimal-real scope by design"* are conditionally affected and deliberately left alone.** Under
   Branch A of Open question 1 both sentences remain true. Under Branch B both are falsified. **The
   amendment is owed at the moment of the ruling, not now**, and filing it before the owner has chosen
   would be this document assuming the answer it was told not to assume. The proposal file records
   both sentences as *conditional*, with the trigger stated.
3. **`design/03:87-88`'s *"team relays"* is left unbuilt and unowned by this RFC** (§5.4). The
   roster-with-calendar reading is [[D412]]'s and is not yet in the design text; the same proposal file
   carries it.
4. **No other divergence.** `design/02:98-99` is **conformed to**, not deviated from (§7.2).
   `design/05:41`'s honest-absence invariant is §3.2 and §3.5's whole basis, and `design/05:42`'s rule
   that session machinery may never alter what the run says happened is why §3.4 puts resignation and
   the agreed draw in the **run's** event log rather than the session journal.

## Fresh independent return (2026-08-30)

The native-first direction, requested/accepted distinction, external import identity and
non-manufactured result posture survive. Exact review:
`planning/platform-alignment/social-play/fresh-independent-buildability-review-2026-08-30.md`.

1. **[[D2253]] — project both learners, not one run-side twice.** Define a participant-perspective
   projection for actor, result, progress, longitudinal observations, Review/Story and ratings. The
   shared board record stays one; learner interpretation is keyed by seated side.
2. **[[D2254]] — acceptance must be an act by the invited learner.** Supplying a handle at creation
   may reserve/invite a seat but may not grant it, write accepted terms or expose the run before that
   learner accepts.
3. **[[D2255]] — show the agreement before redemption.** The join-preview operation must return safe
   host identity, exact requested terms, start-position/rules identity and expiry without exposing
   the board; acceptance records exactly those normalized bytes.
4. **[[D2256]] — specify the draw proposal.** Add the closed offer/withdraw/decline/accept state,
   actor/turn rules, route/result/errors and one transaction from accepted proposal to
   `draw.agreed`. A sentence saying the proposal lives in the journal is not a producer.
5. **[[D2257]] — make game termination one lifecycle operation.** Checkmate/stalemate/rules draw,
   resignation, agreed draw and flag must atomically settle the run, stop the clock, close or finish
   the match, revoke live mutation/invitation paths, project both results/ratings and open Review.
   Manual host close needs an explicit abort/adjudication outcome instead of a second terminal fact.
6. **[[D2258]] — close rematch before claiming the 1.0 journey.** The roadmap requires rematch while
   Open question 3 leaves its identity unresolved. Choose the recommended new-session chain or rule
   another exact shape, then preserve prior terms with an explicit change step.
7. **[[D2259]] — define timed coaching-pause semantics.** Pin the authoritative clock reading and
   atomic stop/resume rules when both players accept a rehearsal pause; stale clients and a flag
   racing the pause must have one result.
8. **[[D2260]] — replace free-form variant terms with the shared subject identity.** Accepted terms
   consume `rules + setupFamily` plus exact start position; native creation and provider import may
   not normalize different games to the same string.

Returned clock, rating, bot and variants dependencies remain hard gates. Open question 1 remains
[[D1567]] rather than being silently answered: a no-chat public pool still needs measured
abort/stall, avoid/block, rate-limit, cheating-response and operator-evidence boundaries, though it
does not automatically require a social-network moderation stack. No schema, migration, storage,
route, client, CSS, content, archive or protected-design byte is authorized by this return.

## Acceptance criteria

Each names the wrong implementation that would otherwise pass, and each has a concrete tree state that
makes it **RED**. Unfailable criteria are a named defect class here ([[D444]], [[D984]], [[D1274]]).

**§6's four criteria (E1–E4) are deferred with §6 and are not in this set** ([[D1416]]).

1. **A leg that names a provider but carries no `provider_game_id` is not describable as returned.**
   The projection reports it as incomplete and the surface says so. *RED at HEAD:* today a stored
   `external_challenge_url` and nothing else is the whole integration. *Wrong impl:* one that treats a
   challenge URL as a completed round trip.
2. **The invitation state machine has producers for all three values**, asserted as four transitions
   and two non-transitions: `open → accepted` by seat redemption, `open → accepted` by provider report,
   `open → revoked` by host, `open → revoked` by provider decline; and `accepted ↛ revoked`,
   `revoked ↛ accepted`. Plus: an `accepted` invitation and its seat grant are written in one
   transaction, asserted by forcing the grant to fail and observing the state unchanged. *RED at HEAD:*
   `grep "UPDATE session_invitations" apps/` returns **0**. *Wrong impl:* adding a setter and never
   calling it, which is the current defect with extra code.
3. **The creation surface derives `kind` and `boardControl` from one named job.** Asserted at the API
   boundary: choosing *Play a friend* produces a session with `boardControl === "match"` and a
   `match_states` row; choosing *Import a game we played elsewhere* produces two `arena_legs` rows; and
   **no client-reachable path can produce an Arena from a control labelled as playing a friend**.
   *RED at HEAD:* `kind: "match"` with the default `boardControl` yields an Arena
   (`live-session.ts:78`, `storage.ts:2984`). *Wrong impl:* renaming the `<option>`s and leaving them
   independent.
4. **Every creation refusal is rendered before the press or at it.** Two arms: (a) a run that is not an
   untouched `position` run is marked ineligible for *Play a friend* with a rendered reason, asserted
   through `expectDisabledControlsExplained()`; (b) each of `live-session.ts:79`, `:82`, `:84`, `:85`,
   `:87`, `:88`'s `ServerError` messages reaches the DOM when creation is attempted anyway. *RED at
   HEAD:* `void createLive(item.id)` has no catch (`App.svelte:1060`), so a throw renders nothing.
   *Wrong impl:* a `catch` that logs to the console.
5. **The render path reads `terms_accepted` and never `terms_requested`**, asserted by storing
   divergent values and checking the API response carries only the accepted pair, plus a third case
   where `terms_accepted` is `NULL` and the response says the terms are unconfirmed. *Wrong impl:* one
   that falls back to the request, silently asserting a rated game we never got.
6. **The terms label is a projection, and *no fair-play enforcement* is on every native row.**
   Asserted as a table test over all six rows of §3.2 against the **exported copy constants**, not
   against markup, and asserted at the API boundary rather than on the host's view only. One arm is
   dedicated: a **rated, clocked native** session's label contains the fair-play clause. *RED at HEAD:*
   `apps/web/src` contains 0 occurrences of *casual*, *no clock*, *increment* and *timeControl*.
   *Wrong impl:* the returned draft's fixed constant, which is false on exactly the rated rows; or a
   CSS-hidden clause.
7. **`game.resigned` and `draw.agreed` are refused on a run with no `match_states` row**, and a
   `draw.agreed` whose `offeredBy` equals its `acceptedBy` is refused. Plus the corruption guard: a
   run carrying either event **projects**, asserted by replaying it through the reducer and reading
   `terminalOutcome` — the failure `events.ts:344-345` produces for a mis-modelled terminal event.
   *Wrong impl:* modelling either as an `outcome.reached`, which throws on every subsequent read
   forever.
8. **A completed native friend match's primary branch is countable.** Asserted on the projection: the
   primary branch of a `boardControl === "match"` run has `countable: true` and appears in `/learn`.
   *RED at HEAD:* `service.ts:2124-2126` forces `false`. Second arm, the regression guard: an imported
   Arena leg is **still** countable, unchanged. *Wrong impl:* removing `#matchContext` entirely, which
   also removes the opponent-selection refusal at `:990` and the pause protocol at `:2073`.
9. **The native path is complete with the adapter absent.** A native friend match — creation, terms,
   invitation, clock, seating, pause, rehearsal, comparison, resignation and result — passes with the
   adapter module unregistered. *Wrong impl:* one whose session projection throws when no provider is
   configured. Under [[D1414]] this is the primary path, so this criterion is load-bearing rather than
   a courtesy.
10. **No rendered surface in this RFC contains a verification claim about any game.** Asserted against
    the exported copy constants. *Wrong impl:* a helpful *"verified on Lichess"* badge — or, newly
    possible under native-first, a *"verified by Tabiya"* badge on a native rated game, which §3.5
    refuses by name.
11. **`retrieval_state` reaches `unreachable` from each of the three non-terminal states**, and
    `branch_id` is non-null **iff** the state is `imported`. *Wrong impl:* an enum with no transition
    test, where a leg can be imported and still read as playing.
12. **Network egress is an allowlist, asserted by set-equality against a derivation.** A test
    enumerates every module under `apps/server/src` reaching `fetch` or a bare provider hostname,
    excluding files whose first line declares `DISPOSABLE research instrument`, and asserts set-equality
    with an exported `NETWORK_EGRESS_MODULES`. No integer is asserted ([[D1240]]). This RFC's landing
    adds exactly one member. *RED:* a convenience `fetch` in `service.ts` or `live-session.ts` fails
    the equality. *Wrong impl:* the returned draft's blanket *"no module outside the adapter issues a
    provider request"*, which is red at HEAD on `tablebase.ts:30`, `import-source.ts:36`/`:72-74`,
    `corpus.ts:119`, `external-tts.ts:34` and `external-voice.ts:41`/`:65` and exempts none of them.
13. **Column set-equality against a derivation, not a hand-count** ([[D1240]]): a test derives
    `PRAGMA table_info` for `session_invitations` and `arena_legs` and asserts each is **set-equal** to
    its `ACCOUNT_EXPORT_COLUMNS` entry (`account-data.ts:140`, `:141`). No integer is asserted. *Wrong
    impl:* a column added to the schema and forgotten in the export, which is silent data loss on
    account export.
14. **`ARENA_GAME_MISMATCH` compares `arena_legs.provider_game_id` against
    `adapter.parseGameId(parsed.headers)`**, three arms: it throws on a byte-inequality; it imports on
    equality; and it does **not** throw when `provider_game_id IS NULL`. A fourth arm asserts
    fail-closed: a non-null `provider_game_id` against an unparseable or absent right operand throws.
    *RED at HEAD:* `live-session.ts:241` computes `parsed` and discards its headers, so any PGN with
    the right root imports as any leg. *Wrong impl:* one that hardens the provider path and breaks the
    manual fallback.
15. **A returned PGN carrying `%eval` or comment annotations is stripped, and the stripping is asserted
    on the adapter's output** rather than trusted to request parameters — while `[%clk]` readings
    **survive**, which is the same assertion's second arm. *Wrong impl:* [[D410]]'s exact finding —
    relying on `evals=false&literate=false`, an upstream default we do not control, with no test; or
    the mirror failure, inheriting `import-source.ts:73`'s `clocks=false` and discarding the clocks
    §4.6 hands to `recorded-clocks`.
16. **This RFC writes no rating, standing or mark.** After a native match completes **and** after an
    external game returns, `learner_ratings`, `rated_games`, `rating_periods`, `standing_members` and
    `learner_marks` are byte-identical to their pre-state. *RED:* an implementer who reads §3's rated
    terms as licence to insert a `rated_games` row fails here. *Wrong impl:* one that counts an
    external rated game as a rated game because the word matches.
17. **A second import into an imported leg is refused by the write.** Asserted by racing two imports
    and observing one `INVALID_REQUEST`, not by reading `saveArenaImport`'s SQL (`storage.ts:3254-3256`).
    *Wrong impl:* a check-then-act guard that passes single-threaded.
18. **The migration adds no `CHECK` and performs no rebuild.** Asserted by comparing the
    `sqlite_master` SQL for `session_invitations` and `arena_legs` before and after, and confirming the
    `CHECK` count on `arena_legs` is unchanged at **2** (`leg`, `result`). *Wrong impl:* a well-meaning
    rebuild that re-enters `live-sources`' `STRICT`-table cost for no reason.
19. **`register-check` is green with this RFC active**, and its `tabiya-claims` block joins the
    `rfc/README.md` migration and run-schema Live-claims rows byte-exactly (C3).
20. **Scope fence:** a **diff-scoped** assertion that this RFC's landing adds no `WorkflowContextId`,
    no `SessionKind`, no `RunRole`, no evidence kind and no `public_tokens` scope. *Diff-scoped
    deliberately*, per [[D1451]]'s finding against `live-following` criterion 12: a scope clause that
    says *"introduced by this RFC"* and an instrument that greps the **tree** stop agreeing the moment
    a second lane lands in the same tree. *Wrong impl:* one that introduces a `tournament` session
    kind, which would break `presets.ts`'s 28-admitted / 12-refused grid the same way a ninth context
    does — and would quietly un-defer F4.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Native clocks: server-authoritative decrement, refusal of client timestamps, `RunSession.timedControl`, `ClockReading.source: "played"`, `clock.flagged`, and a `rated_games.terminal_reason` widening | `enforced-clocks.md` (lane 0.21) | that RFC's implementing commit | |
| D2 | **Native ratings for two-human play.** `rated_games.run_id` is `PRIMARY KEY` (`storage.ts:4567`) against one run with two learners; `opponent_band` (`:4570`) and `engine_identity_digest` (`:4575`) are `NOT NULL` and presuppose a bot; §3 precondition 3 admits only `human_common` (`learner-rating.md:341`). A `STRICT`-table rebuild plus a new admission predicate | `learner-rating.md` | that RFC's next amendment | |
| D3 | The human-anchor experiment — external rated games against known provider ratings, the cheapest instrument for `learner-rating`'s highest-value unrun experiment (§5.2) | `learner-rating.md` | that RFC's next amendment | |
| D4 | The `design/03` amendments (§Deviations 1–3): the *"later"* ordering falsified by [[D1414]], the two conditional matchmaking sentences, and [[D412]]'s team-relays disambiguation — law 5 work, proposed not written | OWNER | `planning/platform-alignment/social-play/intent-amendment-2026-08-24.md` | proposed 2026-08-24 |
| D5 | Which `witness_class` values a cohort's witnessed-play predicate admits (§5.1) | `learner-rating.md` | §10a.2a's successor, when a real cohort exists | |
| D6 | Per-move policy provenance for event games rides the unlanded lane-0.18 record-persistence seam | `bot-policy.md` | that RFC's implementing commit | |
| D7 | `docs/live-sessions.md` and `docs/account-data-lifecycle.md` updates for the provider columns, the two state machines, the terms label and the two new run events — including the correction that `:46-47`'s five absences are now three | codex | this RFC's implementing commit | |
| D8 | `rfc/live-following.md` criterion 12's scope/instrument mismatch ([[D1451]]) — its clause says *diff*, its grep says *tree*. Not this RFC's to fix, and criterion 20 does not repeat the mistake | `live-following.md` | that RFC's next amendment | |
| D9 | The non-seated host of a rated match between two other people is outside the withholding set that binds both players (§1.5) | `learner-rating.md` | that RFC's `ASSISTANCE_WITHHELD` revision | |

## Open questions

1. **Does native-first include a public matchmaking pool in 1.0, or only private/friend play plus
   native ratings?** [[D1414]] reserved this explicitly and **this document does not lean.** Both
   branches are written; neither is recommended; nothing else in this RFC depends on the answer.

   **What is identical under both branches:** everything in §3 except discovery. Clocks, ratings, the
   terms label, resignation, the agreed draw, the return-loop repair and the creation surface are all
   required by native-first alone.

   | | **Branch A — private/friend play + native ratings** | **Branch B — a public pool** |
   |---|---|---|
   | the user's side | you play people you know; you get a link; ratings move; there is no queue and no stranger | a seek list or a queue; you pick a time control and press play; someone arrives — the flow `apiBoardSeek` serves and every mainstream product has trained |
   | new user-facing screens beyond §3 | **0** | **4** — the seek/queue surface and its honest-empty state, a report flow, block/mute, and a moderation queue |
   | what the interface additionally owes | the **absence of a pool becomes a promise**: *"who am I rated against?"* must be answered on the rating surface — *people you invited, and bots whose exact policy version is recorded* — because a rating with an unstated population is a number pretending to be a scale. Precedent: `learner-rating` R7 declines to publish our number as an external-scale equivalent because the anchor is unmeasured | an honest-empty pool state rendered as itself, per `design/05` (*"honest-empty and source-unavailable are first-class states"*); an empty pool rendered as a spinner is the worst available outcome |
   | collides with `design/02:98-99` | no | **yes** — every act in a moderation queue is an act by a privileged human, and *"never a privileged user"* is an owner ruling. `league-as-return-loop` §C5: *"A league is not missing an admin screen; it is missing the role, and the role was refused on purpose."* The transformation §C5 names — per-league delegated capability on the run-grant model — needs a scope smaller than the platform, and it is not obvious what that is when the pool **is** the platform |
   | collides with [[D1416]] / [[D1481]] | no | **yes** — it needs the deferred capability, and [[D1481]] found the missing objects are a round/pairing aggregate and a declared result (§7.2) |
   | falsifies `design/03:327` and `:87-88` | no | **yes** — *"Native matchmaking stays outside minimal-real scope by design"* becomes false, and the amendment is owed at the ruling (Deviations 2) |
   | minimum input | two people who know each other | a population **with a bench** — `league-as-return-loop` §C6 measures 352 rostered plus 121 reserves, the bench covering 13% of boards in one round, against `fun-mechanics-outside-roguelikes.md:1039`'s *"this deployment has one learner"* |
   | reopens refusal R1 | no | **yes, entirely** — pairing strangers is what makes reporting and moderation obligatory |
   | unlocks the human anchor | only via import (§5.2, Discharge D3) | continuously — though §C7 notes the cheaper substitute already exists: **import** games from a league whose entrants carry published external ratings, *"a better-controlled human-anchor dataset than the experiment the RFC proposes to run"* |
   | discovery of another learner | **there is none today**, and Branch A makes that acute: no directory route, no handle search, `/sessions` lists only sessions where you already hold a grant, so *"you must already know a handle out of band"* (`league-as-return-loop` §4). Branch A is not the cheap branch; it is the branch where the friend link is load-bearing rather than convenient | the pool **is** the discovery mechanism |

   Under **A**, §7.1's F3 (adapter discovery) becomes the only way a stranger is ever reached, and
   Deviations 2's design sentences stand. Under **B**, F3 is redundant, R1 is reopened, and three
   intent sentences need amending. **The two collisions are with owner rulings, which is why a research
   tier could not resolve this and why this RFC does not.**

2. **May a challenge or a native match be seated from a mid-run node in v1?** §4.1(c) stores the node
   but v1 constrains it to the root, following `importLeg`'s anchor (`live-session.ts:243`, `:246`) and
   the native match's untouched-`position`-run rule (`:84`). *Recommendation:* **keep the constraint
   for v1** — a mid-run seat changes what an Arena leg and a friend match *are* — and note that the
   stored field makes lifting it a validator change rather than a migration.

3. **Does a rematch chain become new legs, a new session, or a new run in the same session?** The
   Arena has exactly two legs and the two-leg shape is the point — the same position from both sides.
   Under native-first a rematch is now a plainly expected verb (§Motivation, the field's standard
   flow). *Recommendation:* **a new session**, because a rematch is a third game and a third game is
   not the two-leg comparison. Flagged because the opposite choice is cheap now and expensive after the
   first stored chain.

4. **Does an unaccepted invitation ever expire?** §3.3 says no — an explicit host revoke, because an
   auto-expiry is a second clock with nothing to check it and `session_join` tokens already carry
   their own. Flagged because a `revoked` producer now exists, so the opposite choice is one writer
   away.

## Ledger rows

Proposed, unnumbered — the [[D1130]] numbering convention is **retired** ([[D1503]]) and the
coordinator lands these. `design/BACKLOG.md` is **not** edited by this pass.

- 🐞 **Native human play has no resignation and no agreed draw, and no document owns them.**
  `docs/live-sessions.md:46-47` records both absent; `enforced-clocks.md:51-58` solves flag-fall and
  explicitly declines them; `ux-live-and-social.md` §13 Q5 routed the pair and found no owner. Under
  [[D1414]] a rated native game whose only exit from a lost position is to walk away is
  `learner-rating` §11.3's selection bias with a clock bolted on. Claimed here on run-schema lane 0.23
  (§3.4).
- 📊 **Native human ratings cannot be built on the shipped `rated_games` table.** `run_id` is
  `PRIMARY KEY` (`storage.ts:4567`) — one rated game per run — against one run with two learners, and
  `opponent_band` (`:4570`) and `engine_identity_digest` (`:4575`) are `NOT NULL` and presuppose a bot.
  On a `STRICT` table that is a rebuild, the `live-sources` class. [[D1414]] bought this and nothing
  had priced it. Handed to `learner-rating` as Discharge D2.
- 📊 **[[D1382]]'s criterion-7 finding is real and narrower than recorded.** Two of the six modules it
  named — `opponent-selector.ts` and `evidence-queue.ts` — contain **zero** `fetch` or `http`
  occurrences and consume injected sources; two more (`line-probe.ts:28`, `split-probe.ts:23`) declare
  *"DISPOSABLE research instrument … Not production."* on their own first line. The genuine production
  egress set is `tablebase.ts:30`, `import-source.ts:36`/`:72-74`, `corpus.ts:119`,
  `external-tts.ts:34` and `external-voice.ts:41`/`:65`. The repair is an allowlist set-equality, not a
  prohibition (§4.4).
- 📊 **The host/guest assistance asymmetry recorded in `ux-live-and-social.md` §7 F5 and
  `broadcast-and-teacher-surfaces.md` §3.4 does not hold between two seated players.** `seatedInContest`
  is produced (`service.ts:2059-2060`, tested at `teacher-surface.test.ts:165-167`) and consumed
  (`packages/runtime/src/assistance.ts:32-34`), so both seated players get identical `locked_off` /
  `locked_off` / `sight`. The residual is a **non-seated** host of a match between two other people —
  a narrower and different defect, routed as Discharge D9.
- 📊 **`league-as-return-loop` §4 item 6 is half true, and the mechanism is the board-control branch,
  not the table.** `service.ts:2124-2126` forces `countable: false` only where `#matchContext`
  resolves, and `#matchContext` returns `undefined` unless `boardControl === "match"` (`:2047-2049`).
  Two-human play contributes nothing to the return loop **in a native match**; an imported Arena leg
  counts today. Ruled an accident by [[D1415]] and repaired in §3.6.
- 🐞 **`docs/live-sessions.md:46-47` becomes wrong at this RFC's landing.** *"Native matches have no
  clocks, ratings, matchmaking pool, resignation event, or agreed-draw event"* — three of those five
  are built by this lane. Routed as Discharge D7 so the doc moves with the code rather than after it.
- 💡 **The `terms` object serves native and provider games with one shape.** The
  requested-versus-accepted split was invented for provider policy and turns out to be exactly what a
  native invitation needs, because an invitation carries terms before anyone has agreed to them. One
  column set, three origins (§3.1) — which is why the migration stays additive under a ruling that
  doubled the feature.
- 💡 **The bot event is deferred with its whole specification intact** ([[D1416]], §6), including the
  criteria repair that makes [[D1382]]'s mutually-unsatisfiable pair satisfiable: the refusal is
  asserted against a **derivation** and the played-game criteria supply their own two-profile
  catalogue. A deferral whose content lives nowhere is what [[D1230]] exists to prevent.

## Changelog

- 2026-08-24 — **rebuilt on [[D1414]], [[D1415]], [[D1416]] and [[D1481]].** The provider round trip is
  demoted from *the* mechanism for rated play to one import path among three (§4) and is not refused.
  Native human play gains terms, a projected honest label ([[D1472]], §3.2), the invitation lifecycle's
  missing producers ([[D1344]], §3.3), two new run events on `enforced-clocks`' mechanism (§3.4), the
  return-loop repair ([[D1415]], §3.6) and a creation surface that names its product ([[D1470]], §3.7).
  The false *"three prior rulings"* fence ([[D1400]]) is replaced by the ruling that actually exists.
  The bot event is specified in full and deferred with a home and an owner ([[D1416]], §6); the
  hosted-league refusal becomes deferral F4, re-homed by [[D1481]] as a round/pairing aggregate plus a
  declared result rather than an operator account. All three [[D1382]] criteria defects are repaired:
  criterion 12 is an allowlist set-equality over a derivation, criterion 14 names both operands, and
  §6's E1/E2 are jointly satisfiable. New findings: `rated_games.run_id` is a `PRIMARY KEY` against a
  two-learner run, and the F5 assistance asymmetry does not hold between two seated players. The public
  matchmaking pool is Open question 1, with both branches priced and neither chosen.
- 2026-08-23 — drafted as [[D1330]]'s rank-2 live debt against the hybrid; **returned, not amended**,
  by [[D1414]].
