// DISPOSABLE D2736-D2741 Campaign sixth-author model. Not production code.
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export type Sha = `sha256:${string}`;
export type CampaignMutationOperation = "rewind" | "fork" | "group" | "simulate_enter";

export const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

export const digest = (value: unknown): Sha =>
  `sha256:${createHash("sha256").update(stable(value)).digest("hex")}`;

const freeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
    Object.freeze(value);
  }
  return value;
};

const object = (value: unknown, error: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(error);
  return value as Record<string, unknown>;
};
const exact = (value: Record<string, unknown>, keys: readonly string[], error: string): void => {
  if (Object.keys(value).sort().join("\0") !== [...keys].sort().join("\0")) throw new TypeError(error);
};
const text = (value: unknown, error: string): string => {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(error);
  return value;
};
const integer = (value: unknown, error: string): number => {
  if (!Number.isInteger(value) || (value as number) < 0) throw new TypeError(error);
  return value as number;
};
const sha = (value: unknown, error: string): Sha => {
  const parsed = text(value, error);
  if (!/^sha256:[0-9a-f]{64}$/u.test(parsed)) throw new TypeError(error);
  return parsed as Sha;
};
const canonicalParse = (bytes: string, error: string): Record<string, unknown> => {
  let parsed: Record<string, unknown>;
  try { parsed = object(JSON.parse(bytes) as unknown, error); } catch { throw new TypeError(error); }
  if (bytes !== stable(parsed)) throw new TypeError(`${error}_NONCANONICAL`);
  return parsed;
};

export interface CampaignMutationCommand {
  readonly campaignRunId: string;
  readonly playRunId: string;
  readonly mutationCommandId: string;
  readonly expectedCampaignRevision: number;
  readonly expectedPlayRevision: number;
  readonly operation: CampaignMutationOperation;
  readonly operandsDigest: Sha;
}
export type CampaignMutationResult =
  | Readonly<{ kind: "committed"; campaignRevision: number; playRevision: number; chargeBalance: number }>
  | Readonly<{ kind: "provider_failed"; code: "OPPONENT_PROVIDER_UNAVAILABLE" }>;

const COMMAND_KEYS = ["campaignRunId", "playRunId", "mutationCommandId", "expectedCampaignRevision",
  "expectedPlayRevision", "operation", "operandsDigest"] as const;

function parseCommand(value: unknown): CampaignMutationCommand {
  const row = object(value, "CAMPAIGN_COMMAND_INVALID");
  exact(row, COMMAND_KEYS, "CAMPAIGN_COMMAND_FIELDS_INVALID");
  const operation = text(row.operation, "CAMPAIGN_COMMAND_OPERATION_INVALID");
  if (!["rewind", "fork", "group", "simulate_enter"].includes(operation)) throw new TypeError("CAMPAIGN_COMMAND_OPERATION_INVALID");
  return freeze({
    campaignRunId: text(row.campaignRunId, "CAMPAIGN_COMMAND_INVALID"),
    playRunId: text(row.playRunId, "CAMPAIGN_COMMAND_INVALID"),
    mutationCommandId: text(row.mutationCommandId, "CAMPAIGN_COMMAND_INVALID"),
    expectedCampaignRevision: integer(row.expectedCampaignRevision, "CAMPAIGN_COMMAND_INVALID"),
    expectedPlayRevision: integer(row.expectedPlayRevision, "CAMPAIGN_COMMAND_INVALID"),
    operation: operation as CampaignMutationOperation,
    operandsDigest: sha(row.operandsDigest, "CAMPAIGN_COMMAND_INVALID"),
  });
}

