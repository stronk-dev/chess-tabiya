# RFC: Format surface — what is declared, what is reached, and what cannot be said

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/04-content-architecture.md` §5 (the six-entry trajectory launch
  set), `design/05-in-run-experience.md` (the assistance ladder — the surface `arrows`
  claims a rung on). `design/BACKLOG.md` rows cited **by title** throughout, per the
  moving-tree rule below.
- **Exploration gate:** none needed. Every row below is a ledgered defect with code
  evidence, not a GAP row (law 1, second clause). D96's row is explicitly marked
  *"needs an owner"*; this RFC is the owner.
- **Depends on:** `rfc/archive/defect-sweep.md` §2 (the declared-vs-executable law, applied
  here and not amended), `rfc/archive/engine-request-contract.md` §3 (the *record*
  obligation, applied to D57), `rfc/engine-leverage.md` §6.2 (the four-disposition register
  and its enumeration gate — the **mechanism** this RFC borrows wholesale), `rfc/archive/
  validator-integrity.md` §5 (which scoped the per-leg gap out and specified the six sites
  a successor must move), `rfc/vocabulary-wiring.md` §2c (which excluded D96 on the spine
  test and named the missing destination), `rfc/archive/authoring-frictions.md` §8b (the
  D29 *inversion* precedent), `rfc/archive/resistance-spectrum.md` (migration 19 —
  `eloHonored`/`eloApplied`, without which §4's no-run-schema claim would be false)
- **Parent / amends:** amends `rfc/client-surface-floor.md` acceptance criterion 8(b) — see §6
- **Supersedes / superseded by:** —
- **Planning:** `planning/format-surface/` (once implementing)

> **Locate by symbol, not by line.** `apps/server/src/guard.ts`, `apps/server/src/
> sourcing/check.ts`, `apps/server/src/pack-validation.ts`, `apps/web/src/lib/api.ts`,
> `packages/schema/src/drill-pack/*` and `schemas/drill_pack.schema.json` are all
> modified-uncommitted in the tree this draft was written against, and codex is mid-flight
> on D64 in `sourcing/`. Every line number here is advisory; every symbol name was
> verified. Where a claim depends on a number (a count, an enum arity) the number was
> re-derived first-hand rather than copied from a dossier, and three dossier/ledger
> figures are **corrected** below (§3.3, §4.1, §1.4).
>
> **[cross-review] Re-derived at `0fbf0ef`.** Every count and every file:line citation in
> this draft was re-run by a second reader who did not write it. Most held: the corpus
> counts (43 / 139 / 36 / 10 / 9 — criterion 1), the `retryVariants` document/entry/kind
> counts and the *4 of 11* `variantOf` coverage (§3.3), the D57 code quote verbatim, the
> `#selectionRequest(run, nodeId, pack, mode, seed)` signature, `legIndexAt`'s signature and
> export, and 14 of 15 spot-checked line citations. **Six classes of defect did not hold**
> and are corrected inline, each marked `[cross-review]` with the measurement that forced
> it: §2 (the anti-vacuity clause is itself vacuous, and the register's key cannot address
> its own seed rows), §3.1 (two axis counts), §3.3 (the *11 of 11* prose-referent count is
> **8 of 11**), §3.4 + §1d + §1e + criterion 13 (D59's ledger row is **already flipped**),
> §4.3 (the piece-count refusal rests on a decidability claim that is false in the direction
> that matters, and admits unguarded a mid-run 422 it refuses two modes to avoid), and §5
> (`rfc/README.md` has moved under this draft). Criterion 9 asserted a count that makes its
> own test fail. **Three of the corrections change the specification rather than the prose
> (§4.3's three) and are the author's to ratify** — a reviewer may not narrow a shipped
> surface unilaterally, so they are landed with the reasoning exposed rather than assumed.

## Summary

The drill-pack and client formats have a surface mismatch that runs in **both directions at
once**: things are declared, shipped and reached by nothing, and things are needed by
authored content and cannot be said at all. These are one audit, not two, because they have
one cause — **the format and the runtime disagree about what exists, and nothing enumerates
the disagreement**. This RFC classifies every declared-and-unreached item in the current
ledger (D84, D85, D86, D57, plus three rows that turn out to be already discharged), makes
the missing per-leg trajectory surface expressible (**D96** — the one item with a deadline,
blocking four of `design/04` §5's six launch entries), and installs the enumeration gate
that would have produced this list mechanically instead of one research dossier at a time.
It claims **pack schema 0.25**, **no run-schema version**, and **no migration**.

**It mints no new law.** §1 tests each row against the two laws the repo already has and
finds all of them covered — several as textbook instances, one as the *inversion* that
already has a shipped precedent. The repo retracted a proposed third law (`attest`) eight
hours ago for exactly this reason; the same test is applied here and reaches the same
answer.

## Motivation

### The through-line

`design/BACKLOG.md`'s defect register currently holds a family of rows that read as
unrelated bugs and are one shape:

> **A declared thing and its executable behaviour disagree, and no surface says so.**

Half the family disagrees by *excess* — the document declares more than the runtime does.
The other half disagrees by *deficit* — the runtime does more than the document can say, or
authored content needs a construct the format has no syntax for. The excess half is a
liability (a learner can toggle a control that does nothing; an author can write a field
that is parsed and dropped). The deficit half is a blocker (four of six launch trajectories
cannot be authored). **The audit that finds one finds the other**, because both are answers
to the same question: *for each thing the format declares, what reaches it?*

### What created the list, and why a mechanism is the deliverable

Every row in this RFC was found **by hand**, by a human or an agent reading code against
prose, one dossier at a time:

| Row | Found by | Instrument that could have found it |
|---|---|---|
| D84 `arrows` | `design/research/campaign-effect-vocabulary.md` §2a | none |
| D85 `SIMULATE_BUDGET_EXCEEDED` | same dossier §2b | none |
| D86 `retryVariants` | same dossier §2c | none |
| D39 / D40 | the codex pack-vocabulary audit | none |
| D57 | `design/research/maia-policy-scalar-stability.md` | none |
| D59 | R5 (`tools/r5-maia-stability-harness`) | the harness, and only because it was built for something else |
| D96 | `design/research/authoring-vocabulary-completeness.md` | none |

Seven defects, seven hand-audits, zero instruments. `engine-leverage` §6.2 names the state
these rows lived in — **the fourth silent state**: not reached, not refused, not impossible,
just *unclassified* — and builds a register plus an enumeration gate to abolish it for
**instrument capabilities**. The identical state exists for **format declarations** and has
no register. This RFC's largest deliverable is not any single fix; it is applying that
register one layer down, so the eighth row is found by a failing test.

### Scope boundary

**In scope:** the four still-open excess rows (D84, D85, D86, D57), a disposition for each;
the expressibility fix for D96; and the register that classifies them. Three further rows
(D39, D40, D59) are in scope only as **evidence** — §3.4 shows they are already closed in
code, and they matter because they are the law's own precedents.

**Out of scope, named:**

- **The economy.** D85's row says *"there is no economy — rewind and fork have no counter…
  and inventory lives in localStorage so nothing can be earned"*. Designing one is a product
  question for the campaign work, not a format defect. This RFC disposes of the **dead error
  code** and says nothing about whether an economy should exist.
- **`variantOf` becoming a superset of `retryVariants`.** §3.3 measures the shortfall
  exactly and refuses to hand-wave it; closing it is Open question 4.
- **Making the opponent policy server-authoritative.** §4.4 shows the main play path builds
  its policy **in the browser** today. Per-leg resistance inherits that trust posture
  without worsening it; changing it is a separate item (Open question 5).
- **Any engine-condition surface** — `engine-leverage`'s (pack 0.23).
- **`plan_signature` / `plan_consequence`** — `vocabulary-wiring`'s (pack 0.24).
- **`deviation.planClassId`**, ranked alongside D96 by the same audit. It is additive and
  invalidates no pack, exactly like D96, but it has no deadline: nothing in `design/04` §5
  is blocked on it. Named so its omission is a decision rather than an oversight.

## Specification

### 1. The law test — applied, not minted

The task this RFC was set names a candidate rule: *"the format's surface and the runtime's
behaviour disagree about what exists."* Before adopting it, it is tested against what the
repo already has. **The test fails to justify a new law**, and the working-out is given
rather than asserted, because the repo retracted a proposed third law (`attest`) on
2026-08-15 when its own test was applied honestly (`rfc/vocabulary-wiring.md` §2b: *"the
law's own test, applied to itself"*), and the engine-request contract's `record` obligation
already covered the case.

#### 1a. The two laws, quoted

**The declared-vs-executable law** (`rfc/archive/defect-sweep.md` §2, normative in
`docs/drill-pack-format.md`):

> An executable vocabulary may contain only values the shipped runtime executes. A declared
> vocabulary may contain values it does not, provided every such value carries a
> machine-checked refusal reason and the deployment publishes what it can actually select.

**The engine-request contract's five obligations** (`rfc/archive/engine-request-contract.md`
§3, ledgered as *"The engine request contract (promote to design tier)"*): *state*, *clear*,
*bind*, *bound*, *record*. Its own framing of the boundary: *"that law governs what a
document may SAY; this one governs what a call must DO."*

#### 1b. Each row, tested

| Row | Covered by | Fit |
|---|---|---|
| D84 `arrows` | declared-vs-executable | **Textbook, on a new domain.** `arrows` is an executable-looking enum (`"off" \| "sight" \| "evidence"`, `packages/runtime/src/assistance.ts:12`) whose non-`off` values the runtime does not execute, with no refusal reason and no capability publication. The law is stated over *vocabularies* and its worked examples are both pack fields; nothing in its text restricts it to packs, and the machinery it demands — a permission publication — **already exists on this surface** (`permittedAssistance`, `assistance.ts:29`). Extended by application, not amendment |
| D85 `SIMULATE_BUDGET_EXCEEDED` | declared-vs-executable, **with one honest gap** | The *diagnosis* fits perfectly: a declared value (`apps/server/src/errors.ts:42`) the runtime never produces, published to clients through the 422 mapping at `apps/server/src/rest.ts:532`. The *remedy clause* is *vacuous here*: "carries a machine-checked refusal reason" cannot apply to a value that **is** a refusal reason. §3.2 therefore applies the law's principle (declare only what you execute) and not its remedy, and says so |
| D86 `retryVariants` | declared-vs-executable | Textbook. Five declared kinds, zero runtime consumers, no refusal reason, no publication. The law's *remedy* again needs care — §3.3 — because the field is not a selector |
| D57 `practical_resistance` vacuity skip | engine-request contract, **record** | Not a declared-vs-executable case at all: the mode *is* published, *is* selectable, and the runtime *does* execute it. The defect is that the persisted `policyModeApplied` reads `practical_resistance` for a move chosen by `left.move.uci.localeCompare(right.move.uci)`. *record* is "every value applied and the answer taken appear in the persisted record"; the answer taken was lexicographic and the record says otherwise |
| D96 per-leg surface | declared-vs-executable, **read as an inversion** | The law's text forbids excess and is silent on deficit. But the repo has already ruled that the mirror is a member of the same family: **D29**'s ledger row reads *"a declared-vs-executable **inversion** — the mirror of D8, where the format declared MORE than the runtime executed; here the runtime executes more than the format can declare"*, and `authoring-frictions` §8b shipped the fix. D96 is the same inversion with a stronger claim: not one enum value, a whole construct. **Precedent applies; no amendment needed** |
| D39, D40 | declared-vs-executable | Already discharged by `validator-integrity` §8a/§8b **by applying this law** — §3.4 |
| D59 | engine-request contract, *state* + *record* | Already discharged by `engine-request-contract` §10(a)+(b) — §3.4 |

#### 1c. The verdict, and what is added instead

**No new law.** Seven of the eight rows land inside one of the two existing laws with no
strain; the eighth (D96) lands inside a precedent the ledger has already recorded as a
member of the same family. A candidate rule that adds nothing to a case it covers is
theory that is not carrying weight, and the repo's own most recent judgement on that
question is to drop it.

What *is* missing is not a law but an **instrument**. The declared-vs-executable law has
been normative since `defect-sweep` and has never had one: it is enforced by whoever
happens to read the code next to the schema. `engine-leverage` §6.2 solved exactly this for
instrument capabilities — a frozen table, published on `/capabilities`, with a test that
fails when an advertised capability has no row. §2 applies that mechanism to format
declarations. **Prefer applying an existing law to naming a new one; prefer generalising a
shipped mechanism to inventing one.**

#### 1d. One correction owed to the framing

The task brief describes D39 and D40 as open. They are not: `design/BACKLOG.md` marks both
`✅ closed 2026-08-15 by validator-integrity`, and §3.4 verifies both in source. D59 was the
reverse case — the **ledger row read `💡 open` while the code was fixed**. Neither
correction weakens the through-line; the second sharpens it, because a ledger row that
disagrees with the code about what exists is the same defect one tier up.

> **[cross-review]** D59's row has since been flipped to `✅` (§3.4). The observation stands
> as the reason the flip happened; the status claim does not, and is corrected wherever this
> draft repeats it.

#### 1e. Every row, disposed — the table this RFC exists to produce

Nothing is left unclassified. Where a classification is provisional, the disposition that
*says so* is used (`refused` with a named path forward, or `unmeasured`), never silence.

| Row (ledger title, abbreviated) | Direction | Law applied | **Disposition** | One-line justification | §
|---|---|---|---|---|---|
| **D84** *"`arrows` is a fully-plumbed no-op"* | excess | declared-vs-executable | **retire** | `sight` has no directed structural primitive; `evidence` is a move verdict already refused under law 8. Nothing left to implement that is not a lie | 3.1 |
| **D85** *"`SIMULATE_BUDGET_EXCEEDED` is declared and never thrown"* | excess | declared-vs-executable (principle; remedy clause vacuous) | **retire** | Implementing it means inventing a budget, i.e. inventing product from a defect row. Re-mint with the economy that needs it | 3.2 |
| **D86** *"`retryVariants` has no runtime effect"* | excess | declared-vs-executable | **refused** now, `retired` when its successor is a superset | It names no referent, so it cannot be executed as declared; `variantOf` is the executable successor and covers **4 of 11** committed entries. `retired` needs a `removedAt` this RFC cannot honestly fill | 3.3 |
| — *"`segment_end` is used zero times"* (D86's second half) | **neither** | none — not a format defect | **`reached`; content gap** | Fully executable and gated; zero authored uses. Belongs to `vocabulary-wiring`'s *reach* failure, not here. Split out so D86 does not close as if both halves were one finding | 3.3 |
| **D57** *"The vacuity gate can be skipped…"* | excess-in-the-**record** | engine-request contract, **record** | **implement** | The mode is real, published and capability-gated; one conjunct lets an alphabetical selection wear its name. Both doors shut, plus one new named 422 | 3.5 |
| **D39** *"decimal `material_balance` equal-conditions…"* | excess | declared-vs-executable | **already implemented** (`MATERIAL_EQUALITY_UNSATISFIABLE`) | Verified in source; ledger flipped. Cited as the law's own precedent | 3.4 |
| **D40** *"`winner` is accepted for `stalemate` and then ignored"* | excess | declared-vs-executable | **already implemented** (`RULES_FACT_WINNER_UNSUPPORTED`) | Verified in source; ledger flipped. Same precedent | 3.4 |
| **D59** *"top-p can sample a `bestmove` outside…"* | excess-in-the-**record** | engine-request contract, *state* + *record* | **already implemented** at `43c6c4a`; ledger row **flipped ✅ since drafting** `[cross-review]` | Widened window + `offWindow` marker both ship. Reported to `engine-request-contract`'s owner rather than flipped by a second writer; the row now reads ✅ at `0fbf0ef` | 3.4 |
| **D96** *"Per-leg `shapes` and `opponentPolicy` are inexpressible…"* | **deficit** | declared-vs-executable, read as the **D29 inversion** | **implement** | Blocks 4 of 6 launch trajectories; purely additive; invalidates zero packs. Claims pack **0.25** | 4 |

**The silent state, named once.** Every row above spent time in a state that is neither
reached, refused, retired, measured, nor impossible — it was simply *unclassified*, and the
only reason it stopped being so is that a person or an agent happened to read the right two
files in the same hour. `engine-leverage` §6.2 calls this **the fourth silent state** for
instrument capabilities; for format declarations it is the sixth, and it is the same state.
§2 is the part of this RFC that makes it hard to occupy quietly. The three "already
implemented" rows enter the register as `reached` — the refusal *is* the reached behaviour —
so that a later reader finds the decision rather than re-deriving it.

### 2. `FORMAT_DISPOSITIONS` — the register and its gate

Modelled on `CAPABILITY_DISPOSITIONS` (`engine-leverage` §6.2). Same four dispositions, one
added, because a format declaration can be *withdrawn* in a way an instrument capability
cannot:

| Disposition | Meaning | Obligation |
|---|---|---|
| `reached` | A named runtime site consumes it | Name the site (module + symbol) |
| `refused` | Deliberately unreached | **Name the reason**, in a string a validator can emit |
| `retired` | Declared, unwanted, being withdrawn | Name the successor construct (or `null`) **and** the pack schema version at which the declaration is removed |
| `unmeasured` | Undecided pending a named experiment | Name the experiment and its ledger row; carries an expiry obligation |
| `impossible` | A measured impossibility | Name the measurement |

**Location.** `packages/schema/src/drill-pack/dispositions.ts`, exporting a frozen
`FORMAT_DISPOSITIONS: readonly FormatDisposition[]` where
`FormatDisposition = {pointer, value?, disposition, reason, site?, successor?, removedAt?,
experiment?}` and `pointer` is a JSON Pointer into the pack schema (or the string
`"assistance:<axis>"` for client-preference axes, or `"error:<CODE>"` for `ServerErrorCode`
members — neither is a pack document). It lives in
the schema package rather than the server so that `make pack-check` can emit its reasons
offline, exactly as `DECLARED_UNIMPLEMENTED_POLICY_MODES` reasons already reach the loader
(`apps/server/src/pack-validation.ts`, `UNSUPPORTED_OPPONENT_POLICY`).

> **[cross-review] The key was wrong, and the register's own seed rows failed its own
> gate.** As drafted, `pointer` alone was the row identity and was specified as *"a JSON
> Pointer into the pack schema"*. Three of the rows this RFC lands are not addressable that
> way. (a) The two seed rows below are **enum values**, not properties: both are
> `/opponentPolicy/mode`, so as drafted they are one pointer twice — an identity collision
> in a two-row seed. Verified: `$defs/opponentPolicy.mode` is a single seven-member `enum`
> at one pointer (`schemas/drill_pack.schema.json`), and `DECLARED_UNIMPLEMENTED_POLICY_MODES`
> keys its two rows by `mode`, not by pointer (`apps/server/src/capabilities.ts:22-25`).
> (b) §3.2's row uses an `error:` namespace §2 never declared. (c) Gate clause 3 — *"fails
> when a pointer in the register does not exist in the schema"* — rejects `assistance:arrows`
> and `error:SIMULATE_BUDGET_EXCEEDED` outright, so the register as specified could not
> contain the rows this RFC exists to write. **Corrected:** `value?` is added, row identity
> is the pair `(pointer, value)`, the `error:` namespace is declared here rather than
> introduced in passing, and clause 3 is scoped to schema-namespace pointers below.

**Publication.** `apps/server/src/capabilities.ts` re-exports it on `/capabilities` as
`formatDispositions`, alongside `engine-leverage`'s `capabilityDispositions`. A deployment
that cannot execute a declared field says so in the same payload it already uses to say
which policy modes it can select.

**The gate, and it must not be vacuous.** A test in `packages/schema/src/drill-pack.test.ts`:

1. Walks `schemas/drill_pack.schema.json` and collects every leaf property pointer and
   every closed-`enum` member (the same document the existing enum-parity test at
   `drill-pack.test.ts` already reads, so the walker has a precedent and a fixture).
2. Collects every `(pointer, value)` pair named in `FORMAT_DISPOSITIONS`.
3. **Fails when a schema-namespace pointer in the register does not exist in the schema**,
   and, for a row carrying `value`, when that value is not a member of the enum at that
   pointer (a stale row). Rows in the `assistance:` and `error:` namespaces are checked
   against `AssistanceConfig`'s key set and the `ServerErrorCode` union respectively.
4. **Fails when a `reached` row's named site does not exist** — the site is
   `{module, symbol}` and the test asserts the symbol is exported or referenced there.
5. Does **not** attempt to prove reachedness by static analysis; that is undecidable in
   general and a test that pretends otherwise is worse than none. The register is
   author-maintained; the test keeps it *honest*, not *complete*.
6. **Fails when `FORMAT_DISPOSITIONS` does not reproduce a floor derived from a live
   constant.** The floor is computed, not written down: every member of the
   `/opponentPolicy/mode` enum that is absent from `RUN_OPPONENT_MODES`
   (`packages/runtime/src/types.ts:38`) must have a `refused` row whose `reason` is the
   verbatim string `DECLARED_UNIMPLEMENTED_POLICY_MODES` carries for it. The test fails
   when the register is empty, when it misses a member, or when a reason has drifted.

> **[cross-review] The anti-vacuity clause did not carry over — it was itself the D61
> shape.** As drafted, clause 6 read *"fails when the walk yields zero pointers"*. That
> clause can never fire. The walk is over `schemas/drill_pack.schema.json`, a committed file
> whose leaf-pointer count is a positive constant of the repository; reaching zero requires
> deleting or corrupting the schema, at which point every other test in the package has
> already failed. D61's ledgered definition of the failure is *"asserts against a property
> the CSS makes constant"* — this was the same assertion against a property the committed
> schema makes constant. **The clause `engine-leverage` §6.2 wrote is not analogous to this
> one, and copying its words rather than its reasoning is what went wrong.** Its degenerate
> quantity is real and reachable: `EngineHealth.options` is *optional*
> (`engine-supervisor.ts`), so a live deployment genuinely produces `undefined` and a diff
> against `undefined` genuinely passes by finding nothing. The quantity that degenerates
> **here** is not the schema walk — it is `FORMAT_DISPOSITIONS` itself. Clauses 3, 4 and 5
> all quantify over register rows, so **an empty register passes every clause of the gate as
> drafted**, and so does a register that silently loses rows. Corrected clause 6 puts the
> threshold off the instrument's optimality boundary by deriving the floor from a constant
> that ships and grows (`DECLARED_UNIMPLEMENTED_POLICY_MODES`), so the gate fails when the
> register shrinks below what the codebase already refuses — which is exactly the regression
> the seed rows were chosen to be. Acceptance criterion 10 is corrected to match.

**What the register does not claim.** It does not prove that every unreached declaration has
been found — only that every declaration *the register names* is classified, and that no
classification has gone stale. The honest measure of completeness is Open question 1.

**Seed rows.** The register lands with the rows this RFC decides (§3, §4), plus the two
already-honest cases that establish the `refused` pattern predates it:
`{pointer: "/opponentPolicy/mode", value: "plan_defense"}` and
`{pointer: "/opponentPolicy/mode", value: "human_external"}`, both `refused` with
the verbatim reasons already in `DECLARED_UNIMPLEMENTED_POLICY_MODES`
(`apps/server/src/capabilities.ts:22-25`). Those two rows are a **regression fixture**: the
register must reproduce a refusal the codebase already gets right, or it is describing
something other than what ships — and under corrected clause 6 they are no longer written
down at all, they are **derived** from that constant, so a third declared-and-unimplemented
mode added later fails the gate instead of quietly widening the enum.

### 3. Half one — declared, shipped, reached by nothing

#### 3.1 D84 — *"`arrows` is a fully-plumbed no-op"* → **retire**

**Verified.** `AssistanceConfig.arrows: "off" | "sight" | "evidence"`
(`packages/runtime/src/assistance.ts:12`); defaulted in `SILENT_ASSISTANCE` (`:17`);
permissioned in `permittedAssistance` (`:29`, `mayRequestSplit ? "evidence" : "sight"`);
persisted and **migrated across three schema versions** in
`apps/web/src/lib/assistance-preference.ts` (the `version === 3`, `=== 2` and `=== 1` arms
each write `arrows: "off"` into the v4 record). Its only non-plumbing occurrence in the
entire tree is the `<select>` at `apps/web/src/lib/AssistanceSettings.svelte:43`.

**No renderer reads it.** The board's overlay input is `boardOverlays` in
`apps/web/src/lib/DrillScreen.svelte`, gated on `effectiveLighting` — `boardLighting`, not
`arrows` — and it emits `{ orig: square, brush: "blue" }` with **no `dest`**. It reaches
`Chessboard.svelte` as `overlays?: readonly DrawShape[]` → `drawable.autoShapes`.
Chessground draws a circle for a shape with only `orig` and an **arrow only when `dest` is
present**, so the arrow capability exists in the board component and no caller uses it.

**The zero is unique, and was re-derived here.** Counting non-test reads of each axis
(`assistance.<axis>` or `.<axis> ===` across `apps/web/src`, `apps/server/src`,
`packages/runtime/src`): `humanSplit` 12, `corpus` **8**, `spoken` 6, `guided` 4,
`boardLighting` **3**, `markers` 3, `ambient` 2, `voice` 2 — and `arrows` **0**. It is not
one weak axis among nine; it is the only one with nothing behind it.

> **[cross-review] Two of these were wrong, both in the direction that mattered least.**
> The draft read `corpus` 5 and `boardLighting` 5. Re-counted occurrence-by-occurrence at
> `0fbf0ef`: `corpus` is **8** — `DrillScreen.svelte:715` packs four matches onto one line
> and `:716`/`:717` three more, and the draft missed the two server reads
> (`apps/server/src/shape-check.ts:28`, `apps/server/src/rest.ts:1066`); `boardLighting` is
> **3**, at `DrillScreen.svelte:294` (×2) and `:825`, not 5. **The argument survives
> unchanged and is slightly stronger**: `boardLighting` — the axis §3.1's own renderer
> paragraph and `client-surface-floor` 8(b) both lean on — is thinner than the draft
> claimed, and `arrows` is still the only zero. What this cost is precision, and precision
> is what a count is for: an axis-read tally that is wrong on two of nine is not evidence a
> reader can use without re-running it, which is why criterion 7 asserts the **zero**
> directly rather than the ranking.

**Disposition: `retired`, successor `null`.** Reasoning, in the order it was actually
decided:

- **Implement was considered first and rejected on grounds already published.** An arrow
  is a *directed* mark and needs a from→to pair. The structural reader produces
  `features[].squares` — square **sets**, not directions — so `arrows: "sight"` has no
  primitive to draw and inventing one is a design-tier change this RFC may not make (law 5).
  And `arrows: "evidence"` would draw the engine's chosen move as a board arrow, which
  `engine-leverage` §6.3 has **already refused by name**: *Stockfish `bestmove` / MultiPV
  rank / `bestline` → `refused` — verdicts, not measurements — C3 / Law 8*. Implementing
  the `evidence` rung would reintroduce, on the board itself, the thing `AGENTS.md`
  identifies as the failure shape the whole product dies in.
- **Retire is therefore the only remaining option that is not a lie**, and it is what the
  finding dossier recommended (`design/research/campaign-effect-vocabulary.md` §"Fix or
  delete `arrows`").

**What a shipped-and-unused declaration cost us, stated plainly.** `arrows` is not an
inert schema field an author might never notice. It is **a control the learner can see and
operate**, on the one panel whose entire purpose is to promise the learner authority over
what the board tells them. Setting it to "Structural sight" produces no change on any
board, at any viewport, in any session kind. The cost is not the dead code — the dead code
is nine lines. The cost is that the assistance panel's promise is 8/9 true, and the learner
has no way to know which ninth. `design/05`'s assistance ladder is a contract with the
learner about disclosure; an axis that discloses nothing while claiming a rung is a defect
in that contract, not in the renderer. Three localStorage migrations carried it forward
without anyone asking what read it — which is precisely the fourth silent state, shipped
to a user-visible surface.

**Mechanics.**
- `AssistanceConfig` drops `arrows`; `SILENT_ASSISTANCE` and `AssistancePermission` drop it.
- `apps/web/src/lib/assistance-preference.ts` gains a **version 5**: the v4 arm strips
  `arrows`; the v3/v2/v1 arms stop writing it. This is the file's fourth upgrade arm and
  follows the three already there exactly.
- The `<select>` is removed from `AssistanceSettings.svelte`.
- `FORMAT_DISPOSITIONS` gains `{pointer: "assistance:arrows", disposition: "retired",
  successor: null, reason: "no renderer consumed it; a directed mark has no structural
  primitive, and an evidence arrow is a verdict refused by engine-leverage §6.3"}` — the
  row survives the deletion so the decision is discoverable, which is the whole point of a
  register.
- **Cross-draft:** `rfc/client-surface-floor.md` criterion 8(b) asserts
  `permission.arrows === "sight"`. See §6.

#### 3.2 D85 — *"`SIMULATE_BUDGET_EXCEEDED` is declared and never thrown"* → **retire**

**Verified.** Declared in the `ServerErrorCode` union at `apps/server/src/errors.ts:42`;
mapped to HTTP 422 at `apps/server/src/rest.ts:532`; **thrown nowhere**. The only refusal
`Service.simulate` raises is `SIMULATE_TOO_LARGE` (`apps/server/src/service.ts`, guarding
`maxBranches > 4 || maxPlies > 12`) — a **shape cap**, which refuses a request that is too
big, not a caller who has had too many.

**Disposition: `retired`, successor `null`.** A refusal code is a *published capability to
refuse*. Publishing one the deployment cannot exercise tells a client to handle a 422 that
will never arrive and tells the next author that a budget exists to hang a counter on. The
law's principle applies exactly; its remedy clause does not, since a refusal reason cannot
carry a refusal reason (§1b), and this RFC does not stretch the law to pretend otherwise.

**Why retire and not implement.** Implementing means choosing a budget — per learner, per
run, per window — and choosing one is a product decision with a live design question behind
it (the campaign economy). Shipping a number now to make a dead code live would be
inventing product from a defect row. Retiring costs nothing and is reversible: when an
economy is designed, it names its own refusal.

**Mechanics.** Remove the union member and its `rest.ts` mapping arm. `FORMAT_DISPOSITIONS`
gains `{pointer: "error:SIMULATE_BUDGET_EXCEEDED", disposition: "retired", successor: null,
reason: "no metered operation existed to exceed; SIMULATE_TOO_LARGE is a shape cap, not a
budget. Re-mint with the economy that needs it"}`. A test asserts the literal
`SIMULATE_BUDGET_EXCEEDED` appears **zero** times across `apps/`, `packages/` and
`schemas/`, so a later reader cannot half-restore it.

**Explicitly not disposed:** the eight unconditionally-free operations the dossier counted.
They are not *declarations* — nothing says they are budgeted — so they are not
declared-vs-executable defects and this register has no pointer for them. They stay a
campaign-design question. Naming this is the difference between an audit and a wishlist.

#### 3.3 D86 — *"`retryVariants` has no runtime effect"* → **refused**, with a two-step retirement path

**Verified.** `retryVariants` is declared at `schemas/drill_pack.schema.json` (`properties.
retryVariants`) and `packages/schema/src/drill-pack/types.ts:214`. Its item shape is
`{kind, note?}` with `kind` a closed five-member enum and **no referent field at all** — no
pack id, no move, no position. It is read by exactly two things in the tree: the schema
shape assertion in `packages/schema/src/drill-pack.test.ts` and the JSON Schema itself.
Zero runtime sites. `docs/return-and-progression.md` (§"Pack format 0.6") says only that
packs *"may declare typed `retryVariants`"* — the doc promises nothing either.

**This is the decisive fact, and it changes the disposition.** `retryVariants` cannot be
implemented *as declared*, because there is nothing to execute: `related_position_same_idea`
names no position, `opposite_side` names no pack. Adding a referent does not make it work —
it makes it `variantOf`, which already ships (pack 0.16, `$defs/variantOf` =
`{packId, relation, note?}` with three directional relations).

**And `variantOf` is not yet a superset — measured, not assumed.** Across all of
`content/` plus `schemas/drill_pack.example.json`, `retryVariants` appears in **8
documents** (7 authored packs) carrying **11 entries**:

| kind | entries | `variantOf` counterpart |
|---|---|---|
| `different_material_details` | **5** | **none** |
| `opposite_side` | 2 | `same_root_other_side` |
| `related_position_same_idea` | 2 | **none** (different root; `variantOf` is *of* one root) |
| `same_root_new_defense` | 1 | `root_after_move` |
| `alternate_plan_class` | 1 | `same_root_other_objective` |

`variantOf` has **zero users** in `content/`, and covers 4 of 11 entries. Worse, most
uncovered notes name **several** sibling packs at once — *"the rest of the theoretical-mates
family, easiest first: `mate-k-q-technique`, `mate-k-r-technique`, `mate-two-bishops`"*
(`content/drafts/mate-bishop-knight.json`) — while `variantOf` is a **single object**, not
an array. Retiring `retryVariants` today would delete expressiveness that seven authored
packs are using.

> **Correction to a sibling draft, offered rather than asserted.** `vocabulary-wiring` §7
> counts *"exactly two entries repo-wide use `related_position_same_idea` to name a sibling
> pack id"* and widens to six on a looser reading. Both counts are right for what they
> measure. The count that decides *this* disposition is different and larger: **8 of the
> eleven entries name at least one real pack id in free text, and 5 of those name two or
> three.** The prose stand-in is the dominant habit, and it is dominant because `variantOf`
> cannot hold a list.
>
> **[cross-review] This count was the one that flipped the disposition, and it was wrong.**
> The draft asserted *"every one of the eleven entries names at least one real pack id"* and
> *"the four `different_material_details` notes"*. Re-derived at `0fbf0ef` by building the
> set of **79** real pack ids in `content/` and substring-matching every note against it:
> **8 of 11**, not 11 of 11, and `different_material_details` has **five** entries, not four.
> The three that name nothing are `content/drafts/queen-vs-pawn-seventh-convert.json`'s
> `opposite_side` entry — whose note defers to a save-side sibling **that does not exist**
> — and the two entries in `schemas/drill_pack.example.json`, which carry **no `note` field
> at all** (`note` is optional). The claim *"every uncovered note names several sibling packs
> at once"* is also false: of the **7** uncovered entries, the five
> `different_material_details` notes name 3/2/2/2/3, but the two `related_position_same_idea`
> notes name exactly **one** each.
>
> **Does the corrected count still carry the disposition? Yes, and here is the test rather
> than the assurance.** `refused`-not-`retired` needs one thing to be true: that `variantOf`
> as it ships cannot absorb what content is using. Five of the seven uncovered entries name
> two or three packs against a `variantOf` that is a single object — that is the array gap,
> and it is unmoved. What the correction *does* remove is the word **unanimous**: at 8 of 11
> the prose stand-in is dominant, not universal, and the unanimity was doing rhetorical work
> the measurement does not support. The disposition stands on the array gap alone.
>
> **And the miss is itself the finding.** `queen-vs-pawn-seventh-convert.json` points at a
> pack nobody wrote, and no validator can see it, because the referent is a substring of a
> prose note. That is a sharper argument for `RETRY_VARIANTS_NOT_EXECUTABLE` than the
> unanimity claim was — a dangling cross-reference invisible to the loader is what "names no
> referent" costs in practice. Ledgered as a new row (`design/BACKLOG.md`).

**Disposition: `refused` now, `retired` when its successor is a superset.** The reason
published on the row, and emitted by the validator: *"`retryVariants` is a catalogue
relation, not a run modifier: nothing in the runtime reads it, and no future version will,
because it names no referent. Its executable successor is `variantOf`, which does not yet
cover this entry's kind."*

Three things make `refused` the honest classification rather than a dodge:

1. **The category is legitimate and the repo already uses it.** `design/04` §5 says of
   trajectory families that *"'family' language above is a catalogue relation, not a runtime
   object."* A format may carry authored data that is documentation for the next author.
   The defect was never that `retryVariants` does nothing — it is that **its name promises a
   run modifier** ("retry variants" is precisely what the learner would call a replay
   setting) and nothing anywhere said otherwise.
2. **The refusal is machine-checked**, which is what the declared-vs-executable law demands
   of a declared value: `pack-check` emits a `runtimeWarning`
   `RETRY_VARIANTS_NOT_EXECUTABLE` at `/retryVariants/{i}` with the reason above and, where
   the entry's kind has a `variantOf` counterpart, that counterpart's name. This follows the
   shipped deprecation-warning pattern exactly — `PIECE_REACH_SCOPE_EVERY_DEPRECATED` and
   `PAWN_COUNT_DEPRECATED` in `apps/server/src/pack-validation.ts`, both landed by
   `predicate-wave-3` (0.18) with schema removal deferred for the same reason: **the
   declaration is in use and its successor is not ready.**
3. **`retired` carries a `removedAt` obligation** (§2) and this RFC cannot honestly fill it
   without designing the `variantOf` widening, which is Open question 4. Filing it as
   `retired` with an empty `removedAt` would launder an open question into a decision —
   the exact failure `engine-leverage` §6.2 added `unmeasured` to prevent.

**Warnings, not errors**, and deliberately: seven committed packs would go red on an error,
and this RFC has no authority to edit `content/`.

**On `segment_end` — the second half of D86's row, and it is not this defect.** The row
reads *"Also `segment_end` is used zero times."* Verified: **0 occurrences across all of
`content/`**. But `segment_end` is *fully executable* — `apps/server/src/pack-validation.ts`
gates it (`REASONING_SEGMENT_END_UNPROVEN`), `RunFeedbackPolicy` carries it
(`packages/runtime/src/types.ts:37`), `/capabilities` publishes it, and
`apps/server/src/drill-client-server.test.ts` has an end-to-end case
(*"segment_end stays closed at the first checkpoint and opens on segment completion"*).
**`segment_end` is a content gap, not a format defect**, and it belongs to no disposition in
this register — a construct that is reached by the runtime and unused by authors is the
*reach* failure `vocabulary-wiring` §2b already names, with a shipped remedy shape (author
one pack that uses it). It is called out here so that D86's row is not closed as if both
halves were the same finding. They are opposite findings that happen to share a row.

#### 3.4 The three rows that are already closed — and why they are the load-bearing evidence

**D39** — *"decimal `material_balance` equal-conditions are schema-valid but impossible"* —
**closed**. `MATERIAL_EQUALITY_UNSATISFIABLE` is live at
`apps/server/src/pack-validation.ts:472` with the message *"material balance is an integer
difference of piece values, so an equal comparison against N can never be true"*. Ledger row
flipped ✅.

**D40** — *"`winner` is accepted for `stalemate` and then ignored"* — **closed**.
`RULES_FACT_WINNER_UNSUPPORTED` at `apps/server/src/pack-validation.ts:475`, refusing
`winner` for every rules fact except checkmate. Ledger row flipped ✅.

Both were shipped by `validator-integrity` §8a/§8b **by applying the declared-vs-executable
law**, unamended, to a case its authors had not anticipated. That is the strongest available
argument that §1's answer is right: the law's most recent two uses were on defects nobody
had classified when it was written, and it needed nothing added.

**D59** — *"top-p can sample a `bestmove` outside the recorded candidate list"* — **closed in
code and, since this draft was written, closed in the ledger too.**
`OpponentSelector#humanCommon` now (a) requests
`Math.max(8, legalMoveCount(...))` MultiPV — `engine-request-contract` §10(a), the *state*
remedy; (b) retries once when `bestMove(...)` is absent from `candidateLines(...)`; and (c)
appends the played move to the recorded candidate list as
`{moveUci, rank: maxRank + 1, offWindow: true}` — §10(b), the *record* remedy. Landed in
`43c6c4a` (*"feat: close engine requests over instrument state"*), with the marker threaded
through `SelectionCandidate` (`packages/runtime/src/types.ts:69`), `humanConcessionMass`
(`packages/runtime/src/practical-difficulty.ts:36`), `pivotal.ts`, `rest.ts` and group
seeding. **The persisted selection no longer omits the move actually played.**

> **[cross-review] Stale, and stale in the direction that closes the loop.** The draft read
> *"The `design/BACKLOG.md` D59 row is still `💡 open`. This RFC does not flip it — it is
> `engine-request-contract`'s to flip under the completion protocol, and a second writer
> guessing at a summary line is how registers rot."* At `0fbf0ef` the row reads **`D59 ✅
> CLOSED in code 2026-08-15 by `43c6c4a` (`engine-request-contract`), ledger flipped
> 2026-08-15 after independent verification by claude — the row stood `open` for a day
> because the closing commit shipped the fix under the contract's *state* obligation without
> naming the row.`** The draft's refusal to flip it was right and its finding was acted on;
> what is now wrong is only the tense. **Four places asserted the stale status and all four
> are corrected** — here, §1d, §1e's D59 row, and acceptance criterion 13. This is worth
> saying rather than silently editing: an RFC that reports a ledger row's state is holding a
> snapshot, and *"a ledger row and the code disagreeing about what exists is this RFC's
> subject, one tier up"* applies to this RFC's own reporting of it. The residue below is
> unaffected — it is a property of the code, not of the row.

**One residue, named and not claimed.** `#humanCommon` computes
`width = min(requestedWidth, health.options.MultiPV.max)`. On an engine advertising a
MultiPV maximum below the position's legal-move count, the window narrows and off-window
sampling becomes possible again — silently, because nothing refuses or records the
narrowing. §10(b)'s marker still catches the *consequence*, so the record stays honest; only
the *cause* is invisible. That is a `bound` question about a published capability and it
belongs to `engine-leverage`'s dispositions register, not here. Open question 6.

#### 3.5 D57 — *"the vacuity gate can be skipped"* → **implement** (`record`, then refuse by name)

**Verified, and the mechanism is three lines.** In
`OpponentSelector#practicalResistance` (`apps/server/src/opponent-selector.ts`):

```ts
const measured = scored.filter((candidate) => candidate.ratio !== null);
if (measured.length === scored.length && measured.every((candidate) => candidate.ratio === 0)) {
  throw new ServerError("PRACTICAL_RESISTANCE_UNDECIDABLE", "No category-preserving reply leaves measured concession mass");
}
if (measured.length === 0) {
  console.warn("DEGRADED_POLICY_MASS: Maia candidate omitted policy mass; practical resistance uses the lexicographically first preserving reply");
}
const ordered = [...(measured.length === 0 ? scored : measured)].sort((left, right) =>
  (right.ratio ?? 0) - (left.ratio ?? 0) || left.move.uci.localeCompare(right.move.uci),
);
```

The conjunct `measured.length === scored.length` means **one unmeasured candidate disables
the vacuity refusal entirely**. A candidate is unmeasured when `humanConcessionMass` returns
`null`, which it does when every returned candidate is `offWindow` or any candidate omits
`mass` (`packages/runtime/src/practical-difficulty.ts:37`). With the gate skipped and the
surviving ratios all zero, the comparator's first term is `0` for every pair and selection
falls through to `left.move.uci.localeCompare(right.move.uci)`. The result is then handed to
`makeSelection(..., "practical_resistance", ...)`, so the run records
`policyModeApplied: "practical_resistance"` for a move chosen **alphabetically**.

Observed 20/20 on one root (`design/research/maia-policy-scalar-stability.md`).

**There are two doors, not one.** The ledger names the partial door
(`0 < measured.length < scored.length`). The total door (`measured.length === 0`) is also
open and is *worse*: it plays lexicographically over `scored`, records
`practical_resistance`, and its only trace is a `console.warn` that reaches no run record,
no client and no operator surface. **A `console.warn` is not a record.** Both are fixed
together; fixing one would leave the mode dishonest through the other, which is the exact
shape the cross-review guarded against and the row describes ("reappearing through a
different door").

**Disposition: `reached` — the mode stays, and is made to mean what it says.** Normative:

1. **Delete the `measured.length === scored.length` conjunct.** The vacuity refusal fires on
   the measured population: *if every measured candidate has `ratio === 0`, refuse.* An
   unmeasured candidate is an abstention (the module's own docstring: *"Missing policy mass
   is an abstention: rank weights are selection aids, not measurements"*) and an abstention
   must not silence a refusal about the candidates that did speak.
2. **A new typed refusal for the total door.** `PRACTICAL_RESISTANCE_UNMEASURED` (severity
   error, 422, `ServerErrorCode`), thrown when `measured.length === 0`, replacing the
   `console.warn`. Message: *"no candidate returned a measured policy mass; practical
   resistance cannot select"*. It joins the existing `practical_resistance` 422 family in
   the `rest.ts` mapping, next to `..._UNAVAILABLE`, `..._UNDECIDABLE`,
   `..._OUT_OF_RANGE` and `..._POLICY_MASS_INVALID`.
3. **Lexicographic tiebreak survives, scoped.** `localeCompare` stays as the determinism
   tiebreak between candidates with *equal non-zero* ratios — that is a legitimate stable
   sort and replay depends on it. What is removed is its ability to become the **primary**
   rule while wearing the mode's name.
4. **Nothing degrades silently.** After this change, every path out of
   `#practicalResistance` either selects on a measured concession ratio or throws a named
   422. There is no third path.

**Collision sweep.** `grep -rhoE '[A-Z_]{5,}' apps/server/src packages/schema/src
packages/runtime/src --include="*.ts" | sort -u` — none of
`PRACTICAL_RESISTANCE_UNMEASURED`, `RETRY_VARIANTS_NOT_EXECUTABLE`,
`LEG_POLICY_MODE_UNSUPPORTED`, `LEG_SHAPE_REF_UNLISTED` or `LEG_SHAPE_LIST_EMPTY` appears
anywhere in the tree, nor in `rfc/`, nor in `schemas/`. `[cross-review]` The two literals
this review adds — `LEG_POLICY_ELO_UNHONORED` and `LEG_TARGET_ELO_OUT_OF_RANGE` — are also
absent (note that the *existing* `TARGET_ELO_OUT_OF_RANGE` in `apps/server/src/engine-band.ts`
is a different code and the `LEG_` prefix is what keeps them apart; if the implementer would
rather reuse the existing code at a leg pointer than mint a second, that is a defensible
simplification and the criterion should be written to whichever is chosen). Re-run at
implementation time, since `engine-leverage` and `vocabulary-wiring` are both adding
literals concurrently.

**Why `implement` and not `refuse`.** `practical_resistance` is not a spare declaration: it
is the only shipped mode that models *human difficulty* rather than engine strength, it has
a published capability gate (`availableModes()` admits it only with Maia **and** a
tablebase), and `resistance-spectrum` shipped a migration for its applied record. Refusing
it would delete the product's answer to *"how hard is this for a person"*. What is wrong is
one conjunct.

**Run-schema impact: none.** `policyModeApplied` gains no member; two selections that
previously fell through now throw, and a throw writes no event.

### 4. Half two — needed, inexpressible, and on a deadline: **D96**

#### 4.1 What is missing, verified, with the ledger's numbers corrected

The ledger row, by title: **"Per-leg `shapes` and `opponentPolicy` are inexpressible, and
the row is UNDESTINATED."** Its status field reads *"💡 open, **needs an owner**"*, and its
body says it was *"recorded here so it is destinated rather than lost between waves, which
is the exact failure that RFC flags one section later."* **This RFC is the owner.**

`$defs/trajectoryLeg` in `schemas/drill_pack.schema.json` is exactly:

```json
{ "type": "object",
  "required": ["id", "objective"],
  "properties": {
    "id": { "$ref": "#/$defs/id" },
    "entryCheckpointId": { "$ref": "#/$defs/id" },
    "branchLengthTarget": { "type": "integer", "minimum": 2, "maximum": 40 },
    "objective": { "$ref": "#/$defs/objective" } },
  "additionalProperties": false }
```

mirrored at `packages/schema/src/drill-pack/types.ts:234`. `opponentPolicy` occurs in the
pack schema at three pointers, all root-scoped. A three-phase trajectory therefore gets
**one** resistance model for opening theory, middlegame plan and endgame technique alike.

**Two ledger/dossier numbers are corrected, both against this RFC's own case.**

- **"Ranked #1–2 of 14"** is imprecise. `design/research/authoring-vocabulary-completeness.md`
  ranks the per-leg gap **#2 of the five frictions that touch how a pack grades or
  explains**, drawn from a table of **28 rows** of which **14** are open-and-unclaimed. On
  the audit's *other* ranking — §5, "what would force a re-author, ordered by content
  invalidated" — the same item is **rank 7 of 7, the lowest blast radius of anything
  measured**. Both readings are in the audit and only one has been quoted. Stating the
  second is not a weakening: *it is the argument for landing it.* The change is purely
  additive and invalidates **zero** committed packs, so its schedule is set by content need
  and nothing else.
- **"Blocks four of six"** is right, and its derivation is not the one the audit gave.
  The audit says *"beyond the 3 authored"*; `vocabulary-wiring` §2c corrected that to
  **2 of 6 covered**, and this RFC re-derived it independently: `content/drafts/` holds
  three trajectory packs — `trajectory-qgd-exchange-minority` (launch entry 1),
  `trajectory-caro-advance-chain-bishops` (launch entry 5), and
  `trajectory-mate-bishop-knight`, an endgame-only B+N mate that **is not in the launch set
  at all** (`design/04-content-architecture.md` §5 lists QGD Exchange, Open Sicilian,
  Italian, KID, Caro Advance, Nimzo). So: **2 authored, 4 unauthored** — Open Sicilian,
  Italian, KID, Nimzo.

#### 4.2 The evidence that this is a real blockage, from the packs that exist

The two authored launch trajectories declare, at pack level:

```
trajectory-qgd-exchange-minority : { mode: human_common, targetElo: 1800, temperature: 0.8, topP: 0.92, seedMode: per_branch }
  leg 1 "opening"            objective follow_theory
  leg 2 "carlsbad-middlegame" objective execute_break
  leg 3 "rook-ending"        objective win
```

Leg 3 is a **rook-ending `win`** played against a **Maia model of an 1800 human**, because
the format offers no other option. Endgame technique drilled against a human-error model is
the one place where the product's own thesis says the resistance is wrong: the whole point
of a conversion drill is that the defence does not blunder. The same holds for
`trajectory-caro-advance-chain-bishops` (leg 3 `hold`, same policy).

**And the workaround is already visible in the schema.** `trajectory-qgd-exchange-minority`
declares `shapes: ["carlsbad", {shape: "rook-4v3-same-side", relation: "prospective"}]`. The
`prospective` relation exists (pack 0.18) *because* a pack-level shape list cannot say
"present in leg 3, absent in leg 1" — an author needing per-leg shapes reached for a
relation qualifier instead. That is the same substitution `vocabulary-wiring` §7 documents
for `variantOf`/`retryVariants`, on a second field, and it is what an inexpressible
construct looks like from the content side.

> **And it happened during drafting, in the working tree this draft was written against.**
> Both authored launch trajectories were modified-uncommitted as of drafting, and the diff in
> both was a single addition to the **pack-level** `shapes` array: `open-centre` added to
> `trajectory-qgd-exchange-minority`, `queenless-middlegame` added to
> `trajectory-caro-advance-chain-bishops`. Those are two of the three D44 orphan shapes the
> *third confirmation* below names. Someone is closing D44 by attaching a **middlegame**
> shape to the pack root of
> a trajectory whose first leg is an **opening**, because that is the only place the format
> lets it go. The claim "a pack-level shape list is the wrong granularity for a
> cross-phase pack" did not need a hypothetical: it is being demonstrated concurrently, by
> a different agent, for a different reason. *This is offered as observation, not criticism
> — the edit is correct given the format; the format is what is wrong.*
>
> **[cross-review] Both edits are now committed.** At `0fbf0ef`
> `trajectory-qgd-exchange-minority` carries `["carlsbad", "open-centre", {shape:
> "rook-4v3-same-side", relation: "prospective"}]` and
> `trajectory-caro-advance-chain-bishops` carries `["closed-centre-chain",
> "bishop-good-bad", "queenless-middlegame"]`. The observation is stronger for having
> landed, not weaker — it is no longer a working-tree accident, it is the shipped corpus —
> but the present tense above is now wrong and an implementer diffing for it will find
> nothing to diff.

**A third confirmation, from a different direction.** `vocabulary-wiring` §2c records that
three of the nine pack-unreferenced shapes in **D44** — `open-centre`,
`queenless-middlegame`, `doubled-c-pawns` — are precisely the named middlegames of three of
the four unauthored launch entries (Italian, Open Sicilian, Nimzo). D44 and D96 are the same
blockage seen from two ends.

#### 4.3 The specification

**Pack schema 0.25 adds two optional properties to `$defs/trajectoryLeg`:**

```json
"opponentPolicy": { "$ref": "#/$defs/legOpponentPolicy" },
"shapes": { "type": "array", "items": { "$ref": "#/$defs/shapeReference" } }
```

with a new `$defs/legOpponentPolicy`:

```json
{ "type": "object",
  "required": ["mode"],
  "properties": {
    "mode": { "enum": ["human_common", "strong_engine"] },
    "targetElo": { "type": "integer" } },
  "additionalProperties": false }
```

`$defs/shapeReference` is the existing pack-level `shapes` **item** schema — the
`oneOf: [{$ref: id}, {shape, relation: present|prospective}]` currently written inline at
`properties.shapes.items` — extracted to a `$def` and `$ref`d from both sites so the two
grammars cannot drift. The `$def` name is chosen to match the type the schema package
already exports for exactly this shape — `ShapeReference =
string | {shape, relation: "present" | "prospective"}` at
`packages/schema/src/drill-pack/types.ts:232`, normalized by `normalizeShapeReferences`
(`packages/schema/src/drill-pack/shape-references.ts`) — so the JSON Schema `$def` and the
TypeScript type finally carry one name for one grammar. This is the one-writable-location
discipline `defect-sweep` §1d
established for `checkpoints[].actions`, and it is the reason the extraction is in scope
rather than a copy-paste: `predicate-wave-2` already shipped a *duplicated* shape grammar
once (shape-entry schema 0.1 → 0.2, *"the same duplicated grammar"*), and doing it a second
time in the same document would be a choice. The leg array carries `uniqueItems: true` like
the pack-level one but **not** `minItems: 1` — an empty leg list is meaningless and is
refused with `LEG_SHAPE_LIST_EMPTY` rather than tolerated as a no-op, since a silently inert
declaration is this RFC's subject.

**`$defs/legOpponentPolicy` is a narrowing of `$defs/opponentPolicy`, and the narrowing is
the specification.** The pack-level def carries seven `mode` values, `targetElo`,
`temperature`, `topP`, `stockfishGuardCp` and `seedMode`. The leg-level def carries two
modes and `targetElo`. Note that the pack-level `mode` enum is seven wide while
`RUN_OPPONENT_MODES` is five (`packages/runtime/src/types.ts:38`) — `plan_defense` and
`human_external` are *declared, refused, and published* with reasons in
`DECLARED_UNIMPLEMENTED_POLICY_MODES`. **That gap is the declared-vs-executable law working
correctly, and it is the pattern §4.3's refusals copy.**

> **[cross-review] `targetElo`'s JSON Schema is unbounded at both levels, and that is
> correct — but it is not sufficient.** `$defs/opponentPolicy.targetElo` is bare
> `{"type": "integer"}` today, so the leg-level def introduces no drift and needs no
> `minimum`/`maximum`: the admissible band is a **deployment** property (`engineBandProfile`
> reads it off the live engine handshake), not a document one, and freezing numbers into the
> schema would be the wrong instrument. The two constraints the narrowing was missing are
> therefore validator-level, not schema-level, and are added to the refusal table above:
> `LEG_POLICY_ELO_UNHONORED` (the `strong_engine` pairing, which no engine can record) and
> `LEG_TARGET_ELO_OUT_OF_RANGE` (the band check, moved from selection time to load time so
> it cannot land at ply 30). Both are checked where `UNSUPPORTED_OPPONENT_POLICY` already
> is, from the same published capabilities.

**Semantics.**

- **Inheritance.** A leg with no `opponentPolicy` inherits the pack-level policy unchanged.
  A leg with one **replaces** it for that leg's plies — it does not merge, because a partial
  merge would let a leg inherit a `topP` tuned for a different mode.
- **Shapes are additive.** `pack.shapes` remains the pack's shape set for validation and
  progress aggregation; `legs[i].shapes` names the subset expected **within that leg**.
  A leg shape must appear in `pack.shapes` (`LEG_SHAPE_REF_UNLISTED`) — same rule
  `SHAPE_PLAN_REF_UNLISTED` already applies to `planClasses[].shapePlan`.
- **Leg resolution.** The leg in force at a node is `legIndexAt(pack, run, nodeId)`
  (`packages/runtime/src/trajectory.ts:104`), already exported from
  `@chess-tabiya/runtime` (`index.ts:115`) and already consumed by
  `apps/server/src/pack-orchestrator.ts` to swap **grading rules** per leg. Per-leg
  resistance uses the *same* function at the *same* granularity. Nothing new is derived.

**Three refusals, each with its reason — and the refusals are the interesting part.**

| Refused per-leg | Code | Reason |
|---|---|---|
| `perfect_tablebase`, `practical_resistance` — **only on a pack whose root exceeds seven pieces** `[cross-review]` | `LEG_POLICY_MODE_UNSUPPORTED` | Both carry a **piece-count precondition**. `pack-validation.ts:877,880` checks them with `countFenPieces(pack.start.fen) > 7` — the *opening* root. When the root is **above** seven, a later leg's entry position is produced by played moves and may descend into range at a ply no static check can name, so a static check would refuse correct packs and a skipped check would 422 mid-run; that direction stays refused. When the root is **at or below** seven the precondition is statically decidable and the refusal is dropped — see the correction below |
| per-leg `targetElo` alongside `mode: "strong_engine"` `[cross-review]` | `LEG_POLICY_ELO_UNHONORED` | `appliedTargetElo` returns `undefined` whenever `health.identity.eloHonored !== true` (`apps/server/src/engine-band.ts:72`), and the shipped predicate naming the modes that honour a band — `policyUsesMaiaBand` (`engine-band.ts`) — admits `human_common`, `theory_strict` and `practical_resistance` and **not** `strong_engine`. A leg declaring `{mode: "strong_engine", targetElo: N}` is accepted by the schema, dropped by the engine, and never reaches `eloApplied`. That is a declared-and-unexecuted value in the RFC that exists to abolish them, and weakening Stockfish to honour it is rejected doctrine (`AGENTS.md` §Rejected). Refuse the pair at load |
| per-leg `targetElo` outside the deployment's published band `[cross-review]` | `LEG_TARGET_ELO_OUT_OF_RANGE` | `appliedTargetElo` throws `TARGET_ELO_OUT_OF_RANGE` / `TARGET_ELO_REQUIRED` **at selection time**, and `pack-validation.ts` contains **zero** `targetElo` checks today (verified: `grep -n targetElo apps/server/src/pack-validation.ts` is empty). At pack level that surfaces on ply 1. Per-leg it surfaces at leg entry — mid-run — which is the exact failure this table refuses two modes to avoid. The band is a *deployment* property already in the validator's hand (it is how `UNSUPPORTED_OPPONENT_POLICY` is gated), so this one is checkable at load and must be |
| `theory_strict` | `LEG_POLICY_MODE_UNSUPPORTED` | Off-spine by construction on any leg after the first, and its off-spine behaviour is *"degrades to `human_common` by name"* — an open ledgered friction (`opponent-selector.ts`, audit friction #9). Admitting it per-leg would ship a second instance of the defect this RFC exists to kill, in the RFC that kills it |
| `temperature`, `topP`, `stockfishGuardCp` | schema `additionalProperties: false` | **Not recorded per selection.** `policyModeApplied` records the mode and `SelectionEngineIdentity.eloApplied`/`eloHonored` record the Elo (migration 19), but nothing in the run record distinguishes a ply played at `topP 0.92` from one at `0.99`. Admitting a per-leg value the record cannot tell apart would create a *record* violation in the same document that applies the *record* obligation to D57. **This is the constraint that keeps §4.4's no-run-schema claim true, not a convenience** |
| `seedMode` | schema `additionalProperties: false` | Branch-seed derivation is a property of the *run*, not of a phase within it; a leg that reseeded would break replay determinism across a leg boundary. No attested want |

**The pack-level default is unrestricted.** Only *overrides* are narrowed. So
`{pack: perfect_tablebase, legs[0]: {mode: human_common, targetElo: 1500}}` is valid — the
B+N mate drilled against a weaker defender while walking to the edge, perfect once the
technique starts — and that is `trajectory-mate-bishop-knight`'s attested want.

**The restriction costs the launch set nothing, and this was checked rather than assumed.**
Leg 3 of the QGD trajectory is far outside the 7-piece tablebase: the pack's own authored
grading note says *"**Fourteen** units are on the board at leg entry, so no tablebase applies
anywhere in this leg"* (`content/drafts/trajectory-qgd-exchange-minority.json`), and it is
declared as heading for the `rook-4v3-same-side` shape, which `design/04` §5 puts at eleven —
*"Syzygy grounds run terminals via material reduction, not pack roots — the 4v3 family is
eleven pieces."* The Caro trajectory's leg 3 says *"Eighteen units are on the board at leg
entry"*. What those legs need is `strong_engine`, which has no positional precondition and
is admitted.

> **[cross-review] Two defects here, and the second is the load-bearing one.**
>
> **(a) The number was wrong, and wrong in the way this RFC exists to catch.** The draft
> read *"Leg 3 of the QGD trajectory is a **4v3 rook ending — eleven pieces**"*. Eleven is
> the piece count of the **shape the leg is heading for**; the leg's **entry** position is
> **fourteen**, by the pack's own note. The pack declares that shape as
> `{shape: "rook-4v3-same-side", relation: "prospective"}` — *prospective*, i.e. not yet on
> the board — which §4.2 quotes two paragraphs earlier for a different purpose. Checking a
> per-leg precondition against a position the leg has not reached is precisely the error the
> refusal is meant to prevent, committed in the sentence justifying the refusal. Both
> numbers clear seven, so **the conclusion survives and the reasoning did not**.
>
> **(b) The decidability claim is false in the direction that matters, and it is false on a
> committed pack.** *"A leg's entry position is produced by played moves and is not
> statically known"* is true in general and irrelevant in one direction: **piece count is
> monotonically non-increasing under legal play** — captures reduce it, promotion leaves it
> unchanged, nothing raises it. So `countFenPieces(pack.start.fen) <= 7` **entails** that
> every position reachable from that root, at every leg, is also at or below seven. The
> precondition `pack-validation.ts:877,880` checks is exactly `> 7`, so for a root already
> in range the static check is not merely possible — it is sound by construction, with no
> position-time probe and no authored fallback.
>
> `content/drafts/trajectory-mate-bishop-knight.json` is a **committed three-leg trajectory
> pack** whose root is `8/8/4k3/8/4K3/2BN4/8/8` — **four pieces** — declaring pack-level
> `{mode: "perfect_tablebase"}`. Every leg of it is inside tablebase range and provably so.
> The draft's own worked example one paragraph below is *that pack*, and the sentence **"The
> refused modes are refused for the cases that could not have used them" is therefore
> false**: that pack could have used them, soundly, at every leg. It costs nothing *today*
> only because inheritance happens to cover its attested want (override leg 0 down to
> `human_common`, inherit `perfect_tablebase` for legs 1–2) — which is a different reason
> than the one given, and a reason that stops holding the moment an author wants the
> opposite arrangement.
>
> **Corrected specification.** The refusal is narrowed to the undecidable direction: per-leg
> `perfect_tablebase` and `practical_resistance` are refused with `LEG_POLICY_MODE_UNSUPPORTED`
> when `countFenPieces(pack.start.fen) > 7`, and admitted otherwise. The admitting arm reuses
> the *same* call at the *same* site the pack-level check already uses, so it adds one
> condition and no new instrument. Open question 3 is rewritten to hold only what is left
> genuinely open: the root-above-seven case that descends into range mid-run.
>
> **This is a specification change made by a reviewer and it is the author's to ratify.**
> It widens what packs may say. The narrower alternative — keep the blanket refusal and
> replace only the false justification with the true one (*inheritance covers the single
> attested want*) — is defensible and is the fallback if the author declines the widening.
> What is **not** defensible is the draft as written, because it refuses a construct on a
> ground that a four-piece committed pack disproves.

#### 4.4 Why this needs no run-schema version and no migration

`validator-integrity` §5 declined this work partly because *"moving them is a run-schema
conversation (the persisted `requested` policy becomes a lie for legs 2+)"*. That conclusion
was right for the general form and is avoidable in the narrowed one. The six sites it named,
re-verified by symbol:

| Site (symbol) | Effect of §4.3 |
|---|---|
| `run.started` payload / `createRun` (`packages/runtime/src/runtime.ts`, `opponentPolicy: input.session.opponentPolicy`) | **Unchanged.** `RunOpponentPolicy` keeps its shape; the run still records the policy it was created with |
| `resistanceOnPath` (`packages/runtime/src/replay.ts:103`) | `requested` stays the **run-level** request and is therefore not a lie — it is exactly what it says. `applied` is already derived per ply from `policyModeApplied` and already reports a mixed run correctly. **Additive:** an optional `requestedByLeg?: readonly {legId, legIndex, policy, plyCount}[]`, populated only when a `pack` is passed. `PathResistance` is a **derived projection, never persisted** — the same reasoning that kept run schema at 0.8 for shape firings under migration 10 |
| `Service#selectionRequest` (`apps/server/src/service.ts`) | The hinge, and it is already shaped for this: its signature is `(run, nodeId, pack, mode, seed)` — **all three arguments `legIndexAt(pack, run, nodeId)` needs are already in hand.** It resolves the leg policy and overlays `mode`/`targetElo` |
| Selection reuse in `groupReply` (`apps/server/src/service.ts`, `compatibleAppliedMode(mode, move.policyModeApplied)`) | Must compare against the **leg's** mode, not `stored.run.opponentPolicy.mode`. A group whose members cross a leg boundary would otherwise reuse a leg-1 `human_common` selection under a leg-3 `strong_engine` request. One-line change at a site the RFC names, and an acceptance test |
| `distillRun` (`apps/server/src/distill.ts`) | Copies the **run-level** policy into a derived pack. Unchanged — a distilled pack is not a trajectory |
| Human-split / corpus reads (`apps/server/src/rest.ts`, `access.run.opponentPolicy`) | The human-split panel renders "the distribution a 1800 human faces here". On a leg with an override it should render the leg's Elo. Named, changed, and asserted |

**The record stays honest without a schema change** precisely because §4.3 admits only
`mode` and `targetElo` — the two fields the selection record already distinguishes. That is
not a coincidence in the design; it is the design's constraint, chosen so that the *record*
obligation is satisfied by construction rather than by a new event type.

> **[cross-review] The no-run-schema claim was attacked directly and it holds — after one
> repair.** Method: enumerate every field of the persisted selection record and ask which of
> them a per-leg override can move. `OpponentSelection` is exactly
> `{moveUci, policyModeApplied, candidates?, engine}` and `SelectionEngineIdentity` is
> `{id, name, version, modelId?, containerDigest?, seedHonored, eloHonored?, eloApplied?}`
> (`packages/runtime/src/types.ts:73-89`). `#selectionRequest` builds the request from
> `mode` (passed in) plus `run.opponentPolicy`'s `targetElo`/`temperature`/`topP` plus the
> pack's `spine` (`apps/server/src/service.ts:1796-1818`). Under `additionalProperties:
> false` on `$defs/legOpponentPolicy`, the only two values a leg can move are `mode` and
> `targetElo`, and the only two record fields that can move with them are
> `policyModeApplied` and `engine.eloApplied`. `run.opponentPolicy` is untouched, so
> `resistanceOnPath`'s `requested` is not made a lie, and `PathResistance` is derived rather
> than persisted (`packages/runtime/src/replay.ts`) so `requestedByLeg` needs nothing.
> **No third field is reachable. The claim is true.**
>
> **The repair.** The claim was true of `mode` unconditionally and of `targetElo` only
> *conditionally*, and the draft did not say so. `eloApplied` is written only when
> `appliedTargetElo` returns a value, and it returns `undefined` whenever the engine does not
> honour a band — so `{mode: "strong_engine", targetElo: N}` was an admissible leg override
> whose second field could **never** reach the record. That is not a run-schema problem; it
> is a declared-and-unexecuted value, this RFC's own subject, minted by this RFC. §4.3's new
> `LEG_POLICY_ELO_UNHONORED` closes it, and with it closed the constraint is exact rather
> than nearly-exact: **every admissible per-leg value lands in a field the record already
> carries.**
>
> One consequence worth stating because a reader will find it: `sameEngine`
> (`apps/server/src/service.ts:233-240`) compares `id`, `name`, `version`, `modelId`,
> `containerDigest` and `seedHonored` — and **not** `eloApplied`. So two legs that differ
> only in `targetElo` are `sameEngine`-equal. Criterion 5 asserts group reuse against
> `compatibleAppliedMode`, which catches a **mode** straddle; it does not catch an **Elo**
> straddle, and as drafted nothing does. Criterion 5 is corrected to assert both.

**Shapes need nothing persisted.** Shape firings are derived projections
(`shapeFirings(triggers, branchPath(...))`, consumed at `Service.progress` and in
`DrillScreen.svelte`); the pack-schema register recorded exactly this for 0.10 and 0.11
(*"No migration: rung-0 facts are never persisted"*).

**So: pack 0.25, no `DRILL_RUN_SCHEMA_VERSION` change, no migration number.** The pack
`$id` moves `0.24 → 0.25`; pack digests are content digests and are unaffected by the `$id`
(`packages/schema/src/drill-pack/digest.ts`), so **no committed pack digest moves.** All
existing packs validate unchanged — the two new properties are optional and every current
leg omits them.

#### 4.5 The trust posture, stated rather than smuggled

On the **main play path** the opponent's policy is built **in the browser**:
`SessionController#selectionRequest` (`apps/web/src/lib/session-controller.ts`) reads
`pack.opponentPolicy`, constructs `{mode, targetElo, temperature, topP}`, and posts it to
`POST /select-move`, which accepts it verbatim (`apps/server/src/rest.ts`, overlaying only
`spine` from the pack). The server's `Service#selectionRequest` is used by the **group**
paths, not by the ordinary opponent reply.

Two consequences, both stated because a reader will otherwise find them and assume they were
missed:

1. **Per-leg resolution must land on both paths.** The client resolves the leg with
   `legIndexAt`, which `@chess-tabiya/runtime` already exports and which
   `apps/web/src/lib/` already imports siblings of (`historyFrom`). Fixing only the server
   would fix groups and leave every ordinary trajectory reply at the pack-level policy —
   a silent partial implementation, which is this RFC's subject.
2. **This introduces no new trust hole.** A client can already choose any policy it likes
   for any position; per-leg adds no capability it did not have. It also does not *close*
   that hole, and pretending a per-leg field is server-enforced would be worse than saying
   so. Making the opponent policy server-authoritative is Open question 5 and a genuinely
   larger change.

> **[cross-review] Verified, and criterion 3's test is a real gate — but it names a private
> method.** `DrillSessionController#selectionRequest`
> (`apps/web/src/lib/session-controller.ts:511-537`) does read `pack?.opponentPolicy ?? run.
> opponentPolicy`, does construct `{mode, policyConfigDigest, targetElo?, temperature?,
> topP?}`, and is the only builder on the ordinary reply path (`:500`,
> `this.#api.selectMove(this.#selectionRequest())`); the server's is reached only from
> `groupReply` and group seeding (`service.ts:833`, `:958`). §4.5's claim is correct as
> written. **Would criterion 3's second test fail against a server-only landing? Yes** — a
> server-only fix leaves `selectorMode(pack, capabilities)` (`session-controller.ts:137-158`)
> reading `pack.opponentPolicy.mode` with no leg in sight, so the request posted at a leg-3
> node still carries the pack-level mode and the assertion fails. It is a gate, not theatre.
> Two precision fixes: `#selectionRequest` is **private** and cannot be called by a test, so
> the criterion must assert on the `SelectMoveRequest` observed at the `DrillClientApi.
> selectMove` boundary; and the digests diverge across the two builders
> (`packDigest ?? sessionDigest` on the client, `run.sessionDigest` on the server), which is
> pre-existing and out of scope but will surprise whoever writes the test.
>
> **One hole the split opens that §4.5 does not name.** `selectorMode` **silently falls
> back**: a mode the deployment cannot select becomes `human_common`, or
> `capabilities.policyModes[0]`, with no refusal and no record of the substitution. §4.3
> refuses per-leg `theory_strict` on exactly this ground — *"its off-spine behaviour is
> degrades to `human_common` by name"* — while admitting per-leg `strong_engine`, which
> degrades the same way through this function on any deployment without a search engine. It
> is worse per-leg than pack-level: `compatibleAppliedMode` (`service.ts:242-248`) has an arm
> for `theory_strict → human_common` and **none** for `strong_engine → human_common`, so a
> degraded leg-3 selection also stops matching for group reuse. **Normative addition:**
> per-leg mode resolution refuses rather than falls back — a leg naming a mode absent from
> `capabilities.policyModes` fails at pack load with `LEG_POLICY_MODE_UNSUPPORTED`, the same
> code and the same gate `UNSUPPORTED_OPPONENT_POLICY` already uses at pack level. A leg is
> authored; a fallback that rewrites it by name is the defect this RFC is named after.

### 5. Register claims — stated loudly

| Resource | Claim | Note |
|---|---|---|
| **Pack schema 0.25** | **CLAIMED — and registered** `[cross-review]` | 0.23 is `engine-leverage`'s, 0.24 is `vocabulary-wiring`'s, **0.19 is frozen shut** (the constant passed it — `validator-integrity` §5's recommendation to claim 0.19 for this successor is therefore **void**, and this RFC records that so a reader of the archived text does not act on it). Lands behind both predecessors; both are additive `$defs` plus an `$id` bump, so the rebase cost if either slips is one string |
| **Run schema** | **none** | §4.4, and the cross-review's field-by-field verification of it. `engine-leverage` holds 0.16 |
| **Migration number** | **none** | Nothing persisted changes shape |
| **Shape-entry schema** | **none** | — |
| `rfc/README.md` | **already carries the row** `[cross-review]` | Registered by commit `f07a320` (*"rfc: accept three cross-reviewed drafts; register format-surface"*), not by this draft |

> **[cross-review] Three claims in this table had gone stale under the draft, and the
> shipped state is more favourable than the draft assumed.**
>
> - *"`rfc/README.md` records «0.25 is the next free pack lane»"* — it no longer does. At
>   `0fbf0ef` the register carries a **0.25 row naming this RFC** (`rfc/README.md`) and
>   records **0.27** as the next free lane, with 0.26 provisionally `claim-backing`'s. The
>   lane is not merely free, it is held.
> - *"`rfc/README.md` — not edited by this draft"* — still true of *this draft*, and no
>   longer the operative fact: the row was written by the coordinator in `f07a320`, and its
>   text matches the one drafted here. `rfc/README.md` is single-writer and is **not touched
>   by this cross-review** either. The pasteable row is retained below only as the record of
>   what was proposed.
> - *"The pack `$id` moves `0.24 → 0.25`"* (§4.4) — conditional, not factual. At `0fbf0ef`
>   `DRILL_PACK_SCHEMA_VERSION` is `"0.22"` and the `$id` reads
>   `urn:chess-tabiya:schema:drill-pack:0.22`; 0.23 and 0.24 are **claimed and unimplemented**.
>   The bump is `0.22 → 0.25` if this lands first and `0.24 → 0.25` if both predecessors land
>   first. Nothing in this RFC depends on which — the `$id` is one string and pack digests are
>   content digests — but an implementer reading *"moves 0.24 → 0.25"* against a tree reading
>   `0.22` would stop, and stopping on a stale premise is the cost the moving-tree rule at the
>   top of this document exists to avoid.

Register row as proposed (now landed in `rfc/README.md` by `f07a320`, quoted here for the
record):

> `| 0.25 | format-surface.md | claimed 2026-08-15 — per-leg opponentPolicy and shapes on $defs/trajectoryLeg (D96); $defs/legOpponentPolicy; $defs/shapeReference extracted; retryVariants deprecation warning. No run-schema change, no migration |`

### 6. Cross-draft coordination

**`client-surface-floor.md` — a real collision, with a resolution.** Its acceptance criterion
8(b) requires a test asserting `permittedAssistance` returns *"`sight` rather than `evidence`
for `boardLighting` **and `arrows`**"* for `participant` and `spectator`, and that test is
committed at `apps/web/src/lib/client-surface-floor.test.ts:47` `[cross-review]` — the draft
read `:46`, which is the **`boardLighting`** assertion one line above; the `arrows`
assertion is `:47`, in a file that is itself modified-uncommitted, so an implementer should
match on the `expect` text rather than the line. §3.1 deletes the field the assertion names.

The criterion's stated *purpose* is *"C6b did not collaterally remove the role plumbing it
shares with the permission path"*, and both fields are derived from the **same**
`mayRequestSplit` binding — `role === "solo" || role === "host"`, defined at
`packages/runtime/src/assistance.ts:28` and consumed by both fields on `:29`, which is the
`:28-29` span `client-surface-floor` 8(b) itself cites. `boardLighting` alone therefore
proves exactly what the criterion set out to prove.

**Resolution:** `client-surface-floor` is `implementing` and older; it lands first,
unchanged. This RFC lands after and, in the same commit that removes `arrows`, amends
criterion 8(b) to name `boardLighting` alone and drops the one `expect`. **This RFC does not
edit that file while it is in flight** — the amendment is proposed here for the coordinator,
per the register's own convention that a draft which cannot land behind its predecessor
renegotiates rather than acting unilaterally.

**`engine-leverage.md`** — §2's register publishes `formatDispositions` on `/capabilities`
next to that RFC's `capabilityDispositions`. Two additive fields on one payload, no shared
key. The *pattern* is borrowed and cited; no code is shared, so there is no landing-order
constraint beyond the pack-lane order.

**`vocabulary-wiring.md`** — §2c excluded D96 on the spine test and its Open question 9 asks
for a destination. **This RFC is that destination**, and it accepts the exclusion's reasoning
without reopening it: the per-leg gap is a construct the format *cannot express*, which is
why it does not belong in an RFC about constructs the format permits and fails to honour.
Two facts that draft recorded "so the future RFC inherits them" are inherited above (§4.1's
2-of-6 correction, §4.2's D44 convergence) rather than rediscovered.

**`teacher-surface.md`, `live-surface-honesty.md`, `feedback-delivery.md`,
`fixture-realism.md`, `live-marker-quality.md`** — no shared resource. `feedback-delivery`
owns the claim-delivery cluster (D77/D79); §3.3's `segment_end` note touches its territory
descriptively and proposes nothing.

## Deviations from design

**None.**

Three points where this RFC comes close enough to the design tier that silence would be
wrong:

1. **`design/05-in-run-experience.md`'s assistance ladder loses a rung** when `arrows` is
   retired. The design doc describes the ladder's *shape*; `arrows` was never one of its
   named rungs, and removing an axis that renders nothing changes what the learner
   experiences by zero. Per law 5 this RFC proposes and does not write; if the owner reads
   the ladder as promising a directed-mark rung, §3.1's disposition flips from `retired` to
   `unmeasured` pending a directed structural primitive, and that is an owner call, not
   this draft's.
2. **`design/04-content-architecture.md` §5 is *enabled*, not amended.** §4 makes the
   six-entry launch set authorable; it changes no entry and adds none.
3. **`design/BACKLOG.md` rows are not flipped by this draft.** They flip on landing, per
   the completion protocol — with a log entry in the same commit.

## Acceptance criteria

1. **Pack schema 0.25 validates the corpus unchanged.** `DRILL_PACK_SCHEMA_VERSION` and the
   `$id` read `0.25`; every positive document validates and every negative one still fails.
   **Counts are re-derived at landing, not copied from this draft** — the corpus moves, and
   an acceptance criterion that hard-codes a stale count fails for the wrong reason. Its
   size at drafting time, re-derived first-hand and recorded so a reviewer can see the
   direction of travel: **43** pack documents in `content/drafts/` (files with both `start`
   and `objective`; the directory holds 139 `.json` files once `.evidence`/`.sources`/
   `.job`/`.browser` sidecars are counted), **36** `content/candidates/*/pack.json`,
   `schemas/drill_pack.example.json`, and `schemas/fixtures/drill-pack/` holding **10**
   files — **9** `*.invalid.json` plus one `.browser.json`.
   > `validator-integrity` §5 pinned this corpus at *"41 drafts … 8 fixtures … all seven
   > `*.invalid.json`"* on 2026-08-15. Three of those four numbers have already moved. The
   > criterion is therefore written as an invariant ("every positive validates, every
   > negative fails") with the counts as context, which is what it should have been.

   **No committed pack digest moves** (asserted by re-computing every digest before and
   after and diffing).
2. **A per-leg fixture exercises the thing.** A new positive fixture declares
   `legs[2].opponentPolicy = {mode: "strong_engine"}` and `legs[2].shapes` over a
   three-leg trajectory and passes; a new `*.invalid.json` fixture declares
   `legs[1].opponentPolicy.mode = "perfect_tablebase"` and fails with
   `LEG_POLICY_MODE_UNSUPPORTED` at pointer `/legs/1/opponentPolicy/mode`; a third declares
   `legs[0].shapes: ["not-in-pack-shapes"]` and fails with `LEG_SHAPE_REF_UNLISTED`.
   `[cross-review]` The negative tablebase fixture must have a root **above seven pieces**,
   since §4.3's corrected refusal is conditioned on that; a companion **positive** fixture
   declares `legs[1].opponentPolicy.mode = "perfect_tablebase"` on a root at or below seven
   (the shape of `content/drafts/trajectory-mate-bishop-knight.json`, whose root is four)
   and **passes** — without that pair the narrowing is untested in the direction it widens.
   Two further negatives: `legs[2].opponentPolicy = {mode: "strong_engine", targetElo: 2400}`
   fails with `LEG_POLICY_ELO_UNHONORED`, and a leg `targetElo` outside the fixture
   deployment's published band fails at **load** with `LEG_TARGET_ELO_OUT_OF_RANGE` rather
   than at selection.
3. **Per-leg resistance is honoured on both paths, and the test proves the *both*.** An
   end-to-end server test drives a three-leg trajectory whose leg 3 overrides to
   `strong_engine` and asserts the leg-3 opponent plies record
   `policyModeApplied: "strong_engine"` while leg-1 plies record `human_common`. A second
   test asserts the **client** posts the leg's mode: it observes the `SelectMoveRequest`
   handed to `DrillClientApi.selectMove` at a leg-3 node and asserts `policy.mode ===
   "strong_engine"` — *this test must be shown failing against a
   server-only implementation*, since a server-only fix is the plausible partial landing.
   `[cross-review]` The draft named `SessionController#selectionRequest`, which is
   **private** (`#`-prefixed) and unreachable from a test; the assertion has to sit at the
   API boundary. Confirmed the test **is** a gate: against a server-only landing the client
   still calls `selectorMode(pack, capabilities)` on `pack.opponentPolicy.mode` and posts
   `human_common` at leg 3, so the assertion fails. A third test asserts a leg naming a mode
   the deployment cannot select is **refused at pack load** rather than silently rewritten
   by `selectorMode`'s fallback (§4.5).
