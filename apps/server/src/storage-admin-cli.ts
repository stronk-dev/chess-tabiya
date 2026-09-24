// rfc/storage-backup-recovery.md §§8–9 — the shipped `storage-admin` entry point
// (`node apps/server/dist/storage-admin.js <operation> …`). Stdout is a protocol: exactly one
// canonical JSON receipt and a newline. Diagnostics go to stderr. Exit: 0 succeeded, 2 refused,
// 3 failed, 4 internal error, 130/143 cancelled before the replacement boundary.
import { createApplication, createStorageMigrator, DEFAULT_DATABASE_PATH } from "./application.js";
import {
  applicationRevisionFromEnv,
  backupOperation,
  canonicalJson,
  errorReceipt,
  generateStorageOperationId,
  prepareStartOperation,
  receipt,
  receiptExitCode,
  ReceiptClock,
  recoverStorage,
  rehearsalOperation,
  resolveStoragePaths,
  restoreOperation,
  rollbackOperation,
  StorageAdminError,
  StorageLock,
  verifyOperation,
  abandonedReservations,
  type StorageAdminOperation,
  type StorageAdminReceiptV1,
} from "./storage-admin.js";

const USAGE = `usage: storage-admin <operation> [options]
  backup                                  manual verified backup of the stopped database
  verify <bundle>                         read-only bundle verification
  restore <bundle> [--replace-existing --confirm-database <path>]
  rollback <bundle> --confirm-database <path>   install a prior release's bundle bytes unchanged
  prepare-start                           migration-safe startup preflight (the server runs this itself)
  recover                                 finish or roll back an interrupted replacement
  rehearsal <bundle>                      restore into a disposable database and probe /readyz
options: --database <abs path> (default $DATABASE_PATH)  --backup-root <abs path> (default $TABIYA_BACKUP_ROOT)`;

const OPERATIONS: Readonly<Record<string, StorageAdminOperation>> = {
  backup: "backup", verify: "verify", restore: "restore", rollback: "rollback",
  "prepare-start": "prepare_start", recover: "recover", rehearsal: "rehearsal",
};

interface Parsed {
  readonly operation: StorageAdminOperation;
  readonly positional: readonly string[];
  readonly flags: ReadonlyMap<string, string | true>;
}

function usage(message: string): StorageAdminError {
  return new StorageAdminError("refused", "USAGE_ERROR", message);
}

function parseArgv(argv: readonly string[]): Parsed {
  const [name, ...rest] = argv;
  const operation = name === undefined ? undefined : OPERATIONS[name];
  if (operation === undefined) throw usage(`unknown operation ${JSON.stringify(name ?? "")}`);
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  const valued = new Set(["--database", "--backup-root", "--confirm-database", "--image-digest"]);
  const booleans = new Set(["--replace-existing"]);
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]!;
    if (valued.has(token)) {
      const value = rest[index + 1];
      if (value === undefined || value.startsWith("--")) throw usage(`${token} needs a value`);
      flags.set(token, value);
      index += 1;
    } else if (booleans.has(token)) {
      flags.set(token, true);
    } else if (token.startsWith("--")) {
      throw usage(`unknown option ${token}`);
    } else {
      positional.push(token);
    }
  }
  return { operation, positional, flags };
}

function stringFlag(parsed: Parsed, name: string): string | undefined {
  const value = parsed.flags.get(name);
  return typeof value === "string" ? value : undefined;
}

function oneBundle(parsed: Parsed): string {
  if (parsed.positional.length !== 1) throw usage("exactly one bundle directory is required");
  return parsed.positional[0]!;
}

interface InvocationBase {
  readonly operationId: ReturnType<typeof generateStorageOperationId>;
  readonly applicationRevision: ReturnType<typeof applicationRevisionFromEnv>;
  readonly clock: ReceiptClock;
  operation: StorageAdminOperation;
}

export function invocationBase(env: NodeJS.ProcessEnv = process.env): InvocationBase {
  return { operationId: generateStorageOperationId(), applicationRevision: applicationRevisionFromEnv(env), clock: new ReceiptClock(), operation: "command" };
}

