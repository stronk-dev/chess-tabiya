# RFC: The engine request contract — a request must close over its instrument's state

- **Status:** implemented — adversarially cross-reviewed 2026-08-15 (see Changelog); six
  blockers fixed in place, owner accepted 2026-08-15, shipped and verified 2026-08-15
- **Author:** claude (agent), for Marco. Cross-review by a second agent
- **Created:** 2026-08-15
- **Design refs:** `design/03-product-breadth.md:145-148` (*"for a group to answer 'which of my
  four moves is best', resistance must be **held constant** across branches, or the learner is
  comparing four different opponents and learns nothing about their own move"* — the design-tier
  sentence every defect below violates), `design/00-thesis.md:21` (rewind → replay under
  *different* resistance presupposes that resistance is a property you can hold still)
- **Exploration gate:** two landed dossiers, both hands-on, both measuring shipped code.
  `design/research/practical-difficulty-outside-tablebase.md` §4.2 and §7 (R4, 2026-08-15)
  quantified D35. `design/research/maia-policy-scalar-stability.md` §9 (R5, 2026-08-15) found
  three more on the Maia path and its §10 proposed the ledger rows, explicitly noting *"this
  dossier may not write `design/BACKLOG.md`"*. The rows are now in the ledger — D35, D58, D59,
  D60, plus D65 (already marked *"owned by `engine-request-contract`"*), D66 and D67 — and every
  one but D65 is **owned by nobody**; codex has declined to implement one of them on the correct
  ground that law 1 forbids implementation without an accepted RFC. This RFC is that home.
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
outside the recorded candidate list** (D59), and **`targetElo` is an unbounded integer** (D60);
a fifth row, **The handshake throws away the contract the instrument publishes** (D65), is
already ledgered as owned by this RFC and is the common root of two of them. They look like
unrelated bugs on three different surfaces. They are one failure, and the useful output of this
RFC is the rule, not the diffs.

The rule: **an engine request must close over the instrument state its answer depends on.**
Every option the answer reads is set by the request rather than inherited; every accumulated
search state the request does not want is cleared by the request; the option-setting and the
search it governs occupy one indivisible exchange; every value the request declares is inside a
range the deployment has published; and everything actually applied — the band, and the move —
appears in the record. State the server does not state is state the previous request chose. That
is precisely what the shipped code does: three long-lived UCI processes
(`apps/server/src/application.ts:316-322`) receive requests that state their deltas and inherit
everything else, so the instrument's history leaks into an answer that the group reply journal
and the run record both treat as a pure function of position and mode.

This is the **sibling** of the declared-vs-executable law, not an instance of it. That law
governs a *vocabulary* — what a pack may name. This one governs a *request* — what a call must
state. Their overlap is bounded and stated precisely in §4: two obligations of five, and exactly
one ledger row (D60) where the older law's own formulation applies without translation.

## Motivation

### 1. The measured defects, and their root

Every number here is quoted from a landed dossier. This RFC re-derives none of them; it verified
the code each one refers to, by symbol, at HEAD.

**D35 — `strong_engine` is not reproducible.** `OpponentSelector#strongEngine`
(`apps/server/src/opponent-selector.ts:513-521`) sends `position …` and
`go movetime ${this.#strongEngineMovetimeMs}` and nothing else. No `ucinewgame`, no
`setoption name Clear Hash`, no `isready`, and **no `MultiPV`** — so the transposition table from
every prior selection is live, the requested width is whatever the last caller left behind, and
the search is bounded by a wall clock. R4 re-probed 171 in-range positions at depth 12 with the
reset suppressed, reproducing the shipped state exactly: **83.8% of individual move evaluations
differ (2,025 of 2,416)** and **the reported best move differs on 89 of 171 positions**; the reset
costs a **median 6 ms**, invariant across depth 1→16
(`design/research/practical-difficulty-outside-tablebase.md:223-233,392-403`) `[V]`. Against
`DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs = 100` (`apps/server/src/strong-engine.ts:10-15`) that
is 6%. D35 is not a cost trade-off; it is an omission.

**The half of R4 §7 that points the other way, carried here because the dossier carries it.**
The same control found **the concession set identical on 171 of 171 positions** and per-move
classification agreeing on **2,416 of 2,416** (`:400-401`) `[V]`. R4's own words: *"Two things
follow, and they point in opposite directions."* Read honestly, that bounds the blast radius —
a *classification* built on this path was not corrupted — while leaving D35 exactly as stated: a
consumer that reads a **score** or the engine's **top move** reads a different number depending
on what the process searched before it, and the group reply journal treats that number as a pure
function of position and mode. The fix costing 6 ms is what makes the trade uninteresting; the
counterweight is why this RFC does not claim any stored evidence must be re-grounded (§5, open
question 5).

