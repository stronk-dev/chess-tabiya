# RFC: Runtime opening identity

- **Status:** draft — factual source-pin amendment 2026-08-23, returned for independent
  cross-review before implementation. The first implementation fetch reproduced four source
  SHA-256 values but proved the accepted `b.tsv` pin was a transcription error: upstream commit
  `4b8622759e7ae6f93f011cc6c83a3823401ab45e`, GitHub blob
  `c4c7f890f471eb7106df6327356d4f1e3a5a262f`, the older source register and its executable fetcher
  all yield `310f0997d5a26ac6c9abfabac028e47e78f24356a6ba322cfffbf8f5a3f88d25`. D1052 records the
  failed acceptance premise; the D894 README is corrected. *(Prior status: accepted — 2026-08-23,
  by claude as register owner on the buildability test, after
  an independent cross-review that re-derived 22 claims and failed 9, two of them blocking.
  **`vendor/` does not exist**, so §1.1's present-tense claim that a clean checkout rebuilds
  without a network request was false — the only reader fetches from `raw.githubusercontent.com`
  (`openings.ts:97`); restated as the **first implementation obligation**, with the five SHA-256
  values pinned. Criterion 2's shared-parser rule was **unsatisfiable at HEAD**: `parseRows` is
  module-private while `normalizeOpeningPgn` is exported, so a compiler could only satisfy it by
  duplicating the row parsing the criterion forbids — exporting it is now an obligation. §1.2
  never said path keys **exclude the initial position**, the omission that decides whether
  3,810/7,854 reproduce at all, which is why criterion 1 now also asserts the **2,023** maximum
  descendant count. And criterion 14's 2 ms p95 **could not fail** — a linear scan of all 7,854
  keys fits inside it — now 50 µs p95 plus a size-independence assertion. Re-derived clean:
  `CHESS_OPENINGS_COMMIT` byte-exact, 3,810 / 7,854 / 2,023 exact, and 401 of 6,991 recomputing
  to 5.7%. *(Prior line for history: draft 2026-08-23 — executes Semantic Collectors discharge D3
  from completed D894 research; independent buildability review required before acceptance.)*)
- **Author:** codex, on the D717 evidence-foundation routing and D743/D894
- **Created:** 2026-08-23
- **Design refs:** `design/03-product-breadth.md` theory/Review/bot surfaces;
  `design/05-in-run-experience.md` §3b (validated evidence, never invented recommendation);
  `design/04-content-strategy.md` (opening applicability and source identity)
- **Exploration gate:** complete in `design/research/runtime-opening-identity.md` and
  `tools/d894-opening-runtime-harness/`; Wave-C C3 records the answered gate in
  `planning/evidence-foundation-ux/wave-c-foundation-closure.md`
- **Depends on:** implemented F1 evidence manifest (`rfc/archive/evidence-contract-manifest.md`),
  the shipped `transposeKey`, and the already-pinned Lichess chess-openings source in
  `apps/server/src/sourcing/openings.ts`
- **Parent / amends:** supplies the runtime adapter split out of `rfc/tactical-collectors.md`
  §3.15 and discharges `rfc/semantic-collectors.md` D3; it does not amend either collector
- **Supersedes / superseded by:** —
- **Planning:** `planning/runtime-opening-identity/` once accepted/implementing

```tabiya-claims
none
```

**Why `none`.** This RFC adds three derived/catalog projections and a private runtime artifact;
it changes no pack, run, shape-entry or principle-entry schema, no evidence-kind member and no
database table. The catalogue artifact is produced and consumed inside the server package and is
not an exported shared schema. Its source commit and input/output digests are data provenance, not
a shared resource version. If another package begins reading the artifact directly, that change
must first register its schema as a shared resource rather than treating this explanation as a
permanent exemption.

## Summary

Compile the repository's pinned CC0 Lichess opening catalogue into one deterministic local lookup
artifact, then expose three separate facts:

1. `theory.opening.current_endpoint@1` — the current position exactly equals one named catalogue
   endpoint, or honestly does not;
2. `theory.opening.catalogue_membership@1` — the current position occurs somewhere on one or more
   catalogue paths, with a candidate count but no chosen descendant name;
