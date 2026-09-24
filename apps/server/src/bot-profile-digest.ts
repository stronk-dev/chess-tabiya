import { createHash } from "node:crypto";

import {
  BOT_MODEL_BANDS,
  BOT_PROFILE_FAMILIES,
  botBehaviorDeclaration,
  botProfileDeclaration,
  botProfileId,
  type BotProfileId,
} from "@chess-tabiya/runtime";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

export type Sha256 = `sha256:${string}`;

/** RFC-8785 canonical JSON, SHA-256, `sha256:` grammar. */
export function canonicalSha256(value: unknown): Sha256 {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

/**
 * Recomputes every `bot-profile-catalog@1` digest from its declaration. The runtime module pins
 * these as literals (it also runs in the browser); the catalog test asserts equality so a changed
 * declaration can never keep its historical digest.
 */
export function computeBotProfileDigests(): Readonly<Record<BotProfileId, Readonly<{ digest: Sha256; behaviorDigest: Sha256 }>>> {
  const rows: Array<[BotProfileId, Readonly<{ digest: Sha256; behaviorDigest: Sha256 }>]> = [];
  for (const family of BOT_PROFILE_FAMILIES) {
    for (const band of BOT_MODEL_BANDS) {
      const behaviorDigest = canonicalSha256(botBehaviorDeclaration(family, band));
      const digest = canonicalSha256(botProfileDeclaration(family, band, behaviorDigest));
      rows.push([botProfileId(family, band), Object.freeze({ digest, behaviorDigest })]);
    }
  }
  return Object.freeze(Object.fromEntries(rows) as Record<BotProfileId, Readonly<{ digest: Sha256; behaviorDigest: Sha256 }>>);
}