4. **`resistanceOnPath` reports the split.** For that run,
   `requested` is the pack-level policy, `applied` contains both modes with correct ply
   counts, and `requestedByLeg` has one entry per leg with the resolved policy. Called
   without a pack, the function returns the identical value it returns today (a pinned
   snapshot proves the back-compatibility).
5. **Group reuse respects the leg, in both fields.** A group whose members straddle a leg
   boundary does not reuse a selection recorded under the other leg's mode — asserted
   directly against `compatibleAppliedMode` — **and does not reuse one recorded under the
   other leg's `targetElo`.** `[cross-review]` The second half was missing and nothing else
   covers it: `sameEngine` (`apps/server/src/service.ts:233-240`) compares id, name, version,
   `modelId`, `containerDigest` and `seedHonored` and **not** `eloApplied`, so two legs
   differing only in Elo are `sameEngine`-equal and `compatibleAppliedMode`-equal, and the
   reuse path at `:949` accepts the straddle. Assert the Elo straddle is refused as well.
6. **D57: both doors are shut, and the *record* is the assertion.** With a stub Maia
   returning candidates that all carry `mass` and all resolve to `ratio === 0` **except one
   candidate with no `mass`**, `#practicalResistance` throws
   `PRACTICAL_RESISTANCE_UNDECIDABLE` (today it returns the alphabetically first move). With
   a stub returning **no** measured candidate, it throws
   `PRACTICAL_RESISTANCE_UNMEASURED` 422 (today it `console.warn`s and plays). A third case
   with unequal non-zero ratios selects the highest and is byte-identical to today's
   selection, proving the tiebreak survives. **Both refusal cases are recorded as
   *absence*:** the run's event log contains no `opponent.move_selected` for the refused
   ply, so no move is ever recorded under a mode that did not choose it.
