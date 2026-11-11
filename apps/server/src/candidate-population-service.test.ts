import { describe, expect, it, vi } from "vitest";
import { CandidatePopulationService, type CandidatePopulationEntry } from "./candidate-population-service.js";
import { readCandidateOutcomeSources, candidateOutcomeFoundationId, type CandidateAcquisitionScope } from "../../../packages/runtime/src/candidate-population.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { buildSync } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const A = "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1";
const B = "7k/8/8/3p4/2P5/8/3P4/7K b - - 0 1";
function begin(service: CandidatePopulationService, fen = A) {
  const result = service.begin(fen); if (result.kind !== "started") throw Error(JSON.stringify(result)); return result.entry;
}
function finish<S extends CandidateAcquisitionScope>(service: CandidatePopulationService, entry: CandidatePopulationEntry, scope: S) {
  for (let step = 0; step < 1000; step++) {
    const result = service.advance(entry, scope);
    if (result.kind === "ready") return result.receipt;
    if (result.kind !== "pending") throw Error(JSON.stringify(result));
  }
  throw Error("Finite construction did not finish");
}

describe("application-lifetime scoped candidate owners", () => {
  it("held retired tokens release actual owner data while held completed receipts stay valid", () => {
    const temporary = mkdtempSync(join(tmpdir(), "tabiya-candidate-retirement-"));
    try {
      const output = join(temporary, "retirement.mjs");
      buildSync({ entryPoints: [resolve("apps/server/src/testing/candidate-retirement.test-support.ts")], bundle: true,
        platform: "node", format: "esm", outfile: output, logLevel: "silent" });
      const result = execFileSync(process.execPath, ["--expose-gc", output], { encoding: "utf8", timeout: 10_000 });
      expect(result).toContain("held retired token released core");
    } finally { rmSync(temporary, { recursive: true, force: true }); }
  });

  it("counts pending owners from begin and retires evicted tokens before any source acquisition", () => {
    const service = new CandidatePopulationService({ capacity: 1 }), calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const first = begin(service);
      expect(service.stats()).toEqual({ hits: 0, misses: 1, retained: 1, capacity: 1 });
      expect(service.read(first, "foundation")).toEqual({ kind: "pending" });
      const second = begin(service, B);
      expect(service.stats()).toEqual({ hits: 0, misses: 2, retained: 1, capacity: 1 });
      expect(service.advance(first, "foundation")).toEqual({ kind: "retired" });
      expect(service.read(first, "events_and_readings")).toEqual({ kind: "retired" });
      expect(calls).not.toHaveBeenCalled();
      expect(() => service.advance({ ...second }, "foundation")).toThrow(/original/);
      expect(() => new CandidatePopulationService({ capacity: 1 }).advance(second, "foundation")).toThrow(/original/);
      expect(service.stats().retained).toBe(1);
    } finally { calls.mockRestore(); }
  });

  it("same-entry core/full requests share sources while a retained old completed receipt survives eviction", () => {
    const service = new CandidatePopulationService({ capacity: 1 }), entry = begin(service), core = finish(service, entry, "foundation");
    const original = readCandidateOutcomeSources(core);
    expect(begin(service)).toBe(entry);
    const full = service.wide(A); if (full.kind !== "ready") throw Error(JSON.stringify(full));
    expect(readCandidateOutcomeSources(full.receipt)).toBe(original);
    expect(candidateOutcomeFoundationId(full.receipt)).toBe(core.id);
    expect(service.stats()).toEqual({ hits: 2, misses: 1, retained: 1, capacity: 1 });
    begin(service, B);
    expect(service.advance(entry, "events_and_readings")).toEqual({ kind: "retired" });
    expect(readCandidateOutcomeSources(core)).toBe(original);
    const next = finish(service, begin(service), "foundation"), replacement = readCandidateOutcomeSources(next);
    expect(next.id).toBe(core.id); // Same facts do not make them the original source objects.
    expect(next).not.toBe(core); expect(replacement.root.common[0]).not.toBe(original.root.common[0]);
    expect(() => readCandidateOutcomeSources({ ...next, legalMovesInput: core.legalMovesInput })).toThrow();
  });

  it("interleaved readers advance one shared slot without duplicate legal-position acquisition", () => {
    const service = new CandidatePopulationService({ capacity: 2 }), a = begin(service), b = begin(service);
    expect(a).toBe(b);
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      service.advance(a, "foundation"); service.advance(b, "events_and_readings");
      const core = finish(service, a, "foundation"), full = finish(service, b, "events_and_readings");
      expect(readCandidateOutcomeSources(full)).toBe(readCandidateOutcomeSources(core));
      const legal = calls.mock.calls.filter(([route]) => route === "rules.mobility.reading.legal_moves@1");
      const fens = legal.map(([, input]) => (input as { fen: string }).fen);
      expect(new Set(fens).size).toBe(fens.length);
      expect(fens.length).toBe(full.packet.candidates.length + 1);
    } finally { calls.mockRestore(); }
  });

  it("invalid-root failure leaves no retained or resumable owner", () => {
    const service = new CandidatePopulationService({ capacity: 2 }), entry = begin(service, "not a fen");
    expect(service.advance(entry, "foundation")).toMatchObject({ kind: "failed", error: { code: "invalid_fen" } });
    expect(service.stats().retained).toBe(0);
    expect(service.advance(entry, "foundation")).toEqual({ kind: "retired" });
  });
});
