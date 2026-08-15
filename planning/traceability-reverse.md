# Traceability audit — reverse direction (RFC archive → design)

**Date:** 2026-08-14. **Method:** every RFC in `rfc/archive/` (35), the one active draft
(`rfc/open-answer-grading.md`, implementing), and both withdrawn drafts were read end to
end; each RFC's "Deviations from design" section and its discovered concepts were traced
back into `design/00–05`, `design/BACKLOG.md`, and the mirrored gate surface
(`planning/exploration/gates.md`), and the owner rulings in
`planning/exploration/log.md` were checked against the design docs they govern.
Read-only analysis; every proposed edit below is a report for the owner — design is
owner-tier (law 5), and nothing here was applied.

Scope note: the assignment referred to "three in-flight drafts"; at audit time the
active table holds exactly one (`open-answer-grading`, implementing) — `onramp-guard`
and `repertoire-gap-finding` completed and archived inside the same 2026-08-14 window.
Both are audited as archive members.

Verdict vocabulary per concept: **ABSORBED** (design states it — doc+section cited),
**OMITTED** (consciously left to `docs/`/RFC as mechanism detail — with the reason),
**MISSING** (a product-shaping concept the next design reader will not find in the
design tier).

---

## 1. Headline

The repo's law-5 discipline (implementers propose design edits, never write them)
**worked for the early and middle RFCs and stopped being applied at the end**. Proposals
from the foundation era did land: publication channels replaced the struck review gate
in `design/03`, the seedMode overstatement was corrected in place, the branch-switch
budget was re-ruled into `design/02`, the rung-0 scope corrections were written into
`design/05` §3. But the 2026-08-14 parallel wave (the last ~10 RFCs:
structural-reading through social-match/onramp-guard) generated a large queue of
proposed BACKLOG rows and design corrections that **never landed anywhere** — the
ledger's own wave rows were not even flipped from 💡 to shipped, and the B3/B4 gate
rows now disagree between the two mirrors and with the log's "BREADTH COMPLETE — every
gate B1–B11 is green" entry. The reverse-traceability debt is concentrated almost
entirely in the final two days of the breadth program.

---

## 2. Per-RFC table

Legend: **✓** = flowed back into design (cite), **✗** = never flowed back, **→docs** =
consciously lives in canonical docs only, **prop✗** = the RFC proposed the design/ledger
edit and it never landed.

