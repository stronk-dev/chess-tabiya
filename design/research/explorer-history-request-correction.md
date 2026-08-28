# Lichess Explorer history request — source correction

**Question:** Does the Lichess `/lichess` Explorer operation support a bounded history width, or
only requested versus disabled history?

**Rows:** [[D1951]], [[D1957]]

**Date:** 2026-08-28

**Verdict:** The provider contract is boolean. A numeric history width would be a locally invented
capability and must not enter request identity. `[V]`

## Evidence

The official Lichess OpenAPI operation for `GET https://explorer.lichess.org/lichess` publishes
`history` as a boolean with default `false`; it publishes no history width parameter. `[V]`
[Official Lichess `/lichess` OpenAPI operation](https://github.com/lichess-org/api/blob/master/doc/specs/tags/openingexplorer/lichess.yaml#L108-L113)

The shipped live paths already match that provider fact at the wire: the sourcing client emits
`history=false`, while `corpusUrl` changes the same parameter to `history=true`. Neither supplies a
width. `[V]` (`apps/server/src/sourcing/explorer.ts:explorerUrl`,
`apps/server/src/corpus.ts:corpusUrl`)

## Contract consequence

The node-free request uses a closed `disabled | requested` union serialized to the provider's
false/true value. `not_requested` is valid only for the disabled arm. A requested response is
`reported` even when its history rows are empty; empty reported history and unrequested history are
not interchangeable. `[M]`

Move-row width remains the provider's numeric `moves` request and retains its own positive-integer
validation. This correction makes no claim about a maximum number of history rows and adds no
client-side truncation disguised as provider identity. `[V]`/`[M]`

## Limits

This verifies request vocabulary, not response-history completeness or latency. Those remain
provider measurements and consumer suitability questions. `[V]`
