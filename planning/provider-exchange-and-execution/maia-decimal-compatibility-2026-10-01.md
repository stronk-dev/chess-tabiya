# Pinned Maia compatibility checkpoint — 2026-10-01

Owner: evidence-foundation. Contract: `rfc/provider-exchange-and-execution.md` §6.
Owner approval is quoted in `maia-decimal-option-amendment-2026-10-01.md` and precedes the
production change. This is a bounded implementation checkpoint, **not full real-bot completion**.

## Admission, provenance and health

The descriptor now admits the actual pinned Maia3 string advertisements for Temperature/TopP,
not synthetic bounded spin options. Required names are unique; defaults are decimal, finite and
positive; TopP cannot exceed one. Integer Elo/MultiPV ranges remain enforced. The requested model
and actual id/kind/model/source version must match. Admission and captured exchange must share
the established generation; captured option tables are rechecked, and the launched container
artifact is still mandatory. Literal normalized requests, commands, parser tolerances and provider
digest domains do not change. There is no clamp, replacement model or Stockfish fallback.

Missing, duplicate or malformed advertisements fail as `invalid_response`, producing health
`protocol`, not an invented process crash. The positive scripted transport uses the actual option
grammar and is labelled as scripted; the Mock engine stays explicitly Mock. Permanent controls
cover invalid request numbers/defaults/types/bounds, missing/duplicate options, foreign requested
and live model identities, replaced generations, uncaptured containers, changed captured options
and literal submitted decimal commands. Sources: `provider-traversal.test.ts`,
`provider-health.test.ts`, `provider-exchange.test-support.ts` and `mock-provider-engine.ts`.

## Source-policy arithmetic, independently reproduced

`maia-policy-float32-negative-2026-10-01.json` retains two actual offline responses from the
original image. The e4 page's twenty source probabilities sum to **1.0000000014918125**; this
exceeds the existing parser's 1+1e-9 bound. A healthy UCI process/readiness response did not make
that full-width page valid.

The image patch changes only the **reported policy** softmax to double precision and its decimal
emission to round-trip `.17g`. Weights, logits and upstream `sample_from_logits` remain unchanged;
sampling occurs before this reported policy calculation. Do not describe this as a new model,
calibrated Elo, transformed Temperature/TopP policy or new chess judgement.

The source patch now applies with **zero fuzz** against the checksum-pinned archive. The first
strict build caught stale patch context; the context was corrected against literal pinned source,
not admitted by increasing fuzz. `maia-policy-patch-build-negative-2026-10-01.json` is a retained
build-stage failure, with no runtime checks; it is not a receipt for the earlier observed bot
failure. The patch checksum, materials manifest and notice are updated together.

The actual native image build runs `check-policy-mass.py` **after USER maia**, under
`RUN --network=none`, with the baked weight checkpoint and UCI history enabled. Both width-20
e4/d4 pages pass: **0.9999999999999999 / 1.0**. Built image config:
`sha256:6a837c5207dcc3dce8d6acffcae7477e6d061a45a4e34576b88bbc9947536406`;
actual OCI manifest:
`sha256:9277a3e585c656d02fb24a6fb98b3eaece456482c05de64c5fb33502d832460b`.
The release controls also feed the original actual negative and malformed/missing/excess-mass
pages into that validator and require refusal. This proves offline model output, not played bots.

## Full appliance remains red: host storage, not waived checks

`maia-compatibility-storage-negative-2026-10-01.json` retains the final actual appliance attempt
over exact-index tree `38f0148ed0ed15047f6f230b9586c8eab1b8328d`, committed source HEAD
`6cf4016ee01018b0349d798c2c3f2f8e281ebc8e`. It uses the native CPU image and unchanged resource,
network, TLS, runtime-user and isolation templates. Maia loads and stays healthy, but the server
cannot acquire its storage lock on a fresh volume; it reports `MAINTENANCE_LOCKED`.

`docker-storage-diagnostic-2026-10-01.json` records the independent diagnosis with the pinned
Node image. Docker's filesystem has **zero bytes available to ordinary users** (`bavail=0`).
On a **new disposable volume**, uid 1000 SQLite returns `ERR_SQLITE_ERROR`, errcode 13,
**database or disk is full**. The separate overlay `/tmp` control acquires a lock, so it is not
substituted for the failed volume check. No existing learner volume is mounted. Read-only
`docker buildx du --builder tabiya-source-v1` reports 2.679 GB reclaimable cache. Cache removal
requires the requested owner approval; none is assumed. D3353 tracks that named external blocker.
D3354 tracks the production diagnostic defect: non-contention SQLite errors are mislabelled as
maintenance contention. No storage exclusion or closed receipt schema is weakened in this change.

The drill now additionally observes the actual kernel `memory.peak` for server and Maia after
bot/branch/compare and after intentional restart/resume/served-pack creation. Ownership, running
state, no OOM, no automatic restart, exact memory/swap limits and real positive in-envelope peaks
are required. Permanent negatives refuse foreign subjects, raised limits and missing/bad peaks.
**These play-time checks have not passed this final run**: startup stops first. The existing
512/1536 MiB no-swap limits are unchanged. D3338/D3342/D3347 and D3349/D3352 therefore remain open.

The actual test project/volumes and disposable diagnostic resources were removed; no operator
data was removed. The retained failure says `cleanup: owned project and volumes removed`.

## Verification and scope

Use the normal targets: `make staged-software-contracts`, `make release-policy-check`,
`make appliance-drill-staged` and `make staged-process-contracts`. Exact-index verification
excludes held Explorer edits without a managed Git worktree, stash or source reset. The first
complete software rerun caught an existing test's old patch command; its assertion now requires
zero-fuzz verification, and the complete gate is rerun. The final software receipt belongs at
`maia-compatibility-software-2026-10-01.json`; a software pass cannot turn the appliance failure
into a successful play-time receipt.

Final software closeout: **the complete `make staged-software-contracts` passes** at exact-index
tree `272d99c1dc67d88a444664e11a2ef72f1b94d6e9`, with the actual immutable source HEAD retained.
315 software files / **2,755 tests**, four performance files / **seven tests**, warning-free
types, schema/scaffold/packaging, release policy (**63 tests**) and downstream contracts pass.
History retains all 819 committed declarations and all 819 current meanings match; 472
applicability rows and 72 production-reader sites pass. The canonical migration plan over 352
documents reports **zero mechanical edits, judgements, refusals or ledger restamps**. Tracking
closeout and the patch-format Git whitespace attribute follow this tested snapshot; production
source, patch, material and test bytes are unchanged. Final staged process checks cover that
flow-back. This is local evidence, not a claim of remote CI success or full release completion.

Frozen runtime parser/digest and capability meanings remain unchanged. No pack or ledger sidecar
is restamped, and D3330's per-release migration approval remains separate. No protected intent
or archive changes, push, publication, operator deployment, bot calibration, hosted live ACME,
owner-device discharge, full RFC archival or 1.0 milestone completion is claimed.

Next: obtain scoped Docker-cache cleanup approval, rerun the unchanged full actual bot/rehearsal
and memory exit, and repair D3354 under the accepted storage contract. Preserve every original
negative; close rows only on their stated full exit.
