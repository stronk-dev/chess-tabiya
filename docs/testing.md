# Testing and CI

Tabiya separates tests by the contract they prove. A failure should identify the owning layer; a
real drill pack's mutable wording is not a product-browser contract, and a direct REST-handler test
is not proof that the production application routes an endpoint.

| Tier | Command | Owns | Must not substitute for |
|---|---|---|---|
| Fast commit checks | Lefthook `pre-commit` | Staged diff hygiene and affected package/process checks | Full CI or a push gate |
| Unit and contract | `make verify` | Types, framework-free reducers/selectors, server contracts, schemas, registers and process invariants | Browser behavior or deployed routing |
| Browser journeys | `make test-browser-smoke` | Stable user journeys asserted through roles, state and outcomes | Mutable authored prose or exhaustive viewport coverage |
| Real-content integration | `make test-browser-content` | Representative draft/pack integration with the application | Chess-truth validation or product behavior already expressible with a synthetic fixture |
| Responsive/accessibility matrices | `make test-browser-matrix` | Post-gesture geometry, input projections, semantic board and navigation | A resting screenshot |
| Complete browser gate | `make test-browser-ci` | The same three named browser tiers used by GitHub | Release-image, migration or backup proof |
| Exact local CI | `make ci-local` | Pinned Node/pnpm, Stockfish and Compose preflight, then `make verify` and `make test-browser-ci` | Ordinary development checks |

`make test-browser` remains a convenient single Playwright invocation for local debugging. GitHub
runs the named browser tiers separately so the failing step says whether the regression is a core
journey, real-content integration, or the interaction matrix. Traces, screenshots and the HTML
report are uploaded when a browser tier fails.

Content is shipped product data and therefore still receives schema, provenance, compatibility and
integration validation. Its exact prose is not pinned unless the wording itself is a declared public
contract. Browser tests assert semantic labels and effects such as an `Alternative move` item being
present; content instruments identify which pack and content rule failed.

Release proof remains a separate roadmap obligation: application-boundary API reachability,
container boot, prior-schema migration, provider degradation, backup/restore, update/rollback and
artifact/SBOM/signature checks cannot be inferred from the tiers above.
