# RFC: Vocabulary wiring — what a construct must earn before the format admits it

- **Status:** draft
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-15
- **Design refs:** `design/04-content-architecture.md` §5 (the trajectory launch set) and §0a (the
  content-transfer audit); `design/03-product-breadth.md` B4 (the structural/temporal evidence
  layer). **Ledger rows this RFC owns**, cited by title throughout — line numbers drift, titles are
  stable: *Two grammars, one job, no selection rule* (**D89**); *`variantOf` has never appeared in
  `content/` in the entire git history* (**D90**); *`offlineQuery` manufactures the provenance it
  records* (**D64**). Rows this RFC **verifies and does not re-open**: *A trajectory pack can never
  be `ledger_verified`* (**D33**) and *Two committed drafts ship a `follow_theory` leg that can
  never fire* (**D38**), both marked ✅ closed by `validator-integrity`. Rows it **cites as
  corroboration but does not claim**: *An outcome leg with no `successConditions` compiles to zero
  grading rules* (**D28**), *Nine of twenty-five shape entries are referenced by no pack* (**D44**),
  *`retryVariants` has no runtime effect* (**D86**), and the *Vocabulary verdict: content CAN scale*
  row's tempo measurement.
- **Exploration gate:** `planning/work-register.md:54-58`, cluster **C — Content-vocabulary
  wiring**, under the 2026-08-15 owner ruling recorded at `planning/work-register.md:30` (*"just
  make nice waves… as long as we get them all done"*). This RFC is cluster C entire, minus one
  item excluded on the spine test in §2c. Evidence base:
  `design/research/authoring-vocabulary-completeness.md`.
- **Depends on:** `rfc/fixture-realism.md` (**implementing, unlanded**) for the **F2** captured-
  fixture provenance rule, which §6 instantiates rather than restates. `fixture-realism` names
  D64 as an explicit follow-on and hands it over — see §6a. No other unlanded dependency.
- **Parent / amends:** amends `rfc/archive/predicate-wave-3.md` (pack **0.18**, which shipped
  `plan_consequence`) and `rfc/archive/transition-primitives.md` (pack **0.22**, which shipped
  `transition_feature`); amends `rfc/archive/authoring-frictions.md` §4 (pack **0.16**, which
  shipped `variantOf`). Does not amend `rfc/archive/validator-integrity.md` — §5 verifies it.
- **Supersedes / superseded by:** —
- **Planning:** `planning/vocabulary-wiring/` (once implementing)

> **REGISTER CLAIM — stated loudly, per the register's claim protocol.**
> This RFC claims **pack schema 0.24** and **nothing else**. No run-schema change (stays
> **0.15**), **no migration** (20 landed; `teacher-surface` holds **21**, `engine-leverage` holds
> **22**), no new token scope, no new capability field. **0.19 is frozen shut** and is not touched.
> The pack bump is claimed **solely for §4's `plan_signature` expression leaf**; §6 (D64) and §7
> (D90) need no schema version at all.
>
> **0.23 was contested and this draft yielded it.** `rfc/engine-leverage.md:84` claims **0.23**
> (`$defs/guard.conditions[]`, `$defs/engineCondition`, a fourth `deviationCost` arm) and states at
> `:88`: *"If you are drafting in parallel: do not claim pack 0.23, run 0.16, or migration 22."*
> `engine-leverage` is a **wave-1** draft and this is **wave 2**
> (`planning/work-register.md:36-38`), so it holds the claim and **this RFC takes 0.24 and lands
> behind it.** §4 is purely additive — one new `oneOf` arm, one new lint code — and rebases without
> redesign; it touches none of `engine-leverage`'s `$defs`. The other two parallel drafts are clear:
> `rfc/feedback-delivery.md:549` claims no pack version and no migration, and
> `rfc/live-surface-honesty.md:497` stays at 0.22 and explicitly declines 0.23.
> `rfc/README.md` is **not edited by this draft**; the register row is the reviewer's to add.

*Every code site below was verified against the working tree at **`8445562`** on 2026-08-15. The
tree moved roughly thirteen times that day and was still dirty when this draft was started —
`packages/runtime/src/line.ts`, `packages/schema/src/drill-pack/lint.ts` and seven other files
were modified-uncommitted at `0c6e139` and landed before it was finished, so every line number an
earlier reading produced was stale. **Locate by symbol name first — every line number in this
document is advisory.** Every count in §3, §4, §6 and §7 was re-derived first-hand at `8445562`
with the commands quoted inline; where a re-derivation contradicts a committed document, §3 and §6
say so and show the arithmetic.*

---

## Summary

Five ledger rows in work-register cluster C look unrelated — a duplicate grammar, an unused field,
a grounding exclusion, a forged provenance record, a dead theory leg. They are one defect family,
and it is **not** the declared-vs-executable law nor the engine-request contract. Those two laws
each check a **single item against a single executor**: a name in a vocabulary against the runtime
that executes it, a value in a request against the instrument that answers it. Every row here is
about a **relation** between things that are each individually legal — two constructs that express
one intent, a construct with no consumer, a leg kind and a boundary field that compose to nothing,
a record and the instrument it names. A per-item check cannot see any of them, which is exactly
why all five shipped green.

This RFC names that third law (§2), fixes the two rows that are genuinely open and unowned (§4
D89, §7 D90), discharges the one that a landed RFC handed over (§6 D64), and **verifies rather
than re-opens** the two the ledger already marks closed (§5 D33, D38) — reporting three stale row
premises and two residual gaps found in the process.

**It also reports a measurement that overturns a cross-reviewed number in an active RFC.** §6
establishes, first-hand and by three independent tells, that **135 of the 341 committed
`sourceId: "syzygy"` manifest entries in `content/` were manufactured by `offlineQuery`** and are
in the repository now. `rfc/fixture-realism.md` records **zero** and rested its deferral of D64 on
that number. The re-derivation that produced "zero" applied `.slice(7, 15)` to a bare hex digest,
but the repo's own `sha256()` returns a `"sha256:"`-prefixed string, so the slice lands on hex
characters 0–7, not 7–14. Under law 6 this is escalated, not rationalised: six committed packs
carry `ledger_verified` on provenance that attests to a local fixture.

## Motivation

### The five rows, and why they are one row

`design/research/authoring-vocabulary-completeness.md` answered the owner's lock-the-primitives-
first question with *the format is not the bottleneck* — `pack-check` passes 37/37 with zero
warnings. That verdict is correct and this RFC does not disturb it. But the audit's own second
finding is the one that matters here: the two things costliest to re-author *"are not missing from
the vocabulary — they are shipped, executable, and never once used."* A green validator is
compatible with a vocabulary an author cannot navigate.

Each row is a different way for that to happen:

| Row | The construct | What is individually legal | What the pair does |
|---|---|---|---|
| **D89** | `plan_consequence` vs `transition_feature` | both compile, both execute | nothing tells an author which to reach for; one silent re-author already happened |
| **D90** | `variantOf` | schema, three machine proofs, named refusals | zero content uses in all of git history; nothing reads it |
| **D38** | `follow_theory` leg + absent `authoredBoundary` | each legal alone | the leg can never report `on_line` |
| **D33** | `run_trajectory` + `ledger_verified` | each reachable alone | mutually exclusive by construction |
| **D64** | `offlineQuery` + an `origin.kind: "http"` record | the record shape is valid | it attests to a fixture and claims an HTTP 200 nobody requested |

In every case the **format permits something the runtime cannot honour, or permits two ways to say
one thing** — and in every case a validator that checks each construct on its own says yes.

### Scope boundary — what is explicitly out

- **`/deviations/{i}/cost` is not re-specified here.** It ships author-declared and **unbacked**
  per the 2026-08-15 coordinator ruling (ledger row *Bind `/deviations/{i}/cost` to engine
  evidence*), and `rfc/engine-leverage.md` — a **parallel wave-1 draft** — owns binding it to
  evidence. This RFC does not touch `cost`, does not render it, and does not describe how it
  should be grounded. **Named as a dependency and left alone.**
- **The claim-delivery cluster is not touched.** `rfc/feedback-delivery.md` (parallel wave-1
  draft) owns D77/D78/D79. §4 changes what an author *writes* to bind a plan signature; it
  changes nothing about how a claim reaches a learner.
- **D87 (engine-condition surface) and D88 belong to `engine-leverage`.** §4 deliberately does not
  add an engine-backed condition kind, even though the plan/transition seam is adjacent to it.
- **D86 (`retryVariants` has no runtime effect) belongs to cluster E.** §7 cites it as the prose
  stand-in authors used instead of `variantOf` and proposes nothing for it.
- **D28 belongs to no one yet.** §5c shows it is a second instance of this RFC's `honour`
  obligation and recommends it be routed here or to cluster E; it is not fixed by this draft.
- **Per-leg trajectory expressiveness is excluded on the spine test.** See §2c — this is the one
  brief item the law rejects, and the reasoning is given rather than asserted.

## Specification

### 1. What the two existing laws are, quoted

**The declared-vs-executable law** (`rfc/archive/defect-sweep.md:294-298`):

> An executable vocabulary may contain only values the shipped runtime executes. A declared
> vocabulary may contain values it does not, provided every such value carries a machine-checked
> refusal reason and the deployment publishes what it can actually select.

Three legs: **capability publication**, **named refusal**, **applied record**.

**The engine-request contract** (`rfc/archive/engine-request-contract.md:243-276`, ledger row *The
engine request contract (promote to design tier)*): five obligations — **state**, **clear**,
**bind**, **bound**, **record** — with the one-line form *state a request does not state is state
the previous request chose*. Its §4 states the seam with its predecessor precisely: *declared-vs-
executable governs what a document may **say**; the request contract governs what a call must
**do**.*

**A correction owed to both.** Both RFCs describe the declared-vs-executable law as *"promoted
into `docs/drill-pack-format.md`"* (`rfc/archive/engine-request-contract.md:245-246`,
`rfc/archive/tempo-vocabulary.md:952`). **It is not there.** `grep -i "executable vocabular"
docs/` returns nothing at `8445562`; the word "executable" occurs five times in
`docs/drill-pack-format.md` and every occurrence is an adjective applied to one named value
(`:25`, `:40`, `:73`, `:119`, `:123`). The law's only living statement is the ledger row
*Declared-vs-executable vocabulary law (promote from defect-sweep)*, still 💡, which says it
*"lives only in an archived RFC"* — and `planning/traceability-reverse.md:93` calls it *"Normative
in `docs/drill-pack-format.md`"*, contradicting the row it sits beside. **This RFC does not fix
that** (`docs/` and `design/` are out of bounds for this draft); it reports it so the third law is
not promoted on top of a predecessor that was never actually promoted. See Open question 6.

