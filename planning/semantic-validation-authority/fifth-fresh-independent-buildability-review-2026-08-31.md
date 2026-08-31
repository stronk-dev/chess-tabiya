# Semantic-validation authority — fifth fresh independent buildability review

- **Date:** 2026-08-31
- **Subject:** fourth author repair in `rfc/semantic-validation-authority.md`
- **Verdict:** returned on [[D2445]]–[[D2449]]
- **Production/protected design:** untouched

## What survives

The fourth repair correctly generalizes validation over event and reading subjects, separates total
root authorities from partial case populations, removes event expectations from neutral rules
oracles and identifies a single protected owner-authority location. The remaining gaps sit at the
exact seams those repairs added; accepting them would restore self-authored or duplicated authority
through a different path.

## D2445 — the proposition union does not compile

R3's normative `SemanticValidationRulesAuthority.proposition` names
`SemanticValidationExistingAssertionAuthority`, `SemanticValidationCitedPropositionAuthority` and
`SemanticValidationOwnerAuthorityRef`. None is declared. The earlier inline authority arms do not
carry R3's required subject, case, constraint digest and expectation record.

Define the three exact reference/resolved-record pairs and their parsers. Every resolved arm must
produce the same closed proposition record before the neutral fact is applied; a name in a union is
not an authority boundary.

## D2446 — wildcard constraints have no meaning

`SemanticValidationFactConstraint.path` permits `*`, but the executable author model throws as soon
as it encounters `*` or any array. The RFC also does not say whether wildcard equality means any,
every, ordered equality or canonical-set equality. This matters for three declared oracle results:
attackers, material pieces and legal UCI moves.

Remove `*` or publish a closed collection/quantifier algebra and use one implementation in the
parser, runner and digest. Add empty/multiple/reordered collection negatives so a proposition
cannot cherry-pick one convenient member.

## D2447 — prior-commit authority trusts the caller

`assertOwnerAuthorityTransition(before, after, admittedRefs, ownerRulings)` rejects same-commit use
only when the caller includes the new id in `admittedRefs`. It never reads before/after case and
profile stores. A staged change can append an owner row, make the case present and pass `[]`.

The process guard must parse the staged/HEAD authority, case and profile bytes and derive newly
present owner refs itself. Those source paths and the transition function belong in the RFC; an
untrusted list is not temporal evidence.

## D2448 — four-way equality is not one-row-per-subject

The author model converts roots, declarations, profiles and verdicts directly to sets. Duplicate
declarations or profiles collapse before comparison, so two contradictory rows for one subject
pass against one root. Assert uniqueness for every population before comparing keys, and preserve
that bijection into receipt generation.

## D2449 — the protected store cannot be created by its implementer

`design/research/semantic-validation-owner-authorities.json` does not exist. R4 correctly forbids
Codex and implementation agents from creating or editing it, but the RFC says no owner ruling is
needed and has no discharge for bootstrapping the empty store. An implementation therefore cannot
reach its own parser input without violating law 5.

Add an owner/Claude-on-an-exact-owner-ruling discharge that creates and validates the empty root
before implementation. This does not ask the owner to manufacture chess truth; it establishes the
protected container into which later explicit rulings may be appended.

## Verification

- `make semantic-validation-fourth-author-repair`: prior four author arms remain green.
- `make semantic-validation-fifth-fresh-review`: reproduces [[D2445]]–[[D2449]] 5/5.

The RFC remains draft. A fifth author repair, the explicit owner-store bootstrap and another fresh
independent review are required before acceptance. No runtime validation, generated verdict or
learner-eligibility implementation is authorized.
