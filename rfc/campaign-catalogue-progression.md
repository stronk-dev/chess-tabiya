# RFC: Campaign catalogue progression — exact exposure, not learner grading

- **Status:** draft 2026-08-31 — first author pass on [[D1151]], [[D1171]], [[D1727]] and
  [[D2368]]–[[D2371]]. Fresh independent review and accepted dependencies are required before
  implementation.
- **Author:** Codex
- **Created:** 2026-08-31
- **Design refs:** `design/06-campaign.md` §§368–397; `design/04-session-loop.md` evidence breadth.
- **Research refs:** `design/research/ux-after-the-run.md` §4.3;
  `planning/campaign/1.0-closure-map.md`; `planning/campaign-catalogue/rfc-derivation-2026-08-31.md`.
- **Exploration gate:** [[D1151]] is the owner ruling; [[D1171]] fixes the claim boundary;
  [[D2368]]/[[D2369]] reproduce the missing durable projection and migration seam.
- **Depends on:** accepted/implemented `campaign-core.md`; exact registered shape library;
  [[D1727]]'s identity-rich named-structure successor; accepted/implemented
  `concept-registry.md` for an honest declared-but-unavailable concept axis; account portability.
- **Parent / amends:** `campaign-core.md` Discharge D6 and §10 closure map; supersedes no shipped
  recommendation API.
- **Planning:** `planning/campaign-catalogue/`.

```tabiya-claims
migration | position behind campaign-core | learner_catalogue_sightings; learner_catalogue_projection_state
```

## Summary

This RFC makes the ruled Campaign collection durable and visible. Within one Campaign run it records
which registered shapes were met and which registered named structures were on positions the learner
actually played. It shows the act-end additions, the current collection denominator, and an unseen-
content mark on each pack card. Every collected entry opens the exact preserved run, branch and node
span that proved it.

It does not measure the learner. “Carlsbad was on the board” is admissible; “you learned Carlsbad,”
“72% complete,” “strong at structures,” rarity praise and any outcome-weighted celebration are not.
The stored primitive is an exact exposure receipt; the UX is a catalogue diff.

## 1. Scope and denominators

The v1 catalogue has three declared axes:

| axis | denominator authority | occurrence authority | v1 availability |
|---|---|---|---|
| shape | installed compiled shape registry and digest | `theory.shapes.firing@1` exact entry/span | available |
| named structure | installed closed `StructureId` metadata and digest | identity-rich successor to `rules.structural.reading.named_structure@1` at an exact node | dependency-blocked on [[D1727]] |
| concept | compiled `ConceptRef` registry/digest | none: pack-wide reference is not position applicability | typed unavailable on [[D2371]] |

The response renders counts only as catalogue facts: “8 of 25 shapes have appeared in this run.” It
never combines axes into one percentage and never describes the ratio as ability, completion,
mastery, progress toward strength or quality. Each axis returns its exact denominator size, registry
version/digest and availability. An absent, invalid or mismatched registry produces a closed reason;
it never shrinks the denominator to whatever could be loaded.

Official Campaign creation pins the three catalogue snapshots. Content installed later affects a
new Campaign run, not the denominator of an active or historical run. Community entries participate
only when their containing catalogue is installed, validated and included in the pinned snapshot;
the UI labels the snapshot source and never compares ratios across different digests.

## 2. Durable projection

Migration creates two additive tables in one transaction:

```text
learner_catalogue_sightings(
  campaign_run_id, learner_id, axis, entry_id,
  source_run_id, source_branch_id, first_node_id, last_node_id,
  projection_id, projection_version, projection_payload_digest,
  catalogue_version, catalogue_digest, observed_at,
  PRIMARY KEY(campaign_run_id, axis, entry_id, source_run_id, source_branch_id,
              first_node_id, last_node_id, projection_id, projection_version),
  FOREIGN KEY(campaign_run_id, learner_id) -> campaign_runs(id, learner_id),
  FOREIGN KEY(source_run_id) -> drill_runs(id)
)

learner_catalogue_projection_state(
  campaign_run_id, learner_id, projection_revision,
  source_event_revision, catalogue_snapshot_digest,
  status, unavailable_reason, lease_owner, lease_expires_at, updated_at,
  PRIMARY KEY(campaign_run_id, learner_id)
)
```

