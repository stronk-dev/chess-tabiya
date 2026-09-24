# famous-games — implementation receipt, 2026-09-24

Implements `rfc/famous-games.md` (owner ruling [[D1060]], FULL LIFT) on the owner's in-session
request to build it now with no further review cycle. Genuine RFC defects were corrected inline with
changelog lines; every other finding is a test.

## What shipped

| RFC part | Where | Test |
|---|---|---|
| §1 four rows replace the bundled row | `apps/server/src/capabilities.ts` | `capabilities.test.ts` criteria 1–2 (exact-literal grep, four rows, no `licence`/`license`/`rights` in the topGames reason) |
| §1 `topGames=0` re-imposed on product scope | `sourcing/explorer.ts` `explorerUrl` comment; pins unchanged | existing `explorer.test.ts` URL grammar test |
| §5 masters client is the explorer client | `ExplorerClient.#retrieve` shared by `stats`, `mastersStats`, `masterGame` | `masters.test.ts` criterion 6 (both masters paths: 4 requests, 60/120/240 s waits, `source_unavailable`) |
| §5 no systematic index walk | `assertMastersRequest` on every request; `requireSingleMastersGame` | `masters.test.ts` criterion 5 (six index shapes throw `MASTERS_INDEX_REFUSED`; two ids and zero ids throw `MASTERS_ENUMERATION_REFUSED` before any request) |
| §3 `sourceGame` derivation | `sourcing/masters.ts` `sourceGameFromHeaders`, `sourcing/source-game.ts` closed shape | criterion 4 on the real recorded capture (all nine values named); missing/empty/malformed roster fields refused, never defaulted |
| §4 authoring path | `make candidate-emit PIPELINE=masters ARGS='--game <id> --learner-side … --phase … --split-ply N [--to-ply M]'` | strict `sourcing-check` green on the emitted candidate; tampered sidecar fails `SOURCE_GAME_INVALID` |
| §5 annotations stripped | shipped D410 `stripPgnAnnotations` → `parsePgnMainline` → SAN re-rendered from the legal move | criterion 8: `{comment}`, `$2`, `!?`, `!!`, `??` injected; movetext is exactly `e4 e5 f4 d5 exd5 exf4 Nf3`, no prose survives anywhere in `pack.json` |
| §5 source line guard | `attachExplorerEvidence` refuses a masters-sourced pack lacking `MASTERS_RATIONALE` | criterion 7: `ATTACH_SOURCE_LINE_MISSING` before any query, pack bytes unchanged; passes once the line is present |
| Honest unavailability | 401 on aggregates abstains; unavailable game emits nothing (`SOURCE_UNAVAILABLE`); `OFFLINE=1` reads only the recorded capture | `masters.test.ts` |
| Production boundary | `createApplication`, `ENGINE_MODE=mock` | `famous-games-application.test.ts`: masters URL at `/runs/import` → 422 `IMPORT_SOURCE_UNSUPPORTED`; `source.kind: "masters"` → 400; the recorded score pasted as PGN imports into an 86-node run that rewinds (§4's shipped-loop claim); `/capabilities` exposes no dispositions and no masters surface |

Fixture: `apps/server/src/sourcing/fixtures/masters-game-aAbqI4ey.pgn`, a real unauthenticated
capture of the game the dossier probed (HTTP 200, 687 bytes, 2026-09-24T12:43:54Z), with its
`http-capture.v1` provenance record. No chess content was authored: the emitter's objective is the
mechanical placeholder and the pack carries `mechanical-objective-placeholder` and
`authored-teaching-absent` graduation blockers.

No runtime evidence is minted: this lane writes sourcing-ledger records (one `position_legality`
per candidate, an existing kind) and never calls `declareEvidence` or a factory in
`packages/runtime/src/evidence-factories.ts`. The evidence-kinds register is untouched.

## Reused, not rebuilt

- `ExplorerClient` fetch loop, lock, User-Agent, cache and abstention (refactored into one private
  `#retrieve`, not duplicated).
- `stripPgnAnnotations` ([[D410]], `import-source.ts`) and `parsePgnMainline` (`pgn-import.ts`).
  These are the shipped record-boundary pieces. **Nothing from `rfc/live-sources.md` is reused**:
  that RFC is a draft with implementation unauthorized, and the RFC's Depends-on line calling it
  accepted was corrected.
- `readCapturedHttpFixture`, the openings emitter's spine-node shape (copied locally, because `openings.ts` feeds the opening catalogue's compiler digest), `emitterGraduationBlocker`,
  `attachEmitterGraduationClearances`, `validatePackDocument`.

## Not shipped, and why

- **`$defs/provenance.sourceGame` in `schemas/drill_pack.schema.json` (lane 0.31), criterion 3's
  `make pack-check` half and criterion 9's landing.** `make register-check` reports pack-schema head
  0.29 with lane 0.30 claimed by `pack-capability-contract.md` (draft, implementation unauthorized).
  Landing order follows the numbers, so 0.31 cannot land first. The `sourceGame` object ships as a
  `source-game.json` sidecar carrying the exact §3 shape (`SOURCE_GAME_SCHEMA`), closed and validated
  by `sourcing-check`; landing the lane is a relocation into `$defs/provenance`, a `formatVersion`
  bump and a pack-check fixture pair. `make register-check` is green with the lane-0.31 claim still live.
- **A client surface.** The RFC specifies none: §4 scopes it to authoring, and D2 (learner import),
  D4 (cross-pack consumers) and D5 (per-game corpus surface) are explicit deferrals. The application
  test pins that the lift reaches no learner-facing route.
- **A masters aggregate consumer.** `mastersStats` exists on the shared client and is tested; no
  attach/emit pipeline consumes it yet (the `explorer_position_census` record's values are shaped
  for rating buckets and speeds, which the masters endpoint does not have).
- **`make source-fetch SOURCE=lichess-masters`.** The candidate emitter fetches and caches through
  the client directly; a separate metadata fetch would be a second path to the same bytes.

## For the coordinator's closeout

- `rfc/README.md`'s `famous-games.md` row still reads **draft**; the RFC body now reads
  **implementing**, so `status-parity` P2 will report the mismatch until that row is flipped.
- Ledger rows proposed by the RFC (§Ledger rows) are not filed here, per the brief.
- No `design/00`–`06` sentence is falsified: none mentions the masters refusal.
