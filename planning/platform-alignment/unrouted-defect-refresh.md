# Unrouted-defect refresh

**Run:** 2026-08-20

**Ledger:** D487/D641

**Instrument:** `tools/work-routing-harness/`

## What this pass proves

Before intervention, `design/BACKLOG.md` contained **589 unique defect ids: 234 closed/rejected and
355 open**. The old `planning/work-register.md` remained frozen around D365-era routing. A join over
every living non-log planning document and every active product RFC found **75 open ids with no
mention at all**.

One was stale: D99 described a propagation hazard from D64 into `engine-leverage`; D64 was repaired,
the consumer was scoped, independently reverified and archived, and no bad cost was certified. D99
is now closed.

The remaining 74 receive exactly one primary destination below. D641 is closed on that omission
result. Current ledger population after recording D641 is **590 ids, 354 open**.

This is deliberately weaker than D487's promised invariant. The other 280 open rows have at least
one living planning/RFC mention, but a mention might be a stale measurement, dependency, duplicate
or historical discussion rather than an owner that can act. Only a derived work register can prove
zero/one/many live destinations and fail on an invalid state. Logs, archived RFCs and research
dossiers must never count as owners merely because they repeat an id.

## Primary routes restored

| Primary destination | Rows | Work represented |
|---|---|---|
| F1 evidence manifest | D568, D584, D631, D142, D228, D264 | projection/consumer declarations and removal of parallel free-text registries |
| F2 semantic evidence | D565, D567, D570, D571, D114 | admission, valence/sign boundary, operands and search-bounded events |
| F3 pack capability/migration | D574-D578, D632, D143 | immutable identities, capability requirements, dependency-aware migration and pilot overlap |
| F4/F7 knowledge/theory | D580, D531, D275 | reproducible knowledge artifacts, cited principle grounding and verifiable attribution |
| R3/F5 assistance | D583, D585-D587, D589, D624, D261 | bounded module packets, deterministic absence/provenance and presets |
| R11/F8 bots | D590-D596, D620-D621 | base/sampler/repertoire/style separation and blind review |
| R12/R13/F9 player profile | D597-D603, D625, D441 | literal metrics, persistent sample floors, acquisition/privacy and longitudinal coaching |
| R18/F12 appliance | D588, D604, D606-D614, D512 | provider-off fallback, data/ops/rights/accessibility and live health |
| R14/O10/F10 campaign | D356, D297-D299, D301-D304 | owner pilot and campaign ruling |
| R3/R7/R8 capability studies | D559, D623 | Review Map/theory/guidance hands-on work and corrected competitor uniqueness |
| Feedback Stage 2 / F3 | D520, D131 | repair the unsatisfiable promotion census and preserve the inference ceiling |
| F11 professional/social | D252 | contest session-kind versus board-control semantics |
| Scoped direct fixes/docs | D511, D410, D413 | latency claim, imported verdict stripping, chess.com refusal wording |

## What the derived register must do

`make work-register` remains unimplemented and RFC/process-gated. Its minimum contract is now
clearer than the old hand-written file:

1. parse one canonical status token from every ledger row and reject duplicate ids;
2. derive active RFC state from the Active table/body parity reader;
3. read explicit machine-addressable destinations from implementation, research, decision,
   content and RFC queues;
4. reject zero destinations, more than one primary destination, closed destinations and archived
   owners with undischarged work;
5. permit secondary dependency links without treating them as ownership;
6. print open/closed/routed counts, but never store a hand-copied “latest D” claim;
7. fail `make verify` if the graph changes without a destination update.

The D641 registry is a disposable repair and test fixture for that future reader. It must not
become a second hand-maintained global work index.