| RFC | Deviations from design → flowed back? | Discovered concepts → absorbed? |
|---|---|---|
| **branch-runtime** | None declared. | Path-keyed nodes/`transposeKey`, implicit fork, event log as truth, objective machine with evidence-carrying transitions, "deviation never blocks" — ABSORBED in substance across `01`/`02`/`05` §1 (attempts=branches, rewind-forks, run-log invariant); mechanism →docs. |
| **drill-pack-format** | None declared; Pack-A acceptance criterion superseded by the foundations-first ruling ✓ (logged, `02` §Product order). | Deviation-class vocabulary, `authoredBoundary`, digest law, session-distillability, on-ramp knobs — ABSORBED at intent level (`00` §Target player, `04` §2d, BACKLOG core-systems rows); prediction `grading{source,topK,minMass}` invented here was later **struck** by owner ruling — see stale S7. |
| **engine-workers** | 3 (no policy-mixer; TS supervisor; Python-in-sidecar) — ✓ all reconciled with logged rulings; BACKLOG opponent-broker row notes implemented ✓. | selection≠commitment, history conditioning, `seedHonored:false`, selection cache key, typed selection payload — `seedHonored` ABSORBED via the `03` §Branch groups 2026-08-14 correction; rest →docs (`docs/engine-workers.md`). |
| **drill-client** | 2 (difference strip deferred; branch race absent) — ✓ design already marked both optional/later. | Server-side orchestration/withholding, evidence-ref grammar + sentence table, why-banner law ("the CET lesson") — why-banner intent ABSORBED (`01` §4, log); `<50 ms` branch-switch budget it carried was superseded by owner ruling and `02` was corrected ✓. |
| **explanation-grounds** | 1 (Stockfish-and-objective subset; B4 stays unmet) — ✓ B4 row said unmet… and still says it; see stale S4. | Compare-withholding hole closed; rules/pack refs never withheld; score encoding — →docs; "prediction distribution delivery" nuance ABSORBED (BACKLOG row 159). |
| **authored-explanation-surface** (F1) | 2 (scope derived not authored; no pre-reveal markers — contamination side channel) — ✓ F1 recorded in `03` §Foundation edge; the passive-marker ruling stands unamended, and the "no pre-reveal affordance" consequence is visible design-level reasoning only in the RFC — acceptable OMITTED. | Path-relative reveal, `RevealAttribution` event identity, `hasWithheldAuthoredContent` honesty flag — →docs. Its correction to `docs/explanation-grounds.md` (Maia grouping is a category error) also ABSORBED (BACKLOG LLM-renderer row). |
| **authored-feedback-delivery** | None. | Projection-by-consumer table; **"vocabulary follows consumer, never leads it"** — the law recurs in five later RFCs; in design it exists only as scattered echoes ("grow the format only where a consumer grows"). **MISSING (M-11)** as a named law. |
| **learner-identity-and-authorization** (F3) | 3 (supersedes planning-tier local-profile and capability-token models; roles-not-events) — ✓ superseded *planning* dossiers with corrections recorded there; `02` §hosted lists the consequences ✓. | Two-question separation (grant vs lease), status-mapping doctrine →docs. **Byte-identical read invariant** and **no-anonymous-access posture** — MISSING (M-4). **No-operator ruling** (owner 2026-08-12) — MISSING (M-3). **Deleted accounts → `__legacy`, runs survive** (owner ruling) — MISSING (fold into M-3). "Streamer may cheat on themselves" ABSORBED (BACKLOG streamer row ✓). |
| **pack-optional-runs** (F2) | 4 — incl. **`attempt_end` as a third ADR-0006 boundary** ✗ (ADR-0006's BACKLOG row still lists only checkpoint/segment) and the no-session-endpoint / `sessionDigest` widenings (→docs). | **Two-predicate disclosure split** (`feedbackDisclosed` vs `feedbackDeliveryOpen`; attempt_end re-closes on the next move — "a monotonic latch would turn Just Play into an engine review screen") — **MISSING (M-2)**, the anti-contamination invariant's actual shape. F2 itself ABSORBED (`03` §Foundation edge; BACKLOG F-note that `feedbackIsRevealed` no longer exists ✓). |
| **terminal-outcome-events** | None declared (reasoned). | `outcome.reached` producer, outcome-discloses-under-all-policies ("a finished run has no decision left to contaminate") — D11 closure ABSORBED (BACKLOG D11 ✓); the disclosure rationale is design-grade and lives only in RFC/log — minor, fold into M-2's disclosure-model home. |
| **content-sourcing-foundation** (B6a) | 3 (no priority signal; mechanical `objective.summary` placeholder; `--learner-side` human input) — ✓ recorded honestly; the theory-sourcing dossier updates were proposed as owner-tier BACKLOG rows 69–71 and **still sit un-applied** (prop✗). | Artifact triple, evidence sidecar-never-served, licence matrix with derived obligations, deterministic-timestamp rule, "no pipeline can promote a pack" — →docs (`docs/content-sourcing.md`); the D8/D9/D10/D11 defects it opened are all ledgered ✓. |
| **content-sourcing-syzygy** (B6b) | 3 — incl. "design/04 §4 reads as though Syzygy grounds the endgame family… **wrong and not fixed here**" ✗. `04` §4 does carry "≤7 pieces", but the load-bearing insight — **Syzygy grounds run terminals via reduction, not pack roots** — is MISSING (M-13). | Range rule, abstention-as-deliverable, fixed-depth authoring budget, kind separation — →docs. |
| **content-sourcing-explorer** (B6c) | 3 (priority-as-file; may-not-deliver; generated-not-approved sentence) — ✓ Gate 0 outcome logged; BACKLOG row 71 (dossier update) prop✗. | Closed request grammar, no-band-substitution, minimum-mass abstention, generation-plus-byte-equality prose support — →docs; the operator-token vs learner-link boundary ABSORBED (BACKLOG row 72 ✓). |
| **content-sourcing-position-seeds** (B6d) | 6 (delayed_checkpoint substitution for D8 — since superseded by onramp-guard; spine-less packs; no Go worker; …) — ✓ mostly; BACKLOG row 70 (dossier replacement text) prop✗. | Consequence-pack/complete-line rule ABSORBED (`04` §6 "re-cut as play-the-consequence" ✓); solution-not-on-the-wire, even-parity checkpoint — →docs. |
| **defect-sweep** | 4 — incl. removing the thesis's blunder-guard encoding ("a loss the design tier should weigh") → ledgered ✓ (friction row 154) and later restored by onramp-guard; **row 154 never updated** (stale S9). | **Declared-vs-executable vocabulary rule** — **MISSING (M-1)**, normative only in `docs/drill-pack-format.md`. `unclassified` phase honesty ABSORBED (defect rows); light profile ✓ (D5). |
| **outcome-drill-grading** | 6 — incl. `save` graded on the draw floor only and `resist` on checkpoints (design's definitions are not predicates) ✗ — `01` §Outcome types unamended (**M-9**); "grade doesn't know the policy, only the engine" → fixed later by D15/`policyModeApplied` ✓ (ledgered). | Monotone law, absorbing-state law, `resolveAt`, ledger-verified grounding ("a pack cannot declare itself proved") — D12-family closures ABSORBED (defect rows ✓); laws →docs. |
| **line-drill-theory-grading** | 7 — incl. **no theory/idea score** (law 8) ✗ — `01`'s mode table still says "theory/idea score" (stale S13); membership-ruling ✓ (owner ruling logged, BACKLOG row 165/248 salvage); D15 reversal of outcome-drill's refusal ✓ (D15 row records it). "Rating-level deviations" narrowing prop✗ (no BACKLOG row landed). | Three-verdict membership, `unknown` is never a failure, boundary evaluator, `policyModeApplied` — `policyModeApplied` ABSORBED (D15 ✓); rest →docs. |
| **defect-batch-2** | None declared (reasoned). | "Segments are events" semantic; measured-envelope doctrine ("a gate that can report either answer on identical code is not evidence") — doctrine echoed in `02` §latency ("tripwire, not the criterion") ✓; stale-ledger-row hygiene finding ✓ applied to D23/D24/D27 rows. Proposed provenance/feedbackClaim closure row — prop✗. |
| **return-and-progression** (B7) | 3 — **(1) `design/03:72` "SRS over episodes/concepts" superseded by `01`'s narrower ruling — `03` never updated** ✗ (stale S2); **(2) attempt = fork-rooted branch, amending `01`'s "one pass through the four stages"** ✗ (**M-7**); (3) ladder/variants pinned in RFC — OMITTED with named revision triggers ✓ correct. | Verdicts (stable/unstable/open), "a result is not a verdict", voluntary-return definition, **"what the display may not say"** (no mastery numbers) — the no-skill-numbers posture is ABSORBED only via research/adoption rows (milestones row 204, ChessMonitor note); the attempt-identity semantics are MISSING from `01`. Its nine corrections of record (incl. gates.md Pack-A claim) ✓ applied. |
| **trajectory-drill** | 9 — the largest set: trajectory = **one pack with legs**, not a chain of pack families (`04` §5 ✗, stale S16); "per-phase" → per-leg (`01:100` ✗, stale S14); "objective transitions" → seal-and-reset, `transitioned` never emitted (`03:51` ✗); brief's plan verdict doesn't exist; Pack-A policy discrepancy prop✗; duplicated pack-schema register found ✓ fixed in rfc/README. | Anti-stitching rule, seal-and-reset, `not_entered` is not a failure, no trajectory aggregate — **MISSING (M-8)**; `04` §5 still describes the superseded model. |
| **pack-studio** (B6) | 3 — review struck ✓ (`03` §Create rewritten with publication channels; B6 row reworded as proposed; shell table ✓) — **but `03:113` "Nothing becomes published teaching without review" survived the edit** (stale S1); one-importer OMITTED ✓ reasoned. | Channel derived-never-stored ABSORBED (`03` ✓); digest-addressing + `PACK_UNRESOLVABLE` ABSORBED (D20 ✓); forge-hazard ABSORBED (D25 ✓, though its citation is wrong — see S-list); **"publication does not travel" / graduationBlockers as the only content gate / pack-id-belongs-to-first-publisher** — →docs, borderline MISSING (M-11): "the only content gate" is the post-review-strike safety story and design never states it. |
| **n-way-comparison** (B3) | 4 (deep-mode specialisation; race/replay-variants out to #4; duplicate/share re-homed to B7/B8; `/review` stub) — ✓ all sequencing-consistent. **Its fabricated 8-branch design citation was withdrawn and ledgered** ✓ (BACKLOG row 158 — owner ruling still pending, correctly open). | Single-axis N-way payload, "explaining consequence, not difference" as payload obligation (the Lucas Chess criterion — ABSORBED, `03` §failure mode ✓), ranking prohibition (ABSORBED via branch-ranking BACKLOG row 218 which cites it ✓), simulate-is-scratch ✓ ruling — **but BACKLOG row 251 still says "previews are REAL branches"** (stale S8) and **row 255 still carries the struck prediction grading** (stale S7). |
| **live-session-platform** (B5) | 5 (cohorts/relays as grants+rotation; viewers get no client; only authenticated share; distillation deferred to #6; capability-token model rejected) — ✓ planning-tier corrections recorded; BACKLOG Arena/academy rows carry corrections ✓. | Session journal separate from run log — **ABSORBED** (`05` §1 invariant 6, scoped 2026-08-14 ✓); possession journal + authorship rule ABSORBED at ledger level (D17/D18/D19 ✓); `withheld: true` honest-absence ✓ (D18). Vote-is-advisory / adapter-is-a-learner →docs. |
| **structural-reading** (B9) | 7 — incl. answering `05` §6-Q2 at one ply (prop✗ — §6 still lists it open, stale S21); pack-count correction ✓ applied in `03:387`; pawn-skeleton-as-predicate narrowing ✗ (`03:161` unamended, minor); **found D26 + the unledgered `feedbackClaim` passthrough + D25's wrong citation** — D26 ledgered ✓, the other two prop✗. | Twelve-kind vocabulary, four admission rules, no-valence rule, detector-conventions-identify-themselves, sight-not-advice — ABSORBED at intent level (`03` §Structural reading, `05` §3/§5 as corrected) — the **strongest absorption case in the audit**; enforcement machinery →docs. But the **banned "can never use b5 again" example survives verbatim at `03:174`, `05` §5 (:333), and BACKLOG row 186** while `05` §3 forbids it (stale S22). |
| **adaptive-guidance** (B10) | 5 — resolves `05` §6-Q3 and §6-Q4 (prop✗ — both still listed open, stale S21); option-collapse redefinition prop✗; guided mode ships without band default (no learner strength exists — honest absence) ✓ reasoned; `03:198` shipped literally ✓. | Phase bands as pinned parameters with revision triggers, laws 1a–1d, `AssistanceConfig`+`SILENT_ASSISTANCE`, packet-before-provider voice contract with `voiceCheck` — ABSORBED at intent level (`03` §Adaptive guidance, `05` §3a/§3b-i as corrected 2026-08-14 ✓); "the deterministic text is the product" + necessary-not-sufficient honesty →docs. |
| **shape-library** (B11) | 4 — incl. **B11's gate clause "a drill is generated from…recipe" predates the split ruling and needs owner restatement** prop✗ (row still carries the recipe clause); B2-row/client tension resolved by shipping ✓; §0-sketch narrowed inside packs (recognition never authoritative — consistent with standing rule ✓). | Shape entry object, `success.signature` nullable-as-statement, firings never persisted, two-layer panel with the fixed frame sentence, census honesty — split ruling itself ABSORBED (`04` §0 ✓, B11 row ✓); entry mechanics →docs. |
| **branch-groups** | 2 — **`design/03:140` seedMode overstatement corrected in place** ✓ (the model flow-back case: `03` now says "Corrected 2026-08-14: the control does NOT already ship" and cites the RFC's reply journal); lockstep/sequential resolution ✓ (design invited it; `03` open-question paragraph still phrases it as open — acceptable, presentation was "deliberately unfixed"). | Reply journal ABSORBED (`03` §Branch groups ✓, BACKLOG row 216 flipped ✓ — the **only** wave row that was); `policyModeApplied: "enumerated"`, adoption, honest actor attribution →docs. **But the B3 gate row still says "branch groups… no RFC yet"** (stale S3). |
| **game-import-and-story** | 3 (none against invariants; resignation leaves a playable leaf; human_divergence abstains backward) — ✓ consistent with `05` §3a's forward/backward table. | `sessionKind:"imported"`, progress exclusion, `nodeId` vs `entryNodeId`, eval_pivot as named convention, **the differentiator pin ("the door into play, not having a story" — post-Chess2Story)** — BACKLOG rows 192/193 predate the RFC and were never refreshed (**M-6** / stale S11); "never shippable read-only" is the engine-review-screen law applied ✓ in spirit. |
| **adoption-wave-1** | 2 (opposite-side as pack-free derived run — "pack claims never flip sides"; share token amends a docs-tier limit) — ✓ reasoned; docs limit rewritten ✓. | **Storyability** (storyable iff terminal `outcome.reached`), auto-offered-never-auto-shown, public projection whitelist, deterministic `suggestTitle`, persona-can-never-reach-public-surface, milestones numbers-rule pin ("event facts allowed, skill numbers banned") — **MISSING (M-6)**; BACKLOG rows 201–205 all still 💡 (stale S11). |
| **social-match** | 2 (extends the token surface; **`design/03` does not name human-vs-human match play — no design edit made**, owner proposals listed) — prop✗ on both. | **`MATCH_LIVE` consent model** — possession follows side-to-move, pause-handshake-as-mutual-consent, derived-run escape (`duplicate`/`flip`) refused, mainline `countable:false` — **MISSING (M-5)**; BACKLOG rows 212/213 still 💡 (stale S11). |
| **predicate-wave-2** | 4 (axis-widened mirror; refusals-not-deferrals; fan lives in signature; duck-typed walk sites) — refusal outcomes prop✗ (**BACKLOG row 199 never updated**, stale S11). | Side-label law, shade parity, no-balance law preserved for pawns, `quantified` adds-no-fact — →docs (`docs/structural-reading.md`); first side-to-move-reading leaf noted as a vocabulary milestone →docs. |
| **runtime-corpus-evidence** | None declared (reconciliation stated against `03:225`, `05:75`, §3a — all honored ✓; §6-Q1 deliberately untouched ✓). | Abstention as first-class result, no-population-substitution, byte-fixed `CORPUS_GUARD` sentence, recency-without-drift-claims, ephemerality-as-contract — →docs. **It closes B4's corpus clause — and neither gate mirror was updated** (stale S4); BACKLOG recency row 198 still 💡 (S11). |
| **repertoire-gap-finding** | None declared (reconciled with `03:107` via the audit-row transformation ✓). | Learner-private repertoire object, gap ≠ move quality, abstention propagates and is never rounded to 0, **"the repertoire updates by choice, never automatically"** — **MISSING (M-10)**; BACKLOG row 207 still 💡 (S11). |
| **onramp-guard** | 2 (knob renamed `immediate_guard`, judgment word dropped; rung-2 mid-play as pack-declared exception — exactly the thesis's per-pack ADR-0006 override ✓). | Three-tier guard with per-tier honesty, required false-positive analysis as contract, `feedback.generated` first producer, D28 fix — **the knob's return never flowed back**: `00` §Target player still describes the old shape and **friction row 154 still says "has no encoding… Scheduled"** (stale S9). |
| **adoption-wave-1 / social-match / onramp-guard / open-answer register rows** | — | `rfc/README.md` registers are current ✓ (the register discipline held; the design/ledger flow-back did not). |
| **open-answer-grading** (implementing) | 3 (three-row transcript vs the five-row BACKLOG sketch; key points on the interaction not on claims; rung-0 reuse) — corrections of BACKLOG:250 and audit row 19 declared, prop✗ until landing. | Grounded key points, the-miss-is-the-owned-failure-mode, no-score/no-ratio ("3/4 matched" named as the anti-pattern), digest-strict you-vs-you — judge at archive time; flag now so its closure includes the BACKLOG:250 rewrite. |
| **withdrawn/authoring-contracts-v03** | 1 declared (cap-not-union boundary reading). Withdrawal ✓ fully absorbed — BACKLOG row 248 carries the salvage AND the alignment pass's partial refutation of the withdrawal's own premise ✓. Exemplary. |
| **withdrawn/evidence-composer** | 1 (composer is data-only; rendering to #2b) — ✓ program split recorded in `03` item #2. Salvage (provenanceMode, fail-closed composition, per-scope reveal need) ✓ ledgered; per-scope reveal became F1 ✓. |

---

## 3. The MISSING list, ranked by how much the concept shapes the product

1. **M-2 — The disclosure model's real shape** (`pack-optional-runs`, `terminal-outcome-events`, `onramp-guard`): the two-predicate split (`feedbackDisclosed` durable/monotonic vs `feedbackDeliveryOpen` live), `attempt_end` as a third ADR-0006 boundary that **re-closes on the next committed move**, outcome-discloses-everything, and now `immediate_guard` as a fourth policy. ADR-0006 is the product's most load-bearing invariant; its BACKLOG row and `05` §1 still describe the two-boundary 2026-08 form. Every future disclosure question will be answered from this model, and it exists only in three archived RFCs.
2. **M-1 — The declared-vs-executable vocabulary rule** (`defect-sweep`): the law deciding how every pack vocabulary may grow ("executable vocabularies contain only what the runtime executes; declared vocabularies carry machine-checked refusal reasons plus capability publication"). Normative in `docs/drill-pack-format.md`; invisible from the design tier, though it governs design-level promises (the `03` outcome-drill row still promises "perfect" resistance, which is exactly a declared-unimplemented mode).
3. **M-3 — The no-operator ruling and the deletion model** (owner rulings 2026-08-12; F3 §13/§6.2): no privileged account ever, admin capabilities live in environment/config, three forbidden back doors; deleted accounts reassign runs to `__legacy` (runs are shared artifacts, attempts are personal data). Owner rulings constraining every future surface, recorded only in the log and an archived RFC. Natural home: `design/02` §hosted consequences.
4. **M-4 — The read-authorization posture** (F3, amended by the token RFCs): "authorization decides *whether* you may read, never *what* you read" (byte-identical reads), no anonymous access **except** scoped capability tokens on one pinned trust surface (`story_read`, `session_join`), per-viewer evidence scope refused on merits (second-account argument). Design has fragments (`05` §4); the invariant and its token-shaped exception are what a future share/overlay/embed feature will need.
5. **M-5 — The native-match consent model** (`social-match`): possession follows side-to-move; the pause handshake **is** mutual disclosure consent; `MATCH_LIVE` refuses the derived-run escape (`duplicate`/`flip` = in-product engine assistance on a live position); the match mainline is nobody's rep. `design/03`'s Live section does not name the surface; BACKLOG row 213 predates the RFC.
6. **M-6 — Story/share doctrine** (`adoption-wave-1`, `game-import-and-story`): storyability (terminal `outcome.reached`), auto-offered-never-auto-shown, the public-projection whitelist, deterministic titles (persona can never reach the public surface), and the market-pinned differentiator — *the door into play, not having a story*. Rows 192/193 describe the pre-RFC idea.
7. **M-7 — Attempt identity** (`return-and-progression`): a rewind-fork branch is a **full attempt at its own root** (amends `01`'s "one pass through the four stages" — without this the product's central gesture records nothing); countability; stable/unstable/open; "a result is not a verdict"; the no-mastery-numbers display law. `01` §Vocabulary is the natural home and was never amended.
8. **M-8 — Trajectory semantics** (`trajectory-drill`): one run, legs as contiguous spans, the anti-stitching rule, seal-and-reset, `not_entered` is not a failure, no aggregate ever. `design/04` §5 still teaches the superseded chain-of-pack-families model.
9. **M-9 — Outcome-grading floors** (`outcome-drill-grading`): `save` graded on the draw floor only (counterplay is not a predicate), `resist` graded on authored checkpoints (maximization is not a predicate), the monotone and absorbing-state laws. `01` §Outcome types still carries the ungradable definitions with no note that grading narrows them.
10. **M-10 — Repertoire invariants** (`repertoire-gap-finding`): learner-private, updates by choice never automatically, gap language never grades a move, abstention never rounds to zero.
11. **M-11 — Format-governance laws recurring across five RFCs**: "vocabulary follows consumer, never leads it"; "publication does not travel"; graduationBlockers as **the only content gate** (the post-review-strike safety story); a pack id belongs to its first publisher. Mostly →docs and defensible there, but the graduation-gate claim is the design-level answer to "what protects a learner from a wrong pack now that review is struck" and design never states it.
12. **M-13 — Syzygy grounds run terminals, not pack roots** (`content-sourcing-syzygy` — flagged "wrong and not fixed here" against `04` §4): the reduction insight that makes an 11-piece pack gradeable at its endings.

---

## 4. Stale design assertions (design still says something a later ruling or shipped RFC struck)

Ordered by severity; file:line as of this audit.

- **S1 — `design/03:113`** "Nothing becomes published teaching without review." Contradicts the 2026-08-13 owner ruling striking review — recorded fifteen lines above it in the same section. The sentence survived the publication-channels rewrite.
- **S2 — `design/03:72`** "SRS over episodes/concepts" contradicts `design/01` §Repetition's owner ruling (attempts scheduled, concepts select, phase never) — an internal design-tier contradiction that `return-and-progression` declared as its Deviation 1 and proposed fixing.
- **S3 — `design/03:273` (B3 gate row)** "Open surface: **branch groups** (owner 2026-08-13, no RFC yet)" — `branch-groups` shipped 2026-08-14; `gates.md:126` was updated, `design/03` was not. **The gate surface is split**, which law 5's mirror rule exists to prevent.
- **S4 — `design/03:274` + `gates.md:127` (B4 gate row, both mirrors)** "structural layer is B9 (`rfc/structural-reading.md`, draft); corpus/Syzygy runtime rendering and evidence-bound LLM rendering remain unmet." Structural-reading is shipped and archived; `runtime-corpus-evidence` shipped the corpus runtime layer; `adaptive-guidance`/`adoption-wave-1` shipped the packet-bound voice seam. Also conflicts with the log's "BREADTH COMPLETE — every gate B1–B11 is green" (2026-08-14). The honest current state (corpus ✓, structural ✓, voice-seam ✓, Syzygy runtime rendering and full evidence-bound LLM residual) is recorded nowhere.
- **S5 — `design/02:77`** "web-first (TypeScript/**React** + chessground per the archive sketch)" — the stack was ruled TS core + Go workers, **Svelte 5** on 2026-08-12 and the entire client shipped in Svelte.
- **S6 — `design/02:53-54`** "Still open: source model and monetization" — the log records both ruled on 2026-08-12 ("Q2 fully settled: AGPL-3.0 / self-hosted / free / original-prose+CC0-data"; the later hosted amendment explicitly touched deployment only). Either the doc is stale or the hosted ruling deliberately reopened monetization — owner should say which; today the two tiers disagree.
- **S7 — `design/BACKLOG.md:255` (prediction checkpoints)** still specifies `grading{source,topK,minMass}` and "grade the prediction against the Maia distribution" — the 2026-08-13 owner ruling (numbers, never a verdict) struck grading, and pack schema 0.9 removed the fields.
- **S8 — `design/BACKLOG.md:251` (forward-branching simulate)** "previews are REAL branches in the run graph" — the 2026-08-13 ruling made simulated branches scratch until entered (`Branch.origin` promotion marker).
- **S9 — `design/00:150-152` + `design/BACKLOG.md:154`** — the on-ramp blunder-guard knob: the friction row still says "has no encoding… **Scheduled**" though `onramp-guard` shipped `immediate_guard`; the thesis still describes the pre-transformation shape ("show the consequence within a couple of plies, then rewind") rather than the shipped post-commit play-on-or-rewind guard with the three-tier basis.
- **S10 — `design/01:97` (mode table)** Line Drill "graded on … theory/idea **score**" — the RFC ships membership verdicts and refuses any score (law 8); **`design/01:100`** Trajectory "graded on per-**phase**" — shipped is per-leg, with "phase" deliberately never computed.
- **S11 — the un-flipped 2026-08-14 wave rows** in `design/BACKLOG.md`: 198 (recency — shipped), 199 (predicate wave 2 — shipped 0.13, refusal outcomes unrecorded), 201–205 (all five adoption-wave-1 items — shipped), 207 (repertoire gap-finding — shipped), 212/213 (friend-link + native match — shipped by social-match). Only branch-groups (216) was flipped. The ledger currently under-reports the shipped surface by ~10 rows.
- **S12 — `design/BACKLOG.md` breadth-surface table (rows 59–77)** still carries the 2026-08-12 alignment-pass state ("blocked on F2", "no write endpoint, no UI, no importer", share links "blocked on D1", drill-in-a-URL "zero production consumers") — all long closed. The section is not labeled historical, so it reads as current.
- **S16 — `design/04:109-119` (§5 Trajectories)** still teaches trajectory-as-chain-of-pack-families; shipped is one pack with `legs` (trajectory-drill Deviation 1).
- **S21 — `design/05` §6** lists as "genuine forks, not gaps" three questions that shipped RFCs resolved: Q2 (discovered-consequence depth — answered at one ply on rung-0 grounds, `structural-reading`), Q3 (classifier wrong out loud — it abstains in declared bands, `adaptive-guidance`), Q4 (Just Play defaults — the product's opinion is silence; the rest is the learner's choice). All three promotions were proposed and never landed.
- **S22 — the banned rung-0 sentence survives**: `05` §3's 2026-08-14 scope correction forbids "can never use b5 again" (pawns advance and capture), yet the exact sentence still appears at `design/03:174`, `design/05:333` (§5), and BACKLOG row 186. One site was corrected; three were not.
- **Minor**: BACKLOG D25's citation points at `feedbackClaim`'s schema line while calling it `provenance` (structural-reading found the third passthrough site is unledgered); `design/03:161` "pawn-skeleton signature" still listed as a feature predicate (shipped as readable key only); `design/03:48` promises "perfect" resistance policies (declared-unimplemented under M-1's rule); the Pack-A `theory_strict`-vs-documented-`human_common` discrepancy (trajectory-drill Deviation 7) is ledgered nowhere.

---

## 5. Proposed minimal set of design edits (report only — owner-tier)

Seven files, ~25 discrete edits. Ordered so the contradictions go first.

1. **`design/03-product-breadth.md`** — (a) delete or rewrite the `:113` "without review" sentence to the channel model; (b) refresh the B3 row (branch groups shipped) and the B4 row (corpus ✓ / structural ✓ / voice-seam ✓; name the true residual: Syzygy runtime rendering + full evidence-bound LLM rendering), and mirror both into `gates.md` in the same change; (c) `:72` reword "SRS over episodes/concepts" to the ruled attempts-scheduled model; (d) remove the banned b5 sentence at `:174` (restate as eviction distance); (e) one paragraph in §Live naming native match play + the pause-consent model (M-5); (f) restate B11's gate clause post-split-ruling (shape-library Deviation 2).
2. **`design/02-product-shape.md`** — (a) `:77` React → Svelte 5 (ruled 2026-08-12); (b) reconcile `:53` "still open: source model and monetization" with the logged Q2-settled ruling (owner states whether hosting reopened monetization); (c) add the no-operator + deletion-model rulings to the hosted-consequences list (M-3) and one line for the read-posture/token-surface law (M-4).
3. **`design/01-training-model.md`** — (a) mode table: Line Drill "membership verdicts (`on_line`/`classified_deviation`/`unknown`), no score" and Trajectory "per-leg"; (b) §Vocabulary: the fork-rooted attempt refinement (M-7); (c) §Outcome types: one sentence each on the `save`/`resist` grading floors (M-9).
4. **`design/05-in-run-experience.md`** — (a) §6: mark Q2/Q3/Q4 resolved with pointers to the resolving docs (S21); (b) fix the §5 b5 residual (S22); (c) §1/§3a: state the disclosure model — two predicates, the `attempt_end` third boundary that re-closes, outcome-discloses-everything, and the pack-declared `immediate_guard` exception (M-2).
5. **`design/04-content-architecture.md`** — (a) §5: trajectory = one pack with legs; family language is a catalogue relation (M-8/S16); (b) §4: add "Syzygy grounds run terminals via reduction, not pack roots" (M-13).
6. **`design/BACKLOG.md`** — (a) flip the shipped wave rows (198, 199, 201–205, 207, 212, 213) with one-line shipped summaries, matching the branch-groups row-216 pattern; (b) rewrite row 255 per the numbers-not-verdicts ruling and row 251 per the scratch-until-entered ruling; (c) update friction row 154 (`immediate_guard` shipped; pre-commit form still invariant-review material); (d) fix D25's citation and ledger the third passthrough site; (e) label the breadth-surface table §2 historical (or refresh it); (f) new rows for the never-landed proposals: declared-vs-executable law promotion (M-1), theory-sourcing dossier updates (rows 69–71 remain pending owner application), the Pack-A policy discrepancy, the graduation-gate-is-the-only-content-gate statement (M-11).
7. **ADR table (`design/BACKLOG.md` §Provisional decisions)** — ADR-0006 row: note the two shipped amendments (attempt_end boundary; `immediate_guard` pack-declared exception, both consistent with the ADR's rationale).

**Process observation for the owner**: the register discipline in `rfc/README.md` held perfectly through the same period in which the design flow-back stopped — because registers are edited in the same commit that drafts, while design edits are proposals awaiting a human pass. A standing "apply the proposal queue" step at each wave boundary (or making BACKLOG row-flips part of the RFC archive checklist, which is already agent-writable ledger territory) would have prevented all of S11 and most of this dossier.

## Delta re-run — 2026-08-14 (post polish wave)

Run by claude after the last feature wave landed (`765efb5` polish-surfaces,
`0939070` orphan-completion, `2fd82be` grounding-pair; all archived, Active
table empty). Delta scope only — the 2026-08-14 full trace above stands.

**Verified clean by grep against real code, not prose:**

- Registers match implementation exactly: `STORAGE_VERSION = 18`
  (`storage.ts:387`), `DRILL_RUN_SCHEMA_VERSION = "0.13"`, pack schema 0.15.
- polish-surfaces: `boardLighting` in `AssistanceSettings.svelte` +
  `DrillScreen.svelte`; TTS provider gated at `main.ts:23-26`.
- orphan-completion: `comparisonStrips`/`comparisonNarrative` wired at
  `rest.ts:1094`; `/runs/:id/distill` in the route matcher (`rest.ts:529`)
  and handled at `:1051`; `/progress/recommendations` at `rest.ts:743` with
  the corpus guard in the sentence grammar (`repertoire.ts:82`).
- grounding-pair: `perfect_tablebase` published conditionally —
  `capabilities.ts:190` filters it out when the tablebase provider is `none`,
  which is the D8 declared-vs-executable law executing correctly.
- Gates run personally: `ENGINES_REQUIRED=1 make verify` 474/80 exit 0;
  `make test-browser` 24 passed, zero retries, 1 optional Maia skip.

**Found and fixed:**

1. Ledger flow-back missed by the implementing commit — `2fd82be` flipped the
   RFC register but not the BACKLOG rows it ships (verify-draft item,
   resistance-spectrum, the cross-link row). Flipped post-hoc in `4cb7bfd`
   with attribution. This is the failure the completion law names, recurring.
2. Shape-entry count overstated as 24 in `design/03-product-breadth.md` §B11
   and `roadmap-to-done.md`; the true count is 23 (this dossier had it right).
   Two commissioned entries — London wedge, KID arrangement chain — were being
   counted as authored. Corrected in both.
3. Stale roadmap content rows: waves 4a/5a/5b still read "three agents
   authoring"; theoretical mates read as pending. All landed; 39 packs.
4. "Engine-validation 0 run" was true-but-misleading: tablebase grounding is
   now real for 10 packs. Restated so what is actually at zero — Stockfish
   validation of middlegame/opening claims — stays visible.

**Reverse-trace orphan (open, owner-facing):** `cursed-win` / `blessed-loss`
ship in code (`tablebase.ts:5-11`, correct inversion and rank) and in
`docs/tablebase-grounding.md`, but flow back to **no design doc**, and they
contradict `01-training-model.md` §Outcome types — a *Win* drill's "keep the
position winning and finish the conversion" is unsatisfiable in a cursed win
under the 50-move rule. Ledgered; needs an owner ruling. No shipped pack roots
on one, so nothing is broken today.

**Gate status:** orphan list is 1 item, triaged (ledgered + escalated to the
owner). Stale list is empty. Per the §2b rule, done is not declared while
either list is non-empty *and untriaged* — this one is triaged.

---

## Delta re-run — 2026-08-15 (twelve-wave delta)

Run by claude at HEAD `e200ba8`. Scope: the eleven RFCs archived since the last
run — `authoring-frictions`, `validator-integrity`, `tempo-vocabulary`,
`resistance-spectrum`, `predicate-wave-3`, `opening-evidence-path`,
`branch-set-scale`, `deviation-classes`, `transition-primitives`,
`expression-census`, `engine-request-contract` — read end to end (~15,100 lines)
for Deviations, discovered concepts, and **the normative text their cross-reviews
added late**, which the brief correctly identified as the likeliest to be lost.
Plus a full integrity pass over the defect ledger. Companion:
`planning/traceability-forward.md` §Delta re-run 2026-08-15.

### The headline, and it is partly good news

**Design-doc flow-back in this wave is markedly better than 2026-08-14 found.**
Three deviations landed properly and in the right tier: `authoring-frictions`
Deviation 3 (cursed win / blessed loss — the open owner-facing orphan this
dossier escalated on 2026-08-14) is now written at
`design/01-training-model.md:104-110`; Deviation 4's draws-by-rule ruling at
`design/01:93-102`; and `resistance-spectrum` Deviation 2's `<500 ms` breach
became a two-axis latency ruling at `design/02-product-shape.md:165-180`,
carrying the measured figures *and* a "what the split does not license" clause —
better than the RFC proposed. **The 2026-08-14 escalation is closed.**

The remaining debt is concentrated, not diffuse. **Ten of eleven RFCs flipped
their ledger rows in the implementing commit**, satisfying the completion law's
intent even though all five archive commits (`12784a3`, `63bb6ab`, `57f86da`,
`4a893dc`, `ff95cfc`) touched no `design/` file. **`engine-request-contract` is
the single point of failure**: it flipped rows in neither commit and has no
`planning/exploration/log.md` entry at all. Six of the eleven declare no
deviation and are correct to (`branch-set-scale:874`,
`validator-integrity:909`, `expression-census:1194`,
`engine-request-contract:797`, `opening-evidence-path:1343`,
`transition-primitives:1362`).

### 1. MISSING — concepts with no design-tier home, ranked

- **M-14 — The engine request contract is not design-tier law**
  (`engine-request-contract:189-198`). *"An engine request must close over the
  instrument state its answer depends on"* — five obligations (state / clear /
  bind / bound / record), one-line form *"state a request does not state is state
  the previous request chose."* `design/BACKLOG.md:260` carries it as **💡** and
  literally reads *"Belongs in design tier once the RFC lands"* — the RFC landed
  at `ff95cfc`. Its sibling **M-1** (declared-vs-executable) is likewise still 💡
  at `BACKLOG.md:312`, unpromoted since the 2026-08-14 audit named it. **Two of
  the repo's four governing laws are candidate rows.** Home: `design/02` §hosted
  consequences, beside the no-operator and byte-identical-read rulings.
- **M-15 — The validator's own law** (`validator-integrity:134-154`):
  *"Validation must exercise every code path play will exercise before the first
  move"*, with two corollaries — *"a compilation failure is never an exception
  that escapes `validatePackDocument`"* and *"a rule that compiles but can never
  fire is a defect, not a nicety."* No design doc, no BACKLOG row. `design/04` §8
  makes `pack-check` the authoring gate; the law that makes the gate mean
  anything is invisible from the design tier. Home: `design/04` §8.
- **M-16 — "What grounds a plan class?"** (`opening-evidence-path:1499-1505`).
  The RFC states it *"belongs in a `design/BACKLOG.md` row before it belongs in
  an RFC"* — no such row exists. Design-shaping: `design/04` §3 builds the whole
  middlegame tier on structures and plan classes, so if plan classes are
  permanently ungroundable, a middlegame pack's central content is permanently
  ungrounded — *"a strictly larger version of the opening problem this RFC
  closes."* Home: a BACKLOG row plus a paragraph in `design/04` §3.
- **M-17 — Transition reading has no home on the assistance ladder.**
  `predicate-wave-3:1659-1662` (Deviation 5) says the transition category *"has
  no design home yet… the RFC that ships the surface should place it there"*;
  `transition-primitives` then shipped the surface and states *"`design/` is not
  touched"* (`:1461`). A new rung-0 readable class — attack/defence/line/
  flight-square/duty/irreversibility facts about a committed move, with a
  mandatory per-leaf scope table and a permitted/forbidden sentence table
  (`transition-primitives:826-832`, `:1045-1055`) — lives in
  `docs/transition-primitives.md` and `BACKLOG.md:258` and nowhere in `design/`.
  Home: `design/05` §3 ladder + §5.
- **M-18 — The segment-length band is declared-and-unenforced**
  (`authoring-frictions:1258-1266`, Deviation 2). The band widened to 2–40 with
  `SEGMENT_BEYOND_PLAN_BAND` demoted to a warning; the RFC said *"if the owner
  reads the widening as a design change rather than a format correction, §5 is
  the item to hold."* Nothing was held and nothing landed. See S-5.
- **M-19 — Three engine-contract residuals and one generalisation, unledgered**
  (`engine-request-contract:912-916`). Rows 2 and 4 became D70/D71; rows **1, 3
  and 5 exist nowhere**: `capabilities.engines` omits `stockfish-play`;
  `#theoryStrict`/`#practicalResistance` request MultiPV **above the advertised
  max** — *"the contract failing on its own terms one line away from where it is
  being enforced"*; and Maia advertises `SelfElo`/`OppoElo` which nothing in the
  repo has ever set or measured (an R5-shaped probe would settle it). Plus the
  generalisation from row 4 — *"a summary sentence whose evidence rows cannot
  support it — worth a sweep beyond this panel"* — an honesty pattern, not one
  defect.
- **M-20 (borderline) — The collapse/fold doctrine is doc- and ledger-only**
  (`branch-set-scale`): decidedness-does-the-work-ranking-was-asked-to-do; the
  shortfall rule (*"under `save`/`resist` the tablebase ground collapses nothing,
  ever"*, `:406-408`); *"no engine evaluation, at any depth, with any threshold,
  ever collapses a branch"* (`:249-252`); collapsed ≠ folded (`:745-760`); and a
  normative banned lexicon (`:499-504`). Ledger-absorbed (`BACKLOG.md:285`,
  `:287`) and canonical in `docs/branch-set-scale.md`, but `design/03` §Review
  says nothing and `BACKLOG.md:330` still says *"Do not build either until
  ruled."* Listed last because the ledger does carry it.

**Consciously OMITTED, correctly:** `expression-census`'s coverage-vs-
satisfiability machinery → `docs/expression-census.md`; `validator-integrity`'s
grading-vs-grounding split → `docs/drill-pack-format.md`; `deviation-classes`'
multi-value rendering contract and join-key refusal → `docs/drill-pack-format.md`
+ `docs/drill-client.md`; `opening-evidence-path`'s sidecar trio and 14 refusal
codes → `docs/engine-grounding.md`; `tempo-vocabulary`'s evaluator algorithm →
`docs/drill-pack-format.md:43-47`; `engine-request-contract`'s handshake
mechanics → `docs/engine-workers.md:50-71`.

### 2. Un-flipped ledger rows

| Row | File:line | Why it should have moved |
|---|---|---|
| **D29, D30, D31** | `BACKLOG.md:157-159` | Still `🔨 shipped by authoring-frictions`, header glyph still 🐞, on an implemented and archived RFC whose §12/criterion 13 required the flip. Verified shipped: `schemas/drill_pack.schema.json` `rules_fact` enum has `draw`; `packages/runtime/src/outcome.ts:14`; `apps/server/src/sourcing/openings.ts:93` |
| **D65, D71** | `BACKLOG.md:121`, `:117` | `🔨 owned by engine-request-contract`, an archived RFC. Both fixed: `apps/server/src/engine-supervisor.ts:95` now parses the full option contract and `engine-band.ts` consumes min/max/default; `apps/web/src/lib/outcome-presentation.ts:74-82` renders the applied band. (D71 is also owner-orphaned — the RFC text never mentions it) |
| **D58, D59** | `BACKLOG.md:131`, `:132` | Still `💡 open`; closed in code — `engine-band.ts:74` (`requested ?? profile.default`) ends band inheritance; `opponent-selector.ts:525-526,535-541` widens MultiPV to the legal-move count and records the residual as `offWindow: true` |
| **Plan-drill objective friction** | `BACKLOG.md:199` | Still says *"only feature-level vocabulary (Q4b) is missing."* `predicate-wave-3:1644-1649` declares this *"now false in an instructive way — the vocabulary was never missing, the **binding** was"*; criterion 18 required the binding half flipped in the landing commit |
| **Trajectory-format frictions** | `BACKLOG.md:243` | Still 💡 with three gaps. `authoring-frictions` §5 shipped per-leg `branchLengthTarget`; `validator-integrity:716-719` says the row is *"down to two fields, not three"* |
| **Authored explanation vocabulary** | `BACKLOG.md:360` | Still names *"the timing move-set"* among three contracts that *"genuinely lack a pin"*; `tempo-vocabulary:1375-1378` discharges that clause |
| **R4 answered: decidedness…** | `BACKLOG.md:266` | `resistance-spectrum` §8 asked for an amendment — the row *"reads as though the variant is ready to build; it is the right variant and it is not yet buildable."* Unamended |
| **Branch ranking for pruning** | `BACKLOG.md:330` | Still 💡 and *"Do not build either until ruled"*, while its sibling `:285` is ✅ — `branch-set-scale` shipped the pruning-as-management half. Related: `:204` still asks design to ratify a comparison ceiling of 8 that `MAX_COMPARISON_BRANCHES` now fixes |

### 3. Stale design assertions

- **S-23 — `design/01:84` and `:118`.** *"**Hold** — preserve a draw against
  strong or perfect resistance"* / Outcome Drill *"vs exact/human resistance"* —
  a two-valued spectrum. `resistance-spectrum:880-885` names these two lines
  exactly; a third, difficulty-seeking answer now ships. Filed as a ledger row
  only (`BACKLOG.md:321`).
- **S-24 — `design/03:49`.** *"perfect, strong, practical, **annoying, or
  fallible** policies."* `resistance-spectrum:163`: *"'Fallible' is not a missing
  mode, and it must not become one"* — `human_common` **is** the human-choice
  policy and "annoying" **is** `practical_resistance`. `BACKLOG.md:321` records
  the restatement; `design/03` still promises two names that will never exist.
  (Same row as forward-delta finding A4, reached from the other direction.)
- **S-25 — `design/04:309-311`.** §7 still lists the **tempo contract** among
  four things that *"cannot be designed without real packs"*, in the superseded
  `planMoves`/`opponentArrival`/luxury vocabulary. `tempo-vocabulary:198`
  replaced the object outright — *"a timing window is not a pair of events, it is
  a ledger kept between two events"* — at pack 0.17, removing the point-pair form.
- **S-26 — `design/04:228`.** *"one timing window where the tempo contract
  bites"* per opening root. `tempo-vocabulary:1401-1406`: §8.2 authors three in
  one pack and the format permits eight — *"an owner ruling, raised not taken."*
  Sharper at `:109-113`: `:228` and the shipped corpus are *"in direct
  disagreement, and the corpus is right until this is fixed"* — 18 of 18 opening
  packs declare no window.
- **S-27 — `design/01:25`, `design/01:117`, `design/00:149`.** *"branches run
  8–20 plies"* / Plan Drill *"8–20-ply segment"* / on-ramp *"2–8 plies."*
  `authoring-frictions` §5 widened the format band to 2–40 and demoted the Plan
  number to a warning. Neither doc carries a note (see M-18).
- **S-28 — `planning/exploration/gates.md:70` (K7).** Still *"**timing is not
  encodable at all** (§4, two independent attestations, 0/135 usage)."*
  `tempo-vocabulary:1383-1384` puts a remedy on record, and `gates.md:84` (E3)
  *was* updated in the same window — **the two gate rows now disagree inside one
  file.**

### 4. Defect-ledger integrity

**77 defect rows, 77 unique ids** (D1–D74 plus D12a/b/c). **No duplicates.**
Counted as written: **45 resolved / 32 open**; after the verified corrections
below, **≈52 closed / 25 open**. Caveat for anyone scripting this: the table
mixes two conventions — D1–D28 put ✅/⛔ in the **id** cell, while D32–D40 keep 🐞
in the id cell and put ✅ in the **status** cell. Any single-convention count is
off by 8 or by 37.

**Closures narrower than they read — the D54 pattern, and it does repeat:**

- **D35 (`BACKLOG.md:152`) — do not flip as-is.** `engine-request-contract`
  criterion 2 says "D35 closed", but the row names *two* causes and only one
  landed: `resetSearchState: true` (`opponent-selector.ts:453,558`) sends
  `ucinewgame` + `Clear Hash`, closing the hash-carryover half, while
  `go movetime ${this.#strongEngineMovetimeMs}` is still there (`:451`, `:556`) —
  so `strong_engine` remains wall-clock dependent and is **not** a pure function
  of position and mode. Flip only with an explicit "movetime residual" note.
- **D66 (`BACKLOG.md:122`) — cannot be confirmed closed.** The RFC claims closure
  "as a side effect of the state obligation". The literal defect is unchanged:
  `engine-supervisor.ts:390` still sends `afterCommands` only after a successful
  await, and the `finally` at `:402-404` only removes the abort listener. The
  *consequence* is arguably neutralised because every consumer now sets MultiPV
  per request (`evidence-queue.ts:338`, `opponent-selector.ts:506,554`), but the
  restore path itself is unverified. Restate as "consequence closed, restore path
  unchanged".
- **D28 (`BACKLOG.md:242`) — half-closed, and never flipped.** Row still reads
  `🐞 found 2026-08-14` while `planning/roadmap-to-done.md:15` records it shipped.
  First remedy landed: outcome objectives now fall through to automatic
  win/draw/loss rules (`pack-orchestrator.ts:450-480`). Second did not:
  `OBJECTIVE_GRADES_NOTHING` fires only when
  `PLAN_OBJECTIVES.has(objective.type)` (`pack-validation.ts:421-423`), so a
  grading-free **outcome** leg still is not a load refusal.

**A ✅ that is not a closure — and it is hiding in a rendering bug:**

- **D69 (`BACKLOG.md:119`) is a 4-cell row in a 3-column table.** It renders as
  `✅ **RULED 2026-08-15…**`, i.e. as closed, while the trailing `found
  2026-08-15` cell is dropped. **The fix has not landed:**
  `packages/runtime/src/practical-difficulty.ts:17` still reads
  `FLOAT32_POLICY_MASS_TOLERANCE = 32 * 2 ** -23`, unchanged. Should read
  `💡 open (ruled, unimplemented)`.
- **D54 (`BACKLOG.md:133`) has the identical 4-cell defect** — and it is the row
  that documents the narrower-than-it-reads problem. Its "NARROWER THAN IT READS"
  correction sits in the dropped 4th cell.
- **D15 (`:184`) breaks into 6 cells** from unescaped pipes inside a code span
  (`` `human_common | strong_engine | …` ``) and renders as garbage; D19 (`:182`)
  escapes them correctly. **D16 (`:183`) has only 2 cells** — no status column.

**Owner references — all resolve, but four point at finished work:**

- Every `🔨 owned by X` names a real RFC. But `D73`, `D74` (`:114`, `:115`) name
  **`engine-request-contract`, an archived RFC, for work that has not started**:
  D73's own text conditions closure on "once R10's range is configured", the
  owner ruled `[1000, 2400]` (`:116`, commit `23a28d4`), and
  `grep -rn "2400" apps/server/src apps/web/src packages/*/src` returns nothing —
  `application.ts:218` sets only `bandOption: "Elo"`, so the effective band is
  still the advertised `[0, 5000]`, which is exactly D70's counterexample
  (accepts 50, rejects 9000). `schemas/drill_run.schema.json:197` is still bare
  `{"type": "integer"}`. **No archived RFC can own unstarted work** — D60, D70,
  D73, D74 need a live owner.
- **D28 is filed outside the defect ledger** (`:242`, inside the "Trajectory-format
  frictions" table under Authoring-format friction), so it is invisible to any
  sweep of the defect table at `:114-189`.

**Verified clean (closure claim matches code):** D56 · D45/D41/D42
(`MAX_COMPARISON_BRANCHES = 8` used both sides) · D37 · D39 · D40 · D38 · D32 ·
D33 · D34 · D36 · D49 (correctly withdrawn) · D26 · D25 · D22 · D24 · D21 · D20 ·
D17 · D18 · D14 · D12a · D11 · D10 · D8 · D7 · D6 · D4.
**Unverifiable from code** (prose- or ruling-only closures, stated as such rather
than guessed): D5, D13, D12b, D12c, D16, D27, D23.

### 5. Checked and found clean

- **The 2026-08-14 open escalation is discharged**: cursed-win / blessed-loss now
  has design-tier text at `design/01:104-110`, written by the owner's ruling in
  `c21ad35`. `authoring-frictions` Deviations 3 and 4 are the model case for this
  delta.
- The owner's general principle from `tempo-vocabulary:27-30` — *"authored
  contexts declare; unauthored contexts default"* — is absorbed twice
  (`BACKLOG.md:289`; `design/06-campaign.md:114-115` as campaign law 4).
- R4's decidedness reframe (`resistance-spectrum:80-82`) is absorbed into
  `design/06-campaign.md:56-73`, `:75-91` and `BACKLOG.md:266`/`:268`.
- `expression-census`'s three proposed rows all landed (`BACKLOG.md:428`, `:427`,
  `:133`); its census numbers reproduce unchanged.
- `transition-primitives` criterion 14 fully honoured (`BACKLOG.md:258` ✅,
  `:255`, `:224`, `:274` ✅, `:276` correctly left open).
- `deviation-classes` (`:202`, `:251`, `:252`, `:288` landed; `:201`, `:277`
  correctly open) and `opening-evidence-path` (`:250`, `:155`, `:248`, `:288`)
  both flipped cleanly.
- `validator-integrity`: D32/D33/D37/D38/D39/D40 all ✅ at `BACKLOG.md:148-155`.
- Docs-tier obligations honoured: `docs/drill-client.md:71-78` replaced the
  sentence `tempo-vocabulary:1348-1350` declared false; `docs/engine-workers.md:50-71`
  carries the five-obligation contract; `docs/branch-set-scale.md:9,21` carries
  the shortfall rule and the shared cap.

### Gate status

**Both lists are non-empty and untriaged.** Reverse side: 7 MISSING concepts, 8
un-flipped ledger rows, 6 stale design assertions, and 11 defect-ledger integrity
items. Done is not declared. Every design-tier fix is a **report for the owner**
(law 5); `design/`, `rfc/README.md`, `apps/` and `packages/` were not edited.

**Process observation.** The 2026-08-14 process fix worked: making the ledger
flip part of the *implementing* commit caught ten of eleven RFCs. The one that
escaped, `engine-request-contract`, is also the one with no log entry — so the
cheapest remaining guard is to require a `planning/exploration/log.md` entry
before an RFC may be archived, since that is the step whose absence perfectly
predicted the flow-back failure this wave.
