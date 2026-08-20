# R18 release-platform audit — measured results

**Measured:** 2026-08-20

**Product baseline:** `24430fed2fd1c354dbf2091cf6e07c411867a085`

**Host:** Darwin arm64; Docker client/server 28.4.0; Linux/arm64 container runtime; 14 CPUs;
16,748,445,696 bytes memory; overlay2. The product was extracted with `git archive` to
`/private/tmp/chess-r18-clean-24430fe`; the unrelated dirty working tree was not built.

This is a compact command/result record. Interpretation and release consequences are in
`design/research/release-platform-audit.md`.

## Deployment arms

| Arm | Result |
|---|---|
| Compose validation | Root default, root `engines`, rendered release default and rendered release `engines` configurations validate. The unrendered release file intentionally contains image placeholders. |
| Default image build | Cache-warm clean build: 10.134 s. Image `sha256:eb38c642…d479`, 490,016,169 bytes, linux/arm64. This is not a cold-network build measurement. |
| Default start | Isolated project `tabiya-r18`, host port 43180, new named volume. Health passed after migrations 1–23. Initial idle snapshot: 53.3 MiB, 11 PIDs. A later snapshot after the browser probe was 76.42 MiB, 11 PIDs. |
| Provider-off capabilities | opponent `mock`; judge `mock`; LLM/corpus/TTS/tablebase `none`; `human_common`, `strong_engine`, `theory_strict` policy names remain available through deterministic fixtures. Fifty packs were served. |
| Provider-off journey | Registered a disposable learner, opened `anti-caro-advance-c5-race`, selected/applied the mock opponent reply `c8f5`, committed `g1f3`, restarted the server, and recovered the run. No cloud credential was configured. |
| Named refusal control | An explicit `perfect_tablebase` selection returned typed HTTP 503 `TABLEBASE_UNAVAILABLE`; it did not silently substitute another policy. |
| Maia image build | Cache-warm clean build: 2.146 s. Image `sha256:916337b9…f3c`, 5,109,189,363 bytes, linux/arm64. |
| Engine-on start | Compose returned in 6.143 s; both services became healthy in the next 10–15 s observation interval. One idle snapshot: server 607.5 MiB/16 PIDs; Maia 706.6 MiB/28 PIDs. One `human_common` selection returned `c8f5` in 0.257 s. |
| Engine-on capabilities | opponent Maia3 pinned source/model; Stockfish 18 judge; public Lichess tablebase; LLM/TTS `none`; corpus `none` without a Lichess token. Five policy modes were advertised. |
| Maia-loss negative control | After stopping only Maia, an exact cached selection returned HTTP 200 in 2 ms, demonstrating that a cache hit cannot measure provider health. |
| Maia-loss request | A changed-position/cache-miss `human_common` request returned no bytes before the client-side 10.006 s timeout. `/capabilities` still advertised Maia and all five modes before and after. |

## Data lifecycle arm

Before deletion the disposable database held one learner, one session, one run, one grant, one
attempt and one schedule. `POST /auth/delete` returned 200 and expired the cookie; the prior session
then returned 401. After deletion, the attempt and schedule were gone, but the solo run remained:
its owner, writer and restored host grant were reassigned to `__legacy`. No run-delete route exists.
`GET /auth/export` returned 405. The database plus WAL/SHM occupied about 388 KiB at this scale.

Source tracing confirms the broader policy: learner/session/progress rows cascade; marks and
repertoires are deleted; mutable drafts are withdrawn and reassigned; registered packs/shapes,
live-session provenance and owned runs are reassigned; imported run history therefore survives with
the run. The UI discloses only that “Shared runs are reassigned.”

The named SQLite volume survives service restart and startup performs in-place migrations. No
documented backup, restore, pre-upgrade snapshot, rollback or recovery command exists, so no
invented manual database-copy procedure was promoted into a supported arm.

## Browser and accessibility arm

The machine-readable result is `browser-results.json`; the disposable instrument is
`tools/r18-release-platform-harness/`.

