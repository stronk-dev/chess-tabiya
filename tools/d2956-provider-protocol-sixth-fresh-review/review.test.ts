import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  issueReceiptBytes,
  issueResource,
  openRepositoryAcceptance,
  validateProductLanding,
  type DomainRow,
  type OperationRow,
} from "../d2950-provider-protocol-fifth-author-repair/model.js";

const receiptPath = "planning/provider-protocol-register/accepted-obligations.v1.json";
const sourcePath = "rfc/provider-exchange-and-execution.md";
const archivePath = "rfc/archive/provider-exchange-and-execution.md";

const operation: OperationRow = {
  operation: "stockfish.legal_root_table@1",
  provider: "stockfish",
  endpoint: { kind: "uci_supervisor", engineId: "stockfish-analysis" },
  parserId: "parse.stockfish_legal_root_table@1",
  sourceProjection: "stockfish.legal_root_table@1",
  sourceFactoryId: "makeLiveStockfishLegalRootTableEvidence",
  cliName: "stockfish-legal-roots",
};
const domain: DomainRow = {
  domain: "engine.binary.v1",
  constructorId: "digestEngineBinary",
};
const roots: string[] = [];

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true });
});

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}

function writeSource(root: string, status: string): void {
  writeFileSync(join(root, sourcePath), `# Provider exchange\n\n- **Status:** ${status}\n`);
}

function commit(root: string, message: string): void {
  git(root, "add", "-A", ".");
  git(root, "commit", "-q", "-m", message);
}

function acceptedRepository(): string {
  const root = mkdtempSync(join(tmpdir(), "tabiya-provider-protocol-review-"));
  roots.push(root);
  mkdirSync(join(root, "rfc/archive"), { recursive: true });
  mkdirSync(join(root, "planning/provider-protocol-register"), { recursive: true });
  git(root, "init", "-q");
  git(root, "config", "user.email", "review@example.invalid");
  git(root, "config", "user.name", "Fresh Review");
  writeSource(root, "draft");
  commit(root, "draft");
  writeSource(root, "accepted");
  writeFileSync(join(root, receiptPath), issueReceiptBytes([operation], [domain]));
  commit(root, "accept");
  return root;
}

describe("D2956-D2959 provider-protocol sixth fresh independent review", () => {
  it("D2956 rejects the first legal implementing successor after acceptance", () => {
    const root = acceptedRepository();
    writeSource(root, "implementing — product landing");
    commit(root, "implement");

    expect(() => openRepositoryAcceptance(root)).toThrow(/SOURCE_STATUS/u);
  });

  it("D2956 rejects the legal archive successor after acceptance", () => {
    const root = acceptedRepository();
    renameSync(join(root, sourcePath), join(root, archivePath));
    commit(root, "archive implemented RFC");

    expect(() => openRepositoryAcceptance(root)).toThrow(/ACCEPTANCE_REGRESSION/u);
  });

  it("D2957 mints authority from an independently constructed lookalike repository", () => {
    const lookalike = acceptedRepository();
    const authority = openRepositoryAcceptance(lookalike);

    expect(validateProductLanding(authority, issueResource([operation], [domain]))).toBe(true);
  });

  it("D2958 ignores a withdrawn source RFC in the worktree during landing", () => {
    const root = acceptedRepository();
    const authority = openRepositoryAcceptance(root);
    writeSource(root, "withdrawn — product landing forbidden");

    expect(validateProductLanding(authority, issueResource([operation], [domain]))).toBe(true);
  });

  it("D2959 validates a caller-built resource while the product root is absent", () => {
    const root = acceptedRepository();
    const authority = openRepositoryAcceptance(root);
    const productRoot = join(root, "packages/runtime/src/provider-protocol.ts");

    expect(existsSync(productRoot)).toBe(false);
    expect(validateProductLanding(authority, issueResource([operation], [domain]))).toBe(true);
  });
});
