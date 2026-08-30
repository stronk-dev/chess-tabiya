# RFC: Theory↔drill current joins

- **Status:** draft — author repair in progress 2026-08-30 after the independent buildability return.
  [[D1879]]–[[D1886]] are repaired below; [[D1887]] remains an explicit owner decision. Fresh
  independent review is required after that decision is recorded; no implementation is authorised.
- **Author:** claude (on the [[D1310]] mandate read; [[D1330]] live-debt rank 5)
- **Created:** 2026-08-23
- **Design refs:** `design/05-in-run-experience.md:231` (the narrowing-only `∩` algebra) and `:236`
  (*"Theory-only, honest-empty and source-unavailable are first-class states"*);
  `design/03-product-breadth.md:293` (the Library surface — *"packs, games, positions, concepts,
  historical sources"*) and `:309` (the context-sensitive theory/evidence rail)
- **Exploration gate:** complete. `design/research/theory-drill-current-joins.md` (R8) landed
  2026-08-21 with an executable arm (`tools/r8-theory-drill-harness/audit.test.ts`) and a
  fixed-position contract prototype (`prototype.test.ts`), both re-run green at HEAD with
  byte-identical output. The semantic-authority question it depends on was settled separately by
  R4 (`design/research/theory-knowledge-pipeline.md`): exact + FTS beat every semantic arm on the
  fixed gold set and the semantic safety/abstention controls failed
- **Depends on:** the implemented shape library (`archive/shape-library.md`), the implemented
  principle-entry registry (`archive/claim-backing.md`), the implemented run-derivation table
  (`archive/adoption-wave-1.md`, migration 13), and the implemented repertoire-gap launch
  (`archive/repertoire-gap-finding.md`, migration 15) whose server-side atomic create this RFC
  copies. **Consumes** the implemented `rfc/runtime-opening-identity.md` (`44637013`) for the
  opening arm of §1.2
- **Parent / amends:** amends nothing. **Sibling of `rfc/review-map.md`** — that RFC owns the
  review surface and its per-row `Retry from here`; this RFC owns the applicability edge that
  surface consumes and must not compute for itself
- **Supersedes / superseded by:** —
- **Planning:** `planning/platform-alignment/theory-drill/` (`plan.md`, `o5-o6-handoff.md`)

```tabiya-claims
migration | position behind social-play | run_derivations.kind CHECK gains 'theory_launch' (storage.ts:3853; STRICT table — a SQLite CHECK edit requires a rebuild migration) plus applicability_identity_json and applicability_target_json columns with a kind/presence CHECK in the same rebuild
```

**Why exactly one claim, and why that one.** The applicability *result* is computed, never stored:
it is a read over the pack registry, the shape registry, the principle registry and the opening
catalogue, all of which ship. The *edge a launch leaves behind* is durable, and its home already
exists — `run_derivations` (`apps/server/src/storage.ts:3848-3856`) holds
`{derived_run_id, source_run_id, source_branch_id, source_node_id, kind, created_at}`, which is
the dossier's *"launch preserving source run/node → completed attempt links back to the source"*
arc with one field missing. Its `kind` column carries `CHECK (kind IN ('flip_sides'))` on a
`STRICT` table, and SQLite cannot alter a `CHECK` in place, so admitting a second kind is a
rebuild — the same cost `live-sources.md` claims for `imported_games.source_kind`.

**No run-schema lane.** The derivation is a row, not a snapshot field:
`schemas/drill_run.schema.json` has no origin, source or provenance member on `DrillRun` (its
required root keys are `schemaVersion, id, sessionKind, packId, packDigest, …`, `:7-11`), and
nothing in this RFC writes one. **No pack-schema lane**: reference modality (`present` /
`prospective`) landed at pack 0.18 and `feedbackClaim.principles` at 0.26 — this RFC *reads* both
correctly for the first time and adds no field. **No shape-entry, principle-entry or campaign
lane**, and **no `EVIDENCE_KINDS` member**: `opening_identity` is already a landed member and no
new sourcing record kind is produced.

## Summary

Tabiya stores four exact, reusable identities and cannot spend one of them. The server already
computes the reverse index a learner needs — `shapeRecommendations()` resolves encountered shapes
to the exact pack ids that name them (`apps/server/src/service.ts:1133-1136`) — and the client
renders that answer as `Find {packId}` and then calls `navigate("/play")`
(`apps/web/src/App.svelte:882`), which opens the generic pack list. The identity is computed,
displayed and discarded in one expression.

This RFC specifies the missing object: a **typed, abstaining applicability edge** from an admitted
evidence identity plus the current position to zero or more versioned theory entries and zero or
more playable pack targets. A source-bound launch is recomputed and admitted by the server so the
source run and exact firing node survive the launch; a Library start is an ordinary pack start and
does not manufacture a derivation.

Four findings shaped the specification rather than decorating it.

1. **The dropped pack id is not a lazy call — the route vocabulary has nowhere to put it.**
   `AppRoute` (`apps/web/src/lib/router.ts:12-18`) parameterizes exactly four things, all of them
   run or session ids; `/play` is a static string in a frozen table (`:24`). `routePath` cannot
   *express* a pack target, so `navigate("/play")` was the only reachable call. And a query-string
   workaround is a trap: `parseRoute` reads `location.pathname` only (`:39`) while `navigate`
   faithfully preserves `url.search` into history (`:117-119`), so a `?pack=` handoff would
   survive the URL bar and vanish at the parser. §2 adds path segments.

2. **The shipped derivation table assumes it will only ever hold one kind, in two places, and
   neither would fail loudly.** `#derivation()` (`storage.ts:1980`) reconstructs every row with a
   hard-coded `kind: "flip_sides"` and never reads `row.kind`; and the milestone producer at
   `service.ts:940` awards the learner-facing mark *"First opposite-side replay."* on
   `derivationFor(row.runId) !== undefined` — the existence of **any** derivation, not its kind.
   Widening the `CHECK` without §3.2 would silently tell learners they had played a side-flip they
   never played. That is a manufactured statement about the learner's own history, and it is the
   single most dangerous consequence of this RFC's migration.

3. **The `present` / `prospective` distinction is enforced in one place and ignored in the two
   that matter.** `pack-orchestrator.ts:50` correctly refuses a prospective reference when
   grounding a plan class. `service.ts:1135` matches on `shape.shape === id` alone, so a
   prospective reference is advertised as practice, and `service.ts:1124` suppresses on the same
   unfiltered set, so a countable attempt at a pack that names a shape *only* prospectively kills
   that shape's recommendation permanently. `docs/shape-library.md:48-50` says prospective
   references *"never fire, grade, or open authored feedback"*. Measured at HEAD, the fix is free:
   the two prospectively-referenced shapes are each also `present`-referenced by another pack, so
   shape coverage stays **21/25** either way (§1.3).

4. **The review "link form" the dossier asks for cannot exist as an evidence form, and should
   not.** `EvidenceForm` is a closed nine-member union (`packages/runtime/src/evidence-contract.ts:6`)
   with no `link` member, so the R8 harness's `reviewDeclaresTheoryOrDrillForm` probe searched for
   a token no consumer in the catalogue could ever have declared. §4.4 refuses to add one: forms
   are *renderings of evidence*, and an applicability door is an **action over a typed result** —
   the same category as `review-map.md`'s per-row `Retry from here`. What Review does need is the
   two *projections* it does not accept, which is a catalogue edit and not a vocabulary change.

## Motivation

### The debt, and why it is rank 5

[[D1330]]'s per-dossier classification of all 118 research artifacts found ten live-debt
dossiers; this is the fifth, summarized there as *"pack id dropped by `navigate("/play")`,
deferred twice to 'F7'"*. The two deferrals are real and both are in an accepted or drafted RFC:
`rfc/longitudinal-store.md:643` leaves *"the applicability join (theory/pack ids on each
observation)"* to *"F7's exact join"*, and `:594` records that [[D694]] measured zero runtime
reach for opening identity. `planning/platform-alignment/research-to-execution.md:178` records the
whole R8 question as `LANE OPENED` with `no RFC`. This document is that RFC.

