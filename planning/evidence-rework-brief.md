# The evidence rework — resume brief and wide-alignment prompt

**Written 2026-08-20 after seven agents died on the weekly usage limit (resets 2026-08-21
09:00 Europe/Amsterdam).** Nothing they produced landed. **Superseded as the top-level resume
point on 2026-08-20 by `design/research/integrated-platform-alignment.md` and
`planning/platform-alignment/plan.md`; this brief remains the detailed prompt for the evidence
substream.** Owner ideas, rulings and audit findings are ledgered as **D549–D564** — read them
first. The authoritative bottom-up route now lives under `planning/platform-alignment/`.

## The evidence substream, in dependency order

1. **`design/research/detection-landscape.md`** — the survey. Every detector family ranked by
   what GROUNDS it (arithmetic / engine read / corpus / tablebase), the real Lichess & chess.com
   move-label algorithms, WintrChess as open-source reference, the CC0 Lichess puzzle-theme
   corpus as build target AND validation set, licence notes. Now also owes: the **Chessiverse
   bot-construction article** (D551), **Beacon's auto-seeded branch** (D550), and the
   **configuration+consequence pattern** (D553).
2. **`design/research/evidence-presentation.md`** — the UX research the owner correctly says has
   never been done. First run vs the silence invariant; presets over 54 switches; ranked
   abstaining evidence; the copy ruleset. Alarm-fatigue literature is the frame for 8.83
   entries/ply.
3. **`design/research/theory-knowledge-pipeline.md`** — the Skipper reuse audit and six-arm
   experiment: source allow-list, licence, digest/version, chess-key enrichment, semantic retrieval,
   citation propagation and false-match abstention. It evaluates the entire separate knowledge
   subsystem the owner named, not request-time scraping (D557/D564).
4. **`design/research/bot-policy.md` + `design/research/player-style-metrics.md`** — keep strength,
   repertoire, style, errors, timing and voice separate on the opponent side; keep descriptive
   style, rating and advice separate on the learner side (D551-D553, D561-D562).
5. **`rfc/evidence-producers.md`** — only after the research gate: the registry as a real binding: symbol, grounding, rung,
   measured abstention, measured lift, typed consumers; what it REFUSES; when producers run
   (free arithmetic vs budgeted calls); selection-not-census honouring R3/R11 and the no-ranking
   doctrine; the per-move verdict line under law 8. Now also owes: the registry serves **bot
   decision-making** too (D551) and the **skills/progression stream** (D549).
6. **Competitor capability watch** (D554-D556) — hands-on Beacon, Quackmate, ChessLabHQ,
   Chessiverse, QChess, RookHub and Sensei plus the forum threads; update the matrix as evidence,
   but route the roadmap by novel/loved capability rather than app name.

Measured basis, all landed: **D542** (90.2% of the reading non-discriminating), **D543**
(ranking buys 294× with no new detector), **D544** (the real gap is tactics; three detectors
computed and thrown away; opening identity fetched then refused), **D545** (read for sign),
**D546** (no producer→feature binding; 13 producers zero consumers), **D547/D548** (dead
detectors).

## The wide-alignment prompt (for codex or any reviewer — owner asked for this)

> Review the evidence/platform-alignment corpus in this repo for ALIGNMENT, not for correctness of
> any one document. Read, in order: `design/research/integrated-platform-alignment.md`,
> `planning/platform-alignment/plan.md`, `design/research/classifier-coverage-and-noise.md`,
> `design/research/detection-landscape.md` (when landed), `design/research/evidence-presentation.md`
> (when landed), `design/research/theory-knowledge-pipeline.md`, `design/research/bot-policy.md`,
> `design/research/player-style-metrics.md` (each when landed), `rfc/evidence-producers.md` (when
> landed), ledger rows D542–D564,
> `design/05-in-run-experience.md` §3, and `design/02-product-shape.md` §Adoption.
>
> Answer these, each with file+line evidence:
> 1. **Does every UX feature anyone has proposed name the producers it depends on**, and does
>    every producer name a consumer? List every orphan on both sides.
> 2. **Does anything grade a move with LLM opinion** rather than render grounded evidence?
>    Law 8 check across all four documents at once.
> 3. **Do the documents agree on the selection rule** (lift-ordered, sign-aware, census-refused)?
>    R3 says selectivity ≠ usefulness; R11 refuted conjunctions; n-way-comparison refuses
>    significance ranking. Any document that quietly reintroduces a refused mechanism, name it.
> 4. **Is the anti-pattern distinction stated and does it hold** — what keeps this from being
>    "an engine review screen with a rewind button"? If any document weakens the rehearsal-loop
>    framing, flag it.
> 5. **Do the owner ideas/findings D549–D564 each have a home** — a document that owns it, or a named
>    reason it waits? An idea with no home is a process bug (law 4).
> 6. **Does the bot lane and the guidance lane share the registry** rather than fork it?
>    Chessiverse's lesson (D551) is that opponent steering and support both consume the same
>    grounded facts.
> 7. **Does the separate knowledge-builder fail closed?** Treat Frameworks Skipper as prior art
>    for an independently operated crawler/index/bundle pipeline, not as a request-time scraper
>    proposal. Every passage has source/licence/digest/span; deterministic chess keys lead;
>    semantic retrieval is admitted only if it beats the simpler baseline; runtime can consume an
>    immutable bundle without the builder; and an LLM cannot select or manufacture the claim.
> 8. **Does post-game review route back into commitment?** Every actionable Review Map moment needs
>    retry/re-enter/branch/compare/drill. Flag any screen whose endpoint is an engine label or LLM
>    explanation, and any social recap that selects its own facts in the language model.
> 9. **Would this work pass Gate F without re-authoring the corpus?** Name schema churn, undeclared
>    deprecations, bespoke pack fields, producer-less modules and migrations without a whole-corpus
>    dry run. The D560 content hold is active even while its exact clearance proof is amendable.
> Report contradictions ranked by cost, not a summary of each document.

## Standing constraints for whoever resumes

Law 8 (grounded evidence only; LLM renders, never grades). Law 3 (label everything V/P/M).
Law 5 (design/00–06: name, never write). The buildability acceptance test (D473). Non-vacuity +
negative fixture for every predicate (D444/D451/D522/D526). Instruments must not share the
defect's assumption (D526/D539). Column 1 is the status (D419/D459). Ids through **D564** are in
use.
