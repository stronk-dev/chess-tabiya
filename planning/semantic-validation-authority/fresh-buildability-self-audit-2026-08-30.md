# Semantic-validation authority — fresh buildability self-audit

**Audited:** 2026-08-30

**Author/auditor:** codex. This is an adversarial author-side audit, not the independent acceptance
required by RFC-0000.

**Verdict at entry:** **RETURNED on [[D2039]]–[[D2043]].** The desired semantic-validation gate is
necessary, but five parts left the implementer able to choose the authority or pass a path the
application does not preserve.

## Reproduced findings

1. The required imported-population receipt named no input artifact, reader or distinction among
   played-edge, recorded-path and complete-alternative traversal ([[D2039]]).
2. Cases admitted arbitrary-string abstention while registered operations returned arrays;
   `localSemanticEvents` erases the one native loose-piece unavailable arm through `?? []`
   ([[D2040]]).
3. `operandMap: Record<string,string>` did not define paths, transformations or complete operand
   coverage, so mirror equality was runner-dependent ([[D2041]]).
4. Four named operations are child exports composed inside `localSemanticEvents`; only the latter
   is called from non-test application code, and criterion 13 had no reach/retention check
   ([[D2042]]).
5. Criterion 1 froze 67 landing roots while the active semantic-collectors RFC already declares a
   held promotion-race tablebase event ([[D2043]]).

## Author repair

The amended RFC closes each choice with a failable mechanism: authenticated fixture plus three
sealed traversals; a completed/unavailable union and closed reasons; a total typed mirror leaf walk;
direct application reach or exact projection-multiset retention; and set equality to the current
root inventory with an atomic future-root transition. `make semantic-validation-author-contract`
is the author-side checkpoint.

Fresh independent review remains mandatory. No implementation is authorised by this document.
