# O11 decision memo — coach and streamer workflows in 1.0

**For:** the owner
**Prepared:** 2026-08-23 by claude, at HEAD `36074c7`
**Queue row:** `planning/platform-alignment/decision-queue.md:48`
**Handoff under review:** `planning/platform-alignment/professional-workflows/o11-handoff.md`
(written 2026-08-21; **two days and three landings stale**)
**Status of this memo:** the decision is materially smaller than the queue row says. Read §2 first.

---

## 1. The question, as you would ask it

*"What parts of the coach and streamer surfaces am I committing to for 1.0 — and which of them
have I already decided without anyone writing it down?"*

---

## 2. What you have ALREADY ruled that bears on this

**This section comes first because it removes roughly two thirds of the handoff.** The failure class
here is re-asking a settled question — your own words on 2026-08-23, `design/BACKLOG.md:371`
([[D1030]]):

> *"what ELSE has been 'refused' even though i asked for it explicitly this is like the 10th time
> we find out after the fact major compoments are being deferred for no reason."*

Casting was on that list. `planning/platform-alignment/refused-vs-asked.md:105` records
*"[[D958]] casting, 'owner B5 ruling pending', not in the decision queue"* — and you ruled it the
same day.

### 2.1 [[D1272]] (owner, 2026-08-23) — casting is separate but integrated, and ungated

`design/BACKLOG.md:457`, verbatim:

> *"well a live game is just a live game... you can just open it like an imported game right but it
> updates live... streamer/caster modes is a separate thing in the webapp but those need to
> integrate with the live games mechanic.... shit can be separate but integrated."*

The row records the consequence: this **dissolves the B5 question rather than answering it** —
live-following is ungated, and **casting gets its own lane** rather than a discharge row.
`rfc/casting.md` was drafted on that ruling the same day (`rfc/casting.md:10-17`, commit `2f82710`).

**Consequence for O11: the Streamer half of the handoff is no longer an O11 decision at all.** It is
an active RFC in the register (`rfc/README.md:38`).

### 2.2 [[D1291]] (owner, 2026-08-23) — casting votes run at an owner-configurable delay

`design/BACKLOG.md:1593`, verbatim:

> **OWNER RULING 2026-08-23: chat votes on a live cast run at an OWNER-CONFIGURABLE DELAY behind
> the tip.** The caster sets how far behind live the votes run — defaulting to the standard
> broadcast delay and adjustable per event or per organiser's rules. […] **Discharges
> `rfc/casting.md` D3**; the fail-closed refusal on undelayed live votes stands as the default.

**This is the one place the drafted recommendation contradicts a ruling you have already made.**
Handoff point 7 reads *"No Tabiya editorial delay for 1.0 Stream"* — and the dossier argues the
case at `design/research/professional-workflow-conformance.md:72-76`. You ruled the opposite for
the vote channel one day later. §5 clause 6 states the reconciled form.

### 2.3 [[D947]] (owner, 2026-08-22) — the commission itself

`design/BACKLOG.md:335`: *"where is the stuff like retrieving LIVE games (current tournaments for
example) so streamers can cast or anyone can analyse?"* — the lane definition names *"the
streamer-cast / anyone-analyses compositions over the existing overlay projection (D705)"*
explicitly. Casting is a standing owner ask, not a proposal awaiting sponsorship.

### 2.4 O4 (ruled 2026-08-20; mirrored into intent 2026-08-21)

`design/05-in-run-experience.md:224-234`:

> - **Workflow identity and the requested preset are stored separately from technical source
>   preferences.** […]
> - **Effective assistance is `requested preset ∩ workflow/session ceiling ∩ honesty/access ∩
>   source availability` — every term only narrows.**

