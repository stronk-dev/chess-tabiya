import { expect, it } from "vitest";
import { MODULE_POLICIES, type CompiledAssistanceEffect } from "@chess-tabiya/runtime/client";
import { composedSeats, PLAY_SEAT_MODULES } from "./module-seats.js";

// Presentation-only input: no receipt, provider, evidence or effective permission is minted here.
const effects: readonly CompiledAssistanceEffect[] = PLAY_SEAT_MODULES.map(moduleId => {
  const policy = MODULE_POLICIES.find(row => row.id === moduleId)!;
  const timing = policy.timings[0]!;
  return { effectId: `${moduleId}.${timing.timing}`, moduleId, timing: timing.timing,
    arm: timing.initiative === "proactive" ? "proactive" : timing.initiative === "ambient" ? "ambient" : "on_request" };
});

it.each(PLAY_SEAT_MODULES)("D3744 %s is labelled by its registered learner question", moduleId => {
  const policy = MODULE_POLICIES.find(row => row.id === moduleId)!;
  const seat = composedSeats({ modules: PLAY_SEAT_MODULES, effects }).find(row => row.module === moduleId)!;
  expect(seat.label).toBe(policy.intent);
  expect(seat.learnerAction).toBe(policy.learnerAction);
  expect(seat.emptySilent).toBe(policy.emptyBehavior.kind === "silent");
  expect(seat.headSlot).toBe(moduleId === "blunder_prevention");
});

it("D3744 questions never create seats without an effective play effect", () => {
  expect(composedSeats(undefined)).toEqual([]);
  expect(composedSeats({ modules: PLAY_SEAT_MODULES, effects: [] })).toEqual([]);
  expect(composedSeats({ modules: [], effects })).toEqual([]);
});
