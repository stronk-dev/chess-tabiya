/**
 * The `provider-protocol` shared resource (rfc/provider-protocol-register.md;
 * rfc/provider-exchange-and-execution.md criterion 36).
 *
 * `PROVIDER_PROTOCOL_MEMBERS` is the one string tuple the shared-resource catalogue reads
 * (`rfc/shared-resource-registers.json`, `string_tuple` reader). Each member names one provider
 * operation in the register's member grammar: `stockfish.legal_root_table@1` is
 * `stockfish_legal_root_table_v1`. The resource payload below is the literal runtime identity of
 * every operation (provider, endpoint, parser, source projection, source factory, CLI name) plus
 * the ten digest domains; compile-time relations beneath it and `provider-protocol.test.ts` prove the
 * tuple, the payload, the type maps, the registered parsers/factories/CLI arms and the digest
 * registry are one set. A copied list or a count-preserving swap fails there.
 */
import { PROVIDER_DIGEST_DOMAINS } from "./provider-digest.js";
import type { ProviderEndpointMap, ProviderOperationId, ProviderOperationProviderMap, ProviderResponseParserIdMap } from "./provider-types.js";

export const PROVIDER_PROTOCOL_MEMBERS = [
  "lichess_explorer_position_page_v1",
  "maia_policy_page_v1",
  "stockfish_legal_root_table_v1",
  "stockfish_position_evaluation_v1",
  "stockfish_principal_variation_v1",
  "syzygy_position_v1",
] as const;

export const PROVIDER_PROTOCOL_RESOURCE = Object.freeze({
  id: "provider-protocol",
  version: 1,
  payload: Object.freeze({
    operations: Object.freeze([
      Object.freeze({ member: "lichess_explorer_position_page_v1", operation: "lichess_explorer.position_page@1", provider: "lichess_explorer", endpoint: Object.freeze({ kind: "https", origin: "https://explorer.lichess.org", path: "/lichess" }), parserId: "parse.lichess_explorer_position_page@1", sourceProjection: "human.explorer.position_page@1", sourceFactoryId: "createHumanExplorerPositionPageV1Evidence", cliName: "explorer-position-page" }),
      Object.freeze({ member: "maia_policy_page_v1", operation: "maia.policy_page@1", provider: "maia", endpoint: Object.freeze({ kind: "uci_supervisor", engineId: "maia-5m" }), parserId: "parse.maia_policy_page@1", sourceProjection: "human.maia.policy_page@1", sourceFactoryId: "createHumanMaiaPolicyPageV1Evidence", cliName: "maia-policy-page" }),
      Object.freeze({ member: "stockfish_legal_root_table_v1", operation: "stockfish.legal_root_table@1", provider: "stockfish", endpoint: Object.freeze({ kind: "uci_supervisor", engineId: "stockfish-analysis" }), parserId: "parse.stockfish_legal_root_table@1", sourceProjection: "live.stockfish.legal_root_table@1", sourceFactoryId: "createLiveStockfishLegalRootTableV1Evidence", cliName: "stockfish-legal-roots" }),
      Object.freeze({ member: "stockfish_position_evaluation_v1", operation: "stockfish.position_evaluation@1", provider: "stockfish", endpoint: Object.freeze({ kind: "uci_supervisor", engineId: "stockfish-analysis" }), parserId: "parse.stockfish_position_evaluation@1", sourceProjection: "live.stockfish.position_eval@1", sourceFactoryId: "createLiveStockfishPositionEvalV1Evidence", cliName: "stockfish-position-evaluation" }),
      Object.freeze({ member: "stockfish_principal_variation_v1", operation: "stockfish.principal_variation@1", provider: "stockfish", endpoint: Object.freeze({ kind: "uci_supervisor", engineId: "stockfish-analysis" }), parserId: "parse.stockfish_principal_variation@1", sourceProjection: "live.stockfish.principal_variation@1", sourceFactoryId: "createLiveStockfishPrincipalVariationV1Evidence", cliName: "stockfish-principal-variation" }),
      Object.freeze({ member: "syzygy_position_v1", operation: "syzygy.position@1", provider: "syzygy", endpoint: Object.freeze({ kind: "https", origin: "https://tablebase.lichess.org", path: "/standard" }), parserId: "parse.syzygy_position@1", sourceProjection: "live.syzygy.position_result@1", sourceFactoryId: "createLiveSyzygyPositionResultV1Evidence", cliName: "syzygy-position" }),
    ] as const),
    digestDomains: PROVIDER_DIGEST_DOMAINS,
  }),
} as const);

