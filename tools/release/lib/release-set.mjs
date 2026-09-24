// rfc/verifiable-runtime-distribution.md §1/§8 — the post-image release set: digest-pinned Compose
// profiles, the release manifest (generated once, verified read-only), SHA256SUMS and the acyclic
// artifact graph that orders them.
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  canonicalReleaseManifest,
  isPrerelease,
  parseReleaseManifest,
  validateReleaseManifest,
} from "../../../packages/schema/src/release-manifest/index.ts";
import { renderDeployment } from "../../render-deployment.mjs";
import { DIGEST, sha256Digest, sha256Hex } from "./common.mjs";

export const RELEASE_MANIFEST_NAME = "release-manifest.json";
export const CHECKSUMS_NAME = "SHA256SUMS";
export const PROVENANCE_PREDICATE = "https://slsa.dev/provenance/v1";
export const SBOM_PREDICATE = "https://spdx.dev/Document/v2.3";
const SUBJECT = /^[a-z0-9.-]+(?::[0-9]+)?\/[a-z0-9._/-]+@sha256:[0-9a-f]{64}$/u;

export function releaseFile(root, path) {
  const bytes = readFileSync(resolve(root, path));
  return { path, bytes: bytes.length, sha256: sha256Digest(bytes) };
}

// ---------------------------------------------------------------------------------------------
// Deployment files. tools/render-deployment.mjs (rfc/safe-deployment-profiles.md,
// rfc/storage-backup-recovery.md) is the one renderer of the six deployment files; this module only
// places them in the release set, strips the Maia sidecar when a release withholds it (D1), and
// records which manifest artifacts each Compose profile references.

/** Compose profile → published file. */
export const COMPOSE_FILES = Object.freeze({ local: "compose.yaml", appliance: "compose.appliance.yaml", hosted: "compose.hosted.yaml" });
/** The remaining rendered deployment files, listed in the manifest's `files`. */
export const DEPLOYMENT_SUPPORT_FILES = Object.freeze(["Caddyfile.appliance", "Caddyfile.hosted", "compose.maintenance.yaml"]);
export const DEPLOYMENT_FILES = Object.freeze([...Object.values(COMPOSE_FILES), ...DEPLOYMENT_SUPPORT_FILES]);

/**
 * Removes the optional Maia sidecar (and the server's optional dependency on it) from a rendered
 * Compose file: a release that withholds maia-cpu (D1) publishes no reference to an image it did
 * not publish.
 */
export function withoutMaia(text) {
  const lines = text.split("\n");
  const out = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^  maia:\s*$/u.test(line)) {
      while (out.length > 0 && /^  #/u.test(out.at(-1))) out.pop();
      index += 1;
      while (index < lines.length && (lines[index] === "" ? /^ {4}/u.test(lines[index + 1] ?? "") : /^ {4}/u.test(lines[index]))) index += 1;
      index -= 1;
      continue;
    }
    if (/^ {4}depends_on:\s*$/u.test(line) && /^ {6}maia:\s*$/u.test(lines[index + 1] ?? "")) {
      const block = [];
      let next = index + 2;
      while (next < lines.length && /^ {8}/u.test(lines[next])) block.push(lines[next++]);
      if (block.every((entry) => /condition: service_healthy|required: false/u.test(entry)) && !/^ {6}\S/u.test(lines[next] ?? "")) {
        index = next - 1;
        continue;
      }
    }
    if (/^ {6}MAIA_(?:HOST|PORT):/u.test(line)) continue;
    out.push(line);
  }
  return out.join("\n");
}

const WITHHELD = `localhost/maia-withheld@sha256:${"0".repeat(64)}`;

/**
 * Renders the six deployment files for a release into `dir`. `maia` is `{ subject, manifestDigest,
 * configDigest }`, or null when the release withholds maia-cpu (the sidecar is then removed).
 */
export function writeReleaseDeployment(dir, { serverSubject, maia = null }) {
  const rendered = renderDeployment({
    serverImage: serverSubject,
    maiaImage: maia?.subject ?? WITHHELD,
    maiaManifestDigest: maia?.manifestDigest ?? `sha256:${"0".repeat(64)}`,
    maiaConfigDigest: maia?.configDigest ?? `sha256:${"0".repeat(64)}`,
  });
  for (const [name, text] of Object.entries(rendered)) {
    const final = maia === null ? withoutMaia(text) : text;
    if (final.includes(WITHHELD)) throw new TypeError(`${name} still references the withheld Maia image`);
    writeFileSync(resolve(dir, name), final);
  }
  return Object.keys(rendered).sort();
}

