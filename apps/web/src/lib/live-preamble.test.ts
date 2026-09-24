// @vitest-environment happy-dom

import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";

import { LIVE_WORKFLOWS } from "./live-creation.js";
import { LIVE_PREAMBLE_ORDER, LIVE_PREAMBLE_QUESTIONS, LIVE_PREAMBLES, livePreamble } from "./live-preamble.js";
import LivePreamble from "./LivePreamble.svelte";

afterEach(() => document.body.replaceChildren());

describe("live explanation contract (LIV-a16, LIV-a17)", () => {
  it("gives every offered non-Academy workflow all five answers, and leaves Academy to its owner decision", () => {
    for (const option of LIVE_WORKFLOWS) {
      const preamble = livePreamble(option.id);
      if (option.id === "academy") { expect(preamble).toBeUndefined(); continue; }
      expect(preamble).toBeDefined();
      for (const key of LIVE_PREAMBLE_ORDER) expect(preamble![key].trim().length, `${option.id}.${key}`).toBeGreaterThan(20);
    }
  });

  it("states the Stream refusals: no platform connection, no chat, no board delay, no anonymous viewer", () => {
    const refuses = LIVE_PREAMBLES.stream.refuses.toLowerCase();
    for (const refusal of ["no twitch or youtube", "no chat", "no board delay", "no anonymous"]) expect(refuses).toContain(refusal);
  });

  it("treats Match and Position Arena as two features with two different preambles", () => {
    for (const key of LIVE_PREAMBLE_ORDER) expect(LIVE_PREAMBLES.native_match[key]).not.toBe(LIVE_PREAMBLES.position_arena[key]);
    expect(LIVE_PREAMBLES.native_match.refuses).toMatch(/No clocks, no ratings/u);
    expect(LIVE_PREAMBLES.position_arena.refuses).toMatch(/not played or timed here/u);
  });

  it("never speaks about the board: no piece, square, or move notation in any answer", () => {
    const text = Object.values(LIVE_PREAMBLES).flatMap((preamble) => Object.values(preamble)).join(" ");
    expect(text).not.toMatch(/\b[a-h][1-8]\b/u);
    expect(text).not.toMatch(/\b(?:[KQRBN][a-h]?x?[a-h][1-8]|O-O)\b/u);
    expect(text.toLowerCase()).not.toMatch(/\b(?:king|queen|rook|bishop|knight|pawn)s?\b/u);
  });

  it("renders the refusal as a peer answer at the same weight, not a footnote or collapsed detail", async () => {
    const component = mount(LivePreamble, { target: document.body.appendChild(document.createElement("div")), props: { workflow: "stream", id: "preamble" } });
    await tick();
    const answers = [...document.querySelectorAll<HTMLElement>("#preamble > [data-preamble-answer]")];
    expect(answers.map((answer) => answer.querySelector("dt")?.textContent)).toEqual(LIVE_PREAMBLE_ORDER.map((key) => LIVE_PREAMBLE_QUESTIONS[key]));
    const refusal = answers.at(-1)!;
    expect(refusal.querySelector("dd")?.textContent).toBe(LIVE_PREAMBLES.stream.refuses);
    expect(refusal.closest("details")).toBeNull();
    expect(refusal.className).toBe(answers[0]!.className);
    await unmount(component);
  });
});
