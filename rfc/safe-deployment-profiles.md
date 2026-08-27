# RFC: Safe deployment profiles and reverse proxy

- **Status:** draft
- **Author:** Codex on the owner's O13 Choice-C ruling
- **Created:** 2026-08-27
- **Design refs:** `design/02-product-shape.md` deployment axis; `design/03-product-breadth.md` B8
- **Exploration gate:** O13 / D616 selected the stronger appliance floor; R18/F12-A measured and routed D607 as ready to draft
- **Depends on:** `storage-backup-recovery.md` for database maintenance exclusion; `rfc/archive/identity-and-authorization.md`
- **Parent / amends:** current `compose.yaml`, release Compose template, Node HTTP adapter, and identity cookie configuration
- **Supersedes / superseded by:** —
- **Planning:** `planning/safe-deployment-profiles/` (once implementing)

```tabiya-claims
none
```

## Summary

Tabiya 1.0 ships three explicit network postures instead of one environment-variable-shaped
Compose file: loopback-only `local`, LAN `appliance` with a locally administered TLS authority, and
Internet-facing `hosted` with publicly trusted TLS. `local` is the zero-configuration default and
cannot leave loopback. `appliance` and `hosted` put a pinned FOSS Caddy proxy in front of an
unpublished application port, force secure host-only cookies, bind every browser mutation to one
configured origin, and provide bounded request/response transport behavior.

The profile is a server-owned safety contract, not a UI setting. Learners never choose it in the
web app. The operator chooses one documented launch command, supplies only that profile's required
inputs, and receives a startup refusal when the inputs describe an unsafe hybrid.

## Motivation

R18 reproduced two opposite failures. Root Compose publishes plain HTTP on every interface and
forces insecure cookies. The digest-pinned release Compose also publishes the application directly,
but leaves secure cookies enabled, so the documented HTTP URL cannot sustain login. Neither file
provides TLS termination, a reverse-proxy trust boundary, an origin policy, or a complete supported
topology. D607 records the deployment defect.

The Node adapter adds two transport defects that a proxy cannot fully cure. `requestFromNode`
buffers an unlimited request body before routing (D1846), while `writeNodeResponse` converts every
response stream back into one complete `ArrayBuffer` before sending it (D1847). A safe profile must
bound both the public edge and the application server, and it must prove streaming through the
actual release proxy.

This RFC uses standards and primary implementation documentation rather than invented proxy rules:

- HTTP authority/Host is security-sensitive and must be validated: RFC 9110 §7.2/§17,
  <https://www.rfc-editor.org/rfc/rfc9110.html>.
- Node 24 exposes strict parsing, header size, request/header timeouts, and Host requirements on
  `http.createServer`: <https://nodejs.org/download/release/latest-v24.x/docs/api/http.html#httpcreateserveroptions-requestlistener>.
- Caddy supports automatic HTTPS, internal issuance, reverse-proxy streaming/upgrade behavior, and
  request-body limits: <https://caddyserver.com/docs/automatic-https>,
  <https://caddyserver.com/docs/caddyfile/directives/tls>,
  <https://caddyserver.com/docs/caddyfile/directives/reverse_proxy>, and
  <https://caddyserver.com/docs/caddyfile/directives/request_body>.
- SameSite is only partial CSRF defense; browser Origin and Fetch Metadata expose the stricter
  origin boundary: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie>
  and <https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Fetch_metadata>.

### Scope

This RFC owns:

1. the three supported deployment profiles and their startup invariants;
2. a pinned Caddy edge for appliance/hosted deployments;
3. exact public-origin, Host, cookie, CSRF, and forwarded-header behavior;
4. ingress size/time budgets and streaming egress in the Node adapter;
5. TLS/certificate, secret, health/readiness, and proxy-restart behavior;
6. Compose/Make/operator documentation and production-boundary verification.

### Non-goals

