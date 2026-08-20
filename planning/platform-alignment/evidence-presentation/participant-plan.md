# R3 evidence-presentation participant plan

**Status:** preregistered protocol and responsive disposable prototype ready; external recruitment and runs not started

**Authority:** platform-alignment R3; owner rulings D617–D619

**Boundary:** disposable research instrument only. This plan does not authorize product UI,
assistance, detector or pack implementation. It tests whether the ruled architecture is intelligible
when represented faithfully.

## Question

Can a nontechnical chess player choose an intended workflow and receive the right *kind* of help —
including theory-only, non-move nudges, explicit pre-commit Support and full analysis — without
configuring Stockfish, Maia, classifiers or evidence sources?

This is a workflow-comprehension study, not a learning-effect or aesthetic-preference study. It
does not decide which chess claims are true; every prototype packet uses already validated local
fixtures or clearly labelled synthetic non-chess facts.

## Prototype conditions

The disposable prototype must implement the same admitted fact as equivalent sentence, square and
arrow forms. Forms may not independently query evidence. All conditions include an honest
no-relevant-evidence state and an unavailable-provider state.

| Workflow | Default presentation under test | Explicit escape hatch |
|---|---|---|
| Just Play | clean board; committed-move consequence only | choose **Support** for pre-commit sight and blunder prevention; Customize |
| Guided Rehearsal | post-commit nudge; progressive hint by request | Customize intensity; final disclosed stage may reveal a move |
| Learn This Position | objective plus cited general theory; consequence play | theory-only view; open citation; enter inspector |
| Review & Retry | bounded Review Map; retry before continuation; compare/theory actions | open full analysis |
| Analyze Freely | full attributed inspector | filter any registered producer/family; save a custom composition |
| Campaign | placeholder preset proving a session ceiling can suppress modules | no claim about final campaign defaults before R14/O10 |

Every registered primitive shown by the prototype must resolve to exactly one location: normal
module composition, learner-safe Customize, full inspector, or author/operator-only disposition.
The participant is never asked to understand those implementation categories.

The executable artifact is `tools/r3-presentation-harness/prototype.html`. It uses synthetic
fixture text only and implements the five preset candidates, six workflow ceilings and three
required evidence states. Its unit tests and desktop/phone visual QA establish buildability only;
facilitators must not treat the prototype copy as validated UX.

## Participants and devices

Recruit **12 learners with no prior Tabiya exposure**:

- six self-reporting roughly novice/developing play (up to about 1399 online rapid);
- six intermediate play (about 1400–2000);
- within each band, include people who do not work professionally with software;
- cover four desktop pointer sessions, four phone/touch sessions and four keyboard-first sessions.

This sample detects repeated workflow failures; it does not estimate population preference. R9 owns
broader target-player and coach claims. Screen-reader and physical-device release claims remain an
R18/F12 proof; any assistive-technology participant evidence collected here is useful but does not
substitute for that release study.

## Tasks

No onboarding explanation may name a producer, evidence rung or module. Task order is
counterbalanced; the baseline tasks start from a fresh profile.

1. **Play quietly.** Start an ordinary game and make a move without asking for help.
2. **Ask what a piece currently sees.** Obtain exact pre-commit sight without receiving a ranked
   move. Repeat using the participant's assigned input path.
3. **Turn on Support.** In Just Play, enable pre-commit blunder prevention, then explain what it may
   warn about and whether it promises the best move.
4. **Rehearse with a nudge.** Commit a drill move, find the post-commit consequence, request one
   further hint, and identify whether a move has been revealed.
5. **Use theory only.** Open a cited general principle/line without evaluation, candidate moves or
   PV; distinguish “generally relevant theory” from “play this move here.”
6. **Handle silence.** Encounter no eligible fact and an unavailable optional provider; identify
   whether each state means “nothing relevant,” “temporarily unavailable,” or an application error.
7. **Review and retry.** From a completed game, choose one bounded moment, retry before revealing a
   continuation, then follow either a theory or rehearsal link.
8. **Analyze freely.** Reach the raw inspector, locate provenance/uncertainty, disable one producer
   family while retaining theory, then return to the workflow preset.
9. **Campaign ceiling.** Observe a preset with one assistance capability suppressed and determine
   whether Customize can illegally restore it.

After each task, ask the participant to state what information the product used and what it has
*not* told them. Do not teach the answer before scoring.

## Variants

Within Guided Rehearsal and Review & Retry, counterbalance a one-fact and two-fact packet. Within
theory-only, counterbalance an applicable citation and honest no-applicable-theory result. Do not
compare prose personalities or LLM vendors; R5 already made deterministic rendering normative.

## Recorded observations

- first workflow/preset chosen;
- whether Settings/Customize/Inspector was opened before needed;
- task completion and time to first correct action;
- incorrect move/PV expectation before and after the module;
- primary fact recalled after ten seconds;
- ability to distinguish general theory, local sight, evaluation and recommendation;
- recovery from empty and unavailable states;
- whether each input form reaches the identical fact ID and disclosure result;
- all facilitator explanations and deviations.

No engine score, move quality or participant strength estimate is produced by the study.

## Predeclared exit rules

R3's participant arm passes only if:

1. at least **10/12** participants start each of Just Play, Guided Rehearsal, Review & Retry and
   Analyze Freely through the intended workflow without opening source settings;
2. at least **10/12** correctly distinguish sight, general theory, evaluation and a move
   recommendation after the relevant tasks;
3. at least **10/12** understand Support is explicitly enabled and does not promise a best move;
4. at least **10/12** interpret both the empty-evidence and unavailable-provider states correctly;
5. at least **9/12** find Customize or the inspector when explicitly asked, while no more than
   **2/12** open either during the initial quiet-play task;
6. every tap/click/keyboard path returns the same fact ID, forms and disclosure result; any move/PV
   leakage into sight, theory-only or post-commit-nudge conditions is an automatic failure;
7. no session-kind ceiling can be raised by a preset or Customize;
8. the two-fact variant survives only if at least **10/12** recall the intended primary fact and no
   more than **2/12** interpret the cards as competing move recommendations. Otherwise cap one is
   the retained candidate.

Do not average away a complete device or learner-band failure. If fewer than three of four sessions
on a device class complete a core task, that task fails even if the aggregate threshold passes.

## Negative results and routing

- If users require source settings, refuse the preset wording/composition rather than adding
  onboarding prose.
- If theory is mistaken for a recommendation, narrow the theory module and its visual forms.
- If Support is mistaken for engine-best-move play, rename/narrow it or require a clearer activation
  boundary; do not silently move it into rehearsal.
- If rich configuration makes the ordinary flows harder to start, move controls deeper while
  retaining their declared inspector/author/operator location.
- If one/two facts still feel noisy, an empty packet remains preferable to adding a global
  interestingness score.

The report must preserve failures, device/band cuts and facilitator interventions. A preference
survey alone cannot complete R3.
