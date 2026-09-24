import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import {
  DECLARED_CONVENTION_INHERITANCE,
  INSTANCE_CONVENTION_PROJECTIONS,
  PROJECTION_CONVENTION_TABLE,
  deriveProjectionConventionTable,
} from "./evidence-convention-closure.js";
import {
  CONVENTION_DECLARATIONS,
  CONVENTION_REGISTRY,
  SEMANTIC_CONVENTION_MEMBERS,
  compileConventionRegistry,
  conventionMember,
  conventionReceipt,
  conventionRefKey,
  conventionSemanticDigest,
  parseConventionRef,
  registeredConvention,
  type ConventionDeclaration,
} from "./evidence-conventions.js";
import { ENDGAME_SETUP_CONVENTIONS, endgameSetupConvention } from "./endgame-setup.js";
import { ENDGAME_METHOD_CONVENTIONS, endgameMethodConvention } from "./endgame-method.js";
import { SEMANTIC_EVENT_PROJECTION_REFS } from "./evidence-catalog.js";
import { METHOD_DECLARATIONS, SETUP_DECLARATIONS, namedStructureDefinition, phaseBandsDefinition } from "./testing/convention-bindings.js";

const ROOT = new URL("../../../", import.meta.url);
const read = (path: string): string => readFileSync(new URL(path, ROOT), "utf8");
const key = (value: { readonly id: string; readonly version: number }): string => `${value.id}@${value.version}`;
const refs = (route: string): readonly string[] => (PROJECTION_CONVENTION_TABLE.get(route)?.refs ?? []).map(key);

interface InitialRow { readonly ref: string; readonly definition: string; readonly limitations: readonly string[]; readonly witnesses: readonly string[] }
const initial = JSON.parse(read("planning/semantic-convention-provenance/initial-declarations.json")) as { readonly snapshotRef: string; readonly declarations: readonly InitialRow[] };
const seed = JSON.parse(read("planning/semantic-convention-register/initial-members.json")) as { readonly members: readonly { readonly ref: string }[] };
const AUTHORED = ["endgame-material-census@1", "named-structure-catalogue@1", "phase-bands@1", "lucena-setup@1", "philidor-third-rank-setup@1", "vancura-setup@1", "lucena-bridge-method@1", "philidor-third-rank-method@1", "vancura-method@1"];

const declaration = (overrides: Partial<ConventionDeclaration> = {}): ConventionDeclaration => ({
  ref: { id: "fixture", version: 1 },
  definition: "A fixture definition.",
  limitations: ["A fixture limitation."],
  authority: [{ kind: "product_rule", rulingRef: "[[D1]]" }],
  disclosure: { kind: "definition_and_limitations" },
  ...overrides,
});

