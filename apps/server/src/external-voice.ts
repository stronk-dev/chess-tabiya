import { assertRenderedEvidenceView } from "@chess-tabiya/runtime";

import type { VoiceEvidenceView, VoiceProvider, VoiceScope } from "./guidance.js";

export interface ReasoningReviewRequest {
  readonly task: string;
  readonly transcript: unknown;
  readonly keyPoints: readonly { readonly id: string; readonly label: string; readonly phrases: readonly string[] }[];
  readonly detections: unknown;
}

export interface ReasoningReviewProvider {
  review(request: ReasoningReviewRequest): Promise<string>;
}

export interface ExternalHttpVoiceOptions {
  readonly url: string;
  readonly key?: string;
  readonly timeoutMs?: number;
  readonly fetch?: typeof fetch;
}

export class ExternalHttpVoiceProvider implements VoiceProvider, ReasoningReviewProvider {
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

  async render(view: VoiceEvidenceView, persona: string, _deterministicText: string, scope: VoiceScope): Promise<string> {
    assertRenderedEvidenceView(view.rendered);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);
    try {
      const response = await this.#fetch(this.#url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.#key === undefined ? {} : { authorization: `Bearer ${this.#key}` }),
        },
        body: JSON.stringify({ personaPrompt: persona, scope, items: view.rendered.items.map((item) => ({ evidence: item.evidence, sentences: item.sentences })) }),
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

  async review(request: ReasoningReviewRequest): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);
    try {
      const response = await this.#fetch(this.#url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.#key === undefined ? {} : { authorization: `Bearer ${this.#key}` }),
        },
        body: JSON.stringify({ personaPrompt: "Quote only contiguous learner text; do not add chess claims.", ...request }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Reasoning review provider returned ${response.status}`);
      const body: unknown = await response.json();
      if (body === null || typeof body !== "object" || Array.isArray(body) || typeof (body as Record<string, unknown>).text !== "string") throw new Error("Reasoning review provider response must be {text:string}");
      return (body as { text: string }).text;
    } finally {
      clearTimeout(timeout);
    }
  }
}
