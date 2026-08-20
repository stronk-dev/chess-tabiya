// DISPOSABLE research instrument — platform-alignment R6 / D560 / Gate F.
// It reads Git objects and writes only this directory's output.json.
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "../../apps/server/node_modules/ajv/dist/2020.js";
import addFormats from "../../apps/server/node_modules/ajv-formats/dist/index.js";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const output = new URL("./output.json", import.meta.url);

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    ...options,
  }).trimEnd();
}

function gitMaybe(args) {
  try { return git(args, { stdio: ["ignore", "pipe", "ignore"] }); }
  catch { return undefined; }
}

function at(ref, path) {
  return gitMaybe(["show", `${ref}:${path}`]);
}

function parseJson(text) {
  try { return { valid: true, value: JSON.parse(text) }; }
  catch (error) { return { valid: false, error: error instanceof Error ? error.message : String(error) }; }
}

function compile(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

function packLike(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    typeof value.id === "string" && typeof value.version === "string" &&
    value.start !== undefined && value.objective !== undefined && value.opponentPolicy !== undefined;
}

function packPaths(ref) {
  const names = gitMaybe(["ls-tree", "-r", "--name-only", ref, "--", "content/drafts", "content/candidates"]);
  if (names === undefined || names === "") return [];
  const rows = [];
  for (const path of names.split("\n").filter((name) => name.endsWith(".json"))) {
    const text = at(ref, path);
    if (text === undefined) continue;
    const parsed = parseJson(text);
    if (parsed.valid && packLike(parsed.value)) rows.push({ path, document: parsed.value });
  }
  return rows;
}

function validationSummary(validate, rows) {
  const failures = [];
  let valid = 0;
  for (const row of rows) {
    if (validate(row.document)) valid += 1;
    else if (failures.length < 12) {
      failures.push({
        path: row.path,
        errors: (validate.errors ?? []).slice(0, 8).map((error) => ({
          keyword: error.keyword,
          instancePath: error.instancePath,
          schemaPath: error.schemaPath,
        })),
      });
    }
  }
  const invalid = rows.length - valid;
  return { total: rows.length, valid, invalid, failures, failuresOmitted: invalid - failures.length };
}

function versionAt(ref) {
  const source = at(ref, "packages/schema/src/index.ts") ?? "";
  return /DRILL_PACK_SCHEMA_VERSION = "([^"]+)"/.exec(source)?.[1] ?? null;
}

function contentStats(commit) {
  const text = gitMaybe([
    "diff-tree", "--no-commit-id", "--numstat", "-r", commit, "--",
    "content/drafts", "content/shapes", "content/principles", "content/candidates",
  ]) ?? "";
  const rows = text === "" ? [] : text.split("\n").map((line) => line.split("\t"));
  const paths = rows.map((row) => row[2]);
  return {
    files: rows.length,
    added: rows.reduce((sum, row) => sum + (Number(row[0]) || 0), 0),
    deleted: rows.reduce((sum, row) => sum + (Number(row[1]) || 0), 0),
    categories: {
      packDocuments: paths.filter((path) => path?.startsWith("content/drafts/") && !/\.(evidence|sources|job)\.json$/.test(path)).length + paths.filter((path) => path?.endsWith("/pack.json")).length,
      evidenceSidecars: paths.filter((path) => path?.endsWith(".evidence.json")).length,
      sourceSidecars: paths.filter((path) => path?.endsWith(".sources.json")).length,
      jobSidecars: paths.filter((path) => path?.endsWith(".job.json")).length,
      shapes: paths.filter((path) => path?.startsWith("content/shapes/")).length,
      principles: paths.filter((path) => path?.startsWith("content/principles/")).length,
    },
    paths,
  };
}

function visit(value, callback, path = "") {
  callback(value, path);
  if (Array.isArray(value)) value.forEach((entry, index) => visit(entry, callback, `${path}/${index}`));
  else if (value !== null && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) visit(entry, callback, `${path}/${key}`);
  }
}

