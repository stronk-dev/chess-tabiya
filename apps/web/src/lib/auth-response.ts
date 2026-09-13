import type { Learner } from "./api.js";

export function validAuthenticatedLearner(value: Learner): boolean {
  return value.id.trim().length > 0
    && value.handle.trim().length > 0
    && value.createdAt.trim().length > 0
    && !Number.isNaN(Date.parse(value.createdAt));
}
