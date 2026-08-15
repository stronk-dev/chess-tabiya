# Shape library

The shape library is Tabiya's reusable layer of chess knowledge. A drill pack remains a
focused rehearsal; it may reference shape entries whose names, plans, structural success
signatures, watch points, and provenance also work in pack-free Just Play sessions.

## Entry anatomy and trust

`schemas/shape_entry.schema.json` is the closed v0.3 format. An entry has an id and version,
one or more phases, a structural trigger, plans for both colours, watch points, typical
mistakes, and explicit provenance. Each plan may carry a structural success signature or
`null` when the shipped arithmetic cannot honestly express one. The entry cannot contain a
start position, spine, checkpoint, move field, or grading verdict. FEN-shaped text in prose
is rejected so reusable prose cannot quietly bind itself to one position.

The trigger and success signatures reuse the drill-pack `StructuralExpression` grammar.
Catalogue entries commonly use a `named_structure` leaf; entries that need composition use
the same `all`/`any`/`not`, feature, piece-on-square, mirrored, and bounded quantified expressions
used by pack objectives. Mirrored catalogue names are refused. Files mirroring preserves plan
owners and can widen an entry's trigger only when every wing-pinned success signature widens with
it. Colours or both axes change plan ownership and therefore require a separate entry with its own
authored plan prose. There is one evaluator in `@chess-tabiya/runtime`.

Schema 0.3 carries the same eighteen-leaf grammar as pack 0.18, including `piece_count`,
`king_zone`, and static `piece_distance`. The duplicated grammar is sync-tested so a leaf cannot
silently work in packs but fail in shape triggers. A non-null `plan.success.signature` is now also
a pack-grading resolution target through `plan_consequence`; registration checks that a referenced
present signature is exercised on an authored spine. A null signature remains an explicit,
learner-visible refusal to grade that plan.

Official entries load from `content/shapes/`. Community entries are immutable registered
versions from Shape Studio. Channel is derived from the resolving source and is never an
author-writable field. The server projects an allow-list and exposes provenance, licence,
attribution, channel, and community publisher beside the authored claims.

## Pack references

Pack schema v0.11 adds optional top-level `shapes` ids and optional
`planClass.shapePlan {shape, plan}` references. Registry load and studio registration reject
unknown entries, unlisted references, and missing plan ids. Existing inlined plan classes
remain valid. On reveal, a referenced plan renders its reusable entry description once and
the pack's own description as position-specific residue.

Pack projection exposes only the shape ids. It still withholds plan classes, success
conditions, annotations, deviations, and claims under the existing feedback policy.

Pack schema 0.18 adds reference modality. A bare id means `present`; the object form may instead
declare `prospective`. Present references must match at least one authored spine position and may
fire or ground a plan consequence. Prospective references document a future handoff but never fire,
grade, or open authored feedback. A shared normalizer is the only reader of the two wire forms.

## Derived firing and the UI

`shapeFirings(entries, path)` evaluates played positions only and returns canonical,
maximal contiguous spans per entry. A later re-entry creates another span. Firings are not
run events, checkpoints, rewind targets, rankings, or grading inputs; opening a marker does
not mutate the run or open the feedback barrier.

The first node of each span gets a passive timeline marker. A root match gets a dedicated
ply-0 start row. Opening a marker shows detection first, then the fixed honesty frame:
“Named plans for this structure — general to the kind of position, not advice for this
one.” Plans, structural success descriptions, watch points, mistakes, and provenance follow.

For a pack run, only entries named by that pack are evaluated. Position runs evaluate the
served catalogue. The initial four entries have grown into the official catalogue under
`content/shapes/`. Five entries were upgraded to v0.2.0 with the wave-2 grammar: same- versus
opposite-coloured bishop endings are shade-disjoint; the Black fianchetto covers both wings;
opposite-bishop and queenless fans use quantifiers; and the pawn-ending entry can identify direct
or distant opposition. Entry versions are content versions and remain distinct from the shape-entry
schema version.

## Just Play and authoring

The Play route can start a pack-free position run from the initial position or a legal FEN,
with learner side and human-common/strong-engine resistance. The same event-projected board,
timeline, branches, comparison, replay, and PGN export operate without a pack. Selection
requests are reconstructed from persisted run identity; reload and read-only following do
not require pack metadata. The objective region states the absence explicitly: no pack is
loaded and nothing is claimed about the position.

Shape Studio mirrors pack authoring with learner-owned drafts, digest-based optimistic
updates, lint plus optional probe-FEN matching, immutable community registration, export,
and account-deletion tombstoning. Migration 10 owns `shape_drafts` and
`registered_shapes`; run schema stays v0.8 because firings are derived.

`make expression-census` measures every trigger and non-null success signature over the authored
position corpus. Coverage labels are diagnostic only. A closed sound-refutation arm rejects a
proven-unsatisfiable shape expression while preserving the lint route's optional probe result.

## Measured envelope and limits

Four official entries evaluated over all 16 Pack B spine positions in a 20-sample local run
at median 1.313 ms and maximum 3.238 ms. These are observations, not pass/fail gates.

The library does not supply an LLM voice, live phase classification, assistance settings,
generated drill recipes, cross-pack concept identity, or a review workflow. Those require
their own contracts. Shape detection names a pattern; it never prescribes a move in the
current position.
