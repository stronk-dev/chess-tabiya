# Maia identity framing — 2026-09-30

Authority: implementing provider-health/exchange identity contract. Scope: D3343.

The sidecar previously treated the first TCP recv as a complete identity request. A permanent
real-socket control sent the suffix only after the real sidecar had received the prefix; it
failed at its response deadline. The instrumentation observes actual receives, not a timed
sleep or mocked transport.

The sidecar now accumulates only a possible identity-command prefix under one absolute
five-second monotonic deadline. Ordinary UCI bytes retain their original forwarding path.
An EOF/timeout during a partial identity request discards it rather than contaminating the
shared engine's next command. The response protocol and artifact identity remain unchanged.

Verification:

- `make maia-identity-check`: five JS/Python controls and six actual sidecar/TCP controls.
  The split-request negative now captures the same artifact. An abandoned prefix followed by
  coalesced uci/isready returns both expected acknowledgements, then a fresh identity capture.
- The Python framing control verifies decreasing remaining budgets, expiry rather than a reset,
  intact ordinary command bytes and incomplete-probe discard. It is a deterministic deadline
  test, not a claimed wall-clock performance measurement.
- `make typecheck`: zero errors/warnings; `make release-policy-check`: 42 tests and policy pass.
- Existing architecture/render/probe tests remain permanent. Native release CI already runs the
  same identity target on both architectures; no remote matrix run is claimed here.

The UCI fixture remains readiness-only. No real Maia inference, full bot selection journey or
human-likeness claim is made. No provider semantic image, capability declaration, authored pack
or protected intent changed. The Explorer migration remains pending owner approval, and the
source-build deployment defects D3338/D3342 remain open.
