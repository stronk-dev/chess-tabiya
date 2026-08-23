# D1061 — bestline collection and hint-distance adequacy

**Opened:** 2026-08-23
**Authority:** owner ruling D1061 / original D113
**Status:** complete — provider collection passes; fixed-depth stability and payload sufficiency
fail. Results in `d1061-bestline-distance-results.{json,md}` and
`design/research/bestline-is-not-hint-distance.md`.

## Question

Does the shipped Stockfish `bestline` payload contain stable, sufficient operands to derive the
ruled four-step disclosure axis — square → piece → ply-distance → move — without authored chess
judgement or invented semantics?

This is a producer/meaning check before an RFC. It does not implement the axis, populate authored
content or pick a preset.

## Fixed population

Reuse the 279-position D969/R11 file at `TABIYA_D1061_POSITIONS`. Select a deterministic 64-row
sample by ascending SHA-256 of `(phase, packId, fen)`:

- all 16 `middlegame` rows;
- 24 `opening` rows;
- 24 `cross_phase` rows.

Duplicate FENs are removed before sampling. Report any shortfall rather than silently filling it
from another phase.

## Provider arms

Run installed Stockfish 18, Threads 1, Hash 16, MultiPV 1. Clear hash and send `ucinewgame` before
every probe.

1. fixed depth 8;
2. fixed depth 12;
3. production-shaped `movetime 100` twice, independently reset.

Persist full UCI PV, score domain/value, reached depth and elapsed wall time. Every PV is replayed
through chessops from the exact FEN; illegal or unparseable bytes fail the run.

## Measures and able-to-fail clauses

1. **Collector closure:** every nonterminal probe returns a non-empty, fully legal PV. A terminal
   position abstains explicitly; it is never a fake empty hint.
2. **Fixed-depth stability:** depth-8 versus depth-12 first-move identity agreement ≥90%. This is
   the existing D1023 stability bar reused rather than selected after measurement.
3. **Production repeatability:** the two 100 ms arms agree on the first move ≥90%. This tests the
   actual client default; a fixed-depth result cannot substitute for it.
4. **Payload sufficiency:** each of the four ruled disclosures has one closed derivation from
   `beforeFen + movesUci`, and no rung requires a target, motif, score, authored label or search
   fact absent from that payload. Missing or ambiguous semantics fail; the instrument does not
   invent them.
5. **Increasing disclosure:** for every rung, the legal candidate set consistent with the revealed
   bytes is a subset of the prior rung's set, with at least one strict reduction before exact move
   on ≥50% of positions. Both plausible meanings of “square” (origin/destination) and “piece”
   (exact piece/role) are reported; neither is selected after the run.
6. **Source boundary:** durable content ledgers, runtime `EvidencePayload.bestline` events and the
   read-only `engine-walk` report are counted separately. A count in one may not be presented as
   collection in another.

## Interpretation

- Passing provider stability does not settle payload sufficiency or the disclosure ordering.
- Failing `ply-distance` semantics returns the axis for a narrow author definition; it does not
  revoke the owner's ruling.
- Engine PV may ground what the engine searched. It cannot ground a tactical motif, strategic
  reason, human likelihood or learner advice without another admitted producer.
- No bestline becomes a condition subject or automatic pre-commit default through this run.
