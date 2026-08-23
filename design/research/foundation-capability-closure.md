# Evidence foundation capability closure — current HEAD

**Question.** After the tactical, breadth and partial semantic waves, does Tabiya have the
primitive foundation required by the 1.0 vision—and which missing pieces are collectors versus
source adapters, consumers, workflow composition or longitudinal storage?

**Verdict.** `[V]` The reusable chess-fact foundation is now broad enough that the original
"geometric census" description is false as a current inventory: the compiled manifest reports
**35 producers / 188 projections / 25 core consumers / 210 core bindings**, plus **67 semantic
events / 67 eligibility rows / 15 reasons / 1 selection policy**. The 17 absent families in the
2026-08-22 Phase-1 matrix have mostly become typed exact or declared-convention operands. The
foundation is nevertheless **not closed for 1.0**, because the chain stops at different tiers:
two semantic promotion projections remain unregistered; exact all-role legal mobility, runtime
opening identity and the multi-source Review packet are drafts; non-mate 2–3-ply threat/
prophylaxis semantics remain a research gap; learner-module reduction is returned to its author;
presets have only a foundation checkpoint; bot profiles and persistence are incomplete; and no
longitudinal observation store can yet turn per-game facts into habits. `[V]`
(`make evidence-manifest-check semantic-evidence-check`, 2026-08-23;
`packages/runtime/src/evidence-catalog.ts`; `rfc/README.md`;
`planning/evidence-foundation-ux/plan.md`)

This is a **closure control**, not a new ontology brainstorm. It re-derives the requested 1.0
families from production symbols and records the exact tier where each stops. “A detector exists”
does not mean a learner module can select it; “a module id exists” does not mean a workflow can
render it; and neither permits a habit or player-type claim without an opportunity denominator and
longitudinal evidence.

## 1. Method and closure states

The audit starts with the owner examples and the D717 Phase-1 list, then joins each family through:

`rules/source → versioned projection → exactness/abstention → semantic event → module eligibility
→ preset/workflow → Review/bot/theory consumer → longitudinal reader`.

`[V]` Production identities were checked in `packages/runtime/src/evidence-catalog.ts`; mechanics
in `structure.ts`, `tactics.ts`, `castling.ts`, `exchange.ts`, `square-control.ts`, `mobility.ts`,
`pawn-dynamics.ts`, `king-state.ts` and `semantic-tactics.ts`; consumer foundations in
`module-contract.ts` and `presets.ts`; and lifecycle state in the active RFC headers/register.

The table uses four closure states:

- **SHIPPED** — production mechanics and manifest projection compile now.
- **PARTIAL** — some exact operands ship, but a named 1.0 consequence or source join does not.
- **DRAFTED/BLOCKED** — research is complete and an RFC owns the missing production work.
- **RESEARCH GAP** — no accepted semantics may be implemented yet.

An inspector-only projection is mechanically shipped but **not learner-closed**. A later module
must still choose timing, initiative, form, answer ceiling, selection and honest-empty behavior.

## 2. Primitive closure matrix

