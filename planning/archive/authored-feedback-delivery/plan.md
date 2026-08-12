# Authored-feedback delivery + action vocabulary — implementation plan

RFC: `rfc/archive/authored-feedback-delivery.md` (implemented 2026-08-12).
Assignee: codex.
`[x]` flips only with the exercising test.

**Read the RFC's Motivation first.** This RFC deliberately does NOT serve
withheld content back — that needs per-scope reveal, which is twice-withdrawn
and documented as unimplemented. Do not add a reveal endpoint, a `scope`
parameter, or a 425 mapping. If you find yourself needing one, stop and report.

## 1. Pack document projection

- [x] `GET /packs/:id` returns only: id, version, title, mode, phase,
      difficulty, provenance, start, objective{type,summary}, feedbackPolicy,
      opponentPolicy, spine (annotations stripped per node),
      checkpoints[]{id,label,actions}
- [x] Omitted, each with an absence test: spine[].annotations, deviations,
      feedbackClaims, checkpoints[].trigger, planClasses, concepts
- [x] `GET /packs` untouched — byte-identical response (regression guard);
      digest + reviewStatus preserved
- [x] `x-pack-digest` / `run.packDigest` still digest the COMPLETE stored
      document, never the projection (assert against the stored pack)
- [x] Existing browser walkthrough passes unchanged (proves nothing the client
      uses was removed)
- [x] Playwright: fixture payload contains none of its deviations[].note text
      (scope: fixture's single placeholder note, per RFC)

## 2. Closed action vocabulary (lint, not schema enum)

- [x] Runtime lint in pack-check/registry: allowed = {"compare_branches"};
      `[]` valid; unknown fails naming the value AND the allowed set
- [x] No schema `$id` bump, no JSON-Schema enum (schemaIssue discards
      allowedValues, so it cannot produce the message)
- [x] Fixture migrations: living fixture timing-window
      ["compare_branches","offer_outcome_transition"] → ["compare_branches"];
      Pack A break-arrived ["stop"] → []; Pack A others → ["compare_branches"]
- [x] Note in log: fixture digest changes → runs pinned to the old digest go
      pack-blind (accepted, fixture-only repo)

## 3. Docs

- [x] docs/drill-client.md — pack response is a projection; withholding now
      covers authored prose at delivery
- [x] docs/drill-pack-format.md — action vocabulary + `[]` encoding
- [x] ENGINES_REQUIRED=1 make verify + make test-browser green