function capabilityUse(rows) {
  const probes = {
    timingWindows: 0,
    feedbackClaims: 0,
    deviationCost: 0,
    deviationMistake: 0,
    planConsequence: 0,
    transitionFeature: 0,
    engineCondition: 0,
    legShapes: 0,
    legOpponentPolicy: 0,
    variantOf: 0,
    retryVariants: 0,
    statedReasoning: 0,
    prediction: 0,
    shapeReferences: 0,
  };
  const packs = Object.fromEntries(Object.keys(probes).map((key) => [key, new Set()]));
  for (const row of rows) {
    visit(row.document, (value, path) => {
      if (path.endsWith("/timingWindows") && Array.isArray(value)) probes.timingWindows += value.length, packs.timingWindows.add(row.path);
      if (path.endsWith("/feedbackClaims") && Array.isArray(value)) probes.feedbackClaims += value.length, packs.feedbackClaims.add(row.path);
      if (/\/deviations\/\d+\/cost$/.test(path)) probes.deviationCost += 1, packs.deviationCost.add(row.path);
      if (/\/deviations\/\d+\/mistake$/.test(path)) probes.deviationMistake += 1, packs.deviationMistake.add(row.path);
      if (value?.kind === "plan_consequence") probes.planConsequence += 1, packs.planConsequence.add(row.path);
      if (typeof value?.kind === "string" && ["attacked_squares_changed", "defended_squares_changed", "slider_lines_changed", "escape_squares_changed", "defended_duties_changed", "move_irreversibility"].includes(value.kind)) probes.transitionFeature += 1, packs.transitionFeature.add(row.path);
      if (typeof value?.kind === "string" && ["engine_eval_swing", "engine_mate_appears", "tablebase_category_regression", "tablebase_dtz_regression"].includes(value.kind)) probes.engineCondition += 1, packs.engineCondition.add(row.path);
      if (/\/legs\/\d+\/shapes$/.test(path) && Array.isArray(value)) probes.legShapes += value.length, packs.legShapes.add(row.path);
      if (/\/legs\/\d+\/opponentPolicy$/.test(path)) probes.legOpponentPolicy += 1, packs.legOpponentPolicy.add(row.path);
      if (path.endsWith("/variantOf")) probes.variantOf += 1, packs.variantOf.add(row.path);
      if (path.endsWith("/retryVariants") && Array.isArray(value)) probes.retryVariants += value.length, packs.retryVariants.add(row.path);
      if (value?.type === "stated_reasoning") probes.statedReasoning += 1, packs.statedReasoning.add(row.path);
      if (value?.type === "prediction") probes.prediction += 1, packs.prediction.add(row.path);
      if (path.endsWith("/shapes") && Array.isArray(value) && !path.includes("/legs/")) probes.shapeReferences += value.length, packs.shapeReferences.add(row.path);
    });
  }
  return Object.fromEntries(Object.entries(probes).map(([key, occurrences]) => [key, { occurrences, packs: packs[key].size }]));
}

function semanticPopulation(rows) {
  const population = {
    feedbackClaimPrincipleReferences: 0,
    typedGraduationEntries: 0,
    bareGraduationStrings: 0,
  };
  for (const row of rows) {
    for (const claim of row.document.feedbackClaims ?? []) {
      population.feedbackClaimPrincipleReferences += Array.isArray(claim.principles) ? claim.principles.length : 0;
    }
    for (const entry of row.document.provenance?.graduationBlockers ?? []) {
      if (typeof entry === "string") population.bareGraduationStrings += 1;
      else population.typedGraduationEntries += 1;
    }
  }
  return population;
}

const head = git(["rev-parse", "HEAD"]);
const currentSchemaText = await readFile(resolve(root, "schemas/drill_pack.schema.json"), "utf8");
const currentSchemaParsed = parseJson(currentSchemaText);
if (!currentSchemaParsed.valid) throw new TypeError(`current schema is invalid: ${currentSchemaParsed.error}`);
const currentSchema = currentSchemaParsed.value;
const currentValidate = compile(currentSchema);
const currentPacks = packPaths("HEAD");

