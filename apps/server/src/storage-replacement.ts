// rfc/storage-backup-recovery.md §5a — the one quiesced SQLite-triplet replacement primitive.
//
// Upgrade, restore and rollback install bytes only through `replaceSqliteTriplet`. The live target
// set is exactly `<live>`, `<live>-wal` and `<live>-shm`. Every durable state is one canonical
// journal generation inside the single fixed sibling `.tabiya-replacement/`, and every mutation
// between two journal generations is exactly ONE rename. The expected filesystem image is a pure
// function of the journal, so restart reconciliation compares the observed digests against the
// committed generation and, at most, its single successor — never path existence alone
// ([[D2724]], [[D2974]]). Keep-new is decided only by the durable `verified` generation; every
// earlier forward phase rolls back to the exact old triplet ([[D2462]], [[D2613]]).
import { createHash } from "node:crypto";
import {
  closeSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";

export type Sha256 = string & { readonly __sha256: unique symbol };

export function parseSha256(value: unknown): Sha256 {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/u.test(value)) throw new TypeError("SHA-256 must be 64 lowercase hex characters");
  return value as Sha256;
}

/** A replacement that cannot be completed or rolled back automatically; SQLite is never opened. */
export class ReplacementRecoveryRequired extends Error {
  readonly code = "REPLACEMENT_RECOVERY_REQUIRED";
}

/** Deterministic crash injection: a fault hook that throws this aborts like SIGKILL (no cleanup). */
export class SimulatedCrash extends Error {
  constructor(readonly point: string) { super(`simulated crash at ${point}`); }
}

export const REPLACEMENT_DIRECTORY = ".tabiya-replacement";
const MEMBERS = ["main", "wal", "shm"] as const;
type Member = (typeof MEMBERS)[number];
const SUFFIX: Readonly<Record<Member, string>> = { main: "", wal: "-wal", shm: "-shm" };
const STAGED = "staged.sqlite";
const FAILED = "failed-new.sqlite";
const JOURNAL = "journal.json";
const JOURNAL_TMP = "journal.tmp";
const ALLOWED_ENTRIES = new Set([JOURNAL, JOURNAL_TMP, STAGED, FAILED, "old-main", "old-wal", "old-shm"]);

type Phase =
  | { readonly kind: "prepared" }
  | { readonly kind: "forward_quarantine" }
  | { readonly kind: "forward_install"; readonly newInstalled: boolean }
  | { readonly kind: "forward_verify" }
  | { readonly kind: "verified" }
  | { readonly kind: "rollback_quarantine_new"; readonly newInstalled: boolean; readonly newMoved: boolean }
  | { readonly kind: "rollback_restore_old"; readonly newInstalled: boolean; readonly restored: readonly Member[] }
  | { readonly kind: "rollback_verify_old"; readonly newInstalled: boolean }
  | { readonly kind: "rolled_back"; readonly newInstalled: boolean };

interface ReplacementJournalV1 {
  readonly format: "tabiya-replacement-journal";
  readonly version: 1;
  readonly operationId: string;
  readonly target: string;
  readonly generation: number;
  readonly old: Readonly<Record<Member, Sha256 | null>>;
  readonly staged: Sha256;
  /** Old members moved into quarantine so far, in canonical order. */
  readonly quarantined: readonly Member[];
  readonly phase: Phase;
}

/** The owned filesystem capability: every mutation and fsync passes one fault point before and after. */
export interface ReplacementFs {
  readonly fault: (point: string) => void;
  /** The durability barrier; crash fixtures substitute a no-op and assert ordering via fault points. */
  readonly fsync: (fd: number) => void;
}

export function replacementFs(fault: (point: string) => void = () => {}, fsync: (fd: number) => void = fsyncSync): ReplacementFs {
  return Object.freeze({ fault, fsync });
}

function mutate<T>(fs: ReplacementFs, point: string, operation: () => T): T {
  fs.fault(`before ${point}`);
  const result = operation();
  fs.fault(`after ${point}`);
  return result;
}

function fsyncPath(fs: ReplacementFs, path: string, label: string): void {
  mutate(fs, `fsync ${label}`, () => {
    const fd = openSync(path, "r");
    try { fs.fsync(fd); } finally { closeSync(fd); }
  });
}

