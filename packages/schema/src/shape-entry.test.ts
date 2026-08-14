import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

import { SHAPE_ENTRY_SCHEMA_VERSION } from "./index.js";
import { digestShapeEntry } from "./shape-entry/index.js";

const json = (path: string): any => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const schema = json("../../../schemas/shape_entry.schema.json");
const packSchema = json("../../../schemas/drill_pack.schema.json");
const entries = ["carlsbad", "iqp-white", "iqp-black", "rook-4v3-same-side"].map((id) => json(`../../../content/shapes/${id}.json`));

describe("shape entry schema 0.1", () => {
  it("is closed everywhere and shares the pack expression grammar", () => {
    const open: string[] = [];
    const walk = (value: unknown, path = ""): void => {
      if (value === null || typeof value !== "object") return;
      if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${path}/${index}`));
      const object = value as Record<string, unknown>;
      if (object.type === "object" && object.additionalProperties !== false) open.push(path);
      Object.entries(object).forEach(([key, child]) => walk(child, `${path}/${key}`));
    };
    walk(schema);
    expect(open).toEqual([]);
    expect(schema.$defs.structuralExpression).toEqual(packSchema.$defs.structuralExpression);
    expect(SHAPE_ENTRY_SCHEMA_VERSION).toBe("0.1");
  });

  it("validates all official entries", () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true }); addFormats(ajv);
    const validate = ajv.compile(schema);
    for (const entry of entries) expect(validate(entry), JSON.stringify(validate.errors)).toBe(true);
  });

  it("uses key-order invariant shared canonical digests", async () => {
    const entry = entries[0];
    expect(await digestShapeEntry(entry)).toBe(await digestShapeEntry(Object.fromEntries(Object.entries(entry).reverse())));
    expect(await digestShapeEntry(entry)).not.toBe(await digestShapeEntry({ ...entry, version: "0.1.1" }));
  });
});
