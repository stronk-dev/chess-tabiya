// The shipped drill-run schema is the event-image authority too. Do not maintain a second
// hand-written event union for digests, imports or availability requests.
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "../../../schemas/drill_run.schema.json";

const ajv = new Ajv2020({ strict: true, allErrors: false });
addFormats(ajv);
ajv.addSchema(schema);
const validateEvent = ajv.getSchema(`${schema.$id}#/$defs/event`);
if (validateEvent === undefined) throw new TypeError("The canonical run schema has no event definition");

/** Non-mutating: no defaults, coercion, property removal or JSON round-trip repair. */
export function assertRunEventImage(value: unknown): void {
  if (!validateEvent!(value)) throw new TypeError(`Invalid run event image: ${ajv.errorsText(validateEvent!.errors)}`);
}