The four defect and measurement rows the dossier landed are [[D692]] (the discarded pack id),
[[D693]] (prospective references offered as practice), [[D694]] (opening identity has no runtime
reach) and [[D695]]/[[D696]] (identity is stored but no workflow closes it; an exact position key
yields an identity *set*, not a label). All five are repaired or consumed by a numbered section
below.

### What is actually missing, measured at HEAD

The R8 harness re-runs green at HEAD with byte-identical `audit-output.md`. Its census:

| quantity | value |
|---|---|
| shape entries | 25 |
| pack→shape references | 44 (41 `present`, 3 `prospective`) |
| shapes with at least one pack target | 21/25 |
| shapes with at least one **`present`** pack target | 21/25 |
| pack→principle references | 82 across 12 identities |
| candidate-only opening-identity records | 52 across 9 candidates |
| authored-draft opening-identity records | 0 |

And its closure table records ten edges, of which **two** are present and **eight** absent. The
two that are present are the two that never reach a learner: pack→shape validation is a build-time
check, and the reverse index lives in a service method whose only caller throws the answer away.

This is not a content shortage and it is not an API shortage either. `api.shapes()` and
`GET /shapes/{id}` ship (`apps/web/src/lib/api.ts:786,984-990`; `apps/server/src/rest.ts:1000-1004`).
`PrincipleRegistry.list()` ships (`apps/server/src/principle-registry.ts:63`) with no route to
reach it. `DrillScreen.svelte` already takes an `onSelectPack` prop (`:99,:147`) and already uses
it — for the `variantOf` pack relation (`:938`) — while rendering `ShapePanel` two hundred lines
later (`:1230`) without passing it anything. Every part of the machine exists; nothing is wired to
anything.

### Why a typed edge and not search

R4 settled the authority question before this RFC existed: on a fixed gold set, exact + FTS
reached 97.7% recall@5 against semantic's 94.7%, and the semantic safety, abstention and artifact
controls **failed** (`planning/platform-alignment/theory-drill/o5-o6-handoff.md:9-11`). A ranking
over passages that resemble the position is not a claim that they apply to it. §1.5 makes that
structural rather than cultural: the result type has no field that could hold a score, a rank or a
sentence.

## Specification

### §1 The applicability result

#### §1.1 Shared identities, closed actions and two contexts

The opening payloads currently live in `apps/server/src/opening-catalogue.ts`, even though F1 names
them as public evidence payload types. Implementation moves the literal `OpeningCatalogueRef`,
`CurrentOpeningEndpoint` and `OpeningCatalogueMembership` declarations to
`packages/runtime/src/opening-identity.ts`; the server imports and re-exports those declarations.
There is no fourth applicability-only opening summary. The exact opening identity admitted here is
`Extract<CurrentOpeningEndpoint, {kind: "matched"}>`, including its factual ply, ECO, name and
catalogue operands.

`packages/runtime/src/applicability.ts` exports the remaining closed algebra:

```ts
export type ApplicabilityBasis =
  | "exact_shape_trigger" | "exact_opening_endpoint" | "anchored_claim" | "registered_principle";

export type ApplicabilityIdentity =
  | { readonly kind: "shape"; readonly entryId: string; readonly entryVersion: string }
  | { readonly kind: "opening";
      readonly endpoint: Extract<CurrentOpeningEndpoint, { readonly kind: "matched" }> }
  | { readonly kind: "principle"; readonly entryId: string; readonly entryVersion: string }
  | { readonly kind: "anchored_claim"; readonly packId: string; readonly packVersion: string;
      readonly claimId: string; readonly principles: readonly {
        readonly entryId: string; readonly entryVersion: string }[] };

export type TheoryAction =
  | { readonly kind: "open_shape_entry"; readonly entryId: string; readonly entryVersion: string }
  | { readonly kind: "open_principle_entry"; readonly entryId: string; readonly entryVersion: string }
  | { readonly kind: "open_opening_entry"; readonly positionKey: string;
      readonly catalogueDigest: string };

export type PackTargetVia =
  | { readonly kind: "shape_present"; readonly entryId: string; readonly entryVersion: string }
  | { readonly kind: "authored_claim"; readonly sourcePackId: string;
      readonly sourcePackVersion: string; readonly claimId: string };

export type ApplicabilityTarget =
  | { readonly kind: "theory"; readonly identity: ApplicabilityIdentity; readonly action: TheoryAction }
  | { readonly kind: "pack"; readonly targetId: string; readonly packId: string;
      readonly packVersion: string; readonly via: PackTargetVia };

export type ApplicabilityAbstention =
  | "no_identity" | "no_present_pack" | "candidate_only" | "source_unreadable";

export interface ApplicabilityView {
  readonly basis: ApplicabilityBasis;
  readonly identities: readonly ApplicabilityIdentity[];
  readonly targets: readonly ApplicabilityTarget[];
  readonly abstained: readonly ApplicabilityAbstention[];
}

export type ApplicabilityResult =
  | (ApplicabilityView & { readonly context: "run_node"; readonly source: {
      readonly runId: string; readonly branchId: string; readonly nodeId: string } })
  | (ApplicabilityView & { readonly context: "library" });
```

