# Provider health and the live half of opponent recovery: implementation receipt (2026-09-24)

This implements `rfc/provider-health-degradation.md`. The owner directed direct implementation with
no review round. RFC defects were fixed inline with a changelog line. Every other finding became a
test. The RFC claims nothing versioned, so no register lane, migration or run-schema change landed.
This receipt covers exactly what landed, what did not land, and why. It does **not** archive the
RFC, flip ledger rows or append to the exploration log. Those belong to the closeout, which the lane
instructions reserved.

Canonical description: `docs/provider-health.md`.

## Landed

| surface | home |
|---|---|
| Closed declarations, derived sets, the ten-operation execution tuple compiled against F1 budgets, the state-specific snapshot union, operation availability, the one wire type and strict parser, learner notices | `packages/runtime/src/provider-health.ts` |
| `ProviderRegistry`: configuration parse, derived generations, circuit, repeat-open window, two-success recovery, per-group `ProviderBackoffCoordinator` (FIFO single-flight, 429 floor or `Retry-After`, 5/15/60 s), cache-inventory join, snapshots and currency, release receipts, supervisor lifecycle sink, exchange settlement, typed `ProviderUnavailableError` (`PROVIDER_UNAVAILABLE`, 503), structured transition log | `apps/server/src/provider-health.ts` |
| Registry-admitted Lichess tablebase and Explorer clients (cache hits bypass admission, failures are never cached as answers); adapters for fixtures, external voice, reasoning review and TTS | `tablebase.ts`, `corpus.ts`, `provider-health-adapters.ts` |
| Opponent selector: one compiled deadline (the 60 s Maia wait is deleted), a 512-entry LRU with generation keys and TTL fixed at insertion, separate in-flight work, late-generation discard, `cached_exact` receipt, mode and sampler in the key | `apps/server/src/opponent-selector.ts` |
| Supervisor lifecycle events and the `artifact(engineId)` accessor; startup tolerates an optional engine that is down | `engine-supervisor.ts`, `application.ts` |
| Maia container-identity probe; sidecar `tabiya-identity` reply; release compiler injects `MAIA_IMAGE_ID`/`MAIA_MANIFEST_DIGEST`/`MAIA_CONFIG_DIGEST` | `maia.ts`, `workers/maia/sidecar.py`, `deploy/compose.release.template.yaml`, `.github/workflows/release.yml`, `tools/verify-packaging.mjs` |
| `/capabilities`: `providerHealth` replaces the `providers` flags; `policyModes` equals the configured modes; F1 availability reads the registry; `no-store` | `capabilities.ts`, `evidence-manifest.ts`, `rest.ts` |
| `/healthz` lists instance states and never fails because of an optional provider | `application.ts` |
| Voice: one budget covers both attempts. Speech speaks the displayed or deterministic text and never calls voice again. A reasoning-review provider failure returns 503, never a valid empty answer | `guidance.ts`, `rest.ts` |
| Bot roster availability (D3031 / D7) reads the registry snapshot and the release receipt; the exchange-observed observer is deleted | `bot-opponent-source.ts`, `bot-profile-catalog.ts` (`guard_release_receipt_invalid`) |
| Client: one selector, zero `providers.*` gates. Controls stay in the layout with a reason and a Retry affordance. Settings rows are plain; Technical details carry generation, reason and times | `provider-availability.ts`, `DrillScreen.svelte`, `AssistanceControlFields.svelte`, `AssistanceSettings.svelte`, `App.svelte` |
| **Opponent recovery, live half.** The run pauses before any opponent move. Retry re-issues the same request. Change opponent is in memory only, and the "run record does not retain it" line is shown. The cached-reply disclosure is shown | `session-controller.ts`, `DrillScreen.svelte` |

## Criteria to tests

