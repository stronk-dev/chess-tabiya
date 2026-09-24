// rfc/verifiable-runtime-distribution.md §6 — per-platform SPDX 2.3 SBOM from the image itself.
//
// A digest-pinned scanner (release/materials.v1.json `sbom-scanner`) inventories the image's
// filesystem; the repository then adds the components a scanner cannot see inside bundles (the
// Tabiya application, bundled JavaScript packages, runtime content, Stockfish, curated runtime
// records) and reconciles the result against the actual package database and filesystem. Scanner
// guesses never overwrite curated records: a curated licence replaces NOASSERTION only, and any
// concrete disagreement is a failure unless an exact approved override applies.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, dirname } from "node:path";

import { LOCAL_PATH_PATTERNS, sha256Digest } from "./common.mjs";
import { evaluateComponent, parseSpdxExpression } from "./spdx.mjs";

export const SCANNER = Object.freeze({ id: "syft", version: "1.33.0" });
const SECRET = /(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})/u;
const BUILDER_PATH = /(?:\/work\/|\/github\/workspace|\/home\/runner\/|\/tmp\/tabiya-|\/runner\/_work\/)/u;

/** Runs the digest-pinned scanner on a `docker save` archive; returns the raw SPDX document. */
export function scanImageArchive(archivePath, materials) {
  const scanner = materials.baseImages.find((image) => image.id === "sbom-scanner");
  const reference = `${scanner.repository}@${scanner.index}`;
  const directory = dirname(archivePath);
  const name = basename(archivePath);
  const output = execFileSync("docker", ["run", "--rm", "--network", "none", "-v", `${directory}:/work:ro`, reference, `docker-archive:/work/${name}`, "-o", "spdx-json", "-q"], { encoding: "utf8", maxBuffer: 1024 * 1024 * 1024 });
  return JSON.parse(output);
}

export function purlOf(pkg) {
  return (pkg.externalRefs ?? []).find((ref) => ref.referenceType === "purl")?.referenceLocator;
}

function spdxId(value) {
  return `SPDXRef-Tabiya-${value.replace(/[^A-Za-z0-9.-]+/gu, "-")}`;
}

function declaredPackage({ name, version, purl, licence, supplier = "NOASSERTION", download = "NOASSERTION", comment, checksum }) {
  return {
    SPDXID: spdxId(`${name}-${version}`),
    name,
    versionInfo: version,
    supplier,
    downloadLocation: download,
    filesAnalyzed: false,
    licenseConcluded: licence,
    licenseDeclared: licence,
    copyrightText: "NOASSERTION",
    ...(checksum === undefined ? {} : { checksums: [{ algorithm: "SHA256", checksumValue: checksum.replace(/^sha256:/u, "") }] }),
    externalRefs: [{ referenceCategory: "PACKAGE-MANAGER", referenceType: "purl", referenceLocator: purl }],
    comment,
  };
}

/** Deterministic string replacement over the whole document (scanner-local archive paths). */
function scrub(document, subject) {
  return JSON.parse(JSON.stringify(document).replaceAll("/work/", `${subject}/`).replaceAll("docker-archive:", ""));
}

/**
 * Builds the release SBOM: the scanner inventory plus declared components, with curated licences
 * applied only over NOASSERTION. Returns the document and the curation side-table (kept out of the
 * SPDX document itself so the output stays schema-valid SPDX 2.3).
 */
export function augmentSbom(document, { role, platform, subject, declared, curated = [] }) {
  const sbom = scrub(document, subject);
  const curation = new Map();
  sbom.name = `chess-tabiya-${role}-${platform.replace("/", "-")}`;
  sbom.documentNamespace = `https://github.com/stronk-dev/chess-tabiya/sbom/${role}/${platform}/${subject.split("@").at(-1)}`;
  sbom.creationInfo.creators = [...new Set([...(sbom.creationInfo.creators ?? []), "Tool: tabiya-release-sbom-1", "Organization: Tabiya"])];
  for (const record of curated) {
    const pkg = sbom.packages.find((candidate) => record.match(candidate));
    if (pkg === undefined) continue;
    const observed = pkg.licenseDeclared ?? "NOASSERTION";
    pkg.comment = `${pkg.comment ? `${pkg.comment} ` : ""}Curated licence record: ${record.source}; scanner observed ${observed}.`;
    if (observed === "NOASSERTION") {
      pkg.licenseDeclared = record.licence;
      pkg.licenseConcluded = record.licence;
    }
    curation.set(pkg.SPDXID, { observed, curated: record.licence });
  }
  const root = (sbom.relationships ?? []).find((relationship) => relationship.relationshipType === "DESCRIBES")?.relatedSpdxElement ?? "SPDXRef-DOCUMENT";
  for (const component of declared) {
    const pkg = declaredPackage(component);
    sbom.packages.push(pkg);
    sbom.relationships.push({ spdxElementId: root, relationshipType: "CONTAINS", relatedSpdxElement: pkg.SPDXID });
  }
  return { sbom, curation };
}

