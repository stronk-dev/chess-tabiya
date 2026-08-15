# RFC: The engine request contract — a request must close over its instrument's state

- **Status:** draft
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-15
- **Design refs:** `design/03-product-breadth.md:146-158` (*"for a group to answer 'which of my
  four moves is best', resistance must be **held constant** across branches, or the learner is
  comparing four different opponents and learns nothing about their own move"* — the design-tier
  sentence all four defects below violate), `design/00-thesis.md:21` (rewind → replay under
  *different* resistance presupposes that resistance is a property you can hold still)
- **Exploration gate:** two landed dossiers, both hands-on, both measuring shipped code.
  `design/research/practical-difficulty-outside-tablebase.md` §4.2 and §7 (R4, 2026-08-15)
  quantified D35. `design/research/maia-policy-scalar-stability.md` §9 (R5, 2026-08-15) found
  three more on the Maia path and its §10 proposed the ledger rows, explicitly noting *"this
  dossier may not write `design/BACKLOG.md`"*. All four rows are now in the ledger, **owned by
  nobody**; codex has declined to implement one of them on the correct ground that law 1 forbids
  implementation without an accepted RFC. This RFC is that home.
- **Depends on:** nothing unlanded. It amends shipped code from
  `rfc/archive/engine-workers.md` (the supervisor and the selector),
  `rfc/archive/resistance-spectrum.md` (`eloHonored`/`eloApplied`, run schema 0.14, migration 19),
  and `rfc/archive/branch-groups.md` (the group reply journal). It reads
  `rfc/archive/opening-evidence-path.md`'s engine evidence path but does not change its outputs.
- **Parent / amends:** amends `rfc/archive/engine-workers.md` at the request boundary
  (`EngineRequest` gains a reset prologue; the UCI handshake stops discarding what it parsed) and
  `rfc/archive/resistance-spectrum.md` §4b/§4d at the applied record (`eloApplied` becomes
  present-or-refused for Maia). Neither is superseded; both keep every other guarantee they made.
- **Supersedes / superseded by:** —
- **Planning:** `planning/engine-request-contract/` (once implementing)

## Summary

Four measured defects sit on the engine request path with no RFC home:
**`strong_engine` is not reproducible** (D35), **The D35 analogue is real on the Maia path: an
Elo-less request inherits the previous request's band** (D58), **Top-p can sample a `bestmove`
outside the recorded candidate list** (D59), and **`targetElo` is an unbounded integer** (D60).
They look like four unrelated bugs on three different surfaces. They are one failure, and the
useful output of this RFC is the rule, not the four diffs.

The rule: **an engine request must close over the instrument state its answer depends on.**
Every option the answer reads is set by the request rather than inherited; every accumulated
search state the request does not want is cleared by the request; every value the request
declares is inside a range the deployment has published; and everything actually applied — the
band, and the move — appears in the record. State the server does not state is state the
previous request chose. That is precisely what the shipped code does: three long-lived UCI
processes (`apps/server/src/application.ts:315-321`) receive requests that state their deltas and
inherit everything else, so the instrument's history leaks into an answer that the group reply
journal and the run record both treat as a pure function of position and mode.

This is the **sibling** of the declared-vs-executable law, not an instance of it. That law
governs a *vocabulary* — what a pack may name. This one governs a *request* — what a call must
state. They meet at exactly one point, D60, which is why that ledger row cites the older law
correctly and why the older law says nothing at all about the other three.

## Motivation

### 1. The four, as measured

Every number here is quoted from a landed dossier. This RFC re-derives none of them; it verified
the code each one refers to, by symbol, at HEAD.

**D35 — `strong_engine` is not reproducible.** `OpponentSelector#strongEngine`
(`apps/server/src/opponent-selector.ts:512-520`) sends `position …` and
`go movetime ${this.#strongEngineMovetimeMs}` and nothing else. No `ucinewgame`, no
`setoption name Clear Hash`, no `isready` — so the transposition table from every prior selection
is live, and the search is bounded by a wall clock. R4 re-probed 171 in-range positions at depth
12 with the reset suppressed, reproducing the shipped state exactly: **83.8% of individual move
evaluations differ (2,025 of 2,416)** and **the reported best move differs on 89 of 171
positions**; the reset costs a **median 6 ms**, invariant across depth 1→16
(`design/research/practical-difficulty-outside-tablebase.md:223-233,392-403`) `[V]`. Against
`DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs = 100` (`apps/server/src/strong-engine.ts:10-15`) that
is 6%. D35 is not a cost trade-off; it is an omission.

