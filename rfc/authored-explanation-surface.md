# RFC: Authored explanation surface (per-scope reveal + rendering)

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/03-product-breadth.md` §Foundation edge (F1), §RFC program item #2, gate B4; `design/01-training-model.md` §Vocabulary
- **Exploration gate:** opened by owner ruling 2026-08-12 (breadth sequencing, `planning/exploration/log.md`)
- **Depends on:** `rfc/archive/authored-feedback-delivery.md` (implemented — this is the reveal path it explicitly blocked on), `rfc/archive/explanation-grounds.md` (implemented)
- **Parent / amends:** amends the shipped withholding barrier in `apps/server/src/feedback-policy.ts` and the browser-safe projection in `apps/server/src/pack-registry.ts`
- **Supersedes / superseded by:** —
- **Planning:** `planning/authored-explanation-surface/` (once implementing)

## Summary

Authored prose — annotations, deviation notes, plan-class descriptions, concepts
and claims — is encoded, linted, digested, and **never shown to anyone**. The
shipped delivery RFC deliberately stopped at "stop shipping it before play", and
its own code comment names what is missing: *"Authored feedback stays in the
stored document until a server-side, per-scope reveal contract exists"*
(`apps/server/src/pack-registry.ts:42-44`). This RFC specifies that contract and
the first surface that renders it.

It is scoped to make one thing true: **a pack author can write a sentence, play
the pack, and see that sentence at the moment it is supposed to land.** That
loop — author → play → see → refine — is the current bottleneck for all content
work, and B4 cannot be honestly claimed without it.

## Motivation

The 2026-08-12 alignment pass (`planning/breadth/evidence-explanation.md`)
verified the state:

- `grep -rn 'feedbackClaims' apps packages` returns **one** hit repo-wide, a
  negative test assertion.
- `deviations`, `annotations`, `planClasses`, `concepts` appear only in
  `packages/schema/src/drill-pack/types.ts` and `lint.ts`.
- The entire explanation surface is `WhyBanner.svelte` (52 lines), which renders
  only on an objective transition — and Pack A declares no
  `objective.successConditions`, so for the only real authored pack it can never
  fire.
- `feedbackIsRevealed(pack, run)` (`apps/server/src/feedback-policy.ts:11-15`) is
  **one boolean for the whole run**. Reaching the first of Pack A's three
  checkpoints would release the prose for all three, including notes about
  positions the player has not yet faced.

That last point is why the honest fix is not "render what we already have".
Rendering the current all-or-nothing latch would leak the pack's later teaching
into its earlier positions — the same anti-contamination failure the repo
already rejected client-side for engine evidence.

**Explicitly out of scope,** each with a reason:

| Out of scope | Why |
|---|---|
| Claim `when:` triggers | The alignment pass showed these are pinnable today via the shipped `SimpleTrigger`→`ObjectivePredicate` seam, which makes them a real next RFC — but anchoring is a separate contract from timing, and bundling them is how earlier drafts grew past review |
| Evidence-bound LLM rendering | Needs a provider contract; `capabilities.ts:33` ships `llm: "none"` |
| Corpus, Syzygy, deterministic-feature layers | No code exists for any of them |
| `deviations[].class` as live classification | Runtime semantics, owned by program item #4 |
| Active-path re-withholding on rewind | Deliberate non-goal; see §Specification 3 |

## Specification

### 1. Reveal scope is a checkpoint

A **scope** is a checkpoint id declared by the pack. Every piece of authored
prose is assigned to exactly one scope, derived from where it sits in the
authored structure. **No new authored vocabulary is introduced** — assignment is
computed, not declared, because a pack that must annotate its own annotations is
the failure mode of the withdrawn contracts RFC.

Scope assignment, in order:

1. Order the pack's checkpoints by the position of their trigger node in the
   spine walk. Checkpoint *k* owns every spine node from the node after
   checkpoint *k−1*'s trigger through its own trigger node, inclusive.
2. Spine nodes after the last checkpoint's trigger belong to a synthetic
   terminal scope `"__tail"`.
3. Each authored item takes the scope of the spine node it anchors to:
   - `spine[].annotations[]` → the scope of that spine node.
   - `deviations[]` → the scope of `at.spineNodeId`.
   - `checkpoints[].label` and any prose the checkpoint itself carries → its own
     scope.
   - `planClasses[]` and `concepts[]` → the scope of the **first** checkpoint
     whose `interaction.planClassIds` references them; if none does, the first
     checkpoint in the pack.
   - `feedbackClaims[]` → the scope of the first checkpoint in the pack, until
     the claim-trigger RFC gives them real anchors. This is deliberately
     conservative: an unanchored claim reveals early rather than never, and the
     honesty cost is stated in §Deviations from design.

Scope assignment is pure and depends only on the pack document, so it is
computed once at registration and memoized on `PackRecord`.

### 2. The reveal predicate

Replace the single boolean with a scope set. Current shape:

```ts
// apps/server/src/feedback-policy.ts:11
export function feedbackIsRevealed(pack: PackRecord, run: DrillRun): boolean {
  return pack.feedbackPolicy === "delayed_checkpoint"
    ? run.events.some((event) => event.type === "checkpoint.reached")
    : run.events.some((event) => event.type === "segment.completed");
}
```

New shape, additive — the existing function is retained and re-expressed in
terms of the new one so every current call site keeps its semantics:

```ts
export function revealedScopes(
  pack: PackRecord,
  run: DrillRun,
): ReadonlySet<string>;

