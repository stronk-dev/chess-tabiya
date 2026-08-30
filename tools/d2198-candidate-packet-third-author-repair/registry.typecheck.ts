// DISPOSABLE buildability model for the D2200/D2201 typed registry contract.
type Projection = "a@1" | "b@1" | "c@1";
type Value<P extends Projection> = Readonly<{ projection: P }>;
type Result<P extends Projection> =
  | Readonly<{ kind: "available"; projection: P; values: readonly Value<P>[] }>
  | Readonly<{ kind: "unavailable"; projection: P; reason: "no_match" }>
  | Readonly<{ kind: "failed"; projection: P; reason: "threw" | "invalid_result" }>;
interface SealedOutcome {
  readonly collectorId: CollectorId;
  readonly result: Result<Projection>;
}
type MemoEntry<K extends string> = Readonly<{ collectorId: K; outcomes: readonly SealedOutcome[] }>;
type Memo<D extends readonly string[]> = Readonly<{ [K in D[number]]: MemoEntry<K> }>;
type Context<D extends readonly string[]> = Readonly<{ beforeFen: string; moveUci: string; afterFen: string; memo: Memo<D> }>;
type Declaration<P extends readonly Projection[], D extends readonly string[]> = Readonly<{
  outputs: P;
  dependencies: D;
  collect(context: Context<D>): readonly Result<P[number]>[];
}>;

const collectA = (_context: Context<readonly []>): readonly Result<"a@1">[] => [];
const collectB = (context: Context<readonly ["a"]>): readonly Result<"b@1">[] => {
  context.memo.a;
  // @ts-expect-error undeclared dependency access is forbidden
  context.memo.c;
  return [];
};
const collectC = (context: Context<readonly ["a", "b"]>): readonly Result<"c@1">[] => {
  context.memo.a;
  context.memo.b;
  return [];
};

const registry = Object.freeze({
  a: ({ outputs: ["a@1"], dependencies: [], collect: collectA } as const satisfies Declaration<readonly ["a@1"], readonly []>),
  b: ({ outputs: ["b@1"], dependencies: ["a"], collect: collectB } as const satisfies Declaration<readonly ["b@1"], readonly ["a"]>),
  c: ({ outputs: ["c@1"], dependencies: ["a", "b"], collect: collectC } as const satisfies Declaration<readonly ["c@1"], readonly ["a", "b"]>),
});

type CollectorId = keyof typeof registry;
const id: CollectorId = "c";
void id;

// @ts-expect-error available values must agree with the result projection
const crossed: Result<"a@1"> = { kind: "available", projection: "a@1", values: [{ projection: "b@1" }] };
void crossed;
