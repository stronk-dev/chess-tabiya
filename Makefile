# Prefer the repository's pinned local toolchain when Homebrew supplies it. CI and
# other platforms continue to use PATH/SF_CMD, so callers never need shell prefixes.
ifneq ($(wildcard /opt/homebrew/opt/node@24/bin/node),)
export PATH := /opt/homebrew/opt/node@24/bin:$(PATH)
endif

CI_NODE := $(if $(wildcard /opt/homebrew/opt/node@24/bin/node),/opt/homebrew/opt/node@24/bin/node,node)

SF_CMD ?= $(if $(wildcard /opt/homebrew/bin/stockfish),/opt/homebrew/bin/stockfish,$(shell command -v stockfish 2>/dev/null))
export SF_CMD

.PHONY: foundation-source-author-audit foundation-source-author-repair tablebase-census-contract tablebase-census-check phase-classifier-census phase-band-census phase-source-composition-census phase-source-composition-author-contract

.PHONY: setup check typecheck test test-software test-performance test-content test-tier-check docs-check staged-process-contracts-test test-browser test-browser-smoke test-browser-content test-browser-matrix test-browser-ci ci-local schema-check register-check status-parity work-index work-state work-item-sync work-item-check roadmap-receipt roadmap-check roadmap-progress intent-parity evidence-manifest-check semantic-evidence-check foundation-closure-check foundation-source-author-contract semantic-validation-closure semantic-validation-matrix semantic-validation-author-contract module-evidence-assembly module-registration-author-contract module-registration-author-contract-update module-registration-fresh-review module-registration-second-fresh-review intent-presets-author-contract intent-presets-second-author-repair intent-presets-fresh-review intent-presets-second-fresh-review presentation-binding-census evidence-presentation-author-contract evidence-presentation-second-author-repair evidence-presentation-fresh-review evidence-presentation-third-fresh-review evidence-presentation-third-author-repair evidence-presentation-fourth-fresh-review evidence-presentation-fourth-author-repair evidence-presentation-fifth-fresh-review semantic-collectors-promotion-fresh-review semantic-collectors-promotion-author-repair semantic-collectors-promotion-second-fresh-review semantic-collectors-promotion-second-author-repair evidence-seal-audit evidence-value-authority-author-contract evidence-value-authority-route-map evidence-value-authority-route-map-update opening-catalogue opening-catalogue-check account-data-lifecycle-check learner-rating-bracket learner-rating-bracket-check learner-rating-isolation-check longitudinal-store-author-contract longitudinal-store-fresh-review longitudinal-store-cost campaign-two-horizon-author-contract campaign-two-horizon-fresh-review campaign-two-horizon-third-fresh-review theory-drill-author-contract graduation-plan graduation-plan-check graduation-clearance-contract tactical-collector-measurement breadth-collector-measurement human-divergence-measurement option-collapse-measurement dtz-census-measurement practical-resistance-measurement promotion-race-contract assistance-register-contract assistance-register-repeat-review assistance-register-final-review assistance-register-second-fresh-review assistance-register-second-author-repair assistance-register-third-fresh-review assistance-register-third-author-repair assistance-register-fifth-fresh-review assistance-register-fourth-author-repair semantic-register-contract semantic-register-repeat-review provider-exchange-contract provider-exchange-repeat-review provider-exchange-final-review provider-exchange-fourth-review provider-exchange-fresh-review provider-exchange-author-repair provider-exchange-second-fresh-review candidate-packet-contract candidate-packet-repeat-review candidate-packet-final-review candidate-packet-fresh-review candidate-packet-second-author-repair review-evidence-author-contract bot-policy-independent-review bot-policy-author-contract bot-policy-fresh-review pack-capability-author-contract pack-capability-author-repair pack-capability-author-repair-update pack-capability-closure pack-capability-repeat-review pack-capability-fresh-review pack-capability-second-fresh-review pack-capability-third-fresh-review pack-capability-fourth-fresh-review bounded-target-contract bounded-target-census bounded-target-repeat-review bounded-target-final-review bounded-target-fresh-review bounded-target-second-author-repair bounded-target-third-author-repair build verify-software verify-governance verify-content verify pack-check shape-check expression-census graduation-report graduation-report-update graduation-clear pack-preview source-fetch candidate-emit candidate-attach sourcing-check verify-draft tablebase-walk tablebase-census engine-walk up up-engines down

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

