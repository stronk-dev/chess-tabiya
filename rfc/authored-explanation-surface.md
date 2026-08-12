# RFC: Authored explanation surface (per-scope reveal + rendering)

- **Status:** draft (revision 2 — revision 1 did not survive review)
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

## Revision note (2026-08-12)

Revision 1 was reviewed and did not survive. Six blocking findings, all
accepted; the revision below is a redesign of the core mechanism, not a patch.

| # | Finding | Resolution in this revision |
|---|---|---|
| 1 | **Scope derivation was not well-defined.** There is no canonical spine walk — only a forest. A depth-first ordering assigns `be3-hold` to the Tal branch, strands `c5-immediate` in an unreachable tail, and `bf5-main` legitimately needs *different* scopes on different continuations, so no static per-node scope exists | §1 rewritten: reveal is **path-relative, derived from actual `checkpoint.reached` events**, with no precomputed scope map. A shared-prefix item may be revealed by different checkpoints on different attempts, which is correct rather than a defect |
| 2 | **Several authored shapes cannot satisfy the transport contract** — checkpoints need not have a trigger node; deviations may be FEN-anchored; concepts are bare ids with no prose; checkpoint labels ship before play anyway; the TS types fall back to index signatures | §2 narrows the supported item set **explicitly and by name**, and §5 states what is excluded and why |
| 3 | **Early claim reveal is fail-open, not conservative.** Pack A's `tal-tempo` claim would be exposed on the quiet main line before the learner ever meets 4.h4 | Accepted without reservation. Claims stay **withheld** until they have real anchors. "Never reveal unsupported placement" is the conservative choice; my framing inverted it |
| 4 | **D2 is not fixed by the proposed inversion** — the barrier has five surfaces, three more fail open independently, and packless evidence tests legitimately rely on the current path | D2 **removed from this RFC** and returned to F2, where the alignment pass had originally placed it |
| 5 | **The response cannot support the promised UI states** — a client cannot distinguish "nothing authored" from "withheld" when withheld items are simply absent | §4 adds one coarse run-level flag and nothing finer; §3 states the disclosure decision explicitly |
| 6 | **Acceptance criteria contradicted the pack and the UI path** — `e6` has no annotation, the `bf5-main` deviations are never played on the asserted line, and the Playwright harness cannot start Pack A at all | §Acceptance rewritten against the real pack; §6 makes the harness repair an explicit prerequisite rather than an assumption |

Both open questions were resolved by the review; see §Resolved questions.

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
| Claim `when:` triggers, and therefore `feedbackClaims` delivery | Pinnable today via the shipped `SimpleTrigger`→`ObjectivePredicate` seam, so they are a real next RFC — but anchoring is a separate contract from timing, and until claims have anchors they stay withheld (review finding 3) |
| Defect D2 (the barrier fails open when no pack is registered) | Five surfaces, three of which fail open independently; packless runs also have no feedback policy to apply. Belongs to F2 (review finding 4) |
| Evidence-bound LLM rendering | `capabilities.ts:33` ships `llm: "none"` |
| Corpus, Syzygy, deterministic-feature layers | No code exists for any of them |
| `deviations[].class` as live classification | Runtime semantics, owned by program item #4 |
| FEN-anchored deviations | Real in the JSON schema; needs a position-matching contract this RFC does not specify |

## Specification

### 1. Reveal is path-relative and event-derived

There is **no precomputed scope map**. Reveal is computed from the run's
append-only event log, which the review confirmed is sufficient: rewind appends
`run.rewound` and never deletes earlier checkpoint events
(`packages/runtime/src/runtime.ts:303`), so scanning the full log gives
monotonicity with no persisted state.

For a run and a pack, the **revealed node set** is computed as:

1. Take every `checkpoint.reached` event in the log
   (`packages/runtime/src/types.ts:117-119` — `{checkpointId, nodeId, branchId}`).
2. For each such event, walk the run path ending at its `nodeId` back toward the
   root, stopping at the node of the nearest preceding `checkpoint.reached`
   event **on that same path**, or at the root if there is none.
3. The nodes in that span are revealed. The revealed set is the **union** across
   all such events, which makes it monotonic by construction.
4. Map each revealed run node to its authored spine node, if any, using the same
   spine-position logic the orchestrator already applies
   (`apps/server/src/pack-orchestrator.ts`, `activeSpineNodeId`).

Consequences, stated because they are correct rather than accidental:

- A shared-prefix authored item may be revealed by `plan-commitment` on one
  attempt and `tal-commitment` on another. Scope is a property of the *path
  taken*, not of the node.
- Authored material on a continuation the learner never played is never
  revealed, even if a checkpoint fired elsewhere.
- Authored material positioned after the last reachable checkpoint is never
  revealed. This is an authoring error, not a runtime one — see §6.

