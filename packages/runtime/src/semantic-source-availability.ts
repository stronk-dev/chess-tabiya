// Accepted source-local-evidence-availability §§1–2. Read ORIGINAL owned failures and vectors;
// this helper neither collects positions nor mints evidence, receipts or selection authority.
import { readCandidateFoundationSources, type CandidatePopulationReceipt, type CandidateWideScope } from "./candidate-population.js";
import type { LegacyUnavailableKey, SourceAvailabilityMember, UnavailableSemanticSource } from "./semantic-source-availability-types.js";

export function readCandidateUnavailableSources(receipt: CandidatePopulationReceipt<CandidateWideScope>): readonly UnavailableSemanticSource[] {
  const frame = readCandidateFoundationSources(receipt);
  const collectors = new Map<LegacyUnavailableKey, Readonly<{ kind: "child"; moveUci: string }>[]>();
  for (const [index, { row }] of frame.candidates.entries()) {
    const outcomes = receipt.candidateInputs[index]!.collectorOutcomes;
    if (outcomes.length !== row.abstentions.length) throw new TypeError("Unaccounted candidate collector outcome");
    const seen = new Set<string>();
    for (const outcome of outcomes) {
      const projection = outcome.projection;
      if ((projection !== "rules.tactic.event.loose_piece@1" && projection !== "derived.tactic.defender_exposure@2")
        || outcome.result.kind !== "unavailable" || outcome.result.reason !== "invalid_turn_clone") throw new TypeError("Unknown candidate source availability dependency");
      if (outcome.moveUci !== row.moveUci || seen.has(projection)
        || row.abstentions.filter(value => value.projection === projection && value.reason === outcome.result.reason).length !== 1
        || row.events.some(event => `${event.projection.id}@${event.projection.version}` === projection)) throw new TypeError("Contradictory candidate collector availability");
      seen.add(projection);
      const members = collectors.get(projection) ?? [];
      members.push(Object.freeze({ kind: "child", moveUci: row.moveUci }));
      collectors.set(projection, members);
    }
  }
  const unavailable: UnavailableSemanticSource[] = [];
  for (const [key, rawMembers] of collectors) {
    const members = Object.freeze(rawMembers);
    if (key === "rules.tactic.event.loose_piece@1") {
      const projection = Object.freeze({ id: "rules.tactic.event.loose_piece", version: 1 } as const);
      unavailable.push(Object.freeze({ projection, cause: Object.freeze({ kind: "candidate_collector", projection } as const), reason: "invalid_turn_clone", members }));
    } else {
      const projection = Object.freeze({ id: "derived.tactic.defender_exposure", version: 2 } as const);
      unavailable.push(Object.freeze({ projection, cause: Object.freeze({ kind: "candidate_collector", projection } as const), reason: "invalid_turn_clone", members }));
    }
  }
  const riskMembers: SourceAvailabilityMember[] = [];
  const positions = [{ member: Object.freeze({ kind: "root" } as const), position: frame.root },
    ...frame.candidates.map(({ row, position }) => ({ member: Object.freeze({ kind: "child", moveUci: row.moveUci } as const), position }))];
  for (const { member, position } of positions) if (position.risk.kind === "unavailable") {
    if (position.risk.reason !== "invalid_turn_clone") throw new TypeError("Unknown required risk-source failure");
    riskMembers.push(member);
  }
  if (riskMembers.length > 0) unavailable.push(Object.freeze({
    projection: Object.freeze({ id: "derived.semantic_avoidance.loose_piece", version: 2 } as const),
    cause: Object.freeze({ kind: "required_total", projection: Object.freeze({ id: "rules.tactic.reading.mover_piece_risk", version: 1 } as const) } as const),
    reason: "invalid_turn_clone", members: Object.freeze(riskMembers),
  }));
  return Object.freeze(unavailable.sort((a, b) => a.projection.id.localeCompare(b.projection.id) || a.projection.version - b.projection.version));
}
