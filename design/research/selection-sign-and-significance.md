# Selection, sign, and significance — what can turn evidence into a small honest packet

**Question (platform-alignment R2, owner 2026-08-20):** can Tabiya replace its raw evidence dump
with a small, sign-aware set of facts that transfers beyond authored packs, preserves rare critical
events, and supports hints, review, profiles and theory without pretending that rarity means
importance?

**Verdict:** local counterfactual selection solves the **volume** problem and does not solve the
**meaning** problem. A predeclared selector reduced the shipped structural reading from **8.70 to
0.79 entries per authored decision** and **11.42 to 1.03 per imported-game decision**, while mean
counterfactual specificity rose from **18.65% to 93.26%** and **18.23% to 93.84%** respectively.
It retained all **108 of 108** predeclared low-frequency rules events. `[V]`
(`tools/r2-selection-harness/output.md`)

But the most-selected families included `piece_count`, `bishop_on_shade`, and generic changed-
attack/defence counts. They are locally distinctive because few legal alternatives make the same
literal change; they are not thereby useful teaching moments. `[V]` Therefore an evidence compiler
needs **two independent gates**:

1. **semantic eligibility** — whether a producer/version can ground this claim, valence and
   consumer; then
2. **local delivery selection** — which eligible facts distinguish this decision and fit the
   module's budget.

Neither gate belongs to an LLM. An LLM may render the resulting packet and nothing more. `[M]`

R2 is complete as a research question with a partial success and a refusal: the measured local
denominator and budget are suitable design inputs; counterfactual rarity, global lift and negative
sign are each refused as standalone relevance or grading policies.

---

## 1. Method and populations

### 1.1 Instrument

`tools/r2-selection-harness/` is a disposable exploration instrument under RFC-0000's exploration
gate. Its method was written before the first complete run. It enumerates every legal alternative
from the same parent position, including queen, rook, bishop and knight promotions. It never uses
global firing frequency as the admission denominator. `[V]`

For each outcome it derives exact-identity structural relations:

- `gained`: present after, absent before;
- `lost`: present before, absent after;
- `preserved`: the same observation identity exists before and after; and
- `avoided`: an alternative relation is common among alternatives but absent on the played move.

Transition observations keep their declared direction or irreversibility subkind. Families are
grouped for delivery (`structure:gained:doubled_pawn`, for example), so ten changed squares cannot
win ten cards merely by being verbose. `[V]`

The predeclared selector requires at least eight alternatives, admits a played family when at most
20% of alternatives emit the same signed family, refuses D566's `pawn_safe_square` and the dead
`pawn_count`, and caps ordinary output at two families. Independent rules checks always retain
checkmate, promotion and castling; the transition producer supplies `last_of_role`. The instrument
canonicalizes castling by the king's resulting square because authored packs and chessops use two
different UCI encodings — the same mismatch recorded by D546/D547. `[V]`

`counterfactual specificity = 1 - same-signed-family alternative share`. It is a local
distinctiveness measure. The harness never calls it correctness, usefulness, surprise or
importance. `[M]`

### 1.2 Authored population

The authored arm contains all **754 spine transitions in 50 current draft packs**. This is the
same population family as D542-D545, now evaluated with all promotion alternatives and all four
relation signs. `[V]`

The authored population is intentionally generous: every spine move was selected for a drill.
It can reveal whether a selector erases authored events; it cannot estimate what an ordinary
player does. No pack's authored prose is used as a generated label. `[M]`

### 1.3 Imported-game population

