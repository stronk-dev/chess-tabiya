# Release distribution

Implements `rfc/verifiable-runtime-distribution.md`: verifiable appliance artifacts instead of
tags CI happened to produce. Receipt:
`planning/verifiable-runtime-distribution/implementation-2026-09-24.md`.

## Committed inputs (`release/`)

| File | Authority |
|---|---|
| `materials.v1.json` | Every fetched build input: base-image index + amd64/arm64 manifest digests (Dockerfile frontend, Node, Python, SBOM scanner), the Debian snapshots build stages may use, pnpm, Stockfish archives and NNUE nets, the Node/Python runtime licence records, Maia source/patch/weight and the per-arch Python locks. Every URL carries a SHA-256. |
| `foss-policy.v1.json` | The closed SPDX 2.3 FOSS predicate: accepted ids with pinned licence-text digests (`licenses/spdx-3.29.0/`), the four accepted `WITH` pairs, refused ids and the digest of `foss-overrides.v1.json`. |
| `foss-overrides.v1.json` | Owner-approved curated overrides and `OR` branch selections, each bound to purl/version/artifact digest/scanner/observed expression. Empty today. |
| `runtime-content-rights.v1.json` | Rights basis for the temporary runtime-content allow-list families. |
| `maia-weight-rights.v1.json` | D1: the Maia3-5M weight licence. `unresolved` today, which refuses 1.0 publication. |
| `notices/node-v24.21.0-LICENSE` | Verbatim Node.js licence shipped in the server image. |

`workers/maia/requirements-cpu-linux-{amd64,arm64}.txt` are exact, hash-locked CPU-only closures
(`torch==2.14.0+cpu`); `workers/maia/python-licences.v1.json` records each distribution's verbatim
upstream declaration; `workers/maia/NOTICE.txt` is generated from them
(`node tools/release/maia-notice.mjs --write`).

## Images

- **`server` (`core`)** — `apps/server/Dockerfile`. Digest-pinned `node:24.21.0-bookworm-slim`
  (24.21 is the first 24.x with the Unicode 17 data the concept registry requires; 24.10 refused
  startup). Fetches only via `ADD --checksum`; apt runs only in the arm64 Stockfish build stage
  against the frozen snapshot with exact versions. The final stage holds Node, the four runtime
  server entries (`main.js`, `longitudinal-worker-thread.js` and the two longitudinal operator CLIs),
  the web bundle, Stockfish plus complete source, the allow-listed runtime content under `/app` and
  `/usr/share/doc/chess-tabiya/{NOTICE.txt,LICENSE,licenses/,build-metadata.json}`. npm, corepack,
  yarn, netcat, compilers, prose roots and authoring tools are absent.
- **`maia-cpu` (`cpu`)** — `workers/maia/Dockerfile`. Digest-pinned Python, the checksum-locked Maia
  source archive plus the digest-verified patch, hashed `--require-hashes --no-deps` installs, the
  SHA-256-checked weight at `/opt/maia3-models/maia3-5m.pt`, a `--network=none` validation step
  (CPU-only torch, weight digest, offline UCI handshake) and a non-root user. No CUDA/NVIDIA
  distribution or library.
- Maia is reached through a Node stdio↔TCP bridge (`MAIA_TCP_BRIDGE_SCRIPT` in
  `apps/server/src/maia.ts`), which removed the netcat OS package.

## Runtime content (§7)

`tools/release/lib/runtime-content.mjs` derives the allow-list from the paths the production
loaders open: served pack documents and their evidence/sources sidecars, shapes, principles, the
concept registry, the valence register, campaigns, top-level schemas and the compiled opening
catalogue. It excludes candidates, `*.job/priority/graduation/browser.json`, prose, planning and
tooling, and fails on any workstation-local path. Graduation ruling anchors and `blockedBy` targets
compile into `/app/runtime-content/facts.json`; with `TABIYA_RUNTIME_CONTENT_FACTS` set, pack
admission answers from those facts (`apps/server/src/runtime-content-facts.ts`), so no prose file
ships. The bundle is temporary (`finalDischarge: false`) until F12-E2 (D2).

