#!/usr/bin/env node
// Source-build counterpart of the strict release renderer. Never publishes or creates a release
// index. CPU builds export genuine OCI bytes and load the same build into the local image store.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { renderSourceDeployment, validPublicHostname } from "./render-deployment.mjs";
import { localMaiaIdentity } from "./release/lib/local-maia-identity.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SOURCE_BUILDER = "tabiya-source-v1";
// Official v0.24.0 index, read from Docker Hub; no mutable BuildKit tag is executed.
export const SOURCE_BUILDKIT_IMAGE = "docker.io/moby/buildkit:v0.24.0@sha256:6eceb8971ce4fceb3daca562832642706238b7eea72941fcf9896c93c3c4a53e";

const docker = (args, options = {}) => execFileSync("docker", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, ...options });
const inspectImage = (name) => JSON.parse(docker(["image", "inspect", name]))[0];

export function maiaSourceBuildArguments({ platform, image, layout }) {
  if (!["linux/amd64", "linux/arm64"].includes(platform)) throw new TypeError("unsupported native source platform");
  if (typeof image !== "string" || !/^[a-z0-9./_-]+:[a-z0-9._-]+$/u.test(image)) throw new TypeError("source build requires a local image tag");
  if (typeof layout !== "string" || layout.includes(",")) throw new TypeError("invalid OCI export path");
  return ["buildx", "build", "--builder", SOURCE_BUILDER, "--platform", platform, "--provenance=false", "--sbom=false", "--tag", image,
    "--output", `type=oci,tar=false,oci-mediatypes=true,dest=${layout}`, "--output", "type=docker,oci-mediatypes=true", "workers/maia"];
}

export function requireSourceBuilder(builder, context) {
  if (builder.Name !== SOURCE_BUILDER || builder.Driver !== "docker-container" || builder.Nodes?.length !== 1
    || builder.Nodes[0].Endpoint !== context || builder.Nodes[0].DriverOpts?.image !== SOURCE_BUILDKIT_IMAGE) {
    throw new Error("SOURCE_BUILDER_REFUSED: the tabiya-source-v1 builder is not the pinned, local Tabiya builder; do not modify a foreign builder");
  }
}

// Buildx inspect has no --format option (including the installed 0.28 release). Parse only the
// fields required for ownership; a missing/ambiguous node or option fails instead of guessing.
export function parseSourceBuilder(text) {
  const halves = text.split(/^Nodes:\s*$/mu);
  if (halves.length !== 2) throw new TypeError("invalid Buildx inspect output");
  const field = (source, label) => {
    const matches = [...source.matchAll(new RegExp(`^${label}:\\s*([^\\n]+)$`, "gmu"))];
    if (matches.length !== 1) throw new TypeError(`ambiguous Buildx ${label}`);
    return matches[0][1].trim();
  };
  field(halves[1], "Name");
  const option = /^image="([^"]+)"$/u.exec(field(halves[1], "Driver Options"));
  if (option === null) throw new TypeError("invalid Buildx image option");
  return { Name: field(halves[0], "Name"), Driver: field(halves[0], "Driver"), Nodes: [{ Endpoint: field(halves[1], "Endpoint"), DriverOpts: { image: option[1] } }] };
}

function ensureBuilder() {
  const context = docker(["context", "show"]).trim();
  const inspected = spawnSync("docker", ["buildx", "inspect", SOURCE_BUILDER], { encoding: "utf8" });
  if (inspected.status !== 0) {
    // No --use: this never changes the operator's selected builder or Docker context.
    docker(["buildx", "create", "--name", SOURCE_BUILDER, "--driver", "docker-container", "--driver-opt", `image=${SOURCE_BUILDKIT_IMAGE}`, context], { stdio: "inherit" });
  }
  requireSourceBuilder(parseSourceBuilder(docker(["buildx", "inspect", SOURCE_BUILDER])), context);
}

export function renderSourceImages({ out, tier, server, maia, layout, readBlob }) {
  if (!["core", "cpu"].includes(tier)) throw new TypeError("source deployment tier must be core or cpu");
  if (server?.Os !== "linux" || !["amd64", "arm64"].includes(server.Architecture) || !/^sha256:[0-9a-f]{64}$/u.test(server.Id)) throw new TypeError("source server must be a loaded native Linux image");
  let identity;
  if (tier === "cpu") {
    if (server.Architecture !== maia?.Architecture) throw new TypeError("server and Maia source images must use the same native platform");
    identity = localMaiaIdentity({ ...layout, image: maia, readBlob });
  }
  const artifacts = renderSourceDeployment({ serverImage: server.Id, maiaImage: identity?.imageId ?? "chess-tabiya-maia:dev", maiaIdentity: identity });
  mkdirSync(out, { recursive: true });
  for (const [file, text] of Object.entries(artifacts)) writeFileSync(join(out, file), text);
  // Operational build receipt, explicitly not a signed/published release manifest.
  writeFileSync(join(out, "source-images.json"), JSON.stringify({ distribution: "source-build", tier, platform: `linux/${server.Architecture}`, serverImage: server.Id, maia: identity ?? null }, null, 2) + "\n");
  return artifacts;
}

export function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({ args: argv, options: { out: { type: "string" }, tier: { type: "string", default: "core" }, build: { type: "boolean", default: false }, "server-image": { type: "string", default: "chess-tabiya-server:dev" }, "maia-image": { type: "string", default: "chess-tabiya-maia:dev" }, "check-hostname": { type: "string" } } });
  if (values.out === undefined || !["core", "cpu"].includes(values.tier)) throw new TypeError("usage: source-deployment.mjs --out <directory> [--tier core|cpu] [--build] [--check-hostname <name>]");
  if (values["check-hostname"] !== undefined && !validPublicHostname(values["check-hostname"])) throw new TypeError("HOSTNAME_INVALID: use an exact lower-case DNS hostname, not an IP or .local name");
  const out = resolve(values.out);
  const layoutDirectory = join(out, "maia-oci");
  if (values.build) {
    const revision = process.env.TABIYA_APPLICATION_REVISION ?? "dev+dirty";
    if (!/^[a-z0-9./_-]+:[a-z0-9._-]+$/u.test(values["server-image"])) throw new TypeError("source build requires a local server image tag");
    docker(["build", "-f", "apps/server/Dockerfile", "--build-arg", `TABIYA_APPLICATION_REVISION=${revision}`, "-t", values["server-image"], "."], { stdio: "inherit" });
    if (values.tier === "cpu") {
      const platform = "linux/" + docker(["version", "--format", "{{.Server.Arch}}"]).trim();
      const args = maiaSourceBuildArguments({ platform, image: values["maia-image"], layout: layoutDirectory });
      ensureBuilder();
      docker(args, { stdio: "inherit" });
    }
  }
  const server = inspectImage(values["server-image"]);
  const maia = values.tier === "cpu" ? inspectImage(values["maia-image"]) : undefined;
  const readJson = (file) => JSON.parse(readFileSync(join(layoutDirectory, file), "utf8"));
  renderSourceImages({ out, tier: values.tier, server, maia, layout: values.tier === "cpu" ? { layout: readJson("oci-layout"), index: readJson("index.json") } : undefined,
    readBlob: (id) => readFileSync(join(layoutDirectory, "blobs", "sha256", id.slice(7))),
  });
  console.error(`source-build ${values.tier} deployment rendered into ${out}; release index not attached`);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 2; }
}