### 2. The third law

#### 2a. Why it is a third law and not an instance

Apply the engine-request contract's own test — *does the older law say anything at all about this
row?*

- **D89.** Both `plan_consequence` and `transition_feature` are executed by the shipped runtime
  (`apps/server/src/pack-orchestrator.ts:257-261` and `:262-264`). Nothing is declared-and-
  unexecuted. There is no value to refuse, so **named refusal** has no subject; there is no
  unselectable option, so **capability publication** has no subject; both record identically, so
  **applied record** is satisfied. The older law is **fully satisfied and the defect is
  untouched.** This is the clean test case, and it is the same role D59 played for the request
  contract.
- **D38.** `follow_theory` is executable; an absent optional `authoredBoundary` is legal. Each
  item passes; the *pair* is dead. Untouched.
- **D64.** `offlineQuery` makes no call to any instrument, so the request contract has no subject
  at all — there is no session to inherit state, nothing to clear, no exchange to bind. It is not
  a request; it is a **record about a request that never happened**.
- **D90 is the overlap row**, and the honest statement is that it is *partial*. `variantOf` does
  carry machine-checked refusals (`VARIANT_SELF_REFERENCE`, `VARIANT_PACK_UNKNOWN`,
  `VARIANT_RELATION_UNPROVEN`, `apps/server/src/pack-validation.ts:670-696`), so the older law's
  **named refusal** leg is satisfied; its other two legs have no subject, because `variantOf` is
  not a vocabulary of selectable values. The older law neither condemns nor excuses it.
- **D33 is the positive case** — see §5a. It was resolved by widening one side and publishing a
  **true** named refusal for the other. It is what compliance looks like.

Following the precedent set at `rfc/archive/engine-request-contract.md:254-268`, the seam is
stated as a measurement rather than a slogan: the overlap is **one leg of three** (*named
refusal*) at **one ledger row** (D90), and the older law is **silent on the other four**.

The three laws divide by boundary, and that is the cleanest way to hold them:

| Law | Boundary | Governs |
|---|---|---|
| Declared-vs-executable | document → runtime | what a document may **say** |
| Engine-request contract | call → instrument | what a call must **do** |
| **Vocabulary wiring** | construct → **author** | what a construct must **earn** |

#### 2b. The law, and its four obligations

> **A format may admit a construct only if an author can tell when to reach for it, and the
> runtime honours it in every combination the format permits.**

One-line form, for the reviewer who wants it in a sentence: ***a construct nobody must choose,
nothing consumes, or nothing honours is not a feature — it is a bill the next author pays.***

Four obligations, each independently violable, each mapping to exactly one row:

1. **choose** — where two or more constructs can express one authoring intent, a published rule
   names the default and states the case that makes the other necessary. Redundancy without a
   selection rule is a re-author waiting to happen. → **D89** (§4).
2. **reach** — a shipped construct has a consumer and at least one authored use, or a named,
   ledgered reason it has neither. A construct that changes nothing an author or learner can
   observe will not be reached for. → **D90** (§7).
3. **honour** — a combination of individually-legal constructs that can produce no effect is
   refused by name, not accepted silently. → **D38** (§5b, closed), **D28** (§5c, open).
4. **attest** — a record names the instrument that produced it. A record derived from a fixture
   may not claim an origin no process contacted, and a record's provenance may not be synthesised
   at read time. → **D64** (§6).

The mapping is one-to-one, which is the property that argues the obligations are real and not a
decorative decomposition: D89 violates only *choose*; D90 only *reach*; D38 and D28 only *honour*;
D64 only *attest*. D33 violates none of them — it satisfies *honour* by construction (§5a).

