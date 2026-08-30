# RFC: Verifiable runtime distribution and resource tiers

- **Status:** **draft — RETURNED by fresh independent buildability review 2026-08-30 on
  [[D2206]]–[[D2209]].** The signed multi-architecture release goal survives, but the manifest is
  an unregistered multi-reader protocol, its image-digest embedding graph is self-referential,
  FOSS eligibility has no closed licence policy, and the CPU resource journey has no production bot
  operation. `make runtime-distribution-fresh-review` passes 4/4. Implementation remains
  unauthorized and also awaits F12-A/C/D plus D1.
- **Author:** Codex on the owner's O13 Choice-C resource-tier ruling
- **Created:** 2026-08-27
- **Design refs:** `design/02-product-shape.md` self-hostable appliance floor; `design/03-product-breadth.md` B8
- **Exploration gate:** R18 measured the built images, rights surface and release workflow; O13/D616 selected signed/attested multi-architecture `core`/`cpu`/`accelerated` tiers
- **Depends on:** F12-A deployment profiles; F12-C recovery revision identity; F12-D provider health; implemented runtime opening catalogue
- **Parent / amends:** `.github/workflows/release.yml`, server/Maia Dockerfiles, release Compose artifacts, legal/source surface and packaging verifier
- **Supersedes / superseded by:** F12-E2 runtime-content bundle follows F3/F4 and replaces only this RFC's temporary content input boundary
- **Planning:** `planning/verifiable-runtime-distribution/` (once implementing)

```tabiya-claims
none
```

## Summary

Tabiya 1.0 publishes verifiable appliance artifacts, not merely tags that happened to be produced by
CI. The required release consists of a multi-architecture FOSS `server` image, a separate FOSS
CPU-only Maia image, digest-pinned Compose/profile artifacts, corresponding source, SPDX 2.3 SBOMs,
human notices, cryptographic image signatures and build/SBOM attestations. Every fetched build input
is immutable or checksum-locked, every external GitHub Action is pinned to a reviewed full commit
SHA, and release consumers can verify the complete set from documented commands.

The three owner-ruled resource tiers become numerical and testable. `core` runs the server without a
model inside 512 MiB. `cpu` adds the human-model sidecar inside a 2 GiB appliance envelope and ships
no CUDA/NVIDIA package. `accelerated` is optional and separately labelled; if published, its exact
architecture/driver/runtime/VRAM and any non-FOSS component are disclosed. It can never be required
for a 1.0 learner journey or used to call the complete distribution “all FOSS.”

This RFC deliberately splits F12-E at its real dependency. It can remove authoring-only files and
enforce a temporary runtime allow-list now, but it cannot decide which future packs/theory assets are
eligible to ship. F12-E2 will consume F3/F4's immutable runtime bundle. That later join cannot delay
image provenance, CPU cleanup, notices, resource budgets or signatures.

## Motivation and measured baseline

R18 built and inspected the actual arm64 artifacts:

- the server image was 490,016,169 bytes and used 53.3–76.42 MiB idle in the measured journey;
- the engine profile used about 1.31 GiB idle;
- the Maia image was 5,109,189,363 bytes while its model was about 21 MiB;
- that CPU deployment installed 18 CUDA/NVIDIA packages, 15 carrying proprietary or
  `LicenseRef-NVIDIA-*` metadata;
- the server image copied the entire authoring tree, including candidates/jobs/source sidecars and
  absolute local workstation paths;
- the release workflow produced multi-architecture image digests and a digest-pinned Compose file,
  but no SBOM, notice inventory, image signature or provenance attestation.

The source audit adds two supply-chain defects. The Dockerfiles use mutable base tags and live
Debian/Python resolution; Maia's pinned upstream project declares only lower bounds or no versions
for `huggingface-hub`, `numpy`, `python-chess`, and `torch` (D1849). The write-capable release
workflow invokes external actions through movable major tags (D1850). GitHub states that a
full-length commit SHA is the only immutable action reference:
<https://docs.github.com/en/actions/reference/security/secure-use>.

