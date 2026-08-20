# Capability watch — predeclared instrument plan

**Opened:** 2026-08-20

**Authority:** D554–D556 and platform-alignment execution job 1.4

**Status:** instrument and targeted desk/forum arm answered 2026-08-20; comparable hands-on remains in R3/R7/R8/R11/R15-R17

## Question

Can the dated competitor snapshot become a queryable capability-first watch that notices genuinely
new/loved product behavior, preserves love/hate evidence and routes compatible transformations into
Tabiya without turning every clone or ambiguous product name into roadmap churn?

## Frozen input population

The first run uses the 63-row living `design/research/competitor-matrix.csv` plus every product/capability
already cited in `design/research/integrated-platform-alignment.md`. It does not claim a fresh census
of the whole web. Products added after this plan enter a later dated run.

The initial representative set must include the owner's named 2026-08-20 products (Chessiverse,
Beacon, Quackmate, ChessLab, Qchess/QuChess and RookHub/RepCheck), the incumbent anchors (Lichess,
Chess.com, Chessable) and at least one open/self-hosted workbench. Ambiguous names receive distinct
canonical identities; they are never merged on name similarity.

## Register contract

One row represents **one product as evidence for one capability**, not one roadmap item per product.
Every row must carry:

- stable capability id and concise learner value;
- canonical product id, display name and URL;
- checked date and `[V]`/`[P]` evidence label;
- capability source plus separate love/hate sources or an explicit `not_found`/`not_checked` state;
- what the product does well and its measured/reported limitation;
- Tabiya transformation and explicit non-copy boundary;
- required evidence-producer families, intended consumer/module and present Tabiya status;
- `adopt`, `transform`, `defer`, `refuse` or `research` disposition plus exact route/revisit trigger.

The register is valid only if canonical ids/URLs resolve name collisions, enum fields are closed,
routes are non-empty, source-backed labels contain URLs and each admitted capability has at least
one representative. Product count is reported but never treated as coverage quality.

## Controls

- Duplicate one product under two names: validator must reject canonical URL duplication.
- Give a `[V]` row no source URL: validator must reject it.
- Give an adopted/transformed row no producer, consumer or route: validator must reject it.
- Add a product clone to an already-covered capability: capability count must remain unchanged.
- Add a genuinely new capability id: summary must change and show it unbound to the capability map.
- Preserve `not_found` separately from `not_checked`; absence of a forum complaint is not love.
- No hands-on claim may be inferred from a vendor page or matrix cell.

## Exit

This job completes when a checked register and deterministic summary can answer:

1. which capabilities have representative products and what each uniquely does well;
2. which love/hate evidence is missing rather than silently positive;
3. which transformations are compatible with the rehearsal thesis and existing refusals;
4. which producer/module/current-status dependencies each transformation needs;
5. which entries are duplicates, ambiguous, external-only or require hands-on follow-up;
6. where each surviving capability enters the research, decision or RFC graph.

The watch does not authorize implementation, claim that every product was used hands-on or replace
the deeper R3/R7/R8/R11/R15–R17 teardowns.

## Result

`design/research/capability-watch.json` and `tools/capability-watch-harness/check.mjs` pass the
contract and controls. The current summary covers 19 capabilities through 22 canonical products and
29 evidence rows. The targeted follow-up searched every previously unchecked love/hate cell: 38 of
58 cells now carry reported/observed evidence and 20 are explicit `not_found` (8 love, 12 hate),
with zero `not_checked`. The instrument closes D556 and the targeted desk/forum arm closes; D554's
hands-on comparisons remain consumer-specific work in R3/R7/R8/R11/R15-R17 rather than a claim that
every product has been used.
