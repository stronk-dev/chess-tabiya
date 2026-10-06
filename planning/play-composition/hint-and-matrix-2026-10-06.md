# Guided Hint composition and complete matrix — 2026-10-06

Scope: D3432, D3433 and D3434, with partial D1834 flow-back, under implementing `rfc/play-composition.md`
§4.1/§4.5/§6/A8 and `rfc/hint-distance.md` §5. No source, policy, preset, permission,
registry, schema or authored-content change. This is not full RFC or 1.0 completion.

## Actual changes

- Guided Hint retains its existing decision/request/rung state in one mounted component, but
  participates in the same expansion authority as the other play modules. Opening another card
  hides the hint and its board marks; reopening restores the same disclosure without an API call.
  The held staged warning still has paint priority. Hint never enters the seven packet-module
  query population; its existing request/poll and server admission authority remain separate.
- The first collapsed Hint captures its request intent before toggling parent state. Subsequent
  presses advance only through the unchanged permitted ceiling. Collapse does not cancel,
  retry or progress the request; decision changes and teardown retain those responsibilities.
- The phone preset menu is fixed to viewport insets rather than right-aligned to a centered
  trigger. It has an explicit bounded vertical scroll region, using the existing topbar token;
  the board's geometry authority is unchanged.
- State 6 now uses the real request/poll protocol, no route or delivery substitution, to reach
  `distance` under Guide me at all seven accepted viewports. It verifies exact request order,
  no direct move, one expanded card, unchanged board box and the real marks' disappearance and
  restoration through Theory → Hint. All preset-selection journeys assert menu containment.
- Normal full and matrix browser commands require 112 distinct current-run successful,
  unretried attachments with exact names and PNG dimensions. The source JSON report and PNG
  bytes are retained in a report-hash-bound `test-results/composition/` generation outside the
  directories replaced by later browser tiers. The existing always-upload CI step carries them.
  Nineteen Node controls test invalid joins and artifact retention, not screenshot content.

## Able-to-fail controls and intermediate failures

The first changed browser run failed because the new toggle checked reactive expansion after
changing it, skipping the request. Capturing the old intent fixed it; this failed intermediate
implementation is not a production pass. The next run reached five viewports, then timed out
on the real Support radio outside the 390×844 viewport. Its screenshot showed the left-clipped
menu. D3434 was recorded before repair; no forced click or threshold relaxation was used.

One partial-unbinding mutation fails because the visible unbound card has no expanded-seat paint.
Restoring both original unbound-card and ungated-paint behaviors then fails the permanent browser
assertion that opening Theory hides the hint card: received visible, expected hidden. Both mutations
are restored before final verification. These controls establish the real composition seam, not
new chess quality. An intermediate menu build omitted the existing topbar variable name; that typo
was corrected before the complete current-source gates, which are recorded below. The first full
browser run passed 68 smoke, five content and 50 matrix journeys, but the new artifact gate refused
inline JSON screenshot bodies: it requires current-run files. The screenshot helper now writes
explicit PNG output paths and attaches those files. The checker also refuses a second inline-body
authority alongside a path. That failed gate is not counted as complete browser verification.

## Verification

Full current-source gate results and retained matrix report digest are appended before commit.
Focused client contracts: 73 tests in two files; workspace types: zero errors and Svelte warnings.
Matrix verifier: 19 controls. A focused seven-viewport browser journey passed before the
last CSS-token correction; it is not substituted for the complete current-source result.

Replacement `make test-browser-matrix test-browser-production` exits zero: 50 current-source matrix
journeys, all 112 distinct successful unretried current-run PNG files accepted, then one packaged
default journey. The preceding unchanged-UI smoke/content tiers passed 68 and five journeys, with
one existing optional real-Maia skip. Together the four named CI tiers have 124 passing journeys;
the earlier failed aggregate invocation is not relabelled as a passing `make test-browser-ci`.
There are no retries. Desktop and 360×680 final-hint screenshots were visually inspected.

Report digest: `sha256:bc97ebee29ca7df11022fca84a5a0d3f6f522e729dbd9caa04b7bef35a61ea3b`.
The complete cell/dimension/PNG-digest receipt is saved as `matrix-evidence-2026-10-06.json`.
All 112 retained PNGs and the report were rehashed after the packaged tier and still match that
receipt. The files live under the generated report-hash directory in CI's uploaded `test-results/`;
the committed receipt is their inventory, not a substitute for those images.

Complete `make verify-content` exits zero: 225 tests/23 files, 92 clearance documents with zero
errors and all 104 capability documents matching their derived requirements. The first exact-index
software pass at `0b21a1b29d2183940157b87f8d6dacabf9dd6144` includes 3226 tests/340 files,
seven isolated performance tests/four files and 18 then-current artifact controls. It predates
the screenshot-file helper and dual-authority negative and is not the final source proof; the
complete replacement proof is recorded before commit.

Complete replacement `make staged-software-contracts` exits zero at tested tree
`c039e0e234619cdb2494776380d08cf9b530fece`: warning-free workspace types, 3226 software tests/340
files, seven isolated performance tests/four files, 19 final artifact controls and all downstream
build/scaffold/packaging/release-policy/evidence/source/value/semantic/capability/history/migration
checks. All 970 declarations remain current; canonical migration planning requires no content,
refusal or ledger re-stamps. The unchanged exact-index proof is
`hint-and-matrix-software-2026-10-06.json`. All nine changed software/Make/browser paths remain
byte-identical to that tested tree. Later proof/log/tracking bytes are verified separately and
are never relabelled as that tree.

Complete `make staged-process-contracts verify-governance` exits zero: register/status/history,
work-state/work-item, anchored roadmap/receipt, intent, test-tier, docs and staged-process controls
pass. All 1686 live ledger items and all 569 UX items are assigned/routed; none is untriaged or
doing. The final proof/log-only additions and ordinary commit hooks check the last staged boundary.
No GitHub run, publication, deployment, native calibration or full-release success is asserted.

## Residuals

Screenshot coverage and this shared expansion seam do not close all A1–A15 obligations. Complete
every-module max-load semantics, all actionable hit targets/vocabulary destinations, Inspector
contract cleanup, Advanced hint-distance storage, latency/analytics, the proposed D1639 ceiling
table and owner-use discharges remain in their existing authorities. D910 and both RFCs remain
implementing; D1834 stays open. D3435 records the exact remaining max-load defect: the current
state-13 journey asserts three default rail rows and its first badge, not every seatable module
and badge required by A6. It is queued for a genuine production-boundary fixture, not a synthetic
packet or a renamed screenshot. No milestone or capability is promoted. No protected intent/archive/content edit,
push, deployment, worktree or new subagent. Unrelated shared edits are excluded from staging.