**A correction the ledger row does not have.** R4 recorded that
`grep -rn "ucinewgame\|Clear Hash" apps/server/src/ packages/ workers/` returned **zero**
matches. That was true when measured and is no longer: commit `f3cdfe0` (opening-evidence-path,
after the dossier's commit `86b09c2`) introduced exactly one occurrence, in the authoring
evaluator at `apps/server/src/sourcing/position-seeds.ts:75-78`. It is the right sequence —
`["ucinewgame", "setoption name Clear Hash", "isready"]` awaiting `readyok` — issued as a
**separate** `supervisor.execute` call immediately before the search, which is a
`StockfishEvidenceExecutor.execute` on the same engine id (`position-seeds.ts:80`). Two separate
`execute` calls are two separate entries on the per-engine request queue
(`apps/server/src/engine-supervisor.ts:269-315`), so nothing binds the reset to the search it was
meant to protect. Verified at HEAD `[V]`. The repo therefore already contains the remedy and
already contains the reason the remedy must be **request-scoped** rather than adjacent — and,
more sharply, the reason **atomicity is its own obligation** rather than an adverb attached to
*clear* (§3). Nothing here was *un*cleared; what was missing was the binding.

**D58 — the D35 analogue on the Maia path.** `OpponentSelector#maia`
(`opponent-selector.ts:470-500`) emits `setoption name Elo` **only** when
`request.policy.targetElo !== undefined && identity.eloHonored` (`:475-481`). A UCI option
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
requests MultiPV **8** (`opponent-selector.ts:502-511`), records `candidateLines(result.lines)`
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
request boundaries add only a type check, and there are **five** of them, not the three an
earlier draft of this section named — swept at HEAD `[V]`:

| # | Boundary | Check today |
|---|---|---|
| 1 | `parseSelectMoveRequest` (`opponent-selector.ts:145-148`) — `POST /select-move` | safe integer |
| 2 | the position-session path (`rest.ts:326`, `:331`) | safe integer |
| 3 | the run-creation path (`rest.ts:378`, `:381`) | safe integer |
| 4 | **the pack-authored path** (`service.ts:375-380`) — a pack's `opponentPolicy.targetElo` becomes the run's band | safe integer, with the `INVALID_REQUEST` message naming the pack |
| 5 | **the repertoire path** — `POST /repertoires` (`rest.ts:755`) stores a `targetElo`, `RepertoireService.enter` (`repertoire.ts:78`) hands it to `createRepertoireGapRun` (`service.ts:576`), which writes it into the run's `opponentPolicy` | `requiredSafeInteger`, no range at all |

Nothing anywhere compares the value to what the engine
supports. The repo's only bound is an emitter clamp, `clampElo` at
`apps/server/src/sourcing/position-seeds.ts:172` — `Math.min(2000, Math.max(1100, rating))` —
which stamps its own provenance with the disclaimer *"targetElo clamp [1100, 2000] is an
authoring convention, not a Maia capability claim"* (`:232`). That disclaimer is correct and it
is the whole problem: the number in the repo is an authoring convention with no authority, and
committed content already sits outside the band the ledger names — `content/candidates/
onramp-00008/pack.json` declares `targetElo: 1939`, and it reaches the engine through boundary
**4**, which no earlier draft of §9 named.

### 2. A fifth instance, found by reading, not measured

**Ledgered as D66** (*"An aborted MultiPV job leaves the engine at that width"*) — an earlier
draft of this section said "not in the ledger", which was true when written and is not now;
claude landed D65, D66 and D67 on 2026-08-15 and the *Ledger rows* section is corrected
accordingly. Not in scope to
fix as a *defect*, but it is the same failure and it matters for the rule's shape.
`EngineSupervisor.execute` sends `request.afterCommands` **after**
awaiting the response (`engine-supervisor.ts:291-295`). On the failure path it kills the process
(`:298`), which resets every option — self-healing. But on the **abort** path it rethrows before
the kill (`:296-297`), so `afterCommands` never runs and the process survives with its options
mutated. `StockfishEvidenceExecutor.execute` passes a `signal` *and* relies on
`afterCommands: ["setoption name MultiPV value 1"]` to restore the width
(`apps/server/src/evidence-queue.ts:328-339`). One aborted MultiPV evidence job therefore leaves
`stockfish-analysis` at that job's width for every later job. `OpponentSelector.enumerate` uses
the same restore pattern (`opponent-selector.ts:435-444`, restore at `:441`) but passes no
signal, so it is latent there today — **and it is load-bearing**: `#strongEngine` sends no
`MultiPV` of its own (§1), so `enumerate`'s restore is the only thing returning `stockfish-play`
to width 1 between an enumeration and the next ordinary selection. Both halves verified at HEAD
`[V]`.

`[V]` for the code path, **unmeasured** as an incidence — stated as a code reading, not as a
number. It is included because it shows that "restore what you changed" is the *wrong* discipline
and "state what you need" is the right one: a request that sets its own MultiPV cannot be
poisoned by a predecessor that failed to clean up.

### 3. The rule

> **The engine request contract.** An engine request must close over the instrument state its
> answer depends on. Concretely, on every request: **(state)** every option whose value changes
> the answer is sent by that request, never inherited; **(clear)** every accumulated search state
> the request does not want is cleared by that request; **(bind)** the option-setting, the clear
> and the search they govern occupy **one indivisible queued exchange** on that engine;
> **(bound)** every value the request sends lies inside a range the deployment has published, or
> the request is refused by name; **(record)** every value actually applied and the answer
> actually taken appear in the persisted record.
>
> State a request does not state is state the previous request chose.

**Why five and not four (cross-review, 2026-08-15).** The first draft folded *bind* into *clear*
as a subordinate clause — *"cleared … in the same queued exchange as the search it protects"*.
It does not belong there, on the draft's own evidence. `position-seeds.ts:75-80` clears
correctly and is still broken, and what is broken is not the clearing (§1). Atomicity is
independently violable, independently observable in the transcript ring, and already
independently tested by acceptance criterion 3. It is also the obligation without which **state**
is insufficient: a request may send every option it reads and still receive another request's
`Elo` if a second caller can interleave between its `setoption` and its `go`. Today nothing can,
because `execute` sends `request.commands` as one array inside one queued task
(`engine-supervisor.ts:291`) — but that is an implementation accident of the current call shape,
not a stated guarantee, and §7's prologue is the first change that adds a second phase to a
request. Naming *bind* is what makes §7 checkable rather than incidental.

Read the five defects against it. Four map to a single missing obligation; one does not, and the
draft's claim that each is *"a single missing obligation"* was too clean:

| Defect | Missing obligation |
|---|---|
| D35 `strong_engine` is not reproducible | **clear** (and **state**: no `MultiPV` either) |
| D58 Elo-less request inherits the previous band | **state**, *and* **record** (`eloApplied` absent while calibrated) — two, not one |
| D59 `bestmove` outside the recorded candidate list | **state** (the requested width does not cover the sampler's support — §10(a), the *preferred* remedy), with **record** as the residual (§10(b)) |
| D60 `targetElo` is an unbounded integer | **bound** |
| D66 aborted `afterCommands` leaves MultiPV wide | **state** |
| (`position-seeds.ts:75-80`, §1) reset not bound to its search | **bind** |

**D59's re-assignment is the one cross-review moved.** The draft mapped it to **record** alone,
which reads as retrofitting once you notice that the RFC's own preferred fix is to *widen the
window* — that is stating the width the answer needs, which is **state**. The record obligation
is what remains after the state fix has done its measured work (1/700 → 0/2,100), and that
residual is exactly what §10(b) and the register claim are about. Getting this right is not
cosmetic: it is the argument for why §10(a) is not optional and §10(b) is not sufficient alone.

The obligations are not independent in the code, which is the reason a single RFC is cheaper than
five. `#maia`'s missing default band (**state**) and `targetElo`'s missing range (**bound**) have
**one** root cause, ledgered as **D65**: `parseIdentity` (`engine-supervisor.ts:114-149`) parses
the engine's whole option advertisement into `optionNames` at `:235-240`, uses it to compute two
booleans (`seedHonored`, `eloHonored`, `:138-141`), and **discards everything else** — including
every spin option's advertised `default`, `min` and `max`. Re-verified at HEAD, independently of
claude's 2026-08-15 verification `[V]`. The instrument publishes its own contract on every
handshake and the server throws it away. Retaining that table fixes D58's default and D60's bound
in the same change, and tells the **clear** obligation which engines can even accept
`Clear Hash`.

### 4. Why this is the sibling of the declared-vs-executable law, not a case of it

The declared-vs-executable law (`rfc/archive/defect-sweep.md:294-298`, promoted into
`docs/drill-pack-format.md`) reads:

> An executable vocabulary may contain only values the shipped runtime executes. A declared
> vocabulary may contain values it does not, provided every such value carries a machine-checked
> refusal reason and the deployment publishes what it can actually select.

Its three legs — capability publication, named refusal, applied record — are this RFC's **bound**
obligation entire plus **record** in part, and D60's ledger row is right that *"the
declared-vs-executable law applies exactly"*: `targetElo` is a *declared value* whose executable
range is unpublished.

**The seam, stated precisely.** The draft claimed the two laws *"meet at exactly one point,
D60"*, and then two sentences later mapped the older law onto **two** of this one's obligations.
Both cannot be true as written. The accurate statement is this: the overlap is **two obligations
of five** — *bound* wholly, *record* partly — and **one ledger row**, D60, where the older law's
own formulation applies without translation. *Record* overlaps because both laws demand that
what was applied be written down; it does not coincide, because the older law's applied record is
about a *declared name that the runtime executed*, while D58's and D59's are about a *value and
an answer the instrument produced* — nothing in a pack declared them. D59 is the clean test: no
vocabulary is involved anywhere in it, and it still fails **record**.

The law says nothing at all about D35, D58 or D66, because its subject is a **vocabulary** in a
document — a fixed set of names, checkable statically against a runtime — while the subject here
is a **request** against a stateful instrument. A vocabulary cannot inherit; a request can. No
amount of publishing what `human_common` can select tells you that the process remembers the
last caller's band. Nor does it have anything resembling **bind**: a document is not raced. The
two laws share a shape because both are about honesty at a boundary; they are not the same law,
and collapsing them would lose **state**, **clear** and **bind** — which is precisely the set
that is measured at 83.8% and 6/6.

Stated once, for the reviewer who wants the distinction in one line: *declared-vs-executable
governs what a document may **say**; the request contract governs what a call must **do**.*

### 5. Scope boundary

**In scope:** **five** ledger rows — D35, D58, D59, D60, and **D65**, which the ledger already
records as *"🔨 owned by `engine-request-contract`"* and which the draft's summary never named
even while §3 spent a paragraph on it — plus the supervisor/selector/capabilities machinery each
one needs. D66 closes as a side effect of **state** (§8); D67 does not close and is restated as
an open question (§11).

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
  (`engine-supervisor.ts:234-241`) and stores the result on the managed engine. `default` is
  verbatim token text because the pinned Maia advertises `Temperature` and `TopP` as
  `type string default 1.0`, not as spins — a numeric-only parse would drop them.
- `EngineHealth` (`:55-61`) gains `readonly options?: readonly EngineOption[]`.
- The names set that computes `seedHonored`/`eloHonored` is derived from the table; those two
  booleans keep their current meaning and values.
- An option the engine does not advertise is **absent from the table**, never defaulted.
- Re-handshake after a restart replaces the table wholesale. A request that reads the table reads
  it inside its own queued task, so a restart cannot interleave.

**Normative:** no code outside the supervisor may assert an engine option's existence, default,
or range from a literal. Where a value is needed and the table does not carry it, the deployment
must configure it explicitly (§9) or the request is refused.

### 7. R2 — `clear` and `bind`: a request-scoped reset prologue

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
no other request can interleave between the reset and the search. This is the **bind** obligation
made mechanical, and it is the property the existing two-call form at
`sourcing/position-seeds.ts:75-80` does not have.

**Normative (bind):** a request's `setoption`s, its prologue and its `go` are one queued task. No
call site may split them across two `execute` calls, and no call site may rely on a *previous*
request's `afterCommands` to establish state its own answer reads.

**Who sets it:**

| Call site | `resetSearchState` | Why |
|---|---|---|
| `#strongEngine` (`opponent-selector.ts:513-521`) | **true** | D35 |
| `enumerate` (`:435-444`) | **true** | same engine, same hash, seeds a branch group |
| `StockfishEvidenceExecutor.execute` (`evidence-queue.ts:328-339`) | **true** | the same instrument writes *recorded evidence*; a carried hash makes a persisted centipawn number depend on what was searched before it |
| `#maia` (`:490-494`) | **false** | measured not to help (`maia-policy-scalar-stability.md:361-364`); the sidecar is history-conditioned and every request already sends full history (`workers/maia/README.md`), and the RNG survives `ucinewgame` |
| `createPositionSeedEngineEvaluator` (`sourcing/position-seeds.ts:68-87`) | **true**, via the flag | the separate `execute` at `:75-78` is **deleted** and replaced by the flag on the search request at `:80`. Because that search is a `StockfishEvidenceExecutor.execute` on `stockfish-authoring`, the row above already sets the flag; the deletion is what removes the unbound pair |

The strong-engine `movetime` search bound is **not** changed by this RFC. `go movetime` remains
non-deterministic across machines and loads; the reset removes the *carried* nondeterminism,
which is the measured one. Converting `strong_engine` to a fixed-depth budget is a separate
question and is listed as open.

### 8. R3 — `state`: every option the answer reads, on every request

`#maia` (`opponent-selector.ts:478-489`) currently always sends `Temperature`, `TopP` and (from
its callers) `MultiPV`, and conditionally sends `Elo`.

Three tightenings on `#maia` before the band rule:

- `multiPv` becomes a **required** parameter of `#maia` (`:470-473`). Every shipped caller
  already passes one; leaving it optional leaves an unstated request expressible in the type.
- The pinned image advertises **three** band-shaped spins — `Elo`, `SelfElo`, `OppoElo`, all
  `default 1500` (`tools/r4-difficulty-harness/out/maia-availability.json:11-13`) `[V]`. No
  shipped code writes `SelfElo` or `OppoElo`, and no shipped `EngineSpec` sets them
  (`maia.ts:17-39`), so they are constant at their advertised defaults and **cannot leak today**
  — but *"nothing writes it yet"* is the exact argument D58 disproved for `Elo`. `#maia` sends
  all three it finds in the option table on every request. **`SelfElo` and `OppoElo` are sent at
  their own advertised defaults**, which is behaviourally a no-op today and is deliberately not
  the resolved band: what a self-rating and an opponent-rating *should* be relative to `targetElo`
  is a claim about how Maia-3 conditions, and this repo has measured `Elo` at three points and
  these two at none. Asserting a relationship would be exactly the manufactured chess truth law 8
  forbids. They are stated so the request is closed, not tuned. Neither becomes a record field —
  `selectionEngine` is closed (§6) — and neither is sent if the engine does not advertise it.
  Choosing values for them is a separate, evidence-first question, ledgered rather than decided
  here.
- The engine's advertised `MultiPV` maximum is **20** (`maia-availability.json:16`). `#theoryStrict`
  (`:538`) and `#practicalResistance` (`:620`) currently send `Math.max(8, legalCount)` **with no
  upper clamp**, so a 35-legal-move position sends `MultiPV 35` against an advertised `max 20`.
  That is a **bound** violation on an option other than `targetElo`, and it is in this RFC's
  scope because it is the same obligation: every value sent lies inside the published range.
  Both clamp to the R1 table's advertised maximum, exactly as §10(a) does. Behaviour is
  unchanged — the engine already clamps internally (`uci.py:213`, R5 `:153-156`) — but the
  request stops asserting a capability the instrument denies.

`#maia` then resolves a band before building commands:

1. If `identity.eloHonored` is false, no `Elo` is sent, `eloApplied` is absent, and the
   selection's `eloHonored: false` already tells a reader that absence means *"this engine has no
   band"*. Unchanged.
2. Else if `request.policy.targetElo` is defined, that value is sent and recorded as today.
3. Else the **advertised default** for the band option (`EngineOption.default` for the spec's
   `bandOption`, `apps/server/src/maia.ts:26`) is sent and recorded as `eloApplied`. For the
   pinned image this is **1500** — the number is the engine's, not this RFC's, and it is the same
   1500 R5 measured behind the no-`Elo` path (`maia-policy-scalar-stability.md:374`) `[V]`, which
   is why sending it explicitly changes no answer while making the record true.
4. Else — the engine honours a band but advertises no default — the request is refused with
   `TARGET_ELO_REQUIRED` (HTTP 422): *"This engine is band-calibrated and publishes no default
   band; the session must declare `targetElo`."* This arm is **unreachable against the pinned
   image** (which advertises a default) and is specified for a deployment whose engine does not;
   acceptance criterion 5 exercises it with a stub, and it must not be dropped as dead code.

After this change, **`eloApplied` is present on every Maia selection**, and its absence means
exactly one thing: the engine does not honour a band. That is a *tightening of meaning* on a
field shipped by `rfc/archive/resistance-spectrum.md:507`, and §11 rules on what it does to
records already written.

**Correction, cross-review 2026-08-15 — this paragraph was wrong, and acting on it as written
would have shipped a regression.** The draft read: *"`#strongEngine` and `enumerate` both send
`setoption name MultiPV value <n>` explicitly on every request — `#strongEngine` at
`this.#strongEngineMultiPv`"*, and on that basis deleted `enumerate`'s `afterCommands` restore.
`#strongEngine` (`:513-521`) sends **`position` and `go movetime` only** — verified at HEAD
`[V]`, and §1 of this same RFC says so. Its width comes from the handshake
(`stockfishPlaySpec`'s `options.MultiPV = profile.multiPv`, `strong-engine.ts:52-56`) and is
returned to that value **only** by `enumerate`'s restore. Deleting the restore without adding an
explicit width would leave `stockfish-play` at the enumeration's count (2–8) for every subsequent
`strong_engine` selection — reintroducing D66's exact failure on the opponent path, where it is
currently latent, while claiming to close it. The order is therefore normative:

1. `#strongEngine` **gains** `setoption name MultiPV value ${this.#strongEngineMultiPv}` (`:389`)
   as the first command of every request. This is a **state** fix in its own right: the recorded
   `candidates` of a `strong_engine` selection are built from `info … multipv …` lines
   (`candidateLines`, `:233-255`), so the inherited width silently determines what the run
   record contains.
2. **Only then** is `enumerate`'s `afterCommands` restore (`:441`) removed.

A test must assert step 1 before step 2 lands; acceptance criterion 11 is extended to cover the
opponent engine, not only the analysis engine.

`StockfishEvidenceExecutor` sends its MultiPV **conditionally** today — `job.multiPv === undefined`
sends nothing (`evidence-queue.ts:331`), which is why its `afterCommands` restore (`:335`) is
likewise conditional. It sends `MultiPV` on **every** request and drops the restore. The value on
jobs that request no width is the engine's **configured** width for that spec, **not** a literal
`1`. Today the two coincide — `stockfishAnalysisSpec` uses `MultiPV: 1` (`application.ts:199-206`)
and `AUTHORING_PROFILE.multiPv` is also `1` (`sourcing/authoring-profile.ts:5`) — so writing the
literal would pass every current test and be wrong in principle: the authoring evaluator
configures its width from the profile (`position-seeds.ts:69`) and **records that number as
authored provenance** (`:82-83`), so a literal would make the record attest to a width the
request did not send the moment the profile changes. The executor takes the width from its spec,
per §6's normative rule against literals.

`UCI_ShowWDL` (`evidence-queue.ts:330`) is set only for `wdl` jobs and never cleared: the same
inheritance shape. It is sent on every evidence request — `true` for `wdl`, `false` otherwise.

### 9. R4 — `bound`: publish the range, refuse outside it, invent no number

**This RFC states no Elo band as a fact.** Law 8 forbids manufacturing chess truth, and "Maia is
trained at ≈1100–1900" is a claim about a model that this repo has measured at exactly three
points. The bound comes from the instrument or from an explicit deployment configuration, and it
is labelled with which.

**The advertised range is already in the repo, and it changes this section.** The draft deferred
this to open question 1 — *"one handshake transcript settles it; it must be captured during
implementation"*. The transcript exists and was committed with R4:
`tools/r4-difficulty-harness/out/maia-availability.json:11-16` records the pinned image's
handshake as captured through the shipped supervisor at commit `86b09c2` `[V]`:

```
option name Elo type spin default 1500 min 0 max 5000
option name SelfElo type spin default 1500 min 0 max 5000
option name OppoElo type spin default 1500 min 0 max 5000
option name MultiPV type spin default 5 min 1 max 20
```

So the answer is **yes, `Elo` advertises `min`/`max`** — and the range is `[0, 5000]`, which is a
UCI spin formality, not a capability claim. This is the good news and the bad news at once:

- D58's remedy works exactly as §8 specifies: the advertised `default 1500` is real, and it is
  the same 1500 R5 measured behind the no-`Elo` path.
- D60's refusal, if sourced from `advertised` alone, is **nearly vacuous**. It rejects 9000 and
  **accepts 50** — and *"a run may request Elo 50 or 9000"* is D60's own wording. The draft's
  precedence, in which `configured` applies only *"when the engine advertises none"*, therefore
  guarantees the weakest available bound on the only engine this repo ships.

Correcting that is the point of this section, and it does not require inventing a number: it
requires letting a deployment **narrow** what the instrument advertises, and saying so.

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
      readonly source: "advertised" | "configured" | "advertised+configured" | "unpublished";
      readonly advertised: { readonly min: number | null; readonly max: number | null };
    };
  };
};
```

The effective range is the **intersection** of what the engine advertises and what the deployment
configures (`EngineSpec.bandRange`, optional). Whichever is present wins where the other is
absent; where both are present the narrower endpoint wins; the `source` names which:

- `advertised` — bounds from the engine's spin advertisement alone. Authoritative **about the
  option**, and about nothing else: it says what the instrument will accept, not what it was
  trained on. No surface may render it as a competence claim.
- `configured` — bounds from `EngineSpec.bandRange` alone, the engine advertising none. A
  deployment claim, published as such.
- `advertised+configured` — both present; `min = max(advertised.min, configured.min)`,
  `max = min(advertised.max, configured.max)`. This is the case for the pinned Maia the moment a
  deployment configures anything, and it is the expected production shape.
- `unpublished` — neither source; `min`/`max` are `null`.

`advertised` is published verbatim alongside the effective range so a reader can see what was
narrowed and by whom. An empty intersection is a **startup failure**, not a runtime refusal: the
deployment has configured a range its engine cannot accept.

**This RFC configures no `bandRange` and ships none.** Doing so would be the manufactured number
law 8 forbids. It ships the mechanism, publishes `advertised` `[0, 5000]` with `source:
"advertised"`, and states plainly in the planning log that the shipped refusal will reject 9000
and accept 50 until an owner ruling supplies a narrower range with a reason. That is a *published*
weakness rather than a silent one, which is the whole of what **bound** asks for — but it must be
logged as a weakness, not reported as D60 closed to the ledger row's own example.

**Refusal.** Where `min`/`max` are non-null, a `targetElo` outside `[min, max]` is refused with
`TARGET_ELO_OUT_OF_RANGE` (HTTP 422), naming the published range and its `source`, at **all five**
boundaries in §1's table — `parseSelectMoveRequest` (`opponent-selector.ts:145-148`), the
position-session path (`rest.ts:315-336`), the run-creation path (`rest.ts:369-398`), **the
pack-authored path** (`service.ts:375-380`) and **the repertoire path** (`rest.ts:755` /
`repertoire.ts:78` / `service.ts:576`). The draft named three; a refusal that fires on three of
five doors is the silence it set out to remove, and the two it missed are the two that carry the
committed content (`targetElo: 1939`) and the only user-supplied band with no schema behind it.

The refusal is enforced at a **single shared helper** — not five copies of a comparison — so a
sixth boundary added later fails loudly rather than silently. A regression test enumerates the
boundaries and asserts each one routes through it. Where `min`/`max` are null, **no refusal is
possible and none is invented** — the value passes, and `eloApplied` records what was applied.
Silence is replaced by a published `unpublished`, which is a different and honest thing.

`apps/web/src/lib/api.ts:272-279` mirrors `policyProfiles` as a closed client type and is widened
in the same change; the client renders `source` wherever it renders a band, and never renders a
range without it.

**The JSON Schemas are not touched.** `schemas/drill_run.schema.json:196` and
`schemas/drill_pack.schema.json:892` keep `{"type": "integer"}`, deliberately: a pack is portable
and a deployment's engine is not, so a numeric bound in the pack format would be a capability
claim baked into a document that outlives the capability. This is the same reasoning
`position-seeds.ts:232` already applies to itself. Consequently **this RFC claims no pack schema
version** and `content/candidates/onramp-00008/pack.json`'s `targetElo: 1939` stays valid; if a
deployment publishes a narrower range, that pack is refused **at boundary 4**
(`service.ts:375-380`, the pack-authored path — which is the boundary that pack actually
travels), by name, with the range in the message. That is the intended behaviour, not a
regression. Against the range this RFC actually ships (`advertised` `[0, 5000]`) it is not
refused at all, which is the honest consequence of refusing to invent a number.

`clampElo` (`position-seeds.ts:172`) stays as an authoring convention with its existing
disclaimer, and gains one obligation: where `/capabilities` publishes any non-null range, the
emitter clamps to the **intersection** of its convention and the published range. No surface may
render the clamp as a capability claim. Note the asymmetry this exposes and does not resolve:
`clampElo`'s `[1100, 2000]` is *narrower* than anything the instrument advertises, so the
emitter is today the only place in the repo carrying a band opinion — and it carries it with a
disclaimer saying it has no authority. That is the correct state of affairs until an owner rules,
and open question 6 records it as a decision rather than an oversight.

**Honesty sentence.** `apps/web/src/lib/outcome-presentation.ts:113-118` currently emits nothing
when the session declared no `targetElo`. It gains the symmetric case: when a resistance path
carries an `eloApplied` and the session declared no `targetElo`, it states the applied band and
that the session did not choose it.

### 10. R5 — `state` then `record`: the played move is in the recorded window

Two changes, in order of preference — the first a **state** fix, the second the **record**
residual (§3).

**(a) Widen the window to cover the sampler's support.** `#humanCommon` (`:502-511`) requests
`Math.min(20, Math.max(8, legalMoveCount(currentPosition(request))))` instead of the literal `8`.
20 is not a magic number: it is the engine's own advertised `MultiPV` maximum, read from the R1
option table and clamped to it (R5 measured the cap as an advertised option bound, not an
accident: `maia-policy-scalar-stability.md:153-156`). This is the measured difference between
1/700 and 0/2,100. It is safe for the metric because a candidate's policy scalar does not change
with the requested width — 263 shared moves, 0 mismatches across MultiPV 8 vs 20
(`:213-220`) `[V]`.

