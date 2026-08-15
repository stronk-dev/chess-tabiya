import { checkSourcingDirectory, checkSourcingFile } from "./check.js";

export function formatSourcingIssue(issue: { severity: string; path: string; code: string; message: string }): string {
  return `${issue.severity.toUpperCase()} ${issue.path} [${issue.code}] ${issue.message}`;
}

async function main(): Promise<number> {
  const target = process.argv[2];
  const mode = process.argv[3] ?? "directory";
  if (!target) {
    console.error("Usage: make sourcing-check DIR=<candidate-directory> or FILE=<pack.json>");
    return 2;
  }
  const result = mode === "file" ? await checkSourcingFile(target) : await checkSourcingDirectory(target);
  for (const value of result.issues) {
    const line = formatSourcingIssue(value);
    if (value.severity === "error") console.error(line); else console.warn(line);
  }
  if (!result.valid) {
    console.error(`Sourcing check failed: ${target}`);
    return 1;
  }
  console.log(`Sourcing check passed (${result.strict ? "strict" : "audit"}): ${target}`);
  return 0;
}

if (process.argv[1]?.endsWith("sourcing-check.js")) process.exitCode = await main();
