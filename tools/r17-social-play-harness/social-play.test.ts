// DISPOSABLE research harness — platform-alignment R17. Not production code.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("../../", import.meta.url).pathname;
const OUTPUT = join(ROOT, "tools/r17-social-play-harness/conformance-output.md");
const source = (path: string): string => readFileSync(join(ROOT, path), "utf8");

interface AdapterEnvelope {
  readonly source: { readonly runId: string; readonly nodeId: string; readonly packId: string | null };
  readonly provider: { readonly id: "lichess"; readonly challengeId: string; readonly gameId: string };
  readonly terms: { readonly rated: boolean; readonly clock: { readonly limitSeconds: number; readonly incrementSeconds: number } | null };
  readonly return: { readonly importedRunId: string; readonly branchId: string; readonly result: "1-0" | "0-1" | "1/2-1/2" | "*" };
}

interface BotEventEnvelope {
  readonly eventId: string;
  readonly entrants: readonly { readonly policyId: string; readonly policyVersion: string }[];
  readonly games: readonly { readonly runId: string; readonly whitePolicyId: string; readonly blackPolicyId: string; readonly reviewRunId: string }[];
}

function validAdapterEnvelope(value: AdapterEnvelope): boolean {
  return value.source.runId.length > 0 && value.source.nodeId.length > 0 && value.provider.challengeId.length > 0 &&
    value.provider.gameId.length > 0 && value.return.importedRunId.length > 0 && value.return.branchId.length > 0;
}

function validBotEvent(value: BotEventEnvelope): boolean {
  const policies = new Set(value.entrants.map((entry) => `${entry.policyId}@${entry.policyVersion}`));
  return value.eventId.length > 0 && value.entrants.length >= 2 && value.entrants.every((entry) => entry.policyId.length > 0 && entry.policyVersion.length > 0) && value.games.length > 0 && value.games.every((game) =>
    game.runId.length > 0 && game.reviewRunId.length > 0 && [...policies].some((entry) => entry.startsWith(`${game.whitePolicyId}@`)) &&
    [...policies].some((entry) => entry.startsWith(`${game.blackPolicyId}@`)));
}

describe("R17 human play and social-event boundary", () => {
  it("measures the native and current external handoff without upgrading transport to identity", () => {
    const types = source("apps/server/src/live-types.ts");
    const service = source("apps/server/src/live-session.ts");
    const docs = source("docs/live-sessions.md");
    const storage = source("apps/server/src/storage.ts");

    const current = {
      nativePrivateMatch: types.includes('"match"') && service.includes('boardControl==="match"'),
      arbitraryFen: service.includes("canonicalRunStart") && docs.includes("untouched position run"),
      learningRunPreserved: service.includes("saveArenaImport(next") && docs.includes("one position run"),
      opaqueExternalUrl: types.includes("externalChallengeUrl") && service.includes("new URL(input.externalChallengeUrl)"),
      providerIdentity: /providerId|provider_id|externalProvider/iu.test(types + storage),
      externalGameIdentity: /externalGameId|external_game_id|challengeId|challenge_id/iu.test(types + storage),
      automaticReturn: /webhook|event stream|streamEvent|gameFinish/iu.test(service + storage),
      clocks: docs.includes("Native matches have no clocks"),
      rated: docs.includes("Native matches have no clocks, ratings"),
      publicMatchmaking: docs.includes("matchmaking, and provider-specific challenge APIs do not ship"),
      resignationOrDraw: /resignation\s+event,\s+or\s+agreed-\s*draw\s+event/iu.test(docs),
      rematch: /rematch/iu.test(types + service + storage),
      moderation: /reportPlayer|blockPlayer|moderationCase|fairPlayCase/iu.test(types + service + storage),
      botTournament: /botTournament|bot_tournament/iu.test(types + service + storage),
    };
    expect(current).toEqual({
      nativePrivateMatch: true, arbitraryFen: true, learningRunPreserved: true, opaqueExternalUrl: true,
      providerIdentity: false, externalGameIdentity: false, automaticReturn: false, clocks: true, rated: true,
      publicMatchmaking: true, resignationOrDraw: true, rematch: false, moderation: false, botTournament: false,
    });

    const incomplete = {
      source: { runId: "r1", nodeId: "n1", packId: null },
      provider: { id: "lichess" as const, challengeId: "", gameId: "" },
      terms: { rated: false, clock: null },
      return: { importedRunId: "r1", branchId: "b1", result: "*" as const },
    };
    expect(validAdapterEnvelope(incomplete)).toBe(false);
  });

  it("proves the official adapter substrate and both minimum identity envelopes", () => {
    const api = JSON.parse(source("tools/r17-social-play-harness/official-lichess-api.json")) as {
      version: string; operations: Record<string, { path: string; capabilities: string[] }>;
    };
    const capabilities = new Set(Object.values(api.operations).flatMap((operation) => operation.capabilities));
    for (const required of ["fen", "clock", "rated", "challenge_identity", "game_identity", "game_finish", "pgn", "public_opponent_discovery", "pairings"] as const) {
      expect(capabilities.has(required)).toBe(true);
    }

    const roundTrip: AdapterEnvelope = {
      source: { runId: "run-1", nodeId: "node-7", packId: "carlsbad" },
      provider: { id: "lichess", challengeId: "abcd1234", gameId: "abcd1234" },
      terms: { rated: false, clock: { limitSeconds: 600, incrementSeconds: 5 } },
      return: { importedRunId: "run-1", branchId: "branch-external", result: "1/2-1/2" },
    };
    expect(validAdapterEnvelope(roundTrip)).toBe(true);

    const botEvent: BotEventEnvelope = {
      eventId: "event-1",
      entrants: [
        { policyId: "guarded-human", policyVersion: "1" },
        { policyId: "pawn-heavy", policyVersion: "1" },
      ],
      games: [{ runId: "game-run-1", whitePolicyId: "guarded-human", blackPolicyId: "pawn-heavy", reviewRunId: "game-run-1" }],
    };
    expect(validBotEvent(botEvent)).toBe(true);
    expect(validBotEvent({ ...botEvent, entrants: botEvent.entrants.map((entry) => ({ ...entry, policyVersion: "" })) })).toBe(false);

    const report = [
      "# R17 social-play conformance",
      "",
      "Disposable current-tree result; no product authority.",
      "",
      `Official Lichess OpenAPI snapshot: ${api.version}.`,
      "",
      "## Current boundary",
      "",
      "- Native private friend match: yes; untimed, unrated, no public matchmaking or moderation claim.",
      "- Position Arena preserves one Tabiya run and imported branches, but its external link is opaque.",
      "- Provider/challenge/game identity: absent.",
      "- Automatic provider result return: absent.",
      "- Bot tournament/event envelope: absent.",
      "",
      "## Contract controls",
      "",
      `- Exact external round trip accepted: ${validAdapterEnvelope(roundTrip)}.`,
      `- URL/PGN-only round trip accepted: ${validAdapterEnvelope({ ...roundTrip, provider: { ...roundTrip.provider, gameId: "" } })}.`,
      `- Versioned bot event accepted: ${validBotEvent(botEvent)}.`,
      `- Unversioned bot event accepted: ${validBotEvent({ ...botEvent, entrants: botEvent.entrants.map((entry) => ({ ...entry, policyVersion: "" })) })}.`,
      "",
    ];
    writeFileSync(OUTPUT, report.join("\n"));
  });
});