| Probe | Result |
|---|---|
| Board accessibility tree | One non-ignored `generic` node named `Chessboard`; no square/piece names or interactive state. |
| Board DOM | Outer `div`, `tabIndex=-1`, zero focusable descendants, zero named descendants. |
| Keyboard traversal | The first 11 tabs reached shell links/buttons. After reaching the Assistance `<summary>`, the next 28 Tab presses remained on that same element because the drill region owns unmodified Tab as Compare. |
| Disabled-control reasons | 0 failures in the tested run; all disabled controls referenced visible reason text. |
| 390×844 | Board 192×192 at y=688.52, bottom=880.52: below the 844 px fixed viewport while reported document overflow remains zero. This corroborates A2/D573 rather than replacing its exact-UCI gesture test. |
| 768×1024 | Board 244.33×244.33, bottom=862.41, no document overflow in the resting state. |
| 1440×1000 | Board 284.30×284.30, bottom=838.41, no document overflow in the resting state. |
| Reduced motion/PWA | Probe emulated reduced motion; zero active animations. A manifest link exists; zero service-worker registrations. |

This is DOM/Chromium accessibility-tree evidence only. No screen-reader user or physical-device
participant took part. A2 remains the stronger input result: 4/90 exact authored UCIs over
click/drag/touch, with 15 wrong legal moves and 71 missing requests; at 390×844 every gesture was
0/6 exact.

## Rights and package arm

| Artifact | Measured fact |
|---|---|
| Project | Repository `LICENSE` is AGPL-3.0; the root package manifest has no licence field. The shipped server image contains neither that licence nor a visible source/legal route. |
| Direct JS runtime dependencies | Ajv 8.17.1 MIT; ajv-formats 3.0.1 MIT; chessops 0.15.1 GPL-3.0-or-later; Chessground 10.1.1 GPL-3.0-or-later; Svelte 5.56.8 MIT. No generated transitive inventory ships. |
| Stockfish | Version 18, commit `cb3d4ee9b47d0c5aae855b12379378ea1439675c`, release/source SHA-256 pins. Binary image includes GPLv3 text and the complete pinned source tree. |
| Maia code/weights | Source commit `1e13597…364b2`, model revision `b6559de…ddabe`; weight digest `ba14208b…2524f`, about 21 MiB. Image contains Maia's AGPL source, licence and applied patch. The pinned model card says “CC BY 4.0 (paper); see repo for code/weights license,” so F12 must state the resolved weight basis instead of treating the sentence as a standalone SPDX declaration. |
| Maia transitive image | Installed metadata reports 18 CUDA/NVIDIA packages; 15 identify as NVIDIA proprietary/LicenseRef. This payload accompanies CPU use and dominates the 5.11 GB image. |
| Runtime content | `/app/content` is about 3.8 MiB: drafts about 2.5 MiB, candidates 892 KiB, shapes 260 KiB, principles 56 KiB, packs 8 KiB. The image copies the authoring corpus wholesale. Five manifests include an absolute `/private/tmp/claude-501/-Users-stronk-…` source path. |
| Content-source census | 404 JSON documents, 74 source manifests and 873 source entries in the packaging scan; 35 entries use an SPDX basis and 838 say no-rights-asserted. This is primarily a grounding/provenance debt already governed by Gate F/D560, but it expands the distributed release review because non-runtime authoring material is shipped. |
| Assets/fonts | No bundled font file was found; the client uses system font stacks. No analytics/telemetry SDK or endpoint was found. |

The release workflow builds amd64/arm64 images, publishes version/SHA tags and emits a digest-pinned
Compose file. It does not generate an SBOM, third-party notices, signature or build attestation.

## Reproduction notes

- The audit project's server container is stopped during closeout; its isolated named volume is
  retained rather than deleted.
- Exact image sizes and package inventories came from the built images, not Dockerfile inference.
- External rights checks used the pinned Maia source licence/model card, Stockfish licence and
  Lichess database licence pages linked in the dossier.
