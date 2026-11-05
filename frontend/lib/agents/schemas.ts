import { promptLimits } from '@grok-hack/api-contract';
import { z } from 'zod';

import type {
  BuildRequest,
  GameEvent,
  GameOption,
  Goal,
  HintRequest,
  LensRequest,
  OptionPreviewRequest,
  SessionResult,
  SparkRequest,
  Task,
  TaskPlan,
} from '@/lib/flow/types';

export const requestLimits = {
  idMax: 64,
  nameMax: 40,
  topicMax: 300,
  kidIdeaMax: 400,
  questionMax: 200,
  answerMax: 80,
  skillMax: 60,
  titleMax: 60,
  pitchMax: 160,
  tasksMax: 20,
  playersMax: 6,
  wrongAnswersMax: 10,
  eventsMax: 500,
  timestampMax: 40,
  sessionSecondsMax: 86_400,
  optionsMax: 3,
} as const;

const trimmedText = (max: number) => z.string().trim().min(1).max(max);

const ageSchema = z.int().min(promptLimits.childAgeMin).max(promptLimits.childAgeMax);

const languageSchema = z
  .string()
  .trim()
  .min(promptLimits.languageMinLength)
  .max(promptLimits.languageMaxLength);

const answerText = trimmedText(requestLimits.answerMax);

export const difficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const gameTemplateSchema = z.enum(['collect', 'runner', 'quiz_battle']);

export const goalSchema = z.object({
  kidId: trimmedText(requestLimits.idMax),
  topic: trimmedText(requestLimits.topicMax),
  age: ageSchema,
  questionCount: z.union([z.literal(5), z.literal(10)]),
  language: languageSchema,
}) satisfies z.ZodType<Goal>;

export const profRequestSchema = goalSchema.extend({
  feedback: z.string().trim().max(requestLimits.topicMax).optional(),
});

export const taskSchema = z.object({
  id: trimmedText(requestLimits.idMax),
  question: trimmedText(requestLimits.questionMax),
  answer: answerText,
  distractors: z.tuple([answerText, answerText, answerText]),
  difficulty: difficultySchema,
  skill: trimmedText(requestLimits.skillMax),
}) satisfies z.ZodType<Task>;

export const taskPlanSchema = z.object({
  goal: trimmedText(requestLimits.topicMax),
  age: ageSchema,
  tasks: z.array(taskSchema).min(1).max(requestLimits.tasksMax),
}) satisfies z.ZodType<TaskPlan>;

export const sparkRequestSchema = z.object({
  kidIdea: trimmedText(requestLimits.kidIdeaMax),
  age: ageSchema,
  plan: taskPlanSchema,
}) satisfies z.ZodType<SparkRequest>;

export const gameOptionSchema = z.object({
  template: gameTemplateSchema,
  title: trimmedText(requestLimits.titleMax),
  pitch: trimmedText(requestLimits.pitchMax),
}) satisfies z.ZodType<GameOption>;

export const optionPreviewRequestSchema = z.object({
  kidIdea: trimmedText(requestLimits.kidIdeaMax),
  topic: trimmedText(requestLimits.topicMax),
  options: z.array(gameOptionSchema).min(1).max(requestLimits.optionsMax),
}) satisfies z.ZodType<OptionPreviewRequest>;

export const buildRequestSchema = z.object({
  goal: goalSchema,
  plan: taskPlanSchema,
  kidIdea: trimmedText(requestLimits.kidIdeaMax),
  option: gameOptionSchema,
}) satisfies z.ZodType<BuildRequest>;

export const hintRequestSchema = z.object({
  task: taskSchema,
  wrongAnswers: z.array(answerText).max(requestLimits.wrongAnswersMax),
  players: z.array(trimmedText(requestLimits.nameMax)).max(requestLimits.playersMax),
}) satisfies z.ZodType<HintRequest>;

export const gameEventSchema = z.object({
  source: z.literal('edubotgames-game'),
  type: z.enum(['answer', 'finish']),
  taskId: z.string().max(requestLimits.idMax).nullable(),
  answer: z.string().max(requestLimits.answerMax).nullable(),
  correct: z.boolean().nullable(),
  player: z.string().max(requestLimits.nameMax).nullable(),
  at: z.string().max(requestLimits.timestampMax),
}) satisfies z.ZodType<GameEvent>;

export const sessionResultSchema = z.object({
  gameId: trimmedText(requestLimits.idMax),
  kidId: trimmedText(requestLimits.idMax),
  events: z.array(gameEventSchema).max(requestLimits.eventsMax),
  hintsUsed: z.int().min(0),
  seconds: z.number().min(0).max(requestLimits.sessionSecondsMax),
}) satisfies z.ZodType<SessionResult>;

export const lensRequestSchema = z.object({
  plan: taskPlanSchema,
  session: sessionResultSchema,
  previous: sessionResultSchema.nullable(),
}) satisfies z.ZodType<LensRequest>;

export const transcribeFormSchema = z.object({
  audio: z.instanceof(File),
  language: languageSchema.optional(),
});
