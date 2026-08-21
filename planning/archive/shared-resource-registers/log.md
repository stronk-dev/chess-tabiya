# Shared-resource registers job log

Append-only.

## 2026-08-21 — implementation opened

- Started from accepted RFC-1 after the joint process review and owner answers landed.
- Re-derived the active census from `rfc/README.md`: nine non-process RFCs, four `none`
  declarations, five claiming documents and seven claim lines.
- Preserved the unrelated measurement-record and D333 harness work already in the worktree.

## 2026-08-21 — C1–C6 implemented and green

- Added one reusable active-RFC/declaration parser, used by all six checks and exported for the
  lifecycle checker that lands next.
- Added positive and negative fixtures for C1–C6. The C1 fixture proves a declaration nested in
  a four-backtick example is ignored and a body-staged declaration is refused; the C3 negative
  carries two live claimants so its join is non-vacuous.
- The first real-tree run exposed an implementation mistake: `learner-rating`'s second
  `position next` is implicitly behind its first claim and must not collide with
  `teacher-surface`'s ladder head. The collision key now preserves within-document order.
- Fresh hand derivation agrees with the checker: pack 0.30; run 0.18; shape-entry 0.5;
  principle-entry 0.2; migration `teacher-surface` then both ordered `learner-rating` claims;
  evidence-kinds has no numeric next lane and `citable_text` is held.
- `make register-check` reports nine active non-process RFCs, seven claims and C1–C6 green.

## 2026-08-21 — verification and closeout

- The first `make verify` run passed typecheck and all 767 Vitest tests, then correctly failed
  because `verify-scaffold.mjs` still pinned the old three-prerequisite `verify` contract.
  Updated that invariant to require the fourth named prerequisite rather than accepting arbitrary
  Makefile drift.
- The final `make verify` passed: 767/767 Vitest tests, twelve Node checker fixtures, typecheck,
  schema/scaffold and packaging verification, followed by a green real-tree C1–C6 join.
- No registered schema constant, `$id`, migration or evidence member moved.
- Closed the full rows D376/D385/D423/D447/D461/D498/D499/D653 and only the register halves of
  D384/D504, leaving their excluded residue visible.
