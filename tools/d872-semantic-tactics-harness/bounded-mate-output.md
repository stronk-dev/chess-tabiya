# D872 bounded mating-net output

Deterministic hash sample: 240 rows per source tag; node cap 250,000 per proof. The exported first solution move is fixed, future attacker moves are existential, and every defender reply is enumerated.

| arm | proved | refuted | abstained at cap | root gives check | root replies median / p90 | proof nodes median / p90 / max |
|---|---:|---:|---:|---:|---:|---:|
| mateIn2 positives | 240/240 | 0 | 0 | 240/240 | 1 / 2 | 3 / 8 / 18 |
| mateIn3 as depth-2 controls | 0/240 | 240 | 0 | 228/240 | 1 / 3 | 36 / 46 / 204 |
| mateIn3 positives | 240/240 | 0 | 0 | 228/240 | 1 / 3 | 32 / 118 / 3032 |
| mateIn4 as depth-3 controls | 0/240 | 240 | 0 | 229/240 | 2 / 3 | 906 / 1783 / 3317 |
| mateIn4 positives | 120/120 | 0 | 0 | 114/120 | 2 / 3 | 635 / 4716 / 87255 |
| mateIn5 as depth-4 controls | 0/120 | 120 | 0 | 110/120 | 2 / 3 | 15284 / 39084 / 88912 |
| mateIn5 positives (boundary probe) | 19/24 | 2 | 3 | 22/24 | 2 / 3 | 19191 / 178345 / 250001 |

## Boundary witnesses

- mateIn3 as depth-2 controls: 0WzHD:refuted:28, 2Nfu9:refuted:30, 25QOs:refuted:32, 0oAYT:refuted:80, 12xz6:refuted:32, 1786u:refuted:29, 1ePo3:refuted:41, 02x4y:refuted:47, 0AeoC:refuted:31, 1l4h6:refuted:21, 0GYwD:refuted:32, 0Bnks:refuted:39, 0nLr9:refuted:46, 13K68:refuted:45, 2NMo4:refuted:45, 1do69:refuted:44.
- mateIn4 as depth-3 controls: 06S7w:refuted:2081, 2XceT:refuted:795, 08R7D:refuted:1537, 2B9Hp:refuted:808, 0pvLy:refuted:1522, 1qACD:refuted:249, 1Jcwk:refuted:1070, 1934e:refuted:1208, 0TfA3:refuted:1339, 1Ms3E:refuted:297, 0hRnW:refuted:785, 0W3KP:refuted:2606, 2LtQL:refuted:899, 04tpm:refuted:1184, 1UEVQ:refuted:859, 1oX1u:refuted:1813.
- mateIn5 as depth-4 controls: 1fetJ:refuted:21410, 22npO:refuted:35266, 0bh9U:refuted:3064, 10bVz:refuted:8662, 0zuzr:refuted:12385, 2GMx7:refuted:26963, 0fvBz:refuted:235, 0q9MG:refuted:38799, 1ENAY:refuted:7554, 0UNli:refuted:1673, 07R2h:refuted:44680, 2Fe4k:refuted:29463, 0PhbW:refuted:9467, 1kWAB:refuted:5811, 1zVvF:refuted:13996, 1mNtd:refuted:137.
- mateIn5 positives (boundary probe): 22npO:abstained:250001, 0fvBz:refuted:624, 1kWAB:refuted:74952, 24WWr:abstained:250001, 0C0Cp:abstained:250001.

Interpretation: a proved row grounds only `forced_mate_within@N` for the declared candidate and complete bounded tree. A refuted row has a legal defender branch or no attacker continuation inside the horizon. A capped row abstains. `mating net` is presentation vocabulary over this proof, never over king-zone or escape-count deltas.
