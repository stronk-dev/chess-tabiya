# Semantic horizon coverage — a bestline joined to events, not disguised

**Status:** answered for the fixed provider/code arm `[V]`; broader population and owner-use arms
remain downstream validation, not blockers to drafting the source-safe primitive.

**Question.** Can the current evidence foundation turn a Stockfish PV into the owner-ruled
square → piece → occurrence-ply → move ladder, and do the basic multi-edge tactic collectors
actually reach that path?

**Inputs.** D1061's 64 fixed product-path positions and recorded `depth12` / `movetime100_a`
PVs; the compiled semantic manifest; the R2 `research.r2_candidate@1` selection policy;
`learner-modules.md` Appendix B's closed postcommit-nudge event list; and every registered
3–5-edge Wave-C operand detector. Instrument:
`tools/d1066-semantic-horizon-harness/`. All findings below are `[V]` executable/code evidence.

## Verdict

The foundation is broad enough to build a useful semantic-horizon primitive, but the primitive
does not exist and three tempting shortcuts are false.

1. **Bestline alone is insufficient.** It supplies moves, not the event that “square,” “piece”
   and “distance” refer to (D1065).
2. **R2 selection cannot be reused unchanged.** Even after filtering its input to the accepted
   nudge families, 115 of 237 selected facts (48.5%) cannot produce one literal target: 79 are
   alternative-only avoidance facts and 36 are events with no square target under the initial
   adapter. The preregistered 10% refusal boundary fails by almost fivefold.
3. **Observed sequence events cannot be relabelled as engine-line events.** Their ground is
   `recorded_run` and their seal requires `run.record.move@1`; a Stockfish PV is hypothetical
   `live.stockfish.pv@1` evidence. Equal chess operands do not make those sources equal.

The measured candidate fixes only the mechanics: restrict to Appendix-B event families, require
a literal actor/target before ranking, disable alternative-only avoidance, retain R2's 20%
same-family ceiling and cap two, then choose the first qualifying event within four PV plies. On
depth 12 it reaches **56/64 (87.5%)**; on the production-budget 100-ms arm it reaches **46/64
(71.9%)**. It is therefore a strong source, not a sole source. Theory, authored guidance,
tablebase/endgame evidence and honest empty remain required.

## 1. Coverage and stability

| population | stageable within four plies | reach |
|---|---:|---:|
| depth-12 opening | 22/24 | 91.7% |
| depth-12 middlegame | 13/16 | 81.3% |
| depth-12 cross-phase | 21/24 | 87.5% |
| **depth-12 total** | **56/64** | **87.5%** |
| 100-ms total (diagnostic arm) | 46/64 | 71.9% |

Of 44 positions where both arms yield a staged event, **37/44 (84.1%)** agree on the first
projection family and **39/44 (88.6%)** agree on its occurrence ply. This is lower than D1061's
59/64 first-move agreement between the same arms: semantic identity compounds line variation.
Engine version and budget therefore belong in the horizon identity; outputs from different arms
must not be silently merged as one fact.

The depth-12 first occurrence is early: 34 at ply 1, 11 at ply 2, 7 at ply 3 and 4 at ply 4.
Eight lines are honestly empty at four plies. A long fallback search is neither required nor
licensed by this result.

Cold compile + complete-alternative selection costs **mean 329 ms / p50 354 / p95 799 / max
939 ms per searched edge** on this machine, over 229 searched edges (1.79 per line). A second
compatibility selection over the same cached event population costs mean 38.7 ms / p95 66.5 ms.
The 100-ms engine is therefore not the latency bottleneck once semantic selection is added. A
versioned per-position candidate/event packet shared with bot policy is a product prerequisite;
independent recomputation by each consumer is not acceptable UX (D1071).

## 2. Stageability is not usefulness

The first depth-12 selected families are led by `developed` (11/56), then captured king-zone
defender / castled / last-of-role / pawn-contact (5 each), generic capture (4), pawn transition,
pawn dynamics, backward pawn and king-zone state (3 each). Double attack and loose-piece total
four lines.

That mix is evidence, not a defect in R2. R2 measures counterfactual distinctiveness; it does not
measure teaching value, and R3 already measured selectivity against usefulness at ρ = −0.143.
Calling the result “interesting” would recreate the classifier-noise problem one layer later.
The production hint selector needs a declared module-specific precedence/refusal table. In
particular, a generic capture or development event must not crowd out a later named consequence
merely because it occurred first.

The current candidate policy is therefore an **upper-bound reach instrument**, not a production
selection policy. Its valuable result is that typed actor/target operands are common enough to
support the feature once selection semantics are authored.

## 3. Literal stage adapters

No generic recursive “find all square-looking strings” adapter is admissible. A projection earns
the ladder only through a literal mapping:

