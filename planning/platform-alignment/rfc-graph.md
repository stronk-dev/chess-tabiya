# Platform alignment — RFC dependency graph

**Status:** routing graph, not drafting authority

**Rule:** a node opens only after every named research question and owner/design decision is closed

Before creating a new file, A0 must prove that an active/returned RFC cannot be amended to own the
same contract. The names F1–F12 below are capability nodes, not reserved filenames or schema lanes.

The architecture research for F1/F12 is sufficient, but `intent-amendment-handoff.md` records the
protected O1-O4/O13 intent debt that still makes drafting illegal. Research-ready is not
authority-ready.

## Existing-document reconciliation

| Existing RFC | Current register state | Alignment action before new drafting |
|---|---|---|
| `shared-resource-registers` | draft; A0/D638 confirms the stale-register class | Resolve Q1/Q2 and refresh its observations first; F1 should reuse its derivation machinery rather than duplicate it. |
| `rfc-lifecycle-completion` | draft; D638 adds a concrete Archive set-equality failure | Resolve Q1-Q3 and absorb D638 before the alignment wave creates more active obligations. |
| `archive/live-marker-quality` | implemented; A0-verified 2026-08-20 | Closed. Its admission rules are an input to O3/O4, not a parallel selector. |
| `archive/dead-vocabulary` | implemented; A0-verified 2026-08-20 | Closed. Its declaration census feeds R6/F3; residual D428 remains separate. |
| `archive/engine-leverage`, `archive/vocabulary-wiring` | implemented; A0-verified 2026-08-20 | Closed and historical pack lanes released. Their contracts are inputs to semantic v1; no new RFC may duplicate them. |
| `teacher-surface` | accepted, unbuilt | Do not blindly implement as “coach mode.” R15/O11 decide whether it implements unchanged or is amended first. |
| `graduation-clearance` | accepted, unbuilt; 0.28 held; D642 split required | After Feedback Stage 1, correct stale criterion 13 and build the mechanism/read-only planner. D560 gates the 92-document apply/archive; clearance remains an input to Gate F, not Gate F itself. |
| `feedback-delivery` | accepted, Stage 1 dirty; CR1 repaired; D644 acceptance conflict | Narrowly author-correct criterion 20, close D643's explicit Stage-1 matrix and land without absorbing unrelated work; Stage 2 remains subject to its ownership/content obligations and the D560 hold. |
| `assistance-controls` | draft | Amend or supersede only after R3/O4; preserve the ruled real per-kind ceiling and already-identified wiring defects. |
| `pack-population-provenance` | draft | Feed R4/R6/O5/O6. Do not consume its proposed schema lane until the knowledge and pack contracts settle. |
| `learner-rating` | draft | Keep strength separate from F9 style/profile. Reconcile its storage/lifecycle claims before either lands. |
| `measurement-records` | returned; uncommitted authoring revision, no implementation | Its measurement/provenance primitives may support F2/F3; resolve its open questions rather than copying the schema. |

## Candidate graph

```text
process truth (A0)
  ├── shared-resource/lifecycle closeout
  └── active RFC closeout

evidence truth (A1–A4, R1, R2; O1–O3)
  └── F1 evidence registry + producer/consumer manifest
        ├── F2 semantic evidence + selector contract
        │     ├── F5 assistance modules + presets
        │     ├── F6 Review Map + recap
        │     ├── F8 bot policy
        │     └── F9 player metrics + grounded coaching
        └── F3 pack capabilities + migration
              ├── F4 knowledge source + immutable bundle
              └── F7 theory/drill/library + content graduation

F5 + F6 + F7 + F8 + F9
  ├── F10 campaign/progression (only if O10 = ship)
  ├── F11 coach/streamer/human-play composition (scope chosen by O11/O12)
  └── F12 release platform: self-host/privacy/a11y/PWA
```

F4 also depends on R4/R8/R18 and O5. F8 depends on R11/O8. F9 depends on R12/R13/O9.
The diagram shows architectural ancestry, not permission to draft nodes early.

## Node contracts and gates