`identities` and `targets` are independently possibly-empty. Theory-only, drill-only, both and
neither are all valid results, which is `design/05-in-run-experience.md:236` expressed as a type.
The context union removes the old nullable-source contradiction: Library results cannot be passed
to the source-bound launch operation because they have no `source` member. Their pack actions use
the ordinary direct-start path in §4.3 and create no `run_derivations` row.

`targetId` is `sha256(canonicalizeJson({packId, packVersion, via}))`. It is a selector over a result
the server recomputes, not an authority token: a guessed or stale id has no effect unless the same
target is present in the recomputed result for the authorised node.

#### §1.2 Four join kinds, four different truth conditions

The dossier's §4 table is normative and its four rows are **not** flattenable into "related
content", because each row is true for a different reason:

| join | authority | this RFC |
|---|---|---|
| detected shape → shape entry | exact structural trigger plus the entry version that fired | ships (`shapeFirings`); §1.1 records `entryVersion` so a re-registered shape does not silently retarget |
| shape entry → pack | a **validated `present`** pack reference | §1.3 — the reverse index exists and is semantically loose |
| opening position → opening entry / pack | exact `CurrentOpeningEndpoint.kind === "matched"` plus its sealed catalogue reference | §1.4 — consumes implemented `runtime-opening-identity.md`; **no pack targets exist for it today** |
| authored claim / principle → theory / pack | exact registered ids plus a declared anchor | §1.6 — stored, never reversed |

The opening row deserves a correction to this RFC's own source. `theory-drill-current-joins.md:56-60`
records opening identity as *"a working sourcing primitive but not current learner evidence"*, and
that was true when it was written: `evidence-catalog.ts:781` (at HEAD) declares
`theory.opening_identity` at `sourcing: "build_time"` with `role: "source_record"` and the
limitation *"Authoring provenance only at F1; not a runtime guidance sentence."* Two days later
`rfc/runtime-opening-identity.md` was accepted and its implementation landed at `44637013`.
`theory.opening.current_endpoint@1` now resolves exact matches, exact absences and typed provider
abstentions from one compiled catalogue. This RFC consumes that literal payload and moves only its
declarations down to the shared runtime tier; it does not change the producer.

#### §1.3 `present` is required, and it costs nothing

`service.ts:1135` selects packs with
`normalizeShapeReferences(...).some((shape) => shape.shape === id)`. It gains
`&& shape.relation === "present"`. `service.ts:1124`, which builds the *suppression* set, gains
the same clause — the half [[D693]] did not name and the more damaging of the two, because a
suppression is permanent and invisible: a learner who attempts `anti-sicilian-najdorf-english-attack`
never sees `opposite-castling-race` recommended again, on the strength of a reference whose own
contract says it *"never fire[s], grade[s], or open[s] authored feedback"*
(`docs/shape-library.md:48-50`).

`ApplicabilityTarget`'s pack arm types `via.kind: "shape_present"`, so a prospective reference is
not merely filtered — it is unrepresentable as a target.

The cost is measured, not assumed. Both prospectively-referenced shapes
(`opposite-castling-race`, from two opening packs; `rook-4v3-same-side`, from one cross-phase
pack) are **also** `present`-referenced by a different pack, so shapes with at least one launchable
pack target stay at **21/25** after the filter. The three references leave three recommendation
sets slightly smaller and leave coverage untouched.

#### §1.4 Candidate transposition sets are not the runtime opening payload

[[D696]] measured 52 pre-runtime candidate records collapsing to 49 transposition keys. That
instrument answered a sourcing question; it is not the implemented producer. The runtime compiler
now refuses duplicate named endpoint keys and emits 3,810 unique endpoints plus 7,854 unnamed path
members. Applicability therefore carries the literal matched `CurrentOpeningEndpoint` arm, not the
obsolete `OpeningIdentityRef[]` invented by the first draft. A path-membership result never gains a
name and yields `candidate_only`; an exact absent result yields `no_identity`; a provider
abstention yields `source_unreadable`.

No display-specificity rule remains. The cited endpoint name is already a factual operand of the
exact producer, while descendant count is a separate membership fact and cannot select a label.

#### §1.5 What the result cannot hold

`ApplicabilityResult` has no score, similarity rank, confidence, generated explanation or raw
route. Its `basis`, actions and target provenance are closed unions. Factual payload operands remain
legal: opening ply/count fields and cited names describe what the registered producer found; they
do not grade a move. Web routes are derived from `TheoryAction` in the web tier and cannot be
smuggled into the shared result as a free-form URL.

This is the law-8 seal for this surface. Search may later rank passages *inside* an already
eligible identity set; it may not turn vocabulary resemblance into applicability, and it has no
representation here in which to try.

#### §1.6 The principle reverse index

82 pack→principle references across 12 identities are stored and never reversed: no surface finds
packs by principle, and no surface lists principles at all. A bare registered principle is a
`kind:"principle"` identity and can open its theory entry, but is **not** evidence that it applies
to the current position and produces no pack target. An exact authored `{packId, packVersion,
claimId}` occurrence is instead `kind:"anchored_claim"`; it may produce its source pack through
`via.kind:"authored_claim"` and retains the registered principle identities the claim names. This
split makes both criterion-5 fixtures constructible without pretending a browsed principle fired.

### §2 The route grammar

#### §2.1 Four new parameterized routes

`AppRoute` (`router.ts:12-18`) gains four members and `STATIC_ROUTES` (`:22-32`) is unchanged:

| route | path | meaning |
|---|---|---|
| `pack` | `/play/pack/{packId}` | open exactly this pack |
| `shape-entry` | `/library/shape/{shapeId}` | this theory entry, with its pack targets |
| `principle-entry` | `/library/principle/{principleId}` | this principle, with its anchored packs |
| `opening-entry` | `/library/opening/{positionKey}` | the exact named endpoint and catalogue source |

