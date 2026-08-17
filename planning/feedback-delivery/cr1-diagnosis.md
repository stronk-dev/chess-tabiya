# CR1 diagnosis — why the Stage 1 strip filter admitted everything

Measured 2026-08-17 against the uncommitted `feedback-delivery` Stage 1 tree. Instrument:
`tools/cr1-diagnosis-probe/` (**DISPOSABLE**, prints to stdout, writes no repository file; delete
after reading). Every number below is one this probe produced; `n` is stated with each. Claims
marked **[symbol]** were read in the shipped source; nothing here is asserted from the RFC's prose.

---

## Verdict

**This is a coverage fact, not a cannot-fire.** [[D428]]'s distinction resolves cleanly in CR1's
favour:

- The observation identity contains **nothing path-specific** — no node id, no ply, no FEN — so two
  columns *can* share one. **[symbol]**
- `common` is **never empty** on any real fork set in the corpus: n = 44 fork sets, `|common|`
  median **72**, min **23**, max **94**, and **0 of 44** have `|common| = 0`.
- CR1 **does** fire: it removes **592 of 5,000** candidate strip entries corpus-wide
  (**11.8%**; admission **88.2%**), and removes at least one entry in **41 of 44** fork sets.
- A positive control drives admission to **3.1%** (transposition, 62 of 64 filtered) and to **0%**
  (identical branches, 48 of 48 filtered — CR3's named degenerate case, confirmed working).

**The 100% at N = 2/4/8 is an artefact of the measuring instrument, not a property of CR1.** The
Stage 1 harness's `comparisonMeasurement`
(`tools/feedback-delivery-harness/feedback-delivery.test.ts:105-127`) gives every column **exactly
one ply past the fork** — it commits a single opening move per branch from the initial position and
never continues the line. At one ply, `common ∩ candidates = ∅` for a near-structural reason
(§3 below), so the filter is a no-op *for that instrument* at every N. Criterion 16 did not fire on
CR1. It fired on a measurement of a one-ply comparison.

**Recommendation: repair, do not replace and do not withdraw.** Details and the residual honest
caveat in §9.

---

## 1. What an observation identity actually contains

**[symbol]** `packages/runtime/src/compare-strips.ts:19`:

```ts
function observationKey(value: StructuralObservation): string { return JSON.stringify(value); }
```

`StructuralObservation` (`packages/runtime/src/structure.ts:77-89`) is
`{ kind, color?, role?, squares, file?, count?, detail?, provenanceNote?, shade?, form?, zone? }`.
Measured field union over three positions (start, an Italian middlegame, a K+P endgame):
`color, count, detail, file, kind, role, shade, squares, zone`. **No node id, no ply index, no FEN,
no branch id.** The identity is a pure function of the position's board content.

Empirical confirmation that identities are comparable across columns: the readings after **1.e4**
and after **1.d4** from the start position are 85 keys each and share **70** of them, across eight
kinds (`bishop_on_shade`, `direct_attack_count`, `king_zone`, `line_blockers`, `pawn_safe_square`,
`piece_count`, `piece_distance`, `piece_reach_count`).

So `common` is not empty by construction, and CR1 is not a filter over a set that is always empty.
The "cannot fire" hypothesis is **refuted**.

One caveat on identity *width*, which matters in §8: identities are extremely finely parameterised.
A `pawn_safe_square` identity carries the whole `detail: PawnSafety` record, including the full
`pushAttackers` / `captureAttackers` arrays with per-pawn distances — so its identity changes
whenever any enemy pawn's distance to that square changes anywhere on the board.

---

## 2. The fork exclusion is implemented as specified

§4.1 settles this deliberately, and the implementation matches on both halves. **[symbol]**
`compare-strips.ts`:

- `:27` — `pathObservations` is built from `branchPath(...).filter((node) => node.ply > fork.ply)`.
  **Strictly past the fork.** The fork's own reading is excluded from every column's set. ✅
- `:40` — the emission loop runs over `ply >= fork.ply` but guards with `if (node.id !== fork.id)`,
  so **no strip entry is ever emitted at the fork node**, while `previous` is still seeded from the
  fork's reading so the first node past the fork is diffed against the fork. ✅ (`path[0]` is
  necessarily the fork: `branchPath` returns a linear ancestry and `setFork` — `compare.ts:131-141`
  — returns the deepest node common to every column.)

**The choice is live, not cosmetic.** Re-measuring the same 44 corpus fork sets with a
fork-*inclusive* `pathObservations` filters **633** entries instead of **592**, and the two readings
disagree on **20 of 44** fork sets. The shipped code takes the reading §4.1 specifies. An
off-by-one at the fork is **not** the cause of the empty intersection — there is no empty
intersection.

