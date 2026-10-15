# RFC: Installed opening evidence

**2026-10-15 joint amendment acceptance:** independent review accepts §3a's complete opening-
history source and coordinated current Inspector@2/ReviewMap@2 adoption contract. Earlier
unaccepted labels for those clauses are history; this does not accept unrelated parent/resource
obligations or claim actual source delivery. Decision:
`planning/learner-modules/inspector-source-independent-review-2026-10-15.md`.

- **Status:** draft — [[D3376]]; independent buildability review required before implementation
- **Author:** codex
- **Created:** 2026-10-08
- **Design refs:** `design/03-product-breadth.md` (shared evidence and theory/Review journeys); `design/05-in-run-experience.md` (grounded, permission-bounded assistance); ADR-0005
- **Exploration gate:** completed `runtime-opening-identity.md` source/lookup investigation, its D1 handoff, and the located D3376 source/consumer gaps in `planning/rfc-drafting-queue.md`; D3857's real-catalogue/recorded-prefix controls in `tools/d3792-inspector-demand/opening-source.ts` and `design/research/module-evidence-assembly.md`. This is an installed-source adapter, not a new opening classifier or feasibility claim.
- **Depends on:** `runtime-opening-identity.md`; `evidence-value-authority.md`; `module-registration.md`; `review-evidence-compiler.md`
- **Parent / amends:** runtime-opening-identity's private-artifact boundary and D1; the three opening factories and their existing module/Review source calls
- **Supersedes / superseded by:** —
- **Planning:** existing `planning/runtime-opening-identity/` once accepted; delivery remains in `planning/codex-queue.md`

```tabiya-claims
none
```

No existing resource lane is consumed. Implementation introduces the currently absent
`opening-catalogue-schema` resource at its first version, `1`, through the existing shared-resource
catalogue bootstrap. This is an explicit introduction, not an exemption from registering shared
data: schema file, version export, catalogue row and README register must land together. Review
must confirm that introduction before implementation. No migration, pack or run lane is claimed.

## Summary

Make the installed opening catalogue the real source of the two point factories and an additive
complete-history successor. Preserve the old history declaration/factory/receipts. Share one
validated immutable catalogue authority across the application, derive facts
at exact recorded positions, and connect the already-declared Theory Breadcrumb, Full Inspector
and Review Map bindings. Keep current endpoint, unnamed path membership and deepest recorded
endpoint separate. No new recommendation, sticky name, book policy or theory prose is introduced.

## Located gaps

These are current source observations, not a claimed implementation:

- `apps/server/src/opening-catalogue.ts` loads the real artifact and performs paired lookups.
  Its private structural interface alone is not runtime evidence authority.
- `packages/runtime/src/evidence-factories.ts` has two point factories that always return
  `artifact_missing` and one history factory that always returns `input_abstained`.
- `packages/runtime/src/module-query.ts` requests only the endpoint from `{fen}`; Full Inspector's
  generic route matcher cannot request the history factory. The opening applicability contract in
  `module-registration.md` additionally requires exact sealed catalogue membership.
- `packages/runtime/src/review-evidence.ts` hardcodes opening `provider_off`. Its placeholder
  parser expects matched fields without the actual payload's `kind`/`projectionId` discriminants.
- `apps/server/src/service.ts` already retains the installed catalogue, but passes only engine
  and shapes into `compileReviewPacketForSubject`.

Fixing only one of these leaves the learner path unavailable. D3576 immutable snapshots and D3590
malformed-leaf refusal repair the loader independently; neither supplies the missing binding.

## Specification

### 1. One installed document, one shared schema

Register `schemas/opening_catalogue.schema.json`, with
`$id: "urn:chess-tabiya:opening-catalogue:1"`, and export
`OPENING_CATALOGUE_SCHEMA_VERSION = "1"` from `packages/schema/src/index.ts`.
The resource row uses `claimKind: "schema_lane"`, `source.kind: "json_schema"`,
`schemaSlug: "opening-catalogue"` and that version export, following the existing catalogue.

