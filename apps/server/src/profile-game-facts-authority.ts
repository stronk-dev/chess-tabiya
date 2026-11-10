// Private association for the actual machine result; never serialized, restored or reconstructed.
import type { LongitudinalSourceImageV4 } from "./longitudinal-source.js";
import type { LongitudinalGameFactRow } from "./profile-game-facts-contract.js";
import { readProfileGameSource, type ProfileGameSource } from "./profile-game-source.js";
const originals = new WeakMap<object, Readonly<{ image: LongitudinalSourceImageV4; scope: ProfileGameSource | undefined }>>();
/** Sole issuer: consumeProfileGameFacts, checked by the production importer audit. */
export function ownProfileGameFact(row: LongitudinalGameFactRow, image: LongitudinalSourceImageV4, scope?: ProfileGameSource): LongitudinalGameFactRow {
  if (scope !== undefined && readProfileGameSource(scope).image !== image) throw new TypeError("LONGITUDINAL_GAME_ROW_OWNER_INVALID");
  originals.set(row, Object.freeze({ image, scope }));
  return row;
}
export function readProfileGameFactOwner(row: LongitudinalGameFactRow) {
  const owner = originals.get(row);
  if (owner === undefined || owner.scope !== undefined && readProfileGameSource(owner.scope).image !== owner.image) throw new TypeError("LONGITUDINAL_GAME_ROW_OWNER_INVALID");
  return owner;
}
