import type { DatabaseSync } from "node:sqlite";

import { admitCampaignEventRow, type AdmittedCampaignEvent, type CampaignEventRowImage } from "./campaign-events.js";

// rfc/campaign-core.md §6 — migration 30's five tables and the row-level authority over them. Every
// writer here assumes its caller (SQLiteRunStorage) holds the enclosing `BEGIN IMMEDIATE … COMMIT`;
// nothing in this file opens, commits or rolls back a transaction.
//
// Implementation corrections recorded in the RFC changelog (2026-09-24):
// - `campaign_events.kind` also admits `boss_game_committed` (rfc/campaign-boss-games.md §6 asked
//   the register owner for the CHECK; it lands with this migration so boss games need no second one);
// - `campaign_mutation_commands.play_run_id` carries no RESTRICT foreign key: §6.3 lets a learner
//   delete a SEALED encounter run, and a RESTRICT key would make that deletion impossible. The
//   active pointer keeps its composite RESTRICT key and deletion of an active run refuses first.

export const CAMPAIGN_TABLES = Object.freeze([
  "campaign_runs",
  "campaign_run_creations",
  "campaign_events",
  "campaign_mutation_commands",
  "campaign_reward_awards",
] as const);

export const CAMPAIGN_MIGRATION_SQL = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_drill_runs_owner_identity
  ON drill_runs(id, owner_learner_id);