function leaves(expression) {
  try {
    const collect = (node) => node.type === "and" ? [...collect(node.left), ...collect(node.right)] : node.type === "or" ? null : [JSON.stringify(node)];
    const result = collect(parseSpdxExpression(expression));
    return result === null || result.includes(null) ? null : [...new Set(result)].sort().join("|");
  } catch {
    return null;
  }
}

/** Two expressions agree when identical or when both are pure conjunctions of the same leaves. */
export function sameLicence(left, right) {
  if (left === right) return true;
  const a = leaves(left);
  return a !== null && a === leaves(right);
}

/**
 * Reconciles the SBOM against the image: dpkg set-equality, scanner-found language packages must be
 * declared, known runtime binaries only, no NOASSERTION outside the OS layer, and no secret, local
 * or builder-only path anywhere in the document.
 */
export function reconcileSbom(sbom, { dpkg, allowedScannerPackages = [] }) {
  const findings = [];
  const packages = sbom.packages.filter((pkg) => pkg.SPDXID !== "SPDXRef-DOCUMENT");
  const debs = packages.filter((pkg) => purlOf(pkg)?.startsWith("pkg:deb/"));
  const installed = new Set(dpkg.map((entry) => `${entry.name}@${entry.version}`));
  const scanned = new Set(debs.map((pkg) => `${pkg.name}@${pkg.versionInfo}`));
  for (const entry of installed) if (!scanned.has(entry)) findings.push(`installed package absent from the SBOM: ${entry}`);
  for (const entry of scanned) if (!installed.has(entry)) findings.push(`SBOM package not installed in the image: ${entry}`);
  for (const pkg of packages) {
    const purl = purlOf(pkg) ?? "";
    if (pkg.SPDXID.startsWith("SPDXRef-Tabiya-")) {
      if ((pkg.licenseDeclared ?? "NOASSERTION") === "NOASSERTION") findings.push(`declared component ${pkg.name} has no licence`);
      continue;
    }
    if (purl.startsWith("pkg:deb/") || purl.startsWith("pkg:oci/") || purl === "") continue;
    if (!allowedScannerPackages.some((allowed) => allowed(pkg))) findings.push(`scanner found an undeclared component: ${purl}`);
    else if ((pkg.licenseDeclared ?? "NOASSERTION") === "NOASSERTION") findings.push(`NOASSERTION licence for non-OS component ${purl}`);
  }
  const text = JSON.stringify(sbom);
  if (SECRET.test(text)) findings.push("the SBOM contains a secret/token pattern");
  for (const pattern of [...LOCAL_PATH_PATTERNS, BUILDER_PATH]) {
    const match = pattern.exec(text);
    if (match !== null) findings.push(`the SBOM contains a local or builder-only path: ${match[0]}`);
  }
  return findings;
}

/**
 * §6 licence gate over every SBOM package. `artifactDigest(pkg)` supplies the installed-artifact
 * identity an override must bind. Returns results classified as `os-package` or `application`.
 */
export function licenceGate(sbom, policy, { artifactDigest = () => undefined, curation = new Map() } = {}) {
  return sbom.packages.filter((pkg) => pkg.SPDXID !== "SPDXRef-DOCUMENT" && purlOf(pkg) !== undefined && !purlOf(pkg).startsWith("pkg:oci/")).map((pkg) => {
    const purl = purlOf(pkg);
    const curated = curation.get(pkg.SPDXID)?.curated;
    const observed = curation.get(pkg.SPDXID)?.observed ?? pkg.licenseDeclared ?? "NOASSERTION";
    const declaredByRepository = pkg.SPDXID.startsWith("SPDXRef-Tabiya-");
    const component = {
      purl,
      version: pkg.versionInfo,
      artifactDigest: artifactDigest(pkg),
      scanner: declaredByRepository ? { id: "tabiya-materials", version: "1" } : SCANNER,
      observedExpression: declaredByRepository ? undefined : observed,
      ...(declaredByRepository ? { declaredExpression: pkg.licenseDeclared } : curated === undefined ? {} : { declaredExpression: curated }),
    };
    if (curated !== undefined && observed !== "NOASSERTION" && sameLicence(curated, observed)) component.observedExpression = curated;
    const result = evaluateComponent(component, policy);
    return Object.freeze({ purl, class: purl.startsWith("pkg:deb/") ? "os-package" : "application", ...result });
  });
}

/** Cross-architecture drift: same package set and versions except declared architecture packages. */
export function architectureDrift(left, right, { allowed = [] } = {}) {
  const key = (sbom) => new Map(sbom.packages.filter((pkg) => purlOf(pkg) !== undefined && !purlOf(pkg).startsWith("pkg:oci/")).map((pkg) => [pkg.name, pkg.versionInfo]));
  const a = key(left);
  const b = key(right);
  const findings = [];
  for (const name of new Set([...a.keys(), ...b.keys()])) {
    if (allowed.includes(name)) continue;
    if (a.get(name) !== b.get(name)) findings.push(`${name}: ${a.get(name) ?? "absent"} vs ${b.get(name) ?? "absent"}`);
  }
  return findings;
}

export function sbomDigest(path) {
  return sha256Digest(readFileSync(path));
}
