# Fixture realism implementation plan

1. Replace the hand-authored Maia policy vector with a captured, provenance-bearing fixture and narrow the tolerance to one float32 ulp.
2. Remove content-version pins in favour of behavioural assertions.
3. Make refusal coverage discover every named emitter and close `SourcingError.code`.
4. Add the instrument-fed fixture register and executable clone-and-break boundary checks.
5. Reconcile canonical documentation and run both verification gates.
6. Close D64: make offline tablebase provenance honest, enforce the recorded offline mode, reject the manufactured timestamp shape, re-derive or withdraw affected grounding, and enforce refusal-debt monotonic shrink.
