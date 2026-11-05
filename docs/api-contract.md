# Games API contract

Source of truth for TypeScript callers: [`packages/api-contract`](../packages/api-contract). This page and [`openapi.yaml`](./openapi.yaml) describe the same JSON.

Base URL in local development: `http://localhost:3001`.

The frontend should read that from `API_BASE_URL` (or `NEXT_PUBLIC_API_BASE_URL` if the value must reach browser code). This API does not read that variable.

JSON fields are camelCase. The database columns are snake_case. The API is the mapping.

## Auth

There is no auth on these routes yet. Do not deploy the API with a live model key until a parent or teacher credential gates `POST /api/games`.

## Voice

`childPrompt` is text. Speech-to-text stays in the frontend. Send the transcript in JSON. The API does not accept audio.

## `POST /api/games`

Creates a game and, in the current stub, runs the pipeline before responding. The body comes back as `ready` with placeholder URLs.

When generation moves off the request, this route will return `queued` quickly. Clients should treat that as success and poll `GET /api/games/:id`.

### Request

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `parentPrompt` | string | yes | What the child should learn. Trimmed. 1–4000 characters. |
| `childPrompt` | string | yes | The game the child asked for. Trimmed. 1–4000 characters. |
| `childAge` | integer | no | 3–18. |
| `language` | string | no | BCP 47 tag such as `pl` or `en`. 2–16 characters. |

Unknown fields are rejected.

```json
{
  "parentPrompt": "Ułamki zwykłe: dodawanie o tym samym mianowniku.",
  "childPrompt": "Gra platformowa, w której zbieram monety-ułamki.",
  "childAge": 10,
  "language": "pl"
}
```

### Response `201`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "parentPrompt": "Ułamki zwykłe: dodawanie o tym samym mianowniku.",
  "childPrompt": "Gra platformowa, w której zbieram monety-ułamki.",
  "childAge": 10,
  "language": "pl",
  "status": "ready",
  "gameUrl": "https://games.example.invalid/550e8400-e29b-41d4-a716-446655440000",
  "graphics": {
    "thumbnailUrl": "https://cdn.example.invalid/game-assets/550e8400-e29b-41d4-a716-446655440000/thumbnail.svg",
    "coverUrl": "https://cdn.example.invalid/game-assets/550e8400-e29b-41d4-a716-446655440000/cover.svg",
    "assetUrls": [
      "https://cdn.example.invalid/game-assets/550e8400-e29b-41d4-a716-446655440000/index.html",
      "https://cdn.example.invalid/game-assets/550e8400-e29b-41d4-a716-446655440000/assets/placeholder.svg"
    ]
  },
  "error": null,
  "createdAt": "2026-11-05T17:50:00.000Z",
  "updatedAt": "2026-11-05T17:50:00.000Z"
}
```

`https://*.example.invalid` is a placeholder. Those hosts do not resolve. Real URLs arrive when storage upload and deployment are implemented.

| Field | Notes |
| --- | --- |
| `id` | UUID. |
| `status` | `queued`, `generating`, `ready`, or `failed`. |
| `gameUrl` | Public URL of the playable game. Null until `ready`. |
| `graphics.thumbnailUrl` | Cover image for lists. Null until graphics exist. |
| `graphics.coverUrl` | Larger image. Null until graphics exist. |
| `graphics.assetUrls` | Bundle and extra art. Empty until files exist. Thumbnail and cover are not repeated here. |
| `error` | Safe message when `status` is `failed`. Otherwise null. |
| `childAge`, `language` | Null when the request omitted them. |

`201` means the row was stored. Read `status`. A failed pipeline still returns `201` with `status: "failed"` so the client has an id.

## `GET /api/games/:id`

Same game object as the create response.

| Status | When |
| --- | --- |
| `200` | The id exists in this process (memory) or in Supabase. |
| `400` | `id` is not a UUID. `details[0].path` is `id`. |
| `404` | No row for that id. |
| `500` | The store could not be read. |

Without Supabase, the memory store dies with the Node process. A GET against a different process returns `404`.

Poll every few seconds while `status` is `queued` or `generating`. Stop on `ready` or `failed`.

## `GET /api/health`

```json
{ "ok": true, "service": "games-api", "storage": "memory" }
```

`storage` is `memory` or `supabase`.

## Errors

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid request.",
    "details": [{ "path": "childAge", "message": "Too small: expected number to be >=3" }]
  }
}
```

| HTTP | `error.code` | When |
| --- | --- | --- |
| `400` | `invalid_json` | Body is not JSON. `details` omitted. |
| `400` | `validation_error` | Schema rejection. `details` lists `path` and `message`. `(root)` is the path for an unknown key. |
| `404` | `not_found` | Unknown game id. |
| `500` | `internal_error` | Unexpected failure. The message is generic. |

## CORS

Allowed methods: `GET`, `POST`, `OPTIONS`. Allowed request header: `Content-Type` (and `Authorization`, reserved).

`CORS_ORIGINS` is a comma-separated list. The request `Origin` is echoed only when it is in the list. Defaults cover `localhost` and `127.0.0.1` on ports `3000` and `5173`. Credentials are not used. A browser on another origin gets no `Access-Control-Allow-Origin` until that origin is added.

## Frontend call

```ts
import { apiPaths, createGameRequestSchema, type Game } from '@grok-hack/api-contract';

const base = process.env.API_BASE_URL ?? 'http://localhost:3001';
const body = createGameRequestSchema.parse({
  parentPrompt,
  childPrompt,
  childAge,
  language,
});

const created = await fetch(`${base}${apiPaths.games}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const game = (await created.json()) as Game;
```

Add the workspace dependency `"@grok-hack/api-contract": "*"` from a package under this repo, or depend on `packages/api-contract` by path.

## Not in this version

- Listing games
- Audio upload
- Auth
- A playable URL that resolves
