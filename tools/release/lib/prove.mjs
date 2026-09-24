// rfc/verifiable-runtime-distribution.md §4/§5/§6/§7/§10 — one image proof used identically by the
// local release verification and the native CI proof: filesystem census and allow-list, embedded
// pre-image bytes, SPDX SBOM from the image, reconciliation, licence gate, loader-traced boot under
// the hard memory limit, and the resource envelope.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { RESOURCE_CEILINGS } from "../../../packages/schema/src/release-manifest/index.ts";
import { cgroupPeakMiB, classifyTrace, memorySample, probeJourney, startServer } from "./boot.mjs";
import { canonicalJson, repoPath } from "./common.mjs";
import { dpkgArtifactDigest, dpkgInstalled, exportImage, imageArchitecture, imageBytes, maiaCensus, saveImage, serverCensus } from "./image.mjs";
import { renderMaiaNotice } from "./maia.mjs";
import { architectureDrift, augmentSbom, licenceGate, purlOf, reconcileSbom, scanImageArchive } from "./sbom.mjs";

const MiB = 1024 * 1024;

function summarizeLicence(results) {
  const failed = results.filter((result) => !result.pass);
  return {
    evaluated: results.length,
    passed: results.length - failed.length,
    failedApplication: failed.filter((result) => result.class === "application").map((result) => ({ purl: result.purl, expression: result.expression, failures: result.failures })),
    failedOsPackages: failed.filter((result) => result.class === "os-package").map((result) => ({ purl: result.purl, expression: result.expression })),
  };
}

function licenceFindings(summary, mode) {
  const findings = summary.failedApplication.map((item) => `licence gate (application): ${item.purl} ${item.expression}: ${item.failures.join("; ")}`);
  if (mode === "enforce" && summary.failedOsPackages.length > 0) {
    findings.push(`licence gate (os-package): ${summary.failedOsPackages.length} package(s) have no accepted expression or exact approved override`);
  }
  return findings;
}

function declaredServerComponents({ preImage, materials, version }) {
  const pre = JSON.parse(readFileSync(join(preImage, "pre-image.json"), "utf8"));
  const bundle = JSON.parse(readFileSync(join(preImage, "app/runtime-content/manifest.json"), "utf8"));
  const contentLicence = [...new Set(bundle.files.map((file) => file.licence))].sort().join(" AND ");
  return [
    { name: "chess-tabiya", version, purl: `pkg:github/stronk-dev/chess-tabiya@${pre.sourceRevision}`, licence: "AGPL-3.0-only", download: `https://github.com/stronk-dev/chess-tabiya/tree/${pre.sourceRevision}`, comment: "Tabiya server and web bundles (/app/apps)." },
    { name: "chess-tabiya-runtime-content", version: bundle.digest.slice("sha256:".length, "sha256:".length + 12), purl: `pkg:generic/chess-tabiya-runtime-content@${bundle.digest.replace(":", "-")}`, licence: contentLicence, checksum: bundle.digest, comment: `${bundle.producer}; ${bundle.files.length} allow-listed files; final discharge ${bundle.finalDischarge}.` },
    { name: "stockfish", version: materials.stockfish.version, purl: `pkg:github/official-stockfish/Stockfish@${materials.stockfish.commit}`, licence: materials.stockfish.declaredExpression, download: materials.stockfish.sourceArchive.url, checksum: materials.stockfish.sourceArchive.sha256, comment: `Complete source at ${materials.stockfish.imageSource}.` },
    ...pre.javascriptComponents.map((component) => {
      const name = decodeURIComponent(component.purl.slice("pkg:npm/".length, component.purl.lastIndexOf("@")));
      return { name, version: component.purl.slice(component.purl.lastIndexOf("@") + 1), purl: component.purl, licence: component.expression, download: `https://registry.npmjs.org/${name}`, comment: `Bundled into /app/apps; lockfile integrity ${component.integrity}.` };
    }),
  ];
}

