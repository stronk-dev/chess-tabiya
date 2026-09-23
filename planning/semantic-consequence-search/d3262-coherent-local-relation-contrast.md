# D3262 corrected exact local relation checkpoint — 2026-09-23

This disposable measurement replays the 182 cells of the frozen corrected
target frame. It does not select candidates, grade moves, or claim to explain
an engine preference. `make semantic-search-coherent-local-contrast-check`
recomputes both artifacts byte-for-byte from sealed input digests.

The immediate/witness artifact is
`d3262-coherent-immediate-and-witness.json`, SHA-256
`6cb42fc859e83027a93774f67531fbb8eb51fdea3e6db84236c4298aa1495328`.
It covers 94 material and 88 destination cells. All 96 predecessor-observed
cells are checked against the independent D1023 source reading. Material
causes: 52 preserved positive named captures, 11 attacker captured, 13
target moved, 13 exchange-neutralized and 5 capture-illegal. Destination
readings: 55 locally available, 32 named-pawn punishment witnesses and 1
minor captured. The witness is a legal path for a named arrival, sometimes
followed by a specific positive pawn capture; it does **not** cover every
opponent defence.

The local contrast artifact is
`d3262-coherent-local-relation-contrast.json`, SHA-256
`899991a6331f9742071110fb021b74fc5835e685bedea887dc4a6458f82ad2d2`.
The 64 named targets yield 116 source-versus-selected-natural-alternative
pairs; 17 targets have no selected alternative. Among 60 material pairs,
18 retain a positive named capture only on the source, 11 only on the
alternative, and 31 on both or neither. Among 56 destination pairs, 55
have source-only named-pawn punishment and one cannot be compared because
the minor is absent. These destination examples were authored around that
very pawn relation, so their local contrast is a source-control result, not
a population estimate of why arbitrary engine moves are good.

The corrected branch reserve has **not** yet been joined to these readings
or to deeper replies. An immediate target relation and a two- or three-ply
witness cannot prove persistence, refute all defences, or license a causal
hint. Next: evaluate source-blind selected replies against declared target
outcomes, then compare all five arms and measure cold/warm/provider-off cost.
