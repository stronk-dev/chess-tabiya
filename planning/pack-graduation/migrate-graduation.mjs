import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["content/drafts"];
const candidateRoot = "content/candidates";
const resolvedPrefixes = /^(?:RESOLVED|SHAPE ENTRY AUTHORED|ENGINE EVIDENCE NOW RECORDED|REFUTED AND DELETED|PROSE GROUNDING PASS)/iu;
const ownerRuling = "Owner ruling 2026-08-13: only a citable source or mechanical validation that bears on a claim can ground it; no second-party review workflow will exist.";
const ownerRef = "planning/exploration/log.md#L1231";
const noReviewVariants = new Set([
  "There is no pack review workflow in this system and there never will be one (owner ruling 2026-08-13). No reviewer has looked at this file and none will; nothing here is labelled as checked, and every blocker below is cleared by a citation or by mechanical evidence or not at all.",
  "There is no pack review workflow in this system and there never will be one (owner ruling 2026-08-13). No sign-off will ever clear a blocker below; a citable source or mechanical validation that bears on the claim are the only two things that will.",
  "There is no pack review workflow in this system and there never will be one (owner ruling 2026-08-13). Nothing in this file has been checked by a second party, nothing here is labelled as checked, and no sign-off will ever clear a blocker below. The only two things that clear one are a citable source or mechanical validation that actually bears on the claim.",
  "There is no pack review workflow in this system and there never will be one (owner ruling 2026-08-13). Only a citable source or mechanical validation that bears on a claim clears a blocker.",
  "There is no pack review workflow in this system and there never will be one (owner ruling 2026-08-13). Only a citable source or mechanical validation that bears on the claim clears a blocker.",
  "There is no pack review workflow in this system and there never will be one (owner ruling 2026-08-13). The only two things that clear a blocker are a citable source or mechanical validation that actually bears on the claim.",
  "There is no pack review workflow in this system and there never will be one (owner ruling 2026-08-13); only a citable source or mechanical validation that bears on a claim clears a blocker.",
]);

function canonical(value) {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 56) || "graduation-condition";
}

function templateId(statement) {
  if (statement === "objective.summary is the emitter's mechanical placeholder; an author must replace it with this pack's actual teaching objective before reviewStatus leaves draft") return "mechanical-objective-placeholder";
  if (statement.startsWith("opponent mode ")) return "opponent-policy-authored";
  if (statement.startsWith("Exact tablebase grading is available")) return "tablebase-opponent-not-selected";
  if (statement.startsWith("The objective transitions on reaching")) return "outcome-ungraded";
  if (statement.startsWith("The start position is whatever")) return "start-assessment-absent";
  if (statement.startsWith("targetElo clamp")) return "target-elo-authored";
  if (statement.startsWith("No authored plan")) return "authored-teaching-absent";
  return slug(statement);
}

function migrated(statement, candidate) {
  if (candidate) return { id: templateId(statement), state: "blocking", statement };
  if (/There is no pack review workflow in this system and there never will be one/iu.test(statement)) {
    if (!noReviewVariants.has(statement)) throw new Error(`Unattested no-review-workflow variant: ${statement}`);
    return { id: "no-review-workflow", state: "accepted", statement, accepted: { kind: "owner_ruling", ruling: ownerRuling, rulingRef: ownerRef } };
  }
  if (/published only where a tablebase provider is configured/iu.test(statement)) {
    return { id: "tablebase-provider-availability", state: "accepted", statement, accepted: { kind: "permanent_property", ruling: "The runtime can offer perfect tablebase resistance only where a Syzygy provider is configured.", rulingRef: "docs/tablebase-grounding.md" } };
  }
  if (/holds eleven pieces[\s\S]*Syzygy tops out at seven/iu.test(statement)) {
    return { id: "outside-tablebase-range", state: "accepted", statement, accepted: { kind: "permanent_property", ruling: "An eleven-piece root is outside Syzygy's seven-piece boundary.", rulingRef: "docs/tablebase-grounding.md" } };
  }
  if (resolvedPrefixes.test(statement)) {
    return { id: templateId(statement), state: "resolved", statement, resolved: { at: /20\d\d-\d\d-\d\d/u.exec(statement)?.[0] ?? "2026-08-16", by: "The recorded work was completed; the original statement remains as history." } };
  }
  return { id: templateId(statement), state: "blocking", statement };
}

async function migrateFile(path, candidate) {
  const document = JSON.parse(await readFile(path, "utf8"));
  const provenance = document.provenance ?? {};
  delete provenance.reviewers;
  const used = new Map();
  provenance.graduationBlockers = (provenance.graduationBlockers ?? []).map((entry) => {
    const next = typeof entry === "string" ? migrated(entry, candidate) : entry;
    const count = (used.get(next.id) ?? 0) + 1;
    used.set(next.id, count);
    return count === 1 ? next : { ...next, id: `${next.id}-${count}` };
  });
  document.provenance = provenance;
  await writeFile(path, `${JSON.stringify(document, null, 2)}\n`);
  const evidence = path.endsWith("/pack.json") ? join(path, "..", "evidence.json") : path.replace(/\.json$/u, ".evidence.json");
  try {
    const ledger = JSON.parse(await readFile(evidence, "utf8"));
    ledger.packDigest = `sha256:${createHash("sha256").update(canonical(document)).digest("hex")}`;
    await writeFile(evidence, `${canonical(ledger)}\n`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return provenance.graduationBlockers;
}

const totals = { drafts: { documents: 0, blocking: 0, resolved: 0, accepted: 0 }, candidates: { documents: 0, blocking: 0, resolved: 0, accepted: 0 } };
for (const root of roots) for (const name of (await readdir(root)).filter((name) => name.endsWith(".json") && !/\.(?:evidence|job|sources)\.json$/u.test(name)).sort()) {
  const entries = await migrateFile(join(root, name), false); totals.drafts.documents += 1; for (const entry of entries) totals.drafts[entry.state] += 1;
}
for (const name of (await readdir(candidateRoot)).sort()) {
  const path = join(candidateRoot, name, "pack.json");
  try { const entries = await migrateFile(path, true); totals.candidates.documents += 1; for (const entry of entries) totals.candidates[entry.state] += 1; }
  catch (error) { if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error; }
}
console.log(JSON.stringify(totals));
