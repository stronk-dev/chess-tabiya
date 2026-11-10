import { readFileSync } from "node:fs";

import { assertOpponentModeDispositions, FORMAT_DISPOSITIONS } from "@chess-tabiya/schema/drill-pack";
import { RUN_OPPONENT_MODES } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { DECLARED_UNIMPLEMENTED_POLICY_MODES } from "./capabilities.js";
import { MACHINE_LABEL_EVIDENCE_KINDS } from "./sourcing/claim-binding.js";
import { ABSTENTION_REASONS, EVIDENCE_KINDS } from "./sourcing/types.js";

const drillPackSchema = JSON.parse(readFileSync(
  new URL("../../../schemas/drill_pack.schema.json", import.meta.url),
  "utf8",
)) as any;

describe("format surface 0.25", () => {



  it("keeps the schema-owned disposition register non-vacuous and aligned", () => {
    const keys = FORMAT_DISPOSITIONS.map((entry) => `${entry.pointer}\u0000${entry.value ?? ""}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(FORMAT_DISPOSITIONS.find((entry) => entry.pointer === "assistance:arrows")).toMatchObject({ disposition: "unmeasured", experiment: expect.any(String) });
    expect(FORMAT_DISPOSITIONS.find((entry) => entry.pointer === "error:SIMULATE_BUDGET_EXCEEDED")).toMatchObject({ disposition: "retired", removedAt: "0.25" });
    expect(FORMAT_DISPOSITIONS.find((entry) => entry.pointer === "/retryVariants")).toMatchObject({ disposition: "refused" });

    const declared = new Set(DECLARED_UNIMPLEMENTED_POLICY_MODES.map((entry) => entry.mode));
    const schemaOnly = new Set(["plan_defense", "human_external"]);
    expect(declared).toEqual(schemaOnly);
    expect([...schemaOnly].every((mode) => !RUN_OPPONENT_MODES.includes(mode as never))).toBe(true);
    for (const refusal of DECLARED_UNIMPLEMENTED_POLICY_MODES) {
      expect(FORMAT_DISPOSITIONS).toContainEqual(expect.objectContaining({
        pointer: "/opponentPolicy/mode",
        value: refusal.mode,
        disposition: "refused",
        reason: refusal.reason,
      }));
    }

    const schemaModes = drillPackSchema.$defs.opponentPolicy.properties.mode.enum as string[];
    expect(schemaModes).toHaveLength(7);
    expect(() => assertOpponentModeDispositions(schemaModes, RUN_OPPONENT_MODES)).not.toThrow();
    const modeRows = FORMAT_DISPOSITIONS.filter((entry) => entry.pointer === "/opponentPolicy/mode");
    const replace = (value: string, update: Record<string, unknown>) => FORMAT_DISPOSITIONS.map((entry) => entry.pointer === "/opponentPolicy/mode" && entry.value === value ? { ...entry, ...update } : entry);
    expect(() => assertOpponentModeDispositions(schemaModes, RUN_OPPONENT_MODES, FORMAT_DISPOSITIONS.filter((entry) => !(entry.pointer === "/opponentPolicy/mode" && entry.value === "human_common")))).toThrow(/MISSING:human_common/);
    expect(() => assertOpponentModeDispositions(schemaModes, RUN_OPPONENT_MODES, replace("human_common", { disposition: "refused" }) as typeof FORMAT_DISPOSITIONS)).toThrow(/INVALID:human_common:reached/);
    expect(() => assertOpponentModeDispositions(schemaModes, RUN_OPPONENT_MODES, replace("plan_defense", { disposition: "reached", site: { module: "fixture", symbol: "fixture" } }) as typeof FORMAT_DISPOSITIONS)).toThrow(/INVALID:plan_defense:refused/);
    expect(() => assertOpponentModeDispositions(schemaModes, RUN_OPPONENT_MODES, replace("human_common", { site: undefined }) as typeof FORMAT_DISPOSITIONS)).toThrow(/SITE_MISSING:human_common/);
    expect(modeRows).toHaveLength(schemaModes.length);

    const capabilitiesSource = readFileSync(new URL("./capabilities.ts", import.meta.url), "utf8");
    expect(capabilitiesSource).not.toContain("formatDispositions");
  });

  it("binds the 0.29 provenance and evidence transcriptions to their live registries", () => {
    const reasonEnum = drillPackSchema.$defs.provenance.properties.corpusEvidence.oneOf[1].properties.reason.enum;
    const clearanceKinds = drillPackSchema.$defs.graduationClearance.oneOf[1].properties.recordKind.enum;
    expect(new Set(reasonEnum)).toEqual(new Set(ABSTENTION_REASONS));
    expect(new Set(clearanceKinds)).toEqual(new Set(EVIDENCE_KINDS));
    expect(MACHINE_LABEL_EVIDENCE_KINDS.provenance_note).toEqual(["citable_text"]);
    expect(Object.entries(MACHINE_LABEL_EVIDENCE_KINDS).filter(([, kinds]) => kinds.includes("citable_text" as never)).map(([label]) => label)).toEqual(["provenance_note"]);
    expect(drillPackSchema.$defs.timingWindow.properties.note.maxLength).toBe(2000);
    expect(drillPackSchema.$defs.objectiveGrading.properties.assessedBy.oneOf[0].properties.note.maxLength).toBe(400);
  });
});
