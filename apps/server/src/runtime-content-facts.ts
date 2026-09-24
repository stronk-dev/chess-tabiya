// rfc/verifiable-runtime-distribution.md §7 — compiled runtime-content facts.
//
// Pack admission cites prose anchors (graduation ruling lines) and dependency files (`blockedBy`).
// A development checkout answers those questions from the repository tree. A release image does not
// ship `planning/**`, `docs/**` or `rfc/**` prose: `TABIYA_RUNTIME_CONTENT_FACTS` names the immutable
// facts file the release bundle compiler emitted, and every answer comes from it. A configured but
// unreadable or malformed facts file fails startup rather than silently falling back to the tree.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface RuntimeContentFacts {
  readonly format: "tabiya-runtime-content-facts";
  readonly formatVersion: 1;
  readonly rulingRoots: readonly string[];
  readonly rulingLines: Readonly<Record<string, string>>;
  readonly resolvedPaths: readonly string[];
}

let cached: RuntimeContentFacts | null | undefined;

function parseFacts(text: string, source: string): RuntimeContentFacts {
  const value = JSON.parse(text) as Partial<RuntimeContentFacts>;
  const keys = Object.keys(value).sort().join(",");
  if (
    value.format !== "tabiya-runtime-content-facts"
    || value.formatVersion !== 1
    || keys !== "format,formatVersion,resolvedPaths,rulingLines,rulingRoots"
    || !Array.isArray(value.rulingRoots)
    || !Array.isArray(value.resolvedPaths)
    || value.rulingLines === null
    || typeof value.rulingLines !== "object"
  ) {
    throw new TypeError(`RUNTIME_CONTENT_FACTS_INVALID: ${source}`);
  }
  return Object.freeze({
    ...value,
    rulingRoots: Object.freeze([...value.rulingRoots]),
    rulingLines: Object.freeze({ ...value.rulingLines }),
    resolvedPaths: Object.freeze([...value.resolvedPaths]),
  }) as RuntimeContentFacts;
}

/** The compiled facts when this process runs from a release bundle; `null` in a checkout. */
export function runtimeContentFacts(): RuntimeContentFacts | null {
  if (cached !== undefined) return cached;
  const path = process.env.TABIYA_RUNTIME_CONTENT_FACTS;
  cached = path === undefined || path === "" ? null : parseFacts(readFileSync(path, "utf8"), path);
  return cached;
}

/** @internal Test seam: forget the cached facts so an environment change is observed. */
export function resetRuntimeContentFactsForTest(): void {
  cached = undefined;
}

/** Whether a repository-relative dependency path (a `blockedBy` target) exists for this build. */
export function repositoryPathExists(path: string): boolean {
  const facts = runtimeContentFacts();
  return facts === null ? existsSync(resolve(path)) : facts.resolvedPaths.includes(path);
}

/** One cited line of a registered ruling-anchor root, or `undefined` when it does not resolve. */
export function repositoryAnchorLine(file: string, line: number): string | undefined {
  const facts = runtimeContentFacts();
  if (facts !== null) return facts.rulingLines[`${file}#L${line}`];
  const absolute = resolve(file);
  if (!existsSync(absolute)) return undefined;
  return readFileSync(absolute, "utf8").split(/\r?\n/u)[line - 1];
}
