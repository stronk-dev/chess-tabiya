// DISPOSABLE author contract — D2164-D2170 repair. Not production code.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { WORKFLOW_CONTEXT_POLICIES } from "../../packages/runtime/src/presets.js";
import { AUTHOR_MODULE_ACCEPTS, AUTHOR_MODULE_POLICIES } from "./module-plan-fixture.js";

const rfc = readFileSync("rfc/module-registration.md", "utf8");
const execution = JSON.parse(readFileSync("rfc/contracts/module-execution-plan-v1.json", "utf8"));
const bindings = JSON.parse(readFileSync("rfc/contracts/module-binding-plan-v1.json", "utf8"));
const canonical = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const digest = (value: unknown) => `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`;
const key = (value: {id:string;version:number}) => `${value.id}@${value.version}`;

const cleanCell = (value: string) => value
  .replaceAll("**", "")
  .replaceAll("`", "")
  .trim();

const markdownTable = (heading: string) => {
  const start = rfc.indexOf(heading);
  expect(start).toBeGreaterThanOrEqual(0);
  const tail = rfc.slice(start);
  const tableStart = tail.indexOf("| module |");
  expect(tableStart).toBeGreaterThanOrEqual(0);
  const lines = tail.slice(tableStart).split("\n");
  const tableEnd = lines.findIndex((line, index) => index > 1 && line.trim() === "");
  return lines.slice(0, tableEnd).filter((line) => line.startsWith("| `"));
};

