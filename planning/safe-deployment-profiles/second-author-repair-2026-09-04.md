# Safe deployment profiles — second author repair

**Date:** 2026-09-04

**Scope:** bounded RFC/contract repair for [[D2614]]–[[D2618]]. No production server, config,
Compose, Caddy, workflow, release, storage, schema, client, content, archive or protected-design
byte changed.

## Result

The returned deployment contract is repaired around one authority from operator input through live
receipt:

- one canonical compiled image is mounted read-only and reparsed/attested by the app process;
- an executable unknown-input compiler rejects duplicate/unknown keys and invalid union, file,
  hostname, address, port, secret, certificate and canonicalization inputs;
- check/start/probe compile exact profile-specific check, service and artifact tuples from sealed
  live results and parsed operation/digest/URL/time identities;
- proxied live identities include leaf, SPKI and chain fingerprints plus exact hostname/validity;
  and
- a durable operational state distinguishes clean initialization, same-origin restart and explicit
  crash-resumable profile/origin migration, invalidating sessions and public tokens before ingress.

The repair also corrects the check lifecycle: static `check` does not claim an ACME/internal
certificate that cannot exist until start, while proxied `start` and `probe` require the observed
certificate identity.

## Executable evidence

`make safe-deployment-second-author-repair` runs:

- the prior 8/8 config, DNS, network, route-budget and receipt controls;
- 5/5 behavioral groups for [[D2614]]–[[D2618]]; and
- strict TypeScript over the original proposal and repaired model.

Negative arms alter mounted image bytes, duplicate/unknown config keys, file authority, profile
relations, sealed check provenance/order, TLS hostname/validity, success tuples and profile-
transition order. Each fails for the named reason.

## Remaining boundary

This is author repair, not acceptance or implementation. Another genuinely fresh independent
review must rederive cross-container authority, parser closure, receipt relations, TLS identity and
crash recovery against the RFC and current server/Compose boundaries. F12-A, [[D607]], [[D1846]] and
[[D1847]] remain held until acceptance and production implementation.
