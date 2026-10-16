import { execFile } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { build, type Plugin } from "esbuild";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";
import { CHESS_OPENINGS_COMMIT, OPENING_CATALOGUE_COMPILER_FILES, OPENING_CATALOGUE_FILES, compileRuntimeOpeningCatalogue, type OpeningCatalogueSourceInput } from "./opening-catalogue.js";

const execute = promisify(execFile), root = process.cwd();
const registrationRelative = "packages/runtime/src/opening-catalogue-registration.json";
const artifactRelative = "apps/server/artifacts/runtime-opening-catalogue.json";
const pinnedJson = (contents: () => Promise<string>): Plugin => ({
  name: "actual-installed-json", setup(builder) {
    builder.onLoad({ filter: /[/\\]opening-catalogue-registration\.json$/ }, async () => ({ contents: await contents(), loader: "json" }));
  },
});

async function admissionProbe(pin: () => Promise<string>): Promise<string> {
  const result = await build({ stdin: { contents: `import {readFileSync} from "node:fs";
    import {admitInstalledOpeningCatalogue} from ${JSON.stringify(resolve(root, "packages/runtime/src/opening-catalogue.ts"))};
    const value=admitInstalledOpeningCatalogue(JSON.parse(readFileSync(process.argv[1],"utf8")));
    console.log(JSON.stringify(value.kind==="available"?{kind:value.kind,ref:value.source.ref}:value));`, resolveDir: root },
    bundle: true, platform: "node", format: "esm", write: false, logLevel: "silent", plugins: [pinnedJson(pin)] });
  return result.outputFiles[0]!.text;
}
async function runProbe(code: string, artifact: string) {
  const result = await execute(process.execPath, ["--input-type=module", "-e", code, artifact]);
  return JSON.parse(result.stdout.trim()) as { kind: string; reason?: string; ref?: { artifactDigest: string } };
}

