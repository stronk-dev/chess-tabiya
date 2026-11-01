import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import * as chess from "./chess.js";
import { admitInstalledOpeningCatalogue } from "./opening-catalogue.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import * as routes from "./internal/evidence-value-routes.js";
import { recordedLastLevelFixture } from "./testing/recorded-last-level-fixture.js";

const artifact = JSON.parse(await readFile(new URL("../../../apps/server/artifacts/runtime-opening-catalogue.json", import.meta.url), "utf8"));
function installation() {
  const installed = admitInstalledOpeningCatalogue(artifact);
  if (installed.kind !== "available") throw new TypeError(installed.reason);
  return installed;
}
const installed = installation();
const endpoint = "theory.opening.current_endpoint@1", membership = "theory.opening.catalogue_membership@1";
function fixture(moves?: string[], fen?: string) {
  const f = recordedLastLevelFixture("white", "*", "opening-point", moves, fen);
  return { ...f, position: (index: number) => routes.invokeEvidenceValueRoute("run.record.position@1", { run: f.run, nodeId: f.path[index]!.id }) };
}
// Exercise the real untrusted dispatcher boundary, including deliberately invalid inputs.
const invoke = (route: typeof endpoint | typeof membership, input: unknown) => routes.invokeEvidenceValueRoute(route, input as never);
const read = (result: unknown, input: unknown, route: string) => routes.readRecordedOpeningPointResult(result as never, input as never, route as never);

describe("installed opening point factories and original result authority", () => {
  it("mints the actual e4 endpoint and independent membership using one paired normalization", () => {
    const f = fixture(), position = f.position(1), input = { source: installed.source, position }, spy = vi.spyOn(chess, "transposeKey");
    try {
      const named = invoke(endpoint, input), member = invoke(membership, input);
      expect(named).toMatchObject({ kind: "available", value: [{ payload: { kind: "matched", eco: "B00", name: "King's Pawn Game", observedPly: 1, sourcePly: 1 } }] });
      expect(member).toMatchObject({ kind: "available", value: [{ payload: { kind: "member", descendantEndpointCount: 2023 } }] });
      if (named.kind !== "available" || member.kind !== "available") throw new Error("Actual source must be available");
      const a = read(named.value, input, endpoint), b = read(member.value, input, membership);
      expect(a.invocation).toBe(b.invocation);
      expect(a.source).toBe(installed.source); expect(a.position).toBe(position);
      expect(a.lookup.endpointRow).toMatchObject({ sourceFile: expect.stringMatching(/^[a-e]\.tsv$/u), sourceRow: expect.any(Number) });
      expect(spy).toHaveBeenCalledExactlyOnceWith(position.payload.fen);
      expect(Object.isFrozen(named.value)).toBe(true); expect(Object.isFrozen(member.value)).toBe(true);
    } finally { spy.mockRestore(); }
  });
  it("keeps an unnamed member distinct from no catalogue path without emitting unnamed facts", () => {
    const f = fixture(["d2d4", "g8f6", "c2c4", "e7e6"]), input = { source: installed.source, position: f.position(4) };
    const named = invoke(endpoint, input), member = invoke(membership, input);
    expect(named).toEqual({ kind: "available", value: [] });
    expect(member).toMatchObject({ kind: "available", value: [{ payload: { descendantEndpointCount: 304 } }] });
    if (named.kind !== "available") throw new Error("Expected successful negative");
    expect(read(named.value, input, endpoint).lookup.result.currentEndpoint).toMatchObject({ kind: "absent", reason: "no_named_endpoint" });
    const empty = fixture([], "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1"), negative = { source: installed.source, position: empty.position(0) };
    for (const route of [endpoint, membership] as const) {
      const result = invoke(route, negative);
      expect(result).toEqual({ kind: "available", value: [] });
      if (result.kind !== "available") throw new Error("Expected successful negative");
      read(result.value, negative, route);
      expect(() => read([...result.value], negative, route)).toThrow();
    }
  });
  it.each([endpoint, membership] as const)("%s refuses forged source/position and extra caller output before lookup", route => {
    const position = fixture().position(1), callback = vi.fn();
    for (const source of [{ ...installed.source }, installed.catalogue, { openingIdentity: callback }, admitInstalledOpeningCatalogue()]) {
      expect(() => invoke(route, { source, position })).toThrow();
    }
    expect(callback).not.toHaveBeenCalled();
    for (const candidate of [{ ...position }, position.payload, JSON.parse(JSON.stringify(position))]) expect(() => invoke(route, { source: installed.source, position: candidate })).toThrow();
    expect(() => invoke(route, { source: installed.source, position, name: "manufactured" })).toThrow();
  });
  it("authenticates fresh positive/negative arrays against their exact source, position and projection", () => {
    const f = fixture(), position = f.position(1), input = { source: installed.source, position }, result = invoke(endpoint, input);
    if (result.kind !== "available") throw new Error("Expected endpoint");
    const fresh = invoke(endpoint, input);
    expect(fresh).toMatchObject(result);
    if (fresh.kind !== "available") throw new Error("Expected fresh endpoint");
    expect(fresh.value).not.toBe(result.value);
    for (const copy of [[...result.value], result.value.slice(0, 0), JSON.parse(JSON.stringify(result.value))]) expect(() => read(copy, input, endpoint)).toThrow();
    expect(() => read(result.value, { source: installation().source, position }, endpoint)).toThrow();
    expect(() => read(result.value, { source: installed.source, position: f.position(1) }, endpoint)).toThrow();
    expect(() => read(result.value, input, membership)).toThrow();
  });
  it("retains recorded observed ply and input authority rather than a source-ply or payload-only join", () => {
    const f = fixture(["g1f3", "g8f6", "f3g1", "f6g8", "e2e4"]), input = { source: installed.source, position: f.position(5) };
    const delayed = invoke(endpoint, input), direct = invoke(endpoint, { source: installed.source, position: fixture().position(1) });
    if (delayed.kind !== "available" || direct.kind !== "available") throw new Error("Expected matched endpoints");
    expect(delayed.value[0]!.payload).toMatchObject({ observedPly: 5, sourcePly: 1 });
    expect(evidenceValueReceipt(delayed.value[0]!).inputDigest).not.toBe(evidenceValueReceipt(direct.value[0]!).inputDigest);
  });
});
