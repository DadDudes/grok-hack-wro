# Supabase

Placeholder project for game records and generated files. The API runs without it: leave `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` empty and records stay in process memory.

## Table

`public.games` is created by `migrations/20261105175328_create_games.sql`.

Row Level Security is on and there are no policies for `anon` or `authenticated`. The Data API cannot read or write the table. The backend uses the service role, which bypasses RLS. Do not put that key in the frontend, and do not prefix it with `NEXT_PUBLIC_`.

## Storage bucket

Bucket id: `game-assets` (public read).

The migration inserts the bucket. `config.toml` declares the same bucket for `supabase start`.

Objects live under `{gameId}/`, for example:

- `{gameId}/index.html`
- `{gameId}/thumbnail.svg`
- `{gameId}/cover.svg`
- `{gameId}/assets/placeholder.svg`

Public URL, once an object exists:

```text
{SUPABASE_URL}/storage/v1/object/public/game-assets/{gameId}/{path}
```

Uploads are not granted to `anon` or `authenticated`. The service role uploads from the API. A public bucket only opens downloads. If a later client uploads with a user key, upsert needs `INSERT`, `SELECT`, and `UPDATE` policies on `storage.objects`.

`storeGameAssets` in the API does not upload yet. It returns placeholder URLs.

## Local stack

This is optional for the stub.

```bash
supabase start
supabase migration up
```

Link a hosted project with `supabase link` and apply the migration with `supabase db push` when you are ready. Do not commit service keys.
