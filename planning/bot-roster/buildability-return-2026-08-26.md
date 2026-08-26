# Bot-roster buildability return — 2026-08-26

**Reviewer:** codex

**Verdict:** return `rfc/bot-roster.md` before acceptance. The measured four-band roster and the
owner's three-family / one-persona-per-profile ruling stand. The draft does not yet specify a
production-safe guard, an enforceable trait source, or the ruled learner experience. Registering
twelve declarations from the present text would make the catalogue non-empty without making the
bots truthful or reachable.

This is an implementation-readiness review, not new chess research. Every finding below was
re-derived at the named source on 2026-08-26. The two concurrent D872 test edits and
`planning/review/` were not touched.

## What survives unchanged

- The roster product is the owner-ruled Cartesian product of bands
  `[1000, 1400, 1800, 2200]` and three behaviour families ([[D1566]]).
- D969 supports one shared Stockfish 18 candidate-set request at fixed depth 8, whole-guard
  abstention on mixed cp/mate domains, and a 250 cp threshold. Node-count bounds remain refused.
- `human-baseline`, `guarded-human`, and guarded `pawn-forward` are honest mechanism names. No
  unguarded pawn-forward family is licensed by the measurement.
- Human-policy bands are not human Elo. Absolute ratings stay absent unless stable external anchors
  are funded; band-relative measurements and their time-control/clock scope remain mandatory.
- The owner has settled the persona grain: one persistent persona per profile, not one persona per
  family ([[D1566]]). Exact names remain an owner/design choice before any digest calibration.

## Acceptance blockers

### 1. The orthogonality proof compares unlike units and its criterion cannot pass ([[D1601]])

The draft calls the axes orthogonal because the band span is expressed in Elo while the guard and
trait shifts are expressed in centipawns. A `1.36 cp` mean shift is not “two orders of magnitude
below” `~60 Elo`; there is no declared conversion between those units. The family transforms also
change the tail deliberately: the guard removes all measured >=250 cp mass. No calibration result
yet establishes that family leaves strength unchanged.

The mechanical criterion is independently contradictory. It requires profiles in the same family
to have byte-identical **non-model** layers, while §4 assigns a different presentation layer to
every band and [[D1566]] requires one persona per profile. Both cannot be true.

**Required repair:** describe band and family as independently declared policy axes, not as
measured strength-orthogonal axes. Compare only policy-affecting layers in the structural fixture;
exclude presentation. Render every family `uncalibrated` until the exact digest's band-relative
calibration exists, and report any measured strength shift rather than presupposing zero.

### 2. The guard input cannot represent the D969 evidence contract ([[D1602]])

`BotPolicyCandidateInput` carries only `guardLossCp?: number`
(`apps/server/src/bot-policy-catalog.ts`). It cannot represent:

- `{ kind: "cp" }` versus `{ kind: "mate" }`;
- lower/upper-bound rows versus exact rows;
- the requested-candidate set and set-equality receipt;
- engine/version, fixed depth, root-side perspective, position/history identity, or elapsed time.

`composeBotPolicySelection` merely asks whether every number is finite. A caller can therefore feed
numbers from a different engine, depth, position, perspective, or independent searches and the
guard records `applied`. Conversely, the draft's whole-guard abstention on a mixed score domain is
not expressible at all. Widening `searchBound.kind` to `depth` fixes storage vocabulary but not the
evidence authority.

**Required repair:** consume one sealed, typed candidate-set guard receipt (or the admitted shared
candidate packet projection) containing the exact D969 operands. Derive candidate loss only inside
that receipt. Compilation/execution must abstain the whole guard on provider failure, timeout,
candidate-set mismatch, duplicate/missing/bounded rows, or mixed score domains. A bare caller-owned
`guardLossCp` must not remain the production authority.

### 3. A guard abstention currently activates an unmeasured pawn policy ([[D1603]])

In `composeBotPolicySelection`, `provider_unavailable` and `empty_after_mask` record a guard
abstention and `continue`; the later controlled-trait layer still reweights the unguarded Maia
distribution. But pawn-forward was measured only as **guarded plus pawn x4**. The current fallback
therefore executes a profile no dossier measured, and can raise the severe tail the guard was meant
to constrain.

**Required repair:** make the trait declare its dependency on the successful guard result. For the
pawn-forward family, any guard abstention skips the dependent trait and falls back to the unchanged
human-policy sampler. The record must state both abstentions. Positive, provider-off, mixed-domain,
bounded-row, empty-mask and timeout fixtures must exercise the whole chain.

### 4. Candidate traits are caller strings, not registered evidence ([[D1604]])

The draft notices that production never writes `candidate.traits`, but its proposed pure function
returning `string[]` is still forgeable and typo-prone. `ControlledTraitLayer.classifier` is also a
free string; the compiler does not prove that a classifier exists or that the populated value came
from the declared root position and move.

**Required repair:** introduce one closed/versioned bot-trait identity and classifier registry. The
compiler must reject an unregistered classifier. The candidate adapter derives the registered ids
from `(root position, legal move)` and cannot accept caller-injected trait strings. Catalogue trait
ids and classifier ids are set-equal, with positive and hard-negative fixtures. `pawn_move` must
prove promotions, captures, castling and non-pawn moves at the board boundary.

