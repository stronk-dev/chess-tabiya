# Evidence component input repair — 2026-09-30

Authority: implementing `rfc/evidence-presentation.md` §§3.4, 3.5, 3.6a, 7/8.
Item: D3331. This is a scoped frontend repair, not a complete board/workflow acceptance.

## Production changes

- With the existing board-paint callback, square captions and every retained square use native
  buttons. Focus and pointer/native activation expose the same sealed fact; blur clears transient
  focus. An endpoint's accessible label includes its square and the exact registered caption.
- Relation captions and each endpoint similarly expose the complete retained relation. They do not
  fetch another position, merge unrelated facts, invent squares or add arrows to the owning budget.
- Without a board callback, the square/relation views remain semantic text/lists, not inert controls.
- Magnitude-trail points have native controls that identify the corresponding plotted circle.
  Focus/activation/blur changes only its focus stroke; the registered path, coordinates and extent
  remain unchanged. Values stay available without hover.
- Distribution/outcome figure captions are valid last children for observed, zero and withheld
  states. The two obsolete parent-scoped module-seat CSS rules were removed; ModuleSeats still owns
  the real seat styles.

The production callback path remains `DrillScreen → ModuleSeats → PresentedEvidence → component`.
The board still clamps paint through existing assistance (`off` means no system paint); this change
does not acquire evidence, alter a preset/ceiling, create a new board input path or grade a move.

## Verification

Four new mounted-component controls failed on the original production components: missing native
caption/endpoint controls, missing chart-point controls and invalid figure-caption order. After
the repair, `make evidence-components-check` passes all 15 tests, including read-only no-handler
coverage. The tests exercise actual mounted Svelte components, native focus/activation/blur,
retained operand identity, same-caption labels and unchanged chart path.

- `make component-theme-sweep`: two tests passed (other cases filtered by that dedicated target).
- `make label-sweep`: eight tests passed; all 309 Svelte files scanned, zero findings/allowlist entries.
- `make component-coverage`: eight controls passed; 91 ordinary, 115 Inspector, five author/operator
  and 224 module adapter pairs have zero misses. These are current working-tree counts, which include
  the separate uncommitted Explorer summary; this UI repair does not add an adapter or projection.
- Final `make typecheck`: zero errors and zero warnings.
- `make capability-check`: no additional registry change; all 819 committed declarations retained
  and all 827 in-flight candidate images match. The extra eight belong to D3330, not this repair.

Full application/browser/release readiness remains unproven while the independent D3330 migration
blocks application startup in the working tree. No complete UX capability, milestone, owner-device
discharge or presentation RFC archive is claimed. The Explorer implementation and content migration
are not part of this frontend checkpoint.
