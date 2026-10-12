import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as client from "./client.js";
import * as runtime from "./index.js";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const web = fileURLToPath(new URL("../../../apps/web/", import.meta.url));

async function renderedDependencies(entry: string): Promise<ReadonlySet<string>> {
  const result = await build({
    absWorkingDir: root,
    stdin: { contents: `export * from ${JSON.stringify(entry)};`, resolveDir: web },
    bundle: true,
    platform: "browser",
    format: "esm",
    write: false,
    metafile: true,
    logLevel: "silent",
  });
  return new Set(Object.values(result.metafile!.outputs).flatMap((output) =>
    Object.entries(output.inputs).filter(([, input]) => input.bytesInOutput > 0).map(([path]) => path),
  ));
}

describe("browser runtime dependency boundary", () => {
  it("re-exports the original implementations, rather than parallel client logic", () => {
    for (const [name, value] of Object.entries(client)) {
      expect(value, name).toBe((runtime as Record<string, unknown>)[name]);
    }
    expect(client).not.toHaveProperty("CAPABILITY_REGISTRY");
    expect(client).not.toHaveProperty("CAPABILITY_DECLARATIONS");
  });

  it("does not render the private capability catalogue or its startup checks", async () => {
    const dependencies = await renderedDependencies("@chess-tabiya/runtime/client");
    expect([...dependencies].filter((path) => path.includes("/capability/registry.ts") || path.includes("/capability/declarations.generated.ts"))).toEqual([]);
    // Client module queries still require real semantic qualification and value admission.
    expect(dependencies.has("packages/runtime/src/semantic-validation-registry.ts")).toBe(true);
    expect(dependencies.has("packages/runtime/src/semantic-validation-profiles.json")).toBe(true);
    expect(dependencies.has("packages/runtime/src/evidence-contract.ts")).toBe(true);
  });

  it("retains the server entry's full catalogue and module-load validation", async () => {
    const dependencies = await renderedDependencies("@chess-tabiya/runtime");
    expect(dependencies.has("packages/runtime/src/capability/registry.ts")).toBe(true);
    expect(dependencies.has("packages/runtime/src/capability/declarations.generated.ts")).toBe(true);
    expect(runtime.CAPABILITY_REGISTRY.declarations.length).toBeGreaterThan(0);
  });
});
