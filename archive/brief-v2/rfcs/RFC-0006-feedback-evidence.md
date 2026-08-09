# RFC-0006 — Evidence-backed Feedback

## Status

Proposed.

## Decision

Generate feedback from a typed evidence packet. Natural language is a rendering layer.

## Packet sections

- objective state;
- branch divergence;
- Stockfish checkpoints;
- Maia/corpus distributions;
- structural features;
- timing events;
- pack claims;
- source provenance;
- uncertainty flags.

## Safety rules

- every claim references evidence IDs;
- LLM output cannot introduce new claims;
- unsupported causal statements are labeled hypothesis or omitted;
- human and engine WDL never share the same field;
- sample size and confidence shown for corpus facts;
- reviewer overrides are versioned.
