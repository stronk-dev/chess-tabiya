import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";

import {
  OBJECTIVE_TYPES,
  type DrillPackDefinition,
  type ObjectiveType,
  type SpineNode,
} from "./types.js";

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const SEMVER_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export interface DrillUrl {
  readonly kind: "drill";
  readonly packId: string;
  readonly version: string;
  readonly spineNodeId?: string;
}

export interface FenUrl {
  readonly kind: "fen";
  readonly fen: string;
  readonly objectiveType: ObjectiveType;
}

export type DrillAddress = DrillUrl | FenUrl;

export type ResolvedDrill<TPack extends DrillPackDefinition> =
  | {
      readonly kind: "pack";
      readonly pack: TPack;
      readonly spineNodeId?: string;
    }
  | {
      readonly kind: "fen";
      readonly start: { readonly fen: string };
      readonly objective: { readonly type: ObjectiveType };
    };

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch (cause) {
    throw new TypeError("Drill URL contains malformed percent encoding", { cause });
  }
}

function assertFen(fen: string): void {
  try {
    Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  } catch (cause) {
    throw new TypeError("Drill URL contains an invalid standard-chess FEN", { cause });
  }
}

function assertObjectiveType(value: string): asserts value is ObjectiveType {
  if (!(OBJECTIVE_TYPES as readonly string[]).includes(value)) {
    throw new TypeError(`Unknown drill objective type: ${value}`);
  }
}

function assertDrillIdentity(packId: string, version: string, spineNodeId?: string): void {
  if (!ID_PATTERN.test(packId)) throw new TypeError(`Invalid pack id: ${packId}`);
  if (!SEMVER_PATTERN.test(version)) throw new TypeError(`Invalid pack version: ${version}`);
  if (spineNodeId !== undefined && !ID_PATTERN.test(spineNodeId)) {
    throw new TypeError(`Invalid spine node id: ${spineNodeId}`);
  }
}

export function formatDrillUrl(
  packId: string,
  version: string,
  spineNodeId?: string,
): string {
  assertDrillIdentity(packId, version, spineNodeId);
  return `/drill/${encodeURIComponent(packId)}@${encodeURIComponent(version)}${
    spineNodeId === undefined ? "" : `/${encodeURIComponent(spineNodeId)}`
  }`;
}

export function formatFenUrl(fen: string, objectiveType: ObjectiveType): string {
  assertFen(fen);
  assertObjectiveType(objectiveType);
  return `/fen/${encodeURIComponent(fen)}/${encodeURIComponent(objectiveType)}`;
}

export function parseDrillAddress(path: string): DrillAddress {
  if (path.includes("?") || path.includes("#")) {
    throw new TypeError("Drill URL must not contain a query or fragment");
  }
  const drill = /^\/drill\/([^/@]+)@([^/]+)(?:\/([^/]+))?$/.exec(path);
  if (drill) {
    const packId = decode(drill[1]!);
    const version = decode(drill[2]!);
    const spineNodeId = drill[3] === undefined ? undefined : decode(drill[3]);
    assertDrillIdentity(packId, version, spineNodeId);
    return {
      kind: "drill",
      packId,
      version,
      ...(spineNodeId === undefined ? {} : { spineNodeId }),
    };
  }

  const bareFen = /^\/fen\/([^/]+)\/([^/]+)$/.exec(path);
  if (bareFen) {
    const fen = decode(bareFen[1]!);
    const objectiveType = decode(bareFen[2]!);
    assertFen(fen);
    assertObjectiveType(objectiveType);
    return { kind: "fen", fen, objectiveType };
  }
  throw new TypeError(`Unsupported drill URL: ${path}`);
}

function hasSpineNode(nodes: readonly SpineNode[], nodeId: string): boolean {
  return nodes.some(
    (node) => node.id === nodeId || hasSpineNode(node.children, nodeId),
  );
}

export function resolveDrillAddress<TPack extends DrillPackDefinition>(
  path: string,
  packs: readonly TPack[],
): ResolvedDrill<TPack> {
  const address = parseDrillAddress(path);
  if (address.kind === "fen") {
    return {
      kind: "fen",
      start: { fen: address.fen },
      objective: { type: address.objectiveType },
    };
  }

  const pack = packs.find(
    (candidate) =>
      candidate.id === address.packId && candidate.version === address.version,
  );
  if (!pack) {
    throw new TypeError(`Unknown drill pack: ${address.packId}@${address.version}`);
  }
  if (
    address.spineNodeId !== undefined &&
    !hasSpineNode(pack.spine ?? [], address.spineNodeId)
  ) {
    throw new TypeError(`Unknown spine node: ${address.spineNodeId}`);
  }
  return {
    kind: "pack",
    pack,
    ...(address.spineNodeId === undefined
      ? {}
      : { spineNodeId: address.spineNodeId }),
  };
}
