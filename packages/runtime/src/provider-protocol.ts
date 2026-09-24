/**
 * The `provider-protocol` shared resource (rfc/provider-protocol-register.md).
 *
 * `PROVIDER_PROTOCOL_MEMBERS` is the one string tuple the shared-resource catalogue reads
 * (`rfc/shared-resource-registers.json`, `string_tuple` reader). Each member names one provider
 * operation that `rfc/provider-exchange-and-execution.md` claims and lands. The process landing
 * introduces the resource with no members; the product landing adds them.
 */
export const PROVIDER_PROTOCOL_MEMBERS = [] as const;
