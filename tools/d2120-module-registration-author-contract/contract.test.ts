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

describe("module-registration sealed-pool author repair", () => {
  it("D2164 derives policy and sessions from their actual authorities", () => {
    const { digest: sealed, ...body } = bindings;
    expect(sealed).toBe(digest(body));
    expect(bindings.schemaVersion).toBe(2);
    expect(bindings.population).toBe(205);
    const requirementById = new Map(execution.rows.map((row:any) => [row.projection.id, row]));
    const sourceById = new Map(execution.sourceContracts.map((row:any) => [row.id, row]));
    for (const row of bindings.rows) {
      const module = row.consumer.id.slice("module.".length);
      const policy = AUTHOR_MODULE_POLICIES[module as keyof typeof AUTHOR_MODULE_POLICIES];
      const requirement = requirementById.get(row.projection.id) as any;
      const source = sourceById.get(requirement.acquisition) as any;
      expect(row.timingRequirement).toEqual({
        moduleRequested: policy.timings,
        sourceCeiling: policy.timings.filter((timing) => source.timings.includes(timing)),
        exactProjectionOperation: null,
        status: "awaiting_upstream_exact_operation",
      });
      expect(row.roles).toEqual(policy.roles);
      expect(row.budget.maxFacts).toBe(policy.maxFacts);
      expect(row.sessions).toEqual(WORKFLOW_CONTEXT_POLICIES.filter((context) => context.moduleCeiling.includes(module as never)).map((context) => context.id));
    }
  });

  it("D2165 publishes complete typed upstream source contracts and no direct detector operation", () => {
    const required = ["input", "operation", "extract", "parse", "abstain", "seal", "status"];
    expect(execution.sourceContracts.map((row:any) => row.id)).toEqual([
      "candidate_population@1", "recorded_semantic_path@1", "review_evidence_packet@1",
      "catalogue_evidence_packet@1", "provider_evidence_packet@1",
    ]);
    for (const source of execution.sourceContracts) for (const field of required) expect(source[field]).toBeTruthy();
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
    expect(derived.find((row:any) => row.projection.id === "derived.compare.eval_delta").subjectKind).toBe("branch_pair");
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
      "rules.tactic.reading.defender_duty_set@1:edge", "run.record.move@1:edge",
    ]);
    const rows = new Map(execution.rows.map((row:any) => [key(row.projection), row]));
    for (const row of execution.rows) {
      const inputs = row.derivation?.inputs ?? row.derivation?.alternatives?.flat?.() ?? [];
      const bindings = row.derivation?.inputBindings ?? [];
      expect(bindings.map((binding:any) => key(binding.projection))).toEqual(inputs.map(key));
      for (const binding of bindings) {
        const planned = rows.get(key(binding.projection)) as any;
        const external = execution.sourceInputs.find((source:any) => key(source.projection) === key(binding.projection));
        expect(binding.sourceSubjectKind).toBe(planned?.subjectKind ?? external?.subjectKind);
        expect(binding.relation).toMatch(/^(same_|edge_position_endpoints|branch_pair_|prefix_|operation_owned_occurrences)/u);
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

  it("D2170 refuses to claim any of the 117 outputs executable before source operations land", () => {
    const { digest: sealed, ...body } = execution;
    expect(sealed).toBe(digest(body));
    expect(execution.population).toBe(117);
    expect(execution.rows).toHaveLength(117);
    expect(new Set(execution.rows.map((row:any) => key(row.projection))).size).toBe(117);
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