| Family the product must understand | Grounded primitive at HEAD | Producer state | Learner/product state | Remaining boundary |
|---|---|---|---|---|
| Board occupancy, legal checks/captures, terminal state | chessops rules plus typed transition events | **SHIPPED** | usable as atoms and machine conditions | none at the rules layer |
| Touch/hover legal destinations for every piece | `rules.mobility.reading.piece_destinations@1` mixes exact B/N/R/Q legality with `local-non-losing@1` | **DRAFTED** exact `rules.mobility.reading.legal_moves@1` | requested-sight binding waits on Learner Modules | unify the runtime/web/server move authority and preserve castling, en-passant and four promotion identities (`rfc/exact-legal-mobility.md`; D904/D1022) |
| Attacks, defences, changed squares and slider rays | structural/transition readings plus identity-retaining square-control events | **SHIPPED** | raw inspector exists; module selection incomplete | never rename counts as importance or future threat |
| Loose/hanging and trapped pieces | `loose_piece@1`, avoided loose-piece event, `trapped@1`, legal exchange | **SHIPPED** | intended for pre/post-commit modules, not yet production-bound | trapped means locally trapped, not “lost”; poisoned captures and deeper defence stay outside (`rfc/tactical-collectors.md` §2.3) |
| Pins, skewers and X-rays | `ray_classification@1`: absolute/relative pin, skewer, x-ray attack/defence | **SHIPPED** | inspector/module inputs | geometry does not prove that the motif matters |
| Fork/double attack | meaningful double-attack event plus reply breadth / `fork_survives_reply@1` | **SHIPPED** | ordinary event available; all-reply consequence intentionally rare | retain a defusing reply rather than calling every fork forced (`design/research/bounded-reply-semantics.md` §§1–3) |
| Discovered attack and the fianchetto-screen example | `discovered_latency@1`, `discovered_executed@1`, and `harassment_pressure@1` preserve slider/screen/target identities | **SHIPPED** | available as exact configuration/consequence operands | observed order proves neither intent nor best play (`packages/runtime/src/evidence-catalog.ts`; D728) |
| Pawn topology | isolated/doubled/backward/passed, files, pawn islands, connected pairs, support chains | **SHIPPED** | structure/theory/module inputs; global raw dump remains disallowed | value words such as “weak” need cited theory or authored truth |
| Pawn dynamics and promotion pressure | contacts/locks, passer creation, protected/connected passers, candidate-majority, contact timing, harassment, promotion availability | **SHIPPED** | phase-aware module eligibility incomplete | a pawn relation is not a plan or conversion verdict |
| Promotion race outcome | race geometry and Syzygy join functions exist | **PARTIAL: 12/14 Wave-C projections compile** | no module may consume the two missing ids | promotion geometry input closure and live-or-recorded Syzygy absence semantics remain D963 (`rfc/semantic-collectors.md` §§3.7/A) |
| Space, centre and flanks | `space@1`: pawn-controlled enemy-half squares split a–c/d–e/f–h | **SHIPPED convention** | inspector operand; selection/presentation incomplete | it is not activity, territory quality or advice (`evidence-catalog.ts`, `BREADTH_CONVENTION_TEXT`) |
| Square denial / “the pawn keeps the knight off g4” | exact pseudo/legal controllers and legal/local-exchange destination delta | **SHIPPED operands** | excellent requested overlay; rejected as a default announcement | “prevents,” “stops the plan” or “prophylaxis” needs a declared counterfactual/policy or cited theory (`legal-square-denial.md`) |
| Development, rook on seventh, files and activity | `development@1`, `rook_on_seventh@1`, open/half-open file occupancy | **SHIPPED** | module inputs, with value withheld | “good rook,” “bad bishop” and “active” are theory/value claims, not missing arithmetic |
| Castling and king state | rights, rights-lost cause, legality issues, castled event, shelter/escape/zone attackers and defenders | **SHIPPED** | Support/Review inputs after module completion | no atom may render “king unsafe,” attack quality or mating net (`decomposed-king-state.md`) |
| Trades and material imbalance | exact capture, legal-exchange class, immediate trade, material-role signature/asymmetry | **SHIPPED** | Review/bot inputs | no recommendation or compensation claim without engine/theory/author authority |
| Immediate threats and defensive replies | `threat@1`, check, mate-in-one and complete `reply_breadth@1` | **SHIPPED at one-reply horizon** | supports threat radar / explainable bot miss after module binding | generic threats are background; one reply does not prove a multi-ply plan |
| Defender removal, deflection, attraction/decoy, clearance, interference, zwischenzug, overload | exact duty set/conflict plus observed identity-retaining consequence events | **SHIPPED in Wave C's first 12 projections** | research/inspector-only until literal module amendment | authored corpus lacks witnesses for several observed families; content waits on stable module contracts (`semantic-collectors.md` D1/D4) |
| Mating nets | exact complete legal-tree proof through four attacker moves with cap/abstention | **SHIPPED** | Review/module binding incomplete | five-plus remains a capped bucket; never infer from king-zone counts (`basic-semantic-tactics-stage-0.md` §10) |
| Non-mate 2–3-ply targets, move prevention and prophylaxis | one-reply breadth/refutations plus bot candidate vectors are prerequisites | **RESEARCH GAP** | no honest learner or bot explanation yet | name target, policy, horizon, counterfactual and causal comparison; current D558 bundled row supplies no executable owner |
| Opening/ECO/current theory identity | build-time CC0 records exist; exact current endpoint/path/deepest-reached semantics measured | **DRAFTED** | no runtime breadcrumb/Review/profile identity yet | independent review + implementation of `rfc/runtime-opening-identity.md`; “out of book” remains deliberately undefined |
| Cited plans/theory such as “strike at the centre” or “bad bishop” | authored shapes/principles and typed applicability are the permitted join | **PARTIAL** | runtime builder not authorized | O5 must approve the deterministic allow-listed offline knowledge builder; no runtime scraper, embeddings authority or LLM applicability (`theory-knowledge-pipeline.md`) |
| Engine grades, WDL/mate timeline and Game Review evidence | Stockfish/Syzygy producers ship; typed cp/mate/WDL contracts are measured | **DRAFTED compiler** | Story currently lacks the multi-source join and destroys mate type | review compiler owns versioned engine provenance, filtered payload and partial nine-family packet; final moment ranking remains D928 |
| Human evidence | Maia policy/candidate WDL and Lichess explorer population/position stats | **SHIPPED** | inspector/opponent consumers exist; learner modules incomplete | probability is not objective quality or explanation |
| Bot personality and human-like play | composed candidate vector, sampler, guard, repertoire/trait stack and deterministic decision record | **PARTIAL implementation** | no production profiles and no persisted policy record | D969 depth-8 guard amendment, D970 `[1000,1400,1800,2200]` roster ruling, then the migration behind longitudinal store (`rfc/bot-policy.md`) |
| Per-game Review observations | 67 semantic event identities and exact run anchors | **SHIPPED evidence layer** | no finished Review Map compiler/selector | finish Review packet, module reducers and re-entry-oriented ranking—not an engine dump |
| Habits, skills and player style | measured candidate metrics and proof tiers exist | **BLOCKED storage** | no habit card/type can honestly render | `longitudinal-store.md` D1011 must be author-corrected and implemented; continuous habit cards precede any named type |
| Player personalities/archetypes | clustering experiment failed its stability gate | **REFUSED as measured truth** | playful authored quiz remains possible if explicitly labelled | do not turn unstable clusters or LLM prose into a diagnostic type (`player-style-metrics.md`) |