- Kubernetes, Nomad, systemd units, cloud-vendor load balancers, a CDN, or a second proxy hop;
- federation, public matchmaking operations, SaaS billing, or an operator/admin account;
- OAuth/provider token custody beyond mounting already specified secrets;
- DDoS absorption, a web-application firewall, geo routing, or multi-node high availability;
- inventing WebSocket/SSE product features. The proxy is compatible with them, but a feature RFC
  must still register and test any real streaming route;
- backup/restore of the SQLite database (F12-C) or signed/SBOM images (F12-E).

## Specification

### 1. Closed profile vocabulary

The server parses one required production value:

```ts
type DeploymentProfile = "local" | "appliance" | "hosted";

interface DeploymentBoundary {
  readonly profile: DeploymentProfile;
  readonly listenHost: string;
  readonly listenPort: number;
  readonly publicOrigin: string;
  readonly behindBundledProxy: boolean;
  readonly secureCookie: boolean;
}
```

Development tests may construct this value directly. A production process may not infer profile
from `NODE_ENV`, `TABIYA_COOKIE_SECURE`, forwarded headers, or whether a Caddy container happens to
be reachable. `NODE_ENV` continues to govern development-only code; it is not a deployment safety
switch.

The profile vocabulary is local to the server/deployment contract, not a shared-resource register
claim. It is not persisted, exported in a schema, or independently writable by another RFC. The
public `/capabilities` response may report the active profile as deployment metadata only after the
same server value is compiled into that response; it may not accept or change it.

### 2. Profile matrix

The unit in this table is a supported public topology; total **3**. No fourth combination is
supported by assembling flags.

| Profile | Public endpoint | Application socket | TLS/cookie | Required operator input |
|---|---|---|---|---|
| `local` | `http://127.0.0.1:${TABIYA_PORT:-3000}` | host-published on IPv4 loopback only | HTTP; `tabiya_session`, HttpOnly, SameSite=Strict, no Secure | none |
| `appliance` | `https://<exact LAN hostname>` | Compose-internal only | Caddy internal CA; `__Host-tabiya_session`, Secure, HttpOnly, SameSite=Strict | exact hostname plus one-time CA trust on each device |
| `hosted` | `https://<exact public hostname>` | Compose-internal only | Caddy automatic public TLS; `__Host-tabiya_session`, Secure, HttpOnly, SameSite=Strict | exact hostname, DNS to host, reachable 80/443, ACME contact |

All profiles serve the same application image and learner features. A profile changes transport
and operational trust only. Core journeys never require `hosted` or an external provider.

### 3. Local profile

`make up` becomes the supported local profile and publishes exactly
`127.0.0.1:${TABIYA_PORT:-3000}:3000`. It does not bind `0.0.0.0`, `::`, a LAN address, or a second
port. Documentation opens exactly the configured `127.0.0.1` origin rather than alternating with
`localhost`, because origin equality includes host and port.

The server receives:

```text
TABIYA_DEPLOYMENT_PROFILE=local
TABIYA_PUBLIC_ORIGIN=http://127.0.0.1:<published-port>
TABIYA_LISTEN_HOST=0.0.0.0   # inside its private container namespace only
TABIYA_COOKIE_SECURE=false
```

The external loopback constraint is enforced in the rendered Compose/packaging boundary, because a
process inside a bridged container cannot truthfully infer the host-side publish address. The server
independently refuses `local` when `publicOrigin` is not HTTP loopback or when cookie security is
true/unspecified. Running the raw image with a caller-authored `docker -p` mapping is not a supported
deployment command; the image labels and docs point to the validated Compose artifact. No env flag
can declare an arbitrary host publish safe.

Local responses omit HSTS. They retain every other applicable application security header. A
warning on startup states that the profile is single-host only; it is not emitted on learner pages.

### 4. Appliance profile

The appliance profile is the supported offline/LAN multi-device topology:

