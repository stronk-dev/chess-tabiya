# Residue reconciliation packet — the never-started-lanes residue, verified at HEAD

**Written 2026-08-22 against HEAD `fbf3fc8`.** Input: `never-started-lanes.md` §2.9 (the 42
semantic-collector rows) and the six residue threads the zero-mention audit routed. This is a
**verified reconciliation packet for the coordinator to apply to `design/BACKLOG.md` in one
atomic pass** — nothing here edits the ledger, the queues, or any RFC. The working tree is
dirty (`design/BACKLOG.md`, `apps/server/src/{errors,service,storage}.ts`,
`tools/d872-semantic-tactics-harness/*` — codex's in-flight edits); none of those files was
touched, and every row below was read from the working-tree ledger and verified against the
RFC/code state at HEAD.

**Verification method.** Every verdict is grounded in a read section of an accepted RFC, a
landed dossier, or a read code symbol — matched on the row's *subject matter*, not its id
(the audit already established the ids are cited nowhere). Conservative rule applied: a row
flips only where the consuming text was actually found and read; where the obligation
discharges at a future landing commit, the row stays open with its destination named.

**Cell grammar.** The ledger row is `| <id> <status> | <description> | <status cell> |`.
"Replacement" below is the **column-3 status cell**, verbatim; a CONSUMED verdict also flips
the **column-1 emoji to ✅**. Descriptions (column 2) are never touched.

---

## Job 1 — the 42 semantic-collector measurement rows (§2.9 band)

The audit's id list: D567, D570, D724–D728, D746–D747, D755–D757, D761, D773–D777,
D779–D787, D789–D793, D795–D798, D800, D803–D806, D903 — 42 rows, **all 42 open at HEAD**
(no ✅ among them). The audit's core claim is confirmed: none is cited by id in
`rfc/tactical-collectors.md`, `rfc/breadth-collectors.md`, or `rfc/semantic-collectors.md`.
The substance test, however, finds **36 of the 42 were consumed** — their measured numbers,
conventions, refusals, and fixture demands appear (mostly verbatim) in the accepted RFC
bodies. Five are the RFCs' own implementation scope and flip at landing per the RFCs' own
closeout criteria; one is a pure feasibility record.

Abbreviations: **TC** = `rfc/tactical-collectors.md` (implementation complete 2026-08-22,
awaiting D1), **BC** = `rfc/breadth-collectors.md` (accepted 2026-08-22), **SC** =
`rfc/semantic-collectors.md` (accepted 2026-08-22), **LM** = `rfc/learner-modules.md`
(accepted 2026-08-22).

| id | verdict | evidence (doc + section, what was matched) | replacement status cell (column 3) |
|---|---|---|---|
| D567 📊 | **CONSUMED** | SC §1.8 (Lichess CC0 prefix "a **disagreement corpus, never an oracle** — stage-0 §1"), §3.5 ("no external oracle for overload… `overloading()` returns `False` unconditionally"), §1.6 (external positives/hard negatives + abstention fixtures made a criterion) — the row's exact posture, pinned as acceptance policy | `✅ consumed by rfc/semantic-collectors.md §1.6/§1.8/§3.5 (accepted 2026-08-22): disagreement-corpus-never-oracle is registration policy; overload validation via external tag structurally refused; residue reconciliation 2026-08-22` |
| D570 📊 | **CONSUMED** | BC B7 ("**No global rank is derived from authored pack lift**"); LM §4.5 (production selection is "the production policy over the F2 complete-population machinery" — the current-position local denominator); sealed versioned population `r2-imported-sample@a10a233e…` in TC §1.8/SC §1.8 (the "version any population prior" demand) | `✅ consumed: rfc/breadth-collectors.md B7 forbids inheriting authored lift as a global rank; rfc/learner-modules.md §4.5 selects over the F2 complete-population (local-denominator) machinery; populations sealed+versioned (r2-imported-sample@a10a233e); residue reconciliation 2026-08-22` |
| D724 💡 | **CONSUMED** | BC §3.1 (`rules.square.reading.control@1`/`event.control@1`: exact pseudo/legal controllers, identities, rays, abstention) + §2 square-control rules; "prevents"/"weak square" refused in BC §4 and TC §3.2 ruling (intent reading refused under law 8) | `✅ consumed by rfc/breadth-collectors.md §2/§3.1 (exact purpose-neutral control topology; legal-vs-pseudo pinned) with prevention/weak-square prose refused in §4; residue reconciliation 2026-08-22` |
| D725 💡 | **CONSUMED** | BC §3.3 (contacts, locks, candidates/majorities, passage, blockers, protection, connected passers as typed state/events) + §2 pawn-relation rules; strategic value refused ("No kind says break, favorable, dangerous, winning, minority attack, majority conversion or plan") | `✅ consumed by rfc/breadth-collectors.md §2/§3.3 (relational pawn family as typed atoms; strategic-value words structurally refused); residue reconciliation 2026-08-22` |
| D726 💡 | **CONSUMED** | BC §3.2 (safe mobility/restriction as identity-retaining sets), §3.6 (role signatures — the bishop-pair count basis), §3.8 (open/half-open file occupancy); batteries/connected-rook/coordination **refused as prominence** in §4 on the D746/D761 measurements, operands retained | `✅ consumed by rfc/breadth-collectors.md §§3.2/3.6/3.8 + §4 (coordination/connected-rook prominence measured-refused, operands retained). Color-complex relations were admitted nowhere — any future need is a NEW row, not this one reopened; residue reconciliation 2026-08-22` |
| D727 💡 | **CONSUMED** | BC §3.6 (material-role signatures/asymmetry, no scalar advantage), §3.7 (zone/shelter/escape operands, "No unsafe/exposed/attack/mating-net claim"), B9 refusal vocabulary; back-rank composite in TC §3.13 | `✅ consumed by rfc/breadth-collectors.md §§3.6–3.7 + B9 and rfc/tactical-collectors.md §3.13 (decomposed king/material families; safer/favorable verdicts refused without authority); residue reconciliation 2026-08-22` |
| D728 💡 | **CONSUMED** | BC §3.4 (`derived.pawn.sequence.harassment_pressure@1`; fixture list names "the owner's `...Bg4 h3 ...Bh5` form"; "Observed order does not establish intention, tempo, force, retreat quality or causality") | `✅ consumed by rfc/breadth-collectors.md §3.4 (owner's Bg4/h3/Bh5 case is the named canonical fixture of harassment_pressure@1; tempo/prophylaxis inference refused); residue reconciliation 2026-08-22` |
| D746 📊 | **CONSUMED** | BC §4 ("generic slider coordination… measured near background or population-reversing, though their exact existing operands remain inspectable"); §2 `pressure-line@1` retains the operand-for-joins form the row demanded | `✅ consumed by rfc/breadth-collectors.md §4 (alignment refused as a learner semantic on this measurement) + §2 pressure-line@1 (the operand-for-joins survivor); residue reconciliation 2026-08-22` |
| D747 📊 | **CONSUMED** | BC §3.4 (harassment_pressure@1 with two-edge identity retention; "Counts: 3/6 preserving cases after the measured relocation filter" — this row's 3/6 verbatim) | `✅ consumed by rfc/breadth-collectors.md §3.4 (two-edge retained-identity sequence; the 3/6 measured count quoted as the disposition basis); residue reconciliation 2026-08-22` |
| D755 💡 | **CONSUMED** | BC §3.1 (control event research-only; "D754 future-square contest .96×/.95×, so neither earns default prominence"; topology retained for touch/hover/theory/bots) + §4 prevention refused | `✅ consumed by rfc/breadth-collectors.md §3.1 (contested destination is retained topology, research disposition; prevention requires a bounded continuation and is refused as a default label per §4); residue reconciliation 2026-08-22` |
| D756 💡 | **CONSUMED** | BC §2 `pressure-line@1` (functional named-target relation, exact retention key) vs §4 (generic alignment refused — the D746 negative control honored); the target-bearing form consumed by §3.4 | `✅ consumed by rfc/breadth-collectors.md §2 (pressure-line@1: alignment vs named-target split pinned) + §4 (generic alignment refused); no battery-is-good claim anywhere; residue reconciliation 2026-08-22` |
| D757 💡 | **CONSUMED** | BC §3.5 (`defender_exposure@1`: lost duty joined to positive `legal-exchange@1` on the retained target, 4.50×/6.52×; `defender_consequence@1` as the separate three-edge test; "never emits removal, deflection, overload") | `✅ consumed by rfc/breadth-collectors.md §3.5 (edge loss = topology; tactical name only with exchange exposure; three-edge consequence separately versioned; naming refused to SC §3.2/§3.5's observed forms); residue reconciliation 2026-08-22` |
| D761 📊 | **CONSUMED** | BC §4 (target-bearing coordination refused prominence — "population-reversing" is this row's 2.19×/0.25×) + §2 (passed-pawn blockers as retained operands, no blockade prominence) + B7 (no global rank) | `✅ consumed by rfc/breadth-collectors.md §4/B7 (no global rank for either family; context-gated operands retained per §2); residue reconciliation 2026-08-22` |
| D773 🐞 | **CONSUMED** | BC §3.5 ("authored 0/622, so **canonical positive/disagreement fixtures are mandatory before landing**") + B5 ("Population zeroes remain visible, specifically the authored defender sequences") + claims `none` (no pack vocabulary adopted — the row's other half) | `✅ consumed by rfc/breadth-collectors.md §3.5 + B5 (the zero-fixture gap is now a named acceptance criterion of the accepted sequence-collector RFC; pack vocabulary refused in the same document); enforcement rides the 2d landing report; residue reconciliation 2026-08-22` |
| D774 📊 | **CONSUMED** | BC §3.3 (`derived.pawn.event.transitions@1`: `moved_pawn_became_passed` / `capture_created_moved_passer` with this row's 12.46×/13.45×/7.72× and 21.18×/14.45×/11.58× quoted; break/danger/winning/intent excluded) | `✅ consumed by rfc/breadth-collectors.md §3.3 (exact conversion events with the D774 measured priors quoted as reproduction targets, B6); residue reconciliation 2026-08-22` |
| D775 📊 | **CONSUMED** | BC §3.3 ("passer/candidate advancement phase-gated") + B7 ("horizon-gated kinds carry the declared phase eligibility operand. No global rank is derived from authored pack lift") | `✅ consumed by rfc/breadth-collectors.md §3.3 + B7 (phase/horizon gate declared; authored 18.81× headline structurally uninheritable); residue reconciliation 2026-08-22` |
| D776 💡 | **CONSUMED** | BC §3.3 (`capture_created_moved_passer` consumes `rules.transition.event.capture@1` by id) + B4 (no duplicate capture authority) + §3.3 ("Contact execution is a join over capture identity, not a duplicate capture detector" — same rule family) | `✅ consumed by rfc/breadth-collectors.md §3.3/B4 (first-class join over retained capture identity; no second capture detector; no favorable-liquidation claim); residue reconciliation 2026-08-22` |
| D777 📊 | **CONSUMED** | TC A5 + SC §1.6 ("A zero creates or retains a content-coverage row; it never permits weakening the predicate") + BC §1.4 (honest zeroes retained); admission triangulates rules/external/consumers in all three registration contracts | `✅ consumed as acceptance-criteria text in all three collector RFCs (TC A5, BC §1.4/B5, SC §1.6): pack coverage is never a completeness oracle, honest zeroes become content-coverage rows; residue reconciliation 2026-08-22` |
| D779 📊 | **CONSUMED** | BC §3.7 (`derived.king.captured_zone_defender@1` — generic capture identity joined to prior zone-defender role; "the admitted form of the 6.07×/5.12×/3.94× headline; its non-capture counterpart is 0/.07×/.38× and no generic 'weakened king' event exists") | `✅ consumed by rfc/breadth-collectors.md §3.7 (capture-join form admitted, duplicate king-weakened detector refused, both measured series quoted); residue reconciliation 2026-08-22` |
| D780 📊 | **CONSUMED** | BC §3.7 ("Castling-to-more-shelter is a later derived/module join over Wave A's immutable castling event… (measured 10.08×/8.19×/5.31×), not an operand added to the prerequisite projection and not a duplicate producer") | `✅ consumed by rfc/breadth-collectors.md §3.7 (castling consumes shelter operands; no second producer; measured figures quoted); residue reconciliation 2026-08-22` |
| D781 📊 | **CONSUMED** | BC §3.7 ("Escape reduction and zone-attacker gain are phase-aware inspector operands") + B7 (declared phase eligibility operand) | `✅ consumed by rfc/breadth-collectors.md §3.7 + B7 (exact atoms ship broadly, prominence phase-gated exactly as measured); residue reconciliation 2026-08-22` |
| D782 📊 | **CONSUMED** | BC §3.7 ("No unsafe/exposed/attack/mating-net claim"; operands on-demand for later modules) + §4 ("king attack"/"initiative" refused) + B9 | `✅ consumed by rfc/breadth-collectors.md §3.7/§4/B9 (both weak/mixed kinds kept as on-demand operands; universal king-safety narrative refused); residue reconciliation 2026-08-22` |
| D783 📊 | **CONSUMED** | BC §3.2 (piece_destinations reading/event with retained sets; "legal loss .71×/1.03×; safe loss 1.14×/1.35×" quoted; "sets, never only counts") | `✅ consumed by rfc/breadth-collectors.md §3.2 (identity/set-retaining mobility infrastructure; generic restriction denied headline status on the quoted measurement); residue reconciliation 2026-08-22` |
| D784 📊 | **CONSUMED** | BC §3.2 ("non-capture safe loss .93×/1.05×"; "All inspector/on-demand"; consumer must join capture identity — the §3.2 fixture "legal-but-newly-unsafe destination") | `✅ consumed by rfc/breadth-collectors.md §3.2 (capture/context-shaped disposition encoded; restriction/prevention/domination claims refused); residue reconciliation 2026-08-22` |
| D785 📊 | **CONSUMED** | BC §3.2 ("zero-safe 1.12× uncertain / 2.58×… Zero-safe is never rendered 'trapped'; Wave A's separate attacked-piece predicate is required"; zero-safe positive + unattacked hard-negative fixtures) | `✅ consumed by rfc/breadth-collectors.md §3.2 (zero-safe transition admitted with canonical fixtures; 'trapped' reserved to TC §3.13's separate convention); residue reconciliation 2026-08-22` |
| D786 📊 | **CONSUMED** | BC §3.2 ("moved gain 1.20×/1.29×"; inspector/on-demand — the activity-operand-not-praise disposition) | `✅ consumed by rfc/breadth-collectors.md §3.2 (on-demand activity operand, never default praise); residue reconciliation 2026-08-22` |
| D787 🐞 | **CONSUMED** | BC §3.2 ("Count deltas are derived display operands, not the identity") + B2 ("A fixture fails any implementation that keeps only counts for control, mobility, king or pawn relations") — the row's contract demand became a named acceptance criterion | `✅ consumed by rfc/breadth-collectors.md §3.2 + B2 (count-only flattening is a criterion failure with a fixture that proves it); residue reconciliation 2026-08-22` |
| D789 📊 | **CONSUMED** | BC §3.3 (`contact_executed` requires the before-state directed contact from the same moved pawn to the exact captured pawn; "contact execution 9.82×/15.07×"; "a join over capture identity, not a duplicate capture detector"; no favorable-liquidation claim) | `✅ consumed by rfc/breadth-collectors.md §3.3 (execution as capture-identity join; measured priors quoted; duplicate detector refused); residue reconciliation 2026-08-22` |
| D790 📊 | **CONSUMED** | BC §3.3 ("contact creation 1.03×/.90×"; "the existing rules.transition.event.pawn_contact remains the sole authority for contact creation"; no kind says "break") | `✅ consumed by rfc/breadth-collectors.md §3.3 (lever creation stays background under its measured near-1 lift; exact pawns/squares preserved for joins; no default break hint); residue reconciliation 2026-08-22` |
| D791 📊 | **CONSUMED** | BC §2 (`candidate-majority@1` convention verbatim: "the disclosed D788 convention derived from historical Stockfish prior art and deliberately omits that source's backward-pawn classifier") + §3.3 (candidate gain 2.80×/3.30×, horizon-shaped) | `✅ consumed by rfc/breadth-collectors.md §2/§3.3 (disclosed, versioned, phase-aware convention with the engine-truth disclaimer shipped verbatim in the declaration); residue reconciliation 2026-08-22` |
| D792 📊 | **CONSUMED** | BC §3.3 ("passer/candidate advancement phase-gated"; "No kind says… plan") + §4 (plan/timing authority stays with theory/engine/authored joins in modules) | `✅ consumed by rfc/breadth-collectors.md §3.3/§4 (candidate status carries no advance/conversion plan; plan+timing deferred to authority joins); residue reconciliation 2026-08-22` |
| D793 🐞 | **CONSUMED** | BC §3.4 (`derived.pawn.sequence.contact_timing@1`: same pawn/contact identity through the reply; "Counts: 11/125 and 1/45 authored/imported windows" — this row's populations) + B8 (swapping any anchor/pawn breaks the fixture) | `✅ consumed by rfc/breadth-collectors.md §3.4 + B8 (permanent retained-identity lever-timing collector with canonical disagreement fixtures required); residue reconciliation 2026-08-22` |
| D795 📊 | **CONSUMED** | TC §3.6 ("threat presence measures 0.91× authored / 1.04× imported on 126/675 and 208/545… inspector/negative/on-demand evidence, not a default positive or blunder label"; reply-invariant survival 1/675, 0/545) | `✅ consumed by rfc/tactical-collectors.md §3.6 (threat@1 registered with exactly this disposition and the D794 figures as A-criteria reproduction targets); residue reconciliation 2026-08-22` |
| D796 📊 | **CONSUMED** | TC §3.7 ("the meaningful event fires on 10 authored / 29 imported played moves; the all-reply consequence fires on 0 / 2 (0% and 6.9%)… it cannot be the everyday fork producer, and a failed consequence retains the defusing reply") — the D749 amendment this row's status cell demanded landed (changelog: "reconciled the completed Phase-2b research") | `✅ consumed by rfc/tactical-collectors.md §3.7 (event and consequence preserved separately; defusing reply retained via reply_breadth@1; D794 counts quoted); residue reconciliation 2026-08-22` |
| D797 📊 | **CONSUMED** | TC §3.6 (`reply_breadth@1`: "exactly-one-reply 5.16%/.52%; the authored non-check rate (3.77% versus 0/577 imported) is explicitly a pack-composition fact, not a human prior"; "forcing" absent from semantics) | `✅ consumed by rfc/tactical-collectors.md §3.6 (count+replies exposed, authored rate pinned as pack-composition fact, forcing vocabulary refused); residue reconciliation 2026-08-22` |
| D798 📊 | **CONSUMED** | TC §3.6 (`rules.tactic.event.check@1`: "D794 measures 2.48× authored / 2.60× imported. It is a reusable literal event… not a forcing or quality label") | `✅ consumed by rfc/tactical-collectors.md §3.6 (exact check event registered; no duplicate forcing-move family; lift never outranks relevance by decree); residue reconciliation 2026-08-22` |
| D800 📊 | **RECORD-ONLY** | The row's own text: "This is feasibility evidence, not a production latency guarantee." Its consequence — bounded one-reply enumeration in the cheap cost class — already binds via TC §1.9/§3.6 and SC §1.9; the timing figures themselves are a disposable-harness record with no residual obligation | *(no change — the 📊 cell stands as a record; nothing waits on it)* |
| D803 💡 | **STILL-OPEN-INPUT** | Row cell already says "owned by breadth-collectors §§3.1–3.2"; BC B14 flips D802–D807 **at the implementation landing commit** (Phase 2d, after TC lands). Flipping now would falsify the RFC's own closeout protocol | *(no flip now)* Destination: `rfc/breadth-collectors.md` implementation (Phase 2d); flipped by its landing commit per B14 |
| D804 💡 | **STILL-OPEN-INPUT** | Same — "owned by breadth-collectors §3.3"; B14 closeout | *(no flip now)* Destination: breadth-collectors implementation landing (B14) |
| D805 💡 | **STILL-OPEN-INPUT** | Same — "owned by breadth-collectors §§3.4–3.5"; B14 closeout; the authored-zero canonical fixtures are B5's named demand | *(no flip now)* Destination: breadth-collectors implementation landing (B14/B5) |
| D806 💡 | **STILL-OPEN-INPUT** | Same — "owned by breadth-collectors §§3.6–3.8"; B14 closeout | *(no flip now)* Destination: breadth-collectors implementation landing (B14) |
| D903 🐞 | **STILL-OPEN-INPUT** | LM §Ledger (line ~848): "The recorded D898 row still carries the drafted 179/177 counts; the landing flip corrects it" — the row's own text says "the register line flip at landing". The 175/173 correction is in the accepted LM body (Appendix B, §4, §6.3, A2); the ledger flip is deliberately reserved for the LM implementation commit | *(no flip now)* Destination: `rfc/learner-modules.md` implementation landing (C15-equivalent closeout; flips together with the D898 count correction) |

**Job 1 count: 36 CONSUMED · 5 STILL-OPEN-INPUT · 1 RECORD-ONLY (42 total, all verified open
at HEAD before this pass).**

The audit's cheapest-fix recommendation ("the accepted collector RFCs should cite what they
consume") is satisfied in the other direction by this packet: the ledger rows now cite the
consuming sections, which survives RFC archival and does not reopen three accepted documents
for citation-only edits. If the coordinator prefers the RFC-side fix too, it is a
changelog-line amendment per RFC and can quote the id list from this table.

---

## Job 2 — the six residue threads

| id | verdict at HEAD | evidence | repair |
|---|---|---|---|
| D585 | **Still dead; no owner found — codex-queue paragraph below** | `apps/web/src/lib/DrillScreen.svelte:824`: `{#if assistance.ambient === "on"}<button class="ambient" type="button" aria-label="Open assistance" title={…}>♟</button>` — no `onclick`, no link, no expanded target. Ownership checked: `rfc/archive/assistance-control-wiring.md` — zero mentions of the ambient control; `rfc/play-composition.md` §5 leak table L1–L15 — `:824` is **not** among the sites (L2 is `:813`, L5 `:826`, L6 `:830` — the table brackets the button and skips it); `rfc/assistance-controls.md` (draft, returned on D715) line 157 explicitly defers "New forms — arrows, spoken, ambient" as unchanged | Ledger cell → `🐞 verified 2026-08-20; platform R3 source audit; ROUTED 2026-08-22 → play-composition implementation chrome (codex-queue paragraph; not owned by any leak-table row or assistance RFC at HEAD)`. Queue paragraph in §2.1 below |
| D698 | **Repaired everywhere but the ledger — flip ✅** | `planning/platform-alignment/execution-queue.md:33` row 1.2 already reads "MECHANICAL/DESK DONE; O8 RULED 2026-08-22; owner use remains"; line 167 chain "R11 → O8 (ruled 2026-08-22) → collector contracts → F8"; `rfc/bot-policy.md` accepted 2026-08-22; `bot-policy/o8-handoff.md` states "owner use remains validation" and no population human-likeness claim | Ledger cell → the corrected blocker text in §2.2 below; column-1 🐞 → ✅ |
| D301 | **Genuinely small; route straight to a small RFC — no research program** | Machinery at HEAD: `public_tokens` table + `story_read` scoped anonymous token (`apps/server/src/storage.ts:156,306,1306-1317`; `createPublicToken` currently enforces story scope only at `:1306`); content inputs ship (47 packs + 43 mined candidates per the row); `rfc/campaign-core.md` does not carry a daily; the notification hole (BACKLOG `:1157`) is **not** a blocker — the row's own Wardle quote is an anti-push posture, and Wordle ships with zero notifications | Ledger cell + drafting-queue entry in §2.3 below. One disposable prototype (the branch-set glyph) under the exploration gate precedes drafting; everything else is codex-able post-acceptance |
| D863 | **All three wirings verified; two are content-starved, not broken — content-era routing** | (1) `stated_reasoning`: machinery live — `apps/server/src/authored-feedback.ts:127,131` withholds feedback until reasoning records; **1** content file uses the interaction (verified by grep over `content/`). (2) `perfect_tablebase`: **6** content files (verified — matches the row). (3) theme-position sparring is the thesis itself; no wiring needed | Ledger cell + content-wave paragraph in §2.4 below. This is authoring work, not code; no RFC needed |
| D549 | **Waits are real but a desk arm is startable now — research-queue row R20** | `design/research/player-analysis-and-skills.md` §3 landed (D842: opportunity-normalized rates, floors, tiers — the credit mechanism designed); R12 denominators run over 261,892 decisions; blockers verified: longitudinal-store accepted but implementation-held by D973 (codex's uncommitted defect row: all three Open questions say "resolve before implementation"), D300 `attempt_concepts` cross-pack identity migration named in D842, producer registry = 2c/2d/2e landings | Queue entry R20 in §2.5 below + ledger cell routing note |
| D552 | **Same shape — research-queue row R21; D562 verified** | D562 exists at BACKLOG `:156` and says exactly what the audit claims: no grounded style-classification implementation; "expands [[D552]]/[[D553]], research before RFC". R12 landed (individual signature 97.2% passes; archetypes k=4–12 refused), D843 landed (one declared vocabulary, two gates; maps-to-greats REFUSED at ARI 0.251–0.417; style vector privacy-critical); opening identity at runtime still refused (`position-evidence.ts:25`, D544) and assigned to the runtime opening-identity RFC (SC Discharge D3) | Queue entry R21 in §2.5 below + ledger cell routing note |

### 2.1 D585 — codex-queue paragraph (verbatim, for `planning/codex-queue.md`)

> **Ambient "Open assistance" button — wire it or retire it inside the play-composition
> chrome slice (D585).** `DrillScreen.svelte:824` renders a chess-piece button
> (`aria-label="Open assistance"`, title cycling Thinking…/Waiting for
> disclosure/A consequence is ready/Present) whenever `assistance.ambient === "on"` — and it
> has no `onclick`, link, or expanded target. It has been dead since the R3 source audit
> found it (2026-08-20). No document owns it: it is not one of `play-composition` §5's 15
> leak sites (L2/L5/L6 bracket line 824 and skip it), `assistance-control-wiring` (archived)
> never mentions ambient, and `assistance-controls` (returned draft) explicitly defers
> ambient forms. Because `play-composition` is **implementing** and rebuilds this exact
> region, do NOT patch it standalone — fold it into the remaining module-seat/vocabulary
> cleanup slice: either give the button its real target (the per-seat assistance surface the
> RFC composes) or delete it with the rest of the retired chrome, and add one
> `play-composition` changelog line naming `:824` as a 16th chrome site so the production-site
> discipline (A4/A17-class) stays closed. Flip D585 in the commit that does it.

### 2.2 D698 — exact replacement status cell (and the corrected blocker text)

Column 1: `D698 🐞` → `D698 ✅`. Column 3 (replaces `🐞 planning reconciliation 2026-08-21;
bot-policy/o8-handoff.md`):

> `✅ resolved 2026-08-22: R11's research exit is mechanical/desk COMPLETE and O8 is RULED —
> rfc/bot-policy.md accepted 2026-08-22 without claiming population-level human-likeness;
> execution-queue row 1.2 already carries the corrected state. What R11/O8 wait on NOW under
> D649's owner-plays-only posture: nothing external. Downstream (not blockers of the research
> exit): (a) bot-policy/F8 implementation after the 2c/2d collector landings (queue chain
> R11 → O8 → collector contracts → F8); (b) D970's exposed-band roster amendment before any
> production profile declaration; (c) the owner's own blind session with the retained
> 42-branch packet — a validation-by-use step, never a recruited review. The ledger was the
> last place carrying the stale EXTERNAL blocker.`

### 2.3 D301 — routing (ledger cell + drafting-queue entry)

Column 3 (append to the existing `campaign, return loop, Q1b` cell — the row stays 💡 until
its RFC lands):

> `; ROUTED 2026-08-22 → planning/rfc-drafting-queue.md: small standalone "daily-position"
> RFC (not campaign-core's). It is genuinely small — every runtime input ships at HEAD:
> public_tokens + story_read anonymous scope (storage.ts:1306-1317), the run graph, 47 packs
> + 43 mined candidates. One disposable exploration-gate prototype precedes drafting: the
> spoiler-free branch-set glyph (the row's named killer — the glyph must not become a score),
> tied to this row and logged. The RFC then pins: deterministic date→position selection over
> a curated set, the daily run kind, share-artifact shape, and either story_read reuse or one
> new token scope (createPublicToken currently enforces story-only — a register lane if
> widened). NOT blocked by the notification hole (BACKLOG :1157): the daily lands site-side
> first, per the row's own Wardle anti-push posture; the notification row remains its own
> thread. Codex-able after acceptance.`

Drafting-queue entry (for `planning/rfc-drafting-queue.md`, coordinator to place):

> **daily-position** — one shared position a day + spoiler-free share artifact (D301, twice
> unrouted). Cheapest complete feature in the campaign cluster; all inputs shipped (see the
> D301 cell). Precondition: the glyph prototype (exploration gate, disposable, tied to D301).
> Scope: date→position rule, daily run kind, share token, share artifact = branch-set shape,
> never a score. Explicitly out: notifications, streaks, leaderboards.

### 2.4 D863 — routing (ledger cell + content-wave paragraph)

Column 3 (append to `📊 measured 2026-08-22` — the measurement stands, the row stays 📊):

> `; ROUTED 2026-08-22 → content-era queue: the two dead wirings are CONTENT-STARVED, not
> broken — verified at HEAD: stated_reasoning machinery live (authored-feedback.ts:127-131
> withholds feedback until reasoning records) with exactly 1 content file using it;
> perfect_tablebase machinery live with exactly 6 content files. The repair is authoring, not
> code: a content wave writes stated_reasoning checkpoints into existing packs
> (solve-before-correction) and authors Dvoretsky-style technical-position packs over
> perfect_tablebase. Rides the content-wave closeout protocol (ledger flip + content-era log
> in the shipping commit). Sparring needs nothing. Blindfold stays parked (D717 collision).`

Content-wave paragraph (for the coordinator to drop into the content work order):

> **Training-method content wave (D863):** author (a) stated_reasoning checkpoints across
> the existing spine — the write-before-checking method whose full machinery ships with one
> consumer, and (b) additional perfect_tablebase technical-position packs (currently 6 files)
> re-cut as play-the-consequence, never find-the-tactic. Both are law-8-clean: the machinery
> already grades nothing. This wave also absorbs SC Discharge D4's authored-witness debt
> (D926) where positions overlap.

### 2.5 D549 / D552 — research-queue entries (R20/R21; next free ids after R19)

For `planning/platform-alignment/research-queue.md`, same table grammar. Ledger cells first:

D549 column 3 (append): `; ROUTED 2026-08-22 → research-queue R20 (desk arm startable now;
measurement arm waits on longitudinal-store implementation [held by D973] + D300
attempt_concepts identity migration + 2c/2d/2e producer landings)`

D552 column 3 (append): `; ROUTED 2026-08-22 → research-queue R21 (aggregation-contract
draft startable now per D562's research-before-RFC demand; measurement waits on the
longitudinal store [D973] and runtime opening identity [D544 → semantic-collectors
Discharge D3])`

> | R20 | **DESK ARM READY; measurement BLOCKED (longitudinal store — D973; D300 migration; 2c/2d/2e landings)** | **Skills/progression taxonomy grounding** (D549/D842/D562-adjacent) — the closed category set and re-derivable credit rules a progression surface may show | Desk: map `player-analysis-and-skills.md` §3's rules (rate = credited events / declinable opportunities; floors 25–200; tiers on the rate; no raw counts, no streaks) onto the 175 admitted learner-module rows and shipped/accepted collector ids; adopt surveyed category *names* only — no surveyed credit mechanism (none publishes a denominator). Measurement: re-run the F2 opportunity denominators (R12's 261,892-decision instrument) per category once the store lands | A closed table category → event ids → denominator → floor → tier rule, every rule re-derivable and law-8-clean (credit from detected evidence only); anti-gaming rows inherited (D345/D603 alarms). Refusals recorded, not smoothed | D549 progression-surface RFC; feeds D861 (pass-mark packs), D865 (difficult roots), D885/D297 (knowledge-as-key) |
> | R21 | **CONTRACT DRAFT READY; measurement/production BLOCKED (longitudinal store — D973; runtime opening identity — SC D3)** | **Longitudinal style-feedback aggregation contract** (D552/D562/D843) — the second grounded aggregation contract D562 demands before any RFC | Desk: draft the contract over R12's twelve retained habit metrics — per-metric inputs, floors, uncertainty display, versioned reference corpus; one declared feature vocabulary shared with bot personas (D843's two-gate rule: persona = policy under R11's gate, style reading = measurement under R12's); the opening-accuracy arm binds to the runtime opening-identity RFC's ids when it lands. Competitor evidence already in dossiers — no new survey | Contract names what may aggregate and what is refused: archetype clustering REFUSED (ARI 0.251–0.417 < 0.70 gate), maps-to-greats-from-play REFUSED (labelled quiz is the honest form), rating separation absolute (R15 byte-identity), style vector learner-only (R12's 35/36 re-identification). LLM renders aggregates of grounded facts only (law 8) | D552 surface RFC after the store lands; O9/R13 consumption; D812 persona seam |

---

## Count summary

- **Job 1 (42 rows):** 36 CONSUMED (flip ✅ with the cited consuming section) · 5
  STILL-OPEN-INPUT (D803–D806 → breadth-collectors landing per B14; D903 → learner-modules
  landing) · 1 RECORD-ONLY (D800, stays as measured record).
- **Job 2 (6 threads):** D585 still dead, unowned → codex-queue paragraph folding it into
  play-composition's chrome slice · D698 flip ✅ with corrected owner-posture blocker text ·
  D301 routed to a small `daily-position` RFC behind one glyph prototype · D863 routed to a
  content wave (both dead wirings are content-starved, machinery verified live) · D549 →
  research-queue R20 (desk arm ready) · D552 → research-queue R21 (contract draft ready).
- **Zero-mention closure:** after this pass every one of the 48 rows has either a ✅ citation
  or a named execution destination; none is represented by silence.
