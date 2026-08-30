// DISPOSABLE author-artifact generator — D2120-D2126. Not production code.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { AUTHOR_MODULE_ACCEPTS, operationForProjection, STAGE_BY_PRODUCER } from "./module-plan-fixture.js";

const awaiting = new Set(["derived.explorer.population_summary", "pack.authored.classifier"]);
const projectionById = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((row) => [row.id, row]));
const producerById = new Map(PRIMARY_EVIDENCE_MANIFEST.producers.map((row) => [row.id, row]));
const ref = (id: string, version = 1) => ({ id, version });
const canonical = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const digest = (value: unknown) => `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`;

const timings: Record<string, readonly string[]> = {
  sight_on_request: ["precommit", "postcommit"], blunder_prevention: ["at_commit"],
  threat_radar: ["precommit", "postcommit"], postcommit_nudge: ["postcommit"],
  structure_nudge: ["postcommit"], theory_breadcrumb: ["postcommit"],
  compare_coach: ["checkpoint", "attempt_end", "review", "analysis"],
  review_map: ["review", "analysis"], full_inspector: ["review", "analysis"],
};
const roles: Record<string, readonly string[]> = {
  sight_on_request: ["learner", "host"], blunder_prevention: ["learner", "host"],
  threat_radar: ["learner", "host"], postcommit_nudge: ["learner", "host"],
  structure_nudge: ["learner", "host"], theory_breadcrumb: ["learner", "host"],
  compare_coach: ["learner", "host"], review_map: ["learner", "host", "participant", "spectator"],
  full_inspector: ["learner", "host"],
};
const commonSessions = ["pack", "position", "imported", "stream", "academy", "onramp", "campaign"];
const sessions: Record<string, readonly string[]> = {
  sight_on_request: commonSessions, blunder_prevention: ["position"], threat_radar: commonSessions,
  postcommit_nudge: commonSessions, structure_nudge: commonSessions, theory_breadcrumb: commonSessions,
  compare_coach: commonSessions, review_map: ["pack", "position", "imported", "stream", "academy", "campaign"],
  full_inspector: ["pack", "position", "imported", "stream", "campaign"],
};
const moduleForms: Record<string, readonly string[]> = {
  sight_on_request: ["sentence", "panel", "lit_squares", "piece_halo", "arrows"],
  blunder_prevention: ["sentence", "panel", "lit_squares", "piece_halo", "arrows"],
  threat_radar: ["sentence", "panel", "lit_squares", "piece_halo", "arrows"],
  postcommit_nudge: ["sentence", "panel", "lit_squares", "piece_halo", "arrows"],
  structure_nudge: ["panel", "timeline_marker"], theory_breadcrumb: ["sentence", "panel"],
  compare_coach: ["sentence", "panel", "arrows"],
  review_map: ["timeline_marker", "panel", "sentence", "lit_squares", "piece_halo", "arrows"],
  full_inspector: ["panel", "sentence", "lit_squares", "piece_halo", "arrows"],
};
const maxFacts: Record<string, number> = {
  sight_on_request: 1, blunder_prevention: 1, threat_radar: 3, postcommit_nudge: 1,
  structure_nudge: 1, theory_breadcrumb: 1, compare_coach: 2, review_map: 3, full_inspector: 20,
};
const stageSubject: Record<string, string> = {
  position_local: "position", edge_local: "edge", position_or_edge_local: "edge",
  catalogue_local: "catalogue", pack_local: "pack", recorded_local: "position",
  run_local: "run_prefix", provider_optional: "position", derived_after_inputs: "edge",
};
const familyByProducer = (id: string) => id.startsWith("live.stockfish") ? "stockfish"
  : id.startsWith("live.syzygy") ? "syzygy" : id.startsWith("human.maia") ? "maia"
  : id.startsWith("human.explorer") ? "explorer" : id.startsWith("recorded.") || id === "run.record" ? "recorded_run"
  : id.startsWith("pack.") || id.startsWith("theory.") ? "authored_theory"
  : id.startsWith("derived.") ? "derived" : "local_rules";

const pairs = Object.entries(AUTHOR_MODULE_ACCEPTS).flatMap(([module, ids]) =>
  ids.filter((id) => !awaiting.has(id)).map((id) => ({ module, projection: id })));
const compiledIds = [...new Set(pairs.map((row) => row.projection))].sort();

const executionRows = compiledIds.map((id) => {
  const projection = projectionById.get(id);
  if (projection === undefined) throw new TypeError(`missing compiled projection ${id}`);
  const producer = producerById.get(projection.producer.id);
  if (producer === undefined) throw new TypeError(`missing producer ${projection.producer.id}`);
  const stage = STAGE_BY_PRODUCER[producer.id as keyof typeof STAGE_BY_PRODUCER];
  const operation = operationForProjection(id, producer.id);
  if (stage === undefined) throw new TypeError(`missing execution stage ${producer.id}`);
  const derivation = stage !== "derived_after_inputs" ? null : projection.derivation?.inputs !== undefined
    ? { kind: "all", inputs: projection.derivation.inputs, sameSubject: true }
    : projection.derivation?.anyOf !== undefined
      ? { kind: "any", alternatives: projection.derivation.anyOf, sameSubject: true }
      : projection.dependsOn.length > 0
        ? { kind: "all", inputs: projection.dependsOn, sameSubject: true }
        : (() => { throw new TypeError(`derived projection has no declared inputs: ${id}`); })();
  return {
    projection: ref(projection.id, projection.version), producer: projection.producer, stage,
    subjectKind: stageSubject[stage], sourceFamily: familyByProducer(producer.id),
    operation: { source: operation[0], symbol: operation[1] }, derivation,
  };
});

const bindingRows = pairs.map(({ module, projection: projectionId }) => {
  const projection = projectionById.get(projectionId)!;
  const producer = producerById.get(projection.producer.id)!;
  const forms = projection.forms.filter((form) => moduleForms[module]!.includes(form));
  if (forms.length === 0) throw new TypeError(`empty form intersection: ${module}/${projectionId}`);
  const latencyMode = producer.latency;
  return {
    producer: projection.producer, projection: ref(projection.id, projection.version),
    consumer: ref(`module.${module}`), adapter: ref(`presentation.module.${module}.${projection.id}`),
    timing: timings[module], roles: roles[module], sessions: sessions[module], forms,
    answerContent: projection.answerContent,
    latency: { mode: latencyMode, maxMs: latencyMode === "sync" ? 50 : latencyMode === "interactive" ? 500 : null },
    budget: { maxFacts: maxFacts[module], maxForms: forms.length },
  };
}).sort((left, right) => `${left.consumer.id}\0${left.projection.id}`.localeCompare(`${right.consumer.id}\0${right.projection.id}`));

const execution = { schemaVersion: 1, population: executionRows.length, awaiting: [...awaiting].sort(), rows: executionRows };
const bindings = { schemaVersion: 1, population: bindingRows.length, rows: bindingRows };
writeFileSync("rfc/contracts/module-execution-plan-v1.json", canonical({ ...execution, digest: digest(execution) }));
writeFileSync("rfc/contracts/module-binding-plan-v1.json", canonical({ ...bindings, digest: digest(bindings) }));
console.log(`module-registration author artifacts: ${executionRows.length} execution rows / ${bindingRows.length} bindings`);
