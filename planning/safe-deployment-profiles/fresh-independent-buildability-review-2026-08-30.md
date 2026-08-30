# Safe deployment profiles — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/safe-deployment-profiles.md` at its first independent review
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make safe-deployment-fresh-review` — 5/5 blocker arms
- **Production status:** untouched; no server, Compose, Caddy, workflow or release implementation is authorized

The local/appliance/hosted split, exact-origin policy, secure-cookie boundary, bounded Node ingress
and streaming egress are the right production scope. Five interfaces remain too open for two
implementers—or CI and the operator guide—to build the same appliance.

## B1 — operator configuration and file-certificate mode are not declared ([[D2214]])

§1 closes `DeploymentProfile` over `local | appliance | hosted`. §5 then calls
`hosted-file-cert` a declared variant, but supplies no discriminant or type. §13 accepts
`CONFIG=<file>` without defining its syntax, closed keys, path semantics, hostname/origin
canonicalization, secret references or typed unsafe-hybrid errors. `[V]`
`rfc/safe-deployment-profiles.md` §§1, 5, 13.

**Required repair:** publish one closed operator-config input union. Define local/appliance/hosted
ACME/hosted file-cert arms, exact allowed keys and unknown-key refusal, canonical origin derivation,
regular-file/permission checks, secret indirection and a typed validation result. Server env,
Compose and Caddy rendering must consume that one parsed value rather than independently parsing
parallel environment folklore.

## B2 — the LAN appliance has no hostname-resolution workflow ([[D2215]])

The appliance matrix requires only an exact hostname and one-time CA trust. §4 explains root
certificate export/install, but never explains how a phone or second computer resolves that literal
hostname to the appliance. Caddy's own TLS documentation confirms that container deployments need
manual root installation and that a custom certificate's SAN must match the site address; neither
operation provides name resolution. `[V]`
<https://caddyserver.com/docs/caddyfile/directives/tls>;
`rfc/safe-deployment-profiles.md` §§2, 4. The conclusion that an unresolved name cannot reach the
configured endpoint is protocol synthesis `[M]`, not a new product preference.

**Required repair:** choose and specify at least one supported appliance resolution path (operator
DNS, mDNS with an exact portability boundary, or explicit hosts provisioning), including setup,
change/removal, collision/refusal and device probes. The core appliance journey must use the exact
configured hostname—not a test-only host-header override—from an owner device that trusts only the
exported root.

## B3 — the proxy-only forwarded-header authority lacks an enforceable network graph ([[D2216]])

§6 trusts forwarded proto/host because the app port is unpublished and Caddy is asserted to be its
only peer. The artifact inventory says “private app network” but declares neither an internal
network nor Caddy's separate public/ACME attachment. Docker Compose attaches services to a shared
default network unless networks are declared; Docker documents that `internal: true` is what creates
a network without external connectivity. `[V]`
<https://docs.docker.com/compose/how-tos/networking/>;
`rfc/safe-deployment-profiles.md` §§4–6, 14.

**Required repair:** define the exact service/network adjacency for appliance and hosted profiles:
an internal edge containing only app and Caddy, and the minimum separate attachment Caddy needs for
published ports and hosted certificate issuance. Specify which services are absent from the trusted
edge. Cross direct host access, an untrusted sibling container and client-supplied forwarded headers
through the rendered artifact—not just static `ports` inspection.

## B4 — body-budget labels are not an exhaustive route contract ([[D2217]])

§8 defines three budget labels and says every production unsafe route appears exactly once, but it
names no current operation/path assignments. At HEAD, `apps/server/src/rest.ts` contains 34 explicit
POST/PUT/DELETE equality checks plus generic run-action routing. Whether an operation is 256 KiB or
8 MiB is a security/product limit, not a mechanical decision an implementer may infer from parser
shape. `[V]` `apps/server/src/rest.ts`; `rfc/safe-deployment-profiles.md` §8.

**Required repair:** publish stable route-operation identities and an exhaustive current mapping to
`none | json_256k | document_8m`, including generic action routers and method-not-allowed paths.
Define how route identity is derived so the census cannot count branches while the adapter uses a
different key. Add crossed fixtures for a document route labelled small, an ordinary command
labelled large, an unclassified new unsafe route and an unavailable parser/body reader.

Caddy currently marks `request_body max_size` experimental and documents that over-limit reads
return 413, so the author must also pin a Caddy release/digest that actually supports the chosen
directive and keep Node as the authoritative per-route bound. `[V]`
<https://caddyserver.com/docs/caddyfile/directives/request_body>.

## B5 — the release deployment receipt is prose ([[D2218]])

Criterion 5 requires Caddy/server digests and config revisions in “the receipt.” §13 says wrappers
validate, render and print a URL, but no receipt interface/version, canonical config digest, output
destination, result arms or exit-code mapping exists. F12-H and CI could therefore consume different
facts while both claim the deployment check passed. `[V]` `rfc/safe-deployment-profiles.md` §13 and
criteria 5, 14, 17.

**Required repair:** define a closed versioned receipt union for check/start/probe outcomes, exact
profile/config/artifact identities, safe public URL, checks performed, timestamps/durations and one
stdout/stderr/exit-code contract. Decide explicitly whether it is a server-owned CLI protocol or a
registered release resource; the present claims-none assertion cannot decide that by omission.

## Re-review order

1. Close the operator config union, appliance naming and exact proxy network graph.
2. Publish the route-budget manifest and deployment receipt protocol.
3. Pin the Caddy capability used by the rendered configs, invert all five arms, then request a fresh
   independent review.

No finding weakens the no-unsafe-hybrid rule, exact-origin enforcement, secure host-only cookies,
bounded application reader or stream-preserving response writer.
