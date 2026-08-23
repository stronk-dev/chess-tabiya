# RFC: social-play — the external round trip, the local bot event, and the boundary between them

- **Status:** draft — 2026-08-23
- **Author:** claude (social-play fork), from `design/research/social-play-and-event-boundary.md`
  and its owner handoff `planning/platform-alignment/social-play/o12-handoff.md`, with
  `design/research/league-as-return-loop.md` §§4, 6, 7 and
  `design/research/professional-workflow-conformance.md` §3 as the two documents that draw the
  adjacent boundaries this RFC must not cross
- **Created:** 2026-08-23
- **Design refs:** `design/03-product-breadth.md:87-88` (*"Arena and events: scheduled pack
  nights, invitations, cohorts, two-leg position matches, team relays, and later native
  matchmaking"* — the parked events row), `:53` (Position Arena's minimum), `:327` (B5's
  shipped scope, which already says *"Native matchmaking stays outside minimal-real scope by
  design"*); `design/05-in-run-experience.md:41` (*"Absence is stated, never simulated"*) and
  `:42` (session machinery *"may never alter what the run says happened on the board"*);
  `design/02-product-shape.md:98-99` (*"No operator account exists… never a privileged user"*)
- **Exploration gate:** the owner's live-games commission [[D947]] (*"where is the stuff like
  retrieving LIVE games… so streamers can cast or anyone can analyse?"*) and its boundary ruling
  [[D1272]] (*"streamer/caster modes is a separate thing in the webapp but those need to
  integrate with the live games mechanic…. shit can be separate but integrated"*), read under
  [[D1310]] — the drafting mandate is the owner's instruction, not [[D1093]]'s enumeration. The
  research arm is complete and its owner handoff is written: R17's three arms are `[V]`, and
  `o12-handoff.md` is marked *"ready for owner ruling"*. This RFC is the specification that
  handoff describes; §8 states exactly which of its seven points are assumed and which are asked.
- **Depends on:** `rfc/archive/social-match.md` (the shipped `match_states`, the two-leg Arena and
  `importLeg` — repaired here, not replaced); `rfc/archive/game-import-and-story.md` (`imported_games`,
  `parsePgn`, the import boundary); `rfc/archive/teacher-surface.md` (`classrooms`, `run_grants`);
  `rfc/archive/portable-account-data.md` (the export column lists that every new column must join);
  `rfc/learner-rating.md` (accepted — §7's label rule, §10a's cohort standing, §10a.2a's
  witnessed-play seam; **consumed, never re-decided**); `rfc/bot-policy.md` (implementing — the
  `BotPolicyDecisionRecord` and its unlanded 0.18 persistence seam); `rfc/bot-roster.md` (draft —
  the profiles without which an event has no entrants); `rfc/recorded-clocks.md` (draft — imported
  clock readings); `rfc/enforced-clocks.md` (draft — flag-fall terminal reasons)
- **Consumes without re-specifying:** `rfc/live-following.md` (the followed broadcast source and
  the [[D411]] liveness lock) and `rfc/casting.md` (the streamer surface). §6.3 states the seam
  between the two OAuth stories so the lanes cannot collide.
- **Parent / amends:** amends nothing. **Repairs** `archive/social-match.md`'s external handoff in
  place (§3), which that RFC shipped as transport and this one completes as identity.
- **Supersedes / superseded by:** —
- **Planning:** `planning/platform-alignment/social-play/`

```tabiya-claims
migration | position behind enforced-clocks | session_invitations and arena_legs gain provider identity, requested/accepted terms and retrieval state as additive ADD COLUMN with no CHECK, so no rebuild; bot_events and bot_event_entrants and bot_event_games (new tables recording one local bot event, its digest-pinned entrants and its child game runs)
```

## Summary

Three surfaces sit behind the word *social*, and today the product ships one of them well, one of
them as a string, and none of the third.

**Native private play ships and is honest in its documentation and silent in its interface.** A
friend match preserves authorship, possession, pause-by-consent and the whole rehearsal loop, and
deliberately has no clock, rating, pool, resignation verb or fair-play claim
(`docs/live-sessions.md:46-47`). The interface says none of that: `apps/web/src` contains **zero**
occurrences of *casual*, and zero of *no clock*. §5 gives the absence a rendered sentence, which
is `design/05:41` applied to the one surface that most invites the wrong assumption.

**External play ships as transport and is claimed as integration.** `SessionInvitation` stores an
arbitrary HTTPS string; `ArenaLeg` stores that string, a pasted PGN, a result and a local branch.
No provider, no challenge id, no game id, no accepted terms, no completion state, and no path that
observes the game finishing — [[D706]], measured. Worse than absent: the invitation's `state`
column declares `'accepted'` and `'revoked'` and **has zero producers**, and `App.svelte:1068`
renders that state to the host, so the one lifecycle the surface shows can never move. §3 and §4
specify the round trip that closes it: a typed envelope, a provider-agnostic adapter with Lichess
first, automatic attributed return when authorized, and the pasted PGN kept as the honest fallback.

**The local bot event does not exist, and cannot yet.** [[D708]] asked for *"a versioned event
envelope, not avatars around unlabelled Maia games"*. §7 specifies it — and finds that the
provenance half is already built and stronger than the ask: `BotPolicyDecisionRecord` carries
`profileId`, `profileVersion` **and `profileDigest`** (`bot-policy-catalog.ts:141-144`), so an
entrant can be pinned to a byte-identical declaration rather than to a version number somebody
remembered to bump. What is missing is the object that groups games into an event. It is also
gated by arithmetic rather than by opinion: `BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` is
a literal empty array at `bot-policy-catalog.ts:299`, so the entrant pool at HEAD is **0** and no
event can be constructed until `bot-roster` lands.

Around those three, §8 refuses six things **by name rather than by absence** — native
matchmaking, native human ratings, anti-cheat operation, hosted human tournaments, a hosted
league and an operator account — each with the evidence that refuses it and, where one exists,
the numeric trigger that would reopen it.

## Motivation

`rfc/live-following.md:74` fences this work out with a criterion:

> | Chat bridge, Twitch/YouTube/OAuth integration, editorial delay | B5's real work ([[D704]] measured all four absent). Refused for this RFC, fenced by criterion 12 |

A fence drawn by exclusion is a boundary with nothing on the other side of it. `casting.md` then
claimed the streamer half of that fence under [[D1272]], leaving the social half — the learner's
own game on someone else's board, and our own bots playing each other — named by two RFCs and
owned by neither. That is [[D1330]]'s rank-2 live debt, and this RFC is it.

The scope boundary is drawn by three prior rulings, all consumed rather than reopened:

- **[[D707]]/[[D709]] — the shape is hybrid.** Native private rehearsal matches are preserved;
  rated, clocked and public play is delegated to an optional chess-network adapter, Lichess
  first, returning attributed games automatically into the originating run.
- **[[D710]] — the substrate is already public.** The official Lichess OpenAPI declares
  rated/casual challenges, clocks, correspondence, arbitrary-FEN input, public seeks,
  event/game streams, export with clocks and opening, and bulk pairings. Rebuilding those
  natively closes no learning loop; exact identity and exact return do.
- **[[D708]]/[[D819]] — a bot event is a record, never a verdict.** Standings count what
  happened between named policy versions and may never assert strength.

What is **out of scope, each with a named home**, is in §9's Discharges table rather than in a
prose fence, so every exclusion carries an owner.

## Specification

### §1 — The boundary as it actually is, measured at HEAD

#### §1.1 The two session shapes are disjoint by construction, and this matters downstream

`storage.ts:2980` inserts a `match_states` row **only** when `boardControl === "match"`;
`storage.ts:2982-2984` seeds the two `arena_legs` rows **only** when `kind === "match" &&
boardControl !== "match"`. The two branches cannot both fire. This is the mechanical form of
[[D252]] (*"`kind === "match"` and `boardControl === "match"` are not interchangeable"*), and it
carries one consequence that the league research got half-right and this RFC needs exactly:

`service.ts:2117` rewrites the projection to force `countable: false` on the primary branch **only
when a `match_states` row exists**. `league-as-return-loop.md` §4 item 6 reports that as *"two-human
play contributes nothing to the return loop"*, which is true of a **native** match and **false of an
Arena leg** — an Arena session has no match state, so its imported branch is countable today. The
external round trip therefore inherits a working return path and does not have to build one. Open
question 3 asks whether it *should* keep it once the games are rated elsewhere.

#### §1.2 What the current external handoff stores, exhaustively

`arena_legs` (`storage.ts:4059-4069`) has eight columns: `session_id`, `leg`,
`reference_player_handle`, `external_challenge_url`, `pgn`, `result`, `branch_id`, `imported_at`.
Exactly **two** carry a `CHECK` (`leg`, `result`); the other six do not. That count is the reason
§3.2's columns are additive: SQLite's `ALTER TABLE … ADD COLUMN` cannot edit an existing `CHECK`
on a `STRICT` table — which is why `live-sources` correctly claims a rebuild for
`imported_games.source_kind` — but adding an unchecked nullable column needs no rebuild at all.
Every column §3.2 adds is nullable and unchecked, and its vocabulary is enforced by the writer and
asserted by a test, matching how `branch_id`, `pgn` and `imported_at` already behave.

#### §1.3 The three defects this RFC repairs, each verified

| # | defect | evidence | repaired by |
|---|---|---|---|
| 1 | **Transport is stored where identity is needed.** No provider, challenge id, game id, accepted terms, retrieval state or source node | [[D706]]; `live-types.ts:79-99`; `storage.ts:4059-4069` | §3 |
| 2 | **The invitation lifecycle has a start state and no transitions.** `'open'` is written by the only producer (`storage.ts:3222`); `'accepted'` and `'revoked'` are `CHECK` values with **zero** producers across `apps/server/src` and `apps/web/src`, and `App.svelte:1068` renders the dead state to the host | grep: two declaration sites, no writer | §3.3 |
| 3 | **Native private play never states its absent guarantees in the interface.** `docs/live-sessions.md:46-47` states them; `apps/web/src` contains **0** occurrences of *casual* and **0** of *no clock* | grep over `apps/web/src` | §5 |

### §2 — The three authorities, and the one sentence the adapter may never say

`social-play-and-event-boundary.md` §3 divides trust three ways, and this RFC adopts the division
as a normative rule rather than a description:

1. **Tabiya** owns the source position, consent, the local run, branch and review identity, and
   its own evidence contract.
2. **The chess network** owns its clock, pairing, rating, result and enforcement labels.
3. **The learner** authorizes provider access and may revoke it.

**The normative consequence, stated once and enforced by criteria 9 and 10:** the product may say
*which provider reported which result under which terms*. It may never render *"Tabiya verified
this game"*, may never present a provider's evaluation or accuracy figure as a Tabiya grade, and
may never move a provider's rating number into `learner_ratings`. This is law 8 applied to a
number we did not compute: **an external game's result is a fact; its rating implication is the
adapter's, not ours.**

Provider analysis arriving inside an exported PGN is a special case of the same rule and is
handled at the boundary by §4.4, not by policy prose.

### §3 — The external round-trip envelope

#### §3.1 The envelope, normative

The minimum identity R17's harness tested and this RFC adopts, with one field added (`sourceNodeId`
— see below) and one split (requested vs accepted terms):

```text
source:    runId + sourceNodeId + packId?
provider:  providerId + challengeId + gameId? + gameUrl?
terms:     requested  { rated, clock: {limitSeconds, incrementSeconds} | null, variant }
           accepted   { rated, clock: {limitSeconds, incrementSeconds} | null, variant } | null
return:    importedRunId + branchId + result + retrievalState + witnessClass
```

Three rules give the shape its teeth.

**(a) An opaque link is a fallback, not a completed round trip.** A leg whose `providerId` is
null is *manual transport* and must be labelled as such; a leg that names a provider but carries
no `gameId` is *incomplete* and must not be described as returned. The harness already encodes
this: `validAdapterEnvelope` rejects the same envelope with `gameId: ""`
(`tools/r17-social-play-harness/social-play.test.ts`).

**(b) Only the accepted terms may be displayed.** `social-play-and-event-boundary.md` §1 warns
that *"rated arbitrary-FEN play may be constrained by provider policy"* and that an adapter must
*"preserve and render the provider's accepted response rather than infer terms from the
request"*. The two are therefore separate stored fields, and the render path reads
`terms.accepted` only. Where `accepted` is null, the surface says the terms are not yet known —
it does not fall back to what we asked for. Criterion 5.

**(c) `sourceNodeId` is stored even though v1 constrains it.** `importLeg` anchors both legs to the
run root (`canonicalRunStart`, `live-session.ts:243`; leg 1 additionally requires an untouched run,
`:246`). The provider substrate accepts an arbitrary FEN ([[D710]]), so the constraint is ours and
temporary. Persisting the node now records the constraint instead of assuming it, and makes
challenging from a mid-run node a later change to one validator rather than a schema migration.

#### §3.2 Schema — additive, no rebuild

`session_invitations` gains, all nullable, all unchecked:

| column | holds |
|---|---|
| `provider_id` | the adapter's id; `NULL` means manual transport |
| `provider_challenge_id` | the provider's challenge identity |
| `terms_requested` | JSON: the terms we asked for |
| `terms_accepted` | JSON: the terms the provider reported back; `NULL` until it does |

`arena_legs` gains, all nullable, all unchecked:

| column | holds |
|---|---|
| `provider_id` | as above |
| `provider_challenge_id` | joins the leg to its invitation's challenge |
| `provider_game_id` | the provider's game identity |
| `provider_game_url` | the canonical provider URL, distinct from the pasted `external_challenge_url` |
| `source_node_id` | §3.1(c) |
| `terms_accepted` | JSON, provider-reported |
| `retrieval_state` | §3.3's vocabulary |
| `witness_class` | §6.1's two values, or `NULL` |

`external_challenge_url` is **kept unchanged on both tables**. It is the fallback path's storage
and the migration's compatibility guarantee: every existing row remains valid and reads as manual
transport.

**Every new column joins `ACCOUNT_EXPORT_COLUMNS`** (`account-data.ts:141`) in the same commit.
Criterion 12 makes that self-enforcing rather than remembered.

#### §3.3 The invitation and retrieval state machines

`session_invitations.state` gains its missing producers — no schema change, the `CHECK` already
admits all three values:

```text
open ──(provider reports the challenge accepted, or a named Tabiya handle joins)──▶ accepted
open ──(host revokes, or the provider reports declined/expired)──────────────────▶ revoked
```

`arena_legs.retrieval_state` is a new five-value vocabulary, enforced by the storage writer:

```text
awaiting_acceptance ─▶ playing ─▶ finished ─▶ imported
        │                 │           │
        └────────────┴───────────┴────▶ unreachable
```

`unreachable` is reachable from every non-terminal state and is **not** an error state: it means
the provider could not be observed and the manual PGN path remains open. `imported` is terminal
and is the only state in which `branch_id` is non-null. A manual-transport leg (no `provider_id`)
occupies `awaiting_acceptance` until it is imported, and skips the two middle states — because we
genuinely do not know.

#### §3.4 The adapter interface

One provider-agnostic interface, one implementation:

```ts
export interface ChessNetworkAdapter {
  readonly providerId: string;
  createChallenge(request: ChallengeRequest): Promise<ChallengeIdentity>;
  observe(identity: ChallengeIdentity): Promise<ProviderGameState>;
  exportGame(gameId: string): Promise<string>;
}
```

Four rules bind it:

1. **It is the only code permitted to speak to a provider.** `LiveSessionService` consumes its
   typed result and never a URL. Criterion 7 asserts this at the module boundary.
2. **Requests to one provider are serialized, and a 429 stops that provider for 60 seconds.**
   The Lichess API tips are explicit — *"Only make one request at a time"*, and wait one minute
   after HTTP 429 (`social-play-and-event-boundary.md` §3). This is the adapter's own
   correctness, not platform operations, so it is specified here.
3. **It never grades.** The adapter returns identity, terms, state and PGN bytes. It has no
   return type that can carry an evaluation, a rating or an accuracy figure. §2's rule is
   enforced by the type, not by review.
4. **v1 uses named and open challenges only.** Public seeks (`apiBoardSeek`) and bulk pairings
   exist ([[D710]]) and are Discharge D7 — they are opponent *discovery*, which is a different
   product decision from opponent *connection*.

#### §3.5 Return, and its verification

When authorized, the adapter observes the game to completion and imports the PGN into the
originating run as a branch — the path `importLeg` already walks. Three verifications, two of
which already ship:

- **Root identity** — the PGN's start position must equal the source node's canonical start.
  Ships: `ARENA_ROOT_MISMATCH` (`live-session.ts:243`).
- **Single import** — `saveArenaImport` updates `WHERE branch_id IS NULL` (`storage.ts:3252-3253`),
  so a duplicate return is refused by the write, not by a check-then-act race. Ships.
- **Game identity — new.** When `provider_game_id` is non-null, the returned PGN must carry that
  same game identity, and a mismatch throws `ARENA_GAME_MISMATCH`. This is the concrete repair for
  [[D706]]'s *"no verification"*: today any PGN with the right root imports as any leg.

If completion cannot be fetched, the leg sits in `unreachable`, the surface says the game is
awaiting import, and the pasted PGN route still works. If the provider is unavailable entirely,
native friend matches and solo rehearsal are untouched — the adapter is optional breadth over a
complete self-hosted core, and criterion 8 asserts it by running the native path with the adapter
module absent.

#### §3.6 What the provider costs us operationally, priced here and owned elsewhere

Pricing it rather than waving at it, per [[D1230]]. The adapter needs: per-learner OAuth token
storage with the exact scopes `challengeCreate`/`boardGameStream`/`gamePgn` require; refresh and
revocation, including the learner revoking at the provider without telling us; one global event
stream per account rather than per session; reconnect and idempotency across a restart; 429
backoff (§3.4 rule 2); provider deletion propagating into our export and delete paths; and
provider-health surfacing that distinguishes *"we cannot reach them"* from *"the game has not
finished"*.

Of those, **§3.4 rule 2 and §3.3's `unreachable` state ship in this RFC** because they are the
adapter's own correctness. **Token custody, scope grants, refresh/revocation and health reporting
are Discharge D1**, owned by `planning/platform-alignment/release-platform/` — the F12 contract
that already owns secrets, backup and the deployment floor. This RFC does not implement an OAuth flow and does not
pretend the flow is small.

### §4 — What the import boundary must strip, and what it must keep

#### §4.1 Third-party grades

[[D410]] applies to anything imported back: a provider's inline `{ [%eval …] }` and
`{ Blunder. Rf8 was best. }` are *another product's verdict on a move entering our corpus as
authored-looking text*. `import-source.ts:73` already requests `evals=false&literate=false`, which
[[D410]] correctly calls *"reliance on an upstream default we do not control, with no test"*.
The adapter's `exportGame` therefore **asserts** the returned bytes carry no `%eval` and no
comment annotations, and strips them if they do. Criterion 10; the assertion, not the hope.

#### §4.2 Clocks, kept

`[%clk]` readings are **not** annotations in [[D410]]'s sense — they are a record of what the
player had, which is the same class as the move itself. `recorded-clocks` owns their typed
storage (`imported_games.clocks`), and an externally-returned game is exactly the case that RFC
was written for. This RFC adds no clock storage of its own; it records the *accepted* clock terms
(§3.1) and hands the per-ply readings to that lane.

**One precision the adapter must not inherit:** the shipped own-game export requests
`clocks=false` alongside `evals=false&literate=false` (`import-source.ts:73`), so a returned
clocked game would arrive today with its readings discarded at the request rather than at the
parser. The adapter's `exportGame` requests `clocks=true`, and criterion 10's stripping assertion
is scoped to annotations and never to `[%clk]`. Discharge D10.

#### §4.3 Termination, kept and attributed

A provider game can end by flag-fall, resignation or abandonment — none of which our native match
can express (`docs/live-sessions.md:46-47`). `enforced-clocks` is already widening
`rated_games.terminal_reason` for flagging. An externally-returned game records the provider's
stated termination verbatim, attributed to the provider, and **derives nothing from it**: we do
not infer that a flagged game was lost on the board, and we do not convert a resignation into an
outcome grade. Discharge D11.

### §5 — The honest label for native private play

[[D707]] is measured and its remedy is one rendered sentence. A live session of `kind === "match"`
renders, in its header, a fixed non-configurable line:

> **Casual private match** · no clock · no rating · no fair-play enforcement

An Arena session that names a provider renders instead the **provider-accepted** terms and the
provider's name — *"Rated · 10+5 · reported by Lichess"* — and where `terms_accepted` is null,
*"terms not yet confirmed by the provider"*. Never the requested terms (§3.1(b)).

This is `design/05:41` applied to the surface that most invites the wrong inference, and it is
also the honest half of `professional-workflow-conformance` §2's accepted limitation: we can say
what we do not enforce; we cannot stop a player from cheating on themselves, and saying the first
thing plainly is what makes the second thing survivable.

### §6 — Seams consumed, not re-decided

#### §6.1 Witnessed play — [[D946]], and social play is where the word becomes real

`learner-rating` §10a.2a pins the seam and is explicit about its limits: *"the ruling reserves the
seam; it commissions no table, no route, no validator"*, and *"nothing is implemented until a real
cohort exists"*. **This RFC commissions none of those either.** What it contributes is the fact
the future predicate will have to read, and the vocabulary for it.

A game reaching a standing can have been observed in exactly two ways, and they are not the same
fact:

| `witness_class` | means | already recorded by |
|---|---|---|
| `tabiya_session` | the game was played inside a live session that held at least one spectator `run_grant` at the time of the sealed result | shipped `run_grants` / live-session machinery — **no new mechanism**, exactly as §10a.2a requires |
| `provider` | the game was played on a named chess network, which reported the result under stated terms | §3's provider identity — **this RFC's contribution to the seam** |

The distinction is the point. *We watched it* and *someone else says it happened* are different
warrants, and a cohort that one day requires witnessed play must be able to choose between them
rather than be handed a boolean that silently merges them. **Which values a cohort's predicate
admits is not decided here** — that is `learner-rating`'s, as Discharge D6. The column is written
because the fact is free to record at the moment the game returns and impossible to reconstruct
afterwards.

#### §6.2 The cohort standing — this RFC adds nothing to it

`learner-rating` §10a is accepted: one standing per classroom, entries created only by their
subject, ranked by results and **grouped — never ranked — by rating**. Social play produces
results between learners, so the tempting move is to route them into it. This RFC refuses, on
§2's rule: an external rated game's rating meaning belongs to the provider, and our
`learner_ratings` calibration is engine-anchored end to end. Merging a Lichess number into it
would manufacture a comparison neither instrument supports. **No route in this RFC writes
`standing_members`, `learner_ratings`, `rated_games` or `learner_marks`.** Criterion 11.

There is a real opportunity on the other side of that refusal and it belongs to
`learner-rating`, not here. Its open question 6 calls the human anchor *"the single
highest-value unrun experiment this RFC creates"*, and `league-as-return-loop` §C7 shows why the
external round trip is the cheapest instrument for it: a returned game carries the learner's
provider rating, the accepted terms, and a whole unassisted game against a human of known
strength — better-controlled data than the fixed-schedule experiment that RFC proposes to run.
Discharge D4 routes it there rather than building a second rating story here.

#### §6.3 Two OAuths, two lanes — the collision this section exists to prevent

`live-following.md:74` fences out *"Chat bridge, Twitch/YouTube/OAuth integration"*, and
`professional-workflow-conformance` §3 describes the vote adapter's provider bridge. Those are a
**chat** credential for a **streaming platform**, owned by the casting lane. This RFC's OAuth is a
**chess-network** credential for a **game provider**. They share a word and nothing else: different
provider, different scopes, different failure modes, different surface. Neither lane may implement
the other's, and Discharge D1's operational contract covers both under one secrets story without
merging them.

Likewise on objects: a followed broadcast game is *someone else's game that we watch*; an
adapter game is *the learner's own game on someone else's board*. `live-following` owns the
first, this RFC owns the second, and no code path converts one into the other.

#### §6.4 The events row — [[D412]]'s disambiguation, scoped

`design/03:87-88`'s events row lists *"team relays"* among *"scheduled pack nights, invitations,
cohorts, two-leg position matches, team relays, and later native matchmaking"*. Two independent
agents have now derived from scratch that this means a **roster with a calendar**, and that
external tournament relay is a different object entirely ([[D412]]).

For this RFC's scope the clause is normative: **team relays are not in it, and external relay is
`live-sources`/`live-following`'s.** Amending the design sentence itself is law 5's, and it is
Discharge D5 — routed to OWNER through `planning/intent-amendment-handoff.md`, not written here.

### §7 — The local bot event

#### §7.1 The provenance half already exists, and is stronger than the ask

[[D708]] asks for *"event id, exact entrant policy ids and versions, every child game run, result,
Review target"*. Measured at HEAD, `BotPolicyDecisionRecord` already carries `profileId`,
`profileVersion` **and `profileDigest`** (`bot-policy-catalog.ts:141-144`), written from
`input.profile` at both emission sites (`:467`, `:525`). The digest is the stronger pin: a version
number records what someone remembered to bump, a digest records what the declaration actually was.

Entrants therefore pin **all three**, and the digest does real work: if an entrant's digest at game
time differs from the digest recorded at entry, the game is **voided and recorded as voided**, not
silently replayed under the new declaration. That is the mechanical form of *"exact policy
versions"*.

One dependency is honest: that record is computed but **not yet persisted** — `bot-policy`'s own
Status line says so, and its persistence is the claimed 0.18 run-schema seam. Per-move policy
provenance for event games rides that seam; Discharge D3.

#### §7.2 The event envelope

```text
bot_events            eventId, format, createdAt, closedAt?
bot_event_entrants    eventId, entrantId, profileId, profileVersion, profileDigest
bot_event_games       eventId, gameNo, runId, whiteEntrantId, blackEntrantId,
                      result, reviewRunId, voidReason?
```

`format` is a closed two-value vocabulary in v1: `round_robin` and `double_round_robin`. Knockouts
need seeding, and seeding is an ordering by strength — which §7.3 refuses. If a knockout is ever
wanted it needs a seeding rule that is not a strength claim, and that is a new question, not a
new enum value.

**Every child game is an ordinary run.** No parallel truth model, no event-specific event types,
no bespoke board. Review, story, evidence and the observation ledger consume an event game exactly
as they consume any other run — which is what makes the whole feature cheap, and is the property
criterion 15 asserts by running Review over an event game with no event-aware code path.

#### §7.3 Standings are arithmetic, and say so

A standings table is permitted as deterministic arithmetic over recorded results: games, wins,
draws, losses, points. It is rendered beneath one fixed sentence:

> These are recorded results between named policy versions. They are not a strength
> measurement, and no entrant's rating is derived from them.

That is [[D819]] as a rendered constraint rather than a footnote: no vendor has ever validated a
weakened-bot label against humans, so a table that orders our own bots by points must not be read
as ordering them by strength. **No route in this RFC writes any rating from an event result**, and
criterion 11 covers event games alongside external games in the same assertion.

#### §7.4 The gate is arithmetic, not opinion

`BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` — a literal empty array at
`bot-policy-catalog.ts:299`. The entrant pool at HEAD is **0**, and `bot_event_entrants` requires
at least 2, so the event is unconstructible until `bot-roster` populates the catalogue. This
restates the R17 dossier's *"waits on O8/F8"* as a number a test can check, and criterion 14
asserts the refusal rather than the wait: constructing an event with fewer than two distinct
digest-pinned entrants throws.

### §8 — Refused, by name

Each is refused **by name rather than by absence**, with the evidence that refuses it and, where
one exists, the trigger that would reopen it. This is `learner-rating` §AC-1's pattern, adopted
because an unnamed refusal is [[D1320]]'s unruled refusal.

| # | refused | why | reopen trigger |
|---|---|---|---|
| 1 | **Native public matchmaking / a seek pool** | delegated by [[D709]]; the substrate exists at the provider ([[D710]]) and `design/03:327` already says native matchmaking is outside minimal-real scope | Discharge D7 — discovery through the adapter is a smaller question and is asked separately |
| 2 | **Native ratings for human-vs-human play** | §2 and §6.2 — the rating implication of a human game is the venue's | a validated human anchor (Discharge D4) changes what our own number means, not whose number a provider game carries |
| 3 | **Anti-cheat, fair-play adjudication, reporting and blocking** | provider venue; and `docs/live-sessions.md:132-138` is explicit that we do not prevent a host cheating on themselves. §5's label is the honest alternative | none stated — this is an operating system, not a feature |
| 4 | **Hosted human tournaments** | operations, moderation, population and integrity costs, none of which are frontend work | none stated |
| 5 | **A hosted league** | `league-as-return-loop` §7: import-don't-host, on **two** independent grounds — the feasibility ceiling (§C6: a league's minimum input is a population *with a bench*; Season 49 fields 352 rostered plus 121 reserves) and, more sharply, §5.4's randomised evidence **against the obligation mechanism itself** (n ≈ 250,000, P = 0.115 on completion) | stated as a number, not a feeling: enough learners to fill one section **with a bench**. Below that the question is not open |
| 6 | **An operator or tournament-director account** | `design/02:98-99`, owner ruling — administrative capability lives in configuration, *"never a privileged user"*. Every league obligation is an act by a privileged human, which is why refusal 5 follows from this one | if ever revisited, `league-as-return-loop` §C5 names the surviving shape: per-league delegated capability on the shipped run-grant model, **not** a platform operator |
| 7 | **Relaying or organising a broadcast** | [[D709]] as `live-following` §6 states it — we consume, we do not relay-operate. Restated here so this RFC is not read as reopening it | none |
| 8 | **Raw chat ingestion, and any provider evaluation rendered as a Tabiya grade** | `professional-workflow-conformance` §6; law 8; §2's rule and §4.1's assertion | none |
| 9 | **Federation** — cross-instance discovery, portable identity, federated moderation | R19/O14, post-1.0 by the dossier's §5 and the handoff's point 5 | a separate promotion ruling, which the dossier already requires |

