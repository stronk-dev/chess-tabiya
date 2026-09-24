import { providerSignal } from "./external-voice.js";
import { ProviderHttpError } from "./provider-health.js";

export interface TtsResult {
  readonly bytes: Uint8Array;
  readonly contentType: string;
}

export interface TtsProvider {
  synthesize(text: string, signal?: AbortSignal): Promise<TtsResult>;
}

export interface ExternalHttpTtsOptions {
  readonly url: string;
  readonly key?: string;
  readonly timeoutMs?: number;
  readonly fetch?: typeof fetch;
}

export class ExternalHttpTtsProvider implements TtsProvider {
  readonly #url: string;
  readonly #key: string | undefined;
  readonly #timeoutMs: number;
  readonly #fetch: typeof fetch;

  constructor(options: ExternalHttpTtsOptions) {
    this.#url = options.url;
    this.#key = options.key;
    this.#timeoutMs = options.timeoutMs ?? 4_000;
    this.#fetch = options.fetch ?? fetch;
  }

  async synthesize(text: string, signal?: AbortSignal): Promise<TtsResult> {
    const controller = providerSignal(this.#timeoutMs, signal);
    try {
      const response = await this.#fetch(this.#url, {
        method: "POST",
        headers: {
          "content-type": "text/plain; charset=utf-8",
          ...(this.#key === undefined ? {} : { authorization: `Bearer ${this.#key}` }),
        },
        body: text,
        signal: controller.signal,
      });
      if (!response.ok) throw new ProviderHttpError(response.status, response.headers.get("retry-after"), `TTS provider returned ${response.status}`);
      return Object.freeze({
        bytes: new Uint8Array(await response.arrayBuffer()),
        contentType: response.headers.get("content-type") ?? "audio/mpeg",
      });
    } finally {
      controller.dispose();
    }
  }
}
