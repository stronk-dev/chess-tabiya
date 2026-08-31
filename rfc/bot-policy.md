# RFC: Bot policy

- **Status:** **draft — RETURNED by the third fresh independent review 2026-08-31 on
  [[D2407]]–[[D2411]].** The D2219–D2226 repair retains its exact model, legal-board classifier,
  delivery, route and concurrency improvements, but the author sampler applies top-p before
  normalization; deterministic identity hashes delivery timestamps; save/reload accepts a forged
  decision; provider-health types are copied; and exact-cache state is promoted to global roster
  availability. `make bot-policy-third-fresh-review` passes 5/5 as the blocker reproduction.
  **Acceptance and implementation remain blocked** on author repair, another fresh review,
  accepted provider health, and the shared-resource bootstrap/register claim. No
  implementation is authorized. Claims 0.18/migration remain held. *(Prior checkpoints:
  implementing; accepted 2026-08-22; draft; D1601–D1609 author-amended; D1970–D1976
  author-amended.)*
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
  `archive/opponent-contracts.md` (the mode-scope disposition precedent). **All production stages
  now depend on accepted and implemented `provider-exchange-and-execution.md`** for
  `ProviderEvidenceDelivery<MaiaPolicyPage, "maia.policy_page@1">` and
  `ProviderEvidenceDelivery<StockfishLegalRootTable, "stockfish.legal_root_table@1">`; no bot-private provider operation, queue,
  cache or receipt exists. **Stage B additionally depends on accepted and implemented
  `shared-candidate-evidence-packet.md`**, plus landed tactical/breadth collectors, and consumes one
  sealed `CandidatePopulationReceipt`; it never re-enumerates or re-runs them. The migration claim is
  ordered behind `longitudinal-store.md` (draft) per the
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
  rather than asserted away. **Roster/card availability additionally depends on the accepted
  `provider-health-degradation.md` claim-free runtime-authority checkpoint**: bot policy imports its
  exact `ProviderRegistrySnapshot`, closed operation result and generation-bound release receipt;
  it defines no parallel health enum. [[D2364]] makes the lane order explicit: health may remain
  implementing after that checkpoint, bot policy then lands run-schema 0.18, and health's durable
  acquisition field remains its registered 0.26 stage. **The cross-package bot-profile catalog is
  also blocked on accepted and implemented `shared-resource-register-bootstrap.md`**, which must
  register an absent `bot-profile-catalog` root before this RFC atomically claims its unique first
  lane 1. Until both dependencies are executable, this repaired RFC cannot be accepted.
- **Parent / amends:** extends the shipped opponent selector
  (`apps/server/src/opponent-selector.ts`) and capability contract
  (`apps/server/src/capabilities.ts`); replaces no shipped mode and redefines no shipped
  identity.
- **Supersedes / superseded by:** —
- **Planning:** `planning/bot-policy/` (once implementing)

```tabiya-claims
run-schema | lane 0.18 | OpponentSelection.policy event envelope + RunOpponentPolicy exact profile reference (packages/runtime/src/types.ts:69,102; run.started and opponent.move_selected payloads widen together)
migration | position behind concept-registry | stamp-only frozen-literal run-schema stamp "0.17"->"0.18" in apps/server/src/storage.ts; no table, no data rewrite
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
`packages/runtime/src/types.ts:69`) widens by the same optional exact six-field profile reference — one
version bump, two payloads; the register row names both and remains byte-joined to the claims block.
So: one run-schema lane,
one stamp-only migration position, frozen literals per the migration-4/9 freeze lesson.
The downstream seam is now explicit rather than empty: `bot-roster.md` declares the instances and
`opponent-experience.md` consumes the capability/card/identity projections, while neither claims a
second copy of the persisted policy record. `longitudinal-store` still ingests learner-actor
evidence only. The atomic operation's decision and non-circular operation record form the same
`OpponentSelection.policy` event envelope and 0.18 lane. **The policy/layer/profile identity is a
shared versioned resource**, because runtime schema, server selection/capabilities, roster/cards and
the client picker all consume it. The repaired RFC therefore makes acceptance contingent on the
shared-resource bootstrap registering `bot-profile-catalog` as `absent`; this RFC then adds the
unique `first lane 1` claim in the same commit, and implementation lands one generated catalog
projection across every consumer (§1). It remains code-authored, not a storage table. **Everything
else is deliberately claim-free**: the three new evidence projections are additive `@1` identities
in `packages/runtime/src/evidence-catalog.ts` (the F2/tactical precedent: *"new `@1`
identities — no version bumps"*); **no pack lane** (packs keep their existing
`opponentPolicy`; a pack-side profile reference is a named future RFC, §Open questions);
no shape-entry, principle-entry, or evidence-kinds member. The register row for this
draft's claims is added to `rfc/README.md` **in the registration commit**, per the
register instruction that the row and the draft ride together.

## Summary

This RFC specifies the **F8 opponent-policy stack**: one composable, versioned policy
compiler over the shipped human-policy base model, replacing nothing. It ships (Stage A)
the O8-ruled three behavior families — **Human baseline / Guarded human / Pawn-heavy** — crossed
with four immutable model-band identities, as named compositions of separately versioned layers,
executed by a **server-side seeded sampler over the honestly bounded Maia policy page** (the [[D823]] decision,
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

**2026-08-30 shared-foundation repair.** Production acquisition belongs to the shared provider
scheduler, candidate enumeration/collection belongs to the shared candidate packet, and this RFC
owns only bot-specific derivation, policy projection and the run-bound append. Returned probability
mass, legal-set equality and feature coverage are three separate facts. A retry replays its durable
event envelope; it never recreates equality by recomputation. If Maia supplies no distribution,
there is no base distribution and therefore no move.

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
  the admitted policy-page adapter, retaining its bounded coverage, not reinterpret a display
  projection or relabel requested width as completeness."*
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

### §1 — One shared compiled catalog, not a table (the claims decision)

**Decision: layer and profile definitions are one versioned `bot-profile-catalog` shared
resource compiled into server, runtime/schema and client projections — not rows in a storage
table.** The accepted shared-resource bootstrap must first register the resource as `absent`; this
RFC then carries the unique `first lane 1` claim. Its implementation creates the declaration root,
generated projections and landed register row atomically. No consumer owns a family, band, layer,
classifier, feature or degradation-reason copy.

The argument, since the drafting order asked for one:

1. **Nothing authors the shipped roster at runtime, but many components consume it.** The O8 roster
   is closed at three behavior families crossed with four bands; layers are measured artifacts (a
   trait multiplier is inseparable from the dossier that measured it). Runtime events/schema,
   create/resume/cache/capabilities, roster/cards and the client picker all need the same identities.
   That makes the catalog a shared registered resource even though it remains code-authored.
2. **A table would buy obligations without buyers.** A `bot_profiles` table joins the
   account-deletion/export surface, demands a storage migration and creates a second authority for
   a fact the selection record already persists per use (§6). Replay reads the event log plus the
   historical compiled catalog projection, never a mutable definitions table.
3. **The generated catalog owns versioning and history.** `bot-profile-catalog@1` contains the
   twelve exact declarations, its head/digest and the closed grammar images. A profile edit creates
   a new resource lane/profile version; old selections retain exact profile and delivery digests.
   The generator fails on missing/extra/crossed consumer identities or a changed historical image.
4. **The exit is named.** If a later surface lets users compose profiles, that RFC creates the
   learner-owned table, claims its migration and registers user compositions. Shipped definitions
   remain immutable catalog artifacts; learner data begins only when a learner authors one.

Each **layer declaration** carries: stable `id@version`; kind (one of §2's seven); exact
inputs (provider projections and/or registered evidence ids — literal ids, no forecasts);
transform/mask parameters; abstention conditions and fallback behavior; whether it changes
strength; and its measured output metric with dossier source ids. It carries no caller-authored
behavior sentence. A closed card renderer maps registered layer/measurement/absence identities to
source-bearing statements; decorative identity is a separate closed owner-authored registry (§2.8,
§7). Each **profile declaration** is one immutable member of the closed family×band product:

```ts
type BotProfileFamily = "human-baseline" | "guarded-human" | "pawn-forward";
type BotModelBand = 1000 | 1400 | 1800 | 2200;
type BotProfileId = `${BotProfileFamily}.${BotModelBand}@1`;
```

The compiled catalog enumerates exactly the twelve literals. Every declaration carries its literal
`id`, `family`, `band`, `version: 1`, exact base model reference
`maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe` at source version
`1e13597c42d4858b7cfd7cfdae01e297263364b2`, sampler `{ temperature: 0.8, topP: 0.92,
requestedWidth: 20, returnedMassFloor: 0.97 }`, ordered layer references, presentation reference,
and a compiled **profile digest**: RFC-8785 SHA-256 over the whole canonical declaration, using the
`sha256:` grammar of `DIGEST_PATTERN` (`opponent-selector.ts:81`). The run stores the complete
reference `{ id, family, band, version, digest, model, sampler, orderedLayers }`; none is inferred.
Creation, resume, rematch and cache identity compare the whole reference. Thus two bands in one
family cannot share an id, digest or cache entry, and no profile can be combined with raw target-Elo,
temperature or top-p overrides.

### §2 — The layer stack: seven kinds, separately versioned

The stack is O8.1's, verbatim in order. Per-kind contracts:

**§2.1 `HumanPolicyModel`** — model identity (engine id, `modelId`, `containerDigest`
from `SelectionEngineIdentity`), supported band range (validated via `appliedTargetElo`,
`apps/server/src/engine-band.ts`), history capability (full-history; the shipped Maia is
history-conditioned — a recorded fact on the model declaration, not an option), and the
**bounded-page contract**: the shared operation returns only `coverage: "bounded_top_k"`; requested
width is never treated as observed completeness. Baseline legality is established independently by
one sealed `ExactLegalMoveMap` compiled from the run-owned root. The page's unique moves must be a
non-empty subset of that map, and every transformed or selected move must remain in it. Returned raw
mass is recorded as the **returned-mass statistic**, not a legal-set claim. Measured floor on the
pinned image at MultiPV-20: median
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

**§2.4 `ErrorGuard`** — `guard.severe_error@1` consumes an optional exact shared
`TypedProviderResult<"stockfish.legal_root_table@1">`; it owns no provider request or private
receipt. The successful arm contains the sealed
`ProviderEvidenceDelivery<StockfishLegalRootTable, "stockfish.legal_root_table@1">`, whose request
binds the root FEN, all-legal move identity, Stockfish identity, depth, timeout and score frame.
The bot joins it to the run-owned root authority and exact legal map, then derives one sealed
`BotGuardView`:

```ts
type BotGuardView =
  | { readonly kind: "applied";
      readonly source: RegisteredBotProviderInput<StockfishLegalRootTable,
        "stockfish.legal_root_table@1">;
      readonly referenceMoveUci: string; readonly referenceCp: number;
      readonly rows: readonly { readonly moveUci: string;
        readonly sourceScore: { readonly kind: "centipawns"; readonly value: number };
        readonly lossCp: number; readonly admitted: boolean }[] }
  | { readonly kind: "abstained"; readonly reason: BotGuardAbstentionReason;
      readonly source?: RegisteredBotProviderInput<StockfishLegalRootTable,
        "stockfish.legal_root_table@1">;
      readonly rows: readonly { readonly moveUci: string;
        readonly sourceScore: StockfishLegalRootTable["rows"][number]["score"] }[] };
