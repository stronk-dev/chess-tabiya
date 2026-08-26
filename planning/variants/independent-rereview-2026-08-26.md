# Variants independent buildability re-review

**Date:** 2026-08-26

**RFC:** `rfc/variants.md`

**Verdict:** return to author before acceptance

**Scope:** amended full-family contract against the current runtime, import, opponent, evidence,
campaign and release boundaries; no production or protected-design edits

The amendment correctly repairs the prior review's six findings: it no longer re-asks the closed
opponent ruling, moves Maia refusal behind the menu, retains the stale-board failure as normative
evidence, makes the capability disposition failable, admits Chess960 packs instead of inventing a
schema blocker, and separates the owner's admission law from the current shipped set.

The widening to Tier 2 exposes a deeper mismatch: the product's branch, move, terminal, evidence and
opponent authorities are standard-`Chess` authorities. Adding `DrillRun.rules` does not make those
authorities variant-aware. Nine findings below prevent the widened contract from being implemented
without silently choosing a second runtime architecture.

## R1 — Tier-2 branch runtime is not intact (D1674)

`packages/runtime/src/runtime.ts:269` constructs every node with `positionFromFen`, which returns
`Chess`; `commitMove` then refuses every parsed move for which `isNormal(move)` is false. Chessops
represents Crazyhouse drops as `DropMove` (`parseUci("P@e4")`, `isDrop === true`, `isNormal ===
false`), so the headline Tier-2 member cannot commit its defining move. `events.ts:343` validates
every outcome through standard `terminalOutcome(positionFromFen(...))`, so Antichess, Racing Kings,
Three-check, King of the Hill, Horde and Atomic also receive the wrong terminal law. A source census
finds 181 `positionFromFen`/`exactLegalMoves` uses across runtime/server code; the branch runtime is
not rules-parameterised at one hidden seam.

Specify one rules-aware position/move/terminal authority and thread it through create, commit,
replay, event projection, transpose/repetition, SAN/UCI/drop identity, fork/compare, board input and
resume. Criterion 14 needs at least one rules-distinct terminal per family plus a Crazyhouse drop;
ordinary normal moves cannot establish Tier-2 support.

## R2 — Chess960 behavior needs an identity the RFC refuses to persist (D1675)

The RFC says a 960 run needs no field, then requires Maia refusal, Stockfish option/dialect choice,
opponent availability and evidence capability selection based on whether the start is 960. Its
normative guard is “non-standard start.” That is not a 960 identity: an ordinary standard-chess
arbitrary-position run also has a non-standard start and would lose Maia; a later 960 position may
have no castling rights; and a legal composed standard position can share the same FEN shape as a
960 start. FEN carries the board and rights, not the product fact “this run was admitted as
Chess960.”

Add a closed setup/rules capability identity to the run start (separate from Tier-2 move rules if
needed), or define an exact derivation that does not misclassify arbitrary standard positions and
survives lost rights, import, resume and fork. Fixture the same legal FEN under standard-from-position
and Chess960 origins and require different Maia/engine capability results.

## R3 — `parseVariant(...) === "chess"` conflates standard PGN with 960 setup (D1676)

Chessops deliberately returns `'chess'` for missing/`Chess`/`Standard`/`From Position`/`Classical`
and for Chess960/Fischerandom/wild spellings. §4.4 maps that result to “Tier 1, subject to the
FEN/SetUp requirement.” Implemented literally, a normal `[Variant "Standard"]` PGN without FEN is
refused; implemented only for some raw spellings, the claimed normalized comparison discipline is
false. `parseVariant` cannot recover which setup family the raw header named after it collapses
them.

Specify a separate normalized setup-header classifier: ordinary standard aliases may use the
default start; from-position/960/wild aliases require the declared setup bytes; Tier-2 aliases map
to their exact rules. Fixture every class, including missing Variant, Standard, From Position,
Chess960 alternate spelling and a Tier-2 default position.

## R4 — Fairy-Stockfish is neither composed nor consumable (D1677)

There is no Fairy-Stockfish worker, image, compose service, release workflow, engine spec,
capability/provider declaration or application injection in the tree. More importantly, the shared
opponent path parses only ordinary coordinate PV/bestmove regexes and its `play` helper requires
`isNormal` on a standard `Chess`. A correctly returned Crazyhouse drop is therefore discarded or
rejected. “A second UCI sidecar needs no supervisor change” is not an end-to-end operation.

