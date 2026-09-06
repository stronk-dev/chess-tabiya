# RFC: Safe deployment profiles and reverse proxy

- **Status:** **draft — fourth fresh independent review returned the third repair on
  [[D2978]]–[[D2985]].** TLS, deployment checks, readiness, ingress and mounted-image authority
  remain caller-mintable; migration edits look-alike tables and can bless existing storage; receipt
  parsing does not re-establish the closed profile union. `make safe-deployment-fourth-fresh-review`
  retains the complete chain and passes 8/8 executable counterexamples plus strict TypeScript. A
  bounded fourth author repair and another genuinely fresh review precede acceptance or production
  implementation.
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

## Second author repair (2026-09-04)

The five returned seams are repaired as one cross-process deployment authority:

1. **[[D2614]]:** the compiler emits one RFC-8785-canonical, read-only
   `/run/tabiya/deployment.json`. Compose, Caddy rendering, the application and receipts consume or
   attest that exact image and its digest; profile/origin/listen/cookie environment strings are
   deleted as authorities.
2. **[[D2615]]:** `compileDeploymentConfig` parses UTF-8 JSON with duplicate-key rejection, closes
   each union arm, validates the config and secret-file inode/permission observations, applies
   defaults and emits canonical config/image digests or a typed refusal.
3. **[[D2616]]:** operation ids, SHA-256 identities, origins and elapsed time are runtime parsed.
   Check/start/probe have exact profile-specific check and service tuples compiled from privately
   sealed live results; empty, forged, reordered or profile-impossible success cannot be emitted.
4. **[[D2617]]:** successful proxied start/probe receipts carry the observed leaf, SPKI and chain
   SHA-256 identities plus exact SAN hostname and validity interval. Rotation changes the live
   artifact identity without exposing private-key bytes.
5. **[[D2618]]:** `/data/.tabiya-deployment-state.json` distinguishes empty-database initialization,
   same-origin restart and explicit origin/profile migration. Migration is journalled and invalidates
   authenticated sessions then public tokens before the target may bind public traffic.

`make safe-deployment-second-author-repair` retains 8/8 prior author controls and passes 5/5 new
behavioral groups plus strict TypeScript. Exact receipt:
`planning/safe-deployment-profiles/second-author-repair-2026-09-04.md`. This is author evidence, not
acceptance or implementation; another genuinely fresh independent review remains required.

## Third fresh independent return (2026-09-05)

The second repair closes the five seams it names, but the complete buildability pass returned it on
six authority boundaries. [[D2730]] shows the mounted-image loader accepts profile-impossible
canonical boundary tuples. [[D2731]] shows sealed checks under one UUID remain detached from the
config, image, artifacts, origin and profile they supposedly prove. [[D2732]] shows the executable
success object omits the declared receipt protocol/union and accepts mutable release identity and
unsafe elapsed time. [[D2733]] shows certificate fingerprints are accepted without a sealed
handshake/trust/clock proof. [[D2734]] shows deployment readiness bypasses the canonical storage
readiness response this RFC depends on. [[D2735]] shows the advertised crash-resumable migration is
a caller-authored in-memory state/effect progression. Exact receipt:
`planning/safe-deployment-profiles/third-fresh-independent-buildability-review-2026-09-05.md`.

## Third author repair (2026-09-05)

The six returned seams are repaired as one release authority rather than six independent checks:

1. **[[D2730]]:** mounted canonical bytes are accepted only when their SHA-256 equals the expected
   renderer identity and every field matches the complete local/appliance/hosted compiler relation.
2. **[[D2731]]:** one privately sealed deployment subject owns operation, profile, canonical config
   and image, immutable artifacts and compiler-derived public origin. Every passed check is sealed
   to that exact subject; success cannot combine checks, origins or artifacts across subjects.
3. **[[D2732]]:** the executable receipt is the declared versioned protocol, including succeeded,
   refused, failed and cancelled arms, exact checks/services/artifacts, immutable 40-lower-hex
   application revision, safe elapsed time and canonical unknown-input verification.
4. **[[D2733]]:** proxied live authority is constructed only from an exact-host handshake whose
   leaf/SPKI/chain/trust-root digests, chain-validation result, singleton SAN and canonical UTC
   validity window all pass at the observed instant. Structural clones are not live authority.
5. **[[D2734]]:** readiness is one sealed join between canonical storage body
   `{representativeData:true,status:"ready",storageVersion}` and the exact deployment revision and
   compiled-image attestation of the same subject.
6. **[[D2735]]:** profile migration uses the fixed operational state file with exclusive temporary
   creation, file fsync, rename and parent fsync; session and token effects commit in separate
   idempotent SQLite transactions; restart reparses the full from/to journal; target readiness and
   the ingress switch must both be sealed to the intended target before atomic active publication.

`make safe-deployment-third-author-repair` retains the first and second author gates and passes six
new able-to-fail groups plus strict TypeScript. Exact receipt:
`planning/safe-deployment-profiles/third-author-repair-2026-09-05.md`. This is author evidence, not
acceptance or production implementation; another genuinely fresh review remains mandatory.

## Fourth fresh independent return (2026-09-06)

The third repair closes [[D2730]]–[[D2735]] inside its model, but eight real-boundary failures remain:

1. **[[D2978]]:** TLS trust is branded from caller-written booleans, digests and clock strings without
   a TLS connection, certificate parser or chain verification;
2. **[[D2979]]:** eleven of thirteen deployment checks accept a public expected-digest echo instead
   of a check-specific live observation;
3. **[[D2980]]:** readiness accepts caller-written response bytes without invoking the application
   route, storage connection or static-shell readiness;
4. **[[D2981]]:** exported `sealIngressSwitch` mints authority from target state without binding or
   probing any public ingress;
5. **[[D2982]]:** migration deletes private `deployment_*` look-alike tables rather than the accepted
   `learner_sessions` and `public_tokens` storage authorities;
6. **[[D2983]]:** initialization neither inspects storage nor holds the supervisor lock and permits a
   generation-zero active state over existing data;