3. `derived.opening.deepest_reached@1` — a recorded history visited one or more exact named
   endpoints, with the deepest visited endpoint and all source inputs retained.

The split is the feature. The D894 population measured 3,810 unique named endpoints and 7,854
all-prefix keys, but endpoint reach is only 401/6,991 imported positions (5.7%), and carrying the
last name becomes stale in 108/108 games. Therefore no live “sticky opening” exists. “No named
endpoint,” “not on a catalogue path,” and “out of book” are three different statements; this RFC
implements the first two and refuses the third.

No LLM, FTS search or semantic similarity participates in applicability. No opening name becomes
advice, a move prior, a grade or theory prose. Bots may later consume a separate book-policy
projection; this identity never selects a legal move.

## 1. Source and artifact

### 1.1 Frozen input

The compiler accepts exactly five local files, `a.tsv` through `e.tsv`, for
`lichess-org/chess-openings` commit
`4b8622759e7ae6f93f011cc6c83a3823401ab45e` (`CHESS_OPENINGS_COMMIT`). Runtime never fetches the
network. The compiler records:

- source id `lichess-chess-openings`;
- commit and `CHESS_OPENINGS_RETRIEVED_AT`;
- CC0-1.0 licence;
- each relative filename, byte count and SHA-256;
- compiler implementation digest and canonical output digest. `compilerDigest` is SHA-256 over
  the compiler's declared repo-relative source-file list, sorted by path, with each path and its
  raw bytes length-delimited; an undeclared helper import fails the compiler-source closure test.

**The vendoring is this RFC's first implementation obligation, not an existing fact.** `vendor/`
does not exist at drafting HEAD, and the only code path that reads these files today fetches them
over the network at authoring time (`apps/server/src/sourcing/openings.ts:97` builds a
`raw.githubusercontent.com` URL). The implementation therefore *adds*
`vendor/chess-openings/4b8622759e7ae6f93f011cc6c83a3823401ab45e/` containing the five TSVs and the
CC0-1.0 licence notice, after which a clean checkout can rebuild and verify the artifact without a
network request or an operator-supplied directory. The five SHA-256 values to match are frozen at
`tools/d894-opening-runtime-harness/README.md:10-16` — **not** in the D894 dossier, which only
points at them — and the compiler test reads them from there. Source refresh is an explicit later
update, never an implicit fetch during install, CI or server start.

Input parsing reuses the sourcing emitter's own parsers; two independent parsers are forbidden. Both
halves are named because only one of them is exported today: the PGN half is
`normalizeOpeningPgn` (`openings.ts:46`, already exported, already returning one `{uci, san, fen}`
per played move), and the TSV row half is `parseRows` (`openings.ts:36`), which is **module-private
at HEAD and must be exported** — otherwise the compiler necessarily re-implements it and fails
criterion 2 for a reason no symbol names. `parseRows` also fixes the header contract this section
otherwise leaves implicit: the first line must be exactly `eco\tname\tpgn`. Each row must contain
one ECO, one non-empty name and one legal non-empty mainline from the standard initial position.
Any malformed row refuses the entire build.

### 1.2 Private canonical artifact

The artifact contains two sorted tables and its provenance:

```ts
interface RuntimeOpeningCatalogue {
  readonly source: {
    readonly id: "lichess-chess-openings";
    readonly commit: typeof CHESS_OPENINGS_COMMIT;
    readonly retrievedAt: typeof CHESS_OPENINGS_RETRIEVED_AT;
    readonly licence: "CC0-1.0";
    readonly files: readonly {
      readonly name: "a.tsv" | "b.tsv" | "c.tsv" | "d.tsv" | "e.tsv";
      readonly bytes: number;
      readonly sha256: string;
    }[];
    readonly compilerFiles: readonly { readonly path: string; readonly sha256: string }[];
    readonly compilerDigest: string;
  };
  readonly namedEndpoints: readonly {
    readonly key: string;
    readonly eco: string;
    readonly name: string;
    readonly sourcePly: number;
    readonly sourceFile: string;
    readonly sourceRow: number;
  }[];
  readonly pathMembership: readonly {
    readonly key: string;
    readonly descendantEndpointCount: number;
  }[];
  readonly digest: string;
}
```

