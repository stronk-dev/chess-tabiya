# RFC: casting — the streamer/caster surface over a live-followed game

- **Status:** draft — 2026-08-23
- **Author:** claude (coordinator), from `planning/live-sources/phase-b-derivation.md` §4
  and `design/research/live-relay-as-drill-source.md`
- **Created:** 2026-08-23
- **Design refs:** `design/03-product-breadth.md:81-83` (the Streamer/Twitch surface,
  quoted in §1), `:291` (the Live shell row); `design/05:41` (*"Absence is stated, never
  simulated"*); `design/05:230-232` via `intent-presets` §2 (the ∩ algebra)
- **Exploration gate:** [[D1272]] ⚖️ (owner, 2026-08-23) — *"well a live game is just a
  live game... you can just open it like an imported game right but it updates live...
  streamer/caster modes is a separate thing in the webapp but those need to integrate
  with the live games mechanic.... shit can be separate but integrated."* That ruling
  **dissolved the B5 gate** rather than answering it: live-following is not casting
  investment, so it is ungated, and **casting is its own surface that consumes it**. This
  RFC is that surface. It descends from the owner's original commission [[D947]], whose
  lane definition named *"the streamer-cast / anyone-analyses compositions"* explicitly.
- **Depends on:** `rfc/live-following.md` (draft — the follower, the `followed_sources`
  record, the `sourceGameLive` bit and its AND-release, all **consumed unchanged**);
  `rfc/live-sources.md` (accepted — Phase A ingestion); `rfc/intent-presets.md`
  (accepted, *implementing* — the `stream` context and the ceiling term)
- **Parent / amends:** amends nothing. Corrects one shipped doc sentence (§7.3).
- **Supersedes / superseded by:** —
- **Planning:** `planning/live-sources/`

```tabiya-claims
none
```

## Summary

A cast is a **live-followed game, a stream session over a cut of it, and an audience that
can see the board without a synchronised client.** Almost all of that ships. This RFC
specifies the composition precisely, and then specifies the one thing that does not
exist and is not optional: **the casting arm of the liveness lock.**

Three things carry the document.

**Casting is a composition, and this RFC says exactly which parts** (§2) — the `stream`
session kind, session-creation over an existing `runId`, the overlay route, the marks
relay, and the vote machinery all ship today, measured. What is genuinely new is one
guard, one refusal code path, one composition contract, and a decision about votes.

**"A composition, not a new evidence mode" was read as "free", and it is not** ([[D705]]
is right and was misapplied). Two defects made a cast of a live game a law-8 violation
reachable with no new code; **both are fixed at HEAD** and verified here (§3.1) — but
they are fixed on the **mainline-immutability** axis, and [[D411]] is about **liveness**.
`sourceGameLive` has **zero matches in the tree**. The whole liveness arm is still owed.

**The audience is a channel, and the lock does not close it** (§6). The lock clamps *our*
evidence. A public vote on a live position is the audience collectively computing a game
two players are still playing, and publishing the tally — which is the exact channel
broadcast delays exist to interrupt. That is a new finding, and this RFC refuses the
default rather than shipping it silently.

## Motivation

The owner asked for this first, twice, and in the same breath as live games: *"so
streamers can cast or anyone can analyse."* Phase A made a finished round importable.
`live-following` makes a round in progress followable. Neither of them is the thing a
streamer opens.

[[D1272]] settled the architecture in one sentence — **separate but integrated.** The
alternative readings both fail: bundling casting into `live-following` would have made an
already-large RFC unlandable and coupled a viewer surface to a follower's storage; gating
casting behind a streamer-audience threshold would have deferred the owner's own #1 lane
behind a market condition. Separate-but-integrated is neither, and it is what this RFC
implements.

**Why the guard is the centre.** `imported` and `stream` are the two highest-ceiling
contexts in the registry after `position` — both admit `analysis`, whose module set
includes `full_inspector` (`presets.ts:42,46`, verified). So a live-followed board sits,
in **both** its solo and its cast context, at near-maximum assistance, on a game still
being played, **in front of an audience**. Every other lane's version of the [[D411]]
leak reaches one learner. This one reaches a broadcast.

## Specification

### §1 — What a cast is

`design/03-product-breadth.md:81-83`, verbatim:

> **Streamer/Twitch:** the streamer owns the live board; chat votes on plans or moves;
> the host snapshots, rewinds, branches, compares, and exposes an overlay. Viewers do not
> need full synchronized clients.

[[D705]] ruled the shape: *"coach and streamer need explicit workflow compositions, not
new evidence modes. Stream can bind the existing overlay/vote/marks projection."*

A cast is therefore **four shipped objects wired together**, plus a guard:

1. a **followed source** (`live-following` §2) tracking the broadcast game as it grows;
2. an ordinary **cut** of it — an imported run, complete-as-known;
3. a **`stream` live session** created over that run's id;
4. the **overlay** at `/live/overlay/:runId`, which viewers open with no client state;
5. **the liveness guard** (§3), which does not exist.

Nothing in 1–4 is new. Item 5 is this RFC's building work.

### §2 — What ships today, measured

`[V]` All rows verified against `HEAD` (codex holds `apps/` dirty; every claim below was
read via `git show HEAD:`).

| part | ships? | evidence | gap |
|---|---|---|---|
| `stream` session kind | **yes** | `LIVE_SESSION_KINDS = ["stream","academy","match"]`, `types.ts:38` | — |
| session over an existing run | **yes** | `create({runId, kind, title, …})`, `live-session.ts:53,90` — binds any readable run | nothing; a cut binds today |
| `stream` workflow context | **yes** | `presets.ts:46`; reached by `deriveWorkflowContext` on `liveKind === "stream"` | — |
| overlay route | **yes** | `/live/overlay/:runId`, `App.svelte:1073-1075` | its composition contract (§7) |
| overlay is projection-only | **yes, since `0f04a2d`** | `resume(runId,{projectionOnly:true})`, `App.svelte:311`; `#projectionOnly` is the **first** short-circuit in `#playOpponentIfNeeded`, `session-controller.ts:506` | — |
| viewers need no synchronised client | **yes** | the overlay renders from `session.runState` alone, disabled board, no writer lease claimed (`session-controller.ts:213`) | — |
| marks relay | **yes** | `relayedMarkShapes(activeLiveDetail)`, `App.svelte:1075`; attribution rendered | — |
| vote machinery | **yes, fully** | `openVote` (2–8 options, 15–600 s, **each option legality-checked** via `legalAt`, `live-session.ts:197-200`), `castVote`, tally, chat namespace `chat:<adapter>:<key>` with an unverifiability disclosure (`:210-215`) | **whether it may run on a live position — §6** |
| evidence barrier | **yes** | `withheld` renders *"Host is ahead; evidence is withheld until this run discloses."* | it is a *disclosure* barrier, not a *liveness* barrier |
| **liveness guard** | **NO** | `grep -rn "sourceGameLive" apps packages` → **0 matches** | **all of §3** |

**The honest summary of the composition**: five of six parts ship, and the sixth is the
one that keeps the other five lawful.

### §3 — The liveness guard, which is this RFC's building work

#### §3.1 What codex already fixed, and why it is not this

[[D1210]] found two shipped defects that composed into a law-8 violation with no new
code. **Both are fixed at HEAD** (`0f04a2d`), verified rather than assumed:

- `#refuseImportedMainlineExtension` is called in **both** write paths — `move()`
  (`service.ts:956`) and `opponentPly()` (`:983`), defined at `:2070`;
- the overlay resumes through `projectionOnly`, which short-circuits
  `#playOpponentIfNeeded` **before** the `matchMode`, `read_only` and turn checks
  (`session-controller.ts:506`) — so the overlay tab cannot request a provider move or
  commit a ply even when the browser profile holds the writer lease.

**They are on a different axis.** Codex's guards are about **mainline immutability**:
they stop anything extending an imported game's own line. [[D411]] is about
**liveness**: whether the *source game* is still being played. The two are orthogonal —
a cut of a live source is a perfectly ordinary imported run whose mainline is
complete-as-known, so `#refuseImportedMainlineExtension` correctly *permits* rehearsal
branches on it, while saying nothing at all about whether two grandmasters are mid-game.

#### §3.2 The casting arm

`live-following` §3 specifies `sourceGameLive` as a dynamic `AssistanceContext` bit with
**AND**-release (terminal ∧ round-finished ∧ connected) and two arms — a ceiling clamp
and a server-side `SOURCE_GAME_LIVE` refusal on the model of `MATCH_LIVE`
(`errors.ts:48`; `service.ts:2067`). **This RFC consumes that unchanged and adds the
doors a cast opens that a solo run does not:**

| door | why casting opens it | required behaviour while `sourceGameLive` |
|---|---|---|
| **the overlay read** | a viewer with a share link is not the learner and holds no lease; the disclosure barrier keys on `feedbackDisclosed(run)`, which a host can satisfy with one click | the overlay renders board, marks and **liveness state**; it renders **no evidence, no evaluation, no module output**, regardless of disclosure |
| **the public token** | `PublicTokenRecord` scope `story_read` **outlives the session** | minting a `story_read` token over a run whose source is live **throws `SOURCE_GAME_LIVE`** |
| **the vote surface** | §6 | per §6's ruling |
| **session creation itself** | a cast can be opened *before* anyone reads anything | permitted; the session carries the liveness state so every reader inherits it |

**Fail-closed, inherited:** unknown liveness is locked, a lost follower connection is
locked, and a restart is locked until re-derived (`live-following` §3.3). This RFC adds
no release condition and **must not** — the release is the follower's to compute.

#### §3.3 Viewer and host see the same thing, and that is the ruling

`docs/live-sessions.md` records an accepted limitation: *"A streamer cannot be forced to
play blind while their audience sees more evidence… it does not pretend to prevent a host
from cheating on themselves."*

**That limitation was written for rehearsal and does not survive contact with a live
source.** Cheating on yourself in a drill is a private act with no victim. The board here
is a game two players are currently playing, and the host has an audience.

**Normative: while `sourceGameLive`, the host's evidence ceiling and the viewer's are the
same ceiling.** There is no host tier. This is the one place this RFC narrows something
the shipped product permits, and it narrows it because the subject changed — not because
casting is special, but because the *board* is.

*(This is stated as a refusal rather than a mechanism: the host's clamp already comes from
`sourceGameLive` via the ceiling term. The obligation is that no casting surface adds a
host-only path around it.)*

### §4 — Law 8: a live evaluation is provisional and nothing can say so

`live-following` §4 establishes the boundary and this RFC inherits it whole: **while
`sourceGameLive`, no engine evaluation of any node of that source is computed, attached
or rendered.** Not computed-and-hidden — not computed.

The casting-specific consequence: **an overlay may not render a claim about the current
position at all.** It renders what happened (the moves as relayed), the host's marks with
attribution, the vote state, and an explicit statement that evidence is withheld
**because the source game is live** — a fact about the source, not a claim about the
position, which keeps `design/05:41`'s *"Absence is stated, never simulated"* true.

### §5 — What a cast may render, exhaustively

The list is closed. A casting surface renders:

1. the board position as relayed;
2. the move list as relayed;
3. host-authored marks, with attribution;
4. branch count and objective state;
5. vote prompt, options and tally (subject to §6);
6. the liveness disclosure;
7. after release, everything the `stream` context's ceiling already admits.

**Anything not on this list is refused while live.** The list is normative and criterion 4
asserts set-equality against the rendered element set, so an addition must amend this RFC.

### §6 — Chat voting on a live position

**The finding.** Votes ship fully and are **legality-checked against the run**
(`legalAt(run, nodeId, option.moveUci)`, `live-session.ts:200`) — so a vote's options are
legal moves *in a position two players are currently thinking about*, and the tally is
published to everyone watching.

**The lock does not cover this.** [[D411]]'s clamp narrows what *our evidence layer*
shows. A vote shows nothing of ours: it is the audience's own analysis, aggregated by us
and broadcast back. Broadcast organisers ship delays of up to 3600 s precisely to
interrupt that channel (`live-relay-as-drill-source.md:128-131`).

**Ruling, and it is a refusal rather than a deferral:** **while `sourceGameLive`, a vote
window may not be opened on a node of that source.** `openVote` throws
`SOURCE_GAME_LIVE`. Votes on a **released** source, and votes on any non-followed run,
are unaffected — the shipped mechanic is untouched everywhere it was already lawful.

**What this does not decide, deferred with a home:** whether a *delayed* vote (opened
against a position N moves behind the live tip, mirroring Lichess's three-move stream
delay) should be admitted. That is a real product question with a real precedent, it needs
a delay parameter this RFC does not specify, and it is **Discharge D3**, owned by the
owner. Refusing it now is the fail-closed default, not a judgement that it should never
exist.

### §7 — The overlay's composition contract

#### §7.1 `play-composition` does not reach the overlay

`[V]` `rfc/play-composition.md` never mentions `/live/overlay/:runId`, a live session or
casting; its ~20 `overlay` occurrences all mean the layout primitive. The live overlay
imports nothing from the geometry authority and hand-rolls its CSS
(`App.svelte:1175-1176,1194`). **So "the overlay is a projection of run state, not a new
screen" is the *intended* contract, not the shipped one.**

#### §7.2 The obligation

The overlay needs **one** of: an explicit extension of `play-composition`'s scope, or its
own composition contract. This RFC takes the second — a cast is a broadcast surface with
different constraints (no interaction, arbitrary viewport, OBS capture) — and specifies
the minimum: a **closed child list** for the overlay region, so an element cannot be added
without amending §5's render list. **Discharge D2** carries the geometry itself to
`play-composition`'s owner, because the board-sizing authority belongs there and
duplicating it is the [[D537]] trap.

#### §7.3 A shipped doc sentence is wrong and this RFC corrects it

`docs/live-sessions.md` says *"The overlay uses the same run projection and feedback
barrier as the player; it is not a second evidence surface."* **True of the rendered
markup and the barrier; false of the mount** — the route mounts a full session controller
(`App.svelte:311`). It is now *safe* (`projectionOnly`), but the sentence still misleads
anyone reasoning about overlay safety, as this lane's own derivation initially was.
Correct it to name the mount and its guard.

### §8 — Refusals

| refusal | reason |
|---|---|
| A host tier above the viewer tier while live | §3.3 — the board is a game in progress |
| Any evidence, evaluation or module output in a live overlay | §4 — provisional, and law 8 |
| A vote window on a live node | §6 |
| A `story_read` token over a live source | §3.2 — the token outlives the session |
| A new evidence mode for casting | [[D705]] — compositions, not modes |
| A second board-geometry authority | [[D537]] — Discharge D2 instead |
| Casting a run that is not a cut of a followed source | out of scope; ordinary sessions already ship |

### §9 — Ledger lifecycle

This RFC's landing flips nothing on its own. [[D958]] (*casting blocked on B5*) is
**discharged by [[D1272]]**, which dissolved the gate; its row should record that rather
than a build. [[D1212]]'s question is answered by the same ruling.

## Deviations from design

**One.** `docs/live-sessions.md`'s accepted host-tier limitation is narrowed for live
sources only (§3.3). The document's reasoning holds for rehearsal and this RFC does not
touch it there; the narrowing is scoped by `sourceGameLive` and releases with it.

## Acceptance criteria

Each names the wrong implementation that would otherwise pass.

1. **`sourceGameLive` reaches every casting reader.** A cast opened over a live source
   reports the bit in its session detail for host and viewer alike. *Wrong impl that
   passes without this:* one that clamps the host's client and serves the viewer from an
   unclamped projection.
2. **The viewer path renders no evidence while live**, asserted at the **API boundary** —
   the overlay's fetches return no evidence payload — not by inspecting markup. *Wrong
   impl:* hiding evidence in CSS.
3. **No provider query, no committed ply, from a cast.** A cast of a live-followed run
   issues zero `selectMove` calls and appends zero plies, asserted over the API. *Wrong
   impl:* relying on `projectionOnly` alone, which a future route could forget to pass.
4. **The rendered element set is set-equal to §5's list**, asserted against an exported
   constant rather than a hand-count ([[D1240]]). *Wrong impl:* a superset that happens to
   look right today.
5. **`openVote` throws `SOURCE_GAME_LIVE` on a live node**, and does not throw on a
   released one, and does not throw on a non-followed run. Three arms; the middle one is
   the regression guard. *Wrong impl:* disabling votes for all live sessions.
6. **A `story_read` token over a live source throws.** *Wrong impl:* refusing at read
   time, which leaves a minted token to fire after the session ends.
7. **Host and viewer ceilings are equal while live**, asserted by comparing the two
   computed ceilings for the same run. *Wrong impl:* asserting the host's ceiling alone.
8. **Release restores the `stream` ceiling exactly** — after release the cast admits what
   `presets.ts:46` already admits, no more. *Wrong impl:* one that grants on release,
   violating *"every term only narrows"*.
9. **The overlay's children are a closed list**, and adding one fails the build. *Wrong
   impl:* a comment saying so.
10. **`docs/live-sessions.md`'s mount sentence is corrected** and a test asserts the
    overlay route passes `projectionOnly`. *Wrong impl:* fixing the doc without pinning
    the behaviour it describes.
11. **`register-check` is green with this RFC active and `tabiya-claims` reads `none`.**
12. **Scope fence:** a grep-able assertion that this RFC's landing adds no
    `WorkflowContextId`, no `SessionKind`, and no evidence kind. *Wrong impl:* one that
    quietly introduces a `cast` context, which would break the 28/12 grid
    (`presets.ts:91-93`) — and 8 contexts × 5 presets is exactly 40, so a ninth throws.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | The liveness bit, its AND-release and its two arms are `live-following`'s to build; this RFC consumes them unchanged | `live-following.md` | that RFC's landing commit | |
| D2 | Overlay board geometry belongs to the composition authority, not a second one ([[D537]]) | `play-composition.md` | that RFC's next amendment | |
| D3 | Whether a **delayed** vote (N moves behind the live tip, per the 3-move stream-delay precedent) is admitted | OWNER | `planning/platform-alignment/decision-queue.md` | |
| D4 | The `docs/live-sessions.md` mount correction (§7.3) | codex | this RFC's implementing commit | |
| D5 | Discovery — how a viewer finds a cast — is not specified here | `planning/live-sources/` | a successor drafted from this lane | |

## Open questions

1. **Does a cast of a *released* source keep any liveness marking?** A game that finished
   ten minutes ago is materially different from one that finished last year, and the
   audience may still be arriving. Recommendation: no special state — release is release —
   but flagged because it is cheap to add and expensive to retrofit.
2. **Should a cast be refusable by the source?** Some organisers licence broadcasts with
   redistribution terms. Phase A's provenance carries a licence field; this RFC does not
   read it. Recommendation: read it, refuse casting where the licence forbids
   redistribution, and route the mapping to the famous-games licensing work rather than
   inventing a second policy.

## Ledger rows

Proposed; ids assigned at landing. Ledger head was **D1284** at drafting.

- 🐞 **The vote surface is an information channel the [[D411]] lock does not cover.** Votes
  are legality-checked against the run and the tally is published, so a vote on a live
  node is the audience computing a position two players are still playing — the exact
  channel broadcast delays interrupt. Refused while live (§6); the delayed-vote variant is
  Discharge D3.
- 🐞 **`docs/live-sessions.md`'s overlay sentence is false of the mount** (§7.3), and it
  misled this lane's own derivation before it was caught.
- 💡 **`play-composition` does not reach `/live/overlay/:runId`** — the "projection, not a
  screen" contract is intended, not shipped (§7.1). Discharge D2.
- 💡 **The accepted host-tier limitation does not survive a live source** (§3.3), and the
  narrowing is scoped by `sourceGameLive` rather than rewritten globally.

## Changelog

- 2026-08-23 — drafted on [[D1272]], which dissolved the B5 gate by ruling casting
  *separate but integrated*. Composition enumerated and measured at HEAD (§2); codex's
  `0f04a2d` fixes verified and shown to be on the mainline-immutability axis rather than
  the liveness one (§3.1); the vote channel identified and refused while live (§6); the
  host-tier limitation narrowed for live sources (§3.3).
