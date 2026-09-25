// rfc/hint-distance.md acceptance criteria 1–9, 11 and 14 at the runtime tier. Server/REST, web and
// browser arms live beside their surfaces (apps/server/src/hint-service.test.ts,
// apps/web/src/lib/hint-response.test.ts, tests/browser/drill.spec.ts).
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer } from "./evidence-contract.js";
import { presentEvidenceItems } from "./presentation-contract.js";
import { compileEvidenceManifest, identitySealedEvidenceWithoutValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { EVIDENCE_CONTRACT_DECLARATIONS } from "./evidence-catalog.js";
import {
  HINT_DISCLOSURE_RENDERERS,
  assertHintDisclosurePacket,
  compileGuidedHintPacket,
  compileHintDeliveryReceipt,
  compileHintDisclosure,
  hintHorizonOwner,
  hintSentence,
  hintVoiceCheck,
  selectHintHorizon,
  type SealedHintHorizon,
} from "./hint-distance.js";
import { hintDecisionStamp, hintPolicyDecision, hintReceiptDigest, nextHintRung, parseHintDeliveryReceipt, parseHintResponse } from "./hint-exchange.js";
import type { HintDisclosurePayload } from "./hint-horizon.js";
import {
  HINT_DECLARATION_MATRIX,
  HINT_DISCLOSURE_BY_RUNG,
  HINT_DISCLOSURE_PROJECTION_IDS,
  HINT_FAMILIES,
  HINT_HORIZON_PROJECTION_IDS,
  HINT_RUNGS,
  HINT_SELECTION_ORDER,
  hintDisclosureProjectionId,
  type HintFamily,
  type HintRung,
} from "./hint-registry.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { commitMove, createRun, revealFeedback, rewind } from "./runtime.js";
import { HINT_FAMILY_POSITIVES, HINT_FOLLOWUP, HINT_OPPONENT_LINE, HINT_ROOT, HINT_SELF_EXPOSURE, hintPackets, sealedHintLine, selectFixture } from "./testing/hint-fixture.js";

const ROOT = new URL("../../../", import.meta.url);
const POLICY = { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } as const;
const positionRun = (id: string, fen: string, side: "white" | "black") => createRun({ id, session: { kind: "position", start: { fen, side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "strong_engine" } }, sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: POLICY, seed: 1, createdAt: "2026-09-24T12:00:00.000Z" } as never);
const key = (value: { readonly id: string; readonly version: number }): string => `${value.id}@${value.version}`;
const selected = (fixture: { readonly fen: string; readonly moves: readonly string[] }): SealedHintHorizon => {
  const selection = selectFixture(fixture.fen, fixture.moves);
  if (selection.kind !== "selected") throw new Error(`expected a selection for ${fixture.fen}`);
  return selection.horizon;
};

describe("criterion 1 — measured registry equality", () => {
  it("the seven families are set-equal to D1397's frozen contract families; one horizon per family", () => {
    const frozen = JSON.parse(readFileSync(new URL("planning/evidence-foundation-ux/d1397-hint-relation-results.json", ROOT), "utf8")) as { readonly contract: { readonly families: readonly string[] } };
    expect([...HINT_FAMILIES].sort()).toEqual([...frozen.contract.families].sort());
    expect([...HINT_SELECTION_ORDER].sort()).toEqual([...HINT_FAMILIES].sort());
    expect(HINT_HORIZON_PROJECTION_IDS.map(key)).toEqual(HINT_FAMILIES.map((family) => `derived.hint.horizon.${family}@1`));
    expect(HINT_DECLARATION_MATRIX.map((row) => [row.family, key(row.source), row.role])).toEqual([
      ["mate_in_one", "rules.tactic.consequence.mate_in_one@1", "reading"],
      ["forced_mate", "rules.tactic.consequence.forced_mate_after_move@1", "predicate"],
      ["double_attack", "rules.tactic.event.double_attack@1", "event"],
      ["fork_survives_reply", "derived.tactic.fork_survives_reply@1", "predicate"],
      ["discovered_executed", "derived.tactic.discovered_executed@1", "event"],
      ["loose_piece", "rules.tactic.event.loose_piece@1", "event"],
      ["promotion_pressure", "derived.tactic.promotion_pressure@1", "reading"],
    ]);
    // Negative: a list that is not the frozen seven (the returned D1066 draft) fails equality.
    expect(["mate_in_one", "forced_mate", "double_attack", "pin", "skewer", "loose_piece", "promotion_pressure"].sort()).not.toEqual([...frozen.contract.families].sort());
  });

  it("drift tripwires: the frozen D1397 population reproduces 10/16 and 10/10 reach, 35/150 admitted, 0/78 opponent", () => {
    type Occurrence = { readonly occurrenceId: string; readonly family: HintFamily; readonly ply: number; readonly edgeSideRelation: "root" | "opponent"; readonly targets: readonly string[]; readonly edgeMoveUci: string; readonly status: string };
    const source = JSON.parse(readFileSync(new URL("planning/evidence-foundation-ux/d1363-hint-selector-results.json", ROOT), "utf8")) as { readonly rows: readonly { readonly positionId: string; readonly arm: string; readonly candidateOccurrences: readonly Occurrence[] }[] };
    // §1's literal status admission table, and §2's relation rule: the root side's own ply 1 or 3 only.
    const admitted = (value: Occurrence): boolean => value.edgeSideRelation === "root" && (value.ply === 1 || value.ply === 3) && ({
      mate_in_one: value.status === "exact", forced_mate: value.status.startsWith("sha256:"), double_attack: value.status === "gained",
      fork_survives_reply: value.status === "matched", discovered_executed: value.status === "gained", loose_piece: value.status === "lost",
      promotion_pressure: value.status === "available:true|available:true",
    } as const)[value.family];
    const all = source.rows.flatMap((row) => row.candidateOccurrences);
    expect(all).toHaveLength(150);
    expect(all.filter(admitted)).toHaveLength(35);
    expect(all.filter((value) => value.edgeSideRelation === "opponent")).toHaveLength(78);
    expect(all.filter((value) => value.edgeSideRelation === "opponent" && admitted(value))).toHaveLength(0);
    const reach = (arm: string, direct: boolean) => source.rows.filter((row) => row.arm === arm && row.candidateOccurrences.some((value) => admitted(value) && (!direct || value.ply === 1))).length;
    expect([reach("depth12", true), reach("depth12", false), reach("movetime100_a", true), reach("movetime100_a", false)]).toEqual([10, 16, 10, 10]);
    // The precedence swap (fork survival before plain double attack) selects exactly what D1397 selected.
    const pick = (values: readonly Occurrence[]) => [...values].filter(admitted).sort((left, right) => HINT_SELECTION_ORDER.indexOf(left.family) - HINT_SELECTION_ORDER.indexOf(right.family) || left.ply - right.ply || left.targets.join(",").localeCompare(right.targets.join(",")) || left.edgeMoveUci.localeCompare(right.edgeMoveUci) || left.occurrenceId.localeCompare(right.occurrenceId))[0];
    const frozen = JSON.parse(readFileSync(new URL("planning/evidence-foundation-ux/d1397-hint-relation-results.json", ROOT), "utf8")) as { readonly rows: readonly { readonly positionId: string; readonly arm: string; readonly strictHorizon: { readonly candidate: { readonly occurrenceId: string } } | null }[] };
    // The swap relabels exactly one frozen selection (depth-12 row 43): the same edge and targets, now
    // named by the fork-survival statement that derives from that double attack. Every other selection
    // is byte-identical to D1397's.
    const relabelled: string[] = [];
    for (const row of source.rows) {
      const expected = frozen.rows.find((candidate) => candidate.positionId === row.positionId && candidate.arm === row.arm)!;
      const mine = pick(row.candidateOccurrences);
      if ((mine?.occurrenceId ?? null) === (expected.strictHorizon?.candidate.occurrenceId ?? null)) continue;
      const theirs = row.candidateOccurrences.find((value) => value.occurrenceId === expected.strictHorizon?.candidate.occurrenceId)!;
      expect([mine?.family, theirs.family, mine?.edgeMoveUci, mine?.ply, mine?.targets]).toEqual(["fork_survives_reply", "double_attack", theirs.edgeMoveUci, theirs.ply, theirs.targets]);
      relabelled.push(`${row.arm}:${row.positionId}`);
    }
    expect(relabelled).toEqual(["depth12:43:trajectory-qgd-exchange-minority:a30efb5f5469"]);
  });
});

describe("criteria 2–5 — occurrence identity, perspective, sign and relation", () => {
  it("every family has a permanent positive through the real selector and packet", () => {
    const observed = Object.fromEntries(HINT_FAMILIES.map((family) => {
      const fixture = HINT_FAMILY_POSITIVES[family];
      const line = sealedHintLine(fixture.fen, fixture.moves);
      const packets = hintPackets(line);
      const horizons = HINT_FAMILIES.flatMap((candidate) => {
        const selection = selectHintHorizon({ root: { ...HINT_ROOT, fen: fixture.fen }, line, packets });
        return selection.kind === "selected" && selection.horizon.payload.family === candidate ? [candidate] : [];
      });
      return [family, horizons[0]];
    }));
    // Double attack and fork survival share one geometry: the more specific survival statement wins.
    expect(observed).toEqual({ mate_in_one: "mate_in_one", forced_mate: "forced_mate", double_attack: "fork_survives_reply", fork_survives_reply: "fork_survives_reply", discovered_executed: "discovered_executed", loose_piece: "loose_piece", promotion_pressure: "promotion_pressure" });
    const loose = selected(HINT_FAMILY_POSITIVES.loose_piece).payload;
    expect(loose).toMatchObject({ family: "loose_piece", relation: "root_direct", occurrencePly: 1, signOrStatus: "lost", targetSquares: ["e4"], actor: { color: "white", role: "knight", square: "e4" }, firstMove: { uci: "e4c3", san: "Nc3" } });
  });

  it("hard negatives: self-exposure, opponent-line forks and non-persistent promotion never select", () => {
    expect(selectFixture(HINT_SELF_EXPOSURE.fen, HINT_SELF_EXPOSURE.moves)).toEqual({ kind: "empty", reason: "no_admitted_occurrence", admitted: 0 });
    expect(selectFixture(HINT_OPPONENT_LINE.fen, HINT_OPPONENT_LINE.moves)).toEqual({ kind: "empty", reason: "no_admitted_occurrence", admitted: 0 });
    // A black king in the square of the pawn: promotion is not reply-persistent.
    expect(selectFixture("8/P7/1k6/8/8/8/8/7K w - - 0 1", ["h1g2"]).kind).toBe("empty");
  });

  it("root_followup_in_line is a separate identity from root_direct and renders the exact qualifier", () => {
    const followup = selected(HINT_FOLLOWUP).payload;
    expect(followup).toMatchObject({ relation: "root_followup_in_line", occurrencePly: 3, firstMove: { uci: "h7h6" } });
    const direct = selected(HINT_FAMILY_POSITIVES.double_attack).payload;
    expect(direct.relation).toBe("root_direct");
    const sentence = hintSentence(compileHintDisclosure(selected(HINT_FOLLOWUP), "distance").payload);
    expect(sentence).toContain("on your next turn in this searched line");
    expect(sentence).not.toMatch(/\b(because|sets up|prevents|best|recommended)\b/u);
    expect(hintSentence(compileHintDisclosure(selected(HINT_FAMILY_POSITIVES.double_attack), "distance").payload)).toContain("after this move");
  });

  it("[D1640] the horizon compiler refuses forged, rebuilt and crossed authorities before disclosure", () => {
    const fixture = HINT_FAMILY_POSITIVES.double_attack;
    const line = sealedHintLine(fixture.fen, fixture.moves);
    const packets = hintPackets(line);
    const good = selectHintHorizon({ root: { ...HINT_ROOT, fen: fixture.fen }, line, packets });
    if (good.kind !== "selected") throw new Error("expected selection");
    expect(hintHorizonOwner(good.horizon)).toMatchObject({ runId: "hint-run", nodeId: "n0", sourceProjection: "derived.tactic.fork_survives_reply@1" });
    // Literal, spread, JSON and double-asserted horizons fail.
    for (const forged of [{ ...good.horizon }, JSON.parse(JSON.stringify(good.horizon)), { projection: good.horizon.projection, payload: good.horizon.payload } as unknown as SealedHintHorizon]) {
      expect(() => compileHintDisclosure(forged as SealedHintHorizon, "move")).toThrow();
    }
    // A correctly sealed horizon minted outside the selector (a rebuilt occurrence) is refused.
    const doubleAttack = (invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", { beforeFen: fixture.fen, moveUci: "b4c2", afterFen: "4k3/8/8/8/8/8/2n5/R3K3 w - - 1 2" } as never) as readonly DeclaredEvidence<unknown>[])[0]!;
    const rebuilt = (invokeEvidenceValueRoute("derived.hint.horizon.double_attack@1", { line, source: doubleAttack, ply: 1 } as never) as { readonly value: SealedHintHorizon }).value;
    expect(rebuilt.payload.family).toBe("double_attack");
    expect(() => compileHintDisclosure(rebuilt, "pattern")).toThrow(/HINT_HORIZON_IDENTITY/u);
    // A line for another root, a crossed packet, an opponent ply and a value-unverified line all fail.
    expect(() => selectHintHorizon({ root: { ...HINT_ROOT, fen: HINT_FAMILY_POSITIVES.loose_piece.fen }, line, packets })).toThrow(/HINT_HORIZON_IDENTITY/u);
    expect(() => selectHintHorizon({ root: { ...HINT_ROOT, fen: fixture.fen }, line, packets: hintPackets(sealedHintLine(HINT_FAMILY_POSITIVES.loose_piece.fen, HINT_FAMILY_POSITIVES.loose_piece.moves)) })).toThrow(/HINT_HORIZON_IDENTITY/u);
    expect(() => invokeEvidenceValueRoute("derived.hint.horizon.double_attack@1", { line, source: doubleAttack, ply: 2 } as never)).toThrow();
    expect(() => selectHintHorizon({ root: { ...HINT_ROOT, fen: fixture.fen }, line: identitySealedEvidenceWithoutValueReceipt(line.producer, line.projection, line.payload), packets })).toThrow();
    // A source from another edge cannot be joined to this line.
    const otherEdge = (invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", { beforeFen: HINT_FOLLOWUP.fen, moveUci: "b4c2", afterFen: "4k3/7p/8/8/8/8/2n4P/R3K3 w - - 1 2" } as never) as readonly DeclaredEvidence<unknown>[])[0]!;
    expect(() => invokeEvidenceValueRoute("derived.hint.horizon.double_attack@1", { line, source: otherEdge, ply: 1 } as never)).toThrow(/HINT_HORIZON_IDENTITY/u);
  });
});

describe("criteria 6–8 — five sealed byte images and the exact declaration registry", () => {
  it("serialised packets are cumulative; every higher-field sentinel is absent from every lower packet", () => {
    const horizon = selected(HINT_FAMILY_POSITIVES.loose_piece);
    const packets = Object.fromEntries(HINT_RUNGS.map((rung) => [rung, JSON.stringify(compileHintDisclosure(horizon, rung).payload)])) as Record<HintRung, string>;
    expect(Object.keys(JSON.parse(packets.pattern))).toEqual(["rung", "family", "attribution"]);
    for (const [field, from] of [["targetSquares", "square"], ["actor", "piece"], ["relation", "distance"], ["occurrencePly", "distance"], ["firstMove", "move"]] as const) {
      for (const rung of HINT_RUNGS) expect(packets[rung].includes(`"${field}"`), `${rung}/${field}`).toBe(HINT_RUNGS.indexOf(rung) >= HINT_RUNGS.indexOf(from));
    }
    // The first-move bytes (UCI and SAN) appear only in the move packet.
    for (const rung of HINT_RUNGS) expect(/e4c3|Nc3/u.test(packets[rung]), rung).toBe(rung === "move");
    // Only compileHintDisclosure mints the brand.
    const disclosure = compileHintDisclosure(horizon, "square");
    expect(() => assertHintDisclosurePacket(disclosure)).not.toThrow();
    for (const forged of [{ ...disclosure }, JSON.parse(JSON.stringify(disclosure)), invokeEvidenceValueRoute("derived.hint.disclosure.loose_piece.square@1", { horizon } as never)]) expect(() => assertHintDisclosurePacket(forged)).toThrow();
  });

  it("the F1 graph declares the weakest tuple, per-rung answers and forms; widening fails the real compiler", () => {
    const projections = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [key(projection), projection]));
    for (const row of HINT_DECLARATION_MATRIX) {
      const horizon = projections.get(`derived.hint.horizon.${row.family}@1`)!;
      expect([horizon.grounding, horizon.exactness, horizon.confidence, horizon.disposition?.kind]).toEqual(["declared_convention", "measured", "reported", "operator_only"]);
      expect(horizon.derivation?.inputs?.map(key)).toEqual([key(row.source), "live.stockfish.principal_variation@1"]);
      expect(horizon.abstention.reasons).toContain("input_abstained");
      for (const rung of HINT_RUNGS) {
        const disclosure = projections.get(`${hintDisclosureProjectionId(row.family, rung)}@1`)!;
        expect(disclosure.answerContent).toEqual(row.rungAnswers[rung]);
        expect(disclosure.answerContent.includes("move")).toBe(rung === "move");
        expect(disclosure.answerContent.some((answer) => ["evaluation", "principal_variation", "ranked_moves", "theory"].includes(answer))).toBe(false);
        expect(disclosure.forms.includes("arrows")).toBe(rung === "move");
      }
    }
    // Only discovered execution carries the `pattern` answer token: the rung name manufactures none.
    expect(HINT_DISCLOSURE_PROJECTION_IDS.filter((value) => projections.get(key(value))!.answerContent.includes("pattern")).map((value) => value.id.split(".")[3])).toEqual(Array(5).fill("discovered_executed"));
    expect(HINT_DISCLOSURE_BY_RUNG.move).toHaveLength(7);
    const widen = (change: (projection: typeof PRIMARY_EVIDENCE_MANIFEST.projections[number]) => typeof PRIMARY_EVIDENCE_MANIFEST.projections[number]) => compileEvidenceManifest({
      ...EVIDENCE_CONTRACT_DECLARATIONS,
      producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map((producer) => producer.id !== "derived.hint" ? producer : { ...producer, outputs: producer.outputs.map((projection) => projection.id === "derived.hint.disclosure.mate_in_one.pattern" || projection.id === "derived.hint.horizon.mate_in_one" ? change(projection) : projection) }),
    });
    const widens = expect.objectContaining({ code: "EVIDENCE_DERIVATION_WIDENS" });
    expect(() => widen((projection) => projection.id.includes("disclosure") ? { ...projection, answerContent: [...projection.answerContent, "pattern"] } : projection)).toThrowError(widens);
    expect(() => widen((projection) => projection.id.includes("disclosure") ? { ...projection, answerContent: [...projection.answerContent, "evaluation"] } : projection)).toThrowError(widens);
    expect(() => widen((projection) => projection.id.includes("horizon") ? { ...projection, exactness: "exact" as const } : projection)).toThrowError(widens);
    expect(() => widen((projection) => projection.id.includes("horizon") ? { ...projection, grounding: "position_rules" as const } : projection)).toThrowError(widens);
    expect(() => widen((projection) => projection.id.includes("horizon") ? { ...projection, derivation: { inputs: [{ id: "rules.tactic.consequence.mate_in_one", version: 1 }] } } : projection)).toThrowError(expect.objectContaining({ code: "EVIDENCE_DERIVATION_WIDENS" }));
  });

  it("per-family/per-rung renderers are set-equal to the registry; no generic or wildcard projection exists", () => {
    expect(Object.keys(HINT_DISCLOSURE_RENDERERS).sort()).toEqual(HINT_DISCLOSURE_PROJECTION_IDS.map(key).sort());
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.filter((projection) => projection.id.startsWith("derived.hint.")).map(key).sort()).toEqual([...HINT_HORIZON_PROJECTION_IDS, ...HINT_DISCLOSURE_PROJECTION_IDS].map(key).sort());
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.some((projection) => /derived\.hint\.(target|\*)/u.test(projection.id))).toBe(false);
  });

  it("[recorded-semantic-path D7] hypothetical-line semantics never read a recorded projection", () => {
    for (const file of ["hint-distance.ts", "hint-horizon.ts", "hint-registry.ts", "hint-exchange.ts"]) {
      const text = readFileSync(new URL(`packages/runtime/src/${file}`, ROOT), "utf8");
      expect(text, file).not.toMatch(/from "\.\/recorded-(semantic-path|edge|reading)\.js"|"run\.record\./u);
    }
    for (const projection of PRIMARY_EVIDENCE_MANIFEST.projections.filter((value) => value.id.startsWith("derived.hint."))) {
      expect((projection.derivation?.inputs ?? []).some((input) => input.id.startsWith("run.record.") || input.id.startsWith("recorded."))).toBe(false);
    }
  });
});