describe("semantic-convention registry (rfc/semantic-convention-provenance.md §1)", () => {
  it("registers exactly the 39 reviewed initial members plus the nine authored declarations", () => {
    const declared = CONVENTION_REGISTRY.declarations.map((value) => conventionRefKey(value.ref));
    expect(declared).toHaveLength(48);
    const initialRefs = initial.declarations.map((row) => row.ref).sort();
    expect(initialRefs).toEqual(seed.members.map((member) => member.ref).sort());
    expect(initialRefs).toHaveLength(39);
    expect([...declared].sort()).toEqual([...initialRefs, ...AUTHORED].sort());
    expect(CONVENTION_REGISTRY.digest).toMatch(/^sha256:[0-9a-f]{64}$/u);
  });

  it("keeps the generated prefix equal to every reviewed semantic field, not merely its refs (criterion 16)", () => {
    const prefix = CONVENTION_DECLARATIONS.slice(0, initial.declarations.length);
    expect(prefix.map((value) => ({ ref: conventionRefKey(value.ref), definition: value.definition, limitations: value.limitations, witnesses: value.authority.flatMap((authority) => authority.kind === "landed_contract" ? authority.witnesses : []) })))
      .toEqual(initial.declarations.map((row) => ({ ref: row.ref, definition: row.definition, limitations: row.limitations, witnesses: row.witnesses })));
    for (const value of prefix) expect(value.authority).toEqual([expect.objectContaining({ kind: "landed_contract", snapshotRef: initial.snapshotRef })]);
  });

  it("is one set with the register's literal member tuple, sorted and alias-free (semantic-convention-register criteria 3–5)", () => {
    const members = CONVENTION_REGISTRY.declarations.map((value) => conventionMember(value.ref));
    expect([...SEMANTIC_CONVENTION_MEMBERS]).toEqual([...members].sort());
    expect(new Set(members).size).toBe(members.length);
    expect(conventionMember(parseConventionRef("defence-duty@1"))).toBe("defence_duty_v1");
    const source = read("packages/runtime/src/evidence-conventions.ts");
    expect(source).toMatch(/export const SEMANTIC_CONVENTION_MEMBERS = \[[^\]]*\] as const;/u);
  });

  it("refuses duplicate, aliased, malformed, blank, unresolvable and skipped-lineage declarations", () => {
    const fails = (declarations: readonly ConventionDeclaration[], code: string) => expect(() => compileConventionRegistry(declarations)).toThrow(code);
    fails([declaration(), declaration()], "CONVENTION_REF_DUPLICATE");
    fails([declaration({ ref: { id: "back-rank", version: 1 } }), declaration({ ref: { id: "back_rank", version: 1 } })], "CONVENTION_MEMBER_ALIAS");
    fails([declaration({ ref: { id: "Bad", version: 1 } })], "CONVENTION_REF_INVALID");
    fails([declaration({ ref: { id: "zero", version: 0 } })], "CONVENTION_REF_INVALID");
    fails([declaration({ definition: " " })], "CONVENTION_DECLARATION_BLANK");
    fails([declaration({ limitations: [] })], "CONVENTION_DECLARATION_BLANK");
    fails([declaration({ limitations: [""] })], "CONVENTION_DECLARATION_BLANK");
    fails([declaration({ disclosure: { kind: "reviewed_text", summary: "", detail: "x" } })], "CONVENTION_DECLARATION_BLANK");
    fails([declaration({ authority: [] })], "CONVENTION_AUTHORITY_INVALID");
    fails([declaration({ authority: [{ kind: "published_source", citation: "a book", licence: "x" }] })], "CONVENTION_AUTHORITY_INVALID");
    fails([declaration({ authority: [{ kind: "product_rule", rulingRef: "the owner said so" }] })], "CONVENTION_AUTHORITY_INVALID");
    fails([declaration({ authority: [{ kind: "landed_contract", witnesses: [], snapshotRef: "62a5731f" }] })], "CONVENTION_AUTHORITY_INVALID");
    fails([declaration({ ref: { id: "fixture", version: 2 } })], "CONVENTION_LINEAGE_SKIPPED");
    expect(() => compileConventionRegistry([declaration(), declaration({ ref: { id: "fixture", version: 2 } })])).not.toThrow();
    expect(() => parseConventionRef("grade-convention@1/drill")).toThrow("CONVENTION_REF_INVALID");
    expect(() => parseConventionRef("space@01")).toThrow("CONVENTION_REF_INVALID");
  });

  it("digests every semantic field but never declaration order", () => {
    const [first, second] = [declaration(), declaration({ ref: { id: "other", version: 1 } })];
    expect(compileConventionRegistry([first, second]).digest).toBe(compileConventionRegistry([second, first]).digest);
    expect(compileConventionRegistry([first]).digest).not.toBe(compileConventionRegistry([declaration({ limitations: ["Another limitation."] })]).digest);
    expect(conventionSemanticDigest(first)).not.toBe(conventionSemanticDigest(declaration({ definition: "Changed meaning." })));
  });

  it("resolves every landed-contract witness: projection refs in the manifest, file#symbol in the tree", () => {
    const projections = new Set(PRIMARY_EVIDENCE_MANIFEST.projections.map(key));
    for (const value of CONVENTION_REGISTRY.declarations) {
      for (const authority of value.authority) {
        if (authority.kind !== "landed_contract") continue;
        for (const witness of authority.witnesses) {
          if (/@\d+$/u.test(witness)) { expect(projections.has(witness), `${conventionRefKey(value.ref)} witness ${witness}`).toBe(true); continue; }
          const [file, symbol] = witness.split("#");
          expect(existsSync(new URL(file!, ROOT)), witness).toBe(true);
          if (symbol !== undefined) expect(read(file!), witness).toContain(symbol.split(".")[0]);
        }
      }
    }
  });
});

