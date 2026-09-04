# Safe deployment profiles — second fresh independent buildability review

- **Date:** 2026-09-04
- **Subject:** [[D2214]]–[[D2218]] author repair
- **Verdict:** returned on [[D2614]]–[[D2618]]
- **Production/protected design:** untouched

## What survives

The local/appliance/hosted split, literal LAN-DNS workflow, isolated proxy graph, bounded ingress,
streaming egress and guided operator direction survive. `make safe-deployment-author-repair` remains
green at 8/8 plus TypeScript. Five authority boundaries still prevent buildable implementation.

## Findings

- **[[D2614]]:** the in-memory `DeploymentConfigResult` is claimed as the sole input across renderer,
  Compose and app, but the separate app process receives `TABIYA_*` environment strings. No mounted
  canonical config or verified projection binds the app's profile/origin/cookie/listen values back
  to the renderer's `configDigest`.
- **[[D2615]]:** the proposed “executable config algebra” contains types and `satisfies` expressions,
  not an `unknown`-input parser/compiler. Duplicate keys, union closure, hostname/address/port,
  inode/permission/secret checks, defaulting, canonicalization, digest and typed refusals are all
  asserted by prose regex and cannot fail at runtime.
- **[[D2616]]:** all success `checks` and `services` remain arbitrary arrays and digest/URL/time/id
  fields are unparsed strings. The executable review proves a hosted successful start with no Caddy
  digest, no services, no checks, empty digest suffixes, a non-URL and negative elapsed time
  typechecks cleanly.
- **[[D2617]]:** mounted certificate/key bytes are deliberately absent from `configDigest`, while the
  artifact identity has no certificate-chain or SPKI fingerprint. Rotating bytes at the same path
  changes TLS hostname/issuer/expiry/trust while every identity used for start→probe equality remains
  unchanged.
- **[[D2618]]:** `PROFILE_SWITCH_REFUSED` appears only in the error enum and final criterion. There is
  no transition policy, durable current-profile identity, clean-install distinction or guided
  local↔appliance↔hosted migration. The CLI protocol is explicitly non-persisted, so restart has
  nothing from which to derive the refusal.

## Required repair

Define a canonical cross-process config image and verified projection; implement its exact runtime
compiler; derive profile/operation-specific receipt tuples from sealed live results and parsed
identities; add safe certificate-chain/SPKI identity; and specify or remove the profile-transition
state machine. The next author gate must retain all prior controls and make each negative fail.

## Verification

`make safe-deployment-second-fresh-review` retains the author gate and reproduces 5/5, including a
real TypeScript program proving the impossible hosted-success receipt. No server, Compose, Caddy,
workflow, release, content, archive or protected-design implementation changed.

The RFC remains draft and implementation remains unauthorized pending repair and another genuinely
fresh independent review.
