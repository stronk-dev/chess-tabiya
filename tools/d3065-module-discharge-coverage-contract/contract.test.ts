import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { AUTHOR_MODULE_ACCEPTS } from "../d2120-module-registration-author-contract/module-plan-fixture.js";

const rfc = readFileSync("rfc/module-registration.md", "utf8");
const tactical = readFileSync("rfc/tactical-collectors.md", "utf8");
const bindings = JSON.parse(readFileSync("rfc/contracts/module-binding-plan-v1.json", "utf8")) as {
  population: number;
  completionClaim: string;
  rows: readonly { consumer: { id: string }; projection: { id: string }; status: string }[];
};
const execution = JSON.parse(readFileSync("rfc/contracts/module-execution-plan-v1.json", "utf8")) as {
  population: number;
  completionClaim: string;
  sourceInputs: readonly { projection: { id: string; version: number }; subjectKind: string }[];
};

const homes = (projection: string): string[] => Object.entries(AUTHOR_MODULE_ACCEPTS)
  .flatMap(([module, projections]) => projections.includes(projection as never) ? [module] : [])
  .sort();

describe("D3065 bounded module discharge coverage repair", () => {
  it("gives exact legal mobility and all three opening facts truthful learner homes", () => {
    expect(homes("rules.mobility.reading.legal_moves")).toEqual(["full_inspector", "sight_on_request"]);
    expect(homes("theory.opening.current_endpoint")).toEqual(["theory_breadcrumb"]);
    expect(homes("theory.opening.catalogue_membership")).toEqual(["full_inspector"]);
    expect(homes("derived.opening.deepest_reached")).toEqual(["full_inspector", "review_map"]);
    expect(execution.sourceInputs).toContainEqual(expect.objectContaining({
      projection: { id: "run.record.position", version: 1 },
      subjectKind: "position",
    }));
  });

  it("keeps low-lift topology on demand while promoting meaningful sequences", () => {
    expect(homes("rules.square.event.control")).toEqual(["full_inspector"]);
    expect(homes("rules.mobility.event.piece_destinations")).toEqual(["full_inspector"]);
    expect(homes("derived.pawn.sequence.contact_timing")).toEqual(["full_inspector", "review_map"]);
    expect(homes("derived.pawn.sequence.harassment_pressure")).toEqual(["full_inspector", "postcommit_nudge", "review_map"]);
    expect(homes("derived.tactic.sequence.defender_consequence")).toEqual(["full_inspector", "review_map"]);
    expect(homes("derived.material.event.role_asymmetry")).toEqual(["full_inspector", "review_map"]);
  });

  it("promotes the bounded fork but refuses to render its internal exchange predicate", () => {
    expect(homes("derived.tactic.fork_survives_reply")).toEqual(["full_inspector", "postcommit_nudge", "review_map"]);
    expect(homes("rules.exchange.predicate.legal_exchange")).toEqual([]);
    expect(tactical).toContain("`rules.exchange.predicate.legal_exchange@1` is the explicit exception");
    expect(tactical).toContain("internal `machine_condition` prerequisite with no sentence form");
  });

  it("regenerates a requirements-only image and leaves every product binding blocked", () => {
    expect(execution).toMatchObject({ population: 127, completionClaim: "requirements_only" });
    expect(bindings).toMatchObject({ population: 224, completionClaim: "requirements_only" });
    expect(bindings.rows.every((row) => row.status === "blocked_dependencies")).toBe(true);
  });

  it("bounds withdrawn direct-call prose before the normative DAG and query contract", () => {
    const historical = rfc.indexOf("#### 2.5.0 — Historical direct-call assembler draft");
    const resumed = rfc.indexOf("**Normative specification resumes here.**");
    const query = rfc.indexOf("POST /runs/:runId/modules/query");
    expect(historical).toBeGreaterThan(0);
    expect(resumed).toBeGreaterThan(historical);
    expect(query).toBeGreaterThan(resumed);
    expect(rfc.slice(historical, resumed)).toContain("must not be implemented");
    expect(rfc.slice(resumed, query)).toContain("Nothing in §2.5.0");
  });
});
