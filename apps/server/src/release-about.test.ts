import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { canonicalReleaseManifest, type ReleaseManifestV1 } from "@chess-tabiya/schema/release-manifest";
import { describe, expect, it } from "vitest";

import { loadReleaseAbout, renderAboutPage } from "./release-about.js";

const revision = "a".repeat(40);
const repository = "https://github.com/stronk-dev/chess-tabiya";
const digest = (character: string) => `sha256:${character.repeat(64)}`;
const serverSubject = `ghcr.io/stronk-dev/chess-tabiya-server@${digest("1")}`;
const file = (path: string) => ({ path, bytes: 1, sha256: digest("f") });

function buildMetadata(overrides: Record<string, unknown> = {}) {
  return {
    format: "tabiya-build-metadata",
    formatVersion: 1,
    release: { version: "0.9.0-preview.1", sourceRevision: revision, repository, sourceUrl: `${repository}/tree/${revision}` },
    buildInputs: {},
    fossPolicy: { version: 1, digest: digest("9") },
    notice: { path: "/usr/share/doc/chess-tabiya/NOTICE.txt", digest: digest("8") },
    runtimeContent: { producer: "tabiya-temporary-allow-list@1", digest: digest("7"), finalDischarge: false },
    ...overrides,
  };
}

function manifest(overrides: Partial<ReleaseManifestV1> = {}): ReleaseManifestV1 {
  return {
    format: "tabiya-release-manifest",
    formatVersion: 1,
    release: { version: "0.9.0-preview.1", sourceRevision: revision, createdAt: "2026-09-24T12:00:00.000Z", repository, sourceArchive: file("chess-tabiya-0.9.0-preview.1-source.tar.gz") },
    requiredArtifacts: [{
      role: "server",
      tier: "core",
      subject: serverSubject,
      platforms: ["linux/amd64", "linux/arm64"],
      platformManifests: [
        { platform: "linux/amd64", digest: digest("2"), sbom: file("sbom/server-linux-amd64.spdx.json") },
        { platform: "linux/arm64", digest: digest("3"), sbom: file("sbom/server-linux-arm64.spdx.json") },
      ],
      signatureIdentity: `${repository}/.github/workflows/release.yml@refs/tags/v0.9.0-preview.1`,
      provenancePredicate: "https://slsa.dev/provenance/v1",
      sbomPredicate: "https://spdx.dev/Document/v2.3",
      fossEligible: true,
    }],
    optionalArtifacts: [],
    compose: [{ ...file("compose.local.yaml"), profile: "local", imageDigests: [serverSubject] }],
    files: [file("LICENSE"), file("NOTICE.txt"), file("sbom/server-linux-amd64.spdx.json"), file("sbom/server-linux-arm64.spdx.json")],
    resourceReceipts: [],
    contentBundle: { producer: "tabiya-temporary-allow-list@1", digest: digest("7"), finalDischarge: false },
    fossPolicy: { version: 1, digest: digest("9") },
    ...overrides,
  };
}

function legalDirectory(metadata: unknown = buildMetadata()): string {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-legal-"));
  writeFileSync(join(directory, "build-metadata.json"), JSON.stringify(metadata));
  writeFileSync(join(directory, "NOTICE.txt"), "notices\n");
  writeFileSync(join(directory, "LICENSE"), "GNU AFFERO GENERAL PUBLIC LICENSE\n");
  return directory;
}

function mounted(value: ReleaseManifestV1 | string): string {
  const path = join(mkdtempSync(join(tmpdir(), "tabiya-index-")), "release-manifest.json");
  writeFileSync(path, typeof value === "string" ? value : canonicalReleaseManifest(value));
  return path;
}

describe("rfc/verifiable-runtime-distribution.md §4/§9 About surface", () => {
  it("development builds say so and never invent a release revision or link the moving branch", () => {
    const about = loadReleaseAbout({ engineMode: "mock", releaseManifestPath: join(tmpdir(), "absent-release-manifest.json") });
    expect(about.body.application.build).toBe("development");
    expect(about.body.release).toBeNull();
    expect(about.body.releaseIndex).toBe("not_attached");
    expect(renderAboutPage(about.body)).toContain("Development build (no release revision)");
    expect(JSON.stringify(about.body)).not.toMatch(/\/tree\/main|\/blob\/main/u);
  });

  it("a release image exposes its exact revision, AGPL licence, warranty, notices and source for that revision", async () => {
    const legal = legalDirectory();
    const about = loadReleaseAbout({ engineMode: "mock", legalDirectory: legal, releaseManifestPath: join(tmpdir(), "absent-release-manifest.json") });
    expect(about.body.release?.sourceRevision).toBe(revision);
    expect(about.body.downloads.source).toBe(`${repository}/tree/${revision}`);
    expect(about.body.application.warranty).toContain("ABSOLUTELY NO WARRANTY");
    expect(JSON.stringify(about.body)).not.toContain(legal);
    const notice = about.handle(new Request("http://localhost/about/NOTICE.txt"));
    expect(await notice?.text()).toBe("notices\n");
    const page = await about.handle(new Request("http://localhost/about"))?.text();
    expect(page).toContain("Licence &amp; source");
    expect(page).toContain(revision);
    expect(about.handle(new Request("http://localhost/packs"))).toBeUndefined();
  });

  it("a mounted index is verified through the shared v1 parser and joined to the build and deployed image", async () => {
    const about = loadReleaseAbout({ engineMode: "mock", legalDirectory: legalDirectory(), releaseManifestPath: mounted(manifest()), serverImage: serverSubject });
    expect(about.body.releaseIndex).toBe("verified");
    expect(about.body.artifacts[0]?.subject).toBe(serverSubject);
    const body = await about.handle(new Request("http://localhost/about/release"))?.json() as { releaseIndex: string };
    expect(body.releaseIndex).toBe("verified");
  });

  it("refuses startup on a malformed index, a revision/content/policy mismatch or a different server image", () => {
    const options = { engineMode: "mock", legalDirectory: legalDirectory(), serverImage: serverSubject } as const;
    expect(() => loadReleaseAbout({ ...options, releaseManifestPath: mounted(`${JSON.stringify(manifest())}\n`) })).toThrow(/RELEASE_INDEX_REFUSED/u);
    expect(() => loadReleaseAbout({ ...options, releaseManifestPath: mounted(manifest({ formatVersion: 2 } as never)) })).toThrow(/RELEASE_INDEX_REFUSED/u);
    const otherRevision = manifest();
    const moved = { ...otherRevision, release: { ...otherRevision.release, sourceRevision: "b".repeat(40) } };
    expect(() => loadReleaseAbout({ ...options, releaseManifestPath: mounted(moved) })).toThrow(/source revision differs/u);
    expect(() => loadReleaseAbout({ ...options, releaseManifestPath: mounted(manifest({ contentBundle: { producer: "tabiya-temporary-allow-list@1", digest: digest("6"), finalDischarge: false } })) })).toThrow(/runtime-content digest differs/u);
    expect(() => loadReleaseAbout({ ...options, serverImage: `ghcr.io/stronk-dev/chess-tabiya-server@${digest("4")}`, releaseManifestPath: mounted(manifest()) })).toThrow(/deployed server image/u);
    expect(() => loadReleaseAbout({ engineMode: "mock", releaseManifestPath: mounted(manifest()) })).toThrow(/embeds no release build metadata/u);
  });
});