describe("criteria 9, 12 (runtime) — one rendered authority, voice check and the closed receipt", () => {
  const horizon = () => selected(HINT_FAMILY_POSITIVES.double_attack);
  const rendered = (rung: HintRung) => {
    const packet = compileGuidedHintPacket({ disclosure: compileHintDisclosure(horizon(), rung), role: "learner", session: "position" });
    if (packet.kind !== "rendered") throw new Error("expected a rendered packet");
    return packet;
  };

  it("admits exactly one item through module.guided_hint and refuses a spectator or Match", () => {
    const packet = rendered("piece");
    expect(packet.view.items).toHaveLength(1);
    expect(packet.view.items[0]!.sentences[0]).toBe("A Stockfish 19 search from here (depth 12) finds a double attack that still stands after every reply for you. It involves a1 and e1. The piece involved is your knight on b4.");
    expect(compileGuidedHintPacket({ disclosure: compileHintDisclosure(horizon(), "piece"), role: "spectator", session: "position" })).toMatchObject({ kind: "refused", reason: "role_outside_ceiling" });
    expect(compileGuidedHintPacket({ disclosure: compileHintDisclosure(horizon(), "piece"), role: "learner", session: "match" })).toMatchObject({ kind: "refused", reason: "session_outside_ceiling" });
  });

  it("voiceCheck refuses absent squares, a different move, judgements and causality; the canonical sentence passes", () => {
    const square = rendered("square");
    const canonical = square.view.items[0]!.sentences[0]!;
    expect(hintVoiceCheck(square.view, canonical)).toEqual({ valid: true, violations: [] });
    expect(hintVoiceCheck(square.view, "There is a double attack on a1 and e1, and c2 matters.").violations).toContain("square:c2");
    expect(hintVoiceCheck(rendered("move").view, "Play Nd3 to attack a1 and e1.").valid).toBe(false);
    expect(hintVoiceCheck(square.view, "The best idea is a double attack on a1 and e1.").violations).toContain("hint:best");
    expect(hintVoiceCheck(rendered("distance").view, "A double attack on a1 and e1 appears because the knight moves.").violations).toContain("hint:because");
  });

  it("the delivery receipt is closed, digest-checked and rung-exact; tampering fails the browser parser", () => {
    const run = revealFeedback(positionRun("hint-run", HINT_FAMILY_POSITIVES.double_attack.fen, "black"), "2026-09-24T12:00:01.000Z").run;
    const decision = hintDecisionStamp(run);
    const voice = { state: "not_requested" as const };
    const receipt = compileHintDeliveryReceipt({ requestId: "a".repeat(32), runId: run.id, decision, packet: rendered("move"), voice });
    expect(receipt.marks).toEqual({ rung: "move", squares: ["a1", "e1"], piece: { color: "black", role: "knight", square: "b4" }, arrow: { from: "b4", to: "c2" } });
    expect(parseHintDeliveryReceipt(JSON.parse(JSON.stringify(receipt)))).toEqual(receipt);
    expect(parseHintResponse({ state: "available", delivery: receipt })).toEqual({ state: "available", delivery: receipt });
    const lower = compileHintDeliveryReceipt({ requestId: "b".repeat(32), runId: run.id, decision, packet: rendered("pattern"), voice });
    expect(JSON.stringify(lower)).not.toMatch(/"(squares|piece|arrow)"|b4c2|Nc2/u);
    const retag = (value: typeof receipt, change: Record<string, unknown>) => { const { receiptDigest: _digest, ...body } = { ...value, ...change } as Record<string, unknown>; return { ...body, receiptDigest: hintReceiptDigest(body as never) }; };
    // A higher-rung byte in a lower receipt, an extra field, a crossed projection id and a bad digest all fail.
    expect(() => parseHintDeliveryReceipt(retag(lower, { marks: { rung: "pattern", squares: ["a1"] } }))).toThrow(/HINT_EXCHANGE_INVALID/u);
    expect(() => parseHintDeliveryReceipt(retag(lower, { seal: true }))).toThrow(/HINT_EXCHANGE_INVALID/u);
    expect(() => parseHintDeliveryReceipt(retag(lower, { projectionId: "derived.hint.disclosure.loose_piece.pattern" }))).toThrow(/HINT_EXCHANGE_INVALID/u);
    expect(() => parseHintDeliveryReceipt({ ...receipt, rendered: { ...receipt.rendered, sentence: "Play Nc2." } })).toThrow(/digest/u);
    // A RenderedEvidenceView never crosses: JSON of the view carries no seal and no receipt shape.
    expect(() => parseHintDeliveryReceipt(JSON.parse(JSON.stringify(rendered("move").view)))).toThrow();
    // Voice fallback keeps the hint available with byte-identical deterministic text.
    const fallback = compileHintDeliveryReceipt({ requestId: "c".repeat(32), runId: run.id, decision, packet: rendered("square"), voice: { state: "fallback", reason: "deadline_exceeded" } });
    expect(fallback.rendered.sentence).toBe(rendered("square").view.items[0]!.sentences[0]);
  });
});

