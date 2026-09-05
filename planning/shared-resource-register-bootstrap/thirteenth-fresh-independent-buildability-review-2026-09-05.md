# Shared-resource register bootstrap — thirteenth fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewed:** twelfth author repair for [[D2828]]–[[D2834]]
- **Gate:** `make shared-resource-bootstrap-thirteenth-fresh-review`
- **Verdict:** **RETURNED on [[D2843]], [[D2844]] and [[D2845]]**

## Findings

1. **Literal element access loses its authority ([[D2843]]).** The projector accepts
   `safe['secret']` under the literal-key rule, but `relationFor` has no element-access arm. The
   emitted graph contains neither the property declaration nor a site-bound property edge. The
   graph is therefore incomplete for a syntax form the RFC explicitly admits.
2. **Canonical ordering is not one authority ([[D2844]]).** The repair introduces a UTF-8 byte
   comparator, but node ids, root selectors and serialized edges still use JavaScript string
   ordering. The RFC's base canonical-object section separately prescribes UTF-16 code-unit order.
   A full-width BMP identifier plus an astral identifier makes the emitted node and edge order
   disagree with the repair's claimed UTF-8 order. The contract must choose one rule and execute it
   everywhere rather than letting ASCII fixtures make both appear equivalent.
3. **Admission and execution parse different selector languages ([[D2845]]).** The catalogue
   validator admits Unicode `ID_Start`/`ID_Continue` identifiers, issues the descriptor, and only
   then does the projector's ASCII-only parser reject it. Complete catalogue admission therefore
   does not prove that an issued descriptor is executable.

## Executed evidence

The three controls import the twelfth repair model directly and construct committed TypeScript
fixtures. All reproduce. The target retains every predecessor review and author-repair gate before
running these new falsifiers.

## Required repair

Resolve literal bracket access through the exact compiler property symbol and retain the same
site-bound edge/declaration as dot access. Choose one canonical comparator consistent with the
shared canonical byte authority and apply it to every ordered graph/artifact set. Make catalogue
admission and projection consume one selector parser and one identifier grammar. Then run another
genuinely fresh review. No catalogue, checker, register or product implementation is authorized.
