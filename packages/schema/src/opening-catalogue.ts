import Ajv2020 from "ajv/dist/2020.js";
import schema from "../../../schemas/opening_catalogue.schema.json";

const ajv = new Ajv2020({ strict: true, allErrors: false });
const validate = ajv.compile(schema);

/** No defaults, coercion, property removal or caller-supplied schema. */
export function assertOpeningCatalogueDocument(value: unknown): void {
  if (!validate(value)) throw new TypeError(`Opening catalogue artifact shape is invalid: ${ajv.errorsText(validate.errors)}`);
}
