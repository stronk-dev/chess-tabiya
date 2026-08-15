# Fixture realism implementation log

## 2026-08-15 — implementation opened

The final owner ruling replaces the unsatisfiable requirement that valid instrument output cross a safety bound. The implementation uses one float32 ulp of tolerance, a captured Maia vector near the valid-side boundary, and a minimal mutation of that vector to exercise the refusal side.
