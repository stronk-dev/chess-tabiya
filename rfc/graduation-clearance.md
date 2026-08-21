# RFC: Graduation clearance — how a blocker stops blocking

- **Status:** **accepted 2026-08-17 by the register owner; status token reconciled 2026-08-20.**
  **[author round 3, 2026-08-17]** D503 is closed, and it is closed as an
  **instance of a class rather than as six entries**: three of the six mechanical kinds join to their
  evidence through a **pointer grammar the shipped code enforces**, and this RFC stated that grammar
  for exactly one of them (§1.2b, kind B). §1.2c now states it for all six, and the six D503 blockers
  become **F `unbuilt`** because `shape_firing` can no longer be written on a pack with no `shapes`
  reference. **The round's larger finding is worse than D503 and was found by running the predicate
  rather than reading it:** for the **16** remaining rule-6 entries the D predicate — *"the named shape
  entry's trigger fires on at least one of this pack's positions"* — **already holds today, at 2 to 24
  firings each** `[V]`, so the migration as specified would have demoted all sixteen on
  `make graduation-clear`'s first run and **refuted acceptance criterion 3 on `philidor-passive-rook-convert`**
  (`transitions` would be 2, not 1). §2.5's non-vacuity rule is the fix and it is general.
  **Two premises this RFC was built on are refuted at HEAD by work that landed after round 2** and are
  corrected in place: owner ruling **D502** ships all 56 drafts to learners on the `community` channel
  (§0.1 — `.dockerignore` no longer excludes `content/drafts` and `PackRegistry.loadDefault` no longer
  gates them on `development`), and **D468 is closed by packaging** — `apps/server/Dockerfile:32–33`
  copies `planning/exploration/log.md` and `docs/tablebase-grounding.md` into the image — which
  **reverses half of §3.2c's ruling** (§3.2c-r). The `git blame` arm still cannot run in the image and
  the two-rule split survives on that half alone. Every count in §5.1a/§5.1b/§5.2 was re-derived by
  running the published ruleset at HEAD; **D 24 → 18, F 32 → 38, clearable 179 → 173, unclearable
  41 → 47, and the 27/23 pack split → 28/22**, while **43 machine-producible unaided**, **101
  authored-prose-plus-a-source** and **0 of 50 packs graduating on instrument runs alone** do not move.
  The preceding acceptance record is retained below as history.
  **accepted 2026-08-16 by claude as register owner, on a named test — the second
  author round was right not to self-accept, and this records who accepted and on what.**
  The round declined to re-declare acceptance because *"the same mistake made twice is worse
  than the delay"*, which was correct: the first acceptance was granted on the wrong test.
  **The test now applied and passed is BUILDABILITY** — every obligation resolving to a named
  symbol, command or home, verified by the round itself at (a) and (e). It is **not** *"the open
  questions are closed"*, which is the test that failed here ([[D473]]). **If the implementer
  finds an obligation that does not resolve, return it again — the return loop is the check, and
  it has already worked once on this document.** Second author round complete, answering the
  implementation review that returned this RFC at `8c389f0`.** All four contract blockers are now specified at a
  named symbol: **D464** by a required `clearance.recordKind` drawn from the shipped `EVIDENCE_KINDS`
  enum plus the `supports`-pointer rule that decides it (§1.2b); **D465** by an eighth clearance kind
  `referent_removed`, admissible on `resolved` only, after measuring that the affected population is
  **1 of 30**, not "some" (§2.2a); **D466** by a named writer — `make graduation-clear` /
  `clearGraduationEntries` — with its transition document, digest obligation and report-exclusion
  change stated (§6.5); **D467** by **splitting one rule into two honest ones**, because the
  authoring-time check and the runtime check cannot be the same rule and the RFC now says so at the
  Dockerfile line (§3.2c). **The acceptance the implementer returned was premature and this round
  does not re-declare it:** four things the implementer needed were unspecified, and closing open
  questions is not the same as being buildable. **This round also found that D467's defect already
  ships** — `GRADUATION_RULING_UNCITED` resolves `planning/` and `docs/` paths against `process.cwd()`
  inside `validatePackDocument`, and neither directory exists in the production image, so the code the
  RFC was leaning on as precedent is itself an authoring-time check stranded at runtime (§3.2c,
  reported as a new ledger row). The preceding
  author-round record is retained below as history: author round complete, cross-review corrections landed, and
  **all four author-call open questions closed in this document** (1, 2, 3, 7); question 5 stays
  deliberately deferred to the first content wave with its follow-up recorded. **No owner ruling is
  owed.** Question 1's cheap answer is taken *and* fenced: accepting six browser fixtures as
  `out_of_scope` is correct-in-kind and **fixes nothing about the corpus denominators**, which
  remain owned by the open [[D227]] and [[D257]] — every number in this RFC still counts them. The
  cross-review
  returned this with four blocking corrections; all four are landed and the **acceptance gate — open
  question 4's twelve-entry residue — is closed by publishing the classifier ruleset (§5.1) and
  enumerating the residue it actually produces (§5.1b).** The published ruleset finds **17 residue
  entries, not 12**, and every count in this RFC is now the output of a ruleset a second party can
  re-run rather than an unpublished hand audit. Four things the author round changed, each against
  its own draft: the **residue is 17 and is majority `unreachable` only because five of it are
  browser fixtures** (§5.1a); the **three tightenings proposed to close the acceptance back door do
  not close it, and one of them is unpayable by the honest case** — the closing check is a
  **line-level `git blame`**, not a file-level one (§3.2a); the **two absent lint codes are handed
  back to `pack-graduation`'s ledger row rather than adopted here**, and the third absent thing (the
  emitter template registry) **is adopted, because criterion 7 cannot land without it** (§6.2, §6.3);
  and the **mechanical-clearance accounting is restated so the corpus class is priced once**
  (§4.2). The 0.28 lane is kept and re-verified (§7)
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-16
- **Cross-review:** 2026-08-16 by a second agent; every figure re-derived at HEAD rather than
  re-read. Corrections are marked **[cross-review]** in place
- **Author round:** 2026-08-16, answering the cross-review. Marked **[author round]** in place. Its
  own figures are re-derived a third time at a tree that had moved again — `STORAGE_VERSION` is
  **23** and `DRILL_RUN_SCHEMA_VERSION` is **0.17** as of this round (§7)
