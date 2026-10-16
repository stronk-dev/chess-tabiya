import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import * as chess from "./chess.js";
import { admitInstalledOpeningCatalogue, openingIdentityAt, readInstalledOpeningCatalogue } from "./opening-catalogue.js";
import { recordedOpeningLookup, readRecordedOpeningLookup, type RecordedOpeningLookup } from "./internal/recorded-opening-lookup.js";
import { invokeEvidenceValueRoute, readRecordedPositionInvocation, assertRecordedPositionInvocation } from "./internal/evidence-value-routes.js";
import { recordedLastLevelFixture } from "./testing/recorded-last-level-fixture.js";

const artifact = JSON.parse(await readFile(new URL("../../../apps/server/artifacts/runtime-opening-catalogue.json", import.meta.url), "utf8"));
function installation() {
  const installed = admitInstalledOpeningCatalogue(artifact);
  if (installed.kind !== "available") throw new TypeError(`Actual installed catalogue refused: ${installed.reason}`);
  return installed;
}
const installed = installation();
function fixture(moves?: string[], fen?: string) {
  const f = recordedLastLevelFixture("white", "*", "recorded-opening-lookup", moves, fen);
  return { ...f, position: (index: number) => invokeEvidenceValueRoute("run.record.position@1", { run: f.run, nodeId: f.path[index]!.id }) };
}

