import { readFileSync, readdirSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

import { PRINCIPLE_ENTRY_SCHEMA_VERSION } from "./index.js";
import { digestPrincipleEntry } from "./principle-entry/index.js";

const json = (path: string): unknown => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const schema = json("../../../schemas/principle_entry.schema.json") as Record<string, unknown>;
const entries = readdirSync(new URL("../../../content/principles/", import.meta.url))
  .filter((name) => name.endsWith(".json"))
  .sort()
  .map((name) => json(`../../../content/principles/${name}`));

describe("principle entry schema 0.1", () => {
  it("binds the exported version to the schema identity and stays closed", () => {
    const open: string[] = [];
    const walk = (value: unknown, pointer = ""): void => {
      if (value === null || typeof value !== "object") return;
      if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${pointer}/${index}`));
      const object = value as Record<string, unknown>;
      if (object.type === "object" && object.additionalProperties !== false) open.push(pointer);
      Object.entries(object).forEach(([key, child]) => walk(child, `${pointer}/${key}`));
    };

    walk(schema);
    expect(open).toEqual([]);
    expect(schema.$id).toBe(`urn:chess-tabiya:schema:principle-entry:${PRINCIPLE_ENTRY_SCHEMA_VERSION}`);
    expect(PRINCIPLE_ENTRY_SCHEMA_VERSION).toBe("0.1");
  });

  it("validates every registered principle", () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) expect(validate(entry), JSON.stringify(validate.errors)).toBe(true);
  });

  it("uses the shared key-order-invariant canonical digest", async () => {
    const entry = entries[0] as Record<string, unknown>;
    expect(await digestPrincipleEntry(entry)).toBe(
      await digestPrincipleEntry(Object.fromEntries(Object.entries(entry).reverse())),
    );
    expect(await digestPrincipleEntry(entry)).not.toBe(
      await digestPrincipleEntry({ ...entry, version: "0.1.1" }),
    );
  });
});
