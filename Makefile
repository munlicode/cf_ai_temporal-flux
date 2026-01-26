# Flux Monorepo Makefile

.PHONY: install dev build lint test clean deploy

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

lint:
	pnpm lint

test:
	pnpm test

clean:
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf apps/*/dist
	rm -rf apps/*/.wrangler

deploy:
	pnpm run build
	cd apps/worker && pnpm wrangler deploy
	cd apps/web && pnpm wrangler pages deploy dist
