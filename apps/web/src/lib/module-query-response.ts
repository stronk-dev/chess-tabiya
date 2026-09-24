// rfc/module-registration.md §2.5.2/§2.6 + rfc/intent-presets.md Checkpoint B — the strict client
// parser of `POST /runs/:id/modules/query`. Nothing renders unless: the page answers this run and
// subject; its effective configuration digest EQUALS the finalized assistance this screen compiled
// (what renders is exactly what the preset compiled); every packet's presentation receipt passes the
// exact receipt parser (a new client-local seal); and every disclosure receipt recomputes and binds
// the ordered component digests it names. Extra fields, unknown modules and digest drift refuse.

import {
  INSPECTOR_FAMILY_IDS,
  MODULE_IDS,
  MODULE_QUERY_PROTOCOL,
  moduleDisclosureDigest,
  parsePresentationReceipt,
  type InspectorFamilyState,
  type ModuleBudgetReceipt,
  type ModuleDisclosureReceipt,
  type ModuleEmptyState,
  type ModuleId,
  type ModuleSuppressionReason,
  type PresentedEvidenceItem,
} from "@chess-tabiya/runtime";

export type ModuleTimingName = "pre_commit" | "at_commit" | "post_commit" | "checkpoint" | "review";

export interface ParsedModulePacket {
  readonly module: ModuleId;
  readonly timing: ModuleTimingName;
  readonly initiative: "proactive" | "on_request" | "explicit_mode";
  readonly items: readonly PresentedEvidenceItem[];
  readonly budget: ModuleBudgetReceipt;
  readonly noveltyAbstained: boolean;
  readonly empty: ModuleEmptyState | null;
  readonly unavailable: readonly { readonly projection: string; readonly reason: string }[];
  readonly disclosure: ModuleDisclosureReceipt;
}

export interface ParsedModuleQueryPage {
  readonly runId: string;
  readonly timing: ModuleTimingName;
  readonly subjectNodeId: string;
  readonly decisionDigest: string;
  readonly effectiveConfigDigest: string;
  readonly packets: readonly ParsedModulePacket[];
  readonly suppressions: readonly { readonly module: ModuleId; readonly reason: ModuleSuppressionReason }[];
}

export class ModuleQueryResponseError extends TypeError {
  constructor(message: string) {
    super(`Invalid module query response: ${message}`);
    this.name = "ModuleQueryResponseError";
  }
}

const fail = (message: string): never => { throw new ModuleQueryResponseError(message); };
const record = (value: unknown, label: string): Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as Readonly<Record<string, unknown>> : fail(`${label} is not an object`);
function keys(value: Readonly<Record<string, unknown>>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort().join(",");
  if (actual !== [...expected].sort().join(",")) fail(`${label} keys ${actual}`);
}
const TIMINGS: readonly ModuleTimingName[] = ["pre_commit", "at_commit", "post_commit", "checkpoint", "review"];
const SUPPRESSION_REASONS: readonly ModuleSuppressionReason[] = ["not_effective", "timing_outside_module", "not_requested", "no_square", "no_second_attempt", "guided_hint_owned_elsewhere"];
const moduleId = (value: unknown): ModuleId => ((MODULE_IDS as readonly unknown[]).includes(value) ? value as ModuleId : fail("unknown module"));
const natural = (value: unknown, label: string): number => (Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : fail(`${label} is not a natural number`));

function parseEmpty(value: unknown): ModuleEmptyState | null {
  if (value === null) return null;
  const item = record(value, "empty");
  if (item.kind === "silent") { keys(item, ["kind"], "empty"); return Object.freeze({ kind: "silent" }); }
  if (item.kind === "stated_absence" || item.kind === "unavailable_source") {
    keys(item, ["kind", "sentence"], "empty");
    if (typeof item.sentence !== "string" || item.sentence.trim() === "") fail("empty sentence");
    return Object.freeze({ kind: item.kind, sentence: item.sentence as string });
  }
  if (item.kind === "family_partitioned") {
    keys(item, ["kind", "families"], "empty");
    if (!Array.isArray(item.families)) fail("families");
    const families = (item.families as unknown[]).map((entry): InspectorFamilyState => {
      const family = record(entry, "family");
      if (!(INSPECTOR_FAMILY_IDS as readonly unknown[]).includes(family.family)) fail("unknown inspector family");
      const id = family.family as InspectorFamilyState["family"];
      if (family.kind === "available") { keys(family, ["family", "kind", "factCount"], "family"); return Object.freeze({ family: id, kind: "available", factCount: natural(family.factCount, "factCount") }); }
      if (family.kind === "unavailable") { keys(family, ["family", "kind", "reason"], "family"); return Object.freeze({ family: id, kind: "unavailable", reason: typeof family.reason === "string" ? family.reason : fail("family reason") }); }
      if (family.kind === "no_witness" || family.kind === "not_requested") { keys(family, ["family", "kind"], "family"); return Object.freeze({ family: id, kind: family.kind }); }
      return fail("family kind");
    });
    return Object.freeze({ kind: "family_partitioned", families: Object.freeze(families) });
  }
  return fail("empty kind");
}