Each is parsed by the same shape as the existing `run` route (`:42-50`): a bounded regex, a
`decodeURIComponent` inside `try`, a non-empty check, and `not-found` on failure — never a throw.
Each gains a `routePath` arm (`:68-73`) so the target is expressible in the type that renders
links, which is the thing that did not exist.

The opening entry honestly renders zero pack targets today. That is not a reason to erase a live,
cited identity: `runtime-opening-identity` now ships, and `open_opening_entry` derives this route.
Path membership without an exact endpoint still has no route because it has no name to display.

#### §2.2 Query strings are refused, and the reason is a trap

`parseRoute` reads `location.pathname` only (`:39`), while `HistoryRouter.navigate` writes
`${url.pathname}${url.search}${url.hash}` into history (`:117-119`). A `?from=run:node` handoff
would therefore appear in the address bar, survive a copy-paste, and be discarded by the parser on
every navigation and every `popstate` — a defect that looks like it works. All applicability state
travels as path segments or through §3's server call; nothing this RFC adds reads `search`.

### §3 The durable edge

#### §3.1 `run_derivations` is the home, and a new table would be a mistake

The table (`storage.ts:3848-3856`) already carries the exact tuple the dossier's pipeline needs,
and — more importantly — it is already wired into four things a new table would have to re-earn:
account export (`storage.ts:1019-1022`), account deletion preview (`:1244-1248`), both run-deletion
paths (`:2082`, `:2137`), and the account-data inventory that classifies it as
`project` / `hard_delete` under `owned_runs` (`apps/server/src/account-data.ts:44`).
`derived_run_id` is the PRIMARY KEY, so a launched run has exactly one origin, which is correct
for a launch and is the reason a join table is not needed.

It gains one `kind` value and two canonical-JSON columns:

```sql
kind TEXT NOT NULL CHECK (kind IN ('flip_sides','theory_launch')),
applicability_identity_json TEXT,
applicability_target_json TEXT,
CHECK (
  (kind = 'flip_sides' AND applicability_identity_json IS NULL AND applicability_target_json IS NULL)
  OR
  (kind = 'theory_launch' AND applicability_identity_json IS NOT NULL AND applicability_target_json IS NOT NULL)
)
```

The JSON values are canonical serializations of the literal `ApplicabilityIdentity` and pack
`ApplicabilityTarget` unions. The table enforces presence by kind; the fail-closed reader parses
the exact unions, requires the target to be a pack target, recomputes `targetId`, and verifies that
its `via` arm is licensed by the stored identity. This deliberately duplicates one invariant at
two boundaries: SQL prevents impossible null combinations, while the typed parser prevents
well-shaped columns from laundering malformed or crossed semantic identities.

`RunDerivation` becomes a discriminated union rather than an interface with nullable members:

```ts
export type RunDerivation =
  | { readonly kind: "flip_sides"; readonly derivedRunId: string; readonly sourceRunId: string;
      readonly sourceBranchId: string; readonly sourceNodeId: string; readonly createdAt: string }
  | { readonly kind: "theory_launch"; readonly derivedRunId: string; readonly sourceRunId: string;
      readonly sourceBranchId: string; readonly sourceNodeId: string; readonly createdAt: string;
      readonly identity: ApplicabilityIdentity;
      readonly target: Extract<ApplicabilityTarget, {readonly kind: "pack"}> };
```

#### §3.2 Two shipped assumptions that a wider `kind` would break silently

Both must be repaired **in the same commit as the migration**, and both are asserted by acceptance
criterion 7.

- `storage.ts:1980` — `#derivation(row)` builds its result with a literal
  `kind: "flip_sides"` and never reads `row.kind`. Every `derivationFor()` and `derivationsFrom()`
  caller therefore receives `flip_sides` regardless of what is stored. The account-export path
  (`:1026`) does read the real column, so after a widening the two readers of one table would
  disagree — export honest, application mislabelled.
- `service.ts:940` — the milestone producer awards `first_flip_sides` with the sentence
  *"First opposite-side replay."* on `this.#storage.derivationFor?.(row.runId) !== undefined`.
  It tests existence, not kind. The first learner to launch a drill from a shape panel would be
  told they had flipped sides. This is a false statement about the learner's own history rendered
  as a durable mark, and it is a stricter failure than a mislabelled field.

`RunDerivation.kind` (`storage.ts:170`) is the single-member string-literal type
`"flip_sides"`; it widens to the two-member union, which makes the compiler locate the remaining
sites rather than leaving them to review.

#### §3.3 The migration

One rebuild migration, claimed as **a position behind `social-play`** and numbered
`STORAGE_VERSION + 1` at landing per the register's assign-at-landing rule. It rebuilds
`run_derivations` with the widened checks and two new columns, copies every existing row
with both applicability columns null, and restores `run_derivations_source`. It uses **literal** `CHECK` strings
and literal kind values, never the moving TypeScript union, per the migration-9 freeze lesson
recorded in the register.

No run-schema stamp: the run snapshot is untouched, so no frozen literal moves and no
`schema_version` filter is affected.

#### §3.4 Account export must not silently lose the new columns

`storage.ts:1019-1022` selects run-derivation columns by **explicit name** into the owned-run
export. Adding a column there is invisible to `ACCOUNT_TAGGED_RECORD_FIELDS`
(`account-data.ts:115-154`), whose closed field sets cover table-discriminated rows and not this
nested projection. Criterion 8 therefore asserts export completeness against a `PRAGMA
table_info(run_derivations)`-derived set rather than against a hand-written list, so a fourth
column added later fails the build instead of quietly leaving the learner's export.

#### §3.5 The source-bound launch is one authoritative server call

`startPack` (`apps/web/src/lib/session-controller.ts:241-262`) creates a run from the client and
has nowhere to record an origin. A client-side create followed by a link write can half-fail and
leave an origin-less run, which is precisely the identity loss this RFC exists to end.

The repo has solved atomic creation twice already, both times server-side and in one transaction:
`flip` (`service.ts:917`) and `createRepertoireGapRun` (`:928`), which write run, grant
and link inside a single `BEGIN IMMEDIATE` (`storage.ts:1933-1941`, `:1964`). This RFC adds the
third instance. The client supplies no identity bytes:

```http
POST /runs/{runId}/branches/{branchId}/nodes/{nodeId}/applicability-targets/{targetId}/launch
Content-Type: application/json

{}
```