```

The reference is selected from **all legal Stockfish rows before** retaining the bounded Maia
subset. A guard applies only when every all-legal row is in the centipawn domain; `referenceCp` is
the maximum root-side score and each Maia row's loss is `referenceCp - candidateCp`. Any mate row,
mixed cp/mate domain, all-mate domain, provider local/source failure, provider unavailability,
500-ms opportunity deadline, legal-set mismatch, duplicate/missing/extra/short-depth row, forged
seal or root mismatch abstains the **whole guard**. There is no cp conversion for mate scores and no
numeric loss on an abstained row. `empty_after_mask` also abstains the whole guard. Every abstention
passes the reconstructed Maia distribution byte-identically onward and is recorded. On an applied
view, the guard masks every Maia candidate whose loss is at least 250 cp. The depth-8 population measured 100%
severe-mass removal, 1.36 cp expected-loss strengthening and 100.21% explorer-match retention.

The guard is an explicit information advantage, but disclosure is compiled rather than authored:
the card renderer maps the registered guard/request/measurement ids to engine, depth, threshold,
abstention and scope statements (§7). A free `disclosure` sentence is not an authority and cannot
enter the card.

**§2.5 `ControlledTrait[]`** — `trait.<name>@version` references a closed versioned classifier id
and a measured multiplier. Stage A's registry contains exactly `pawn_move@1 → pawn_move`; the
classifier accepts only `(root position, exact legal move set)`, canonicalizes through the runtime
legal-board boundary and returns a sealed trait view. It consumes the exact legal move's board role,
never UCI string prefixes: all files for both colours, single/double pushes, captures, en passant
and all four promotion identities are positives; castling and every non-pawn move are hard
negatives. The view is set-equal to the sealed legal map. Caller-provided `traits: string[]`
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

There is one compiler-owned execution path. Its inputs are authorities, never claimed outputs:

```text
sealed BotOperationRootAuthority
  + sealed ExactLegalMoveMap
  + shared TypedProviderResult<"maia.policy_page@1">
  + optional shared TypedProviderResult<"stockfish.legal_root_table@1">
  + exact compiled BotProfileDeclaration
  + optional sealed CandidateFeatureSubset                                      [Stage B]
  → admit exact Maia source or return typed no-move
  → prove non-empty Maia moves ⊆ exact legal map and exact root/request identity
  → reconstruct p^(1/T), deterministic top-p membership and normalized base distribution
  → derive applied/abstained guard from the optional all-legal Stockfish result
  → derive registered legal-board trait view                                    [trait families]
  → retain Stage-B features for exactly the admitted bounded Maia population     [Stage B]
  → apply guard mask, then only dependency-satisfied measured trait transforms
  → renormalize and seeded-sample using neutral tie ordering
  → sealed BotPolicyExecution
  → sealed BotPolicyDecisionRecord + non-circular operation envelope
  → one persisted opponent.move_selected event