GitHub's artifact-attestation contract supports container-image subjects by fully qualified name
and digest and supports attached SPDX/CycloneDX SBOM predicates:
<https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations>.
Docker BuildKit supports image SBOM/provenance attestations, but this RFC also requires an exported
human-verifiable release set rather than leaving evidence discoverable only through one registry:
<https://docs.docker.com/build/ci/github-actions/attestations/>.

This is engineering provenance and licence inventory, not legal advice. Automated licence scanners
may find or miss metadata; they never resolve an ambiguous model licence by inference.

### Scope

This RFC owns:

1. immutable release build inputs and full-SHA workflow dependencies;
2. `server`, `maia-cpu`, and optional `maia-accelerated` artifact definitions;
3. numerical memory/image/startup envelopes for `core` and `cpu`;
4. per-platform SPDX SBOMs, curated notices and corresponding-source artifacts;
5. OCI metadata, signatures, build provenance and SBOM attestations;
6. native amd64/arm64 functional/resource verification;
7. release-set manifest, digest-pinned Compose profiles and offline verification instructions;
8. the visible application licence/source/warranty entry required by D610.

### Non-goals

- deciding which ungraduated chess content is educationally or legally ready to distribute;
- vulnerability-remediation SLAs, automatic upgrades, secret scanning or a bug-bounty program;
- guaranteeing bit-for-bit reproducible OCI digests across independent builders;
- treating an SBOM scanner's guessed licence as legal clearance;
- supporting every GPU vendor/architecture in 1.0;
- Kubernetes charts, package-manager repositories, desktop-native installers or app stores;
- data backup/restore, TLS topology or provider-health semantics owned by F12-C/A/D.

## Specification

### 1. Release artifact set

Every 1.0 tag publishes one closed release set:

```text
chess-tabiya-<version>-source.tar.gz
compose.local.yaml
compose.appliance.yaml
compose.hosted.yaml
release-manifest.json
SHA256SUMS
NOTICE.txt
LICENSE
sbom/
  server-linux-amd64.spdx.json
  server-linux-arm64.spdx.json
  maia-cpu-linux-amd64.spdx.json
  maia-cpu-linux-arm64.spdx.json
```

The manifest points to, rather than embeds, these OCI subjects:

```text
ghcr.io/stronk-dev/chess-tabiya-server@sha256:<multiarch-index>
ghcr.io/stronk-dev/chess-tabiya-maia-cpu@sha256:<multiarch-index>
```

If an accelerated artifact is published, its image, per-platform SBOM and exact profile are added
under `optionalArtifacts`. Their absence does not block core/cpu 1.0. An artifact absent from the
manifest is unsupported even if an old registry tag still exists.

`release-manifest.json` is canonical UTF-8 JSON with sorted keys and a trailing newline. It records:

- release version, full source Git SHA, created-at UTC, repository/source archive URL and digest;
- each artifact's role, tier, media type, fully qualified digest, platform set, SBOM path/digest,
  signature identity and attestation predicate identities;
- each Compose file's digest and the exact image digests it references;
- notices/licence/source digests;
- the numeric resource matrix and the native runner receipt for each required platform;
- `contentBundle` as a digest plus producer contract. Before F12-E2, release candidates must use the
  temporary allow-list in §7 and cannot claim the final 1.0 content-bundle discharge.

The manifest is produced exactly once by a repository tool and then verified read-only. Compose,
release upload and the in-app About response consume it; none transcribes image digests manually.
It is a release-local format owned by that one producer/parser and claims no schema/register lane.

### 2. Immutable build inputs

All `FROM` lines use a reviewed multi-platform OCI index digest, with the readable version retained
as a comment. Tags alone are refused. A platform fixture verifies that resolving the index yields
the expected amd64 and arm64 manifest digests before build.

Runtime images do not execute unconstrained `apt-get update`. Choose one of these closed forms per
image:

1. eliminate the package entirely (the unused `netcat-openbsd` package is removed);
2. copy the required artifact from a digest-pinned build stage; or
3. use a dated Debian snapshot plus exact package versions and verify the downloaded `.deb` digests.

F12-C's future `flock` requirement uses form 2 or 3; “latest util-linux in bookworm” is not a pin.

