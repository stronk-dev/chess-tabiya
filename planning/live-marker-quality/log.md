# Live marker quality implementation log

## 2026-08-15 — review and implementation opened

Codex reviewed the corrected RFC against the current tree. The marker mechanism
survived, but the body still described D68 as out of scope and criterion 6 still
characterised the leak even though the refreshed queue made D68 acceptance-
blocking. The wave absorbs D68 using the already-shipped
`ASSISTANCE_WITHHELD` refusal on both `/voice` and `/speech`; no new vocabulary
or version claim is required. Owner-tier backlog edits remain outside the coding
agent's authority.

## 2026-08-15 — implementation complete, pending independent review

The runtime now exposes `liveAdmitted` and `liveMarkers`; only
`last_of_role` irreversibility survives on the unasked surface, and recorded
human divergence follows the existing human-split permission. The complete
projection remains in story, comparison, and evidence packets. The renderer is
an exhaustive switch and pins all eight constructible sentences, including
“The queens have left the board.” The RFC's stated seven-output count was one
short because singular and plural option-collapse were already distinct.

D68 was absorbed rather than deferred. `/voice` and `/speech`, including compare
voice, refuse with the existing `ASSISTANCE_WITHHELD` code before serving a
packet in a locked context. Tests cover closed/open solo delivery and permanent
participant/spectator withholding.

Verification on the final implementation tree: `ENGINES_REQUIRED=1 make verify`
passed 596 tests across 96 files with Svelte 0 errors / 0 warnings, schema and
packaging clean. `make test-browser` passed 24 tests at zero retries; the optional
Maia browser measurement was skipped. Canonical behaviour is updated in
`docs/adaptive-guidance.md`. The lifecycle remains implementing for independent
review and owner-tier ledger disposition.

## 2026-08-20 — independent closeout

- A0 re-ran current clean live-marker, guidance, runtime and screen contracts plus type,
  scaffold and packaging checks; no blocker surfaced.
- D48/D50/D51/D68 remain closed; D52/D53 correctly remain open measurement obligations. RFC
  moved to the archive without claiming those residuals were discharged.

## 2026-09-01 — D52 substitute-population measurement landed

- `make human-divergence-measurement` completed 2,047/2,047 production-selector probes with the
  pinned Maia3 identity: 133 R9 Lichess human-choice distributions at matching bands and all 638
  current corpus positions crossed with bands 1100/1500/1900.
- The full Maia distribution corroborates human choice better than the thresholded marker does:
  80.45% top-move agreement and median total-variation distance 0.1289, versus 58.82% marker
  precision and 66.67% recall. Its accuracy improves only 2.26 points over always-negative.
- Corpus volume is 0.0763 estimated markers per played ply, 76.3% of L3's whole-union ceiling;
  22.73% of positions change label across bands and 109/292 firings sit within 0.02 of a cutoff.
- D52 is measured, not closed. L2(ii) reserves approval of this substitute population to the
  owner; the recorded recommendation is approve it and demote the unasked raw-mass sentence under
  L6 while retaining the raw distribution for on-request and retrospective modules.

## 2026-09-01 — D53 alternative-continuation measurement landed

- `make option-collapse-measurement` measured the exact shipped 8→3→3 predicate over every path
  in the 108-game CC0 Lichess fixture and every current authored root-to-leaf path.
- The real-game arm fires 31/6,667 eligible spans (0.00443/played ply), and all 31 put the marked
  side in check at both low-choice states. It finds no quiet constraint and fires zero times over
  555 authored spans.
- The chosen continuation is highly discriminating—510/1,206,199 enumerated alternatives
  co-signal—but the prior floor is nearly inert, the low ceiling controls volume, and promotion
  weighting changes neither measured population.
- D53 is measured, not silently endorsed. L2(ii) reserves approval of this span-shaped substitute
  population to the owner; recommendation: approve it, demote the generic unasked count sentence,
  retain its exact operands, and require a named sustained-check module for any future live form.