Refusals 1–4 and 9 are the o12 handoff's points 3 and 5 adopted as written. Refusals 5 and 6 go
beyond it, on evidence the handoff did not have: `league-as-return-loop` landed after it.

## Deviations from design

1. **`design/03:87-88` promises *"later native matchmaking"* in the events row; §8 refuses it for
   1.0.** Recorded as a deviation rather than resolved silently. The word *later* arguably already
   concedes it, and `:327` says outright that native matchmaking stays outside minimal-real scope
   — but the events row is the sentence a reader reaches first, so the divergence is named here.
2. **`design/03:87-88`'s *"team relays"* is left unbuilt and, per §6.4, unowned by this RFC.**
   The roster-with-calendar reading is [[D412]]'s and is not yet in the design text; Discharge D5
   routes the clause to the owner rather than this RFC writing intent.
3. **No other divergence.** The hybrid boundary, the honest-absence label and the
   record-not-verdict rule are `design/00`, `02` and `05` applied, not amended.

## Acceptance criteria

Each names the wrong implementation that would otherwise pass.

1. **A leg that names a provider but carries no `provider_game_id` is not describable as
   returned.** The projection reports it as incomplete and the surface says so. *Wrong impl that
   passes without this:* one that treats a stored challenge URL as a completed integration —
   which is exactly today's behaviour.
