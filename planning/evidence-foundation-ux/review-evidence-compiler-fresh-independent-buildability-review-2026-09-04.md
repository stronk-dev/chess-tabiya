# Review evidence compiler — fresh independent buildability review

- **Date:** 2026-09-04
- **Artifact:** `rfc/review-evidence-compiler.md` after the D1644–D1651/D1969 author repair
- **Verdict:** returned on [[D2631]]–[[D2635]]; implementation remains unauthorized
- **Executable review:** `make review-evidence-fresh-review` — retained author checks 6/6 plus fresh checks 5/5

## What survives

The repaired direction is materially right. One same-exchange Stockfish delivery carries typed
cp/mate plus raw WDL; WDL is normalized node-free before exact occurrence binding; cp and mate
remain separate domains; exact forced-mate proof linkage uses recorded edges; and one progressive
coordinator is preferable to Story's two private queue paths. Those are necessary foundations for
full Review and remain intact.

The return is about the boundaries around those values. As written, an implementer cannot build a
single authoritative packet, availability receipt or learner wire without choosing semantics the
RFC leaves open or contradicting later platform contracts.

## Returns

### [[D2635]] — the compiler is named but has no public ABI

`compileReviewEvidence(input)` still has no `ReviewEvidenceInput`; `ReviewEvidencePacket` has no
runtime constructor/assertion or aggregate seal. The module execution contract consequently keeps
both fields `null`: its [[D2505]] repair honestly records this upstream absence and does not close
it. Generic `DeclaredEvidence<unknown>[]` plus prose about an “authorized branch”
does not specify which authority is accepted, how source absence enters, or how callers receive a
packet that later code can trust.

### [[D2631]] — completion loses truth in ordinary mixed states

`complete | progressive | degraded` is exclusive. The progressive arm carries pending/retrying/
not-yet-scheduled counts but no terminal unavailable families; the degraded arm carries unavailable
families but no remaining work. One provider failing while another is still scheduled is expected,
not exceptional, and cannot be encoded without hiding one fact. The story-level `families` record
then reuses the node-level single-state union without defining how available on one node and pending
or unavailable on another folds to one canonical value.

Make progress and degradation orthogonal. Publish one total node-to-prefix aggregation algebra and
cross order independence, mixed states, positive counts and every impossible combination.

### [[D2632]] — the receipt bypasses the presentation authority

The later evidence-presentation contract deliberately replaces caller-owned rendered sentence
arrays with sealed component receipts whose equivalent sentence is derived from the same retained
operand. Review instead serializes independent `sentences[]` and `sourceLabels[]` arrays and names
no dependency on that contract. This loses sentence-to-fact/component ownership and creates a
second parser/rendering authority exactly where Review is meant to turn evidence into useful UI.

The internal Review receipt must carry the exact sealed presentation components used by module
seats. A public share may be narrower, but must be a projection of those same admitted components,
not a parallel prose protocol.

### [[D2633]] — packet and story context are not one authorized subject

The packet has `runId` and `branchId`, but no event head, immutable-prefix digest, decision stamp or
sealed recorded-path authority. The compiler input is undeclared, while the renderer accepts an
untyped `context` that supplies learner side, outcome and title. A valid packet can therefore be
paired with stale or crossed context bytes without violating any published interface.

Define the exact recorded-prefix authority in `ReviewEvidenceInput`, retain its head/digest in the
packet and bind `ReviewStoryContext` to it. Negative fixtures must cross same-id different-head,
branch, learner side and outcome inputs.

### [[D2634]] — retry exhaustion has no bounded durable owner

The provider scheduler intentionally retains no failures. Review promises `retry_exhausted` will
not loop on repeated reads using “current process outcomes,” then permits coordinator eviction under
`maxTrackedRuns`. If outcomes leave with an evicted branch, rereading it restarts the attempt budget;
if they live in a separate process map, that map is outside every declared entry/weight/TTL bound.

Name one typed, identity-keyed and bounded owner for terminal attempt outcomes. The permanent test
must exhaust a request, churn more branches than capacity, reread it, and prove both no new provider
call and bounded retained state. Restart retry remains a separate explicitly permitted case.

## Required bounded repair

1. Publish `ReviewEvidenceInput`, one aggregate packet constructor/assertion and exact source/absence types.
2. Make progress/degradation orthogonal and define the deterministic node-to-prefix family fold.
3. Consume the sealed evidence-presentation component/wire authority; delete the parallel raw sentence protocol.
4. Bind packet and rendering context to one authorized event-head/prefix receipt.
5. Give terminal attempt outcomes one bounded owner and retain the LRU-churn falsifier.
6. Retain all six author controls and these five review arms before requesting another fresh review.

No production runtime, server, provider, API, schema, content, UX, archive or protected-design byte
changed in this review.
