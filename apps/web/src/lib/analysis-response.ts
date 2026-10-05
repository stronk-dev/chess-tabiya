/** Existing POST /analysis 202 wire contract; admission is not provider completion. */
export interface AnalysisJob {
  readonly id: string;
  readonly nodeId: string;
  readonly kind: "bestline";
}
export interface AnalysisAdmission {
  readonly batchId: string;
  readonly jobs: readonly AnalysisJob[];
}
export interface PendingAnalysisJob extends AnalysisJob {
  readonly batchId: string;
}

function identifier(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}
function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
    throw new TypeError("Analysis admission has an invalid shape");
  }
  return value as Record<string, unknown>;
}

export function analysisRequestNodes(nodeIds: readonly string[]): readonly string[] {
  if (!Array.isArray(nodeIds) || nodeIds.length < 1 || nodeIds.length > 16
    || nodeIds.some(nodeId => !identifier(nodeId)) || new Set(nodeIds).size !== nodeIds.length) {
    throw new TypeError("Analysis requires 1–16 distinct position identifiers");
  }
  return Object.freeze([...nodeIds]);
}

export function parseAnalysisAdmission(value: unknown, nodeIds: readonly string[]): AnalysisAdmission {
  const nodes = analysisRequestNodes(nodeIds);
  const receipt = record(value, ["batchId", "jobs"]);
  if (!identifier(receipt.batchId) || !Array.isArray(receipt.jobs) || receipt.jobs.length !== nodes.length) {
    throw new TypeError("Analysis admission has no exact requested batch");
  }
  const seen = new Set<string>();
  const jobs = receipt.jobs.map((value, index) => {
    const job = record(value, ["id", "nodeId", "kind"]);
    if (!identifier(job.id) || seen.has(job.id) || job.nodeId !== nodes[index] || job.kind !== "bestline") {
      throw new TypeError("Analysis admission does not match its requested positions");
    }
    seen.add(job.id);
    return Object.freeze({ id: job.id, nodeId: nodes[index]!, kind: "bestline" as const });
  });
  return Object.freeze({ batchId: receipt.batchId, jobs: Object.freeze(jobs) });
}