export async function runStorageAdmin(argv: readonly string[], env: NodeJS.ProcessEnv = process.env, base: InvocationBase = invocationBase(env)): Promise<StorageAdminReceiptV1> {
  let operation: StorageAdminOperation = "command";
  try {
    const parsed = parseArgv(argv);
    operation = parsed.operation;
    base.operation = operation;
    if (operation === "verify") return verifyOperation(base, oneBundle(parsed));
    const migrate = await createStorageMigrator({ development: env.NODE_ENV === "development" });
    if (operation === "rehearsal") {
      return await rehearsalOperation({ ...base, migrate }, {
        bundlePath: oneBundle(parsed),
        imageDigest: stringFlag(parsed, "--image-digest") ?? env.TABIYA_IMAGE_DIGEST ?? null,
        start: async (databasePath) => {
          const application = await createApplication({ engineMode: "mock", databasePath, cookieSecure: false, requirePreparedStorage: true });
          await new Promise<void>((resolve, reject) => {
            application.server.once("error", reject);
            application.server.listen(0, "127.0.0.1", () => resolve());
          });
          const address = application.server.address();
          if (address === null || typeof address === "string") throw new Error("rehearsal server has no TCP address");
          return { origin: `http://127.0.0.1:${address.port}`, close: () => application.close() };
        },
      });
    }
    const database = stringFlag(parsed, "--database") ?? env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH();
    const backupRoot = stringFlag(parsed, "--backup-root") ?? env.TABIYA_BACKUP_ROOT;
    const paths = resolveStoragePaths({ database, backupRoot });
    const lock = StorageLock.acquire(paths);
    try {
      const context = { ...base, lock, paths, migrate };
      const recovery = recoverStorage(context);
      if (recovery !== "none") console.error(`storage-admin: interrupted replacement recovered (${recovery})`);
      if (paths.backupRoot !== undefined) {
        for (const reservation of abandonedReservations(paths.backupRoot)) console.error(`storage-admin: abandoned backup reservation ${reservation} (invalid; inspect or remove manually)`);
      }
      switch (operation) {
        case "backup":
          if (parsed.positional.length !== 0) throw usage("backup takes no positional arguments");
          return await backupOperation(context);
        case "restore":
          return await restoreOperation(context, {
            bundlePath: oneBundle(parsed),
            replaceExisting: parsed.flags.get("--replace-existing") === true,
            ...(stringFlag(parsed, "--confirm-database") === undefined ? {} : { confirmDatabase: stringFlag(parsed, "--confirm-database")! }),
          });
        case "rollback": {
          const confirmDatabase = stringFlag(parsed, "--confirm-database");
          if (confirmDatabase === undefined) throw new StorageAdminError("refused", "RESTORE_CONFIRMATION_REQUIRED", "rollback needs --confirm-database <exact live path>");
          return await rollbackOperation(context, { bundlePath: oneBundle(parsed), confirmDatabase });
        }
        case "prepare_start":
          return await prepareStartOperation(context);
        case "recover":
          return receipt(base, [{ role: "database", identity: "live" }], { operation: "recover", result: "succeeded", recovery });
        default:
          throw usage(`unsupported operation ${operation}`);
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    if (!(error instanceof StorageAdminError)) console.error(`storage-admin: ${(error as Error).stack ?? String(error)}`);
    else console.error(`storage-admin: ${error.code}: ${error.message}`);
    return errorReceipt(base, operation, error);
  }
}

// Entry: only when executed as the bundled `dist/storage-admin.js`.
if (process.argv[1] !== undefined && /storage-admin\.js$/u.test(process.argv[1])) {
  const argv = process.argv.slice(2);
  if (argv[0] === "--help" || argv[0] === "-h") {
    console.error(USAGE);
    process.exit(0);
  }
  let base: InvocationBase;
  try {
    base = invocationBase();
  } catch (error) {
    console.error(`storage-admin: ${(error as Error).message}`);
    process.exit(4);
  }
  // A caught SIGINT/SIGTERM before the replacement boundary emits `cancelled`. The replacement
  // primitive is synchronous, so a signal can never interleave with its rename sequence: it is
  // delivered only after the primitive has reached `verified` or `rolled_back`.
  const cancel = (signal: "SIGINT" | "SIGTERM") => () => {
    process.stdout.write(`${canonicalJson(receipt(base, [], { operation: base.operation, result: "cancelled", code: "OPERATION_CANCELLED", signal }))}\n`);
    process.exit(signal === "SIGINT" ? 130 : 143);
  };
  process.once("SIGINT", cancel("SIGINT"));
  process.once("SIGTERM", cancel("SIGTERM"));
  const result = await runStorageAdmin(argv, process.env, base);
  process.stdout.write(`${canonicalJson(result)}\n`);
  process.exit(receiptExitCode(result));
}
