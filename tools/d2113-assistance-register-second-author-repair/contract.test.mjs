// DISPOSABLE author-repair contract for D2113-D2117. Not production code.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/assistance-config-register.md");
const real = Object.freeze({
  assistance: read("packages/runtime/src/assistance.ts"),
  preference: read("apps/web/src/lib/assistance-preference.ts"),
  settings: read("apps/web/src/lib/AssistanceSettings.svelte"),
  drill: read("apps/web/src/lib/DrillScreen.svelte"),
});

const sha = (value) => createHash("sha256").update(value).digest("hex").slice(0, 24);
const canonical = (value) => value
  .replace(/\/\/[^\n]*/gu, "")
  .replace(/\/\*[\s\S]*?\*\//gu, "")
  .replace(/\s+/gu, " ")
  .trim();

function body(source, symbol) {
  const starts = [
    `export function ${symbol}`,
    `function ${symbol}`,
    `export const ${symbol}`,
    `const ${symbol}`,
  ];
  const start = starts.map((token) => source.indexOf(token)).find((at) => at >= 0);
  assert.notEqual(start, undefined, `missing symbol ${symbol}`);
  const nextExport = source.indexOf("\nexport ", start + 1);
  const nextFunction = source.indexOf("\nfunction ", start + 1);
  const candidates = [nextExport, nextFunction].filter((at) => at > start);
  const end = candidates.length === 0 ? source.length : Math.min(...candidates);
  return source.slice(start, end);
}

function node(kind, module, symbol, source) {
  return Object.freeze({ kind, module, symbol, bodyDigest: sha(canonical(source)) });
}

function graph(snapshot) {
  const nodes = [];
  const edges = [];
  const add = (kind, module, symbol, source) => nodes.push(node(kind, module, symbol, source));
  const edge = (from, kind, to) => edges.push(Object.freeze({ from, kind, to }));
  const prefPath = "apps/web/src/lib/assistance-preference.ts";
  const runtimePath = "packages/runtime/src/assistance.ts";
  const settingsPath = "apps/web/src/lib/AssistanceSettings.svelte";
  const drillPath = "apps/web/src/lib/DrillScreen.svelte";

  for (const field of [...snapshot.assistance.matchAll(/readonly\s+([A-Za-z]+):\s*([^;]+);/gu)]) {
    add("shape_field", runtimePath, `AssistanceConfig.${field[1]}`, field[0]);
  }
  add("constructor", runtimePath, "SILENT_ASSISTANCE", body(snapshot.assistance, "SILENT_ASSISTANCE"));
  add("permission_projection", runtimePath, "permittedAssistance", body(snapshot.assistance, "permittedAssistance"));
  add("constructor", prefPath, "PROFILE_DEFAULTS", body(snapshot.preference, "PROFILE_DEFAULTS"));
  add("storage_key", prefPath, "assistanceKey", body(snapshot.preference, "assistanceKey"));
  add("storage_read", prefPath, "loadAssistance", body(snapshot.preference, "loadAssistance"));
  add("storage_write", prefPath, "saveAssistance", body(snapshot.preference, "saveAssistance"));
  add("serializer", prefPath, "JSON.stringify", snapshot.preference.match(/JSON\.stringify\([^)]*\)/u)?.[0] ?? "");

  for (const legacy of ["validV4", "migrate"]) {
    if (new RegExp(`(?:export )?function ${legacy}\\(`, "u").test(snapshot.preference)) {
      add(legacy === "migrate" ? "migration" : "codec", prefPath, legacy, body(snapshot.preference, legacy));
    }
  }
  if (snapshot.codec !== undefined) {
    add("codec", "packages/runtime/src/assistance-codec.ts", "parseAssistanceConfig", body(snapshot.codec, "parseAssistanceConfig"));
  }

  const settingFields = [...snapshot.settings.matchAll(/configs\[kind\]\.([A-Za-z]+)/gu)].map((match) => match[1]);
  for (const field of new Set(settingFields)) {
    add("advanced_projection", settingsPath, `AssistanceSettings.${field}`, field);
  }
  if (/configs\[kind\]\[[^"']/u.test(snapshot.settings)) throw new Error("unresolved dynamic assistance field in Svelte template");
  add("run_projection", drillPath, "DrillScreen.assistance", snapshot.drill.match(/let assistancePermission[\s\S]*?let boardOverlays/u)?.[0] ?? "");

  const key = `${prefPath}#assistanceKey`;
  edge(`${prefPath}#loadAssistance`, "calls", key);
  edge(`${prefPath}#saveAssistance`, "calls", key);
  edge(`${prefPath}#saveAssistance`, "serializes", `${prefPath}#JSON.stringify`);
  if (snapshot.codec === undefined) {
    edge(`${prefPath}#loadAssistance`, "calls", `${prefPath}#migrate`);
    edge(`${prefPath}#migrate`, "calls", `${prefPath}#validV4`);
  } else {
    edge(`${prefPath}#loadAssistance`, "calls", "packages/runtime/src/assistance-codec.ts#parseAssistanceConfig");
    edge(`${prefPath}#saveAssistance`, "calls", "packages/runtime/src/assistance-codec.ts#parseAssistanceConfig");
  }
  edge(`${settingsPath}#AssistanceSettings`, "calls", `${prefPath}#loadAssistance`);
  edge(`${settingsPath}#AssistanceSettings`, "calls", `${prefPath}#saveAssistance`);
  edge(`${drillPath}#DrillScreen.assistance`, "calls", `${runtimePath}#permittedAssistance`);

  const orderedNodes = nodes.sort((a, b) => `${a.module}#${a.symbol}#${a.kind}`.localeCompare(`${b.module}#${b.symbol}#${b.kind}`));
  const orderedEdges = edges.sort((a, b) => `${a.from}#${a.kind}#${a.to}`.localeCompare(`${b.from}#${b.kind}#${b.to}`));
  return Object.freeze({ nodes: orderedNodes, edges: orderedEdges, digest: sha(JSON.stringify([orderedNodes, orderedEdges])) });
}

function changedSymbols(before, after) {
  const index = (candidate) => new Map(candidate.nodes.map((item) => [`${item.module}#${item.symbol}`, item.bodyDigest]));
  const left = index(before);
  const right = index(after);
  const changed = new Set();
  for (const identity of new Set([...left.keys(), ...right.keys()])) {
    if (left.get(identity) !== right.get(identity)) changed.add(identity);
  }
  const edgeKey = (edge) => `${edge.from}|${edge.kind}|${edge.to}`;
  const leftEdges = new Set(before.edges.map(edgeKey));
  const rightEdges = new Set(after.edges.map(edgeKey));
  for (const encoded of new Set([...leftEdges, ...rightEdges])) {
    if (leftEdges.has(encoded) === rightEdges.has(encoded)) continue;
    const [from, , to] = encoded.split("|");
    changed.add(from);
    if (left.has(to) || right.has(to)) changed.add(to);
  }
  return [...changed].sort();
}

function v5Snapshot() {
  const assistance = real.assistance
    .replace("readonly version: 4;", "readonly version: 5;\n  readonly hintDistance: \"off\" | \"pattern\" | \"square\" | \"piece\" | \"distance\" | \"move\";")
    .replace("version: 4, markers:", "version: 5, hintDistance: \"off\", markers:")
    .replace("return Object.freeze({ markers:", "return Object.freeze({ hintDistance: \"free\", markers:");
  const preference = real.preference
    .replace(/function validV4[\s\S]*?(?=export function loadAssistance)/u, "")
    .replace("return migrate(JSON.parse(raw)) ?? fallback", "return parseAssistanceConfig(JSON.parse(raw)) ?? fallback")
    .replace("storage?.setItem(assistanceKey(kind), JSON.stringify(value));", "const parsed = parseAssistanceConfig(value); if (parsed === undefined) throw new TypeError(\"invalid assistance\"); storage?.setItem(assistanceKey(kind), JSON.stringify(parsed));");
  const settings = real.settings.replace("<label>Board lighting", "<label>Hint distance <select value={configs[kind].hintDistance}></select></label>\n        <label>Board lighting");
  const codec = "export function parseAssistanceConfig(value: unknown) { if (value === null) return undefined; return value; }";
  return Object.freeze({ ...real, assistance, preference, settings, codec });
}

test("D2113: bootstrap derives the real v4 authority and does not require a future codec", () => {
  const current = graph(real);
  assert(current.nodes.some((item) => item.symbol === "validV4"));
  assert(current.nodes.some((item) => item.symbol === "migrate"));
  assert(!current.nodes.some((item) => item.module.endsWith("assistance-codec.ts")));
  assert.match(rfc, /Bootstrap v4 admits and seals the current/u);
});

test("D2114: reader, writer, serializer and shared key are all graph authorities", () => {
  const current = graph(real);
  for (const symbol of ["assistanceKey", "loadAssistance", "saveAssistance", "JSON.stringify"]) {
    assert(current.nodes.some((item) => item.symbol === symbol), symbol);
  }
  assert(current.edges.some((item) => item.from.endsWith("#loadAssistance") && item.to.endsWith("#assistanceKey")));
  assert(current.edges.some((item) => item.from.endsWith("#saveAssistance") && item.to.endsWith("#assistanceKey")));
});

test("D2115: fixed-head key, migration and serializer drift move graph identity", () => {
  const current = graph(real);
  assert.notEqual(graph({ ...real, preference: real.preference.replace("tabiya.assistance.v1.", "tabiya.assistance.v2.") }).digest, current.digest);
  assert.notEqual(graph({ ...real, preference: real.preference.replace("boardLighting: \"legal\"", "boardLighting: \"sight\"") }).digest, current.digest);
  assert.notEqual(graph({ ...real, preference: real.preference.replace("JSON.stringify(value)", "JSON.stringify({ ...value })") }).digest, current.digest);
});

test("D2115: formatting and comments do not move canonical graph identity", () => {
  const current = graph(real);
  const formatted = { ...real, assistance: real.assistance.replace("export interface AssistanceConfig {", "// comment\nexport interface AssistanceConfig   {") };
  assert.equal(graph(formatted).digest, current.digest);
});

test("D2116: v5 graph delta contains construction, permission, persistence, codec and Advanced operations", () => {
  const delta = changedSymbols(graph(real), graph(v5Snapshot()));
  for (const suffix of ["#AssistanceSettings.hintDistance", "#loadAssistance", "#migrate", "#saveAssistance", "#validV4", "#parseAssistanceConfig", "#AssistanceConfig.hintDistance", "#AssistanceConfig.version", "#SILENT_ASSISTANCE", "#permittedAssistance"]) {
    assert(delta.some((identity) => identity.endsWith(suffix)), `${suffix} absent from ${delta.join(", ")}`);
  }
});

test("D2117: Svelte projections are discovered and unresolved computed fields fail closed", () => {
  const current = graph(real);
  assert(current.nodes.some((item) => item.kind === "advanced_projection" && item.symbol === "AssistanceSettings.boardLighting"));
  assert.throws(() => graph({ ...real, settings: real.settings.replace("configs[kind].boardLighting", "configs[kind][dynamicField]") }), /unresolved dynamic assistance field/u);
});

test("D2113/D2117: v5 central codec replaces both legacy operations", () => {
  const future = graph(v5Snapshot());
  assert(future.nodes.some((item) => item.symbol === "parseAssistanceConfig"));
  assert(!future.nodes.some((item) => item.symbol === "validV4" || item.symbol === "migrate"));
  assert(future.edges.some((item) => item.from.endsWith("#loadAssistance") && item.to.endsWith("#parseAssistanceConfig")));
  assert(future.edges.some((item) => item.from.endsWith("#saveAssistance") && item.to.endsWith("#parseAssistanceConfig")));
});

test("the RFC binds canonical graph identity, phase rules and all 38 able-to-fail classes", () => {
  assert.match(rfc, /interface AssistanceAuthorityNode/u);
  assert.match(rfc, /type AssistanceAuthorityEdgeKind/u);
  assert.match(rfc, /svelte\/compiler/u);
  assert.match(rfc, /There is no legal fixed-head semantic drift/u);
  assert.match(rfc, /total thirty-eight/u);
});
