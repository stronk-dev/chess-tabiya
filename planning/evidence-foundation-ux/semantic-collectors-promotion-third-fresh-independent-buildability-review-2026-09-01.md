# Held promotion collectors — third fresh independent buildability review

- **Date:** 2026-09-01
- **Reviewer:** Codex, independent of Claude's D2179–D2183 author repair
- **Scope:** only the two held §3.7 promotion projections and their exact upstream route; the twelve
  implemented projections are unchanged
- **Verdict:** **returned** on [[D2469]]–[[D2472]]; [[D2468]] also returned the candidate packet's
  sixth repair and was corrected immediately without changing product bytes
- **Reproducer:** `make semantic-collectors-promotion-third-fresh-review`

## What survived

The repaired contract retains exact pawn-contact, legal-map and recorded/live tablebase evidence;
the success receipt preserves all three inputs and output by identity. Keeping promotion check as a
separate exact check event is sound: consumers can join the same before-FEN and triggering move
without duplicating check calculation. The grounding/exactness mix is also honest. These findings do
not reopen the original twelve collectors.

## Returns

### D2468 — one route had two names

`evidence-value-authority` and this RFC pin
`createRulesMobilityReadingLegalMovesV1Evidence(fen)` and explicitly forbid compatibility aliases.
The candidate-packet sixth repair instead introduced `declareExactLegalMovesEvidence(fen)`. That
repair is now corrected to consume the registered route and to depend on value-authority landing;
its measurement and one-object-graph result are unchanged. A fresh candidate review still remains.

### D2469 — outside-domain execution requires an undeclared input

Derivation member 3 and its result retain geometry plus local-domain evidence only. The invocation
prose nevertheless returns `input_abstained` for an absent legal map before resolving the source or
local domain. An outside-domain result therefore cannot execute from its declared inputs. Resolve
domain before requiring the success-only legal map, or declare and retain that map on member 3.

### D2470 — no request/source-selection boundary

The document closes `PromotionRaceTablebaseResult` but defines no request type or
`collectPromotionRaceTablebase(...)` signature. “A recorded item takes member 1; otherwise call the
provider” leaves supply, absence, invalidity and caller choice unspecified. The repair needs one
closed request algebra and one fail-closed precedence rule; invalid recorded evidence cannot become
permission to fall back live.

### D2471 — authority failure is reported as source absence

The same section says forged, generic, wrong-id and unsealed evidence fails before calculation, then
maps “missing/invalid/unavailable” input to `input_abstained`. Invalid authority is an invariant
failure, not an honest learner-facing absence. Only a typed missing or unavailable input may
abstain.

### D2472 — completed zero-output is called unavailable

`no_opposing_passed_clear_paths` is a valid completed calculation that mints no geometry value. Its
result arm is nevertheless `kind:"unavailable"`. The semantic-validation contract distinguishes
completed target-count zero (`omits`) from unavailable (`abstains`); the current shape would make
downstream validation and availability UX lie. Use a completed/no-output arm and carry it through
the tablebase collector without requesting a provider.

## Required author repair

Publish an exact invocation request and signature; separate invariant failure from typed absence;
represent valid no-witness as completed/no-output; and order resolution so the outside-domain arm
needs only the inputs its derivation declares. Then update the executable author contract and send
only the held pair through a fourth fresh review. No runtime, content, pack, API, bot or learner UX
implementation is authorized by this review.
