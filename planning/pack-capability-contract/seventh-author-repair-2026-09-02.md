# Pack capability contract — seventh author repair

- **Date:** 2026-09-02
- **Scope:** author-only repair of [[D2509]]–[[D2513]]
- **Status:** complete; fresh independent review required
- **Executable:** `make pack-capability-seventh-author-repair` — 6/6 plus strict TypeScript
- **Cumulative:** `make pack-capability-author-contract` — green
- **Production authorization:** none; [[D560]] remains held

## What changed

The operation authority now starts from the production boundary rather than a route list that can
agree only with itself. Its reviewed author post-image covers all 36 actions parsed by
`parseRunRoute`, 48 supported method/body branches and ten external branches: Pack Studio register
and playtest, ordinary/imported/rated/repertoire creation, `/select-move`, public Story and share
revocation. Every nested creation path is separately enumerated, including flip and both stored-run
duplicate arms. The fictional `/studio/drafts` registration prefix remains a negative.

Group creation is total over its four source values. `hand_picked` and `authored` are local;
`human_replies` and `engine_top_n` join the opponent consumer before `select`/`enumerate` and before
the first write.

The owner-ruling absence cause no longer dictates one response effect. Each non-local operation
names a compiled consumer, and that consumer supplies `available`, `honest_empty` or `unavailable`.
The route supplies neither requirements nor provider-off behavior. The author image includes all
three effects and the contract requires distinct negative fixtures.

## Additional finding

The repair trace found [[D2513]]: `registered_pack_operation` cannot serve Position or imported
sessions, although their analysis, human split, corpus, Story and related operations are legal.
The replacement `run_session_operation` derives fixed operation requirements, the exact session
policy requirements and pack requirements only when the immutable run actually has a pack.

## Fresh-review attack surface

The next reviewer must independently derive the AST/router population, try a provider call outside
the wrapper, cross duplicate/group discriminants, and prove the three provider-off effects are
consumer-derived rather than copied. Passing the author artifact alone is not acceptance.