2. **The invitation state machine has producers for all three values**, asserted as three
   transitions: `open → accepted`, `open → revoked`, and `accepted` not reachable from
   `revoked`. *Wrong impl:* adding a setter and never calling it, which is the current defect
   with extra code.
3. **`ARENA_GAME_MISMATCH` throws when a returned PGN's game identity differs from the leg's
   `provider_game_id`**, and does **not** throw when `provider_game_id` is null (the manual
   path). Two arms; the second is the regression guard. *Wrong impl:* one that hardens the
   provider path and breaks the fallback.
4. **A second import into an imported leg is refused by the write.** Asserted by racing two
   imports and observing one `INVALID_REQUEST`, not by reading `saveArenaImport`'s SQL. *Wrong
   impl:* a check-then-act guard that passes single-threaded.
5. **The render path reads `terms_accepted` and never `terms_requested`**, asserted by storing
   divergent values and checking the API response carries only the accepted pair, plus a third
   case where `terms_accepted` is null and the response says the terms are unconfirmed. *Wrong
   impl:* one that falls back to the request, which silently asserts a rated game we never got.
6. **`retrieval_state` reaches `unreachable` from each of the three non-terminal states**, and
   `branch_id` is non-null **iff** the state is `imported`. *Wrong impl:* an enum with no
   transition test, where a leg can be imported and still read as playing.
