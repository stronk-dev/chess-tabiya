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

This is an implementation checkpoint, not a live product claim. No rated-game writer, event
projector, rating route, cohort calculation, or learner-facing rating screen exists yet, so the
application currently produces and displays no learner rating. Ratings will be selection input
only; they must never alter evidence rendering, return recommendations, or milestones.