## Licence and source surface (§9)

Every chrome shell and the public landing link **Licence & source** to `/about`, a server-rendered
page. `/about/release` is the unauthenticated machine view; `/about/NOTICE.txt`, `/about/LICENSE`
and `/about/release-manifest.json` serve the embedded files. Release Compose mounts
`release-manifest.json` read-only at `/run/chess-tabiya/release-manifest.json` and sets
`TABIYA_SERVER_IMAGE`; startup parses it with the shared v1 parser
(`packages/schema/src/release-manifest`) and refuses on any revision, content, policy or image
mismatch (`RELEASE_INDEX_REFUSED`). Without a mounted index About reports `not_attached`.

## Release manifest v1

`packages/schema/src/release-manifest/index.ts` owns the closed schema (projected to
`schemas/release-manifest.v1.schema.json`, checked by `release-manifest-schema.mjs`), the validator
and the canonical form. Beyond the schema it enforces sorting, role/tier coupling, SBOM file joins,
tag-bound signature identities, Compose ⊆ artifacts, the §5 ceilings on receipts, and the release
class: a non-prerelease version requires both roles on both platforms, native receipts for the
`core.release_journey@1` / `bot.production_selection@1` journeys and the final content bundle.

## Workflow (`.github/workflows/release.yml`)

Tag push only; `permissions: {}` at the top. `eligibility` (tag is v-semver on a green main commit;
D1 gate) → `verify` (`make verify`, `make release-policy-check`, base-image platform fixture) →
`pre-image` (NOTICE, licences, build metadata, runtime content, source archive; refuses a dirty
tree) → native `build` on `ubuntu-24.04` and `ubuntu-24.04-arm` without registry authority →
`publish` (push platform manifests by digest, candidate index; `packages: write`) → `native-proof`
(pull by platform digest; census, SBOM, enforced licence gate, traced boot, enforced envelope) →
`release-set` (drift check, Compose, manifest once, SHA256SUMS) → `sign-attest` (cosign keyless,
build-provenance and SBOM attestations, release-artifact attestations, version tags) →
`verify-release` (fresh job: checksums, manifest, signature identity, foreign-identity negative,
attestations, offline bundles) → `github-release` (`contents: write`). Every action is a reviewed
full SHA with a version comment; Dependabot proposes updates.

## Commands

```sh
make release-policy-check        # offline: all tools/release tests + release-policy.mjs
make release-verify-local        # Docker: build, census, SBOM, licence gate, traced boot, local release set
make release-verify-local-maia   # the same plus the Maia CPU image
node tools/release/base-images.mjs            # network: pinned indexes resolve to the recorded digests
node tools/release/release-set.mjs verify --dir <downloaded release>
```

Consumer verification of a published release: download every asset, move `sbom-*.spdx.json` to
`sbom/<name>`, then `sha256sum -c SHA256SUMS`, `node tools/release/release-set.mjs verify --dir .`,
`cosign verify <subject> --certificate-identity https://github.com/stronk-dev/chess-tabiya/.github/workflows/release.yml@refs/tags/v<version> --certificate-oidc-issuer https://token.actions.githubusercontent.com`
and `gh attestation verify oci://<subject> --repo stronk-dev/chess-tabiya`. Offline:
`gh attestation verify --bundle <bundle> --custom-trusted-root trusted_root.jsonl`.

## What still blocks publication

- **Debian OS licences**: the scanner reports free-but-non-canonical expressions (`LicenseRef-GPL`,
  public domain, …) for the base-image packages; each needs an owner-approved exact override.
- **D1** Maia weight licence (and five Python distributions whose metadata is not canonical SPDX).
- **D2** final runtime-content bundle; **F12-H** `core.release_journey@1`; the bot production route.
- **Core steady-state memory**: measured ≈161 MiB working set against the 128 MiB ceiling on local
  arm64 (see the receipt). The ceiling is not loosened; the runtime must shrink or the RFC returns.
