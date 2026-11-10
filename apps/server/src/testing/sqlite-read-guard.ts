// TEST ONLY. Install before application startup. Observes main-realm connection DML activity
// and the main schema cookie; separate worker connections' DML is intentionally excluded.
// This is not an audit of TEMP/attached schemas, header PRAGMAs or every possible SQLite write.
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { vi } from "vitest";

type Counters = { changes: bigint; mainSchema: number };
export type SqliteReadSnapshot = ReadonlyMap<DatabaseSync, Counters>;

export function observeMainSqliteWrites() {
  const originalPrepare = DatabaseSync.prototype.prepare;
  const originalExec = DatabaseSync.prototype.exec;
  const originalClose = DatabaseSync.prototype.close;
  const originalDispose = DatabaseSync.prototype[Symbol.dispose];
  const originalOpen = DatabaseSync.prototype.open;
  const connections = new Map<DatabaseSync, { initial: Counters; closed?: Counters }>();
  let reopened = false;
  function read(database: DatabaseSync): Counters {
    // Saved original methods keep the observer's own reads out of discovery/recursion.
    const changes = originalPrepare.call(database, "SELECT total_changes() AS n");
    changes.setReadBigInts(true);
    return { changes: changes.get()!.n as bigint,
      mainSchema: Number(originalPrepare.call(database, "PRAGMA main.schema_version").get()!.schema_version) };
  }
  function remember(database: DatabaseSync) {
    if (!connections.has(database)) connections.set(database, { initial: read(database) });
  }
  function closing(database: DatabaseSync) {
    if (database.isOpen) { remember(database); connections.get(database)!.closed = read(database); }
  }
  const prepare = vi.spyOn(DatabaseSync.prototype, "prepare").mockImplementation(function(this: DatabaseSync, sql) {
    remember(this); // Some PRAGMAs take effect during prepare, so capture first.
    return originalPrepare.call(this, sql);
  });
  const exec = vi.spyOn(DatabaseSync.prototype, "exec").mockImplementation(function(this: DatabaseSync, sql) {
    remember(this); return originalExec.call(this, sql);
  });
  const close = vi.spyOn(DatabaseSync.prototype, "close").mockImplementation(function(this: DatabaseSync) {
    closing(this); return originalClose.call(this);
  });
  const dispose = vi.spyOn(DatabaseSync.prototype, Symbol.dispose).mockImplementation(function(this: DatabaseSync) {
    closing(this); return originalDispose.call(this);
  });
  const open = vi.spyOn(DatabaseSync.prototype, "open").mockImplementation(function(this: DatabaseSync) {
    const result = originalOpen.call(this);
    // Preserve real SQL behavior, but refuse the proof: counters reset for a new connection epoch.
    if (connections.has(this)) reopened = true;
    return result;
  });
  function snapshot(): SqliteReadSnapshot {
    assert.ok(!reopened, "Observed SQLite object reopened; connection counter reset invalidates this proof");
    assert.ok(connections.size > 0, "Install SQLite observer before application startup; no connections observed");
    return new Map([...connections].map(([database, record]) => {
      const value = database.isOpen ? read(database) : record.closed;
      assert.ok(value !== undefined, "Observed SQLite connection closed without a final sample");
      return [database, value];
    }));
  }
  return {
    snapshot,
    assertUnchanged(before: SqliteReadSnapshot) {
      for (const [database, actual] of snapshot()) {
        assert.deepEqual(actual, before.get(database) ?? connections.get(database)!.initial,
          "Read sequence changed main-process SQLite rows or the observed main schema");
      }
    },
    restore() { open.mockRestore(); dispose.mockRestore(); close.mockRestore(); exec.mockRestore(); prepare.mockRestore(); },
  };
}
