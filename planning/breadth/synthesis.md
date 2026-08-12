# Breadth alignment — synthesis across the six dossiers

2026-08-12. Six parallel passes over `apps/`, `packages/` and `docs/`, one per
program area, each required to cite `file.ts:line` for what exists and a grep
for what does not. Every claim reproduced below was independently re-verified
before landing here. Individual dossiers hold the full tables; this file holds
what only shows up when you read all six together.

## 1. The headline: breadth is closer than the gate table says, for one reason

The foundation RFCs cut slots that no surface ever filled. Across six
independent areas the same shape recurred — a contract that shipped, was
tested, and has **zero producers**:

| Declared and inert | Where | Consumer that would fill it |
|---|---|---|
| `outcome.reached` event | run schema v0.4, no-op projection | Outcome Drill completion |
| `transfer.scheduled` event | `runtime/src/types.ts:161`, `events.ts:135` | B7 episode scheduling |
| `human_model_predicted` evidence source | `runtime/src/types.ts:12` | Maia evidence layer |
| `feedback.generated` event | carries `{nodeId, evidenceRefs}`, emitted nowhere | any explanation surface |
| `CheckpointInteraction.prediction` (+ `grading`, `flipBoard`) | v0.2 schema, sparsity linted | prediction checkpoints |
| drill/FEN address grammar | `schema/src/drill-pack/urls.ts`, fully tested | drill-in-a-URL |
| generic predicate evaluator | `runtime/src/objective.ts:195-230` | every objective type but one |

This is the most important structural fact of the pass. Breadth-first was the
right call and the foundation work did its job: the contracts exist. What is
missing is overwhelmingly **producers and surfaces**, not design. Estimates that
treat each B-gate row as greenfield are wrong by a wide margin.

The mirror-image risk is equally real: a slot with no producer is indis-
tinguishable from a working feature when you read the type. Five withdrawn RFCs
were written against exactly this illusion. Hence the citation discipline these
dossiers were produced under, and hence §5.

## 2. The actual feature foundations — three primitives, each blocking several areas

The instruction was to align on the *foundations*. They are not eight program
items. They are three primitives, each currently absent, each blocking work in
areas that never talk to each other:

### F1 — Per-scope reveal

`feedbackIsRevealed(pack, run)` (`server/src/feedback-policy.ts:11`) is one
boolean per run. Reaching the first of Pack A's three checkpoints would release
prose for all three.

Blocks: B4 authored prose delivery (the named prerequisite in the *implemented*
`rfc/archive/authored-feedback-delivery.md`); B5 streamer overlay (audience sees
evaluation while the streamer plays blind — impossible while withholding is
per-run and the latch is global and monotonic); coach-reveals-prose in academy
sessions. One signature, five call sites, no new dependencies.

### F2 — Pack-optional run identity

A pack is mandatory at six layers: run schema requires `packId` + `packDigest`;
`runtime/src/types.ts:188-189` makes both non-optional; `rest.ts:198` requires
`packId`; `service.ts:130` calls `packRegistry.required()` and
`application.ts:295` always supplies the registry, so the pack-blind branch at
`service.ts:145-152` is reachable only from tests; the browser's
`CreateRunRequest` cannot express a pack-less start.

Blocks: Just Play and from-position starts (B2); Position Arena leg import (B5);
the pack playtest harness (B6). **And it carries a coupled defect** — see D2.

### F3 — A subject

`grep -riE "learnerId|userId|profileId|accountId"` over all source returns
nothing. The only actor token is a browser-local UUID. There is one database
table. Every B7 row presupposes a learner entity that does not exist.

Blocks: all of B7; host/participant/spectator roles in B5; and the write-
credential defect D1. Adding it once is one migration; adding it per-feature is
three.

**These three are the answer to "align on the feature foundations."** Nothing in
items #4–#8 can be honestly minimal-but-real without them, and each is small in
isolation. They are also mutually independent, so they can land in parallel.

## 3. One structural constraint that is not a primitive

**N-way comparison is a runtime type change and cannot be composed from
pairwise calls.** `BranchComparison` hard-codes `{a, b}` on every collection
(`runtime/src/compare.ts:49-64`); REST, transport and the controller inherit it;
the UI checkboxes are theater (`compareIds.slice(-1)` evicts the oldest).

