# Built-in learner Explorer integration — 2026-09-30

Authority: implementing `rfc/provider-exchange-and-execution.md` §8 and provider-health contract.
Items: D3326 (shared acquisition), D3327 (HTTP disconnect propagation).

## Production boundary

- The real application injects `ExchangeCorpusSource` into corpus REST, repertoire and return
  scheduling. New requests use the existing descriptor/parser/source factory and shared scheduler,
  not a private fetch/queue/cache or third parser. Provider configuration names the actual `.org`
  endpoint, and only the operator credential goes upstream.
- The shared raw source preserves full provenance, safe totals, unique legal moves with canonical
  and provider SAN, rating, opening, history and listed/unlisted counts. Zero/37/100-game pages
  are successful source truth. `stats()` is a temporary compatibility view; each of the three
  learner consumers explicitly owns its existing 100-game sample floor. Frontier calculations
  preserve unlisted mass rather than renormalizing the listed moves.
- Health admission runs inside NEW descriptor execution after coalescing/retention. The registered
  parser validates before success; HTTP status/Retry-After drives shared Lichess backoff. Exact
  retained acquisitions survive outage, failures are not retained, and expired/unknown requests
  are not fabricated as known data. Shared bounds and absolute TTL remain unchanged.
- Arrival-bounded deadlines/cancellation apply to each waiter independently. A caller whose
  deadline has already expired receives a local refusal, not a fabricated provider receipt.
- Actual Node HTTP disconnect now aborts the corresponding Fetch request signal; normal response
  completion does not. The corpus route passes that signal to its shared waiter. Last-waiter
  cancellation aborts upstream work, without establishing a provider failure or poisoning health.

## Able-to-fail controls

The adapter-import control initially failed before the module existed. The real corpus-route
fixture first returned `ASSISTANCE_WITHHELD`: the test needed the existing explicit reveal, not a
wider product ceiling. It now exercises that reveal before acquisition and rejects unauthorized
reads without another upstream call.

The first upstream-cancellation check could pass after the provider timeout, despite missing HTTP
signal wiring. A separate timer-free HTTP handler then reproduced the defect by never receiving
its signal's abort. That original control passes after wiring, as does the authenticated corpus
route's client-disconnect→upstream-abort path; health remains available rather than timing out.

The normal focused gate passes **103 tests/nine files**, including 21 new Explorer/transport
controls: zero/sparse source success, separate consumer floors, exact coalescing/retention,
malformed/illegal/duplicate/inconsistent-count populations, history refusal, request identity,
shared backoff, expiry, independent waiter deadlines, admission cancellation, repertoire frontier
policy/mass, immutable failure-population identity and authenticated production corpus access. The return-frequency service fixture
additionally asserts its own sparse/zero floor. Initial typecheck passed with zero errors/seven
existing warnings; final aggregate and browser results are recorded below before commit.

## Final verification

`make verify` passed: 2,713 software tests/311 files, seven isolated performance tests/four files,
223 real-content tests/23 files, and the complete scaffold/package/release/source/value/governance
checks. All 819 committed capability declarations remain unchanged and match current source;
104 pack/schema documents carry exact requirements, with zero compatibility migration debt in
the 352-document planner population. Semantic validation remains 81 subjects, zero passed
profiles and 38 passed cases. No authored pack bytes changed.

After the final immutable failure-population change and zero-frontier negative,
`make typecheck test-software` passed again: **2,715 software tests/311 files**, zero type errors
and seven existing Svelte warnings. The focused 103 controls also pass.

`make test-browser-ci` passed: **56 smoke, five content, 49 matrix and one packaged-production
test**, one optional live-Maia latency test skipped, zero retries. The matrix includes the 150
exact endgame input cells and unchanged learner/preset/bot/Campaign/Review journeys. These are
local verification results, not a remote CI or release-readiness claim.

## Remaining obligations

The new raw acquisition is not the RFC's unimplemented `derived.explorer.population_summary@1`
or exact played-occurrence join. Existing Inspector/repertoire F1 compatibility identities remain;
their replacement, typed summary wire and zero-consumer retirement census are still required.
Standalone `ExplorerClient`, supplied custom/fixture sources and `LichessCorpusSource` tooling are
not silently migrated or relabelled. D1703–D1709 are not closed globally by this checkpoint.

Maia occurrence, other legacy provider callers, F1 path/availability metadata, independent semantic
validation, owner-use and official content remain open. No capability declaration is widened, no
pack bytes are authored, no protected intent is falsified, and no strict 1.0 milestone promotes.
No handoff, new worktree, publication or remote CI result is claimed.
