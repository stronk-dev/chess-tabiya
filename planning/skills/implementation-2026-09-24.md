# Skills — implementation receipt, migration-free subset (2026-09-24)

**RFC:** `rfc/skills.md` · **By:** claude, at the owner's direction · **Surface:** the Skills
section of the private learner profile (`docs/learner-profile.md`). No migration was needed or
claimed; register order (`evidence-job-durability`, then `concept-registry`) is untouched.

## What ships

- `packages/runtime/src/skills-contract.ts`: the five category names; the empty-category reasons for
  Openings and Strategy; the five admissible, one conditional and three refused valence groundings;
  `validateValenceRegister` (shape, basis, authority resolved through the compiled evidence
  manifest); leaf and blocker model; `deriveConceptMarks` (declinable alternative required, earned
  once by kind, linked to its node); the copy guard `SKILLS_SURFACE_FORBIDDEN`.
- `content/valence/register.json`: `tabiya.valence-register.v1`, zero declarations. Startup validates
  it and fails closed on an invalid row.
- The profile renders five categories, their marks (none) or their reason, the valence statement,
  and registered shapes as candidate leaves with their blockers.

## Criteria → tests

| # | Test |
|---|---|
| 1, 3 | `packages/runtime/src/skills-contract.test.ts`; `learner-profile-application.test.ts` (startup refuses an invalid register) |
| 2 | `packages/runtime/src/evidence-contract.test.ts` (populated authority validates; empty and undeclared arms fail) |
| 8, 10, 11 | `skills-contract.test.ts` |
| 9 | `learner-profile.test.ts` (`learner_marks` untouched after a profile read) |
| 12, 13 | `skills-contract.test.ts`, `learner-profile.test.ts`, `ProfileScreen.test.ts`, the browser journey |
| 14 | `learner-profile-walls.test.ts` (no campaign module reads marks, credits or the profile) |
| 4, 5, 6, 7 | not built: they are `concept-registry.md`'s identity work |

## Blocked, by name

- **Open question 1** (may valence be declared at all) — owner. Until it is ruled no leaf is creditable.
- **Open question 3 / §3.3** — owner authors the leaf→category assignment.
- **D3** — the shapes-family opportunity definition.
- **D2** — the store additions (time-control/band scope, calendar anchor, `theory.shapes` ingest).
- **Concept identity** — `concept-registry.md`, behind `evidence-job-durability` in register order.
