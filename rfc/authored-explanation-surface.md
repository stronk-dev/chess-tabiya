# RFC: Authored explanation surface (per-scope reveal + rendering)

- **Status:** implementing (revision 3 accepted after two adversarial review rounds)
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/03-product-breadth.md` §Foundation edge (F1), §RFC program item #2, gate B4; `design/01-training-model.md` §Vocabulary
- **Exploration gate:** opened by owner ruling 2026-08-12 (breadth sequencing, `planning/exploration/log.md`)
- **Depends on:** `rfc/archive/authored-feedback-delivery.md` (implemented — this is the reveal path it explicitly blocked on), `rfc/archive/explanation-grounds.md` (implemented)
- **Parent / amends:** amends the shipped withholding barrier in `apps/server/src/feedback-policy.ts`
- **Supersedes / superseded by:** —
- **Planning:** `planning/authored-explanation-surface/` (once implementing)

## Summary

Authored prose — annotations, deviation notes, plan-class descriptions — is
encoded, linted, digested, and **never shown to anyone**. The shipped delivery
RFC deliberately stopped at "stop shipping it before play", and its own code
comment names what is missing: *"Authored feedback stays in the stored document
until a server-side, per-scope reveal contract exists"*
(`apps/server/src/pack-registry.ts:42-44`). This RFC specifies that contract and
the first surface that renders it.

Scoped to make one thing true: **a pack author can write a sentence, play the
pack, and see that sentence at the moment it is supposed to land.** That loop —
author → play → see → refine — is the current bottleneck for all content work.

## Revision history

**Revision 1** was rejected on six blocking findings. The central error: it
derived a static per-node scope from a "canonical spine walk" that does not
exist (the spine is a forest), which mis-assigned Pack A's siblings and could
never represent the fact that `bf5-main` needs *different* scopes on different
continuations. Also: early claim reveal was fail-open rather than conservative;
the D2 fix was scope creep; two authored shapes were unsupportable; the
disclosure model made its own UI promises impossible; and the acceptance test
could not have run.

**Revision 2** fixed the mechanism (path-relative, event-derived) and was
confirmed to resolve the Pack A path problem, sibling leakage, claim withholding,
and the disclosure decision. Four contract gaps remained, all addressed below:
segment-end behaviour underspecified; `revealedBy` insufficient to attribute
across repeated checkpoint firings; item extraction and the withheld flag lacking
exact definitions; and the tail-lint contradiction.

**Revision 3** (this one) closes those four and resolves the last open question —
Pack A's Black-to-move start is a **client orchestration defect**, not a pack
error.

## Motivation

The 2026-08-12 alignment pass (`planning/breadth/evidence-explanation.md`)
verified the state: `grep -rn 'feedbackClaims' apps packages` returns one hit
repo-wide, a negative test assertion; `deviations`, `annotations` and
`planClasses` appear only in schema types and lint; the entire explanation
surface is `WhyBanner.svelte` (52 lines) which fires only on an objective
transition, and Pack A declares no `objective.successConditions`, so for the only
real authored pack it can never fire.

`feedbackIsRevealed(pack, run)` (`apps/server/src/feedback-policy.ts:11-15`) is
one boolean for the whole run, so revealing anything reveals everything —
including commentary on positions the learner has not yet faced.

**Out of scope,** each with a reason:

| Out of scope | Why |
|---|---|
| Claim `when:` triggers, and therefore `feedbackClaims` delivery | Pinnable today via the shipped `SimpleTrigger`→`ObjectivePredicate` seam, so they are a real next RFC — but anchoring is a separate contract from timing, and until claims have anchors they stay withheld |
| Defect D2 (the barrier fails open when no pack is registered) | Five surfaces, three of which fail open independently; packless runs also have no feedback policy to apply. Belongs to F2 |
| Evidence-bound LLM rendering | `capabilities.ts:33` ships `llm: "none"` |
| Corpus, Syzygy, deterministic-feature layers | No code exists for any of them |
| `deviations[].class` as live classification | Runtime semantics, owned by program item #4 |
| FEN-anchored deviations | Real in the JSON schema; needs a position-matching contract this RFC does not specify |

## Specification

### 1. One reveal rule, driven by reveal events in sequence order

There is **no precomputed scope map**. Reveal is computed from the run's
append-only event log, which is sufficient: rewind appends `run.rewound` and
never deletes earlier checkpoint events (`packages/runtime/src/runtime.ts:303`),
so scanning the full log gives monotonicity with no persisted state.

A **reveal event** depends on the pack's feedback policy:

| `feedbackPolicy` | Reveal event | Path considered | Attribution |
|---|---|---|---|
| `delayed_checkpoint` | each `checkpoint.reached` | root → that event's `nodeId` | that event |
| `segment_end` | each `segment.completed` | root → that event's `endNodeId` | its `endCheckpointEventSeq` |

The single algorithm, applied identically in both modes:

1. Walk reveal events in **event-sequence order**.
2. For each, take the **actual root-to-node path** for that event (never a
   branch-global ordering, never a spine ordering).
3. Reveal every **previously unseen** supported item anchored on that path.
4. Attribute each newly revealed item to the reveal event that disclosed it.

Because step 3 considers the whole root-to-node path and only skips items already
seen, material *before the first checkpoint* is revealed when the first reveal
event fires — in `segment_end` mode, when the first segment completes. This is
the behaviour revision 2 left undefined.

`segment.completed` carries start/end checkpoint event sequence numbers and node
ids rather than checkpoint ids (`packages/runtime/src/types.ts:142`,
`packages/runtime/src/runtime.ts:350`); resolve them with the shipped
`deriveSegments()` (`packages/runtime/src/events.ts:167`). The start checkpoint's
node is on the root-to-`endNodeId` path and is therefore included — there is no
separate inclusion rule and no gap between consecutive segments.

Consequences, stated because they are correct rather than accidental:

- A shared-prefix item may be revealed by `plan-commitment` on one attempt and
  `tal-commitment` on another. Scope is a property of the *path taken*.
- Authored material on a continuation the learner never played is never revealed,
  even if a checkpoint fired elsewhere.
- Authored material positioned after the last reachable checkpoint is never
  revealed. That is an authoring defect; see §7.

### 2. Supported item set — closed, named, with extraction rules

Exactly three kinds are delivered. Anything not listed is not delivered.

| Kind | Source | Anchor | Extraction rule |
|---|---|---|---|
| `annotation` | `spine[].annotations[]` | `{spineNodeId}` | one item per array entry |
| `deviation` | `deviations[]` with `at.spineNodeId` | `{spineNodeId, moveUci}` | **an entry without `note` produces no item** (`schemas/drill_pack.schema.json:413` makes `note` optional) |
| `plan_class` | `planClasses[]` referenced by a reached checkpoint's `interaction.planClassIds` | `{checkpointId}` | carries **both** `label` (required) and `description` (optional, `schemas/drill_pack.schema.json:148`) — never collapsed into one `text` field |

**Source identity** must be deterministic and structural, never derived from
prose text (which would deduplicate two legitimately identical sentences):

- `annotation` → `` `${spineNodeId}#${annotationIndex}` ``
- `deviation` → `` `deviation#${deviationsArrayIndex}` ``
- `plan_class` → `` `planClass#${planClassId}` ``