/** Proves the server image. `subject` is the fully-qualified digest-pinned reference being proven. */
export async function proveServerImage({ image, subject, platform, preImage, out, materials, policy, version, idleSeconds = 10, licenceGateMode = "report", enforceEnvelope = false, trace = true }) {
  mkdirSync(out, { recursive: true });
  const findings = [];
  const architecture = imageArchitecture(image);
  if (architecture !== platform) findings.push(`image architecture ${architecture} does not match ${platform}`);
  const exported = exportImage(image, join(out, "fs"), ["app", "usr/share/doc/chess-tabiya", "var/lib/dpkg/status", "var/lib/dpkg/info"]);
  findings.push(...serverCensus({ listing: exported.listing, root: exported.root, preImage }));
  const dpkg = dpkgInstalled(exported.root);
  const archive = saveImage(image, join(out, "image.tar"));
  const scanned = scanImageArchive(archive, materials);
  const node = materials.nodeRuntime;
  const { sbom, curation } = augmentSbom(scanned, {
    role: "server",
    platform,
    subject,
    declared: declaredServerComponents({ preImage, materials, version }),
    curated: [{ match: (pkg) => purlOf(pkg)?.startsWith("pkg:generic/node@") && pkg.versionInfo === node.version, licence: node.declaredExpression, source: `release/materials.v1.json nodeRuntime (${node.notice.path})` }],
  });
  findings.push(...reconcileSbom(sbom, { dpkg, allowedScannerPackages: [(pkg) => purlOf(pkg) === `pkg:generic/node@${node.version}`] }));
  const sbomPath = join(out, `server-${platform.replace("/", "-")}.spdx.json`);
  writeFileSync(sbomPath, `${JSON.stringify(sbom, null, 2)}\n`);
  const byPurl = new Map(dpkg.map((entry) => [entry.name, entry]));
  const licence = summarizeLicence(licenceGate(sbom, policy, {
    curation,
    artifactDigest: (pkg) => (purlOf(pkg)?.startsWith("pkg:deb/") && byPurl.has(pkg.name) ? dpkgArtifactDigest(exported.root, byPurl.get(pkg.name)) : undefined),
  }));
  findings.push(...licenceFindings(licence, licenceGateMode));

  const server = await startServer({ image, name: `tabiya-release-proof-${process.pid}`, traceModule: trace ? repoPath("tools/release/fs-trace.mjs") : undefined });
  let receipt;
  let envelope;
  try {
    const { results, about } = await probeJourney(server.base);
    if (about.application.licence !== "AGPL-3.0-only" || about.application.build !== "release") findings.push("About does not report the AGPL release build");
    const pre = JSON.parse(readFileSync(join(preImage, "pre-image.json"), "utf8"));
    if (about.release?.sourceRevision !== pre.sourceRevision) findings.push("About does not report the exact source revision");
    await sleep(idleSeconds * 1_000);
    const samples = [];
    for (let index = 0; index < 5; index += 1) {
      samples.push(memorySample(server));
      await sleep(1_000);
    }
    const peak = cgroupPeakMiB(server);
    if (trace) {
      const traceText = server.copyOut("/tmp/fs-trace.log", join(out, "fs-trace.log"));
      const manifest = JSON.parse(readFileSync(join(preImage, "app/runtime-content/manifest.json"), "utf8"));
      const classified = classifyTrace(traceText, manifest);
      for (const violation of classified.violations) findings.push(`loader trace read a non-allow-listed path: ${violation}`);
      for (const family of classified.unexercisedFamilies) findings.push(`loader trace never read the served family ${family}`);
      results.trace = { allowListedReads: classified.reads, violations: classified.violations.length };
    }
    const ceiling = RESOURCE_CEILINGS.core;
    receipt = {
      format: "tabiya-local-resource-receipt",
      formatVersion: 1,
      journeyId: "release.probe@0",
      note: "Bounded probe journey, not the F12-H core.release_journey@1; cannot enter a release manifest.",
      platform,
      subject,
      hardMemoryMiB: ceiling.hardMiB,
      swap: "disabled",
      coldReadyMs: server.coldReadyMs,
      steadyRssMiB: Math.max(...samples.map((sample) => sample.workingSetMiB)),
      steadyInstrument: "cgroup working set (memory.current - inactive_file), the R18/docker-stats instrument",
      steadySamples: samples,
      idleSecondsBeforeSamples: idleSeconds,
      peakCgroupMiB: peak,
      unpackedImageBytes: imageBytes(image),
      journey: results,
    };
    // §5: the ceilings are never loosened. Locally an excess is a reported publication gate (the
    // manifest validator refuses such a receipt); the native release proof enforces it.
    envelope = [
      ["steadyRssMiB", ceiling.steadyRssMiB, receipt.steadyRssMiB],
      ["peakRssMiB", ceiling.peakRssMiB, receipt.peakCgroupMiB ?? 0],
      ["unpackedImageBytes", ceiling.unpackedImageBytes, receipt.unpackedImageBytes],
      ["coldReadyMs", ceiling.coldReadyMs, receipt.coldReadyMs],
    ].map(([key, limit, value]) => ({ key, limit, value, pass: value <= limit }));
    receipt.envelope = envelope;
    if (enforceEnvelope) for (const item of envelope) if (!item.pass) findings.push(`core envelope: ${item.key} ${item.value} exceeds ${item.limit}`);
  } finally {
    server.stop();
  }
  writeFileSync(join(out, "server-receipt.json"), canonicalJson({ receipt, licence, findings }));
  return { findings, sbomPath, sbom, receipt, licence, envelope };
}

