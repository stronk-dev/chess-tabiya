// rfc/verifiable-runtime-distribution.md §4/§8 step 1 — pre-image release inputs.
//
// Everything an image embeds is generated here, before any image exists, from committed inputs:
// the curated NOTICE.txt and licence texts, build-metadata.json and the runtime-content bundle.
// Nothing here knows (or may know) an image, SBOM, Compose, signature, attestation or release-
// manifest digest; the post-push checks validate these same bytes and never regenerate them.
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { REPO_ROOT, REVISION, canonicalJson, readJson, sha256Digest } from "./common.mjs";
import { javascriptInventory } from "./js-inventory.mjs";
import { planRuntimeContent, RUNTIME_CONTENT_FACTS, RUNTIME_CONTENT_MANIFEST } from "./runtime-content.mjs";
import { evaluateComponent, evaluateExpression, loadFossPolicy } from "./spdx.mjs";

export const DEFAULT_REPOSITORY = "https://github.com/stronk-dev/chess-tabiya";
/** Where the embedded legal/build surface lives inside the server image. */
export const LEGAL_DIRECTORY = "/usr/share/doc/chess-tabiya";
export const VERSION = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/u;

function rule(title) {
  return `${"=".repeat(78)}\n${title}\n${"=".repeat(78)}\n`;
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

/**
 * Generates the pre-image inputs into `out`:
 *   out/app/**                 → copied to /app (runtime-content bundle + facts)
 *   out/doc/**                 → copied to /usr/share/doc/chess-tabiya (NOTICE, LICENSE, licences, build metadata)
 *   out/pre-image.json         → the digests later nodes of the release graph consume
 */
export function generatePreImage({ root = REPO_ROOT, out, version, revision, repository = DEFAULT_REPOSITORY }) {
  if (!VERSION.test(version ?? "")) throw new TypeError(`release version must be semver without a leading v: ${version}`);
  if (!REVISION.test(revision ?? "")) throw new TypeError("source revision must be 40 lowercase hex");
  rmSync(out, { recursive: true, force: true });
  const policy = loadFossPolicy({ root });
  const materials = readJson(resolve(root, "release/materials.v1.json"));
  const bundle = planRuntimeContent({ root });
  const inventory = javascriptInventory({ root });

  // Runtime-content bundle staged at its /app-relative paths.
  for (const file of bundle.manifest.files) {
    const target = join(out, "app", file.path);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(resolve(root, file.path), target);
  }
  write(join(out, "app", RUNTIME_CONTENT_FACTS), bundle.factsText);
  write(join(out, "app", RUNTIME_CONTENT_MANIFEST), canonicalJson(bundle.manifest));

  // Licence evaluation of every pre-image component; the notice is refused if any fails.
  const failures = [];
  const texts = new Set();
  const evaluate = (label, component) => {
    const result = evaluateComponent({ scanner: { id: "tabiya-materials", version: "1" }, ...component }, policy);
    if (!result.pass) failures.push(`${label}: ${result.failures.join("; ")}`);
    result.texts.forEach((id) => texts.add(id));
    return result.expression;
  };
  const tabiyaExpression = evaluate("chess-tabiya", { purl: "pkg:github/stronk-dev/chess-tabiya", version, artifactDigest: undefined, declaredExpression: "AGPL-3.0-only" });
  const contentLicences = [...new Set(bundle.manifest.files.map((file) => file.licence))].sort();
  for (const expression of contentLicences) {
    const result = evaluateExpression(expression, policy);
    if (!result.pass) failures.push(`runtime content ${expression}: ${result.failures.join("; ")}`);
    result.texts.forEach((id) => texts.add(id));
  }
  const nodeExpression = evaluate("node", { purl: `pkg:generic/node@${materials.nodeRuntime.version}`, version: materials.nodeRuntime.version, declaredExpression: materials.nodeRuntime.declaredExpression });
  const stockfishExpression = evaluate("stockfish", { purl: `pkg:github/official-stockfish/Stockfish@sf_${materials.stockfish.version}`, version: materials.stockfish.version, declaredExpression: materials.stockfish.declaredExpression });
  const packages = inventory.map((component) => ({ ...component, expression: evaluate(component.purl, component) }));
  if (failures.length > 0) throw new TypeError(`pre-image licence policy refused:\n- ${failures.join("\n- ")}`);

  const nodeNotice = readFileSync(resolve(root, materials.nodeRuntime.notice.path));
  if (sha256Digest(nodeNotice) !== materials.nodeRuntime.notice.sha256) throw new TypeError("Node.js notice does not match its material digest");

  const sections = [];
  sections.push(`${rule("Tabiya — third-party and licence notices")}
This file is generated from committed inputs before the image is built
(rfc/verifiable-runtime-distribution.md §6). It is a human projection of the
licence inventory; it is engineering provenance, not legal advice.

Tabiya ${version} (source revision ${revision})
Licence: ${tabiyaExpression} — ${LEGAL_DIRECTORY}/LICENSE
This program comes with ABSOLUTELY NO WARRANTY, to the extent permitted by law.
Corresponding source: ${repository}/tree/${revision}
Licence texts: ${LEGAL_DIRECTORY}/licenses/<SPDX-id>.txt (SPDX License List ${policy.spdxLicenseListVersion})
FOSS policy: release/foss-policy.v1.json ${policy.digest}
`);
  sections.push(`${rule("Runtime content")}
Producer: ${bundle.manifest.producer} (temporary allow-list; final discharge: ${bundle.manifest.finalDischarge})
Bundle digest: ${bundle.manifest.digest}
Files: ${bundle.manifest.files.length} (manifest at /app/${RUNTIME_CONTENT_MANIFEST})
${contentLicences.map((expression) => {
    const families = [...new Set(bundle.manifest.files.filter((file) => file.licence === expression).map((file) => file.family))].sort();
    return `  ${expression}: ${families.join(", ")}`;
  }).join("\n")}
Authored drill prose is published under CC BY-SA 4.0; the compiled opening catalogue is derived from
${materials.openingSource.repository} at ${materials.openingSource.commit} (${materials.openingSource.declaredExpression}).
`);
  sections.push(`${rule(`Node.js ${materials.nodeRuntime.version}`)}
Licence: ${nodeExpression} — verbatim upstream LICENSE at ${LEGAL_DIRECTORY}/licenses/node-LICENSE.txt (${materials.nodeRuntime.notice.sha256})
${materials.nodeRuntime.note}
Source: ${materials.nodeRuntime.source}
`);
  sections.push(`${rule(`Stockfish ${materials.stockfish.version}`)}
Licence: ${stockfishExpression} — ${LEGAL_DIRECTORY}/licenses/${materials.stockfish.declaredExpression}.txt
Complete corresponding source inside this image: ${materials.stockfish.imageSource}
Upstream source: ${materials.stockfish.sourceArchive.url} (${materials.stockfish.sourceArchive.sha256})
Release binary (linux/amd64): ${materials.stockfish.x86Archive.url} (${materials.stockfish.x86Archive.sha256})
`);
  sections.push(`${rule("Operating-system packages")}
The Debian bookworm packages of ${materials.baseImages.find((image) => image.id === "node-runtime").repository}@${materials.baseImages.find((image) => image.id === "node-runtime").index}
retain their upstream copyright files at /usr/share/doc/<package>/copyright. Their exact inventory and
licence evaluation are recorded per platform in the release SBOM (sbom/server-linux-<arch>.spdx.json).
Corresponding source: ${materials.debianSnapshots.find((snapshot) => snapshot.baseImage === "node-runtime").archive}
`);
  sections.push(`${rule("Bundled JavaScript packages")}
Resolved by pnpm-lock.yaml; bundled into the server and web artifacts.
`);
  for (const component of packages) {
    sections.push(`--- ${component.name} ${component.version}
Licence: ${component.expression}
Source: ${component.source} (${component.integrity})
${component.licenseFiles.length === 0 ? "(The package ships no separate licence file; the SPDX text applies.)\n" : component.licenseFiles.map((file) => `[${file.file} ${file.sha256}]\n${file.text.trimEnd()}\n`).join("\n")}`);
  }
  const notice = `${sections.join("\n")}`;
  write(join(out, "doc", "NOTICE.txt"), notice);
  copyFileSync(resolve(root, "LICENSE"), join(out, "doc", "LICENSE"));
  for (const id of [...texts].sort()) {
    const entry = policy.texts.get(id);
    write(join(out, "doc", "licenses", `${id}.txt`), readFileSync(resolve(root, entry.path)));
  }
  write(join(out, "doc", "licenses", "node-LICENSE.txt"), nodeNotice);

  const noticeDigest = sha256Digest(Buffer.from(notice));
  const buildMetadata = {
    format: "tabiya-build-metadata",
    formatVersion: 1,
    release: { version, sourceRevision: revision, repository, sourceUrl: `${repository}/tree/${revision}` },
    buildInputs: {
      materials: sha256Digest(readFileSync(resolve(root, "release/materials.v1.json"))),
      pnpmLock: sha256Digest(readFileSync(resolve(root, "pnpm-lock.yaml"))),
      baseImages: Object.fromEntries(materials.baseImages.map((image) => [image.id, `${image.repository}@${image.index}`]).sort(([left], [right]) => left.localeCompare(right))),
      stockfishSource: materials.stockfish.sourceArchive.sha256,
      stockfishX86Archive: materials.stockfish.x86Archive.sha256,
      stockfishInstaller: sha256Digest(readFileSync(resolve(root, materials.stockfish.installer))),
      openingSource: materials.openingSource.commit,
    },
    fossPolicy: { version: 1, digest: policy.digest },
    notice: { path: `${LEGAL_DIRECTORY}/NOTICE.txt`, digest: noticeDigest },
    runtimeContent: { producer: bundle.manifest.producer, digest: bundle.manifest.digest, finalDischarge: bundle.manifest.finalDischarge },
  };
  const buildMetadataText = canonicalJson(buildMetadata);
  write(join(out, "doc", "build-metadata.json"), buildMetadataText);
  const summary = {
    format: "tabiya-pre-image",
    formatVersion: 1,
    version,
    sourceRevision: revision,
    buildMetadata: sha256Digest(Buffer.from(buildMetadataText)),
    notice: noticeDigest,
    fossPolicy: policy.digest,
    runtimeContent: { producer: bundle.manifest.producer, digest: bundle.manifest.digest, finalDischarge: bundle.manifest.finalDischarge },
    licenceTexts: [...texts].sort(),
    javascriptComponents: packages.map((component) => ({ purl: component.purl, expression: component.expression, integrity: component.integrity })),
  };
  write(join(out, "pre-image.json"), canonicalJson(summary));
  return Object.freeze({ summary, buildMetadata, bundle, notice });
}