7. **D84: the axis is gone, root and branch.** `arrows` appears **zero** times across
   `apps/`, `packages/`, and `schemas/` (excluding `dist/`), asserted by a test. A
   localStorage record at `version: 4` carrying `arrows` upgrades to `version: 5` without
   it and without discarding the other eight axes; the v3/v2/v1 arms upgrade straight to 5.
   `AssistanceSettings.svelte` renders eight axes.
8. **D85: the code is gone and cannot half-return.** `SIMULATE_BUDGET_EXCEEDED` appears zero
   times outside `FORMAT_DISPOSITIONS`; the `rest.ts` 422 arm is removed; `/simulate` still
   refuses an over-shape request with `SIMULATE_TOO_LARGE` 422 (regression).
9. **D86: the warning fires exactly where the field is used.** `make pack-check` over the
   **7** authored packs carrying `retryVariants` emits `RETRY_VARIANTS_NOT_EXECUTABLE`
   **9** times — once per entry — at pointer `/retryVariants/{i}`, each naming its
   `variantOf` counterpart where one exists (**2** of the 9: both `opposite_side` entries)
   and saying "no counterpart yet" for the other **7** (five `different_material_details`,
   two `related_position_same_idea`). Validating `schemas/drill_pack.example.json` as well
   brings the total to **11** over **8** documents, and adds the two kinds authored content
   never uses (`same_root_new_defense`, `alternate_plan_class`), both of which **do** have
   counterparts. **Every one is a `warning`; no pack changes verdict**, and each count is
   asserted exactly, not as `> 0`, so a later content edit that silently drops entries fails
   the test rather than the corpus.
   > **[cross-review] As drafted this criterion could not pass.** It asserted
   > `RETRY_VARIANTS_NOT_EXECUTABLE` **11** times over *"the **7** authored packs"*. The 7
   > authored packs carry **9** entries; the remaining 2 of the 11 live in
   > `schemas/drill_pack.example.json`, which is not an authored pack. 7-and-11 cannot both
   > be right, and a criterion asserting an exact count against the wrong population fails
   > for the wrong reason — the failure mode criterion 1 was rewritten to avoid, reappearing
   > four criteria later. Re-derived at `0fbf0ef`: 8 documents, 7 of them authored packs, 11
   > entries, 9 of them authored. The counterpart split was also wrong: the draft assigned
   > "no counterpart yet" to `different_material_details` and `related_position_same_idea`,
   > which is right, but that is **7** of the authored 9, not the residue of 11.
