# Confidence contract census

Disposable repository-contract instrument for D3391 and D3392. It reads the actual
production catalogue and propagates only the two explicit reported/all-not_applicable
clauses from provider-exchange §2. It has no production caller and never changes a
declaration or emits chess evidence.

Run `make confidence-contract-census-check confidence-contract-census`. The control
expects the currently measured local correction chain and citation contradiction;
passing means the finding is reproduced, not that inheritance is implemented. It stays
outside generic software CI and cannot be used as a product completion gate. The normal
`make confidence-domain-check` separately exercises the implemented closed-domain guard.

The handoff and measured manifest are in
`planning/provider-exchange-and-execution/confidence-census-2026-10-05.md` and its adjacent JSON.
