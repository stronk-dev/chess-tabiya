// D4095 production regression: genuine sources and authenticated requests, synthetic legal
// positions. Only the former-order comparison is test-local; the candidate is real production.
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ShapeEntryDefinition } from "../../../packages/schema/src/shape-entry/index.js";
import { commitMove, fork, revealFeedback } from "../../../packages/runtime/src/runtime.js";
import { branchPath } from "../../../packages/runtime/src/branch-path.js";
import { mirrorSemanticUci } from "../../../packages/runtime/src/semantic-validation.js";
import { recordedSequenceWindowFixture } from "../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";
import { registeredShapeFixture } from "../../../packages/runtime/src/testing/registered-shape-fixture.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import { MODULE_REGISTRY } from "../../../packages/runtime/src/module-registry.js";
import { evidenceForConsumer } from "../../../packages/runtime/src/evidence-contract.js";
import { compileAssistanceRequest } from "../../../packages/runtime/src/assistance-exchange.js";
import { CONFIGURABLE_MODULE_IDS } from "../../../packages/runtime/src/presets.js";
import { presentEvidenceItems } from "../../../packages/runtime/src/presentation-contract.js";
import { fitModulePresentation } from "../../../packages/runtime/src/module-query.js";
import { admitModuleFacts, moduleFact, orderAdmittedFacts, dedupeByFactIdentity, applyDeclaredSubsumption,
  applyPositionNovelty, applyBackstop, type ModuleFact } from "../../../packages/runtime/src/module-reducers.js";
import * as packets from "../../../packages/runtime/src/module-packets.js";
import { parseModuleQueryPage } from "../../web/src/lib/module-query-response.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { IdentityService } from "./identity.js";
import { ShapeRegistry } from "./shape-registry.js";
import { createRestHandler } from "./rest.js";

const at = "2026-11-05T00:00:00.000Z", declaration = MODULE_REGISTRY.byId.get("structure_nudge")!;
const refs = (facts: readonly ModuleFact[]) => facts.map(f => `${f.evidence.projection.id}@${f.evidence.projection.version}`);
const recognition = new Set(["rules.structural.reading.named_structure@2", "theory.endgame.setup_match@1", "theory.shapes.firing@3"]);
const standard = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
// The catalogue deliberately names only White's Maroczy. IQP has explicit White/Black entries,
// so these actual named positives can exercise both colors without inventing a mirrored name.
const named = "r1bq1rk1/pp2bppp/2n1pn2/8/3P4/2NB1N2/PP3PPP/R1BQ1RK1 w - - 0 10";
const lucena = "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1";
const cases = [
  { id: "authored", fen: standard, moves: ["g1f3"], shape: "f3", expected: "theory.shapes.firing@3" },
  { id: "named", fen: named, moves: ["c3b5"], expected: "rules.structural.reading.named_structure@2" },
  { id: "named-authored", fen: named, moves: ["c3b5"], shape: "b5", expected: "rules.structural.reading.named_structure@2" },
  { id: "setup", fen: lucena, moves: ["c1c2"], expected: "theory.endgame.setup_match@1" },
  { id: "setup-authored", fen: lucena, moves: ["c1c2"], shape: "c2", expected: "theory.endgame.setup_match@1" },
  { id: "generic", fen: standard, moves: ["e2e4"] },
  { id: "unavailable", fen: standard, moves: ["e2e4"] },
  { id: "material-positive", fen: "1K1k4/8/1P6/8/8/8/r7/2R5 w - - 0 1", moves: ["c1c2"] },
  { id: "material-null", fen: "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1", moves: ["e1d1"] },
  { id: "unclear", fen: "r2qk3/pppppppp/8/8/8/8/PPPPPPPP/R2QK3 w - - 0 1", moves: ["a2a3"] },
  { id: "overlong", fen: standard, moves: ["g1f3"], shape: "f3", expected: "theory.shapes.firing@3" },
  { id: "repeated", fen: standard, moves: ["g1f3", "a7a6", "f3g1", "b7b6", "g1f3"], shape: "f3", expected: "theory.shapes.firing@3" },
] as const;
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });

