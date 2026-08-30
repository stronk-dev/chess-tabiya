// DISPOSABLE positive author contract — D2120-D2126. Not production code.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { AUTHOR_MODULE_ACCEPTS } from "./module-plan-fixture.js";

const rfc = readFileSync("rfc/module-registration.md", "utf8");
const execution = JSON.parse(readFileSync("rfc/contracts/module-execution-plan-v1.json", "utf8"));
const bindings = JSON.parse(readFileSync("rfc/contracts/module-binding-plan-v1.json", "utf8"));
const canonical = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const digest = (value: unknown) => `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`;
const key = (value: {id:string;version:number}) => `${value.id}@${value.version}`;

describe("module-registration returned-boundary author contract", () => {
  it("D2120 publishes an exact 117-row execution population with runtime-resolvable callables", async () => {
    const { digest: sealed, ...body } = execution;
    expect(sealed).toBe(digest(body));
    expect(execution.population).toBe(117);
    expect(execution.rows).toHaveLength(117);
    expect(new Set(execution.rows.map((row:any) => key(row.projection))).size).toBe(117);
    expect(execution.awaiting).toEqual(["derived.explorer.population_summary", "pack.authored.classifier"]);
    const manifestIds = new Set(PRIMARY_EVIDENCE_MANIFEST.projections.map((row) => key(row)));
    for (const row of execution.rows) {
      expect(manifestIds.has(key(row.projection))).toBe(true);
      expect(typeof row.operation.source).toBe("string");
      expect(typeof row.operation.symbol).toBe("string");
      const source = readFileSync(row.operation.source, "utf8");
      if (row.operation.symbol.includes(".prototype.")) {
        const [owner,, method] = row.operation.symbol.split(".");
        expect(source).toMatch(new RegExp(`export class ${owner}\\b`, "u"));
        expect(source).toMatch(new RegExp(`\\b${method}\\(`, "u"));
      } else expect(source).toMatch(new RegExp(`export function ${row.operation.symbol}\\b`, "u"));
      const loaded = await import(/* @vite-ignore */ `../../${row.operation.source}`);
      const callable = row.operation.symbol.includes(".prototype.")
        ? loaded[row.operation.symbol.split(".prototype.")[0]]?.prototype?.[row.operation.symbol.split(".prototype.")[1]]
        : loaded[row.operation.symbol];
      expect(typeof callable, `${row.projection.id} -> ${row.operation.symbol}`).toBe("function");
    }
  });

  it("D2121 seals every mandatory F1 binding field over all 205 compiled pairs", () => {
    const { digest: sealed, ...body } = bindings;
    expect(sealed).toBe(digest(body));
    expect(bindings.population).toBe(205);
    expect(bindings.rows).toHaveLength(205);
    const planned = new Set(bindings.rows.map((row:any) => `${row.consumer.id.slice(7)}\0${row.projection.id}`));
    const expected = new Set(Object.entries(AUTHOR_MODULE_ACCEPTS).flatMap(([module, ids]) =>
      ids.filter((id) => !execution.awaiting.includes(id)).map((id) => `${module}\0${id}`)));
    expect(planned).toEqual(expected);
    for (const row of bindings.rows) {
      for (const field of ["producer","projection","consumer","adapter","timing","roles","sessions","forms","answerContent","latency","budget"]) expect(row).toHaveProperty(field);
      for (const field of ["timing","roles","sessions","forms","answerContent"]) expect(row[field].length).toBeGreaterThan(0);
      expect(row.budget.maxForms).toBe(row.forms.length);
    }
  });

  it("D2122 defines an atomic post-adapter fit for facts, words, marks and arrows", () => {
    expect(rfc).toMatch(/`fitModulePresentation` performs a second deterministic pass/u);
    expect(rfc).toMatch(/keeps or drops the whole bundle/u);
    expect(rfc).toMatch(/`words`: matches of/u);
    expect(rfc).toMatch(/Every relation endpoint also counts as a\s+mark/u);
    expect(rfc).toMatch(/ModuleBudgetReceipt/u);
  });

  it("D2123 fixes Review to a paged immutable prefix and one final reduction", () => {
    expect(rfc).toMatch(/readonly prefixDigest\?: string/u);
    expect(rfc).toMatch(/`limit` is an integer `1\.\.32`/u);
    expect(rfc).toMatch(/5,000-ms total collection budget, 500-ms per optional source/u);
    expect(rfc).toMatch(/top-eight once/u);
    expect(rfc).toMatch(/single frozen prefix in one in-memory pass and must equal the paged final\s+bytes/u);
  });

  it("D2124 publishes one total role projection reused at both checks", () => {
    expect(rfc).toMatch(/case "solo": return "learner"/u);
    expect(rfc).toMatch(/No call site compares the two role vocabularies as raw\s+strings/u);
    expect(rfc).toMatch(/both module and F1 checks consume its output/u);
  });

  it("D2125 makes mixed Inspector family availability representable", () => {
    expect(rfc).toMatch(/kind: "family_partitioned"/u);
    expect(rfc).toMatch(/"available"; readonly factCount/u);
    expect(rfc).toMatch(/"no_witness"/u);
    expect(rfc).toMatch(/"unavailable"/u);
    expect(rfc).toMatch(/"not_requested"/u);
    expect(rfc).toMatch(/"failed"/u);
    expect(rfc).toMatch(/mixed availability cannot collapse/u);
  });

  it("D2126 seals an acyclic same-subject DAG for every derived execution row", () => {
    const rows = new Map(execution.rows.map((row:any) => [key(row.projection), row]));
    const derived = execution.rows.filter((row:any) => row.stage === "derived_after_inputs");
    expect(derived.length).toBeGreaterThan(0);
    for (const row of derived) {
      expect(row.derivation).not.toBeNull();
      expect(row.derivation.sameSubject).toBe(true);
    }
    const visiting = new Set<string>(), visited = new Set<string>();
    const walk = (id:string) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) throw new TypeError(`cycle at ${id}`);
      visiting.add(id);
      const row:any = rows.get(id);
      const inputs = row?.derivation?.kind === "all" ? row.derivation.inputs.flat()
        : row?.derivation?.kind === "any" ? row.derivation.alternatives.flat() : [];
      for (const input of inputs) if (rows.has(key(input))) walk(key(input));
      visiting.delete(id); visited.add(id);
    };
    for (const id of rows.keys()) walk(id);
    expect(rfc).toMatch(/cannot recollect them/u);
  });
});
