# O12 decision memo — human play, adapters and bot events

**Prepared:** 2026-08-23 · **For:** owner · **Queue row:** `planning/platform-alignment/decision-queue.md:49`
**Handoff:** `planning/platform-alignment/social-play/o12-handoff.md` (written before `rfc/social-play.md`)
**Landed since the handoff:** `rfc/social-play.md` (draft, commit `4dbb624`, 2026-08-23)

> **Read this first.** Two things landed after the handoff was written and both change the shape of
> the question. One of them — your own ruling [[D1272]] — already answers a third of it. The other —
> `rfc/social-play.md` — has already *specified* most of the rest, and in two places has **assumed
> the ruling this memo is asking for**. That last part is why the memo still exists: a draft RFC is
> currently standing on an answer nobody gave.

---

## 1. The question

**When someone wants to play a real human at chess inside Tabiya, do we build that ourselves, hand
them off to Lichess and take the game back, or just link out and stop?**

---

## 2. What you have already said

### 2.1 [[D1272]] — recorded verbatim at `design/BACKLOG.md:457`

> *"well a live game is just a live game... you can just open it like an imported game right but it
> updates live... streamer/caster modes is a separate thing in the webapp but those need to
> integrate with the live games mechanic.... shit can be separate but integrated."*

It was ruled against B5/casting, not against O12 — but it is load-bearing here, because it fixes the
**object model** that O12's adapter has to live inside. Precisely, it settles:

| O12 sub-question | settled by [[D1272]]? |
|---|---|
| What is a game that came from somewhere else? | **Yes.** An ordinary imported game/run. Not a new object, not a parallel truth model. `rfc/social-play.md:483` (*"Every child game is an ordinary run"*) and its §3.5 return path are that ruling applied. |
| May the social surface be built separately from casting/live-following? | **Yes — and it must be.** *"separate but integrated."* `rfc/social-play.md` §6.3 is the seam clause; `casting.md:13` and `live-following.md` cite the same sentence. |
| Do we build native ratings / pool / tournaments? | **No — untouched.** [[D1272]] is about *someone else's game that we watch*. O12 is about *the learner's own game on someone else's board*. `rfc/social-play.md:431-433` states the two are different objects and no path converts one into the other. |

**So [[D1272]] answers the architecture half and none of the scope half.** It is not a reason to skip
this ruling, and asking you to re-rule it would be [[D1150]]'s failure. This memo does not re-ask it.

### 2.2 Rulings that license the work but do not answer it

- **[[D947]]** (`design/BACKLOG.md:335`) — your live-games commission; opened the lane.
- **[[D1093]]** / **[[D1310]]** (`:493`, `:1613`) — the drafting mandate. This is why an RFC exists
  for this territory **without O12 having been ruled**: `rfc/social-play.md:17-24` names your
  live-games commission as its exploration gate, *not* O12.
