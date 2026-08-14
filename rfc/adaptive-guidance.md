# RFC: Adaptive guidance — live classification, assistance configuration, pivotal markers, and the voice contract

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-14
- **Design refs:** `design/05-in-run-experience.md` §3 (the ladder, lines 54-85), §3a (silence and
  the forward/backward detector table, lines 87-143), §3b (guided mode and the four Clippy
  failures, lines 145-188), §3b-i (the LLM-as-voice contract this RFC pins, lines 190-233),
  §4 (what varies by context, lines 235-257), §5a (pivotal moments without an author, lines
  349-373), §5b (endgame steering by named technique, lines 375-390), §6 questions 3 and 4
  (lines 406-412); `design/03-product-breadth.md` §Adaptive guidance (lines 180-201), gate
  **B10** (line 275), program item #10 (lines 383-385), the passive-marker owner ruling
  (lines 315-321); `design/04-content-architecture.md` §What line content is still irreducible
  for (line 100) and §4 Endgames (line 259) for the technique names
- **Exploration gate:** breadth sequencing ruling 2026-08-11 + exploration gate opened by owner
  ruling 2026-08-12 (`planning/exploration/log.md`)
- **Depends on:** **`rfc/structural-reading.md`** (B9, implementing) — the twelve feature
  predicates, `structuralReading`/`structuralDelta` (`packages/runtime/src/structure.ts:248,283`),
  the structure catalogue, and the no-valence sentence rule are the vocabulary this RFC
  classifies and speaks with; **`rfc/shape-library.md`** (B11, being drafted in parallel) — plan
  classes for detected structures and technique bodies for named endgame techniques are shape
  entries. This RFC **names that dependency and reserves the seam** (§5b, §6a); it does not
  specify the shape library, and every surface here renders honest absence until it lands.
  Implemented and archived: `rfc/archive/pack-optional-runs.md` (position sessions),
  `rfc/archive/explanation-grounds.md` (evidence-ref rendering and the disclosure gates),
  `rfc/archive/terminal-outcome-events.md` and `rfc/archive/outcome-drill-grading.md` (the
  grading endgame steering defers to), `rfc/archive/live-session-platform.md` (roles),
  `rfc/archive/app-shell.md` (routes and capabilities)
- **Parent / amends:** **`rfc/archive/app-shell.md`** (the capability registry gains a
  `llm: "none" | "external"` provider state and the `justPlay`/`fromPosition` surfaces stop
  being hard-coded `"unavailable-here"`), **`rfc/archive/drill-client.md`** (the timeline gains
  passive marker annotations and the run screen gains the assistance control),
  **`rfc/archive/explanation-grounds.md`** (two disclosure-gated read endpoints join the
  existing gate; no change to what is withheld), **`rfc/archive/pack-optional-runs.md`** (the
  client gains the Just Play entry the server already supports),
  **`rfc/archive/line-drill-theory-grading.md`** (`#humanCommon` selection gains a MultiPV
  report request; the selected move is unchanged)
- **Supersedes / superseded by:** —
- **Migration:** **none, and that is normative.** Run schema stays **0.8**
  (`packages/runtime/src/build-info.ts:1`) and `STORAGE_VERSION` stays **9**
  (`rfc/README.md` migration register). §1d: a classification, a marker, and an assistance
  preference are all pure functions or preferences over the persisted record; persisting any of
  them would create a second source of truth that can drift from the run. B9's §1c law, one gate
  up.
- **Pack schema:** **unchanged, 0.10.** This RFC adds no authored field. The author's phase is
  the shipped `phase` (`packages/schema/src/drill-pack/types.ts:24-25`,
  `schemas/drill_pack.schema.json:24-26`); assistance configuration is deliberately not a pack
  field (§3e).
- **Baselines, measured 2026-08-14:** 321 unit tests across 55 files (`pnpm vitest run`; 320
  pass — the one failure is B9's latency-envelope recording at
  `packages/runtime/src/structure.test.ts:95`, 103.5 ms against the 100 ms worry threshold on
  this machine, a pre-existing machine-speed flake owned by the B9 implementation, not touched
  here). Pack schema 0.10 and migration 9 verified against `rfc/README.md`'s registers; this
  RFC claims no number in either register.
- **Planning:** `planning/adaptive-guidance/` (opened at implementation)

## Summary

B9 gave the product a vocabulary: twelve deterministic feature predicates, a reading, a delta,
and a four-entry structure catalogue, all closed-by-default and silent. Nothing yet *uses* that
vocabulary while a game is being played. There is no phase on the board (only on the pack
card), no moment marked on a timeline that no author annotated, no statement of what assistance
a context permits, and the LLM-voice contract that `design/05` §3b-i corrected on 2026-08-14 —
"this section states the intended contract … B10-RFC detail, not shipped behaviour" — is
pinned nowhere.

This RFC ships the four things gate B10 names, each as a pure function over data the system
already persists:

1. **Live phase classification** — `opening | middlegame | endgame | unclear` from material and
   development arithmetic, with declared band constants, honest abstention as a first-class
   output, and the standing rule that an author's declaration always outranks the detector
   inside a curated pack.
2. **Assistance configuration per session context** — one typed object, one permission function
   used by both the client and the server, server enforcement exactly where withholding is real
   (the two new disclosure-gated endpoints), client preference everywhere it is not, and the
   streamer ruling documented rather than engineered.
3. **Author-free pivotal markers** — irreversibility, phase change, recorded Maia divergence,
   and legal-option collapse, each a fact-stating detector, each delivered as a passive timeline
   marker the player may open (the settled owner ruling, `design/03:315-321`), never an
   interruption. Engine eval swing stays excluded live and ships as the backward
   "where did it turn?" reading on the already-disclosure-gated review surface.
4. **Endgame steering by named technique** — a material-census endgame-type recognizer and a
   closed technique index that can say *"rook and pawn versus rook: the named techniques are
   Lucena, Philidor and Vancura"* — and can never say "play Rc8", enforced by the same
   banned-form machinery B9 established, extended with a no-move-token rule.

On top of them it pins **the LLM-as-voice contract**: the evidence packet assembled first, the
machine check that rejects any output introducing a chess noun, square, move or judgement
absent from the packet, the provider seam behind `capabilities.providers.llm` (today literally
`"none"`, `apps/server/src/capabilities.ts:50,104,114`), and the degradation rule — provider
absent means the identical claim in the deterministic sentence, minus only the personality.

## Motivation

### 1. What exists, verified seam by seam

Every capability this RFC builds on was verified in the shipped tree, because the mirror risk
`design/03:306-309` names — a slot that reads exactly like a working feature — cuts both ways:
claiming a seam that is not there kills a draft as surely as re-shipping one that is.

