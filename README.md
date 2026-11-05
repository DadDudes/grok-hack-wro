# grok-hack-wro

Educational games for the Grok hackathon in Wrocław.

A parent or teacher describes what the child should learn. The child describes the game they want to play, by voice or by text. The system generates a browser game in that form and publishes it at its own URL.

This repository currently contains the **backend only**. The parent panel, the child panel, and the visual design of that flow belong to a separate frontend. Put that app in a sibling folder such as `frontend/`. Do not add it under `backend/`.

## Why this stack

The API is a Next.js App Router app in [`backend/`](backend), deployed as its own Vercel project. Route handlers run as Vercel Functions on Fluid Compute with the default Node.js runtime. That gives TypeScript, a normal `next dev` loop, and room for a multi-step generation pipeline without mixing it into the frontend tree.

The request and response types live in [`packages/api-contract`](packages/api-contract). That package depends only on Zod, so the frontend can import it without depending on Next.js.

Records and files go to Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set. With those unset, the API keeps games in process memory and returns placeholder URLs.

## Layout

```text
backend/                     Next.js API. Vercel Root Directory.
  app/page.tsx               Temporary developer test form at /
  app/api/games/             POST /api/games
  app/api/games/[id]/        GET /api/games/:id
  app/api/health/            GET /api/health
  lib/games/                 Create, read, memory store, Supabase store
  lib/services/              Code and graphics stubs; real Storage upload when configured
  lib/supabase/              Service-role client
  vercel.ts                  Install/build commands for Root Directory = backend
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
                                    ├─ generate graphics      TODO image model (SVG placeholder today)
                                    ├─ store files            Supabase Storage when configured
                                    └─ publish a URL          stored index.html, or a placeholder
        ▲
        └── 201 Game { id, gameUrl, graphics, status }
frontend  ──GET /api/games/:id──►  poll while queued or generating
```

The pipeline runs inside the request and returns `status: "ready"`. Without Supabase, URLs use `https://*.example.invalid/...`, which does not resolve, and `GET` reads the memory store. With Supabase, the row is written to `public.games`, the files are uploaded to `game-assets`, `gameUrl` is the public `index.html` object, and `/api/health` reports `"storage": "supabase"`.

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

## Developer test page

`/` is a plain form (parent prompt, child prompt, optional age and language) that calls `POST /api/games` and shows the JSON, `gameUrl`, and thumbnail. It links to `/api/health`.

This page is a temporary developer test UI on the API deployment. It is not the colleague's parent or child frontend, and it is not the visual design for the product. Put that app in a sibling folder such as `frontend/`.

## Run locally

Node.js 22 or newer.

```bash
npm install
npm run dev
```

The memory path needs no `.env`. To persist games, copy the example and set the Supabase variables:

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
| `SUPABASE_URL` | yes, when set with the service role key | Postgres and Storage. Health then reports `supabase` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes, when set with the URL | Server-only. Bypasses RLS. Never `NEXT_PUBLIC_` |
| `VERCEL_TOKEN` | no | Deployment API for one URL per game |
| `VERCEL_TEAM_ID` | no | Team that owns those deployments |
| `CORS_ORIGINS` | yes, has a default | Comma-separated browser origins |
| `GAME_PUBLIC_URL_BASE` | optional | Replaces `https://games.example.invalid` |
| `GAME_ASSET_BASE_URL` | optional | Replaces `https://cdn.example.invalid/game-assets` |

If either Supabase variable is unset, `GET /api/health` reports `"storage": "memory"`. Memory lasts for one Node process. Apply `supabase/migrations/20261105175328_create_games.sql` before the first persisted write. That migration creates `public.games` and the `game-assets` bucket.

## Supabase

See [supabase/README.md](supabase/README.md).

- Table `public.games`: prompts, status, `game_url`, `thumbnail_url`, `cover_url`, `assets` (JSON array of URLs), timestamps.
- RLS is enabled. No policies for `anon` or `authenticated`.
- Bucket `game-assets` is public for downloads. The API is meant to upload with the service role.

## Deploying this API

Create one Vercel project for this repository. The product frontend, when it exists, should be a second project.

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Include source files outside the Root Directory | Enabled (required for `packages/api-contract`) |
| Framework | Next.js |
| Install command | `npm install --prefix "$(git rev-parse --show-toplevel)" --workspace=@grok-hack/api` |
| Build command | `npm run build --prefix "$(git rev-parse --show-toplevel)" --workspace=@grok-hack/api` |
| Node.js | Default (Fluid Compute). Do not set the Edge runtime |

[`backend/vercel.ts`](backend/vercel.ts) already sets the install and build commands. The `git rev-parse` prefix runs them from the repository root whether Vercel starts in the repo root or in `backend/`.

Environment variables for Production and Preview:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGINS` if a browser on another origin calls the API. The test page is same-origin and does not need it.
- `XAI_API_KEY`, `VERCEL_TOKEN`, and `VERCEL_TEAM_ID` stay empty until those TODOs are implemented.

After deploy, open `/` to submit the form and `/api/health` to confirm `"storage": "supabase"`.

## Deploying each generated game

Not implemented. Options, in the order worth trying:

1. **Vercel Deployment API.** One static deployment per game (`VERCEL_TOKEN`, `VERCEL_TEAM_ID`). The deployment URL is the distinct public URL.
2. **Subpath on one project.** Serve the stored HTML at `/play/{gameId}` from the `game-assets` bucket. Simpler, and not a separate origin.
3. **Wildcard subdomain.** `{gameId}.games.<domain>` aliased to option 1 or routed to option 2.

## Roadmap

- Call Grok for a static HTML/CSS/JS game that teaches `parentPrompt` in the form of `childPrompt`.
- Generate a thumbnail, a cover, and in-game art. Stub SVGs already upload to `game-assets` when Supabase is configured.
- Publish each game with one of the options above. Until then, `gameUrl` is the public Storage URL of `index.html` when Supabase is configured.
- Move the pipeline off the request (Vercel Workflow) and return `queued` from `POST`.
- Require a parent or teacher credential before generation.
- List games for the parent panel, if the frontend needs it.

## Out of scope here

Parent panel, child panel, speech UI, and visual design.