**(b) Check the post-condition, and mark the record if it still fails.** The draft said *"after
any Maia selection"*. That is over-broad and, on two of the three Maia paths, undefined: only
`#humanCommon` (`:502-511`) plays `bestMove(result.lines)`. `#theoryStrict` (`:550-553`) plays a
seeded sample over the spine-filtered candidates and never reads the `bestmove` line;
`#practicalResistance` (`:620-621`) reads `candidateLines` only and never calls `bestMove` at all.
The post-condition is therefore scoped to **`#humanCommon`**, including the path
`#theoryStrict` takes when it degrades into it (`:532-536`). On `#humanCommon`, if
`bestMove(lines)` is not present in `candidateLines(lines)`:

1. the request is retried **once** at full width (`min(20, legalCount)`), which is a fresh
   sample and is legitimate precisely because the sampler is not deterministic;
2. if the retry also lands outside its window, the played move is appended to the recorded
   candidate list as `{ moveUci, rank: <max rank + 1>, offWindow: true }` — no `mass`, because
   none was reported.

`offWindow` is a new **optional** boolean on `$defs/selectionCandidate`
(`schemas/drill_run.schema.json:114-124`, which closes `additionalProperties`). Its meaning is
narrow and normative: *this move was returned as `bestmove` and was not inside the requested
MultiPV window; its `rank` is an insertion position, not a reported rank.* No consumer may treat
an `offWindow` candidate as a ranked candidate.