The authenticated service re-reads the source run under `requireRead`, requires a role for which
`mayWrite(role)` is true, verifies the branch owns the node, rejects a live match, recomputes the
complete `context:"run_node"` applicability result from the stored FEN and current registered
producer versions, and selects the one pack target whose recomputed `targetId` equals the path
value. It then builds the run exactly as `startPack` does and persists run, grant and the exact
recomputed identity/target derivation in one transaction. The response is:

```ts
type LaunchApplicabilityResult = Readonly<{
  runId: string; writerId: string; run: DrillRun;
  derivation: Extract<RunDerivation, {kind:"theory_launch"}>;
}>;
```

The closed error image is `INVALID_REQUEST` (malformed ids/body or branch/node mismatch),
`RUN_NOT_FOUND`, `FORBIDDEN`, `MATCH_IN_PROGRESS`, `APPLICABILITY_STALE` (the requested target is
not in the recomputed view) and `STORAGE_FAILURE`. REST maps the existing codes as today and adds
`APPLICABILITY_STALE` as HTTP 409. The web client exposes the literal method and path and navigates
to `/play/run/{runId}` only from the 201 response. Crossed source, identity and target requests all
fail because no caller-supplied identity is accepted.

Library pack actions do **not** call this endpoint. They use the ordinary pack-start operation and
create no derivation; a browse has no source event to preserve.

`derivations(runId, principal)` (`service.ts:936`) already returns `{source, derived}` and needs
no signature change; it starts returning honest kinds once §3.2 lands.

#### §3.6 Progression policy — owner decision required

**Recommended ruling:** a completed countable attempt in a theory-launched pack counts exactly
like a completed countable attempt in the same directly-started pack. `derivation.kind` is durable
provenance and navigation context, not an exclusion from the attempt denominator. Following a
recommendation does not satisfy it by itself; only the existing countable-attempt write does.

This makes the user-visible loop literal: encounter a shape → choose practice → complete practice
→ the recommendation is satisfied. The alternative would show a completed rehearsal as still
unaddressed solely because of the door used to enter it. The implementation criterion must fixture
identical completed direct and theory-launched runs producing identical recommendation suppression,
and an abandoned/unpreserved theory launch producing none. This paragraph is a recommendation,
not an owner ruling; [[D1887]] keeps the RFC in draft until the owner accepts it or chooses an
origin-partitioned denominator.

### §4 The four surfaces

#### §4.1 Learn — every target, not `packIds[0]`

`App.svelte:882` renders `Find {item.packIds[0]}` and offers exactly one of N targets, then
discards it. It renders **every** target as its own launch action, each calling §3.5.

`shapeRecommendations()` must retain the evidence occurrence it currently throws away. Each
recommendation gains `anchors: readonly {runId, branchId, nodeId, ply}[]`. The producer collects
the exact `shapeFirings()` node for every branch, de-duplicates by the four fields, then orders by
`run.updatedAt DESC`, `runId`, `branchId`, `ply`, `nodeId`. The rendered recommendation uses the
first anchor only as the default action, while the complete ordered anchors remain in the payload.
The launch path includes that exact tuple and the server recomputes it; array order is therefore a
deterministic UX default, never provenance authority. A run with two branches and two firings must
retain all four distinguishable anchors.

Two silent bounds in the producer are declared rather than removed, because removing them is a
performance decision this RFC has no measurement for:

- `service.ts:1128` scans `this.#storage.list(principal.learnerId, 50, 0)` — the **50 most recent
  runs**, an undeclared window on which shapes count as "encountered".
- `service.ts:1137` returns `.slice(0, 10)`.

Both become named exported constants (`SHAPE_ENCOUNTER_RUN_WINDOW`, `RECOMMENDATION_LIMIT`) and
the surface states the window in the sentence it already renders, so *"you met this in N of your
preserved runs"* stops implying all of them.

#### §4.2 The shape panel's drill door

`ShapePanel.svelte` takes `entry`, `onClose` and `onInspect` (`:3-9`) — a correction to the
dossier, which recorded two props; `onInspect` (`:41`, *"Inspect trigger and sources"*) opens the
evidence inspector and is not a drill door. It gains one optional prop, `onLaunch`, and renders
one action per `ApplicabilityTarget` in its footer beside the existing inspect action.

`DrillScreen.svelte` already holds `onSelectPack` (`:99,:147`) and already spends it on the
`variantOf` relation (`:938`); it renders `ShapePanel` at `:1230` and passes it nothing but
`entry`, `onClose` and `onInspect`. Threading the applicability result through is the whole change
on this surface.

#### §4.3 Library — a pack open action and a theory catalogue

`App.svelte:1082` renders pack rows as inert list items (`<li>{pack.title} <small>{status}</small></li>`)
while `:1083` renders run rows as buttons — so the Library can open a run artifact and cannot open
a pack. Pack rows become launch actions to `/play/pack/{packId}`.

The Library gains the theory catalogue `design/03-product-breadth.md:293` names:

- **Shapes** — `api.shapes()` (`api.ts:786,984`) and `GET /shapes/{id}` (`rest.ts:1000-1004`)
  already ship; this is a surface with no server work.
- **Principles** — `PrincipleRegistry.list()` ships (`principle-registry.ts:63`) and is reachable
  only from inside authored feedback. It needs one REST route, `GET /principles`, mirroring
  `/shapes`, plus its client method.
- **Openings** — exact matched endpoints from the implemented runtime catalogue open through
  `opening-entry`; path membership without a named endpoint remains an honest empty action.

Each catalogue row carries its own applicability result, so a shape with no `present` pack renders
an honest *"no pack rehearses this yet"* — a first-class state, not a missing button. Four shapes
are in exactly that position today (`hanging-pawns`, `knight-vs-bishop`, `up-an-exchange`,
`vancura`), which makes the empty state the common case and not an edge.

#### §4.4 Review — the door, and the refusal of a `link` form

`review.story` (`evidence-catalog.ts:878` at HEAD) declares projections
`rules.pivotal.marker`, `theory.shapes.firing`, `run.record.consequence`,
`run.record.imported_result`, `rules.endgame.reading` and four `derived.story.*` rows; it accepts
no opening identity and no semantic transition event.

It gains `theory.opening_identity`'s runtime successor when
`runtime-opening-identity.md` implements, and it gains the F2 semantic transition event
projections. Both are ordinary catalogue edits with no register consequence.

