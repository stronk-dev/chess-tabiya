import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { commitMove, createRun, type DrillRun, type PolicyConfig } from "@chess-tabiya/runtime";
import { PackRegistry, type PackRecord } from "./pack-registry.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";

export const at = "2026-08-12T12:30:00.000Z";
export const policyConfig: PolicyConfig = {
  seedMode: "fixed",
  locus: { executedAt: "server", engineIds: [], modelIds: [] },
};
export async function registered(document: DrillPackDefinition): Promise<PackRecord> {
  return (
    await PackRegistry.fromDocuments([{ source: "authored-feedback-test", value: withDerivedRequires(document) }])
  ).required(document.id);
}

export function newRun(pack: PackRecord, id: string): DrillRun {
  return createRun({
    id,
    session: {
      kind: "pack",
      packId: pack.document.id,
      packDigest: pack.digest,
      start: {
        fen: pack.document.start.fen,
        side: pack.document.start.side === "black" ? "black" : "white",
      },
      feedbackPolicy: pack.feedbackPolicy,
      opponentPolicy: { mode: "human_common" },
    },
    sessionDigest: pack.digest,
    policyConfig,
    seed: 23,
    createdAt: at,
  });
}

export function play(run: DrillRun, moves: readonly string[]): DrillRun {
  for (const move of moves) run = commitMove(run, move, { at }).run;
  return run;
}
