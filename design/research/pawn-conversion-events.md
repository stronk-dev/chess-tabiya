# Pawn conversion events across authored and human play

**Question.** Which exact pawn transitions deserve foundation identities beyond generic contact,
and which require phase-aware selection?

**Verdict.** `[V]` **A named pawn becoming passed—and especially doing so by capture—is a robust,
high-discrimination event across the sealed human paths.** Existing-passer advances and
protected/connected passer gains are phase-dependent: they become discriminating in later play but
must not inherit the endgame-heavy authored corpus's global prior. These are exact structure events,
not claims that a passer is dangerous, favorable, winning or intended.

This answers D774's tested conversion set and materially narrows D725/D742. Candidate passers,
majority/minority conversion and lever plans remain open.

## 1. Pinned conventions

`[V]` The disposable instrument uses legal chessops positions and declares rather than hides its
structure conventions ([chessops source](https://github.com/niklasf/chessops)):

- **passed pawn:** no opposing pawn stands ahead on the same or either adjacent file;
- **protected passer:** a passed pawn is defended by a same-color pawn;
- **connected passed pair:** two passed pawns stand on adjacent files; rank distance is deliberately
  unrestricted and recorded as a limitation;
- **moved pawn became passed:** the same pawn is not passed before and is passed on its destination;
- **capture created moved passer:** the preceding event and the move captured an opposing piece;
- **passed pawn advanced:** the same pawn was passed before and remains passed after moving.

Protected and connected passers are established human-concept candidates, but the concept inventory
does not itself establish learner relevance. `[V]`
[McGrath et al., concept tables pp. 33–35](https://arxiv.org/pdf/2111.09259).

Hard fixtures cover capture-created passage, ordinary passed-pawn advance, an adjacent-file enemy
pawn that prevents passage, newly protected passage and a capture that creates a connected pair.
`[V]` (`tools/d774-pawn-conversion-harness/pawn-conversion.test.ts`)

## 2. Method

Every played move is compared with every distinct legal-result alternative from the same position,
using 2,000 deterministic paired-position bootstrap resamples. The authored and fixed-ply imported
populations stay comparable to D723/D730/D754. Because authored packs deliberately overrepresent
endgames, the same sealed imported games are additionally evaluated over every mainline decision in
three disclosed horizon bands: plies 1–20, 21–40 and 41+. `[V]`

Those bands are not phase truth. They are a falsifier for a universal prior: if a result exists only
late, the selector must receive phase/horizon rather than ranking it globally.

## 3. Results

### Human full-path lift

| Event | Plies 1–20 | Plies 21–40 | Plies 41+ | Disposition |
|---|---:|---:|---:|---|
| moved pawn became passed | **12.46×** (4.05–28.07) | **13.45×** (7.42–21.62) | **7.72×** (5.55–10.69) | admit exact identity; strong Review/drill candidate in every band |
| capture created moved passer | **21.18×** (6.06–66.59) | **14.45×** (7.50–25.21) | **11.58×** (7.59–17.31) | admit exact capture→passer event; retain captured identity separately |
| passed pawn advanced | 0 played | 1.03× (0.25–1.94) | **3.17×** (2.59–3.79) | phase/horizon gated; no universal rank |
| protected passer gained | 0 played | 2.11× (1.00–3.37) | **2.68×** (1.93–3.50) | later-play state/event; middlegame uncertainty retained |
| connected passed pair gained | 5.04× on 1 played event | 2.13× (0.72–3.83) | **2.73×** (2.03–3.53) | later-play candidate; early/middle sparse |

`[V]` Full counts and rates are in `tools/d774-pawn-conversion-harness/output.md`. The full-path
bands contain 2,135 / 1,945 / 2,862 decisions and 64,592 / 66,728 / 70,913 legal alternatives.

### Why the authored headline cannot become the product prior

Authored pack spines report `passed_pawn_advanced` at **18.81×** (11 played events), while the
fixed-ply imported sample contains zero played events and full human paths show 0.00× / 1.03× /
3.17× across the three bands. `[V]` That is expected corpus purpose: authored endgame drills select
passer advances. It is not evidence that every passer push deserves top prominence in an opening or
middlegame module.

Conversely, capture-created passage has zero authored played examples but is strong in all human
bands. Existing pack coverage is therefore not a completeness oracle. A foundation built only from
what current packs happen to exercise would omit one of the sharpest measured pawn events.

## 4. Product routing

- **Review:** `capture_created_moved_passer` and `moved_pawn_became_passed` are eligible moments;
  render one compact before/after pawn module with the blocking pawn/capture and passage lanes.
- **Touch/hover:** show passed status, remaining enemy pawn blockers and protection/connection
  relations on demand. Do not announce a strategic verdict.
- **Drills/packs:** authors may use exact conversion events as triggers after an accepted RFC;
  engine, tablebase, theory or authored consequence supplies “convert,” “dangerous” or “winning.”
- **Bots:** policy may prefer/avoid candidate moves that create or advance passers, with phase and
  strength guards. The declared weight is bot personality, not chess truth.
- **Player habits:** use opportunity residuals split by phase/time control. Raw passer counts mostly
  measure which positions the player reached.
- **Campaign:** a pack/node may select a passer-conversion encounter; campaign progression must not
  grade an arbitrary pawn move from the detector alone.

## 5. Remaining pawn breadth

This pass does not define candidate passers, minority attacks, majority conversion, pawn storms,
lever timing, favorable liquidation, blockade quality or promotion races. Those require additional
conventions and, for valence, theory/search/tablebase/authorship. The safe foundation is additive:
ship the exact passage identities now, then join stronger authorities later without rewriting the
meaning of existing pack predicates.
