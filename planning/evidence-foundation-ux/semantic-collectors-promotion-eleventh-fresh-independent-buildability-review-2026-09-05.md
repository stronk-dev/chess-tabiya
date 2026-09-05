# Semantic collectors promotion — eleventh fresh independent buildability review

**Date:** 2026-09-05
**Verdict:** RETURNED on [[D2789]]–[[D2794]]; the evidence spine stays 12/14.

## Scope and method

This pass reviewed the tenth bounded author repair against the production sourcing validators,
pack validator and its predecessor result authority. It retained the entire prior promotion chain,
then added six able-to-fail tests under
`tools/d2789-semantic-collectors-promotion-eleventh-fresh-review/`.

## Findings

1. **[[D2789]] installed authority is absent.** `openPromotionArtifactStore(directory)` accepts any
   caller-selected realpath. Three canonical caller files plus an arbitrary source id and a
   syntactically correct Lichess URL mint an exact recorded reading. There is no installed artifact
   inventory, release generation or owning registry.
2. **[[D2790]] the artifact has no valid pack subject.** The author fixture omits almost the entire
   drill-pack schema and `validatePackDocument` rejects it, yet the durable collector emits a
   reading. Its evidence ledger has no pack id/version/digest join.
3. **[[D2791]] pointer existence is not semantic support.** `/start/fen` may resolve to a different
   FEN from the tablebase record's anchor and values. The store checks only `found`, so the
   contradiction is admitted.
4. **[[D2792]] response identity is unverified metadata.** No Syzygy response body is loaded. An
   arbitrary 64-hex digest and byte count remain in the authority receipt even when neither matches
   the canonical response bytes from which the values would have to be parsed.
5. **[[D2793]] legal authority is a token.** `legal-authority.json` contains only
   `{status:"available"}`; a separate in-memory resolver creates exact legal moves and the token's
   digest is absent from the derivation. Malformed token bytes are caught as upstream absence rather
   than invalid evidence.
6. **[[D2794]] the durable boundary is bypassable after collection.** Public predecessor factories
   construct a complete sealed recorded reading without a file read. The current assertion accepts
   it by delegating to `assertPriorResult`, while `recordedAuthorityReceipt` correctly says the
   recorded source has no current durable authority.

## Required bounded repair

- Resolve an exact installed artifact generation through an owning registry; arbitrary directories
  must not self-register.
- Validate the complete pack/sourcing artifact and bind pack id, version and digest.
- Give tablebase supports a declared semantic grammar and prove the supported subject/value equals
  the record subject.
- Retain canonical Syzygy response bytes; recompute digest and length; parse values from those bytes.
- Replace the legal status token with an exact FEN-bound legal-map result whose failure algebra
  distinguishes invalid evidence from honest unavailability.
- Make every current recorded aggregate result retain the current store receipt; predecessor-only
  recorded results must fail the current assertion.

The next fresh review should additionally attack coherent-generation reads while files are replaced,
registry/store crossing, pack-digest staleness, response-parser disagreement, legal-map crossing,
and live versus recorded result seals.

## Verification

`make semantic-collectors-promotion-eleventh-fresh-review` retains the complete predecessor chain,
passes all six new falsifiers, and passes strict TypeScript. These tests document currently admitted
unsafe cases; they are not production implementation evidence.