| # | status | tests |
|---|---|---|
| 1 | met | `packages/runtime/src/provider-health.test.ts` "derives six families…"; `apps/server/src/provider-health.test.ts` "parses configuration…", "stockfish-play and stockfish-analysis fail and recover independently" |
| 2 | met | runtime "rejects invented fields…", "round-trips a total snapshot…"; server "configuration alone…", "an unverified provider can also fail…", "repeat opens…", "two transient opens more than five minutes apart…" |
| 3 | met (fixture) | `apps/server/src/opponent-selector-health.test.ts` "serves the warmed position as cached_exact…". The real-sidecar run is Discharge D1 |
| 4 | partial | registry cancellation, timeout and classification tests; `guidance.test.ts` "never rewrites a reasoning-review provider failure…" (content tier). No per-provider timeout/malformed/recovery fixture exists for each of the eight providers |
| 5 | met | server source guards (no `timeoutMs: 60_000`, one voice budget); selector "gives every engine request the remaining compiled budget" |
| 6 | met | server "a Lichess 429 blocks both…", "honors a longer valid Retry-After…", "escalates … 5 s, 15 s, 60 s" |
| 7 | met | server "claims are single-flight, token-bound and expire…"; generation change invalidates the claim (`#changeGeneration`) |
| 8 | partial | server "refuses a caller-authored ticket and a second settlement". Exchange settlement goes through `assertProviderDelivery`. Voice/TTS have no sealed exchange identity yet (RFC changelog 2026-09-24 (2)) |
| 9 | met | server "derives a distinct generation…", receipts refuse `local_fixture` |
| 10 | partial | selector LRU, TTL, generation, late-insert and immutability tests. Cache keys are selector-internal strings, not registry-issued capability objects |
| 11 | partial | the selector's single-lookup hit returns selection and receipt together. There is no sealed exchange delivery for opponent selection yet |
| 12 | met | server "is cache-only while a current exact row exists…" |
| 13 | met | server "equal read-only snapshots…", "issues a receipt only over a current, fixture-free snapshot…" |
| 14 | partial | runtime "maps the four provider-backed F1 producers…", "refuses a duplicate, a crossed instance…". The obligation set is compiled rows against the manifest, not derived from committed consumers |
| 15 | met | server "claims are single-flight…" (`belongsTo`, no coordinator for an unconfigured group) |
| 16 | partial | source guard "speech never calls external voice again". The displayed text is a server-side record, not a brand-sealed reference, and speech still refuses the Compare scope |
| 17 | met | runtime wire parser tests; `application.test.ts` asserts `no-store`; `capability-response.ts` uses the shared parser |
| 18 | met | `apps/web/src/lib/provider-availability.test.ts` source guard; `tests/browser/provider-health.spec.ts` "provider-off controls stay in place…" |
| 19 | met | server "a supervisor restart moves to a new generation…"; selector "discards a late result…" |
| 20 | met | selector "never substitutes another opponent…"; the existing voice deterministic fallback |
| 21 | partial | runtime "gives provider-off, blocked, cache-only, recovering and ready five different notices". No end-to-end tablebase out-of-range browser case |
| 22 | partial | browser paused opponent at phone, tablet and desktop widths; stable board edge; degraded corpus; settings rows. No browser deterministic-voice-fallback case and no 10× capacity-pressure run |

## Not landed, and why

1. **Durable recovery (`rfc/opponent-recovery-journey.md`).** The two run events, the recovery
   route, `opponentSelection.acquisition`, the effective-policy projection and run-schema lane 0.26
   are its schema half, which is far down the queue. None of them was taken. Review and export still
   do not show a failure or a mid-run opponent change, and the surface says so.
2. **The provider-protocol lane for the three external exchange operations** (§4, §8). This is a
   register claim, and this RFC claims `none`. The identities are declared in the tuple but are not
   resource members.
3. **Bot guarded-family release receipt.** The API exists (`releaseReceipt` and
   `validateReleaseReceipt`), but nothing issues a receipt because no release-concurrency benchmark
   exists. Guarded families stay `conditional`.
4. **Development `maia` mode bots.** A locally built image has no registry manifest digest, so the
   probe returns `null` and bots report `unavailable (protocol)` unless the three identity variables
   are set. The release compose injects them.
5. **`/readyz`** (F12-A) does not exist. **Discharge D1** (release-profile failure/recovery on the
   pinned CPU tier) is F12-H.
6. The opponent budget is the compiled 4 000 ms. If practical resistance (up to four Maia calls and
   five probes) or Maia on the ruled CPU tier cannot fit, that is release evidence to escalate. Per
   the RFC, it must not be solved by lengthening the budget.

## Intent

`planning/platform-alignment/provider-health-intent-amendment-2026-09-24.md` reports two intent
sentences that the tree has now falsified (`design/02:73`, `design/03:330`, "capabilities stay green
on Maia loss").

## 2026-10-12 — D3751/D3752 live recovery correction

The original raw-run failure notice inserted above the workspace shifts the phone board
187.56 px; the old width-only browser assertion misses it. The notice, cached response and
session-change disclosure now use the existing Actions companion. Phone failure opens its
existing modal, without another sheet or layout sibling. The actual chosen mode controls live
status/model-limit copy; no recorded band/profile is borrowed by an in-memory mode change.

Five initial mounted/status controls fail on the predecessor and all three original viewport
pause checks fail when strengthened to full rectangles. Nineteen focused controls and clean
types pass after repair. Six lifetime cases cover successful change/Retry, another pause,
navigation, teardown and user focus; repeated clicks issue one request. Ten native browser
journeys pass: retry and engine→second failure→human→reload at phone/tablet/desktop, plus
saved-reply disclosure at all three viewports and provider-off corpus/settings. The saved-reply
fixture adds the existing transport header to an actual application-selected move; it proves
client disclosure, not backend cache admission. A visible Actions badge, announcement and tab
description retain that disclosure with the companion collapsed; no unsolicited modal opens.
The browser reads a populated `run.started` policy and checks it
unchanged after both switches and reload. Geometry is measured while paused; all 64 physical
square centers and semantic-grid focus are checked after the phone modal releases inertness.

No schema, provider selection, saved policy, event or calibration change; durable recovery
and the provider-health release discharges remain open. Full-gate closeout is recorded in the
existing exploration log and roadmap, not a new capture or work register.

Final ordinary serial `make roadmap-receipt verify-awake build test-browser-ci-awake` exits zero:
5,237 software/384 files, seven unchanged-budget performance/four files, 255 content/26 files,
clean types/governance/packaging/build and 345 browser passes (280 smoke, five content, 59 matrix,
one packaged-production), one existing optional Maia skip, zero retries, all 150 input/112
unretried composition cells. Earlier full attempts fail the unchanged label sweep and
learner-rating dependency isolation; renaming the rendered label and removing its unnecessary
controller type import repairs them without weakening either check. Latest published GitHub
browser readiness remains red under D3600; these local results do not discharge it.
