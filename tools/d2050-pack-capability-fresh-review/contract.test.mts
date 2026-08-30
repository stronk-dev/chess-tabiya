// DISPOSABLE author-repair harness — D2050-D2055. Not production code.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");
const sha256 = (value: string | Buffer): string => createHash("sha256").update(value).digest("hex");
const rfc = read("rfc/pack-capability-contract.md");
const artifactPath = "rfc/contracts/pack-capability-applicability-v1.json";
const artifactBytes = read(artifactPath);
const artifact = JSON.parse(artifactBytes) as {
  schema: { path: string; sha256: string };
  closedVocabulary: Record<string, string | number>;
  always: readonly unknown[];
  resolvedReferences: readonly unknown[];
  expandedAuthoritySha256: string;
};

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonical(object[key])}`).join(",")}}`;
}

interface SourceIdentity { readonly schemaPointer: string; readonly member: unknown }

function closedVocabulary(schema: unknown): {
  readonly rows: readonly SourceIdentity[];
  readonly enumNodes: number;
  readonly enumMembers: number;
  readonly unionNodes: number;
  readonly unionMembers: number;
} {
  const rows: SourceIdentity[] = [];
  let enumNodes = 0;
  let enumMembers = 0;
  let unionNodes = 0;
  let unionMembers = 0;
  const escape = (token: string): string => token.replaceAll("~", "~0").replaceAll("/", "~1");
  const walk = (value: unknown, pointer = ""): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${pointer}/${index}`));
      return;
    }
    if (value === null || typeof value !== "object") return;
    const object = value as Record<string, unknown>;
    if (Array.isArray(object.enum)) {
      enumNodes += 1;
      enumMembers += object.enum.length;
      for (const member of object.enum) rows.push({ schemaPointer: pointer, member });
    }
    if (Array.isArray(object.oneOf)) {
      const branches = object.oneOf.map((branch) => {
        if (branch === null || typeof branch !== "object" || Array.isArray(branch)) return [];
        const properties = (branch as Record<string, unknown>).properties;
        if (properties === null || typeof properties !== "object" || Array.isArray(properties)) return [];
        return Object.entries(properties as Record<string, unknown>).flatMap(([name, memberSchema]) =>
          memberSchema !== null && typeof memberSchema === "object" && !Array.isArray(memberSchema)
            && Object.hasOwn(memberSchema, "const")
            ? [[name, (memberSchema as Record<string, unknown>).const] as const]
            : []);
      });
      const discriminated = branches.length > 0
        && branches.every((branch) => branch.length === 1)
        && new Set(branches.map((branch) => branch[0]![0])).size === 1;
      if (discriminated) {
        unionNodes += 1;
        unionMembers += branches.length;
        for (const branch of branches) rows.push({ schemaPointer: pointer, member: branch[0]![1] });
      }
    }
    for (const [key, child] of Object.entries(object)) walk(child, `${pointer}/${escape(key)}`);
  };
  walk(schema);
  rows.sort((left, right) => canonical(left).localeCompare(canonical(right)));
  return { rows, enumNodes, enumMembers, unionNodes, unionMembers };
}

function encodeToken(value: unknown): string {
  const text = String(value);
  return /^[A-Za-z0-9_-]+$/u.test(text) ? text : `x${Buffer.from(text).toString("hex")}`;
}

function valueAt(root: unknown, tokens: readonly string[]): any {
  return tokens.reduce((value: any, token) => value?.[token], root as any);
}

function publicId(source: SourceIdentity, schema: any): string {
  const raw = source.schemaPointer.split("/").filter(Boolean)
    .map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"));
  const ownerAt = raw[0] === "$defs" || raw[0] === "properties" ? 1 : 0;
  const tokens: string[] = [encodeToken(raw[ownerAt] ?? "root")];
  for (let index = ownerAt + 1; index < raw.length; index += 1) {
    const token = raw[index]!;
    if (["$defs", "properties", "items"].includes(token)) continue;
    if (token === "oneOf" && /^\d+$/u.test(raw[index + 1] ?? "")) {
      const branchIndex = Number(raw[index + 1]);
      const parent = valueAt(schema, raw.slice(0, index));
      const branch = parent.oneOf[branchIndex];
      const constants = Object.entries(branch?.properties ?? {}).flatMap(([name, value]: [string, any]) =>
        value !== null && typeof value === "object" && Object.hasOwn(value, "const")
          ? [[name, value.const] as const]
          : []);
      let identity = constants.length === 1
        ? `${encodeToken(constants[0]![0])}-${encodeToken(constants[0]![1])}`
        : `shape-${sha256(canonical(branch)).slice(0, 12)}`;
      if (constants.length === 1 && parent.oneOf.filter((candidate: any) =>
        candidate?.properties?.[constants[0]![0]]?.const === constants[0]![1]).length > 1) {
        const over = Array.isArray(branch?.properties?.over?.required)
          ? branch.properties.over.required.join("-")
          : sha256(canonical(branch)).slice(0, 12);
        identity += `.over-${encodeToken(over)}`;
      }
      tokens.push(identity);
      index += 1;
      continue;
    }
    if (!/^\d+$/u.test(token)) tokens.push(encodeToken(token));
  }
  return [...tokens, encodeToken(source.member)].join(".");
}

test("D2050: one public grammar crosses every shipped family with structured legacy results", () => {
  const patternText = rfc.match(/`CAPABILITY_ID_PATTERN` is\s+`([^`]+)`/u)?.[1];
  assert.ok(patternText);
  const pattern = new RegExp(patternText, "u");
  for (const id of ["x", "mate-proof", "pressure-line", "candidate-majority", "tablebase.probe", "assistance:arrows", "error.SIMULATE_BUDGET_EXCEEDED"]) assert.match(id, pattern);
  for (const invalid of ["", "two words", "path/value", ".x", "x.", "x@1"]) assert.doesNotMatch(invalid, pattern);
  assert.match(rfc, /parseLegacyCapability\("x@1"\).*parseLegacyCapability\("x@v1"\).*\{id: "x", version: \{kind: "integer", value: 1\}\}/su);
  assert.doesNotMatch(rfc, /parseCapability\("x@1"\)/u);
});

