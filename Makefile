.PHONY: setup typecheck test test-browser schema-check build verify pack-check shape-check pack-preview source-fetch candidate-emit candidate-attach sourcing-check verify-draft up up-engines down

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

build:
	pnpm build

verify: typecheck test schema-check

pack-check:
	@test -n "$(FILE)" || (echo "Usage: make pack-check FILE=<path-to-pack.json>" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/pack-check.ts --bundle --platform=node --format=esm --outfile=dist/pack-check.js
	node apps/server/dist/pack-check.js "$(abspath $(FILE))"

shape-check:
	@test -n "$(FILE)" || (echo "Usage: make shape-check FILE=<path-to-shape.json>" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/shape-check.ts --bundle --platform=node --format=esm --outfile=dist/shape-check.js
	node apps/server/dist/shape-check.js "$(abspath $(FILE))"

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
	@test -n "$(DIR)" || (echo "Usage: make candidate-attach DIR=<candidate-directory> PIPELINE=explorer ARGS='...'" >&2; exit 2)
	@test -n "$(PIPELINE)" || (echo "Usage: make candidate-attach DIR=<candidate-directory> PIPELINE=explorer ARGS='...'" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/candidate-attach.ts --bundle --platform=node --format=esm --outfile=dist/candidate-attach.js
	node apps/server/dist/candidate-attach.js "$(abspath $(DIR))" "$(PIPELINE)" $(ARGS)

sourcing-check:
	@test -n "$(DIR)" || (echo "Usage: make sourcing-check DIR=<candidate-directory>" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/sourcing-check.ts --bundle --platform=node --format=esm --outfile=dist/sourcing-check.js
	node apps/server/dist/sourcing-check.js "$(abspath $(DIR))"

verify-draft:
	@test -n "$(FILE)" || (echo "Usage: make verify-draft FILE=<path-to-pack.json> [OFFLINE=1]" >&2; exit 2)
	pnpm --filter @chess-tabiya/server exec esbuild src/sourcing/verify-draft.ts --bundle --platform=node --format=esm --outfile=dist/verify-draft.js
	OFFLINE="$(OFFLINE)" node apps/server/dist/verify-draft.js "$(abspath $(FILE))"

up:
	docker compose up --build --detach

up-engines:
	ENGINE_MODE=maia docker compose --profile engines up --build --detach

down:
	docker compose --profile engines --profile devcontainer down