- **[[D1040]]** (`:373`) — unrelated territory (campaign progression); named here only to record
  that it was checked, per the [[D1150]] fix (*"before any owner question, grep the ledger for a
  ruling on that row's subject"*).

---

## 3. What `rfc/social-play.md` already specifies

The draft covers all seven handoff points, and in most cases turns a recommendation into a
mechanism. **You are not being asked to decide any of the following** — they are engineering
consequences of the ruling, already written:

| handoff point | where the RFC settles it |
|---|---|
| 2 — identity before convenience | §3.1 envelope (`rfc/social-play.md:173-179`); §3.2 additive schema `:204-228`; criterion 12's export set-equality `:591` |
| 4 — automatic attributed return | §3.5 `:289-307`, reusing `importLeg`'s existing path |
| 4 — provider analysis never a Tabiya grade | §2 `:156-161`; §4.1 stripping assertion `:327-334`; criterion 10 `:580` |
| 3 — native match says it is casual | §5 `:359-375` — one fixed header line |
| 7 — self-host boundary, OAuth into the platform contract | §3.6 `:309-323`, Discharge D1 `:628` |
| 6 — bounded local bot event | §7 `:446-508` — `bot_events` / `bot_event_entrants` / `bot_event_games` |
| 6 — standings are arithmetic, never a grade | §7.3 `:489-499`, rendered constraint sentence |

It also goes **beyond** the handoff, on research that landed after it (`league-as-return-loop`), with
two refusals you have never seen: **a hosted league** and **an operator/tournament-director
account** (§8 refusals 5 and 6, `rfc/social-play.md:522-523`). Those are in §5 below as things that
still need your nod, because [[D1030]] (`design/BACKLOG.md:371`) is exactly the class of failure
where a refusal gets asserted in an RFC and never put to you.

### 3.1 The part that must not be misread — the RFC assumed the ruling

`rfc/social-play.md:93-103` opens *"The scope boundary is drawn by three prior rulings, all consumed
rather than reopened"* and names **[[D707]]/[[D709]]**, **[[D710]]**, **[[D708]]/[[D819]]**.

**None of those five is a ruling.** Verified at HEAD:

- `design/BACKLOG.md:630` — **D707** is `📊` (a current-tree measurement).
- `design/BACKLOG.md:632` — **D709** is `💡`, and its status cell literally cites
  `planning/platform-alignment/social-play/o12-handoff.md`. **D709 *is* this handoff's
  recommendation.** The RFC is citing the unruled proposal back as its own authority.
- `design/BACKLOG.md:633` — **D710** is `📊` (Lichess OpenAPI capability measurement).
- `design/BACKLOG.md:631`, `:585` — **D708** and **D819** are `💡`.

This is not a reason to distrust the RFC's engineering; the measurements are sound and I re-verified
them (§4). It is the reason **O12 is not redundant**: the draft's entire scope fence rests on an
answer that was never given, so ruling O12 either makes the draft's foundation real or forces it to
change before acceptance.

---

## 4. Verification of the handoff at HEAD

Every load-bearing claim, re-measured. `[V]` = verified today at HEAD (`36074c7`).

| handoff claim | status | evidence |
|---|---|---|
| The external handoff stores transport, not identity | **holds** `[V]` | `apps/server/src/storage.ts:4059-4069` — `arena_legs` has 8 columns (`session_id`, `leg`, `reference_player_handle`, `external_challenge_url`, `pgn`, `result`, `branch_id`, `imported_at`). No provider, challenge id, game id or accepted terms |
| No automatic return path exists | **holds** `[V]` | `apps/server/src/live-session.ts:240-250` — `importLeg` parses a **pasted** PGN. Nothing observes a provider game finishing |
| Native match is casual/untimed/unenforced and does not say so | **holds** `[V]` | `docs/live-sessions.md:46-47` states it; `grep -ri casual apps/web/src` → **0**, `grep -ri "no clock" apps/web/src` → **0** |
| Lichess API supplies the expensive substrate | **holds** (desk, [[D710]]) | official OpenAPI, cited `design/BACKLOG.md:633`. Not re-verified against the live API today |
| Federation is post-1.0 (R19/O14) | **holds** `[V]` | `planning/platform-alignment/decision-queue.md:51` — O14 still DEFERRED |
| **"Bot event waits on O8/F8"** | **STALE** `[V]` | O8 was **RULED 2026-08-22** (`decision-queue.md:45`). The real blocker is now arithmetic: `apps/server/src/bot-policy-catalog.ts:299` — `BOT_POLICY_PROFILES = compileBotPolicyCatalog([])`, so the entrant pool is **0** until `bot-roster` lands |
| **"Every entrant names an exact policy and version"** | **already exceeded** `[V]` | `apps/server/src/bot-policy-catalog.ts:141-144` — `BotPolicyDecisionRecord` carries `profileDigest` beside `profileId`/`profileVersion`. A digest pins what the declaration *was*; a version pins what someone remembered to bump ([[D1347]]) |
| **"F11 may draft only … above"** (Consequence of approval) | **STALE** `[V]` | The draft already exists (`rfc/social-play.md`, `4dbb624`) and was licensed by [[D1093]]/[[D1310]], not by O12. Approval no longer unblocks drafting; it validates or corrects a standing draft |
| Queue intent home `design/00` | **no anchor** `[V]` | `design/00-thesis.md` contains no occurrence of *social*, *human play* or *friend*. The amendable text is `design/03-product-breadth.md:53-55` (Position Arena minimum), `:87-88` (events row) and `:327` (B5). If the ruling is to touch `00` it would be an addition, not a correction |

**One precision drift worth recording** (it affects §6.1 below): the RFC and [[D1348]] both say the
`countable:false` forcing fires *"only where a `match_states` row exists."* The operative
discriminator at HEAD is `boardControl === "match"` — `apps/server/src/service.ts:2038-2040`
(`#matchContext` returns `undefined` unless `boardControl === "match"`, and **throws**
`STORAGE_FAILURE` if the row is then missing), consumed at `:2117`. The row's existence is guaranteed
by the same branch (`apps/server/src/storage.ts:2966`, insert at `:2980`; the Arena branch at
`:2982`). **The consequence is unchanged and the finding stands** — Arena sessions are never
`boardControl === "match"`, so an imported Arena leg is countable and a native match is not — but the
mechanism is the board-control discriminator, not the table.

---

## 5. What genuinely remains yours

Everything above removes the specification work. This is what is left:

1. **The scope fence itself** — confirm or veto the hybrid. Nothing else in the repo has ruled it,
   and a draft RFC is standing on it (§3.1).
2. **D1348 — does a two-human game count toward return-loop progress?** Currently decided by which
   table gets a row. See §7.1. **This is the one that is genuinely undecided, not merely unconfirmed.**
3. **Two refusals you have never been shown** — the hosted league and the operator account
   (§7.2). [[D1030]] is the reason these are surfaced rather than absorbed.
4. **`design/03:87-88` says "later native matchmaking"** and the RFC refuses it for 1.0
   (`rfc/social-play.md:533-536`). That is a design deviation; law 5 makes the amendment yours.
5. **The "team relays" clause** — [[D412]] (`design/BACKLOG.md:865`) reads the events row's *team
   relays* as a roster-with-a-calendar, distinct from external tournament relay. Routed to you as
   Discharge D5 (`rfc/social-play.md:632`), not written by the RFC.
6. **Three cheap-now/expensive-later shapes** — §7.3.

---

## 6. Recommendation, as clauses

**R1 — Rule the hybrid.** Native private friend matches stay as casual rehearsal sessions. Rated,
clocked and public play is delegated to an optional chess-network adapter, Lichess first.

**R2 — Identity, not transport.** A leg that names no provider is *manual transport* and must be
labelled so; a leg that names a provider but carries no game id is *incomplete* and may not be
described as returned. Only **provider-accepted** terms are ever rendered — never what we asked for.

**R3 — Provider-owned competition in 1.0.** Ratings, clocks, pairing, fair-play enforcement and the
public pool remain the provider's. We may say *which provider reported which result under which
terms*, and never *"Tabiya verified this game."*

**R4 — The return trip is the point.** An authorized completion imports into the originating run as
a branch and opens the same Review / retry / branch / drill paths — [[D1272]]'s *"open it like an
imported game"* applied to the learner's own game. Manual PGN paste survives provider-off.

**R5 — No native public pool, no hosted human tournament, no federation in 1.0.** Federation stays
O14/R19 and post-1.0.

**R6 — Admit the bounded local bot event, gated by arithmetic.** Entrants pin
`profileId` + `profileVersion` + `profileDigest`; a digest mismatch at game time **voids** the game
rather than replaying it under a new declaration. Standings are result arithmetic under a rendered
sentence saying they are not a strength measurement. The event is unconstructible until `bot-roster`
populates the catalogue, and that is a number a test can check, not a promise.

**R7 — Self-host boundary holds.** External play is optional; the core loop and native friend play
require no hosted provider. OAuth token custody, refresh, revocation and provider health enter the
F12 platform contract (Discharge D1) and are **not** pretended to be small.

**R8 — Adopt the two post-handoff refusals explicitly** (§7.2), so they are ruled rather than
asserted.

**R9 — Do not accept `rfc/social-play.md` on this ruling.** Its criteria are defective (§7.4). Rule
the scope; require a criteria repair before acceptance.

---

## 7. The genuine choice points

### 7.1 D1348 — should two-human play count toward the return loop? **(the real fork)**

**Today, by accident:** an **imported Arena leg counts**; a **native friend match does not**. Nobody
chose that. It falls out of `service.ts:2117` keying on the board-control discriminator
(`:2038-2040`), which `storage.ts:2966` sets only for native matches while `:2982` seeds Arena legs
in the mutually exclusive branch. Ledger row: `design/BACKLOG.md:1638`.

| option | what it means | cost |
|---|---|---|
| **(a) Both count.** A whole unassisted game from our own position is *stronger* return evidence than a drill attempt | Consistent, and matches what an external rated game will be. **Changes what a `/learn` count means** — progress can now be earned in a session the product does not instrument. Requires removing the native forcing, i.e. touching shipped projection behaviour | one behaviour change, one meaning change |
| **(b) Neither counts.** Return progress is measured only in rehearsal | Also consistent, and preserves `/learn` as a pure rehearsal metric. **Removes something that works today** — the Arena leg's countability is the return path the external adapter was going to inherit for free (`rfc/social-play.md:118-125`), so the adapter would then have to build one | the adapter gets more expensive |
| **(c) Leave it.** Native no, Arena yes | Zero work today. **Guarantees the question returns** the first time someone notices that playing a friend natively earns nothing while pasting the same game's PGN earns credit | deferred, and gets more expensive once external legs are stored |

The RFC's own recommendation is **(a)** (`rfc/social-play.md:652-656`), flagged there precisely
because it makes the native match's exclusion look like the inconsistency. **My recommendation is
(a)**, with the native forcing removed in the same change so the two shapes agree — but this is a
product-meaning call about what a progress number promises, which is why it is yours and not the
RFC's.

### 7.2 Two refusals that go beyond the handoff

Neither was in the packet you were given. Both are surfaced under [[D1030]] rather than absorbed.

- **A hosted league** (`rfc/social-play.md:522`) — refused on two independent grounds: a league's
  minimum input is a population *with a bench* (`league-as-return-loop` §C6), and §5.4's randomised
  evidence runs **against the obligation mechanism itself** (n ≈ 250,000, P = 0.115 on completion).
  Reopen trigger is stated as a number: enough learners to fill one section with a bench.
  **Recommendation: adopt the refusal.**
- **An operator / tournament-director account** (`:523`) — refused on `design/02:98-99`
  (*"never a privileged user"*). Every league obligation is an act by a privileged human, which is
  why the league refusal follows from this one. **Recommendation: adopt.** If ever revisited, the
  surviving shape named is per-league delegated capability on the shipped run-grant model.

### 7.3 Three cheap-now, expensive-later shapes

Each has an RFC recommendation; each is cheap to reverse today and not after the first stored row.

| | question | RFC recommendation (`rfc/social-play.md:642-660`) |
|---|---|---|
| a | Does a rematch chain become new legs, or a new session? | **A new session** — the Arena's two-leg shape *is* the same position from both sides; a third game is not that comparison |
| b | May a challenge be issued from a mid-run node in v1? | **No for v1** (root only, following `importLeg`'s anchor at `live-session.ts:243`), but persist `sourceNodeId` so lifting it is a validator change, not a migration |
| c | Does an unaccepted challenge expire? | **No auto-expiry** — an explicit host revoke, because auto-expiry is a second clock with nothing to check it |

### 7.4 The four defects landed 2026-08-23 — do they change what you are approving?

**Three of them argue *for* the ruling. One is a criteria defect that blocks acceptance, not scope.**

- **[[D1344]]** (`design/BACKLOG.md:1634`) — `session_invitations.state` is rendered to the host and
  can never move. Verified `[V]`: the `CHECK` admits `'open','accepted','revoked'`
  (`storage.ts:4056`), the type declares all three (`live-types.ts:86`, `apps/web/src/lib/api.ts:305`),
  `App.svelte:1068` prints the value — and **grep across `apps/server/src` and `apps/web/src` finds
  zero producers** for `accepted` and `revoked`. **Does not change the ruling; it raises its
  urgency.** The status quo is not neutral: it is a lifecycle the interface promises and the server
  cannot deliver.
- **[[D1346]]** (`:1636`) — any PGN with the right starting position imports as any Arena leg.
  Verified `[V]`: `live-session.ts:243` checks the root position only. **Does not change the
  ruling** — it is the concrete content of handoff point 2 (*identity before convenience*), and the
  named repair is `ARENA_GAME_MISMATCH`.
- **[[D1348]]** (`:1638`) — **this one does change what you are approving.** Promoted to §7.1.
- **[[D1382]]** (`:1672`) — the cross-review of the RFC's own acceptance criteria. **Does not change
  the scope ruling; it does mean the RFC cannot be accepted as drafted.** Confirmed at HEAD:
  criterion 7 (*"no module outside the adapter issues a provider request"*) is red — e.g.
  `apps/server/src/tablebase.ts:30` fetches `https://tablebase.lichess.org` directly, and
  `import-source.ts:72-73` fetches `https://lichess.org/game/export/…`; the RFC exempts neither.
  Criteria 14 and 15/16 are mutually unsatisfiable at landing (14 bakes in a 0-entrant pool; 15 and
  16 each require a played event game). Criterion 3 names no operand for game identity. **Ask: rule
  the scope now; require the criteria repair before the RFC is accepted.**

---

## 8. What turns on it

- **`rfc/social-play.md` gets a real foundation or a correction.** Today its scope fence cites
  [[D707]]/[[D709]]/[[D710]]/[[D708]]/[[D819]] as *"prior rulings"* when all five are measurements or
  ideas, and [[D709]] is this handoff's own recommendation (§3.1).
- **Three defects get an owner-sanctioned repair path.** [[D1344]], [[D1345]], [[D1346]] are all
  routed to sections of a draft that is standing on an unruled premise.
- **[[D1348]] stops being an accident.** Either way, the ledger row becomes a decision.
- **The refusal shelf gets shorter, honestly.** Two refusals the RFC asserts (hosted league,
  operator account) become ruled rather than asserted — which is [[D1030]]'s remedy applied before
  you find them after the fact.
- **`design/03` needs an owner amendment either way**: `:87-88`'s *"later native matchmaking"* and
  its *"team relays"* clause ([[D412]]). `design/00` has no anchoring text to amend.
- **Unblocked downstream:** the F12 platform contract inherits the OAuth/token custody obligation
  (Discharge D1); `bot-roster` inherits the 0-entrant gate (D2); `learner-rating` inherits the
  human-anchor experiment (D4) and the witness-class predicate (D6); `recorded-clocks` and
  `enforced-clocks` inherit the returned-game clock readings and termination reasons (D10, D11).

---

## 9. If you want to rule this in one line

> *"Hybrid as recommended, including the league and operator refusals; two-human play counts toward
> the return loop and the native match's exclusion is removed to match; rematch is a new session,
> challenges are root-only in v1, no auto-expiry; `social-play` fixes its criteria before
> acceptance."*

That answers R1–R9, §7.1(a), §7.2 and §7.3(a/b/c), and leaves nothing in this memo open.
