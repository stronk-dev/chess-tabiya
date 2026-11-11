// DISPOSABLE synchronous diagnostic spans, never application telemetry or source authority.
import assert from "node:assert/strict";

export const TRACE_KEY = "__TABIYA_D4224_TRACE__";
export const BUILD_KEY = "__TABIYA_D4224_PROFILE_BUILD__";
interface Span { readonly name: string; readonly start: number; childMs: number }
interface Row { readonly name: string; calls: number; inclusiveMs: number; selfMs: number }

export class StageTrace {
  readonly #stack: Span[] = [];
  readonly #rows = new Map<string, Row>();
  readonly #counts = new Map<string, number>();
  constructor(private readonly now = () => performance.now()) {}

  enter(name: string): Span {
    assert(name.length > 0 && name.length < 160);
    const span = { name, start: this.now(), childMs: 0 };
    this.#stack.push(span); return span;
  }
  leave(span: Span): void {
    assert.strictEqual(this.#stack.at(-1), span, "Diagnostic spans must close in stack order");
    const duration = this.now() - span.start;
    assert(Number.isFinite(duration) && duration >= 0 && duration - span.childMs >= -1e-6);
    this.#stack.pop();
    const row = this.#rows.get(span.name) ?? { name: span.name, calls: 0, inclusiveMs: 0, selfMs: 0 };
    row.calls++; row.inclusiveMs += duration; row.selfMs += Math.max(0, duration - span.childMs); this.#rows.set(span.name, row);
    const parent = this.#stack.at(-1); if (parent) parent.childMs += duration;
    assert(this.#rows.size <= 128, "Refuse unbounded diagnostic labels");
  }
  span<T>(name: string, work: () => T): T {
    const frame = this.enter(name);
    try { return work(); } finally { this.leave(frame); }
  }
  count(name: string): void {
    this.#counts.set(name, (this.#counts.get(name) ?? 0) + 1);
    assert(this.#counts.size <= 128);
  }
  result() {
    assert.equal(this.#stack.length, 0, "An unfinished span cannot be reported");
    return { stages: [...this.#rows.values()].sort((a, b) => b.selfMs - a.selfMs),
      counters: [...this.#counts].map(([name, calls]) => ({ name, calls })).sort((a, b) => a.name.localeCompare(b.name)) };
  }
}
