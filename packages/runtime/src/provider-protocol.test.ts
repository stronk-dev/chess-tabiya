import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import "./index.js"; // load the package in its public order (the catalogue/factory cycle resolves from the barrel)
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceFactorySymbol } from "./evidence-factories.js";
import { evidenceValueRouteRegistry } from "./internal/evidence-value-routes.js";
import { PROVIDER_DIGEST_DOMAINS } from "./provider-digest.js";
import { PROVIDER_RESPONSE_PARSERS } from "./provider-parsers.js";
import { PROVIDER_OPERATION_IDS, PROVIDER_PROTOCOL_MEMBERS, PROVIDER_PROTOCOL_RESOURCE, providerProtocolMember } from "./provider-protocol.js";
import { PROVIDER_REQUEST_NORMALIZERS } from "./provider-requests.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../..");
const read = (path: string): string => readFileSync(join(REPO, path), "utf8");

type Resource = typeof PROVIDER_PROTOCOL_RESOURCE;

/** One derived-set validator; the real resource passes and every swapped/copied variant fails. */
function validateProtocol(resource: Resource, members: readonly string[]): readonly string[] {
  const errors: string[] = [];
  const rows = resource.payload.operations;
  const operations = rows.map((row) => row.operation);
  const sorted = (values: readonly string[]) => [...values].sort();
  if (JSON.stringify(sorted(rows.map((row) => row.member))) !== JSON.stringify(sorted(members))) errors.push("tuple members differ from resource rows");
  for (const row of rows) {
    if (row.member !== providerProtocolMember(row.operation)) errors.push(`${row.operation}: member ${row.member} is not derived`);
    const parser = (PROVIDER_RESPONSE_PARSERS as Readonly<Record<string, { readonly id: string; readonly operation: string }>>)[row.operation];
    if (parser === undefined || parser.id !== row.parserId || parser.operation !== row.operation) errors.push(`${row.operation}: parser ${row.parserId} is not the registered parser`);
    const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find((candidate) => `${candidate.id}@${candidate.version}` === row.sourceProjection);
    if (projection === undefined) errors.push(`${row.operation}: projection ${row.sourceProjection} is not declared`);
    else if (!projection.payloadType.includes(`"${row.operation}"`)) errors.push(`${row.operation}: ${row.sourceProjection} payload is not its ProviderEvidenceDelivery`);
    const route = evidenceValueRouteRegistry().find((meta) => meta.route === row.sourceProjection);
    if (route === undefined || route.symbol !== row.sourceFactoryId || evidenceFactorySymbol(row.sourceProjection) !== row.sourceFactoryId) errors.push(`${row.operation}: factory ${row.sourceFactoryId} is not the route's sole factory`);
  }
  if (JSON.stringify(sorted(operations)) !== JSON.stringify(sorted(Object.keys(PROVIDER_REQUEST_NORMALIZERS)))) errors.push("normalizers differ from operations");
  if (JSON.stringify(sorted(operations)) !== JSON.stringify(sorted(Object.keys(PROVIDER_RESPONSE_PARSERS)))) errors.push("parsers differ from operations");
  if (new Set(rows.map((row) => row.cliName)).size !== rows.length) errors.push("CLI names are not unique");
  if (JSON.stringify(resource.payload.digestDomains) !== JSON.stringify(PROVIDER_DIGEST_DOMAINS)) errors.push("digest domains differ from the registry");
  return errors;
}

function claimMembers(): readonly string[] {
  const rfc = read("rfc/provider-exchange-and-execution.md");
  const block = /```tabiya-claims\n([\s\S]*?)```/u.exec(rfc)?.[1] ?? "";
  const line = block.split("\n").find((candidate) => candidate.startsWith("provider-protocol |"));
  if (line === undefined) return [];
  return line.split("|")[1]!.trim().replace(/^members /u, "").split(", ");
}

function registerLanded(): readonly string[] {
  const readme = read("rfc/README.md");
  const section = /## Provider-protocol register([\s\S]*?)\n## /u.exec(readme)?.[1] ?? "";
  const landed = /### Landed([\s\S]*?)### Live claims/u.exec(section)?.[1] ?? "";
  return landed.split("\n").filter((line) => /^\| [a-z]/u.test(line) && !line.startsWith("| member")).map((line) => line.split("|")[1]!.trim());
}

