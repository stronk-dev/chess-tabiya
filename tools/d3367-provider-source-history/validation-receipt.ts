/** Only for receipt bytes already acquired from the preservation tool's explicit Git tree.
 * Current disk bytes always use the strict storage2 decoder directly.
 */
import type { SemanticValidationReceiptDocument } from "../../packages/runtime/src/semantic-validation.js";
import { decodeSemanticValidationReceipt } from "../../packages/runtime/src/semantic-validation-receipt-storage.js";

export function decodeGitValidationReceipt(text: string): SemanticValidationReceiptDocument {
  const value = JSON.parse(text);
  if (value?.schemaVersion === 2) return decodeSemanticValidationReceipt(text);
  if (value?.schemaVersion !== 1 || Object.hasOwn(value, "sourceDigestVectors") || !Array.isArray(value.cases)
    || value.cases.some((row: { targets?: unknown }) => !Array.isArray(row.targets) || row.targets.some(target =>
      target === null || typeof target !== "object" || Object.hasOwn(target, "sourceDigestVector") || !Array.isArray(target.sourceDigests)))) {
    throw new TypeError("Historical validation receipt must be unambiguous schema1 or storage2");
  }
  return value as SemanticValidationReceiptDocument;
}
