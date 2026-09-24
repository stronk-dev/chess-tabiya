import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { buildSync } from "esbuild";

import { GRADUATION_RULING_ANCHOR_ROOTS } from "../apps/server/src/graduation-ruling-roots.mjs";
import { missingGraduationRulingCopies } from "./graduation-ruling-packaging.mjs";

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

// rfc/verifiable-runtime-distribution.md §1: release Compose profiles are generated from pushed
// digests by tools/release/release-set.mjs (no hand-edited template).
const { renderCompose } = await import("./release/lib/release-set.mjs");
const digest = `sha256:${"a".repeat(64)}`;
const serverSubject = `ghcr.io/stronk-dev/chess-tabiya-server@${digest}`;
const maiaSubject = `ghcr.io/stronk-dev/chess-tabiya-maia-cpu@sha256:${"b".repeat(64)}`;
for (const profile of ["local", "appliance", "hosted"]) {
  for (const maia of [null, maiaSubject]) {
    const releasePath = join(tmpdir(), `chess-tabiya-compose-${profile}-${maia === null ? "core" : "cpu"}-${process.pid}.yaml`);
    writeFileSync(releasePath, renderCompose({ profile, serverSubject, maiaSubject: maia, version: "0.0.0-check" }));
    compose(["-f", releasePath]);
    const rendered = composeConfig(["-f", releasePath]);
    required(JSON.stringify(Object.keys(rendered.services).sort()) === JSON.stringify(maia === null ? ["server"] : ["maia", "server"]), `Release ${profile} profile has unexpected services`);
    required(rendered.services.server.image === serverSubject, "Release Compose must reference the digest-pinned server subject");
    required(Number(rendered.services.server.mem_limit) === 512 * 1024 * 1024, "Release server must carry the 512 MiB core limit");
    if (maia !== null) required(rendered.services.server.depends_on.maia.condition === "service_healthy", "Release cpu profile must health-gate Maia");
  }
}

const release = readFileSync(".github/workflows/release.yml", "utf8");
const verifyWorkflow = readFileSync(".github/workflows/verify.yml", "utf8");
const browserWorkflow = readFileSync(".github/workflows/browser.yml", "utf8");
for (const expected of [
  "  verify:",
  "ENGINES_REQUIRED: \"1\"",
  "- run: make verify",
  "- run: make release-policy-check",
  "needs: [eligibility, verify, build]",
  "runner: ubuntu-24.04-arm",
  "node tools/release/native-proof.mjs",
  "node tools/release/assemble-release.mjs",
  "node tools/release/verify-release.mjs",
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
}
const { planRuntimeContent } = await import("./release/lib/runtime-content.mjs");
const runtimeFacts = planRuntimeContent().facts;
for (const dependency of runtimeFacts.resolvedPaths) required(existsSync(dependency), `Compiled runtime dependency does not exist: ${dependency}`);
required(runtimeFacts.resolvedPaths.length > 0 && Object.keys(runtimeFacts.rulingLines).length > 0, "Served packs' blockedBy targets and ruling anchors must compile into runtime-content facts");
const serverBuild = JSON.parse(readFileSync("apps/server/package.json", "utf8")).scripts.build;
required(serverBuild.includes("src/main.ts") && serverBuild.includes("--bundle"), "Server build must bundle its runtime entry");
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
// rfc/verifiable-runtime-distribution.md §4: the image carries the runtime entries only (main + the
// longitudinal worker thread and its two operator CLIs), never the authoring/sourcing tool bundles.
required(/COPY --from=build \/app\/apps\/server\/dist\/main\.js \/app\/apps\/server\/dist\/longitudinal-worker-thread\.js /u.test(serverDockerfile), "Production image must copy the server main entry and its sibling longitudinal worker thread");
required(!serverDockerfile.includes("COPY --from=build /app/apps/server/dist apps/server/dist"), "Production image must not copy authoring tool bundles from the server dist");
// rfc/verifiable-runtime-distribution.md §7: ruling anchors and blockedBy targets reach the image
// only as compiled facts (TABIYA_RUNTIME_CONTENT_FACTS); the prose roots stay out of the final stage.
required(serverDockerfile.includes("ENV TABIYA_RUNTIME_CONTENT_FACTS=/app/runtime-content/facts.json"), "Production image must answer ruling anchors from compiled runtime-content facts");
for (const root of GRADUATION_RULING_ANCHOR_ROOTS) {
  required(missingGraduationRulingCopies([root], serverDockerfile.slice(serverDockerfile.lastIndexOf("\nFROM "))).length === 1, `Production image final stage must not copy the prose root ${root}`);
}
required(
  readFileSync("apps/server/Dockerfile", "utf8").includes("install-stockfish-linux /opt/stockfish"),
  "Production image must install the shared Stockfish pin",
);
const openingCommit = "4b8622759e7ae6f93f011cc6c83a3823401ab45e";
for (const name of ["COPYING.txt", "a.tsv", "b.tsv", "c.tsv", "d.tsv", "e.tsv"]) {
  required(existsSync(`vendor/chess-openings/${openingCommit}/${name}`), `Pinned opening source is missing ${name}`);
}
required(JSON.parse(readFileSync("release/runtime-content-rights.v1.json", "utf8")).openingCatalogue.path === "apps/server/artifacts/runtime-opening-catalogue.json" && serverDockerfile.includes("COPY --from=release-inputs /release/app/ /app/"), "Production image must contain the compiled runtime opening catalogue through the runtime-content bundle");
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