The schema describes the existing `RuntimeOpeningCatalogue` document exactly. Do not add a
`schemaVersion` field to the existing artifact or reinterpret historical bytes. Its closed source,
two tables and existing digest retain their meanings. Nonblank endpoint ECO/name, positive safe
integer counts/source locations, canonical sorted unique table keys, exact pinned source identity
and well-formed SHA-256 leaves are required. Every named endpoint must also be a path member, as
the source compiler already guarantees. The validator must not trust TypeScript casts.

Move the pure document types, strict loader and immutable lookup implementation to
`packages/runtime/src/opening-catalogue.ts`. Keep file I/O, TSV/PGN compilation and CLI in the server.
The server's existing public functions remain thin compatible wrappers; there is no second parser,
independent map population or per-node file read. No Node import enters the runtime module.

The existing build command also generates one small, package-owned registration document at
`packages/runtime/src/opening-catalogue-registration.json`: schema version, pinned source id,
commit/retrieval identity and the existing compiled artifact digest. It contains no table, moves or
explanatory prose. The runtime module imports that registration; callers cannot provide a replacement
registration or an expected digest to an admission function. `make opening-catalogue-check` checks
both generated outputs against the same compile. This is an installed-content pin, not a new
transitive code-hash, freshness framework, clock expiry or research-recording dependency.
Compilation uses structural validation, not installed-source admission: a rebuild must not require
the previous registration to approve the new artifact. Compute the artifact first and its small
registration second; never include that generated registration among its own compiler inputs.
Keep the existing compiler-file inventory accurate when relocating the pure implementation.

### 2. Runtime-owned source authority

`admitInstalledOpeningCatalogue(artifact: unknown)` validates the shared schema, recomputes the
existing complete-document digest, checks the package-owned registration and constructs one
immutable source handle. Private runtime storage owns its maps; callers cannot supply a lookup
callback, endpoint payload, source id, membership count or replacement registration.

The handle's public identity contains only the registered source reference. A module-private
WeakMap/WeakSet owns recognition and maps; each evidence factory checks that recognition. A spread,
JSON copy, duck-typed implementation, subclass or double type assertion is not an admitted source.
Reacquiring the exact installed artifact is allowed; copying a handle is not. Wrong source or changed
tables with a recomputed self-consistent digest still fail the installed registration check.

Missing input returns `artifact_missing`; malformed data returns `artifact_invalid`; a valid-shaped
document whose computed or registered digest disagrees returns `digest_mismatch`. Server startup
continues with that exact unavailable state, and existing capabilities/HTTP reflect it. No network,
last-known name or substitute catalogue is used.

Application construction loads/adopts once and shares that exact handle with RunService, phase
composition and module execution. A request never reloads or rebuilds the catalogue. The registration
is bundled with the runtime code and the artifact remains in the runtime image's allow-list; raw TSVs
remain build-only. Existing release inventory obligations remain, not automatically discharged.

### 3. The sole factories

All production callers continue through the internal evidence-value dispatcher. Point refs stay
at @1. D3857 replaces this draft's impossible same-version history proposal with the additive
derived.opening.deepest_reached@2/createDerivedOpeningDeepestReachedV2Evidence contract below
and F2 §2.3k; old history@1 and its honest unavailable result remain unchanged.

| Factory (three total) | Authority input | Successful output |
|---|---|---|
| `createTheoryOpeningCurrentEndpointV1Evidence` | admitted source + sealed `run.record.position@1` | zero or one exact matched endpoint |
| `createTheoryOpeningCatalogueMembershipV1Evidence` | same source + same sealed position | zero or one exact member/count, with no ECO/name |
| `createDerivedOpeningDeepestReachedV2Evidence` | genuine `RecordedOpeningHistorySource` | zero or one greatest-ply matched endpoint with all matched visits and complete retained lookup population |

Point factory input is `{ source, position }`; the position supplies FEN and observed ply. There is
no caller-selected observed ply, endpoint or row. Both factories share the existing paired lookup
for the same source/position within execution; do not normalize one FEN twice to obtain one pair.

