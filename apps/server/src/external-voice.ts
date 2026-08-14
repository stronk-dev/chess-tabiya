import type { EvidencePacket } from "@chess-tabiya/runtime";

import type { VoiceProvider, VoiceScope } from "./guidance.js";

export interface ExternalHttpVoiceOptions {
  readonly url: string;
  readonly key?: string;
  readonly timeoutMs?: number;
  readonly fetch?: typeof fetch;
}

export class ExternalHttpVoiceProvider implements VoiceProvider {
  readonly #url: string;
  readonly #key: string | undefined;
  readonly #timeoutMs: number;
  readonly #fetch: typeof fetch;

  constructor(options: ExternalHttpVoiceOptions) {
    this.#url = options.url;
    this.#key = options.key;
    this.#timeoutMs = options.timeoutMs ?? 4_000;
    this.#fetch = options.fetch ?? fetch;
  }

  async render(packet: EvidencePacket, persona: string, _deterministicText: string, scope: VoiceScope): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);
    try {
      const response = await this.#fetch(this.#url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.#key === undefined ? {} : { authorization: `Bearer ${this.#key}` }),
        },
        body: JSON.stringify({ personaPrompt: persona, sentences: packet.sentences, scope }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Voice provider returned ${response.status}`);
      const body: unknown = await response.json();
      if (body === null || typeof body !== "object" || Array.isArray(body) || typeof (body as Record<string, unknown>).text !== "string") {
        throw new Error("Voice provider response must be {text:string}");
      }
      return (body as { text: string }).text;
    } finally {
      clearTimeout(timeout);
    }
  }
}