describe("provider-protocol resource (criterion 36)", () => {
  it("the tuple, resource rows, type maps, parsers, normalizers, projections, factories and digest domains are one set", () => {
    expect(validateProtocol(PROVIDER_PROTOCOL_RESOURCE, PROVIDER_PROTOCOL_MEMBERS)).toEqual([]);
    expect(PROVIDER_OPERATION_IDS).toHaveLength(5);
    expect(PROVIDER_PROTOCOL_MEMBERS).toEqual([...PROVIDER_PROTOCOL_MEMBERS].sort());
  });

  it("the register's landed rows equal the tree tuple (the RFC's claim closed at landing)", () => {
    expect([...registerLanded()].sort()).toEqual([...PROVIDER_PROTOCOL_MEMBERS]);
    const claimed = claimMembers();
    // Either the claim is still live (then it names exactly these members) or it has landed.
    if (claimed.length > 0) expect([...claimed].sort()).toEqual([...PROVIDER_PROTOCOL_MEMBERS]);
  });

  it("a copied list, a count-preserving parser/factory swap and an absent member all fail", () => {
    const swap = (patch: (rows: Record<string, unknown>[]) => void): Resource => {
      const copy = JSON.parse(JSON.stringify(PROVIDER_PROTOCOL_RESOURCE)) as { payload: { operations: Record<string, unknown>[]; digestDomains: string[] } };
      patch(copy.payload.operations);
      return copy as unknown as Resource;
    };
    expect(validateProtocol(swap((rows) => { [rows[0]!.parserId, rows[1]!.parserId] = [rows[1]!.parserId, rows[0]!.parserId]; }), PROVIDER_PROTOCOL_MEMBERS).join("\n")).toMatch(/not the registered parser/u);
    expect(validateProtocol(swap((rows) => { [rows[2]!.sourceFactoryId, rows[3]!.sourceFactoryId] = [rows[3]!.sourceFactoryId, rows[2]!.sourceFactoryId]; }), PROVIDER_PROTOCOL_MEMBERS).join("\n")).toMatch(/not the route's sole factory/u);
    expect(validateProtocol(swap((rows) => { [rows[0]!.sourceProjection, rows[1]!.sourceProjection] = [rows[1]!.sourceProjection, rows[0]!.sourceProjection]; }), PROVIDER_PROTOCOL_MEMBERS).join("\n")).toMatch(/payload is not its ProviderEvidenceDelivery/u);
    expect(validateProtocol(PROVIDER_PROTOCOL_RESOURCE, PROVIDER_PROTOCOL_MEMBERS.slice(1)).join("\n")).toMatch(/tuple members differ/u);
    const digestSwap = JSON.parse(JSON.stringify(PROVIDER_PROTOCOL_RESOURCE)) as { payload: { digestDomains: string[] } };
    digestSwap.payload.digestDomains.reverse();
    expect(validateProtocol(digestSwap as unknown as Resource, PROVIDER_PROTOCOL_MEMBERS).join("\n")).toMatch(/digest domains differ/u);
  });
});

// ---------------------------------------------------------------------------------------------
// Source censuses (criteria 14, 19, 25, 29)
// ---------------------------------------------------------------------------------------------

function sources(roots: readonly string[]): readonly string[] {
  const out: string[] = [];
  const walk = (directory: string): void => {
    for (const name of readdirSync(directory)) {
      if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
      const path = join(directory, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(?:ts|mts|mjs|svelte)$/u.test(name)) out.push(relative(REPO, path));
    }
  };
  for (const root of roots) walk(join(REPO, root));
  return out.sort();
}

const PRODUCTION = sources(["apps/server/src", "apps/web/src", "packages/runtime/src", "packages/schema/src"]).filter((file) => !/\.test\.ts$|provider-test-fixtures\.ts$/u.test(file));

describe("provider exchange censuses", () => {
  it("only the server scheduler imports the scheduler-only constructor authority", () => {
    const importers = PRODUCTION.filter((file) => /provider-exchange-authority|PROVIDER_EXCHANGE_AUTHORITY/u.test(readFileSync(join(REPO, file), "utf8")));
    expect(importers).toEqual(["apps/server/src/provider-exchange.ts", "packages/runtime/src/provider-exchange-authority.ts", "packages/runtime/src/provider-exchange.ts"]);
    expect(read("packages/runtime/src/index.ts")).not.toMatch(/PROVIDER_EXCHANGE_AUTHORITY|provider-exchange-authority/u);
  });

  it("no provider module hashes, writes a domain tag or reads the wall clock outside its one authority", () => {
    const provider = PRODUCTION.filter((file) => /provider-/u.test(file));
    expect(provider.length).toBeGreaterThanOrEqual(10);
    for (const file of provider) {
      const text = readFileSync(join(REPO, file), "utf8");
      if (file !== "packages/runtime/src/provider-digest.ts") {
        expect(text, file).not.toMatch(/createHash|subtle\.digest|function sha256|"tabiya\/(?:provider|engine)\./u);
      }
    }
    for (const file of ["apps/server/src/provider-exchange.ts", "apps/server/src/provider-operations.ts"]) {
      expect(read(file), file).not.toMatch(/Date\.now\(|new Date\(|performance\.now\(/u);
    }
  });

  it("no provider runtime or server module depends on learner modules, presets or workflow ceilings", () => {
    for (const file of PRODUCTION.filter((candidate) => /provider-/u.test(candidate))) {
      expect(readFileSync(join(REPO, file), "utf8"), file).not.toMatch(/ModuleId|module-registry|module-contract|intent-preset|workflow/u);
    }
  });
});
