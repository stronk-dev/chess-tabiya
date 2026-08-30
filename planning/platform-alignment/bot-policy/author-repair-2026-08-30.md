# Bot-policy author repair — 2026-08-30

## Scope

This author checkpoint repairs the seven independent production-review returns [[D1970]]–[[D1976]].
It changes the RFC and its executable author contract only. It does not implement a provider,
selector, schema, migration, bot profile or content change.

## What changed

- The bot consumes `maia.policy_page@1` and `stockfish.legal_root_table@1` through the shared
  provider exchange. It owns no private request, queue, cache or receipt constructor.
- Maia returned probability mass remains distinct from legal-set coverage. Only identity
  set-equality against the all-legal root table can produce `legal_set_equal`.
- One sealed constructor projects a closed `BotPolicyDecisionRecord` from admitted sources. Closed
  profile/layer/classifier/feature/reason vocabularies and exact candidate set-equality prevent a
  caller-authored record from reopening evidence authority.
- Deterministic policy bytes contain the exact root, profile, seed and provider payload identities.
  Request id, writer lease and timing live in a separate durable `BotOperationReceipt`.
- The request carries expected node, branch and event-head identity. After provider awaits, the
  append rechecks all three plus the writer lease; identical retries replay the durable receipt.
- Maia unavailable/failed yields a typed retryable no-move result and commits no selection event.
  Optional guard abstention is a different state and may preserve an already-delivered Maia page.
- Stage B consumes one admitted `CandidatePopulationReceipt` and the same all-legal root delivery.
  It performs no child enumeration, collector execution, provider call or private caching.

## Executable checkpoint

`make bot-policy-author-contract` covers all seven return families with passing positive controls
and negative mutations. `make bot-policy-independent-review` remains the historical reproduction
of the pre-amendment defects; it is not relabelled green.

## Gate

Fresh independent buildability review is required before acceptance. Production implementation is
also blocked until `provider-exchange-and-execution.md` and
`shared-candidate-evidence-packet.md` are accepted and implemented.
