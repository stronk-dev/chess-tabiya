import type { HumanSplitPage } from "./api.js";
import { parseSelectionCandidates, parseSelectionEngine } from "./opponent-selection-response.js";
import { parseMaiaNodeDistributionOperands, parsePresentationReceipt, exactLegalMoves, type HumanSplitPageV2 } from "@chess-tabiya/runtime/client";

type RecordValue = Readonly<Record<string, unknown>>;

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

function integer(value: unknown, label: string, minimum = Number.MIN_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) throw new TypeError(`${label} must be a safe integer`);
  return Number(value);
}


function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function parseHumanSplitPage(value: unknown, requestedNodeId: string, requestedFen?: string): HumanSplitPage {
  const item = record(value, "human-split");
  // A supplied discriminator is authoritative; malformed modern responses never retry legacy.
  if ("protocol" in item && !Object.hasOwn(item, "protocol")) throw new TypeError("human-split protocol must be an own field");
  if (Object.hasOwn(item, "protocol")) return parseModernHumanSplitPage(item, requestedNodeId, requestedFen);
  exact(item, ["nodeId", "engine", "targetElo", "candidates"], "human-split");
  const nodeId = nonempty(item.nodeId, "human-split/nodeId"); if (nodeId !== requestedNodeId) throw new TypeError("human-split response does not match the requested node");
  parseSelectionEngine(item.engine, "human-split/engine"); if (item.targetElo !== null) integer(item.targetElo, "human-split/targetElo", 0); parseSelectionCandidates(item.candidates, "human-split/candidates");
  return deepFreeze(structuredClone(item)) as unknown as HumanSplitPage;
}

function parseModernHumanSplitPage(item: RecordValue, requestedNodeId: string, requestedFen?: string): HumanSplitPageV2 {
  const keys = ["protocol", "nodeId", "status", "engine", "requestedBand", "appliedBand", "coverage", "candidates", "presentation"];
  if (keys.some(key => !Object.hasOwn(item, key)) || Object.keys(item).some(key => !keys.includes(key))
    || item.protocol !== "inspector.human_split@2") throw new TypeError("human-split modern response has an invalid closed shape/protocol");
  const operands = parseMaiaNodeDistributionOperands({ nodeId: item.nodeId, engine: item.engine, requestedBand: item.requestedBand,
    appliedBand: item.appliedBand, coverage: item.coverage, candidates: item.candidates }, "human-split/operands");
  parseSelectionEngine(operands.engine, "human-split/engine");
  if (operands.nodeId !== requestedNodeId) throw new TypeError("human-split response does not match the requested node");
  const status = oneOf(item.status, ["shown", "empty_population"] as const, "human-split/status");
  if ((status === "shown") !== (operands.candidates.length > 0)) throw new TypeError("human-split status does not match its reported rows");
  if (requestedFen !== undefined) {
    const legal = new Set(exactLegalMoves(requestedFen).map(move => move.uci));
    if (operands.candidates.some(row => !legal.has(row.moveUci))) throw new TypeError("human-split response contains a noncanonical or illegal move at the requested position");
  }
  // Admit the original own-key image, then validate a plain JSON snapshot as well. This supports
  // reactive state without structuredClone(proxy), and never invokes the process-only serializer.
  parsePresentationReceipt(item.presentation);
  const presentation: unknown = JSON.parse(JSON.stringify(item.presentation));
  const items = parsePresentationReceipt(presentation);
  if (items.length !== (status === "shown" ? 1 : 0)) throw new TypeError("human-split receipt does not match its reported population");
  for (const entry of items) {
    if (entry.adapter.consumer.id !== "inspector.human_split" || entry.adapter.consumer.version !== 2
      || entry.adapter.projection.id !== "derived.maia.node_distribution" || entry.adapter.projection.version !== 1
      || entry.component.id !== "fact_statement" || entry.component.operand.rendererId !== "consumer.maia_node_distribution@1") throw new TypeError("human-split receipt uses another source, consumer or renderer");
    if (entry.component.operand.binding !== "declared_convention" || entry.component.operand.convention !== "maia-reported-window@1") throw new TypeError("human-split receipt uses another fact binding or convention");
    const presented = parseMaiaNodeDistributionOperands(entry.component.operand.operands, "human-split/presented operands");
    if (JSON.stringify(presented) !== JSON.stringify(operands)) throw new TypeError("human-split receipt operands do not match its node, model, band and complete ordered rows");
  }
  return Object.freeze({ protocol: "inspector.human_split@2", status, ...operands,
    presentation: deepFreeze(presentation) as HumanSplitPageV2["presentation"] });
}
