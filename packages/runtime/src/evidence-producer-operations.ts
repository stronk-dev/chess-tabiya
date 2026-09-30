/**
 * Producer-operation authority (rfc/bounded-policy-targets.md §4.2), the producer analogue of the
 * consumer-operation census. Every manifest producer whose latency is `background` has exactly one
 * registered production operation; `sync` work cannot be registered and nothing can be omitted.
 */
import type { ProducerDeclaration, VersionedEvidenceId } from "./evidence-contract.js";

export interface EvidenceProducerOperation {
  readonly producer: VersionedEvidenceId;
  readonly operationSymbol: string;
  readonly operation: CallableFunction;
}

export function evidenceProducerOperation(id: string, operationSymbol: string, operation: CallableFunction): EvidenceProducerOperation {
  if (id.trim() === "") throw new TypeError("Evidence producer operation id must not be empty");
  if (operationSymbol.trim() === "") throw new TypeError(`Evidence producer operation ${id} needs a symbol`);
  if (typeof operation !== "function") throw new TypeError(`Evidence producer operation ${id} must be callable`);
  return Object.freeze({ producer: Object.freeze({ id, version: 1 }), operationSymbol, operation });
}

/** The exact producer → operation-symbol mapping each background producer must register. */
export const EVIDENCE_PRODUCER_OPERATION_SYMBOLS: Readonly<Record<string, string>> = Object.freeze({
  "derived.bounded_target@1": "BoundedTargetBackgroundService.submit",
});

export function assertEvidenceProducerOperations(producers: readonly ProducerDeclaration[], operations: readonly EvidenceProducerOperation[]): void {
  const expected = producers.filter((producer) => producer.latency === "background").map((producer) => `${producer.id}@${producer.version}`).sort();
  const keys = operations.map((entry) => `${entry.producer.id}@${entry.producer.version}`);
  if (new Set(keys).size !== keys.length) throw new TypeError("Evidence producer operations contain a duplicate producer");
  const symbols = operations.map((entry) => entry.operationSymbol);
  if (new Set(symbols).size !== symbols.length) throw new TypeError("Evidence producer operations contain a duplicate symbol");
  if ([...keys].sort().join("\0") !== expected.join("\0")) throw new TypeError(`Evidence producer operations are not set-equal to the background producers (${expected.join(", ")})`);
  for (const entry of operations) {
    if (entry.producer.version !== 1) throw new TypeError(`Evidence producer operation ${entry.producer.id} has unsupported version ${entry.producer.version}`);
    const symbol = EVIDENCE_PRODUCER_OPERATION_SYMBOLS[`${entry.producer.id}@${entry.producer.version}`];
    if (symbol !== entry.operationSymbol) throw new TypeError(`Evidence producer ${entry.producer.id} registers ${entry.operationSymbol}, not ${symbol ?? "(none)"}`);
    const method = entry.operationSymbol.split(".").at(-1);
    if (entry.operation.name !== method) throw new TypeError(`Evidence producer ${entry.producer.id} operation is ${entry.operation.name}, not ${method}`);
  }
}
