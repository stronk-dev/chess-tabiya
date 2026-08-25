# Pack Studio

Pack Studio is the authenticated, database-backed authoring path at `/create`. It uses the
same living pack validator as `make pack-check`, saves incomplete drafts, allows playtesting
validation-clean drafts against the real run service, and registers immutable community
versions.

Studio lint, saved-draft validation, playtest admission, and registration all receive the same
shape, principle, and sibling-pack lookups. Unknown or off-phase principles and unknown or
unproven `variantOf` relations therefore fail in Studio instead of appearing clean until a later
CLI check.

## Sources and publication channels

Packs loaded from git, the image, or an operator's development draft path are `official`.
Packs registered through Studio are `community`. Channel is derived from the resolving
source and is not a pack-document field. Official ids are reserved and official records win
catalogue collisions.

The learner-facing projection allow-lists provenance keys. Arbitrary open-object metadata
such as `channel`, `reviewedBy`, or `endorsement` cannot impersonate server-derived trust.
Community records show the publisher handle, which means who registered the bytes—not who
proved their chess claims.

## Storage and lifecycle

Migration 7 adds durable `pack_drafts`, `playtest_documents`, and `registered_packs` tables.
Drafts are learner-private and use digest-based optimistic concurrency. Invalid documents
can be saved and inspected but cannot be playtested or registered. Account deletion
withdraws mutable drafts and tombstones ownership to the existing legacy learner; published
bytes and the historical publisher handle remain.

Registration changes `provenance.reviewStatus` from `draft` to `published`, requires a
validation-clean document, sources, and no declared graduation blockers. `(pack_id, version)`
is immutable, versions increase, and the first publisher owns the community id. There is no
review workflow or approval status: publication channel communicates the actual safeguard.

## Digest-addressed resolution

The catalogue retains every registered and playtest document by digest. Browsing resolves
only the newest community version (with official source priority); existing runs resolve the
exact bytes they started from. If a pack run's digest is genuinely unavailable, move,
opponent-move, authored-feedback, and PGN operations fail with `PACK_UNRESOLVABLE` instead of
silently degrading into a pack-free run.

Playtest documents are digest-resolvable but never listable, so saving a draft cannot orphan
an earlier playtest and playtesting cannot publish it accidentally. Registry hydration on
startup restores both registered and playtest digest resolution from SQLite.

## HTTP and client

The first Studio surface supports listing, creating, reading, replacing, linting,
playtesting, registering, withdrawing, and exporting drafts/packs under `/packs/drafts…` and
`/packs/:id/export`. Draft reads are owner-scoped. `PUT` requires `If-Match`; stale editors get
`DRAFT_STALE` with the current digest.

`/create` exposes the real JSON document, validation issues with paths, create/save actions,
private playtesting, confirmed withdrawal, and community registration. Save & playtest persists
the current editor bytes and opens a real run; the server—not the author—chooses its run id, safe
random seed, and per-run policy configuration. Invalid drafts name their blocking validation
issues instead of offering an inert action. Withdrawal makes mutable bytes read-only while earlier
private playtests keep resolving their exact digest. Studio remains an intentionally low-level
authoring instrument rather than a visual chess-content editor.

While a mutable pack is selected, the client debounces the editor buffer for 300 ms and sends those
unsaved bytes to `POST /packs/drafts/:id/lint`. Superseded responses cannot replace newer results,
malformed JSON is reported locally without a request, and transport failure is distinct from a
validation result. Save remains available for incomplete work; playtest stays disabled until the
current unsaved buffer is validation-clean. The editor derives its format label from the schema
version constant and its ten-field checklist from a schema-bound required-field constant. Validation
renders missing required fields separately from wrong values and warnings. Discriminated `oneOf`
unions are filtered at the shared validator boundary, so an `outcome` condition reports only the
selected outcome arm and a structural feature reports only its selected `kind`, identically in Studio
and `make pack-check`.

The pack editor's right-hand column projects `provenance.graduationBlockers` from the current unsaved
JSON, not the last saved draft. It counts blocking versus discharged conditions and shows each stable
id, state, and statement. Legacy string entries and malformed entries display as blocking, matching
the validator's fail-closed posture. This per-draft column does not pretend to replace the separate
corpus-wide `make graduation-report` instrument.

`POST /runs/:id/distill` lets a run host turn played branches into an ordinary
learner-owned draft with `seedKind: run`. It copies only recorded move facts,
remaps portable fired checkpoints, substitutes a mechanical checkpoint when
needed, returns classless fork proposals, and always declares graduation
blockers. It never copies authored grading, deviation classes, claims, plan
classes, annotations, or engine evidence. Registration therefore remains
impossible until a human supplies and grounds the missing judgment.
The distillation emitter validates the completed document before returning it
and refuses `EMITTED_PACK_INVALID`, matching every other pack emitter.

## Publication posture introduced in pack format 0.8

Format 0.8 narrowed `reviewStatus` to `schema_example | draft | published` and removed the
typed `reviewers` property. Because provenance remains open for historical metadata, old
`reviewers` arrays still parse but have no trust-bearing consumer. Published packs require
sources; Studio alone writes the published state. This is historical provenance behavior, not the
current format number shown by the editor.
## Shape-entry authoring

Shape-entry authoring extends the pack workflow described above. Shape drafts use
`/shapes/drafts`, digest-based `If-Match` updates, `/lint` with an optional probe FEN,
immutable `/register`, and `/shapes/:id/export`. Official ids are reserved; channel is
server-derived. Migration 10 stores `shape_drafts` and `registered_shapes`, and account
deletion withdraws mutable drafts while retaining published bytes and attribution.
Create, save, lint/probe, and register failures all render through one visible alert path; lint
results replace the selected draft's displayed validation instead of leaving the saved result stale.