7. **[[D2984]]:** unknown receipt parsing accepts crossed profile/origin/artifact arms and arbitrary
   refusal, failure and failed-check vocabularies; and
8. **[[D2985]]:** mounted-image compilation receives a caller string and matching digest rather than
   opening the fixed read-only application mount.

`make safe-deployment-fourth-fresh-review` retains the complete predecessor chain and passes all
eight counterexamples plus strict TypeScript. Exact receipt:
`planning/safe-deployment-profiles/fourth-fresh-independent-buildability-review-2026-09-06.md`.
This is a return, not acceptance or product implementation. The repair must move every live authority
inside the exact file, command, TLS, HTTP, storage and ingress operation that observes it; a sealed
object around caller testimony is not release proof.

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
declare const compiledDeploymentConfigBrand: unique symbol;
type CompiledDeploymentConfig = {
  readonly [compiledDeploymentConfigBrand]: true;
  readonly config: DeploymentConfigV1;
  readonly boundary: DeploymentBoundary;
  readonly configDigest: Sha256;
};
type Sha256 = string & { readonly __sha256: unique symbol };
```

Operator input is one UTF-8 JSON document with no duplicate keys and this closed union:

```ts
type DeploymentConfigV1 = {
  readonly format: "tabiya-deployment-config";
  readonly configVersion: 1;
} & (
  | { readonly profile: "local"; readonly port?: number }
  | { readonly profile: "appliance"; readonly hostname: string;
      readonly resolution: { readonly kind: "operator_dns";
        readonly expectedAddresses: readonly string[] } }
  | { readonly profile: "hosted"; readonly hostname: string;
      readonly tls: { readonly kind: "acme"; readonly contactEmail: string } }
  | { readonly profile: "hosted"; readonly hostname: string;
      readonly tls: { readonly kind: "files";
        readonly certificate: SecretFileRef; readonly privateKey: SecretFileRef } }
);
interface SecretFileRef { readonly sourceFile: string; readonly mountName: string }

type DeploymentConfigResult =
  | { readonly ok: true; readonly config: DeploymentConfigV1;
      readonly boundary: DeploymentBoundary; readonly configDigest: `sha256:${string}` }
  | { readonly ok: false; readonly code: DeploymentConfigError; readonly field: string };
type DeploymentConfigError =
  | "CONFIG_NOT_REGULAR" | "CONFIG_SYMLINK_REFUSED" | "CONFIG_PERMISSIONS_REFUSED"
  | "CONFIG_JSON_INVALID" | "CONFIG_UNKNOWN_KEY" | "CONFIG_VERSION_UNSUPPORTED"
  | "PROFILE_HYBRID_REFUSED" | "PORT_INVALID" | "HOSTNAME_INVALID"
  | "RESOLUTION_INVALID" | "SECRET_PATH_INVALID" | "SECRET_NOT_REGULAR"
  | "SECRET_SYMLINK_REFUSED" | "SECRET_PERMISSIONS_REFUSED" | "SECRET_COLLISION";

function compileDeploymentConfig(
  bytes: Uint8Array,
  configFile: OpenRegularFileAuthority,
  secretResolver: SecretFileResolver,
): DeploymentConfigResult;
```

This is an executable `unknown`-input compiler, not a structural cast. Its JSON tokenizer refuses a
duplicate key before `JSON.parse` output can collapse it; the runtime parser closes the root and
nested key sets for the selected discriminant. File authority carries the no-follow `lstat`/`fstat`
inode and mode observations, and file-certificate compilation executes the distinct-inode,
permission, parse, key-match and SAN checks. Hostname/address/port/email validation, local-port
defaulting, address deduplication/sorting, canonicalization and digesting all occur before the
private brand is constructed. Every refusal arm has an altered-input fixture ([[D2615]]).

The parser rejects unknown/missing keys per union arm. The config path is absolute, opened with
no-follow semantics, and must remain the same regular inode from `lstat` through `fstat`; it must not
be group/other-writable. `SecretFileRef.sourceFile` is an absolute host path opened the same way.
`mountName` matches `^[a-z][a-z0-9_]{0,63}$` and becomes a fixed
`/run/secrets/<mountName>` container path; it is never interpolated as a path. Certificate bytes may
be world-readable but not writable; private-key bytes must have no group/other permission bits.
Certificate and key must be distinct inodes, parse successfully, match cryptographically, and have
the configured canonical hostname in SAN. Secret contents never enter config digests or rendered
Compose/Caddy bytes.

Hostnames are lower-case ASCII DNS names with 1–63 byte labels, total length ≤253, no underscore,
wildcard, leading/trailing hyphen, IP literal, `.localhost`, `.local`, or trailing dot. Unicode input
is refused rather than silently punycoded. `local.port` is an integer 1024–65535 (default 3000).
The compiler alone derives `publicOrigin`: `http://127.0.0.1:<port>` for local and
`https://<hostname>` otherwise. No config field may supply origin, listen address, cookie security,
proxy trust, certificate mode outside the selected arm, or rendered environment variables.

Canonical config digest is RFC-8785 SHA-256 over the parsed union after defaulting local port and
normalizing/sorting appliance addresses. The compiler then emits exactly one non-secret
cross-process image:

```ts
interface CompiledDeploymentImageV1 {
  readonly format: "tabiya-compiled-deployment";
  readonly version: 1;
  readonly configDigest: Sha256;
  readonly boundary: DeploymentBoundary;
}
```

Its canonical bytes are written into an operation-owned directory, fsynced, mounted read-only at
the fixed path `/run/tabiya/deployment.json`, and covered by `compiledConfigImageDigest`. The
renderer and Caddy generator consume the branded in-memory source; the separate application process
receives the renderer's expected digest, reparses the mounted canonical image, recomputes and
compares that digest, and validates the complete profile matrix: exact internal listen host/port,
origin, proxy, cookie, hostname and TLS-mode relation for the selected arm. Canonical but
profile-impossible bytes are refused before opening storage or HTTP. Its internal readiness
attestation returns that image digest to `deployment-admin`; Caddy strips the attestation from public
responses. Compose labels, start/probe receipts and the attestation must all equal the renderer's
image digest. A changed mount therefore cannot produce success or receive public traffic
([[D2614]]).