---

## 3. Why the instrument reads 100%, decomposed

The shipped instrument's own numbers, re-derived through the shipped `comparisonStrips`
(my `admitted` equals the shipped `structure` total in **every** row measured in this document —
that is the fidelity check on my re-implementation):

| N | plies past fork, per column | \|pathObservations\| per column | \|common\| | candidates | filtered | admitted |
|---|---|---|---|---|---|---|
| 2 | 1, 1 | 85 each | 70 | 23 | **0** | 23 (100%) |
| 4 | 1 × 4 | 85 each | 61 | 43 | **0** | 43 (100%) |
| 8 | 1 × 8 | 85 each | 53 | 79 | **0** | 79 (100%) |

`common` is large — 70, 61, 53 — and **none of it can ever be a candidate**. At one ply past the
fork the candidate set is exactly `obs(fork+1) \ obs(fork)`, i.e. only what the single move
*changed*, while `common` at one ply is `⋂ obs(fork+1ᵢ)`, which is dominated by what every move
*left alone*. For a candidate to be filtered, N different first moves would have to independently
produce the identical new observation. That happens ~never — hence 0, 0, 0.

CR5's monotone-decreasing selectivity is visible in the table (`|common|` 70 → 61 → 53) and is
correct. It simply cannot express itself in the admission rate when the numerator is already
saturated by a one-ply path.

### The same instrument, re-shaped

Same eight openers, but each column then continues, extended deterministically by the first legal
move from a fixed preference list (construction stated so it is reproducible, not chosen for the
result):

| column depth | N = 2 | N = 4 | N = 8 |
|---|---|---|---|
| 4 plies | 35.4% (53/82 filtered) | 34.6% (104/159) | **35.7%** (200/311) |
| 8 plies | 15.1% (146/172) | 25.2% (255/341) | **29.4%** (476/674) |
| 12 plies | 8.3% (264/288) | 25.8% (423/570) | **27.6%** (815/1126) |

**N = 8 admission is 27.6–35.7%, not >90%.** Criterion 16's reopening threshold is not reached by
any properly-shaped constructed instrument I could build. CR5's prediction — admission rises
monotonically with N — is confirmed at every depth (8-ply: 15.1 → 25.2 → 29.4).

---

## 4. The sharing distribution on real comparison sets

Population: every spine fork in `content/drafts` (56 pack documents scanned) with ≥ 2 children.
Each fork is replayed through the shipped runtime — commit the shared prefix, then rewind and play
each child's **deepest** leaf continuation as its own column — then measured with the shipped
`compareBranches` + `comparisonStrips`. Taking the deepest continuation is deliberately the **best
case** for CR1. n = **44** fork sets, 0 skipped.

| quantity | n | min | p25 | median | p75 | max |
|---|---|---|---|---|---|---|
| `\|common\|` per fork set | 44 | 23 | 66 | **72** | 78 | 94 |
| candidate strip entries per fork set | 44 | 19 | 56 | 96 | 150 | 427 |
| entries CR1 filtered per fork set | 44 | 0 | 3 | **10** | 22 | 63 |
| shortest column, plies past fork | 44 | 1 | 1 | **2** | 2 | 6 |
| longest column, plies past fork | 44 | 1 | 4 | 6 | 9 | 43 |

- **Fork sets with `|common| = 0`: 0 / 44.**
- **Fork sets where CR1 removed ≥ 1 entry: 41 / 44.** The three silent ones are
  `anti-french-advance-white@ply6` (N=2, plies [2,2], |common|=64, 48 candidates),
  `najdorf-english-attack-black@ply6` (N=2, [1,1], |common|=75, 19 candidates), and
  `rook-4v3-same-side-hold@ply2` (N=2, [4,4], |common|=23, 29 candidates).
- **Corpus totals: 5,000 candidates, 592 filtered, 4,408 admitted — admission 88.2%.** The shipped
  strip returned exactly 4,408 entries over the same 44 fork sets.
- Split by width — CR5's direction, on real data: **N = 2** (38 forks) admission **86.4%**
  (562/4118 filtered); **N = 3** (6 forks) admission **96.6%** (30/882).
- Split by the shortest column's depth past the fork: 1 ply **91.7%** (19 forks), 2 plies **87.0%**
  (16), 3 plies **84.7%** (5), 4+ plies **88.4%** (4).

### The corpus cannot produce criterion 16's measurement at all

