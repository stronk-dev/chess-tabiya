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
- `make appliance-drill`: the built image behind real Caddy. It checks HTTP→HTTPS, a client that
  trusts only the exported root, TLS failure without it, no published app port, the Secure
  `__Host-` cookie, exact HSTS, cross-origin refusal through the proxy, and replacement of spoofed
  forwarded headers.

Not yet implemented from the RFC: the per-route request-body budget registry and streaming
response writer (D1846/D1847); the Caddy 8 MiB cap is the only body bound today. Also missing:
the mounted compiled deployment image and `deployment-admin` receipts/profile-migration journal;
the `hosted` file-certificate variant; CSP headers; and owner-device appliance validation
(discharge D1).
