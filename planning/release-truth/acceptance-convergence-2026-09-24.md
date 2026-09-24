# The 1.0 critical path is blocked at acceptance, not at engineering

**Written:** 2026-09-24 by claude, taking over the paused Tabiya 1.0 effort · **Ledger:** [[D3299]] ·
**Asks the owner for:** two pending acceptances and one process ruling (§4). Nothing here changes
code, intent or an RFC's text.

## 1. The question

Which production-boundary 1.0 slice can close next, and is [[D3262]]'s five-arm comparison on
its critical path?

## 2. What each candidate slice is actually waiting on (measured at `97257460`)

**Whole-game Review** is the owner's highest-interest gap ([[D1088]], [[D1273]]). Its learner surface,
`rfc/review-map.md` (draft, 429 lines), consumes `rfc/review-evidence-compiler.md` (draft, 1,131
lines, five fresh-review returns). The compiler "cannot be accepted or implemented before" these are
accepted and have landed (`rfc/review-evidence-compiler.md:18-27`):

| dependency | state | lines |
|---|---|---:|
| D921 Wave-C amendment to `learner-modules` | fresh review **passed** 2026-09-12; awaiting owner acceptance | — |
| `shared-candidate-evidence-packet.md` | cut 2026-09-06; **"owner acceptance is the next event"** | 1,832 |
| `provider-exchange-and-execution.md` | draft; blocked on `provider-protocol-register` ← `shared-resource-register-bootstrap` (15 review rounds) | 2,096 |
| `recorded-semantic-path.md` | draft; predecessor and repeat review block acceptance | 503 |
| `evidence-presentation.md` | draft; **seventh** fresh review returned 2026-09-07 | 1,943 |

That is **7,934 lines of draft RFC text across six documents** before the first line of Review UI.
Note that `shared-resource-register-bootstrap.md` §6 says its own landing does not unblock
`provider-protocol-register` either, because absent-source admission is a separate successor ([[D3082]]).

**The six implementing RFCs** (the only legal implementation lanes today) have no residual that
closes without a draft or the owner:

| RFC | remaining obligation | blocked by |
|---|---|---|
| `move-quality-grades` | D1: `postcommit_nudge` and `review_map` as real consumers | `review-map` (draft), `module-registration` (draft) |
| `learner-modules` | Wave-C amendment | owner acceptance (D921) |
| `play-composition` | preset activation, eleven module seats, five columns | `intent-presets` (returned), module emission |
| `feedback-delivery` | Stage 2 binding wave | `claim-semantic-anchors` (draft) — [[D1007]]/[[D1008]] |
| `pack-population-provenance` | D1 corpus population | owner-authored content wave (content-last doctrine) |
| `learner-rating` | rated campaign entry | `campaign-core` (returned) |

**[[D3262]] is not on this path.** Neither `review-evidence-compiler` nor `review-map` depends on
`semantic-consequence-search`. The five-arm comparison unblocks acceptance of one more draft whose
consumers (Guided Hint "why", Review explanation depth) themselves wait on the chain above.
Finishing it now would add a measurement, not move a gate, so I have not resumed it.

## 3. The measured blocker: acceptance throughput

- **No RFC has been accepted since 2026-08-22.** That is 33 days. The register's own lifecycle
  (`rfc/0000-rfc-process.md:55`) makes acceptance "scope and approach agreed by Marco".
- Since 2026-09-01 there have been **458 commits**, and **212** of them name a review, repair or
  return. The period added **170 fresh-review documents** and ~177 author-repair documents exist in
  total. Of the fresh reviews with a parseable verdict line, **~84 returned the RFC and 4
  passed/accepted.** (Method: first `verdict` token in the head of each fresh-review file added
  since 2026-09-01. This is approximate but not close to a coin flip.)
- Rounds per RFC: `shared-resource-register-bootstrap` **15** (a seven-row JSON catalogue for an
  existing checker), `pack-capability-contract` 17 files, `provider-health-degradation` 10,
  `longitudinal-store` 9, `evidence-presentation` 7, `review-evidence-compiler` 5.
- The two things that *have* passed are not being acted on: D921 has waited for acceptance since
  2026-09-12 and the candidate packet since 2026-09-06. Only three items in `planning/work-state.json`
  carry `owner-ruling` blockers at all (D921, D1639, D3101). The candidate packet is not among them,
  so no queue ever surfaced it.

**Mechanism.** A fresh review returns an RFC on *any* finding. Each author repair adds text and
cross-references, which gives the next reviewer new surface. The bootstrap RFC grew to 1,330 lines
over fifteen rounds before [[D3034]] cut it back. Returns are therefore self-generating, and nothing
in the process converges. The findings are often real, but most are the kind of defect an
implementation test catches in minutes. They get paid for as another full review cycle instead.
This is the 2026-08-12 owner correction about validation by use rather than ceremony, now repeated
at process scale.

## 4. What needs the owner

**4a. Two acceptances that are already ready** (no further review is owed under current rules):

1. **D921** — accept the reviewed 26-pair Wave-C amendment to `learner-modules` §4.12/A19
   (`planning/learner-modules/wave-c-module-amendment-fresh-review-2026-09-12.md`).
2. **`shared-candidate-evidence-packet.md`** — accept the 2026-09-06 cut, or return it with a
   reason.

**4b. A convergence rule for reviews (the fix, not a concession).** Proposed wording for
`rfc/0000-rfc-process.md`:

- A fresh review may **return** an RFC only for a *boundary* finding. A boundary finding means an
  implementation built faithfully from the text would do one of four things: ship ungrounded or
  wrong chess truth; lose, corrupt or leak persisted learner data; break a registered shared
  versioned resource; or widen assistance past a ceiling.
- Every other finding becomes a **numbered acceptance criterion** in the RFC: a test that must fail
  first and then pass in the implementing change set. It is not a return.
- A repeat review checks only the repaired boundary findings. It does not re-open the whole text.
- **Delegated acceptance:** once a review has zero boundary findings, claude as register owner may
  accept, log it, and leave it open to owner veto. This is the mechanism that accepted
  `move-quality-grades` and `learner-rating` on 2026-08-22, the last acceptances the repo made.

**4c. Journey-first slicing for Review (recommendation, follows from 4b).** Accept a first Review
slice that uses only evidence already implemented and admitted: the imported-game evaluation per
mainline node, `move-quality-grades`' report ladder, the recorded run graph with *Retry from here*,
and Story's existing moments. Every family whose upstream draft has not landed must **abstain
visibly**. Upstream contracts then widen a working journey rather than gate its existence.

## 5. What I will do meanwhile

Without 4b, the legal next step on the path is another fresh review of the fifth
`review-evidence-compiler` repair. Its base rate predicts a return, and even a pass leaves four
upstream drafts. I will not start a review cycle whose outcome the rule change would alter. The
state stays as recorded: no accepted RFC, and zero graduated packs.