**Corroboration beyond cluster C**, so the law does not rest on its own five rows. *reach* has at
least three further measured instances already in the ledger: the tempo layer (`04` §2d requires a
timing window per opening root; **0 of 20** opening packs use one, all 7 verdicts have zero users,
while `packages/runtime/src/tempo.ts` consumes every field), **D44** (nine of twenty-five shape
entries referenced by no pack), and **D86** (`retryVariants`, five kinds, no runtime effect).
*honour* has **D28**. This RFC claims none of those four; they are evidence that the law describes
a standing failure mode rather than a coincidence.

#### 2c. Per-leg trajectory expressiveness — excluded, and why

The brief asks whether per-leg `shapes` and `opponentPolicy` belong here, conditional on *"if D33
touches the leg schema anyway."* **D33 does not touch the leg schema.** §5a establishes that D33
was closed entirely in `apps/server/src/pack-validation.ts` and
`apps/server/src/sourcing/ledger-validation.ts`; `$defs/trajectoryLeg`
(`schemas/drill_pack.schema.json:230-240`) was not modified and needs no modification. The stated
condition fails.

It fails the spine test independently, and that is the stronger reason. The gap is real and
measured — `$defs/trajectoryLeg` accepts exactly four properties (`id`, `entryCheckpointId`,
`branchLengthTarget`, `objective`) with `additionalProperties: false` at
`schemas/drill_pack.schema.json:239`, mirrored at
`packages/schema/src/drill-pack/types.ts:234-239`; `opponentPolicy` occurs at exactly three lines
in the pack schema, all root-scoped (`:15` required, `:64` property, `:877` definition); and the
run's opponent policy is frozen once at `packages/runtime/src/runtime.ts:211`, with `legIndexAt`
(`packages/runtime/src/trajectory.ts`) consulted only to swap **grading rules**
(`apps/server/src/pack-orchestrator.ts:556-575`) and never by any selection path. A three-phase
trajectory gets one resistance model for opening theory, middlegame plan and endgame technique
alike.

