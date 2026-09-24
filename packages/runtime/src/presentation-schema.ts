// rfc/evidence-presentation.md §2.2/§3.10a — the strict operand-schema kit every registered fact
// renderer and component parser uses. A schema is a closed parser: unknown keys, missing keys,
// wrong types and out-of-vocabulary members all refuse with `PRESENTATION_INVALID`. The same parser
// runs on the construction path (server) and on the receipt path (client), so a retained operand
// that would not parse cannot be sealed in the first place.
//
// This file imports no value from `presentation-contract.ts`; the fact-renderer files that build on
// it are merged into the contract's registry at import, so there is no module cycle.

import type { Color, Role, SquareName } from "chessops/types";

export class PresentationSchemaError extends TypeError {
  readonly code = "PRESENTATION_INVALID" as const;
  constructor(message: string) {
    super(`PRESENTATION_INVALID: ${message}`);
    this.name = "PresentationSchemaError";
  }
}

/** A closed parser from untrusted JSON to one frozen, typed operand. */
export type Parser<T> = (value: unknown, label: string) => T;

const fail = (label: string, message: string): never => { throw new PresentationSchemaError(`${label} ${message}`); };
const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === "object" && value !== null && !Array.isArray(value);

const SQUARE = /^[a-h][1-8]$/u;
const FILE = /^[a-h]$/u;
const UCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/u;
const SAN = /^(?:O-O(?:-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?)[+#]?$/u;
const DIGEST = /^sha256:[0-9a-f]{64}$/u;

export const COLORS = Object.freeze(["white", "black"] as const);
export const ROLES = Object.freeze(["pawn", "knight", "bishop", "rook", "queen", "king"] as const);

type Shape = Readonly<Record<string, Parser<unknown>>>;
type Out<S extends Shape> = { readonly [K in keyof S]: S[K] extends Parser<infer T> ? T : never };
type OptionalOut<S extends Shape> = { readonly [K in keyof S]?: S[K] extends Parser<infer T> ? T : never };

export const s = Object.freeze({
  str: ((value, label) => (typeof value === "string" && value.trim() !== "" ? value : fail(label, "must be a non-empty string"))) as Parser<string>,
  bool: ((value, label) => (typeof value === "boolean" ? value : fail(label, "must be a boolean"))) as Parser<boolean>,
  int: ((value, label) => (Number.isSafeInteger(value) ? value as number : fail(label, "must be a safe integer"))) as Parser<number>,
  nat: ((value, label) => (Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : fail(label, "must be a non-negative safe integer"))) as Parser<number>,
  /** A finite number in [0, 1] — a share, never a pre-formatted percentage. */
  unit: ((value, label) => (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : fail(label, "must be a finite share in [0, 1]"))) as Parser<number>,
  square: ((value, label) => (typeof value === "string" && SQUARE.test(value) ? value as SquareName : fail(label, "must be a square name"))) as Parser<SquareName>,
  file: ((value, label) => (typeof value === "string" && FILE.test(value) ? value : fail(label, "must be a file letter"))) as Parser<string>,
  uci: ((value, label) => (typeof value === "string" && UCI.test(value) ? value : fail(label, "must be canonical UCI"))) as Parser<string>,
  san: ((value, label) => (typeof value === "string" && SAN.test(value) ? value : fail(label, "must be SAN"))) as Parser<string>,
  digest: ((value, label) => (typeof value === "string" && DIGEST.test(value) ? value : fail(label, "must be a sha256 digest"))) as Parser<string>,
  color: ((value, label) => ((COLORS as readonly unknown[]).includes(value) ? value as Color : fail(label, "must be white | black"))) as Parser<Color>,
  role: ((value, label) => ((ROLES as readonly unknown[]).includes(value) ? value as Role : fail(label, "must be a piece role"))) as Parser<Role>,
  lit<T extends string | number | boolean>(...members: readonly T[]): Parser<T> {
    return (value, label) => ((members as readonly unknown[]).includes(value) ? value as T : fail(label, `is outside ${members.join(" | ")}`));
  },
  arr<T>(item: Parser<T>, bounds: { readonly min?: number; readonly max?: number } = {}): Parser<readonly T[]> {
    return (value, label) => {
      if (!Array.isArray(value)) return fail(label, "must be an array");
      if (bounds.min !== undefined && value.length < bounds.min) fail(label, `must hold at least ${bounds.min}`);
      if (bounds.max !== undefined && value.length > bounds.max) fail(label, `must hold at most ${bounds.max}`);
      return Object.freeze(value.map((entry, index) => item(entry, `${label}[${index}]`)));
    };
  },
  nullable<T>(item: Parser<T>): Parser<T | null> {
    return (value, label) => (value === null ? null : item(value, label));
  },
  obj<R extends Shape, O extends Shape = Readonly<Record<never, Parser<unknown>>>>(required: R, optional?: O): Parser<Out<R> & OptionalOut<O>> {
    return (value, label) => {
      if (!isRecord(value)) return fail(label, "must be an object");
      for (const key of Object.keys(value)) if (!(key in required) && !(optional !== undefined && key in optional)) fail(label, `has the unknown key ${key}`);
      const result: Record<string, unknown> = {};
      for (const [key, parser] of Object.entries(required)) {
        if (!(key in value)) fail(label, `omits ${key}`);
        result[key] = parser(value[key], `${label}.${key}`);
      }
      if (optional !== undefined) for (const [key, parser] of Object.entries(optional)) if (key in value && value[key] !== undefined) result[key] = parser(value[key], `${label}.${key}`);
      return Object.freeze(result) as Out<R> & OptionalOut<O>;
    };
  },
  /** A discriminated union keyed by one literal field. */
  union<K extends string, M extends Readonly<Record<string, Parser<unknown>>>>(key: K, arms: M): Parser<M[keyof M] extends Parser<infer T> ? T : never> {
    return (value, label) => {
      if (!isRecord(value)) return fail(label, "must be an object");
      const tag = value[key];
      if (typeof tag !== "string" || !Object.hasOwn(arms, tag)) return fail(label, `${key} is outside ${Object.keys(arms).join(" | ")}`);
      return arms[tag]!(value, label) as M[keyof M] extends Parser<infer T> ? T : never;
    };
  },
});

export const pieceSchema = s.obj({ color: s.color, role: s.role });
export type SchemaPiece = { readonly color: Color; readonly role: Role };

/**
 * One registered fact renderer (§3.10a): a closed operand parser and a deterministic template over
 * the parsed operands. The contract recomputes and byte-checks the text on both sides of the wire.
 */
export interface FactRendererDefinition<T> {
  readonly parse: Parser<T>;
  readonly render: (operands: T) => string;
}

export function factRenderer<T>(parse: Parser<T>, render: (operands: T) => string): FactRendererDefinition<T> {
  return Object.freeze({ parse, render });
}

export type FactOperandsOf<M> = {
  readonly [K in keyof M]: M[K] extends FactRendererDefinition<infer T> ? T : never;
};

// ---------------------------------------------------------------------------------------------
// Shared learner phrasing: chess notation and registered labels only (§6a).
// ---------------------------------------------------------------------------------------------

export const SIDE_NAMES: Readonly<Record<Color, string>> = Object.freeze({ white: "White", black: "Black" });
export const ROLE_NAMES: Readonly<Record<Role, string>> = Object.freeze({ pawn: "pawn", knight: "knight", bishop: "bishop", rook: "rook", queen: "queen", king: "king" });

export const side = (color: Color): string => SIDE_NAMES[color];
export const otherSide = (color: Color): string => SIDE_NAMES[color === "white" ? "black" : "white"];
/** "White's knight on f3". */
export const pieceOn = (piece: SchemaPiece, square: string): string => `${SIDE_NAMES[piece.color]}'s ${ROLE_NAMES[piece.role]} on ${square}`;
export const plural = (count: number, noun: string, many = `${noun}s`): string => `${count} ${count === 1 ? noun : many}`;
/** "a, b and c". */
export function listPhrase(items: readonly string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)!}`;
}
