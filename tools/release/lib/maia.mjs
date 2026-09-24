// rfc/verifiable-runtime-distribution.md §2/§4 — Maia CPU inputs: exact hashed Python locks, the
// curated licence record, the D1 weight-rights record and the pre-image NOTICE projection.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { REPO_ROOT, readJson, sha256Digest } from "./common.mjs";
import { evaluateComponent, loadFossPolicy } from "./spdx.mjs";

/** Distribution families the CPU image may never contain (normalized names). */
export const FORBIDDEN_DISTRIBUTION = /^(?:nvidia-.*|cuda-.*|.*-cu\d+|cupy.*|tensorrt.*|triton|nccl.*|cudnn.*|pytorch-triton.*)$/u;
/** Shared-library basenames of the CUDA/cuDNN/NCCL/TensorRT/NVIDIA runtime families. */
export const FORBIDDEN_LIBRARY = /^lib(?:cuda|cudart|cudnn|nccl|nvinfer|nvrtc|nvjitlink|nvtoolsext|cublas|cublaslt|cufft|curand|cusolver|cusparse|cusparselt|cupti|nvidia|torch_cuda|c10_cuda|nvshmem|cufile)[^/]*\.so(?:\.[0-9.]+)?$/iu;

export function normalizeDistribution(name) {
  return name.toLowerCase().replace(/[-_.]+/gu, "-");
}

/** Parses a `--require-hashes` lock: every entry is `name==version` with exactly one sha256. */
export function parsePythonLock(text) {
  const entries = [];
  const logical = text.replace(/\\\n/gu, " ").split("\n").map((line) => line.trim()).filter((line) => line !== "" && !line.startsWith("#"));
  for (const line of logical) {
    const match = /^([A-Za-z0-9_.-]+)==(\S+)\s+--hash=sha256:([0-9a-f]{64})$/u.exec(line);
    if (match === null) throw new TypeError(`lock line is not an exact hashed pin: ${line}`);
    entries.push({ name: normalizeDistribution(match[1]), version: match[2], sha256: `sha256:${match[3]}` });
  }
  return entries;
}

export function maiaInputs({ root = REPO_ROOT } = {}) {
  const materials = readJson(resolve(root, "release/materials.v1.json"));
  const licences = readJson(resolve(root, "workers/maia/python-licences.v1.json"));
  const rights = readJson(resolve(root, materials.maia.weight.rights));
  const locks = Object.fromEntries(Object.entries(materials.maia.pythonLocks).map(([platform, lock]) => {
    const bytes = readFileSync(resolve(root, lock.path));
    if (sha256Digest(bytes) !== lock.sha256) throw new TypeError(`${lock.path} does not match its material digest`);
    return [platform, parsePythonLock(bytes.toString("utf8"))];
  }));
  return { materials, licences, rights, locks };
}

/** Findings over the committed Maia inputs (lock closure, CUDA exclusion, licence record, D1). */
export function maiaInputFindings({ root = REPO_ROOT } = {}) {
  const findings = [];
  const { materials, licences, rights, locks } = maiaInputs({ root });
  const platforms = Object.keys(locks).sort();
  if (platforms.join(",") !== "linux/amd64,linux/arm64") findings.push("Maia locks must cover exactly linux/amd64 and linux/arm64");
  const names = platforms.map((platform) => locks[platform].map((entry) => `${entry.name}==${entry.version}`).join(","));
  if (new Set(names).size !== 1) findings.push("Maia amd64/arm64 locks differ in distributions or versions");
  for (const [platform, entries] of Object.entries(locks)) {
    for (const entry of entries) {
      if (FORBIDDEN_DISTRIBUTION.test(entry.name)) findings.push(`${platform}: forbidden GPU distribution ${entry.name}`);
      if (entry.name === "torch" && !entry.version.endsWith("+cpu")) findings.push(`${platform}: torch must be the CPU-only build (+cpu)`);
      const record = licences.distributions[entry.name];
      if (record === undefined) findings.push(`${platform}: ${entry.name} has no curated licence record`);
      else if (record.version !== entry.version) findings.push(`${platform}: ${entry.name} licence record is for ${record.version}, lock pins ${entry.version}`);
    }
  }
  for (const name of Object.keys(licences.distributions)) {
    if (!locks["linux/amd64"].some((entry) => entry.name === name)) findings.push(`licence record ${name} is not in the lock`);
  }
  if (rights.weight.sha256 !== materials.maia.weight.sha256 || rights.weight.revision !== materials.maia.weight.revision) findings.push("D1 weight-rights record does not bind the pinned weight bytes");
  return findings;
}