**No authored fork in this corpus is wider than three columns**: 38 binary, 6 ternary, 0 at N ≥ 4.
That confirms criterion 5's `[final author pass 2026-08-16]` note as a fact rather than an estimate,
and it means the corpus number above is *not* the criterion-16 measurement and cannot be made into
one. N = 4 and N = 8 must be constructed (§3).

---

## 5. Positive controls — proof CR1 fires, and fires hard

Built through the shipped runtime and measured with the shipped `comparisonStrips`:

| control | columns | \|common\| | candidates | filtered | admission |
|---|---|---|---|---|---|
| transposition | 1.Nf3 d5 2.d4 vs 1.d4 d5 2.Nf3 | 95 | 64 | **62** | **3.1%** |
| transposition, 4-ply | 1.e4 e5 2.Nf3 Nc6 vs 1.Nf3 Nc6 2.e4 e5 | 104 | 86 | **78** | **9.3%** |
| identical branches (CR3) | 1.e4 e5 twice | 97 | 48 | **48** | **0%** |

The identical-branch row also verifies CR3's second named case at the symbol: the column's strip is
legitimately empty (shipped `structure` length 0), not a fallback.

---

## 6. A degenerate case CR3 does **not** name — and here CR1 genuinely cannot fire

If **any single column has zero plies past the fork**, `pathObservationSets` for that column is the
empty set, so `common = ∅` (`compare-strips.ts:30-32`) and **CR1 becomes a no-op for the entire
comparison**, all N columns included.

Measured: a 3-column comparison with columns of [1, 1, 0] plies gives `|common| = 0`, 23 candidates,
**0 filtered**, shipped strip 23.

This state is reachable in the shipped product — `comparisonNarrative` (`compare-strips.ts:72`)
already renders *"Branch at offset N has no recorded move past the fork"* — and CR3 names only
`N < 2` and identical branches. This is a real, narrow **cannot-fire** in the [[D428]] sense, but it
is a *sub-case*, not CR1's condition, and the fix is one clause in CR3 (exclude empty columns from
the intersection, or state that the filter does not apply).

---

## 7. What is in `common` versus what is in the candidate set

Corpus-wide counts by observation kind (n = 44 fork sets):

| kind | in `common` | candidates |
|---|---|---|
| `line_blockers` | 968 | 1408 |
| `piece_count` | 526 | 114 |
| `direct_attack_count` | 444 | 787 |
| `piece_reach_count` | 435 | 1106 |
| `pawn_safe_square` | 359 | **1269** |
| `bishop_on_shade` | 135 | 92 |
| `king_zone` | 85 | 30 |
| `half_open_file` | 46 | 52 |
| `piece_distance` | 40 | 42 |
| others (`open_file`, `backward_pawn`, `named_structure`, `doubled_pawn`, `isolated_pawn`, `king_opposition`, `outpost`, `passed_pawn`) | 43 | 97 |

§4.2's claim about the unconditional census is confirmed in the direction it predicted:
`piece_count` is **526 in `common` against 114 candidates** — it is overwhelmingly the shared,
filtered material, which is exactly what "under CR1 a `piece_count` survives only where the columns'
material actually differs" asserts. No special case was needed.

---

## 8. Secondary finding — `compare-strips` does not use `structure.ts`'s own identity function

**[symbol]** There are two identity functions in the tree and the strip uses the weaker one:

- `structure.ts:446-450` defines `observationKey` (full JSON) **and** `observationIdentity`, which
  strips `detail` for `pawn_safe_square`. `structuralDelta` (`:506`) deliberately uses
  `observationIdentity`.
- `compare-strips.ts:19` defines its **own private** `observationKey` = full JSON, and uses it for
  both `pathObservations` and the gain test.

Consequence: a `pawn_safe_square` gains a new identity whenever any enemy pawn's distance to that
square changes, anywhere on the board. That is why it is the **largest single candidate kind
(1,269 of 5,000 = 25.4%)** while contributing only 359 to `common`.

Re-measuring the whole corpus under `observationIdentity` semantics: candidates fall from **5,000 to
4,029** (−19.4% strip volume before CR1 does anything), filtered 566, **admission 86.0%** vs 88.2%.

So this is worth doing — it deletes 971 strip entries that were never real changes — but it is a
fix to the *strip*, not to CR1, and it does not move the admission rate materially. It is also a
private constant that a second module needed and re-declared, the shape [[D449]]/[[D430]] describe.

---

## 9. Recommendation — **repair CR1; replace the instrument**

**Do not withdraw.** Withdrawal requires a cannot-fire, and the evidence says the opposite: CR1
fires in 41 of 44 real fork sets, removes 11.8% of corpus strip volume, and reaches 3.1% and 0%
admission on controls. Under [[D428]]'s rule, this is a coverage fact.

