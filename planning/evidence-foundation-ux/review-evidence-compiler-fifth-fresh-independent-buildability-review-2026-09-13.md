# Review evidence compiler — fifth fresh independent buildability review

- **Date:** 2026-09-13
- **Reviewed image:** fourth author repair for [[D3109]]–[[D3115]]
- **Gate:** `make review-evidence-fifth-fresh-review`
- **Verdict:** **RETURN TO AUTHOR** on [[D3184]]–[[D3189]]; no production Review compiler is
  authorised

## What survived

The fourth repair genuinely improves the model: declared evidence is retained in node packets;
packet and Story receipts retain family/completion state; digest construction uses the shared
fail-closed canonical serializer; concurrent equal requests share one promise; and successful
delivery has an exact digest release. The predecessor gates remain green.

## Returned seams

| row | executable result | required repair |
|---|---|---|
| [[D3184]] | The fixture has one adapter per family. Production will not. The fold uses `.find(family)` and `itemCount: 1`, ignoring sibling adapter states and counts. | Fold every planned adapter result within each node/family; prove mixed available/empty/unavailable siblings and exact item counts. |
| [[D3185]] | The source plan is adapter × every node. `input: "node" | "edge"` is metadata only, so edge adapters are invoked at the root and no bounded-window grain exists. | Compile exact node/edge/window invocation identities from the adapter grain and subject path; reject impossible root edges and crossed windows. |
| [[D3186]] | `cancel()` always deletes the entry. Repeated acquire/start/cancel never reaches the attempt ceiling. | Distinguish zero-start reservation release from started cancellation; retain the latter's attempt count and terminal/retry state. |
| [[D3187]] | Prefix issuance picks the maximum event sequence without contiguity, hashes no path bytes, accepts an unsealed import record and selects an outcome anywhere in the run. | Consume production-owned parsed run/import authorities; prove contiguous prefix; bind ordered path; require the terminal event on that path and exact imported-result agreement. |
| [[D3188]] | Adapter `parser` is an inert string. `declareEvidence` seals any payload object without calling it. | Make parser/constructor functions registry authority, and produce available results only from their exact projection payload parser. |
| [[D3189]] | `entryNodeId` equals the evidence node for every moment, reproducing [[D3100]]. | Derive separate decision/evidence/stop identities from recorded edges and keep all three through the closed Story/Review receipt. |

## Why this blocks Review and mistake-return decks

A multi-projection family can currently report one item while retaining several, an edge source can
claim the root, a cancelled job can retry forever, and a selected moment re-enters after the move it
is supposed to retry. Those are authority and workflow errors, not missing polish. Building the
current model would produce a superficially complete Review whose counts, retry lifecycle and
return doors are false.

## Reproduction and next action

`make review-evidence-fifth-fresh-review` retains the complete fourth-author chain and passes six
new source-bound counterexamples. Amend the contract and author model in this order: prefix/source
authority; grain-aware plan and multi-adapter fold; bounded cancellation; decision/evidence/stop
Story identity. Another genuinely fresh review must precede acceptance and production.
