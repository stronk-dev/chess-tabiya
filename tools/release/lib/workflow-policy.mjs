// rfc/verifiable-runtime-distribution.md §3 — workflow authority and isolation.
//
// 1. Every non-local `uses:` is a full 40-hex commit SHA with a same-line `# vX[.Y[.Z]]` comment.
// 2. Workflow-level permissions are empty or read-only; write scopes exist only in jobs of the
//    tag-only release workflow, and every such job runs after the verification job.
// 3. No pull-request-triggered workflow holds package, release, OIDC or attestation write authority,
//    and no workflow uses the privileged `pull_request_target` / `workflow_run` triggers.
//
// The parser reads the indentation outline GitHub workflow files use; it is deliberately strict
// about what it recognises and reports anything it cannot classify.

const USES = /^\s*-?\s*uses:\s*(?<ref>[^\s#]+)\s*(?:#\s*(?<comment>.*))?$/u;
const PINNED = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+@(?<sha>[0-9a-f]{40})$/u;
const VERSION_COMMENT = /^v\d+(?:\.\d+){0,2}(?:[-+][0-9A-Za-z.-]+)?$/u;
const WRITE_SCOPES = new Set(["contents", "packages", "id-token", "attestations", "actions", "checks", "deployments", "issues", "pull-requests", "security-events", "statuses", "pages", "discussions", "repository-projects"]);

export function actionReferenceFindings(text, file = "workflow") {
  const findings = [];
  text.split(/\r?\n/u).forEach((line, index) => {
    const match = USES.exec(line);
    if (match === null) return;
    const { ref, comment } = match.groups;
    if (ref.startsWith("./")) return;
    if (ref.startsWith("docker://")) {
      if (!/@sha256:[0-9a-f]{64}$/u.test(ref)) findings.push(`${file}:${index + 1}: docker action ${ref} must be digest-pinned`);
      return;
    }
    if (!PINNED.test(ref)) {
      findings.push(`${file}:${index + 1}: ${ref} is not pinned to a full 40-character commit SHA`);
      return;
    }
    if (comment === undefined || !VERSION_COMMENT.test(comment.trim())) findings.push(`${file}:${index + 1}: ${ref} lacks a same-line reviewed version comment (# vX.Y.Z)`);
  });
  return findings;
}

function indentOf(line) {
  return line.length - line.trimStart().length;
}

function parseScalarMap(lines, start, baseIndent) {
  const map = {};
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === "" || line.trim().startsWith("#")) { index += 1; continue; }
    if (indentOf(line) <= baseIndent) break;
    const match = /^\s*([A-Za-z0-9_-]+):\s*(.*?)\s*(?:#.*)?$/u.exec(line);
    if (match !== null && indentOf(line) === baseIndent + 2) map[match[1]] = match[2];
    index += 1;
  }
  return map;
}

function parsePermissions(value, lines, index, indent) {
  const inline = value.trim();
  if (inline === "{}") return {};
  if (inline === "read-all") return { "*": "read" };
  if (inline === "write-all") return { "*": "write" };
  if (inline.startsWith("{")) {
    return Object.fromEntries(inline.slice(1, -1).split(",").map((pair) => pair.split(":").map((part) => part.trim())).filter((pair) => pair.length === 2));
  }
  return parseScalarMap(lines, index + 1, indent);
}

/** A structural outline: triggers, workflow permissions, jobs (permissions, needs, if). */
export function outlineWorkflow(text) {
  const lines = text.split(/\r?\n/u);
  const outline = { triggers: [], tagOnlyPush: false, permissions: undefined, jobs: {} };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (indentOf(line) !== 0) continue;
    const top = /^([A-Za-z0-9_"'-]+):\s*(.*)$/u.exec(line);
    if (top === null) continue;
    const key = top[1].replaceAll(/["']/gu, "");
    if (key === "on" || key === "true") {
      if (top[2].trim() !== "") {
        outline.triggers = top[2].replaceAll(/[[\]\s]/gu, "").split(",").filter(Boolean);
      } else {
        const events = parseScalarMap(lines, index + 1, 0);
        outline.triggers = Object.keys(events);
        const push = lines.slice(index + 1).findIndex((candidate) => /^ {2}push:\s*$/u.test(candidate));
        if (push >= 0) {
          const pushMap = parseScalarMap(lines, index + 2 + push, 2);
          outline.tagOnlyPush = "tags" in pushMap && !("branches" in pushMap);
        }
      }
    }
    if (key === "permissions") outline.permissions = parsePermissions(top[2], lines, index, 0);
    if (key === "jobs") {
      for (let job = index + 1; job < lines.length && (lines[job].trim() === "" || indentOf(lines[job]) > 0); job += 1) {
        const jobMatch = /^ {2}([A-Za-z0-9_-]+):\s*$/u.exec(lines[job]);
        if (jobMatch === null) continue;
        const name = jobMatch[1];
        const record = { permissions: undefined, needs: [], if: undefined };
        for (let field = job + 1; field < lines.length && (lines[field].trim() === "" || indentOf(lines[field]) > 2); field += 1) {
          const fieldMatch = /^ {4}([A-Za-z0-9_-]+):\s*(.*)$/u.exec(lines[field]);
          if (fieldMatch === null) continue;
          if (fieldMatch[1] === "permissions") record.permissions = parsePermissions(fieldMatch[2], lines, field, 4);
          if (fieldMatch[1] === "needs") {
            const value = fieldMatch[2].trim();
            record.needs = value.startsWith("[") ? value.slice(1, -1).split(",").map((item) => item.trim()).filter(Boolean) : [value];
          }
          if (fieldMatch[1] === "if") record.if = fieldMatch[2].trim();
        }
        outline.jobs[name] = record;
      }
    }
  }
  return outline;
}

function writes(permissions = {}) {
  return Object.entries(permissions).filter(([scope, level]) => level === "write" && (scope === "*" || WRITE_SCOPES.has(scope))).map(([scope]) => scope);
}

function ancestors(outline, job, seen = new Set()) {
  for (const need of outline.jobs[job]?.needs ?? []) {
    if (seen.has(need)) continue;
    seen.add(need);
    ancestors(outline, need, seen);
  }
  return seen;
}

/**
 * Permission findings for one workflow. `verificationJob` names the job every privileged job must
 * (transitively) need in the release workflow.
 */
export function permissionFindings(text, file = "workflow", { verificationJob = "verify" } = {}) {
  const findings = [];
  const outline = outlineWorkflow(text);
  for (const trigger of outline.triggers) {
    if (trigger === "pull_request_target" || trigger === "workflow_run") findings.push(`${file}: privileged trigger ${trigger} is refused`);
  }
  if (outline.permissions === undefined) findings.push(`${file}: workflow-level permissions must be declared ({} or contents: read)`);
  const topWrites = writes(outline.permissions);
  if (topWrites.length > 0) findings.push(`${file}: workflow-level permissions grant write (${topWrites.join(", ")}); write authority is job-local`);
  const pullRequest = outline.triggers.includes("pull_request");
  for (const [name, job] of Object.entries(outline.jobs)) {
    const jobWrites = writes(job.permissions);
    if (jobWrites.length === 0) continue;
    if (pullRequest || !outline.tagOnlyPush || outline.triggers.some((trigger) => trigger !== "push")) {
      findings.push(`${file}: job ${name} holds ${jobWrites.join(", ")} write in a workflow that is not tag-push only`);
      continue;
    }
    if (!ancestors(outline, name).has(verificationJob)) findings.push(`${file}: privileged job ${name} does not run after ${verificationJob}`);
  }
  for (const [name, job] of Object.entries(outline.jobs)) {
    if (job.permissions === undefined && outline.permissions !== undefined && Object.keys(outline.permissions).length === 0 && Object.keys(outline.jobs).length > 0 && file.endsWith("release.yml")) {
      findings.push(`${file}: job ${name} must declare its own least-privilege permissions`);
    }
  }
  return findings;
}