describe("source-owned recorded opening paired invocation prerequisite", () => {
  it("retains the exact installed endpoint and membership rows, not caller copies or a sourcePly-labelled occurrence", () => {
    const f = fixture(), position = f.position(1), input = { source: installed.source, position };
    const token = recordedOpeningLookup(input), data = readRecordedOpeningLookup(token, input.source, position);
    expect(data.source).toBe(installed.source); expect(data.position).toBe(position);
    expect(data.positionInvocation).toBe(readRecordedPositionInvocation(position));
    expect(data.lookup.catalogue).toBe(installed.catalogue);
    expect(data.lookup.endpointRow).toBe(installed.catalogue.artifact.namedEndpoints.find(row => row.key === chess.transposeKey(position.payload.fen)));
    expect(data.lookup.membershipRow).toBe(installed.catalogue.artifact.pathMembership.find(row => row.key === chess.transposeKey(position.payload.fen)));
    expect(data.lookup.result.currentEndpoint).toMatchObject({ kind: "matched", eco: "B00", name: "King's Pawn Game", observedPly: 1, sourcePly: 1 });
    expect(data.lookup.result.catalogueMembership).toMatchObject({ kind: "member", descendantEndpointCount: 2023 });
    expect(data.lookup.endpointRow).toMatchObject({ sourceFile: expect.stringMatching(/^[a-e]\.tsv$/u), sourceRow: expect.any(Number) });
    expect(recordedOpeningLookup(input)).toBe(token);
    for (const value of [token, data, data.positionInvocation, data.lookup, data.lookup.result, data.lookup.endpointRow, data.lookup.membershipRow]) expect(Object.isFrozen(value)).toBe(true);
  });

  it("normalizes/calculates only one pair for both projections of the same original occurrence", () => {
    const f = fixture(), position = f.position(1), spy = vi.spyOn(chess, "transposeKey");
    try {
      const token = recordedOpeningLookup({ source: installed.source, position });
      const data = readRecordedOpeningLookup(token, installed.source, position);
      expect(data.lookup.result.currentEndpoint.kind).toBe("matched"); expect(data.lookup.result.catalogueMembership.kind).toBe("member");
      expect(recordedOpeningLookup({ source: installed.source, position })).toBe(token);
      expect(spy).toHaveBeenCalledExactlyOnceWith(position.payload.fen);
    } finally { spy.mockRestore(); }
  });

  it("the existing actual HTTP/phase lookup also uses the installed source and a single normalization", () => {
    const position = fixture().position(1), spy = vi.spyOn(chess, "transposeKey");
    try {
      const pair = openingIdentityAt(installed, position.payload.fen, position.payload.ply);
      expect(pair.currentEndpoint).toMatchObject({ kind: "matched", name: "King's Pawn Game" });
      expect(spy).toHaveBeenCalledExactlyOnceWith(position.payload.fen);
    } finally { spy.mockRestore(); }
    expect(() => openingIdentityAt({ ...installed, source: { ...installed.source } }, position.payload.fen, 1)).toThrow(/not admitted/u);
  });

  it("keeps unnamed catalogue membership separate from an authentic absent endpoint", () => {
    const f = fixture(["d2d4", "g8f6", "c2c4", "e7e6"]), position = f.position(4);
    const data = readRecordedOpeningLookup(recordedOpeningLookup({ source: installed.source, position }), installed.source, position);
    expect(data.lookup.result.currentEndpoint).toMatchObject({ kind: "absent", reason: "no_named_endpoint", observedPly: 4 });
    expect(data.lookup.endpointRow).toBeNull();
    expect(data.lookup.membershipRow?.descendantEndpointCount).toBe(304);
    expect(data.lookup.result.catalogueMembership).toMatchObject({ kind: "member", descendantEndpointCount: 304 });
    expect(data.lookup.result.catalogueMembership).not.toHaveProperty("name");
    expect(data.lookup.result.catalogueMembership).not.toHaveProperty("eco");
  });

  it("retains a genuinely executed double-negative pair without manufacturing endpoint evidence", () => {
    const f = fixture([], "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1"), position = f.position(0);
    const token = recordedOpeningLookup({ source: installed.source, position }), data = readRecordedOpeningLookup(token, installed.source, position);
    expect(data.lookup.endpointRow).toBeNull(); expect(data.lookup.membershipRow).toBeNull();
    expect(data.lookup.result.currentEndpoint).toMatchObject({ kind: "absent", reason: "no_named_endpoint" });
    expect(data.lookup.result.catalogueMembership).toMatchObject({ kind: "absent", reason: "no_catalogue_path" });
    expect(recordedOpeningLookup({ source: installed.source, position })).toBe(token);
    expect(token).not.toHaveProperty("items"); // Not a point-factory array receipt or a complete history.
  });

  it("retains separate occurrences for repeated keys and the real observed ply instead of catalogue ply", () => {
    const f = fixture(["g1f3", "g8f6", "f3g1", "f6g8", "e2e4"]), root = f.position(0), repeated = f.position(4), named = f.position(5);
    expect(chess.transposeKey(root.payload.fen)).toBe(chess.transposeKey(repeated.payload.fen));
    const first = recordedOpeningLookup({ source: installed.source, position: root }), second = recordedOpeningLookup({ source: installed.source, position: repeated });
    expect(second).not.toBe(first);
    expect(readRecordedOpeningLookup(second, installed.source, repeated).lookup.result.currentEndpoint).toMatchObject({ observedPly: 4 });
    expect(() => readRecordedOpeningLookup(first, installed.source, repeated)).toThrow(/original/u);
    const match = readRecordedOpeningLookup(recordedOpeningLookup({ source: installed.source, position: named }), installed.source, named);
    expect(match.lookup.result.currentEndpoint).toMatchObject({ kind: "matched", eco: "B00", observedPly: 5, sourcePly: 1 });
  });

  it("equal position values from separate factory calls and installations do not cross original invocation identities", () => {
    const f = fixture(), position = f.position(1), equivalent = f.position(1), other = installation();
    expect(equivalent).toEqual(position); expect(equivalent).not.toBe(position);
    const token = recordedOpeningLookup({ source: installed.source, position });
    expect(() => readRecordedOpeningLookup(token, installed.source, equivalent)).toThrow(/original/u);
    expect(() => readRecordedOpeningLookup(token, other.source, position)).toThrow(/original/u);
    expect(recordedOpeningLookup({ source: installed.source, position: equivalent })).not.toBe(token);
    expect(recordedOpeningLookup({ source: other.source, position })).not.toBe(token);
  });

  it.each(["copy", "json", "prototype", "payload"] as const)("refuses a %s position before any lookup", fault => {
    const position = fixture().position(1), fake = fault === "copy" ? { ...position } : fault === "json" ? JSON.parse(JSON.stringify(position))
      : fault === "prototype" ? Object.create(position) : position.payload;
    const spy = vi.spyOn(chess, "transposeKey");
    try { expect(() => recordedOpeningLookup({ source: installed.source, position: fake })).toThrow(); expect(spy).not.toHaveBeenCalled(); }
    finally { spy.mockRestore(); }
  });

  it.each(["copy", "json", "compiled", "callback", "unavailable"] as const)("refuses a %s source instead of treating it as no match", fault => {
    const position = fixture().position(1), callback = vi.fn();
    const fake = fault === "copy" ? { ...installed.source } : fault === "json" ? JSON.parse(JSON.stringify(installed.source))
      : fault === "compiled" ? installed.catalogue : fault === "callback" ? { ...installed.source, openingIdentity: callback } : admitInstalledOpeningCatalogue();
    expect(() => recordedOpeningLookup({ source: fake as never, position })).toThrow(/not admitted/u); expect(callback).not.toHaveBeenCalled();
  });

  it.each(["copy", "json", "prototype", "unexecuted", "raw-result"] as const)("refuses a %s lookup token, including all-negative output copies", fault => {
    const position = fixture([], "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1").position(0);
    const token = recordedOpeningLookup({ source: installed.source, position }), data = readRecordedOpeningLookup(token, installed.source, position);
    const fake = fault === "copy" ? { ...token } : fault === "json" ? JSON.parse(JSON.stringify(token)) : fault === "prototype" ? Object.create(token)
      : fault === "raw-result" ? data.lookup.result : {};
    expect(() => readRecordedOpeningLookup(fake as RecordedOpeningLookup, installed.source, position)).toThrow(/original/u);
  });

  it.each(["extra", "hidden", "symbol", "getter", "prototype", "missing"] as const)("refuses %s input controls without invoking getters", fault => {
    const input: Record<string, unknown> = { source: installed.source, position: fixture().position(1) }, getter = vi.fn(() => installed.source);
    if (fault === "extra") input.fen = "replacement";
    else if (fault === "hidden") Object.defineProperty(input, "expectedDigest", { value: installed.source.ref.artifactDigest });
    else if (fault === "symbol") Object.defineProperty(input, Symbol("replacement"), { value: {} });
    else if (fault === "getter") Object.defineProperty(input, "source", { enumerable: true, get: getter });
    else if (fault === "prototype") Object.setPrototypeOf(input, { source: installed.source });
    else delete input.position;
    expect(() => recordedOpeningLookup(input as never)).toThrow(/exactly/u); expect(getter).not.toHaveBeenCalled();
  });

  it("retains original head membership and does not substitute a new run for the recorded occurrence", () => {
    const f = fixture(), position = f.position(1), token = recordedOpeningLookup({ source: installed.source, position });
    assertRecordedPositionInvocation(position, f.run, f.path[1]!.id);
    const other = recordedLastLevelFixture("white", "*", "foreign-opening-run");
    expect(() => assertRecordedPositionInvocation(position, other.run, other.path[1]!.id)).toThrow(/original/u);
    expect(readRecordedOpeningLookup(token, installed.source, position).position).toBe(position);
    // Current authorization/full-graph checks belong to the complete history/source boundary.
    expect(readInstalledOpeningCatalogue(installed.source)).toBe(installed.catalogue);
  });
});