`axis` is closed to `shape | named_structure`; concept is an API availability arm, not a storable
fake occurrence. Projection state is closed to `pending | running | ready | failed | unavailable`;
reason is required only for failed/unavailable. A renewable lease plus compare-and-swap revision
makes rebuild and retry single-writer. The projector writes a complete replacement for one Campaign
run into a temporary transaction image, checks set equality against the eligible evidence set, then
swaps state to ready. A crash leaves the prior revision readable only when its source and catalogue
digests still match; otherwise reads return stale/unavailable, never old bytes as current.

Sightings retain every exact occurrence, not only the first or latest. The read projection groups
them by `(axis, entry_id)`, selects canonical first/most-recent links by `(observed_at, run, branch,
node)`, and exposes all evidence links through pagination. Deleting a source run cascades only its
occurrences; the entry remains collected when another exact occurrence survives. Deleting a
Campaign run/account removes its sightings and projection state. Backup/export/restore carries the
campaign snapshot, every exact sighting and projection receipt; restore refuses missing referenced
runs or digest disagreement atomically.

## 3. Admission rules

An occurrence enters only when all of these are true:

1. the source run belongs to the same learner and carries the exact `campaignRunId`, node and
   campaign-document digest pinned by `campaign-core`;
2. the run event/node revision is immutable and the referenced branch/node exists;
3. the evidence item was admitted by F1 for the exact registered projection/version;
4. its entry ID resolves in the Campaign run's pinned catalogue snapshot;
5. its retained payload identifies its exact node or span.

Shape admission stores `entryId`, `firstNodeId`, `lastNodeId` and `openEnded` from
`theory.shapes.firing@1`; it does not re-run current triggers over historical FENs. Named-structure
admission waits for [[D1727]]'s successor carrying exact `id`, `name` and node identity under one
payload authority. The current `@1` projection is refused: it can carry only `provenanceNote` on one
path and a `StructureMatch` on another, so neither prose nor an empty-square observation may be
parsed into collection identity.

Pack `concepts[]`, pack completion and `pack.authored.concept_reference@1` do not establish a
concept occurrence. The concept axis returns `unavailable: no_position_scoped_occurrence_authority`
until a separately researched authored node/span applicability projection or another exact
authority lands. This is [[D2371]] enforced as a negative fixture, not a roadmap euphemism.

Opponent moves count when they are part of the learner's Campaign encounter: the catalogue records
what was on the played board, not who caused it. Preview, authoring playtest, analysis-only branches,
uncommitted candidate positions, comparison projections and runs outside the Campaign do not count.
Encounter outcome and assistance rung are intentionally absent from admission.

## 4. Service and API

The server owns one `CampaignCatalogueService`; client code never joins registries, evidence and
Campaign state. Its operations are:

| operation | result |
|---|---|
| `project(campaignRunId, sourceRunId, expectedRevision)` | idempotent queued/ready/failed closed result; schedules after committed encounter changes |
| `read(campaignRunId, cursor?)` | pinned denominators, per-axis availability, collected entries and paginated evidence links |
| `actDiff(campaignRunId, actId)` | entries whose earliest sighting belongs to that act, plus modules unlocked by campaign-core |
| `packMark(campaignRunId, packId)` | exact unseen entries the validated pack can expose, or typed unavailable |
| `rebuild(campaignRunId)` | owner-only projection rebuild; no new chess judgement |

Production routes are `GET /campaign-runs/:id/catalogue`,
`GET /campaign-runs/:id/catalogue/acts/:actId`, and
`GET /campaign-runs/:id/catalogue/packs/:packId`; the projector is internal and event-triggered.
Responses are closed, paginated, authenticated to the Campaign owner, and carry ETag/revision plus
catalogue digests. Unknown entry, missing source, pending projection, stale snapshot and unavailable
axis are distinct errors/states. There is no generic `/progress/catalogue` screen or endpoint.

The existing `/progress/recommendations` `shapeRecommendations` result remains a bounded suggestion
over the latest 50 runs. It must not supply, backfill or silently alias this catalogue. Its copy may
later consume the durable projection, but this RFC first prevents the capped query from becoming a
second collection authority. This is the durable resolution path for [[D2368]].

## 5. Learner experience

### 5.1 Pack-card mark

Each Campaign encounter card gets one compact, non-blocking mark derived by `packMark`: “New here:
Carlsbad structure” or “3 shapes in this pack have not appeared in this run.” Expanding it lists the
exact registered entries and availability. It never disables the card, recommends it as best,
reveals hidden path content, or moves the board. Outside Campaign the ordinary library card is
unchanged.

### 5.2 Act-end diff

After the last encounter in an act seals, one sheet shows:

