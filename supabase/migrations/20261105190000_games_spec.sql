-- Game spec for the Phaser templates, plus an optional end-of-game result.
-- Apply after 20261105175328_create_games.sql:
--   supabase db push
-- or paste this into the Supabase SQL editor.
-- The API reads `spec` when it serves GET /play/{id}. Without this migration
-- a configured Supabase project cannot finish generation.

alter table public.games
  add column template text,
  add column spec jsonb,
  add column last_result jsonb;

alter table public.games
  add constraint games_template_check
    check (template is null or template in ('collect', 'runner', 'quiz')),
  add constraint games_spec_is_object
    check (spec is null or jsonb_typeof(spec) = 'object'),
  add constraint games_last_result_is_object
    check (last_result is null or jsonb_typeof(last_result) = 'object');

comment on column public.games.template is
  'Phaser template id: collect, runner, or quiz. Null until generation finishes.';

comment on column public.games.spec is
  'Game spec JSON rendered by GET /play/{id}. Written only by the backend service role.';

comment on column public.games.last_result is
  'Latest score posted to POST /api/games/{id}/results. Reserved for a future analyst agent.';