No `TABIYA_DEPLOYMENT_PROFILE`, `TABIYA_PUBLIC_ORIGIN`, `TABIYA_LISTEN_HOST`,
`TABIYA_COOKIE_SECURE` or equivalent value remains an application authority. The only deployment
selector inside the app container is the fixed mounted image path. Operator source config remains
unpersisted; only the narrow install/transition state in §1.1 is durable. The config/receipt/state
implementation is owned by one server module, so it claims no shared schema lane; a second
independent writer/parser must first register the resource.

Development tests may construct this value directly. A production process may not infer profile
from `NODE_ENV`, `TABIYA_COOKIE_SECURE`, forwarded headers, or whether a Caddy container happens to
be reachable. `NODE_ENV` continues to govern development-only code; it is not a deployment safety
switch.

The profile vocabulary is local to the one server/deployment module, not a shared-resource register
claim. That module alone parses the operator source, compiled image and durable install state; none
is exported as a product schema or independently writable by another RFC. The public
`/capabilities` response may report the active profile as deployment metadata only after the same
server value is compiled into that response; it may not accept or change it.

### 1.1 Durable install and profile-transition state

`deployment-admin` is the sole reader/writer of canonical
`/data/.tabiya-deployment-state.json`, under the storage supervisor's inherited FD-3 lock. The file
is a versioned operational state, written by exclusive temporary file, file fsync, rename and parent
fsync. The app does not parse it; it consumes only the compiled mounted image after preflight.

An absent state is a clean install only when storage inspection proves the database is absent/empty.
Initialization durably records generation 1 before the app may listen; failed startup leaves that
same intended generation for an idempotent retry. An existing database with no state refuses
`DEPLOYMENT_STATE_MISSING`; a database restored into a fresh volume must use the explicit
adoption journey below, so missing state cannot silently bless restored sessions or links under a
new origin. The deployment state is deliberately not part of a SQLite backup.

The active arm records generation, profile, canonical public origin, config digest and compiled-
image digest. A restart may replace config/TLS bytes only when profile and public origin are equal;
its next successful receipt atomically advances the active digests. Certificate rotation is
therefore an ordinary same-origin restart but changes the TLS identity in §13.1. A profile change,
scheme/hostname/port change or absent-state/existing-database combination is refused by ordinary
`start` with `PROFILE_SWITCH_REFUSED` or `DEPLOYMENT_STATE_MISSING`.

Intentional change uses `deployment-migrate-profile` (or `deployment-adopt-profile` after a restore)
with the exact current config digest and literal old/new origins as confirmations. The durable
transition arm records one parsed operation id, consecutive generation, complete from/to active
images and exactly these fsynced phases:

1. `prepared` — target config/artifacts validate but no target public socket exists;
2. `sessions_invalidated` — one SQLite transaction deletes every `learner_sessions` row;
3. `tokens_revoked` — a following idempotent transaction marks every live `public_tokens` row
   revoked;
4. `target_ready` — the new app/proxy is internally ready and its compiled-image/TLS identities
   match the intended target, but ingress is not yet bound; and
5. `active` — public ingress is switched, the next generation is committed and the journal is
   removed only after file/parent fsync.

Session invalidation and token revocation both commit before `target_ready`; the separate journal
labels make restart reconciliation explicit rather than replaying a guessed half-effect. A
crash resumes the earliest incomplete phase after checking the recorded database effect and
artifact digests. It never rolls back to valid old sessions after invalidation. Old LAN DNS, client
trust and certificate removal remain operator effects shown before confirmation; the command cannot
claim those external effects. `target_ready` accepts only the composed readiness authority whose
profile, origin, config digest and compiled-image digest equal the journal's complete target state;
`active` additionally requires a sealed ingress-switch receipt for that same target. A fixture crashes before/after every database transaction, state
write, bind and fsync and reaches either the old active generation before invalidation or the new
active generation with all old sessions/tokens invalid ([[D2618]]).

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

The local container receives the same fixed read-only compiled image as every other profile. Its
validated boundary contains:

```text
profile=local
publicOrigin=http://127.0.0.1:<published-port>
listenHost=0.0.0.0           # inside its private container namespace only
secureCookie=false
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

The supported 1.0 name-resolution path is **operator-managed LAN DNS**, not mDNS or a Host-header
override. Before start, the guided command requires the appliance host to have a stable DHCP
reservation/static address, instructs the operator to add the exact configured hostname as an
A/AAAA record in the LAN resolver (router, Pi-hole, AdGuard Home or equivalent), and probes that
hostname through the system resolver. Every returned address must be in the configured
`expectedAddresses` set and at least one configured address must answer; loopback, unspecified,
multicast, link-local, public or unexpected answers are refused. A DNS name collision therefore
fails before Caddy issuance rather than serving whichever host answered.

`make appliance-name-check CONFIG=<file>` performs the same DNS lookup from the host and from a
disposable client attached only as an ordinary LAN client; it sends no Host override and connects to
`https://<exact-hostname>`. The trust probe then repeats using only the exported Caddy root and
requires both DNS address and certificate SAN to match the literal hostname. D1 repeats this on the
owner desktop and phone/tablet. Container-only DNS, `/etc/hosts` injected into the test client, and
direct-IP TLS cannot satisfy the appliance journey.

The guide owns change/removal: stop the profile, change config and LAN DNS together, run the name
check, generate/serve the new certificate, re-probe clients, then remove the old record. Uninstalling
removes the LAN record and Caddy root from every client; losing Caddy state requires removing the old
root and installing the newly exported root. Tabiya does not edit router/client DNS or trust stores
automatically. Networks without configurable DNS use `local`; mDNS and per-device hosts files are
explicitly unsupported in 1.0 because they do not provide one portable phone/desktop workflow.

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

The mounted compiled image's `publicOrigin` parses as one canonical origin with:

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

Rendered appliance/hosted Compose declares three named edges rather than using `default`:

```yaml
networks:
  proxy_edge: { internal: true }
  provider_edge: { internal: true }
  public_edge: {}
```

