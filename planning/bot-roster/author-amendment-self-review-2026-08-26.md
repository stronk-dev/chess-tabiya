# Bot policy/roster author-amendment self-review — 2026-08-26

**Reviewer:** codex, reviewing its own author amendment

**Verdict:** internally buildable enough for independent cross-review; not accepted. The amendment
now gives every D1601–D1609 return blocker a normative contract, able-to-fail acceptance arm and
completion owner. Live production remains deliberately unchanged and the catalogue remains empty.
Self-review cannot discharge the independent-review requirement.

## Blocker trace

| row | normative repair | falsifier / completion owner |
|---|---|---|
| D1601 | `bot-roster` §2 separates band, family and display; it makes no cp↔Elo comparison | roster criteria 2/12; exact-digest calibration D6 |
| D1602 | `bot-policy` §2.4 consumes one sealed whole-candidate `stockfish-guard@1` receipt and derives loss internally | policy A3; roster criterion 6 / D1 |
| D1603 | `bot-policy` §2.5 makes pawn weighting depend on successful guard application | policy A4; roster criterion 7 |
| D1604 | `pawn_move@1` is a closed legal-board classifier returning a sealed view; caller strings are absent | policy A4; roster criterion 6 / D1 |
| D1605 | `bot-policy` §4.1/§10 specify one server-owned atomic run-bound opponent operation and twelve-operation census | policy A2/A12; roster criterion 10 / D7 |
| D1606 | `stockfish-guard@1` pins the request; §4.5 pins 400-ms healthy, 500-ms intervention/opportunity deadline | policy A11/D6; roster §3.2/D6 |
| D1607 | `bot-policy` §7 and roster §7 accept no caller behavior sentence and compile source-bearing card statements | policy A9; roster criterion 4 |
| D1608 | `opponent-experience.md` owns picker, grounded card and fixed identity as one outcome | opponent criteria/discharges; roster criterion 14/D10 |
| D1609 | visible uncalibrated is registration-only; exact-digest calibration/observability blocks completion | policy D3; roster criterion 12/D6 |

## Live negative anchors the implementation must invert

The current source still proves why this is a draft:

- `BotPolicyCandidateInput.guardLossCp` and `candidate.traits` are caller fields in
  `apps/server/src/bot-policy-catalog.ts`;
- `composeBotPolicySelection` has no non-test caller;
- `/select-move` is authenticated but not run-bound and accepts caller FEN/history/policy/seed;
- `SessionController` obtains selection bytes, then separately appends them through the run store;
- run create/resume, runtime/schema carrier, capabilities and card have no complete profile path.

The implementation must delete or isolate those authorities. Adding the new types beside them does
not pass the operation census.

## Shared-resource and lifecycle check

- `bot-policy` retains run-schema 0.18 plus its ordered stamp-only migration; the atomic decision
  fields are the same persisted policy record, not a new lane.
- `bot-roster` retains run-schema 0.22 for `searchBound.kind: "depth"`.
- Card/trait/request registries are catalog-local `@1` identities, not authored storage tables.
- `opponent-experience` claims no shared resource and consumes the catalogue/record.
- Both amended RFCs remain `draft`; no implementation is authorized before independent review and
  re-acceptance.

## Remaining decisions and receipts

1. D1610: final twelve identity assets before shipping profile digests.
2. D1611: explicit first-use profile; the RFC recommendation is `human-baseline-1400`.
3. Roster D4: whether Stage-B registered candidate evidence may drive additional measured bot
   traits. Recommended: yes, but only through the same per-trait registration/measurement gate;
   never as free evidence weights or learner-derived personalization.
4. Roster D5: whether human-scale Elo is ever funded; band-relative exact-digest calibration is
   sufficient for honest 1.0 cards if the answer remains no.
5. Release concurrency, exact-digest calibration/observability and owner-use receipts remain real
   work. They are not converted into prose evidence by this review.
