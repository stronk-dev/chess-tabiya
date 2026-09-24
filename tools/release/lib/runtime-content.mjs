// rfc/verifiable-runtime-distribution.md §7 — the temporary explicit runtime-content allow-list.
//
// The allow-list is derived from the paths the production loaders actually open (pack registry,
// its grounding sidecars, shape/principle/concept registries, the valence register, campaigns,
// schemas and the compiled opening catalogue). The prose files a runtime assertion used to grep
// (graduation ruling anchors and `blockedBy` targets) are compiled into minimal immutable facts so
// the image never carries `planning/**`, `docs/**` or `rfc/**` prose. F12-E2 (D2) replaces this
// producer with the F3/F4 compiled bundle; it may add eligible files but cannot weaken the
// exclusions below.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";

import { isPackDocumentFileName, PACK_SIDECAR_BASENAMES } from "../../../packages/schema/src/pack-path/index.ts";
import { GRADUATION_RULING_ANCHOR_ROOTS } from "../../../apps/server/src/graduation-ruling-roots.mjs";
import { REPO_ROOT, canonicalJson, localPathHits, readJson, sha256Digest } from "./common.mjs";

export const RUNTIME_CONTENT_PRODUCER = "tabiya-temporary-allow-list@1";
export const RUNTIME_CONTENT_RIGHTS_PATH = "release/runtime-content-rights.v1.json";
/** Where the bundle's manifest and compiled facts live inside the image (and the staged bundle). */
export const RUNTIME_CONTENT_MANIFEST = "runtime-content/manifest.json";
export const RUNTIME_CONTENT_FACTS = "runtime-content/facts.json";

/** Paths/names that can never enter the runtime bundle, whatever a future producer lists. */
export const RUNTIME_CONTENT_EXCLUSIONS = Object.freeze([
  { id: "candidates", test: (path) => path.startsWith("content/candidates/") },
  { id: "authoring-sidecar", test: (path) => /\.(?:job|priority|graduation)\.json$/u.test(path) || ["job.json", "priority.json", "graduation.json"].includes(basename(path)) },
  { id: "browser-fixture", test: (path) => path.endsWith(".browser.json") || path.startsWith("tests/") },
  { id: "planning", test: (path) => path.startsWith("planning/") },
  { id: "prose", test: (path) => /\.md$/u.test(path) },
  { id: "source-tooling", test: (path) => path.startsWith("tools/") || path.startsWith("content/sources/") || path.startsWith("vendor/") },
  { id: "schema-fixture", test: (path) => path.startsWith("schemas/fixtures/") || path.endsWith(".example.json") },
]);

function exclusionFor(path) {
  return RUNTIME_CONTENT_EXCLUSIONS.find((rule) => rule.test(path))?.id;
}

function listFiles(root, directory, { recursive, filter }) {
  const absolute = resolve(root, directory);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return recursive ? listFiles(root, path, { recursive, filter }) : [];
    return entry.isFile() && filter(entry.name) ? [path] : [];
  }).sort();
}

function sidecarsFor(path) {
  const directory = dirname(path);
  const name = basename(path);
  // Only the ledger (evidence) and manifest (sources) sidecars are opened by the production
  // pack registry (apps/server/src/pack-registry.ts sidecarPaths); every other reserved sidecar
  // is authoring-only.
  const [ledger, manifest] = PACK_SIDECAR_BASENAMES;
  if (name === "pack.json") return [join(directory, ledger), join(directory, manifest)];
  const stem = name.slice(0, -extname(name).length);
  return [join(directory, `${stem}.${ledger}`), join(directory, `${stem}.${manifest}`)];
}