Handoff point 2 ("add an explicit Academy assistance profile … it must not read/write Just Play's
`position` preferences") is **this ruling applied to one named workflow**, not a new decision. The
dossier says so itself (`professional-workflow-conformance.md:99-103`).

### 2.5 [[D649]] (owner, 2026-08-21) — external participants descoped

`decision-queue.md:24`: *"it's a personal project; I will share it once it's perfect."* Handoff
point 8's participant clause is spent. Your own use remains the validation.

---

## 3. What the research settled

`design/research/professional-workflow-conformance.md` — R15/R16, mechanical/code/desk arms `[V]`,
harness retained at `tools/r15-r16-professional-workflow-harness/`.

| finding | evidence | grade |
|---|---|---|
| No separate coach engine, streamer evidence service, or per-viewer truth path is needed | dossier §Verdict, :10-12 | `[V]` |
| The overlay reads shared run/session state only; no evidence or provider query path | dossier :14-19, :63-64 | `[V]` |
| 24-cell matrix (`stream|academy|match` × `solo|host|participant|spectator` × closed/open); the **permission record is byte-identical across all three live kinds** | dossier :53-59 | `[V]` |
| Vote intake is authenticated, bounded and attributed: adapter must hold a run grant (`live-session.ts:68-70`), only the configured adapter may supply a `voterKey` (`:212`), key ≤128 chars, namespace `chat:<adapterLearnerId>:<key>` (`:214`; the middle segment is the adapter's learner id, not an adapter *name* — a drift from how both the handoff and `casting.md:114` write it), capacity 50,000 (`:217`), 2–8 options at `:197`, 15–600 s at `:198`, per-option legality at `:199`. Storage constrains the namespace too (`storage.ts:4043`); relayed counts are computed server-side over `voter_key LIKE 'chat:%'` (`storage.ts:3204`) and rendered with *"Tabiya cannot verify chat identities"* (`live-vote.ts:6-8`) | verified at HEAD | `[V]` |
| No Twitch/YouTube/OAuth bridge and **no editorial delay mechanism** exist; the 2-second interval is transport (`App.svelte:340-345`, `2_000`) | verified at HEAD; `docs/live-sessions.md` contains zero occurrences of *delay* | `[V]` |
| Async classroom work is fully specified by the accepted Teacher RFC: roster addressing separate from per-run consent, no class-wide progress or weakness dashboard | dossier :23-26 | `[V]` |
| D80 match-seat asymmetry (a host-seated match player outranks the participant-seated opponent) is real and **owned by `teacher-surface`, not O11** | dossier :31-33, :130 | `[V]` |

---

## 4. What has changed since the handoff — four items, three of them decisive

The handoff is dated 2026-08-21. Everything below landed after it.

### 4.1 The Academy profile SHIPPED. Handoff point 2 is moot.

`rfc/intent-presets.md` (accepted 2026-08-22, implementing) specified the seventh workflow context
and it landed the same day in `3b95ff3 feat: compile intent preset foundations`. Verified at HEAD
via `git show HEAD:`:

- `packages/runtime/src/presets.ts:5-7` — `WORKFLOW_CONTEXTS` = `pack, position, imported, match,
  stream, academy, onramp, campaign` (**eight**, including `academy`);
- `presets.ts:47` — `{ id: "academy", defaultPreset: "guided", allowedPresets: ["quiet","guided",
  "theory_only"], moduleCeiling: except("blunder_prevention","full_inspector") }`;
- `presets.ts:114` — `if (input.liveKind === "academy") return "academy";`
- `apps/web/src/lib/assistance-preference.ts:12,18-19` — its own `PROFILE_DEFAULTS` entry and its
  own keys `tabiya.assistance.v1.academy` / `tabiya.workflow.v1.academy`.

[[D636]]'s first half (`design/BACKLOG.md:232`, *"`SessionKind` includes `academy`, but
`ASSISTANCE_PROFILES` does not"*) **is fixed at HEAD.** The ledger row is stale.

**One clause of the handoff was never true.** Point 2 ends: *"This amends the accepted Teacher RFC's
older refusal of a seventh profile."* The archived RFC refused something else. `rfc/archive/
teacher-surface.md:1350-1354` refuses a **fourth `LIVE_SESSION_KINDS` member (`classroom`)** — *"a
classroom pack night is an ordinary `academy` session that a classroom happens to own"* — and names
the seventh profile only as its incidental consequence. `LIVE_SESSION_KINDS` is still three members
at HEAD (`packages/runtime/src/types.ts:38`) while profiles are now eight, so **the academy profile
landed without touching that refusal and no amendment was ever required.** The same RFC hands this
surface over explicitly at `:1368-1374`: *"the six profiles ship the permission half of per-context
assistance and not the defaults half. That is an owner-tier design gap… it belongs to whoever next
owns that surface."* O11/F5 is that surface. **Nothing here is a revocation of your Teacher
ruling** — which is what the handoff's point 8 was written to protect against.

**One live defect the Academy landing left behind, flagged not ruled.** The two default layers
disagree: `presets.ts:47` gives academy `defaultPreset: "guided"`, while
`apps/web/src/lib/assistance-preference.ts:12` gives it `PROFILE_DEFAULTS.academy =
SILENT_ASSISTANCE` — only `onramp` (`:13`) carries a non-silent assistance default. A coached
session therefore defaults to the *guided preset* and *silent assistance* simultaneously. That is a
[[D636]]-shaped bug in the layer above it, and it belongs in the ledger and to F5, not in this
ruling.

**And the shipped ceiling is narrower than the handoff recommends.** Handoff point 3 says direct
moves, PVs and proactive prevention *"require an explicit Support/Analyze selection"*. At HEAD
Academy admits **neither** — `support` and `analysis` are refused presets, and both
`blunder_prevention` and `full_inspector` are off the ceiling, with a stated reason
(`intent-presets.md:148`: *"the coach relays; the participant's own inspector waits for the review
surface"*). That gap is the one real coach-side fork left — §6 fork A.

### 4.2 The Teacher RFC was IMPLEMENTED and ARCHIVED. Handoff points 4 and 8 are spent.

[[D703]] is **✅ closed 2026-08-22** (`design/BACKLOG.md:626`): *"Closed 2026-08-22 by implementing
`teacher-surface`: the accepted RFC was executable despite the later composition research, and the
classroom/review surface now ships."* Commit `24e3379 feat: ship classroom review surface`; the RFC
now lives at `rfc/archive/teacher-surface.md`. The dossier's §5 path cite (`rfc/teacher-surface.md`)
has drifted.

Handoff point 8 (*"proceed with accepted Teacher implementation"*) describes work already done.
Handoff point 4 (*"retain the accepted Teacher RFC exactly"*) describes shipped behaviour.

### 4.3 `rfc/casting.md` landed 2026-08-23 and specifies most of handoff point 5.

`rfc/casting.md` (`2f82710`) already fixes, as an RFC in the register:

- **the composition, measured** — five of six parts ship: `stream` kind (`types.ts:38`), session over
  any readable `runId` (`live-session.ts:53,90`), the `stream` context (`presets.ts:46`), the overlay
  route (casting.md cites `App.svelte:1073-1075`; re-verified here as route grammar at
  `router.ts:17,58,62,72` and render at `App.svelte:1075`), the marks relay (`live-marks.ts:6`), the
  full vote machinery (§2 table);
- **a closed render list** (§5, seven items) with criterion 4 asserting set-equality against an
  exported constant;
- **the liveness guard** `sourceGameLive` — the only genuinely missing part; `grep -rn
  "sourceGameLive" apps packages` → **0 matches** at HEAD;
- **votes refused while live** (§6) — the fail-closed default your [[D1291]] delay ruling now sits on;
- **host and viewer share one ceiling while the source is live** (§3.3) — see §6 fork B;
- **the adapter boundary** as a refusal: *"A new evidence mode for casting — [[D705]] — compositions,
  not modes"* (§8).

**So handoff point 5 ("ship the current overlay as 1.0") and point 6 ("generic adapter boundary")
are RFC content, not owner content.** What is left of point 5 for you is the delay parameter (§6
fork C).

**But casting rests on one thing O11 has not given it, and says otherwise.** `rfc/casting.md:87`
opens its specification with *"[[D705]] **ruled** the shape"*, repeats it as a refusal at `:268`,
and `rfc/live-following.md:381` says *"[[D705]] **ruled** that casting is 'explicit workflow
compositions, not new evidence modes'"*. **[[D705]] is a 💡 idea row, not a ruling**
(`design/BACKLOG.md:628`), and its status cell points at `professional-workflows/o11-handoff.md` —
this decision. So the authority chain resolves to the unruled recommendation of the very handoff
O11 exists to rule on. This is the same defect a cross-review landed against `social-play.md`
today (`6fdbea8`, *"the scope fence cites rulings that do not exist"*), reaching a second RFC by the
same route.

**That is what makes clause 1 of §5 load-bearing rather than ceremonial.** Casting's lane existence
is settled ([[D1272]]); its *premise* — compositions, never new evidence modes — is not, and two
active RFCs are already written as though it were.

### 4.4 `rfc/social-play.md` landed 2026-08-23 and drew the OAuth boundary itself.

`rfc/social-play.md:419-434` (§6.3), with the ledger row already written
(`design/BACKLOG.md:1639`, [[D1349]] 💡 open):

> `live-following.md:74` fences out *"Chat bridge, Twitch/YouTube/OAuth integration"* […] Those are
> a **chat** credential for a **streaming platform**, owned by the casting lane. This RFC's OAuth is
> a **chess-network** credential for a **game provider**. They share a word and nothing else:
> different provider, different scopes, different failure modes, different surface. Neither lane may
> implement the other's, and Discharge D1's operational contract covers both under one secrets story
> without merging them.

**The collision in the task brief is accurate, and it is already correctly drawn.** Verified: the
casting-side credential authorises reading a *chat* stream and mapping tallies into the bounded vote
API (`live-session.ts:68-70,212-217`); the social-play-side credential carries the exact scopes
`challengeCreate` / `boardGameStream` / `gamePgn` and a learner-revocation story
(`social-play.md:310-323`, §3.6). Different grant, different revocation, different failure mode.

**Recommendation: O11 should NOT settle this boundary — it should ratify it and stop.** Both lanes
have written the clause; a third statement in the decision queue creates the split-surface problem
[[D1261]] was opened to fix. The only owner-tier residue is the *release-platform* obligation
(social-play Discharge D1) that one secrets story covers both without merging them.

### 4.5 One stale statement worth fixing, in exactly the shape [[D1030]] names

`rfc/live-following.md:46,70,536,544` and its register row `rfc/README.md:37` still say casting is
*"blocked on the B5 ruling ([[D1212]])"* and mark that question **acceptance-blocking**. [[D1272]]
dissolved it on 2026-08-23. `rfc/casting.md:275` says so; `live-following.md` was not amended.
Likewise `rfc/casting.md`'s Discharges table still shows **D3 undischarged** although [[D1291]]
discharged it. **Both are claude's amendments to write, not decisions for you** — flagged here only
so you are not asked for a ruling you already gave.

---

## 5. The recommendation, as clauses

Rule these six; the other two handoff points are withdrawn as already-settled.

1. **Shared-truth workflow presets — and this is the clause that actually needs your signature.**
   Coach and Streamer are workflow presets over the shared manifest, run disclosure and modules.
   **No per-viewer evidence fork, no coach-only classifier or LLM truth.** [[D705]] states this and
   [[D705]] is an idea row; `casting.md:87,268` and `live-following.md:381` already cite it as a
   ruling (§4.3). Ruling it converts a circular citation into a real one; declining to rule it means
   two active RFCs need their premise re-sourced before acceptance.
2. **The Academy profile is ratified as shipped, not commissioned.** `academy` is a first-class
   workflow context with `defaultPreset: "guided"`, allowed presets `quiet | guided | theory_only`,
   and `blunder_prevention` + `full_inspector` off its ceiling (`presets.ts:47`). This settles
   [[D636]]'s first half; the ledger row should be flipped rather than re-opened. **It amends
   nothing in the Teacher RFC** — that refusal was about a `classroom` session kind (§4.1). Subject
   to fork A.
3. **Review Submission is ratified as shipped.** The archived `teacher-surface` contract stands:
   finished, disclosed, learner-submitted run; the reviewing teacher reaches the learner/host rail
   only; **no ambient history, no progress mining, no grading, no class weakness dashboard.**
   [[D703]] is closed; nothing here reopens it.
4. **Streamer composition is `rfc/casting.md`'s, not O11's.** O11 ratifies the boundary — casting is
   a separate surface that consumes the live-games mechanic ([[D1272]]) — and asserts nothing about
   its internals. Host assistance may exist on the host screen but is never added to the overlay
   automatically.
5. **Adapter boundary, ratified and left generic.** Core accepts only the existing authenticated,
   bounded, attributed tally API. Provider-specific Twitch/YouTube bridges own credentials and
   moderation as optional integrations outside the run core; **raw chat is never a core data plane.**
   The two OAuth stories stay in their own lanes per social-play §6.3 / [[D1349]]; one secrets story
   covers both without merging them.
6. **Delay posture, corrected to match your own later ruling.** *Replaces handoff point 7.* Tabiya
   ships **no editorial delay over the evidence plane** — the run disclosure barrier governs
   evidence and the 2-second poll is transport. **The vote channel is the exception you already
   ruled**: casting votes run at an owner-configurable delay behind the tip ([[D1291]]), with the
   fail-closed live refusal as the default. Competitive/public-event delay remains R17/O12.

---

## 6. The genuine choice points

Three. Everything else in the handoff is settled by a prior ruling or by a landing.

### Fork A — Academy's shipped ceiling is narrower than the handoff proposed

| option | what it means | cost |
|---|---|---|
| **A1 — confirm as shipped (recommended)** | Academy admits `quiet`/`guided`/`theory_only` only; no Support, no Analyze, no full inspector for the participant. A coach who wants engine lines uses the review surface after disclosure | Costs nothing today. Means a coach cannot open an inspector *inside* a live academy session — they relay, or they wait for Review |
| **A2 — widen to the handoff's wording** | Academy also admits Support/Analyze by explicit selection within the session ceiling | Requires an `intent-presets` amendment and moves the 28/12 admitted/refused grid (`presets.ts:96-99`), which is asserted at module load. Also reopens whether a *participant* may hold an inspector while the coach is teaching |

The shipped narrower form has a written rationale (`intent-presets.md:148`); the handoff's wider
form has none beyond generality. **Evidence does not discriminate — this is a taste call about what
a coached session feels like.** If you pick A1, say so, because the handoff's point 3 currently
reads as authorizing A2.

### Fork B — does the host keep an assistance tier above the viewer during a live cast?

`docs/live-sessions.md` records an accepted limitation, quoted at `rfc/casting.md:163-166`:
*"A streamer cannot be forced to play blind while their audience sees more evidence… it does not
pretend to prevent a host from cheating on themselves."* `intent-presets.md:149` bakes that
reasoning into the `stream` ceiling's rationale — it admits `analysis` *because* the streamer may
cheat on themselves.

`rfc/casting.md:171-174` **narrows it** for live sources only: *"while `sourceGameLive`, the host's
evidence ceiling and the viewer's are the same ceiling. There is no host tier."*

| option | cost |
|---|---|
| **B1 — accept the narrowing (recommended)** | Costs a streamer their private analysis drawer while casting a game two players are still playing. That is the point: the board is somebody else's live game. Releases automatically when the source game finishes |
| **B2 — keep the host tier** | Cheaper for the streamer, and consistent with the shipped `stream` ceiling. But it makes our product the assistance device in an ongoing tournament game, visible to a broadcast |

This is a **law-8-adjacent honesty call**, so it is yours rather than the RFC's. It is the one
substantive thing in the casting lane that is not already decided.

### Fork C — where does the [[D1291]] delay parameter live?

Your ruling says the caster sets the delay. `rfc/casting.md`'s register row claims **nothing
versioned** and names the exception explicitly: *"What would change it: persisting a per-cast delay
parameter (Discharge D3)"* (`rfc/README.md:38`).

| option | cost |
|---|---|
| **C1 — per-cast persisted parameter (recommended)** | Matches *"adjustable per event or per organiser's rules"* exactly. Costs `casting.md` its claims-nothing posture: it acquires a schema claim and a migration position |
| **C2 — session-scoped, unpersisted** | Keeps casting schema-free; the caster re-sets the delay every session and it is lost on restart. Contradicts *"per event or per organiser's rules"* in practice |

**Only C1 is faithful to the ruling as recorded.** Flagged rather than assumed because it is the
single line-item that changes what `casting.md` costs to land.

---

## 7. What turns on it

- **Almost nothing is blocked on this ruling that was blocked yesterday.** `teacher-surface`
  shipped, `intent-presets` shipped the Academy profile, and `casting.md` is drafted. O11's real
  function now is to **ratify** — to put the shipped compositions into intent so nobody re-derives
  them, and to correct one clause the evidence base got wrong before your [[D1291]] ruling landed.
- **The exception is clause 1.** `rfc/casting.md`'s acceptance depends on the compositions-not-modes
  premise being a ruling. Today it cites an idea row that cites this memo (§4.3). One sentence from
  you closes the loop; without it a cross-reviewer will return casting on exactly the ground
  `6fdbea8` returned social-play.
- **F11 (professional workflow view binding)** is the only execution node genuinely gated: it sits
  at `execution-queue.md:105` behind named consumer nodes and cannot bind Academy or coach views
  until forks A and B are settled.
- **`rfc/casting.md`'s landing shape** turns on fork C. Fork B changes its §3.3 and criterion 7.
- **Two amendments are owed regardless of how you rule**, and both are claude's under the ruling
  already given: `live-following.md`'s four B5-blocked statements (`:46,70,536,544`) and its
  register row `rfc/README.md:37`, stale since [[D1272]]; and `casting.md`'s Discharge D3, discharged
  by [[D1291]] and unrecorded.
- **[[D636]] and [[D1349]] want ledger dispositions**, not decisions: D636's first half is fixed at
  HEAD; D1349 is correctly owned by `social-play` §6.3. **One new row is owed** — the academy
  default-layer disagreement in §4.1 — and it goes to F5, not to you.
- **`rfc/archive/teacher-surface.md`'s "six exhaustive members" recitations** (`:1336`, `:1447`,
  `:1896`) are stale against the eight at `presets.ts:5-8`. It is archived and immutable in practice;
  the correction belongs in `intent-presets` or the register, not in a reopened RFC.

---

## 8. Provenance of this memo

Every claim above was re-derived at HEAD `36074c7` on 2026-08-23. Code claims were read through
`git show HEAD:` because codex holds `apps/` dirty. Files read in full: `rfc/casting.md`,
`rfc/social-play.md`, `design/research/professional-workflow-conformance.md`,
`professional-workflows/o11-handoff.md` and `plan.md`; `rfc/live-following.md` §§1, 5 and its
scope table; `packages/runtime/src/presets.ts`; `apps/web/src/lib/assistance-preference.ts`;
`apps/server/src/live-session.ts` vote paths; `rfc/archive/teacher-surface.md` §§ refusals,
assignment/submission and the six-profile passages; `rfc/intent-presets.md` §context table.

**Claims checked and found not-true, listed so they are not re-inherited:** handoff point 2's *"this
amends the accepted Teacher RFC's older refusal of a seventh profile"* (§4.1 — the refusal was a
session kind); handoff point 7's *"no Tabiya editorial delay for 1.0 Stream"* (§2.2 — superseded by
[[D1291]] for the vote channel); the queue row's live citation of [[D703]] and of
`rfc/teacher-surface.md` (§4.2). Everything else in the handoff verified TRUE at HEAD, with the
`chat:` namespace drift noted in §3.

**Corrections this memo makes to the queue row at `decision-queue.md:48`:** its evidence column
cites [[D703]] as live (it closed 2026-08-22) and *"accepted `teacher-surface`"* at a path that has
moved to `rfc/archive/`; its ruling column asks for an *"explicit Academy profile"* that shipped
2026-08-22 and a *"no-editorial-delay 1.0 posture"* that [[D1291]] partly overrode 2026-08-23.

This memo writes no intent, no RFC and no ledger row (law 5).