1. “Added to this run’s catalogue” with new shape/structure cards;
2. modules unlocked, using `campaign-core`'s existing reward truth;
3. `Continue` as the primary action and `Open the run` on each entry.

The same content, order, emphasis and motion render whether every encounter was achieved or failed.
There is no confetti, rarity tier, engine number, move grade, accuracy, streak or comparative copy.
An empty diff says “No new catalogue entries appeared in this act” and continues normally. Pending
projection shows a stable reserved sheet and updates by revision; failure names unavailability and
offers retry without blocking Campaign continuation.

Every entry card opens the preserved source run at its exact node/span, with the normal Review
composition and assistance ceiling. Keyboard, screen-reader and touch paths reach the same links.
Phone, tablet, desktop layouts keep the board footprint stable; the diff is a post-act sheet, not
an in-board panel.

## 6. Pack projection

`packMark` compiles a pack exposure set from validated, exact references only:

- shapes: normalized registered shape references in the pack;
- named structures: exact authored structure requirements whose identity is preserved by the
  accepted capability/claim contract;
- concepts: listed under the typed unavailable concept axis until [[D2371]] is resolved.

The mark is set subtraction against the current Campaign run's collected IDs under the same pinned
catalogue digest. It never claims that choosing the pack guarantees the missing entry will appear;
copy says “this pack can expose,” not “collect this next.” A pack with no exact references or a
digest mismatch shows no mark plus an inspectable reason, never “complete.”

## 7. Refusals

- no learner skill, mastery, strength, weakness or completion verdict;
- no outcome-, rating-, assistance- or rarity-weighted catalogue;
- no raw sentence/prose parsing into identity;
- no rescanning an arbitrary latest-N run window at read time;
- no registry shrink-to-fit when dependencies are unavailable;
- no concept sighting from pack membership or pack completion;
- no generic progress dashboard, leaderboard, streak or escalating number;
- no path gating or reward change from collected entries;
- no LLM-authored label, occurrence or summary truth.

## Acceptance criteria

1. Migration ordering is byte-equal in claims/register: catalogue follows `campaign-core`, and
   `live-sources` follows catalogue; migration creates exactly the two declared tables atomically.
   This is [[D2369]]'s contiguous-order repair.
2. Projector fixtures cross shape span, repeated occurrence, named-structure identity, opponent-
   caused occurrence, analysis branch refusal, non-Campaign refusal, unknown ID and stale digest.
3. Current named-structure `@1` and pack-wide concept references are permanent negative fixtures;
   neither can produce a sighting.
4. Rebuild is idempotent and set-equal; crash, lease expiry, retry, concurrent projector, source
   deletion, catalogue change and restart never publish a partial/current-looking revision.
5. Export/delete/restore retains exact Campaign/source/entry/projection/catalogue identity and
   refuses dangling or digest-mismatched restores before writes.
6. API fixtures cross authentication, closed responses, pagination, ETag/revision, pending, failed,
   unavailable and honest-empty states; no second client-side join exists.
7. Pack marks are exact set subtraction, do not gate entry, do not promise occurrence, and preserve
   ordinary Library bytes outside Campaign.
8. Act-end layout/copy are byte-identical under achieved/failed permutations except factual module
   inventory; empty/pending/failure states all continue.
9. Browser journeys cover home→Campaign→map→pack mark→encounter→act diff→exact Review link on phone,
   tablet, desktop, keyboard, touch and screen reader with no board-size/layout regression.
10. Static copy guard rejects `learned|mastered|skill|strong|weak|accuracy|score|streak|rare|complete`
    in catalogue renderers except an explicit technical unavailability message fixture.
11. Import/consumer census proves one `CampaignCatalogueService`, one occurrence writer and no use of
    `shapeRecommendations` or raw packet sentences as collection truth.
12. `make verify`, focused software tests, content set-equality and the full Campaign browser journey
    run in the same GitHub gates as their owning tiers.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | implement/accept `campaign-core` persistence and run origin | campaign-core | archive receipt | |
| D2 | seal exact named-structure identity ([[D1727]]) | module-registration.md | accepted successor + implementation receipt | |
| D3 | land global concept identity and preserve concept-axis unavailability | concept-registry | archive receipt + negative fixture | |
| D4 | implement persistent projection/API/pack mark/act diff | codex | full verification + archive closeout | |
| D5 | owner use on phone and desktop | OWNER | dated play-session receipt | |

## Open questions

No new owner choice blocks the ruled shape/structure catalogue. A future concept-occurrence axis is
research/RFC work under [[D2371]], not an implicit extension of this document.
