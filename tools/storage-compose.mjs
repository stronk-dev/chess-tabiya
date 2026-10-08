#!/usr/bin/env node
// Thin argument adapter for the maintenance overlay. Storage and locking stay in the image.
import { spawnSync } from "node:child_process";
import { lstatSync, realpathSync } from "node:fs";
import { basename, delimiter, dirname, isAbsolute, join, posix, resolve } from "node:path";

if (process.argv.length === 3 && process.argv[2] === "--bundle-path") {
  try {
    const configured = process.env.TABIYA_BACKUP_DIRECTORY;
    const requested = process.env.BACKUP;
    if (!configured || !isAbsolute(configured) || !requested) throw new Error("missing path");
    const root = resolve(configured);
    const bundle = resolve(requested);
    // The mounted root and bundle must be real directories. Canonical parents also catch an
    // escaping intermediate symlink without rejecting ordinary /tmp or /var path aliases.
    if (!lstatSync(root).isDirectory() || !lstatSync(bundle).isDirectory()) throw new Error("not a real directory");
    const actual = realpathSync(bundle);
    if (dirname(actual) !== realpathSync(root)) throw new Error("outside the mounted root");
    console.log(posix.join("/backup", basename(actual)));
  } catch {
    console.error("storage maintenance: BACKUP must name an existing, non-symlink bundle directly inside TABIYA_BACKUP_DIRECTORY");
    process.exit(2);
  }
  process.exit(0);
}

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