Each point factory returns `EvidenceAvailability<readonly DeclaredEvidence<...>[]>`. Successful non-match is
`available([])`, not a provider failure and never an undefined-name fact. Unavailable source returns
its exact reason. A forged handle or mismatched declared-position authority is a TypeError before
minting, not an honest absence. Matched payloads preserve the existing `kind`, `projectionId`, source
and literal operands; the source receipt retains the exact installed document identity and row
location. Factory metadata and valid/falsifier profiles must change with the actual typed inputs.

#### 3a. D3857 complete history source — unaccepted amendment

The sole constructor is collectRecordedOpeningHistory({source,run,branchId,throughNodeId});
source is the genuine admitted installed-catalogue handle, not a lookup callback. It validates
the entire original run/selected branch graph, canonical FENs and recorded edges before
narrowing or reusing any lookup. Resolve the exact through-node on that branch, then detach one
immutable root-inclusive prefix through it. An unknown/off-path endpoint, corrupt original
graph, copied source or invalid recorded position refuses before collection, including after
the requested endpoint. A valid source is privately recognized by the runtime, not by a caller
digest, structural type, nominal property or copied receipt. It is not an access grant.

The private source reader retains exactly: original run/event-head identity; selected branch
and through-node; complete ordered prefix node/edge image; exact admitted catalogue identity;
and one row per prefix node. Each row has its original path index, actual node/ply/full FEN,
the genuine run.record.position@1 value and authentic paired-lookup invocation/result from
the same admitted catalogue and position. A matched row retains the exact genuine current-
endpoint@1 value, whose source receipt binds that same position and catalogue row. An absent
row retains the actual no_named_endpoint lookup and its invocation, never a fabricated endpoint.
Retain all rows, including root, repeated position keys and negative lookups. Equal FEN/key
lookups may share calculation, but each recorded occurrence keeps its original sealed position
and exact endpoint input join; do not reuse a foreign occurrence's evidence value.

Add private construction-time authentication of the point factories' fresh result arrays and
paired invocation, including available([]). Existing empty-array equality or a catalogue digest
does not supply it. The source constructor obtains the real dispatcher results, verifies their
actual source/position/invocation, and retains their complete identities before flattening.
Only package-owned lookup construction may issue that invocation authority. Copied/filtered/
foreign arrays and unexecuted or failed lookups refuse; they are not negative source rows.
This is new implementation required by the amendment, not authority present in today's loader.

The history factory's sole arm is {history:RecordedOpeningHistorySource}, returning the fresh
authenticated readonly items array specified in F2 §2.3k; source unavailability is resolved
before invoking it. It reads the genuine
source once and runs F2 §2.3k's opening.deepest_reached@1 reduction over all its rows. It accepts
no caller visits, deepest endpoint, position list, array of lookups or source reader callback.
Observed ply is the recorded position's actual ply, not path index or catalogue sourcePly.
Retain every matched visit, including exit/re-entry; apply the existing greatest-observed-ply,
then lowest-node-id rule. A matched payload has the old successful fields, with only its own
projectionId updated to derived.opening.deepest_reached@2; nested endpoints stay @1. No match
returns an authentic empty result, not an absence fact, invented endpoint or unavailable source.
F2 owns its exact child occurrences/result receipt, including empty-result proof.

Missing/invalid/digest-mismatched installations never construct this source. The owning service
retains that actual installed availability and forwards its exact reason to the consumer;
do not call the old history@1 factory to collapse it into input_abstained. A missing issued
source without such a genuine source state is a contract failure, not artifact_missing. A
genuine held upstream authority may use the separately authored version hold before migration;
pending metadata alone cannot keep the installed implementation permanently unavailable.

The server authorizes run/branch access before any invocation. Review invokes against its existing
storage-authorized prefix snapshot, never the active Play cursor. Source and recorded-position
identity are ancestry, not a claim that an opening name is independently inferred chess truth.

### 4. Complete the existing consumers

No preset, assistance ceiling, source ranking or module acceptance list is widened.

