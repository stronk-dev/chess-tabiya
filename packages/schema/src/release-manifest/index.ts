// rfc/verifiable-runtime-distribution.md §1 — `release-manifest.json`, the post-image release index.
//
// This module is the single authority for the v1 protocol. `RELEASE_MANIFEST_SCHEMA` is the closed
// JSON Schema (projected verbatim to schemas/release-manifest.v1.schema.json by
// `node tools/release/release-manifest-schema.mjs --write`), and `validateReleaseManifest`
// interprets that same object before applying the cross-field rules a JSON Schema cannot state
// (sorting, role/tier coupling, compose/artifact joins, resource ceilings, release-class rules).
// Manifest generation, read-only verification, Compose generation, the server About join and the
// consumer drill all import this module; none keeps a hand-copied interface or digest parser.
//
// The module is deliberately self-contained, erasable TypeScript so release tools can import it with
// Node's type stripping and the server bundle can inline it.

export type ReleasePlatform = "linux/amd64" | "linux/arm64";
export type ComposeProfile = "local" | "appliance" | "hosted";

export interface ReleaseFile {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

interface ReleaseArtifactBase {
  readonly subject: string;
  readonly platforms: readonly ReleasePlatform[];
  readonly platformManifests: readonly {
    readonly platform: ReleasePlatform;
    readonly digest: string;
    readonly sbom: ReleaseFile;
  }[];
  readonly signatureIdentity: string;
  readonly provenancePredicate: string;
  readonly sbomPredicate: string;
  readonly fossEligible: boolean;
}

export type ReleaseArtifact = ReleaseArtifactBase & (
  | { readonly role: "server"; readonly tier: "core"; readonly fossEligible: true }
  | { readonly role: "maia-cpu"; readonly tier: "cpu"; readonly fossEligible: true }
  | { readonly role: "maia-accelerated"; readonly tier: "accelerated"; readonly fossEligible: boolean }
);

export interface NativeResourceReceipt {
  readonly platform: ReleasePlatform;
  readonly tier: "core" | "cpu";
  readonly imageDigests: readonly string[];
  readonly journeyId: "core.release_journey@1" | "bot.production_selection@1";
  readonly productionProfileDigest: string | null;
  readonly candidateWindow: {
    readonly operation: string;
    readonly requested: number;
    readonly observed: number;
    readonly coverage: "bounded_top_k";
  } | null;
  readonly steadyRssMiB: number;
  readonly peakRssMiB: number;
  readonly unpackedImageBytes: number;
  readonly coldReadyMs: number;
}

export interface ReleaseManifestV1 {
  readonly format: "tabiya-release-manifest";
  readonly formatVersion: 1;
  readonly release: {
    readonly version: string;
    readonly sourceRevision: string;
    readonly createdAt: string;
    readonly repository: string;
    readonly sourceArchive: ReleaseFile;
  };
  readonly requiredArtifacts: readonly ReleaseArtifact[];
  readonly optionalArtifacts: readonly ReleaseArtifact[];
  readonly compose: readonly (ReleaseFile & { readonly profile: ComposeProfile; readonly imageDigests: readonly string[] })[];
  readonly files: readonly ReleaseFile[];
  readonly resourceReceipts: readonly NativeResourceReceipt[];
  readonly contentBundle: { readonly producer: string; readonly digest: string; readonly finalDischarge: boolean };
  readonly fossPolicy: { readonly version: 1; readonly digest: string };
}

export const RELEASE_MANIFEST_SCHEMA_ID = "urn:chess-tabiya:schema:release-manifest:1";

const DIGEST = "^sha256:[0-9a-f]{64}$";
const PLATFORM = { enum: ["linux/amd64", "linux/arm64"] };
const SUBJECT = "^[a-z0-9.-]+(?::[0-9]+)?/[a-z0-9._/-]+@sha256:[0-9a-f]{64}$";
const RELATIVE_PATH = "^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)*$";
const releaseFile = {
  type: "object",
  additionalProperties: false,
  required: ["bytes", "path", "sha256"],
  properties: {
    path: { type: "string", pattern: RELATIVE_PATH },
    bytes: { type: "integer", minimum: 0 },
    sha256: { type: "string", pattern: DIGEST },
  },
};
const artifact = {
  type: "object",
  additionalProperties: false,
  required: ["fossEligible", "platformManifests", "platforms", "provenancePredicate", "role", "sbomPredicate", "signatureIdentity", "subject", "tier"],
  properties: {
    subject: { type: "string", pattern: SUBJECT },
    platforms: { type: "array", minItems: 1, items: { type: "string", ...PLATFORM } },
    platformManifests: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["digest", "platform", "sbom"],
        properties: { platform: { type: "string", ...PLATFORM }, digest: { type: "string", pattern: DIGEST }, sbom: releaseFile },
      },
    },
    signatureIdentity: { type: "string", pattern: "^https://github\\.com/[^\\s]+/\\.github/workflows/release\\.yml@refs/tags/v[^\\s]+$" },
    provenancePredicate: { type: "string", pattern: "^https://slsa\\.dev/provenance/v1$" },
    sbomPredicate: { type: "string", pattern: "^https://spdx\\.dev/Document/v2\\.3$" },
    fossEligible: { type: "boolean" },
    role: { type: "string", enum: ["server", "maia-cpu", "maia-accelerated"] },
    tier: { type: "string", enum: ["core", "cpu", "accelerated"] },
  },
};

