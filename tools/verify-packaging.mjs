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
const verifyWorkflow = readFileSync(".github/workflows/verify.yml", "utf8");
const browserWorkflow = readFileSync(".github/workflows/browser.yml", "utf8");
for (const expected of [
  "verify:",
  "ENGINES_REQUIRED: \"1\"",
  "- run: make verify",
  "needs: verify",
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
for (const [name, workflow] of [["verify", verifyWorkflow], ["release", release]]) {
  required(workflow.includes("ubuntu-24.04"), `${name} workflow must pin the GA Ubuntu runner`);
  required(workflow.includes('tools/install-stockfish-linux.sh "$RUNNER_TEMP/stockfish"'), `${name} workflow must install the shared Stockfish pin`);
  required(workflow.includes('SF_CMD=$RUNNER_TEMP/stockfish/bin/stockfish'), `${name} workflow must test the pinned Stockfish binary`);
  required(!workflow.includes("apt-get install -y stockfish"), `${name} workflow must not install an unpinned distro Stockfish`);
}
required(browserWorkflow.includes("ubuntu-24.04"), "Browser workflow must pin the GA Ubuntu runner");

const devcontainer = JSON.parse(
  readFileSync(".devcontainer/devcontainer.json", "utf8"),
);
required(devcontainer.dockerComposeFile === "../compose.yaml", "Devcontainer must use Compose");
required(devcontainer.service === "dev", "Devcontainer must target the dev service");
required(
  readFileSync(".devcontainer/Dockerfile", "utf8").includes("install-stockfish-linux /opt/stockfish"),
  "Devcontainer must install the shared Stockfish pin",
);

required(
  !readFileSync(".dockerignore", "utf8").split(/\r?\n/u).includes("content/drafts"),
  "Production image context must include disclosed draft packs",
);
required(
  readFileSync("apps/server/Dockerfile", "utf8").includes(
    "COPY planning/exploration/log.md planning/exploration/log.md",
  ),
  "Production image must include the append-only ruling register used by pack admission",
);
required(
  readFileSync("apps/server/Dockerfile", "utf8").includes(
    "COPY docs/tablebase-grounding.md docs/tablebase-grounding.md",
  ),
  "Production image must include the permanent-property source used by pack admission",
);
required(
  readFileSync("apps/server/Dockerfile", "utf8").includes("install-stockfish-linux /opt/stockfish"),
  "Production image must install the shared Stockfish pin",
);
const stockfishInstaller = readFileSync("tools/install-stockfish-linux.sh", "utf8");
for (const expected of [
  'STOCKFISH_VERSION="18"',
  'STOCKFISH_COMMIT="cb3d4ee9b47d0c5aae855b12379378ea1439675c"',
  'X86_SHA256="5c6f38b02a4da5f3ffe763f27da6c3e743eebefd92b50cb3661623b96696adff"',
  'SOURCE_SHA256="b5d3b85e08cdf9189a4753142eb21a4333983d97501531b19e1cd1ac9fc43f35"',
]) {
  required(stockfishInstaller.includes(expected), `Stockfish installer is missing ${expected}`);
}

console.log("packaging verification: OK");
