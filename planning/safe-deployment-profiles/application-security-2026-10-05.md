# Application response security and invitation recovery

The application now owns its base security headers, revalidates stable public assets,
and serves invitation authentication from a same-origin module with a safe POST fallback.
The browser pass also found and repaired a real Rating document/API routing collision.
This implements D3395, D3396, D3398 and D3399 under the implementing deployment and
learner-rating RFCs and the implemented app-shell deep-link contract. It does not
complete those RFCs, the release milestone or the full 1.0 goal.

## Response behavior

The actual Node response boundary sets the exact specified `nosniff`, `no-referrer`
and closed `Permissions-Policy` headers before streaming. Local, static, authentication,
early refusal and generic adapter errors are covered. Existing streaming, disconnect,
request limits and fixed error bodies are preserved. HSTS remains the TLS proxy's job.

Only build-hashed files under `/assets/` receive immutable caching. HTML and fallback
shells, stable public modules, icons and installation metadata use `no-cache`.
`manifest.webmanifest` has its actual manifest MIME type. Authentication and invitations
retain `no-store`; HEAD remains bodyless.

## Invitation behavior

The join page contains no inline executable script. Its escaped token is form data;
`/session-join.js` reads it and performs the existing authentication and atomic join.
The form captures credentials before disabling both submit buttons, prevents duplicate
submission and restores the form on failure. Account refusal, revoked invitation and
connection failure produce fixed learner copy, never internal diagnostics. Retry is an
explicit learner action. Without JavaScript, the native form posts credentials in the
request body, never in a GET URL; it cannot silently authenticate or accept a seat.

The real browser controls register and sign in separate guests, accept actual participant
invitations, revoke a link after viewing, refuse incorrect credentials and recover, and
abort then explicitly retry an authentication request. They also prove the no-JavaScript
request method/body and unchanged invitation privacy.

## Rating document and API

`/rating` remains both an existing JSON API and a client route. Application composition
selects HTML only when the browser's `Accept` prefers that representation; the existing
JSON default, authentication refusals and nested API paths remain unchanged. Both
representations include `Vary: Accept`. Quality zero refuses that media range, and more
specific ranges override wildcard preferences. This is the narrow two-representation
selection described by [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.1),
not a new generic content-negotiation framework.

Actual HTTP controls cover anonymous API refusals, direct HTML entry, trailing slash,
HEAD, browser preference, JSON preference and nested paths. The built-browser journey
registers a real account, verifies the authenticated API is JSON, enters Rating directly,
reloads it and observes the existing measured-record screen and signed-in session.
No rating arithmetic, publication floor, assistance ceiling or admission rule changes.

## Verification

`make application-security-check` passes 83 tests across six files, including HTTP
streaming, ingress, session and configuration regressions. Workspace types pass with
zero Svelte errors or warnings. `make application-security-browser` passes all eight
built-application journeys. Complete exact-index software passes 3067 tests across
329 files, seven isolated performance tests across four files, and the downstream
build, packaging, release-policy, source/value, history, lifecycle and migration gates.
The verified source tree is `7650ee0c81f4c3b32e87fb6b95aa18e7f02187ac`; the adjacent
software JSON retains its exact receipt. Source and test bytes are frozen through closeout.
Complete rebuilt browser CI passes 119 journeys with one optional real-Maia latency
skip and zero retries. Content passes 223 tests across 23 files, all 104 derived
requirements and zero clearance errors. The adjacent negatives JSON preserves predecessor
failures and two test-setup corrections; no thresholds, security rules or retry counts
were weakened.

All 942 capability declarations retain their committed meanings. The complete canonical
352-document migration plan contains zero writes or ledger restamps. No capability or
authored-content metadata migration is required. Ledger/work-state, queue, RFC/register,
docs and anchored roadmap close out together; complete governance, staged process checks
and normal commit hooks verify the final owned-file list before commit.

## CSP contract still held

D3397 records a real conflict: safe-deployment-profiles §10 forbids all embedding with
`frame-ancestors 'none'`, but the shipped host preview embeds the actual read-only
`/live/overlay/:runId` route. An explicit narrowly scoped same-origin exception or an
equally spectator-safe preview redesign must resolve that contract before full CSP
rollout. This checkpoint adds neither an exception nor a global policy and does not
claim complete criterion 11 or zero-CSP-violation release journeys.

D3393's separate public/internal probe contract, deployment image/privacy joins,
operator receipts, prior-release migration, release/rights proof, owner-device validation
and official content remain open. Routine metadata maintenance requires no owner ruling.
