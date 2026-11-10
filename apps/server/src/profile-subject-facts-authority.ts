// A.2.5a. Thin private result ownership only; no collector, dispatcher or semantic reducer imports.
// The sole writer import/call is fenced to consumeProfileSubjectFacts by the production AST audit.
import type { LongitudinalSubjectObservationRow } from "./profile-subject-facts-contract.js";
import type { ProfileSubjectDecisionReduction } from "./profile-subject-reduction.js";
import type { LongitudinalSourceImageV4 } from "./longitudinal-source.js";
import { readProfileGameSource, type ProfileGameSource } from "./profile-game-source.js";
interface OriginalSubjectRows { readonly image: LongitudinalSourceImageV4; readonly scope: ProfileGameSource;
  readonly derivedRev: number; readonly summary: readonly ProfileSubjectDecisionReduction[] }
const originals = new WeakMap<readonly LongitudinalSubjectObservationRow[], OriginalSubjectRows>();
function frozenLiteral(value: unknown): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || !Object.isFrozen(value)) return false;
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype || Reflect.ownKeys(value).length !== value.length + 1) return false;
    for (let i = 0; i < value.length; i++) {
      const d = Object.getOwnPropertyDescriptor(value, String(i));
      if (d === undefined || !d.enumerable || !("value" in d) || !frozenLiteral(d.value)) return false;
    }
    return true;
  }
  if (![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  return Reflect.ownKeys(value).every(key => {
    const d = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === "string" && d?.enumerable && "value" in d && frozenLiteral(d.value);
  });
}
/** Internal sole-consumer writer. Not exported from any API or public/runtime barrel. */
export function ownProfileSubjectReduction(rows: readonly LongitudinalSubjectObservationRow[], summary: readonly ProfileSubjectDecisionReduction[],
  image: LongitudinalSourceImageV4, scope: ProfileGameSource, derivedRev: number): readonly LongitudinalSubjectObservationRow[] {
  const source = readProfileGameSource(scope);
  if (source.image !== image || source.identity.derivedRev !== derivedRev || originals.has(rows)
    || !frozenLiteral(rows) || !frozenLiteral(summary)) throw new TypeError("LONGITUDINAL_SUBJECT_ROW_OWNER_INVALID");
  originals.set(rows, Object.freeze({ image, scope, derivedRev, summary }));
  return rows;
}
export function assertProfileSubjectFactOwner(rows: readonly LongitudinalSubjectObservationRow[], image: LongitudinalSourceImageV4, scope: ProfileGameSource, derivedRev: number): void {
  const owner = originals.get(rows), actual = readProfileGameSource(scope);
  if (owner === undefined || owner.image !== image || owner.scope !== scope || owner.derivedRev !== derivedRev
    || actual.image !== image || actual.identity.derivedRev !== derivedRev) throw new TypeError("LONGITUDINAL_SUBJECT_ROW_OWNER_INVALID");
}
export function readProfileSubjectReduction(rows: readonly LongitudinalSubjectObservationRow[], image: LongitudinalSourceImageV4, scope: ProfileGameSource, derivedRev: number): readonly ProfileSubjectDecisionReduction[] {
  assertProfileSubjectFactOwner(rows, image, scope, derivedRev);
  return originals.get(rows)!.summary;
}
