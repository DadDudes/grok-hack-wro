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

Creates a game row and returns **`202`** with `status: "queued"` before generation finishes. The background pipeline (Vercel `after()`, up to `maxDuration` of 300 seconds) moves the row through `generating` to `ready` or `failed`.

Poll `GET /api/games/:id` every few seconds. Stop on `ready` or `failed`.

When `ready`, open `gameUrl`. That URL is `{PUBLIC_BASE_URL or request origin}/play/{id}` and serves a Phaser page as `text/html`. It is not a Storage object.

### Request

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `parentPrompt` | string | yes | What the child should learn. Trimmed. 1–4000 characters. |
| `childPrompt` | string | yes | The game the child asked for. Trimmed. 1–4000 characters. |
| `childAge` | integer | no | 3–18. |
| `language` | string | no | BCP 47 tag such as `pl` or `en`. 2–16 characters. |
| `questionCount` | integer | no | 1 to 10. How many tasks to play. The Phaser page plays 3 to 10. |
| `template` | string | no | `collect`, `runner`, `quiz`, or `quiz_battle`. `quiz_battle` is stored as `quiz`. |
| `tasks` | array | no | 1 to 10 tasks: `id`, `question`, `answer`, `distractors` (2 or 3), `difficulty` (1, 2, or 3), optional `skill`. |

Unknown fields are rejected. A body with only `parentPrompt` and `childPrompt` still works. When `tasks` or `template` are omitted, the engine also reads the older line format in [engine-prompts.md](./engine-prompts.md) (`Questions:`, `Game type:`, `t1. question | answer | ...`). Structured fields win when both are present.

```json
{
  "parentPrompt": "Ułamki zwykłe: dodawanie o tym samym mianowniku.",
  "childPrompt": "Gra platformowa, w której zbieram monety-ułamki.",
  "childAge": 10,
  "language": "pl"
}
```

### Response `202`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "parentPrompt": "Ułamki zwykłe: dodawanie o tym samym mianowniku.",
  "childPrompt": "Gra platformowa, w której zbieram monety-ułamki.",
  "childAge": 10,
  "language": "pl",
  "status": "queued",
  "template": null,
  "gameUrl": null,
  "graphics": {
    "thumbnailUrl": null,
    "coverUrl": null,
    "assetUrls": []
  },
  "error": null,
  "createdAt": "2026-11-05T17:50:00.000Z",
  "updatedAt": "2026-11-05T17:50:00.000Z"
}
```

A later `GET` with `status: "ready"` has `template` (`collect`, `runner`, or `quiz`), `gameUrl` pointing at `/play/{id}`, and graphic URLs. Those graphic URLs are same-origin `/play/{id}/assets/{name}` routes (PNG or JPEG, `Content-Disposition: inline`) so Phaser can load them. When Supabase is configured, the bytes are also stored in the `game-assets` bucket and `spec.json` may appear in `assetUrls`. Thumbnail and cover are not repeated in `assetUrls`.

| Field | Notes |
| --- | --- |
| `id` | UUID. |
| `status` | `queued`, `generating`, `ready`, or `failed`. |
| `template` | `collect`, `runner`, or `quiz`. Null until generation finishes. |
| `gameUrl` | `GET /play/{id}` once `ready`. Null before that, including when `failed`. |
| `graphics.thumbnailUrl` | Cover image for lists. Null until graphics exist. |
| `graphics.coverUrl` | Larger image. Null until graphics exist. |
| `graphics.assetUrls` | Bundle and extra art. Empty until files exist. Thumbnail and cover are not repeated here. |
| `error` | Safe message when `status` is `failed`. Otherwise null. |
| `childAge`, `language` | Null when the request omitted them. |

`202` means the row was stored and generation was scheduled. Read `status` from `GET`. A failed pipeline is `status: "failed"` on that GET, with a generic `error`. The create call itself is `500` only when the row could not be stored.

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

## `GET /play/{id}`

HTML, not JSON. `Content-Type: text/html`. `Content-Security-Policy: frame-ancestors *` so the product frontend can embed it.

| Status | Body |
| --- | --- |
| `200` | Phaser page when `ready`. While `queued` or `generating`, a short page that refreshes itself. A failed game shows `error`. |
| `400` | The id is not a UUID. |
| `404` | Unknown id, or a ready row whose spec could not be read. |
| `500` | The store could not be read. |

`?assets=shapes` renders the same spec with image URLs cleared, so the template draws shapes. The stored spec is unchanged.

The page loads Phaser 3.90 from jsDelivr and `/phaser/runtime.js` from this app. The spec JSON is embedded in the HTML. It is not executed as code.

Omitted `language` is stored as null and played in Polish (`pl`).

## `GET /play/{id}/assets/{name}`

`name` is `character`, `background`, `item`, `thumbnail`, or `cover`. Responds with the image bytes (`image/png`, `image/jpeg`, or `image/webp`) and `Content-Disposition: inline`. `404` when that slot was not generated. The template then draws a shape.

## `POST /api/games/{id}/results`

Optional. The end screen posts `{ score, total, correct, durationMs? }`. `200` is `{ "ok": true }`. The row stores `last_result` for a future analyst agent. Unknown id is `404`. This does not change `status`.

## Not in this version

- Listing games
- Audio upload
- Auth
- In-game hint agent and post-game analyst (the spec reserves `extensions.teammate` and `extensions.analyst`, both disabled)
- One Vercel deployment per game. Play stays on this app.
