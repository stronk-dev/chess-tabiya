import { checkSourcingDirectory } from "./check.js";

export function formatSourcingIssue(issue: { severity: string; path: string; code: string; message: string }): string {
  return `${issue.severity.toUpperCase()} ${issue.path} [${issue.code}] ${issue.message}`;
}

async function main(): Promise<number> {
  const directory = process.argv[2];
  if (!directory) {
    console.error("Usage: make sourcing-check DIR=<candidate-directory>");
    return 2;
  }
  const result = await checkSourcingDirectory(directory);
  for (const value of result.issues) {
    const line = formatSourcingIssue(value);
    if (value.severity === "error") console.error(line); else console.warn(line);
  }
  if (!result.valid) {
    console.error(`Sourcing check failed: ${directory}`);
    return 1;
  }
  console.log(`Sourcing check passed (${result.strict ? "strict" : "audit"}): ${directory}`);
  return 0;
}

if (process.argv[1]?.endsWith("sourcing-check.js")) process.exitCode = await main();
