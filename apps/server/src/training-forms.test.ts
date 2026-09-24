// rfc/pack-training-forms.md — acceptance criteria 1–12 for lane 0.32.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { cycleOrder, narrowedRung, passMarkCompletion, rampCeilingRung, scaledLuxuryBudget, type MemberVerdict } from "@chess-tabiya/runtime";
import { digestDrillPack, type TrainingSetDefinition } from "@chess-tabiya/schema/drill-pack";

import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { validatePackDocument } from "./pack-validation.js";
import type { AttemptVerdict } from "./progress.js";
import { SQLiteRunStorage } from "./storage.js";
import { validateTrainingSet } from "./training-set-validation.js";

const example = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8")) as Record<string, unknown>;
const provenance = { reviewStatus: "draft" as const, sources: ["fixture"] };
const members = (count: number) => Array.from({ length: count }, (_, index) => ({ packId: `pack-${index + 1}`, ordinal: index + 1 }));
const set = (overrides: Partial<TrainingSetDefinition> = {}): TrainingSetDefinition => ({ id: "chapter-one", formatVersion: "0.1", title: "Chapter one", members: members(3), provenance, ...overrides });
const lookup = (withWindows: readonly string[] = [], registered: readonly string[] = members(10).map((member) => member.packId)) => ({
  get: (id: string) => (registered.includes(id) ? { id, ...(withWindows.includes(id) ? { timingWindows: [{}] } : {}) } : undefined),
});

describe("criterion 1 — a set validates and a pack gains no member field", () => {
  it("accepts a well-formed set and refuses setId/setMembership on a pack by the validator", () => {
    expect(validateTrainingSet(set()).valid).toBe(true);
    expect(validateTrainingSet({ ...set(), formatVersion: "0.2" }).issues.map((issue) => issue.code)).toEqual(["SCHEMA_INVALID"]);
    for (const key of ["setId", "setMembership"]) {
      const pack = withDerivedRequires({ ...example, [key]: key === "setId" ? "chapter-one" : { setId: "chapter-one", ordinal: 1 } });
      expect(validatePackDocument(pack).valid, key).toBe(false);
    }
  });
});

describe("criteria 2 and 3 — ordinals and publication", () => {
  it("refuses a missing or duplicate ordinal, naming the member", () => {
    const duplicate = validateTrainingSet(set({ members: [{ packId: "pack-1", ordinal: 1 }, { packId: "pack-2", ordinal: 1 }] }));
    expect(duplicate.issues.map((issue) => issue.code)).toContain("TRAINING_SET_ORDINAL_DUPLICATE");
    expect(duplicate.issues.find((issue) => issue.code === "TRAINING_SET_ORDINAL_DUPLICATE")?.message).toContain("pack-2");
    const missing = validateTrainingSet(set({ members: [{ packId: "pack-1", ordinal: 1 }, { packId: "pack-3", ordinal: 3 }] }));
    expect(missing.issues.map((issue) => issue.code)).toContain("TRAINING_SET_ORDINAL_MISSING");
    expect(missing.issues.find((issue) => issue.code === "TRAINING_SET_ORDINAL_MISSING")?.message).toContain("pack-3");
  });

  it("refuses an unregistered packId at publication, not at read time", () => {
    const withStranger = set({ members: [...members(2), { packId: "stranger", ordinal: 3 }] });
    expect(validateTrainingSet(withStranger, { packs: lookup() }).valid).toBe(true);
    expect(validateTrainingSet(withStranger, { packs: lookup(), publication: true }).issues.map((issue) => issue.code)).toEqual(["TRAINING_SET_PACK_UNREGISTERED"]);
  });
});

describe("criterion 4 — digestDrillPack is unchanged by a set", () => {
  it("a member pack's digest is byte-identical before and after its set exists", async () => {
    const before = await digestDrillPack(example);
    const containing = set({ members: [{ packId: String(example.id), ordinal: 1 }] });
    expect(validateTrainingSet(containing).valid).toBe(true);
    expect(await digestDrillPack(example)).toBe(before);
    expect(Object.keys(example)).not.toContain("setId");
  });
});

describe("criteria 5, 6 and 11 — the pass mark counts verdicts and nothing else", () => {
  const ten = set({ members: members(10), passMark: { require: 7, of: "all", onFail: "repeat_set" } });
  const verdicts = (stable: number, unstable: number, open = 0) => new Map<string, MemberVerdict>(members(10).map((member, index) => [member.packId, index < stable ? "stable" : index < stable + unstable ? "unstable" : index < stable + unstable + open ? "open" : "unstable"]));

  it("7 stable passes, 6 stable + 4 unstable fails, an open member counts as neither", () => {
    expect(passMarkCompletion(ten, verdicts(7, 3)).passed).toBe(true);
    expect(passMarkCompletion(ten, verdicts(6, 4)).passed).toBe(false);
    expect(passMarkCompletion(ten, verdicts(6, 3, 1)).passed).toBe(false);
    expect(passMarkCompletion(ten, verdicts(7, 0, 3)).passed).toBe(true);
    const verdict: AttemptVerdict = "open";
    const shared: MemberVerdict = verdict;
    expect(shared).toBe("open");
  });

  it("a failed set re-offers, gates nothing, and its payload carries no count or per-member number", () => {
    const completion = passMarkCompletion(ten, verdicts(6, 4));
    expect(completion).toEqual({ kind: "set_completion", setId: "chapter-one", passed: false, reoffer: true });
    expect(Object.values(completion).some((value) => typeof value === "number")).toBe(false);
    expect(validatePackDocument(example).valid).toBe(true);
  });
});

