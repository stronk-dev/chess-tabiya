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
