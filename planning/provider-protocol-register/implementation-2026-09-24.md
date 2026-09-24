# Implementation receipt: `rfc/provider-protocol-register.md`

**Date:** 2026-09-24 · **By:** claude (worktree `agent-aaf2b7e1cd919efdb`) · **For:** coordinator
closeout. Implemented at the owner's direction to implement ready RFCs with no review rounds.

## What shipped

- `rfc/shared-resource-registers.json` gains one row: `provider-protocol`, claim kind `members`,
  source `string_tuple` over `packages/runtime/src/provider-protocol.ts#PROVIDER_PROTOCOL_MEMBERS`.
- `packages/runtime/src/provider-protocol.ts` is created first with an empty literal tuple, so the
  catalogue's regular-file admission passes and the resource is present. No absent-source admission
  ([[D3082]]) and no lifecycle engine were built.
- `rfc/README.md` gains the checked `## Provider-protocol register` (`members=0`, empty Landed table)
  and the live claim row mirroring `provider-exchange-and-execution.md`'s new claim block
  `provider-protocol | members lichess_explorer_position_page_v1, maia_policy_page_v1,
  stockfish_legal_root_table_v1, stockfish_position_evaluation_v1, syzygy_position_v1 | …`.
- `tools/register-check.test.mjs`: §7.1 now proves the reviewed seven-row seed survives unchanged
  and exactly one later row was added; §7.13 counts eight; a new test derives the real tuple, collides
  one member claimed by two RFCs, and refuses a dotted operation id and the former lane grammar.

No checker logic changed (`tools/register-check.mjs` untouched).

## RFC correction (genuine defect, fixed inline with a changelog line)

The eight-criterion cut named a `canonical_resource@1` adapter, an `absent` introduction and a
`first lane 1 | whole projection` claim. The implemented bootstrap's §5 removes all three. The
criteria are rewritten to the members/string_tuple row; count stays eight so the retained
`make provider-protocol-cut-contract` evidence still passes (4/4).

## Verification

`make register-check` (36/36 tests; C1–C8 green), `make shared-resource-catalogue`,
`make provider-protocol-cut-contract` 4/4. The full gate runs at the product landing.

## Left for the coordinator

`rfc/README.md` Active-row status, `design/BACKLOG.md` ([[D2189]], [[D2455]], [[D2459]]) and the
exploration-log entry; `make status-parity` may flag the status/README-row mismatch until then.
