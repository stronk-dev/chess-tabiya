// DISPOSABLE research harness — D1397. Not production code.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const INPUT = new URL("../../planning/evidence-foundation-ux/d1363-hint-selector-results.json", import.meta.url);
const OUTPUT = new URL("../../planning/evidence-foundation-ux/d1397-hint-relation-results.json", import.meta.url);
const REPORT = new URL("../../planning/evidence-foundation-ux/d1397-hint-relation-results.md", import.meta.url);
const EXPECTED_D1061_INPUT = "sha256:53051e9671e801ecb71c209a052b54da53d97873b07d0c85298b8d70043d4162";
const EXPECTED_RUNTIME = "sha256:9b9831400163b62a159377b8a9e1921509bfd665e9aa5b27687dc7f74839159c";
const ARMS = ["depth12", "movetime100_a"] as const;
const PHASES = ["opening", "middlegame", "cross_phase"] as const;
const FAMILIES = ["mate_in_one", "forced_mate", "double_attack", "fork_survives_reply", "discovered_executed", "loose_piece", "promotion_pressure"] as const;
type Arm = (typeof ARMS)[number];
type Phase = (typeof PHASES)[number];
type Family = (typeof FAMILIES)[number];
type Relation = "root_direct" | "opponent_line_event" | "root_followup_in_line";
type Refusal = "opponent_line_event" | "self_exposure_created" | "self_risk_preserved" | "promotion_not_reply_persistent" | "status_not_admitted";

interface Candidate {
  readonly occurrenceId: string;
  readonly family: Family;
  readonly ply: number;
  readonly edgeSideRelation: "root" | "opponent";
  readonly actor: Readonly<Record<string, unknown>>;
  readonly targets: readonly string[];
  readonly edgeMoveUci: string;
  readonly firstMoveUci: string;
  readonly status: string;
}

interface InputRow {
  readonly positionId: string;
  readonly packId: string;
  readonly phase: Phase;
  readonly arm: Arm;
  readonly candidateOccurrences: readonly Candidate[];
}

interface InputResult {
  readonly input: { readonly sha256: string };
  readonly runtimeDigest: string;
  readonly candidateCounts: Readonly<Record<Family, number>>;
  readonly rows: readonly InputRow[];
}

interface Classified {
  readonly candidate: Candidate;
  readonly relation: Relation;
  readonly admitted: boolean;
  readonly refusal?: Refusal;
}

const sha256 = (value: string | Buffer): string => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const familyRank = (family: Family): number => FAMILIES.indexOf(family);

function count(values: readonly string[]): Readonly<Record<string, number>> {
  const result = new Map<string, number>();
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1);
  return Object.freeze(Object.fromEntries([...result.entries()].sort(([left], [right]) => left.localeCompare(right))));
}

function familyCounts(candidates: readonly Candidate[]): Readonly<Record<Family, number>> {
  const observed = count(candidates.map((candidate) => candidate.family));
  return Object.freeze(Object.fromEntries(FAMILIES.map((family) => [family, observed[family] ?? 0])) as Record<Family, number>);
}

function relation(candidate: Candidate): Relation {
  if (candidate.edgeSideRelation === "opponent") {
    if (candidate.ply !== 2 && candidate.ply !== 4) throw new TypeError(`Opponent event on unexpected ply ${candidate.ply}`);
    return "opponent_line_event";
  }
  if (candidate.ply === 1) return "root_direct";
  if (candidate.ply === 3) return "root_followup_in_line";
  throw new TypeError(`Root event on unexpected ply ${candidate.ply}`);
}

function admittedFamilyStatus(candidate: Candidate): Refusal | null {
  switch (candidate.family) {
    case "mate_in_one": return candidate.status === "exact" ? null : "status_not_admitted";
    case "forced_mate": return candidate.status.startsWith("sha256:") ? null : "status_not_admitted";
    case "double_attack":
    case "discovered_executed": return candidate.status === "gained" ? null : "status_not_admitted";
    case "fork_survives_reply": return candidate.status === "matched" ? null : "status_not_admitted";
    case "loose_piece":
      if (candidate.status === "lost") return null;
      if (candidate.status === "gained") return "self_exposure_created";
      if (candidate.status === "preserved") return "self_risk_preserved";
      return "status_not_admitted";
    case "promotion_pressure": return candidate.status === "available:true|available:true" ? null : "promotion_not_reply_persistent";
  }
}

function classify(candidate: Candidate): Classified {
  const candidateRelation = relation(candidate);
  if (candidateRelation === "opponent_line_event") return Object.freeze({ candidate, relation: candidateRelation, admitted: false, refusal: "opponent_line_event" });
  const refusal = admittedFamilyStatus(candidate);
  return refusal === null
    ? Object.freeze({ candidate, relation: candidateRelation, admitted: true })
    : Object.freeze({ candidate, relation: candidateRelation, admitted: false, refusal });
}