Stockfish retains its exact release/source checksums and complete source. The installer itself is an
input in provenance. Maia stops cloning/installing from live dependency ranges:

- the pinned Maia source archive has a committed SHA-256 and is unpacked without `.git` network
  history;
- the repository patch is applied with its digest recorded;
- `requirements-cpu-linux-{amd64,arm64}.txt` enumerate every Python distribution at exact version
  and wheel hash; install uses `--require-hashes --no-deps`;
- the CPU lock selects CPU-only PyTorch artifacts and contains no package whose normalized name or
  installed files match CUDA, cuDNN, NCCL, TensorRT or NVIDIA runtime families;
- the model snapshot and actual weight file are both SHA-256 checked, not merely tested for
  pathname existence;
- network access is disabled in the final build validation and at runtime.

`pnpm-lock.yaml` remains the JavaScript resolution authority. Build verification rejects lockfile
workspace packages without an explicit licence field and root/application packages must declare
`AGPL-3.0-only`. OS, Python, model, Stockfish, Node base, source archive and lockfile digests appear
as provenance materials.

This RFC requires reproducible **inputs and inventories**, not identical image bytes from two
builders. A rebuild from the same commit must produce set-equal packages/files, source/material
digests and application artifact digests; nondeterministic timestamps are normalized where the
toolchain supports `SOURCE_DATE_EPOCH`. A byte-different image with the same declared inventory is
reported, not quietly called reproducible.

### 3. Workflow authority and isolation

Every non-local `uses:` reference in `.github/workflows/**` is a full 40-character commit SHA. A
same-line comment records the reviewed release tag. A governance check rejects branches, tags,
short SHAs and SHA comments that omit the human version. Dependabot is configured for the
`github-actions` ecosystem so updates arrive as reviewable SHA changes.

Workflow permissions are job-local and least-privilege:

- ordinary verify/browser jobs: `contents: read` only;
- image build before publish: `contents: read`, no package write;
- publish/sign/attest jobs after all verification: `contents: read`, `packages: write`,
  `id-token: write`, `attestations: write`; release-asset publication alone gets `contents: write`;
- no pull-request job receives package, release, OIDC or attestation write authority;
- untrusted pull-request code never enters a privileged `workflow_run` or tag-publish context.

A release tag is eligible only when it points at the exact main-branch commit whose required verify
and browser workflows are green. The release workflow checks that ancestry/status through the
GitHub API before building and refuses a dirty/generated mutation not committed at that SHA.

### 4. Image definitions and FOSS boundary

#### Server image (`core`)

The server image contains only:

- the Node runtime and built server/web artifacts;
- the pinned Stockfish binary plus complete corresponding source/licence;
- schemas and the compiled runtime opening catalogue;
- the temporary/final runtime content bundle from §7;
- Tabiya `LICENSE`, `NOTICE.txt`, exact source/release manifest and required operational docs;
- minimal files required by F12-A/C health/locking.

It contains no package manager cache, compiler, repository history, raw TSV sources, test harness,
candidate/job/source sidecar, local path, planning tree, or arbitrary documentation.

#### Maia CPU image (`cpu`)

The CPU image contains pinned CPython, Maia runtime/source/licence/patch, the exact weight, CPU-only
dependency closure, sidecar and notices. It contains zero proprietary/`LicenseRef-NVIDIA-*` package,
zero CUDA/cuDNN/NCCL/TensorRT library and zero GPU device expectation. CI scans both installed
metadata and files; a renamed package cannot bypass the binary-library census.

The CPU image is FOSS-eligible only after D1 resolves the Maia weight licence with an explicit
upstream statement applying to the distributed weight bytes. Until then its SBOM uses
`LicenseRef-MAIA3-WEIGHTS-UNRESOLVED`, release publication is refused, and core may release alone
only as a pre-1.0/technical-preview artifact. The AGPL code licence is not silently extended to an
independently hosted model file.

#### Accelerated image (`accelerated`, optional)

An accelerated image has a distinct name, Compose profile, SBOM, notice and resource receipt. Its
manifest declares supported architecture, accelerator vendor/model family, minimum driver/API,
host RAM, VRAM, runtime package licences and whether each component is FOSS. A proprietary runtime
is allowed only in this optional artifact with conspicuous wording; it cannot be downloaded by the
default CPU profile or included in its layers.