/** The closed v1 JSON Schema. `schemas/release-manifest.v1.schema.json` is its exact projection. */
export const RELEASE_MANIFEST_SCHEMA = Object.freeze({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: RELEASE_MANIFEST_SCHEMA_ID,
  title: "Tabiya release manifest v1",
  type: "object",
  additionalProperties: false,
  required: ["compose", "contentBundle", "files", "format", "formatVersion", "fossPolicy", "optionalArtifacts", "release", "requiredArtifacts", "resourceReceipts"],
  properties: {
    format: { const: "tabiya-release-manifest" },
    formatVersion: { const: 1 },
    release: {
      type: "object",
      additionalProperties: false,
      required: ["createdAt", "repository", "sourceArchive", "sourceRevision", "version"],
      properties: {
        version: { type: "string", pattern: "^(?:0|[1-9][0-9]*)\\.(?:0|[1-9][0-9]*)\\.(?:0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?$" },
        sourceRevision: { type: "string", pattern: "^[0-9a-f]{40}$" },
        createdAt: { type: "string", pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{3}Z$" },
        repository: { type: "string", pattern: "^https://github\\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$" },
        sourceArchive: releaseFile,
      },
    },
    requiredArtifacts: { type: "array", items: artifact },
    optionalArtifacts: { type: "array", items: artifact },
    compose: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["bytes", "imageDigests", "path", "profile", "sha256"],
        properties: {
          ...releaseFile.properties,
          profile: { type: "string", enum: ["local", "appliance", "hosted"] },
          imageDigests: { type: "array", minItems: 1, items: { type: "string", pattern: SUBJECT } },
        },
      },
    },
    files: { type: "array", items: releaseFile },
    resourceReceipts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["candidateWindow", "coldReadyMs", "imageDigests", "journeyId", "peakRssMiB", "platform", "productionProfileDigest", "steadyRssMiB", "tier", "unpackedImageBytes"],
        properties: {
          platform: { type: "string", ...PLATFORM },
          tier: { type: "string", enum: ["core", "cpu"] },
          imageDigests: { type: "array", minItems: 1, items: { type: "string", pattern: SUBJECT } },
          journeyId: { type: "string", enum: ["core.release_journey@1", "bot.production_selection@1"] },
          productionProfileDigest: { type: ["string", "null"], pattern: DIGEST },
          candidateWindow: {
            type: ["object", "null"],
            additionalProperties: false,
            required: ["coverage", "observed", "operation", "requested"],
            properties: {
              operation: { type: "string", const: "maia.policy_page@1" },
              requested: { type: "integer", minimum: 1 },
              observed: { type: "integer", minimum: 1 },
              coverage: { type: "string", const: "bounded_top_k" },
            },
          },
          steadyRssMiB: { type: "number", minimum: 0 },
          peakRssMiB: { type: "number", minimum: 0 },
          unpackedImageBytes: { type: "integer", minimum: 0 },
          coldReadyMs: { type: "integer", minimum: 0 },
        },
      },
    },
    contentBundle: {
      type: "object",
      additionalProperties: false,
      required: ["digest", "finalDischarge", "producer"],
      properties: {
        producer: { type: "string", pattern: "^[a-z0-9-]+@[0-9]+$" },
        digest: { type: "string", pattern: DIGEST },
        finalDischarge: { type: "boolean" },
      },
    },
    fossPolicy: {
      type: "object",
      additionalProperties: false,
      required: ["digest", "version"],
      properties: { version: { const: 1 }, digest: { type: "string", pattern: DIGEST } },
    },
  },
});

