# RFC: Stop Shipping Authored Feedback; Close the Action Vocabulary

- **Status:** accepted
- **Author:** claude (for Marco)
- **Created:** 2026-08-12
- **Design refs:** `design/02-product-shape.md` §anti-contamination, ADR-0006
- **Exploration gate:** owner ruling opening breadth #2 (2026-08-11); this RFC implements two defects Pack A proved, evidenced in `planning/content-era/field-consumer-matrix.md`
- **Depends on:** `rfc/archive/drill-client.md`, `rfc/archive/app-shell.md`
- **Parent / amends:** **`rfc/archive/drill-client.md`** (pack response becomes a projection) and **`rfc/archive/drill-pack-format.md`** (checkpoint actions gain a validated allow-list)
- **Supersedes / superseded by:** —
- **Planning:** `planning/authored-feedback-delivery/`

## Summary

Two fixes, both fully implementable against shipped code, with **no reveal
endpoint, no per-scope reveal, no new status code, and no schema `$id` bump**:

1. **Stop shipping authored prose.** `GET /packs/:id` omits annotations,
   deviations, feedback claims and checkpoint triggers. Nothing renders them
   today (verified: zero consumers in `apps/web/src`), so removal breaks
   nothing and closes the contamination hole immediately.
2. **Close the action vocabulary as a lint**, not a schema enum — so no pack
   document changes shape and no digest moves except the fixtures we migrate.

## Motivation

Pack A proved two defects. Authored prose ships before play: five deviation
notes, nine annotations and two claims readable in devtools before move one,
because server-side withholding covers engine evidence only. And
`checkpoints[].actions` accepts any string while `CheckpointSheet` executes
exactly one, so authored actions silently no-op.

**What this RFC deliberately does NOT do** (review AFD-C1/C2/C3): it does not
serve withheld content back. A reveal path requires **per-scope reveal**, which
is twice-withdrawn and documented in `docs/explanation-grounds.md` as not
implemented — the run-global latch would release *all* authored content at the
first of Pack A's three checkpoints, so a reveal endpoint built on it would not
actually stop contamination. Withholding-then-rendering is the next slice, with
a stated trigger: **per-scope reveal must exist first.**

## Specification

### 1. Pack document projection (`GET /packs/:id` only)

