# RFC lifecycle completion implementation plan

1. Land the seven-state lifecycle, status grammar, discharge sections and archive-clearance rule.
2. Hold this RFC in `awaiting — D1` while its named reader is absent.
3. Implement P1–P6 in `tools/status-parity.mjs` by reusing RFC-1's Active parser.
4. Wire and verify the checker, discharge D1, archive the RFC and close only its owned rows.
