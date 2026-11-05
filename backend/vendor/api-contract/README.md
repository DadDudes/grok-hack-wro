# `@grok-hack/api-contract`

Shared request and response types for the games API. The frontend can depend on this package directly. It has no Next.js or Supabase dependency.

```ts
import { createGameRequestSchema, apiPaths, type Game } from '@grok-hack/api-contract';
```

The human-readable contract and the OpenAPI document live in [`docs/`](../../docs/).

`POST /api/games` returns `202` with `status: "queued"`. Poll `GET /api/games/:id` until `ready` or `failed`. A ready game's `gameUrl` is `GET /play/{id}` (HTML). `template` is `collect`, `runner`, or `quiz`, or null before generation finishes.

The backend vendors a copy of this package at `backend/vendor/api-contract` so `backend/` can `npm install && npm run build` without npm workspaces. Edit this package, then run `node backend/scripts/sync-api-contract.mjs` (`prebuild` does that when this folder is present).
