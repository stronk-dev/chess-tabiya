// DISPOSABLE research harness — D1678/D1685. Not production code.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const targetCalls = new Set([
  "queue.enqueue",
  "queue.enqueueProducer",
  "selector.select",
  "selector.enumerate",
  "this.#tablebase.probe",
  "corpusSource.stats",
  "evidencePacket",
]);

function source(path: string): ts.SourceFile {
  return ts.createSourceFile(path, readFileSync(join(root, path), "utf8"), ts.ScriptTarget.Latest, true);
}

function callCensus(paths: readonly string[]): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const path of paths) {
    const counts: Record<string, number> = {};
    const file = source(path);
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        const callee = node.expression.getText(file);
        if (targetCalls.has(callee)) counts[callee] = (counts[callee] ?? 0) + 1;
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
    result[path] = counts;
  }
  return result;
}

function interfaceMembers(path: string, name: string): readonly string[] {
  const file = source(path);
  for (const statement of file.statements) {
    if (!ts.isInterfaceDeclaration(statement) || statement.name.text !== name) continue;
    return Object.freeze(statement.members.map((member) => member.name?.getText(file) ?? "<unnamed>").sort());
  }
  throw new TypeError(`Missing interface ${name} in ${path}`);
}

function methodInputMembers(path: string, methodName: string, parameterName: string): readonly string[] {
  const file = source(path);
  let found: readonly string[] | undefined;
  const visit = (node: ts.Node): void => {
    if (ts.isMethodDeclaration(node) && node.name.getText(file) === methodName) {
      const parameter = node.parameters.find((candidate) => candidate.name.getText(file) === parameterName);
      if (parameter?.type !== undefined && ts.isTypeLiteralNode(parameter.type)) {
        found = Object.freeze(parameter.type.members.map((member) => member.name?.getText(file) ?? "<unnamed>").sort());
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (found === undefined) throw new TypeError(`Missing ${methodName}.${parameterName} type in ${path}`);
  return found;
}

describe("D1678 run-derived evidence operation boundary", () => {
  it("pins all current run-surface producer request calls in service and REST", () => {
    const census = callCensus(["apps/server/src/service.ts", "apps/server/src/rest.ts"]);
    expect(census).toEqual({
      "apps/server/src/service.ts": {
        "queue.enqueue": 3,
        "queue.enqueueProducer": 1,
        "selector.select": 2,
        "selector.enumerate": 1,
        "this.#tablebase.probe": 1,
      },
      "apps/server/src/rest.ts": {
        "selector.select": 3,
        "corpusSource.stats": 1,
        evidencePacket: 3,
      },
    });
    const total = Object.values(census).flatMap(Object.values).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(15);
  });

  it("proves the three request identities carry no rules or setup family", () => {
    expect(interfaceMembers("apps/server/src/evidence-queue.ts", "EvidenceJobInput")).toEqual([
      "depth", "fen", "kind", "movetime", "multiPv", "nodeId", "objectiveRequest", "runId", "timeoutMs",
    ]);
    expect(interfaceMembers("apps/server/src/opponent-selector.ts", "SelectMoveRequest")).toEqual([
      "historyUci", "packId", "policy", "seed", "startFen",
    ]);
    expect(interfaceMembers("packages/runtime/src/types.ts", "RunStart")).toEqual(["fen", "side"]);
  });

  it("proves prediction persistence receives no distribution subject", () => {
    expect(methodInputMembers("apps/server/src/service.ts", "recordPrediction", "input")).toEqual([
      "at", "checkpointId", "distribution", "nodeId", "predictedUci",
    ]);
    const rest = readFileSync(join(root, "apps/server/src/rest.ts"), "utf8");
    expect(rest).toContain('closedRecord(value, "/", ["startFen", "historyUci", "policy", "seed", "packId", "checkpointId", "nodeId", "predictedUci", "at"])');
    expect(rest).toContain("distribution: selection");
  });
});