The trap: each pair's `plyOffset` is relative to *that pair's* fork
(`compare.ts:198-211`), so N−1 pairwise calls over branches forked at different
nodes would silently align unrelated plies. An N-branch overview built that way
would be confidently wrong.

Blocks: multi-branch overview, simulate grid, branch race (B3), and the Arena
two-leg comparison (B5 — which for the same reason must import both legs as
root-forked branches of **one** run, since `compare` requires a common fork node
within a single run).

## 4. Defects found by the pass

Distinct from gaps. These are things that are wrong now.

| # | Defect | Evidence | Severity |
|---|---|---|---|
| D1 | **A run link is a write credential.** *(Correction 2026-08-12: the dossiers listed two `activeWriterId` consumers; there are three — `App.svelte:103-108` compares against the run-**list** value and renders at `:198`.)* `assertActiveWriter` is string equality (`runtime/src/errors.ts:37-44`); the server publishes `activeWriterId` in `GET /runs/:id/graph` (`service.ts:258`) and every `GET /runs` summary (`storage.ts:20`); no authentication exists anywhere in source. Any reader can send it as `x-writer-id` and take the lease | verified | low impact local, **hard-blocks** all of B5 and any shared deployment |
| D2 | **The withholding barrier fails open.** `publicNodes` and `publicEvents` return everything when `pack === undefined` (`feedback-policy.ts:21,48`). The moment F2 lands, ADR-0006 is violated silently. `service.ts:186,205` also enqueue no evidence for a pack-less run, so there would be nothing to withhold either — both halves must flip in the same slice | verified | latent, becomes live with F2 |
| D3 | **`POST /runs` silently accepts unknown nested fields** — violates never-silent. Same shape as the checkpoint-action problem: the author writes something, the validator blesses it, nothing happens | codex, session 2 | real |
| D4 | **Action-vocabulary drift risk.** The server allow-list (`pack-validation.ts:11`) and the client's recognized-action switch are two hand-maintained lists that currently happen to agree. A shared constant or an equality test is what prevents the next divergence | verified | latent |
| D5 | **The release compose has no light profile** — `ENGINE_MODE: maia` is hardcoded with an unconditional Maia dependency, so self-hosters following the published artefact must run Maia | dossier | real |
| D6 | **`phase` never reaches the client.** `PackSummary` omits it (`pack-registry.ts:16-24`); `grep -rn "phase" apps/web/src` finds two unrelated prose strings. The Learn IA is organized on this axis | verified | real |

## 5. Beliefs this pass falsified

Recorded prominently because acting on a stale belief is how five RFC drafts
died. Each was re-verified.

1. **"B4 is blocked on authored content supplying the vocabulary."** False for
   six of nine contracts. The withdrawn `authoring-contracts-v03.md` §1 argued
   claim `when:` triggers cannot reuse the runtime's `ObjectivePredicate`
   "without duplicating a second vocabulary" — but `pack-orchestrator.ts:39-59`
   already translates the pack's key-discriminated `SimpleTrigger` into exactly
   that runtime type, and `evaluateObjectivePredicate` evaluates it. The seam is
   in production use for checkpoints. Claim triggers are pinnable today. Only
   the timing move-set, non-Stockfish payload widening, and the LLM provider
   genuinely lack a pin.
2. **"The checkpoint-action vocabulary is open and unaligned."** Closed by
   `ef4cfe6`: `SUPPORTED_CHECKPOINT_ACTIONS` is frozen and unknown values fail
   load and `pack-check`. It was still queued as an RFC input. The residual is
   D4, which is a different problem.
3. **"Prediction checkpoints are a candidate idea."** The authored half ships:
   `prediction` with `grading{source,topK,minMass}` and `flipBoard` is in the
   v0.2 schema, and sparsity is *mechanically enforced* (`lint.ts:115-138`, max
   2 per segment). Delivery is what is missing — `pack-registry.ts:66-71`
   projects checkpoints down to `{id,label,actions}` and drops `interaction`,
   with a regression test asserting it.
