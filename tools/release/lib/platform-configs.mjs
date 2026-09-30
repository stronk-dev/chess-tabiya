import { requireDigest } from "./common.mjs";

// Called only after the publisher has immutable platform-manifest subjects. This reads both
// manifests; an index's config or one architecture's config is not the other's identity.
export function readPlatformConfigDigests(repository, platforms, inspectManifest) {
  if (typeof repository !== "string" || !/^[a-z0-9.-]+(?::[0-9]+)?\/[a-z0-9._/-]+$/u.test(repository)) throw new TypeError("invalid image repository");
  if (!platforms || Object.keys(platforms).sort().join(",") !== "linux/amd64,linux/arm64") throw new TypeError("expected both native platform manifests");
  const result = {};
  for (const platform of ["linux/amd64", "linux/arm64"]) {
    const digest = requireDigest(platforms[platform], `${platform} manifest`);
    const manifest = JSON.parse(inspectManifest(`${repository}@${digest}`));
    if (manifest.schemaVersion !== 2 || !Array.isArray(manifest.layers)
      || !["application/vnd.oci.image.config.v1+json", "application/vnd.docker.container.image.v1+json"].includes(manifest.config?.mediaType)) {
      throw new TypeError(`${platform} must reference a runnable platform image manifest`);
    }
    result[platform] = requireDigest(manifest.config.digest, `${platform} config`);
  }
  return result;
}
