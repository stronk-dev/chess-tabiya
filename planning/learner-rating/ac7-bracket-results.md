# Learner-rating AC-7 bracket simulation — results

Preregistered method: `planning/learner-rating/ac7-bracket-preregistration.md`. Source seal: `sha256:4634adbb3250e83e471811c57a3ebce738f66fdcc0494c023075a7cea24b65f8`.

**Verdict:** supported rounded bracket **1500–1800 BCS**; shipped rounded bracket **1500–1800 BCS**; agreement.

Clearing grid points: 1450, 1550, 1650, 1750. Borderline cells: 1.

Coverage is measured at the first period where the shipped update reaches RD ≤ 60. Period counts are weekly under both arrival arms; the count-closing arm has 12 games/week and the clock-closing arm 3.

| true BCS | model | arrival | coverage | Wilson 95% | periods p50 | periods p90 | never ready | clears |
|---:|---|---|---:|---:|---:|---:|---:|---|
| 950 | logistic | count_closing | 69.8% | 67.7%–71.7% | 8 | 10 | 0 | no |
| 950 | logistic | clock_closing | 0.0% | 0.0%–29.9% | 39 | 58 | 1991 | no |
| 950 | thurstone | count_closing | 87.7% | 86.2%–89.1% | 9 | 12 | 0 | no |
| 950 | thurstone | clock_closing | 0.0% | 0.0%–0.0% | — | — | 2000 | no |
| 950 | draw_floor | count_closing | 0.1% | 0.0%–0.4% | 6 | 6 | 0 | no |
| 950 | draw_floor | clock_closing | 0.0% | 0.0%–0.2% | 34 | 49 | 1 | no |
| 1050 | logistic | count_closing | 87.9% | 86.5%–89.3% | 7 | 9 | 0 | no |
| 1050 | logistic | clock_closing | 84.7% | 81.1%–87.7% | 54 | 94 | 1537 | no |
| 1050 | thurstone | count_closing | 95.3% | 94.3%–96.1% | 7 | 9 | 0 | yes |
| 1050 | thurstone | clock_closing | 85.4% | 77.4%–91.0% | 51 | 86 | 1897 | no |
| 1050 | draw_floor | count_closing | 6.3% | 5.4%–7.5% | 5 | 6 | 0 | no |
| 1050 | draw_floor | clock_closing | 7.5% | 6.4%–8.7% | 29 | 40 | 0 | no |
| 1150 | logistic | count_closing | 93.7% | 92.5%–94.6% | 6 | 7 | 0 | yes |
| 1150 | logistic | clock_closing | 96.9% | 96.0%–97.5% | 39 | 65 | 58 | no |
| 1150 | thurstone | count_closing | 97.4% | 96.6%–98.0% | 6 | 8 | 0 | yes |
| 1150 | thurstone | clock_closing | 98.9% | 98.3%–99.3% | 44 | 77 | 204 | no |
| 1150 | draw_floor | count_closing | 38.8% | 36.7%–41.0% | 5 | 6 | 0 | no |
| 1150 | draw_floor | clock_closing | 45.6% | 43.4%–47.8% | 25 | 31 | 0 | no |
| 1250 | logistic | count_closing | 94.1% | 93.0%–95.1% | 5 | 6 | 0 | yes |
| 1250 | logistic | clock_closing | 97.4% | 96.6%–98.0% | 26 | 35 | 0 | yes |
| 1250 | thurstone | count_closing | 95.5% | 94.4%–96.3% | 5 | 6 | 0 | yes |
| 1250 | thurstone | clock_closing | 98.2% | 97.5%–98.7% | 27 | 37 | 0 | yes |
| 1250 | draw_floor | count_closing | 74.3% | 72.3%–76.2% | 5 | 5 | 0 | no |
| 1250 | draw_floor | clock_closing | 77.5% | 75.7%–79.3% | 21 | 26 | 0 | no |
| 1350 | logistic | count_closing | 96.0% | 95.0%–96.7% | 4 | 5 | 0 | yes |
| 1350 | logistic | clock_closing | 98.0% | 97.2%–98.5% | 20 | 25 | 0 | yes |
| 1350 | thurstone | count_closing | 96.7% | 95.8%–97.4% | 4 | 5 | 0 | yes |
| 1350 | thurstone | clock_closing | 98.2% | 97.5%–98.7% | 20 | 25 | 0 | yes |
| 1350 | draw_floor | count_closing | 89.5% | 88.1%–90.8% | 4 | 5 | 0 | no |
| 1350 | draw_floor | clock_closing | 91.3% | 90.0%–92.5% | 19 | 21 | 0 | yes |
| 1450 | logistic | count_closing | 97.2% | 96.3%–97.8% | 4 | 4 | 0 | yes |
| 1450 | logistic | clock_closing | 98.0% | 97.2%–98.5% | 18 | 20 | 0 | yes |
| 1450 | thurstone | count_closing | 97.2% | 96.3%–97.8% | 4 | 4 | 0 | yes |
| 1450 | thurstone | clock_closing | 98.2% | 97.5%–98.7% | 18 | 20 | 0 | yes |
| 1450 | draw_floor | count_closing | 96.3% | 95.4%–97.0% | 4 | 4 | 0 | yes |
| 1450 | draw_floor | clock_closing | 96.9% | 96.0%–97.5% | 17 | 19 | 0 | yes |
| 1550 | logistic | count_closing | 96.2% | 95.2%–96.9% | 4 | 4 | 0 | yes |
| 1550 | logistic | clock_closing | 97.4% | 96.6%–98.0% | 17 | 18 | 0 | yes |
| 1550 | thurstone | count_closing | 96.2% | 95.3%–97.0% | 4 | 4 | 0 | yes |
| 1550 | thurstone | clock_closing | 97.3% | 96.5%–97.9% | 17 | 18 | 0 | yes |
| 1550 | draw_floor | count_closing | 97.5% | 96.7%–98.1% | 4 | 4 | 0 | yes |
| 1550 | draw_floor | clock_closing | 98.8% | 98.2%–99.2% | 17 | 17 | 0 | yes |
| 1650 | logistic | count_closing | 97.0% | 96.1%–97.6% | 4 | 4 | 0 | yes |
| 1650 | logistic | clock_closing | 98.0% | 97.2%–98.5% | 17 | 19 | 0 | yes |
| 1650 | thurstone | count_closing | 97.0% | 96.2%–97.7% | 4 | 4 | 0 | yes |
| 1650 | thurstone | clock_closing | 98.5% | 97.8%–98.9% | 17 | 19 | 0 | yes |
| 1650 | draw_floor | count_closing | 96.4% | 95.4%–97.1% | 4 | 4 | 0 | yes |
| 1650 | draw_floor | clock_closing | 97.8% | 97.0%–98.3% | 17 | 18 | 0 | yes |
| 1750 | logistic | count_closing | 96.2% | 95.3%–97.0% | 4 | 5 | 0 | yes |
| 1750 | logistic | clock_closing | 97.5% | 96.7%–98.1% | 19 | 23 | 0 | yes |
| 1750 | thurstone | count_closing | 96.8% | 95.9%–97.4% | 4 | 5 | 0 | yes |
| 1750 | thurstone | clock_closing | 98.1% | 97.4%–98.6% | 19 | 23 | 0 | yes |
| 1750 | draw_floor | count_closing | 90.1% | 88.7%–91.3% | 4 | 5 | 0 | yes |
| 1750 | draw_floor | clock_closing | 93.2% | 92.0%–94.2% | 18 | 21 | 0 | yes |
| 1850 | logistic | count_closing | 97.3% | 96.4%–97.9% | 5 | 6 | 0 | yes |
| 1850 | logistic | clock_closing | 97.1% | 96.3%–97.7% | 24 | 32 | 0 | yes |
| 1850 | thurstone | count_closing | 97.9% | 97.1%–98.4% | 5 | 6 | 0 | yes |
| 1850 | thurstone | clock_closing | 98.5% | 97.8%–98.9% | 25 | 33 | 0 | yes |
| 1850 | draw_floor | count_closing | 76.9% | 75.0%–78.7% | 4 | 5 | 0 | no |
| 1850 | draw_floor | clock_closing | 79.0% | 77.2%–80.7% | 20 | 24 | 0 | no |
| 1950 | logistic | count_closing | 93.0% | 91.8%–94.0% | 6 | 7 | 0 | yes |
| 1950 | logistic | clock_closing | 96.4% | 95.5%–97.1% | 35 | 58 | 29 | no |
| 1950 | thurstone | count_closing | 96.2% | 95.2%–96.9% | 6 | 7 | 0 | yes |
| 1950 | thurstone | clock_closing | 98.6% | 98.0%–99.1% | 39 | 69 | 75 | no |
| 1950 | draw_floor | count_closing | 44.0% | 41.8%–46.1% | 5 | 6 | 0 | no |
| 1950 | draw_floor | clock_closing | 48.5% | 46.3%–50.7% | 24 | 29 | 0 | no |
| 2050 | logistic | count_closing | 85.5% | 83.8%–86.9% | 7 | 8 | 0 | no |
| 2050 | logistic | clock_closing | 87.5% | 85.0%–89.7% | 51 | 89 | 1237 | no |
| 2050 | thurstone | count_closing | 94.3% | 93.2%–95.2% | 7 | 9 | 0 | yes |
| 2050 | thurstone | clock_closing | 93.2% | 89.4%–95.7% | 51 | 91 | 1750 | no |
| 2050 | draw_floor | count_closing | 6.8% | 5.7%–7.9% | 5 | 6 | 0 | no |
| 2050 | draw_floor | clock_closing | 9.1% | 7.9%–10.4% | 27 | 37 | 0 | no |
| 2150 | logistic | count_closing | 67.5% | 65.5%–69.6% | 8 | 10 | 0 | no |
| 2150 | logistic | clock_closing | 0.0% | 0.0%–20.4% | 47 | 71 | 1985 | no |
| 2150 | thurstone | count_closing | 87.3% | 85.7%–88.6% | 9 | 11 | 0 | no |
| 2150 | thurstone | clock_closing | 0.0% | 0.0%–65.8% | 39 | 83 | 1998 | no |
| 2150 | draw_floor | count_closing | 0.0% | 0.0%–0.2% | 5 | 6 | 0 | no |
| 2150 | draw_floor | clock_closing | 0.0% | 0.0%–0.2% | 33 | 46 | 1 | no |

The simulation does not validate opponent humanity, detect cheating, or estimate FIDE/Lichess/Chess.com rating. It tests only the published BCS interval and its readiness threshold.