**The consumers, enumerated — the draft's list was incomplete in a way that fails silently.** A
mass-less candidate is not inert in this codebase; two shipped consumers change behaviour on
`mass === undefined` rather than ignoring it:

| Consumer | Today's behaviour on a mass-less candidate | Required |
|---|---|---|
| `humanConcessionMass` (`packages/runtime/src/practical-difficulty.ts:36`) | returns **`null`** if *any* candidate lacks `mass` — the whole measurement collapses | `offWindow` candidates are filtered out of the input, not passed and tolerated |
| `#theoryStrict`'s `missingMass` gate (`opponent-selector.ts:544-549`) | flips the entire selection to `sampleRankWeighted` and logs `DEGRADED_POLICY_MASS` | excluded from the gate's input; the marker must never induce a degradation |
| group seeding (`service.ts:831`) | takes `candidates.slice(0, n).map(moveUci)` — an appended candidate ranks last and is usually but not always excluded | excluded explicitly, not by rank luck |
| any rendered distribution | renders a bar with no mass | excluded |

The second row is the one that matters: without it, a 1-in-700 record marker silently changes how
`theory_strict` **chooses its move** on that ply. That is a larger behaviour change than the
defect it records, and it is invisible except as a warning line in the server log.

The learner's move is never refused for this. A hole in the record is a defect; a refused move
mid-drill would be a worse one.

