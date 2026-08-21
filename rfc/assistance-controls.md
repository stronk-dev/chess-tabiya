# RFC: Assistance controls — three switches over the ladder, each wired to the wrong thing

- **Status:** draft
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-16
- **Design refs:** `design/05-in-run-experience.md` §3 (the ladder), §3a-i (the disclosure
  model as shipped — the `attempt_end` boundary and its re-close rule), §3-forms (form is
  orthogonal to source; the config owns the matrix), §3a (silence is the default), §3b
  (guided mode = the shape library rendered live, *a mode a learner chooses*), §4 (what
  varies by context), §5 open question 4 (RESOLVED: silence is the product's opinion,
  everything else is the learner's per-context `AssistanceConfig`);
  `design/00-thesis.md` §Target player (the on-ramp band and its three knobs)
- **Exploration gate:** `design/research/mechanics-by-mode.md` §3.3–§3.5, the hands-on
  code census that produced **D307**, **D308** and **D309**; `planning/app-reality-check.md`
  (2026-08-16, hands-on against the running app). No new research is required and none is
  proposed: every claim below is a reading of shipped code or a quotation of a design ruling.
- **Depends on:** nothing unlanded. Composes with two in-flight RFCs and collides with
  neither — see §6.
- **Parent / amends:** amends the shipped assistance surface established by
  `rfc/archive/adaptive-guidance.md` (the `AssistanceConfig` axes and the six profiles) at
  the **controls**, not at the detectors, the permission table or the marker admission rule.
- **Supersedes / superseded by:** —
- **Planning:** `planning/assistance-controls/` (once implementing)

*Every code site below was read in full at HEAD on 2026-08-16, not grepped. **Locate by
symbol name; every line number is advisory.** Several line numbers carried by the ledger
rows have already drifted under them and are corrected in §1 — which is the ordinary condition
of this tree, not a complaint about the rows. **The tree also moved during the draft:** a
concurrent session landed D493's `SILENT_ASSISTANCE.boardLighting` restoration and added
`sessionErrorMessage` to `session-controller.ts`. Both are absorbed below rather than
described away; neither changes a disposition.*

```tabiya-claims
none
```

## Summary

Three ledger rows — D307, D308, D309 — describe one object: **the controls by which a
learner moves on `design/05`'s assistance ladder.** All three were bucketed
`NEEDS-OWNER` on `DESIGN-GAP:` markers. Read against the design tier, **two of the three
are defects against rulings that already exist, and the third is two claims of which one
is a defect and one is a mis-diagnosis.** This RFC specifies the fixes and puts the single
genuine, and non-blocking, owner question at the end where it belongs.

- **D308 — defect.** `design/05` §3a-i ships a disclosure model in which a Just Play learner
  may reveal mid-run and the reveal *"re-closes on the next committed move"*. The server,
  the runtime and the HTTP API all implement it. **The run screen has no control that calls
  it.** One store method, one controller method, one prop, one button.
- **D309 — defect.** `design/05` §3b specifies guided mode as *"the shape library rendered
  live… a mode a learner chooses"*. The shape library renders live **with no gate at all**,
  while the switch labelled *Named-pattern guidance* gates a strictly smaller duplicate
  that additionally requires an unrelated switch. `SILENT_ASSISTANCE` already declares
  `guided: "off"`; the code does not honour its own constant.
- **D307 — split.** Its *defaults* half is a mis-diagnosis: six identically silent profiles
  is what §3a, §3-forms and §5 Q4 rule, not a defect — **with exactly one ruled exception
  that is unimplemented**, `guided: "live"` for the on-ramp (§3b). Its *permission* half is
  real, is correctly marked owner-tier by the row itself, and is **non-blocking**: §4's two
  clauses are already carried by `deliveryOpen` once D308 lands.

This RFC claims **nothing versioned** — no run schema, no pack lane, no shape-entry schema,
no migration position, no `AssistanceConfig` version. Verified in §5.

## Motivation

### The disposition finding, stated first because it is the deliverable

The three rows carry `DESIGN-GAP:` markers, which under RFC-0000 rule 5 would mean spec is
missing. For two of them it is not. The evidence, by row:

**D308.** `design/05` §3a-i, verbatim:

> **`attempt_end`** is the third, pack-less boundary and it **re-closes on the next
> committed move** — the rule that stops a Just Play reveal becoming a live engine feed

A rule whose entire job is to *bound* a Just Play reveal presupposes that the reveal is
reachable. It is not. `feedbackDeliveryOpen` (`packages/runtime/src/feedback.ts`)
implements the re-close exactly as written — it walks the event list, opens on
`feedback.revealed` or `outcome.reached`, and closes on `move.committed`. `revealFeedback`
(`packages/runtime/src/runtime.ts`) emits the event. `RunService.reveal`
(`apps/server/src/service.ts`) guards it and persists it. The route exists
(`apps/server/src/rest.ts`, the `reveal` arm of the run-action regex). `RunApi.reveal`
exists (`apps/web/src/lib/api.ts`). **The client has two call sites for it, both in
`App.svelte`** — one in `refreshStory`, one in `importGame` — and neither is in
`DrillScreen.svelte`. Four layers implement a ruling; the fifth never wired the switch.
That is a defect against a shipped ruling, not an owner question.

**D309.** `design/05` §3b, verbatim:

> Yes, and it is not an exception to §3a — it is the **shape library rendered live**
> (`04-content-architecture.md` §0)… §3a sets the *default*; this is a mode a learner
> chooses.

and §3a:

> the default during committed play is **silence**

`SILENT_ASSISTANCE` (`packages/runtime/src/assistance.ts`) sets `guided: "off"`. The shape
library renders live regardless. **The constant and the behaviour disagree**, and the
constant is the one design wrote down. Defect.

**D307, defaults half — mis-diagnosis.** The row reads: *"`loadAssistance` returns
`SILENT_ASSISTANCE` for **every** unset profile… so **all six contexts default
identically** … the defaults half does not [ship]"*. But §3-forms, describing the very
fields it is talking about, says they are *"each off by default per §3a"*, and §5 open
question 4 is marked **RESOLVED** with:

> silence is the product's opinion (§3a ruling); everything else is the learner's
> per-context `AssistanceConfig`

Six identically silent defaults is the ruling. The row's framing — that six profiles buy
six empty slots — is a real ergonomic complaint and it is **D494's** complaint (the silence
is never *disclosed*), not a per-context-defaults complaint. What *is* missing is one
ruled exception: §3b calls guided mode *"the natural default for the 1000–1400 on-ramp"*,
and the `onramp` profile defaults to silent like the rest.

