import type { RunPage, RunSummary } from "./api.js";

const SESSION_KINDS = new Set(["pack", "position", "imported"]);
const OBJECTIVE_STATES = new Set(["active", "preserved", "degraded", "failed", "achieved", "transitioned"]);
const VIEWER_ROLES = new Set(["host", "participant", "spectator"]);

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function natural(value: unknown, minimum = 0): value is number {
  return Number.isInteger(value) && (value as number) >= minimum;
}

function validRunSummary(value: unknown): value is RunSummary {
  if (typeof value !== "object" || value === null) return false;
  const run = value as Record<string, unknown>;
  const lease = run.leaseHeldBy;
  return nonEmpty(run.id)
    && nonEmpty(run.title)
    && SESSION_KINDS.has(String(run.sessionKind))
    && (run.packId === null || nonEmpty(run.packId))
    && nonEmpty(run.sessionDigest)
    && typeof run.updatedAt === "string"
    && Number.isFinite(Date.parse(run.updatedAt))
    && OBJECTIVE_STATES.has(String(run.objectiveState))
    && natural(run.branchCount, 1)
    && natural(run.recordedMoveCount)
    && VIEWER_ROLES.has(String(run.viewerRole))
    && typeof lease === "object"
    && lease !== null
    && nonEmpty((lease as Record<string, unknown>).learnerId)
    && nonEmpty((lease as Record<string, unknown>).handle);
}

export function assertRunPageResponse(
  value: unknown,
  request: { readonly limit: number; readonly offset: number; readonly priorIds?: ReadonlySet<string> },
): asserts value is RunPage {
  if (typeof value !== "object" || value === null) throw new TypeError("Invalid run page");
  const page = value as { readonly runs?: unknown; readonly selection?: unknown };
  if (!Array.isArray(page.runs) || page.runs.length > request.limit) throw new TypeError("Invalid run page");
  if (typeof page.selection !== "object" || page.selection === null) throw new TypeError("Invalid run page");
  const selection = page.selection as Record<string, unknown>;
  const shown = selection.shown;
  const total = selection.total;
  if (!natural(shown) || !natural(total) || shown !== request.offset + page.runs.length || total < shown) {
    throw new TypeError("Invalid run page");
  }
  const ids = new Set<string>();
  for (const run of page.runs) {
    if (!validRunSummary(run) || ids.has(run.id) || request.priorIds?.has(run.id)) throw new TypeError("Invalid run page");
    ids.add(run.id);
  }
  if (request.offset > 0 && page.runs.length === 0 && total > shown) throw new TypeError("Invalid run page");
}

export function legacyRunPage(runs: readonly RunSummary[], offset: number): RunPage {
  const shown = offset + runs.length;
  return { runs, selection: { shown, total: shown } };
}
