# Bot policy — partial implementation receipt (2026-09-24)

Owner-directed implementation of `rfc/bot-policy.md` with no review round (consolidation and
review come later). Defects in the RFC text were fixed inline with a changelog line; every other
finding became a test. This receipt states exactly what landed, what did not, and why.

## Landed

| RFC surface | Home | Test |
|---|---|---|
| §1 `bot-profile-catalog@1`: twelve profiles derived as `FAMILIES × BANDS`, ids `family.band@1`, exact model/sampler/ordered layers, pinned profile + behaviour digests | `packages/runtime/src/bot-profile-catalog.ts` | `packages/runtime/src/bot-profile-catalog.test.ts`, `apps/server/src/bot-profile-catalog.test.ts` (recomputes RFC-8785 SHA-256; drift fails) |
| §3 / [[D3025]] complete-profile identity | `resolveBotProfileReference` | substitution matrix (family, band, layers, sampler, model, digest, version, extra/missing keys) |
| §3 compile-time failures (A5) | `assertBotLayerComposition` | 14 refusal arms + forcing ×3 / quiet ×3 read from the depth-8 artifact |
| §2.5 `pawn_move@1` legal-board view (A4) | `classifyPawnMoves`, `compileBotClassifierView` | both colours, every file, double pushes, captures, en passant, four promotions; castling and pieces negative; set-equal to the legal map |
| §2.2 sampler (A7) | `compileBotPolicyExecution` over `reconstructMaiaDistribution` | full-vector 0.5/0.3/0.2 control equals the registered production sampler; the 837-cell captured sample is read from `results.json` |
| §2.4 whole-guard cp/mate algebra (A3) | `deriveGuard` inside the compiler | best legal reference outside Maia's window; ≥250 cp mask; unavailable/deadline/failure/mixed/all-mate/duplicate/missing/wrong-root/short-depth/empty-after-mask all abstain with Maia mass byte-identical to baseline |
| §2.5 guard dependency (A4) | trait layer | applied only after an applied guard; otherwise `guard_dependency_abstained` and baseline-equal mass |
| §4.3 no-move algebra and below-floor degradation (A10) | compiler | Maia unavailable/deadline → `base_provider_unavailable`; invalid page/root/profile mismatch → `provider_failed`; below 0.97 runs the same sampler, recorded `degraded` |
| §4.2 / §6 deterministic decision (A6) | `projectBotPolicyDecisionRecord` | byte-identical re-derivation; emission-order invariance; seed/payload/root sensitivity; chosen move always has positive final mass |
| [[D3026]] / [[D3027]] durable replay | `sealBotPolicyReplayAuthority`, `parseBotPolicyDecisionRecord`, `parseBotPolicyEventEnvelope` | a coordinated move/mass/digest rewrite with agreeing hashes fails; no API accepts a caller envelope |
| §4.1 / §6 non-circular operation envelope (A6) | `compileBotPolicyEventEnvelope`, `botPreProviderOperandDigest` | timing outside identity; writer/request/root/profile/seed distinguish the pre-provider digest; tampered operation fields fail |
| §4.1 / [[D3028]] request grammar and result table | `packages/runtime/src/bot-opponent-ply.ts` | four-field parser refuses FEN/profile/seed/candidates/empty ids/non-canonical digests; all eight result rows round-trip and refuse tampering |
| §7 grounded cards (A9) | `apps/server/src/bot-card.ts` + `bot-policy-measurements.ts` | every statement has closed id + sources; numbers re-read from `results.json`, `d969-depth8-abstain-results.json`, `tools/d333-band-outcome-harness/out/summary.json`; no strength number while uncalibrated; wrong-digest receipt refuses; `humanLikeLabelAllowed` needs all three verdicts |
| §8 capabilities + two refused dispositions | `apps/server/src/bot-roster.ts`, `capabilities.ts` | server roster crosses the web parser (`apps/web/src/lib/capability-response.ts`), which requires set-equality with the runtime catalogue |
| roster D1 half | deleted `composeBotPolicySelection` (bare `guardLossCp` / `traits: string[]`) | legacy `BOT_POLICY_PROFILES` stays empty so public `/select-move` cannot play a profile |

## Not landed, and why

1. **Run lane 0.18 and its migration.** `RunOpponentPolicy.profile` and `OpponentSelection.policy`
   widen the persisted run schema. Every run read is keyed on
   `schema_version = DRILL_RUN_SCHEMA_VERSION`, so 0.18 needs the stamp-only migration. `make
   register-check` orders that migration position behind `concept-registry`, which is behind
   `evidence-job-durability`, which is behind `longitudinal-store` — none landed. Taking the
   position out of register order was refused. Consequence: no run can carry a profile, so create
   (§10 op 1), resume (op 2), the event-embedded envelope (ops 10–11) and rematch cannot land.
2. **The atomic `POST /runs/:runId/opponent-ply` route** (§10 ops 3–6, 9–10). Besides 0.18 it needs
   the shared `maia.policy_page@1` / `stockfish.legal_root_table@1` deliveries from
   `rfc/provider-exchange-and-execution.md` ([[D3030]]); the RFC forbids a bot-private acquisition.
   The compiler therefore consumes provider **payloads** whose digest is the whole source identity.
3. **Profile availability** (§4.3 second half, A10 availability arms). Joining provider health's
   snapshot and release receipt ([[D3031]], Discharge D7) needs `rfc/provider-health-degradation.md`
   to land; a configuration-presence shortcut is forbidden. Every roster row reports
   `not_startable` with the closed blockers `run-schema-0.18`, `provider-exchange`,
   `provider-health` instead.
4. **The `bot-profile-catalog` shared-resource register row** (Discharge D8). The bootstrap's
   catalogue has three closed source kinds and absent-source admission is [[D3082]], unlanded. The
   catalogue ships code-authored with its own drift gate; no register row was written.
5. **Stage B** (Discharge D1): no registered trait consumes candidate features; `features` rows are
   empty.
6. **A11 / D6 release benchmark and D3 calibration**: need the mounted route and running
   Maia/Stockfish containers. No profile calibration receipt exists; every card is `uncalibrated`.
7. **A12 operation census / A13 release journey**: ops 1–6 and 9–11 above are not production
   callers yet; ops 7, 8, 12, 13 exist.

## Verification (this worktree, 2026-09-24)

`make typecheck`, `make verify-software`, `make register-check` and `make test-browser-smoke` pass.
`make bot-roster-census` runs the four bot test files. Historical draft falsifiers that read the
old composer (`tools/d1605-bot-route-boundary-harness`: `composeBotPolicySelection` exists; the
roster is absent from capabilities) are inverted by this landing, as intended.