`proxy_edge` contains exactly `app` and `caddy`; the app receives the unique alias
`tabiya-proxy-origin` on that edge and resolves/binds its HTTP listener only to that interface,
never `0.0.0.0`. `provider_edge` contains `app` plus configured engine/provider sidecars and no
Caddy. `public_edge` contains Caddy only; it owns published 80/443 and the hosted ACME egress path.
Database/backup services use volumes and are absent from `proxy_edge`; maintenance, test, admin and
optional provider containers are also absent. No service joins Compose `default`.

The renderer derives this adjacency as a closed set and refuses extra services/networks on
`proxy_edge`, app attachment to `public_edge`, Caddy attachment to `provider_edge`, any app `ports`,
or a missing `internal: true`. Caddy targets only `tabiya-proxy-origin:3000` and overwrites forwarded
headers. Production probes use the rendered artifact to prove: host→app fails; public-edge
sibling→app fails; provider-edge sibling→the proxy-bound listener fails; an intentionally injected
untrusted sibling makes config validation fail if placed on `proxy_edge`; and client-supplied
forwarded headers arrive at Caddy but are replaced before app receipt. The positive path is public
client→Caddy→proxy edge→app. Static inspection alone cannot discharge these probes.

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

Route and budget identity come from one generated descriptor table, not parallel `if` branches.
Its key is `<method> <normalized-template>#<semantic-operation>`; path matching, allowed method,
operation-discriminant parsing, content type and budget all compile from that descriptor. The
current unsafe semantic-operation set is closed as follows (prefixes are part of the literal ids):

```text
auth.{register,login,logout,export,deletion_preview,delete}
classroom.{create,archive,member_invite,member_remove,member_accept,member_decline,member_leave,assign}
assignment.{withdraw,submit,submission_withdraw}
shared.join_accept
shape_draft.{create,update,lint,register}
repertoire.{create,delete,scan,gap_enter,answer}
pack_draft.{create,update,lint,playtest,register,withdraw}
run.{create,import,share_revoke}
rated_game.create
progress.schedule_dismiss
opponent.select
cohort_standing.{open,close,window,publish,withdraw,show_rating,hide_rating,show_record,hide_record}
live.session.{create,close}
live.board.{offer,withdraw,advance,reclaim}
live.match.{propose_pause,accept_pause,withdraw_pause,pause,resume}
live.link.{mint,revoke}
live.proposal.{create,apply,decline}
live.vote.{open,cast,close}
live.invitation.create
live.leg.import_pgn
run_action.{marks_replace,marks_rescope,deletion_preview,delete,distill,reasoning_review,
  voice,speech,share,flip,lease,reveal,duplicate,schedule,grant,revoke,group,group_reply,
  move_user,move_opponent,rewind,fork,compare,branch_decidedness,analysis,simulate,
  simulate_enter,prediction,reasoning,evidence}
```

Those identities bind to the current normalized route templates and discriminants as follows.
`:<name>` denotes one decoded non-empty segment; braces denote the only admitted body/action
discriminants. This table is input to descriptor generation, not documentation copied from it:

```text
POST   /auth/:action                                      auth.{register|login|logout|export|deletion-preview→deletion_preview|delete}
POST   /classrooms                                       classroom.create
POST   /classrooms/:classroomId                          classroom.archive {op=archive}
POST   /classrooms/:classroomId/members                  classroom.{member_invite|member_remove|member_accept|member_decline|member_leave} {op}
POST   /classrooms/:classroomId/assignments              classroom.assign
POST   /assignments/:assignmentId                        assignment.withdraw {op=withdraw}
POST   /assignments/:assignmentId/submissions            assignment.{submit|submission_withdraw} {op absent|withdraw}
POST   /api/shared/:token/join                           shared.join_accept
POST   /shapes/drafts                                    shape_draft.create
PUT    /shapes/drafts/:draftId                           shape_draft.update
POST   /shapes/drafts/:draftId/:action                   shape_draft.{lint|register} {action}
POST   /repertoires                                      repertoire.create
DELETE /repertoires/:repertoireId                        repertoire.delete
POST   /repertoires/:repertoireId/scan                   repertoire.scan
POST   /repertoires/:repertoireId/gaps/enter             repertoire.gap_enter
POST   /repertoires/:repertoireId/answers                repertoire.answer
POST   /packs/drafts                                     pack_draft.create
PUT    /packs/drafts/:draftId                            pack_draft.update
POST   /packs/drafts/:draftId/:action                    pack_draft.{lint|playtest|register|withdraw} {action}
POST   /runs                                             run.create
POST   /runs/import                                      run.import
DELETE /runs/:runId/share/:shareId                       run.share_revoke
POST   /rated-games                                      rated_game.create
POST   /progress/schedules/:scheduleId                   progress.schedule_dismiss {op=dismiss}
POST   /select-move                                      opponent.select
POST   /cohorts/:classroomId/standing                    cohort_standing.{open|close|window|publish|withdraw|showRating→show_rating|hideRating→hide_rating|showRecord→show_record|hideRecord→hide_record} {op}
POST   /sessions                                         live.session.create
POST   /sessions/:sessionId                              live.session.close {op=close}
POST   /sessions/:sessionId/board                        live.board.{offer|withdraw|advance|reclaim} {op}
POST   /sessions/:sessionId/match                        live.match.{propose_pause|accept_pause|withdraw_pause|pause|resume} {op}
POST   /sessions/:sessionId/links                        live.link.mint
POST   /sessions/:sessionId/links/:linkId                live.link.revoke {op=revoke}
POST   /sessions/:sessionId/proposals                    live.proposal.create
POST   /sessions/:sessionId/proposals/:proposalId        live.proposal.{apply|decline} {op}
POST   /sessions/:sessionId/votes                        live.vote.{open|cast|close} {op}
POST   /sessions/:sessionId/invitations                  live.invitation.create
POST   /sessions/:sessionId/legs/:leg/pgn                live.leg.import_pgn
PUT    /runs/:runId/marks                                run_action.{marks_replace|marks_rescope} {rescopeFrom absent|present}
POST   /runs/:runId/:action                              run_action.<normalized-action>
```

