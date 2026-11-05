# grok-hack-wro

Educational games for the Grok hackathon in Wrocław.

A parent or teacher describes what the child should learn. The child describes the game they want to play, by voice or by text. The system generates a browser game in that form and publishes it at its own URL.

This repository currently contains the **backend only**. The parent panel, the child panel, and the visual design of that flow belong to a separate frontend. Put that app in a sibling folder such as `frontend/`. Do not add it under `backend/`.

## Why this stack

The API is a Next.js App Router app in [`backend/`](backend), deployed as its own Vercel project. Route handlers run as Vercel Functions on Fluid Compute with the default Node.js runtime. That gives TypeScript, a normal `next dev` loop, and room for a multi-step generation pipeline without mixing it into the frontend tree.

The request and response types live in [`packages/api-contract`](packages/api-contract). That package depends only on Zod, so the frontend can import it without depending on Next.js.

Records and files are planned for Supabase (Postgres plus a public storage bucket). The stub runs with no keys and no database.

## Layout

```text
backend/                     Next.js API. Vercel Root Directory.
  app/api/games/             POST /api/games
  app/api/games/[id]/        GET /api/games/:id
  app/api/health/            GET /api/health
  lib/games/                 Create, read, memory store, Supabase store
  lib/services/              Stubs: code, graphics, storage, deploy
  lib/supabase/              Service-role client
  vercel.ts                  Vercel project config for this directory
packages/api-contract/       Shared Zod schemas and TypeScript types
docs/api-contract.md         Contract for the frontend
docs/openapi.yaml            The same contract as OpenAPI 3.1
supabase/                    config.toml, migration, bucket notes
.env.example                 Variable names only. No secrets.
```

## Flow

```text
parent goal + child game idea
        │
        ▼
frontend  ──POST /api/games──►  API validates (Zod)
                                    │
                                    ├─ insert row (status queued)
                                    ├─ generate game code     TODO xAI Grok
                                    ├─ generate graphics      TODO image model
                                    ├─ store files            TODO Supabase Storage
                                    └─ publish a URL          TODO Vercel (see below)
        ▲
        └── 201 Game { id, gameUrl, graphics, status }
frontend  ──GET /api/games/:id──►  poll while queued or generating
```

The stub runs those steps in the request and returns `status: "ready"` with `https://*.example.invalid/...` URLs. Those hosts are reserved examples and do not resolve. `GET` returns the same record from memory.

When the model calls are real, return `queued` immediately and finish in a background workflow. The `GET` route is already the status endpoint.

Speech-to-text stays in the frontend. `childPrompt` is the transcript.

## How the frontend connects

- Base URL: `http://localhost:3001` locally. Set `API_BASE_URL` in the frontend. Browser code in Next.js needs `NEXT_PUBLIC_API_BASE_URL`. This API does not read either variable.
- Contract: import `@grok-hack/api-contract`, or follow [docs/api-contract.md](docs/api-contract.md) and [docs/openapi.yaml](docs/openapi.yaml).
- CORS: the browser `Origin` must be listed in `CORS_ORIGINS`. The default allows `localhost` and `127.0.0.1` on ports `3000` and `5173`. No cookies.
- There is no auth yet. Do not point a public frontend at an API that holds a live model key until `POST` is gated.

```ts
import { apiPaths, type Game } from '@grok-hack/api-contract';

const base = process.env.API_BASE_URL ?? 'http://localhost:3001';

const response = await fetch(`${base}${apiPaths.games}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    parentPrompt: 'Ułamki zwykłe: dodawanie o tym samym mianowniku.',
    childPrompt: 'Gra platformowa, w której zbieram monety-ułamki.',
    childAge: 10,
    language: 'pl',
  }),
});

const game = (await response.json()) as Game;
```

## Run locally

Node.js 22 or newer.

```bash
npm install
npm run dev
```

The stub needs no `.env`. To point at real services later:

```bash
cp .env.example backend/.env.local
```

Fill in keys only in `backend/.env.local`. That file is gitignored.

```bash
curl -s http://localhost:3001/api/health

curl -s -X POST http://localhost:3001/api/games \
  -H 'content-type: application/json' \
  -d '{"parentPrompt":"Addition up to 20","childPrompt":"A quiz-show game","childAge":10,"language":"en"}'
```

Use the returned `id` with `GET /api/games/{id}`.

```bash
npm test
npm run typecheck
npm run build
```

## Environment

| Variable | Used by the stub | Purpose |
| --- | --- | --- |
| `XAI_API_KEY` | no | xAI Grok, for game-code generation |
| `SUPABASE_URL` | when both are set | Postgres and Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | when both are set | Server-only. Bypasses RLS. Never `NEXT_PUBLIC_` |
| `VERCEL_TOKEN` | no | Deployment API for one URL per game |
| `VERCEL_TEAM_ID` | no | Team that owns those deployments |
| `CORS_ORIGINS` | yes, has a default | Comma-separated browser origins |
| `GAME_PUBLIC_URL_BASE` | optional | Replaces `https://games.example.invalid` |
| `GAME_ASSET_BASE_URL` | optional | Replaces `https://cdn.example.invalid/game-assets` |

If the Supabase variables are unset, `GET /api/health` reports `"storage": "memory"`. Memory lasts for one `next dev` process.

## Supabase

See [supabase/README.md](supabase/README.md).

- Table `public.games`: prompts, status, `game_url`, `thumbnail_url`, `cover_url`, `assets` (JSON array of URLs), timestamps.
- RLS is enabled. No policies for `anon` or `authenticated`.
- Bucket `game-assets` is public for downloads. The API is meant to upload with the service role.

## Deploying this API

Create a Vercel project for this repo and set **Root Directory** to `backend`. Keep "include source files outside the root directory" enabled so the workspace package `packages/api-contract` is available. [`backend/vercel.ts`](backend/vercel.ts) sets the Next.js framework. Functions stay on Node.js. Do not set the Edge runtime.

The frontend should be a second Vercel project (or a later service), not a route inside `backend/`.

## Deploying each generated game

Not implemented. Options, in the order worth trying:

1. **Vercel Deployment API.** One static deployment per game (`VERCEL_TOKEN`, `VERCEL_TEAM_ID`). The deployment URL is the distinct public URL.
2. **Subpath on one project.** Serve the stored HTML at `/play/{gameId}` from the `game-assets` bucket. Simpler, and not a separate origin.
3. **Wildcard subdomain.** `{gameId}.games.<domain>` aliased to option 1 or routed to option 2.

## Roadmap

- Call Grok for a static HTML/CSS/JS game that teaches `parentPrompt` in the form of `childPrompt`.
- Generate a thumbnail, a cover, and in-game art. Upload bytes to `game-assets`.
- Publish each game with one of the options above and store the real `gameUrl`.
- Move the pipeline off the request (Vercel Workflow) and return `queued` from `POST`.
- Require a parent or teacher credential before generation.
- List games for the parent panel, if the frontend needs it.

## Out of scope here

Parent panel, child panel, speech UI, and visual design.
