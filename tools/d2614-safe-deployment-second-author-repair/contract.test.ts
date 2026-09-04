import { describe, expect, it } from "vitest";
import {
  admitProfileStart,
  advanceProfileTransition,
  beginProfileTransition,
  compileDeploymentConfig,
  compileDeploymentSuccess,
  executeDeploymentCheck,
  loadCompiledDeploymentImage,
  parseDeploymentArtifacts,
  parseDeploymentOperationId,
  parseSha256,
  parseTlsIdentity,
  renderCompiledDeploymentImage,
  requiredChecks,
  sha256,
  type ActiveProfileState,
  type CheckInput,
  type DeploymentArtifacts,
  type DeploymentOperation,
  type DeploymentProfile,
} from "./contract.js";

const file = { absolute: true, regular: true, symlink: false, sameInode: true, mode: 0o600 } as const;
const op = parseDeploymentOperationId("123e4567-e89b-42d3-a456-426614174000");
const digest = (char: string) => parseSha256(`sha256:${char.repeat(64)}`);
const now = "2026-09-04T12:00:00.000Z";
const tls = parseTlsIdentity({ leafSha256: digest("1"), spkiSha256: digest("2"), chainSha256: digest("3"), hostname: "chess.example", notBefore: "2026-09-01T00:00:00.000Z", notAfter: "2026-12-01T00:00:00.000Z" }, "chess.example", now);

function artifacts(profile: DeploymentProfile, operation: DeploymentOperation, imageDigest = digest("4")): DeploymentArtifacts {
  return parseDeploymentArtifacts({ deploymentRevision: "abc123", serverImageDigest: digest("5"), caddyImageDigest: profile === "local" ? null : digest("6"), composeDigest: digest("7"), caddyConfigDigest: profile === "local" ? null : digest("8"), routeBudgetManifestDigest: digest("9"), compiledConfigImageDigest: imageDigest, tlsIdentity: profile === "local" || operation === "check" ? null : tls }, profile, operation);
}

function checkInput(check: ReturnType<typeof requiredChecks>[number], imageDigest: ReturnType<typeof digest>): CheckInput {
  if (check === "hostname_resolution") return { kind: check, expected: ["192.0.2.1"], actual: ["192.0.2.1"] };
  if (check === "certificate") return { kind: check, identity: tls, hostname: "chess.example", at: now };
  if (check === "origin" || check === "cookie") return { kind: check, expected: "same", actual: "same" };
  if (check === "readiness") return { kind: check, status: 200, ready: true, imageDigest, expectedImageDigest: imageDigest };
  return { kind: check, expected: digest("a"), actual: digest("a") };
}

