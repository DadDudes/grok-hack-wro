# Supabase

Placeholder project for game records and generated files. The API runs without it: leave `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` empty and records stay in process memory.

## Table

`public.games` is created by `migrations/20261105175328_create_games.sql`. `migrations/20261105190000_games_spec.sql` adds `template`, `spec` (jsonb), and `last_result`. Apply both before the API writes a generated game.

Row Level Security is on and there are no policies for `anon` or `authenticated`. The Data API cannot read or write the table. The backend uses the service role, which bypasses RLS. Do not put that key in the frontend, and do not prefix it with `NEXT_PUBLIC_`.

## Storage bucket

Bucket id: `game-assets` (public read).

The migration inserts the bucket. `config.toml` declares the same bucket for `supabase start`.

Objects live under `{gameId}/`, for example:

- `{gameId}/spec.json`
- `{gameId}/images/character.png` (or `.jpg` / `.webp`)
- `{gameId}/images/background.png`
- `{gameId}/images/item.png`
- `{gameId}/images/thumbnail.png`
- `{gameId}/images/cover.png`

The playable page is not one of these objects. `gameUrl` is `GET /play/{id}` on the API, which embeds `spec`. The app proxies images so Phaser does not depend on Storage `Content-Disposition`.

Public URL, once an object exists:

```text
{SUPABASE_URL}/storage/v1/object/public/game-assets/{gameId}/{path}
```

Uploads are not granted to `anon` or `authenticated`. The service role uploads from the API. A public bucket only opens downloads. If a later client uploads with a user key, upsert needs `INSERT`, `SELECT`, and `UPDATE` policies on `storage.objects`.

When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, the pipeline uploads images and `spec.json` with the service role. `graphics` URLs in the API still point at `/play/{id}/assets/...` on the API origin. Without those variables, nothing is uploaded and images live in the Node process that generated the game.

## Local stack

This is optional. Without it, the API keeps games in memory.

```bash
supabase start
supabase migration up
```

Link a hosted project with `supabase link` and apply the migration with `supabase db push` when you are ready. Do not commit service keys.