```

`BotOperationRootAuthority` is constructed only by the run service and sealed at runtime. It
contains the public `BotRootIdentity` plus canonical `beforeFen`, `startFen`, `historyUci` and
branch seed. Those position bytes are required to validate the provider payload's real request;
they are not invented fields on `ProviderDelivery`. `ExactLegalMoveMap` is derived once from that
canonical root by the shared legal-board boundary and is the baseline legality authority even when
Stockfish is absent.

The bot imports the dependency's exact `ProviderDelivery`, `ProviderEvidenceDelivery`,
`TypedProviderResult`, `MaiaPolicyPage` and `StockfishLegalRootTable` types and assertions. It never
redeclares a delivery. A bot-local `ExactProviderSourceIdentity` retains the literal shared
operation, provider, endpoint, requested/actual identities, generation, normalized request digest,
response digest, cache identity and payload digest from a successfully asserted delivery. This is
a derived identity record, not a second receipt or seal authority.

Only `compileBotPolicyExecution` may transform weights, choose a move or state layer results. It
accepts the sealed roots/sources/views above, reconstructs the base distribution, executes every
declared mask and multiplier in catalog order, derives classifiers from registered views, and runs
the declared sampler. It returns a runtime-sealed `BotPolicyExecution`. Callers cannot supply
`chosenMoveUci`, `finalMass`, layer actions, classifiers or guard losses. The record projector
accepts only that sealed execution and adds the deterministic digest; independently mutating any
claimed output therefore fails before persistence rather than creating a valid-looking record.

Compile-time failures (each a fixture): two layers claiming the same authority (two
guards; two samplers; a trait and a guard both declaring the mask effect on the same
basis); a transform requiring legal-set completeness composed with bounded Maia input (only the
all-legal authority may satisfy that requirement); a guard without the registered
`stockfish.legal_root_table@1` source identity; a trait without a registered classifier, a cited passing
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
A layer may abstain without erasing a **delivered** base distribution (O8.1); every abstention is
recorded in §6's closed reason vocabulary. Maia source unavailability is different: it produces no
distribution, no selection derivation and no opponent event (§4.3). The production composer accepts
only asserted shared provider results, compiler-owned sealed roots/views and — for Stage B — one
admitted candidate-population receipt projected into a sealed subset. A structurally similar plain
object, bare loss number, trait string, caller-chosen move or feature row fails at a runtime seal
boundary, not merely in TypeScript.

**Identity discipline** (dependency map §3): the request's existing `policyConfigDigest`
is the run session digest and **is not relabeled** as the stack identity. The run carries
both: session identity for replay, and the compiled profile id/version/digest for the bot
decision.

### §4 — The selector at runtime

**§4.1 Run identity and the only production operation ([[D821]]/[[D1605]]).**
`RunOpponentPolicy` gains one optional exact profile reference:

```ts
interface BotProfileReference {
  readonly id: BotProfileId;
  readonly family: BotProfileFamily;
  readonly band: BotModelBand;
  readonly version: 1;
  readonly digest: `sha256:${string}`;
  readonly model: Readonly<{
    id: "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe";
    version: "1e13597c42d4858b7cfd7cfdae01e297263364b2";
  }>;
  readonly sampler: Readonly<{
    temperature: 0.8; topP: 0.92; requestedWidth: 20; returnedMassFloor: 0.97;
  }>;
  readonly orderedLayers: readonly BotLayerId[];
}
readonly profile?: BotProfileReference;
```

It is valid only with `human_common`, mutually exclusive with `targetElo`, `temperature` and
`topP`, and must match one exact catalog entry at run creation. It is persisted in `run.started`,
read byte-for-byte on resume and never upgraded to “latest.” Rematch copies that exact reference
unless the learner explicitly chooses another catalog entry; a same-family/different-band choice is
a different immutable identity. Historical runs carry none and infer none. The existing
`SelectorPolicy.profile` parser and profile-aware cache key remain useful internal validation seams,
but public `/select-move` is **not** the production authority for profile play.

Production uses one server-owned atomic operation:

```text
POST /runs/:runId/opponent-ply
{ expectedNodeId, expectedBranchId, expectedEventHeadDigest, requestId }
  + authenticated writer/lease identity