CREATE TABLE IF NOT EXISTS campaign_runs (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  campaign_version INTEGER NOT NULL,
  campaign_document_digest TEXT NOT NULL,
  campaign_document TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','completed','abandoned')),
  active_encounter_run_id TEXT UNIQUE,
  created_at TEXT NOT NULL,
  UNIQUE (id, learner_id, campaign_id, campaign_version),
  FOREIGN KEY (active_encounter_run_id, learner_id)
    REFERENCES drill_runs(id, owner_learner_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX IF NOT EXISTS idx_campaign_runs_active_encounter ON campaign_runs(active_encounter_run_id)
  WHERE active_encounter_run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_runs_learner ON campaign_runs(learner_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_runs_one_active
  ON campaign_runs(learner_id, campaign_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS campaign_run_creations (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  command_id TEXT NOT NULL,
  campaign_version INTEGER NOT NULL,
  operands_digest TEXT NOT NULL,
  campaign_run_id TEXT NOT NULL UNIQUE,
  result_payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (learner_id, campaign_id, command_id),
  FOREIGN KEY (campaign_run_id, learner_id, campaign_id, campaign_version)
    REFERENCES campaign_runs(id, learner_id, campaign_id, campaign_version) ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS campaign_events (
  campaign_run_id TEXT NOT NULL REFERENCES campaign_runs(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN
    ('campaign_created','node_entered','node_committed','boss_game_committed','loadout_changed','charge_spent',
     'campaign_abandoned')),
  command_id TEXT NOT NULL,
  expected_revision INTEGER,
  operands_digest TEXT NOT NULL,
  result_payload TEXT NOT NULL,
  payload TEXT NOT NULL,
  at TEXT NOT NULL,
  CHECK (
    (kind = 'campaign_created' AND expected_revision IS NULL) OR
    (kind <> 'campaign_created' AND expected_revision IS NOT NULL AND expected_revision >= 0)
  ),
  PRIMARY KEY (campaign_run_id, seq)
) STRICT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_events_command
  ON campaign_events(campaign_run_id, command_id);

CREATE TABLE IF NOT EXISTS campaign_mutation_commands (
  campaign_run_id TEXT NOT NULL REFERENCES campaign_runs(id) ON DELETE CASCADE,
  command_id TEXT NOT NULL,
  play_run_id TEXT NOT NULL,
  expected_campaign_revision INTEGER NOT NULL,
  expected_play_revision INTEGER NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('rewind','fork','group','simulate_enter')),
  operands_digest TEXT NOT NULL,
  result_payload TEXT NOT NULL,
  settled_at TEXT NOT NULL,
  PRIMARY KEY (campaign_run_id, command_id)
) STRICT;

CREATE TABLE IF NOT EXISTS campaign_reward_awards (
  campaign_run_id TEXT NOT NULL REFERENCES campaign_runs(id) ON DELETE CASCADE,
  durable_reward_id TEXT NOT NULL,
  reward_payload TEXT NOT NULL,
  awarded_at TEXT NOT NULL,
  PRIMARY KEY (campaign_run_id, durable_reward_id)
) STRICT;
CREATE INDEX IF NOT EXISTS idx_campaign_reward_awards_owned
  ON campaign_reward_awards(durable_reward_id, campaign_run_id);
`;

export type CampaignRunStatus = "active" | "completed" | "abandoned";

export interface CampaignRunRow {
  readonly id: string;
  readonly learnerId: string;
  readonly campaignId: string;
  readonly campaignVersion: number;
  readonly documentDigest: string;
  readonly document: string;
  readonly status: CampaignRunStatus;
  readonly activeEncounterRunId: string | null;
  readonly createdAt: string;
}

export interface CampaignCreationRow {
  readonly learnerId: string;
  readonly campaignId: string;
  readonly commandId: string;
  readonly campaignVersion: number;
  readonly operandsDigest: string;
  readonly campaignRunId: string;
  readonly resultPayload: string;
  readonly createdAt: string;
}

export interface CampaignMutationCommandRow {
  readonly campaignRunId: string;
  readonly commandId: string;
  readonly playRunId: string;
  readonly expectedCampaignRevision: number;
  readonly expectedPlayRevision: number;
  readonly operation: "rewind" | "fork" | "group" | "simulate_enter";
  readonly operandsDigest: string;
  readonly resultPayload: string;
  readonly settledAt: string;
}

export interface CampaignAwardRow {
  readonly campaignRunId: string;
  readonly durableRewardId: string;
  readonly rewardPayload: string;
  readonly awardedAt: string;
}

function runRow(row: Record<string, unknown>): CampaignRunRow {
  const status = row.status;
  if (status !== "active" && status !== "completed" && status !== "abandoned") throw new TypeError("campaign run status is outside its closed domain");
  return Object.freeze({
    id: String(row.id),
    learnerId: String(row.learner_id),
    campaignId: String(row.campaign_id),
    campaignVersion: Number(row.campaign_version),
    documentDigest: String(row.campaign_document_digest),
    document: String(row.campaign_document),
    status,
    activeEncounterRunId: row.active_encounter_run_id === null ? null : String(row.active_encounter_run_id),
    createdAt: String(row.created_at),
  });
}

export class CampaignStore {
  readonly #database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.#database = database;
  }

  // ---- reads -------------------------------------------------------------------------------

  run(id: string): CampaignRunRow | undefined {
    const row = this.#database.prepare("SELECT * FROM campaign_runs WHERE id=?").get(id) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : runRow(row);
  }

  runsForLearner(learnerId: string): readonly CampaignRunRow[] {
    return Object.freeze((this.#database.prepare("SELECT * FROM campaign_runs WHERE learner_id=? ORDER BY created_at, id").all(learnerId) as Record<string, unknown>[]).map(runRow));
  }

  /** §2.2's guard: one indexed lookup of the campaign whose ACTIVE encounter is this play run. */
  activeByPlayRun(playRunId: string): CampaignRunRow | undefined {
    const row = this.#database.prepare("SELECT * FROM campaign_runs WHERE active_encounter_run_id=?").get(playRunId) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : runRow(row);
  }

  /** The durable origin join: the campaign run whose `node_entered` named this play run. */
  originForPlayRun(playRunId: string): { readonly campaignRunId: string; readonly seq: number } | undefined {
    const row = this.#database.prepare(
      "SELECT campaign_run_id,seq FROM campaign_events WHERE kind='node_entered' AND json_extract(payload,'$.playRunId')=? ORDER BY campaign_run_id LIMIT 1",
    ).get(playRunId) as { readonly campaign_run_id?: unknown; readonly seq?: unknown } | undefined;
    return row === undefined ? undefined : Object.freeze({ campaignRunId: String(row.campaign_run_id), seq: Number(row.seq) });
  }

  events(campaignRunId: string): readonly AdmittedCampaignEvent[] {
    const rows = this.#database.prepare("SELECT * FROM campaign_events WHERE campaign_run_id=? ORDER BY seq").all(campaignRunId) as Record<string, unknown>[];
    return Object.freeze(rows.map((row) => admitCampaignEventRow(row, campaignRunId)));
  }

  revision(campaignRunId: string): number {
    const row = this.#database.prepare("SELECT MAX(seq) AS head FROM campaign_events WHERE campaign_run_id=?").get(campaignRunId) as { readonly head?: unknown } | undefined;
    return typeof row?.head === "number" ? row.head : 0;
  }

  eventByCommand(campaignRunId: string, commandId: string): AdmittedCampaignEvent | undefined {
    const row = this.#database.prepare("SELECT * FROM campaign_events WHERE campaign_run_id=? AND command_id=?").get(campaignRunId, commandId) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : admitCampaignEventRow(row, campaignRunId);
  }

  creation(learnerId: string, campaignId: string, commandId: string): CampaignCreationRow | undefined {
    const row = this.#database.prepare("SELECT * FROM campaign_run_creations WHERE learner_id=? AND campaign_id=? AND command_id=?").get(learnerId, campaignId, commandId) as Record<string, unknown> | undefined;
    if (row === undefined) return undefined;
    return Object.freeze({
      learnerId: String(row.learner_id), campaignId: String(row.campaign_id), commandId: String(row.command_id), campaignVersion: Number(row.campaign_version),
      operandsDigest: String(row.operands_digest), campaignRunId: String(row.campaign_run_id), resultPayload: String(row.result_payload), createdAt: String(row.created_at),
    });
  }

  mutationCommand(campaignRunId: string, commandId: string): CampaignMutationCommandRow | undefined {
    const row = this.#database.prepare("SELECT * FROM campaign_mutation_commands WHERE campaign_run_id=? AND command_id=?").get(campaignRunId, commandId) as Record<string, unknown> | undefined;
    if (row === undefined) return undefined;
    return Object.freeze({
      campaignRunId: String(row.campaign_run_id), commandId: String(row.command_id), playRunId: String(row.play_run_id),
      expectedCampaignRevision: Number(row.expected_campaign_revision), expectedPlayRevision: Number(row.expected_play_revision),
      operation: String(row.operation) as CampaignMutationCommandRow["operation"], operandsDigest: String(row.operands_digest),
      resultPayload: String(row.result_payload), settledAt: String(row.settled_at),
    });
  }

  awardsForRun(campaignRunId: string): readonly CampaignAwardRow[] {
    return Object.freeze((this.#database.prepare("SELECT * FROM campaign_reward_awards WHERE campaign_run_id=? ORDER BY durable_reward_id").all(campaignRunId) as Record<string, unknown>[]).map((row) => Object.freeze({
      campaignRunId: String(row.campaign_run_id), durableRewardId: String(row.durable_reward_id), rewardPayload: String(row.reward_payload), awardedAt: String(row.awarded_at),
    })));
  }

  /** The durable inventory is the distinct projection of award rows joined through campaign_runs. */
  awardsForLearner(learnerId: string): readonly (CampaignAwardRow & { readonly campaignId: string; readonly campaignVersion: number })[] {
    return Object.freeze((this.#database.prepare(
      `SELECT a.*, r.campaign_id, r.campaign_version FROM campaign_reward_awards a JOIN campaign_runs r ON r.id=a.campaign_run_id
       WHERE r.learner_id=? ORDER BY a.awarded_at, a.durable_reward_id`,
    ).all(learnerId) as Record<string, unknown>[]).map((row) => Object.freeze({
      campaignRunId: String(row.campaign_run_id), durableRewardId: String(row.durable_reward_id), rewardPayload: String(row.reward_payload), awardedAt: String(row.awarded_at),
      campaignId: String(row.campaign_id), campaignVersion: Number(row.campaign_version),
    })));
  }

  // ---- writes (caller owns the transaction) ------------------------------------------------

  insertRun(row: CampaignRunRow): void {
    this.#database.prepare(
      `INSERT INTO campaign_runs (id,learner_id,campaign_id,campaign_version,campaign_document_digest,campaign_document,status,active_encounter_run_id,created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(row.id, row.learnerId, row.campaignId, row.campaignVersion, row.documentDigest, row.document, row.status, row.activeEncounterRunId, row.createdAt);
  }

  insertCreation(row: CampaignCreationRow): void {
    this.#database.prepare(
      `INSERT INTO campaign_run_creations (learner_id,campaign_id,command_id,campaign_version,operands_digest,campaign_run_id,result_payload,created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    ).run(row.learnerId, row.campaignId, row.commandId, row.campaignVersion, row.operandsDigest, row.campaignRunId, row.resultPayload, row.createdAt);
  }

  insertEvent(image: CampaignEventRowImage): void {
    this.#database.prepare(
      `INSERT INTO campaign_events (campaign_run_id,seq,kind,command_id,expected_revision,operands_digest,result_payload,payload,at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(image.campaignRunId, image.seq, image.kind, image.commandId, image.expectedRevision, image.operandsDigest, image.resultPayload, image.payload, image.at);
  }

  insertMutationCommand(row: CampaignMutationCommandRow): void {
    this.#database.prepare(
      `INSERT INTO campaign_mutation_commands (campaign_run_id,command_id,play_run_id,expected_campaign_revision,expected_play_revision,operation,operands_digest,result_payload,settled_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(row.campaignRunId, row.commandId, row.playRunId, row.expectedCampaignRevision, row.expectedPlayRevision, row.operation, row.operandsDigest, row.resultPayload, row.settledAt);
  }

  insertAward(row: CampaignAwardRow): void {
    this.#database.prepare("INSERT INTO campaign_reward_awards (campaign_run_id,durable_reward_id,reward_payload,awarded_at) VALUES (?,?,?,?)")
      .run(row.campaignRunId, row.durableRewardId, row.rewardPayload, row.awardedAt);
  }

  /** The materialized projection of the fold: status and the active play-run pointer. */
  setMaterialized(campaignRunId: string, status: CampaignRunStatus, activeEncounterRunId: string | null): void {
    const changed = this.#database.prepare("UPDATE campaign_runs SET status=?, active_encounter_run_id=? WHERE id=?").run(status, activeEncounterRunId, campaignRunId);
    if (changed.changes !== 1) throw new TypeError("campaign run disappeared inside its transaction");
  }
}