It does **not** gain a `link` form, and this RFC refuses to add one. `EvidenceForm`
(`evidence-contract.ts:6`) is a closed union of nine *renderings* — `sentence`, `list`,
`timeline_marker`, `lit_squares`, `arrows`, `piece_halo`, `panel`, `audio`,
`machine_condition` — and every one of them answers "what does this evidence look like". A launch
is not a rendering of evidence; it is an action over a typed result, in the same category as
`review-map.md`'s per-row `Retry from here`. Adding `link` would also require an arm in
`MODULE_FORM_IMAGE` (`module-contract.ts:119-127`), where it would map to nothing, since no module
renders it.

The consequence for this RFC's source material is stated plainly in §Deviations: the R8 harness's
`reviewDeclaresTheoryOrDrillForm` probe tests for a token that is not in the vocabulary, so it was
structurally incapable of returning true, and its `false` result was correct for the wrong reason.

`review-map.md` owns the review surface; this RFC supplies the result it renders and computes
nothing about review priority, quotas or ordering.

### §5 Abstention

Four abstentions, each a distinct fact and none of them an error:

| reason | when | rendered as |
|---|---|---|
| `no_identity` | no exact trigger, key or anchor resolves at this position | nothing is offered; the surface is silent |
| `no_present_pack` | an identity resolves and no pack `present`-references it | theory-only, with the theory target live |
| `candidate_only` | an opening identity resolves against candidate records with no registered pack | the identity is shown; no launch is offered |
| `source_unreadable` | a registry is unavailable | the surface says the source is unavailable |

No abstention is ever replaced by a nearest match, a generic coach sentence or an engine line. A
result with empty `identities` and empty `targets` is a valid, renderable answer.

### §6 What this RFC does not carry, where it lives, and who owns it

Two things a reader might expect here are genuinely elsewhere, each with a named home and a named
owner — sequencing, not a scope cut.

1. **The external theory corpus.** An allow-listed, digest-addressed bundle of third-party theory
   text, its offline provenance compiler, and FTS discovery inside an eligible set is R4's
   subject, lives in `design/research/theory-knowledge-pipeline.md` ([[D1330]] live-debt rank 8),
   and is gated on **the O5 ruling, which is the OWNER's and is unmade**:
   `planning/platform-alignment/theory-drill/o5-o6-handoff.md:1-2` records O5 as *"ready"* and
   `:46-47` states that approving it *"opens F4's provenance compiler RFC. It does not yet open
   F7."* This RFC's identities are the ones the repo already registers — shapes, principles,
   anchored claims, and the pinned CC0 opening catalogue — none of which need O5.

2. **Opening theory prose and opening-linked packs.** The exact runtime opening projections now
   ship. What still lives elsewhere is prose over those identities (`theory-knowledge-pipeline`)
   and authored pack applicability (`pack-capability-contract` plus content). This RFC renders the
   exact endpoint and an honest empty pack set; it does not invent either missing consumer.

Nothing else in the dossier's ask is deferred. The four join kinds, the four surfaces, the durable
return link, the route grammar and every abstention are specified above.

## Deviations from design

- `design/03-product-breadth.md:293` lists the Library's contents as *"packs, games, positions,
  concepts, historical sources"*. §4.3 ships packs, shapes and principles and leaves positions and
  historical sources unaddressed; that is a surface this RFC does not complete, not a design
  disagreement, and no design-tier edit is proposed (law 5).
- `design/research/theory-drill-current-joins.md:15-16` cites `service.ts:812-827` and
  `App.svelte:674-677,825-831`. Both files have moved: the producer is `service.ts:1119-1138` and
  the discarding action is `App.svelte:882`. The findings reproduce exactly; only the addresses
  drifted, and every citation in this RFC is re-derived at HEAD.
- `theory-drill-current-joins.md:79-80` records `ShapePanel` as accepting *"only `entry` and
  `onClose`"*. It accepts three props (`ShapePanel.svelte:3-9`); the third, `onInspect`, opens the
  evidence inspector. The substantive claim — no related-pack input and no drill action — stands.
- `theory-drill-current-joins.md:88-90` asks Review to *"declare a theory/drill link form"*. §4.4
  refuses: `link` is not a member of `EvidenceForm` and forms are renderings, not actions. The
  underlying need — Review cannot reach the identities — is met by the projection edits instead.
- The dossier's denominator is the R8 harness's filtered corpus of **50** packs;
  `content/drafts/` holds **56** pack documents, the difference being six `.browser.` fixtures the
  harness excludes (`audit.test.ts:22`) and `rfc/training-mode-variants.md` counts. Neither
  instrument is wrong about its own filter. Per [[D1240]] no criterion in this RFC asserts either
  integer: criterion 1 asserts set-equality against a re-run.

## Acceptance criteria

1. **The census is a re-run, not a number** ([[D1240]]). `pnpm exec vitest run --config
   tools/r8-theory-drill-harness/vitest.config.ts` regenerates `audit-output.md`; the shape ids
   with at least one `present` pack target in the compiled applicability index are **set-equal** to
   the set that re-run reports. `21/25`, `44` and `41` are baked only as drift tripwires.
   *Negative: an implementation that hard-codes the shape list passes the integers and fails
   set-equality when a pack is authored.*
2. **A prospective reference cannot become a target, in either direction.** Against a fixture
   learner: `opposite-castling-race` recommends only the pack that `present`-references it, and a
   countable attempt at a pack that names a shape **only** prospectively does **not** suppress that
   shape's recommendation. *Negatives: the HEAD code fails both arms — `service.ts:1135` fails the
   first and `service.ts:1124` the second; and a `ApplicabilityTarget` literal carrying
   `relation: "prospective"` does not typecheck.*
3. **The pack id and exact firing survive the action.** From the Learn recommendation list,
   activating every pack target opens a run whose `packId` equals the target's; a fixture with two
   branches and two firings retains four anchors and the chosen source tuple reaches the derivation.
   *Negative: `navigate("/play")` and a recommendation containing only `runIds` both fail.*
4. **The route grammar can express every target.** `routePath` accepts `pack`, `shape-entry`,
   `principle-entry` and `opening-entry` and round-trips through `parseRoute` for ids containing `/`, `%`, spaces and
   non-ASCII. A malformed id yields `not-found` and never throws. *Negative: a target expressed as
   `/play?pack=x` round-trips to `{name:"play"}` with the pack lost — asserted as a red fixture so
   the `search` trap at `router.ts:39` cannot be reintroduced.*
