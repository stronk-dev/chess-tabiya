# Bot roster — partial implementation receipt (2026-09-24)

Owner-directed, no review round. The 4×3 launch floor is **registered and described, not
playable**. Mechanism detail and the persistence/provider blockers are in
`planning/bot-policy/implementation-receipt-2026-09-24.md`.

## Criteria → tests

| # | Criterion | State | Test |
|---|---|---|---|
| 1 | roster derived, set-equal to `BANDS × FAMILIES` | ✅ | `packages/runtime/src/bot-profile-catalog.test.ts` census + duplicated-band counterexample; `make bot-roster-census` |
| 2 | independent axes; behaviour vs profile digest | ✅ | same-band model / same-family layers / cross-family differ; presentation-only change keeps `behaviorDigest`; policy change moves both (`apps/server/src/bot-profile-catalog.test.ts`) |
| 3 | final identity display-only | ◐ | presentation slot is `null` for all twelve and reaches no statement; placeholder names were **not** shipped. Owner assets (D8/[[D1610]]) outstanding |
| 4 | grounded cards, no caller prose | ✅ | `apps/server/src/bot-card.test.ts` |
| 5 | `searchBound` `depth` widening across the site set | ✗ | run-schema lane 0.22 is a persisted enum change; lanes 0.18–0.21 are unlanded and every run-schema bump needs a stamp migration whose position is not free. The guard's depth-8 bound lives in the layer declaration and the root-table request, never in the persisted `SelectionEngineIdentity.searchBound` |
| 6 | sealed guard and trait authority | ✅ (compiler) | `apps/server/src/bot-policy-compiler.test.ts`; bare-loss/trait-string composer deleted |
| 7 | guard-dependent pawn family | ✅ | compiler tests: abstained guard → trait abstains, mass equals baseline |
| 8 | depth-8 numbers, not depth-12 | ✅ | `apps/server/src/bot-policy-measurements.test.ts` and card test; this RFC's own −1.01 cp depth-12 quote corrected to −0.88 cp |
| 9 | band set pinned | ✅ | 2400 / 1500 / 1600 refuse |
| 10 | real production consumption | ✗ | needs bot-policy run lane 0.18 (migration behind `concept-registry`), shared provider delivery and provider health |
| 11 | one calibration authority | ✗ | runner not built; needs the route and containers |
| 12 | calibration/observability completion | ✗ | no receipt exists; card shows `uncalibrated`, `humanLikeLabelAllowed` false |
| 13 | explicit new-learner default | ✗ | owner decision [[D1611]]; Play still defaults to the raw 1400 rung |
| 14 | complete learner outcome | ✗ | `rfc/opponent-experience.md` (returned) owns the picker/card/identity bar |
| 15 | behaviour breadth honest | ◐ | measured refusals cannot register (composition test); the card never presents twelve personalities. Route/phase/clock/endgame work remains D3/D4 |

## Numbers used, all from committed artifacts

- Sampler fidelity: `planning/platform-alignment/bot-policy/results.json` (837 cells; 19.57 vs
  19.84 cp captured vs reconstructed).
- Guard and pawn trait: `planning/platform-alignment/bot-policy/d969-depth8-abstain-results.json`
  (804 cells; 100% severe mass removed; 1.36 cp; pawn share 33.5% → 45.8%, +12.28 pp, −0.88 cp,
  0.988 retention).
- Band ordering: `tools/d333-band-outcome-harness/out/summary.json` (1,020 games per rung,
  monotone, all CIs disjoint) — stated only as a fact about the raw model, never as a profile's
  strength.

No strength number, Elo or human-like label is invented anywhere.
