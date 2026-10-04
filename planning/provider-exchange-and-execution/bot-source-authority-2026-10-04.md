# Bot provider source admission

The bot adapters and compiler now enforce the shared provider authority required by
`rfc/bot-policy.md` §3. The original production adapters accepted spread/JSON delivery copies;
the compiler could also choose a move from a copied or changed source view. Seven of the first
eight permanent regressions failed against `039b7a44` before the repair.

`adaptMaiaDelivery` and `adaptStockfishDelivery` assert the operation-specific shared delivery
before reading it. Only those adapters register immutable source views in private WeakSets.
The compiler checks that authority before admitting Maia or applying the Stockfish guard;
replay authority construction refuses copied successful source views. A forged Maia source
produces typed `invalid_response` and no move. A forged optional guard abstains the whole guard
without replacing Maia's distribution. Unexpected programming errors are not caught as provider
absence. A genuine exact-FEN Maia page is not a bot's history-conditioned source.

Acquisition, scheduler, parser, request and response identities remain shared and unchanged.
Persisted deliveries re-enter only through `parsePersistedProviderDelivery`, then the same
adapters; no public source-view seal or stored-view parser is added. Retained-exact sources
produce the same source view and decision. Sampling, profile/layer parameters, root joins,
guard thresholds and chess collectors are unchanged. No catalogue/schema/source digest changes
or authored content migration are required by this server-only authority repair.

`make bot-source-authority-check` passes 79 tests across three files, including eleven new
source controls and a real REST/SQLite test proving a copied acquisition commits no event.
Compiler positives now use genuine operation captures, parser and shared seals. Invalid
duplicate/missing/illegal source rows are rejected by that parser before a bot view exists;
valid crossed-root and profile controls still test the compiler's own joins. Normal typecheck
passes with zero Svelte errors or warnings.

Complete exact-index software passes against tree `3cc83ebda14ca4bf056ac08389539f24d5167ffb`:
2,834 tests/324 files, seven performance tests/four files and all downstream software,
build, packaging, authority, history, lifecycle and migration contracts. The proof is
`bot-source-authority-software-2026-10-04.json`. Product/test/content/schema bytes remain
identical afterward; only final results/tracking/proof/log text follows. All 866 capability
declarations and 275 factory outcomes remain current, semantic validation stays 38/38 cases
with zero fully passed profiles, and the 352-document migration plan has no remaining rows.

Real-content verification passes 223 tests/23 files, zero clearance errors and all 104
exact requirement documents. Provider verification passes 315 tests including the 79 bot
controls. Browser CI passes 111 journeys (56 ordinary, five content, 49 matrix and one
packaged-default), one optional real-Maia latency skip and zero retries. Governance passes;
final exact-index process checks and normal hooks run before commit. Tracker, queue,
RFC/register, docs, anchored roadmap and append-only log close out together.

Only D3368's source-admission scope closes. Legacy raw opponent and durable evidence
consumers, whole-manifest execution/digest, source-absence algebra, authorized availability and
bot calibration/latency remain open. No complete RFC, capability, milestone or 1.0 release is
claimed. Unrelated shared edits stay excluded; no push or new worktree.
