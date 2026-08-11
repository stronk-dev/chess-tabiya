export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type WriterIdFactory = () => string;

export function writerStorageKey(runId: string): string {
  return `chess-tabiya:run:${runId}:writer-id`;
}

function browserStorage(): KeyValueStorage {
  if (typeof localStorage === "undefined") {
    throw new Error("Writer sessions require browser localStorage");
  }
  return localStorage;
}

function defaultWriterId(): string {
  if (typeof crypto.randomUUID !== "function") {
    throw new Error("Writer sessions require crypto.randomUUID");
  }
  return `writer-${crypto.randomUUID()}`;
}

export class WriterSession {
  readonly runId: string;
  readonly writerId: string;
  #readOnly = false;

  private constructor(runId: string, writerId: string, readOnly = false) {
    if (writerId.trim() === "") throw new TypeError("Writer id cannot be empty");
    this.runId = runId;
    this.writerId = writerId;
    this.#readOnly = readOnly;
  }

  /** Returns a previously claimed session without writing to storage. */
  static peek(
    runId: string,
    storage: KeyValueStorage = browserStorage(),
  ): WriterSession | undefined {
    const saved = storage.getItem(writerStorageKey(runId));
    return saved === null || saved === ""
      ? undefined
      : new WriterSession(runId, saved);
  }

  /** Resumes an existing claim or explicitly creates and persists a new one. */
  static claimFor(
    runId: string,
    storage: KeyValueStorage = browserStorage(),
    createWriterId: WriterIdFactory = defaultWriterId,
  ): WriterSession {
    const saved = WriterSession.peek(runId, storage);
    if (saved !== undefined) return saved;
    const writerId = createWriterId();
    if (writerId.trim() === "") throw new TypeError("Writer id cannot be empty");
    storage.setItem(writerStorageKey(runId), writerId);
    return new WriterSession(runId, writerId);
  }

  /** Creates a non-persisted follower for a lease held by another writer. */
  static observe(runId: string, activeWriterId: string): WriterSession {
    return new WriterSession(runId, activeWriterId, true);
  }

  get readOnly(): boolean {
    return this.#readOnly;
  }

  markReadOnly(): void {
    this.#readOnly = true;
  }
}
