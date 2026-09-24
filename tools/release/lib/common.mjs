// rfc/verifiable-runtime-distribution.md — shared release-tool primitives.
// Canonical JSON (RFC 8785 for the integer/string/boolean/null/object/array subset the release
// artifacts use), SHA-256 digests and repository paths. Every release artifact is written through
// `canonicalJson` so a byte change is always a semantic change.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export function repoPath(...parts) {
  return resolve(REPO_ROOT, ...parts);
}

function canonical(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical JSON refuses non-finite numbers");
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (typeof value === "object") {
    // RFC 8785 §3.2.3 sorts member names by UTF-16 code units, which is the default JS order.
    const keys = Object.keys(value).filter((key) => value[key] !== undefined).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  throw new TypeError(`canonical JSON refuses ${typeof value}`);
}

/** Canonical UTF-8 JSON with a trailing newline. */
export function canonicalJson(value) {
  return `${canonical(value)}\n`;
}

export function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function sha256Digest(bytes) {
  return `sha256:${sha256Hex(bytes)}`;
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function fileDigest(path) {
  return sha256Digest(readFileSync(path));
}

export const DIGEST = /^sha256:[0-9a-f]{64}$/u;
export const REVISION = /^[0-9a-f]{40}$/u;

export function requireDigest(value, label) {
  if (typeof value !== "string" || !DIGEST.test(value)) throw new TypeError(`${label} must be a lowercase sha256:<64 hex> digest`);
  return value;
}

/** Absolute or workstation-local paths that must never reach a release artifact or image. */
export const LOCAL_PATH_PATTERNS = Object.freeze([
  /\/Users\/[A-Za-z0-9._-]+/u,
  /\/private\/(?:tmp|var)\//u,
  /\/home\/[a-z][A-Za-z0-9._-]*\//u,
  /\/var\/folders\//u,
  /[A-Z]:\\Users\\/u,
]);

export function localPathHits(text) {
  return LOCAL_PATH_PATTERNS.flatMap((pattern) => {
    const match = pattern.exec(text);
    return match === null ? [] : [match[0]];
  });
}
