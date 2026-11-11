// `make semantic-validation-owner-transition-check` (rfc/semantic-validation-authority.md §R4).
//
// Pre-commit: compares repository HEAD with the staged index. CI (`--ci`): compares the checked-out
// commit's first parent with the commit. The guard reads every tree itself; it accepts no admitted
// refs, rows or rulings from a caller.
import { execFileSync } from "node:child_process";

import { assertSemanticValidationOwnerTransition, type SemanticValidationTreeReader } from "../packages/runtime/src/semantic-validation-owner-transition.js";

const ci = process.argv.includes("--ci");
// A shallow checkout with no parent is not an empty prior authority store.
if (ci) execFileSync("git", ["rev-parse", "--verify", "HEAD^1"], { stdio: "pipe" });

function gitReader(treeish: string): SemanticValidationTreeReader {
  return (path) => {
    const object = `${treeish}:${path}`;
    // Git's NUL-delimited batch protocol distinguishes absence from transport failure.
    // One source blob (<5 MiB) plus its small protocol header must fit the output buffer.
    const output = execFileSync("git", ["cat-file", "--batch", "-Z"], {
      input: `${object}\0`, maxBuffer: 5 * 1024 * 1024 + 1024, stdio: ["pipe", "pipe", "pipe"],
    });
    const separator = output.indexOf(0);
    if (separator < 0) throw new Error(`Invalid Git object response for ${object}`);
    const header = output.subarray(0, separator).toString("utf8");
    if (header === `${object} missing`) return undefined;
    const match = /^(?:[0-9a-f]{40}|[0-9a-f]{64}) blob (\d+)$/u.exec(header);
    const size = match === null ? -1 : Number(match[1]);
    if (size < 0 || output.length !== separator + size + 2 || output[output.length - 1] !== 0) {
      throw new Error(`Invalid Git blob response for ${object}`);
    }
    return output.subarray(separator + 1, separator + 1 + size).toString("utf8");
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