No floating “GPU” image exists. Publishing the artifact means maintaining and testing its exact
matrix. If no matrix is ready, the 1.0 manifest records no accelerated artifact and the UI/operator
guide says optional acceleration is unavailable—not “auto-detected.”

### 5. Numerical resource contract

The owner-ruled tiers have these initial hard ceilings:

| Tier | Required artifacts | Hard memory limit | Steady-state RSS after warm-up | Peak RSS over release journey | Unpacked image bytes | Cold ready |
|---|---|---:|---:|---:|---:|---:|
| `core` | server | 512 MiB | ≤128 MiB | ≤384 MiB | ≤650 MiB | ≤30 s |
| `cpu` | server + Maia CPU | 2,048 MiB total (512 + 1,536) | ≤1,536 MiB total | ≤1,843 MiB total | ≤2.0 GiB total | ≤120 s |

The numbers are release budgets, not claims that HEAD already passes. They are anchored to R18's
76.42 MiB warm core and 1.31 GiB one-point engine profile, leaving bounded headroom while keeping
the CPU appliance usable on a 2 GiB host. If native proof exceeds them, implementation reduces the
image/runtime or returns this RFC with measured evidence; it does not round the ceiling up after the
fact.

Definitions are exact:

- MiB/GiB are binary units;
- hard memory is the sum of Compose `mem_limit`/cgroup `memory.max`; swap is disabled for the proof;
- steady state is the maximum of five one-second samples after readiness plus five idle minutes;
- peak is the maximum cgroup current/peak value during the F12-H core journey, including import,
  run, rewind, comparison, review, export and backup preparation; CPU adds model startup plus 100
  sequential opponent selections at the widest supported candidate window;
- image bytes are the sum of unique unpacked layer sizes required by that profile on one platform,
  not compressed transfer size and not double-counted shared layers;
- cold ready starts after images are present but with empty writable volumes/cache; network pull is
  separately reported, never mixed with process/model start.

Server caches share one 96 MiB retained-JS-heap budget inside the core peak. Each cache publishes a
bounded weight/entry receipt. This supplies D1580's missing release predicate: D1579's candidate
packet cache passes only if the production weighted population and every other server cache remain
inside the shared 96 MiB budget and total core peak remains ≤384 MiB. A configurable cache with no
measured composed total does not pass.

Accelerated resource numbers are mandatory in its optional manifest but are selected with the
actual supported hardware matrix; they cannot be invented before that artifact exists. They do not
weaken core/cpu limits.

### 6. SBOM and notices

Each platform image receives one SPDX 2.3 JSON SBOM generated from the pushed platform digest, not
from the source tree or builder filesystem. It inventories OS packages, language packages, model,
Stockfish, bundled content/data artifacts, application packages and material file digests. SPDX
`NOASSERTION` is permitted only for explicitly allow-listed operating-system files that the scanner
cannot classify; it is forbidden for application, direct/transitive JS/Python dependencies,
Stockfish, Maia, model weights, content and bundled data.

The scanner tool/image and configuration are version/digest-pinned. A second repository-owned
validator checks the SBOM against the actual image filesystem/package managers and fails on:

- installed component absent from the SBOM;
- declared runtime component absent from the image;
- unknown licence outside the explicit allow-list;
- proprietary/licence-ref component in `server` or `maia-cpu`;
- package/version drift between amd64 and arm64 except a declared architecture-specific base
  package;
- mutable download URL or material without digest;
- secret, token, local absolute path or builder-only path in SBOM/provenance.

`NOTICE.txt` is a deterministic human projection of the validated inventory plus curated override
records. For every component it names component/version, copyright/attribution where supplied,
licence identifier/text location and corresponding source URL/digest. Scanner guesses never
overwrite curated records. The release stores all referenced licence texts under
`/usr/share/doc/chess-tabiya/licenses/` and exposes the same inventory through About.

### 7. Runtime content boundary