| Consumer operation (four total) | Required real connection |
|---|---|
| Theory Breadcrumb | acquire the exact recorded position, membership proof and endpoint from the shared source; satisfy the existing catalogue-applicability join; render matched endpoint through `play.opening@1` |
| Full Inspector | explicit source branches request membership@1 and deepest history@2 at the inspected node; bind the new exact history pair to the retained registered presenter, not generic fallthrough |
| Review compiler | pass the admitted source in `ReviewSourceContext`; replace `provider_off` with exact per-node source calls; parse actual discriminated payloads rather than stripping fields to fit the placeholder |
| Review Map | request/render deepest-reached@2 for the selected authorized prefix, separately labelled retrospective, through the complete coordinated successor image required by D3859; current endpoint is not directly admitted to this module |

The Review node adapter accepts only matched current-endpoint payloads. Successful absence folds to
`honest_empty/no_observation`, not `provider_off`. Missing/invalid/digest-mismatched installed sources
retain their source reason through the closed Review/presentation reason vocabulary. Extend
`REVIEW_UNAVAILABLE_REASONS` and `PRESENTATION_SOURCE_REASONS` with `artifact_missing`,
`artifact_invalid` and `digest_mismatch`; currently neither contains these reasons. The missing
artifact is unavailable; an invalid artifact or digest mismatch is failed. Each has an explicit
learner label and exhaustive parser/fold/presenter controls, rather than a `provider_off` fallback.
This is a bounded reason-vocabulary extension, not a new provider protocol or acquisition attempt.

Inspector's exact post-install mapping is: artifact_missing → unavailable/artifact_missing;
artifact_invalid → failed/artifact_invalid; digest_mismatch → failed/digest_mismatch. These
three reasons are admitted only for current_endpoint@1, catalogue_membership@1 and the new
deepest_reached@2 topic. The module-registration closed wire and presentation source-status
vocabularies carry those exact reasons, null recordedCoverage and no facts/source diagnostics.
Bind the complete outcome to the existing disclosure receipt; client body/receipt correlation
and fixed operational labels must reject substitutions. A successful empty point/history is
no_witness, never one of these reasons. Recheck the actual retained installation identity/state
and authorized prefix at delivery. A corrupt history/invocation/receipt is source_contract_invalid,
not an invalid artifact unless the loader actually established artifact_invalid.

The packet must retain enough exact source identity to distinguish a successful empty lookup from an
unavailable catalogue. Its items remain ordinary sealed evidence; the private source handle and full
catalogue are not serialized. Add an exact @2 adapter for the deepest successor where needed, with
the same authorized prefix/through-node join. A retrospective fact is not a current-position label,
does not become a pivotal moment merely because it exists and must not repeat as a nudge at every ply.

Theory Breadcrumb at a named node shows that node's name; advancing to an unnamed node removes it.
Full Inspector may separately report membership count. Review can still describe the deepest
earlier endpoint using the existing retrospective component. Do not add a guessed theory passage,
descendant name, arbitrary pack recommendation, move prior or persistent theory-launch record.

### 5. Compatibility, cost and unavailable behavior

Existing `/opening-identity` response bytes/absence meanings and the source catalogue pin remain.
No saved run, pack, database table, historical event or opponent request is rewritten. Point
factory valid/falsifier fixtures migrate to real authorities. Old deepest@1 declaration, factory,
callers/receipts are not reinterpreted as new authority; under D3851 migrate actual callers and
retire the obsolete executable@1 path rather than build a compatibility arm. New @2 has its
own real available/empty/refused controls. Current endpoint and membership
payloads stay @1. No consumer silently accepts @2 under an old pair: Inspector's proposed
original75-topic rebase map replaces the history slot before sequence deduplication into its
sole current65-topic/six-detail image. Review Map's complete72-ref successor contract now exists
under D3859. Bind deepest_reached@2 to both exact module.full_inspector@2 and module.review_map@2;
actual complete-source/current-binding/receiver adoption remains required before either is
counted as delivered. No parallel old consumer image or fabricated historical authority.

Keep the existing 250 ms load budget and 50 µs paired-lookup CPU p95 budget. Track load count and
one-pair normalization with structural controls in addition to timing. History walks one authorized
prefix; Review execution memoizes shared position/lookup work rather than rebuilding a prefix and
catalogue independently for every consumer. No per-node network request, new queue or source cache.

