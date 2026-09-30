import { describe, expect, it } from "vitest";

import {
  arenaLegState,
  classroomRoleLabel,
  classroomStateLabel,
  invitationStateLabel,
  LIVE_BOARD_DELAY_SENTENCE,
  LIVE_VOTE_TIMING_SENTENCE,
  liveLegalMoveChoices,
  liveRoleLabel,
  proposalStateLabel,
  runSessionKindLabel,
  sessionJournalLabel,
  voteStateLabel,
} from "./live-copy.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("ordinary Live copy", () => {
  it("offers every legal move in SAN while retaining UCI as the wire value", () => {
    const choices = liveLegalMoveChoices(INITIAL);
    expect(choices).toHaveLength(20);
    expect(choices).toContainEqual({ uci: "e2e4", san: "e4" });
    expect(choices).toContainEqual({ uci: "g1f3", san: "Nf3" });
  });

  it("translates transport enums and refuses unknown journal vocabulary", () => {
    expect(["pack", "position", "imported"].map((kind) => runSessionKindLabel(kind as "pack"))).toEqual([
      "Pack rehearsal", "Position rehearsal", "Imported game rehearsal",
    ]);
    expect(["host", "participant", "spectator"].map((role) => liveRoleLabel(role as "host"))).toEqual(["Host", "Participant", "Spectator"]);
    expect(proposalStateLabel("stale")).toBe("From an earlier position");
    expect(voteStateLabel("stale")).toBe("Position changed");
    expect(invitationStateLabel("revoked")).toBe("No longer available");
    expect(classroomRoleLabel("teacher")).toBe("Teacher");
    expect(classroomStateLabel("invited")).toBe("Invitation waiting");
    expect(sessionJournalLabel("board.granted")).toBe("Board handed over");
    expect(sessionJournalLabel("future.event")).toBe("Session updated");
  });

  it("describes imported legs without exposing branch identities", () => {
    expect(arenaLegState(null, null)).toBe("Waiting for a game import");
    expect(arenaLegState("run:branch:42", "1-0")).toBe("Imported · result 1-0");
  });

  it("keeps the board delay and the vote's timing as two objects that each disclaim the other (LIV-a23)", () => {
    expect(LIVE_VOTE_TIMING_SENTENCE).toMatch(/when this poll closes/u);
    expect(LIVE_VOTE_TIMING_SENTENCE).toMatch(/not a board delay/u);
    expect(LIVE_BOARD_DELAY_SENTENCE).toMatch(/each move as you commit it/u);
    expect(LIVE_BOARD_DELAY_SENTENCE).toMatch(/does not delay the board/u);
    expect(LIVE_VOTE_TIMING_SENTENCE.toLowerCase()).not.toMatch(/\bduration\b/u);
  });
});
