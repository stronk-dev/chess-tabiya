#!/usr/bin/env node
// rfc/safe-deployment-profiles.md §13 / rfc/storage-backup-recovery.md §8 — renders the release
// deployment artifacts from deploy/ with exact image references. One renderer serves the release
// workflow, the local Make targets and tools/verify-packaging.mjs.
//
//   node tools/render-deployment.mjs --out <dir> --server-image <ref> --maia-image <ref> \
//     --maia-manifest-digest <sha256:…> --maia-config-digest <sha256:…>
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Published file → template source. */
export const DEPLOYMENT_ARTIFACTS = Object.freeze({
  "compose.yaml": "deploy/compose.release.template.yaml",
  "compose.appliance.yaml": "deploy/compose.appliance.template.yaml",
  "compose.hosted.yaml": "deploy/compose.hosted.template.yaml",
  "compose.maintenance.yaml": "deploy/compose.maintenance.template.yaml",
  "Caddyfile.appliance": "deploy/Caddyfile.appliance",
  "Caddyfile.hosted": "deploy/Caddyfile.hosted",
});

export const CADDY_IMAGE = "docker.io/library/caddy:2.11.4-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648";

/** Same grammar as apps/server/src/config.ts parsePublicHostname (parity is unit-tested). */
export function validPublicHostname(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 253) return false;
  const labels = value.split(".");
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(label))) return false;
  if (/^\d+$/u.test(labels.at(-1))) return false;
  return !(value.endsWith(".local") || value.endsWith(".localhost") || value === "localhost");
}

export function renderDeployment({ serverImage, maiaImage, maiaManifestDigest, maiaConfigDigest, root = ROOT }) {
  for (const [name, value] of [["server", serverImage], ["maia", maiaImage]]) {
    if (typeof value !== "string" || !/^[a-z0-9./:_-]+(?:@sha256:[0-9a-f]{64})?$/u.test(value)) {
      throw new Error(`invalid ${name} image reference ${JSON.stringify(value)}`);
    }
  }
  // rfc/provider-health-degradation.md: the Maia sidecar proves its container identity from these.
  for (const [name, value] of [["maia manifest", maiaManifestDigest], ["maia config", maiaConfigDigest]]) {
    if (typeof value !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(value)) {
      throw new Error(`invalid ${name} digest ${JSON.stringify(value)}`);
    }
  }
  const rendered = {};
  for (const [name, source] of Object.entries(DEPLOYMENT_ARTIFACTS)) {
    const text = readFileSync(join(root, source), "utf8")
      .replaceAll("__SERVER_IMAGE__", serverImage)
      .replaceAll("__MAIA_IMAGE__", maiaImage)
      .replaceAll("__MAIA_MANIFEST_DIGEST__", maiaManifestDigest)
      .replaceAll("__MAIA_CONFIG_DIGEST__", maiaConfigDigest);
    if (/__[A-Z_]+__/u.test(text)) throw new Error(`${source} left an unrendered placeholder`);
    rendered[name] = text;
  }
  return rendered;
}

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const out = argument(argv, "--out");
  const serverImage = argument(argv, "--server-image");
  const maiaImage = argument(argv, "--maia-image");
  const maiaManifestDigest = argument(argv, "--maia-manifest-digest");
  const maiaConfigDigest = argument(argv, "--maia-config-digest");
  if (out === undefined || serverImage === undefined || maiaImage === undefined || maiaManifestDigest === undefined || maiaConfigDigest === undefined) {
    console.error("usage: render-deployment.mjs --out <dir> --server-image <ref> --maia-image <ref> --maia-manifest-digest <sha256:…> --maia-config-digest <sha256:…>");
    process.exit(2);
  }
  const hostname = argument(argv, "--check-hostname");
  if (hostname !== undefined && !validPublicHostname(hostname)) {
    console.error(`HOSTNAME_INVALID: ${JSON.stringify(hostname)} is not a lower-case DNS hostname (no IP, wildcard, .local or trailing dot)`);
    process.exit(2);
  }
  mkdirSync(out, { recursive: true });
  for (const [name, text] of Object.entries(renderDeployment({ serverImage, maiaImage, maiaManifestDigest, maiaConfigDigest }))) writeFileSync(join(out, name), text);
  console.error(`rendered ${Object.keys(DEPLOYMENT_ARTIFACTS).length} deployment artifacts into ${out}`);
}
