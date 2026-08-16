# Dead vocabulary implementation plan

Status: implementing 2026-08-16

1. Extend the existing expression census with an opt-in declaration census over the four
   accepted namespaces.
2. Keep producer, consumer, refusal-site, and corpus-firing measurements distinct.
3. Pin the live-source mutation and known near-miss regressions without changing the default
   report or any authoring validator.
4. Document the instrument, run both verification gates, and submit the implementation for
   independent review before archival.

The RFC claims no schema or migration lane. It writes no content and does not join
`make verify`; `DECLARATIONS=1` is an explicit authoring-instrument invocation.
