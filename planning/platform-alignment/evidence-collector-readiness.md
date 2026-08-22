# Evidence-collector readiness at HEAD

**Date:** 2026-08-22  
**Purpose:** turn the completed detection research into an implementation order without confusing
missing computation, missing semantic retention and missing product delivery.  
**Authority:** D544-D548, D560, D568-D572, D617-D619, D630-D633, D686 and the implemented F1/F2
contracts. This is planning synthesis, not an RFC and not permission to mutate content.

## Verdict

Tabiya is missing evidence, but “build more classifiers” is too coarse. At HEAD there are four
different failure classes:

1. **True collector gaps:** materially meaningful tactical consequences, runtime opening identity,
   the cited local theory bundle, bounded multi-ply threats and several exact state atoms do not
   exist as production evidence.
2. **Computed but discarded:** `vacationReading`, `undevelopedMinors`, `capturedRole` and the FEN
   castling-right field already compute or expose useful inputs but have no retained product event.
3. **Retained but product-ineligible:** F2's 33 exact semantic events and its selector terminate at
   `research.semantic_selection`; no learner module accepts them.
4. **Collected but stranded in source-specific consumers:** Maia, Explorer, engine, tablebase,
   shape and authored evidence are registered, but ordinary play still reaches them through raw
   inspector panels, legacy guidance or review-specific paths rather than F5 modules.

`[V]` The current catalogue declares 20 producers, 126 projections, 25 consumers, 175 bindings,
33 semantic events and 33 eligibility rows. The only semantic-event eligibility target is
`research.semantic_selection`. (`packages/runtime/src/evidence-catalog.ts`;
`docs/semantic-evidence.md`)

Therefore F1/F2 established **authority, retained semantics and experimental selection**. They did
not establish collector completeness or a learner-facing support system. The next foundation work
is an additive atomic-evidence wave, followed by consumer-specific F5/F6/F8 eligibility. It is not
a settings or renderer wave.

## Current capability by 1.0 consumer

| Consumer need | What exists at HEAD | Missing evidence or join | Readiness |
|---|---|---|---|
| Legal affordance and requested sight | legal moves plus structural readings and board marks | F5 budget/eligibility; current sight is the raw structural census | computation ready, consumer missing |
| Keep Me Safe / pre-commit warning | engine guard conditions; exact local attack/defence/ray atoms | selected risk/consequence event that can warn without naming a move; functional loose-piece/tactic semantics | collector + consumer work |
| Threat radar | attacks, defences, rays, escape squares and duties | meaningful multi-target attack, pin/skewer, opened attack, trapped/back-rank and bounded-reply consequences | collector work first |
| Post-commit nudge | 33 signed F2 events and complete-alternative selector | module-specific eligibility; meaningful tactical/state additions; valence authority where a claim needs it | partial foundation |
| Structure nudge | exact/conventional structural readings and eleven event families | pawn connectivity/islands, castling-right state, development, rook seventh and repaired pawn-safe/outpost dependency | additive atoms + F5 |
| Theory breadcrumb | shape firing, authored principles/claims and build-time opening records | runtime transposition-aware opening applicability and the O5/F4 cited immutable theory bundle | source/runtime work |
| Compare coach | recorded routes, structural delta and engine trajectory consumers | F2/module selection and concise learner renderer | consumer work |
| Review Map | story consumer, pivotal/endgame/shape/outcome facts and evaluation-derived moments | Review accepts no F2 events; runtime opening/theory; whole-game moment policy | F6 after atomic wave/F5 |
| Human evidence | Maia policy and Explorer population are registered | selected SAN/meaning modules instead of raw UCI, mass and count panels | consumer work, not new collectors |
| Bot policy | Maia raw response, Stockfish raw response and Syzygy probe feed opponent selection | O8/F8 composition; runtime repertoire identity, clock input and any evidence-based coherence guard | F8 can follow atomic wave |
| Longitudinal coaching | run facts and some progress aggregates | personal-observation ledger with exact sources/opportunities; imported-run projection | F9, not a detector wave |