function declaredLicence(document) {
  const value = document?.provenance?.licence ?? document?.licence;
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * Plans the bundle from a repository root. Returns the exact file list (with family, licence and
 * digest), the compiled facts and the excluded census. Throws when an admitted file carries a
 * workstation-local path or when a family's rights cannot be established.
 */
export function planRuntimeContent({ root = REPO_ROOT } = {}) {
  const rights = readJson(resolve(root, RUNTIME_CONTENT_RIGHTS_PATH));
  if (rights.format !== "tabiya-runtime-content-rights" || rights.formatVersion !== 1) throw new TypeError("runtime-content rights have an unknown format/version");
  const files = new Map();
  const excluded = [];

  function admit(path, family, licence, licenceBasis) {
    const reason = exclusionFor(path);
    if (reason !== undefined) {
      excluded.push({ path, reason });
      return;
    }
    const bytes = readFileSync(resolve(root, path));
    const hits = localPathHits(bytes.toString("utf8"));
    if (hits.length > 0) throw new TypeError(`runtime content ${path} carries a workstation-local path: ${hits.join(", ")}`);
    files.set(path, { path, family, bytes: bytes.length, sha256: sha256Digest(bytes), licence, licenceBasis });
  }

  const packDocuments = [
    ...listFiles(root, "content/packs", { recursive: true, filter: () => true }),
    ...listFiles(root, "content/drafts", { recursive: true, filter: () => true }),
  ];
  const packs = [];
  for (const path of packDocuments) {
    if (!isPackDocumentFileName(basename(path))) {
      excluded.push({ path, reason: exclusionFor(path) ?? "not-a-served-pack-document" });
      continue;
    }
    const document = JSON.parse(readFileSync(resolve(root, path), "utf8"));
    const declared = declaredLicence(document);
    const licence = declared ?? rights.authoredContentDefault.licence;
    const basis = declared === undefined ? rights.authoredContentDefault.basis : "declared:provenance.licence";
    admit(path, "pack", licence, basis);
    packs.push({ path, document });
    for (const sidecar of sidecarsFor(path)) {
      if (!existsSync(resolve(root, sidecar))) continue;
      const value = JSON.parse(readFileSync(resolve(root, sidecar), "utf8"));
      const thirdParty = Array.isArray(value?.entries)
        ? [...new Set(value.entries.map((entry) => entry?.licence?.spdx).filter((spdx) => typeof spdx === "string"))].sort()
        : [];
      for (const entry of Array.isArray(value?.entries) ? value.entries : []) {
        if (entry?.licence?.spdx == null && entry?.licence?.basis !== "no-rights-asserted") {
          throw new TypeError(`${sidecar} has a source entry with neither an SPDX licence nor a no-rights-asserted basis`);
        }
      }
      admit(sidecar, "pack-sidecar", [licence, ...thirdParty].join(" AND "), `inherits ${path}${thirdParty.length > 0 ? " plus declared source licences" : "; sources assert no third-party rights"}`);
    }
  }
  for (const [family, directory] of [["shape", "content/shapes"], ["principle", "content/principles"]]) {
    for (const path of listFiles(root, directory, { recursive: false, filter: (name) => extname(name) === ".json" })) {
      const document = JSON.parse(readFileSync(resolve(root, path), "utf8"));
      const declared = declaredLicence(document);
      admit(path, family, declared ?? rights.authoredContentDefault.licence, declared === undefined ? rights.authoredContentDefault.basis : "declared:provenance.licence");
    }
  }
  for (const [family, paths] of [
    ["concept-registry", [
      ...listFiles(root, "content/concepts", { recursive: false, filter: (name) => name === "current.json" }),
      ...listFiles(root, "content/concepts/revisions", { recursive: false, filter: (name) => !name.startsWith(".") }),
    ]],
    ["valence-register", listFiles(root, "content/valence", { recursive: false, filter: (name) => name === "register.json" })],
    ["campaign", listFiles(root, "content/campaigns", { recursive: false, filter: (name) => extname(name) === ".json" })],
  ]) {
    for (const path of paths) admit(path, family, rights.authoredContentDefault.licence, rights.authoredContentDefault.basis);
  }
  for (const path of listFiles(root, "schemas", { recursive: false, filter: (name) => name.endsWith(".schema.json") })) {
    admit(path, "schema", rights.schemas.licence, rights.schemas.basis);
  }
  admit(rights.openingCatalogue.path, "opening-catalogue", rights.openingCatalogue.licence, rights.openingCatalogue.basis);

  // Compiled facts replacing the prose files a pack assertion reads at startup.
  const rulingLines = {};
  const resolvedPaths = new Set();
  const cache = new Map();
  const lines = (file) => {
    if (!cache.has(file)) cache.set(file, readFileSync(resolve(root, file), "utf8").split(/\r?\n/u));
    return cache.get(file);
  };
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (value === null || typeof value !== "object") return;
    const ref = value.accepted?.rulingRef;
    if (typeof ref === "string") {
      const match = /^(?<file>[^#]+)#L(?<line>[1-9][0-9]*)$/u.exec(ref);
      if (match !== null && GRADUATION_RULING_ANCHOR_ROOTS.includes(match.groups.file) && existsSync(resolve(root, match.groups.file))) {
        const text = lines(match.groups.file)[Number(match.groups.line) - 1];
        if (text !== undefined) rulingLines[ref] = text;
      }
    }
    if (typeof value.blockedBy === "string") {
      const target = value.blockedBy.split("#", 1)[0];
      if (existsSync(resolve(root, target))) resolvedPaths.add(target);
    }
    Object.values(value).forEach(visit);
  };
  for (const { document } of packs) visit(document?.provenance?.graduationBlockers);
  for (const text of Object.values(rulingLines)) {
    const hits = localPathHits(text);
    if (hits.length > 0) throw new TypeError(`a compiled ruling line carries a workstation-local path: ${hits.join(", ")}`);
  }
  const facts = {
    format: "tabiya-runtime-content-facts",
    formatVersion: 1,
    rulingRoots: [...GRADUATION_RULING_ANCHOR_ROOTS].sort(),
    rulingLines: Object.fromEntries(Object.entries(rulingLines).sort(([left], [right]) => left.localeCompare(right))),
    resolvedPaths: [...resolvedPaths].sort(),
  };
  const factsText = canonicalJson(facts);
  const sortedFiles = [...files.values()].sort((left, right) => left.path.localeCompare(right.path));
  const body = {
    format: "tabiya-runtime-content-bundle",
    formatVersion: 1,
    producer: RUNTIME_CONTENT_PRODUCER,
    finalDischarge: false,
    rightsDigest: sha256Digest(readFileSync(resolve(root, RUNTIME_CONTENT_RIGHTS_PATH))),
    facts: { path: RUNTIME_CONTENT_FACTS, sha256: sha256Digest(Buffer.from(factsText)) },
    files: sortedFiles,
  };
  const digest = sha256Digest(Buffer.from(canonicalJson(body)));
  return Object.freeze({
    manifest: Object.freeze({ ...body, digest }),
    facts,
    factsText,
    excluded: Object.freeze(excluded.filter((entry) => !files.has(entry.path)).sort((left, right) => left.path.localeCompare(right.path))),
  });
}

/** Verifies a staged/extracted bundle tree against its manifest: exact set, bytes and digest. */
export function verifyRuntimeContentTree(root, manifest) {
  const errors = [];
  const { digest, ...body } = manifest;
  if (sha256Digest(Buffer.from(canonicalJson(body))) !== digest) errors.push("bundle manifest digest does not match its body");
  for (const file of manifest.files) {
    const absolute = resolve(root, file.path);
    if (!existsSync(absolute)) {
      errors.push(`allow-listed file missing: ${file.path}`);
      continue;
    }
    if (sha256Digest(readFileSync(absolute)) !== file.sha256) errors.push(`allow-listed file changed: ${file.path}`);
    const reason = exclusionFor(file.path);
    if (reason !== undefined) errors.push(`manifest lists an excluded path (${reason}): ${file.path}`);
  }
  const facts = resolve(root, manifest.facts.path);
  if (!existsSync(facts) || sha256Digest(readFileSync(facts)) !== manifest.facts.sha256) errors.push("compiled runtime facts missing or changed");
  return errors;
}

/** Every file under `directory` (relative POSIX paths) — used by the image census. */
export function walkFiles(directory, prefix = "") {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const absolute = join(directory, name);
    const path = prefix === "" ? name : `${prefix}/${name}`;
    return statSync(absolute).isDirectory() ? walkFiles(absolute, path) : [path];
  }).sort();
}

export function relativePosix(from, to) {
  return relative(from, to).split("\\").join("/");
}
