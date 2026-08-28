# RFC: Bot policy

- **Status:** **draft — independently returned 2026-08-28 on [[D1970]], [[D1971]], [[D1972]],
  [[D1973]], [[D1974]], [[D1975]] and [[D1976]].** The
  D1601–D1609 author amendment preserves the right layer/card/route direction, but it still forks
  the shared Maia/Stockfish provider boundary, calls a bounded Maia page legal-complete, reopens
  sealed authorities as free persisted strings, lacks a post-provider event-head compare-and-swap,
  conflates deterministic policy bytes with request/timing bytes, promises a fallback after the
  only base distribution fails, and duplicates the shared candidate-packet pipeline in Stage B.
  Implementation remains unauthorised pending author repair and fresh review. Claims 0.18/migration
  remain held; no production/schema byte changed in the review. *(Prior checkpoints: implementing;
  accepted 2026-08-22; draft; D1601–D1609 author-amended.)*
- **Author:** claude (drafted on the D717 program routing, `planning/evidence-foundation-ux/plan.md`
  Phase 6; executes the completed dependency map
  `planning/platform-alignment/bot-policy/f8-dependency-map.md`)
- **Created:** 2026-08-22
- **Design refs:** `design/00-thesis.md` (the product premise names the opponent: *"a
  human-like opponent while truly applying an opening/middlegame/endgame"*; and the
  instrument doctrine *"Stockfish validates, Maia predicts, the corpus witnesses — none of
  them can teach why"*); `design/03-product-breadth.md` §Just Play (*"start a normal game,
  choose a side/position/opponent"*) and §Surface map Settings row (*"opponent/rating"*).
  The bot lane has no dedicated design-tier section; its intent authority is the owner
  ideation recorded as [[D810]]–[[D812]] and the **O8 owner ruling of 2026-08-22**
  (`planning/platform-alignment/bot-policy/o8-handoff.md`, quoted in §0 below). A `design/`
  bot section is owner work under law 5 and is not written by this RFC.
- **Exploration gate:** opened by the owner ruling of 2026-08-12 (gate transition,
  `planning/exploration/log.md`); commissioned by the D717 program Phase 6. The dependency
  map's drafting prerequisite — *"F8 drafting starts after the tactical and breadth
  collector contracts land"* — is met at drafting HEAD: `rfc/tactical-collectors.md` is
  **implementing** and `rfc/breadth-collectors.md` is **accepted** (both 2026-08-22), so
  this RFC composes the shared evidence vocabulary instead of inventing bot-only detectors.
- **Depends on:** implemented `archive/evidence-contract-manifest.md` (F1 — the
  `opponent.selection@1` consumer boundary and the three admitted provider projections) and
  `archive/opponent-contracts.md` (the mode-scope disposition precedent). **Stage B of §4
  depends on `tactical-collectors.md` and `breadth-collectors.md` landing** (the
  [[D813]] candidate-evidence adapter consumes their literal shipped ids); Stage A does
  not. The migration claim is ordered behind `longitudinal-store.md` (draft) per the
  register; if that draft withdraws, this claim renegotiates in the register rather than
  renumbering. No file collision with any active draft (verified at HEAD:
  `assistance-control-wiring` touches `packages/runtime/src/assistance.ts` and the run
  controller; `play-composition` touches web layout; `learner-modules`,
  `semantic-collectors`, `longitudinal-store`, `measurement-records`,
  `pack-population-provenance`, `learner-rating`, `graduation-clearance`,
  `portable-account-data` touch none of §3's files). One shared file exists after the
  cross-review added the §4.1 run seam: `apps/web/src/lib/session-controller.ts` is also
  touched by `assistance-control-wiring` — in disjoint members (`#selectionRequest` here,
  the reveal wrapper there), so landing order stays free, but the coordination is named
  rather than asserted away.
- **Parent / amends:** extends the shipped opponent selector
  (`apps/server/src/opponent-selector.ts`) and capability contract
  (`apps/server/src/capabilities.ts`); replaces no shipped mode and redefines no shipped
  identity.
- **Supersedes / superseded by:** —
- **Planning:** `planning/bot-policy/` (once implementing)

```tabiya-claims
run-schema | lane 0.18 | OpponentSelection.policy (packages/runtime/src/types.ts:102 OpponentSelection gains an optional typed policy-decision record; opponent.move_selected payload widens)
migration | position behind longitudinal-store | stamp-only frozen-literal run-schema stamp "0.17"->"0.18" in apps/server/src/storage.ts; no table, no data rewrite
```

**Why these two claims and nothing else, verified at HEAD.** The register heads at drafting
HEAD are pack 0.27 (0.28/0.29 live-claimed), run **0.17** (`DRILL_RUN_SCHEMA_VERSION`,
`packages/schema/src/index.ts:1`; no live claim), shape-entry 0.3, principle-entry 0.1,
migration **24** (`STORAGE_VERSION`, `apps/server/src/storage.ts:476`; live claims:
`learner-rating` ×2 `position next`, `longitudinal-store` `position behind
learner-rating`), evidence-kinds 7 members. This RFC widens the **persisted**
`opponent.move_selected` event payload (`packages/runtime/src/types.ts:171`) by an optional
`OpponentSelection.policy` object — the exact shape-class that moved run 0.14→0.15
(migration 20, `SelectionCandidate.offWindow`) and 0.16→0.17 (migration 23,
`orderingBasis`), both stamp-only. The same 0.18 lane also covers §4.1's run seam: the
persisted `run.started` `opponentPolicy` payload (`RunOpponentPolicy`,
`packages/runtime/src/types.ts:69`) widens by the same optional `profile` triple — one
version bump, two payloads; the register row's parenthetical gains that clause in the next
register-touching commit (acceptance), stated here rather than edited now so the C3
byte-join between this block and `rfc/README.md` stays intact. So: one run-schema lane,
one stamp-only migration position, frozen literals per the migration-4/9 freeze lesson.
The downstream seam is now explicit rather than empty: `bot-roster.md` declares the instances and
`opponent-experience.md` consumes the capability/card/identity projections, while neither claims a
second copy of the persisted policy record. `longitudinal-store` still ingests learner-actor
evidence only. The atomic operation's request/root/receipt fields are part of the same
`OpponentSelection.policy` record and 0.18 lane; no additional shared-resource claim is introduced
by the amendment. **Everything else is
deliberately claim-free**: the policy/layer/profile definitions are **catalog-local
versioned declarations, not a storage table** (§1 argues this — the [[D473]] decision the
drafting order asked for); the three new evidence projections are additive `@1` identities
in `packages/runtime/src/evidence-catalog.ts` (the F2/tactical precedent: *"new `@1`
identities — no version bumps"*); **no pack lane** (packs keep their existing
`opponentPolicy`; a pack-side profile reference is a named future RFC, §Open questions);
no shape-entry, principle-entry, or evidence-kinds member. The register row for this
draft's claims is added to `rfc/README.md` **in the registration commit**, per the
register instruction that the row and the draft ride together.

## Summary

This RFC specifies the **F8 opponent-policy stack**: one composable, versioned policy
compiler over the shipped human-policy base model, replacing nothing. It ships (Stage A)
the O8-ruled three-profile roster — **Human baseline / Guarded human / Pawn-heavy** — as
named compositions of separately versioned layers, executed by a **server-side seeded
sampler over the reconstructed full-vector Maia distribution** (the [[D823]] decision,
mechanism 1 of the dependency map §4); a **typed, persisted policy-decision record** on
every composed selection (the [[D818]]/[[D822]] explainable pick — the differentiator the
research pass verified has *no prior art anywhere in the field*); and **calibration as the
acceptance gate for every strength label** (the [[D819]] plan concretized: D333-harness
ladder arms under [[D341]] seeding rules plus a distribution acceptance test — never
mean-Elo alone). Stage B adds the **candidate-evidence adapter** ([[D813]]) that features
every candidate with the literal tactical/breadth collector ids once those RFCs land — the
one registry, two consumers architecture ([[D551]]/[[D810]]/[[D893]]): bot policy and
learner guidance consume the same registered projections, and neither owns or receives the
other's prose. A bot policy is never a learner module.

**2026-08-26 production-safety amendment.** The installed catalog and pure composer are not a
production bot path. The amendment replaces three false authorities before any roster is allowed
to register: a bare per-candidate loss becomes one sealed whole-candidate guard receipt; caller
trait strings become a registered legal-board trait view; and the two-request browser round trip
becomes one server-owned, run-bound select-and-append operation. It also replaces free behavior
copy with a source-bearing card compiler and makes release-concurrency latency/calibration receipts
completion obligations. The detailed clauses below are normative over the earlier checkpoints.

## Motivation

**The problem.** Tabiya ships a credible human-move base model and five useful opponent
modes, not a bot system. The HEAD audit (dependency map §1, all verified at the symbol)
found: the request cannot represent a policy stack ([[D821]] —
`SelectorPolicy`/`parseSelectMoveRequest` at `apps/server/src/opponent-selector.ts:49,145`
admit only `mode`, `policyConfigDigest`, `targetElo`, `temperature`, `topP` and reject
unknown fields); the persisted selection records provider candidates, not the composed
decision ([[D822]] — `OpponentSelection` at `packages/runtime/src/types.ts:102` has no
layer/profile/feature/contribution/fallback/calibration record); and generation is not
seed-reproducible ([[D823]] — `human_common` returns Maia's internal unseeded `bestmove`
with `seedHonored: false`; the branch seed only separates cache keys,
`selectionCacheKey` at `opponent-selector.ts:219`).

**Why this shape.** The measured foundations are quoted in §0. The one-sentence version:
raw Maia banding is a weak dial (29–40 real Elo per 100 band points, [[D335]]/[[D336]]),
so the policy layers are what make an honest ladder possible — and every layer must be
declared, versioned, measured, and recorded, because the field's failure mode (opaque
curators, eval-buried personas, unvalidated Elo labels) is documented vendor by vendor in
`design/research/human-like-opponents.md`.

**Out of scope, by ruling.** The O8 consequence clause is the scope boundary: *"It may not
invent more personality traits, build bot tournaments, write a repertoire, or couple
persona text to move choice without a registered policy layer."* Additionally out:
campaign integration (composition still last per [[D717]]; campaign *"may later select an
admitted profile, but it must not define bot semantics"* — dependency map §5); the
bot-tournament envelope ([[D708]], O12/F11 — though §6's record is designed so that
envelope can later *"record exact entrant policy IDs+versions and route every game into
Review"* without new selector work); time-usage modelling ([[D820]], deferred — new
corpus/model work); the style-measurement lane (D552/R12 — same feature vocabulary,
opposite direction, wall in §8); pack-side profile references; any `design/` edit (law 5).

## §0 — The ruled constraints, quoted

These are rulings and recorded findings. This RFC executes them; it does not re-derive
them, and an implementer who finds the spec diverging from a quote in this section treats
the quote as authoritative and returns the RFC.

**O8.1 (owner, 2026-08-22)** — one composable policy stack:

> ```text
> HumanPolicyModel
>   → RepertoirePolicy? (exact key; explicit fallthrough)
>   → ErrorGuard? (declared engine/threshold/effect)
>   → ControlledTrait[] (measured transform only)
>   → MemoryPolicy? (off until measured)
>   → recorded selection
>
> PresentationPersona (name/avatar/voice/bio) reads the policy declaration
> but never changes moves unless a layer above declares how.
> ```
> Every layer declares inputs, transform/version, fallback, measured strength delta, trait
> metric and abstention. Bot policy and learner guidance may consume the same registered
> facts, but neither owns or receives the other's prose.

**O8.2** — the honest 1.0 roster: **Human baseline** (production Maia sampler at a
selected supported band; no curator), **Guarded human** (same plus disclosed 250 cp
severe-error curator), **Pawn-heavy** (guarded plus the measured pawn ×4 transform). The
UI separates **controlled traits** (policy intentionally changes and measurement confirms)
from **observed traits** (computed after games, descriptive only) from **presentation**
(voice/avatar/story, no chess-policy claim). *"Do not label a 1.0 bot aggressive, solid,
tactical, positional, tricky, adaptive or 'plays like X' unless a later transform clears
its declared policy and owner-use gates."*

**O8.3** — repertoire and memory: interfaces in F8, **no shipped repertoire persona or
adaptive memory** until a real immutable book reaches declared coverage and a multi-game
experiment demonstrates the behavior. Cross-game memory is *"opt-in, exportable/deletable
learner data under O13/F12, never a hidden difficulty adjustment."*

**O8.4** — strength and disclosure: present the selector as a **human-policy band**, not
"this bot is 1800." *"Calibrate outcome strength for each composed profile independently; a
trait transform cannot inherit the base model's label by assumption."*

**O8.5** — validation posture: the validated 42-branch blind packet is the owner-use
instrument; owner use validates the roster but *"does not become a population claim."*
H5/C5 remain unmet as population claims and nothing here claims otherwise.

**The recorded findings the handoff preserved** (R11, `design/research/bot-policy.md`,
verified at the symbol where repo-mechanical):

- *Raw displayed mass is not the played distribution.* Maia's `policy` info field is raw
  legal-masked softmax; `bestmove` is sampled from logits/temperature then top-p
  truncated, defaults temperature 0.8 / top-p 0.92 (`opponent-selector.ts:79-80`).
  Reconstructing `softmax(logits/0.8)` as `p^(1/0.8)` with the cumulative `≤ 0.92`
  rule forcing top-1 predicts 19.84 cp expected depth-12 loss and 0.39% severe mass
  against a captured production sample of 19.57 cp / 0.36% — agreement **0.27 cp /
  0.03 pp**. The raw vector predicts 59.13 cp / 1.20%. Production must *"transform inside
  the full-vector model adapter, not reinterpret a truncated display payload."*
- *A bounded Stockfish error guard is an explicit information advantage* and must be
  declared as such; a hidden guard is refused (R11 refusal list).
- *Pawn-heavy behavior is measured* (pawn ×4 after guard: +11.97 pp pawn rate, −1.01 cp
  loss shift, 98.8% explorer-match retention — passes); *forcing/quiet labels were not
  established* (×3: +3.02 pp and +2.24 pp; ×8 forcing still +5.94 pp — all below the
  10 pp trait gate; no post-hoc multiplier promoted).
- *Strength, repertoire, style transform, error character, timing, memory, and
  presentation voice are separate layers*; *controlled traits ≠ observed traits ≠
  decorative personality* — three different claims with three different proof obligations.
- *No fake promises*: nothing advertised that isn't measured — "human-like",
  "aggressive", a repertoire, memory included.
- *Bot tournaments record exact policy ids/versions and route every game into Review*
  ([[D708]]).

**The measured foundations:** [[D335]]/[[D336]] — raw Maia banding buys 29–40 real Elo
per 100 band points, transfer ratio 0.289 [0.269, 0.309] over the corpus (0.400 at full
material, ~0.07 below ten pieces): the declared `[1000, 2400]` range is a ~290-Elo ladder
with about **five learner-distinguishable rungs**. The Maia endgame conversion gap —
88.1–91.9% of won tablebase-critical endgames converted (`maia-endgame-fidelity.md`) —
demands an eventual engine floor in simple endings (§2.7 states honestly what v1 does and
does not do about it). [[D814]] — SEE verified absent from the tree; `fork_created`
measured 0.72× on geometry alone, so material eligibility is the prerequisite of every
honest blunder gate and blind-spot persona; Wave A's `rules.exchange.predicate.legal_exchange@1`
is the shipped answer. [[D816]] — engine-priced choice breadth is admitted as an
**opponent-only** distribution projection (Spearman 0.524/0.514/0.556 by band against
severe human mass; near-best breadth −0.486/−0.481/−0.589; best/second gap weaker at
0.312–0.395; the 35-cell middlegame cut does **not** hold at 0.181 and no endgame cells
are covered — carry distribution/budget/completeness, abstain on a capped vector, and the
grading refusal at `capabilities.ts:124` stands). [[D817]] — multi-band Maia disagreement
is a **measured refusal** (Pearson 0.021–0.044, sign agreement 47.2–52.0% against real
human band movement); runtime multi-band queries are excluded. [[D818]] — the explainable
pick record, verified as having **no prior art**. [[D819]] — the calibration plan: D333
harness, ~500–800 games/arm for ±25 Elo, a distribution acceptance test, never mean-Elo
alone. [[D820]] — time usage deferred; **no fake delays** (random delays are the
uniform-noise mistake in the time domain). [[D888]] — band-split solitaire is a
learner-private *format* per [[D843]] and does not reopen D817's runtime refusal (§8).

## Specification

### §1 — Policy definitions are a catalog, not a table (the claims decision)

**Decision: layer and profile definitions are catalog-local versioned declarations in
code — a new `apps/server/src/bot-policy-catalog.ts` — not rows in a storage table. No
table is created; no migration exists for definitions.**

The argument, since the drafting order asked for one:

1. **Nothing authors them at runtime.** The O8 roster is closed at three profiles; layers
   are measured artifacts (a trait multiplier is inseparable from the dossier that
   measured it). Every stored-definition precedent in this repo (packs, shapes,
   repertoires) exists because *users author instances*; v1 bot profiles are shipped
   artifacts like the evidence catalog's 93 projections — which are catalog-local and
   registered in no schema register.
2. **A table would buy obligations without buyers.** A `bot_profiles` table joins the
   account-deletion/export surface (`portable-account-data` at HEAD enumerates durable
   data exhaustively), demands a migration position in a three-deep queue, and creates a
   second authority for a fact the selection record already persists per use (§6: every
   composed selection embeds profile id + version + RFC-8785 digest). Replay reads the
   event log, never a definitions table — the same projection-not-source rule
   `longitudinal-store` is built on.
3. **Versioning is already solved in the catalog idiom.** A profile edit is a new
   version; an old selection's record names the version and digest it was played under.
   Immutability by construction, no `__legacy` retention question.
4. **The exit is named.** If a later surface lets users compose profiles (a real
   possibility under [[D893]]'s build-your-coach loop), *that* RFC creates the table,
   claims its migration, and registers user compositions — the definitions become
   learner data at the moment a learner authors one, and not before.

Each **layer declaration** carries: stable `id@version`; kind (one of §2's seven); exact
inputs (provider projections and/or registered evidence ids — literal ids, no forecasts);
transform/mask parameters; abstention conditions and fallback behavior; whether it changes
strength; and its measured output metric with dossier source ids. It carries no caller-authored
behavior sentence. A closed card renderer maps registered layer/measurement/absence identities to
source-bearing statements; decorative identity is a separate closed owner-authored registry (§2.8,
§7). Each **profile declaration** is a named composition: base
model reference (engine id, modelId, band), sampler (`id@version`, temperature, top-p,
completeness threshold), ordered layer references, presentation reference, and a compiled
**profile digest**: RFC-8785 SHA-256 over the canonical composition, same `sha256:` grammar
as `DIGEST_PATTERN` (`opponent-selector.ts:81`).

### §2 — The layer stack: seven kinds, separately versioned

The stack is O8.1's, verbatim in order. Per-kind contracts:

**§2.1 `HumanPolicyModel`** — model identity (engine id, `modelId`, `containerDigest`
from `SelectionEngineIdentity`), supported band range (validated via `appliedTargetElo`,
`apps/server/src/engine-band.ts`), history capability (full-history; the shipped Maia is
history-conditioned — a recorded fact on the model declaration, not an option), and the
**complete-vector requirement**: the model adapter must return the raw policy vector at
full legal width (`legalMoveCount`, `opponent-selector.ts:251`; the request already asks
for `max(8, legalMoveCount)` at `:575`), with the returned raw-mass sum recorded as the
**completeness statistic**. Measured floor on the pinned image at MultiPV-20: median
0.999625, minimum 0.979540. The band is a policy parameter, **never** presented as
achieved Elo (O8.4, [[D344]]).

**§2.2 Sampler** — `sampler.maia_reconstruction@1`: reconstruct
`softmax(logits/T)` from raw mass as `p^(1/T)`, apply the pinned cumulative `≤ topP`
rule forcing top-1, renormalize. Parameters (T, topP, completeness threshold — default
0.97, below the measured minimum) are part of the profile, not the request. Parameter
domains are compiled, not assumed: **T > 0** (`p^(1/T)` is undefined at zero, and
Temperature 0 is already refused doctrine — *"a modal opponent is a different product"*,
`capabilities.ts:144`) and **topP ∈ (0, 1]**; a sampler declaration outside its domain
fails compilation (an A2 fixture). The truncation ordering is pinned too: candidates sort
by descending reconstructed mass with **equal-mass ties ordered by `neutralTiebreak`**, so
membership at the cumulative `≤ topP` boundary can never depend on provider emission
order — the same rule §4.2 applies to the draw. The §0
positive control (0.27 cp / 0.03 pp) is this layer's permanent conformance fixture
(criterion A4). The draw itself is §4's, not the model's.

**§2.3 `RepertoirePolicy`** — **interface only in v1; no instance ships.** Contract:
named immutable book identity, position/transposition key (`transposeKey`, already
exported from `@chess-tabiya/runtime` and used by the spine index at
`opponent-selector.ts:389`), declared covered depth, adherence rule, and **visible
fallthrough** recorded per move in §6's record. The measured ground for shipping nothing:
both candidate repertoire arms fell off on 57/72 controlled plies (79.2%) against a 25%
preregistered ceiling — *"a drill spine is authored consequence content, not an opponent
repertoire; a root-conditioned book through ply 24 is an opening layer with explicit
fallthrough, not a general continuation policy."* Opening-book work remains sacrificial
research under D560/Gate F (O8.3).

**§2.4 `ErrorGuard`** — `guard.severe_error@1` consumes exactly one sealed
`stockfish-guard@1` candidate-set receipt. The request binds root FEN, full-history digest, side to
move, canonical exact candidate set, Stockfish 18, Threads 1, Hash 16, cleared game state,
`MultiPV = candidateCount`, exact `searchmoves`, depth 8, root-side score perspective, final-only
typed rows and elapsed time. Candidate loss is derived inside the receipt only; no production input
admits `guardLossCp` or an equivalent caller number.

The receipt compiler and consumer abstain the **whole guard** on provider unavailability, the
500-ms guard opportunity deadline, candidate-set mismatch, illegal/extra/duplicate/missing rows,
bounded rows, mixed cp/mate domains, an all-mate/non-cp domain, a forged seal, or root/history
mismatch. `empty_after_mask` is also a whole-guard abstention. Every abstention passes the unchanged
normalized Maia distribution onward and is recorded. On one exact cp domain, the guard masks every
candidate whose `bestCp - candidateCp` is at least 250 cp. The depth-8 population measured 100%
severe-mass removal, 1.36 cp expected-loss strengthening and 100.21% explorer-match retention.

The guard is an explicit information advantage, but disclosure is compiled rather than authored:
the card renderer maps the registered guard/request/measurement ids to engine, depth, threshold,
abstention and scope statements (§7). A free `disclosure` sentence is not an authority and cannot
enter the card.

**§2.5 `ControlledTrait[]`** — `trait.<name>@version` references a closed versioned classifier id
and a measured multiplier. Stage A's registry contains exactly `pawn_move@1 → pawn_move`; the
classifier accepts only `(root position, exact legal move set)`, canonicalizes through the runtime
legal-board boundary and returns a sealed trait view. Ordinary pawn moves, captures and promotions
are positives; castling and non-pawn moves are hard negatives. Caller-provided `traits: string[]`
and free classifier strings are not production inputs. The compiler asserts set-equality between
registered classifier outputs and catalogued trait values and refuses an unregistered classifier.

Registration still requires R11's predeclared trait gate per trait: ≥10-point declared-trait
change, ≤35 cp expected-loss shift, ≤1-point rise in ≥250 cp mass, and ≥90% relative explorer-match
retention. v1 registers exactly `trait.pawn_preference@1` (pawn ×4, +12.28 percentage points at
depth 8) and declares `dependsOn: "error_guard"`. It runs only when that guard applied. Any guard
abstention records a dependent-trait abstention and preserves the unchanged Maia distribution;
there is no unguarded pawn-forward fallback. Forcing ×3 and quiet ×3 remain permanent negative
fixtures. Salience-shaped traits remain blocked on [[D815]] rather than approximated (Discharges
D2).

**§2.6 `MemoryPolicy`** — interface reserved, **off**; the type exists so the composition
grammar is closed, and no instance can register (a registration attempt is a negative
fixture). Any future instance is a separate RFC carrying O8.3's opt-in/exportable/
deletable obligations.

**§2.7 Timing** — **there is no timing layer, deliberately** ([[D820]]/O8). Selections
return when computed; the compiler refuses any layer declaring a delay effect. What v1
says about the endgame instead of pretending: the profile card inherits the mode-scope
resistance measurement already published (`HUMAN_COMMON_RESISTANCE_PROFILE`,
`capabilities.ts:54-64`) and the band-transfer limitation (~0.07 below ten pieces); a
**tablebase/engine floor in simple endings is a named future layer**
(`guard.endgame_floor`, unregistered), not shipped, because the O8.2 roster is closed and
the layer's effect is unmeasured — the R11 population stops at ply 20, so even the 250 cp
guard's endgame effect is a stated unknown on the card, not a claim.

**§2.8 `PresentationPersona`** — a closed owner-authored identity asset: name, avatar and
chess-neutral decorative tagline. It can never alter moves and is excluded from family-policy
equality. It supplies no “how this opponent plays” prose; every chess-bearing card statement comes
from §7's compiler. Observed-trait narration is a later, separately grounded projection and cannot
be smuggled into this display registry.

### §3 — The compiler

One compilation path, from the dependency map §3 verbatim:

```text
admitted provider candidate set
  → sealed stockfish-guard@1 whole-set receipt                                         [guarded families]
  → sealed registered legal-board trait view                                           [trait families]
  → candidate evidence adapter (same registered collectors, evaluated on each child)   [Stage B]
  → optional declared repertoire prior                                                 [interface only]
  → optional declared error guard
  → zero-or-more measured trait transforms whose declared dependencies applied
  → seeded sampler over the resulting complete distribution
  → typed selection derivation + persisted opponent.move_selected
```

Compile-time failures (each a fixture): two layers claiming the same authority (two
guards; two samplers; a trait and a guard both declaring the mask effect on the same
basis); a transform requiring a complete vector composed with a provider window that can
cap (the profile must then declare the degraded path); a guard without the registered
`stockfish-guard@1` request identity; a trait without a registered classifier, a cited passing
measurement or its required guard dependency (§2.5); any layer with a delay effect (§2.7);
a `MemoryPolicy` instance (§2.6); **any layer declaring a learner-derived input** (§8's
wall — the input vocabulary is closed to provider projections and registered
position-evidence ids, and learner history, style vectors, ratings, and run records of
the current learner are not in it, so the wall is a type error, not a review note).
The vocabulary closes over **provenance, not only names**: every layer *parameter* is a
literal whose provenance is the cited measurement dossier over the declared population
corpus (§2.5's gate), so a weight computed from any learner's data outside the compiler
and passed in as a bare constant is inadmissible the moment its citation is checked — a
per-learner number has no population dossier to cite. A9's census inspects parameter
citations, not only input ids.
A layer may abstain without erasing the base distribution (O8.1); every abstention is
recorded in §6's record with its reason. The production composer accepts the Maia vector plus sealed
receipt/view types only. A structurally similar plain object, bare loss number or trait string fails
at the runtime seal boundary, not merely in TypeScript.

**Identity discipline** (dependency map §3): the request's existing `policyConfigDigest`
is the run session digest and **is not relabeled** as the stack identity. The run carries
both: session identity for replay, and the compiled profile id/version/digest for the bot
decision.

### §4 — The selector at runtime

**§4.1 Run identity and the only production operation ([[D821]]/[[D1605]]).**
`RunOpponentPolicy` gains one optional exact profile reference:

```ts
readonly profile?: { readonly id: string; readonly version: number; readonly digest: string };
```

It is valid only with `human_common`, mutually exclusive with `targetElo`, `temperature` and
`topP`, digest-validated against the compiled catalog at run creation, persisted in `run.started`,
read exactly on resume and never upgraded to “latest.” Historical runs carry none and infer none.
The existing `SelectorPolicy.profile` parser and profile-aware cache key remain useful internal
validation seams, but public `/select-move` is **not** the production authority for profile play.

Production uses one server-owned atomic operation:

```text
POST /runs/:runId/opponent-ply
{ expectedNodeId, requestId } + authenticated writer/lease identity
```

The browser supplies no FEN, history, seed, policy/profile, candidate evidence or selected move.
Under one writer lease and cursor check, the server derives the current root/history/seed/exact
profile digest; acquires the Maia vector; compiles the sealed guard receipt and registered trait
view; composes and samples; appends the selected move plus policy record; and saves the run. A stale
`expectedNodeId` refuses before selection is committed. `requestId` is idempotent: a retry of a
successful operation returns the same committed event, while reuse against a different node or
writer fails.

This operation replaces the shipped two-step
`POST /select-move → browser selection bytes → POST /runs/:id/moves` path for opponent play; that
path remains only for explicitly separate evidence/diagnostic consumers until D233 removes or
narrows it. Prediction, human-split and analysis consumers continue to read raw Maia and never
inherit a persona transform. Grouped branches call the same server-owned core through their
group-specific wrapper.

**§4.2 The seeded draw ([[D823]], mechanism 1).** Inside the atomic operation the selector
requests the full-width raw vector exactly as `#humanCommon` does today; verifies the
completeness statistic against the profile threshold; acquires the guard sequentially over that
exact admitted candidate set; runs §3's compiled pipeline over the
reconstructed distribution; and draws with the **branch seed** via the existing
deterministic primitives (`unitInterval`/`sampleWeighted`, `opponent-selector.ts:347-365`,
keyed on the request's history hash). The recorded engine identity keeps Maia's identity
fields and sets **`seedHonored: true`** — the seed is honored by the server sampler; the
model's internal sample is discarded. Basis-equal candidates order by the position-pure
`neutralTiebreak` (`:207-217`), never insertion order. **By-record determinism** (the R5
finding — byte-identical reproducibility is the property the whole instrument chain rests
on): the same (startFen, historyUci, seed, profile id/version/digest, model identity)
reproduce the same selection and the same §6 record, byte-identically (criterion A3).
Scope, stated so A3 cannot be misread: the seeded draw exists **only on the composed
path**. Profile-less `human_common` keeps playing Maia's internal unseeded sample
(`seedHonored: false` — R5 measured that `bestmove` repeat-stable on only 34.3% of keys
while the policy vector is bit-stable 105/105,
`design/research/maia-policy-scalar-stability.md`), and `practical_resistance` keeps its
bit-stable scalar basis; both ship unchanged (§8). This RFC **inherits, rather than
silently fixing,** the unseeded sample everywhere a profile does not own the draw — replay
and the event log remain the repeatability instrument there, exactly as today.

**§4.3 Degradation and availability are recorded, never silent.** If the raw vector fails the
completeness threshold, the base model fails, or the model omits mass, the composed stack does not
apply: the selector falls back only through the already-declared Maia/base-mode behavior and §6
records `applied: false`, the exact reason and `seedHonored: false`. If the optional guard is
unavailable, incomplete, late or otherwise abstains, baseline human-policy play remains available;
guarded and pawn-forward execute the unchanged Maia distribution with both guard and dependent
trait abstentions recorded. Runtime fallback never silently advertises an applied guard.

Release availability is stricter than one-move fallback: if the exact release-concurrency benchmark
crosses §4.5's intervention boundary or cannot produce complete guard receipts, guarded and
pawn-forward profiles are unavailable in the roster capability until a matching provider receipt
clears. Baseline Play remains available. A card and in-run identity surface render the live
availability/degraded state from the same record rather than rewriting it as persona behavior.

**§4.4 Candidate generation.** The [[D810]] candidate set is the union the owner named —
Maia policy mass ∪ book/explorer frequency ∪ engine multipv — realized in v1 as: the
full-width Maia vector is the candidate universe (it is legal-complete by construction);
the guard's engine probe prices it; the repertoire prior (when an instance ever
registers) reweights within it; explorer frequency enters only through layers that
declare it (none in v1 — the statistical book measured itself out, §2.3). The set is
**complete or explicitly truncated** — completeness is a recorded statistic, and any
transform requiring completeness abstains on a capped window (dependency map §2).

**§4.5 Combined selection budget.** Acquisition is sequential because the measured guard set is
the Maia-admitted vector. The predeclared release operating contract is: combined p95 ≤400 ms is
healthy; p95 >500 ms, or any incomplete/late receipt in the fixed release benchmark, is an
intervention; and the optional guard has a 500-ms opportunity deadline measured from selection
start. The committed D969 population (p50 209.085, p95 286.796, max 499.1 ms on one host) justifies
the depth-8 choice and these author thresholds, but is not a portable performance guarantee. The
exact atomic production route must benchmark total/Maia/guard/composition durations under expected
release concurrency before guarded profiles register. Deadline records `deadline_exceeded`; it
never turns into an unguarded trait or hides baseline Play.

### §5 — Candidate featuring: Stage A without [[D813]], Stage B with it

**[[D813]] — the candidate-evidence adapter — is named as the dependency it is.** Every
producer in F1 describes the position or the played move; nothing features a candidate
not yet played. The adapter is the missing producer class: it applies **the same
registered collectors** — the literal ids shipped by `tactical-collectors` (30, e.g.
`rules.exchange.predicate.legal_exchange@1`, `rules.tactic.event.fork_allowed@1`,
`rules.tactic.consequence.threat@1`, `rules.tactic.consequence.reply_breadth@1`) and
`breadth-collectors` (18, e.g. `rules.mobility.reading.piece_destinations@1`,
`rules.pawn.event.dynamics@1`, `rules.king.reading.zone_state@1`) — to each child
position of each candidate, one legal move + one evaluation per candidate. **No duplicate
tactic code** (the D717 program rule): the adapter consumes collector ids; it implements
no detector.

**Stage A (this RFC's shippable core) does not wait for it.** The v1 roster needs exactly
three per-candidate facts, none of which is a collector: raw/reconstructed Maia mass
(provider), fixed-bound Stockfish loss (provider — the guard), and the pawn-move
predicate (pure board arithmetic on the UCI move). The roster, the record, the seam, and
the calibration gate all land Stage A. **What v1 ships if D813 lags is therefore stated,
not implied: the three O8.2 profiles with position-level and provider-level features
only — no feature-weighted persona beyond `trait.pawn_preference@1`, no blind-spot
persona, no salience anything.**

**Stage B (blocked on 2c+2d landing)** ships the adapter as a typed producer
(`derived.opponent.candidate_feature_vector@1`, § below) and opens trait registration to
classifiers over registered ids — each still individually gated by §2.5. The Stage-B
prototype is free before the producer is built: the committed R11 capture corpus (837
position-band cells, three bands, MultiPV-20) already supports offline featuring with
zero engine calls (`human-like-opponents.md` §9.1).

**Evidence-catalog additions (all additive `@1`, no register claim):**

| id | role | binding | content |
|---|---|---|---|
| `derived.opponent.choice_breadth@1` | reading | `→ opponent.selection` **only** | the [[D816]] admission: candidate-loss distribution or named sufficient statistics + engine identity/depth/budget + legal-set completeness + score frame + raw threshold/window parameters (never a prose label); abstains on a capped vector |
| `derived.opponent.candidate_feature_vector@1` | reading | `→ opponent.selection` only (Stage B) | per-candidate rows of registered-collector results, each naming its literal source id |
| `derived.opponent.policy_decision@1` | source_record | `opponent.selection` + the Review successor | §6's persisted record, re-projected for rendering |

The refusal at `capabilities.ts:124` — *"Move verdicts are not condition measurements"* —
**stands unchanged**: these bindings are the F1 exact-binding design doing exactly what it
was built for, adding an opponent-side consumer *without widening the grading boundary*.
Multi-band Maia queries are **not** a projection here and never will be on current
evidence ([[D817]]).

### §6 — The explainable pick record ([[D818]]/[[D822]])

`OpponentSelection` gains one optional object (run schema 0.17→0.18; absent on every
historical selection and **never inferred** — the migration-5 precedent):

```ts
readonly policy?: {
  readonly profileId: string;
  readonly profileVersion: number;
  readonly profileDigest: string;          // sha256:… over the canonical composition
  readonly samplerId: string;              // "sampler.maia_reconstruction@1"
  readonly applied: boolean;               // false = degraded path, §4.3
  readonly degradedReason?: string;
  readonly completeness: number;           // raw returned mass sum
  readonly seed: number;
  readonly requestId: string;               // atomic-operation idempotency identity
  readonly rootIdentity: string;            // binds active node/root/history receipt
  readonly guardReceipt?: {
    readonly requestProfileId: "stockfish-guard@1";
    readonly engineId: string;
    readonly candidateSetDigest: string;
    readonly historyDigest: string;
    readonly elapsedMs: number;
    readonly outcome: "applied" | "abstained";
    readonly reason?: string;
  };
  readonly traitView?: {
    readonly registryVersion: 1;
    readonly classifierIds: readonly string[];
    readonly candidateSetDigest: string;
  };
  readonly layers: readonly {
    readonly id: string;                   // "guard.severe_error@1", "trait.pawn_preference@1", …
    readonly action: "applied" | "abstained" | "fallthrough";
    readonly reason?: string;              // abstention/fallthrough reason
    readonly parameters?: Readonly<Record<string, number | string>>;
  }[];
  readonly considered: readonly {
    readonly moveUci: string;              // joins SelectionCandidate rows by moveUci
    readonly rawMass?: number;
    readonly sampledMass?: number;         // after sampler reconstruction
    readonly finalMass?: number;           // after guard + traits, renormalized
    readonly guardLossCp?: number;         // derived from the sealed receipt, never caller input
    readonly features?: readonly {         // Stage B; each names its literal id
      readonly id: string;                 // e.g. "rules.tactic.event.fork_allowed@1"
      readonly value: string | number | boolean;
    }[];
  }[];
  readonly chosenFinalMass?: number;
};
```

The persisted record is a projection of the sealed inputs, not the seals themselves. Its root,
history and candidate-set digests must match the operation that appended it. The storage/parser
surface accepts no independent `guardLossCp`, classifier or profile claim from the browser.

**What this buys, and the law-8 line.** *"It missed your fork because the knight had just
moved"* — or in v1's honest vocabulary, *"the fork candidate carried 0.03 of the policy's
final mass; the band policy, not the guard, put it there"* — becomes a **read-back of the
recorded selection**, rendered downstream by a registered renderer (the Review successor,
[[D928]]'s lane — out of this RFC's scope, enabled by this record). The explanation of a
bot's miss renders recorded selection facts about **the bot's own decision** — a dashboard
of the bot, which is the legal side of the ADR-0005 line; nothing in the record grades,
measures, or mentions the learner. **Privacy note, stated because the asymmetry matters:
the record exposes the bot's policy, not the learner's data.** It contains no learner
identifier beyond the run linkage every selection already has; exposing it to the run's
viewers is exposing our own shipped artifact. (Its size is bounded by the candidate window
the selection already retains; `considered` rows join the existing `candidates` array by
`moveUci` rather than duplicating rank/cp/wdl.)

This is also [[D708]]'s prerequisite paid forward: a future tournament envelope records
*"exact entrant policy IDs+versions"* by reading `profileId`/`profileVersion`/
`profileDigest` off every game's selections — no new selector work.

### §7 — Calibration is the acceptance gate for every strength label ([[D819]])

**The label rule, normative: a bot's stated Elo is a measured claim with its measurement cited, or
it is not stated.** A closed card compiler accepts only a compiled profile, the live provider/
availability projection and an optional calibration receipt for that exact digest. It accepts no
caller sentence or presentation `bio`. Registered renderers emit source-bearing statements for the
Maia band/model, sampler, guard engine/depth/threshold and every abstention family, the pawn trait's
guard dependency/multiplier/+12.28-point measurement, no book, no cross-game memory, endgame scope,
clock/time-control scope, availability and calibration/absence. It never translates 250 cp into a
motif such as “hanging piece,” never calls a Maia sample the plurality move, and never claims the
guard always runs.

The card shows a strength number **only** when a calibration record exists for that exact profile
digest, and then always with its citation (harness, date, games, CI, time control). The calibrated
value is stored separately from `targetElo` and **only the calibrated value may ever feed a rating
update** ([[D344]], extended to profiles). A profile whose composition or identity changes loses
its calibration until re-measured. Decorative name/avatar/tagline render in a separate slot and
reach none of the behavior statements.

**The ladder.** Reuse `tools/d333-band-outcome-harness/` (committed; reproduction per
`design/research/maia-band-outcome-transfer.md` §Reproduction): paired openings, colour
swap inside pairs, cluster-robust CIs. **Arms**: each shipped profile at each exposed band
× the measured raw-band ladder as the interim relative anchor. **[[D341]]'s seeding rules
are mandatory**: explicit distinct seed per worker, odd worker count, count distinct move
lists, and *"treat a zero-variance control as a defect rather than a result."* **Size**:
95% CI ≈ ±500–700/√n Elo per arm → **~500–800 games per arm for ±25 Elo**. **Every label
is time-control scoped** (maia1's own rating spans ~230 Elo across time controls against
the same human pool).

**The distribution acceptance test — never mean-Elo alone.** Mean-Elo equality is
necessary, not sufficient (skill is an error *distribution*: Regan–Haworth's (s, c)
decomposition; Chabris's format-scaled GM blunder base rates of 5.02/6.85/7.63 per 1,000
moves). Per arm, the acceptance instrument compares the eval-loss histogram and
blunder-rate-by-magnitude profile against band-binned human reference games — the R11
instrument already computes exactly these quantities (expected loss, ≥250 cp mass,
explorer match). An arm passes calibration only when both the interval and the
predeclared distribution bounds hold; the bounds are predeclared in the calibration
plan document **before** the run reads results (the R11 discipline).

**The anchor question is left open where it is honest to.** The interim anchor is the
measured internal band ladder — relative strength with the [[D344]] caveat attached
(published external maia-bot ratings are argmax bots; our sampler differs, so they do not
transfer). A **human-scale** anchor — Chessiverse-pattern anchor accounts earning real
ratings, or learner-derived Glicko fed calibrated opponent values only ([[D365]]) — is a
cost/policy decision this RFC cannot settle internally; it is Open question 1 and
Discharges D4, owner-owned. Until it is ruled, no profile card states an absolute human
Elo — the band-relative calibrated figure and its citation are the ceiling of what may be
shown. This is deliberate: *"no widely-used weakened-bot Elo label has ever been
validated against humans by its author"* — the honest gap between us and that industry
norm is the product surface, not a footnote.

### §8 — The mode seam, the dispositions, and the wall

**Extension, not replacement.** The five shipped modes (`human_common`, `strong_engine`,
`theory_strict`, `perfect_tablebase`, `practical_resistance`) keep their exact semantics;
a profile is an optional refinement of `human_common` (§4.1). `availableModes` and mode
validation are untouched; `/capabilities` gains `policyProfiles.human_common.profiles`:
the registered profiles with id/version/digest, grounded compiled card, controlled-trait list,
live provider availability and calibration state (`calibrated` with citation | `uncalibrated`).
The catalogue projection is server-authored and ordered; the client declares no parallel family
enum. The unimplemented
modes (`plan_defense`, `human_external`) stay declared-unimplemented.

**Capability dispositions extend per the [[D370]] precedent — mode-scope, never
per-move** (`HUMAN_COMMON_RESISTANCE_PROFILE` is the shape). New rows in
`CAPABILITY_DISPOSITIONS` (`capabilities.ts:120`), all passing
`assertAdvertisedCapabilityDispositions` (`:162`):

| instrument | capability | disposition | reason |
|---|---|---|---|
| Maia | raw policy vector as server sampling basis | reached | reconstructed production sampler, positive-control-gated (§2.2); recorded at mode/profile scope |
| Maia | server-side seeded profile sampling | reached | branch seed honored by the server draw; `seedHonored: true` on composed selections |
| Stockfish | fixed-bound loss as a declared opponent error guard | reached | `guard.severe_error@1`, disclosed on the profile card; consumed by `opponent.selection` only |
| Maia | multi-band runtime queries | refused | [[D817]] measured refusal: Pearson 0.021–0.044 against human band movement |
| — | artificial move delay | refused | [[D820]]: no fake timing; a timing layer requires clock-accepting model/corpus work |

**The wall between style measurement and persona policy ([[D843]]), normative.** One
declared feature vocabulary, two consumers with **asymmetric proof obligations and
opposite directions**: a persona is a *policy* (controlled-trait gate, R11) that shapes
the **bot's** move; a style reading is a *measurement* (stability gate, R12) about the
**learner's** play. They are never joined at runtime: no learner analysis — history,
style vector, rating, habit card, current-run learner moves as *learner* data — is an
admissible layer input (§3 closes the input vocabulary, so this is a compile error), and
no selector weight ever grades a learner or feeds the style lane. R12's 35/36
re-identification result makes the style vector privacy-critical; the wall protects both
directions. [[D888]]'s band-split solitaire ("which band plays this move?") is a
learner-private prediction *format* under [[D843]] — it reads committed captures, not the
runtime selector, and does not reopen [[D817]].

### §9 — What this RFC refuses, at mechanism level

1. **Weakened-Stockfish sampling** — the doctrine's named rejection, refused here for the
   *mechanism* the research established: weakening an engine **misplaces the error**. The
   error menu is the engine's own candidate list, error size is bounded eval-noise within
   a ~1-pawn window rather than a heavy tail, and error placement is uncorrelated with
   human difficulty — depth-limited Stockfish matches *stronger* humans better than
   weaker ones at every depth. The disposition already ships
   (`capabilities.ts:128`: *"Weakened Stockfish is rejected doctrine"*) and this RFC adds
   no path around it; the R11 blind packet keeps weakened Stockfish only as its
   **negative control**.
2. **Fake human-likeness claims** — no profile, card, or persona text may claim
   "human-like", coherence, or plan quality; H5/C5 are unmet as population claims and
   owner use cannot clear them (O8.5). Nothing is advertised that isn't measured.
3. **Personality prose ungrounded in a controlled trait** — §2.8; the refused vocabulary
   is O8.2's list, closed in v1.
4. **Any policy input from learner analysis** — §8's wall, enforced as a type error and a
   census criterion (A9).
5. **A repertoire persona and cross-game memory** — measured out (79.2% fallback) and
   ruled out (O8.3) respectively; interfaces only.
6. **Multi-band runtime queries** ([[D817]]) and **salience-shaped error before the
   [[D815]] measurement** — both measured/gated refusals, §2.5 and §8.
7. **Fake delays** ([[D820]]) — §2.7.
8. **Relabeling `policyConfigDigest` as the stack identity** — §3's identity discipline.

### §10 — Implementation surface

The production-boundary census is operational rather than a hand-counted file total. All twelve
operations below must have one named non-test symbol and one positive/negative fixture; a parser or
declaration does not count as consumption:

| # | operation | required production home |
|---|---|---|
| 1 | run create stores exact profile reference | run/session validation + run schema 0.18 |
| 2 | resume resolves the same digest, never latest | run service/storage projection |
| 3 | client invokes only run id/writer/expected node/request id | web API + session controller |
| 4 | server derives FEN/history/seed/profile | `RunService` atomic opponent operation |
| 5 | Maia returns the admitted human-policy vector | `OpponentSelector` internal acquisition |
| 6 | `stockfish-guard@1` compiles a sealed receipt | supervised engine request + guard receipt module |
| 7 | registered legal-board classifier compiles a sealed trait view | bot-trait registry/adapter |
| 8 | non-test composer consumes both seals | selector/service composition path |
| 9 | move and decision append atomically/idempotently | service/storage event append |
| 10 | `OpponentSelection.policy` survives persistence/replay | runtime types/schema/migration |
| 11 | roster capability reads compiled profile + provider state | server capability projection |
| 12 | card projection reads the same profile/receipts | registered bot-card compiler |

`apps/server/src/rest.ts` owns the run-bound route and must stop accepting selection bytes for this
path. Public `/select-move` remains a separately dispositioned diagnostic/evidence route; it is not
counted above. `packages/runtime/src/evidence-catalog.ts` and
`apps/server/src/evidence-manifest.ts` carry §5's registered read-back projections. Named validation
and docs sites include the capability/manifest fixtures, run-schema scaffold, provider-off/deadline
fixtures, `docs/bot-policy.md`, `docs/engine-workers.md` and the full release journey. Stage B adds
the D813 candidate-evidence adapter without widening the atomic authority.

## Deviations from design

None. `design/03-product-breadth.md`'s Just Play opponent choice and Settings surface are
extended, not altered; the "human-policy band, not Elo" presentation is the O8.4 ruling,
not a divergence. The absence of a design-tier bot section is recorded in the header;
this RFC proposes no design-doc text (law 5).

## Acceptance criteria

Each criterion names its failure mode; none can pass while measuring nothing ([[D444]]/
[[D451]] — the able-to-fail fixtures are part of the criterion).

- **A1 — exact run identity.** Create rejects a bad digest or a profile combined with request
  overrides; valid create/resume preserves the exact triple; historical runs infer none. *Fails if*
  resume resolves latest or the browser can replace the profile per move.
- **A2 — one atomic production route.** A non-test fixture executes create → server-derived Maia →
  guard/trait → compose → append under one lease/cursor check. The browser request contains only
  run/writer identity, expected node and request id. Stale-node, wrong-writer and reused-request/
  different-node arms refuse; retry of a success returns the same event. *Fails if* `/select-move`
  selection bytes cross the browser on the profile path or if the parser/catalog is the only caller.
- **A3 — sealed guard authority.** Positive, provider-off, deadline, missing, duplicate,
  mixed-domain, all-mate, bounded, wrong-history, wrong-root, candidate-set mismatch and forged-
  receipt fixtures prove whole-guard behavior. No production type admits a bare loss. *Fails if* a
  structurally matching plain object or one candidate annotation can apply the guard.
- **A4 — registered trait authority and dependency.** `pawn_move@1` proves ordinary/capture/
  promotion positives and castling/non-pawn negatives at the legal-board boundary. Caller strings,
  illegal/duplicate candidates and unregistered classifiers fail. Guard success applies pawn ×4;
  every guard abstention records trait abstention and returns mass byte-equal to base Maia. *Fails
  if* an unguarded pawn-forward distribution can execute.
- **A5 — compiler refusals.** Duplicate authority, incomplete vector without a degraded path,
  unknown guard profile, unmeasured/unregistered/unguarded trait, delay, memory and learner-derived
  inputs all fail compilation. Forcing ×3 and quiet ×3 remain measured negative registrations.
- **A6 — by-record determinism.** Same run root/history/seed/profile/provider receipts produces a
  byte-identical selection/decision across restarts; equal-mass ties use `neutralTiebreak` and the
  composed path records `seedHonored: true`.
- **A7 — sampler positive control.** The committed R11 captured production sample remains within
  0.5 cp and 0.1 pp of reconstruction; T=1.0 breaks the bound. The fixture reads the artifact, not
  restated expected numbers.
- **A8 — atomic persistence and migration.** Move, policy decision, root/history/candidate digests,
  layer actions and abstentions survive event-log replay byte-identically under run 0.18. A failed
  append saves neither move nor decision; historical rows gain nothing.
- **A9 — compiled grounded card.** Baseline/guard/pawn cards compile from registered layers,
  measurements, abstentions, absence/scope and optional exact-digest calibration only. Wrong-digest
  calibration, absent sources, malformed family composition and caller sentences fail. Decorative
  identity reaches only the display slot. *Fails if* a word filter is the grounding mechanism.
- **A10 — availability and degradation.** Provider-off/deadline/incomplete receipts keep baseline
  Play available, make guarded/pawn profiles unavailable when the release receipt is red, and never
  present an abstained guard as applied. Prediction/human-split paths remain raw Maia consumers.
- **A11 — exact production budget.** The release operation benchmarks expected concurrency and
  records total/Maia/guard/composition durations. Combined p95 ≤400 ms is healthy; p95 >500 ms or
  any incomplete/late receipt is intervention. A 500-ms guard opportunity deadline abstains the
  guard without failing baseline Play. *Fails if* D969's one-host maximum is relabeled a guarantee.
- **A12 — operation census.** Every one of §10's twelve operations has a non-test symbol and the
  positive route traverses all twelve; the nine currently absent operations must invert. A parser,
  type or anchor without runtime consumption does not pass.
- **A13 — wall/dispositions/docs.** Learner-derived inputs and multi-band persona queries remain
  compile-refused; every advertised provider/profile state has a disposition; docs describe the
  atomic route, seals, record, card, budget and degradation; the release journey exercises
  choose → play → resume → rematch through normal Make/CI targets.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Stage B: the [[D813]] candidate-evidence adapter over the literal landed tactical/breadth ids — feature-weighted personas beyond the O8.2 roster are blocked until it lands | `planning/evidence-foundation-ux/plan.md` | the Stage-B landing commit | |
| D2 | The [[D815]] salience measurement (human severe-error mass conditioned on exact threat-just-created / attacker-just-moved classes, behind tactical landing) — no salience-shaped layer may register before it passes; a failed measurement kills the family | claude | dossier in `design/research/` + ledger flip | |
| D3 | The replacement-preregistered exact-digest roster calibration: band-relative outcome/distribution, clock/time-control scope, severe-tail, trait observability, reproducibility and provider-off receipts; `uncalibrated` is legal registration but not 1.0 completion | claude | calibration dossier + exact profile digests + register/ledger flips | |
| D4 | The human-scale anchor ruling (anchor accounts vs learner-derived Glicko vs stay band-relative) — a cost/policy decision; until ruled, no absolute human Elo is stated anywhere | OWNER | `planning/exploration/log.md` ruling entry | |
| D5 | Owner-use roster validation via the retained 42-branch blind packet (O8.5) — validates or rejects profiles by use; cannot clear H5/C5 population claims | OWNER | `planning/platform-alignment/bot-policy/` + ledger | |
| D6 | Exact atomic production route benchmark at release concurrency clears the 400/500-ms operating contract or returns the guarded families for revision | `bot-policy` | release receipt with image/profile digests and total/Maia/guard/composition distributions | |

## Open questions

1. **The human-scale anchor** — carried as Discharges D4 (owner). Explicitly deferred; it
   does not block acceptance because §7's label rule makes the pre-anchor state honest
   rather than wrong.
2. **Resolved by [[D1566]].** The roster exposes exactly the measured
   `[1000, 1400, 1800, 2200]` bands crossed with three behavior families. These are model-band
   identities, not human Elo labels.
3. **Pack-side profile references** — explicitly deferred to a future RFC (it would claim
   a pack lane; packs keep `opponentPolicy` untouched here).
4. **The endgame floor layer** (`guard.endgame_floor`) — named, unregistered, unmeasured;
   deferred to its own measurement + registration (it would be a strength-changing layer
   and therefore re-calibrates every profile that adopts it).

**Ledger rows proposed for the registration commit** (head verified **D930** at drafting
HEAD; landed as D935–D937 at registration — D931–D934 were taken by three concurrent passes): **D935** — F8 drafted: the stack/record/calibration
contract, with the catalog-not-table decision and the two-stage collector seam; **D936** —
pin: consumers read bot profiles only through the compiled catalog + the persisted
selection record, never a parallel definitions store; **D937** — the endgame floor layer
as a named future measured layer (Open question 4).

## Changelog

- 2026-08-22: created, executing `planning/platform-alignment/bot-policy/f8-dependency-map.md`
  under the O8 owner ruling of 2026-08-22.
- 2026-08-22: adversarial cross-review corrections (buildability test). Blockers fixed in
  place: (1) the §4.1 **run seam** — production callers build every selection request from
  `run.opponentPolicy` (`#selectionRequest`), so `RunOpponentPolicy` gains the same
  optional `profile` triple, validated at run creation and persisted in `run.started`
  under the same 0.18 lane; §10 grows 8→11 files, A1/A12 updated, and the
  `session-controller.ts` coordination with `assistance-control-wiring` is named.
  (2) §2.4's "unrepresentable" claim restated at mechanism strength: the compiler
  verifies the disclosure embeds the guard's declared engine/bound/threshold literals,
  not merely that a string is non-empty (A6 fixture added). (3) §2.2 pins the sampler
  parameter domains (T > 0 — Temperature 0 is refused doctrine, `capabilities.ts:144`;
  topP ∈ (0,1]) and routes top-p cutoff ties through `neutralTiebreak`. (4) §3's wall
  closes over parameter **provenance**, not only input names. Honesty additions: §4.2
  states the composed-path-only scope of the seeded draw (profile-less `human_common`
  and `practical_resistance` inherit their shipped R5-measured behavior unchanged); A4
  names the committed conformance artifact by path; the claims paragraph states the
  verified-empty downstream seam of the payload widenings and defers the register-row
  parenthetical to the next register-touching commit to preserve the C3 byte-join.
- 2026-08-26: returned to draft for the production-safety amendment after D1601–D1609 were
  re-derived at the live symbols. Replaced browser-authoritative profile selection with one atomic
  run-bound opponent operation; replaced bare guard loss/trait strings with sealed whole-set and
  legal-board authorities; made pawn weighting depend on guard success; pinned
  `stockfish-guard@1`, the 400/500-ms operating contract and release benchmark; replaced free
  behavior prose with a source-bearing card compiler; expanded calibration/observability
  discharges. No profile, schema, migration or production byte changed in the author round.
- 2026-08-28: independently returned on [[D1970]], [[D1971]], [[D1972]], [[D1973]], [[D1974]],
  [[D1975]] and [[D1976]]. The amendment must consume the shared
  provider deliveries and candidate packet, separate returned mass from legal-set coverage, close
  the durable decision grammar, add a post-provider event-head CAS/idempotency receipt, separate
  deterministic policy bytes from request/timing bytes, and refuse rather than invent a move when
  the base provider supplies no distribution. Reproduction:
  `make bot-policy-independent-review`. No product/schema byte changed in the review.