Both tables sort by `key`; file provenance sorts `a` through `e`. The digest is SHA-256 of the
canonical object excluding its own `digest` field. Object-key order and input-file enumeration
order cannot change the output bytes.

The compiler refuses duplicate named endpoint keys, even if the duplicate spelling happens to be
equal. D894 measured zero duplicates; making uniqueness executable prevents a later source update
from silently introducing a tie policy.

**`pathMembership` is keyed on positions reached *after* at least one move; the standard initial
position is never a path key.** This is not a detail — it is the reason the measured numbers are
7,854 and 2,023 rather than 7,855 and 3,810. The D894 instrument pushes a key only after playing
each mainline move (`tools/d894-opening-runtime-harness/opening-runtime.test.ts:42-47`), and
`normalizeOpeningPgn` has the same shape, so an implementer who seeds the start position gets both
counts wrong and fails criterion 1 without the spec ever having told them why. A row's own endpoint
key **is** among its path keys, so `descendantEndpointCount` counts named endpoints at or below the
key — including the key itself when the key is an endpoint — and is never zero for a member. Prefix
rows collapse repeated visits within one source line (`new Set(row.pathKeys)`) before counting.

The ordinary runtime image receives only this compiled artifact, not raw TSV inputs, candidate
packs or authoring sidecars. A packaging fixture rejects absolute paths and any field not in the
closed private type.

### 1.3 Load and availability

The server loads the artifact once into immutable maps. Missing, malformed or digest-mismatched
artifacts produce a typed unavailable catalogue:

```ts
type OpeningCatalogueAvailability =
  | { readonly kind: "available"; readonly catalogue: CompiledOpeningCatalogue }
  | { readonly kind: "unavailable";
      readonly reason: "artifact_missing" | "artifact_invalid" | "digest_mismatch" };
```

The payload types below share these closed references:

```ts
interface OpeningCatalogueRef {
  readonly sourceId: "lichess-chess-openings";
  readonly commit: typeof CHESS_OPENINGS_COMMIT;
  readonly artifactDigest: string;
}

interface OpeningCatalogueUnavailable {
  readonly kind: "abstained";
  readonly projectionId:
    | "theory.opening.current_endpoint@1"
    | "theory.opening.catalogue_membership@1";
  readonly reason: "artifact_missing" | "artifact_invalid" | "digest_mismatch";
}

interface DeepestOpeningAbstention {
  readonly kind: "abstained";
  readonly projectionId: "derived.opening.deepest_reached@1";
  readonly reason: "input_abstained";
}
```

The server still starts. `/capabilities` reports the producer unavailable with the exact reason;
all three projections abstain. It must not fall back to an online request, fuzzy name search or a
last-known label.

## 2. Projection contracts

All position keys use the shipped `transposeKey`. Every result carries catalogue source id,
commit and artifact digest. The projection version changes if its meaning or operands change; a
new source commit alone produces a new artifact digest and measured coverage, not a dishonest
change to `@1` semantics.

### 2.1 Current named endpoint

```ts
type CurrentOpeningEndpoint =
  | {
      readonly kind: "matched";
      readonly projectionId: "theory.opening.current_endpoint@1";
      readonly positionKey: string;
      readonly observedPly: number;
      readonly eco: string;
      readonly name: string;
      readonly sourcePly: number;
      readonly catalogue: OpeningCatalogueRef;
    }
  | {
      readonly kind: "absent";
      readonly projectionId: "theory.opening.current_endpoint@1";
      readonly positionKey: string;
      readonly observedPly: number;
      readonly reason: "no_named_endpoint";
      readonly catalogue: OpeningCatalogueRef;
    }
  | OpeningCatalogueUnavailable;
```

`observedPly` comes from the caller's exact history, while `sourcePly` describes the catalogue
line. They may differ under transposition and may never be substituted for one another. Absence is
a fact about this named-endpoint index only. It cannot render “out of book.”

Grounding is `cited_theory`, exactness `exact`, answer content `fact | theory`, forms
`sentence | list | panel`, and abstention reasons are the three availability reasons.

### 2.2 Current catalogue-path membership

