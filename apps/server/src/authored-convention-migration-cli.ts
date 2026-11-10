import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, realpath, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { authoredConventionMigrationReport } from "./authored-convention-migration.js";

function inside(directory: string, file: string): boolean {
  const path = relative(directory, file);
  return path !== "" && path !== ".." && !path.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(path);
}
function options(argv: readonly string[]) {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]!, value = argv[index+1];
    if (!["--corpus", "--shapes", "--out"].includes(key) || values.has(key) || value === undefined || value.startsWith("--") || value.length === 0) throw new TypeError("Usage: --corpus <roots> --shapes <directory> [--out <ignored-cache-or-temp-file>]");
    values.set(key, value);
  }
  const roots = (values.get("--corpus") ?? "content/drafts,content/packs").split(",").filter(Boolean).map(path => resolve(path));
  const shapeRoot = resolve(values.get("--shapes") ?? "content/shapes"), output = values.get("--out");
  const out = output === undefined ? undefined : resolve(output);
  if (out !== undefined && (![resolve(".cache"), resolve(tmpdir())].some(directory => inside(directory, out)) || [...roots, shapeRoot].some(directory => inside(directory, out) || directory === out))) throw new TypeError("Report output must be in ignored .cache or temporary storage, outside every input directory");
  return { roots, shapeRoot, out };
}

/** Resolve existing ancestors before creating directories; aliases cannot enter input trees. */
async function prospectivePath(file: string): Promise<string> {
  let ancestor = resolve(file);
  const suffix: string[] = [];
  for (;;) {
    try { return resolve(await realpath(ancestor), ...suffix); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT" || dirname(ancestor) === ancestor) throw error;
      suffix.unshift(basename(ancestor)); ancestor = dirname(ancestor);
    }
  }
}
async function checkedOutput(parsed: ReturnType<typeof options>): Promise<string | undefined> {
  if (parsed.out === undefined) return undefined;
  try { if ((await lstat(parsed.out)).isSymbolicLink()) throw new TypeError("Report output cannot be a symbolic link"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const output = resolve(await prospectivePath(dirname(parsed.out)), basename(parsed.out));
  const allowed = await Promise.all([resolve(".cache"), tmpdir()].map(prospectivePath));
  const inputs = await Promise.all([...parsed.roots, parsed.shapeRoot].map(prospectivePath));
  if (!allowed.some(directory => inside(directory, output)) || inputs.some(directory => directory === output || inside(directory, output))) throw new TypeError("Resolved report output enters an input directory or leaves cache/temp storage");
  return output;
}
async function writeReport(output: string, contents: string): Promise<void> {
  await mkdir(dirname(output), { recursive: true });
  const temporary = resolve(dirname(output), `.${basename(output)}-${randomUUID()}.tmp`);
  const handle = await open(temporary, "wx", 0o600);
  try {
    try { await handle.writeFile(contents, "utf8"); } finally { await handle.close(); }
    // Replacing an output hard link/symlink cannot truncate its input-file target.
    await rename(temporary, output);
  } finally { await rm(temporary, { force: true }); }
}

export async function runAuthoredConventionMigrationCLI(argv: readonly string[]): Promise<number> {
  try {
    const parsed = options(argv), output = await checkedOutput(parsed);
    const report = await authoredConventionMigrationReport(parsed);
    const lines = [`Authored convention comparison: ${report.sites.length} literal sites, ${report.population.affectedDocuments} affected documents, ${report.population.positions} position occurrences.`];
    lines.push("Each row changes one ref. Counts compare matched booleans; joint migration effects remain unmeasured.");
    for (const row of report.sites) {
      lines.push(row.status === "blocked" ? `BLOCKED ${row.site.file}#${row.site.pointer}: ${row.reason}`
        : `${row.site.family} ${row.site.file}#${row.site.pointer}: literal ${row.literal.changed}/${row.literal.paired} changed, ${row.literal.cases-row.literal.paired} unpaired; containing condition ${row.context.changed}/${row.context.paired} changed, ${row.context.cases-row.context.paired} unpaired.`);
    }
    lines.push(`${report.comparisonComplete ? "Comparison complete" : "Comparison incomplete"}; author review pending.`);
    if (report.population.replay.omittedPositions > 0) lines.push(`Spine replay omitted ${report.population.replay.omittedPositions}/${report.population.replay.expectedPositions} authored position occurrences.`);
    if (!report.population.matches) lines.push(`Initial36-site population differs: ${report.population.missingSites.length} missing, ${report.population.additionalSites.length} additional addresses.`);
    if (output !== undefined) {
      if (await checkedOutput(parsed) !== output) throw new TypeError("Report output location changed during comparison");
      await writeReport(output, `${canonicalizeJson(report)}\n`);
      lines.push(`Report: ${output}`);
    }
    process.stdout.write(`${lines.join("\n")}\n`);
    return report.comparisonComplete ? 0 : 1;
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); return 2; }
}

if (process.argv[1]?.endsWith("authored-convention-migration-cli.js")) process.exitCode = await runAuthoredConventionMigrationCLI(process.argv.slice(2));
