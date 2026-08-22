# O8 owner handoff — human-policy bots and honest personalities

**Status:** ready for owner ruling  
**Inputs:** R11 mechanical experiment + validated 42-branch blind packet, R5, D333/D335, D551/D561,
D649, Chessiverse/Otter desk research  
**Does not claim:** human-likeness from an external panel; owner use remains validation

**2026-08-22 HEAD audit:** `planning/platform-alignment/bot-policy/f8-dependency-map.md` confirms
the research result but adds three required F8 seams: the current request cannot encode a stack
(D821), the selection event cannot audit one (D822), and `human_common` accepts a branch seed while
Maia's internal sample correctly records `seedHonored: false` (D823). These are RFC inputs, not new
owner questions.

## What research has settled

1. Tabiya ships a useful base model, not a personality system: history-conditioned Maia-3 with
   target band, temperature/top-p, exact engine identity and recorded replay.
2. The raw Maia probability vector is not the bot's played distribution. Reconstructing the actual
   temperature/top-p sampler matches captured production within 0.27 cp expected loss and 0.03
   percentage points severe-loss mass.
3. A 250 cp severe-error guard passes the mechanical gate: measured severe mass 0.39%→0, expected
   loss −1.27 cp, explorer-match retention 100.2%. This does not prove it feels more human.
4. Pawn ×4 after the guard is the only tested controlled trait that passes: pawn moves +11.97 pp,
   expected loss −1.01 cp, explorer-match retention 98.8%. Forcing/quiet transforms fail their
   declared trait-change gate even at stronger multipliers.
5. Authored drill spines and a root-conditioned statistical book both fall back on 57/72 controlled
   plies (79.2%). Neither is a general bot repertoire.
6. Clock-conditioned behavior, cross-game adaptation/memory and coherent multi-ply “aggressive” or
   “solid” policy are unimplemented/unmeasured. An avatar, name or chat voice cannot substitute.
7. The Maia band is an opponent-policy parameter, not literal achieved Elo. Prior measurement puts
   its transfer ratio near 0.289 over the corpus; UI must not present a target band as a personal or
   guaranteed playing rating.

## Recommended ruling

### O8.1 — One composable policy stack

Approve one versioned stack, not bespoke bot engines:

```text
HumanPolicyModel
  → RepertoirePolicy? (exact key; explicit fallthrough)
  → ErrorGuard? (declared engine/threshold/effect)
  → ControlledTrait[] (measured transform only)
  → MemoryPolicy? (off until measured)
  → recorded selection

PresentationPersona (name/avatar/voice/bio) reads the policy declaration
but never changes moves unless a layer above declares how.
```

Every layer declares inputs, transform/version, fallback, measured strength delta, trait metric and
abstention. Bot policy and learner guidance may consume the same registered facts, but neither owns
or receives the other's prose.

### O8.2 — Honest 1.0 roster

**Recommend:** ship only behaviorally distinct profiles the measurements support:

- **Human baseline:** production Maia sampler at a selected supported band; no curator.
- **Guarded human:** same sampler plus disclosed 250 cp severe-error curator.
- **Pawn-heavy:** guarded sampler plus the measured pawn ×4 transform.

Friendly names/art are allowed, but the detail card states the exact controlled behavior. The UI
separates:

- **controlled traits** (policy intentionally changes and measurement confirms);
- **observed traits** (computed after games, descriptive only); and
- **presentation** (voice/avatar/story, no chess-policy claim).

Do not label a 1.0 bot aggressive, solid, tactical, positional, tricky, adaptive or “plays like X”
unless a later transform clears its declared policy and owner-use gates.

Alternative: ship raw Maia only until owner blind use. That is more conservative but gives up the
only measured Chessiverse-style curator/trait work already completed.

### O8.3 — Repertoire and memory

**Recommend:** keep the interfaces in F8, but ship no repertoire persona or adaptive memory until a
real immutable book reaches its declared coverage and a multi-game experiment demonstrates the
behavior. A repertoire layer must use position/transposition identity, state its covered depth and
fall through visibly to the base model. It must not reuse a drill spine.

Opening-book work remains sacrificial research under D560/Gate F. Cross-game memory is opt-in,
exportable/deletable learner data under O13/F12, never a hidden difficulty adjustment.

### O8.4 — Strength and disclosure

**Recommend:** present the selector as a **human-policy band**, not “this bot is 1800.” Show the
model/version and whether curator/trait/book/memory layers are active. Calibrate outcome strength
for each composed profile independently; a trait transform cannot inherit the base model's label by
assumption.

### O8.5 — Validation posture

D649 removes recruited blind reviewers from scope. The validated 42-branch packet remains the
owner-use instrument: replay unlabeled branches, record the first incoherent ply and compare raw,
guarded, pawn-heavy and weakened-Stockfish control. This validates the selected roster by use; it
does not become a population claim.

## Consequence of approval

O8 becomes answered and F8 may draft the stack, profile registry, disclosure/calibration contract
and owner-use packet integration. It may not invent more personality traits, build bot tournaments,
write a repertoire, or couple persona text to move choice without a registered policy layer.
