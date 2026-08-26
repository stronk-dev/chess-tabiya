# F1 execution metadata and confidence — author repair handoff

**Targets:** amend the implemented/frozen F1 contract through the RFC lifecycle, and feed the
shared provider-exchange RFC required by `bounded-policy-targets` and the promotion-race hold.

**Authority:** `design/research/evidence-execution-and-confidence-closure.md` and
`tools/d1700-evidence-execution-harness/`.

No owner chess/product ruling is required for the compiler repair. Do not implement directly from
this handoff: author the amendment, cross-review it against HEAD, then queue implementation.

## Required F1 amendment

1. Add a generated `CompiledProjectionExecution` image to the compiled manifest. Preserve exact
   nested derivation choices, non-local leaf requirements and effective latency for every path.
2. Keep producer availability/latency as own-operation metadata; do not mutate a whole derived
   producer to the slowest child.
3. Add `reported`-confidence inheritance to every derivation member. The four current projection
   repairs are candidate feature vector, story last-level, story rank and story title.
4. Extend provider/source fallback validation through derived paths. Immediate producer
   availability is not the test.
5. Move source-absence behavior to the binding/projection consequence (optional omission,
   honest-empty or operation unavailable). Retain/derive a consumer aggregate only after this
   lower truth exists.
6. Join runtime source availability to compiled paths in `/capabilities`; a local wrapper alone
   cannot advertise a provider-derived item.
7. Keep `dependsOn` as the semantic/migration graph and `derivation` as payload execution. Do not
   demand set equality or conjoin mutually exclusive `anyOf` alternatives.

## Current migration image to pin

- 37 producers / 193 projections / 46 derived projections;
- 96 direct derivation members / 99 fully expanded paths;
- eight local/sync projections with effective Stockfish paths;
- ten transitive-provider bindings across seven projections;
- forty-nine immediate confidence violations across candidate vector, story last-level and story
  rank;
- four transitive confidence repairs after story title is included;
- fourteen `dependsOn`/derivation set differences retained as an explicit non-equality control.

The amendment must rerun these counts at author HEAD and explain every drift; never copy the numbers
as timeless constants.

## Provider-exchange integration

The shared provider RFC consumes this generic contract and adds:

- `live.stockfish.legal_root_table@1`;
- `human.maia.policy_page@1` plus a separate run occurrence;
- `live.syzygy.position_result@1`;
- `human.explorer.position_page@1` plus separate summary/run/repertoire projections;
- same-exchange identity/generation receipts;
- bounded shared scheduling, cache identity, timeout and cancellation;
- real operations and one operator/research traversal per source.

Explorer's literal source/selection boundary is in
`explorer-source-author-repair-2026-08-26.md`: valid sparse populations remain source successes,
node/move occurrence is derived separately, and the interactive budget starts at caller arrival.

Then it compiles these dependent paths without private metadata:

- local bounded-target facts versus Stockfish/Maia policy joins;
- promotion geometry versus recorded/live Syzygy outcome;
- Review points/deltas;
- candidate scoring and bot policy inputs.

## Required red-before-green fixtures

- `reported → exact` and `reported → not_applicable`;
- nested story confidence fixed point including title;
- local derived wrapper around provider input escaping fallback;
- binding declaring sync for an interactive-only path;
- one producer with local-only and provider-bearing sibling outputs;
- nested `anyOf` identities with equal current cost remain distinct;
- recorded/live alternative availability;
- `dependsOn` alternatives are not treated as one execution conjunction;
- capability provider-off join suppresses the unsatisfied path, not the whole unrelated consumer;
- deletion of any source requirement changes the manifest digest and fails the expected path set.

## Cross-review attacks

- Does the proposed type retain exact path identity, or collapse equal cost/source rows?
- Can a second availability authority be hand-authored beside derivation?
- Can consumer-wide `available` still bypass a provider-derived binding?
- Does correcting rank expose title, or does the check stop after one pass?
- Can a recorded source be mistaken for a currently available source?
- Does `/capabilities` report static possibility as live availability?
- Is provider work reachable from a hover/pointer path despite scheduler rules?
- Did the amendment accidentally turn every `dependsOn` edge into a required payload input?

## Closeout

Only close [[D1654]], [[D1700]], [[D1701]] and [[D1702]] when the generic compiler and current
catalogue migration ship with production checks. Provider source/scheduler rows close separately
when their real operations land. Promotion and bounded-target rows remain held until their literal
dependent projections compile and execute.
