# Proposed intent amendment — `design/03` B10 and B4 after evidence value authority

**Filed:** 2026-09-24 · **By:** claude (evidence-value-authority implementation lane) · **For:** OWNER
**Trigger:** `CLAUDE.md`, clause added 2026-08-24 ([[D1505]]): *a change set that falsifies a
sentence in `design/00`–`06` adds a proposed intent amendment (the file, the exact sentence, and
what is now true) to `planning/platform-alignment/` in the same commit.*
**Change set:** implementation of `rfc/evidence-value-authority.md` (receipt:
`planning/evidence-value-authority/implementation-2026-09-24.md`).
**Law 5 holds:** nothing in `design/` is edited by this pass. This file reports that intent now
disagrees with the tree. It does not enact anything.

---

## 1. Falsified: `design/03-product-breadth.md:332` (B10, status cell)

**Exact phrase:**

> passive pivotal markers (two-decision option collapse), disclosure-gated human splits, endgame
> technique naming, retrospective eval pivots

**What is now true.** The runtime no longer names an endgame technique. `rules.endgame.reading@1`
mixed a material census with a technique label (Lucena/Philidor/Vancura) that no cited, versioned
setup convention grounded ([[D2495]]–[[D2497]]). The implementation retires it. It is replaced by
`rules.endgame.classification@1`, a material census with no technique field, and
`theory.endgame.setup_match@1` / `theory.endgame.method_stage@1`. Both of those factories return an
explicit **unavailable** arm (reason plus dependency `semantic-convention-provenance`) until a cited
setup convention is registered. The endgame guidance line now names the material class only. Web
screens that showed "Lucena" no longer show it (`apps/web` screens test updated).

**Suggested wording.** Replace "endgame technique naming" with "endgame material classification
(technique naming withdrawn 2026-09-24 pending a cited setup convention; `theory.endgame.setup_match@1`
abstains)". The intent sentences in `design/00-thesis.md:56` and `design/05-in-run-experience.md:331`
("This is a Lucena position; build a bridge") remain valid **as intent**. They are now unmet rather
than false, and the owner may want B10 to say so.

## 2. Stale mechanism: `design/03-product-breadth.md:326` (B4, status cell)

**Exact phrase:**

> with exact source adapters and **one rendering authority**

**What is now true.** The source adapters are deleted. Every value is minted by one factory per
projection behind a package-internal route invoker, and it carries a value receipt that every
consumer boundary checks (`docs/evidence-contract.md` §Value authority). The sentence describes the
F1/F2 landing as history, so it is not strictly false. A current reader would still take "exact
source adapters" as the construction mechanism. **Suggested wording:** "with exact value factories
(value authority, 2026-09-24) and **one rendering authority**".

The same B4 cell's closure tuple (20/126/25/175) is historical and marked as such. The current tuple
is 40 producers / 216 projections / 25 consumers / 243 bindings, plus 78 semantic events.
