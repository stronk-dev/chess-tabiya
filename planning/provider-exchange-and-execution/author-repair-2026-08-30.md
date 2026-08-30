# Provider-exchange D2056–D2062 author repair — 2026-08-30

## Verdict

The seven seams returned by the fresh independent review are repaired at RFC tier. The RFC remains
draft and implementation remains forbidden until another independent reviewer proves the amended
contract buildable.

## Exact repairs

| row | repaired authority | able-to-fail boundary |
|---|---|---|
| D2056 | Scheduler-private `WeakSet` seals for acquisition receipts, live/retained deliveries and local-domain results; every source adapter asserts the seal | plain, spread, JSON, wrong-operation and double-cast values fail at runtime |
| D2057 | Closed branded constructors for authorized run prefixes, evidence items and run subjects | current/historical, cross-run, cross-head, item-after-head and malformed sequence cases |
| D2058 | Absolute TTL from retained admission; hits update LRU only; `now >= expiry` is a miss | immediately before, exactly at and after expiry, including a pre-expiry hit |
| D2059 | Literal endpoint map, branded request/pending/actual/response/retained/cache identities and live `EngineIdentity` projection | arbitrary endpoint/cache strings and caller-authored Maia runtime digests are unrepresentable |
| D2060 | Five named `providerTraversal*` callables through one built process-local CLI and sealed operator capability | constructor-only reach, public HTTP, unknown operation and forged capability fail |
| D2061 | One F1 payload: the complete sealed `ProviderLocalDomainResult<"syzygy.position@1">` | bare inner fact, structural envelope and crossed request digest fail |
| D2062 | Refuse-only band/temperature/top-p/width/timeout validation using live engine authorities and one literal UCI image | every boundary plus requested/applied/model/generation divergence |

## Verification

- `make provider-exchange-author-repair`: 7/7 pass.
- `make provider-exchange-contract`: 9/9 pass.
- `make provider-exchange-repeat-review`: 7/7 pass.
- `make provider-exchange-final-review`: 9/9 pass.
- `make provider-exchange-fourth-review`: 5/5 pass.
- `make provider-exchange-fresh-review`: fails 7/7, the expected inversion of the superseded return
  reproduction. The historical harness was not weakened or rewritten.

The next action is a new independent buildability review. Passing the author contract is not
acceptance and does not authorize provider implementation.
