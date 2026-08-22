# D872 external disagreement output

Evaluated every positive tag row plus a deterministic 1/20 row-index sample of tag-negative controls from the bounded 250,587-record official prefix. Rejected illegal/unparseable selected rows: 0.

Tag sensitivity and control firing are disagreement measurements, not precision/recall against chess truth. The exact detectors are intentionally narrower than broad source themes.

| source theme | tagged rows | exact event also found | tag sensitivity | sampled tag-negative controls | exact event found in controls |
|---|---:|---:|---:|---:|---:|
| `capturingDefender` | 1,642 | 1,638 | 99.8% | 12,442 | 283 (2.3%) |
| `deflection` | 10,915 | 494 | 4.5% | 11,989 | 150 (1.3%) |
| `attraction` | 9,088 | 47 | 0.5% | 12,094 | 171 (1.4%) |
| `clearance` | 3,352 | 36 | 1.1% | 12,365 | 478 (3.9%) |
| `interference` | 928 | 345 | 37.2% | 12,484 | 8 (0.1%) |
| `intermezzo` | 2,891 | 1,980 | 68.5% | 12,387 | 70 (0.6%) |
| `overloading` | 0 | 0 | n/a | 12,530 | 211 (1.7%) |

## Separately named exact contracts

These replace the three alias hypotheses above; they do not overwrite the retained-duty or opened-ray events.

| source theme | separate exact contract | tagged rows | exact event also found | tag sensitivity | exact event in controls |
|---|---|---:|---:|---:|---:|
| `deflection` | defender duty displaced, then target captured | 10,915 | 10,153 | 93.0% | 371/11,989 (3.1%) |
| `attraction` | heavy piece captures bait; king is checked or queen/rook later captured | 9,088 | 9,079 | 99.9% | 6/12,094 (0.0%) |
| `clearance` | square vacated for later slider move | 3,352 | 3,294 | 98.3% | 331/12,365 (2.7%) |

## First disagreements

- `capturingDefender` tag misses: 0W9ml, 1BF5D, 1DHU6, 2Uc5O; control firings: 002VP, 02Chp, 02kJ2, 03HuZ, 04BFf, 04JOG, 04PzJ, 05DWq.
- `deflection` tag misses: 001h8, 002Mm, 003IM, 004LZ, 004b0, 005do, 0068B, 006E1; control firings: 02kJ2, 03H9V, 04Lkb, 04WWn, 05eyk, 061VF, 065LI, 06Ths.
- `attraction` tag misses: 001w5, 003cs, 003mh, 004RF, 004zh, 005do, 006wz, 00761; control firings: 00e7H, 021cc, 02kJ2, 03H9V, 04Lkb, 04WWn, 05eyk, 061VF.
- `clearance` tag misses: 004sg, 005HG, 00A8H, 00Aae, 00AhO, 00Ar2, 00Huv, 00IMS; control firings: 00Kia, 00SlL, 00mvP, 01kUF, 01t6f, 01uWs, 021Bk, 0284S.
- `interference` tag misses: 000h0, 002LF, 004Ud, 01A5W, 01Qta, 01RXs, 01aM3, 01jvC; control firings: 05XN1, 0E9Jl, 0uoSK, 1MR0Q, 1cvVm, 1varH, 2522W, 2M7W5.
- `intermezzo` tag misses: 004zh, 00DII, 00Ns0, 00xrk, 01Tr9, 01fTa, 01iJG, 01qgQ; control firings: 00Wfu, 033Z0, 03H9V, 03wUw, 05QYt, 06UgW, 0B4bV, 0B9uh.
- `overloading` tag misses: none; control firings: 01OSA, 04dKw, 0531Y, 06QTl, 06Ths, 06VY4, 07dVd, 07rfr.

Interpretation: low agreement does not license broadening an exact predicate until it matches a theme. It routes fixture review: determine whether the source theme names another bounded fact, whether the exact event occurs at a different parity/horizon, or whether the source label is noisy.
