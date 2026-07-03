# vampire-rolodex

[![CI](https://github.com/thatleda/vampire-rolodex/actions/workflows/ci.yml/badge.svg)](https://github.com/thatleda/vampire-rolodex/actions/workflows/ci.yml)

A small full-stack app that fetches mocked patient lab data from an external API, persists it in Postgres, and displays it in a paginated table with reset / add-new-data controls.

## Stack

- **Client**: React, Vite, TanStack Query + Table, tRPC client
- **Server**: Express, tRPC, Prisma, PostgreSQL
- **Testing**: Vitest, Testing Library (with extra matchers), MSW (mocks the tRPC contract on the client side; never touches the real backend)
- **Tooling**: pnpm workspaces with a shared dependency catalog, ESLint (`@antfu/eslint-config`), `prisma-lint`

## Prerequisites

- Node (version pinned in `.nvmrc`, currently 24.18.0)
- pnpm (version pinned in `package.json`'s `packageManager` field, currently 11.8.0)
- Docker, for local Postgres

## Setup

1. Clone the repo and copy the env file:

   ```sh
   cp .env.example .env
   ```

2. Fill in `.env`:
   - `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` — any values, used to configure the local Postgres container
   - `DATABASE_URL` — a connection string matching the three values above, e.g. `postgresql://<user>:<password>@localhost:5432/<db>` for local development
   - `EXTERNAL_API_URL` where the data lives
   - `SERVER_PORT` — the server's local port (default: `4000`)
   - `DEFAULT_PATIENT_COUNT` — how many patients to fetch on first load and on reset (default: `10`)
   - `CLIENT_PORT` — the frontend dev server's local port (default: `5173`)
   - `VITE_ENABLE_MOCKS` — `true` to run the client entirely against MSW-mocked data with no backend needed (useful for frontend-only work); `false` (default) talks to the real server

3. Start Postgres:

   ```sh
   pnpm dev:db
   ```

4. Install dependencies. This also regenerates the Prisma client and the MSW service worker automatically (both are gitignored, derived output):

   ```sh
   pnpm install
   ```

5. Apply database migrations:

   ```sh
   pnpm --filter server exec prisma migrate deploy
   ```

6. Start both apps:

   ```sh
   pnpm dev   # server on :4000, client on :5173
   ```

   By default (`VITE_ENABLE_MOCKS=false`) the client talks to the real server above. Set `VITE_ENABLE_MOCKS=true` to run the client standalone against MSW-mocked data instead — no server or Postgres required, useful if you only want `pnpm dev:client` on its own.

## Testing

```sh
pnpm test          # both server and client
pnpm --filter server test
pnpm --filter client test
```

Server tests run against a real local Postgres instance (not mocked), with only the external API's `fetch` call stubbed. Client tests run against MSW-mocked tRPC responses, so they never depend on the server being up.

## Linting

```sh
pnpm lint            # ESLint across the whole repo
pnpm lint:fix
pnpm lint:prisma     # schema conventions: naming, required indexes, no PII fields, required audit timestamps
```

## Architecture notes

- **Lab results are stored as JSONB** (`Observation.results`), not fixed columns, because the panel of lab values per visit isn't fixed in advance. Extraction is fully dynamic — any `<key>`/`<key>_unit` pair in the source data is captured, not a hardcoded list.
- **No PII is stored.** Patients are identified only by the external API's `client_id`; `prisma-lint`'s `forbid-field` rule enforces that no `name`/`email`-shaped field can be added back in without a build failure.
- **Pagination** is client-side via TanStack Table for now. If patient volume grows meaningfully, `patients.list` should move to server-side pagination rather than fetching the full table into memory.
- **CI** runs the client and server pipelines in parallel; the server job spins up a real Postgres service container (via a scoped `ci` GitHub Environment, not repo-wide secrets) and runs actual integration tests against it, not mocks.

## Deployment

Not yet deployed — planned: Render (app) + Neon (Postgres).