function select(values: readonly Classified[], policy: "strict_direct" | "strict_horizon"): Classified | null {
  return [...values].filter((value) => value.admitted && (policy === "strict_horizon" || value.relation === "root_direct"))
    .sort((left, right) => familyRank(left.candidate.family) - familyRank(right.candidate.family)
      || left.candidate.ply - right.candidate.ply
      || left.candidate.targets.join(",").localeCompare(right.candidate.targets.join(","))
      || left.candidate.edgeMoveUci.localeCompare(right.candidate.edgeMoveUci)
      || left.candidate.occurrenceId.localeCompare(right.candidate.occurrenceId))[0] ?? null;
}

const synthetic = (family: Family, status: string, edgeSideRelation: "root" | "opponent" = "root", ply = edgeSideRelation === "root" ? 1 : 2): Candidate => Object.freeze({
  occurrenceId: sha256(`${family}\0${status}\0${edgeSideRelation}\0${ply}`), family, ply, edgeSideRelation,
  actor: Object.freeze({ color: edgeSideRelation === "root" ? "white" : "black", role: "knight" }),
  targets: Object.freeze(["e5"]), edgeMoveUci: "c4e5", firstMoveUci: "c4e5", status,
});

describe("D1397 relation-safe hint selection", () => {
  it("projects the frozen D1363 occurrence population without widening it", () => {
    const inputBytes = readFileSync(INPUT);
    const source = JSON.parse(inputBytes.toString("utf8")) as InputResult;
    expect(source.input.sha256).toBe(EXPECTED_D1061_INPUT);
    expect(source.runtimeDigest).toBe(EXPECTED_RUNTIME);
    expect(source.rows).toHaveLength(128);
    expect(Object.keys(source.candidateCounts)).toEqual(FAMILIES);
    const candidates = source.rows.flatMap((row) => row.candidateOccurrences);
    expect(candidates).toHaveLength(150);
    expect(familyCounts(candidates)).toEqual(source.candidateCounts);

    const rows = source.rows.map((row) => {
      const classified = row.candidateOccurrences.map(classify);
      const direct = select(classified, "strict_direct");
      const horizon = select(classified, "strict_horizon");
      return Object.freeze({
        positionId: row.positionId,
        packId: row.packId,
        phase: row.phase,
        arm: row.arm,
        candidateCount: classified.length,
        relations: count(classified.map((value) => value.relation)),
        admitted: classified.filter((value) => value.admitted).length,
        refusals: count(classified.flatMap((value) => value.refusal === undefined ? [] : [value.refusal])),
        strictDirect: direct,
        strictHorizon: horizon,
      });
    });

    const cells = Object.fromEntries(ARMS.flatMap((arm) => PHASES.map((phase) => {
      const members = rows.filter((row) => row.arm === arm && row.phase === phase);
      return [`${arm}:${phase}`, Object.freeze({
        positions: members.length,
        candidates: members.reduce((sum, row) => sum + row.candidateCount, 0),
        admitted: members.reduce((sum, row) => sum + row.admitted, 0),
        strictDirectReach: members.filter((row) => row.strictDirect !== null).length,
        strictHorizonReach: members.filter((row) => row.strictHorizon !== null).length,
        strictHorizonSelections: count(members.flatMap((row) => row.strictHorizon === null ? [] : [`${row.strictHorizon.candidate.family}:${row.strictHorizon.candidate.status}:${row.strictHorizon.relation}`])),
        refusals: count(members.flatMap((row) => Object.entries(row.refusals).flatMap(([reason, amount]) => Array.from({ length: amount }, () => reason)))),
      })];
    })));
    const summary = Object.fromEntries(ARMS.map((arm) => {
      const members = rows.filter((row) => row.arm === arm);
      return [arm, Object.freeze({
        positions: members.length,
        strictDirectReach: members.filter((row) => row.strictDirect !== null).length,
        strictHorizonReach: members.filter((row) => row.strictHorizon !== null).length,
        strictDirectSelections: count(members.flatMap((row) => row.strictDirect === null ? [] : [`${row.strictDirect.candidate.family}:${row.strictDirect.candidate.status}`])),
        strictHorizonSelections: count(members.flatMap((row) => row.strictHorizon === null ? [] : [`${row.strictHorizon.candidate.family}:${row.strictHorizon.candidate.status}:${row.strictHorizon.relation}`])),
      })];
    }));
    const crossArmDiagnostic = Object.fromEntries((["strictDirect", "strictHorizon"] as const).map((policy) => {
      const pairs = new Map<string, Partial<Record<Arm, (typeof rows)[number][typeof policy]>>>();
      for (const row of rows) pairs.set(row.positionId, { ...pairs.get(row.positionId), [row.arm]: row[policy] });
      let either = 0;
      let both = 0;
      let sameFamilyStatusRelation = 0;
      let sameFirstMove = 0;
      let sameOccurrence = 0;
      for (const pair of pairs.values()) {
        const depth = pair.depth12;
        const timed = pair.movetime100_a;
        if (depth != null || timed != null) either += 1;
        if (depth != null && timed != null) {
          both += 1;
          if (depth.candidate.family === timed.candidate.family && depth.candidate.status === timed.candidate.status && depth.relation === timed.relation) sameFamilyStatusRelation += 1;
          if (depth.candidate.firstMoveUci === timed.candidate.firstMoveUci) sameFirstMove += 1;
          if (depth.candidate.occurrenceId === timed.candidate.occurrenceId) sameOccurrence += 1;
        }
      }
      return [policy, Object.freeze({ either, both, sameFamilyStatusRelation, sameFirstMove, sameOccurrence })];
    }));
    const allClassified = candidates.map(classify);
    const result = Object.freeze({
      experiment: "D1397",
      measuredAt: new Date().toISOString(),
      input: { path: "planning/evidence-foundation-ux/d1363-hint-selector-results.json", sha256: sha256(inputBytes), d1061Input: source.input.sha256, runtimeDigest: source.runtimeDigest },
      contract: { families: FAMILIES, relations: ["root_direct", "opponent_line_event", "root_followup_in_line"], policies: ["strict_direct", "strict_horizon"] },
      population: {
        candidates: candidates.length,
        byFamily: familyCounts(candidates),
        byRelation: count(allClassified.map((value) => value.relation)),
        admitted: allClassified.filter((value) => value.admitted).length,
        refusals: count(allClassified.flatMap((value) => value.refusal === undefined ? [] : [value.refusal])),
      },
      summary,
      crossArmDiagnostic,
      cells,
      gates: {
        d1363Reproduced: candidates.length === 150 && JSON.stringify(familyCounts(candidates)) === JSON.stringify(source.candidateCounts),
        relationTotal: allClassified.length === candidates.length,
        noOpponentAdmission: allClassified.every((value) => value.relation !== "opponent_line_event" || !value.admitted),
        selectedRootOnly: rows.every((row) => [row.strictDirect, row.strictHorizon].every((value) => value === null || value.candidate.edgeSideRelation === "root")),
      },
      rows,
    });
    writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    const lines = [
      "# D1397 relation-safe hint results", "",
      `Input: \`${result.input.sha256}\`; D1061: \`${source.input.sha256}\`; runtime: \`${source.runtimeDigest}\`.`, "",
      "| arm | strict-direct reach | strict-horizon reach |", "|---|---:|---:|",
      ...ARMS.map((arm) => `| ${arm} | ${summary[arm].strictDirectReach}/64 | ${summary[arm].strictHorizonReach}/64 |`), "",
      `Candidates: ${result.population.candidates}; admitted occurrences: ${result.population.admitted}.`, "",
      `Post-result diagnostic (no gate): strict-direct is non-empty on the same 10 positions in both arms, with 10/10 family/status/relation agreement and 9/10 exact-occurrence agreement; strict-horizon reaches 16 positions in either arm but only 10 in both.`, "",
      "## Refusals", "", "| reason | occurrences |", "|---|---:|",
      ...Object.entries(result.population.refusals).map(([reason, amount]) => `| ${reason} | ${amount} |`), "",
      "No reach minimum was preregistered. These are exact occurrence relations, not usefulness, causality or move-quality labels.", "",
    ];
    writeFileSync(REPORT, lines.join("\n"), "utf8");

    expect(Object.values(result.gates).every(Boolean)).toBe(true);
  });

  it("keeps opponent and disallowed signs unable to change either strict policy", () => {
    const admitted = [
      synthetic("mate_in_one", "exact"), synthetic("forced_mate", `sha256:${"a".repeat(64)}`),
      synthetic("double_attack", "gained"), synthetic("fork_survives_reply", "matched"),
      synthetic("discovered_executed", "gained"), synthetic("loose_piece", "lost"),
      synthetic("promotion_pressure", "available:true|available:true"),
    ].map(classify);
    expect(admitted.every((value) => value.admitted)).toBe(true);
    const baseline = select([classify(synthetic("loose_piece", "lost"))], "strict_horizon");
    expect(baseline?.candidate.family).toBe("loose_piece");
    for (const refused of [
      synthetic("mate_in_one", "exact", "opponent"),
      synthetic("fork_survives_reply", "matched", "opponent"),
      synthetic("loose_piece", "gained"), synthetic("loose_piece", "preserved"),
      synthetic("promotion_pressure", "available:true|available:false"),
      synthetic("promotion_pressure", "available:false|available:false"),
    ]) expect(select([classify(refused), classify(synthetic("loose_piece", "lost"))], "strict_horizon")?.candidate.occurrenceId).toBe(baseline?.candidate.occurrenceId);
  });
});
