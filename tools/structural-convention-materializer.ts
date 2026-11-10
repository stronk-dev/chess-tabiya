import { structuralConventionRefSchema } from "../packages/schema/src/drill-pack/structural-conventions.ts";

/** Preserve unrelated bytes, and refuse formatting we cannot actually check. */
export function materializeStructuralConventionSchema(original: string): string {
  const schema = JSON.parse(original), lines = original.split("\n");
  const definitions = ["structuralFeature", "fileTemplateFeature", "squareTemplateFeature"];
  const expectedCount = definitions.reduce((count, name) => count + schema.$defs[name].oneOf.length, 0);
  let definition: string | undefined, checked = 0;
  for (let index = 0; index < lines.length; index++) {
    const heading = lines[index]!.match(/^    "([a-zA-Z]+)":/u);
    if (heading) definition = heading[1];
    if (!definitions.includes(definition ?? "") || !/^        \{/u.test(lines[index]!)) continue;
    const line = lines[index]!, comma = line.endsWith(",");
    const branch = JSON.parse(line.trim().replace(/,$/u, ""));
    const kind = branch.properties?.kind?.const;
    if (typeof kind !== "string") throw new TypeError("Structural schema branch has no literal kind");
    checked++;
    const expected = structuralConventionRefSchema(kind);
    if (JSON.stringify(branch.properties.conventionRef) === JSON.stringify(expected)) continue;
    if (expected === undefined) delete branch.properties.conventionRef;
    else branch.properties.conventionRef = expected;
    lines[index] = `        ${JSON.stringify(branch)}${comma ? "," : ""}`;
  }
  if (checked !== expectedCount) throw new Error(`Structural schema formatter checked ${checked}/${expectedCount} branches; update its parser before changing schema formatting`);
  return lines.join("\n");
}