But that is a construct the format **cannot express**, not one it permits and fails to honour. It
is the *inverse* of this RFC's spine, and putting it here would make the law mean "anything wrong
with the authoring vocabulary," which is not a law. **Recommendation:** it belongs with
`deviation.planClassId` — ranked #1 where this is #2 in
`design/research/authoring-vocabulary-completeness.md:172-193` — in an additive authoring-
expressiveness RFC. Both are additive and invalidate no existing pack (that dossier's §5 ranks the
pair **#7 of 7** by re-author blast radius, at `:300-312`), so the wave can be scheduled purely on
content need.

Two facts found while judging this, recorded so the future RFC inherits them rather than
rediscovering them. First, the audit's *"blocks §5's 6-pack launch set beyond the three authored"*
is **imprecise in the pack's favour and against the launch set**: only **two** of the six
`design/04-content-architecture.md:271-288` entries are covered
(`trajectory-qgd-exchange-minority`, `trajectory-caro-advance-chain-bishops`), the third authored
trajectory (`trajectory-mate-bishop-knight`) is an endgame-only B+N mate that is **not in the
launch set at all**, and the authored Caro pack ends in a good/bad-bishop ending where §5 specifies
4v3 rook endings. So the count is **2 of 6 covered, 4 unauthored**, not 3 and 3. Second, three of
the nine pack-unreferenced shapes in **D44** (`open-centre`, `queenless-middlegame`,
`doubled-c-pawns`) are precisely the named middlegames of three of the four unauthored entries —
D44 and the per-leg gap are the same blockage seen from two ends.

### 3. D89 — three ways to say one static fact

#### 3a. What is actually true, with the ledger's numbers corrected

`930b367` ("feat: add transition primitives") deleted the corpus's only `plan_consequence`
condition from `content/drafts/carlsbad-minority-attack.json` and replaced it with a
`transition_feature`. The before/after is the whole defect in one diff. Before, one line:

```json
{ "kind": "plan_consequence", "planClassId": "minority-attack", "to": "achieved" }
```

After, forty-four lines whose `position` sub-node at `at: "after"` **is** the structural signature
the deleted condition resolved to, wrapped in an `all` with one added `slider_lines_changed` leaf.
The author needed the delta leaf; they did not need to inline a copy of a registry signature, and
nothing told them not to.

**Two ledger numbers are wrong and are corrected here.** Re-derived first-hand at `8445562` over
every JSON document under `content/`:

```
planClasses total: 105   with shapePlan: 50   distinct shape/plan pairs: 41
bindings resolving to an object signature (graded):        45
bindings resolving to signature: null (declared_uncheckable): 5
catalogue plans total: 117   with signature null: 21
```

- *"41 of 105 plan classes carry a `shapePlan` binding"* → **50 of 105** carry one. **41** is the
  number of *distinct* `shape/plan` targets those 50 bindings point at; the row conflates a
  de-duplicated target count with a binding count. The same error appears in
  `design/BACKLOG.md` (the D89 row), `design/research/authoring-vocabulary-completeness.md` and
  `design/research/README.md`. **Correcting those documents is not this draft's to do** — they are
  design tier — so the correction is stated here and listed in Open question 5.
- *"and 0 are graded"* → **wrong under the codebase's own definition**, and the true statement is
  stronger. `apps/server/src/authored-feedback.ts:325` computes `gradability` as `"graded"`
  exactly when the resolved plan's `success.signature` is a non-null object; **45 of the 50
  bindings are `graded` by that definition** and are reported as such in the revealed
  `plan_class` payload (`:56`, `:336`). What is true is that **none of them ever grades
  anything**: the only success-condition kind that can consume a `shapePlan` signature is
  `plan_consequence`, and `grep -rl plan_consequence content/ | wc -l` returns **0**. The
  bindings are display metadata advertising a gradability the runtime never exercises — a worse
  finding than "0 are graded", because the payload says `graded` to a surface that believes it.

#### 3b. The redundancy is three-way, not two-way

The ledger frames D89 as two grammars. Reading all three compile arms in
`apps/server/src/pack-orchestrator.ts` shows it is three constructs over two subjects:

| Construct | Subject | Compiles to |
|---|---|---|
| `structural_feature` (`:243-245`) | one position | `{fenPredicate, structuralFeature: condition.feature}` |
| `plan_consequence` (`:257-261`) | one position | `{fenPredicate, structuralFeature: <signature resolved from the registry>}` — **byte-identical shape** |
| `transition_feature` (`:262-264`) | one **edge** | `{transitionFeature, transition}` |

`plan_consequence` has **no runtime evaluator at all** — `packages/runtime/` contains zero
references to it or to `shapePlan`. It is compile-time sugar: `planSignatureResolver`
(`:44-50`) walks `planClassId → planClasses[].shapePlan → shapes.get(shape).plans[plan].success
.signature` and emits exactly what `structural_feature` emits.

And `transition_feature` contains a **third** way to say the same static fact: its `position`
bridge node (`packages/schema/src/drill-pack/types.ts:402`,
`{kind: "position", at: "before" | "after", expression: StructuralExpression}`) delegates to the
same `matchesStructuralExpression`. So `position{at: "after", expression: S}` and
`structural_feature{feature: S}` assert the identical fact.

**The genuinely distinct axes, measured rather than asserted:**

- `transition_feature` alone can express **change** (`attacked_squares_changed`,
  `defended_squares_changed`, `slider_lines_changed`, `escape_squares_changed`,
  `defended_duties_changed`) and **move identity** (`move_irreversibility`), and can assert an
  antecedent via `at: "before"`. No predicate over one FEN can see a change.
- `plan_consequence` alone offers **registry indirection** (the expression is authored once in
  `content/shapes/` and shared) and **provenance** (it emits an extra `planClass#<id>` evidence
  ref at `apps/server/src/pack-orchestrator.ts:299-303`, binding the verdict to a named authored
  plan).
- `plan_consequence` alone fires at the **root position**: `transitionFeature` evaluation requires
  `node.parentId` and `node.moveUci` and returns `false` at the root
  (`packages/runtime/src/objective.ts:307-313`).

So the two grammars the ledger names are **not one thing** — edge semantics are real and
irreducible. But `plan_consequence` versus `structural_feature` **is** one thing, and the only
difference between them is *where the expression comes from*. That is not a condition kind. It is
a property of an expression.

#### 3c. The deliverable: a merge that dissolves the redundancy, plus the selection rule that remains

**The merge.** Factor the registry reference out of the condition kind and push it down into the
expression grammar as an eighth `oneOf` arm of `$defs/structuralExpression`
(`schemas/drill_pack.schema.json:515-526`; TS union at
`packages/schema/src/drill-pack/types.ts:371-379`):

```json
{ "type": "object", "required": ["kind", "planClassId"],
  "properties": { "kind": { "const": "plan_signature" },
                  "planClassId": { "$ref": "#/$defs/id" } },
  "additionalProperties": false }
```

TypeScript member: `| { readonly kind: "plan_signature"; readonly planClassId: string }`.

**Resolution is compile-time substitution, and the runtime does not change.** The runtime
evaluates `StructuralExpression` without access to the pack's `planClasses` or the shape registry,
so `plan_signature` must be expanded before it reaches `matchesStructuralExpression`.
`apps/server/src/pack-orchestrator.ts` already holds the resolver it needs. Normative behaviour:

1. Before emitting any predicate, the orchestrator walks every `StructuralExpression` it is about
   to compile — including those reached through `transition_feature`'s `position` node — and
   replaces each `{kind: "plan_signature", planClassId}` node with the resolved signature from
   `planSignatureResolver`.
2. If the resolver returns `undefined` or `null`, compilation fails with the existing
   `PLAN_CONSEQUENCE_UNRESOLVED` code, whose pointer is the `plan_signature` node.
3. Every expansion emits the `planClass#<id>` evidence ref, wherever in the tree it occurred —
   so provenance now attaches to transition-grammar conditions too, which it cannot today.
4. Expansion is **not** recursive into the substituted signature: a plan signature is a leaf, and
   a registry signature containing `plan_signature` is refused at load with a new
   `PLAN_SIGNATURE_NESTED` code.

With that arm, `plan_consequence{planClassId: P}` is **exactly**
`structural_feature{feature: {kind: "plan_signature", planClassId: P}}`, and `930b367`'s
replacement becomes expressible without inlining a copy:
`transition_feature{all: [slider_lines_changed…, position{at: "after", expression: {kind:
"plan_signature", planClassId: "minority-attack"}}]}`.

**`plan_consequence` is deprecated, not removed.** It ships a `pack-check` **warning** and stays
in the schema. It has **zero content users** (`grep -rl plan_consequence content/` → 0), so the
warning fires on nothing today; the deprecate-then-remove loop is the one
`design/research/authoring-vocabulary-completeness.md` credits for `piece_reach_count`'s 143
existence-encoding leaves going to 0, and removal belongs to a later wave. **The one capability it
uniquely holds must not be lost:** it fires at the root, and `transition_feature` cannot. Under
the merge, root firing is preserved because `structural_feature{plan_signature}` is a position
predicate, so the deprecation removes no expressive power. That is what makes it a merge rather
than a deletion.

**The selection rule — the deliverable, in one axis and one modifier.** To be written into
`docs/drill-pack-format.md` and `docs/structural-reading.md` by the implementing commit (this
draft may not edit `docs/`):

> **Axis — what is the subject of the claim?**
> *A position* → `structural_feature`. *An edge: a change between two positions, or a property of
> the move itself* → `transition_feature`. Ask whether the claim could be checked by looking at
> one diagram. If yes, it is a position; if it needs two, it is an edge.
>
> **Modifier — does the pack's shape registry already name this fact?**
> If the expression is a registered plan's success signature, reference it with a
> `plan_signature` leaf instead of inlining a copy — in either grammar. You get the registry's
> single definition and a `planClass#<id>` evidence ref binding the verdict to a named authored
> plan.
>
> **`plan_consequence` is deprecated.** Write `structural_feature` with a `plan_signature` leaf.
>
> **Never** restate a registered plan signature inline. That is the exact edit `930b367` made.

**The lint that would have caught `930b367`.** Add to `PackLintCode`
(`packages/schema/src/drill-pack/lint.ts:15-31`) a **warning**, `PLAN_SIGNATURE_INLINED`: when any
`StructuralExpression` in a pack — at any depth, in either grammar — is structurally equal (after
canonical key ordering) to the resolved `success.signature` of a plan the pack's own
`planClasses[].shapePlan` binds, warn with the pointer to the inlined node and name the
`planClassId` the author should reference. Warning, not error, because a pack may legitimately
assert a fact that coincides with a registry signature it never bound; the author is told, and
chooses.

This is the whole remedy for *choose*: one merge that removes the redundancy, one published rule
for the axis that genuinely remains, and one mechanical check that fires on the exact edit the
audit exists to prevent.

### 4. D89 — schema delta summary (pack 0.24)

| Change | Location | Kind |
|---|---|---|
| `plan_signature` arm on `$defs/structuralExpression` | `schemas/drill_pack.schema.json:515-526` | additive |
| `plan_signature` member on `StructuralExpression` | `packages/schema/src/drill-pack/types.ts:371-379` | additive |
| Compile-time expansion + evidence ref | `apps/server/src/pack-orchestrator.ts` (`planSignatureResolver`, both condition arms) | behaviour |
| `PLAN_SIGNATURE_NESTED` load refusal | `apps/server/src/pack-validation.ts` | additive refusal |
| `PLAN_SIGNATURE_INLINED` warning | `packages/schema/src/drill-pack/lint.ts` (`PackLintCode`) | additive warning |
| `plan_consequence` deprecation warning | `packages/schema/src/drill-pack/lint.ts` | additive warning |

**No committed content is invalidated** — the arm is additive, `plan_consequence` has zero users,
and no existing expression changes meaning. **No content digest moves** unless an author elects to
rewrite `carlsbad-minority-attack.json`, which §8 lists as optional.

### 5. D33 and D38 — verified, not re-opened

Both rows are marked ✅ closed by `validator-integrity`. Both closures are **real**. Three row
premises are now stale and two residual gaps were found; none of it re-opens either row.

#### 5a. D33 is genuinely closed, and it is this law's positive example

A `run_trajectory` pack **can** reach `ledger_verified` today. The path, traced end to end:
`OBJECTIVE_GRADING_UNSUPPORTED` now fires only when `scope === "leg"`
(`apps/server/src/pack-validation.ts:407-409`), so a trajectory **root** may carry grading; root
syzygy admission additionally requires the pack's **final leg** to be an outcome objective
(`TRAJECTORY_ASSESSMENT_NEEDS_OUTCOME_LEG`, `:490-491`); `verifyDraft` dispatches on
`assessedBy.kind` (`apps/server/src/sourcing/verify-draft.ts:296-302`); and
`assessmentGrounding` (`apps/server/src/sourcing/ledger-validation.ts:380-406`) returns
`ledger_verified`. It is pinned:
`apps/server/src/validator-integrity.test.ts:251-254` asserts
`registry.required("trajectory-mate-bishop-knight").assessmentGrounding === "ledger_verified"`.

**What can and cannot be grounded, precisely.** *Can:* the trajectory's **static root position
only** — `assessmentGrounding` matches on `values.fen === document.start.fen` and
`supports.includes("/start/fen")`. *Cannot:* any **leg entry position**, refused by name with a
**true reason** — `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED`, *"leg entry positions are not statically
bound to a Syzygy record"* (`apps/server/src/pack-validation.ts:923`), plus its later engine
sibling at `:924`.

**That refusal is the law satisfied, and it is worth naming as the model.** A leg entry position
genuinely depends on the played path; no static record can attest to it. The construct is refused
by name, the reason is true, and the pack's own authored note says so rather than implying
grounding it does not have. **`honour` does not require that every combination work — it requires
that a combination which cannot work be refused by name.** D33 went from a silent mutual exclusion
to a published one, which is exactly the transition the other four rows still need.

**Stale premises in the D33 row, reported for the ledger's owner (this draft may not edit
`design/`):**

