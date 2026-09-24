/**
 * The `semantic-conventions` shared resource (rfc/semantic-convention-register.md).
 *
 * `SEMANTIC_CONVENTION_MEMBERS` is the literal string tuple the shared-resource catalogue reads
 * (`rfc/shared-resource-registers.json`, `string_tuple` reader). It is introduced empty by the
 * process RFC so the resource is present before any product claim; one member per landed
 * convention `id@version`, spelled in the register's member grammar (`defence-duty@1` is
 * `defence_duty_v1`). `rfc/semantic-convention-provenance.md` claims and lands the members.
 */
export const SEMANTIC_CONVENTION_MEMBERS = [] as const;
