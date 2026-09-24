// rfc/verifiable-runtime-distribution.md §4/§9 — the visible licence/source surface.
//
// The image embeds only pre-image facts (build-metadata.json, NOTICE.txt, LICENSE, licence texts).
// The post-image release index is mounted read-only by release Compose; at startup it is parsed by
// the one shared v1 parser and joined to the embedded build metadata and the deployed image
// subject. A mounted index that fails the parser or the join refuses startup. About never fetches
// mutable release metadata from the network and never reports host paths, secrets or learner data.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parseReleaseManifest, type ReleaseManifestV1 } from "@chess-tabiya/schema/release-manifest";

export const DEFAULT_RELEASE_MANIFEST_PATH = "/run/chess-tabiya/release-manifest.json";
const WARRANTY = "This program is free software under the GNU Affero General Public License v3.0 only. It comes with ABSOLUTELY NO WARRANTY, to the extent permitted by applicable law.";
const ACCELERATION = "Optional accelerated artifacts, when a release publishes one, are separately labelled and may carry separately disclosed non-FOSS runtime components; the default core and cpu tiers never include them.";

export interface ReleaseAboutOptions {
  /** Directory holding the embedded build-metadata.json, NOTICE.txt, LICENSE (release images only). */
  readonly legalDirectory?: string;
  /** The mounted post-image release index (defaults to /run/chess-tabiya/release-manifest.json). */
  readonly releaseManifestPath?: string;
  /** The deployed digest-pinned server subject, as release Compose declares it. */
  readonly serverImage?: string;
  readonly deploymentTier?: "core" | "cpu";
}

interface BuildMetadata {
  readonly format: "tabiya-build-metadata";
  readonly formatVersion: 1;
  readonly release: { readonly version: string; readonly sourceRevision: string; readonly repository: string; readonly sourceUrl: string };
  readonly fossPolicy: { readonly version: 1; readonly digest: string };
  readonly notice: { readonly digest: string };
  readonly runtimeContent: { readonly producer: string; readonly digest: string; readonly finalDischarge: boolean };
}

export interface AboutRelease {
  readonly format: "tabiya-about-release";
  readonly formatVersion: 1;
  readonly application: { readonly name: "Tabiya"; readonly licence: "AGPL-3.0-only"; readonly warranty: string; readonly build: "release" | "development" };
  readonly release: { readonly version: string; readonly sourceRevision: string; readonly repository: string; readonly sourceUrl: string } | null;
  readonly releaseIndex: "verified" | "not_attached";
  readonly artifacts: readonly {
    readonly role: string;
    readonly tier: string;
    readonly subject: string;
    readonly fossEligible: boolean;
    readonly platforms: readonly { readonly platform: string; readonly digest: string; readonly sbom: string; readonly sbomSha256: string }[];
  }[];
  readonly deployment: { readonly tier: "core" | "cpu"; readonly serverImage: string | null; readonly engineMode: string };
  readonly runtimeContent: BuildMetadata["runtimeContent"] | null;
  readonly fossPolicyDigest: string | null;
  readonly noticeDigest: string | null;
  readonly downloads: { readonly notice: string | null; readonly licence: string | null; readonly releaseManifest: string | null; readonly releasePage: string | null; readonly source: string | null };
  readonly optionalAcceleration: string;
}

export class ReleaseAboutError extends Error {
  readonly code = "RELEASE_INDEX_REFUSED";
}

function parseBuildMetadata(text: string): BuildMetadata {
  const value = JSON.parse(text) as Partial<BuildMetadata>;
  if (
    value.format !== "tabiya-build-metadata"
    || value.formatVersion !== 1
    || typeof value.release?.version !== "string"
    || !/^[0-9a-f]{40}$/u.test(value.release.sourceRevision ?? "")
    || typeof value.release.sourceUrl !== "string"
    || typeof value.runtimeContent?.digest !== "string"
    || typeof value.fossPolicy?.digest !== "string"
  ) {
    throw new ReleaseAboutError("RELEASE_INDEX_REFUSED: embedded build-metadata.json is not a v1 build record");
  }
  return value as BuildMetadata;
}