7. **No module outside the adapter issues a provider request.** Asserted by a grep-able boundary
   test over `apps/server/src` for provider hostnames and `fetch` to non-local URLs. *Wrong
   impl:* a convenience call in the service that works and quietly duplicates the rate limiter.
8. **The native path is complete with the adapter absent.** A native friend match, its pause,
   rehearsal and comparison all pass with the adapter module unregistered. *Wrong impl:* one
   whose session projection throws when no provider is configured.
9. **No rendered surface in this RFC contains a verification claim about a provider game.**
   Asserted against the exported copy constants, not against markup. *Wrong impl:* a helpful
   *"verified on Lichess"* badge.
10. **A returned PGN carrying `%eval` or comment annotations is stripped, and the stripping is
    asserted on the adapter's output** rather than trusted to the request parameters — while
    `[%clk]` readings **survive**, which is the same assertion's second arm. *Wrong impl:*
    [[D410]]'s exact finding — relying on `evals=false&literate=false`, an upstream default we do
    not control, with no test; or the mirror failure, inheriting `import-source.ts:73`'s
    `clocks=false` and discarding the clocks §4.2 hands to `recorded-clocks`.
11. **This RFC writes no rating, standing or mark.** A single assertion covering both new paths:
    after an external game returns **and** after a bot event completes, `learner_ratings`,
    `rated_games`, `rating_periods`, `standing_members` and `learner_marks` are byte-identical to
    their pre-state. *Wrong impl:* one that counts an external rated game as a rated game because
    the word matches.