- **The rung-0 layer is real and client-side.** `structuralReading(fen)` runs in the browser on
  every displayed node already (`apps/web/src/lib/DrillScreen.svelte:187`), rendered behind the
  closed "Structural reading" control (`DrillScreen.svelte:470-471`). The observation and match
  types this RFC consumes are `StructuralObservation` (`packages/runtime/src/structure.ts:46-55`),
  `StructureMatch` (`:57-61`) and `StructuralReading` (`:63-68`).
- **The Maia distribution is persisted, and it is public.** `opponent.move_selected` events
  carry a full `OpponentSelection` (`packages/runtime/src/types.ts:78-83,145-153`) whose
  optional `candidates` are `{moveUci, mass?, rank}` (`:63-67`). Mass is parsed only from a
  `policy` token in the engine's info lines (`apps/server/src/opponent-selector.ts:225-227`),
  so Maia selections can carry it and Stockfish selections cannot. Crucially, the pre-disclosure
  event barrier withholds `evidence.attached` and engine-grounded objective transitions and
  **nothing else** (`apps/server/src/feedback-policy.ts:26-32,34-52`) — opponent selections,
  candidates and mass included, already reach the client during committed play
  (`docs/explanation-grounds.md:224` records the same fact). A detector reading them adds no
  disclosure that does not already exist.
- **One gap in the supply:** `#humanCommon` requests no MultiPV
  (`opponent-selector.ts:427-435`), so a `human_common` selection may persist only the moved
  candidate. `#theoryStrict` already requests `MultiPV ≥ 8` from the same Maia sidecar
  (`:454-463`), so the report capability exists; §4d closes the gap without touching move
  selection (`bestMove` reads the `bestmove` line, `:242-249`, and is MultiPV-independent).
- **Disclosure machinery is complete and reusable.** `feedbackDisclosed`
  (`packages/runtime/src/feedback.ts:3-18`) and the position-session reveal-then-close cycle
  `feedbackDeliveryOpen` (`:20-27`) gate nodes, events, and `compare()`
  (`apps/server/src/service.ts:438-441`). The two endpoints this RFC adds sit behind the same
  functions; no new withholding system is invented.
- **Position sessions exist server-side only.** `POST /runs` accepts
  `session.kind: "position"` with a mandatory `attempt_end` feedback policy and a
  `human_common | strong_engine` opponent (`apps/server/src/rest.ts:264-295`). The web client
  creates only pack runs (`apps/web/src/lib/session-controller.ts:223-227`), the router has no
  pack-less entry (`apps/web/src/lib/router.ts:20-29`), and the capability registry says so
  honestly: `justPlay` and `fromPosition` are hard-coded `"unavailable-here"`
  (`apps/server/src/capabilities.ts:120-127`). B10's acceptance scenario is a Just Play game,
  so this RFC ships the minimal client entry (§8a) and flips those two rows on real capability.
- **The LLM provider is a typed absence.** `CapabilityProviders.llm` is the literal type
  `"none"` (`capabilities.ts:50`), constructed as `"none"` in both engine modes (`:104,114`),
  and mirrored in the client (`apps/web/src/lib/api.ts:215-218`). §6d widens the type and
  specifies the seam without building a provider.
- **The timeline is one projection.** `timelineEntries(run, pack)`
  (`apps/web/src/lib/screen-model.ts:112-132`) maps the active path to entries carrying
  checkpoint refs. Markers extend this projection; they do not add an event type.

### 2. Why nothing here is persisted

Three of the four detectors are pure functions of FENs already in the run; the fourth reads an
event already in the run. Persisting their output would create exactly the drift D21
(`design/BACKLOG.md:131`) documents for segments: the shipped segment *producer* and segment
*deriver* disagree about whether a zero-length segment exists, because the same truth lives in
two places. Phase-change markers therefore deliberately do **not** derive from
`segment.completed` or any other event — one pure function, evaluated wherever needed, is the
whole storage story. The same reasoning keeps the assistance preference out of the database
(§3e) and the voice output out of the run log (§6b): nothing B10 computes is chess truth the
run does not already contain.

### 3. Scope boundary

Explicitly outside, each with the reason:

- **Shape entries, plan prose, technique bodies** — B11 (`rfc/shape-library.md`, drafted in
  parallel). This RFC consumes shape entries through one typed reference (§5b, §6a) and renders
  honest absence where none resolves. It defines no shape trigger, no entry format, no
  authoring path.
- **Band-shaped guided-mode defaults.** `design/05` §3b wants guided mode on by default for the
  1000–1400 on-ramp. No learner strength signal exists anywhere in the system —
  `targetElo` (`packages/runtime/src/types.ts:52-57`) is the *opponent's* level — so a default
  keyed to the learner's band is not computable from anything persisted. The default here is
  off-everywhere-until-chosen (§3b); banding belongs to whichever contract first records a
  learner strength, and shipping a guess before then would be a default chosen silently.
- **Live engine or tablebase detectors.** Eval swing stays excluded as a forward detector
  (`design/05` §3a, lines 137-140, normative here as §4f). No rung-1/2 source fires during
  committed play.
- **Per-viewer spectator assistance.** The owner ruled *document, don't engineer* for the
  streamed session (§3d). Spectators receive the projections the live platform already ships.
- **Learner-rating-aware or history-aware significance.** Every detector here states a fact;
  which facts *matter to this learner* is B7-era personalization and rungs 2–5 territory.

## Specification

### 1. The four laws

**1a. Detection is cheap and exact within its declared scope; significance is judged and
attributed.** Inherited from B9 §1a, normative across every section below. A marker, a phase, a
technique name and a voice line each state a detection under a named convention; none asserts
that the detection matters here.

**1b. A guided sentence names a pattern and never evaluates this position.** The
permitted/forbidden table of `design/05` §3b (lines 158-168) is normative. Its machine-checkable
form: every sentence this RFC introduces passes B9's banned-form test (§6b of
`rfc/structural-reading.md`) **and** a new no-move-token rule — no SAN-shaped or UCI-shaped
token in any guided, steering, or marker sentence (criterion 10).

**1c. Detected is never authoritative over authored.** Inside a curated pack, an authored
declaration — the pack's `phase`, a checkpoint, a leg transition — is presented as the pack's
claim; the detector's output is presented as Tabiya's convention, separately attributed, and
may never move, rename, suppress or replace an authored beat (§2d).

**1d. Nothing is persisted, nothing interrupts.** No run-schema change, no migration, no new
table, no cache. Every marker is a passive timeline annotation the player may open
(`design/03:315-321`); nothing auto-opens, nothing modals, nothing badges a closed control.

