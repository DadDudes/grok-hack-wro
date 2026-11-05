import type { z } from 'zod';

import type {
  apiErrorCodeSchema,
  apiErrorSchema,
  createGameRequestSchema,
  fieldErrorSchema,
  gameGraphicsSchema,
  gameResultRequestSchema,
  gameResultResponseSchema,
  gameSchema,
  gameStatusSchema,
  gameTemplateSchema,
  healthResponseSchema,
} from './schemas.ts';

export type CreateGameRequest = z.infer<typeof createGameRequestSchema>;
export type Game = z.infer<typeof gameSchema>;
export type GameStatus = z.infer<typeof gameStatusSchema>;
export type GameTemplate = z.infer<typeof gameTemplateSchema>;
export type GameGraphics = z.infer<typeof gameGraphicsSchema>;
export type GameResultRequest = z.infer<typeof gameResultRequestSchema>;
export type GameResultResponse = z.infer<typeof gameResultResponseSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type FieldError = z.infer<typeof fieldErrorSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
