CREATE TABLE public.kids (
  id text PRIMARY KEY,
  parent_email text NOT NULL,
  name text NOT NULL,
  age integer NOT NULL CHECK (age BETWEEN 3 AND 18),
  color text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id text NOT NULL REFERENCES public.kids (id),
  topic text NOT NULL CHECK (char_length(topic) BETWEEN 1 AND 4000),
  age integer NOT NULL CHECK (age BETWEEN 3 AND 18),
  question_count integer NOT NULL CHECK (question_count IN (5, 10)),
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.task_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals (id) ON DELETE CASCADE,
  goal text NOT NULL,
  tasks jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.play_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id text NOT NULL REFERENCES public.kids (id),
  goal_id uuid REFERENCES public.goals (id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.task_plans (id) ON DELETE SET NULL,
  game_id uuid REFERENCES public.games (id) ON DELETE SET NULL,
  kid_idea text,
  game_option jsonb,
  hints_used integer NOT NULL DEFAULT 0,
  seconds integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE TABLE public.game_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.play_sessions (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('answer', 'finish')),
  task_id text,
  answer text,
  correct boolean,
  player text,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.play_sessions (id) ON DELETE SET NULL,
  kid_id text NOT NULL REFERENCES public.kids (id),
  accuracy_before numeric(4, 3) NOT NULL,
  accuracy_now numeric(4, 3) NOT NULL,
  delta numeric(4, 3) NOT NULL,
  by_skill jsonb NOT NULL,
  weak_skills text[] NOT NULL DEFAULT '{}',
  parent_summary text NOT NULL,
  pedagogue_feedback text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agent_calls (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  agent text NOT NULL CHECK (agent IN ('robo', 'prof', 'spark', 'doodle', 'lens', 'voice')),
  model text NOT NULL,
  endpoint text NOT NULL,
  latency_ms integer NOT NULL,
  input_tokens integer,
  output_tokens integer,
  cost_usd_ticks bigint,
  ok boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX goals_kid_id_idx
  ON public.goals (kid_id);

CREATE INDEX play_sessions_kid_id_idx
  ON public.play_sessions (kid_id);

CREATE INDEX game_events_session_id_idx
  ON public.game_events (session_id);

CREATE INDEX reports_kid_id_created_at_idx
  ON public.reports (kid_id, created_at DESC);

CREATE INDEX agent_calls_created_at_idx
  ON public.agent_calls (created_at DESC);

ALTER TABLE public.kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_calls ENABLE ROW LEVEL SECURITY;

INSERT INTO public.kids (id, parent_email, name, age, color)
VALUES
  ('maja', 'anna@example.com', 'Maja', 8, '#FF6FA5'),
  ('leo', 'anna@example.com', 'Leo', 9, '#4CC9F0');

INSERT INTO public.reports (
  kid_id,
  accuracy_before,
  accuracy_now,
  delta,
  by_skill,
  weak_skills,
  parent_summary,
  pedagogue_feedback,
  created_at
)
VALUES (
  'maja',
  0.400,
  0.400,
  0.000,
  '[{"skill": "2x 5x 10x", "before": 0.7, "now": 0.7},
    {"skill": "3x 4x", "before": 0.5, "now": 0.5},
    {"skill": "Word tasks", "before": 0.4, "now": 0.4},
    {"skill": "8x table", "before": 0.25, "now": 0.25},
    {"skill": "7x table", "before": 0.2, "now": 0.2}]',
  ARRAY['7x table', '8x table'],
  'Seeded first session: Maja got 4 of 10 right.',
  'Start with 2x, 5x and 10x, then add 7x and 8x.',
  now() - interval '7 days'
);
