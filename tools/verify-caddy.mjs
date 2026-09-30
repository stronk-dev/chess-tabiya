// Configuration proof only. Fixture server/Maia identities never start product containers and
// are not operator deployment receipts. The actual renderer and checksum-pinned Caddy are used.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CADDY_IMAGE, renderDeployment } from "./render-deployment.mjs";

export function requireEarlyUploadResponse(caddyfile, profile) {
  const directives = caddyfile.split("\n").map((line) => line.split("#", 1)[0].trim());
  if (!directives.includes("enable_full_duplex")) throw new Error(`${profile}: early upload refusals require HTTP/1 full duplex`);
}

export function validateCaddyProfiles() {
  const fixtureDigest = `sha256:${"a".repeat(64)}`;
  const artifacts = renderDeployment({
    serverImage: `fixture.invalid/server@${fixtureDigest}`, maiaImage: `fixture.invalid/maia@${fixtureDigest}`,
    maiaManifestDigest: fixtureDigest, maiaConfigDigests: { "linux/amd64": `sha256:${"b".repeat(64)}`, "linux/arm64": `sha256:${"c".repeat(64)}` },
  });
  const work = mkdtempSync(join(tmpdir(), "tabiya-caddy-validate-"));
  try {
    for (const profile of ["appliance", "hosted"]) {
      const caddyfile = artifacts[`Caddyfile.${profile}`];
      requireEarlyUploadResponse(caddyfile, profile);
      const file = join(work, `Caddyfile.${profile}`);
      writeFileSync(file, caddyfile);
      const result = spawnSync("docker", ["run", "--rm", "--network", "none",
        "--env", "TABIYA_PUBLIC_HOSTNAME=tabiya.example.org", "--env", "TABIYA_ACME_EMAIL=operator@example.org",
        "--mount", `type=bind,src=${file},dst=/etc/caddy/Caddyfile,readonly`, CADDY_IMAGE,
        "caddy", "validate", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"],
      { encoding: "utf8", timeout: 60_000 });
      if (result.status !== 0) throw new Error(`${profile}: pinned Caddy validation failed: ${result.stderr || result.error || result.stdout}`);
      console.log(`Caddy ${profile}: exact rendered configuration valid (${CADDY_IMAGE})`);
    }
  } finally { rmSync(work, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) validateCaddyProfiles();
