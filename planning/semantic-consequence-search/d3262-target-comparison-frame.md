# D3262 — named target × selected candidate comparison frame

**2026-09-23 · questions for traversal, not answers.** The checked target register contains
96 source rows but only **64 distinct `(root, family, target)` identities**. Material paired rows
often name the same attacker/victim on two candidate moves; counting them as two different
semantic targets would inflate reach. The common root frame selects 196 legal candidate moves
across 66 roots. `[V]` `d3262-target-register.json`, `d3262-root-frame.json`.

`d3262-target-comparison-frame.json` (`sha256:e49853176f2c5ad789aea8891d91b4b4ded36f822ad7b71dceae8107d2b8e615`)
joins each of the 64 named targets to every selected candidate at its *own* root. This yields
**185 target/candidate questions**: 96 have that exact source-row identity and 89 are natural
alternatives with no inherited outcome. The 96 source identities are not necessarily positive
examples; `sourceObserved` means only that the sample asked about that exact pair. An alternative
may remove, preserve, restore or never touch the relation; nothing here calls it good or bad.
`[V]`

The four special controls stay separate from this D1023 target schema. The two fork roots and
bishop-pressure root point at their already checked declared relations. Carlsbad remains
`no_autonomous_semantic_target`: its authored route is a content claim, not a search predicate.
`make semantic-search-target-comparison-frame` rejects a missing source candidate, crossed
manifest, or false observed-pair flag and checks exact artifact bytes. `[V]`

This closes the shared contrastive *population*, not the D3262 experiment. Search still has to
evaluate each pair with identity-safe traversal, typed witness/refutation/abstention, the five
preregistered frontiers, and measured reach/cost before any default profile is authorized.