4. **"Maia is an unintegrated evidence source."** Policy mass is already parsed
   (`opponent-selector.ts:225`), persisted in the v0.4 selection payload, and
   reaching the browser inside `opponent.move_selected` — the withholding
   barrier gates only `evidence.attached` and engine-referenced objective
   changes. The walkthrough's "no Maia alternatives" is a rendering gap.
   `docs/explanation-grounds.md` grouping it with corpus/Syzygy is a category
   error.
5. **"Study import is potentially the biggest K10 lever."** Measured cost is 105
   minutes, 45 of them tooling friction (43%, past the ~25% threshold that fires
   the build-tooling rule) — but **all 45 were playtest/run-assembly friction**,
   which import does not touch. Import attacks the other 55% (research +
   encoding). And `owner-review` is still 0, the clock `content-era/plan.md` §1b
   calls decisive, so **no K10 verdict is supportable in either direction right
   now**. The lever that has actually fired is a playtest harness.
6. **"B8 deployment is partial."** The ruled packaging shipped in full — compose
   profiles, GHCR multi-arch, digest-pinned release compose, devcontainer. B8 is
   *overstated* elsewhere: `/settings` contains no form control at all, only
   `<dl>`/`<ul>`, so the opponent/feedback/engines/accessibility row is nominal.
7. **"Concept-primary scheduling is available to choose."** `concepts` appears
   only in `schemas/drill_pack.schema.json` — not in the TypeScript types at all
   — and is unique *within one pack*. Two packs writing `break-timing` have no
   contract making them the same concept. Choosing concept-primary means first
   building cross-pack concept identity.
8. **Two gate metrics are currently unfalsifiable.** `gates.md` tracks
   "voluntary return to the same concept" when no concept can be returned to and
   no attempt is recorded; and Pack A declares no `objective.successConditions`,
   so the one explanation surface that exists (`WhyBanner.svelte`, 52 lines,
   fires only on objective transition) can never fire for the only real pack.

## 6. What this changes about the program

The eight-item ordering in `design/03-product-breadth.md` survives — evidence
and explanation genuinely is the highest-risk early item, and Live genuinely
cannot be validated by use without other humans. Two amendments follow from the
evidence, neither of which reorders the items:

- **Item #1 is not finished.** Its residuals — `/settings` having no controls,
  `phase` not projected, the drill-address grammar having no consumer — are
  inherited by items #3, #5 and #7. They belong to the foundation edge, not to
  whichever later item trips over them.
- **The roles/session carve-out is now justified.** Design/03 already permits
  shared roles/events plumbing to land earlier "if another RFC genuinely needs
  it". Item #3's own scope names sharing and spectator-safe projections, and
  D1 sits underneath both. The capability edge lands with #3, not with #8.

Sequencing that follows: F1, F2 and F3 are independent and land first; D2 lands
inside F2 by necessity; item #2's explanation surface and item #3's session
contexts then proceed in parallel; N-way comparison (§3) precedes every B3
surface that displays more than two branches.

## 7. Owner-level questions

Consolidated and de-duplicated from all six dossiers. Craft decisions were
resolved inside the dossiers under stated assumptions; these four are the ones
where a different answer produces different software.

1. **Deployment posture.** Local-first single-user with share links, or a hosted
   thing other humans log into? This one ruling resolves the identity model
   (F3), the share model, whether PWA offline creates a second write locus
   against the single-writer lease, and whether community contribution means a
   file format or a contribution channel. ADR-0004's revisit trigger reads
   "multi-user/SaaS posture chosen in Q2", and Q2 ruled self-hosted — so B5's
   multi-human scenarios are currently in tension with a standing decision.
2. **Scheduling unit: episode-primary or concept-primary?** Episode-primary is
   pinnable today. Concept-primary requires building cross-pack concept identity
   first (§5.7). `design/03-product-breadth.md:73` implies both.
3. **Is a plan commitment a branch?** `Branch.intent?: string` settable at
   `fork()` is the only shipped recording site for intent capture, which makes
   the feature nearly free — but it collides with the walkthrough finding that
   branch growth is already cumbersome.
4. **Just Play's interruption model.** Silent annotation, a passive marker the
   player may open, or a blocking checkpoint? This decides whether recognition
   is a background annotator or a director, and it is the difference between
   Just Play being a mode and being the product.