### 11. Historical replay — the ruling, verified rather than assumed

**Verdict: no fix in this RFC changes what any stored run replays as.** Verified three ways by
the author, and **re-verified independently at HEAD by cross-review on 2026-08-15** — each of the
three checked against the symbol, not the line number `[V]`. All three hold.

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

- **A run continued across the upgrade will show two engine rows — and the sentence it renders is
  FALSE. Cross-review, 2026-08-15: the draft's claim that this is "true, not a defect" does not
  survive checking, and this is the one place it invited checking and was wrong.** The mechanism
  is as described: `resistanceOnPath` keys its engine counts on a tuple including
  `eloApplied ?? null` (`replay.ts:113-122`), so a path with pre-fix plies (absent) and post-fix
  plies (present) splits into two `ResistanceEngineCount` entries and the outcome panel takes the
  multi-engine branch (`outcome-presentation.ts:106-112`). But look at what it then renders.
  `engineName` (`outcome-presentation.ts:74-77`) formats **`name (id vversion, model modelId)`**
  and nothing else — it does not read `eloApplied`. So the learner is shown:

  > Maia3 (maia-5m v1e13597…, model maia3-5m@b6559de…): 4 plies.
  > Maia3 (maia-5m v1e13597…, model maia3-5m@b6559de…): 6 plies.
  > This path faced more than one engine.

  The same engine, named twice identically, under a sentence asserting there were two. That is not
  a *true statement about a real split*; it is a false statement whose evidence contradicts itself
  on the same screen — precisely the honesty failure the in-run-experience contract exists to
  prevent, arriving through the panel that exists to be honest about resistance. The draft's own
  hedge (*"or at least were recorded with different honesty"*) is the tell: an honesty difference
  in the **record** is not an engine difference in the **world**, and the panel says world.

  **Required, in this RFC:** `engineName` renders the applied band when one is present — e.g.
  `Maia3 (maia-5m v1e13597…, model …, band 1500)` and `…, band not recorded` for the absent case —
  so the two rows are distinguishable, and the summary sentence becomes *"This path faced more
  than one engine configuration"* when the rows differ **only** in `eloApplied`, reserving *"more
  than one engine"* for a genuine identity difference. Both are true sentences about what
  happened. Neither suppresses the split, which remains correct and remains visible. This is small
  and it is not optional: shipping §8 without it manufactures a false sentence in every run that
  straddles the upgrade.
- **`sameEngine`'s indifference to `eloApplied` is now visible as its own question — ledgered as
  D67.** Within a run the policy is fixed (`#selectionRequest` reads `run.opponentPolicy`,
  `service.ts:1790-1812`), so a band cannot change mid-run today and the guard is sufficient.
  Confirmed at HEAD `[V]`, including that `identityFor` (`opponent-selector.ts:420-426`) builds
  the comparison identity with **no** `eloApplied` at all, so even a stored selection that carries
  one compares equal. It would not be sufficient if a future RFC let a session change band
  mid-run. **Not changed here, and the reason is sharper than "deferred":** the obvious one-clause
  fix — add `eloApplied` to `sameEngine` — would break reuse for *every* band-calibrated run
  today, not merely across the upgrade. `sameEngine`'s right-hand side is `identityFor(mode)`,
  which carries no `eloApplied` under any circumstances, while the stored left-hand side carries
  one whenever the pack declared a `targetElo` — which 35 of 35 packs do. The comparison would
  fail universally and the journal would reuse nothing, silently converting *fixed* resistance
  into fresh selections: the exact failure `design/03-product-breadth.md:145-148` says destroys a
  comparison group. A correct D67 fix must therefore give `identityFor` the run's band **and**
  reckon with pre-fix records, which is a migration-shaped question and belongs to its own RFC.
  Recorded here so the one-clause version is never attempted.

**What *would* have made this a much larger RFC, and is confirmed absent:** no path recomputes an
opponent move for an existing run. The three `selector.select` call sites in REST
(`rest.ts:899-917` `/select-move`, `:1038-1044` the human-split guidance panel, `:1381-1389` the
prediction distribution — at `:910`, `:1038` and `:1381` respectively) all serve *new* requests;
`service.ts:829-830` and `:953` serve group creation and group reply. The run-copying path is **`RunService.flip`** (`service.ts:569-574`) —
the draft called it `deriveRun`, which is not a symbol in the tree; the line numbers happened to
land inside `flip`. Re-verified under the correct name: `flip` builds a new session, calls
`createRun`, `createDerivedRun` and `#project`, and **calls no engine** `[V]`. Its sibling
`createRepertoireGapRun` (`:576`) likewise creates a run without selecting a move — it is a
`targetElo` boundary (§9), not a replay path.

