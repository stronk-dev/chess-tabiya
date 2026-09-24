// rfc/verifiable-runtime-distribution.md §2/§6 — the JavaScript runtime inventory.
//
// `pnpm-lock.yaml` is the resolution authority. The server and web artifacts are bundles, so no
// scanner can see the packages inside them; this module projects the exact production dependency
// closure of the shipped workspace importers from the lockfile (name, version, registry integrity)
// and reads each installed package's declared licence and licence file.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { REPO_ROOT, sha256Digest } from "./common.mjs";

/** Workspace importers whose production closure ships inside the server image. */
export const SHIPPED_IMPORTERS = Object.freeze(["apps/server", "apps/web", "packages/runtime", "packages/schema"]);
const RUNTIME_SECTIONS = new Set(["dependencies", "optionalDependencies"]);

function unquote(value) {
  const text = value.trim();
  return (text.startsWith("'") && text.endsWith("'")) || (text.startsWith('"') && text.endsWith('"')) ? text.slice(1, -1) : text;
}

/** Strips pnpm's peer-resolution suffix: `ajv-formats@3.0.1(ajv@8.17.1)` → `ajv-formats@3.0.1`. */
export function packageKey(key) {
  const index = key.indexOf("(");
  return index < 0 ? key : key.slice(0, index);
}

export function splitKey(key) {
  const at = key.lastIndexOf("@");
  if (at <= 0) throw new TypeError(`invalid lockfile package key ${key}`);
  return { name: key.slice(0, at), version: key.slice(at + 1) };
}

/** A targeted parser for the lockfile v9 sections this inventory needs. */
export function parseLockfile(text) {
  const importers = {};
  const packages = {};
  const snapshots = {};
  let section;
  let entry;
  let group;
  let dependency;
  for (const raw of text.split(/\r?\n/u)) {
    if (raw.trim() === "") continue;
    const indent = raw.length - raw.trimStart().length;
    const line = raw.trim();
    if (indent === 0) {
      section = line.replace(/:$/u, "");
      entry = undefined;
      continue;
    }
    if (section === "lockfileVersion") continue;
    if (indent === 2) {
      entry = unquote(line.replace(/:$/u, "").replace(/: \{\}$/u, ""));
      group = undefined;
      if (section === "importers") importers[entry] = {};
      if (section === "packages") packages[entry] = {};
      if (section === "snapshots") snapshots[entry] = {};
      continue;
    }
    if (entry === undefined) continue;
    if (section === "packages" && indent === 4 && line.startsWith("resolution:")) {
      const integrity = /integrity: ([^,}\s]+)/u.exec(line)?.[1];
      const tarball = /tarball: ([^,}\s]+)/u.exec(line)?.[1];
      packages[entry].integrity = integrity;
      if (tarball !== undefined) packages[entry].tarball = tarball;
      continue;
    }
    if (section === "packages" && indent === 4 && line.startsWith("license:")) {
      packages[entry].license = unquote(line.slice("license:".length));
      continue;
    }
    if (section === "snapshots" && indent === 4) {
      group = line.replace(/:$/u, "");
      snapshots[entry][group] ??= {};
      continue;
    }
    if (section === "snapshots" && indent === 6 && group !== undefined && RUNTIME_SECTIONS.has(group)) {
      const colon = line.indexOf(": ");
      if (colon > 0) snapshots[entry][group][unquote(line.slice(0, colon))] = unquote(line.slice(colon + 2));
      continue;
    }
    if (section === "importers" && indent === 4) {
      group = line.replace(/:$/u, "");
      importers[entry][group] ??= {};
      continue;
    }
    if (section === "importers" && indent === 6) {
      dependency = unquote(line.replace(/:$/u, ""));
      continue;
    }
    if (section === "importers" && indent === 8 && line.startsWith("version:") && dependency !== undefined) {
      importers[entry][group][dependency] = unquote(line.slice("version:".length));
    }
  }
  return { importers, packages, snapshots };
}

