# Non-Maia bot composition — is `HumanPolicyModel` a slot, and can Fairy-Stockfish fill it?

**Question ([[D1153]], owner ruling 2026-08-23):** *"well we just need 'bot capas'? Like don't we
have special bots that consume evidence and shit? So we can make some that don't consume
maia-produced evidence? Like isn't there Fairy-Stockfish as well?"*

**Commissioned by** [[D1153]] to answer the blocking Open question 1 of `rfc/variants.md`
(*"is a Maia-dark Chess960 acceptable?"*). **Feeds** `rfc/variants.md` OQ1/OQ3, `rfc/bot-policy.md`
§2.1/§7/§9, [[D1034]], [[D819]], [[D843]].

**Method and provenance.** Repo claims are verified at the symbol in the working tree of
2026-08-23. **`apps/server/src/opponent-selector.ts` is dirty at the time of this pass** (codex holds
it, along with 25 other files); its line numbers below are working-tree positions and are marked
`(dirty)`. Every other cited repo file is clean at HEAD. External claims carry an inline URL.
Labels per `design/research/README.md`: `[V]` checked this pass against the primary source, `[P]`
source-backed but partial/secondary, `[M]` model knowledge, unverified.

---

## 0. Verdict

**The owner is right about the architecture and wrong about the engine — and the gap between those
two is the finding.**

1. `HumanPolicyModel` **is** a slot in the O8.1 grammar and in the shipped layer union. But the
   slot's contract is not "an engine"; it is **a normalized probability mass over every legal move**.
   The compiled stack has no other basis — `composeBotPolicySelection` reads `rawMass` per candidate,
   sums it into the completeness statistic, and every subsequent layer is a *multiplier* over that
   mass `[V]` (`apps/server/src/bot-policy-catalog.ts:418-538`).
2. **Fairy-Stockfish cannot fill that slot.** It is an alpha-beta searcher with an NNUE *evaluation*
   file; its widest output is MultiPV lines carrying `score cp`, not a policy vector `[V]`. Feed it
   into the shipped stack and the sampler's `p^(1/T)` reconstruction has literally nothing to
   reconstruct from: `rawMass` would have to be synthesized from centipawns by an unmeasured map,
   which is a new, unvalidated `HumanPolicyModel`, not a substitution into the existing one.
3. **A different engine class can fill it.** Policy-head engines — the Lc0 family, which is what
   Maia-1 actually *is* — emit a prior probability for every legal move and support `UCI_Chess960`
   `[V]`. That is the productive reframe of the owner's question, and it moves the problem from
   "no instrument exists" to "no *human-trained 960* weights exist", which is a data problem with a
   known price rather than an architectural wall.
4. **Fairy-Stockfish still has a real job here** — as the `ErrorGuard`'s pricing engine and as the
   Tier-2 legality/adjudication instrument — just not as the base layer.
5. **Human-likeness of an engine-composed bot is an open measurement, not an assumption**, and the
   literature predicts it fails: this is exactly the "candidate roulette" family whose failure mode
   is documented (§4). The experiment that would settle it is designed in §5 and is cheap.
6. **Chess960 has a second, harder blocker nobody has recorded**: our pinned Maia sidecar is not
   merely out of distribution in 960 — it is **structurally incapable of parsing it** `[V]` (§3.4).

---

## 1. What the composition actually requires of its base layer

### 1.1 The contract, read off the shipped code

`rfc/bot-policy.md` §2.1 states the base-layer contract in prose. The shipped catalog states it in
types, and the types are narrower than the prose. All `[V]`, `apps/server/src/bot-policy-catalog.ts`
(clean at HEAD):

| Requirement | Where | What it demands |
|---|---|---|
| Layer kind exists as a slot | `:5-15` | `BOT_LAYER_KINDS` includes `human_policy_model`; a profile without one fails compilation (`:257`) |
| The base layer's **effect** | `:48-55` | `HumanPolicyModelLayer.effect` is the literal `"base_distribution"` — not a score, not a ranking |
| The declared **input vocabulary** | `:16-19` | `BotPolicyInput = "provider.maia.raw_policy" \| "provider.stockfish.fixed_bound_loss" \| \`evidence.${string}@${number}\`` — **a closed union with exactly one base-distribution provider, and it is named Maia in the type** |
| Model identity fields | `:48-55` | `engineId`, `modelId`, `band: number`, `historyCapability: "full_history"` |
| Band validation | `engine-band.ts:68` | `appliedTargetElo` refuses a request outside the engine's advertised/configured `Elo` spin range and raises `TARGET_ELO_REQUIRED` when the engine is band-calibrated with no default |
| The per-candidate payload | `:131-138` | `BotPolicyCandidateInput` requires `moveUci` and **`rawMass: number`**; everything else (`guardLossCp`, `traits`, `repertoirePrior`, `features`) is optional |
| The completeness statistic | `:310-345` | `completeness = Σ rawMass` over the returned rows, checked against the profile's `completenessThreshold` before the stack applies |
| Full legal width | `opponent-selector.ts:619` *(dirty)* | the Maia request asks `MultiPV = max(8, legalMoveCount(position))`, capped by the engine's advertised MultiPV maximum; `legalMoveCount` at `:306` *(dirty)* |
| The measured floor | `rfc/bot-policy.md` §2.1 | median raw-mass sum **0.999625**, minimum **0.979540** at MultiPV-20 on the pinned image; the default `completenessThreshold` is 0.97, deliberately below the measured minimum `[P]` (RFC quotes the R11 capture; not re-measured this pass) |