**Deviation semantics — one meaning, chosen explicitly:** a deviation note is
revealed when its anchor node is revealed, **whether or not the learner played
that deviation**. It is authored commentary about a decision point, not a
reaction to a choice. Reveal-only-if-chosen is rejected here because a chosen
deviation leaves the spine and may never reach a checkpoint, so checkpoint-gated
reveal could not deliver it — that capability belongs with off-spine graceful
degradation (program item #4).

Excluded, with reasons: **`concepts`** are bare identifiers with no prose;
**`feedbackClaims`** have no anchors yet and stay withheld entirely; **checkpoint
`label`** already ships before play (`apps/server/src/pack-registry.ts:66`) and
was never withheld; **FEN-anchored deviations** need a position-matching
contract.

The implementer must add typed access for `annotations`, `deviations` and
`planClasses` rather than reading through the index-signature fallback in
`packages/schema/src/drill-pack/types.ts:60`. Type-level change only; no JSON
Schema change, no new authored field.

### 3. Disclosure rule

Withheld items are **absent** — not nulled, not counted. Response size must not
disclose how much is held.

The client is told exactly one thing beyond the revealed items:

```
hasWithheldAuthoredContent: boolean
```

**It counts only items this RFC can ever deliver** — supported kinds, with a
`note` where required, anchored by `spineNodeId`, and reachable from some
checkpoint. Claims, concepts, FEN-anchored deviations and note-less deviations
**must not contribute.** Otherwise Pack A's two permanently-withheld claims would
pin the flag true forever while the UI promises commentary "until checkpoints"
that never arrives — a lie the interface would tell on every run.

Per-scope or per-node "has content" flags are **rejected**: they would let a
learner detect that a position is noteworthy before playing it — anti-
contamination failure by side channel. Therefore **timeline markers appear only
after their items are revealed**; pre-reveal per-ply affordances are not possible
under this rule, and revision 1's promise of them stays withdrawn.

### 4. Transport

```
GET /runs/:id/authored-feedback
  -> { items: AuthoredFeedbackItem[], hasWithheldAuthoredContent: boolean }
```

```ts
interface RevealAttribution {
  readonly checkpointId: string;
  readonly eventSeq: number;      // the reveal event's sequence number
}

type AuthoredFeedbackItem =
  | { readonly kind: "annotation"; readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly spineNodeId: string };
      readonly text: string }
  | { readonly kind: "deviation"; readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly spineNodeId: string; readonly moveUci: string };
      readonly note: string;
      readonly deviationClass?: string;
      readonly offObjective?: boolean }
  | { readonly kind: "plan_class"; readonly id: string;
      readonly revealedBy: RevealAttribution;
      readonly anchor: { readonly checkpointId: string };
      readonly label: string;
      readonly description?: string };
```

**`revealedBy` carries event identity, not just a checkpoint id.** The same
checkpoint id can fire on multiple branches, and those occurrences reveal
different path-relative items; a sheet filtering on id alone would show a later
`plan-commitment` the material an earlier branch's `plan-commitment` revealed.
`CheckpointNotice` already carries the event sequence, so the sheet selects on
that exact occurrence.

**Response ordering is deterministic**: by `revealedBy.eventSeq` ascending, then
by kind in the order `annotation`, `deviation`, `plan_class`, then by `id`
lexicographically.

Register the route in the run-route matcher at `apps/server/src/rest.ts:299`,
which currently accepts `(moves|rewind|fork|graph|compare|events|evidence|pgn)`.

`GET /packs/:id` is unchanged; its regression asserting no authored prose must
stay green and unmodified — it is the load-bearing test of the delivery RFC this
one extends.

### 5. Server projection

```ts
/** Source item id -> the reveal event that first disclosed it. */
export function revealedAuthoredItems(
  pack: PackRecord,
  run: DrillRun,
): ReadonlyMap<string, RevealAttribution>;
```

A node-id set is insufficient — it cannot express attribution, which §4 requires.

`feedbackIsRevealed(pack, run)` keeps its exact current signature and behaviour;
this RFC changes no existing withholding. The packless
(`pack === undefined`) behaviour of `publicNodes`/`publicEvents` is **not
touched** (see D2, out of scope).

### 6. Prerequisite fix: opponent-to-move at run start

The last open question is resolved: **this is a client orchestration defect, not
a Pack A authoring error.**

Pack A intentionally starts before Black chooses between 3...Bf5 and 3...c5;
advancing the FEN past Black's move would destroy one of its two roots. The
schema treats `start.side` independently of the FEN side to move
(`schemas/drill_pack.schema.json:108`), so this is a supported authored shape.
The runtime already supports an opponent ply from the root via
`appendOpponentPly`; the missing behaviour is that `startPack()` never requests
one when the initial turn is not the learner's
(`apps/web/src/lib/session-controller.ts:195`), while the board disables input
when it is not the learner's turn (`apps/web/src/lib/ChessBoard.svelte:40`) —
so the run is simply stuck.

Land as a **separate prerequisite fix**, not absorbed into this RFC's commit:

1. After creating and attaching the run, request an opponent move when it is the
   opponent's turn.
2. Do the same on **writer resume** when no checkpoint is blocking.
3. **Never** for read-only followers.
4. Add a session-controller test.
5. Give the mock opponent a deterministic Pack A line
   (`apps/server/src/application.ts:139`).
6. Start the browser harness with draft loading enabled and update its one-pack
   assumption (`playwright.config.ts:19`).

This affects every pack whose start position is on the opponent's move, which is
why it is a runtime fix rather than a test fixture.

### 7. `pack-check`: one new warning

Authored prose positioned after the last reachable checkpoint can never be
revealed (§1). Silent invisibility is exactly the never-silent violation this
repo keeps rediscovering, so `pack-check` gains **one** warning:

- Code: `AUTHORED_PROSE_AFTER_LAST_CHECKPOINT`, severity **warning**.
- Scope: **spine-node-only.** It fires solely for prose anchored to spine nodes
  that no checkpoint with an `atSpineNode` trigger can reach. Checkpoints
  triggered by `atPly`, `fenPredicate`, `materialBalance` or timing windows are
  **not** statically resolvable to a spine node, so a pack containing any such
  checkpoint suppresses this warning entirely rather than guessing.
- Tests cover both the firing case and the suppression case.

This replaces revision 2's contradiction, where the resolved-questions section
proposed a lint while the acceptance criteria said `pack-check` was unchanged.

### 8. Client surface

Minimal but real, in the existing drill screen — no new route:

1. **Checkpoint sheet.** When a checkpoint fires, the sheet lists the items that
   *exact occurrence* revealed, selected on `revealedBy.eventSeq`.
2. **Timeline markers after reveal only**, per §3.
3. **Honest absence** driven solely by `hasWithheldAuthoredContent`: the surface
   may say authored commentary exists and is withheld until checkpoints; it may
   not say where.

`WhyBanner.svelte` keeps its objective-transition role; this surface is additive,
so the one real authored pack stops depending on a transition it cannot produce.

## Deviations from design

1. **Scope is derived from play, not authored.** `design/03` speaks of
   author-controlled timing. Authors get less control in exchange for zero new
   vocabulary. If real authoring shows the derivation is wrong for some pack,
   that is the evidence an explicit `revealAt` field would need — the correct
   order, since the withdrawn RFCs failed by inventing such fields first.
2. **Pre-reveal timeline affordances are not delivered**, though `design/03`'s
   passive-marker model implies them. §3 explains why: any per-position "content
   exists here" signal is a contamination side channel. Revisit only with a
   disclosure model that survives that objection.

## Acceptance criteria

Written against `content/drafts/anti-caro-advance.json`, after §6 lands.

1. `GET /packs/:id` contains no authored prose. Existing regression green, unmodified.
2. **Path-relative reveal**: play the spine to `plan-commitment` (trigger
   `atSpineNode: be2`). The response contains the annotations on `bf5-main`,
   `nf3` and `be2` — `e6` has none and must not be asserted — plus the two
   `bf5-main` deviation notes (Bd3, Nc3), revealed by anchor position and **not**
   by having been played. Nothing anchored to `c5-break`, `be3-hold`, `h4-tal`,
   `h5-reply`, `c5-immediate` or `dxc5-grab`.
3. **Sibling correctness** (the defect that killed revision 1): on the
   `plan-commitment` path nothing anchored to `h4-tal`/`h5-reply` appears; on a
   Tal-line run reaching `tal-commitment`, `bf5-main`'s annotation is revealed
   with `revealedBy.checkpointId === "tal-commitment"`.
4. **Attribution by occurrence**: a run where `plan-commitment` fires on two
   branches yields items whose `revealedBy.eventSeq` distinguishes them, and the
   checkpoint sheet for the second occurrence shows only what that occurrence
   revealed.
5. **Claims and concepts are absent** from every response at every point in every
   run, and **do not set** `hasWithheldAuthoredContent`. Explicit test: a run
   that has revealed all deliverable items reports the flag `false` even though
   Pack A still holds two undelivered claims.
6. **Extraction**: a deviation without `note` produces no item; a plan class
   without `description` still delivers its `label`.
7. **Monotonic**: after rewinding to before `plan-commitment`, its items remain
   revealed. Test states the rationale (a learner cannot unsee prose).
8. **Deterministic ordering** per §4, asserted.
9. **Browser acceptance**: play Pack A to `plan-commitment`; the sheet shows at
   least one authored annotation; a distinctive substring of a later-scope
   annotation (e.g. from `be3-hold`) appears nowhere in the DOM.
10. `pack-check` gains exactly the one warning in §7, with firing and suppression
    tests; no other `pack-check` behaviour changes.
11. `make verify` green.
12. `docs/explanation-grounds.md` updated with the reveal contract, and its
    grouping of Maia with "corpus, Syzygy, and non-Stockfish sources" corrected —
    Maia policy mass is already persisted and reaching the browser.

## Resolved questions

- **`"__tail"` collision** — moot: the tail scope is removed. Authored ids must
  start with a lowercase letter or digit (`schemas/drill_pack.schema.json:78`) so
  no collision was possible anyway, but no run-terminal event exists that could
  reveal a tail. Handled as an authoring warning instead (§7).
- **`segment.completed` mapping** — specified in §1. It carries event sequence
  numbers rather than checkpoint ids and is resolved via `deriveSegments()`.
  Revision 1's "every checkpoint at or before the last boundary in global spine
  order" was invalid.
- **Pack A's Black-to-move start** — a client orchestration defect, resolved as a
  prerequisite fix in §6, not a pack error.

## Open questions

None.

## Changelog

- 2026-08-12: created.
- 2026-08-12: revision 2 after review — path-relative event-derived reveal
  replacing the static scope map; item set closed to three kinds; claims and
  concepts withheld; D2 removed to F2; disclosure rule made explicit and
  pre-reveal markers withdrawn; acceptance rewritten against the real pack.
- 2026-08-12: revision 3 after second review — one unified reveal rule covering
  both feedback policies including pre-first-checkpoint material; `revealedBy`
  carries event identity so repeated checkpoint firings attribute correctly;
  extraction rules, source identity, ordering and the withheld-flag definition
  pinned; opponent-to-move-at-start resolved as a client defect with a specified
  prerequisite fix; the `pack-check` contradiction replaced by one precisely
  scoped warning.
- 2026-08-12: accepted by owner and moved to implementing; planning job opened.
