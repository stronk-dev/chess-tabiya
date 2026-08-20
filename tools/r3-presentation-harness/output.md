# R3 mechanical presentation output

Disposable research output; not a product specification.

## Shipped-surface census

- Assistance profiles: 6
- Primary axes per profile: 9
- Primary assistance controls: 54
- Unique authored-spine positions inspected: 611
- Occupied-square queries inspected: 12236
- Captions per selected occupied square: median 2, p90 7, p95 9, max 11
- Drawn marks per selected occupied square: median 3, p90 12, p95 14, max 19
- Unique marked squares: median 1, p95 6, max 9
- Worst query: d5 in `rnb1kbnr/ppp1pppp/8/3q4/8/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 3` → 11 captions / 19 marks / 9 unique squares; kinds pawn_safe_square, line_blockers, line_blockers, line_blockers, line_blockers, line_blockers, line_blockers, line_blockers, line_blockers, direct_attack_count, piece_reach_count
- Static controls: human-model rows expose UCI/mass; arrows have no renderer; ambient button has no action; the LLM packet has no consumer admission field.

## Disposable module contract

| Module | Intent | Timing | Activation | Fact cap | Move recommendation | Status |
|---|---|---|---|---:|---|---|
| rules_floor | Show legal interaction affordances, not advice. | precommit | automatic | 0 | refused | existing_policy |
| sight_on_request | Answer one concrete board-sight question without ranking moves. | precommit | on_request | 1 | refused | owner_boundary |
| postcommit_nudge | Name at most two consequences of the move just played. | postcommit | automatic | 2 | refused | research_candidate |
| guided_hint | Reveal a progressive hint only after an explicit request and disclosure. | disclosed | on_request | 2 | allowed only at this boundary | research_candidate |
| compare_coach | Name the smallest grounded difference between preserved attempts. | disclosed | on_request | 2 | refused | research_candidate |
| theory_breadcrumb | Link one applicable cited theory passage to rehearsal. | postcommit | on_request | 1 | refused | research_candidate |
| review_map | Select grounded moments that open a retry, branch, drill, or theory action. | analysis | automatic | 3 | allowed only at this boundary | research_candidate |
| full_inspector | Expose attributed evidence and engine lines for deliberate analysis. | analysis | explicit_mode | 20 | allowed only at this boundary | research_candidate |

`sight_on_request` is deliberately marked `owner_boundary`: the existing design leaves the rung-0 pre-commit line open. The harness does not convert that candidate into product authority.

