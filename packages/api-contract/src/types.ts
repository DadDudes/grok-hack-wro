import type { z } from 'zod';

import type {
  apiErrorCodeSchema,
  apiErrorSchema,
  createGameRequestSchema,
  fieldErrorSchema,
  gameGraphicsSchema,
  gameSchema,
  gameStatusSchema,
  healthResponseSchema,
} from './schemas.ts';

export type CreateGameRequest = z.infer<typeof createGameRequestSchema>;
export type Game = z.infer<typeof gameSchema>;
export type GameStatus = z.infer<typeof gameStatusSchema>;
export type GameGraphics = z.infer<typeof gameGraphicsSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type FieldError = z.infer<typeof fieldErrorSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