`[V]` The statuses above are derived from current producer files and the active RFC headers listed
in `rfc/README.md`; the semantic count and projection reach are checked by the manifest commands
named in the verdict. Rows that distinguish atoms from judgement follow the evidence ladder in
`middlegame-evidence-and-style-taxonomy.md` §2 and law 8.

## 3. The actual closure stack

| Tier | Current truth | Consequence |
|---|---|---|
| Producer/manifest | 35 producers, 188 projections; Waves A/B complete, Wave C 12/14 | broad factual substrate exists |
| Semantic selection | 67 event/eligibility rows, but the historic production wall is not fully crossed | facts can be ranked experimentally; learner selection is unfinished |
| Learner modules | thirteen-field compiler checkpoint ships; reducer semantics are returned under D1017 | no honest production registry/packet may be improvised |
| Presets/workflows | five preset and eight context vocabularies ship as a foundation checkpoint | exact nine-field config projections/clamps and UX remain blocked by D971 |
| Play composition | accepted RFC exists, but depends on module/preset truth | raw evidence must not be rearranged into another dump |
| Review | source producers exist; typed multi-source packet is draft | Chess.com-like ritual and summary remain product work, with re-entry as the differentiator |
| Bots | policy compiler/selection checkpoints exist | profiles, validation and persistence remain before a learner can choose a personality |
| Longitudinal | research and RFC exist, no store | no cross-game habits, opening tendencies, skills or grounded tips yet |
| Theory | authored claims/shapes exist; deterministic builder posture researched | source-backed strategy language remains unavailable until O5 + F4 |

