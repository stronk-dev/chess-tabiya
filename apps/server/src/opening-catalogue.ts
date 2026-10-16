import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { transposeKey, CHESS_OPENINGS_COMMIT, CHESS_OPENINGS_RETRIEVED_AT, OPENING_SOURCE_ID, OPENING_CATALOGUE_FILES, OPENING_CATALOGUE_COMPILER_FILES, admitInstalledOpeningCatalogue, compileLoadedOpeningCatalogue, type OpeningCatalogueAvailability, type OpeningCatalogueSourceInput, type OpeningCatalogueCompilerInput, type RuntimeOpeningCatalogue } from "@chess-tabiya/runtime";
import { normalizeOpeningPgn, parseRows } from "./sourcing/openings.js";

export {
  CHESS_OPENINGS_COMMIT,
  CHESS_OPENINGS_RETRIEVED_AT,
  OPENING_SOURCE_ID,
  OPENING_CATALOGUE_PROJECTION_IDS,
  OPENING_CATALOGUE_FILES,
  OPENING_CATALOGUE_COMPILER_FILES,
  type OpeningCatalogueFileName,
  type OpeningCatalogueUnavailableReason,
  type RuntimeOpeningCatalogue,
  type OpeningCatalogueRef,
  type OpeningCatalogueUnavailable,
  type CurrentOpeningEndpoint,
  type OpeningCatalogueMembership,
  type RecordedOpeningPosition as RecordedPosition,
  type DeepestOpeningReached,
  type CompiledOpeningCatalogue,
  type OpeningCatalogueAvailability,
  type OpeningCatalogueSourceInput,
  type OpeningCatalogueCompilerInput,
  compileLoadedOpeningCatalogue,
  openingIdentityAt,
  recordedOpeningPosition,
  deepestOpeningReached,
  deriveDeepestOpeningVisits,
  renderCurrentOpeningEndpoint,
  renderOpeningMembership,
  renderDeepestOpeningReached,
} from "@chess-tabiya/runtime";

function sha256(value: string | Uint8Array): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function lengthDelimitedDigest(files: readonly OpeningCatalogueCompilerInput[]): string {
  const hash = createHash("sha256");
  for (const file of [...files].sort((left, right) => left.path.localeCompare(right.path))) {
    const path = Buffer.from(file.path, "utf8");
    const size = Buffer.allocUnsafe(8);
    size.writeBigUInt64BE(BigInt(path.byteLength));
    hash.update(size).update(path);
    size.writeBigUInt64BE(BigInt(file.bytes.byteLength));
    hash.update(size).update(file.bytes);
  }
  return `sha256:${hash.digest("hex")}`;
}

export function compileRuntimeOpeningCatalogue(
  sourceFiles: readonly OpeningCatalogueSourceInput[],
  compilerFiles: readonly OpeningCatalogueCompilerInput[],
): RuntimeOpeningCatalogue {
  const sourceByName = new Map(sourceFiles.map((file) => [file.name, file]));
  if (sourceByName.size !== OPENING_CATALOGUE_FILES.length || sourceFiles.length !== OPENING_CATALOGUE_FILES.length) {
    throw new TypeError("Opening catalogue compiler requires exactly a.tsv through e.tsv");
  }
  const declaredCompilerPaths = [...OPENING_CATALOGUE_COMPILER_FILES].sort();
  const actualCompilerPaths = compilerFiles.map((file) => file.path).sort();
  if (actualCompilerPaths.join("\0") !== declaredCompilerPaths.join("\0")) {
    throw new TypeError(`Opening catalogue compiler source closure mismatch: ${actualCompilerPaths.join(", ")}`);
  }

  const namedEndpoints: RuntimeOpeningCatalogue["namedEndpoints"][number][] = [];
  const membership = new Map<string, number>();
  const endpointKeys = new Set<string>();
  for (const fileName of OPENING_CATALOGUE_FILES) {
    const file = sourceByName.get(fileName);
    if (file === undefined) throw new TypeError(`Opening catalogue source is missing ${fileName}`);
    const rows = parseRows(Buffer.from(file.bytes).toString("utf8"));
    for (const [index, row] of rows.entries()) {
      const moves = normalizeOpeningPgn(row.pgn);
      const endpoint = transposeKey(moves.at(-1)!.fen);
      if (endpointKeys.has(endpoint)) throw new TypeError(`Duplicate named opening endpoint at ${fileName}:${index + 2}`);
      endpointKeys.add(endpoint);
      namedEndpoints.push(Object.freeze({ key: endpoint, eco: row.eco, name: row.name, sourcePly: moves.length, sourceFile: fileName, sourceRow: index + 2 }));
      for (const key of new Set(moves.map((move) => transposeKey(move.fen)))) membership.set(key, (membership.get(key) ?? 0) + 1);
    }
  }
  namedEndpoints.sort((left, right) => left.key.localeCompare(right.key));
  const pathMembership = [...membership].map(([key, descendantEndpointCount]) => Object.freeze({ key, descendantEndpointCount })).sort((left, right) => left.key.localeCompare(right.key));
  const source = Object.freeze({
    id: OPENING_SOURCE_ID,
    commit: CHESS_OPENINGS_COMMIT,
    retrievedAt: CHESS_OPENINGS_RETRIEVED_AT,
    licence: "CC0-1.0" as const,
    files: Object.freeze(OPENING_CATALOGUE_FILES.map((name) => {
      const bytes = sourceByName.get(name)!.bytes;
      return Object.freeze({ name, bytes: bytes.byteLength, sha256: sha256(bytes) });
    })),
    compilerFiles: Object.freeze([...compilerFiles].sort((left, right) => left.path.localeCompare(right.path)).map((file) => Object.freeze({ path: file.path, sha256: sha256(file.bytes) }))),
    compilerDigest: lengthDelimitedDigest(compilerFiles),
  });
  const withoutDigest = Object.freeze({ source, namedEndpoints: Object.freeze(namedEndpoints), pathMembership: Object.freeze(pathMembership) });
  return Object.freeze({ ...withoutDigest, digest: sha256(canonicalizeJson(withoutDigest)) });
}

export async function loadOpeningCatalogue(path: string): Promise<OpeningCatalogueAvailability> {
  let text: string;
  try { text = await readFile(path, "utf8"); }
  catch { return Object.freeze({ kind: "unavailable", reason: "artifact_missing" }); }
  let value: unknown;
  try { value = JSON.parse(text) as unknown; }
  catch { return Object.freeze({ kind: "unavailable", reason: "artifact_invalid" }); }
  return admitInstalledOpeningCatalogue(value);
}
