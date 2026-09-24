import type { AccountImportReceipt, AccountInventory } from "./api.js";

/**
 * Learner-facing names for the twelve account data classes of `ACCOUNT_DATA_INVENTORY`
 * (apps/server/src/account-data.ts). The class *set* is not a choice: `account-inventory-copy.test.ts`
 * pins it to the server inventory's twelve non-installation classes, and a class the server adds
 * without a name here renders under its raw id rather than disappearing.
 *
 * The *wording* is provisional. The UX dossier routes these twelve nouns to an owner ruling
 * (`planning/ux-implementation-index.md` IMP-b9 / T20) because they are product prose about what
 * Tabiya keeps; until that ruling they are plain descriptions of the stored rows, with no
 * interpretation of what the rows mean (law 8).
 */
export const ACCOUNT_DATA_CLASS_LABELS: Readonly<Record<string, string>> = Object.freeze({
  learner_identity: "Your account name and display name",
  security: "Sign-in sessions",
  owned_runs: "Your games and rehearsals",
  run_access: "Who can open your runs",
  marks: "Board marks you drew",
  progress: "Attempts, concepts and review schedule",
  repertoires: "Repertoires",
  drafts: "Unpublished drafts",
  publications: "Published packs and shapes",
  live_social: "Live sessions, classrooms and share links",
  behavioral_profiles: "Ratings, rated games and play measurements",
  device_local_preferences: "Preferences saved on this device",
});

export function dataClassLabel(dataClass: string): string {
  return ACCOUNT_DATA_CLASS_LABELS[dataClass] ?? dataClass;
}

type InventoryClass = AccountInventory["classes"][number];

/** Export fate, derived from the stores' dispositions rather than written per class. */
export function exportFate(item: InventoryClass): string {
  const exported = item.stores.filter((store) => store.exportDisposition !== "exclude");
  if (exported.length === 0) return "Not in your download";
  if (exported.length < item.stores.length) return "In your download, except operational records";
  if (exported.every((store) => store.exportDisposition === "metadata_only")) return "In your download as a list, without secrets";
  return "In your download";
}

const DELETION_PHRASES: Readonly<Record<AccountInventory["classes"][number]["stores"][number]["deletionDisposition"], string>> = Object.freeze({
  hard_delete: "deleted",
  classify_run: "deleted with the run, or kept read-only if someone else shares it",
  tombstone: "kept read-only where other people share it",
  retain: "published versions stay available with deleted-account attribution",
  clear_browser: "cleared from this browser",
});

/** Deletion fate: every distinct disposition among the class's stores, in inventory order. */
export function deletionFate(item: InventoryClass): string {
  const phrases = [...new Set(item.stores.map((store) => DELETION_PHRASES[store.deletionDisposition]))];
  return `On deletion: ${phrases.join("; ")}`;
}

const RESTORE_TABLE_NOUNS: Readonly<Record<string, readonly [string, string]>> = Object.freeze({
  drill_runs: ["run", "runs"],
  imported_games: ["imported game record", "imported game records"],
  run_derivations: ["flipped-side link", "flipped-side links"],
  run_marks: ["board mark", "board marks"],
  attempts: ["attempt", "attempts"],
  attempt_concepts: ["concept record", "concept records"],
  attempt_concept_legacy: ["legacy concept record", "legacy concept records"],
  schedules: ["scheduled return", "scheduled returns"],
  repertoires: ["repertoire", "repertoires"],
  repertoire_moves: ["repertoire move", "repertoire moves"],
  repertoire_scans: ["repertoire scan", "repertoire scans"],
  repertoire_gap_runs: ["repertoire gap link", "repertoire gap links"],
  pack_drafts: ["pack draft", "pack drafts"],
  playtest_documents: ["playtest document", "playtest documents"],
  shape_drafts: ["shape draft", "shape drafts"],
});

export function restoredLine(item: AccountImportReceipt["restored"][number]): string {
  const nouns = RESTORE_TABLE_NOUNS[item.table] ?? [item.table, item.table];
  return `${item.count} ${item.count === 1 ? nouns[0] : nouns[1]}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
