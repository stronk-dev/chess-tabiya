// The closed supervisor ⇄ thread message protocol (rfc/longitudinal-store.md §C). No message carries
// chess-derived rows; the thread publishes its own claims.
import type { LongitudinalWorkerConfig } from "./longitudinal-worker-config.js";

export interface LongitudinalThreadWorkerData {
  readonly databasePath: string;
  readonly storageVersion: number;
  readonly workerId: string;
  readonly config: LongitudinalWorkerConfig;
  /**
   * One shared Int32 cell ([[D3300]]): the supervisor stores 1 to request a drain. The thread reads it
   * at every decision checkpoint, so a drain is honoured mid-projection even though the projection
   * never yields the thread's event loop to the `drain` message.
   */
  readonly drainSignal: SharedArrayBuffer;
}

export type LongitudinalSupervisorMessage = { readonly type: "wake" } | { readonly type: "drain" };

export type LongitudinalThreadMessage =
  | { readonly type: "ready"; readonly databasePath: string; readonly workerId: string }
  | {
    readonly type: "progress"; readonly claimed: number; readonly completed: number; readonly failed: number;
    readonly conflicts: number; readonly renewals: number; readonly abandoned: number;
  }
  | { readonly type: "drained" }
  | { readonly type: "error"; readonly code: "worker_protocol_invalid" | "worker_batch_failed"; readonly message: string };

export function parseLongitudinalThreadMessage(value: unknown): LongitudinalThreadMessage | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  const message = value as Record<string, unknown>;
  const keys = Object.keys(message).sort().join(",");
  const count = (field: string): boolean => Number.isSafeInteger(message[field]) && Number(message[field]) >= 0;
  switch (message.type) {
    case "ready":
      return keys === "databasePath,type,workerId" && typeof message.databasePath === "string" && typeof message.workerId === "string"
        ? message as LongitudinalThreadMessage : undefined;
    case "progress":
      return keys === "abandoned,claimed,completed,conflicts,failed,renewals,type" && ["abandoned", "claimed", "completed", "conflicts", "failed", "renewals"].every(count)
        ? message as LongitudinalThreadMessage : undefined;
    case "drained":
      return keys === "type" ? message as LongitudinalThreadMessage : undefined;
    case "error":
      return keys === "code,message,type" && (message.code === "worker_protocol_invalid" || message.code === "worker_batch_failed") && typeof message.message === "string"
        ? message as LongitudinalThreadMessage : undefined;
    default:
      return undefined;
  }
}