function parseMutationResult(bytes: string): CampaignMutationResult {
  const row = canonicalParse(bytes, "CAMPAIGN_COMMAND_RESULT_INVALID");
  const kind = text(row.kind, "CAMPAIGN_COMMAND_RESULT_INVALID");
  if (kind === "provider_failed") {
    exact(row, ["kind", "code"], "CAMPAIGN_COMMAND_RESULT_FIELDS_INVALID");
    if (row.code !== "OPPONENT_PROVIDER_UNAVAILABLE") throw new TypeError("CAMPAIGN_COMMAND_RESULT_INVALID");
    return freeze({ kind, code: "OPPONENT_PROVIDER_UNAVAILABLE" as const });
  }
  if (kind !== "committed") throw new TypeError("CAMPAIGN_COMMAND_RESULT_INVALID");
  exact(row, ["kind", "campaignRevision", "playRevision", "chargeBalance"], "CAMPAIGN_COMMAND_RESULT_FIELDS_INVALID");
  return freeze({ kind, campaignRevision: integer(row.campaignRevision, "CAMPAIGN_COMMAND_RESULT_INVALID"),
    playRevision: integer(row.playRevision, "CAMPAIGN_COMMAND_RESULT_INVALID"),
    chargeBalance: integer(row.chargeBalance, "CAMPAIGN_COMMAND_RESULT_INVALID") });
}

