# Maia release identity repair — 2026-09-30

Authority: implementing provider-health/exchange and verifiable-runtime-distribution RFCs.
Scope: D3340/D3341 only; D3338 operator wrappers remain open.

The publisher previously inspected only the amd64 platform manifest and injected its config
digest into every native deployment. Appliance/hosted templates omitted identity entirely.
The first permanent controls reproduced both failures: rendering refused the new two-platform
input, and the actual Python identity function returned unavailable.

The publisher now reads config descriptors from both immutable platform subjects. Assembly and
the release-set CLI preserve that map; the shared renderer requires exactly linux/amd64 and
linux/arm64 with valid SHA-256 digests. Every release profile injects the same map. The actual
sidecar selects its running architecture, keeps the existing identity-response protocol and
refuses unknown architectures or malformed/incomplete/extra-platform maps. A bad map cannot
borrow the development-only scalar. The scalar remains supported only when no map is supplied.
No release template includes it.

The distinction follows the [OCI manifest specification](https://github.com/opencontainers/image-spec/blob/main/manifest.md):
an image manifest's config describes one platform image, whereas its index refers to platform
manifests. Registry inspection uses [Docker's raw immutable-manifest inspection](https://docs.docker.com/reference/cli/docker/buildx/imagetools/inspect/).
No publisher, registry write, signing, tagging, release or deployment was executed here.

## Verification and limits

- `make release-policy-check`: 41 tests and the offline release policy pass.
- `make maia-identity-check`: four permanent capture/render/Python controls and four actual TCP
  tests pass. The latter run the real sidecar handler and production artifact probe against each
  rendered profile's metadata. The UCI process is explicitly a readiness-only stub: no model,
  chess inference, bot strength, calibrated human likeness or full selection journey is proved.
- Initial TCP proof returned null on this host because Python reports the arm64 alias rather
  than Linux's aarch64 spelling. Both native ARM spellings now select the same arm64 config;
  unknown architectures remain refused. Both platform choices are also directly tested.
- `make verify-deployment`: packaging checks parse actual Docker Compose output and assert
  identity/map preservation for all profiles; all three verifier controls and both actual pinned
  Caddy validations pass.
- `make http-streaming-proxy-check`: all five prior pinned TLS streaming/refusal/cancellation
  proofs still pass after the render-input change.
- `make typecheck`: zero errors/warnings. `make schema-check`: fourteen scaffold/hook controls
  and packaging validation pass. The native release matrix now requires `maia-identity-check`
  on both architectures; omission is refused by the scaffold guard. Local proof covers only
  this host, not a remotely executed release matrix or a downloaded real Maia model.

The two config values in verification fixtures are deliberately distinct and never represented
as a real deployed Maia artifact. Actual release metadata is read from immutable registry subjects.
No chess source vocabulary, capability declaration, authored pack or protected intent changed.
The separate unapproved D3330 Explorer migration remains unstaged; full application/content
gates are not claimed green. D3338, deployment receipts, bot production/calibration journeys,
model rights, official content and full 1.0 completion remain open.
