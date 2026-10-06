# D3262 / D3484 — separate semantic-continuation source capture

2026-10-06. Disposable provider research under RFC-0000's exploration gate.
This is not a recursive semantic selector, target proof or production profile.

## Exact source obligation

The unchanged D3483 frame retains 182 target/candidate cells / 3,276 first-reply
semantic-reserve arms and all 193 offered candidates with explicit unsupported
controls. Its supplement requires **870 exact-FEN positions / 2,028 budget queries**.
Capture only those literal missing budgets, not all three budgets for every FEN.
The 33,022 queries matching the D3478 planned frame are still separately awaited;
they are not supplied by this supplement.

Frozen compressed frame SHA-256
`191ca5935b501dc6164116cbc10ecaeb3ac1ae8e87e1ec6d3295b65f84508252`;
logical SHA-256
`203791b0c532b3573a8a0607e4d0c89af0cfb6e67b4b3ea7a7a2b1a17d8f0f62`.
Actual Stockfish 19 executable SHA-256
`dc2f18c34ae962dff591b66147d220ec06e61d756b93d8a4f5e04fd8e55c251f`;
one thread, 16 MiB hash, standard castling, fresh game/cleared hash per query,
top eight legal moves and literal raw UCI cp/mate/bound values. All legal moves
are passed as searchmoves; the latest complete depth table is retained rather
than mixing individual latest ranks. Unranked moves remain unknown.

## Separate resumable execution

`make semantic-search-semantic-final-ply-batch` uses 35 immutable intervals in
the ignored `d3262-stockfish-semantic-third-ply-chunks/` directory. It verifies each
existing interval before reuse and publishes newly checked intervals atomically,
without replacing earlier bytes. A failed active interval cannot masquerade as
complete or alter the other captured intervals. `MAX_NEW` is an optional ordinary
Make argument for bounded execution, not a change to source population.

The existing D3478 frame, batch and capturer are untouched. The new isolated query
transport shares the existing legal enumeration, coherent-rank selector and source
validator; no running executor is refactored underneath its capture. Model history
is not FEN-keyed and no Maia call is made here. The source header explicitly says
`semantic_third_ply_missing_budgets_only`.

The first actual interval passes: 25 positions / 53 queries / 424 coherent entries,
raw interval SHA-256
`e00f2f116e58bea6a6f47c212d87a3ffac7d9171e672461358b29c1ab160ee52`.
The complete capture and merge/check now pass all 870 positions / 2,028 queries:
70,525 repeated legal-move observations and 15,939 coherent ranked entries. There
are 574 queries with a later incomplete depth; their retained table is the earlier
complete coherent depth, not a mixture. The initial interval is not used as the
complete-source proof.

Portable source `d3262-stockfish-semantic-third-ply-capture.json.gz`: compressed
SHA-256 `b5a6e8558aff3e43e4226e40ea5e70efa3c3f935925ad7ca04051edd9d14ddb7`;
logical SHA-256
`103519c0fee0035ede0055e87aee9dfa2c0cb76af30b3bb6a8f7a43b31d63aaa`.
All 35 original interval hashes and literal query rows are retained.

## Checks and limitations

- `make semantic-search-semantic-final-ply-source-test`: seven tests pass. The
  actual frozen missing-budget population, source/interval/legal/PV/depth/timing/
  bestmove/extra-option mutations and full-versus-partial merge boundary are checked.
  Synthetic UCI transport controls require the configured options, fresh reset and
  complete legal searchmoves for all three budget kinds; early child failure and
  teardown are exercised. Synthetic zero-score rows are never published as sources.
- `make semantic-search-stockfish-source-independent-test`: five Python controls
  pass using read-only repository access in the existing pinned image. Numeric
  booleans cannot impersonate source/version/rank/timing operands; invalid UCI hits
  the intended PV guard; partial populations and false interval history refuse.
  The fifth control preserves the original provider contract: no-legal-move
  terminal flags are not retroactively rewritten as automatic material/75-move
  game outcomes. The semantic supplement separately excludes those game terminals.
- `make semantic-search-semantic-final-ply-merge` and
  `make semantic-search-semantic-final-ply-check` pass the complete 35-interval
  population, preserving literal rows/hashes and publishing portable gzip without
  replacement. The seven source/transport controls pass again on final bytes.
- `make semantic-search-semantic-final-ply-independent` passes all 870 positions /
  2,028 queries, 15,939 ranked entries and **137,949 independently replayed PV moves**.
  All 35 original interval bytes/hashes and literal rows match. Eight actual source
  corruptions fail named guards: lost position, crossed source, lost budget, lost
  legal move, changed depth, illegal PV, forged timing and illegal bestmove. It does
  not run Stockfish or independently reproduce numerical evaluations. The same
  checker has a separate explicit command for the original D3478 population;
  its complete source is still awaited.

The two capture queues run concurrently on this host. Literal per-query timings
are retained, but are not controlled cold/warm/offline measurements or a causal
comparison of search profiles. No observed-human frequencies, statistical quality
inference, semantic prevention or all-defence proof follows from provider ranks.

D3484 closes this bounded source obligation after full merge/check and independent
replay pass; D3478's larger capture remains doing and is not closed by this source. Actual
semantic target joins, the recursive semantic arm, common five-arm proof/refutation/
contrast and end-to-end costs, criterion 23 / Discharge D1, source/A4/owner-use/
content/release obligations and the full 1.0 goal remain open. No production,
protected intent/archive, capability, milestone or RFC promotion; no fresh GitHub,
push or deployment claim. Routine metadata maintenance is automatic.

Final `make staged-process-contracts verify-governance` exits zero over the corrected
scoped index: exact source/register/history, durable state, anchored roadmap/receipt,
protected intent, docs/test tiers and append-only/flow-back checks pass. Unrelated
historical rows and all eight other milestones remain unchanged. Only terminal
receipt/log prose follows; normal hooks recheck the final staged bytes.
