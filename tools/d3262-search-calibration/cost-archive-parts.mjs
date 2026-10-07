// Disposable D3509 transport. Reconstructs the ORIGINAL compressed cost archive;
// no candidate, source, clock, parser, profile or measurement is changed.
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const format = "d3262-cost-byte-parts-v1";
export const maxPartBytes = 40 * 1024 * 1024;
export const maxDirectArchiveBytes = 100 * 1024 * 1024;
const sha = bytes => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const check = (value, message) => { if (!value) throw new Error(`D3509_ARCHIVE_PARTS: ${message}`); };
const digest = value => typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value);
const exact = (value, fields) => check(value && typeof value === "object" && !Array.isArray(value)
  && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...fields].sort()), "foreign fields");
const archiveName = name => /^d3262-cost-live-[a-z0-9-]+\.json\.gz$/u.test(name);

export function assembleArchiveParts(manifest, name, readPart) {
  exact(manifest, ["format", "authority", "originalDigest", "originalBytes", "partBytes", "parts"]);
  check(archiveName(name) && manifest.format === format
    && manifest.authority === "lossless_byte_transport_not_recapture_or_measurement", "foreign format/authority");
  check(digest(manifest.originalDigest) && Number.isSafeInteger(manifest.originalBytes)
    && manifest.originalBytes > 0 && Number.isSafeInteger(manifest.partBytes)
    && manifest.partBytes > 0 && manifest.partBytes <= maxPartBytes, "invalid original/part size");
  check(Array.isArray(manifest.parts) && manifest.parts.length > 0
    && manifest.parts.length === Math.ceil(manifest.originalBytes / manifest.partBytes), "missing/extra parts");
  let offset = 0;
  const parts = manifest.parts.map((part, index) => {
    exact(part, ["name", "offset", "bytes", "digest"]);
    const expectedName = `${name}.part-${String(index).padStart(4, "0")}`;
    const expectedBytes = Math.min(manifest.partBytes, manifest.originalBytes - offset);
    check(part.name === expectedName && part.offset === offset && part.bytes === expectedBytes
      && digest(part.digest), "crossed part identity/order/range");
    const bytes = readPart(part.name);
    check(Buffer.isBuffer(bytes) && bytes.length === part.bytes && sha(bytes) === part.digest, "missing/changed part bytes");
    offset += part.bytes;
    return bytes;
  });
  const bytes = Buffer.concat(parts);
  check(offset === manifest.originalBytes && bytes.length === manifest.originalBytes
    && sha(bytes) === manifest.originalDigest, "changed whole archive");
  return bytes;
}

export function readCostArchiveBytes(path) {
  const bytes = readFileSync(path), plain = gunzipSync(bytes);
  // Legacy archives remain literal. Do not parse their large envelope twice.
  if (!plain.subarray(0, 128).toString("utf8").startsWith(`{"format":"${format}"`)) return bytes;
  return assembleArchiveParts(JSON.parse(plain), basename(path), name => readFileSync(join(dirname(path), name)));
}

export function archiveStorageKind(bytes) {
  check(Number.isSafeInteger(bytes) && bytes > 0, "invalid archive size");
  return bytes > maxDirectArchiveBytes ? "byte_parts" : "legacy_gzip";
}

export function freezeArchiveBytes(bytes, out, partBytes = maxPartBytes) {
  check(Buffer.isBuffer(bytes) && bytes.length > 0 && archiveName(basename(out)), "explicit archive bytes/manifest required");
  check(Number.isSafeInteger(partBytes) && partBytes > 0 && partBytes <= maxPartBytes, "invalid part size");
  const parts = [];
  for (let offset = 0; offset < bytes.length; offset += partBytes) {
    const piece = bytes.subarray(offset, offset + partBytes);
    parts.push({ name: `${basename(out)}.part-${String(parts.length).padStart(4, "0")}`,
      offset, bytes: piece.length, digest: sha(piece) });
  }
  check(!existsSync(out) && parts.every(part => !existsSync(join(dirname(out), part.name))), "refuse overwrite or partial previous output");
  const manifest = { format, authority: "lossless_byte_transport_not_recapture_or_measurement",
    originalDigest: sha(bytes), originalBytes: bytes.length, partBytes, parts };
  for (const part of parts) writeFileSync(join(dirname(out), part.name),
    bytes.subarray(part.offset, part.offset + part.bytes), { flag: "wx" });
  writeFileSync(out, gzipSync(`${JSON.stringify(manifest)}\n`), { flag: "wx" });
  check(readCostArchiveBytes(out).equals(bytes), "written parts do not reconstruct original");
  return { manifest: out, manifestDigest: sha(readFileSync(out)), originalDigest: manifest.originalDigest,
    originalBytes: bytes.length, parts: parts.length, maxPartBytes: Math.max(...parts.map(part => part.bytes)) };
}

export function freezeArchiveParts(source, out, partBytes = maxPartBytes) {
  check(resolve(source) !== resolve(out), "distinct immutable manifest required");
  return freezeArchiveBytes(readCostArchiveBytes(source), out, partBytes);
}

export function writeCostArchiveBytes(bytes, out) {
  if (archiveStorageKind(bytes.length) === "byte_parts") return freezeArchiveBytes(bytes, out);
  writeFileSync(out, bytes, { flag: "wx" });
  return { originalDigest: sha(bytes), originalBytes: bytes.length, storage: "legacy_gzip" };
}

export function auditAutomaticPartsWriter(source) {
  const bytes = readCostArchiveBytes(source);
  check(archiveStorageKind(bytes.length) === "byte_parts", "actual oversized source required");
  const directory = mkdtempSync(join(tmpdir(), "d3509-automatic-writer-"));
  try {
    const out = join(directory, "d3262-cost-live-automatic-writer.json.gz");
    const result = writeCostArchiveBytes(bytes, out);
    check(result.parts === Math.ceil(bytes.length / maxPartBytes)
      && result.originalDigest === sha(bytes) && statSync(out).size < maxDirectArchiveBytes
      && readCostArchiveBytes(out).equals(bytes), "automatic writer did not preserve bounded original bytes");
    return { originalDigest: sha(bytes), originalBytes: bytes.length, parts: result.parts,
      manifestBytes: statSync(out).size, validation: "actual_shared_package_writer_not_policy_helper_only" };
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length === 4 && args[0] === "--source" && args[2] === "--out")
    process.stdout.write(`${JSON.stringify(freezeArchiveParts(args[1], args[3]))}\n`);
  else if (args.length === 2 && args[0] === "--check") {
    const bytes = readCostArchiveBytes(args[1]);
    process.stdout.write(`${JSON.stringify({ archive: args[1], originalDigest: sha(bytes), originalBytes: bytes.length })}\n`);
  } else if (args.length === 2 && args[0] === "--audit-writer")
    process.stdout.write(`${JSON.stringify(auditAutomaticPartsWriter(args[1]))}\n`);
  else throw new Error("Use --source <immutable archive> --out <new manifest>, --check <manifest>, or --audit-writer <oversized archive>");
}