- one pinned official Caddy image publishes 80/443;
- HTTP redirects to HTTPS;
- the application service has `expose: 3000` but no host `ports` entry;
- Caddy issues for one exact operator-supplied hostname using `tls internal`;
- Caddy's `/data` and `/config` are named durable volumes;
- a supported command copies the public root certificate out for device trust;
- the guide covers trust installation/removal for the owner-tested desktop and mobile platforms,
  and makes “Not private” a failed setup rather than a click-through instruction.

Caddy documents that a container cannot automatically install its internal root into client trust
stores; the root must be copied and installed. The private CA key never enters the application
image, account export, database backup, logs, or browser download. Caddy state is operational secret
state. Losing it requires generating a new authority and explicitly re-trusting clients; the docs
state this recovery effect. A later encrypted operator-state backup may preserve it, but database
restore does not claim to.

The hostname is literal and closed at render time. Wildcards, catch-all HTTPS, on-demand TLS, IP-only
certificates, arbitrary Host forwarding, and a profile that silently falls back to HTTP are refused.

### 5. Hosted profile

The hosted profile uses the same Caddy/app network boundary, but Caddy obtains and renews a
publicly trusted certificate for one exact hostname. The rendered configuration requires DNS,
reachable ports 80/443, an ACME contact, and durable Caddy state. It may accept an operator-mounted
certificate/key pair instead of ACME only through the declared `hosted-file-cert` variant; that
variant has the same origin/cookie/proxy behavior and validates that both secret files exist and are
readable before startup.

No CDN or upstream proxy is supported in 1.0. Caddy trusts no incoming `X-Forwarded-*` chain from
the public client and overwrites the values it sends to the app. Adding Cloudflare, an ingress, or
another reverse proxy requires a follow-up trust-chain contract; “private ranges” is not a safe
generic default for a public client-IP authority.

### 6. Public origin and proxy trust

`TABIYA_PUBLIC_ORIGIN` parses as one canonical origin with:

- `http` only for `local`, `https` only otherwise;
- no username/password, path other than `/`, query, fragment, wildcard, trailing dot, or default
  port spelling that canonicalizes to different bytes;
- an exact loopback host for `local` and an exact DNS hostname for appliance/hosted.

Every request must carry the expected HTTP Host/`:authority`. A mismatch returns 421 before static
or API routing. In proxied profiles, the application additionally requires
`X-Forwarded-Proto: https` and `X-Forwarded-Host` equal to the configured public authority. Those
headers are trusted only because the application port is unpublished on the isolated Compose
network and the bundled Caddy service is the only peer. Security decisions never use
`X-Forwarded-For`; it is diagnostic until a future rate-limit/audit contract gives it an exact
trusted-hop model.

Caddy passes the original Host, overwrites forwarded proto/host/for, and strips any client-supplied
`Forwarded` header. The app constructs absolute links only from `publicOrigin`, never from request
headers. Direct access to the internal application socket is an unsupported topology and is
mechanically unreachable from the host in appliance/hosted profiles.

### 7. Browser mutation/origin policy

The application sends no permissive CORS headers. For every unsafe method (`POST`, `PUT`, `PATCH`,
`DELETE`), including unauthenticated register/login and public-token join:

1. `Origin` is required and must equal `publicOrigin` byte-for-byte after URL canonicalization;
2. if `Sec-Fetch-Site` is present it must be `same-origin`; `same-site`, `cross-site`, and `none`
   are refused for unsafe requests;
3. form and JSON content types remain endpoint-declared; a “simple” form cannot bypass the check;
4. failure returns typed 403 `ORIGIN_REFUSED` before reading/authenticating the request body.

Safe top-level `GET`/`HEAD` navigation remains reachable from links/bookmarks, including invitation
landing pages. SameSite=Strict remains defense in depth, not the sole CSRF mechanism. Hosted and
appliance cookie names use the `__Host-` prefix, omit Domain, and keep Path `/`; local uses the
unprefixed cookie because it is intentionally HTTP. Session cookies are not portable across
profiles or origins.

### 8. Request budgets