12. **Column set-equality against a derivation, not a hand-count** ([[D1240]]): a test derives
    `PRAGMA table_info` for `session_invitations`, `arena_legs`, `bot_events`,
    `bot_event_entrants` and `bot_event_games`, and asserts each is **set-equal** to its
    `ACCOUNT_EXPORT_COLUMNS` entry. No integer is asserted. *Wrong impl:* a column added to the
    schema and forgotten in the export, which is silent data loss on account export and is the
    failure this criterion exists to make impossible.
13. **The migration adds no `CHECK` and performs no rebuild.** Asserted by comparing the
    `sqlite_master` SQL for `session_invitations` and `arena_legs` before and after, and
    confirming the `CHECK` count on `arena_legs` is unchanged at **2** (`leg`, `result`). *Wrong
    impl:* a well-meaning rebuild that re-enters `live-sources`' STRICT-table cost for no reason.
14. **An event with fewer than two distinct digest-pinned entrants throws**, and — at HEAD, with
    `compileBotPolicyCatalog([])` — the constructible-entrant count is **0**, so the refusal is
    the only reachable outcome until `bot-roster` lands. *Wrong impl:* one that admits the same
    profile twice, or that defaults a missing digest to the empty string, which is precisely the
    defect R17's harness caught in itself before publishing.
