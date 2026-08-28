# Pack-capability contract — repeat-review handoff

- **Document:** `rfc/pack-capability-contract.md`
- **Prior return:** `independent-rereview-2026-08-26.md` ([[D1620]]–[[D1626]])
- **Author checkpoint:** 2026-08-28
- **Production status:** untouched; lane 0.30 and corpus application remain forbidden
- **Executable candidate:** `make pack-capability-closure` — 7/7 at the author checkpoint

## What changed

1. `CapabilityDeclaration` now has a literal acyclic `dependsOn` graph and the separate
   `CAPABILITY_APPLICABILITY` table has `always`, literal, absent and resolved-reference selectors.
   One deterministic algorithm closes the exact pack requirement set and rejects both missing and
   extra stamps.
2. `CapabilitySite` is a closed symbol/discriminant-arm union. Canonical token images, ordering,
   hashing and transitive dependency digests are specified. The helper-only D566 fixture
   invalidates pawn-safe and outpost, not isolated-pawn.
3. Semantic disposition and deployment reachability are separate closed types. Current
   `reached`/`retired`/`refused`/`unmeasured`/`impossible` values map totally; configured provider
   failure has an exact no-event/no-revision retryable operation boundary.
4. The census is rooted in mandatory schema annotations/exclusions, interpreter annotations, a
   literal 13-evaluator/16-table inventory, and the compiled F1 manifest. Five failures have
   distinct codes, including a count-preserving id swap.
5. Executable baselines are current: `37/193/25/210 core`, `67/67/15/1 semantic`, and format
   `7 reached / 3 refused / 1 retired / 1 unmeasured`. Historical subject arithmetic is explicitly
   non-normative.
6. The version rule is type-directed. Current capability authority must be structured; exact old
   wire values survive only through a named compatibility fixture/parser; artifact-schema ids are
   outside the rule.
7. F7/Phase 8, the shipped evidence-kinds register and [[D1508]] now own the prior dead
   destinations. The seven ledger effects are D5–D12 Discharges, and the checkpoint arity was
   corrected directly in `rfc/README.md`.

## Required adversarial attacks

Do not accept on prose correspondence. Re-derive and attempt to break these seams:

- Does the selector grammar cover array members and absent defaults without making the derivation
  function a second unversioned authority?
- Can a helper-only change still evade the digest, or can a harmless sibling-arm edit invalidate
  unrelated declarations?
- Can a source annotation and declaration be swapped together while every independent root passes?
  If yes, identify the additional authority needed; do not bless a self-consistent false mapping.
- Do the 13 evaluator and 16 table rows exactly match the source derivation, including guards and
  the pressure-line prose scale?
- Does the semantic/deployment algebra preserve a configured pack across provider death and
  recovery without exposing refused/unmeasured/impossible rows as supported?
- Can a suffix literal construct current authority outside the contextual-type/call checks? Can the
  rule accidentally reject a legitimate legacy payload or schema id?
- Are every ledger/log/register consequence and every D560/Gate-F hold visible in a real checked
  owner, with no free-prose completion promise left?

## Review outcome

Return with new ledger rows for every blocker, or mark the RFC accepted on buildability and update
the active register. Acceptance authorises planning/implementation of the mechanism only. It does
not lift [[D560]], apply `requires` to the corpus, publish packs, select the pilot, or lift Gate F.
