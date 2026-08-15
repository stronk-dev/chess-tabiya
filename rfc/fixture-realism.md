# RFC: Fixture realism — a test asserts against the artifact, not against a convenient invention

- **Status:** draft (awaiting cross-review)
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/BACKLOG.md` rows **D56** (`practical_resistance` returned HTTP 500 on 75% of its own domain; **the row was flipped to ✅ CLOSED by `960f91e` while this RFC was being drafted** — the arithmetic half is fixed, the fixture-discipline half that let it ship is §5a), **D47** (pin tests encode content facts — 4th instance), **D54** (**"CLOSED … NARROWER THAN IT READS — corrected 2026-08-15"**; the row now carries §4's measurements verbatim, landed by `cb32a68` after this draft was written — §4 is retained as the RFC's own independently re-verified statement of them, not as a discovery), **D55** (an instrument that walks content must state its denominator), **D64** (**`offlineQuery` manufactures the provenance it records** — §3's counterexample and a §6 follow-on; ledgered 2026-08-15), **D61** (**the phone-viewport browser assertion cannot fail** — the ledger's own third member of the tests-that-cannot-fail family, addressed by §6's denominator and open question 4), and **"Vocabulary audit: the reassuring half"** (the 107-emitter sweep). `design/research/maia-policy-scalar-stability.md` §8.1 is the measured evidence. *Every code site in this document is cited **by symbol name**. The working tree moved repeatedly during drafting: `packages/runtime/src/practical-difficulty.ts` and `.test.ts` were modified-uncommitted when §5a was first written and **landed as `960f91e` ("fix: tolerate Maia float32 policy mass") before this draft was finished** — §5a is written against the committed result and says which half it does not claim. `apps/server/src/opponent-selector.test.ts`'s fixture line numbers already differ from the ones the D56 dossier recorded this morning. **Locate by symbol first — every line number here is advisory.*** HEAD moved `4a893dc` → `960f91e` → `90bb5bf` during drafting and `90bb5bf` → `2c62275` → `cb32a68` → `efdd7e0` during cross-review; **every measurement in §4, §5 and §6 was re-run at `efdd7e0`** and the corrections that produced are marked `[cross-review]`.
- **Exploration gate:** owner ruling 2026-08-12 opened the RFC tier (`rfc/README.md` §Exploration gate). This RFC is opened by D56: a feature shipped in commit `4977ff6` ("Implement practical resistance spectrum") in the morning of 2026-08-15 and was measured broken on three quarters of its own domain by the afternoon, with a green suite throughout.
- **Depends on:** `rfc/archive/content-sourcing-foundation.md` (the manifest/digest/job-digest artifact triple this RFC borrows for fixtures), `rfc/archive/resistance-spectrum.md` (ships `practical_resistance` and `humanConcessionMass`), `rfc/archive/expression-census.md` §criterion 14 (the last widening of the refusal-coverage gate), `rfc/archive/validator-integrity.md` (the standing rule that a fall-through must become a named refusal rather than a `TypeError`)
- **Parent / amends:** amends test suites and one error type. Introduces **no new subsystem, no new persisted state, no format change, and no product surface.**
- **Supersedes / superseded by:** —
- **Planning:** `planning/fixture-realism/` (once implementing)

## Register claim

**This RFC claims nothing versioned. Loudly, because that is the better outcome.**

No pack schema version (**0.20, 0.21 and 0.22 are all `implemented` in
`rfc/README.md` §Pack-schema-version register — corrected `[cross-review]`, the
draft read "0.21 and 0.22 are claimed"; 0.23 is free and spoken for by
`engine-request-contract.md`'s explicit non-claim; **0.19 is frozen shut**), no
run schema version, no shape-entry schema version, no migration number, no `$id`
change, no new event, no new persisted field, no new HTTP route, no new
`ServerErrorCode`.

It touches exactly three kinds of thing: **test files**, **fixture files**, and
**one error type's `code` field** (`SourcingError.code`, `string` → a closed
union, `apps/server/src/sourcing/types.ts` `class SourcingError`). The union is a
compile-time register, not a versioned artifact; adding to it costs nothing and
collides with nobody. Cascade check `[V, cross-review]`: all **100**
`new SourcingError(` sites pass a string literal — there is no dynamic code
anywhere — and every consumer of `.code` only interpolates it into a `console.error`
string (`verify-draft.ts`, `tablebase-walk.ts`, `engine-walk.ts`,
`source-fetch.ts`, `candidate-attach.ts`). Closing the union is a one-type edit
with no downstream narrowing to negotiate.

**Landing-order neighbours — one correction `[cross-review]`.** The draft said
"nothing … has to negotiate landing order with `live-marker-quality.md` or with any
archived-but-recent wave", and omitted `rfc/engine-request-contract.md`, which
landed as a draft at `efdd7e0` *after* this draft was written. There is **no
register collision** — it claims run schema 0.15 + migration 20, both contingent,
and no pack-schema version. There **is a textual one**: it rewrites
`apps/server/src/opponent-selector.ts` (`:434-443`, `:469-520`) and
`apps/server/src/engine-supervisor.ts` (`parseIdentity`), and §5a of this RFC adds
cases to `apps/server/src/opponent-selector.test.ts`. Neither ordering is blocking;
whichever lands second rebases its test additions.

The one adjacent claim to declare: `PRACTICAL_RESISTANCE_POLICY_MASS_INVALID` was
added to `ServerErrorCode` **by the D56 fix `960f91e`**, not by this RFC. This RFC
neither claims nor needs it (§5a).

**A second unregistered vocabulary, named so its omission is not read as
coverage** `[V, cross-review]`: `SourcingIssue.code`
(`apps/server/src/sourcing/types.ts`, the interface immediately above
`class SourcingError`) is *also* a bare `string`, carrying **15** distinct
literals, and is invisible to the same gate for the same reason. §5c closes
`SourcingError` only; `SourcingIssue` is a named §6 follow-on. Note for anyone
tracing the citation: the `D54` ledger row cites `sourcing/types.ts:106` for
`SourcingError.code`, but line 106 is **`SourcingIssue.code`** — `SourcingError`'s
is the constructor parameter seven lines below. The row's claim is true of both
fields; only the line is misattributed, and correcting it is ledger-tier.

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
refusal gate (**F3**, §4), and fixes exactly four sites (§5 — three from the draft
plus **F4**, the gate that makes E4's floor enforceable, added in cross-review
because without it the rule at the centre of D56 was the one rule nothing checked).
§6 draws the scope boundary: 94 test files and 16,596 lines exist under `apps/` and
`packages/`, and this RFC rewrites none of them wholesale.

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
> test exists to make changing the value deliberate, **and** the only writer who can
> turn the assertion red is one whose change the assertion is *about*. If a
> **different writer** — the content author, a sibling package, an external
> instrument — can turn the assertion red with a change the test is **not** about,
> it is not E1; it is D47. `SHAPE_ENTRY_SCHEMA_VERSION` in `packages/schema` is E1.
> A `content/shapes/*.json` `version` string asserted from `packages/runtime` is
> not: the test is about `matchesStructuralExpression`, and a content migration is
> not a fact about `matchesStructuralExpression`.

**Two counterexamples the draft's first formulation misclassified, and the repair
`[cross-review]`.** The draft stated the criterion as *"the value is defined by the
same package the test lives in"* and *"if a different writer can turn the assertion
red without touching the code under test, it is not E1"*. Applied mechanically it
gets two cases wrong, in both directions:

- **It excludes its own flagship example.** `packages/schema/src/drill-pack.test.ts`
  asserts `schema.$id` where `schema` is read from
  `schemas/drill_pack.schema.json` — the **repo-root `schemas/` directory**, not
  `packages/schema` (`const schema = json("../../../schemas/drill_pack.schema.json")`;
  `shape-entry.test.ts` reads `schemas/shape_entry.schema.json` the same way). A
  writer editing `schemas/` turns the assertion red without touching
  `packages/schema/src/index.ts`. "Same package" is the wrong boundary; "the
  change the assertion is about" is the right one, and a schema `$id` bump is
  exactly what that pin is about.
- **It excludes F3a's own debt register.** §4's register is a literal list of
  unpinned `SourcingError` codes living in `refusal-coverage.test.ts`, and it is
  *designed* to go red when a **different writer** — whoever adds or tests a
  sourcing code — changes the set, without touching `refusal-coverage.test.ts`.
  Under the draft's wording the RFC's own central mechanism is "the pin-test
  defect". Under the repaired wording it is E1, because going red **is** the signal
  the register exists to produce: the change that turns it red is precisely the
  change it is about.

The repair costs nothing in discriminating power. D47's three literals still fail:
a shape-entry version bump is not a fact about `matchesStructuralExpression`, so the
redness is collateral rather than the point. **This is the criterion's load-bearing
distinction — mis-attributed redness, not foreign authorship.** A test that goes red
at the right writer for the right reason is a gate; a test that goes red at the
wrong writer for an unrelated reason is D47.

One check the repaired criterion passes cleanly `[V, cross-review]`:
`apps/server/src/shape-registry.test.ts`'s pinned sorted key list looks like a
content literal but is not — `projectDocument` in `shape-registry.ts` constructs
all nine keys unconditionally from required schema fields, so no content edit can
move it. Its sibling assertion in the same test derives the shape-id list from
`readdir(content/shapes/)` with an in-file comment naming the D4 lesson. The file
already applies both halves of this RFC correctly, which is why it is cited as the
model rather than as work.

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
is real instrument output (E3), and any *instrument-reachable boundary or tolerance*
in that function must be exercised by it. D56 is exactly E4 applied without its
floor — every fixture was algebra, and the boundary was never crossed by a real
distribution.

> **The floor is enforced by F4 (§5d), not by this paragraph `[cross-review]`.**
> The draft stated the floor here and nowhere else, which left the one rule at the
> centre of D56 as unchecked prose while its two lesser siblings each shipped a
> gate. §5d adds the register that makes it fail. The word
> *instrument-reachable* is also a cross-review repair: as originally written the
> floor was unsatisfiable for the very function it was written about, because
> `FLOAT32_POLICY_MASS_TOLERANCE` lies 41× outside anything Maia can emit (§5d).

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

**F2a — the identity pin is the *notification*, and it is free.** Because the
record repeats a repo constant and a test asserts equality, **moving the sidecar
pin turns the fixture test red**. No scheduled job, no staleness clock, no new CI
lane. When `MAIA3_SOURCE_COMMIT` or `DEFAULT_MAIA_IMAGE` moves, every fixture
claiming to have come from that sidecar announces itself.

> **Correction `[cross-review]`.** The draft said *"the only green resolution is
> recapture"*. **That is false, and asserting it is the exact error this RFC exists
> to name.** Editing the fixture's `image` field to the new constant is a one-token
> green fix, and F2 clause 4 deliberately waives the digest for small captured
> vectors — so **nothing binds the recorded identity to the recorded numbers**. A
> transcribed identity field is a transcribed literal; F1 forbids that in an
> assertion and F2 must not smuggle it back in as data. F2a is a *notification*
> mechanism, not a forcing function, and the RFC must not claim otherwise.

**F2b — recapture runs where the instrument runs, and F2b is what verifies.** The
gated suite selected by `vitest.maia.config.ts` (`INTEGRATION=maia`) is where a
captured Maia fixture is regenerated and where **the captured values are re-asserted
against a live sidecar** — that assertion, not F2a's equality check, is the only
thing that can fail a stale-but-relabelled fixture. `make verify` never needs the
sidecar; it only needs the fixture and the constant. The honest statement of the
pair: **F2a tells you a fixture may be stale; F2b is the only thing that can prove
it is.** An identity-pin bump therefore carries an obligation to run the gated
suite, and the implementation records that it ran.

**F2c — where the identity assertion lives, and why it cannot live where the draft
put it `[V, cross-review]`.** `packages/runtime/package.json` depends on
`@chess-tabiya/schema` and `chessops`; **`apps/server/package.json` depends on
`@chess-tabiya/runtime`, not the reverse.** A test in `packages/runtime` therefore
**cannot `import { DEFAULT_MAIA_IMAGE } from "apps/server/src/maia.js"`** — which is
exactly what acceptance criterion 3 requires and what open question 1's recommended
fixture location (`packages/runtime/src/fixtures/`) would force. The draft did not
notice the conflict; without this clause the RFC's headline mechanism is not
implementable as written. Resolution, normative:

> The captured vector and its F2 record are a **JSON sidecar under
> `packages/runtime/src/fixtures/`** — open question 1's recommendation stands, as
> it is the only form the `INTEGRATION=maia` suite can regenerate by writing a
> file. The **identity assertion against `DEFAULT_MAIA_IMAGE` and `MAIA3_MODEL_ID`
> lives in `apps/server`**, which can import both the constants and the fixture.
> The `packages/runtime` test consumes the sidecar's candidate array and asserts
> arithmetic only; it does not assert instrument identity, because it is in the
> wrong package to do so.

The alternative — reading `apps/server/src/maia.ts` as **text** from
`packages/runtime`, the pattern `practical-difficulty.test.ts`'s
`keeps one definition of the policy-mass/concession composition` already uses to
walk `../../../apps/server/src/` — is **rejected**: a regex over source text is a
derivation whose subject is the file's spelling rather than its value, and it goes
green-and-vacuous the moment the constant moves file. The dependency direction is a
fact about the repo; the assertion moves to fit it.

### 4. F3 — discovery over allowlists, for the repo's own refusal gate

`apps/server/src/refusal-coverage.test.ts`'s final gate, *"requires every fixed
authoring refusal to have a direct test disposition"*, builds its emitter corpus
from a hand-written array of four `readFileSync` calls — `pack-validation.ts`,
`shape-validation.ts`, `expression-satisfiability.ts`, and
`packages/schema/src/drill-pack/lint.ts` — extracts `SCREAMING_CASE` string
literals, and asserts the `missing` set is empty against a test corpus built by a
**recursive directory walk** (`testSources`). The asymmetry is the defect: the
*tests* are discovered, the *emitters* are enumerated.

**Measured against the working tree at `4a893dc`, re-run unchanged at `90bb5bf`,
independently re-run at `efdd7e0` `[V, cross-review]`** (script: collect
`new SourcingError("CODE"` from every non-test `.ts` under
`apps/server/src/sourcing/`, then search the concatenated `*.test.ts` corpus of
`apps/server/src` and `packages/` for `"CODE"`):

- **59 distinct `SourcingError` codes** exist — confirmed, and confirmed that not
  one of them is emitted from a test file.
- **45 of them are absent from the quoted-literal search.** Among them:
  `DRAFT_PACK_INVALID`, `EMITTED_PACK_INVALID`, `OPENINGS_PGN_ILLEGAL`,
  `PUZZLE_FEN_INVALID`, `LOCK_LOST`, `VERIFY_ASSESSMENT_NOT_GROUNDABLE`,
  `VERIFY_LEDGER_MERGE_CONFLICT`, `ZSTD_UNAVAILABLE`, `RATING_BAND_INVALID`,
  `SOURCE_UNAVAILABLE`.

> **Correction, and a defect it exposes in the gate itself `[V, cross-review]`.**
> The draft said the 45 *"appear nowhere in the test corpus — not in an assertion,
> not in a comment"*. **For three of them that is false.**
> `RATINGS_NOT_A_GROUP`, `SPEEDS_NOT_A_SPEED` and `WINDOW_INVALID` each have a
> direct test disposition, written as an **unquoted alternation inside a
> `toThrow(/…/)` regex** — e.g.
> `.toThrow(/RATINGS_NOT_A_GROUP|ratings must/)`. The true count of codes with no
> mention of any kind is **42**, not 45.
>
> This is not a bookkeeping nit. The existing gate matches with
> `corpus.includes(\`"${code}"\`)` — **double-quoted substring** — so a
> regex-shaped disposition is invisible to it. A discovery gate inheriting that
> matching rule would put three already-tested codes into the F3a debt register,
> and a register asserted to be *"exactly the current set"* that is wrong on the
> day it lands is a gate asserting against a convenient invention. **F3b (below)
> fixes the matching rule; the fix is a precondition for F3a, not a follow-on.**

So the ledger row **"Vocabulary audit: the reassuring half"** records *"zero
without a test disposition"* while an entire refusal family — every refusal the
content-sourcing pipeline can emit — is outside the scanner's field of view. The
statement is true *of what the scanner reads*; it is not true of the repo. **The
107-emitter sweep was scoped to what the scanner could see**, which is the D55
lesson (state your denominator) applied to a gate rather than to a census. The
**D54** row itself no longer overstates: `cb32a68` landed the narrowing
("NARROWER THAN IT READS — corrected 2026-08-15") carrying these figures, after
this draft was written. §4 is retained as this RFC's independent re-verification of
them, not as a discovery it can still claim.

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
> immediately (as here — **111 codes**, §5c, not the 45 the draft assumed), the
> gate ships with an explicit **debt register**: a literal, dated, commented list
> of the known-unpinned subjects, asserted to be **exactly** the current set. The
> register is a contract literal under E1 — it goes red at the writer whose change
> it is about, which is the repaired E1 criterion of §2, not the draft's
> "same package" one — and the gate additionally asserts it **only ever shrinks**:
> a newly added code cannot be absorbed into the debt list, because a new code not
> in the register makes `missing` non-empty.
>
> **F3b — the coverage predicate is code-shaped, not quote-shaped.** A subject
> counts as disposed if the code appears in the test corpus as a **word-boundaried
> token**, in any syntactic position — a quoted literal, a `toThrow(/A|B/)`
> alternation, a template, an imported constant. Substring-of-a-quoted-string is
> not the predicate; three real dispositions are invisible to it today (§4). A
> discovery gate whose *own* matching rule mis-reports its subjects is the failure
> this RFC names, one level up.

That shrink clause is the whole point of F3a: today, adding a `SourcingError` code
costs nothing and is invisible. After F3a, adding one without a test fails
`make verify`, while the pre-existing ones are honest recorded debt rather than a
silent hole or a hundred-test blocking ransom.

### 5. The four fixes

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

**Re-derived from the committed values `[V]`, and re-derived a second time at
`efdd7e0` `[V, cross-review]`:** the 11 committed masses sum to
`1.00000000803310996` — an excess of **8.0331e-9**, which is **8.03×** the retired
`1e-9` tolerance (so it would have thrown, and the fixture is genuinely
load-bearing against the old guard) and **475×** *below* the new one. All three of
the draft's §5a claims are confirmed exactly: the provenance is a comment at the
top of `practical-difficulty.test.ts`; the excess sits at the small end of the
measured envelope (dossier max 9.25e-08 — this fixture is **11.5× smaller** than
the worst case it stands in for); and **every `maiaLines(...)` mass in
`apps/server/src/opponent-selector.test.ts` is still a hand-written decimal summing
to exactly 1 or less**, the sole exception being the deliberate `0.6 + 0.41` E2
case. Point 3 below is the one that matters, and it is the one that is true.

**What remains, and is this RFC's:**

1. **The provenance is a comment.** The captured vector is introduced by
   `// Captured from the pinned chess-tabiya-maia:1e13597 sidecar at Elo 1500,
   MultiPV 20, for <FEN>`. That is the right information in the one form no test
   can check and no refresh can act on. Under F2 it becomes a data record whose
   `image` field is asserted `toBe(DEFAULT_MAIA_IMAGE)` and whose model field is
   asserted `toBe(MAIA3_MODEL_ID)` — **from `apps/server`, per F2c**, because
   `packages/runtime` cannot import those constants. **Test that fails today:** the
   identity assertion — there is nothing to assert against, because the fixture
   carries no fields.
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
asserting no `.toBe("` applied to a semver-shaped literal. Three assertions fail it
now; zero after the deletion. The guard is deliberately narrow — a repo-wide
"no literals" lint would be both unenforceable and wrong under E1 — and its
false-positive risk (a legitimate semver-shaped assertion in such a file) is
accepted, because that file class is *defined* as tests that read content and
therefore must never pin it.

> **The trigger is behavioural, not lexical `[cross-review]`.** The draft scoped
> the guard to files *"matching `*-content.test.ts`"*. Measured: there is **exactly
> one** such file in `packages/runtime/src/`, and it is the one being fixed. A
> guard whose corpus is a single file, selected by a filename convention nothing
> enforces, goes permanently silent the moment the next author names their file
> anything else — which is a guard that cannot fail, in an RFC about tests that
> cannot fail. **Normative form:** the guard's corpus is every `*.test.ts` under
> `packages/*/src/` **that reads `content/`** — detectable because such a file
> contains a `content/` path literal, as `predicate-wave-2-content.test.ts` does
> (`new URL(\`../../../content/shapes/${id}.json\`, import.meta.url)`). That is the
> property the rule is actually about. Verified `[V]`: today exactly one file in
> `packages/runtime/src/` matches either definition, and it carries exactly the
> three semver literals named above and no others, so both forms fail today by 3
> and pass after the deletion — the behavioural form simply keeps failing in
> future.

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

**Test that fails today:** the discovery walk with an empty debt register.

> **The draft's number was wrong, and wrong in the direction that matters
> `[V, cross-review]`.** It said the walk *"reports 45 missing codes (§4). It ships
> with those 45 in the F3a register"*. But §4 measured **one** family
> (`SourcingError`), while §5c specifies a walk over **seven** emission forms. The
> walk was implemented exactly as specified above — six `new XError("…"` families
> plus `issue("…"` plus the `code: "…"` object form, over every non-test `.ts`
> under `apps/` and `packages/` — and run at `efdd7e0`:
>
> - **194 distinct codes discovered.**
> - **111 missing** from the test corpus, not 45. By family:
>   `SourcingError` 45, `ServerError` 31, `issue()` 18, `code:` 6,
>   `PackCompileError` 5, `PackRunPgnError` 4, `BranchQueryError` 2,
>   `RuntimeError` 1.
>
> The debt register is therefore **111 entries, not 45** — 2.5× the size the draft
> budgeted, and acceptance criterion 7 as drafted ("`missing` is empty given the
> F3a debt register") is **unsatisfiable with a 45-entry register**. The figure is
> further adjusted by F3b: three `SourcingError` codes disposed by regex leave the
> register once the matching predicate is fixed, and the same rule will discharge
> an unknown number of the other 66 — **the implementation measures the register
> under F3b's predicate and records the number it actually lands with; it does not
> transcribe 111 from here.** That is F1 applied to this RFC's own arithmetic.
>
> **This does not change the design, and it changes the scope claim.** The
> shrink-only mechanism is what makes 111 survivable rather than a project (§6),
> and 31 unpinned `ServerError` codes are recorded debt in a family §6 explicitly
> declines to pin — they are *registered* here, not *fixed*. But the draft's §6
> claim that "all of it fits in the three sites of §5 plus one type change" was
> only true because the register absorbs the difference; §6 now reads the in-scope
> work as "four fixes, one type, and two registers".

It ships with that register, dated, so `make verify` is green on landing and red
the moment one more appears.

The existing `expect(fixedCodes.size).toBeGreaterThanOrEqual(100)` floor is
retained; under discovery its value rises to 194 and the floor stops being
informative, so it should be restated as a floor on the *discovered* set or
removed — a judgement left to implementation, not a normative requirement here.

#### 5d. F4 — the E4 floor gets a register, or the rule is prose `[cross-review]`

**This is the fix the draft stopped one step short of, and it is at the centre of
its own lesson.** Ask the question the RFC is for: *would the in-scope set have
prevented D56?* §5a fixes the D56 fixture. §5b's guard enforces §5b. §5c's gate
enforces §5c. But **E4's floor — "a function whose production input comes from an
instrument must have at least one fixture that is real instrument output, and any
boundary or tolerance in that function must be exercised by it" — has no enforcing
gate anywhere in scope.** It is prose in §2. Prose in §2 is exactly what the `1e-9`
guard had: a correct intent nothing checked.

So the honest answer to *"is the in-scope set sufficient to prevent a repeat of
D56?"* is **no, as drafted.** It prevents *this* instance and repairs *this*
fixture. The next instrument-fed function that ships with a hand-chosen tolerance
and algebra-only fixtures ships green, exactly as `humanConcessionMass` did on the
morning of 2026-08-15, and nothing in this RFC turns red. Two of the draft's three
fixes bought themselves a gate; the third — the one that names the failure — did
not. F4 is that gate, and it is the difference between an RFC that fixes D56 and an
RFC that fixes the class D56 belongs to.

> **F4.** The repo carries an **instrument-fed register**: a literal, dated list of
> the functions whose production input is instrument output, each naming the
> captured fixture (F2) that satisfies E4's floor and, where the function carries a
> tolerance or boundary, the fixture that crosses it. A test asserts the register
> is **complete**: every entry resolves to an existing fixture whose recorded value
> actually crosses the named bound. Unlike F3a's, this register **only ever grows** —
> adding an instrument-fed function without a captured fixture means adding an
> entry that fails to resolve.

The register has **one entry on landing** — `humanConcessionMass`, with its two
fixtures (the committed 8.03e-9 capture and §5a's required worst-case one) and the
bound `FLOAT32_POLICY_MASS_TOLERANCE`. That is deliberate: F4's value is not the
list, it is that a second instrument-fed function now has somewhere it must appear,
and a reviewer of that future wave has one file to check. **Cost: one file, one
test, one entry.** Refusing that cost is refusing the RFC's own conclusion.

**Test that fails today:** the register with `humanConcessionMass` in it — its
worst-case fixture does not exist (§5a point 2). The one instrument-fed function in
the repo fails F4 today, which is the strongest available evidence that F4 is not
ceremony.

> **A contradiction inside E4 that the draft did not notice, and that F4 forces
> into the open `[cross-review]`.** E4's floor says *"any boundary or tolerance in
> that function must be exercised by"* a real captured fixture. Applied to
> `humanConcessionMass`, that is **unsatisfiable**: the tolerance is
> `FLOAT32_POLICY_MASS_TOLERANCE` = 3.815e-6, and the dossier's measured envelope
> tops out at an excess of **9.25e-08** — 41× inside it. **No capture from this
> instrument can cross this bound.** The RFC cannot hold both E4's floor as written
> and the shipped tolerance; §5a's own acceptance criterion 1 quietly substitutes a
> weaker bound (`> 5e-8`, the envelope) without saying it is doing so.
>
> **Resolution, normative.** E4's floor binds the **instrument-reachable** bound:
> a captured fixture must cross the widest value the instrument can actually
> produce, and where a function's declared bound lies outside that range, F4's
> register **records the bound as instrument-unreachable, by name, with the measured
> envelope beside it.** That record is the honest form. It also converts **open
> question 2 from advisory to blocking for `accepted`**: by this RFC's own rule, a
> guard no fixture can cross is a guard nothing tests, which is `1e-9`'s failure
> with the sign flipped — too loose instead of too tight, and equally unexercised.
> The draft routed that question away with *"not this RFC's to decide"*. F4 shows
> it is: the register cannot be filled in honestly without an answer.

**What F4 deliberately does not do.** It does not attempt to *discover* instrument-fed
functions by walking the tree — there is no reliable syntactic marker for "this input
came from an engine", and an unreliable discovery gate is worse than an honest
register (the F3a lesson, applied to itself). It is an allowlist, and under F3 an
allowlist is permitted only as a *deliberate exclusion, named, dated and justified in
the file* — which is exactly what this is, and the file says so.

### 6. Scope

**This is the section most likely to be the reason the RFC works or is ignored.**
94 test files and 16,596 lines of test code exist under `apps/` and `packages/`
(verified exactly, `[V, cross-review]`). A rule that requires auditing all of them
is a rule nobody applies, and it would be this RFC failing in exactly the way it
describes: a correct principle with no affordable instance.

> **State the denominator — this RFC's own, since it invokes D55 against others
> `[V, cross-review]`.** "94 files, 16,596 lines" counts `*.test.ts` under `apps/`
> and `packages/`. It **excludes `tests/browser/`** — `drill.spec.ts`,
> `match.spec.ts`, `maia-latency.spec.ts`, 3 files, 1,139 lines — which is a
> different suite, a different runner, and **not** under the two roots named. The
> draft did not say so. That omission matters because **`D61` lives there**: *"the
> phone-viewport browser assertion cannot fail"*, ledgered 2026-08-15 as the
> *"third member of the tests-that-cannot-fail family, after D56's tidy fixtures
> and D54's single-file scanner"*. The ledger has already placed a third instance
> of this RFC's own family inside the region this RFC silently excluded.

**In scope now** (the four sites of §5, one type change, and two registers):

- F1, E1–E4, F1a, F2/F2a–F2c, F3/F3a/F3b, F4 written down as a rule — this
  document is the artifact.
- The four fixes in §5, each with a test that fails today.
- F2 provenance applied to **exactly one** fixture family: the captured Maia
  policy vectors of §5a. One family, one identity pin, one refresh mechanism.
- `SourcingErrorCode` as a closed union.
- Two registers: F3a's ~111-entry shrink-only refusal debt list, and F4's
  one-entry grow-only instrument-fed list.

**Follow-on** (named so they are not lost, deliberately not attempted here):

- F2 provenance for `apps/server/src/sourcing/fixtures/verify-draft.json`,
  `tablebase-response.json` and `explorer-response.json`, and retiring the
  provenance `offlineQuery` synthesizes at read time (**D64**). These are real
  instances of the same gap. **The deferral is defensible and now measured rather
  than asserted `[V, cross-review]`:** every `sourceId: "syzygy"` entry in every
  committed `sources.json` under `content/` — **341 of them** — was re-derived
  against `offlineQuery`'s synthesis formula
  (`Date.UTC(2026, 7, 14) + parseInt(sha256(fen).slice(7, 15), 16) % 86_400_000`),
  and **zero match**: their timestamps are sequential live-fetch clusters ~32 ms
  apart. No manufactured provenance has reached a committed artifact. **What the
  measurement also shows is that nothing prevents it:** no test asserts that a
  committed manifest contains no synthesized entry, so the deferral rests on the
  fact that nobody has committed an `OFFLINE=1` run, not on a mechanism. The
  follow-on should carry that guard, and this RFC states the exposure rather than
  leaving it implied.
- Retiring the debt-register codes, in whatever waves touch them. The register's
  monotonic-shrink assertion is what makes this sustainable rather than a project.
- **`SourcingIssue.code`** — a bare `string` with 15 distinct literals in the same
  file as `SourcingError`, invisible to the same gate for the same reason (§Register
  claim). §5c closes one of the two; the second is named here so its omission is not
  read as coverage.
- Extending the F3 discovery gate from refusal codes to the other enumerated
  allowlists in the test suite, once F3 has survived one wave.
- **D61 and `tests/browser/`** — see the "deliberately left alone" entry below.

**Deliberately left alone**, and named so cross-review does not read the omission
as an oversight:

- **Every other test in the repo.** No sweep, no audit, no mechanical rewrite. F1
  binds new and touched tests; it is not retroactive homework.
- **Pure-algebra unit tests** (E4). The `0.4/0.35/0.2` case stays.
- **Hand-mutated refusal fixtures** (E2). `refusal-coverage.test.ts`'s clone-and-break
  pattern is the model, not a target.
- **`.browser` fixtures and the denominator question** — that is D55 and it belongs
  to whatever instrument-reporting RFC picks it up, not here.
- **`tests/browser/` and D61 — a *different* omission from the `.browser` one, and
  the draft conflated them `[cross-review]`.** D55 is about which content fixtures
  an instrument counts. **D61 is an assertion that cannot fail** — the phone
  viewport check is vacuous because the shipped CSS makes `scrollHeight ===
  clientHeight` constant — which is F1's family, not D55's, and it is in the suite
  §6's denominator excludes. It is nonetheless **out of scope here**, for a reason
  worth stating rather than routing away: F1 as written binds *assertions against
  artifacts*, and D61's defect is an assertion against a **property the
  implementation makes constant**, which F1 does not currently name. That is a
  genuine extension of the rule — "an assertion whose expected value is forced by
  the code under test asserts nothing", a sibling of F1a's tautology clause — and
  it deserves its own pass with the browser suite in the denominator. **Named, not
  routed to D55.**
- **`ServerErrorCode`'s 61 members** (verified exactly, `[V, cross-review]`; 57 of
  them are actually emitted). They have a typed register already; pinning all of
  them to tests is a much larger job with a much smaller payoff than the
  `SourcingError` family, which has no register at all. Note that §5c's discovery
  walk nonetheless *records* 31 of them as debt (§5c) — recording is not pinning,
  and the shrink-only rule means a new `ServerErrorCode` still cannot land untested.
- **The tolerance value itself.** `32 * 2 ** -23` is the in-flight implementation's
  choice and this RFC does not relitigate it (but see open question 2).

## Deviations from design

None. This RFC specifies no product surface, no learner-visible behaviour, and no
content rule. It touches no `design/` claim.

*Cleared during cross-review:* the draft closed this section by saying it *"proposes
a correction to one `design/BACKLOG.md` row's arithmetic (§Motivation) and routes
it"*, and §6 listed that correction as an open follow-on — while §Motivation
already said *"no correction is owed"*. The three statements contradicted each
other, and all three are now moot: `cb32a68` ("ledger: D54 closure narrowed; D64;
and my own magnitude overstatement corrected") landed both the D56 magnitude
correction and the D54 narrowing, after this draft was written. **Nothing is routed
to the ledger tier by this RFC.**

## Acceptance criteria

1. `humanConcessionMass` has at least one fixture that is captured Maia output, and
   at least one whose sum exceeds 1 by more than 5e-8 — inside the dossier's
   measured envelope, above the retired `1e-9` guard.
2. Every captured fixture in scope carries a data provenance record (F2) with
   instrument identity, request parameters and `retrievedAt`, and no captured
   fixture's provenance lives only in a comment.
3. A test **in `apps/server`** (per F2c — `packages/runtime` cannot import these
   constants) asserts each captured Maia fixture's recorded image and model against
   `DEFAULT_MAIA_IMAGE` and `MAIA3_MODEL_ID`; changing either constant in
   `apps/server/src/maia.ts` and running `make verify` turns it red. *This is
   demonstrated, not assumed — the implementation records the observed failure.*
4. At least one `apps/server/src/opponent-selector.test.ts` case drives a captured
   float32 vector through a full selection and asserts either a selection or a
   named `PRACTICAL_RESISTANCE_*` refusal. No path in that test can produce an
   uncoded throw. **This is the criterion that closes D56's actual failure mode**
   (a child measurement inside a four-position selection); 1, 2 and 3 close the
   fixture-discipline half.
5. `packages/runtime/src/predicate-wave-2-content.test.ts` contains no shape-entry
   `version` literal, and the semver guard passes — with the guard's corpus defined
   **behaviourally** (test files under `packages/*/src/` that read `content/`), not
   by the `*-content.test.ts` filename convention (§5b).
6. Moving every committed `content/shapes/*.json` `version` to a new patch value
   leaves `pnpm test` green for `packages/runtime`. *Demonstrated on a scratch
   branch, reverted, result recorded.* (Achievable: verified `[V]` that the three
   literals in §5b are the **only** semver literals in any `packages/runtime`
   test.)
7. `refusal-coverage.test.ts` discovers emitters by walking the tree over **all
   seven emission forms of §5c**, not `SourcingError` alone; `missing` is empty
   given the F3a debt register; the register is asserted to be exactly the current
   known-unpinned set; and **its size is the number the implementation measured
   under F3b's predicate, recorded in the file, not the ~111 transcribed from
   §5c.**
8. Adding a new `SourcingError` code with no test mention fails `make verify`.
   *Demonstrated, reverted, recorded.*
9. `SourcingError.code` is a closed union and `pnpm typecheck` passes.
10. **F3b:** at least the three codes disposed only by `toThrow(/…/)` alternation —
    `RATINGS_NOT_A_GROUP`, `SPEEDS_NOT_A_SPEED`, `WINDOW_INVALID` — are recognised
    as disposed and are **absent** from the debt register.
11. **F4:** the instrument-fed register exists, contains `humanConcessionMass`, and
    its entry resolves to a captured fixture that crosses the **instrument-reachable
    bound** recorded for that function (see the E4 contradiction below — for
    `humanConcessionMass` that is the measured envelope, ≥ 5e-8, *not*
    `FLOAT32_POLICY_MASS_TOLERANCE`, which no capture can reach). The entry records
    the unreachable bound explicitly. Adding a second instrument-fed function
    without a fixture fails `make verify`. *Demonstrated, reverted, recorded.*
12. `make verify` is green at landing with no test skipped, no timeout raised, and
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
   **Resolved in part `[cross-review]`:** the sidecar location stands, but the
   question was incomplete — it asked where the *record* lives and never asked where
   the *assertion* lives. `packages/runtime` cannot import `apps/server`'s
   constants, so the identity assertion cannot live beside the fixture. F2c splits
   them and the question is closed on that basis.
2. **Is `32 * 2 ** -23` (≈ 3.815e-6) the right tolerance, or 41× more generous than
   the evidence?** The measured maximum excess is 9.25e-08 ≈ 0.78 float32 ulp at
   1.0; the chosen bound admits distributions 41× further out than anything
   observed, which cannot be exhibited by the instrument and therefore cannot be
   tested. The counter-argument is that ulp-count bounds should be derived from the
   candidate cap (≤ 20 values), not from an observed sample, and 32 is that
   reasoning. The draft said **"not this RFC's to decide — routed to whoever lands
   D56"**. **Escalated to blocking-for-`accepted` `[cross-review]`:** §5d shows E4's
   floor and this tolerance are mutually unsatisfiable — the floor requires a real
   fixture to cross every bound, and no capture can cross this one. Whichever way it
   is decided, the answer must be *stated as a derivation in a comment*, since an
   untestable bound with an unexplained constant is how `1e-9` got there in the
   first place. F4's register cannot be filled in honestly until it is answered.
3. **Does F3a's debt register need an owner and an expiry, or is monotonic shrink
   enough?** Monotonic shrink prevents growth but permits a permanent register (of
   ~111 entries, not the 45 the draft assumed — §5c). The `expression-census`
   precedent (Q4: *"a non-blocking CI job with no owner becomes noise"*) argues an
   unowned list decays into furniture, and the argument is **stronger at 111 than at
   45**. **Recommendation: no expiry, no owner, and a line in the register recording
   its size on the day it landed** — so a later reader can see whether it has moved.
   A deadline nobody agreed to is the failure mode the census already named.
4. **Should F1 apply to `apps/web` and `tests/browser/`?** The web suite tests
   presentation over API shapes, where "the real artifact" is a server response that
   no unit test can obtain. E3 covers it in principle (capture the response), but no
   capture mechanism exists for the web tier and inventing one is out of proportion.
   **Amended `[cross-review]`:** the draft asked only about `apps/web` and
   recommended *"out of scope, stated in §6 by omission"*. **Scope by omission is
   the D55 error** — §6 now states the denominator explicitly, and the answer is no
   longer "by omission" for `tests/browser/`, where **D61** already records a third
   member of this RFC's own family. The recommendation stands as *out of scope*, but
   as a **named** exclusion with a stated reason (D61's defect is an assertion
   against an implementation-forced constant, which F1 as written does not name —
   §6), not as silence.
5. **Does this RFC need a `docs/` page?** It amends no shipped subsystem, so there
   is nothing for `docs/` to describe canonically; the rule lives in the RFC and,
   once implemented, plausibly in `docs/development.md` beside `make verify`. **Owner
   call** — `docs/` is out of bounds for this draft either way.

## Changelog

- 2026-08-15: created.
- 2026-08-15: adversarial cross-review at `efdd7e0`. All §4 and §5 measurements
  independently re-run; the D54 narrowing, the three D56 residue claims, and the
  `verify-draft.json` / `verify-draft-engine.json` counterexample all confirmed.
  Corrections and additions: **E1's ownership criterion repaired** (from "same
  package" to "the change the assertion is about" — the draft's wording
  misclassified both `schemas/`-backed `$id` pins and F3a's own register); **F2a's
  "only green resolution is recapture" retracted** as false and F2b named as the
  verifying half; **F2c added** — `packages/runtime` cannot import `apps/server`,
  so acceptance criterion 3 was not implementable where open question 1 put the
  fixture; **§5c's missing-code count corrected 45 → 111** across seven emission
  forms (the draft reused a one-family figure for a seven-family walk, leaving the
  register 2.5× under-budgeted); **F3b added** after finding three codes disposed
  by `toThrow(/…/)` regex that the gate's quoted-substring predicate cannot see;
  **§5b's guard trigger moved from a filename convention over one file to a
  behavioural one**; **F4/§5d added** — E4's floor was the only rule in the RFC
  with no enforcing gate, which is where the in-scope set stopped one step short of
  preventing a repeat; **an unsatisfiability between E4's floor and
  `FLOAT32_POLICY_MASS_TOLERANCE` named**, escalating open question 2 to blocking;
  §6's denominator stated and **D61 / `tests/browser/` named rather than routed to
  D55**; **D64's deferral upgraded from assertion to measurement** (341 committed
  syzygy entries checked against `offlineQuery`'s synthesis formula — zero matches,
  and no guard preventing a future one); `SourcingIssue.code` named as a second
  unregistered vocabulary; register claim corrected (0.21/0.22 are implemented, not
  claimed) and `engine-request-contract.md` added as a textual landing-order
  neighbour; the §Deviations / §Motivation / §6 three-way contradiction about the
  D56 ledger correction cleared (`cb32a68` landed it).
