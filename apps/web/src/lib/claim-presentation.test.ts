import { afterEach, describe, expect, it, vi } from "vitest";
import * as execution from "../../../../packages/runtime/src/evidence-binding-execution.js";
import * as routes from "../../../../packages/runtime/src/internal/evidence-value-routes.js";

import type { AuthoredFeedbackItem } from "./api.js";
import { claimProvenance, claimProvenanceDeclared } from "./claim-presentation.js";

function claim(overrides: Partial<Extract<AuthoredFeedbackItem, { kind: "claim" }>> = {}): Extract<AuthoredFeedbackItem, { kind: "claim" }> {
  return {
    kind: "claim",
    id: "claim#one",
    revealedBy: { kind: "outcome", eventSeq: 4 },
    anchor: { claimId: "one" },
    text: "Authored sentence.",
    evidenceTypes: ["tablebase_exact", "author_principle"],
    earnedEvidenceTypes: ["tablebase_exact"],
    binding: "author_attributed",
    authorSpans: ["Authored sentence."],
    principles: [{ id: "p", name: "Activity", statement: "Activity has a cost.", standsOn: "source", counterCase: "The activity is forced." }],
    ...overrides,
  };
}

afterEach(() => vi.restoreAllMocks());

describe("claim complete execution before collection", () => {
  const originalCompile = execution.compileEvidenceConsumerExecution;
  it.each(["missing_policy", "impossible_latency", "raw_source", "duplicate_adapter", "missing_bindings"] as const)("refuses %s before claim evidence is minted", fault => {
    const compile = vi.spyOn(execution, "compileEvidenceConsumerExecution").mockImplementation((manifest, consumer) => {
      const first = manifest.bindings.find(row => row.consumer.id === consumer.id)!;
      const { sourceAbsence: _absence, ...base } = first;
      const added = {
        ...base, adapter: { id: "adapter.fixture.claim_execution", version: 1 },
        producer: { id: "live.stockfish", version: 1 },
        projection: { id: fault === "raw_source" ? "live.stockfish.uci_response" : "live.stockfish.position_eval", version: 1 },
        latency: { mode: fault === "impossible_latency" ? "sync" as const : "interactive" as const, maxMs: 1000 },
        ...(fault === "missing_policy" ? {} : { sourceAbsence: { necessity: "required" as const, whenNoPath: "operation_unavailable" as const } }),
      };
      const bindings = fault === "missing_bindings" ? manifest.bindings.filter(row => row.consumer.id !== consumer.id)
        : fault === "duplicate_adapter" ? [...manifest.bindings, first] : [...manifest.bindings, added];
      return originalCompile({ ...manifest, bindings }, consumer);
    });
    const factory = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => claimProvenance(claim())).toThrow(/BINDING_|EXECUTION_/u);
    expect(compile).toHaveBeenCalledOnce();
    expect(compile.mock.calls[0]![1]).toEqual({ id: "guidance.authored_claim", version: 1 });
    expect(factory).not.toHaveBeenCalled();
  });

  it("compiles each delivery before its factory and retains the source-aware learner copy", () => {
    const trace: string[] = [];
    vi.spyOn(execution, "compileEvidenceConsumerExecution").mockImplementation((...args) => {
      trace.push("compile"); return originalCompile(...args);
    });
    const originalRoute = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => {
      trace.push("factory"); return originalRoute(...args);
    });
    expect(claimProvenance(claim())).toContain("Evidence recorded for: exact tablebase.");
    expect(claimProvenance(claim({ binding: "self_declared", earnedEvidenceTypes: [], principles: [] }))).toContain("No machine record is attached.");
    expect(trace).toEqual(["compile", "factory", "compile", "factory"]);
  });
});

describe("claim provenance", () => {
  it("rejects a bare claim at the delivery-sheet consumer boundary", () => {
    if (false) {
      // @ts-expect-error Delivery sheets consume an admitted full claim item.
      claimProvenanceDeclared(claim());
    }
  });
  it("names only earned machine labels as recorded evidence", () => {
    const text = claimProvenance(claim());
    // rfc/evidence-presentation.md §6: the evidence-type vocabulary renders through its label registry.
    expect(text).toContain("Evidence recorded for: exact tablebase.");
    expect(text).not.toContain("Evidence recorded for: exact tablebase, author principle");
    expect(text).not.toMatch(/tablebase_exact|author_principle/u);
    expect(text).toContain("It can be wrong when: The activity is forced.");
  });

  it("states the absence of a record for self-declared claims", () => {
    expect(claimProvenance(claim({ binding: "self_declared", evidenceTypes: ["derived_feature"], earnedEvidenceTypes: [], principles: [] })))
      .toBe("Author's claim, author-declared: board-feature reading. No machine record is attached.");
  });
});
