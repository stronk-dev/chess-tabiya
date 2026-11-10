// Accepted profile-choice-facts: one closed machine reduction over original complete populations.
import { PRIMARY_EVIDENCE_MANIFEST } from "../evidence-catalog.js";
import { compileEvidenceConsumerExecution } from "../evidence-binding-execution.js";
import { evidenceForConsumer, type CompiledEvidenceManifest, type DeclaredEvidence } from "../evidence-contract.js";
import { readFoundationClaimedChoiceDecision, type FoundationClaimedChoiceDecision } from "../recorded-foundation-source.js";
import { invokeEvidenceValueRoute, originalRecordedStyleValueInput } from "./evidence-value-routes.js";

const consumer = Object.freeze({ id: "profile.choice_facts", version: 1 });
const ids = ["legal_moves", "candidate_role", "pawn_extended_center_destination", "early_queen_move"] as const;
export function preflightProfileChoiceFacts(manifest: CompiledEvidenceManifest = PRIMARY_EVIDENCE_MANIFEST): void {
  const fail = (): never => { throw new TypeError("Profile choice facts requires its exact complete machine binding"); };
  const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  const declarations = manifest.consumers.filter(row => row.id === consumer.id && row.version === 1);
  const metadata = (row: typeof declarations[number] | typeof manifest.bindings[number]) =>
    same(row.forms, ["machine_condition"]) && same(row.answerContent, ["fact"]) && same(row.roles, ["operator"])
    && same(row.timing, ["analysis"]) && same(row.sessions, ["pack", "position", "imported"])
    && row.latency.mode === "background" && row.latency.maxMs === 120000
    && row.budget.maxFacts === null && row.budget.maxForms === 1;
  if (declarations.length !== 1 || declarations[0]!.disposition !== undefined
    || declarations[0]!.implementation !== "consumeProfileChoiceFacts" || declarations[0]!.providerOff !== "available"
    || !metadata(declarations[0]!) || !same(declarations[0]!.accepts.map(ref => `${ref.id}@${ref.version}`), ids.map(id => `rules.mobility.reading.${id}@1`))) return fail();
  const bindings = compileEvidenceConsumerExecution(manifest, consumer).bindings;
  if (bindings.length !== ids.length || bindings.some(({ binding, sourceAbsence }, index) =>
    binding.projection.id !== `rules.mobility.reading.${ids[index]}` || binding.projection.version !== 1
    || binding.producer.id !== "rules.mobility" || binding.producer.version !== 1
    || binding.consumer.id !== consumer.id || binding.consumer.version !== 1
    || binding.adapter.id !== `adapter.profile.choice_facts.${index + 1}` || binding.adapter.version !== 1
    || sourceAbsence !== null || !metadata(binding))) return fail();
}
function admit(values: readonly DeclaredEvidence<unknown>[]): void {
  const admitted = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer, values);
  if (admitted.items.length !== values.length || admitted.items.some((value, index) => value !== values[index])) throw new TypeError("Choice source was dropped or crossed by its machine view");
}
const available = <T>(value: { readonly kind: "available"; readonly value: T } | { readonly kind: "unavailable"; readonly reason: string }): T => {
  if (value.kind !== "available") throw new TypeError("Unexpected choice source absence: " + value.reason); return value.value;
};

export interface ProfileChoicePopulation {
  readonly legalUcis: readonly string[];
  readonly counts: Readonly<{ pawn: number; centerPawn: number; queen: number }>;
  readonly chosen: Readonly<{ pawn: boolean; centerPawn: boolean; queen: boolean }>;
}

export function collectProfileChoicePopulation(decision: FoundationClaimedChoiceDecision, checkpoint?: () => void): ProfileChoicePopulation {
  preflightProfileChoiceFacts();
  const authority = readFoundationClaimedChoiceDecision(decision).authority;
  const beforeFen = authority.selected.fen;
  const position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: beforeFen });
  if (position.payload.fen !== beforeFen) throw new TypeError("Choice legal map crosses its original BEFORE");
  admit([position]);
  const members = position.payload.pieces.flatMap(piece => piece.moves).sort((a, b) => a.uci.localeCompare(b.uci));
  if (members.length === 0 || new Set(members.map(member => member.uci)).size !== members.length
    || members.filter(member => member.uci === authority.moveUci).length !== 1) throw new TypeError("Choice requires a complete unique population and one original chosen member");
  const counts = { pawn: 0, centerPawn: 0, queen: 0 };
  let chosen: ProfileChoicePopulation["chosen"] | undefined;
  for (const member of members) {
    checkpoint?.(); readFoundationClaimedChoiceDecision(decision);
    const role = available(invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position, moveUci: member.uci }));
    const original = originalRecordedStyleValueInput(role);
    if (original.kind !== "candidate" || original.position !== position || original.candidate !== role
      || role.payload.moveUci !== member.uci || role.payload.fen !== beforeFen) throw new TypeError("Choice role lost its identical original legal member");
    const center = available(invokeEvidenceValueRoute("rules.mobility.reading.pawn_extended_center_destination@1", { source: role }));
    const early = available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate: role }));
    for (const [values, route] of [[center, "rules.mobility.reading.pawn_extended_center_destination@1"], [early, "rules.mobility.reading.early_queen_move@1"]] as const) {
      for (const value of values) {
        const input = originalRecordedStyleValueInput(value);
        if (input.kind !== "candidate" || input.route !== route || input.position !== position || input.candidate !== role
          || input.fen !== beforeFen || route === "rules.mobility.reading.early_queen_move@1" && input.decision !== decision) throw new TypeError("Choice derivation crosses its original source inputs");
      }
    }
    if (center.length > 1 || early.length > 1) throw new TypeError("Choice source returned duplicate membership");
    const flags = { pawn: role.payload.sourcePiece.role === "pawn", centerPawn: center.length === 1,
      queen: role.payload.sourcePiece.role === "queen" };
    if (flags.centerPawn && !flags.pawn || early.length !== Number(flags.queen && authority.selected.sourcePly < 16)) throw new TypeError("Choice source violates its fixed trait convention");
    admit([role, ...center, ...early]);
    for (const key of ["pawn", "centerPawn", "queen"] as const) counts[key] += Number(flags[key]);
    if (member.uci === authority.moveUci) chosen = Object.freeze(flags);
    readFoundationClaimedChoiceDecision(decision);
  }
  if (chosen === undefined) throw new TypeError("Choice lost its original selected member");
  return Object.freeze({ legalUcis: Object.freeze(members.map(member => member.uci)), counts: Object.freeze(counts), chosen });
}
