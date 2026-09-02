import {
  parseBackupId,
  type BackupChecks,
  type BackupId,
  type StoragePathRef,
} from "./model.js";

const parsed: BackupId = parseBackupId("20260831T120000.000Z-aabbccddeeff");
const bundle: StoragePathRef = { role: "bundle", identity: parsed };
const checks: BackupChecks = ["digest", "integrity", "foreign_keys", "inventory", "compatibility"];
void bundle;
void checks;

// @ts-expect-error bundle identities must come from parseBackupId
const rawBundle: StoragePathRef = { role: "bundle", identity: "20260831T120000.000Z-aabbccddeeff" };
// @ts-expect-error backup success checks cannot be empty
const emptyChecks: BackupChecks = [];
// @ts-expect-error backup success checks cannot contain an irrelevant readiness check
const irrelevantChecks: BackupChecks = ["digest", "integrity", "foreign_keys", "inventory", "readiness"];
void rawBundle;
void emptyChecks;
void irrelevantChecks;
