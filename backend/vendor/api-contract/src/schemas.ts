import { z } from 'zod';

/** Keep the SQL checks in `supabase/migrations/*_create_games.sql` aligned with these limits. */
export const promptLimits = {
  minLength: 1,
  maxLength: 4000,
  childAgeMin: 3,
  childAgeMax: 18,
  languageMinLength: 2,
  languageMaxLength: 16,
} as const;

export const gameStatusSchema = z.enum(['queued', 'generating', 'ready', 'failed']);

/** Fixed Phaser templates. The designer agent must pick exactly one. */
export const gameTemplateSchema = z.enum(['collect', 'runner', 'quiz']);

export const gameGraphicsSchema = z.object({
  thumbnailUrl: z.string().min(1).nullable(),
  coverUrl: z.string().min(1).nullable(),
  assetUrls: z.array(z.string().min(1)),
});

/**
 * JSON body for `POST /api/games`.
 * Unknown keys are rejected. Strings are trimmed.
 * Voice input stays in the frontend: send the transcript as `childPrompt`.
 */
export const createGameRequestSchema = z.strictObject({
  parentPrompt: z.string().trim().min(promptLimits.minLength).max(promptLimits.maxLength),
  childPrompt: z.string().trim().min(promptLimits.minLength).max(promptLimits.maxLength),
  childAge: z
    .number()
    .int()
    .min(promptLimits.childAgeMin)
    .max(promptLimits.childAgeMax)
    .optional(),
  language: z
    .string()
    .trim()
    .min(promptLimits.languageMinLength)
    .max(promptLimits.languageMaxLength)
    .optional(),
});

/** One generated game. Returned by `POST /api/games` and `GET /api/games/:id`. */
export const gameSchema = z.object({
  id: z.uuid(),
  parentPrompt: z.string(),
  childPrompt: z.string(),
  childAge: z.number().int().nullable(),
  language: z.string().nullable(),
  status: gameStatusSchema,
  /** Null until generation has chosen a template. */
  template: gameTemplateSchema.nullable(),
  /**
   * Absolute URL of `GET /play/{id}` once the game is ready.
   * Null while `queued` or `generating`, and null when `failed`.
   */
  gameUrl: z.string().min(1).nullable(),
  graphics: gameGraphicsSchema,
  error: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const apiErrorCodeSchema = z.enum([
  'invalid_json',
  'validation_error',
  'not_found',
  'internal_error',
]);

export const fieldErrorSchema = z.object({
  path: z.string(),
  message: z.string(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.array(fieldErrorSchema).optional(),
  }),
});

export const healthResponseSchema = z.object({
  ok: z.literal(true),
  service: z.literal('games-api'),
  storage: z.enum(['memory', 'supabase']),
});

/** Body for `POST /api/games/:id/results`. The in-game end screen sends this. */
export const gameResultRequestSchema = z.strictObject({
  score: z.number().int().min(0).max(1000),
  total: z.number().int().min(1).max(100),
  correct: z.number().int().min(0).max(100),
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
});

export const gameResultResponseSchema = z.object({
  ok: z.literal(true),
});

export const apiPaths = {
  health: '/api/health',
  games: '/api/games',
  game: (id: string) => `/api/games/${id}`,
  gameResults: (id: string) => `/api/games/${id}/results`,
  play: (id: string) => `/play/${id}`,
} as const;
