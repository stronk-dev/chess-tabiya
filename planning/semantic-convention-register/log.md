# Semantic-convention register log

## 2026-08-27 — Draft opened

D1722's executable census now supplies an exact 39-member initial set. The process draft adds a
distinct sorted `id@version` membership grammar, per-member collision detection, a narrowly bounded
empty-before-first-landing state and a future TypeScript-derived tree reader. It changes no product
bytes and waits on independent process/buildability review.

## 2026-08-27 — Independent review return

The review returned three buildability gaps. Full-ref collision keys allow two RFCs to advance one
convention lineage concurrently ([[D1917]]); the member-only tree projection cannot observe the
same-version semantic rewrite C10 claims to catch ([[D1918]]); and the only executable initial seed
is a private constant inside a file labelled disposable, with no durable authority specified for
C10 ([[D1919]]). A three-arm falsifier reproduces all three. [[D1920]] separately corrects the
resource count: semantic conventions would be the eighth registered resource, not the seventh.
Exact return: `independent-buildability-review-2026-08-27.md`.

## 2026-08-27 — Return amendment

The claim key is now the base convention id and C10 requires `@1` for a new id or exactly landed
head+1 for an existing id; concurrent `space@2`/`space@3`, duplicate-next and skipped/backward
fixtures fail while independent lineages may advance together. The tree/register contract is
explicitly identity-only; semantic bytes are owned by the product RFC's append-only staged and
first-parent history, so C10 no longer claims it can observe data it projects away. The private
disposable seed moved to stable
`planning/semantic-convention-register/initial-members.json`, and the D1722 census now consumes it
directly; future C10 consumes the same file. All resource wording now says eighth. Repeat review is
next; process implementation remains unauthorized.

## 2026-08-28 — Repeat independent review return

The lineage, identity-only scope and stable 39-member seed survive, but six buildability failures
keep C10 in draft. Assistance lands first, making semantic conventions ninth ([[D2013]]); the final
snapshot cannot prove the previous claimant ([[D2014]]); the literal tree extractor and JSON-expanded
product source conflict ([[D2015]]); semantic history has no named repository authority ([[D2016]]);
unbounded decimal versions alias under JavaScript `number` ([[D2017]]); and the seed-to-live-claim
rule is not scoped away after the legal 39/0 landing ([[D2018]]). The six-arm reproduction passes
behind `make semantic-register-repeat-review`; exact return and repair order are in
`repeat-independent-buildability-review-2026-08-28.md` and `repeat-author-handoff.md`.

## 2026-08-28 — Second-return author repair

The register now derives its future count after assistance (resource nine) and reuses the C9
staged/first-parent claimant transition. The product's reviewed JSON feeds one checked generator
whose output is the literal TypeScript authority; semantic history is canonical JSONL at one named
path with one checker and stable Make/CI targets. Convention versions are canonical positive safe
integers, and seed equality has explicit zero-landed and post-landing phases. Reconciliation found
[[D2019]]: a row cannot contain its own Git commit hash, so the row retains ref/semantic/registry/
owner fields while Git history supplies the introducing commit. Seven author arms plus the 19 prior
contracts pass. Fresh independent review remains; C10/product implementation is unauthorised.

## 2026-08-30 — Fresh review waits on the returned transition predecessor

The AssistanceConfig predecessor was returned on [[D2037]]/[[D2038]]: its committed first-parent
arm cannot run in the shallow governance checkout and its changed-symbol transition lacks a closed
source-authority census. C10 explicitly reuses that transition reader. The seven D2013–D2019 author
arms remain valid in isolation, but semantic-register fresh review and implementation now wait for
the predecessor repair rather than pretending the shared transition is executable.