Name the worker image/digest/licence inventory, health/capability, variant option handshake, request
identity, candidate grammar (including drops), selector operation, application composition,
release-image tier and provider-off behavior. Add a real sidecar fixture whose only legal/selected
move is a drop and whose bytes reach a committed run. Criteria 16–17 currently test copy/evidence
only and can pass with no opponent.

## R5 — producer suppression has no exhaustive authority or request identity (D1678)

`EvidenceJobInput` carries run/node/FEN/kind/bounds and no rules/setup identity. Both
`#ensureStoryEvidence` and `#enqueueMoveEvidence` enqueue standard evals from FEN; the latter also
auto-enqueues `/standard` tablebase. Human split, group seeding, direct evidence routes and local
semantic collectors are separate operations. A Crazyhouse-through-Story fixture can pass while
another route computes and stores standard-chess evidence for the same run.

Publish a closed rules-capability receipt on every evidence request and one exhaustive scheduler
gate over the actual operations. The negative census must be operation-set-equal, not one story
call. Local collectors also need explicit `suppressed` disposition rather than being invoked with a
standard parser and hidden later. Provider jobs created without rules identity must fail.

## R6 — “declared rungs as data” has no type, storage home or consumer (D1679)

§2.1 and §6 make declared surviving rungs the safety mechanism, but no `VariantCapability`, rung
union, register, run field, pack field, compiler or consumer is specified. Criterion 1 instead
creates a surface admission table; admission is not evidence availability. The RFC also says every
Tier-1 rung survives while Maia is explicitly dark, v1 declines 960 explorer data, and the runtime
opening catalogue is standard-ECO shaped. Those facts require a real per-source/module capability
projection, not the literal “all.”

Define the rung/source/module vocabulary, derivation authority, persistence/recomputation rule and
consumer clamp. Honest empty and intentionally suppressed must remain distinct. A new evidence
producer must fail the capability closure until its per-ruleset disposition is declared.

## R7 — the admission matrix still has no exact surface vocabulary or production readers (D1680)

Criterion 1's own note admits §1's four rows are not the shipped seven `SURFACE_IDS`, and
`fromPosition`—the actual pasted-FEN entry—is absent. The amendment says the author must map or
declare a vocabulary but provides neither. “Every surface consults it” can pass with one reader
because no operation census is named.

Define exact workflow/start-origin ids and a total mapping from every route/API creation path to one
admission context. Compile the matrix at the create/import/campaign boundary and fixture all current
entry operations. The law field remains owner text; executable admission consumes only typed ids and
the shipped-set field.

## R8 — evidence-dark Tier-2 campaign nodes cannot progress in the current campaign (D1681)

The RFC admits Tier-2 as campaign play while repeating the design law that an evidence-dark node
seals no verdict. Current `campaign-core` advances by submitting a pack branch and copying its
`ObjectiveState` into `node_sealed`; v1 nodes are ordinary registered packs, and Tier-2 packs are
correctly refused. There is therefore no encounter definition, seal authority, reward/use proof or
map transition for a Tier-2 node. `campaign-core` is itself returned at persistence/API/reward
boundaries.

Route variant campaigns to an explicit successor contract for a different campaign structure, or
specify a grounded non-pack completion authority that does not manufacture a chess verdict. Do not
claim the current v1 campaign cell implemented by adding `DrillRun.rules`.

## R9 — criterion 2(b) is green before the semantic boundary exists (D1682)

The criterion requires a pack “that declares a Tier-2 ruleset” to fail schema validation while the
same section says the pack schema has no `rules` field and claims no lane. Any arbitrary unknown
property is already refused by the closed schema, so this arm passes at HEAD and cannot distinguish
variant discipline from generic `additionalProperties: false`. It measures the absence of a type,
not the Tier-2 pack boundary.

Bind the negative to the admission compiler/start-origin operation that could actually route a
Tier-2 run into a pack, or add an explicit pack capability field and claim its lane. Also remove the
duplicated criterion-3 heading during the author pass.

## Re-review entry condition

Re-review after R1–R9 resolve to exact types, production operations and able-to-fail fixtures. The
next pass should first prove one Crazyhouse drop from import/start through run persistence, opponent,
fork/compare/resume and rules-correct terminal detection with every evidence producer dark. Only
then generalise the remaining six Tier-2 rulesets and the campaign surface.