function joinFailures(manifest: ReleaseManifestV1, build: BuildMetadata, serverImage: string | undefined): readonly string[] {
  const failures: string[] = [];
  if (manifest.release.sourceRevision !== build.release.sourceRevision) failures.push("source revision differs from the embedded build metadata");
  if (manifest.release.version !== build.release.version) failures.push("release version differs from the embedded build metadata");
  if (manifest.release.repository !== build.release.repository) failures.push("repository differs from the embedded build metadata");
  if (manifest.contentBundle.digest !== build.runtimeContent.digest) failures.push("runtime-content digest differs from the embedded build metadata");
  if (manifest.fossPolicy.digest !== build.fossPolicy.digest) failures.push("FOSS policy digest differs from the embedded build metadata");
  const server = manifest.requiredArtifacts.find((artifact) => artifact.role === "server");
  if (server === undefined) failures.push("the index names no server artifact");
  else if (serverImage === undefined) failures.push("the deployment does not declare TABIYA_SERVER_IMAGE");
  else if (server.subject !== serverImage) failures.push("the deployed server image is not the index's server subject");
  return failures;
}

export interface ReleaseAbout {
  readonly body: AboutRelease;
  handle(request: Request): Response | undefined;
}

/** Loads (and at startup, verifies) the About surface. Throws ReleaseAboutError on a refused index. */
export function loadReleaseAbout(options: ReleaseAboutOptions & { readonly engineMode: string }): ReleaseAbout {
  const legal = options.legalDirectory;
  const build = legal === undefined ? null : parseBuildMetadata(readFileSync(join(legal, "build-metadata.json"), "utf8"));
  const manifestPath = options.releaseManifestPath ?? DEFAULT_RELEASE_MANIFEST_PATH;
  let manifest: ReleaseManifestV1 | null = null;
  let manifestText: string | null = null;
  if (existsSync(manifestPath)) {
    manifestText = readFileSync(manifestPath, "utf8");
    try {
      manifest = parseReleaseManifest(manifestText);
    } catch (error) {
      throw new ReleaseAboutError(`RELEASE_INDEX_REFUSED: ${(error as Error).message}`);
    }
    if (build === null) throw new ReleaseAboutError("RELEASE_INDEX_REFUSED: a release index is mounted but this build embeds no release build metadata");
    const failures = joinFailures(manifest, build, options.serverImage);
    if (failures.length > 0) throw new ReleaseAboutError(`RELEASE_INDEX_REFUSED: ${failures.join("; ")}`);
  }
  const tier = options.deploymentTier ?? (options.engineMode === "maia" ? "cpu" : "core");
  const repository = build?.release.repository ?? null;
  const body: AboutRelease = Object.freeze({
    format: "tabiya-about-release",
    formatVersion: 1,
    application: Object.freeze({ name: "Tabiya", licence: "AGPL-3.0-only", warranty: WARRANTY, build: build === null ? "development" : "release" }),
    release: build === null ? null : Object.freeze({ ...build.release }),
    releaseIndex: manifest === null ? "not_attached" : "verified",
    artifacts: Object.freeze((manifest === null ? [] : [...manifest.requiredArtifacts, ...manifest.optionalArtifacts]).map((artifact) => Object.freeze({
      role: artifact.role,
      tier: artifact.tier,
      subject: artifact.subject,
      fossEligible: artifact.fossEligible,
      platforms: Object.freeze(artifact.platformManifests.map((platform) => Object.freeze({ platform: platform.platform, digest: platform.digest, sbom: platform.sbom.path, sbomSha256: platform.sbom.sha256 }))),
    }))),
    deployment: Object.freeze({ tier, serverImage: options.serverImage ?? null, engineMode: options.engineMode }),
    runtimeContent: build === null ? null : Object.freeze({ ...build.runtimeContent }),
    fossPolicyDigest: build?.fossPolicy.digest ?? null,
    noticeDigest: build?.notice.digest ?? null,
    downloads: Object.freeze({
      notice: legal === undefined ? null : "/about/NOTICE.txt",
      licence: legal === undefined ? null : "/about/LICENSE",
      releaseManifest: manifest === null ? null : "/about/release-manifest.json",
      releasePage: build === null || repository === null ? null : `${repository}/releases/tag/v${build.release.version}`,
      source: build?.release.sourceUrl ?? null,
    }),
    optionalAcceleration: ACCELERATION,
  });
  const text = (value: string | Uint8Array, type: string): Response => new Response(value as BodyInit, { status: 200, headers: { "content-type": type, "cache-control": "no-cache", "x-content-type-options": "nosniff" } });
  return Object.freeze({
    body,
    handle(request: Request): Response | undefined {
      const { pathname } = new URL(request.url);
      if (!pathname.startsWith("/about")) return undefined;
      if (request.method !== "GET" && request.method !== "HEAD") return Response.json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, { status: 405 });
      if (pathname === "/about/release") return Response.json(body, { headers: { "cache-control": "no-cache" } });
      if (pathname === "/about" || pathname === "/about/") return text(renderAboutPage(body), "text/html; charset=utf-8");
      if (pathname === "/about/NOTICE.txt" && legal !== undefined) return text(readFileSync(join(legal, "NOTICE.txt")), "text/plain; charset=utf-8");
      if (pathname === "/about/LICENSE" && legal !== undefined) return text(readFileSync(join(legal, "LICENSE")), "text/plain; charset=utf-8");
      if (pathname === "/about/release-manifest.json" && manifestText !== null) return text(manifestText, "application/json");
      return Response.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });
    },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function link(href: string | null, label: string): string {
  return href === null ? `<span>${escapeHtml(label)} (not available in this build)</span>` : `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
}

/** The server-rendered About page: legible without JavaScript, never the chess UI. */
export function renderAboutPage(about: AboutRelease): string {
  const release = about.release;
  const artifacts = about.artifacts.map((artifact) => `<li><strong>${escapeHtml(artifact.role)}</strong> (${escapeHtml(artifact.tier)}): <code>${escapeHtml(artifact.subject)}</code></li>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Licence &amp; source · Tabiya</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:46rem;margin:0 auto;padding:1.5rem 1rem;color:#1d1b16;background:#f7f5ee}code{word-break:break-all}dt{font-weight:600}dd{margin:0 0 .6rem}a{color:#1d4f91}</style>
</head><body><main>
<p><a href="/">← Back to Tabiya</a></p>
<h1>Licence &amp; source</h1>
<p>${escapeHtml(about.application.warranty)}</p>
<dl>
<dt>Version</dt><dd>${release === null ? "Development build (no release revision)" : escapeHtml(release.version)}</dd>
<dt>Source revision</dt><dd>${release === null ? "Not a release build" : `<code>${escapeHtml(release.sourceRevision)}</code>`}</dd>
<dt>Licence</dt><dd>${escapeHtml(about.application.licence)} — ${link(about.downloads.licence, "full licence text")}</dd>
<dt>Corresponding source</dt><dd>${link(about.downloads.source, "source for exactly this revision")}</dd>
<dt>Third-party notices</dt><dd>${link(about.downloads.notice, "NOTICE.txt")}</dd>
<dt>Release index</dt><dd>${about.releaseIndex === "verified" ? `Verified at startup — ${link(about.downloads.releaseManifest, "release-manifest.json")}` : "Not attached to this deployment"}</dd>
<dt>Release page (SBOMs, signatures, Compose)</dt><dd>${link(about.downloads.releasePage, "release assets")}</dd>
<dt>Deployment tier</dt><dd>${escapeHtml(about.deployment.tier)}${about.deployment.serverImage === null ? "" : ` — <code>${escapeHtml(about.deployment.serverImage)}</code>`}</dd>
</dl>
${artifacts === "" ? "" : `<h2>Release artifacts</h2><ul>${artifacts}</ul>`}
<p>${escapeHtml(about.optionalAcceleration)}</p>
<p>Machine-readable: <a href="/about/release">/about/release</a></p>
</main></body></html>
`;
}
