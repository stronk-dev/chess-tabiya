interface ReleaseFile { readonly path: string; readonly bytes: number; readonly sha256: string }
type ReleaseArtifact = {
  readonly subject: string;
  readonly platforms: readonly ("linux/amd64" | "linux/arm64")[];
  readonly platformManifests: readonly { readonly platform: "linux/amd64" | "linux/arm64"; readonly digest: string; readonly sbom: ReleaseFile }[];
  readonly signatureIdentity: string;
  readonly provenancePredicate: string;
  readonly sbomPredicate: string;
  readonly fossEligible: boolean;
} & (
  | { readonly role: "server"; readonly tier: "core"; readonly fossEligible: true }
  | { readonly role: "maia-cpu"; readonly tier: "cpu"; readonly fossEligible: true }
  | { readonly role: "maia-accelerated"; readonly tier: "accelerated"; readonly fossEligible: boolean }
);
interface NativeResourceReceipt {
  readonly platform: "linux/amd64" | "linux/arm64";
  readonly tier: "core" | "cpu";
  readonly imageDigests: readonly string[];
  readonly journeyId: "core.release_journey@1" | "bot.production_selection@1";
  readonly productionProfileDigest: string | null;
  readonly candidateWindow: { readonly operation: string; readonly requested: number; readonly observed: number; readonly coverage: "bounded_top_k" } | null;
  readonly steadyRssMiB: number;
  readonly peakRssMiB: number;
  readonly unpackedImageBytes: number;
  readonly coldReadyMs: number;
}
interface ReleaseManifestV1 {
  readonly format: "tabiya-release-manifest";
  readonly formatVersion: 1;
  readonly release: { readonly version: string; readonly sourceRevision: string; readonly createdAt: string; readonly repository: string; readonly sourceArchive: ReleaseFile };
  readonly requiredArtifacts: readonly ReleaseArtifact[];
  readonly optionalArtifacts: readonly ReleaseArtifact[];
  readonly compose: readonly (ReleaseFile & { readonly profile: "local" | "appliance" | "hosted"; readonly imageDigests: readonly string[] })[];
  readonly files: readonly ReleaseFile[];
  readonly resourceReceipts: readonly NativeResourceReceipt[];
  readonly contentBundle: { readonly producer: string; readonly digest: string; readonly finalDischarge: boolean };
  readonly fossPolicy: { readonly version: 1; readonly digest: string };
}

const file = { path: "source.tar.gz", bytes: 1, sha256: "abc" } as const;
const valid = {
  format: "tabiya-release-manifest",
  formatVersion: 1,
  release: { version: "1.0.0", sourceRevision: "a", createdAt: "2026-08-31T00:00:00.000Z", repository: "https://example.invalid", sourceArchive: file },
  requiredArtifacts: [], optionalArtifacts: [], compose: [], files: [], resourceReceipts: [],
  contentBundle: { producer: "runtime-content@1", digest: "sha256:x", finalDischarge: false },
  fossPolicy: { version: 1, digest: "sha256:y" },
} as const;
void (valid satisfies ReleaseManifestV1);
// @ts-expect-error unknown manifest versions are not forward-compatible guesses
void ({ ...valid, formatVersion: 2 } satisfies ReleaseManifestV1);
// @ts-expect-error required fields cannot disappear
void (({ format: valid.format, formatVersion: valid.formatVersion }) satisfies ReleaseManifestV1);
// @ts-expect-error unknown top-level fields are rejected by the closed literal shape
void ({ ...valid, imageDigest: "sha256:z" } satisfies ReleaseManifestV1);
// @ts-expect-error an accelerated role cannot claim the core tier
void ({ role: "maia-accelerated", tier: "core", subject: "x", platforms: [], platformManifests: [], signatureIdentity: "x", provenancePredicate: "x", sbomPredicate: "x", fossEligible: false } satisfies ReleaseArtifact);
