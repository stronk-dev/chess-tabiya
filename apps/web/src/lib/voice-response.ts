import type { VoicePage } from "./api.js";

const VOICE_SOURCES = new Set(["provider", "deterministic"]);

export function parseVoicePage(value: unknown, requestedScope: VoicePage["scope"]): VoicePage {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("voice-response must be an object");
  }
  const page = value as Readonly<Record<string, unknown>>;
  const keys = Object.keys(page);
  if (keys.length !== 3 || !keys.includes("text") || !keys.includes("source") || !keys.includes("scope")) {
    throw new TypeError("voice-response has an invalid shape");
  }
  if (typeof page.text !== "string" || page.text.trim() === "") {
    throw new TypeError("voice-response/text must be non-empty text");
  }
  if (typeof page.source !== "string" || !VOICE_SOURCES.has(page.source)) {
    throw new TypeError("voice-response/source is outside the closed vocabulary");
  }
  if (page.scope !== requestedScope) throw new TypeError("voice-response/scope does not match the request");
  return Object.freeze({ text: page.text, source: page.source, scope: requestedScope }) as VoicePage;
}
