# Prefer the repository's pinned local toolchain when Homebrew supplies it. CI and
# other platforms continue to use PATH/SF_CMD, so callers never need shell prefixes.
ifneq ($(wildcard /opt/homebrew/opt/node@24/bin/node),)
export PATH := /opt/homebrew/opt/node@24/bin:$(PATH)
endif

CI_NODE := $(if $(wildcard /opt/homebrew/opt/node@24/bin/node),/opt/homebrew/opt/node@24/bin/node,node)

SF_CMD ?= $(if $(wildcard /opt/homebrew/bin/stockfish),/opt/homebrew/bin/stockfish,$(shell command -v stockfish 2>/dev/null))
export SF_CMD

.PHONY: foundation-source-author-audit foundation-source-author-repair tablebase-census-contract tablebase-census-check phase-classifier-census phase-band-census phase-source-composition-census phase-source-composition-author-contract phase-source-composition-fresh-review phase-source-composition-author-repair endgame-technique-applicability-census endgame-method-path-contract endgame-setup-reachability-contract endgame-setup-convention-validation bot-trait-screen-contract bot-trait-screen bot-endgame-trait-screen-contract bot-endgame-trait-screen bot-human-endgame-reference-contract bot-human-endgame-reference-population bot-human-endgame-reference bot-human-endgame-reference-report

.PHONY: setup check typecheck test test-software test-performance test-content test-tier-check docs-check staged-process-contracts staged-process-contracts-test test-browser test-browser-smoke test-browser-content test-browser-matrix test-browser-production test-browser-ci ci-local schema-check register-check shared-resource-catalogue status-parity work-index work-state work-state-sync work-item-sync work-item-check roadmap-receipt roadmap-check roadmap-progress intent-parity evidence-manifest-check semantic-evidence-check foundation-closure foundation-source-author-contract semantic-validation-closure semantic-validation-matrix semantic-validation-author-contract module-evidence-assembly module-registration-author-contract module-registration-author-contract-update module-registration-fresh-review module-registration-second-fresh-review intent-presets-author-contract intent-presets-second-author-repair intent-presets-fresh-review intent-presets-second-fresh-review presentation-binding-census evidence-presentation-author-contract evidence-presentation-second-author-repair evidence-presentation-fresh-review evidence-presentation-third-fresh-review evidence-presentation-third-author-repair evidence-presentation-fourth-fresh-review evidence-presentation-fourth-author-repair evidence-presentation-fifth-fresh-review semantic-collectors-promotion-fresh-review semantic-collectors-promotion-author-repair semantic-collectors-promotion-second-fresh-review semantic-collectors-promotion-second-author-repair semantic-collectors-promotion-tenth-fresh-review evidence-seal-audit evidence-value-authority evidence-value-authority-author-contract evidence-value-authority-route-map evidence-value-authority-route-map-update opening-catalogue opening-catalogue-check account-data-lifecycle-check learner-rating-bracket learner-rating-bracket-check learner-rating-isolation-check longitudinal-store-author-contract longitudinal-store-fresh-review longitudinal-store-cost campaign-two-horizon-author-contract campaign-two-horizon-fresh-review campaign-two-horizon-third-fresh-review theory-drill-author-contract graduation-plan graduation-plan-update graduation-plan-check graduation-clearance-contract graduation-clearance-corpus-check tactical-collector-measurement breadth-collector-measurement human-divergence-measurement option-collapse-measurement dtz-census-measurement practical-resistance-measurement promotion-race-contract assistance-register-contract assistance-register-repeat-review assistance-register-final-review assistance-register-second-fresh-review assistance-register-second-author-repair assistance-register-third-fresh-review assistance-register-third-author-repair assistance-register-fifth-fresh-review assistance-register-fourth-author-repair semantic-register-contract semantic-register-repeat-review provider-exchange-contract provider-exchange-repeat-review provider-exchange-final-review provider-exchange-fourth-review provider-exchange-fresh-review provider-exchange-author-repair provider-exchange-second-fresh-review candidate-packet-contract candidate-packet-repeat-review candidate-packet-final-review candidate-packet-fresh-review candidate-packet-second-author-repair review-evidence-author-contract bot-policy-independent-review bot-policy-author-contract bot-policy-fresh-review pack-capability-author-contract pack-capability-author-repair pack-capability-author-repair-update pack-capability-closure pack-capability-repeat-review pack-capability-fresh-review pack-capability-second-fresh-review pack-capability-third-fresh-review pack-capability-fourth-fresh-review bounded-target-contract bounded-target-census bounded-target-repeat-review bounded-target-final-review bounded-target-fresh-review bounded-target-second-author-repair bounded-target-third-author-repair review-evidence-fourth-fresh-review build verify-software verify-governance verify-rfc-evidence verify-content verify verify-awake pack-check shape-check expression-census graduation-report graduation-report-update graduation-clear pack-preview source-fetch candidate-emit candidate-attach sourcing-check verify-draft tablebase-walk tablebase-census engine-walk up up-engines down

.PHONY: semantic-search-event-policy-relevance
.PHONY: semantic-search-horizon4-frontier
.PHONY: semantic-search-stockfish-horizon4-capture
.PHONY: semantic-search-stockfish-horizon4-check
.PHONY: semantic-search-stockfish-horizon4-smoke-check
.PHONY: semantic-search-stockfish-horizon4-batch
.PHONY: semantic-search-stockfish-horizon4-merge
.PHONY: semantic-search-maia-history-replay-capture
.PHONY: semantic-search-maia-history-replay-check
.PHONY: semantic-search-maia-history-impact-update semantic-search-maia-history-impact-check
.PHONY: semantic-search-maia-history-frame-delta-update semantic-search-maia-history-frame-delta-check
.PHONY: semantic-search-stockfish-history-supplement-frame-update semantic-search-stockfish-history-supplement-frame-check
.PHONY: semantic-search-stockfish-history-supplement-capture semantic-search-stockfish-history-supplement-check
.PHONY: semantic-search-stockfish-root-coherent-capture semantic-search-stockfish-child-coherent-capture semantic-search-stockfish-coherent-check
.PHONY: semantic-search-stockfish-root-coherent-all-capture semantic-search-stockfish-child-coherent-all-capture
.PHONY: semantic-search-stockfish-coherent-impact-update semantic-search-stockfish-coherent-impact-check
.PHONY: semantic-search-coherent-root-frame-update semantic-search-coherent-root-frame-check
.PHONY: semantic-search-coherent-exact-replies-update semantic-search-coherent-exact-replies-check
.PHONY: semantic-search-coherent-target-frame-update semantic-search-coherent-target-frame-check
.PHONY: semantic-search-coherent-first-reply-update semantic-search-coherent-first-reply-check
.PHONY: semantic-search-coherent-deeper-supplement-update semantic-search-coherent-deeper-supplement-check
.PHONY: semantic-search-stockfish-coherent-deeper-capture semantic-search-maia-coherent-deeper-capture
.PHONY: semantic-search-stockfish-coherent-deeper-check semantic-search-maia-coherent-deeper-check
.PHONY: semantic-search-coherent-deeper-union-update semantic-search-coherent-deeper-union-check
.PHONY: semantic-search-coherent-relation-event-update semantic-search-coherent-relation-event-check
.PHONY: semantic-search-coherent-semantic-reserve-update semantic-search-coherent-semantic-reserve-check
.PHONY: semantic-search-coherent-immediate-witness-update semantic-search-coherent-immediate-witness-check
.PHONY: semantic-search-coherent-local-contrast-update semantic-search-coherent-local-contrast-check
.PHONY: semantic-search-coherent-event-reach-update semantic-search-coherent-event-reach-check
.PHONY: semantic-search-coherent-event-policy-update semantic-search-coherent-event-policy-check
.PHONY: semantic-search-coherent-bounded-targets-update semantic-search-coherent-bounded-targets-check
.PHONY: semantic-search-coherent-bounded-contrast-update semantic-search-coherent-bounded-contrast-check
.PHONY: semantic-search-coherent-semantic-provider-gap-update semantic-search-coherent-semantic-provider-gap-check
.PHONY: semantic-search-coherent-semantic-supplement-update semantic-search-coherent-semantic-supplement-check
.PHONY: semantic-search-stockfish-coherent-semantic-capture semantic-search-maia-coherent-semantic-capture
.PHONY: semantic-search-coherent-semantic-source-check
.PHONY: semantic-search-coherent-semantic-source-union-update semantic-search-coherent-semantic-source-union-check
.PHONY: semantic-search-coherent-exact-trigger-update semantic-search-coherent-exact-trigger-check
.PHONY: semantic-search-coherent-frontier-target-update semantic-search-coherent-frontier-target-check
.PHONY: semantic-search-coherent-frontier-contrast-update semantic-search-coherent-frontier-contrast-check
.PHONY: semantic-search-stockfish-new-child-capture semantic-search-stockfish-new-child-all-capture semantic-search-stockfish-new-child-check
.PHONY: semantic-search-maia-new-child-capture semantic-search-maia-new-child-check
.PHONY: semantic-search-maia-horizon4-path-frame-update semantic-search-maia-horizon4-path-frame-check
.PHONY: semantic-search-maia-horizon4-path-capture semantic-search-maia-horizon4-path-check

setup:
	pnpm install --frozen-lockfile

check: verify

typecheck:
	pnpm typecheck

test:
	pnpm test

test-software:
	pnpm test:software

test-performance:
	pnpm test:performance

test-content:
	pnpm test:content

test-tier-check:
	node --test tools/test-tier-check.test.mjs
	node tools/test-tier-check.mjs

docs-check:
	node --test tools/docs-index.test.mjs
	node tools/docs-index.mjs

staged-process-contracts-test:
	node --test tools/staged-process-contracts.test.mjs

staged-process-contracts:
	node tools/staged-process-contracts.mjs

test-browser:
	pnpm test:browser

test-browser-smoke:
	./node_modules/.bin/playwright test --grep-invert "@content|@matrix"

test-browser-content:
	./node_modules/.bin/playwright test --grep "@content"

test-browser-matrix:
	./node_modules/.bin/playwright test --grep "@matrix"

test-browser-production:
	./node_modules/.bin/playwright test --config playwright.production.config.ts

test-browser-ci: test-browser-smoke test-browser-content test-browser-matrix test-browser-production

ci-local:
	$(CI_NODE) tools/ci-local.mjs

schema-check:
	pnpm schema:check

register-check:
	node --test tools/register-check.test.mjs
	node tools/register-check.mjs

# shared-resource-register-bootstrap §7: the fourteen catalogue controls. The staged-discharge join
# (criterion 7) is enforced generically by `work-state`.
shared-resource-catalogue:
	node --test --test-name-pattern='§7' tools/register-check.test.mjs

status-parity:
	node --test tools/status-parity.test.mjs
	node tools/status-parity.mjs

work-index:
	node --test tools/work-index.test.mjs
	node tools/work-index.mjs

work-state:
	node --test tools/work-state.test.mjs
	node tools/work-state.mjs

work-state-sync:
	node tools/work-state.mjs --sync
	$(MAKE) work-state

.PHONY: work-state-transition work-item-complete
work-state-transition:
	@test -n "$(IDS)" -a -n "$(STATE)" || (echo "Usage: make work-state-transition IDS=D1,D2 STATE=done [OWNER=lane] [EVIDENCE=path] [EVIDENCE_KIND=path]" >&2; exit 2)
	$(CI_NODE) tools/work-state.mjs --set="$(IDS)" --state="$(STATE)" $(if $(OWNER),--owner="$(OWNER)",) $(if $(SINCE),--since="$(SINCE)",) $(if $(BLOCKER),--blocker="$(BLOCKER)",) $(if $(QUESTION),--question="$(QUESTION)",) $(if $(EVIDENCE),--evidence="$(EVIDENCE)",) $(if $(EVIDENCE_KIND),--evidence-kind="$(EVIDENCE_KIND)",) $(if $(RULING),--ruling="$(RULING)",) $(if $(RULING_KIND),--ruling-kind="$(RULING_KIND)",)

work-item-sync:
	node tools/work-item-registry.mjs --sync

work-item-complete:
	@test -n "$(IDS)" -a -n "$(COMPLETED_ON)" -a -n "$(EVIDENCE)" || (echo "Usage: make work-item-complete IDS=ATR-a1,ATR-a2 COMPLETED_ON=YYYY-MM-DD EVIDENCE=commit-or-path" >&2; exit 2)
	$(CI_NODE) tools/work-item-registry.mjs --complete="$(IDS)" --completed-on="$(COMPLETED_ON)" --evidence="$(EVIDENCE)"

work-item-check:
	node --test tools/work-item-registry.test.mjs
	node tools/work-item-registry.mjs

roadmap-check:
	node --test tools/roadmap-check.test.mjs
	node tools/roadmap-check.mjs
	node --test tools/roadmap-receipt.test.mjs
	node --test tools/roadmap-progress.test.mjs
	node tools/roadmap-receipt.mjs

roadmap-progress: roadmap-check
	node tools/roadmap-progress.mjs

roadmap-receipt:
	node tools/roadmap-receipt.mjs --write

intent-parity:
	node --test tools/intent-parity-harness/audit.test.mjs

graduation-plan:
	node tools/graduation-clearance-plan.mjs

graduation-plan-update:
	node tools/graduation-clearance-plan.mjs --write

graduation-plan-check:
	node --test tools/graduation-clearance-plan.test.mjs
	node tools/graduation-clearance-plan.mjs --check

.PHONY: graduation-clearance-migrate
graduation-clearance-migrate:
	node tools/graduation-clearance-migrate.mjs

.PHONY: graduation-clearance-author-repair
graduation-clearance-author-repair:
	./node_modules/.bin/vitest run --config tools/d3088-graduation-clearance-author-repair/vitest.config.ts --reporter=verbose

graduation-clearance-contract:
	./node_modules/.bin/vitest run apps/server/src/sourcing/graduation-clear.test.ts apps/server/src/graduation-report.test.ts apps/server/src/graduation-clearance-corpus.test.ts

graduation-clearance-corpus-check:
	pnpm --filter @chess-tabiya/server exec esbuild src/graduation-clearance-corpus.ts --bundle --platform=node --format=esm --external:typescript --outfile=dist/graduation-clearance-corpus.js
	node apps/server/dist/graduation-clearance-corpus.js

.PHONY: graduation-clearance-acceptance
graduation-clearance-acceptance: schema-check graduation-plan-check graduation-clearance-contract graduation-clearance-corpus-check

evidence-manifest-check:
	./node_modules/.bin/esbuild apps/server/src/evidence-manifest-check.ts --bundle --platform=node --format=esm --external:typescript --outfile=apps/server/dist/evidence-manifest-check.js
	node apps/server/dist/evidence-manifest-check.js

semantic-evidence-check:
	./node_modules/.bin/esbuild apps/server/src/semantic-evidence-check.ts --bundle --platform=node --format=esm --outfile=apps/server/dist/semantic-evidence-check.js
	node apps/server/dist/semantic-evidence-check.js

.PHONY: candidate-packet-projections candidate-packet-projections-check candidate-closure-census
# rfc/shared-candidate-evidence-packet.md §5.3/§12: the generated literal closure and its drift check.
candidate-packet-projections:
	node tools/generate-candidate-packet-projections.mjs

candidate-packet-projections-check:
	node tools/generate-candidate-packet-projections.mjs --check

# Prevalence/cost census over a fixed sample (POSITIONS=<file of FENs> to override); never the schema.
candidate-closure-census:
	node tools/candidate-closure-census.mjs $(POSITIONS)

# rfc/recorded-semantic-path §8: fixtures, exact/eager parity, imported-sample census and the
# pinned 20/40/80-ply timing arms (RECORDED_PATH_TIMING=report downgrades the budget to a warning
# on unpinned hosts; the pinned performance tier enforces it).
.PHONY: recorded-semantic-path-check
recorded-semantic-path-check:
	./node_modules/.bin/vitest run --config vitest.software.config.ts packages/runtime/src/recorded-semantic-path.test.ts apps/server/src/recorded-semantic-path.test.ts
	./node_modules/.bin/esbuild apps/server/src/recorded-semantic-path-check.ts --bundle --platform=node --format=esm --outfile=apps/server/dist/recorded-semantic-path-check.js
	node apps/server/dist/recorded-semantic-path-check.js

.PHONY: semantic-search-input-readiness semantic-search-manifest semantic-search-stockfish-capture semantic-search-stockfish-check semantic-search-stockfish-child-capture semantic-search-stockfish-child-check semantic-search-stockfish-child-beam semantic-search-maia-capture semantic-search-maia-check semantic-search-maia-child-capture semantic-search-maia-child-check semantic-search-maia-child-prefix semantic-search-maia-configured-window semantic-search-maia-direct-check semantic-search-maia-direct-frontier semantic-search-root-frame semantic-search-exact-replies semantic-search-fork-controls semantic-search-bishop-pressure semantic-search-target-register semantic-search-target-comparison-frame semantic-search-material-immediate semantic-search-destination-immediate semantic-search-destination-reply-witness semantic-search-semantic-touch semantic-search-semantic-reserve semantic-search-relation-event semantic-search-relation-event-reserve semantic-search-local-contrast semantic-search-local-rank-concordance semantic-search-provider-line-arm semantic-search-exact-arm-forcing
semantic-search-input-readiness:
	$(CI_NODE) tools/d3262-search-calibration/input-readiness.mjs

semantic-search-manifest:
	$(CI_NODE) tools/d3262-search-calibration/manifest.mjs $(if $(ROWS),--rows,)