**D307, permission half — real, owner-tier, and correctly self-described.** The row's own
strongest sentence is *"there is no lever to make Just Play more permissive than a drill
**even if the owner rules that it should be**"* — i.e. it states that no ruling exists.
`rfc/teacher-surface.md` (accepted) reaches the same conclusion and hands it on in its own
words: *"The live row in this territory is now D307, and this RFC does not touch it… it
belongs to whoever next owns that surface. Naming it without claiming it is the point."*
This RFC owns that surface. §4.3 pins the invariant and §Open questions 1 prices the fork,
**non-blocking**, because after D308 lands the two clauses §4 actually states are both
implemented.

### Why now

`planning/app-reality-check.md` (2026-08-16) walked the running app and found the core loop
works while the product does not feel present. D308 is the mechanical form of that: a Just
Play learner's assistance panel renders *"Human move split on request"* and *"Corpus counts
on request"* permanently disabled, with an honest sentence explaining that they open when
the run opens feedback — and no way for the learner to open it. **The panel tells the truth
and the truth is that the door has no handle.**

### Scope

**In scope:** the learner-facing controls over disclosure and guidance in the run screen;
the per-profile default table; the honesty of `AssistanceContext`'s declared shape.

**Explicitly out of scope**, each with its owner named:

| Not in scope | Owned by |
|---|---|
| `assistance.markers`, `pivotalMarkers`, `liveMarkers`, `liveAdmitted`, `renderPivotalMarker`, the live-marker admission rule L1–L6 | `rfc/archive/live-marker-quality.md` (*implemented*) |
| The body of `permittedAssistance` and the `mayRequestSplit` conjunction; `seatedInContest`; `reviewing` | `rfc/teacher-surface.md` (*accepted*) |
| `SILENT_ASSISTANCE.boardLighting`'s `"legal"` → `"off"` regression | **D493**. **It landed in the working tree while this RFC was being drafted** — `boardLighting` is `"legal"` again and `adaptive-guidance.test.ts`'s *"implements the assistance table with silence as the universal default"* is updated with it. This RFC touches no value of `SILENT_ASSISTANCE`, and §4.2's default table is spelled as a spread of it precisely so a change of this kind flows through in either landing order — which it now has |
| Stating the silence to a first-run learner | **D494**, already queued |
| Which shape entries a pack loads versus the full catalogue | §Open questions 2 |
| Any rating-driven fade of guided mode | `rfc/learner-rating.md`; seam named in §3.4 |
| New forms — arrows, spoken, ambient — and any new detector | unchanged; this RFC adds no source, no sentence and no detector |

## Specification

### 1. What the code does today

Read at HEAD on 2026-08-16. Two ledger line numbers have drifted and are corrected here;
the *findings* they support all reproduce.

#### 1.1 The disclosure chain, and where it stops

| Layer | Symbol | State |
|---|---|---|
| Predicate | `feedbackDisclosed`, `feedbackDeliveryOpen` (`packages/runtime/src/feedback.ts`) | ships; `attempt_end` opens on `feedback.revealed` / `outcome.reached` and closes on `move.committed` |
| Mutation | `revealFeedback` (`packages/runtime/src/runtime.ts`) | ships; refuses any policy but `attempt_end`, returns an empty `emitted` when delivery is already open |
| Service | `RunService.reveal` (`apps/server/src/service.ts`) | ships; `#forWrite` + `#refuseWhileMatchLive` (*"Pause the match before rehearsing or revealing"*) + the same policy refusal |
| Route | the `reveal` arm of the run-action regex (`apps/server/src/rest.ts`) | ships |
| Client API | `RunApi.reveal` (`apps/web/src/lib/api.ts`) | ships, returns `MutationResult` |
| Client store | — | **absent.** `RunStateStore` (`apps/web/src/lib/run-state.ts`) has `move`, `appendOpponentPly`, `prediction`, `recordReasoning`, `rewind`, `fork` — no `reveal` |
| Controller | — | **absent** |
| Run screen | — | **absent** |

`api.reveal` has exactly **two** call sites in `apps/web/src`, both in `App.svelte`:
`refreshStory` (recovering from `ASSISTANCE_WITHHELD` on a finished imported run) and
`importGame`. *(The ledger row cites `:292` and `:317`; at HEAD they are `:296` and `:321`.
The count and the placement are unchanged.)*

The consequences a Just Play learner meets, all verified by reading
`DrillScreen.svelte`'s `assistance-grid` (inside the `details.assistance-control` element;
`:767–783` at HEAD, `:712–726` in the row):

- `assistanceContext` is `{ sessionKind, deliveryOpen: feedbackDeliveryOpen(run), role }`;
  `assistancePermission` is `permittedAssistance(assistanceContext)`.
- `permittedAssistance` returns `humanSplit` and `corpus` as `"locked_off"` and
  `boardLighting`/`arrows` capped at `"sight"` whenever `deliveryOpen` is false.
- So the two checkboxes render disabled with the honest sentence *"Available only after
  this run opens feedback, and never to participants or spectators."*, and the
  *"Show recorded human-model split"* button — which lives **in this panel**, not in the
  pivotal modal — is never constructed, because its guard requires
  `assistancePermission.humanSplit === "free"`.
