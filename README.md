# Night Manager

Night Manager is an AI-native software delivery operating system. This monorepo contains the MVP foundation for the web dashboard, API, GitHub webhook receiver, Python worker runtime, shared packages, role instructions, CI workflows, infrastructure skeleton, and database layer.

## Workspace Layout

- `apps/web-dashboard`: Next.js dashboard
- `apps/api`: NestJS API
- `apps/github-webhook`: NestJS GitHub webhook service
- `apps/agent-runtime`: Python worker runtime
- `packages/*`: shared TypeScript packages, including Prisma database tooling
- `roles/*`: markdown role instructions
- `infra/terraform/*`: infrastructure skeleton
- `.github/workflows/*`: CI workflows

## Local Development Setup

1. Install prerequisites:
   - Node.js 20+
   - pnpm 10+
   - Python 3.12+
   - Docker Desktop or Docker Engine with Compose
2. Create your local environment file:
   - PowerShell: `Copy-Item .env.example .env`
   - bash: `cp .env.example .env`
3. Install workspace dependencies:
   - `pnpm install`
4. Start local PostgreSQL and Redis:
   - `make local-up`
5. Generate the Prisma client:
   - `pnpm db:generate`
6. Apply the initial migration:
   - `pnpm db:migrate`
7. Seed sample data:
   - `pnpm db:seed`
8. Start all apps in development mode:
   - `make dev`

## Local Services

- Web dashboard: `http://localhost:3000`
- Web health: `http://localhost:3000/api/health`
- API health: `http://localhost:3001/health`
- GitHub webhook health: `http://localhost:3002/health`
- Worker health: `http://localhost:3003/health`

## Database Workflow

The MVP database layer uses Prisma consistently for schema definition, migration generation, seeding, and runtime access.

Useful commands:
- `pnpm db:generate`: generate the Prisma client
- `pnpm db:migrate`: create or apply local migrations in development
- `pnpm db:deploy`: apply checked-in migrations
- `pnpm db:seed`: load the sample organization, team, module, workflow, role profile, and ticket

The initial checked-in migration lives in `packages/database/prisma/migrations`.

## Environment Variables

All local services load from the root `.env` file. Startup validation is centralized in `packages/config` and fails fast if required variables are missing or malformed.

Connection settings for PostgreSQL and Redis are centralized in `packages/database`.

Important placeholder secrets are included in `.env.example`:
- GitHub App credentials
- GitHub webhook secret
- JWT secret
- AI provider keys

## Common Commands

- `make local-up`: start PostgreSQL and Redis
- `make local-down`: stop PostgreSQL and Redis
- `make dev`: run web, API, webhook, and worker together
- `pnpm typecheck`: run all TypeScript checks
- `pnpm lint`: run workspace lint commands
- `pnpm test`: run workspace test commands

## Notes

- Search is stubbed for MVP. `TODO: PRODUCTION` integrate OpenSearch when the search and log analytics features are implemented.
- Infra modules are still placeholders in this step. `TODO: PRODUCTION` add AWS networking, ECS, RDS, Redis, S3, Step Functions, EventBridge, IAM, and observability.
