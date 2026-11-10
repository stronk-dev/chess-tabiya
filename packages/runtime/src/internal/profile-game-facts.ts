// Finite package-owned factory adapter for profile-game-facts. No rendering or actor inference.
import { PRIMARY_EVIDENCE_MANIFEST as EVIDENCE_MANIFEST } from "../evidence-catalog.js";
import { compileEvidenceConsumerExecution } from "../evidence-binding-execution.js";
import { evidenceForConsumer, type DeclaredEvidence, type CompiledEvidenceManifest } from "../evidence-contract.js";
import { readFirstDecisionCastling } from "../foundation-style-sources.js";
import { readFoundationRecordedPrefix } from "../recorded-foundation-source.js";
import type { FoundationRecordedPrefix } from "../recorded-foundation-source.js";
import { invokeEvidenceValueRoute, originalRecordedStyleValueInput } from "./evidence-value-routes.js";
const consumer = Object.freeze({ id: "profile.game_facts", version: 1 });
export function preflightProfileGameFacts(manifest: CompiledEvidenceManifest = EVIDENCE_MANIFEST): void {
  const fail = (): never => { throw new TypeError("Profile game facts requires its complete exact machine consumer binding"); };
  const equal = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  const refs = ["rules.structural.reading.fianchetto_setup", "rules.structural.reading.fianchetto_knight_screen", "run.record.castling_eligibility"];
  const declaration = manifest.consumers.filter(row => row.id === consumer.id && row.version === 1);
  const metadata = (row: typeof declaration[number] | typeof manifest.bindings[number]) =>
    equal(row.forms, ["machine_condition"]) && equal(row.answerContent, ["fact"])
    && equal(row.timing, ["analysis"]) && equal(row.roles, ["operator"])
    && equal(row.sessions, ["pack", "position", "imported"])
    && row.latency.mode === "background" && row.latency.maxMs === 120000
    && row.budget.maxFacts === 3 && row.budget.maxForms === 1;
  if (declaration.length !== 1 || declaration[0]!.disposition !== undefined
    || declaration[0]!.implementation !== "consumeProfileGameFacts" || declaration[0]!.providerOff !== "available"
    || !metadata(declaration[0]!) || !equal(declaration[0]!.accepts.map(ref => `${ref.id}@${ref.version}`), refs.map(id => `${id}@1`))) return fail();
  const bindings = compileEvidenceConsumerExecution(manifest, consumer).bindings;
  if (bindings.length !== 3 || bindings.some(({ binding, sourceAbsence }, index) => {
    const id = refs[index]!;
    return binding.projection.id !== id || binding.projection.version !== 1
      || binding.producer.id !== (index === 2 ? "run.record" : "rules.structural") || binding.producer.version !== 1
      || binding.consumer.id !== consumer.id || binding.consumer.version !== 1
      || binding.adapter.id !== `adapter.profile.game_facts.${index + 1}` || binding.adapter.version !== 1
      || sourceAbsence !== null || !metadata(binding);
  })) return fail();
}
function admit(values: readonly DeclaredEvidence<unknown>[]): void {
  const view = evidenceForConsumer(EVIDENCE_MANIFEST, consumer, values);
  if (view.items.length !== values.length || view.items.some((value, index) => value !== values[index])) throw new TypeError("Profile game facts dropped or crossed an original source");
}
export function collectProfileGameConfiguration(fen: string) {
  const setup = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen });
  const screen = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_knight_screen@1", { source: setup });
  const setupInput = originalRecordedStyleValueInput(setup);
  if (setupInput.kind !== "position" || setupInput.route !== "rules.structural.reading.fianchetto_setup@1" || setupInput.fen !== fen || setupInput.setup !== setup) throw new TypeError("Profile setup crosses its original position invocation");
  if (screen.kind !== "available") throw new TypeError("Unexpected fianchetto screen absence");
  const screenInput = originalRecordedStyleValueInput(screen.value);
  if (screenInput.kind !== "position" || screenInput.route !== "rules.structural.reading.fianchetto_knight_screen@1" || screenInput.fen !== fen || screenInput.setup !== setup) throw new TypeError("Profile screen crosses its identical original setup");
  admit([setup, screen.value]);
  return Object.freeze({ setup: setup.payload, screen: screen.value.payload });
}
export function collectProfileGameRights(prefix: FoundationRecordedPrefix) {
  const result = invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix });
  if (result.kind === "available") {
    const original = originalRecordedStyleValueInput(result.value);
    if (original.kind !== "baseline" || original.route !== "run.record.castling_eligibility@1" || original.prefix !== prefix) throw new TypeError("Profile rights cross their identical original prefix");
    admit([result.value]);
  }
  else if (result.reason !== "first_decision_not_represented" || readFirstDecisionCastling(readFoundationRecordedPrefix(prefix).authority) !== undefined) throw new TypeError("Unexpected or crossed castling source absence");
  return result;
}
