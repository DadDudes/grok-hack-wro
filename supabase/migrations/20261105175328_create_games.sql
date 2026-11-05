-- Games created by the API. The backend writes with the service role.
-- Prompt limits match `promptLimits` in packages/api-contract.
-- Apply with `supabase db push` once the project is linked, or
-- `supabase start` for a local stack. The HTTP stub does not need this
-- database until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.

create table public.games (
  id uuid primary key default gen_random_uuid(),
  parent_prompt text not null,
  child_prompt text not null,
  child_age smallint,
  language text,
  status text not null default 'queued',
  game_url text,
  thumbnail_url text,
  cover_url text,
  assets jsonb not null default '[]'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_parent_prompt_len check (char_length(parent_prompt) between 1 and 4000),
  constraint games_child_prompt_len check (char_length(child_prompt) between 1 and 4000),
  constraint games_child_age_range check (child_age is null or child_age between 3 and 18),
  constraint games_language_len check (language is null or char_length(language) between 2 and 16),
  constraint games_status_check check (status in ('queued', 'generating', 'ready', 'failed')),
  constraint games_assets_is_array check (jsonb_typeof(assets) = 'array')
);

comment on table public.games is
  'One generated learning game. Written only by the backend service role.';

comment on column public.games.parent_prompt is
  'What the parent or teacher wants the child to learn.';

comment on column public.games.child_prompt is
  'The game the child asked for, as text. Speech-to-text stays in the frontend.';

comment on column public.games.assets is
  'JSON array of public asset URLs (the game bundle and extra art). Thumbnail and cover have their own columns.';

comment on column public.games.status is
  'queued, generating, ready, or failed.';

create or replace function public.set_games_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create trigger games_set_updated_at
before update on public.games
for each row
execute function public.set_games_updated_at();

alter table public.games enable row level security;

-- No policies. anon and authenticated cannot read or write through the Data API.
-- The service role bypasses RLS and is the only intended client.
revoke all on table public.games from anon, authenticated;
grant select, insert, update, delete on table public.games to service_role;

revoke all on function public.set_games_updated_at() from public, anon, authenticated;
grant execute on function public.set_games_updated_at() to service_role;

-- Public bucket: browsers can load a file from its public URL.
-- Uploads stay closed to anon and authenticated. The API uploads with the
-- service role, which bypasses storage RLS.
-- Local `supabase start` also declares this bucket in config.toml.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'game-assets',
  'game-assets',
  true,
  52428800,
  array[
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'application/json',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'font/woff2'
  ]
)
on conflict (id) do nothing;

create policy game_assets_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'game-assets');