`[V]` (`packages/runtime/src/module-contract.ts`; `packages/runtime/src/presets.ts`;
`rfc/{learner-modules,intent-presets,review-evidence-compiler,bot-policy,longitudinal-store}.md`)

The main architectural finding is therefore unchanged but now more precise: **the product no
longer lacks “the classifier.” It lacks closure across independently correct tiers.** Adding more
raw detectors before closing selection/modules/presets would worsen the visible dump. Closing UX
without the remaining exact source adapters would hard-code around absent evidence. The order must
remain bottom-up.

## 4. Newly isolated research residue

The original D558 row bundled every semantic absence. Most of that list is now false at HEAD.
One important residue remains both real and unowned as an executable research question:

> Given a named target or threat and a declared opponent policy, can a bounded 2–3-ply query prove
> that the candidate move removes, worsens or preserves the opponent continuation—without calling
> low reply breadth “forcing,” inventing intent, or silently switching from Maia/human likelihood to
> Stockfish best play?

`[V]` One-reply work is not enough: the fixed measurement found same-threat survival on only
1/675 authored and 0/545 imported played decisions, while all-reply fork survival was 0/10 and
2/29 (`bounded-reply-semantics.md` §3). The exact pawn-square-denial event is useful for hover but
near-neutral at 1.00×/1.02× and explicitly cannot say “prevented” (`legal-square-denial.md` §§2–4).
The bot stack now supplies candidate/policy vocabulary that did not exist when those studies ran,
so the next research arm can be concrete rather than a generic depth search.

This is the only new collector-level research wave exposed by the closure audit. “Bad bishop,”
“weak square,” “good trade,” “kingside attack” and named plans are not five missing board loops;
they are consumer joins from existing exact operands to cited theory, engine outcome, authored
truth or a bounded policy. Treating them as local classifiers would repeat the geometry-to-meaning
error that the evidence contract was created to stop.

## 5. Executable order from this audit

1. Finish and register Semantic Collectors' promotion pair; this completes the declared Wave-C
   producer boundary.
2. Accept then implement exact legal mobility, runtime opening identity and the Review evidence
   compiler after their independent reviews.
3. Repair Learner Modules' reducer contract, then implement literal Wave-C eligibility and module
   packets. Do not substitute top-N truncation.
4. Amend and finish exact preset config/clamp compilation, then Play Composition can render one
   board-protecting experience per workflow.
5. Correct and implement the longitudinal store; then finish bot persistence/profiles and only
   afterwards build habit/skills readers.
6. If O5 is approved, draft the offline theory knowledge-builder RFC and connect cited theory to
   exact applicability sets.
7. Run the newly isolated bounded-policy/prevention research before any RFC for 2–3-ply threat,
   prophylaxis or “what did this move stop?” language.
8. Only after these contracts and Gate F pass should authored pack expansion resume.

This order permits parallel review and drafting, but it does not permit a later tier to invent the
unfinished semantics of an earlier one.

## 6. Limits

- `[V]` This audit proves symbol/contract/lifecycle reach, not learner usefulness. R3/R7 owner-use
  gates remain the UX validation mechanism.
- `[V]` “Shipped” in the matrix means the producer/projection compiles, not that every event has an
  authored pack witness; Semantic Collectors D4 records the largest witness debt.
- `[M]` Chess has no finite useful-concept ontology. The 1.0 foundation should be judged by whether
  new concepts can compose from versioned atoms without schema churn, not by pretending every
  strategic noun is a local classifier.
- `[V]` No claim here authorizes content expansion; D560/Gate F remains active.
