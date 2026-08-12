import { SourcingError } from "./types.js";
import type { SourceLock } from "./lock.js";

export interface SourcingHttpResponse {
  readonly status: number;
  readonly headers: Headers;
  readonly body: Uint8Array;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
export type Wait = (milliseconds: number) => Promise<void>;

const RETRY_DELAYS = [60_000, 120_000, 240_000] as const;
let inProcessTail: Promise<void> = Promise.resolve();

async function defaultWait(milliseconds: number): Promise<void> {
  await new Promise((done) => setTimeout(done, milliseconds));
}

export class SourcingHttpClient {
  constructor(
    private readonly lock: SourceLock,
    private readonly fetcher: FetchLike = fetch,
    private readonly wait: Wait = defaultWait,
    private readonly userAgent = "chess-tabiya-sourcing/0.0.0 (+https://github.com/stronk-dev/chess-tabiya; repository-owner)",
  ) {}

  async request(url: string, init: RequestInit = {}): Promise<SourcingHttpResponse> {
    const previous = inProcessTail;
    let release!: () => void;
    inProcessTail = new Promise<void>((done) => { release = done; });
    await previous;
    try {
      for (let attempt = 0; ; attempt += 1) {
        await this.lock.verify();
        const response = await this.fetcher(url, { ...init, headers: { "user-agent": this.userAgent, ...(init.headers ?? {}) } });
        if ((response.status === 429 || response.status >= 500) && attempt < RETRY_DELAYS.length) {
          await this.wait(RETRY_DELAYS[attempt]!);
          continue;
        }
        if (response.status === 429 || response.status >= 500) throw new SourcingError("SOURCE_UNAVAILABLE", `${url} remained unavailable after ${attempt} retries (HTTP ${response.status})`);
        if (response.status >= 400) throw new SourcingError("SOURCE_HTTP_ERROR", `${url} returned HTTP ${response.status}; 4xx responses are not retried`);
        return Object.freeze({ status: response.status, headers: response.headers, body: new Uint8Array(await response.arrayBuffer()) });
      }
    } finally {
      release();
    }
  }
}
