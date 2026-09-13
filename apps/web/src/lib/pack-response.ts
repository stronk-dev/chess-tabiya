import {
  CHECKPOINT_ACTIONS,
  FEEDBACK_POLICIES,
  OBJECTIVE_TYPES,
  PACK_PHASES,
  type DrillPackDefinition,
} from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";

type RecordValue = Readonly<Record<string, unknown>>;

const TOP_KEYS = Object.freeze(["id", "version", "title", "mode", "provenance", "channel", "start", "objective", "feedbackPolicy", "opponentPolicy", "spine", "checkpoints"] as const);
const POLICY_MODES = Object.freeze(["theory_strict", "human_common", "plan_defense", "practical_resistance", "perfect_tablebase", "strong_engine", "human_external"] as const);

function record(value: unknown, label: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as RecordValue;
}

function exact(value: RecordValue, required: readonly string[], label: string, optional: readonly string[] = []): void {
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !(key in value)) || Object.keys(value).some((key) => !allowed.has(key))) throw new TypeError(`${label} has an invalid shape`);
}

function nonempty(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string`);
  return value;
}

function oneOf<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new TypeError(`${label} is outside the closed vocabulary`);
  return value as T;
}

function integer(value: unknown, label: string, minimum?: number, maximum?: number): number {
  if (!Number.isSafeInteger(value)) throw new TypeError(`${label} must be a safe integer`);
  const parsed = Number(value);
  if ((minimum !== undefined && parsed < minimum) || (maximum !== undefined && parsed > maximum)) throw new TypeError(`${label} is outside its bounds`);
  return parsed;
}

function finite(value: unknown, label: string, minimum?: number, maximum?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
  if ((minimum !== undefined && value < minimum) || (maximum !== undefined && value > maximum)) throw new TypeError(`${label} is outside its bounds`);
  return value;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new TypeError(`${label} must be boolean`);
  return value;
}

function stringArray(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const parsed = value.map((item, index) => nonempty(item, `${label}/${index}`));
  if (new Set(parsed).size !== parsed.length) throw new TypeError(`${label} contains duplicates`);
  return Object.freeze(parsed);
}

function textArray(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return Object.freeze(value.map((item, index) => nonempty(item, `${label}/${index}`)));
}

function timestamp(value: unknown, label: string): string {
  const parsed = nonempty(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(parsed) || new Date(parsed).toISOString() !== parsed) throw new TypeError(`${label} must be a canonical UTC timestamp`);
  return parsed;
}

function legalFen(value: unknown, label: string): string {
  const fen = nonempty(value, label);
  try { Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); } catch { throw new TypeError(`${label} must be a legal chess position`); }
  return fen;
}

function uci(value: unknown, label: string): string {
  const parsed = nonempty(value, label);
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(parsed)) throw new TypeError(`${label} must be a UCI move`);
  return parsed;
}

function validateDifficulty(value: unknown, label: string): void {
  const item = record(value, label); exact(item, [], label, ["minOnlineRapid", "maxOnlineRapid", "label", "branchLengthTarget"]);
  const minimum = item.minOnlineRapid === undefined ? undefined : integer(item.minOnlineRapid, `${label}/minOnlineRapid`, 1000);
  const maximum = item.maxOnlineRapid === undefined ? undefined : integer(item.maxOnlineRapid, `${label}/maxOnlineRapid`, 1000);
  if (minimum !== undefined && maximum !== undefined && maximum < minimum) throw new TypeError(`${label} has a reversed rating window`);
  if (item.label !== undefined) nonempty(item.label, `${label}/label`);
  if (item.branchLengthTarget !== undefined) integer(item.branchLengthTarget, `${label}/branchLengthTarget`, 2, 40);
}

function validateStart(value: unknown): void {
  const item = record(value, "pack/start"); exact(item, ["fen", "side"], "pack/start", ["movesSan"]);
  legalFen(item.fen, "pack/start/fen"); oneOf(item.side, ["white", "black"] as const, "pack/start/side");
  if (item.movesSan !== undefined) textArray(item.movesSan, "pack/start/movesSan");
}

function validateAssessment(value: unknown, label: string): void {
  const item = record(value, label), kind = oneOf(item.kind, ["authored", "syzygy", "engine"] as const, `${label}/kind`);
  if (kind === "authored") { exact(item, ["kind", "note"], label); nonempty(item.note, `${label}/note`); return; }
  if (kind === "syzygy") {
    exact(item, ["kind", "category", "pieceCount", "sourceId", "retrievedAt"], label);
    oneOf(item.category, ["win", "loss", "draw", "cursed-win", "blessed-loss"] as const, `${label}/category`);
    integer(item.pieceCount, `${label}/pieceCount`, 2, 7); oneOf(item.sourceId, ["syzygy"] as const, `${label}/sourceId`); timestamp(item.retrievedAt, `${label}/retrievedAt`); return;
  }
  exact(item, ["kind", "score", "perspective", "depth", "engineId", "engineVersion", "sourceId", "retrievedAt"], label);
  const score = record(item.score, `${label}/score`), scoreKind = oneOf(score.kind, ["cp", "mate"] as const, `${label}/score/kind`);
  if (scoreKind === "cp") { exact(score, ["kind", "centipawns"], `${label}/score`); integer(score.centipawns, `${label}/score/centipawns`); }
  else { exact(score, ["kind", "movesToMate"], `${label}/score`); integer(score.movesToMate, `${label}/score/movesToMate`); }
  oneOf(item.perspective, ["white"] as const, `${label}/perspective`); integer(item.depth, `${label}/depth`, 1);
  nonempty(item.engineId, `${label}/engineId`); nonempty(item.engineVersion, `${label}/engineVersion`); nonempty(item.sourceId, `${label}/sourceId`); timestamp(item.retrievedAt, `${label}/retrievedAt`);
}

function validateObjective(value: unknown, label: string, gradingAllowed: boolean): void {
  const item = record(value, label); exact(item, ["type", "summary"], label, gradingAllowed ? ["grading"] : []);
  oneOf(item.type, OBJECTIVE_TYPES, `${label}/type`); nonempty(item.summary, `${label}/summary`);
  if (item.grading === undefined) return;
  const grading = record(item.grading, `${label}/grading`); exact(grading, ["assessedBy", "resolveAt", "grounding"], `${label}/grading`);
  validateAssessment(grading.assessedBy, `${label}/grading/assessedBy`);
  oneOf(grading.grounding, ["ledger_verified", "unverified"] as const, `${label}/grading/grounding`);
  const resolve = record(grading.resolveAt, `${label}/grading/resolveAt`), kind = oneOf(resolve.kind, ["checkpoint", "terminal"] as const, `${label}/grading/resolveAt/kind`);
  if (kind === "checkpoint") { exact(resolve, ["kind", "checkpointId"], `${label}/grading/resolveAt`); nonempty(resolve.checkpointId, `${label}/grading/resolveAt/checkpointId`); }
  else exact(resolve, ["kind"], `${label}/grading/resolveAt`);
}

function validatePolicy(value: unknown): void {
  const item = record(value, "pack/opponentPolicy"); exact(item, ["mode"], "pack/opponentPolicy", ["targetElo", "temperature", "topP", "stockfishGuardCp", "seedMode"]);
  oneOf(item.mode, POLICY_MODES, "pack/opponentPolicy/mode");
  if (item.targetElo !== undefined) integer(item.targetElo, "pack/opponentPolicy/targetElo");
  if (item.temperature !== undefined) finite(item.temperature, "pack/opponentPolicy/temperature", 0);
  if (item.topP !== undefined) finite(item.topP, "pack/opponentPolicy/topP", 0, 1);
  if (item.stockfishGuardCp !== undefined) integer(item.stockfishGuardCp, "pack/opponentPolicy/stockfishGuardCp", 0);
  if (item.seedMode !== undefined) oneOf(item.seedMode, ["fixed", "per_run", "per_branch"] as const, "pack/opponentPolicy/seedMode");
}

function validateShapes(value: unknown): void {
  if (!Array.isArray(value)) throw new TypeError("pack/shapes must be an array");
  const ids = new Set<string>();
  for (const [index, raw] of value.entries()) {
    const label = `pack/shapes/${index}`;
    const id = typeof raw === "string" ? nonempty(raw, label) : (() => { const item = record(raw, label); exact(item, ["shape", "relation"], label); oneOf(item.relation, ["present", "prospective"] as const, `${label}/relation`); return nonempty(item.shape, `${label}/shape`); })();
    if (ids.has(id)) throw new TypeError("pack/shapes contains a duplicate identity"); ids.add(id);
  }
}

function validateSpine(value: unknown): void {
  if (!Array.isArray(value)) throw new TypeError("pack/spine must be an array");
  const ids = new Set<string>();
  const visit = (raw: unknown, label: string): void => {
    const item = record(raw, label); exact(item, ["id", "moveUci", "moveSan", "children"], label);
    const id = nonempty(item.id, `${label}/id`); if (ids.has(id)) throw new TypeError("pack/spine contains a duplicate node id"); ids.add(id);
    uci(item.moveUci, `${label}/moveUci`); nonempty(item.moveSan, `${label}/moveSan`);
    if (!Array.isArray(item.children)) throw new TypeError(`${label}/children must be an array`);
    item.children.forEach((child, index) => visit(child, `${label}/children/${index}`));
  };
  value.forEach((node, index) => visit(node, `pack/spine/${index}`));
}

function validateCheckpoints(value: unknown): Set<string> {
  if (!Array.isArray(value)) throw new TypeError("pack/checkpoints must be an array");
  const ids = new Set<string>();
  for (const [index, raw] of value.entries()) {
    const label = `pack/checkpoints/${index}`, item = record(raw, label); exact(item, ["id", "actions"], label, ["label", "interaction"]);
    const id = nonempty(item.id, `${label}/id`); if (ids.has(id)) throw new TypeError("pack/checkpoints contains a duplicate id"); ids.add(id);
    if (item.label !== undefined) nonempty(item.label, `${label}/label`);
    const actions = stringArray(item.actions, `${label}/actions`); actions.forEach((action) => oneOf(action, CHECKPOINT_ACTIONS, `${label}/actions`));
    if (item.interaction !== undefined) {
      const interaction = record(item.interaction, `${label}/interaction`), kind = oneOf(interaction.type, ["prediction", "stated_reasoning"] as const, `${label}/interaction/type`);
      if (kind === "prediction") { exact(interaction, ["type"], `${label}/interaction`, ["flipBoard"]); if (interaction.flipBoard !== undefined) boolean(interaction.flipBoard, `${label}/interaction/flipBoard`); }
      else exact(interaction, ["type"], `${label}/interaction`);
    }
  }
  return ids;
}

function validateLegs(value: unknown, checkpointIds: ReadonlySet<string>): void {
  if (!Array.isArray(value) || value.length === 0) throw new TypeError("pack/legs must be a non-empty array");
  const ids = new Set<string>();
  for (const [index, raw] of value.entries()) {
    const label = `pack/legs/${index}`, item = record(raw, label); exact(item, ["id", "objective"], label, ["entryCheckpointId", "branchLengthTarget"]);
    const id = nonempty(item.id, `${label}/id`); if (ids.has(id)) throw new TypeError("pack/legs contains a duplicate id"); ids.add(id);
    if (item.entryCheckpointId !== undefined && !checkpointIds.has(nonempty(item.entryCheckpointId, `${label}/entryCheckpointId`))) throw new TypeError(`${label} names an unknown checkpoint`);
    if (item.branchLengthTarget !== undefined) integer(item.branchLengthTarget, `${label}/branchLengthTarget`, 1);
    validateObjective(item.objective, `${label}/objective`, false);
  }
}

function validateVariant(value: unknown, packId: string): void {
  const item = record(value, "pack/variantOf"); exact(item, ["packId", "relation"], "pack/variantOf", ["note"]);
  const parentId = nonempty(item.packId, "pack/variantOf/packId"); if (parentId === packId) throw new TypeError("pack cannot be its own variant parent");
  if (item.note !== undefined) nonempty(item.note, "pack/variantOf/note");
  const relation = record(item.relation, "pack/variantOf/relation"), kind = oneOf(relation.kind, ["root_after_move", "same_root_other_side", "same_root_other_objective"] as const, "pack/variantOf/relation/kind");
  if (kind === "root_after_move") { exact(relation, ["kind", "moveUci"], "pack/variantOf/relation"); uci(relation.moveUci, "pack/variantOf/relation/moveUci"); }
  else exact(relation, ["kind"], "pack/variantOf/relation");
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value)) deepFreeze(child); Object.freeze(value); }
  return value;
}

export function parsePackDocument(value: unknown, requestedPackId: string): DrillPackDefinition {
  const item = record(value, "pack"); exact(item, TOP_KEYS, "pack", ["phase", "difficulty", "publisherHandle", "legs", "shapes", "variantOf"]);
  const id = nonempty(item.id, "pack/id"); if (id !== requestedPackId) throw new TypeError("pack response does not match the requested id");
  const version = nonempty(item.version, "pack/version"); if (!/^\d+\.\d+(?:\.\d+)?$/u.test(version)) throw new TypeError("pack/version must be numeric");
  nonempty(item.title, "pack/title"); const mode = oneOf(item.mode, ["line", "plan", "outcome", "trajectory"] as const, "pack/mode");
  if (item.phase !== undefined) oneOf(item.phase, PACK_PHASES, "pack/phase"); if (item.difficulty !== undefined) validateDifficulty(item.difficulty, "pack/difficulty");
  const provenance = record(item.provenance, "pack/provenance"); exact(provenance, ["reviewStatus"], "pack/provenance", ["sources", "licence"]);
  oneOf(provenance.reviewStatus, ["schema_example", "draft", "published"] as const, "pack/provenance/reviewStatus");
  if (provenance.sources !== undefined) stringArray(provenance.sources, "pack/provenance/sources"); if (provenance.licence !== undefined) nonempty(provenance.licence, "pack/provenance/licence");
  const channel = oneOf(item.channel, ["official", "community"] as const, "pack/channel");
  if (item.publisherHandle !== undefined) { nonempty(item.publisherHandle, "pack/publisherHandle"); if (channel === "official") throw new TypeError("official pack cannot name a community publisher"); }
  validateStart(item.start); validateObjective(item.objective, "pack/objective", true); validatePolicy(item.opponentPolicy);
  oneOf(item.feedbackPolicy, FEEDBACK_POLICIES, "pack/feedbackPolicy"); validateSpine(item.spine);
  if (mode === "line" && (item.spine as readonly unknown[]).length !== 0) throw new TypeError("line pack response disclosed its authored answer spine");
  const checkpointIds = validateCheckpoints(item.checkpoints);
  if (item.legs !== undefined) { if (mode !== "trajectory") throw new TypeError("only trajectory packs may publish legs"); validateLegs(item.legs, checkpointIds); }
  if (item.shapes !== undefined) validateShapes(item.shapes); if (item.variantOf !== undefined) validateVariant(item.variantOf, id);
  const grading = (item.objective as RecordValue).grading as RecordValue | undefined;
  const resolve = grading?.resolveAt as RecordValue | undefined;
  if (resolve?.kind === "checkpoint" && !checkpointIds.has(String(resolve.checkpointId))) throw new TypeError("pack grading names an unknown checkpoint");
  return deepFreeze(structuredClone(item)) as unknown as DrillPackDefinition;
}
