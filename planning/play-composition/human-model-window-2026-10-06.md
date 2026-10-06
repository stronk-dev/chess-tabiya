# Human-model distribution window — 2026-10-06

Ledger: D3474 (assistance-and-presentation), D3475 (release-engineering).
Authority: frozen `rfc/archive/engine-request-contract.md` §10; the existing
Inspector boundary in `rfc/play-composition.md`. No new source, model, probability,
permission, projection version or chess judgement is introduced.

## Repair and falsifiers

The actual selector retains an out-of-window sampled move after its one full-width
retry, with an insertion rank and no policy mass. The distribution endpoint used
to forward that selection-record marker while omitting selected-move identity.
The client therefore refused the entire otherwise valid page. Two permanent
tests reproduce the error through the real selector, REST handler and closed
web parser, with two different legal sampled moves. Before the repair both fail
at `human-split/candidates/3`, while 28 other server guidance tests pass.

The endpoint now excludes off-window markers as the existing RFC requires for
distributions. Reported ranks and probabilities retain their literal bytes: the
fixture's 0.31/0.24/0.19 window remains 0.74, never normalized to 1. Engine and
requested band stay unchanged. The selected move and retry remain in the separate
selection record; distribution requests neither resample a cached selection nor
commit a move. Client validation is not weakened: an unattributed marker remains
invalid, while partial windows and empty distributions retain their meanings.

The focused Inspector command previously passed the guidance suite to the
software configuration, which excludes that content-tier file. It now explicitly
runs the suite under the established content tier. The new normal
`make human-model-distribution-check` does the same, then runs selection and client
parser controls and typechecking. No tier is moved and no timeout is relaxed.
The existing governance-tier check now inspects literal repository test paths in
the three standard Makefile tier commands. Five wrong-tier controls plus quoted,
continued, correct-tier and integration controls prevent this silent omission
class from returning. All six permanent tier-check tests pass; disposable harness
configs and shell-variable/glob expansion are explicitly outside this guard.

Focused replacement: **30 server guidance tests, 72 selector/client tests**, clean
types with zero warnings. The first replacement assertion expected a second
selection acquisition; the existing cache correctly reused the exact seeded
selection. That test expectation was corrected, not a production cache policy.
An initial sandboxed typecheck could not write pnpm's configured cache; the same
normal Make command subsequently completed with approved filesystem access.
These labelled engine fixtures prove boundary behavior, not real-Maia quality.

## Release checks

`make staged-software-contracts` passes **3,329 software tests/343 files**, seven
isolated performance tests/four files, clean types and all downstream software,
build, release, packaging, source/value/semantic/capability/history/migration and
47 matrix-artifact checks. Exact tested tree:
`793757c2d3a42ee05deaf099214a58762a093801` (parent `2689d82a`). The application,
regression and focused Makefile bytes remain unchanged after this check; the new
governance-only tier guard is verified separately under its owning gate.

`make verify-content` passes **227 tests/23 files**, 92 clearance documents/zero
errors and 104 exact derived capability declarations. All 977 declarations remain
current; neither model-source nor content metadata requires re-stamping.

`make test-browser-ci` passes **145 journeys**: 80 smoke, five content, 59 matrix
and one packaged-default journey; zero retries and the existing optional real-
Maia skip. The matrix publishes all **112 successful unretried states** with
paired geometry and vocabulary records. The packaged default remains playable.
An independent read after packaging verifies all **337 retained files** unchanged:
112 PNG/geometry/vocabulary triples and the original matrix report, digest
`sha256:b6e2d7bd238a6980eb5a1d9130ab7b7117cc3784f73bf6ef1992cb8d77129833`.

D3474/D3475 close on this bounded path evidence. Ledger, work-state, executable
queue, docs, plan, append-only log and anchored roadmap/receipt flow back together;
the final staged governance check follows before commit. Full
A4 fifteen-family positives, D1834, D3309/D3363 source migrations, phone/ceiling/
owner-use and full RFC/milestone/release obligations remain open. No push,
deployment, worktree, unowned edit absorption or protected intent/archive edit.

Final `make staged-process-contracts verify-governance` exits zero. Registers,
source/history, work-state/work-item, anchored roadmap/receipt, intent, docs,
append-only/flow-back and the new six-test focused tier guard all pass. The four
application/regression/focused Makefile files remain byte-equal, both staged and
working, to software tree `793757c2d3a42ee05deaf099214a58762a093801`. Terminal
receipt/log bookkeeping is re-staged for the normal scoped commit with hooks
enabled. The full 1.0 goal remains active; unrelated edits stay excluded.
