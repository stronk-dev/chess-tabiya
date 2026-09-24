// rfc/verifiable-runtime-distribution.md §7 loader trace. Preloaded into the production image with
// `node --import /trace/fs-trace.mjs apps/server/dist/main.js`; appends every filesystem path the
// process (and its worker threads, which inherit execArgv) opens, stats or lists to
// $TABIYA_FS_TRACE. It changes no behaviour and is never part of an image.
import fs from "node:fs";
import fsp from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import { fileURLToPath } from "node:url";

const log = process.env.TABIYA_FS_TRACE ?? "/tmp/fs-trace.log";
const append = fs.appendFileSync.bind(fs);
let busy = false;

function record(operation, target) {
  if (busy) return;
  let path = target;
  if (path instanceof URL) path = fileURLToPath(path);
  if (Buffer.isBuffer(path)) path = path.toString("utf8");
  if (typeof path !== "string") return;
  busy = true;
  try {
    append(log, `${operation}\t${path}\n`);
  } catch {
    // Tracing never changes the traced program's behaviour.
  } finally {
    busy = false;
  }
}

const SYNC = ["readFileSync", "readdirSync", "openSync", "statSync", "lstatSync", "existsSync", "accessSync", "realpathSync", "opendirSync"];
const CALLBACK = ["readFile", "readdir", "open", "stat", "lstat", "access", "realpath", "createReadStream", "opendir"];
const PROMISES = ["readFile", "readdir", "open", "stat", "lstat", "access", "realpath", "opendir"];

for (const name of [...SYNC, ...CALLBACK]) {
  const original = fs[name];
  if (typeof original !== "function") continue;
  fs[name] = function traced(target, ...rest) {
    record(name, target);
    return original.call(this, target, ...rest);
  };
}
for (const name of PROMISES) {
  const original = fsp[name];
  if (typeof original !== "function") continue;
  fsp[name] = function traced(target, ...rest) {
    record(`promises.${name}`, target);
    return original.call(this, target, ...rest);
  };
}
syncBuiltinESMExports();