### 2. Live phase classification

#### 2a. Taxonomy and measurements

```ts
// packages/runtime/src/phase.ts
export type DetectedPhase = "opening" | "middlegame" | "endgame" | "unclear";

export interface PhaseReading {
  readonly fen: string;
  readonly phase: DetectedPhase;
  readonly material: { readonly white: number; readonly black: number };
  readonly undevelopedMinors: { readonly white: number; readonly black: number };
  readonly provenanceNote: string; // identifies the Tabiya band convention
}

export function classifyPhase(fen: string): PhaseReading;
```

The taxonomy deliberately matches the three authored phases of `PACK_PHASES`
(`packages/schema/src/drill-pack/types.ts:24-25`) plus the abstention value; `cross_phase` is a
property of a pack's span, not of a position, and is not a classifier output.

Two measurements, both board arithmetic on the same chessops surface `structure.ts` already
uses:

- `material(C)` — the sum over `C`'s non-pawn, non-king pieces of Q=9, R=5, B=3, N=3.
- `undeveloped(C)` — the count of `C`'s knights and bishops standing on their game-start squares
  (`b1, g1, c1, f1` for White; `b8, g8, c8, f8` for Black). 0–4.

Castling rights are deliberately **not** an input: a side that never castles retains its rights
deep into positions no one calls an opening, so rights do not separate phases; using them would
smuggle a guess into arithmetic.

#### 2b. Bands — the Tabiya phase convention

Let `M = max(material(white), material(black))` and
`U = undeveloped(white) + undeveloped(black)`.

| Condition | Phase |
|---|---|
| `M ≤ 13` | **endgame** |
| `14 ≤ M ≤ 17` | **unclear** |
| `M ≥ 18` and `U ≥ 5` | **opening** |
| `M ≥ 18` and `U ≤ 2` | **middlegame** |
| `M ≥ 18` and `U ∈ {3, 4}` | **unclear** |

Every constant is a declared convention, in the exact sense B9 established for its strict
outpost detector: exact within the stated convention, never presented as uncontested chess
truth, self-identifying in every rendered sentence ("Tabiya's phase bands"). Sanity anchors,
each a test row in criterion 1: the initial position is `M=31, U=8` → opening; a developed
queens-on position is middlegame; K+R+P vs K+R is `M=5` → endgame; two rooks and a bishop each
(`M=13`) is an endgame while queen-and-rook each (`M=14`) abstains — the heavy-piece
transition zone is genuinely ambiguous and the classifier says so instead of picking a side.

Endgame is decided by material alone — development does not apply once the board has emptied
(minor pieces standing on home squares in a six-piece position do not make it an opening).

#### 2c. Abstention is the answer to design question 3

`design/05` §6 question 3 asks whether a phase classifier may be wrong out loud, and worries
that frequent "unclear" trains people to ignore the rail. The resolution shipped here, on
grounds rather than taste:

- The classifier **never guesses**: inside a band gap the output is `unclear`, a first-class
  value with its own rendering ("Tabiya's phase bands do not classify this position"), not an
  error and not a low-confidence middlegame.
- The abstention bands are **narrow by construction** (four material points, two development
  counts), so `unclear` is the transition zone, not the steady state.
- The **marker** layer absorbs the churn: a phase-change marker fires only on a
  definite→definite change (§4c), skipping any `unclear` interlude, so abstention never sprays
  the timeline. The rail can abstain often without the timeline ever doing so.

Promoting this resolution into `design/05` is a BACKLOG row the implementer proposes
(`AGENTS.md` law 5), recorded in Deviations.

#### 2d. Authored beats detected, exactly

Where a run has a pack, the pack's `phase` field is the authored claim and renders as such:
"This pack declares: middlegame." The detector still runs — its output renders in the same
surface as "Detected (Tabiya's phase bands): endgame" when it differs — because showing both,
each attributed, is honest, while silently suppressing either would make one source
authoritative by omission. What law 1c forbids is stronger than display: the detected phase may
never gate, trigger, rename or reposition anything authored — checkpoints
(`checkpoint.reached`), leg transitions (`TrajectoryLeg`,
`packages/schema/src/drill-pack/types.ts:128-132`, which carries no phase field and needs
none), boundaries, or reveal scopes all remain exactly as their RFCs shipped them.

