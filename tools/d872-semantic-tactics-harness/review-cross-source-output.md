# D918 whole-game typed-source overlap output

Engine: Stockfish 18; shipped StockfishEvidenceExecutor; 100 ms per eval and WDL request; Threads 1, Hash 16, MultiPV 1.
Population: 8 deterministic whole games sampled evenly from the sealed 108-game imported population; 658 played transitions / 661 positions.
Opening source: pinned lichess-org/chess-openings exact endpoint set. Semantic source: shipped research.r2_candidate@1 selection over local registered events. Tablebase column measures domain eligibility only; it does not invent or fetch an outcome.

## WDL perspective

Position-level Pearson with white-perspective cp (626 cp positions): raw side-to-move WDL 0.015; white-normalized WDL 0.847.
Adjacent cp-delta sign agreement (613 cp→cp transitions): raw WDL 303/613 (49.4%); white-normalized WDL 420/613 (68.5%).
Raw-vs-normalized WDL adjacent sign agreement: 229/653 (35.1%); terminal positions remain explicit source absence.
Median per-game top-3 Jaccard: cp↔raw WDL 0.000; cp↔white-normalized WDL 0.200; raw↔normalized WDL 0.000.
Absolute adjacent WDL change median/p90: raw 90.1/100.0 pp; normalized 0.6/23.8 pp.

## Source availability and overlap

| population | rows | selected semantic fact | exact opening endpoint | ≤7-piece tablebase domain | any non-engine factual source |
|---|---:|---:|---:|---:|---:|
| all transitions | 658 | 509 (77.4%) | 24 (3.6%) | 55 (8.4%) | 525 (79.8%) |
| engine top-3/game | 24 | 17 (70.8%) | 0 (0.0%) | 2 (8.3%) | 19 (79.2%) |

## Contract consequence

There is no cross-source scalar in this result. Cp/mate, normalized engine WDL, exact tablebase category/DTZ, human-model/corpus probability, opening identity and semantic facts retain separate typed units and source-local admission. A Review selector may combine eligible moments through declared family priorities/quotas and deterministic ties; it may not coerce mate to cp, treat DTZ as advantage magnitude, treat human probability as quality, or subtract an un-oriented WDL. Provider absence is per source, never failure of the packet.
