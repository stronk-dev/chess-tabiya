#!/usr/bin/env node
// Release workflow job `eligibility` (CI only; reads the GitHub API with a read-only token).
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { parseReleaseTag, rightsGate, tagEligibility } from "./lib/eligibility.mjs";
import { maiaWeightResolved } from "./lib/maia.mjs";

const { values } = parseArgs({ options: { tag: { type: "string" }, sha: { type: "string" }, repository: { type: "string" }, "github-output": { type: "string" } } });
const { version, prerelease } = parseReleaseTag(values.tag);
const api = async (path) => {
  const response = await fetch(`https://api.github.com${path}`, { headers: { accept: "application/vnd.github+json", authorization: `Bearer ${process.env.GH_TOKEN}` } });
  if (!response.ok) throw new Error(`GitHub API ${path} returned ${response.status}`);
  return response.json();
};
const onMain = async (sha) => {
  execFileSync("git", ["fetch", "--no-tags", "origin", "main"], { stdio: "inherit" });
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", sha, "origin/main"]);
    return true;
  } catch {
    return false;
  }
};
const findings = await tagEligibility({ sha: values.sha, repository: values.repository, api, onMain });
if (findings.length > 0) {
  console.error(`release tag is not eligible:\n- ${findings.join("\n- ")}`);
  process.exit(1);
}
const { maia } = rightsGate({ prerelease, weightResolved: maiaWeightResolved() });
if (values["github-output"] !== undefined) appendFileSync(values["github-output"], `version=${version}\nprerelease=${prerelease}\nmaia=${maia}\n`);
console.log(`eligible: v${version}${prerelease ? " (prerelease)" : ""}; maia-cpu ${maia ? "included" : "withheld (D1 unresolved: core-only technical preview)"}`);