describe("authored declarations are bound to the code that computes them", () => {
  it("moves the six cited endgame setup/method conventions into the register byte-for-byte", () => {
    for (const expected of [...SETUP_DECLARATIONS(), ...METHOD_DECLARATIONS()]) {
      expect(registeredConvention(expected.ref), conventionRefKey(expected.ref)).toEqual(expected);
    }
    for (const convention of [...ENDGAME_SETUP_CONVENTIONS, ...ENDGAME_METHOD_CONVENTIONS]) expect(registeredConvention(convention), convention.id).toBeDefined();
    // A code record is usable only while its exact id@version is registered.
    expect(endgameSetupConvention({ id: "lucena-setup", version: 2 })).toBeUndefined();
    expect(endgameMethodConvention({ id: "vancura-method", version: 2 })).toBeUndefined();
    expect(endgameSetupConvention({ id: "lucena-setup", version: 1 })).toBe(ENDGAME_SETUP_CONVENTIONS[0]);
  });

  it("binds phase-bands@1 to the classifier constants and named-structure-catalogue@1 to the catalogue expressions", () => {
    expect(registeredConvention({ id: "phase-bands", version: 1 })!.definition).toBe(phaseBandsDefinition());
    expect(registeredConvention({ id: "named-structure-catalogue", version: 1 })!.definition).toBe(namedStructureDefinition());
    expect(registeredConvention({ id: "endgame-material-census", version: 1 })!.definition).toMatch(/phase-bands@1/u);
  });
});

describe("append-only semantic history (make semantic-convention-history-check)", () => {
  it("holds exactly one canonical row per declaration with its current semantic digest", () => {
    const text = read("packages/runtime/src/evidence-convention-history.jsonl");
    expect(text.endsWith("\n")).toBe(true);
    const rows = text.trimEnd().split("\n").map((line) => ({ line, row: JSON.parse(line) as Record<string, string> }));
    for (const { line, row } of rows) {
      expect(Object.keys(row)).toEqual(["ref", "semanticDigest", "registryDigest", "ownerRfc"]);
      expect(JSON.stringify(row)).toBe(line);
    }
    const byRef = new Map(rows.map(({ row }) => [row.ref!, row]));
    expect(byRef.size).toBe(rows.length);
    for (const value of CONVENTION_REGISTRY.declarations) expect(byRef.get(conventionRefKey(value.ref))?.semanticDigest, conventionRefKey(value.ref)).toBe(conventionSemanticDigest(value));
    expect(rows).toHaveLength(CONVENTION_REGISTRY.declarations.length);
    for (const ref of AUTHORED) expect(byRef.get(ref)!.ownerRfc).toBe("evidence-value-authority.md");
  });
});

