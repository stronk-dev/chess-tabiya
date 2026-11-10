// The finite computed machine result's original issuing scope. Never serialized or restored.
import type { LongitudinalChoiceFactRow } from "./profile-choice-facts-contract.js";
import type { LongitudinalSourceImageV4 } from "./longitudinal-source.js";
import { readProfileGameSource, type ProfileGameSource } from "./profile-game-source.js";
const originals = new WeakMap<object, Readonly<{ image: LongitudinalSourceImageV4; scope: ProfileGameSource | undefined }>>();
/** Sole caller is consumeProfileChoiceFacts; the permanent production importer audit checks it. */
export function ownProfileChoiceFact(row: LongitudinalChoiceFactRow, image: LongitudinalSourceImageV4, scope?: ProfileGameSource): LongitudinalChoiceFactRow {
  if (scope !== undefined && readProfileGameSource(scope).image !== image) throw new TypeError("LONGITUDINAL_CHOICE_ROW_OWNER_INVALID");
  originals.set(row, Object.freeze({ image, scope })); return row;
}
export function readProfileChoiceFactOwner(row: LongitudinalChoiceFactRow) {
  const owner = originals.get(row);
  if (owner === undefined || owner.scope !== undefined && readProfileGameSource(owner.scope).image !== owner.image) throw new TypeError("LONGITUDINAL_CHOICE_ROW_OWNER_INVALID");
  return owner;
}
