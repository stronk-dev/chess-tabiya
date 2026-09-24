import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { buildSync } from "esbuild";

import { GRADUATION_RULING_ANCHOR_ROOTS } from "../apps/server/src/graduation-ruling-roots.mjs";
import { missingGraduationRulingCopies } from "./graduation-ruling-packaging.mjs";
import { CADDY_IMAGE, DEPLOYMENT_ARTIFACTS, renderDeployment } from "./render-deployment.mjs";

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
const serverImage = `ghcr.io/stronk-dev/chess-tabiya-server@${digest}`;
const maiaImage = `ghcr.io/stronk-dev/chess-tabiya-maia@${digest}`;
const renderedDirectory = mkdtempSync(join(tmpdir(), "chess-tabiya-deploy-"));
const renderedArtifacts = renderDeployment({ serverImage, maiaImage });
required(
  JSON.stringify(Object.keys(renderedArtifacts).sort()) === JSON.stringify(Object.keys(DEPLOYMENT_ARTIFACTS).sort()),
  "Every deployment artifact must render",
);
for (const [name, text] of Object.entries(renderedArtifacts)) writeFileSync(join(renderedDirectory, name), text);
const releasePath = join(renderedDirectory, "compose.yaml");
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

// rfc/safe-deployment-profiles.md criteria 2, 5, 15 — static profile boundaries.
function loopbackOnly(label, config) {
  const server = config.services.server;
  required(server.environment.TABIYA_DEPLOYMENT_PROFILE === "local", `${label}: local profile must be explicit`);
  required(!("TABIYA_COOKIE_SECURE" in server.environment), `${label}: TABIYA_COOKIE_SECURE is no longer an authority`);
  required(Array.isArray(server.ports) && server.ports.length === 1, `${label}: local publishes exactly one port`);
  required(server.ports[0].host_ip === "127.0.0.1" && server.ports[0].target === 3000, `${label}: local must publish on host loopback only, got ${JSON.stringify(server.ports[0])}`);
  for (const [name, service] of Object.entries(config.services)) {
    if (name === "server") continue;
    required(service.ports === undefined || service.ports.length === 0, `${label}: ${name} must not publish a port`);
  }
}
loopbackOnly("compose.yaml", composeConfig(["-f", "compose.yaml", "--profile", "engines"]));
loopbackOnly("release compose.yaml", releaseEngines);

