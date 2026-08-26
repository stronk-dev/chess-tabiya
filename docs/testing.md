# Testing and CI

Tabiya separates tests by the contract they prove. A failure should identify the owning layer; a
real drill pack's mutable wording is not a product-browser contract, and a direct REST-handler test
is not proof that the production application routes an endpoint.

| Tier | Command | Owns | Must not substitute for |
|---|---|---|---|
| Fast commit checks | Lefthook `pre-commit` | Staged diff hygiene, affected package checks, and process contracts over an isolated Git-index snapshot | Full CI or a push gate |
| Software contracts | `make verify-software` | Types, framework-free reducers/selectors, server contracts, schemas and compiled runtime manifests | Real-corpus acceptance, process ledgers, browser behavior or deployed routing |
| Performance contracts | `make test-performance` | Required latency/complexity envelopes in a single-worker process, also included by `verify-software` | Functional assertions or benchmarks sharing the generic parallel test pool |
| Repository governance | `make verify-governance` | RFC/register/work/roadmap/intent consistency, a source-sealed 1.0 status receipt, documentation-index completeness, and test-tier ownership | Product behavior, content quality or release proof |
| Real-content contracts | `make verify-content` | Schema and application compatibility against committed draft/pack/candidate bytes, including the published-pack evidence-digest invariant | Authored chess judgement or software contracts already expressible with synthetic fixtures |
| Browser journeys | `make test-browser-smoke` | Stable user journeys asserted through roles, state and outcomes | Mutable authored prose or exhaustive viewport coverage |
| Real-content integration | `make test-browser-content` | Representative draft/pack integration with the application | Chess-truth validation or product behavior already expressible with a synthetic fixture |
| Responsive/accessibility matrices | `make test-browser-matrix` | Post-gesture geometry, input projections, semantic board/navigation, WCAG A/AA scanning, and real mobile input semantics | A resting screenshot |
| Complete browser gate | `make test-browser-ci` | The same three named browser tiers used by GitHub | Release-image, migration or backup proof |
| Full non-browser gate | `make verify` | Software + governance + real-content targets, matching the three required GitHub jobs | Browser or release-image proof |
| Exact local CI | `make ci-local` | Pinned Node/pnpm, Stockfish and Compose preflight, then all required non-browser and browser tiers | Ordinary development checks |

`make test-browser` remains a convenient single Playwright invocation for local debugging. GitHub
runs the named browser tiers separately so the failing step says whether the regression is a core
journey, real-content integration, or the interaction matrix. Traces, screenshots and the HTML
report are uploaded when a browser tier fails.

Playwright has explicit desktop Chromium and Pixel 7 projects. Project-level test filters keep
ordinary journeys on one desktop browser while `@mobile` matrix cases inherit the device's mobile
user agent, touch points and coarse pointer. The accessibility matrix runs axe-core against the
authenticated catalogue, Settings and an active rehearsal; it gates WCAG A/AA violations and
complements interaction assertions for focus ownership, announcements and responsive state.

Pre-commit process checks intentionally do not read the shared working tree. The hook materializes
the Git index and runs register, status, work, roadmap and intent checks inside that temporary
snapshot. This makes the commit's staged bytes the unit under review and prevents an unrelated
unstaged schema, migration or planning edit from another worker from blocking it. Direct
`make register-check`, `make status-parity`, and related commands continue to inspect the working
tree during development.

Content is shipped product data and therefore still receives schema, provenance, compatibility and
integration validation. Its exact prose is not pinned unless the wording itself is a declared public
contract. Browser tests assert semantic labels and effects such as an `Alternative move` item being
present; content instruments identify which pack and content rule failed.

Application and runtime unit tests assert exported values, mounted DOM, reducer output and events;
they do not parse `.svelte` source text or pin private variable names, class expressions, or literal
CSS declarations. Layout, hit-target and region-reach contracts run against rendered boxes and
interactive state in the browser matrix. A research or governance census may inspect source only
when source topology is itself the named subject, and it must not stand in for a product-behavior
test.

The evidence-manifest consumer census follows the same rule. Runtime, server, and web register the
twenty-three real consumer callables; the manifest check requires their IDs and exported function
names to agree exactly with the compiled catalogue. It does not open implementation files or grep
for anchor text. Provider-input safety is covered separately by behavior tests over sealed rendered
views, including a forged-sentence negative, so the topology census is not mistaken for data-flow
proof.

`make graduation-plan-check` is deliberately not a required CI dependency. It freezes the current
draft/candidate population and classification plan for an authoring migration; changing that
population is planning evidence, not a software regression. Run it while working on graduation or
content-wave planning. `make test-tier-check` prevents a test that reads real corpus bytes from
silently entering the software-contract suite.

`make docs-check` is a deliberately narrow navigation contract. It requires every Markdown file
directly under `docs/` to appear exactly once in `docs/README.md` and requires the root README to
link the architecture, feature map, extension guide, contributor guide and complete docs index. It
does not claim that prose is current merely because the file is reachable; behavioral tests and
the tier reconciliation process remain the truth checks for content.

`make graduation-report` is the author-facing freshness census. It may report stale working
candidates without failing CI; it fails only when stale or unreadable evidence would otherwise be
called graduable. The real-content suite also examines every published pack directly, so moving a
stale pair into `content/packs/` cannot bypass the report by changing roots.

Release proof remains a separate roadmap obligation: application-boundary API reachability,
container boot, prior-schema migration, provider degradation, backup/restore, update/rollback and
artifact/SBOM/signature checks cannot be inferred from the tiers above.