describe("D4095 actual full-source recognition selection", () => {
  it("pins actual current consumer and the complete seven-ref image", () => {
    expect(declaration.consumer).toEqual({ id: "module.structure_nudge", version: 2 });
    if (declaration.accepts.kind !== "manifest") throw Error("Actual Structure unavailable");
    expect(declaration.accepts.projections.map(p => `${p.projection.id}@${p.projection.version}`).sort()).toEqual([
      ...recognition, "rules.structural.reading.space@1", "rules.structural.reading.pawn_connectivity@1",
      "rules.phase.reading@2", "rules.endgame.classification@1",
    ].sort());
  });
  for (const setup of cases) for (const black of [false, true]) for (const inherited of [false, true]) {
    it(`${setup.id}, black=${black}, inherited=${inherited}`, async () => {
      let run = recordedSequenceWindowFixture({ fen: setup.fen, moves: [] }, black, `structure-research-${setup.id}-${black}`);
      for (const [i, move] of setup.moves.entries()) run = commitMove(run,
        black ? mirrorSemanticUci(move, "color_and_vertical") : move, { at, actor: i % 2 ? "system" : "user" }).run;
      run = revealFeedback(run, at).run;
      if (inherited) run = fork(run, run.activeCursor.nodeId, { at }).run;
      const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
      const registry = new ShapeRegistry();
      if ("shape" in setup) {
        const square = black ? `${setup.shape[0]}${9 - Number(setup.shape[1])}` : setup.shape;
        const trigger = { kind: "pieceOnSquare", square, piece: { color: black ? "black" : "white", role: setup.shape === "c2" ? "rook" : "knight" } } as ShapeEntryDefinition["trigger"];
        await registry.add({ ...registeredShapeFixture(), phases: ["opening", "middlegame", "endgame"], trigger,
          ...(setup.id === "overlong" ? { name: Array.from({ length: 100 }, () => "pattern").join(" ") } : {}),
        }, "community", "coach_one");
      }
      const service = new RunService(storage, setup.id === "unavailable" ? {} : { shapeRegistry: registry });
      const identity = new IdentityService(storage, { cookieSecure: false,
        derive: async (secret, salt) => createHash("sha256").update(salt).update(secret).digest() });
      const handler = createRestHandler(service, undefined, undefined, identity);
      const registered = await handler(new Request("http://tabiya.test/auth/register", { method: "POST",
        headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "structure_research", password: "structure-research-password" }) }));
      expect(registered.status).toBe(201);
      const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!, learner = storage.learnerByHandle("structure_research")!;
      storage.create(run, { learnerId: learner.id, writerId: "structure-research-writer" });
      const saved = JSON.stringify(storage.read(run.id)), original = packets.compileModulePacket;
      let production = false;
      const stages: { request: packets.ModulePacketRequest; admitted: readonly ModuleFact[]; ordered: readonly ModuleFact[];
        novelty: ReturnType<typeof applyPositionNovelty>; kept: readonly ModuleFact[] }[] = [];
      vi.spyOn(packets, "compileModulePacket").mockImplementation(request => {
        const result = original(request);
        if (request.module !== "structure_nudge" || result.kind !== "packet") return result;
        const admitted = admitModuleFacts(declaration, PRIMARY_EVIDENCE_MANIFEST,
          evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, declaration.consumer!, request.evidence), request.timing);
        const formerDeclaration = { ...declaration, selection: { ...declaration.selection, policy: { id: "production.module_local", version: 1 } } };
        const ordered = orderAdmittedFacts(production ? declaration : formerDeclaration, admitted);
        if (request.mode === "admit") {
          if (production) { expect(result.facts).toEqual(ordered); return result; }
          return { ...result, facts: ordered };
        }
        const novelty = applyPositionNovelty(declaration, applyDeclaredSubsumption(dedupeByFactIdentity(ordered)), request.ancestorFacts);
        const kept = applyBackstop(declaration, novelty.facts, admitted.length, novelty.abstained);
        if (production) {
          stages.push({ request, admitted, ordered, novelty, kept });
          expect(result.facts).toEqual(kept); expect(result.noveltyAbstained).toBe(novelty.abstained);
          return result; // Actual policy/compiler result, no candidate substitution.
        }
        return { ...result, facts: kept, afterReducers: novelty.facts.length, noveltyAbstained: novelty.abstained,
          empty: kept.length === 0 ? declaration.emptyBehavior : null };
      });
      const assistance = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {},
        moduleOverrides: { include: ["structure_nudge"], exclude: CONFIGURABLE_MODULE_IDS.filter(id => id !== "structure_nudge") } } });
      const query = async () => {
        const response = await handler(new Request(`http://tabiya.test/runs/${run.id}/modules/query`, { method: "POST",
          headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ assistance,
            query: { timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: [] } }) }));
        const body = await response.json(); expect(response.status, JSON.stringify(body)).toBe(200);
        return parseModuleQueryPage(body, { runId: run.id, subjectNodeId: run.activeCursor.nodeId, finalDigest: body.page.effectiveConfigDigest })
          .packets.find(packet => packet.module === "structure_nudge")!;
      };
      const old = await query(); production = true; const candidate = await query();
      expect(stages).toHaveLength(1);
      const stage = stages[0]!;
      if (setup.id === "authored" && !black && !inherited) {
        const genuine = stage.admitted.find(f => f.evidence.projection.id === "theory.shapes.firing")!;
        expect(genuine.projection.exactness).toBe("authored");
        const replacement = { ...genuine.projection, exactness: "exact" as const };
        const forged = moduleFact({ ...PRIMARY_EVIDENCE_MANIFEST, projections: [replacement] }, genuine.evidence);
        expect(() => orderAdmittedFacts(declaration, [forged])).toThrow(/MODULE_FACT_DECLARATION/u);
        const mutable = { ...genuine.projection };
        const changed = moduleFact({ ...PRIMARY_EVIDENCE_MANIFEST, projections: [mutable] }, genuine.evidence);
        mutable.exactness = "exact";
        expect(() => orderAdmittedFacts(declaration, [changed])).toThrow(/MODULE_FACT_DECLARATION/u);
      }
      expect(refs(stage.admitted)).toContain("rules.phase.reading@2");
      const priorOrder = orderAdmittedFacts({ ...declaration, selection: { ...declaration.selection, policy: { id: "production.module_local", version: 1 } } }, stage.admitted);
      for (const inGroup of [false, true]) expect(stage.ordered.filter(f => recognition.has(refs([f])[0]!) === inGroup))
        .toEqual(priorOrder.filter(f => recognition.has(refs([f])[0]!) === inGroup));
      if ("expected" in setup) {
        expect(refs(stage.admitted)).toContain(setup.expected);
        expect(refs(stage.kept)).toEqual([setup.expected]);
        if (setup.id === "authored" || setup.id === "overlong" || setup.id === "repeated") expect(old.items[0]!.adapter.projection.id).not.toBe("theory.shapes.firing");
        if (setup.id.endsWith("-authored")) expect(refs(stage.admitted)).toContain("theory.shapes.firing@3");
      } else {
        expect(refs(stage.admitted).some(ref => recognition.has(ref))).toBe(false);
        expect(candidate.items).toEqual(old.items);
      }
      const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, declaration.consumer!, stage.kept.map(f => f.evidence)));
      const fitted = fitModulePresentation("structure_nudge", presented);
      expect(candidate.items).toEqual(fitted.items); expect(candidate.budget).toEqual(fitted.budget);
      expect(candidate.noveltyAbstained).toBe(stage.novelty.abstained);
      if (setup.id === "material-positive" || setup.id === "material-null") {
        const classification = stage.admitted.find(f => f.projection.id === "rules.endgame.classification")!;
        expect(classification).toBeDefined();
        expect((classification.evidence.payload as { type: unknown }).type === null).toBe(setup.id === "material-null");
      }
      if (setup.id === "unclear") expect(stage.admitted.find(f => f.projection.id === "rules.phase.reading")!.evidence.payload).toMatchObject({ phase: "unclear" });
      if (setup.id === "unavailable") {
        expect(candidate.items.length).toBeGreaterThan(0); expect(candidate.empty).toBeNull();
        expect(candidate.unavailable).toEqual(old.unavailable);
        expect(candidate.unavailable).toContainEqual({ projection: "theory.shapes.firing@3", reason: "authored_source_absent" });
      }
      if (setup.id === "overlong") {
        expect(candidate.items).toEqual([]); expect(candidate.budget.dropped).toHaveLength(1);
        expect(candidate.budget.dropped[0]!.exceeded).toEqual(["words"]);
        expect(candidate.empty).toMatchObject({ kind: "stated_absence", sentence: "More detail is available than fits in this compact hint." });
      } else expect(candidate.items).toHaveLength(1);
      if (setup.id === "repeated") expect(stage.request.ancestorFacts?.some(facts => refs(facts).includes("theory.shapes.firing@3"))).toBe(true);
      if (inherited) expect(branchPath(run, run.activeCursor.branchId).at(-1)!.branchId).not.toBe(run.activeCursor.branchId);
      expect(JSON.stringify(storage.read(run.id))).toBe(saved);
    });
  }
});
