import { assistanceDigest, type AssistanceDigest } from "./assistance-exchange-digest.js";
import { MODULE_IDS, type ModuleId } from "./module-contract.js";
import type { UnlockableModuleId } from "./campaign-contract.js";

// rfc/campaign-core.md §5.1 — the encounter receipt intent-presets' Campaign context imports
// (rfc/intent-presets.md §3.1 / Discharge D6). The receipt is ISSUED by the server-side campaign
// authority from durable campaign/play/pack rows and VERIFIED by identity: a structural look-alike
// (a JSON copy, a spread, a hand-built object with a matching digest) is refused because only
// objects minted by `issueCampaignEncounterReceipt` in this process are members of the issued set.
// The browser never holds a receipt; it sends only its context hint.

export interface CampaignAssistanceSubject {
  readonly learnerId: string;
  readonly campaignRunId: string;
  readonly campaignDocumentDigest: string;
  readonly campaignRevision: number;
  readonly nodeId: string;
  readonly playRunId: string;
  readonly packDigest: string;
  readonly workflowContext: "campaign";
  readonly disclosureCeiling: "campaign_context";
  readonly inventoryEventSeq: number;
  readonly nodeEnteredEventDigest: string;
}

export interface CampaignEncounterReceipt {
  readonly kind: "campaign_encounter_receipt";
  readonly version: 1;
  readonly subject: CampaignAssistanceSubject;
  readonly phase: "active" | "sealed" | "abandoned";
  readonly modules: {
    readonly owned: readonly UnlockableModuleId[];
    readonly equipped: readonly UnlockableModuleId[];
    readonly suppressed: readonly UnlockableModuleId[];
    /** rules_floor ∪ ((owned ∩ equipped) − suppressed), ordered by MODULE_IDS. */
    readonly effective: readonly ModuleId[];
  };
  /** Theory authority has not landed: owned passages stay owned; none is authorized. */
  readonly theory: { readonly owned: readonly { readonly bundleId: string; readonly passageId: string }[]; readonly authorized: readonly never[] };
  readonly receiptDigest: AssistanceDigest;
}

export type CampaignReceiptErrorCode = "CAMPAIGN_RECEIPT_FORGED" | "CAMPAIGN_RECEIPT_DIGEST" | "subject_mismatch";

export class CampaignReceiptError extends TypeError {
  readonly code: CampaignReceiptErrorCode;
  constructor(code: CampaignReceiptErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "CampaignReceiptError";
    this.code = code;
  }
}

const ISSUED = new WeakSet<object>();

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function receiptBody(receipt: Omit<CampaignEncounterReceipt, "receiptDigest">): unknown {
  return { kind: receipt.kind, version: receipt.version, subject: receipt.subject, phase: receipt.phase, modules: receipt.modules, theory: receipt.theory };
}

/**
 * Server-side issuer. Callers pass facts they read from durable authority; the issuer derives the
 * effective set itself so no caller can hand it a pre-widened module list.
 */
export function issueCampaignEncounterReceipt(input: {
  readonly subject: CampaignAssistanceSubject;
  readonly phase: CampaignEncounterReceipt["phase"];
  readonly owned: readonly UnlockableModuleId[];
  readonly equipped: readonly UnlockableModuleId[];
  readonly suppressed: readonly UnlockableModuleId[];
  readonly theoryOwned: readonly { readonly bundleId: string; readonly passageId: string }[];
}): CampaignEncounterReceipt {
  if (input.subject.workflowContext !== "campaign") throw new CampaignReceiptError("subject_mismatch", "a campaign receipt names the campaign context");
  const owned = new Set<ModuleId>(input.owned);
  const equipped = new Set<ModuleId>(input.equipped);
  const suppressed = new Set<ModuleId>(input.suppressed);
  const effective = MODULE_IDS.filter((id) => id === "rules_floor" || (owned.has(id) && equipped.has(id) && !suppressed.has(id)));
  const order = (values: Iterable<ModuleId>) => MODULE_IDS.filter((id) => new Set(values).has(id)) as UnlockableModuleId[];
  const body = {
    kind: "campaign_encounter_receipt" as const,
    version: 1 as const,
    subject: { ...input.subject },
    phase: input.phase,
    modules: { owned: order(owned), equipped: order(equipped), suppressed: order(suppressed), effective },
    theory: { owned: input.theoryOwned.map((item) => ({ bundleId: item.bundleId, passageId: item.passageId })), authorized: [] as never[] },
  };
  const receipt = deepFreeze({ ...body, receiptDigest: assistanceDigest(receiptBody(body)) });
  ISSUED.add(receipt);
  return receipt;
}

/**
 * Verifier. Refuses anything not minted by the issuer, any post-issue byte change, and — when an
 * expected subject is given — any receipt for another learner, document, revision, node, play run,
 * pack, context, ceiling or event cut (`subject_mismatch`, never reusable evidence).
 */
export function verifyCampaignEncounterReceipt(value: unknown, expected?: Partial<CampaignAssistanceSubject>): CampaignEncounterReceipt {
  if (value === null || typeof value !== "object" || !ISSUED.has(value)) throw new CampaignReceiptError("CAMPAIGN_RECEIPT_FORGED", "the receipt was not issued by the campaign authority");
  const receipt = value as CampaignEncounterReceipt;
  if (assistanceDigest(receiptBody(receipt)) !== receipt.receiptDigest) throw new CampaignReceiptError("CAMPAIGN_RECEIPT_DIGEST", "the receipt bytes changed after issue");
  if (expected !== undefined) {
    for (const [key, want] of Object.entries(expected) as [keyof CampaignAssistanceSubject, unknown][]) {
      if (want !== undefined && receipt.subject[key] !== want) throw new CampaignReceiptError("subject_mismatch", `receipt subject ${key} does not match`);
    }
  }
  return receipt;
}
