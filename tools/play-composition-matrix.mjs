import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const VIEWPORTS = Object.freeze(["1440x900", "1366x768", "1280x720", "768x1024", "430x932", "390x844", "360x680"]);
export const STATES = Object.freeze([
  "01-calm-rest", "02-square-selected", "03-move-staged-cue", "04-post-commit-guard",
  "05-rail-module-expanded", "06-guided-hint-final-stage", "07-menu-popover-open", "08-long-objective",
  "09-evidence-unavailable-honest-empty", "10-inspector-open", "11-timeline-rewind-fork-reentry",
  "12-compare-open", "13-max-load", "14-terminal-outcome", "15-promotion-pending", "16-keyboard-text-entry-active",
]);
export const CELL_NAMES = Object.freeze(VIEWPORTS.flatMap(viewport => STATES.map(state => `play-composition-${viewport}-${state}`)));
const hash = bytes => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const signature = Buffer.from("89504e470d0a1a0a", "hex");
const generatedFiles = new Set(["browser-results.json", ...CELL_NAMES.flatMap(name => [`${name}.png`, `${name}.json`, `${name}.vocabulary.json`])]);

function compositionDirectory(root, create = false) {
  const base = resolve(realpathSync(root), "test-results");
  const output = join(base, "composition");
  for (const directory of [base, output]) {
    if (!existsSync(directory) && create) mkdirSync(directory);
    if (!lstatSync(directory).isDirectory() || realpathSync(directory) !== directory) throw new Error("COMPOSITION_OUTPUT_DIRECTORY_UNSAFE");
  }
  return output;
}

function regularBytes(path) {
  if (!lstatSync(path).isFile()) throw new Error("COMPOSITION_OUTPUT_FILE_UNSAFE");
  return readFileSync(path);
}

function assertRetainedFile(path, digest) {
  if (lstatSync(path, { throwIfNoEntry: false }) !== undefined && hash(regularBytes(path)) !== digest) throw new Error("COMPOSITION_RETAINED_EVIDENCE_CHANGED");
}

/** Only obsolete complete copies made by this writer; never Playwright failures or operator files. */
export function pruneCompositionEvidence(root) {
  const output = compositionDirectory(root);
  const receipt = JSON.parse(regularBytes(join(output, "receipt.json")));
  if (receipt.version !== 1 || !/^sha256:[a-f0-9]{64}$/u.test(receipt.reportDigest) || receipt.requiredCells !== CELL_NAMES.length || receipt.provenCells !== CELL_NAMES.length || !Array.isArray(receipt.cells) || receipt.cells.length !== CELL_NAMES.length) throw new Error("COMPOSITION_CURRENT_RECEIPT_INVALID");
  const current = receipt.reportDigest.slice(7);
  const currentDirectory = join(output, current);
  if (!lstatSync(currentDirectory).isDirectory() || realpathSync(currentDirectory) !== currentDirectory) throw new Error("COMPOSITION_OUTPUT_DIRECTORY_UNSAFE");
  if (hash(regularBytes(join(currentDirectory, "browser-results.json"))) !== receipt.reportDigest) throw new Error("COMPOSITION_CURRENT_RECEIPT_INVALID");
  for (const [index, cell] of receipt.cells.entries()) {
    if (cell.name !== CELL_NAMES[index]) throw new Error("COMPOSITION_CURRENT_RECEIPT_INVALID");
    for (const [record, suffix] of [[cell, ".png"], [cell.conformance, ".json"], [cell.vocabulary, ".vocabulary.json"]]) {
      const path = `test-results/composition/${current}/${cell.name}${suffix}`;
      if (!record || record.path !== path || hash(regularBytes(join(currentDirectory, `${cell.name}${suffix}`))) !== record.digest) throw new Error("COMPOSITION_CURRENT_RECEIPT_INVALID");
    }
  }
  const removed = [];
  for (const entry of readdirSync(output, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === current || !/^[a-f0-9]{64}$/u.test(entry.name)) continue;
    const directory = join(output, entry.name);
    const files = readdirSync(directory, { withFileTypes: true });
    if (files.length !== generatedFiles.size || files.some(file => !file.isFile() || !generatedFiles.has(file.name))) continue;
    if (hash(readFileSync(join(directory, "browser-results.json"))) !== `sha256:${entry.name}`) continue;
    rmSync(directory, { recursive: true });
    removed.push(entry.name);
  }
  return removed;
}