| family | actor | target squares | result |
|---|---|---|---|
| transition rule (`capture`, `promotion`, `developed`, etc.) | exact moved piece from canonical edge | declared `to`; checkmate uses the checked king | stageable |
| check | exact moved piece | `checkedKing.square` | stageable |
| double attack | exact moved piece | every retained target square | stageable |
| loose-piece event | exact moved piece | the signed loose-piece identity | stageable |
| capture class / completed trade | exact moved piece | declared landing square | stageable |
| pawn dynamics / pawn transitions | exact moved piece | typed pawn/minor/contact/capture identities | stageable when non-empty |
| king-zone / captured-zone-defender | exact moved piece | named king or captured defender square | stageable |
| open-file occupancy | exact moved piece | moved rook/queen destination | stageable |
| structural pawn file | exact moved piece | exact affected pawns derived from signed FEN + declared file/color | stageable |
| open / half-open file | exact moved piece | the eight squares of the declared file | stageable, deliberately broad |
| king opposition / king zone | exact moved piece | exact king squares from the signed FEN | stageable |
| castling-right loss | exact moved piece | no single declared square target | refused from this ladder |
| pawn-island count event | exact moved piece | no exact changed-island identity in payload | refused from this ladder |
| counterfactual avoidance | played actor exists | alternative events disagree on target | refused from this ladder |

Actor identity is exact arithmetic over the sealed edge; it is not inferred intent. File and king
targets are exact projections from the event's signed FEN/operands; they must be registered as
derivation inputs rather than hidden in rendering code.

## 4. The basic multi-edge tactics exist but do not flow

The depth-12 PVs contain 634 three-edge windows, 570 four-edge windows and 506 five-edge
attraction windows. Direct operand evaluation finds:

| observed family | events | lines |
|---|---:|---:|
| square clearance | 21 | 8 |
| line-blocker clearance | 1 | 1 |
| deflection | 0 | 0 |
| attraction (3/5 edges) | 0 | 0 |
| interference | 0 | 0 |
| check zwischenzug | 0 | 0 |
| overload exploitation | 0 | 0 |

Zero in this small pack-shaped population is not a rejection: the permanent Wave-C positive and
hard-negative fixtures establish ability to fire, and the accepted RFC records broader imported
witnesses. It does establish that the families are rare supplements rather than the coverage
backbone.

The runtime misses even the 22 measured clearance witnesses. The seven sealed constructors are
called only in `semantic-tactic-sequences.test.ts`; `localSemanticEvents` sees one edge and no
production path compiler invokes the 3–5-edge detectors. This is D1067.

The necessary implementation split is source-shaped:

- a **recorded-path compiler** over contiguous run/import nodes can seal the existing
  `recorded_run` projections for Review;
- an **engine-horizon compiler** needs separately declared `live.stockfish.pv`-derived identities
  for Guided Hint. It may share operand predicates, never evidence identity.

`planning/evidence-foundation-ux/d1067-path-compiler-audit.md` gives the exact two-adapter
handoff and able-to-fail fixtures.

## 5. Contract corrections before implementation

The accepted Guided Hint contract is exactly three stages—`pattern → subject → move/line`—and
`module-contract.ts` rejects any fourth. D1061 rules four—`square → piece → occurrence ply →
move`. The two are not aliases: pattern is not square and timing has no existing stage. This is
D1069 and requires an author amendment plus red fixtures before implementation.

The amendment should preserve two distinct grounded flows rather than force one ladder onto all
evidence:

- **engine-semantic hint:** target square(s) → actor piece → occurrence ply → move/PV;
- **theory/authored hint:** cited pattern/claim → scoped subject, with no move required.

Modules/presets choose which flow is available. The LLM may vary phrasing/obtuseness inside one
sealed stage; it may not select the event, add a stage operand, choose a move or fill an empty
source.

## 6. Research sufficiency and next work

This is sufficient to draft the primitive and its source boundary. It is **not** sufficient to
declare the selector or UX complete.

Required order:

1. Amend `learner-modules` for the four-stage engine-semantic grammar while retaining the
   theory/authored grammar (D1069).
2. Declare hypothetical engine-horizon projections separately from recorded sequence events
   (D1068).
3. Specify a module-specific family precedence/refusal table; do not inherit R2 “as interesting”
   (D1070).
4. Build the recorded path compiler and engine horizon compiler (D1067), with source-mismatch and
   discontinuous-window failures.
5. Specify a versioned candidate/event packet or cache shared by hint selection and bot policy;
   measure cold, warm and provider-off end-to-end latency (D1071).
6. Re-run reach and latency over a broader opening/middlegame/endgame position population, then
   validate the actual staged interaction in owner play. Honest empty and theory/tablebase fallback
   are required regardless of that result.

The missing foundation is therefore not “more Stockfish” and not an LLM scraper. It is the typed
join between provider lines, rule/convention collectors, source identity, module selection and
progressive presentation.
