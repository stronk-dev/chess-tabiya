# Campaign core fourth author repair — 2026-09-02

## Scope

This author pass repairs the eight buildability blockers returned by
`third-fresh-independent-buildability-review-2026-08-31.md`. It changes the draft contract and a
disposable falsifier only. It does not authorize or implement schema, storage, routes, client UI or
official Campaign content, and it does not claim the complete Campaign 1.0 journey.

## Repaired authority

- [[D2420]]: the normative DDL contains the partial unique active-run index, exercised with two
  independent SQLite writers.
- [[D2421]]: creation alone has a null expected revision; later events bind sequence to the exact
  expected revision.
- [[D2422]]: later events durably retain normalized operands and the immutable result image used for
  same-command replay.
- [[D2423]]: Campaign theory availability includes exact applicability and disclosure/directness,
  not ownership alone.
- [[D2424]]: the `node_entered` event sequence freezes the inventory used by both active play and
  sealed Review.
- [[D2425]]: official curriculum metadata is compiled from pinned node facts and checked by exact
  set equality, including phase, encounter form, theory and dependencies.
- [[D2426]]: account export/delete and whole-appliance restore are kept distinct; fictional account
  import, merge and rekey operations are removed.
- [[D2427]]: deleted sealed runs, deleted abandoned runs and corrupt missing runs have distinct
  history projections.

## Executable receipt

`make campaign-two-horizon-fourth-author-repair` passes:

- the retained 34-arm Campaign author contract;
- 9 fourth-repair tests, including the real two-writer SQLite race and one closure check; and
- the strict TypeScript compile for the disposable model.

The next admissible action is a fresh independent buildability review. Production implementation
remains refused until that review accepts the RFC and every named dependency is accepted.