test-browser:
	pnpm test:browser

test-browser-smoke:
	./node_modules/.bin/playwright test --grep-invert "@content|@matrix"

test-browser-content:
	./node_modules/.bin/playwright test --grep "@content"

test-browser-matrix:
	./node_modules/.bin/playwright test --grep "@matrix"

test-browser-ci: test-browser-smoke test-browser-content test-browser-matrix

ci-local:
	$(CI_NODE) tools/ci-local.mjs

schema-check:
	pnpm schema:check

register-check:
	node --test tools/register-check.test.mjs
	node tools/register-check.mjs

status-parity:
	node --test tools/status-parity.test.mjs
	node tools/status-parity.mjs

work-index:
	node --test tools/work-index.test.mjs
	node tools/work-index.mjs

work-state:
	node --test tools/work-state.test.mjs
	node tools/work-state.mjs

work-item-sync:
	node tools/work-item-registry.mjs --sync

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

graduation-plan-check:
	node --test tools/graduation-clearance-plan.test.mjs
	node tools/graduation-clearance-plan.mjs >/dev/null

graduation-clearance-contract:
	./node_modules/.bin/vitest run apps/server/src/sourcing/graduation-clear.test.ts apps/server/src/graduation-report.test.ts

evidence-manifest-check:
	./node_modules/.bin/esbuild apps/server/src/evidence-manifest-check.ts --bundle --platform=node --format=esm --external:typescript --outfile=apps/server/dist/evidence-manifest-check.js
	node apps/server/dist/evidence-manifest-check.js

semantic-evidence-check:
	./node_modules/.bin/esbuild apps/server/src/semantic-evidence-check.ts --bundle --platform=node --format=esm --outfile=apps/server/dist/semantic-evidence-check.js
	node apps/server/dist/semantic-evidence-check.js

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
.PHONY: storage-backup-second-fresh-review
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

storage-backup-second-fresh-review:
	node --test tools/d2460-storage-backup-second-fresh-review/contract.test.mjs

module-evidence-assembly:
	./node_modules/.bin/vitest run --config tools/d1865-evidence-assembly-harness/vitest.config.ts --reporter=verbose

module-registration-author-contract-update:
	./node_modules/.bin/esbuild tools/d2120-module-registration-author-contract/generate.ts --bundle --platform=node --format=esm --outfile=/tmp/chess-tabiya-module-registration-generate.mjs
	node /tmp/chess-tabiya-module-registration-generate.mjs

module-registration-author-contract:
	./node_modules/.bin/vitest run --config tools/d2120-module-registration-author-contract/vitest.config.ts --reporter=verbose

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

.PHONY: longitudinal-store-third-fresh-review
longitudinal-store-third-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2402-longitudinal-third-fresh-review/vitest.config.ts --reporter=verbose

.PHONY: bot-roster-fresh-review
bot-roster-fresh-review:
	node --test tools/d2233-bot-roster-fresh-review/contract.test.mjs

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

.PHONY: campaign-boss-author-contract
campaign-boss-author-contract:
	node --test tools/campaign-boss-author-contract/contract.test.mjs

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

.PHONY: provider-health-second-fresh-review
provider-health-second-fresh-review:
	node --test tools/d2412-provider-health-second-fresh-review/contract.test.mjs

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

.PHONY: candidate-packet-fifth-author-repair candidate-packet-fifth-fresh-review candidate-packet-d2428-measurement candidate-packet-sixth-author-repair semantic-collectors-promotion-third-fresh-review
candidate-packet-fifth-author-repair:
	node --test tools/d2389-candidate-packet-fifth-author-repair/contract.test.mjs

candidate-packet-fifth-fresh-review:
	node --test tools/d2428-candidate-packet-fifth-fresh-review/contract.test.mjs

candidate-packet-d2428-measurement:
	./node_modules/.bin/vitest run --config tools/d2428-candidate-packet-sixth-author-repair/vitest.measurement.config.ts --reporter=verbose

