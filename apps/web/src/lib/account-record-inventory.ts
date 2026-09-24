import type { DeletionEffect, DeletionPreview } from "./api.js";

// ux-import-and-account.md §5.4(ii): the standing "What Tabiya has recorded" section. It is projected
// from the non-destructive account data summary (the same `planDeletion` machinery that governs
// deletion), one row per `DeletionEffectKind`, so a new kind the server starts reporting cannot hide.
// §5.4 guard (IMP-a17): every sentence here is a storage fact. Rows carry a count and fixed copy; no
// row may summarise, interpret, or narrate what the records say about the learner.

export const RECORDED_DATA_KINDS = Object.freeze([
  "account",
  "run",
  "shared_run",
  "anonymous_link",
  "progress",
  "mark",
  "repertoire",
  "draft",
  "publication",
  "live_session",
  "classroom",
  "behavioral_profile",
] as const);

export type RecordedDataKind = (typeof RECORDED_DATA_KINDS)[number];

export interface RecordedDataClass {
  readonly noun: string;
  readonly holds: string;
  readonly inDownload: string;
  readonly onDeletion: string;
  /** False when the account data summary does not count this class; the row says so instead of showing 0. */
  readonly counted: boolean;
}

export const RECORDED_DATA_CLASSES: Readonly<Record<RecordedDataKind, RecordedDataClass>> = Object.freeze({
  account: { noun: "Your account", holds: "Your handle, display name, and when the account was created.", inDownload: "Included. Your password and sign-in sessions are never included.", onDeletion: "Permanently deleted, and every sign-in session ends.", counted: true },
  run: { noun: "Runs only you use", holds: "Each rehearsal or imported game, with every branch and move you played.", inDownload: "Included as replayable move records.", onDeletion: "Permanently deleted.", counted: true },
  shared_run: { noun: "Runs shared with other people", holds: "Runs another person can open, or that someone else continued from.", inDownload: "Included as replayable move records.", onDeletion: "Kept read-only for those people, without your identity.", counted: true },
  anonymous_link: { noun: "Share links", holds: "Links that let someone without an account read a run or session.", inDownload: "Listed. The link itself is not included.", onDeletion: "Stop working.", counted: true },
  progress: { noun: "Attempts and schedules", holds: "Each attempt's outcome, the concepts it was filed under, when a rehearsal is due again, and per-position statistics.", inDownload: "Included.", onDeletion: "Permanently deleted.", counted: true },
  mark: { noun: "Board marks", holds: "Arrows and square marks you drew on runs.", inDownload: "Included.", onDeletion: "Permanently deleted.", counted: true },
  repertoire: { noun: "Repertoires", holds: "Repertoires you imported, with their moves, scans, and linked gap runs.", inDownload: "Included, with the original PGN you imported.", onDeletion: "Permanently deleted.", counted: true },
  draft: { noun: "Unpublished drafts", holds: "Pack and shape drafts you are authoring, and their playtest documents.", inDownload: "Included.", onDeletion: "Permanently deleted.", counted: true },
  publication: { noun: "Published packs and shapes", holds: "Work you published for other people to use.", inDownload: "Included.", onDeletion: "Kept unchanged, attributed to a deleted account.", counted: true },
  live_session: { noun: "Live sessions", holds: "Who joined, who held the board, proposals, votes, and invitations in sessions you took part in.", inDownload: "Included.", onDeletion: "Kept as shared session history, with your identity removed.", counted: false },
  classroom: { noun: "Classrooms", holds: "Classrooms you run or belong to, with assignments and submissions.", inDownload: "Included.", onDeletion: "Permanently deleted, or archived read-only while other members remain.", counted: true },
  behavioral_profile: { noun: "Rating and play record", holds: "Your ratings; one record per rated game, including abandoned and voided games with the recorded reason; rating periods; classroom standings and marks you published; and private play measurements derived from your runs.", inDownload: "Included.", onDeletion: "Permanently deleted.", counted: true },
} satisfies Record<RecordedDataKind, RecordedDataClass>);

export interface RecordedDataRow extends RecordedDataClass {
  readonly kind: string;
  readonly count: number | undefined;
}

function isRecordedKind(kind: string): kind is RecordedDataKind {
  return (RECORDED_DATA_KINDS as readonly string[]).includes(kind);
}

/**
 * Every class, in a fixed order, with its live count. A kind the server reports that this table does
 * not describe still renders, under the server's own label, so a new class cannot vanish from view.
 */
export function recordedDataRows(preview: DeletionPreview): readonly RecordedDataRow[] {
  const counts = new Map<string, number>();
  const unknown = new Map<string, string>();
  const effects: readonly DeletionEffect[] = [...preview.hardDelete, ...preview.tombstone, ...preview.revoke, ...preview.retainedPublished];
  for (const effect of effects) {
    counts.set(effect.kind, (counts.get(effect.kind) ?? 0) + effect.count);
    if (!isRecordedKind(effect.kind) && !unknown.has(effect.kind)) unknown.set(effect.kind, effect.label);
  }
  const known = RECORDED_DATA_KINDS.map((kind): RecordedDataRow => {
    const data = RECORDED_DATA_CLASSES[kind];
    return Object.freeze({ kind, ...data, count: data.counted || counts.has(kind) ? counts.get(kind) ?? 0 : undefined });
  });
  const extra = [...unknown].sort(([left], [right]) => left.localeCompare(right)).map(([kind, label]): RecordedDataRow => Object.freeze({
    kind, noun: "Other records", holds: label, inDownload: "Included.", onDeletion: "Shown in the deletion summary below.", counted: true, count: counts.get(kind) ?? 0,
  }));
  return Object.freeze([...known, ...extra]);
}
