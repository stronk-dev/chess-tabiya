# D635 workflow/default conformance — raw output

Technical profiles: 6; assistance axes: 9; settings controls: 54.
Distinct unset defaults: 1. Default: {"version":4,"markers":"off","guided":"off","humanSplit":"off","corpus":"off","voice":"authored","spoken":"off","boardLighting":"legal","arrows":"off","ambient":"off"}.
In-run configurable axes: 6/9 (corpus, guided, humanSplit, markers, spoken, voice).
Settings-only axes: ambient, arrows, boardLighting.
Session-kind permission variants across pack/position/imported: 1 (byte-identical for every role/disclosure cell).
Academy profile: absent; academy live sessions fall through to their source run's pack/position/imported profile.

## Workflow binding

| workflow | product entry | current binding | current reality |
|---|---|---|---|
| `just_play` | Play → JustPlayStarter | `position` | raw silent assistance profile; no named preset |
| `guided_rehearsal` | Play → any pack | `pack` | all drill families share one raw profile; no Guided Rehearsal identity |
| `learn_position` | Learn repertoire gap or Play pack | `mixed_pack_or_position` | entry can create a position run or open a pack; no workflow identity survives |
| `review_retry` | Review → Story/re-enter or open prior run | `inherits_source_run` | re-entry inherits imported/pack/position mechanics; Story bypasses the imported voice preference |
| `analyze_freely` | active branch group → Analyze missing evidence | `inherits_source_run` | one action inside the source run; no explicit analysis mode/profile |
| `campaign` | none | `absent` | research/design only; no product route or profile |

## Conformance result

- Only Just Play and the generic pack path map directly to one technical preference profile; four of six intended workflows are mixed, inherited or absent.
- No persisted workflow ID or preset ID exists in production, so a different default cannot be attached to Review, Analyze or Campaign.
- Story narration is provider-gated but does not consult the imported profile's voice preference.
- The settings surface now does configure all nine axes; the older 36-control/three-overlap ledger claim is stale.
- Arrows have no DrillScreen reader; Ambient is labelled as an opening button but has no click action; a mounted run reads its profile only once.
