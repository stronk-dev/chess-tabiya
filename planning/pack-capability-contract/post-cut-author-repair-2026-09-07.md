# Pack capability post-cut author repair — 2026-09-07

## Verdict

The bounded repair closes [[D3120]]–[[D3123]] at author tier without restoring the asynchronous job
system to F3. `pack-capability-contract.md` remains draft and implementation remains unauthorized
until one fresh acceptance check reconstructs the smaller contract.

## Exact repair

- **[[D3120]]:** `CapabilityDeploymentBinding` no longer refers to successor-owned operation ids.
  F3 owns the two deployment causes, public reachability, static unsupported handling and recovery;
  `evidence-job-durability.md` owns the closed operation census and per-consumer provider-off effects.
- **[[D3121]]:** the initial sealed 0.27→0.28→0.29→0.30 migration is planned, readiness-checked and
  applied in the implementing commit under [[D3033]]. Later semantic capability migrations remain
  read-only until their [[D996]] per-release ruling.
- **[[D3122]]:** the successor is now an Active RFC, carries the only live storage-migration claim,
  and `concept-registry` follows it. The parent retains only pack-schema lane 0.30.
- **[[D3123]]:** every relevant F3 statement names the sealed population as 86 production packs and
  6 `*.browser.json` schema fixtures. The fixtures still migrate; they no longer inflate a production
  content denominator silently.

## Executable boundary

`make pack-capability-cut-fresh-review` retains each returned counterexample and checks the repaired
living split. `make register-check`, `make status-parity`, `make work-index`, `make work-state` and
`make roadmap-check` must all pass before this author repair can be checkpointed. The subsequent
fresh reviewer must inspect only F3's twelve real dependents; inherited durable-job defects remain
open against the successor and cannot be used to regrow the parent.

Re-running the migration-order dependent also exposed and fixed [[D3125]]: its retained D2665 test
still demanded draft author evidence in `verify-governance` after [[D3057]] created the separate
opt-in `verify-rfc-evidence` tier. That correction changes no product or RFC semantics.
