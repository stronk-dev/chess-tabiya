# Verifiable runtime distribution — implementation receipt (2026-09-24)

- **Direction:** owner-directed implementation with no review round; genuine RFC defects fixed inline
  (RFC changelog 2026-09-24), everything else became a test.
- **Claims:** none (the `release-manifest-schema` register claim remains blocked by [[D2363]]).
- **Canonical description:** `docs/release.md`.

## What landed

| RFC § | Mechanism | Evidence (tests) |
|---|---|---|
| §2 inputs | `release/materials.v1.json`; digest-pinned `FROM`/syntax lines; `ADD --checksum` for Stockfish archives, NNUE nets, pnpm, Maia source and weight; snapshot-only exact-version apt in build stages; hashed per-arch Maia locks; `tools/release/base-images.mjs` platform fixture | `inputs.test.mjs` criterion 4/5 + falsifiers |
| §3 workflows | full-SHA pins with version comments, `permissions: {}`, job-local least privilege, native amd64/arm64 build → publish → native proof → release set → sign/attest → fresh verify → release; Dependabot | `workflow-policy.test.mjs` criteria 2/3 |
| §4 images | server (`core`) with no package manager/netcat/compiler/prose; Maia CPU with no GPU component, `--network=none` validation, non-root | `inputs.test.mjs`, `maia.test.ts`, image census in `release-verify-local` |
| §1/§8 manifest | `packages/schema/src/release-manifest` (schema + validator + canonical form), projected schema, Compose generation, manifest once, SHA256SUMS, acyclic graph | `release-set.test.mjs` (8 tests incl. ajv agreement and byte-tamper) |
| §6 SPDX policy | `release/foss-policy.v1.json` + SPDX 3.29.0 texts; AST evaluator (AND/OR/WITH/LicenseRef, exact overrides, D1 isolation); SBOM augmentation/reconciliation/drift | `spdx.test.mjs` (10), `gates.test.mjs` |
| §7 content | temporary allow-list + compiled facts; `TABIYA_RUNTIME_CONTENT_FACTS` | `inputs.test.mjs` criterion 9, `runtime-content-facts.test.ts`, loader trace in `release-verify-local` |
| §9 About | `/about`, `/about/release`, NOTICE/LICENSE/manifest downloads; mounted-index join refuses startup | `release-about.test.ts`, `ShellFrame.legal-link.test.ts`, mounted/foreign-subject boots |

## Local proof (`make release-verify-local-maia`, arm64 Docker Desktop, merge commit `2a2b117e`)

- Server image 490,409,042 bytes; cold ready 7.4 s; loader trace 160 allow-listed reads, 0
  violations, every served family exercised; About reports the exact revision and AGPL; mounted
  index `verified`; a foreign server subject refuses startup (`RELEASE_INDEX_REFUSED`).
- SBOM: 121 components; every application component passes the §6 gate; 68 Debian base packages
  carry non-canonical upstream expressions and await owner-approved exact overrides.
- **Core steady state 155.7 MiB working set (VmRSS 208 MiB) against the 128 MiB ceiling; peak
  175.6 MiB within 384 MiB.** Reported, not loosened. The ceiling was anchored on R18's 76.42 MiB
  at migration 23; the server has since grown (longitudinal worker thread, concept registry,
  migrations 24–29). Either the runtime shrinks or the RFC returns with this measurement.
- Maia CPU image 996,408,736 bytes (cpu profile 1.49 GB ≤ 2.0 GiB); zero CUDA/NVIDIA distribution
  or library; weight digest verified. Licence report: D1 weight unresolved plus nine Python
  components whose metadata is not canonical SPDX (chess, python-chess `GPL-3.0+`; jinja2, mpmath,
  sympy `BSD`; four setuptools-vendored packages).

## Still open (publication gates)

D1 weight rights; owner-approved curated records (Debian base, Python metadata); D2 final content
bundle; F12-H `core.release_journey@1` and the bot production route (receipts cannot enter a
1.0 manifest without them); core steady-state excess; D3 native CI proof on real runners (the
workflow has never run — nothing was pushed, tagged or triggered).