The Node server is the authoritative limit; Caddy's matching global 8 MiB cap is an outer guard.
The application declares a closed route budget registry:

```ts
type RequestBodyBudget = "none" | "json_256k" | "document_8m";
```

- `none`: every GET/HEAD and unsafe route that accepts no body; any non-empty body is refused.
- `json_256k`: ordinary commands, identity, run mutations, marks, classroom/social operations.
- `document_8m`: explicit PGN import, account/pack/shape/repertoire document operations whose
  existing parser can legitimately exceed 256 KiB.

Every production unsafe route appears exactly once in the registry. A new route cannot compile or
pass the route census without a budget. `Content-Length` above the budget returns 413 before body
allocation. Missing/chunked length is counted incrementally and aborted at `limit + 1`; the adapter
does not concatenate chunks until the bounded reader succeeds. Decompressed request bodies are not
accepted by the application in 1.0, preventing a compressed-size bypass.

The Node server uses strict HTTP validation and explicit bounds: 16 KiB maximum headers, 10 s to
complete headers, 30 s to complete the request body, 5 s keep-alive idle, and no generic application
response timeout. Long operations own their own cancellation/deadline contracts. Caddy uses
compatible edge timeouts and an 8 MiB `request_body max_size`; app limits still pass when Caddy is
bypassed in focused tests.

### 9. Streaming responses and upgrades

`writeNodeResponse` writes headers, then pipes `Response.body` to `ServerResponse` with backpressure
and cancellation. It does not call `arrayBuffer()` on a non-null body. A client disconnect cancels
the web stream and closes any underlying export cursor/provider operation. HEAD/204/304 responses
never write a body.

Caddy uses its normal streaming reverse proxy without request/response buffering. It preserves
chunked responses and protocol upgrades. The current application registers no WebSocket or SSE
route, so an upgrade attempt remains a deterministic refusal rather than a fake success. The
deployment test includes a disposable upstream through the exact rendered Caddy config to prove
WebSocket upgrade and event-stream first-byte behavior; the first product RFC adding either route
must add its own release-container journey.

### 10. Security and cache headers

The application owns headers that must also apply locally:

```text
Content-Security-Policy: default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
```

The inline script in the current invitation join page must move to a same-origin static module or
receive a per-response nonce generated and inserted by the application; `'unsafe-inline'` is never
admitted for `script-src`. CSP rollout is tested against every production route and browser journey,
not inferred from header presence.

Caddy adds `Strict-Transport-Security: max-age=31536000` only for appliance/hosted HTTPS responses;
it deliberately omits `includeSubDomains` and preload because the operator's parent domain is not
Tabiya's authority. API/auth/account/export responses remain `no-store`. Hashed static assets may be
immutable; HTML/app-shell and service-worker/update metadata remain revalidated according to F12-G.

### 11. Secrets and rotation

Secrets enter through Compose secrets/read-only files where supported; environment variables are
allowed only for non-secret selectors and local development. Provider tokens, external voice keys,
TLS private keys, Caddy CA keys, and session material never appear in images, rendered Compose,
health/capability responses, logs, account exports, backup manifests, or browser-visible config.

The server accepts `_FILE` forms for provider secrets and refuses simultaneous direct + file forms.
Secret files must be regular, non-symlink, owner-readable files. Rotation takes effect after an
explicit service restart unless the owning provider contract specifies hot reload; docs state that
effect per secret. Caddy manages its own ACME/internal keys in its private volume; only the public
root/certificate chain may be exported by the appliance trust command.

### 12. Health, readiness, and failure behavior

- `/healthz` is liveness: the HTTP event loop responds with no provider or database mutation.
- `/readyz` is readiness: storage is current/verified, static shell is loadable, and application
  construction completed. Optional provider loss belongs to F12-D and does not make core unready.
- Caddy's upstream health uses `/readyz`; public `/healthz` and `/readyz` reveal only status and
  immutable release revision, not configuration, paths, table counts, or provider secrets.