function parsePacket(value: unknown, page: { readonly runId: string; readonly timing: ModuleTimingName; readonly subjectNodeId: string; readonly decisionDigest: string; readonly effectiveConfigDigest: string }): ParsedModulePacket {
  const packet = record(value, "packet");
  keys(packet, ["module", "timing", "initiative", "receipt", "budget", "noveltyAbstained", "empty", "unavailable", "disclosure"], "packet");
  const module = moduleId(packet.module);
  if (packet.timing !== page.timing) fail("packet timing differs from the page");
  if (packet.initiative !== "proactive" && packet.initiative !== "on_request" && packet.initiative !== "explicit_mode") fail("initiative");
  const items = parsePresentationReceipt(packet.receipt);
  const disclosure = record(packet.disclosure, "disclosure") as unknown as ModuleDisclosureReceipt;
  const { digest, ...body } = disclosure;
  if (moduleDisclosureDigest(body) !== digest) fail("disclosure digest mismatch");
  if (disclosure.runId !== page.runId || disclosure.module !== module || disclosure.timing !== page.timing || disclosure.subject.nodeId !== page.subjectNodeId) fail("disclosure answers a different subject");
  if (disclosure.decisionDigest !== page.decisionDigest || disclosure.effectiveConfigDigest !== page.effectiveConfigDigest) fail("disclosure is bound to a different decision or configuration");
  if (disclosure.componentDigests.length !== items.length || disclosure.componentDigests.some((entry, index) => entry !== items[index]!.componentDigest)) fail("disclosure does not bind the delivered components");
  if (!Array.isArray(packet.unavailable)) fail("unavailable");
  const unavailable = (packet.unavailable as unknown[]).map((entry) => { const row = record(entry, "unavailable"); keys(row, ["projection", "reason"], "unavailable"); return Object.freeze({ projection: String(row.projection), reason: String(row.reason) }); });
  if (typeof packet.noveltyAbstained !== "boolean") fail("noveltyAbstained");
  const empty = parseEmpty(packet.empty);
  if ((empty === null) !== (items.length > 0) && module !== "full_inspector") fail("empty state must exist exactly when nothing was delivered");
  return Object.freeze({
    module, timing: page.timing, initiative: packet.initiative as ParsedModulePacket["initiative"], items, budget: packet.budget as ModuleBudgetReceipt,
    noveltyAbstained: packet.noveltyAbstained as boolean, empty, unavailable: Object.freeze(unavailable), disclosure,
  });
}

/**
 * Strict parse. `finalDigest` is the finalized assistance digest this screen currently renders; a
 * page compiled under any other configuration never renders (Checkpoint B).
 */
export function parseModuleQueryPage(value: unknown, expected: { readonly runId: string; readonly subjectNodeId: string; readonly finalDigest: string }): ParsedModuleQueryPage {
  const wrapper = record(value, "response");
  const page = record(wrapper.page ?? value, "page");
  keys(page, ["protocol", "runId", "timing", "subjectNodeId", "decision", "requestedConfigDigest", "effectiveConfigDigest", "packets", "suppressions"], "page");
  if (page.protocol !== MODULE_QUERY_PROTOCOL) fail("protocol");
  if (page.runId !== expected.runId || page.subjectNodeId !== expected.subjectNodeId) fail("page answers a different run or subject");
  if (!(TIMINGS as readonly unknown[]).includes(page.timing)) fail("timing");
  if (page.effectiveConfigDigest !== expected.finalDigest) fail("page was compiled under a different effective configuration");
  const decision = record(page.decision, "decision");
  if (typeof decision.digest !== "string") fail("decision digest");
  const header = { runId: expected.runId, timing: page.timing as ModuleTimingName, subjectNodeId: expected.subjectNodeId, decisionDigest: decision.digest as string, effectiveConfigDigest: expected.finalDigest };
  if (!Array.isArray(page.packets) || !Array.isArray(page.suppressions)) fail("packets and suppressions are arrays");
  const packets = (page.packets as unknown[]).map((packet) => parsePacket(packet, header));
  if (new Set(packets.map((packet) => packet.module)).size !== packets.length) fail("a module delivered twice");
  const suppressions = (page.suppressions as unknown[]).map((entry) => {
    const row = record(entry, "suppression");
    keys(row, ["module", "reason"], "suppression");
    if (!(SUPPRESSION_REASONS as readonly unknown[]).includes(row.reason)) fail("suppression reason");
    return Object.freeze({ module: moduleId(row.module), reason: row.reason as ModuleSuppressionReason });
  });
  return Object.freeze({ ...header, packets: Object.freeze(packets), suppressions: Object.freeze(suppressions) });
}
