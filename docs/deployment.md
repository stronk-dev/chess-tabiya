# Deployment profiles

Implements `rfc/safe-deployment-profiles.md` (profiles, cookie and origin policy, and the Caddy
edge) and the D655 resource tiers. There are three supported network postures. Choose one; mixed
configurations are refused at startup.

| Profile | Public URL | App socket | TLS / session cookie | You provide |
|---|---|---|---|---|
| `local` | `http://127.0.0.1:${TABIYA_PORT:-3000}` | published on host loopback only | HTTP; `tabiya_session`, HttpOnly, SameSite=Strict, not Secure | nothing |
| `appliance` | `https://<exact LAN hostname>` | not published (internal network) | Caddy internal CA; `__Host-tabiya_session`, Secure | LAN DNS name, CA trust on each device |
| `hosted` | `https://<exact public hostname>` | not published | Caddy ACME (publicly trusted); `__Host-tabiya_session`, Secure | public DNS to the host, open 80/443, ACME email |

Every profile runs the same image and the same learner features.

## The boundary the server enforces

`apps/server/src/config.ts` builds one closed boundary from `TABIYA_DEPLOYMENT_PROFILE`, plus
`TABIYA_PUBLIC_HOSTNAME` for proxied profiles or `TABIYA_PUBLIC_PORT` for local:

- **A profile is required outside development.** No packaged default silently chooses insecure
  cookies. `NODE_ENV=development` defaults to `local`.
- **Cookies follow the profile.** `TABIYA_COOKIE_SECURE` is no longer a setting. A value that
  contradicts the profile refuses startup (`PROFILE_HYBRID_REFUSED`), and so do a hostname on
  `local` and a port on a proxied profile.
- **Host.** A request whose Host is not the public authority gets `421`. `local` accepts
  `127.0.0.1:<port>` and `localhost:<port>`. `/healthz` and `/readyz` are exempt because
  orchestrators and Caddy address the container directly.
- **Proxy headers.** `appliance` and `hosted` require `X-Forwarded-Proto: https` and
  `X-Forwarded-Host` equal to the hostname. Caddy overwrites both from any client.
  `X-Forwarded-For` is never used for security decisions.
- **Origin.** Every `POST`/`PUT`/`PATCH`/`DELETE` must carry an `Origin` equal to the public
  origin, and any `Sec-Fetch-Site` header must be `same-origin`. Otherwise the request gets
  `403 ORIGIN_REFUSED` before routing. Proxied profiles also require `Origin` to be present;
  loopback `local` accepts a missing one, because browsers always send it on writes. Safe
  cross-site `GET` navigation, such as invitation links, still works. No CORS is enabled.
- **Listener.** `local` listens on `127.0.0.1`. Inside Compose the container listens on
  `0.0.0.0` (`TABIYA_LISTEN_HOST`), and Compose publishes only `127.0.0.1:<port>`.

## Local (default)

```sh
make up            # core tier: server with Stockfish
make up-engines    # cpu tier: adds the CPU-only Maia sidecar
```

Open exactly `http://127.0.0.1:3000`. Use `TABIYA_PORT=<n>` to change the port. The profile
serves only the machine it runs on. For other devices, use `appliance`.

## Appliance (LAN, internal CA)

Prerequisites: a stable address for the host (a DHCP reservation or static IP), and an A/AAAA
record for the exact hostname in your LAN resolver (router, Pi-hole, AdGuard Home or similar).
mDNS, `.local` names, IP-only certificates and per-device hosts files are not supported. Networks
without configurable DNS should use `local`.

```sh
make up-appliance TABIYA_PUBLIC_HOSTNAME=tabiya.home.arpa
make appliance-ca-export OUT=$HOME/tabiya-root.crt
```

For the CPU-only human opponent, add `DEPLOY_TIER=cpu` to the source up command. It builds and
loads a native Maia image plus an OCI layout, verifies their identity join, then renders immutable
local image IDs. `make deployment-build DEPLOY_TIER=cpu` performs only the build/render step;
`make source-deployment-identity-drill` verifies real offline model readiness and TCP identity.
The dedicated pinned `tabiya-source-v1` builder retains its cache without changing your selected
builder. Source builds report `releaseIndex: not_attached`; they are not verified release installs.