1. The row's premise *"`verify-draft` requires top-level `assessedBy.kind: syzygy`
   (`VERIFY_ASSESSMENT_NOT_SYZYGY`)"* is **false twice over**. `engine` is also accepted
   (`verify-draft.ts:296-302`), and `VERIFY_ASSESSMENT_NOT_SYZYGY` (`:132`) can no longer gate: the
   dispatcher has already selected on `kind === "syzygy"` before `verifySyzygyDraft` re-reads the
   file, so the throw is now a TOCTOU guard. The live refusal for a non-groundable pack is
   `VERIFY_ASSESSMENT_NOT_GROUNDABLE` (`:301`). `rfc/archive/opening-evidence-path.md:214` records
   the code as "retired"; the throw site was left in place, so the register's 0.20 row and the
   code disagree.
2. `TRAJECTORY_GRADING_RESOLUTION_UNSUPPORTED`, which `validator-integrity` shipped, **no longer
   exists in code** — `opening-evidence-path` replaced it with `OBJECTIVE_GRADING_RESOLUTION_INERT`
   (`pack-validation.ts:410-412`). It survives only in archived RFC prose. Today's code does not
   match `validator-integrity`'s text, because a later RFC rewrote part of it.
3. **The B+N outcome sibling was never removed.** `content/drafts/mate-bishop-knight.json` and
   `content/drafts/trajectory-mate-bishop-knight.json` both ship, each with its own three
   sidecars and its own `ledger_verified` admission. The row's *"it is why B+N ships as a
   trajectory AND an outcome sibling"* has stopped being true: the trajectory now stands alone,
   and `rfc/archive/validator-integrity.md:638-639` says so. The sibling's continued existence is
   now an **editorial choice, and no ledger row tracks it.** Recommend a row; §Open questions 4.

#### 5b. D38 is closed as a class, not merely as two instances

The brief's key question — was the class closed or only the instances? — resolves to **the class**.
`validator-integrity` (`047de02`) widened the theory guard from root-only to leg-inclusive at
`apps/server/src/pack-validation.ts:972-975`:

```ts
const topLevelTheoryObjective = pack.objective.type === "follow_theory";
const theoryObjective = topLevelTheoryObjective || (pack.legs ?? []).some(
  (leg) => leg.objective.type === "follow_theory",
);
```

`git log -S 'pack.legs ?? []).some' -- apps/server/src/pack-validation.ts` returns exactly that one
commit. `THEORY_NEEDS_AUTHORED_BOUNDARY` predates the RFC but applied only to a **root**
`follow_theory` objective, which is precisely why two trajectory drafts slipped through. Three
companion rules ride with it — `BOUNDARY_NEEDS_PLY_HORIZON`, `BOUNDARY_GRANTS_NOTHING`,
`THEORY_NEEDS_BOUNDARY_CHECKPOINT` (`:986-996`) — all `severity: "error"`, and the `mode: line`
requirement was split off to `topLevelTheoryObjective` so a trajectory is not forced into line
mode. Both drafts now carry finite boundaries and a boundary checkpoint, and
`apps/server/src/validator-integrity.test.ts:209-236` deletes them and asserts each refusal fires.

The runtime was **not** changed and did not need to be: `insideAuthoredBoundary`
(`packages/runtime/src/line.ts`) still returns `false` for every non-root node when the boundary
is absent. D38 was fixed upstream of the runtime, in the validator — which is the right layer, and
is the `honour` obligation discharged exactly as §2b states it.

**Residual gap, narrower than D38 and covered by no ledger row.** The guard is **pack-level, not
leg-level**: it asks only *"does some leg use `follow_theory`, and does the pack have a boundary."*
It does not check that the boundary's grants fall inside the theory leg's own span, and
`BOUNDARY_HORIZON_EXCLUDES_EVERY_GRANT` (`pack-validation.ts:1007-1024`) fires only when **every**
declared node lies beyond the horizon. A pack whose boundary grants nodes belonging to a later leg
and none inside the theory leg still passes `pack-check` and still produces a theory leg that never
reports `on_line` — D38's exact failure, one scope down. **This RFC does not fix it** (it is a
validator change in `validator-integrity`'s territory, and neither wave scoped it); it names it and
recommends a ledger row. See Open question 3.

#### 5c. D28 is the same obligation, still open and unowned

*An outcome leg with no `successConditions` compiles to zero grading rules and passes `pack-check`
silently* — a leg declaring `win` that grades nothing, which both authored trajectory packs already
work around by carrying a `material_balance` condition purely to dodge it. That is **honour**,
identically: two individually-legal choices composing to no effect, blessed by the validator. It is
ranked #5 of the five grading-and-explaining gaps in
`design/research/authoring-vocabulary-completeness.md:172-193`, is routed to no cluster in
`planning/work-register.md`, and *"scales with every trajectory authored."* **Recommendation:**
route it here as a §5b-style validator refusal (`OBJECTIVE_GRADES_NOTHING`, the row's own proposed
name) or to cluster E. Not claimed by this draft; flagged so it is not lost between waves.

### 6. D64 — `attest`, and a measurement that overturns a cross-reviewed number

#### 6a. Ownership: handed over, not contested

`rfc/fixture-realism.md` names D64 in its design refs, uses it as §3's counterexample, and then
**explicitly defers it** in its scope boundary:

> **Follow-on** (named so they are not lost, deliberately not attempted here):
> - F2 provenance for `apps/server/src/sourcing/fixtures/verify-draft.json`,
>   `tablebase-response.json` and `explorer-response.json`, and retiring the provenance
>   `offlineQuery` synthesizes at read time (**D64**). … **The follow-on should carry that guard**

