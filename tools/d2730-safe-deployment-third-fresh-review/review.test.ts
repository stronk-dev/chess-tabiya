import { describe, expect, it } from "vitest";

import {
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
  type ActiveProfileState,
  type CheckInput,
  type DeploymentArtifacts,
  type DeploymentOperation,
  type DeploymentProfile,
  type ProfileTransition,
} from "../d2614-safe-deployment-second-author-repair/contract.js";

const configFile = Object.freeze({
  absolute: true,
  regular: true,
  symlink: false,
  sameInode: true,
  mode: 0o600,
});
const operationId = parseDeploymentOperationId("123e4567-e89b-42d3-a456-426614174000");
const digest = (character: string) => parseSha256(`sha256:${character.repeat(64)}`);
const instant = "2026-09-05T10:00:00.000Z";
const tlsIdentity = parseTlsIdentity(
  {
    leafSha256: digest("1"),
    spkiSha256: digest("2"),
    chainSha256: digest("3"),
    hostname: "chess.example",
    notBefore: "2026-09-01T00:00:00.000Z",
    notAfter: "2026-10-01T00:00:00.000Z",
  },
  "chess.example",
  instant,
);

function artifacts(
  profile: DeploymentProfile,
  operation: DeploymentOperation,
  imageDigest = digest("4"),
  deploymentRevision = "latest",
): DeploymentArtifacts {
  return parseDeploymentArtifacts(
    {
      deploymentRevision,
      serverImageDigest: digest("5"),
      caddyImageDigest: profile === "local" ? null : digest("6"),
      composeDigest: digest("7"),
      caddyConfigDigest: profile === "local" ? null : digest("8"),
      routeBudgetManifestDigest: digest("9"),
      compiledConfigImageDigest: imageDigest,
      tlsIdentity: profile === "local" || operation === "check" ? null : tlsIdentity,
    },
    profile,
    operation,
  );
}

function checkInput(check: ReturnType<typeof requiredChecks>[number], imageDigest: ReturnType<typeof digest>): CheckInput {
  if (check === "hostname_resolution") return { kind: check, expected: ["192.0.2.1"], actual: ["192.0.2.1"] };
  if (check === "certificate") return { kind: check, identity: tlsIdentity, hostname: "chess.example", at: instant };
  if (check === "origin" || check === "cookie") return { kind: check, expected: "invented", actual: "invented" };
  if (check === "readiness") return { kind: check, status: 200, ready: true, imageDigest, expectedImageDigest: imageDigest };
  return { kind: check, expected: digest("a"), actual: digest("a") };
}

function active(profile: DeploymentProfile, publicOrigin: string, generation: number): ActiveProfileState {
  return Object.freeze({
    state: "active",
    profile,
    publicOrigin,
    generation,
    configDigest: digest("b"),
    compiledConfigImageDigest: digest("c"),
  });
}

describe("D2730-D2735 safe-deployment third fresh independent review", () => {
  it("D2730 accepts canonical compiled images with profile-impossible boundary relations", () => {
    const compiled = compileDeploymentConfig(
      '{"format":"tabiya-deployment-config","configVersion":1,"profile":"appliance","hostname":"chess.example","resolution":{"kind":"operator_dns","expectedAddresses":["192.0.2.1"]}}',
      configFile,
    );
    const image = JSON.parse(renderCompiledDeploymentImage(compiled)) as {
      boundary: { tlsMode: string; listenPort: number };
    };
    image.boundary.tlsMode = "acme";
    image.boundary.listenPort = 4444;

    expect(loadCompiledDeploymentImage(JSON.stringify(image)).boundary).toMatchObject({
      profile: "appliance",
      tlsMode: "acme",
      listenPort: 4444,
    });
  });

  it("D2731 compiles successful checks detached from the config, artifacts and public origin", () => {
    const imageDigest = digest("4");
    const results = requiredChecks("local", "check").map((check) =>
      executeDeploymentCheck(operationId, checkInput(check, imageDigest)),
    );
    const receipt = compileDeploymentSuccess({
      operationId,
      operation: "check",
      profile: "local",
      configDigest: digest("d"),
      compiledConfigImageDigest: imageDigest,
      publicUrl: "https://attacker.example/not-the-compiled-origin",
      elapsedMs: 1,
      artifacts: artifacts("local", "check", imageDigest),
      results,
    });

    expect(receipt.publicUrl).toBe("https://attacker.example/not-the-compiled-origin");
    expect(receipt.configDigest).toBe(digest("d"));
  });

  it("D2732 emits neither the declared receipt protocol nor immutable release identity", () => {
    const imageDigest = digest("4");
    const results = requiredChecks("local", "check").map((check) =>
      executeDeploymentCheck(operationId, checkInput(check, imageDigest)),
    );
    const receipt = compileDeploymentSuccess({
      operationId,
      operation: "check",
      profile: "local",
      configDigest: digest("d"),
      compiledConfigImageDigest: imageDigest,
      publicUrl: "http://127.0.0.1:3000",
      elapsedMs: Number.MAX_SAFE_INTEGER + 1,
      artifacts: artifacts("local", "check", imageDigest, "latest"),
      results,
    }) as unknown as Record<string, unknown>;

    expect(receipt.protocol).toBeUndefined();
    expect(receipt.protocolVersion).toBeUndefined();
    expect(receipt.result).toBeUndefined();
    expect((receipt.artifacts as { deploymentRevision: string }).deploymentRevision).toBe("latest");
    expect(receipt.elapsedMs).toBe(Number.MAX_SAFE_INTEGER + 1);
  });

  it("D2733 accepts TLS identity without a valid clock or chain-trust authority", () => {
    const identity = parseTlsIdentity(
      {
        leafSha256: digest("1"),
        spkiSha256: digest("2"),
        chainSha256: digest("3"),
        hostname: "chess.example",
        notBefore: "2099-01-01T00:00:00.000Z",
        notAfter: "2099-02-01T00:00:00.000Z",
      },
      "chess.example",
      "not-an-instant",
    );

    expect(identity.hostname).toBe("chess.example");
  });

  it("D2734 calls a boolean/digest echo readiness without storage or representative-data proof", () => {
    const imageDigest = digest("4");
    expect(
      executeDeploymentCheck(operationId, {
        kind: "readiness",
        status: 200,
        ready: true,
        imageDigest,
        expectedImageDigest: imageDigest,
      }).check,
    ).toBe("readiness");
  });

  it("D2735 advances a JSON-forged transition using caller-authored effect labels", () => {
    const from = active("local", "http://127.0.0.1:3000", -2);
    const to = active("hosted", "https://chess.example", -1);
    const proposed = beginProfileTransition(operationId, from, to, {
      fromDigest: from.configDigest,
      oldOrigin: from.publicOrigin,
      newOrigin: to.publicOrigin,
    });
    const forged = JSON.parse(JSON.stringify(proposed)) as ProfileTransition;

    expect(advanceProfileTransition(forged, "invalidate_sessions")).toMatchObject({
      phase: "sessions_invalidated",
    });
  });
});
