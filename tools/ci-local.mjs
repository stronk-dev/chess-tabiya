import { accessSync, constants } from "node:fs";
import { spawnSync } from "node:child_process";
import { delimiter, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_NODE_MAJOR = 24;
export const REQUIRED_PNPM_VERSION = "11.18.0";

export function preflightFailures({
  nodeVersion,
  pnpmVersion,
  stockfishCommand,
  dockerComposeAvailable,
}) {
  const failures = [];
  const nodeMajor = Number(nodeVersion.replace(/^v/, "").split(".")[0]);
  if (nodeMajor !== REQUIRED_NODE_MAJOR) {
    failures.push(
      `Node ${REQUIRED_NODE_MAJOR} is required; found ${nodeVersion}. Use .node-version before running CI parity.`,
    );
  }
  if (pnpmVersion !== REQUIRED_PNPM_VERSION) {
    failures.push(
      `pnpm ${REQUIRED_PNPM_VERSION} is required; found ${pnpmVersion || "no runnable pnpm"}.`,
    );
  }
  if (!stockfishCommand) {
    failures.push("SF_CMD must name an executable Stockfish binary, as it does in CI");
  }
  if (!dockerComposeAvailable) {
    failures.push("Docker Compose must be available because schema verification renders every deployment profile");
  }
  return failures;
}

export function ciEnvironment(environment = process.env, execPath = process.execPath) {
  const nodeDirectory = dirname(execPath);
  const inheritedPath = environment.PATH ?? "";
  return {
    ...environment,
    PATH: inheritedPath === "" ? nodeDirectory : `${nodeDirectory}${delimiter}${inheritedPath}`,
  };
}

function capture(command, args, env) {
  const result = spawnSync(command, args, { encoding: "utf8", env });
  return result.status === 0 ? result.stdout.trim() : "";
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function requireExecutable(path) {
  if (!path) return false;
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export function main() {
  const environment = ciEnvironment();
  const nodeMajor = Number(process.version.replace(/^v/, "").split(".")[0]);
  const pnpmVersion =
    nodeMajor === REQUIRED_NODE_MAJOR
      ? capture("pnpm", ["--version"], environment)
      : REQUIRED_PNPM_VERSION;
  const stockfishCommand = requireExecutable(process.env.SF_CMD) ? process.env.SF_CMD : "";
  const dockerComposeAvailable =
    nodeMajor === REQUIRED_NODE_MAJOR
      ? capture("docker", ["compose", "version"], environment) !== ""
      : true;
  const failures = preflightFailures({
    nodeVersion: process.version,
    pnpmVersion,
    stockfishCommand,
    dockerComposeAvailable,
  });
  if (failures.length > 0) {
    console.error(`local CI parity refused:\n- ${failures.join("\n- ")}`);
    process.exit(2);
  }

  console.log("local CI parity start");
  run("pnpm", ["install", "--frozen-lockfile"], environment);
  run("make", ["verify"], { ...environment, ENGINES_REQUIRED: "1" });
  run("make", ["test-browser-ci"], environment);
  console.log("local CI parity PASS");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