`[V]` Sources: `packages/runtime/src/evidence-catalog.ts`, `docs/evidence-contract.md`,
`docs/semantic-evidence.md`, `design/research/detection-landscape.md`,
`design/research/evidence-presentation.md`, `design/research/review-map-and-reentry.md`, and
`design/research/grounded-coaching-aggregation.md`.

## Minimum additive atomic-evidence wave

The first production wave should add reusable literal atoms as independent evidence-event
projections. It must not add pack predicates, rewrite authored content, name a semantic tactic or
bind a learner default. This keeps the D560 content hold intact and lets later consumers share one
implementation.

| Atom | Existing basis | Honest production identity | Explicit non-claim |
|---|---|---|---|
| Pawn connectivity and island count | disposable D542 arithmetic; pawn sets already parsed | per-colour occupied files, components and signed before/after delta | not “weak structure” |
| Castling-right state | FEN field; F2 already canonicalises a realised castle | exact rights before/after, affected side/wing and realised-castle distinction | right lost is not automatically “castling prevented” |
| Development/home-minor state | `phase.ts` computes `undevelopedMinors` | declared home-square convention with exact pieces/squares | not good/bad development |
| Capture/trade atom | `capturedRole` is production code | mover, captured role/square and before/after material identities | not a good/bad trade |
| Rook seventh-rank state | disposable D542 arithmetic | exact piece/square under a declared relative-rank convention | not an active/good rook |
| Opened slider relation | F2 `slider_ray` plus `vacationReading` | blocker, slider, newly opened squares and any occupied target | not a discovered tactic without an eligible target/consequence |
| King-ray blocker | `between()`/attack arithmetic and external disagreement controls | slider, king, blocker, ray and legal/function operands | do not publish broad “pin” merely from collinearity |
| Multi-target attack atom | attack-set arithmetic plus target roles/values | moved piece and exact simultaneously attacked targets | do not publish “fork” without eligibility/value/consequence |
| Attacked/undefended capture atom | attack/defence maps and legal-capture check | attacker, target, defenders and legal capture identity | do not publish “hanging” without exchange/consequence boundary |

The detector research already shows why the identities must stay narrow: against 50,000 Lichess
puzzle records, broad geometry achieved only 32.3% precision for fork, 39.0% for new absolute pin,
19.7% for opened-slider discovered attack and 7.9% for the broad hanging probe. `[V]`
(`design/research/detection-landscape.md`; `tools/detection-landscape-harness/output.md`)

Each atom needs positive, hard-negative, abstention, mirror/orientation, canonical-UCI and
non-vacuity fixtures. Every emitted event retains before/after FEN, canonical UCI, mover/subject,
affected squares/rays, sign and exact convention identity. The F1 manifest declares it; initial
product eligibility may remain empty until F5/F6/F8 name their narrower acceptance.

### Focused HEAD witness recheck

The existing disposable candidate corpus instrument was rerun at HEAD on 2026-08-22:

```text
pnpm exec vitest run --config tools/d542-classifier-audit-harness/vitest.config.ts \
  tools/d542-classifier-audit-harness/candidates.test.ts
```

`[V]` It passed 1/1 over 50 packs, 754 spine transitions, 717 played moves, 19,636 legal
alternatives and 643 distinct positions. The measured witnesses remain: rook-seventh 0.98% played
/ 3.83x lift; pawn-island gained 2.93% / 2.13x; broad absolute-pin-created 2.37% / 1.28x;
castling-right-lost 3.07% / 0.65x; broad hanging-created 4.04% / 0.26x. Static prevalence remains
8.09% rook seventh, 5.60% broad pin, 4.20% broad hanging and 4.67% more-than-two pawn islands.
(`tools/d542-classifier-audit-harness/candidates-output.md`)