```ts
type OpeningCatalogueMembership =
  | {
      readonly kind: "member";
      readonly projectionId: "theory.opening.catalogue_membership@1";
      readonly positionKey: string;
      readonly observedPly: number;
      readonly descendantEndpointCount: number;
      readonly catalogue: OpeningCatalogueRef;
    }
  | {
      readonly kind: "absent";
      readonly projectionId: "theory.opening.catalogue_membership@1";
      readonly positionKey: string;
      readonly observedPly: number;
      readonly reason: "no_catalogue_path";
      readonly catalogue: OpeningCatalogueRef;
    }
  | OpeningCatalogueUnavailable;
```

The member form carries no ECO or opening name. One prefix key had 2,023 descendant lines in D894;
selecting any of them would manufacture applicability. Grounding is `cited_theory`, exactness
`exact`, answer content `fact`, and forms `list | panel` only. It has no ordinary sentence renderer
until a learner module separately proves why membership alone is useful.

### 2.3 Recorded position source

The existing run record contains exact node FENs, but the F1 manifest currently declares only a
move narrative whose operands omit FEN. Add the narrow source projection rather than smuggling
position bytes through `run.record.move@1`:

```ts
interface RecordedPosition {
  readonly projectionId: "run.record.position@1";
  readonly nodeId: string;
  readonly ply: number;
  readonly fen: string;
}
```

It belongs to the existing `run.record` producer with grounding `recorded_run`, exactness `exact`,
answer content `fact`, forms `list | panel | machine_condition`, and operands `nodeId | ply | fen`.
It is inspector-only and is not itself a learner sentence.

### 2.4 Deepest named endpoint reached

Input is an ordered recorded history of `{nodeId, ply, fen}`. The derivation calls §2.1 for every
entry against one exact artifact identity and retains the complete matched subset:

```ts
type DeepestOpeningReached =
  | {
      readonly kind: "matched";
      readonly projectionId: "derived.opening.deepest_reached@1";
      readonly deepest: CurrentOpeningEndpoint & { readonly kind: "matched" };
      readonly visits: readonly {
        readonly nodeId: string;
        readonly ply: number;
        readonly endpoint: CurrentOpeningEndpoint & { readonly kind: "matched" };
      }[];
      readonly catalogue: OpeningCatalogueRef;
    }
  | {
      readonly kind: "absent";
      readonly projectionId: "derived.opening.deepest_reached@1";
      readonly reason: "no_named_endpoint_reached";
      readonly catalogue: OpeningCatalogueRef;
    }
  | DeepestOpeningAbstention;
```

`deepest` is the visit with greatest observed ply; deterministic ties use lowest node id. `visits`
sort by ply then node id and retain repeated exit/re-entry matches. The derivation mixes
`cited_theory` and `recorded_run`, so the F1 compiler requires grounding `declared_convention`;
its semantics name only the fixed greatest-ply/lowest-node-id composition. It remains exact
because both inputs are exact, declares `input_abstained`, and never re-labels the current position
with the deepest historical match.

## 3. Evidence manifest and consumers

Add producer `theory.opening.runtime` with the two source projections in §§2.1–2.2, add the §2.3
projection to the existing `run.record` producer (which carries **7** projections at HEAD,
`packages/runtime/src/evidence-catalog.ts:782-790`), and add producer `derived.opening` with §2.4.

**Two adjacent namespaces now exist and must not be conflated.** `theory.opening_identity` is the
shipped *build-time authoring* producer whose single projection is `theory.opening_identity.record`
(`evidence-catalog.ts:781`), an `opening_identity` **EvidenceRecord** written into a pack's sourcing
ledger. `theory.opening.runtime` is this RFC's *runtime* producer over the compiled artifact. They
share neither payload, grounding path nor consumer, and no projection of one may be substituted for
the other. Separately: `claim-semantic-anchors` removes `theory.opening_identity.record` from
`authoring.claim_binding@1` (nothing can evaluate it today), and its D3 hands the question of
whether opening facts return to claim binding to this RFC. This RFC's answer is *not yet*: none of
the three projections here is claim-bindable, because claim binding requires a registered
deterministic clause renderer and §3 lands all four `inspector_only`.
Each projection has a typed payload, literal operands, limitations and availability reasons.
`derived.opening.deepest_reached@1` declares `theory.opening.current_endpoint@1` plus
`run.record.position@1` as derivation inputs. Its manifest declaration uses `plane: "derived"`,
`availability: "local"`, grounding `declared_convention`, exactness `exact`, answer content `fact |
theory`, and abstention reason `input_abstained`, satisfying the existing mixed-grounding rule.