/** §5 hard ceilings (binary units). A receipt above any ceiling cannot enter a manifest. */
export const RESOURCE_CEILINGS = Object.freeze({
  core: Object.freeze({ hardMiB: 512, steadyRssMiB: 128, peakRssMiB: 384, unpackedImageBytes: 650 * 1024 * 1024, coldReadyMs: 30_000 }),
  cpu: Object.freeze({ hardMiB: 2_048, steadyRssMiB: 1_536, peakRssMiB: 1_843, unpackedImageBytes: 2 * 1024 * 1024 * 1024, coldReadyMs: 120_000 }),
});

const ROLE_TIER = Object.freeze({ server: "core", "maia-cpu": "cpu", "maia-accelerated": "accelerated" } as const);
const RECEIPT_JOURNEY = Object.freeze({ core: "core.release_journey@1", cpu: "bot.production_selection@1" } as const);
const BOT_PAGE_WIDTH = 20;

type SchemaNode = Readonly<Record<string, unknown>>;

function typeMatches(value: unknown, type: string): boolean {
  switch (type) {
    case "object": return value !== null && typeof value === "object" && !Array.isArray(value);
    case "array": return Array.isArray(value);
    case "string": return typeof value === "string";
    case "integer": return Number.isSafeInteger(value);
    case "number": return typeof value === "number" && Number.isFinite(value);
    case "boolean": return typeof value === "boolean";
    case "null": return value === null;
    default: return false;
  }
}

/** Interprets the closed subset of JSON Schema that RELEASE_MANIFEST_SCHEMA uses. */
function check(node: SchemaNode, value: unknown, path: string, errors: string[]): void {
  if ("const" in node && value !== node.const) {
    errors.push(`${path}: must be ${JSON.stringify(node.const)}`);
    return;
  }
  const types = node.type === undefined ? [] : Array.isArray(node.type) ? node.type as string[] : [node.type as string];
  if (types.length > 0 && !types.some((type) => typeMatches(value, type))) {
    errors.push(`${path}: must be ${types.join(" or ")}`);
    return;
  }
  if (value === null) return;
  if (Array.isArray(node.enum) && !node.enum.includes(value)) errors.push(`${path}: must be one of ${node.enum.join(", ")}`);
  if (typeof value === "string" && typeof node.pattern === "string" && !new RegExp(node.pattern, "u").test(value)) errors.push(`${path}: does not match ${node.pattern}`);
  if (typeof value === "number" && typeof node.minimum === "number" && value < node.minimum) errors.push(`${path}: must be >= ${node.minimum}`);
  if (Array.isArray(value)) {
    if (typeof node.minItems === "number" && value.length < node.minItems) errors.push(`${path}: must have at least ${node.minItems} items`);
    if (node.items !== undefined) value.forEach((item, index) => check(node.items as SchemaNode, item, `${path}/${index}`, errors));
    return;
  }
  if (typeMatches(value, "object")) {
    const object = value as Record<string, unknown>;
    const properties = (node.properties ?? {}) as Record<string, SchemaNode>;
    for (const key of (node.required ?? []) as string[]) if (!(key in object)) errors.push(`${path}: missing ${key}`);
    for (const [key, child] of Object.entries(object)) {
      if (!(key in properties)) {
        if (node.additionalProperties === false) errors.push(`${path}: unknown field ${key}`);
        continue;
      }
      check(properties[key]!, child, `${path}/${key}`, errors);
    }
  }
}

function sortedUnique(values: readonly string[], path: string, errors: string[]): void {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index - 1]! >= values[index]!) errors.push(`${path}: must be sorted and unique (${values[index - 1]} / ${values[index]})`);
  }
}

export function isPrerelease(version: string): boolean {
  return version.includes("-");
}

