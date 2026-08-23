# RFC: Runtime opening identity

- **Status:** draft 2026-08-23 — executes Semantic Collectors discharge D3 from completed D894
  research; independent buildability review required before acceptance
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

The five pinned CC0 files and their licence notice are vendored under
`vendor/chess-openings/4b8622759e7ae6f93f011cc6c83a3823401ab45e/`. A clean checkout can therefore
rebuild and verify the artifact without a network request or an operator-supplied directory. The
implementation must match the five SHA-256 values already frozen in D894 before compiling; source
refresh is an explicit later update, never an implicit fetch during install, CI or server start.

Input parsing reuses one exported TSV/PGN normalizer with the sourcing emitter; two independent
parsers are forbidden. Each row must contain one ECO, one non-empty name and one legal non-empty
mainline from the standard initial position. Any malformed row refuses the entire build.

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
from silently introducing a tie policy. Prefix rows collapse repeated visits within one source
line and count distinct descendant named endpoints.

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
projection to the existing `run.record` producer, and add producer `derived.opening` with §2.4.
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
  {shortCommit}.`;
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

1. **Source closure:** the compiler accepts the five pinned TSVs and emits exactly 3,810 unique
   named endpoints and 7,854 path keys; deleting, duplicating or corrupting one row fails.
2. **Shared parser:** sourcing emission and catalogue compilation call the same exported row/PGN
   normalizer; a source sweep rejects a second parser.
3. **Determinism:** shuffled input enumeration and object-key order produce byte-identical artifact
   and digest; changing one name, ECO, line or source byte changes the digest.
4. **Endpoint uniqueness:** a duplicate endpoint key fails the build rather than choosing first or
   deepest.
5. **Transposition:** two distinct legal move orders reaching one key produce byte-identical current
   endpoint and membership payloads except for their explicit `observedPly` when those differ.
6. **Unnamed prefix:** the D894 many-descendant prefix returns membership with count >1 and current
   endpoint absent; no ECO/name field exists in the membership type or serialized response.
7. **Stale carry:** a named endpoint followed by the fixed exact-abstention witness returns absence
   live while deepest-reached retains the earlier visit.
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
    evidence sidecar, source job or absolute local path.
14. **Performance:** after load, both current lookups complete synchronously under 2 ms p95 over all
    6,991 fixed imported positions on the existing CI runner; artifact load and map construction
    are reported separately and bounded below 250 ms.
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
