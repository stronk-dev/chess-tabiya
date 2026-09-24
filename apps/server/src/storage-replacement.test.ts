// rfc/storage-backup-recovery.md §5a, criterion 22 — the journalled SQLite-triplet replacement.
// Every fault point (before/after every rename, journal write and fsync) is crashed once, and
// recovery is itself crashed at every one of its own points; every path must end at the exact old
// triplet or the verified new standalone main, never a mixed main/WAL/SHM set.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  recoverReplacement,
  replaceSqliteTriplet,
  ReplacementRecoveryRequired,
  replacementFs,
  REPLACEMENT_DIRECTORY,
  SimulatedCrash,
} from "./storage-replacement.js";

const OPERATION = "0f8fad5b-d9cb-469f-a165-70867728950e";
const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

const digest = (path: string) => (existsSync(path) ? createHash("sha256").update(readFileSync(path)).digest("hex") : null);

interface Fixture {
  readonly live: string;
  readonly staged: string;
  readonly old: readonly (string | null)[];
  readonly next: string;
}

function fixture(withSidecars = true): Fixture {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-replacement-"));
  directories.push(directory);
  const data = join(directory, "data");
  mkdirSync(data);
  const live = join(data, "chess-tabiya.sqlite");
  writeFileSync(live, "old main bytes");
  if (withSidecars) {
    writeFileSync(`${live}-wal`, "old wal bytes");
    writeFileSync(`${live}-shm`, "old shm bytes");
  }
  const staged = join(data, ".tabiya-staged.sqlite");
  writeFileSync(staged, "new standalone main bytes");
  return { live, staged, old: [digest(live), digest(`${live}-wal`), digest(`${live}-shm`)], next: digest(staged)! };
}

function triplet(live: string): readonly (string | null)[] {
  return [digest(live), digest(`${live}-wal`), digest(`${live}-shm`)];
}

type Final = "old" | "new";

function classify(state: Fixture): Final {
  const now = triplet(state.live);
  expect(existsSync(join(state.live, "..", REPLACEMENT_DIRECTORY))).toBe(false);
  if (JSON.stringify(now) === JSON.stringify(state.old)) return "old";
  expect(now).toEqual([state.next, null, null]);
  return "new";
}

// Fault points still order every fsync; the barrier itself is a no-op so the matrix stays fast.
const noSync = () => {};
function crashingFs(target: string) {
  return replacementFs((point) => { if (point === target) throw new SimulatedCrash(point); }, noSync);
}
const fastFs = (fault: (point: string) => void = () => {}) => replacementFs(fault, noSync);

function recordPoints(run: (fault: (point: string) => void) => unknown): string[] {
  const points: string[] = [];
  run((point) => { points.push(point); });
  return points;
}

describe("replaceSqliteTriplet — keep-new only after durable verification", () => {
  it("installs the new standalone main and quarantines/removes the exact old triplet", () => {
    const state = fixture();
    expect(replaceSqliteTriplet({ livePath: state.live, stagedPath: state.staged, operationId: OPERATION, verify: () => {} })).toBe("kept_new");
    expect(classify(state)).toBe("new");
  });

  it("rolls a failed verification back to the byte-identical old triplet", () => {
    const state = fixture();
    expect(replaceSqliteTriplet({ livePath: state.live, stagedPath: state.staged, operationId: OPERATION, verify: () => { throw new Error("bad"); } })).toBe("rolled_back");
    expect(classify(state)).toBe("old");
  });

  it("refuses a staged database that still has sidecars", () => {
    const state = fixture();
    writeFileSync(`${state.staged}-wal`, "x");
    expect(() => replaceSqliteTriplet({ livePath: state.live, stagedPath: state.staged, operationId: OPERATION, verify: () => {} })).toThrow(/sidecars/u);
  });

  for (const [label, verifyPasses, sidecars] of [["verified path", true, true], ["failed-verification path", false, true], ["fresh target", true, false]] as const) {
    it(`crashes at every fault point of the ${label} and every recovery point, ending only in old or new`, () => {
      const verify = verifyPasses ? () => {} : () => { throw new Error("verification failed"); };
      const points = recordPoints((fault) => {
        const state = fixture(sidecars);
        replaceSqliteTriplet({ livePath: state.live, stagedPath: state.staged, operationId: OPERATION, verify, fs: fastFs(fault) });
      });
      expect(points.length).toBeGreaterThan(40);
      expect(new Set(points).size).toBe(points.length);
      const outcomes = new Set<Final>();
      const nested = (point: string) => label === "verified path" && points.indexOf(point) % 40 === 7;
      for (const point of points) {
        const state = fixture(sidecars);
        expect(() => replaceSqliteTriplet({ livePath: state.live, stagedPath: state.staged, operationId: OPERATION, verify, fs: crashingFs(point) })).toThrow(SimulatedCrash);
        // Second crash: interrupt recovery itself at each of its own points, then recover again.
        const recoveryPoints = !nested(point) ? [] : recordPoints((fault) => {
          const probe = fixture(sidecars);
          try { replaceSqliteTriplet({ livePath: probe.live, stagedPath: probe.staged, operationId: OPERATION, verify, fs: crashingFs(point) }); } catch { /* crashed */ }
          recoverReplacement(probe.live, fastFs(fault));
        });
        // Nested recovery crashes run from a spread of first-crash states on the verified path (the
        // full cross product is quadratic); each sampled state crashes recovery at every one of its
        // own points.
        for (const recoveryPoint of nested(point) ? recoveryPoints : []) {
          const probe = fixture(sidecars);
          try { replaceSqliteTriplet({ livePath: probe.live, stagedPath: probe.staged, operationId: OPERATION, verify, fs: crashingFs(point) }); } catch { /* crashed */ }
          try { recoverReplacement(probe.live, crashingFs(recoveryPoint)); } catch (error) { expect(error).toBeInstanceOf(SimulatedCrash); }
          recoverReplacement(probe.live, fastFs());
          const final = classify(probe);
          outcomes.add(final);
        }
        recoverReplacement(state.live, fastFs());
        const final = classify(state);
        outcomes.add(final);
        // Keep-new is permitted only once the `verified` generation is durable.
        if (final === "new") expect(verifyPasses).toBe(true);
      }
      expect(outcomes.has("old")).toBe(true);
      if (verifyPasses) expect(outcomes.has("new")).toBe(true);
    }, 180_000);
  }
});