This RFC is that follow-on. It **instantiates `fixture-realism`'s F2 rule** for the syzygy fixture
family rather than restating it, and carries the guard F2 names. `fixture-realism` is
`implementing` and unlanded; §8 lands behind it.

#### 6b. What `offlineQuery` does

`apps/server/src/sourcing/verify-draft.ts:103-111`, the whole function, with the two lines that
matter:

```ts
const bytes = new TextEncoder().encode(JSON.stringify(payload));
const offset = Number.parseInt(sha256(fen).slice(7, 15), 16) % 86_400_000;
const retrievedAt = new Date(Date.UTC(2026, 7, 14) + offset).toISOString();
return { payload, source: { sourceId: "syzygy", retrievedAt, origin: { kind: "http",
  url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`,
  status: 200, sha256: sha256(bytes), bytes: bytes.byteLength, etag: null }, … } };
```

The ledger row says it "manufactures the provenance it records." **It is stronger than that.**
Every field of an `origin.kind: "http"` record is fabricated from local data: `retrievedAt` is a
deterministic pseudo-random timestamp spread over the 24 hours of 2026-08-14 and keyed by a hash of
the FEN; `sha256` digests a re-serialisation of the fixture entry just read from disk; `bytes` is
that re-serialisation's length; `url` is reconstructed; and **`status: 200` asserts an HTTP
response from a host no process contacted.** The emitted record is byte-shape-identical to
`liveTablebaseQuery`'s (`apps/server/src/sourcing/syzygy.ts:103-119`), which uses a real clock, the
real `response.status`, a digest of the **actual response body**, and the real `etag`. That
indistinguishability is the defect.

**The root cause is a fixture-format asymmetry, not a careless function.** Both fixtures sit in the
same directory. `fixtures/verify-draft-engine.json` maps each FEN to a full `source` record —
`licence`, `origin` (`kind: "engine"`, engineId/engineName/engineVersion, `budget.depth: 22`,
`profile {threads: 1, hashMb: 16, multiPv: 1}`), a real captured `retrievedAt`, `sourceId` — so
`offlineEngineEvaluator` (`verify-draft.ts:201-206`) is a **pure lookup that invents nothing**.
`fixtures/verify-draft.json` is a bare FEN→payload map with no provenance slot at all, so
`offlineQuery` has nothing to replay and must synthesise. **Give the syzygy fixture the engine
fixture's shape and the defect disappears by construction.**

#### 6c. The measurement — 135 of 341, and why "zero" was recorded

`rfc/fixture-realism.md` states, `[V, cross-review]`, that all **341** committed `sourceId:
"syzygy"` manifest entries were re-derived against the synthesis formula and **zero match**,
concluding *"No manufactured provenance has reached a committed artifact."* **That is wrong.**
Re-derived first-hand at `8445562`:

```
total syzygy entries: 341
BOTH timestamp+digest match (manufactured): 135
timestamp-only: 0    digest-only: 0
```

| file | manufactured entries |
|---|---|
| `content/drafts/lucena-bridge-convert.sources.json` | 22 |
| `content/drafts/opposite-bishops-fortress-hold.sources.json` | 14 |
| `content/drafts/pawn-breakthrough-convert.sources.json` | 18 |
| `content/drafts/pawn-opposition-convert.sources.json` | 32 |
| `content/drafts/philidor-third-rank-hold.sources.json` | 23 |
| `content/drafts/queen-vs-pawn-seventh-convert.sources.json` | 26 |

**The cause of the discrepancy is a seven-character offset.** `sha256`
(`apps/server/src/sourcing/canonical.ts:7-9`) returns `` `sha256:${hex}` `` — a **prefixed**
string. `"sha256:"` is seven characters, so `sha256(fen).slice(7, 15)` is hex characters **0–7**,
not 7–14. A re-derivation that hashed to a bare hex digest and sliced `[7, 15)` compares the wrong
eight nibbles and matches nothing. Worked example, verifiable in one command:

```
fen                : 1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1
recorded retrievedAt : 2026-08-14T07:58:59.150Z
synth via hex[0..7] (repo semantics)  : 2026-08-14T07:58:59.150Z   ← match
synth via hex[7..14] (bare-slice bug) : 2026-08-14T03:12:20.921Z   ← no match
recorded origin.sha256 : sha256:695c2bf8…1922   bytes: 119
digest of fixture bytes: sha256:695c2bf8…1922   len:   119          ← match
```

**Three independent tells agree, which is why this is reported as fact rather than suspicion:**

1. **Timestamp.** 135 entries reproduce the synthesis formula exactly.
2. **Digest.** The same 135 entries' `origin.sha256` equals the digest of the local fixture
   payload. The two match sets are **identical** — 0 timestamp-only, 0 digest-only. A clean bimodal
   split is what a mechanical origin looks like; coincidence would smear.
3. **Size, formula-independent.** Manufactured entries carry `origin.bytes` of **117–123** (the
   seven-field fixture payload). A real lichess tablebase body includes the `moves` array:
   `content/drafts/mate-k-q-technique.sources.json` ranges **190–8339**.

**A fourth, from the repo's own records.** The six packs' sibling job records declare it:
`content/drafts/*.job.json` for all six carry `args.offline: true`. A seventh,
`content/drafts/anti-caro-advance.job.json`, is also `offline: true` but is engine-sourced, and its
offline path replays real provenance — so it fabricates nothing. The corpus states which packs were
built offline; nothing was hidden, and nothing checked.

**The consequence.** `offlineQuery` is reachable from `make verify-draft FILE=… OFFLINE=1`
(`Makefile`), via `verifyDraft` → `verifySyzygyDraft`, and `verifySyzygyDraft` stamps
`assessedBy.sourceId`/`retrievedAt` back into the pack and writes all three sidecars next to it. So
the contamination reaches the pack documents: `content/drafts/lucena-bridge-convert.json` carries
`assessedBy.retrievedAt: "2026-08-14T07:58:59.150Z"` — a hash-derived timestamp — and the pack is
`ledger_verified`. **Six committed packs claim tablebase grounding on records that attest to a
local fixture.** No chess fact is known to be wrong — the fixture payloads may well be correct
tablebase values — but *the grounding ledger's entire property is that a verified record is
distinguishable from an unverified one*, and for these six it is not. Under law 6 this is escalated
rather than rationalised.

#### 6d. Why nothing caught it

- `validIso` (`apps/server/src/sourcing/ledger-validation.ts:43-45`) is the **entire** timestamp
  check: `!Number.isNaN(Date.parse(value))`. A hash-derived timestamp passes trivially.
- `validateOrigin`'s http branch checks key shape, a non-empty URL, an integer status, a non-empty
  digest and a denied-host list. **Nothing verifies that the digest corresponds to a fetch, that
  `status: 200` was ever received, or that the URL was requested.**
- `linkage` enforces only **internal self-consistency** between ledger and manifest — which is
  exactly what a synthesising function produces for free.
- `assessmentGrounding` is **asymmetric**: for `kind: "engine"` it cross-checks the manifest entry's
  origin (`entry.origin.kind !== "engine"` → reject; then `entry.origin.fen === document.start.fen`
  and a `depth` budget). For `kind: "syzygy"` it returns after checking only record *values*
  (`category`, `pieceCount`) with **no manifest-origin cross-check at all**
  (`ledger-validation.ts:394-405`). The engine path already does the thing the syzygy path omits.
- The offline path has **no test coverage**: `verify-draft.test.ts` never sets `offline`, always
  injecting `options.query` instead. Its only real users are CLI runs.

#### 6e. The remedy — four parts, no schema version

1. **Reshape the fixture.** `apps/server/src/sourcing/fixtures/verify-draft.json` becomes a
   FEN → `{source, payload}` map carrying a per-FEN F2 provenance record — real `retrievedAt`,
   real `status`, the digest of the **actual** response body, real `bytes`, real `etag` — captured
   at capture time, mirroring `verify-draft-engine.json`. The capture is a live tablebase run,
   recorded once.
2. **Make `offlineQuery` a pure lookup**, structurally identical to `offlineEngineEvaluator`: read
   the entry, return `{payload, source}` from the file, invent nothing. If an entry lacks a
   `source` record, throw `TABLEBASE_SOURCE_UNAVAILABLE` — a missing provenance record is a missing
   fixture. **The synthesis lines are deleted, not corrected.** `tablebase-walk.ts` reads the same
   fixture constant and is updated with it.
3. **Close the `assessmentGrounding` asymmetry.** Extend the syzygy branch to cross-check the
   manifest entry the way the engine branch already does: `entry.origin.kind === "http"`, and the
   `fen` query parameter of `entry.origin.url` equal to the record anchor.
4. **Carry the guard `fixture-realism` names.** A test asserting that **no** committed
   `*.sources.json` entry under `content/` matches either tell — the synthesis formula for its
   `retrievedAt`, or the fixture-payload digest for its `origin.sha256`. **It fails today on 135
   entries**, which is the point: it is written to fail, and the six packs are re-verified against
   a live tablebase to make it pass. This is the mechanism whose absence `fixture-realism` correctly
   identified — *"the deferral rests on the fact that nobody has committed an `OFFLINE=1` run, not
   on a mechanism"* — written against the true premise that somebody already had.

**Re-verification is content work with a real cost**: six packs, 135 entries, one live tablebase
run each via `make verify-draft` without `OFFLINE=1`. It is not in this RFC's code scope; §8 makes
it an acceptance criterion because the guard cannot go green without it.

### 7. D90 — `variantOf`, and the `reach` obligation

#### 7a. The verdict: usable, unused, and unread — in that causal order

The row is accurate. `git log -S variantOf --oneline -- content/` returns **nothing**; `grep -rl
variantOf content/` returns nothing. The token has never existed in a content file at any commit,
while two closed friction rows cite it as shipped.

**It is not unusable.** The mechanism is complete and genuinely good: `$defs/variantOf`
(`schemas/drill_pack.schema.json:975-1006`) with three directional relations; three
machine-checked refusals (`VARIANT_SELF_REFERENCE`, `VARIANT_PACK_UNKNOWN`,
`VARIANT_RELATION_UNPROVEN`, `apps/server/src/pack-validation.ts:670-696`) that **prove** the
relation with `chessops` rather than trusting the author; and a real id→pack resolver in both
`pack-check` (`siblingLookup`) and `PackRegistry.fromDocuments`. **Two corpus pairs would validate
today on a one-key edit each**, verified against the live roots:

- `philidor-passive-rook-convert` → `philidor-third-rank-hold`, `{kind: "root_after_move",
  moveUci: "h6h8"}` — the exact case the RFC was built for.
- `trajectory-mate-bishop-knight` → `mate-bishop-knight`, `{kind: "same_root_other_objective"}` —
  identical FEN and side, different `objective.type`, which is precisely the predicate at
  `pack-validation.ts:690-691`.

**So `reach` is violated at its second leg, not its first: the construct is reachable, and there
is no reason to reach for it.** `variantOf` is read by exactly one non-validation site —
`projectPackDocument` (`apps/server/src/pack-registry.ts:109`) re-emits it verbatim into the
browser payload — and `grep variantOf apps/web` returns **zero hits**. No client type, no
component, no rendered link. An author who does the work gets a proof and **no observable change
for any learner**. `rfc/archive/authoring-frictions.md:526` said so at the time: *"No client
surface is required by this RFC."*

Two further findings explain the zero rather than merely restating it:

- **The RFC's own verification substituted its evidence.** It promised a test loading *the two
  philidor drafts* through a registry (`authoring-frictions.md:530-535`). What shipped
  (`apps/server/src/pack-authoring.test.ts:305-327`) uses **synthetic fixtures** and a `moveUci` of
  `"c1e3"` against an invented sibling; neither philidor draft was edited. That is exactly how a
  field ships with a green suite and zero content — **the test that would have created the first
  use was replaced by one that could pass without it.** This is a `reach` failure with a precise
  mechanism, and it generalises: *a construct whose acceptance test uses synthetic fixtures has no
  forcing function to produce its first real use.*
- **Authors reached for the prose stand-in instead.** The B+N sibling link exists in the corpus
  today — as a free-text `retryVariants` note on `trajectory-mate-bishop-knight.json` naming
  `mate-bishop-knight` in prose, with no reciprocal link. `retryVariants` is **D86** (no runtime
  effect, cluster E, not claimed here). The corpus contains at least four more prose
  sibling-pointers of the same kind. **Authors did have the need; they expressed it in the channel
  that required no proof.**

#### 7b. The remedy — smallest thing that makes `reach` true

`reach` requires a consumer **and** a use, or a ledgered reason for neither. This RFC delivers both
and deliberately does not build a surface.

1. **One consumer, minimal.** `variantOf` becomes readable at the one place a learner is already
   choosing what to do next: the pack's own entry point renders a single labelled link to the
   sibling — *"After 1…Rh8: philidor-passive-rook-convert"*, *"Same position, other objective:
   mate-bishop-knight"* — with the label derived from the proven `relation.kind`, not authored
   prose. No new endpoint: the field is already projected at `pack-registry.ts:109`. This is a
   **link, not a surface**; anything larger belongs to the campaign/IA work and is out of scope.
2. **Two authored uses**, the two pairs proven above, added as one-key edits. They are the RFC's
   acceptance evidence, and they replace the synthetic fixtures in the existing authoring test —
   discharging `authoring-frictions`' original promise.
3. **A standing `reach` census, not a new instrument.** `pack-check` gains a **repo-level**
   warning, `CONSTRUCT_UNREACHED`, listing every pack-schema construct on a small registered list
   that has **zero uses across all of `content/`**. It is a *report*, never a per-pack error —
   an unused construct is not an invalid pack. The list starts with `variantOf`, `retryVariants`,
   `plan_consequence`, and the tempo verdicts, and each entry carries either a count or a
   ledgered reason. This is what makes *reach* checkable rather than aspirational: **the audit that
   found D89 and D90 was a one-off human pass, and one-off passes are how three days of "shipped"
   rows drifted from the corpus's actual state.**

**Not proposed:** removing `variantOf`. It is well-built, its proofs are real, its two attestations
were genuine, and the missing piece is a reader and two edits — a far cheaper repair than a
deprecation.

## Deviations from design

None. §2's law is an RFC-tier statement about format mechanics; it is **proposed for promotion**
to design tier alongside its two siblings (both of which are also still 💡 in the ledger), and this
draft does not edit `design/`. §2c declines a `design/04` §5 unblock on scope grounds and hands it
on with its measurements corrected rather than dropping it.

## Acceptance criteria

1. **0.24 lands additively.** `DRILL_PACK_SCHEMA_VERSION` is `"0.24"`; the `plan_signature` arm
   exists in `schemas/drill_pack.schema.json` and in `StructuralExpression`; the ordered-array
   equality test between the JSON Schema and the TS union still passes; **all 37 committed packs
   validate with no digest movement.**
2. **The merge is exact.** A test asserts that `structural_feature` with a `plan_signature` leaf
   and the equivalent `plan_consequence` compile to **byte-identical** predicates and emit the
   same `planClass#<id>` evidence ref, and that a `plan_signature` inside a `transition_feature`
   `position` node expands and emits the ref — the capability that does not exist today.
3. **Root firing is preserved.** A test asserts `structural_feature{plan_signature}` evaluates at
   the root position, where `transition_feature` returns `false`.
4. **`PLAN_SIGNATURE_INLINED` fires on the real edit.** A test reconstructs `930b367`'s
   post-change `carlsbad-minority-attack.json` condition and asserts the warning fires with the
   pointer to the inlined `position` node and names `minority-attack`. `PLAN_SIGNATURE_NESTED`
   refuses a registry signature containing a `plan_signature` leaf.
5. **The selection rule is published.** `docs/drill-pack-format.md` and
   `docs/structural-reading.md` carry §3c's axis-and-modifier rule and mark `plan_consequence`
   deprecated. `docs/structural-reading.md`'s current post-hoc note on the re-authored condition is
   replaced by the rule.
6. **`offlineQuery` invents nothing.** The synthesis lines are **deleted**;
   `apps/server/src/sourcing/fixtures/verify-draft.json` carries a per-FEN F2 `source` record;
   `offlineQuery` and `tablebase-walk.ts` are pure lookups; a test drives the offline path
   end to end (there is none today) and asserts the emitted record equals the fixture's stored
   provenance.
7. **The forgery guard is green, which requires the content re-verification.** A test asserts no
   committed `*.sources.json` entry under `content/` matches the synthesis formula or a
   fixture-payload digest. It **fails on 135 entries at the time of writing**; the six named packs
   are re-verified against a live tablebase, and their `assessedBy.retrievedAt` values change.
   `assessmentGrounding`'s syzygy branch cross-checks the manifest origin as the engine branch
   does, with a test that a manufactured-origin manifest yields `unverified`.
8. **`variantOf` is reached.** The two proven pairs carry `variantOf`; the sibling link renders on
   the pack entry point; `apps/server/src/pack-authoring.test.ts` uses the two philidor drafts
   instead of synthetic fixtures; `CONSTRUCT_UNREACHED` reports the registered list with counts.
9. **Ledger and log, per the completion protocol.** Archiving this RFC flips **D89**, **D90** and
   **D64** with one-line summaries, records §3a's corrected counts (50 not 41; 45 `graded` but
   never grading), records §5a's three stale D33 premises and §5b's residual leg-span gap, notes
   the D33 row's B+N-sibling sentence is no longer true, **and appends the entry to
   `planning/exploration/log.md` in the same commit.**
10. **The 135-entry finding is escalated on its own, before this RFC lands.** It is a committed-
    content integrity finding, not a code defect, and it should not wait on the whole RFC:
    a ledger row and a log entry, plus a correction to `rfc/fixture-realism.md`'s `[V,
    cross-review]` "zero matches" measurement, filed by whoever reviews this draft first.

## Open questions

1. **Is `plan_signature` the right factoring, or should `plan_consequence` simply be removed?**
   §3c chooses the merge because it preserves root firing and provenance while removing the
   redundancy, and because removal of a zero-user construct is cheap enough to do later with more
   evidence. A reviewer who thinks a registry reference belongs at condition level rather than
   expression level would keep `plan_consequence` and instead forbid inlining. **Resolve before
   `accepted`** — it decides whether the schema bump is needed at all.
2. **Should `PLAN_SIGNATURE_INLINED` be an error rather than a warning?** §3c argues warning,
   because a pack may legitimately assert a fact coinciding with a registry signature it never
   bound. If the corpus contains no such case — measurable, and not measured here — error is
   strictly better and would have made `930b367` impossible rather than merely visible.
3. **Who owns the residual leg-span boundary gap (§5b)?** It is D38's failure one scope down, no
   row covers it, and it sits in `validator-integrity`'s territory rather than this RFC's.
   Needs a ledger row regardless of the answer.
4. **Should the B+N outcome sibling be deleted?** It is no longer a grounding workaround (§5a),
   and it is now an unexamined editorial duplicate that two harness tests reference. Content
   decision, not a format one; **owner-facing**, and currently tracked by nothing.
5. **Who corrects the 41/50 count in the three design-tier documents?** `design/BACKLOG.md`,
   `design/research/authoring-vocabulary-completeness.md` and `design/research/README.md` all carry
   it, and this draft may not edit `design/`. The dossier's *verdict* is unaffected — the corrected
   number makes its argument stronger, not weaker.
6. **Does the third law get promoted while its predecessor never was?** §1 shows the
   declared-vs-executable law is **not** in `docs/drill-pack-format.md` despite two archived RFCs
   saying it is, and its promotion row is still 💡. Promoting a third law onto an unpromoted
   predecessor would leave the law surface split, which law 5 exists to prevent. **Owner-facing:
   promote both, or neither, in one pass.**
7. **Does `relation: "prospective"` have an in-run meaning?** Found while judging §2c and
   deliberately **not** ledgered as a defect. `#loadShapes`
   (`apps/web/src/lib/session-controller.ts:624-627`) drops every `prospective` reference, so a
   prospective shape that later *does* arrive produces no in-run marker; three packs declare one.
   But the server's `shapeRecommendations` (`apps/server/src/service.ts:758-770`) evaluates
   firings over the **whole catalogue**, so prospective shapes are detected there. This may be the
   intended split — prospective is a catalogue relation, not a marker — and **D49 was withdrawn
   for exactly the error of calling a `prospective` subtlety a defect without checking the field.**
   Question, not a finding: does an author declaring a prospective shape expect a marker when it
   arrives?

## Changelog

- 2026-08-15: created. Claims pack **0.24** only (yielded 0.23 to `engine-leverage`, wave 1); no run-schema change, no migration. Names the
  **vocabulary-wiring law** as a third member of the declared-vs-executable / engine-request-
  contract family, with four obligations (**choose**, **reach**, **honour**, **attest**) and the
  overlap stated as one leg at one row (D90). Merges `plan_consequence` into a `plan_signature`
  expression leaf and publishes the selection rule (D89); makes `offlineQuery` a pure lookup and
  carries the forgery guard (D64); gives `variantOf` a consumer and two proven uses (D90).
  Verifies D33 and D38 as genuinely closed and reports three stale row premises plus one residual
  leg-span gap. Excludes per-leg trajectory expressiveness on the spine test, and `cost` and
  claim-delivery by ownership. **Reports first-hand that 135 of 341 committed syzygy manifest
  entries are manufactured, overturning `rfc/fixture-realism.md`'s cross-reviewed "zero
  matches".**
