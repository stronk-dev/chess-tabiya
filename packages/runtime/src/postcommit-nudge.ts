// rfc/module-registration.md §4.5 — Post-commit Nudge, the first production caller of the module
// layer at the post_commit timing. Shared source/witness helpers for the canonical module query;
// no separate raw-string packet API or presentation pipeline (D3851/D3862).

import { evidenceDigest, type DeclaredEvidence } from "./evidence-contract.js";
import type { GradeSide } from "./grade.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { localSemanticEventClosure, type StructuralSemanticEventOperands } from "./semantic-evidence.js";
import type { DrillRun, EvidencePayload, Node } from "./types.js";

function evaluationPacket(run: DrillRun, nodeId: string): EvidencePayload | undefined {
  const event = [...run.events].reverse().find((candidate) =>
    candidate.type === "evidence.attached" && candidate.data.nodeId === nodeId &&
    candidate.data.payload.kind === "eval" && candidate.data.payload.source === "engine_validated");
  if (event?.type !== "evidence.attached") return undefined;
  const { kind, source, values } = event.data.payload;
  return Object.freeze({ kind, source, values });
}

/** The accepted unchanged-king exclusion for the canonical query's evidence source. */
export function hasKingZoneWitness(evidence: DeclaredEvidence<unknown>): boolean {
  if (evidence.projection.id === "rules.structural.event.king_zone") {
    const event = evidence.payload as StructuralSemanticEventOperands;
    // Compare the observations, not their edge's FEN or move identity: every committed move
    // changes the latter even when both kings remain on exactly the same squares.
    return evidenceDigest(event.before) !== evidenceDigest(event.after);
  }
  if (evidence.projection.id === "rules.king.event.zone_state") {
    const event = evidence.payload as { readonly king: { readonly relocated: boolean }; readonly attackers: { readonly gained: readonly unknown[]; readonly lost: readonly unknown[] }; readonly defenders: { readonly gained: readonly unknown[]; readonly lost: readonly unknown[] }; readonly shelter: { readonly gained: readonly unknown[]; readonly lost: readonly unknown[] }; readonly escapes: { readonly gained: readonly unknown[]; readonly lost: readonly unknown[] } };
    return event.king.relocated || [event.attackers, event.defenders, event.shelter, event.escapes].some((change) => change.gained.length + change.lost.length > 0);
  }
  return true;
}

/** The evidence a production operation can seal for one committed edge today. */
export function postcommitEdgeEvidence(run: DrillRun, parent: Node, node: Node): readonly DeclaredEvidence<unknown>[] {
  const events = localSemanticEventClosure(parent.fen, node.moveUci!, node.fen).events.map((event) => event.evidence).filter(hasKingZoneWitness);
  const before = evaluationPacket(run, parent.id);
  const after = evaluationPacket(run, node.id);
  if (before === undefined || after === undefined) return Object.freeze(events);
  const mover: GradeSide = parent.fen.split(" ")[1] === "b" ? "black" : "white";
  const graded = invokeEvidenceValueRoute("derived.grade.move_quality@1", {
    before: invokeEvidenceValueRoute("live.stockfish.eval@1", { packet: before }),
    after: invokeEvidenceValueRoute("live.stockfish.eval@1", { packet: after }),
    mover, context: "drill",
  });
  return Object.freeze([...(graded.kind === "available" ? graded.value : []), ...events]);
}
