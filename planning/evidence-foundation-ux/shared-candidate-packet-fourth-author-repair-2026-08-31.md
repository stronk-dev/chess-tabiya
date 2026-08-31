# Shared candidate packet fourth author repair — 2026-08-31

## Scope

Author repair for [[D2329]] and [[D2330]] only. This checkpoint changes the RFC contract and a
disposable author instrument; it creates no production packet, collector, schema, content or
learner binding.

## D2329 — one versioned projection identity

The contract now proposes one generated frozen collector-to-projection map. Its generator resolves
every source-family id through `PRIMARY_EVIDENCE_MANIFEST`, emits literal `id@version` keys and
fails check mode on missing, duplicate, extra, stale-version or non-literal output. Registry
outputs, results, failures, abstentions and retained-value joins all derive from that map. Broad
`VersionedEvidenceId` becomes a candidate key only after runtime membership; the implementation
criterion imports the real production union for its arbitrary-string negative.

## D2330 — dependency execution is not retained output

The three packet scopes remain. `planCandidateCollectors` selects requested declarations and then
adds their transitive dependencies in stable topological order. Events executes/retains ten rows;
readings executes five rows, retaining its three reading rows while hiding `event.transition` and
`event.tactical`; wide executes/retains all thirteen. Hidden results stay in the private memo and
receipt-reference authority and cannot appear in row events, readings, abstentions or retained
outcomes.

## Verification

`make candidate-packet-fourth-author-repair` passes two executable arms plus the proposed-type
TypeScript negative. The earlier third-review target remains historical evidence of the returned
contract and is not relabeled as a current positive. Fourth fresh independent review remains
required before acceptance or implementation.
