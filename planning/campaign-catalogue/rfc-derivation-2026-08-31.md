# Campaign catalogue progression — RFC derivation (2026-08-31)

## Ruled product boundary

[[D1151]] rules Campaign progression in the catalogue: shapes met and structures played, with the
what-is-missing mark on a pack card rather than a generic progress screen. The act-end diff names
content, never grades the learner, declares its catalogue denominator, and reopens preserved run
evidence for every entry.

## Current failures

- [[D2368]]: `shapeRecommendations` scans only the latest 50 runs, reduces exact firing spans to run
  ids and truncates at ten. It is a recommendation snapshot, not durable collection truth.
- [[D2369]]: the catalogue needs a migration immediately behind `campaign-core`; the provisional
  `live-sources` migration must move behind this successor so Campaign storage stays contiguous.
- Named structures cannot enter the catalogue until [[D1727]] preserves exact structure identity;
  prose or display labels are not recoverable evidence.
- Pack concepts are pack-scoped strings at HEAD. `concept-registry.md` owns the global identity and
  identity-only authored-reference projection; catalogue sightings consume it and add occurrence,
  never skill credit.

## RFC boundary

The successor owns durable binary sightings, catalogue digest/denominator, act-end diffs, per-pack
unseen marks, exact run reopening, rebuild/unavailability and export/delete/restore. It does not own
frequency, mastery, rating, skill valence, recommendations or authored chess truth.