- **Author round 3:** 2026-08-17, answering [[D503]]. Marked **[author round 3]** in place. Measured at
  HEAD `68098e5`, which is **five commits** past round 2's `6722130`; two of the five
  (`3524b8e` fixture exclusion, and the D468/D502 packaging work) **move premises this document
  argued from**, and both are corrected rather than noted. Register re-verified a fifth time: pack
  **0.27** (`packages/schema/src/index.ts:2`), run **0.17** (`:1`), shape-entry **0.3** (`:3`, and
  `schemas/shape_entry.schema.json`'s `$id` `urn:chess-tabiya:schema:shape-entry:0.3`),
  `STORAGE_VERSION` **23** (`apps/server/src/storage.ts:407`), `rfc/README.md:79` records **0.28
  claimed and held by this RFC** and `:80` records **0.29 next free** `[V]`
- **Design refs:** `design/03-product-breadth.md` B6 (Create → validated fixture, publication
  channels); `design/04-content-architecture.md` §2d/§7 (the grounding obligations the blocker
  entries record); `design/02-product-shape.md` §Deployment axis (hosted multi-user, settled
  2026-08-12) — which is what makes an empty production catalogue a defect rather than a curiosity
- **Exploration gate:** the breadth gates are complete (`planning/exploration/gates.md` §Breadth
  gates — *"B1–B11 all green, content era open"*). Opened by `design/BACKLOG.md` row **D138**, as
  sharpened 2026-08-16 by running `make graduation-report`: *"the corpus is authored, the mechanism
  exists, and the bridge between them is undefined — so this is not a content backlog, it is a
  missing clearance vocabulary."*
- **Depends on:** nothing unlanded. `rfc/archive/pack-graduation.md` (pack **0.27**, implemented
  2026-08-16) and `rfc/archive/claim-backing.md` (pack **0.26**, `claimBindings`) are both landed
  prerequisites.
- **Parent / amends:** **completes `rfc/archive/pack-graduation.md`.** That RFC shipped the state
  machine, the gate predicate, the report and the migration, and shipped `clearedBy` as *"optional,
  free text"* (§1). This RFC gives `clearedBy` a grammar and makes it required.
  **[author round 2] *"It amends nothing that RFC decided"* is withdrawn as of §3.2c, and RFC-0000
  rule 3 requires saying so rather than letting it stand.** This RFC now **changes implemented
  behaviour** that `pack-graduation` shipped: `GRADUATION_RULING_UNCITED`'s resolution and
  date-containment arms move out of `validatePackDocument` into the graduation sweep, and
  `GRADUATION_CLEAREDBY_UNRESOLVED` is withdrawn with the field it guards. Both changes are the
  follow-up this RFC already is — it declares `pack-graduation` as its parent — and neither touches
  the archived document, which stays immutable. **The reason for the change is [[D468]]: those arms
  resolve `planning/` and `docs/` against `process.cwd()` inside a validator that ships in an image
  containing neither.**
- **Supersedes / superseded by:** —
- **Planning:** `planning/graduation-clearance/` (once implementing)

## Implementation review — 2026-08-16, and where each blocker is now answered

The RFC did not survive implementation review. These are contract questions, not coding details,
so no implementation was started. **Each is answered in the section named beside it; the review's own
words are kept verbatim so a later reader can check the answer against the question rather than
against a paraphrase of it.**

1. `clearance.kind: "ledger_record"` says it verifies a **named evidence-record kind**, but the
   proposed object carries only `kind`, `subject`, and `instrument`. It cannot distinguish an
   `engine_eval` obligation from an `explorer_position_census` obligation.
   → **[[D464]] answered in §1.2b.** `recordKind` is added, closed over the shipped seven-value
   `EVIDENCE_KINDS` (`apps/server/src/sourcing/types.ts:57`), and the deciding predicate is stated as
   a `kind` + `supports` match over the pack's ledger. The measurement that makes it decidable also
   **moves the B/C boundary**, and §1.2b states that rather than leaving it to Stage A.
2. Stage B requires every one of the 30 historical `resolved` entries to gain a clearance with a
   currently resolvable `subject`. Several resolutions describe removed nodes or lines; the RFC
   supplies no honest encoding for a historical subject that no longer exists.
   → **[[D465]] answered in §2.2a, and the premise is corrected by measurement rather than argued
   with.** All 30 were walked: **29 name a subject that resolves today, 1 does not** — "several" is
   one entry. That one is **not reclassified away**; the grammar gains `referent_removed`, whose
   predicate is *the named ids are absent*, which is a standing predicate exactly as §2.1 requires
   and which correctly re-opens if a deleted line comes back.
3. Criterion 3 requires four blocking entries to become resolved automatically, but the named
   checker returns issues and has no mutation output or transition owner. Which command writes the
   state transition, and what it writes, is unspecified.
   → **[[D466]] answered in §6.5.** `checkSourcingFile` stays a pure reporter; a new
   `clearGraduationEntries` (`make graduation-clear`) owns the transition, modelled on the shipped
   `verifyDraft` writer, and its output shape, its digest obligation and the one-line
   `graduation-report.ts` change its sidecar forces are all named.
4. `GRADUATION_RULING_SELF_MINTED` is assigned to `validatePackDocument`, while the production
   server image contains neither `.git` nor a Git executable/history. The RFC must place that check
   on a build/promotion path that actually has its evidence, or specify how runtime validation can
   perform it without silently weakening official versus community admission.
   → **[[D467]] answered in §3.2c, and the honest answer is that they cannot be one rule.**
   **[author round 3] Half of that answer is now reversed by §3.2c-r**, because `apps/server/Dockerfile`
   changed under it. The
   authoring-time rule is an *admission* rule and needs a Git checkout; the runtime rule is a *shape*
   rule and can only read the document. They are specified as two codes with two homes and two
   different guarantees. The section also reports that **this defect is already shipped one code
   earlier**, which is why "move the check" would not have been a complete answer. **[author round 3]
   That shipped defect is [[D468]] and it is now ✅ closed** — fixed by packaging, not by moving code,
   which is why §3.2c-r exists.

5. **[author round 3 — the third return]** `graduation-clearance` cannot encode its own `shape_firing`
   migration. Its literal classifier assigns six current blockers to `shape_firing` while those packs
   carry no `shapes` reference at all. *"The schema requires `clearance.subject` to resolve now, and
   the transition writer can evaluate only a named shape entry, so there is no honest subject the
   implementer can write. Pointing at the blocker prose resolves syntactically but makes the predicate
   unevaluable; pointing at `/shapes/0` is truthful but does not resolve."*
   → **[[D503]] answered in §1.2c, §2.5 and §5.1a, and it is answered as a class.** The six are
   reproduced exactly (`anti-scandinavian-white`, `mate-bishop-knight`, `mate-k-q-technique`,
   `mate-k-r-technique`, `mate-two-bishops`, `scandinavian-mainline-black`) `[V]`, and they are
   **`unbuilt`**, which is what their own statements say (*"an entry needs commissioning"*, *"a shape
   entry is hereby commissioned"*). The fix is not a re-keying: **§1.2c publishes the subject grammar
   for every kind**, because the same defect is latent in A, C and D alike — `assessmentGrounding`
   reads one fixed node and ignores `subject` entirely, and `validateClaimBindings` refuses any pointer
   but `^/feedbackClaims/\d+/text$`. And **§2.5 closes the hole D503 was standing next to**: running
   the D predicate over the 16 packs that *do* carry a `shapes` reference shows it **already holds on
   every one of them**.

**[author round 3] The general form of all five returns, now that there are five.** D464 was a missing
field; D465 a missing grammar; D466 a missing writer; D467 a missing home; **D503 a missing *join*.**
Four of the five are answered by the same question — *"what does this predicate actually read, and from
where"* — and [[D473]]'s cheap guard (*"for every acceptance criterion, name the function that makes it
true and the environment that function runs in"*) catches the first four and **misses D503**, because
`runExpressionCensus` is a named function in a named environment and the criterion still could not be
satisfied. **The guard this round adds is one clause longer: name the function, the environment, and
the pointer the function joins on.**
   authoring-time rule is an *admission* rule and needs a Git checkout; the runtime rule is a *shape*
   rule and can only read the document. They are specified as two codes with two homes and two
   different guarantees. The section also reports that **this defect is already shipped one code
   earlier**, which is why "move the check" would not have been a complete answer.

```tabiya-claims
pack-schema | lane 0.28 | $defs/graduationEntry.clearance (new, closed object); .resolved.clearance (new, required); .accepted.unreachableBecause (new, required); clearedBy (withdrawn, with its oneOf arm)
```

## Summary

`make graduation-report` reads **documents 56, blocking 220, resolved 30, accepted 43** over
`content/drafts/` and ends **"Graduable drafts and packs: (none)"** `[V]`. Zero of fifty authored
packs can reach `content/packs/`, and `content/packs/` is the only root a production image contains.
The reason is uniform and is one line of the report: **every blocking entry ends `clears via
(unspecified)`**, because `clearedBy` is an optional free-text string and **0 of 293 entries in
`content/drafts/` and 0 of 143 in `content/candidates/` carry one** `[V]`. There is no vocabulary
for *how* a blocker clears, so no entry can ever move from `blocking` to `resolved` or `accepted`
by any route a machine can check.

This RFC specifies that vocabulary as a required **`clearance`** object on every `blocking` entry:
a closed `kind`, a JSON pointer naming what the entry is a claim *about*, and — for the mechanical
kinds — the exact shipped predicate that decides it. It then draws the line the whole gate rests
on: **`resolved` is a standing predicate a checker re-evaluates on every run; `accepted` is a
citation to a decision recorded elsewhere. Neither is ever an author's sentence about their own
pack.** That distinction is not hypothetical repair — it has already collapsed. **All 30 `resolved`
entries in the corpus carry one byte-identical `resolved.by`**: *"The recorded work was completed;
the original statement remains as history."* `[V]` The state that is supposed to mean *the
condition is gone and is checkable* currently carries a migration placeholder and nothing else.

Measured: **4 entries clear today with no new work** (three mates packs and
`philidor-passive-rook-convert` each say *"The Syzygy root assessment is declared but not
ledger-verified; no sourcing sidecars were produced"* while carrying 25–27 `tablebase_result`
records and passing `sourcing-check` at **strict**) `[V]`; **173 of the 220 blocking entries name a
predicate a checker can re-evaluate** and become machine-decidable; and **all 50 authored packs
carry at least one blocker no instrument run can clear today** — **28 of them carry a blocker no
instrument in this repository can ever clear**, and the remaining **22** wait on chess judgement a
human must author and law 8 forbids manufacturing. This RFC says so with a number rather than
implying a backlog.

**[author round] Every count in the sentence above is now the output of a published, re-runnable
ruleset (§5.1), and three of them moved when the ruleset was written down.** The draft's
*"108 of 220"*, *"47 of 50"* and *"23 / 24"* came from a hand audit whose ruleset §1.2 claimed was
*"stated in §5.1"* and which §5.1 did not state — the cross-review's single largest process finding.
Re-derived from the literal ruleset: **179 clearable / 41 unclearable**, **27 packs instrument-bound
/ 23 authoring-bound** — **[author round 3] and re-derived once more after [[D503]]: 173 / 47 and 28 / 22**, and the mechanical sub-total that a machine can produce **unaided** is
**43**, not 108 (§4.2). The direction of every argument below is unchanged and two of the three
numbers moved *against* this RFC's convenience, which is the only direction a correction of one's
own figures is worth trusting.

**[cross-review] And the number is worse than the draft's, in the direction the draft was already
arguing for.** The draft named three packs — `anti-french-advance-white`, `kid-classical-black`,
`leningrad-dutch-black` — that "graduate on instrument runs alone". Re-derived entry by entry
against the shipped instruments, **none of the three does** (§5.2): each carries at least one
blocker resting on an `author_principle`/`hypothesis` claim, and `attachExplorerEvidence` refuses
to write pack prose (`ATTACH_SPAN_REQUIRED`) and refuses to run at all on a pack whose
`provenance.sources` lacks the explorer rationale line (`ATTACH_SOURCE_LINE_MISSING`) — which **all
three lack** `[V]`. So the honest headline is **0 of 50 packs graduate on instrument runs alone,
50 of 50 need new authoring**, and the graduable set stays `(none)` through this RFC's landing.
That does not weaken the case for the vocabulary; it is the case for it. A vocabulary whose first
run prints an unchanged `(none)` while making **173** entries individually decidable is doing
exactly the job §5.2 says it is: *making the distance measurable rather than shortening it.*
**[author round]** The refutation survives the published ruleset and is strengthened by it: under
§5.1's literal rules, **zero of the 50 authored packs are blocked only by kinds A and B(engine)**,
which is the only combination an instrument run clears without a human writing something first
`[V]`. Five packs are blocked only by A, B and D — and all five carry a B(corpus) or D entry whose
precondition is authored prose or a commissioned shape entry (§4.2), which is why the number is 0
and not 5.

## Motivation

### §0.1 The measurement, reproduced

Run at HEAD, not re-read:

```
## content/drafts
documents: 56; legacy: 0; blocking: 220; resolved: 30; accepted: 43
## content/candidates
documents: 36; legacy: 0; blocking: 143; resolved: 0; accepted: 0
## content/packs
documents: 0; legacy: 0; blocking: 0; resolved: 0; accepted: 0
## Graduable drafts and packs
(none)
```

`[V]`, reproduced at HEAD `68098e5` **[author round 3]** — the four counts are byte-stable across
three rounds. `content/packs/` holds only `.gitkeep` `[V]`.

**[author round 3] The sentence that stood here is refuted at HEAD and the refutation is an owner
ruling, not a drift.** It read: *"`PackRegistry.loadDefault` builds `productionPaths` as
`[schemas/drill_pack.example.json, ...jsonFiles(content/packs/)]` and loads `content/drafts/` only
when `options.development === true`; `.dockerignore` excludes `content/drafts` and
`tools/verify-packaging.mjs` asserts it does … So the graduable set being empty is identically the
statement that **nothing this product has authored can reach a non-development registry**."* Every
clause of it is now false, and each was made false deliberately by **[[D502]]** (*"OWNER RULING
2026-08-16 — the corpus reaches learners through BOTH channels: a disclosed draft channel now, and a
graduated shelf as packs earn it"*):

| clause | at HEAD |
|---|---|
| `productionPaths` includes `schemas/drill_pack.example.json` | **no** — `productionPaths = await jsonFiles(contentDirectory)` over `content/packs/` alone (`pack-registry.ts:337`) `[V]` |
| drafts load only in development | **no** — `draftPaths` is unconditional and the `development` flag now gates only `draftFile`/`draftFiles` and `replaceDuplicates` (`:334`, `:337–347`, `:362`) `[V]` |
| `.dockerignore` excludes `content/drafts` | **no** — its seven lines are `.git`, `.cache`, `node_modules`, `**/dist`, `test-results`, `playwright-report`, `tools/maia-harness/out` `[V]` |
| `verify-packaging.mjs` asserts the exclusion | **it asserts the opposite** — *"Production image context must include disclosed draft packs"* (`tools/verify-packaging.mjs:85–87`) `[V]` |

**This strengthens the RFC and narrows what it may claim, and both halves must be said.** Every one of
the 56 draft documents is now loaded at boot and served with `channel: "community"`
(`pack-registry.ts:357`) `[V]`, so *"nothing this product has authored reaches a learner"* is no longer
true and this RFC must stop arguing from it. What is still exactly true is the half D502 left open:
**`content/packs/` — the `official` channel — is empty, and graduation is the only route into it.**
D502's own text names this RFC's job in its second clause (*"promote packs onto the official shelf as
clearance lands"*), so the motivation moves from *reach a learner at all* to *earn the shelf that is
not badged unreviewed*, which is a narrower and better-grounded claim than the one it replaces.

**And it makes two things in this document load-bearing that were background.** First, **every draft is
now validated at boot**, so `GRADUATION_RULING_UNCITED` fires against all 40 acceptance-carrying
documents on every production start — which is exactly [[D468]], and is why that row is a boot failure
rather than a curiosity, and why it had to be fixed before this RFC could land (§3.2c-r). Second,
§2.3b's community-channel bound is about `PackStudio.register` → `addCommunity` and **is not the route
the corpus takes**: corpus drafts arrive through `fromDocuments` **with their real ledgers and
manifests** `[V]`, so their evidence is genuine and only their blocker lists are unpoliced. The bound
stated in §2.3b holds for the route it names and must not be read as covering this one.

**[cross-review] Corpus-size reconciliation, because four cited ledger rows quote the old figures
and a reader will otherwise think one of us is wrong.** **D138** and **D162** say *"47 authored
packs"*; **D227** says *"53 pack documents"*; this RFC says **50** and **56**. Both are right at
their own dates: three drafts landed between them (`closed-centre-chain-black-base-strike`,
`london-wedge-black-counterplay`, `open-centre-french-exchange-black`), so 47 + 3 = 50 and
53 + 3 = 56 `[V]`. The 50 is no longer a quoted convention: `runExpressionCensus` computes it as
`evidence.totals.packs` and the six browser fixtures as `corpus.fixturePacks` `[V]` — which is precisely
what **D257** asked for (*"the corpus figure the whole project quotes … is computed by no code, so
no test can ever assert it"*). **This RFC's counts are the computed ones and supersede the quoted
ones**; every figure below is a run at HEAD.

**[author round 3] D227 and D257 are now ✅ closed, and the closure changes which denominator moved and
which did not — this is the question the third return asked and the answer is "one of two".** `3524b8e`
(*"fix(catalogue): exclude browser fixtures from discovery"*) added an exported predicate
`isPackDocumentName` (`pack-registry.ts:185`) that excludes `*.browser.json`, and `jsonFiles` calls it
at `:172` `[V]`. So:

- **The catalogue denominator moved: 56 → 50.** `PackRegistry.loadDefault` indexes 50 documents, not 56.
- **The graduation denominator did not move: it is still 56.** `graduation-report.ts:8` filters on its
  own inline `!/\.(?:evidence|job|sources)\.json$/u` and **does not call `isPackDocumentName`** `[V]`, so
  `make graduation-report` still reads 56 documents / 220 blocking / 30 resolved / 43 accepted —
  reproduced at HEAD `[V]`. **Every denominator in this RFC is a graduation denominator and none of
  them moves.** The one figure that was always 50 — `evidence.totals.packs` — is still 50 `[V]`.
- **What the closure does change is open question 1's premise.** That question offered *"accept the five
  fixtures as `out_of_scope`"* against *"move all six out of `content/drafts/`, which is what D227 and
  D257 actually ask for"*. Both rows are closed **without the move**, by a predicate, so the alternative
  the question deferred no longer has an owner waiting for it. The recommendation is unchanged and its
  reason is now stronger: Stage C accepts the five, and nothing in this RFC depends on the fixtures
  leaving.
- **It also leaves a small live defect this RFC should not inherit silently.** There are now **two**
  pack-discovery predicates that disagree — the exported `isPackDocumentName` and
  `graduation-report.ts:8`'s literal — and D227's whole finding was that one uncomputed convention had
  been applied in prose by every reader. Reported at §Ledger rows rather than fixed here, because
  changing `graduation-report.ts`'s denominator would move every number in this document in the same
  commit that lands it.

Every one of the 220 blocking lines the report prints ends the same way:

```
  - **no-engine-validation-pass-has-been-run-on-any-position-i** — No engine validation pass
    has been run on any position in this pack.; clears via (unspecified)
```

That suffix is `graduation-report.ts:39` — `` `clears via ${entry.clearedBy ?? "(unspecified)"}` ``
`[V]`. It is not a rendering defect. Counted directly over the corpus: **0 of 293
`graduationBlockers` entries under `content/drafts/` carry a `clearedBy` key at all**, and the same
holds for all 143 under `content/candidates/` `[V]`. The field exists, is printed, and is empty
everywhere.

### §0.2 `pack-graduation` specified the slot and declined to specify its grammar — deliberately, and this is the half it left

**This RFC does not correct `pack-graduation`, and the check that matters is that it did not
descope this.** That RFC's §0.3 scopes out *"(a) doing any of the grounding work the blockers
record — this RFC makes the debt legible and countable, it does not pay it"*. Paying debt is out of
scope here too (§0.3). But **specifying what payment looks like is not paying it**, and it is the
missing half of *legible*: a debt whose discharge condition is unstated is not legible, it is only
counted.

The archived RFC's own cross-review diagnosed the gap in one sentence and then fixed the smaller
half of it:

> **`clearedBy` is never resolved and never printed, so it cannot be audited either way.** It is
> free text (§1), it does not touch the gate predicate (§2), and §3.3's report prints only `id` +
> `statement` for blocking entries — so a `clearedBy` naming an RFC that does not exist, or one
> whose named section landed months ago, is invisible.
> — `rfc/archive/pack-graduation.md` §1.1

Both of that paragraph's remedies shipped: the report prints `clearedBy`
(`graduation-report.ts:39`), and `GRADUATION_CLEAREDBY_UNRESOLVED` fires at **warning** when a
`clearedBy` string contains a repo-path-shaped token that does not exist on disk
(`apps/server/src/pack-validation.ts:860–863`) `[V]`. Neither remedy makes the field *required* or
*typed*, and the lint's guard clause is `if (row.state === "blocking" && typeof row.clearedBy ===
"string")` — so with zero strings in the corpus, **the only lint guarding clearance fires zero
times** `[V]`. The pointer was made auditable and then nobody was obliged to write one.

The consequence, stated as the gate sees it. `PackStudio.register` refuses on
`blockers.some(graduationEntryIsBlocking)` with `GRADUATION_BLOCKERS_OUTSTANDING`
(`apps/server/src/pack-studio.ts:122`) `[V]`, and
`GRADUATION_BLOCKING_ON_PUBLISHED` raises at error on any `published` document with a blocking
entry (`pack-validation.ts:873`) `[V]`. Both gates are correct and both work. **They are unmeetable
not because the corpus is unready but because the corpus has no expressible way to become ready.**

### §0.3 The second defect: `resolved` has already become a rubber stamp, measured

`rfc/archive/pack-graduation.md` §1.1 defines the three states as *blocking* (outstanding work),
*resolved* (was blocking; the work was done, kept for the record), and *accepted* (a permanent
condition the product has decided to live with), and requires `resolved.at` + `resolved.by`.

**[cross-review] That requirement is enforced by the schema, not by the lint this draft named.**
`$defs/graduationEntry.resolved` carries `required: ["at", "by"]` with `by` as `nonEmptyString` and
`additionalProperties: false` `[V]`, and that is the whole of the enforcement. The codes
`GRADUATION_RESOLVED_WITHOUT_RESOLUTION` and `GRADUATION_ACCEPTED_WITHOUT_RULING` were **specified
by `pack-graduation` §6 and do not exist anywhere in the tree** — a sweep for `GRADUATION_[A-Z_]*`
over `apps/`, `packages/`, `schemas/`, `content/` and `tools/` returns exactly seven codes:
`GRADUATION_BLOCKERS_OUTSTANDING`, `GRADUATION_RULING_UNCITED`, `GRADUATION_REQUIRES_SOURCES`,
`GRADUATION_ENTRY_LEGACY_SHAPE`, `GRADUATION_ID_DUPLICATE`, `GRADUATION_CLEAREDBY_UNRESOLVED` and
`GRADUATION_BLOCKING_ON_PUBLISHED` `[V]`. Nothing in the argument below turns on which layer
enforces it — schema-required and blank-checked is exactly as strong here — but an RFC that cites a
lint by name must have run the grep, and **two of `pack-graduation`'s specified codes did not
land**, which is a flow-back finding in its own right (**D416**, §Ledger rows).

Grouped over the 30 `resolved` entries in `content/drafts/` at HEAD, the distinct values of
`resolved.by` are:

| `resolved.by` | count |
|---|---|
| `The recorded work was completed; the original statement remains as history.` | **30** |

`[V]`. One string, thirty times, including on entries whose statements describe entirely different
work. `resolved.at` carries a date. Nothing else. So the state that §1.1 defines as *the work was
done* records, in every instance in the corpus, that **someone typed that the work was done**.

This is exactly as strong as `accepted` was before its own cross-review — the RFC's §1.2 correction
2 found that *"`accepted` IS reachable by assertion as drafted"* and fixed it with a required
`accepted.rulingRef` that must resolve. That fix shipped, and it worked: all 43 `accepted` entries
carry a resolving reference (**40 `owner_ruling` → `planning/exploration/log.md#L1231`, 3
`permanent_property` → `docs/tablebase-grounding.md`, 0 `out_of_scope`**) `[V]`, and
`GRADUATION_RULING_UNCITED` checks path existence, the `#L<line>` grammar, and — for
`owner_ruling` — date containment (`pack-validation.ts:840–858`) `[V]`.

**The same argument was never applied to `resolved`, and `resolved` is the state that will do all
the work.** There are 43 acceptances and there will be a few hundred resolutions; guarding the rare
state and leaving the common one on an author's word inverts the priority. **Getting this wrong
turns graduation into a rubber stamp, and the corpus shows the stamp already exists.**

### §0.4 The third defect, small and diagnostic: a permanent refusal filed as outstanding work

Five of the six `*.browser.json` test fixtures in `content/drafts/` carry exactly one `blocking`
entry, and each is a permanent refusal `[V]`:

| fixture | statement |
|---|---|
| `immediate-guard.browser.json` | Testing fixture only; do not publish as authored chess content. |
| `outcome-hold.browser.json` | Test-only fixture; never publish as chess content. |
| `outcome-resist.browser.json` | Test-only fixture; never publish as chess content. |
| `stated-reasoning.browser.json` | Testing fixture only; do not publish as chess instruction. |
| `trajectory-legs.browser.json` | Mechanical acceptance fixture only; it asserts no chess phase truth. |

*"Never publish"* is not outstanding work anybody can do. It is the definition of
`accepted` / `kind: "out_of_scope"` — the one `kind` with **zero** corpus instances `[V]`. This is
the identical defect `pack-graduation` §0.2 found for the 37 no-review-workflow entries (*"a
permanent accepted condition is sitting in a field for debts"*), surviving its own migration in a
population Stage B did not read. It is small — 5 entries — and it is diagnostic, because it shows
the migration's default-to-`blocking` rule (§4.1, correct) leaves permanent conditions parked in
the wrong state until something obliges an author to state a route.

The sixth fixture, `line-boundary.browser.json`, carries **zero** blocking entries and is kept out
of the graduable set by `!file.endsWith(".browser.json")` in `graduation-report.ts:25` `[V]`. The
report is right to exclude it; a filename suffix is a thin thing for that to rest on when
`runExpressionCensus` already computes `corpus.fixturePacks` naming all six `[V]`.
**[author round 3] There is now a third answer and it is the right one: `isPackDocumentName`
(`pack-registry.ts:185`) is a shipped, exported predicate performing exactly this exclusion** `[V]`,
landed by `3524b8e` closing [[D227]]/[[D257]]. `graduation-report.ts:25`'s inline suffix test should
call it, and this RFC's commit already edits that file (§6.5's filter change at `:8`). **Called out
here rather than folded into §6.4 because it moves no number in this document — `:25` decides the
*graduable set*, not the *document count* — and a change that would move a denominator must not ride
along on one that does not.**

### §0.5 Scope boundary

**In scope:** the grammar of `clearedBy` and its replacement by a typed `clearance` object; the
closed kind taxonomy and what predicate decides each kind; the `resolved`/`accepted` rule and the
demotion behaviour that makes it real; the authorization rule for `accepted` that does not require
a reviewer; the schema, lints, and report changes; and an honest count of what cannot clear.

**Out of scope, explicitly:**

- **(a) Doing the grounding work.** No engine pass, no explorer wave, no citation pass, no shape
  authoring lands here. `pack-graduation` §0.3(a) drew this line and it holds.
- **(b) Curating a subset of packs for promotion.** Refused by the owner at D162 and still refused.
- **(c) Reintroducing a pack review workflow** — see §3.
- **(d) Changing what `reviewStatus: "published"` means for severity.** `sourcing/check.ts`'s
  escalation of `EVIDENCE_TYPE_UNBACKED` and `DEVIATION_COST_UNBACKED` is untouched.
- **(e) The candidate→draft promotion path.** `content/candidates/` is inside the schema and is not
  a graduation subject (`pack-graduation` §0.3, open question 6, ruled). Its 143 entries take the
  emitter template's clearance (§6.3) because the schema reaches them; nothing here promotes one.
- **(f) `content/accepted-conditions.md`'s existence** — it is committed and byte-checked today and
  this RFC only adds rows to what it can contain.

## Specification

### §1 Clearance is a predicate, not a sentence

Every `blocking` entry carries a required **`clearance`** object. It replaces `clearedBy`, which is
withdrawn (§6.2 states the migration).

```jsonc
{
  "id": "syzygy-root-unverified",
  "state": "blocking",
  "statement": "The Syzygy root assessment is declared but not ledger-verified; no sourcing sidecars were produced.",
  "clearance": {
    "kind": "assessment_grounded",          // required, closed enum (§1.2)
    "subject": "/objective/grading/assessedBy",  // required, JSON pointer into this pack
    "instrument": "make verify-draft"       // required for mechanical kinds; the command that produces the evidence
  }
}
```

Three fields, each doing one job:

- **`kind`** names *which predicate decides this entry*. Closed enum; §1.2 is the whole vocabulary.
- **`subject`** is a JSON pointer into **this pack document**, naming what the entry is a claim
  about. A blocker with no subject is a blocker nobody can check, because "this pack is ungrounded"
  has no discharge condition. Required for every kind including `unreachable`.
- **`instrument`** is the shipped command that produces the evidence. Required for the mechanical
  kinds (§1.2 rows A–E), forbidden for `unreachable` and `unbuilt`, which have none.
- **`blockedBy`** (required for `unbuilt` only) is a repo-relative path to the RFC or the
  `design/BACKLOG.md` row that owns the missing instrument.

**The rule that makes this cheap rather than ceremonial:** the author writes the `kind` and the
`subject`; **the author never writes whether it is cleared.** A checker derives that (§2.3). An
author asserting clearance is exactly the thing §0.3 measured going wrong.

#### §1.1 What a clearance is not

- It is not a promise. `clearance` states the *shape* of the discharge condition, not that anyone
  intends to satisfy it.
- It is not a schedule. `pack-graduation` §1.1 refused a fourth state for *deferred / blocked on
  unlanded work* — *"'we are waiting on someone else' is the single most reusable sentence in
  software"* — and that refusal stands. `unbuilt` is a **`kind`, not a state**: an entry whose
  clearance is `unbuilt` is `blocking`, counts against the gate, and stops the pack graduating. All
  it adds is the name of what would have to exist, so that the count of *blocked on unlanded work*
  is a number rather than an impression.
- It is not a grade, a verdict, or a chess claim. A clearance names an instrument and a pointer;
  it never says a move is good. Law 8.

#### §1.2 The clearance kinds

Seven kinds, closed — **eight after §2.2a adds `referent_removed`, which is admissible on
`resolved` only and therefore has no row in a table of *blocking* populations.** The corpus population column is the output of the **ordered first-match keyword
ruleset published as a literal in §5.1a**, plus the hand classification of its 17-entry residue in
§5.1b. It is still **labelled a hand audit rather than a measurement** because `pack-graduation`
§4.3 established, on this same corpus, that *"a status recorded in prose cannot be migrated
mechanically"* — but it is now a hand audit a second party can **re-run**, which is the property
criterion 11 requires and the draft did not have. The right-hand columns are shipped facts and
are `[V]`.

| # | `kind` | Cleared when | Deciding predicate (shipped) | Corpus |
|---|---|---|---|---|
| A | `assessment_grounded` | `objective.grading.assessedBy` resolves against the pack's ledger | `assessmentGrounding(...)` returns `"ledger_verified"` (`apps/server/src/sourcing/ledger-validation.ts:423`) `[V]` | 5 |
| B | `ledger_record` | a record of the `clearance.recordKind` in the pack's `.evidence.json` carries `clearance.subject` in its `supports` (§1.2b) — **[author round 2] not *"anchored to a named FEN"*, which was this row's wording for two rounds and named the wrong join** ([[D471]]) | `checkSourcingFile` over the pack; the relation is the one `evidenceSupports` (`check.ts:170`) already lints. **Note the asymmetry:** the 32 committed ledgers hold only `position_legality` (32), `engine_eval` (391) and `tablebase_result` (341); `explorer_position_census` is a supported kind (`apps/server/src/sourcing/claim-binding.ts:93`) with **zero committed instances** `[V]` | 38 (engine) + 46 (corpus) |
| C | `claim_bound` | a `claimBindings` entry binds `subject` to a source with a matching text digest | `validateClaimBindings` (`apps/server/src/sourcing/claim-binding.ts:174`); `runExpressionCensus` reports `backing.backedClaims` per claim `[V]` | 55 |
| D | `shape_firing` | **[author round 3, [[D503]]]** the shape entry or plan signature named **at `subject`** fires on at least one of *this pack's* positions — and `subject` must be `/shapes/<i>` or `/planClasses/<i>/shapePlan` (§1.2c), which is what makes the kind unwritable on a pack that names no shape | `runExpressionCensus` (`expression-census.ts:257`), read at `coverage.corpus.packs` (`:216`); the negative is already a code — `SHAPE_TRIGGER_NEVER_FIRES_IN_CORPUS` (`apps/server/src/shape-check.ts:13`) `[V]` | ~~24~~ **18** |
| E | `pointer_authored` | the text at `subject` no longer matches the stated placeholder predicate | string comparison at `subject` against `clearance.placeholder` | 11 |
| F | `unbuilt` | **never here.** The instrument does not exist; `blockedBy` names who owns it | none — `blockedBy` path must resolve, reusing `GRADUATION_CLEAREDBY_UNRESOLVED` | ~~32~~ **38** |
| G | `unreachable` | **never.** Neither a source nor an instrument can ever reach it; the entry is a candidate for `accepted` (§3) | none — the *unreachability* is what carries a citation | 9, **of which 5 are the browser fixtures of §0.4** |

**The taxonomy is total over the real corpus, and the arithmetic is the proof:**
5 + (38 + 46) + 55 + **18** + 11 + **38** + 9 = **220**, the exact blocking population of
`content/drafts/` `[V]`. Every blocking entry lands in exactly one kind; there is no eighth bucket and
no entry outside the seven. **[author round 3] D 24 → 18 and F 32 → 38: the six D503 entries move,
the total does not, and §5.1a's rule 1 gained the two keywords that make the move re-derivable rather
than hand-applied.**

**[author round] Six of the eight cells moved when the ruleset was written down, and the reader is
owed the reason rather than a new table.** The cross-review corrected the draft's column for
double-counting (its G cell read *"12 residue + 5 fixtures"* and summed to 225 over a 220-entry
population) but could not re-derive any of the other seven cells, because the ruleset that produced
them was never published. §5.1a now publishes it, and running it moves the counts:

| kind | draft (unpublished audit) | §5.1a ruleset + §5.1b hand pass | what the published ruleset does |
|---|---|---|---|
| A `assessment_grounded` | 6 | **5** | rule 5 keys on `syzygy` / `tablebase` / `ledger-verified` / `assessedby` and **not** on *theoretical*, which would sweep in the four *"no shape-library entry names the theoretical-mate geometry"* rows and `rook-4v3-same-side`'s *"a theoretical draw … needs a citable endgame reference"* `[V]`. Those five are `shape_firing` and `claim_bound` respectively |
| B `ledger_record` (engine) | 38 | **38** | reproduces the draft's cell exactly — the only one that does |
| B `ledger_record` (corpus) | 40 | **46** | rule 2 fires on a game count or a share (`" games"`, `popularity`, `at band`), not only on the word *explorer*: 15 of the 46 match `explorer`, the other 31 match a corpus, frequency or count token `[V]` |
| C `claim_bound` | 52 | **55** | rule 3's widest keys are `cited 2026-08-16` (18), `uncited` (14) and `unbacked` (10); the keyword is `citable`, not `citable source`, which is what the corpus actually writes `[V]` |
| D `shape_firing` | 24 | **24** | the same total, reached differently: rule 6 keys on `shape-library` as well as `shape entry` / `shape reference` / `trigger` / `fenpredicate`, and §5.1b adds the two never-satisfied plan-class rows |
| E `pointer_authored` | 20 | **11** | rule 7 is **last**, so it only sees statements no instrument keyword reached. It keys on `agent-authored` / `are authored` / `hand-derived` / `hand copy` / `placeholder`, not on the bare token *authored* — which would otherwise capture `immediate-guard.browser`'s *"do not publish as authored chess content"* `[V]` |
| F `unbuilt` | 28 | **32** | rule 1 is deliberately **broad**: it also fires on *no format slot*, *nothing in the format*, *no human-play evidence*, *unmeasurable with anything in this repository* and *authoring substitute*. Every one names a thing someone would have to build |
| G `unreachable` | 12 | **9** | the residue is what no rule matched. §5.1b enumerates all 17 and hand-assigns 8 of them away: **3** to `unbuilt`, **2** to `shape_firing`, and one each to `claim_bound`, `pointer_authored` and `ledger_record` (engine) |

**The one cell whose movement changes an argument is F, and it moves in the safe direction.**
`unbuilt` blocks permanently and can never be accepted (§2.4), so an entry wrongly filed there costs
a pack a delay; an entry wrongly filed in G costs the product a laundering channel. Open question 4
asked which way to lean and the measurement answered **lean F**, so a ruleset that leans F is the
ruling implemented rather than contradicted.

Two things about this table are the design and must not be softened.

**First: F and G are different, and conflating them is how a backlog becomes a permanent
exemption.** `unbuilt` says *the instrument does not exist yet and someone owns building it* — it
keeps the pack out of `content/packs/` and its `blockedBy` is a live pointer. `unreachable` says
*no instrument can ever exist for this, by a property of the world* — and only that second one may
ever become `accepted`. A pack blocked on `perfect_tablebase` opponent selection is `unbuilt`
(three entries; `pack-graduation` §1.1's substitution population). A pack sitting at eleven pieces
where no tablebase applies is `unreachable` (`planning/content-era/plan.md` §3b: *"some assertions
are unreachable by material, not by effort"*). The keyword that separates them is not in the prose;
the author must choose, and the choice is auditable because §3 makes the second one cost a
citation.

**Second: C is the largest class and the one where the instrument sees least.** `runExpressionCensus`
over the corpus at HEAD reports **196 `feedbackClaims` across 50 authored packs, and exactly 1
backed claim** `[V]` — `evidence.totals.claims: 196`, `evidence.totals.backedClaims: 1`,
`evidence.totals.packs: 50` (**[author round]** the path is `evidence.totals`, not `totals`;
top-level `totals` is the expression census and carries no claim count `[V]`). **[cross-review] The
draft said 254, which is a different quantity.** 254 is the sum of `evidence.totals.byRung[].claims`
(43 + 37 + 8 + 60 + 106 `[V]`), and a claim carrying two `evidenceTypes` is counted once per type
there (`expression-census.ts:119` sums per-citation, `:126` sums per-pack) `[V]`; it is the
**citation** count, not the claim count. The
254 splits as `author_principle` 82 / `corpus_observed` 60 / `derived_feature` 43 /
`tablebase_exact` 37 / `hypothesis` 24 / `engine_validated` 8, and that split is correct **as a
split of citations**. The ratio the argument needs is **1 backed of 196 claims**, and it is the
figure `design/BACKLOG.md` **D403** already carries — so the draft's own ledger neighbourhood had
the right number and this RFC quoted the wrong one. Direction unchanged; precision restored, and
§5.1's own standard (*"the only numbers in this RFC quoted to the unit are the ones a command
printed"*) requires it, because the command printed both and they mean different things.
The ledger row **D267** measured the consequence directly:
running `checkSourcingFile` before and after a 22-pack citation pass gave **32 of 47 clean at draft
severity and 4 of 47 at published severity, before and after** — *"no instrument in this repo can
see a citation."* `claimBindings` (landed at pack **0.26**) is the mechanism that changes that, and
it is used by **1 of 32 ledgers** `[V]`. So `claim_bound` is a real predicate over a nearly-unused
mechanism, and §5.3 prices that honestly rather than counting **55** entries as cheap.
**[author round] And the honest class is bigger than 55**: §4.2 establishes that B(corpus)'s 46
entries are cleared by the *same command* that clears a `claim_bound` entry, which writes the
`explorer_position_census` record and the `claimBindings` entry in one atomic write
(`sourcing/explorer.ts:268–273`) `[V]`. **The authored-prose-plus-a-source class is 46 + 55 = 101 of
220**, and this RFC prices it once.

#### §1.2b [author round 2 — closes [[D464]]] `ledger_record` names its record kind, and the pointer rule that decides it moves the B/C boundary

**The blocker, restated so the fix is checkable against it:** *"`clearance.kind: "ledger_record"`
carries `subject` and `instrument` but no evidence `recordKind`, so `engine_eval` and
`explorer_position_census` obligations are indistinguishable at the exact predicate meant to
re-derive them."* Correct as written, and §1.2's own row B compounded it by describing the predicate
in prose (*"a record of a named `kind`, anchored to a named FEN"*) that no field in §1 could carry.

**The field.** `clearance.recordKind` is **required when and only when `kind` is `ledger_record`**,
and its value set is the shipped enum, not a new one:

```ts
export const EVIDENCE_KINDS = [
  "opening_identity", "position_legality", "explorer_frequency", "explorer_position_census",
  "tablebase_result", "engine_eval", "puzzle_provenance",
] as const;                                 // apps/server/src/sourcing/types.ts:57
```

`[V]`, read at the symbol. Seven values; **three have committed instances** — over the 32 ledgers in
`content/drafts/` there are **764 records: `engine_eval` 391, `tablebase_result` 341,
`position_legality` 32** `[V]`, computed by walking every `*.evidence.json` at HEAD. The enum is
reused rather than restated so that a kind added to `EVIDENCE_KINDS` cannot silently become
unexpressible in a clearance; `GRADUATION_CLEARANCE_RECORDKIND_UNKNOWN` (error) is the guard, and
criterion 13 asserts the two lists are the same list.

**The deciding predicate, at the symbol.** A `ledger_record` clearance holds when the pack's ledger
contains a record of the named kind that **supports the clearance's own subject**:

> `ledger.records.some((record) => record.kind === clearance.recordKind && record.supports.includes(clearance.subject))`

This is not a new linking concept. `evidenceSupports` (`apps/server/src/sourcing/check.ts:170`)
already treats `record.supports` as a list of JSON pointers into the pack and already raises
`EVIDENCE_ANCHOR_BROKEN` at `:190` when one does not resolve `[V]` — so *"a record's claim on a pack
pointer"* is a shipped, linted relation and `clearance.subject` is the same kind of thing on the
other side of it. The FEN is not the join key and §1.2's row B was wrong to make it one:
`uniqueRecord` (`claim-binding.ts:59`) joins on FEN because a **claim assertion** names a position,
whereas a **graduation subject** names a pack node. Both are shipped; this RFC needed the second.

**And the measurement changes something the draft assumed.** Over all 764 committed records the
`supports` pointers take exactly three shapes — `/start/fen` (64), `/spine/…/moveUci` (465) and
`/deviations/<i>/moveUci` (235) `[V]`. **Zero records support a `/feedbackClaims/<i>/text`
pointer, and none ever can**, because `check.ts:195` raises `EVIDENCE_OVERREACH` on any record whose
`supports` matches `PROSE_POINTERS` (`:36`) or `HUMAN_ONLY_POINTERS` (`:43`) `[V]`. It raises at
**error** — `issue()` defaults to `"error"` (`ledger-validation.ts:34–38`) and `checkSourcingFile`
defaults to `strict: true` (`check.ts:441`), which is the mode every gate in this RFC runs in `[V]` —
so this is a refusal and not a note. So:

> **Normative.** A `ledger_record` clearance whose `subject` matches `PROSE_POINTERS` or
> `HUMAN_ONLY_POINTERS` is **unsatisfiable by construction** and is an error —
> `GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE`. Such an entry is `claim_bound`, whose predicate
> reaches prose through `claimBindings` and no other way.

**This is the B(corpus)/C boundary, decided by a mechanism instead of by a keyword.** §4.2 already
found the two classes are *one cost* — `attachExplorerEvidence` writes the
`explorer_position_census` record and the `claimBindings` entry in one atomic write
(`explorer.ts:268–273`). The pointer rule now says which *kind* each entry takes, and the answer is
sharper than §5.1a's rule 2 could be: read at `explorer.ts:268`, that record's `supports` is
`["/start/fen"]` when the anchor is the pack root and **`[]` otherwise** `[V]`. Therefore

- an entry about the **root position's** corpus figures may be `ledger_record` with
  `recordKind: "explorer_position_census"` and `subject: "/start/fen"`; and
- an entry about a **quantified sentence** — which is what rule 2's *" games"*, `popularity`,
  `at band` keywords actually match — is `claim_bound`, because the only record that could reach it
  supports nothing.

**What this does to §5.1a's counts, stated rather than quietly applied.** Rule 2's **46** is a
*rule* count over statements, and it always was; it is not a kind count, because the kind depends on
the `subject` and no subject exists in the corpus yet. §1.2's *"B 38 (engine) + 46 (corpus)"* cell
is therefore replaced by: **B(engine) 38; the 46 rule-2 entries split between `ledger_record` and
`claim_bound` at Stage A by the pointer rule above, and the split is a diff a reviewer reads.**
**No number below moves**, because §4.2 already prices B(corpus) and C as one class of **101**, which
is the figure planning consumes and which is invariant under this boundary `[V]`. What moves is that
the boundary is now decided by a lint instead of by a keyword — which is what D464 was asking for and
is a strictly better outcome than the `recordKind` field alone.

#### §1.2c [author round 3 — closes [[D503]]] Every kind's `subject` has a pointer grammar the shipped code already enforces, and this RFC stated one of six

**The blocker, restated so the fix is checkable against it:** *"Its literal classifier assigns six
current blockers to `shape_firing` while those packs carry no `shapes` reference at all. … Pointing at
the blocker prose resolves syntactically but makes the predicate unevaluable; pointing at `/shapes/0`
is truthful but does not resolve."* Correct, reproduced exactly, and **narrower than the defect it is
an instance of**.

**Reproduced first, so the fix is measured against a run rather than against the row.** The §5.1a
classifier, re-run at HEAD, assigns **22** entries to rule 6. Reading each pack's `shapes` key on the
parsed document, **6 of the 22 have no `shapes` key at all** and the other 16 have exactly one `[V]`:

| pack | entry statement (abbreviated) | `shapes` |
|---|---|---|
| `anti-scandinavian-white` | *"NO shapes reference, deliberately, and a shape entry is hereby commissioned."* | **absent** |
| `mate-bishop-knight` | *"No shape-library entry names the theoretical-mate geometry; commission one…"* | **absent** |
| `mate-k-q-technique` | *"No shape-library entry names the theoretical-mate boxes; … an entry needs commissioning."* | **absent** |
| `mate-k-r-technique` | *"No shape-library entry names the theoretical-mate boxes; commission one…"* | **absent** |
| `mate-two-bishops` | *"No shape-library entry names the theoretical-mate geometry; commission one…"* | **absent** |
| `scandinavian-mainline-black` | *"NO shapes reference, deliberately, and a third shape entry is hereby commissioned."* | **absent** |

`[V]`. The `shapes` property is `{"type":"array","minItems":1,…}` at pack 0.27 `[V]`, so a pack either
carries a non-empty `shapes` array or no key — there is no empty-array middle case, and `/shapes/0`
either resolves or the property is absent. **The implementer's dilemma is exactly right and has no
third horn.**

**The ruling: they are `unbuilt`, and the reason is that their own statements say so.** *"An entry
needs commissioning"* and *"a shape entry is hereby commissioned"* are the definition of §1.2's F —
*the instrument does not exist and someone owns building it* — not of D. `blockedBy` names the
commissioning owner and the `subject` is `/start/fen`, which resolves on all six `[V]`; F **has no
predicate** (§1.2 row F), so a documentary subject is honest there in a way it would not be under D.
§5.1a's rule 1 gains the two keywords that produce this assignment mechanically (§5.1a), so it is
re-derivable rather than hand-applied — and it lands in the direction §5.1a property 1 already
declared safe: *"a tie resolved to F costs a delay, while a tie resolved to G opens the laundering
channel."*

**But re-keying six entries is not the fix, because the same hole is open in three other kinds.**
§1.2b established for kind B that the join is `record.supports` and that a prose `subject` is
unsatisfiable by construction. **That was the first of six, and the other five were never checked.**
Read at the symbol:

| kind | `subject` grammar — **normative** | what joins it | shipped symbol |
|---|---|---|---|
| A `assessment_grounded` | **exactly** `/objective/grading/assessedBy` | nothing — the predicate reads `document.objective.grading.assessedBy` **directly and ignores `subject` entirely** | `assessmentGrounding` (`sourcing/ledger-validation.ts:423`, first statement of the body) `[V]` |
| B `ledger_record` | `/start/fen`, `/spine/…/moveUci`, `/deviations/<i>/moveUci`; **never prose** (§1.2b) | `record.supports.includes(subject)` | `evidenceSupports` (`check.ts:170`), `EVIDENCE_OVERREACH` (`:195`) `[V]` |
| C `claim_bound` | **exactly** `^/feedbackClaims/\d+/text$` | `binding.pointer === subject` | `validateClaimBindings` (`claim-binding.ts:174`) raises `CLAIM_POINTER_INVALID` at `:178` on *any* other pointer `[V]` |
| D `shape_firing` | `^/shapes/\d+$` **or** `^/planClasses/\d+/shapePlan$` | the census subject keyed on the shape id, or on the shape **and** plan pair | `runExpressionCensus` (`expression-census.ts:257`); `site.subject.{kind,shape,plan}` at `:311`, `coverage.corpus.packs` at `:216` `[V]` |
| E `pointer_authored` | any depth-≥1 pointer **resolving to a string** | `resolvePointer(pack, subject).value !== placeholder` | `resolvePointer` (`check.ts:69`) `[V]` |
| F / G / H | documentary; any resolving depth-≥1 pointer | **nothing — these kinds have no predicate** | — |

`[V]`, every row read at the named symbol. **Three of these were live defects, not restatements.**
A's `subject` is decorative and the RFC's §1.4(1) already used it as its example of the unclosable
residue without noticing that pinning the pointer closes half of it. C's grammar is enforced by a lint
that would have refused every `claim_bound` clearance an implementer wrote against any other pointer —
**a 55-entry class whose predicate could never have held**, discovered by reading the function §6.5
already names. D's is D503.

**The codes.** `GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL` (error, `validatePackDocument`, **document
inputs only** — it is a regex over a string and a pointer resolution, so it fits §6.3's runtime budget):
a `clearance.subject` that does not match its `kind`'s row above. It **subsumes**
`GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE` (§1.2b), which is the B row of the same table stated as its
own code; that code is **withdrawn into this one** rather than kept beside it, because two codes for one
table is how the next reader learns a wrong thing from a green check.

**What this buys that the six-entry fix would not.** A wrong `kind` still fails to clear rather than
clearing wrongly (§6.2's safety argument, unchanged). What the table adds is that a wrong **`subject`**
now fails **at authoring time with a message naming the grammar**, instead of at `make graduation-clear`
time with a predicate that silently never holds — which is the shape D503 caught for one kind and which
was waiting in three more.

#### §1.3 What `claim_bound` checks, and what it refuses to check

`claim_bound` clears when a source *is attached and bound to the named claim* — path resolves,
`claimId` matches, `textSha256` matches the prose it binds. **It never checks that the source
supports the claim.** No lint can read a Wikibooks page and agree with a sentence about the
Carlsbad structure. This RFC states the limit in the specification rather than in a footnote,
because a reader who believes `claim_bound` means *verified* has learned the wrong thing from a
green check.

The honest reading is `planning/content-era/plan.md` §3b's, adopted verbatim: a claim needs *"a
citable source … or engine/corpus/tablebase validation that actually bears on the claim."*
`claim_bound` mechanizes **attachment**, which is the half a machine owns. Whether the source bears
on the claim is an authored judgement, and §3 rules who may make it — the answer is nobody, and
that is why `claim_bound` clears on attachment rather than on agreement.

#### §1.4 [cross-review] What no lint ties together — the residue of author discretion, stated

§1.3's honesty about `claim_bound` is right and **is not special to `claim_bound`.** The same gap
runs through the whole vocabulary and the draft did not generalize it, so a reader takes §2.1's
*"neither is ever an author's sentence about their own pack"* as stronger than the mechanism
delivers. Three specific residues, each real and each **acceptable if written down**:

1. **Nothing ties `clearance` to `statement`.** `GRADUATION_CLEARANCE_SUBJECT_UNRESOLVED` checks
   that the pointer resolves; no lint in §6.3 checks that the thing it points at is what the
   statement is about. An author may file a `no engine pass has been run` blocker with
   `kind: "assessment_grounded"`, `subject: "/objective/grading/assessedBy"` — a predicate that
   already holds on four packs today — and the entry resolves on the checker's first run without
   an engine ever running. **The clearance is machine-decided; which predicate applies stays an
   author's sentence.** This is the honest form of §2.1's rule and it must be stated that way.
2. **`subject: "/"` satisfies the pattern.** `^/` matches the document root, so *"this pack is
   ungrounded"* — the very shape §1 refuses as *"a blocker nobody can check"* — is expressible with
   a resolving subject. Open question 4's own fallback proposes the pack root as a subject, so the
   escape hatch is already in the draft's text. **Fix (normative):** `clearance.subject` must be a
   pointer of depth ≥ 1 — `"^/[^/]"`, not `"^/"` — and `GRADUATION_CLEARANCE_SUBJECT_UNRESOLVED`
   raises on the bare root. Cheap, closes the hole, costs the honest case nothing.
3. **Kind E's author writes the predicate's input.** `pointer_authored` compares the text at
   `subject` against `clearance.placeholder` — and the **author supplies `placeholder`**. An author
   who writes a `placeholder` the text already fails to match has authored a predicate that holds
   on arrival. §4.3 calls E *"the weakest predicate in the vocabulary"*; that is the reason, and it
   is sharper than *"a string comparison cannot prove what replaced it is true."* **Fix
   (normative):** `placeholder` is **required** when `kind` is `pointer_authored` — the draft's §1
   field list omits it entirely and §6.3 has no lint for it, so 20 entries could carry a kind whose
   predicate has no input — and the migration's Stage A must take each `placeholder` **from the
   emitter template or the committed text at landing**, never from a later author's choice. Code:
   `GRADUATION_CLEARANCE_PLACEHOLDER_MISSING` (error).

Residues 2 and 3 are closed by the fixes above. Residue 1 is not closable by a lint — matching a
prose statement to a predicate is the same judgement §1.3 refuses to mechanize — and is therefore
**stated as a limit of the vocabulary rather than patched**. What the vocabulary buys against it is
still decisive: a mismatched kind is **visible in a diff as one word**, where today the same
dishonesty is a paragraph of prose nobody re-reads.

### §2 `resolved` versus `accepted` — the rule

#### §2.1 The rule

> **`resolved` is a standing predicate a checker re-evaluates on every run. `accepted` is a
> citation to a decision already recorded outside the pack. Neither is ever an author's sentence
> about their own pack.**

| | `resolved` | `accepted` |
|---|---|---|
| What it asserts | the condition is **gone** | the condition **stands**, and shipping anyway was decided |
| Who decides | a shipped predicate, on every run | a dated ruling in the living tier, cited by path |
| Can it become false? | **yes** — and it demotes itself (§2.3) | no; a ruling is not falsified by a pack changing |
| Required companion | `resolved.by` is the **clearance the entry carried**, plus the instrument output | `accepted.kind` + `ruling` + `rulingRef` (shipped) |
| Author's free text | none that the state depends on | the quoted ruling, which the lint date-checks |
| Failure mode it prevents | a debt retired by assertion | a debt retired by a shrug |

The asymmetry is deliberate and it is the same one `pack-graduation` §4.4 built the migration on:
misclassifying a real debt as cleared graduates a pack that should not graduate; misclassifying a
cleared debt as blocking delays a pack that should. The first is a product failure; the second is
an inconvenience.

#### §2.2 `resolved.by` stops being prose

`resolved` gains a required `resolved.clearance`: **the same object the entry carried while
blocking**, unchanged, plus the instrument output that satisfied it.

```jsonc
{
  "id": "syzygy-root-unverified",
  "state": "resolved",
  "statement": "The Syzygy root assessment is declared but not ledger-verified; no sourcing sidecars were produced.",
  "resolved": {
    "at": "2026-08-16",
    "clearance": { "kind": "assessment_grounded", "subject": "/objective/grading/assessedBy", "instrument": "make verify-draft" },
    "by": "assessmentGrounding = ledger_verified; content/drafts/mate-k-q-technique.evidence.json holds 27 tablebase_result records"
  }
}
```

`resolved.by` stays required and stays free text — it is the *human-readable* record — but it is no
longer load-bearing. **The state is decided by `resolved.clearance`, which the checker re-runs.**
That is what makes a `resolved` entry different in kind from an `accepted` one rather than
different only in wording, and it is what the 30 identical boilerplate strings prove is needed.

`GRADUATION_RESOLVED_WITHOUT_CLEARANCE` (error) fires on a `resolved` entry with no
`resolved.clearance`, or one whose `clearance.kind` is `unbuilt` or `unreachable` — those two kinds
have no predicate and therefore cannot resolve, only be accepted or stay blocking.
**[author round 2] `referent_removed` (§2.2a) is the third kind this code must know about, and it is
in the *allowed* list, not the refused one** — it has a predicate, it is only ever `resolved`, and it
is the single kind that may appear on a `resolved` entry and on no other state. The refused set stays
exactly `{unbuilt, unreachable}`.

##### §2.2a [author round 2 — closes [[D465]]] A resolution whose work was a **deletion** gets a predicate, because the alternative is a forged subject

**The blocker said the subject grammar cannot honestly represent work whose referent was deleted, so
Stage B is not a mechanical migration over its claimed population. The grammar half is right. The
population half was measured, and it is one entry, not "some".**

All 30 `resolved` entries in `content/drafts/` were walked at HEAD — every pointer below was
resolved by actually walking the parsed document, not matched by grep. The result:

| | count |
|---|---|
| resolved entries in `content/drafts/` | **30**, over **24** distinct pack files |
| distinct `resolved.by` strings | **1** (the §0.3 finding reproduces exactly) |
| **(a)** a subject of depth ≥ 1 resolves in the current document | **29** |
| **(b)** the statement's primary referent was removed | **1** |
| **(c)** ambiguous | **0** |

`[V]`. The 30 fall in five textual families — **`engine-evidence-now-…` 19, `prose-grounding-pass…`
5, `shape-entry-authored…` 4, `resolved-in-v0-2-0…` 1, `refuted-and-deleted…` 1**, summing to 30
`[V]` — and the first four families each have one obvious subject: the 19 → `/objective/grading/assessedBy`,
which resolves to a `{kind:"engine", depth:22, …}` object in all 19 `[V]`; the 5 → the annotation,
plan-class description or deviation the pass corrected, each still present in place `[V]`; the 4 + 1
shape-referencing entries → `/shapes/<i>` plus the `planClasses/<i>/shapePlan` that names the
authored plan, all resolving `[V]`. **The fifth family is one entry and is the whole of D465.**

**The one that does not, in full, because a reader must be able to disagree with the reading.**
`content/drafts/anti-caro-advance-early-c5.json`, `/provenance/graduationBlockers/5`, id
`refuted-and-deleted-2026-08-15-the-pack-s-largest-single`:

> REFUTED AND DELETED 2026-08-15 — the pack's largest single error. … **Spine nodes `bxc5-recoup`
> and `bxc5-trade`, checkpoint `price-collected` and the two `authoredBoundary` entries were
> removed.** No replacement line was authored, because authoring one would be manufacturing chess
> this pass cannot ground.

Verified absent at HEAD: the document's 13 spine ids are
`dxc5-take, nc6-active, nf3-dev, bg4-pin, c3-brace, e6-late, b4-clamp, e6-bid, be3-shield,
nf3-decline, cxd4-free, nxd4-central, c3-prop` and its 5 checkpoint ids are `grab-decision,
clamp-standing, decline-compared, prop-compared, past-the-book` — **none of the three named ids
survives as an id anywhere in the document** `[V]`.

**The ruling: the grammar expresses it. It is not reclassified and Stage B's population is not
narrowed.** An eighth clearance kind is added:

| # | `kind` | Cleared when | Deciding predicate |
|---|---|---|---|
| H | `referent_removed` | every id in `absentIds` is absent under `subject` | `subject` resolves to a container; no descendant object's `id` is in `absentIds` |

```jsonc
{ "state": "resolved",
  "resolved": { "at": "2026-08-15",
    "clearance": { "kind": "referent_removed", "subject": "/spine",
                   "absentIds": ["bxc5-recoup", "bxc5-trade"] },
    "by": "…" } }
```

**Four properties, and they are the reason this is a grammar fix rather than a workaround.**

1. **It is a standing predicate, which is the whole of §2.1's rule.** *The named ids are absent* is
   re-evaluated on every run exactly as *the ledger holds a record* is. It is not a sentence about
   the past.
2. **It re-derives in the useful direction.** If a later author re-introduces `bxc5-recoup`, the
   predicate stops holding and `GRADUATION_RESOLUTION_STALE` fires — which is **correct**: a refuted
   line coming back should re-open the blocker that refuted it. No other encoding of this entry has
   that property, and the alternatives (invent a pointer, or file it under the surviving
   `/planClasses/1`) both silently lose it.
3. **`subject` still resolves, so §1.4(2)'s depth-≥1 rule is untouched.** The container is named, not
   the hole. `absentIds` carries the removed names, because a JSON pointer indexes by position and
   the corpus names spine nodes and checkpoints by `id` — the deleted things had ids and never had
   stable pointers `[V]`.
4. **It is admissible on `resolved` only, and the automatic writer never emits it.** A `blocking`
   entry may not carry `kind: "referent_removed"` —
   `GRADUATION_CLEARANCE_REMOVAL_ON_BLOCKING` (error) — because *"I deleted the thing the blocker
   was about"* is the purest laundering move in the vocabulary, and §6.5's `clearGraduationEntries`
   emits kinds A–E and nothing else. The only route into this kind is a hand edit in a reviewable
   diff, which is where a deletion belongs.

**What this does not fix, stated because §1.4(1) forbids implying otherwise.** The same walk found
**two more dangling referents in the same corpus, outside the blocker list**: **20** packs'
`provenance.sources` promise *"Per-move centipawns and losses are in `provenance.engineValidation`"*
and **0 of the 20 carry a `provenance.engineValidation` key** — the data is in the `.evidence.json`
sidecar and in `deviations[].cost` `[V]`; the count is **20 and not the 19 packs that carry the
engine-evidence resolution**, so the two populations are close and are not the same set — and
`anti-caro-advance-early-c5.json`'s `/provenance/sources/6`
still cites the deleted `bxc5-recoup` by name `[V]`. Those are prose, this RFC lints clearances and
not prose, and the honest disposal is a ledger row rather than a scope increase (§Ledger rows).
`PROVENANCE_EVIDENCE_INLINE` (`pack-validation.ts:868`) already refuses the key those 19 sentences
promise, so the sentences are not merely stale — they describe a shape the validator forbids `[V]`.

#### §2.3 A `resolved` entry that stops re-deriving demotes itself

`checkSourcingFile` gains a graduation pass: for every `resolved` entry, re-evaluate
`resolved.clearance`. If the predicate no longer holds, raise
**`GRADUATION_RESOLUTION_STALE`** — at **warning** in `content/drafts/`, at **error** in
`content/packs/`, and the gate predicate treats the entry as `blocking`.

This is the whole content of *"resolved means the condition is gone and is checkable"*. A
resolution that cannot be re-derived is an assertion with a date on it, which is what the corpus
has 30 of today. It costs nothing to add now: the predicates are already shipped, and the
`content/packs/` strict sweep `pack-graduation` §5.1 landed is already free because the directory
is empty (**D237** — *"a gate added before its first subject is free and uncontested"*).

**Symmetrically, `accepted` never demotes**, and this is not an oversight. A ruling is a fact about
a decision, not about a pack; nothing an author does to a pack can falsify it. What *is* re-checked
on every run is that the citation still resolves — `GRADUATION_RULING_UNCITED` already does exactly
that, at error `[V]`.

##### §2.3a [cross-review] *"and the gate predicate treats the entry as `blocking`"* is the sentence this RFC has to earn, and as drafted it does not

**This was the largest hole in the draft and it is a wiring hole, not a reasoning one.** The rule
is right; the mechanism as specified cannot reach either consumer. Three shipped facts, all `[V]`:

1. **The gate predicate is a pure state read.** `graduationEntryIsBlocking`
   (`pack-validation.ts:154–158`) is `return (value as Record<string, unknown>).state === "blocking"`
   — synchronous, one entry, `unknown` in, no ledger, no filesystem, no `await`. It is the predicate
   `PackStudio.register` calls (`pack-studio.ts:122`) and the one `GRADUATION_BLOCKING_ON_PUBLISHED`
   calls (`pack-validation.ts:872`). **A `GRADUATION_RESOLUTION_STALE` raised inside
   `checkSourcingFile` cannot change what it returns.**
2. **The report does not consult a checker either.** `graduation-report.ts` imports only
   `node:fs`/`node:path` and reads `entry.state` directly (`:24`, `:39`). Its graduable set is
   *"zero entries whose `state` is `blocking`"* and nothing else. §6.4's *"the checker's verdict —
   `holds` / `does not hold` / `no predicate`"* therefore **is** a new sweep, contradicting §6.3's
   *"adds a predicate to a sweep that already runs and adds no new sweep."*
3. **`checkSourcingFile` is filesystem-and-async and `PackStudio.register` is neither.**
   `checkSourcingFile(file: string): Promise<SourcingCheckResult>` (`sourcing/check.ts:437`) resolves
   `<stem>.evidence.json` and `<stem>.sources.json` next to a **file on disk**. `PackStudio.register`
   runs synchronously over a document read from `pack_drafts.document_json` — a stored draft **has
   no sidecar at all**. So on the studio route there is no ledger to re-derive against, and none can
   be conjured without the storage change §7 correctly refuses to make.

**What follows, stated as the specification rather than left to the implementer.** The consequence
is that the answer to *"can a determined author still satisfy `resolved` by assertion?"* is **yes,
on the studio route, and this RFC must say so rather than imply otherwise:**

- **Corpus route (`content/drafts/`, `content/packs/`, `make verify`, `make graduation-report`):
  fully closed.** The ledger is on disk beside the pack. `checkSourcingFile` gains the graduation
  pass, **and `graduation-report.ts` gains a `--verify` mode that calls it** and treats a
  `GRADUATION_RESOLUTION_STALE` entry as `blocking` when computing the graduable set. The
  re-derivation is a **report-and-sweep** obligation, not a `graduationEntryIsBlocking` obligation:
  that function keeps its signature and its pure-state semantics, because widening it to async
  ledger-reading would push a filesystem dependency into the request path of every pack validation.
  §6.4's two new header lines and the per-entry verdict come from this mode.
- **Studio route (`PackStudio.register`): open by construction, and bounded instead of closed.** A
  stored draft can carry a `resolved` entry whose predicate has never been re-derived, and register
  will accept it, because the gate sees only `state`. The bound is that the pack lands in
  `registered_packs`, **not** in `content/packs/`, and `content/packs/` is the only root a
  production image contains (§0.1) — so the studio route cannot reach the official catalogue, which
  is the population this RFC exists to unblock. **Naming this is not a concession; hiding it would
  have been the defect.** Closing it needs a sidecar concept for stored drafts, which is a storage
  change, a `STORAGE_VERSION` bump, and a different RFC. Filed as **D417**.
- **Acceptance criterion 4 is rewritten accordingly** (see §Acceptance criteria): the negative test
  asserts `GRADUATION_RESOLUTION_STALE` fires **and the report's graduable set loses the pack**,
  which is testable, rather than *"the gate predicate counts the entry as `blocking`"*, which is
  not.

##### §2.3b [author round] The studio bound, confirmed — and it is narrower than the reviewer stated, in the direction that matters [[D427]]

**The bound is confirmed and it holds. But *"the studio route cannot reach the official catalogue"*
is not the same sentence as *"the studio route cannot reach production"*, and the second one is
false — so the bound is restated here before someone leans on the wrong half of it.**

`PackStudio.hydrate` (`pack-studio.ts:52–59`) replays every row of `registered_packs` into the live
registry through `PackRegistry.addCommunity` `[V]`. A registered pack **is** served in production; it
is served on the `community` channel rather than the `official` one. So a `resolved` entry laundered
past `PackStudio.register` reaches a learner.

**What makes the bound real is not the route, it is what `addCommunity` refuses to carry.** Read at
`pack-registry.ts:388–418` `[V]`, every community record is constructed with:

| field | value on a community record | consequence |
|---|---|---|
| `assessmentGrounding` | `"unverified"`, **hard-coded** (`:411`) | the runtime never treats a community pack's root assessment as ledger-verified, whatever the pack says |
| `positionEvidence` | `new Map()` | no engine or tablebase evidence is available to the run |
| `boundClaimIds` / `claimBackings` | empty set / empty map | no claim is backed at runtime |
| `channel` | `"community"`, and `if (this.#records.get(document.id)?.channel !== "official")` guards the write (`:412`) | a community pack can never shadow an official one by id |

**So the studio route can publish a pack whose blockers lie, and it cannot publish the *evidence*
that lie asserts.** The laundered `resolved` buys the author a green blocker list and buys the
learner nothing — the runtime already treats every community pack as ungrounded by construction.
That is a genuine bound rather than a hope, and it is the reason this RFC does not need the storage
change to be honest.

**It is still a hole and it stays named.** A community pack's *blocker list is visible to the
learner* through the same surfaces the official one uses, so the lie is legible even where the
evidence is not. Closing it needs a sidecar concept for stored drafts — a storage change, a
`STORAGE_VERSION` bump, and a different RFC — and **this RFC does not close it, does not pretend to,
and pins it with criterion 4a.** Filed as **D417**. The one thing this round adds to the filing is
the measurement above: **whoever picks D417 up should know the exposure is a false blocker list on a
community pack, not false evidence**, because that changes whether the fix is a storage sidecar or a
surface change.

**Cost note, since §2.3 claims the addition is free.** For kinds A and B the re-derivation is a
ledger read and is genuinely free. For **D `shape_firing` it is not**: `runExpressionCensus` walks
the whole corpus (827 positions, 771 transitions, 25 shape entries at HEAD `[V]`) and is a
`make expression-census` run, not a per-file check. The graduation pass must re-derive D from a
**single cached census run per sweep**, not once per entry, or `make verify` acquires a corpus walk
per pack. This is a real implementation constraint and is stated here because *"the predicates are
already shipped"* is true and *"so re-running them costs nothing"* is not.

#### §2.4 The clearance ladder, and where the gate sits on it

```
  blocking ──── predicate holds ────▶ resolved ──── predicate stops holding ────▶ blocking
     │                                                     (automatic, §2.3)
     │
     └──── kind is `unreachable` AND a ruling exists ────▶ accepted   (§3; never returns)
```

**[author round 2] `referent_removed` (H) sits on no edge in this diagram, and that is the point.**
It is a clearance a `resolved` entry *carries*, never a route a `blocking` entry *takes*: there is no
`blocking → resolved` edge for H, because the transition writer (§6.5) emits kinds A–E only and
`GRADUATION_CLEARANCE_REMOVAL_ON_BLOCKING` refuses the kind on a `blocking` entry outright (§2.2a).
The edge H *does* own is the return arrow — a re-introduced referent stops the predicate holding and
the entry demotes to `blocking` by §2.3 like any other stale resolution.

There is no edge from `blocking` to `accepted` for the mechanical kinds A–E, and no edge from
`unbuilt` to `accepted` at all. **`unbuilt` cannot be accepted** — that edge is the laundering
channel in its purest form (*"nobody has built it, so we will ship without it"*), and refusing it
is the same refusal `pack-graduation` §1.1 made against a fourth state, applied to the state that
already exists.

#### §2.5 [author round 3] A clearance whose predicate already holds is not a clearance, and this round found sixteen

**This section exists because D503 was the visible half of a two-sided defect and the other half is
larger.** §1.2c fixes the six entries whose `shape_firing` subject cannot resolve. The obvious next
question — *what happens to the sixteen whose subject **does** resolve?* — was asked by running the
predicate rather than by reading it, and the answer refutes the migration as specified.

**The measurement.** For each of the 16 rule-6 entries on a pack carrying a `shapes` reference, the
census subject `{kind: "shape_trigger", shape: <the pack's shape id>}` was located and its
`coverage.corpus.packs` read for that pack's own firing count `[V]`:

| pack | shape entry | firings **in this pack** |
|---|---|---|
| `anti-french-advance-white` | `closed-centre-chain` | 11 |
| `anti-italian-center-attack-black` | `iqp-white` | 2 |
| `berlin-queenless-press` (×2 entries) | `queenless-middlegame` | 9 |
| `closed-centre-chain-black-base-strike` (×2) | `closed-centre-chain` | 5 |
| `dragon-yugoslav-race` | `opposite-castling-race` | 12 |
| `french-advance-chain-white` | `closed-centre-chain` | 10 |
| `italian-center-attack-white` | `iqp-white` | 2 |
| `kid-mar-del-plata-white` | `kid-chain-arrangement` | 10 |
| `london-wedge-black-counterplay` | `london-wedge` | 5 |
| `nimzo-doubled-c-pawns` | `doubled-c-pawns` | 8 |
| `open-centre-french-exchange-black` | `open-centre` | 9 |
| `open-centre-ruy-exchange` | `open-centre` | 3 |
| `philidor-passive-rook-convert` | `philidor` | 3 |
| `rook-4v3-same-side-hold` | `rook-4v3-same-side` | 24 |

**Sixteen of sixteen, at 2 to 24 firings. The D predicate holds today on every entry the classifier
assigns to it.** So the migration as specified writes sixteen clearances that `make graduation-clear`
demotes to `resolved` **on its first run**, with none of the described work done — and one of them is
inside acceptance criterion 3's own test population: `philidor-passive-rook-convert` carries both an
`assessment_grounded` entry and a `shape_firing` one, so its `transitions` would be **2, not the 1 the
criterion asserts** `[V]`. **The criterion this RFC wrote to prove the vocabulary is a bridge is the
criterion that catches it, which is the criterion working.**

**And `open-centre-ruy-exchange` shows why this is not a mis-assignment but a predicate defect.** Its
statement is *"The shape entry this pack references **fires on only three of its ten** authored
positions"* — a complaint whose subject matter **is the firing count** — and the predicate *fires on at
least one* is satisfied by the very number the statement objects to `[V]`. That is [[D451]]'s hazard
in one entry: **a criterion that passes while measuring nothing, where the nothing is the exact
quantity in dispute.**

> **Normative — the non-vacuity rule.** A `clearance` may not be **written** onto a `blocking` entry
> whose predicate **already holds** at the moment of writing. Stage A evaluates each candidate
> clearance before emitting it and refuses the vacuous ones; `make graduation-clear --check` performs
> the same evaluation over a committed corpus and raises
> **`GRADUATION_CLEARANCE_VACUOUS`** (error) for any `blocking` entry whose clearance re-derives as
> *holds*. Its home is the **graduation sweep**, not `validatePackDocument`: it needs the ledger and
> the census, which are §6.3's `checkSourcingFile` and checkout budgets, not the document budget.

**Three properties, and the third is why this is one rule rather than a kind-D patch.**

1. **It generalises past D.** The identical failure is available in A — §1.4(1)'s worked example is
   precisely *"a predicate that already holds on four packs today"* filed against an engine blocker —
   and in E, where §1.4(3) notes the author supplies the string the predicate compares against. One
   rule closes the family; a shape-specific threshold field would have closed one member of it.
2. **It does not contradict §4.1, it is §4.1's own logic run at write time.** The four
   `assessment_grounded` entries whose predicate already holds are the RFC's proof that the mechanism
   is real — **and they are `blocking` entries the migration deliberately leaves blocking so the
   *writer* clears them** (§6.2 Stage B). The rule's exemption is exactly that: **Stage A may write a
   clearance whose predicate holds only for an entry §4.1 names, and criterion 3 is the test that the
   exemption is those four and nobody else.** An exemption enumerated in the document is a different
   thing from an escape hatch.
3. **It converts a silent event into a loud one, which is the safe direction.** Without it the
   sixteen clear quietly and the first `make graduation-report` after landing shows sixteen fewer
   blockers with no work done — a wave of green checks that reads as progress, which §5.2 spends two
   pages warning against. With it, Stage A stops on sixteen entries and a human classifies them.

**What Stage A must then do with the sixteen, stated with a number so it is budgeted rather than
discovered.** They are hand-classified under open question 7's ratchet — the reviewer may move an entry
**toward `unbuilt` and never out of it** — and the RFC does **not** pre-assign them, because assigning
twenty-two statements from a keyword list is the exact move [[D434]] says manufactures its own answer.
What it does say is where they will land and why: the population divides by *what the statement is
about*, and only one of the three groups is a firing question at all —

| group | population | why the firing predicate does not decide it |
|---|---|---|
| the referenced **shape entry itself** is incomplete or ungrounded — *"carries its own UNGROUNDED provenance for all N of its plan descriptions"* (×3), *"this pack inherits that narrowing"* (×2), *"both Black plans … have null success signatures"*, *"has no plan for the back-rank skewer … commission an amendment"* | **7** | the debt is in `content/shapes/<id>.json`, which has **no `.evidence.json` sidecar, no `claimBindings`, and no sourcing instrument in this repository** `[V]`. That is an `unbuilt` shape, not a firing one |
| the pack's own `fenPredicate` / `plyHorizon` is **an authored hand copy** — *"THE FENPREDICATE IS A HAND COPY OF THE LIBRARY'S TRIGGER … nothing checks that"* | **4** | a string comparison, not a census read — `pointer_authored`, or `unbuilt` for the one that names the missing checker outright |
| the entry's **coverage** is the complaint — partial firing (3 of 10), an unverified `materialBalance` trigger, and an evaluator that *"has not been asked to"* run (×3) | **5** | a firing question, but never *"≥ 1"*: every statement names a quantity the *"at least one"* predicate cannot see |

`[V]` for the group populations (7 + 4 + 5 = 16). **The two entries §5.1b hand-assigned to D are the
only two in the corpus the predicate decides honestly**, and they decide *against*:
`black-fianchetto-the-light-bishop` fires in `nimzo-doubled-c-pawns` and **nowhere else**, and
`black-central-outpost` fires **nowhere in the corpus at all** `[V]` — so on
`london-wedge-black-counterplay` and `open-centre-french-exchange-black` the predicate correctly does
not hold, at `subject: /planClasses/2/shapePlan` and `/planClasses/1/shapePlan` respectively `[V]`.
**Kind D's honest population at landing is two entries plus whatever Stage A recovers from the five
coverage cases, and this RFC says so rather than shipping a cell that reads 24.**

### §3 Who may accept, and against what — without a reviewer

#### §3.1 The constraint, stated exactly

`rfc/archive/content-sourcing-foundation.md`'s reviewer sign-off was **struck 2026-08-13**.
`planning/content-era/plan.md` §3b carries the strike in its own heading (*"reviewer sign-off
struck 2026-08-13"*) and its body `[V]`:

> **The third route is struck (owner ruling, 2026-08-13).** This list previously ended with "a
> strong reviewer's explicit sign-off". **There is no pack review workflow and there never will be
> one.** A sign-off gate nobody performs is worse than an honest label, because a status nobody can
> grant implies a check that never happened.

And `planning/content-era/plan.md` §4 rewrote the exit criterion for the same reason: *"'Reviewed
and published' was the previous wording. Nothing is reviewed, so the exit criterion is grounding
coverage plus honest labelling of what could not be grounded"* `[V]`. `pack-validation.ts` carries
no `reviewers` check at all at HEAD — the published floor is `GRADUATION_REQUIRES_SOURCES` on
`provenance.sources` and nothing else `[V]`. The role is gone from the code as well as the process.

#### §3.2 The ruling: acceptance is authorized by a citation, not by a person

**Nobody accepts a blocker. A blocker becomes `accepted` by citing a decision that already exists.**
The authority is the cited ruling; the author's act is *pointing at it*, and pointing is
mechanically checkable — `GRADUATION_RULING_UNCITED` checks path existence, the `#L<line>` grammar
and, for `owner_ruling`, that the target file contains the quoted date `[V]`.

This is not a workaround for the missing reviewer. **It is the structure §3b already has**, written
down: §3b gives an assertion exactly two routes to grounding — a citable source, or an instrument
that bears on it — and then rules what happens to an assertion neither route reaches:

> an assertion that neither a source nor an instrument can reach **stays ungrounded, permanently
> and in writing**. It is named in the pack's own `graduationBlockers` and it does not become
> groundable by anyone reading it. `[V]`

Map that onto the states and the vocabulary falls out with no new role in it:

| §3b route | clearance kind | resulting state |
|---|---|---|
| an instrument that bears on the claim | A, B, D | `resolved` — predicate re-derives |
| a citable source | C | `resolved` — binding re-derives |
| the placeholder is replaced by authored text | E | `resolved` — pointer predicate re-derives |
| **neither route can ever reach it** | **G `unreachable`** | **`accepted`** — cite the ruling that says so |
| neither route reaches it *yet* | F `unbuilt` | **stays `blocking`** |

So the question *"who may accept"* has the answer **"the same authority that already writes owner
rulings, and only through the documents it already writes."** A new acceptance that needs a new
ruling requires the ruling to land in the living tier first — which is law 5's existing authority
structure, unchanged, with no second-party review anywhere in it.

##### §3.2a [cross-review] The back door is open, and the draft did not check it — `GRADUATION_RULING_UNCITED` is a *reachability* check, not an *authority* check

**No reviewer is reinstated. That part of §3 survives the attack intact** — the strike stays
struck, nothing in this RFC asks anyone to grant a status, and *"acceptance is citing a decision
that already exists"* remains the right shape. **But §3.2 rests the whole authority argument on
`GRADUATION_RULING_UNCITED`, and the shipped check is much weaker than the sentence implies.** Read
at `pack-validation.ts:838–858` `[V]`:

- **For `permanent_property` and `out_of_scope` there is no date check at all.** The whole test is
  `cited = existsSync(resolve(file))`. `rulingRef: "README.md"` passes. The 3 committed
  `permanent_property` entries cite `docs/tablebase-grounding.md`, which is honest — and nothing in
  the code distinguishes that from any other path in the repo.
- **For `owner_ruling` the date test is file-wide, not line-scoped.** `cited` requires
  `contents.includes(date)` where `date` is the first `20\d\d-\d\d-\d\d` in the author's **own
  `ruling` string** and `contents` is the entire cited file. The `#L<line>` half only asserts that
  `contents.split(/\r?\n/)[line - 1] !== undefined` — i.e. **that the file has that many lines.**
  The cited line is never compared to the quoted ruling.
- **The one file the `#L` grammar accepts is `planning/exploration/log.md`**
  (`file === "planning/exploration/log.md"` is a literal in the guard), and that log is
  **append-only by law 7 and appended to by every agent as the last step of every task.** An author
  who appends a dated entry — which the workflow *requires* — has thereby made
  `planning/exploration/log.md#L1` cite-able for that date.

Put together: **an author can write a ruling, land it in the living tier, and cite it in the same
wave, and every lint in this RFC passes.** That is exactly the *"an author writes a ruling then
cites it"* shape, and §3.2 as drafted does not notice it. `pack-graduation` **D242** — quoted in
§3.3 — states the standard this fails: *"a citation requirement is a real guard only when the honest
case can pay it cheaply and the dishonest case cannot pay it at all — **so verify payability before
ratifying the lint**."* The draft quoted the first clause and skipped the second, which is the
clause that asks for exactly this check.

**Ruling: the door stays open, deliberately, and is narrowed rather than closed.** Closing it needs
a second party, and there is none — that is §3.1's whole point, and inventing one here would
reintroduce the struck role through this RFC instead of through the front door. What is available
is to make the honest case cheap and the dishonest case **loud**, which is the D242 standard's
actual remedy:

1. **`accepted.rulingRef` must resolve to a document in the living intent tier or a dated log
   entry** — `planning/exploration/log.md#L<line>`, `planning/content-era/log.md#L<line>`,
   `design/0[0-6]-*.md`, or `docs/*.md`. Not `README.md`, not an `rfc/` draft, and **never a file
   introduced by the same commit that adds the acceptance**. The last clause is the operative one
   and it is mechanically checkable: `git log --diff-filter=A` on the cited path must predate the
   commit. Code: `GRADUATION_RULING_SELF_MINTED` (**error**).
2. **The `#L<line>` check must read the line, not count it.** The cited line's text must contain
   the ruling's quoted date. One-line change to the existing guard, and it turns a
   *"the file is long enough"* assertion into a citation.
3. **`permanent_property` and `out_of_scope` get the same date containment `owner_ruling` has.**
   There is no reason the two kinds that need no dated ruling are the two kinds a shrug reaches for.
4. **Acceptance stays visible in a diff** — `content/accepted-conditions.md` is regenerated and
   byte-checked, so every new acceptance is a reviewable line in a committed file `[V]`. That is
   the honest replacement for the reviewer and §3b already named it: *"what replaces the reviewer's
   assurance is not another assurance. It is the publication channel"* `[V]`.

Fixes 1–3 are added to §6.3. They do not make acceptance unreachable by a determined author; **they
make an author-minted acceptance require a self-minted ruling in a diff, which is the difference
between a shrug and a forgery.** Filed as **D418**.

##### §3.2b [author round] The three tightenings were tested against the attack they were written for. **They do not close it, and one of them is unpayable.** [[D425]]

**This section exists because the review asked for the tightenings to be *verified*, and D242's
second clause — *"verify payability before ratifying the lint"* — is the clause that produced §3.2a
in the first place. Applying it to §3.2a's own remedy is the same discipline one level down.** Each
tightening was run against the attack (*an author writes a ruling, lands it, and cites it in the same
wave*) and against all 43 committed acceptances.

| tightening | closes the attack? | payable by the honest case? |
|---|---|---|
| 1 — `rulingRef` in the living tier, and **the cited file not added by this commit** (`git log --diff-filter=A`) | **No.** `planning/exploration/log.md` was first added on **2026-08-09** (`8fb62692`) `[V]`. An author who *appends* to it adds no file, so the filter never fires | yes — 43 of 43 pass |
| 2 — the `#L<line>` arm must **read the line** and find the ruling's quoted date | **No.** An appended log entry's own `## 2026-08-16 …` heading contains the date the author then quotes. The check passes on the freshly-written line exactly as it passes on an old one | **yes, and verified**: line 1231 of `planning/exploration/log.md` is `## 2026-08-13 (owner rulings) — no review workflow; …` and contains `2026-08-13`; **40 of 40 `owner_ruling` entries pass** `[V]` |
| 3 — extend date containment to `permanent_property` and `out_of_scope` | **No**, same shape as 2 | **NO — it fails 3 of 3.** All three committed `permanent_property` rulings are **undated** (*"The runtime can offer perfect tablebase resistance only where a Syzygy provider is configured"*, *"An eleven-piece root is outside Syzygy's seven-piece boundary"*) and `docs/tablebase-grounding.md` contains **zero** date strings `[V]`. Ratifying it reddens acceptance criterion 6 on the landing commit |

**Tightening 3 is withdrawn and replaced.** Its premise — *"there is no reason the two kinds that
need no dated ruling are the two kinds a shrug reaches for"* — is right about the shrug and wrong
about the date: a `permanent_property` is a standing fact about the system, and a standing fact has
no date to contain. Demanding one would make the honest entries carry a fictitious date, which is
worse than the hole. **The replacement is an anchor, not a date:** `permanent_property` and
`out_of_scope` must carry a `#L<line>` anchor exactly as `owner_ruling` does, so that the *same*
line-level checks apply to all three kinds. Payability verified: `docs/tablebase-grounding.md:41`
carries *"It is published only when a tablebase provider is configured"* and `:3` carries *"the same
seven-piece boundary"* `[V]` — so the migration adds one `#L` token to three `rulingRef` strings and
authors nothing — **with one caveat this round must state rather than bury: `docs/tablebase-grounding.md`
is under uncommitted edit in the working tree right now (+11/−2)** `[V]`, so the migration must pick
its two anchor lines at landing rather than inherit `:3` and `:41` from this document. That is
`pack-graduation` **D246**'s rule (*"an RFC round that measures a moving tree must pin its commit and
re-check the lanes"*) applied to a line number instead of a version. The `#L` grammar's hard-coded
allow-list of one file (`file === "planning/exploration/log.md"`, `pack-validation.ts:853`) widens to
the §3.2a(1) list in the same change.

**The check that actually closes the door is a line-level `git blame`, and it is one call.**

> **`GRADUATION_RULING_SELF_MINTED` (error), normative form.** For an `accepted` entry whose
> `rulingRef` is `<file>#L<line>`, run `git blame --porcelain -L <line>,<line> -- <file>`. Raise
> when the blame commit is **the commit under review** or the all-zero sentinel
> `0000000000000000000000000000000000000000` (`author Not Committed Yet`), which is what `git blame`
> reports for a working-tree line `[V]`. For an anchorless `rulingRef` the file-level
> `git log --diff-filter=A` test of §3.2a(1) applies, and after the tightening above there are no
> anchorless `rulingRef`s left in the corpus.

**By which check the attack now fails: the blame arm.** An author who appends a dated ruling to
`planning/exploration/log.md` and cites `#L<n>` in the same wave is citing a line whose blame is
either the citing commit or `Not Committed Yet`, and **both raise**. Tightening 1's `--diff-filter=A`
arm never fires on that attack, and tightening 2's date arm passes it — so **the blame arm is not an
addition to the three, it is the one that does the work**, and the RFC would have shipped a guard
that catches nothing if the review's request to verify had been read as a formality.

**Payability of the blame arm, verified rather than asserted.** Line 1231 blames to `ee34f1e5`,
committed **2026-08-13** `[V]` — three days before any acceptance in this corpus — so **40 of 40
`owner_ruling` entries pass**, and after the anchor migration the 3 `permanent_property` entries cite
lines in a document last touched long before them. **Criterion 6 stays green and criterion 12 gains
its assertion.**

**What this does *not* do, stated so nobody reads it as more than it is.** The blame arm forces the
ruling into a **prior, standalone commit**. An author determined to mint one can still land the
ruling in commit *n* and the acceptance in commit *n+1* of the same wave. **That is the floor, and
it is not a defect of this design — it is §3.1's struck reviewer showing through.** Without a second
party there is no mechanism that distinguishes *the owner ruled* from *an agent wrote a ruling the
owner has not read*; what a mechanism can do is force the ruling to exist **as its own diff in the
living intent tier, reviewable on its own, before the pack that leans on it**. That is the D242
standard met exactly: the honest case pays one extra commit, the dishonest case pays a
standalone falsification of the owner's own log. **Calling that "closed" would be the convention-as-
mechanism error §Deviations says this review will not let the RFC make; calling it "narrowed to a
visible forgery" is the true statement.**

##### §3.2c [author round 2 — closes [[D467]]] The authoring-time rule and the runtime rule cannot be the same rule, and pretending otherwise is what §3.2b's own blame arm would have shipped

**The implementer's finding is correct and §3.2b earned it.** §3.2b specified the blame arm and then
assigned it — in §6.3's table — to `validatePackDocument`, which is the wrong side of a boundary that
this round had to go and read rather than assume. **The instruction that produced that assignment did
not ask where the check runs, and this section is the answer to the question that was skipped.**

**What the production image contains, read at the Dockerfile.** `apps/server/Dockerfile:21` opens a
**fresh** final stage (`FROM node:24.10.0-bookworm-slim`, nothing carried from the build context),
`:27` sets `WORKDIR /app`, and `:28–31` are the **only four** `COPY` lines in it:

```
28  COPY --from=build /app/apps/server/dist apps/server/dist
29  COPY --from=build /app/apps/web/dist   apps/web/dist
30  COPY --from=build /app/schemas         schemas
31  COPY --from=build /app/content         content
```

`[V]`. `:23–25` installs `netcat-openbsd` and `stockfish` and nothing else, so **there is no `git`
binary in the image** `[V]`. And `.dockerignore:1` is `.git`, which excludes the repository from the
**build context itself** — not merely from the final stage — so no `RUN` in the build stage could
reach the history either; `:8` excludes `content/drafts` `[V]`. The whole file is 8 lines.

**Three consequences, each verified at the symbol.**

1. **`validatePackDocument` has no base directory and never did.** Its signature is
   `validatePackDocument(value: unknown, options: { shapes?, packs?, principles?, compileObjectiveRules? })`
   (`pack-validation.ts:1255`) — **synchronous, and with no `root`/`repoRoot`/`cwd` member** `[V]`.
   So every repo-relative check inside it silently re-bases onto `process.cwd()`, which is `/app`.
2. **The defect D467 names is already shipped, one code earlier.** `GRADUATION_RULING_UNCITED`
   resolves its citation with bare `resolve(file)` and reads it:
   `:848 const absolute = resolve(file); :849 let cited = existsSync(absolute); :851 contents = readFileSync(absolute, "utf8")`
   `[V]`. **All 43 committed acceptances cite one of two paths — 40 × `planning/exploration/log.md#L1231`
   and 3 × `docs/tablebase-grounding.md`** `[V]` — and **neither `planning/` nor `docs/` is copied
   into the image** (`:28–31` above). `runtimeIssue` is severity **error** (`pack-validation.ts:142–148`)
   and `PackRegistry.load` throws `ServerError("PACK_INVALID")` on any error-severity issue
   (`pack-registry.ts:252`, `:258`) `[V]`, so a
   graduated pack carrying an acceptance would make the **server fail to boot** — not degrade, fail.
   **40 of the 56 draft documents carry at least one `accepted` entry** `[V]`, so this is not an edge
   case waiting on an unusual pack; it is the modal pack.
   It has never fired because `content/packs/` is empty and the only production document is
   `schemas/drill_pack.example.json`, whose `graduationBlockers` is `[]` `[V]`. **This is D237's
   *"a gate added before its first subject is free"* running in reverse: a gate that is wrong before
   its first subject is also free, and stays invisible until the day this RFC exists to bring about.**

   **Reproduced, not reasoned about — one `cd` is the whole experiment.** Running the built
   `apps/server/dist/pack-check.js` over `content/drafts/anti-caro-advance-early-c5.json` — one of
   the **40** draft documents carrying at least one `accepted` entry at HEAD `[V]`:

   ```
   $ node apps/server/dist/pack-check.js .../anti-caro-advance-early-c5.json   # cwd = repo root
   Pack check passed: .../anti-caro-advance-early-c5.json

   $ cd /tmp/anywhere && node .../pack-check.js .../anti-caro-advance-early-c5.json
   ERROR /provenance/graduationBlockers/0/accepted/rulingRef [GRADUATION_RULING_UNCITED]
     accepted condition citation does not resolve: planning/exploration/log.md#L1231
   ```

   `[V]`. **Same file, same bundle, same code — pass and error, decided by the working directory.**
   The production image's working directory is `/app` (`Dockerfile:27`), which is the second case.
   This is the reproduction criterion 15 turns into a test, and it is why *"move the `git blame`
   check"* would have been an incomplete answer: the check next to it was already broken in the
   same way.
3. **A Git dependency would be the first in the codebase.** The tree has exactly two
   `node:child_process` users: `engine-supervisor.ts:1`, which spawns a **declared runtime**
   dependency the image installs (`Dockerfile:24`), and `tools/verify-packaging.mjs:11`, which spawns
   `docker` and **was deliberately placed in `tools/` rather than in server code** `[V]`. The second
   is the precedent, and it points away from `validatePackDocument`.

**The ruling: two rules, two homes, two guarantees — stated separately because they are not the same
guarantee and a reader must not be able to mistake one for the other.**

| | **Runtime rule — *shape*** | **Authoring rule — *admission*** |
|---|---|---|
| Code | `GRADUATION_RULING_UNANCHORED` (error) | `GRADUATION_RULING_SELF_MINTED` (error) |
| Home | `validatePackDocument` (`pack-validation.ts`) | the graduation sweep — `graduationReport(roots, { verify: true })` and the `make verify` test that drives it |
| Inputs | **the document, and nothing else** | a Git checkout: `.git`, a `git` binary, and the living tier on disk |
| What it decides | `accepted.rulingRef` matches `<file>#L<line>` **and** `<file>` is in the §3.2a(1) living-tier allow-list | the cited **line** does not blame to the commit under review or to the all-zero `Not Committed Yet` sentinel |
| Where it holds | everywhere a pack is validated, **including the community channel and the production image** | only where the evidence exists: a developer checkout and CI |
| What it cannot do | tell an old ruling from one minted five seconds ago | run in production, ever |

**And the existing check moves with it, because leaving it behind would make this RFC honest and the
code it sits next to dishonest.** `GRADUATION_RULING_UNCITED` is split on the same seam it already
has in its own body: the **grammar arm** (`:842–844`, a regex over `rulingRef`) needs no filesystem
and stays in `validatePackDocument`; the **resolution and date-containment arms** (`:848–857`) move to
the authoring sweep, where `planning/` and `docs/` exist. `GRADUATION_CLEAREDBY_UNRESOLVED`
(`:860–865`) is withdrawn with `clearedBy` itself (§6.2) and takes its `existsSync` with it, and
`GRADUATION_CLEARANCE_BLOCKEDBY_UNRESOLVED` — its replacement — is an **authoring-side** code for the
same reason: a `blockedBy` naming `design/BACKLOG.md` or an `rfc/` path is checking a file the image
does not contain. **Net effect on `validatePackDocument`: it stops touching the filesystem for
graduation entirely**, and the only `node:fs` call left in it is the module-relative schema read at
`:91–94`, which resolves through `import.meta.url` into `/app/schemas` and is the one path the image
does provide `[V]`.

**The shape of the sweep, because "home: the graduation sweep" is not yet a callable thing and an
implementer would stop here.** `graduationReport` returns
`{ text, acceptedPage, legacy, graduable }` today (`graduation-report.ts:11`) — **no issues channel**
`[V]`. It gains one: in `--verify` mode the result carries
`issues: readonly SourcingIssue[]` (the shape `sourcing/check.ts` already uses), and the mode's exit
code is non-zero on any `severity: "error"`. **The default mode is unchanged and must stay
unchanged**, because `writeAcceptedConditions` regenerates a byte-checked committed file and §6.4
already forbids it acquiring an instrument dependency — so the admission codes fire **only** in
verify mode, and the three places that must therefore run verify mode are named: the
`graduation-report.test.ts` case that `make verify` reaches through `pnpm test`, `verify.yml`, and —
per criterion 16 — `release.yml`. **A code whose home is a mode nobody runs is D426's failure with a
new address.**

**Where the admission rule is actually enforced, and the gap this exposes.** `verify.yml:16` checks
out with `actions/checkout` and `:29` runs `make verify`, so a Git-bearing sweep is available on every
push. **`release.yml` is the hole**: `:17` checks out and `:24–33` hands the context straight to
`docker/build-push-action` — **it runs no content gate at all** `[V]`. So this RFC's landing includes
one workflow line: the graduation admission sweep runs in `release.yml` before the image is built.
Without it, the admission rule is enforced on pushes and not on the artefact that ships, which is the
same shape of gap D208 already records for `sourcing-check`.

**The official-versus-community question the review asked, answered rather than deflected.** Moving
the admission rule off the runtime path means **a community pack registered through `PackStudio` can
carry a self-minted acceptance and the server will not catch it.** That is a real weakening and it is
named. What bounds it is what §2.3b measured: `PackRegistry.addCommunity` (`pack-registry.ts:388–418`)
hard-codes `assessmentGrounding: "unverified"`, an empty `positionEvidence`, empty `boundClaimIds`
and empty `claimBackings`, and refuses to overwrite an `official` record of the same id `[V]`. **So
the community exposure is a false acceptance list and never false evidence** — the identical bound
[[D436]] states for a laundered `resolved`, reached by the identical route, which is a point in
favour of the reading rather than a coincidence. The **shape** rule still applies to community packs
at runtime, so a community `rulingRef` must still be anchored and must still name a living-tier
document; what it may lie about is *when the ruling was written*, and only an image with the
repository's history could ever have told.

**What this section refuses to do.** It does not add a `repoRoot` option to `validatePackDocument` so
the fs checks can "work in both places". That option would make the checks *silently* strong in a
checkout and *silently* weak in the image — one code name, two behaviours, no way for a reader of an
issue list to know which one they got. **Two rules honestly stated beat one rule that degrades in
production**, and the degrading version is precisely what the returned draft specified.

##### §3.2c-r [author round 3] Half of §3.2c is reversed, because [[D468]] was fixed by **packaging** while this document argued for moving code

**§3.2c's reasoning was right and one of its two conclusions is now wrong, and the difference is a
five-line Dockerfile diff that landed between rounds.** §3.2c reported D468 as a shipped defect and
concluded that `GRADUATION_RULING_UNCITED`'s **resolution and date-containment arms** must move out of
`validatePackDocument` into the graduation sweep, *"because that is where their evidence exists."*
**The evidence now exists in the image.** Read at HEAD:

```
28  COPY --from=build /app/apps/server/dist apps/server/dist
29  COPY --from=build /app/apps/web/dist apps/web/dist
30  COPY --from=build /app/schemas schemas
31  COPY --from=build /app/content content
32  COPY planning/exploration/log.md planning/exploration/log.md
33  COPY docs/tablebase-grounding.md docs/tablebase-grounding.md
```

`[V]`, and `tools/verify-packaging.mjs:88–99` asserts both lines verbatim with the messages
*"Production image must include the append-only ruling register used by pack admission"* and
*"Production image must include the permanent-property source used by pack admission"* `[V]`.
`WORKDIR` is `/app` (`:27`), so `resolve("planning/exploration/log.md")` inside `validatePackDocument`
now resolves to a file that is there. **`design/BACKLOG.md` records D468 as ✅ closed 2026-08-17 —
*"the production image carries both exact citation sources and packaging verification pins them"*** —
and that is the ruling, quoted rather than paraphrased.

**Consequence 1 — the resolution and date arms stay put.** Moving them out would now *remove* a
guarantee that packaging just bought, in the release that first serves acceptance-carrying documents to
learners. §6.3's table is corrected: `GRADUATION_RULING_UNCITED` is **not split**; both arms remain in
`validatePackDocument`, and its input budget for these arms is *the document plus the two pinned
citation sources*.

**Consequence 2 — the two-rule split survives, on its other half, and that half was always the load
bearing one.** `apt-get install` still fetches only `netcat-openbsd` and `stockfish` (`:23–25`), and
`.dockerignore:1` still excludes `.git` from the **build context**, so no stage can reach the history
`[V]`. **`git blame` cannot run in the image and never will**, so
`GRADUATION_RULING_SELF_MINTED` stays an authoring-side admission rule with a checkout budget. §3.2c's
table is right in its first and last rows and wrong in the row that moved `GRADUATION_RULING_UNCITED`.

**Consequence 3 — and this is the new obligation, because the fix that closed D468 is narrower than
the rule this RFC writes.** The image carries **two files by name**. §3.2a(1)'s allow-list is
`planning/exploration/log.md`, `planning/content-era/log.md`, `design/0[0-6]-*.md` and `docs/*.md` —
**four families, of which the image carries two members of one and one member of another.** So the
first acceptance citing `docs/branch-runtime.md` or `design/03-product-breadth.md` reproduces D468
**exactly**: `existsSync` fails, `runtimeIssue` is error, `PackRegistry.load` throws `PACK_INVALID`,
the server does not boot. **D468 is closed for today's corpus and open for the corpus this RFC exists
to enlarge**, and that is not a hypothetical: §3 makes citing a living-tier ruling the *only* route to
`accepted`.

> **Normative.** The set of paths a `rulingRef` may name is **one list with one writer.**
> `GRADUATION_RULING_ANCHOR_ROOTS` is exported from a single module; `GRADUATION_RULING_UNANCHORED`
> checks membership against it; **`tools/verify-packaging.mjs` asserts that every member is `COPY`ed
> into the image**, so adding a citable document is a Dockerfile line and a list entry in one commit,
> and forgetting the Dockerfile line is a red `make verify` rather than a red production boot.
> Criterion 15 is rewritten against this, and criterion 16 is withdrawn (§Acceptance criteria).

**What this episode is evidence of, stated because it is the third time the shape has appeared in this
document.** §3.2c reasoned correctly from the tree and reached a conclusion the tree then invalidated —
the same thing that happened to §0.1's `.dockerignore` premise and to §5.1's residue. `pack-graduation`
**D246**'s rule (*"an RFC round that measures a moving tree must pin its commit and re-check the
lanes"*) covers versions and lanes; **it does not cover an argument's premises**, and all three of this
document's reversals were premises rather than facts. That generalisation is a ledger row, not a
section.

#### §3.3 The one new obligation: an acceptance must state its unreachability, not its inconvenience

`accepted.kind` is already a closed three-value enum (`owner_ruling` / `permanent_property` /
`out_of_scope`), and `pack-graduation` §1.2 correction 2 found — correctly — that *"`kind` buys
nothing mechanically … all three collapse to one non-blank string."* The `rulingRef` fix closed the
*citation* half of that. This RFC closes the other half with one field:

**An `accepted` entry carries `accepted.unreachable`: the clearance kind the entry would have had,
had any route existed, plus why none does.** Concretely, `accepted` gains a required
`unreachableBecause` string and the existing entry keeps everything else:

```jsonc
{ "state": "accepted",
  "statement": "This position holds eleven pieces. Syzygy tops out at seven.",
  "accepted": {
    "kind": "permanent_property",
    "unreachableBecause": "material — the position is above the tablebase piece bound and always will be",
    "ruling": "…", "rulingRef": "docs/tablebase-grounding.md" } }
```

`GRADUATION_ACCEPTED_WITHOUT_UNREACHABILITY` (error) fires when the field is missing or blank. It
is still prose and a lint still cannot tell a real impossibility from a shrug — but it forces the
author to write the sentence that a reader can disagree with, in a file
(`content/accepted-conditions.md`) that is committed and byte-checked against a fresh run `[V]`. A
shrug that has to name the route it is refusing is a shrug that shows up in a diff.

**What this deliberately does not do:** it does not require the `unreachableBecause` reason to be
unique, novel, or approved. The 40 `owner_ruling` entries all quote the same 2026-08-13 ruling and
all take the same `rulingRef` (`planning/exploration/log.md#L1231`) `[V]`; they take the same
`unreachableBecause` too. **A citation requirement is a real guard only when the honest case can
pay it cheaply and the dishonest case cannot pay it at all — so verify payability before ratifying
the lint** (**D242**, quoted in full **[cross-review]**; the draft dropped the second clause, which
is the clause §3.2a then had to supply).

**[cross-review] Payability, verified rather than asserted, since D242 requires it.** The honest
case pays once: all 43 committed `accepted` entries already resolve (40 `owner_ruling` →
`planning/exploration/log.md#L1231`, 3 `permanent_property` → `docs/tablebase-grounding.md`) `[V]`,
and the migration adds `unreachableBecause` to each with no new citation, so criterion 6 is
reachable at zero authoring cost. **The dishonest case can also pay it** — that is §3.2a's finding,
and it is why §6.3 gains `GRADUATION_RULING_SELF_MINTED`. `unreachableBecause` itself is prose and
this RFC does not pretend otherwise; its whole value is that a shrug must **name the route it is
refusing**, in a regenerated, byte-checked file, and a named route is a thing a reader can
contradict.

### §4 What the shipped instruments already clear

#### §4.1 Four entries clear today, with no new work — measured

This is the RFC's proof that the mechanical half is real rather than projected. Four packs carry
the byte-identical entry *"The Syzygy root assessment is declared but not ledger-verified; no
sourcing sidecars were produced."* All four now have a sidecar, and the assertion is **stale**:

| pack | `objective.grading.assessedBy.kind` | `tablebase_result` records | `sourcing-check` at strict |
|---|---|---|---|
| `mate-k-q-technique` | `syzygy` | 27 | **passed (strict)** |
| `mate-k-r-technique` | `syzygy` | 25 | **passed (strict)** |
| `mate-two-bishops` | `syzygy` | 25 | **passed (strict)** |
| `philidor-passive-rook-convert` | `syzygy` | 25 | **passed (strict)** |

`[V]`, by running `apps/server/dist/sourcing-check.js` over each file. `check.ts:473` raises
`SYZYGY_ASSESSMENT_UNGROUNDED` at strict when `assessmentGrounding(...)` returns `"unverified"`
`[V]`; it raises for none of the four, which is the same statement as *the assessment is
`ledger_verified`*. Under §1.2 these four are `kind: "assessment_grounded"`, `subject:
"/objective/grading/assessedBy"` — and the checker moves them to `resolved` on its first run,
without an author writing a sentence.

**The honest counterweight, run in the same pass:** the entries asserting *"no engine pass has been
run on this pack"* are **all true** — **every one of those packs holds 0 `engine_eval` records**
`[V]`. Not one is stale. So the corpus's blockers are, with four exceptions, telling the truth —
which is the finding that makes this RFC a bridge rather than a cleanup, and it is the difference
between a **general-rot** claim (which would need an audit) and an **absence-of-recheck** claim
(which needs a re-derived predicate, i.e. this RFC). Only 32 of 50 packs have a ledger at all,
holding 391 `engine_eval` and 341 `tablebase_result` records between them `[V]`; **18 of 50 have
neither a `.evidence.json` nor a `.sources.json`** `[V]`, which is the same 18.

**[cross-review] The count `16` is ruleset-sensitive and the draft did not say which ruleset
produced it.** Re-derived at HEAD: **15** entries literally assert *"No engine pass/validation pass
has been run"*; widening to every blocking statement whose engine-absence is the operative claim
(`trajectory-caro-advance-chain-bishops`'s *"requires engine evidence this repo lacks"* and
`trajectory-qgd-exchange-minority`'s *"with no engine…"*) gives **17**, over 17 distinct packs. The
draft's 16 falls between two defensible readings and matches neither exactly. **The finding is
invariant across all three: 15, 16 or 17, the count of stale ones is zero** — `engine_eval` is 0 in
every one of the packs concerned, on every reading `[V]`. Quoted as a range because §5.1's standard
forbids quoting a hand-audited figure to the unit, and this is one.

#### §4.2 The mechanical half, per class

**[author round] The draft carried three different "mechanical" totals — 108 (A + B + D), 160
(adding C) and 180 (`clearable`, which is A–E) — and the cross-review's normative resolution kept
all three while renaming them. This section replaces that with one table and four numbers, because
"three totals, all correct for what they count" is exactly how a corrected figure dies in the
summary ([[D424]]).** Two words were doing three jobs and are now separated:

- **`clearable`** — a checker can *decide* the entry: kinds A–E. ~~179~~ **173 of 220** `[V]`
  **[author round 3]**.
- **`unclearable`** — no predicate exists: F + G. ~~41~~ **47 of 220** `[V]` **[author round 3]**.
- **machine-*decidable*** — A + B + D, the kinds whose evidence is a ledger record rather than
  prose. ~~113~~ **107 of 220** **[author round 3]**. This is the draft's 108, re-derived twice.
- **machine-*producible* unaided** — the sub-set a wave clears by **running a command over
  already-authored positions, writing no new prose**. **43 of 220**, and this is the number that
  matters to planning. The draft did not have it.

The gap between **107** and 43 is the whole of the cross-review's §4.2 finding, and the table below is
built to make it unmissable. **[author round 3] The gap widened and the 43 did not move**, which is
the only one of the four numbers planning consumes:

| kind | entries | what a wave must do first | what the instrument then does | Makefile target |
|---|---|---|---|---|
| B (engine) | 38 | **nothing** | Stockfish walk → `engine_eval` records | `make verify-draft`, `make engine-walk` |
| A (assessment) | 5 | **nothing** | Syzygy walk → `tablebase_result` + `assessmentGrounding` | `make verify-draft`, `make tablebase-walk` |
| D (shape) | ~~24~~ **18** | commission or author a **shape entry** whose trigger names the geometry — **[author round 3]** and the six entries that name *no* entry at all are `unbuilt`, not this row (§1.2c) | `runExpressionCensus` firings / `checkShapeFile` | `make expression-census`, `make shape-check` |
| B (corpus) | 46 | author a **quantified sentence** as a `feedbackClaim`, and add the explorer rationale line to `provenance.sources` | Lichess explorer → `explorer_position_census` **and** the `claimBindings` entry, one atomic write | `candidate-attach PIPELINE=explorer` |

**The top two rows clear by running an instrument, not by asserting one was run** — a wave runs the
walk, the checker re-derives, and the entry demotes from `blocking` on its own. **No wave commit
needs to edit a blocker's state by hand**, which removes the class of error `pack-graduation` §4.3
measured at length (ten entries whose ALLCAPS status marker inverts their meaning). **The bottom two
rows do not**, and the RFC now says so in the same table rather than in a correction below it.

**[cross-review] The corpus row is the one that was priced wrong, and it is 46 of the 113.**
`explorer_position_census` records have exactly one producer in the
tree — `attachExplorerEvidence` (`sourcing/explorer.ts:268`) — and it is not a walk. Read at
`explorer.ts:232–250` `[V]`, it refuses to run unless **all** of the following already hold:

| refusal | what it demands the author do first |
|---|---|
| `CANDIDATE_NOT_CLEAN` | the pack already passes `checkSourcingFile` at **strict**, sidecars and all |
| `ATTACH_TARGET_FORBIDDEN` | `--target` is an existing `/feedbackClaims/<i>/text` — a claim must already be authored |
| `ATTACH_SPAN_REQUIRED` | `--span` names a substring of that claim and `--field` names what settles it; *"pack prose is never generated or overwritten"* |
| `ATTACH_SOURCE_LINE_MISSING` | `provenance.sources` already contains the verbatim explorer rationale line |

So a corpus blocker clears only if the pack **already contains a quantified sentence** the explorer
can settle. *"Which reroute is more common is unquantified"* names no span, because the number it
asks for is not in the file. **Writing that sentence is authoring, and the instrument is explicitly
built to refuse to write it.** Two consequences the draft should have drawn:

1. **B (corpus) and C (`claim_bound`) are not independent kinds for the corpus half — one command
   satisfies both.** `attachExplorerEvidence` writes the `explorer_position_census` record **and**
   the `claimBindings` entry in the same atomic write (`explorer.ts:268–273`). §4.3 prices C as
   *"mechanizable and not cheap"* and the draft's §4.2 priced B-corpus as cheap; **they are the same
   work, priced twice, in opposite directions.** The 46 belong with the 55, not with the 38.
2. **18 of 50 packs have no ledger and no manifest at all** `[V]`, so for those the explorer path
   does not begin: `readJson` on both sidecars precedes every check above.

**[author round] The honest accounting, stated once and used everywhere below.** The 220 blocking
entries partition into four costs, not two, and the partition is arithmetic rather than judgement:

| cost | kinds | entries | what it takes |
|---|---|---|---|
| **run a command, write nothing** | A + B(engine) | **43** | a Stockfish or Syzygy walk over positions the pack already holds |
| **commission a shape entry, then a command** | D | ~~24~~ **18** | someone must name the geometry before the census can fire on it |
| **author prose, find a source, then a command** | B(corpus) + C | **101** | the corpus and claim-binding classes are **one class**, satisfied by one atomic write |
| **replace a placeholder with authored text** | E | **11** | a string comparison proves the placeholder is gone and nothing more (§4.3) |
| **cannot clear here at all** | F + G | ~~41~~ **47** | **38** wait on an instrument that does not exist; 9 are `unreachable` and are candidates for `accepted` (§3) |

43 + **18** + 101 + 11 + **47** = **220** `[V]` **[author round 3]**.

**[author round 3] One warning about the 43 that this round can raise and cannot settle, and it is
raised because leaving it out would repeat §5.2a's mistake.** [[D518]] landed 2026-08-17 measuring the
*neighbouring* wave with exactly this table's method and finding it collapsed: *"the explorer wave is
**0 of 60 mechanical, not 22 of 60** … `attachExplorerEvidence` requires an `EXPLORER_RATIONALE` entry
in `provenance.sources` and **0 of 50 packs carry one**"*, and separately *"**all 18 ledger-less packs
declare `assessedBy.kind` of `(none)`/`authored`**, so `verifyDraft` refuses every one, and there is no
mechanical route to those sidecars either."* **The first half corroborates this table** — it is §4.2's
own B(corpus) finding, measured again and harder. **The second half is a live question this table does
not answer:** the **43** is a count of *kinds*, and D518 measured that a walk cannot begin on 18 of the
50 packs. **This round did not re-derive how many of the 43 sit on those 18 packs and does not claim
the number is unaffected.** It is flagged here, at the figure it would move, rather than discovered by
the wave that plans against it — because *"a cost table is a claim about what a command will do, and
the only honest way to price it is to run the command"* is the lesson §5.2a already paid for once. **The draft counted the 46 corpus entries twice in opposite
directions — once as cheap instrument work in §4.2 and once as expensive citation work in §4.3 —
and the table above is the correction, not a restatement of it.** That double count is why §5.2's
*"graduates on instrument runs alone"* population collapses to zero: **there is no authored pack
whose blocking set is a subset of the 43**, and a pack needs its whole set cleared, not its cheapest
member.

#### §4.3 What the instruments cannot see, priced

`claim_bound` (**55** entries, the largest single kind — **101 [author round]**, once §4.2's 46
corpus entries are priced where their work actually is) is mechanically checkable and **almost
entirely unpaid**: 1 of 32 ledgers carries `claimBindings`, and the census reports **1 backed claim
of 196** `[V]`. D267 measured that a 22-pack citation pass moved the checker by zero. So the 101 are
*mechanizable* and are not *cheap*, and this RFC does not let the first word stand in for the
second. Each needs a source found by a human, attached to a pointer, and digested — the mechanism
exists (0.26) and the work does not. **101 of 220 is 46% of the corpus's blocking population sitting
in one cost class, and it is the number a content wave should be planned against.**

`pointer_authored` (**11** entries) is the weakest predicate in the vocabulary and is stated as such: a
string comparison can prove a placeholder is *gone*; it can never prove what replaced it is *true*.
**[cross-review] And it is weaker still than that, because the author supplies the string it
compares against** — see §1.4(3), which makes `clearance.placeholder` required and sources it from
the emitter template rather than from a later author's choice. Law 8 forbids closing the remaining
gap with generated judgement, and this RFC does not try.

### §5 What cannot clear, quantified

#### §5.1 The classification and its residue

The class counts above come from an ordered first-match keyword ruleset over the `statement` of all
220 blocking entries, evaluated in the order `unbuilt → corpus → citation → engine → tablebase →
shape → authored`. **Ordering matters and the order was chosen to be safe rather than flattering:**
`unbuilt` is tested first, so any entry that mentions a missing instrument is counted as
unclearable even when it also mentions an engine pass. **[author round] 17 entries match no rule**
(the draft said 12, from an audit that was never published) and are **hand-classified in §5.1b, not
defaulted** — open question 4's ruling. `pack-graduation` **D245**'s lesson applies
directly — *"a proxy built to be loose cannot also be cited to the unit"* — so these figures are
**a hand audit with a stated ruleset, not a measurement**, and the only numbers in this RFC quoted
to the unit are the ones a command printed.

**[cross-review] The ruleset is not in fact stated, and this section claims it is.** §1.2 says the
classification is *"stated in §5.1 with its residue"*; §5.1 states the **order** of seven rules and
**none of their keywords**, and defers the residue to *"the planning directory at implementation"*.
So no reader can reproduce 108, 52, 40, 28 or 12, and no reviewer can check them — which is exactly
the failure D245 names, one level up: the draft applied D245's honesty label to figures whose
derivation it withheld. Two obligations, both cheap and both **landing requirements, not
follow-ups** — **[author round] both discharged below in §5.1a and §5.1b, and five of the six
figures in the sentence above changed when they were**:

- **The seven rules ship as a literal.** The keyword list per rule goes in this RFC (or in a
  checked-in `tools/` classifier the migration commit runs), so the counts are re-derivable by a
  second party from the document alone.
- **The 12 residue entries are listed here, by pack id and statement, before this RFC is accepted.**
  They are 12 rows. Open question 4 turns entirely on them — it asks the owner to rule on the
  default for a population the document never shows — and **an owner cannot rule on a residue they
  cannot see.** Sampled at HEAD by the reviewer, the residue is dominated by *format-gap* and
  *missing-runtime-surface* statements (*"the drill has no fifty-move counter surfaced"*, *"the
  variants rule has no encoding"*, *"first-move alternatives cannot be deviations in a
  `follow_theory` pack"*, *"`pack-check` raises `PLAN_SIGNATURE_INLINED` … and the checker both
  demands and refuses the alternative"*) — every one of which is **`unbuilt`, not `unreachable`**.
  That measurement answers open question 4; see the ruling recorded there.

##### §5.1a [author round] The ruleset, published

Both obligations are discharged here. **This is the RFC's acceptance gate and nothing below it is
new argument — it is the arithmetic every count above now rests on.**

The classifier takes each blocking entry's `statement`, lowercases it, and returns the **first**
rule any of whose keywords appears as a substring. Keywords are matched literally, case-folded, with
no stemming and no word boundaries — a deliberately crude instrument, which is why §1.2 keeps the
*hand audit* label. A statement matching no rule is **residue** and is hand-classified in §5.1b.

```
rule 1  unbuilt      → F   "no machine-readable evidence slot" "has no encoding" "no format slot"
                           "nothing in the format" "the format still cannot" "the format should"
                           "cannot be deviations in a follow" "fifty-move" "perfect_tablebase"
                           "human-play evidence" "no human play" "maia"
                           "unmeasurable with anything in this repository" "plan_signature_inlined"
                           "no corpus instrument reaches" "wave-2 friction" "no shipped instrument"
                           "authoring substitute" "becomes expressible" "cannot express"
                           "nothing in this repo" "no evidence in this repo"
                           "no shape-library entry" "no shapes reference"      # [author round 3]

rule 2  corpus       → B   "explorer" "unquantified" "more common" "scores better" "scores best"
                           "most common" "rating band" "these bands" "at band" "frequency claim"
                           "corpus measurement" "corpus evidence" "corpus-checked" "family root"
                           "popularity" "unmeasured" "abstention floor" " games"

rule 3  citation     → C   "citable" "uncited" "unbacked" "no named source" "citation pass"
                           "cited 2026-08-16" "no source" "model knowledge" "without a citation"
                           "authored consensus" "still live after the 2026-08-16 pass"
                           "the cited source"

rule 4  engine       → B   "engine-checked" "engine pass" "no engine" "engine evidence"
                           "engine validation" "engine-checkable" "depth 22" "depth-22"
                           "unevaluated" "unsettled by evaluation" "no evaluation"
                           "engine and/or corpus evidence" "not the evaluation" "centipawn"

rule 5  tablebase    → A   "syzygy" "tablebase" "ledger-verified" "assessedby"

rule 6  shape        → D   "shape entry" "shapes reference" "shape library" "shape-library"
                           "shape reference" "shapeplan" "structural-feature vocabulary" "trigger"
                           "fenpredicate" "named_structure"

rule 7  authored     → E   "agent-authored" "is authored" "are authored" "authored doctrine"
                           "authored claim" "authored prose" "hand-derived" "hand-counted"
                           "hand copy" "placeholder" "authoring choice" "authored w"
                           "hand-authored" "stays authored" "authored assessment"
                           "remains authored" "authored liquidation" "authored spine"

(no match)           → G   residue; hand-classified in §5.1b, never defaulted
```

Rule output over the 220 blocking entries in `content/drafts/`, before the hand pass:
**unbuilt 35, corpus 46, citation 54, engine 37, tablebase 5, shape 16, authored 10, residue 17**
`[V]`, summing to 220.

**[author round 3] Two keywords were added to rule 1 and they are the whole of [[D503]]'s classifier
half.** The previous output was *"unbuilt 29 … shape 22"* — reproduced first, byte-for-byte, at HEAD
before anything was changed `[V]` — and adding `"no shape-library entry"` and `"no shapes reference"`
moves **exactly six** entries, the six §1.2c names, and nothing else `[V]`. **Three properties make
this a rule change rather than a per-entry amendment**, which criterion 11 and open question 7 both
forbid:

1. **Both keywords are negations naming a missing artefact**, which is rule 1's stated shape
   (*"every one names a thing someone would have to build"*). Neither names a pack.
2. **They were tested against the alternative and the alternative over-reached.** The single keyword
   `"commission"` matches **7** entries, not 6: it also claims
   `philidor-passive-rook-convert`'s *"the philidor shape entry has no plan … Commission an
   amendment"*, whose pack **does** carry a `shapes` reference `[V]`. That entry is a §2.5 group-1
   case for Stage A to classify, not a `shapes`-less one, so the broader keyword would have been the
   easier change and the wrong one.
3. **The residue is unmoved at 17 and is the same 17**, in the same order, so §5.1b needs no
   re-enumeration `[V]`. A rule addition that perturbed the residue would have been re-deriving the
   hand table by accident.

**And the classifier is not what makes D503 safe — §1.2c's grammar is.** If a later corpus writes a
seventh *"commission a shape entry"* statement in words rule 1 does not match,
`GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL` still refuses the `shape_firing` clearance, because the
pack has no `/shapes/0` to point at. **The keyword makes the migration quiet; the lint makes it
correct**, and the previous rounds' error was to have only the first kind of guard.

**Three properties of this ruleset are the design and are worth stating, because a later reader will
otherwise think it is sloppy where it is deliberate.**

1. **Rule 1 runs first and is broad, so `unbuilt` wins ties.** `opening-principles-white` carries an
   `ENGINE-CHECKED 2026-08-15` statement that also says the practical-difficulty half *"needs Maia or
   corpus evidence"*; rule 1 claims it `[V]`. That is the safe direction by construction: `unbuilt`
   blocks permanently and **can never be accepted** (§2.4), so a tie resolved to F costs a delay,
   while a tie resolved to G opens the laundering channel §1.2 exists to close.
2. **Rule 7 runs last for the same reason in reverse.** `pointer_authored` is the weakest predicate
   in the vocabulary (§4.3), so it may only claim statements no instrument keyword reached. Its
   keywords are phrases, never the bare token *authored* — which would otherwise capture
   `immediate-guard.browser`'s *"do not publish as authored chess content"*, a permanent refusal, as
   a placeholder debt `[V]`.
3. **The ruleset assigns a *candidate* kind, and Stage A writes every assignment into the commit as
   a reviewable diff (§6.2).** It is a lead, not a verdict, and §1.4(1) already states the limit no
   lint closes: matching a prose statement to a predicate stays an author's judgement. The visible
   evidence for that limit is inside this very run — the four *the guard threshold (Ncp) encodes an
   authored claim … no play-test evidence supports the number* entries split **2 to E, 1 to
   B(corpus) and 1 to the residue** on wording alone `[V]`, even though all four record the same
   debt: `conversion-up-a-piece` and `opponent-intent-early-queen` match `authored claim`;
   `opening-principles-white` says *"an authored hypothesis about a rating band"* and is claimed by
   rule 2; `opening-principles-black` says *"no corpus or play-test evidence"* and matches nothing.
   **That split is the argument for publishing the ruleset rather than against it:** it is a
   one-word diff to see, where the unpublished audit's version of it was invisible.

##### §5.1b [author round] The residue, enumerated and classified — open question 4's acceptance gate

**The published ruleset leaves 17 residue entries, not 12.** The 12 was the draft's figure from the
unpublished audit; it could not be checked, and it is not what a stated ruleset produces. **All 17
are listed here with a hand-assigned kind, per open question 4's ruling that the residue is
classified rather than defaulted.** Statements are abbreviated; the `id` is the pack's own and is
exact.

| # | pack | entry `id` | statement (abbreviated) | kind | why |
|---|---|---|---|---|---|
| 1 | `berlin-queenless-press` | `the-objective-s-achieved-signature-is-satisfied-at-none-` | *"the achieved signature is satisfied at none of the eleven authored positions … nothing in this file shows a learner what success looks like"* | **F `unbuilt`** | the discharge is a format surface that shows a target reached past the authored boundary. Someone could build it |
| 2 | `carlsbad-minority-attack` | `all-four-feedbackclaims-need-grounding-minority-target-a` | *"All four feedbackClaims need grounding … a hypothesis that a comparison corpus could actually test"* | **C `claim_bound`** | it is four claims wanting sources. Compound by construction — see open question 5 |
| 3 | `grunfeld-exchange-fianchetto` | `no-timing-window-is-declared-and-the-measurement-that-de` | *"No timing window is declared, and the measurement that decided it is recorded here … The structure has a lever but not a race with room in it"* | **G `unreachable`** | the measurement was taken and it decided against a window. No instrument run and no source changes that; the condition stands |
| 4 | `grunfeld-exchange-fianchetto` | `the-objective-s-achieved-signature-is-satisfied-at-none-` | as row 1, over seven positions | **F `unbuilt`** | same missing surface as row 1 |
| 5 | `immediate-guard.browser` | `testing-fixture-only-do-not-publish-as-authored-chess-co` | *"Testing fixture only; do not publish as authored chess content."* | **G `unreachable`** | §0.4 — a permanent refusal, Stage C migrates it to `accepted` / `out_of_scope` |
| 6 | `iqp-black-tarrasch-defence` | `this-pack-declares-no-timing-window-the-measured-reason-` | *"the blockading knight is already on d4 … there is no arrival to race"* | **G `unreachable`** | as row 3 — a property of the start position, not a debt |
| 7 | `london-wedge-black-counterplay` | `correction-after-d347-the-preceding-boundary-predicate-b` | *"The checker/runtime disagreement is closed … The hand copies remain content debt, not a format impossibility"* | **E `pointer_authored`** | the statement itself rules out `unbuilt` in its last clause. The remaining debt is hand-copied predicate text |
| 8 | `london-wedge-black-counterplay` | `one-plan-class-is-listed-and-never-satisfied-black-fianc` | *"black-fianchetto-the-light-bishop's signature is false at every authored position"* | **D `shape_firing`** | a plan-class signature that fires on no position is exactly D's negative, and `runExpressionCensus` already reports it. **[author round 3]** `subject: /planClasses/2/shapePlan` = `{shape: "london-wedge", plan: "black-fianchetto-the-light-bishop"}`; that signature's `coverage.corpus.packs` is `[{id: "nimzo-doubled-c-pawns", count: 8}]` — **zero firings in this pack, so the predicate correctly does not hold** `[V]` |
| 9 | `open-centre-french-exchange-black` | `two-of-the-three-plan-classes-are-never-satisfied-on-thi` | *"black-central-outpost is false throughout … black-neutralize-and-level is false throughout"* | **D `shape_firing`** | as row 8. **[author round 3]** `subject: /planClasses/1/shapePlan`; `black-central-outpost` fires **nowhere in the corpus** (`NEVER_FIRES_IN_CORPUS`) and `black-neutralize-and-level` fires in 15 packs, none of them this one `[V]` |
| 10 | `open-centre-ruy-exchange` | `this-pack-declares-no-timing-window-the-measured-reason-` | *"the corpus shows the recapture is forced (269 of 269) … A window here would be an invention"* | **G `unreachable`** | as row 3, and this one states its own unreachability in the last sentence |
| 11 | `opening-principles-black` | `the-guard-threshold-250cp-encodes-the-same-authored-band` | *"no corpus or play-test evidence supports the number"* | **F `unbuilt`** | *play-test evidence* names an instrument this repo does not have. Its three siblings landed 2 in E and 1 in B(corpus) on wording alone — see §5.1a(3) |
| 12 | `outcome-hold.browser` | `test-only-fixture-never-publish-as-chess-content` | *"Test-only fixture; never publish as chess content."* | **G `unreachable`** | §0.4 |
| 13 | `outcome-resist.browser` | `test-only-fixture-never-publish-as-chess-content` | *"Test-only fixture; never publish as chess content."* | **G `unreachable`** | §0.4 |
| 14 | `rook-4v3-same-side` | `the-w-ra8-w-ra7-line-asserts-that-1-rd2-concedes-a-pawn-` | *"1…Rd2 concedes a pawn move to the back-rank check … it is unverified"* | **B `ledger_record`** (engine) | a concrete tactical line at nine pieces. A Stockfish walk settles it; nothing else needs authoring |
| 15 | `scandinavian-mainline-black` | `the-pack-s-central-corpus-claim-that-black-s-56-7-and-58` | *"… reflect the race rather than selection effects in who plays the Scandinavian — is an interpretation of the frequency data, not a measurement of it"* | **G `unreachable`** | the explorer cannot separate causation from selection in its own aggregate. That is a property of the data, not a missing tool |
| 16 | `stated-reasoning.browser` | `testing-fixture-only-do-not-publish-as-chess-instruction` | *"Testing fixture only; do not publish as chess instruction."* | **G `unreachable`** | §0.4 |
| 17 | `trajectory-legs.browser` | `mechanical-acceptance-fixture-only-it-asserts-no-chess-p` | *"Mechanical acceptance fixture only; it asserts no chess phase truth."* | **G `unreachable`** | §0.4 |

**The residue splits 3 F / 1 C / 2 D / 1 E / 1 B(engine) / 9 G**, and the nine `unreachable` are
**five browser fixtures plus four real findings** — three *the measurement was taken and there is no
race here* entries and one *the explorer cannot separate causation from selection* entry `[V]`.

**This is the measurement open question 4 asked for, and it cuts both ways against the draft.** The
cross-review's ruling — *do not default to `unreachable`* — is **confirmed**: 8 of the 17 are not
`unreachable`, and defaulting would have put a missing format surface, a plan-class signature and a
Stockfish-settleable tactical line into the one bucket eligible for `accepted`. But the reviewer's
characterisation of the residue as *dominated by format gaps* is **an artefact of the draft's
narrower `unbuilt` rule**: the four statements it sampled (*fifty-move counter*, *variants rule has
no encoding*, *`follow_theory` first-move friction*, `PLAN_SIGNATURE_INLINED`) are **all matched by
rule 1 in the published ruleset and are therefore not residue at all** `[V]`. They were residue only
because the rule that should have claimed them was never written down. **Publishing the ruleset
moved them out of the dangerous bucket without anyone having to remember to.**

**Only four `unreachable` entries in the whole corpus are chess-substantive**, and each will need an
`accepted.rulingRef` and an `unreachableBecause` under §3.3 before it can leave `blocking` — which
is exactly the cost §3 intends, applied to a population small enough that an owner can read all of
it.

#### §5.2 Packs that cannot graduate without new authoring

Partitioning the 56 documents in `content/drafts/` by the classes their blocking entries fall in:

**[author round] Re-derived from the published ruleset (§5.1a) plus the hand pass (§5.1b). Three of
the four rows moved and the third row's population doubled.**

| Population | Documents | Reading |
|---|---|---|
| Zero blocking entries | **1** | `line-boundary.browser.json` — a fixture, excluded by suffix (§0.4) |
| Blocked **only** by kinds A, B and D | **5** | `anti-french-advance-white`, `anti-london-black`, `italian-center-attack-white`, `kid-classical-black`, `london-system-white`. ~~These graduate on instrument runs alone~~ — **still refuted**: all five carry a B(corpus) or D entry, and §4.2 shows both need authoring before any command runs |
| Blocked by at least one `unbuilt` entry | ~~27~~ **28** | cannot graduate until an instrument that does not exist ships |
| Blocked by authored / citation kinds only (C, E, G) | ~~23~~ **22** | of which **5 are browser fixtures** (§0.4) → ~~18~~ **17 authored packs** |

**[author round 3] One pack moved and it is nameable: `scandinavian-mainline-black`.** Its
*"NO shapes reference … a third shape entry is hereby commissioned"* entry was the only shape-classed
blocker it carried, so under §5.1a's corrected rule 1 it acquires its **first** `unbuilt` entry and
crosses from the authoring-bound half into the instrument-bound one `[V]`. The other five D503 packs
already carried an `unbuilt` entry and did not move. **The row that decides the headline —
*packs blocked only by A and B(engine)* — is still 0 of 50** `[V]`.

`[V]` for the partition arithmetic (1 + 5 + **28** + **22** = 56); the class assignment inside it is §5.1a's
ruleset plus §5.1b's hand pass. **The number that decides the headline is not in this table**: it is
*packs blocked only by kinds A and B(engine)* — the only combination a command clears with no
authoring at all — and that count is **0 of 50** `[V]`.

**So the answer to *how many packs cannot graduate without new authoring* is 50 of 50 authored
packs**, and the two halves are different problems: **28 carry at least one `unbuilt` blocker** and
cannot graduate however much authoring is done (tablebase opponent selection, the game-level tempo
corpus of **D155**, Maia practical difficulty, missing runtime surfaces, format gaps, **and — new this
round — six packs waiting on a shape entry nobody has commissioned**), while the
remaining **22 are authoring-bound only** — a human must write chess judgement or find a source, and
**2 of those 22 additionally carry an `unreachable` entry** that needs a cited ruling before it can
leave `blocking`: §5.1b rows 3, 6, 10 and 15 sit on four packs, and **two of the four are now in the
28** — `grunfeld-exchange-fianchetto` (its own row-4 residue is `unbuilt`) and
`scandinavian-mainline-black` (the D503 move), leaving `iqp-black-tarrasch-defence` and
`open-centre-ruy-exchange` `[V]`. **The draft said 3 of 23 and one of four; it is 2 of 22 and two of
four.**

**[author round] The split is 27 / 23, and the cross-review's 23 / 27 was the same partition
computed with a narrower `unbuilt` rule.** The direction is unchanged — both halves are large, and
neither is the one a wave can simply run — but the *instrument-bound* half is now the **larger** one,
which matters because it is the half no content wave can move at all. A planner reading 23/27 would
budget authoring; a planner reading 27/23 knows that more than half the corpus needs an RFC before it
needs an author.
**[author round 3] It is now 28 / 22, and the sequence is the finding rather than the number.** The
same partition has read 23/24, then 23/27, then 27/23, and now 28/22 — **four values across three
rounds, every one of them computed from a different `unbuilt` rule, and only the last two from a rule a
reader can run.** The direction has never changed and the magnitude has moved by five packs; **the
lesson is [[D434]]'s, and the guard is criterion 11, which is the only thing that has stopped this
number from moving a fifth time unnoticed.**

##### §5.2a [cross-review] The 3-pack claim is refuted, entry by entry — the honest number is 0

The three packs' blockers were re-read at HEAD against the instruments that would have to clear
them. **None of the three graduates on instrument runs alone**, and two of the nine blockers
contradict the draft's own text elsewhere:

| pack | blocker | why an instrument run does not clear it |
|---|---|---|
| `anti-french-advance-white` | *"ENGINE-CHECKED 2026-08-15: 4.dxc5 evaluates −0.39 against +0.29 … **the class itself stays objective-relative and unsettled by evaluation**"* | The engine pass **already ran**. The entry survives it by construction and says so. Re-running the engine cannot clear a blocker whose statement is *"evaluation does not settle this"* |
| `anti-french-advance-white` | *"the d4 attacker/defender counts … the structural-feature vocabulary **could express and check this count and has not been asked to**"* | D `shape_firing` needs a **named shape entry**; none exists. Authoring one is authoring |
| `anti-french-advance-white` | *"'their prep is longer' … a plausible hypothesis with no corpus measurement"* | The claim `their-prep-is-longer` is `author_principle` + `hypothesis`. `MACHINE_LABEL_EVIDENCE_KINDS` (`claim-binding.ts:168`) maps only `corpus_observed` / `engine_validated` / `tablebase_exact` to record kinds `[V]` — **a `hypothesis` claim is unbackable by construction** until its type and text are rewritten |
| `kid-classical-black` | *"which reroute … the explorer API could settle it below the family root"* | No authored claim carries the number, so `--span` names nothing (§4.2) |
| `kid-classical-black` | *"no corpus measurement of **tempo-vs-result in KID races** exists in this repo"* | This is **D155's game-level tempo corpus** — an instrument this RFC's own §5.2 lists among *"an instrument that does not exist"*. **The pack belongs in the instrument-bound half, and the draft put it in the 3.** **[author round]** §5.1a's rule 2 assigns it `B(corpus)` on the token `corpus measurement`; the divergence is stated under §5.2 rather than patched into the ruleset |
| `leningrad-dutch-black` | *"the 'one-break counting rule' … authored doctrine with no source; the structural-feature vocabulary **has not been asked to**"* | Same as row 2: no shape entry exists |
| `leningrad-dutch-black` | two *"which finisher / which order … is unquantified"* entries | Same as row 4 |

And a precondition kills all three independently of the above: **none of the three packs carries
the explorer rationale line in `provenance.sources`** `[V]`, so `attachExplorerEvidence` throws
`ATTACH_SOURCE_LINE_MISSING` before it queries anything. That line is a pack edit.

**Corrected statement, which is the one planning should consume: 0 of 50 authored packs graduate on
instrument runs alone; 50 of 50 need new authoring.** The 47/3 split does not survive.
**[author round] The split of *kinds* of remaining work survives and inverts: 27 wait on an
instrument that does not exist, 23 wait on a human to write chess judgement or find a source**
(§5.2). `make graduation-report`
prints `(none)` today and will still print `(none)` on the day this RFC lands — which acceptance
criterion 8 already anticipated in its hedge (*"plausibly still `(none)`"*) while §5.2 and D409
asserted otherwise. **The criterion was right and the headline was wrong.**

**[author round] The three named packs are refuted twice over, and the second refutation is
stronger than the first.** §5.2a's entry-by-entry reading stands unchanged. But the published
ruleset also **reclassifies the population itself**: `leningrad-dutch-black` is no longer in the
*blocked only by A, B and D* row at all — it carries a `claim_bound` blocker (*"authored doctrine
with no source"*) `[V]` — while three packs the draft never named (`anti-london-black`,
`italian-center-attack-white`, `london-system-white`) are. **The claim was not merely wrong about
three packs; it was wrong about which three packs.** That is the failure mode an unpublished ruleset
produces and a published one cannot: with §5.1a in the document, the next reader who disbelieves
this table can re-run it in one command instead of re-reading 220 statements.

**[author round] One stated divergence between the ruleset and this section's entry-level reading,
because D245 forbids hiding it.** §5.2a reads `kid-classical-black`'s *"no corpus measurement of
tempo-vs-result in KID races exists in this repo"* as **D155's game-level tempo corpus — an
instrument that does not exist**, and that reading is right. The ruleset assigns it **B(corpus)**,
because rule 2 matches `corpus measurement` and no rule-1 keyword distinguishes *the explorer has
not been queried* from *no instrument of this shape exists* `[V]`. Adopting the entry-level reading
would move one entry F ← B(corpus) (32 → 33, 46 → 45) and one pack into the instrument-bound half
(27 → 28, 23 → 22). **The published numbers are the ruleset's, not the adjusted ones**, because a
ruleset amended per-entry to match a conclusion is no longer re-derivable — and this is precisely
the case §1.4(1) names as unclosable by any lint and §6.2 routes to Stage A's reviewable diff.

**This is stated as a number rather than as a hope because the alternative is worse.** A vocabulary
that makes **173** entries individually decidable will produce a wave of green checks, and a reader who
does not have the 50 in front of them will read that wave as *graduation is nearly solved*. It is
not. The clearance vocabulary makes the distance measurable; it does not shorten it — **and the
strongest evidence for that reading is that its first run moves the graduable set by zero.**

#### §5.3 The class that no instrument will ever reach, named

`planning/content-era/plan.md` §3b's *"authored teaching"* class is the one law 8 fences. On a
puzzle-derived on-ramp pack the emitter itself writes
`authored-teaching-absent` — *"No authored plan, deviation, or feedback claim exists; a reviewer
must add any chess judgement rather than infer one from puzzle metadata"* — and that entry appears
on **26 of the 36 `content/candidates/*/pack.json` documents** `[V]`. No instrument supplies chess judgement, an LLM
may not manufacture it (law 8; ADR-0005), and the reviewer the statement names does not exist
(§3.1). Its clearance kind is **E `pointer_authored`** with `subject` naming the pointers that must
be written — the predicate proves the placeholder is gone and stops there.

Those 36 are **not** graduation subjects (`pack-graduation` §0.3, ruled), so they do not enter the
counts in §5.2. They are named here because the same class exists in `content/drafts/` and because
a reader comparing the two reports will otherwise add 143 to 220. **The report already refuses to
print a merged total for exactly this reason** (`pack-graduation` **D243**) and this RFC does not
reintroduce one.

### §6 Schema, lints and report

#### §6.1 Schema — `$defs/graduationEntry`

`clearedBy` (`{ "$ref": "#/$defs/nonEmptyString" }`) is **replaced** by `clearance`, a closed
object:

```jsonc
"clearance": {
  "type": "object",
  "required": ["kind", "subject"],
  "properties": {
    "kind": { "enum": ["assessment_grounded", "ledger_record", "claim_bound", "shape_firing",
                       "pointer_authored", "unbuilt", "unreachable", "referent_removed"] },
    "subject": { "type": "string", "pattern": "^/[^/]" },
    "recordKind": { "enum": ["opening_identity", "position_legality", "explorer_frequency",
                             "explorer_position_census", "tablebase_result", "engine_eval",
                             "puzzle_provenance"] },
    "instrument": { "$ref": "#/$defs/nonEmptyString" },
    "blockedBy": { "$ref": "#/$defs/nonEmptyString" },
    "placeholder": { "$ref": "#/$defs/nonEmptyString" },
    "absentIds": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/id" } }
  },
  "additionalProperties": false
}
```

**[author round 2] Two properties added and one enum widened, each traceable to a returned blocker.**
`recordKind` is the [[D464]] fix (§1.2b) and its value list is **transcribed from `EVIDENCE_KINDS`
(`apps/server/src/sourcing/types.ts:57`), not invented** — criterion 13 asserts the two are the same
seven strings, so a future evidence kind cannot become unexpressible in a clearance without a red
test. `absentIds` and the eighth `kind` are the [[D465]] fix (§2.2a); `absentIds` reuses
`$defs/id` because the things it names are pack ids, and `minItems: 1` is what stops an empty array
from making `referent_removed` vacuously true. **The four conditional requirements** — `instrument`
for A–E, `blockedBy` for `unbuilt`, `placeholder` for `pointer_authored`, `recordKind` **and**
`absentIds` for their own kinds — stay in the lints for the reason the next paragraph already gives,
and the arithmetic that reason rests on only got worse: a `oneOf` on `state` × `kind` would now be
**twenty-four** armed.

**[cross-review] `pattern` tightened from `^/` to `^/[^/]`.** The draft's `^/` matched the bare
document root, so *"this pack is ungrounded"* — the exact shape §1 refuses as *"a blocker nobody
can check"* — was expressible with a subject that resolves. See §1.4(2). The three conditional
requirements (`instrument` for A–E, `blockedBy` for `unbuilt`, `placeholder` for
`pointer_authored`) stay in the lints rather than in a `oneOf`, deliberately: the entry-level
`oneOf` is already three-armed on `state` and a second dimension would make it nine, for no gain a
lint does not give with a better message.

**[author round 3, [[D503]]] The `subject` pattern stays `^/[^/]` and the per-kind grammar stays in the
lints, for the reason the paragraph above already gives one level down.** §1.2c's table is six
different patterns conditioned on `kind`; expressing it in the schema would take a six-armed `if/then`
inside an object that already carries four conditional requirements, and the arithmetic that argued
against a `oneOf` at twenty-four arms argues against this at thirty. `GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL`
carries it instead, and it can: **every row of §1.2c's table is a regex over a string plus a pointer
resolution, so the code decides from the document alone** and keeps §6.3's runtime input budget.
**One schema change does land with it:** `additionalProperties: false` on `clearance` already refuses
the `firesOn`-style threshold field §2.5 deliberately did not add, so the closed object is what stops
kind D acquiring a per-entry knob at implementation time.

`clearance` is **required** when `state` is `"blocking"`; the existing `oneOf` already forbids the
old `clearedBy` on `resolved` and `accepted` and the same binding carries over to `clearance`, with
one change: `resolved` **requires** `resolved.clearance` (§2.2). `accepted` gains a required
`accepted.unreachableBecause` (§3.3).

**`$defs/provenance` is `additionalProperties: false` at pack 0.27** and `$defs/graduationEntry` is
`additionalProperties: false` too `[V]`. The brief asked whether `provenance`'s openness is a
licence or a trap here: **it is neither — it is stale.** `pack-graduation` closed it, deliberately,
as the whole of its §3.1. There is no unversioned hiding place, and inventing one would mean
reopening the object that RFC closed. The lane is claimed instead (§7).

#### §6.2 Migration — mechanical, 363 entries, no judgement

| Stage | Population | Rule |
|---|---|---|
| 0 | `content/candidates/` — 143 entries, 36 documents | each emitter blocker template gets one checked-in `clearance`; the emitters write it and Stage 0 backfills the same object. Keyed on the template id, not on the rendered statement `[V]` — **but see the correction below: 3 of the 143 are not emitter output and do need judgement** |
| A | `content/drafts/` — 220 blocking entries | the **§5.1a ruleset, published as a literal**, assigns a candidate `kind`; **the 17 residue are classified by hand in §5.1b, not defaulted** (open question 4's ruling — the draft defaulted them to `unreachable`, the one kind eligible for `accepted`). Every assignment is written into the commit for review as a diff, and the classifier ships under `tools/` so the diff is re-derivable (criterion 11). **[author round 2] Stage A also writes the `subject`, and for the 46 rule-2 entries the subject *decides the kind*** — a position/move pointer takes `ledger_record` + `recordKind`, a prose pointer takes `claim_bound`, and `GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE` refuses the combination that cannot hold (§1.2b). **The ruleset therefore assigns a candidate kind for six of its seven rules and a candidate *pair* for rule 2**, which is stated here rather than left as a surprise at implementation ([[D464]]) |
| B | `content/drafts/` — 30 resolved entries | each gains `resolved.clearance`; the 4 measured stale ones (§4.1) are **not** hand-resolved — **`make graduation-clear` (§6.5) resolves them**, which is the migration's own first test. **[author round 2] The population splits 29 + 1, measured**: 29 take a subject that resolves today (§2.2a's four families), and **1** — `anti-caro-advance-early-c5`'s `refuted-and-deleted-…` — takes `kind: "referent_removed"` with `absentIds: ["bxc5-recoup","bxc5-trade"]`. **Stage B is a mechanical migration over 29 and a one-line hand entry over 1, and the RFC says which is which rather than claiming 30** ([[D465]]) |
| C | 5 browser fixtures (§0.4) | `blocking` → `accepted`, `kind: "out_of_scope"`, `unreachableBecause` naming the fixture role. First `out_of_scope` instances in the corpus |

**[cross-review] Stage 0's premise is wrong in two ways, both small and both load-bearing for the
word *mechanical* in this section's title.**

1. **There is no template registry.** `pack-graduation` §1.6 specified *"a named, checked-in
   template list — id plus template"* that both the emitter and the migration read. It **did not
   ship**: `sourcing/openings.ts:115`, `sourcing/position-seeds.ts:227`, `sourcing/syzygy.ts:170`
   and `distill.ts:43` each build an **inline object literal** and no module exports a shared list
   `[V]`. So Stage 0 must either create the registry (a real, small piece of work this RFC should
   own and cost) or backfill against four inline literals. Either is fine; *"the template registry
   `pack-graduation` §1.6 shipped"* is not a thing that exists. Filed as **D416** with the two
   missing lint codes — same flow-back failure, same RFC.
2. **There are not 5 templates, and some of the 143 entries are not templated at all.** Distinct
   template ids across the four emitters: **9** `[V]`. In
   `content/candidates/` the 143 entries carry **7** distinct ids: `mechanical-objective-placeholder`
   36, `outcome-ungraded` 26, `start-assessment-absent` 26, `target-elo-authored` 26,
   `authored-teaching-absent` 26 — and then `opponent-policy-authored` **1** (a `syzygy.ts`
   template, not among the draft's five) and `immediate-blunder-guard-is-not-selectable-defect-d8-dela`
   **2**, which is **hand-authored and matches no emitter template at all** `[V]`. **Stage 0's
   *"no judgement"* claim fails on these entries** — a small number, and exactly the shape §0.4
   found for the five browser fixtures: *a population a stage did not read.* Stage 0 must
   **enumerate ids and fail on an unrecognised one** rather than assume template coverage.

##### §6.2a [author round] The template registry is adopted here, and the count is 9 ids over 11 literals [[D426]]

**Decision: this RFC creates the registry. It is not handed back.** Criterion 7 already requires the
four emitters to write a `clearance`, and three of them validate their own output and throw
`SourcingError("EMITTED_PACK_INVALID")` (**D239**) — so a `clearance`-less emitter is not a
follow-up, it is a landing failure. There is no version of criterion 7 that ships without a shared
list, and *"backfill against four inline literals"* is the option that reproduces the defect one more
time.

**The count, re-derived symbol by symbol.** Nine distinct template ids across **eleven** literals —
`mechanical-objective-placeholder` appears three times, once per sourcing emitter `[V]`:

| module | line | ids |
|---|---|---|
| `sourcing/openings.ts` | `:115` | `mechanical-objective-placeholder` |
| `sourcing/position-seeds.ts` | `:227–233` | `outcome-ungraded`, `start-assessment-absent`, `mechanical-objective-placeholder`, `target-elo-authored`, `authored-teaching-absent` |
| `sourcing/syzygy.ts` | `:170–174` | `mechanical-objective-placeholder`, `opponent-policy-authored`, `tablebase-opponent-not-selected` (conditional on `pieces <= 7`) |
| `distill.ts` | `:43–46` | `recorded-play-needs-authoring`, `mechanical-objective-needs-grounding` |

**9 ids, 11 literals, 4 modules, 0 exported lists** `[V]`. Two of the nine
(`tablebase-opponent-not-selected`, and both `distill.ts` ids) have **zero** instances in
`content/candidates/` because no emitted candidate has taken that branch, which is exactly why a
registry keyed on id — not on rendered statement — is the right shape: it must carry entries the
corpus does not yet exercise.

**And the *"3 of 143"* figure is two different things and should be stated as such.** Of the 143:
**2 entries match no emitter template at all** (`immediate-blunder-guard-is-not-selectable-defect-d8-dela`,
hand-authored, on two documents), and **1 more** (`opponent-policy-authored`) matches a real
`syzygy.ts` template that the draft's five-item list simply omitted `[V]`. The first two need an
author's judgement; the third needs the registry to be complete. **Stage 0 enumerates the nine ids,
fails loudly on an unrecognised one, and the two hand-authored entries are therefore surfaced rather
than silently given a wrong `clearance`** — which is criterion 7's last sentence, now with a number
behind it.

**Stage A's error mode is a false mechanical kind** — an entry filed as `ledger_record` that no
record can actually satisfy. It is bounded by the fact that a wrong mechanical kind **fails to
clear** rather than clearing wrongly: the predicate simply never holds, and the entry stays
`blocking`. That is `pack-graduation` §4.4's safe direction preserved by construction. The one
dangerous move — `unreachable` → `accepted` — requires a citation and a diff line in
`content/accepted-conditions.md` and is not performed by the migration at all except for Stage C's
five fixtures.

**Digest consequence.** `digestDrillPack` canonicalizes the whole document including `provenance`
(`packages/schema/src/drill-pack/digest.ts`), so this migration moves every touched pack's digest
and the commit re-stamps `packDigest` on every ledger it moves — the **landing-order obligation**
`pack-graduation` §4.5 established, restated as an end-of-commit assertion rather than a permanent
property (**D209**).

#### §6.3 Lints

Added to `validatePackDocument` (`apps/server/src/pack-validation.ts`), alongside the **six**
graduation codes it already raises (`GRADUATION_ENTRY_LEGACY_SHAPE`, `GRADUATION_ID_DUPLICATE`,
`GRADUATION_RULING_UNCITED`, `GRADUATION_CLEAREDBY_UNRESOLVED`, `GRADUATION_BLOCKING_ON_PUBLISHED`,
`GRADUATION_REQUIRES_SOURCES`) `[V]` — **[cross-review]** the draft said seven, counting
`GRADUATION_BLOCKERS_OUTSTANDING`, which is a `ServerError` thrown by `PackStudio.register`
(`pack-studio.ts:123`), not an issue `validatePackDocument` raises:

**[author round 2] The Home column is now load-bearing and is split three ways, because §3.2c
establishes that `validatePackDocument` runs inside an image with no repository in it.** A code
whose home is `validatePackDocument` **must decide from the document alone** — no `existsSync`, no
`readFileSync`, no `git`. A code whose home is the **graduation sweep** may use the checkout. A code
whose home is `checkSourcingFile` may use the pack's sidecars, which do ship. Three homes, three
input budgets, and the budget is the reason for the assignment in every row below.

| Code | Condition | Severity | Home | Inputs it may use |
|---|---|---|---|---|
| `GRADUATION_CLEARANCE_MISSING` | `state: "blocking"` with no `clearance` | error | `validatePackDocument` | document |
| `GRADUATION_CLEARANCE_SUBJECT_UNRESOLVED` | `clearance.subject` is not a depth-≥1 pointer that resolves in this document (§1.4(2)) | error | `validatePackDocument` | document |
| `GRADUATION_CLEARANCE_INSTRUMENT_MISSING` | a mechanical `kind` (A–E) with no `instrument` | error | `validatePackDocument` | document |
| `GRADUATION_CLEARANCE_PLACEHOLDER_MISSING` **[cross-review]** | `kind: "pointer_authored"` with no `placeholder` — the predicate would have no input (§1.4(3)) | error | `validatePackDocument` | document |
| `GRADUATION_CLEARANCE_RECORDKIND_MISSING` **[author round 2, [[D464]]]** | `kind: "ledger_record"` with no `recordKind`, or a `recordKind` on any other kind (§1.2b) | error | `validatePackDocument` | document |
| ~~`GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE`~~ **[withdrawn, author round 3]** | it was the B row of §1.2c's table stated as its own code; **subsumed by `GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL`** so that one table has one code (§1.2c) | — | — | — |
| `GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL` **[author round 3, [[D503]]]** | `clearance.subject` does not match the grammar its `kind` requires (§1.2c): A must be exactly `/objective/grading/assessedBy`; B must not match `PROSE_POINTERS` (`check.ts:36`) or `HUMAN_ONLY_POINTERS` (`:43`); C must match `^/feedbackClaims/\d+/text$`, which is the only pointer `validateClaimBindings` admits (`CLAIM_POINTER_INVALID`, `claim-binding.ts:178`); D must match `^/shapes/\d+$` or `^/planClasses/\d+/shapePlan$`; E must resolve to a string | error | `validatePackDocument` | document |
| `GRADUATION_CLEARANCE_VACUOUS` **[author round 3, §2.5]** | a `blocking` entry whose `clearance` **already re-derives as *holds***, outside the four entries §4.1 names — sixteen of these would exist if the migration were run as round 2 specified `[V]` | error | **graduation sweep** — it needs the ledger and one cached census | document + sidecars + census |
| `GRADUATION_CLEARANCE_ABSENTIDS_MISSING` **[author round 2, [[D465]]]** | `kind: "referent_removed"` with no non-empty `absentIds`, or `absentIds` on any other kind (§2.2a) | error | `validatePackDocument` | document |
| `GRADUATION_CLEARANCE_REMOVAL_ON_BLOCKING` **[author round 2, [[D465]]]** | `kind: "referent_removed"` on a `blocking` entry — *"I deleted the thing the blocker was about"* is not a discharge (§2.2a(4)) | error | `validatePackDocument` | document |
| `GRADUATION_RESOLVED_WITHOUT_CLEARANCE` | `resolved` with no `resolved.clearance`, or one whose kind is `unbuilt`/`unreachable` | error | `validatePackDocument` | document |
| `GRADUATION_ACCEPTED_WITHOUT_UNREACHABILITY` | `accepted` with missing/blank `unreachableBecause` | error | `validatePackDocument` | document |
| `GRADUATION_RULING_UNANCHORED` **[author round]** | `accepted.rulingRef` carries no `#L<line>` anchor, or names a file outside **`GRADUATION_RULING_ANCHOR_ROOTS`** — required for **all three** `accepted.kind` values, replacing withdrawn tightening 3 (§3.2b). **[author round 3]** the allow-list is a **named exported constant with one writer**, and `tools/verify-packaging.mjs` asserts every member is `COPY`ed into the image, so the list and the packaging cannot diverge (§3.2c-r) | error | `validatePackDocument` | document |
| `GRADUATION_CLEARANCE_BLOCKEDBY_UNRESOLVED` | `kind: "unbuilt"` with a missing or non-existent `blockedBy` path | error (replaces the warning-level `GRADUATION_CLEAREDBY_UNRESOLVED`) | **graduation sweep** **[author round 2 — moved]**: `blockedBy` names `design/BACKLOG.md` or an `rfc/` path, and the image contains neither (§3.2c) | checkout |
| `GRADUATION_RULING_SELF_MINTED` **[cross-review, revised author round, re-homed author round 2]** | `git blame --porcelain -L n,n -- <file>` on the cited line reports the commit under review or the all-zero *Not Committed Yet* sentinel (§3.2b) | error | **graduation sweep** — never `validatePackDocument`; §3.2c is the whole argument and [[D467]] is the finding | checkout + `.git` + `git` binary |
| `GRADUATION_RULING_UNCITED` **[author round 3 — the split is withdrawn; one code, one home]** | **all three arms** — grammar (`pack-validation.ts:842–844`), resolution and date containment (`:848–857`) — stay in `validatePackDocument`. **[[D468]] was closed by packaging, not by moving code**: `Dockerfile:32–33` copies both cited sources into the image and `verify-packaging.mjs:88–99` pins them, so the arms' evidence now exists where the code runs (§3.2c-r) | error | `validatePackDocument` | document **+ the pinned citation sources** |
| `GRADUATION_RESOLUTION_STALE` | a `resolved` entry whose `resolved.clearance` no longer re-derives (§2.3) | warning in `content/drafts/`, **error** in `content/packs/` | `checkSourcingFile` | document + sidecars |

`GRADUATION_RULING_UNCITED` is additionally **tightened** (§3.2a): the `#L<line>` arm reads
the cited line and requires it to contain the ruling's quoted date rather than merely requiring the
file to have that many lines, and the hard-coded one-file allow-list at `pack-validation.ts:853`
widens to §3.2a(1)'s list. **[author round 2] "In place" is withdrawn: the tightened arms land in the
graduation sweep, not in `validatePackDocument`, because that is where their evidence exists.** The
allow-list half survives in `validatePackDocument` as a **string** test under
`GRADUATION_RULING_UNANCHORED` — checking that a `rulingRef` *names* a living-tier document costs no
filesystem; checking that the document *says what it is quoted as saying* costs a repository (§3.2c). **[author round] The draft's third tightening — extending date
containment to all three `accepted.kind` values — is withdrawn, not softened: it fails 3 of 3
committed `permanent_property` entries, whose rulings carry no date and whose cited document
contains none** `[V]`. `GRADUATION_RULING_UNANCHORED` replaces it, and the *closing* work is done by
`GRADUATION_RULING_SELF_MINTED`'s blame arm, not by any date test. §3.2b is the verification.

##### §6.3a [author round] The two lint codes `pack-graduation` specified and never shipped are **handed back**, not adopted here [[D426]]

`GRADUATION_RESOLVED_WITHOUT_RESOLUTION` and `GRADUATION_ACCEPTED_WITHOUT_RULING` appear **nowhere**
in `apps/`, `packages/`, `schemas/`, `content/` or `tools/`; the sweep returns exactly seven
`GRADUATION_*` codes `[V]`. **Decision: this RFC does not mint them.** The reasoning is the one
D416/D426 itself supplies, applied to this RFC rather than to `pack-graduation`:

- **Their conditions are already fully enforced, by the schema.** `$defs/graduationEntry.resolved`
  is `required: ["at", "by"]` with `by` a `nonEmptyString` and `additionalProperties: false`;
  `$defs/graduationEntry.accepted` is `required: ["kind", "ruling", "rulingRef"]` with both strings
  `nonEmptyString` and `additionalProperties: false` `[V]`. A `resolved` without a resolution and an
  `accepted` without a ruling are both **unrepresentable**, not merely unlinted.
- **This RFC's own codes already cover the gap those names were reaching for.**
  `GRADUATION_RESOLVED_WITHOUT_CLEARANCE` is strictly stronger than
  `GRADUATION_RESOLVED_WITHOUT_RESOLUTION` (it demands a re-derivable predicate, not a non-blank
  sentence — §0.3 measured that the sentence is worthless), and
  `GRADUATION_ACCEPTED_WITHOUT_UNREACHABILITY` + `GRADUATION_RULING_SELF_MINTED` are strictly
  stronger than `GRADUATION_ACCEPTED_WITHOUT_RULING`.
- **Minting two codes that can never fire would be the exact failure D426 names.** That row's
  general form is *"an RFC's acceptance criteria are checked against its **behaviour**, and a code
  name is not behaviour."* Adding two unreachable code names so a register row reads *shipped* is
  that failure performed deliberately. **The honest disposal is to record that
  `pack-graduation` §6 over-specified and the schema under-delivered nothing** — the guarantee
  landed, the names did not — and to leave the correction with `pack-graduation`'s ledger row.

**What this RFC owes instead, and pays:** the register row for `pack-graduation` should read
*"two §6 code names never shipped; the guarantee they named is schema-enforced and is superseded by
`graduation-clearance` §6.3"*, and that is a claude-lands-it ledger edit rather than an RFC edit.
**The third absent thing is different and is adopted (§6.2a): the template registry is load-bearing
for criterion 7 and has no schema standing in for it.** Two of three handed back, one of three taken
— and the difference between them is whether anything today enforces the guarantee.

`GRADUATION_RESOLUTION_STALE` is the one that matters, and it is the only one that requires the
ledger, so it lives in `checkSourcingFile` (which already reads the sidecar) rather than in
`validatePackDocument` (which does not — and §3.2c makes that separation normative rather than
incidental). `pack-graduation` criterion 14 already wired
`checkSourcingFile` over `content/packs/` at strict inside `make verify` and a ratchet over
`content/drafts/`; **this RFC adds a predicate to a sweep that already runs.**
**[author round 2] Two corrections to that sentence, both from reading the sweep instead of the
criterion.** It is `checkSourcingFile` per file, not `checkSourcingDirectory`, and it lives in
`apps/server/src/graduation-report.test.ts:70–77` — a **vitest case**, reached by `make verify` only
through `pnpm test`. **[author round 3] The clause that followed — *"which is why [[D208]] is still
open and correct about the Makefile"* — is withdrawn: `design/BACKLOG.md`'s column 1 for D208 reads
✅** `[V]`. The Makefile is unchanged (`verify: typecheck test schema-check` at `Makefile:21`;
`sourcing-check` still requires an explicit `DIR=`/`FILE=` at `:60–63`) `[V]`, so what closed the row is
exactly the vitest case this paragraph describes — which makes the reading right and the status claim
wrong, and **column 1 is the status**, per [[D419]]/[[D459]]. And the ratchet is
**`expect(failing.length).toBeLessThanOrEqual(18)`** at `:76` over the non-`.browser` drafts `[V]` —
**18, not the "≤15-of-47" this RFC quoted for two rounds.** Nothing turns on the number; it is
corrected because §5.1's own standard forbids quoting a figure a command prints without printing it.
**[cross-review] It does, however, add one new sweep**, and the draft's *"and adds no new sweep"*
was wrong: §6.4's per-entry verdict requires `graduation-report.ts` — today a pure `node:fs` JSON
reader that imports nothing from `pack-validation` or `sourcing` `[V]` — to call the checker. See
§2.3a, which specifies that as a `--verify` mode and states the census-caching constraint that
comes with kind D.

#### §6.4 The report

`graduation-report.ts:39` changes from `clears via ${entry.clearedBy ?? "(unspecified)"}` to
printing `clearance.kind` + `clearance.subject` + the checker's verdict — `holds` / `does not hold`
/ `no predicate`. **[author round 2] `recordKind` prints beside `kind` for `ledger_record` entries**,
because §1.2b makes it the field that decides which instrument a reader should reach for, and a
report that prints `ledger_record` alone reproduces exactly the ambiguity [[D464]] returned this RFC
for. **And `graduation-report.ts:8`'s file filter gains `graduation` to its
`(?:evidence|job|sources)` alternation** (§6.5), or the transition documents are counted as packs. Two lines are added to each root's header: **`clearable: N`** (blocking entries
whose kind is A–E — **173** at HEAD `[V]`) and **`unclearable: N`** (`unbuilt` + `unreachable` —
**47** `[V]`),
because the whole point of the vocabulary is that those two numbers stop being the same number.
**No merged corpus-wide total is printed**, per `pack-graduation` §3.3 and **D243**, unchanged.

**[cross-review] Two constraints on this, both from §2.3a.** (a) The verdict column requires the
ledger, so it runs only in the new `--verify` mode; the default `make graduation-report` invocation
stays a pure JSON read and prints `clearance.kind` + `clearance.subject` with no verdict, because
`writeAcceptedConditions` regenerates a **committed, byte-checked** file and must not acquire a
dependency on a Stockfish container or a corpus walk to do it. (b) `clearable`/`unclearable` are
derived from `clearance.kind` alone and are therefore available in **both** modes — they are the
two numbers planning consumes, and they must not be the ones that need an instrument to print.

#### §6.5 [author round 2 — closes [[D466]]] The writer that owns `blocking` → `resolved`, and what it writes

**The blocker: *"`checkSourcingFile` returns issues; it does not mutate a pack or emit a transition
document. The command that owns blocking→resolved, and its output shape, are absent."* It is exactly
right, and it is right at the symbol.** `checkSourcingFile(file, options): Promise<SourcingCheckResult>`
(`sourcing/check.ts:437`) ends `return Object.freeze({ strict, issues, valid })` `[V]` — a frozen
report with no document in it. Criterion 3 asked four entries to become `resolved` "automatically"
and named nothing that could write the word.

**The writer is a new command, and it is modelled on one that already ships rather than invented.**
`verifyDraft` (`sourcing/verify-draft.ts:323`) is the same shape: it reads a pack and its sidecars,
runs an instrument, **rewrites the pack in place** — `writeFile(absolute, …, "utf8")` with
two-space-indented JSON at `verify-draft.ts:210` and `:316` — rewrites the ledger and manifest
through `writeCanonicalJson`, and emits a **job document** (`tabiya.sourcing.job.v1`) recording
pipeline, args and an emission digest `[V]`.
Every piece §6.5 needs exists there.

> **`make graduation-clear FILE=<path-to-pack.json>` → `apps/server/src/sourcing/graduation-clear.ts`,
> exporting `clearGraduationEntries(file: string, options?: { readonly now?: () => Date; readonly
> census?: ReturnType<typeof runExpressionCensus>; readonly check?: boolean }):
> Promise<GraduationTransitionResult>`.**

**[author round 3] Two corrections to that signature, both from trying to write the import.**
`ExpressionCensus` — the type round 2 named — **does not exist in the tree**: `runExpressionCensus` is
declared `(options: CensusOptions = {}): any` (`expression-census.ts:257`) and no census result type is
exported anywhere `[V]`. An implementer would have stopped at line one. `ReturnType<typeof
runExpressionCensus>` is the honest spelling, it is `any`, and **because it is `any` the RFC owes the
paths instead of the type**: the writer reads exactly `subjects[].site.subject.{kind,shape,plan}`
(`:311`) and `subjects[].coverage.corpus.packs` (`:216`), and criterion 18 asserts both paths are
present before asserting anything about their values. `check?: boolean` is §2.5's non-vacuity mode —
`make graduation-clear CHECK=1` evaluates and reports without writing, which is how
`GRADUATION_CLEARANCE_VACUOUS` is raised over a committed corpus.

**What it does, in order, with every predicate named at its shipped symbol.**

1. Read `pack`, `<stem>.evidence.json`, `<stem>.sources.json` with `readJson`, the way
   `attachExplorerEvidence` does at `explorer.ts:242` `[V]`.
2. For every entry with `state: "blocking"`, evaluate its `clearance`:

   | kind | predicate | symbol |
   |---|---|---|
   | A `assessment_grounded` | `assessmentGrounding({ document, ledger, manifest }) === "ledger_verified"` | `sourcing/ledger-validation.ts:423` `[V]` |
   | B `ledger_record` | a record whose `kind === clearance.recordKind` has `clearance.subject` in its `supports` | §1.2b; the relation `evidenceSupports` already lints (`check.ts:170`) `[V]` |
   | C `claim_bound` | `validateClaimBindings(pack, ledger, issues)` returns a binding whose `pointer === clearance.subject` **and contributes no issue**. **[author round 3]** `clearance.subject` is therefore always `^/feedbackClaims/\d+/text$` — `:178` raises `CLAIM_POINTER_INVALID` on any other pointer, so **no other subject can ever match** (§1.2c) | `sourcing/claim-binding.ts:174`, `:178` `[V]` |
   | D `shape_firing` | **[author round 3 — stated as an expression, [[D503]]]** for `subject: /shapes/<i>`, resolve it to a shape id `s` and take `census.subjects.find((x) => x.site.subject.kind === "shape_trigger" && x.site.subject.shape === s)`; for `subject: /planClasses/<i>/shapePlan`, resolve to `{shape, plan}` and take the subject with `kind === "shape_plan_signature"` matching both. In either case the predicate is **`coverage.corpus.packs.some((p) => p.id === pack.id && p.count > 0)`** — *this pack's own firings*, not the corpus's | `runExpressionCensus` (`apps/server/src/expression-census.ts:257`); the subject site at `:311`, `coverage.corpus.packs` at `:216` `[V]`; the cost constraint is §2.3b's, and `options.census` is how it is honoured |
   | E `pointer_authored` | `resolvePointer(pack, clearance.subject).value !== clearance.placeholder` | `check.ts:69` `[V]` |
   | F `unbuilt`, G `unreachable`, H `referent_removed` | **never evaluated; never written.** §2.2a(4) | — |

   **[author round 3] The D row costs a corpus walk even though the command takes one `FILE`, and the
   RFC has to say so or the first implementation will be quadratic.** `runExpressionCensus` takes
   `roots: string[]` — **directories, not files** — and `coverage.corpus.packs` is computed over every
   position under those roots, so the writer must call it as `runExpressionCensus({ roots: [dirname(file)] })`
   and gets all 827 positions and 25 shape entries whatever the `FILE` was `[V]`. That is why
   `options.census` exists and why §2.3b's *"a single cached census run per sweep"* is a **requirement
   on the caller**, not advice: `make graduation-clear` over 50 packs without it is 50 corpus walks.
   **A sweep that runs the writer over many files must build the census once and pass it in.**

   **And step 2 has a gate in front of it.** Before evaluating for a *write*, the command applies
   §2.5: an entry whose predicate holds and which is not one of §4.1's four is
   `GRADUATION_CLEARANCE_VACUOUS`, and the command **refuses the whole file** under step 6's
   all-or-nothing rule rather than transitioning the honest entries around it.

3. For each entry whose predicate **holds**, replace it with
   `{ id, state: "resolved", statement, resolved: { at, clearance, by } }` — `clearance` **byte-identical
   to the one the entry carried while blocking** (§2.2), and **`by` machine-rendered from the predicate's
   own output**, never authored. This is the clause that stops §0.3's failure recurring: 30
   byte-identical `resolved.by` strings exist today precisely because a human typed them, and a
   rendered string like `assessmentGrounding = ledger_verified; 27 tablebase_result records support
   /objective/grading/assessedBy` differs per entry because the evidence does.
4. **Re-stamp the digest, and this is not optional.** `digestDrillPack` canonicalizes the **whole**
   document (`packages/schema/src/drill-pack/digest.ts` — `digestCanonicalJson(pack)` over every key,
   `provenance` included) `[V]`, so a state transition moves the pack digest and
   `checkSourcingFile` would then raise `EVIDENCE_DIGEST_STALE` at `check.ts:468` — at **warning**,
   which is why it would be a silent drift rather than a red build, and why criterion 10 asserts a
   count of zero rather than trusting the severity `[V]`. The command sets
   `ledger.packDigest = await digestDrillPack(pack)` and rewrites the ledger in the same call.
   **A writer that changes a pack and does not re-stamp reddens criterion 10 on its first run.**
5. Write `<stem>.graduation.json` through `writeCanonicalJson` — the transition document:

```jsonc
{ "schema": "tabiya.graduation.transition.v1",
  "packId": "mate-k-q-technique", "at": "2026-08-16T…Z",
  "packDigestBefore": "sha256:…", "packDigestAfter": "sha256:…",
  "transitions": [ { "id": "syzygy-root-unverified", "from": "blocking", "to": "resolved",
                     "clearance": { "kind": "assessment_grounded", "subject": "/objective/grading/assessedBy",
                                    "instrument": "make verify-draft" },
                     "evidence": "assessmentGrounding = ledger_verified" } ],
  "held": [ { "id": "…", "kind": "ledger_record", "recordKind": "engine_eval", "verdict": "does not hold" },
            { "id": "…", "kind": "unbuilt", "verdict": "no predicate" } ] }
```

   `held` is not decoration: it is the per-entry verdict §6.4 promises, produced by the command that
   already computed it, so the `--verify` report reads a file instead of re-running instruments.

6. **Refuse rather than half-write.** If any predicate evaluation raises, the command writes nothing
   and exits non-zero — `attachExplorerEvidence`'s discipline (`explorer.ts:274–279`: build in a temp
   directory, re-check at strict, `ATTACH_CHECK_FAILED` before any real write) `[V]`, and the reason
   is the same: a partially-transitioned pack is worse than an untransitioned one.

**Two consequences that must land in the same commit or the writer breaks something else.**

- **`graduation-report.ts:8` must exclude the new suffix.** Its file filter is
  `!/\.(?:evidence|job|sources)\.json$/u` `[V]`; without `graduation` in that alternation, every
  transition document is read as a pack and the report's `documents:` count silently grows. **This is
  a one-line change and it is the kind of one-line change an RFC that did not name the sidecar would
  have discovered in production.**
- **[author round 3] The target has to exist, and `make` is where an RFC's named command most often
  turns out not to be one.** `graduation-clear` is added to `Makefile:1`'s `.PHONY` list and gets a
  two-line recipe modelled byte-for-byte on `graduation-report` at `:65–67` — an
  `esbuild src/sourcing/graduation-clear.ts --bundle --platform=node --format=esm --outfile=dist/graduation-clear.js`
  followed by `node apps/server/dist/graduation-clear.js "$(abspath $(FILE))"`, with the
  `@test -n "$(FILE)"` usage guard `sourcing-check` carries at `:61` `[V]`. **Eleven recipes in this
  Makefile print a `Usage:` line for a missing argument** (`:24`, `:29`, `:38`, `:45`, `:50`, `:55`,
  `:56`, `:61`, `:70`, `:75`, `:80`) `[V]`; a twelfth that does not would fail with a bare `ENOENT` on
  the empty string. **`graduation-report` is the one recipe with no argument at all, which is why it is
  the wrong half of the model to copy and its `esbuild` line is the right half.**
- **`checkSourcingFile` keeps its signature and stays a reporter.** The graduation pass §2.3 adds to
  it raises `GRADUATION_RESOLUTION_STALE`; it still returns `{strict, issues, valid}` and still
  mutates nothing. **The reporter and the writer are different commands on purpose** — §2.1's rule is
  that a checker *decides*, and a checker that also rewrites the thing it judges is the rubber stamp
  in a new costume.

**Criterion 3 is rewritten against this** (see §Acceptance criteria): *"one checker run demotes"*
becomes *"one `make graduation-clear` run over each of the four packs writes exactly four transitions
and four `held` lists containing no fifth transition"*, which is a thing a test can call.

#### §6.6 [author round 2] What this round could **not** specify, with the proof rather than the cost

**Three things. None of them is a blocker, each is proved rather than pleaded, and none is "it would
be expensive".**

1. **The final `ledger_record` / `claim_bound` split of rule 2's 46 entries is not a number this RFC
   can print.** §1.2b makes the kind a **function of the `subject`**, and **no blocking entry in the
   corpus has a subject**: `clearance` does not exist in pack 0.27's schema and its predecessor
   `clearedBy` is carried by **0 of 293 entries in `content/drafts/` and 0 of 143 in
   `content/candidates/`** `[V]`. So the split is not withheld, it is **not yet defined** — the
   function has no input until Stage A writes one. What is defined and is asserted is the **sum**:
   B(corpus) + C = **101 of 220** (§4.2), which is the figure planning consumes and is invariant
   under the boundary wherever it falls. **Printing a split here would be manufacturing the very
   thing [[D434]] says a document must not do**: a derived count whose deriver does not exist.
2. **No mechanism can tell *the owner ruled* from *an agent wrote a ruling the owner has not read*.**
   §3.2b establishes this and this round does not improve on it; §3.2c narrows the *place* the check
   lives without changing the floor. The proof is §3.1's: the second party was struck by an owner
   ruling on 2026-08-13 and no mechanism substitutes for one. **The blame arm forces a standalone
   falsification of the owner's own log in its own commit, and that is the ceiling, not the goal.**
3. **A `#L<line>` anchor into a mutable living-tier document can drift, and only the checkout can
   ever notice.** `planning/exploration/log.md` is append-only by law 7 so its line 1231 is stable
   `[V]`; `docs/tablebase-grounding.md` is not, and this RFC already had to route around it being
   under uncommitted edit (§3.2b). After the §3.2c split the drift is caught on **every CI run**,
   because the sweep re-reads the cited line — but it is caught **nowhere at runtime**, because the
   document is not in the image (`Dockerfile:28–31`) `[V]`. **That is a limit of the artefact, not of
   the specification**, and the honest form of it is the one §3.2c's table already states: the
   runtime rule decides *shape*, and shape is all a document can carry about a file it does not have.

4. **[author round 3] The final kind of the sixteen §2.5 entries is not a number this RFC may print,
   and the reason is the one that made this section right the first time.** Each of the sixteen needs a
   reading of what its *statement is about* — the shape entry's prose, the pack's own hand copy, or a
   coverage quantity — and §5.1a's keyword list cannot separate those three, which is why the ruleset
   put all sixteen in one bucket. **Assigning them here would be [[D434]] performed knowingly**: a
   derived count whose deriver is a paragraph. What is defined and asserted instead is (a) the
   population — **16** `[V]`; (b) that **none of them may be `shape_firing`**, because §2.5's rule
   refuses a clearance whose predicate holds and all sixteen hold `[V]`; (c) the three groups they fall
   into with a count each (7 / 4 / 5); and (d) the ratchet that bounds Stage A's discretion
   (open question 7). **A number this RFC could not honestly produce, replaced by a constraint that
   makes the wrong answer fail loudly — which is the whole difference between this round and the one
   D503 returned.**

**What is *not* on this list, and was on the returned draft's implicit one: all four returned
blockers.** Each is specified at a named symbol above. **"Unspecifiable" is a claim about the tree,
not a budget line, and this section is the only place in this RFC entitled to use the word.**
**[author round 3] And D503 was on none of the three lists**, which is the honest reading of what
§6.6 is worth: it catches what a round *knows* it could not settle, and D503 was something round 2 did
not know it had not checked. **The guard for that is not a better §6.6, it is criterion 18 —
run the predicate over the corpus before claiming the kind is decidable.**

### §7 Register and version claims

- **Pack schema: claims 0.28.** `rfc/README.md`'s pack-version register records *"0.28 is the next
  free pack lane"* `[V]`, released by `opponent-contracts` at cross-review (*"NO pack lane — 0.28
  released and remains free"*) `[V]`. `DRILL_PACK_SCHEMA_VERSION` reads `"0.27"` and the schema
  `$id` is `urn:chess-tabiya:schema:drill-pack:0.27` `[V]`. The lane is **earned**, not
  discretionary: `$defs/graduationEntry` and `$defs/provenance` are both
  `additionalProperties: false` at 0.27, so `clearance` cannot be added without a version. This RFC
  does not edit `rfc/README.md`; it **requests** the row.
  **[cross-review] Verified independently, and the claim clears the bar that released the last
  0.28 claim.** Both objects re-read from `schemas/drill_pack.schema.json` at HEAD:
  `$defs/provenance` is `{"type":"object","required":["reviewStatus"],…,"additionalProperties":false}`
  and `$defs/graduationEntry` is `{"type":"object","required":["id","state","statement"],…,
  "oneOf":[…],"additionalProperties":false}` `[V]`. The precedent that released the lane from
  `opponent-contracts` was *"**NO pack lane** — the cited `claim-backing` precedent does not exist
  … and **every pack lane 0.3→0.27 carries a `$defs`/enum/property change**"*: that RFC wanted the
  lane for **register rows only**, with no schema edit, and the register was right to refuse it.
  **This claim is the opposite shape.** It adds a `clearance` property to a closed `$defs`, adds a
  seven-value enum, tightens a `pattern`, adds a required key inside the closed `resolved`
  sub-object and another inside the closed `accepted` sub-object, and **withdraws `clearedBy`**
  along with its arm of the entry-level `oneOf`. Five `$defs`-level changes, not zero. It is not
  register-only and could not be made register-only: with `additionalProperties: false` on both
  candidate hosts, **there is no unversioned place to put `clearance`**, which is the exact test
  the register applies. **Verdict: keep 0.28.**
  **[author round] Re-verified a third time at a moved tree, because §7 is where a stale fact costs
  the most.** `DRILL_PACK_SCHEMA_VERSION` is `"0.27"` (`packages/schema/src/index.ts:2`), the schema
  `$id` is `urn:chess-tabiya:schema:drill-pack:0.27`, `$defs/graduationEntry` is
  `{"required":["id","state","statement"],…,"oneOf":[…],"additionalProperties":false}` and
  `$defs/provenance` is `additionalProperties: false`; `opponent-contracts` — now **implementing** —
  still holds **no pack lane** `[V]`. Nothing released or claimed 0.28 under that round. **This RFC
  does not edit `rfc/README.md`; it requests the row.**
  **[author round 2] Re-verified a fourth time at HEAD `6722130`, and the register moved *toward* this
  RFC.** `DRILL_PACK_SCHEMA_VERSION` is `"0.27"` and the schema `$id` is
  `urn:chess-tabiya:schema:drill-pack:0.27` `[V]`. **`rfc/README.md:78` now records 0.28 as *"claimed
  and held by a draft returned to author 2026-08-16 — the lane remains reserved while D464–D467 are
  corrected"*, and `:79` records *"0.29 is the next free pack lane"*** `[V]` — so the claim §7 made is
  now a landed register row and the free lane has moved on. **The lane claim is unchanged and is
  strengthened by this round, not weakened:** §6.1 now adds *seven* `$defs`-level changes rather than
  five — the two new `clearance` properties (`recordKind`, `absentIds`) and the widened `kind` enum are
  the additions — and both host objects are still `additionalProperties: false`, so there is still no
  unversioned place to put any of it. **One register defect this round must report rather than fix,
  because editing `rfc/README.md` is out of this RFC's scope:** two Active rows still read *"0.28
  remains free"* (`:12`, `opponent-contracts`) and *"0.28 stays free"* (`:14`,
  `measurement-records`) while `:78` records the lane as held `[V]`. That is [[D461]]'s exact defect —
  *"the register contradicting itself inside four lines"* — surviving its own correction, which fixed
  `:79` and left the two Active rows. Reported at §Ledger rows.
  **[author round 3] Re-verified a fifth time, and that reported defect is withdrawn because it is
  fixed.** A sweep of `rfc/README.md` at HEAD returns **zero** occurrences of *"0.28 remains free"* or
  *"0.28 stays free"* `[V]`; `measurement-records`' row now reads *"No pack lane (0.28 is claimed and
  held by `graduation-clearance` — corrected 2026-08-16, [[D472]])"* `[V]`, and **D472's column 1 reads
  ✅** `[V]`. **Its column 3 still reads *"💡 open, found 2026-08-16"*, which is [[D419]]/[[D459]]'s
  hazard printed on the very row that records a half-finished correction** — column 1 is the status and
  the row is closed. **The register rows moved by one line and every `:line` in this bullet is
  restated:** the pack-lane table records 0.28 as claimed and held at **`rfc/README.md:79`** and 0.29
  as next free at **`:80`** `[V]`. `DRILL_PACK_SCHEMA_VERSION` is `"0.27"`, the schema `$id` is
  `urn:chess-tabiya:schema:drill-pack:0.27`, and both host `$defs` are still
  `additionalProperties: false` `[V]` — **the lane claim is unchanged, unopposed and still earned.**

  **The lane's landing declaration, written out so the implementer does not have to derive it.**
  `rfc/archive/shared-resource-registers.md` (implemented) requires every RFC body to carry **exactly one**
  `tabiya-claims` fenced block — one claim per line, three `|`-separated fields, `<resource>` one of
  six canonical names including `pack-schema`, `<changes>` **mandatory and non-empty**, and an explicit
  `none` where nothing is claimed (its §3) `[V]`. It names `graduation-clearance` (pack 0.28) as one of
  the four Active RFCs that would declare a claim `[V]`. **The ruling: carry one, at landing, not now.**
  Not now, because law 1 forbids building on an unlanded RFC and that grammar may still move; at
  landing, because the block costs three fields, is inert prose if that RFC never lands, and is the
  difference between a claim a checker can join and one a reader has to find. The content is fixed by
  §6.1 and is stated here so it is not re-derived under time pressure:

  ````
  ```tabiya-claims
  pack-schema | lane 0.28 | $defs/graduationEntry.clearance (new, closed object); .resolved.clearance (new, required); .accepted.unreachableBecause (new, required); clearedBy (withdrawn, with its oneOf arm)
  ```
  ````

  **`evidence-kinds` is deliberately not a second line, and saying why exposes a live defect.** That
  register's claim form is `members <name>…` and this RFC **adds no member** — §6.1 *transcribes* the
  seven. But a transcription is a **second hand-written copy** of the resource [[D499]] files as having
  no register at all, which is precisely [[D506]]'s finding. **D506's own citation does not reproduce
  at HEAD:** it reports a copy at `schemas/drill_pack.schema.json:1140`, and a sweep for
  `explorer_position_census` across `schemas/`, `packages/` and `apps/` returns **exactly one** hit —
  `apps/server/src/sourcing/types.ts:61` `[V]`. So at HEAD this RFC's `recordKind` enum would be copy
  **two, not copy three**, and **criterion 13's set-equality assertion is the entire mechanism keeping
  them in step** — which is why §6.1 transcribes rather than `$ref`s, and why the criterion is not
  optional. Reported at §Ledger rows.
- **`STORAGE_VERSION`: nothing.** No table, no column, no bump, and therefore **no migration
  position is claimed**. **[author round] `STORAGE_VERSION` reads 23** (`apps/server/src/storage.ts:407`)
  `[V]` — the draft and the cross-review both read **22**, and `opponent-contracts`' migration 23
  landed under them. The correction changes nothing this RFC decides and is carried because a stale
  register fact is what put three drafts on one migration position (**[[D423]]**). **This RFC is not
  one of the three**: `teacher-surface`, `opponent-contracts` and `learner-rating` all claim
  `STORAGE_VERSION + 1` `[V]`, and `graduation-clearance` claims **no position at all** — the safest
  possible relationship to a contested resource, and the reason the correction is a footnote here
  rather than a rebase. The register's rule — *"MIGRATION NUMBERS ARE ASSIGNED AT LANDING, NOT AT
  CLAIM"* — is not reached, because this RFC holds no migration to number. `pack_drafts.document_json` and
  `registered_packs.document_json` store whole documents as JSON blobs, and
  a stored draft carrying a `clearance`-less entry **refuses to register rather than requiring a
  rewrite**, which is the same compatibility rule `pack-graduation` §8.2 used to avoid a migration
  and it holds unchanged here. **[cross-review] The mechanism is right and the draft cited the
  wrong code for it.** `GRADUATION_ENTRY_LEGACY_SHAPE` (`pack-validation.ts:830`) fires only when
  `typeof entry === "string"` `[V]` — it catches legacy *strings*, not typed entries missing
  `clearance`. What actually stops the stored draft is `GRADUATION_BLOCKERS_OUTSTANDING` (any
  `blocking` entry refuses registration outright, `pack-studio.ts:122`) and, for `resolved` /
  `accepted` entries, plain schema validation against the closed 0.28 `graduationEntry`. Same
  outcome, different code; a stored draft stays **editable** through `PackStudio.update`, which is
  what makes *"refuses to register"* rather than *"is bricked"* the true statement.
- **Run schema: nothing.** Clearance is never persisted in a run — no event, no occurrence, no
  policy. `DRILL_RUN_SCHEMA_VERSION` is byte-identical. **[author round] Its observed value is now
  `"0.17"`** (`packages/schema/src/index.ts:1`) `[V]`, moved by `opponent-contracts` under this
  round; *byte-identical* is a statement about this RFC's diff, not about the constant's value, and
  it holds at 0.17 exactly as it held at 0.16.
- **Shape-entry schema: nothing.** `shape_firing` reads the shape entry; it does not extend it.
  **[author round 3] Verified rather than assumed, because §1.2c and §2.5 both now read shape entries
  much harder than round 2 did:** `SHAPE_ENTRY_SCHEMA_VERSION` is `"0.3"`
  (`packages/schema/src/index.ts:3`) and `schemas/shape_entry.schema.json`'s `$id` is
  `urn:chess-tabiya:schema:shape-entry:0.3` `[V]`. **This RFC still claims no shape-entry lane** — the
  D predicate reads `runExpressionCensus`'s output, not the entry document, and `coverage.corpus.packs`
  is a census field rather than a schema one. **`measurement-records` claims shape-entry 0.4** and this
  RFC does not contest it (`rfc/README.md:13`) `[V]`.
- **Nothing versioned was preferred and is not available.** §6.1 states why.

### §8 Relationship to `rfc/measurement-records.md`

`measurement-records.md` (draft, returned to author at cross-review) is adjacent and does not
collide. **It was rewritten in the working tree while this RFC was being drafted (277 insertions),
so both quotations below were re-checked against the file after the rewrite and both survive
verbatim** — `pack-graduation` **D246**'s rule applied (*"an RFC round that measures a moving tree
must pin its commit and re-check the lanes"*). Its 0.28 release also survives the rewrite: *"0.28
remains the next free lane and this RFC leaves it free"* `[V]`, which is the lane §7 claims.

**[cross-review] Re-checked a third time, after the tree moved again.** Two commits landed between
this RFC's drafting commit (`b9fd803`) and this review — `31dc2f9` (*"rfc: register statuses
corrected"*) and `c86f74a` (*"research: live relay verdict landed"*). All four quotations in this
section survive verbatim: `measurement-records.md:333` (the 0.28 release), `:1282` (the D380
hand-off), `:410–411` and `:423–424` (the two governing sentences) `[V]`. `content/`, `schemas/`,
`packages/schema/`, `apps/server/src/sourcing/`, `pack-validation.ts`, `pack-studio.ts` and the
`Makefile` are unchanged since `b9fd803`, so every measurement in this RFC — corrected figures
included — was re-derived at the same tree the review read. D246's rule, applied twice.

**[author round 3] Applied a fifth time, and the tree moved under this round in two directions at
once.** Between rounds, **five commits** landed and two of them refuted premises rather than facts
(§0.1, §3.2c-r) — which is why this round's D246 pass checked *arguments* as well as versions.
*During* this round a concurrent agent left uncommitted edits to `apps/server/src/application.ts`,
`opponent-selector.ts`, `tablebase.ts`, `apps/web/src/lib/session-controller.ts`, three `docs/` pages
including **`docs/tablebase-grounding.md` again** (§3.2b's moving anchor, moving a second time),
`planning/exploration/log.md` and `rfc/measurement-records.md` `[V]`. **Every file this RFC cites was
re-checked against HEAD after those edits and all eighteen are byte-unchanged:** `pack-validation.ts`,
`pack-registry.ts`, `pack-studio.ts`, `graduation-report.ts`, `expression-census.ts`, all five cited
`sourcing/` modules, `apps/server/Dockerfile`, `.dockerignore`, `Makefile`,
`tools/verify-packaging.mjs`, `.github/workflows/release.yml`, `packages/schema/src/index.ts`,
`schemas/drill_pack.schema.json`, `rfc/README.md`, and the whole of `content/` `[V]`. **So every
measurement above was taken at the tree it is cited against.** The one live consequence is §3.2b's:
`docs/tablebase-grounding.md` is under uncommitted edit **again**, so the three `permanent_property`
anchors must still be chosen at landing rather than inherited from any round of this document.
**This RFC edits `rfc/graduation-clearance.md` and nothing else.**

**[author round 2] Applied a fourth time, and the tree is moving *under this round* rather than
between rounds.** At the moment this section was last re-checked, `rfc/feedback-delivery.md` and
`rfc/measurement-records.md` carried uncommitted edits from concurrent work — `feedback-delivery.md`
was modified **after** this document's own last edit `[V]` — so D246's rule was applied to the files
this RFC actually cites rather than to the repo as a whole. **All of them are byte-unchanged from
HEAD `6722130`**: `packages/schema/`, `schemas/`, `apps/server/src/`, `content/`, `Makefile`,
`.dockerignore`, `.github/`, `tools/` and `rfc/README.md` show no working-tree modification `[V]`,
and `DRILL_PACK_SCHEMA_VERSION` `"0.27"` / `DRILL_RUN_SCHEMA_VERSION` `"0.17"`
(`packages/schema/src/index.ts:1–2`) and `STORAGE_VERSION` **23** (`storage.ts:407`) re-read identical
after every measurement above `[V]`. **This RFC edits `rfc/graduation-clearance.md` and nothing
else.**

**[author round] Applied a third time, and the tree had moved again.** **Eleven** commits landed
between `b9fd803` and this round `[V]`. Re-checked rather than trusted: `content/`,
`schemas/drill_pack.schema.json`, `apps/server/src/sourcing/`, `pack-studio.ts`,
`graduation-report.ts` and the `Makefile` are **byte-unchanged** across all eleven and carry no
uncommitted edits; `pack-validation.ts` gained **7** lines (`opponent-contracts`' warning) and
`packages/schema/src/index.ts` one, moving `DRILL_RUN_SCHEMA_VERSION` to `0.17` `[V]`. **Every
`:line` citation in this RFC was re-resolved against both HEAD and the working tree and none moved**:
`graduationEntryIsBlocking` `:154`, `GRADUATION_ENTRY_LEGACY_SHAPE` `:830`, the `accepted` guard
`:838`, the `#L` allow-list `:853`, the ruling-date parse `:855`, the `clearedBy` guard `:860`,
`GRADUATION_BLOCKING_ON_PUBLISHED` `:873` `[V]`. `measurement-records.md:333` still reads *"0.28
remains the next free lane and this RFC leaves it free"* `[V]`. **The one moving thing this round had
to route around is `docs/tablebase-grounding.md`, which is under uncommitted edit — see §3.2b, where
it changes an anchor line number and nothing else.**

Its §9 already routes the graduation half of **D157**/**D380** here explicitly:

> the **graduation policy** — may a pack publish with `declared: 0`? — to `rfc/pack-graduation.md`,
> which owns `GRADUATION_REQUIRES_SOURCES` and the published-status floor. Filed as **D380**. `[V]`

**This RFC answers D380: yes, a pack may publish with `declared: 0`, provided no blocking entry
names the missing declaration as its subject.** The gate is *zero blocking entries*, not *every
axis measured*; a pack whose corpus axis was never asserted has nothing to declare, while a pack
that asserted one and did not measure it carries a `claim_bound` or `ledger_record` blocker whose
subject is that claim. **Publication is bounded by what the pack claims, never by a checklist of
axes it might have claimed** — which is the only reading compatible with §3b's *"honest labelling
of what could not be grounded."*

The overlap in the other direction is real and is a coordination note rather than a dependency. A
cleared blocker **is** a measured claim about a pack, and `measurement-records` §2 supplies the
governing distinction this RFC's §1.2 inherits rather than restates:

> A tablebase record grounds a claim by settling it. An engine record grounds a claim by making it
> falsifiable at a named cost. … The corpus is under version control and the instrument is in the
> repository, so the named cost is zero and the reviewer is a CI run. `[V]`

That is precisely why `resolved` may carry a standing predicate at all (§2.3): for the corpus-side
kinds the cost of re-deriving is zero, so *"a stale record is a failing assertion"* is affordable.
Where `measurement-records`' `census.*` assertion family lands, `shape_firing` and the corpus half
of `ledger_record` should be expressed as `census.*` assertions rather than as a second
re-derivation path. **Whichever lands second adopts the other's vocabulary in one commit**; neither
blocks the other, and this RFC claims no `census.*` names.

## Deviations from design

None. `design/03-product-breadth.md` B6 names publication channels as shipped and
`rfc/archive/pack-graduation.md` made the official channel *reachable in principle*; this RFC makes
it reachable in fact. The 2026-08-13 no-review-workflow ruling is preserved exactly and §3 is built
to be expressible without a reviewer rather than around one. Law 8 is load-bearing in §1.1, §1.3,
§1.4, §4.3 and §5.3: no clearance kind grades a move, and `pointer_authored` is explicitly stated to
prove absence rather than truth.

**[cross-review] The no-reviewer ruling survives the review intact, and this is worth stating
because §3.2a reads like an attack on it and is not.** The finding is that the *citation check* is
weak, not that acceptance needs a person. Nothing added by this review grants anyone a status,
introduces a second-party approval, or reinstates `provenance.reviewers` — the three tightenings in
§3.2a are all path-and-date arithmetic a CI run performs, which is exactly the substitution
`planning/content-era/plan.md` §3b already made: *"what replaces the reviewer's assurance is not
another assurance. It is the publication channel."* **The one thing this review will not let the
RFC do is call a convention a mechanism.**

## Acceptance criteria

1. **Schema.** `$defs/graduationEntry` carries the closed `clearance` object; `clearance` is
   required on `blocking`, `resolved.clearance` on `resolved`, `accepted.unreachableBecause` on
   `accepted`. All 56 `content/drafts/` documents, all 36 `content/candidates/*/pack.json`,
   `schemas/drill_pack.example.json` and every `schemas/fixtures/drill-pack/` file validate — **in
   the same commit as criterion 2**. Proof is `packages/schema/src/drill-pack.test.ts`'s *"validates
   every committed pack document under the closed policy"* going green unmodified.
2. **Migration completeness.** Every `blocking` entry in `content/drafts/` and
   `content/candidates/` carries a `clearance` with a resolving `subject`; every `resolved` entry
   carries a `resolved.clearance`; `make graduation-report` prints **zero** `(unspecified)`.
3. **The four stale entries clear without an author.** With the migration's Stage B leaving them
   `blocking`, **one `make graduation-clear` run per pack** demotes `mate-k-q-technique`,
   `mate-k-r-technique`, `mate-two-bishops` and `philidor-passive-rook-convert`'s
   `assessment_grounded` entries to `resolved`, and a test asserts exactly those four and no others.
   **This is the criterion that proves the vocabulary is a bridge and not a form.**
   **[author round 2 — [[D466]]] Rewritten against a command that exists, because *"one checker run
   demotes"* named no writer.** The assertion is: `clearGraduationEntries(file)` over each of the four
   returns a `GraduationTransitionResult` whose `transitions` has **length 1** and whose `held` lists
   the pack's other **five** blocking entries with a `does not hold` / `no predicate` verdict — all
   four packs carry **six** blocking entries at HEAD `[V]`. The test additionally asserts that the
   pack's `.graduation.json` is written, that `ledger.packDigest` equals a fresh
   `digestDrillPack(pack)` afterwards (§6.5(4)), and that `graduationReport()`'s `documents:` count for
   `content/drafts` is **unchanged at 56** — which fails if the `graduation-report.ts:8` filter change
   was missed, and is the cheapest possible detector for it.
   **[author round 3 — [[D503]]] This criterion is the one that caught the round's largest defect, and
   it only catches it because the population is named.** `philidor-passive-rook-convert` is one of the
   four and it carries a **`shape_firing`** blocker alongside its `assessment_grounded` one; its shape
   entry `philidor` fires on **3** of the pack's positions `[V]`, so under round 2's D predicate
   `transitions` would have been **2** and this criterion would have gone red on the landing commit.
   **The criterion is kept exactly as written** — `transitions` length 1, `held` listing the other five
   — **because §2.5's non-vacuity rule is what makes it true**: Stage A may not write the vacuous
   `shape_firing` clearance in the first place. **A criterion that would have failed, and a rule added
   so it passes for the right reason, is the difference between this and waiving it.** The `held` list
   for `philidor-passive-rook-convert` must therefore contain its shape entry with a **`no predicate`**
   verdict, not a `does not hold` one.
4. **Demotion is provable.** A negative test deletes a `tablebase_result` record from a fixture
   ledger and asserts `GRADUATION_RESOLUTION_STALE` fires **and `graduationReport(roots, { verify:
   true })` drops that pack from its graduable set**. **[cross-review] The draft said *"the gate
   predicate counts the entry as `blocking` again"*, which is not testable** —
   `graduationEntryIsBlocking` is a synchronous pure state read that never sees a ledger (§2.3a).
   The criterion is rewritten to assert the thing that actually changes, and criterion 4a below
   asserts the thing that does not.
4a. **The studio hole is asserted, not left implicit.** A test registers a stored draft whose
   `resolved.clearance` does not re-derive and asserts that `PackStudio.register` **succeeds** — the
   documented, bounded limit of §2.3a — together with a comment naming **D417** as its owner. A
   limit an RFC states and a test pins is a limit; a limit only the prose mentions is a surprise
   for whoever finds it next.
5. **`unbuilt` cannot launder.** A test asserts a `clearance.kind: "unbuilt"` entry cannot be
   `resolved` (error) and cannot be `accepted` (error), at an exact JSON pointer.
6. **Acceptance still costs a citation.** All 43 existing `accepted` entries carry a resolving
   `rulingRef` **and** a non-blank `unreachableBecause` after the migration;
   `content/accepted-conditions.md` is byte-identical to a fresh `make graduation-report` run and
   now contains the 5 Stage-C fixtures as the corpus's first `out_of_scope` entries.
   **[author round] Two additions, both from §3.2b's payability run.** (a) The 3
   `permanent_property` entries gain a `#L<line>` anchor into `docs/tablebase-grounding.md`, chosen
   **at landing** because that file is under uncommitted edit today — `GRADUATION_RULING_UNANCHORED`
   is what makes the omission fail rather than pass silently. (b) The criterion explicitly asserts
   that **no acceptance gains a date it did not have**: the 3 `permanent_property` rulings are
   undated by nature and stay undated, which is why tightening 3 was withdrawn (§6.3).
7. **Emitters emit clearance.** `distill.ts`, `sourcing/openings.ts`, `sourcing/position-seeds.ts`
   and `sourcing/syzygy.ts` write a `clearance` **from a checked-in template registry this commit
   creates** — **[cross-review]** `pack-graduation` §1.6 specified one and it did not ship; all four
   emitters carry inline literals at HEAD `[V]` (§6.2). A freshly emitted document validates against
   the closed schema. Three of the four validate their own output and throw
   `SourcingError("EMITTED_PACK_INVALID")` (**D239**), so this is a landing requirement, not a
   follow-up. **Stage 0 fails loudly on an id the registry does not know**, which is how the
   non-templated candidate entries (§6.2) surface rather than silently take a wrong `clearance`.
   **[author round] The registry carries exactly 9 ids and a test asserts the count** (§6.2a):
   `mechanical-objective-placeholder`, `outcome-ungraded`, `start-assessment-absent`,
   `target-elo-authored`, `authored-teaching-absent`, `opponent-policy-authored`,
   `tablebase-opponent-not-selected`, `recorded-play-needs-authoring`,
   `mechanical-objective-needs-grounding`. Three of the nine have **zero** instances in
   `content/candidates/` today, so the test must assert the registry against the **emitters'
   literals**, not against the corpus — asserting against the corpus would silently accept a
   seven-entry registry and re-open the gap at the next emitter run.
8. **The graduable set is reported, not asserted.** `make graduation-report` runs from a clean
   checkout, prints `clearable` and `unclearable` per root, and its graduable-set line agrees with
   an independent re-derivation. **[cross-review] The expected value at landing is `(none)`, and
   the criterion should say so plainly**: §5.2a establishes that none of the 50 authored packs
   clears on instrument runs alone, so **`clearable: 173 / unclearable: 47`** over an unchanged
   `(none)` graduable set is the **passing** result. The criterion asserts the printed numbers match
   the re-derivation, never that the graduable set is non-empty — a landing that produced a
   graduable pack would be evidence of a **mis-assigned kind**, not of progress, and should be
   investigated before it is celebrated.
9. **Nothing else moved.** `DRILL_RUN_SCHEMA_VERSION` and `STORAGE_VERSION` are byte-identical
   **across this RFC's diff** — **[author round]** whatever their values are at landing, which are
   `0.17` and `23` today and have both moved since drafting (§7); the criterion is a diff assertion,
   never a value assertion, and stating it the other way is how a register fact goes stale. No
   `$defs` outside `graduationEntry` changed; `sourcing-check`'s severity rules are untouched.
10. **Digests.** At the **end of the landing commit**, `make sourcing-check` over every draft
    reports `0` `EVIDENCE_DIGEST_STALE`; whichever RFC lands second re-stamps every ledger its own
    change moved (**D209**).
11. **[cross-review, satisfied in the author round] The classification is re-derivable by a second
    party.** The **§5.1a ruleset, published as a literal**, ships as a checked-in classifier under
    `tools/`, and re-running it over `content/drafts/` reproduces the pre-hand-pass rule counts
    **[author round 3, [[D503]]] unbuilt 35 / corpus 46 / citation 54 / engine 37 / tablebase 5 /
    shape 16 / authored 10 / residue 17** `[V]`, and — after §5.1b's 17 hand assignments, which ship as
    a checked-in table the classifier reads rather than as judgement re-applied at run time — the kind
    counts **A 5 / B 38 + 46 / C 55 / D 18 / E 11 / F 38 / G 9**, summing to **220** `[V]`. **Both rows
    were produced by running the published literal at HEAD, not by adjusting the previous round's**;
    the pre-D503 output (`unbuilt 29 … shape 22`) was reproduced first and byte-identically, so the
    six-entry move is attributable to the two added keywords and to nothing else `[V]`. The classifier
    exits non-zero if a `content/drafts/` statement matches no rule **and** is absent from the hand
    table, so a later corpus addition cannot silently join the residue. Without this, no reviewer can
    check the numbers planning consumes, which is D245's lesson applied to this RFC rather than
    quoted by it.
12. **[cross-review, revised author round] The citation guard is tightened and tested, and the test
    is the one that catches the attack.** Three assertions, in the order §3.2b establishes they
    matter: (a) a `rulingRef` whose cited **line** blames to the commit under review or to the
    all-zero *Not Committed Yet* sentinel raises `GRADUATION_RULING_SELF_MINTED` — **this is the
    assertion that fails the same-wave author, and neither of the other two does**; (b) an
    `accepted.rulingRef` with no `#L<line>` anchor raises `GRADUATION_RULING_UNANCHORED`, for all
    three `accepted.kind` values; (c) `"planning/exploration/log.md#L<n>"` fails when line *n* does
    not contain the ruling's quoted date. **All 43 committed acceptances still pass** — 40
    `owner_ruling` on line 1231, which blames to `ee34f1e5` of 2026-08-13 and contains
    `2026-08-13` `[V]`, and 3 `permanent_property` once the migration adds their anchors. **A test
    asserting only (b) and (c) would go green while the door stayed open**, which is why the order is
    normative and not stylistic.
    **[author round 2] Assertion (a) moves with its code.** Per §3.2c it is a **graduation-sweep**
    assertion, not a `validatePackDocument` one, and the test must run it in a checkout. **(b) and
    (c) split**: (b) stays a `validatePackDocument` unit test, and (c)'s *"line n contains the
    ruling's date"* half moves to the sweep with the arm that performs it.
13. **[author round 2 — [[D464]]] `recordKind` is the shipped enum, asserted against the shipped
    enum.** A test imports `EVIDENCE_KINDS` from `apps/server/src/sourcing/types.ts` and asserts it is
    set-equal to `clearance.recordKind`'s enum in `schemas/drill_pack.schema.json` — **seven strings,
    both sides** `[V]`. Asserting a literal seven-item list on the schema side alone would pass while
    a new evidence kind silently became unexpressible in a clearance, which is the failure this
    criterion exists to catch. A second assertion covers the pointer rule: a `ledger_record` clearance
    with `subject: "/feedbackClaims/0/text"` raises `GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE`, and
    the same entry with `kind: "claim_bound"` does not. **Non-vacuity is established first**: the test
    asserts that `PROSE_POINTERS` (`check.ts:36`) actually contains the `/feedbackClaims/\d+/text`
    pattern before asserting the lint keys on it.
14. **[author round 2 — [[D465]]] The one removed-referent resolution is expressible and re-derives
    both ways.** After Stage B, `content/drafts/anti-caro-advance-early-c5.json`'s entry
    `refuted-and-deleted-2026-08-15-the-pack-s-largest-single` carries
    `resolved.clearance.kind: "referent_removed"` with `absentIds` naming `bxc5-recoup` and
    `bxc5-trade`, and **two** assertions run: the predicate **holds** on the committed document, and
    re-inserting a spine node with id `bxc5-recoup` into a copy makes `GRADUATION_RESOLUTION_STALE`
    fire. **The second assertion is the criterion**; the first alone would pass on a predicate that
    can never fail. A third asserts `GRADUATION_CLEARANCE_REMOVAL_ON_BLOCKING` on the same clearance
    attached to a `blocking` entry. **Population check, per the rule that a criterion must select a
    non-empty set:** this criterion selects **1 of 30** resolved entries and the other 29 are covered
    by criterion 2 — measured, not assumed (§2.2a).
15. **[author round 2 — [[D467]]] `validatePackDocument` touches no filesystem for graduation, and the
    test proves it by changing the answer's environment rather than by reading the code.** A test
    validates a document carrying an `accepted` entry whose `rulingRef` is
    `planning/exploration/log.md#L1231` **from two different working directories** — the repo root and
    a fresh `mkdtemp` — and asserts the returned issue-code multisets are **identical**. **Today that
    test fails, and this was run rather than predicted**: `pack-check` over
    `content/drafts/anti-caro-advance-early-c5.json` prints *"Pack check passed"* from the repo root
    and raises `GRADUATION_RULING_UNCITED` from a temp directory, because `pack-validation.ts:848–851`
    resolves against `process.cwd()` `[V]` (§3.2c has the transcript). **It is the only
    assertion in this RFC that reproduces the production behaviour without building an image**, which
    is why it is the one that must exist. A second assertion pins the split: the sweep, run in the
    checkout, still raises `GRADUATION_RULING_SELF_MINTED` for a self-minted citation — so moving the
    arms did not delete the guarantee, it relocated it.
    **[author round 3 — REWRITTEN, because the defect it tested is fixed and testing for it now
    asserts the wrong thing.** [[D468]] is ✅ closed by packaging (§3.2c-r), so the cwd-independence
    assertion is no longer about *"`validatePackDocument` touches no filesystem"* — it demonstrably
    does, deliberately, and the image now carries what it touches. **The criterion becomes a packaging
    criterion and keeps its teeth:** (a) every member of `GRADUATION_RULING_ANCHOR_ROOTS` is `COPY`ed
    into `apps/server/Dockerfile`, asserted by `tools/verify-packaging.mjs` in the shape it already
    uses at `:88–99` `[V]` — **so a new citable document cannot be added to the allow-list without a
    Dockerfile line**; (b) a test validates an `accepted` entry whose `rulingRef` names an allow-listed
    document **not** in the `COPY` set and asserts `verify-packaging` fails, which is the assertion that
    would have caught D468 before it shipped; and (c) the sweep, run in a checkout, still raises
    `GRADUATION_RULING_SELF_MINTED` for a self-minted citation — the half of §3.2c that survives.
    **(b) is the criterion**; (a) alone would pass on a two-item list that happens to match today's
    corpus, which is exactly the state HEAD is in.
16. ~~**[author round 2 — [[D467]]] The admission rule runs on the artefact that ships.**~~
    **[author round 3 — WITHDRAWN, satisfied at HEAD.** `.github/workflows/release.yml` gained a
    `verify` job (`:12–30`) running `make verify` with `ENGINES_REQUIRED: "1"`, and **both image jobs
    declare `needs: verify`** (`:33`, `:57`) `[V]`. **[[D469]] is ✅ closed 2026-08-17 — *"both image
    jobs depend on an engine-required `make verify` release job"*.** So the added step this criterion
    demanded exists and was landed by other work. **What the criterion was protecting is now inherited
    rather than asserted, and that is a real weakening worth naming:** the graduation admission sweep
    runs on the release path **only because it is inside `make verify`**, so §6.3's requirement that
    the sweep's admission codes fire in verify mode is the load-bearing clause, and criterion 12(a)
    already asserts it. **A criterion an RFC can withdraw because the tree caught up is the return loop
    working; a criterion silently dropped is not, which is why this row stays and is struck.**
17. **[author round 3 — [[D503]], §1.2c] Every kind's `subject` grammar is asserted, and asserted
    against the shipped enforcer rather than against a literal.** Five assertions, one per mechanical
    kind: a `claim_bound` clearance with `subject: "/objective/grading/assessedBy"` raises
    `GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL`; a `shape_firing` clearance on a document with no
    `shapes` key raises it; an `assessment_grounded` clearance on any subject but
    `/objective/grading/assessedBy` raises it; a `ledger_record` clearance on `/feedbackClaims/0/text`
    raises it (the withdrawn `…_UNSUPPORTABLE` case, preserved); and a `pointer_authored` clearance
    whose subject resolves to a non-string raises it. **Non-vacuity is established first, in the shape
    criterion 13 established:** the test asserts that `validateClaimBindings` really does raise
    `CLAIM_POINTER_INVALID` on a non-`/feedbackClaims/<i>/text` pointer (`claim-binding.ts:178`) before
    asserting that the lint keys on the same grammar — **otherwise the C row is a rule this RFC
    invented rather than a rule the tree enforces**, and the whole point of §1.2c is that it is the
    second.
18. **[author round 3 — §2.5] The predicate is run over the corpus, and the assertion is that it does
    NOT hold.** Over `content/drafts/` after Stage A, `make graduation-clear CHECK=1` reports **zero**
    `GRADUATION_CLEARANCE_VACUOUS` — i.e. no `blocking` entry carries a clearance whose predicate
    already holds — **except the four §4.1 names, which are enumerated in the test by id.** Two
    supporting assertions pin the mechanism rather than the outcome: the census result exposes
    `subjects[].site.subject.kind` and `subjects[].coverage.corpus.packs` (the two paths §6.5's D row
    reads off an `any`-typed return, so a rename would otherwise fail silently), and a fixture whose
    `shape_firing` clearance names a shape entry firing in *another* pack but not its own re-derives as
    **does not hold**. **This is the criterion D503's return would have been caught by**, and it is
    written as *the predicate must fail* rather than *the predicate must run*, because sixteen entries
    proved that running is not the hard part ([[D451]]).
19. **[author round 3] The corpus premises this RFC argues from are re-derived in the landing commit,
    not quoted from it.** A test asserts, at the moment of landing: `graduationReport()` over
    `content/drafts` reads **56 / 220 / 30 / 43**; `PackRegistry.loadDefault` indexes **50**;
    `runExpressionCensus().evidence.totals` reads `{packs: 50, claims: 196, backedClaims: 1}`; and the
    32 ledgers hold **764** records split `engine_eval` 391 / `tablebase_result` 341 /
    `position_legality` 32 `[V]` — every one reproduced at HEAD by this round. **Three of this
    document's premises were refuted between rounds by work that had no reason to know about it**
    (`.dockerignore`, `loadDefault`'s development gate, the Dockerfile's `COPY` set), and each was
    prose rather than an assertion. **A premise an RFC argues from and no test holds is a premise that
    will be refuted by a commit nobody connected to this document.**

## Discharges

none

## Open questions

1. **Do the 5 browser fixtures become `accepted`, or do they leave `content/drafts/`?** §6.2 Stage C
   accepts them as `out_of_scope`, which is cheap and correct-in-kind. The alternative — moving all
   six fixtures out of `content/drafts/` — is what **D227** and **D257** actually ask for, and it
   would delete the `.browser.json` suffix check in `graduation-report.ts:25` and fix every corpus
   denominator at once. **Recommended: accept them here and leave the move to whichever RFC owns
   D227**, because moving fixtures touches 16 files that hardcode draft paths (**D211**) and this
   RFC has no other reason to. *Author's call unless the owner wants the denominators fixed now.*
   **[author round 3] CLOSED on the recommendation, and the premise it turned on is gone.**
   **[[D227]] and [[D257]] are both ✅ closed at HEAD** and were closed **without the move**: `3524b8e`
   added the exported predicate `isPackDocumentName` (`pack-registry.ts:185`), which excludes
   `*.browser.json` from catalogue discovery, and the six fixtures are still in `content/drafts/` `[V]`.
   So *"the alternative is what D227 and D257 actually ask for"* no longer names an open owner. Stage C
   accepts the five as `out_of_scope`, unchanged. **The one thing the closure adds is a small live
   defect this RFC must not inherit silently:** there are now **two** pack-discovery predicates in the
   tree and they disagree — `isPackDocumentName` excludes the fixtures and `graduation-report.ts:8`'s
   inline literal does not `[V]`, which is why the catalogue denominator moved 56 → 50 while every
   graduation denominator in this document stayed 56. Reported at §Ledger rows; **not fixed here,
   because changing `graduation-report.ts`'s denominator would move every number in this document in
   the commit that lands it.**
2. **Should `claim_bound` clear on attachment, or require a `measurement-records` `census.*`
   assertion?** §1.3 rules attachment, because the mechanism (`claimBindings`, pack 0.26) is landed
   and the assertion family is not. If `measurement-records` lands first, the corpus half of
   `claim_bound` has a stronger predicate available and should take it. *Not an owner call — a
   landing-order question, and §8 states the rule (whichever lands second adopts the other's
   vocabulary).*
   **[author round] CLOSED — no decision is owed here.** §8's landing-order rule already decides it
   in both directions, and `measurement-records` is *returned to author* with three open questions,
   so it cannot land first by accident.
3. **Is `GRADUATION_RESOLUTION_STALE` a warning or an error in `content/drafts/`?** §6.3 says
   warning in drafts, error in packs, on **D238**'s reasoning that a criterion which reddens the
   build for debt this RFC declines to pay is a criterion that gets waived. The counter-argument is
   that a stale *resolution* is not debt this RFC declines to pay — it is a false statement in a
   committed file, which is a different species from an unpaid blocker. **Recommended: keep it a
   warning for one wave, then flip**, owned by the first content wave that drives it to zero, which
   is the mechanism `pack-graduation` §5.1 already established for the sourcing ratchet. *Not an
   owner call; a severity ruling with a named trigger.*
   **[author round] CLOSED on the recommendation, and the counter-argument is kept rather than
   dismissed.** A stale resolution *is* a false statement in a committed file, and the only reason
   it ships as a warning is that flipping it to `error` on day one reddens the build for entries
   nobody has had a chance to re-derive yet. **The trigger is named and it is not "someday": the
   first content wave that drives `GRADUATION_RESOLUTION_STALE` to zero flips it in the same
   commit.** A severity deferral with no named flipping condition is how [[D238]] happened.
4. ~~**Does the 12-entry `unreachable` residue get read before or after landing?**~~ **[cross-review]
   ANSWERED — before, and the recommended default was the wrong one.** The draft correctly
   identified this as *"the only place in this RFC where the safe default is not obviously the
   strict one"*, and then recommended the unsafe side anyway on the argument that `unreachable`
   alone still blocks. Two things break that argument:
   - **The residue is measurably `unbuilt`-shaped, not `unreachable`-shaped.** Sampled at HEAD, the
     entries matching no instrument keyword are dominated by missing *runtime surfaces* and *format
     encodings*, not by properties of the world: *"the drill has no fifty-move counter surfaced even
     though the annotations argue from it"* (×2 packs), *"the variants rule has no encoding … a
     root-identity field or pack-group would make the convert…"*, *"first-move alternatives cannot
     be deviations in a `follow_theory` pack … third/fourth attestation of wave-2 friction #3"*
     (×2), *"`pack-check` raises `PLAN_SIGNATURE_INLINED` on the copied expressions … the checker
     both demands and refuses the alternative"* `[V]`. **Every one of those names a thing someone
     could build.** They are the definition of `unbuilt` and the negation of `unreachable`.
   - **"It still blocks" is the argument that makes the default dangerous, not safe.** `unreachable`
     is the sole kind eligible for `accepted` (§2.4), and `unbuilt` **can never be** (§1.2). So the
     default routes a population of format gaps into the one bucket from which a later wave can
     launder them out with a citation — and the later wave will not re-read the statements, because
     the migration will have written a kind that looks considered.
   **Ruling: do not default. Classify all 12 by hand before landing and list them in this RFC**
   (§5.1's second obligation). Twelve rows is an afternoon, `unbuilt` needs a `blockedBy` a machine
   cannot invent, and this is the one place where §6.2's *"a wrong mechanical kind fails to clear
   rather than clearing wrongly"* safety argument **does not apply** — a wrong `unreachable` fails
   in the direction that clears. *No longer an owner call; the measurement decides it.*
   **[author round] CLOSED. The ruling is implemented in §5.1b and the residue is 17, not 12.** All
   17 are listed by pack, entry id, statement and hand-assigned kind. **The ruling is vindicated and
   its supporting sample is superseded**: 8 of the 17 are **not** `unreachable`, so defaulting would
   have routed a missing format surface, two plan-class signatures and a Stockfish-settleable
   tactical line into the one bucket eligible for `accepted`. But the four statements the
   cross-review sampled as evidence (*fifty-move counter*, *variants rule has no encoding*,
   *`follow_theory` first-move friction*, `PLAN_SIGNATURE_INLINED`) **are not in the residue at all**
   under the published ruleset — rule 1 claims every one of them `[V]`. They were residue only
   because nobody had written the rule down. **The right lesson is therefore not "the residue is
   `unbuilt`-shaped" but "an unpublished ruleset manufactures a residue out of its own gaps", and
   that generalises past this RFC** — reported as a new ledger row (§Ledger rows).
5. **Who owns re-reading the 220 statements for compound conditions?** `pack-graduation` §1.3 rules
   that one entry states one condition and concedes the rule is not machine-enforceable; its §4.2
   found **42 of 48** resolution-marked entries were compound. A `clearance` with a single `subject`
   makes compoundness *visible* for the first time — an entry needing two subjects is compound by
   construction — but this RFC does not split any. **Recommended: the checker warns when an entry's
   statement is longer than a threshold and its clearance names one subject**, as a lead rather
   than a verdict. *Deferred to the first content wave; recorded so it is not rediscovered.*
   **[cross-review] Sharpened with a measurement the draft did not take:** the corpus's longest
   blocking statements are compound *by inspection* — one entry combines a digest-staleness fact, a
   named cause, a scope note and a remedy in a single paragraph; another combines a corpus-band
   refusal with an engine-pass finding. **A length threshold will therefore fire on the honest
   entries too**, since this corpus's authors write long *for a reason*. Prefer the structural
   signal the draft already identified — an entry whose statement names **two or more** distinct
   instruments (`engine` and `explorer`, say) while its clearance names one `kind` — which is a
   lead with a false-positive rate a reader can live with. Still deferred; the refinement is
   recorded so the first wave does not ship a length lint and then delete it.
6. **[cross-review] NEW — is `subject` one pointer or a list?** §1 fixes `subject` as a single JSON
   pointer, and open question 5 then observes that *"an entry needing two subjects is compound by
   construction"* — which is a **feature** only if the vocabulary can express the two-subject case
   at all. It cannot: the schema takes a string. So a genuinely compound entry has exactly two legal
   moves, **split it** or **file it under the kind that covers the widest of its conditions**, and
   the second is the one an author under time pressure takes. The alternative is
   `subject: string | string[]` with the predicate required to hold for **every** element, which
   costs one line of schema and makes the compound case expressible-and-honest instead of
   expressible-only-by-lying. *Author's call. Recorded rather than fixed in place because it
   touches §1's central shape and the RFC's author should decide whether compoundness is something
   the vocabulary tolerates or something it refuses.*
   **[author round] ANSWERED — `subject` stays a single string, and the ordering is what makes that
   honest rather than lossy.** A list would make compoundness *expressible*, and a thing the format
   can express is a thing the format has decided to keep: `pack-graduation` §1.3 already rules that
   **one entry states one condition**, and widening `subject` would contradict a landed ruling in
   order to make its violation comfortable. The reviewer's objection — *"the second is the one an
   author under time pressure takes"* — is right about the pressure and wrong about which of the two
   moves is dangerous, and the published ruleset is why. **§5.1a's rule order is
   hardest-to-clear-first**: `unbuilt` (no instrument can ever) → `corpus` (author a sentence, then
   query) → `citation` (find a source) → `engine`/`tablebase` (run a command) →
   `shape` → `authored` (weakest predicate in the vocabulary, §4.3). So a compound entry filed under
   *"the kind that covers the widest of its conditions"* lands on the **hardest** of them, and a
   compound entry can only ever be filed **too strictly**, never too loosely. The draft stated this
   for the `unbuilt`-first case only (*"chosen to be safe rather than flattering"*); **it is a
   property of the whole ordering and is normative as such.** The corpus's clearest compound entry —
   §5.1b row 2, `carlsbad-minority-attack`'s *"All four feedbackClaims need grounding: … author
   principles with no evidence; … could be mechanically checked; … a hypothesis that a comparison
   corpus could actually test"* — takes `claim_bound`, the hardest of the three routes it names, and
   stays blocking until all four claims are bound. *No longer an author's call; the ordering decides
   it, and open question 5's deferred lead is the follow-up.*
7. **[author round] NEW — where the ruleset and an entry-level reading disagree, which one does
   Stage A write?** §5.2 records one live case: `kid-classical-black`'s *"no corpus measurement of
   tempo-vs-result in KID races exists in this repo"* is **B(corpus)** to rule 2 and **F `unbuilt`**
   to §5.2a's reading of D155, and both readings are defensible from the same sentence `[V]`. This
   RFC publishes the ruleset's answer, because a ruleset amended per entry to match a conclusion
   stops being re-derivable (criterion 11) — but Stage A writes a **diff a human reviews**, and the
   question is whether that reviewer may overrule the ruleset in the commit. **Recommended: yes, and
   only in the F direction.** An overrule toward `unbuilt` costs a delay; an overrule toward any
   clearable kind is the laundering move open question 4 exists to prevent, and toward `unreachable`
   it is the one §6.2's safety argument explicitly does not cover. So: **Stage A's reviewer may move
   an entry to `unbuilt` and may not move one out of it**, and every such move is a line in the
   commit with the ruleset's original assignment beside it. *Author's call, recommended above;
   escalated to the owner only if the asymmetry looks like a licence rather than a ratchet.*
   **[author round] CLOSED on the recommendation — it is a ratchet, and the asymmetry is what makes
   it one.** A reviewer who may only move entries *toward* `unbuilt` can make the corpus look worse
   and never better, so the move has no laundering value; the ledger's whole acceptance-back-door
   family ([[D425]], [[D435]]) is about moves in the opposite direction. **Every overrule is a line
   in the commit carrying the ruleset's original assignment beside it**, which is what keeps the
   ruleset re-derivable (criterion 11) while still letting a human catch what a keyword list cannot.

## Ledger rows

Added to `design/BACKLOG.md` by claude (this RFC does not edit the ledger — concurrent agents
collide on it).

**[cross-review] LANDED AS D404–D409, NOT D401–D408.** The draft minted D401–D408 as *"the block
above the highest id in use (D400)"*; claude had spent D401–D403 on the D400 reconciliation minutes
earlier, and the eight proposed rows landed as **six** — the two `unbuilt`/`unreachable` findings
merged, and the two claim-backing/47-of-50 findings merged. The renumbering is itself a ledger row
(*"Ledger id blocks collide when two agents are issued one in the same hour"*, 2026-08-16), and
**the highest id in use is now D415** `[V]`, so the cross-review rows below take **D416–D418**.
Mapping, so a reader of either numbering can follow:

| proposed | landed | row title as landed |
|---|---|---|
| D401 | **D404** | *`clearedBy` is populated in exactly zero of 436 graduation entries, so the only clearance lint fires zero times* |
| D402 | **D405** | *The rubber stamp already exists, and it is `resolved`, not `accepted`* |
| D403 | **D406** | *Four blockers are stale and nothing detects staleness* |
| D404 + D405 | **D407** | *`unbuilt` is being filed as work, and it is not work* |
| D406 | **D408** | *Acceptance needs no reviewer because it was never a person's act* |
| D407 + D408 | **D409** | *47 of 50 authored packs cannot graduate without new authoring, and the split is the finding* |

**Two landed rows carry figures this review corrected and need claude to amend them:** **D409**
says *"the census reads 254 claims with exactly 1 backed"* — it is **196** claims (§1.2), and
**D403**, three rows above it in the same file, already says 196 — and **D409**'s *"only 3 packs
graduate on instrument runs alone"* is refuted by §5.2a; the honest figure is **0 of 50**.

**[author round] The amendment list is now four rows, and two of the cross-review's own corrections
are themselves corrected — which is the whole reason [[D424]] exists.** This RFC does not edit
`design/BACKLOG.md`; the rows below are **reported for claude to land**:

| row | reads | should read | source |
|---|---|---|---|
| **D409** | *"the census reads 254 claims with exactly 1 backed"* | **196 claims, 1 backed** (`evidence.totals`; 254 is the per-citation sum) | §1.2 `[V]` |
| **D409** | *"only 3 packs graduate on instrument runs alone"* | **0 of 50**, and the 3 were also the wrong 3 (§5.2a) | §5.2a `[V]` |
| **D409** | *"47 of 50 … 23 wait on an instrument, 24 wait on a human"* | **50 of 50 need new authoring; 27 instrument-bound / 23 authoring-bound.** The cross-review's own correction to *23 / 27* was computed with an unpublished `unbuilt` rule and **inverts** under the published one | §5.2 `[V]` |
| **D426** | *"3 of 143 candidate entries are not templated at all (two hand-written)"* | **2 match no emitter template**; a **3rd** matches a real `syzygy.ts` template the draft's five-item list omitted. And the registry carries **9 ids over 11 literals**, not 9 literals | §6.2a `[V]` |
| **D425** | implies the three tightenings close the door | **they do not**: tightening 1 never fires on an appended log, tightening 2 passes the attack, tightening 3 is **unpayable** (fails 3 of 3 committed `permanent_property` entries). The closing check is a **line-level `git blame`** | §3.2b `[V]` |

**The pattern is worth naming rather than just fixing: a figure corrected once in a cross-review is
not thereby correct.** D409's split was wrong in the draft, corrected in the review, and wrong
again — because both passes computed it from a ruleset neither published. **The fix that ends the
sequence is not another correction; it is §5.1a.**

The eight rows as originally drafted are kept below unedited, because the landed rows are the
register and this section is now the *provenance* of them rather than a second copy.

- **D401** 🐞 *`clearedBy` shipped as an optional free-text field and is empty in 100% of the
  corpus.* 0 of 293 entries under `content/drafts/` and 0 of 143 under `content/candidates/` carry
  one, so `make graduation-report` prints `clears via (unspecified)` on all 220 blocking lines, and
  `GRADUATION_CLEAREDBY_UNRESOLVED` — guarded by `typeof row.clearedBy === "string"` — fires **zero
  times**. The general form: **an optional field that records the discharge condition of a
  mandatory gate is a field nobody writes**, and its lint is decoration until it is required.
- **D402** 🐞 *All 30 `resolved` entries carry one byte-identical `resolved.by`.* *"The recorded
  work was completed; the original statement remains as history."* — a migration placeholder in the
  state that is supposed to mean *the condition is gone and is checkable*. `accepted` was hardened
  against assertion by `rulingRef` and `resolved` never was, which inverts the priority: there are
  43 acceptances and there will be hundreds of resolutions. **The rare state got the guard and the
  common state got an author's word.**
- **D403** 🐞 *Four graduation blockers are stale and nothing detects staleness.*
  `mate-k-q-technique`, `mate-k-r-technique`, `mate-two-bishops` and `philidor-passive-rook-convert`
  each assert *"no sourcing sidecars were produced"* while carrying 25–27 `tablebase_result`
  records and passing `sourcing-check` at **strict** — i.e. `assessmentGrounding` returns
  `ledger_verified` for all four. Their debt was paid and the field never noticed. Counterweight
  measured in the same pass: all 16 *"no engine pass"* entries are true (0 `engine_eval` records
  each), so the corpus is honest with four exceptions — which is what makes a re-derived predicate
  the fix rather than an audit.
- **D404** 🐞 *A permanent refusal is filed as outstanding work in five committed fixtures.*
  `immediate-guard`, `outcome-hold`, `outcome-resist`, `stated-reasoning` and `trajectory-legs`
  each carry one `blocking` entry reading *"never publish as chess content"* — the definition of
  `accepted` / `out_of_scope`, the one `kind` with **zero** corpus instances. Same defect
  `pack-graduation` §0.2 found for the 37 no-review-workflow entries, surviving its own migration
  in a population Stage B did not read. The sixth fixture has zero blockers and is held out of the
  graduable set by a `.browser.json` suffix check.
- **D405** 💡 *`unbuilt` and `unreachable` are different, and conflating them is how a backlog
  becomes a permanent exemption.* *The instrument does not exist yet and someone owns building it*
  must keep blocking; *no instrument can ever exist, by a property of the world* is the only thing
  that may be accepted. 28 of 220 blocking entries are the first; ~12 are the second. `perfect_
  tablebase` opponent substitution is `unbuilt`; an eleven-piece position above the Syzygy bound is
  `unreachable`. **Only the second may ever be cited into `accepted`.**
- **D406** 💡 *Acceptance needs no reviewer because it was never a person's act.*
  `planning/content-era/plan.md` §3b already rules that an assertion no source and no instrument
  can reach *"stays ungrounded, permanently and in writing"* — so acceptance is **citing a decision
  that already exists**, which `GRADUATION_RULING_UNCITED` already checks mechanically. The struck
  reviewer role does not need a replacement; it needs its absence written into the vocabulary.
- **D407** 🐞 *The corpus has 254 feedback claims and exactly one backed claim.*
  `runExpressionCensus` reports it directly, split `author_principle` 82 / `corpus_observed` 60 /
  `derived_feature` 43 / `tablebase_exact` 37 / `hypothesis` 24 / `engine_validated` 8, and
  `claimBindings` — the pack-0.26 mechanism that makes a citation machine-visible — is used by **1
  of 32 ledgers**. Sharpens **D267** (*"no instrument in this repo can see a citation"*): one now
  can, and it is unused. The largest clearance class in the corpus (52 entries) is mechanizable and
  unpaid, and those are not the same word.
- **D408** 🐞 *47 of 50 authored packs cannot graduate without new authoring, and the two halves are
  different problems.* 23 wait on an instrument that does not exist (tablebase opponent selection,
  the game-level tempo corpus of **D155**, Maia practical difficulty, format gaps); 24 wait on a
  human to write chess judgement or find a source, which law 8 forbids manufacturing. Only 3 —
  `anti-french-advance-white`, `kid-classical-black`, `leningrad-dutch-black` — graduate on
  instrument runs alone. **A vocabulary that makes 108 of 220 entries mechanically decidable will
  produce a wave of green checks that reads as "nearly solved"**, and this number is the guard
  against that reading.

### [cross-review] New rows this review opens — **D416–D418**, for claude to land

- **D416** 🐞 *`pack-graduation` specified two lint codes and an emitter template registry, and none
  of the three shipped.* A sweep for `GRADUATION_[A-Z_]*` over `apps/`, `packages/`, `schemas/`,
  `content/` and `tools/` returns **seven** codes, and neither `GRADUATION_RESOLVED_WITHOUT_RESOLUTION`
  (§6, §1.1) nor `GRADUATION_ACCEPTED_WITHOUT_RULING` (§6) is among them `[V]`; the effect survives
  only because the schema happens to make both fields `required` + `nonEmptyString`. The *"named,
  checked-in template list — id plus template"* of §1.6 is likewise absent: all four emitters carry
  inline object literals (`openings.ts:115`, `position-seeds.ts:227`, `syzygy.ts:170`,
  `distill.ts:43`) `[V]`. **The general form is the one D400's reconciliation is already chasing,
  one tier lower: an RFC's acceptance criteria are checked against its *behaviour*, and a code name
  is not behaviour**, so a specified-but-unimplemented lint passes every gate the repo has.
  `graduation-clearance` cites both codes as shipped, which is how the gap surfaced.
- **D417** 🐞 *The graduation gate cannot see a ledger, so `resolved`-by-assertion survives on the
  studio route no matter what the corpus checker does.* `graduationEntryIsBlocking`
  (`pack-validation.ts:154–158`) is `state === "blocking"`, synchronous, one entry, no filesystem;
  `PackStudio.register` calls it over a document read from `pack_drafts.document_json`, which **has
  no `.evidence.json` beside it** `[V]`. So `GRADUATION_RESOLUTION_STALE` — however correct — reaches
  `content/drafts/` and `content/packs/` and can never reach the register. The bound is real
  (registered packs do not enter `content/packs/`, the only root a production image contains) and
  the hole is real, and **closing it is a storage change**: stored drafts would need a sidecar
  concept, which is a `STORAGE_VERSION` bump and a different RFC. Filed so the next author does not
  rediscover it as a surprise.
- **D418** 🐞 *`GRADUATION_RULING_UNCITED` checks that a citation is reachable, not that it is
  authoritative — and the one file its `#L` grammar accepts is appended to by every agent.* For
  `permanent_property` and `out_of_scope` the whole test is `existsSync` `[V]`. For `owner_ruling`
  the date test is `contents.includes(date)` over the **entire file**, where `date` is parsed from
  the author's own `ruling` string, and the `#L<line>` arm only asserts the file has that many
  lines — **the cited line is never read**. The sole accepted `#L` target is
  `planning/exploration/log.md`, which is append-only by law 7 and which every agent appends to as
  the last step of every task (it grew 59 lines between this RFC's drafting commit and its review
  `[V]`). **So an author can write a ruling, land it, and cite it in the same wave, and every lint
  passes.** This does not reinstate the struck reviewer — nobody grants anything — but it means
  *"acceptance is authorised by citing a decision that already exists"* is a **convention** today,
  not a mechanism. Remedy is three small tightenings, not a new role: read the cited line, extend
  date containment to all three `accepted.kind` values, and refuse a `rulingRef` whose target file
  was first added by the citing commit. **D242**'s second clause — *"verify payability before
  ratifying the lint"* — is the rule that would have caught this at `pack-graduation` time.
  **[author round] The three tightenings were then run against the attack and against all 43
  committed acceptances, and none of them closes it (§3.2b) — see D435 below.**

### [author round] New rows this round opens — **D434–D436**, for claude to land

The highest id in use is **D427** `[V]`, so this round takes **D434–D436**. This RFC does not edit
`design/BACKLOG.md`.

- **D434** 🐞 *An unpublished classification ruleset manufactures its own residue, and the residue is
  then read as a finding about the corpus.* This RFC's draft classified 220 blocking entries by an
  ordered keyword ruleset it described only by rule **order**, and reported 12 unclassifiable
  entries. The cross-review sampled those 12, found them dominated by format gaps, and ruled — 
  correctly — that they must not be defaulted to `unreachable`. **Publishing the ruleset (§5.1a)
  showed that all four sampled statements are matched by the very first rule** (`fifty-move`,
  `has no encoding`, `cannot be deviations in a follow`, `plan_signature_inlined`) `[V]`. **The
  residue was not a property of the corpus; it was the shape of the gaps in an unwritten rule** — and
  six of the eight class counts moved when the rule was written down, one of them (`unbuilt` 28 → 32)
  in the direction the whole open question turned on. **General form: a derived count is a claim
  about the deriver until the deriver is checked in.** Sharpens **D245** (*"a proxy built to be loose
  cannot also be cited to the unit"*) with the case D245 does not cover — a proxy nobody can inspect
  at all. The guard is one file, and it is criterion 11.
- **D435** 🐞 *Three tightenings were specified to close the graduation acceptance back door; none
  closes it and one is unpayable by the honest case.* Run against the attack ([[D425]]: *an author
  writes a ruling, lands it, cites it in the same wave*): **(1)** *"the cited file must not be added
  by this commit"* never fires — `planning/exploration/log.md` was added 2026-08-09 (`8fb62692`) and
  an author **appends** `[V]`; **(2)** *"read the cited line and find the ruling's date"* passes,
  because an appended entry's own `## <date>` heading carries the date `[V]`; **(3)** *"extend date
  containment to `permanent_property`/`out_of_scope`"* **fails 3 of 3** committed acceptances — their
  rulings are undated and `docs/tablebase-grounding.md` contains zero date strings `[V]`. The check
  that does close it is **line-level `git blame -L n,n`**, rejecting the commit under review and the
  all-zero *Not Committed Yet* sentinel `[V]`, and it is payable: the 40 `owner_ruling` entries cite
  line 1231, blamed to `ee34f1e5` of 2026-08-13 `[V]`. **General form: a tightening is a hypothesis
  about an attack, and D242's second clause applies to the remedy exactly as it applies to the guard
  it replaces.** Three plausible tightenings, three failures, and the one that works was in none of
  them.
- **D436** 🐞 *A studio-registered pack is served in production, so "the studio route cannot reach the
  official catalogue" is true and is not the bound people will read it as.* `PackStudio.hydrate`
  replays every `registered_packs` row into the live registry via `PackRegistry.addCommunity`
  (`pack-studio.ts:52–59`) `[V]`, so [[D427]]'s laundered `resolved` reaches a learner on the
  `community` channel. **The real bound is narrower and better**: `addCommunity` hard-codes
  `assessmentGrounding: "unverified"`, an empty `positionEvidence`, an empty `boundClaimIds` and an
  empty `claimBackings`, and refuses to overwrite an `official` record of the same id
  (`pack-registry.ts:388–418`) `[V]`. **So the exposure is a false blocker list, never false
  evidence** — which changes D417's fix from a storage sidecar to a surface question, and is the kind
  of thing the next author would otherwise have to rediscover by reading the registry constructor.

### [author round 2] New rows this round opens — **D468–D473**, for claude to land

The highest id in use is **D467** `[V]` (verified by sweeping `^| D<digits>` over
`design/BACKLOG.md` at HEAD), so this round takes **D468–D473**. This RFC does not edit
`design/BACKLOG.md`.

- **D468** 🐞 *A pack-validation lint resolves living-tier paths against `process.cwd()`, and the
  production image contains neither of the two directories every acceptance in the corpus cites.*
  `GRADUATION_RULING_UNCITED` does `resolve(file)` → `existsSync` → `readFileSync`
  (`pack-validation.ts:848–851`) `[V]`. `apps/server/Dockerfile:21` opens a fresh final stage whose
  only four `COPY` lines are `apps/server/dist`, `apps/web/dist`, `schemas` and `content` (`:28–31`),
  and `.dockerignore:1` excludes `.git` from the build context entirely `[V]`. **All 43 committed
  acceptances cite `planning/exploration/log.md#L1231` (40) or `docs/tablebase-grounding.md` (3)**
  `[V]` — neither directory ships. `runtimeIssue` is severity **error** (`:142–148`) and
  `PackRegistry.load` throws `ServerError("PACK_INVALID")` on any error (`pack-registry.ts:252`,
  `:258`), so **the first graduated pack carrying an acceptance makes the server fail to boot**, not
  degrade — and **40 of the 56 draft documents carry at least one `accepted` entry** `[V]`, so it is
  the modal pack rather than an edge case. It has never fired because
  `content/packs/` is empty and `schemas/drill_pack.example.json`'s `graduationBlockers` is `[]`
  `[V]`. **Reproduced with one `cd`, not argued**: `node apps/server/dist/pack-check.js` over
  `content/drafts/anti-caro-advance-early-c5.json` prints *"Pack check passed"* from the repo root and
  `ERROR … [GRADUATION_RULING_UNCITED] accepted condition citation does not resolve:
  planning/exploration/log.md#L1231` from a temp directory — same file, same bundle, decided by the
  working directory `[V]`, and the image's is `/app` (`Dockerfile:27`). **General form: a check whose
  evidence is excluded by `.dockerignore` is not a weaker check in production — it is a *different*
  check, and the code name is identical in both.** Found while
  answering [[D467]], which is the same defect one code later and the reason the RFC's
  `git blame` arm was assigned to the wrong home.
- **D469** 🐞 *The release workflow builds and pushes the production image with no content gate at
  all.* `.github/workflows/release.yml:17` checks out and `:24–33` hands the context straight to
  `docker/build-push-action` `[V]`; `verify.yml:29` runs `make verify` on every push, but nothing runs
  on the tag that produces the artefact. So every admission rule this repo has — including the ones
  `graduation-clearance` is adding — is enforced on commits and **not on the image**. **This is
  [[D208]]'s shape** (*"a maturity step that exits its own gate"*) one workflow over, and it is why an
  authoring-time admission rule needs a named enforcement point rather than a named home.
- **D470** 🐞 *Twenty packs' `provenance.sources` promise data in a key that zero of them carry and
  that the validator forbids.* Each says *"Per-move centipawns and losses are in
  `provenance.engineValidation`"*; **0 of 20 carry the key**, the data is in the `.evidence.json`
  sidecar and in `deviations[].cost`, and `PROVENANCE_EVIDENCE_INLINE` (`pack-validation.ts:868`)
  **raises an error on that exact key** `[V]` — so the sentences do not merely point at nothing, they
  point at a shape the schema refuses. Same walk found `anti-caro-advance-early-c5.json`'s
  `/provenance/sources/6` still citing the deleted spine node `bxc5-recoup` by name `[V]`.
  **The general form is [[D465]]'s, one field over: `graduationBlockers` is about to get a lint that
  makes its referents re-derivable, and `provenance.sources` — the neighbouring prose, in the same
  object, read by the same humans — will still have none.**
- **D471** 🐞 *Evidence joins to a pack by two different keys depending on the consumer, and an RFC
  that describes the join in prose picks the wrong one.* `uniqueRecord` (`claim-binding.ts:59`) joins
  a record to a **FEN**, because a claim assertion names a position; `evidenceSupports`
  (`check.ts:170`) joins a record to a **JSON pointer** via `record.supports`, because evidence names
  a pack node — and `EVIDENCE_ANCHOR_BROKEN` (`:190`) lints the second `[V]`. `graduation-clearance`
  §1.2 described its `ledger_record` predicate as *"anchored to a named FEN"* and then gave the
  clearance a `subject` pointer, so its prose named one join and its schema named the other. **The
  measurement that settles it also settles a class boundary**: over 764 committed records the
  `supports` pointers are `/start/fen` 64, `/spine/…/moveUci` 465, `/deviations/<i>/moveUci` 235 —
  **zero prose pointers, and `check.ts:195` guarantees zero forever** `[V]`. **General form: when a
  spec describes a predicate in prose instead of as an expression over named fields, the field list
  and the sentence can disagree for two review rounds without either being obviously wrong.**
- **D472** 🐞 *[[D461]]'s correction fixed the register row it was about and left the two Active rows
  that repeated the stale half.* `rfc/README.md:78` records 0.28 as **claimed and held**; `:79` records
  0.29 as next free — and `:12` still reads *"0.28 remains free"* and `:14` *"0.28 stays free"* `[V]`.
  D461's own text names *"two Active rows repeated the stale half"* as part of the defect, so the row
  describes the fix it did not make. **General form: a correction that quotes the full extent of a
  defect and repairs one instance of it reads, to the next reader, as a closed defect.**
- **D473** 💡 *An RFC was marked `accepted` because its open questions were closed, and the two are
  not the same test.* `graduation-clearance` closed four author-call open questions and was accepted
  on 2026-08-16; an implementation review returned it hours later with four blockers, and **none of
  the four was an open question** — they were an **absent field** ([[D464]]), an **absent grammar for
  a measured population** ([[D465]]), an **absent writer** ([[D466]]) and a **check assigned to a
  process that cannot run it** ([[D467]]). All four are answerable only by asking *"who calls this,
  with what, where"*, which no open-question list asks. **The cheap guard is the one this round used
  and it costs one pass: for every acceptance criterion, name the function that makes it true and the
  environment that function runs in.** Two of the four blockers would have been caught by the second
  half of that sentence alone. Sibling of [[D426]] (*"an RFC's acceptance criteria are checked against
  its behaviour, and a code name is not behaviour"*), extended from the criteria to the specification.

### [author round 3] Amendments this round asks claude to land on existing rows

This RFC does not edit `design/BACKLOG.md`; the rows below are **reported**.

| row | reads | should read | source |
|---|---|---|---|
| **D434** | *"the rule output is `unbuilt 29 / corpus 46 / citation 54 / engine 37 / tablebase 5 / shape 22 / authored 10 / residue 17`"* | that output is reproduced exactly at HEAD and is now **superseded by the [[D503]] correction**: `unbuilt 35 / … / shape 16 / …`, kind counts **A 5 / B 38+46 / C 55 / D 18 / E 11 / F 38 / G 9** | §5.1a `[V]` |
| **D409** | *"27 instrument-bound / 23 authoring-bound"* (the round-2 amendment) | **28 / 22.** Same partition, third published `unbuilt` rule; `scandinavian-mainline-black` crosses | §5.2 `[V]` |
| **D472** | column 3 reads *"💡 open, found 2026-08-16"* while column 1 reads ✅ | the row **is** closed and verified: zero *"0.28 remains/stays free"* strings survive in `rfc/README.md` `[V]`. **The stale column-3 marker on the row about half-finished corrections is [[D419]]/[[D459]]'s own example**, and is worth the one-line disposition marker D419 asks for | §7 `[V]` |
| **D468** | closed 2026-08-17 — *"the production image carries both exact citation sources and packaging verification pins them"* | correct and **narrower than the rule it protects** — see the new row on the allow-list | §3.2c-r `[V]` |
| **D506** | *"A copy landed at `schemas/drill_pack.schema.json:1140`"* | **not at HEAD** — one hit for `explorer_position_census` in the whole tree (`sourcing/types.ts:61`), and `:1140` is inside `$defs/provenance` | §7 `[V]` |

**And one procedural note that is not a row.** [[D521]] (*"`make graduation-report` **writes**
`content/accepted-conditions.md`, so the repo's headline graduation instrument cannot be run in a
measurement pass without dirtying the corpus it measures"*) fired during this round: the report was run
to reproduce 56/220/30/43 and did write the file. **It wrote byte-identical content and the working
tree stayed clean** `[V]` — which is the *lucky* outcome D521 describes, not a refutation of it.
Criterion 6's *"byte-identical to a fresh run"* is the assertion that keeps the luck holding, and this
RFC's own measurement pass is now a datapoint for D521's fix.

### [author round 3] New rows this round opens — **D522–D526**, for claude to land

**The brief issued this round the block from D514, and D514–D521 were already taken by the time it
ran** — a sweep of `^| D<digits>` over `design/BACKLOG.md` at HEAD returns **D521** as the highest id
in use `[V]`. This round therefore takes **D522–D526**. **This is the second time this document has
hit that collision** (the cross-review's *"LANDED AS D404–D409, NOT D401–D408"*), and the second time
it has been caught by re-sweeping rather than by trusting the issued block — which is the whole
procedure. This RFC does not edit `design/BACKLOG.md`.

**One proposed row was withdrawn before it was written, because it had already landed.** This round's
finding that *"the tree now holds two pack-discovery predicates and they disagree by six documents"*
is **[[D519]]** verbatim (*"[[D227]]/[[D257]] closed by EXCLUDING the fixtures from discovery … one
report now prints both denominators"*), landed 2026-08-17 `[V]`. It is cited at §0.1 and open question
1 instead of re-minted. **A duplicate row is worse than a missing one**, and the only reason this one
was caught is that the id sweep forced a read of the rows either side of the block.

- **D522** 🐞 *A clearance kind's predicate held on every entry the classifier assigned to it, so the
  migration's first run would have retired sixteen debts by doing nothing.* `graduation-clearance`'s
  `shape_firing` clears when *"a named shape entry's trigger fires on at least one of this pack's
  positions"*. Run at HEAD over the 16 rule-6 entries whose pack carries a `shapes` reference, the
  trigger fires **2 to 24 times in every one of them** `[V]` — so all sixteen were vacuous on arrival,
  and one of them sits inside the RFC's own acceptance criterion 3 (`philidor-passive-rook-convert`,
  `philidor` firing 3×, making `transitions` 2 where the criterion asserts 1) `[V]`. The sharpest single
  case is `open-centre-ruy-exchange`, whose statement is *"the shape entry … **fires on only three of
  its ten** authored positions"*: the predicate *fires on at least one* **is satisfied by the very
  number the statement objects to.** **General form: a predicate is not a check until someone runs it
  over the population it will be written against** — [[D451]] (*"a criterion that passes while
  measuring nothing"*) reaching a specification rather than a result. The guard is one rule — refuse to
  *write* a clearance whose predicate already holds — and it generalises to every kind. Found 2026-08-17
  while answering [[D503]], which is the same defect's visible half.
- **D523** 🐞 *Three of six clearance kinds join their evidence through a pointer grammar the shipped
  code enforces, and the RFC stated it for one.* [[D503]] is the D case. The same walk found: kind A's
  `assessmentGrounding` (`ledger-validation.ts:423`) reads `document.objective.grading.assessedBy`
  **directly and never looks at `subject`**, so any other subject is decorative; kind C's
  `validateClaimBindings` raises `CLAIM_POINTER_INVALID` on any pointer but `^/feedbackClaims/\d+/text$`
  (`claim-binding.ts:178`), so a **55-entry class** could have been written with subjects whose
  predicate can never hold `[V]`. Only kind B had its grammar written down, by [[D471]]'s correction one
  round earlier — **which is the tell: the round that found one instance did not ask whether it was a
  class.** **General form: when a spec gives every kind the same `subject` field, the field's
  *grammar* is per-kind and lives in the consumer, and an RFC that states it once has stated it for
  one-sixth of its vocabulary.**
- **D524** 🐞 *`content/drafts/` now ships to production, and three documents still argue from the
  premise that it does not.* [[D502]]'s draft-shelf ruling removed `content/drafts` from
  `.dockerignore`, made `tools/verify-packaging.mjs` assert the **opposite** of what it asserted before
  (*"Production image context must include disclosed draft packs"*, `:85–87`), and made
  `PackRegistry.loadDefault`'s draft load unconditional with `channel: "community"` (`:337–357`) `[V]`.
  `graduation-clearance` §0.1's motivating sentence — *"nothing this product has authored can reach a
  non-development registry"* — was **true when written and false three commits later**, and its
  premises were prose rather than assertions. **The consequence is not cosmetic**: every draft is now
  validated at boot, which is what turned [[D468]] from a latent bug into a boot failure. **General
  form: [[D246]]'s rule pins versions and lanes across a moving tree and does not pin an argument's
  premises — and premises are what a ruling moves.** The cheap guard is a landing test that re-derives
  each quoted premise (criterion 19).
- **D525** 🐞 *[[D468]]'s fix pins the two paths today's corpus cites, while the rule it protects admits
  four families of path.* `apps/server/Dockerfile:32–33` copies `planning/exploration/log.md` and
  `docs/tablebase-grounding.md`, and `tools/verify-packaging.mjs:88–99` asserts both `COPY` lines
  verbatim `[V]` — a correct fix for the 43 committed acceptances, all of which cite one of those two
  `[V]`. But `graduation-clearance` §3.2a(1)'s allow-list is `planning/exploration/log.md`,
  `planning/content-era/log.md`, `design/0[0-6]-*.md` and `docs/*.md`, so **the first acceptance citing
  `docs/branch-runtime.md` or any design doc reproduces D468 exactly** — `existsSync` fails,
  `runtimeIssue` is error, `PackRegistry.load` throws `PACK_INVALID`, the server does not boot. **D468
  is closed for today's corpus and open for the corpus `graduation-clearance` exists to enlarge.**
  **General form: a fix that enumerates the current members of a set closes the defect for the set and
  not for the rule**, and the two are only the same thing until someone adds a member. Remedy is one
  exported list with `verify-packaging` asserting membership, not a third `COPY` line.
- *(the two-discovery-predicates row is withdrawn — it is [[D519]], already landed. This round adds one
  measurement to it rather than a row: `graduation-report.ts:25` hand-rolls the `.browser.json` suffix
  test a **third** time, beside `:8`'s filter and the exported `isPackDocumentName`, so the rule is
  computed three ways in two files `[V]`.)*
- **D526** 🐞 *[[D506]]'s cited second copy of `EVIDENCE_KINDS` is not in the tree at HEAD.* The row
  reports *"A copy landed at `schemas/drill_pack.schema.json:1140` mid-draft"*, turning [[D499]] from
  *"a shared resource with no register"* into *"two divergeable copies"*. A sweep for
  `explorer_position_census` across `schemas/`, `packages/` and `apps/` returns **exactly one** hit —
  `apps/server/src/sourcing/types.ts:61` — and `schemas/drill_pack.schema.json:1140` is inside
  `$defs/provenance` `[V]`. Either the copy was reverted or the citation is to a working tree. **The
  finding it supports is still coming true**: `graduation-clearance` §6.1 transcribes the seven values
  into the pack schema, so the second copy is about to exist, and its criterion 13 set-equality test is
  the only thing that would keep the two in step. **General form: a row whose evidence lives in an
  uncommitted working tree is a row the next reader cannot verify** — and this one is cited by two
  drafts.

## Changelog

- 2026-08-16: created. `make graduation-report` re-run at HEAD rather than quoted: 56/220/30/43 for
  `content/drafts/`, 36/143/0/0 for `content/candidates/`, 0/0/0/0 for `content/packs/`, graduable
  `(none)`. `sourcing-check` run per-file over all 56 draft documents; `expression-census` run for
  the 254/1 claim-backing figures; the four stale `assessment_grounded` entries and the 16 truthful
  `no engine pass` entries verified against their ledgers' record kinds. Class counts in §1.2 and
  §5 are a hand audit over an ordered keyword ruleset, labelled as such per **D245**. Register
  facts re-checked at HEAD: pack `0.27` in `packages/schema/src/index.ts:2`, `0.28` recorded free
  in `rfc/README.md`, `STORAGE_VERSION = 22` in `apps/server/src/storage.ts:407`. **The tree moved
  during drafting** — `rfc/measurement-records.md` was rewritten in the working tree and
  `design/research/README.md` changed — so §8's two quotations and the 0.28 release were re-read
  after the rewrite rather than trusted (**D246**); `content/`, `schemas/`, `packages/schema/`,
  `apps/server/src/sourcing/`, `pack-validation.ts`, `pack-studio.ts` and the `Makefile` did not
  move, so every measurement above stands.
- 2026-08-16: **cross-reviewed by a second agent; RETURNED TO AUTHOR with corrections landed in
  place.** Every figure re-derived at HEAD rather than re-read, at a tree verified unchanged since
  the drafting commit `b9fd803` for `content/`, `schemas/`, `packages/schema/`,
  `apps/server/src/sourcing/`, `pack-validation.ts`, `pack-studio.ts` and the `Makefile` `[V]`.
  **D246 note: the working tree moved under the review too** — a concurrent `opponent-contracts`
  implementation landed uncommitted edits to `pack-validation.ts` (+7 lines at `:1002`, a
  `PERFECT_TABLEBASE_UNORDERED_OBJECTIVE` warning), `packages/schema/src/index.ts`
  (`DRILL_RUN_SCHEMA_VERSION` → `0.17`) and `schemas/drill_run.schema.json` while this review was
  running. **Every symbol and line this RFC cites was re-checked after those edits and none moved**:
  `graduationEntryIsBlocking` `:154`, `GRADUATION_ENTRY_LEGACY_SHAPE` `:830`, the `accepted` guard
  `:838`, the `clearedBy` guard `:860`, `GRADUATION_BLOCKING_ON_PUBLISHED` `:873`, and
  `DRILL_PACK_SCHEMA_VERSION` still `"0.27"` `[V]`. `content/`, `schemas/drill_pack.schema.json`,
  `pack-studio.ts`, `graduation-report.ts` and `apps/server/src/sourcing/` are untouched by that
  work, so every corpus figure stands.
  **Reproduced exactly:** 56/220/30/43, 36/143/0/0, 0/0/0/0, graduable `(none)`; 0 `clearedBy` keys
  in 293 + 143 entries; the guard `typeof row.clearedBy === "string"` at `pack-validation.ts:860`;
  one distinct `resolved.by` over 30 entries; 27/25/25/25 `tablebase_result` and four
  `sourcing-check` strict passes; 32 ledgers holding 391 `engine_eval` + 341 `tablebase_result`;
  1 ledger with `claimBindings`; 26 of 36 `authored-teaching-absent`; three `perfect_tablebase`
  entries; both `$defs` closed at 0.27; `STORAGE_VERSION` 22; `content/accepted-conditions.md`
  byte-identical to a fresh run. **Corrected:** the 254-claim figure (**196** claims; 254 is the
  citation count, `expression-census.ts:119` vs `:130`); §1.2's kind column, which summed to 225
  over a 220-entry population; *"kinds A–D"* used as both a range and a set, and the three
  different mechanical totals it produced; *"the seven graduation codes"* (six in
  `validatePackDocument`); the `GRADUATION_ENTRY_LEGACY_SHAPE` attribution in §7;
  `GRADUATION_RESOLVED_WITHOUT_RESOLUTION`, cited as shipped and **absent from the tree**; the
  emitter template registry, cited as shipped and **absent from the tree**; *"5 emitter templates"*
  (nine distinct, and 3 of the 143 candidate entries are not templated at all); the `16` no-engine
  entries (15–17 by ruleset, all true on every reading); two `:line` citations; and the D242 quote,
  whose dropped second clause is the one §3.2a needed. **Refuted:** *"3 packs graduate on instrument
  runs alone"* — **0 do** (§5.2a), because `attachExplorerEvidence` refuses to write pack prose and
  refuses to run without an explorer rationale line none of the three carries, and because
  `kid-classical-black`'s second blocker is D155's non-existent tempo corpus, which the same section
  lists as a non-existent instrument. **Added:** §1.4 (the residue of author discretion, with two
  normative fixes and one stated limit), §2.3a (the demotion gate is not wired to either consumer;
  the studio route stays open and is now bounded and tested), §3.2a (the citation guard is a
  reachability check, not an authority check — the back door is open and is narrowed rather than
  closed), §4.2's instrument-preconditions table, §5.1's re-derivability obligation, §5.2a,
  criteria 4a, 11 and 12, open question 6, and rows **D416–D418**. **Answered:** open question 4,
  against its own recommendation, on a measurement of the residue. **Kept: the pack 0.28 lane**, and
  §7 now argues it against the precedent that released the last claim rather than asserting it.
- 2026-08-16: **author round, answering the cross-review. The acceptance gate is closed and four of
  the round's six findings correct the review rather than the draft.** Measured a third time at a
  tree that had moved **eleven commits** since `b9fd803`; `content/`,
  `schemas/drill_pack.schema.json`, `apps/server/src/sourcing/`, `pack-studio.ts`,
  `graduation-report.ts` and the `Makefile` are byte-unchanged and carry no uncommitted edits, and
  every `:line` citation was re-resolved against both HEAD and the working tree with none moved
  (`:154`, `:830`, `:838`, `:853`, `:855`, `:860`, `:873`) `[V]`. D246, applied a third time.
  **Published:** the seven-rule classifier as a literal (§5.1a) — the obligation §1.2 claimed §5.1
  discharged and §5.1 did not. **Enumerated:** all **17** residue entries by pack, id, statement and
  hand-assigned kind (§5.1b), closing open question 4; the draft's 12 was an artefact of the
  unpublished ruleset, and the four statements the review sampled as evidence are matched by rule 1
  `[V]`. **Corrected, all six against figures the cross-review had already corrected once:** the kind
  column (A 5 / B 38 + 46 / C 55 / D 24 / E 11 / F 32 / G 9 = 220, six of eight cells moved); the
  pack split (**27 instrument-bound / 23 authoring-bound**, inverting the review's 23/27);
  `clearable`/`unclearable` (**179 / 41**, not 180 / 40); the mechanical accounting (**43**
  machine-producible unaided, **113** machine-decidable, and the corpus class priced **once** with C
  at **101** — §4.2); `STORAGE_VERSION` (**23**, not 22) and `DRILL_RUN_SCHEMA_VERSION` (**0.17**);
  and the emitter registry (**9 ids over 11 literals**; **2** candidate entries match no template and
  a **3rd** matches one the draft's list omitted). **Verified and refuted:** the three tightenings of
  §3.2a **do not close the acceptance back door** — tightening 1 never fires on an appended log,
  tightening 2 passes the attack, and tightening 3 is **unpayable**, failing 3 of 3 committed
  `permanent_property` acceptances `[V]`. Replaced by a **line-level `git blame`** arm on
  `GRADUATION_RULING_SELF_MINTED` plus a new `GRADUATION_RULING_UNANCHORED`; payability re-verified
  at 40 of 40 `owner_ruling` entries (line 1231 blames to `ee34f1e5`, 2026-08-13, and contains the
  quoted date) `[V]`. **Decided:** the two absent lint codes are **handed back** — their conditions
  are unrepresentable under the closed schema and this RFC's own codes are strictly stronger, so
  minting them would be D426's own failure performed deliberately (§6.3a); the **emitter template
  registry is adopted**, because criterion 7 cannot land without it (§6.2a). **Confirmed:** the
  studio bound holds and is **narrower than stated** — registered packs *are* served in production on
  the `community` channel, and what bounds them is `addCommunity` hard-coding
  `assessmentGrounding: "unverified"` with empty evidence, so the exposure is a false blocker list
  and never false evidence (§2.3b). **Added:** §2.3b, §3.2b, §5.1a, §5.1b, §6.2a, §6.3a, open
  question 7, rows **D434–D436**, and four ledger amendments for claude to land. **Kept: the pack
  0.28 lane**, re-verified at a moved tree — `DRILL_PACK_SCHEMA_VERSION` `"0.27"`, both candidate
  `$defs` closed, `rfc/README.md:78` still records 0.28 free, and `opponent-contracts` still holds no
  pack lane `[V]`. **This RFC claims no migration position, which is why [[D423]]'s three-way
  contest does not reach it.**
- 2026-08-16: **second author round, answering the implementation review that returned this RFC at
  `8c389f0`. All four contract blockers are specified at a named symbol; the RFC does not re-declare
  itself accepted.** Measured at HEAD `6722130`. **Reproduced independently at HEAD before anything
  was written:** `content/drafts` 56 documents / 220 blocking / 30 resolved / 43 accepted and
  `content/candidates` 36 / 143 `[V]`; **0 of 293 + 143 entries carry `clearedBy`** `[V]`; 32 ledgers
  holding **764** records — `engine_eval` 391, `tablebase_result` 341, `position_legality` 32 `[V]`;
  the four `assessment_grounded` packs still carrying 27/25/25/25 `tablebase_result`, 0 `engine_eval`
  and **six** blocking entries each `[V]`. **[[D464]] closed (§1.2b):** `clearance.recordKind` is
  added, transcribed from `EVIDENCE_KINDS` (`sourcing/types.ts:57`), and the deciding predicate is a
  `kind` + `supports` match — **not** the FEN join §1.2 described in prose, which belongs to
  `uniqueRecord` and to claim assertions. The measurement that settles it also moves the B/C
  boundary from a keyword to a lint: over 764 records the `supports` pointers are `/start/fen` 64,
  `/spine/…/moveUci` 465, `/deviations/<i>/moveUci` 235 — **zero prose pointers**, and `check.ts:195`
  makes that permanent, so a `ledger_record` clearance on a prose subject is unsatisfiable by
  construction and is now an error `[V]`. **[[D465]] closed (§2.2a), and its premise corrected by
  measurement:** all 30 resolved entries were walked — **29 name a subject that resolves, 1 does
  not**, so *"several"* is one entry; **1** distinct `resolved.by` string, reproducing §0.3 `[V]`. The
  one entry is **not reclassified**; the grammar gains `referent_removed` + `absentIds`, whose
  predicate is *the named ids are absent* — a standing predicate that correctly **re-opens** if a
  refuted line comes back, admissible on `resolved` only, and never emitted by the writer.
  **[[D466]] closed (§6.5):** `make graduation-clear` / `clearGraduationEntries`, modelled on the
  shipped `verifyDraft` writer (`verify-draft.ts:323`), with the six predicates named at their
  symbols, a `tabiya.graduation.transition.v1` document, the mandatory `packDigest` re-stamp, and the
  one-line `graduation-report.ts:8` filter change its sidecar forces. **[[D467]] closed (§3.2c) by
  refusing to make it one rule:** the Dockerfile's final stage copies four directories and installs
  no `git` (`:21–31`), `.dockerignore:1` excludes `.git` from the build context, and
  `validatePackDocument` (`:1255`) is synchronous **with no base-directory option** — so the runtime
  rule is a *shape* rule (`GRADUATION_RULING_UNANCHORED`, document only) and the authoring rule is an
  *admission* rule (`GRADUATION_RULING_SELF_MINTED`, checkout + `.git`), with two homes and two
  guarantees. **Found while doing it:** the defect **already ships** — `GRADUATION_RULING_UNCITED`
  resolves `planning/` and `docs/` against `process.cwd()` at error severity, and neither directory is
  in the image, so a graduated pack with an acceptance would make the server **fail to boot** `[V]`.
  Its resolution arms move with the new one. **Corrected in this RFC's own text:** *"the seven
  kinds"* → eight; *"anchored to a named FEN"* → a `supports` pointer match; *"tightened **in
  place**"* → tightened in the sweep; the ratchet quoted for two rounds as *"≤15-of-47"* is
  **`toBeLessThanOrEqual(18)`** at `graduation-report.test.ts:76`, and the sweep is
  `checkSourcingFile` in a **vitest case**, not `checkSourcingDirectory` in the Makefile — which is
  why [[D208]] is still open and right `[V]`. **Register re-verified a fourth time:**
  `DRILL_PACK_SCHEMA_VERSION` `"0.27"`, `DRILL_RUN_SCHEMA_VERSION` `"0.17"`
  (`packages/schema/src/index.ts:1–2`), `STORAGE_VERSION` **23** (`storage.ts:407`), and
  `rfc/README.md:78` now records **0.28 claimed and held by this RFC** with `:79` recording **0.29 as
  the next free lane** `[V]` — so this round's schema additions land inside a lane the register
  already assigns. **Added:** §1.2b, §2.2a, §3.2c, §6.5, §6.6, criteria 13–16, a rewritten criterion
  3, the split-home lint table, and rows **D468–D473**. **Stated rather than solved (§6.6):** the
  final B/C split is not printable because no blocking entry has a subject yet (**0 of 293** `[V]`);
  the owner-versus-agent floor is §3.1's struck reviewer and is unchanged; and a `#L` anchor into a
  mutable document drifts undetectably at runtime, because the document is not in the image.
- 2026-08-17: **third author round, answering the implementation review that returned this RFC on
  [[D503]]. D503 is closed as a class; acceptance is NOT re-declared.** Measured at HEAD `68098e5`,
  five commits past round 2's `6722130`. **Reproduced independently before anything was changed:**
  `graduationReport()` over `content/drafts` 56 / 220 / 30 / 43 and `content/candidates` 36 / 143
  `[V]`; the §5.1a classifier's previous output `unbuilt 29 / corpus 46 / citation 54 / engine 37 /
  tablebase 5 / shape 22 / authored 10 / residue 17`, byte-identical, with the same 17 residue entries
  in the same order `[V]`; 32 ledgers holding **764** records (`engine_eval` 391 / `tablebase_result`
  341 / `position_legality` 32) with `supports` pointers `/start/fen` 64, `/spine/…` 465,
  `/deviations/…` 235 `[V]`; `evidence.totals` `{packs: 50, claims: 196, backedClaims: 1}` `[V]`;
  1 ledger with `claimBindings`, 18 packs with neither sidecar, 40 documents carrying an `accepted`
  entry, 40 `owner_ruling` + 3 `permanent_property`, 20 packs promising `provenance.engineValidation`
  `[V]`. **[[D503]] closed (§1.2c, §2.5, §5.1a) and closed as an instance of a class:** the six packs
  are reproduced exactly and are **`unbuilt`**, which is what their own statements say; rule 1 gains
  `"no shape-library entry"` and `"no shapes reference"`, moving **exactly six** entries and leaving the
  residue at 17 `[V]`; and **§1.2c publishes the `subject` grammar for all six kinds**, because
  `assessmentGrounding` ignores `subject` entirely and `validateClaimBindings` admits only
  `^/feedbackClaims/\d+/text$` (`CLAIM_POINTER_INVALID`, `claim-binding.ts:178`) — so the same hole was
  open in A and C `[V]`. `GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE` is **withdrawn into**
  `GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL`. **Found while doing it, and larger than D503:** the D
  predicate **already holds on all 16 remaining rule-6 entries**, at 2–24 firings each `[V]`, so the
  migration as specified would have retired sixteen debts on its first run and **reddened criterion 3
  on `philidor-passive-rook-convert`** (`transitions` 2, not 1). §2.5's non-vacuity rule is the fix and
  is general. **Two premises refuted at HEAD by work that landed after round 2, corrected in place:**
  [[D502]] ships all 56 drafts on the `community` channel — `.dockerignore` no longer excludes
  `content/drafts`, `verify-packaging.mjs:85–87` asserts the **opposite**, and
  `PackRegistry.loadDefault`'s draft load is unconditional (`:334`, `:337–357`) `[V]` — so §0.1's
  motivating sentence is withdrawn and replaced by the narrower true one; and **[[D468]] is ✅ closed
  by packaging** (`Dockerfile:32–33`, `verify-packaging.mjs:88–99`) `[V]`, which **reverses half of
  §3.2c** (§3.2c-r): `GRADUATION_RULING_UNCITED` is **not split** and stays whole in
  `validatePackDocument`, while the `git blame` arm still cannot run in an image with no `git` and no
  `.git`. **Corrected in this RFC's own text:** every `:line` citation into
  `apps/server/src/sourcing/check.ts` had drifted by 4–24 lines (`:166→:170`, `:186→:190`,
  `:190→:195`, `:32→:36`, `:39→:43`, `:65→:69`, `:416→:437`, `:420→:441`, `:446→:468`, `:449→:473`)
  and **`MACHINE_LABELS` does not exist — the symbol is `MACHINE_LABEL_EVIDENCE_KINDS`** `[V]`; also
  `expression-census.ts:262→:257`, `:123→:119`, `:130→:126`, `pack-registry.ts:390–414→:388–418`,
  `:406→:411`, `rfc/README.md:78/:79→:79/:80`; **`ExpressionCensus` is not a type in the tree**
  (`runExpressionCensus` returns `any`), so §6.5's signature named an unimportable symbol; **[[D208]]
  reads ✅ in column 1** and this RFC's *"still open"* claim is withdrawn; **[[D472]] is fixed** and
  §7's report of it is withdrawn. **Counts re-derived by running the published ruleset:** D 24 → **18**,
  F 32 → **38**, clearable 179 → **173**, unclearable 41 → **47**, machine-decidable 113 → **107**,
  pack split 27 / 23 → **28 / 22** (17 authored packs), the four `unreachable` packs now 2 in each
  half. **Unmoved:** 43 machine-producible unaided, 101 authored-prose-plus-a-source, 220 total, 17
  residue, **0 of 50 packs graduating on instrument runs alone**. **Register re-verified a fifth time:**
  pack `0.27`, run `0.17`, shape-entry `0.3`, `STORAGE_VERSION` **23**, 0.28 claimed and held at
  `rfc/README.md:79`, 0.29 next free at `:80` `[V]`; **the landing `tabiya-claims` block is written out
  in §7** and is to be carried at landing, not now. **Added:** §1.2c, §2.5, §3.2c-r, criteria 17–19, a
  rewritten criterion 15, a **withdrawn** criterion 16 ([[D469]] closed by `release.yml`'s `verify`
  job), and rows **D522–D526** — renumbered from the issued D514 block after a sweep found **D521** in
  use, and one proposed row dropped as a duplicate of the already-landed [[D519]]. **Flagged and not
  settled:** [[D518]] measured the neighbouring wave's mechanical figure to zero by this table's own
  method, and this round did not re-derive how many of §4.2's **43** sit on the 18 ledger-less packs
  `verifyDraft` refuses (§4.2).
