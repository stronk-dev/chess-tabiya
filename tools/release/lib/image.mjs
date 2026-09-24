// rfc/verifiable-runtime-distribution.md §4/§6/§7 — image filesystem census.
//
// The census reads the image's exported filesystem (not the source tree): forbidden paths, the
// `/app` allow-list, byte-equality of the embedded pre-image files, workstation-local paths and,
// for the Maia CPU image, the GPU package/library census.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { localPathHits, sha256Digest } from "./common.mjs";
import { FORBIDDEN_DISTRIBUTION, FORBIDDEN_LIBRARY, normalizeDistribution } from "./maia.mjs";
import { verifyRuntimeContentTree } from "./runtime-content.mjs";

export const SERVER_DIST_ENTRIES = Object.freeze([
  "apps/server/dist/longitudinal-rebuild.js",
  "apps/server/dist/longitudinal-worker-once.js",
  "apps/server/dist/longitudinal-worker-thread.js",
  "apps/server/dist/main.js",
]);

const COMMON_FORBIDDEN = Object.freeze([
  [/(?:^|\/)\.git\//u, "repository history"],
  [/^var\/cache\/apt\/archives\/.+\.deb$/u, "package-manager cache"],
  [/^var\/lib\/apt\/lists\/.+_(?:Packages|Release|InRelease|Sources)(?:\.[a-z0-9]+)?$/u, "package-manager index"],
  [/^usr\/bin\/(?:gcc|g\+\+|cc|c\+\+|make|cpp|ld)(?:-\d+)?$/u, "compiler toolchain"],
  [/^(?:usr\/)?bin\/(?:nc|netcat|nc\.openbsd|ncat)$/u, "netcat"],
]);

const SERVER_FORBIDDEN = Object.freeze([
  ...COMMON_FORBIDDEN,
  [/^app\/content\/candidates\//u, "candidate content"],
  [/\.(?:job|priority|graduation|browser)\.json$/u, "authoring/browser sidecar"],
  [/^app\/(?:planning|docs|rfc|tools|vendor|tests|design|archive|scripts)\//u, "authoring tree"],
  [/^app\/node_modules\//u, "package tree"],
  [/^app\/.*\.md$/u, "prose file"],
  [/^usr\/local\/lib\/node_modules\//u, "npm/corepack package manager"],
  [/^usr\/local\/bin\/(?:npm|npx|corepack|yarn|yarnpkg|pnpm)$/u, "package manager"],
  [/^opt\/yarn/u, "yarn package manager"],
]);

const MAIA_FORBIDDEN = Object.freeze([
  ...COMMON_FORBIDDEN,
  // Installed NVIDIA/CUDA wheels land in site-packages/nvidia/** or cuda*/ packages. Torch's CPU wheel
  // legitimately ships C++ *headers* under include/**/cuda/; headers are not a runtime component, the
  // library census (FORBIDDEN_LIBRARY, by file name) is what proves no CUDA code ships.
  [/site-packages\/(?:nvidia|cuda[^/]*|cudnn[^/]*|nccl[^/]*|tensorrt[^/]*|triton)\//iu, "GPU runtime package"],
]);

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 1024, ...options });
}

/** Exports an image's filesystem once: listing plus selectively extracted paths. */
export function exportImage(image, workDirectory, extract) {
  mkdirSync(workDirectory, { recursive: true });
  const tar = join(workDirectory, "rootfs.tar");
  const container = run("docker", ["create", image]).trim();
  try {
    run("docker", ["export", container, "-o", tar]);
  } finally {
    run("docker", ["rm", "-f", container]);
  }
  const listing = run("tar", ["-tf", tar]).split("\n").map((entry) => entry.replace(/^\.?\//u, "")).filter((entry) => entry !== "" && !entry.endsWith("/"));
  const root = join(workDirectory, "rootfs");
  mkdirSync(root, { recursive: true });
  const present = extract.filter((path) => listing.some((entry) => entry === path || entry.startsWith(`${path}/`)));
  if (present.length > 0) run("tar", ["-xf", tar, "-C", root, ...present]);
  return { tar, root, listing };
}

function walk(directory, prefix = "") {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const absolute = join(directory, name);
    const path = prefix === "" ? name : `${prefix}/${name}`;
    const stat = statSync(absolute, { throwIfNoEntry: false });
    if (stat === undefined) return [];
    return stat.isDirectory() ? walk(absolute, path) : [path];
  }).sort();
}

function sameTree(expected, actual, label) {
  const findings = [];
  const left = walk(expected);
  const right = walk(actual);
  for (const path of left) {
    if (!right.includes(path)) findings.push(`${label}: missing ${path}`);
    else if (sha256Digest(readFileSync(join(expected, path))) !== sha256Digest(readFileSync(join(actual, path)))) findings.push(`${label}: ${path} differs from the pre-image bytes`);
  }
  for (const path of right) if (!left.includes(path)) findings.push(`${label}: unexpected ${path}`);
  return findings;
}

/** Server census against the pre-image directory produced by tools/release/pre-image.mjs. */
export function serverCensus({ listing, root, preImage }) {
  const findings = [];
  for (const path of listing) {
    for (const [pattern, reason] of SERVER_FORBIDDEN) if (pattern.test(path)) findings.push(`forbidden ${reason}: /${path}`);
  }
  const manifest = JSON.parse(readFileSync(join(preImage, "app/runtime-content/manifest.json"), "utf8"));
  const allowed = new Set([...manifest.files.map((file) => `app/${file.path}`), "app/runtime-content/manifest.json", "app/runtime-content/facts.json", ...SERVER_DIST_ENTRIES.map((path) => `app/${path}`)]);
  for (const path of listing.filter((entry) => entry.startsWith("app/"))) {
    if (!allowed.has(path) && !path.startsWith("app/apps/web/dist/")) findings.push(`not allow-listed: /${path}`);
  }
  for (const path of SERVER_DIST_ENTRIES) if (!listing.includes(`app/${path}`)) findings.push(`missing runtime entry /app/${path}`);
  for (const required of ["usr/local/bin/node", "usr/games/stockfish", "usr/share/doc/stockfish/source/Copying.txt"]) {
    if (!listing.includes(required)) findings.push(`missing declared runtime component /${required}`);
  }
  findings.push(...verifyRuntimeContentTree(join(root, "app"), manifest).map((finding) => `runtime content: ${finding}`));
  findings.push(...sameTree(join(preImage, "doc"), join(root, "usr/share/doc/chess-tabiya"), "embedded legal/build files"));
  for (const base of ["app", "usr/share/doc/chess-tabiya"]) {
    for (const path of walk(join(root, base))) {
      const hits = localPathHits(readFileSync(join(root, base, path), "utf8"));
      if (hits.length > 0) findings.push(`workstation-local path in /${base}/${path}: ${[...new Set(hits)].join(", ")}`);
    }
  }
  return findings;
}

/** Maia CPU census: GPU distributions and libraries (by metadata AND file name), weight digest, notice. */
export function maiaCensus({ listing, root, materials, notice }) {
  const findings = [];
  for (const path of listing) {
    for (const [pattern, reason] of MAIA_FORBIDDEN) if (pattern.test(path)) findings.push(`forbidden ${reason}: /${path}`);
    const name = path.split("/").at(-1);
    if (FORBIDDEN_LIBRARY.test(name)) findings.push(`forbidden GPU library: /${path}`);
    const distInfo = /site-packages\/([^/]+)-[^-/]+\.dist-info\/METADATA$/u.exec(path);
    if (distInfo !== null && FORBIDDEN_DISTRIBUTION.test(normalizeDistribution(distInfo[1]))) findings.push(`forbidden GPU distribution: ${distInfo[1]}`);
  }
  const weight = join(root, "opt/maia3-models", materials.maia.weight.file);
  if (!existsSync(weight)) findings.push("the pinned weight file is missing");
  else if (sha256Digest(readFileSync(weight)) !== materials.maia.weight.sha256) findings.push("the weight bytes do not match the pinned digest");
  const embedded = join(root, "usr/share/doc/chess-tabiya-maia/NOTICE.txt");
  if (!existsSync(embedded) || readFileSync(embedded, "utf8") !== notice) findings.push("embedded Maia NOTICE.txt differs from the pre-image notice");
  const licence = join(root, "opt/maia3/LICENSE");
  if (!existsSync(licence) || sha256Digest(readFileSync(licence)) !== materials.maia.licenseFile.sha256) findings.push("Maia source licence missing or changed");
  if (!listing.includes("opt/maia3/maia3/uci.py")) findings.push("complete Maia source is not in the image");
  for (const pattern of [/(?:^|\/)\.git\//u]) if (listing.some((path) => pattern.test(path) && path.startsWith("opt/maia3/"))) findings.push("Maia source carries git history");
  return findings;
}

/** Installed dpkg packages (name, version, architecture) from an extracted status file. */
export function dpkgInstalled(root) {
  const path = join(root, "var/lib/dpkg/status");
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").split(/\n\n+/u).flatMap((stanza) => {
    const field = (name) => new RegExp(`^${name}: (.+)$`, "mu").exec(stanza)?.[1];
    if (!/install ok installed/u.test(field("Status") ?? "")) return [];
    return [{ name: field("Package"), version: field("Version"), architecture: field("Architecture"), stanza }];
  }).sort((left, right) => left.name.localeCompare(right.name));
}

/** Stable per-package artifact identity for override binding: the installed file inventory. */
export function dpkgArtifactDigest(root, entry) {
  for (const name of [`${entry.name}:${entry.architecture}.md5sums`, `${entry.name}.md5sums`]) {
    const path = join(root, "var/lib/dpkg/info", name);
    if (existsSync(path)) return sha256Digest(readFileSync(path));
  }
  return sha256Digest(Buffer.from(entry.stanza));
}

export function imageBytes(image) {
  return Number(run("docker", ["image", "inspect", image, "--format", "{{.Size}}"]).trim());
}

export function imageArchitecture(image) {
  return run("docker", ["image", "inspect", image, "--format", "{{.Os}}/{{.Architecture}}"]).trim();
}

export function saveImage(image, path) {
  run("docker", ["save", image, "-o", path]);
  return resolve(path);
}