At this RFC's landing all four are `inspector_only`, not unowned. The later Learner Modules / F7
amendment may add only the consumer bindings adjudicated by Semantic Collectors' matrix:

| projection | allowed future families | explicit refusal |
|---|---|---|
| current endpoint | Support, Review, theory, bot, inspector, authoring | no move prior; no sticky identity |
| catalogue membership | Review, theory, bot, inspector, authoring | no descendant name; no ordinary hint sentence |
| deepest reached | Review, theory, bot, inspector | no current-position applicability |

“Allowed future” is not a binding. This RFC adds no Support card, preset, bot profile, theory
passage, pack link or longitudinal statistic. Every such surface needs its owning accepted RFC and
must consume the appropriate member rather than a generic opening object.

## 4. API boundary

Add a read-only server endpoint used by the explicit inspector and later module adapters:

```text
GET /opening-identity?fen=<FEN>&ply=<non-negative integer>
→ { currentEndpoint, catalogueMembership }
```

The handler canonicalizes the FEN through the existing chess parser, computes one transpose key,
and evaluates both lookups against the same artifact digest. Invalid FEN or ply is `INVALID_REQUEST`
(400). Catalogue unavailable returns 200 with typed abstentions, matching evidence availability
rather than pretending the request was invalid. The response contains no descendant-name list and
no move list.

The history derivation remains an internal Review/run adapter, not a client-supplied arbitrary
history endpoint. It consumes recorded nodes already authorized for the caller.

## 5. Rendering ceiling

Deterministic renderers may produce only:

- current endpoint matched: `Current position: {ECO} {name}. Source: Lichess chess-openings
  {shortCommit}.` — `{shortCommit}` is the first **7** characters of `CHESS_OPENINGS_COMMIT`
  (`4b86227`), fixed here so the renderer's bytes are snapshot-testable;
- current endpoint absent: no ordinary learner sentence; inspector may show `No exact named
  endpoint for this position in the installed catalogue.`;
- membership: inspector-only count language, never a name;
- deepest reached: `Deepest named opening reached: {ECO} {name} at ply {ply}.` with source.

The text “book,” “book move,” “theory says,” “best,” “accuracy,” “mistake,” “style,” and “you
should” is prohibited in these renderers. The optional LLM receives a sealed rendered item only
after a later module admits it and cannot select an identity, turn absence into a name or add a
move.

## 6. Refusals

1. **No sticky label.** A match at ply 4 followed by absence at ply 5 makes current endpoint absent.
2. **No “out of book.”** Neither endpoint nor prefix absence owns that convention.
3. **No descendant guessing.** Prefix membership never chooses among candidate openings.
4. **No history inference from FEN.** Move order/transposition labels require a declared history
   comparison and are absent here.
5. **No network fallback.** Runtime is deterministic and offline.
6. **No book policy.** Identity, legal move generation and opponent repertoire remain separate.
7. **No theory prose.** ECO/name/source identity is applicability metadata, not an explanation.
8. **No longitudinal claim.** Accuracy-by-opening and player style require the observation store,
   denominators and their own RFC.

## 7. Acceptance criteria

1. **Source closure:** the compiler accepts the five vendored TSVs, verifies their SHA-256 against
   the five values at `tools/d894-opening-runtime-harness/README.md:10-16`, and emits exactly
   **3,810** unique named endpoints and **7,854** path keys, with a maximum
   `descendantEndpointCount` of **2,023**. All three figures are asserted, because 3,810 and 7,854
   alone are also produced by a compiler that seeds the initial position and then drops it; the
   2,023 maximum is what pins the exclusion. Deleting, duplicating or corrupting one row fails.
2. **Shared parser:** sourcing emission and catalogue compilation call `parseRows` and
   `normalizeOpeningPgn` from `apps/server/src/sourcing/openings.ts`; a source sweep rejects a
   second TSV or PGN parser. `parseRows` is exported by this implementation — the criterion is not
   satisfiable against HEAD, where it is module-private.