5. **The result abstains four ways and never substitutes.** Fixtures reproduce the R8 prototype:
   `shape:carlsbad` yields its versioned entry and two `present` pack targets;
   `shape:hanging-pawns` yields its entry and **zero** targets with `no_present_pack`; an exact
   `{packId, claimId}` yields registered principles and its source pack; a bare principle yields
   theory targets and **no** pack targets; a claim-anchored principle yields its exact source pack;
   an exact named opening endpoint yields its literal implemented payload and zero launchable packs;
   unnamed path membership yields `candidate_only`. *Negative: any fixture in which an empty target list is
   replaced by a nearest-match pack fails.*
6. **Opening identity has one shared authority.** The server producer imports the runtime
   `CurrentOpeningEndpoint` declaration and applicability carries its matched arm without a local
   summary type. Exact absence, unnamed membership and typed abstention remain distinct. *Negative:
   declaring `OpeningIdentityRef` in applicability or selecting a descendant name from membership
   fails the type/contract fixture.*
7. **A widened `kind` cannot lie about what the learner did.** After the migration:
   `derivationFor()` on a `theory_launch` row returns `kind: "theory_launch"` (fails at HEAD —
   `storage.ts:1980` returns a literal), and a learner whose only derivation is a `theory_launch`
   has **no** `first_flip_sides` mark (fails at HEAD — `service.ts:940` tests existence).
   *Negative: both arms are asserted as red fixtures against the pre-repair code, because a green
   suite that never had a second kind proves nothing.*
8. **Every derivation column reaches account export.** The owned-run export's derivation columns
   are **set-equal** to `PRAGMA table_info(run_derivations)`. *Negative: adding another column
   without editing `storage.ts:1019-1022` fails the build rather than silently dropping out of the
   learner's export.*
9. **The launch is authoritative, atomic and source-bound.** The authenticated real REST/client
   path recomputes applicability from the stored source node and accepts only a recomputed
   `targetId`; crossed source, branch, node and target fixtures fail with the closed error image.
   With the derivation insert forced to fail, no `drill_runs` row commits. *Negative: accepting an
   identity or target object from the client fails this criterion even if the transaction is atomic.*
10. **The migration is literal and reversible in reading.** The rebuild's `CHECK` string and kind
    values are string literals in the migration body, not references to the TypeScript union, and
    every pre-existing row survives with both applicability columns null and its original
    `kind`/`source_*`/`created_at` bytes. *Negative: a migration body interpolating
    `RunDerivation["kind"]` fails review under the migration-9 freeze rule the register records.*
11. **Durable derivations are a checked union at both boundaries.** SQL refuses the two impossible
    null combinations; the reader refuses unknown kinds, malformed/non-canonical JSON, a non-pack
    target, a target-id mismatch and a `via` arm not licensed by the identity. Account restore and
    export exercise the same parser. *Negative: a double-cast malformed row still fails at runtime.*
12. **No evidence form is added.** `EvidenceForm` still has nine members and `MODULE_FORM_IMAGE`
    still has seven arms after this RFC lands. *Negative: a `link` member fails, and it fails in
    `module-contract.ts` as well, because it maps to no module form.*
13. **Review reaches the identities it could not reach.** `review.story`'s projection list contains
    the semantic transition-event projections and the runtime opening projections, and every
    projection it names resolves in the compiled manifest. Runtime opening identity is implemented,
    so this criterion runs at landing rather than carrying an honestly-red discharge.
14. **The declared bounds are declared.** `SHAPE_ENCOUNTER_RUN_WINDOW` and
    `RECOMMENDATION_LIMIT` are exported constants, the recommendation sentence names the window,
    and a fixture with 51 preserved runs renders a sentence whose count matches the window rather
    than the corpus. *Negative: the HEAD sentence — *"in N of your preserved runs"* over a silent
    50-run scan — fails.*
15. **The result cannot carry ranking/editorial authority.** A type/AST test refuses `score`,
    `rank`, `confidence`, `explanation`, `sentence` and raw route/URL fields on applicability's own
    types while permitting the factual numeric/string operands of registered payloads. *Negative:
    `score:number` and `route:string` fail; `observedPly:number` inside `CurrentOpeningEndpoint`
    passes.*
16. **Library and source-bound starts cannot be confused.** A `context:"library"` result has no
    source and starts a pack without a derivation; only `context:"run_node"` can call the launch
    endpoint. *Negative: passing a Library result to the source launch does not typecheck.*
17. **Progression follows the owner ruling.** If §3.6's recommendation is approved, identical
    completed countable direct and theory-launched attempts suppress the same recommendation while
    an abandoned/unpreserved launch suppresses nothing. If the owner chooses partitioning, this
    criterion is replaced with the exact ruled denominator before acceptance; it may not remain
    conditional at implementation.
18. **The principle catalogue is reachable.** `GET /principles` returns the registry's list
    (`principle-registry.ts:63`) and the Library renders it. *Negative: a catalogue built by
    re-reading `content/principles/` from the client fails; the registry is the single reader.*

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | shared opening declarations, `packages/runtime/src/applicability.ts`, the server index, the four routes, the launch endpoint, the migration and the four surfaces | codex | this RFC's implementing commit | |
| D2 | The two single-kind repairs at `storage.ts:1980` and `service.ts:940`, landing in the same commit as the migration | codex | this RFC's implementing commit | |
| D3 | The opening arm of §1.2 and shared payload types from implemented `runtime-opening-identity.md` | codex | this RFC's implementing commit moves declarations without changing producer bytes | prerequisite landed at `44637013`; declaration move pending |
| D4 | The O5 source/index posture ruling that opens the external theory corpus lane | OWNER | `planning/platform-alignment/theory-drill/o5-o6-handoff.md` | |
| D5 | The O6 stable-primitive and re-authoring-budget ruling that R8 named as a prerequisite for authoring against this contract at scale | OWNER | `planning/platform-alignment/theory-drill/o5-o6-handoff.md` | |
| D6 | The line-number and prop-list errata on `design/research/theory-drill-current-joins.md` (§Deviations, items 2 and 3) | claude | that dossier's erratum lines | |
| D7 | Whether the R8 harness's `reviewDeclaresTheoryOrDrillForm` probe is corrected or retired, given that it searches for a token outside `EvidenceForm` | claude | `tools/r8-theory-drill-harness/audit.test.ts` | |
| D8 | Review's consumption of the applicability result — which rows carry a door and in what priority | review-map | `rfc/review-map.md` | |
| D9 | Positions and historical sources in the Library catalogue (`design/03-product-breadth.md:293`) | claude | `design/BACKLOG.md` row | |

