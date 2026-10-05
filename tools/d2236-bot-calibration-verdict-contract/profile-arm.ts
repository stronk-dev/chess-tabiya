/** Disposable D3408 research bridge; never a second bot policy or provider seal authority. */
import {
  BOT_PROFILE_CATALOG,
  resolveBotProfileReference,
  type BotProfileReference,
  type TypedProviderResult,
} from "../../packages/runtime/src/index.js";
import {
  compileBotClassifierView,
  compileBotLegalMoveMap,
  compileBotPolicyExecution,
  parseBotPolicyDecisionRecord,
  projectBotPolicyDecisionRecord,
  sealBotPolicyReplayAuthority,
  type BotOperationRootAuthority,
  type BotPolicyCompileResult,
  type BotPolicyDecisionRecord,
} from "../../apps/server/src/bot-policy-compiler.js";
import {
  botMaiaRequest, botMaiaSource, botStockfishSource, persistBotDeliveries, reloadBotSources,
  type PersistedBotDeliveries,
} from "../../apps/server/src/bot-opponent-source.js";
import { canonicalSha256 } from "../../apps/server/src/bot-profile-digest.js";
import { validateManifest } from "./contract.mjs";
import { digest } from "./population.js";
import manifest from "./manifest.json";

export type ProfileArmSide = "profile" | "left" | "right";
export interface CalibrationProfileBinding {
  readonly manifestDigest: string;
  readonly armId: string;
  readonly side: ProfileArmSide;
  readonly profile: BotProfileReference;
  readonly behaviorDigest: string;
}
export interface CalibrationProfilePlan {
  readonly binding: CalibrationProfileBinding;
  readonly root: BotOperationRootAuthority;
  readonly legal: ReturnType<typeof compileBotLegalMoveMap>;
  readonly classifiers: ReturnType<typeof compileBotClassifierView>;
  readonly maiaRequest: ReturnType<typeof botMaiaRequest>;
  readonly guardRequired: boolean;
}
export interface SavedCalibrationProfileDecision {
  readonly binding: CalibrationProfileBinding;
  readonly sources: PersistedBotDeliveries;
  readonly decision: BotPolicyDecisionRecord;
}
const PLANS = new WeakSet<object>();

/** Read literal arm/side from the frozen manifest and resolve the WHOLE production reference. */
export function prepareCalibrationProfile(
  armId: string, side: ProfileArmSide, root: BotOperationRootAuthority, timeoutMs: number,
): CalibrationProfilePlan {
  validateManifest(manifest);
  const arm = manifest.experiment.arms.find((item) => item.id === armId);
  if (!arm) throw new TypeError("unknown frozen calibration arm");
  let name: string | undefined;
  if (arm.kind === "profile" && side === "profile") name = arm.profile;
  if (arm.kind === "layer_contrast" && side === "left") name = arm.left;
  if (arm.kind === "layer_contrast" && side === "right") name = arm.right;
  if (!name) throw new TypeError("this arm/side is not a registered profile; controls require their own executor");
  const entries = BOT_PROFILE_CATALOG.filter((entry) => `${entry.reference.family}-${entry.reference.band}` === name);
  if (entries.length !== 1) throw new TypeError("manifest profile has no unique production catalogue member");
  const entry = resolveBotProfileReference(entries[0]!.reference);
  if (arm.kind === "profile" && arm.band !== entry.reference.band) throw new TypeError("manifest arm band disagrees with its profile");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new TypeError("request timeout must be a positive safe integer");
  // The service must supply its root authority; this bridge never invents a run/root or accepts
  // a caller-supplied FEN in lieu of that authority. Legal/compiler views prove the root seal.
  const legal = compileBotLegalMoveMap(root);
  const classifiers = compileBotClassifierView(root, legal);
  const plan = Object.freeze({
    binding: Object.freeze({ manifestDigest: digest(JSON.stringify(manifest)), armId, side, profile: entry.reference, behaviorDigest: entry.behaviorDigest }),
    root, legal, classifiers,
    maiaRequest: botMaiaRequest({ startFen: root.startFen, historyUci: root.historyUci, profile: entry.reference, timeoutMs }),
    guardRequired: entry.reference.orderedLayers.includes("guard.severe_error@1"),
  });
  PLANS.add(plan);
  return plan;
}

function assertPlan(plan: CalibrationProfilePlan): void {
  if (!PLANS.has(plan)) throw new TypeError("copied or forged calibration profile plan");
  resolveBotProfileReference(plan.binding.profile);
}

/** Sources come from the shared scheduler. No raw rows, private seal mint or alternate sampler. */
export function executeCalibrationProfile(plan: CalibrationProfilePlan, sources: {
  readonly maia: TypedProviderResult<"maia.policy_page@1">;
  readonly stockfish?: TypedProviderResult<"stockfish.legal_root_table@1">;
}): Exclude<BotPolicyCompileResult, { readonly kind: "executed" }>
  | Readonly<{ kind: "executed"; saved: SavedCalibrationProfileDecision }> {
  assertPlan(plan);
  if (!plan.guardRequired && sources.stockfish !== undefined) throw new TypeError("baseline arm does not acquire guard evidence");
  const maia = botMaiaSource(sources.maia);
  const stockfish = sources.stockfish === undefined ? undefined : botStockfishSource(sources.stockfish);
  const result = compileBotPolicyExecution({ root: plan.root, legal: plan.legal, classifiers: plan.classifiers,
    profile: plan.binding.profile, maia, ...(stockfish === undefined ? {} : { stockfish }) });
  if (result.kind !== "executed") return result;
  if (sources.maia.kind !== "success") throw new TypeError("executed profile has no complete Maia source");
  const persisted = persistBotDeliveries({ maia: sources.maia.delivery,
    ...(plan.guardRequired ? { stockfish: sources.stockfish?.kind === "success" ? sources.stockfish.delivery
      : { failure: stockfish?.kind === "failure" ? stockfish.reason : "not_delivered" as const } } : {}) });
  return Object.freeze({ kind: "executed", saved: Object.freeze({ binding: plan.binding, sources: persisted,
    decision: projectBotPolicyDecisionRecord(result.execution) }) });
}

/** Reload whole delivery bytes and independently reconstruct the production decision. */
export function replayCalibrationProfile(plan: CalibrationProfilePlan, saved: unknown): BotPolicyDecisionRecord {
  assertPlan(plan);
  if (saved === null || typeof saved !== "object" || Array.isArray(saved)
    || Object.keys(saved).sort().join(",") !== "binding,decision,sources") throw new TypeError("invalid calibration decision record");
  const record = saved as SavedCalibrationProfileDecision;
  if (canonicalSha256(record.binding) !== canonicalSha256(plan.binding)) throw new TypeError("crossed calibration manifest/arm/side/profile binding");
  if (!plan.guardRequired && Object.hasOwn(record.sources, "stockfish")) throw new TypeError("baseline record contains guard evidence");
  const sources = reloadBotSources(record.sources);
  if (!plan.guardRequired && sources.stockfish !== undefined) throw new TypeError("baseline record contains guard evidence");
  const authority = sealBotPolicyReplayAuthority({ root: plan.root, legal: plan.legal, classifiers: plan.classifiers,
    profile: plan.binding.profile, ...sources });
  return parseBotPolicyDecisionRecord(record.decision, authority);
}