```

The browser supplies no FEN, history, seed, policy/profile, candidate evidence or selected move.
The exported `parseBotOpponentPlyRequest`/constructor is the sole request-id authority and enforces
`^botreq_[A-Za-z0-9_-]{16,128}$`; routes and services cannot accept a cast string. Before provider
work, the server derives and seals `BotOperationRootAuthority`, seed, exact profile reference and
writer-lease digest. It then computes `preProviderOperandDigest` over the request id, public root,
writer lease, profile reference and seed. The event log is checked for the request id **before any
provider call**: an exact pre-provider match returns the stored event envelope; a mismatch returns
`request_reused_with_different_operands`. On a miss, the service obtains the shared Maia result and,
where the profile declares a guard, the optional shared Stockfish result without holding a database
transaction. **After** those awaits, it re-reads the run and either performs one event-head
compare-and-swap/per-run serialized commit against the whole root identity or returns `stale_root`;
checking only a node id is forbidden because a node may be visited on another branch or after later
events.

The operation has the closed outcomes `committed | replayed_idempotent |
replayed_concurrent_winner | concurrent_commit_conflict | stale_root |
request_reused_with_different_operands | base_provider_unavailable | provider_failed`. A successful
compiler execution adds `commitOperandDigest`, covering the pre-provider operand digest,
derivation digest and every exact provider source identity. It writes one
`BotPolicyEventEnvelope { decision, operation }` **inside the same `opponent.move_selected` event**.
The operation record names the pre-commit head and resulting event sequence, but deliberately does
not contain the resulting committed head digest: the normal event-log hash protects the envelope,
so the digest image is non-circular. The operation digest covers request, root, writer lease,
profile, seed, derivation, exact provider identities, chosen move and event sequence; it excludes
timings and its own digest field. Save → reload → retry locates that event by request id and returns
the stored envelope byte-for-byte without provider calls. That later retry compares only the exact
pre-provider identity; it deliberately does not fetch or compare current provider bytes. Reuse with
a different root, writer, profile or seed refuses before provider work.

Two first flights may miss the pre-provider lookup concurrently. Under the serialized commit, the
service first checks whether that request id now has a winner. Equal pre-provider and commit operand
digests return `replayed_concurrent_winner` byte-for-byte even though the run head has advanced;
different delivered-provider/derivation bytes return `concurrent_commit_conflict` and write
nothing. Only when no request winner exists does the service apply the root CAS and possibly return
`stale_root`. This is the only place provider bytes are compared. Event replay, run export and account
deletion automatically include or remove the envelope through the existing run-event lifecycle;
there is no orphan side table. Move, decision and operation enter one run snapshot; no transaction
spans provider work, and a failed compare-and-swap writes neither.

Route and web client import one closed `BotOpponentPlyResult`; no raw error string or inferred
retry behavior crosses the boundary:

| result kind | HTTP | code | retryable | client action |
|---|---:|---|---|---|
| `committed`, `replayed_idempotent`, `replayed_concurrent_winner` | 200 | — | no | `continue` with exact envelope |
| `stale_root` | 409 | `OPPONENT_STALE_ROOT` | no | `refresh_position` |
| `request_reused_with_different_operands` | 409 | `OPPONENT_REQUEST_REUSED` | no | `issue_new_request` |
| `concurrent_commit_conflict` | 409 | `OPPONENT_CONCURRENT_CONFLICT` | yes | `refresh_and_retry` |
| `base_provider_unavailable` | 503 | `OPPONENT_PROVIDER_UNAVAILABLE` | yes | `retry_or_change_opponent` |
| `provider_failed` | 502 | `OPPONENT_PROVIDER_FAILED` | yes | `retry_or_change_opponent` |

The parser reconstructs the expected row from `kind` and rejects changed status/code/retry/action
fields. Ordinary play renders the named action through the existing paused-opponent module; it
never dumps provider reasons into board geometry.

This operation replaces the shipped two-step
`POST /select-move → browser selection bytes → POST /runs/:id/moves` path for opponent play; that
path remains only for explicitly separate evidence/diagnostic consumers until D233 removes or
narrows it. Prediction, human-split and analysis consumers continue to read raw Maia and never
inherit a persona transform. Grouped branches call the same server-owned core through their
group-specific wrapper.

**§4.2 The seeded draw ([[D823]], mechanism 1).** Inside the atomic operation the selector requests
the shared `maia.policy_page@1` operation and receives `coverage: "bounded_top_k"`; requested width
is never relabelled completeness. It separately records (a) `returnedProbabilityMass`, used only by
the sampler's measured reconstruction floor, and (b) `maiaCoverage: bounded_subset |
legal_set_equal`, derived only by set equality between Maia move identities and the admitted
run-owned `ExactLegalMoveMap`. It derives the optional guard view from the all-legal Stockfish
result, retaining the exact Maia-admitted rows while allowing the best legal reference to sit
outside them. It then runs §3's compiled pipeline and draws with the **branch seed** via the existing
deterministic primitives (`unitInterval`/`sampleWeighted`, `opponent-selector.ts:347-365`,
keyed on the request's history hash). The recorded engine identity keeps Maia's identity
fields and sets **`seedHonored: true`** — the seed is honored by the server sampler; the
model's internal sample is discarded. Basis-equal candidates order by the position-pure
`neutralTiebreak` (`:207-217`), never insertion order. **By-record determinism** (the R5
finding — byte-identical reproducibility is the property the whole instrument chain rests
on): exact root, profile, seed and **delivered Maia/Stockfish payload identities** reproduce the
same `BotPolicyDerivation` digest and selected move. Request id, acquisition/delivery receipts,
cache state and timings live in the surrounding operation envelope and are deliberately absent
from that deterministic digest. Retry equality comes from returning the committed receipt, not
from recomputation (criterion A6).
Scope, stated so A3 cannot be misread: the seeded draw exists **only on the composed
path**. Profile-less `human_common` keeps playing Maia's internal unseeded sample
(`seedHonored: false` — R5 measured that `bestmove` repeat-stable on only 34.3% of keys
while the policy vector is bit-stable 105/105,
`design/research/maia-policy-scalar-stability.md`), and `practical_resistance` keeps its
bit-stable scalar basis; both ship unchanged (§8). This RFC **inherits, rather than
silently fixing,** the unseeded sample everywhere a profile does not own the draw — replay
and the event log remain the repeatability instrument there, exactly as today.

**§4.3 Degradation and availability are recorded, never silent.** The result algebra distinguishes
three cases that cannot share a fallback label:

1. A **delivered**, non-empty bounded Maia page below a profile's returned-mass floor still runs the
   **same declared reconstruction/top-p/seeded-sampler algorithm** over the legal delivered rows.
   The sampler is not changed and no provider-selected move is assumed. The base layer records
   action `degraded` with `returned_mass_below_profile_floor`; the derivation retains returned width,
   mass and bounded coverage and never claims legal completeness.
2. Optional guard unavailable/deadline/incomplete/mixed-domain evidence leaves the delivered Maia
   distribution byte-identical, records the exact closed guard abstention and forces every
   guard-dependent trait to abstain.
3. Maia unavailable or failed produces `base_provider_unavailable | provider_failed`, commits no
   opponent move or selection event, and remains retryable. **There is no Maia/base fallback after
   Maia fails because Maia is the base distribution.** A future CPU fallback is a separately
   measured and registered policy, not an implicit branch.

Release availability is stricter than one-move fallback: if the exact release-concurrency benchmark
crosses §4.5's intervention boundary or cannot produce complete guard source results, guarded and
pawn-forward profiles are unavailable in the roster capability until a matching provider receipt
clears. Baseline Play remains available. A card and in-run identity surface render the live
availability/degraded state from the same record rather than rewriting it as persona behavior.

`profileAvailability` consumes the exact provider-health snapshot revision and operation
availability for `maia.policy_page@1` and, for guarded families,
`stockfish.legal_root_table@1`. `available`, request-specific `cached_exact_only`, and
`requestable_unverified` are requestable states; `unavailable` is not. Baseline requires only the
Maia operation. Guarded and pawn-forward additionally require the Stockfish operation and one
`BotReleaseReceipt` whose catalog digest, Maia generation, Stockfish generation and
`guardComplete: true` match that snapshot. Missing/stale receipts make only those guarded families
unavailable. The snapshot, operation result and generation semantics are imported from provider
health's [[D2364]] checkpoint; this RFC owns only the profile join and cannot recreate health from
configuration presence.

**§4.4 Candidate generation.** The [[D810]] evidence basis is the union the owner named —
Maia policy mass ∪ book/explorer frequency ∪ engine multipv — realized in v1 as: the
bounded Maia page is the sampling population, the run-owned exact legal map is the legality
authority, and the optional shared Stockfish root table is the all-legal score source. A high
returned mass never closes the legal set. The guard's
derived view prices only exact Maia-admitted rows; the repertoire prior (when an instance ever
registers) reweights within it; explorer frequency enters only through layers that
declare it (none in v1 — the statistical book measured itself out, §2.3). The set is
**set-equal or explicitly bounded** — both returned mass and set relation are recorded, and any
transform requiring legal-set equality abstains on a bounded page (dependency map §2).

**§4.5 Combined selection budget.** Acquisition uses the shared scheduler and its admitted
deliveries; the bot owns no private queue, cache or receipt constructor. Guard derivation is
sequential after the Maia-admitted rows are known, while the shared Stockfish operation supplies
one all-legal root table rather than one child evaluation per candidate. The predeclared release
operating contract is: combined p95 ≤400 ms is
healthy; p95 >500 ms, or any incomplete/late receipt in the fixed release benchmark, is an
intervention; and the optional guard has a 500-ms opportunity deadline measured from selection
start. The committed D969 population (p50 209.085, p95 286.796, max 499.1 ms on one host) justifies
the depth-8 choice and these author thresholds, but is not a portable performance guarantee. The
exact **shared-delivery** production route must benchmark total/Maia/root-table/guard/composition
durations and delivered coverage under expected release concurrency before guarded profiles
register. Deadline records `guard_deadline`; it
never turns into an unguarded trait or hides baseline Play.

### §5 — Candidate featuring: Stage A without [[D813]], Stage B with it

**[[D813]] — the candidate-evidence adapter — is named as the dependency it is.** The accepted
`shared-candidate-evidence-packet` implementation must first compile one exact legal population and
its retained candidate events/readings. This RFC does **not** apply collectors per child. Stage B
consumes one admitted `CandidatePopulationReceipt<"events_and_readings">` — containing **the same
registered collectors' values** under the literal ids shipped by `tactical-collectors` (30, e.g.
`rules.exchange.predicate.legal_exchange@1`, `rules.tactic.event.fork_allowed@1`,
`rules.tactic.consequence.threat@1`, `rules.tactic.consequence.reply_breadth@1`) and
`breadth-collectors` (18, e.g. `rules.mobility.reading.piece_destinations@1`,
`rules.pawn.event.dynamics@1`, `rules.king.reading.zone_state@1`) — plus the same run-owned exact
legal map and the admitted bounded Maia population. The bot-local derivation first proves packet
root/FEN/legal-set equality against that all-legal authority, then produces a sealed
`CandidateFeatureSubset` whose rows are set-equal to **the admitted bounded Maia moves**, selected
from the all-legal packet rows. It retains packet/root/Maia population identities, all-legal and
retained counts, omitted move identities, coverage `bounded_subset | legal_set_equal`, and every
retained value's exact source id. It emits only `derived.opponent.candidate_feature_vector@1`. It
enumerates no moves, calls no collector, performs zero child position-evaluation requests and owns
no cache. An absent feature row for any admitted Maia move, a retained row outside that population,
or a wrong packet/root/population identity refuses. This is the D10 hand-off the shared
packet reserves for the first bot consumer, not a second candidate pipeline ([[D1976]]).

**Stage A (this RFC's shippable core) does not wait for it.** The v1 roster needs exactly
three per-candidate facts, none of which is a collector: raw/reconstructed Maia mass
(provider), fixed-bound Stockfish loss (provider — the guard), and the pawn-move
predicate (pure board arithmetic on the UCI move). The roster, the record, the seam, and
the calibration gate all land Stage A. **What v1 ships if D813 lags is therefore stated,
not implied: the three O8.2 behavior families at all four ruled bands, with position-level and provider-level features
only — no feature-weighted persona beyond `trait.pawn_preference@1`, no blind-spot
persona, no salience anything.**

**Stage B (blocked on the shared packet/provider dependencies and 2c+2d landing)** ships the
bot-local derived view as a typed producer
(`derived.opponent.candidate_feature_vector@1`, § below) and opens trait registration to
classifiers over registered ids — each still individually gated by §2.5. The Stage-B
prototype is free before the producer is built: the committed R11 capture corpus (837
position-band cells, three bands, MultiPV-20) already supports offline featuring with
zero engine calls (`human-like-opponents.md` §9.1).

**Evidence-catalog additions (all additive `@1`, no register claim):**

| id | role | binding | content |
|---|---|---|---|
| `derived.opponent.choice_breadth@1` | reading | `→ opponent.selection` **only** | the [[D816]] admission: candidate-loss distribution or named sufficient statistics + shared root-table identity/depth/budget + legal-set equality + score frame + raw threshold/window parameters (never a prose label); abstains when the required set relation is absent |
| `derived.opponent.candidate_feature_vector@1` | reading | `→ opponent.selection` only (Stage B) | exact retained rows for the admitted bounded Maia intersection from one candidate-population receipt, each naming its literal source id; retains matching all-legal packet/root and bounded-population identities with zero collector/provider calls |
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
type BotProfileFamily = "human-baseline" | "guarded-human" | "pawn-forward";
type BotModelBand = 1000 | 1400 | 1800 | 2200;
type BotProfileId = `${BotProfileFamily}.${BotModelBand}@1`;
type BotLayerId =
  | "sampler.maia_reconstruction@1"
  | "guard.severe_error@1" | "trait.pawn_preference@1";
type BotClassifierId = "pawn_move@1";
type BotDegradationReason =
  | "returned_mass_below_profile_floor"
  | "guard_unavailable" | "guard_deadline" | "guard_source_failure"
  | "guard_mate_domain" | "guard_mixed_domain" | "guard_candidate_mismatch"
  | "empty_after_mask" | "candidate_features_unavailable"
  | "guard_dependency_abstained";

interface BotRootIdentity {
  readonly runId: string;
  readonly branchId: string;
  readonly nodeId: string;
  readonly preCommitEventHeadDigest: `sha256:${string}`;
  readonly beforeFenDigest: `sha256:${string}`;
  readonly historyDigest: `sha256:${string}`;
}

interface RegisteredBotProviderInput<T, K extends
  "maia.policy_page@1" | "stockfish.legal_root_table@1"> {
  readonly operation: K;
  readonly delivery: ProviderEvidenceDelivery<T, K>;
  readonly deliveryDigest: `sha256:${string}`;
}

type BotConsideredGuard =
  | { readonly kind: "not_requested" }
  | { readonly kind: "applied"; readonly sourceScore:
        { readonly kind: "centipawns"; readonly value: number };
      readonly lossCp: number; readonly admitted: boolean }
  | { readonly kind: "abstained"; readonly reason: BotDegradationReason;
      readonly sourceScore?: StockfishLegalRootTable["rows"][number]["score"] };

interface BotPolicyDerivation {
  readonly root: BotRootIdentity;
  readonly profile: BotProfileReference;
  readonly seed: number;
  readonly sources: Readonly<{
    readonly maia: RegisteredBotProviderInput<MaiaPolicyPage, "maia.policy_page@1">;
    readonly stockfish?: RegisteredBotProviderInput<StockfishLegalRootTable,
      "stockfish.legal_root_table@1">;
    readonly candidatePacketDigest?: `sha256:${string}`;
    readonly candidateSubsetDigest?: `sha256:${string}`;
  }>;
  readonly returnedWidth: number;
  readonly returnedProbabilityMass: number;
  readonly maiaCoverage: "bounded_subset" | "legal_set_equal";
  readonly layers: readonly Readonly<{
    readonly id: BotLayerId;
    readonly action: "applied" | "abstained" | "degraded";
    readonly reason?: BotDegradationReason;
  }>[];
  readonly considered: readonly Readonly<{
    readonly moveUci: string;
    readonly rawMass: number;
    readonly reconstructedMass: number;
    readonly finalMass: number;
    readonly guard: BotConsideredGuard;
    readonly classifiers: readonly BotClassifierId[];
    readonly features: readonly Readonly<{
      readonly id: CandidatePopulationReceipt["rows"][number]["features"][number]["id"];
      readonly value: string | number | boolean;
      readonly sourceId: string;
    }>[];
  }>[];
  readonly chosenMoveUci: string;
}

interface BotPolicyDecisionRecord extends BotPolicyDerivation {
  readonly derivationDigest: `sha256:${string}`;
}

interface BotOperationRecord {
  readonly requestId: `botreq_${string}`;
  readonly root: BotRootIdentity;
  readonly writerLeaseDigest: `sha256:${string}`;
  readonly profileDigest: `sha256:${string}`;
  readonly seed: number;
  readonly preProviderOperandDigest: `sha256:${string}`;
  readonly commitOperandDigest: `sha256:${string}`;
  readonly derivationDigest: `sha256:${string}`;
  readonly providerDeliveryDigests: readonly `sha256:${string}`[];
  readonly chosenMoveUci: string;
  readonly committedEventSequence: number;
  readonly operationDigest: `sha256:${string}`;
  readonly timingMs: Readonly<{
    total: number; maia: number; guard: number; composition: number;
  }>;
}

interface BotPolicyEventEnvelope {
  readonly decision: BotPolicyDecisionRecord;
  readonly operation: BotOperationRecord;
}

readonly policy?: BotPolicyEventEnvelope;
```

