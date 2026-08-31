# Safe deployment profiles author repair — 2026-08-31

## Verdict

Author repair complete for [[D2214]]–[[D2218]]. This is not acceptance or implementation. Another
fresh independent buildability review is required; production server, Compose, Caddy, deployment,
workflow and release bytes remain untouched.

## Repaired authority

- One closed `DeploymentConfigV1` file covers local, appliance, hosted ACME and hosted file-cert,
  including safe secret-file references, canonical public origin/config digest and typed refusals.
- Appliance 1.0 has one supported literal-name journey: operator-managed LAN DNS with configured
  address equality, certificate SAN/trust probes and explicit change/removal/re-trust effects.
- Proxied profiles use a closed public/proxy/provider graph. Only Caddy shares the trusted app edge;
  rendered-artifact probes cross host, public-sibling, provider-sibling and forwarded-header bypasses.
- Body limits derive from one method/template/discriminant descriptor graph. Every current unsafe
  semantic operation is partitioned exactly once, Caddy is digest/capability pinned as an outer
  8-MiB guard, and Node remains the authoritative per-route limiter.
- Check, start and probe produce one versioned server-owned receipt binding canonical config,
  artifacts/images, performed checks, public URL, stdout/stderr and exit/signal semantics. A second
  writer/parser or persisted schema requires shared-resource registration first.

## Verification

`make safe-deployment-author-repair` passes eight executable contract arms plus a strict proposed
TypeScript config/receipt algebra with positive and able-to-fail cases. The historical return remains
reproducible; only a new independent review may re-accept the RFC.