describe("criteria 10–11 — ceiling versus availability, and per-decision progression", () => {
  it("the ceiling gate refuses above-ceiling, inactive, closed and rated requests; availability is never a term", () => {
    const base = { ceiling: "distance" as const, moduleActive: true, deliveryOpen: true, learnerToMove: true, ratedGameOpen: false };
    expect(hintPolicyDecision({ ...base, rung: "distance" })).toEqual({ kind: "allowed" });
    expect(hintPolicyDecision({ ...base, rung: "move" })).toEqual({ kind: "refused", reason: "above_ceiling" });
    expect(hintPolicyDecision({ ...base, rung: "pattern", moduleActive: false })).toEqual({ kind: "refused", reason: "module_inactive" });
    expect(hintPolicyDecision({ ...base, rung: "pattern", deliveryOpen: false })).toEqual({ kind: "refused", reason: "disclosure_closed" });
    expect(hintPolicyDecision({ ...base, rung: "pattern", ratedGameOpen: true })).toEqual({ kind: "refused", reason: "rated_game_open" });
    expect(hintPolicyDecision({ ...base, rung: "pattern", ceiling: "off" })).toEqual({ kind: "refused", reason: "above_ceiling" });
  });

  it("Hint then A little more advances one rung per exact decision; commit, rewind and reveal reset it", () => {
    let run = positionRun("ladder", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "white");
    const closed = hintDecisionStamp(run);
    expect(closed.disclosureBoundarySeq).toBeNull();
    run = revealFeedback(run, "2026-09-24T12:00:01.000Z").run;
    const open = hintDecisionStamp(run);
    expect(open.disclosureBoundarySeq).not.toBeNull();
    expect(open.digest).not.toBe(closed.digest);
    let state = { decisionDigest: open.digest, revealed: null as HintRung | null };
    const climbed: HintRung[] = [];
    for (let rung = nextHintRung(state, open.digest, "distance"); rung !== undefined; rung = nextHintRung(state, open.digest, "distance")) { climbed.push(rung); state = { decisionDigest: open.digest, revealed: rung }; }
    expect(climbed).toEqual(["pattern", "square", "piece", "distance"]);
    const root = run.activeCursor.nodeId;
    const moved = commitMove(run, "e2e4", { at: "2026-09-24T12:00:02.000Z" }).run;
    expect(hintDecisionStamp(moved).digest).not.toBe(open.digest);
    expect(nextHintRung(state, hintDecisionStamp(moved).digest, "distance")).toBe("pattern");
    // Returning to the same node after another event is a different decision.
    const back = rewind(moved, root, "2026-09-24T12:00:03.000Z").run;
    expect(back.activeCursor.nodeId).toBe(root);
    expect(hintDecisionStamp(back).digest).not.toBe(open.digest);
    expect(nextHintRung(undefined, open.digest, "off")).toBeUndefined();
  });

  it("the web imports no rung/source select: the ordinary control copy names no rung, PV or producer", () => {
    const seat = readFileSync(new URL("apps/web/src/lib/GuidedHintSeat.svelte", ROOT), "utf8");
    expect(seat).toContain("A little more");
    expect(seat).not.toMatch(/<select|stage 2|\bPV\b|semantic event|Stockfish/u);
  });
});