### 12. Register claims — stated loudly

| Resource | Claim | Note |
|---|---|---|
| **Run schema** | **0.14 → 0.15** | `$defs/selectionCandidate` gains optional `offWindow` (§10). Additive only |
| **Migration** | **20**, `STORAGE_VERSION` 19 → 20 | **Stamp-only**: re-stamp `schema_version` and the snapshot's `schemaVersion` `"0.14"` → `"0.15"`, modelled literally on `#upgradeV013Runs` (`apps/server/src/storage.ts:2719-2728`) and registered like migrations 16 and 18. Mandatory rather than cosmetic because reads filter on `DRILL_RUN_SCHEMA_VERSION` (`storage.ts:626`, `:730`) — omitting it hides every existing run |
| **Pack schema** | **none. 0.23 stays free** | §9's reasoning: a band range is a deployment capability, not a document fact. `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`, currently `0.22`) is untouched |
| **0.19** | not claimed | frozen shut; the constant is monotonic and passed it |

Register availability re-checked at HEAD `[V]`: the migration register ends at **19**
(`resistance-spectrum`, implemented), so **20 is free**; `DRILL_RUN_SCHEMA_VERSION` is `"0.14"`
and 0.15 is unclaimed; `DRILL_PACK_SCHEMA_VERSION` is `"0.22"` and 0.23 is unclaimed, with 0.19
recorded as *"frozen shut, not free"* by `archive/transition-primitives.md`, which the row above
restates correctly.

The run-schema claim rests **entirely** on §10(b)'s `offWindow` marker. The alternative is retry
once, then refuse the selection with a typed error rather than record a marked hole — under which
**this RFC claims no run schema version and no migration**, and 0.15 and migration 20 return to
the pool.

**Cross-review ruling, 2026-08-15: keep the marker. The claim stands, and the fork is closed.**
Four reasons, in order of weight:

1. **The alternative is not actually register-free.** A typed refusal is a new published error
   code — a vocabulary the deployment must publish and clients must handle. It trades a schema
   number for a wire-vocabulary claim and a new mid-drill failure mode. "Zero register footprint"
   overstates it; the cost moves rather than vanishes.
2. **The residual is unbounded and the state fix is unproven at zero.** §10(a) measured
   **0 in 2,100**, which is not zero — it is a rate below ~1/2,100 at 95% confidence, on one
   image, on one host. A refusal path taken at an unknown small rate is a defect that appears in
   production and nowhere in testing. A marked record is inspectable the first time it happens.
3. **Refusal contradicts the product's own invariants.** The learner has committed a move and the
   opponent must reply; a 422 at that moment is the drill breaking, in the one loop
   (`design/00-thesis.md:21`) the whole product is. The draft's own sentence — *a hole in the
   record is a defect; a refused move mid-drill would be a worse one* — is correct and cross-review
   endorses it rather than reopening it.
4. **An unmarked absence is the failure this RFC is named after.** §10(a) without §10(b) means the
   record silently omits the played move at some unknown rate. That is *silence where a published
   marker belongs* — precisely what **record** forbids and what the declared-vs-executable law
   forbids in its own domain. Dropping (b) to protect a register number would make this RFC
   violate its own rule to save one integer.

The cost is honestly small: one optional boolean on a closed `$defs`, and the cheapest kind of
migration — stamp-only, modelled literally on an existing body, and the fourth consecutive
stamp-only claim after 16, 17, 18 and 19. Open question 4 is closed by this ruling.

### 13. What this RFC does not change

- `seedHonored` stays `false` on Maia and is not written anywhere new (§5).
- `Temperature` and `TopP` defaults (`opponent-selector.ts:73-74`) are unchanged.
- `policyConfigDigest`, the selection cache key (`:184-187`) and its inputs are unchanged, so no
  cache-key collision or invalidation follows from this RFC.
- `policyModeApplied` and its vocabulary are unchanged.
- The strong engine's `movetime` budget and profile are unchanged.
- No pack, fixture, or content file changes. `content/candidates/onramp-00008/pack.json` stays
  valid (§9).
- **`EngineIdentity` and `$defs/selectionEngine` do not grow.** `SelfElo`/`OppoElo` (§8) are sent,
  not recorded; the applied-band record remains the single `eloApplied` field
  (`schemas/drill_run.schema.json:125-139`, closed).
- **What this RFC *does* touch outside the server, listed because §13 previously implied nothing:**
  `apps/web/src/lib/api.ts:272-279` (the client mirror of `policyProfiles`, §9) and
  `apps/web/src/lib/outcome-presentation.ts:74-77` and `:106-118` (the engine-row rendering and
  the honesty sentences, §9 and §11).

## Deviations from design

**None.** §9's refusal to bake a band range into the pack format is a *narrower* reading than
D60's ledger row suggests ("a run may request Elo 50 or 9000 and the format accepts it"): the
format still accepts it, and the deployment refuses it by name. The row's stated requirement —
*"a published capability and a named refusal, not silence"* — is met in full. Flagged here
because a reviewer scanning for a schema `minimum` will not find one, and that is deliberate.

**Two notes added by cross-review, neither a deviation:**

- §11's rewording of the resistance panel's multi-engine sentence touches no design-tier text —
  the string is not quoted in `design/` or `docs/` (`grep`, HEAD). It is a correction *toward*
  `design/05-in-run-experience.md`'s honesty invariants, not away from them: the current sentence
  can assert a split its own evidence rows contradict.
- §9 satisfies D60's requirement *mechanically* while leaving it *materially* weak, because the
  only range the instrument publishes is `[0, 5000]` and law 8 forbids this RFC from supplying a
  better one. That gap is escalated (ledger row 2, open question 6) rather than papered over, and
  D60 should not be flipped to ✅ on this RFC alone without the owner ruling that gives the range
  a ground.

## Acceptance criteria

1. **Option table.** Against the pinned Maia image and a local Stockfish, the supervisor's
   parsed option table reproduces the handshake: every advertised option present with its type,
   and every spin option carrying the advertised `default`/`min`/`max` verbatim. A unit test with
   a recorded handshake transcript covers the grammar including `combo` `var` tokens, options
   whose names contain spaces (`Clear Hash`), and **`type string` options with a non-numeric
   default** (`Temperature`, `TopP` — both `default 1.0`). The Maia arm asserts against the six
   lines already committed at `tools/r4-difficulty-harness/out/maia-availability.json:11-16`, so
   the test has a pinned expected value rather than a self-fulfilling one.
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
6. **D60 mechanism ships; D60 remains open pending R10.** `/capabilities` publishes
   `policyProfiles.human_common.elo` with a `source` and
   the verbatim `advertised` pair; with a stub engine advertising `min`/`max`, a `targetElo`
   outside the range is refused 422 at **all five** request boundaries (§9) with the published
   range and `source` in the message; a stub advertising `[0, 5000]` plus a configured
   `bandRange` publishes `advertised+configured` and refuses on the **intersection**; with
   `source: "unpublished"`, the same value is accepted and recorded. Two regression tests: one
   asserts no literal band number exists outside `EngineSpec` configuration and the emitter
   clamp; one enumerates the request boundaries and asserts each routes through the single shared
   range check, so a sixth boundary added later fails the test rather than the learner.
7. **D59 closed.** Re-run R5's arm C at the new width over the same 35 positions × 20 repeats:
   **0** off-window `bestmove` observations, and latency reported against the **per-instrument-call**
   axis of the 2026-08-15 two-axis budget ruling (`design/02-product-shape.md:159-180`) — for
   `human_common` a selection is exactly one Maia call, so the per-call and per-selection budgets
   coincide at 500 ms (`docs/engine-workers.md:236`). The repo already holds the relevant reading
   and it is not close: R4 measured **median 166.7 ms, max 421.1 ms** at 20 returned candidates
   over 60 probes (`tools/r4-difficulty-harness/out/maia-availability.json`, `byRange.outOfRange`)
   `[V]` — see open question 3. If the widened width nevertheless breaches the target on the
   implementation host, §10(a) is withdrawn and §10(b) alone ships — that outcome is acceptable and
   must be logged, not hidden. It must also be logged **as a per-call reading**, not as a
   per-selection one, because the ruling's own worked example is that conflating the two
   *"would have forced the opponent to consider fewer replies, making it worse at the only thing
   it exists to do"*.