`compileBotPolicyExecution` is the sole transform/sampler constructor and returns a runtime-sealed
execution. `projectBotPolicyDecisionRecord` accepts only that execution and adds the canonical
derivation digest. It cannot accept chosen moves, final weights, layer actions, classifier ids or
guard losses from callers. It asserts exact root equality and set equality between `considered`,
the admitted Maia population and every supplied feature/classifier view. The ID and reason unions
are generated from `bot-profile-catalog`; feature ids are the exact shared candidate-packet feature
union, never a comment-promised bot copy. Each `RegisteredBotProviderInput` retains the complete
admitted `ProviderEvidenceDelivery`—acquisition receipt, requested/actual identity, raw-response
binding and payload—plus its canonical delivery digest through decision, persistence, replay and
export. An adapter may not strip it into selected fields. An unregistered identifier, free-form reason, open parameter
map, forged execution or structurally matching plain object is rejected, including an `as unknown
as` double cast ([[D1972]]).

The deterministic decision deliberately contains no request id, writer lease, elapsed time or
delivery timestamps. Its digest covers exact root, profile, seed, exact provider source/payload
identities, transformations and sampled move. `compileBotPolicyEventEnvelope` accepts the sealed
decision plus parsed request, writer lease and allocated event sequence. `operationDigest` uses the
canonical operation image described in §4.1 and excludes timing, the resulting event-head digest
and itself. The surrounding event hash authenticates the entire envelope. An idempotent retry
returns that already-committed envelope; it does not rerun providers or compare timing-bearing
objects ([[D1973]]/[[D1974]]). REST and storage accept neither object from the browser.

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
*"exact entrant policy IDs+versions"* by reading `decision.profile` off every game's selections —
no new selector work.

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
The projection is generated from `bot-profile-catalog@1`; provider availability is the exact
§4.3 join over provider health's immutable snapshot/release receipt. The client consumes the
generated wire/parser and declares no parallel family, band, layer, reason or action enum. The unimplemented
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

