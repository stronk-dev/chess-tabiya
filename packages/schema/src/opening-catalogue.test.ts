import { describe, expect, it } from "vitest";
import schema from "../../../schemas/opening_catalogue.schema.json";
import { OPENING_CATALOGUE_SCHEMA_VERSION } from "./index.js";
import { assertOpeningCatalogueDocument } from "./opening-catalogue.js";

describe("the registered existing opening document grammar", () => {
  it("binds the one version export to the actual schema id without adding an artifact version field", () => {
    expect(schema.$id).toBe(`urn:chess-tabiya:schema:opening-catalogue:${OPENING_CATALOGUE_SCHEMA_VERSION}`);
    expect(schema.required).toEqual(["source", "namedEndpoints", "pathMembership", "digest"]);
    expect(schema.additionalProperties).toBe(false);
    expect(() => assertOpeningCatalogueDocument({})).toThrow(/artifact shape is invalid/u);
  });
});
