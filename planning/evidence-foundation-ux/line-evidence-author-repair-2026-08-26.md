# D1730/D1731 line-evidence boundary — author handoff

**Inputs:** `design/research/line-evidence-relevance-boundary.md` and
`tools/d1730-line-relevance-harness/`.

## Required contract

1. Treat board-edge inventory, target-bearing ray geometry, latent discovery, played discovery,
   observed target-capture clearance and observed quiet square clearance as distinct projections.
2. Version `rules.transition.event.slider_ray`: compare exact blocker arrays and emit
   `membership_changed` when the set changes at equal count. Retain slider and endpoint identity.
3. Do not call the board-edge endpoint a target. A target-bearing learner statement must join an
   exact ray/discovered/defence/attack/consequence record.
4. Keep `line_blockers` author predicates compatible and raw readings Advanced-only.
5. Ordinary reducers are question-bound: selected piece/square, postcommit relation delta, or
   Review consequence. No universal line census and no all-rays board overlay.
6. Keep value, importance, intention, recommendation, force and move grade outside geometry.
7. Bind production operations through D1710, independent fixtures through D1711 and module
   accepts through the D1726 correction before activation.

## Frozen measurements

- authored: 11,556 raw blocker rows / 41,115 structural facts (28.11%), 5,772 target rays,
  174 latency screens;
- imported: 29,075 / 93,323 (31.16%), 15,393 target rays, 754 latency screens;
- count-change events: 1,122 authored / 1,168 imported;
- count-preserving blocker-set changes omitted by v1: **109 / 126**;
- discovered executions: 5 / 9 committed edges;
- target-capture line clearance: 0/622 authored / 23/6,775 imported windows;
- quiet square clearance: 24/622 / 374/6,775.

## Able-to-fail fixtures

1. An empty slider→board-edge ray emits inventory but no target ray.
2. Pin, skewer and X-ray positives retain slider/blocker/target/ray identities.
3. Equal blocker count with different exact squares emits `membership_changed` in v2.
4. Equal arrays emit no event; gained/lost count fixtures retain current signs.
5. Discovered execution refuses a moved screen without the before-state exact latency relation.
6. Target-capture clearance refuses an opened line without retained positive capture.
7. Quiet square clearance refuses capture and unrelated later-slider paths.
8. Ordinary module fixtures fail if raw line inventory is admitted without a selected subject or
   if prose calls a board-edge endpoint a target.
