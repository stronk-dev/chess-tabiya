// Accepted longitudinal-store A.2. Additive literal row storage; no collection/publication issuer.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { parseLongitudinalSubjectObservationRow, parseLongitudinalSubjectEvaluationRow, type LongitudinalSubjectEvaluationRow, type LongitudinalSubjectObservationRow } from "./profile-subject-facts-contract.js";
export const PROFILE_SUBJECT_EVALUATIONS_SQL = `CREATE TABLE learner_subject_evaluations (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  decision_ref_json TEXT NOT NULL CHECK(json_valid(decision_ref_json) AND json_type(decision_ref_json)='object'),
  actor TEXT NOT NULL CHECK(actor IN ('white','black')),
  phase TEXT NOT NULL CHECK(phase IN ('opening','middlegame','endgame','unclear')),
  decision_class TEXT NOT NULL CHECK(decision_class IN ('played','game','predicted')),
  session_kind TEXT NOT NULL CHECK(session_kind IN ('pack','position','imported')),
  pack_id TEXT,
  legal_alternatives INTEGER NOT NULL CHECK(legal_alternatives>=0),
  unavailable_json TEXT NOT NULL CHECK(json_valid(unavailable_json) AND json_type(unavailable_json)='array'),
  observed_at TEXT NOT NULL CHECK(strftime('%Y-%m-%dT%H:%M:%fZ',observed_at) IS observed_at),
  derived_rev INTEGER NOT NULL CHECK(derived_rev>0),
  CHECK((session_kind='pack' AND pack_id IS NOT NULL AND length(pack_id)>0) OR (session_kind<>'pack' AND pack_id IS NULL)),
  PRIMARY KEY(learner_id,run_id,decision_ref_json),
  FOREIGN KEY(run_id,learner_id) REFERENCES drill_runs(id,owner_learner_id) ON DELETE CASCADE,
  FOREIGN KEY(learner_id,run_id,phase,decision_class)
    REFERENCES learner_observation_denominators(learner_id,run_id,phase,decision_class) ON DELETE CASCADE
) STRICT;
CREATE INDEX learner_subject_evaluations_cohort ON learner_subject_evaluations(learner_id,run_id,phase,decision_class);`;
export const INSERT_SUBJECT_EVALUATION = `INSERT INTO learner_subject_evaluations
  (learner_id,run_id,decision_ref_json,actor,phase,decision_class,session_kind,pack_id,legal_alternatives,unavailable_json,observed_at,derived_rev)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
export function subjectEvaluationSqlValues(row: LongitudinalSubjectEvaluationRow) {
  return [row.learnerId,row.runId,canonicalizeJson(row.decisionRef),row.actor,row.phase,row.decisionClass,row.sessionKind,row.packId,
    row.legalAlternatives,canonicalizeJson(row.unavailable),row.observedAt,row.derivedRev] as const;
}
export function subjectEvaluationFromSql(r: Record<string, unknown>): LongitudinalSubjectEvaluationRow {
  const decisionRef: unknown = JSON.parse(String(r.decision_ref_json)), unavailable: unknown = JSON.parse(String(r.unavailable_json));
  if (canonicalizeJson(decisionRef) !== r.decision_ref_json || canonicalizeJson(unavailable) !== r.unavailable_json) throw new TypeError("LONGITUDINAL_SUBJECT_SQL_INVALID");
  return parseLongitudinalSubjectEvaluationRow({ learnerId:r.learner_id,runId:r.run_id,decisionRef,actor:r.actor,phase:r.phase,
    decisionClass:r.decision_class,sessionKind:r.session_kind,packId:r.pack_id,legalAlternatives:r.legal_alternatives,
    unavailable,observedAt:r.observed_at,derivedRev:r.derived_rev });
}
export const PROFILE_SUBJECT_OBSERVATIONS_SQL = `CREATE TABLE learner_subject_observations (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  decision_ref_json TEXT NOT NULL CHECK(json_valid(decision_ref_json) AND json_type(decision_ref_json)='object'),
  source_kind TEXT NOT NULL CHECK(source_kind IN ('native_incidence','condition_relation')),
  projection_id TEXT NOT NULL CHECK(length(projection_id)>0),
  projection_version INTEGER NOT NULL CHECK(projection_version>0),
  subject_json TEXT NOT NULL CHECK(json_valid(subject_json) AND json_type(subject_json)='object'),
  parameters_json TEXT NOT NULL CHECK(json_valid(parameters_json) AND json_type(parameters_json)='object'),
  tested_key TEXT NOT NULL,
  relation TEXT,
  sign TEXT,
  actor TEXT NOT NULL CHECK(actor IN ('white','black')),
  phase TEXT NOT NULL CHECK(phase IN ('opening','middlegame','endgame','unclear')),
  decision_class TEXT NOT NULL CHECK(decision_class IN ('played','game','predicted')),
  session_kind TEXT NOT NULL CHECK(session_kind IN ('pack','position','imported')),
  pack_id TEXT,
  occurred INTEGER NOT NULL CHECK(occurred IN (0,1)),
  legal_alternatives INTEGER NOT NULL CHECK(legal_alternatives>0),
  matching_alternatives INTEGER NOT NULL CHECK(matching_alternatives>=0),
  comparable_alternatives INTEGER NOT NULL CHECK(comparable_alternatives>=matching_alternatives AND comparable_alternatives<=legal_alternatives),
  observed_at TEXT NOT NULL CHECK(strftime('%Y-%m-%dT%H:%M:%fZ',observed_at) IS observed_at),
  derived_rev INTEGER NOT NULL CHECK(derived_rev>0),
  CHECK((source_kind='condition_relation' AND projection_version=2 AND relation IS NOT NULL AND sign IS NULL AND tested_key='relation:'||relation)
     OR (source_kind='native_incidence' AND relation IS NULL AND sign IS NOT NULL AND tested_key='sign:'||sign AND comparable_alternatives=legal_alternatives)),
  CHECK((occurred=1 AND comparable_alternatives>matching_alternatives) OR (occurred=0 AND matching_alternatives>0)),
  CHECK((session_kind='pack' AND pack_id IS NOT NULL AND length(pack_id)>0) OR (session_kind<>'pack' AND pack_id IS NULL)),
  PRIMARY KEY(learner_id,run_id,decision_ref_json,source_kind,projection_id,projection_version,subject_json,parameters_json,tested_key),
  FOREIGN KEY(run_id,learner_id) REFERENCES drill_runs(id,owner_learner_id) ON DELETE CASCADE,
  FOREIGN KEY(learner_id,run_id,phase,decision_class) REFERENCES learner_observation_denominators(learner_id,run_id,phase,decision_class) ON DELETE CASCADE
) STRICT;
CREATE INDEX learner_subject_observations_source ON learner_subject_observations(learner_id,run_id,phase,decision_class,projection_id,projection_version);`;
export function subjectObservationSqlValues(row: LongitudinalSubjectObservationRow) {
  return [row.learnerId, row.runId, canonicalizeJson(row.decisionRef), row.sourceKind, row.projectionId, row.projectionVersion,
    canonicalizeJson(row.subject), canonicalizeJson(row.parameters), row.sourceKind === "condition_relation" ? `relation:${row.relation}` : `sign:${row.sign}`,
    row.sourceKind === "condition_relation" ? row.relation : null, row.sourceKind === "native_incidence" ? row.sign : null,
    row.actor, row.phase, row.decisionClass, row.sessionKind, row.packId, Number(row.occurred), row.legalAlternatives,
    row.matchingAlternatives, row.comparableAlternatives, row.observedAt, row.derivedRev] as const;
}
export const INSERT_SUBJECT_OBSERVATION = `INSERT INTO learner_subject_observations
  (learner_id,run_id,decision_ref_json,source_kind,projection_id,projection_version,subject_json,parameters_json,tested_key,relation,sign,
   actor,phase,decision_class,session_kind,pack_id,occurred,legal_alternatives,matching_alternatives,comparable_alternatives,observed_at,derived_rev)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
