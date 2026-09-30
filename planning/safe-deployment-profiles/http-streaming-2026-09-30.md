# Streaming egress production checkpoint — 2026-09-30

Authority: implementing `rfc/safe-deployment-profiles.md` §9; D1847 and D3332.

## Implemented

The ordinary `createHttpServer → writeNodeResponse` path now adapts the Web body to a Node
readable and pipelines it with backpressure instead of calling `arrayBuffer`. Headers and first
bytes do not wait for producer completion. Client disconnect aborts the owning request and cancels
the producer, including a handler that returns after disconnect. Normal completion does neither.

HEAD/204/304 responses never write a body; HEAD cancels its unused producer. A source error after
headers commits terminates the transport rather than appending a JSON failure. A pre-header failure
clears unsent export headers and returns the existing generic typed 500, without private error text.
Failure of that fallback is caught and ends the transport, not an unobserved promise rejection.

This is egress only. Request buffering/budget/timeouts (D1846), product WebSocket/SSE routes, CSP,
deployment-admin receipts and full packaged-export/owner-device release journeys are not delivered
by this checkpoint. No chess content or capability declaration changes belong to it.

## Verification

- Six controls failed against the original adapter: withheld first byte, missing live/late body
  cancellation, consumed HEAD, blocked partial-failure path and a fully drained paused-socket source.
- Final `make http-streaming-check`: 11 real HTTP tests pass, including the unsent-header failure
  and normal completion. No application pack loader or authenticated API reach is substituted here:
  the named subject is the production HTTP transport adapter.
- Final `make http-streaming-proxy-check`: first bytes of `text/event-stream` and
  `application/x-chess-pgn` arrive through trusted TLS before a separate request permits completion;
  headers survive, normal completion cancels zero producers, disconnect cancels exactly one.
- That proxy proof uses the exact rendered appliance Caddyfile, Caddy index digest
  `sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648` and production Node
  base digest `sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6`.
  The upstream is disposable and runs the actual adapter, not the complete packaged application.
  Its first fixture correctly failed because publishing from an internal-only network supplies no
  public port; the final fixture mirrors separate public and internal proxy edges and passes.
- Direct controls are automatically discovered by the ordinary software suite. Native release CI
  now runs the pinned proxy target on both architectures; a scaffold control refuses missing wiring.
  The local run proves only this host's native architecture, not a remotely executed matrix.
- Final `make typecheck`: zero errors and warnings. `make capability-check`: all 819 committed
  declarations retained; 827 in-flight candidate images match. The extra eight belong to the
  separate Explorer migration (D3330), not this adapter. `make schema-check`: scaffold, packaging
  and hooks validate.

The independent Explorer implementation remains uncommitted and its content migration remains
owner-blocked. Full working-tree application/software/browser gates remain unproven behind that
dependency. No RFC archive, full capability/milestone completion, publication or remote-green claim
is made. The scoped commit must exclude its two unrelated REST query/import hunks.