15. **A child game of an event is an ordinary run.** Review, story and the evidence path all
    execute over it with no event-aware branch, asserted by running them against a game run whose
    event rows have been deleted. *Wrong impl:* a parallel tournament projection that happens to
    look the same.
16. **A digest mismatch at game time voids the game and records `void_reason`**, rather than
    playing it under the current declaration. *Wrong impl:* one that re-reads the profile by id.
17. **The standings sentence is present in the standings payload itself**, not only in the
    template that renders it. *Wrong impl:* copy that a second client can omit.
18. **The `kind === "match"` header renders the casual-absence line**, and an Arena session with a
    provider renders provider-attributed accepted terms instead. Both asserted at the API
    boundary. *Wrong impl:* a CSS-hidden label, or one that renders on the host's view only.
19. **`register-check` is green with this RFC active**, and its `tabiya-claims` block joins the
    `rfc/README.md` migration Live-claims row byte-exactly.
20. **Scope fence:** a grep-able assertion that this RFC's landing adds no `WorkflowContextId`, no
    `SessionKind`, no `RunRole`, no evidence kind and no `public_tokens` scope. *Wrong impl:* one
    that introduces a `tournament` session kind, which would break `presets.ts`'s 28-admitted /
    12-refused grid the same way a ninth context does, and would quietly reopen refusal 4.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | OAuth token custody, scope grants, refresh and revocation, provider health reporting, and provider-deletion propagation — priced in §3.6, implemented in the platform contract that already owns secrets and backup | `planning/platform-alignment/release-platform/` | that contract's next revision | |