F12-E2 ultimately consumes one immutable F3/F4 runtime-content export and its rights manifest. Until
that contract lands, this RFC's implementation uses a temporary **explicit file allow-list** built
from the paths the production loaders actually open. It may include only:

- registered/served pack JSON selected by the existing channel/admission policy;
- registered shapes and principles actually served;
- compiled runtime opening-catalogue artifact;
- schemas required to parse those files;
- exact licence/attribution files required by those artifacts.

It excludes `content/candidates/**`, `*.job.json`, `*.sources.json`, `*.evidence.json`, browser
fixtures, authoring receipts, absolute/local source paths, `planning/**`, and source-fetch tooling.
The current `planning/exploration/log.md` and `docs/tablebase-grounding.md` production dependencies
are architectural debt: the pack-admission compiler must emit the minimal immutable facts the
runtime needs into the bundle. The server image may not retain entire mutable prose files merely
because a runtime assertion currently greps them.

A loader-trace fixture starts the production image with filesystem access logged, executes every
served content family and proves every read is allow-listed. A negative fixture adds a valid-looking
pack/job/local path and proves it cannot enter. F12-E2 replaces the temporary list with its compiled
bundle; it may add eligible runtime files but cannot weaken these exclusions.

### 8. OCI metadata, signatures and attestations

Every image index and platform manifest carries applicable OCI annotations, including title,
description, exact version, full source revision, canonical source URL, created time, licences and
documentation URL. `org.opencontainers.image.source` points to Tabiya's corresponding source, not
upstream Maia merely because the image contains Maia.

The publish job performs, in order:

1. build required platforms from the committed source with provenance materials;
2. push immutable platform manifests and multi-architecture index;
3. scan each pushed platform digest and validate/export its SPDX SBOM;
4. generate the canonical release manifest and Compose artifacts;
5. sign every image index digest using keyless Sigstore/cosign identity bound to the release
   workflow and repository;
6. create GitHub build-provenance and SBOM attestations for each image subject/digest;
7. attest the source archive, Compose files, release manifest, notices and `SHA256SUMS` as release
   artifacts;
8. verify signatures and attestations from a fresh job with no build workspace before creating the
   GitHub release.

Action tags, mutable image tags and the GitHub release page are discovery aids only. Compose uses
digests. Verification binds repository, workflow path, tag/ref, issuer, subject name and digest;
“a valid Sigstore signature by anyone” is insufficient.

The release includes online and offline verification instructions. Offline verification receives
the attestation/signature bundles, trusted certificate/transparency material required by the chosen
tooling, source/SBOM files and checksum manifest. It does not promise revocation freshness while
offline.

### 9. Corresponding source and visible legal surface

The source archive is built from the exact release commit and contains all Tabiya source, schemas,
patches, lockfiles, Dockerfiles, workflow/build scripts and runtime-content source needed to modify
and rebuild the released application. It excludes `.git`, caches, secrets and generated local
results. Pinned third-party source archives may be separate release assets if the manifest names and
hashes them; Stockfish and Maia source remain available inside their respective images as well.

Every server response shell has one persistent “Licence & source” link to an About route. That route
shows:

- Tabiya name/version/full revision and AGPL-3.0-only licence;
- no-warranty notice;
- exact corresponding-source link for this revision;
- release manifest and SBOM/notices download links;
- selected deployment/resource tier and image digest;
- concise notice that optional accelerated artifacts may carry separately disclosed non-FOSS
  runtime components.

It does not dump the SBOM into ordinary chess UI. The same machine-readable data is available from
an unauthenticated read-only `/about/release` endpoint so operators can inspect a fresh appliance.
The endpoint contains no environment secrets, host paths, learner data or provider tokens.

### 10. Multi-architecture verification

`server` and `maia-cpu` support `linux/amd64` and `linux/arm64`. Each is built once per platform and
assembled into the published index. Functional smoke runs natively on pinned Ubuntu 24.04 x64 and
`ubuntu-24.04-arm`; GitHub documents both standard hosted architectures:
<https://docs.github.com/en/actions/reference/runners/github-hosted-runners>.

Each native job pulls by platform digest and proves:

- reported architecture matches the manifest;
- application/provider readiness and one complete core/CPU journey;
- Stockfish/Maia identity and model/source digests;
- provider-off and process-restart behavior;
- SBOM/filesystem/package equality;
- the numerical resource/startup envelope.

QEMU may test install/boot compatibility but cannot produce the resource/latency receipt. If the
arm64 hosted runner is unavailable because it remains a preview service, a named native arm64
self-hosted/release runner supplies that blocking receipt; emulation is not silently substituted.

## Implementation plan

### Phase 1 — freeze inputs and split images

1. Add full-SHA action-policy verification and pin all existing workflow actions.
2. Digest-pin base images; remove unused netcat; checksum source/model inputs; add per-architecture
   hashed CPU dependency locks.
3. Split `maia-cpu` from optional accelerated packaging and add the negative CUDA/proprietary census.
4. Add OCI labels and embed exact Tabiya/third-party source/licence material.

### Phase 2 — inventory and legal/source surface

5. Generate per-platform SPDX SBOMs and curated `NOTICE.txt`; build the filesystem↔SBOM validator.
6. Add the canonical release manifest/source archive/checksums.
7. Add About UI/API from the embedded manifest.
8. Replace `COPY content content` with the traced temporary runtime allow-list and route the final
   F3/F4 join to F12-E2.

### Phase 3 — budgets and native proof

9. Add Compose cgroup limits and one deterministic resource-journey harness.
10. Run native amd64/arm64 core and CPU jobs, recording layer bytes/startup/steady/peak/cache heap.
11. Optimize or return on any red budget; never rewrite the receipt after loosening a constant.

### Phase 4 — sign, attest and publish

12. Add keyless image signatures and build/SBOM attestations with least-privilege job permissions.
13. Verify all subjects from a clean job, then publish the release set and immutable Compose files.
14. Add a consumer drill that downloads only the release set, verifies it, installs, runs and
    identifies the exact revision without a source checkout.

## Acceptance criteria

### Fresh independent return (2026-08-30)

Exact return:
`planning/verifiable-runtime-distribution/fresh-independent-buildability-review-2026-08-30.md`.
Before the criteria below are buildable, the author must:

1. register and define the versioned release-manifest protocol consumed by generation,
   verification, Compose, About/API, upload and clean-host install ([[D2206]]);
2. break the digest cycle in which the server image embeds the exact release manifest that records
   the server image digest ([[D2207]]);
3. publish one closed, versioned SPDX-expression/override policy for “FOSS-eligible” rather than
   leaving licence classification to scanner or implementer judgement ([[D2208]]); and
4. bind the CPU resource journey to one accepted production bot profile/route and exact candidate
   window instead of a test-created profile while `BOT_POLICY_PROFILES` is empty ([[D2209]]).

After repair, another fresh independent review and the unresolved dependency/weight-licence gates
still precede implementation or acceptance.

1. `server` and `maia-cpu` publish amd64/arm64 indexes whose platform manifests are all digest-pinned
   in one canonical release manifest; Compose contains no tag-only image reference.
2. Every external workflow action is a reviewed full 40-character SHA with a human version comment;
   a fixture using `@v7`, a branch or short SHA fails governance.
3. Privileged publish/attest permissions exist only in post-verification tag jobs. A pull-request
   fixture cannot acquire package, release, OIDC or attestation write authority.
4. Every base image, OS/Python/JS dependency, upstream source, patch, model and Stockfish artifact is
   version/digest-closed and appears as provenance material. A changed live resolver cannot alter the
   accepted inventory.
5. `maia-cpu` contains zero CUDA/NVIDIA/cuDNN/NCCL/TensorRT/proprietary package or library on both
   architectures; its total profile image size is ≤2.0 GiB.
6. D1 records an explicit weight licence applying to the distributed Maia weight bytes. Without it,
   release publication fails even if an automated scanner guesses AGPL or CC-BY.
7. Per-platform SPDX 2.3 SBOMs are generated from pushed digests and are set-equal to actual package/
   filesystem inventories under the declared exceptions. Unknown/proprietary items fail core/cpu.
8. `NOTICE.txt`, all referenced licence texts, corresponding-source archive and exact source link
   ship in release assets and images; the About UI/API exposes the same revision/digests.
