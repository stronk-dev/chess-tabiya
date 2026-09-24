#!/usr/bin/env node
// Release workflow job `release-set` (CI only): assembles the closed release set from the pre-image
// files, the native-proof SBOMs and the pushed image digests, checks cross-architecture drift,
// renders the digest-pinned Compose profiles, generates the manifest exactly once and SHA256SUMS.
// Native resource receipts enter the manifest only once the F12-H/bot journeys produce the
// v1 receipt ids; until then a 1.0-class release is refused by the manifest validator.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { readJson } from "./lib/common.mjs";
import { CHECKSUMS_NAME, COMPOSE_PROFILES, RELEASE_MANIFEST_NAME, generateReleaseManifest, renderChecksums, renderCompose, verifyReleaseSet } from "./lib/release-set.mjs";
import { architectureDrift } from "./lib/sbom.mjs";

const { values } = parseArgs({ options: { images: { type: "string" }, version: { type: "string" }, revision: { type: "string" }, repository: { type: "string" }, "pre-image": { type: "string" }, proof: { type: "string" }, out: { type: "string" }, receipts: { type: "string" } } });
const images = JSON.parse(values.images);
const out = values.out;
const pre = readJson(join(values["pre-image"], "pre-image.json"));
mkdirSync(join(out, "sbom"), { recursive: true });
copyFileSync(join(values["pre-image"], "doc/LICENSE"), join(out, "LICENSE"));
copyFileSync(join(values["pre-image"], "doc/NOTICE.txt"), join(out, "NOTICE.txt"));
const archive = `chess-tabiya-${values.version}-source.tar.gz`;
copyFileSync(join(values["pre-image"], archive), join(out, archive));
for (const name of readdirSync(join(values.proof, "sbom"))) copyFileSync(join(values.proof, "sbom", name), join(out, "sbom", name));
for (const role of Object.keys(images)) {
  const drift = architectureDrift(JSON.parse(readFileSync(join(out, "sbom", `${role}-linux-amd64.spdx.json`), "utf8")), JSON.parse(readFileSync(join(out, "sbom", `${role}-linux-arm64.spdx.json`), "utf8")), { allowed: ["stockfish"] });
  if (drift.length > 0) throw new Error(`${role} amd64/arm64 package drift:\n- ${drift.join("\n- ")}`);
}
for (const profile of COMPOSE_PROFILES) writeFileSync(join(out, `compose.${profile}.yaml`), renderCompose({ profile, serverSubject: images.server.subject, maiaSubject: images["maia-cpu"]?.subject ?? null, version: values.version }));
writeFileSync(join(out, RELEASE_MANIFEST_NAME), generateReleaseManifest({
  dir: out,
  version: values.version,
  sourceRevision: values.revision,
  createdAt: new Date().toISOString(),
  repository: values.repository,
  images,
  resourceReceipts: values.receipts !== undefined && existsSync(values.receipts) ? readJson(values.receipts) : [],
  contentBundle: pre.runtimeContent,
  fossPolicy: { version: 1, digest: pre.fossPolicy },
  sourceArchive: archive,
}));
const files = ["LICENSE", "NOTICE.txt", archive, RELEASE_MANIFEST_NAME, ...COMPOSE_PROFILES.map((profile) => `compose.${profile}.yaml`), ...readdirSync(join(out, "sbom")).map((name) => `sbom/${name}`)];
writeFileSync(join(out, CHECKSUMS_NAME), renderChecksums(out, files));
verifyReleaseSet(out);
writeFileSync(join(out, "RELEASE-NOTES.md"), `Tabiya ${values.version} (${values.revision}).\n\nVerify before installing: see docs/release.md at this revision. Images:\n${Object.entries(images).map(([role, image]) => `- ${role}: \`${image.subject}\``).join("\n")}\n`);
console.log(`release set assembled in ${out}`);
