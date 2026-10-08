#!/usr/bin/env node
// Thin argument adapter for the maintenance overlay. Storage and locking stay in the image.
import { spawnSync } from "node:child_process";
import { delimiter, dirname, join } from "node:path";

const files = (process.env.COMPOSE_FILE ?? "compose.yaml").split(process.env.COMPOSE_PATH_SEPARATOR || delimiter);
if (files.some(file => file.length === 0)) {
  console.error("storage maintenance: COMPOSE_FILE contains an empty file name");
  process.exit(2);
}
// Rendered source profiles and downloaded releases place all their Compose files together.
const maintenance = join(dirname(files[0]), "compose.maintenance.yaml");
const result = spawnSync("docker", ["compose", ...[...files, maintenance].flatMap(file => ["-f", file]), ...process.argv.slice(2)], { stdio: "inherit" });
if (result.error) console.error("storage maintenance: could not execute Docker Compose");
if (result.signal) process.kill(process.pid, result.signal);
else process.exit(result.status ?? 1);