/** The weight's D1 state: publication of maia-cpu is refused until it is `resolved`. */
export function maiaWeightResolved({ root = REPO_ROOT } = {}) {
  const { rights } = maiaInputs({ root });
  return rights.status === "resolved" && rights.expression !== "LicenseRef-MAIA3-WEIGHTS-UNRESOLVED" && rights.evidence !== null;
}

/** Licence evaluation of every Maia component under the §6 policy (maia-cpu role). */
export function maiaLicenceEvaluation({ root = REPO_ROOT } = {}) {
  const policy = loadFossPolicy({ root });
  const { materials, licences, rights, locks } = maiaInputs({ root });
  const results = [];
  for (const entry of locks["linux/amd64"]) {
    const record = licences.distributions[entry.name];
    const result = evaluateComponent({
      purl: `pkg:pypi/${entry.name}@${entry.version}`,
      version: entry.version,
      artifactDigest: entry.sha256,
      scanner: { id: "tabiya-python-metadata", version: "1" },
      observedExpression: record?.declared,
    }, policy);
    results.push({ component: `pkg:pypi/${entry.name}@${entry.version}`, ...result });
  }
  results.push({ component: `pkg:github/CSSLab/maia3@${materials.maia.sourceCommit}`, ...evaluateComponent({ purl: `pkg:github/CSSLab/maia3@${materials.maia.sourceCommit}`, version: materials.maia.sourceCommit, declaredExpression: materials.maia.declaredExpression, scanner: { id: "tabiya-materials", version: "1" } }, policy) });
  results.push({ component: `pkg:huggingface/${materials.maia.weight.repository}@${materials.maia.weight.revision}`, ...evaluateComponent({ purl: `pkg:huggingface/${materials.maia.weight.repository}@${materials.maia.weight.revision}`, version: materials.maia.weight.revision, artifactDigest: materials.maia.weight.sha256, observedExpression: rights.expression, scanner: { id: "tabiya-materials", version: "1" } }, policy) });
  return results;
}

/** The deterministic Maia NOTICE.txt (committed as workers/maia/NOTICE.txt and checked in sync). */
export function renderMaiaNotice({ root = REPO_ROOT } = {}) {
  const { materials, licences, rights, locks } = maiaInputs({ root });
  const lines = [
    "==============================================================================",
    "Tabiya Maia CPU sidecar — third-party and licence notices",
    "==============================================================================",
    "",
    "Generated by `node tools/release/maia-notice.mjs --write` from release/materials.v1.json,",
    "workers/maia/requirements-cpu-linux-{amd64,arm64}.txt and workers/maia/python-licences.v1.json",
    "(rfc/verifiable-runtime-distribution.md §6). Engineering provenance, not legal advice.",
    "",
    `Maia3 source ${materials.maia.sourceCommit} — ${materials.maia.declaredExpression}`,
    `  Complete source (patched) inside this image: /opt/maia3 (LICENSE at /opt/maia3/LICENSE)`,
    `  Upstream archive: ${materials.maia.sourceArchive.url} (${materials.maia.sourceArchive.sha256})`,
    `  Tabiya patch: /opt/chess-tabiya/patches/maia3-uci-policy-mass.patch (${materials.maia.patch.sha256})`,
    "",
    `Maia3-5M weights ${materials.maia.weight.repository}@${materials.maia.weight.revision}`,
    `  File: /opt/maia3-models/${materials.maia.weight.file} (${materials.maia.weight.sha256})`,
    `  Licence: ${rights.expression} (${rights.status}; ${rights.discharge})`,
    `  ${rights.observed}`,
    "",
    "Python distributions (exact hashed CPU-only lock; installed under /usr/local/lib/python3.12/site-packages):",
  ];
  for (const entry of locks["linux/amd64"]) {
    const record = licences.distributions[entry.name];
    const arm = locks["linux/arm64"].find((candidate) => candidate.name === entry.name);
    lines.push(`  ${entry.name} ${entry.version} — declared: ${record.declared} (${record.source})`);
    lines.push(`    licence file: ${record.licenceFile ?? "none shipped by upstream"}`);
    lines.push(`    artifacts: amd64 ${entry.sha256}${arm.sha256 === entry.sha256 ? " (same on arm64)" : `, arm64 ${arm.sha256}`}`);
  }
  lines.push("", `Python ${materials.baseImages.find((image) => image.id === "python-runtime").tag} base image: ${materials.baseImages.find((image) => image.id === "python-runtime").repository}@${materials.baseImages.find((image) => image.id === "python-runtime").index}`,
    "  Debian package copyright files: /usr/share/doc/<package>/copyright; per-platform inventory in the release SBOM.", "");
  return `${lines.join("\n")}`;
}
