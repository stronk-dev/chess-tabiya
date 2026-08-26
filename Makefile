# Prefer the repository's pinned local toolchain when Homebrew supplies it. CI and
# other platforms continue to use PATH/SF_CMD, so callers never need shell prefixes.
ifneq ($(wildcard /opt/homebrew/opt/node@24/bin/node),)
export PATH := /opt/homebrew/opt/node@24/bin:$(PATH)
endif

CI_NODE := $(if $(wildcard /opt/homebrew/opt/node@24/bin/node),/opt/homebrew/opt/node@24/bin/node,node)

SF_CMD ?= $(if $(wildcard /opt/homebrew/bin/stockfish),/opt/homebrew/bin/stockfish,$(shell command -v stockfish 2>/dev/null))
export SF_CMD

.PHONY: setup check typecheck test test-software test-performance test-content test-tier-check docs-check staged-process-contracts-test test-browser test-browser-smoke test-browser-content test-browser-matrix test-browser-ci ci-local schema-check register-check status-parity work-index work-item-check roadmap-receipt roadmap-check intent-parity evidence-manifest-check semantic-evidence-check opening-catalogue opening-catalogue-check account-data-lifecycle-check learner-rating-bracket learner-rating-bracket-check learner-rating-isolation-check graduation-plan graduation-plan-check tactical-collector-measurement breadth-collector-measurement build verify-software verify-governance verify-content verify pack-check shape-check expression-census graduation-report graduation-report-update graduation-clear pack-preview source-fetch candidate-emit candidate-attach sourcing-check verify-draft tablebase-walk engine-walk up up-engines down

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

work-item-check:
	node --test tools/work-item-registry.test.mjs
	node tools/work-item-registry.mjs

roadmap-check:
	node --test tools/roadmap-check.test.mjs
	node tools/roadmap-check.mjs
	node --test tools/roadmap-receipt.test.mjs
	node tools/roadmap-receipt.mjs

roadmap-receipt:
	node tools/roadmap-receipt.mjs --write

intent-parity:
	node --test tools/intent-parity-harness/audit.test.mjs

graduation-plan:
	node tools/graduation-clearance-plan.mjs

graduation-plan-check:
	node --test tools/graduation-clearance-plan.test.mjs
	node tools/graduation-clearance-plan.mjs >/dev/null

evidence-manifest-check:
	./node_modules/.bin/esbuild apps/server/src/evidence-manifest-check.ts --bundle --platform=node --format=esm --external:typescript --outfile=apps/server/dist/evidence-manifest-check.js
	node apps/server/dist/evidence-manifest-check.js

semantic-evidence-check:
	./node_modules/.bin/esbuild apps/server/src/semantic-evidence-check.ts --bundle --platform=node --format=esm --outfile=apps/server/dist/semantic-evidence-check.js
	node apps/server/dist/semantic-evidence-check.js

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

tactical-collector-measurement:
	./node_modules/.bin/vitest run --config tools/tactical-collector-measurement-harness/vitest.config.ts

breadth-collector-measurement:
	./node_modules/.bin/vitest run --config tools/breadth-collector-measurement-harness/vitest.config.ts

build:
	pnpm build

verify-software: typecheck test-software test-performance schema-check evidence-manifest-check semantic-evidence-check opening-catalogue-check account-data-lifecycle-check learner-rating-bracket-check learner-rating-isolation-check

verify-governance: register-check status-parity work-index work-item-check roadmap-check intent-parity test-tier-check docs-check staged-process-contracts-test

verify-content: test-content

verify: verify-software verify-governance verify-content
verify: export ENGINES_REQUIRED := 1

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
