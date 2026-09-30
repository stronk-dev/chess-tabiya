# Source-build deployment and real Maia identity — 2026-10-01

Scope: the directed safe-deployment/runtime-distribution implementation. This advances
D3338/D3342, but does not close their isolated operator startup/TLS/account/run exit.

The operator renderer now distinguishes source builds from verified release installation.
Both use the same network/resource/Caddy templates. Source builds omit the post-image release
index and its claimed server subject; release rendering still requires the index mount and both
native Maia config identities. Actual Compose projections are compared after removing only these
declared distribution differences; network membership, published ports, proxy isolation, memory
ceilings and the identical pinned Caddyfiles remain equal.

`make deployment-build DEPLOY_TIER=cpu` builds the source server and native CPU-only Maia, exports
an OCI layout and loads the same image locally. Both exporters explicitly use OCI media types.
The compiler verifies the manifest and config byte digests/sizes, platform and rootfs join against
Docker's loaded image. Compose uses immutable local image IDs, not mutable tags or fixture
identities. The operational `source-images.json` explicitly says `source-build`; it is not a
release manifest. Core compilation claims no Maia artifact. Source up wrappers build before
rendering/checking and never silently pull a digest-shaped local image from a registry.

The pinned `tabiya-source-v1` BuildKit builder is local, uses the official v0.24.0 immutable index,
and is not selected with `--use`. Foreign driver, node, endpoint or image configurations refuse.
Its dedicated image/cache is retained for subsequent builds; no other builder was changed.
Reference: [Docker exporter documentation](https://docs.docker.com/build/exporters/).

Three real negatives, then repairs:

- D3344: the first actual build refused unsupported `buildx inspect --format`. The real inspect
  text is now parsed with exact single-node/endpoint/pinned-image checks. The native build passes.
- D3345: mixed default Docker/OCI media types produced an OCI index naming the Docker manifest,
  while its blob directory contained only the OCI manifest. The byte join refused. Both exporters
  now name the same OCI manifest, whose actual bytes/config join succeeds.
- D3346: the loaded image passed a root-only build handshake but failed as uid 10001 with
  `PermissionError` reading the model. Explicit directory traversal/file read modes plus a
  post-`USER maia` offline handshake repair it. A file-only mode attempt still failed that new
  build guard; explicit directory and file modes passed. The original non-root container proof
  now starts the real Maia model and receives both `uciok` and `readyok` plus its exact TCP identity.

Observed final native identity (linux/arm64):

```text
manifest sha256:59bf6e09945a72b0979f38b677fc8b04021d0c56e67074cc099a2fe5e88b9f2f
config   sha256:9e096c8a9511225778fb1485b0c1792e4ea76b9a32e3c30ea81a0dee29f147bc
```

`make source-deployment-identity-drill` re-establishes the OCI/image join, then runs the actual
CPU image as its normal user with no network, 1,536 MiB hard memory/no swap, real model startup and
localhost TCP requests. It removes only its UUID-named test container even on timeout. The cache
proof is `.cache/deploy/local-build/maia-identity-proof.json`. This is real readiness, not move
quality, bot inference/calibration, a complete app journey or a remote amd64 proof.

Fresh verification: native CPU source build and original offline sidecar negative now pass;
both actual CPU appliance/hosted `deployment-check` configurations and pinned Caddy validation
pass without starting an operator deployment. `make verify-deployment` verifies source/release
Compose parity and both pinned Caddyfiles; `make release-policy-check` passes 53 controls;
typecheck has zero errors/warnings. Source controls are included by the existing release-policy
test glob in software CI; Docker-tier checks are not falsely described as remotely executed.

Clarification of the September 30 audit: `loadReleaseAbout` currently reports `not_attached`
for a missing/directory index, even with an explicit path. A foreign/malformed present index
refuses. The prior audit's required missing-index refusal was not an observed shipped behavior;
do not cite it as one. A published 1.0 appliance still requires a verified join under its RFC.
This repair does not change the About policy or fabricate an index for development.

Remaining: isolated actual up-wrapper TLS/account/run journey and full native CPU application
availability, complete deployment-admin receipts/profile transitions, hosted live TLS, rights,
resource/release/content gates and owner-device use. Working-tree builds contained the held
D3330 Explorer implementation; they are not committed-release evidence. Per-release migration
approval remains unanswered; no content, semantic capability image, protected intent or archive
was edited. Nothing pushed, published or deployed. The 1.0 goal remains active.
