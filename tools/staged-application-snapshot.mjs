import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Private test metadata: existing immutable history, no shared live index/hooks or Git env. */
export function attachSnapshotHistory({ root, snapshot, head, tree }) {
  if (![head, tree].every((value) => /^[0-9a-f]{40}$/u.test(value))) throw new Error("snapshot history requires immutable commit/tree ids");
  if (resolve(root) === resolve(snapshot) || realpathSync(root) === realpathSync(snapshot)) throw new Error("snapshot must not be the operator checkout");
  if (existsSync(join(snapshot, ".git"))) throw new Error("snapshot already has foreign Git metadata");
  const git = (directory, args) => execFileSync("git", args, { cwd: directory, encoding: "utf8", stdio: "pipe" });
  git(root, ["cat-file", "-e", `${head}^{commit}`]);
  git(root, ["cat-file", "-e", `${tree}^{tree}`]);
  const objects = git(root, ["rev-parse", "--path-format=absolute", "--git-path", "objects"]).trim();
  if (/[\u0000\r\n]/u.test(objects)) throw new Error("invalid source object-store path");
  git(snapshot, ["init", "--quiet"]);
  mkdirSync(join(snapshot, ".git", "objects", "info"), { recursive: true });
  writeFileSync(join(snapshot, ".git", "objects", "info", "alternates"), objects + "\n");
  git(snapshot, ["update-ref", "HEAD", head]);
  git(snapshot, ["read-tree", tree]);
}