10. **The register is real and its gate is not vacuous.** `FORMAT_DISPOSITIONS` contains a
    row for every item §3 and §4 decide, plus the two seed rows **derived from**
    `DECLARED_UNIMPLEMENTED_POLICY_MODES` rather than transcribed. `/capabilities` publishes
    it. The gate test is **demonstrated failing** four ways on deliberately broken inputs:
    a register row pointing at a pointer absent from the schema; a row whose `value` is not
    a member of the enum at its pointer; a `reached` row naming a module that does not export
    its symbol; and — **the anti-vacuity case** — `FORMAT_DISPOSITIONS` with the
    `plan_defense` row deleted, which must fail because corrected clause 6 derives the floor
    from the live constant. **An empty register must fail. A register missing any
    declared-and-unimplemented policy mode must fail. A register whose seed reason has
    drifted from the constant's string must fail.**
    > **[cross-review] The draft's third case was the vacuous one.** It demonstrated the
    > gate failing on *"an empty schema walk"* — a state the committed
    > `schemas/drill_pack.schema.json` cannot produce, so the demonstration requires feeding
    > the test a synthetic empty schema and proves only that the assertion is wired, never
    > that the system can reach the condition. The reachable degenerate state is an empty or
    > shrinking **register**, which every clause as drafted passed. See §2's correction.