/** Every `image:` reference in a Compose text; tag-only references are returned as findings. */
export function composeImages(text) {
  const images = [...text.matchAll(/^\s*image:\s*(\S+)\s*$/gmu)].map((match) => match[1]);
  // A readable tag beside the digest (`caddy:2.11.4-alpine@sha256:…`) is still digest-pinned; the
  // subject is the name plus digest.
  const pinned = (image) => /^(?<name>[a-z0-9.-]+(?::[0-9]+)?\/[a-z0-9._/-]+)(?::[A-Za-z0-9._-]+)?@(?<digest>sha256:[0-9a-f]{64})$/u.exec(image);
  return {
    subjects: [...new Set(images.flatMap((image) => { const match = pinned(image); return match === null ? [] : [`${match.groups.name}@${match.groups.digest}`]; }))].sort(),
    tagOnly: images.filter((image) => pinned(image) === null),
  };
}

// ---------------------------------------------------------------------------------------------
// Manifest generation (once) and read-only verification.

export function signatureIdentity(repository, version) {
  return `${repository}/.github/workflows/release.yml@refs/tags/v${version}`;
}

/**
 * Builds the post-image manifest from already-produced release files. `images` maps role →
 * { subject, platforms: { "linux/amd64": digest, ... }, fossEligible }. The release directory must
 * already hold the source archive, NOTICE.txt, LICENSE, the per-platform SBOMs and Compose files.
 */
export function generateReleaseManifest({ dir, version, sourceRevision, createdAt, repository, images, resourceReceipts = [], contentBundle, fossPolicy, sourceArchive }) {
  const artifacts = Object.entries(images).map(([role, image]) => {
    const tier = { server: "core", "maia-cpu": "cpu", "maia-accelerated": "accelerated" }[role];
    const platforms = Object.keys(image.platforms).sort();
    return {
      role,
      tier,
      subject: image.subject,
      platforms,
      platformManifests: platforms.map((platform) => ({
        platform,
        digest: image.platforms[platform],
        sbom: releaseFile(dir, `sbom/${role}-${platform.replace("/", "-")}.spdx.json`),
      })),
      signatureIdentity: signatureIdentity(repository, version),
      provenancePredicate: PROVENANCE_PREDICATE,
      sbomPredicate: SBOM_PREDICATE,
      fossEligible: image.fossEligible,
    };
  }).sort((left, right) => left.role.localeCompare(right.role));
  const artifactSubjects = new Set(artifacts.map((artifact) => artifact.subject));
  const compose = Object.entries(COMPOSE_FILES).filter(([, path]) => existsSync(resolve(dir, path))).map(([profile, path]) => {
    const { subjects, tagOnly } = composeImages(readFileSync(resolve(dir, path), "utf8"));
    if (tagOnly.length > 0) throw new TypeError(`${path} contains tag-only images: ${tagOnly.join(", ")}`);
    // Third-party digest-pinned images (the Caddy edge) are outside the Tabiya artifact set.
    return { ...releaseFile(dir, path), profile, imageDigests: subjects.filter((subject) => artifactSubjects.has(subject)) };
  }).sort((left, right) => left.profile.localeCompare(right.profile));
  const sbomFiles = artifacts.flatMap((artifact) => artifact.platformManifests.map((platform) => platform.sbom));
  const support = DEPLOYMENT_SUPPORT_FILES.filter((path) => existsSync(resolve(dir, path))).map((path) => releaseFile(dir, path));
  const files = [releaseFile(dir, "LICENSE"), releaseFile(dir, "NOTICE.txt"), ...support, ...sbomFiles].sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
  const manifest = {
    format: "tabiya-release-manifest",
    formatVersion: 1,
    release: { version, sourceRevision, createdAt, repository, sourceArchive: releaseFile(dir, sourceArchive) },
    requiredArtifacts: artifacts.filter((artifact) => artifact.role !== "maia-accelerated"),
    optionalArtifacts: artifacts.filter((artifact) => artifact.role === "maia-accelerated"),
    compose,
    files,
    resourceReceipts: [...resourceReceipts].sort((left, right) => `${left.tier}|${left.platform}`.localeCompare(`${right.tier}|${right.platform}`)),
    contentBundle,
    fossPolicy,
  };
  const errors = validateReleaseManifest(manifest);
  if (errors.length > 0) throw new TypeError(`release manifest refused:\n- ${errors.join("\n- ")}`);
  return canonicalReleaseManifest(manifest);
}

/** SHA256SUMS over every release file except itself (the manifest included), sorted by path. */
export function renderChecksums(dir, paths) {
  const unique = [...new Set(paths)].filter((path) => path !== CHECKSUMS_NAME).sort();
  return unique.map((path) => `${sha256Hex(readFileSync(resolve(dir, path)))}  ${path}`).join("\n").concat("\n");
}

export function parseChecksums(text) {
  return text.trimEnd().split("\n").map((line) => {
    const match = /^([0-9a-f]{64}) {2}(\S+)$/u.exec(line);
    if (match === null) throw new TypeError(`invalid SHA256SUMS line: ${line}`);
    return { sha256: `sha256:${match[1]}`, path: match[2] };
  });
}

/**
 * Read-only verification of a downloaded release set: checksums, manifest schema/joins, every
 * listed file, Compose digests. Returns the parsed manifest or throws with every failure.
 */