/** Proves the Maia CPU image: census (metadata + files), weight/source digests, SBOM, licence gate. */
export async function proveMaiaImage({ image, subject, platform, out, materials, policy, licenceGateMode = "report" }) {
  mkdirSync(out, { recursive: true });
  const findings = [];
  const architecture = imageArchitecture(image);
  if (architecture !== platform) findings.push(`image architecture ${architecture} does not match ${platform}`);
  const exported = exportImage(image, join(out, "fs"), ["opt/maia3-models", "opt/maia3/LICENSE", "usr/share/doc/chess-tabiya-maia", "var/lib/dpkg/status", "var/lib/dpkg/info"]);
  findings.push(...maiaCensus({ listing: exported.listing, root: exported.root, materials, notice: renderMaiaNotice() }));
  const dpkg = dpkgInstalled(exported.root);
  const archive = saveImage(image, join(out, "image.tar"));
  const scanned = scanImageArchive(archive, materials);
  const licences = JSON.parse(readFileSync(repoPath("workers/maia/python-licences.v1.json"), "utf8")).distributions;
  const rights = JSON.parse(readFileSync(repoPath(materials.maia.weight.rights), "utf8"));
  const { sbom, curation } = augmentSbom(scanned, {
    role: "maia-cpu",
    platform,
    subject,
    declared: [
      { name: "maia3", version: materials.maia.sourceCommit, purl: `pkg:github/CSSLab/maia3@${materials.maia.sourceCommit}`, licence: materials.maia.declaredExpression, download: materials.maia.sourceArchive.url, checksum: materials.maia.sourceArchive.sha256, comment: "Patched source at /opt/maia3." },
      { name: "Maia3-5M", version: materials.maia.weight.revision, purl: `pkg:huggingface/${materials.maia.weight.repository}@${materials.maia.weight.revision}`, licence: rights.expression, download: materials.maia.weight.url, checksum: materials.maia.weight.sha256, comment: `D1 ${rights.status}.` },
    ],
    curated: [
      ...Object.entries(licences).map(([name, record]) => ({ match: (pkg) => purlOf(pkg)?.startsWith(`pkg:pypi/${name}@`), licence: record.declared, source: `workers/maia/python-licences.v1.json (${record.source})` })),
      { match: (pkg) => purlOf(pkg) === `pkg:generic/python@${materials.pythonRuntime.version}`, licence: materials.pythonRuntime.declaredExpression, source: "release/materials.v1.json pythonRuntime" },
    ],
  });
  const pythonNames = new Set(Object.keys(licences));
  findings.push(...reconcileSbom(sbom, {
    dpkg,
    allowedScannerPackages: [
      (pkg) => purlOf(pkg)?.startsWith("pkg:pypi/") && (pythonNames.has(pkg.name.toLowerCase().replace(/[-_.]+/gu, "-")) || ["pip", "maia3"].includes(pkg.name)),
      (pkg) => purlOf(pkg) === `pkg:generic/python@${materials.pythonRuntime.version}`,
      // Packages setuptools vendors inside its own distribution (setuptools/_vendor/**) ship under
      // setuptools' record; they are inventoried and licence-evaluated, never silently dropped.
      (pkg) => purlOf(pkg)?.startsWith("pkg:pypi/") && /site-packages\/setuptools\/_vendor\//u.test(pkg.sourceInfo ?? ""),
    ],
    deferNoassertion: (pkg) => /site-packages\/setuptools\/_vendor\//u.test(pkg.sourceInfo ?? ""),
  }));
  const sbomPath = join(out, `maia-cpu-${platform.replace("/", "-")}.spdx.json`);
  writeFileSync(sbomPath, `${JSON.stringify(sbom, null, 2)}\n`);
  const licence = summarizeLicence(licenceGate(sbom, policy, { curation }));
  // The Maia CPU licence gate is blocked on D1 (weight rights) and curated Python records; locally it
  // is reported, and only the release (enforce) mode turns it into a refusal.
  if (licenceGateMode === "enforce") findings.push(...licenceFindings(licence, "enforce"));
  const unpacked = imageBytes(image);
  writeFileSync(join(out, "maia-receipt.json"), canonicalJson({ platform, subject, unpackedImageBytes: unpacked, licence, findings }));
  return { findings, sbomPath, sbom, licence, unpackedImageBytes: unpacked };
}

export { architectureDrift, MiB };
