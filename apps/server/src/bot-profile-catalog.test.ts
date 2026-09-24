import {
  BOT_PROFILE_CATALOG,
  BOT_PROFILE_DIGESTS,
  botBehaviorDeclaration,
  botProfileDeclaration,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { canonicalSha256, computeBotProfileDigests } from "./bot-profile-digest.js";

describe("bot-profile-catalog@1 generated digests (bot-policy §1, A1)", () => {
  it("pins exactly the RFC-8785 SHA-256 of every declaration", () => {
    // A failure here means a declaration changed: that is a new profile version, never a new
    // digest for the old identity. Re-pin only together with a version bump.
    expect(BOT_PROFILE_DIGESTS).toEqual(computeBotProfileDigests());
    for (const entry of BOT_PROFILE_CATALOG) {
      expect(entry.reference.digest).toBe(BOT_PROFILE_DIGESTS[entry.reference.id].digest);
      expect(entry.behaviorDigest).toBe(BOT_PROFILE_DIGESTS[entry.reference.id].behaviorDigest);
    }
  });

  it("gives every profile and behaviour a distinct digest, so no two bands share a cache or calibration key", () => {
    const profiles = BOT_PROFILE_CATALOG.map((entry) => entry.reference.digest);
    const behaviours = BOT_PROFILE_CATALOG.map((entry) => entry.behaviorDigest);
    expect(new Set(profiles).size).toBe(BOT_PROFILE_CATALOG.length);
    expect(new Set(behaviours).size).toBe(BOT_PROFILE_CATALOG.length);
  });
});

describe("behaviour vs presentation digests (bot-roster §2, criterion 2)", () => {
  const family = "guarded-human" as const;
  const band = 1400 as const;
  const behaviour = botBehaviorDeclaration(family, band);
  const behaviorDigest = canonicalSha256(behaviour);
  const declaration = botProfileDeclaration(family, band, behaviorDigest);

  it("changes only the profile digest for a presentation-only change", () => {
    const withIdentity = { ...declaration, presentation: { id: "persona.example@1", avatarDigest: `sha256:${"b".repeat(64)}` } };
    expect(canonicalSha256(withIdentity)).not.toBe(canonicalSha256(declaration));
    expect(canonicalSha256(behaviour)).toBe(behaviorDigest);
  });

  it("changes both digests for a move-affecting change", () => {
    const changed = { ...behaviour, sampler: { ...behaviour.sampler, topP: 0.95 } };
    const changedBehavior = canonicalSha256(changed);
    expect(changedBehavior).not.toBe(behaviorDigest);
    expect(canonicalSha256(botProfileDeclaration(family, band, changedBehavior as `sha256:${string}`))).not.toBe(canonicalSha256(declaration));
    const guardChanged = { ...behaviour, layers: behaviour.layers.map((layer) => layer.kind === "error_guard" ? { ...layer, parameters: { ...layer.parameters, thresholdCp: 300 } } : layer) };
    expect(canonicalSha256(guardChanged)).not.toBe(behaviorDigest);
  });
});
