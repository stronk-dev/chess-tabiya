# D3349 — proposed §6 decimal-option repair, 2026-10-01

Status: bounded amendment accepted by the owner on 2026-10-01 after source/actual-image verification:
"ok, whatever is proper foundation and best practices", in response to the explicit request to
amend the incompatible requirement, implement it here and rerun the complete appliance journey.
Production implementation may proceed under amended §6; no other RFC obligation or per-release
migration approval is discharged. Owner: evidence-foundation. The amendment is written
here directly; it is not an instruction for Marco to relay to another agent.

## Observed incompatibility

[V] The actual native CPU model starts as `maia`, offline, inside the existing 1,536 MiB/no-swap
limit. Its literal handshake advertises `Temperature` and `TopP` as UCI `string` options with
default `1.0`, without min/max. Reproduction: `make maia-option-contract-drill
MAIA_IMAGE_ID=sha256:9e096c8a9511225778fb1485b0c1792e4ea76b9a32e3c30ea81a0dee29f147bc`.
Retained observation: `planning/safe-deployment-profiles/maia-option-contract-2026-10-01.json`.

[V] Pinned upstream `cmd_uci` advertises those strings; `cmd_setoption` applies `float(value)`.
There is no finite advertised upper Temperature bound to recover. Source:
[Maia3 UCI at the pinned commit](https://raw.githubusercontent.com/CSSLab/maia3/1e13597c42d4858b7cfd7cfdae01e297263364b2/maia3/uci.py),
`cmd_uci`, `cmd_setoption`, `sample_from_logits`. At the initial observation, the local patch only
added policy-mass output, not option bounds. The subsequent D3352 precision repair is separately
recorded; it changes reported policy arithmetic, not the options, weights or sampling function.

[V] `rfc/provider-exchange-and-execution.md` §6 demands numeric live bounds;
`apps/server/src/provider-operations.ts#numericOption` requires `type: "spin"` plus min/max.
`FakeEngines`' positive fixture instead invents spin ranges for these options. The new negative in
`apps/server/src/provider-traversal.test.ts` proves the real advertisement is refused **before
any exchange commands execute**. A green synthetic suite never proved actual model compatibility.

[V] Exact-index appliance tree `72c0c07b4204f98446fba0415257c4baca4d847b` passes eight actual
startup/TLS/account/ingress groups, then fails Maia availability. The container remains healthy;
the exchange failure maps generic `provider_unavailable` to `process_exit` in
`ProviderRegistry.settleExchange`. That label does not establish a process crash.

## Accepted bounded change to §6

Replace only the impossible decimal-option admission clause:

1. Preserve request normalization: finite Temperature strictly greater than zero; finite TopP
   in `(0,1]`; no clamping, replacement value, rounding or silent default. Preserve literal
   command spelling, request digests, model/band/width identity and same-exchange capture.
2. Admit the **source-verified pinned Maia3 decimal-string option profile** when the required
   live option names/types and finite positive defaults match that profile. Require the existing
   exact model/version and launched-container capture; generic `string` options are not proof
   of numeric application. Name the profile and its pinned source in the operation contract.
3. Do not advertise nonexistent numeric bounds or encode decimals as integer UCI `spin` values.
   An unknown model/option profile, absent option or malformed/default-nonnumeric string refuses.
   If a separately supported engine really advertises finite bounds, enforce those bounds only
   under its own declared profile, not by projecting them onto pinned Maia3.
4. The response remains a bounded top-k policy page. Temperature/TopP are captured request
   operands, not an invented claim that the candidate policy probabilities are transformed by
   them. No grading, new chess judgement or schema lane. Capability migration/pack rewrites are
   not implicitly authorized: if a frozen authority changes, derive the concrete migration proof
   and obtain the required per-release approval before any restamp.
5. Separately retain a typed configuration/protocol incompatibility when the known profile is
   refused. Never label an option-table incompatibility as an observed process exit or heal
   availability using a fixture, cached delivery or mere `readyok`.

This removes a factually impossible requirement; it does not manufacture a replacement range.
No new product preset/default or Elo calibration ruling is requested.

## Acceptance and implementation exit

- Amend and review §6 against the pinned upstream and actual image, including the unsupported
  profile and missing/nonnumeric option negatives. Acceptance precedes production code changes.
- Replace synthetic-only compatibility coverage with the actual advertisement; keep separately
  labelled synthetic bounds tests only for a contract that truly supports those bounds.
- Boundary controls: Temperature zero/NaN/infinity; TopP zero/above-one/NaN; unknown option type,
  missing option, malformed default, changed model/version, no captured container, concurrent
  generation replacement; assert literal submitted decimal bytes and exact retained request.
- Run `make appliance-drill-staged` without changing its exit. It must commit both real
  registered-bot replies, verify their response-loss retry, rewind/fork/compare, restart/login/
  resume and real served-pack creation. Eight transport checks are not this full success.
- Under that same run retain the server's 512 MiB/no-swap limit and Maia's 1,536 MiB/no-swap
  limit; verify no OOM/restart during play, not merely during startup (D3347).
- Full software contracts, normal process gates and receipts flow back in the implementing
  commit. Published release, owner devices, calibration and held D3330 remain separate.
