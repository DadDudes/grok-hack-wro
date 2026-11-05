import 'server-only';

import { z } from 'zod';

import type { GameOption, GameTemplate, SparkRequest, SparkResponse } from '@/lib/flow/types';
import { XaiError } from '@/lib/xai/errors';
import { xaiIsConfigured } from '@/lib/xai/config';
import { createStructuredResponse } from '@/lib/xai/responses';

import { localGameOptions } from './local-fallback';

import { type AgentResult, taggedData, UNTRUSTED_DATA_RULE } from './prompt';
import { gameTemplateSchema } from './schemas';

const SPARK_INSTRUCTIONS = [
  "You are Spark, the kid's agent in EduBotGames. Your job: how can the game be made for this",
  'topic?',
  "You get the learning topic (the goal and its tasks) and the kid's idea. Offer 2 or 3 game",
  "types where the game mechanic itself practises the topic, in the kid's theme, so the kid",
  'can pick one. For example: times tables, catch the egg with the right product; clocks, set',
  'the clock hands; spelling, collect the letters in order.',
  'Templates:',
  "- collect: move around the kid's world and catch the item that answers the task.",
  '- runner: run forward, dodge obstacles and jump through the gate that answers the task.',
  '- quiz_battle: team up with Robo and answer the tasks to beat a friendly boss.',
  'Rules:',
  '- Each option uses a different template: "collect", "runner" or "quiz_battle".',
  "- Keep the kid's theme exactly. The topic stays the parent's goal.",
  "- Title max 4 words. Pitch max 14 words, names the topic and the kid's theme and says how",
  '  the mechanic practises the topic. Kid-friendly, a bit silly.',
  "- Write titles and pitches in the language of the kid's idea.",
  UNTRUSTED_DATA_RULE,
  'Return only JSON that matches the schema.',
].join('\n');

const SPARK_MAX_OUTPUT_TOKENS = 400;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 3;
const TITLE_MAX_CHARS = 40;
const PITCH_MAX_CHARS = 120;

const optionsSchema = z.object({
  options: z
    .array(
      z.object({
        template: gameTemplateSchema,
        title: z.string().min(1).max(TITLE_MAX_CHARS),
        pitch: z.string().min(1).max(PITCH_MAX_CHARS),
      }),
    )
    .min(MIN_OPTIONS)
    .max(MAX_OPTIONS),
});

function uniqueByTemplate(options: GameOption[]): GameOption[] {
  const seen = new Set<GameTemplate>();
  const unique: GameOption[] = [];

  for (const option of options) {
    if (seen.has(option.template)) {
      continue;
    }

    seen.add(option.template);
    unique.push({
      template: option.template,
      title: option.title.trim(),
      pitch: option.pitch.trim(),
    });
  }

  return unique;
}

function buildInput(request: SparkRequest): string {
  const questions = request.plan.tasks.map((task) => task.question);

  return [
    taggedData('goal', request.plan.goal),
    taggedData('tasks', questions.join(' | ')),
    taggedData('kid_idea', request.kidIdea),
    `Kid age: ${request.age}`,
  ].join('\n');
}

export async function suggestGameOptions(
  request: SparkRequest,
): Promise<AgentResult<SparkResponse>> {
  if (!xaiIsConfigured()) {
    return { data: { options: localGameOptions(request) }, usage: [] };
  }

  const input = buildInput(request);

  const result = await createStructuredResponse({
    agent: 'spark',
    instructions: SPARK_INSTRUCTIONS,
    input,
    schemaName: 'game_options',
    schema: optionsSchema,
    maxOutputTokens: SPARK_MAX_OUTPUT_TOKENS,
  });

  const options = uniqueByTemplate(result.data.options);

  if (options.length < MIN_OPTIONS) {
    throw new XaiError('invalid_output', 'spark returned fewer than two different templates');
  }

  return { data: { options }, usage: [result.usage] };
}