semantic-search-stockfish-capture:
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture.mjs $(if $(LIMIT),--limit $(LIMIT),) $(if $(OUT),--out "$(abspath $(OUT))",)

semantic-search-stockfish-child-capture:
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture.mjs --child $(if $(LIMIT),--limit $(LIMIT),) $(if $(OUT),--out "$(abspath $(OUT))",)

semantic-search-stockfish-root-coherent-capture:
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture.mjs --coherent-root $(if $(LIMIT),--limit $(LIMIT),) $(if $(OUT),--out "$(abspath $(OUT))",)

semantic-search-stockfish-child-coherent-capture: semantic-search-exact-replies
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture.mjs --coherent-child $(if $(LIMIT),--limit $(LIMIT),) $(if $(OUT),--out "$(abspath $(OUT))",)

semantic-search-stockfish-root-coherent-all-capture:
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture.mjs --coherent-root-all $(if $(LIMIT),--limit $(LIMIT),) $(if $(OUT),--out "$(abspath $(OUT))",)

semantic-search-stockfish-child-coherent-all-capture: semantic-search-exact-replies
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture.mjs --coherent-child-all $(if $(LIMIT),--limit $(LIMIT),) $(if $(OUT),--out "$(abspath $(OUT))",)

semantic-search-stockfish-coherent-check: semantic-search-stockfish-child-check
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-coherent-recapture-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/stockfish-coherent-recapture-check.mjs

semantic-search-stockfish-coherent-impact-update: semantic-search-stockfish-coherent-check
	$(CI_NODE) tools/d3262-search-calibration/stockfish-coherent-impact.mjs --write

semantic-search-stockfish-coherent-impact-check: semantic-search-stockfish-coherent-check
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-coherent-impact.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/stockfish-coherent-impact.mjs

semantic-search-coherent-root-frame-update: semantic-search-stockfish-coherent-impact-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-root-frame.mjs --write

semantic-search-coherent-root-frame-check: semantic-search-stockfish-coherent-impact-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-root-frame.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-root-frame.mjs

semantic-search-coherent-exact-replies-update: semantic-search-coherent-root-frame-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-exact-replies.mjs --write

semantic-search-coherent-exact-replies-check: semantic-search-coherent-root-frame-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-exact-replies.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-exact-replies.mjs

semantic-search-coherent-target-frame-update: semantic-search-coherent-root-frame-check semantic-search-target-register
	$(CI_NODE) tools/d3262-search-calibration/coherent-target-comparison-frame.mjs --write

semantic-search-coherent-target-frame-check: semantic-search-coherent-root-frame-check semantic-search-target-register
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-target-comparison-frame.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-target-comparison-frame.mjs

semantic-search-stockfish-new-child-capture: semantic-search-coherent-exact-replies-check
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture.mjs --coherent-new-child

semantic-search-stockfish-new-child-all-capture: semantic-search-coherent-exact-replies-check
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture.mjs --coherent-new-child-all

semantic-search-stockfish-new-child-check: semantic-search-coherent-exact-replies-check
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-new-child-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/stockfish-new-child-check.mjs

semantic-search-maia-new-child-capture: semantic-search-stockfish-new-child-check
	docker run --rm --mount type=bind,src="$(CURDIR)",dst=/repo -w /repo --entrypoint python chess-tabiya-maia:dev tools/d3262-search-calibration/maia-coherent-new-child.py --out planning/semantic-consequence-search/d3262-maia-coherent-new-child.json

semantic-search-maia-new-child-check: semantic-search-stockfish-new-child-check
	$(CI_NODE) --test tools/d3262-search-calibration/maia-coherent-new-child-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-coherent-new-child-check.mjs

semantic-search-coherent-first-reply-update: semantic-search-maia-new-child-check semantic-search-maia-history-replay-check semantic-search-stockfish-coherent-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-first-reply-frontier.mjs --write

semantic-search-coherent-first-reply-check: semantic-search-maia-new-child-check semantic-search-maia-history-replay-check semantic-search-stockfish-coherent-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-first-reply-frontier.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-first-reply-frontier.mjs

semantic-search-coherent-deeper-supplement-update: semantic-search-coherent-first-reply-check semantic-search-stockfish-horizon4-check semantic-search-maia-horizon4-path-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-deeper-supplement-frame.mjs --write

semantic-search-coherent-deeper-supplement-check: semantic-search-coherent-first-reply-check semantic-search-stockfish-horizon4-check semantic-search-maia-horizon4-path-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-deeper-supplement-frame.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-deeper-supplement-frame.mjs

semantic-search-stockfish-coherent-deeper-capture: semantic-search-coherent-deeper-supplement-check
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture.mjs --coherent-deeper-supplement $(if $(START),--start $(START),) $(if $(LIMIT),--limit $(LIMIT),) $(if $(OUT),--out "$(abspath $(OUT))",)

semantic-search-maia-coherent-deeper-capture: semantic-search-coherent-deeper-supplement-check
	docker run --rm --mount type=bind,src="$(CURDIR)",dst=/repo -w /repo --entrypoint python chess-tabiya-maia:dev tools/d3262-search-calibration/maia-horizon4-path-capture.py --coherent-supplement --out planning/semantic-consequence-search/d3262-maia-coherent-deeper-supplement.json

semantic-search-stockfish-coherent-deeper-check: semantic-search-coherent-deeper-supplement-check
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-coherent-deeper-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/stockfish-coherent-deeper-check.mjs

semantic-search-maia-coherent-deeper-check: semantic-search-coherent-deeper-supplement-check
	$(CI_NODE) --test tools/d3262-search-calibration/maia-coherent-deeper-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-coherent-deeper-check.mjs

semantic-search-coherent-deeper-union-update: semantic-search-stockfish-coherent-deeper-check semantic-search-maia-coherent-deeper-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-deeper-source-union.mjs --write

semantic-search-coherent-deeper-union-check: semantic-search-stockfish-coherent-deeper-check semantic-search-maia-coherent-deeper-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-deeper-source-union.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-deeper-source-union.mjs

semantic-search-coherent-relation-event-update: semantic-search-coherent-target-frame-check semantic-search-coherent-exact-replies-check
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/coherent-semantic-relation-event-first-layer.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/coherent-semantic-relation-event-first-layer.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/coherent-semantic-relation-event-first-layer.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/coherent-semantic-relation-event-first-layer.mjs --write

semantic-search-coherent-relation-event-check: semantic-search-coherent-target-frame-check semantic-search-coherent-exact-replies-check
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/coherent-semantic-relation-event-first-layer.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/coherent-semantic-relation-event-first-layer.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/coherent-semantic-relation-event-first-layer.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-semantic-relation-event-first-layer.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/coherent-semantic-relation-event-first-layer.mjs

semantic-search-coherent-semantic-reserve-update: semantic-search-coherent-relation-event-check semantic-search-stockfish-coherent-check semantic-search-stockfish-new-child-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-semantic-reserve.mjs --write

semantic-search-coherent-semantic-reserve-check: semantic-search-coherent-relation-event-check semantic-search-stockfish-coherent-check semantic-search-stockfish-new-child-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-semantic-reserve.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-semantic-reserve.mjs

semantic-search-coherent-immediate-witness-update: semantic-search-coherent-target-frame-check semantic-search-coherent-exact-replies-check
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/coherent-immediate-and-witness.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/coherent-immediate-and-witness.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/coherent-immediate-and-witness.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/coherent-immediate-and-witness.mjs --write

semantic-search-coherent-immediate-witness-check: semantic-search-coherent-target-frame-check semantic-search-coherent-exact-replies-check
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/coherent-immediate-and-witness.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/coherent-immediate-and-witness.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/coherent-immediate-and-witness.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-immediate-and-witness.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/coherent-immediate-and-witness.mjs

semantic-search-coherent-local-contrast-update: semantic-search-coherent-immediate-witness-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-local-relation-contrast.mjs --write

semantic-search-coherent-destination-reply-update: semantic-search-coherent-target-frame-check semantic-search-coherent-exact-replies-check
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/coherent-destination-reply-control.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/coherent-destination-reply-control.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/coherent-destination-reply-control.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/coherent-destination-reply-control.mjs --write

semantic-search-coherent-destination-reply-check: semantic-search-coherent-target-frame-check semantic-search-coherent-exact-replies-check
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/coherent-destination-reply-control.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/coherent-destination-reply-control.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/coherent-destination-reply-control.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-destination-reply-control.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/coherent-destination-reply-control.mjs

semantic-search-coherent-bounded-targets-update: semantic-search-coherent-target-frame-check semantic-search-coherent-exact-replies-check
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/coherent-bounded-targets.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/coherent-bounded-targets.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/coherent-bounded-targets.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/coherent-bounded-targets.mjs --write

semantic-search-coherent-bounded-targets-check: semantic-search-coherent-target-frame-check semantic-search-coherent-exact-replies-check
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/coherent-bounded-targets.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/coherent-bounded-targets.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/coherent-bounded-targets.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-bounded-targets.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/coherent-bounded-targets.mjs

semantic-search-coherent-bounded-contrast-update: semantic-search-coherent-bounded-targets-check semantic-search-coherent-local-contrast-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-bounded-contrast.mjs --write

semantic-search-coherent-bounded-contrast-check: semantic-search-coherent-bounded-targets-check semantic-search-coherent-local-contrast-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-bounded-contrast.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-bounded-contrast.mjs

semantic-search-coherent-semantic-provider-gap-update: semantic-search-coherent-semantic-reserve-check semantic-search-coherent-exact-replies-check semantic-search-coherent-deeper-union-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-semantic-provider-gap.mjs --write

semantic-search-coherent-semantic-provider-gap-check: semantic-search-coherent-semantic-reserve-check semantic-search-coherent-exact-replies-check semantic-search-coherent-deeper-union-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-semantic-provider-gap.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-semantic-provider-gap.mjs

semantic-search-coherent-semantic-supplement-update: semantic-search-coherent-semantic-provider-gap-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-semantic-supplement-frame.mjs --write

semantic-search-coherent-semantic-supplement-check: semantic-search-coherent-semantic-provider-gap-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-semantic-supplement-frame.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-semantic-supplement-frame.mjs

semantic-search-stockfish-coherent-semantic-capture: semantic-search-coherent-semantic-supplement-check
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture.mjs --coherent-semantic-supplement

semantic-search-maia-coherent-semantic-capture: semantic-search-coherent-semantic-supplement-check
	docker run --rm --mount type=bind,src="$(CURDIR)",dst=/repo -w /repo --entrypoint python chess-tabiya-maia:dev tools/d3262-search-calibration/maia-horizon4-path-capture.py --semantic-supplement --out planning/semantic-consequence-search/d3262-maia-coherent-semantic-supplement.json

semantic-search-coherent-semantic-source-check: semantic-search-coherent-semantic-supplement-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-semantic-source-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-semantic-source-check.mjs

semantic-search-coherent-semantic-source-union-update: semantic-search-coherent-semantic-source-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-semantic-source-union.mjs --write

semantic-search-coherent-semantic-source-union-check: semantic-search-coherent-semantic-source-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-semantic-source-union.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-semantic-source-union.mjs

semantic-search-coherent-exact-trigger-update: semantic-search-coherent-bounded-targets-check semantic-search-coherent-exact-replies-check
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/coherent-exact-trigger-outcome.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/coherent-exact-trigger-outcome.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/coherent-exact-trigger-outcome.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/coherent-exact-trigger-outcome.mjs --write

semantic-search-coherent-exact-trigger-check: semantic-search-coherent-bounded-targets-check semantic-search-coherent-exact-replies-check
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/coherent-exact-trigger-outcome.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/coherent-exact-trigger-outcome.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/coherent-exact-trigger-outcome.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-exact-trigger-outcome.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/coherent-exact-trigger-outcome.mjs

semantic-search-coherent-frontier-target-update: semantic-search-coherent-bounded-targets-check semantic-search-coherent-first-reply-check semantic-search-coherent-semantic-reserve-check
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/coherent-frontier-target-outcome.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/coherent-frontier-target-outcome.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/coherent-frontier-target-outcome.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/coherent-frontier-target-outcome.mjs --write

semantic-search-coherent-frontier-target-check: semantic-search-coherent-bounded-targets-check semantic-search-coherent-first-reply-check semantic-search-coherent-semantic-reserve-check
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/coherent-frontier-target-outcome.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/coherent-frontier-target-outcome.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/coherent-frontier-target-outcome.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-frontier-target-outcome.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/coherent-frontier-target-outcome.mjs

semantic-search-coherent-frontier-contrast-update: semantic-search-coherent-bounded-contrast-check semantic-search-coherent-frontier-target-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-frontier-contrast.mjs --write

semantic-search-coherent-frontier-contrast-check: semantic-search-coherent-bounded-contrast-check semantic-search-coherent-frontier-target-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-frontier-contrast.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-frontier-contrast.mjs

semantic-search-coherent-local-contrast-check: semantic-search-coherent-immediate-witness-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-local-relation-contrast.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-local-relation-contrast.mjs

semantic-search-coherent-event-reach-update: semantic-search-coherent-semantic-reserve-check semantic-search-coherent-immediate-witness-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-event-reach-evaluation.mjs --write

semantic-search-coherent-event-reach-check: semantic-search-coherent-semantic-reserve-check semantic-search-coherent-immediate-witness-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-event-reach-evaluation.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-event-reach-evaluation.mjs

semantic-search-coherent-event-policy-update: semantic-search-coherent-event-reach-check semantic-search-maia-history-replay-check semantic-search-maia-new-child-check
	$(CI_NODE) tools/d3262-search-calibration/coherent-event-policy-relevance.mjs --write

semantic-search-coherent-event-policy-check: semantic-search-coherent-event-reach-check semantic-search-maia-history-replay-check semantic-search-maia-new-child-check
	$(CI_NODE) --test tools/d3262-search-calibration/coherent-event-policy-relevance.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/coherent-event-policy-relevance.mjs

semantic-search-stockfish-horizon4-capture: semantic-search-horizon4-frontier
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture.mjs --horizon4 $(if $(START),--start $(START),) $(if $(LIMIT),--limit $(LIMIT),) $(if $(OUT),--out "$(abspath $(OUT))",)
	$(CI_NODE) tools/d3262-search-calibration/stockfish-horizon4-check.mjs "$(if $(OUT),$(abspath $(OUT)),planning/semantic-consequence-search/d3262-stockfish-horizon4-capture.json)"

semantic-search-stockfish-horizon4-check: semantic-search-horizon4-frontier
	$(CI_NODE) tools/d3262-search-calibration/stockfish-horizon4-check.mjs "$(if $(OUT),$(abspath $(OUT)),planning/semantic-consequence-search/d3262-stockfish-horizon4-capture.json)"

semantic-search-stockfish-horizon4-smoke-check: semantic-search-horizon4-frontier
	$(CI_NODE) tools/d3262-search-calibration/stockfish-horizon4-check.mjs planning/semantic-consequence-search/d3262-stockfish-horizon4-smoke.json

semantic-search-stockfish-horizon4-batch: semantic-search-horizon4-frontier
	$(CI_NODE) tools/d3262-search-calibration/stockfish-horizon4-batch.mjs $(if $(MAX_NEW),--max-new $(MAX_NEW),)

semantic-search-stockfish-horizon4-merge: semantic-search-horizon4-frontier
	$(CI_NODE) tools/d3262-search-calibration/stockfish-horizon4-merge.mjs --write

semantic-search-maia-history-replay-capture:
	docker run --rm --mount type=bind,src="$(CURDIR)",dst=/repo -w /repo --entrypoint python chess-tabiya-maia:dev tools/d3262-search-calibration/maia-history-replay.py --out planning/semantic-consequence-search/d3262-maia-history-replay.json

semantic-search-maia-history-replay-check:
	$(CI_NODE) --test tools/d3262-search-calibration/maia-history-replay-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-history-replay-check.mjs

semantic-search-maia-history-impact-update:
	$(CI_NODE) tools/d3262-search-calibration/maia-history-impact.mjs --write

semantic-search-maia-history-impact-check: semantic-search-maia-history-replay-check
	$(CI_NODE) --test tools/d3262-search-calibration/maia-history-impact.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-history-impact.mjs

semantic-search-maia-history-frame-delta-update:
	$(CI_NODE) tools/d3262-search-calibration/maia-history-frame-delta.mjs --write

semantic-search-maia-history-frame-delta-check: semantic-search-maia-history-impact-check
	$(CI_NODE) --test tools/d3262-search-calibration/maia-history-frame-delta.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-history-frame-delta.mjs

semantic-search-stockfish-history-supplement-frame-update:
	$(CI_NODE) tools/d3262-search-calibration/stockfish-history-supplement-frame.mjs --write

semantic-search-stockfish-history-supplement-frame-check: semantic-search-maia-history-frame-delta-check
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-history-supplement-frame.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/stockfish-history-supplement-frame.mjs

semantic-search-stockfish-history-supplement-capture: semantic-search-stockfish-history-supplement-frame-check
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture.mjs --history-supplement
	$(CI_NODE) tools/d3262-search-calibration/stockfish-history-supplement-check.mjs

semantic-search-stockfish-history-supplement-check: semantic-search-stockfish-history-supplement-frame-check
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-history-supplement-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/stockfish-history-supplement-check.mjs

semantic-search-maia-horizon4-path-frame-update:
	$(CI_NODE) tools/d3262-search-calibration/maia-horizon4-path-frame.mjs --write

semantic-search-maia-horizon4-path-frame-check: semantic-search-stockfish-history-supplement-check
	$(CI_NODE) --test tools/d3262-search-calibration/maia-horizon4-path-frame.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-horizon4-path-frame.mjs

