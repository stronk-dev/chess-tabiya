# Detection-landscape output

Population: first 50,000 complete rows from the bounded Lichess puzzle-export prefix.

| cheap detector | tagged positives | recall vs tag | precision vs tag | predicted rate | legal-alternative fire rate |
|---|---:|---:|---:|---:|---:|
| `fork` | 6,393 | 100.0% | 32.3% | 39.61% | 8.08% (15,742/194,726) |
| `pin` | 3,043 | 41.4% | 39.0% | 6.46% | 2.37% (2,458/103,894) |
| `discoveredAttack` | 2,575 | 99.4% | 19.7% | 25.93% | 20.48% (17,184/83,910) |
| `hangingPiece` | 1,833 | 99.9% | 7.9% | 46.63% | 0.88% (438/49,981) |

First disagreement IDs (for reproducible hard-negative inspection):

- `fork`: false-positive candidates 000h0, 000hf, 00143, 001Fg, 001gi; false-negative candidates none.
- `pin`: false-positive candidates 000aY, 002O7, 005HG, 006ia, 009FS; false-negative candidates 001Hi, 001kG, 002e8, 002rd, 003Ec.
- `discoveredAttack`: false-positive candidates 000Pw, 000Sa, 000VW, 000rZ, 0018S; false-negative candidates 009FS, 01MsO, 01ZrS, 035YV, 03hfJ.
- `hangingPiece`: false-positive candidates 0009B, 000Sa, 000aY, 000h0, 000jr; false-negative candidates 0Kfco.

Interpretation: this is agreement with an automatically generated, vote-refined reference, not manual ground truth. Low agreement can mean an over-broad cheap definition, a line-level semantic mismatch, or a missed event. It is evidence against promoting the cheap probe unchanged.
