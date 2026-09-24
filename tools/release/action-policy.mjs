#!/usr/bin/env node
// rfc/verifiable-runtime-distribution.md §3 governance check over .github/workflows/**:
// full-SHA action pins with reviewed version comments and job-local least privilege.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { repoPath } from "./lib/common.mjs";
import { actionReferenceFindings, permissionFindings } from "./lib/workflow-policy.mjs";

export function workflowFindings(directory = repoPath(".github/workflows")) {
  return readdirSync(directory).filter((name) => /\.ya?ml$/u.test(name)).sort().flatMap((name) => {
    const text = readFileSync(join(directory, name), "utf8");
    const file = `.github/workflows/${name}`;
    return [...actionReferenceFindings(text, file), ...permissionFindings(text, file)];
  });
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  const findings = workflowFindings();
  if (findings.length > 0) {
    console.error(`action policy failed:\n- ${findings.join("\n- ")}`);
    process.exit(1);
  }
  console.log("action policy: every workflow action is a reviewed full-SHA pin; write authority is job-local and post-verification");
}