- `RunStateStore.pollEvidence` short-circuits on `!feedbackDeliveryOpen(...)`, so **staged
  evidence is never applied either**, which is why `snapshot.pendingEvidence` can sit
  non-zero for a whole Just Play game.

Rungs 3 (human model) and 4 (corpus) are therefore structurally unreachable during play,
and disclosed-evidence board lighting is capped at structural sight. (D308's row adds rung 6
to that list; §2.5 corrects it — rung 6's in-run gate is `markers`, not disclosure.) `outcome.reached` eventually opens everything — which is
`design/05` §3a-i's *"a finished run has nothing left to contaminate"* — so the defect is
precisely bounded: **the learner may have the toolkit after the game and never during it.**

#### 1.2 Guided mode, inverted

Two independent paths render shape content in the run screen.

**Path A — ungated, and it is the complete one.** In `DrillScreen.svelte`:
`path` → `firings = shapeFirings(shapes, path)` → `shapeMarkers` (mapping each firing to
`{ nodeId, entryId, label, channel }`) → the `shapeMarkers` prop of `Timeline.svelte`,
which renders a labelled `.shape-marker` button per firing (both at ply 0 and per entry) →
`onOpenShape` sets `openShapeId` → `ShapePanel.svelte` renders the entry in full:
detection spec, per-side named plans with their structural success signatures, watch list,
typical mistakes, provenance and licence. **`ShapePanel` prints §3b's own framing sentence
verbatim** — *"Named plans for this structure — general to the kind of position, not advice
for this one."* **No `assistance` value is read anywhere on this path.**

**Path B — gated, and it is a strict subset.** `guidedShapes` is derived as `[]` unless
`openPivotalNodeId !== undefined && assistance.guided === "live"`; it is rendered inside the
pivotal-marker dialog, printing each matching entry's name, the same framing sentence again,
and a bare `<ul>` of plan **labels** — no descriptions, no signatures, no watch list, no
typical mistakes, no provenance. `openPivotalNodeId` can only be set from `pivotalRows`,
which derive from `projectedPivotal`, which is `[]` unless `assistance.markers === "live"`.

So the switch labelled *Named-pattern guidance* buys a duplicate of a panel that is already
open, minus most of its content, behind a prerequisite it does not mention. And the
unlabelled path violates §3a's silence default in code, for every mode, for every learner.

**A shape entry's rung, since this decides whether guided mode is admissible pre-commit
at all.** The trigger is a `StructuralExpression` matched against the FEN
(`matchesStructuralExpression`) — rung 0. The plans are authored — rung 5, carrying
provenance, which is §3's stated safeguard for that rung. Neither reads an evaluation.
§3b's permitted column is exactly this: *"This is a Carlsbad structure. The standard plans
are…"*. That is why this RFC gates guided mode on the learner's choice rather than on
disclosure: **the content is admissible pre-commit; what is not admissible is volunteering
it.**

#### 1.3 Defaults and the dead field

`ASSISTANCE_PROFILES` (`apps/web/src/lib/assistance-preference.ts`) is
`["pack", "position", "imported", "match", "stream", "onramp"]`. `assistanceProfile` maps
`immediate_guard` → `onramp` first, then live kind, then session kind. `loadAssistance`
returns `SILENT_ASSISTANCE` for any profile with nothing stored, and `migrate` carries a
learner's stored `guided` value forward from v1/v2/v3 unchanged.

`AssistanceContext.sessionKind` is declared and **never referenced in the body of
`permittedAssistance`**; `mayRequestSplit` reads `role` and `deliveryOpen` only. Six
non-test call sites pass it: `DrillScreen.svelte`, `apps/server/src/rest.ts` (three —
the run projection, `human-split`, `corpus`), `apps/server/src/service.ts`, and
`liveMarkers` in `packages/runtime/src/pivotal.ts`.

**The on-ramp profile is reachable and its consumer is large.** `immediate_guard` is
pack-declared, and `design/00-thesis.md` §Target player is explicit that the on-ramp band
is served by **on-ramp packs** — *"the same pack object and runtime with three knobs
turned"*, one of which is *"pack-declared immediate blunder-guard feedback"*. Counted at
HEAD: `content/candidates` holds **36** `pack.json` files, of which **24** declare
`feedbackPolicy: "immediate_guard"`, **12** declare `delayed_checkpoint` and **0** declare
`segment_end`. Two thirds of the corpus selects the `onramp` profile.

### 2. D308 — the disclosure control

#### 2.1 Runtime and transport: no change

`revealFeedback`, `RunService.reveal`, the route and `RunApi.reveal` are unchanged. This
RFC adds no endpoint, no error code, no event type and no field.

#### 2.2 `RunStateStore.reveal`

Added to `apps/web/src/lib/run-state.ts`, modelled byte-for-byte on the shipped `rewind`:

```ts
reveal(): Promise<MutationResult> {
  return this.#mutate(() => this.#api.reveal(this.#session.runId, this.#session.writerId));
}
```

`#mutate` already supplies the read-only refusal and the `NOT_ACTIVE_WRITER` demotion;
`#applyMutation` already tolerates an empty `emitted` (`appendProjected` returns the same
run and the length check compares equal), which is the `revealFeedback` already-open path.

#### 2.3 `SessionController.reveal`

Added to `apps/web/src/lib/session-controller.ts`, modelled on the shipped `rewind`:

```ts
async reveal(): Promise<void> {
  this.#patch({ busy: true, error: undefined });
  try {
    await this.#requiredStore().reveal();
    this.#patch({ busy: false });
  } catch (error) { this.#fail(error); }
}
```

The store's own `#syncPolling` picks up the newly-open delivery window and starts applying
staged evidence; nothing else is refreshed, because a reveal changes what the learner *may
request*, not what has been generated.

#### 2.4 `DrillScreen` — one prop, one control

`Props` gains `onReveal?: (() => void | Promise<void>) | undefined`, destructured with the
other optional handlers. `App.svelte` passes `onReveal={() => controller.reveal()}` in the
`<DrillScreen …>` block alongside `onRewind`.

The control renders **inside the existing `assistance-grid`, above the `humanSplit` row**,
under the predicate:

```
onReveal !== undefined && run.feedbackPolicy === "attempt_end" && canWrite
```

The policy predicate, **not** `pack === undefined`: the two agree on every well-formed run
and disagree exactly when a pack run's document failed to load, in which case the pack
predicate would offer a control that `RunService.reveal` refuses with `INVALID_REQUEST`.

It is rendered with `HonestControl` (`apps/web/src/lib/HonestControl.svelte`), whose
`.reason` is a visible muted block at HEAD, wired to `aria-describedby` — the same idiom
the panel's locked rows already use. **Exactly one disabled state:**

| State | Predicate | `disabled` | Reason shown |
|---|---|---|---|
| Available | `!feedbackDeliveryOpen(run)` | no | — |
| Already open | `feedbackDeliveryOpen(run)` | yes | `Evidence is open at this position until you commit your next move.` |

**The live-match refusal is deliberately not pre-empted on the client.**
`RunService.#refuseWhileMatchLive` refuses only when a match context exists, is **not**
paused, and the position is not terminal. The client knows `liveSessionKind` but not the
pause state, so a client-side guard would refuse a paused match that the server permits —
an over-refusal, and `design/05` §1 forbids simulating a constraint as much as it forbids
hiding one.

Instead the refusal reaches the learner through a path that already exists and **already
names this verb**: `sessionErrorMessage` (`apps/web/src/lib/session-controller.ts`) maps the
`MATCH_LIVE` code to *"Pause the live match before rewinding, branching, or revealing
feedback."*, `#fail` sets it as `error`, and `DrillScreen` renders it in its
`<p class="error" role="alert">`. **No new plumbing and no new sentence** — the reveal verb
was written into that message before this RFC existed, which is a small piece of evidence
that the control is the missing half of a system that was otherwise finished.

Copy, which is normative because §3-forms binds wording to the source and law 8 binds it
absolutely — the control states a mechanism and never a chess fact:

- Button label: **`Open evidence for this position`**
- A persistent sentence beneath it, `class="honest"`, present whether or not the button is
  enabled: **`Recorded on the run as a disclosure, and it closes again on your next
  committed move.`**

That sentence is the RFC's honesty load. It states the cost (`design/05` §1: *absence is
stated, never simulated*), it states that the act is recorded on the run (invariant 6:
*every move, verdict and disclosure is in the run's event log*), and it states the re-close
that §3a-i calls *"the rule that stops a Just Play reveal becoming a live engine feed"*.

#### 2.5 What opening delivery unlocks, enumerated

Nothing new is built. These are the existing consequences of `feedbackDeliveryOpen` turning
true, listed so the RFC's claim is checkable rather than atmospheric:

1. `permittedAssistance(...).humanSplit` and `.corpus` become `"free"`, enabling the two
   checkboxes and constructing the *"Show recorded human-model split"* and *"Show corpus
   counts"* buttons — rungs 3 and 4, on request.
2. `.boardLighting` and `.arrows` ceilings rise from `"sight"` to `"evidence"`, so a learner
   who has chosen `boardLighting: "evidence"` stops seeing the fallback caption
   *"No disclosed evidence exists here; structural sight remains available."*
3. `GET …/human-split` and `GET …/corpus` stop returning `ASSISTANCE_WITHHELD` for this
   viewer — the same permission object, evaluated server-side.
4. `RunStateStore.pollEvidence` begins applying staged evidence, so `pendingEvidence` drains.
5. `liveAdmitted`'s `human_divergence` arm — `permission.humanSplit === "free"` — becomes
   satisfiable, so a learner who has *also* chosen `markers: "live"` may see that dot.
   This RFC does not change that arm; it changes whether its precondition is ever reachable
   in Just Play, which `rfc/archive/live-marker-quality.md` §6.2's accepted cost describes as
   *"until delivery opens — which under `attempt_end` re-closes on the next committed move"*.
   That sentence, too, presupposes a reveal.

All five re-lock on the next `move.committed`, by `feedbackDeliveryOpen`, with no new code.

**One correction to D308's own wording, found by reading rather than grepping.** The row
says rungs *"3, 4 and 6"* become reachable. Rungs 3 and 4 do, exactly as above. **Rung 6
does not, and it is not disclosure that blocks it:** the only in-run call site of
`requestVoice` is the *Revoice this packet* button inside the **pivotal-marker dialog**, so
it is gated on `assistance.markers === "live"` and on an admitted marker existing — a
surface `rfc/archive/live-marker-quality.md` owns and this RFC does not touch. The reveal makes
rung 6 reachable *in principle*, by putting an admitted `human_divergence` marker within
reach; it does not put a rung-6 control in front of a learner who has left markers off.
Recorded here rather than quietly implemented.

#### 2.6 What this deliberately does not do

- It does not open delivery automatically, at a threshold, or on a timer. Silence remains
  the product's opinion (§3a); the learner initiates.
- It does not pre-fetch the split or the corpus page. Those stay behind their own buttons.
- It does not add a keyboard binding. The run's key map is dense and a reveal is not a
  motion.
- It does not appear for a read-only follower or a spectator; the reveal is a write on the
  run and `#forWrite` already says so.

### 3. D309 — guided mode, uninverted

#### 3.1 Gate path A

In `DrillScreen.svelte`, `shapeMarkers` becomes empty unless the learner has chosen the
mode:

```
shapeMarkers = assistance.guided === "live" ? firings.map(…) : []
```

`firings` itself is unchanged and still computed, because it is also the input to §3.3's
honesty sentence and costs one structural match per node.

#### 3.2 Delete path B

`guidedShapes` and the `{#if assistance.guided === "live"}` block inside the pivotal-marker
dialog are removed. The dialog keeps `renderPivotalMarker`'s sentences, the endgame
reading, the re-voice button and its close button — all of which belong to other owners
(§6). **After this change `DrillScreen.svelte` renders no shape-entry content in its own
markup** — it still passes `{shapes}` to `CheckpointSheet` and `TerminalSheet`, which use it
only to resolve an authored `plan_class` item's `shapePlan` reference, unchanged — and the
string *"Named plans for this structure — general to the kind of position, not advice for
this one."* exists in exactly one place in `apps/web/src`: `ShapePanel.svelte`.

The learner who had both switches on loses a plan-label list and keeps the full panel,
which is a strict content gain. The learner who had only `guided` on gains the entire
feature, which is the point of the row.

#### 3.3 Rehome the absence sentence

Path B's `{:else}` branch printed *"No named structure entry matches this position."* — a
§1 *absence is stated* sentence, and deleting the block would delete it silently. It moves
to the `structural-reading` section, which already renders the rung-0 counterpart *"No
rung-0 structural observations in this position."*: when `assistance.guided === "live"` and
`firings.length === 0`, that section additionally renders

**`No named structure entry matches this line.`**

The section is a learner-opened disclosure (`structuralOpen` starts `false`), which is the
correct tier for it: it answers a question the learner asked and volunteers nothing.

#### 3.4 Band-shaping: what ships and what is named, not written

§3b requires guided mode to be *"band-shaped — the natural default for the 1000–1400
on-ramp… and off by default above, with an explicit intent that it **fades**"*.

**What ships now** is the default, keyed on the band signal that exists today: the
`onramp` profile (§4.2). `design/00-thesis.md` §Target player defines the on-ramp band as
served by on-ramp packs, and `assistanceProfile` already maps a pack's declared
`immediate_guard` to that profile — so the band signal is the pack's own declaration, and
it covers 24 of the 36 candidate packs.

**What does not ship** is the fade, because it requires a learner rating and no learner
rating exists — `design/research/band-flattery-and-buried-value.md` records that the
`learners` table and the client `Learner` interface carry no rating column of any kind.
The seam is named and its home is `rfc/learner-rating.md`: when a learner rating lands, the
`onramp` default becomes conditional on it rather than on the pack's feedback policy, at
`assistanceProfile`. This RFC neither builds nor blocks that, and it introduces no
placeholder rating.

#### 3.5 The relationship to `live-marker-quality`'s standing rule, stated because it must be

`rfc/archive/live-marker-quality.md` §3 governs *"any future kind, sub-kind, board overlay, arrow,
halo, ambient cue or spoken line that fires **without the learner asking for it in that
moment**"*, and its **L6** says: *"Failing a measurement removes a firing from the live
surface… **Lacking a measurement does not.**"*

The shape-marker channel is such a surface, it is not a `PivotalKind`, and it is absent
from that RFC's §3.1 register. **This RFC does not remove it from the live surface and no
part of §3 is a removal-by-argument.** After the change it still renders live, unasked
within the run, for every learner who has chosen the mode and by default for the on-ramp —
which is two thirds of the corpus. What changes is *whose switch governs it*, and the
switch is the one the shipped constant already declares.

**One obligation is handed on rather than discharged here**, per that RFC's own rule that
*"Amending [the §3.1 register] is how a kind's status changes"*: the shape-marker channel
should gain a register row reading **renders live: yes (behind `guided`); evidence basis:
none; measurement status: never measured**. It is an amendment to an `implementing` RFC,
it is not blocking for this one — the channel is live today with no row at all, so the
amendment strictly improves the register — and it is named here so it does not evaporate.

### 4. D307 — the default table and the honest context

#### 4.1 The defaults ruling, restated so it is not re-litigated

Silence is the default for every profile and every axis. `loadAssistance` returning
`SILENT_ASSISTANCE` for an unset profile is correct and is not changed, except for the one
exception below. The ledger's own evidence agrees: **D78/D359** measured the all-on state
at **978 words and 247 seconds at a single node, lift 1.01×**. Turning things on is the
wrong answer and this RFC turns on exactly one thing, for exactly one profile, on an
explicit design sentence.

#### 4.2 The one ruled exception

Added to `apps/web/src/lib/assistance-preference.ts`, beside `ASSISTANCE_PROFILES`, and
**exported** so criterion 9 can assert against the table rather than against nine literals:

```ts
export const PROFILE_DEFAULTS: Readonly<Record<AssistanceProfile, AssistanceConfig>> = Object.freeze({
  pack: SILENT_ASSISTANCE,
  position: SILENT_ASSISTANCE,
  imported: SILENT_ASSISTANCE,
  match: SILENT_ASSISTANCE,
  stream: SILENT_ASSISTANCE,
  onramp: Object.freeze({ ...SILENT_ASSISTANCE, guided: "live" }),
});
```

`loadAssistance` returns `PROFILE_DEFAULTS[kind]` at **all four** of the sites where it
currently returns `SILENT_ASSISTANCE`: no storage, nothing stored, `migrate` returning
`undefined`, and the `catch`. It is a **fallback, never a merge**: a learner who has stored
`guided: "off"` for `onramp` keeps `"off"`. `migrate` is not touched, so no stored
configuration changes meaning and `AssistanceConfig.version` stays `4`.

The table is spelled as a spread of `SILENT_ASSISTANCE` rather than as nine literals so
that **D493**'s `boardLighting` restoration flows through it in either landing order.

#### 4.3 `AssistanceContext.sessionKind` — pin the invariant, do not invent a difference

No value in the returned table changes. Two things are added:

1. A doc comment above `permittedAssistance` (`packages/runtime/src/assistance.ts`)
   recording the invariant the function actually holds and why it is the right one:

   > Permission is a function of `deliveryOpen` and `role` only. `design/05` §4's two
   > context clauses are both carried by `deliveryOpen`: *"a curated drill withholds by
   > design"* is the pack's own `delayed_checkpoint` / `segment_end` policy, and *"Just
   > Play is the learner's own game and they may want everything"* is the learner-initiated
   > `attempt_end` reveal. `sessionKind` is declared for the shape of the context and is
   > deliberately unread; see `rfc/assistance-controls.md` §Open questions 1.

2. A regression guard in **`packages/runtime/src/adaptive-guidance.test.ts`**, extending its
   existing case *"implements the assistance table with silence as the universal default"* —
   which already pins `SILENT_ASSISTANCE`'s exact nine-field shape and already calls
   `permittedAssistance` four times. No new test file is created. The guard asserts that
   `permittedAssistance` is deep-equal across all three `RunSessionKind` values, over the
   full cartesian product of the other declared fields as they exist when the test is
   written (today: 2 `deliveryOpen` × 4 `role` = 8 cases; after `teacher-surface` lands,
   × 2 `seatedInContest` × 2 `reviewing` = 32). Its client-side sibling
   `apps/web/src/lib/client-surface-floor.test.ts` already pins the `role` dimension —
   *"keeps every non-host assistance permission pointwise at or below the host ceiling"* —
   and is not modified.

**This guard cannot fail today and the RFC says so** (see criterion 11). It is not evidence
of anything; it is a tripwire that fires the day someone branches on `sessionKind` without
a design ruling, which is the exact hazard D307 identifies.

### 5. Register claims — nothing versioned

Verified at HEAD by reading the constants, not the register:

| Lane | Value at HEAD | Claimed by this RFC |
|---|---|---|
| `DRILL_PACK_SCHEMA_VERSION` | `0.27` (`packages/schema/src/index.ts`) | none — 0.28 is held by `graduation-clearance`, 0.29 is the next free lane and this RFC does not take it |
| `DRILL_RUN_SCHEMA_VERSION` | `0.17` | none — no new event type, no new field; `feedback.revealed` already exists |
| `SHAPE_ENTRY_SCHEMA_VERSION` | `0.3` | none |
| `STORAGE_VERSION` | `23` (`apps/server/src/storage.ts`) | none — no DDL, no migration position; the ladder `teacher-surface` → `learner-rating` is untouched |
| `AssistanceConfig.version` | `4` | none — no key added, no key's domain changed, `migrate` untouched |
| REST surface | — | none — no route, no method, no error code |

The only persisted artefact this RFC can move is a `localStorage` value, and it moves none:
the on-ramp default applies **only** where nothing is stored.

### 6. Composition with the two in-flight RFCs

**`rfc/teacher-surface.md` (accepted).** Its §5.2b adds `seatedInContest` and `reviewing`
to `AssistanceContext` and re-associates `mayRequestSplit`. This RFC changes neither the
interface's existing fields nor the function body. Landing order is free: if
`teacher-surface` lands first, §4.3's doc comment is written above its final form and the
guard's cartesian product is the 32-case one; if this RFC lands first, its comment and its
8-case guard are widened by that RFC's diff. Its §5.2b property 3 — *"When both new fields
are `false` the function is byte-identical to the shipped one"* — is unaffected, because
this RFC leaves the shipped one alone.

**`rfc/archive/live-marker-quality.md` (implemented).** It owns the pivotal-marker surface end to
end. This RFC removes **one block from inside the pivotal dialog** — the block whose guard
expression is `assistance.guided === "live"` — and touches nothing else there:
`renderPivotalMarker`, `liveMarkers`, `liveAdmitted`, `openPivotal`, `pivotalRows`, the
dot's `aria-label` and the endgame reading are all untouched. The merge point is identified
by that guard expression, not by a line number. Its owner ruling of 2026-08-15 and the
**2026-08-16 amendment** narrowing *"permanently"* to *"for the duration of live play"* are
read and honoured: nothing here changes what a participant or spectator receives, and the
reveal control is refused to any non-writer by `#forWrite` before it reaches a permission
question.

### 7. Documentation obligations

Per RFC-0000's docs convention, in the same change:

- `docs/adaptive-guidance.md`: the sentence *"New contexts start from
  `SILENT_ASSISTANCE`"* becomes accurate — five profiles start from it and `onramp` starts
  from it with `guided: "live"`, with the §3b citation. The boundaries list gains the
  reveal control: *a Just Play writer may open feedback delivery on request, the act is a
  `feedback.revealed` event on the run, and it closes on the next committed move.*
  **This RFC does not edit the `boardLighting: "legal"` sentence at `:61`; that line is
  D493's.**
- `docs/drill-client.md`: the run screen's assistance panel gains the reveal control — its
  predicate, its one disabled state, its copy, and the fact that a live-match refusal
  arrives from the server rather than from a client guard; and the *Named-pattern guidance*
  switch is documented as gating the timeline shape markers rather than a modal section.

## Deviations from design

**One, and it is a tension inside `design/05` rather than a divergence from it.**

§6 open question 1 carries the clause *"rung 2 reveals the answer, so showing it is
contamination."* §2's control makes the rung-2-derived `boardLighting: "evidence"` ceiling,
and rungs 3 and 4, available mid-play on the learner's own request.

The reconciliation this RFC applies: §6 Q1's subject is **what the product volunteers**,
and its own opening sentence scopes it — *"The default is silence and that is ruled, not
open. What remains open is *availability on request*"*. The learner-initiated case is
governed by three later, dated rulings that all point the same way: §3a-i's `attempt_end`
boundary with its re-close, §4's *"Just Play is the learner's own game and they may want
everything"*, and §5 Q4's **RESOLVED** *"silence is the product's opinion… everything else
is the learner's per-context `AssistanceConfig`"*. And the act is recorded — a
`feedback.revealed` event on the run's log, permanently, visible to any comparison of two
attempts — which is invariant 6 naming *disclosure* as one of the things the log carries, a
naming that only makes sense if disclosure can happen mid-run.

**Law 5: this RFC does not write `design/05`. What it needs named:**

1. **§6 open question 1** should say in one clause that it governs *unrequested* assistance,
   so its rung-2 parenthetical stops reading as a prohibition on the learner-initiated
   reveal that §3a-i specifies. As written, two sections of one document answer the same
   question differently, and an implementer must guess.
2. **§3-forms**' *"A curated drill, Just Play, a match, a stream, and the on-ramp each get
   their own defaults"* should say what *own defaults* means, given §5 Q4 resolved silence
   as the product's opinion for all of them. The reading this RFC implements — own
   **ceiling** and own **offered forms**, with exactly one ruled non-silent default
   (`guided`, on-ramp, §3b) — is a reading, and the design tier should say whether it is
   the right one.
3. **§3b**'s *"band-shaped… and off by default above, with an explicit intent that it
   fades"* should name its band source. Today the only band signal in the product is the
   pack's `immediate_guard` declaration, via `design/00-thesis.md` §Target player. §3b
   should either endorse that as the v1 signal or name the learner rating as its
   prerequisite, so the fade is not read as unimplemented spec.

## Acceptance criteria

Each criterion names how it fails, because a criterion that cannot fail is not a criterion
(**D444**) and one whose failure clause fires and is scored a pass is worse than none
(**D451**).

1. **A Just Play run can open disclosure mid-run.** Browser test: start a Just Play game,
   commit a move, open the assistance panel — the *Human move split on request* checkbox is
   disabled and carries its locked sentence — click *Open evidence for this position*, then
   tick that checkbox; the *Show recorded human-model split* button is constructed and
   returns a distribution. — *Fails if* the control is wired to a path the server refuses,
   if `#applyMutation` rejects the empty-`emitted` already-open response, or if
   `permittedAssistance` is evaluated from a stale snapshot.
2. **The reveal is a run event, not a client flag.** After criterion 1's reveal,
   `GET /runs/:id/events?sinceSeq=0` contains exactly one `feedback.revealed` event. —
   *Fails if* the control is implemented as local state, which is the tempting shortcut and
   would break invariant 6 while looking identical on screen.
3. **The window re-closes on the next committed move.** Continuing criterion 1: commit one
   more move; the checkbox is disabled again and the reason sentence returns. — *Fails if*
   the client caches the permission object across moves. This is `design/05` §3a-i's own
   bounding rule and the criterion exists to be able to fail.
4. **The control exists only where the server accepts it.** Present on a `position` run and
   on an `imported` run; absent on a `delayed_checkpoint` pack run; absent for a read-only
   follower. On a live, unpaused native match it is present and enabled, and clicking it
   surfaces the server's `MATCH_LIVE` sentence in the run screen's error region rather than
   silently doing nothing. — *Fails if* the predicate is `pack === undefined`, which
   disagrees with `feedbackPolicy === "attempt_end"` whenever a pack run's document failed
   to load; and *fails if* the client pre-empts the match refusal, which would also refuse
   a **paused** match that the server permits.
5. **The silent default hides the shape-marker channel.** A `position` run with nothing
   stored, on a position where `shapeFirings` returns a non-empty list, renders zero
   `.shape-marker` buttons. — **This criterion fails at HEAD**; that failure is the
   definition of D309's fix.
6. **Guided mode needs no second switch.** With `guided: "live"` and `markers: "off"`
   stored for the profile, the `.shape-marker` button renders and opens the full
   `ShapePanel` including its provenance footer. — *Fails if* the gate is added to
   `shapeMarkers` while the dialog block survives, which would let a reviewer believe
   guided mode works while its only complete rendering still requires `markers`.
7. **The duplicate is gone.** The string *"Named plans for this structure — general to the
   kind of position, not advice for this one."* occurs exactly once under `apps/web/src`,
   in `ShapePanel.svelte`. — *Fails if* the dialog block is left as unreachable dead code.
8. **The absence sentence survived the deletion.** With `guided: "live"` on a position where
   `shapeFirings` returns `[]`, the structural-reading section states that no named
   structure entry matches. — *Fails if* the block is removed without rehoming the
   sentence, which is how a §1 honesty statement disappears without anyone noticing.
9. **The on-ramp default is the only exception, and the profile it defaults for is
   reachable.** Two assertions in `apps/web/src/lib/assistance-preference.test.ts`:
   `loadAssistance("onramp", emptyStorage)` differs from `SILENT_ASSISTANCE` in exactly the
   key `guided`, and the other five profiles deep-equal it; and
   `assistanceProfile({ sessionKind: "pack", feedbackPolicy: "immediate_guard" })` is
   `"onramp"`, which is the only route to the profile. — *Fails if* a later default drifts,
   or if the `immediate_guard` → `onramp` mapping is changed by another RFC, which would
   leave the exception shipping for nobody. **Non-vacuity is recorded, not asserted**, and
   the number is measured rather than argued: **24 of the 36** `pack.json` files under
   `content/candidates` declare `feedbackPolicy: "immediate_guard"` at the time of drafting,
   so the profile is selected by two thirds of the corpus. That count will drift with the
   content lane and is not made a gate on this RFC.
10. **A stored preference beats the default in both directions.**
    `loadAssistance("onramp", storageReturning({ …v4, guided: "off" }))` returns
    `guided: "off"`. — *Fails if* the default is applied as a merge over the stored value,
    which would silently re-enable guidance for a learner who turned it off — the exact
    shape of a control that cannot be turned off, which §3b names as one of Clippy's four
    failures.
11. **`permittedAssistance` is invariant in `sessionKind`.** Deep-equal across all three
    `RunSessionKind` values over the full cartesian product of the other declared fields.
    — **This is a regression guard and it cannot fail today**, stated plainly so it is not
    scored as evidence of anything. It fires the day a `sessionKind` branch is added
    without the design ruling §Open questions 1 asks for.
12. **Nothing versioned.** `DRILL_PACK_SCHEMA_VERSION` `0.27`, `DRILL_RUN_SCHEMA_VERSION`
    `0.17`, `SHAPE_ENTRY_SCHEMA_VERSION` `0.3`, `STORAGE_VERSION` `23` and
    `AssistanceConfig.version` `4` are unchanged by this RFC's diff. — *Fails if* the
    on-ramp default is implemented inside `migrate`, which is the tempting place and would
    change what stored configurations mean, requiring `version: 5` and a migration branch.
13. **The two tests that pin the old behaviour are amended, not deleted.**
    `tests/browser/drill.spec.ts` — *"Just Play reaches a Carlsbad and opens a passive shape
    marker without mutating the run"* — turns guidance on through the panel before expecting
    the marker; `apps/web/src/lib/screens.test.ts` — *"shows a passive shape marker in
    pack-free play and opens the attributed plans panel"* — seeds `assistanceStorage` with
    `guided: "live"`, using the idiom already present twice in that file. — *Fails if*
    either is deleted, which would leave criterion 6 unwitnessed on the real bundle.
14. **Docs match code.** `docs/adaptive-guidance.md` no longer says all six contexts start
    from `SILENT_ASSISTANCE`, and its boundaries list names the learner-initiated reveal;
    `docs/drill-client.md` documents the control — predicate, one disabled state, copy,
    server-sourced match refusal — and the corrected meaning of the *Named-pattern
    guidance* switch. — *Fails if* the docs still describe the pre-RFC
    defaults, which is the failure `docs/adaptive-guidance.md:61` is currently in for
    D493 and is precisely the pattern not to repeat.

## Open questions

1. **Does assistance *permission* vary by session kind at all? — NON-BLOCKING; this RFC is
   implementable under any answer, and §4.3 ships under the recommendation.**

   `design/05` §4 asks *"What assistance is permitted here?"* and answers *"A curated drill
   withholds by design. Just Play is the learner's own game and they may want everything."*
   Both clauses are implemented **through `deliveryOpen`** once §2 lands: a pack withholds
   because its declared policy keeps delivery shut until a checkpoint or a segment end, and
   Just Play may have everything because its learner can open delivery. So the question is
   whether a *further*, kind-keyed difference should exist on top of that.

   | Option | What it is | Cost | What it buys / risks |
   |---|---|---|---|
   | **A — pin and keep** *(recommended, and what §4.3 specifies)* | `sessionKind` stays declared and unread; the invariant is documented and guarded | one comment, one test, no behaviour | Keeps the seam for a future ruling and kills the false affordance. **Risk:** a guard that cannot fail today is one line from being cited as evidence that the question was settled. Criterion 11 states that it is not |
   | **B — remove the constraint by removing the field** | Delete `sessionKind` from `AssistanceContext`; update six non-test call sites | ~10 lines across `packages/runtime`, `apps/server` (×2 files), `apps/web` | Maximally honest: the signature stops promising a lever. **Cost:** it collides with `rfc/teacher-surface.md` §5.2b, whose normative interface block includes `sessionKind`; it can only be done as a follow-up after that RFC lands, so it is not available today |
   | **C — implement properly: rule a real difference now** | The owner rules a per-kind ceiling, e.g. a pack's pre-disclosure `boardLighting`/`arrows` drop to the rules floor while `position`/`imported` keep structural sight — *"a curated drill withholds by design"* taken literally | one expression in `permittedAssistance` + tests + a design amendment | Gives the field a real job and makes §4's first clause visible rather than implied. **Cost, and it is the honest one:** this is a **narrowing of a shipped surface with no measurement behind it**, which `rfc/archive/live-marker-quality.md` L6 refuses when done by argument. It would have to be ruled as design intent, not justified as evidence. It also re-opens §6 Q1, which design has marked open |

   **Recommendation: A now, B as a follow-up if the owner rules that no kind-keyed
   difference will ever exist, C only as an explicit design amendment.** Option C is listed
   because a fork that offers only "keep the dead field or delete it" is a fork that omits
   *implement it properly*, and that is not a fork this repo accepts.

2. **Should a pack-loaded run see the whole shape catalogue or only its declared subset?**
   `SessionController.#loadShapes` loads a pack's declared `document.shapes` for pack runs
   and the entire catalogue — **25** entries under `content/shapes` at HEAD — for
   `position` and `imported` runs. Both are defensible: a pack-less run has no author to
   declare a subset, and `design/05` §5c says the rung-0 layer serves *"drilling and Just
   Play identically"*, which argues for the full catalogue everywhere; a pack author who
   declared three shapes may reasonably not want a fourth named mid-drill. **Deferred, not
   resolved here**, because it is a content-authoring question rather than a control
   question and it changes nothing this RFC specifies. Proposed as a new ledger row —
   ids are free from **D503**; no row is written by this draft.

3. **Should the reveal control state what is currently withheld before it is clicked?**
   Today it states what will happen. A stronger form would name the rungs waiting behind it
   — *"human move split, corpus counts and disclosed-evidence lighting are withheld here"*.
   That is **D494**'s territory (silence over evidence is correct; the missing thing is that
   the silence is never disclosed), and this RFC deliberately does not pre-empt it: the
   sentence D494 lands should be one sentence, written once, not two written by two RFCs.
   Non-blocking.

## Changelog

- 2026-08-16: created. Dispositions established against `design/05` before drafting: D308
  and D309 are defects against existing rulings; D307's defaults half is a mis-diagnosis
  with one unimplemented ruled exception, and its permission half is a genuine, non-blocking
  owner question.
- 2026-08-16, same day, re-verified against a tree that moved under the draft: D493's
  `boardLighting` restoration and `sessionErrorMessage` both landed while this was being
  written. §Scope, §2.4 and §4.3 are written against the moved tree; §4.2's spread-based
  default table was chosen before the move and survived it unchanged, which is the reason
  it was written that way.