For `feedbackPolicy: "segment_end"`, use the completed-segment boundaries rather
than global order: `segment.completed` is emitted only when a checkpoint is
reached after an earlier checkpoint **on the same branch**
(`packages/runtime/src/runtime.ts:350`), and carries start/end checkpoint event
sequence numbers and node ids — not checkpoint ids
(`packages/runtime/src/types.ts:142`). Resolve them with the shipped
`deriveSegments()` (`packages/runtime/src/events.ts:167`). Reveal spans
correspond to completed segments; an in-progress segment reveals nothing.

### 2. Supported item set — closed and named

Exactly three kinds are delivered. Anything not on this list is not delivered by
this RFC.

| Kind | Source field | Anchor | Reveal condition |
|---|---|---|---|
| `annotation` | `spine[].annotations[]` | `{spineNodeId}` | its spine node is in the revealed node set |
| `deviation` | `deviations[]` where `at.spineNodeId` is present | `{spineNodeId, moveUci}` | its `at.spineNodeId` is in the revealed node set |
| `plan_class` | `planClasses[]` | `{checkpointId}` | a reached checkpoint's `interaction.planClassIds` references it |

**Deviation semantics — one meaning, chosen explicitly** (review finding 6): a
deviation note is revealed when its anchor node is revealed, **whether or not the
learner played that deviation**. It is authored commentary about a decision
point, not a reaction to a choice. The alternative — reveal only chosen
deviations — is rejected here because a chosen deviation leaves the spine and may
never reach a checkpoint, so checkpoint-gated reveal could not deliver it. That
is a real capability, and it belongs with off-spine graceful degradation
(program item #4), not here.

Excluded, with reasons (review finding 2):

- **`concepts`** — bare identifiers, not prose. Nothing to render.
- **`feedbackClaims`** — no anchors yet; withheld entirely (review finding 3).
- **checkpoint `label`** — already delivered before play
  (`apps/server/src/pack-registry.ts:66`); adding it here would be duplicate
  delivery, and it is not withheld in the first place.
- **FEN-anchored deviations** — see the out-of-scope table.

The implementer must add typed access for `annotations`, `deviations` and
`planClasses` rather than reading through the index-signature fallback in
`packages/schema/src/drill-pack/types.ts:60`. This is a type-level change only;
no JSON Schema change and no new authored field.

### 3. Disclosure decision (explicit)

Withheld items are **absent** from the response — not nulled, not counted.
Response size must not disclose how much is being held.

The client is told exactly one thing beyond the revealed items: a single
run-level boolean, `hasWithheldAuthoredContent`. It permits the honest-absence
convention already shipped in the app shell (`HonestControl`) without leaking
which positions carry commentary or how much. Per-scope or per-node "has content"
flags are **rejected**: they would let a learner detect that a position is
noteworthy before playing it, which is anti-contamination failure by side
channel.

Therefore, per review finding 5, **timeline markers appear only after their items
are revealed.** Pre-reveal per-ply affordances are not possible under this
disclosure rule, and revision 1's promise of them is withdrawn.

### 4. Transport

```
GET /runs/:id/authored-feedback
  -> { items: AuthoredFeedbackItem[], hasWithheldAuthoredContent: boolean }
```

```ts
interface AuthoredFeedbackItem {
  readonly kind: "annotation" | "deviation" | "plan_class";
  readonly revealedBy: string;          // checkpoint id that revealed it
  readonly anchor:
    | { readonly spineNodeId: string }
    | { readonly spineNodeId: string; readonly moveUci: string }
    | { readonly checkpointId: string };
  readonly text: string;
  readonly meta?: Readonly<Record<string, string>>;  // deviation class
}
```

`revealedBy` names the checkpoint whose span revealed the item on the path
actually taken; where several qualify, the earliest by event sequence.

Register the route in the run-route matcher at `apps/server/src/rest.ts:299`,
which currently accepts `(moves|rewind|fork|graph|compare|events|evidence|pgn)`.

`GET /packs/:id` is unchanged. The existing regression asserting it ships no
authored prose must stay green and unmodified — it is the load-bearing test of
the delivery RFC this one extends.

### 5. Reveal predicate

The single boolean is retained and re-expressed, so every current call site keeps
its exact semantics and this RFC changes no existing withholding behaviour:

```ts
export function revealedAuthoredNodes(
  pack: PackRecord,
  run: DrillRun,
): ReadonlySet<string>;                 // run node ids, per §1

export function feedbackIsRevealed(pack: PackRecord, run: DrillRun): boolean;
                                        // unchanged behaviour and signature
```

The packless (`pack === undefined`) behaviour of `publicNodes`/`publicEvents` is
**not touched** by this RFC (see D2, out of scope).

### 6. Test-harness prerequisites (not assumptions)

Review finding 6 established that the browser acceptance in revision 1 could not
have run. These are prerequisite tasks of this RFC, to be landed before the
acceptance test is written:

1. **Playwright cannot load draft packs** — its server is not started in
   development mode (`playwright.config.ts:19`). Start it in dev mode for this
   spec, or register Pack A through a test fixture path.
2. **The mock opponent has no Pack A script** (`apps/server/src/application.ts:139`).
3. **Pack A starts with Black to move while the learner is White**
   (`content/drafts/anti-caro-advance.json:12`); the board disables input when it
   is not the learner's turn (`apps/web/src/lib/ChessBoard.svelte:40`), and
   `startPack()` does not request the initial opponent move
   (`apps/web/src/lib/session-controller.ts:195`). Whether this is a Pack A
   authoring bug or a missing runtime behaviour is a real question the
   implementer should answer and report; it affects every pack whose start
   position is on the opponent's move.

If (3) turns out to be a runtime defect rather than a pack error, land it as a
separate fix and say so — do not absorb it silently into this RFC.

### 7. Client surface

Minimal but real, in the existing drill screen — no new route:

1. **Checkpoint sheet.** When a checkpoint fires, the sheet lists the items its
   span revealed: the annotations for the moves just played, the deviation notes
   for that span's decision points, and the plan-class descriptions if that
   checkpoint captures intent.
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

Written against the actual pack (`content/drafts/anti-caro-advance.json`), after
the §6 prerequisites land.

1. `GET /packs/:id` contains no authored prose. Existing regression green, unmodified.
2. **Path-relative reveal**: play the spine to `plan-commitment` (which triggers
   `atSpineNode: be2`). The response contains the annotations on `bf5-main`,
   `nf3` and `be2` — note `e6` has none and must not be asserted — plus the two
   `bf5-main` deviation notes (Bd3, Nc3), which are revealed by anchor position
   and **not** by having been played. It contains nothing anchored to
   `c5-break`, `be3-hold`, `h4-tal`, `h5-reply`, `c5-immediate` or `dxc5-grab`.
3. **Sibling correctness** (the defect that killed revision 1): on the
   `plan-commitment` path, no item anchored to `h4-tal` or `h5-reply` appears —
   and on a Tal-line run reaching `tal-commitment`, `bf5-main`'s annotation is
   revealed with `revealedBy: "tal-commitment"`. The same item, different
   revealing checkpoint, by design.
4. **Claims and concepts are absent** from every response, at every point in
   every run.
5. **Monotonic**: after rewinding to before `plan-commitment`, its items remain
   revealed. Test states the rationale (a learner cannot unsee prose).
6. **No new disclosure**: `hasWithheldAuthoredContent` is the only signal about
   unrevealed material; no count, no per-scope flag, no size correlation.
7. **Browser acceptance**: play Pack A to `plan-commitment`; the checkpoint sheet
   shows at least one authored annotation; a distinctive substring of a
   later-scope annotation (e.g. from `be3-hold`) appears nowhere in the DOM.
8. `make verify` green; `pack-check` behaviour unchanged.
9. `docs/explanation-grounds.md` updated with the reveal contract, and its
   grouping of Maia with "corpus, Syzygy, and non-Stockfish sources" corrected —
   Maia policy mass is already persisted and reaching the browser.

## Resolved questions

Both of revision 1's open questions were settled by review, with evidence:

1. **`"__tail"` collision** — impossible: authored ids must start with a
   lowercase letter or digit, so `"__tail"` is outside the legal id language
   (`schemas/drill_pack.schema.json:78`). **But the tail scope is removed
   anyway**, because there is no generic run-terminal event that could reveal
   it. Authored material after the last reachable checkpoint is therefore
   permanently unrevealable — which is an authoring defect that `pack-check`
   should warn about (`AUTHORED_PROSE_AFTER_LAST_CHECKPOINT`), not a runtime
   state to model.
2. **`segment.completed` mapping** — resolved and specified in §1. It is emitted
   only when a checkpoint is reached after an earlier checkpoint on the same
   branch, carries event sequence numbers rather than checkpoint ids, and is
   resolved via `deriveSegments()`. Revision 1's "every checkpoint at or before
   the last boundary in global spine order" was invalid.

## Open questions

1. Whether Pack A's Black-to-move start is a pack authoring error or a missing
   runtime behaviour (§6.3). The implementer answers this with evidence; it
   affects every pack starting on the opponent's move.

## Changelog

- 2026-08-12: created.
- 2026-08-12: revision 2 after review — path-relative event-derived reveal
  replacing the static scope map; item set closed to three kinds; claims and
  concepts withheld; D2 removed to F2; disclosure rule made explicit and
  pre-reveal markers withdrawn; acceptance rewritten against the real pack;
  test-harness repair made a prerequisite.
