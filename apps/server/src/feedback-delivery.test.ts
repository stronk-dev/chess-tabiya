import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { admittedFeedbackClaimIds } from "./authored-feedback.js";
import { evidenceCensus } from "./expression-census.js";
import { PackRegistry } from "./pack-registry.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { ShapeRegistry } from "./shape-registry.js";
import { MACHINE_LABEL_EVIDENCE_KINDS, validateClaimBindings } from "./sourcing/claim-binding.js";
import { validateLedger } from "./sourcing/ledger-validation.js";
import type { EvidenceLedger, SourcingIssue } from "./sourcing/types.js";

const DRAFTS = resolve("content/drafts");
function corpusDocuments(): ReadonlyMap<string, DrillPackDefinition> {
  const rows = readdirSync(DRAFTS, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !entry.name.endsWith(".browser.json") && !/\.(?:evidence|job|sources)\.json$/u.test(entry.name))
    .map((entry) => {
      const file = resolve(DRAFTS, entry.name);
      return [file, JSON.parse(readFileSync(file, "utf8")) as DrillPackDefinition] as const;
    });
  return new Map(rows);
}
function ledgerFor(file: string): EvidenceLedger | undefined {
  try { return JSON.parse(readFileSync(file.replace(/\.json$/u, ".evidence.json"), "utf8")) as EvidenceLedger; }
  catch { return undefined; }
}
function assertionKind(assertion: string): "tablebase_result" | "engine_eval" | "explorer_position_census" {
  return assertion.startsWith("tablebase.") ? "tablebase_result" : assertion.startsWith("engine.") ? "engine_eval" : "explorer_position_census";
}

describe("feedback delivery corpus", () => {
  it("derives the stage-1 admission split with the shipped predicate", async () => {
    const shapes = await ShapeRegistry.loadDefault();
    const principles = await PrincipleRegistry.loadDefault();
    const registry = await PackRegistry.loadDefault({ development: true, shapes, principles });
    const records = registry.list().map((summary) => registry.required(summary.id));
    let total = 0;
    let admitted = 0;
    let totalCharacters = 0;
    let admittedCharacters = 0;
    for (const record of records) {
      const admittedIds = admittedFeedbackClaimIds(record);
      for (const claim of record.document.feedbackClaims ?? []) {
        total += 1;
        totalCharacters += claim.text.length;
        if (!admittedIds.has(claim.id)) continue;
        admitted += 1;
        admittedCharacters += claim.text.length;
      }
    }

    expect(total).toBeGreaterThan(0);
    expect(admitted).toBeGreaterThan(0);
    expect(admitted).toBeLessThan(total);
    expect(admittedCharacters).toBeGreaterThan(0);
    expect(admittedCharacters).toBeLessThan(totalCharacters);
  });

  it("joins the validating claim set to the expression census and names every lax-census refusal", async () => {
    const documents = corpusDocuments();
    const census = evidenceCensus(documents);
    const principles = await PrincipleRegistry.loadDefault();
    const registry = await PackRegistry.loadDefault({ development: true, principles });
    const implementation = new Set<string>();
    for (const summary of registry.list()) {
      const record = registry.required(summary.id);
      for (const claimId of admittedFeedbackClaimIds(record)) {
        const backing = record.claimBackings.get(claimId);
        if (backing !== undefined && backing.binding !== "self_declared") implementation.add(`${record.document.id}/${claimId}`);
      }
    }

    const censusIds = new Set<string>();
    const refusalCodes = new Map<string, Set<string>>();
    const multiLabel: string[] = [];
    for (const [file, document] of documents) {
      const ledger = ledgerFor(file);
      if (ledger === undefined) continue;
      const issues: SourcingIssue[] = [];
      const validated = validateLedger(ledger, issues);
      if (validated !== undefined) validateClaimBindings(document, validated, issues);
      for (const [index, claim] of (document.feedbackClaims ?? []).entries()) {
        const machineLabels = claim.evidenceTypes.filter((label) => MACHINE_LABEL_EVIDENCE_KINDS[label] !== undefined);
        if (machineLabels.length > 1) multiLabel.push(`${document.id}/${claim.id}`);
        for (const [bindingIndex, binding] of (ledger.claimBindings ?? []).entries()) {
          if (binding.pointer !== `/feedbackClaims/${index}/text`) continue;
          const counted = machineLabels.some((label) => binding.spans.some((span) =>
            "assertion" in span && MACHINE_LABEL_EVIDENCE_KINDS[label]!.includes(assertionKind(span.assertion.kind)),
          ));
          if (!counted) continue;
          const id = `${document.id}/${claim.id}`;
          censusIds.add(id);
          const codes = issues.filter((issue) => issue.path.startsWith(`/claimBindings/${bindingIndex}`) || issue.path.startsWith(`/feedbackClaims/${index}`)).map((issue) => issue.code);
          refusalCodes.set(id, new Set([...(refusalCodes.get(id) ?? []), ...codes]));
        }
      }
    }

    expect([...implementation].filter((id) => !censusIds.has(id))).toEqual([]);
    const censusOnly = [...censusIds].filter((id) => !implementation.has(id));
    for (const id of censusOnly) expect([...refusalCodes.get(id) ?? []], id).not.toEqual([]);
    expect(census.totals.backedClaims).toBeGreaterThanOrEqual(censusIds.size);
    expect(multiLabel.length).toBeGreaterThan(0);
    // Stage 1 is intentionally vacuous: both independently derived sets contain only Philidor.
    expect([...implementation]).toEqual(["philidor-third-rank-hold/philidor-is-drawn"]);
    expect([...censusIds]).toEqual(["philidor-third-rank-hold/philidor-is-drawn"]);
  });
});