8. **The post-condition is armed, and it does not degrade anything.** With a stub Maia returning a
   `bestmove` absent from its own `info` lines: the selection records the played move with
   `offWindow: true`; `humanConcessionMass` still returns a value (not `null`) for the same
   position; `#theoryStrict` does **not** log `DEGRADED_POLICY_MASS` and does not fall back to
   `sampleRankWeighted`; and group seeding omits the marked candidate. The `#theoryStrict` arm is
   the one that fails loudly if the marker leaks into a mass-sensitive input (§10).
9. **Replay is byte-stable.** A fixture run recorded before the change replays to an identical
   `readBackReplay` output after it, and a group reply journal fixture reuses the same recorded
   selection before and after. This is criterion 3 of §11 executed as a test.
10. **Migration 20.** A database at `STORAGE_VERSION` 19 with runs at `"0.14"` migrates to 20 with
    every run at `"0.15"`, no other field altered, byte-compared. A database at 18 migrates
    through 19 and 20 in order.
11. **Abort no longer leaks width — on both engines.** (a) An evidence job aborted after its
    `bestmove` is followed by a job that requests no MultiPV; the transcript shows an explicit
    `setoption name MultiPV value <spec width>` on the second request and its response carries a
    single `multipv 1` line. (b) **On the opponent engine:** an `enumerate` at count 8 is followed
    by an ordinary `strong_engine` selection; the transcript shows `#strongEngine` sending its own
    `setoption name MultiPV value 1`, and the assertion holds with `enumerate`'s `afterCommands`
    removed. (b) must pass **before** the removal lands (§8).
12. **The engine panel does not assert a split that did not happen.** A fixture run with pre-fix
    plies (no `eloApplied`) and post-fix plies (`eloApplied: 1500`) on the same engine renders two
    distinguishable rows — the band appears in each — and the summary sentence reads *"more than
    one engine configuration"*, not *"more than one engine"*. A second fixture with two genuinely
    different engine identities still renders *"more than one engine"* (§11).
13. **Docs.** `docs/engine-workers.md` gains the request contract as a named section — **five**
    obligations, not four — and its stale selection-cache-key line (`:136`, missing `packId` —
    R5 §7; the draft cited `:137`) is corrected in the same pass. `workers/maia/README.md`'s
    first-contact paragraph (`:42-45`) gains the advertised bounds it currently omits, so the
    option table has a documented expected value.

## Ledger rows

This RFC may not write `design/BACKLOG.md`; claude lands these.

**Already landed — do not duplicate.** The draft proposed four rows; cross-review found three of
them already in the ledger, landed by claude on 2026-08-15 while this draft was being written:

| Row | Ledger location | Reconciliation |
|---|---|---|
| **The engine request contract** (law) | `design/BACKLOG.md:253`, *"The engine request contract (promote to design tier)"* | ✅ landed. **Needs one amendment when this RFC is accepted:** the landed row states **four** obligations; §3 establishes **five**, adding **bind**, and re-maps D59 from *record* to *state* + *record*. The row's summary sentence and its per-defect mapping both need updating |
| D66 **An aborted MultiPV job leaves the engine at that width** | `design/BACKLOG.md:115` | ✅ landed. §2's *"not in the ledger"* is corrected. Closed by this RFC's **state** obligation, per §8 — but only once §8's corrected ordering is followed |
| D67 **`sameEngine` is indifferent to the band** | `design/BACKLOG.md:116` | ✅ landed. §11 adds the reason the one-clause fix is wrong; the row may be annotated but needs no new row |
| D65 **The handshake throws away the contract the instrument publishes** | `design/BACKLOG.md:114`, already *"🔨 owned by `engine-request-contract`"* | ✅ landed and already owned by this RFC. §5's scope list is corrected from four rows to five |

**Genuinely new — to land:**

| # | Row | Kind |
|---|---|---|
| 1 | `capabilities.engines` omits `stockfish-play` (`application.ts:325-328`) — the opponent-side strong engine's identity is not published, though `policyProfiles.strong_engine` is | 📝 gap |
| 2 | **The advertised Elo range is a spin formality, not a competence claim.** The pinned Maia advertises `Elo … min 0 max 5000` (`tools/r4-difficulty-harness/out/maia-availability.json:11`), so a bound sourced from the instrument alone refuses 9000 and **accepts 50** — D60's own example. This RFC ships the narrowing *mechanism* (`EngineSpec.bandRange`, published as `configured`) and deliberately configures **no number**, because inventing one is what law 8 forbids. Needs an owner ruling supplying a range and its ground, or an explicit ruling that `unpublished`-in-effect is acceptable | ❓ owner decision |
| 3 | **`#theoryStrict` and `#practicalResistance` request `MultiPV` above the advertised maximum** (`Math.max(8, legalCount)` vs `max 20`, `opponent-selector.ts:538`, `:620`). Harmless because the engine clamps internally, but it is a **bound** violation on a non-`targetElo` option, i.e. the contract failing on its own terms one line away from where it is being enforced. Fixed by §8; ledgered so the pattern is searchable | 🐞 defect, minor |
| 4 | **`engineName` cannot distinguish two rows the resistance panel says are different engines** (`apps/web/src/lib/outcome-presentation.ts:74-77` renders no band; `:106-112` asserts the split). Pre-existing, made reachable by this RFC, fixed in §11. The general shape — *a summary sentence whose evidence rows cannot support it* — is worth a sweep beyond this panel | 🐞 defect |
| 5 | **Maia advertises `SelfElo` and `OppoElo` and nothing in the repo has ever set or measured them** (`tools/r4-difficulty-harness/out/maia-availability.json:12-13`, both `default 1500`). §8 sends them at their advertised defaults so the request is closed, deliberately without asserting what they *should* be relative to `targetElo` — a self-rating and an opponent-rating are plausibly load-bearing for a human-choice model, and this repo has zero measurements of either. An R5-shaped probe would settle it | ❓ research |

## Open questions

1. ~~**Does the pinned Maia image advertise `min`/`max` on `Elo`?**~~ **CLOSED by cross-review,
   2026-08-15 — the answer was already in the repo and the draft went looking for it in the
   future.** `tools/r4-difficulty-harness/out/maia-availability.json:11` (committed with R4 at
   `86b09c2`, captured through the shipped supervisor) records
   `option name Elo type spin default 1500 min 0 max 5000` `[V]`. **Yes, it advertises bounds —
   and they are `[0, 5000]`,** which is the widest a UCI spin conventionally goes. So D60's
   refusal does fire, and refuses almost nothing: it rejects 9000 and accepts 50. §9 is rewritten
   on this: `configured` now *narrows* `advertised` rather than only substituting for it, and the
   residual — that this RFC ships the mechanism and no number — is escalated as ledger row 2
   rather than buried as a resolved question. The methodological point is worth keeping: an open
   question that names a specific artifact should be checked against the repo before it is
   deferred to implementation.
2. **Should `strong_engine` move from `movetime` to a fixed depth?** The reset removes the
   *carried* nondeterminism; the wall clock remains. R4 has the cost curve (median 42.8 ms at
   depth 12, 170 ms at 16 — `practical-difficulty-outside-tablebase.md:179-184`) so this is
   decidable, but it changes opponent strength, which is a product question, not a request
   contract. Deferred to its own RFC or ledger row.
