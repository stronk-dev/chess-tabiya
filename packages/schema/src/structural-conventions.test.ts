import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import { STRUCTURAL_CONVENTION_REFS, assertStructuralConventionSelection, structuralConventionRefSchema } from "./drill-pack/structural-conventions.js";
import { materializeStructuralConventionSchema } from "../../../tools/structural-convention-materializer.js";

const schemas = ["drill_pack", "shape_entry"].map(name => JSON.parse(readFileSync(new URL(`../../../schemas/${name}.schema.json`, import.meta.url), "utf8")));
const validators = schemas.map(schema => {
  const ajv = new Ajv2020({ allErrors: true, strict: true }); addFormats(ajv);
  return ajv.compile({ $schema: schema.$schema, $defs: schema.$defs, $ref: "#/$defs/structuralExpression" });
});
const features = {
  king_opposition: { kind: "king_opposition", color: "white", form: "distant" },
  backward_pawn: { kind: "backward_pawn", color: "black", file: "c" },
  outpost: { kind: "outpost", color: "white", square: "e5" },
} as const;

describe("closed structural convention compatibility", () => {
  it("repairs stale already-materialized rows and refuses unrecognized branch formatting", () => {
    for (const name of ["drill_pack", "shape_entry"]) {
      const text = readFileSync(new URL(`../../../schemas/${name}.schema.json`, import.meta.url), "utf8");
      const changed = text.replaceAll('"id":{"enum":["outpost-candidate"]}', '"id":{"enum":["wrong-outpost"]}');
      expect(changed).not.toBe(text);
      expect(materializeStructuralConventionSchema(changed)).toBe(text);
      expect(materializeStructuralConventionSchema(text)).toBe(text);
      expect(() => materializeStructuralConventionSchema(text.replaceAll('        {"type"', '          {"type"'))).toThrow(/checked/);
    }
  });
  it("materializes the same three allowed pairs and both template arms from one table", () => {
    for (const schema of schemas) for (const key of ["structuralFeature", "fileTemplateFeature", "squareTemplateFeature"]) {
      for (const branch of schema.$defs[key].oneOf) expect(branch.properties.conventionRef).toEqual(structuralConventionRefSchema(branch.properties.kind.const));
    }
    expect(Object.keys(STRUCTURAL_CONVENTION_REFS).sort()).toEqual(["backward_pawn", "king_opposition", "outpost"]);
  });

  it.each(Object.keys(features) as (keyof typeof features)[])("accepts only the exact %s pair while preserving absent legacy syntax", kind => {
    const base = features[kind], ref = STRUCTURAL_CONVENTION_REFS[kind];
    for (const validate of validators) {
      expect(validate({ kind: "feature", feature: base })).toBe(true);
      expect(validate({ kind: "feature", feature: { ...base, conventionRef: ref } })).toBe(true);
      for (const bad of [null, {}, ref.id, { id: ref.id }, { ...ref, version: 2 }, { ...ref, version: "1" }, { ...ref, extra: true }, { ...ref, id: `${ref.id}@1` }, ...Object.values(STRUCTURAL_CONVENTION_REFS).filter(other => other.id !== ref.id)]) {
        expect(validate({ kind: "feature", feature: { ...base, conventionRef: bad } }), JSON.stringify(bad)).toBe(false);
        expect(() => assertStructuralConventionSelection({ ...base, conventionRef: bad })).toThrow();
      }
    }
    expect(() => assertStructuralConventionSelection(base)).not.toThrow();
    expect(() => assertStructuralConventionSelection({ ...base, conventionRef: ref })).not.toThrow();
    expect(() => assertStructuralConventionSelection({ ...base, conventionRef: undefined })).toThrow();
  });

  it("rejects a ref on every other feature/template kind instead of treating it as legacy", () => {
    const ref = STRUCTURAL_CONVENTION_REFS.outpost;
    for (const validate of validators) for (const feature of [
      { kind: "open_file", file: "a" }, { kind: "isolated_pawn", color: "white", file: "a" },
      { kind: "piece_count", color: "white", role: "knight", basis: "count", comparison: "equal", count: 1 },
      { kind: "pawn_safe_square", color: "white", square: "e5" },
    ]) expect(validate({ kind: "feature", feature: { ...feature, conventionRef: ref } })).toBe(false);
    for (const kind of ["open_file", "isolated_pawn", "piece_count", "pawn_safe_square", "unknown", "__proto__"]) expect(() => assertStructuralConventionSelection({ kind, conventionRef: ref })).toThrow();
  });

  it("retains explicit refs through nested quantified/mirror syntax and validates unvisited branches", () => {
    const file = { kind: "quantified", quantifier: "some", over: { files: { from: "a", to: "h" } }, feature: { kind: "backward_pawn", color: "white", conventionRef: STRUCTURAL_CONVENTION_REFS.backward_pawn } };
    const square = { kind: "quantified", quantifier: "every", over: { squares: { files: { from: "c", to: "f" }, ranks: { from: 4, to: 6 } } }, feature: { kind: "outpost", color: "black", conventionRef: STRUCTURAL_CONVENTION_REFS.outpost } };
    for (const validate of validators) {
      expect(validate({ kind: "mirrored", axis: "both", of: { kind: "all", of: [file, square] } })).toBe(true);
      const invalid = structuredClone(square); invalid.feature.conventionRef = STRUCTURAL_CONVENTION_REFS.backward_pawn as never;
      expect(validate({ kind: "any", of: [{ kind: "pieceOnSquare", square: "a1", piece: null }, invalid] })).toBe(false);
    }
  });
});