- TLS/certificate/origin/profile validation failure prevents the proxy/app from serving learner
  traffic. There is no HTTP fallback.
- A proxy restart preserves established application state. Ordinary requests retry through browser
  behavior; no mutation is automatically replayed by the proxy. Streaming reload behavior uses a
  bounded close delay only after a real streaming product route exists.

### 13. Operator surfaces

The release publishes:

```text
compose.local.yaml
compose.appliance.yaml
compose.hosted.yaml
Caddyfile.appliance
Caddyfile.hosted
env.appliance.example
env.hosted.example
```

Supported wrappers are:

```text
make up                         # local, zero required settings
make up-appliance CONFIG=<file>
make appliance-ca-export OUT=<absolute-file>
make up-hosted CONFIG=<file>
make deployment-check PROFILE=<local|appliance|hosted> CONFIG=<file-if-required>
```

Wrappers validate configuration, render Compose, run `caddy validate`, print the exact public URL,
and fail before starting on missing/unsafe values. They do not write secrets into generated files.
The docs provide one guided path per profile, a support matrix, CA trust/remove steps, DNS/port
prerequisites, backup interaction, update/rollback links, and exact diagnostics. Advanced proxy
customization is explicitly unsupported rather than exposed as dozens of learner settings.

### 14. Code-site inventory

The unit is a production or verification boundary consuming the profile. Total **15**; acceptance
criterion 15 derives and checks the same set.

| # | Boundary | Required change |
|---:|---|---|
| 1 | `apps/server/src/config.ts` | parse/validate the closed deployment boundary and secret-file inputs |
| 2 | `apps/server/src/main.ts` | listen on declared host only after profile/storage preflight |
| 3 | `apps/server/src/rest.ts` | Host/origin policy, route budget registry, bounded request reader, streaming response writer |
| 4 | `apps/server/src/identity.ts` | profile-correct host-only cookie name and attributes |
| 5 | `apps/server/src/application.ts` | readiness and application-owned security headers |
| 6 | `apps/server/Dockerfile` | immutable revision, explicit entrypoint, no public proxy assumptions |
| 7 | `compose.yaml` | safe loopback-only default |
| 8 | `deploy/compose.appliance.template.yaml` | internal-CA proxy, private app network, durable Caddy state |
| 9 | `deploy/compose.hosted.template.yaml` | public/file TLS proxy, private app network, durable Caddy state |
| 10 | `deploy/Caddyfile.appliance` | exact hostname, internal TLS, headers/body/proxy behavior |
| 11 | `deploy/Caddyfile.hosted` | exact hostname, public/file TLS, headers/body/proxy behavior |
| 12 | `Makefile` | thin profile validation/start/CA-export commands |
| 13 | `tools/verify-packaging.mjs` | image/profile/config/secret/public-port static assertions |
| 14 | `.github/workflows/verify.yml` and release workflow | direct + proxy production-boundary jobs and rendered artifacts |
| 15 | `docs/deployment.md` | one canonical guided topology/diagnostic/security contract |

## Deviations from design

None. O13 requires both a reproducible self-hostable appliance and hosted multi-user topology, with
no core learner journey depending on hosted infrastructure. This RFC keeps loopback local use as
the zero-configuration default, makes LAN appliance TLS operationally explicit, and refuses the
current unsafe all-interface HTTP hybrid.

## Acceptance criteria

1. The local profile starts from clean checkout with no config, reports the exact loopback URL,
   completes register/login/rehearsal, and is unreachable through the host's non-loopback address.
2. Static Compose inspection and a live socket probe fail if local publishes on `0.0.0.0`, `::`, a
   second interface/port, or enables a secure cookie over its HTTP origin.
3. Appliance profile starts with a generated test hostname/internal CA, redirects HTTP to HTTPS,
   exports the public root, and completes the core journey from a client trusting only that root.
   The same client without the root fails TLS and is never told to click through.
