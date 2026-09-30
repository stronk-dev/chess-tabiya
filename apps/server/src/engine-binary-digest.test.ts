import { digestEngineBinary, providerUtf8 } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";
import { digestExecutableStream } from "./engine-binary-digest.js";

describe("server executable streaming adapter", () => {
  it("equals the unchanged central fixed-domain identity across block/chunk boundaries", async () => {
    for (const length of [1, 55, 56, 63, 64, 65, 127, 128, 1027]) {
      const bytes = Uint8Array.from({ length }, (_, index) => index * 29 & 255);
      for (const width of [1, 7, 55, 56, 63, 64, 65, 127, 256, 1027]) {
        async function* chunks() {
          yield new Uint8Array();
          for (let offset = 0; offset < bytes.length; offset += width) yield bytes.subarray(offset, offset + width);
        }
        expect(await digestExecutableStream(chunks())).toBe(digestEngineBinary(bytes));
      }
    }
  });

  it("refuses empty/malformed input and closes a failed iterator", async () => {
    async function* empty() { yield new Uint8Array(); }
    await expect(digestExecutableStream(empty())).rejects.toThrow(/launched executable/);
    let closed = false;
    async function* malformed() { try { yield "not bytes" as unknown as Uint8Array; } finally { closed = true; } }
    await expect(digestExecutableStream(malformed())).rejects.toThrow(/byte chunks/);
    expect(closed).toBe(true);
    async function* failedRead() { yield providerUtf8("partial"); throw new Error("read failed"); }
    await expect(digestExecutableStream(failedRead())).rejects.toThrow("read failed");
  });
});