For the final row, `<normalized-action>` is the literal `parseRunRoute` action enum with hyphens
normalized to underscores. `moves` splits to `move_user | move_opponent` from its closed actor
discriminant and `grants` splits to `grant | revoke` from its closed `op`; all other POST actions are
one-to-one. GET descriptors for `graph`, `events`, `evidence`, `authored-feedback`, `pgn`, `grants`,
`reasoning`, `import`, `story`, `share`, `derivations`, `human-split` and `corpus` independently use
budget `none`, even when the same normalized template has a separately declared POST descriptor.
Generation proves the method/template/discriminant expansions are set-equal to the actual router
grammar and that every generated semantic id occurs exactly once in the budget partition.

The exact non-default assignments are:

```text
none:
  shared.join_accept, repertoire.delete, run.share_revoke,
  method_not_allowed:<every generated route id>, not_found

document_8m:
  shape_draft.create, shape_draft.update, shape_draft.lint,
  repertoire.create,
  pack_draft.create, pack_draft.update, pack_draft.lint, pack_draft.playtest,
  run.import, live.leg.import_pgn

json_256k:
  every other literal unsafe operation in the closed set above
```

“Every other” is computed as exact set difference at generation and serialized into the manifest;
it is not a runtime fallback. Empty/intersecting/unassigned sets fail generation. A discriminated
route such as classroom members, cohort standing, live board/match/vote or run moves resolves its
semantic operation before body read. Unknown operation/method resolves to the generated `none`
refusal descriptor and cannot spend a JSON budget. The adapter accepts only a compiled descriptor,
so its reader key is the same object the census counts. Fixtures mislabel one document operation
small, one ordinary command large, add an unsafe operation, remove its parser, cross a route/action,
and invoke an unsafe method on a GET-only route; every mutation fails before listening.

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

The release proxy is pinned to
`docker.io/library/caddy:2.11.4-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648`
(resolved 2026-08-31; amd64 manifest `sha256:98eb57d…423a`, arm64 manifest
`sha256:1172d4…dcba`). Caddy documents `request_body max_size` as experimental in v2.10.0+ and
returns 413 when later handlers read beyond it:
<https://caddyserver.com/docs/caddyfile/directives/request_body>. Consequently the rendered-image
gate runs `caddy validate` plus an actual 8 MiB/8 MiB+1 read through this exact digest on both
architectures. A future Caddy digest must repeat that capability probe; version comparison alone is
insufficient. Node's per-route reader remains authoritative even when the edge probe passes.

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

Secret bytes remain excluded from `configDigest`, but successful proxied `start` and `probe`
observe the served certificate through the literal public hostname and parse one `TlsIdentityV1`:

```ts
interface TlsIdentityV1 {
  readonly leafSha256: Sha256;
  readonly spkiSha256: Sha256;
  readonly chainSha256: Sha256;
  readonly trustRootSha256: Sha256;
  readonly chainValidated: true;
  readonly subjectAltName: readonly [string]; // exact configured hostname
  readonly notBefore: string;                 // canonical UTC instant
  readonly notAfter: string;
  readonly observedAt: string;
}
```

The leaf, DER SubjectPublicKeyInfo and complete ordered DER chain have separate SHA-256 domains.
The certificate must be valid at the probe's wall-clock instant, the chain must validate under the
profile's declared trust root and SAN must be exactly the configured hostname. Private-key bytes,
serial-number prose and issuer display strings never enter a receipt. A same-path certificate
rotation changes at least the leaf/chain identity; a key rotation changes SPKI. A proxied live
success without this identity, or a local success carrying one, is profile-impossible and refused
([[D2617]]).

### 12. Health, readiness, and failure behavior

- `/healthz` is liveness: the HTTP event loop responds with no provider or database mutation.
- `/readyz` is readiness: the internal response contains the exact canonical storage proof
  `{representativeData:true,status:"ready",storageVersion}` plus immutable application revision and
  compiled-image attestation. `deployment-admin` accepts it only for the same sealed deployment
  subject after storage is current/verified, static shell is loadable, and application construction
  completed. Optional provider loss belongs to F12-D and does not make core unready.
- Caddy's upstream health uses `/readyz`; public `/healthz` and `/readyz` reveal only status and
  immutable release revision, not configuration, paths, table counts, or provider secrets.
- TLS/certificate/origin/profile validation failure prevents the proxy/app from serving learner
  traffic. There is no HTTP fallback.
- A proxy restart preserves established application state. Ordinary requests retry through browser
  behavior; no mutation is automatically replayed by the proxy. Streaming reload behavior uses a
  bounded close delay only after a real streaming product route exists.

### 13. Operator surfaces

#### 13.1 One deployment operation and receipt protocol

`apps/server/src/deployment-admin.ts` owns configuration compilation, artifact rendering,
validation, start/probe orchestration, canonical receipt serialization and receipt verification.
Make, CI and the release proof invoke that entry point; they do not parse a second environment or
reconstruct success from container logs. The operation vocabulary is closed:

```ts
type DeploymentAdminOperation = "command" | "check" | "start" | "probe";
type DeploymentOperationId = string & { readonly __deploymentOperationId: unique symbol };
type DeploymentCheckId =
  | "config" | "hostname_resolution" | "certificate" | "compose"
  | "proxy_config" | "image_pins" | "network_graph" | "origin"
  | "cookie" | "request_budgets" | "streaming" | "readiness" | "core_journey";
type DeploymentArtifactCommonV1 = {
  readonly deploymentRevision: string;
  readonly serverImageDigest: Sha256;
  readonly composeDigest: Sha256;
  readonly routeBudgetManifestDigest: Sha256;
  readonly compiledConfigImageDigest: Sha256;
};
type LocalArtifactIdentityV1 = DeploymentArtifactCommonV1 & {
  readonly caddyImageDigest: null; readonly caddyConfigDigest: null; readonly tlsIdentity: null;
};
type ProxyStaticArtifactIdentityV1 = DeploymentArtifactCommonV1 & {
  readonly caddyImageDigest: Sha256; readonly caddyConfigDigest: Sha256; readonly tlsIdentity: null;
};
type ProxyLiveArtifactIdentityV1 = DeploymentArtifactCommonV1 & {
  readonly caddyImageDigest: Sha256; readonly caddyConfigDigest: Sha256;
  readonly tlsIdentity: TlsIdentityV1;
};
type DeploymentArtifactIdentityV1 =
  | LocalArtifactIdentityV1 | ProxyStaticArtifactIdentityV1 | ProxyLiveArtifactIdentityV1;
type LocalCheckChecks = readonly ["config", "compose", "image_pins", "network_graph"];
type ProxyCheckChecks = readonly ["config", "hostname_resolution", "compose", "proxy_config",
  "image_pins", "network_graph"];
type LocalStartChecks = readonly ["config", "compose", "image_pins", "network_graph", "readiness"];
type ProxyStartChecks = readonly ["config", "hostname_resolution", "certificate", "compose",
  "proxy_config", "image_pins", "network_graph", "readiness"];
type LocalProbeChecks = readonly ["config", "compose", "image_pins", "network_graph", "origin",
  "cookie", "request_budgets", "streaming", "readiness", "core_journey"];
type ProxyProbeChecks = readonly ["config", "hostname_resolution", "certificate", "compose",
  "proxy_config", "image_pins", "network_graph", "origin", "cookie", "request_budgets",
  "streaming", "readiness", "core_journey"];
interface DeploymentReceiptBaseV1 {
  readonly protocol: "tabiya-deployment-admin-receipt";
  readonly protocolVersion: 1;
  readonly operationId: DeploymentOperationId; // parsed/generated canonical UUID v4
  readonly operation: DeploymentAdminOperation;
  readonly profile: DeploymentProfile;
  readonly deploymentRevision: string; // exact immutable 40-lower-hex application revision
  readonly configDigest: Sha256;
  readonly compiledConfigImageDigest: Sha256;
  readonly publicUrl: string;   // exactly the compiler-derived canonical publicOrigin
  readonly elapsedMs: number;  // non-negative integer from a monotonic clock
}
type DeploymentAdminReceiptV1 = DeploymentReceiptBaseV1 & (
  | { readonly operation: "check"; readonly profile: "local"; readonly result: "succeeded";
      readonly artifacts: LocalArtifactIdentityV1; readonly checks: LocalCheckChecks }
  | { readonly operation: "check"; readonly result: "succeeded";
      readonly profile: "appliance" | "hosted"; readonly artifacts: ProxyStaticArtifactIdentityV1;
      readonly checks: ProxyCheckChecks }
  | { readonly operation: "start"; readonly result: "succeeded"; readonly profile: "local";
      readonly artifacts: LocalArtifactIdentityV1; readonly services: readonly ["app"];
      readonly checks: LocalStartChecks }
  | { readonly operation: "start"; readonly result: "succeeded";
      readonly profile: "appliance" | "hosted"; readonly artifacts: ProxyLiveArtifactIdentityV1;
      readonly services: readonly ["app", "caddy"]; readonly checks: ProxyStartChecks }
  | { readonly operation: "probe"; readonly result: "succeeded"; readonly profile: "local";
      readonly artifacts: LocalArtifactIdentityV1; readonly checks: LocalProbeChecks }
  | { readonly operation: "probe"; readonly result: "succeeded";
      readonly profile: "appliance" | "hosted"; readonly artifacts: ProxyLiveArtifactIdentityV1;
      readonly checks: ProxyProbeChecks }
  | { readonly result: "refused"; readonly code: DeploymentRefusalCode }
  | { readonly result: "failed"; readonly code: DeploymentFailureCode;
      readonly failedCheck: DeploymentCheckId | null }
  | { readonly result: "cancelled"; readonly code: "OPERATION_CANCELLED";
      readonly signal: "SIGINT" | "SIGTERM" }
);
type DeploymentRefusalCode =
  | "USAGE_ERROR" | "CONFIG_REFUSED" | "PROFILE_HYBRID_REFUSED"
  | "SECRET_REFUSED" | "HOSTNAME_RESOLUTION_REFUSED"
  | "ARTIFACT_IDENTITY_REFUSED" | "PROFILE_SWITCH_REFUSED" | "DEPLOYMENT_STATE_MISSING";
type DeploymentFailureCode =
  | "COMPOSE_VALIDATION_FAILED" | "PROXY_VALIDATION_FAILED"
  | "IMAGE_PIN_MISMATCH" | "NETWORK_GRAPH_FAILED" | "START_FAILED"
  | "READINESS_FAILED" | "TLS_PROBE_FAILED" | "ORIGIN_PROBE_FAILED"
  | "COOKIE_PROBE_FAILED" | "REQUEST_BUDGET_PROBE_FAILED"
  | "STREAMING_PROBE_FAILED" | "CORE_JOURNEY_FAILED" | "INTERNAL_ERROR";
```

Successful `check` means the exact rendered artifacts and pins validate without starting learner
traffic, so certificate is not falsely claimed for an as-yet unstarted ACME/internal deployment.
Successful `start` means the exact live profile tuple above passed; `services` is structurally
`["app"]` for local and `["app", "caddy"]` for appliance/hosted. Successful `probe` uses the complete
profile tuple. The compiler selects the tuple from operation and parsed profile, constructs one
sealed subject from the compiled config/image, immutable artifacts and compiler-derived origin,
accepts only privately sealed results returned for that exact subject, and rejects cross-subject,
empty, missing, extra,
duplicate, reordered, failed, forged or differently operation-bound results. A public enum/boolean
pass factory does not exist. Local artifacts require all Caddy/TLS fields null; proxy check requires
static Caddy identity and no invented live certificate; proxy start/probe require the observed TLS
identity. `probe` refuses unless live container/image/config identities equal the preceding start
identity, with a deliberate certificate-rotation transition recorded as a new start identity
([[D2616]]).