describe("safe deployment second author repair", () => {
  it("D2614 mounts one canonical compiled image and refuses cross-process tampering", () => {
    const compiled = compileDeploymentConfig('{"format":"tabiya-deployment-config","configVersion":1,"profile":"local"}', file);
    const bytes = renderCompiledDeploymentImage(compiled);
    const loaded = loadCompiledDeploymentImage(bytes);
    expect(loaded.configDigest).toBe(compiled.configDigest);
    expect(loaded.boundary.publicOrigin).toBe("http://127.0.0.1:3000");
    expect(() => loadCompiledDeploymentImage(bytes.replace("127.0.0.1", "0.0.0.0"))).toThrow();
    expect(() => renderCompiledDeploymentImage({ ...compiled })).toThrow(/FORGED/);
  });

  it("D2615 compiles unknown JSON through closed runtime validation", () => {
    expect(() => compileDeploymentConfig('{"format":"tabiya-deployment-config","configVersion":1,"profile":"local","profile":"hosted"}', file)).toThrow(/DUPLICATE/);
    expect(() => compileDeploymentConfig('{"format":"tabiya-deployment-config","configVersion":1,"profile":"local","extra":true}', file)).toThrow(/KEY/);
    expect(() => compileDeploymentConfig('{"format":"tabiya-deployment-config","configVersion":1,"profile":"local","port":80}', file)).toThrow(/PORT/);
    expect(() => compileDeploymentConfig('{"format":"tabiya-deployment-config","configVersion":1,"profile":"hosted","hostname":"Chess.Example","tls":{"kind":"acme","contactEmail":"a@b.example"}}', file)).toThrow(/HOSTNAME/);
    expect(() => compileDeploymentConfig('{"format":"tabiya-deployment-config","configVersion":1,"profile":"local"}', { ...file, symlink: true })).toThrow(/FILE/);
    const hosted = '{"format":"tabiya-deployment-config","configVersion":1,"profile":"hosted","hostname":"chess.example","tls":{"kind":"files","certificate":{"sourceFile":"/cert","mountName":"cert"},"privateKey":{"sourceFile":"/key","mountName":"key"}}}';
    expect(() => compileDeploymentConfig(hosted, file, (path) => ({ ...file, inode: path, readable: true, mode: path === "/key" ? 0o600 : 0o644, certificateMatchesKey: path === "/cert", certificateSans: ["wrong.example"] }))).toThrow(/SECRET/);
  });

  it("D2616 derives exact operation/profile proof and rejects impossible success", () => {
    const imageDigest = digest("4");
    for (const profile of ["local", "hosted"] as const) for (const operation of ["check", "start", "probe"] as const) {
      const checks = requiredChecks(profile, operation);
      const results = checks.map((check) => executeDeploymentCheck(op, checkInput(check, imageDigest)));
      const receipt = compileDeploymentSuccess({ operationId: op, operation, profile, configDigest: digest("b"), compiledConfigImageDigest: imageDigest, publicUrl: profile === "local" ? "http://127.0.0.1:3000" : "https://chess.example", elapsedMs: 3, artifacts: artifacts(profile, operation), results, ...(operation === "start" ? { services: profile === "local" ? ["app"] : ["app", "caddy"] } : {}) });
      expect(receipt.checks).toEqual(checks);
    }
    expect(() => compileDeploymentSuccess({ operationId: op, operation: "start", profile: "hosted", configDigest: digest("b"), compiledConfigImageDigest: imageDigest, publicUrl: "https://chess.example", elapsedMs: -1, artifacts: artifacts("hosted", "start"), results: [], services: [] })).toThrow();
    const forged = requiredChecks("local", "check").map((check) => ({ operationId: op, check, operandDigest: sha256(check) }));
    expect(() => compileDeploymentSuccess({ operationId: op, operation: "check", profile: "local", configDigest: digest("b"), compiledConfigImageDigest: imageDigest, publicUrl: "http://127.0.0.1:3000", elapsedMs: 1, artifacts: artifacts("local", "check"), results: forged })).toThrow(/PROOF/);
  });

  it("D2617 binds live TLS chain, SPKI, hostname and validity to start/probe identity", () => {
    expect(() => parseDeploymentArtifacts({ ...artifacts("hosted", "start"), tlsIdentity: null }, "hosted", "start")).toThrow(/TLS/);
    expect(() => parseTlsIdentity({ ...tls, hostname: "other.example" }, "chess.example", now)).toThrow(/TLS/);
    expect(() => parseTlsIdentity({ ...tls, notAfter: "2026-09-03T00:00:00.000Z" }, "chess.example", now)).toThrow(/TLS/);
    expect(parseDeploymentArtifacts(artifacts("hosted", "probe"), "hosted", "probe").tlsIdentity?.spkiSha256).toBe(digest("2"));
  });

  it("D2618 distinguishes clean install, restart and explicit crash-resumable migration", () => {
    const active = (profile: DeploymentProfile, origin: string, generation: number): ActiveProfileState => ({ state: "active", profile, publicOrigin: origin, generation, configDigest: digest(generation === 1 ? "a" : "b"), compiledConfigImageDigest: digest(generation === 1 ? "c" : "d") });
    const local = active("local", "http://127.0.0.1:3000", 1);
    const hosted = active("hosted", "https://chess.example", 2);
    expect(admitProfileStart("empty", null, local)).toBe("initialize");
    expect(() => admitProfileStart("existing", null, local)).toThrow(/STATE_MISSING/);
    expect(admitProfileStart("existing", local, { ...local, configDigest: digest("e") })).toBe("restart");
    expect(() => admitProfileStart("existing", local, hosted)).toThrow(/SWITCH/);
    let journal = beginProfileTransition(op, local, hosted, { fromDigest: local.configDigest, oldOrigin: local.publicOrigin, newOrigin: hosted.publicOrigin });
    expect(() => advanceProfileTransition(journal, "target_ready")).toThrow(/ORDER/);
    journal = advanceProfileTransition(journal, "invalidate_sessions") as typeof journal;
    journal = advanceProfileTransition(journal, "revoke_public_tokens") as typeof journal;
    journal = advanceProfileTransition(journal, "target_ready") as typeof journal;
    expect(advanceProfileTransition(journal, "commit")).toEqual(hosted);
  });
});
