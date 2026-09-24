// rfc/evidence-presentation.md Checkpoint B / rfc/module-registration.md A5: the Full Inspector,
// Post-commit Nudge and Review Map pair-keyed adapters.
import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer, type DeclaredEvidence } from "./evidence-contract.js";
import {
  PRESENTATION_ADAPTERS,
  adapterComponents,
  assertPresentationText,
  parsePresentationReceipt,
  presentEvidenceItems,
  presentedSentence,
  serializePresentedEvidence,
} from "./presentation-contract.js";
import type { PresentationKit } from "./presentation-contract.js";
import { INSPECTOR_FACT_RENDERERS, inspectorAdapterSpecs } from "./presentation-inspector-adapters.js";
import { inspectorFixtureEvidence } from "./testing/inspector-presentation-fixture.js";

const CONSUMERS = ["module.full_inspector", "module.postcommit_nudge", "module.review_map"] as const;
const key = (consumer: { readonly id: string; readonly version: number }, projection: { readonly id: string; readonly version: number }) => `${consumer.id}@${consumer.version}\u0000${projection.id}@${projection.version}`;
const bindingsOf = (consumer: string) => PRIMARY_EVIDENCE_MANIFEST.bindings.filter((binding) => binding.consumer.id === consumer);
/** The pairs this group registers (constructs read the kit only when invoked). */
const OWN = new Set(inspectorAdapterSpecs({} as PresentationKit).map((spec) => key(spec.consumer, spec.projection)));
const FORBIDDEN = [/Tabiya's/u, /detector/iu, /phase bands/iu, /recorded mass/iu, /evidence recorded\./iu, /@\d/u, /\bbest\b/iu, /\bshould\b/iu, /\bwins\b/iu, /\b[a-h][1-8][a-h][1-8][qrbn]?\b/u, /_/u, /sha256/u];

describe("inspector / post-commit nudge / review map adapters: exact pair population", () => {
  it.each(CONSUMERS)("%s: every binding has exactly one adapter whose forms equal its non-machine forms", (consumer) => {
    const bindings = bindingsOf(consumer);
    expect(bindings.length).toBeGreaterThan(0);
    for (const binding of bindings) {
      const adapters = PRESENTATION_ADAPTERS.filter((entry) => entry.key === key(binding.consumer, binding.projection));
      expect(adapters, key(binding.consumer, binding.projection)).toHaveLength(1);
      // Checkpoint A's Review Map pairs are owned (and checked) by presentation-contract.test.ts.
      if (!OWN.has(key(binding.consumer, binding.projection))) { expect(consumer).toBe("module.review_map"); continue; }
      const expected = [...binding.forms].filter((form) => form !== "machine_condition").sort();
      expect([...adapters[0]!.forms].sort(), key(binding.consumer, binding.projection)).toEqual(expected);
      const operands = PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => projection.id === binding.projection.id && projection.version === binding.projection.version)!.operands;
      for (const operand of adapters[0]!.sourceOperands) expect(operands, `${key(binding.consumer, binding.projection)} retains ${operand}`).toContain(operand);
    }
    for (const entry of PRESENTATION_ADAPTERS.filter((adapter) => adapter.consumer.id === consumer)) {
      expect(bindings.some((binding) => key(binding.consumer, binding.projection) === entry.key), entry.key).toBe(true);
    }
  });

  it("covers the expected pair counts and registers inspector renderers under their own prefix", () => {
    expect(bindingsOf("module.full_inspector")).toHaveLength(75);
    expect(bindingsOf("module.postcommit_nudge")).toHaveLength(52);
    const own = (consumer: string) => [...OWN].filter((entry) => entry.startsWith(`${consumer}@1\u0000`)).length;
    expect([own("module.full_inspector"), own("module.postcommit_nudge"), own("module.review_map")]).toEqual([75, 52, bindingsOf("module.review_map").length - 16]);
    for (const id of Object.keys(INSPECTOR_FACT_RENDERERS)) expect(id).toMatch(/^inspector\.[a-z_]+@1$/u);
  });
});

