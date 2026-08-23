# R21 longitudinal style-feedback contract output

R12 retained metrics: 12; production-ready: 0. Production gaps: reference_and_runtime_identity 2; collector_and_store_extension 8; denominator_projection_mismatch 2.
The measured floors are short-session high-activity blitz floors. Every metric still requires longitudinal and cross-time-control transfer before a 1.0 default.

| metric | shared feature | floor games | denominator | production gap | bot use |
|---|---|---:|---|---|---|
| `opening_surprisal@1` | `opening.move_population_share@1` | 25 | learner decisions through ply 8 whose exact-position reference count is at least 50 | reference_and_runtime_identity | future_repertoire |
| `opening_family_entropy@1` | `opening.family@1` | 100 | games with a resolved runtime opening family | reference_and_runtime_identity | future_repertoire |
| `fianchetto_setup_rate@1` | `structure.fianchetto_setup@1` | 25 | games with a complete legal main line | collector_and_store_extension | future_controlled_trait |
| `fianchetto_knight_screen_rate@1` | `structure.fianchetto_knight_screen@1` | 200 | games with a complete legal main line | collector_and_store_extension | future_controlled_trait |
| `castle_kingside_rate@1` | `move.castle_side@1` | 50 | games where the learner retained a castling right at their first move | denominator_projection_mismatch | future_controlled_trait |
| `castle_queenside_rate@1` | `move.castle_side@1` | 50 | games where the learner retained a castling right at their first move | denominator_projection_mismatch | future_controlled_trait |
| `clock_spend_share:opening@1` | `time.spend_share@1` | 100 | decisions with valid adjacent clock readings in the opening | collector_and_store_extension | refused_without_time_model |
| `clock_spend_share:middlegame@1` | `time.spend_share@1` | 50 | decisions with valid adjacent clock readings in the middlegame | collector_and_store_extension | refused_without_time_model |
| `clock_spend_share:endgame@1` | `time.spend_share@1` | 25 | decisions with valid adjacent clock readings in the endgame | collector_and_store_extension | refused_without_time_model |
| `pawn_choice_residual@1` | `move.role.pawn@1` | 100 | all eligible learner decisions with a complete legal-candidate set | collector_and_store_extension | future_controlled_trait |
| `center_pawn_choice_residual@1` | `move.pawn_to_extended_center@1` | 200 | all eligible learner decisions with a complete legal-candidate set | collector_and_store_extension | future_controlled_trait |
| `early_queen_choice_residual@1` | `move.early_queen@1` | 100 | learner decisions before ply 16 with a complete legal-candidate set | collector_and_store_extension | future_controlled_trait |

Presentation: deterministic first; show the value, interval, population, floor, window, source/reference version and exact contributors. An optional LLM may paraphrase one sealed admitted card and gains no selection, diagnosis, advice, archetype, grading or recommendation authority.

Shared-vocabulary wall: feature identity is common; proof and state are not. Style reads learner-owned history under R12. Bot policy reads current candidate features under its controlled-trait gate and never learner history.
