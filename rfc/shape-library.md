# RFC: Shape library — reusable chess knowledge, authored once (B11)

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-14
- **Design refs:** `design/04-content-architecture.md` §0 (the 2026-08-14 split ruling, lines
  16-32) and §0a (the transfer audit with its 2026-08-14 corrections, lines 117-176);
  `design/05-in-run-experience.md` §3 (the ladder, lines 54-85), §3a (silence default, lines
  87-110), §3b (guided mode's permitted/forbidden line, lines 145-233), §5c
  (authored-and-computed-are-one-layer, lines 294-347); `design/03-product-breadth.md`
  §Reusable shapes (lines 202-210), the settled Just Play interruption model (lines 315-321),
  gate **B11** (line 276), program item #11 (lines 386-388)
- **Exploration gate:** the two owner rulings of 2026-08-14 (`planning/exploration/log.md`,
  final entry): (1) **split** — reusable knowledge goes to a shared shape library, packs
  survive as focused practice referencing it, full-merge explicitly not taken; (2) **passive
  marker default** — a library firing mid-game is a quiet timeline marker that opens to the
  entry's named plans. B11 was blocked on exactly these plus B9's predicates; B9 shipped
  2026-08-14 (`design/03-product-breadth.md:274`)
- **Depends on:** `rfc/structural-reading.md` (B9, implementing — supplies the
  `StructuralExpression` trigger grammar, `matchesStructuralExpression`, the pack-side
  `structural_feature` machinery, and the structural sentence layer);
  `rfc/archive/pack-studio.md` (implemented — supplies the draft/register write path, the
  server-derived channel, digest-addressed resolution, and the D25 rendering-allow-list
  pattern this RFC reuses)
- **Parent / amends:** **`rfc/archive/drill-pack-format.md`** (pack schema 0.10 → **0.11**:
  optional top-level `shapes`, optional `planClass.shapePlan` — both additive),
  **`rfc/archive/pack-studio.md`** (the studio gains the shape-entry write path; migration
  **10**), **`rfc/archive/drill-client.md`** (the timeline gains the shape marker; the client
  gains the minimal position-session player the Just Play acceptance requires),
  **`rfc/structural-reading.md`** (its four-entry code catalogue becomes the seed data for the
  first official entries, as its §5b anticipated — with one correction recorded under
  Deviations)
- **Supersedes / superseded by:** —
- **Migration:** **10**, `STORAGE_VERSION` 9 → 10 (`apps/server/src/storage.ts:265` is 9
  today; migration 9 is the latest row in `rfc/README.md`). Adds `shape_drafts` and
  `registered_shapes`; create-table/index plus the account-deletion tombstone rule packs
  already have (`storage.ts:762-765`). **Run schema stays 0.8 and that is normative** — §5
  decides that a firing is a derived projection, never a run event, so no event vocabulary
  change and no run migration exist to write.
- **Pack schema:** **0.11.** Claimed in `rfc/README.md`'s pack-schema-version register in the
  same edit that adds this RFC's Active row. Additive only; a valid 0.10 document is a valid
  0.11 document.
- **Shape-entry schema:** new single-writer artifact owned by this RFC —
  `schemas/shape_entry.schema.json`, `$id` `urn:chess-tabiya:schema:shape-entry:0.1`.
- **Planning:** `planning/shape-library/`

## Summary

The transfer audit in `design/04` §0a measured what a pack contributes to a game nobody
authored, field by field, and the answer was **nothing**: the three fields that carry reusable
knowledge — plan classes, concepts, claims — are exactly the three that cannot escape the pack
they were written into. The owner ruled the split on 2026-08-14: reusable chess knowledge
becomes a **shape entry** — authored once, carrying a name, the plan classes both sides own,
what each plan's success looks like structurally, what to watch, and the typical mistakes —
triggered by a B9 structural expression, so it fires wherever the arithmetic matches: inside a
drill or mid-game in Just Play. Packs survive as focused practice sessions that *reference*
entries instead of restating them.

This RFC ships that artifact: its schema, digest, registry, channels and HTTP surface; the
additive pack references (schema 0.11); the firing model (a derived projection over the active
path — deliberately **not** a run event, argued in §5a); the ruled delivery (a passive
timeline marker that opens to the named plans, with the rung-0 detection and the rung-5
authored claims visibly separate); the studio write path for community entries (migration 10);
and the first four official entries — `carlsbad` extracted from Pack B's inlined plan classes
as the worked example, `iqp-white`/`iqp-black`, and `rook-4v3-same-side` from Pack C. It also
ships the minimal position-session player, because "a shape entry fires in a game nobody
authored" is not demonstrable in a client that refuses to play one
(`apps/web/src/lib/session-controller.ts:180-185`).

What it deliberately does not ship: no LLM voice, no live phase classifier, no assistance
configuration, no guided mode, no generated drill recipes, and no review workflow. §Motivation
4 places each exclusion.

## Motivation

### 1. The measured problem

`design/04` §0a's audit is the evidence base and it is quoted rather than re-argued: of every
field in the shipped pack format, only the two position-keyed checkpoint triggers transfer to
an unauthored game, and the verdict is *"authoring a pack today improves exactly one drill and
contributes nothing to a game nobody authored"* (lines 141-143). The rule it produced —
**content earns its cost by how much of it fires in a game nobody authored** (line 151) — is
the budget this RFC exists to make spendable.

The concrete case is already in the tree. Pack B
(`content/drafts/carlsbad-minority-attack.json`) inlines three plan classes whose prose is
almost entirely generic to the Carlsbad structure — *"Two queenside pawns advance against
three. The aim is not to win material: it is to force a structural concession on c6"*
(`/planClasses/0/description`) is true in every Carlsbad ever reached, and today it can reach
a learner only inside this one pack, after this one pack's checkpoint, through the
authored-feedback reveal (`apps/server/src/authored-feedback.ts:275-299`). A learner who
reaches a Carlsbad in their own game gets nothing, because the knowledge has no identity
outside the pack and no trigger of its own.

### 2. The rulings, and what they fix and refuse

The 2026-08-14 rulings (`planning/exploration/log.md`, final entry; mirrored into
`design/04` §0) settle the three questions that blocked B11:

1. **Split, not merge.** The reusable half is lifted out into a library; packs stay
   first-class hand-crafted drills that reference it. The full-merge option — packs abolished
   into generated recipes — was considered and not taken. This RFC therefore changes what a
   pack *contains*, never what a pack *is*: no pack field is removed, no pack behaviour is
   degraded, and a pack with no shape references remains exactly as valid as it is today.
2. **Passive marker.** When the library fires during Just Play, the default is a quiet
   timeline marker the player may open to the entry's named plans. This is the same
   interruption model the owner already settled for Just Play recognition in 2026-08-12
   (`design/03-product-breadth.md:315-321`): recognition annotates; it does not seize.
3. **Naming, never prescribing.** The panel behind the marker obeys `design/05` §3b's one
   line: it may say what kind of position this is and what that kind is generally about; it
   may not say what is good *here*. The entry's plans are authored claims (rung 5), triggered
   by rung-0 detection, and §6b makes that seam visible in the rendering rather than a rule
   people are asked to remember.

### 3. What B9 supplies, verified

Every capability this RFC leans on was checked in the tree, because "the machinery exists" is
the claim that killed earlier drafts when it was assumed:

- **The trigger grammar ships.** `StructuralExpression` is the five-branch recursive union
  (`all`/`any`/`not`/`feature`/`pieceOnSquare`) over the closed twelve-kind
  `StructuralFeature` union (`packages/runtime/src/structure.ts:13-35`), evaluated by
  `matchesStructuralExpression(fen, expression)` (`structure.ts:218`). A shape entry's trigger
  is exactly this type; this RFC adds **no** grammar branch and **no** feature kind.
- **The pack-side grading machinery ships.** `structural_feature` is a live success-condition
  kind — Pack B's objective already grades the minority attack by
  `all[ backward_pawn(black,c), half_open_file(white,c) ]`
  (`content/drafts/carlsbad-minority-attack.json` `/objective/successConditions/0`). Entries
  do not re-implement grading; a pack that wants to grade a plan writes its own condition,
  and §10b shows the entry and the condition carrying the same signature.
- **The cost is measured, not estimated.** The full structural reading plus delta over the
  Carlsbad position measured median **3.285 ms**, maximum 5.441 ms
  (`planning/structural-reading/log.md:23-25`). A single trigger evaluation is a strict subset
  of that work (a handful of feature checks instead of the full observation projection), so
  per-node evaluation of a small entry set is comfortably inside the shipped 100 ms worry /
  200 ms intervention envelope. §12 makes this a recorded measurement, criterion 13.
- **The expression validator ships; its export does not.** `structuralIssues` walks an
  expression for depth (cap 4), empty line spans, out-of-range outposts and negative counts
  (`apps/server/src/pack-validation.ts:89-113`) — but it is module-private today: the file
  exports only `validatePackDocument` and the issue types (`pack-validation.ts:507`). §3c
  reuses the walker by adding the `export` keyword (a one-line visibility change this RFC
  makes) rather than by copy — the D4 one-implementation lesson.
- **The naming catalogue ships as seed data.** `STRUCTURE_CATALOGUE`'s four entries with
  their provenance notes (`structure.ts:232-238`, `StructureId` at `:11`) are the rung-0
  naming layer. B9 §5b said the catalogue becomes B11's seed data; §10 does exactly that, with
  the one correction recorded under Deviations.
- **Withholding is enforced server-side and the projection omits what entries must not
  leak.** `projectPackDocument` (`apps/server/src/pack-registry.ts:65-121`) does not project
  `planClasses`, `successConditions`, spine annotations, deviations or claims;
  `feedbackDisclosed` (`packages/runtime/src/feedback.ts:3-18`) opens only on
  `checkpoint.reached`, `segment.completed`, `outcome.reached` or `feedback.revealed` events.
  §5's no-event decision means a marker cannot open it even by accident.
- **The channel and trust machinery ship.** Publication channel is derived from the resolving
  source and is not a document field; official ids are reserved; the provenance panel renders
  an allow-list, not the object (`docs/pack-studio.md`; `rfc/archive/pack-studio.md` §13c,
  ~line 1252). §3 and §9 apply the identical pattern to entries.
- **The client gap is real.** The session controller refuses position runs with *"the
  position player is not built yet"* (`apps/web/src/lib/session-controller.ts:180-185`), while
  the store beneath it already projects either session kind without a pack dependency
  (`docs/drill-client.md` §Feedback withholding) and the typed create body exists
  (`apps/web/src/lib/api.ts:228`). §8 closes exactly that gap and nothing more.

### 4. Scope boundary

Explicitly outside this RFC, each with its owner:

- **The LLM voice, guided mode, and its banding** — `design/05` §3b/§3b-i place them at B10 +
  the evidence-bound rendering contract. The marker panel renders the authored text; that is
  the design's own stated default ("the default is the authored text", §3b-i), and the
  re-voicing option arrives with B10's contract, not here.
- **Live phase classification, author-free pivotal detection, assistance configuration per
  session context** — B10 (`design/03-product-breadth.md:180-201`). This RFC adds no
  assistance switch anywhere, for the same reason B9 §7b refused one: B10's
  `assistanceConfig` must not have a twin.
- **Generated drill recipes** ("a drill is generated from position source + structural
  objective + resistance", gate B11's middle clause). The 2026-08-14 ruling kept hand-crafted
  drills first-class and packs referencing the library; the recipe clause predates the ruling
  and needs an owner-side restatement before anyone builds it. Recorded under Deviations with
  a proposed BACKLOG row; not built here.
- **Intent-relative grading** — unchanged from B9 §Scope: no intent is recorded anywhere, and
  entries do not change that.
- **Cross-pack concept identity** (`concepts` bare ids, B7 residual). A shape entry id is a
  first real cross-pack identity, but unifying `concepts` with entry ids is a separate
  contract; nothing here reads or writes `concepts`.
- **Review workflows.** None, ever — owner ruling 2026-08-13. Channel and provenance are the
  safeguard, here as for packs.

## Specification

### 1. The laws

Everything below is subordinate to these; the first two are inherited from B9 verbatim.

**1a. Detection is cheap and exact within its declared scope; significance is judgement and
must be attributed.** An entry's *trigger* is rung-0 arithmetic and may be stated flatly. An
entry's *plans, watch list and typical mistakes* are rung-5 authored claims and carry their
provenance, licence and channel wherever they render. The rendering keeps the two layers
visibly separate (§6b); a surface that blurs them is the dashboard `AGENTS.md` law 8 names.

**1b. The trigger language is B9's, closed.** A trigger and a success signature are
`StructuralExpression` values (`packages/runtime/src/structure.ts:30-35`), evaluated by the
shipped `matchesStructuralExpression`, validated by the shipped `structuralIssues` walker,
depth-capped at 4. This RFC adds no expression branch, no feature kind, and no second
evaluator. Where the vocabulary cannot express something (§10d's pawn census), the entry says
so instead of the grammar growing.

**1c. A firing is never persisted.** It is a pure function of a position already in the run
and the served library, so persisting it would create a second source of truth that drifts —
against the FEN never, but against the *library* the moment an entry re-versions. No run
event, no run-schema change, no session-journal entry, no cache. §5a is the full argument.

**1d. The marker never prescribes, never interrupts, never ranks.** Its label names the
structure; its panel names the plans; neither says what to play here (`design/05` §3b). It
never opens itself, never emits a run event, never becomes authoritative over a pack's
checkpoints or boundary, and multiple simultaneous firings render in canonical order, never
by importance.

### 2. The shape entry artifact

#### 2a. Type and schema

New module `packages/schema/src/shape-entry/types.ts`, new living schema
`schemas/shape_entry.schema.json` (`$id` `urn:chess-tabiya:schema:shape-entry:0.1`, Draft
2020-12, same conventions as the pack schema):

```ts
import type { StructuralExpression } from "@chess-tabiya/runtime";

export type ShapePhase = "opening" | "middlegame" | "endgame";

export interface ShapePlan {
  readonly id: string;                       // entry-unique slug
  readonly side: "white" | "black";
  readonly label: string;
  readonly description: string;              // what the plan is, generically — rung 5
  readonly success: {
    readonly note: string;                   // one sentence: what success looks like
    readonly signature: StructuralExpression | null; // null = no honest arithmetic exists
  };
}

export interface ShapeEntryDefinition {
  readonly id: string;                       // catalogue-unique slug, same grammar as pack ids
  readonly version: string;                  // semver, part of the digest
  readonly name: string;                     // "Carlsbad structure"
  readonly phases: readonly ShapePhase[];    // non-empty, unique
  readonly trigger: StructuralExpression;    // rung 0 — when the entry fires
  readonly plans: readonly ShapePlan[];      // non-empty; both sides' plans live here
  readonly watch: readonly string[];         // non-empty: what to watch, generically
  readonly typicalMistakes: readonly string[]; // non-empty
  readonly provenance: {
    readonly licence: string;                // e.g. "CC-BY-SA-4.0"
    readonly sources: readonly string[];     // non-empty; honesty strings live here
    readonly attribution: readonly {
      readonly title: string;
      readonly author: string;
      readonly url?: string;
      readonly licence: string;
    }[];                                     // may be empty — an explicit statement of
  };                                         // "wholly original", never an omitted key
}
```

Schema rules, all normative:

- **Every object is closed.** `additionalProperties: false` at every level, including
  `provenance`. The pack format's `provenance` passthrough is D25's whole hazard and it
  survives there only because narrowing would invalidate committed packs
  (`rfc/archive/pack-studio.md` §13c); this schema has no committed documents to protect, so
  it is born closed. Criterion 2 walks the schema and asserts **zero**
  `additionalProperties: true` sites — the pinned-inventory discipline of B9 criterion 12,
  applied from day one. D22 (`opponentPolicy` passthrough) has no analogue here because the
  entry has no policy field at all.
- **`success.signature` is a required key** whose value is an expression or `null`. An
  omitted signature and a signature nobody could write are two different facts, and the
  encoding refuses to conflate them: `null` is the author stating "no rules-arithmetic
  signature distinguishes this plan succeeding from it failing", which is B9 §10's
  kingside-attack precedent made a first-class encoding instead of a footnote.
- **`trigger` and every non-null `signature`** reference one shared
  `$defs/structuralExpression` copied structurally from the pack schema's
  (`schemas/drill_pack.schema.json` `$defs/structuralExpression`), including the
  `named_structure` id enum bound to the code catalogue. A test (criterion 2) asserts the two
  schemas' expression `$defs` are deeply equal, so the grammar cannot fork silently.
- **No pack anatomy.** There is no `start`, `spine`, `checkpoints`, `objective`,
  `deviations`, `opponentPolicy`, `feedbackPolicy`, or `authoredBoundary` — not omitted-but-
  tolerated, but unrepresentable: the closed schema refuses the keys. There is also **no
  machine-readable move or position field**: no UCI field, no SAN field, no move list, no
  FEN. That is a claim about the *encoding*, stated precisely because prose is not covered
  by it: §10a's plan descriptions name manoeuvres in SAN ("b4-b5", "...Ne4"), and may —
  the trigger pins the pawn skeleton, so those tokens denote the same squares in every
  position the entry can ever render on. What the schema refuses is a structured anchor
  that a renderer, grader, or future feature could ever treat as advice for the live
  position. An entry attaches to positions by predicate; a document that needs a move
  sequence is line content and belongs in a pack (`design/04` §0, "What line content is
  still irreducible for").
- Ids: `id` and `plans[].id` use the pack schema's `$defs/id` slug grammar; `plans[].id` is
  unique within the entry.

Prose fields (`description`, `watch`, `typicalMistakes`, `success.note`) are rung-5 authored
text and *may* carry valence — "slow, low-risk" is an authored judgement and that is what
rung 5 is for. What they must not do is prescribe for a live position. Prose *can* smuggle a
move — "push b4-b5" is a sentence, and no lint can read intent from sentences — so the
boundary is enforced by three named mechanisms, not by hope:

1. **One banned form is checkable and refused.** `SHAPE_PROSE_CONTAINS_FEN` (§3c): a
   FEN-shaped token in any prose field fails validation at load, lint, and registration. A
   FEN is the one token that provably binds prose to a single position, and an entry is
   constitutionally the artifact that has no single position. SAN tokens are deliberately
   **not** banned: a banned-form list cannot distinguish "b4-b5 is the plan in this
   structure" (the Carlsbad entry's legitimate content) from "play b4-b5 now", and refusing
   SAN would refuse the library's whole subject matter.
2. **The delivery frame is machine-checked.** §6b's fixed frame sentence — general to the
   kind, not advice for this one — renders above every plan on every surface, asserted
   verbatim by criterion 9. The scope statement is not a rule readers are asked to
   remember; it is part of the rendering contract.
3. **The render-everywhere property makes prescription self-falsifying.** An entry's prose
   renders identically at every position its trigger matches. Prose written as advice for
   one position is therefore visibly wrong somewhere the entry fires, which makes it an
   authoring-quality defect carried by channel and provenance — the rung-5 regime — not a
   withholding defect (§7 is unaffected: the prose was never position-specific feedback to
   withhold).

#### 2b. Digest and versioning

`digestShapeEntry` reuses the RFC 8785 canonicalizer and SHA-256 hashing verbatim — the
implementation is `canonicalizeJson` + `crypto.subtle.digest`
(`packages/schema/src/drill-pack/digest.ts:24-66`), exported from a shared location so the
pack and entry digests are one implementation with two entry points, returning
`sha256:<lowercase hex>` over the complete document including `version`. Key order never
changes identity.

Versioning mirrors packs (`docs/pack-studio.md`): `(id, version)` is immutable once
registered, versions increase, the first publisher owns a community id, official ids are
reserved, browsing resolves the newest version with official priority, and registered bytes
are retained by digest forever — account deletion tombstones ownership and keeps the bytes,
exactly the pack rule (`apps/server/src/storage.ts:762-765` pattern).

#### 2c. Where it lives

- Schema: `schemas/shape_entry.schema.json`.
- Types + digest: `packages/schema/src/shape-entry/`.
- Official content: `content/shapes/*.json` — four files in this RFC (§10).
- Validator: `apps/server/src/shape-validation.ts`, importing `structuralIssues` from
  `pack-validation.ts` — which this RFC exports; the walker is module-private today
  (§Motivation 3) — rather than copying it.
- Registry: `apps/server/src/shape-registry.ts` (§3a).
- Gate: `make shape-check FILE=<path>`, exit-code semantics identical to `pack-check`
  (`Makefile` precedent, B9 criterion 5 style).

### 3. Registry, channels, HTTP

#### 3a. `ShapeRegistry`

Mirrors `PackRegistry`'s structure (`apps/server/src/pack-registry.ts:203-382`): official
entries load fail-fast from `content/shapes/` at startup; community entries hydrate from
`registered_shapes` (migration 10); records are frozen; resolution is by id (newest visible,
official priority) and by digest (exact bytes). **Channel is derived from the resolving
source and is not a document field** — the entry schema has no `channel` key to forge, and
the projection stamps it server-side, the identical mechanism packs use
(`docs/pack-studio.md` §Sources and publication channels). The server constructs the shape
registry **before** the pack registry, because pack validation resolves shape references
against it (§4b).

#### 3b. Routes and the rendering allow-list

| Route | Result |
|---|---|
| `GET /shapes` | summaries: `id`, `version`, `digest`, `name`, `phases`, `licence`, `channel`, `publisherHandle?` |
| `GET /shapes/:id` | the full projected entry plus `x-shape-digest`; `SHAPE_NOT_FOUND` otherwise |

Unlike a pack, a shape entry is learner-facing **in its entirety by design** — there is
nothing to withhold, because nothing in it is an answer to any particular run (§7 is the
argument). The projection is still a written allow-list function, `projectShapeEntry`,
enumerating every key of §2a explicitly: the D25 lesson is that projections that return the
object whole are how a future field reaches a learner unreviewed
(`rfc/archive/pack-studio.md` §13c), and the closed schema plus the allow-list is belt plus
braces at a cost of one function. The client renders entries **only** through a
`renderShapeEntry` module with the same enumerated keys; community entries carry the channel
adjacent to the name on every surface where the entry renders, the four-surfaces rule packs
established.

#### 3c. Load-time refusals

In `shape-validation.ts`, `runtimeIssue` style (`pack-validation.ts:76-82`), each with a
fixture under `schemas/fixtures/shape-entry/` and a `make shape-check` exit-code assertion:

| Code | Path | Fires when |
|---|---|---|
| `SHAPE_TRIGGER_TRUE_AT_INITIAL` | `/trigger` | The trigger matches the standard initial position. Such an entry fires on move zero of every game ever played, which is an authoring error, not a shape — the `CHECKPOINT_TRUE_AT_ROOT` precedent (`pack-validation.ts:488`) one artifact up |
| `STRUCTURAL_EXPRESSION_TOO_DEEP` | `/trigger`, `…/signature` | Reused code, reused walker, same depth cap of 4 |
| `LINE_SPAN_EMPTY`, `OUTPOST_RANK_OUT_OF_RANGE`, `NEGATIVE_FEATURE_COUNT` | `…` | Reused from the shared walker, identical semantics |
| `SHAPE_PROSE_CONTAINS_FEN` | the offending prose field | Any prose field (`description`, `watch[]`, `typicalMistakes[]`, `success.note`) contains a FEN-shaped token (a run of eight `/`-separated rank fields). Prose that cites a concrete position is bound to that position, which an entry constitutionally is not; the position belongs in a pack or in the trigger's arithmetic (§2a's enforcement 1) |
| `SHAPE_DUPLICATE_PLAN_ID` | `/plans/<i>/id` | Two plans share an id |
| `SHAPE_PLAN_SIDES_ONE_WAY` | `/plans` | Every plan belongs to one side. The ruling's phrase is "the plan classes **both sides** own" (`design/04` §0); an entry that only tells one side what to do is half an entry, and refusing it at load is cheaper than every reviewer catching it |

`named_structure` ids inside a trigger or signature are constrained by the schema enum bound
to the code catalogue, exactly as in packs — an unknown id is a schema failure, not a runtime
one.

### 4. Pack references — schema 0.11

#### 4a. Two additive fields

`DRILL_PACK_SCHEMA_VERSION` `0.10 → 0.11` (`packages/schema/src/index.ts:2`) and the schema
`$id`. Two additions, both optional:

1. Top-level `shapes?: readonly string[]` — unique, non-empty entry ids: the shapes this pack
   teaches. This is the pack "naming the shapes it teaches instead of restating them"
   (`design/04` §0a, "What changes, minimally").
2. `planClass` gains `shapePlan?: { readonly shape: string; readonly plan: string }` — this
   authored plan class *is* that entry's plan, rendered from the library at reveal time with
   the pack's own `description` kept as the position-specific residue (§7).

Top-level `additionalProperties` stays `false` (`schemas/drill_pack.schema.json:89`), which
is why the fields need the version bump at all: 0.10 rejects unknown keys, correctly.

#### 4b. Validation and resolution

New codes in `pack-validation.ts`:

| Code | Path | Fires when |
|---|---|---|
| `SHAPE_REFERENCE_UNKNOWN` | `/shapes/<i>` | The id resolves to no entry in the shape registry. Checked at server load for repo packs and at studio registration for community packs; because registered entries are retained forever (§2b), a reference that was valid at registration cannot dangle later |
| `SHAPE_PLAN_REF_UNLISTED` | `/planClasses/<i>/shapePlan` | `shapePlan.shape` is not in the pack's `shapes` array — the reference list is the pack's complete shape surface, and a link that bypasses it is a silent second channel |
| `SHAPE_PLAN_UNKNOWN` | `/planClasses/<i>/shapePlan` | The referenced entry resolves but has no plan with that id **at registration/load time** |

Version skew is resolved at serve time, honestly: `shapePlan` resolves against the newest
visible entry version. If a later entry version renamed the plan, the reveal renders the
pack's own `description` plus the entry's name and drops the dead link — degrade, never
block a run on library drift, and never resolve to a guessed plan. (Boundary table, §11.)

#### 4c. Migration posture for the three authored packs

**`planClasses` stays a valid, fully supported field forever.** Nothing is deprecated,
removed, or warned about. References are additive; a pack with inlined plan classes and no
`shapes` key is the shipped format working as designed. That is the ruling's "packs survive"
made mechanical.

The three draft packs change as follows, in this RFC:

- **Pack B** (`carlsbad-minority-attack.json`) — the worked example, §10b: gains
  `"shapes": ["carlsbad"]`, its three plan classes gain `shapePlan` links, and their
  descriptions are trimmed to the position-specific residue.
- **Pack C** (`rook-4v3-same-side.json`) — gains `"shapes": ["rook-4v3-same-side"]` and
  `shapePlan` links on its four defender plan classes.
- **Pack A** (`anti-caro-advance.json`) — **untouched.** No official entry exists yet for its
  structure family; references are optional and adding a hollow one would be reference
  theatre.

**Digest accounting, stated exactly.** Pack digests are content digests over the document
bytes (`digest.ts:58-66`); the schema `$id` is not part of any pack document, so the 0.11 bump
by itself moves **no** digest — `schemas/drill_pack.example.json` and every registered
community pack keep their digests, asserted by criterion 4. The two *edited* drafts get new
digests, which is the ordinary consequence of editing a document: drafts under
`content/drafts/` are development-mode-only files reloaded each start
(`pack-registry.ts:277-293`), and a development run pinned to a superseded draft digest fails
with `PACK_UNRESOLVABLE` rather than silently degrading — the shipped lifecycle
(`docs/pack-studio.md` §Digest-addressed resolution), not a new hazard. No registered or
official-catalogue digest moves.

### 5. Firing: a derived projection, not an event

#### 5a. The decision, argued both ways and pinned

A match could be recorded three ways: a run event (`structure.fired` in the event log), a
session-journal entry, or a derived projection computed wherever it is displayed. **This RFC
pins the derived projection.**

The steelman for a run event, at full strength: it is durable — replay would show exactly
which markers a learner was shown, under exactly which library version. And the drift
objection has a known answer in this repo: pin by digest. A `structure.fired` event carrying
the entry digest would never drift, because registered bytes are retained forever (§2b) and
digest-addressed resolution is the shipped pattern — a run already pins its *pack* by digest
and fails `PACK_UNRESOLVABLE` rather than silently degrading. Analytics and future SRS could
read it; and "the run is the sole source of chess truth" (`design/05` §1) sounds at first
like an instruction to put things *in* the run.

Why it loses anyway, on five grounds:

1. **The pack-digest pin earns its cost; a firing pin would not.** The run pins its pack
   because verdicts, disclosure, and grading all depend on the pack's exact bytes — replay
   without them cannot say what happened. A digest-pinned firing record is technically
   drift-free, but what it buys is fidelity for a fact that gates nothing and grades
   nothing (ground 5), at the price of a permanent resolution obligation on every replay
   surface. An *unpinned* record is worse than nothing: a recorded `structure.fired` for
   entry v1 rendered under entry v3 is a stale claim wearing an authoritative event
   costume. So the choice is expensive-and-faithful or cheap-and-wrong — while recompute
   is cheap *and* always attributed to the version actually served. B9 law 1c already
   decides the class: a pure function of a FEN already in the run does not get a second
   home.
2. **The invariant cuts the other way.** *The run is the sole source of chess truth* means
   everything in the run log **is** chess truth — moves, verdicts, disclosures, replayable.
   A marker is not chess truth: the trigger match is (and is recomputable from the FEN at
   3 ms), but the marker as an artifact is a naming convention plus authored claims, rung 5
   riding rung 0. Writing it into the run log dilutes what the log means, exactly the way
   the session journal was kept out: session machinery "may never alter what the run says
   happened on the board" (`design/05` §1, scoped 2026-08-14).
3. **The precedent is one shelf over — twice.** Line-drill membership verdicts are
   "read-back projections, not events" (`docs/branch-runtime.md` §Derived Line Drill
   state) for the same reason: derivable facts do not get event rows. And the structural
   reading control itself — the rung-0 layer these markers ride on — is recomputed with
   the current evaluator whenever a learner opens it on any historical node; nobody
   records which observations were viewed. Persisting firings would make the marker
   *more* historically authoritative than the arithmetic it is derived from.
4. **The event vocabulary is closed and expensive.** Run schema 0.8's event list
   (`docs/branch-runtime.md` §Events) grows only with a schema bump, replay-validation
   rules, and a migration — real cost, for a fact whose recomputation is measured at
   milliseconds.
5. **Nothing downstream needs the record.** Disclosure gating needs events because
   withholding is stateful; the marker gates nothing and is public (§7). "Did the learner
   open it" is a telemetry question, and telemetry does not buy its way into the run log.

The session journal loses faster: it exists for possession machinery in live sessions
(`docs/live-sessions.md`), most runs have no session journal at all, and a marker is not
possession.

What is knowingly given up, stated at full width: **replaying an old run does not show what
the learner saw.** It shows the current library's reading of the historical positions — the
marker set may differ because entries were re-versioned, added, or withdrawn since. Two
consequences are normative: every surface presents markers as a present-tense reading of
the position, attributed to the entry version actually served (the panel's provenance
block, §6b), and no surface may claim to reconstruct the historical marker experience —
such a surface would need its own store, and when B10's adaptive layer or a future SRS
needs "seen" facts, that RFC designs that store with its own honesty rules. Pre-paying for
it here with run-log pollution is the wrong currency.

#### 5b. `shapeFirings`

New pure module `packages/runtime/src/shape-firing.ts`:

```ts
export interface ShapeTriggerSource {
  readonly id: string;              // entry id
  readonly trigger: StructuralExpression;
}

export interface ShapeFiring {
  readonly entryId: string;
  readonly firstNodeId: string;     // first node of a maximal contiguous matching span
  readonly lastNodeId: string;      // last matching node of that span (may equal first)
  readonly openEnded: boolean;      // true when the span includes the path's final node
}

/** Pure. Evaluates each entry's trigger against every node FEN on the given path
 *  (root first) and returns maximal contiguous matching spans, in entry-id order,
 *  then span order. No I/O, no persistence, no ranking. */
export function shapeFirings(
  entries: readonly ShapeTriggerSource[],
  path: readonly { readonly id: string; readonly fen: string }[],
): readonly ShapeFiring[];
```

Semantics, all normative:

- **Edge-triggered spans.** A firing is a *maximal contiguous* run of path nodes where the
  trigger holds. The marker anchors at `firstNodeId`. A structure that dissolves and later
  re-forms on the same path is two spans and two markers — both true, neither ranked.
- **Per active path.** Firings are computed over the path from root to the cursor (the same
  path every other read-back uses). A sibling branch computes its own; nothing is inherited
  across branches, matching the resistance-attribution rule
  (`docs/branch-runtime.md` §Objective state machine, last paragraph).
- **Canonical order.** Entry-id ascending, then span start ascending. Never by "importance",
  which does not exist at this layer (B9 §4b's argument, inherited).
- Determinism: byte-identical output for identical inputs; asserted by test.

The client evaluates incrementally in practice — the new node's FEN against each applicable
trigger on every commit/poll — but the pure function over the whole path is the specified
semantics and the test surface; incremental evaluation is an implementation detail that must
agree with it.

#### 5c. The applicable entry set

| Session | Entries evaluated |
|---|---|
| Position run (Just Play, from-position) | **every entry in the served catalogue** (`GET /shapes`) |
| Pack run | **exactly the pack's `shapes` references** — no more |
| Live/spectator views of either | same rule as the underlying run kind; a firing is a pure function of positions the viewer already sees, so nothing leaks |

The pack restriction is deliberate and load-bearing: a curated drill chose its curriculum,
and the settled recognition rule is that recognition is "never authoritative over curated
pack boundaries" (`design/03-product-breadth.md:319-320`). Firing the whole library inside a
drill would let an unreferenced entry name mid-drill what the pack's own withheld checkpoint
prose is about to teach on its own schedule. In Just Play there is no author to defer to, and
the catalogue is the whole point.

#### 5d. Cost

Per committed node: |applicable entries| trigger evaluations, each a strict subset of the
measured 3.285 ms full reading (§Motivation 3). Four official entries evaluated on every ply
of a Just Play game is well under a millisecond of arithmetic per move in the same process
that already runs the structural reading on demand; criterion 13 records the real number in
the latency artifact rather than asserting an unsourced microbenchmark, B9 criterion 14's
discipline.

### 6. The marker and the panel

#### 6a. The timeline marker

`Timeline.svelte` (checkpoint markers at `apps/web/src/lib/Timeline.svelte:30-44`) gains a
second, visually distinct marker kind anchored at each firing's `firstNodeId`:

- Label: the entry `name`, with the channel adjacent for community entries (§3b).
- **A root anchor is added, because none exists.** The shipped timeline lists only move
  plies — `timelineEntries` drops the root node (`apps/web/src/lib/screen-model.ts:112-133`
  returns nothing for a node with no move) — so a span that begins at the start position
  (Pack B's ply-0 firing, criterion 11a) has no row to sit on today. The timeline gains a
  start-position row (ply 0, no move label) rendered exactly when at least one marker
  anchors at the root, and absent otherwise; it carries markers and position preview,
  nothing else — no rewind restyling, no checkpoint semantics.
- **Passive**: it never opens itself, never modals, never pauses play, never steals focus.
  Clicking it opens the panel; nothing else happens.
- It is *visible by default* — that is the ruled delivery ("a passive timeline marker that
  opens to the named plans"), and it is a deliberate step louder than B9's closed
  no-badge disclosure control, which stays exactly as it is
  (`DrillScreen.svelte:470-471`). The two coexist: the reading control is the learner
  pulling rung-0 sight; the marker is the library announcing, quietly, that it has
  something. The ruling ordered the second; B9's §7b posture governs the first; neither
  amends the other.
- No per-learner toggle ships here. When assistance configuration exists it is B10's
  `assistanceConfig`, singular (§Motivation 4).

#### 6b. The panel: two layers, seam visible

Opening a marker renders `ShapePanel.svelte` with a fixed two-part structure, top to bottom:

1. **Detection (rung 0).** The entry name as a detection statement, sourced to rules
   arithmetic: for catalogue-triggered entries the entry name plus the catalogue
   provenance note — the shipped `named_structure` branch renders the note, not a name
   (`apps/web/src/lib/structural-sentences.ts:24`; the observation carries no id), so the
   panel supplies the name and the branch supplies its provenance sentence; for
   raw-expression triggers the fixed frame "Tabiya's shape trigger for *<name>* matches
   this position." Flat, verdict-free, in B9's no-valence register.
2. **Authored plans (rung 5).** Under a mandatory fixed frame sentence, machine-checked by
   criterion 9:

   > *Named plans for this structure — general to the kind of position, not advice for this
   > one.*

   Then, per plan, grouped by side in document order: label, description, the success note
   (with the signature rendered through a fixed template — "Success, structurally: …" —
   when a signature exists, and the note alone when `signature: null`), then the entry's
   watch list and typical mistakes, then the provenance block: entry id/version, channel,
   licence, attribution list — rendered through the §3b allow-list, nothing else.

   The signature sentence is **new code, stated as such**: the shipped sentence layer
   renders *observations* — position-anchored facts carrying squares and counts
   (`renderStructuralObservation`, `apps/web/src/lib/structural-sentences.ts:6-27`) — and
   cannot take an expression: feature *specs* carry no `squares` array, `pieceOnSquare` is
   not an observation kind at all, and `all`/`any`/`not` have no sentences. This RFC adds
   `renderStructuralExpressionSpec` beside it, enumerating the closed grammar once: leaf
   sentences in the observation register's flat vocabulary, `all` joined with "and", `any`
   with "or", `not` prefixed "not:", bounded by the depth-4 cap so composition never
   nests unreadably. Criterion 9 asserts it renders both Carlsbad signatures and accepts
   every expression the schema admits.

The seam between 1 and 2 is the product's honesty made visible: the detection could not be
wrong within its stated scope and says so plainly; the plans are somebody's judgement and
wear their name. This is `design/05` §3b's permitted column delivered in full — B9 shipped
the naming half and left "the honest silence where the second half will go"
(`rfc/structural-reading.md` §5c); this is the second half.

#### 6c. What the marker never does

- **Never emits anything.** No run mutation, no event, no journal write. Opening a marker
  leaves `GET /runs/:id/events` byte-identical — criterion 8 asserts it.
- **Never touches disclosure.** `feedbackDisclosed` reads only the four event types
  (`feedback.ts:3-18`); since no event exists, the barrier cannot move. Proven by
  construction, asserted anyway.
- **Never becomes a rewind target or a checkpoint.** It decorates a node; rewind-to-node
  exists independently and is not restyled here.
- **Never ranks.** Multiple entries firing at one node render as multiple markers in
  canonical order; the panel never says one matters more.
- **Never renders on unplayed territory.** Firings are computed over played path nodes
  only; there is nothing to compute on spine positions the run has not reached, so a marker
  cannot foreshadow authored content (§7).

### 7. Firing inside a drill: withholding, exactly

A pack run shows markers for its referenced entries (§5c), and the panel shows entry content
only. The withholding analysis, stated field by field because this is the failure class that
matters:

- **What stays withheld, unchanged:** spine annotations, deviation notes, feedback claims,
  checkpoint triggers, `successConditions`, and inlined `planClasses` — all absent from the
  browser projection today (`pack-registry.ts:65-121`) and still absent; this RFC touches
  that projection only to keep `shapes` ids in it (the reference list is catalogue
  metadata, not an answer). Criterion 7 re-asserts the projection contract against Pack B.
- **What the entry adds, and why it is not a leak:** the entry's content is generic to the
  structure, position-independent by construction (§2a: no moves, no FENs), published in a
  public library, and named by `design/05` §3b as the *permitted* column. Pack B's
  projected `objective.summary` already tells the learner more about this specific run than
  the entry does — it names the exact target structure in prose. The entry cannot contain
  this pack's answer because it cannot contain any pack's anything.
- **Double-delivery is resolved by reference, not by rule-of-thumb.** At an intent-capture
  checkpoint reveal, a `plan_class` item whose plan class carries `shapePlan` is projected
  with that reference (`authored-feedback.ts:286-298` gains the passthrough), and the
  client renders the entry plan once — from the library — with the pack's trimmed
  `description` as the position-specific note beneath it. The same plan is never rendered
  twice from two sources, because after extraction the pack no longer contains the generic
  text (§10b). A pack that keeps fully inlined plan classes and no references (Pack A)
  renders exactly as today.
- **Timing:** the marker (and its panel) is available from the moment its trigger holds on
  the played path — for Pack B that is ply 0, since the tabiya *is* a Carlsbad — while the
  pack's plan-class reveal stays gated on the checkpoint occurrence and reveal machinery,
  unchanged. Naming the structure before the checkpoint is §3b-permitted; the pack's
  position-specific teaching still arrives when the pack says it does.

### 8. Just Play: the minimal position player

The acceptance demands a browser Just Play game; the client refuses to play one
(`session-controller.ts:180-185`). The server side shipped with F2 — position sessions,
`attempt_end` reveal, the pack-free selector (`opponent-selector.ts:186-210` builds from
`startFen` + history) — and `RunStateStore` already projects either session kind. What this
RFC ships is deliberately the smallest honest player over that machinery:

- **Entry.** The Play route gains a "Just Play" starter beside the pack list: side picker,
  optional FEN (validated as legal standard chess, initial position default), opponent
  policy (`human_common` default, `strong_engine` selectable), creating the run via the
  existing typed position create body (`api.ts:228`) and navigating to `/play/run/:id`.
- **Player.** `session-controller.ts` replaces the refusal branch with a position-session
  path: no pack fetch; board, timeline, branch rail, compare, PGN and the structural
  reading control all work off the existing store contracts; the objective region states
  the honest absence — "No pack is loaded. Nothing is claimed about this position." — per
  `design/05` §2 region 1; the `attempt_end` reveal button calls the shipped `/reveal`;
  authored-feedback surfaces do not render (the server already returns the honest empty
  page for position runs, `docs/drill-client.md`).
- **Opponent loop.** The controller's `#selectionRequest` is pack-shaped today: it reads
  `pack.start.fen` and `pack.opponentPolicy`, and passes the pack digest as
  `policyConfigDigest` plus `packId` (`session-controller.ts:407-433`). The position path
  builds the same request from the run's own `run.started` data, which carries everything
  needed — `start.fen`, the recorded `opponentPolicy`, the recorded `policyConfig`, and
  `sessionDigest` (`packages/runtime/src/types.ts:123-139`): `startFen` from the run's
  start, policy fields from the recorded `opponentPolicy`, the run's `sessionDigest` as
  `policyConfigDigest` (the server treats it as an opaque cache-key component,
  `opponent-selector.ts:180-183`), and `packId` omitted (`selectionCacheKey` already
  defaults it to the empty string). Nothing changes server-side: the pack-free selector
  replays `startFen` + history as shipped (`opponent-selector.ts:186-210`).
- **Capabilities.** The shell's surface table hardcodes `justPlay` and `fromPosition` to
  `"unavailable-here"` (`apps/server/src/capabilities.ts:118-127`). This RFC flips both to
  follow the opponent provider exactly as the `play` row does — available when an opponent
  engine is present — in the same change that ships the player. A player behind a surface
  the server still declares unavailable is not shipped.
- **Markers** per §5/§6, evaluated against the full served catalogue.

Out of scope for the player: PGN import, shared-URL starts, Arena integration, opponent
rating controls beyond the shipped policy fields — those are their own surfaces and none is
needed to make a shape fire in a game nobody authored.

### 9. Authoring path: the studio writes entries too

Community entries are studio-authored by construction — the repo ships official ones, and
there is no third path.

- **Routes**, mirroring the pack draft surface (`docs/pack-studio.md` §HTTP and client):
  `GET/POST /shapes/drafts`, `GET/PUT /shapes/drafts/:id` (owner-scoped; `PUT` requires
  `If-Match`, stale editors get `DRAFT_STALE` with the current digest),
  `POST /shapes/drafts/:id/lint`, `POST /shapes/drafts/:id/register`,
  `GET /shapes/:id/export`.
- **Lint** runs schema + `shape-validation.ts` and accepts an optional `probeFen`: the
  response reports whether the draft's trigger matches that position. That is the whole
  "playtest" an entry needs — it has no run to play — and it makes the authoring loop
  concrete: paste the position you mean, see whether your trigger sees it.
- **Registration** requires a validation-clean document with non-empty
  `provenance.sources` and `licence`; stamps nothing into the document (channel is derived,
  §3a); `(id, version)` immutable; official ids reserved; **no review workflow** — channel
  plus provenance is the safeguard, the 2026-08-13 owner ruling applied unchanged.
- **Storage: migration 10**, `STORAGE_VERSION` 9 → 10: `shape_drafts` (owner-scoped,
  digest-based optimistic concurrency, `draft|withdrawn|registered` states) and
  `registered_shapes` (immutable rows, digest-resolvable), create-table/index only, plus
  account-deletion behaviour identical to packs: mutable drafts withdrawn, ownership
  tombstoned to the legacy learner, published bytes and publisher handle retained.
- **`/create`** gains the shape editor alongside the pack editor: the real JSON document,
  validation issues with paths, the `probeFen` lint, and registration. A low-level
  instrument, like the pack editor, on purpose.

**Licence posture.** Official entries publish under **CC-BY-SA-4.0**, with `attribution`
carrying any upstream sources (the `design/04` sourcing map names Wikibooks CC BY-SA as the
reusable-idea quarry, and share-alike then obliges the derived entry; entries with no
external source still publish BY-SA for uniform reuse). Community entries declare their own
`licence`; registration refuses an empty one. Attribution is *encoded* — typed
`{title, author, url?, licence}` rows rendered in the panel's provenance block — not buried
in free text.

### 10. The first official entries, and the Carlsbad extraction

Four entries ship in `content/shapes/`. The B9 catalogue seeds three of them: the entry ids
`carlsbad`, `iqp-white` and `iqp-black` deliberately match `StructureId`
(`structure.ts:11`), and their triggers are `named_structure` leaves, so the code
catalogue's arithmetic and the content entry's plans stay one definition apart with no
duplication. The IQP ships as its two orientations exactly as the catalogue does — plans
carry absolute colours and squares, and mirroring an entry is cheaper and clearer than a
relative-colour grammar nobody else needs. The fourth entry has no catalogue id and writes
its trigger raw, which is the general case community authors will live in.

#### 10a. `content/shapes/carlsbad.json` — the worked example, in full

```json
{
  "id": "carlsbad",
  "version": "0.1.0",
  "name": "Carlsbad structure",
  "phases": ["middlegame"],
  "trigger": { "kind": "feature", "feature": { "kind": "named_structure", "id": "carlsbad" } },
  "plans": [
    {
      "id": "white-minority-attack",
      "side": "white",
      "label": "Minority attack",
      "description": "Two queenside pawns advance against three (a-pawn and b-pawn, aiming for b5). The aim is not material: it is to force a structural concession on c6. If Black allows bxc6 bxc6, the c6 pawn is backward on a file where White has no pawn at all, and it stays a target into the ending. Slow and low-risk.",
      "success": {
        "note": "A backward Black c-pawn standing on a file that is half-open for White.",
        "signature": {
          "kind": "all",
          "of": [
            { "kind": "feature", "feature": { "kind": "backward_pawn", "color": "black", "file": "c" } },
            { "kind": "feature", "feature": { "kind": "half_open_file", "color": "white", "file": "c" } }
          ]
        }
      }
    },
    {
      "id": "white-central-break",
      "side": "white",
      "label": "Central break",
      "description": "Prepare f3 and e3-e4 with a rook behind the e-pawn. Trading in the centre turns the position from a slow structural game into a piece game — at the cost of a loosened king and a queenside that stays home.",
      "success": {
        "note": "The centre opens on White's terms with the break fully prepared. No rules-arithmetic signature distinguishes a working break from a wasted one; success here is piece activity, which detection cannot score.",
        "signature": null
      }
    },
    {
      "id": "white-kingside-attack",
      "side": "white",
      "label": "Kingside attack",
      "description": "Reroute a knight toward the kingside and create a hook: when a Black knight arrives on g6, h4-h5 gains a tempo and opens a line. The most committal plan — the advancing pawns are the king's own cover and cannot come back.",
      "success": {
        "note": "An opened line against the Black king with the attack still ahead of the defence. No rules-arithmetic signature exists; manufacturing one would be a judgement wearing arithmetic.",
        "signature": null
      }
    },
    {
      "id": "black-piece-trades",
      "side": "black",
      "label": "Trade pieces",
      "description": "Simplify — a well-timed ...Ne4 is the classic device. The minority attack creates a weakness that then has to be attacked by somebody; the fewer attackers remain, the cheaper the concession.",
      "success": {
        "note": "Minor pieces leave the board before the queenside concession is forced. Detection cannot count what a trade was worth; no signature is claimed.",
        "signature": null
      }
    },
    {
      "id": "black-queenside-freeze",
      "side": "black",
      "label": "Freeze the queenside",
      "description": "Stop b4 before it happens with ...a5. It works as far as it goes: the b5 and b6 squares are permanently softer, and the a5 pawn is one more thing to look after.",
      "success": {
        "note": "The b4 advance is prevented while the concession on c6 never appears. The absence of a future advance is not decidable from one position; no signature is claimed.",
        "signature": null
      }
    },
    {
      "id": "black-central-counter",
      "side": "black",
      "label": "Central counter-break",
      "description": "Answer wing play in the centre with ...c5 (or ...e5 where the e-pawn survives), ignoring the wing and fighting where Black's pieces point.",
      "success": {
        "note": "The c-file tension resolves without leaving a backward pawn: the signature is that White's target never appears.",
        "signature": {
          "kind": "all",
          "of": [
            { "kind": "not", "of": { "kind": "feature", "feature": { "kind": "backward_pawn", "color": "black", "file": "c" } } },
            { "kind": "not", "of": { "kind": "pieceOnSquare", "square": "c6", "piece": { "color": "black", "role": "pawn" } } }
          ]
        }
      }
    }
  ],
  "watch": [
    "The attacker/defender count on b5 before the pawn ever goes there — the push works exactly when the counts match.",
    "Which rook commits to which file: the rook that goes to b1 is the one that will not support e4.",
    "Whether the c6 pawn still has a pawn neighbour able to defend it."
  ],
  "typicalMistakes": [
    "Switching plans mid-stream: the tempi spent on one plan are not refunded by the next.",
    "Pushing b5 after a piece that covered it has moved away.",
    "Playing the central break before it is prepared, handing Black the open lines."
  ],
  "provenance": {
    "licence": "CC-BY-SA-4.0",
    "sources": [
      "Extracted from content/drafts/carlsbad-minority-attack.json planClasses and annotations (Tabiya, this repository).",
      "UNGROUNDED: the three-White-plan taxonomy and every strategic claim here inherit Pack B's provenance: agent-authored prose with no citation, no engine evaluation, no corpus frequency and no human review. The pack's graduation blockers apply to this entry equally."
    ],
    "attribution": [
      {
        "title": "Carlsbad structure: the minority attack and its rivals (drill pack)",
        "author": "Tabiya",
        "licence": "CC-BY-SA-4.0"
      }
    ]
  }
}
```

Note what the extraction preserves on purpose: Pack B's honesty strings. The pack's
provenance says its taxonomy is uncited; the entry now carries the same debt in its own
`sources`, because moving prose between artifacts must move its epistemic status with it.

#### 10b. Pack B, before and after

**Before** (shipped today): `/planClasses/0` is
`{ "id": "minority-attack", "label": "Minority attack (a3, Rab1, b4-b5)", "description":
"Two queenside pawns advance against three. The aim is not to win material: … Slow,
low-risk, and the plan the rest of your pieces already support." }` — generic Carlsbad
teaching locked inside one pack, revealed only through this pack's checkpoint.

**After** (this RFC's edit):

```json
"shapes": ["carlsbad"],
"planClasses": [
  {
    "id": "minority-attack",
    "label": "Minority attack (a3, Rab1, b4-b5)",
    "shapePlan": { "shape": "carlsbad", "plan": "white-minority-attack" },
    "description": "In this tabiya the plan is already supported: Nc3 and Bd3 both bear on b5 before the pawn ever gets there, which is why it is the pack's main line."
  },
  {
    "id": "central-break",
    "label": "Central break (f3 and e3-e4)",
    "shapePlan": { "shape": "carlsbad", "plan": "white-central-break" },
    "description": "The reason the knight went to e2 rather than f3: the f-pawn is free to support e4. Here the break needs f3, a rook to e1, and only then e4."
  },
  {
    "id": "kingside-attack",
    "label": "Kingside attack (Ng3, the g6 hook, h4-h5)",
    "shapePlan": { "shape": "carlsbad", "plan": "white-kingside-attack" },
    "description": "In this position h7 starts with three defenders, so the attack is a plan to change that count — h4-h5 only gains a tempo once a Black knight has come to g6."
  }
]
```

The split is legible: what survived in the pack is *about these squares in this tabiya*
(which pieces already bear on b5; why this knight is on e2; how many defenders h7 has
*here*); what moved to the entry is true in every Carlsbad. The pack's objective, spine,
checkpoints, deviations and claims are untouched; its `successConditions` signature and the
entry's `white-minority-attack` signature are the same expression, which is the
authored-and-computed-are-one-layer claim of `design/05` §5c holding across the artifact
boundary. The intent-capture checkpoint still lists the same `planClassIds`; at reveal, each
plan renders once — entry content from the library, the pack's residue beneath it (§7).

#### 10c. `iqp-white.json` and `iqp-black.json`

Mirrored entries, `phases: ["middlegame"]`, triggers
`{ "kind": "feature", "feature": { "kind": "named_structure", "id": "iqp-white" } }` (and
`iqp-black`). Plans for `iqp-white` (four; the mirror swaps colours and squares d4/d5):

- `white-piece-attack` (side white): the isolani's side keeps pieces on and attacks — the
  pawn buys the e5/c5 outposts and open lines; success `signature: null` (attacking success
  is not arithmetic; note says so).
- `white-d5-break` (side white): the d4-d5 advance at the moment it costs most; success
  note "the isolated pawn is no longer isolated or has left the board with lines opened";
  `signature: null` with the honesty note (post-break structures vary too widely for one
  expression; enumerating them would be `pawnStructure`-style brittleness).
- `black-blockade-and-trade` (side black): a knight on the square in front, pieces off;
  success signature: `all[ pieceOnSquare(d5, black knight),
  feature(isolated_pawn(white, d)) ]` — the blockade, exactly, in shipped vocabulary.
- `black-convert-the-endgame` (side black): steer to endings where the pawn is a weakness,
  not a spearhead; success `signature: null`, note: "material simplification with the
  isolani surviving — piece-count census is outside the trigger vocabulary and is not
  claimed."

Watch lists: the d5 square's occupation and its attacker/defender counts; whether trades
have crossed the line past which the pawn is weak. Typical mistakes: blockading with the
wrong piece; trading into the attack; allowing d4-d5 for free. Provenance: CC-BY-SA-4.0,
agent-authored, explicitly marked UNGROUNDED in `sources` in the Pack B manner — these two
entries have no pack to inherit from and say so.

#### 10d. `rook-4v3-same-side.json` — a raw trigger, and the census stated honestly

Extracted from Pack C (`content/drafts/rook-4v3-same-side.json`), whose four defender plan
classes become entry plans with `side: "black"` and whose attacker side is authored fresh
(the entry owns both sides; Pack C only ever taught the defence). `phases: ["endgame"]`.

Trigger — no catalogue id exists, so it is written in raw vocabulary:

```json
{
  "kind": "all",
  "of": [
    { "kind": "feature", "feature": { "kind": "piece_reach_count", "color": "white", "role": "rook",   "scope": "any", "comparison": "atLeast", "count": 0 } },
    { "kind": "feature", "feature": { "kind": "piece_reach_count", "color": "black", "role": "rook",   "scope": "any", "comparison": "atLeast", "count": 0 } },
    { "kind": "not", "of": { "kind": "any", "of": [
      { "kind": "feature", "feature": { "kind": "piece_reach_count", "color": "white", "role": "queen",  "scope": "any", "comparison": "atLeast", "count": 0 } },
      { "kind": "feature", "feature": { "kind": "piece_reach_count", "color": "black", "role": "queen",  "scope": "any", "comparison": "atLeast", "count": 0 } },
      { "kind": "feature", "feature": { "kind": "piece_reach_count", "color": "white", "role": "bishop", "scope": "any", "comparison": "atLeast", "count": 0 } },
      { "kind": "feature", "feature": { "kind": "piece_reach_count", "color": "black", "role": "bishop", "scope": "any", "comparison": "atLeast", "count": 0 } },
      { "kind": "feature", "feature": { "kind": "piece_reach_count", "color": "white", "role": "knight", "scope": "any", "comparison": "atLeast", "count": 0 } },
      { "kind": "feature", "feature": { "kind": "piece_reach_count", "color": "black", "role": "knight", "scope": "any", "comparison": "atLeast", "count": 0 } }
    ] } },
    { "kind": "feature", "feature": { "kind": "open_file", "file": "a" } },
    { "kind": "feature", "feature": { "kind": "open_file", "file": "b" } },
    { "kind": "feature", "feature": { "kind": "open_file", "file": "c" } },
    { "kind": "feature", "feature": { "kind": "open_file", "file": "d" } }
  ]
}
```

Two idioms this legitimises, documented in `docs/shape-library.md`: **existence** is
`piece_reach_count(color, role, any, atLeast, 0)` — true exactly when such a piece exists,
because `any` over an empty piece list is false while every reach count of an existing
piece satisfies ≥ 0 (`structure.ts:209-211`) — and **absence** is its negation. The `any`
scope is load-bearing: `every` over an empty list is vacuously **true**, so an
`every`-form leaf can never express existence and absence must always negate the `any`
form; the docs state this beside the idioms because it is the exact trap an author reaching
for "all my rooks" walks into. Depth is 3 (`all` → `not` → `any` → leaves), inside the cap.

And the honesty that names this section: **the exact 4-versus-3 census is not expressible**
in the closed twelve-kind vocabulary. There is no pawn-count feature and no
exactly-one-rook feature; the trigger above matches the *family* — a queenless,
minor-pieceless rook ending with the queenside stripped of pawns — including 3v3 and
doubled-pawn variants. The entry's `name` is "Same-wing rook ending (4v3 family)", its
first `watch` row states the scope ("this reading fires for the family; count the pawns
yourself — the counting is the skill"), and the trigger is **not** tightened by growing the
grammar, per law 1b. Verified against the real boards: the trigger is true at Pack C's
start FEN (`3r2k1/5pp1/7p/8/4P3/8/5PPP/R5K1 w`: rooks a1/d8, no queens or minors, files
a-d pawnless) and false at the standard initial position; criterion 6 is that table.

Plans: `black-king-first`, `black-trade-pawns-not-rooks`, `black-sixth-rank-restraint`,
`black-active-second-rank` (from Pack C's plan classes, generic halves extracted, pack
descriptions trimmed to residue with `shapePlan` links, §4c), plus `white-king-up-pawns-
forward` and `white-offer-rook-trades` authored fresh for the attacking side. Success
signatures: `null` throughout with per-plan notes — holding and converting are *outcomes*,
graded by Pack C's own outcome machinery, and a structural signature for "the defence is
succeeding" would be manufactured; the one exception is `black-trade-pawns-not-rooks`,
whose note explains that pawn-count progress is outside the vocabulary, `signature: null`.

### 11. Boundary conditions, enumerated

The failure class that kills drafts here, collected. Each row not marked "refused" has a
test under criterion 5/6.

| Condition | Behaviour |
|---|---|
| Trigger true at the standard initial position | Refused at load/registration (`SHAPE_TRIGGER_TRUE_AT_INITIAL`, §3c) |
| Trigger true at a pack's start position | Fires at ply 0; the marker sits on the root timeline row §6a adds (the shipped timeline has no root entry — `screen-model.ts:112-133` drops the moveless root node). Pack B is exactly this case and it is correct — the tabiya *is* a Carlsbad |
| Structure dissolves, later re-forms on one path | Two spans, two markers. Neither is "the real one" |
| Trigger holds on the final node | `openEnded: true`; the span extends as play continues without re-firing |
| Two entries fire at one node | Two markers, entry-id order, never ranked (§5b) |
| Entry fires on a node, learner rewinds behind it | The marker exists on branches whose path includes matching nodes and not on others; firings are per-path (§5b) |
| Pack run, entry not referenced by the pack | Does not fire, by §5c. Not a defect: curated curriculum wins inside a drill |
| Position run, empty served catalogue | No firings, no markers, no placeholder. Absence is stated by nothing being there |
| `shapes` references an id that is only community-registered | Valid; resolution is newest-visible with official priority; registered bytes are never deleted, so the reference cannot dangle (§4b) |
| `shapes` references an unknown id | Refused: server load (repo packs) / registration (community), `SHAPE_REFERENCE_UNKNOWN` |
| `shapePlan` names a plan the newest entry version no longer has | Serve-time degrade: pack description renders alone with the entry name; no guessing, no run blocked (§4b) |
| `shapePlan.shape` not listed in `shapes` | Refused, `SHAPE_PLAN_REF_UNLISTED` |
| Entry plan `success.signature` already true at a position where the trigger fires | Legal and sometimes meaningful (Pack B's half-open c-file conjunct is true at the tabiya; the conjunction is not). Not statically detectable in general; documented as the authoring trap, the §11 disjunction-trap precedent of B9 |
| `named_structure` leaf inside a trigger | Valid — this is the intended seeding idiom (§10). The *code catalogue* still cannot recurse (typed exclusion, B9 §5a); an entry trigger evaluating `named_structure` terminates because catalogue triggers contain no `named_structure` |
| `not(named_structure(...))` in a trigger or signature | Valid, evaluates through the shipped expression semantics |
| Expression deeper than 4 | Refused, reused `STRUCTURAL_EXPRESSION_TOO_DEEP` |
| Entry with zero plans, zero watch rows, or zero mistakes | Refused by schema (`minItems: 1`) |
| All plans on one side | Refused, `SHAPE_PLAN_SIDES_ONE_WAY` (§3c) |
| Community entry claiming an official id | Refused at registration; official ids reserved (pack rule, §2b) |
| Community entry titled "Official …" | Unfixable, as for packs; the channel renders adjacent to the name on every surface (§3b, §6a) |
| Marker opened by a spectator | Identical render; pure function of positions the spectator already sees (§5c) |
| Entry re-versioned after runs displayed its markers | Old runs re-render firings from the newest visible versions; the marker set may differ from what was historically shown (entries re-versioned, added, or withdrawn since). Rendered as a present-tense reading attributed to the version actually served, never as a reconstruction of what the learner saw — §5a's accepted cost, stated where reviewers will look |
| Prose field containing a FEN | Refused, `SHAPE_PROSE_CONTAINS_FEN` (§3c) |
| Prose field containing SAN move tokens | Valid by design — generic manoeuvre naming is the library's subject matter; the §2a enforcement triad (FEN refusal, machine-checked frame, render-everywhere) is the boundary, not a SAN ban |
| Opening a marker during withheld committed play | Permitted, changes nothing server-side, moves no disclosure barrier (§6c, §7) |

### 12. Cost

Trigger evaluation is bounded `SquareSet` arithmetic, a strict subset of the measured
3.285 ms median full reading (`planning/structural-reading/log.md:23-25`). Firing
computation is client-side, in the same `packages/runtime` import the web app already uses
for the structural reading; the server evaluates triggers only at validation time
(`SHAPE_TRIGGER_TRUE_AT_INITIAL`, lint `probeFen`). No new endpoint is called per move;
`GET /shapes` is fetched once per player mount. Criterion 13 records per-node firing cost
over a full Pack B spine walk in the latency artifact, worry threshold 100 ms — a recorded
measurement, not a microbenchmark gate.

## Deviations from design

1. **B9 §5b forecast "the catalogue becomes its seed data and `StructureId` widens." Half
   holds, half is corrected.** The catalogue does seed the first entries (§10). But
   `StructureId` does **not** widen per shape entry: the code catalogue stays closed and
   code-owned, because pack and entry validation depend on a closed enum, and because
   community authoring must never require a code change — an entry without a catalogue id
   writes its trigger raw (§10d proves the path). Widening the catalogue remains a code
   RFC's decision. Proposed as a BACKLOG row by the implementer; not a `design/` edit.
2. **Gate B11's middle clause ("a drill is generated from position source + structural
   objective + resistance") predates the 2026-08-14 split ruling**, which kept hand-crafted
   drills first-class and packs referencing the library. This RFC completes the gate's
   entry-fires-everywhere and one-play-surface clauses and does not build recipe
   generation; the clause needs an owner restatement post-ruling. Proposed as a BACKLOG
   row; the gate surface itself is owner-tier and is not edited here.
3. **`design/03-product-breadth.md` B2 row records pack-less Just Play as shipped with
   browser runs, while `docs/drill-client.md` and `session-controller.ts:180-185` show the
   client refuses to play a position session.** The server half is real; the client half is
   the gap §8 closes. The row/doc tension is reported as a BACKLOG-row proposal (a
   citation-refresh, `AGENTS.md` law 5), not resolved by this RFC's prose.
4. **`design/04` §0's sketch says a shape entry "attaches to any position — drilled,
   imported, or reached in a live game — where the classifier fires."** Inside a *pack*
   run this RFC narrows firing to the pack's referenced entries (§5c), on the strength of
   the settled recognition rule that recognition is never authoritative over curated
   boundaries (`design/03:319-320`). Just Play, imported positions and live sessions get
   the full catalogue, as the sketch intends.

## Acceptance criteria

1. **Schema and digest.** The four official entries validate against
   `shape_entry.schema.json`; `digestShapeEntry` returns identical digests for
   key-reordered documents and different digests across versions; the digest implementation
   is asserted to be the shared RFC 8785 canonicalizer, not a copy.
2. **Closed everywhere, one grammar.** A walk of `shape_entry.schema.json` asserts that
   **every object-typed schema node declares `additionalProperties: false`** — absence of
   the key is openness, not closure, so counting `true` sites alone would pass an open
   schema; a deep-equality test asserts its `$defs/structuralExpression` matches the pack
   schema's, so the trigger grammar cannot fork.
3. **Refusals.** Every §3c and §4b code has a fixture failing validation with that exact
   code, and `make shape-check FILE=<fixture>` / `make pack-check FILE=<fixture>` exits
   non-zero, asserted on the process exit code. Includes the
   `SHAPE_TRIGGER_TRUE_AT_INITIAL` fixture (trigger `open_file(e)` is false at the initial
   position, so the fixture uses a genuinely initial-true trigger such as
   `not(open_file(a))`), a `SHAPE_PLAN_SIDES_ONE_WAY` fixture, and a
   `SHAPE_PROSE_CONTAINS_FEN` fixture whose FEN sits inside a `watch` row.
4. **Digest stability under 0.11.** Every unmodified 0.10 document —
   `schemas/drill_pack.example.json`, Pack A, the browser fixtures — validates under 0.11
   with a byte-identical digest, asserted against pre-bump recorded values. The two edited
   drafts (Packs B and C) are asserted to still load, with their new digests recorded in
   the test as the legible regression.
5. **Firing semantics.** Table-driven tests over `shapeFirings`: maximal contiguous spans;
   edge-triggered re-fire producing two spans; `openEnded`; canonical entry-id order;
   byte-identical output across shuffled entry input order; per-path independence across
   branches. A serialised-output walk asserts no field named `score`, `rank`, `severity`
   or `favours` exists.
6. **Real-board trigger truth.** The `carlsbad` trigger is true at Pack B's start FEN and
   false at the standard initial position; the `rook-4v3-same-side` trigger is true at
   Pack C's start FEN and false at the initial position and false in a fixture with a
   knight added; each conjunct of the rook trigger is asserted separately so a dropped
   leaf fails the test.
7. **Projection contract.** `GET /packs/<pack-b>` after the edit contains `shapes`, and
   still contains no `planClasses`, no `successConditions`, no spine annotations and no
   deviations — asserted key-by-key against the served projection.
8. **The marker emits nothing.** In the browser, opening and closing a shape marker
   changes neither the `/events` sequence length nor `feedbackDisclosed`-gated surfaces;
   asserted by comparing event pages before and after.
9. **Panel frame and seam.** The rendered panel contains the fixed frame sentence of §6b
   verbatim, renders detection before plans, renders channel + licence + attribution for
   the entry, and for a community fixture entry renders the channel adjacent to the name.
   The frame-sentence assertion is the machine-check that naming stays scoped.
   `renderStructuralExpressionSpec` (§6b) renders both Carlsbad signatures to the fixed
   "Success, structurally: …" template and accepts every expression the schema admits,
   table-asserted over the grammar's five branches.
10. **Browser: Just Play reaches a Carlsbad.** Using §8's player: start a position run
    from a FEN identical to Pack B's tabiya except Black's c-pawn on c7 (trigger false —
    asserted: no marker), play ...c7c6 (side black), and assert the marker appears on the
    timeline, opens to the `carlsbad` entry showing the six plan labels and the
    provenance block, and that no pack surface exists anywhere on the page. This is the
    criterion the ruling exists for: **the entry fires in a game nobody authored.**
11. **Browser: Pack B renders the referenced entry without leaking.** In a Pack B run:
    (a) the marker is present from the start (ply-0 firing) and opens to entry content
    only — asserted by the absence of any spine-annotation string and any pack
    `description` residue text before disclosure; (b) `GET /packs/<pack-b>` carries no
    `successConditions`/`planClasses` key (criterion 7 in the browser); (c) after driving
    to the intent-capture checkpoint and reveal, each plan renders exactly once — entry
    content plus the pack's residue note — asserted by counting occurrences of the entry
    description string; (d) reloading returns markers (recomputed) and keeps disclosure
    state (evented), demonstrating the two persistence regimes coexisting as specified.
12. **Studio round-trip.** Create a shape draft, lint with a `probeFen` that matches and
    one that does not (both reported correctly), register it, and assert it appears in
    `GET /shapes` as `community` with the publisher handle, fires in a Just Play run, and
    that registering an official id is refused. Account-deletion tombstoning of shape
    drafts is asserted at the storage level.
13. **Migration and envelope.** Migration 10 is idempotent on reopen; `STORAGE_VERSION`
    is 10. Per-node firing cost for the four official entries over every node of Pack B's
    spine is measured in the latency-test style and written to the latency artifact;
    100 ms worry / 200 ms intervention; no unsourced microbenchmark gate.
14. **`pnpm verify` and `pnpm test:browser` pass**, including the edited drafts and the
    new fixtures.
15. **Canonical documentation.** `docs/shape-library.md` describes the entry anatomy, the
    two trigger idioms, the no-persistence firing model, the marker/panel contract, the
    census honesty of §10d, and the explicit boundary (no LLM voice, no live classifier,
    no recipes, no review); `docs/drill-pack-format.md` records 0.11;
    `docs/pack-studio.md` records the shape write path; `docs/drill-client.md` records
    the position player and the marker; `docs/README.md` gains its row; `rfc/README.md`
    carries this RFC's Active row, the 0.11 pack-schema row and the migration-10 row (all
    three added with this draft).

## Open questions

None.

## Changelog

- 2026-08-14 (adversarial review, fixed in place): (1) §2a — the "no field holds a move"
  claim was falsified by §10a's own SAN-bearing prose; restated as a machine-readable-field
  claim and given a real enforcement triad: new `SHAPE_PROSE_CONTAINS_FEN` refusal (§3c,
  criterion 3, §11), the machine-checked frame sentence, and the render-everywhere
  property. (2) §6b — the signature sentence claimed the observation layer could render
  expressions; it cannot (`structural-sentences.ts` renders observations only,
  `pieceOnSquare` is no observation kind); `renderStructuralExpressionSpec` is now
  specified as new code with a criterion-9 assertion, and the detection line correctly
  attributes the name to the panel, not the `named_structure` branch. (3) §6a/§11 — the
  claimed "root timeline entry" does not exist (`screen-model.ts:112-133` drops the
  moveless root); the root row is now specified as added by this RFC. (4) §8 — two
  invent-it-yourself gaps closed: the position-path opponent request is pinned to
  `run.started` data with `sessionDigest` as the cache-key digest, and the hardcoded
  `justPlay`/`fromPosition` capability rows (`capabilities.ts:118-127`) are flipped with
  the player. (5) §5a — the drift ground did not survive the digest-pin counterattack
  (runs already pin packs by digest); rewritten as cost-versus-need with the
  reading-control precedent, and the replay concession stated at full width with a
  present-tense rendering rule (§11 row updated). (6) `structuralIssues` is
  module-private today; the RFC now states it adds the export. (7) §10d — the `every`
  vacuity trap documented beside the existence idiom. (8) Criterion 2 tightened: every
  object node must declare `additionalProperties: false` (absence is openness).
  (9) Session-controller citations corrected to `:180-185`. Verified unchanged: digest
  stability (pack documents carry no schema-version field; no committed digest moves),
  the Carlsbad extraction (signature matches Pack B's success condition exactly;
  `planClassIds` intact after trimming), Pack C trigger truth at its start FEN, the
  register rows (0.11, migration 10, storage 9), and the withholding path
  (`feedbackDisclosed` reads only the four event types; the marker emits nothing).
- 2026-08-14: created. Specifies the B11 shape library under the 2026-08-14 owner rulings:
  the closed shape-entry artifact (schema 0.1, RFC 8785 digest, official/community
  channels, CC-BY-SA-4.0 posture with encoded attribution), additive pack references
  (pack schema 0.11, `shapes` + `shapePlan`, `planClasses` fully preserved), firing as a
  derived projection with the run-event option argued and rejected, the ruled passive
  timeline marker opening to a two-layer detection/plans panel, referenced-only firing
  inside drills with the double-delivery rule, the studio write path (migration 10), the
  minimal position player, and four official entries with the Carlsbad extraction from
  Pack B as the worked example.
