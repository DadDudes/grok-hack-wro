# grok-hack-wro

Educational games for the Grok hackathon in Wrocław.

A parent or teacher describes what the child should learn. The child describes the game they want to play, by voice or by text. The system generates a browser game in that form and publishes it at its own URL.

This repository currently contains the **backend only**. The parent panel, the child panel, and the visual design of that flow belong to a separate frontend. Put that app in a sibling folder such as `frontend/`. Do not add it under `backend/`.

## Why this stack

The API is a Next.js App Router app in [`backend/`](backend), deployed as its own Vercel project. Route handlers run as Vercel Functions on Fluid Compute with the default Node.js runtime. That gives TypeScript, a normal `next dev` loop, and room for a multi-step generation pipeline without mixing it into the frontend tree.

The request and response types live in [`packages/api-contract`](packages/api-contract). That package depends only on Zod, so the frontend can import it without depending on Next.js.

Records and images go to Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set. With those unset, the API keeps games in process memory. Generation uses the xAI API when `XAI_API_KEY` is set, and a local lesson plus drawn shapes when it is not.

## Layout

```text
backend/                     Next.js API. Vercel Root Directory.
  app/page.tsx               Temporary developer test form at /
  app/api/games/             POST /api/games (202, then background generation)
  app/api/games/[id]/        GET /api/games/:id
  app/play/[id]/             GET /play/:id  (Phaser HTML)
  app/api/health/            GET /api/health
  public/phaser/runtime.js   Fixed Phaser templates: collect, runner, quiz
  lib/agents/                Pedagog, Projektant gry, Grafik
  lib/games/                 Create, read, memory store, Supabase store
  lib/services/              Spec, images, storage, play URL
  vendor/api-contract/       Copy of the contract so this folder builds alone
  vercel.ts                  npm install && npm run build
packages/api-contract/       Shared Zod schemas and TypeScript types (source)
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
                                    └─ 202 Game
        ▲                              │
        │                              ▼  after()
        │                         Pedagog (grok-4.7) → tasks
        │                         Projektant gry (grok-4.7) → one template + theme
        │                         Grafik (grok-imagine-image) → PNG/JPEG
        │                         save spec, set status ready
        └── GET /api/games/:id
              gameUrl = /play/{id}  → Phaser template (collect | runner | quiz)
```

`POST` returns quickly with `status: "queued"`. Poll `GET` until `ready` or `failed`. The playable page is served by this app as `text/html`. Supabase Storage is for images and a copy of the spec, not for the HTML. Storage serves HTML as `text/plain` with a sandbox policy, so a game cannot run from the bucket.

With no `XAI_API_KEY`, Pedagog and Projektant gry are a deterministic local lesson (body parts, colors, animals, or counting) and Grafik is skipped. The template draws shapes. Thumbnail and cover are small generated PNGs.

Speech-to-text stays in the frontend. `childPrompt` is the transcript. Omitted `language` is played in Polish.

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

`/` is a plain form (parent prompt, child prompt, optional age and language) that calls `POST /api/games`, polls until the game is ready or failed, and shows the JSON, `gameUrl`, thumbnail, and an iframe of the game. It links to `/api/health`.

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

Use the returned `id` with `GET /api/games/{id}` until `status` is `ready`, then open `gameUrl`.

```bash
npm test
npm run exercise
npm run typecheck
npm run build
```

`npm run exercise` runs the pipeline with no API key and prints one URL per template. Those URLs only resolve while that process is alive.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `XAI_API_KEY` | no | xAI text and image calls. Missing key uses the local fallback |
| `XAI_MODEL` | no | Chat model. Default `grok-4.7` |
| `XAI_IMAGE_MODEL` | no | Image model. Default `grok-imagine-image` |
| `XAI_REASONING_EFFORT` | no | Passed to chat completions. Default `low`. Dropped and retried if the API rejects it |
| `PUBLIC_BASE_URL` | no | Origin used in `gameUrl`. Otherwise the request host |
| `SUPABASE_URL` | for production | Postgres and Storage. Health then reports `supabase` |
| `SUPABASE_SERVICE_ROLE_KEY` | with the URL | Server-only. Bypasses RLS. Never `NEXT_PUBLIC_` |
| `CORS_ORIGINS` | has a default | Comma-separated browser origins |
| `GAME_PUBLIC_URL_BASE` | no | Older alias of `PUBLIC_BASE_URL` |
| `GAME_STORE` | no | Set to `memory` to ignore Supabase. For local tests |

If either Supabase variable is unset, `GET /api/health` reports `"storage": "memory"`. Memory lasts for one Node process. Apply both files in `supabase/migrations/` before the first persisted write. The second adds `template`, `spec`, and `last_result`.

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
| Include source files outside the Root Directory | Not required. The contract is vendored |
| Framework | Next.js |
| Install command | `npm install` |
| Build command | `npm run build` |
| Node.js | Default (Fluid Compute). Do not set the Edge runtime |

[`backend/vercel.ts`](backend/vercel.ts) sets those commands. `npm run build` copies `packages/api-contract` into `backend/vendor` when the monorepo is present, then runs `next build`. A deploy that uploads only `backend/` uses the committed vendor copy.

Set `PUBLIC_BASE_URL` to the deployment origin so `gameUrl` is not an internal host. Also set `XAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CORS_ORIGINS` if a browser on another origin calls the API. The test page is same-origin and does not need CORS.

Apply `supabase/migrations/20261105190000_games_spec.sql` before generation against Supabase. Without the `spec` column the pipeline marks the game failed.

After deploy, open `/` to submit the form and `/api/health` to confirm `"storage": "supabase"`.

## How a game is served

`GET /play/{id}` renders one of three hand-written Phaser templates (`collect`, `runner`, `quiz`) with the stored spec. Phaser comes from jsDelivr (`phaser@3.90.0`). Images are loaded from `/play/{id}/assets/{name}` so the canvas is not blocked by Storage headers. If an image is missing, the template draws a shape.

The end screen posts to `POST /api/games/{id}/results`. That payload is kept for a later analyst agent. The in-game hint agent is not built. `spec.extensions` reserves both and leaves them disabled.

## Roadmap

- Require a parent or teacher credential before generation.
- In-game hint agent and post-game analyst.
- List games for the parent panel, if the frontend needs it.
- More local lesson banks. Unrecognized topics currently fall back to colors.

## Out of scope here

Parent panel, child panel, speech UI, and visual design.
