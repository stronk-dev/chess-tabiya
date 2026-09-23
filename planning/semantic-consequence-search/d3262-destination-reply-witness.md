# D3262 — declared minor-arrival and pawn-capture witnesses

**2026-09-23 · bounded direct-target diagnostic, not the preregistered five-arm exact result.**
For each of the 87 named minor/destination questions, the checker joins the selected candidate
to its **complete legal opponent-reply set**. It looks for the named bishop/knight's exact move
onto the registered square and replays that stored reply FEN. A legal capture one learner ply
later is checked with `legal-exchange@1`; the result is existential and scoped to this named
line, not a claim about every defence or the move's objective quality. `[V]`

`d3262-destination-reply-witness.json` has digest
`sha256:b640f11586360690928c1ae67940ceef3ffb440084fdd28acd998bfa4561b54c`.
It retains 32 `[candidate, minor arrival, declared pawn capture]` witnesses, 54
`[candidate, locally safe minor arrival]` witnesses, and one typed `named_minor_absent` result.
The absent case is an alternative that captured the minor; it is not pawn prevention. Every
arrival is checked against the graph's legal reply and resulting FEN. `[V]`

The source-identity trap is executable, not hypothetical: after `a7a6` in
`d1023:3f3bae7705d0c126`, the generic first positive capture of the bishop on b5 is `a5b5`.
The declared controlling pawn was moved to a6, and its own positive capture is `a6b5`. The
receipt retains **both** facts and uses `a6b5` in the declared-pawn witness. A forged declaration
that points to the a5 pawn fails because `a7a6` did not move it. [[D3278]] `[V]`

`make semantic-search-destination-reply-witness` checks types, exact bytes, all 87 outcomes,
and negative fixtures for a deleted arrival, crossed reply FEN and forged pawn identity. One
methodological boundary stays open: the frozen D3262 exact arm permits the additional learner
ply only after a check, capture or attack on the registered target. Minor arrival on the named
square is not explicitly in that trigger set. This diagnostic therefore **cannot** be counted
as that arm's reach, cost or proof result; adding destination occupancy requires a separately
preregistered comparison. [[D3279]]
