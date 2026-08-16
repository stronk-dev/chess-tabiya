# Expression census

`make expression-census` is the read-only authoring instrument for structural expressions and authored evidence coverage. It walks every authored pack root and legal spine position using the same walker and evaluator as pack validation, enumerates shape triggers, plan signatures, and the four pack-hosted expression sites, and emits canonical `tabiya.authoring.census.v1` JSON.

The report keeps two questions separate:

- **Coverage:** where the expression fires in the current corpus. Zero is a fact, never an error.
- **Satisfiability:** `unsatisfiable` only when one of the closed, sound R1–R8 refutation rules proves it; `satisfiable` when a corpus or played witness exhibits it; otherwise `unknown`.

Its `evidence` section is a separate per-pack census: each authored evidence label is mapped to its assistance rung, matching sidecar records are counted by the exact feedback-claim pointer they support, and explorer records expose their machine-readable rating/speed/window population. A corpus claim with no matching record therefore remains visible with zero backing and no invented population.

Witnesses live in `content/witnesses/expression-witnesses.json`, which is also the command's default. Each starts from a legal FEN and reaches the tested position through SAN. Illegal or ambiguous SAN is refused as `WITNESS_LINE_ILLEGAL`; witnesses never enter corpus coverage and never suppress a pack-local inertness refusal.

The fixed degeneracy suite reports expressions that fire on sparse legal boards. That is a warning, not a chess verdict. Evaluator exceptions are isolated as `EVALUATION_FAULT`, excluded from coverage counts, and never reclassified as unsatisfiable.

## Commands

```sh
make expression-census
make expression-census FILE=content/shapes/carlsbad.json OUT=/tmp/census.json
make expression-census EXPR=/tmp/expression.json WITNESSES=/tmp/witnesses.json
make shape-check 'FILE=content/shapes/*.json' CORPUS=content/drafts,content/packs
make shape-check FILE=content/shapes/carlsbad.json PROBE='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
```

The census never writes content and is deliberately absent from `make verify`. `validateShapeEntry` does refuse a proven-unsatisfiable trigger or plan signature as `STRUCTURAL_EXPRESSION_UNSATISFIABLE`; this does not remove `probeMatches` from lint responses. A `shape-check PROBE=` invocation prints `PROBE FIRES` or `PROBE DOES NOT FIRE` for every checked trigger. `pack-check` gains no new severity.