The transfer arm uses a bounded prefix of the official July 2026 Lichess rated-standard PGN,
SHA-256 `5fb40add89903d24cfcf1d5dabc94074e6cfcefa867fdda432cb1049d25e1400`. Lichess publishes
standard-game exports under CC0. `[V]`
([Lichess open database](https://database.lichess.org/))

The deterministic sample takes the first 12 complete legal games in each of nine cells:
Bullet/Blitz/Rapid crossed with average player Elo 1000–1399/1400–1799/1800–2199. It samples plies
8, 16, 24, 32, 40 and 48 when the game reaches them. That yields **108 games and 579 decisions**;
each game contributes at most six, so long games cannot dominate. `[V]`

This is a chronological prefix, not a random sample. It deliberately tests transfer across common
ratings and time controls; it does not estimate the whole Lichess population or teaching value.

---

## 2. The volume/noise result transfers

| population / surface | decisions firing | entries or cards / decision | mean counterfactual specificity |
|---|---:|---:|---:|
| Authored / shipped raw gained observations | 94.96% | 8.70 | 18.65% |
| Authored / old authored top-eight kinds | 31.56% | 0.40 | 81.85% |
| Authored / predeclared local selector | 48.01% | 0.79 | **93.26%** |
| Imported / shipped raw gained observations | 99.65% | 11.42 | 18.23% |
| Imported / old authored top-eight kinds | 34.37% | 0.52 | 90.31% |
| Imported / predeclared local selector | 58.89% | 1.03 | **93.84%** |

`[V]` (`tools/r2-selection-harness/output.md`)

The raw surface is slightly worse on ordinary games than authored spines: it says something on
99.65% of sampled moves at 11.42 observations each. The local rule cuts this to approximately one
family and abstains on 41.11% of imported decisions. Silence is therefore not an exceptional error
state; it is the expected output when no eligible family clears the local threshold. `[V]`

Sensitivity is monotone and similar across populations. At a 10% alternative-share ceiling and
cap two, coverage is 33.95% authored / 42.49% imported with 96.87% / 97.24% specificity. At 30%,
coverage rises to 62.60% / 73.75% and specificity falls to 88.39% / 89.81%. Changing the cap from
one to three at the 20% ceiling changes volume, not firing coverage. `[V]` The design tier can
therefore choose a silence/coverage budget explicitly instead of inheriting the detector count.

### 2.1 Rare rules events survive the budget

The primary selector retained all predeclared critical events:

| population | castling | checkmate | promotion | last-of-role | retained |
|---|---:|---:|---:|---:|---:|
| Authored | 22 | 6 | 1 | 21 | **50/50** |
| Imported | 23 | 1 | 0 | 34 | **58/58** |
| Total | 45 | 7 | 1 | 55 | **108/108** |

`[V]`

“Critical” here means **must not be erased by the noise filter**, not “good move.” A promotion can
be losing and a last-of-role capture can be a mistake. The override preserves an exact event for a
later eligible module; it does not grade it. `[M]`

---

## 3. Why this is not yet a relevance algorithm

The twelve most-selected families expose the limitation instead of hiding it.

| Authored examples | count | Imported examples | count |
|---|---:|---|---:|
| gained `piece_count` | 53 | gained `piece_count` | 83 |
| defended squares gained | 47 | lost `bishop_on_shade` | 44 |
| gained `bishop_on_shade` | 41 | gained `bishop_on_shade` | 43 |
| gained `king_zone` | 33 | lost `piece_count` | 37 |
| lost `bishop_on_shade` | 33 | attacked squares lost | 35 |
| pawn break | 32 | last-of-role | 34 |

`[V]`

`piece_count` changes when a capture changes the exact count observation. `bishop_on_shade`
changes when a bishop moves between colours. Those can be useful operands — material changed; the
bishop moved — but the family name alone does not explain the consequence. Generic attack or
defence counts are similarly support facts without affected-piece identity or a validated
semantic join. R1 already found this identity loss in the transition census. `[V]`
(`detection-landscape.md` §3.2)

This falsifies the tempting equation:

> rare among legal alternatives = interesting to a learner

The left side is measurable. The right side needs a consumer-specific semantic contract or reader
evidence. A move can be uniquely pointless; a common forced recapture can be the decisive teaching
moment. `[M]`

The result also corrects the earlier statement that “the interesting stuff is already computed.”
Some high-lift structure families are useful candidates, and most raw noise is delivery noise.
But the local selector's winners prove that **selection cannot repair missing semantics**. D558's
detector work and R1's semantic boundary remain necessary.

---

## 4. Global lift does not make a stable allow-list

The per-kind authored/imported rank correlation is **Spearman ρ = 0.667** across shared firing
kinds. `[V]` That is meaningful transfer, not identity.

Examples:

| gained kind | authored lift | imported lift | consequence |
|---|---:|---:|---|
| `named_structure` | 9.46× | 32.54× | rare and distinctive in both, magnitude population-sensitive |
| `doubled_pawn` | 6.98× | 16.27× | transfers strongly |
| `king_opposition` | 2.81× | **0.76×** | direction reverses |
| `piece_distance` | 2.23× | **1.00×** | authored signal disappears |
| `pawn_safe_square` | 0.84× | 1.03× | neither population repairs D566 semantics |

`[V]`

The old authored top-eight list still performs much better than raw on imports (0.52 families per
decision, 90.31% specificity), but it was learned and evaluated on the authored population before
this transfer test. It is a useful baseline, not a product registry. Any population prior needs a
version, population identity and refresh rule; the current-position alternative set remains the
honest local denominator. `[M]`

R11's conjunction experiment needs no rerun: over 55 primitive pairs, no measurable pair beat its
components and the best pair's 35.7% precision trailed the best single primitive's 69.4%.
Counterfactual selection should filter validated semantic families; inventing more conjunctions
does not supply validation. `[V]` (`conjunction-hypothesis.md`)

---

## 5. Sign is a relation, not a verdict

The primary selected packets contain all four relation forms:

- Authored: gained 250, lost 99, preserved 4, rule 29, transition 214.
- Imported: gained 271, lost 115, rule 24, transition 184.

`[V]`

The harness also found **1,032 authored and 522 imported alternative-only structural relations**
that occurred on at least 30% of alternatives and not on the played move. They are valid
`avoided` relations under the declared denominator. `[V]` None is automatically an avoided
*mistake*.

This corrects D545. A detector with lift below one can indeed be informative in the opposite
direction, but relation sign is not chess valence. “You did not create relation X while many
alternatives did” does not establish that X is harmful, that avoiding it caused the outcome, or
that the player intended to avoid it. R1 additionally showed the cheap hanging-piece semantic
definition was far broader than the Lichess motif tag. `[V]`

Allowed forms before valence exists:

- “This move opened the e-file; 3 of 24 alternatives did.”
- “Most alternatives changed the bishop's relation; this move preserved it.”
- no positive/negative adjective; no “because”; no inferred intent.

Allowed sources of valence are separate and explicit: an authored claim, a cited theory rule with
matching antecedents and scope, a disclosed engine-delta convention, a tablebase result, or a
validated semantic event whose contract includes valence. Human popularity can establish common
or unusual, never good or bad. `[M]`

The LLM receives the valence field if one exists. It may not derive valence from `gained`, `lost`,
`preserved`, `avoided`, lift, popularity or evaluation prose. `[M]`

---

## 6. Architecture permitted by the evidence

R1's six planes remain producers. R2 adds two compiler stages and a delivery packet:

| Stage | Question | Required fields / behaviour | Failure behaviour |
|---|---|---|---|
| **Eligibility** | May this evidence version support this semantic claim for this consumer? | kind/version, anchor, operands, sign, basis, validation, valence, consumer allow-list, abstention reason | refuse the claim; atom may remain inspector-only |
| **Selection** | Which eligible facts bear on this local decision and fit the module? | local alternative denominator, same-family share, critical override, module budget, deterministic tie rule | empty packet is valid |
| **Rendering** | How is the packet expressed at this disclosure rung? | exact selected facts, citations, rung/verbosity, deterministic fallback | template fallback or silence; no new chess fact |

`[M]`

This separation answers the owner's producer→feature concern. A producer is not wired directly to
a checkbox or prose list. A **module** declares the semantic evidence it accepts and its budget:

- a pre-commit threat nudge may accept one validated consequence event and reveal no move;
- a post-commit explanation may accept the same event plus exact squares and sign;
- a Review Map moment may require rule/engine magnitude or authored importance before selection;
- a full inspector may show support atoms that default guidance refuses;
- a player metric consumes versioned eligible events and keeps its population denominator;
- a bot policy may consume human/model/theory evidence without exposing it as learner advice.

The same pool can therefore support different products without each product reclassifying chess,
and without forcing every collected fact onto every screen. `[M]`

### 6.1 What R2 does not authorize

- no product evidence compiler or schema change before design rulings and an accepted RFC;
- no global “interestingness score” learned from these two populations;
- no `avoided` praise or warning without valence;
- no top-k detector list frozen from authored lift;
- no LLM selection, grading, causal explanation or missing semantic join;
- no content rewrite while D560/Gate F holds.

---

## 7. Decisions and next research

R2 supplies enough evidence for narrow O1–O3 rulings:

1. the authoritative evidence object must distinguish eligibility metadata from measured delivery
   metadata;
2. semantic-v1 membership cannot be decided by lift alone; and
3. a local legal-alternative denominator, explicit critical overrides, deterministic tie-breaking,
   a per-module budget and honest empty output are viable selection primitives.

The exact 20%/two-card values are measured candidates, not owner rulings. R3 must test them in
actual pre-/post-commit, compare, theory and inspector modules. `[M]`

R12 may now research player metrics using versioned candidate events, but no metric may promote a
raw atom or relation sign to advice. R7 still needs R3 before it can test Review Map moments, and
R5 must test whether an LLM can preserve a fixed selected packet without adding squares, moves,
valence or causality.

---

## 8. Limits

1. **No reader study.** Specificity is not comprehension or usefulness. The semantic failure is
   visible from the surviving family definitions, but user benefit still belongs to R3/R7/R9.
2. **No engine grading arm.** R2 preserves exact rule events and measures local distinction. Move-
   quality conventions belong to the Review Map decision and must publish their threshold; engine
   loss is not silently substituted for pedagogical importance.
3. **Chronological bounded import.** The 108-game sample is balanced across declared cells but is
   not random and excludes Classical/UltraBullet, ratings outside 1000–2199 and later July games.
4. **Family grouping is conservative.** It ignores operand identity for admission. This prevents a
   changed count or square from looking rare merely because its number differs, but can suppress a
   genuinely distinctive operand. Semantic modules may use exact operands after family admission.
5. **Critical set is narrow.** Mate, promotion, castling and last-of-role test non-erasure. Other
   critical semantic events require R1-style validation before joining the override registry.
6. **Current producer defects remain.** `pawn_safe_square`, dead `pawn_count`, castling UCI mismatch
   and missing semantic identity are measured inputs, not repaired here.
