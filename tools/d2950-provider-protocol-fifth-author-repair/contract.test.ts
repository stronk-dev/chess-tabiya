import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  issueReceiptBytes,
  issueResource,
  openRepositoryAcceptance,
  parseReceiptBytes,
  validateProductLanding,
  type DomainRow,
  type OperationRow,
} from "./model.js";

const operationA: OperationRow = {
  operation: "stockfish.legal_root_table@1",
  provider: "stockfish",
  endpoint: { kind: "uci_supervisor", engineId: "stockfish-analysis" },
  parserId: "parse.stockfish_legal_root_table@1",
  sourceProjection: "stockfish.legal_root_table@1",
  sourceFactoryId: "makeLiveStockfishLegalRootTableEvidence",
  cliName: "stockfish-legal-roots",
};
const operationB: OperationRow = {
  operation: "maia.policy_page@1",
  provider: "maia",
  endpoint: { kind: "uci_supervisor", engineId: "maia-5m" },
  parserId: "parse.maia_policy_page@1",
  sourceProjection: "maia.policy_page@1",
  sourceFactoryId: "makeHumanMaiaPolicyPageEvidence",
  cliName: "maia-policy-page",
};
const domainA: DomainRow = { domain: "engine.binary.v1", constructorId: "digestEngineBinary" };
const domainB: DomainRow = { domain: "provider.request.v1", constructorId: "digestProviderRequest" };
const roots: string[] = [];

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true });
});

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}

function writeSource(root: string, status: "draft" | "accepted"): void {
  writeFileSync(join(root, "rfc/provider-exchange-and-execution.md"), `# Provider exchange\n\n- **Status:** ${status}\n`);
}

function writeReceipt(root: string, bytes: Uint8Array): void {
  writeFileSync(join(root, "planning/provider-protocol-register/accepted-obligations.v1.json"), bytes);
}

function commit(root: string, message: string): void {
  git(root, "add", "-A", ".");
  git(root, "commit", "-q", "-m", message);
}

function acceptedRepo(): { root: string; accepted: Uint8Array } {
  const root = mkdtempSync(join(tmpdir(), "tabiya-provider-protocol-"));
  roots.push(root);
  mkdirSync(join(root, "rfc"), { recursive: true });
  mkdirSync(join(root, "planning/provider-protocol-register"), { recursive: true });
  git(root, "init", "-q");
  git(root, "config", "user.email", "contract@example.invalid");
  git(root, "config", "user.name", "Contract Fixture");

  writeSource(root, "draft");
  commit(root, "draft");
  const accepted = issueReceiptBytes([operationA], [domainA]);
  writeSource(root, "accepted");
  writeReceipt(root, accepted);
  commit(root, "accept");
  return { root, accepted };
}

describe("D2950-D2955 provider-protocol fifth author repair", () => {
  it("D2950 issues authority only from Git-resolved complete first-parent history", () => {
    const { root } = acceptedRepo();
    const authority = openRepositoryAcceptance(root);
    expect(authority.acceptedCommit).toMatch(/^[0-9a-f]{40,64}$/u);
    expect(() => openRepositoryAcceptance(join(root, "not-a-repository"))).toThrow();
    expect(validateProductLanding(authority, issueResource([operationA], [domainA]))).toBe(true);
  });

  it("D2951 binds exact accepted bytes independently of their semantic value", () => {
    const { root, accepted } = acceptedRepo();
    const authority = openRepositoryAcceptance(root);
    const pretty = `${JSON.stringify(JSON.parse(Buffer.from(accepted).toString("utf8")), null, 2)}\n`;
    expect(Buffer.from(pretty).equals(Buffer.from(accepted))).toBe(false);
    writeReceipt(root, Buffer.from(pretty));
    expect(() => validateProductLanding(authority, issueResource([operationA], [domainA]))).toThrow(/WORKTREE_RECEIPT_CHANGED/u);
  });

  it("D2952 observes the index and committed history without caller receipt operands", () => {
    const staged = acceptedRepo();
    const stagedAuthority = openRepositoryAcceptance(staged.root);
    writeReceipt(staged.root, issueReceiptBytes([operationB], [domainB]));
    git(staged.root, "add", "planning/provider-protocol-register/accepted-obligations.v1.json");
    expect(() => validateProductLanding(stagedAuthority, issueResource([operationA], [domainA]))).toThrow(/INDEX_RECEIPT_CHANGED/u);

    const committed = acceptedRepo();
    const committedAuthority = openRepositoryAcceptance(committed.root);
    writeReceipt(committed.root, issueReceiptBytes([operationB], [domainB]));
    commit(committed.root, "replace accepted receipt");
    expect(() => validateProductLanding(committedAuthority, issueResource([operationA], [domainA]))).toThrow(/ACCEPTED_RECEIPT_MUTATED/u);
  });

  it("D2953 rejects duplicate keys before materialized JSON can erase them", () => {
    const valid = Buffer.from(issueReceiptBytes([operationA], [domainA])).toString("utf8");
    const duplicate = valid.replace(/^\{"digestDomains":/u, "{\"schema\":\"erased\",\"digestDomains\":");
    expect(JSON.parse(duplicate).schema).toBe("tabiya.provider-obligations.v1");
    expect(() => parseReceiptBytes(Buffer.from(duplicate))).toThrow(/RECEIPT_BYTES_NONCANONICAL/u);
  });

  it("D2954 reuses the shared RFC-8785 Unicode-scalar authority", () => {
    expect(() => issueReceiptBytes([{ ...operationA, operation: "bad\ud800" }], [domainA])).toThrow(/lone high surrogate/u);
    expect(() => issueReceiptBytes([{ ...operationA, operation: "bad\udc00" }], [domainA])).toThrow(/lone low surrogate/u);
  });

  it("D2955 refuses accepted receipt mutation even when later restored", () => {
    const { root, accepted } = acceptedRepo();
    writeReceipt(root, issueReceiptBytes([operationB], [domainB]));
    commit(root, "mutate v1");
    writeReceipt(root, accepted);
    commit(root, "restore v1");
    expect(() => openRepositoryAcceptance(root)).toThrow(/ACCEPTED_RECEIPT_MUTATED/u);
  });
});
