// DISPOSABLE negative buildability model for D2523. The forged completion compiles today.
type Brand<T, B extends string> = T & { readonly __brand: B };
type Contacts = Brand<Readonly<{ fen: string }>, "contacts">;
type Geometry = Brand<Readonly<{ fen: string }>, "geometry">;

type GeometryResult =
  | Readonly<{ kind: "completed"; output: Readonly<{ kind: "evidence"; input: Contacts; item: Geometry }> }>
  | Readonly<{ kind: "completed"; output: Readonly<{ kind: "no_evidence"; reason: "no_opposing_passed_clear_paths"; input: Contacts }> }>
  | Readonly<{ kind: "unavailable"; reason: "input_abstained" }>;

interface PromotionRequest { readonly geometry: GeometryResult }
declare function collect(request: PromotionRequest): Promise<unknown>;

const forgedContacts = { fen: "not factory evidence" } as Contacts;
const forgedCompletedAbsence: GeometryResult = {
  kind: "completed",
  output: { kind: "no_evidence", reason: "no_opposing_passed_clear_paths", input: forgedContacts },
};
void collect({ geometry: forgedCompletedAbsence });

const splicedEvidence: GeometryResult = {
  kind: "completed",
  output: { kind: "evidence", input: forgedContacts, item: { fen: "another position" } as Geometry },
};
void collect({ geometry: splicedEvidence });