describe("criteria 7 and 8 — the ramp only narrows and tightens by attempt", () => {
  const ramp = [{ throughAttempt: 1, ceilingRung: 5 as const }, { throughAttempt: 2, ceilingRung: 2 as const }];

  it("a pack ceiling at rung 5 under a learner preset at rung 1 yields rung 1", () => {
    expect(narrowedRung(1, rampCeilingRung(ramp, 1))).toBe(1);
    expect(narrowedRung(4, rampCeilingRung(ramp, 2))).toBe(2);
    expect(narrowedRung(3, rampCeilingRung(undefined, 1))).toBe(3);
  });

  it("attempt 1 permits the authored rung and the attempt after throughAttempt permits rung 0", () => {
    expect(rampCeilingRung(ramp, 1)).toBe(5);
    expect(rampCeilingRung(ramp, 3)).toBe(0);
  });

  it("refuses rung 6, a widening step and an unordered ramp at validation", () => {
    const stamped = (value: unknown) => withDerivedRequires({ ...example, assistanceCeilingRamp: value });
    expect(validatePackDocument(stamped(ramp)).valid).toBe(true);
    expect(stamped(ramp).requires.map((row) => row.id)).toEqual(expect.arrayContaining(["assistanceCeilingRamp.ceilingRung.5", "assistanceCeilingRamp.ceilingRung.2"]));
    expect(validatePackDocument({ ...stamped(ramp), assistanceCeilingRamp: [{ throughAttempt: 1, ceilingRung: 6 }] }).valid).toBe(false);
    expect(validatePackDocument(stamped([{ throughAttempt: 1, ceilingRung: 2 }, { throughAttempt: 2, ceilingRung: 4 }])).issues.map((issue) => issue.code)).toContain("ASSISTANCE_RAMP_WIDENS");
    expect(validatePackDocument(stamped([{ throughAttempt: 2, ceilingRung: 3 }, { throughAttempt: 2, ceilingRung: 1 }])).issues.map((issue) => issue.code)).toContain("ASSISTANCE_RAMP_NOT_INCREASING");
  });
});

describe("criteria 9 and 10 — tempo scales authored budgets and writes no schedule", () => {
  it("a luxury budget of 4 under budgetScale 0.5 enforces 2", () => {
    expect(scaledLuxuryBudget(4, 0.5)).toBe(2);
    expect(() => scaledLuxuryBudget(4, 1.5)).toThrow(RangeError);
  });

  it("a tempo set whose members declare no timing windows is refused, naming them", () => {
    const tempo = set({ tempo: { cycles: [{ ordinal: 1, budgetScale: 1 }, { ordinal: 2, budgetScale: 0.5 }] } });
    const issues = validateTrainingSet(tempo, { packs: lookup(["pack-1"]) }).issues;
    expect(issues.map((issue) => issue.code)).toEqual(["TRAINING_SET_TEMPO_WITHOUT_WINDOWS"]);
    expect(issues[0]!.message).toContain("pack-2, pack-3");
    expect(validateTrainingSet(tempo, { packs: lookup(["pack-1", "pack-2", "pack-3"]) }).valid).toBe(true);
  });

  it("sequencing a cycle is pure: it reaches no schedule writer and adds no schedules row", () => {
    const storage = new SQLiteRunStorage();
    try {
      let created = 0;
      const original = storage.createSchedule.bind(storage);
      storage.createSchedule = (input) => { created += 1; return original(input); };
      expect(cycleOrder(set({ members: [{ packId: "b", ordinal: 2 }, { packId: "a", ordinal: 1 }] }))).toEqual(["a", "b"]);
      expect(created).toBe(0);
      const module = readFileSync(new URL("../../../packages/runtime/src/training-forms.ts", import.meta.url), "utf8");
      expect(module).not.toMatch(/schedule|storage/iu);
    } finally {
      storage.close();
    }
  });
});

describe("criterion 12 — the register joins", () => {
  it("lane 0.32 is landed exactly once and no longer claimed", () => {
    const register = readFileSync(new URL("../../../rfc/README.md", import.meta.url), "utf8");
    expect(register.match(/^\| 0\.32 \| `pack-training-forms\.md` \|/gmu)).toHaveLength(1);
    expect(register).not.toMatch(/^\| lane 0\.32 \|/mu);
  });
});