The production-boundary census is operational rather than a hand-counted file total. All thirteen
operations below must have one named non-test symbol and one positive/negative fixture; a parser or
declaration does not count as consumption:

| # | operation | required production home |
|---|---|---|
| 1 | run create stores exact profile reference | run/session validation + run schema 0.18 |
| 2 | resume resolves the same digest, never latest | run service/storage projection |
| 3 | client invokes only run/writer + expected node/branch/event-head + `botreq_` id | web API + session controller |
| 4 | server derives sealed root/FEN/history/seed/profile, exact legal map and writer lease | `RunService` opponent operation |
| 5 | shared provider exchange admits `maia.policy_page@1` as `bounded_top_k` | provider scheduler/exchange; no bot-private acquisition |
| 6 | optional shared provider result admits or abstains `stockfish.legal_root_table@1` | provider scheduler/exchange; no bot-private guard request |
| 7 | bot source join derives mass/subset and guard view from exact shared types + legal map | bot-policy source adapter |
| 8 | registered legal-board classifier compiles the sealed trait view | bot-trait registry/adapter |
| 9 | non-test compiler executes transforms/sampler and projects one sealed decision | selector/service composition path |
| 10 | post-provider CAS appends move + decision/operation envelope atomically | service/storage event append |
| 11 | `OpponentSelection.policy` envelope survives persistence/replay/retry/export | runtime types/schema/migration |
| 12 | roster capability reads compiled profile + provider state | server capability projection |
| 13 | card projection reads the same profile/receipts | registered bot-card compiler |

`apps/server/src/rest.ts` owns the run-bound route and must stop accepting selection bytes for this
path. Public `/select-move` remains a separately dispositioned diagnostic/evidence route; it is not
counted above. `packages/runtime/src/evidence-catalog.ts` and
`apps/server/src/evidence-manifest.ts` carry §5's registered read-back projections. Named validation
and docs sites include the capability/manifest fixtures, run-schema scaffold, provider-off/deadline
fixtures, `docs/bot-policy.md`, `docs/engine-workers.md` and the full release journey. Stage B adds
one consumer of the D813 `CandidatePopulationReceipt` plus the already-admitted legal-root table;
it adds no provider operation, child evaluation, collector loop or cache.

## Deviations from design

None. `design/03-product-breadth.md`'s Just Play opponent choice and Settings surface are
extended, not altered; the "human-policy band, not Elo" presentation is the O8.4 ruling,
not a divergence. The absence of a design-tier bot section is recorded in the header;
this RFC proposes no design-doc text (law 5).

## Fresh-return author obligations (2026-08-30)

The exact return is
`planning/platform-alignment/bot-policy/fresh-independent-buildability-review-2026-08-30.md`.
Before another acceptance review, the author must:

1. consume the accepted shared provider delivery and cp/mate score types directly, with a typed
   baseline path that survives optional-guard failure without weakening legal-move admission
   ([[D2089]], [[D2090]], [[D2093]]);
2. publish twelve immutable family+band identities and one durable, non-circular operation receipt
   home whose canonical bytes support replay, export and idempotency ([[D2087]], [[D2088]]);
3. replace the caller-fed decision projector with one compiler-owned transform/sampler result, and
   bind idempotency to the exact writer, derivation and provider operands through the published
   request parser ([[D2091]], [[D2092]]);
4. derive Stage-B features for the admitted bounded Maia intersection while retaining packet and
   all-legal authority, and calculate guard reference loss against the best legal Stockfish move
   under explicit mixed-domain semantics ([[D2094]], [[D2095]]);
5. define the below-returned-mass-floor selection from an actual declared source/algorithm, not a
   nonexistent Maia-selected move ([[D2096]]); and
6. invert all ten fresh-review arms, preserve the author checkpoint, and pass full repository
   verification before requesting a new independent review.

## Second fresh independent return (2026-08-30)

The first return's ten structural repairs remain visible, but the author proof and downstream
operation still do not compose. Before another acceptance review, the author must:

1. make the compiled profile declaration—not hard-coded constants—the authority for model,
   temperature, top-p, width and mass floor; compare it to the exact Maia request/result and run
   the captured 0.8/0.92 positive control ([[D2219]]);
2. replace the `a2` prefix heuristic in the executable proof with the registered exact legal-board
   `pawn_move@1` view, including both colours, every file, captures and promotions ([[D2220]]);
3. retain the admitted shared provider delivery/registered serializable receipt through decision,
   persistence and replay instead of copying selected fields into a bot-private digest object
   ([[D2221]]);
4. depend on provider-health's exact runtime snapshot/result authority for roster/card capability,
   and reconcile its durable receipt with this RFC's run-schema event envelope ([[D2222]]);
5. publish one closed public result/status/error union for `opponent-ply`, including committed,
   replayed, stale, reused, unavailable and failed UI actions ([[D2223]]);
6. register or single-source the cross-package profile/layer/reason catalog and close the literal
   decision grammar, including `ExactStockfishSourceIdentity`, `CandidateFeatureId` and
   `guard_dependency_abstained` ([[D2224]], [[D2225]]); and
7. separate pre-provider replay identity from post-provider commit/concurrency identity. A later
   no-call replay cannot simultaneously compare provider bytes it intentionally never fetches
   ([[D2226]]).

Exact evidence:
`planning/platform-alignment/bot-policy/second-fresh-independent-buildability-review-2026-08-30.md`.
The twelve-profile product, optional all-legal guard, bounded Maia population, compiler-owned draw,
event-embedded decision and Stage-B candidate join remain the intended shape.

## Third author repair (2026-08-31)

The executable contract at `tools/d1970-bot-policy-author-repair/` now repairs the second return as
one authority chain:

1. the twelve declarations carry the repository's exact Maia3 source/model ids, T=0.8, top-p=0.92,
   width 20, mass floor 0.97 and exact ordered layers; source admission compares every field and the
   committed 837-cell captured-production artifact is the positive control ([[D2219]]);
2. `pawn_move@1` consumes the runtime exact legal-board role and crosses both colours, every file,
   captures, en passant, four promotion identities, castling and non-pawn negatives ([[D2220]]);
3. decisions retain the complete admitted provider delivery through save/reload and fail after any
   payload mutation; operation identity names delivery digests, not copied source summaries
   ([[D2221]]);