`GET /packs` is untouched — it returns `PackSummary`
(`{id, version, digest, title, mode, difficulty, reviewStatus}`), and both
`digest` and `reviewStatus` are load-bearing (`PackList.svelte`, the browser
spec's selector wiring). The earlier draft wrongly applied a document table to
the catalogue route (AFD-C4).

`GET /packs/:id` returns **exactly the fields the client demonstrably reads**,
verified by grep over `apps/web/src` excluding tests:

**Included:** `id`, `version`, `title`, `mode`, `phase`, `difficulty`,
`provenance`, `start`, `objective` (`type`, `summary`), `feedbackPolicy`,
`opponentPolicy`, `spine`, and `checkpoints[]` reduced to `{id, label, actions}`.

**Omitted:** `spine[].annotations`, `deviations`, `feedbackClaims`,
`checkpoints[].trigger`, `planClasses`, `concepts`.

`planClasses` and `concepts` are omitted for the same reason as the rest
(AFD-C5): no consumer. Including authored strategic prose for a surface that
does not exist is "vocabulary leads consumer" — the exact rule §2 invokes.
They return when intent capture renders.

**`spine` stays** because `session-controller.ts` forwards it whole to
`/select-move`; `spine[].annotations` are stripped per node. The Line Drill
disclosure question (is the main line the answer?) is deferred with a trigger:
the first Line Drill pack.

**Digest unchanged:** `x-pack-digest` and `run.packDigest` remain the RFC 8785
digest of the **complete stored document**, never the projection — digesting
the projected body would break run creation, pack-merged PGN and pack-blind
detection (AFD-C7).

### 2. Closed action vocabulary — as a lint (AFD-C6, AFD-C7)

Implemented in `pack-check`/registry validation, **not** as a JSON-Schema
`enum`: a schema enum would change the format shape and force an `$id` bump,
and `schemaIssue()` discards `allowedValues`, so it cannot produce the required
message. A runtime lint can.

- Allowed set = **what a consumer executes** = `{"compare_branches"}`.
- `actions: []` is the valid encoding for "no pack-selectable action" (the
  schema already permits it — no `minItems`). This is what Pack A's
  `break-arrived` checkpoint means; migrating it to `["compare_branches"]`
  would grant a Compare button the author never authored.
- Unknown values fail with the offending string **and** the allowed set.
- **Fixture migrations, stated correctly this time:** the living fixture's
  `timing-window` checkpoint is `["compare_branches", "offer_outcome_transition"]`
  → `["compare_branches"]` (dropping a value no consumer executes); Pack A's
  `break-arrived` `["stop"]` → `[]`; Pack A's other two → `["compare_branches"]`.
- Migrating the living fixture changes its digest, so runs pinned to the old
  digest become pack-blind (no orchestration, no withholding, no merged PGN).
  Acceptable in a fixture-only repo, stated rather than discovered.

**Vocabulary follows consumer, never leads it.** The set grows when a consumer
grows.

## Deviations from design

None. Both changes close gaps between shipped behaviour and standing laws
(anti-contamination; validators must not bless no-ops).

## Acceptance criteria

- `GET /packs/:id` omits each field in the Omitted list; a test asserts each is
  absent (**fails against today's code**).
- `GET /packs` response shape is byte-identical to today (regression guard).
- `x-pack-digest` still equals the digest of the complete stored document after
  projection (asserted against a stored pack, not the response body).
- Existing browser walkthrough still passes unchanged — proving the projection
  removed nothing the client uses.
- Playwright: the fixture pack payload received by the browser contains none of
  its `deviations[].note` text. Scope stated honestly (AFD-C8): the harness
  serves only the fixture, so this proves the mechanism on the fixture's single
  placeholder note, not on Pack A's five.
- `pack-check` rejects `["stop"]` naming the value and the allowed set; accepts
  `[]` and `["compare_branches"]`; both fixtures migrated and passing.
- `docs/drill-client.md` (withholding + pack response) and
  `docs/drill-pack-format.md` (action vocabulary) updated in the same change.
- `ENGINES_REQUIRED=1 make verify` + `make test-browser` green.

## Open questions

- **Serving authored content back** — blocked on per-scope reveal; explicitly
  not designed here.
- **Line Drill spine disclosure** — trigger: first Line Drill pack.
- Whether `checkpoints[].label` leaks intent — deferred until a pack shows real
  leakage; labels are also the player's only orientation.

## Acceptance review blockers (2026-08-12 — AFD-C1..AFD-C8) — RESOLVED

C1/C2/C3 → the reveal endpoint, `scope=` grammar and 425 remap are **removed
entirely**; this RFC only stops shipping, and names per-scope reveal as the
blocking prerequisite for serving content back. C4 → `GET /packs` excluded from
the projection, with `digest`/`reviewStatus` preserved. C5 → `planClasses` and
`concepts` moved to Omitted for want of a consumer. C6 → real fixture contents
used, `actions: []` named as the "no action" encoding, lint chosen over schema
enum so the message can carry the allowed set. C7 → no `$id` bump (lint, not
schema), digest defined over the stored document, fixture-migration
consequences stated. C8 → Playwright criterion scoped honestly to the fixture.
Governance: Active-table row added, design ref corrected, exploration gate
cites the ruling rather than the evidence.

## Changelog

- 2026-08-12: created from two Pack-A defects.
- 2026-08-12: adversarial review AFD-C1..C8; delivery half cut to
  stop-shipping-only after the review showed the reveal path assumed
  twice-withdrawn infrastructure; enum reimplemented as a lint;
  **status → accepted**.
