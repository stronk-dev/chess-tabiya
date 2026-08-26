import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const requiredDirectories = [
  "apps/server",
  "apps/web",
  "packages/runtime",
  "packages/schema",
  "workers",
  "content/packs",
  "content/drafts",
  "schemas",
];

const requiredPackages = new Map([
  ["apps/server/package.json", "@chess-tabiya/server"],
  ["apps/web/package.json", "@chess-tabiya/web"],
  ["packages/runtime/package.json", "@chess-tabiya/runtime"],
  ["packages/schema/package.json", "@chess-tabiya/schema"],
]);

const failures = [];

export function missingMakeDependencies(makefile, target, requiredDependencies) {
  const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rule = makefile.match(new RegExp(`^${escapedTarget}:\\s*(.+)$`, "m"));
  const dependencies = new Set(rule?.[1]?.trim().split(/\s+/) ?? []);
  return {
    ruleFound: Boolean(rule),
    missing: requiredDependencies.filter((dependency) => !dependencies.has(dependency)),
  };
}

export function missingRequiredText(text, required) {
  return required.filter((value) => !text.includes(value));
}

async function requirePath(path) {
  try {
    await access(resolve(root, path));
  } catch {
    failures.push(`missing required path: ${path}`);
  }
}

async function readText(path) {
  try {
    return await readFile(resolve(root, path), "utf8");
  } catch {
    failures.push(`cannot read required file: ${path}`);
    return "";
  }
}

for (const directory of requiredDirectories) {
  await requirePath(directory);
}

for (const [path, expectedName] of requiredPackages) {
  const text = await readText(path);
  if (!text) continue;

  try {
    const manifest = JSON.parse(text);
    if (manifest.name !== expectedName) {
      failures.push(`${path}: expected package name ${expectedName}`);
    }
    if (manifest.private !== true || manifest.type !== "module") {
      failures.push(`${path}: workspace packages must be private ESM packages`);
    }
  } catch (error) {
    failures.push(`${path}: invalid JSON (${error.message})`);
  }
}

const rootManifestText = await readText("package.json");
if (rootManifestText) {
  const manifest = JSON.parse(rootManifestText);
  if (manifest.name !== "chess-tabiya" || manifest.packageManager !== "pnpm@11.18.0") {
    failures.push("package.json: expected chess-tabiya with pnpm@11.18.0");
  }
  const expectedDevDependencies = {
    "fast-check": "4.9.0",
    typescript: "5.9.2",
    vitest: "4.1.10",
  };
  for (const [name, version] of Object.entries(expectedDevDependencies)) {
    if (manifest.devDependencies?.[name] !== version) {
      failures.push(`package.json: expected ${name}@${version}`);
    }
  }
}

const runtimeManifestText = await readText("packages/runtime/package.json");
if (runtimeManifestText) {
  const manifest = JSON.parse(runtimeManifestText);
  if (manifest.dependencies?.chessops !== "0.15.1") {
    failures.push("packages/runtime/package.json: expected chessops@0.15.1");
  }
}

const webManifestText = await readText("apps/web/package.json");
if (webManifestText) {
  const manifest = JSON.parse(webManifestText);
  if (manifest.dependencies?.svelte !== "5.56.8") {
    failures.push("apps/web/package.json: expected svelte@5.56.8");
  }
}

const license = await readText("LICENSE");
if (!license.includes("GNU AFFERO GENERAL PUBLIC LICENSE") || !license.includes("Version 3")) {
  failures.push("LICENSE: expected the complete GNU AGPL version 3 text");
}

const makefile = await readText("Makefile");
const requiredVerifyDependencies = ["verify-software", "verify-governance", "verify-content"];
const verifyDependencies = missingMakeDependencies(
  makefile,
  "verify",
  requiredVerifyDependencies,
);
if (!verifyDependencies.ruleFound || verifyDependencies.missing.length > 0) {
  failures.push(
    `Makefile: verify is missing required dependencies: ${verifyDependencies.missing.join(", ") || "verify rule"}`,
  );
}

const softwareDependencies = missingMakeDependencies(makefile, "verify-software", ["test-performance"]);
if (!softwareDependencies.ruleFound || softwareDependencies.missing.length > 0) {
  failures.push("Makefile: verify-software must include the isolated performance tier");
}

const softwareConfig = await readText("vitest.software.config.ts");
const performanceConfig = await readText("vitest.performance.config.ts");
if (!softwareConfig.includes("...PERFORMANCE_CONTRACT_TESTS") || !performanceConfig.includes("include: [...PERFORMANCE_CONTRACT_TESTS]")) {
  failures.push("test tiers: performance contracts must be excluded from generic software and included by the isolated config");
}

const workflow = await readText(".github/workflows/verify.yml");
const missingVerifyTiers = missingRequiredText(workflow, [
  "make verify-software",
  "make verify-governance",
  "make verify-content",
]);
if (!workflow.includes("pnpm install --frozen-lockfile") || missingVerifyTiers.length > 0) {
  failures.push(`CI workflow: missing named verification tiers: ${missingVerifyTiers.join(", ")}`);
}

const browserWorkflow = await readText(".github/workflows/browser.yml");
const missingBrowserTiers = missingRequiredText(browserWorkflow, [
  "make test-browser-smoke",
  "make test-browser-content",
  "make test-browser-matrix",
]);
if (missingBrowserTiers.length > 0) {
  failures.push(`browser CI workflow: missing named tiers: ${missingBrowserTiers.join(", ")}`);
}

const lefthook = await readText("lefthook.yml");
if (!lefthook.includes("run: node tools/staged-process-contracts.mjs")) {
  failures.push("lefthook: process contracts must run from the staged Git-index snapshot");
}

const ciLocal = await readText("tools/ci-local.mjs");
if (!ciLocal.includes('run("make", ["verify"]') || !ciLocal.includes('run("make", ["test-browser-ci"]')) {
  failures.push("local CI parity: expected make verify followed by make test-browser-ci");
}
if (!makefile.includes("$(CI_NODE) tools/ci-local.mjs") || !ciLocal.includes("const environment = ciEnvironment()")) {
  failures.push("local CI parity: pinned Node must launch the wrapper and all of its child commands");
}

const workspace = await readText("pnpm-workspace.yaml");
const requiredWorkspaceSettings = [
  "storeDir: .cache/pnpm-store",
  "cacheDir: .cache/pnpm-cache",
  "stateDir: .cache/pnpm-state",
  "strictPeerDependencies: true",
  "autoInstallPeers: false",
];
for (const setting of requiredWorkspaceSettings) {
  if (!workspace.includes(setting)) {
    failures.push(`pnpm-workspace.yaml: missing ${setting}`);
  }
}

await requirePath("pnpm-lock.yaml");
await requirePath("schemas/drill_run.schema.json");

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("scaffold verification: OK");
}