11. **No behaviour change where none is claimed.** A recorded fixture run of a
    non-trajectory pack replays byte-identically; `resistanceOnPath` and `compare`
    snapshots for existing runs are unchanged.
12. **Collision sweep re-run at implementation time.** `PRACTICAL_RESISTANCE_UNMEASURED`,
    `LEG_POLICY_MODE_UNSUPPORTED`, `LEG_SHAPE_REF_UNLISTED`, `LEG_SHAPE_LIST_EMPTY`,
    `RETRY_VARIANTS_NOT_EXECUTABLE`, `LEG_POLICY_ELO_UNHONORED` and
    `LEG_TARGET_ELO_OUT_OF_RANGE` `[cross-review]` are each absent from `apps/`, `packages/`,
    `schemas/` and `rfc/` at the moment of landing — re-run, not trusted from this draft,
    because two sibling RFCs are adding literals concurrently.
13. **Ledger and log.** `design/BACKLOG.md` rows D84, D85, D86, D57 and D96 flip with
    one-line summaries; a dated entry lands in `planning/exploration/log.md` — both in the
    landing commit, per the completion protocol. `[cross-review]` Two corrections: the pack
    register row is **already in `rfc/README.md`** (commit `f07a320`), so the landing commit
    updates that row's status rather than adding it; and the **D59** row **has already been
    flipped ✅** by its owner (§3.4), so nothing is owed to the coordinator there. Also flip
    the new dangling-referent row §3.3 ledgered, if this RFC's `RETRY_VARIANTS_NOT_EXECUTABLE`
    warning is judged to discharge it — it does **not**, since the warning fires on the field
    and not on the unresolvable name inside the note, so that row stays open by default and
    the landing commit must say which.