semantic-search-maia-horizon4-path-capture: semantic-search-maia-horizon4-path-frame-check
	docker run --rm --mount type=bind,src="$(CURDIR)",dst=/repo -w /repo --entrypoint python chess-tabiya-maia:dev tools/d3262-search-calibration/maia-horizon4-path-capture.py --out planning/semantic-consequence-search/d3262-maia-horizon4-path-capture.json
	$(CI_NODE) tools/d3262-search-calibration/maia-horizon4-path-check.mjs

semantic-search-maia-horizon4-path-check: semantic-search-maia-horizon4-path-frame-check
	$(CI_NODE) --test tools/d3262-search-calibration/maia-horizon4-path-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-horizon4-path-check.mjs

semantic-search-stockfish-child-check: semantic-search-stockfish-check semantic-search-exact-replies
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-child-capture-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/stockfish-child-capture-check.mjs

semantic-search-stockfish-child-beam: semantic-search-stockfish-child-check semantic-search-material-immediate semantic-search-destination-reply-witness
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-child-beam.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/stockfish-child-beam.mjs

semantic-search-stockfish-check:
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-capture-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/stockfish-capture-check.mjs

semantic-search-maia-capture:
	$(CI_NODE) tools/d3262-search-calibration/maia-capture.mjs $(if $(LIMIT),--limit $(LIMIT),) $(if $(OUT),--out "$(abspath $(OUT))",)

semantic-search-maia-child-capture:
	$(CI_NODE) tools/d3262-search-calibration/maia-child-capture.mjs $(if $(LIMIT),--limit $(LIMIT),) $(if $(OUT),--out "$(abspath $(OUT))",)

semantic-search-maia-child-check: semantic-search-exact-replies
	$(CI_NODE) --test tools/d3262-search-calibration/maia-child-capture-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-child-capture-check.mjs

semantic-search-maia-configured-window: semantic-search-maia-child-check semantic-search-material-immediate semantic-search-destination-reply-witness
	$(CI_NODE) --test tools/d3262-search-calibration/maia-configured-window.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-configured-window.mjs

semantic-search-maia-direct-check: semantic-search-maia-configured-window
	$(CI_NODE) --test tools/d3262-search-calibration/maia-direct-logits-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-direct-logits-check.mjs

semantic-search-maia-direct-frontier: semantic-search-maia-direct-check
	$(CI_NODE) --test tools/d3262-search-calibration/maia-direct-mass-frontier.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-direct-mass-frontier.mjs

semantic-search-maia-child-prefix: semantic-search-maia-child-check semantic-search-material-immediate semantic-search-destination-reply-witness
	$(CI_NODE) --test tools/d3262-search-calibration/maia-child-prefix.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-child-prefix.mjs

semantic-search-maia-check:
	$(CI_NODE) --test tools/d3262-search-calibration/maia-capture-check.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/maia-capture-check.mjs

semantic-search-root-frame: semantic-search-stockfish-check semantic-search-maia-check
	$(CI_NODE) --test tools/d3262-search-calibration/root-frame.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/root-frame.mjs

semantic-search-exact-replies: semantic-search-root-frame
	$(CI_NODE) --test tools/d3262-search-calibration/exact-reply-enumeration.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/exact-reply-enumeration.mjs

semantic-search-fork-controls: semantic-search-exact-replies
	$(CI_NODE) --test tools/d3262-search-calibration/fork-control-identity.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/fork-control-identity.mjs

semantic-search-bishop-pressure: semantic-search-exact-replies
	$(CI_NODE) --test tools/d3262-search-calibration/bishop-pressure-control.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/bishop-pressure-control.mjs

semantic-search-target-register: semantic-search-manifest
	$(CI_NODE) --test tools/d3262-search-calibration/target-register.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/target-register.mjs

semantic-search-target-comparison-frame: semantic-search-target-register semantic-search-root-frame
	$(CI_NODE) --test tools/d3262-search-calibration/target-comparison-frame.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/target-comparison-frame.mjs

semantic-search-material-immediate: semantic-search-target-comparison-frame semantic-search-exact-replies
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/material-immediate.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/material-immediate.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/material-immediate.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/material-immediate.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/material-immediate.mjs

semantic-search-destination-immediate: semantic-search-target-comparison-frame semantic-search-exact-replies
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/destination-immediate.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/destination-immediate.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/destination-immediate.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/destination-immediate.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/destination-immediate.mjs

semantic-search-destination-reply-witness: semantic-search-destination-immediate semantic-search-exact-replies
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/destination-reply-witness.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/destination-reply-witness.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/destination-reply-witness.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/destination-reply-witness.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/destination-reply-witness.mjs

semantic-search-semantic-touch: semantic-search-target-comparison-frame semantic-search-exact-replies
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/semantic-touch-first-layer.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/semantic-touch-first-layer.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/semantic-touch-first-layer.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/semantic-touch-first-layer.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/semantic-touch-first-layer.mjs

semantic-search-semantic-reserve: semantic-search-semantic-touch semantic-search-stockfish-child-check semantic-search-material-immediate semantic-search-destination-reply-witness
	$(CI_NODE) --test tools/d3262-search-calibration/semantic-reserve-first-layer.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/semantic-reserve-first-layer.mjs

semantic-search-relation-event: semantic-search-semantic-touch
	./node_modules/.bin/tsc --noEmit --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck tools/d3262-search-calibration/semantic-relation-event-first-layer.ts
	./node_modules/.bin/esbuild tools/d3262-search-calibration/semantic-relation-event-first-layer.ts --bundle --platform=node --format=esm --outfile=tools/d3262-search-calibration/dist/semantic-relation-event-first-layer.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/semantic-relation-event-first-layer.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/dist/semantic-relation-event-first-layer.mjs

semantic-search-relation-event-reserve: semantic-search-relation-event semantic-search-stockfish-child-check semantic-search-material-immediate semantic-search-destination-reply-witness
	$(CI_NODE) --test tools/d3262-search-calibration/semantic-relation-event-reserve.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/semantic-relation-event-reserve.mjs

semantic-search-local-contrast: semantic-search-target-comparison-frame semantic-search-material-immediate semantic-search-destination-reply-witness
	$(CI_NODE) --test tools/d3262-search-calibration/local-relation-contrast.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/local-relation-contrast.mjs

semantic-search-local-rank-concordance: semantic-search-local-contrast semantic-search-stockfish-check
	$(CI_NODE) --test tools/d3262-search-calibration/local-rank-concordance.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/local-rank-concordance.mjs

semantic-search-event-policy-relevance: semantic-search-relation-event semantic-search-stockfish-child-check semantic-search-maia-direct-check semantic-search-material-immediate semantic-search-destination-reply-witness
	$(CI_NODE) --test tools/d3262-search-calibration/event-policy-relevance.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/event-policy-relevance.mjs

semantic-search-horizon4-frontier: semantic-search-exact-replies semantic-search-stockfish-child-beam semantic-search-maia-direct-frontier semantic-search-relation-event-reserve
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-coherent-table.test.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/horizon4-frontier.test.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-horizon4-check.test.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-horizon4-batch.test.mjs
	$(CI_NODE) --test tools/d3262-search-calibration/stockfish-horizon4-merge.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/horizon4-frontier.mjs

semantic-search-provider-line-arm: semantic-search-material-immediate semantic-search-destination-reply-witness semantic-search-stockfish-check semantic-search-fork-controls semantic-search-bishop-pressure
	$(CI_NODE) --test tools/d3262-search-calibration/provider-line-arm.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/provider-line-arm.mjs

semantic-search-exact-arm-forcing: semantic-search-material-immediate semantic-search-destination-reply-witness semantic-search-exact-replies
	$(CI_NODE) --test tools/d3262-search-calibration/exact-arm-forcing.test.mjs
	$(CI_NODE) tools/d3262-search-calibration/exact-arm-forcing.mjs

foundation-closure-check: evidence-manifest-check evidence-value-authority-route-map semantic-validation-matrix
	./node_modules/.bin/vitest run --config tools/d1737-source-identity-closeout/vitest.config.ts --reporter=verbose
	./node_modules/.bin/vitest run --config tools/d1710-producer-execution-harness/vitest.config.ts --reporter=verbose

foundation-source-author-contract:
	node --test tools/d1736-foundation-source-author-contract/contract.test.mjs

foundation-source-author-audit:
	node --test tools/d2390-foundation-source-author-audit/contract.test.mjs

foundation-source-author-repair: foundation-source-author-contract foundation-source-author-audit

semantic-validation-closure:
	./node_modules/.bin/vitest run --config tools/d1711-semantic-validation-closure/vitest.config.ts --reporter=verbose

semantic-validation-matrix:
	./node_modules/.bin/vitest run --config tools/d1713-semantic-validation-matrix/vitest.config.ts --reporter=verbose

semantic-validation-author-contract:
	node --test tools/d2039-semantic-validation-author-contract/contract.test.mjs
	node --test tools/d2194-semantic-validation-author-repair/contract.test.mjs

.PHONY: semantic-validation-author-repair semantic-validation-fresh-review semantic-validation-second-fresh-review
.PHONY: semantic-validation-third-author-repair semantic-validation-adversarial-audit semantic-validation-fourth-author-repair semantic-validation-fifth-fresh-review semantic-validation-fifth-author-repair
.PHONY: assistance-register-sixth-fresh-review
.PHONY: provider-protocol-fresh-review
.PHONY: storage-backup-second-fresh-review storage-backup-second-author-repair storage-backup-third-fresh-review storage-backup-third-author-repair storage-backup-fourth-fresh-review storage-backup-fourth-author-repair
semantic-validation-author-repair:
	node --test tools/d2194-semantic-validation-author-repair/contract.test.mjs

