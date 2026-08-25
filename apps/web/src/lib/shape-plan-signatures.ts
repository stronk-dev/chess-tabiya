export interface ShapePlanSignatureDraft {
  readonly id: string;
  readonly label: string;
  readonly note: string;
  readonly state: "structural" | "uncheckable" | "missing";
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function documentRecord(documentJson: string): Record<string, unknown> {
  const document = record(JSON.parse(documentJson));
  if (document === undefined) throw new TypeError("Shape JSON must be an object");
  return document;
}

export function readShapePlanSignatures(documentJson: string): { readonly valid: boolean; readonly plans: readonly ShapePlanSignatureDraft[] } {
  try {
    const document = documentRecord(documentJson);
    const plans = Array.isArray(document.plans) ? document.plans : [];
    return {
      valid: true,
      plans: plans.map((value, index) => {
        const plan = record(value) ?? {};
        const success = record(plan.success) ?? {};
        return {
          id: typeof plan.id === "string" ? plan.id : `plan-${index + 1}`,
          label: typeof plan.label === "string" ? plan.label : `Plan ${index + 1}`,
          note: typeof success.note === "string" ? success.note : "",
          state: success.signature === null ? "uncheckable" : success.signature === undefined ? "missing" : "structural",
        };
      }),
    };
  } catch {
    return { valid: false, plans: [] };
  }
}

function rewritePlan(documentJson: string, index: number, mutate: (success: Record<string, unknown>) => void): string {
  const document = documentRecord(documentJson);
  if (!Array.isArray(document.plans)) return documentJson;
  const plans = [...document.plans];
  const plan = record(plans[index]);
  if (plan === undefined) return documentJson;
  const nextPlan = { ...plan };
  const success = { ...(record(nextPlan.success) ?? {}) };
  mutate(success);
  nextPlan.success = success;
  plans[index] = nextPlan;
  document.plans = plans;
  return JSON.stringify(document, null, 2);
}

export function markShapePlanUncheckable(documentJson: string, index: number, note: string): string {
  const reason = note.trim();
  if (reason === "") throw new TypeError("An honest-refusal note is required");
  return rewritePlan(documentJson, index, (success) => {
    success.signature = null;
    success.note = reason;
  });
}

export function updateShapePlanRefusalNote(documentJson: string, index: number, note: string): string {
  return rewritePlan(documentJson, index, (success) => {
    if (success.signature !== null) return;
    success.note = note;
  });
}
