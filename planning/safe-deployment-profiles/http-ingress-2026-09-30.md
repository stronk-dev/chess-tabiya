# Lazy HTTP ingress and early proxy refusal — 2026-09-30

Authority: implementing `rfc/safe-deployment-profiles.md` §§7–9.
Closed scope: D3333, D3336, D3337, D3339. Remaining: D1846, D3334, D3335, D3338.

## Production changes

The Node adapter constructs a request without first collecting or UTF-8-decoding its upload.
A zero-prefetch Web stream pulls the original incoming bytes only on consumer demand, allowing
the existing application Host/Origin/Fetch-Metadata policy to refuse before body parsing.
Cancelling a request reader stops consumption without destroying the response socket; an early
response closes an unread-upload connection after delivery, rather than keeping it reusable.
An additional real-socket negative caught cancellation awaiting iterator teardown behind a
first read with no byte. Cancellation now completes immediately and observes late iterator
teardown after terminal closure; it cannot wait for another upload byte (D3339).

The native parser is strict and configured for 16 KiB headers, 10-second complete headers,
30-second complete request, five-second keep-alive idle and no generic response timeout.
Deadline checks poll once per second, not Node's default 30-second interval. Real incomplete
requests return native 408; they do not append the adapter's generic 500. Deadline tests use
specific protocol deadlock guards, not a blanket suite timeout increase or a performance tier.

The original pinned TLS control still stalled after the native repair: the upstream received
the POST but Caddy withheld its response while draining the unfinished HTTP/1 upload. Both
appliance/hosted templates now enable full duplex. The same exact rendered/pinned appliance
control delivers Origin 403 and a cancelled bounded-consumer 413 before upload completion.
The latter proves transport cancellation/response delivery, **not a shipped global budget**.
Existing egress first-byte and disconnect-cancellation controls remain in the same release proof.

`make verify-deployment` also exposed an existing invalid wrapper: the renderer now requires
Maia manifest/config digests but the local operator Make targets omit them. Configuration
verification now renders explicitly inert fixture identities and validates both Caddyfiles
without starting server/Maia services. These identities never stand in for real deployment
subjects. D3338 preserves the broken operator-wrapper obligation; it is not silently closed.

## Contract gaps retained

`design/research/http-ingress-contract.md` records D3334's body-selector/pre-read contradiction
and D3335's missing current auth/Campaign/module operation identities. D1846 stays open until
the contract is repaired, a current complete registry is compiled, the application enforces
declared/chunked limits and compressed-request refusal, and their production controls pass.
No extra discriminator header, permission policy or semantic capability version was invented.

## Verification

- Initial native run: eight failures of nine; oversized headers already failed in the native
  parser. Initial proxy run: unfinished Origin-refused POST reaches its deadlock guard.
- Final `make http-ingress-check`: ten real HTTP cases pass, including no body read before
  policy refusal, progressive non-UTF8 bytes, cancellation followed by 413, strict parser bounds,
  actual incomplete-header/body 408, pending-read cancellation and exactly one terminal response.
- `make http-streaming-check`: all eleven existing egress regressions pass.
- `make http-streaming-proxy-check`: five proofs pass with the production pinned Node 24 base
  and rendered pinned Caddy: unfinished-upload 403/413, two first-byte-before-completion bodies
  and last-waiter/disconnect cancellation. This is the actual adapter/policy behind the proxy,
  not a booted authenticated packaged application or a remotely run architecture matrix.
- `make verify-deployment`: packaging guard, three omission/comment/wiring controls and actual
  pinned Caddy validation for appliance and hosted pass. The native release matrix now runs it
  beside the proxy proof; scaffold controls refuse omitted wiring.
- Full typecheck: zero errors/warnings. Capability integrity: 819 committed declarations retained,
  827 candidate images match; the eight extra images belong to the unchanged D3330 Explorer
  migration. Scaffold/packaging/hook checks pass.

Full working-tree application/content/browser gates remain blocked by that unapproved Explorer
migration, unchanged by this checkpoint. No content writes, protected intent edits, RFC archival,
milestone completion, push or deployment occurs. The 1.0 goal remains active.