semantic-validation-fresh-review:
	node --test tools/d2194-semantic-validation-fresh-review/*.test.mjs

semantic-validation-second-fresh-review:
	node --test tools/d2331-semantic-validation-second-fresh-review/*.test.mjs

semantic-validation-third-author-repair:
	./node_modules/.bin/vitest run --config tools/d2331-semantic-validation-third-author-repair/vitest.config.ts --reporter=verbose

semantic-validation-adversarial-audit:
	node --test tools/d2385-semantic-validation-adversarial-audit/contract.test.mjs

semantic-validation-fourth-author-repair:
	node --test tools/d2385-semantic-validation-fourth-author-repair/contract.test.mjs

semantic-validation-fifth-fresh-review:
	node --test tools/d2445-semantic-validation-fifth-fresh-review/contract.test.mjs

semantic-validation-fifth-author-repair:
	node --test tools/d2445-semantic-validation-fifth-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2445-semantic-validation-fifth-author-repair/tsconfig.contract.json --noEmit

assistance-register-sixth-fresh-review:
	node --test tools/d2450-assistance-register-sixth-fresh-review/contract.test.mjs

provider-protocol-fresh-review:
	node --test tools/d2455-provider-protocol-fresh-review/contract.test.mjs

.PHONY: provider-protocol-second-fresh-review
provider-protocol-second-fresh-review:
	node --test tools/d2809-provider-protocol-second-fresh-review/review.test.mjs

.PHONY: provider-protocol-second-author-repair provider-protocol-third-author-repair provider-protocol-fourth-fresh-review provider-protocol-fourth-author-repair
provider-protocol-second-author-repair: provider-protocol-fresh-review provider-protocol-second-fresh-review
	node --test tools/d2809-provider-protocol-second-author-repair/contract.test.mjs

.PHONY: provider-protocol-third-fresh-review
provider-protocol-third-fresh-review: provider-protocol-second-author-repair
	node --test tools/d2874-provider-protocol-third-fresh-review/review.test.mjs

provider-protocol-third-author-repair: provider-protocol-third-fresh-review
	node --test tools/d2874-provider-protocol-third-author-repair/contract.test.mjs

provider-protocol-fourth-fresh-review: provider-protocol-third-author-repair
	node --test tools/d2909-provider-protocol-fourth-fresh-review/review.test.mjs

provider-protocol-fourth-author-repair: provider-protocol-fourth-fresh-review
	node --test tools/d2909-provider-protocol-fourth-author-repair/contract.test.mjs

.PHONY: provider-protocol-fifth-fresh-review
provider-protocol-fifth-fresh-review: provider-protocol-fourth-author-repair
	node --test tools/d2950-provider-protocol-fifth-fresh-review/review.test.mjs

.PHONY: provider-protocol-fifth-author-repair
provider-protocol-fifth-author-repair: provider-protocol-fifth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2950-provider-protocol-fifth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2950-provider-protocol-fifth-author-repair/tsconfig.json

.PHONY: provider-protocol-sixth-fresh-review provider-protocol-cut-contract
provider-protocol-sixth-fresh-review: provider-protocol-fifth-author-repair
	./node_modules/.bin/vitest run --config tools/d2956-provider-protocol-sixth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2956-provider-protocol-sixth-fresh-review/tsconfig.json

provider-protocol-cut-contract:
	node --test tools/d3128-provider-protocol-cut-contract/contract.test.mjs

.PHONY: provider-health-sixth-fresh-review
provider-health-sixth-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2815-provider-health-sixth-fresh-review/vitest.config.ts --reporter=verbose

.PHONY: provider-health-sixth-author-repair
provider-health-sixth-author-repair: provider-health-fifth-author-repair provider-health-sixth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2815-provider-health-sixth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2815-provider-health-sixth-author-repair/tsconfig.json

.PHONY: provider-health-seventh-fresh-review
provider-health-seventh-fresh-review: provider-health-sixth-author-repair
	./node_modules/.bin/vitest run --config tools/d2846-provider-health-seventh-fresh-review/vitest.config.ts --reporter=verbose

.PHONY: provider-health-seventh-author-repair
provider-health-seventh-author-repair: provider-health-seventh-fresh-review
	./node_modules/.bin/vitest run --config tools/d2846-provider-health-seventh-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2846-provider-health-seventh-author-repair/tsconfig.json

.PHONY: provider-health-eighth-fresh-review
provider-health-eighth-fresh-review: provider-health-seventh-author-repair
	./node_modules/.bin/vitest run --config tools/d2857-provider-health-eighth-fresh-review/vitest.config.ts --reporter=verbose

.PHONY: provider-health-eighth-author-repair
provider-health-eighth-author-repair: provider-health-eighth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2857-provider-health-eighth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2857-provider-health-eighth-author-repair/tsconfig.json

.PHONY: provider-health-ninth-fresh-review
provider-health-ninth-fresh-review: provider-health-eighth-author-repair
	./node_modules/.bin/vitest run --config tools/d2869-provider-health-ninth-fresh-review/vitest.config.ts --reporter=verbose

.PHONY: provider-health-ninth-author-repair
provider-health-ninth-author-repair: provider-health-ninth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2869-provider-health-ninth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2869-provider-health-ninth-author-repair/tsconfig.json

.PHONY: provider-health-tenth-fresh-review
provider-health-tenth-fresh-review: provider-health-ninth-author-repair
	./node_modules/.bin/vitest run --config tools/d2912-provider-health-tenth-fresh-review/vitest.config.ts --reporter=verbose

.PHONY: provider-health-tenth-author-repair
provider-health-tenth-author-repair: provider-health-tenth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2912-provider-health-tenth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2912-provider-health-tenth-author-repair/tsconfig.json

.PHONY: provider-health-eleventh-fresh-review
provider-health-eleventh-fresh-review: provider-health-tenth-author-repair
	./node_modules/.bin/vitest run --config tools/d2942-provider-health-eleventh-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2942-provider-health-eleventh-fresh-review/tsconfig.json

.PHONY: provider-health-eleventh-author-repair
provider-health-eleventh-author-repair: provider-health-eleventh-fresh-review
	./node_modules/.bin/vitest run --config tools/d2942-provider-health-eleventh-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2942-provider-health-eleventh-author-repair/tsconfig.json

.PHONY: provider-health-twelfth-fresh-review
provider-health-twelfth-fresh-review: provider-health-eleventh-author-repair
	./node_modules/.bin/vitest run --config tools/d2966-provider-health-twelfth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2966-provider-health-twelfth-fresh-review/tsconfig.json

storage-backup-second-fresh-review:
	node --test tools/d2460-storage-backup-second-fresh-review/contract.test.mjs

storage-backup-second-author-repair: storage-backup-author-repair
	./node_modules/.bin/vitest run --config tools/d2460-storage-backup-second-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2460-storage-backup-second-author-repair/tsconfig.json

storage-backup-third-fresh-review: storage-backup-second-author-repair
	./node_modules/.bin/vitest run --config tools/d2608-storage-backup-third-fresh-review/vitest.config.ts --reporter=verbose

storage-backup-third-author-repair: storage-backup-second-author-repair
	./node_modules/.bin/vitest run --config tools/d2608-storage-backup-third-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2608-storage-backup-third-author-repair/tsconfig.json

storage-backup-fourth-fresh-review: storage-backup-third-author-repair
	./node_modules/.bin/vitest run --config tools/d2724-storage-backup-fourth-fresh-review/vitest.config.ts --reporter=verbose

storage-backup-fourth-author-repair: storage-backup-fourth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2724-storage-backup-fourth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2724-storage-backup-fourth-author-repair/tsconfig.json

.PHONY: storage-backup-fifth-fresh-review
storage-backup-fifth-fresh-review: storage-backup-fourth-author-repair
	./node_modules/.bin/vitest run --config tools/d2972-storage-backup-fifth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2972-storage-backup-fifth-fresh-review/tsconfig.json

module-evidence-assembly:
	./node_modules/.bin/vitest run --config tools/d1865-evidence-assembly-harness/vitest.config.ts --reporter=verbose

module-registration-author-contract-update:
	./node_modules/.bin/esbuild tools/d2120-module-registration-author-contract/generate.ts --bundle --platform=node --format=esm --outfile=/tmp/chess-tabiya-module-registration-generate.mjs
	node /tmp/chess-tabiya-module-registration-generate.mjs

module-registration-author-contract:
	./node_modules/.bin/vitest run --config tools/d2120-module-registration-author-contract/vitest.config.ts --reporter=verbose

.PHONY: wave-c-module-amendment
wave-c-module-amendment: module-evidence-assembly module-registration-author-contract
	node --test tools/d3129-wave-c-module-amendment/contract.test.mjs

.PHONY: module-discharge-coverage-contract
module-discharge-coverage-contract:
	./node_modules/.bin/vitest run --config tools/d3065-module-discharge-coverage-contract/vitest.config.ts --reporter=verbose

module-registration-fresh-review:
	node --test tools/d2120-module-registration-fresh-review/*.test.mjs

.PHONY: module-registration-fifth-fresh-review module-registration-sixth-author-repair
module-registration-fifth-fresh-review:
	node --test tools/d2432-module-registration-fifth-fresh-review/contract.test.mjs

module-registration-sixth-author-repair:
	node --test tools/d2432-module-registration-sixth-author-repair/contract.test.mjs

intent-presets-author-contract:
	node --test tools/d1659-intent-presets-author-contract/contract.test.mjs

intent-presets-second-author-repair:
	./node_modules/.bin/vitest run --config tools/d2127-intent-presets-author-contract/vitest.config.ts --reporter=verbose

intent-presets-fresh-review:
	node --test tools/d2127-intent-presets-fresh-review/*.test.mjs

intent-presets-second-fresh-review:
	node --test tools/d2171-intent-presets-second-fresh-review/*.test.mjs

presentation-binding-census:
	./node_modules/.bin/esbuild tools/d1862-presentation-adapter-plan/census.ts --bundle --platform=node --format=esm --outfile=/tmp/chess-tabiya-presentation-binding-census.mjs
	node /tmp/chess-tabiya-presentation-binding-census.mjs

evidence-presentation-author-contract:
	./node_modules/.bin/vitest run --config tools/d1862-presentation-adapter-plan/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext tools/d1862-presentation-adapter-plan/lifecycle.typecheck.ts

evidence-presentation-second-author-repair:
	./node_modules/.bin/vitest run --config tools/d2135-evidence-presentation-author-contract/vitest.config.ts --reporter=verbose

evidence-presentation-fresh-review:
	node --test tools/d2135-evidence-presentation-fresh-review/*.test.mjs

semantic-collectors-promotion-fresh-review:
	node --test tools/d2141-semantic-collectors-promotion-fresh-review/*.test.mjs

semantic-collectors-promotion-author-repair:
	node --test tools/d2141-semantic-collectors-promotion-author-repair/*.test.mjs

semantic-collectors-promotion-second-fresh-review:
	node --test tools/d2179-semantic-collectors-promotion-second-fresh-review/*.test.mjs

semantic-collectors-promotion-second-author-repair:
	node --test tools/d2179-semantic-collectors-promotion-second-author-repair/*.test.mjs
	./node_modules/.bin/tsc -p tools/d2179-semantic-collectors-promotion-second-author-repair/tsconfig.contract.json --noEmit

evidence-seal-audit:
	./node_modules/.bin/vitest run --config tools/d2144-evidence-seal-audit/vitest.config.ts

# Permanent value-authority gate (rfc/evidence-value-authority.md §8): single mint, central invoker,
# registry = non-retired catalogue, receipts, positives and falsifiers for every factory.
evidence-value-authority:
	./node_modules/.bin/vitest run --config vitest.software.config.ts packages/runtime/src/evidence-value-authority.test.ts

evidence-value-authority-author-contract:
	node --test tools/d2144-evidence-value-authority-author-contract/contract.test.mjs

evidence-value-authority-route-map:
	./node_modules/.bin/esbuild tools/d2144-evidence-value-authority-route-map/route-map.ts --bundle --platform=node --format=esm --external:typescript --outfile=tools/d2144-evidence-value-authority-route-map/dist/route-map.mjs
	node tools/d2144-evidence-value-authority-route-map/dist/route-map.mjs

evidence-value-authority-route-map-update:
	./node_modules/.bin/esbuild tools/d2144-evidence-value-authority-route-map/route-map.ts --bundle --platform=node --format=esm --external:typescript --outfile=tools/d2144-evidence-value-authority-route-map/dist/route-map.mjs
	node tools/d2144-evidence-value-authority-route-map/dist/route-map.mjs --write

opening-catalogue: build
	node apps/server/dist/opening-catalogue-build.js

opening-catalogue-check: build
	node apps/server/dist/opening-catalogue-build.js --check

account-data-lifecycle-check:
	./node_modules/.bin/vitest run apps/server/src/r18-account-data.test.ts

learner-rating-bracket:
	./node_modules/.bin/esbuild tools/learner-rating-bracket-harness/simulate.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-learner-rating-bracket.mjs
	node /tmp/tabiya-learner-rating-bracket.mjs --update

learner-rating-bracket-check:
	node --test tools/learner-rating-bracket-harness/check.test.mjs

learner-rating-isolation-check:
	node --test tools/learner-rating-isolation-harness/import-graph.test.mjs
	./node_modules/.bin/vitest run --config tools/learner-rating-isolation-harness/vitest.config.ts

longitudinal-store-author-contract:
	./node_modules/.bin/vitest run --config tools/d1612-longitudinal-contract-harness/vitest.config.ts --reporter=verbose

longitudinal-store-fresh-review:
	node --test tools/d2063-longitudinal-fresh-review/*.test.mjs

.PHONY: longitudinal-store-second-fresh-review
longitudinal-store-second-fresh-review:
	node --test tools/d2227-longitudinal-second-fresh-review/contract.test.mjs

.PHONY: longitudinal-store-third-fresh-review longitudinal-store-fourth-author-repair longitudinal-store-fourth-fresh-review longitudinal-store-fifth-author-repair longitudinal-store-fifth-fresh-review longitudinal-store-sixth-author-repair longitudinal-store-sixth-fresh-review longitudinal-store-seventh-author-repair longitudinal-store-seventh-fresh-review longitudinal-store-eighth-author-repair longitudinal-store-eighth-fresh-review longitudinal-store-ninth-author-repair longitudinal-store-tenth-fresh-review
longitudinal-store-third-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2402-longitudinal-third-fresh-review/vitest.config.ts --reporter=verbose

longitudinal-store-fourth-author-repair: longitudinal-store-author-contract
	./node_modules/.bin/vitest run --config tools/d2402-longitudinal-fourth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext tools/d2402-longitudinal-fourth-author-repair/contract.typecheck.ts

longitudinal-store-fourth-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2514-longitudinal-fourth-fresh-review/vitest.config.ts --reporter=verbose

longitudinal-store-fifth-author-repair: longitudinal-store-fourth-author-repair
	./node_modules/.bin/vitest run --config tools/d2514-longitudinal-fifth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext tools/d2514-longitudinal-fifth-author-repair/contract.typecheck.ts

longitudinal-store-fifth-fresh-review:
	node --test tools/d2570-longitudinal-fifth-fresh-review/contract.test.mjs

longitudinal-store-sixth-author-repair: longitudinal-store-fifth-author-repair
	./node_modules/.bin/vitest run --config tools/d2570-longitudinal-sixth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2570-longitudinal-sixth-author-repair/tsconfig.json

longitudinal-store-sixth-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2598-longitudinal-sixth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2598-longitudinal-sixth-fresh-review/tsconfig.json

longitudinal-store-seventh-author-repair: longitudinal-store-sixth-author-repair
	./node_modules/.bin/vitest run --config tools/d2598-longitudinal-seventh-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2598-longitudinal-seventh-author-repair/tsconfig.json

longitudinal-store-seventh-fresh-review: longitudinal-store-seventh-author-repair
	./node_modules/.bin/vitest run --config tools/d2718-longitudinal-seventh-fresh-review/vitest.config.ts --reporter=verbose

longitudinal-store-eighth-author-repair: longitudinal-store-seventh-fresh-review
	./node_modules/.bin/vitest run --config tools/d2718-longitudinal-eighth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2718-longitudinal-eighth-author-repair/tsconfig.json

longitudinal-store-eighth-fresh-review: longitudinal-store-eighth-author-repair
	./node_modules/.bin/vitest run --config tools/d2779-longitudinal-eighth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2779-longitudinal-eighth-fresh-review/tsconfig.json

longitudinal-store-ninth-author-repair: longitudinal-store-eighth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2779-longitudinal-ninth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2779-longitudinal-ninth-author-repair/tsconfig.json

longitudinal-store-tenth-fresh-review: longitudinal-store-ninth-author-repair
	./node_modules/.bin/vitest run --config tools/d2994-longitudinal-tenth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2994-longitudinal-tenth-fresh-review/tsconfig.json

.PHONY: bot-roster-fresh-review
bot-roster-fresh-review:
	node --test tools/d2233-bot-roster-fresh-review/contract.test.mjs

.PHONY: bot-roster-author-repair
bot-roster-author-repair:
	node --test tools/d2234-bot-roster-author-repair/contract.test.mjs

.PHONY: bot-calibration-verdict-contract
bot-calibration-verdict-contract:
	node --test tools/d2236-bot-calibration-verdict-contract/contract.test.mjs

.PHONY: opponent-experience-fresh-review
opponent-experience-fresh-review:
	node --test tools/d2238-opponent-experience-fresh-review/contract.test.mjs

longitudinal-store-cost:
	@test -z "$$(git status --porcelain -- Makefile packages/runtime/src/evidence-catalog.ts packages/runtime/src/semantic-evidence.ts packages/runtime/src/legal-moves.ts packages/runtime/src/phase.ts tools/research-chess/populations.ts tools/d1405-longitudinal-cost-harness tools/d1405b-single-decision-harness tools/d1612-longitudinal-contract-harness rfc/contracts/longitudinal-ingest-registry-v1.json rfc/contracts/longitudinal-sign-subsets-v1.json)" || (echo "longitudinal-store-cost requires committed measurement inputs" >&2; exit 2)
	@for arm in 20 40 80 bulk; do \
		D1405_ARM="$$arm" D1405_COMMIT="$$(git rev-parse HEAD)" D1405_RESULT_DIR="$(CURDIR)/planning/longitudinal-store" \
		./node_modules/.bin/vitest run --config tools/d1405-longitudinal-cost-harness/vitest.config.ts || exit $$?; \
	done
	@D1405_ARM=aggregate D1405_COMMIT="$$(git rev-parse HEAD)" D1405_RESULT_DIR="$(CURDIR)/planning/longitudinal-store" \
		./node_modules/.bin/vitest run --config tools/d1405-longitudinal-cost-harness/vitest.config.ts
	@D1405B_COMMIT="$$(git rev-parse HEAD)" D1405B_OUT="$(CURDIR)/planning/longitudinal-store/d1405b-single-decision-results.json" \
		./node_modules/.bin/vitest run --config tools/d1405b-single-decision-harness/vitest.config.ts

campaign-two-horizon-author-contract:
	node --test tools/d1592-two-horizon-harness/model.test.mjs tools/campaign-two-horizon-author-contract/contract.test.mjs tools/d2244-campaign-author-repair/contract.test.mjs

campaign-two-horizon-fresh-review:
	node --test tools/d2077-campaign-fresh-review/contract.test.mjs

campaign-two-horizon-third-fresh-review:
	node --test tools/d2420-campaign-third-fresh-review/contract.test.mjs

.PHONY: campaign-two-horizon-fourth-author-repair campaign-two-horizon-fourth-fresh-review campaign-two-horizon-fifth-author-repair
campaign-two-horizon-fourth-author-repair: campaign-two-horizon-author-contract
	./node_modules/.bin/vitest run --config tools/d2420-campaign-fourth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2420-campaign-fourth-author-repair/tsconfig.json

campaign-two-horizon-fourth-fresh-review: campaign-two-horizon-fourth-author-repair
	./node_modules/.bin/vitest run --config tools/d2620-campaign-fourth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2620-campaign-fourth-fresh-review/tsconfig.json

campaign-two-horizon-fifth-author-repair: campaign-two-horizon-fourth-author-repair
	./node_modules/.bin/vitest run --config tools/d2620-campaign-fifth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2620-campaign-fifth-author-repair/tsconfig.json

.PHONY: campaign-two-horizon-fifth-fresh-review campaign-two-horizon-sixth-author-repair
campaign-two-horizon-fifth-fresh-review: campaign-two-horizon-fifth-author-repair
	./node_modules/.bin/vitest run --config tools/d2736-campaign-fifth-fresh-review/vitest.config.ts --reporter=verbose

campaign-two-horizon-sixth-author-repair: campaign-two-horizon-fifth-author-repair
	./node_modules/.bin/vitest run --config tools/d2736-campaign-sixth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2736-campaign-sixth-author-repair/tsconfig.json --noEmit

.PHONY: campaign-boss-author-contract
campaign-boss-author-contract:
	node --test tools/campaign-boss-author-contract/contract.test.mjs

.PHONY: module-registration-sixth-fresh-review module-registration-seventh-author-repair
module-registration-sixth-fresh-review:
	node --test tools/d2505-module-registration-sixth-fresh-review/contract.test.mjs

module-registration-seventh-author-repair:
	./node_modules/.bin/vitest run --config tools/d2505-module-registration-seventh-author-repair/vitest.config.ts --reporter=verbose

.PHONY: module-registration-seventh-fresh-review module-registration-eighth-author-repair
module-registration-seventh-fresh-review:
	node --test tools/d2530-module-registration-seventh-fresh-review/contract.test.mjs

module-registration-eighth-author-repair: module-registration-author-contract
	node --test tools/d2530-module-registration-eighth-author-repair/contract.test.mjs

.PHONY: module-registration-eighth-fresh-review
module-registration-eighth-fresh-review:
	node --test tools/d2557-module-registration-eighth-fresh-review/contract.test.mjs

.PHONY: module-registration-ninth-author-repair
module-registration-ninth-author-repair: module-registration-eighth-author-repair
	node --test tools/d2557-module-registration-ninth-author-repair/contract.test.mjs

.PHONY: module-registration-tenth-fresh-review
module-registration-tenth-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2584-module-registration-tenth-fresh-review/vitest.config.ts --reporter=verbose

.PHONY: module-registration-tenth-author-repair
module-registration-tenth-author-repair: module-registration-author-contract
	./node_modules/.bin/vitest run --config tools/d2584-module-registration-tenth-author-repair/vitest.config.ts --reporter=verbose

.PHONY: semantic-collectors-deflection-authority-author-contract
semantic-collectors-deflection-authority-author-contract:
	./node_modules/.bin/vitest run --config tools/d2536-deflection-check-authority-author-contract/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2536-deflection-check-authority-author-contract/tsconfig.json

.PHONY: campaign-second-fresh-review
campaign-second-fresh-review:
	node --test tools/d2244-campaign-second-fresh-review/contract.test.mjs

.PHONY: social-play-fresh-review
social-play-fresh-review:
	node --test tools/d2253-social-play-fresh-review/contract.test.mjs

tactical-collector-measurement:
	./node_modules/.bin/vitest run --config tools/tactical-collector-measurement-harness/vitest.config.ts

breadth-collector-measurement:
	./node_modules/.bin/vitest run --config tools/breadth-collector-measurement-harness/vitest.config.ts

human-divergence-measurement:
	./node_modules/.bin/vitest run --config tools/d52-human-divergence-harness/vitest.config.ts
	mkdir -p /tmp/tabiya-d52-human-divergence
	./node_modules/.bin/esbuild tools/r4-difficulty-harness/extract.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-d52-human-divergence/extract.mjs
	./node_modules/.bin/esbuild tools/d52-human-divergence-harness/prepare.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-d52-human-divergence/prepare.mjs
	./node_modules/.bin/esbuild tools/d52-human-divergence-harness/probe.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-d52-human-divergence/probe.mjs
	./node_modules/.bin/esbuild tools/d52-human-divergence-harness/analyze.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-d52-human-divergence/analyze.mjs
	node /tmp/tabiya-d52-human-divergence/extract.mjs content/drafts /tmp/tabiya-d52-human-divergence/corpus.json
	node /tmp/tabiya-d52-human-divergence/prepare.mjs /tmp/tabiya-d52-human-divergence/corpus.json /tmp/tabiya-d52-human-divergence/jobs.json
	node /tmp/tabiya-d52-human-divergence/probe.mjs /tmp/tabiya-d52-human-divergence/jobs.json /tmp/tabiya-d52-human-divergence/probes.jsonl
	node /tmp/tabiya-d52-human-divergence/analyze.mjs /tmp/tabiya-d52-human-divergence/probes.jsonl planning/live-marker-quality/d52-human-divergence-results.json

option-collapse-measurement:
	./node_modules/.bin/vitest run --config tools/d53-option-collapse-harness/vitest.config.ts

dtz-census-measurement:
	mkdir -p /tmp/tabiya-d457-dtz planning/dtz-census
	python3 -B tools/d366-endgame-fidelity-harness/census.test.py
	./node_modules/.bin/esbuild tools/d366-endgame-fidelity-harness/build-set.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-d457-dtz/build-set.mjs
	node /tmp/tabiya-d457-dtz/build-set.mjs content/drafts planning/dtz-census/d457-positions.jsonl 2 5 1200
	python3 tools/d366-endgame-fidelity-harness/census.py planning/dtz-census/d457-positions.jsonl planning/dtz-census/d457-census.json

practical-resistance-measurement:
	mkdir -p /tmp/tabiya-d490-practical planning/practical-resistance
	node --test tools/r5-maia-stability-harness/probe-practical-resistance.test.mjs
	docker image inspect chess-tabiya-maia:dev >/dev/null 2>&1 || docker compose build maia
	./node_modules/.bin/esbuild tools/r5-maia-stability-harness/probe-practical-resistance.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-d490-practical/probe.mjs
	MAIA_IMAGE=chess-tabiya-maia:dev node /tmp/tabiya-d490-practical/probe.mjs tools/r5-maia-stability-harness/out/selection-summary.json planning/dtz-census/d457-positions.jsonl planning/practical-resistance/d490-tablebase.json planning/practical-resistance/d490-results.json 3 1200

phase-classifier-census:
	mkdir -p /tmp/tabiya-d2483-phase planning/phase-classifier-census
	./node_modules/.bin/vitest run --config tools/d2483-phase-classifier-census/vitest.config.ts
	./node_modules/.bin/esbuild tools/d2483-phase-classifier-census/measure.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-d2483-phase/measure.mjs
	node /tmp/tabiya-d2483-phase/measure.mjs content/drafts planning/phase-classifier-census/results.json

phase-band-census:
	mkdir -p /tmp/tabiya-d2484-phase-band planning/phase-band-census
	./node_modules/.bin/vitest run --config tools/d2484-phase-band-census/vitest.config.ts
	node --test tools/d2484-phase-band-census/run-isolated.test.mjs
	./node_modules/.bin/esbuild tools/d2484-phase-band-census/measure.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-d2484-phase-band/measure.mjs
	node tools/d2484-phase-band-census/run-isolated.mjs planning/phase-classifier-census/results.json /tmp/tabiya-d2484-phase-band/measure.mjs content/drafts planning/phase-band-census/results.json

phase-source-composition-census:
	mkdir -p /tmp/tabiya-d2485-phase-sources planning/phase-source-composition
	./node_modules/.bin/vitest run --config tools/d2485-phase-source-composition/vitest.config.ts
	./node_modules/.bin/esbuild tools/d2485-phase-source-composition/measure.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-d2485-phase-sources/measure.mjs
	node /tmp/tabiya-d2485-phase-sources/measure.mjs content/drafts apps/server/artifacts/runtime-opening-catalogue.json planning/phase-source-composition/results.json

phase-source-composition-author-contract:
	node --test tools/d2485-phase-source-composition/author-contract.test.mjs

phase-source-composition-fresh-review: phase-source-composition-author-contract
	node --test tools/d2636-phase-source-composition-fresh-review/contract.test.mjs

phase-source-composition-author-repair: phase-source-composition-author-contract
	node --test tools/d2636-phase-source-composition-author-repair/contract.test.mjs

endgame-technique-applicability-census:
	mkdir -p /tmp/tabiya-d2495-endgame-technique planning/endgame-technique-applicability
	./node_modules/.bin/vitest run --config tools/d2495-endgame-technique-applicability/vitest.config.ts
	./node_modules/.bin/esbuild tools/d2495-endgame-technique-applicability/measure.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-d2495-endgame-technique/measure.mjs
	node /tmp/tabiya-d2495-endgame-technique/measure.mjs content/drafts planning/endgame-technique-applicability/results.json

endgame-method-path-contract:
	./node_modules/.bin/vitest run --config tools/d2496-endgame-method-path/vitest.config.ts
	mkdir -p /tmp/tabiya-d2496-endgame-method-path
	./node_modules/.bin/esbuild tools/d2496-endgame-method-path/measure.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-d2496-endgame-method-path/measure.mjs
	node /tmp/tabiya-d2496-endgame-method-path/measure.mjs content/drafts planning/endgame-method-path/results.json

endgame-setup-reachability-contract:
	./node_modules/.bin/vitest run --config tools/d2497-endgame-setup-reachability/vitest.config.ts
	mkdir -p /tmp/tabiya-d2497-endgame-setup-reachability planning/endgame-setup-reachability
	./node_modules/.bin/esbuild tools/d2497-endgame-setup-reachability/measure.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-d2497-endgame-setup-reachability/measure.mjs
	node /tmp/tabiya-d2497-endgame-setup-reachability/measure.mjs tools/d2497-endgame-setup-reachability/fixtures.json planning/endgame-setup-reachability/results.json

# Registered KRPKR setup conventions vs Syzygy (design/research/endgame-setup-conventions.md).
# Offline by default from the committed tablebase cache; ONLINE=1 probes the Lichess tablebase API
# for any FEN the cache lacks.
endgame-setup-convention-validation:
	mkdir -p /tmp/tabiya-endgame-setup-conventions
	./node_modules/.bin/esbuild tools/endgame-setup-convention-validation/validate.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-endgame-setup-conventions/validate.mjs --log-level=warning
	node /tmp/tabiya-endgame-setup-conventions/validate.mjs $(if $(ONLINE),,--offline) > /dev/null
	./node_modules/.bin/vitest run --config vitest.software.config.ts packages/runtime/src/endgame-setup.test.ts

promotion-race-contract:
	./node_modules/.bin/vitest run --config tools/d1699-promotion-race-contract-harness/vitest.config.ts

provider-exchange-contract:
	node --test tools/d1871-provider-exchange-amendment-harness/*.test.mts

assistance-register-contract:
	node --test tools/d1916-assistance-register-review-harness/*.test.mts

assistance-register-repeat-review:
	node --test tools/d2009-assistance-register-repeat-review/*.test.mts

assistance-register-final-review:
	node --test tools/d2037-assistance-register-final-review/*.test.mts

assistance-register-second-fresh-review:
	node --test tools/d2113-assistance-register-second-fresh-review/*.test.mjs

assistance-register-second-author-repair:
	node --test tools/d2113-assistance-register-second-author-repair/*.test.mjs

assistance-register-third-fresh-review:
	node --test tools/d2190-assistance-register-third-fresh-review/*.test.mjs

assistance-register-third-author-repair:
	node --test tools/d2190-assistance-register-third-author-repair/*.test.mjs
	./node_modules/.bin/tsc -p tools/d2190-assistance-register-third-author-repair/tsconfig.contract.json --noEmit

assistance-register-fifth-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2355-assistance-register-fifth-fresh-review/vitest.config.ts --reporter=verbose

assistance-register-fourth-author-repair:
	./node_modules/.bin/vitest run --config tools/d2355-assistance-register-author-repair/vitest.config.ts --reporter=verbose

semantic-register-contract:
	./node_modules/.bin/vitest run --config tools/d1917-semantic-register-review-harness/vitest.config.ts
	./node_modules/.bin/vitest run --config tools/d1722-convention-identity-harness/vitest.config.ts

semantic-register-repeat-review:
	node --test tools/d2013-semantic-register-repeat-review/*.test.mts

provider-exchange-repeat-review:
	node --test tools/d1950-provider-exchange-repeat-review/*.test.mts

provider-exchange-final-review:
	node --test tools/d2000-provider-exchange-final-review/*.test.mts

provider-exchange-fourth-review:
	node --test tools/d2032-provider-exchange-fourth-review/*.test.mts

provider-exchange-fresh-review:
	node --test tools/d2056-provider-exchange-fresh-review/*.test.mts

provider-exchange-author-repair:
	node --test tools/d2056-provider-exchange-author-repair/*.test.mts

provider-exchange-second-fresh-review:
	node --test tools/d2184-provider-exchange-second-fresh-review/*.test.mts

.PHONY: provider-exchange-second-author-repair
.PHONY: provider-protocol-author-repair
provider-exchange-second-author-repair:
	node --test tools/d2184-provider-exchange-second-author-repair/*.test.mjs

.PHONY: provider-health-author-repair
provider-health-author-repair:
	node --test tools/d1910-provider-health-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d1910-provider-health-author-repair/tsconfig.contract.json --noEmit

.PHONY: provider-health-cut-contract
provider-health-cut-contract:
	node --test tools/d3059-provider-health-cut-contract/contract.test.mjs

.PHONY: provider-health-second-fresh-review
provider-health-second-fresh-review:
	node --test tools/d2412-provider-health-second-fresh-review/contract.test.mjs

.PHONY: provider-health-third-author-repair provider-health-fourth-fresh-review provider-health-fourth-author-repair provider-health-fifth-fresh-review provider-health-fifth-author-repair
provider-health-third-author-repair: provider-health-author-repair
	node --test tools/d2412-provider-health-third-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2412-provider-health-third-author-repair/tsconfig.json

provider-health-fourth-fresh-review: provider-health-third-author-repair
	node --test tools/d2575-provider-health-fourth-fresh-review/contract.test.mjs

provider-health-fourth-author-repair: provider-health-third-author-repair
	./node_modules/.bin/vitest run --config tools/d2575-provider-health-fourth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2575-provider-health-fourth-author-repair/tsconfig.json

provider-health-fifth-fresh-review: provider-health-fourth-author-repair
	./node_modules/.bin/vitest run --config tools/d2753-provider-health-fifth-fresh-review/vitest.config.ts --reporter=verbose

provider-health-fifth-author-repair: provider-health-fifth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2753-provider-health-fifth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2753-provider-health-fifth-author-repair/tsconfig.json

candidate-packet-contract:
	node --test tools/d1900-candidate-packet-amendment-harness/*.test.mts
	./node_modules/.bin/tsc -p tools/d1900-candidate-packet-amendment-harness/tsconfig.contract.json --noEmit

candidate-packet-repeat-review:
	node --test tools/d1958-candidate-packet-repeat-review/*.test.mts

candidate-packet-final-review:
	node --test tools/d1977-candidate-packet-final-review/*.test.mts

candidate-packet-fresh-review:
	node --test tools/d2097-candidate-packet-fresh-review/contract.test.mjs

candidate-packet-second-author-repair:
	node --test tools/d2097-candidate-packet-second-author-repair/contract.test.mjs

.PHONY: candidate-packet-second-fresh-review
candidate-packet-second-fresh-review:
	node --test tools/d2198-candidate-packet-second-fresh-review/contract.test.mjs

.PHONY: candidate-packet-third-author-repair
candidate-packet-third-author-repair:
	node --test tools/d2198-candidate-packet-third-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2198-candidate-packet-third-author-repair/tsconfig.contract.json --noEmit

.PHONY: candidate-packet-third-fresh-review
candidate-packet-third-fresh-review:
	node --test tools/d2329-candidate-packet-third-fresh-review/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2329-candidate-packet-third-fresh-review/tsconfig.contract.json --noEmit

.PHONY: candidate-packet-fourth-author-repair
candidate-packet-fourth-author-repair:
	node --test tools/d2329-candidate-packet-fourth-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2329-candidate-packet-fourth-author-repair/tsconfig.contract.json --noEmit

.PHONY: candidate-packet-fourth-fresh-review
candidate-packet-fourth-fresh-review:
	node --test tools/d2389-candidate-packet-fourth-fresh-review/contract.test.mjs

.PHONY: candidate-packet-fifth-author-repair candidate-packet-fifth-fresh-review candidate-packet-d2428-measurement candidate-packet-sixth-author-repair candidate-packet-sixth-fresh-review candidate-packet-seventh-author-repair candidate-packet-eighth-fresh-review candidate-packet-eighth-author-repair candidate-packet-ninth-fresh-review candidate-packet-tenth-author-repair candidate-packet-eleventh-fresh-review candidate-packet-eleventh-author-repair candidate-packet-twelfth-fresh-review candidate-packet-twelfth-author-repair semantic-collectors-promotion-third-fresh-review semantic-collectors-promotion-third-author-repair semantic-collectors-promotion-fourth-fresh-review semantic-collectors-promotion-fourth-author-repair semantic-collectors-promotion-thirteenth-author-repair semantic-collectors-promotion-fourteenth-fresh-review semantic-collectors-promotion-fourteenth-author-repair
candidate-packet-fifth-author-repair:
	node --test tools/d2389-candidate-packet-fifth-author-repair/contract.test.mjs

candidate-packet-fifth-fresh-review:
	node --test tools/d2428-candidate-packet-fifth-fresh-review/contract.test.mjs

candidate-packet-d2428-measurement:
	./node_modules/.bin/vitest run --config tools/d2428-candidate-packet-sixth-author-repair/vitest.measurement.config.ts --reporter=verbose

candidate-packet-sixth-author-repair:
	node --test tools/d2428-candidate-packet-sixth-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2428-candidate-packet-sixth-author-repair/tsconfig.contract.json --noEmit

candidate-packet-sixth-fresh-review: candidate-packet-sixth-author-repair
	node --test tools/d2625-candidate-packet-sixth-fresh-review/contract.test.mjs

candidate-packet-seventh-author-repair: candidate-packet-sixth-author-repair
	node --test tools/d2625-candidate-packet-seventh-author-repair/contract.test.mjs

candidate-packet-eighth-fresh-review: candidate-packet-seventh-author-repair
	node --test tools/d2655-candidate-packet-eighth-fresh-review/contract.test.mjs

candidate-packet-eighth-author-repair: candidate-packet-eighth-fresh-review
	node --test tools/d2655-candidate-packet-eighth-author-repair/contract.test.mjs

candidate-packet-ninth-fresh-review: candidate-packet-eighth-author-repair
	node --test tools/d2678-candidate-packet-ninth-fresh-review/contract.test.mjs

candidate-packet-tenth-author-repair: candidate-packet-ninth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2678-candidate-packet-tenth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2678-candidate-packet-tenth-author-repair/tsconfig.json --noEmit

candidate-packet-eleventh-fresh-review: candidate-packet-tenth-author-repair
	./node_modules/.bin/vitest run --config tools/d2860-candidate-packet-eleventh-fresh-review/vitest.config.ts --reporter=verbose

candidate-packet-eleventh-author-repair: candidate-packet-eleventh-fresh-review
	./node_modules/.bin/vitest run --config tools/d2860-candidate-packet-eleventh-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2860-candidate-packet-eleventh-author-repair/tsconfig.json --noEmit

candidate-packet-twelfth-fresh-review: candidate-packet-eleventh-author-repair
	./node_modules/.bin/vitest run --config tools/d2885-candidate-packet-twelfth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2885-candidate-packet-twelfth-fresh-review/tsconfig.json --noEmit

candidate-packet-twelfth-author-repair: candidate-packet-twelfth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2885-candidate-packet-twelfth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2885-candidate-packet-twelfth-author-repair/tsconfig.json --noEmit

.PHONY: candidate-packet-thirteenth-fresh-review candidate-packet-thirteenth-author-repair candidate-packet-fourteenth-fresh-review
candidate-packet-thirteenth-fresh-review: candidate-packet-twelfth-author-repair
	./node_modules/.bin/vitest run --config tools/d2934-candidate-packet-thirteenth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2934-candidate-packet-thirteenth-fresh-review/tsconfig.json --noEmit

candidate-packet-thirteenth-author-repair: candidate-packet-thirteenth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2934-candidate-packet-thirteenth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2934-candidate-packet-thirteenth-author-repair/tsconfig.json --noEmit

# Retired from verify-governance 2026-09-06 by the cut of rfc/shared-candidate-evidence-packet.md
# ([[D3034]]'s changed unit of delivery, second application). The chain from the sixth author repair
# to the fourteenth fresh review greps the RFC's prose for the service factory, the collector result
# algebra and the retained-graph walker — the material the cut routed to
# rfc/candidate-population-service.md and rfc/candidate-collector-registry.md. Holding the gate would
# require un-cutting the document, which is the shadow-implementation loop being repaired. The
# targets remain runnable as historical evidence; the acceptance authority is now owner acceptance of
# the bounded contract and, after that, the implementation itself. Every arm that asserts a property
# the cut document still carries was kept green and is verified by
# `make candidate-packet-seventh-author-repair`.
candidate-packet-fourteenth-fresh-review: candidate-packet-thirteenth-author-repair
	./node_modules/.bin/vitest run --config tools/d3009-candidate-packet-fourteenth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d3009-candidate-packet-fourteenth-fresh-review/tsconfig.json --noEmit

semantic-collectors-promotion-third-fresh-review:
	node --test tools/d2468-semantic-collectors-promotion-third-fresh-review/*.test.mjs

semantic-collectors-promotion-fourth-fresh-review:
	node --test tools/d2521-semantic-collectors-promotion-fourth-fresh-review/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2521-semantic-collectors-promotion-fourth-fresh-review/tsconfig.contract.json

semantic-collectors-promotion-fourth-author-repair:
	node --test tools/d2521-semantic-collectors-promotion-fourth-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2521-semantic-collectors-promotion-fourth-author-repair/tsconfig.contract.json

semantic-collectors-promotion-third-author-repair:
	node --test tools/d2469-semantic-collectors-promotion-third-author-repair/*.test.mjs
	./node_modules/.bin/tsc -p tools/d2469-semantic-collectors-promotion-third-author-repair/tsconfig.contract.json --noEmit

review-evidence-author-contract:
	node --test tools/d1969-review-evidence-author-harness/*.test.mts

.PHONY: review-evidence-fresh-review
review-evidence-fresh-review: review-evidence-author-contract
	node --test tools/d2631-review-evidence-fresh-review/contract.test.mjs

.PHONY: review-evidence-second-author-repair
review-evidence-second-author-repair: review-evidence-author-contract
	node --test tools/d2631-review-evidence-second-author-repair/contract.test.mjs

.PHONY: review-evidence-second-fresh-review review-evidence-third-author-repair
review-evidence-second-fresh-review: review-evidence-author-contract
	node --test tools/d2685-review-evidence-second-fresh-review/contract.test.mjs

review-evidence-third-author-repair: review-evidence-second-author-repair
	node --test tools/d2685-review-evidence-third-author-repair/contract.test.mjs

bot-policy-independent-review:
	node --test tools/d1970-bot-policy-independent-review/*.test.mts

bot-policy-author-contract:
	./node_modules/.bin/vitest run --config tools/d1970-bot-policy-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d1970-bot-policy-author-repair/tsconfig.contract.json --noEmit

bot-policy-fresh-review:
	node --test tools/d2087-bot-policy-fresh-review/contract.test.mjs

.PHONY: bot-policy-second-fresh-review
bot-policy-second-fresh-review:
	node --test tools/d2219-bot-policy-second-fresh-review/contract.test.mjs

.PHONY: bot-policy-third-fresh-review bot-policy-fourth-author-repair bot-policy-fifth-fresh-review bot-policy-fifth-author-repair
bot-policy-third-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2407-bot-policy-third-fresh-review/vitest.config.ts --reporter=verbose

bot-policy-fourth-author-repair: provider-health-cut-contract bot-policy-author-contract
	./node_modules/.bin/vitest run --config tools/d2407-bot-policy-fourth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2407-bot-policy-fourth-author-repair/tsconfig.json --noEmit

bot-policy-fifth-fresh-review: bot-policy-fourth-author-repair
	./node_modules/.bin/vitest run --config tools/d3025-bot-policy-fifth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d3025-bot-policy-fifth-fresh-review/tsconfig.json --noEmit

# Current author checkpoint. It deliberately bypasses the historical provider-health
# review chain: D3030/D3031 remain dependency-blocked rather than locally simulated.
bot-policy-fifth-author-repair: bot-policy-author-contract
	./node_modules/.bin/vitest run --config tools/d2407-bot-policy-fourth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2407-bot-policy-fourth-author-repair/tsconfig.json --noEmit

bot-trait-screen-contract:
	./node_modules/.bin/vitest run --config tools/d2237-bot-trait-screen/vitest.config.ts --reporter=verbose

bot-trait-screen:
	docker compose --profile engines build maia
	bash tools/d2237-bot-trait-screen/capture-and-measure.sh

bot-endgame-trait-screen-contract:
	./node_modules/.bin/vitest run --config tools/d2902-bot-endgame-trait-screen/vitest.config.ts --reporter=verbose

bot-endgame-trait-screen:
	docker compose --profile engines build maia
	bash tools/d2902-bot-endgame-trait-screen/capture-and-measure.sh

bot-human-endgame-reference-contract:
	./node_modules/.bin/vitest run --config tools/d2903-human-endgame-reference/vitest.config.ts --reporter=verbose

bot-human-endgame-reference-population:
	bash tools/d2903-human-endgame-reference/capture-population.sh

bot-human-endgame-reference:
	docker compose --profile engines build maia
	bash tools/d2903-human-endgame-reference/capture-and-measure.sh

bot-human-endgame-reference-report:
	node tools/d2903-human-endgame-reference/render-result.mjs planning/bot-roster/d2903-human-endgame-reference-results.json planning/bot-roster/d2903-human-endgame-reference-results.md

pack-capability-closure:
	./node_modules/.bin/vitest run --config tools/d1620-pack-capability-closure/vitest.config.ts

pack-capability-repeat-review:
	node --test tools/d1982-pack-capability-repeat-review/*.test.mts

pack-capability-fresh-review:
	node --test tools/d2050-pack-capability-fresh-review/*.test.mts

pack-capability-second-fresh-review:
	node --test tools/d2070-pack-capability-second-fresh-review/*.test.mjs

pack-capability-third-fresh-review:
	node --test tools/d2152-pack-capability-third-fresh-review/*.test.mjs

pack-capability-fourth-fresh-review:
	node --test tools/d2334-pack-capability-fourth-fresh-review/*.test.mjs

.PHONY: pack-capability-fifth-fresh-review
pack-capability-fifth-fresh-review:
	node --test tools/d2429-pack-capability-fifth-fresh-review/contract.test.mjs

.PHONY: pack-capability-sixth-author-repair
pack-capability-sixth-author-repair:
	node --test tools/d2429-pack-capability-sixth-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2429-pack-capability-sixth-author-repair/tsconfig.contract.json --noEmit

.PHONY: pack-capability-sixth-fresh-review
pack-capability-sixth-fresh-review:
	node --test tools/d2509-pack-capability-sixth-fresh-review/contract.test.mjs

.PHONY: pack-capability-seventh-author-repair
pack-capability-seventh-author-repair:
	node --test tools/d2509-pack-capability-seventh-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2509-pack-capability-seventh-author-repair/tsconfig.contract.json --noEmit

.PHONY: pack-capability-seventh-fresh-review
pack-capability-seventh-fresh-review:
	node --test tools/d2518-pack-capability-seventh-fresh-review/contract.test.mjs

.PHONY: pack-capability-eighth-author-repair
pack-capability-eighth-author-repair:
	node --test tools/d2518-pack-capability-eighth-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2518-pack-capability-eighth-author-repair/tsconfig.contract.json --noEmit

.PHONY: pack-capability-eighth-fresh-review
pack-capability-eighth-fresh-review:
	node --test tools/d2524-pack-capability-eighth-fresh-review/contract.test.mjs

.PHONY: pack-capability-ninth-author-repair
pack-capability-ninth-author-repair:
	node --test tools/d2524-pack-capability-ninth-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2524-pack-capability-ninth-author-repair/tsconfig.contract.json --noEmit

.PHONY: pack-capability-ninth-fresh-review
pack-capability-ninth-fresh-review:
	node --test tools/d2542-pack-capability-ninth-fresh-review/contract.test.mjs

.PHONY: pack-capability-tenth-author-repair
pack-capability-tenth-author-repair:
	node --test tools/d2542-pack-capability-tenth-author-repair/contract.test.mjs

.PHONY: pack-capability-tenth-fresh-review
pack-capability-tenth-fresh-review:
	node --test tools/d2563-pack-capability-tenth-fresh-review/contract.test.mjs

.PHONY: pack-capability-eleventh-author-repair
pack-capability-eleventh-author-repair:
	node --test tools/d2563-pack-capability-eleventh-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2563-pack-capability-eleventh-author-repair/tsconfig.contract.json --noEmit

.PHONY: pack-capability-eleventh-fresh-review
pack-capability-eleventh-fresh-review:
	node --test tools/d2587-pack-capability-eleventh-fresh-review/contract.test.mjs

.PHONY: pack-capability-twelfth-author-repair pack-capability-twelfth-fresh-review pack-capability-thirteenth-author-repair pack-capability-thirteenth-fresh-review pack-capability-fourteenth-author-repair pack-capability-fifteenth-fresh-review pack-capability-fifteenth-author-repair
pack-capability-twelfth-author-repair: pack-capability-eleventh-author-repair
	node --test tools/d2587-pack-capability-twelfth-author-repair/contract.test.mjs

pack-capability-twelfth-fresh-review: pack-capability-twelfth-author-repair
	node --test tools/d2673-pack-capability-twelfth-fresh-review/contract.test.mjs

pack-capability-thirteenth-author-repair: pack-capability-twelfth-fresh-review
	node --test tools/d2673-pack-capability-thirteenth-author-repair/contract.test.mjs

pack-capability-thirteenth-fresh-review: pack-capability-thirteenth-author-repair
	node --test tools/d2742-pack-capability-thirteenth-fresh-review/review.test.mjs

pack-capability-fourteenth-author-repair: pack-capability-thirteenth-fresh-review
	node --test tools/d2742-pack-capability-fourteenth-author-repair/contract.test.mjs

pack-capability-fifteenth-fresh-review: pack-capability-fourteenth-author-repair
	node --test tools/d2771-pack-capability-fifteenth-fresh-review/review.test.mjs

pack-capability-fifteenth-author-repair: pack-capability-fifteenth-fresh-review
	node --test tools/d2771-pack-capability-fifteenth-author-repair/contract.test.mjs

.PHONY: pack-capability-sixteenth-fresh-review pack-capability-sixteenth-author-repair
pack-capability-sixteenth-fresh-review: pack-capability-fifteenth-author-repair
	node --test tools/d2802-pack-capability-sixteenth-fresh-review/review.test.mjs

pack-capability-sixteenth-author-repair: pack-capability-sixteenth-fresh-review
	node --test tools/d2802-pack-capability-sixteenth-author-repair/contract.test.mjs

.PHONY: pack-capability-seventeenth-fresh-review
pack-capability-seventeenth-fresh-review: pack-capability-sixteenth-author-repair
	node --test tools/d3002-pack-capability-seventeenth-fresh-review/review.test.mjs

.PHONY: pack-capability-cut-fresh-review
pack-capability-cut-fresh-review:
	node --test tools/d3120-pack-capability-cut-fresh-review/review.test.mjs

.PHONY: shared-resource-bootstrap-collision-core-author-contract shared-resource-bootstrap-collision-core-fresh-review shared-resource-bootstrap-collision-core-author-repair shared-resource-bootstrap-collision-core-second-author-repair shared-resource-bootstrap-seventh-fresh-review shared-resource-bootstrap-seventh-author-repair shared-resource-bootstrap-eighth-fresh-review shared-resource-bootstrap-eighth-author-repair shared-resource-bootstrap-ninth-fresh-review shared-resource-bootstrap-ninth-author-repair shared-resource-bootstrap-tenth-fresh-review shared-resource-bootstrap-tenth-author-repair
shared-resource-bootstrap-collision-core-author-contract:
	node --test tools/d3034-shared-resource-bootstrap-collision-core-author-contract/contract.test.mjs

shared-resource-bootstrap-collision-core-fresh-review: shared-resource-bootstrap-collision-core-author-contract
	node --test tools/d3116-shared-resource-bootstrap-collision-core-fresh-review/review.test.mjs

shared-resource-bootstrap-collision-core-author-repair: shared-resource-bootstrap-collision-core-fresh-review
	node --test tools/d3116-shared-resource-bootstrap-collision-core-author-repair/contract.test.mjs

shared-resource-bootstrap-collision-core-second-author-repair: shared-resource-bootstrap-collision-core-author-repair
	node --test tools/d3131-shared-resource-bootstrap-collision-core-author-repair/contract.test.mjs

shared-resource-bootstrap-seventh-fresh-review:
	node --test tools/d2593-shared-resource-bootstrap-seventh-fresh-review/contract.test.mjs

shared-resource-bootstrap-seventh-author-repair: shared-resource-bootstrap-sixth-author-repair
	node --test tools/d2593-shared-resource-bootstrap-seventh-author-repair/contract.test.mjs

shared-resource-bootstrap-eighth-fresh-review: shared-resource-bootstrap-seventh-author-repair
	node --test tools/d2645-shared-resource-bootstrap-eighth-fresh-review/contract.test.mjs

shared-resource-bootstrap-eighth-author-repair: shared-resource-bootstrap-eighth-fresh-review
	node --test tools/d2645-shared-resource-bootstrap-eighth-author-repair/contract.test.mjs

shared-resource-bootstrap-ninth-fresh-review: shared-resource-bootstrap-eighth-author-repair
	node --test tools/d2667-shared-resource-bootstrap-ninth-fresh-review/contract.test.mjs

shared-resource-bootstrap-ninth-author-repair: shared-resource-bootstrap-ninth-fresh-review
	node --test tools/d2667-shared-resource-bootstrap-ninth-author-repair/contract.test.mjs

shared-resource-bootstrap-tenth-fresh-review: shared-resource-bootstrap-ninth-author-repair
	node --test tools/d2701-shared-resource-bootstrap-tenth-fresh-review/contract.test.mjs

shared-resource-bootstrap-tenth-author-repair: shared-resource-bootstrap-tenth-fresh-review
	node --test tools/d2701-shared-resource-bootstrap-tenth-author-repair/contract.test.mjs

.PHONY: shared-resource-bootstrap-eleventh-fresh-review shared-resource-bootstrap-eleventh-author-repair
shared-resource-bootstrap-eleventh-fresh-review: shared-resource-bootstrap-tenth-author-repair
	node --test tools/d2795-shared-resource-bootstrap-eleventh-fresh-review/contract.test.mjs

shared-resource-bootstrap-eleventh-author-repair: shared-resource-bootstrap-eleventh-fresh-review
	node --test tools/d2795-shared-resource-bootstrap-eleventh-author-repair/contract.test.mjs

.PHONY: shared-resource-bootstrap-twelfth-fresh-review shared-resource-bootstrap-twelfth-author-repair shared-resource-bootstrap-thirteenth-fresh-review shared-resource-bootstrap-thirteenth-author-repair shared-resource-bootstrap-fourteenth-fresh-review shared-resource-bootstrap-fourteenth-author-repair shared-resource-bootstrap-fifteenth-fresh-review
shared-resource-bootstrap-twelfth-fresh-review: shared-resource-bootstrap-eleventh-author-repair
	node --test tools/d2828-shared-resource-bootstrap-twelfth-fresh-review/contract.test.mjs

shared-resource-bootstrap-twelfth-author-repair: shared-resource-bootstrap-twelfth-fresh-review
	node --test tools/d2828-shared-resource-bootstrap-twelfth-author-repair/contract.test.mjs

shared-resource-bootstrap-thirteenth-fresh-review: shared-resource-bootstrap-twelfth-author-repair
	node --test tools/d2843-shared-resource-bootstrap-thirteenth-fresh-review/review.test.mjs

shared-resource-bootstrap-thirteenth-author-repair: shared-resource-bootstrap-thirteenth-fresh-review
	node --test tools/d2843-shared-resource-bootstrap-thirteenth-author-repair/contract.test.mjs

shared-resource-bootstrap-fourteenth-fresh-review: shared-resource-bootstrap-thirteenth-author-repair
	node --test tools/d2854-shared-resource-bootstrap-fourteenth-fresh-review/review.test.mjs

shared-resource-bootstrap-fourteenth-author-repair: shared-resource-bootstrap-fourteenth-fresh-review
	node --test tools/d2854-shared-resource-bootstrap-fourteenth-author-repair/contract.test.mjs

shared-resource-bootstrap-fifteenth-fresh-review: shared-resource-bootstrap-fourteenth-author-repair
	node --test tools/shared-resource-bootstrap-fifteenth-fresh-review/review.test.mjs

.PHONY: semantic-collectors-promotion-fifth-fresh-review semantic-collectors-promotion-fifth-author-repair semantic-collectors-promotion-sixth-fresh-review semantic-collectors-promotion-sixth-author-repair semantic-collectors-promotion-seventh-fresh-review semantic-collectors-promotion-seventh-author-repair semantic-collectors-promotion-eighth-fresh-review semantic-collectors-promotion-eighth-author-repair semantic-collectors-promotion-ninth-fresh-review semantic-collectors-promotion-ninth-author-repair semantic-collectors-promotion-tenth-fresh-review semantic-collectors-promotion-tenth-author-repair semantic-collectors-promotion-eleventh-fresh-review semantic-collectors-promotion-eleventh-author-repair semantic-collectors-promotion-twelfth-fresh-review semantic-collectors-promotion-twelfth-author-repair semantic-collectors-promotion-thirteenth-fresh-review
semantic-collectors-promotion-fifth-fresh-review:
	node --test tools/d2548-semantic-collectors-promotion-fifth-fresh-review/contract.test.mjs

semantic-collectors-promotion-fifth-author-repair: semantic-collectors-promotion-author-repair semantic-collectors-promotion-second-author-repair semantic-collectors-promotion-third-author-repair semantic-collectors-promotion-fourth-author-repair
	node --test tools/d2548-semantic-collectors-promotion-fifth-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2548-semantic-collectors-promotion-fifth-author-repair/tsconfig.contract.json --noEmit

semantic-collectors-promotion-sixth-fresh-review:
	node --test tools/d2603-semantic-collectors-promotion-sixth-fresh-review/contract.test.mjs

semantic-collectors-promotion-sixth-author-repair: semantic-collectors-promotion-fifth-author-repair
	./node_modules/.bin/vitest run --config tools/d2603-semantic-collectors-promotion-sixth-author-repair/vitest.config.ts --reporter=verbose

semantic-collectors-promotion-seventh-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2650-semantic-collectors-promotion-seventh-fresh-review/vitest.config.ts --reporter=verbose

semantic-collectors-promotion-seventh-author-repair: semantic-collectors-promotion-sixth-author-repair semantic-collectors-promotion-seventh-fresh-review
	./node_modules/.bin/vitest run --config tools/d2650-semantic-collectors-promotion-seventh-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2650-semantic-collectors-promotion-seventh-author-repair/tsconfig.json --noEmit

semantic-collectors-promotion-eighth-fresh-review: semantic-collectors-promotion-seventh-author-repair
	./node_modules/.bin/vitest run --config tools/d2693-semantic-collectors-promotion-eighth-fresh-review/vitest.config.ts --reporter=verbose

semantic-collectors-promotion-eighth-author-repair: semantic-collectors-promotion-eighth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2693-semantic-collectors-promotion-eighth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2693-semantic-collectors-promotion-eighth-author-repair/tsconfig.json --noEmit

semantic-collectors-promotion-ninth-fresh-review: semantic-collectors-promotion-eighth-author-repair
	./node_modules/.bin/vitest run --config tools/d2748-semantic-collectors-promotion-ninth-fresh-review/vitest.config.ts --reporter=verbose

semantic-collectors-promotion-ninth-author-repair: semantic-collectors-promotion-ninth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2748-semantic-collectors-promotion-ninth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2748-semantic-collectors-promotion-ninth-author-repair/tsconfig.json --noEmit

semantic-collectors-promotion-tenth-fresh-review: semantic-collectors-promotion-ninth-author-repair
	./node_modules/.bin/vitest run --config tools/d2765-semantic-collectors-promotion-tenth-fresh-review/vitest.config.ts --reporter=verbose

semantic-collectors-promotion-tenth-author-repair: semantic-collectors-promotion-tenth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2765-semantic-collectors-promotion-tenth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2765-semantic-collectors-promotion-tenth-author-repair/tsconfig.json --noEmit

semantic-collectors-promotion-eleventh-fresh-review: semantic-collectors-promotion-tenth-author-repair
	./node_modules/.bin/vitest run --config tools/d2789-semantic-collectors-promotion-eleventh-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2789-semantic-collectors-promotion-eleventh-fresh-review/tsconfig.json --noEmit

semantic-collectors-promotion-eleventh-author-repair: semantic-collectors-promotion-eleventh-fresh-review
	./node_modules/.bin/vitest run --config tools/d2789-semantic-collectors-promotion-eleventh-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2789-semantic-collectors-promotion-eleventh-author-repair/tsconfig.json --noEmit

semantic-collectors-promotion-twelfth-fresh-review: semantic-collectors-promotion-eleventh-author-repair
	./node_modules/.bin/vitest run --config tools/d2835-semantic-collectors-promotion-twelfth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2835-semantic-collectors-promotion-twelfth-fresh-review/tsconfig.json --noEmit

semantic-collectors-promotion-twelfth-author-repair: semantic-collectors-promotion-twelfth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2835-semantic-collectors-promotion-twelfth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2835-semantic-collectors-promotion-twelfth-author-repair/tsconfig.json --noEmit

semantic-collectors-promotion-thirteenth-fresh-review: semantic-collectors-promotion-twelfth-author-repair
	./node_modules/.bin/vitest run --config tools/d2864-semantic-collectors-promotion-thirteenth-fresh-review/vitest.config.ts --reporter=verbose

semantic-collectors-promotion-thirteenth-author-repair: semantic-collectors-promotion-thirteenth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2864-semantic-collectors-promotion-thirteenth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2864-semantic-collectors-promotion-thirteenth-author-repair/tsconfig.json --noEmit

semantic-collectors-promotion-fourteenth-fresh-review: semantic-collectors-promotion-thirteenth-author-repair
	./node_modules/.bin/vitest run --config tools/d2892-semantic-collectors-promotion-fourteenth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2892-semantic-collectors-promotion-fourteenth-fresh-review/tsconfig.json --noEmit

semantic-collectors-promotion-fourteenth-author-repair: semantic-collectors-promotion-fourteenth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2892-semantic-collectors-promotion-fourteenth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2892-semantic-collectors-promotion-fourteenth-author-repair/tsconfig.json --noEmit

.PHONY: semantic-collectors-promotion-fifteenth-fresh-review semantic-collectors-promotion-fifteenth-author-repair semantic-collectors-promotion-sixteenth-fresh-review
semantic-collectors-promotion-fifteenth-fresh-review: semantic-collectors-promotion-fourteenth-author-repair
	./node_modules/.bin/vitest run --config tools/d2929-semantic-collectors-promotion-fifteenth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2929-semantic-collectors-promotion-fifteenth-fresh-review/tsconfig.json --noEmit

semantic-collectors-promotion-fifteenth-author-repair: semantic-collectors-promotion-fifteenth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2929-semantic-collectors-promotion-fifteenth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2929-semantic-collectors-promotion-fifteenth-author-repair/tsconfig.json --noEmit

semantic-collectors-promotion-sixteenth-fresh-review: semantic-collectors-promotion-fifteenth-author-repair
	./node_modules/.bin/vitest run --config tools/d3018-semantic-collectors-promotion-sixteenth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d3018-semantic-collectors-promotion-sixteenth-fresh-review/tsconfig.json --noEmit

.PHONY: semantic-collector-cut-contract
semantic-collector-cut-contract:
	node --test tools/d3069-semantic-collector-cut-contract/contract.test.mjs

.PHONY: semantic-collectors-deflection-authority-fresh-review
semantic-collectors-deflection-authority-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2536-deflection-check-authority-fresh-review/vitest.config.ts
	./node_modules/.bin/tsc -p tools/d2536-deflection-check-authority-fresh-review/tsconfig.json --noEmit

.PHONY: semantic-collectors-deflection-source-author-repair
semantic-collectors-deflection-source-author-repair:
	./node_modules/.bin/vitest run --config tools/d2552-deflection-check-source-author-repair/vitest.config.ts
	./node_modules/.bin/tsc -p tools/d2552-deflection-check-source-author-repair/tsconfig.json --noEmit

.PHONY: semantic-collectors-deflection-source-fresh-review
semantic-collectors-deflection-source-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2552-deflection-check-source-fresh-review/vitest.config.ts
	./node_modules/.bin/tsc -p tools/d2552-deflection-check-source-fresh-review/tsconfig.json --noEmit

.PHONY: semantic-collectors-deflection-seal-author-repair
semantic-collectors-deflection-seal-author-repair:
	./node_modules/.bin/vitest run --config tools/d2553-deflection-check-seal-author-repair/vitest.config.ts
	./node_modules/.bin/tsc -p tools/d2553-deflection-check-seal-author-repair/tsconfig.json --noEmit

.PHONY: semantic-collectors-deflection-seal-fresh-review
semantic-collectors-deflection-seal-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2553-deflection-check-seal-fresh-review/vitest.config.ts
	./node_modules/.bin/tsc -p tools/d2553-deflection-check-seal-fresh-review/tsconfig.json --noEmit

.PHONY: recorded-semantic-path-cost
recorded-semantic-path-cost:
	./node_modules/.bin/vitest run --config tools/d1930-recorded-path-cost-harness/vitest.config.ts

.PHONY: recorded-semantic-path-source
recorded-semantic-path-source:
	./node_modules/.bin/vitest run --config tools/d1931-recorded-path-source-harness/vitest.config.ts

pack-capability-author-repair:
	node tools/d2152-pack-capability-author-repair/contract.mjs
	node --test tools/d2334-pack-capability-fifth-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2334-pack-capability-fifth-author-repair/tsconfig.contract.json --noEmit

pack-capability-author-repair-update:
	node tools/d2152-pack-capability-author-repair/contract.mjs --update

evidence-presentation-third-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2157-evidence-presentation-third-fresh-review/vitest.config.ts

evidence-presentation-third-author-repair:
	./node_modules/.bin/vitest run --config tools/d2157-evidence-presentation-third-author-repair/vitest.config.ts --reporter=verbose

evidence-presentation-fourth-author-repair:
	./node_modules/.bin/vitest run --config tools/d2348-evidence-presentation-fourth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext tools/d1862-presentation-adapter-plan/lifecycle.typecheck.ts

evidence-presentation-fourth-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2348-evidence-presentation-fourth-fresh-review/vitest.config.ts --reporter=verbose

evidence-presentation-fifth-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2436-evidence-presentation-fifth-fresh-review/vitest.config.ts --reporter=verbose

.PHONY: evidence-presentation-fifth-author-repair evidence-presentation-sixth-fresh-review evidence-presentation-sixth-author-repair evidence-presentation-seventh-fresh-review
evidence-presentation-fifth-author-repair: evidence-presentation-author-contract evidence-presentation-second-author-repair evidence-presentation-third-author-repair evidence-presentation-fourth-author-repair
	./node_modules/.bin/vitest run --config tools/d2644-evidence-presentation-fifth-author-repair/vitest.config.ts --reporter=verbose

evidence-presentation-sixth-fresh-review: evidence-presentation-fifth-author-repair
	./node_modules/.bin/vitest run --config tools/d3035-evidence-presentation-sixth-fresh-review/vitest.config.ts --reporter=verbose

evidence-presentation-sixth-author-repair: evidence-presentation-sixth-fresh-review
	./node_modules/.bin/vitest run --config tools/d3035-evidence-presentation-sixth-author-repair/vitest.config.ts --reporter=verbose

evidence-presentation-seventh-fresh-review: evidence-presentation-sixth-author-repair
	./node_modules/.bin/vitest run --config tools/d3102-evidence-presentation-seventh-fresh-review/vitest.config.ts --reporter=verbose

review-evidence-fourth-fresh-review: review-evidence-third-author-repair
	node --test tools/d3109-review-evidence-fourth-fresh-review/contract.test.mjs

.PHONY: review-evidence-fourth-author-repair
review-evidence-fourth-author-repair: review-evidence-third-author-repair
	./node_modules/.bin/vitest run --config tools/d3109-review-evidence-fourth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d3109-review-evidence-fourth-author-repair/tsconfig.json

.PHONY: review-evidence-fifth-fresh-review
review-evidence-fifth-fresh-review: review-evidence-fourth-author-repair
	node --test tools/d3184-review-evidence-fifth-fresh-review/contract.test.mjs

.PHONY: review-evidence-fifth-author-repair
review-evidence-fifth-author-repair: review-evidence-fifth-fresh-review
	./node_modules/.bin/vitest run --config tools/d3184-review-evidence-fifth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d3184-review-evidence-fifth-author-repair/tsconfig.json

module-registration-second-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2164-module-registration-second-fresh-review/vitest.config.ts

.PHONY: module-registration-third-fresh-review module-registration-fourth-author-repair
module-registration-third-fresh-review:
	node --test tools/d2343-module-registration-third-fresh-review/*.test.mjs

module-registration-fourth-author-repair:
	node --test tools/d2343-module-registration-fourth-author-repair/*.test.mjs

.PHONY: module-registration-fourth-fresh-review
module-registration-fourth-fresh-review:
	node --test tools/d2398-module-registration-fourth-fresh-review/*.test.mjs

.PHONY: module-registration-fifth-author-repair
module-registration-fifth-author-repair:
	node --test tools/d2398-module-registration-fifth-author-repair/*.test.mjs

pack-capability-author-contract: pack-capability-closure pack-capability-repeat-review pack-capability-fresh-review pack-capability-second-fresh-review pack-capability-author-repair pack-capability-seventh-author-repair pack-capability-eighth-author-repair

theory-drill-author-contract:
	node --test tools/d1879-theory-drill-author-contract/*.test.mjs

bounded-target-contract:
	./node_modules/.bin/vitest run --config tools/d1652-bounded-target-repair-harness/vitest.config.ts
	./node_modules/.bin/tsc -p tools/d1652-bounded-target-repair-harness/tsconfig.contract.json --noEmit

bounded-target-census:
	./node_modules/.bin/vitest run --config tools/d1023-bounded-policy-harness/vitest.config.ts tools/d1023-bounded-policy-harness/exact-target.test.ts

bounded-target-repeat-review:
	./node_modules/.bin/vitest run --config tools/d1962-bounded-target-repeat-review/vitest.config.ts
	./node_modules/.bin/tsc -p tools/d1962-bounded-target-repeat-review/tsconfig.json --noEmit

bounded-target-final-review:
	node --test tools/d1993-bounded-target-final-review/*.test.mts

bounded-target-fresh-review:
	node --test tools/d2105-bounded-target-fresh-review/*.test.mjs

bounded-target-second-author-repair:
	node --test tools/d2105-bounded-target-second-author-repair/*.test.mjs

.PHONY: bounded-target-second-fresh-review
bounded-target-second-fresh-review:
	node --test tools/d2202-bounded-target-second-fresh-review/contract.test.mjs

bounded-target-third-author-repair:
	node --test tools/d2202-bounded-target-third-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2202-bounded-target-third-author-repair/tsconfig.contract.json --noEmit

.PHONY: bounded-target-third-fresh-review
.PHONY: bounded-target-fourth-author-repair bounded-target-fourth-fresh-review bounded-target-fifth-author-repair bounded-target-fifth-fresh-review
bounded-target-third-fresh-review:
	node --test tools/d2340-bounded-target-third-fresh-review/*.test.mjs

bounded-target-fourth-author-repair:
	node --test tools/d2340-bounded-target-fourth-author-repair/*.test.mjs
	./node_modules/.bin/tsc -p tools/d2202-bounded-target-third-author-repair/tsconfig.contract.json --noEmit

bounded-target-fourth-fresh-review: bounded-target-fourth-author-repair
	node --test tools/d2628-bounded-target-fourth-fresh-review/contract.test.mjs

bounded-target-fifth-author-repair: bounded-target-fourth-author-repair
	node --test tools/d2628-bounded-target-fifth-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2202-bounded-target-third-author-repair/tsconfig.contract.json --noEmit

bounded-target-fifth-fresh-review: bounded-target-fifth-author-repair
	./node_modules/.bin/vitest run --config tools/d3042-bounded-target-fifth-fresh-review/vitest.config.ts --reporter=verbose

.PHONY: bounded-target-sixth-author-repair
bounded-target-sixth-author-repair: bounded-target-fifth-fresh-review
	node --test tools/d3042-bounded-target-sixth-author-repair/contract.test.mjs

.PHONY: professional-closure-audit
professional-closure-audit:
	node --test tools/d2261-professional-closure-audit/contract.test.mjs

.PHONY: live-following-fresh-review
live-following-fresh-review:
	node --test tools/d2266-live-following-fresh-review/contract.test.mjs

.PHONY: live-sources-fresh-review
live-sources-fresh-review:
	node --test tools/d2277-live-sources-fresh-review/contract.test.mjs

.PHONY: live-sources-author-repair
live-sources-author-repair: live-sources-fresh-review
	node --test tools/d2277-live-sources-author-repair/contract.test.mjs

.PHONY: recorded-clocks-fresh-review
recorded-clocks-fresh-review:
	node --test tools/d2286-recorded-clocks-fresh-review/contract.test.mjs

.PHONY: enforced-clocks-fresh-review
enforced-clocks-fresh-review:
	node --test tools/d2296-enforced-clocks-fresh-review/contract.test.mjs

.PHONY: native-ratings-fresh-review
native-ratings-fresh-review:
	node --test tools/d2308-native-ratings-fresh-review/contract.test.mjs

.PHONY: rating-pool-research
rating-pool-research:
	./node_modules/.bin/vitest run --config tools/d2323-rating-pool-research/vitest.config.ts
	./node_modules/.bin/esbuild tools/d2323-rating-pool-research/report.ts --bundle --platform=node --format=esm --outfile=/tmp/tabiya-rating-pool-report.mjs
	node /tmp/tabiya-rating-pool-report.mjs

build:
	pnpm build

verify-software: typecheck test-software test-performance schema-check evidence-manifest-check evidence-value-authority semantic-evidence-check candidate-packet-projections-check opening-catalogue-check account-data-lifecycle-check learner-rating-bracket-check learner-rating-isolation-check

verify-governance: register-check shared-resource-catalogue status-parity work-index work-state work-item-check roadmap-check intent-parity test-tier-check docs-check staged-process-contracts-test semantic-collector-cut-contract

# Draft-RFC evidence remains executable, but it is not a release gate. These targets include
# historical source images, author models, and counterexamples whose job is to inform an RFC review;
# they do not establish repository, product, or release correctness. Run the relevant narrow target
# while editing an RFC, or this aggregate when intentionally auditing the whole active RFC portfolio.
verify-rfc-evidence: evidence-value-authority-author-contract evidence-value-authority-route-map concept-registry-author-repair concept-registry-second-author-repair concept-registry-third-fresh-review concept-registry-third-author-repair concept-registry-fourth-fresh-review concept-registry-fourth-author-repair concept-registry-fifth-author-repair concept-registry-sixth-fresh-review longitudinal-store-tenth-fresh-review storage-backup-fourth-author-repair storage-backup-fifth-fresh-review safe-deployment-third-author-repair safe-deployment-fourth-fresh-review campaign-two-horizon-sixth-author-repair campaign-two-horizon-seventh-fresh-review pack-capability-seventeenth-fresh-review pack-capability-cut-fresh-review graduation-clearance-author-repair semantic-collector-cut-contract bounded-target-fifth-fresh-review provider-health-cut-contract provider-protocol-cut-contract live-sources-author-repair review-evidence-fourth-fresh-review review-evidence-fourth-author-repair review-evidence-fifth-fresh-review evidence-presentation-seventh-fresh-review bot-policy-fifth-author-repair bot-calibration-verdict-contract bot-roster-author-repair bot-trait-screen-contract bot-endgame-trait-screen-contract bot-human-endgame-reference-contract bounded-target-sixth-author-repair module-discharge-coverage-contract wave-c-module-amendment
verify-rfc-evidence: semantic-search-stockfish-check semantic-search-stockfish-child-beam semantic-search-stockfish-coherent-impact-check semantic-search-maia-new-child-check semantic-search-coherent-first-reply-check semantic-search-coherent-deeper-supplement-check semantic-search-coherent-deeper-union-check semantic-search-coherent-semantic-source-union-check semantic-search-coherent-exact-trigger-check semantic-search-coherent-frontier-target-check semantic-search-coherent-frontier-contrast-check semantic-search-coherent-relation-event-check semantic-search-coherent-semantic-reserve-check semantic-search-coherent-local-contrast-check semantic-search-coherent-destination-reply-check semantic-search-coherent-bounded-targets-check semantic-search-coherent-bounded-contrast-check semantic-search-coherent-event-reach-check semantic-search-coherent-event-policy-check semantic-search-maia-check semantic-search-maia-child-prefix semantic-search-maia-direct-frontier semantic-search-maia-horizon4-path-check semantic-search-root-frame semantic-search-exact-replies semantic-search-fork-controls semantic-search-bishop-pressure semantic-search-target-register semantic-search-target-comparison-frame semantic-search-coherent-target-frame-check semantic-search-material-immediate semantic-search-destination-immediate semantic-search-destination-reply-witness semantic-search-semantic-reserve semantic-search-relation-event-reserve semantic-search-local-rank-concordance semantic-search-event-policy-relevance semantic-search-horizon4-frontier semantic-search-stockfish-horizon4-smoke-check semantic-search-stockfish-horizon4-check semantic-search-provider-line-arm semantic-search-exact-arm-forcing

.PHONY: feedback-delivery-measurement feedback-binding-audit capability-watch-check
feedback-delivery-measurement:
	UPDATE_FEEDBACK_DELIVERY="$(UPDATE)" ./node_modules/.bin/vitest run --config tools/feedback-delivery-harness/vitest.config.ts

feedback-binding-audit:
	./node_modules/.bin/vitest run --config tools/feedback-binding-wave/vitest.config.ts

capability-watch-check:
	$(CI_NODE) tools/capability-watch-harness/check.mjs design/research/capability-watch.json planning/platform-alignment/capability-watch/results.json

verify-content: test-content graduation-clearance-corpus-check

verify: verify-software verify-governance verify-content
verify: export ENGINES_REQUIRED := 1

verify-awake: staged-process-contracts
	@if command -v caffeinate >/dev/null 2>&1; then \
		exec caffeinate -i $(MAKE) verify; \
	else \
		exec $(MAKE) verify; \
	fi

.PHONY: runtime-distribution-fresh-review
runtime-distribution-fresh-review:
	node --test tools/d2206-runtime-distribution-fresh-review/contract.test.mjs

.PHONY: runtime-distribution-author-repair
runtime-distribution-author-repair:
	node --test tools/d2206-runtime-distribution-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2206-runtime-distribution-author-repair/tsconfig.contract.json --noEmit

.PHONY: storage-backup-fresh-review
storage-backup-fresh-review:
	node --test tools/d2210-storage-backup-fresh-review/contract.test.mjs

.PHONY: storage-backup-author-repair
storage-backup-author-repair:
	node --test tools/d2210-storage-backup-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2210-storage-backup-author-repair/tsconfig.contract.json --noEmit

.PHONY: safe-deployment-fresh-review
safe-deployment-fresh-review:
	node --test tools/d2214-safe-deployment-fresh-review/contract.test.mjs

.PHONY: safe-deployment-author-repair
safe-deployment-author-repair:
	node --test tools/d2214-safe-deployment-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2214-safe-deployment-author-repair/tsconfig.contract.json --noEmit

.PHONY: safe-deployment-second-fresh-review
safe-deployment-second-fresh-review: safe-deployment-author-repair
	node --test tools/d2614-safe-deployment-second-fresh-review/contract.test.mjs

.PHONY: safe-deployment-second-author-repair
safe-deployment-second-author-repair: safe-deployment-author-repair
	./node_modules/.bin/vitest run --config tools/d2614-safe-deployment-second-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2614-safe-deployment-second-author-repair/tsconfig.json

.PHONY: safe-deployment-third-fresh-review
safe-deployment-third-fresh-review: safe-deployment-second-author-repair
	./node_modules/.bin/vitest run --config tools/d2730-safe-deployment-third-fresh-review/vitest.config.ts --reporter=verbose

.PHONY: safe-deployment-third-author-repair
safe-deployment-third-author-repair: safe-deployment-second-author-repair
	./node_modules/.bin/vitest run --config tools/d2730-safe-deployment-third-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2730-safe-deployment-third-author-repair/tsconfig.json

.PHONY: safe-deployment-fourth-fresh-review
safe-deployment-fourth-fresh-review: safe-deployment-third-author-repair
	./node_modules/.bin/vitest run --config tools/d2978-safe-deployment-fourth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2978-safe-deployment-fourth-fresh-review/tsconfig.json

.PHONY: campaign-two-horizon-seventh-fresh-review
campaign-two-horizon-seventh-fresh-review: campaign-two-horizon-sixth-author-repair
	./node_modules/.bin/vitest run --config tools/d2986-campaign-seventh-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2986-campaign-seventh-fresh-review/tsconfig.json

.PHONY: shared-resource-bootstrap-author-contract shared-resource-bootstrap-fresh-review shared-resource-bootstrap-author-repair shared-resource-bootstrap-second-fresh-review shared-resource-bootstrap-second-author-repair shared-register-reconciliation-author-repair shared-resource-bootstrap-third-fresh-review shared-resource-bootstrap-third-author-repair shared-resource-bootstrap-fourth-author-repair shared-resource-bootstrap-fourth-fresh-review shared-resource-bootstrap-fifth-author-repair shared-resource-bootstrap-sixth-fresh-review shared-resource-bootstrap-sixth-author-repair
shared-resource-bootstrap-author-contract:
	node --test tools/d2363-shared-resource-bootstrap-author-contract/contract.test.mjs

shared-resource-bootstrap-fresh-review:
	node --test tools/d2381-shared-resource-bootstrap-fresh-review/contract.test.mjs

shared-resource-bootstrap-author-repair:
	node --test tools/d2381-shared-resource-bootstrap-author-repair/contract.test.mjs

shared-resource-bootstrap-second-fresh-review:
	node --test tools/d2442-shared-resource-bootstrap-second-fresh-review/contract.test.mjs

shared-resource-bootstrap-second-author-repair:
	node --test tools/d2442-shared-resource-bootstrap-second-author-repair/contract.test.mjs

shared-register-reconciliation-author-repair:
	node --test tools/d2454-shared-register-reconciliation-author-repair/contract.test.mjs

shared-resource-bootstrap-third-fresh-review:
	node --test tools/d2488-shared-resource-bootstrap-third-fresh-review/contract.test.mjs

shared-resource-bootstrap-third-author-repair:
	node --test tools/d2488-shared-resource-bootstrap-third-author-repair/contract.test.mjs

shared-resource-bootstrap-fourth-author-repair:
	node --test tools/d2498-shared-resource-bootstrap-fourth-author-repair/contract.test.mjs

shared-resource-bootstrap-fourth-fresh-review:
	node --test tools/d2537-shared-resource-bootstrap-fourth-fresh-review/contract.test.mjs

shared-resource-bootstrap-fifth-author-repair:
	node --test tools/d2537-shared-resource-bootstrap-fifth-author-repair/contract.test.mjs

shared-resource-bootstrap-sixth-fresh-review:
	node --test tools/d2559-shared-resource-bootstrap-sixth-fresh-review/contract.test.mjs

shared-resource-bootstrap-sixth-author-repair:
	node --test tools/d2559-shared-resource-bootstrap-sixth-author-repair/contract.test.mjs

.PHONY: concept-registry-author-contract
concept-registry-author-contract:
	node --test tools/concept-registry-author-contract/contract.test.mjs

.PHONY: concept-registry-fresh-review
concept-registry-fresh-review:
	node --test tools/d2661-concept-registry-fresh-review/contract.test.mjs

.PHONY: concept-registry-author-repair
concept-registry-author-repair: concept-registry-author-contract
	node --test tools/d2661-concept-registry-author-repair/contract.test.mjs

.PHONY: concept-registry-second-fresh-review
concept-registry-second-fresh-review: concept-registry-author-repair
	node --test tools/d2661-concept-registry-fresh-review/contract.test.mjs
	node --test tools/d2709-concept-registry-second-fresh-review/contract.test.mjs

.PHONY: concept-registry-second-author-repair
concept-registry-second-author-repair: concept-registry-second-fresh-review
	node --test tools/d2709-concept-registry-second-author-repair/contract.test.mjs

.PHONY: concept-registry-third-fresh-review
concept-registry-third-fresh-review: concept-registry-second-author-repair
	node --test tools/d2878-concept-registry-third-fresh-review/review.test.mjs

.PHONY: concept-registry-third-author-repair
concept-registry-third-author-repair: concept-registry-third-fresh-review
	./node_modules/.bin/vitest run --config tools/d2878-concept-registry-third-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2878-concept-registry-third-author-repair/tsconfig.json

.PHONY: concept-registry-fourth-fresh-review concept-registry-fourth-author-repair
concept-registry-fourth-fresh-review: concept-registry-third-author-repair
	./node_modules/.bin/vitest run --config tools/d2904-concept-registry-fourth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2904-concept-registry-fourth-fresh-review/tsconfig.json

concept-registry-fourth-author-repair: concept-registry-fourth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2904-concept-registry-fourth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2904-concept-registry-fourth-author-repair/tsconfig.json

.PHONY: concept-registry-fifth-fresh-review
concept-registry-fifth-fresh-review: concept-registry-fourth-author-repair
	./node_modules/.bin/vitest run --config tools/d2923-concept-registry-fifth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2923-concept-registry-fifth-fresh-review/tsconfig.json

.PHONY: concept-registry-fifth-author-repair
concept-registry-fifth-author-repair: concept-registry-fifth-fresh-review
	./node_modules/.bin/vitest run --config tools/d2923-concept-registry-fifth-author-repair/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2923-concept-registry-fifth-author-repair/tsconfig.json

.PHONY: concept-registry-sixth-fresh-review
concept-registry-sixth-fresh-review: concept-registry-fifth-author-repair
	./node_modules/.bin/vitest run --config tools/d2960-concept-registry-sixth-fresh-review/vitest.config.ts --reporter=verbose
	./node_modules/.bin/tsc -p tools/d2960-concept-registry-sixth-fresh-review/tsconfig.json

.PHONY: campaign-catalogue-author-contract
campaign-catalogue-author-contract:
	node --test tools/campaign-catalogue-author-contract/contract.test.mjs

.PHONY: module-successor-alignment-contract
module-successor-alignment-contract:
	node --test tools/d2373-module-successor-alignment/contract.test.mjs

pack-check:
	@test -n "$(FILE)" || (echo "Usage: make pack-check FILE=<path-to-pack.json>" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/pack-check.ts --bundle --platform=node --format=esm --outfile=dist/pack-check.js
	node apps/server/dist/pack-check.js "$(abspath $(FILE))"

shape-check:
	@test -n "$(FILE)" || (echo "Usage: make shape-check FILE=<path-to-shape.json>" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/shape-check.ts --bundle --platform=node --format=esm --external:typescript --outfile=dist/shape-check.js
	node apps/server/dist/shape-check.js "$(FILE)" "$(PROBE)" "$(CORPUS)"

expression-census:
	pnpm --filter @chess-tabiya/server exec esbuild src/expression-census.ts --bundle --platform=node --format=esm --external:typescript --outfile=dist/expression-census.js
	node apps/server/dist/expression-census.js $(if $(FILE),--file "$(FILE)",) $(if $(EXPR),--expr "$(abspath $(EXPR))",) $(if $(CORPUS),--corpus "$(CORPUS)",) $(if $(WITNESSES),--witnesses "$(abspath $(WITNESSES))",) $(if $(OUT),--out "$(abspath $(OUT))",) $(if $(DEGENERATE),--degenerate "$(DEGENERATE)",) $(if $(DECLARATIONS),--declarations "$(DECLARATIONS)",)

pack-preview:
	@test -n "$(FILE)" || (echo "Usage: make pack-preview FILE=<path-to-pack.json>" >&2; exit 2)
	pnpm build
	node apps/server/dist/pack-check.js "$(abspath $(FILE))"
	@echo "Previewing $(abspath $(FILE)) at http://localhost:$${PORT:-3000} (reloads on file change)"
	NODE_ENV=development DRAFT_PACK_FILE="$(abspath $(FILE))" pnpm --filter @chess-tabiya/server preview

source-fetch:
	@test -n "$(SOURCE)" || (echo "Usage: make source-fetch SOURCE=<source-id> [OFFLINE=1]" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/source-fetch.ts --bundle --platform=node --format=esm --outfile=dist/source-fetch.js
	OFFLINE="$(OFFLINE)" node apps/server/dist/source-fetch.js "$(SOURCE)"

candidate-emit:
	@test -n "$(PIPELINE)" || (echo "Usage: make candidate-emit PIPELINE=<id> ARGS='...'" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/candidate-emit.ts --bundle --platform=node --format=esm --outfile=dist/candidate-emit.js
	node apps/server/dist/candidate-emit.js "$(PIPELINE)" $(ARGS)

candidate-attach:
	@test -n "$(DIR)$(FILE)" || (echo "Usage: make candidate-attach DIR=<candidate-directory> or FILE=<pack.json> PIPELINE=explorer ARGS='...'" >&2; exit 2)
	@test -n "$(PIPELINE)" || (echo "Usage: make candidate-attach DIR=<candidate-directory> PIPELINE=explorer ARGS='...'" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/candidate-attach.ts --bundle --platform=node --format=esm --outfile=dist/candidate-attach.js
	ATTACH_FILE="$(if $(FILE),1,0)" node apps/server/dist/candidate-attach.js "$(abspath $(if $(FILE),$(FILE),$(DIR)))" "$(PIPELINE)" $(ARGS)

sourcing-check:
	@test -n "$(DIR)$(FILE)" || (echo "Usage: make sourcing-check DIR=<candidate-directory> or FILE=<pack.json>" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/sourcing-check.ts --bundle --platform=node --format=esm --outfile=dist/sourcing-check.js
	node apps/server/dist/sourcing-check.js "$(abspath $(if $(FILE),$(FILE),$(DIR)))" $(if $(FILE),file,directory)

graduation-report:
	pnpm --filter @chess-tabiya/server exec esbuild src/graduation-report.ts --bundle --platform=node --format=esm --external:typescript --outfile=dist/graduation-report.js
	node apps/server/dist/graduation-report.js

graduation-report-update:
	pnpm --filter @chess-tabiya/server exec esbuild src/graduation-report.ts --bundle --platform=node --format=esm --external:typescript --outfile=dist/graduation-report.js
	UPDATE_ACCEPTED=1 node apps/server/dist/graduation-report.js

graduation-clear:
	@test -n "$(FILE)$(FILES)" || (echo "Usage: make graduation-clear FILE=<path-to-pack.json> or FILES='<paths...>' [CHECK=1]" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/graduation-clear-cli.ts --bundle --platform=node --format=esm --external:typescript --outfile=dist/graduation-clear.js
	CHECK="$(CHECK)" node apps/server/dist/graduation-clear.js $(if $(FILES),$(FILES),"$(abspath $(FILE))")

verify-draft:
	@test -n "$(FILE)$(FILES)" || (echo "Usage: make verify-draft FILE=<path-to-pack.json> [OFFLINE=1] or FILES='<paths...>'" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/verify-draft.ts --bundle --platform=node --format=esm --external:typescript --outfile=dist/verify-draft.js
	OFFLINE="$(OFFLINE)" node apps/server/dist/verify-draft.js $(if $(FILES),$(FILES),"$(abspath $(FILE))")

tablebase-walk:
	@test -n "$(FILE)$(FENS)" || (echo "Usage: make tablebase-walk FILE=<pack.json> [OUT=<report.json>] [OFFLINE=1] [ENUMERATE=decision|all|none] [MAX_QUERIES=N]" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/tablebase-walk.ts --bundle --platform=node --format=esm --outfile=dist/tablebase-walk.js
	OFFLINE="$(OFFLINE)" node apps/server/dist/tablebase-walk.js $(if $(FILE),--file "$(abspath $(FILE))",--fens "$(abspath $(FENS))") $(if $(OUT),--out "$(abspath $(OUT))",) $(if $(ENUMERATE),--enumerate "$(ENUMERATE)",) $(if $(MAX_QUERIES),--max-queries "$(MAX_QUERIES)",)

tablebase-census:
	@test -n "$(FILE)" || (echo "Usage: make tablebase-census FILE=<pack.json> [MAX_QUERIES=N]" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/tablebase-census.ts --bundle --platform=node --format=esm --outfile=dist/tablebase-census.js
	node apps/server/dist/tablebase-census.js --file "$(abspath $(FILE))" $(if $(MAX_QUERIES),--max-queries "$(MAX_QUERIES)",)

tablebase-census-contract:
	./node_modules/.bin/vitest run apps/server/src/sourcing/tablebase-census.test.ts apps/server/src/sourcing/tablebase-walk.test.ts apps/server/src/sourcing/verify-draft.test.ts

tablebase-census-check:
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/tablebase-census.ts --bundle --platform=node --format=esm --outfile=dist/tablebase-census.js
	node apps/server/dist/tablebase-census.js --check-root "$(abspath $(or $(ROOT),content/drafts))" $(if $(OUT),--out "$(abspath $(OUT))",)

engine-walk:
	@test -n "$(FILE)" || (echo "Usage: make engine-walk FILE=<pack.json> [OUT=<report.json>] [ENUMERATE=decision|none] [MAX_QUERIES=N]" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/engine-walk.ts --bundle --platform=node --format=esm --outfile=dist/engine-walk.js
	node apps/server/dist/engine-walk.js --file "$(abspath $(FILE))" $(if $(OUT),--out "$(abspath $(OUT))",) $(if $(ENUMERATE),--enumerate "$(ENUMERATE)",) $(if $(MAX_QUERIES),--max-queries "$(MAX_QUERIES)",)

up:
	docker compose up --build --detach

up-engines:
	ENGINE_MODE=maia docker compose --profile engines up --build --detach

down:
	docker compose --profile engines --profile devcontainer down

provider-protocol-author-repair:
	node --test tools/d2361-provider-protocol-author-repair/*.test.mjs