| D2 | The bot event has **0** constructible entrants at HEAD (`bot-policy-catalog.ts:299`) and cannot run until the catalogue is populated | `bot-roster.md` | that RFC's landing commit | |
| D3 | Per-move policy provenance for event games rides the unlanded 0.18 record-persistence seam | `bot-policy.md` | that RFC's implementing commit | |
| D4 | The human-anchor experiment — external rated games against known provider ratings, the cheapest instrument for `learner-rating`'s highest-value unrun experiment (§6.2) | `learner-rating.md` | that RFC's next amendment | |
| D5 | The `design/03` events-row clause disambiguating *team relays* from external relay ([[D412]], §6.4) — law 5 work, not this RFC's | OWNER | `planning/intent-amendment-handoff.md` | |
| D6 | Which `witness_class` values a cohort's witnessed-play predicate admits (§6.1) | `learner-rating.md` | §10a.2a's successor, when a real cohort exists | |
| D7 | Opponent **discovery** through the adapter — public seeks and bulk pairings exist at the provider and v1 uses named/open challenges only (§3.4 rule 4) | `planning/platform-alignment/social-play/` | a successor drafted from this lane | |
| D8 | The hosted league, deferred on two independent grounds with a numeric reopen trigger (§8 refusal 5) | `planning/platform-alignment/social-play/` | the trigger in §8, or an owner ruling | |
| D9 | `docs/live-sessions.md` and `docs/account-data-lifecycle.md` updates for the provider columns, the state machines and the casual label | codex | this RFC's implementing commit | |
| D10 | Per-ply clock readings from a returned external game (§4.2) | `recorded-clocks.md` | that RFC's implementing commit | |
| D11 | Provider-stated termination reasons for returned games (§4.3) | `enforced-clocks.md` | that RFC's implementing commit | |