export function feedbackIsRevealed(pack: PackRecord, run: DrillRun): boolean {
  return revealedScopes(pack, run).size > 0;
}
```

`revealedScopes` returns, for `feedbackPolicy: "delayed_checkpoint"`, the set of
`checkpointId` values carried by `checkpoint.reached` events
(`packages/runtime/src/types.ts:117-119` — `{checkpointId, nodeId, branchId}`).
For `segment_end`, it returns the scopes of every checkpoint whose trigger node
lies at or before the last `segment.completed` boundary, plus `"__tail"` once the
run is terminal.

**Fail closed.** When `pack === undefined`, `revealedScopes` returns the empty
set. This is the opposite of the current behaviour at `feedback-policy.ts:21`
and `:48`, where `publicNodes`/`publicEvents` return **everything** for a
pack-less run — defect D2. That inversion is latent today because pack-less runs
cannot be created, and becomes live the moment F2 lands, so it is fixed here.

### 3. Monotonic, not path-sensitive — and why

A scope, once revealed, stays revealed for the life of the run, even after a
rewind to before its checkpoint. This is deliberate: the learner has already read
the prose, and pretending otherwise is theater of exactly the kind
`drill-client` DC-C6 rejected. Per-branch re-withholding would also make the
reveal state a function of cursor position, which the event-sourced projection
would then have to recompute on every rewind.

`reachedOnActivePath` (`apps/server/src/pack-orchestrator.ts`) already implements
path-sensitive checkpoint matching and is **not** used here. If a future RFC
wants "fresh eyes on a re-attempt", that is a new-run concern, not a withholding
concern.

### 4. Transport

New route, run-scoped because reveal depends on run state:

```
GET /runs/:id/authored-feedback  ->  { items: AuthoredFeedbackItem[] }
```

```ts
interface AuthoredFeedbackItem {
  readonly scope: string;               // checkpoint id, or "__tail"
  readonly kind:
    | "annotation" | "deviation" | "plan_class" | "concept" | "claim";
  readonly anchor:
    | { readonly spineNodeId: string }
    | { readonly spineNodeId: string; readonly moveUci: string }
    | { readonly checkpointId: string };
  readonly text: string;
  readonly meta?: Readonly<Record<string, string>>;  // e.g. deviation class, claim id
}
```

The response contains **only items whose scope is in `revealedScopes`**.
Withheld items are absent, not nulled — an absent field cannot be inspected in
devtools, and the size of the response must not disclose how much is being held.

`GET /packs/:id` is unchanged: it keeps returning the browser-safe projection
with no authored prose. The existing regression asserting that
(`apps/server/src/drill-client-server.test.ts`) must stay green untouched; it is
the load-bearing test of the shipped delivery RFC.

Register the route in the run-route matcher at `apps/server/src/rest.ts:299`,
which currently accepts `(moves|rewind|fork|graph|compare|events|evidence|pgn)`.

### 5. Client surface

Minimal but real, in the existing drill screen — no new route:

1. **Checkpoint sheet.** When a checkpoint fires, the sheet lists the authored
   items for the scope just revealed: the annotations for the moves just played,
   any deviation notes for moves the player actually chose, and the plan-class
   descriptions if that checkpoint captures intent.
2. **Timeline anchoring.** An annotated ply shows an affordance; opening it shows
   that node's authored text if revealed. This is the passive-marker pattern the
   owner ruled for Just Play, applied to authored packs so the two behave alike.
3. **Honest absence.** Where a scope is unrevealed, the surface says the content
   is withheld until the checkpoint, rather than rendering nothing. Silence and
   withholding must be distinguishable — that is the `HonestControl` convention
   already shipped in the app shell.

`WhyBanner.svelte` stays as-is and keeps its objective-transition role; this
surface is additive, so the one authored pack stops depending on a transition it
cannot produce.

## Deviations from design

1. **`feedbackClaims` are scoped to the first checkpoint** rather than to their
   real anchor, because claim triggers are a separate RFC. Consequence: a claim
   reveals earlier than it ideally should. Accepted because the alternative —
   holding claims until the trigger RFC lands — leaves the field dead for another
   cycle, and Pack A's two claims are pack-level statements for which the first
   checkpoint is a defensible home. This must be revisited by the claim-trigger
   RFC and is recorded as its first input.
2. **Scope is derived, not authored.** `design/03` speaks of author-controlled
   timing. Deriving it is a narrowing: authors get less control than the design
   implies in exchange for zero new vocabulary. If real authoring shows the
   derivation is wrong for some pack, that is the evidence an explicit
   `revealAt` field would need — and it is the correct order, since the
   withdrawn RFCs failed by inventing such fields first.

## Acceptance criteria

1. `GET /packs/:id` contains no authored prose. Existing regression green, unmodified.
2. **Per-scope**: on Pack A, after `plan-commitment` fires and before
   `break-arrived`, `GET /runs/:id/authored-feedback` contains the annotations
   for `bf5-main`/`nf3`/`e6`/`be2` and the two `bf5-main` deviation notes, and
   contains **no** item anchored to `c5-break`, `be3-hold`, `h4-tal`,
   `h5-reply`, `c5-immediate` or `dxc5-grab`.
3. **Fail closed**: with `pack === undefined`, `revealedScopes` is empty and
   `publicNodes`/`publicEvents` withhold rather than reveal. Unit test asserting
   the inversion of the current behaviour, referencing defect D2.
4. **Monotonic**: after rewinding to before `plan-commitment`, scope
   `plan-commitment` remains revealed. Test states the rationale.
5. **Browser acceptance** (Playwright, matching the existing drill acceptance
   style): play Pack A's spine to `plan-commitment`; the checkpoint sheet shows
   at least one authored annotation; no text anchored to a later scope appears
   anywhere in the DOM, asserted by searching the rendered page for a distinctive
   substring of a later annotation.
6. `make verify` green; `pack-check` behaviour unchanged.
7. `docs/explanation-grounds.md` updated to describe the reveal contract, and its
   claim that Maia belongs with "corpus, Syzygy, and non-Stockfish sources"
   corrected — Maia policy mass is already persisted and reaching the browser.

## Open questions

1. **`"__tail"` naming.** A synthetic scope id could collide with an author's
   checkpoint id. Resolve before `accepted`: either reserve the `__` prefix in
   `pack-check` or key the terminal scope by a non-string sentinel.
2. **Segment-end scope mapping.** `segment_end` packs need the checkpoint→segment
   correspondence pinned against how `segment.completed` is actually emitted; the
   spec above states the intent but the implementer should confirm the emission
   points before encoding it, and report back if they do not line up.

## Changelog

- 2026-08-12: created.
