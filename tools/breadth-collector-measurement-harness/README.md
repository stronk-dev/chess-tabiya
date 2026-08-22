# Breadth collector measurement harness

Permanent acceptance instrument for `rfc/breadth-collectors.md` B5–B7. It runs the production
collectors over authored pack-spine decisions and the sealed imported population separately, with
every legal alternative retained. Recorded two-/three-edge sequences are counted separately and
never treated as causal or forced.

Run with `make breadth-collector-measurement`. The deterministic report is written to `output.md`.
Zeroes and population-direction disagreements are results; this harness must not weaken a detector
or manufacture an event to make a quoted prior reproduce.