Every invocation writes exactly one RFC-8785-canonical JSON value followed by one newline and no
other stdout bytes. Diagnostics and progress use stderr only. Unknown fields or versions,
non-canonical JSON, multiple JSON values and bytes after the terminal newline make verification
fail. Exit status is `0` only for `succeeded`, `2` for `refused`, `3` for declared operational/probe
`failed`, and `4` only for `INTERNAL_ERROR`. A caught SIGINT/SIGTERM emits `cancelled` and exits
`130`/`143`; SIGKILL or host loss cannot promise a receipt. `elapsedMs` begins before argument
validation, uses a monotonic clock and is never a performance gate.

`configDigest` is the canonical digest from §1, including the synthesized default-local config.
Artifact digests cover the exact bytes consumed by Docker/Caddy; image identities are registry
digests, never mutable tags. SHA-256 values use one exact 64-lower-hex parser; operation id uses one
UUID-v4 parser/generator; `publicUrl` reparses and must equal the compiler output; and `elapsedMs` is
a non-negative safe integer from a monotonic clock. `compiledConfigImageDigest` is equal in the
base, artifacts, Compose label and application attestation. Receipts
contain logical operation/profile/check identities only: no host secret paths, certificate bytes,
container environment, credentials, learner data or arbitrary logs.