/** Join only this run's successful, unretried real attachments to the complete closed population. */
export function collectCompositionEvidence(report, { root, read = readFileSync, realpath = realpathSync } = {}) {
  if (!report || !Array.isArray(report.suites) || !Array.isArray(report.errors) || report.errors.length !== 0 || report.stats?.unexpected !== 0) throw new Error("COMPOSITION_REPORT_FAILED");
  const allowed = new Set(CELL_NAMES);
  const cells = new Map();
  const conformances = new Map();
  const vocabularies = new Map();
  const evidenceRoot = realpath(resolve(root, "test-results/playwright"));
  function visit(suites) {
    for (const suite of suites) {
      if (!Array.isArray(suite.specs) || (suite.suites !== undefined && !Array.isArray(suite.suites))) throw new Error("COMPOSITION_REPORT_MALFORMED");
      for (const spec of suite.specs) for (const test of spec.tests ?? []) for (const result of test.results ?? []) for (const attachment of result.attachments ?? []) {
        if (typeof attachment.name !== "string") continue;
        const isConformance = attachment.name.startsWith("composition-conformance-play-composition-");
        const isVocabulary = attachment.name.startsWith("composition-vocabulary-play-composition-");
        if (!isConformance && !isVocabulary && !attachment.name.startsWith("play-composition-")) continue;
        const name = isConformance ? attachment.name.slice("composition-conformance-".length) : isVocabulary ? attachment.name.slice("composition-vocabulary-".length) : attachment.name;
        if (!allowed.has(name)) throw new Error(`COMPOSITION_FOREIGN_CELL: ${name}`);
        const population = isConformance ? conformances : isVocabulary ? vocabularies : cells;
        if (population.has(name)) throw new Error(`COMPOSITION_DUPLICATE_CELL: ${name}`);
        if (spec.ok !== true || test.expectedStatus !== "passed" || test.projectName !== "desktop-chromium" || test.results.length !== 1 || result.status !== "passed" || result.retry !== 0) throw new Error(`COMPOSITION_RESULT_NOT_PROVEN: ${name}`);
        const viewport = name.slice("play-composition-".length).split("-")[0];
        const [width, height] = viewport.split("x").map(Number);
        if (isVocabulary) {
          if (attachment.contentType !== "application/json" || typeof attachment.body !== "string" || attachment.path !== undefined) throw new Error(`COMPOSITION_VOCABULARY_ATTACHMENT_INVALID: ${name}`);
          const bytes = Buffer.from(attachment.body, "base64");
          const data = JSON.parse(bytes.toString("utf8"));
          const count = value => Number.isSafeInteger(value) && value >= 0;
          if (data?.version !== 1 || data.cell !== name || data.viewport?.width !== width || data.viewport?.height !== height || !count(data.ordinaryTextNodes) || data.ordinaryTextNodes === 0 || !count(data.inspectorTextNodes) || (name.endsWith("10-inspector-open") && data.inspectorTextNodes === 0) || !Array.isArray(data.leaks) || data.leaks.length !== 0 || !Array.isArray(data.inspectorExamples) || data.inspectorExamples.some(f => !f || !["uci", "evaluation", "producer"].includes(f.kind) || f.inspector !== true || typeof f.text !== "string" || !f.text.trim() || typeof f.element !== "string" || !f.element.trim())) throw new Error(`COMPOSITION_VOCABULARY_NOT_PROVEN: ${name}`);
          vocabularies.set(name, { result, bytes, digest: hash(bytes), data });
          continue;
        }
        if (isConformance) {
          if (attachment.contentType !== "application/json" || typeof attachment.body !== "string" || attachment.path !== undefined) throw new Error(`COMPOSITION_CONFORMANCE_ATTACHMENT_INVALID: ${name}`);
          const bytes = Buffer.from(attachment.body, "base64");
          const data = JSON.parse(bytes.toString("utf8"));
          const count = value => Number.isSafeInteger(value) && value >= 0;
          if (data?.version !== 1 || data.cell !== name || data.viewport?.width !== width || data.viewport?.height !== height || !count(data.controls) || data.controls === 0 || !count(data.boxes) || data.boxes === 0 || !count(data.keyboardProjections) || !count(data.inertControls) || !Array.isArray(data.issues) || data.issues.length !== 0 || !Array.isArray(data.scrollers) || data.scrollers.some(s => typeof s.element !== "string" || !["rail", "strip-x", "seat-card", "sheet-body"].includes(s.family) || s.axes !== (s.family === "strip-x" ? "x" : "y"))) throw new Error(`COMPOSITION_CONFORMANCE_NOT_PROVEN: ${name}`);
          conformances.set(name, { result, bytes, digest: hash(bytes), data });
          continue;
        }
        if (attachment.contentType !== "image/png" || typeof attachment.path !== "string" || attachment.body !== undefined) throw new Error(`COMPOSITION_ATTACHMENT_INVALID: ${name}`);
        const path = realpath(resolve(root, attachment.path));
        const within = relative(evidenceRoot, path);
        if (!within || within === ".." || within.startsWith("../") || isAbsolute(within)) throw new Error(`COMPOSITION_ATTACHMENT_OUTSIDE_RUN: ${name}`);
        const bytes = read(path);
        if (bytes.length < 45 || !bytes.subarray(0, 8).equals(signature) || bytes.readUInt32BE(8) !== 13 || bytes.toString("ascii", 12, 16) !== "IHDR" || bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) !== height || !bytes.subarray(-12).equals(Buffer.from("0000000049454e44ae426082", "hex"))) throw new Error(`COMPOSITION_PNG_DIMENSIONS_INVALID: ${name}`);
        cells.set(name, { name, width, height, digest: hash(bytes), bytes, result });
      }
      visit(suite.suites ?? []);
    }
  }
  visit(report.suites);
  const missing = CELL_NAMES.filter(name => !cells.has(name));
  if (missing.length > 0) throw new Error(`COMPOSITION_MISSING_CELLS: ${missing.join(", ")}`);
  const missingConformance = CELL_NAMES.filter(name => !conformances.has(name));
  if (missingConformance.length > 0) throw new Error(`COMPOSITION_MISSING_CONFORMANCE: ${missingConformance.join(", ")}`);
  const missingVocabulary = CELL_NAMES.filter(name => !vocabularies.has(name));
  if (missingVocabulary.length > 0) throw new Error(`COMPOSITION_MISSING_VOCABULARY: ${missingVocabulary.join(", ")}`);
  return CELL_NAMES.map(name => {
    const { result, ...cell } = cells.get(name);
    const conformance = conformances.get(name);
    if (result !== conformance.result) throw new Error(`COMPOSITION_CONFORMANCE_DIFFERENT_RESULT: ${name}`);
    const vocabulary = vocabularies.get(name);
    if (result !== vocabulary.result) throw new Error(`COMPOSITION_VOCABULARY_DIFFERENT_RESULT: ${name}`);
    return { ...cell, conformance: { bytes: conformance.bytes, digest: conformance.digest, controls: conformance.data.controls, boxes: conformance.data.boxes }, vocabulary: { bytes: vocabulary.bytes, digest: vocabulary.digest, ordinaryTextNodes: vocabulary.data.ordinaryTextNodes, inspectorTextNodes: vocabulary.data.inspectorTextNodes } };
  });
}

