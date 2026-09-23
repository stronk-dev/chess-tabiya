# D3262 / D3286 — path-history correction profile

**Frozen 2026-09-23 after first-child Maia history measurement and before
supplemental Stockfish or deeper Maia capture.** This is a separately labelled
research profile. It does not rewrite `d3262-preregistration.md`, the
2,186-path empty-history frame, its 2,185-position Stockfish source, or any
earlier negative result. First-child policy changes are **already observed**;
the downstream proof, abstention and cost outcomes are not.

## Exact population and source identity

- Retain the frozen 66 roots, 196 candidate moves, 6,310 exact first replies,
  registered targets and held-out controls from the original D3262 manifest.
  No new candidate, target or favorable reply may enter based on its outcome.
- Hold provider-line, exact-one-reply/forcing-extension, width-eight Stockfish
  and source-blind semantic-event selectors unchanged. Their existing source
  and interpretation caveats still apply, including [[D3280]] and [[D3285]].
- For Maia at a candidate child, query the pinned Maia3-5M model with
  `position fen <registered root FEN> moves <candidate UCI>`. Use band 1400,
  temperature 0.8, top-p 0.92 and complete legal-logit masking. The sealed
  source is `d3262-maia-history-replay.json` with SHA-256
  `81b3d761395be080585af93127245e2116b12b175fac915c9892e1fce361adf4`.
  Its empty-FEN baseline remains a distinct diagnostic, never the substituted
  live-path mass.
- Apply the same capped width-eight 0.80/0.90 configured-mass prefix rule as
  the original profile. The already observed counterfactual selection is
  sealed by `d3262-maia-history-frame-delta.json`, SHA-256
  `67456d55962aa98f7539151094db00a7ee902df4ae901ca8ebd7e56b98abe7fe`:
  2,189 selected root/candidate/reply paths over 2,188 FENs. A new candidate
  at the same FEN is a distinct Maia history identity, but may reuse an exact
  Stockfish FEN source if executable, budget and score conventions agree.
- At each selected reply node, query Maia using that path's registered root
  FEN followed by **candidate and reply** UCI moves. Do not deduplicate Maia
  on final FEN. The root is the observable history boundary; any moves before
  it are unavailable and must not be imputed. Persist source model/checkpoint
  digest, UCI adapter digest, band, temperature, top-p, full legal denominator,
  configured support and ordered history for every query.

## Capture and comparison gates

1. Reuse the checked old-frame Stockfish source only for the same 2,169
   positions that remain selected and have identical FEN/budget/source
   identity. Capture and independently verify all 19 newly selected FENs at
   depth 8, depth 12 and 100 ms with a single coherent rank-depth table and
   exact legal/PV replay. The old full artifact is not a full source for this
   profile until those 19 pass.
2. Query Maia at all 2,189 selected paths, preserving duplicates at a shared
   FEN. Complete support, missing/terminal state and provenance must be
   explicit; no unreturned move is silently zero unless the direct configured
   top-p sampler excluded it after full-legal scoring.
3. Run the original five arms with the same registered target controls,
   perspective/polarity rules, exact-arm trigger interpretations, four-ply
   horizon and per-budget width comparisons. The only source change is the
   Maia history identity and its consequent selected first-reply union.
4. Report reach, witness/refutation/abstention mix, false attribution,
   engine-budget agreement, covered/residual Maia mass, visited nodes,
   path-versus-position reuse, cold/warm/offline latency and memory under the
   original outcome definitions. Report the old and corrected profiles
   side by side; do not pool denominators or select a winning profile from
   whichever arm looks best after inspection.
5. A missing path, source drift, incoherent timed rank table, illegal line,
   unavailable provider or missing 19-position supplement yields an explicit
   incomplete result, not a default search profile. No LLM sentence may
   promote a selected branch into a causal engine reason without the original
   counterfactual continuation proof.

The first-child correction is not evidence of human reply frequency. This
profile can inform D3262 criterion 23 only after the required downstream
source and proof measurements; it does not itself discharge criterion 23 or
authorize production behavior.

## Post-freeze source receipt — 2026-09-23

Capture gates 1 and 2 are now met at the provider-source level:
`d3262-stockfish-history-supplement.json` checks all 19 missing positions,
and `d3262-maia-horizon4-path-capture.json` checks all 2,189 ordered Maia
queries. The paired source and its limitations are recorded in
`d3262-path-history-provider-capture.md`. Gates 3–5 are **not met**: no
five-arm hypothesis/proof comparison, mixed-old-timed-rank re-capture or
end-to-end cost verdict has been produced. This status entry does not change
the preregistered population, algorithms or measures above.
