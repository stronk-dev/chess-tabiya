# RFC: Famous games — lifting the masters refusal and making a cited game machine-readable

- **Status:** draft — 2026-08-23
- **Author:** claude
- **Created:** 2026-08-23
- **Design refs:** `design/03-product-breadth.md` §Library (packs, games, positions, historical sources); `design/01-training-model.md` (authored framing over a played consequence)
- **Exploration gate:** [[D1093]] (drafting mandate) plus [[D1060]] (the owner's FULL LIFT ruling); the research this draws on is `design/research/famous-game-sources-licensing.md`, landed 2026-08-23
- **Depends on:** the shipped explorer sourcing lane (`apps/server/src/sourcing/explorer.ts`); `rfc/live-sources.md` (accepted — the record-boundary annotation strip this reuses)
- **Parent / amends:** amends the capability record at `apps/server/src/capabilities.ts:159`; answers [[D329]]'s provenance axis
- **Supersedes / superseded by:** —
- **Planning:** `planning/famous-games/` (once implementing)

```tabiya-claims
pack-schema | lane 0.31 | $defs/provenance.sourceGame (new, closed object: white, black, event, site, date, round, result, sourceId, licenceBasis)
```

## Summary

The owner ruled a **full lift** of the famous-game refusal ([[D1060]]) after research established
that the licence question was never a licence problem: Lichess asserts no rights over the masters
database, imposes no attribution term, and serves individual master games as **bare scores with
zero annotations**. This RFC spends that ruling. It replaces one bundled refusal with three
`reached` records and one **narrow, genuinely-supported** refusal (third-party annotations); adds
the `sourceGame` provenance object [[D329]] asked for so a cited game becomes machine-readable
rather than free text; and routes masters fetches through the **authoring** lane that already
serialises and backs off, not through a learner-facing import. It claims **pack-schema lane 0.31**
and no migration position — and states plainly that this takes Gate F clause 1 from three lanes
deep to four.

## Motivation

Three facts, each verified at HEAD.

**The refusal is still in the code and it bundles two unlike things.** `capabilities.ts:159`
reads, byte-exact:

```ts
{ instrument: "Explorer", capability: "topGames / recentGames / masters database", disposition: "refused", reason: "Per-game scope and licence questions remain unresolved" },
```

One row, three capabilities, and a reason that conjoins a **product judgement** (*"per-game
scope"* — defensible for the corpus panel, which renders population results) with a **falsifiable
claim about the outside world** (*"licence questions remain unresolved"*). Only the second was
ever this project's to answer, and the answer is now on file. [[D1086]] recorded that the ruling
lifting it changed nothing, because nobody edited the file; §1 names the exact edits.

**The refusal's own neighbours contradict it.** `capabilities.ts:155-156` mark position and
per-move aggregates `reached`, on the recorded rationale at `sourcing/explorer.ts:23`:

```ts
export const EXPLORER_RATIONALE = "aggregate statistics are facts; the underlying Lichess game data is CC0; requests are serialized to follow the Lichess opening-explorer etiquette";
```

That rationale has two independent legs. *Aggregate statistics are facts* applies to `/masters`
identically. *The underlying data is CC0* does not — the masters corpus is published nowhere, so
it is **unlicensed and unclaimed rather than forbidden**. The refusal was standing on the second
leg without ever saying so, which is why nobody could tell it was a deferral.

**A cited game is currently unreadable.** `$defs/provenance` requires only `reviewStatus` and
offers `sources` as a bare `string[]`; `sourceGame` occurs **zero times** in `schemas/`, `apps/`
or `packages/`. A pack can say *"from Kasparov–Topalov, Wijk aan Zee 1999"* in free text and
nothing can index it, filter by it, offer *"more from this game"*, or let the campaign use a game
as a run theme. [[D329]] is right about that, and understates one thing: `provenance` already
carries `licence` and `attribution` slots, so an **attribution obligation needs no schema change**
— only the game identity does.

## Specification

### §1 — The refusal is replaced by three records and one narrower refusal

Delete the single row at `capabilities.ts:159`. In its place:

| Capability | Disposition | Basis |
|---|---|---|
| `topGames` / `recentGames` | **refused** | Product scope only: the corpus panel renders population results, not games. **No licence claim.** |
| masters database — position and per-move aggregates | **reached** | Same terms as the Lichess explorer: no rights asserted, no attribution required (§2). Aggregate statistics are facts. |
| masters per-game PGN (`explorer.lichess.org/masters/pgn/{id}`) | **reached** | A bare game score is a record of fact (§2). **Hand-selected games only — no systematic index walk.** |
| imported game — third-party annotations, NAGs and move verdicts | **refused** | Commentary is copyrightable expression *and* another product's verdict on a move. Stripped at the record boundary ([[D410]]/[[D959]], law 8). |

**The product-scope judgement does not survive the lift by default.** [[D1060]] is explicit: the
`topGames=0` / `recentGames=0` pins at `explorer.ts:74-75` were never an owner decision, they rode
a licence question. This RFC **re-imposes them on their own merits** — the corpus panel has no
per-game consumer, so rendering games there would be a surface with no reader — and records that
as a separate, revisitable product judgement rather than a licence conclusion. If a per-game
corpus surface is ever wanted, it argues for itself; nothing here forecloses it.

**The fourth row is the one refusal the evidence supports**, and it generalises past Lichess: it
binds any imported source, which is what makes it worth a record rather than a code comment.

### §2 — The legal basis, stated once so no successor re-derives it

Full reasoning and sources: `design/research/famous-game-sources-licensing.md`. The load-bearing
claims, with their strength stated honestly:

- **Lichess's terms are silent on the masters database.** The API reference's entire Opening
  Explorer section is three lines about hostnames — no licence, no attribution, no redistribution
  clause. The silence is meaningful because the **Puzzles** tag in the same document *does* say
  *"Our collection of puzzles is in the public domain."* Where Lichess grants, it says so.
- **The endpoint returns a bare score.** Live probe 2026-08-23: `explorer.lichess.org/masters/pgn/{id}`
  → **200**, seven Seven-Tag-Roster tags, two Elo tags, movetext, and **zero comments, NAGs or
  `%eval` annotations**. This source sits structurally on the safe side of the line [[D410]] already
  drew for broadcasts.
- **Game scores are facts, not works.** *Feist Publications v. Rural Telephone*, 499 U.S. 340
  (1991) controls for the US. Probable but **formally open** in the EU: the Swiss Federal Institute
  of Intellectual Property (Dec 2024) states outright that the question *"cannot be answered
  conclusively due to the scarcity of case law and sources."* **`World Chess v. Chessgames` (SDNY
  2016) is a preliminary-injunction denial on hot-news and contract theories, not a merits
  copyright holding** — it must not be cited as settling copyright, and this RFC does not.
- **The real EU exposure is the database right, not the moves.** Directive 96/9/EC Art. 7(5)
  targets *"repeated and systematic extraction"* of a substantial part. Hand-picking named games is
  not that; walking the masters index is. **The constraint is on the harvesting method, not on the
  game** — which is why §5's obligation is a cap on enumeration rather than a limit on which games
  may be used.
- **Annotations are the risk surface.** Moves, result, players and event are facts. Prose
  commentary is copyrightable expression. **Even bare `!`/`?` suffix glyphs are reported
  protectable** — which is why the strip is structural rather than a denylist of verdict words.

### §3 — `sourceGame`: the provenance object

New, on `$defs/provenance`, optional, closed:

```json
"sourceGame": {
  "type": "object",
  "additionalProperties": false,
  "required": ["white", "black", "date", "result", "sourceId", "licenceBasis"],
  "properties": {
    "white":        { "type": "string", "minLength": 1, "maxLength": 120 },
    "black":        { "type": "string", "minLength": 1, "maxLength": 120 },
    "event":        { "type": "string", "maxLength": 200 },
    "site":         { "type": "string", "maxLength": 200 },
    "date":         { "type": "string", "maxLength": 10 },
    "round":        { "type": "string", "maxLength": 20 },
    "result":       { "enum": ["1-0", "0-1", "1/2-1/2", "*"] },
    "sourceId":     { "type": "string", "minLength": 1, "maxLength": 120 },
    "licenceBasis": { "enum": ["no-rights-asserted", "cc0", "cc-by-sa-4.0", "public-domain"] }
  }
}
```

Every required field is a field the masters PGN already returns, so nothing must be authored by
hand to satisfy the shape. `date` is PGN date format (`YYYY.MM.DD`, with `??` for unknown parts),
not ISO — the source's own convention, kept so a round-trip is lossless.

**Why a typed object rather than the existing `attribution` array.** `attribution` is typed
`{ "type": "object" }` — unconstrained. A game identity dropped in there is exactly as unreadable
as the free-text `sources` string [[D329]] complains about: nothing can index it, because nothing
can rely on a key being present. The value of this row *is* the typing. The alternative is
recorded and refused rather than left unexamined.

**`licenceBasis` reuses shipped vocabulary.** `import-source.ts:65` already stamps
`licenceNote: "no-rights-asserted: learner-supplied bytes"`, and `explorer.ts:81` stamps
`licence: { basis: "no-rights-asserted", ... }`. The enum is that basis vocabulary plus the
CC BY-SA term broadcasts require.

### §4 — The authoring path, and what is deliberately not in scope

**In scope: authoring.** A masters game reaches a pack the way every other sourced fact does —
through the sourcing lane that already exists. `make source-fetch SOURCE=<id>` (`Makefile:83`)
and the `candidate-emit` / `candidate-attach` pipeline (`:88`, `:93`) are the shipped shape; a
`masters` source joins them. The fetched PGN is parsed, the Seven-Tag-Roster fields populate
`sourceGame`, and the movetext becomes authored pack content. `explorer.ts:247` already refuses to
attach evidence unless the pack's `provenance.sources` carries the rationale line — the mechanism
for binding a licence basis to a pack **exists and is tested**; this reuses it rather than
inventing a parallel one.

**Not in scope: runtime import of a masters game by a learner.** That would route through
`importGame`, whose `source_kind` is a **closed CHECK** — `('pgn_paste','lichess_url')` at
`storage.ts:4388` — so a new source kind is a rebuild migration, and `live-sources` already holds
the position behind `campaign-core` for exactly that column. Adding a second value in a different
RFC would collide with a claim already on the register. **Deferred to Discharge D2**, to land
behind `live-sources` if a learner-facing masters import is ever wanted.

**How much of this is wiring, honestly.** `importGame` already replays a mainline into a real
`DrillRun` via `commitMove` (`service.ts:788-858`), so **the consequence loop works on a historical
game today** — paste a famous game and you can play it, rewind it, branch it. What is missing is
not the loop but the *framing*: nothing maps `parsed.headers` onto pack provenance, so the run gets
a display title and nothing else. A famous-game **pack** is authored framing (what to notice, where
to branch) over a game that already imports. This RFC ships the provenance half and the licence
half; the authored half is content work, not code.

### §5 — Obligations that ride the lift

| Obligation | Source | Where it lives |
|---|---|---|
| Serialise requests; back off on 429/5xx | Lichess rate-limiting etiquette | **Already shipped** — `explorer.ts:128` retries on 429 and ≥500 with waits, then abstains `source_unavailable`. Extend the same client to `/masters`; do not build a second fetch path. |
| Contact-bearing User-Agent + OAuth token | Both endpoints returned **401** unauthenticated on probe | Already shipped. The token becomes a hard dependency, so the ToS revocation clause is recorded as an availability risk, not assumed away. |
| **No systematic index walk** | Directive 96/9/EC Art. 7(5) | **New.** Masters fetches are capped to author-named game ids; bulk enumeration of the index is refused in the sourcing lane (criterion 5). |
| Record the source even though no attribution is required | §2 | `provenance.sources` / `licenceNote`, as `explorer.ts:247` already demands. |
| **Attribution IS required for broadcast-sourced games** | Lichess broadcasts are CC BY-SA 4.0 | `provenance.attribution`, with `licenceBasis: "cc-by-sa-4.0"`. **Share-alike must be assessed before a broadcast-sourced pack ships** — not resolved here. |
| Strip annotations at the record boundary | §2, [[D410]]/[[D959]] | `parsePgnMainline` keeps only `{san, uci}` per move (`pgn-import.ts:11`), so the parse already drops them; the hole is [[D959]]'s raw-bytes retention, addressed in that row's own lane. |

### §6 — Coverage, stated honestly

The lift is substantive rather than a formality because of a gap nothing else fills ([[D1046]]):

| Era | Best licensed source | Coverage |
|---|---|---|
| Pre-1929 | Project Gutenberg (Capablanca, Ed. Lasker, Staunton, Bird, Edge's Morphy) | The only genuinely public-domain source of **annotated** classics |
| **1930–2018** | **none with an affirmative grant** | TWIC is *"free for personal use only. All rights are reserved"*; chessgames.com likewise |
| Modern elite | Lichess broadcasts, CC BY-SA 4.0 | 1,186,335 games, elite play only |

So the masters database is **irreplaceable precisely across the era most "famous games" come from**
— Alekhine to Kasparov. A reader deciding whether this RFC was worth its lane should weigh that,
not the pre-1929 books.

### §7 — What defers

Named, with homes, so none of it becomes a silent scope cut:

- **The authored packs themselves** — content work under the content hold ([[D949]]/[[D560]]), not
  this RFC.
- **Learner-facing masters import** — Discharge D2, behind `live-sources`' migration position.
- **Broadcast share-alike assessment** — Discharge D3; BY-SA's implications for a pack that embeds
  a broadcast game are not resolved here.
- **Cross-pack consumers** (*"more from this game"*, campaign game-themes, indexing by player) —
  Discharge D4. `sourceGame` makes them expressible; none is built, and this RFC does not pretend
  otherwise.

## Deviations from design

One. `design/03-product-breadth.md`'s Library row lists *"historical sources"* as a surface without
naming a provenance axis. This RFC supplies the data shape that surface would need, and does not
build the surface. No intent-tier amendment is owed; the row is not contradicted.

## Acceptance criteria

Each names what a wrong implementation would do to pass it.

1. **`capabilities.ts` contains no row whose `capability` string bundles `masters database` with
   `topGames`.** A grep for `"topGames / recentGames / masters database"` returns zero hits, and
   four distinct rows exist per §1. *Wrong implementation that passes a weaker version: editing the
   reason string while leaving one bundled row — hence the grep on the exact bundled literal.*
2. **The `topGames`/`recentGames` refusal reason contains no licence claim.** Its text names corpus-panel
   scope only; a test asserts the strings `licence`, `license` and `rights` are absent from that row's
   reason. *Wrong implementation: carrying the old reason forward verbatim.*
3. **`$defs/provenance.sourceGame` validates the six required fields and rejects a seventh key.** A
   fixture pack with `additionalProperties` inside `sourceGame` fails `make pack-check`; a fixture
   with all six required fields passes. *Wrong implementation: an unconstrained object, which is
   the `attribution` slot this row exists to avoid.*
4. **A masters PGN populates `sourceGame` with no hand-authoring.** A fixture drives the fetch path
   with a recorded masters response and asserts all six required fields are derived from the
   Seven-Tag-Roster; the assertion names the field values, not just their presence. *Wrong
   implementation: defaulting a missing field to an empty string.*
5. **Bulk enumeration is refused.** A sourcing call requesting more than one masters game id per
   invocation, or any call to a masters *index* endpoint, throws a typed refusal. The negative
   fixture asserts the throw. *Wrong implementation: documenting the cap in prose — hence a fixture
   that must be red before the cap exists.*
6. **The masters client is the explorer client.** A test asserts the masters fetch path shares the
   429/5xx retry-and-abstain behaviour at `explorer.ts:128` — specifically that a stubbed 429
   produces one retry then a `source_unavailable` abstention. *Wrong implementation: a second fetch
   helper that happens to be polite today.*
7. **A pack carrying `sourceGame` also carries its licence basis in `provenance.sources`.** The
   existing `ATTACH_SOURCE_LINE_MISSING` guard (`explorer.ts:247`) extends to masters-sourced packs;
   a fixture without the source line fails to attach.
8. **No annotation survives into a masters-sourced pack.** A fixture masters PGN with injected
   `{comment}`, `$2` and `!?` produces pack content containing none of `{`, `}`, `$`, `!`, `?` in
   its movetext. *Wrong implementation: a denylist of verdict words, which `!?` defeats.*
9. **The register and the body agree.** `make register-check` is green with the lane-0.31 row
   joining this RFC's `tabiya-claims` block byte-for-byte.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Apply the lift to `capabilities.ts` and `explorer.ts` — [[D1086]] recorded that the ruling changed no code | codex | this RFC's implementing commit | |
| D2 | Learner-facing masters import (`imported_games.source_kind` gains a value; a migration position behind `live-sources`) | claude | a successor RFC | |
| D3 | Broadcast share-alike: what CC BY-SA 4.0 requires of a pack embedding a broadcast game | OWNER | `planning/platform-alignment/decision-queue.md` | |
| D4 | Cross-pack consumers of `sourceGame` — indexing, "more from this game", campaign game-themes | claude | a successor RFC | |
| D5 | Whether a per-game corpus surface is ever wanted (§1 re-imposes `topGames=0` on product grounds, revisitably) | OWNER | `planning/platform-alignment/decision-queue.md` | |

## Open questions

None blocking. D3 and D5 are owner-tier and registered above; neither prevents this RFC from
landing, because both concern sources and surfaces outside the masters lift.

## Ledger rows

Proposed; ids assigned at landing. Head was **D1142** at drafting.

- **🐞 (proposed)** — `capabilities.ts`'s refusal vocabulary cannot distinguish a product
  judgement from a licence conclusion, which is how one row refused an entire corpus on a
  panel-scope argument. §1 splits this instance; the general defect — that a `refused` row costs
  less justification than an `unmeasured` one — is [[D1045]]'s and is not fixed here.
- **💡 (proposed)** — `sourceGame` makes a cited game machine-readable, which gives authored prose
  unusually strong provenance: an annotated master game is the oldest chess pedagogy there is, and
  a cited game is a rung-5 claim whose source is **checkable** in a way *"authored consensus"*
  never is. Recorded because it is a reason to build the consumers in D4, not an obligation here.
- **📊 (proposed)** — the 1930–2018 coverage gap (§6) is a standing content constraint, not a
  defect: no source with an affirmative grant covers Alekhine to Kasparov, so packs from that era
  rest on the masters lift alone.

## Changelog

- 2026-08-23 — drafted from `design/research/famous-game-sources-licensing.md` under [[D1093]],
  spending owner ruling [[D1060]]. Scoped to the authoring path; learner-facing import deferred
  once the shipped `source_kind` CHECK was found closed and its migration position already claimed
  by `live-sources`.