## Open questions

1. **How is the register's *completeness* measured?** §2's gate proves no row is stale; it
   proves nothing about rows that were never written. The honest instrument is a census —
   `make expression-census` (`rfc/archive/expression-census.md`, `Makefile`) already answers *"where does
   this expression fire?"* for one vocabulary. Extending it to *"which schema pointers have
   no consumer?"* is the natural successor and is deliberately **not** claimed here, because
   this RFC would then be two RFCs. **Recommended owner: a follow-up that extends the census
   tool.** Until then the register's completeness is exactly as good as the last hand-audit,
   which is the state this RFC found and only partly improves. Stating that is the point.
2. **Does `design/05`'s assistance ladder promise a directed-mark rung?** If yes, §3.1's
   disposition is `unmeasured` (pending a directed structural primitive), not `retired`.
   **Owner ruling wanted**; this draft may not read intent into a design doc (law 5). The
   recommendation is `retired`, on the ground that the `evidence` rung is refused by
   `engine-leverage` §6.3 under law 8 and a `sight` rung has no primitive.
3. **Should per-leg `perfect_tablebase` / `practical_resistance` be admitted on a pack whose
   root is *above* seven pieces and descends into range mid-run?** `[cross-review] Rewritten
   — as drafted this question was too wide, because §4.3 refused both directions and only
   one of them is open.* The root-at-or-below-seven direction is **no longer open and no
   longer refused**: piece count never increases under legal play, so the existing
   `countFenPieces(pack.start.fen) <= 7` check is sound for every leg of such a pack, and
   §4.3 now admits it. What remains genuinely undecidable is the descending case: a
   trajectory that opens above seven and reaches a tablebase-exact ending at a ply no static
   check can name. That needs a position-time probe **and** an authored fallback so the drill
   does not die at ply 30, which is a design question with no attestation. The launch set
   does not need it — the QGD ending enters at fourteen units and the Caro's at eighteen.
   **Deferred pending one authored pack that wants it** — the repo's own attestation bar,
   and the pattern `engine-leverage` used for `searchmoves`.
4. **What does `variantOf` need to become a superset of `retryVariants`?** Measured in §3.3:
   it must become an **array**, and it needs relations covering
   `different_material_details` (5 entries) and `related_position_same_idea` (2). Only then
   can D86's row move from `refused` to `retired` with a real `removedAt`. This bears on
   `vocabulary-wiring`'s territory (`variantOf`'s zero adoption is its §7 subject) and is
   offered to that RFC's author rather than claimed. **Unowned as of this draft, and named
   so it is not lost between waves** — the failure D96's own row was created to prevent.
5. **Should the opponent policy be server-authoritative?** §4.5 shows the main play path
   trusts the browser. Per-leg neither creates nor closes this. It is a security and
   record-integrity question, it touches five call sites, and it is nobody's. **Needs a
   ledger row and an owner.** `[cross-review]` Two of its components now have rows, filed by
   this review rather than left to the question: **D107** (`selectorMode` silently rewrites
   an authored mode in the browser, with no record and no `compatibleAppliedMode` arm) and
   **D109** (the two `SelectMoveRequest` builders stamp different `policyConfigDigest`
   values for the same run). Neither is the whole question — the authority question is still
   unowned — but *"needs a ledger row"* is discharged for the two concrete defects found
   while verifying §4.5, per law 4.
6. **What happens when an engine's advertised MultiPV maximum is below the position's legal
   move count?** §3.4's residue: the window narrows silently, `offWindow` catches the
   consequence but nothing records the cause. This is a `bound` question about a published
   capability and belongs in `engine-leverage`'s dispositions register. Offered, not claimed.
7. **Does `formatDispositions` belong on `/capabilities` at all?** A pack format is a
   property of the *schema version*, not of the *deployment* — unlike policy modes, which
   genuinely vary by which engines a host runs. The counter-argument, and the reason §2
   publishes it anyway: a client that must decide whether to render a field needs one place
   to ask, and `/capabilities` is that place today. **Resolvable before `accepted`;** if the
   answer is no, the register still ships and only its publication site moves.

## Changelog

- 2026-08-15: created. Wave 3. Claims pack schema **0.25**; no run-schema version, no
  migration. Applies the **declared-vs-executable law** (unamended) and the
  **engine-request contract's *record* obligation** rather than minting a third law, and
  shows the test. Borrows `engine-leverage` §6.2's disposition register and enumeration
  gate one layer down, to format declarations. Dispositions: **D84 retire**, **D85 retire**,
  **D86 refused** (with a measured two-step path to `retired`), **D57 implement**, **D96
  implement**. Reports **D39/D40 already closed** by `validator-integrity` and **D59 already
  closed in code** by `engine-request-contract` with its ledger row unflipped. Corrects
  three published figures: D96's *"#1–2 of 14"* (it is #2 of five within 14 unclaimed, and
  rank 7 of 7 by re-author cost); *"blocks four of six"* (right, but derived from 2-of-6
  covered, not 3-and-3); and `retryVariants`' prose-stand-in count (11 of 11 entries name a
  pack id, not 2 or 6 — **`[cross-review]` this third correction was itself wrong: it is
  8 of 11, see §3.3**). Voids `validator-integrity` §5's recommendation to claim pack 0.19,
  which is frozen shut.
- 2026-08-15: **adversarial cross-review**, by a reader who did not write the draft, at
  `0fbf0ef`. Every count and file:line citation re-derived first-hand. **Held:** the corpus
  counts (43/139/36/10/9), the `retryVariants` document/entry/kind tallies and the 4-of-11
  `variantOf` coverage, the D57 code quote verbatim, `#selectionRequest`'s signature,
  `legIndexAt`'s signature and export, 14 of 15 spot-checked line cites, and — attacked
  field-by-field against `OpponentSelection` and `SelectionEngineIdentity` — **the
  no-run-schema, no-migration claim**. **Broke and fixed in place:** §2's anti-vacuity clause
  guarded a quantity the committed schema makes constant (the D61 shape) while an empty
  register passed every clause — floor now derived from
  `DECLARED_UNIMPLEMENTED_POLICY_MODES`; §2's row key could not address its own two seed rows
  (both are enum *values* at one pointer) and its gate rejected its own `assistance:`/`error:`
  rows — `value?` added, namespaces declared; §3.3's *"11 of 11 entries name a real pack id"*
  is **8 of 11**, and `different_material_details` has **five** entries, not four (the
  disposition survives on the array gap, not on unanimity); §3.1's `corpus` and
  `boardLighting` axis counts were wrong (8 and 3, not 5 and 5); §4.3's *"eleven pieces"* is
  the leg's **prospective** shape, not its entry position (**fourteen**, per the pack's own
  note); **§4.3's decidability argument is false** in the direction that matters — piece count
  never increases, so a root at or below seven decides every leg, and
  `trajectory-mate-bishop-knight` is a committed four-piece three-leg trajectory the blanket
  refusal was over-broad on; §4.3 admitted, unguarded, the mid-run 422 it refused two modes to
  avoid (`targetElo` → `TARGET_ELO_OUT_OF_RANGE`) and admitted `targetElo` beside
  `strong_engine`, which no engine can record; §4.5's `selectorMode` silently falls back to
  `human_common` per-leg with no `compatibleAppliedMode` arm; §5's register claims and §3.4's
  D59-is-open claim had both gone stale under the draft; **acceptance criterion 9 asserted 11
  warnings over 7 packs that carry 9**, so it could not have passed. Three of these are
  specification changes (§4.3's narrowing, the two `LEG_*_ELO_*` refusals, §4.5's
  refuse-don't-fall-back) and are the **author's to ratify**.