export function createCampaignDatabase(path: string): DatabaseSync {
  const database = new DatabaseSync(path);
  database.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS drill_runs (
      id TEXT PRIMARY KEY, owner_learner_id TEXT NOT NULL, revision INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS campaign_runs (
      id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, campaign_document_digest TEXT NOT NULL,
      revision INTEGER NOT NULL, active_encounter_run_id TEXT NOT NULL UNIQUE,
      charge_balance INTEGER NOT NULL CHECK(charge_balance >= 0),
      FOREIGN KEY(active_encounter_run_id) REFERENCES drill_runs(id) ON DELETE RESTRICT
    ) STRICT;
    CREATE TABLE IF NOT EXISTS campaign_mutation_commands (
      campaign_run_id TEXT NOT NULL REFERENCES campaign_runs(id) ON DELETE CASCADE,
      command_id TEXT NOT NULL, play_run_id TEXT NOT NULL,
      expected_campaign_revision INTEGER NOT NULL, expected_play_revision INTEGER NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('rewind','fork','group','simulate_enter')),
      operands_digest TEXT NOT NULL, result_payload TEXT NOT NULL, settled_at TEXT NOT NULL,
      PRIMARY KEY(campaign_run_id, command_id),
      FOREIGN KEY(play_run_id) REFERENCES drill_runs(id) ON DELETE RESTRICT
    ) STRICT;
    CREATE TABLE IF NOT EXISTS campaign_assistance_authority_fixture (
      learner_id TEXT NOT NULL, campaign_run_id TEXT NOT NULL, campaign_document_digest TEXT NOT NULL,
      campaign_revision INTEGER NOT NULL, node_id TEXT NOT NULL, play_run_id TEXT NOT NULL,
      pack_digest TEXT NOT NULL, workflow_context TEXT NOT NULL CHECK(workflow_context='campaign'),
      disclosure_ceiling TEXT NOT NULL, inventory_event_seq INTEGER NOT NULL,
      node_entered_event_digest TEXT NOT NULL, passage_id TEXT NOT NULL,
      applicable INTEGER NOT NULL CHECK(applicable IN (0,1)),
      disclosable INTEGER NOT NULL CHECK(disclosable IN (0,1)),
      source_available INTEGER NOT NULL CHECK(source_available IN (0,1)),
      PRIMARY KEY(campaign_run_id, passage_id)
    ) STRICT;`);
  return database;
}

export function seedCampaignState(database: DatabaseSync, input: Readonly<{ campaignRunId: string; playRunId: string;
  learnerId: string; documentDigest: Sha; campaignRevision: number; playRevision: number; chargeBalance: number }>): void {
  database.prepare("INSERT INTO drill_runs(id,owner_learner_id,revision) VALUES (?,?,?)")
    .run(input.playRunId, input.learnerId, input.playRevision);
  database.prepare(`INSERT INTO campaign_runs
    (id,learner_id,campaign_document_digest,revision,active_encounter_run_id,charge_balance)
    VALUES (?,?,?,?,?,?)`).run(input.campaignRunId, input.learnerId, input.documentDigest,
      input.campaignRevision, input.playRunId, input.chargeBalance);
}

export function applyChargedMutation(database: DatabaseSync, input: CampaignMutationCommand,
  provider: () => "ready" | "failed"): CampaignMutationResult {
  const command = parseCommand(input);
  database.exec("BEGIN IMMEDIATE");
  try {
    const prior = database.prepare(`SELECT play_run_id,expected_campaign_revision,expected_play_revision,
      operation,operands_digest,result_payload FROM campaign_mutation_commands
      WHERE campaign_run_id=? AND command_id=?`).get(command.campaignRunId, command.mutationCommandId) as
      Record<string, unknown> | undefined;
    if (prior !== undefined) {
      const storedCommand = { campaignRunId: command.campaignRunId, playRunId: prior.play_run_id,
        mutationCommandId: command.mutationCommandId, expectedCampaignRevision: prior.expected_campaign_revision,
        expectedPlayRevision: prior.expected_play_revision, operation: prior.operation, operandsDigest: prior.operands_digest };
      if (stable(storedCommand) !== stable(command)) throw new TypeError("CAMPAIGN_COMMAND_REUSED");
      const result = parseMutationResult(text(prior.result_payload, "CAMPAIGN_COMMAND_RESULT_INVALID"));
      database.exec("COMMIT");
      return result;
    }
    const active = database.prepare(`SELECT c.learner_id,c.revision AS campaign_revision,c.charge_balance,
      p.revision AS play_revision,p.owner_learner_id FROM campaign_runs c JOIN drill_runs p
      ON p.id=c.active_encounter_run_id WHERE c.id=? AND c.active_encounter_run_id=?`)
      .get(command.campaignRunId, command.playRunId) as Record<string, unknown> | undefined;
    if (active === undefined || active.learner_id !== active.owner_learner_id) throw new TypeError("CAMPAIGN_ACTIVE_RELATION_MISMATCH");
    if (active.campaign_revision !== command.expectedCampaignRevision) throw new TypeError("CAMPAIGN_REVISION_STALE");
    if (active.play_revision !== command.expectedPlayRevision) throw new TypeError("CAMPAIGN_PLAY_REVISION_STALE");
    if (integer(active.charge_balance, "CAMPAIGN_STATE_INVALID") === 0) throw new TypeError("CAMPAIGN_REWIND_EXHAUSTED");

    let result: CampaignMutationResult;
    if (provider() === "failed") {
      result = freeze({ kind: "provider_failed" as const, code: "OPPONENT_PROVIDER_UNAVAILABLE" as const });
    } else {
      result = freeze({ kind: "committed", campaignRevision: command.expectedCampaignRevision + 1,
        playRevision: command.expectedPlayRevision + 1,
        chargeBalance: integer(active.charge_balance, "CAMPAIGN_STATE_INVALID") - 1 });
      const play = database.prepare("UPDATE drill_runs SET revision=? WHERE id=? AND revision=?")
        .run(result.playRevision, command.playRunId, command.expectedPlayRevision);
      const campaign = database.prepare(`UPDATE campaign_runs SET revision=?,charge_balance=?
        WHERE id=? AND active_encounter_run_id=? AND revision=?`)
        .run(result.campaignRevision, result.chargeBalance, command.campaignRunId, command.playRunId,
          command.expectedCampaignRevision);
      if (play.changes !== 1 || campaign.changes !== 1) throw new TypeError("CAMPAIGN_COMMAND_CAS_LOST");
    }
    database.prepare(`INSERT INTO campaign_mutation_commands
      (campaign_run_id,command_id,play_run_id,expected_campaign_revision,expected_play_revision,
       operation,operands_digest,result_payload,settled_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(command.campaignRunId, command.mutationCommandId, command.playRunId,
        command.expectedCampaignRevision, command.expectedPlayRevision, command.operation,
        command.operandsDigest, stable(result), "2026-09-05T00:00:00.000Z");
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export interface AssistanceSubject {
  readonly learnerId: string; readonly campaignRunId: string; readonly campaignDocumentDigest: Sha;
  readonly campaignRevision: number; readonly nodeId: string; readonly playRunId: string;
  readonly packDigest: Sha; readonly workflowContext: "campaign"; readonly disclosureCeiling: string;
  readonly inventoryEventSeq: number; readonly nodeEnteredEventDigest: Sha;
}
interface AssistanceReceipt { readonly kind: "applicability" | "disclosure" | "source"; readonly subject: AssistanceSubject;
  readonly passageId: string; readonly allowed: boolean; readonly digest: Sha }
export interface CampaignTheoryAuthority { readonly subject: AssistanceSubject; readonly passageId: string;
  readonly applicability: AssistanceReceipt; readonly disclosure: AssistanceReceipt; readonly source: AssistanceReceipt }

const assistanceAuthority = new WeakSet<object>();
const assistanceReceipts = new WeakSet<object>();
const subjectKey = (subject: AssistanceSubject): string => stable(subject);

export function seedCampaignAssistanceAuthority(database: DatabaseSync,
  row: Readonly<{ subject: AssistanceSubject; passageId: string; applicable: boolean;
    disclosable: boolean; sourceAvailable: boolean }>): void {
  database.prepare(`INSERT INTO campaign_assistance_authority_fixture
    (learner_id,campaign_run_id,campaign_document_digest,campaign_revision,node_id,play_run_id,
     pack_digest,workflow_context,disclosure_ceiling,inventory_event_seq,node_entered_event_digest,
     passage_id,applicable,disclosable,source_available) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(row.subject.learnerId, row.subject.campaignRunId, row.subject.campaignDocumentDigest,
      row.subject.campaignRevision, row.subject.nodeId, row.subject.playRunId, row.subject.packDigest,
      row.subject.workflowContext, row.subject.disclosureCeiling, row.subject.inventoryEventSeq,
      row.subject.nodeEnteredEventDigest, row.passageId, Number(row.applicable), Number(row.disclosable),
      Number(row.sourceAvailable));
}

export class CampaignAssistanceStore {
  constructor(readonly database: DatabaseSync) {}
  compile(campaignRunId: string, passageId: string): CampaignTheoryAuthority {
    const row = this.database.prepare(`SELECT * FROM campaign_assistance_authority_fixture
      WHERE campaign_run_id=? AND passage_id=?`).get(campaignRunId, passageId) as Record<string, unknown> | undefined;
    if (row === undefined) throw new TypeError("CAMPAIGN_ASSISTANCE_SUBJECT_UNKNOWN");
    const subject = freeze({ learnerId: text(row.learner_id, "CAMPAIGN_ASSISTANCE_SUBJECT_INVALID"),
      campaignRunId: text(row.campaign_run_id, "CAMPAIGN_ASSISTANCE_SUBJECT_INVALID"),
      campaignDocumentDigest: sha(row.campaign_document_digest, "CAMPAIGN_ASSISTANCE_SUBJECT_INVALID"),
      campaignRevision: integer(row.campaign_revision, "CAMPAIGN_ASSISTANCE_SUBJECT_INVALID"),
      nodeId: text(row.node_id, "CAMPAIGN_ASSISTANCE_SUBJECT_INVALID"),
      playRunId: text(row.play_run_id, "CAMPAIGN_ASSISTANCE_SUBJECT_INVALID"),
      packDigest: sha(row.pack_digest, "CAMPAIGN_ASSISTANCE_SUBJECT_INVALID"), workflowContext: "campaign" as const,
      disclosureCeiling: text(row.disclosure_ceiling, "CAMPAIGN_ASSISTANCE_SUBJECT_INVALID"),
      inventoryEventSeq: integer(row.inventory_event_seq, "CAMPAIGN_ASSISTANCE_SUBJECT_INVALID"),
      nodeEnteredEventDigest: sha(row.node_entered_event_digest, "CAMPAIGN_ASSISTANCE_SUBJECT_INVALID") });
    const receipt = (kind: AssistanceReceipt["kind"], allowed: boolean): AssistanceReceipt => {
      const value = freeze({ kind, subject, passageId, allowed,
        digest: digest({ kind, subject, passageId, allowed }) });
      assistanceReceipts.add(value);
      return value;
    };
    const result = freeze({ subject, passageId,
      applicability: receipt("applicability", row.applicable === 1),
      disclosure: receipt("disclosure", row.disclosable === 1), source: receipt("source", row.source_available === 1) });
    assistanceAuthority.add(result);
    return result;
  }
}

export function authorizeCampaignTheory(subject: AssistanceSubject, authority: CampaignTheoryAuthority):
  "authorized" | "invalid_receipt" | "subject_mismatch" | "not_applicable" | "disclosure_ceiling" | "source_unavailable" {
  if (!assistanceAuthority.has(authority) || !assistanceReceipts.has(authority.applicability)
    || !assistanceReceipts.has(authority.disclosure) || !assistanceReceipts.has(authority.source)) return "invalid_receipt";
  if (subjectKey(subject) !== subjectKey(authority.subject)
    || [authority.applicability, authority.disclosure, authority.source].some((receipt) =>
      subjectKey(receipt.subject) !== subjectKey(subject) || receipt.passageId !== authority.passageId
      || receipt.digest !== digest({ kind: receipt.kind, subject: receipt.subject, passageId: receipt.passageId, allowed: receipt.allowed }))) {
    return "subject_mismatch";
  }
  if (!authority.applicability.allowed) return "not_applicable";
  if (!authority.disclosure.allowed) return "disclosure_ceiling";
  if (!authority.source.allowed) return "source_unavailable";
  return "authorized";
}

type EventKind = "campaign_created" | "node_entered" | "node_committed" | "loadout_changed" | "charge_spent" | "campaign_abandoned";
const EVENT_KEYS = ["campaignRunId", "seq", "kind", "commandId", "expectedRevision", "operandsDigest", "payload", "result", "at"] as const;
export interface CampaignEventInput { readonly campaignRunId: string; readonly seq: number; readonly kind: EventKind;
  readonly commandId: string; readonly expectedRevision: number | null; readonly operandsDigest: Sha;
  readonly payload: Readonly<Record<string, unknown>>; readonly resultKind: string; readonly at: string }
export interface ParsedCampaignEvent { readonly campaignRunId: string; readonly seq: number; readonly kind: EventKind;
  readonly commandId: string; readonly expectedRevision: number | null; readonly operandsDigest: Sha;
  readonly payload: Readonly<Record<string, unknown>>; readonly result: Readonly<{ kind: string; campaignRevision: number; digest: Sha }>;
  readonly at: string }

export function campaignEventBytes(input: CampaignEventInput): string {
  const base = { campaignRunId: input.campaignRunId, seq: input.seq, kind: input.kind,
    commandId: input.commandId, expectedRevision: input.expectedRevision, operandsDigest: input.operandsDigest,
    payload: input.payload, result: { kind: input.resultKind, campaignRevision: input.seq }, at: input.at };
  return stable({ ...base, result: { ...base.result, digest: digest(base) } });
}

export function parseCampaignEvent(bytes: string): ParsedCampaignEvent {
  const row = canonicalParse(bytes, "CAMPAIGN_EVENT_INVALID");
  exact(row, EVENT_KEYS, "CAMPAIGN_EVENT_FIELDS_INVALID");
  const kind = text(row.kind, "CAMPAIGN_EVENT_KIND_INVALID") as EventKind;
  if (!["campaign_created", "node_entered", "node_committed", "loadout_changed", "charge_spent", "campaign_abandoned"].includes(kind)) {
    throw new TypeError("CAMPAIGN_EVENT_KIND_INVALID");
  }
  const seq = integer(row.seq, "CAMPAIGN_EVENT_REVISION_INVALID");
  const expected = row.expectedRevision;
  if (kind === "campaign_created" ? expected !== null || seq !== 1 : !Number.isInteger(expected) || seq !== (expected as number) + 1) {
    throw new TypeError("CAMPAIGN_EVENT_REVISION_INVALID");
  }
  const result = object(row.result, "CAMPAIGN_EVENT_RESULT_INVALID");
  exact(result, ["kind", "campaignRevision", "digest"], "CAMPAIGN_EVENT_RESULT_FIELDS_INVALID");
  if (integer(result.campaignRevision, "CAMPAIGN_EVENT_RESULT_INVALID") !== seq) throw new TypeError("CAMPAIGN_EVENT_RESULT_INVALID");
  const base = { campaignRunId: text(row.campaignRunId, "CAMPAIGN_EVENT_INVALID"), seq, kind,
    commandId: text(row.commandId, "CAMPAIGN_EVENT_INVALID"), expectedRevision: expected as number | null,
    operandsDigest: sha(row.operandsDigest, "CAMPAIGN_EVENT_INVALID"),
    payload: freeze(object(row.payload, "CAMPAIGN_EVENT_INVALID")),
    result: { kind: text(result.kind, "CAMPAIGN_EVENT_RESULT_INVALID"), campaignRevision: seq },
    at: text(row.at, "CAMPAIGN_EVENT_INVALID") };
  if (result.digest !== digest(base)) throw new TypeError("CAMPAIGN_EVENT_RESULT_DIGEST_INVALID");
  return freeze({ ...base, result: freeze({ ...base.result, digest: sha(result.digest, "CAMPAIGN_EVENT_RESULT_INVALID") }) });
}

export type CampaignPhase = "opening" | "middlegame" | "endgame";
interface Node { readonly id: string; readonly encounter: Readonly<{ kind: "pack"; packId: string }>;
  readonly suppress: readonly string[]; readonly reward: Readonly<Record<string, unknown>> | null;
  readonly consumes: readonly string[]; readonly boss: boolean }
export interface CampaignDocument { readonly id: string; readonly title: string; readonly version: number;
  readonly publication: Readonly<{ channel: "official" }>;
  readonly targetLearnerId: string; readonly expectedMinutes: Readonly<{ min: number; max: number }>;
  readonly acts: readonly Readonly<{ id: "act1" | "act2" | "act3";
    layers: readonly Readonly<{ choices: readonly Node[] }>[] }>[];
  readonly economy: Readonly<{ startingCharges: number; actGrants: Readonly<Record<string, number>> }>;
  readonly startingModules: readonly string[]; readonly durableRewards: readonly Readonly<Record<string, unknown>>[] }
export interface CurriculumRegistries { readonly targetLearners: Readonly<Record<string, Readonly<{ prerequisites: readonly string[] }>>>;
  readonly packs: Readonly<Record<string, Readonly<{ digest: Sha; phase: CampaignPhase; form: "pack";
    theory: readonly Readonly<{ passageId: string; evidenceRefs: readonly string[] }>[]; requirementIds: readonly string[] }>>>;
  readonly dependencies: Readonly<Record<string, Readonly<{ operation: string; unavailableAction: "refuse_start" | "honest_degradation";
    fallbackOperation?: string; sourceAvailable: boolean }>>>; readonly providerOperations: readonly string[] }
export interface CurriculumReviewReceipt { readonly authority: "owner_human_chess_review"; readonly documentDigest: Sha; readonly reviewedAt: string }

const documentAuthorities = new WeakSet<object>();
const registryAuthorities = new WeakSet<object>();
const reviewAuthorities = new WeakSet<object>();

export function parseCampaignDocument(bytes: string): CampaignDocument {
  const row = canonicalParse(bytes, "CAMPAIGN_DOCUMENT_INVALID");
  exact(row, ["id", "title", "version", "publication", "targetLearnerId", "expectedMinutes", "acts", "economy", "startingModules", "durableRewards"], "CAMPAIGN_DOCUMENT_FIELDS_INVALID");
  const publication = object(row.publication, "CAMPAIGN_DOCUMENT_INVALID");
  exact(publication, ["channel"], "CAMPAIGN_DOCUMENT_INVALID");
  if (publication.channel !== "official") throw new TypeError("CAMPAIGN_CURRICULUM_NOT_OFFICIAL");
  const acts = row.acts;
  if (!Array.isArray(acts) || acts.length !== 3) throw new TypeError("CAMPAIGN_DOCUMENT_ACTS_INVALID");
  const ids = new Set<string>();
  for (const [actIndex, rawAct] of acts.entries()) {
    const act = object(rawAct, "CAMPAIGN_DOCUMENT_ACT_INVALID");
    exact(act, ["id", "layers"], "CAMPAIGN_DOCUMENT_ACT_INVALID");
    if (act.id !== `act${actIndex + 1}` || !Array.isArray(act.layers) || act.layers.length !== 3) throw new TypeError("CAMPAIGN_DOCUMENT_ACT_INVALID");
    for (const rawLayer of act.layers) {
      const layer = object(rawLayer, "CAMPAIGN_DOCUMENT_LAYER_INVALID");
      exact(layer, ["choices"], "CAMPAIGN_DOCUMENT_LAYER_INVALID");
      if (!Array.isArray(layer.choices) || layer.choices.length < 1 || layer.choices.length > 3) throw new TypeError("CAMPAIGN_DOCUMENT_LAYER_INVALID");
      for (const rawNode of layer.choices) {
        const node = object(rawNode, "CAMPAIGN_DOCUMENT_NODE_INVALID");
        exact(node, ["id", "encounter", "suppress", "reward", "consumes", "boss"], "CAMPAIGN_DOCUMENT_NODE_INVALID");
        const id = text(node.id, "CAMPAIGN_DOCUMENT_NODE_INVALID");
        if (ids.has(id)) throw new TypeError("CAMPAIGN_CURRICULUM_NODE_DUPLICATE");
        ids.add(id);
        const encounter = object(node.encounter, "CAMPAIGN_DOCUMENT_NODE_INVALID");
        exact(encounter, ["kind", "packId"], "CAMPAIGN_DOCUMENT_NODE_INVALID");
        if (encounter.kind !== "pack") throw new TypeError("CAMPAIGN_DOCUMENT_NODE_INVALID");
        text(encounter.packId, "CAMPAIGN_DOCUMENT_NODE_INVALID");
        if (!Array.isArray(node.suppress) || !Array.isArray(node.consumes) || typeof node.boss !== "boolean") throw new TypeError("CAMPAIGN_DOCUMENT_NODE_INVALID");
      }
    }
  }
  const expected = object(row.expectedMinutes, "CAMPAIGN_CURRICULUM_ENVELOPE_INVALID");
  exact(expected, ["min", "max"], "CAMPAIGN_CURRICULUM_ENVELOPE_INVALID");
  if (integer(expected.min, "CAMPAIGN_CURRICULUM_ENVELOPE_INVALID") < 1
    || integer(expected.max, "CAMPAIGN_CURRICULUM_ENVELOPE_INVALID") < integer(expected.min, "CAMPAIGN_CURRICULUM_ENVELOPE_INVALID")) {
    throw new TypeError("CAMPAIGN_CURRICULUM_ENVELOPE_INVALID");
  }
  const parsed = freeze(row as unknown as CampaignDocument);
  documentAuthorities.add(parsed);
  return parsed;
}

export function sealCurriculumRegistries(input: CurriculumRegistries): CurriculumRegistries {
  const copied = freeze(JSON.parse(JSON.stringify(input)) as CurriculumRegistries);
  registryAuthorities.add(copied);
  return copied;
}

export class HumanCurriculumReviewAuthority {
  issue(document: CampaignDocument, reviewedAt: string): CurriculumReviewReceipt {
    if (!documentAuthorities.has(document) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(reviewedAt)
      || !Number.isFinite(Date.parse(reviewedAt))) throw new TypeError("CAMPAIGN_CURRICULUM_REVIEW_INVALID");
    const receipt = freeze({ authority: "owner_human_chess_review" as const,
      documentDigest: digest(document), reviewedAt });
    reviewAuthorities.add(receipt);
    return receipt;
  }
}

export interface CampaignCurriculumMetadata { readonly campaignDigest: Sha;
  readonly targetLearner: Readonly<{ bracketId: string; prerequisites: readonly string[] }>;
  readonly expectedEnvelope: Readonly<{ minimumMinutes: number; maximumMinutes: number }>;
  readonly phaseCoverage: Readonly<Record<CampaignPhase, readonly string[]>>;
  readonly formCoverage: readonly Readonly<{ encounterKind: "pack"; nodeIds: readonly string[] }>[];
  readonly theoryProvenance: readonly Readonly<{ nodeId: string; passageId: string; evidenceRefs: readonly string[] }>[];
  readonly dependencyAvailability: readonly Readonly<{ requirement: string; requiredAt: readonly string[];
    unavailableAction: "refuse_start" | "honest_degradation"; fallbackOperation?: string; sourceAvailable: boolean }>[];
  readonly reviewReceipt: CurriculumReviewReceipt }

export function compileOfficialCurriculum(document: CampaignDocument, registries: CurriculumRegistries,
  review: CurriculumReviewReceipt): CampaignCurriculumMetadata {
  if (!documentAuthorities.has(document) || !registryAuthorities.has(registries) || !reviewAuthorities.has(review)) {
    throw new TypeError("CAMPAIGN_CURRICULUM_AUTHORITY_INVALID");
  }
  const campaignDigest = digest(document);
  if (review.documentDigest !== campaignDigest) throw new TypeError("CAMPAIGN_CURRICULUM_REVIEW_INVALID");
  const target = registries.targetLearners[document.targetLearnerId];
  if (target === undefined) throw new TypeError("CAMPAIGN_CURRICULUM_TARGET_UNKNOWN");
  const phaseCoverage: Record<CampaignPhase, string[]> = { opening: [], middlegame: [], endgame: [] };
  const formNodeIds: string[] = [];
  const theoryProvenance: { nodeId: string; passageId: string; evidenceRefs: readonly string[] }[] = [];
  const requirements = new Map<string, string[]>();
  for (const act of document.acts) for (const layer of act.layers) for (const node of layer.choices) {
    const pack = registries.packs[node.encounter.packId];
    if (pack === undefined) throw new TypeError("CAMPAIGN_CURRICULUM_PACK_UNKNOWN");
    phaseCoverage[pack.phase].push(node.id);
    formNodeIds.push(node.id);
    for (const theory of pack.theory) theoryProvenance.push({ nodeId: node.id,
      passageId: theory.passageId, evidenceRefs: [...new Set(theory.evidenceRefs)].sort() });
    for (const requirement of pack.requirementIds) requirements.set(requirement,
      [...(requirements.get(requirement) ?? []), node.id]);
  }
  if (Object.values(phaseCoverage).some((nodes) => nodes.length === 0)) throw new TypeError("CAMPAIGN_CURRICULUM_PHASE_EMPTY");
  const dependencyAvailability = [...requirements.entries()].sort(([left], [right]) => left.localeCompare(right))
    .map(([requirement, requiredAt]) => {
      const dependency = registries.dependencies[requirement];
      if (dependency === undefined || !registries.providerOperations.includes(dependency.operation)
        || (dependency.fallbackOperation !== undefined && !registries.providerOperations.includes(dependency.fallbackOperation))) {
        throw new TypeError("CAMPAIGN_CURRICULUM_DEPENDENCY_UNKNOWN");
      }
      return freeze({ requirement, requiredAt: freeze([...new Set(requiredAt)].sort()), ...dependency });
    });
  return freeze({ campaignDigest,
    targetLearner: freeze({ bracketId: document.targetLearnerId, prerequisites: freeze([...target.prerequisites].sort()) }),
    expectedEnvelope: freeze({ minimumMinutes: document.expectedMinutes.min, maximumMinutes: document.expectedMinutes.max }),
    phaseCoverage: freeze({ opening: freeze(phaseCoverage.opening.sort()), middlegame: freeze(phaseCoverage.middlegame.sort()),
      endgame: freeze(phaseCoverage.endgame.sort()) }),
    formCoverage: freeze([{ encounterKind: "pack" as const, nodeIds: freeze([...formNodeIds].sort()) }]),
    theoryProvenance: freeze(theoryProvenance.sort((left, right) => `${left.nodeId}/${left.passageId}`.localeCompare(`${right.nodeId}/${right.passageId}`))),
    dependencyAvailability: freeze(dependencyAvailability), reviewReceipt: review });
}