**A correction the ledger row does not have.** R4 recorded that
`grep -rn "ucinewgame\|Clear Hash" apps/server/src/ packages/ workers/` returned **zero**
matches. That was true when measured and is no longer: commit `f3cdfe0` (opening-evidence-path,
after the dossier's commit `86b09c2`) introduced exactly one occurrence, in the authoring
evaluator at `apps/server/src/sourcing/position-seeds.ts:75-79`. It is the right sequence —
`["ucinewgame", "setoption name Clear Hash", "isready"]` awaiting `readyok` — issued as a
**separate** `supervisor.execute` call immediately before the search
(`position-seeds.ts:80`). Two separate `execute` calls are two separate entries on the
per-engine request queue (`apps/server/src/engine-supervisor.ts:269-315`), so nothing binds the
reset to the search it was meant to protect. The repo therefore already contains the remedy and
already contains the reason the remedy must be **request-scoped** rather than adjacent.

**D58 — the D35 analogue on the Maia path.** `OpponentSelector#maia`
(`opponent-selector.ts:469-499`) emits `setoption name Elo` **only** when
`request.policy.targetElo !== undefined && identity.eloHonored` (`:474-480`). A UCI option
persists in the process; the supervisor keeps one long-lived process per engine. R5 measured 6
targets in 6 fresh containers: after a *different* position was probed at band 1100, the target
probed with **no** `Elo` returned the band-1100 policy vector byte-for-byte, **6/6**; at 1900,
**6/6**; with no `Elo` ever sent, the advertised default, **6/6**
(`design/research/maia-policy-scalar-stability.md:366-383`) `[V]`. Reproduced end-to-end through
the shipped `OpponentSelector`, where the resulting selection records `eloApplied` **absent** —
which `rfc/archive/resistance-spectrum.md:507` defines as *"this selection was not
band-calibrated"* — while it was calibrated at whatever band the previous caller asked for.

The row states, and this RFC confirms by reading the pinned engine's behaviour as the dossier
recorded it, that **`ucinewgame` would not fix this**: `cmd_ucinewgame` resets the board and
history, and the options survive it (`maia-policy-scalar-stability.md:361-364`) `[V]`. Two
defects that look alike need two different remedies — a *clear* and a *state* — which is the
first evidence that the unifying rule needs more than one obligation.

Latency of the leak, on the surface: `apps/web/src/lib/outcome-presentation.ts:113-118` renders
an Elo honesty sentence **only when `requested.targetElo !== undefined`**. In the exact case
where the applied band is wrong, the honesty surface says nothing at all.

**D59 — top-p can sample a `bestmove` outside the recorded candidate list.** `#humanCommon`
requests MultiPV **8** (`opponent-selector.ts:501-510`), records `candidateLines(result.lines)`
(`:233-255`, built only from `info … multipv … pv …` lines) and plays `bestMove(result.lines)`
(`:257-263`, read from the `bestmove` line). Those are two different lines of the engine: the
`bestmove` is a `torch.multinomial` draw under top-p, the `info` block is the raw softmax
(`maia-policy-scalar-stability.md:170-186`) `[V]`. In R5's arm C — MultiPV 8, `#humanCommon`'s
exact shape — **1 probe in 700** returned a `bestmove` that was not among the 8 recorded
candidates; at arm A's widths (`max(8, legal)`, capped at 20), **0 in 2,100** (`:400-405`) `[V]`.
The persisted `opponent.move_selected.selection` then contains a candidate list omitting the move
that was played — a hole in exactly the record replay reads.

**D60 — `targetElo` is an unbounded integer.** `schemas/drill_run.schema.json:196` declares
`"targetElo": { "type": "integer" }`; `schemas/drill_pack.schema.json:892` declares the same. The
request boundary adds only a type check: `parseSelectMoveRequest` requires a safe integer
(`opponent-selector.ts:145-148`), and both REST run-creation paths do the same
(`apps/server/src/rest.ts:331`, `:381`). Nothing anywhere compares the value to what the engine
supports. The repo's only bound is an emitter clamp, `clampElo` at
`apps/server/src/sourcing/position-seeds.ts:172` — `Math.min(2000, Math.max(1100, rating))` —
which stamps its own provenance with the disclaimer *"targetElo clamp [1100, 2000] is an
authoring convention, not a Maia capability claim"* (`:232`). That disclaimer is correct and it
is the whole problem: the number in the repo is an authoring convention with no authority, and
committed content already sits outside the band the ledger names — `content/candidates/
onramp-00008/pack.json` declares `targetElo: 1939`.

### 2. A fifth instance, found by reading, not measured

Not in the ledger and not in scope to fix as a *defect*, but it is the same failure and it
matters for the rule's shape. `EngineSupervisor.execute` sends `request.afterCommands` **after**
awaiting the response (`engine-supervisor.ts:291-295`). On the failure path it kills the process
(`:298`), which resets every option — self-healing. But on the **abort** path it rethrows before
the kill (`:296-297`), so `afterCommands` never runs and the process survives with its options
mutated. `StockfishEvidenceExecutor.execute` passes a `signal` *and* relies on
`afterCommands: ["setoption name MultiPV value 1"]` to restore the width
(`apps/server/src/evidence-queue.ts:328-339`). One aborted MultiPV evidence job therefore leaves
`stockfish-analysis` at that job's width for every later job. `OpponentSelector.enumerate` uses
the same restore pattern (`opponent-selector.ts:434-443`) but passes no signal, so it is latent
there today.

`[V]` for the code path, **unmeasured** as an incidence — stated as a code reading, not as a
number. It is included because it shows that "restore what you changed" is the *wrong* discipline
and "state what you need" is the right one: a request that sets its own MultiPV cannot be
poisoned by a predecessor that failed to clean up.

### 3. The rule

> **The engine request contract.** An engine request must close over the instrument state its
> answer depends on. Concretely, on every request: **(state)** every option whose value changes
> the answer is sent by that request, never inherited; **(clear)** every accumulated search state
> the request does not want is cleared by that request, in the same queued exchange as the search
> it protects; **(bound)** every value the request sends lies inside a range the deployment has
> published, or the request is refused by name; **(record)** every value actually applied and the
> answer actually taken appear in the persisted record.
>
> State a request does not state is state the previous request chose.

Read the four defects against it and each one is a single missing obligation:

| Defect | Missing obligation |
|---|---|
| D35 `strong_engine` is not reproducible | **clear** |
| D58 Elo-less request inherits the previous band | **state**, and **record** (`eloApplied` absent while calibrated) |
| D59 `bestmove` outside the recorded candidate list | **record** |
| D60 `targetElo` is an unbounded integer | **bound** |
| (§2, unmeasured) aborted `afterCommands` leaves MultiPV wide | **state** |

The obligations are not independent in the code, which is the reason a single RFC is cheaper than
four. `#maia`'s missing default band (**state**) and `targetElo`'s missing range (**bound**) have
**one** root cause: `parseIdentity` (`engine-supervisor.ts:114-149`) parses the engine's whole
option advertisement into `optionNames` at `:235-241`, uses it to compute two booleans
(`seedHonored`, `eloHonored`, `:138-142`), and **discards everything else** — including every
spin option's advertised `default`, `min` and `max`. The instrument publishes its own contract on
every handshake and the server throws it away. Retaining that table fixes D58's default and D60's
bound in the same change, and tells the **clear** obligation which engines can even accept
`Clear Hash`.

### 4. Why this is the sibling of the declared-vs-executable law, not a case of it

The declared-vs-executable law (`rfc/archive/defect-sweep.md:294-298`, promoted into
`docs/drill-pack-format.md`) reads:

> An executable vocabulary may contain only values the shipped runtime executes. A declared
> vocabulary may contain values it does not, provided every such value carries a machine-checked
> refusal reason and the deployment publishes what it can actually select.

Its three legs — capability publication, named refusal, applied record — are exactly this RFC's
**bound** and **record** obligations, and D60's ledger row is right that *"the
declared-vs-executable law applies exactly"*: `targetElo` is a *declared value* whose executable
range is unpublished. That is the seam, and it is one obligation of four.

The law says nothing about D35, D58 or the §2 instance, because its subject is a **vocabulary**
in a document — a fixed set of names, checkable statically against a runtime — while the subject
here is a **request** against a stateful instrument. A vocabulary cannot inherit; a request can.
No amount of publishing what `human_common` can select tells you that the process remembers the
last caller's band. The two laws share a shape because both are about honesty at a boundary; they
are not the same law, and collapsing them would lose the **state** and **clear** obligations,
which is precisely the pair that is measured at 83.8% and 6/6.

Stated once, for the reviewer who wants the distinction in one line: *declared-vs-executable
governs what a document may **say**; the request contract governs what a call must **do**.*

### 5. Scope boundary

**In scope:** the four ledger rows, and the supervisor/selector/capabilities machinery each one
needs.

**Explicitly out of scope, and not to be smuggled in:**

- **The sampler's nondeterminism itself.** `human_common` plays a `torch.multinomial` draw and
  R5 measured it stable on only 36/105 keys. That is *by design* — *"a human-choice opponent
  that always played its modal move would be a different product"*
  (`maia-policy-scalar-stability.md:202-204`). This RFC makes the request reproducible; it does
  not make the sample deterministic and does not touch `Temperature`.
- **`seedHonored` stays `false`.** `rfc/archive/resistance-spectrum.md:995-996` anticipated
  promoting `practical_resistance` and recording `seedHonored: true`. R5 refused the second half
  and this RFC upholds the refusal: `seedHonored` is an **engine identity** field shared by every
  mode on that engine (`opponent-selector.ts:265-278`, `engine-supervisor.ts:138-139`), and
  `human_common` on the same engine demonstrably does not honour a seed. Flipping it would make
  the record less true. Nothing in this RFC changes it.
- **`practical_resistance`'s two arithmetic defects** (R5 §8.1, §8.2). The `1 + 1e-9` tolerance
  was addressed by commit `960f91e`; the vacuity gate remains a ledger row. Neither is a request
  contract.
- **Promoting `practical_resistance` to determinism-by-construction.** Earned on the evidence,
  but it is a mode-semantics change, not a request change.
- **Browser execution locus.** `executionLocus` exists in the run schema; no engine runs in the
  browser today and this RFC assumes the server locus.

## Specification

### 6. R1 — the supervisor retains what it already parses

`EngineIdentity` (`engine-supervisor.ts:15-24`) is unchanged: it is mapped field-by-field into
the run record (`opponent-selector.ts:265-278`) and the run schema's `selectionEngine` closes
`additionalProperties` (`schemas/drill_run.schema.json:125-139`), so it must not grow.

The option table is added beside it:

```ts
export interface EngineOption {
  readonly name: string;
  readonly type: "check" | "spin" | "combo" | "button" | "string";
  readonly default?: string;          // verbatim token text as advertised
  readonly min?: number;              // spin only
  readonly max?: number;              // spin only
  readonly vars?: readonly string[];  // combo only
}
```

- `parseIdentity` parses the full `option name <name> type <type> [default <d>] [min <n>]
  [max <n>] [var <v>]*` grammar from the `uci`/`uciok` handshake it already reads
  (`engine-supervisor.ts:234-241`) and stores the result on the managed engine.
- `EngineHealth` (`:55-61`) gains `readonly options?: readonly EngineOption[]`.
- The names set that computes `seedHonored`/`eloHonored` is derived from the table; those two
  booleans keep their current meaning and values.
- An option the engine does not advertise is **absent from the table**, never defaulted.
- Re-handshake after a restart replaces the table wholesale. A request that reads the table reads
  it inside its own queued task, so a restart cannot interleave.

**Normative:** no code outside the supervisor may assert an engine option's existence, default,
or range from a literal. Where a value is needed and the table does not carry it, the deployment
must configure it explicitly (§9) or the request is refused.

### 7. R2 — `clear`: a request-scoped reset prologue

`EngineRequest` (`engine-supervisor.ts:63-69`) gains one field:

```ts
readonly resetSearchState?: boolean;   // default false
```

When true, `execute` — **inside the same queued task**, before sending `request.commands`
(`:291`) — sends `ucinewgame`, then `setoption name Clear Hash` **only if the option table
advertises a `Clear Hash` option**, then performs an `isready`/`readyok` exchange
(`#exchange`, `:351-359`) and waits for it. Only then are `request.commands` sent, with the
response waiter registered as it is today. The prologue's lines are not included in the returned
lines. The prologue's timeout is `min(request.timeoutMs, 5_000)`; a prologue timeout fails the
request exactly as a search timeout does.

Because the prologue runs inside the task that `#requestQueue` (`:270`, `:310-313`) serializes,
no other request can interleave between the reset and the search. This is the property the
existing two-call form at `sourcing/position-seeds.ts:75-80` does not have.

**Who sets it:**

| Call site | `resetSearchState` | Why |
|---|---|---|
| `#strongEngine` (`opponent-selector.ts:512-520`) | **true** | D35 |
| `enumerate` (`:434-443`) | **true** | same engine, same hash, seeds a branch group |
| `StockfishEvidenceExecutor.execute` (`evidence-queue.ts:328-339`) | **true** | the same instrument writes *recorded evidence*; a carried hash makes a persisted centipawn number depend on what was searched before it |
| `#maia` (`:489-493`) | **false** | measured not to help (`maia-policy-scalar-stability.md:361-364`); the sidecar is history-conditioned and every request already sends full history (`workers/maia/README.md`), and the RNG survives `ucinewgame` |
| `createPositionSeedEngineEvaluator` (`sourcing/position-seeds.ts:73-80`) | **true**, via the flag | the separate `execute` at `:75-79` is **deleted** and replaced by the flag on the search request |

The strong-engine `movetime` search bound is **not** changed by this RFC. `go movetime` remains
non-deterministic across machines and loads; the reset removes the *carried* nondeterminism,
which is the measured one. Converting `strong_engine` to a fixed-depth budget is a separate
question and is listed as open.

### 8. R3 — `state`: every option the answer reads, on every request

`#maia` (`opponent-selector.ts:477-488`) currently always sends `Temperature`, `TopP` and (from
its callers) `MultiPV`, and conditionally sends `Elo`. Three of four obligations are already
honoured; this fixes the fourth.

`#maia` resolves a band before building commands:

1. If `identity.eloHonored` is false, no `Elo` is sent, `eloApplied` is absent, and the
   selection's `eloHonored: false` already tells a reader that absence means *"this engine has no
   band"*. Unchanged.
2. Else if `request.policy.targetElo` is defined, that value is sent and recorded as today.
3. Else the **advertised default** for the band option (`EngineOption.default` for the spec's
   `bandOption`, `apps/server/src/maia.ts:26`) is sent and recorded as `eloApplied`.
4. Else — the engine honours a band but advertises no default — the request is refused with
   `TARGET_ELO_REQUIRED` (HTTP 422): *"This engine is band-calibrated and publishes no default
   band; the session must declare `targetElo`."*

After this change, **`eloApplied` is present on every Maia selection**, and its absence means
exactly one thing: the engine does not honour a band. That is a *tightening of meaning* on a
field shipped by `rfc/archive/resistance-spectrum.md:507`, and §11 rules on what it does to
records already written.

`#strongEngine` and `enumerate` both send `setoption name MultiPV value <n>` explicitly on every
request — `#strongEngine` at `this.#strongEngineMultiPv` (`:388`), `enumerate` at its count. The
`afterCommands` restore at `:440` is then redundant and is **removed**, which also closes the §2
abort hazard at that call site. `StockfishEvidenceExecutor` likewise sends its MultiPV on every
request (it already does, `evidence-queue.ts:331`) and drops its `afterCommands` restore
(`:335`) — but it must then send `MultiPV 1` explicitly on jobs that do not request a width,
rather than relying on the process default.

`UCI_ShowWDL` (`evidence-queue.ts:330`) is set only for `wdl` jobs and never cleared: the same
inheritance shape. It is sent on every evidence request — `true` for `wdl`, `false` otherwise.

### 9. R4 — `bound`: publish the range, refuse outside it, invent no number

**This RFC states no Elo band as a fact.** Law 8 forbids manufacturing chess truth, and "Maia is
trained at ≈1100–1900" is a claim about a model that this repo has measured at exactly three
points. The bound comes from the instrument or from an explicit deployment configuration, and it
is labelled with which.

`Capabilities.policyProfiles` (`apps/server/src/capabilities.ts:68-70`) — which already publishes
`strong_engine`'s profile — gains a band profile:

```ts
readonly policyProfiles: {
  readonly strong_engine: StrongEngineProfile;
  readonly human_common: {
    readonly elo: {
      readonly min: number | null;
      readonly max: number | null;
      readonly default: number | null;
      readonly source: "advertised" | "configured" | "unpublished";
    };
  };
};
```

- `advertised` — taken from the engine's own spin bounds in the R1 table. Authoritative.
- `configured` — taken from an explicit `EngineSpec.bandRange` the deployment sets when the
  engine advertises none. It is a deployment claim, published as such.
- `unpublished` — no bounds from either source; `min`/`max` are `null`.

**Refusal.** Where `min`/`max` are non-null, a `targetElo` outside `[min, max]` is refused at
every request boundary with `TARGET_ELO_OUT_OF_RANGE` (HTTP 422), naming the published range:
`parseSelectMoveRequest` (`opponent-selector.ts:145-148`), the position-session path
(`rest.ts:315-336`) and the run-creation path (`rest.ts:369-398`). Where they are null, **no
refusal is possible and none is invented** — the value passes, and `eloApplied` records what was
applied. Silence is replaced by a published `unpublished`, which is a different and honest thing.

**The JSON Schemas are not touched.** `schemas/drill_run.schema.json:196` and
`schemas/drill_pack.schema.json:892` keep `{"type": "integer"}`, deliberately: a pack is portable
and a deployment's engine is not, so a numeric bound in the pack format would be a capability
claim baked into a document that outlives the capability. This is the same reasoning
`position-seeds.ts:232` already applies to itself. Consequently **this RFC claims no pack schema
version** and `content/candidates/onramp-00008/pack.json`'s `targetElo: 1939` stays valid; if a
deployment publishes a narrower range, that pack is refused at run creation, by name, with the
range in the message — which is the intended behaviour, not a regression.

`clampElo` (`position-seeds.ts:172`) stays as an authoring convention with its existing
disclaimer, and gains one obligation: where `/capabilities` publishes an `advertised` or
`configured` range, the emitter clamps to the **intersection** of its convention and the
published range. No surface may render the clamp as a capability claim.

**Honesty sentence.** `apps/web/src/lib/outcome-presentation.ts:113-118` currently emits nothing
when the session declared no `targetElo`. It gains the symmetric case: when a resistance path
carries an `eloApplied` and the session declared no `targetElo`, it states the applied band and
that the session did not choose it.

### 10. R5 — `record`: the played move is in the recorded window

Two changes, in order of preference.

**(a) Widen the window to cover the sampler's support.** `#humanCommon` (`:501-510`) requests
`Math.min(20, Math.max(8, legalMoveCount(currentPosition(request))))` instead of the literal `8`.
20 is not a magic number: it is the engine's own advertised `MultiPV` maximum, read from the R1
option table and clamped to it (R5 measured the cap as an advertised option bound, not an
accident: `maia-policy-scalar-stability.md:153-156`). This is the measured difference between
1/700 and 0/2,100. It is safe for the metric because a candidate's policy scalar does not change
with the requested width — 263 shared moves, 0 mismatches across MultiPV 8 vs 20
(`:213-220`) `[V]`.

**(b) Check the post-condition, and mark the record if it still fails.** After any Maia
selection, if `bestMove(lines)` is not present in `candidateLines(lines)`:

1. the request is retried **once** at full width (`min(20, legalCount)`), which is a fresh
   sample and is legitimate precisely because the sampler is not deterministic;
2. if the retry also lands outside its window, the played move is appended to the recorded
   candidate list as `{ moveUci, rank: <max rank + 1>, offWindow: true }` — no `mass`, because
   none was reported.

`offWindow` is a new **optional** boolean on `$defs/selectionCandidate`
(`schemas/drill_run.schema.json:114-124`, which closes `additionalProperties`). Its meaning is
narrow and normative: *this move was returned as `bestmove` and was not inside the requested
MultiPV window; its `rank` is an insertion position, not a reported rank.* No consumer may treat
an `offWindow` candidate as a ranked candidate: it is excluded from `humanConcessionMass`
inputs, from group seed candidate lists, and from any rendered distribution.

The learner's move is never refused for this. A hole in the record is a defect; a refused move
mid-drill would be a worse one.

### 11. Historical replay — the ruling, verified rather than assumed

**Verdict: no fix in this RFC changes what any stored run replays as.** Verified, three ways:

1. **Replay reads the log and never recomputes.** `opponentMovesFromEvents`
   (`packages/runtime/src/replay.ts:68-84`) walks events, reads `event.data.selection`, and
   throws `opponent commit has no authoritative selection` if an opponent commit is not
   immediately preceded by its selection event. There is no engine call on that path, and
   `readBackReplay` (`:143-148`) and `resistanceOnPath` (`:103-141`) are the only consumers.
2. **The stored bytes are not rewritten.** Every change above is to *how the next request is
   made* and *what the next selection records*. No migration in §12 touches
   `opponent.move_selected` payloads.
3. **The group reply journal reuses recorded selections and its guard is unaffected.**
   `RunService.groupReply` (`apps/server/src/service.ts:936-948`) returns a recorded selection
   byte-for-byte when the transpose key matches, gated on `compatibleAppliedMode` (`:242-248`)
   and `sameEngine` (`:233-240`). `sameEngine` compares `id`, `name`, `version`, `modelId`,
   `containerDigest` and `seedHonored` — **not** `eloApplied` and not `eloHonored`. So making
   `eloApplied` always-present cannot change which journal entries are reusable.

**Two visible consequences that are not replay changes, stated so cross-review does not have to
find them:**

- **A run continued across the upgrade will show two engine rows.** `resistanceOnPath` keys its
  engine counts on a tuple including `eloApplied ?? null` (`replay.ts:113-122`), so a path with
  pre-fix plies (absent) and post-fix plies (present) splits into two `ResistanceEngineCount`
  entries and the outcome panel renders *"This path faced more than one engine"*
  (`outcome-presentation.ts:106-112`). That sentence is **true**: those plies genuinely were
  calibrated differently, or at least were recorded with different honesty. It is not suppressed.
- **`sameEngine`'s indifference to `eloApplied` is now visible as its own question.** Within a
  run the policy is fixed (`#selectionRequest` reads `run.opponentPolicy`,
  `service.ts:1797-1808`), so a band cannot change mid-run today and the guard is sufficient. It
  would not be sufficient if a future RFC let a session change band mid-run. Listed as open, not
  changed here.

**What *would* have made this a much larger RFC, and is confirmed absent:** no path recomputes an
opponent move for an existing run. The three `selector.select` call sites in REST
(`rest.ts:899-917` `/select-move`, `:1038-1044` the human-split guidance panel, `:1381-1389` the
prediction distribution) all serve *new* requests; `service.ts:829` and `:952-953` serve group
creation and group reply. `deriveRun` (`service.ts:572-573`) copies a run and re-projects it; it
calls no engine.

### 12. Register claims — stated loudly

| Resource | Claim | Note |
|---|---|---|
| **Run schema** | **0.14 → 0.15** | `$defs/selectionCandidate` gains optional `offWindow` (§10). Additive only |
| **Migration** | **20**, `STORAGE_VERSION` 19 → 20 | **Stamp-only**: re-stamp `schema_version` and the snapshot's `schemaVersion` `"0.14"` → `"0.15"`, modelled literally on `#upgradeV013Runs` (`apps/server/src/storage.ts:2719-2728`) and registered like migrations 16 and 18. Mandatory rather than cosmetic because reads filter on `DRILL_RUN_SCHEMA_VERSION` (`storage.ts:626`, `:730`) — omitting it hides every existing run |
| **Pack schema** | **none. 0.23 stays free** | §9's reasoning: a band range is a deployment capability, not a document fact. `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`, currently `0.22`) is untouched |
| **0.19** | not claimed | frozen shut; the constant is monotonic and passed it |

The run-schema claim rests **entirely** on §10(b)'s `offWindow` marker. If cross-review prefers
the alternative — retry once, then refuse the selection with a typed error rather than record a
marked hole — then **this RFC claims no run schema version and no migration**, and 0.15 and
migration 20 return to the pool. That trade is stated explicitly so the register is not held
hostage to an undecided design point: the author's preference is the marker, because refusing a
learner's move at 1-in-700 to preserve a schema number is the wrong trade, but the register cost
is real and the fallback is one line of spec.

### 13. What this RFC does not change

- `seedHonored` stays `false` on Maia and is not written anywhere new (§5).
- `Temperature` and `TopP` defaults (`opponent-selector.ts:73-74`) are unchanged.
- `policyConfigDigest`, the selection cache key (`:184-187`) and its inputs are unchanged, so no
  cache-key collision or invalidation follows from this RFC.
- `policyModeApplied` and its vocabulary are unchanged.
- The strong engine's `movetime` budget and profile are unchanged.
- No pack, fixture, or content file changes. `content/candidates/onramp-00008/pack.json` stays
  valid (§9).

## Deviations from design

**None.** §9's refusal to bake a band range into the pack format is a *narrower* reading than
D60's ledger row suggests ("a run may request Elo 50 or 9000 and the format accepts it"): the
format still accepts it, and the deployment refuses it by name. The row's stated requirement —
*"a published capability and a named refusal, not silence"* — is met in full. Flagged here
because a reviewer scanning for a schema `minimum` will not find one, and that is deliberate.

## Acceptance criteria

1. **Option table.** Against the pinned Maia image and a local Stockfish, the supervisor's
   parsed option table reproduces the handshake: every advertised option present with its type,
   and every spin option carrying the advertised `default`/`min`/`max` verbatim. A unit test with
   a recorded handshake transcript covers the grammar including `combo` `var` tokens and options
   whose names contain spaces (`Clear Hash`).
2. **D35 closed, and measured the way it was found.** Re-run R4's control shape
   (`tools/r4-difficulty-harness/probe-sf.ts`, whose `NO_RESET=1` path was written for exactly
   this): with the prologue on, two sequential probe runs over the same 171 in-range positions at
   depth 12 agree on **171/171** reported best moves and on every move evaluation. The measured
   prologue overhead is reported as a median per request and stated against the 100 ms `movetime`
   budget; the RFC does not pre-commit to a number beyond R4's 6 ms.
3. **The reset is request-scoped.** A test interleaves two `execute` calls on one engine and
   asserts from the transcript ring (`engine-supervisor.ts:194-196`) that no command from the
   second request appears between the first request's `ucinewgame` and its `bestmove`.
4. **D58 closed.** Re-run R5's carry-over arm (`tools/r5-maia-stability-harness/
   probe-carryover.ts`): setter at 1100 then target with no `targetElo` returns the **advertised
   default** band's policy vector, **6/6**, not 1100's; the same for 1900. Through the shipped
   `OpponentSelector`, every Maia selection carries `eloApplied`, and `eloApplied` equals the band
   actually sent in **all** probes.
5. **`TARGET_ELO_REQUIRED`.** With a stub engine advertising `Elo` with no `default`, an
   Elo-less request is refused 422 by name and no `setoption name Elo` is sent.
6. **D60 closed.** `/capabilities` publishes `policyProfiles.human_common.elo` with a `source`;
   with a stub engine advertising `min`/`max`, a `targetElo` outside the range is refused 422 at
   all three request boundaries with the published range in the message; with `source:
   "unpublished"`, the same value is accepted and recorded. A regression test asserts that no
   literal band number exists outside `EngineSpec` configuration and the emitter clamp.
7. **D59 closed.** Re-run R5's arm C at the new width over the same 35 positions × 20 repeats:
   **0** off-window `bestmove` observations, and per-selection latency reported against the 500 ms
   server-side target (`docs/engine-workers.md:236`). If the widened width breaches that target,
   §10(a) is withdrawn and §10(b) alone ships — that outcome is acceptable and must be logged,
   not hidden.
8. **The post-condition is armed.** With a stub Maia returning a `bestmove` absent from its own
   `info` lines, the selection records the played move with `offWindow: true`, and
   `humanConcessionMass` and group seeding both ignore it.
9. **Replay is byte-stable.** A fixture run recorded before the change replays to an identical
   `readBackReplay` output after it, and a group reply journal fixture reuses the same recorded
   selection before and after. This is criterion 3 of §11 executed as a test.
10. **Migration 20.** A database at `STORAGE_VERSION` 19 with runs at `"0.14"` migrates to 20 with
    every run at `"0.15"`, no other field altered, byte-compared. A database at 18 migrates
    through 19 and 20 in order.
11. **Abort no longer leaks width.** An evidence job aborted after its `bestmove` is followed by a
    job that requests no MultiPV; the transcript shows an explicit `setoption name MultiPV value
    1` on the second request and its response carries a single `multipv 1` line.
12. **Docs.** `docs/engine-workers.md` gains the request contract as a named section, and its
    stale selection-cache-key line (`:137`, missing `packId` — R5 §7) is corrected in the same
    pass.

## Proposed ledger rows

This RFC may not write `design/BACKLOG.md`; claude lands these.

| # | Row | Kind |
|---|---|---|
| 1 | **The engine request contract** — *a request must close over its instrument's state: state every option it reads, clear the search state it does not want, bound every value against a published range, record everything applied.* The sibling of the declared-vs-executable law, for requests rather than vocabularies. Promote to `docs/engine-workers.md` when this RFC lands | 📐 law |
| 2 | An aborted `EngineRequest` skips `afterCommands` and survives, so an aborted MultiPV evidence job leaves `stockfish-analysis` at that width (`engine-supervisor.ts:291-297`, `evidence-queue.ts:328-339`). Code-verified, incidence unmeasured. Closed by this RFC's **state** obligation as a side effect | 🐞 defect, minor |
| 3 | `sameEngine` (`service.ts:233-240`) ignores `eloApplied`/`eloHonored`, so the group reply journal would reuse a selection across a band change. Harmless today because a run's policy is fixed; a blocker for any future mid-run band change | 💡 open |
| 4 | `capabilities.engines` omits `stockfish-play` (`application.ts:324-327`) — the opponent-side strong engine's identity is not published, though `policyProfiles.strong_engine` is | 📝 gap |

## Open questions

1. **Does the pinned Maia image advertise `min`/`max` on `Elo`?** R5 recorded the advertised
   *default* (1500, `maia-policy-scalar-stability.md:374`) and the `MultiPV` spin bounds
   (`min 1 max 20`, `:153-156`) but never recorded the `Elo` line's bounds. §9 is written to work
   either way — `advertised`, else `configured`, else `unpublished` — so this does not block
   acceptance, but the answer decides whether D60's refusal actually fires in the shipped
   deployment or publishes `unpublished` and refuses nothing. **One handshake transcript
   settles it**; it must be captured during implementation and recorded in the planning log.
2. **Should `strong_engine` move from `movetime` to a fixed depth?** The reset removes the
   *carried* nondeterminism; the wall clock remains. R4 has the cost curve (median 42.8 ms at
   depth 12, 170 ms at 16 — `practical-difficulty-outside-tablebase.md:179-184`) so this is
   decidable, but it changes opponent strength, which is a product question, not a request
   contract. Deferred to its own RFC or ledger row.
3. **Does §10(a)'s wider window fit the 500 ms target?** R5's median per-key latency at
   `max(8, legal)` widths was 367.8 ms on a loaded host and 202.8 ms unloaded (`:163-166`), and
   the dossier explicitly makes no latency claim. Acceptance criterion 7 measures it and names
   the fallback. Flagged as the one criterion that can legitimately fail.
4. **`offWindow` or refuse?** §12 states both, prefers the marker, and prices the register
   difference. Cross-review should settle it, because it is the only thing standing between this
   RFC and a zero-register-claim footprint.
5. **Does the reset belong on the evidence path at all, or does it belong to a re-grounding
   pass?** §7 sets `resetSearchState: true` on `StockfishEvidenceExecutor` on the rule's
   authority, but every evidence row already persisted was produced with a carried hash. This RFC
   does **not** invalidate or re-run stored evidence — it makes future evidence reproducible. If
   the owner wants stored evidence re-grounded, that is a content operation with its own cost and
   its own RFC.

## Changelog

- 2026-08-15: created. Gives the four unhomed engine-path defects a home — **`strong_engine` is
  not reproducible** (D35), **The D35 analogue is real on the Maia path: an Elo-less request
  inherits the previous request's band** (D58), **Top-p can sample a `bestmove` outside the
  recorded candidate list** (D59), **`targetElo` is an unbounded integer** (D60) — and derives all
  four from one rule, **the engine request contract**: state every option the answer reads, clear
  the search state you do not want, bound every value against a published range, record everything
  applied. Named as the sibling of the declared-vs-executable law (documents vs. requests) rather
  than an instance of it, with D60 as the single seam between them. Found one root cause behind
  D58 and D60 (the handshake parses the engine's whole option advertisement and discards
  everything but two booleans) and one unmeasured fifth instance by reading (an aborted request
  skips `afterCommands` and survives). Verified rather than assumed that no fix changes historical
  replay. Claims **run schema 0.15 + migration 20**, both contingent on §10(b); claims **no pack
  schema version** and leaves 0.23 free.