candidate-packet-sixth-author-repair:
	node --test tools/d2428-candidate-packet-sixth-author-repair/contract.test.mjs
	./node_modules/.bin/tsc -p tools/d2428-candidate-packet-sixth-author-repair/tsconfig.contract.json --noEmit

semantic-collectors-promotion-third-fresh-review:
	node --test tools/d2468-semantic-collectors-promotion-third-fresh-review/*.test.mjs

review-evidence-author-contract:
	node --test tools/d1969-review-evidence-author-harness/*.test.mts

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

.PHONY: bot-policy-third-fresh-review
bot-policy-third-fresh-review:
	./node_modules/.bin/vitest run --config tools/d2407-bot-policy-third-fresh-review/vitest.config.ts --reporter=verbose

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

pack-capability-author-contract: pack-capability-closure pack-capability-repeat-review pack-capability-fresh-review pack-capability-second-fresh-review pack-capability-author-repair

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
.PHONY: bounded-target-fourth-author-repair
bounded-target-third-fresh-review:
	node --test tools/d2340-bounded-target-third-fresh-review/*.test.mjs

bounded-target-fourth-author-repair:
	node --test tools/d2340-bounded-target-fourth-author-repair/*.test.mjs
	./node_modules/.bin/tsc -p tools/d2202-bounded-target-third-author-repair/tsconfig.contract.json --noEmit

.PHONY: professional-closure-audit
professional-closure-audit:
	node --test tools/d2261-professional-closure-audit/contract.test.mjs

.PHONY: live-following-fresh-review
live-following-fresh-review:
	node --test tools/d2266-live-following-fresh-review/contract.test.mjs

.PHONY: live-sources-fresh-review
live-sources-fresh-review:
	node --test tools/d2277-live-sources-fresh-review/contract.test.mjs

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

verify-software: typecheck test-software test-performance schema-check evidence-manifest-check semantic-evidence-check opening-catalogue-check account-data-lifecycle-check learner-rating-bracket-check learner-rating-isolation-check

verify-governance: register-check status-parity work-index work-state work-item-check roadmap-check intent-parity evidence-value-authority-author-contract evidence-value-authority-route-map test-tier-check docs-check staged-process-contracts-test

verify-content: test-content

verify: verify-software verify-governance verify-content
verify: export ENGINES_REQUIRED := 1

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

.PHONY: shared-resource-bootstrap-author-contract shared-resource-bootstrap-fresh-review shared-resource-bootstrap-author-repair shared-resource-bootstrap-second-fresh-review shared-resource-bootstrap-second-author-repair shared-register-reconciliation-author-repair shared-resource-bootstrap-third-fresh-review
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

.PHONY: concept-registry-author-contract
concept-registry-author-contract:
	node --test tools/concept-registry-author-contract/contract.test.mjs

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
	pnpm --filter @chess-tabiya/server exec esbuild src/graduation-report.ts --bundle --platform=node --format=esm --outfile=dist/graduation-report.js
	node apps/server/dist/graduation-report.js

graduation-report-update:
	pnpm --filter @chess-tabiya/server exec esbuild src/graduation-report.ts --bundle --platform=node --format=esm --outfile=dist/graduation-report.js
	UPDATE_ACCEPTED=1 node apps/server/dist/graduation-report.js

graduation-clear:
	@test -n "$(FILE)" || (echo "Usage: make graduation-clear FILE=<path-to-pack.json> [CHECK=1]" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/graduation-clear.ts --bundle --platform=node --format=esm --external:typescript --outfile=dist/graduation-clear.js
	CHECK="$(CHECK)" node apps/server/dist/graduation-clear.js "$(abspath $(FILE))"

verify-draft:
	@test -n "$(FILE)" || (echo "Usage: make verify-draft FILE=<path-to-pack.json> [OFFLINE=1]" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/verify-draft.ts --bundle --platform=node --format=esm --outfile=dist/verify-draft.js
	OFFLINE="$(OFFLINE)" node apps/server/dist/verify-draft.js "$(abspath $(FILE))"

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
