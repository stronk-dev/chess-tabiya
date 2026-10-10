# RFC: Pack training forms — the set grain, pass marks, the guided first pass, and tempo cycles

- **Status:** implementing — format/mechanics and installed catalogue reads have landed. Durable execution amendment §4.4–§4.10 is **draft, not implementation authorization**; independent review and acceptance are required. No complete learner set journey ships; the ramp remains unwired to the nine-field clamp ([[D3317]]). Historical receipts are in the changelog.
- **Author:** claude
- **Created:** 2026-08-23
- **Design refs:** `design/01-training-model.md` §blocked/varied repetition; `design/05-in-run-experience.md` §3 (the assistance ladder) and §3a (the ∩ algebra); `design/03-product-breadth.md` §Library
- **Exploration gate:** [[D1310]] — same mandate as `rfc/return-scheduling.md`; the two owner asks are quoted at that RFC's §0 and are the origin of this lane
- **Depends on:** `rfc/pack-capability-contract.md` (**lane 0.30** — this document claims **0.32** behind it and behind `famous-games`' 0.31); `rfc/intent-presets.md` (the ∩ algebra, **consumed and never re-derived**); the shipped `TimingWindowDefinition` and `TempoVerdict` (`packages/schema/src/drill-pack/types.ts:119-133`)
- **Parent / amends:** amends `DrillPackDefinition` (`types.ts:208-274`); introduces one sibling artefact kind. Answers [[D867]], [[D868]], and the pack-format half of [[D862]]
- **Supersedes / superseded by:** —
- **Planning:** `planning/training-methods/`

```tabiya-claims
migration | position next | training_passes and training_pass_members; no historical adoption or run-schema rewrite
```

## Summary

Three famous training methods — Yusupov's scored chapters, the guided first pass,
and the Woodpecker tempo cycle — turn out to want **one missing thing**, and it is
not what any of them looks like from the outside.

**There is no set.** `DrillPackDefinition` is a single position with its
consequences, and nothing in the pack format, the content tree, or the database
groups packs into an ordered collection. Verified three ways at HEAD: no
`packSet` / `collection` / `course` type in the schema, no such table in
`storage.ts`, and `content/` has a flat `packs/` directory. A pass mark is
*"score ≥ X of Y across the chapter"*; a tempo cycle is *"this same set, faster"*.
Both are properties **of a set**, and there is nowhere to put them.

So this RFC introduces the set grain and pays for it once, rather than three
times. The second half is cheaper than expected: the tempo verdict already ships,
and the guided first pass turns out to be expressible **only** as a tightening
ceiling — which the ∩ algebra already enforces and which is the honest shape
anyway.

## §1. The set grain

### 1.1 The measurement

| Claim | Evidence at HEAD |
|---|---|
| the pack format has no collection concept | `types.ts:208-274` — `DrillPackDefinition` has `variantOf` (a **pairwise** relation), `concepts` and `shapes` (**tags**, unordered, no cardinality), and nothing else that groups |
| the database has no collection table | grep for `pack_set` / `courses` / `collection` over `storage.ts` → **0 hits** |
| the content tree is flat | `content/packs/`, with `candidates`, `drafts`, `principles`, `shapes`, `sources`, `witnesses` as siblings — none of them an ordered pack collection |
| a campaign is not the missing set | `rfc/campaign-core.md:125-127` forbids node re-entry after seal, so a campaign structurally **cannot** carry a repeated cycle |

`concepts` is the near-miss worth naming: 50 of 92 packs carry it and it does
group. It cannot serve, because a tag has **no order and no denominator**, and a
pass mark needs both — *"7 of 10"* requires knowing there are ten and which ten.

### 1.2 The artefact

A training set is a **new sibling artefact** with its own `formatVersion`,
starting at **0.1**:

- `id`, `formatVersion`, `title`
- `members`: an **ordered** list of `{ packId, ordinal }`
- `passMark` (optional) — §2
- `tempo` (optional) — §4
- `provenance`, reusing the pack's `provenance` shape unchanged

**A back-reference on the member packs is refused.** The alternative — each pack
carrying `setMembership: { setId, ordinal }` — needs no new artefact and is the
cheaper-looking option. It fails on two grounds already ruled in this register:
the set's pass mark is a property **of the set**, so under a back-reference every
member must repeat it and nothing can refuse a disagreement ([[D523]], grammar
stated once and assumed elsewhere); and `pack-population-provenance` refuses a
copied field on exactly this reasoning — *a copy would be validated against
nothing*. Membership also becomes underivable without scanning all 92 packs.

**Set membership does not change what a pack is.** A member pack is a valid pack
standing alone, opens outside its set, and needs no field added. That is the
property that makes the grain additive.

### 1.3 What this costs, stated plainly

Gate F clause 1 is a **Boolean at threshold zero, not a depth count**
(`planning/exploration/plan.md:48`; the correction `rfc/variants.md` landed). This
document claims a pack lane, so clause 1 stays where `graduation-clearance`,
`pack-population-provenance`, `pack-capability-contract` and `famous-games`
already put it. **Lane depth is not an argument against this RFC and is not used
as one here.**

The real cost is the second artefact kind: validation, digest, lint, and the
publication check all learn a new file shape. **`digestDrillPack` is not
extended** — a set digests separately, so **no pack digest churns** and no ledger
re-stamps. That is the deliberate difference from lane 0.30, whose stamp sits
inside the pack digest and churns all 92.

**Lane contention, recorded:** `rfc/skills.md`'s open question 9 states that its
schema-enforced-membership alternative *"would claim lane 0.32"*. That option is
unruled and this document is drafted, so 0.32 is taken here; if the owner rules
skills toward schema enforcement, **that RFC inherits 0.33** and this claim does
not move.

## §2. Pass-mark sets (Yusupov)

The tradition's scorecard: attempt every exercise in a chapter, score it, and
**advance or repeat the chapter as a whole**. The unit of progression is the
chapter, not the exercise — which is why it needs §1 and why it has never been
expressible here.

`passMark` on the set:

- `require`: a count of members reaching a named objective state
- `of`: `"all"` or an explicit member subset
- `onFail`: `"repeat_set"` — the only value specified

**The verdict is the shipped objective verdict, not a new grade.** A member
"passes" when its attempt resolves `stable` under its own authored objective
(`ObjectiveGrading`, `types.ts:318-323`). This RFC adds **no scoring vocabulary,
no points, and no per-member number**. The set-level count is arithmetic over
verdicts the runtime already computes — which is what keeps it clean under law 8
(§6).

**The threshold is authored and published.** It appears on the set surface before
the learner starts. A hidden threshold is refused by name at
`rfc/skills.md:436-437`.

**`onFail: "repeat_set"` is a re-offer, not an enforcement.** Nothing in this
document locks a learner out of a pack. The set says *this chapter is not
passed*; `/learn` re-offers it.

## §3. The guided first pass

The ask is graduated support: the first pass through unfamiliar material is
guided, later passes are bare.

### 3.1 The mechanism the ∩ algebra dictates

`design/05-in-run-experience.md:230-232`, verbatim:

> **Effective assistance is `requested preset ∩ workflow/session ceiling ∩
> honesty/access ∩ source availability` — every term only narrows.** A workflow
> or session ceiling can only remove assistance, never add it.

**A pack therefore cannot grant assistance, and this is not a limitation to route
around — it is the correct shape.** The guided first pass is expressible in
exactly one form: a **ceiling that tightens with attempt number**. Pass 1 permits
up to the authored rung; by pass 3 the ceiling has descended to rung 0
(rules-derived sight). The learner's own preset intersects as it always does, so
a learner who wants a bare first pass gets one, and **no pack can force help onto
a learner who declined it**.

`assistanceCeilingRamp` on the pack, the one field this document adds to
`DrillPackDefinition`:

- an ordered list of `{ throughAttempt: number, ceilingRung: 0..5 }`
- **rung 6 (LLM rendering) is not a legal value** — ADR-0005; the renderer may
  only word rungs 0–5, so a ceiling *at* 6 would name a source that grants nothing
- absent means no ramp, which is today's behaviour and stays the default for all
  92 packs

`attempts.attempt_no` ships (`storage.ts:4123`), so the ramp needs no new state.

### 3.2 The rung vocabulary is cited, not restated

The rungs are `design/05-in-run-experience.md:63-79`, and this RFC **references
them by number without re-listing them**. Re-listing is the [[D523]] failure —
the register already carries a case where a grammar written twice drifted.

### 3.3 What is NOT decided here

The ADR-0006 fork — whether a guided pass is a distinct *mode* or a preset
ceiling — is **⚠ OWNER** and open question 1. §3.1 specifies the ramp's
**mechanism**, which is identical under either answer because the ∩ algebra
admits only one. **Open question 1 is therefore not acceptance-blocking.**

## §4. Tempo cycles (Woodpecker)

The Woodpecker method: the same set, repeated, **each cycle faster than the last**,
until recognition replaces calculation.

### 4.1 Almost all of this ships

| Piece | State |
|---|---|
| a per-position tempo window | `TimingWindowDefinition` ships — `opens`, `closes`, `readiness`, `luxuryMoveBudget` (`types.ts:119-133`) |
| a tempo **verdict** | `TempoVerdict` ships, reachable as `atWindow: { windowId, verdict }` (`types.ts:135-138`) |
| grading opt-in | `gradeOutpaced` ships, *"authored contexts opt in; absence is deliberately ungraded"* |
| authored users of the window | **4 packs**, all via the `spendAtLeast` arm |
| authored users of the **verdict** arm | **0** |
| a cycle over a set | **nothing** — this is the gap |

So the machinery is a **third** shipped-with-zero-consumers case, exactly as
`design/research/titled-player-training.md:11-19` predicted for the tradition as a
whole. What is missing is the **set-scoped cycle**, and §1 supplies its home.

### 4.2 `tempo` on the set

- `cycles`: an ordered list of `{ ordinal, budgetScale }`, where `budgetScale`
  multiplies each member's authored `luxuryMoveBudget`
- a cycle's members are served in the set's `ordinal` order
- **the last cycle's scale is authored, not extrapolated** — no implicit decay

**Scaling an authored budget is not a chess claim.** The author set the budget;
the cycle scales it by an authored factor. Nothing here invents a time in which a
position "should" be solved.

**The refusal that keeps this honest:** de la Maza's Seven Circles, as popularly
shipped, has trainer consensus against it (`titled-player-training.md:178-191`).
Only the recognition-sized, Woodpecker-corrected form may inform a feature, and
that restriction is **pack-declared, not learner-chosen** — a set whose members
are too few or too varied for recognition simply does not declare `tempo`. There
is no learner-facing "cycle count" knob, which is the specific thing that made the
Seven Circles harmful.

### 4.3 Tempo cycles and the return ladder do not compete

A cycle is **within a set, over hours or days**; the ladder is **per root, over
weeks**. `rfc/return-scheduling.md` schedules roots; a cycle sequences members
inside a set the learner has opened. Criterion 9 asserts a cycle writes no
`schedules` row, so the two cannot silently become one mechanism.

### 4.4 Durable execution amendment — D3535 (DRAFT)

This specifies the **remaining original set journey**, not a new training engine. It does not
reopen the implemented format, make a new evidence producer, or settle D3317. Independent
acceptance of this amendment precedes all execution writes. D3318 and D1/D3 remain open.

The source gaps are concrete: `RunService#create` has a caller-owned `persist` hook but calls
`#project` afterwards; `#registeredPack` resolves only through the installed pack registry.
`projectAttempts` projects every current branch, and `SQLiteRunStorage#upsertAttempts` updates
existing `(run_id, branch_id)` verdicts and automatically refreshes root schedules. Consequently:
current progress cannot be the immutable set result; a creation-only budget modifier cannot
survive replay; and a pure sequencer test cannot establish scheduler isolation.

**Execution context is an owned sidecar, not another run event.** Two relational tables link a
pass to exact member runs. `DrillRun`, `SessionSource`, `run.started`, `digestSessionSource`,
pack schema/version/digest and existing event bytes remain unchanged. A private run response
adds an optional `training` view with pass ID, ordinal, cycle ordinal and applied scale; this
is navigation/context, not a chess payload or assistance grant. Its server resolver looks up
the run link, never accepts a client-supplied scale, and is used by all paths below. Historical
runs have no link. No old attempt is adopted by pack ID, FEN, date or learner history.

### 4.5 Storage, snapshots and exact ownership

Add the following STRICT tables in the claimed migration, assigning its number only at landing.
All JSON uses the existing closed parsers and ordinary document validation. It is not trusted
because it is stored. The application additionally enforces the cross-row invariants below.

```sql
CREATE TABLE training_passes (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  set_document TEXT NOT NULL CHECK(json_valid(set_document)),
  set_digest TEXT NOT NULL,
  cycle_ordinal INTEGER CHECK(cycle_ordinal >= 1),
  budget_scale REAL NOT NULL CHECK(budget_scale > 0 AND budget_scale <= 1),
  parent_pass_id TEXT UNIQUE REFERENCES training_passes(id),
  transition_kind TEXT NOT NULL CHECK(transition_kind IN ('start','repeat','next_cycle')),
  creation_request TEXT NOT NULL CHECK(json_valid(creation_request)),
  creation_result TEXT NOT NULL CHECK(json_valid(creation_result)),
  abandon_request TEXT CHECK(abandon_request IS NULL OR json_valid(abandon_request)),
  abandon_result TEXT CHECK(abandon_result IS NULL OR json_valid(abandon_result)),
  status TEXT NOT NULL CHECK(status IN ('active','complete','abandoned','unavailable')),
  revision INTEGER NOT NULL CHECK(revision >= 1),
  completion TEXT CHECK(completion IS NULL OR json_valid(completion)),
  created_at TEXT NOT NULL,
  ended_at TEXT
) STRICT;
CREATE TABLE training_pass_members (
  pass_id TEXT NOT NULL REFERENCES training_passes(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL CHECK(ordinal >= 1),
  pack_input TEXT NOT NULL CHECK(json_valid(pack_input)),
  pack_digest TEXT NOT NULL,
  run_id TEXT UNIQUE REFERENCES drill_runs(id) ON DELETE SET NULL,
  original_run_id TEXT,
  state TEXT NOT NULL CHECK(state IN ('pending','active','submitted','unavailable')),
  start_request TEXT CHECK(start_request IS NULL OR json_valid(start_request)),
  start_result TEXT CHECK(start_result IS NULL OR json_valid(start_result)),
  submit_request TEXT CHECK(submit_request IS NULL OR json_valid(submit_request)),
  submit_result TEXT CHECK(submit_result IS NULL OR json_valid(submit_result)),
  attempt TEXT CHECK(attempt IS NULL OR json_valid(attempt)),
  PRIMARY KEY(pass_id, ordinal)
) STRICT;
CREATE INDEX training_passes_owner ON training_passes(learner_id, created_at, id);
```

Pass IDs and command IDs are UUIDs, not timestamps or array positions. A pass has exactly the
snapshot's contiguous member ordinals. At most one member is active; a pending member may start
only when every smaller ordinal is submitted. A link is exclusively to a private pack run owned
by this pass's learner. Neither consent to read a run nor a writer ID grants access to the pass.
Retained `original_run_id` is an identity/tombstone, never authorization or a live foreign key.
Parent and child have the same owner and snapshots. The unique parent permits one successor;
concurrent Repeat/Next requests cannot create two continuations of one result. Further repeats
continue from the completed child; starting a separate pass remains available explicitly.

At initial Start retain the set document and **all** members before starting member 1. Each
`pack_input` is the normal pack loader input `{document, ledger, manifest, channel}`: absent
optional sidecars remain absent. These are small authored documents/current sidecars, not raw
research recordings. Recompute normal pack validation, grounding and position evidence when
loading them; never serialize a `PackRecord`, runtime brand, verdict allow-list or compiled claim
map as authority. No current member document substitutes for its retained bytes. Repeat and Next
copy the parent's retained inputs, including its authored cycle list, rather than today's set.

Shape/principle/concept resolution and public capability checks still use their existing
registries. A missing/incompatible required dependency refuses with a named reason; a snapshot
does not fabricate it. Optional unavailable evidence retains its existing honest-unavailable
behavior. Removing a set/member from the public catalogue prevents new standalone passes, but
does not erase a privately retained pass or replace its content. Existing privacy, content-rights
and access restrictions still apply. Retention does not promote publication/review status.

### 4.6 Commands, transactions and retry

Read routes are `GET /training-passes` (owned history, including unfinished passes) and
`GET /training-passes/:passId` (retained title/members, status/revision, active run, individual
objective verdicts and available next actions). No SQL record or internal request cache leaks
through these responses. Mutation bodies are closed; unknown fields are refused.

| POST route | Body in addition to authenticated identity | Successful immutable receipt |
|---|---|---|
| `/training-sets/:setId/passes` | `{passId, commandId, setDigest, writerId}` | `{passId, ordinal:1, runId}` |
| `/training-passes/:passId/start-member` | `{commandId, expectedRevision, ordinal, writerId}` | `{passId, ordinal, runId}` |
| `/training-passes/:passId/submit-member` | `{commandId, expectedRevision, ordinal, runId, branchId, nodeId, expectedEventSequence, writerId}` | `{passId, ordinal, runId, branchId, nodeId, verdict}` |
| `/training-passes/:passId/continue` | `{passId:newPassId, commandId, expectedRevision, action:'repeat'|'next_cycle', writerId}` | `{passId:newPassId, ordinal:1, runId}` |
| `/training-passes/:passId/abandon` | `{commandId, expectedRevision}` | `{passId, status:'abandoned'}` |

Initial Start captures scale 1/no cycle for a non-tempo set, or the first **authored** cycle for
a tempo set. It validates the current `setDigest`, ownership, complete member inputs and actual
runtime dependencies before mutation. Preparation may be asynchronous; no provider work runs
inside a SQLite transaction. Recheck ownership, saved command and revision immediately before
`BEGIN IMMEDIATE` writes. Member/run insertion and linkage commit together through the existing
creation persistence seam; failed preparation or transaction leaves neither an orphan run nor
a partly populated pass. Nested storage transactions must be removed from this composed path,
not suppressed with catch-and-continue. Ordinary standalone run creation stays unchanged.

Creation/start/submit/abandon request and receipt pairs live in their existing pass/member row:
no third command journal.
Idempotency scope is owner + route + pass + member/action. Check the saved command **before**
current-state/CAS refusal: identical ID and operands returns the original receipt even after
completion; same ID with different operands is 409 `TRAINING_COMMAND_CONFLICT`. A different
command against an already started/submitted slot or continued/abandoned pass is 409
`TRAINING_ALREADY_APPLIED`, with a read/resume action, not a second run/result. Another UUID
cannot bypass the unique parent. Revisions increment exactly once per accepted command;
stale revisions refuse with 409 `TRAINING_REVISION_CONFLICT` and no mutation.

No receipt contains a mutable whole-pass view. After acknowledgement the client reads current
state; an old receipt cannot overwrite a newer confirmed revision or change the active run.
Lost-response retry keeps the exact operands. Leaving the view cancels attachment/navigation,
not a committed server command; reload discovers the owned unfinished pass. Crossed pass/member
identities cannot attach. 404 hides foreign/nonexistent passes; unavailable execution is a typed
409 `TRAINING_SOURCE_UNAVAILABLE`, distinct from an empty catalogue or provider 503.

### 4.7 Submission, results and cycles

Submission is an explicit **Finish member** gesture, never a grade inferred by scanning history.
Read the stored linked run inside the transaction; require its current writer, exact event
sequence and named branch tip. Derive `projectAttempts` with the retained execution context,
choose its exact branch row and require `countable` (a real learner move), not a user-supplied
verdict. A fork retry is eligible under the same authored objective; another run/pass is not.
The frozen attempt contains only `{runId, branchId, nodeId, eventSequence, packDigest,
objectiveState, verdict, userPlyCount, endedAt}`. Existing `open` is accepted as an explicitly
finished ungraded/unresolved attempt and is **not stable**. It is not silently omitted.

Store the attempt/receipt, mark the slot submitted and increment revision atomically. Do not
change the play cursor or make a chess move. Later rewind/play/progress upserts cannot amend
this pass's frozen verdict. An explicit repeat is the way to submit a new result. Every member
must be submitted, even those outside `passMark.of`; only then finalize the pass in this same
transaction. With a pass mark use `passMarkCompletion` unchanged over frozen verdicts. Without
one return `{kind:'set_finished', setId}`—not a manufactured pass/fail/percentage. Neither form
has per-member scores or a total grade; ordinals and authored thresholds remain navigation.

Completed failed passes offer Repeat at the **same** scale. Completed successful or ungraded
passes offer Repeat and, if present, the immediately following authored cycle. Next is refused
on failure or after the last cycle. No skipping, synthesized scale or learner cycle-count knob.
Continue creates a new pass and first run atomically; it never resets the parent. Abandon offers
a new explicit Repeat from retained inputs but grants no completion, stability or next cycle.

### 4.8 One execution resolver; budget and scheduler isolation

Implement `resolvePackExecutionContext(run, principal)` at the existing service pack-resolution
boundary. Standalone runs resolve as today. Linked runs resolve their retained pack input plus
the stored authored cycle scale. The resolver supplies the pack used by start/commit/objective
rules, opponent/authored-line expansion, rewind/branch/group/replay, progression projection,
Inspector/Support/Review and cold reconstruction. Independent background consumers use the
same owned linkage and loader, not current-catalogue-by-ID. Missing links/dependencies refuse;
they never fall back to an unscaled pack. Duplicate/rematch/flip of a training run creates an
ordinary standalone run and explicitly says it does **not** submit or advance the original pass.

Pass an execution-only window view to timing/objective evaluation: each original window ID,
predicate, source pointer and metadata remains the authored value, while its effective
`luxuryMoveBudget` is `scaledLuxuryBudget(originalBudget, storedScale)` (floor, including zero).
Do not modify/digest a scaled `DrillPackDefinition`, relabel budget as seconds, or multiply
again on restart. The active UI states the authored cycle and effective move budget. All
timing receipts use the applied budget while claim/sidecar joins keep the original pack bytes.

Training attempts still appear in history/observations, but **never feed the return ladder**.
The linkage is present before `#project`: skip automatic schedule refresh for training-only
affected roots and exclude linked runs from ladder/difficult/due intake histories when a later
ordinary attempt refreshes the same root. Do not use `countable:false` to erase real practice,
forge a scheduled origin, clear an existing schedule or consume one. Startup, member play,
submit, repeat, cycle advance and account re-projection add/update/delete zero schedule rows.
Ordinary standalone practice and its pre-existing schedules retain their existing rules.

### 4.9 Deletion, export, import and UX

Deleting an active linked run marks that slot and its pass unavailable in the **same** deletion
transaction. It cannot become stable, silently skip, or start a replacement. Retain completed
frozen verdicts when a submitted run is deleted, with explicit `run_deleted` availability and
no broken Review link; historical completion remains what was actually submitted. Unavailable
passes offer an explicit new Repeat, never automatic repair. Account deletion hard-deletes both
tables, command operands and retained pack inputs; ordinary run sharing/deletion rules stand.
Delete child passes before parents (or null parent links within the deletion transaction).

Register both stores in the existing account inventory and export them as tagged **progress**
records in the existing bundle, not a new top-level format. Import validates ownership, complete
snapshot/member/command shapes, counts/ordinals, parent acyclicity, cycle scales, frozen-result
consistency and run references. Restore linked runs and passes in one transaction; remap all
pass/member/run references and receipt operands consistently through the existing ID mapping.
Do not transfer writer leases, trust a stored grading result without replay, or auto-adopt a
target account's pre-existing attempt. Verify each frozen result at its recorded event prefix,
not the imported run's later tip. If a deleted run leaves no replayable prefix, preserve its
record only as explicitly unverified historical data, mark the restored pass unavailable and
withhold Next; Repeat is still an explicit new execution. Do not restore secretly retained run
bytes after deletion or treat unverifiable imported history as a successful live pass.
Unsupported inputs roll back rather than drop context.
Upgrade adds empty tables only; no historical run/schema stamp or inferred set history.

Learn lists sets with authored threshold, member order, cycle and truthful source/review state.
Starting uses current learner help preferences and the existing preset intersection; this
amendment chooses no new preset/ramp mapping. The run shows compact set/cycle context and a
Finish member action, not another evidence panel. Submitted-member view links Review/retry,
displays its objective verdict, and offers **Continue** for the next member without auto-start.
The final view offers the allowed Repeat/Next actions and ordinary Library/Review returns.
Reload/home expose Resume unfinished set. Loading/error/empty/source-unavailable/deleted-run
states have named retry/resume exits; pending commands are single-flight, error preserves the
same command, and route departure retires old responses and focus changes. Desktop, keyboard
and phone journeys keep the board geometry and assistance ceilings unchanged.

### 4.10 Amendment acceptance (production boundaries, not model promotion)

Code sites owned by this amendment's implementation are the training routes in `rest.ts` and
`application.ts`; `RunService` creation/pack-context/progress seams; a small training-pass store
composed by `storage.ts`; automatic-ladder history and run/account deletion in that store;
the existing account inventory/importer; and Learn/client navigation plus run-context UI.
It does not own the D3317 clamp projection, provider gateway/source migrations or new collectors.
Coordinate the existing storage/service/account seams with their active RFC owners before
implementation; no broad replacement of those subsystems is authorized.

Independent review must verify the loader seam, all execution call sites, transactional run
creation/deletion and the automatic-scheduler exclusions. A disposable model under D3535 can
test identities/transactions and freeze rules, but cannot satisfy any production criterion.
The implementing change must prove all of the following through real application/storage:

1. Two passes share a pack but not attempts; a foreign run/pass/learner cannot submit or resume.
2. Real stable/unstable/open branch attempts freeze exactly once; later progress upserts/rewinds
   do not change the result; subset pass marks wait for **all** members.
3. Lost Start/member/submit/Continue responses replay exact receipts; overlapping different
   commands, changed operands, stale revisions and raced Repeat/Next produce one mutation.
4. Fault injection between run/pass/member writes rolls everything back; server restart resumes
   exact identity, order and retained content after catalogue edit/removal.
5. A 4-budget member executes at 2 under scale .5; odd and zero budgets floor correctly; start,
   real commits, rewind, branch/group/replay, objective/attempt projection, Review and cold reload
   all use that same budget, without changing installed/member digests or claim pointers.
6. Pre-existing schedules remain byte-identical throughout a cycle; a later ordinary attempt
   excludes training attempts from ladder history but still schedules normally. No hidden
   schedule write from startup, projection, import or worker rebuild passes this criterion.
7. Active/completed run deletion, complete account export/import/delete, corrupt references,
   foreign parents, changed scales and cyclic parent input follow §4.9 atomically.
8. Built desktop and touch-phone Learn → first member → retry/branch → submit → Continue →
   final result → Repeat/Next → reload journeys pass, including failed threshold/direct pack
   access, pending departure, response loss, dependency failure and abandoned/deleted runs.
9. Authored first pass-mark and tempo examples satisfy D3/D4 through these actual journeys.
   Neither a schema fixture nor the disposable model is official content or a discharge.

## §5. What this RFC refuses

| Refused | Ground |
|---|---|
| **A per-member score or point total** | The set counts objective verdicts. A score is a number about the learner at a position — refused at `rfc/skills.md:434-435` and §9.2 of `rfc/return-scheduling.md` |
| **A back-reference field on member packs** | §1.2 — [[D523]] and `pack-population-provenance`'s don't-copy refusal |
| **Extending `digestDrillPack` to cover sets** | Would churn all 92 pack digests and re-stamp 68 ledgers for a grain that no pack field references |
| **Ceiling rung 6 in a ramp** | ADR-0005 — the renderer words rungs 0–5 and grants nothing of its own |
| **A pack granting assistance** | The ∩ algebra; every term only narrows (§3.1) |
| **Locking a learner out of a pack on a failed set** | `onFail` re-offers; it does not gate (§2) |
| **A learner-facing cycle-count knob** | §4.2 — the Seven Circles failure mode |
| **Extrapolated cycle budgets** | §4.2 — an unauthored tempo is an invented one |
| **Making a campaign node the set** | `rfc/campaign-core.md:125-127` forbids re-entry after seal (§1.1) |

## §6. Law 8

A training method is pedagogy — a claim about how a person improves, not about a
position — so it is not forbidden by default. The line is crossed **only where the
method needs a move-level judgement to advance its own state**
(`rfc/return-scheduling.md` §9, the full argument; not restated here).

Each mechanic in this document, against that line:

- **Pass mark** — counts authored objective verdicts. No move-level judgement.
- **Assistance ramp** — narrows which *sources* may speak. It makes no claim; it
  removes claimants.
- **Tempo cycle** — scales an authored budget by an authored factor.

All three advance on state the runtime already computes from authored objectives.
**None requires a grade, and criterion 10 is the fixture that says so** rather than
leaving it as prose.

## §7. Deviations from design

**None.** §1's grain is additive, §3 consumes the ∩ algebra unchanged, and §4
consumes the shipped tempo vocabulary unchanged.

## Acceptance criteria

1. **A set validates and a pack does not gain a member field.** A well-formed set
   loads; a test asserts `DrillPackDefinition` has no `setId`/`setMembership` key.
   *Wrong implementation that passes a loose check:* one that accepts an unknown
   key on the pack via the `[key: string]: unknown` index signature — the assertion
   is over the validator's refusal, not the type.
2. **A set with a missing or duplicate member `ordinal` is refused**, with the
   member id in the message.
3. **A set naming an unregistered `packId` is refused at publication**, not at
   read time.
4. **`digestDrillPack` is unchanged.** A test asserts the digest of an unmodified
   member pack is byte-identical before and after its set exists, and that the
   §10-style pack digest census does not move. *Wrong implementation that passes
   criterion 1:* one that folds set membership into the pack digest — this is the
   criterion that catches it.
5. **The pass mark counts verdicts and nothing else.** A set of 10 with
   `require: 7`: a fixture with 7 `stable` passes, one with 6 `stable` and 4
   `unstable` fails, and a fixture where a member is `open` asserts it counts as
   neither.
6. **A failed set re-offers and does not gate.** After a fail, every member pack
   still opens directly.
7. **The ramp only narrows.** A pack declaring `ceilingRung: 5` with a learner
   preset at rung 1 yields **rung 1**. *Wrong implementation that passes a naive
   test:* one that takes the max, or that treats the pack's ceiling as a request —
   the fixture asserts the learner's tighter value wins.
8. **The ramp tightens by attempt number.** `attempt_no` 1 permits the authored
   rung; the attempt after `throughAttempt` permits rung 0. A ramp with
   `ceilingRung: 6` is **refused at validation**.
9. **A tempo cycle writes no schedule.** Completing a cycle asserts zero rows
   added to `schedules`.
10. **Tempo scales an authored budget.** A member with `luxuryMoveBudget: 4` under
    `budgetScale: 0.5` enforces **2**; a set declaring `tempo` whose members
    declare no `timingWindows` is **refused at validation**, naming the members.
11. **No grade is emitted.** The payloads for a set completion, a ramp transition
    and a cycle completion are each asserted to carry no move-level evaluation
    field and no per-member number. *Wrong implementation that passes a prose
    check:* one shipping the count as a field the client happens not to render —
    the assertion is over the payload.
12. **The register joins.** `register-check` is green with this RFC active, and its
    `tabiya-claims` block joins `rfc/README.md` character-for-character. A test
    asserts lane **0.32** is claimed exactly once across the register.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | The set artefact, `passMark`, `tempo`, and `assistanceCeilingRamp` | codex | this RFC's implementing commit | |
| D2 | The ADR-0006 fork — mode versus preset ceiling (open question 1) | OWNER | `planning/platform-alignment/decision-queue.md` | |
| D3 | Authored content: the first pass-mark set and the first tempo set. **The format is not the feature** — `titled-player-training.md:11-19` is that this tier ships machinery with no consumers | claude | `planning/content-wave-work-order.md` | |
| D4 | The first authored user of the timing **verdict** arm (0 packs at HEAD) | claude | `planning/content-wave-work-order.md` | |
| D5 | Set membership as a declared capability under `rfc/pack-capability-contract.md` | claude | that RFC's capability census | |
| D6 | The scheduler half — ladder repair, step-down, difficult roots, `variant` | claude | `rfc/return-scheduling.md` | |
| D7 | If `rfc/skills.md` open question 9 is ruled toward schema enforcement, that RFC takes lane **0.33** | claude | that RFC's claims block | |

## Open questions

1. **⚠ OWNER — the ADR-0006 fork: is a guided pass a distinct mode, or a preset
   ceiling?** §3.1 specifies the mechanism, which the ∩ algebra fixes either way;
   what is unruled is whether it surfaces as a named mode the learner selects or as
   a preset the ramp tightens. **Not acceptance-blocking** — §3 ships as a ceiling,
   which is the only form the algebra admits, and a mode would wrap it rather than
   replace it.
2. **Does a set need its own review status, or does it inherit its members'?**
   §1.2 reuses `provenance` unchanged, so a set can be `published` while a member is
   `draft`. Specified as inherit-the-weakest; a reviewer may prefer an independent
   status.
3. **May a pack belong to more than one set?** Nothing in §1 forbids it and the
   ordered-member design supports it. Left unconstrained, so a member's ordinal is
   per-set rather than global — worth an explicit reviewer decision, because
   forbidding it later is a breaking change and permitting it later is not.

## Ledger rows

Proposed — id assigned at landing; head was **D1310** at drafting.

- 🐞 **There is no set.** The pack format, the database and the content tree all
  lack an ordered collection of packs — verified three ways at HEAD. `variantOf` is
  pairwise, `concepts` is an unordered tag with no denominator, and
  `rfc/campaign-core.md:125-127` forbids node re-entry so a campaign cannot carry a
  cycle. **Three separately-requested training forms — Yusupov's scored chapter,
  the tempo cycle, and any "repeat the chapter" rule — were each blocked on this
  one missing grain**, which is why they read as three asks and are one.
- 🐞 **The tempo verdict is a third shipped-with-zero-consumers mechanism.**
  `TempoVerdict` and `gradeOutpaced` ship; 4 packs use the `spendAtLeast` arm and
  **0** use the verdict arm. Sharpens [[D863]]'s wave with a named target.
- 💡 **The guided first pass has exactly one expressible form.** Under the ∩
  algebra (`design/05-in-run-experience.md:230-232`) every term only narrows, so a
  pack **cannot grant** assistance and a guided pass must be a *tightening ceiling*
  over `attempts.attempt_no`, not a grant. This resolves the mechanism half of the
  ADR-0006 fork without touching the owner's half, and it is the property that stops
  a pack forcing help onto a learner who declined it.

## Changelog

- **2026-10-10** — codex authored the remaining original execution contract under [[D3535]]:
  §4.4–§4.10 specifies owned passes/member slots, retained normal loader inputs, frozen exact
  attempts, idempotent transactional commands, all-path budget resolution, scheduler isolation,
  account lifecycle and complete learner journeys. Claims only the next migration position;
  no pack/run schema lane, new evidence producer or numeric grade. **Draft awaiting independent
  review**, not accepted or implemented; D3318/D1/D3 and the separate D3317 ruling remain open.

- **2026-10-07** — D3318 catalogue stage: installed sibling documents, ordinal-ordered catalogue/detail
  reads through the production application, weakest-member publication and release-bundle admission.
  `make training-set-catalogue-check` passes 19 cases; clean types and release-policy checks pass.
  Full local verification passes 3,446 software, seven performance and 227 content cases;
  all browser tiers pass, including packaged-default, 150 exact inputs and 112 composition cells.
  The final bundle licence regression D3536 passes all 67 release-policy checks.
  This does not discharge D1 or D3: no client sequence, repeat-set,
  schedule isolation or live scaled-tempo journey is claimed. D3535 records the absent durable
  set/cycle occurrence and scaled-window reconstruction contract; it must be specified before those
  mutation paths are implemented. The source-bound author proposal is
  `planning/training-methods/set-execution-amendment-proposal.md`, not an accepted extension.
  No pack digest, run schema or migration is changed here.

- **2026-09-30** — integrated the format/mechanics checkpoint on main. Live ramp-to-assistance
  enforcement is recorded as [[D3317]], and the full training-set loader/API/client progression,
  repeat-set and live tempo journey as [[D3318]]. Criteria exercised only by pure helpers do not
  discharge a production consumer; this RFC remains implementing, not archived.

- **2026-08-23** — drafted from `planning/training-methods/rfc-derivation.md` on
  [[D1310]], alongside `rfc/return-scheduling.md`. The split is failure isolation:
  the scheduler defect must not wait behind an unruled pack field. Restructured
  during drafting — the derivation carried pass marks, the guided ramp and tempo
  cycles as three items; measurement found all three blocked on the same missing set
  grain, so §1 pays for it once and the rest became cheap.
- **2026-09-24** — **lane 0.32 landed** behind 0.30 and 0.31. Shipped: optional
  `assistanceCeilingRamp` (`{throughAttempt, ceilingRung}` with `ceilingRung` a closed 0–5 enum, so
  rung 6 is a schema refusal; the single reader refuses an unordered or widening ramp);
  `$defs/trainingSet` inside the pack schema (the register row's own spelling — a sibling artefact
  with its own `formatVersion` 0.1, never a pack field, so `digestDrillPack` is untouched);
  `validateTrainingSet` (ordinal gaps/duplicates named by member, pass-mark scope, cycle ordinals,
  tempo members without timing windows named, unregistered packs refused at publication); and
  `packages/runtime/src/training-forms.ts` (`rampCeilingRung`, `narrowedRung`, `passMarkCompletion`,
  `scaledLuxuryBudget`, `cycleOrder`). **Corrected inline:** §2 says a member passes when its attempt
  resolves `stable` "under `ObjectiveGrading`"; the shipped vocabulary is the attempt verdict
  (`stable | unstable | open`, `apps/server/src/progress.ts`), which the pass mark now counts; and the
  completion payload carries `passed` and `reoffer` only — criterion 11 forbids the count itself, so
  the count is not a field at all. **Not executable here, and why:** the ramp's rung numbers
  (design/05 §3's 0–5 ladder, cited by number) have no shipped projection onto the nine-field
  `ConfigClamp` the ∩ algebra actually narrows (`packages/runtime/src/presets.ts`); choosing that
  projection is the open ADR-0006 half (open question 1), so the ramp narrows a rung number and is not
  yet applied to a live run. No set is loaded, listed or served (D3's authored content and a set
  surface are both absent), so criterion 9 is asserted on the pure sequencer. D5 is partly
  discharged: the ramp's rungs are capability members; set membership is not a pack capability
  because no pack names a set.
