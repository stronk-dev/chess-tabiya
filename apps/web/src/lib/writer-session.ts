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

  constructor(
    runId: string,
    storage: KeyValueStorage = browserStorage(),
    createWriterId: WriterIdFactory = defaultWriterId,
  ) {
    this.runId = runId;
    const key = writerStorageKey(runId);
    const saved = storage.getItem(key);
    if (saved !== null && saved !== "") {
      this.writerId = saved;
    } else {
      this.writerId = createWriterId();
      if (this.writerId.trim() === "") throw new TypeError("Writer id cannot be empty");
      storage.setItem(key, this.writerId);
    }
  }

  get readOnly(): boolean {
    return this.#readOnly;
  }

  markReadOnly(): void {
    this.#readOnly = true;
  }
}