describe("the ordinary opening catalogue rebuild", () => {
  it("the actual Make plan generates both outputs before bundling the runnable applications", async () => {
    const result = await execute("make", ["-n", "opening-catalogue"], { cwd: root });
    const lines = result.stdout.split("\n"), generator = lines.findIndex(line => /node .*apps\/server\/dist\/opening-catalogue-build\.js$/u.test(line));
    const generatorBundle = lines.findIndex(line => line.includes("esbuild apps/server/src/opening-catalogue-build.ts --bundle"));
    const applicationBundle = lines.findIndex(line => line.trim() === "pnpm build");
    expect(generatorBundle).toBeGreaterThanOrEqual(0); expect(generator).toBeGreaterThan(generatorBundle);
    expect(applicationBundle).toBeGreaterThan(generator);
  });

  it("rebuilds from a stale installed pin, then fresh bundled production admission accepts exactly the generated artifact", async () => {
    const directory = await mkdtemp(join(tmpdir(), "tabiya-installed-opening-rebuild-"));
    try {
      const copy = async (relative: string) => { const destination = join(directory, relative); await mkdir(dirname(destination), { recursive: true }); await cp(resolve(root, relative), destination); };
      await Promise.all([...OPENING_CATALOGUE_COMPILER_FILES, ...OPENING_CATALOGUE_FILES.map(name => `vendor/chess-openings/${CHESS_OPENINGS_COMMIT}/${name}`),
        "tools/d894-opening-runtime-harness/README.md", "tools/knowledge-retrieval-harness/prepare.mjs",
        "planning/platform-alignment/knowledge-retrieval/source-register.csv", artifactRelative].map(copy));
      expect(OPENING_CATALOGUE_COMPILER_FILES.some(file => file === registrationRelative as string)).toBe(false);
      const stale = JSON.stringify({ ...JSON.parse(await readFile(resolve(root, registrationRelative), "utf8")), artifactDigest: `sha256:${"0".repeat(64)}` });
      const staleProbe = await admissionProbe(async () => stale), artifact = join(directory, artifactRelative);
      expect(await runProbe(staleProbe, artifact)).toEqual({ kind: "unavailable", reason: "digest_mismatch" });

      // This is the real generator with an intentionally stale embedded package pin. It must
      // compile structurally, never ask that old pin to approve its own replacement.
      const generated = await build({ entryPoints: [resolve(root, "apps/server/src/opening-catalogue-build.ts")], bundle: true,
        platform: "node", format: "esm", write: false, logLevel: "silent", plugins: [pinnedJson(async () => stale)] });
      const generator = join(directory, "generator.mjs"); await writeFile(generator, generated.outputFiles[0]!.text, "utf8");
      await execute(process.execPath, [generator], { cwd: directory });
      const registrationPath = join(directory, registrationRelative), registration = JSON.parse(await readFile(registrationPath, "utf8"));
      const compiled = JSON.parse(await readFile(artifact, "utf8")); expect(registration.artifactDigest).toBe(compiled.digest);
      expect(registration.schemaVersion).toBe("1"); expect(registration.sourceId).toBe(compiled.source.id);
      const freshProbe = await admissionProbe(() => readFile(registrationPath, "utf8"));
      expect(await runProbe(freshProbe, artifact)).toEqual({ kind: "available", ref: { sourceId: compiled.source.id, commit: compiled.source.commit, artifactDigest: compiled.digest } });
      expect(await runProbe(staleProbe, artifact)).toEqual({ kind: "unavailable", reason: "digest_mismatch" });
      await execute(process.execPath, [generator, "--check"], { cwd: directory });
      await writeFile(registrationPath, stale, "utf8");
      await expect(execute(process.execPath, [generator, "--check"], { cwd: directory })).rejects.toThrow(/Installed opening registration is stale/u);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});

const ROOT = new URL("../../../", import.meta.url).pathname;

function semanticFixture(): { readonly sources: readonly OpeningCatalogueSourceInput[]; readonly compilers: readonly { readonly path: string; readonly bytes: Uint8Array }[] } {
  const rows = Object.freeze({
    "a.tsv": "A00\tAmar Opening\t1. Nh3",
    "b.tsv": "B00\tKing's Pawn Game\t1. e4",
    "c.tsv": "A40\tQueen's Pawn Game\t1. d4",
    "d.tsv": "A10\tEnglish Opening\t1. c4",
    "e.tsv": "A04\tZukertort Opening\t1. Nf3",
  } as const);
  const sources = OPENING_CATALOGUE_FILES.map((name) => Object.freeze({
    name,
    bytes: Buffer.from(`eco\tname\tpgn\n${rows[name]}\n`),
  }));
  const compilers = OPENING_CATALOGUE_COMPILER_FILES.map((path) => Object.freeze({
    path,
    bytes: Buffer.from(`fixture:${path}`),
  }));
  return Object.freeze({ sources: Object.freeze(sources), compilers: Object.freeze(compilers) });
}

describe("runtime opening catalogue compiler", () => {
  it("is deterministic across enumeration order and changes its digest when source meaning changes", () => {
    const value = semanticFixture();
    const first = compileRuntimeOpeningCatalogue(value.sources, value.compilers);
    const shuffled = compileRuntimeOpeningCatalogue([...value.sources].reverse(), [...value.compilers].reverse());
    expect(canonicalizeJson(shuffled)).toBe(canonicalizeJson(first));
    expect(first.namedEndpoints).toHaveLength(5);
    const renamed = value.sources.map((source) => source.name === "a.tsv"
      ? Object.freeze({ ...source, bytes: Buffer.from(Buffer.from(source.bytes).toString("utf8").replace("Amar Opening\t", "Amar Opening renamed\t")) })
      : source);
    expect(compileRuntimeOpeningCatalogue(renamed, value.compilers).digest).not.toBe(first.digest);
  });

  it("refuses malformed rows, duplicate endpoints, missing files and undeclared compiler helpers", () => {
    const value = semanticFixture();
    const malformed = value.sources.map((source) => source.name === "a.tsv" ? Object.freeze({ ...source, bytes: Buffer.from("wrong header\n") }) : source);
    expect(() => compileRuntimeOpeningCatalogue(malformed, value.compilers)).toThrow(/TSV header/);
    const duplicate = value.sources.map((source) => source.name === "e.tsv" ? Object.freeze({ ...source, bytes: Buffer.concat([Buffer.from(source.bytes), Buffer.from("A00\tDuplicate Amar\t1. Nh3\n")]) }) : source);
    expect(() => compileRuntimeOpeningCatalogue(duplicate, value.compilers)).toThrow(/Duplicate named opening endpoint/);
    expect(() => compileRuntimeOpeningCatalogue(value.sources.slice(1), value.compilers)).toThrow(/exactly a.tsv through e.tsv/);
    expect(() => compileRuntimeOpeningCatalogue(value.sources, value.compilers.slice(1))).toThrow(/source closure mismatch/);
  });

  it("reuses the one opening TSV and PGN parser instead of carrying a compiler copy", async () => {
    const source = await Promise.all([
      readFile(resolve(ROOT, "apps/server/src/sourcing/openings.ts"), "utf8"),
      readFile(resolve(ROOT, "apps/server/src/opening-catalogue.ts"), "utf8"),
      readFile(resolve(ROOT, "apps/server/src/opening-catalogue-build.ts"), "utf8"),
    ]);
    expect(source.join("\n").match(/function parseRows\s*\(/g)).toHaveLength(1);
    expect(source.join("\n").match(/function normalizeOpeningPgn\s*\(/g)).toHaveLength(1);
    expect(source[1]).not.toContain("parsePgn(");
    expect(source[2]).not.toContain("parsePgn(");
    expect(`${source[1]}\n${source[2]}`).not.toMatch(/\b(?:embedding|semantic similarity|full[- ]text|llm)\b/i);
  });
});