Install `tabiya-root.crt` as a trusted root on each device. A browser "Not private" warning means
setup failed; never click through it. Only the public root is exported. Caddy's CA key stays in
its `caddy-data` volume, which is secret operational state and is **not** part of a database
backup. If that volume is lost, a new CA is created: remove the old root from every device and
install the new one. To change the hostname, stop the stack, change the DNS record and
`TABIYA_PUBLIC_HOSTNAME` together, start again, and trust the new certificate. To uninstall,
remove the DNS record and the root from every device.

## Hosted (Internet)

DNS for the hostname must point at the host, and ports 80 and 443 must be reachable.

```sh
make up-hosted TABIYA_PUBLIC_HOSTNAME=tabiya.example.org TABIYA_ACME_EMAIL=you@example.org
```

Caddy obtains and renews a publicly trusted certificate and keeps its state in `caddy-data`. HTTP
redirects to HTTPS, and there is no plain-HTTP fallback. Only one proxy hop is supported. A CDN,
cloud load balancer or second reverse proxy in front of Caddy needs its own trust-chain contract,
and forwarding its headers is not supported.

## The Caddy edge

The Caddyfiles are `deploy/Caddyfile.appliance` and `deploy/Caddyfile.hosted`. Caddy is pinned
by digest (`caddy:2.11.4-alpine@sha256:5f5c86…8648`). It serves one exact hostname with no
wildcard or on-demand TLS. It sets `Strict-Transport-Security: max-age=31536000` (without
includeSubDomains or preload), `nosniff` and `no-referrer`. It caps request bodies at 8 MiB,
strips any client-supplied `Forwarded` header, and health-checks the app at `/readyz`.

Readiness checks the live web shell through the same static-serving operation as the learner
entry, then checks the worker and storage again. A missing or unreadable `index.html` returns
503 `unready`, even when storage and the worker are healthy; restoring the shell recovers
without restarting. This is not a cached build-exists flag. Optional providers do not make
core readiness fail. `make application-readiness-check` exercises these states through the
bundled server, alongside storage recovery and worker-exit checks.

The rendered Compose files use three named networks and no `default` network:

- `proxy_edge` (internal) contains exactly the server and Caddy. The server's alias there is
  `tabiya-proxy-origin`.
- `provider_edge` (internal) contains the server and engine sidecars.
- `public_edge` contains Caddy only and owns 80/443.

A fourth network, `egress`, contains only the server so it can reach the Lichess
explorer/tablebase. It publishes nothing. The application port is never published in proxied
profiles.

## Resource tiers (D655)

- `core`: the server image alone. It includes pinned FOSS Stockfish, needs no model, and uses the
  least memory.
- `cpu` (default full local opponent): adds `workers/maia` built with CPU-only PyTorch
  (`torch==2.8.0+cpu` from the official CPU index). The build fails if any NVIDIA/CUDA/Triton
  distribution is installed or if torch reports CUDA. Start it with `make up-engines`, or with
  `--profile engines` when using a release Compose file.
- `accelerated`: an optional GPU image. It is not built or published, and no core learner journey
  needs it.

## Release artifacts

`tools/render-deployment.mjs` renders the digest-pinned `compose.yaml` (local),
`compose.appliance.yaml`, `compose.hosted.yaml`, `compose.maintenance.yaml`,
`Caddyfile.appliance` and `Caddyfile.hosted`. The release workflow publishes all six. Backup,
restore, upgrade and rollback are covered in
[storage backup and recovery](storage-backup-and-recovery.md).

## Verification

- `make test-software`: `config.test.ts` (profile matrix, hybrids, hostname grammar, the
  Host/proxy/Origin policy) and `storage-appliance.test.ts` (real `main.js`: loopback-only
  bind, profile-required refusal, cookie shape, cross-origin refusal).
- `make schema-check` → `tools/verify-packaging.mjs`: loopback-only local publishing, no app
  ports in proxied profiles, the Caddy pin, network graph, Caddyfile invariants, maintenance
  overlay identity and the CPU-tier Maia guard.
