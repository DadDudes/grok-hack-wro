import 'server-only';

import { z } from 'zod';

import type { Hint, HintRequest } from '@/lib/flow/types';
import { createStructuredResponse } from '@/lib/xai/responses';
import type { XaiUsage } from '@/lib/xai/usage';

import { type AgentResult, taggedData, UNTRUSTED_DATA_RULE } from './prompt';

const ROBO_INSTRUCTIONS = [
  'You are Robo, the AI teammate in an EduBotGames game. You play WITH the kids, on their team.',
  'Rules:',
  '- Never give the answer. Never write the correct answer, not even as a number or a word.',
  '- Give one short hint (max 15 words) that helps them think.',
  '- After a second wrong answer, give a stronger hint, still not the answer.',
  '- If there are no wrong answers, the kids just got it right: celebrate in 3-6 words,',
  '  in the game\'s theme, with type "cheer".',
  '- With several players, encourage them to help each other and name who should try next',
  '  in nextPlayer. Use type "turn" when the main point is passing the turn.',
  '  With one player or none, nextPlayer is null.',
  '- Friendly, playful, kid-safe. Write in the language of the question.',
  UNTRUSTED_DATA_RULE,
  'Return only JSON that matches the schema.',
].join('\n');

const ROBO_MAX_OUTPUT_TOKENS = 200;
const HINT_MAX_CHARS = 120;
const MAX_ATTEMPTS = 2;
const LEAK_RETRY_NOTE = 'Your last hint gave away the answer. Write a new hint without it.';
const SAFE_HINT_TEXT = 'Read the question again and go step by step. You can do it!';

const hintSchema = z.object({
  type: z.enum(['hint', 'cheer', 'turn']),
  text: z.string().min(1).max(HINT_MAX_CHARS),
  nextPlayer: z.string().nullable(),
});

const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

function revealsAnswer(text: string, answer: string): boolean {
  const escaped = answer.trim().replace(REGEX_SPECIAL_CHARS, '\\$&');
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu');
  return pattern.test(text);
}

function matchPlayer(name: string | null, players: string[]): string | null {
  if (name === null) {
    return null;
  }

  const wanted = name.trim().toLowerCase();
  const match = players.find((player) => player.toLowerCase() === wanted);
  return match ?? null;
}

function buildInput(request: HintRequest, retryNote: string | null): string {
  const wrongAnswers = request.wrongAnswers.length > 0 ? request.wrongAnswers.join(', ') : 'none';
  const players = request.players.length > 0 ? request.players.join(', ') : 'one kid';

  const lines = [
    taggedData('question', request.task.question),
    `Correct answer (secret, never say it): ${request.task.answer}`,
    `Skill: ${request.task.skill}`,
    `Wrong answers so far (${request.wrongAnswers.length}): ${wrongAnswers}`,
    taggedData('players', players),
  ];

  if (retryNote !== null) {
    lines.push(retryNote);
  }

  return lines.join('\n');
}

export async function giveHint(request: HintRequest): Promise<AgentResult<Hint>> {
  const usage: XaiUsage[] = [];
  let retryNote: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const input = buildInput(request, retryNote);

    const result = await createStructuredResponse({
      agent: 'robo',
      instructions: ROBO_INSTRUCTIONS,
      input,
      schemaName: 'robo_hint',
      schema: hintSchema,
      maxOutputTokens: ROBO_MAX_OUTPUT_TOKENS,
    });
    usage.push(result.usage);

    const text = result.data.text.trim();
    const leaked = revealsAnswer(text, request.task.answer);

    if (!leaked) {
      const nextPlayer = matchPlayer(result.data.nextPlayer, request.players);
      const hint: Hint = { type: result.data.type, text, nextPlayer };
      return { data: hint, usage };
    }

    console.warn(`[robo] hint revealed the answer on attempt ${attempt}`);
    retryNote = LEAK_RETRY_NOTE;
  }

  const fallback: Hint = { type: 'hint', text: SAFE_HINT_TEXT, nextPlayer: null };
  return { data: fallback, usage };
}
