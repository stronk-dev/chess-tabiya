#!/usr/bin/env node
// Release workflow registry steps (CI only; never run locally). Registry authority is granted only
// to the post-verification jobs that call these modes.
//   --images DIR --sha SHA --maia true|false --github-output F   push platform archives by digest,
//                                                                 assemble candidate indexes, emit IMAGES JSON
//   --subjects IMAGES --github-output F                          expose index/platform digests as outputs
//   --sign IMAGES                                                keyless cosign signature per index digest
//   --tag IMAGES --version V                                     apply v<V> tags to the signed indexes
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: {
  images: { type: "string" }, sha: { type: "string" }, maia: { type: "string" }, "github-output": { type: "string" },
  subjects: { type: "string" }, sign: { type: "string" }, tag: { type: "string" }, version: { type: "string" },
} });
const run = (command, args) => execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
const output = (lines) => { if (values["github-output"] !== undefined) appendFileSync(values["github-output"], `${lines.join("\n")}\n`); };
const repositories = { server: process.env.SERVER_REPOSITORY, "maia-cpu": process.env.MAIA_REPOSITORY };

if (values.images !== undefined) {
  const roles = values.maia === "true" ? ["server", "maia-cpu"] : ["server"];
  const images = {};
  for (const role of roles) {
    const platforms = {};
    for (const arch of ["amd64", "arm64"]) {
      const digestFile = join(values.images, `${role}-${arch}.digest`);
      run("skopeo", ["copy", "--format", "oci", "--digestfile", digestFile, `docker-archive:${join(values.images, `${role}-${arch}.tar`)}`, `docker://${repositories[role]}:candidate-${values.sha}-${arch}`]);
      platforms[`linux/${arch}`] = readFileSync(digestFile, "utf8").trim();
    }
    run("docker", ["buildx", "imagetools", "create", "-t", `${repositories[role]}:candidate-${values.sha}`, ...Object.values(platforms).map((digest) => `${repositories[role]}@${digest}`)]);
    const index = JSON.parse(run("docker", ["buildx", "imagetools", "inspect", `${repositories[role]}:candidate-${values.sha}`, "--format", "{{json .Manifest}}"])).digest;
    // The provider-health identity probe reports a config digest; record the amd64 platform's
    // (the rendered Compose carries one value, as tools/render-deployment.mjs defines it).
    const config = JSON.parse(run("docker", ["buildx", "imagetools", "inspect", "--raw", `${repositories[role]}@${platforms["linux/amd64"]}`])).config.digest;
    images[role] = { subject: `${repositories[role]}@${index}`, platforms, fossEligible: true, configDigest: config };
  }
  output([`images=${JSON.stringify(images)}`]);
  console.log(JSON.stringify(images, null, 2));
} else if (values.subjects !== undefined) {
  const images = JSON.parse(values.subjects);
  const lines = [];
  for (const [role, image] of Object.entries(images)) {
    const key = role === "server" ? "server" : "maia";
    lines.push(`${key}_index=${image.subject.split("@")[1]}`, `${key}_amd64=${image.platforms["linux/amd64"]}`, `${key}_arm64=${image.platforms["linux/arm64"]}`);
  }
  output(lines);
} else if (values.sign !== undefined) {
  for (const image of Object.values(JSON.parse(values.sign))) run("cosign", ["sign", "--yes", image.subject]);
} else if (values.tag !== undefined) {
  for (const image of Object.values(JSON.parse(values.tag))) {
    const repository = image.subject.split("@")[0];
    run("skopeo", ["copy", "--all", "--preserve-digests", `docker://${image.subject}`, `docker://${repository}:v${values.version}`]);
  }
} else {
  console.error("usage: publish-images.mjs --images|--subjects|--sign|--tag …");
  process.exit(64);
}