3. **Determinism:** shuffled input enumeration and object-key order produce byte-identical artifact
   and digest; changing one name, ECO, line or source byte changes the digest.
4. **Endpoint uniqueness:** a duplicate endpoint key fails the build rather than choosing first or
   deepest.
5. **Transposition:** two distinct legal move orders reaching one key produce byte-identical current
   endpoint and membership payloads except for their explicit `observedPly` when those differ.
6. **Unnamed prefix:** the D894 maximum-descendant prefix key returns membership with
   `descendantEndpointCount` exactly **2,023** and current endpoint absent; no ECO/name field exists
   in the membership type or serialized response. ("count >1" is satisfied by any prefix in the
   catalogue and measures nothing.)
7. **Stale carry:** a named endpoint followed by absence returns absence live while deepest-reached
   retains the earlier visit. The fixture is a **named imported game from the D894 population,
   identified in the test by file and game index**, at the exact ply pair where its last named
   endpoint is followed by a non-endpoint position — not an unnamed "witness". D894 measured this
   holds for **108/108** games (`design/research/runtime-opening-identity.md:71-74`), so the fixture
   is a specimen of a total property and the test asserts both.
8. **Exit/re-entry:** a recorded path exits and later transposes back; live results follow each
   current key and history retains both visits in deterministic order.
9. **Source propagation:** all three payloads carry the exact commit/artifact digest; mixing lookup
   inputs from two artifact digests is refused by the history derivation.
10. **Unavailable states:** missing, malformed and digest-mismatched artifacts let the server start,
    appear distinctly in `/capabilities`, and yield typed abstentions—never stale or fuzzy output.
11. **Manifest closure:** producer/projection counts and digest move by the exact declared delta
    (two producers, four projections); every projection is compiled and dispositioned, and no
    unregistered consumer appears. A negative fixture proves the history derivation fails when it
    names `run.record.move@1`, omits `run.record.position@1`, claims either input's grounding, or
    omits `input_abstained`.
12. **Law 8/refusal sweep:** production renderers contain none of §5's prohibited vocabulary and no
    LLM/FTS/embedding import enters applicability code.
13. **Packaging:** the runtime image contains the compiled artifact and no raw TSV, candidate pack,
    evidence sidecar, source job or absolute local path. The vendored
    `vendor/chess-openings/<commit>/` tree is a build input and is asserted **present in the repo
    and absent from the image** by `tools/verify-packaging.mjs`; the two halves are separate
    assertions, since §1.1 requires the files to exist and this criterion requires them not to ship.
14. **Performance:** after load, both current lookups complete synchronously under **50 µs p95** over
    all 6,991 fixed imported positions on the existing CI runner; artifact load and map construction
    are reported separately and bounded below 250 ms. The drafted 2 ms ceiling could not fail: two
    hash lookups plus one `transposeKey` cost single-digit microseconds, and even a **linear scan of
    all 7,854 keys** stays under it, so the criterion could not distinguish §1.3's "immutable maps"
    from an O(n) scan — the thing it exists to check. The criterion is additionally structural: the
    p95 measured over the full artifact and over a 100-key artifact must not differ by more than 2×.
15. **HTTP boundary:** valid lookup, invalid FEN/ply and unavailable catalogue fixtures pin 200/400/
    200 status respectively; responses contain no moves or descendant names.
16. **Scope:** no pack/schema/migration/content/assistance/preset/bot-profile bytes change; register,
    status parity and focused server/runtime tests pass.
17. **Closeout:** implementation updates docs, D743/D894, the coverage matrix and exploration log;
    writes this RFC's landing SHA into Semantic Collectors D3; only then may it await downstream
    learner/F7 bindings.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Learner-facing theory/Review/module bindings over the three ids; this RFC lands inspector-only | `planning/evidence-foundation-ux/` | binding implementation commit | |
| D2 | Runtime-artifact rights/inventory included in the F12 release proof | `planning/platform-alignment/` | release inventory commit | |

## Open questions

1. **None blocks buildability review.** The source, three meanings, absence forms and landing
   disposition are measured and bounded. O5 governs the broader cited-theory corpus, not this
   already-pinned ECO/name applicability index.
