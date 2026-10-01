# Actual appliance closeout — resume, model lifetime and storage diagnostics

## Implemented boundaries

D3355: the resume instrument uses the existing production `/runs/:id/graph` response,
not an invented bare run endpoint. It compares persisted edge identities/FEN/moves,
branches and active cursor. Controls refuse the old `.run` shape and same-count corruption.
The real journey also requires observed Maia availability and another registered bot reply
and idempotent retry after application restart.

D3356: that stronger journey first failed because application shutdown forwarded its UCI
`quit` to the container-owned Maia child. The bridge now frames complete client commands
with a 65,536-byte line bound; `quit` releases only that connection. Only sidecar shutdown
terminates the shared child. Fragmented/coalesced commands, CRLF/whitespace, a non-command
`quit` operand, oversize refusals and an actual TCP reconnect keeping the same child PID
are permanent controls. The TCP fixture is explicitly not model inference; the Docker
journey below is actual inference. Model/source/weights/sampling and parser/digests are unchanged.

D3354: lock initialization/acquisition now distinguishes SQLite busy/locked primary codes
(including extended codes) from disk/I/O/permission/other failures. Only the former emit
refused/MAINTENANCE_LOCKED; the latter emit failed/INTERNAL_ERROR. Failed initialization
closes any opened database; directory creation is inside the same failure boundary.
The closed receipt schema and exclusion mechanism are unchanged. Deterministic numeric
classification controls and a real unopenable path complement existing real contention tests.

## Real journey and retained negatives

`make appliance-drill-staged` passes all 16 check groups over native linux/arm64 source:
TLS/CA/ingress/account, registered Maia replies and retries, rewind/fork/compare, intentional
server restart, secure login, exact durable graph resume, another real bot reply/retry,
actual served-pack creation and both kernel memory observations. No mock, TLS bypass,
memory enlargement or intentional Maia restart is used.

The final captured journey includes the storage repair; source HEAD is `e41c1a95`, exact
Git-index tree `0080bbd85faf913487fd3b911a3011072551f520`. The subsequent fixture-only change
makes PID reporting opt-in so existing protocol tests retain their exact response; it changes
no deployed application/worker behavior. The complete final software receipt independently
records the tested tree. Neither receipt includes held unstaged Explorer source.

Server peaks: 514,506,752 bytes before restart and 465,010,688 after restart/resume/pack,
each below 536,870,912; Maia peak remains 295,727,104 below 1,610,612,736. Both observations
have OOM=false and automaticRestarts=0. These are one journey's peaks, not steady-state
capacity or the separate release memory gate.

- Full positive: `maia-resume-shutdown-appliance-2026-10-01.json`.
- Original shutdown negative: `maia-client-shutdown-negative-2026-10-01.json`.
- Original resume/disk negatives remain in their earlier files.
- Final normal software verification: `maia-resume-shutdown-software-2026-10-01.json`.

The first full software attempt caught a new fixture PID line changing an existing expected
UCI response. The new opt-in fixture flag repairs that regression, rather than changing the
old assertion. Release-policy checks pass 66/66; docs-index checks pass. The final software
gate and staged process contracts must pass before this checkpoint commits.

Final `make staged-software-contracts` passes over exact index tree
`74353d28a49ec421b1e1de426b8c1814831b83f6`: 315 files / 2,757 software tests,
4 files / 7 performance tests, zero type errors/warnings, scaffold/packaging/hooks,
66 release-policy tests and every downstream software contract. All 819 committed
capability declarations remain retained and match current meanings; the 352-document
migration plan has zero mechanical/judgement/refusal entries and zero ledger restamps.
The held Explorer integration is excluded rather than used to bless changed declarations.

Final `make staged-process-contracts` passes: register C1–C8, lifecycle P1–P7,
zero unrouted/untriaged live rows, roadmap R1–R10 and its sealed index receipt,
plus protected-intent parity. These process checks do not discharge the separate
release/publication/owner-use obligations.

## Completion boundaries

D3338/D3342/D3347/D3349/D3352/D3355/D3356 discharge their narrow actual source-journey exits;
D3354 owns only diagnostic classification. D3353 was already discharged by owner cleanup.
Provider exchange, deployment and distribution RFCs remain implementing, not archived.
No whole capability or 1.0 milestone closes. Publication/rights, steady-state memory,
owner-device/hosted journeys and all other existing discharges stay separate.

D3330's Explorer integration and measured per-release migration remain held pending approval.
No metadata/pack/sidecar restamps, protected intent/archive edits, managed worktree, broad
staging, cache pruning, push, publication or operator deployment occurred. The drill removed
only its own UUID-owned project and disposable volumes.