### 5. The production route is still absent from the RFC's acceptance surface ([[D1605]])

`composeBotPolicySelection` has no non-test caller. The profile request parser and empty catalogue
validation are only an installed door. The draft's criteria can register all twelve profiles while
`#humanCommon` continues selecting exactly as before. This is the existing [[D1087]]/[[D1181]] gap,
but the roster does not make its discharge acceptance-critical.

**Required repair:** name the complete production symbol chain: run creation/resume profile
identity -> `OpponentSelector` human-common acquisition -> Maia vector -> candidate evidence/guard
receipt -> compiled composition -> persisted selection record -> capability/card projection. A
non-test route fixture must prove a selected profile changes the executed path; provider-off and
resume fixtures must preserve the exact identity/digest and honest fallback.

### 6. The guard configuration and selection budget contradict themselves ([[D1606]])

§4 declares `stockfish-analysis`; Open question 3 says the owning spec is undecided. Neither
existing worker profile has D969's exact contract as its identity: Threads 1, Hash 16, cleared game
state, `MultiPV=candidateCount`, exact `searchmoves`, depth 8, typed final rows. The dossier also says
the multi-call selection budget must be declared; the RFC repeats the 499.1 ms observed maximum but
declares no target, intervention threshold, timeout, or abstention behavior for the combined Maia +
Stockfish selection.

**Required repair:** specify a dedicated `stockfish-guard` supervised request profile rather than
silently borrowing play or analysis semantics. Pin the combined-selection target and intervention
threshold separately from each per-call budget, benchmark the exact production chain, and make a
deadline an explicit guard abstention. The measured 0.9 ms margin below 500 ms is not enough to
turn one observed maximum into a portable hard deadline.

### 7. The profile card prose outruns the mechanism ([[D1607]])

Human baseline samples a Maia policy distribution; it does not always play “the move the largest
number of players ... play.” A 250 cp loss is not necessarily a hanging piece. Guarded profiles
also abstain in measured mixed-domain positions and on provider failures. The present prose drops
those scopes. The eight-adjective regex can reject a word while admitting an equally ungrounded
chess claim.

**Required repair:** compile card statements from declared layers, measurements and explicit
absences, using the same provenance discipline as evidence rendering. Every mechanism/rate sentence
names its source id; decorative persona prose makes no chess claim. Cards state guard abstention
scope, endgame unknown, clock/time-control scope, no book, no memory and calibration state. This is
the existing [[D1501]] direction made able to fail.

### 8. The owner-ruled learner experience has no implementing home ([[D1608]])

[[D1566]] rules that Play owns the picker, opponent identity is always visible, and each profile
has one persistent persona. `bot-policy` explicitly disowns the picker; `play-composition` does not
own it; this roster describes card rows but no operation, wire type, route, client parser, starter
binding, identity bar, resume path or responsive state. All catalogue criteria can pass while the
learner still sees the existing two-word selector and no opponent beside the game.

**Required repair:** split or amend a bounded opponent-experience RFC from the completed
`ux-opponents.md` exploration and [[D1566]] ruling. It owns the Play picker, recommendation/default
rule, card receipt, always-visible in-run identity, match/result/history joins, responsive behavior,
provider-off state and accessibility. The generic-ladder refusal is satisfied only when picker,
card and identity ship together.

### 9. “Uncalibrated” cannot be the silent 1.0 completion state ([[D1609]])

The draft correctly refuses a number before calibration, but its acceptance criteria make all
twelve uncalibrated and its Discharges table contains no obligation to repair D1184's failed
positive control or run the band-relative calibration. The roadmap's 1.0 bot exit requires
calibration, latency and observability gates, not only honest omission.

**Required repair:** registration may precede calibration, but RFC completion/1.0 may not. Add a
named discharge for the new preregistration, exact-digest band-relative runs, clock/time-control
scope, trait observability, severe-tail, latency, reproducibility and provider-off receipts.
Absolute human Elo remains a separate optional owner decision.

## Owner decisions still genuinely open

1. **Persona names/art ([[D1610]]).** The grain is settled (one persona per profile); the twelve identities and
   presentation assets are not. They should be chosen before digest calibration.
2. **Default profile ([[D1611]]).** [[D1566]] fixes the picker and roster but does not choose which opponent a
   new learner meets. The implementation must not preserve the accidental hidden Maia-1500 default.

Everything else above is research, contract or engineering work and does not need another owner
ruling.

## Resume order

1. Amend `bot-policy`/`bot-roster` around the typed guard receipt, dependent-trait fallback,
   registered trait ids, depth-8 request and combined budget.
2. Re-review the amended roster against the real production symbols and shared candidate-packet
   contract.
3. Accept and implement the policy/roster path through persistence and capabilities.
4. Draft/accept the opponent-experience RFC; land picker + card + identity as one learner outcome.
5. Run the new calibration/observability receipts; only then close the 1.0 bot capability.
