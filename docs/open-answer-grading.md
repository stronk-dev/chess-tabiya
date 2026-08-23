# Stated reasoning and key-point coverage

Tabiya can pause at an authored `stated_reasoning` checkpoint and record three learner
rows: candidates, plan, and fears. This is coverage instrumentation, not open-answer
chess grading. The durable `reasoning.recorded` event stores the transcript, explicit
skip state, matcher version, and one detection per authored key point.

Key points are grounded by a structural expression, a shape-plan reference, an authored
spine move, or a typed feedback claim. Their phrases belong to the pack and its digest.
The v1 matcher performs NFKC/lowercase/whitespace normalization, word-boundary literal
search, and legal SAN/UCI equivalence at the checkpoint position. It scans candidates,
plan, then fears and records the first matching span. It does not stem, translate,
embed, infer, score, or decide whether reasoning is correct.

The learner-facing honesty sentence is fixed:

> Matching is literal: "not detected" means these exact words were not found in what you wrote — not that the idea was absent, and never that it was wrong.

No score, percentage, detected/total ratio, accuracy, grade, pass/fail result, or
reasoning-quality verdict is produced. A configured LLM may only propose an additional
match by returning a key-point ID plus a verbatim quotation from the learner. The server
checks that pair and renders a fixed attributed frame; provider prose is discarded, the
proposal never changes durable detections, and two invalid responses produce silence.
After a transcript is recorded and authored points are disclosed, the checkpoint sheet
offers this review only when an external language-model provider is configured. The
control repeats the boundary before invocation, renders accepted proposals beside their
named authored point, and reports honest empty output when the provider proposes none.

Transcripts are grant-scoped run data. They do not enter public story cards, PGN, pack
projection, or match-opponent surfaces. Previous-attempt comparison is owner-only and
requires the same pack ID and digest. Run deletion is the retention boundary because no
separate transcript table exists.