describe("direct convention closure per projection (rfc/semantic-convention-provenance.md §2)", () => {
  it("carries every witnessed convention onto its live projection or its retaining successor", () => {
    const live = new Set(PROJECTION_CONVENTION_TABLE.keys());
    for (const value of CONVENTION_REGISTRY.declarations) {
      for (const authority of value.authority) {
        if (authority.kind !== "landed_contract") continue;
        for (const witness of authority.witnesses.filter((item) => /@\d+$/u.test(item))) {
          const [id, version] = witness.split("@");
          const successor = `${id}@${Number(version) + 1}`;
          const holder = live.has(witness) ? witness : live.has(successor) ? successor : undefined;
          if (holder === undefined) continue; // retired without a same-id successor
          expect(refs(holder), `${holder} ← ${conventionRefKey(value.ref)}`).toContain(conventionRefKey(value.ref));
        }
      }
    }
  });

  it("pins the rfc/evidence-value-authority.md D1 rows: six exact-under-convention rows, phase, named structure and endgame classification", () => {
    expect(refs("rules.square.reading.control@1")).toEqual(["square-control@1"]);
    expect(refs("rules.square.event.control@1")).toEqual(["square-control@1"]);
    expect(refs("rules.tactic.reading.defender_duty_set@1")).toEqual(["defence-duty@1"]);
    expect(refs("rules.tactic.event.defender_removed@1")).toEqual(["defence-duty@1"]);
    expect(refs("rules.tactic.event.defender_duty_relocated@1")).toEqual(["defence-duty@1"]);
    expect(refs("rules.tactic.consequence.forced_mate_after_move@1")).toEqual(["mate-proof@1"]);
    expect(refs("rules.tactic.consequence.forced_mate_after_move@2")).toEqual(["mate-proof@1"]);
    expect(refs("rules.phase.reading@2")).toEqual(["phase-bands@1"]);
    expect(refs("rules.structural.reading.named_structure@2")).toEqual(["named-structure-catalogue@1"]);
    expect(refs("rules.endgame.classification@1")).toEqual(["endgame-material-census@1", "phase-bands@1"]);
  });

  it("gives the eleven recorded @2 sequences their predecessor's and catalogue's conventions", () => {
    const v2 = SEMANTIC_EVENT_PROJECTION_REFS.filter((value) => value.version === 2).map(key).sort();
    expect(v2).toHaveLength(11);
    expect(Object.fromEntries(v2.map((route) => [route, refs(route)]))).toEqual({
      "derived.exchange.trade_completed@2": ["trade-completed@1"],
      "derived.pawn.sequence.contact_timing@2": [],
      "derived.pawn.sequence.harassment_pressure@2": ["pressure-line@1"],
      "derived.tactic.attraction_observed@2": ["observed-window@1"],
      "derived.tactic.check_zwischenzug_observed@2": ["legal-exchange@1", "observed-window@1"],
      "derived.tactic.deflection_observed@2": ["observed-window@1"],
      "derived.tactic.interference_observed@2": ["legal-exchange@1", "observed-window@1"],
      "derived.tactic.line_blocker_clearance_observed@2": ["legal-exchange@1", "observed-window@1"],
      "derived.tactic.overload_exploitation_observed@2": ["observed-window@1"],
      "derived.tactic.sequence.defender_consequence@2": [],
      "derived.tactic.square_clearance_observed@2": ["observed-window@1"],
    });
  });

  it("never unions an instance projection's alternative conventions", () => {
    for (const route of INSTANCE_CONVENTION_PROJECTIONS) expect(refs(route), route).toEqual([]);
  });

  it("fails closed on a stale inheritance row and changes when a witness is removed", () => {
    expect(() => deriveProjectionConventionTable(PRIMARY_EVIDENCE_MANIFEST, CONVENTION_REGISTRY, { "rules.square.event.control@1": ["square-control@2"] })).toThrow(/unregistered/u);
    expect(() => deriveProjectionConventionTable(PRIMARY_EVIDENCE_MANIFEST, CONVENTION_REGISTRY, { "rules.nowhere@1": ["square-control@1"] })).toThrow(/unknown projection/u);
    const withoutWitness = compileConventionRegistry(CONVENTION_REGISTRY.declarations.map((value) => conventionRefKey(value.ref) !== "square-control@1" ? value : {
      ...value,
      authority: value.authority.map((authority) => authority.kind === "landed_contract" ? { ...authority, witnesses: ["packages/runtime/src/square-control.ts"] } : authority),
    }));
    const table = deriveProjectionConventionTable(PRIMARY_EVIDENCE_MANIFEST, withoutWitness, DECLARED_CONVENTION_INHERITANCE);
    expect(table.get("rules.square.reading.control@1")!.refs).toEqual([]);
    expect(table.get("rules.square.event.control@1")!.refs.map(key)).toEqual(["square-control@1"]);
  });
});

describe("value-level convention receipt (rfc/semantic-convention-provenance.md §4; D1921)", () => {
  const space = { id: "space", version: 1 };
  const threat = { id: "threat", version: 1 };
  it("is canonical over ref order and input order but keeps input multiplicity", () => {
    const a = { projection: "rules.x@1", valueDigest: "sha256:a" };
    const b = { projection: "rules.x@1", valueDigest: "sha256:b" };
    const forward = conventionReceipt([space, threat], { kind: "derived", member: "rules.x@1", inputs: [a, b] });
    const reversed = conventionReceipt([threat, space, space], { kind: "derived", member: "rules.x@1", inputs: [b, a] });
    expect(reversed).toEqual(forward);
    expect(conventionReceipt([space, threat], { kind: "derived", member: "rules.x@1", inputs: [a, a, b] }).digest).not.toBe(forward.digest);
    expect(conventionReceipt([space], { kind: "derived", member: "rules.x@1", inputs: [a, b] }).digest).not.toBe(forward.digest);
    expect(forward.registryDigest).toBe(CONVENTION_REGISTRY.digest);
    expect(Object.isFrozen(forward) && Object.isFrozen(forward.refs)).toBe(true);
  });

  it("refuses an unregistered ref", () => {
    expect(() => conventionReceipt([{ id: "space", version: 2 }], { kind: "source" })).toThrow("CONVENTION_REF_UNREGISTERED");
  });
});