4. profile availability joins the exact provider-health operation states plus generation-bound
   release receipt, with baseline independent of Stockfish and guarded families requiring it
   ([[D2222]]/[[D2364]]);
5. one public result parser maps all eight operation outcomes to exact HTTP/code/retry/action rows
   and rejects tampering ([[D2223]]);
6. the bot profile identities and closed layer/classifier/reason grammar move to one registered
   generated catalog; Stage-B feature identity derives from the shared packet union
   ([[D2224]]/[[D2225]]); and
7. a later exact retry is pre-provider only, while serialized concurrent first flights compare the
   post-provider commit identity: same bytes replay the advanced-head winner, different bytes
   conflict and write nothing ([[D2226]]).

`make bot-policy-author-contract` passes 31/31 plus strict TypeScript. This is still an author checkpoint, not an
acceptance: provider health must survive review and land its claim-free [[D2364]] checkpoint, the
shared-resource bootstrap must register `bot-profile-catalog` as absent and this RFC must add the
unique first-lane claim, then a fresh independent buildability review must attack the composed
contract.

## Acceptance criteria

Each criterion names its failure mode; none can pass while measuring nothing ([[D444]]/
[[D451]] — the able-to-fail fixtures are part of the criterion).

- **A1 — exact twelve-member run identity.** The catalog enumerates exactly three families × four
  bands from the registered `bot-profile-catalog@1` declaration, and generated runtime/server/web
  projections are set-equal. Create rejects a bad family/band/id/digest/model/sampler/layer tuple or a profile combined with request
  overrides; create/resume/rematch/cache preserve the exact reference; same-family/different-band
  identities differ; historical runs infer none. *Fails if* resume resolves latest or the browser
  can replace the profile per move.
- **A2 — one atomic production route.** A non-test fixture executes create → sealed root/legal map
  → shared admitted Maia page + optional all-legal Stockfish result → derived guard/trait → compiler
  execution → post-provider compare-and-swap
  under one writer lease. The browser request contains only run/writer identity, expected node,
  branch and event-head digest, plus a `botreq_` id. Stale-node, stale-branch, stale-event-head,
  wrong-writer and reused-request/different-operands arms refuse; an identical retry returns the
  durable committed event envelope without provider calls. Concurrent first flights replay only a
  byte-identical commit winner and return a typed conflict for different delivered bytes. *Fails if* `/select-move` selection bytes cross the browser, provider
  work is held inside a transaction, or the append does not re-read the root after the awaits.
- **A3 — exact shared source and optional guard authority.** Positive, provider-off, deadline, missing,
  duplicate, mixed-domain, all-mate, bounded, wrong-history, wrong-root, candidate-set mismatch and
  forged-delivery fixtures prove whole-source/guard behavior. The selector imports the exact shared
  delivery/result/payload/score types; baseline legality comes from the sealed root legal map and
  survives every optional Stockfish failure. The persisted decision retains each admitted delivery
  and validates it after save/reload; it creates no provider request, private receipt, cache
  or bare loss. *Fails if* a structurally matching plain object or one candidate annotation can
  apply the guard, or if baseline requires Stockfish.
- **A4 — registered trait authority and dependency.** `pawn_move@1` proves both colours/all files,
  ordinary/double/capture/en-passant/four-promotion positives and castling/non-pawn negatives at the legal-board boundary. Caller strings,
  illegal/duplicate candidates and unregistered classifiers fail. Guard success applies pawn ×4;
  every guard abstention records trait abstention and returns mass byte-equal to base Maia. *Fails
  if* an unguarded pawn-forward distribution can execute.
- **A5 — compiler refusals.** Duplicate authority, a completeness-dependent transform over bounded
  input without an all-legal authority,
  unknown guard profile, unmeasured/unregistered/unguarded trait, delay, memory and learner-derived
  inputs all fail compilation. Forcing ×3 and quiet ×3 remain measured negative registrations.
- **A6 — derivation determinism, operation idempotency.** Same exact root/seed/profile and delivered
  Maia/Stockfish payload identities produce a byte-identical `BotPolicyDerivation` digest across
  restarts; equal-mass ties use `neutralTiebreak` and the composed path records `seedHonored: true`.
  Request id, writer lease and timing occur only in the event-embedded operation record. The parsed
  request and pre-provider digest distinguish writer/root/profile/seed before provider calls; the
  commit digest additionally binds derivation and exact provider identities. *Fails if* elapsed
  time changes the decision digest, a resulting event-head digest creates a circular image, or a
  retry recomputes instead of replaying the committed envelope. It also fails if an advanced-head
  concurrent winner is reported stale before the request winner is compared.
- **A7 — sampler positive control.** The committed R11 captured production sample remains within
  0.5 cp and 0.1 pp of reconstruction; the raw display vector breaks the loss bound by >30 cp. The fixture reads the artifact, not
  restated expected numbers.
- **A8 — atomic persistence and migration.** Move, sealed policy projection, exact root/source/
  candidate digests, layer actions, abstentions and durable operation envelope survive event-log replay
  byte-identically under run 0.18. The append rechecks writer lease, node, branch and event head; a
  failed/stale append saves neither move nor decision, two in-flight requests cannot overwrite each
  other, and historical rows gain nothing.
- **A9 — compiled grounded card.** Baseline/guard/pawn cards compile from registered layers,
  measurements, abstentions, absence/scope and optional exact-digest calibration only. Wrong-digest
  calibration, absent sources, malformed family composition and caller sentences fail. Decorative
  identity reaches only the display slot. *Fails if* a word filter is the grounding mechanism.
- **A10 — availability and degradation.** Optional guard off/deadline/incomplete results keep the
  delivered Maia distribution byte-identical and baseline selectable, make guarded/pawn profiles unavailable when the
  exact provider-health operation state or generation-bound release receipt is red, and never
  present an abstained guard as applied. Baseline ignores Stockfish state; no configuration-presence
  shortcut exists. Maia unavailable/failed
  returns the typed retryable no-move result and commits no selection event; it never falls through
  to an invented “base” move. A below-floor delivered page runs the same declared seeded sampler and
  records degradation. Prediction/human-split paths remain raw Maia consumers.
- **A11 — exact shared-route production budget.** The release operation benchmarks expected
  concurrency and records total/shared-Maia/shared-root-table/guard-derivation/composition durations
  and coverage. Combined p95 ≤400 ms is healthy; p95 >500 ms or any incomplete/late receipt is
  intervention. A 500-ms guard opportunity deadline abstains the guard without failing an already
  delivered baseline distribution. *Fails if* D969's private one-host maximum is relabeled a
  shared-route guarantee.
- **A12 — operation census.** Every one of §10's thirteen operations has a non-test symbol and the
  positive route traverses all thirteen; Stage B additionally consumes exactly one admitted
  candidate packet, retains the bounded Maia intersection and same all-legal root authority, with
  zero child provider/collector calls. A parser, type
  or anchor without runtime consumption does not pass.
- **A13 — wall/dispositions/docs.** Learner-derived inputs and multi-band persona queries remain
  compile-refused; every advertised provider/profile state has a disposition; docs describe the
  atomic route, seals, record, card, budget and degradation; the release journey exercises
  choose → play → resume → rematch through normal Make/CI targets.
