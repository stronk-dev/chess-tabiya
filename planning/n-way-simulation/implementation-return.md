# N-way simulation — implementation return

**Date:** 2026-08-23  
**Owner:** `n-way-comparison` amendment  
**Ledger:** D1154  
**Disposition:** do not add the two client callers until this return is resolved

## Outcome

The server verbs exist, but the accepted scratch-simulation interaction is not buildable from
their response and promotion does not preserve the previewed authored consequence. Wiring the
current endpoints would produce an apparently legitimate comparison whose boards all resolve as
missing, then enter a real branch without the checkpoint/objective events the preview was supposed
to demonstrate.

## Reproduced boundary failures

1. **The preview nodes do not cross the boundary.** `RunService.simulate` computes
   `compareBranches(scratch, branchIds)` but returns only `simulationId`, `comparison`, and final
   `leafFen` values. `BranchComparison.rows[].nodes` contains `NodeRef`—id, ply, move, actor and
   objective state—but no FEN or checkpoint refs. `CompareView` calls `comparisonNode(run, …)`,
   which searches the persisted `DrillRun.nodes`; scratch ids cannot exist there. Its specified
   grid therefore renders `Line ended` for every simulated cell.
2. **The scratch walk does not run pack orchestration.** The loop calls `commitMove` only.
   `n-way-comparison` §7.3 requires `orchestratePackMove` on every ply so checkpoints fire and the
   authored objective grades. The preview's consequence is therefore not the one the pack declares.
3. **Promotion repeats the omission.** `enterSimulation` forks and calls `commitMove` for each
   stored UCI, then saves. It never orchestrates the pack, so the promoted real branch lacks the
   checkpoint/objective events criterion A5 says must match the clone.
4. **Authored identity is discarded.** §7.3 specifies the authored move SAN as the branch label and
   the authored variation id in intent. Production emits `simulation-1`, `simulation-2`, … and no
   intent, even though authored choice objects are already in hand.
5. **Never-silent fields are absent.** The accepted response declares `truncatedAt?` and
   `subvariationsSkipped?`; the production return type and payload contain neither. A terminated
   walk or first-child choice at a nested fork is silent.
6. **The ephemeral id is not writer-scoped.** The map stores run id, source, scratch, branches,
   moves and time, but no writer id. Promotion checks whoever currently holds the run lease, so a
   later writer can enter an earlier writer's still-live simulation.
7. **The work bound has two authorities.** §7.2 says at most 8 variations / 40 plies total; the
   canonical doc and production enforce 4 branches / 12 plies. The amendment must select one and
   define whether the ply cap is per branch or across the batch; current code applies 12 per branch.

## Required amendment decisions

- Make the preview self-contained. Recommended shape: return a branded/read-only `previewRun`
  beside `comparison`, produced from the same scratch value. The client may pass it only to the
  comparison renderer; it must never enter `RunStore`, evidence polling, progress, export, or a
  mutation call. The alternative is to widen every comparison node with complete board state,
  which duplicates `Node` and creates a second projection authority.
- Extract one pure authored-walk function used by both preview and promotion. It must run the same
  pack orchestration and return the exact moves plus emitted authored events. Preview applies it to
  scratch; promotion applies it transactionally to the stored run. One derivation, two sinks.
- Bind simulation records to `(runId, writerId)`, disclose truncation and skipped subvariations,
  preserve authored labels/intents, and pin one batch-bound definition.
- Add the acceptance test the archived RFC already names: before promotion, persisted run bytes and
  branch rail are unchanged while every preview board renders; after promotion, exactly one
  simulated branch exists and its checkpoint/objective sequence byte-equals that preview branch.

## Scope boundary

This return does not reject scratch simulation and does not request engine analysis. The mechanism
is still the right shape: authored consequence preview is free and ephemeral; entering one line is
the explicit mutation. The defect is that current bytes do not carry that shape across the server,
renderer, and promotion boundaries.
