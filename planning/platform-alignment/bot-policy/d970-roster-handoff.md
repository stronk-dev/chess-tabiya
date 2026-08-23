# D970 owner/RFC handoff — Human-baseline band roster

## Recommended ruling

> For 1.0, expose the Human-baseline family at Maia bands **1000, 1400, 1800 and
> 2200**. These are human-policy bands, not human Elo labels. Do not expose the raw
> 100-point grid, an interpolated fifth rung, or band 2400 without a new adjacent-rung
> measurement. Do not choose a default in this ruling. In positions with ten or fewer
> pieces, disclose that band is an attenuated difficulty lever; do not silently replace
> the selected policy.

Evidence and limits: `design/research/maia-production-band-roster.md`.

## Exact RFC author action

Amend `rfc/bot-policy.md` in place before any production profile registration:

1. Replace Open question 2 with the ruling above and record its date/authority.
2. In §1/§2.1, pin four unguarded baseline profile identities
   `human-baseline-{1000,1400,1800,2200}` and four band-specific model-layer identities
   `model.maia3.band-{1000,1400,1800,2200}@1`.
3. State that guarded-human and pawn-heavy inherit this **band set**, but remain
   unregistered behind D969 and require calibration for each exact composed digest.
4. Add the six able-to-fail fixtures from the dossier.
5. Add D1014's catalog-wide identity rule: repeated `id@version` means one canonical
   declaration, or compilation fails.

This action does not choose the default profile, human-scale rating anchor, D969 search
depth, or endgame-floor behavior.

