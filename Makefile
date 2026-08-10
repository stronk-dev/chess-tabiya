.PHONY: setup typecheck test schema-check build verify

setup:
	pnpm install --frozen-lockfile

typecheck:
	pnpm typecheck

test:
	pnpm test

schema-check:
	pnpm schema:check

build:
	pnpm build

verify: typecheck test schema-check
