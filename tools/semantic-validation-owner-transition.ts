// `make semantic-validation-owner-transition-check` (rfc/semantic-validation-authority.md §R4).
//
// Pre-commit: compares repository HEAD with the staged index. CI (`--ci`): compares the checked-out
// commit's first parent with the commit. The guard reads every tree itself; it accepts no admitted
// refs, rows or rulings from a caller.
import { execFileSync } from "node:child_process";

import { assertSemanticValidationOwnerTransition, type SemanticValidationTreeReader } from "../packages/runtime/src/semantic-validation.js";

const ci = process.argv.includes("--ci");
// A shallow checkout with no parent is not an empty prior authority store.
if (ci) execFileSync("git", ["rev-parse", "--verify", "HEAD^1"], { stdio: "pipe" });

function gitReader(treeish: string): SemanticValidationTreeReader {
  return (path) => {
    try {
      return execFileSync("git", ["show", `${treeish}:${path}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      return undefined;
    }
  };
}

function ownerRulings(tree: SemanticValidationTreeReader): ReadonlySet<string> {
  const text = tree("planning/work-state.json");
  const rulings = new Set<string>();
  if (text === undefined) return rulings;
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (value === null || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    if (record.rulingKind === "owner-ledger" && typeof record.ruling === "string" && record.ruling.startsWith("ledger:")) rulings.add(record.ruling.slice("ledger:".length));
    Object.values(record).forEach(walk);
  };
  walk(JSON.parse(text));
  return rulings;
}

const base = gitReader(ci ? "HEAD^1" : "HEAD");
const candidate = gitReader(ci ? "HEAD" : "");
assertSemanticValidationOwnerTransition(base, candidate, ownerRulings);
console.log(`semantic-validation owner transition: ${ci ? "HEAD^1 → HEAD" : "HEAD → index"} ok`);