export type ProviderProtocolOperationRow = (typeof PROVIDER_PROTOCOL_RESOURCE.payload.operations)[number];
export type ProviderProtocolMember = (typeof PROVIDER_PROTOCOL_MEMBERS)[number];
export type ProviderCliName = ProviderProtocolOperationRow["cliName"];

/** Register member spelling of one operation id. */
export type ProviderProtocolMemberOf<K extends string> = K extends `${infer Provider}.${infer Operation}@${infer Version}` ? `${Provider}_${Operation}_v${Version}` : never;

export function providerProtocolMember(operation: string): string {
  const match = /^([a-z_]+)\.([a-z_]+)@([1-9][0-9]*)$/u.exec(operation);
  if (match === null) throw new TypeError(`Not a provider operation id: ${operation}`);
  return `${match[1]}_${match[2]}_v${match[3]}`;
}

export function providerProtocolRow<K extends ProviderOperationId>(operation: K): Extract<ProviderProtocolOperationRow, { readonly operation: K }> {
  const row = PROVIDER_PROTOCOL_RESOURCE.payload.operations.find((candidate) => candidate.operation === operation);
  if (row === undefined) throw new TypeError(`Unknown provider operation: ${String(operation)}`);
  return row as Extract<ProviderProtocolOperationRow, { readonly operation: K }>;
}

export const PROVIDER_OPERATION_IDS: readonly ProviderOperationId[] = Object.freeze(PROVIDER_PROTOCOL_RESOURCE.payload.operations.map((row) => row.operation));

// ---------------------------------------------------------------------------------------------
// Compile-time relations: the tuple, the resource rows and the operation-keyed type maps agree.
// ---------------------------------------------------------------------------------------------

type Exactly<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type RowOf<K extends ProviderOperationId> = Extract<ProviderProtocolOperationRow, { readonly operation: K }>;

const RESOURCE_OPERATIONS_ARE_THE_UNION: Exactly<ProviderProtocolOperationRow["operation"], ProviderOperationId> = true;
const MEMBERS_DERIVE_FROM_OPERATIONS: Exactly<ProviderProtocolMember, ProviderProtocolMemberOf<ProviderOperationId>> = true;
const ROW_MEMBERS_DERIVE: Exactly<ProviderProtocolOperationRow["member"], ProviderProtocolMember> = true;

/** Every row's provider, endpoint and parser inhabit exactly its own operation's map arm. */
export type ProviderProtocolTypeRelations = {
  readonly [K in ProviderOperationId]: {
    readonly member: Exactly<RowOf<K>["member"], ProviderProtocolMemberOf<K>>;
    readonly provider: Exactly<RowOf<K>["provider"], ProviderOperationProviderMap[K]>;
    readonly endpoint: RowOf<K>["endpoint"] extends ProviderEndpointMap[K] ? true : false;
    readonly parser: Exactly<RowOf<K>["parserId"], ProviderResponseParserIdMap[K]>;
  };
};
const RELATIONS_HOLD = {
  "stockfish.legal_root_table@1": { member: true, provider: true, endpoint: true, parser: true },
  "stockfish.position_evaluation@1": { member: true, provider: true, endpoint: true, parser: true },
  "stockfish.principal_variation@1": { member: true, provider: true, endpoint: true, parser: true },
  "maia.policy_page@1": { member: true, provider: true, endpoint: true, parser: true },
  "syzygy.position@1": { member: true, provider: true, endpoint: true, parser: true },
  "lichess_explorer.position_page@1": { member: true, provider: true, endpoint: true, parser: true },
} as const satisfies ProviderProtocolTypeRelations;
void RESOURCE_OPERATIONS_ARE_THE_UNION;
void MEMBERS_DERIVE_FROM_OPERATIONS;
void ROW_MEMBERS_DERIVE;
void RELATIONS_HOLD;
