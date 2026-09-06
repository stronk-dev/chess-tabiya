# D2903 paired human endgame reference

Disposable research instrument for [[D2903]]. It first extracts the preregistered, at-most-one-
decision-per-game 3–7-piece population from the already committed CC0 Lichess fixture. Provider
work is forbidden unless that population clears the frozen capacity floor.

`make bot-human-endgame-reference-contract` runs extraction, deterministic-selection, scoring and
insufficiency controls without network, Docker or Stockfish.

The small fixture fails that floor at 5 games. `make bot-human-endgame-reference-population`
therefore reuses the exact 256-MiB June source range already frozen by D1329, verifies both existing
digests and streams a 64-game-per-band pseudonymous selection. It stores no username or raw game in
the tracked receipt. The checked receipt clears the pre-provider floor at 128 distinct games,
64 per band, with 52 observed king moves and 76 non-king moves.

`make bot-human-endgame-reference` is the only provider-bearing entry point. It creates exact legal
sets from the checked population, captures complete Syzygy legal-successor maps and matching-band
production Maia pages, then measures class and exact-move score direction under the frozen exact
five-state result guard. Raw provider captures live only in a temporary directory; failure retains
that directory for diagnosis, while success commits only digests and aggregate results.

This instrument cannot change D2902's failed reach verdict or register a bot personality.
