import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function required(condition, message) {
  if (!condition) throw new Error(message);
}

function compose(args) {
  const result = spawnSync("docker", ["compose", ...args, "config", "--quiet"], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`Compose validation failed: ${result.stderr || result.stdout}`);
  }
}

function composeConfig(args) {
  const result = spawnSync(
    "docker",
    ["compose", ...args, "config", "--format", "json"],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(`Compose rendering failed: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

compose(["-f", "compose.yaml"]);
compose(["-f", "compose.yaml", "--profile", "engines"]);
compose(["-f", "compose.yaml", "--profile", "devcontainer"]);

const digest = `sha256:${"a".repeat(64)}`;
const template = readFileSync("deploy/compose.release.template.yaml", "utf8");
const rendered = template
  .replaceAll("__SERVER_IMAGE__", `ghcr.io/stronk-dev/chess-tabiya-server@${digest}`)
  .replaceAll("__MAIA_IMAGE__", `ghcr.io/stronk-dev/chess-tabiya-maia@${digest}`);
required(!rendered.includes("__SERVER_IMAGE__"), "Server image placeholder survived");
required(!rendered.includes("__MAIA_IMAGE__"), "Maia image placeholder survived");
const releasePath = join(tmpdir(), `chess-tabiya-compose-${process.pid}.yaml`);
writeFileSync(releasePath, rendered);
compose(["-f", releasePath]);
compose(["-f", releasePath, "--profile", "engines"]);
const releaseDefault = composeConfig(["-f", releasePath]);
required(
  JSON.stringify(Object.keys(releaseDefault.services)) === JSON.stringify(["server"]),
  `Release light profile must contain only server; got ${JSON.stringify(Object.keys(releaseDefault.services))}`,
);
const releaseEngines = composeConfig(["-f", releasePath, "--profile", "engines"]);
required(
  releaseEngines.services.server.depends_on.maia.condition === "service_healthy",
  "Release engines profile must health-gate Maia",
);

const release = readFileSync(".github/workflows/release.yml", "utf8");
for (const expected of [
  "linux/amd64,linux/arm64",
  "chess-tabiya-server:${{ github.ref_name }}",
  "chess-tabiya-server:${{ github.sha }}",
  "chess-tabiya-maia:${{ github.ref_name }}",
  "chess-tabiya-maia:${{ github.sha }}",
  "@${{ needs.server.outputs.digest }}",
  "@${{ needs.maia.outputs.digest }}",
]) {
  required(release.includes(expected), `Release workflow is missing ${expected}`);
}

const devcontainer = JSON.parse(
  readFileSync(".devcontainer/devcontainer.json", "utf8"),
);
required(devcontainer.dockerComposeFile === "../compose.yaml", "Devcontainer must use Compose");
required(devcontainer.service === "dev", "Devcontainer must target the dev service");
required(
  readFileSync(".devcontainer/Dockerfile", "utf8").includes("stockfish"),
  "Devcontainer must include Stockfish",
);

required(
  readFileSync(".dockerignore", "utf8")
    .split(/\r?\n/u)
    .includes("content/drafts"),
  "Production image context must exclude content/drafts",
);

console.log("packaging verification: OK");
