.PHONY: setup typecheck test test-browser schema-check register-check status-parity graduation-plan graduation-plan-check build verify pack-check shape-check expression-census graduation-report pack-preview source-fetch candidate-emit candidate-attach sourcing-check verify-draft tablebase-walk engine-walk up up-engines down

setup:
	pnpm install --frozen-lockfile

typecheck:
	pnpm typecheck

test:
	pnpm test

test-browser:
	pnpm test:browser

schema-check:
	pnpm schema:check

register-check:
	node --test tools/register-check.test.mjs
	node tools/register-check.mjs

status-parity:
	node --test tools/status-parity.test.mjs
	node tools/status-parity.mjs

graduation-plan:
	node tools/graduation-clearance-plan.mjs

graduation-plan-check:
	node --test tools/graduation-clearance-plan.test.mjs
	node tools/graduation-clearance-plan.mjs >/dev/null

build:
	pnpm build

verify: typecheck test schema-check register-check status-parity graduation-plan-check

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