const proxyEnv = { ...process.env, TABIYA_PUBLIC_HOSTNAME: "tabiya.example.org", TABIYA_ACME_EMAIL: "operator@example.org" };
function composeConfigWith(env, args) {
  const result = spawnSync("docker", ["compose", ...args, "config", "--format", "json"], { encoding: "utf8", env });
  if (result.status !== 0) throw new Error(`Compose rendering failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}
for (const profile of ["appliance", "hosted"]) {
  const file = join(renderedDirectory, `compose.${profile}.yaml`);
  const missing = spawnSync("docker", ["compose", "-f", file, "config", "--quiet"], { encoding: "utf8", env: { ...process.env, TABIYA_PUBLIC_HOSTNAME: "", TABIYA_ACME_EMAIL: "" } });
  required(missing.status !== 0, `${profile}: rendering must refuse a missing hostname`);
  const config = composeConfigWith(proxyEnv, ["-f", file, "--profile", "engines"]);
  const { server, caddy, maia } = config.services;
  required(server.environment.TABIYA_DEPLOYMENT_PROFILE === profile, `${profile}: server profile must be ${profile}`);
  required(!("TABIYA_COOKIE_SECURE" in server.environment), `${profile}: no cookie override`);
  required(server.ports === undefined || server.ports.length === 0, `${profile}: the application port must never be published`);
  required(caddy.image === CADDY_IMAGE, `${profile}: Caddy must be the digest-pinned image`);
  required(JSON.stringify(caddy.ports.map((port) => [port.target, port.published]).sort()) === JSON.stringify([[443, "443"], [80, "80"]]), `${profile}: Caddy publishes exactly 80/443`);
  required(caddy.volumes.some((volume) => volume.target === "/etc/caddy/Caddyfile" && volume.read_only === true && volume.source.endsWith(`Caddyfile.${profile}`)), `${profile}: Caddy must mount its rendered Caddyfile read-only`);
  const members = (network) => Object.entries(config.services).filter(([, service]) => service.networks !== undefined && network in service.networks).map(([name]) => name).sort();
  required(JSON.stringify(members("proxy_edge")) === JSON.stringify(["caddy", "server"]), `${profile}: proxy_edge must contain exactly server and caddy`);
  required(JSON.stringify(members("public_edge")) === JSON.stringify(["caddy"]), `${profile}: public_edge must contain only caddy`);
  required(!members("provider_edge").includes("caddy"), `${profile}: Caddy must not join the provider edge`);
  required(JSON.stringify(members("egress")) === JSON.stringify(["server"]), `${profile}: only the server has outbound egress`);
  required(config.networks.proxy_edge.internal === true && config.networks.provider_edge.internal === true, `${profile}: proxy/provider edges must be internal`);
  required(!("default" in config.networks), `${profile}: no service may join the default network`);
  required(server.networks.proxy_edge.aliases.includes("tabiya-proxy-origin"), `${profile}: the proxy origin alias must be on proxy_edge`);
  required(maia.ports === undefined && JSON.stringify(Object.keys(maia.networks)) === JSON.stringify(["provider_edge"]), `${profile}: Maia is provider-edge only`);
  required(caddy.depends_on.server.condition === "service_healthy", `${profile}: Caddy waits for application readiness`);
  const caddyfile = renderedArtifacts[`Caddyfile.${profile}`];
  required(caddyfile.includes("reverse_proxy tabiya-proxy-origin:3000") && caddyfile.includes("health_uri /readyz") && caddyfile.includes("header_up -Forwarded"), `${profile}: Caddyfile must proxy the origin alias with readiness and strip Forwarded`);
  required(caddyfile.includes('Strict-Transport-Security "max-age=31536000"') && !caddyfile.includes("includeSubDomains"), `${profile}: exact HSTS`);
  required(caddyfile.includes("max_size 8MB"), `${profile}: 8 MiB outer body guard`);
  required(caddyfile.includes("tls internal") === (profile === "appliance"), `${profile}: only the appliance uses the internal CA`);
  required(!/on_demand|\*\./u.test(caddyfile), `${profile}: no wildcard or on-demand TLS`);
}

// rfc/storage-backup-recovery.md criterion 12 — the maintenance overlay uses the server's exact image.
for (const [label, base, overlay] of [["development", "compose.yaml", "compose.maintenance.yaml"], ["release", releasePath, join(renderedDirectory, "compose.maintenance.yaml")]]) {
  const missing = spawnSync("docker", ["compose", "-f", base, "-f", overlay, "config", "--quiet"], { encoding: "utf8", env: { ...process.env, TABIYA_BACKUP_DIRECTORY: "" } });
  required(missing.status !== 0, `${label} maintenance: an unset backup directory must refuse`);
  const config = composeConfigWith({ ...process.env, TABIYA_BACKUP_DIRECTORY: "/srv/tabiya-backups" }, ["-f", base, "-f", overlay, "--profile", "maintenance"]);
  const admin = config.services["storage-admin"];
  required(admin.image === config.services.server.image, `${label} maintenance: storage-admin must use the server image`);
  required(admin.ports === undefined && admin.network_mode === "none" && admin.restart === "no", `${label} maintenance: no port, no network, no restart`);
  required(JSON.stringify(admin.entrypoint) === JSON.stringify(["node", "apps/server/dist/storage-admin.js"]), `${label} maintenance: storage-admin entrypoint`);
  required(admin.volumes.some((volume) => volume.target === "/data" && volume.source === config.services.server.volumes[0].source), `${label} maintenance: shares the server data volume`);
  required(admin.volumes.some((volume) => volume.target === "/backup" && volume.source === "/srv/tabiya-backups"), `${label} maintenance: explicit backup mount`);
}
rmSync(renderedDirectory, { recursive: true, force: true });

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
const serverDockerfile = readFileSync("apps/server/Dockerfile", "utf8");
const contentDependencies = new Set();
for (const relative of readdirSync("content", { recursive: true })) {
  if (!relative.endsWith(".json")) continue;
  const source = readFileSync(join("content", relative), "utf8");
  for (const match of source.matchAll(/"blockedBy"\s*:\s*"([^"]+)"/gu)) contentDependencies.add(match[1]);
}
for (const dependency of [...contentDependencies].sort()) {
  required(existsSync(dependency), `Content graduation dependency does not exist: ${dependency}`);
  required(serverDockerfile.includes(`COPY ${dependency} ${dependency}`), `Production image must contain referenced content dependency ${dependency}`);
}
const serverBuild = JSON.parse(readFileSync("apps/server/package.json", "utf8")).scripts.build;
required(serverBuild.includes("src/main.ts") && serverBuild.includes("--bundle"), "Server build must bundle its runtime entry");
// rfc/storage-backup-recovery.md §8: the shipped image carries the storage-admin entry point.
required(serverBuild.includes("storage-admin=src/storage-admin-cli.ts"), "Server build must emit dist/storage-admin.js");
required(serverDockerfile.includes("ARG TABIYA_APPLICATION_REVISION") && serverDockerfile.includes("org.opencontainers.image.revision=$TABIYA_APPLICATION_REVISION"), "Server image must embed its immutable source revision");
required(serverDockerfile.includes("/readyz"), "Server image health must use readiness");
for (const ignored of ["data", "backups"]) {
  required(readFileSync(".dockerignore", "utf8").split(/\r?\n/u).includes(ignored), `Image context must exclude local ${ignored}`);
  required(readFileSync(".gitignore", "utf8").split(/\r?\n/u).includes(`/${ignored}/`), `Git must ignore local ${ignored}`);
}
// D655 / rfc/verifiable-runtime-distribution.md §4: the default Maia image is the CPU tier.
const maiaDockerfile = readFileSync("workers/maia/Dockerfile", "utf8");
required(maiaDockerfile.includes("https://download.pytorch.org/whl/cpu") && maiaDockerfile.includes("torch==2.8.0+cpu"), "Maia image must install the pinned CPU-only torch");
required(/grep -Eiq[^\n]*nvidia[^\n]*&& exit 1/u.test(maiaDockerfile), "Maia image must refuse any NVIDIA/CUDA distribution");

const runtimeBundle = buildSync({
  entryPoints: ["apps/server/src/main.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  external: [...serverBuild.matchAll(/--external:([^\s]+)/gu)].map((match) => match[1]),
  metafile: true,
  write: false,
});
const runtimeExternals = Object.values(runtimeBundle.metafile.outputs)
  .flatMap((output) => output.imports)
  .filter((item) => item.external && !item.path.startsWith("node:"))
  .map((item) => item.path);
required(runtimeExternals.length === 0, `Server runtime bundle imports packages absent from final image: ${runtimeExternals.join(", ")}`);
// rfc/longitudinal-store.md criterion 29: the semantic executor ships as its own dist entry that the
// bundled main resolves relative to itself; the image copies the whole server dist.
required(serverBuild.includes("src/longitudinal-worker-thread.ts"), "Server build must emit dist/longitudinal-worker-thread.js");
const mainText = buildSync({
  entryPoints: ["apps/server/src/main.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  external: [...serverBuild.matchAll(/--external:([^\s]+)/gu)].map((match) => match[1]),
  write: false,
}).outputFiles[0].text;
required(mainText.includes('new URL("./longitudinal-worker-thread.js", import.meta.url)'), "Bundled main must resolve the sibling longitudinal worker thread");
required(!mainText.includes("longitudinalSemanticPopulation") && !/function projectObservations\b/u.test(mainText), "Bundled main must not contain the longitudinal projector");
required(serverDockerfile.includes("COPY --from=build /app/apps/server/dist apps/server/dist"), "Production image must copy the whole server dist, including the worker thread");
for (const root of missingGraduationRulingCopies(GRADUATION_RULING_ANCHOR_ROOTS, serverDockerfile)) {
  required(false, `Production image must include the graduation-ruling source ${root}`);
}
required(
  readFileSync("apps/server/Dockerfile", "utf8").includes("install-stockfish-linux /opt/stockfish"),
  "Production image must install the shared Stockfish pin",
);
const openingCommit = "4b8622759e7ae6f93f011cc6c83a3823401ab45e";
for (const name of ["COPYING.txt", "a.tsv", "b.tsv", "c.tsv", "d.tsv", "e.tsv"]) {
  required(existsSync(`vendor/chess-openings/${openingCommit}/${name}`), `Pinned opening source is missing ${name}`);
}
required(serverDockerfile.includes("COPY --from=build /app/apps/server/artifacts apps/server/artifacts"), "Production image must contain the compiled runtime opening catalogue");
required(!serverDockerfile.includes("COPY vendor"), "Production image must not copy raw opening TSV inputs");
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