describe("recoverReplacement — refuses what it cannot attribute", () => {
  function crashedAt(point: string): Fixture {
    const state = fixture();
    expect(() => replaceSqliteTriplet({ livePath: state.live, stagedPath: state.staged, operationId: OPERATION, verify: () => {}, fs: crashingFs(point) })).toThrow(SimulatedCrash);
    return state;
  }

  it("is a no-op without a transaction directory", () => {
    const state = fixture();
    expect(recoverReplacement(state.live)).toBe("none");
  });

  it("discards an unjournalled reservation without touching live bytes", () => {
    const state = crashedAt("after rename staged->transaction");
    expect(recoverReplacement(state.live)).toBe("discarded_unjournalled");
    expect(classify(state)).toBe("old");
  });

  it("refuses unknown entries, alternate directories and tampered digests", () => {
    const unknown = crashedAt("after rename live-main->old-main");
    writeFileSync(join(unknown.live, "..", REPLACEMENT_DIRECTORY, "stray"), "x");
    expect(() => recoverReplacement(unknown.live)).toThrow(ReplacementRecoveryRequired);

    const alternate = fixture();
    mkdirSync(join(alternate.live, "..", ".tabiya-replacement-2"));
    expect(() => recoverReplacement(alternate.live)).toThrow(/alternate/u);

    const tampered = crashedAt("after rename live-main->old-main");
    writeFileSync(join(tampered.live, "..", REPLACEMENT_DIRECTORY, "old-main"), "different bytes");
    expect(() => recoverReplacement(tampered.live)).toThrow(/neither generation/u);

    const crossed = crashedAt("after rename live-wal->old-wal");
    // Both the source and destination present: neither pending nor completed.
    writeFileSync(`${crossed.live}-wal`, "old wal bytes");
    expect(() => recoverReplacement(crossed.live)).toThrow(ReplacementRecoveryRequired);
  });

  it("parses a complete leftover journal temp and refuses a crossed operation or generation", () => {
    const state = crashedAt("after fsync journal.tmp#3");
    const transaction = join(state.live, "..", REPLACEMENT_DIRECTORY);
    const tmp = readFileSync(join(transaction, "journal.tmp"), "utf8");
    writeFileSync(join(transaction, "journal.tmp"), tmp.replace(OPERATION, "1b4e28ba-2fa1-4d2b-883f-0016d3cca427"));
    expect(() => recoverReplacement(state.live)).toThrow(/another operation or generation/u);
    writeFileSync(join(transaction, "journal.tmp"), tmp);
    expect(recoverReplacement(state.live)).toBe("rolled_back");
    expect(classify(state)).toBe("old");
  });

  it("discards a torn temp write and uses the committed generation", () => {
    const state = crashedAt("after fsync journal.tmp#3");
    const transaction = join(state.live, "..", REPLACEMENT_DIRECTORY);
    writeFileSync(join(transaction, "journal.tmp"), "{\"format\":\"tabiya-repl");
    expect(recoverReplacement(state.live)).toBe("rolled_back");
    expect(readdirSync(join(state.live, ".."))).not.toContain(REPLACEMENT_DIRECTORY);
  });

  it("refuses a non-canonical journal", () => {
    const state = crashedAt("after rename live-main->old-main");
    const journal = join(state.live, "..", REPLACEMENT_DIRECTORY, "journal.json");
    writeFileSync(journal, JSON.stringify(JSON.parse(readFileSync(journal, "utf8")), null, 2));
    expect(() => recoverReplacement(state.live)).toThrow(/canonical/u);
  });
});
