// DISPOSABLE buildability model for the repaired promotion result protocols.
type Brand<T, B extends string> = T & { readonly __brand: B };
type Contacts = Brand<Readonly<{ fen: string }>, "contacts">;
type Geometry = Brand<Readonly<{ fen: string }>, "geometry">;
type LegalMoves = Brand<Readonly<{ fen: string }>, "legal_moves">;
type Source = Brand<Readonly<{ fen: string; category: "win" | "draw" | "loss" }>, "source">;
type Output = Brand<Readonly<{ category: "win" | "draw" | "loss"; immediatePromotion: readonly string[] }>, "output">;

type GeometryResult =
  | Readonly<{ kind: "evidence"; input: Contacts; output: Geometry }>
  | Readonly<{ kind: "unavailable"; reason: "no_opposing_passed_clear_paths"; input: Contacts }>
  | Readonly<{ kind: "unavailable"; reason: "input_abstained"; missing: readonly ["contacts"] }>;
interface Receipt { readonly geometry: Geometry; readonly legalMoves: LegalMoves; readonly source: Source; readonly output: Output }
type Outcome =
  | Readonly<{ kind: "evidence"; item: Output; derivation: Receipt }>
  | Readonly<{ kind: "unavailable"; reason: "no_opposing_passed_clear_paths"; input: Contacts }>
  | Readonly<{ kind: "unavailable"; reason: "input_abstained"; missing: readonly ("geometry" | "legal_moves")[] }>;

declare const contacts: Contacts;
declare const geometry: Geometry;
declare const legalMoves: LegalMoves;
declare const source: Source;
declare const output: Output;
const geometryResult: GeometryResult = { kind: "evidence", input: contacts, output: geometry };
const outcome: Outcome = { kind: "evidence", item: output, derivation: { geometry, legalMoves, source, output } };
void geometryResult;
void outcome;

// @ts-expect-error no-race is grounded by contacts, not a missing-input tuple
const crossedAbsence: GeometryResult = { kind: "unavailable", reason: "no_opposing_passed_clear_paths", missing: ["contacts"] };
void crossedAbsence;
// @ts-expect-error an evidence result cannot omit the retained legal-map derivation
const missingLegal: Outcome = { kind: "evidence", item: output, derivation: { geometry, source, output } };
void missingLegal;
// @ts-expect-error check classification is deliberately not an outcome payload member
const duplicateCheck: Output = { category: "win", immediatePromotion: [], promotionWithCheck: [] };
void duplicateCheck;
