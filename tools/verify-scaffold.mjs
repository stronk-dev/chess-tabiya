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
if (!/^verify: typecheck test schema-check register-check status-parity graduation-plan-check$/m.test(makefile)) {
  failures.push("Makefile: verify must depend on typecheck, test, schema-check, register-check, status-parity, and graduation-plan-check");
}

const workflow = await readText(".github/workflows/verify.yml");
if (!workflow.includes("pnpm install --frozen-lockfile") || !workflow.includes("make verify")) {
  failures.push("CI workflow: expected frozen install followed by make verify");
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