describe("module-registration sealed-pool author repair", () => {
  it("D2164 derives policy and sessions from their actual authorities", () => {
    const { digest: sealed, ...body } = bindings;
    expect(sealed).toBe(digest(body));
    expect(bindings.schemaVersion).toBe(2);
    expect(bindings.population).toBe(229);
    for (const row of bindings.rows) {
      const module = row.consumer.id.slice("module.".length);
      const policy = AUTHOR_MODULE_POLICIES[module as keyof typeof AUTHOR_MODULE_POLICIES];
      expect(row.timingRequirement).toMatchObject({
        moduleRequested: policy.timings,
        sourceCeiling: row.occurrenceRequirement.byMoment.map((occurrence:any) => occurrence.timing),
        exactProjectionOperation: null,
        status: "awaiting_upstream_exact_operation",
      });
      expect(row.timingRequirement.resolutionOwner).toMatchObject({
        owner: "module-registration",
        receipt: "ModuleExactOperationResolutionReceipt",
      });
      expect(row.roles).toEqual(policy.roles);
      expect(row.budget.maxFacts).toBe(policy.maxFacts);
      expect(row.sessions).toEqual(WORKFLOW_CONTEXT_POLICIES.filter((context) => context.moduleCeiling.includes(module as never)).map((context) => context.id));
    }
  });

  it("D3066 keeps both implementer-facing capability tables set-equal to the author authority", () => {
    const expected = new Map(Object.entries(AUTHOR_MODULE_POLICIES).map(([module, policy]) => [
      module,
      policy.answerCapabilities.join(", "),
    ]));
    expected.set("rules_floor", "none");
    expect(bindings.moduleAnswerCapabilities).toEqual(Object.fromEntries(
      Object.entries(AUTHOR_MODULE_POLICIES).map(([module, policy]) => [module, policy.answerCapabilities]),
    ));

    const summaryStart = rfc.indexOf("#### 1.1 The summary table");
    const summaryEnd = rfc.indexOf("#### 1.2", summaryStart);
    const summaryRows = rfc.slice(summaryStart, summaryEnd).split("\n").filter((line) => /^\| \d+ \|/u.test(line));
    const summary = new Map(summaryRows.map((line) => {
      const cells = line.split("|").slice(1, -1).map(cleanCell);
      const module = cells[1];
      const capability = module === "guided_hint" ? "guided_hint@1" : cells[4].split(", through")[0];
      return [module, capability];
    }));

    const detail = new Map(markdownTable("The literal population required by [[D1868]] is:").map((line) => {
      const cells = line.split("|").slice(1, -1).map(cleanCell);
      const capability = cells[0] === "guided_hint" ? "guided_hint@1" : cells[1];
      return [cells[0], capability];
    }));

    expect(summary).toEqual(expected);
    expect(detail).toEqual(expected);
  });

  it("D2165 publishes complete typed upstream source contracts and no direct detector operation", () => {
    const required = ["input", "result", "operation", "extract", "assertion", "abstain", "seal", "status"];
    expect(execution.sourceContracts.map((row:any) => row.id)).toEqual([
      "candidate_population@1", "recorded_semantic_path@1", "review_evidence_packet@1",
      "catalogue_evidence_packet@1", "provider_evidence_packet@1",
    ]);
    for (const source of execution.sourceContracts) {
      for (const field of required) expect(source).toHaveProperty(field);
      expect(source.operation.callable).toBeTruthy();
      expect(source.extract).toBeTruthy();
      expect(source.abstain).toBeTruthy();
      expect(source.seal).toBeTruthy();
      expect(source.status).toBeTruthy();
    }
    for (const row of execution.rows) {
      expect(row).not.toHaveProperty("operation");
      expect(row.requiredOutput).toEqual({ kind: "sealed_projection_item", projection: row.projection });
      expect(row.status).toBe("awaiting_upstream_sealed_operation");
    }
  });

  it("D2166 gives derived requirements explicit position, edge, branch-pair or run-prefix joins", () => {
    const derived = execution.rows.filter((row:any) => row.derivation !== null);
    expect(new Set(derived.map((row:any) => row.subjectKind))).toEqual(new Set(["position", "edge", "branch_pair", "run_prefix"]));
    expect(derived.find((row:any) => row.projection.id === "derived.material.reading.role_signature").subjectKind).toBe("position");
    expect(derived.find((row:any) => row.projection.id === "derived.grade.move_quality").subjectKind).toBe("edge");
    expect(derived.find((row:any) => row.projection.id === "derived.story.rank").subjectKind).toBe("run_prefix");
    expect(derived.find((row:any) => row.projection.id === "derived.compare.eval_delta").subjectKind).toBe("edge");
    for (const row of derived) {
      expect(row.derivation).not.toHaveProperty("sameSubject");
      expect(row.derivation.join.subjectKind).toBe(row.subjectKind);
      expect(["same_position", "same_edge_context", "declared_branch_pair", "same_frozen_prefix"]).toContain(row.derivation.join.rule);
    }
  });

  it("D2167 declares every external DAG input at each required subject grain", () => {
    expect(execution.sourceInputs.map((row:any) => `${key(row.projection)}:${row.subjectKind}`).sort()).toEqual([
      "derived.story.eval_shift@1:run_prefix", "derived.story.last_level@1:run_prefix",
      "rules.exchange.predicate.legal_exchange@1:edge", "rules.square.event.control@1:edge",
      "rules.structural.predicate.direct_attack_count@1:edge",
      "rules.structural.predicate.line_blockers@1:edge", "rules.structural.predicate.passed_pawn@1:edge",
      "rules.tactic.reading.defender_duty_set@1:position", "run.record.move@1:edge",
      "run.record.position@1:position",
    ]);
    const rows = new Map(execution.rows.map((row:any) => [key(row.projection), row]));
    for (const row of execution.rows) {
      const rawInputs = row.derivation?.inputs
        ?? row.derivation?.alternatives?.flatMap?.((alternative:any) => alternative.inputs ?? alternative)
        ?? [];
      const inputs = row.derivation?.kind === "alternatives"
        ? [...new Map(rawInputs.map((input:any) => [key(input), input])).values()]
        : rawInputs;
      const bindings = row.derivation?.inputBindings ?? [];
      expect(bindings.map((binding:any) => key(binding.projection))).toEqual(inputs.map(key));
      for (const binding of bindings) {
        const planned = rows.get(key(binding.projection)) as any;
        const external = execution.sourceInputs.find((source:any) => key(source.projection) === key(binding.projection));
        expect(binding.sourceSubjectKind).toBe(planned?.subjectKind ?? external?.subjectKind);
        expect(binding.relation).toMatch(/^(same_|edge_position_endpoints|branch_pair_|prefix_|ordered_window_operand)/u);
      }
    }
  });

  it("D2168 records Guided Hint as an explicit non-vacuous owner blocker", () => {
    expect(Object.prototype.hasOwnProperty.call(AUTHOR_MODULE_ACCEPTS, "guided_hint")).toBe(true);
    expect(AUTHOR_MODULE_ACCEPTS.guided_hint).toEqual([]);
    expect(execution.guidedHint).toEqual(bindings.guidedHint);
    expect(execution.guidedHint).toMatchObject({ status: "owner_blocked", blocker: "D1639", requires: { minFamilies: 1, minRungs: 1, cartesianSetEquality: true } });
  });

  it("D2169 requires an exact module-pair adapter and never fabricates one", () => {
    for (const row of bindings.rows) {
      expect(row).not.toHaveProperty("adapter");
      expect(row.presentationRequirement.status).toBe("awaiting_exact_module_pair_adapter");
      expect(row.presentationRequirement.requiredPair).toBe(`${row.consumer.id}@${row.consumer.version}\u0000${key(row.projection)}`);
      expect(row.status).toBe("blocked_dependencies");
    }
  });

  it("D2170 refuses to claim any of the 132 outputs executable before source operations land", () => {
    const { digest: sealed, ...body } = execution;
    expect(sealed).toBe(digest(body));
    expect(execution.population).toBe(132);
    expect(execution.rows).toHaveLength(132);
    expect(new Set(execution.rows.map((row:any) => key(row.projection))).size).toBe(132);
    expect(execution.completionClaim).toBe("requirements_only");
    expect(bindings.completionClaim).toBe("requirements_only");
    const manifestIds = new Set(PRIMARY_EVIDENCE_MANIFEST.projections.map((row) => key(row)));
    expect(execution.rows.every((row:any) => manifestIds.has(key(row.projection)))).toBe(true);
  });

  it("keeps the accepted non-hint module/projection image set-equal", () => {
    const planned = new Set(bindings.rows.map((row:any) => `${row.consumer.id.slice(7)}\0${row.projection.id}`));
    const expected = new Set(Object.entries(AUTHOR_MODULE_ACCEPTS).flatMap(([module, ids]) => ids
      .filter((id) => !execution.awaiting.includes(id)).map((id) => `${module}\0${id}`)));
    expect(planned).toEqual(expected);
  });

  it("retains atomic-fit, paging, role and inspector requirements", () => {
    expect(rfc).toMatch(/`fitModulePresentation` performs a second deterministic pass/u);
    expect(rfc).toMatch(/keeps or drops the whole bundle/u);
    expect(rfc).toMatch(/readonly prefixDigest\?: string/u);
    expect(rfc).toMatch(/kind: "family_partitioned"/u);
    expect(rfc).toMatch(/both module and F1 checks consume its output/u);
  });
});
