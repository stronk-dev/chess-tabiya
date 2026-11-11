// Disposable D4240 measurement adapter. Observes production stages; never supplies source data.
import { CandidatePopulationService, type CandidatePopulationEntry } from "../../apps/server/src/candidate-population-service.js";

interface Trace { deps: number; packets: Record<string, unknown>[] }
export function observeHintAcquisition(current: () => Trace | undefined): () => void {
  const begin = CandidatePopulationService.prototype.begin;
  const advance = CandidatePopulationService.prototype.advance;
  const read = CandidatePopulationService.prototype.read;
  const pending = new WeakMap<CandidatePopulationEntry, { trace: Trace; row: Record<string, unknown>; started: number }>();
  CandidatePopulationService.prototype.begin = function(fen) {
    const trace = current(), before = this.stats(), started = performance.now();
    const result = begin.call(this, fen), after = this.stats();
    if (trace) {
      const row: Record<string, unknown> = { fen, kind: result.kind === "started" ? "pending" : "failed", ms: performance.now() - started,
        activeMs: 0, advances: 0, longestStepMs: 0, completedAt: null, hitsDelta: after.hits - before.hits, missesDelta: after.misses - before.misses };
      trace.packets.push(row);
      if (result.kind === "started") pending.set(result.entry, { trace, row, started });
    }
    return result;
  };
  CandidatePopulationService.prototype.advance = function(this: CandidatePopulationService, ...args: Parameters<typeof advance>) {
    const observation = pending.get(args[0]), started = performance.now();
    const result = advance.apply(this, args), ms = performance.now() - started;
    if (observation) {
      observation.row.advances = Number(observation.row.advances) + 1;
      observation.row.activeMs = Number(observation.row.activeMs) + ms;
      observation.row.longestStepMs = Math.max(Number(observation.row.longestStepMs), ms);
      if (result.kind === "failed" || result.kind === "retired") {
        observation.row.kind = result.kind;
        observation.row.ms = performance.now() - observation.started;
        observation.row.completedAt = observation.trace.deps = performance.now();
        pending.delete(args[0]);
      }
    }
    return result;
  } as typeof advance;
  CandidatePopulationService.prototype.read = function(this: CandidatePopulationService, ...args: Parameters<typeof read>) {
    const result = read.apply(this, args), observation = pending.get(args[0]);
    if (observation && result.kind === "ready" && args[1] === "events_and_readings") {
      const receipt = result.receipt;
      if (!("packet" in receipt)) throw new Error("Full acquisition returned no packet");
      const { packet } = receipt;
      Object.assign(observation.row, { kind: "ready", ms: performance.now() - observation.started, completedAt: observation.trace.deps = performance.now(),
        id: packet.id, manifestDigest: packet.manifestDigest, compilerVersion: packet.compilerVersion, legalMoves: packet.legalMoves.length, candidates: packet.candidates.length });
      pending.delete(args[0]);
    }
    return result;
  } as typeof read;
  return () => { CandidatePopulationService.prototype.begin = begin; CandidatePopulationService.prototype.advance = advance; CandidatePopulationService.prototype.read = read; };
}