| Node | Contract | Opens after | Must prove before acceptance | Likely existing document relationship |
|---|---|---|---|---|
| F1 | **Evidence registry and producer→consumer manifest** | A0–A4, O1 | One declaration source; separate predicate/reading/event projections; derived landed state; versioning; bidirectional completeness; declared operands, latency/disclosure/grounding; consumer/timing/role/session/form/answer-distance disposition; adapters for all 14 A4 producer paths; no free-text join, global verdict or generic-reader bypass | Extend `shared-resource-registers` or a narrowly separated evidence RFC after its process mechanism settles |
| F2 | **Semantic evidence and selector** | R1–R2/A3, O2–O3, F1 accepted | Typed sign/event/operands/squares; exactness/confidence/abstention; counterfactual population; subkind-level admission; critical override/top-k budgets; external validation and non-vacuity fixtures | Reconcile `measurement-records`, `live-marker-quality`, `dead-vocabulary`, `engine-leverage`, `vocabulary-wiring`; repair D630-D633 |
| F3 | **Pack capabilities, compatibility and migration** | R6/A3, O6, F1 accepted | Capability negotiation; additive extension rule; deprecation; dependency-aware automatic migrations; read-only full-corpus dry-run; mechanical/chess-judgment report; re-author budget | Reconcile `graduation-clearance`, `pack-population-provenance`, active schema claims; include indirect D566→outpost users |
| F4 | **Knowledge sources, builder output and runtime bundle** | R4/R8/R18, O5, F1/F3 accepted | Allow-list/licence/digest/span/version; chess keys; retrieval/abstention; injection boundary; immutable export; runtime without crawler/Postgres/Frameworks identity | Amend/split `pack-population-provenance`; no whole-Skipper agent dependency |
| F5 | **Assistance modules, presets and interaction contract** | R3/R5/A5, O4, F2 accepted | Separate workflow/preset state from technical profile/source preferences; intent presets; per-session ceiling; preset ∩ workflow ∩ honesty/access ∩ availability composition; pre/post-commit rules; touch/hover/keyboard semantics; module budgets; LLM-off fallback; honest unavailable state; migrate six profiles without cross-workflow contamination | Amend `assistance-controls`; reuse `live-marker-quality` admission rules; repair D636 with F11 ownership explicit |
| F6 | **Review Map, re-entry and social recap** | R7, O7, F2 accepted; F4 optional only for cited theory modules | Moment selection; engine-label boundary; replay/branch/drill links; grounded share packet; deterministic fallback; longitudinal focus excluded until F9 | New or amend game-story RFC lineage after A0 |
| F7 | **Theory/drill/library and content graduation** | R8/R10 as applicable, O6, F3/F4/F5 accepted | One theory↔rehearsal identity; transposition/provenance; no relevant-pack fallback; official/community lifecycle; Gate F pilot and closeout | Reconcile `graduation-clearance`, feedback Stage 2 and content lifecycle |
| F8 | **Bot policy/personality** | R11, O8, F1/F2 accepted | Separate strength/repertoire/style/error/time/memory/voice; calibration; information boundary; deterministic test mode; blind validation harness | Amend opponent contracts rather than fork selection logic if possible |
| F9 | **Player metrics, profile, skills and grounded coaching** | R12/R13, O9, F1/F2 accepted | Versioned metrics/denominators/sample/confidence; event drill-down; rating/style/advice isolation; data controls; migration | Coordinate with `learner-rating`; reuse `attempt_concepts` only after semantics bind |
| F10 | **Campaign/progression** | R14, O10=ship, F5/F7/F8/F9 accepted | Loop remains primary; grounded inventory/concept credits; scarcity/rewind result; no universal difficulty fiction; terminal/playtest criteria | Amend future RFC to current `design/06`; do not draft from the old thematic queue |
| F11 | **Professional/social composition** | R15–R18, O11/O12, relevant F5/F6/F8/F9 accepted | Explicit coach/streamer/player journeys; roles/consent/delay/fair-play/moderation; shared evidence modules; retained review/re-entry context | Amend `teacher-surface` and live-session lineage; split human play if admitted and independently deployable |
| F12 | **Release platform contract** | R18, O13; all mandatory 1.0 nodes accepted | Reproducible self-host profile; provider-off degradation; rights inventory; export/delete; accessibility/input/mobile floors; observability/update/backup | Amend deployment/PWA/settings lineage; no federation by implication |

## Schema and migration discipline

No candidate may reserve a lane while still blocked by research or owner decision. When a node is
eligible to draft, it claims against the current derived register, names what it yields to, and
includes negative/non-vacuity fixtures. F1/F3 must land before parallel feature RFCs begin claiming
pack/evidence resources. This is deliberately more serial at the foundation and more parallel at
the consumer layer.

## Content relationship

Only F3/F7 may lift Gate F, and only the owner can accept the resulting proof. F2/F4/F5/F6/F8/F9
may use disposable fixtures and the sacrificial pilot required by research. None authorises a
scale pack wave. Feedback-delivery Stage 2 may proceed only within its accepted obligation and the
active D560 hold; if those conflict, the conflict returns to owner/design rather than being
resolved by an implementer.
