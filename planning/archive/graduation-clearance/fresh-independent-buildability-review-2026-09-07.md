# Graduation clearance — fresh independent buildability review

**Date:** 2026-09-07

**Reviewer:** Codex, independent of the 2026-09-07 Claude author amendment

**Verdict:** **RETURNED on [[D3088]]–[[D3091]].** The nine-template table is materially better than
the prior contract: it distinguishes exact tablebase equality, outcome grading, deferred
assessment grounding and explicit adoption of authored payloads. The read-only proposal is total
over 436 entries and honestly leaves 232 author decisions visible. The amendment is not yet safe to
re-accept at schema 0.28, because its required evaluator proof does not exist and two of its claimed
authorities are still values a pack can mint or weaken itself.

## What was independently checked

- `make graduation-plan-check` passes the checked-in 436-entry proposal at 204 `ready`, 232
  `requires_author` and zero `blocked_contract`.
- The nine emitter ids in `apps/server/src/graduation-blocker-templates.mjs` are set-equal to
  `TEMPLATE_CLEARANCE_PLANS`.
- `apps/server/src/sourcing/graduation-clear.ts` implements only the pre-amendment five mechanical
  kinds, as expected before acceptance. No other executable model evaluates `pointer_equals`,
  `objective_graded` or `author_attested`.
- The shared RFC-8785 implementation is `packages/schema/src/drill-pack/digest.ts`; the planner does
  not call it.

## D3088 — the acceptance gate has no executable evaluator

Criteria 21–25 require dangerous-direction negatives, receipt identity and staleness checks,
template preconditions, the deferred assessment subject, and a real nine-template
false → true → false sequence. `tools/graduation-clearance-plan.test.mjs` tests proposal fields and
the unhashed attestation material only. Repository search finds the three new kind names nowhere
outside the RFC, planner, its proposal and those construction tests.

That would be normal before implementation except criterion 26 explicitly makes 20–25 prerequisites
to re-acceptance, while law 1 forbids implementing the production evaluator before re-acceptance.
The author needs one bounded contract model over the actual emitter outputs. It should disappear or
become direct production tests when schema 0.28 lands; another indefinite author/review harness
chain is explicitly not required.

## D3089 — template authority is stated but not joined

The amendment says the closed emitter registry owns every template-specific pointer and
precondition. Its `pointer_equals` union arm nevertheless stores `subject`, `expected` and
`instrument` in the pack, and the evaluator instruction says to compare the resolved subject with
that stored expected value. The arm has no `templateId`. `objective_graded` likewise has no template
identity.

The blocking entry already carries the registered emitter id, so no new public field is necessary:
evaluation can rejoin `entry.id` to the closed plan and require the persisted clearance to be
set-equal to that plan. But that join is not normative and no negative mutates `expected`, `subject`
or `instrument`. Without it, changing the expected value to `human_common` turns the exact-equality
repair back into the original laundering channel.

## D3090 — the receipt proves byte agreement, not a human actor or time

The payload digest usefully binds pack id, blocker id, template id, pointer names and current
values. It does not authenticate an actor. Anyone able to edit the pack can calculate that public
digest and write the literal `authority: "human_chess_author"`. `authoredAt` is not part of the
digested material and can be rewritten without invalidating the receipt.

The smallest honest repair is to call this an explicit content declaration whose human provenance
is enforced by the repository's authoring process, not something the machine proves. If actor/time
provenance is meant to be a product invariant, the evaluator must instead consume a private or
signed authoring authority and bind the timestamp. Either choice can preserve the exact-payload
staleness property; the current claim cannot.

## D3091 — planner and production do not share the claimed digest authority

The RFC says both sides use the existing `digestCanonicalJson` RFC-8785 primitive. The planner
defines a separate synchronous `canonical()` plus `createHash`. Its ordinary JSON ordering matches
the shared implementation, but it omits the shared rejection of lone Unicode surrogates. A parsed
JSON string may contain such a surrogate, so the planner can create an emitted digest for material
the named production primitive rejects.

Use the shared canonical serializer for both creation and verification (hashing its exact bytes if a
synchronous call site is required), and pin the malformed-Unicode refusal. A receipt format cannot
start with two authorities for its canonical bytes.

## Required bounded author repair

1. Add one disposable evaluator contract that executes criteria 21–25 over the nine real emitter
   shapes and is retired into production tests at implementation.
2. Rejoin every registered blocker id to its exact registry plan before evaluation and reject any
   pack-side field mismatch.
3. Narrow the attestation claim to what its bytes prove, or introduce an authentic author issuer;
   remove, label or bind `authoredAt` consistently.
4. Use the shared RFC-8785 canonicalization authority on both sides and test its refusal domain.

No pack schema, corpus, sidecar, production evaluator or protected design byte was changed by this
review. Schema 0.28 remains held until author repair and another genuinely fresh review.