The run validates that the additive atoms have real corpus witnesses. It does not promote the
broad tactic labels: the low or inverted lift is part of the reason the first wave retains literal
operands and the semantic-consequence wave remains separate.

## Second wave: bounded semantic consequences

Only after the atoms exist should a second evidence RFC define semantic tactic or threat events:

- meaningful fork/double attack;
- functional absolute pin and skewer;
- realised discovered attack/check;
- loose/hanging piece under a declared exchange or shallow-reply boundary;
- removal/capture of defender;
- trapped piece and back-rank condition;
- bounded two-to-three-ply threat with target, horizon, opponent policy, path and stability;
- castling prevention, distinct from a castling right merely disappearing.

These require functional operands, a published convention and sometimes bounded search. A Lichess
theme disagreement set can falsify broad definitions but cannot become unquestioned ground truth.
The semantic wave must state which consumer can use each result and whether it may carry valence.
No event is called good, bad, accurate, important or intended merely because it is rare, engine-
favoured or present on an authored spine.

## Corrections before promotion

1. Re-derive D547 against both the legacy `irreversibility` reader and F2's canonical `castled`
   event. F2 repaired the semantic-event path; the older reader may still remain wrong rather than
   the whole defect being uniformly open or closed.
2. Retire or implement `pawn_count`: the manifest deliberately excludes its reading witness while
   the schema vocabulary and renderer still imply it can emit (D548).
3. Preserve D632's transitive `outpost` dependency report. No atomic wave may silently change
   `pawn_safe_square` semantics or rewrite the three affected content documents.
4. Do not promote D542's `fork_created`, `absolute_pin_created` or
   `hanging_piece_created` names unchanged. They were measurement probes, not product semantics.
5. Keep opening identity separate: its collector exists, but runtime applicability and display
   specificity/transposition policy belong to F4/F7 after O5/O6.

## Bot and campaign consequence

**Bots are the next parallel product lane; O8 was ruled 2026-08-22.** F1/F2 are complete and R11's
mechanical/desk work is complete. F8 can use the same exact atomic facts for policy guards and
inspection, while its move policy remains a distinct composition of Maia, a disclosed Stockfish
error guard, repertoire, timing and later memory. The measured production sampler—not raw displayed
Maia mass—is the baseline. A pawn-heavy transform is supported; forcing/quiet personalities,
repertoire identity, memory and a population-level “human-like” claim are not.

**Campaign should not start.** R14 is a wrapper-validation protocol whose input is the real core
loop. The owner's 2026-08-22 play report rejects the incumbent board/evidence composition, while
F5/F7 and Gate F remain open. Building progression, unlocks or a map now would wrap a rejected
support experience and force it to be redesigned twice. Campaign resumes after a real F5 packet,
the theory/drill join and the owner session named by R14.

## Executable order

1. A0-check active RFC overlap; draft an additive atomic-evidence RFC with no pack/schema/content
   claim.
2. Implement and measure the exact atoms, manifest projections and negative fixtures.
3. Draft the bounded semantic-consequence wave only for consumers whose evidence need is explicit.
4. After the collector contracts land, draft F8 against the same catalogue; do not fork detector code.
5. Claude's F5 UX pass binds approved atoms and existing providers into modules/presets.
6. F6/F7/F9 consume the shared results for Review, theory/drills and grounded coaching.
7. Run R14 and rule O10 only after the repaired core loop is usable.

## Owner decisions that actually unblock separate work

- **O8 (ruled 2026-08-22):** the honest baseline/guarded/pawn-heavy bot policy recommendation opens
  F8 after collector landing, without waiting on F5 visual work.
- **O5:** approve or amend the allow-listed offline provenance compiler + immutable local theory
  bundle; this opens F4 after F3.
- **O6:** approve the capability/migration architecture and the zero-forced-semantic-rewrite
  budget; this opens F3 and the eventual Gate-F pilot derivation.
- **O10:** do not rule Campaign yet; its named owner-use evidence does not exist and the current
  play report is negative.
