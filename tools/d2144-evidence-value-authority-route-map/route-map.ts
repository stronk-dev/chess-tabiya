// DISPOSABLE author instrument for D2146. Until rfc/evidence-value-authority.md was implemented this
// re-derived the literal migration receipt from packages/runtime/src/evidence-source-adapters.ts.
// That module is deleted by the implementation (2026-09-24), so the receipt is now a FROZEN migration
// baseline: this instrument verifies its seal and that every target profile it names resolved to the
// registered factory with the same symbol and shape. The permanent gate is
// packages/runtime/src/evidence-value-authority.test.ts; this is not production code.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { PRIMARY_EVIDENCE_MANIFEST } from "@chess-tabiya/runtime";
import { evidenceValueRouteRegistry } from "../../packages/runtime/src/internal/evidence-value-routes.js";

const ROOT = resolve(process.cwd());
const RECEIPT = "planning/evidence-foundation-ux/evidence-value-authority-route-map.json";

interface TargetProfile {
  readonly projection: string;
  readonly factoryShape: string;
  readonly factorySymbol: string;
  readonly authorityInputs: readonly string[];
  readonly dependency: string;
}

interface Route {
  readonly oldOperation: string;
  readonly currentProjection: string;
  readonly targetProfiles: readonly TargetProfile[];
}

interface Receipt {
  readonly schemaVersion: number;
  readonly authority: string;
  readonly routes: readonly Route[];
  readonly noRoute: readonly { readonly projection: string }[];
  readonly summary: { readonly routeCount: number; readonly distinctCurrentProjections: number; readonly noRouteCount: number; readonly receiptDigest: string };
}

function fail(message: string): never {
  throw new TypeError(`evidence-value-authority-route-map: ${message}`);
}

if (process.argv.includes("--write")) {
  fail("the migration receipt is frozen: the adapter module it was derived from was deleted by the implementation");
}

const path = join(ROOT, RECEIPT);
if (!existsSync(path)) fail(`missing ${RECEIPT}`);
const receipt = JSON.parse(readFileSync(path, "utf8")) as Receipt;
const body = { schemaVersion: receipt.schemaVersion, authority: receipt.authority, routes: receipt.routes, noRoute: receipt.noRoute };
const digest = `sha256:${createHash("sha256").update(JSON.stringify(body)).digest("hex")}`;
if (digest !== receipt.summary.receiptDigest) fail(`frozen receipt body does not match its seal (${digest} != ${receipt.summary.receiptDigest})`);
if (receipt.routes.length !== 204 || new Set(receipt.routes.map((route) => route.currentProjection)).size !== 200 || receipt.noRoute.length !== 6) {
  fail(`frozen receipt population drifted: ${JSON.stringify(receipt.summary)}`);
}

const registry = new Map(evidenceValueRouteRegistry().map((meta) => [meta.route, meta]));
const problems: string[] = [];
const targets = new Set<string>();
for (const route of receipt.routes) for (const target of route.targetProfiles) {
  targets.add(target.projection);
  const meta = registry.get(target.projection);
  if (meta === undefined) { problems.push(`${route.oldOperation} -> ${target.projection}: no registered factory`); continue; }
  if (meta.symbol !== target.factorySymbol) problems.push(`${target.projection}: symbol ${meta.symbol} != ${target.factorySymbol}`);
  if (meta.shape !== target.factoryShape) problems.push(`${target.projection}: shape ${meta.shape} != ${target.factoryShape}`);
}
const declarations = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [`${projection.id}@${projection.version}`, projection]));
for (const route of registry.keys()) {
  if (targets.has(route)) continue;
  // Registered routes outside the receipt's targets are its no-route declarations plus
  // theory.endgame.method_stage@1, which the receipt left to the recorded-semantic-path successor.
  const noRoute = receipt.noRoute.some((row) => row.projection === route);
  if (!noRoute && route !== "theory.endgame.method_stage@1") problems.push(`${route}: registered but absent from the frozen receipt`);
  if (declarations.get(route) === undefined) problems.push(`${route}: registered but undeclared`);
}
for (const row of receipt.noRoute) {
  const declaration = declarations.get(row.projection);
  const retired = declaration === undefined || declaration.disposition?.kind === "retired";
  if (!retired && !registry.has(row.projection)) problems.push(`${row.projection}: non-retired no-route declaration has no factory`);
}
if (problems.length > 0) fail(`frozen receipt disagrees with the registered factories:\n${problems.join("\n")}`);
console.log(`evidence-value-authority-route-map: frozen ${receipt.routes.length} routes / 200 projections / ${receipt.noRoute.length} no-route declarations resolve to ${registry.size} registered factories (${receipt.summary.receiptDigest})`);
