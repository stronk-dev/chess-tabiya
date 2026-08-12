# Breadth program — foundation alignment dossiers

Started 2026-08-12 on the owner instruction *"align on the feature foundations,
no deferrals"*.

`design/03-product-breadth.md` is the intent: the whole product surface, the
B1–B8 gate table, and an eight-item RFC program ordered by evidence and risk.
What it does **not** carry is the reconciliation against shipped code — which
surfaces are real, which are nominal, and what contract each remaining one needs
pinned. Five RFC drafts have already been withdrawn for writing specifications
against infrastructure that did not exist. These dossiers exist so the next
drafts cannot repeat that.

One dossier per program area. Each answers the same eight questions: scope,
what ships today (with `file.ts:line` evidence or the grep proving absence),
the gap to minimally-real, the contracts to pin against shipped types, an
ordered slice plan, dependencies in and out, proposed `design/BACKLOG.md` row
corrections, and any genuine owner-level ruling required.

| Dossier | Program item | B-gates |
|---|---|---|
| `evidence-explanation.md` | #2 | B4 |
| `session-contexts.md` | #3 | B2, B8 |
| `training-modes.md` | #4 | B2 |
| `review-branching.md` | #5 | B3 |
| `create-and-return.md` | #6, #7 | B6, B7 |
| `live-and-platform.md` | #8, #1 residuals | B5, B1, B8 |

## Rules these dossiers were written under

- **No deferrals.** Standing owner ruling: full product breadth before content
  depth. Every surface gets a scheduled position and a minimal-but-real
  definition. Stating that X must land before Y is sequencing and is required;
  calling Y "later", "deferred" or "backlogged" is not permitted.
- **Minimal but real** (from `design/03-product-breadth.md`): real entry,
  runtime behaviour, evidence boundary, resume/export path, and a
  representative acceptance scenario. Thin honestly-labeled fixtures are fine;
  theater is not.
- **Pin encoding, not intent.** Every proposed contract quotes the shipped
  type, endpoint or event it amends. A semantic that cannot be honestly encoded
  yet names the authored case that would pin it instead of inventing
  vocabulary.
- These are planning-tier analyses. They do not amend `design/` — that is the
  intent tier and the owner's. BACKLOG corrections are proposed here and
  applied centrally.