3. **Does §10(a)'s wider window fit the 500 ms target?** **Narrowed, not closed, by cross-review.**
   Two things the draft did not settle. *(i) Which axis.* The 2026-08-15 owner ruling
   (`design/02-product-shape.md:165-180`) splits the budget into **per instrument call** and **per
   selection**. A `human_common` selection is exactly **one** `#maia` call (`:502-511`), so the
   two coincide here and the applicable number is the per-call 500 ms — the axis that matters is
   named, and the ruling's warning against conflating them does not bite this case. It *does*
   bite `practical_resistance`, which makes one tablebase probe and one Maia call **per
   candidate** (`:609-621`, up to four) and therefore carries a per-selection budget this RFC
   neither sets nor touches. *(ii) The evidence already in the repo.* R5's 367.8 ms was measured
   on a loaded host and R5 makes no latency claim; R4's availability probe measured the same
   engine at **median 166.7 ms, max 421.1 ms with 20 candidates returned** over 60 probes
   (`tools/r4-difficulty-harness/out/maia-availability.json`, `byRange.outOfRange` —
   `medianCandidates: 20`) `[V]`. That is the closest existing reading to §10(a)'s shape and it
   fits, with margin, on the correct axis. It remains open only because it is a single host and
   acceptance criterion 7 must re-measure on the implementation host. Still the one criterion that
   can legitimately fail — but the prior is now "fits", not "unknown".
4. ~~**`offWindow` or refuse?**~~ **CLOSED by cross-review, 2026-08-15: the marker ships; run
   schema 0.15 and migration 20 are claimed, not contingent.** The ruling and its four reasons are
   in §12. In short: the alternative is not register-free either (it publishes an error
   vocabulary), 0-in-2,100 is not zero, a 422 mid-drill breaks the product's core loop, and an
   unmarked absence is the exact silence this RFC's **record** obligation exists to forbid.
5. **Does the reset belong on the evidence path at all, or does it belong to a re-grounding
   pass?** §7 sets `resetSearchState: true` on `StockfishEvidenceExecutor` on the rule's
   authority, but every evidence row already persisted was produced with a carried hash. This RFC
   does **not** invalidate or re-run stored evidence — it makes future evidence reproducible. If
   the owner wants stored evidence re-grounded, that is a content operation with its own cost and
   its own RFC. Cross-review adds the counterweight that bears on the answer: R4 §7 found the
   *concession set identical on 171/171* and per-move classification agreeing on 2,416/2,416
   under hash carry-over (§1), so evidence used **classificationally** is not suspect; evidence
   used as a **number** is. That is a smaller re-grounding problem than the row implies, and the
   owner should be told so before pricing it.
6. **Who supplies the Elo range, and on what ground?** Opened by the closure of question 1
   (ledger row 2). The instrument's `[0, 5000]` is a spin formality; `clampElo`'s `[1100, 2000]`
   is an authoring convention that disclaims its own authority (`position-seeds.ts:232`); *"Maia
   is trained at ≈1100–1900"* is model knowledge this repo has measured at exactly three points
   and law 8 forbids this RFC from asserting. The mechanism ships either way. The number is an
   owner decision, and until it is made the shipped refusal is honest and nearly toothless — which
   must be logged as such rather than reported as D60 closed.

## Changelog

- 2026-08-15: implemented. Run schema 0.15 and migration 20 shipped stamp-only.
  Both gates passed (591 tests / 96 files; browser 24 passed at zero retries,
  optional Maia browser case skipped). The pinned Maia acceptance arm completed
  700/700 calls with zero errors and zero off-window samples; median 173.2 ms,
  p95 230.5 ms, maximum 481.8 ms. D60 remains open pending R10 as ruled: the
  narrowing mechanism ships, but this deployment publishes only the engine's
  `[0, 5000]` option-acceptance range.

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
- 2026-08-15: **adversarial cross-review** (a second agent; not the author). Every code claim
  re-verified at HEAD by symbol. Outcome: the rule survives, with one obligation added and one
  mapping corrected; six blockers fixed in place; the contingent register claim resolved to
  **claimed**.
  - **The rule gains a fifth obligation, `bind`** — atomicity of setoption + clear + search in one
    queued exchange. It was a subordinate clause inside *clear* and does not belong there: the
    RFC's own `position-seeds.ts` correction is a case where the clearing is correct and the
    binding is missing, and **state** is not sufficient without it. Acceptance criterion 3 was
    already testing it (§3, §7).
  - **D59 re-mapped from `record` to `state` + `record`.** The RFC's own preferred remedy —
    widening the window — is a *state* fix; *record* is the residual. The four-defects/four-
    obligations table was clean at the cost of contradicting §10's own preference ordering (§3).
  - **"They meet at exactly one point" corrected.** §4 claimed one meeting point and then mapped
    the older law onto two obligations in the next sentence. The overlap is **two obligations of
    five** (*bound* wholly, *record* partly) and **one ledger row** (D60) (§4).
  - **BLOCKER, §8: `#strongEngine` does not send `MultiPV`.** The draft said it did and deleted
    `enumerate`'s `afterCommands` restore on that basis — which would have left `stockfish-play`
    at the enumeration's width for every later selection, shipping D66 on the opponent path while
    claiming to close it. §1 of the same RFC says the opposite. Fixed with a normative ordering
    and an extended criterion 11.
  - **BLOCKER, §9: the advertised `Elo` range was already measured and is `[0, 5000]`.** Open
    question 1 sent implementation to capture a handshake the repo has held since `86b09c2`
    (`tools/r4-difficulty-harness/out/maia-availability.json:11`). The answer breaks the draft's
    precedence — `configured` applied only when nothing was advertised, so D60's refusal would
    have accepted `targetElo: 50`, the row's own example. `configured` now **narrows**
    `advertised`; the missing number is escalated as an owner decision, not resolved by invention.
  - **BLOCKER, §9: three request boundaries of five.** The pack-authored path
    (`service.ts:375-380`) — the boundary the committed `targetElo: 1939` actually travels — and
    the repertoire path (`rest.ts:755` → `repertoire.ts:78` → `service.ts:576`) were unlisted.
    Refusal is now enforced through one shared helper with an enumeration test.
  - **BLOCKER, §11: the "true, not a defect" claim is false.** `engineName` renders no band, so a
    run straddling the upgrade shows the *same engine string twice* under *"This path faced more
    than one engine"*. §11 now requires the band in the row and a corrected summary sentence.
  - **BLOCKER, §10(b): scope and consumers.** "After any Maia selection" is undefined on two of
    three Maia paths (`#theoryStrict` and `#practicalResistance` never play `bestMove`), and the
    consumer list omitted `#theoryStrict`'s `missingMass` gate — which would have silently flipped
    that mode to inverse-rank sampling on the plies the marker fires.
  - **BLOCKER: three "new" ledger rows already exist.** D65 (owned by this RFC), D66 and D67
    landed 2026-08-15. §2's *"not in the ledger"*, §5's *"four ledger rows"* and the proposed-rows
    table are corrected; four genuinely new rows replace them.
  - **The contingent register claim is RESOLVED: keep the marker.** Run schema **0.15** and
    migration **20** are claimed outright, no longer contingent. Reasons in §12; the decisive one
    is that dropping §10(b) would leave the record silently short of the played move at an unknown
    rate, which is the precise silence this RFC's **record** obligation exists to forbid.
  - Smaller: the R4 counterweight (*concession set identical 171/171*) restored to §1;
    `deriveRun` corrected to `flip`; `SelfElo`/`OppoElo` brought under **state**; `MultiPV` above
    the advertised `max 20` in two selector paths named as a **bound** violation; `#maia`'s
    `multiPv` made required; the evidence executor's restore width sourced from its spec rather
    than a literal `1`; the 500 ms question tied to the **per-instrument-call** axis of the
    2026-08-15 two-axis ruling with the repo's own width-20 reading (median 166.7 ms, max
    421.1 ms); `apps/web/src/lib/api.ts` added to the change surface; line references re-pinned by
    symbol.