## Open questions

1. **Does a rematch chain become new legs or a new session?** The provider exposes a rematch
   policy ([[D710]]); the Arena has exactly two legs and its two-leg shape is the point — the same
   position from both sides. Recommendation: **a new session**, because a rematch is a third game
   and a third game is not the two-leg comparison. Flagged because the opposite choice is cheap
   now and expensive after the first stored chain.
2. **May a challenge be issued from a mid-run node in v1?** §3.1(c) stores the node but v1
   constrains it to the root, following `importLeg`'s current anchor. Recommendation: **keep the
   constraint for v1** — a mid-run challenge changes what an Arena leg *is* — and note that the
   stored field makes lifting it a validator change.
3. **Should a returned external rated game count toward `/learn` progress?** §1.1 establishes that
   it does today, by the accident that Arena sessions have no `match_states` row. That is not a
   decision anyone made. Recommendation: **yes, keep it countable** — a whole unassisted game
   played from our own position is stronger evidence of return than a drill attempt — but it is
   flagged because it changes what a `/learn` count means, and because the native match's
   `countable: false` then looks like the inconsistency rather than this.
4. **Does an `unreachable` leg ever expire?** A challenge nobody accepts sits in
   `awaiting_acceptance` forever and renders as pending. Recommendation: no automatic expiry, an
   explicit host revoke — §3.3 already gives `revoked` its producer, and an auto-expiry is a
   second clock with nothing to check it.

## Ledger rows

Proposed; ids assigned at landing. Ledger head was **D1332** at drafting.

- 🐞 **`session_invitations.state` is rendered to the host and can never move.** Two declaration
  sites, zero producers for `accepted` and `revoked`, and `App.svelte:1068` prints the value. This
  is worse than a missing feature: it is a lifecycle the interface promises and the server cannot
  deliver. Repaired by §3.3.
- 🐞 **Native private play never states its absent guarantees in the interface** — `apps/web/src`
  contains **0** occurrences of *casual* and **0** of *no clock*, while `docs/live-sessions.md:46-47`
  states them plainly. The honest-absence invariant is documented and unrendered. Repaired by §5.
- 📊 **[[D708]]'s provenance ask is already met and exceeded in code**: `BotPolicyDecisionRecord`
  carries `profileDigest` beside `profileId`/`profileVersion` (`bot-policy-catalog.ts:141-144`).
  The missing object is the event that groups games, not the identity of the entrants.
- 📊 **`league-as-return-loop` §4 item 6 is half true**: `service.ts:2117` forces
  `countable: false` only where a `match_states` row exists, and Arena sessions never have one
  (`storage.ts:2980` vs `:2982`). Two-human play contributes nothing to the return loop **in a
  native match**; an imported Arena leg counts today. Open question 3 asks whether that accident
  should become a decision.
- 💡 **Two OAuth stories share a word and nothing else** (§6.3) — a chat credential for a
  streaming platform (casting's) and a chess-network credential for a game provider (this RFC's).
  One clause now saves the collision later, which is [[D412]]'s lesson applied before the fact.

## Changelog

- 2026-08-23 — drafted as [[D1330]]'s rank-2 live debt, closing the boundary
  `live-following.md:74` fenced out by criterion. Provider identity specified as an additive,
  rebuild-free repair of the shipped Arena tables (§3.2, criterion 13); the dead invitation
  lifecycle given its producers (§3.3); game-identity verification added as the concrete
  [[D706]] repair (§3.5); the bot event specified and found to be gated by an arithmetic **0**
  rather than by opinion (§7.4); the witnessed-play seam given its two witness classes without
  commissioning the table [[D946]] withheld (§6.1); and nine refusals named with their evidence,
  two of them going beyond the o12 handoff on research that landed after it (§8).
