# Source-build operator wrapper audit — 2026-09-30

D3338 was broader than an omitted digest argument. D3342 records the second defect.

Observed directly: `make deployment-render` exits 2 because the release renderer requires
manifest and both native config digests. Source: Makefile deployment-render/deployment-check.
The default operator image names are tagged development builds; no matching local images were
present at this audit. No image was pulled or built, and no stack was started.

The two up wrappers first validate release templates, then build only the development server.
Those templates declare `TABIYA_RELEASE_MANIFEST`, declare their image as
`TABIYA_SERVER_IMAGE` and bind-mount `./release-manifest.json`. Neither wrapper creates or
verifies a release set. Source: Makefile up-appliance/up-hosted and
deploy/compose.appliance.template.yaml / deploy/compose.hosted.template.yaml.

This is a source-verified invalid wiring, not a claim that a real packaged startup was executed.
The existing appliance-drill also renders release templates without generating that index;
its historical positive receipt is not current evidence for this operator path.

Required repair: keep the one shared network/security renderer, explicitly distinguish
source-build distribution from verified release installation, and bind engine artifact identity
to the actual build/image rather than arbitrary config-shaped strings. A local image config id
is not a registry manifest. Optional engines must remain honestly absent when not started, and
the CPU source-build path needs genuine artifact capture, not verifier fixture digests.

Exit must run the actual wrapper against an isolated test-owned stack, verify real startup,
TLS/account/run behavior and identity/capability capture when engines run, and retain refusal of
missing/foreign release indices for real release installations. Merely passing extra digest
arguments, disabling index verification globally, or declaring a core-only success complete
does not discharge D3338/D3342. The repair remains owned by release-engineering.
