// DISPOSABLE acceptance audit — D644. It demonstrates a criterion conflict; it is not product code.
import { writeFileSync } from "node:fs";

import { BANNED_JUDGEMENTS, PRESCRIPTIVE_VERBS } from "../../packages/runtime/src/index.js";
import { describe, expect, it } from "vitest";

import { claimProvenance } from "../../apps/web/src/lib/claim-presentation.js";
import { admittedFeedbackClaimIds } from "../../apps/server/src/authored-feedback.js";
import { PackRegistry } from "../../apps/server/src/pack-registry.js";
import { PrincipleRegistry } from "../../apps/server/src/principle-registry.js";
import { MACHINE_LABEL_EVIDENCE_KINDS } from "../../apps/server/src/sourcing/claim-binding.js";

const OUT = new URL("./output.md", import.meta.url);
function hits(text: string): readonly string[] {
  return [...BANNED_JUDGEMENTS, ...PRESCRIPTIVE_VERBS]
    .filter((word) => new RegExp(`\\b${word}\\b`, "iu").test(text));
}

interface Range { readonly start: number; readonly end: number }

function authoredRanges(text: string, inputs: readonly string[]): readonly Range[] {
  return inputs.flatMap((input) => {
    if (input.length === 0) return [];
    const ranges: Range[] = [];
    let start = text.indexOf(input);
    while (start >= 0) {
      ranges.push({ start, end: start + input.length });
      start = text.indexOf(input, start + input.length);
    }
    return ranges;
  });
}

function templateHits(text: string, inputs: readonly string[]): readonly string[] {
  const ranges = authoredRanges(text, inputs);
  return [...BANNED_JUDGEMENTS, ...PRESCRIPTIVE_VERBS].flatMap((word) =>
    [...text.matchAll(new RegExp(`\\b${word}\\b`, "giu"))]
      .filter((match) => {
        const start = match.index;
        const end = start + match[0].length;
        return !ranges.some((range) => start >= range.start && end <= range.end);
      })
      .map(() => word));
}

describe("D644 feedback criterion 20", () => {
  it("attributes forbidden vocabulary to authored inputs and keeps it out of template-owned text", async () => {
    const principles = await PrincipleRegistry.loadDefault();
    const registry = await PackRegistry.loadDefault({ development: true, principles });
    const rows = registry.list().flatMap((summary) => {
      const pack = registry.required(summary.id);
      return (pack.document.feedbackClaims ?? []).flatMap((claim) => {
        const backing = pack.claimBackings.get(claim.id);
        if (backing === undefined) return [];
        const instrumentKinds = new Set(backing.instrumentKinds);
        const earnedEvidenceTypes = claim.evidenceTypes.filter((label) =>
          (MACHINE_LABEL_EVIDENCE_KINDS[label] ?? []).some((kind) => instrumentKinds.has(kind)),
        );
        const text = claimProvenance({
          kind: "claim",
          id: `claim#${claim.id}`,
          revealedBy: { kind: "outcome", eventSeq: 1 },
          anchor: { claimId: claim.id },
          text: claim.text,
          evidenceTypes: claim.evidenceTypes,
          earnedEvidenceTypes,
          binding: backing.binding,
          authorSpans: backing.authorSpans,
          principles: backing.principles,
        });
        const authoredInputs = backing.principles.flatMap((principle) =>
          [principle.name, principle.statement, principle.counterCase]);
        return [{
          packId: pack.document.id,
          claimId: claim.id,
          binding: backing.binding,
          text,
          authoredInputs,
          hits: hits(text),
          templateHits: templateHits(text, authoredInputs),
        }];
      });
    });
    const authoredVocabulary = rows.filter((row) => row.hits.length > 0);
    const violations = rows.filter((row) => row.templateHits.length > 0);
    const lines = [
      "# D644 criterion-20 provenance boundary — raw output",
      "",
      `Projected claimBackings rows: ${rows.length}.`,
      `Rows containing authored BANNED_JUDGEMENTS or PRESCRIPTIVE_VERBS: ${authoredVocabulary.length}.`,
      `Rows where the template introduces one: ${violations.length}.`,
      "",
      "| pack | claim | binding | template-owned matching words |",
      "|---|---|---|---|",
      ...violations.map((row) => `| ${row.packId} | ${row.claimId} | ${row.binding} | ${row.templateHits.join(", ")} |`),
      "",
    ];
    writeFileSync(OUT, lines.join("\n"));

    expect(rows).toHaveLength(67);
    expect(authoredVocabulary).toHaveLength(46);
    expect(rows.every((row) => row.authoredInputs.every((input) => row.text.includes(input)))).toBe(true);
    expect(violations).toEqual([]);

    const source = rows.find((row) => row.authoredInputs.length > 0)!;
    expect(templateHits(`Best ${source.text}`, source.authoredInputs)).toContain("best");
  });

  it("keeps every recorded-evidence clause limited to labels earned by an instrument", async () => {
    const principles = await PrincipleRegistry.loadDefault();
    const registry = await PackRegistry.loadDefault({ development: true, principles });
    let delivered = 0;
    let recordedClauses = 0;
    let mixedMachineAndDeclaration = 0;
    for (const summary of registry.list()) {
      const pack = registry.required(summary.id);
      const admitted = admittedFeedbackClaimIds(pack);
      for (const claim of pack.document.feedbackClaims ?? []) {
        if (!admitted.has(claim.id)) continue;
        delivered += 1;
        const backing = pack.claimBackings.get(claim.id);
        const instrumentKinds = new Set(backing?.instrumentKinds ?? []);
        const earnedEvidenceTypes = claim.evidenceTypes.filter((label) =>
          (MACHINE_LABEL_EVIDENCE_KINDS[label] ?? []).some((kind) => instrumentKinds.has(kind)),
        );
        if (earnedEvidenceTypes.length > 0 && claim.evidenceTypes.some((label) => !earnedEvidenceTypes.includes(label))) mixedMachineAndDeclaration += 1;
        const text = claimProvenance({
          kind: "claim",
          id: `claim#${claim.id}`,
          revealedBy: { kind: "outcome", eventSeq: 1 },
          anchor: { claimId: claim.id },
          text: claim.text,
          evidenceTypes: claim.evidenceTypes,
          earnedEvidenceTypes,
          binding: backing?.binding ?? "self_declared",
          authorSpans: backing?.authorSpans ?? [],
          principles: backing?.principles ?? [],
        });
        const recorded = /Evidence recorded for: ([^.]+)\./u.exec(text)?.[1]?.split(", ") ?? [];
        if (recorded.length > 0) recordedClauses += 1;
        expect(recorded).toEqual(earnedEvidenceTypes);
      }
    }
    expect(delivered).toBeGreaterThan(0);
    expect(recordedClauses).toBeGreaterThan(0);
    expect(mixedMachineAndDeclaration).toBeGreaterThan(0);

    const negative = claimProvenance({
      kind: "claim",
      id: "claim#mixed-negative",
      revealedBy: { kind: "outcome", eventSeq: 1 },
      anchor: { claimId: "mixed-negative" },
      text: "Synthetic boundary fixture.",
      evidenceTypes: ["tablebase_exact", "hypothesis"],
      earnedEvidenceTypes: ["tablebase_exact"],
      binding: "author_attributed",
      authorSpans: ["Synthetic boundary fixture."],
      principles: [],
    });
    expect(negative).toContain("Evidence recorded for: tablebase_exact.");
    expect(negative).not.toContain("Evidence recorded for: tablebase_exact, hypothesis");
  });
});