function exists(path: string): boolean {
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new ReplacementRecoveryRequired(`${basename(path)} is not a regular file`);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export function sha256File(path: string): Sha256 {
  return createHash("sha256").update(readFileSync(path)).digest("hex") as Sha256;
}

function digestOrNull(path: string): Sha256 | null {
  return exists(path) ? sha256File(path) : null;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function closedKeys(value: unknown, keys: readonly string[], what: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new ReplacementRecoveryRequired(`${what} is not an object`);
  const actual = Object.keys(value).sort();
  if (canonical(actual) !== canonical([...keys].sort())) throw new ReplacementRecoveryRequired(`${what} has keys ${actual.join(",")}`);
  return value as Record<string, unknown>;
}

function memberList(value: unknown, what: string): readonly Member[] {
  if (!Array.isArray(value)) throw new ReplacementRecoveryRequired(`${what} is not a list`);
  const list = value.map((item) => {
    if (!MEMBERS.includes(item as Member)) throw new ReplacementRecoveryRequired(`${what} names an unknown member`);
    return item as Member;
  });
  const canonicalOrder = MEMBERS.filter((member) => list.includes(member));
  if (canonical(canonicalOrder) !== canonical(list)) throw new ReplacementRecoveryRequired(`${what} is not in canonical order`);
  return list;
}

function bool(value: unknown, what: string): boolean {
  if (typeof value !== "boolean") throw new ReplacementRecoveryRequired(`${what} is not boolean`);
  return value;
}

function parsePhase(value: unknown): Phase {
  const kind = (value as { kind?: unknown } | null)?.kind;
  switch (kind) {
    case "prepared": case "forward_quarantine": case "forward_verify": case "verified":
      closedKeys(value, ["kind"], "phase");
      return { kind };
    case "forward_install": {
      const phase = closedKeys(value, ["kind", "newInstalled"], "phase");
      return { kind, newInstalled: bool(phase.newInstalled, "newInstalled") };
    }
    case "rollback_quarantine_new": {
      const phase = closedKeys(value, ["kind", "newInstalled", "newMoved"], "phase");
      return { kind, newInstalled: bool(phase.newInstalled, "newInstalled"), newMoved: bool(phase.newMoved, "newMoved") };
    }
    case "rollback_restore_old": {
      const phase = closedKeys(value, ["kind", "newInstalled", "restored"], "phase");
      return { kind, newInstalled: bool(phase.newInstalled, "newInstalled"), restored: memberList(phase.restored, "restored") };
    }
    case "rollback_verify_old": case "rolled_back": {
      const phase = closedKeys(value, ["kind", "newInstalled"], "phase");
      return { kind, newInstalled: bool(phase.newInstalled, "newInstalled") };
    }
    default:
      throw new ReplacementRecoveryRequired("journal phase is unknown");
  }
}

function parseJournal(bytes: Buffer, expectedTarget: string): ReplacementJournalV1 {
  let value: unknown;
  const text = bytes.toString("utf8");
  try { value = JSON.parse(text); } catch { throw new ReplacementRecoveryRequired("journal is not JSON"); }
  const journal = closedKeys(value, ["format", "version", "operationId", "target", "generation", "old", "staged", "quarantined", "phase"], "journal");
  if (journal.format !== "tabiya-replacement-journal" || journal.version !== 1) throw new ReplacementRecoveryRequired("journal format is unknown");
  if (typeof journal.operationId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(journal.operationId)) {
    throw new ReplacementRecoveryRequired("journal operation id is invalid");
  }
  if (journal.target !== expectedTarget) throw new ReplacementRecoveryRequired("journal names another database");
  if (!Number.isSafeInteger(journal.generation) || (journal.generation as number) < 1) throw new ReplacementRecoveryRequired("journal generation is invalid");
  const old = closedKeys(journal.old, [...MEMBERS], "journal old members");
  const parsed: ReplacementJournalV1 = {
    format: "tabiya-replacement-journal",
    version: 1,
    operationId: journal.operationId,
    target: journal.target,
    generation: journal.generation as number,
    old: {
      main: old.main === null ? null : parseSha256(old.main),
      wal: old.wal === null ? null : parseSha256(old.wal),
      shm: old.shm === null ? null : parseSha256(old.shm),
    },
    staged: parseSha256(journal.staged),
    quarantined: memberList(journal.quarantined, "quarantined"),
    phase: parsePhase(journal.phase),
  };
  if (parsed.quarantined.some((member) => parsed.old[member] === null)) throw new ReplacementRecoveryRequired("journal quarantined an absent member");
  if (canonical(parsed) !== text) throw new ReplacementRecoveryRequired("journal bytes are not canonical");
  return parsed;
}

interface Layout {
  readonly live: string;
  readonly liveDirectory: string;
  readonly transaction: string;
}

function layout(livePath: string): Layout {
  const liveDirectory = dirname(livePath);
  return { live: livePath, liveDirectory, transaction: join(liveDirectory, REPLACEMENT_DIRECTORY) };
}

type Image = Readonly<Record<string, Sha256 | null>>;

function presentOld(journal: ReplacementJournalV1): readonly Member[] {
  return MEMBERS.filter((member) => journal.old[member] !== null);
}

/** The exact live/staged/quarantine/failed-artifact digests a durable generation implies. */
function expectedImage(journal: ReplacementJournalV1): Image {
  const image: Record<string, Sha256 | null> = {};
  const phase = journal.phase;
  const restored = phase.kind === "rollback_restore_old" ? phase.restored
    : phase.kind === "rollback_verify_old" || phase.kind === "rolled_back" ? journal.quarantined : [];
  for (const member of MEMBERS) {
    const quarantined = journal.quarantined.includes(member) && !restored.includes(member);
    image[`live-${member}`] = quarantined ? null : journal.old[member];
    image[`old-${member}`] = quarantined ? journal.old[member] : null;
  }
  image[STAGED] = journal.staged;
  image[FAILED] = null;
  const installed = phase.kind === "forward_install" ? phase.newInstalled
    : phase.kind === "forward_verify" || phase.kind === "verified";
  if (installed) {
    image["live-main"] = journal.staged;
    image[STAGED] = null;
  }
  if (phase.kind === "rollback_quarantine_new" || phase.kind === "rollback_restore_old" || phase.kind === "rollback_verify_old" || phase.kind === "rolled_back") {
    const moved = phase.kind !== "rollback_quarantine_new" || phase.newMoved;
    if (phase.newInstalled) {
      image[STAGED] = null;
      if (moved) image[FAILED] = journal.staged;
      else image["live-main"] = journal.staged;
    }
  }
  return image;
}

function observeImage(paths: Layout): Image {
  const image: Record<string, Sha256 | null> = {};
  for (const member of MEMBERS) {
    image[`live-${member}`] = digestOrNull(`${paths.live}${SUFFIX[member]}`);
    image[`old-${member}`] = digestOrNull(join(paths.transaction, `old-${member}`));
  }
  image[STAGED] = digestOrNull(join(paths.transaction, STAGED));
  image[FAILED] = digestOrNull(join(paths.transaction, FAILED));
  return image;
}

function sameImage(left: Image, right: Image): boolean {
  return canonical(left) === canonical(right);
}

interface Step {
  /** The one rename this step performs before committing `next`, if any. */
  readonly rename?: { readonly from: string; readonly to: string; readonly label: string };
  readonly next: ReplacementJournalV1;
}

function successor(journal: ReplacementJournalV1, phase: Phase, quarantined = journal.quarantined): ReplacementJournalV1 {
  return { ...journal, generation: journal.generation + 1, phase, quarantined };
}

/** The single mutation step after a durable generation; undefined for verify/terminal phases. */
function plannedStep(journal: ReplacementJournalV1, paths: Layout): Step | undefined {
  const phase = journal.phase;
  const tx = (name: string) => join(paths.transaction, name);
  const live = (member: Member) => `${paths.live}${SUFFIX[member]}`;
  switch (phase.kind) {
    case "prepared":
      return { next: successor(journal, { kind: "forward_quarantine" }) };
    case "forward_quarantine": {
      const member = presentOld(journal).find((candidate) => !journal.quarantined.includes(candidate));
      if (member === undefined) return { next: successor(journal, { kind: "forward_install", newInstalled: false }) };
      return {
        rename: { from: live(member), to: tx(`old-${member}`), label: `live-${member}->old-${member}` },
        next: successor(journal, { kind: "forward_quarantine" }, MEMBERS.filter((candidate) => candidate === member || journal.quarantined.includes(candidate))),
      };
    }
    case "forward_install":
      if (phase.newInstalled) return { next: successor(journal, { kind: "forward_verify" }) };
      return { rename: { from: tx(STAGED), to: live("main"), label: "staged->live-main" }, next: successor(journal, { kind: "forward_install", newInstalled: true }) };
    case "rollback_quarantine_new":
      if (phase.newMoved || !phase.newInstalled) return { next: successor(journal, { kind: "rollback_restore_old", newInstalled: phase.newInstalled, restored: [] }) };
      return { rename: { from: live("main"), to: tx(FAILED), label: "live-main->failed-new" }, next: successor(journal, { ...phase, newMoved: true }) };
    case "rollback_restore_old": {
      const member = journal.quarantined.find((candidate) => !phase.restored.includes(candidate));
      if (member === undefined) return { next: successor(journal, { kind: "rollback_verify_old", newInstalled: phase.newInstalled }) };
      return {
        rename: { from: tx(`old-${member}`), to: live(member), label: `old-${member}->live-${member}` },
        next: successor(journal, { ...phase, restored: MEMBERS.filter((candidate) => candidate === member || phase.restored.includes(candidate)) }),
      };
    }
    default:
      return undefined;
  }
}

function writeJournal(fs: ReplacementFs, paths: Layout, journal: ReplacementJournalV1, first: boolean): void {
  const tmp = join(paths.transaction, JOURNAL_TMP);
  mutate(fs, `write journal.tmp#${journal.generation}`, () => {
    const fd = openSync(tmp, "wx", 0o600);
    try { writeSync(fd, canonical(journal)); } finally { closeSync(fd); }
  });
  fsyncPath(fs, tmp, `journal.tmp#${journal.generation}`);
  mutate(fs, `rename journal.tmp->journal.json#${journal.generation}`, () => renameSync(tmp, join(paths.transaction, JOURNAL)));
  fsyncPath(fs, paths.transaction, `transaction-dir#${journal.generation}`);
  if (first) fsyncPath(fs, paths.liveDirectory, "live-dir#journal");
}

function performRename(fs: ReplacementFs, paths: Layout, rename: NonNullable<Step["rename"]>): void {
  mutate(fs, `rename ${rename.label}`, () => renameSync(rename.from, rename.to));
  fsyncPath(fs, paths.transaction, `transaction-dir ${rename.label}`);
  fsyncPath(fs, paths.liveDirectory, `live-dir ${rename.label}`);
}

function toRollback(journal: ReplacementJournalV1): ReplacementJournalV1 {
  const phase = journal.phase;
  const newInstalled = phase.kind === "forward_install" ? phase.newInstalled : phase.kind === "forward_verify";
  return successor(journal, { kind: "rollback_quarantine_new", newInstalled, newMoved: false });
}

function removeIfPresent(fs: ReplacementFs, path: string, label: string): void {
  if (!exists(path)) return;
  mutate(fs, `unlink ${label}`, () => unlinkSync(path));
}

/** Terminal cleanup: idempotent; the live triplet already holds the decided bytes. */
function cleanup(fs: ReplacementFs, paths: Layout): void {
  for (const name of [STAGED, FAILED, "old-main", "old-wal", "old-shm", JOURNAL_TMP]) removeIfPresent(fs, join(paths.transaction, name), name);
  removeIfPresent(fs, join(paths.transaction, JOURNAL), JOURNAL);
  mutate(fs, "rmdir transaction", () => rmdirSync(paths.transaction));
  fsyncPath(fs, paths.liveDirectory, "live-dir#cleanup");
}

export type ReplacementOutcome = "kept_new" | "rolled_back";

/**
 * Drives a durable generation to its terminal decision. `verify` runs only in `forward_verify`
 * (never during restart recovery, which rolls every unverified forward phase back).
 */
function drive(fs: ReplacementFs, paths: Layout, start: ReplacementJournalV1, verify: ((livePath: string) => void) | undefined): ReplacementOutcome {
  let journal = start;
  for (;;) {
    const phase = journal.phase;
    if (phase.kind === "verified") { cleanup(fs, paths); return "kept_new"; }
    if (phase.kind === "rolled_back") { cleanup(fs, paths); return "rolled_back"; }
    if (phase.kind === "rollback_verify_old") {
      const observed = observeImage(paths);
      const expected = expectedImage(journal);
      for (const member of MEMBERS) {
        if (observed[`live-${member}`] !== expected[`live-${member}`]) throw new ReplacementRecoveryRequired(`restored ${member} does not match its recorded digest`);
      }
      journal = successor(journal, { kind: "rolled_back", newInstalled: phase.newInstalled });
      writeJournal(fs, paths, journal, false);
      continue;
    }
    if (phase.kind === "forward_verify") {
      let passed = false;
      if (verify !== undefined) {
        try {
          if (sha256File(paths.live) !== journal.staged) throw new Error("installed main digest differs from the staged database");
          verify(paths.live);
          for (const member of ["wal", "shm"] as const) {
            removeIfPresent(fs, `${paths.live}${SUFFIX[member]}`, `verification live-${member}`);
          }
          fsyncPath(fs, paths.live, "installed live-main");
          fsyncPath(fs, paths.liveDirectory, "live-dir#verified");
          passed = true;
        } catch (error) {
          if (error instanceof SimulatedCrash) throw error;
        }
      }
      journal = passed ? successor(journal, { kind: "verified" }) : toRollback(journal);
      writeJournal(fs, paths, journal, false);
      continue;
    }
    const step = plannedStep(journal, paths);
    if (step === undefined) throw new ReplacementRecoveryRequired(`no step from ${phase.kind}`);
    if (step.rename !== undefined) performRename(fs, paths, step.rename);
    journal = step.next;
    writeJournal(fs, paths, journal, false);
  }
}

export interface ReplacementRequest {
  readonly livePath: string;
  /** A verified standalone main database with no sidecars, on the live filesystem. */
  readonly stagedPath: string;
  readonly operationId: string;
  /** Exact post-install storage checks; throwing rolls back to the old triplet. */
  readonly verify: (livePath: string) => void;
  readonly fs?: ReplacementFs;
}

export function replaceSqliteTriplet(request: ReplacementRequest): ReplacementOutcome {
  const fs = request.fs ?? replacementFs();
  const paths = layout(request.livePath);
  if (dirname(request.stagedPath) === paths.transaction) throw new TypeError("staged database must be outside the transaction directory");
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    if (exists(`${request.stagedPath}${suffix}`)) throw new TypeError("staged database must be a standalone main file with no sidecars");
  }
  const staged = sha256File(request.stagedPath);
  const old = {
    main: digestOrNull(paths.live),
    wal: digestOrNull(`${paths.live}-wal`),
    shm: digestOrNull(`${paths.live}-shm`),
  };
  mutate(fs, "mkdir transaction", () => mkdirSync(paths.transaction, { mode: 0o700 }));
  fsyncPath(fs, paths.liveDirectory, "live-dir#mkdir");
  mutate(fs, "rename staged->transaction", () => renameSync(request.stagedPath, join(paths.transaction, STAGED)));
  fsyncPath(fs, paths.transaction, "transaction-dir#staged");
  fsyncPath(fs, dirname(request.stagedPath), "staging-dir#staged");
  const journal: ReplacementJournalV1 = {
    format: "tabiya-replacement-journal",
    version: 1,
    operationId: request.operationId,
    target: basename(paths.live),
    generation: 1,
    old,
    staged,
    quarantined: [],
    phase: { kind: "prepared" },
  };
  writeJournal(fs, paths, journal, true);
  return drive(fs, paths, journal, request.verify);
}

export type RecoveryOutcome = "none" | "discarded_unjournalled" | ReplacementOutcome;

/**
 * Restart reconciliation before any SQLite open (§5a). Accepts zero or one fixed transaction
 * directory; refuses unknown entries, non-canonical journals, crossed or torn-but-parseable temp
 * intents and any digest image other than the committed generation or its one successor.
 */
export function recoverReplacement(livePath: string, fs: ReplacementFs = replacementFs()): RecoveryOutcome {
  const paths = layout(livePath);
  for (const entry of readdirSync(paths.liveDirectory)) {
    if (entry !== REPLACEMENT_DIRECTORY && entry.startsWith(".tabiya-replacement")) {
      throw new ReplacementRecoveryRequired(`alternate replacement directory ${entry}`);
    }
  }
  let entries: string[];
  try {
    const stat = lstatSync(paths.transaction);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new ReplacementRecoveryRequired("replacement path is not a directory");
    entries = readdirSync(paths.transaction);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "none";
    throw error;
  }
  const unknown = entries.filter((entry) => !ALLOWED_ENTRIES.has(entry));
  if (unknown.length > 0) throw new ReplacementRecoveryRequired(`unknown replacement entries: ${unknown.join(", ")}`);
  if (!entries.includes(JOURNAL)) {
    // No durable journal means no live member was ever mutated: only the primitive's own staged
    // file and a first, uncommitted journal temp can exist.
    if (entries.some((entry) => entry !== STAGED && entry !== JOURNAL_TMP)) {
      throw new ReplacementRecoveryRequired("replacement artifacts exist without a durable journal");
    }
    for (const entry of entries) removeIfPresent(fs, join(paths.transaction, entry), entry);
    mutate(fs, "rmdir transaction", () => rmdirSync(paths.transaction));
    fsyncPath(fs, paths.liveDirectory, "live-dir#discard");
    return "discarded_unjournalled";
  }
  let journal = parseJournal(readFileSync(join(paths.transaction, JOURNAL)), basename(paths.live));
  if (entries.includes(JOURNAL_TMP)) {
    const tmpBytes = readFileSync(join(paths.transaction, JOURNAL_TMP));
    let parseable = true;
    try { JSON.parse(tmpBytes.toString("utf8")); } catch { parseable = false; }
    if (parseable) {
      // A complete temp intent must be this operation's very next generation; anything else is a
      // crossed or foreign intent and refuses ([[D2976]]).
      const intent = parseJournal(tmpBytes, basename(paths.live));
      if (intent.operationId !== journal.operationId || intent.generation !== journal.generation + 1) {
        throw new ReplacementRecoveryRequired("leftover journal temp belongs to another operation or generation");
      }
    }
    // The rename never happened, so the committed generation remains the authority.
    removeIfPresent(fs, join(paths.transaction, JOURNAL_TMP), JOURNAL_TMP);
  }
  const observed = observeImage(paths);
  const terminal = journal.phase.kind === "verified" || journal.phase.kind === "rolled_back";
  if (terminal) {
    // Cleanup may have removed any subset of the transaction artifacts; live bytes are decided.
    const expected = expectedImage(journal);
    for (const [name, digest] of Object.entries(observed)) {
      const live = name.startsWith("live-");
      if (live ? digest !== expected[name] : digest !== null && digest !== expected[name]) {
        throw new ReplacementRecoveryRequired(`${name} does not match the ${journal.phase.kind} image`);
      }
    }
  } else if (!sameImage(observed, expectedImage(journal))) {
    const step = plannedStep(journal, paths);
    if (step?.rename === undefined || !sameImage(observed, expectedImage(step.next))) {
      throw new ReplacementRecoveryRequired(`the filesystem matches neither generation ${journal.generation} nor its successor`);
    }
    // The rename completed before its journal generation: record it, never repeat it.
    fsyncPath(fs, paths.transaction, "transaction-dir#reconcile");
    fsyncPath(fs, paths.liveDirectory, "live-dir#reconcile");
    journal = step.next;
    writeJournal(fs, paths, journal, false);
  }
  const phase = journal.phase.kind;
  if (phase === "prepared" || phase === "forward_quarantine" || phase === "forward_install" || phase === "forward_verify") {
    journal = toRollback(journal);
    writeJournal(fs, paths, journal, false);
  }
  return drive(fs, paths, journal, undefined);
}