export function subjectObservationFromSql(r: Readonly<Record<string, unknown>>): LongitudinalSubjectObservationRow {
  const decisionRef = JSON.parse(String(r.decision_ref_json)), subject = JSON.parse(String(r.subject_json)), parameters = JSON.parse(String(r.parameters_json));
  if (r.occurred !== 0 && r.occurred !== 1 || canonicalizeJson(decisionRef) !== r.decision_ref_json
    || canonicalizeJson(subject) !== r.subject_json || canonicalizeJson(parameters) !== r.parameters_json
    || (r.source_kind === "condition_relation" ? r.sign !== null || r.tested_key !== `relation:${r.relation}`
      : r.relation !== null || r.tested_key !== `sign:${r.sign}`)) throw new TypeError("LONGITUDINAL_SUBJECT_SQL_INVALID");
  return parseLongitudinalSubjectObservationRow({ learnerId: r.learner_id, runId: r.run_id, decisionRef,
    sourceKind: r.source_kind, projectionId: r.projection_id, projectionVersion: r.projection_version, subject, parameters,
    ...(r.source_kind === "condition_relation" ? { relation: r.relation } : { sign: r.sign }),
    actor: r.actor, phase: r.phase, decisionClass: r.decision_class, sessionKind: r.session_kind, packId: r.pack_id,
    occurred: r.occurred === 1, legalAlternatives: r.legal_alternatives, matchingAlternatives: r.matching_alternatives,
    comparableAlternatives: r.comparable_alternatives, observedAt: r.observed_at, derivedRev: r.derived_rev });
}