export function verifyReleaseSet(dir) {
  const failures = [];
  const checksums = parseChecksums(readFileSync(resolve(dir, CHECKSUMS_NAME), "utf8"));
  if (checksums.some((entry) => entry.path === CHECKSUMS_NAME)) failures.push("SHA256SUMS lists itself");
  for (const entry of checksums) {
    const path = resolve(dir, entry.path);
    if (!existsSync(path) || !statSync(path).isFile()) failures.push(`missing ${entry.path}`);
    else if (sha256Digest(readFileSync(path)) !== entry.sha256) failures.push(`checksum mismatch: ${entry.path}`);
  }
  let manifest;
  try {
    manifest = parseReleaseManifest(readFileSync(resolve(dir, RELEASE_MANIFEST_NAME), "utf8"));
  } catch (error) {
    failures.push(error.message);
  }
  if (manifest !== undefined) {
    if (!checksums.some((entry) => entry.path === RELEASE_MANIFEST_NAME)) failures.push("SHA256SUMS does not cover the release manifest");
    const listed = [manifest.release.sourceArchive, ...manifest.files, ...manifest.compose];
    for (const file of listed) {
      const path = resolve(dir, file.path);
      if (!existsSync(path)) {
        failures.push(`manifest file missing: ${file.path}`);
        continue;
      }
      const bytes = readFileSync(path);
      if (bytes.length !== file.bytes || sha256Digest(bytes) !== file.sha256) failures.push(`manifest file changed: ${file.path}`);
      if (!checksums.some((entry) => entry.path === file.path && entry.sha256 === file.sha256)) failures.push(`SHA256SUMS does not cover ${file.path}`);
    }
    const artifactSubjects = new Set([...manifest.requiredArtifacts, ...manifest.optionalArtifacts].map((artifact) => artifact.subject));
    for (const compose of manifest.compose) {
      const { subjects, tagOnly } = composeImages(readFileSync(resolve(dir, compose.path), "utf8"));
      if (tagOnly.length > 0) failures.push(`${compose.path} has tag-only images`);
      if (subjects.filter((subject) => artifactSubjects.has(subject)).join(",") !== compose.imageDigests.join(",")) failures.push(`${compose.path} images differ from the manifest`);
    }
  }
  if (failures.length > 0) throw new TypeError(`release set verification failed:\n- ${failures.join("\n- ")}`);
  return manifest;
}

export { isPrerelease };

// ---------------------------------------------------------------------------------------------
// §8 artifact graph: committed/pre-image bytes → image digest → SBOM/resource receipt → Compose
// digest → release manifest → checksum file → signatures/attestations.

export const RELEASE_GRAPH = Object.freeze([
  ["committed-source", "source-archive"],
  ["committed-source", "foss-policy"],
  ["committed-source", "runtime-content"],
  ["foss-policy", "notice"],
  ["committed-source", "notice"],
  ["notice", "build-metadata"],
  ["foss-policy", "build-metadata"],
  ["runtime-content", "build-metadata"],
  ["committed-source", "platform-image"],
  ["notice", "platform-image"],
  ["build-metadata", "platform-image"],
  ["runtime-content", "platform-image"],
  ["platform-image", "image-index"],
  ["platform-image", "sbom"],
  ["platform-image", "resource-receipt"],
  ["image-index", "compose"],
  ["image-index", "release-manifest"],
  ["sbom", "release-manifest"],
  ["resource-receipt", "release-manifest"],
  ["compose", "release-manifest"],
  ["source-archive", "release-manifest"],
  ["notice", "release-manifest"],
  ["release-manifest", "checksums"],
  ["compose", "checksums"],
  ["sbom", "checksums"],
  ["source-archive", "checksums"],
  ["image-index", "image-signature"],
  ["image-index", "provenance-attestation"],
  ["sbom", "sbom-attestation"],
  ["checksums", "release-attestation"],
]);

/** Kahn topological sort; throws on any cycle (including a self-edge). */
export function topologicalOrder(edges = RELEASE_GRAPH) {
  const nodes = new Set(edges.flat());
  const incoming = new Map([...nodes].map((node) => [node, 0]));
  for (const [from, to] of edges) {
    if (from === to) throw new TypeError(`release graph cycle: ${from} depends on itself`);
    incoming.set(to, incoming.get(to) + 1);
  }
  const ready = [...nodes].filter((node) => incoming.get(node) === 0).sort();
  const order = [];
  while (ready.length > 0) {
    const node = ready.shift();
    order.push(node);
    for (const [from, to] of edges) {
      if (from !== node) continue;
      incoming.set(to, incoming.get(to) - 1);
      if (incoming.get(to) === 0) ready.push(to);
    }
    ready.sort();
  }
  if (order.length !== nodes.size) throw new TypeError(`release graph cycle among: ${[...nodes].filter((node) => !order.includes(node)).join(", ")}`);
  return order;
}

export function requireDigestString(value) {
  if (!DIGEST.test(value)) throw new TypeError(`not a digest: ${value}`);
  return value;
}
