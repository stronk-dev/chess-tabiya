// DISPOSABLE author model — D2552. This selects between facts already computed
// from a canonical recorded path; it performs no chess classification itself.
export type DeflectionObservedInduction = "bait_capture" | "check_induced";

export function deflectionObservedInduction(input: Readonly<{
  readonly baitCaptureMatched: boolean;
  readonly firstEdgeIsCheck: boolean;
}>): DeflectionObservedInduction | undefined {
  if (input.baitCaptureMatched) return "bait_capture";
  if (input.firstEdgeIsCheck) return "check_induced";
  return undefined;
}

export function checkEventForInduction<T>(
  induction: DeflectionObservedInduction,
  firstEdgeCheck: T | undefined,
): T | undefined {
  return induction === "check_induced" ? firstEdgeCheck : undefined;
}