2. Whether a future product should define “out of book,” compare observed history to source move
   order, or expose descendant families is deferred. Each is new semantics and requires evidence;
   none is an implementation choice inside this RFC.

## Changelog

- 2026-08-23: initial draft from the completed D894 instrument and Semantic Collectors D3.
- 2026-08-23 implementation return: corrected the `b.tsv` SHA-256 authority in the referenced D894
  README after a fresh fetch from the exact pinned commit disagreed with the accepted transcription.
  The other four hashes reproduced. Returned to draft because the acceptance paragraph explicitly
  claimed all five values were independently re-derived clean; source closure cannot be waived by
  treating a false pin as implementation detail. No projection semantics or scope changed.
- 2026-08-23 cross-review: nine corrections, two of them buildability blockers as drafted.
  (1) **§1.1 asserted the vendoring in the present tense and `vendor/` does not exist.** The only
  path that reads these files today fetches them from `raw.githubusercontent.com`
  (`openings.ts:97`), so "a clean checkout can rebuild without a network request" was false at
  HEAD. Restated as this RFC's first obligation, and the five SHA-256 values pinned to
  `tools/d894-opening-runtime-harness/README.md:10-16` — the D894 dossier only points at them
  (`:35`), it does not carry them.
  (2) **Criterion 2 named no symbol, and half of it is unsatisfiable at HEAD.** `normalizeOpeningPgn`
  is exported (`openings.ts:46`); `parseRows` (`:36`) is module-private, so the compiler would have
  had to duplicate row parsing — the exact thing the criterion forbids. Both are now named and the
  export is an explicit obligation. The `eco\tname\tpgn` header contract came with it.
  (3) **§1.2 never said path keys exclude the initial position**, and that omission is what makes
  criterion 1 reproducible or not: the D894 instrument pushes a key only after each played move
  (`opening-runtime.test.ts:42-47`), which is why the maximum descendant count is **2,023** and not
  the 3,810 that a root-seeded compiler yields. Stated, and criterion 1 now asserts 2,023 alongside
  3,810/7,854 precisely because the first two figures alone do not detect the error.
  (4) `descendantEndpointCount` misdescribed its own value — a row's own endpoint key is among its
  path keys, so the count includes the key itself when the key is an endpoint. Corrected in place.
  (5) Criterion 6's "count >1" is true of essentially every prefix in the catalogue; pinned to 2,023.
  (6) Criterion 7 rested on "the fixed exact-abstention witness", which names nothing; replaced with
  an identified game/ply fixture plus the 108/108 total property it specimens.
  (7) **Criterion 14's 2 ms p95 could not fail.** Two hash lookups and a `transposeKey` cost single-
  digit microseconds and a linear scan of all 7,854 keys also fits inside 2 ms, so the bound could
  not distinguish §1.3's immutable maps from an O(n) scan. Tightened to 50 µs p95 with a structural
  size-independence assertion.
  (8) §3 now separates `theory.opening_identity` (shipped build-time authoring producer,
  `evidence-catalog.ts:781`) from this RFC's `theory.opening.runtime`, and answers
  `claim-semantic-anchors`'s new D3 explicitly: not claim-bindable at this landing.
  (9) `{shortCommit}` pinned to 7 characters so §5's renderer is snapshot-testable; criterion 13
  split into repo-present and image-absent assertions.
  Re-derived and unchanged: `CHESS_OPENINGS_COMMIT` is byte-exact at `openings.ts:16` and
  `CHESS_OPENINGS_RETRIEVED_AT` at `:17`; **3,810** / **7,854** / **2,023** / **401 of 6,991** are all
  exact in `design/research/runtime-opening-identity.md:49-53,71-72`, and 401/6,991 recomputes to
  **5.7%**; `run.record.move`'s operands are `["context", "offset", "moveSan"]` with no FEN, so
  §2.3's premise holds byte-exactly; `transposeKey` is `canonicalFen(...).split(" ", 4).join(" ")`
  (`chess.ts:16-19`); the manifest delta of two producers and four projections is internally
  consistent; and the `none` claims block is correct — nothing here touches the six registers.
