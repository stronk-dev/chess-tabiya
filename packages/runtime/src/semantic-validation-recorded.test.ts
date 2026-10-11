// D3705: exact recorded facts, not “trade is good”, contact intent or forced continuation.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { makeFen } from "chessops/fen";
import { makeSquare, opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { evidenceDigest } from "./evidence-contract.js";
import { positionFromFen } from "./position-cache.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { RECORDED_CITED_SOURCES } from "./semantic-validation-literal-sources.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase, type SemanticRecordedPathInput } from "./semantic-validation.js";

const raw = (JSON.parse(readFileSync(resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8")) as { cases: Record<string, unknown>[] }).cases;
const byId = new Map(raw.map(row => { const value = parseSemanticValidationCase(row); return [value.id, value] as const; }));
const rows = RECORDED_CITED_SOURCES.flatMap(source => source.cases);

// Neutral occupancy and legal replay only. No production transition/capture, pawn-contact,
// recorded-path detector or evidence factory is used to compute the expected facts.
function replay(input: SemanticRecordedPathInput) {
  return input.edges.map(edge => {
    const before = positionFromFen(edge.beforeFen).clone(), move = parseUci(edge.moveUci);
    if (move === undefined || !("from" in move)) throw new Error("ordinary recorded move required");
    expect(before.isLegal(move), edge.moveUci).toBe(true);
    const mover = before.board.get(move.from)!;
    const enPassant = mover.role === "pawn" && move.from % 8 !== move.to % 8 && !before.board.has(move.to);
    const removed = enPassant ? move.to + (mover.color === "white" ? -8 : 8) : move.to;
    const victim = before.board.get(removed);
    const captured = victim?.color === opposite(mover.color) ? victim : undefined;
    const after = before.clone(); after.play(move);
    expect(makeFen(after.toSetup())).toBe(edge.afterFen);
    return { edge, before, after, move, mover, captured, removed, enPassant };
  });
}

describe("D3705 independent recorded exchange and pawn-contact cases", () => {
  it.each(rows)("$proposition.case.id has exact production identities and timing", async row => {
    const value = byId.get(row.proposition.case.id);
    expect(value, `missing canonical case ${row.proposition.case.id}`).toBeDefined();
    expect(value!.input).toEqual(row.input);
    expect(value!.operation).toEqual({ id: "runtime.semantic.recorded_path", version: 1 });
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, failure: null });
    // This operation returns sequence events, not its per-edge capture/check probes.
    // Legal replay and the explicit capture/contact controls below prove the negative
    // reached a completed populated path; do not require an unrelated sequence motif.
    const edges = replay(row.input);
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.recorded_path"].invoke(row.input);
    const targets = selectSemanticTargets(result, row.proposition.subject);
    if (row.proposition.subject.projection.id === "derived.exchange.trade_completed") {
      const expected = edges.slice(0, -1).flatMap((first, index) => {
        const second = edges[index + 1]!;
        if (first.captured === undefined || second.captured === undefined || first.move.to !== second.move.to) return [];
        expect(second.captured).toEqual(first.mover);
        return [{ startFen: first.edge.beforeFen, firstMoveUci: first.edge.moveUci, boundaryFen: first.edge.afterFen,
          secondMoveUci: second.edge.moveUci, endFen: second.edge.afterFen, landingSquare: makeSquare(first.move.to),
          first: { family: "capture", from: makeSquare(first.move.from), to: makeSquare(first.move.to), mover: { color: first.mover.color, role: first.mover.role }, captured: { color: first.captured.color, role: first.captured.role }, enPassant: first.enPassant },
          second: { family: "capture", from: makeSquare(second.move.from), to: makeSquare(second.move.to), mover: { color: second.mover.color, role: second.mover.role }, captured: { color: second.captured.color, role: second.captured.role }, enPassant: second.enPassant },
        }];
      });
      expect(targets).toHaveLength(expected.length);
      expect(targets.map(observationEvidence).map(evidence => evidence.payload)).toEqual(expected.map(payload => expect.objectContaining({ ...payload,
        first: expect.objectContaining({ ...payload.first, captured: expect.objectContaining(payload.first.captured) }),
        second: expect.objectContaining({ ...payload.second, captured: expect.objectContaining(payload.second.captured) }),
      })));
      targets.forEach((target, index) => {
        const payload = observationEvidence(target).payload as { moveAnchors: { beforeFen: string; moveUci: string; afterFen: string }[] };
        expect(payload.moveAnchors).toHaveLength(2);
        expect(payload.moveAnchors.map(({ beforeFen, moveUci, afterFen }) => ({ kind: "edge", beforeFen, moveUci, afterFen })))
          .toEqual(row.input.edges.slice(index, index + 2));
      });
      if (row.proposition.case.id.includes("en-passant")) {
        expect(edges[0]!.enPassant).toBe(true);
        expect(edges[0]!.removed).not.toBe(edges[0]!.move.to);
        expect(edges[0]!.after.board.has(edges[0]!.removed)).toBe(false);
      }
      if (row.proposition.case.id.includes("negative")) {
        expect(expected).toEqual([]);
        expect(edges.filter(edge => edge.captured !== undefined)).toHaveLength(2);
      }
    } else {
      const first = edges[0]!, reply = edges[1]!;
      const color = first.mover.color;
      const direction = color === "white" ? 1 : -1;
      const atContact = first.move.to;
      const contacts = [...first.after.board].filter(([square, piece]) => piece.color === opposite(color) && piece.role === "pawn" &&
        Math.abs(square % 8 - atContact % 8) === 1 && Math.floor(square / 8) - Math.floor(atContact / 8) === direction);
      const created = first.mover.role === "pawn" && contacts.length > 0;
      const survived = created && reply.after.board.get(atContact)?.color === color && reply.after.board.get(atContact)?.role === "pawn" &&
        contacts.some(([square, piece]) => evidenceDigest(reply.after.board.get(square) ?? null) === evidenceDigest(piece));
      expect(survived).toBe(row.arm === "positive");
      expect(targets).toHaveLength(row.arm === "semantic_negative" ? 0 : edges.length === 3 ? 2 : 1);
      if (row.arm === "positive") {
        const contact = contacts[0]!;
        const expectedPawn = { color, from: makeSquare(first.move.from), contactSquare: makeSquare(atContact) };
        const expectedTarget = { square: makeSquare(contact[0]), piece: contact[1] };
        expect(targets.map(observationEvidence).map(evidence => evidence.payload)).toEqual(["created_survived_reply", ...(edges.length === 3 ? ["created_executed_next_own_move"] : [])].map(kind => expect.objectContaining({ kind, pawn: expectedPawn, contactedPawn: expectedTarget })));
        targets.forEach((target, index) => {
          const payload = observationEvidence(target).payload as { anchors: { beforeFen: string; moveUci: string; afterFen: string; beforeNodeId: string; afterNodeId: string }[]; nodes: { nodeId: string; fen: string }[] };
          const horizon = index + 2;
          expect(payload.anchors.map(({ beforeFen, moveUci, afterFen }) => ({ kind: "edge", beforeFen, moveUci, afterFen }))).toEqual(row.input.edges.slice(0, horizon));
          expect(payload.nodes.map(node => node.fen)).toEqual([first.edge.beforeFen, ...row.input.edges.slice(0, horizon).map(edge => edge.afterFen)]);
          expect(payload.nodes.map(node => node.nodeId)).toEqual([payload.anchors[0]!.beforeNodeId, ...payload.anchors.map(anchor => anchor.afterNodeId)]);
        });
        if (edges.length === 3) {
          expect(edges[2]!.move.from).toBe(atContact); expect(edges[2]!.move.to).toBe(contact[0]);
          expect(edges[2]!.captured).toEqual(contact[1]);
        }
      } else if (row.proposition.case.id.includes("not-created")) {
        expect(first.mover.role).toBe("king"); expect(edges[2]!.captured?.role).toBe("pawn");
      } else {
        expect(created).toBe(true);
        if (row.proposition.case.id.includes("pawn-captured")) expect(reply.captured).toEqual(first.mover);
        else expect(reply.move.from).toBe(contacts[0]![0]);
      }
    }
  });

  it.each(RECORDED_CITED_SOURCES)("$sourceId admits only its declared case arms", async source => {
    const subject = source.cases[0]!.proposition.subject;
    const profile = SEMANTIC_VALIDATION_PROFILES.find(profile => evidenceDigest(profile.subject) === evidenceDigest(subject))!;
    for (const [cell, arm] of [[profile.positive, "positive"], [profile.semanticNegative, "semantic_negative"]] as const) {
      expect(cell).toMatchObject({ disposition: "present", refs: source.cases.filter(row => row.arm === arm).map(row => ({ id: row.proposition.case.id })) });
    }
    expect(profile.orientation.disposition).toBe("required");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    const value = byId.get(source.cases[0]!.proposition.case.id)!;
    const other = byId.get(source.cases[1]!.proposition.case.id)!;
    for (const edit of [{ input: other.input }, { expectation: source.cases.find(row => row.arm === "semantic_negative")!.proposition.expectation, arm: "semantic_negative" },
      { subject: { kind: "event", projection: { id: subject.projection.id, version: 1 } } }]) {
      expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...value, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
    expect(() => parseSemanticValidationCase({ ...value, operation: { id: "runtime.semantic.local_edge", version: 1 } })).toThrow("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID");
  });

  it("preserves all 229 predecessor cases unchanged and adds exactly twenty", () => {
    const ids = new Set(rows.map(row => row.proposition.case.id));
    const added = raw.filter(row => ids.has(row.id as string));
    expect(added).toHaveLength(20);
    expect(added.filter(row => row.arm === "positive")).toHaveLength(10);
    expect(added.filter(row => row.arm === "semantic_negative")).toHaveLength(10);
    const prior = raw.filter(row => !ids.has(row.id as string));
    expect(prior).toHaveLength(229);
    expect(evidenceDigest(prior)).toBe("35a8afec8943785b40f4ef99998f2a57c51b003f3cc56e2a1e2bcc0a7cd729c0");
  });
});
