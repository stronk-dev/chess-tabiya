# D872 Wave-C producer-to-consumer candidate matrix

Research handoff only: projection names and eligibility are candidates for the collector/module RFCs. Every row retains literal operands, grounding, abstention, source/workflow ceilings, positive/hard-negative/abstention fixtures and availability in the executable source file.

Rows: 20. Candidate consumer reach: support 16; review 20; bot 13; inspector 20; authoring 17; theory 3. Habit rows: 0 (intentionally held until opportunity denominators, sample floors and the longitudinal store exist).

| projection | grounding | timing | candidate consumers | answer distance | availability |
|---|---|---|---|---|---|
| `rules.tactic.reading.defender_duty_set@1` | position_rules | precommit_requested, postcommit, review, analysis | support, review, bot, inspector, authoring | square, relation | local synchronous |
| `rules.tactic.event.defender_removed@1` | recorded_run | postcommit, review, analysis | support, review, bot, inspector, authoring | square, relation, concept | local synchronous |
| `rules.tactic.event.defender_duty_relocated@1` | recorded_run | postcommit, review, analysis | support, review, bot, inspector, authoring | square, relation | local synchronous |
| `derived.tactic.deflection_observed@1` | recorded_run | postcommit, review, offline | support, review, inspector, authoring | square, relation, concept | local after three recorded edges |
| `derived.tactic.attraction_observed@1` | recorded_run | postcommit, review, offline | support, review, inspector, authoring | square, relation, concept | local after bounded recorded sequence |
| `derived.tactic.line_blocker_clearance_observed@1` | recorded_run | postcommit, review, analysis | support, review, bot, inspector, authoring | square, relation, concept | local after three recorded edges |
| `derived.tactic.square_clearance_observed@1` | recorded_run | postcommit, review, offline | support, review, inspector, authoring | square, relation, concept | local after bounded recorded sequence |
| `derived.tactic.interference_observed@1` | recorded_run | postcommit, review, analysis | support, review, bot, inspector, authoring | square, relation, concept | local after three recorded edges |
| `derived.tactic.check_zwischenzug_observed@1` | recorded_run | postcommit, review, offline | support, review, inspector, authoring | square, relation, concept | local after four recorded edges |
| `derived.tactic.overloaded_defender_response_conflict@1` | position_rules | precommit_requested, postcommit, review, analysis | support, review, bot, inspector, authoring | square, relation, concept | local bounded legal-recapture enumeration |
| `derived.tactic.overload_exploitation_observed@1` | recorded_run | postcommit, review, offline | support, review, inspector, authoring | square, relation, concept | local after three recorded edges |
| `rules.tactic.consequence.forced_mate_after_move@1` | position_rules | precommit_requested, postcommit, review, analysis, offline | support, review, bot, inspector, authoring | square, relation, concept, candidate | bounded local/offline search; latency grows with horizon |
| `rules.pawn.reading.promotion_geometry@1` | position_rules | precommit_requested, postcommit, review, analysis | support, review, bot, inspector, authoring | square, relation, concept | local synchronous plus bounded one-reply flag |
| `derived.pawn.promotion_race_geometry@1` | position_rules | precommit_requested, postcommit, review, analysis | support, review, bot, inspector, authoring | square, relation, concept | local synchronous |
| `derived.pawn.promotion_race_tablebase@1` | tablebase_exact | postcommit, review, analysis, offline | support, review, bot, inspector, authoring | relation, concept, evaluation | provider-bound; exact domain <=7 pieces |
| `theory.opening.current_endpoint@1` | citable_text | postcommit, review, analysis, offline | support, review, theory, bot, inspector, authoring | concept | immutable local catalogue |
| `theory.opening.catalogue_membership@1` | citable_text | review, analysis, offline | review, theory, bot, inspector, authoring | concept | immutable local catalogue |
| `derived.opening.deepest_reached@1` | recorded_run | review, analysis, offline | review, theory, bot, inspector | concept | local history fold |
| `derived.review.eval_delta@1` | bounded_search | review, analysis | review, inspector | evaluation | optional post-game engine pass |
| `derived.review.mate_transition@1` | bounded_search | review, analysis | review, inspector | relation, evaluation | optional post-game engine pass |

Compiler invariant: a workflow receives `preset request ∩ session ceiling ∩ role ∩ source availability`; no row raises a preset's disclosure. Raw operands remain configurable in the inspector/authoring plane without becoming learner settings.