This remains one server-owned CLI protocol: the implementation exports one parser,
verifier and serializer, and every TypeScript/Make/CI/F12-H consumer invokes or imports those exact
symbols. F12-H may retain the canonical receipt bytes as release evidence but does not implement a
second parser or writer. Only the §1.1 operational install state is persisted by this same module;
receipts and operator source config are not. A persisted product schema, a non-server writer, or an independently
implemented parser is a second authority and must first enter the shared-resource register.

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
make deployment-migrate-profile CONFIG=<new-file> FROM_DIGEST=<sha256> OLD_ORIGIN=<url> NEW_ORIGIN=<url>
make deployment-adopt-profile CONFIG=<file> RESTORED_DATABASE=yes NEW_ORIGIN=<url>
```

Wrappers validate configuration, render Compose, run `caddy validate`, print the exact public URL,
and fail before starting on missing/unsafe values. The URL is the `publicUrl` field in the sole
stdout receipt, not an additional human line. They do not write secrets into generated files.
The docs provide one guided path per profile, a support matrix, CA trust/remove steps, DNS/port
prerequisites, backup interaction, update/rollback links, and exact diagnostics. Advanced proxy
customization is explicitly unsupported rather than exposed as dozens of learner settings.

### 14. Code-site inventory

The unit is a production or verification boundary consuming the profile. Total **16**; acceptance
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
| 16 | `apps/server/src/deployment-admin.ts` | sole config/image/state/receipt compiler, durable transition orchestration and exact success proof |

## Deviations from design

None. O13 requires both a reproducible self-hostable appliance and hosted multi-user topology, with
no core learner journey depending on hosted infrastructure. This RFC keeps loopback local use as
the zero-configuration default, makes LAN appliance TLS operationally explicit, and refuses the
current unsafe all-interface HTTP hybrid.

## Fresh independent return (2026-08-30)

The independent buildability pass returned this RFC on five seams:

1. **[[D2214]] — operator input is not a protocol.** `DeploymentProfile` has three values, while
   §5 calls `hosted-file-cert` a declared variant and §13 accepts an unspecified `CONFIG=<file>`.
   There is no closed config shape, discriminant, canonicalization or error algebra from which the
   server environment, Compose and Caddy files can be rendered without invention.
2. **[[D2215]] — appliance naming stops at TLS.** Trusting Caddy's internal root does not make the
   configured hostname resolve on another LAN device. The required-input matrix and guided workflow
   owe one supported DNS/mDNS/hosts mechanism, its setup/removal effect and a literal-name probe.
3. **[[D2216]] — the proxy trust boundary has no exact network graph.** The app trusts forwarded
   headers because Caddy is said to be its only peer, but `expose`/no published port alone does not
   define an internal-only app network. Hosted Caddy also needs public/ACME egress. Specify the
   exact dual attachment and prove host/sibling/public bypass failure.
4. **[[D2217]] — body budgets have no route assignment.** The three labels and prose categories do
   not classify the current unsafe route population by stable operation identity. The author must
   publish the exhaustive current manifest; implementation may then enforce its set equality.
5. **[[D2218]] — “the receipt” is not defined.** Release proof consumes image digests and config
   revisions, while wrappers promise only a printed URL. Define one versioned result union,
   canonical config/artifact identities and stdout/stderr/exit semantics.

Exact evidence and required repairs are in
`planning/safe-deployment-profiles/fresh-independent-buildability-review-2026-08-30.md`. The
loopback default, TLS split, exact-origin boundary, bounded Node ingress and streaming egress remain
the right scope. No production/deployment implementation is authorized by this return.

### Author repair (2026-08-31)

The repair closes all five returned seams in the normative specification:

1. [[D2214]]: `DeploymentConfigV1` is one closed JSON union with ACME/file-certificate arms,
   no-follow file/secret validation, canonical origin/config digest and closed refusal codes.
2. [[D2215]]: appliance 1.0 uses operator-managed LAN DNS, exact expected-address and certificate
   probes, and a complete change/removal/re-trust procedure; mDNS/hosts overrides are unsupported.
3. [[D2216]]: the trusted proxy path is one closed `public_edge → caddy → proxy_edge → app` graph,
   separate from provider traffic, with rendered-artifact bypass and header-replacement probes.
4. [[D2217]]: the budget source is an exact method/template/discriminant descriptor join over the
   live route families, with one partition, a digest-pinned Caddy 2.11.4 outer guard and Node as the
   per-route authority.
5. [[D2218]]: check/start/probe use one versioned receipt binding canonical config, artifact/image
   digests, checks, stdout/stderr and exit/signal semantics. It remains server-owned; any second
   writer/parser or persisted schema must enter the shared-resource register first.

`make safe-deployment-author-repair` passes eight executable contract arms plus strict TypeScript
positive/negative cases. This records author repair only: production, Compose, proxy, server,
workflow and release bytes remain untouched, and another independent review is mandatory before
acceptance or implementation.

### Second fresh independent return (2026-09-04)

The repair is returned on five exact rows. [[D2614]] records that its sole compiled config cannot
cross Compose into the app without an undeclared environment projection/parser. [[D2615]] records
that the executable model implements no runtime config compiler. [[D2616]] records success receipts
accepting empty/profile-impossible arrays and unparsed identities. [[D2617]] records TLS secret
rotation changing no artifact identity. [[D2618]] records `PROFILE_SWITCH_REFUSED` having no durable
state or transition rule. Exact evidence:
`planning/safe-deployment-profiles/second-fresh-independent-buildability-review-2026-09-04.md`.
`make safe-deployment-second-fresh-review` retains the prior 8/8 plus TypeScript and reproduces 5/5.

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
14. `caddy validate`, `docker compose config`, cold start, same-origin restart, certificate-state
    persistence, server/proxy failure, implicit profile/origin-switch refusal and explicit profile
    migration pass on the built release artifacts.
15. A derived census is set-equal to all 16 code-site boundaries in §14 and fails on an unclassified
    public port, mutable/unpinned proxy image, new unsafe route without a body budget, or direct use
    of request Host/forwarded headers as absolute-URL authority.
16. Browser smoke exercises local plus both proxied profiles at desktop and phone widths; it uses
    the actual TLS/origin/cookie boundary, not a direct handler substitute.
17. `make verify` remains deterministic and green; container/TLS/network tests are one separately
    named production-boundary tier with retained diagnostics and no latency micro-thresholds.
18. Canonical docs make the safe default and supported topology obvious, include CA trust removal,
    secret rotation, backup/recovery interaction, and an explicit unsupported-proxy message.
19. D607, D1846, and D1847 close only when criteria 1–24 pass and the implementation commit updates
    the ledger plus append-only exploration log.
20. Config compiler negatives cover invalid JSON, duplicate/unknown/missing keys, every wrong union
    arm, noncanonical hostname/address/port, symlink/inode/permission changes, secret collision,
    certificate/key mismatch, defaulting and canonical digest drift. No structural cast can create
    the private compiled brand.
21. The rendered canonical image is mounted read-only at the fixed path and reparsed by the built
    app. Changed profile/origin/listen/cookie bytes, image digest, Compose label or internal readiness
    attestation refuse before public traffic; no profile/origin/cookie environment value is read.
22. Check/start/probe compile the exact local/proxied tuples in §13.1. Empty, missing, extra,
    duplicate, reordered, forged, cross-operation and profile-impossible checks/services/artifacts
    fail; every successful proxied start/probe carries a currently valid chain/SPKI/leaf identity.
23. TLS fixtures rotate certificate only, key only and full chain at unchanged secret paths. Each
    changes the applicable safe fingerprint, and wrong SAN, expired/not-yet-valid, untrusted chain,
    missing TLS on a proxied live receipt and non-null TLS on local all fail.
24. Clean empty storage initializes once; existing storage with missing state refuses; same-origin
    config/TLS restart advances digests; implicit profile/origin change refuses. Explicit migration
    crash-tests every journal/database/bind/fsync boundary and cannot serve the target until all
    learner sessions and public tokens are invalidated.
25. A third author repair retains both prior gates and adds able-to-fail controls for complete
    mounted-image relation/digest validation, one sealed deployment subject, the full canonical
    receipt union, sealed live TLS proof, composed storage/deployment readiness and crash-durable
    profile migration. Another genuinely fresh independent review still gates acceptance.

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

- 2026-09-05: third author repair completed [[D2730]]–[[D2735]]. Expected-digest mounted-image
  validation now covers the complete profile relation; one sealed deployment subject owns checks
  and receipts; the full canonical terminal union enforces immutable revisions and safe elapsed
  time; live TLS authority includes trust/clock/SAN proof; readiness composes storage and deployment
  attestations; and the fixed fsynced journal surrounds durable session/token effects, target
  readiness and ingress publication. `make safe-deployment-third-author-repair` retains both prior
  author gates and passes 6/6 new groups plus strict TypeScript. No production, Compose, Caddy,
  workflow, release, content, archive or protected-design byte changed; fresh review remains.
- 2026-09-05: third fresh independent review returned the second repair on
  [[D2730]]–[[D2735]]. Six new controls reproduce partial mounted-image validation, detached check
  proof, an incomplete/mutable receipt, ungrounded TLS identity, readiness-contract bypass and
  caller-authored migration effects. `make safe-deployment-third-fresh-review` retains the prior
  author gates and passes 6/6; no production/server/Compose/Caddy/workflow/release/content/archive
  or protected-design byte changed.
- 2026-09-04: second author repair completed [[D2614]]–[[D2618]]. One canonical mounted
  image crosses into the app; the runtime compiler closes unknown input; operation/profile success
  tuples derive from sealed live results; proxied live receipts bind TLS chain/SPKI/leaf identity;
  and durable explicit transitions distinguish initialization, restart and origin/profile migration.
  `make safe-deployment-second-author-repair` retains 8/8 prior controls and passes 5/5 new groups
  plus strict TypeScript. No production/deployment/workflow/release byte changed; another genuinely
  fresh independent review remains required.
- 2026-09-04: second fresh independent review returned the repair on [[D2614]]–[[D2618]];
  cross-process config, runtime parsing, receipt, TLS identity and profile-transition authorities
  require repair and another review before implementation.
- 2026-08-31: author-repaired [[D2214]]–[[D2218]] with one typed configuration authority,
  operator-DNS appliance journey, three-edge proxy graph, exact route/budget join, Caddy capability
  pin/probe and closed deployment receipt. `make safe-deployment-author-repair` passes 8/8 plus
  TypeScript. No production/deployment/workflow/release byte changed; fresh review remains required.
- 2026-08-30: returned by fresh independent buildability review on D2214–D2218; added executable
  review guard `make safe-deployment-fresh-review`; no implementation authorized.
- 2026-08-27: drafted from O13/F12-A, D607, and the current release-platform audit; added the
  source-reproduced unbounded-ingress and defeated-streaming defects D1846/D1847 to the same
  production transport boundary.
