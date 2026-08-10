# Drill Pack Format — implementation plan

RFC: `rfc/drill-pack-format.md` (accepted 2026-08-12). Assignee: codex (schema +
tooling) & Marco/claude (pack A content). Scaffold comes from
`planning/branch-runtime/plan.md` §0. `[x]` flips only with the exercising test.

## 1. Schema (`packages/schema`, `schemas/drill_pack.schema.json` v0.2)

- [ ] v0.2 schema per RFC amendments: spine, feedbackPolicy, checkpoint
      interaction (intent_capture / prediction+grading), authoredBoundary,
      deviations (renamed, classed), on-ramp knobs, timing-window triggers
      (frozen vocab: atPly/atSpineNode/fenPredicate/materialBalance)
- [ ] Living amended Najdorf fixture (archive fixture stays frozen vs v0.1 — DPF-C1)
- [ ] Negative fixtures, one per amendment (list in RFC acceptance criteria)
- [ ] Spine legality lint (paths legal from start.fen) + prediction-checkpoint
      lint (warn >2 per segment)
- [ ] Digest: SHA-256 over RFC 8785 canonical JSON; key-order invariance test
      (DPF-C5)
- [ ] URL forms: /drill/<id>@<version>[/<node>] and /fen/<encoded>/<objective>;
      FEN percent-encoding round-trip test (DPF-C8)

## 2. Pack A — anti-Caro-Advance (content; the E3/Q7 experiment)

- [ ] Spine: 1.e4 c6 2.d4 d5 3.e5 tabiya; main plans (c5/f6 breaks, Bf5, Tal 4.h4)
      from reviewed sources cited per research house rules
- [ ] Checkpoints incl. ≥1 timing window (tempo contract) and ≥1 prediction
      interaction; feedbackPolicy delayed_checkpoint
- [ ] Deviations map for common sound alternatives + concept violations
- [ ] Review against `archive/brief-v2/product/content_pack_authoring.md`
      regression checklist; reviewer: Marco
- [ ] **Authoring time recorded in log.md** (Q7/K10 evidence — this number is a
      kill-criterion input; log it honestly)
- [ ] If the frozen trigger vocab proves insufficient → draft v0.3 amendment,
      log DESIGN-GAP, do not improvise fields

## 3. Round-trip

- [ ] Pack spine + run branches → legal PGN with variations (uses runtime pkg)
