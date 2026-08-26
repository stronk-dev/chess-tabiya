import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const SERVER_ROOT = fileURLToPath(new URL(".", import.meta.url));

function productionSources(directory = SERVER_ROOT): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "dist" || entry.name === "fixtures" ? [] : productionSources(path);
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

function occurrences(pattern: RegExp): readonly { readonly file: string; readonly line: number; readonly text: string }[] {
  return productionSources().flatMap((file) => readFileSync(file, "utf8").split("\n").flatMap((text, index) =>
    pattern.test(text) ? [{ file: relative(SERVER_ROOT, file), line: index + 1, text: text.trim() }] : [],
  ));
}

describe("learner-rating standing write reachability", () => {
  it("permits exactly one production standing-member writer and binds it to the authenticated learner", () => {
    const calls = occurrences(/\.publishStandingMember\(/u);
    expect(calls).toEqual([
      expect.objectContaining({ file: "service.ts", text: "return ratings.publishStandingMember(Object.freeze({" }),
    ]);

    const service = readFileSync(join(SERVER_ROOT, "service.ts"), "utf8");
    const callStart = service.indexOf("return ratings.publishStandingMember(Object.freeze({");
    expect(callStart).toBeGreaterThan(-1);
    expect(service.slice(callStart, callStart + 240)).toContain("learnerId: principal.learnerId");
  });

  it("permits exactly one SQL insertion authority for standing membership", () => {
    expect(occurrences(/INSERT INTO standing_members/u)).toEqual([
      expect.objectContaining({ file: "storage.ts" }),
    ]);
  });
});