9. The production server image contains zero candidate/job/source/evidence sidecar, authoring tool,
   planning tree, browser fixture or absolute/local source path. A loader trace proves the allow-list
   is sufficient for every served family.
10. Core passes 512 MiB hard / 128 MiB steady / 384 MiB peak / 650 MiB image / 30 s cold-ready limits
    natively on amd64 and arm64.
11. CPU passes 2,048 MiB hard / 1,536 MiB steady / 1,843 MiB peak / 2.0 GiB images / 120 s cold-ready
    limits natively on amd64 and arm64.
12. The composed server cache population, including D1579's weighted candidate packets, retains at
    most 96 MiB JS heap and remains inside core peak; 10× attempted population demonstrates eviction
    rather than growth.
13. Every image index is keylessly signed and has build-provenance plus SBOM attestations bound to
    the exact repository/workflow/tag/digest. A clean verification job and documented consumer
    commands reject a signature from another identity or an attestation for another digest.
14. Source archive, Compose profiles, release manifest, notices and checksum file have verified
    release-artifact attestations; changing one byte fails before install.
15. Native amd64/arm64 receipts include architecture, runner image, artifact digests, package/content
    census, readiness, steady/peak memory and journey result. QEMU receipts cannot satisfy resource
    criteria.
16. An optional accelerated artifact, if published, has an exact hardware/runtime/licence/resource
    matrix and never appears in default/core/cpu layers. Its absence is explicitly reported, not
    advertised as auto-detected support.
17. `make verify`, packaging/SBOM/action-policy/resource tests, native release smokes and the exact
    local/GitHub required CI commands pass on the tagged committed bytes before publication.

## Falsifiers and negative fixtures

The implementation is rejected if any of these can pass:

- `FROM node:24...` or `uses: actions/checkout@v7` remains accepted as immutable;
- two builds from the same source resolve a different package/model/base material without failing;
- an SBOM produced from the source tree passes for a pushed image containing an extra package;
- a renamed CUDA shared library survives the CPU image because only package names were checked;
- a model card's paper licence is automatically assigned to the weight file;
- a valid signature by the wrong repository/workflow verifies;
- one platform manifest lacks an SBOM while the multiarch index has a generic SBOM;
- the core journey passes by using swap above its cgroup limit;
- resource gates run under QEMU and claim native performance;
- `COPY content content`, `planning/exploration/log.md`, a `.job.json` file or `/private/tmp/...`
  survives in the production server image;
- About links to the moving main branch rather than the exact released source revision;
- publishing only a digest-pinned Compose file is treated as signing/provenance.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Obtain and record an explicit upstream licence statement that applies to the exact Maia3-5M weight bytes, or replace/remove that model from the required CPU tier | OWNER | pinned upstream source, exact weight revision/digest, notice record and release-proof receipt | |
| D2 | Replace the temporary runtime allow-list with F3/F4's immutable rights-cleared runtime-content bundle | `planning/platform-alignment/release-platform/` | bundle compiler receipt, image negative census and exploration-log entry | |
| D3 | Verify the final signed/attested release set, core/cpu resource matrix and clean-host install on the release candidate | `planning/platform-alignment/release-platform/` F12-H | published release-proof receipt and exploration-log entry | |

## Open questions

No further owner choice is needed to review the mechanism. Owner acceptance of this RFC also adopts
the numerical core/cpu ceilings in §5; they are the only materially new product decision in the
draft. If the owner does not want a 2 GiB CPU appliance floor, return the RFC with the preferred
supported-host target before implementation—do not let the build choose the product after the fact.

The accelerated implementation/hardware matrix remains optional. Publishing one requires an
implementation amendment with exact platform and resource numbers, but omitting it does not weaken
the owner-ruled `core` and `cpu` 1.0 floor.

## Changelog

- 2026-08-30 — fresh independent review returned the draft on [[D2206]]–[[D2209]]. Exact return:
  `planning/verifiable-runtime-distribution/fresh-independent-buildability-review-2026-08-30.md`;
  reproduction: `make runtime-distribution-fresh-review`. No workflow, production, image, schema,
  content or protected-design byte changed.
