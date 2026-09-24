/**
 * The `import-source-protocol` shared resource (rfc/import-source-protocol-register.md).
 *
 * `IMPORT_SOURCE_PROTOCOL_MEMBERS` is the one string tuple the shared-resource catalogue reads
 * (`rfc/shared-resource-registers.json`, `string_tuple` reader). One tuple owns both faces of the
 * game-import boundary so they cannot widen separately ([[D2278]]): a `request_<kind>` member per
 * `ImportSource.kind` a client may send, and a `source_<kind>` member per durable
 * `imported_games.source_kind`. The process landing seeds the two request kinds and two durable
 * source kinds the shipped importer (`rfc/archive/game-import-and-story.md`) already used; the
 * broadcast pair belongs to `rfc/live-sources.md` and lands only with its claim.
 *
 * Every consumer derives from the tuple below: the server resolver and storage record type, the web
 * API type, and the SQLite CHECK census in `apps/server/src/import-source-protocol.test.ts`.
 */
export const IMPORT_SOURCE_PROTOCOL_MEMBERS = [
  "request_lichess",
  "request_pgn",
  "source_lichess_url",
  "source_pgn_paste",
] as const;

export type ImportSourceProtocolMember = (typeof IMPORT_SOURCE_PROTOCOL_MEMBERS)[number];

type Strip<Member, Prefix extends string> = Member extends `${Prefix}${infer Rest}` ? Rest : never;

/** The request discriminants a client may send to `POST /runs/import`. */
export type ImportSourceRequestKind = Strip<ImportSourceProtocolMember, "request_">;
/** The durable `imported_games.source_kind` values. */
export type ImportSourceKind = Strip<ImportSourceProtocolMember, "source_">;

function facet<Prefix extends string>(prefix: Prefix): readonly Strip<ImportSourceProtocolMember, Prefix>[] {
  return Object.freeze(IMPORT_SOURCE_PROTOCOL_MEMBERS
    .filter((member) => member.startsWith(prefix))
    .map((member) => member.slice(prefix.length) as Strip<ImportSourceProtocolMember, Prefix>));
}

export const IMPORT_SOURCE_REQUEST_KINDS: readonly ImportSourceRequestKind[] = facet("request_");
export const IMPORT_SOURCE_KINDS: readonly ImportSourceKind[] = facet("source_");

export function isImportSourceRequestKind(value: unknown): value is ImportSourceRequestKind {
  return typeof value === "string" && (IMPORT_SOURCE_REQUEST_KINDS as readonly string[]).includes(value);
}

export function isImportSourceKind(value: unknown): value is ImportSourceKind {
  return typeof value === "string" && (IMPORT_SOURCE_KINDS as readonly string[]).includes(value);
}