### 1.2 What the sampler does with it, and therefore what it cannot do without it

`reconstructMaiaDistribution` (`:310-345`) `[V]`:

1. sums raw mass → `completeness`;
2. tempers by `mass^(1/T)` and renormalizes;
3. sorts by descending tempered mass, ties broken by the injected `compareEqualMass` comparator
   (production passes `neutralTiebreak`, `opponent-selector.ts:~349` *(dirty)*);
4. keeps the prefix while `cumulative <= topP`, always forcing at least the top-1;
5. renormalizes.

Every downstream layer is `applyPolicyMultiplier` (`:347-355`) — guard = multiply by 0/1; trait =
multiply by the declared multiplier; repertoire = multiply by the prior — then renormalize, then
draw with `seededPolicyUnit` (`:378`).

**The consequence is arithmetic, and it is the whole answer to the owner's question.** A multiplier
over a distribution that does not exist is still nothing. `p^(1/T)` is a *re-tempering* operator: it
undoes a softmax temperature that was applied to logits the model already produced. It presupposes
that `rawMass` is a probability the base model assigned. There is no defined behaviour, and no
measured behaviour, for feeding it a number derived from centipawns.

### 1.3 Which requirements are Maia-specific and which are generic

| Requirement | Maia-specific? | Notes |
|---|---|---|
| Raw policy vector at full legal width | **Yes, in kind** — but not in vendor | Any policy-head network can supply it; no alpha-beta engine can (§2.3) |
| Completeness statistic (`Σ rawMass`) | Generic **given** a policy vector; meaningless without one | For a score-based provider the natural analogue is "did the MultiPV window cover every legal move", which is a *coverage* fact, not a *mass* fact |
| `p^(1/T)` reconstruction with topP truncation | **Maia-specific by derivation** | It exists because the pinned maia3 UCI samples from `softmax(logits/T)` then top-p truncates, and our production defaults are `T=0.8`/`topP=0.92` (`opponent-selector.ts:90-91`, `:596-599` *(dirty)*) — different from maia3's own defaults of `temperature=1.0`/`top_p=1.0` `[V]` (fetched `maia3/uci.py` at the pinned commit, below). A different base model needs its own reconstruction layer and its own positive control |
| `appliedTargetElo` / `engine-band.ts` band validation | **Generic** | It keys on `health.identity.eloHonored` and the engine's declared `bandOption` (`maia.ts:28,45` sets `bandOption: "Elo"`). Any engine advertising a band spin option validates through the same path unchanged |
| `historyCapability: "full_history"` | **Maia-specific** | The pinned sidecar runs `--use-uci-history` and the server sends `position fen <start> moves <complete history>` on every request (`docs/engine-workers.md` §Maia-3 sidecar). A conventional engine is position-conditioned; the field would need a second member |
| Layer identity, digest, disclosure, trait gate, learner-input wall | **Generic** | `assertLayer` (`:180-240`) is provider-agnostic; the `LEARNER_INPUT` wall at `:171` and the trait gate at `:219-234` bind any base model equally |

**So: three of six are generic and would survive a base-model swap unchanged. The three that do not
are exactly the three that make the bot a *distribution* rather than a *choice*.**

### 1.4 Where the roster stands

`BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` — **the shipped roster is empty** `[V]`
(`:296`), with the in-code comment *"D970 keeps the concrete band/profile roster closed until the
accepted RFC pins it."* And `composeBotPolicySelection` has **no caller in `apps/server/src` outside
its own test** `[V]` (grep over `apps/server/src`, `packages/runtime/src`). The composed path is
built and unwired. This matters for §8: a non-Maia profile is not competing with a shipped Maia
roster; it is competing with *nothing shipped*, which lowers the bar for a labelled-as-uncalibrated
960 opponent considerably.

---

## 2. Fairy-Stockfish, specifically

### 2.1 What it is

