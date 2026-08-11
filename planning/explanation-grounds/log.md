# explanation-grounds — log (append-only)

## 2026-08-11 (claude, setup)

- Accepted at the fourth scoping of breadth #2. Prior three: rejected/withdrawn
  for specifying an authored vocabulary with no authored content to design
  against (see the withdrawal notes in rfc/authoring-contracts-v03.md and
  rfc/evidence-composer.md — read them before proposing any extension here).
- Review cut §1 (objective-type grounding via rules facts): no shipped pack
  uses win/hold, and `drawIsAvailable` can't say which draw fired, so a
  discriminated ref is unmintable without a runtime change. Revives with pack A.
- Review also found a real bug this RFC now fixes: `RunService.compare` has no
  withholding gate, so evidence refs travel around the publicEvents barrier.
- Next: codex session 1 → §1 (gate) + §2 (overlay).