const log = git(["log", "--reverse", "--format=%H%x09%cI%x09%s", "--", "schemas/drill_pack.schema.json"]);
const mutations = [];
let previousId = null;
for (const line of log.split("\n")) {
  const [commit, committedAt, ...subjectParts] = line.split("\t");
  const subject = subjectParts.join("\t");
  const schemaText = at(commit, "schemas/drill_pack.schema.json");
  const parsed = schemaText === undefined ? { valid: false, error: "schema missing" } : parseJson(schemaText);
  const rawId = /"\$id"\s*:\s*"([^"]+)"/.exec(schemaText ?? "")?.[1] ?? null;
  const id = parsed.valid && typeof parsed.value.$id === "string" ? parsed.value.$id : rawId;
  const historicalPacks = packPaths(commit);
  let oldAgainstCurrent = validationSummary(currentValidate, historicalPacks);
  let currentAgainstHistorical = null;
  let historicalCompileError = null;
  if (parsed.valid) {
    try { currentAgainstHistorical = validationSummary(compile(parsed.value), currentPacks); }
    catch (error) { historicalCompileError = error instanceof Error ? error.message : String(error); }
  }
  mutations.push({
    commit,
    committedAt,
    subject,
    version: versionAt(commit),
    schemaId: id,
    schemaJsonValid: parsed.valid,
    schemaJsonError: parsed.valid ? null : parsed.error,
    sameIdAsPreviousMutation: id !== null && id === previousId,
    contentChanged: contentStats(commit),
    historicalCorpusAgainstCurrent: oldAgainstCurrent,
    currentCorpusAgainstHistorical: currentAgainstHistorical,
    historicalCompileError,
  });
  if (id !== null) previousId = id;
}

const contentCommitCount = new Set((gitMaybe(["log", "--since=2026-08-11", "--format=%H", "--", "content"]) ?? "").split("\n").filter(Boolean)).size;
const packSchemaCommitCount = new Set((gitMaybe(["log", "--since=2026-08-11", "--format=%H", "--", "schemas/drill_pack.schema.json", "packages/schema/src/drill-pack", "packages/schema/src/index.ts", "apps/server/src/pack-validation.ts", "apps/server/src/pack-orchestrator.ts", "apps/server/src/pack-registry.ts"]) ?? "").split("\n").filter(Boolean)).size;

const sidecarNames = (gitMaybe(["ls-tree", "-r", "--name-only", "HEAD", "--", "content"]) ?? "").split("\n").filter((path) => /\.(evidence|sources|job)\.json$/.test(path));
const sidecarSchemas = {};
let claimBindings = 0;
for (const path of sidecarNames) {
  const parsed = parseJson(at("HEAD", path) ?? "");
  const schema = parsed.valid && typeof parsed.value.schema === "string" ? parsed.value.schema : "<missing-or-invalid>";
  sidecarSchemas[schema] = (sidecarSchemas[schema] ?? 0) + 1;
  if (parsed.valid && Array.isArray(parsed.value.claimBindings)) claimBindings += parsed.value.claimBindings.length;
}

const currentValidation = validationSummary(currentValidate, currentPacks);
const report = {
  measuredAt: new Date().toISOString(),
  commit: head,
  current: {
    schemaConstant: versionAt("HEAD"),
    schemaId: currentSchema.$id,
    schemaDescription: currentSchema.description,
    packDocuments: currentPacks.length,
    draftDocuments: currentPacks.filter((row) => row.path.startsWith("content/drafts/")).length,
    candidateDocuments: currentPacks.filter((row) => row.path.startsWith("content/candidates/")).length,
    schemaStampedDocuments: currentPacks.filter((row) => row.document.$schema !== undefined || row.document.schemaVersion !== undefined).length,
    contentVersions: Object.fromEntries([...new Set(currentPacks.map((row) => row.document.version))].sort().map((version) => [version, currentPacks.filter((row) => row.document.version === version).length])),
    validation: currentValidation,
    capabilityUse: capabilityUse(currentPacks),
    semanticPopulation: semanticPopulation(currentPacks),
    sidecarDocuments: sidecarNames.length,
    sidecarSchemas,
    claimBindings,
  },
  history: {
    schemaMutations: mutations.length,
    distinctValidSchemaIds: new Set(mutations.map((row) => row.schemaId).filter(Boolean)).size,
    sameIdMutations: mutations.filter((row) => row.sameIdAsPreviousMutation).map((row) => row.commit),
    invalidSchemaMutations: mutations.filter((row) => !row.schemaJsonValid).map((row) => row.commit),
    contentCommitsSince20260811: contentCommitCount,
    packSchemaSurfaceCommitsSince20260811: packSchemaCommitCount,
    mutations,
  },
};

await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  commit: report.commit.slice(0, 7),
  current: {
    schema: report.current.schemaConstant,
    packs: report.current.packDocuments,
    valid: report.current.validation.valid,
    stamped: report.current.schemaStampedDocuments,
  },
  history: {
    mutations: report.history.schemaMutations,
    ids: report.history.distinctValidSchemaIds,
    sameIdMutations: report.history.sameIdMutations.map((commit) => commit.slice(0, 7)),
    invalid: report.history.invalidSchemaMutations.map((commit) => commit.slice(0, 7)),
  },
}, null, 2));
