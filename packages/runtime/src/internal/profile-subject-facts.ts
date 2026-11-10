// Accepted longitudinal-store A.2: fixed worker-only machine consumption; no learner selection.
import { PRIMARY_EVIDENCE_MANIFEST } from "../evidence-catalog.js";
import { compileEvidenceConsumerExecution } from "../evidence-binding-execution.js";
import { evidenceForConsumer, type CompiledEvidenceManifest, type DeclaredEvidence } from "../evidence-contract.js";
import { PROFILE_SUBJECT_SOURCE_REFS, PROFILE_PREVALENCE_SOURCE_REFS } from "../profile-subject-sources.js";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation } from "../candidate-population.js";
import { SUBJECT_OUTCOME_FAMILIES } from "../semantic-subject-types.js";
import { NATIVE_SUBJECT_SOURCE_REFS } from "../semantic-native-subject-types.js";
import { invokeEvidenceValueRoute } from "./evidence-value-routes.js";
import { nativeSubjectIncidences } from "./longitudinal-native-incidence.js";
import { readCandidateUnavailableSources } from "../semantic-source-availability.js";
import { subjectRelationIncidences } from "./longitudinal-subject-relations.js";
const localRefs: ReadonlySet<string> = new Set([...NATIVE_SUBJECT_SOURCE_REFS, ...PROFILE_PREVALENCE_SOURCE_REFS]);
const consumer = Object.freeze({ id: "profile.subject_observations", version: 1 });
export function preflightProfileSubjectFacts(manifest: CompiledEvidenceManifest = PRIMARY_EVIDENCE_MANIFEST): void {
  const fail = (): never => { throw new TypeError("Profile subject facts requires its exact complete machine binding"); };
  const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  const declarations = manifest.consumers.filter(r => r.id === consumer.id && r.version === 1);
  const metadata = (r: typeof declarations[number] | typeof manifest.bindings[number], answers: readonly string[]) =>
    same(r.forms, ["machine_condition"]) && same(r.answerContent, answers) && same(r.roles, ["operator"])
    && same(r.timing, ["analysis"]) && same(r.sessions, ["pack", "position", "imported"])
    && r.latency.mode === "sync" && r.latency.maxMs === null && r.budget.maxFacts === null && r.budget.maxForms === null;
  if (declarations.length !== 1 || declarations[0]!.disposition !== undefined || declarations[0]!.implementation !== "consumeProfileSubjectFacts"
    || declarations[0]!.providerOff !== "available" || !metadata(declarations[0]!, ["fact", "threat"])
    || !same(declarations[0]!.accepts.map(r => `${r.id}@${r.version}`), PROFILE_SUBJECT_SOURCE_REFS)) return fail();
  const bindings = compileEvidenceConsumerExecution(manifest, consumer).bindings;
  if (bindings.length !== PROFILE_SUBJECT_SOURCE_REFS.length) return fail();
  for (const [index, source] of PROFILE_SUBJECT_SOURCE_REFS.entries()) {
    const matches = bindings.filter(r => r.binding.adapter.id === `adapter.profile.subject_observations.${index + 1}`);
    if (matches.length !== 1) return fail();
    const { binding, sourceAbsence } = matches[0]!;
    const projection = manifest.projections.find(p => `${p.id}@${p.version}` === source);
    const answer = source === "rules.tactic.event.double_attack@1" ? "threat" : "fact";
    if (projection === undefined || !projection.forms.includes("machine_condition") || !projection.answerContent.includes(answer) || `${binding.projection.id}@${binding.projection.version}` !== source
      || binding.producer.id !== projection.producer.id || binding.producer.version !== projection.producer.version
      || binding.consumer.id !== consumer.id || binding.consumer.version !== 1 || binding.adapter.version !== 1
      || sourceAbsence !== null || !metadata(binding, [answer])) return fail();
  }
}
function admitProfileSubjectValues(values: readonly DeclaredEvidence<unknown>[]): void {
  const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer, values);
  if (view.items.length !== values.length || view.items.some((v, i) => v !== values[i])) throw new TypeError("Profile subject machine view dropped or replaced an original value");
}

/** Finite unowned calculation. Only the server reducer binds rows to an authentic store cut.
 * One call owns one WIDE graph and releases it on return; no table or original result escapes. */
export function collectProfileSubjectPopulation(beforeFen: string, moveUci: string) {
  const compiled = compileCandidatePopulation({ beforeFen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (compiled.kind !== "ready") throw new TypeError("Subject consumer cannot acquire its original complete legal population: " + JSON.stringify(compiled.error));
  const receipt = compiled.receipt, unavailable = readCandidateUnavailableSources(receipt), native = nativeSubjectIncidences(receipt, moveUci);
  const conditions = SUBJECT_OUTCOME_FAMILIES.map(family => {
    const result = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt, moveUci });
    const incidence = subjectRelationIncidences(family, result);
    if (result.kind === "available") admitProfileSubjectValues(result.values);
    const unknown = unavailable.some(value => value.projection.id === `derived.semantic_avoidance.${family}` && value.projection.version === 2);
    if ((incidence.kind === "unavailable") !== unknown) throw new TypeError("Condition availability contradicts its original required sources");
    return incidence;
  });
  admitProfileSubjectValues(receipt.packet.candidates.flatMap(candidate => candidate.events
    .filter(e => localRefs.has(`${e.projection.id}@${e.projection.version}`)).map(e => e.evidence)));
  if (conditions.some(r => r.kind === "available" && (r.actor !== native.actor || r.edge.beforeFen !== native.edge.beforeFen
    || r.edge.moveUci !== native.edge.moveUci || r.edge.afterFen !== native.edge.afterFen))) throw new TypeError("Subject populations cross their original actor or edge");
  const prevalence: { projectionId: string; projectionVersion: number; sign: import("../evidence-contract.js").SemanticEventSign;
    occurred: boolean; legalAlternatives: number; matchingAlternatives: number }[] = [];
  const played = receipt.packet.candidates.find(c => c.moveUci === native.edge.moveUci)!;
  for (const ref of PROFILE_PREVALENCE_SOURCE_REFS) {
    if (unavailable.some(value => `${value.projection.id}@${value.projection.version}` === ref)) continue;
    const at = ref.lastIndexOf("@"), projectionId = ref.slice(0, at), projectionVersion = Number(ref.slice(at + 1));
    const declaration = PRIMARY_EVIDENCE_MANIFEST.semanticEvents.find(e => `${e.projection.id}@${e.projection.version}` === ref);
    if (declaration === undefined) throw new TypeError("Prevalence source lacks exact sign declaration");
    for (const sign of declaration.allowedSigns) {
      const exhibits = (c: typeof played) => c.events.some(e => e.projection.id === projectionId && e.projection.version === projectionVersion && e.sign === sign);
      const matching = receipt.packet.candidates.filter(exhibits).length;
      if (matching === 0 || matching === receipt.packet.candidates.length) continue;
      const occurred = exhibits(played);
      prevalence.push(Object.freeze({ projectionId, projectionVersion, sign, occurred,
        legalAlternatives: receipt.packet.candidates.length - 1, matchingAlternatives: matching - Number(occurred) }));
    }
  }
  return Object.freeze({ actor: native.actor, edge: native.edge, legalAlternatives: receipt.packet.candidates.length - 1, unavailable,
    native: native.rows, conditions: Object.freeze(conditions.flatMap(r => r.kind === "available" ? [...r.rows] : [])), prevalence: Object.freeze(prevalence) });
}
