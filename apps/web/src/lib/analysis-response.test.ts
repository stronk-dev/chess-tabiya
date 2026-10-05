import { describe, expect, it } from "vitest";
import { DrillApi } from "./api.js";

const request = ["root", "child"];
const receipt = () => ({ batchId: "batch", jobs: request.map((nodeId, index) => ({ id: `job-${index}`, nodeId, kind: "bestline" })) });
const key = "12345678-1234-4234-9234-123456789012";

describe("exact durable analysis admission", () => {
  it("retains the full ordered batch/job receipt and unchanged idempotency key", async () => {
    const calls: RequestInit[] = [];
    const api = new DrillApi("http://tabiya.test", async (_url, init) => { calls.push(init!); return Response.json(receipt(), { status: 202 }); });
    const result = await api.analysis("run", request, "writer", key);
    expect(result).toEqual(receipt());
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.jobs)).toBe(true);
    expect(new Headers(calls[0]!.headers).get("idempotency-key")).toBe(key);
    expect(JSON.parse(String(calls[0]!.body))).toEqual({ nodeIds: request, kind: "bestline", multiPv: 1, movetime: 100 });
  });
  it.each([
    ["missing batch", () => ({ jobs: receipt().jobs })],
    ["empty batch", () => ({ ...receipt(), batchId: "" })],
    ["wrong node", () => ({ ...receipt(), jobs: [{ ...receipt().jobs[0], nodeId: "another" }, receipt().jobs[1]] })],
    ["duplicate node", () => ({ ...receipt(), jobs: [receipt().jobs[0], { ...receipt().jobs[1], nodeId: "root" }] })],
    ["duplicate job", () => ({ ...receipt(), jobs: [receipt().jobs[0], { ...receipt().jobs[1], id: "job-0" }] })],
    ["wrong kind", () => ({ ...receipt(), jobs: [{ ...receipt().jobs[0], kind: "eval" }, receipt().jobs[1]] })],
    ["missing job", () => ({ ...receipt(), jobs: [receipt().jobs[0]] })],
    ["reordered nodes", () => ({ ...receipt(), jobs: receipt().jobs.reverse() })],
    ["extra field", () => ({ ...receipt(), ready: true })],
    ["extra job field", () => ({ ...receipt(), jobs: [{ ...receipt().jobs[0], ready: true }, receipt().jobs[1]] })],
  ] as const)("refuses %s before client admission", async (_name, mutate) => {
    const api = new DrillApi("http://tabiya.test", async () => Response.json(mutate(), { status: 202 }));
    await expect(api.analysis("run", request, "writer", key)).rejects.toThrow();
  });
  it.each([200, 201])("refuses HTTP %s as durable admission", async status => {
    const api = new DrillApi("http://tabiya.test", async () => Response.json(receipt(), { status }));
    await expect(api.analysis("run", request, "writer", key)).rejects.toThrow();
  });
  it.each([[], ["root", "root"], [""], Array.from({ length: 17 }, (_, i) => `node-${i}`)].map(nodeIds => ({ nodeIds })))("refuses an invalid requested population before HTTP ($nodeIds)", async ({ nodeIds }) => {
    let calls = 0;
    const api = new DrillApi("http://tabiya.test", async () => { calls += 1; return Response.json(receipt(), { status: 202 }); });
    await expect(api.analysis("run", nodeIds, "writer", key)).rejects.toThrow();
    expect(calls).toBe(0);
  });
});