4. Hosted profile starts behind Caddy with a test public/file certificate, publishes only Caddy,
   redirects HTTP, validates the chain/hostname, and completes login plus a two-account shared run.
5. Both proxied profiles prove the app port has no host binding and cannot be reached from the host;
   Caddy and server image digests/config revisions appear in the receipt.
6. A matrix of missing/wrong Host, wrong forwarded proto/host, cross-origin and same-site-different-
   origin unsafe requests is refused before body/auth processing; exact-origin requests pass. Safe
   cross-site top-level invitation GET still renders, and no response enables CORS.
7. Cookie fixtures prove the exact local and HTTPS cookie names/attributes, host-only scope, no
   Domain, SameSite=Strict, HttpOnly, and Secure only where required. Sessions do not cross origins.
8. The route-budget census covers every production route exactly once. Direct Node and Caddy paths
   both return 413 for declared overages; chunked `limit + 1`, false Content-Length, compressed body,
   slow headers, and slow body are able-to-fail fixtures with bounded memory.
9. A streaming export fixture proves response headers and first chunk reach the client before the
   delayed final chunk exists, peak adapter buffering stays within a fixed small bound independent
   of response size, and disconnect cancels the source.
10. Through the exact rendered Caddy config, a disposable event stream flushes its first event and a
    WebSocket echo upgrades successfully; the production app itself still refuses undeclared routes.
11. CSP/security-header browser coverage includes every route family and the invitation join flow;
    zero CSP violations occur, inline script execution is impossible, and local omits HSTS while
    both HTTPS profiles set the exact HSTS value.
12. Secret sentinels in provider files, TLS keys, Caddy state, and session storage appear in none of
    the built image layers, rendered Compose/config, logs, health/capabilities, account export, or
    backup manifest. Direct + `_FILE` configuration is refused.
13. `/readyz` stays unavailable until storage/application/static-shell readiness, exposes no
    sensitive details, and is what Caddy checks. Optional Maia/provider loss does not conflate core
    readiness with F12-D capability health.
14. `caddy validate`, `docker compose config`, cold start, restart, certificate-state persistence,
    server/proxy failure, and profile-switch refusal pass on the built release artifacts.
15. A derived census is set-equal to all 15 code-site boundaries in §14 and fails on an unclassified
    public port, mutable/unpinned proxy image, new unsafe route without a body budget, or direct use
    of request Host/forwarded headers as absolute-URL authority.
16. Browser smoke exercises local plus both proxied profiles at desktop and phone widths; it uses
    the actual TLS/origin/cookie boundary, not a direct handler substitute.
17. `make verify` remains deterministic and green; container/TLS/network tests are one separately
    named production-boundary tier with retained diagnostics and no latency micro-thresholds.
18. Canonical docs make the safe default and supported topology obvious, include CA trust removal,
    secret rotation, backup/recovery interaction, and an explicit unsupported-proxy message.
19. D607, D1846, and D1847 close only when criteria 1–18 pass and the implementation commit updates
    the ledger plus append-only exploration log.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Owner-device appliance validation: desktop plus phone/tablet trust installation, login, run, restart, and trust removal | `planning/platform-alignment/release-platform/` F12-H | owner-use receipt with device/browser/OS and failures | |
| D2 | Run local/appliance/hosted journeys on final digest-pinned release artifacts and publish the supported-topology matrix | `planning/platform-alignment/release-platform/` F12-H | final release proof and exploration-log entry | |

## Open questions

No owner/product question remains. Independent review must attack the Caddy trust boundary, browser
origin policy, internal-CA recovery disclosure, legitimate request-size census, and the claim that
the exact rendered config streams/upgrades. It may replace Caddy only with an equally pinned FOSS
component that preserves all three workflows and criteria; doing so is an author amendment, not an
implementation detail.

## Changelog

- 2026-08-27: drafted from O13/F12-A, D607, and the current release-platform audit; added the
  source-reproduced unbounded-ingress and defeated-streaming defects D1846/D1847 to the same
  production transport boundary.