describe("evidence-presentation Checkpoint B — the module.guided_hint seat adapters", () => {
  it("every family x rung disclosure presents through its exact adapter with the canonical sentence and only its rung's marks", () => {
    for (const family of HINT_FAMILIES) {
      const horizon = selected(HINT_FAMILY_POSITIVES[family]);
      for (const rung of HINT_RUNGS) {
        const disclosure = compileHintDisclosure(horizon, rung);
        const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.guided_hint", version: 1 }, [disclosure]));
        const bytes = JSON.stringify(items);
        expect(bytes, `${family}/${rung}`).toContain(JSON.stringify(hintSentence(disclosure.payload)).slice(1, -1));
        expect(bytes.includes("\"moves_to\""), `${family}/${rung}`).toBe(rung === "move");
      }
    }
  });
});

describe("criterion 14 — no optional answer bypass (module compiler)", () => {
  it("every disclosure row carries its exact answer image; a PV or horizon cannot become a module item", () => {
    const disclosure: DeclaredEvidence<HintDisclosurePayload> = compileHintDisclosure(selected(HINT_FAMILY_POSITIVES.promotion_pressure), "move");
    expect(disclosure.projection.id).toBe("derived.hint.disclosure.promotion_pressure.move");
    const line = sealedHintLine(HINT_FAMILY_POSITIVES.promotion_pressure.fen, HINT_FAMILY_POSITIVES.promotion_pressure.moves);
    expect(() => compileGuidedHintPacket({ disclosure: line as never, role: "learner", session: "position" })).toThrow();
    expect(() => compileGuidedHintPacket({ disclosure: selected(HINT_FAMILY_POSITIVES.promotion_pressure) as never, role: "learner", session: "position" })).toThrow();
  });
});
