# Maia production band roster — what the measured ladder licenses

**Question.** D970 asks which literal Maia bands the Human-baseline profile family may
expose. This is not a new engine experiment. It is a decision-focused synthesis of the
committed D333 outcome run: 16,660 complete games, 1,049,001 Maia forward passes, twelve
arms, paired colour swaps and opening-clustered intervals `[V]`
(`maia-band-outcome-transfer.md` §§1–5;
`../../tools/d333-band-outcome-harness/out/summary.json`).

## Verdict

**The evidence licenses exactly four production rungs for 1.0: bands
`[1000, 1400, 1800, 2200]`.** These are the four pre-registered arms, not values inferred
after the results were read. Against the common band-1400 reference their scores are
0.3069 / 0.4990 / 0.6304 / 0.7652; every adjacent 95% interval is disjoint `[V]`
(`summary.json` → `d324PreRegistered`). The corresponding relative outcomes are −141.6 /
−0.7 / +92.7 / +205.2 Elo versus that internal reference `[V]`. They are ordered and
distinguishable; they are **not** four equally spaced human Elo levels.

The four-rung set is the narrowest honest 1.0 answer:

- A raw 100-band grid is refused. The two measured 100-point steps buy only 22.1 and
  26.9 outcome-Elo, below the dossier's approximately 60-Elo session-resolution floor
  `[V]` (`maia-band-outcome-transfer.md` §6.2).
- Adding band 2400 is refused. The measured 2000→2400 region buys 28.9 Elo with a 95%
  interval crossing parity (−16.7 to 74.5; p=.21) `[V]` (§6.3). The model still accepts
  2400; that is not evidence that 2400 adds a learner-visible rung.
- Filling a denser five-to-nine-rung ladder by interpolation is refused for 1.0. “Five to
  nine” is a capacity estimate obtained by dividing a resolution threshold by a measured
  slope; it is not a set of directly compared adjacent arms `[V]` (§6.2). A later denser
  ladder needs its own pre-registered adjacent-rung run.

## What the roster means in product terms

The band is a **model input**, not a rating. Across the authored corpus its measured
transfer is 28.90 outcome-Elo per 100 band points; at ≥21 pieces it is 39.98 per 100
`[V]` (§5). The UI and `/capabilities` may therefore publish the literal phrase
“Human-policy band 1000/1400/1800/2200” and the cited relative calibration state. They may
not relabel these values “1000/1400/1800/2200 Elo,” beginner/intermediate/advanced/expert,
or equally spaced difficulty levels. Absolute human-scale labels remain behind
`bot-policy.md` discharge D4.

No default is selected by this research. A default is an experience/preset decision, not
an outcome-measurement result. The request contract already makes a profile an optional
refinement of `human_common`; choosing the four identities does not require silently
turning one on for every run `[V]` (`../../rfc/bot-policy.md` §4.1).

## Material is a capability condition, not fine print

The same band gap changes strength much less after simplification. At ≤10 pieces,
1000→2400 is worth 72.4 outcome-Elo compared with 468.9 at ≥21 pieces; both measured
100-point low-material arms have intervals crossing parity `[V]`
(`maia-band-outcome-transfer.md` §7). Therefore:

1. The four bands remain valid model configurations in low material, but the product must
   not promise four distinguishable difficulty levels there.
2. Every profile/capability card inherits the existing band-attenuation disclosure.
3. The application must not invent an automatic hidden engine floor. `perfect_tablebase`
   and the future measured `guard.endgame_floor` remain separate, declared policy choices
   `[V]` (`../../rfc/bot-policy.md` §§2.7, 8).

## Literal catalog consequence

After the owner/RFC amendment, the unguarded family may register these four identities:

| profile id | model-layer id | band | calibration at registration |
|---|---|---:|---|
| `human-baseline-1000` | `model.maia3.band-1000@1` | 1000 | uncalibrated composed profile |
| `human-baseline-1400` | `model.maia3.band-1400@1` | 1400 | uncalibrated composed profile |
| `human-baseline-1800` | `model.maia3.band-1800@1` | 1800 | uncalibrated composed profile |
| `human-baseline-2200` | `model.maia3.band-2200@1` | 2200 | uncalibrated composed profile |

Band-specific model-layer IDs are intentional. The catalog compiler currently verifies
typed band equals `parameters.band` inside one declaration, but it does not require a
repeated layer `id@version` to be byte-identical across profiles `[V]`
(`../../apps/server/src/bot-policy-catalog.ts`, `compileBotPolicyCatalog`). Reusing
`model.maia3@1` with four bands would make one versioned identity mean four things. D1014
records the general fix: use exact band identities now and add a catalog-wide conflicting-
declaration rejection before registration.

The guarded-human and pawn-heavy families should inherit the same four band values only
after D969 selects and remeasures the production Stockfish guard. They cannot inherit the
Human-baseline calibration: the accepted RFC correctly requires calibration per exact
profile digest `[V]` (`../../rfc/bot-policy.md` §7). Thus D970 can unblock four unguarded
baseline declarations; it does not bypass D969 for the other eight eventual
family-by-band declarations.

## Able-to-fail amendment fixtures

The bot-policy amendment is buildable when it names these checks:

1. Catalog bands are exactly `[1000, 1400, 1800, 2200]`; adding 2400 or an unmeasured
   interpolated band fails.
2. Each production profile's literal band equals its model layer's `band` and
   `parameters.band`.
3. Reusing one layer `id@version` with different canonical declarations across profiles
   fails (D1014).
4. The four capability entries carry band-relative wording and no absolute human Elo or
   ordinal skill claim while uncalibrated.
5. A ≤10-piece disclosure fixture states band attenuation; it does not silently swap the
   requested policy.
6. Guarded/pawn-heavy registration remains impossible while D969 is open.

## Boundary

This dossier does not grade a move, infer human skill, name a default, or claim that Maia
is human-like. It performs arithmetic and selection over a pre-registered engine-vs-engine
measurement. That is evidence the owner can rule on; it is not the ruling itself.

