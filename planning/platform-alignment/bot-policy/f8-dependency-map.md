# F8 bot-policy dependency map — HEAD audit after evidence-foundation Phase 2b

**Date:** 2026-08-22  
**Status:** research/planning handoff; not an RFC and no implementation authority  
**Rows:** D810–D823; O8  
**Inputs:** `design/research/bot-policy.md`, `design/research/human-like-opponents.md`,
`planning/platform-alignment/bot-policy/o8-handoff.md`, the tactical/breadth collector drafts,
and a symbol-level audit of the current selector, runtime selection types and F1 manifest.

## Outcome

The bot lane does not need another general competitor survey before O8. The current first-party
[Chessiverse construction](https://chessiverse.com/articles/how-chessiverse-bots-are-created) and
[rating-calibration](https://chessiverse.com/articles/how-chessiverse-ratings-work) pages still
describe the same architecture recorded by R11: neural candidate
generation, a stronger-engine Move Curator, post-hoc observed style classification, per-bot human
opening repertoires, statistical opening frequencies and anchor-bot rating calibration. They also
state the same limitation: style is mostly observed rather than controlled, and even their curated
weak bots struggle to make mistakes users perceive as coherent.

Tabiya's differentiator remains viable but unimplemented: **apply the same declared evidence
vocabulary to every candidate, compose an honest versioned policy over those features, persist the
complete decision record, and let later Review render why the bot chose or missed something.** The
guidance renderer never feeds the selector, and selector weights never grade the learner.

The lane is now blocked by named dependencies, not by a vague need for “more bot research.”

## 1. What actually ships at HEAD

| Boundary | Current authority | Exact limitation |
|---|---|---|
| Request | `apps/server/src/opponent-selector.ts` `SelectorPolicy` / `parseSelectMoveRequest` | admits only `mode`, `policyConfigDigest`, `targetElo`, `temperature`, `topP`; rejects unknown stack/profile fields |
| Candidate providers | `human.maia.uci_response`, `live.stockfish.uci_response`, `live.syzygy.probe_result` admitted to `opponent.selection@1` | F1 proves raw provider inputs cross the consumer boundary; it does not type a composed candidate feature vector |
| Human base | `human_common` sends complete history to pinned Maia and requests enough MultiPV rows to cover the legal count, bounded by provider maximum | returned `bestmove` is Maia's internal unseeded sample; raw policy rows are not the played distribution |
| Other policies | strong engine, authored-spine restriction, perfect tablebase, practical resistance | useful modes, not a personality stack; theory spine and statistical repertoire are different contracts |
| Persisted result | `packages/runtime/src/types.ts` `OpponentSelection` / `SelectionCandidate` | stores move, mode, candidate rank/mass/cp/WDL and engine identity; no layer/profile/feature/contribution/fallback/calibration record |
| Replay | selection committed before the matching opponent move and replayed from the event log | reproducible read-back after selection; not reproducible seeded generation |
| Cache identity | session digest + target Elo + pack + seed + history hash | stable cache separation, but not a declared policy-stack id/version |

This audit creates D821–D823. It does not reopen the implemented F1 contract: raw provider
admission is correct. F8 adds a derived candidate/selection layer after those admitted inputs.

## 2. Layer-by-layer readiness

| Layer | 1.0 contract | Evidence state | Dependency/action |
|---|---|---|---|
| Human policy base | full-history model output, exact model/band/sampler identity | shipped; Maia band transfer and policy reconstruction measured | retain `human.maia.uci_response`; never call target band achieved Elo |
| Candidate set | complete legal candidates or explicit truncation/abstention | `human_common` requests legal-count width but provider max may cap it | F8 must expose completeness and refuse a “complete-vector” transform when capped |
| Local exchange/error guard | exact legal recapture convention per candidate | specified/measured in tactical Wave A | tactical landing first (`legal-exchange@1`) |
| Tactical features | capture/check/loose/ray/threat/fork/development/etc. over each candidate | tactical RFC draft, 30 closed ids | candidate adapter consumes collector ids; no duplicate tactic code |
| Positional features | control, mobility, pawn, defender, material, king and activity operands | breadth RFC draft, 18 closed ids | candidate adapter consumes breadth ids; low-lift facts remain features, not hint prominence |
| Salience/recency | whether an exact threat was just created and which actor moved | hierarchy remains folklore; current `structuralDelta` cannot establish the claimed threat identity | D815 moves behind tactical landing and is excluded from the first stack unless its later experiment passes |
| Sharpness/blunder potential | candidate-loss distribution / bounded MultiPV spread | D816 measured stable band-level rank signal (ρ .51–.56 for severe-choice breadth), but middlegame/endgame reach is absent | admit typed opponent-only distribution/budget/completeness; never a learner grade or “only move” label |
| Cross-band disagreement | policy change across human bands | D817 refuted by the existing sealed comparison (Pearson .021–.044; sign 47–52%) | exclude multi-band runtime queries from F8 |
| Repertoire | transposition-aware immutable book with coverage/fallthrough | drill spine and root book both measured 79.2% fallback and refused as general personas | interface may be specified; no 1.0 repertoire persona without its own corpus wave |
| Memory/timing | explicit cross-game state and clock-conditioned behavior | unmeasured/absent | keep off; D820 forbids fake random delays |
| Controlled trait | versioned transform with measured output delta and strength effect | pawn ×4 passed; forcing/quiet transforms failed | O8 decides whether pawn-heavy enters the initial roster |
| Presentation persona | name/art/voice/bio with no implied chess behavior | separable by research | may read policy declaration; cannot silently alter moves |
| Selection record | chosen + rejected candidates, admitted features and each layer's action | absent | D818/D822; likely run-schema impact, to be claimed only by the eventual RFC |
| Calibration | per-composed-profile strength and distribution, time-control scoped | internal ladder machinery exists; human-scale anchor unchosen | D819 after the first composed arms exist |

## 3. Required policy compiler boundary

The F8 RFC should specify one compilation path:

```text
admitted provider candidate set
  → candidate evidence adapter (same registered collectors, evaluated on each child)
  → optional declared repertoire prior
  → optional declared error guard
  → zero-or-more measured trait transforms
  → seeded sampler over the resulting complete distribution
  → typed selection derivation + persisted opponent.move_selected
```

Every layer needs: stable id/version, exact inputs, transform/mask parameters, abstention and
fallback, whether it changes strength, a measured output metric, and its contribution to the final
candidate weights. A layer may abstain without erasing the base distribution. The compiled stack
must fail if two layers claim the same authority or if a transform requires a complete vector and
the provider returned a capped window.

The request's existing `policyConfigDigest` is the run session digest in production callers. F8
must not relabel it as the stack identity. The run can retain both: session identity for replay and
a separately compiled policy id/digest for the bot decision.

## 4. Seed and sampling decision

Current `human_common` returns Maia's internal `bestmove`; `seedHonored` is correctly recorded
false. The branch seed only separates cache keys. A composed policy cannot be replayably sampled
from declared weights unless F8 chooses one of two honest mechanisms:

1. obtain a complete raw Maia vector, reconstruct the declared temperature/top-p distribution,
   apply policy layers and sample server-side with the branch seed; or
2. extend/replace the model adapter with an explicitly seeded selection command, then prove the
   seed and layer semantics at the engine boundary.

The first matches the existing R11 instrument and is the recommended architecture, but only if
vector completeness is explicit. Falling back to Maia `bestmove` is legal only as a recorded
degraded path that says the stack did not apply.

## 5. Execution graph

```text
O8 owner ruling
  ├─ tactical-collectors independent review → acceptance → implementation
  ├─ breadth-collectors independent review → acceptance → implementation
  └─ D816 settled-go; D817 settled-refuse; D815 is optional post-tactical research
          ↓
F8 policy-stack RFC (candidate adapter + compiler + seed + selection record)
          ↓
first composed profiles + internal ladder/calibration (D819)
          ↓
roster/profile UX and owner-use packet
          ↓
optional bot tournament envelope (D708), repertoire and memory waves
```

Campaign is not a prerequisite for the bot stack. Campaign may later select an admitted profile,
but it must not define bot semantics or delay the base roster.

## 6. The only owner ruling still needed before F8 drafting

The existing O8 handoff recommends one composable stack; an initial roster of Human baseline,
Guarded human and Pawn-heavy; no repertoire or adaptive memory until separately measured; the
label “human-policy band” rather than a promised Elo; and validation by owner use of the sealed
packet. Approving that recommendation opens F8 drafting. Rejecting Pawn-heavy narrows the initial
roster without changing the stack architecture.

No decision about chat, avatars, bot tournaments, campaign opponents or future repertoire breadth
is required to open F8.
