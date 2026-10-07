// DISPOSABLE D3508/D3262 research. Observes earlier literal exact tables;
// never changes the frozen source reader, original capture, timing or admission.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseProbe } from "./cost-stockfish.mjs";
import { costCases, loadCostPlan, sha } from "./cost-contract.mjs";

const check = (v, m) => { if (!v) throw new Error(`D3508_TIMED_TABLE_AUDIT: ${m}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const boundRefusal = "Bound-only score cannot form coherent rank table";
const authority = "disposable_earlier_literal_frame_observation_not_source_admission_or_profile";
const sourceNames = ["cost-timed-table-audit.mjs", "cost-stockfish.mjs", "stockfish-coherent-table.mjs", "cost-contract.mjs"];

/** An earlier exact frame is an observation, NOT an admitted fallback receipt. */
export function auditTimedTable(operands, lines) {
  const result = { authority, inputDigest: sha(JSON.stringify({ operands, lines })),
    originalSourceAdmissionChanged: false, moveRecommendationLicensed: false,
    boundForDelimiterBestmoveLicensed: false, earlierExactFrame: null };
  try {
    parseProbe(operands, lines);
    return { ...result, original: { kind: "admitted_by_unchanged_reader" } };
  } catch (e) {
    result.original = { kind: "refused_by_unchanged_reader", reason: e.message };
  }
  // Missing delimiter, illegal PV, terminal continuation, unknown operands and
  // fixed-depth requests are never made available by this research hypothesis.
  if (result.original.reason !== boundRefusal || operands.budget !== "movetime100") return result;
  const scored = lines.flatMap((line, index) => {
    const depth = /^info .*\bdepth (\d+)\b/u.exec(line);
    return depth && /\bscore (?:cp|mate) -?\d+\b/u.test(line) && /\bpv /u.test(line)
      ? [{ index, depth: Number(depth[1]) }] : [];
  });
  const depths = [...new Set(scored.map(x => x.depth))].sort((a, b) => b - a);
  for (const depth of depths) {
    const end = scored.filter(x => x.depth === depth).at(-1).index;
    // Each view is an exact contiguous literal prefix plus the actual delimiter.
    // No per-rank filtering, score substitution, new PV or raw-capture rewrite.
    const prefix = [...lines.slice(0, end + 1), lines.at(-1)];
    let observed;
    try { observed = parseProbe(operands, prefix); } catch { continue; }
    if (observed.coherentDepth !== depth) continue;
    const rankLines = observed.entries.map(entry => {
      const indexes = scored.filter(x => x.index <= end && x.depth === depth
        && Number(/\bmultipv (\d+)\b/u.exec(lines[x.index])?.[1] ?? 1) === entry.rank);
      return indexes.at(-1).index;
    });
    result.earlierExactFrame = { coherentDepth: observed.coherentDepth,
      latestReportedDepth: depths[0], literalPrefixEnd: end, rankLineIndexes: rankLines,
      entries: observed.entries, scorePerspective: observed.scorePerspective,
      literalDelimiterBestmove: observed.bestmove,
      delimiterMatchesFrameRankOne: observed.bestmove === observed.entries[0].moveUci,
      status: "earlier_exact_literal_table_observed_not_admitted" };
    break;
  }
  return result;
}

export function auditRejectedGroups(metadataLiteral, groups) {
  const metadata = JSON.parse(metadataLiteral);
  const plan = loadCostPlan();
  check(Number.isSafeInteger(metadata.start) && metadata.start >= 0 && metadata.start % 3 === 0
    && Number.isSafeInteger(metadata.limit) && metadata.limit > 0 && metadata.limit % 3 === 0
    && metadata.start + metadata.limit <= plan.expectedCases
    && metadata.expectedCases === plan.expectedCases
    && metadata.planDigest === sha(`${JSON.stringify(plan, null, 2)}\n`)
    && same(metadata.cases, [...costCases(plan)].slice(metadata.start, metadata.start + metadata.limit)),
  "changed frozen batch population");
  check(metadata.question === "D3262" && metadata.cases?.length === metadata.limit
    && typeof metadata.planDigest === "string" && metadata.provider?.requested === true,
  "original batch metadata required");
  check(Array.isArray(groups) && groups.length > 0 && new Set(groups.map(x => x.name)).size === groups.length,
    "explicit unique original groups required");
  const examples = [];
  for (const group of groups) {
    check(/^triplet-\d{6}\.json\.gz$/u.test(group.name), "foreign group name");
    const bytes = Buffer.from(group.base64, "base64");
    check(sha(bytes) === group.digest, "changed original compressed group");
    const records = JSON.parse(gunzipSync(bytes));
    check(records.length === 3 && same(records.map(x => x.row.regime), ["cold", "warm", "provider_offline"]),
      "lost regime triplet");
    for (const record of records) {
      check(record.row.planDigest === metadata.planDigest
        && same(record.raw.cell, Object.fromEntries(["rootId", "candidateUci", "setting", "horizon", "regime"].map(k => [k, record.row[k]])))
        && metadata.cases.some(cell => same(cell, record.raw.cell))
        && sha(JSON.stringify(record.raw)) === record.row.rawCaptureDigest,
      "crossed original case or raw bytes");
      check(record.raw.dependencies.length === record.row.providerQueries.length, "lost dependency population");
      if (record.row.regime !== "cold") continue;
      for (const [index, dependency] of record.raw.dependencies.entries()) {
        const ledger = record.row.providerQueries[index];
        check(same(ledger.operands, dependency.operands) && ledger.state === dependency.state,
          "crossed query ledger");
        if (dependency.state !== "invalid" || dependency.failure !== boundRefusal) continue;
        const capture = dependency.rejectedCapture;
        check(record.row.kind === "invalid_source" && ledger.receiptDigest === null
          && dependency.receipt === null && same(capture?.operands, dependency.operands)
          && dependency.operands.provider === "stockfish"
          && dependency.operands.sourceDigest === metadata.provider.sourceDigest
          && dependency.operands.budget === "movetime100", "not a literal rejected timed query");
        const observation = auditTimedTable(capture.operands, capture.lines);
        check(observation.original.kind === "refused_by_unchanged_reader"
          && observation.original.reason === dependency.failure, "original refusal does not replay");
        examples.push({ group: group.name, case: record.raw.cell, dependencyIndex: index,
          originalFailure: dependency.failure, observation });
      }
    }
  }
  check(examples.length > 0, "no original bound-refused examples");
  return { question: "D3508", parentQuestion: "D3262", authority, examples,
    originalSourceAdmissionChanged: false, productionProfileSelected: false,
    wholePopulationClaim: false, clocksRepeated: false,
    sampling: "explicit_failure_examples_not_random_sample_or_complete_cost_population" };
}

export function checkTimedTableAudit(value) {
  check(value && value.version === 1 && typeof value.metadataLiteral === "string"
    && sha(value.metadataLiteral) === value.metadataDigest, "changed original metadata");
  check(Array.isArray(value.sourceSnapshots) && same(value.sourceSnapshots.map(x => x.name), sourceNames)
    && value.sourceSnapshots.every(x => typeof x.literal === "string" && sha(x.literal) === x.digest),
    "missing or changed auditor/reader sources");
  const metadata = JSON.parse(value.metadataLiteral);
  for (const source of value.sourceSnapshots.slice(1)) {
    check(metadata.instrumentDigests?.[source.name] === source.digest,
      "audit reader does not match captured reader");
  }
  check(same(value.result, auditRejectedGroups(value.metadataLiteral, value.groups)), "changed observed tables or scope");
  return { examples: value.result.examples.length,
    earlierExactFrames: value.result.examples.filter(x => x.observation.earlierExactFrame !== null).length,
    delimiterDisagreements: value.result.examples.filter(x => x.observation.earlierExactFrame?.delimiterMatchesFrameRankOne === false).length,
    authority, originalSourceAdmissionChanged: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length === 2 && args[0] === "--check") {
    const bytes = readFileSync(args[1]);
    process.stdout.write(`${JSON.stringify({ ...checkTimedTableAudit(JSON.parse(bytes)), digest: sha(bytes) })}\n`);
  } else {
    check(args.length === 6 && args[0] === "--batch" && args[2] === "--groups" && args[4] === "--out",
      "use --check <file> or --batch <directory> --groups <CSV> --out <new-file>");
    const names = args[3].split(",");
    check(names.every(x => /^triplet-\d{6}\.json\.gz$/u.test(x)) && new Set(names).size === names.length,
      "explicit unique original group names required");
    const metadataLiteral = readFileSync(resolve(args[1], "metadata.json"), "utf8");
    const groups = names.map(name => {
      const bytes = readFileSync(resolve(args[1], name));
      return { name, digest: sha(bytes), base64: bytes.toString("base64") };
    });
    const sourceSnapshots = sourceNames.map(name => {
      const literal = readFileSync(new URL(name, import.meta.url), "utf8");
      return { name, digest: sha(literal), literal };
    });
    const value = { version: 1, metadataLiteral, metadataDigest: sha(metadataLiteral), groups,
      sourceSnapshots, result: auditRejectedGroups(metadataLiteral, groups) };
    const summary = checkTimedTableAudit(value), bytes = `${JSON.stringify(value, null, 2)}\n`;
    writeFileSync(args[5], bytes, { flag: "wx" });
    process.stdout.write(`${JSON.stringify({ ...summary, digest: sha(bytes) })}\n`);
  }
}
