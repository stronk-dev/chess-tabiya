import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { modeNotice, operationConfigured, operationNotice, operationRequestable, providerInspectorRows, providerRows } from "./provider-availability.js";
import { fixtureProviderHealth } from "./provider-health.test-support.js";

const SOURCE = new URL("..", import.meta.url).pathname;

function sources(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(?:ts|svelte)$/u.test(name) && !/\.test(?:-support)?\.ts$/u.test(name) ? [path] : [];
  });
}

describe("provider-availability selector (criterion 18)", () => {
  it("the client has zero direct providers.* feature gates; every control reads live provider health", () => {
    const offenders = sources(SOURCE).filter((path) => /capabilities\??\.providers\b|providers\.(?:opponent|judge|llm|corpus|tts|tablebase)\b/u.test(readFileSync(path, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("separates not-configured from a runtime failure and from ready-to-try", () => {
    const capabilities = { providerHealth: fixtureProviderHealth({ "explorer-primary": { failed: "rate_limited" }, "external-voice": "unverified" }) };
    expect(operationConfigured(capabilities, "evidence.explorer_query")).toBe(true);
    expect(operationRequestable(capabilities, "evidence.explorer_query")).toBe(false);
    expect(operationNotice(capabilities, "evidence.explorer_query")).toMatchObject({ retryable: true, tone: "unavailable", reason: "Human-game statistics is unavailable right now: the service asked us to slow down." });
    expect(operationNotice(capabilities, "render.voice")).toMatchObject({ requestable: true, label: "Ready to try" });
    expect(operationNotice(capabilities, "render.speech")).toMatchObject({ notConfigured: true, retryable: false });
    expect(modeNotice(capabilities, "human_common")).toMatchObject({ notConfigured: true });
    expect(operationNotice(undefined, "render.speech").notConfigured).toBe(true);
  });

  it("keeps ordinary rows plain and puts generation, reason and times only in the inspector rows", () => {
    const capabilities = { providerHealth: fixtureProviderHealth({ "maia-inference": { failed: "timeout", cachedEntries: 2 } }) };
    const maia = providerRows(capabilities).find((row) => row.id === "maia-inference")!;
    expect(maia).toEqual({ id: "maia-inference", label: "Human-like opponents", state: "Saved responses only" });
    const detail = providerInspectorRows(capabilities).find((row) => row.id === "maia-inference")!.detail;
    expect(detail).toContain("reason timeout");
    expect(detail).toContain("2 saved exact responses");
    expect(detail).toMatch(/generation [0-9a-f]{12}/u);
  });
});
