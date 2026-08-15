# RFC: Fixture realism — a test asserts against the artifact, not against a convenient invention

- **Status:** draft (awaiting cross-review)
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/BACKLOG.md` rows **D56** (`practical_resistance` returned HTTP 500 on 75% of its own domain; **the row was flipped to ✅ CLOSED by `960f91e` while this RFC was being drafted** — the arithmetic half is fixed, the fixture-discipline half that let it ship is §5a), **D47** (pin tests encode content facts — 4th instance), **D54** (marked ✅ CLOSED 2026-08-15 by `expression-census`; §4 shows the closure is narrower than the row reads), **D55** (an instrument that walks content must state its denominator), and **"Vocabulary audit: the reassuring half"** (the 107-emitter sweep). `design/research/maia-policy-scalar-stability.md` §8.1 is the measured evidence. *Every code site in this document is cited **by symbol name**. The working tree moved repeatedly during drafting: `packages/runtime/src/practical-difficulty.ts` and `.test.ts` were modified-uncommitted when §5a was first written and **landed as `960f91e` ("fix: tolerate Maia float32 policy mass") before this draft was finished** — §5a is written against the committed result and says which half it does not claim. `apps/server/src/opponent-selector.test.ts`'s fixture line numbers already differ from the ones the D56 dossier recorded this morning. **Locate by symbol first — every line number here is advisory.*** HEAD moved `4a893dc` → `960f91e` → `90bb5bf` during drafting; all measurements in §4 were re-run at `90bb5bf` and are unchanged.
- **Exploration gate:** owner ruling 2026-08-12 opened the RFC tier (`rfc/README.md` §Exploration gate). This RFC is opened by D56: a feature shipped in commit `4977ff6` ("Implement practical resistance spectrum") in the morning of 2026-08-15 and was measured broken on three quarters of its own domain by the afternoon, with a green suite throughout.
- **Depends on:** `rfc/archive/content-sourcing-foundation.md` (the manifest/digest/job-digest artifact triple this RFC borrows for fixtures), `rfc/archive/resistance-spectrum.md` (ships `practical_resistance` and `humanConcessionMass`), `rfc/archive/expression-census.md` §criterion 14 (the last widening of the refusal-coverage gate), `rfc/archive/validator-integrity.md` (the standing rule that a fall-through must become a named refusal rather than a `TypeError`)
- **Parent / amends:** amends test suites and one error type. Introduces **no new subsystem, no new persisted state, no format change, and no product surface.**
- **Supersedes / superseded by:** —
- **Planning:** `planning/fixture-realism/` (once implementing)

## Register claim

**This RFC claims nothing versioned. Loudly, because that is the better outcome.**

No pack schema version (0.20 landed; 0.21 and 0.22 are claimed; **0.19 is frozen
shut**), no run schema version, no shape-entry schema version, no migration
number, no `$id` change, no new event, no new persisted field, no new HTTP route,
no new `ServerErrorCode`. Nothing in this RFC has to negotiate landing order with
`live-marker-quality.md` or with any archived-but-recent wave.

It touches exactly three kinds of thing: **test files**, **fixture files**, and
**one error type's `code` field** (`SourcingError.code`, `string` → a closed
union, `apps/server/src/sourcing/types.ts` `class SourcingError`). The union is a
compile-time register, not a versioned artifact; adding to it costs nothing and
collides with nobody.

The one adjacent claim to declare: `PRACTICAL_RESISTANCE_POLICY_MASS_INVALID` was
added to `ServerErrorCode` **by the D56 fix `960f91e`**, not by this RFC. This RFC
neither claims nor needs it (§5a).

## Summary

Three failures found on 2026-08-15 — D56, D47, D54 — are one failure. In each,
a test asserts against data invented for the test's convenience while a real
artifact for that data exists in the repo, so the test cannot fail the way
production fails. D56 is the expensive instance: a float32 tolerance guard was
tested only against hand-typed decimals that sum to less than 1, so the guard's
boundary was never crossed by anything resembling engine output, and the feature
returned HTTP 500 on 30 of 40 in-range roots while `make verify` stayed green.

This RFC names the rule (**F1**, §1), states the four exceptions that make it
survivable (**E1–E4**, §2) — because a rule with no stated exceptions is violated
immediately and correctly — specifies how a captured fixture records and refreshes
its provenance by reusing the sourcing pipeline's existing manifest/digest
precedent (**F2**, §3), specifies discovery-over-allowlist for the repo's own
refusal gate (**F3**, §4), and fixes exactly three sites (§5). §6 draws the scope
boundary: 94 test files and 16,596 lines exist, and this RFC rewrites none of them
wholesale.

## Motivation

### The morning and the afternoon

`practical_resistance` shipped in `4977ff6`. Its measurement primitive is
`humanConcessionMass` (`packages/runtime/src/practical-difficulty.ts`), which
summed candidate policy mass and threw when the sum exceeded `1 + 1e-9` — a raw
`TypeError`, not a coded refusal, which `apps/server/src/rest.ts` renders as HTTP
500 `INTERNAL_ERROR`.

Maia returns a float32 softmax. `design/research/maia-policy-scalar-stability.md`
§8.1 measured the consequence `[V]`: of the 39 measured keys whose position has
≤ 20 legal moves — where the 20-candidate cap truncates nothing and the returned
set is the whole distribution — **19 (48.7%) sum above `1 + 1e-9`**, with a
maximum excess of **9.25e-08** and a smallest observed deficit of −1.45e-07. A
selection measures up to four child positions, so one overflowing child is enough.
End to end, over 40 in-range roots × 20 repeats: **30/40 (75%) threw, identically
on all 20 repeats.** The mode's entire refusal architecture —
`PRACTICAL_RESISTANCE_OUT_OF_RANGE`, `_UNAVAILABLE`, `_UNDECIDABLE` — never got a
turn on three quarters of its own domain.

The suite was green because, in the dossier's words, *"the boundary the guard
defends has never been exercised by a real distribution"*: every fixture mass in
`opponent-selector.test.ts` is a hand-written decimal summing to at most 1, and
the unit test's own vector summed to 0.95.

**A magnitude that propagated, recorded because the propagation is the point.**
The open `D56` row in `design/BACKLOG.md` said the accumulated error was *"near
1e-6 — three orders of magnitude above that tolerance"*, and the task brief that
opened this RFC repeated it. The dossier both cite measured a **maximum excess of
9.25e-08** and states the tolerance is *"wrong by about two orders of magnitude"*,
with the distribution sitting at `1 ± ~1e-7` — a factor of about ten apart. **No
correction is owed: `960f91e` rewrote the row on closure and the replacement
carries the measured sum `1.00000000803311` and no order-of-magnitude claim at
all.** It is recorded here anyway, because a figure drifting an order of magnitude
between the measurement and the row that cites it is this RFC's failure occurring
in prose instead of in a fixture, and because §5a's second gap (the captured vector
sits at the *small* end of the measured envelope) is only visible if the real
envelope is stated.

### Not once — three times, in one day, in one shape

**D47 (this morning).** `packages/runtime/src/predicate-wave-2-content.test.ts`
hard-codes shape-entry `version` strings — `expect(same.version).toBe("0.2.1")`,
`expect(opposite.version).toBe("0.3.0")`, `expect(entry.version).toBe("0.2.1")`.
A legitimate content migration moves the entry and fails a test nominally about
`matchesStructuralExpression`. This is the **fourth** occurrence of the family; the
prior three were a shape-registry literal id list, a pack-authoring literal
candidate count, and a registry pin. With an authoring writer and an implementing
writer in one tree, the cost is no longer a chore — a content change makes an
implementer's gates go red as though its own work broke.

**D54.** `apps/server/src/refusal-coverage.test.ts`'s gate *"requires every fixed
authoring refusal to have a direct test disposition"* scans an **enumerated list**
of emitter source files. `rfc/archive/expression-census.md` §criterion 14 records
that the list held **two** files and widened it to four so that its own new codes
could not land untested. That is the pattern, and it is self-limiting by
construction: **an allowlist grows only when the person adding a code needs it to,
so its blind spot is permanent.** §4 measures what is still outside it.

### The one sentence

**A test asserting against convenient invented data instead of the real artifact
it claims to cover cannot fail the way production fails.** That is D56, D47 and
D54 with the details removed, and it is the only thing this RFC is about.

## Specification

### 1. F1 — the artifact rule

> **F1.** Where a real artifact for the value under test exists in the repo — a
> content file, a schema, a committed candidate, a recorded instrument output — a
> test asserts **against that artifact, or against a value derived from it at test
> time**. It does not assert against a literal transcribed from it, and it does not
> assert against data invented to resemble it.

"Derived at test time" is the form the repo already demonstrates and should be read
as normative-by-example: `apps/server/src/pack-authoring.test.ts`'s
`loads the committed sourcing candidates without mistaking sidecars for packs`
computes `packDirs` by reading `content/candidates/` and counting the directories
that actually contain a `pack.json`, then asserts `packDirs + 1`. Its in-file
comment states the reasoning exactly — *"Derived, not hand-pinned (the D4 lesson)
… Counting raw dirs would pass only while exactly one non-pack dir (`priority/`)
exists — a coincidence, not an invariant"* — and it landed in `d0c9a8a`
("derive the candidate-count pin honestly"). F1 promotes that one-off to a rule.

F1 is stated about *assertions*, not about *inputs*. A test may construct any input
it likes; F1 constrains what the test is allowed to call the expected answer, and —
via E4 — forbids a function that consumes instrument output from being tested
*only* on inputs no instrument would emit.

### 2. E1–E4 — where F1 does not hold

A rule with no stated exceptions gets violated on its first real case, and the
violator is right. These four are the exceptions; each is grounded in an existing
test that is **correct as written** and must not be "fixed".

**E1 — the literal is the contract, and the test's own package owns it.**
`packages/schema/src/shape-entry.test.ts` asserts
`expect(schema.$id).toBe("urn:chess-tabiya:schema:shape-entry:0.3")` and
`expect(SHAPE_ENTRY_SCHEMA_VERSION).toBe("0.3")`;
`packages/schema/src/drill-pack.test.ts` does the same for
`urn:chess-tabiya:schema:drill-pack:0.22` and `DRILL_PACK_SCHEMA_VERSION`.
Deriving these would be worse than useless: the *point* is that changing the value
is a deliberate act with a register claim behind it (`rfc/README.md`
§Pack-schema-version register). `apps/server/src/shape-registry.test.ts`'s pinned
sorted key list of the public shape projection is the same class — the list *is*
the projection contract.

> **The ownership test that separates E1 from D47.** A literal is E1 only when the
> value is defined by the same package the test lives in, and the test exists to
> make changing it deliberate. If a **different writer** — the content author, a
> sibling package, an external instrument — can turn the assertion red without
> touching the code under test, it is not E1; it is D47. `SHAPE_ENTRY_SCHEMA_VERSION`
> in `packages/schema` is E1. A `content/shapes/*.json` `version` string asserted
> from `packages/runtime` is not.

**E2 — the path no valid artifact reaches.** Refusal and negative fixtures must
exhibit states no correct artifact contains. `apps/server/src/refusal-coverage.test.ts`
is the model and already complies with the spirit of F1: it `structuredClone`s a
**real** committed pack and mutates one field
(`duplicate.spine.push(...)`, `invalidFen.start.fen = "not a fen"`), so everything
except the defect under test remains real. **The required form is minimal mutation
of a real artifact, not hand-construction of a plausible-looking one.** A wholly
hand-built negative fixture is permitted only where no real artifact can be
mutated into the target state, and must say so in a comment.

**E3 — the instrument cannot run in `make verify`.** Maia, Stockfish,
`tablebase.lichess.org` and the explorer are not available to the unit suite;
`vitest.maia.config.ts` and the `INTEGRATION=maia` guard at the top of
`apps/server/src/maia.maia.integration.ts` exist precisely because of that. Under
E3 a **captured** fixture — real instrument output, stored — is the required
substitute. E3 licenses recording; it never licenses inventing. A fixture claiming
E3 without provenance (§3) is a plain F1 violation.

**E4 — the value is algebra, not artifact.** A test may use `0.4 / 0.35 / 0.2` when
its subject is the composition rule itself; `humanConcessionMass`'s
`combines policy mass with an externally supplied concession set` is legitimate and
stays. **The constraint E4 carries is a floor, not a licence:** a function whose
production input comes from an instrument must have **at least one** fixture that
is real instrument output (E3), and any *boundary or tolerance* in that function
must be exercised by it. D56 is exactly E4 applied without its floor — every
fixture was algebra, and the boundary was never crossed by a real distribution.

### 2a. F1a — a derivation that is a tautology is not a fix

Deriving `expect(entry.version).toBe(entry.version)` satisfies the letter of F1 and
asserts nothing. **Where the only available derivation reads the artifact to assert
against itself, the assertion has no subject: delete it and assert the behavioural
invariant the test actually exists for.** This is the disposition for D47 (§5b) and
it is the reason F1 is not "read everything from disk".

A version pin becomes meaningful again only when it is **cross-artifact** — pack X
declares it references shape entry Y at version Z, and the test checks the two
sides agree. That assertion has a subject and is permitted.

### 3. F2 — fixture provenance

The precedent already works and this RFC invents nothing: `docs/content-sourcing.md`
§Artifact boundary and §Reproducibility describe the sourcing triple, where
`sources.json` carries immutable retrieval identity, `job.json` carries the
deterministic job digest (`emissionJobDigest` / `sha256` in
`apps/server/src/sourcing/canonical.ts`), and `sourcedAt` derives from the newest
consumed input rather than the emit clock.

**The repo already contains both the compliant and the non-compliant form of the
same idea, one directory apart.** `apps/server/src/sourcing/fixtures/verify-draft-engine.json`
— consumed by `offlineEngineEvaluator` in `apps/server/src/sourcing/verify-draft.ts`
— carries a full `source` record per FEN: `licence` (basis, rationale), `origin`
(engineId, engineName, engineVersion, evidenceKind, budget `depth: 22`, profile
`threads: 1, hashMb: 16, multiPv: 1`), `retrievedAt`, `sourceId`. By contrast
`apps/server/src/sourcing/fixtures/verify-draft.json` is a bare FEN→payload map,
and `offlineQuery` in the same file **manufactures** the provenance at read time —
it synthesizes `retrievedAt` from a hash of the FEN, reconstructs the URL, and
digests the fixture bytes it just read. That record is self-consistent and
evidentially empty: it attests to the fixture, not to the tablebase.
`apps/server/src/sourcing/fixtures/explorer-response.json` is the third form —
hand-shaped numbers, including `"total": 999999`, standing in for a fetched HTTP
body.

> **F2.** A **captured fixture** — instrument output stored in the repo under E3 —
> carries a machine-readable provenance record. The record is data in a file, never
> a comment. It contains, at minimum:
>
> 1. **Instrument identity, pinned to a repo constant.** Where the repo defines a
>    constant naming the instrument, the record repeats it verbatim and a test
>    asserts equality against the constant. For Maia those constants are
>    `MAIA3_SOURCE_COMMIT`, `MAIA3_MODEL_ID` and `DEFAULT_MAIA_IMAGE`
>    (`apps/server/src/maia.ts`). For the authoring engine it is the B6b profile
>    already recorded in `verify-draft-engine.json` and in `docs/content-sourcing.md`
>    (Stockfish, depth 22, Threads 1, Hash 16 MB, MultiPV 1).
> 2. **The request that produced it** — for a policy vector: FEN, Elo band, MultiPV
>    and any seed; for an HTTP body: the exact URL and parameters.
> 3. **`retrievedAt`**, the real capture time.
> 4. **`sha256` of the captured bytes**, in the `sha256:<hex>` form
>    (`apps/server/src/sourcing/canonical.ts`) — **required only for fixtures
>    standing in for a fetched body**, where the digest is the tamper and drift
>    check the sourcing manifest already relies on. For a small captured vector the
>    identity pin (1) carries the value and a self-digest is ceremony; F2 does not
>    require it.

**F2a — the refresh mechanism is the identity pin, and it is free.** Because the
record repeats a repo constant and a test asserts equality, **moving the sidecar
pin turns the fixture test red**, and the only green resolution is recapture. No
scheduled job, no staleness clock, no new CI lane. When `MAIA3_SOURCE_COMMIT` or
`DEFAULT_MAIA_IMAGE` moves, every fixture claiming to have come from that sidecar
announces itself.

**F2b — recapture runs where the instrument runs.** The gated suite selected by
`vitest.maia.config.ts` (`INTEGRATION=maia`) is where a captured Maia fixture is
regenerated and where the captured values are re-asserted against a live sidecar.
`make verify` never needs the sidecar; it only needs the fixture and the constant.

### 4. F3 — discovery over allowlists, for the repo's own refusal gate

`apps/server/src/refusal-coverage.test.ts`'s final gate, *"requires every fixed
authoring refusal to have a direct test disposition"*, builds its emitter corpus
from a hand-written array of four `readFileSync` calls — `pack-validation.ts`,
`shape-validation.ts`, `expression-satisfiability.ts`, and
`packages/schema/src/drill-pack/lint.ts` — extracts `SCREAMING_CASE` string
literals, and asserts the `missing` set is empty against a test corpus built by a
**recursive directory walk** (`testSources`). The asymmetry is the defect: the
*tests* are discovered, the *emitters* are enumerated.

**Measured against the working tree at `4a893dc`, re-run unchanged at `90bb5bf` `[V]`** (script: collect
`new SourcingError("CODE"` from every non-test `.ts` under
`apps/server/src/sourcing/`, then search the concatenated `*.test.ts` corpus of
`apps/server/src` and `packages/` for `"CODE"`):

- **59 distinct `SourcingError` codes** exist.
- **45 of them appear nowhere in the test corpus** — not in an assertion, not in a
  comment. Among them: `DRAFT_PACK_INVALID`, `EMITTED_PACK_INVALID`,
  `OPENINGS_PGN_ILLEGAL`, `PUZZLE_FEN_INVALID`, `LOCK_LOST`,
  `VERIFY_ASSESSMENT_NOT_GROUNDABLE`, `VERIFY_LEDGER_MERGE_CONFLICT`,
  `ZSTD_UNAVAILABLE`, `RATING_BAND_INVALID`, `SOURCE_UNAVAILABLE`.

So the ledger row **D54 is marked ✅ CLOSED** and the row **"Vocabulary audit: the
reassuring half"** records *"zero without a test disposition"*, while an entire
refusal family — every refusal the content-sourcing pipeline can emit — is outside
the scanner's field of view. Both statements are true *of what the scanner reads*.
Neither is true of the repo. **The 107-emitter sweep was scoped to what the scanner
could see**, which is the D55 lesson (state your denominator) applied to a gate
rather than to a census.

The asymmetry has a second cause worth fixing at the same time: `ServerError`'s
code is a **closed union of 61 members** (`ServerErrorCode` in
`apps/server/src/errors.ts`), so adding one is a deliberate typed edit; but
`SourcingError`'s is declared `readonly code: string`
(`apps/server/src/sourcing/types.ts`), so its 59 codes have **no register at
all** — not a type, not a test, not a doc.

> **F3.** A gate that claims repo-wide coverage discovers its subjects by walking
> the tree, on the same footing as the corpus it checks them against. An
> enumerated source list is permitted only as a *deliberate exclusion* — named,
> dated, and justified in the file — never as the discovery mechanism.
>
> **F3a.** Where flipping a gate from allowlist to discovery would fail
> immediately (as here — 45 codes), the gate ships with an explicit **debt
> register**: a literal, dated, commented list of the known-unpinned subjects,
> asserted to be **exactly** the current set. The register is a contract literal
> under E1 (this file owns it), and the gate additionally asserts it **only ever
> shrinks**: a newly added code cannot be absorbed into the debt list, because a
> new code not in the register makes `missing` non-empty.

That last clause is the whole point of F3a: today, adding a `SourcingError` code
costs nothing and is invisible. After F3a, adding one without a test fails
`make verify`, while the 45 pre-existing ones are honest recorded debt rather than
a silent hole or a 45-test blocking ransom.

### 5. The three fixes

Each is specified as *the test that fails today*.

#### 5a. A float32-realistic policy-mass fixture

**State of the tree, stated honestly and without borrowing credit.** The arithmetic
half of D56 **landed during this drafting** as `960f91e`. It introduces
`FLOAT32_POLICY_MASS_TOLERANCE = 32 * 2 ** -23` (≈ 3.815e-6) in
`packages/runtime/src/practical-difficulty.ts`, replaces the raw `TypeError` with
`class PolicyMassError extends TypeError` carrying `code = "POLICY_MASS_INVALID"`,
widens both guards to that tolerance, adds
`PRACTICAL_RESISTANCE_POLICY_MASS_INVALID` to `ServerErrorCode` as a 422, adds a
captured 11-candidate Maia vector for `3b4/3k4/8/2PKP3/8/8/4B3/8 b - - 0 1` with
the test `accepts a real normalized Maia float32 policy vector`, and adds the
selector test `converts materially invalid Maia policy mass into a 422 refusal`.
**That work is not this RFC's and this RFC does not respecify it.** It is the
correct fix, it converts a fall-through `TypeError` into a coded refusal exactly as
`rfc/archive/validator-integrity.md` requires, and its new selector test is a
model **E2** fixture: `0.6 + 0.41 = 1.01` is materially invalid on purpose, a state
no real softmax reaches, so inventing it is right.

**Re-derived from the committed values `[V]`:** the captured vector sums to
`1.00000000803310996` — an excess of **8.033e-9**, which is 8× the retired `1e-9`
tolerance and would have thrown, and 475× *below* the new one. So the fixture is
genuinely load-bearing against the old guard while sitting at the small end of the
measured envelope (dossier max excess: 9.25e-08).

**What remains, and is this RFC's:**

1. **The provenance is a comment.** The captured vector is introduced by
   `// Captured from the pinned chess-tabiya-maia:1e13597 sidecar at Elo 1500,
   MultiPV 20, for <FEN>`. That is the right information in the one form no test
   can check and no refresh can act on. Under F2 it becomes a data record whose
   `image` field is asserted `toBe(DEFAULT_MAIA_IMAGE)` and whose model field is
   asserted `toBe(MAIA3_MODEL_ID)`. **Test that fails today:** the identity
   assertion — there is nothing to assert against, because the fixture carries no
   fields.
2. **The captured vector is the small case.** Under E4's floor, the fixture set for
   `humanConcessionMass` must include a capture at or near the measured worst case
   (excess ≈ 9.25e-08, and the symmetric deficit ≈ −1.45e-07 for the abstention
   path). **Test that fails today:** `expect(worstCaseVector.sum - 1).toBeGreaterThan(5e-8)`
   — no such fixture exists.
3. **No selector-level test drives a real vector.** `960f91e` added the E2 half —
   an invented *invalid* distribution refused as 422 — but every `maiaLines(...)`
   fixture in `apps/server/src/opponent-selector.test.ts` remains a hand-written
   decimal summing to exactly 1 or less, so the *valid-but-over-1* case that
   actually broke production is still never driven through a selection. That
   matters because the production failure was a **child** measurement inside a
   four-position selection, not a direct call. **Test that fails today:** a
   selector test whose Maia stub returns the captured float32 vector and asserts a
   selection or a *named* refusal — never a 500.

#### 5b. Version and count pins derived, or deleted

`packages/runtime/src/predicate-wave-2-content.test.ts` carries three content
literals: `expect(same.version).toBe("0.2.1")`, `expect(opposite.version).toBe("0.3.0")`,
`expect(entry.version).toBe("0.2.1")`. Under the E1 ownership test they fail —
`packages/runtime` does not own `content/shapes/*.json` — and under F1a their only
available derivation is a tautology.

**Disposition: delete all three.** The tests around them already assert the real
subject — `matchesStructuralExpression` returning specific booleans on specific
FENs — and lose nothing. Where a genuine version relation matters it belongs in
`packages/schema/src/shape-entry.test.ts`, which owns the entry schema, as the
*derived* invariant that every committed entry validates under
`SHAPE_ENTRY_SCHEMA_VERSION` — a test that file already has
(`validates all official entries`).

**Test that fails today:** a narrow guard, scoped to content-reading runtime tests,
asserting that no test file under `packages/runtime/src/` matching `*-content.test.ts`
contains a `.toBe("` applied to a semver-shaped literal. Three assertions fail it
now; zero after the deletion. The guard is deliberately narrow — a repo-wide
"no literals" lint would be both unenforceable and wrong under E1 — and its
false-positive risk (a legitimate semver-shaped assertion in a future
`*-content.test.ts`) is accepted, because that file class is *defined* as tests
that read content and therefore must never pin it.

Related and **already fixed** — cited as the model, not as work:
`apps/server/src/pack-authoring.test.ts`'s `packDirs` derivation (`d0c9a8a`). No
change.

#### 5c. The refusal scanner reads every emitter

Two changes to `apps/server/src/refusal-coverage.test.ts`'s
*"requires every fixed authoring refusal to have a direct test disposition"*:

1. **Discovery (F3).** Replace the four-file array with a recursive walk of
   non-test `.ts` sources under `apps/server/src/` and `packages/*/src/`, reusing
   the shape of the existing `testSources` walker. Extract codes from **emission
   sites**, which are enumerable and were counted over non-test sources `[V]`:
   `new ServerError("…"` (330 sites), `new SourcingError("…"` (100),
   `new RuntimeError("…"` (10), `new PackCompileError("…"` (8),
   `new PackRunPgnError("…"` (6), `new BranchQueryError("…"` (5), plus the
   issue-object form `code: "…"` and the
   `issue("…", …)` helper (`function issue` in
   `apps/server/src/shape-validation.ts`). Anchoring on emission sites rather than
   on bare `SCREAMING_CASE` literals is what makes a whole-tree walk viable: the
   present regex would otherwise sweep up every uppercase string in the repo, which
   is why it needs its `NFKC` and `/^R\d+$/` special cases today.
2. **A closed union for `SourcingError`.** Change `readonly code: string` in
   `apps/server/src/sourcing/types.ts` to a `SourcingErrorCode` union, mirroring
   `ServerErrorCode` in `apps/server/src/errors.ts`. This is the register that does
   not exist, it is compile-time-enforced, and it costs one type.

**Test that fails today:** the discovery walk with an empty debt register — it
reports **45 missing codes** (§4). It ships with those 45 in the F3a register,
dated, so `make verify` is green on landing and red the moment a 46th appears.

The existing `expect(fixedCodes.size).toBeGreaterThanOrEqual(100)` floor is
retained; under discovery its value rises well past 100 and the floor stops being
informative, so it should be restated as a floor on the *discovered* set or
removed — a judgement left to implementation, not a normative requirement here.

### 6. Scope

**This is the section most likely to be the reason the RFC works or is ignored.**
94 test files and 16,596 lines of test code exist under `apps/` and `packages/`. A
rule that requires auditing all of them is a rule nobody applies, and it would be
this RFC failing in exactly the way it describes: a correct principle with no
affordable instance.

**In scope now** (all of it fits in the three sites of §5 plus one type change):

- F1, E1–E4, F1a, F2, F3 written down as a rule — this document is the artifact.
- The three fixes in §5, each with a test that fails today.
- F2 provenance applied to **exactly one** fixture family: the captured Maia
  policy vectors of §5a. One family, one identity pin, one refresh mechanism.
- `SourcingErrorCode` as a closed union.

**Follow-on** (named so they are not lost, deliberately not attempted here):

- F2 provenance for `apps/server/src/sourcing/fixtures/verify-draft.json`,
  `tablebase-response.json` and `explorer-response.json`, and retiring the
  provenance `offlineQuery` synthesizes at read time. These are real instances of
  the same gap, but the sourcing pipeline is not currently failing because of them
  and the sourcing checker already validates the *emitted* artifacts.
- Retiring the 45 debt-register codes, in whatever waves touch them. The register's
  monotonic-shrink assertion is what makes this sustainable rather than a project.
- Extending the F3 discovery gate from refusal codes to the other enumerated
  allowlists in the test suite, once F3 has survived one wave.
- The D56 ledger magnitude correction (§Motivation) — owner or ledger tier.

**Deliberately left alone**, and named so cross-review does not read the omission
as an oversight:

- **Every other test in the repo.** No sweep, no audit, no mechanical rewrite. F1
  binds new and touched tests; it is not retroactive homework.
- **Pure-algebra unit tests** (E4). The `0.4/0.35/0.2` case stays.
- **Hand-mutated refusal fixtures** (E2). `refusal-coverage.test.ts`'s clone-and-break
  pattern is the model, not a target.
- **`.browser` fixtures and the denominator question** — that is D55 and it belongs
  to whatever instrument-reporting RFC picks it up, not here.
- **`ServerErrorCode`'s 61 members.** They have a typed register already; pinning
  all of them to tests is a much larger job with a much smaller payoff than the
  `SourcingError` family, which has no register at all.
- **The tolerance value itself.** `32 * 2 ** -23` is the in-flight implementation's
  choice and this RFC does not relitigate it (but see open question 2).

## Deviations from design

None. This RFC specifies no product surface, no learner-visible behaviour, and no
content rule. It touches no `design/` claim; it proposes a correction to one
`design/BACKLOG.md` row's arithmetic (§Motivation) and routes it rather than making
it, per the design-tier-is-intent-tier law.

## Acceptance criteria

1. `humanConcessionMass` has at least one fixture that is captured Maia output, and
   at least one whose sum exceeds 1 by more than 5e-8 — inside the dossier's
   measured envelope, above the retired `1e-9` guard.
2. Every captured fixture in scope carries a data provenance record (F2) with
   instrument identity, request parameters and `retrievedAt`, and no captured
   fixture's provenance lives only in a comment.
3. A test asserts each captured Maia fixture's recorded image and model against
   `DEFAULT_MAIA_IMAGE` and `MAIA3_MODEL_ID`; changing either constant in
   `apps/server/src/maia.ts` and running `make verify` turns it red. *This is
   demonstrated, not assumed — the implementation records the observed failure.*
4. At least one `apps/server/src/opponent-selector.test.ts` case drives a captured
   float32 vector through a full selection and asserts either a selection or a
   named `PRACTICAL_RESISTANCE_*` refusal. No path in that test can produce an
   uncoded throw.
5. `packages/runtime/src/predicate-wave-2-content.test.ts` contains no shape-entry
   `version` literal, and the narrow `*-content.test.ts` semver guard passes.
6. Moving every committed `content/shapes/*.json` `version` to a new patch value
   leaves `pnpm test` green for `packages/runtime`. *Demonstrated on a scratch
   branch, reverted, result recorded.*
7. `refusal-coverage.test.ts` discovers emitters by walking the tree; the walk
   finds `SourcingError` codes; `missing` is empty given the F3a debt register;
   and the register is asserted to be exactly the current known-unpinned set.
8. Adding a new `SourcingError` code with no test mention fails `make verify`.
   *Demonstrated, reverted, recorded.*
9. `SourcingError.code` is a closed union and `pnpm typecheck` passes.
10. `make verify` is green at landing with no test skipped, no timeout raised, and
    no fixture deleted to achieve it.

## Open questions

1. **Where does a provenance record physically live for a fixture that is currently
   an inline array in a test file?** Options: a sibling `*.fixture.json` read by the
   test (matches the sourcing precedent, adds a file), or an exported
   `provenance` object beside the vector in the same `.ts` (no new file, but keeps
   fixture data in source). The sourcing precedent favours the sidecar; the runtime
   package has no fixtures directory today. **Recommendation: sidecar JSON under
   `packages/runtime/src/fixtures/`**, because a JSON fixture can be regenerated by
   the `INTEGRATION=maia` suite writing a file, and a `.ts` literal cannot.
2. **Is `32 * 2 ** -23` (≈ 3.815e-6) the right tolerance, or 41× more generous than
   the evidence?** The measured maximum excess is 9.25e-08 ≈ 0.78 float32 ulp at
   1.0; the chosen bound admits distributions 41× further out than anything
   observed, which cannot be exhibited by the instrument and therefore cannot be
   tested. The counter-argument is that ulp-count bounds should be derived from the
   candidate cap (≤ 20 values), not from an observed sample, and 32 is that
   reasoning. **Not this RFC's to decide — routed to whoever lands D56** — but it
   should be *stated* in a comment as a derivation, since an untestable bound with
   an unexplained constant is how `1e-9` got there in the first place.
3. **Does F3a's debt register need an owner and an expiry, or is monotonic shrink
   enough?** Monotonic shrink prevents growth but permits a permanent 45. The
   `expression-census` precedent (Q4: *"a non-blocking CI job with no owner becomes
   noise"*) argues an unowned list decays into furniture. **Recommendation: no
   expiry, no owner, and a line in the register recording its size on the day it
   landed** — so a later reader can see whether it has moved. A deadline nobody
   agreed to is the failure mode the census already named.
4. **Should F1 apply to `apps/web` tests?** The web suite tests presentation over
   API shapes, where "the real artifact" is a server response that no unit test can
   obtain. E3 covers it in principle (capture the response), but no capture
   mechanism exists for the web tier and inventing one is out of proportion.
   **Recommendation: out of scope, stated in §6 by omission — flagged here so
   cross-review can overrule.**
5. **Does this RFC need a `docs/` page?** It amends no shipped subsystem, so there
   is nothing for `docs/` to describe canonically; the rule lives in the RFC and,
   once implemented, plausibly in `docs/development.md` beside `make verify`. **Owner
   call** — `docs/` is out of bounds for this draft either way.

## Changelog

- 2026-08-15: created.
