// Native source-build OCI export → the *loaded* Docker image. No tag, fake manifest, registry
// publication or borrowed platform config can stand in for this byte-verified join.
import { requireDigest, sha256Digest } from "./common.mjs";

const MANIFEST = "application/vnd.oci.image.manifest.v1+json";
const CONFIG = "application/vnd.oci.image.config.v1+json";

function readDescriptor(descriptor, mediaType, readBlob) {
  if (descriptor?.mediaType !== mediaType || !Number.isSafeInteger(descriptor.size) || descriptor.size <= 0 || descriptor.size > 16 * 1024 * 1024) throw new TypeError("invalid OCI identity descriptor");
  const bytes = readBlob(requireDigest(descriptor.digest, "OCI descriptor"));
  if (!(bytes instanceof Uint8Array) || bytes.length !== descriptor.size || sha256Digest(bytes) !== descriptor.digest) throw new TypeError("OCI identity bytes differ from their descriptor");
  return JSON.parse(Buffer.from(bytes).toString("utf8"));
}

export function localMaiaIdentity({ layout, index, image, readBlob }) {
  if (layout?.imageLayoutVersion !== "1.0.0" || index?.schemaVersion !== 2 || !Array.isArray(index.manifests) || index.manifests.length !== 1) throw new TypeError("expected one native OCI image export, without attestations");
  if (image?.Os !== "linux" || !["amd64", "arm64"].includes(image.Architecture)) throw new TypeError("source Maia requires a native supported Linux image");
  const descriptor = index.manifests[0];
  if (descriptor.platform !== undefined && (descriptor.platform.os !== image.Os || descriptor.platform.architecture !== image.Architecture)) throw new TypeError("OCI platform differs from loaded image");
  const manifest = readDescriptor(descriptor, MANIFEST, readBlob);
  if (manifest.schemaVersion !== 2 || manifest.mediaType !== MANIFEST || !Array.isArray(manifest.layers)) throw new TypeError("expected a runnable OCI platform manifest");
  const config = readDescriptor(manifest.config, CONFIG, readBlob);
  if (manifest.config.digest !== requireDigest(image.Id, "loaded image") || config.os !== image.Os || config.architecture !== image.Architecture) throw new TypeError("OCI config does not identify the loaded native image");
  if (config.rootfs?.type !== "layers" || image.RootFS?.Type !== "layers" || !Array.isArray(config.rootfs.diff_ids) || config.rootfs.diff_ids.length !== manifest.layers.length
    || JSON.stringify(config.rootfs.diff_ids) !== JSON.stringify(image.RootFS.Layers)) throw new TypeError("OCI rootfs differs from loaded image");
  for (const id of config.rootfs.diff_ids) requireDigest(id, "rootfs diff id");
  for (const layer of manifest.layers) {
    requireDigest(layer.digest, "layer descriptor");
    if (!Number.isSafeInteger(layer.size) || layer.size < 0 || !["application/vnd.oci.image.layer.v1.tar", "application/vnd.oci.image.layer.v1.tar+gzip", "application/vnd.oci.image.layer.v1.tar+zstd"].includes(layer.mediaType)) throw new TypeError("invalid OCI layer descriptor");
  }
  return Object.freeze({ runtime: "oci", imageId: image.Id, manifestDigest: descriptor.digest, configDigest: manifest.config.digest });
}
