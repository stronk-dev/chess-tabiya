import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

const schema = JSON.parse(readFileSync(new URL("../../../schemas/campaign.schema.json", import.meta.url), "utf8")) as Record<string, unknown>;

describe("campaign schema", () => {
  it("closes every object and compiles under strict JSON Schema", () => {
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
    expect(schema.$id).toBe("urn:chess-tabiya:schema:campaign:1");
    expect(() => new Ajv2020({ allErrors: true, strict: true }).compile(schema)).not.toThrow();
  });
});