test("D2051: the author artifact seals the full source inventory and expanded applicability image", () => {
  assert.equal(sha256(read(artifact.schema.path)), artifact.schema.sha256);
  assert.match(rfc, new RegExp(sha256(artifactBytes), "u"));
  const schema = JSON.parse(read(artifact.schema.path)) as unknown;
  const inventory = closedVocabulary(schema);
  assert.deepEqual([inventory.enumNodes, inventory.enumMembers, inventory.unionNodes, inventory.unionMembers], [103, 300, 15, 73]);
  assert.equal(inventory.rows.length, 373);
  assert.equal(sha256(canonical(inventory.rows)), artifact.closedVocabulary.inventorySha256);

  const ids = inventory.rows.map((source) => publicId(source, schema));
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes("structuralFeature.outpost"));
  const mappings = inventory.rows.map((sourceIdentity) => ({
    sourceIdentity,
    capability: { id: publicId(sourceIdentity, schema), version: { kind: "integer", value: 1 } },
  }));
  assert.equal(sha256(canonical(mappings)), artifact.closedVocabulary.expandedMappingSha256);
  const closedRows = mappings.map(({ sourceIdentity, capability }) => ({
    selector: { kind: "schema_member", sourceIdentity }, capability,
  }));
  assert.equal(sha256(canonical({ closedVocabulary: closedRows, always: artifact.always, resolvedReferences: artifact.resolvedReferences })), artifact.expandedAuthoritySha256);
  assert.equal(artifact.always.length, 14);
  assert.equal(artifact.resolvedReferences.length, 5);
});

test("D2052: the independent sidecar grammar is total and keeps schema validation strict", () => {
  assert.equal((artifact as any).closedVocabulary.mappedMembers, 373);
  assert.deepEqual((artifact as any).metadataExclusions, [
    "/properties/requires", "/$defs/capabilityRequirement", "/$defs/capabilityVersion",
  ]);
  for (const failure of ["missing member", "duplicate", "wrong identity", "non-member scalar", "unknown artifact field"]) assert.ok(rfc.includes(failure));
  assert.match(rfc, /F3 registers no custom schema keywords/u);
});

test("D2053: every formerly prose evaluator constituent is an exact live symbol", () => {
  assert.match(rfc, /`objective\.transition_legality` \| `assertObjectiveTransition`, `OBJECTIVE_TRANSITION_TABLE`/u);
  assert.match(rfc, /`opponent\.selection` \| `OpponentSelector`, `neutralTiebreakKey`/u);
  assert.match(rfc, /Each of the four symbols\s+must have exactly one declaration and a production reader/u);
});

test("D2054: weakened Stockfish refusal resolves through protected design", () => {
  assert.match(rfc, /protected intent `design\/06-campaign\.md` §2b/u);
  assert.doesNotMatch(rfc, /protected intent `AGENTS\.md`/u);
  assert.match(read("design/06-campaign.md"), /weakened Stockfish is rejected doctrine/u);
});

test("D2055: schema-member selection covers recursive and reused vocabularies", () => {
  assert.match(rfc, /kind: "schema_member"; readonly sourceIdentity: SchemaMemberIdentity/u);
  assert.match(rfc, /recursive `structuralExpression` \/ `transitionExpression`\s+values match at any authored depth/u);
  assert.match(rfc, /tracks the\s+finite \*\*instance path\*\*, not visited schema identities/u);
  assert.match(rfc, /three-level nested structural expression/u);
  assert.match(rfc, /equal scalar attached to a\s+different schema identity does not/u);
});