/** The production dependency closure (`name@version` keys) of the given workspace importers. */
export function productionClosure(lock, importerPaths = SHIPPED_IMPORTERS) {
  const seen = new Set();
  const queue = [];
  for (const path of importerPaths) {
    const importer = lock.importers[path];
    if (importer === undefined) throw new TypeError(`lockfile has no importer ${path}`);
    for (const groupName of RUNTIME_SECTIONS) {
      for (const [name, version] of Object.entries(importer[groupName] ?? {})) {
        if (version.startsWith("link:")) continue;
        queue.push(`${name}@${version}`);
      }
    }
  }
  while (queue.length > 0) {
    const snapshotKey = queue.pop();
    if (seen.has(snapshotKey)) continue;
    seen.add(snapshotKey);
    const snapshot = lock.snapshots[snapshotKey] ?? {};
    for (const groupName of RUNTIME_SECTIONS) {
      for (const [name, version] of Object.entries(snapshot[groupName] ?? {})) {
        if (version.startsWith("link:")) continue;
        queue.push(`${name}@${version}`);
      }
    }
  }
  return [...new Set([...seen].map(packageKey))].sort();
}

const LICENSE_FILE = /^(?:licen[cs]e|copying|notice)(?:[.-].*)?$/iu;

function installedDirectory(root, name, version) {
  const store = resolve(root, "node_modules/.pnpm");
  const prefix = `${name.replace("/", "+")}@${version}`;
  const match = existsSync(store) ? readdirSync(store).filter((entry) => entry === prefix || entry.startsWith(`${prefix}_`) || entry.startsWith(`${prefix}(`)).sort()[0] : undefined;
  return match === undefined ? undefined : join(store, match, "node_modules", name);
}

function declaredLicense(manifest) {
  if (typeof manifest.license === "string") return manifest.license;
  if (manifest.license !== null && typeof manifest.license === "object" && typeof manifest.license.type === "string") return manifest.license.type;
  if (Array.isArray(manifest.licenses)) return manifest.licenses.map((item) => item?.type ?? item).join(" OR ");
  return undefined;
}

/**
 * Inventories the shipped JavaScript closure. Each component carries purl, version, registry
 * integrity, declared licence expression and the verbatim licence-file text with its digest.
 */
export function javascriptInventory({ root = REPO_ROOT, importers = SHIPPED_IMPORTERS } = {}) {
  const lock = parseLockfile(readFileSync(resolve(root, "pnpm-lock.yaml"), "utf8"));
  return productionClosure(lock, importers).map((key) => {
    const { name, version } = splitKey(key);
    const directory = installedDirectory(root, name, version);
    if (directory === undefined) throw new TypeError(`installed package ${key} is missing; run pnpm install --frozen-lockfile`);
    const manifest = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
    if (manifest.name !== name || manifest.version !== version) throw new TypeError(`installed package ${key} does not match its lockfile identity`);
    const licenseFiles = readdirSync(directory).filter((file) => LICENSE_FILE.test(file)).sort();
    const texts = licenseFiles.map((file) => ({ file, text: readFileSync(join(directory, file), "utf8") }));
    const integrity = lock.packages[key]?.integrity;
    if (integrity === undefined) throw new TypeError(`lockfile has no integrity for ${key}`);
    const purlName = name.startsWith("@") ? `%40${name.slice(1)}` : name;
    return Object.freeze({
      name,
      version,
      purl: `pkg:npm/${purlName}@${version}`,
      integrity,
      source: lock.packages[key]?.tarball ?? `https://registry.npmjs.org/${name}/-/${name.split("/").at(-1)}-${version}.tgz`,
      declaredExpression: declaredLicense(manifest),
      licenseFiles: Object.freeze(texts.map(({ file, text }) => Object.freeze({ file, sha256: sha256Digest(Buffer.from(text)), text }))),
    });
  });
}

/** Workspace manifests must carry an explicit licence; application packages must be AGPL-3.0-only. */
export function workspaceLicenceFindings({ root = REPO_ROOT } = {}) {
  const findings = [];
  const lock = parseLockfile(readFileSync(resolve(root, "pnpm-lock.yaml"), "utf8"));
  for (const path of Object.keys(lock.importers)) {
    const manifestPath = resolve(root, path, "package.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (typeof manifest.license !== "string" || manifest.license.trim() === "") findings.push(`${path}/package.json has no explicit licence field`);
    else if (manifest.license !== "AGPL-3.0-only") findings.push(`${path}/package.json must declare AGPL-3.0-only, found ${manifest.license}`);
  }
  return findings;
}