**D23 context** (`design/BACKLOG.md:129`): position-seeds emits packs without `phase`, so
machine-emitted candidates are invisible to phase-filtered Learn navigation. This RFC does not
fix the emitter (that is D23's own row); it does mean a pack without a declared phase gets the
detected classification of its start position, labeled detected, wherever a phase chip renders
— an honest fallback, never written into the document.

### 3. Assistance configuration per session context

#### 3a. The object

```ts
// packages/runtime/src/assistance.ts
export interface AssistanceConfig {
  readonly version: 1;
  readonly markers: "off" | "live";        // passive pivotal markers on the timeline (§4)
  readonly guided: "off" | "live";         // pattern-naming content inside an opened marker (§5, B11)
  readonly humanSplit: "off" | "on_request"; // learner-requested Maia distribution (§4d)
  readonly voice: "authored" | "persona";  // deterministic text vs provider re-voicing (§6)
}

export const SILENT_ASSISTANCE: AssistanceConfig = Object.freeze({
  version: 1, markers: "off", guided: "off", humanSplit: "off", voice: "authored",
});

export type AssistancePermission = "free" | "locked_off";

export interface AssistanceContext {
  readonly sessionKind: RunSessionKind;                 // "pack" | "position" (types.ts:36)
  readonly deliveryOpen: boolean;                       // feedbackDeliveryOpen(run) (feedback.ts:20-27)
  readonly role: "solo" | RunRole;                      // RUN_ROLES (apps/server/src/storage.ts:31-32)
}

export function permittedAssistance(
  context: AssistanceContext,
): Readonly<Record<keyof Omit<AssistanceConfig, "version">, AssistancePermission>>;
```

Fields that cannot vary are deliberately absent: the structural-reading posture
(closed-by-default, on request) is B9 §7's and is not re-owned here; the backward pivot (§4f)
rides `compare()`'s existing gate. A config field that only ever holds one value is a lie
waiting for someone to make it true.

#### 3b. The context table

Normative; `permittedAssistance` is its implementation and criterion 6 is the table verbatim.
The **default** everywhere is `SILENT_ASSISTANCE` — `design/05` §3a's ruling is the shipped
posture, and guided mode is a choice, never an onboarding state (§Scope boundary for why no
band default).

| Context | markers | guided | humanSplit | voice |
|---|---|---|---|---|
| Curated pack run (`sessionKind: "pack"`) | free, default off — a curated drill withholds by design, and the author's checkpoints are the intended moments; a learner who turns markers on gets detector annotations *additionally attributed*, never replacing authored beats (law 1c) | free, default off | **locked_off until `deliveryOpen`** — server-enforced (§3c) | free |
| Just Play / from position (`sessionKind: "position"`) | free, default off — silence is the default; the rail is on request | free, default off | on request **while `deliveryOpen`** — the position-session reveal opens it and the next committed move closes it again (`feedback.ts:20-27`), exactly the shipped cycle | free |
| Live session, `role: "host"` | free | free | same rule as the underlying run's `sessionKind` | free |
| Live session, `role: "participant" \| "spectator"` | free — markers derive from the public projection these roles already receive | free | **locked_off** — reveal is a write-side act and non-host roles hold no write control (`docs/live-sessions.md`) | free |

**The streamer ruling, documented and not engineered** (`design/05:249-252`): the host of a
streamed session may cheat on themselves — turn on markers, open readings, request the split
once revealed — using exactly the solo controls, because the host *is* the player. No
streamer-specific assistance surface, no per-viewer variant, no overlay assistance is built.
The overlay and spectator views continue to project run state as the live platform shipped
them; what the audience sees of the host's assistance is the host's business, which is what
"cheat on themselves" means.

#### 3c. Enforcement: one function, two call sites, and where it is real

`permittedAssistance` lives in `packages/runtime` and is called by **both** the client (to
render controls honestly, disabled-with-reason through the existing `HonestControl` pattern,
`apps/web/src/lib/CompareView.svelte:57-63`) and the server (to refuse). One implementation,
two call sites — the D4 lesson, again.

Enforcement is claimed **only where it is true**:

- **Server-enforced:** the two endpoints of §4d and §6d. `GET /runs/:id/human-split` refuses
  with `ASSISTANCE_WITHHELD` whenever `feedbackDeliveryOpen(run)` is false for the requesting
  context; `POST /runs/:id/voice` refuses with `VOICE_UNAVAILABLE` when no provider is
  configured. Both sit behind the existing identity boundary — this RFC adds no credential and
  no cookie surface; D24's transport-default row (`design/BACKLOG.md:130`) is unaffected and
  cited as the standing guarantee these endpoints inherit.
- **Client preference, stated as such:** markers and guided mode. Their inputs — FENs, legal
  moves, structural readings, and opponent selections — are all in the projection the client
  already legitimately receives during committed play (`feedback-policy.ts:26-52`; Motivation
  §1). A server "enforcement" of a computation the browser can perform from public data would
  be withholding theater, and this repo's convention (pin the encoding, state the truth) is to
  say so in the contract rather than pretend: **the durable withholding boundary remains
  exactly what `explanation-grounds` shipped — engine evidence and authored prose — and B10
  moves it by zero.**

#### 3d. Storage: a preference, stored as one

The learner's `AssistanceConfig` persists client-side (per surface, `localStorage`, versioned
by the `version` field), and is sent nowhere except as request parameters to the two gated
endpoints. It is not a run field, not an event, not a learner table row. A preference that can
never alter what the run says happened does not belong in the record of what happened (§Motivation
2); and the moment some future contract wants cross-device preferences, that RFC owns the
migration, with this object already versioned for it.

#### 3e. What the config is deliberately not

Not a pack field — an authored "assistance allowed here" knob would be a second withholding
system beside `feedbackPolicy` (`types.ts:21-22`), and it would live inside a document whose
`opponentPolicy` is already an open passthrough (D22, `design/BACKLOG.md:128`); B10 does not
add authored surface to a format with an open shape in the same neighbourhood. Not an
`opponentPolicy` key — same row, same reason. Not a `/settings` page control — `/settings`
remains the display-only residual B1 tracks (`design/03:266`), and parking a real control
there would silently claim that residual; the control lives in the run screen (§8c).

### 4. Author-free pivotal markers

#### 4a. The marker projection

```ts
// packages/runtime/src/pivotal.ts
export type PivotalKind =
  | "irreversibility"
  | "phase_change"
  | "human_divergence"
  | "option_collapse";

export interface PivotalMarker {
  readonly nodeId: string;
  readonly kind: PivotalKind;
  readonly detail: IrreversibilityDetail | PhaseChangeDetail | DivergenceDetail | CollapseDetail;
  readonly provenanceNote: string; // names the convention or the model identity
}

export function pivotalMarkers(run: DrillRun, branchId: string): readonly PivotalMarker[];
```

Pure over the run: FENs and moves from the branch path's nodes, plus `opponent.move_selected`
events for §4d. Markers annotate `timelineEntries` (`screen-model.ts:112-132`) — a dot on the
existing entry, in the timeline's existing order, one dot per marked node regardless of how
many kinds fired there (opening it lists all). Law 1d governs delivery: no auto-open, no modal,
no count anywhere but the dots themselves, and `markers: "off"` renders a timeline
byte-identical to today's. `design/05` §3a's forward/backward table (lines 137-140) is the
normative source: these four are the forward detectors; the backward detector is §4f and only
§4f.

#### 4b. Irreversibility (rung 0)

Three sub-kinds, matching `design/05` §5a's own enumeration ("a pawn break, a trade that
removes the last of a piece type, castling") rather than the far noisier "any pawn move or
capture" — the halfmove-clock notion of irreversibility is true of half the moves in a game and
would make the timeline confetti:

| Sub-kind | Fires exactly when |
|---|---|
| `castled` | The committed move is castling (king moves two files; covers both wings, both colours) |
| `last_of_role` | The committed move is a capture after which the captured colour has zero pieces of the captured role. `detail` carries colour and role; when the capture leaves **both** colours with zero queens it additionally sets `queensOff: true`, because "the queens have left the board" is the version of this fact players actually track |
| `pawn_break` | The committed move is by a pawn and either (i) it is a capture (including en passant), or (ii) after the move the moved pawn attacks at least one enemy pawn, and from its origin square it attacked none. Tabiya's convention for "a break": the move that creates or resolves pawn contact |