Missing/corrupt catalogue must leave Play/Review usable with truthful unavailable modules, no stale
name, no automatic engine fallback and no unsolicited move answer. The catalogue never determines a
game phase or overrides independent structural/endgame sources.

## Acceptance criteria

1. Shared-schema/resource bootstrap is checked by the existing schema/register gates. Deleting its
   register row or adding an undeclared artifact field fails; the production artifact still loads.
2. One genuine installed catalogue passes; altered name/count/source bytes with a recomputed outer
   digest fail registration. Substituted expected registrations are not constructor inputs. A source
   handle copy, JSON round-trip, fake method object or double cast fails every relevant factory.
3. Both point factories and the new history factory have real positive/empty controls, with
   unavailable cases proved at the actual owning source boundary. Routes,
   metadata and value-level profile fixtures are set-equal; no test discharges an available path by
   expecting its predecessor's unconditional refusal.
4. `1.e4` yields exact B00 King's Pawn Game and independently 2,023 path descendants. The unnamed
   `1.d4 Nf6 2.c4 e6` witness yields 304 descendants, no endpoint name and no name-valued module item.
5. Named→unnamed→named exit/re-entry retains correct node/observed ply/source ply and full matched
   history. A sibling branch and a later recorded node cannot leak into an earlier Review prefix.
   Successful root-only/multiple-row negatives have authentic complete result authority; removed,
   duplicated, reordered, copied, same-key foreign-occurrence or never-executed lookups refuse.
   Corrupt original suffixes fail before narrowing. Permanent tests exercise the real constructor,
   sole dispatcher, reduction receipt/plan/closure and empty-array reader, not the research helper.
6. Theory Breadcrumb's actual application module query obtains the genuine installed source,
   position and membership proof and returns a sealed rendered name. Crossed position, copied source
   and missing membership fail. No arbitrary callback/endpoint object can make this test pass.
7. Full Inspector's actual query obtains membership and retrospective history at the inspected node;
   the current generic route fallthrough is a predecessor-red control, not accepted empty behavior.
8. Actual authenticated native and imported-game Review requests use the source and parse its real
   payloads. Missing, malformed and changed-digest installations remain distinct typed failures;
   a successful unnamed lookup is settled empty. Server restart reconstructs from installed content
   without provider calls or rewriting recorded play. Ordinary replies never contain catalogue rows
   or source handles.
9. Built-app desktop and touch-phone journeys cover named Theory Breadcrumb, unnamed disappearance,
   Inspector membership/history, Review's retrospective distinction, reload and return to unchanged
   Play. Assert recorded nodes/cursor/prefix with only additive background evidence allowed, and
   source-bound actual captions rather than a mocked rendered packet.
10. One startup load/map construction serves multiple queries and Review nodes. Existing performance
    budgets pass unchanged; source acquisition adds no network call. Phase-source and packaging
    controls still pass against the same installed catalogue.
11. Full normal software/content/browser/governance gates pass. Canonical docs, D3376, queue, roadmap
    and exploration log carry the shipped bindings. Do not discharge runtime-opening D2 or promote
    official chess content, bot repertoire or a complete capability from this source integration.

## Deviations from design

None. The change implements existing named source/module meanings. The shared-schema introduction
is required by runtime-opening-identity's explicit package-boundary clause, not a new product feature.

## Discharges

none

## Open questions

Independent review must verify the resource bootstrap and source registration/build boundary against
the actual package/image pipeline before acceptance. This is a buildability obligation, not an owner
product choice. The proposal fixes one package-owned registration, not a caller-extensible catalogue
registry. New catalogue sources, book policies and authored theory remain outside this document.

## Changelog

- 2026-10-15: unaccepted D3857 amendment replaces the one-pair history proposal with an additive
  @2 complete-prefix source/reduction/result contract; exact original validation, successful
  negative lookup authority, both consumer migrations and installed-source outcome mapping.
  Point refs/source pin and old history@1 remain. Independent source/joint review still required.
- 2026-10-08: drafted from D3376 and the actual sole-factory/module-query/Review composition gaps;
  D3576/D3590 loader repairs remain independent. Not accepted or implemented.