- **A14 — ten-return falsifier.** The executable author contract imports the shared provider
  authority and proves: (1) save→reload→retry of the non-circular envelope; (2) twelve exact
  family×band identities across create/resume/rematch/cache; (3) the exact delivery shape and source
  identities; (4) cp/mate/mixed guard algebra without fabricated loss; (5) compiler-owned transform,
  layer and sampled-move outputs; (6) request parsing plus writer/seed/derivation/provider operand
  distinctions; (7) baseline under Stockfish off/deadline/failure; (8) end-to-end bounded-Maia Stage
  B intersection; (9) best legal guard reference outside Maia's window; and (10) below-floor use of
  the declared sampler. Each negative arm mutates a passing positive control. The historical fresh
  review must invert all ten blocker arms while this contract stays green. Reproduction:
  `make bot-policy-author-contract && make bot-policy-fresh-review`.
- **A15 — second-return falsifier and dependency order.** The same author target proves the exact
  Maia3 sampler/model join and 837-cell control; full legal-board pawn matrix; retained/tamper-proof
  deliveries; exact provider-health state/release join; all eight route result arms; generated
  catalog/closed action grammar; and advanced-head concurrent winner/conflict split. The bootstrap
  registers `bot-profile-catalog` absent before this RFC claims first lane 1; provider health lands
  its claim-free authority before bot lane 0.18 and retains acquisition persistence for lane 0.26.
  *Fails if* any dependency is called implemented out of order, a copied enum passes, or a green
  author fixture uses fake model/provider identities.

## Third fresh independent return (2026-08-31)

The D2219–D2226/D2364 repair survives at its named seams, but fresh application to the complete
operation returns five blockers. Exact evidence and executable controls are in
`planning/platform-alignment/bot-policy/third-fresh-independent-buildability-review-2026-08-31.md`.

1. **[[D2407]]:** top-p membership is computed from unnormalized powered weights, and the captured
   positive control never executes that constructor.
2. **[[D2408]]:** the deterministic decision hashes the complete provider delivery, including the
   three timestamps the RFC says are excluded.
3. **[[D2409]]:** save/reload compares a decision digest string with itself instead of recomputing
   the durable decision image, so forged decision fields survive.
4. **[[D2410]]:** the author model recreates four provider-health types rather than importing the
   dependency's exact authority.
5. **[[D2411]]:** request-specific cached-only state becomes general roster availability without a
   request/cache identity.

`make bot-policy-third-fresh-review` passes 5/5. No catalog, schema, migration, route, roster,
client or content implementation is authorized until an author repair inverts these controls and
another fresh independent review passes.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Stage B: the [[D813]] candidate-evidence adapter over the literal landed tactical/breadth ids — feature-weighted personas beyond the O8.2 roster are blocked until it lands | `planning/evidence-foundation-ux/plan.md` | the Stage-B landing commit | |
| D2 | The [[D815]] salience measurement (human severe-error mass conditioned on exact threat-just-created / attacker-just-moved classes, behind tactical landing) — no salience-shaped layer may register before it passes; a failed measurement kills the family | claude | dossier in `design/research/` + ledger flip | |
| D3 | The replacement-preregistered exact-digest roster calibration: band-relative outcome/distribution, clock/time-control scope, severe-tail, trait observability, reproducibility and provider-off receipts; `uncalibrated` is legal registration but not 1.0 completion | claude | calibration dossier + exact profile digests + register/ledger flips | |
| D4 | The human-scale anchor ruling (anchor accounts vs learner-derived Glicko vs stay band-relative) — a cost/policy decision; until ruled, no absolute human Elo is stated anywhere | OWNER | `planning/exploration/log.md` ruling entry | |
| D5 | Owner-use roster validation via the retained 42-branch blind packet (O8.5) — validates or rejects profiles by use; cannot clear H5/C5 population claims | OWNER | `planning/platform-alignment/bot-policy/` + ledger | |
| D6 | Exact atomic production route benchmark at release concurrency clears the 400/500-ms operating contract or returns the guarded families for revision | `bot-policy` | release receipt with image/profile digests and total/Maia/guard/composition distributions | |
| D7 | Provider health is accepted and its claim-free [[D2364]] runtime snapshot/result/release authority lands; bot policy imports those exact symbols and no health copy | `provider-health-degradation.md` | provider-health checkpoint receipt + symbol-level bot join | |
| D8 | Shared-resource bootstrap is accepted/implemented, registers `bot-profile-catalog` as absent, and this RFC atomically adds the unique first-lane-1 claim before acceptance | `shared-resource-register-bootstrap.md` + `bot-policy` | register/check receipt and byte-joined claims block | |

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
- 2026-08-30: author-repaired [[D2087]]–[[D2096]] as one executable operation contract. The run
  event embeds a non-circular decision+operation envelope; the catalog has twelve exact family×band
  identities; the bot consumes the provider author's exact shared delivery/score authority;
  baseline legality is independent of optional Stockfish; cp/mate guard state is correlated and
  references the best all-legal row; one sealed compiler owns transformations and sampling;
  request/pre-provider/commit identities cover every write operand; Stage B retains the bounded
  Maia intersection; and below-floor pages use the declared seeded sampler. `make
  bot-policy-author-contract` passes 11/11; the unchanged historical `make
  bot-policy-fresh-review` fails 10/10, the intended inversion. No production, schema, migration,
  route, roster, content, archive or protected-design byte changed.
- 2026-08-30: author-amended all seven returns. The private provider/guard path is replaced by the
  two admitted shared deliveries; returned probability mass and legal-set equality are separate;
  the decision is a sealed, closed, set-equal derivation whose digest excludes operation bytes; a
  durable request receipt and post-provider node/branch/event-head CAS own idempotency; Maia
  unavailability commits no move; and Stage B consumes one admitted candidate packet plus the
  shared root table with no child work. `make bot-policy-author-contract` is the executable author
  checkpoint. Fresh independent review and the two shared dependencies still gate implementation;
  no product, schema, migration or content byte changed.
- 2026-08-30: fresh independent review returned the author amendment on [[D2087]]–[[D2096]]. The
  ten-arm reproduction crosses the actual shared delivery/score contracts, roster identity,
  persistence/idempotency, compiler-owned derivation, baseline degradation, Stage-B composition,
  all-legal guard reference and below-floor behavior. Exact return:
  `planning/platform-alignment/bot-policy/fresh-independent-buildability-review-2026-08-30.md`;
  reproduction: `make bot-policy-fresh-review`. No production/schema/content byte changed.
- 2026-08-30: second fresh independent review returned the amended draft on [[D2219]]–[[D2226]].
  `make bot-policy-second-fresh-review` records the eight live blockers; no implementation byte
  changed.
- 2026-08-31: third author repair closes the eight executable seams without claiming acceptance.
  Exact pinned Maia3 model/sampler identity and the 837-cell positive control, real legal-board pawn
  classification, retained provider deliveries, provider-health operation/release join, public
  route-result algebra, generated catalog/closed grammar and split retry/concurrent-commit identity
  pass 31/31 plus strict TypeScript. [[D2364]] stages provider health's claim-free authority before bot lane 0.18 and keeps
  durable acquisition at lane 0.26. Fresh review plus both process/provider dependencies still gate
  acceptance and implementation; no product/schema/migration/content byte changed.
- 2026-08-31: third fresh independent review returned the repair on [[D2407]]–[[D2411]]: the
  author sampler truncates unnormalized weights; deterministic identity includes delivery time;
  durable reload accepts forged decision fields; provider-health authority is copied; and
  request-specific cache state is advertised globally. Exact review:
  `planning/platform-alignment/bot-policy/third-fresh-independent-buildability-review-2026-08-31.md`.
