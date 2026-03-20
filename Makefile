.PHONY: install local-up local-down dev dev-web dev-api dev-webhook dev-agent build lint test typecheck

install:
	pnpm install

local-up:
	docker compose -f docker-compose.local.yml up -d

local-down:
	docker compose -f docker-compose.local.yml down

dev:
	pnpm dev

dev-web:
	pnpm dev:web

dev-api:
	pnpm dev:api

dev-webhook:
	pnpm dev:webhook

dev-agent:
	pnpm dev:agent

build:
	pnpm build

lint:
	pnpm lint

test:
	pnpm test

typecheck:
	pnpm typecheck
