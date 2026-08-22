# Shared research chess arithmetic

Everything in this directory is **research-only and non-production**. It exists so disposable
instruments test the same predeclared convention rather than copying slightly different versions.

- `legal-exchange.ts` implements `legal-exchange@1` for D730 and later breadth probes.
- `populations.ts` projects the authored spines and sealed stratified imported sample for later
  cross-population probes—including full paths and authored/path triples—so their sampling code
  does not drift independently.

Production code must implement an accepted RFC independently and pass its permanent fixtures; it
must not import this directory.
