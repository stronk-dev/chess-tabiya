// rfc/evidence-presentation.md §8.2 / criterion 2: the component-coverage instrument's RED arms and
// its production reading.
import { describe, expect, it } from "vitest";

import { componentCoverage, formatCoverage, type CoverageAdapter, type CoverageClass, type CoverageInput } from "./coverage.js";
import { productionCoverageInput, unresolvedClassAnchors } from "./production.js";

const CLASSES: Readonly<Record<string, CoverageClass>> = {
  "guidance.fixture@1": "ordinary_presented",
  "inspector.fixture@1": "inspector_presented",
  "operation.fixture@1": "non_presentational_operation",
};

function fixture(overrides: Partial<CoverageInput> = {}): CoverageInput {
  return {
    bindings: [
      { consumer: "guidance.fixture@1", projection: "rules.fixture@1", forms: ["sentence", "machine_condition"] },
      { consumer: "inspector.fixture@1", projection: "rules.fixture@1", forms: ["list", "panel"] },
      { consumer: "guidance.fixture@1", projection: "rules.machine_only@1", forms: ["machine_condition"] },
      { consumer: "operation.fixture@1", projection: "rules.fixture@1", forms: ["list"] },
      { consumer: "guidance.fixture@1", projection: "derived.selection@1", forms: ["sentence"] },
    ],
    adapters: [
      { consumer: "guidance.fixture@1", projection: "rules.fixture@1", component: "fact_statement", forms: ["sentence"], sourceOperands: ["kind"], assertions: ["copied_byte_equal"] },
      { consumer: "inspector.fixture@1", projection: "rules.fixture@1", component: "square_set", forms: ["list", "panel"], sourceOperands: ["kind", "squares"], assertions: ["copied_byte_equal"] },
    ],
    operands: new Map([["rules.fixture@1", ["kind", "squares"]], ["rules.machine_only@1", ["kind"]], ["derived.selection@1", ["rank"]]]),
    classOf: (consumer) => CLASSES[consumer],
    selectionOnly: ["guidance.fixture@1\u0000derived.selection@1"],
    ...overrides,
  };
}
const adapter = (value: Partial<CoverageAdapter> & Pick<CoverageAdapter, "consumer" | "projection">): CoverageAdapter =>
  ({ component: "fact_statement", forms: ["sentence"], sourceOperands: [], assertions: ["copied_byte_equal"], ...value });

describe("component-coverage: the derived populations (§2.3, criterion 2)", () => {
  it("passes a fixture whose every presented pair has exactly one adapter, and excludes machine/selection/operation pairs", () => {
    const report = componentCoverage(fixture());
    expect(report.ok).toBe(true);
    expect(report.populations.learner).toEqual({ pairs: 1, adapted: 1, misses: [] });
    expect(report.populations.inspector).toEqual({ pairs: 1, adapted: 1, misses: [] });
    expect(report.populations.author_operator.pairs).toBe(0);
    expect(formatCoverage(report)).toMatch(/component-coverage: OK/u);
  });

  it("RED: a presented binding with no adapter fails, by name, in its own population", () => {
    const base = fixture();
    const report = componentCoverage({ ...base, bindings: [...base.bindings, { consumer: "inspector.fixture@1", projection: "rules.new@1", forms: ["panel"] }] });
    expect(report.ok).toBe(false);
    expect(report.populations.inspector.misses).toEqual(["inspector.fixture@1 × rules.new@1: no adapter"]);
    expect(report.populations.learner.misses).toEqual([]);
    expect(formatCoverage(report)).toMatch(/MISS inspector\.fixture@1 × rules\.new@1: no adapter/u);
  });

  it("RED: an orphan adapter (its binding retired or unbound) fails", () => {
    const base = fixture();
    const report = componentCoverage({ ...base, adapters: [...base.adapters, adapter({ consumer: "guidance.fixture@1", projection: "rules.retired@1" })] });
    expect(report.ok).toBe(false);
    expect(report.registry).toEqual(["guidance.fixture@1 × rules.retired@1: orphan adapter (no presented binding)"]);
  });

  it("RED: a machine-only, selection-only or non-presentational pair with an adapter fails", () => {
    const base = fixture();
    for (const [consumer, projection, reason] of [
      ["guidance.fixture@1", "rules.machine_only@1", "machine-only"],
      ["guidance.fixture@1", "derived.selection@1", "selection-only"],
      ["operation.fixture@1", "rules.fixture@1", "non-presentational"],
    ] as const) {
      const report = componentCoverage({ ...base, adapters: [...base.adapters, adapter({ consumer, projection })] });
      expect(report.ok).toBe(false);
      expect(report.registry).toEqual([`${consumer} × ${projection}: adapter on a ${reason} pair`]);
    }
  });

  it("RED: wrong forms, an undeclared source operand, a missing assertion and a duplicate adapter each fail", () => {
    const base = fixture();
    const inspector = base.adapters[1]!;
    const run = (replacement: readonly CoverageAdapter[]) => componentCoverage({ ...base, adapters: [base.adapters[0]!, ...replacement] }).populations.inspector.misses;
    expect(run([{ ...inspector, forms: ["panel"] }])[0]).toMatch(/adapter forms \[panel\] ≠ binding forms \[list, panel\]/u);
    expect(run([{ ...inspector, sourceOperands: ["kind", "detail"] }])[0]).toMatch(/not declared by the projection: detail/u);
    expect(run([{ ...inspector, assertions: [] }])[0]).toMatch(/no retention assertion/u);
    expect(run([inspector, inspector])[0]).toMatch(/2 adapters \(exactly one required\)/u);
    expect(run([{ ...inspector, component: "distribution", composition: { id: "fixture_pair", members: [{ component: "distribution", forms: ["list"] }, { component: "outcome_split", forms: ["list"] }] } }])[0]).toMatch(/composition fixture_pair member forms \[list\]/u);
  });

  it("RED: a presented binding whose consumer has no class fails rather than being skipped", () => {
    const base = fixture();
    const report = componentCoverage({ ...base, bindings: [...base.bindings, { consumer: "guidance.unclassified@1", projection: "rules.fixture@1", forms: ["sentence"] }] });
    expect(report.registry).toEqual(["guidance.unclassified@1: presented binding with no consumer class"]);
  });
});

describe("component-coverage: the production registry", () => {
  const report = componentCoverage(productionCoverageInput());

  it("covers every ordinary, Inspector (non-module) and author/operator pair with no registry miss", () => {
    expect(report.populations.learner.misses).toEqual([]);
    expect(report.populations.author_operator.misses).toEqual([]);
    expect(report.populations.inspector.misses.filter((miss) => !miss.startsWith("module."))).toEqual([]);
    expect(report.registry).toEqual([]);
    expect(report.populations.learner.pairs).toBeGreaterThan(0);
    expect(report.populations.author_operator.pairs).toBeGreaterThan(0);
  });

  it("resolves every consumer-class anchor to its named operation", () => {
    expect(unresolvedClassAnchors(process.cwd())).toEqual([]);
  });
});
