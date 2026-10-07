import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";
import { test } from "node:test";
import { archiveStorageKind, assembleArchiveParts, freezeArchiveBytes, freezeArchiveParts, maxDirectArchiveBytes,
  maxPartBytes, readCostArchiveBytes, writeCostArchiveBytes } from "./cost-archive-parts.mjs";

const sha = bytes => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const name = "d3262-cost-live-test-parts.json.gz";
const bytes = gzipSync(JSON.stringify({ version: 1, authority: "synthetic_control_not_live_evidence", cases: ["cold", "warm", "offline"] }));
function fixture() {
  const parts = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const value = bytes.subarray(offset, offset + 16);
    parts.push({ name: `${name}.part-${String(parts.length).padStart(4, "0")}`, offset, bytes: value.length, digest: sha(value) });
  }
  return { manifest: { format: "d3262-cost-byte-parts-v1", authority: "lossless_byte_transport_not_recapture_or_measurement",
    originalDigest: sha(bytes), originalBytes: bytes.length, partBytes: 16, parts },
  read: name => { const part = parts.find(p => p.name === name); return bytes.subarray(part.offset, part.offset + part.bytes); } };
}
test("all byte parts reconstruct exact original compressed bytes, not reserialized data", () => {
  const { manifest, read } = fixture();
  assert.deepEqual(assembleArchiveParts(manifest, name, read), bytes);
});
test("the package writer automatically selects parts strictly above the unpushable file boundary", () => {
  assert.equal(archiveStorageKind(maxDirectArchiveBytes - 1), "legacy_gzip");
  assert.equal(archiveStorageKind(maxDirectArchiveBytes), "legacy_gzip");
  assert.equal(archiveStorageKind(maxDirectArchiveBytes + 1), "byte_parts");
  for (const value of [0, -1, NaN, Infinity, 0.5, "100"]) assert.throws(() => archiveStorageKind(value));
});
test("the shared writer preserves legacy archives and byte-only transport is independently reconstructable", () => {
  const directory = mkdtempSync(join(tmpdir(), "d3509-writer-"));
  try {
    const legacy = join(directory, "d3262-cost-live-test.json.gz"), parts = join(directory, name);
    const written = writeCostArchiveBytes(bytes, legacy);
    assert.equal(written.storage, "legacy_gzip"); assert.deepEqual(readFileSync(legacy), bytes);
    freezeArchiveBytes(bytes, parts, 16); assert.deepEqual(readCostArchiveBytes(parts), bytes);
    assert.throws(() => writeCostArchiveBytes(bytes, legacy), /EEXIST/u);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
for (const [label, mutate] of [
  ["foreign authority", m => { m.authority = "new_measurement"; }],
  ["foreign field", m => { m.complete = true; }],
  ["foreign format", m => { m.format = "other"; }],
  ["missing part", m => { m.parts.pop(); }],
  ["extra part", m => { m.parts.push(m.parts[0]); }],
  ["reordered parts", m => { m.parts.reverse(); }],
  ["duplicate part", m => { m.parts[1] = { ...m.parts[0] }; }],
  ["path traversal", m => { m.parts[0].name = "../other"; }],
  ["crossed archive", m => { m.parts[0].name = "d3262-cost-live-other.json.gz.part-0000"; }],
  ["range gap", m => { m.parts[1].offset++; }],
  ["wrong part size", m => { m.parts[0].bytes--; }],
  ["wrong part digest", m => { m.parts[0].digest = sha("wrong"); }],
  ["wrong whole digest", m => { m.originalDigest = sha("wrong"); }],
  ["wrong whole size", m => { m.originalBytes++; }],
  ["oversized member policy", m => { m.partBytes = maxPartBytes + 1; }],
  ["zero member policy", m => { m.partBytes = 0; }],
  ["fractional member policy", m => { m.partBytes = 0.5; }],
  ["foreign part field", m => { m.parts[0].clock = 0; }],
]) test(`refuses ${label}`, () => {
  const { manifest, read } = fixture(); mutate(manifest);
  assert.throws(() => assembleArchiveParts(manifest, name, read), /D3509_ARCHIVE_PARTS/u);
});
test("resealed parts cannot alter original whole-byte digest", () => {
  const { manifest, read } = fixture(); const replacement = Buffer.from(read(manifest.parts[0].name));
  replacement[0] ^= 1; manifest.parts[0].digest = sha(replacement);
  assert.throws(() => assembleArchiveParts(manifest, name, p => p === manifest.parts[0].name ? replacement : read(p)), /whole archive/u);
});
test("missing and truncated actual member bytes refuse", () => {
  const { manifest, read } = fixture();
  assert.throws(() => assembleArchiveParts(manifest, name, () => undefined), /part bytes/u);
  assert.throws(() => assembleArchiveParts(manifest, name, p => read(p).subarray(1)), /part bytes/u);
});
test("filesystem freeze, legacy read, byte reconstruction, no overwrite or source rewrite", () => {
  const directory = mkdtempSync(join(tmpdir(), "d3509-parts-"));
  try {
    const source = join(directory, "legacy.json.gz"), out = join(directory, name);
    writeFileSync(source, bytes);
    const result = freezeArchiveParts(source, out, 16);
    assert.equal(result.originalDigest, sha(bytes)); assert.equal(result.originalBytes, bytes.length);
    assert.deepEqual(readCostArchiveBytes(source), bytes); assert.deepEqual(readCostArchiveBytes(out), bytes);
    assert.deepEqual(readFileSync(source), bytes);
    assert.equal(JSON.parse(gunzipSync(readFileSync(out))).format, "d3262-cost-byte-parts-v1");
    assert.throws(() => freezeArchiveParts(source, out, 16), /overwrite/u);
    assert.throws(() => freezeArchiveParts(source, source, 16), /distinct/u);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
test("preexisting member refuses before creating other files or manifest", () => {
  const directory = mkdtempSync(join(tmpdir(), "d3509-collision-"));
  try {
    const source = join(directory, "legacy.json.gz"), out = join(directory, name);
    writeFileSync(source, bytes); writeFileSync(`${out}.part-0001`, "preserve");
    assert.throws(() => freezeArchiveParts(source, out, 16), /partial previous/u);
    assert.equal(existsSync(out), false); assert.equal(existsSync(`${out}.part-0000`), false);
    assert.equal(readFileSync(`${out}.part-0001`, "utf8"), "preserve");
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
