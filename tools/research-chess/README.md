# Shared research chess arithmetic

Everything in this directory is **research-only and non-production**. It exists so disposable
instruments test the same predeclared convention rather than copying slightly different versions.

- `legal-exchange.ts` implements `legal-exchange@1` for D730 and later breadth probes.

Production code must implement an accepted RFC independently and pass its permanent fixtures; it
must not import this directory.
