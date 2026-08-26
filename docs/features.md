# Feature and capability map

This is the stable ownership map for Tabiya's product features. It explains what each capability
area manages and what it unlocks; it deliberately does not copy volatile completion percentages.

Current status comes from:

- `../planning/roadmap-1.0.json` — machine-readable capability and milestone ownership;
- `../planning/roadmap-1.0.receipt.json` — source-sealed current counts and states;
- `../planning/roadmap-to-done.md` — the human-readable 1.0 rollup;
- `../planning/exploration/gates.md` — product, learning and release gates.

## What counts as a complete feature

A mechanism is not a finished feature merely because its reducer, schema, endpoint or component
exists. Every 1.0 capability is evaluated across eight dimensions:

1. grounded evidence;
2. durable state;
3. production API reach;
4. understandable experience;
5. useful defaults;
6. representative content;
7. meaningful verification;
8. release proof.

The categories below own those dimensions end to end.

## Foundation and product truth

| Capability | Scope | Unlocks | Implemented-system entry points |
|---|---|---|---|
| Work truth, measurement and release accounting | Ledger/RFC/work ownership, measurements, lifecycle closeout, status receipts and release claims | A roadmap that can be trusted and a defensible 1.0 declaration | `development.md`, `testing.md`; live status in the roadmap files above |
| Evidence collection, semantic events, selection and grounding | Rules, Stockfish, Maia, Explorer, Syzygy, authored evidence, provenance, operands, abstention and consumer selection | Grounded assistance, Review, bot behavior, profiles and verifiable pack claims | `evidence-contract.md`, `semantic-evidence.md`, `recorded-evidence.md`, `claim-backing.md` |

## Core learning loop

| Capability | Scope | Unlocks | Implemented-system entry points |
|---|---|---|---|
| Arrival and rehearsal | Start, commit, consequence, rewind, fork, compare, replay and resume | Just Play plus Line, Plan, Outcome and Trajectory rehearsal | `branch-runtime.md`, `drill-client.md`, `play-composition.md`, `outcome-drill-grading.md`, `trajectory-drill.md` |
| Guided support | Learner modules, presets, assistance ceilings, hint distance, prevention and typed presentation | Quiet, Guided, Support and advanced-analysis experiences without raw evidence dumps | `adaptive-guidance.md`, `structural-reading.md`, `explanation-grounds.md`; active contracts in `../rfc/README.md` |
| Whole-game Review and return | Moment selection, Review Map, story, grades, sharing, retry and scheduling | One post-game journey for native, bot, imported, campaign and social games | `game-import-and-story.md`, `return-and-progression.md`, `n-way-comparison.md`; active contracts in `../rfc/README.md` |

## Knowledge, opposition and progression

| Capability | Scope | Unlocks | Implemented-system entry points |
|---|---|---|---|
| Theory, library and content | Theory retrieval, pack/shape/principle authoring, provenance, compatibility, migration and graduation | Searchable theory-to-drill paths and an official opening/middlegame/endgame corpus | `drill-pack-format.md`, `content-sourcing.md`, `pack-studio.md`, `pack-graduation.md`, `shape-library.md` |
| Human-like bots | Strength bands, policy, repertoire routes, behavior, memory, clocks, roster and fallbacks | Honest named opponents, personalities, rematches, history and local bot events | `engine-workers.md`, `bot-policy.md` |
| Learner model | Rating, longitudinal observations, skills, style, denominators and recommendations | Progress/profile views, opening performance, earned skills and grounded next steps | `learner-rating.md`, `return-and-progression.md`; active contracts in `../rfc/README.md` |
| Campaign | Encounters, resources, rewards, failure, unlocks, persistence and authored campaign versions | Structured progression, campaign map, bosses and replayable campaign content | `campaign.md`; active contracts in `../rfc/README.md` |

## Multi-user and professional workflows

| Capability | Scope | Unlocks | Implemented-system entry points |
|---|---|---|---|
| Human and social play | Native matches, provider imports/following, clocks, results, variants and social return | Friend games, rated/casual play, Arena handoff, rematches and shared Review | `live-sessions.md`, `game-import-and-story.md`; active contracts in `../rfc/README.md` |
| Coach, classroom, streamer and audience workflows | Roles, consent, assignments, submissions, casting, withholding, delay and audience interaction | Academy sessions, submission review, stream overlays, voting and teaching flows | `classrooms.md`, `live-sessions.md`; active contracts in `../rfc/README.md` |

## Client, data and release platform

| Capability | Scope | Unlocks | Implemented-system entry points |
|---|---|---|---|
| Responsive, accessible client and PWA | Stable layout, board input, keyboard/screen-reader behavior, theming, viewport and offline/update state | Phone/tablet use, accessible play and an installable client | `app-shell.md`, `drill-client.md`, `board-annotation.md`, `theming.md` |
| Identity, privacy and account data | Authentication, authorization, leases, export/import, deletion, backup and restore | Portable private accounts, explicit sharing and safe recovery | `identity-and-authorization.md`, `account-data-lifecycle.md` |
| Operations and release | Verification tiers, packaging, health, observability, deployment, rights/SBOM, update and rollback | A reproducible and supportable self-hosted 1.0 release | `development.md`, `testing.md`, `engine-workers.md` |

## Dependency shape

```text
work truth
   |
   v
evidence + stable content contracts
   |
   +--> rehearsal --> support --> Review
   |        |           |          |
   |        +-----------+----------+
   |                    |
   +--> bots -----------+--> learner model
                            |
                            v
                 campaign / social / professional
                            |
                            v
                  complete official content
                            |
                            v
          accessible client + data lifecycle + release proof
```

The diagram expresses implementation dependencies, not menu hierarchy. For example, campaign may
have a reducer before Review is complete, but a 1.0 campaign is not complete until its games enter
the shared Review and return journey.

## Product boundaries

Tabiya is one rehearsal system expressed through several contexts. These are not separate products:

- drills and Just Play share the same run/branch protocol;
- Review re-enters that protocol rather than ending at an engine verdict;
- campaign composes registered packs, opponents and assistance rather than cloning them;
- live, classroom and stream views project the same run state under different roles;
- the LLM may rephrase selected evidence but never supplies chess truth or grades a move.

For code placement and required checks, continue with `extending.md`.