**Do not replace.** No replacement is warranted by anything measured here, and reaching for one now
would repeat the error §4.1 already refuses: R3's **ρ = −0.143** between firing rate and
false-positive rate means a selectivity score is not a quality score, and *nothing in this diagnosis
measured quality*. I measured volume. A majority-absence rule or per-pair strip would raise the
filtered count and I have **no evidence** that the entries it removed deserved removal. That
inference is unavailable and I am not making it.

**The three repairs, in cost order:**

1. **Fix the instrument and re-run criteria 5 and 16** (blocking, cheap). `comparisonMeasurement`
   must give each column a multi-ply continuation. Reporting N = 2/4/8 over one-ply columns does not
   satisfy criterion 5's intent, because it cannot express the property criterion 16 is
   thresholding. On a re-shaped instrument N = 8 admission is **27.6–35.7%** and criterion 16 does
   **not** fire.
2. **Add the empty-column case to CR3** (one clause). §6 above.
3. **Reuse `structure.ts`'s `observationIdentity` in `compare-strips`** (one import). §8 above —
   this is separately valuable and independent of CR1.

**The residual caveat, stated rather than buried.** On the corpus as it exists today CR1's admission
is **88.2%**, which is 1.8 points under criterion 16's threshold, and **96.6% at N = 3** — the widest
comparison the authored content can produce. CR5's degradation is real and visible on real data. But
the driver is a **corpus property, not a filter defect**: the median fork's shortest column runs
**2 plies** past the fork before terminating, and 19 of 44 forks have a column of **1** ply. CR1
works by finding structure that recurs on every path; authored columns that stop two plies after
diverging give it almost nothing to intersect. That is a content-shape fact and it belongs in
D78's row as one, not as a verdict on the mechanism.

This is also exactly what the RFC claimed. §4.2: *"CR1 may barely reduce the strip at all … the
direction is right and the size is unknown"*, and *"What CR1 asserts is an identity, not a
magnitude."* The identity holds; the magnitude is now measured at **11.8% of entries removed on the
authored corpus, 64–100% on columns that actually share a path**. Criterion 5 said to record the
number *whatever it is*. That is the number.

---

## 10. Proposed ledger rows (D526+) — **not written**; ids through D525 are in use

- **D526 🐞** — *The Stage 1 CR1 measurement was taken on one-ply columns, so criterion 16 fired on
  the instrument rather than on CR1.* Every column in `comparisonMeasurement` is a single opening
  move from the start position; at one ply the candidate set is `obs(fork+1) \ obs(fork)` and
  `common` is dominated by what did not change, so the intersection is disjoint from the candidates
  by construction and admission is 100% at every N. Re-shaped to multi-ply columns the same
  instrument gives N = 8 admission of 27.6–35.7%. A no-op filter and a filter measured through a
  no-op instrument are indistinguishable in a single admission percentage — the diagnostic that
  separates them is `|common|` and the filtered count, neither of which the harness records.
- **D527 🐞** — *`comparisonStrips` re-declares its own `observationKey` instead of using
  `structure.ts`'s `observationIdentity`, so 25.4% of strip candidates are `pawn_safe_square`
  entries whose identity changed because a pawn moved elsewhere on the board.* `structuralDelta`
  already strips `detail` for exactly this reason. Reusing it removes 971 of 5,000 corpus strip
  entries (−19.4%) before any filtering. Same shape as [[D430]]/[[D449]]: a private constant a
  second module needed and copied.
- **D528 🐞** — *CR3 does not name the empty-column case, and there CR1 genuinely cannot fire.* A
  single column with zero plies past the fork makes `common = ∅` and disables the filter for the
  whole comparison, all N columns. The state is reachable and already has rendering
  (`comparisonNarrative`'s *"no recorded move past the fork"*).
- **D529 📊** — *The authored corpus has no comparison wider than three columns, and its median fork
  gives CR1 two plies to work with.* 44 spine forks: 38 binary, 6 ternary, 0 at N ≥ 4; shortest
  column past the fork median 2, min 1, max 6. Criterion 16's N = 8 threshold is unmeasurable on
  authored content by construction, and CR1's weak corpus admission (88.2%) is a statement about how
  early authored branches terminate, not about the filter.

---

## 11. Reproduction

```
npx vitest run --config tools/cr1-diagnosis-probe/vitest.config.ts
```

Prints sections 1–8 to stdout. Writes nothing. **Disposable — delete `tools/cr1-diagnosis-probe/`
once the findings are consumed.** No production code, ledger row, RFC, design doc or committed
artefact was changed by this diagnosis, and nothing was committed or staged.
