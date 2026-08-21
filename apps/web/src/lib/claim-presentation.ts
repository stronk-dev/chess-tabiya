import type { AuthoredFeedbackItem } from "./api.js";

type ClaimItem = Extract<AuthoredFeedbackItem, { readonly kind: "claim" }>;

function principleText(item: ClaimItem): string {
  return item.principles.map((principle) =>
    `The rest is the author's judgement, resting on: ${principle.name} — ${principle.statement}. It can be wrong when: ${principle.counterCase}.`,
  ).join(" ");
}

export function claimProvenance(item: ClaimItem): string {
  const earned = item.earnedEvidenceTypes.join(", ");
  const unearned = item.evidenceTypes.filter((label) => !item.earnedEvidenceTypes.includes(label));
  if (item.binding === "ledger_bound") {
    const remainder = unearned.length === 0 ? "" : ` Also declared, with no record attached: ${unearned.join(", ")}.`;
    return `Author's claim. Every part of it carries a recorded reading: ${earned}.${remainder}`;
  }
  if (item.binding === "author_attributed") {
    return `Author's claim. Evidence recorded for: ${earned}. ${principleText(item)}`.trim();
  }
  const principle = principleText(item);
  return `Author's claim, author-declared: ${item.evidenceTypes.join(", ")}. No machine record is attached.${principle === "" ? "" : ` ${principle}`}`;
}