All computed from the parent/node FEN pair — the same two-position basis as B9's
`structuralDelta`. A quiet piece move fires nothing (criterion 3's negative case).

#### 4c. Phase change

Fires at the first node whose definite classification (§2) differs from the **last definite**
classification on the path — `unclear` interludes are skipped, never marked, and never reset
the comparison (§2c). `detail` carries `{from, to}` definite phases. Inside a pack run, law 1c
applies: the marker renders as Tabiya's detection alongside, never instead of, any authored
declaration.

#### 4d. Human divergence (rung 3, from the persisted record)

The detector reads what is already durable: at each node produced by an
`opponent.move_selected` whose `selection.candidates` carry `mass`
(`types.ts:63-67,78-83`), normalize the recorded masses to their own sum, and mark when — under
Tabiya's declared split convention —

> no candidate holds more than **0.50** of recorded mass, **and** at least **3** candidates
> each hold **≥ 0.15**.

That is `design/05` §5a's "players at your level split three ways here" made mechanical, and it
is a statement about the model's recorded distribution, never about chess: the sentence renders
the raw masses ("Maia-1500's recorded policy split: 31% / 24% / 19% of recorded mass"), names
the persisted engine identity (`selection.engine`, `types.ts:69-76`) and the run's `targetElo`,
and says "recorded distribution", because normalizing a truncated candidate list overstates
concentration and the sentence must not hide that scope.

**Abstention is structural:** no candidates, no masses, or
`policyModeApplied !== "human_common"` (Stockfish lines carry no `policy` token,
`opponent-selector.ts:225-227`) means no marker and **no claim of non-pivotality** — absence of
a marker is never a verdict that the moment was routine.

**Supply:** `#humanCommon` gains the same MultiPV report request `#theoryStrict` already makes
(`opponent-selector.ts:454-463`): `#maia(request, 8)`. This changes what the selection
*records*, not what it *selects* — the move comes from the engine's `bestmove` line
(`:242-249`), which is independent of how many info lines are reported. Criterion 4 asserts
selection invariance under the change against the mock engine, and the existing `test:maia`
integration suite (`apps/server/src/maia.maia.integration.ts`) covers the real sidecar.

**The learner-side question is an endpoint, not a detector.** "What do humans play *here*,
where I am to move?" is rung-3 material that names candidate moves, so during committed play it
is exactly what ADR-0006 withholds. It ships as `GET /runs/:id/human-split?nodeId=…`: gated by
`feedbackDeliveryOpen` (§3c), served from the opponent selector's existing Maia path with
MultiPV 8, rendered with full attribution, ephemeral (§1d — it grounds no objective and is
persisted nowhere), and it never produces a timeline marker, because it is the learner's
question, not a detection. Requires an opponent provider (`capabilities.providers.opponent`);
absent one, the control renders disabled with the reason, `HonestControl`-style.

#### 4e. Option collapse, redefined to keep its rung

`design/05` §3 (2026-08-14 scope correction, line 62) is blunt: "option-collapse needs
*reasonable* continuations, which is evaluation, so it is rung 2/3 unless redefined as raw
legal-move count." This RFC takes the redefinition, and takes it completely:

> **Option collapse is legal-continuation collapse.** The detector counts legal moves — chessops
> legal move generation, the arithmetic already underneath the board
> (`apps/web/src/lib/board-model.ts:64`) — and fires at a node where the side to move has
> **≤ 3** legal moves **and** that same side had **≥ 8** legal moves at its previous decision
> node on the path. `detail` carries both counts; `count = 1` renders as "forced".

Both constants are declared Tabiya conventions. The second condition is what makes this a
*collapse* detector rather than a scarcity detector: in a cramped ending where three legal
moves is the steady state, nothing collapsed and nothing fires — and it self-limits marker
density inside a forcing sequence, because after the first marked node the "previous ≥ 8" test
fails. The evaluated version — "reasonable continuations" — is **not a detector anywhere in
this RFC**, at any rung, in any mode; if some later contract wants it, it arrives as attributed
rung-2/3 evidence under its own RFC, not as a quiet upgrade to this one. Sentences state the
scope: "Three legal moves are available" — never "you have no good options."

#### 4f. Eval swing: backward only, and already gated

Forward exclusion is restated as normative (law inherited from `design/05` §3a): no live
detector reads an evaluation. Backward, the same signal is the honest answer to "where did it
turn?", and it ships as:

```ts
export function retrospectivePivot(
  comparison: BranchComparison, branchId: string,
): { readonly nodeId: string; readonly plyOffset: number; readonly delta: number } | null;
```

computed from the recorded evaluation entries the comparison payload already carries
(`docs/explanation-grounds.md` §Comparison payload) — the maximal absolute swing between
consecutive recorded evals on the branch. Because its input is `compare()`'s output, it
inherits the disclosure gate at `service.ts:438-441` with zero new enforcement: before reveal
the evidence arrays are empty and the function returns `null`, which renders as honest absence
("no recorded engine evaluation on this path"), also the answer whenever no eval evidence was
ever attached. It renders under the existing "Recorded engine evaluation" attribution, on
review surfaces only, and produces no timeline marker during play.

### 5. Endgame steering by named technique

#### 5a. The type recognizer: a material census

```ts
// packages/runtime/src/endgame.ts
export type EndgameTypeId =
  | "pawn" | "rook-and-pawn-vs-rook" | "rook" | "queen" | "minor";

export interface EndgameReading {
  readonly type: { readonly id: EndgameTypeId; readonly label: string } | null; // null = census abstains
  readonly techniques: readonly TechniqueRef[];
  readonly provenanceNote: string;
}

export function endgameReading(fen: string): EndgameReading | null; // null unless classifyPhase = endgame
```

The census applies only when §2 classifies `endgame`, and is exact multiset arithmetic over
non-pawn, non-king material:

| id | True exactly when |
|---|---|
| `pawn` | Neither side has non-pawn material |
| `rook-and-pawn-vs-rook` | One side has exactly K+R+P; the other exactly K+R |
| `rook` | Each side's non-pawn material is exactly one rook (any pawns) |
| `queen` | Each side's non-pawn material is exactly one queen (any pawns) |
| `minor` | Each side's non-pawn material is exactly one bishop or knight (any pawns) |
| — (abstain) | Anything else: `type: null`, rendered "endgame; the material is outside Tabiya's census" |

#### 5b. The technique index, and where its body lives

A closed, code-level index — the same artifact decision B9 made for its structure catalogue and
for the same reason: a table of names is not an authoring path, and the authoring path is
B11's. Each entry:

```ts
export interface TechniqueRef {
  readonly id: string;                 // "lucena" | "philidor" | "vancura"
  readonly name: string;               // the external literature name
  readonly forSide: "attacker" | "defender";
  readonly appliesWhen?: StructuralExpression | MaterialCondition; // exact arithmetic, may narrow within the type
  readonly provenance: { readonly note: string };
  readonly shapeEntryId: string;       // resolved against the B11 shape library; may resolve to nothing
}
```

Shipped entries, keyed to `rook-and-pawn-vs-rook`, the names taken from the endgame audit's
canonical rook-family row (`design/04-content-architecture.md:259`; line content note at
`:100`): **Lucena** (attacker's winning method), **Philidor** (defender's drawing method), and
**Vancura** (defender's method against a rook pawn — listed only when the pawn stands on the a-
or h-file, which is file arithmetic). Each provenance note states that the name is the standard
endgame-literature name and the trigger is Tabiya's material-census convention.

**The body of a technique is a shape entry.** "The technique is to build a bridge" is plan
content — exactly what `rfc/shape-library.md` exists to author — so `shapeEntryId` is the seam:
when the library ships an entry, opening the technique renders it under its authored
provenance; until then the surface renders **honest absence**: "Named technique: Lucena
position (standard endgame literature). No technique entry is available yet." A recognizable
type with no index entry at all — `pawn`, `rook`, `queen`, `minor`, and every census abstention
— renders the type (or the census abstention) and "Technique entries: none in Tabiya's index."
Pack C's 4v3 rook ending is precisely this case and is criterion 8's fixture: recognized,
named, and honestly empty.

#### 5c. Execute and grade — with machinery that already ships

The chain `design/05` §5b specifies — recognize, name, let the learner execute, grade the
result — terminates in grading this RFC does not build, because it shipped: outcome objectives
grade convert/hold/save/resist in packs (`docs/outcome-drill-grading.md`), and terminal
outcomes grade rules-validated results in any run, pack-less included, through
`outcome.reached` and the `rules:result-*` sentences
(`docs/explanation-grounds.md` §Grounded objective rendering). Endgame steering adds the naming
layer in front and **nothing** behind: no per-move grading, no "you deviated from the
technique", no move ever named. The banned-form test extension (law 1b, criterion 10) applies
to every steering sentence, and the no-move-token rule is the mechanical form of "never play
Rc8".

### 6. The LLM is the voice, never the source

This section pins the contract `design/05` §3b-i announced and explicitly deferred to this RFC
(lines 203-216: "the packet grammar and machine-check rule are B10-RFC detail, not shipped
behaviour").

#### 6a. The evidence packet

Assembled first, always, by deterministic code — server-side in
`apps/server` for the voice endpoint, from the run and the same runtime functions the client
uses:

```ts
// packages/runtime/src/voice.ts
export interface EvidencePacket {
  readonly fen: string;
  readonly phase:
    | { readonly source: "author"; readonly value: PackPhase }
    | { readonly source: "detector"; readonly value: DetectedPhase };
  readonly structures: readonly StructureMatch[];            // B9 catalogue matches
  readonly observations: readonly StructuralObservation[];   // the rung-0 facts in scope
  readonly markers: readonly PivotalMarker[];                // §4, for the node in scope
  readonly endgame: EndgameReading | null;                   // §5
  readonly plans: readonly ShapeEntryRef[];                  // resolved B11 entries; [] until the library lands
  readonly authored: readonly { readonly id: string; readonly text: string; readonly attribution: string }[];
                                                             // ONLY prose already revealed by the shipped reveal surface
  readonly sentences: readonly string[];                     // the deterministic renderings of everything above
}
```

`sentences` is load-bearing twice over: it is the **default output** — what every learner sees
with no provider, no preference, no request — and it is the serialized claim set the machine
check runs against. `authored` may contain only items the run-scoped authored-feedback surface
has already returned for this run (`docs/explanation-grounds.md` §Authored checkpoint reveal);
the packet assembler can widen no disclosure. `ShapeEntryRef` is imported from the shape
library's contract as an opaque reference — its fields are B11's to define.

#### 6b. The rendering contract

1. The packet is assembled and its deterministic sentences exist **before** any provider is
   consulted. There is no path where the model runs first.
2. The model receives the packet, a **persona** (a server-configured instruction string, not
   authored chess content, carrying no claim authority), and the deterministic text. It may
   choose wording, order, brevity and tone.
3. It may not introduce a chess noun, square, move or judgement absent from the packet —
   checked, not requested (§6c).
4. A rendering that fails the check is discarded; one retry is permitted; then the
   deterministic sentences are served. The claim content is byte-identical either way — only
   the personality is lost, which is the correct thing to lose first (`design/05:225-233`).
5. Voice output is ephemeral (§1d): rendered, shown, never persisted, never an evidence source,
   never quoted by any later surface as if it were the record.

#### 6c. The machine check

`voiceCheck(packet, output)` in `packages/runtime/src/voice.ts`, pure, testable, and shared by
the server (enforcement) and the test suite (criterion 9):

| Rule | Mechanism |
|---|---|
| No new square | Every `[a-h][1-8]` token in the output must occur in the packet's serialized text |
| No move | Every SAN-shaped or UCI-shaped token in the output must occur in the packet's serialized text — and since §1b keeps move tokens out of every deterministic sentence, the normal packet licenses none |
| No new chess noun | A closed `CHESS_LEXICON` ships in code: the nouns of the deterministic sentence tables (B9's and this RFC's), piece and phase names, catalogue structure names, technique names. Any lexicon word in the output must occur in the packet's serialized text, case-insensitive, whole-word |
| No new judgement | B9 §6b's banned-form list: any of those words in the output must occur in the packet's serialized text (revealed authored prose may legitimately carry one, with its provenance; the model may then repeat it, attributed by context, but never coin one) |

Stated honestly, in the contract, because this repo does not ship silent limits: the check is
**necessary, not sufficient**. A model can smuggle advice in plain English that no lexicon
catches ("push the tall one two squares"). The residual risk is bounded by the other walls —
the packet is the prompt's entire evidence, the persona carries no chess content, voice fires
only on an explicit request inside an opened panel (sparse by construction,
`design/05:225-233`), and the default path never touches a provider. ADR-0005 / `AGENTS.md`
law 8 compliance rests on the *system*: source = classifier and catalogue, claim = packet,
mouth = model, and the mouth is checked.

#### 6d. The provider seam — specified, not built

- `CapabilityProviders.llm` widens from the literal `"none"` to `"none" | "external"`
  (`apps/server/src/capabilities.ts:47-51`, mirrored at `apps/web/src/lib/api.ts:215-218`).
  Every shipped deployment continues to construct `"none"` (`capabilities.ts:104,114`); the
  value becomes `"external"` only when a deployment configures a provider by environment, in
  the same pattern the engine mode uses.
- Server interface, one method, no vendor types:
  `VoiceProvider.render(packet, persona, deterministicText) → Promise<string>`.
- `POST /runs/:id/voice` `{ nodeId, scope: "marker" | "reading" | "steering" }` — the server
  assembles the packet (§6a), calls the provider, runs `voiceCheck`, and returns
  `{ text, source: "provider" | "deterministic" }`. Refuses `VOICE_UNAVAILABLE` when the
  capability is `"none"`; the client, seeing `"none"` in capabilities it already fetches, never
  offers the preference at all — the deterministic text is not a fallback state, it is the
  product.
- No provider implementation, no vendor SDK, no prompt library ships in this RFC.

### 7. Availability, in one table

| Context | Phase chip | Markers | Marker content when opened | human-split | Backward pivot | Voice |
|---|---|---|---|---|---|---|
| Committed play, Just Play | detected phase, labeled | per config, default off | fact sentences; + guided naming when `guided: "live"` | after reveal, until next committed move | — | on request, on packet content only |
| Committed play, pack run | authored phase as the pack's; detected labeled separately | per config, default off | same, law 1c attribution | after `deliveryOpen` | — | same |
| Checkpoint / terminal sheets | as above | markers on the traversed path | same | open | — | same |
| Comparison / review | per branch, canonical | per branch | same | open | `retrospectivePivot`, post-disclosure, engine-attributed | same |
| Live host | as underlying run | host's own config (§3d) | same | as underlying run | as underlying run | same |
| Live participant / spectator | visible | visible per their client config | fact sentences | locked off | post-disclosure only | same |

Nothing in any cell opens itself, interrupts, or carries a count on a closed control (law 1d).

### 8. Client surface

#### 8a. The Just Play entry

The Play screen (`/play`, `router.ts:20-29`) gains the pack-less start the server already
accepts (`rest.ts:264-295`): choose side, optional FEN (default: the initial position),
opponent policy from the capability registry's modes and profiles, then
`POST /runs` with `session: { kind: "position", start, feedbackPolicy: "attempt_end",
opponentPolicy }` through the existing `createRun` client (`api.ts:369`), claiming a writer
session exactly as the pack path does (`session-controller.ts:221-231`). The
`justPlay` and `fromPosition` surface rows (`capabilities.ts:120-127`) become
`"available"` when an opponent provider is present, `"unavailable-here"` otherwise — the
registry stops hard-coding an absence the server-side capability no longer has. This is the
minimal real entry gate B10's acceptance scenario requires, not a redesign of the Play IA.

#### 8b. Timeline markers

`Timeline.svelte` renders marker dots from `pivotalMarkers` output joined to
`timelineEntries` rows; opening a dot shows the marker sentences (and guided content per
config) in a panel following the structural-reading disclosure pattern
(`DrillScreen.svelte:470-471`): closed, learner-opened, no badge.

#### 8c. The assistance control

One control on the run screen exposing `AssistanceConfig` within `permittedAssistance` bounds,
locked rows rendered disabled-with-reason (`HonestControl`). Not in `/settings` (§3e).

### 9. Boundary conditions, enumerated

| Condition | Behaviour |
|---|---|
| Classifier on a position with `M = 13` / `14` / `17` / `18` | endgame / unclear / unclear / development-dependent — band edges asserted each side (criterion 1) |
| Classifier with `M ≥ 18`, `U = 4` then a knight returns to `b1` making `U = 5` | the classification may move middlegame-ward to opening-ward honestly; the **marker** still fires only definite→definite and the path test covers a re-entry |
| Phase-change marker when the game *starts* inside an endgame (FEN start) | no marker — there is no prior definite phase on the path; the phase chip simply shows endgame |
| `unclear` at the root | chip renders the abstention sentence; no marker ever fires *from* unclear |
| `pawn_break` by en passant | fires via clause (i), a capture |
| `last_of_role` when a promotion is captured immediately | counts the board as it stands; if the capture leaves zero of the role, it fires |
| Divergence when candidates exist but every `mass` is `undefined` | abstains — no marker, no claim |
| Divergence on a `strong_engine` run | abstains (`policyModeApplied` guard); criterion 4 |
| Option collapse at the first decision of a run | no marker — there is no previous same-side count |
| Option collapse in a cramped ending, counts 3 → 3 → 2 | no marker — the ≥ 8 prior condition never holds |
| `retrospectivePivot` before disclosure | `null` — compare's evidence arrays are empty (`service.ts:438-441`) |
| `retrospectivePivot` with one recorded eval | `null` — a swing needs two points; honest absence sentence |
| Census on K+R+P vs K+R+P | `rook`, not `rook-and-pawn-vs-rook` — the census is exact, both-sides |
| Vancura listing on a c-pawn | absent — the file condition is arithmetic |
| `human-split` on a run with `providers.opponent: "none"` | control disabled with reason; endpoint refuses |
| Voice request with `llm: "none"` | client never offers it; endpoint refuses `VOICE_UNAVAILABLE`; deterministic sentences are the product |
| Voice output containing a square not in the packet | rejected by `voiceCheck`; retry once; deterministic fallback |
| Markers `"off"` | timeline byte-identical to the pre-B10 rendering |
| Pack-less run everywhere above | identical behaviour — no code path may require a pack |

### 10. Cost

The classifier, the census, and three of four detectors are bounded arithmetic over one or two
FENs — the same envelope class B9 measured; they join the existing latency artifact
(criterion 12) under the shipped 100 ms worry / 200 ms intervention thresholds, recorded, not
gated at a microbenchmark. Divergence reads persisted events already in client memory. The two
network surfaces are on-request only: `human-split` is one sidecar query per explicit ask, and
voice is one provider call per explicit ask on an opened panel — the sparse-by-construction
cost posture `design/05:225-233` requires. Nothing runs per ply on the server that does not run
today, except the MultiPV report widening of a call the selector already makes.

## Deviations from design

1. **Option collapse is redefined, not relocated.** `design/05` §3 (line 62) offers the fork —
   redefine as raw legal-move count or move to rung 2/3 — and §4e takes the redefinition,
   because a collapse detector that needs an evaluator would put a rung-2 source inside the
   forward detector set that §3a built precisely to keep evaluation out of. The evaluated
   variant is not deferred; it is ruled out of this contract entirely. Proposing the
   corresponding tightening of §5a's wording ("reasonable" → "legal") is a BACKLOG row the
   implementer proposes (`AGENTS.md` law 5).
2. **Design question 3 (may the classifier be wrong out loud) is resolved:** it may not guess;
   it abstains in declared bands, and the marker layer's definite→definite rule keeps
   abstention off the timeline (§2c). Promotion to `design/05` §6 is a proposed BACKLOG row.
3. **Design question 4 (Just Play defaults: learner's choice or product's opinion) is
   resolved as: the product's opinion is silence, and everything past silence is the learner's
   choice** (§3b, `SILENT_ASSISTANCE`). This is the conservative composition of §3a's ruling
   with §3b's chosen-mode framing; a future owner ruling can make the product more opinionated
   without any schema change, because the config object already carries the fields. Proposed
   BACKLOG row likewise.
4. **Guided mode ships without its band-shaped default** (`design/05` §3b wants it on for
   1000–1400). Not deferral but absence of an input: no learner strength exists in the system
   to band on (§Scope boundary). The design's *fading* intent is honoured in the only honest
   form available today: off by default, chosen, and trivially turned off.
5. **`design/03:198-199` asks for "guidance that adjusts to what is on the board" so drilling
   and Just Play "get the same reading".** Shipped literally: every function in this RFC takes
   a FEN or a run, and §9's last row makes pack-independence a tested property rather than a
   slogan.

## Acceptance criteria

1. **Phase bands, table-driven.** `classifyPhase` asserted on: the initial position (opening);
   a developed queens-on middlegame; K+R+P vs K+R (endgame); Q+R vs Q+R (`M=14`, unclear);
   2R+B vs 2R+B (`M=13`, endgame); and both sides of every band edge — `M ∈ {13,14,17,18}`,
   `U ∈ {2,3,4,5}` at fixed `M ≥ 18`. Each rendered sentence names "Tabiya's phase bands";
   the abstention sentence claims no phase.
2. **Phase-change marker skips abstention.** A constructed path
   middlegame → unclear → unclear → endgame yields exactly one marker, at the first endgame
   node, with `{from: "middlegame", to: "endgame"}`; a path ending in unclear yields none; a
   FEN-start endgame run yields none. In a pack run with `phase: "middlegame"`, the surface
   renders the authored claim as the pack's and the detected claim as Tabiya's, both present,
   neither replaced (law 1c).
3. **Irreversibility sub-kinds.** Fixtures for castling, a last-queen capture (with
   `queensOff`), a pawn capture, and a push creating first pawn contact each fire exactly their
   sub-kind; a quiet piece move fires nothing.
4. **Divergence from the persisted record.** A run whose `opponent.move_selected` carries
   massed candidates `0.31/0.24/0.19/…` marks the node with the model identity and raw masses
   in the sentence; a `strong_engine` run and a mass-less selection both abstain. The
   `#humanCommon` MultiPV change is asserted selection-invariant against the mock engine (same
   seed, same move, with and without the report request).
5. **Option collapse.** A check position with ≤ 3 legal replies after a ≥ 8-option decision
   marks (count 1 renders "forced"); the cramped-ending steady-state case and the
   first-decision case do not; the sentence says "legal", never "reasonable" or "good".
6. **`permittedAssistance` is §3b verbatim.** Every row and role asserted, including
   participant/spectator `humanSplit: locked_off`, and `SILENT_ASSISTANCE` as the universal
   default.
7. **The gated endpoints.** `GET /runs/:id/human-split` refuses `ASSISTANCE_WITHHELD` during
   committed play, serves an attributed distribution after the position-session reveal, and
   refuses again after the next committed move (`feedbackDeliveryOpen` cycle asserted end to
   end); it refuses cleanly with no opponent provider. `POST /runs/:id/voice` refuses
   `VOICE_UNAVAILABLE` when `llm` is `"none"`.
8. **Endgame steering.** K+R+P vs K+R yields the type and Lucena + Philidor, plus Vancura
   exactly when the pawn is on the a- or h-file; each technique renders the
   no-entry-yet absence pending B11; Pack C's 4v3 census (`rook`) renders the type and
   "Technique entries: none in Tabiya's index"; a census-abstaining endgame says so.
9. **`voiceCheck` rejects introductions.** Table-driven: outputs adding a square, a UCI/SAN
   token, a lexicon noun, and a banned-form word are each rejected; a reorder/re-tone of packet
   sentences passes; a banned-form word *present in revealed authored packet text* passes.
   With no provider, the rendered claim text is byte-identical to `packet.sentences`.
10. **Banned forms and no-move-token, extended.** Every sentence template this RFC adds —
    phase, marker, census, technique, absence sentences — is rendered against fixtures and
    asserted free of B9's banned list **and** of any SAN/UCI-shaped token. Fails closed for a
    kind with no sentence.
11. **Markers are passive and off is off.** No marker auto-opens anything (no dialog/modal in
    the DOM on marker computation); `markers: "off"` renders a timeline DOM identical to the
    pre-change snapshot; no closed control anywhere carries a numeral.
12. **Envelope.** `classifyPhase` + `pivotalMarkers` + `endgameReading` over Pack B's spine and
    a 60-ply Just Play fixture, recorded into the existing latency artifact; 100 ms worry /
    200 ms intervention, measured not microbenchmarked.
13. **Browser: the B10 scenario.** In `tests/browser/drill.spec.ts`: start a Just Play run from
    the Play screen (§8a) from a late-middlegame FEN with markers enabled; play a scripted
    sequence through a queen trade that crosses `M ≤ 13`; assert (a) a passive phase-change
    marker appears on the timeline and nothing opened by itself; (b) opening it names the
    phase change under "Tabiya's phase bands" and names the endgame type from the census;
    (c) a full-page text scan finds no SAN-shaped or UCI-shaped token and no banned-form word
    in any assistance-rendered text — **no sentence anywhere prescribes a move**; (d) with
    markers off, the timeline shows no dots.
14. **`pnpm verify` and `pnpm test:browser` pass**, with the pre-existing
    `structure.test.ts:95` envelope flake resolved or quarantined by its owning implementation
    (B9), not by this RFC's changes.
15. **Canonical documentation.** `docs/adaptive-guidance.md` describes the bands, the four
    detectors and their conventions, the config object and its enforcement split, the census
    and index, the packet and check, and the explicit boundaries (no live eval, no persistence,
    no shape-entry authoring); `docs/README.md` gains its row;
    `docs/explanation-grounds.md` gains the two gated endpoints under its withholding section;
    `docs/app-shell.md` records the surface-row and provider-type changes.

## Open questions

None.

## Changelog

- 2026-08-14: created. Specifies the B10 layer: banded deterministic phase classification with
  first-class abstention and author-over-detector attribution; a per-context assistance
  configuration object with one shared permission function, server enforcement at the two
  disclosure-gated endpoints, and documented streamer self-assistance; four author-free pivotal
  detectors (irreversibility sub-kinds, definite-to-definite phase change, recorded Maia
  divergence with the MultiPV report supply fix, and option collapse redefined as
  legal-continuation collapse) delivered as passive timeline markers; backward-only eval-swing
  pivot riding the shipped comparison gate; endgame-type census and closed technique index with
  Lucena/Philidor/Vancura naming and shape-library-deferred bodies; and the evidence-packet
  LLM-voice contract with a machine check, provider seam, and byte-identical deterministic
  degradation. No migration, no pack-schema change, no persistence.