- `make verify-deployment`: `caddy validate` of every rendered profile with the pinned image.
- `make http-streaming-check`: real Node HTTP first-byte, backpressure, cancellation and failure
  controls. Responses stream; HEAD/204/304 carry no body, and partial responses cannot become JSON.
- `make http-ingress-check`: real unfinished-upload Host/Origin refusals, progressive original
  bytes, cancellation followed by a response, strict header bounds and actual 10 s/30 s receive
  deadlines. Body consumption is lazy; this does not provide the missing endpoint budget registry.
- `make http-streaming-proxy-check`: the production adapter behind the exact rendered appliance
  Caddyfile and pinned Node/Caddy images. Event-stream and PGN-shaped first bytes arrive before the
  source can finish; disconnect cancels it. Native release CI runs this on both architectures.
  Unfinished HTTP/1 uploads also receive early 403/413; both proxy profiles enable full duplex.
- `make appliance-drill`: the actual source `make deployment-build` → `make up-appliance` →
  `make appliance-ca-export` path, with native CPU Maia, its real OCI/image join and no fake release
  index. It owns a UUID project, learner/CA volumes and loopback-only ephemeral proxy ports.
  Transport checks cover HTTP→HTTPS, exported-root trust, untrusted TLS refusal, unpublished app/
  engine ports, Secure `__Host-` cookies, HSTS, cross-origin refusal and spoofed-header replacement.
  The full exit also requires a real registered-bot reply and idempotent retry, rewind/fork/
  comparison, restart/login/resume and a served-pack run. It fails rather than substituting a
  fixture or alternate engine. Only its own test project/volumes/tags are removed on exit.
- `make appliance-drill-staged`: runs that same journey over an exact Git-index snapshot with
  fresh frozen-lockfile dependency links. It does not create a Git worktree, stash/reset changes
  or include concurrent unstaged edits. Its operational proof records the tested tree and states
  that this is not a published release or an owner-device discharge.
- `make staged-software-contracts`: runs the existing complete `verify-software` target over the
  same exact-index mechanism, rather than asserting that a dirty-tree result proves staged bytes.
  The snapshot has private test-only Git metadata/index/hooks and reads the actual immutable
  committed history. It never shares the operator's writable index/hooks or redirects all fixture
  Git commands through global environment variables. No history gate is skipped.

The wrappers honor standard `COMPOSE_FILE` when explicitly supplied; otherwise they use their
generated profile file. The drill's only Compose overlay changes proxy ports to owned loopback
ports. It retains the actual server/engine memory ceilings, network isolation and Caddy image.

Not yet implemented from the RFC: the per-route request-body budget registry (D1846); the Caddy
8 MiB cap and the existing account-import reader are not a complete endpoint budget authority.
D3334/D3335 track the unbuildable selector order and stale operation census. Source wrappers now
capture a genuine native OCI/image join and omit release-only index mounts/claims. The CPU source
build, actual non-root Maia readiness/identity, both operator configuration checks and
source/release Compose security parity pass. The exact-index journey now additionally proves
real startup/TLS/account/ingress; the full exit is still red on D3349's actual Maia option-table
mismatch. D3347's initial OOM is repaired at startup by shared Stockfish allocation and bounded
binary hashing, but play-time memory still awaits that bot exit. D3338/D3342 stay open; eight
passed transport groups are not a full journey. Latest receipt:
`planning/safe-deployment-profiles/source-appliance-journey-2026-10-01.md`. Prior receipt:
`planning/safe-deployment-profiles/source-build-identity-2026-10-01.md`.
`verify-deployment` validates configurations with inert fixtures, not deployable sidecar identities.
Streaming egress is implemented (D1847/D3332); the proxy
instrument is a disposable upstream, not proof of every packaged export or a product SSE/WebSocket
route. Also missing:
the mounted compiled deployment image and `deployment-admin` receipts/profile-migration journal;
the `hosted` file-certificate variant; CSP headers; and owner-device appliance validation
(discharge D1).