*"Fairy-Stockfish is a chess variant engine derived from Stockfish designed for the support of fairy
chess variants and easy extensibility with more games."* `[V]`
(<https://github.com/fairy-stockfish/Fairy-Stockfish> README, fetched this pass). It speaks *"the
UCI, UCCI, USI, UCI-cyclone, and CECP/XBoard protocols"* `[V]` (ibid.).

### 2.2 Variants and Chess960

Supported families include the regional games (Xiangqi, Shogi, Janggi, Makruk), chess variants
(Capablanca, Crazyhouse, Bughouse, Atomic, Horde), and related games (Amazons, Ataxx, Breakthrough,
Connect Four); **Chess960 is listed under the chess variants** `[V]` (README). User-defined variants
load from a `variants.ini` configuration file via the `VariantPath` option `[V]` (README; wiki
*Settings*).

Two UCI options carry the variant axis `[V]`
(<https://github.com/fairy-stockfish/Fairy-Stockfish/wiki/Settings>):

- **`UCI_Variant`** — *"The most important option, since it allows to set the variant that is going
  to be played."*
- **`UCI_Chess960`** — *"Used as a universal flag to switch between Chess960-style shuffling variants
  and the respective normal variant."*

The full registered option table (fetched from `src/ucioption.cpp` at master `[V]`) is Stockfish's
plus four: `UCI_Variant` (combo, default `chess`), `VariantPath` (string), `TsumeMode` (check),
`usemillisec` (check). `MultiPV` is spin 1–500. `Skill Level` is spin −20…20, `UCI_LimitStrength`
check, `UCI_Elo` spin 500–2850. **There is no option that emits move probabilities.**

### 2.3 Why its output is not a policy vector — stated at mechanism

Fairy-Stockfish inherits Stockfish's architecture: alpha-beta search with an NNUE **evaluation**
function. The option is literally `EvalFile` — *"The name of the NNUE evaluation parameter file"*
`[V]` (wiki *Settings*) — and `Use NNUE` is a check `[V]` (`ucioption.cpp`). An NNUE net maps a
position to a scalar evaluation; it has no policy head and emits no per-move prior `[M]` (architecture
inference; supported by the absence of any such option in the full registered table `[V]`).

What MultiPV-*n* gives is *n* ranked principal variations, each with `score cp` (or `mate`). Three
concrete breaks against §1.1:

1. **No `rawMass`.** `BotPolicyCandidateInput.rawMass` would have to be manufactured. Any map from cp
   to mass (softmax over −loss, Boltzmann with a temperature, a Regan-style `e^−(δ/s)^c`) is **a new
   human-policy model with its own free parameters**, which under §3's parameter-provenance rule
   needs a cited measurement over a declared population before it can compile — and none exists.
2. **The completeness statistic becomes a category error.** `Σ rawMass ≈ 1` is a statement that the
   model's probability mass was returned intact. `Σ softmax(−cp_i/τ) = 1` by construction *regardless
   of how few moves were searched* — it would pass the 0.97 threshold vacuously at MultiPV-3. The
   guard that protects against a truncated vector would stop guarding anything. This is a **silent**
   failure, which is the worst class.
3. **`p^(1/T)` has no referent.** There is no prior softmax to invert. The layer's permanent
   conformance fixture (criterion A4, the 0.27 cp / 0.03 pp positive control against the captured
   production sample) is *specifically a Maia fixture* and cannot be re-run against a cp-derived
   distribution; a non-Maia sampler ships with **no positive control at all** until one is built.

### 2.4 Licence

Fairy-Stockfish: *"Fairy-Stockfish is free, and distributed under the GNU General Public License
version 3 (GPL v3)"*, with the obligation that *"whenever you distribute Fairy-Stockfish in some way,
you MUST always include the full source code, or a pointer to where the source code can be found"*
`[V]` (README).

**This repo is AGPL-3.0 and the combination is expressly permitted by our own licence text.**
AGPL-3.0 §13, second paragraph, verbatim from `LICENSE:552-558` `[V]`:

> *"Notwithstanding any other provision of this License, you have permission to link or combine any
> covered work with a work licensed under version 3 of the GNU General Public License into a single
> combined work, and to convey the resulting work. The terms of this License will continue to apply
> to the part which is the covered work, but the work with which it is combined will remain governed
> by version 3 of the GNU General Public License."*

🟢 **No new legal question.** The posture is already established twice over: Stockfish 18 (GPL-3.0)
ships as a supervised UCI child process through a checksum-pinned installer, and Maia ships as a
GPL-licensed model in a container we build and whose patch we publish
(`workers/maia/patches/maia3-uci-policy-mass.patch`, described in `workers/maia/README.md` as adding
no chess logic). `design/research/stack-selection.md:54-56` already recorded the AGPL⟂GPL-3.0
compatibility judgement for `lila-stockfish-web` — which itself ships a Fairy-Stockfish build `[V]`.
The one live obligation is the source-availability pointer, which the existing sidecar packaging
discipline already discharges.

### 2.5 Container / UCI surface — is it sidecar-able the way Maia is?

Yes, and more cheaply than Maia. `[V]`/`[P]`:

- It is a plain UCI binary. `EngineSupervisor` spawns any configured command, completes
  `uci`/`uciok`, records the advertised option table and identity, and applies configured options
  verbatim — `for (const [name, value] of Object.entries(this.#spec.options ?? {}))`
  (`engine-supervisor.ts:330`) `[V]`. `UCI_Variant`/`UCI_Chess960` are ordinary `setoption` values
  needing **zero** supervisor work.
- No Python runtime and no GPU. Unlike Maia (Docker-required, Python 3.12 + torch + a pinned
  checkpoint, `docs/engine-workers.md` §Maia-3 sidecar), Fairy-Stockfish is a static-ish C++ binary
  — the `tools/install-stockfish-linux.sh` checksum-pinned-installer pattern applies directly.
- Bindings exist if ever wanted: `pyffish` (PyPI), `ffish.js` (npm), and a WebAssembly port `[V]`
  (README).
- **No official Docker image was found this pass** `[M]` — we would build our own, exactly as for
  Maia. This is a cost line, not a blocker.
- Optional variant NNUE files exist for Xiangqi/Janggi/Makruk `[V]` (README); Chess960 needs none,
  since it is standard-chess evaluation.

### 2.6 And Stockfish itself already does Chess960

`UCI_Chess960` is a standard Stockfish option and the engine supports FRC and DFRC `[P]`
(<https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html> and the Stockfish
wiki *UCI & Commands*, via search this pass; the option's presence is independently `[V]` from the
Fairy-Stockfish fork's `ucioption.cpp`, which inherits it).

**We already refuse it on a product opinion.** `apps/server/src/capabilities.ts:133` `[V]`:

```ts
{ instrument: "Stockfish", capability: "UCI_Chess960", disposition: "refused", reason: "The shipped drill format is standard chess only", advertisedOptions: ["UCI_Chess960"] },
```

[[D1030]]'s class exactly: a **product** judgement enforced at startup that was never put to the
owner. `rfc/variants.md` §5 already amends (not deletes) it. **For Chess960 we do not need
Fairy-Stockfish at all** — the shipped Stockfish 18 covers Tier 1 with one option flip. Fairy-Stockfish
earns its keep only at Tier 2 and beyond, where Stockfish's cp output is *wrong, not missing*
([[D1034]], `rfc/variants.md` §2.2).

---

## 3. The engine class that *can* supply the base-layer contract

This is the part of the owner's question that has a "yes" in it.

### 3.1 Policy-head engines emit exactly what the slot wants

Lc0 exposes per-move policy priors: `VerboseMoveStats` / `--verbose-move-stats` — *"Display Q, V, N,
U and P values of every move candidate after each move"* `[V]`
(<https://github.com/LeelaChessZero/lc0/wiki/Lc0-options>). **P is the network's policy prior**, and
"every move candidate" is the full legal set at the root. That is `rawMass` at full legal width, with
a completeness statistic that means what our code thinks it means.

### 3.2 Lc0 supports Chess960

*"Lc0 v0.23.0 added support for Fischer Random Chess with the `UCI_Chess960` option to enable
FRC-style castling"*, with FRC-compatible weight files, and *"the last required pieces for Chess960
support were included in Lc0 v0.25, making it possible to start training for Chess960"* `[P]`
(<https://lczero.org/blog/2019/12/lc0-v0230-has-been-released/> and
<https://lczero.org/blog/2020/05/lc0-v0.25-has-been-released/>, via search this pass; release notes
not fetched verbatim).

### 3.3 Maia-1 *is* an Lc0 net — which is the fact that reframes everything

*"A collection of chess engines that play like humans, from ELO 1100 to 1900"*; the released models
are **Leela Chess Zero neural network weights** and *"they are just brains (weights) and require a
body to work"*; *"unlike most other engines you want to* disable *searching, a nodes limit of 1 is
what we use"*; licence GPL `[V]`
(<https://github.com/CSSLab/maia-chess> README, fetched this pass). Training corpus: Lichess games
January 2017 – November 2019, standard chess only `[V]` (ibid.).

**So the base-layer slot is not "Maia or nothing" and never was — it is "a policy head or nothing".**
The blocker in Chess960 is not the runtime, the protocol, the supervisor, or the licence. It is that
**no human-trained policy head for 960 exists publicly** `[M]` (absence checked this pass by search;
absence of evidence, and a targeted search of Lichess 960 bot rosters was not run — see Gap 9).

### 3.4 A previously unrecorded, harder blocker: our Maia sidecar cannot *parse* 960

Every prior record ([[D1034]], [[D327]], `rfc/variants.md` §Summary) says Maia is *dark* in 960
because a randomised back rank is out of distribution. True, and insufficient. The pinned adapter is
**structurally incapable**, which is a different and more absolute claim.

`maia3/uci.py` at the pinned commit `1e13597c42d4858b7cfd7cfdae01e297263364b2` (the commit
`workers/maia/Dockerfile:13-15` clones and verifies) constructs the board as `chess.Board(fen)` and
`chess.Board()` — **no `chess960=True`** `[V]` (fetched the file at that exact commit this pass). It
also carries no variant handling of any kind, and its policy is a mask over a fixed ~5,400-entry move
vocabulary `[V]` (ibid.).

python-chess: *"Optionally supports chess960. In Chess960, castling moves are encoded by a king move
to the corresponding rook square"*, and *"castling moves are normalized to king moves by two steps,
except in Chess960"* `[V]`
(<https://python-chess.readthedocs.io/en/latest/core.html>, fetched this pass). With
`chess960=False`, king-takes-rook UCI is not the castling dialect the board speaks.

**Consequence:** in a 960 position our sidecar would, at best, mis-handle castling on both the input
history and the output move — silently, since the move `e1h1` may still parse as *something*. This is
not a distribution-quality issue that a measurement could rescue. It is a two-line patch upstream
plus a re-pin plus a rebuilt image plus a fresh policy-mass positive control — i.e. exactly the work
a **new base model** costs, with none of the benefit, since the model would still be out of
distribution afterwards. **The honest conclusion is that "Maia goes dark in 960" is if anything
*understated* in `rfc/variants.md`, and this dossier strengthens rather than weakens that RFC's
Summary.**

---

## 4. The honest question: human-LIKE, or only controlled-imperfect?

The owner's composition — engine + `ErrorGuard` + `ControlledTrait[]` + sampler — is a real thing
that would produce real games. The question is what may be *said* about it.

### 4.1 Where Maia's human-likeness comes from

Maia's policy vector **is** a model of what humans at a band play. Move-matching against
rating-binned Lichess players: Maia reaches 46–52% and each band's curve peaks at the band it was
trained on `[V]` (`design/research/human-like-opponents.md` §2.1, citing
[arXiv 2006.01855](https://arxiv.org/abs/2006.01855)). Nothing in the composition layers supplies
that; they *shape* it.

### 4.2 What an engine + guard + traits + sampler is, in the field's own taxonomy

It is the **candidate-roulette family**, and the family's failure mode is documented from three
independent directions `[V]` (`human-like-opponents.md` §2.1, §4):

- **Mechanism, from Stockfish source:** skill mode forces MultiPV ≥ 4 and picks among the engine's
  own top candidates with a weakness-scaled bonus plus a random term, the candidate window capped at
  one pawn (`delta = min(topScore - minScore, PawnValue)`). Three properties follow: the error menu
  is *the engine's* candidate list, error size is bounded noise rather than a heavy tail, and error
  placement is uncorrelated with human difficulty.
- **Measurement:** depth-limited Stockfish matches human moves 33–41% and *its accuracy rises with
  the rating of the human being predicted* — depth 15 matches 1900s five points better than 1100s —
  while different depths perform almost identically despite large strength differences. The same
  holds for Lc0 at ordinal strengths 800–3200.
- **Reception:** *"Typical bot play is, inhumane move, inhuman move, inhumane blunder"* `[V]`
  (chess.com forum, cited in §4).

Our stack differs from naive skill-level weakening in two ways that genuinely help — the guard is a
*mask* over a distribution rather than a random promotion, and every layer is declared and recorded
— but **the base distribution is still the engine's own candidate ordering.** The prior is therefore
that a cp-derived base plays *engine chess with structured noise*, and the burden is on the
measurement, not on the doubt.

### 4.3 What may honestly be claimed today

| Claim | Status for a Maia-based profile | Status for an engine-composed profile |
|---|---|---|
| plays legally, deterministically, explainably | yes | **yes** — the record, digest, and seeded draw are provider-agnostic (`bot-policy-catalog.ts:418-538`) |
| errs on a declared, disclosed schedule | yes | **yes** — that is exactly what a guard + trait composition is |
| errs *where humans err* | measured for the endgame case: 84 errors on 6 of 45 positions, 5 distinct moves, all `win→draw`, zero `win→loss` `[V]` (`maia-endgame-fidelity.md`) | **unknown, and the prior is negative** (§4.2) |
| "human-like" | **refused** — H5/C5 unmet as population claims (`planning/exploration/gates.md`); `rfc/bot-policy.md` §9.2 | **refused**, harder |
| a stated Elo | only with a cited calibration ([[D819]]) | only with a cited calibration ([[D819]]) |

The compiler already enforces the vocabulary half of this: `REFUSED_PERSONA_CLAIM`
(`bot-policy-catalog.ts:172`) fails compilation of any presentation layer whose name or bio contains
`human-like`, `aggressive`, `solid`, `tactical`, `positional`, `tricky`, `adaptive`, or `plays like`
`[V]`. **A non-Maia profile inherits that refusal for free.** The honest product name for what an
engine composition ships is *"controlled imperfection, disclosed"* — which is a defensible thing to
sell and a different thing from what Maia sells.

---

## 5. The experiment that would settle it

Predeclared, reusing `tools/d333-band-outcome-harness/` and [[D341]]'s seeding rules. This is
[[D819]]'s Discharge-D3 instrument applied to a new arm class; nothing new is invented.

**Arms** (each a compiled profile digest, so the calibration binds to the composition, per §7):

| # | Arm | Role |
|---|---|---|
| A | Maia band *b*, production sampler (`T=0.8`, `topP=0.92`) | the reference the ladder is already gauged against |
| B | Maia band *b* + `guard.severe_error@1` | the shipped Guarded-human shape |
| C | Stockfish (or Fairy-Stockfish with `UCI_Chess960`), fixed node bound, **cp→mass Boltzmann base** at temperature τ, + guard + sampler | the candidate the owner is asking about |
| D | Stockfish `UCI_LimitStrength`/`UCI_Elo` at the target | **negative control** — rejected doctrine (`capabilities.ts:128`), retained precisely so the instrument can show C is or is not better than it |
| E | Band-binned **human reference games** from the corpus | the distribution the acceptance test compares against, not a playing arm |

**Harness settings, inherited verbatim from the D333 README** `[V]`: paired openings from the
committed pack corpus with colour swapped inside each pair; the paired mean as the primary estimator
with cluster-robust CIs; **explicit distinct `--seed` per worker and an odd worker count**; count
distinct move lists; **treat a zero-variance control as a defect rather than a result** ([[D341]] —
the first D333 run returned 611/611 byte-identical mirrored pairs and a paired score of exactly
0.500000 with SE exactly 0.0). Termination natural or a 300-ply cap scored as a draw; **no engine
adjudication of any kind**. Size **~500–800 games per arm for ±25 Elo** (95% CI ≈ ±500–700/√n).
Every label is time-control scoped.

**The acceptance test — mean Elo is explicitly insufficient.** Per arm, compare against arm E:

1. **Eval-loss histogram**, not mean centipawn loss. Regan & Haworth fit human move choice at Elo
   mileposts 1600–2700 with move probability ∝ `e^−(δ/s)^c`, where *s* falls smoothly from .078 at
   2700 to .165 at 1600 while *c* stays in 0.430–0.545 `[V]`
   ([ReHa11c.pdf](https://cse.buffalo.edu/~regan/papers/pdf/ReHa11c.pdf), read in the R11 pass;
   summarized in `human-like-opponents.md` §2.2). **Two parameters under one Elo is the formal
   statement of the failure mode**: an arm can match a 1400 mean while carrying an (s,c) split no
   human 1400 has. Fit (s,c) per arm; a pass requires *both* inside the band's human envelope.
2. **Blunder-rate-by-magnitude profile.** Chabris & Hearst, 1,188 GM games / 110,164 moves: true
   blunders (≥1.5 pawns) per 1,000 moves were **5.02 classical, 6.85 rapid (+36.5%), 7.63 blindfold**,
   with fast conditions producing *"more than twice the number of really big blunders"* `[V]`
   ([Chabris2003.pdf](https://www.chabris.com/Chabris2003.pdf)). The shape to match is the **tail**,
   at the arm's own time control. Arm C's predicted failure is a truncated tail — the guard removes
   the ≥250 cp mass by construction, and cp-Boltzmann has no heavy tail to begin with.
3. **Move-match rate against band-binned human games** — the Maia paper's own instrument, which
   makes arm C directly comparable to the published 33–41% (search-based) vs 46–52% (Maia) split
   `[V]` (§2.1). This is the single cheapest discriminator and it needs no games played at all: it
   runs offline over the surviving R11/D815 capture (837 position-band cells, three bands,
   MultiPV-20, zero engine calls); the raw capture is not committed and D1166 owns that
   reproducibility debt `[P]` (`human-like-opponents.md` §9.1; D1166).

**Predeclare the bounds before reading results** (the R11 discipline). **Experiment 3 ran as
D1163** — it was free and used the surviving capture. Its formal verdict abstained because the
Maia positive control did not identify its own bands; all engine-derived profiles nevertheless
peaked on the 1800 human band. The game ladder is not funded from that screen `[V]`
(`engine-composed-band-discriminator.md`).

**Stated limitation:** this instrument measures *distributional* resemblance. Perceived humanness
over 10–20 plies is H5/C5, whose denominator is still zero (`gates.md`; [[D649]] descoped recruited
review). A passing distribution test does **not** license the phrase "human-like" (§4.3).

---

## 6. "Bots that consume evidence" — what the owner's phrase maps to

**It maps to a real, shipped mechanism — and that mechanism is a hat, not a head.**

### 6.1 What exists

- `candidateFeatureVector` (`apps/server/src/candidate-evidence.ts:187`) — [[D813]], ledgered ✅
  implemented 2026-08-22 — applies the registered tactical and breadth collector projections to every
  legal candidate's child position, retaining each literal projection id beside one fixed-bound
  root-frame Stockfish score `[V]`. Its admitted id set is
  `TACTICAL_COLLECTOR_PROJECTION_IDS ∪ BREADTH_COLLECTOR_PROJECTION_IDS` `[V]` (`:66-69`). It enters
  the plane only through `opponent.selection@1` `[V]`
  (`packages/runtime/src/evidence-catalog.ts:884`).
- The layer input vocabulary admits evidence ids: `` `evidence.${string}@${number}` `` `[V]`
  (`bot-policy-catalog.ts:16-19`).
- The persisted record carries per-candidate `features`, each naming its literal source id `[V]`
  (`:161`).

**That is Stage B of `rfc/bot-policy.md` §5, and it is what the owner is remembering.**

### 6.2 What it can key on, and what it cannot do

The trait layer's runtime behaviour is one line (`:508-510`) `[V]`:

```ts
rows = applyPolicyMultiplier(rows, (moveUci) => input.candidates.find((c) => c.moveUci === moveUci)?.traits?.includes(layer.classifier) === true ? layer.multiplier : 1);
```

Three precise findings:

1. **The trait keys on `traits: readonly string[]`, not on `features`.** `features` is carried into
   the record for explainability and **plays no part in the composition** `[V]`. Nothing in
   `apps/server/src` maps a feature vector to a `traits` array today; the binding an evidence-keyed
   trait needs does not exist yet.
2. **Every trait is a multiplier over `finalMass`, and `finalMass` comes from the base model.**
   A trait cannot *originate* mass. If `rawMass` is absent, `applyPolicyMultiplier` multiplies zero.
   **An evidence-keyed trait is therefore strictly a modifier on top of a human policy vector, never
   a substitute for one.** To answer the owner's distinction directly: *the same bot wearing a hat*,
   not a different kind of bot.
3. **Registering one is gated per trait, not per family.** `assertLayer` (`:219-234`) fails any
   controlled trait without a cited dossier and population, or that misses **≥0.1 trait delta,
   ≤35 cp expected-loss shift, ≤0.01 severe-mass rise, ≥0.90 explorer-match retention** `[V]`. The
   only v1-eligible trait is `trait.pawn_preference@1` (pure board arithmetic); forcing ×3 and quiet
   ×3 are permanent negative fixtures. And under §3's parameter-provenance rule, an evidence-keyed
   trait's multiplier needs its own measurement over a declared population.

**A genuine "evidence-to-move selector" in the [[D810]] sense** — features → weights → distribution,
with no policy net underneath — **is a fourth thing** that neither the RFC nor the code contains: it
would be a *new `HumanPolicyModel` implementation* whose output is a distribution learned or fitted
over candidate features. That is buildable (the R11 capture corpus is the training set, and it is
committed), it is variant-portable in principle, and it is a research programme, not a configuration
change. It is Gap 4.

---

## 7. The label consequence

[[D819]]'s rule, normative in `rfc/bot-policy.md` §7: **a bot's stated Elo is a measured claim with
its measurement cited, or it is not stated.** And a composition change invalidates calibration,
because the profile digest is an RFC-8785 SHA-256 over the canonical composition including every
layer declaration `[V]` (`bot-policy-catalog.ts:241-273`): change the base model and the digest
changes, so any inherited calibration is void by construction, not by policy.

**A non-Maia 960 profile therefore ships `uncalibrated`, and it is enforced, not promised.** What it
costs, in learner-facing terms:

| Surface | With a calibrated profile | With the 960 engine-composed profile |
|---|---|---|
| Profile card strength | a figure with harness, date, games, CI, time control | **no number at all** — the card shows model identity, active layers, and the guard disclosure only (A11 negative fixture) |
| Opponent picker | "choose your band" | "choose your opponent", no ladder — 960 has no measured rungs |
| Rating | only the calibrated value may feed a rating update ([[D344]]); `targetElo` never may | **960 results are unrated** — this is `rfc/variants.md` OQ3's recommended answer and this dossier supports it: `capabilities.ts:148` already refuses rating from engine-adjudicated outcomes, and there is no measured opponent scale in 960 |
| Progression / campaign | difficulty is a dial | **no difficulty dial exists in 960**; the engine's node bound is a strength knob nobody has gauged |
| Honest sentence to the learner | "Maia at band 1500, guarded at 250 cp" | *"A Stockfish-based opponent that avoids severe errors. Its strength has not been measured against human play."* |

**That last row is the whole cost, and it is smaller than it looks** — because today the 960 learner's
alternative is `strong_engine` at 50,000 nodes per move (`docs/engine-workers.md` §Ratified
strong-engine profile), which is *also* uncalibrated and is additionally overwhelming. A disclosed,
uncalibrated, guarded, seeded, explainable engine composition is **strictly better than what
`rfc/variants.md` currently proposes to ship**, and it is honest about being worse than the standard-
chess opponent. That comparison is the argument, not the absolute quality.

---

## 8. Does this unblock the variants RFC?

**Partially, and in a specific direction: it converts OQ1 from a yes/no fork into a three-way choice
with a recommended answer, and it adds one new blocker the RFC does not yet carry.**

`rfc/variants.md` Open question 1 asks whether a Maia-dark Chess960 is acceptable. The options this
dossier can now price:

| Option | Cost | Honesty | Verdict |
|---|---|---|---|
| **(a) 960 ships with `strong_engine` only** — the RFC's current text | zero | honest but hostile: 50k nodes/move against a learner | the status quo the owner rejected |
| **(b) 960 ships with an engine-composed profile, labelled uncalibrated** | one new `BotPolicyInput` member, a cp→mass base layer + its own sampler and positive control, a `historyCapability` widening, `capabilities.ts:133` amended, one disposition row; **no** schema lane | honest **if and only if** §7's label rule is enforced and §4.3's vocabulary refusal holds | **recommended** — it is the owner's answer, it is buildable, and it is better than (a) on every learner-facing axis |
| **(c) 960 ships without a bot until human-likeness is measured** | zero build, indefinite delay | maximally honest, minimally useful | **not recommended** — §5's experiment 3 is free and would run in parallel; blocking a surface on a measurement that has not been funded is [[D1030]]'s pattern again |

**Recommended ruling text for OQ1:** *960 ships with an engine-composed opponent, disclosed and
labelled uncalibrated, with the human-likeness measurement (§5) commissioned in parallel and its
result binding on what the card may say.* This closes OQ1 without pre-empting [[D819]], and it does
not require any base-model work in the variants RFC itself.

**What it does not unblock, and one thing it makes worse:**

- **OQ2 (960 explorer data)** — untouched by this pass.
- **OQ3 (is a 960 result rated?)** — §7 supports the RFC's own recommended answer: **unrated,
  stated**.
- **New:** `rfc/variants.md`'s acceptance criterion 5 (*"the three Maia-backed opponent modes are
  absent from a 960 start's offered set"*) is **necessary but not sufficient**, given §3.4. The
  suppression must be enforced where the request is built, not only where the set is offered,
  because the failure mode is a *silently mis-parsed castling move*, not an error. `policyUsesMaiaBand`
  (`engine-band.ts:92`) is the existing predicate that names the three modes and is the natural
  enforcement point `[V]`.

---

## 9. Gaps — what an RFC author must decide

1. **Widen `BotPolicyInput`, or add a second base-provider member?** The union at
   `bot-policy-catalog.ts:16-19` names Maia in the type. Adding e.g. `"provider.engine.candidate_loss"`
   is a one-line type change and a large semantic one, because it is the moment `HumanPolicyModel`
   stops meaning "human". **Recommendation: rename the kind's *meaning* in the RFC, not the type** —
   declare a `BasePolicyModel` semantics with `humanTrained: boolean` on the layer, so the card can
   say which it is and the compiler can refuse the word "human" on an engine base.
2. **The cp→mass map is a new model and needs its own gate.** Boltzmann over −loss at temperature τ
   is the obvious form; τ has no dossier. It must clear the parameter-provenance rule (§3 of the RFC)
   before it compiles. **Owner-level fork:** is fitting τ against the R11 human captures acceptable,
   or does fitting a bot parameter to human data cross a line? (It does not cross [[D843]]'s wall —
   that wall is about *learner* data, not population corpora — but it should be named.)
3. **The completeness statistic must be redefined for a score-based base, or the guard goes vacuous.**
   §2.3 item 2. The honest analogue is *legal-set coverage* (`returned candidates == legalMoveCount`),
   which is what [[D816]] already requires opponent-side breadth to carry. **Trap:** reusing the
   0.97 threshold on a cp-derived distribution passes vacuously and looks green.
4. **Is a true evidence-to-move base model in scope?** §6.2's fourth thing — [[D810]]'s original
   ideation, the only route that is both variant-portable *and* potentially human-shaped. It is a
   research programme with a committed training corpus. **Owner-level:** fund it, defer it, or refuse
   it. Refusing it should be recorded, not implied ([[D1030]]).
5. **Which engine for the 960 base?** Stockfish 18 with `UCI_Chess960` is already deployed and needs
   one option; Fairy-Stockfish needs a new image and buys nothing at Tier 1. **Recommendation:
   Stockfish for Tier 1; Fairy-Stockfish is a Tier-2 RFC's dependency, not this one's.**
6. **`historyCapability` must widen.** `HumanPolicyModelLayer.historyCapability` is the literal
   `"full_history"` (`:54`). An engine base is position-conditioned. This also changes what the
   request must send and therefore the cache key.
7. **`capabilities.ts` dispositions.** `:133`'s `UCI_Chess960` row is amended per `rfc/variants.md`
   §5. A new row is owed for *"engine candidate loss as a base policy distribution"* — and it should
   be `unmeasured`, not `reached`, until §5 runs. **Trap:** the `assertAdvertisedCapabilityDispositions`
   startup gate makes an uncovered advertised option a startup error, so this cannot be deferred.
8. **Law 8 and [[D1034]]: the guard's engine must model the variant it guards.** At Tier 1 this is
   satisfied — a 960 position is standard chess and Stockfish's cp is correct with `UCI_Chess960` set.
   **At Tier 2 it is not**, and the failure is silent: an `ErrorGuard` pricing an Atomic position
   with a standard-chess evaluator masks candidates on a *wrong* number, and the mask is invisible in
   the record because the record stores `guardLossCp` without a rules-frame. **Any Tier-2 bot RFC
   must carry a rules-identity field on the guard declaration, or refuse the guard entirely.**
9. **Absence-of-evidence check.** "No public human-trained 960 policy net exists" is `[M]` here.
   Cheap to upgrade: enumerate the Lichess 960-capable bot roster and the Lc0 FRC network list. One
   afternoon; do it before funding any training work.
10. **The 960 Maia parse defect (§3.4) needs a ledger row of its own** — it is a correctness finding
    about a shipped container, independent of whether any 960 surface ever ships.
11. **[[D843]] provenance wall — verify it is not weakened by the swap.** `LEARNER_INPUT`
    (`:171`) is a regex over input *names*, and §3 of the RFC extends the wall to parameter
    *provenance*. A cp→mass temperature fitted per-learner would pass the regex and violate the wall.
    **The A9 census must inspect the new base layer's `parameterCitation`, not just its `inputs`.**
12. **Trap — do not let the composed 960 path acquire a strength number by inheritance.** The digest
    mechanism prevents it structurally (§7), but the *picker UI* is a separate surface
    (`play-composition`) and is where an "≈1500" would sneak in as a helpful hint.

---

## 10. Limits of this pass

- **Nothing was run.** No engine was launched, no game was played, no distribution was fitted. Every
  numeric claim is either read off committed repo artifacts or cited to an external source.
- **The 0.999625 / 0.979540 completeness floor was not re-measured**; it is quoted from
  `rfc/bot-policy.md` §2.1 `[P]`.
- **Fairy-Stockfish was not built or run.** Its option table was read from `src/ucioption.cpp` at
  master, not from a live `uci` handshake — the repo's own standard for an "advertises…" claim is a
  captured handshake (`d333-band-outcome-harness/out/maia.identity.json`), and this pass does not
  meet it.
- **`opponent-selector.ts` line numbers are working-tree positions** under codex's in-flight edits;
  the symbols are stable, the numbers are not.
- **Lc0 release-note claims are `[P]`** (search snippets, not fetched release pages).
- **`rfc/variants.md` is a draft and may move under this dossier.** Section 8's recommendations are
  research input to its author, not an amendment; law 5 and the RFC process own the change.

---

## 11. Proposed ledger rows

*(Head at drafting was **D1153**; renumber at landing.)*

- **🐞 — The pinned Maia sidecar cannot parse Chess960, which is stronger than "Maia is dark".**
  `maia3/uci.py` at the pinned commit constructs `chess.Board(fen)` with no `chess960=True`, and
  python-chess in standard mode does not speak king-takes-rook castling. Prior records
  ([[D1034]], [[D327]], `rfc/variants.md`) frame the 960 gap as out-of-distribution *quality*; it is
  also a *parsing* defect, and the failure would be silent. `rfc/variants.md` criterion 5 must
  enforce suppression at request construction (`policyUsesMaiaBand`, `engine-band.ts:92`), not only
  at the offered set.
- **📊 — The base-layer slot is "a policy head", not "Maia", and Maia-1 is an Lc0 net.** The released
  Maia models are Leela weights run under lc0 with a nodes limit of 1; lc0 exposes per-move policy
  priors via `VerboseMoveStats` and supports `UCI_Chess960` since v0.23/v0.25. The 960 blocker is
  therefore **absent human-trained 960 weights**, not an absent instrument — a data problem with a
  known price.
- **📊 — Fairy-Stockfish cannot fill the base-layer slot and is not needed for Chess960.** It is
  alpha-beta + NNUE *evaluation*; its full registered option table contains nothing policy-shaped, so
  the sampler's `p^(1/T)` reconstruction has no referent and the completeness statistic would pass
  vacuously. Shipped Stockfish 18 covers Tier 1 with one option flip. Fairy-Stockfish's real home is
  Tier 2+, as `rfc/variants.md` §2.2 already implies. GPL-3.0 ⟂ our AGPL-3.0 is expressly permitted
  by `LICENSE:552-558`; no new legal question.
- **💡 — An evidence-keyed `ControlledTrait` is a hat, not a head.** Traits key on
  `traits: string[]` and multiply `finalMass`; `features` rides the record and does not enter the
  composition. A multiplier cannot originate mass, so evidence-keyed traits are strictly modifiers
  over a base policy vector. [[D810]]'s original "evidence-to-move selector" — features → weights →
  distribution with no policy net underneath — is a **fourth**, unbuilt thing and the only
  variant-portable route to a human-shaped base. Owner-level: fund, defer, or refuse it explicitly.
- **⚖ — Recommended answer to `rfc/variants.md` OQ1:** 960 ships with an engine-composed opponent,
  disclosed and labelled **uncalibrated**, with §5's measurement commissioned in parallel and binding
  on what the card may say. Strictly better than the current `strong_engine`-only text on every
  learner-facing axis, and honest about being worse than the standard-chess opponent.
