# Variant rules and setup-family identity — executable import pass

**Date:** 2026-08-26
**Question:** Can rules or FEN alone identify Standard, from-position and Chess960 starts across
import, resume and provider capability selection?
**Instrument:** `tools/d1675-setup-identity-harness/` (disposable research code)
**Feeds:** [[D1675]], [[D1676]], [[D1678]], [[D1680]], `rfc/variants.md`

## Verdict

**No. The minimum durable chess identity is `rules + setupFamily`; the workflow entry origin is a
third, separate policy axis.** `[V]`

Chessops 0.15.1 maps **20 explicit aliases** spanning Standard, From Position,
Chess960/Fischer Random and `wild/0`–`wild/8a`, plus a missing Variant tag, to the single rules
value `chess`. Its `startingPosition` reads `Variant` and optional `FEN` but never reads `SetUp`; a
missing FEN becomes the default position for that rules value. `[V]`
`node_modules/.pnpm/chessops@0.15.1/node_modules/chessops/src/pgn.ts:615-674,697-703`;
complete alias arm in `tools/d1675-setup-identity-harness/setup-identity.test.ts`.

The behavior conflicts with the original PGN alternative-start contract: `SetUp "1"` denotes a
set-up position, must appear for such a game, and requires a corresponding FEN tag. `[V]`
[PGN specification §§9.7.1–9.7.2](https://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm).

## Production consequences reproduced

1. `parsePgnMainline` accepts `[Variant "From Position"]` with neither `SetUp` nor `FEN`, parses
   `1. e4`, and returns the ordinary initial FEN. The declared origin is silently replaced. `[V]`
2. The same importer rejects `[Variant "Chess960"]` even when `SetUp "1"` and a legal FEN are
   supplied, because its guard compares two raw strings before `startingPosition`. `[V]`
   `apps/server/src/pgn-import.ts:32-35`; both complete PGNs are permanent harness fixtures.
3. Identical initial-position FEN bytes can be admitted once as Standard and once as Chess960. The
   variant contract requires Maia enabled / ordinary Stockfish / standard explorer for the first,
   and Maia dark / `UCI_Chess960` / Chess960 explorer for the second. FEN equality therefore cannot
   drive provider capability. `[V]` Same-FEN harness control; required dispositions in
   `rfc/variants.md` §§2–3.

## Candidate closed identity

The five-arm harness makes the smallest discriminated setup family executable:

```ts
type SetupFamily =
  | "standard_default"
  | "standard_from_position"
  | "chess960"
  | "variant_default"
  | "variant_from_position";

type RulesSetupIdentity = {
  rules: Rules;
  setupFamily: SetupFamily;
};
```

Classification happens from raw normalized headers **before** calling `parseVariant`, because that
call is intentionally lossy. The candidate refuses unknown variants, a lone FEN or `SetUp "1"`,
and From Position/Chess960 without the required pair; it retains Tier-2 default versus custom
setup. Five harness tests pass, including all 20 explicit chess aliases, the two production bugs,
the five-family table and same-FEN capability divergence. `[V]`

`setupFamily` is not the admission surface. Pack, pasted position, native play, import, live
provider and campaign are workflow origins and may admit the same rules/setup identity differently.
Combining them would couple parsing truth to product policy and leave [[D1680]] unresolved. `[M]`

## Author consequence

The returned RFC should put `RulesSetupIdentity` on the canonical run start and `run.started`
event, preserve it through projection/export/resume, and require every evidence/opponent request to
carry or derive the same identity. PGN import needs a total raw-header classifier with the full
alias fixture population; it must not use `parseVariant(...) === "chess"` to infer setup family.

This pass does not decide the run-schema field spelling/version, workflow admission table,
Chess960 number notation, or whether nonconforming third-party PGNs are repaired versus refused.
Those are RFC/product choices, not findings manufactured by the harness. `[V]`