export function publishCompositionEvidence(root, reportBytes, { writeReceipt = writeFileSync } = {}) {
  const cells = collectCompositionEvidence(JSON.parse(reportBytes.toString("utf8")), { root });
  const reportDigest = hash(reportBytes);
  // Outside Playwright's cleared outputDir and the replaced HTML reporter directory: later browser
  // tiers cannot erase a passing matrix. Validate/read everything before publishing any new receipt.
  const generation = `test-results/composition/${reportDigest.slice(7)}`;
  const output = compositionDirectory(root, true);
  const receiptPath = join(output, "receipt.json");
  if (existsSync(receiptPath) && !lstatSync(receiptPath).isFile()) throw new Error("COMPOSITION_OUTPUT_FILE_UNSAFE");
  mkdirSync(resolve(root, generation), { recursive: true });
  if (!lstatSync(resolve(root, generation)).isDirectory() || realpathSync(resolve(root, generation)) !== join(output, reportDigest.slice(7))) throw new Error("COMPOSITION_OUTPUT_DIRECTORY_UNSAFE");
  const records = cells.map(({ bytes, conformance, vocabulary, ...cell }) => {
    const path = `${generation}/${cell.name}.png`;
    const target = resolve(root, path);
    assertRetainedFile(target, cell.digest);
    writeFileSync(target, bytes);
    const conformancePath = `${generation}/${cell.name}.json`;
    const conformanceTarget = resolve(root, conformancePath);
    assertRetainedFile(conformanceTarget, conformance.digest);
    writeFileSync(conformanceTarget, conformance.bytes);
    const vocabularyPath = `${generation}/${cell.name}.vocabulary.json`;
    const vocabularyTarget = resolve(root, vocabularyPath);
    assertRetainedFile(vocabularyTarget, vocabulary.digest);
    writeFileSync(vocabularyTarget, vocabulary.bytes);
    return { ...cell, path, conformance: { path: conformancePath, digest: conformance.digest, controls: conformance.controls, boxes: conformance.boxes }, vocabulary: { path: vocabularyPath, digest: vocabulary.digest, ordinaryTextNodes: vocabulary.ordinaryTextNodes, inspectorTextNodes: vocabulary.inspectorTextNodes } };
  });
  assertRetainedFile(resolve(root, generation, "browser-results.json"), reportDigest);
  writeFileSync(resolve(root, generation, "browser-results.json"), reportBytes);
  const receipt = { version: 1, reportDigest, requiredCells: 112, provenCells: records.length, cells: records };
  const staging = mkdtempSync(join(output, ".publish-"));
  try {
    const temporary = join(staging, "receipt.json");
    writeReceipt(temporary, `${JSON.stringify(receipt, null, 2)}\n`);
    renameSync(temporary, receiptPath);
  } finally {
    rmSync(staging, { recursive: true });
  }
  pruneCompositionEvidence(root);
  return receipt;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  try {
    if (process.argv[2] === "--clean") {
      console.log(`play-composition: retired ${pruneCompositionEvidence(root).length} obsolete generated sets; current receipt retained`);
    } else {
      const receipt = publishCompositionEvidence(root, readFileSync(resolve(root, "test-results/browser-results.json")));
      console.log(`play-composition: ${receipt.provenCells}/${receipt.requiredCells} successful unretried cells; test-results/composition/receipt.json`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
