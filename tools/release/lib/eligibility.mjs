// rfc/verifiable-runtime-distribution.md §3/§4 — release-tag eligibility and the D1 rights gate.
// A tag is eligible only when it names a semver release, points at a commit on main whose required
// `verify` and `browser` workflows concluded green for that exact SHA, and — for a 1.0-class
// (non-prerelease) version — the Maia weight rights (D1) are resolved. A prerelease without D1 is a
// core-only technical preview: maia-cpu is not built or published.

export const REQUIRED_WORKFLOWS = Object.freeze(["verify.yml", "browser.yml"]);

export function parseReleaseTag(tag) {
  const match = /^v(?<version>(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?)$/u.exec(tag ?? "");
  if (match === null) throw new TypeError(`release tag ${tag} is not v<semver>`);
  return { version: match.groups.version, prerelease: match.groups.version.includes("-") };
}

/** D1: the weight gate. Returns whether maia-cpu may be built/published for this version. */
export function rightsGate({ prerelease, weightResolved }) {
  if (weightResolved) return { maia: true };
  if (!prerelease) throw new TypeError("D1 unresolved: a 1.0-class release requires an explicit licence for the exact Maia weight bytes");
  return { maia: false };
}

/**
 * Checks the tagged SHA against main and the required green workflow runs. `api(path)` resolves a
 * GitHub REST path to parsed JSON; `onMain(sha)` answers ancestry against origin/main.
 */
export async function tagEligibility({ sha, repository, api, onMain }) {
  const findings = [];
  if (!/^[0-9a-f]{40}$/u.test(sha)) findings.push("tag does not resolve to a full commit SHA");
  if (!(await onMain(sha))) findings.push(`${sha} is not on main`);
  for (const workflow of REQUIRED_WORKFLOWS) {
    const runs = await api(`/repos/${repository}/actions/workflows/${workflow}/runs?head_sha=${sha}&branch=main&event=push&per_page=20`);
    const green = (runs.workflow_runs ?? []).some((run) => run.head_sha === sha && run.status === "completed" && run.conclusion === "success");
    if (!green) findings.push(`${workflow} has no successful main push run for ${sha}`);
  }
  return findings;
}
