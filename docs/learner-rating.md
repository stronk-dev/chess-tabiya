# Learner rating

Tabiya's learner-rating foundation uses Glicko-2 over whole games that reach a rules-terminal
result against one of four measured, full-material Maia opponent rungs. It does not grade moves,
infer results from truncated drills, interpolate unmeasured opponents, or use a displayed Maia
band as though it were Elo.

The runtime currently provides the calibrated opponent records, the standard Glicko-2 update,
uncertainty widening over empty periods, and publication rules. A point estimate is withheld
until its rating deviation is at most 60; high abandonment can also force a bounded disclosure
instead of a point estimate. Every eventual surface must disclose that the band-calibrated scale
is not an external chess rating, show its uncertainty and sample counts, name the measured
transfer ratio, state the assistance boundary, and distinguish witnessed from unwitnessed play.

SQLite migration 25 creates `learner_ratings`, `rated_games`, `rating_periods`,
`cohort_standings`, `standing_members`, and `learner_marks`. The migration is additive and does
not backfill historical games or manufacture historical ratings.

The server now creates a position run and its open rated-game declaration atomically. Only the
four measured rungs and starts with at least 21 pieces are admitted, and the live Maia identity
must match the calibration. Rewind, fork, or engine-identity drift voids the rating contribution
without deleting the playable run; only a rules-terminal outcome seals it. Server-routed
guidance, reveal, and analysis remain withheld while the game is open.

Rating periods close after 12 sealed games or after seven days with at least one. The server
publishes only the abstention-shaped result through `/rating`, with history at
`/rating/history`; an unplayed prior produces no displayed rating. There is still no
learner-facing rating screen or cohort-standing calculation. Ratings remain selection input
only and must never alter evidence rendering, return recommendations, or milestones.