/** Full v1 validation: the schema, then every cross-field rule. Returns the error list. */
export function validateReleaseManifest(value: unknown): readonly string[] {
  const errors: string[] = [];
  check(RELEASE_MANIFEST_SCHEMA as SchemaNode, value, "", errors);
  if (errors.length > 0) return Object.freeze(errors);
  const manifest = value as ReleaseManifestV1;
  const artifacts = [...manifest.requiredArtifacts, ...manifest.optionalArtifacts];
  const roles = artifacts.map((item) => item.role);
  if (new Set(roles).size !== roles.length) errors.push("/: duplicate artifact role");
  sortedUnique(manifest.requiredArtifacts.map((item) => item.role), "/requiredArtifacts", errors);
  sortedUnique(manifest.optionalArtifacts.map((item) => item.role), "/optionalArtifacts", errors);
  for (const [index, item] of manifest.requiredArtifacts.entries()) {
    if (item.role === "maia-accelerated") errors.push(`/requiredArtifacts/${index}: an accelerated artifact is never required`);
    if (item.fossEligible !== true) errors.push(`/requiredArtifacts/${index}: a required artifact must be FOSS-eligible`);
  }
  for (const [index, item] of manifest.optionalArtifacts.entries()) {
    if (item.role !== "maia-accelerated") errors.push(`/optionalArtifacts/${index}: only the accelerated artifact is optional`);
  }
  for (const item of artifacts) {
    const at = `/${manifest.requiredArtifacts.includes(item) ? "requiredArtifacts" : "optionalArtifacts"}/${item.role}`;
    if (ROLE_TIER[item.role] !== item.tier) errors.push(`${at}: role ${item.role} requires tier ${ROLE_TIER[item.role]}`);
    sortedUnique(item.platforms, `${at}/platforms`, errors);
    const manifestPlatforms = item.platformManifests.map((platform) => platform.platform);
    sortedUnique(manifestPlatforms, `${at}/platformManifests`, errors);
    if (manifestPlatforms.join(",") !== item.platforms.join(",")) errors.push(`${at}: every platform needs exactly one platform manifest and SBOM`);
    for (const platform of item.platformManifests) {
      const expected = `sbom/${item.role}-${platform.platform.replace("/", "-")}.spdx.json`;
      if (platform.sbom.path !== expected) errors.push(`${at}: ${platform.platform} SBOM must be ${expected}`);
      if (!manifest.files.some((file) => file.path === platform.sbom.path && file.sha256 === platform.sbom.sha256 && file.bytes === platform.sbom.bytes)) {
        errors.push(`${at}: ${platform.sbom.path} is not a listed release file`);
      }
    }
    if (!item.signatureIdentity.endsWith(`@refs/tags/v${manifest.release.version}`)) errors.push(`${at}: signature identity must bind the release tag v${manifest.release.version}`);
    if (!item.signatureIdentity.startsWith(`${manifest.release.repository}/`)) errors.push(`${at}: signature identity must bind ${manifest.release.repository}`);
  }
  const subjects = new Set(artifacts.map((item) => item.subject));
  sortedUnique(manifest.compose.map((item) => item.profile), "/compose", errors);
  for (const [index, item] of manifest.compose.entries()) {
    sortedUnique(item.imageDigests, `/compose/${index}/imageDigests`, errors);
    for (const digest of item.imageDigests) if (!subjects.has(digest)) errors.push(`/compose/${index}: references ${digest}, which is not a manifest artifact`);
    const required = manifest.requiredArtifacts.find((artifactItem) => artifactItem.role === "server");
    if (required !== undefined && !item.imageDigests.includes(required.subject)) errors.push(`/compose/${index}: must reference the server subject`);
    const optional = manifest.optionalArtifacts.map((artifactItem) => artifactItem.subject);
    if (item.imageDigests.some((digest) => optional.includes(digest))) errors.push(`/compose/${index}: a default profile cannot include an optional accelerated artifact`);
  }
  sortedUnique(manifest.files.map((item) => item.path), "/files", errors);
  for (const required of ["LICENSE", "NOTICE.txt"]) if (!manifest.files.some((file) => file.path === required)) errors.push(`/files: missing ${required}`);
  for (const forbidden of ["release-manifest.json", "SHA256SUMS"]) if (manifest.files.some((file) => file.path === forbidden)) errors.push(`/files: ${forbidden} cannot record its own or a later digest`);
  sortedUnique(manifest.resourceReceipts.map((item) => `${item.tier}|${item.platform}`), "/resourceReceipts", errors);
  for (const [index, receipt] of manifest.resourceReceipts.entries()) {
    const at = `/resourceReceipts/${index}`;
    const ceiling = RESOURCE_CEILINGS[receipt.tier];
    if (receipt.journeyId !== RECEIPT_JOURNEY[receipt.tier]) errors.push(`${at}: tier ${receipt.tier} requires journey ${RECEIPT_JOURNEY[receipt.tier]}`);
    sortedUnique(receipt.imageDigests, `${at}/imageDigests`, errors);
    for (const digest of receipt.imageDigests) if (!subjects.has(digest)) errors.push(`${at}: measured ${digest}, which is not a manifest artifact`);
    if (receipt.tier === "core") {
      if (receipt.productionProfileDigest !== null || receipt.candidateWindow !== null) errors.push(`${at}: the core journey has no bot profile or candidate window`);
    } else {
      if (receipt.productionProfileDigest === null) errors.push(`${at}: the cpu journey must bind the production bot profile digest`);
      if (receipt.candidateWindow === null || receipt.candidateWindow.requested !== BOT_PAGE_WIDTH || receipt.candidateWindow.observed > receipt.candidateWindow.requested) {
        errors.push(`${at}: the cpu journey must request maia.policy_page@1 at width ${BOT_PAGE_WIDTH}`);
      }
    }
    for (const key of ["steadyRssMiB", "peakRssMiB", "unpackedImageBytes", "coldReadyMs"] as const) {
      if (receipt[key] > ceiling[key]) errors.push(`${at}: ${key} ${receipt[key]} exceeds the ${receipt.tier} ceiling ${ceiling[key]}`);
    }
  }
  if (!isPrerelease(manifest.release.version)) {
    for (const role of ["maia-cpu", "server"] as const) {
      const item = manifest.requiredArtifacts.find((candidate) => candidate.role === role);
      if (item === undefined) errors.push(`/requiredArtifacts: a 1.0-class release requires ${role}`);
      else if (item.platforms.join(",") !== "linux/amd64,linux/arm64") errors.push(`/requiredArtifacts/${role}: a 1.0-class release requires linux/amd64 and linux/arm64`);
    }
    for (const tier of ["core", "cpu"] as const) {
      for (const platform of ["linux/amd64", "linux/arm64"] as const) {
        if (!manifest.resourceReceipts.some((receipt) => receipt.tier === tier && receipt.platform === platform)) errors.push(`/resourceReceipts: missing native ${tier} receipt for ${platform}`);
      }
    }
    if (!manifest.contentBundle.finalDischarge) errors.push("/contentBundle: a 1.0-class release requires the final F3/F4 content bundle (D2)");
    if (manifest.compose.map((item) => item.profile).join(",") !== "appliance,hosted,local") errors.push("/compose: a 1.0-class release publishes the local, appliance and hosted profiles");
  } else if (!manifest.requiredArtifacts.some((item) => item.role === "server")) {
    errors.push("/requiredArtifacts: every release requires the server");
  }
  return Object.freeze(errors);
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonical(object[key])}`).join(",")}}`;
}

/** RFC 8785 canonical UTF-8 JSON with one trailing newline — the only accepted byte form. */
export function canonicalReleaseManifest(manifest: ReleaseManifestV1): string {
  return `${canonical(manifest)}\n`;
}

export class ReleaseManifestError extends Error {
  readonly errors: readonly string[];
  constructor(errors: readonly string[]) {
    super(`RELEASE_MANIFEST_INVALID: ${errors.join("; ")}`);
    this.errors = errors;
  }
}

/** Parses the exact canonical bytes of a v1 manifest; unknown versions and extra fields fail. */
export function parseReleaseManifest(text: string): ReleaseManifestV1 {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ReleaseManifestError(["not JSON"]);
  }
  const errors = [...validateReleaseManifest(value)];
  if (errors.length === 0 && canonicalReleaseManifest(value as ReleaseManifestV1) !== text) errors.push("not canonical RFC 8785 JSON with a trailing newline");
  if (errors.length > 0) throw new ReleaseManifestError(errors);
  return value as ReleaseManifestV1;
}