/** A reading with a board witness (the module query offers only witnessed readings). */
function witnessed(item: DeclaredEvidence<unknown>): boolean {
  const payload = item.payload as Readonly<Record<string, unknown>>;
  const nonEmpty = (field: string) => !Array.isArray(payload[field]) || (payload[field] as unknown[]).length > 0;
  switch (item.projection.id) {
    case "rules.tactic.consequence.threat": return nonEmpty("threats");
    case "rules.tactic.consequence.mate_in_one": return nonEmpty("mates");
    case "rules.tactic.reading.loose_piece": return (payload.pieces as readonly { enPrise: boolean; loose: boolean; underDefended: boolean }[]).some((entry) => entry.enPrise || entry.loose || entry.underDefended);
    case "rules.tactic.reading.back_rank": return (payload.susceptible as readonly { accessingHeavyPieces: readonly unknown[] }[]).some((entry) => entry.accessingHeavyPieces.length > 0);
    case "rules.tactic.reading.trapped_piece": return (payload.pieces as readonly { attackers: readonly unknown[] }[]).some((entry) => entry.attackers.length > 0);
    case "rules.tactic.reading.ray_classification": return nonEmpty("rays");
    case "rules.tactic.reading.rook_on_seventh": return nonEmpty("rooks");
    case "rules.pawn.reading.contacts": return nonEmpty("contacts");
    case "rules.pawn.reading.candidate_majority": return nonEmpty("candidates");
    case "rules.tactic.reading.discovered_latency": return nonEmpty("screens");
    case "derived.tactic.promotion_pressure": return nonEmpty("pawns");
    case "rules.structural.reading.space": return (payload.colors as readonly { zones: readonly { squares: readonly unknown[] }[] }[]).some((entry) => entry.zones.some((zone) => zone.squares.length > 0));
    case "rules.phase.development": { const undeveloped = payload.undeveloped as { white: unknown[]; black: unknown[] }; return undeveloped.white.length + undeveloped.black.length > 0; }
    case "rules.mobility.reading.piece_destinations": return (payload.colors as readonly { kind: string; pieces?: readonly { legal: readonly unknown[] }[] }[]).some((entry) => entry.kind === "available" && (entry.pieces ?? []).some((unit) => unit.legal.length > 0));
    case "rules.structural.reading.pawn_connectivity": return (payload.colors as readonly { islandCount: number }[]).some((entry) => entry.islandCount > 0);
    case "rules.tactic.reading.defender_duty_set": return nonEmpty("duties");
    case "human.explorer.population": return (payload.result as { kind: string }).kind === "stats";
    default: return true;
  }
}

describe("inspector / post-commit nudge / review map adapters: real evidence through the one construction path", () => {
  const routes = [...new Set(CONSUMERS.flatMap((consumer) => bindingsOf(consumer).map((binding) => `${binding.projection.id}@${binding.projection.version}`)))];
  const minted = inspectorFixtureEvidence(routes);

  it.each(CONSUMERS)("%s: presents, round-trips and renders learner vocabulary only", (consumer) => {
    const ref = { id: consumer, version: 1 };
    let presentedPairs = 0;
    for (const binding of bindingsOf(consumer)) {
      if (!OWN.has(key(ref, binding.projection))) continue;
      const items = (minted.get(`${binding.projection.id}@${binding.projection.version}`) ?? []).filter(witnessed);
      if (items.length === 0) continue;
      presentedPairs += 1;
      for (const item of items) {
        const label = `${consumer} × ${binding.projection.id}@${binding.projection.version}`;
        const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref, [item]));
        const adapter = PRESENTATION_ADAPTERS.find((entry) => entry.key === key(ref, binding.projection))!;
        expect(presented.map((entry) => entry.component.id), label).toEqual(adapterComponents(adapter));
        const parsed = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(presented))));
        expect(parsed.map((entry) => entry.componentDigest), label).toEqual(presented.map((entry) => entry.componentDigest));
        for (const entry of parsed) {
          const sentence = presentedSentence(entry);
          expect(assertPresentationText(sentence)).toBe(sentence);
          for (const pattern of FORBIDDEN) expect(sentence, `${label}: ${sentence}`).not.toMatch(pattern);
          if (consumer === "module.postcommit_nudge") expect(sentence.split(/\s+/u).length, `${label}: ${sentence}`).toBeLessThanOrEqual(50);
        }
      }
    }
    expect(presentedPairs).toBeGreaterThan(consumer === "module.full_inspector" ? 55 : 40);
  });
});
