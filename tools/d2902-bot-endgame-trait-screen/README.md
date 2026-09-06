# D2902 endgame bot-trait screen

Disposable research instrument for [[D2902]]. It joins the committed complete R4 tablebase move
population to a fresh bare-FEN capture from the production Maia sidecar. It does not implement a
bot policy or register a personality.

- `make bot-endgame-trait-screen-contract` runs synthetic and committed-population controls.
- `make bot-endgame-trait-screen` builds Maia, captures 1400/1600/1800, measures, and writes the
  registered result/report.

The measurement deliberately returns `insufficient_human_reference` even when the king-move
mechanism reaches its behavior gate. Maia is the transformed policy and cannot serve as its own
independent human reference.
