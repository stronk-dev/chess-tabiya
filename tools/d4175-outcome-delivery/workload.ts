// DISPOSABLE actual-source workload helpers; no CLI side effects or authority issuer.
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { assertCandidatePopulationReceipt, type CandidatePopulationReceipt, type CandidateWideScope } from "../../packages/runtime/src/candidate-population.js";
import { subjectOutcomeSemanticEvents, type SemanticEvidenceEvent } from "../../packages/runtime/src/semantic-evidence.js";
import { SUBJECT_OUTCOME_FAMILIES, type SubjectOutcomeFamily } from "../../packages/runtime/src/semantic-subject-types.js";
import { admitValidatedSemanticInstance } from "../../packages/runtime/src/semantic-validation-registry.js";
import { importedPopulation } from "../research-chess/populations.js";

export interface Position { readonly id: string; readonly fen: string; readonly move: string | null; readonly source: string }
const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
export const LITERAL_POSITIONS: readonly Position[] = [
  { id: "start.white", fen: `${start} w KQkq - 0 1`, move: "e2e4", source: "semantic-validation-control-outcome-sources.ts" },
  { id: "start.black", fen: `${start} b KQkq - 0 1`, move: "e7e5", source: "semantic-validation-control-outcome-sources.ts" },
  { id: "bishop-knight.white", fen: "7k/8/8/3q4/8/5N2/6B1/7K w - - 0 1", move: "f3h4", source: "semantic-validation-control-outcome-sources.ts" },
  { id: "bishop-knight.black", fen: "7k/6b1/5n2/8/3Q4/8/8/7K b - - 0 1", move: "f6h5", source: "semantic-validation-control-outcome-sources.ts" },
  { id: "ep.white", fen: "7k/8/8/3pP3/8/8/8/7K w - d6 0 1", move: "e5d6", source: "semantic-validation-count-population-sources.ts" },
  { id: "ep.black", fen: "7k/8/8/8/3Pp3/8/8/7K b - d3 0 1", move: "e4d3", source: "semantic-validation-count-population-sources.ts" },
  { id: "promotion.white", fen: "8/P7/7k/8/8/8/8/7K w - - 0 1", move: "a7a8q", source: "semantic-validation-count-population-sources.ts" },
  { id: "promotion.black", fen: "7k/8/8/8/8/7K/p7/8 b - - 0 1", move: "a2a1q", source: "semantic-validation-count-population-sources.ts" },
  { id: "forced.white", fen: "8/8/8/8/8/1r6/2k5/K7 w - - 0 1", move: "a1a2", source: "semantic-subject-population.test.ts" },
  { id: "forced.black", fen: "k7/2K5/1R6/8/8/8/8/8 b - - 0 1", move: "a8a7", source: "vertical/color mirror of forced.white" },
  { id: "unavailable-risk.white", fen: "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", move: "e1e2", source: "semantic-subject-population.test.ts" },
  { id: "unavailable-risk.black", fen: "4k3/4R3/8/8/8/8/8/4K3 b - - 0 1", move: "e8e7", source: "vertical/color mirror of unavailable-risk.white" },
  { id: "castle.white", fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", move: "e1h1", source: "standard board, original rook-square move convention" },
  { id: "castle.black", fen: "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1", move: "e8h8", source: "standard board, original rook-square move convention" },
  { id: "terminal.checkmate", fen: "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1", move: null, source: "literal legal-move boundary" },
  { id: "terminal.stalemate", fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1", move: null, source: "literal legal-move boundary" },
];

export function positions(smoke: boolean): readonly Position[] {
  if (smoke) return [LITERAL_POSITIONS[0]!, LITERAL_POSITIONS[8]!, LITERAL_POSITIONS[10]!, LITERAL_POSITIONS[14]!];
  const games = importedPopulation(resolve("tools/r2-selection-harness/imported-sample.pgn")).paths.filter(path => path.length >= 41);
  assert(games.length >= 9, "The existing imported fixture must supply nine complete games");
  const sampled = Array.from({ length: 9 }, (_, i) => {
    const game = games[Math.floor(i * (games.length - 1) / 8)]!, ply = [12, 24, 40][i % 3]!;
    return [game[ply - 1]!, game[ply]!].map(row => ({ id: `imported.${i}.${row.id}`, fen: row.parentFen,
      move: row.uci, source: `tools/r2-selection-harness/imported-sample.pgn:${row.id}` }));
  }).flat();
  return [...LITERAL_POSITIONS, ...sampled];
}

export function reviewPositions(): readonly Position[] {
  const game = importedPopulation(resolve("tools/r2-selection-harness/imported-sample.pgn")).paths.find(path => path.length >= 41);
  assert(game);
  return game.slice(8, 40).map(row => ({ id: `review-page.${row.id}`, fen: row.parentFen, move: row.uci,
    source: `tools/r2-selection-harness/imported-sample.pgn:${row.id}` }));
}

export type Receipt = CandidatePopulationReceipt<CandidateWideScope>;
export interface Family { readonly family: SubjectOutcomeFamily; readonly kind: "available" | "unavailable"; readonly events: number; readonly sourceMs: number; readonly admissionMs: number }
export function assertWarmReuse(original: Receipt, cached: Receipt): void {
  assert.strictEqual(cached, original, "Repeated consumers must receive the ORIGINAL shared receipt");
}
export function assertRepeatedSources(before: readonly SemanticEvidenceEvent[], after: readonly SemanticEvidenceEvent[]): void {
  assert.deepEqual(after.map(event => event.operands), before.map(event => event.operands));
  after.forEach((event, at) => {
    assert.equal(event.derivationInputs.length, before[at]!.derivationInputs.length, "Complete prerequisite vector required");
    event.derivationInputs.forEach((input, i) => assert.strictEqual(input, before[at]!.derivationInputs[i]));
  });
}
export function assertWide(receipt: CandidatePopulationReceipt): asserts receipt is Receipt {
  assertCandidatePopulationReceipt(receipt);
  assert.equal(receipt.packet.scope.events, true); assert.equal(receipt.packet.scope.readings, true);
  assert.equal(receipt.selectedMember, "events_and_readings");
}
export function collect(receipt: Receipt, move: string): { readonly families: readonly Family[]; readonly events: readonly SemanticEvidenceEvent[] } {
  const events: SemanticEvidenceEvent[] = [];
  const families = SUBJECT_OUTCOME_FAMILIES.map(family => {
    const began = performance.now(), result = subjectOutcomeSemanticEvents(PRIMARY_EVIDENCE_MANIFEST, family, receipt, move), sourceMs = performance.now() - began;
    const admissionStart = performance.now();
    if (result.kind === "available") for (const event of result.events) {
      assert.equal(admitValidatedSemanticInstance("event", event.evidence).kind, "admitted", `Exact ${family} source must qualify`);
      events.push(event);
    }
    return { family, kind: result.kind, events: result.kind === "available" ? result.events.length : 0,
      sourceMs, admissionMs: performance.now() - admissionStart };
  });
  return { families, events };
}
