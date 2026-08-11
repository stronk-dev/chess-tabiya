.PHONY: setup typecheck test test-browser schema-check build verify up up-engines down

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

up:
	docker compose up --build --detach

up-engines:
	ENGINE_MODE=maia docker compose --profile engines up --build --detach

down:
	docker compose --profile engines --profile devcontainer down