## Open questions

1. **OWNER — does a completed theory launch count toward progression?** §3.6 recommends yes:
   only the completed countable attempt satisfies the recommendation, exactly as a direct start;
   derivation origin remains provenance and does not alter the denominator. This is
   acceptance-blocking after [[D1887]] and must be answered before fresh review.
2. **Should the Learn surface offer every pack target, or the nearest one?** §4.1 offers all,
   because `packIds` is already computed and hiding N−1 of them is the defect this RFC exists to
   fix in miniature. The alternative — one target chosen by a declared rule — needs a rule, and no
   measurement supports one. Not acceptance-blocking; criterion 3 asserts that no target is
   *unreachable*, not that all are rendered at once.
3. **Does the 50-run encounter window want to be larger?** §4.1 declares it rather than changing
   it, because the scan reads and parses every run snapshot in the window and nothing has measured
   that cost. If the honest sentence *"in N of your last 50 preserved runs"* reads badly to the
   owner, the alternative is a projection over `attempts` rather than a snapshot scan — a
   materially different producer, and a separate lane.

## Ledger rows

Proposed — ids assigned at landing; head was **D1354** at drafting.

- 🐞 **A widened `run_derivations.kind` would make the product state a falsehood about the
  learner's own history.** `service.ts:940` awards the mark *"First opposite-side replay."* on
  `derivationFor(runId) !== undefined` — the existence of any derivation, not its kind — and
  `storage.ts:1980` rebuilds every row with a hard-coded `kind: "flip_sides"` while the export path
  at `:1026` reads the real column. The table has shipped single-kind since migration 13, so
  neither has ever been wrong; both become wrong on the first row of a second kind. Repaired here
  (§3.2, criterion 7). The class — *a closed vocabulary of one, read as if it were the only member*
  — is worth a sweep beyond this table.
- 🐞 **A prospective shape reference permanently suppresses a recommendation it was never
  eligible to satisfy.** [[D693]] named the offer half (`service.ts:1135`); the suppression half
  (`service.ts:1124`) is the same missing `relation` filter on the set of already-attempted shapes,
  and it is worse, because an offer is visible and a suppression is not. Fixed in §1.3.
- 🐞 **`parseRoute` ignores `location.search` while `navigate` preserves it.** `router.ts:39`
  parses `pathname` only; `:117-119` writes `pathname + search + hash` into history. Any future
  query-string state will appear in the address bar, survive copy-paste, and be silently discarded
  at every parse — a defect shaped like a working feature. This RFC routes around it (§2.2) and
  does not fix it; either the parser reads `search` or the router refuses to write it.
- 🐞 **`review.story`'s missing "link form" was unfalsifiable.** The R8 harness probes
  `forms: [...]` for `"link"` (`audit.test.ts:73`), and `EvidenceForm`
  (`evidence-contract.ts:6`) is a closed nine-member union that has never contained it, so the
  probe could not have returned true for any consumer in the catalogue. The finding it stood for is
  real; the instrument measured the wrong thing. D7.
- 📊 **Requiring `present` costs zero shape coverage.** Both prospectively-referenced shapes
  (`opposite-castling-race` from two opening packs, `rook-4v3-same-side` from one cross-phase pack)
  are also `present`-referenced elsewhere, so shapes with at least one launchable pack target
  remain **21/25** after the filter — the fix removes three targets and no coverage.
- 📊 **The authored-draft pack corpus is 56 documents, not 50.** The R8 harness excludes six
  `.browser.` fixture packs (`audit.test.ts:22`); `rfc/training-mode-variants.md` counts all 56.
  The six carry no shapes and no claims, so every R8 reference count is unaffected and only the
  denominator moves. Two instruments in this repo report different pack totals for defensible
  reasons, which is exactly why [[D1240]] forbids asserting either.
- 💡 **`PrincipleRegistry.list()` ships with no route to it.** `principle-registry.ts:63` returns
  the sorted summary list and is reachable only from inside authored feedback, while the parallel
  shape registry has `GET /shapes` (`rest.ts:1000`). One route closes a catalogue that has existed
  since `claim-backing` landed. §4.3, criterion 15.
- 💡 **`DrillScreen` already has the drill door and spends it on one relation.** `onSelectPack`
  (`DrillScreen.svelte:99,147`) is used only for `variantOf` (`:938`) and is not passed to the
  `ShapePanel` rendered at `:1230`. The machinery for §4.2 is present in the same component; only
  the wire is missing.

## Changelog

- 2026-08-30: author repair for [[D1879]]–[[D1887]]. The draft now reuses the literal implemented
  opening payload, splits bare principles from claim occurrences, replaces raw routes with closed
  actions, separates Library starts from source-bound launches, accepts only a recomputed target id
  through a literal REST/client operation, retains exact firing anchors, and validates durable
  derivations as a SQL-and-runtime discriminated union. [[D1887]] remains owner-pending on the
  explicit §3.6 recommendation; fresh review and implementation remain blocked.
- 2026-08-27: returned by independent buildability review on [[D1879]]–[[D1887]]. The proposed
  opening type has no definition at the runtime/server boundary; criterion 14 contradicts both the
  raw route field and the implemented opening payload; the principle union cannot represent its
  bare-principle or claim→pack fixtures; client-supplied launch provenance is not authoritative;
  Library has no source for the required derivation; the launch has no wire contract; persisted
  derivation validity is not structural; Learn discards the firing anchor; and progression effects
  remain an owner/product decision. Exact return:
  `planning/platform-alignment/theory-drill/independent-buildability-review-2026-08-27.md`.
- 2026-08-23: created. Drafted from `design/research/theory-drill-current-joins.md` as [[D1330]]'s
  rank-5 live debt, with every claim re-derived at HEAD. Four findings changed the specification:
  the route vocabulary cannot express a pack target (§2), the shipped derivation table assumes a
  single kind in two unguarded places (§3.2), the `present` filter is missing from the suppression
  set as well as the offer set (§1.3), and a review "link form" is not addable because
  `EvidenceForm` types renderings and not actions (§4.4). Four corrections to the source: two
  citation drifts, one stale prop list, one superseded verdict — the opening arm's *"no runtime
  reach"* is answered by `runtime-opening-identity.md`, accepted two days after the dossier landed.
