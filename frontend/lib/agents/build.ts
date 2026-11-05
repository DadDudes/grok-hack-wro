import 'server-only';

import type { Game } from '@grok-hack/api-contract';

import type { AgentEvent, AgentKey, AgentState, BuildEvent, BuildRequest } from '@/lib/flow/types';
import { createAndWait } from '@/lib/games/direct';
import { GamesApiError } from '@/lib/games-api/client';
import { buildEnginePrompts, EnginePromptTooLongError } from '@/lib/games-api/prompts';
import { XaiError } from '@/lib/xai/errors';
import { errorReason } from '@/lib/xai/transport';

import { drawScene } from './doodle';

export type EmitBuildEvent = (event: BuildEvent) => void;

type GameOutcome = { ok: true; game: Game } | { ok: false; message: string };

const GAME_FAILED_MESSAGE = 'The game could not be built. Try again.';
const PROMPT_TOO_LONG_MESSAGE = 'The tasks are too long for the game engine. Try fewer tasks.';

function agentEvent(agent: AgentKey, state: AgentState, message: string): AgentEvent {
  const at = new Date().toISOString();
  return { type: 'agent', agent, state, message, at };
}

function safeMessageFor(error: unknown): string {
  if (error instanceof GamesApiError || error instanceof XaiError) {
    return error.safeMessage;
  }

  if (error instanceof EnginePromptTooLongError) {
    return PROMPT_TOO_LONG_MESSAGE;
  }

  return GAME_FAILED_MESSAGE;
}

async function buildGame(request: BuildRequest, signal: AbortSignal, origin: string): Promise<GameOutcome> {
  try {
    const prompts = buildEnginePrompts(request);
    const input = {
      parentPrompt: prompts.parentPrompt,
      childPrompt: prompts.childPrompt,
      childAge: request.goal.age,
      language: request.goal.language,
      questionCount: request.goal.questionCount,
      template: request.option.template,
      tasks: request.plan.tasks.map((task) => ({
        id: task.id,
        question: task.question,
        answer: task.answer,
        distractors: [...task.distractors],
        difficulty: task.difficulty,
        skill: task.skill,
      })),
    };
    const finished = await createAndWait(input, signal, origin);

    if (finished.status === 'failed') {
      return { ok: false, message: finished.error ?? GAME_FAILED_MESSAGE };
    }

    return { ok: true, game: finished };
  } catch (error) {
    const reason = errorReason(error);
    console.error(`[build] game engine step failed: ${reason}`);
    return { ok: false, message: safeMessageFor(error) };
  }
}

async function drawPreview(request: BuildRequest, emit: EmitBuildEvent): Promise<void> {
  const title = request.option.title;
  emit(agentEvent('doodle', 'working', `Drawing ${title} in your world...`));

  try {
    const scene = await drawScene({
      kidIdea: request.kidIdea,
      topic: request.plan.goal,
      option: request.option,
    });
    emit({ type: 'preview', imageUrl: scene.data });
    emit(agentEvent('doodle', 'done', 'Art is ready'));
  } catch (error) {
    const reason = errorReason(error);
    console.error(`[build] doodle preview failed: ${reason}`);
    emit(agentEvent('doodle', 'done', 'No preview this time, the game still gets its art'));
  }
}

export async function runBuild(
  request: BuildRequest,
  emit: EmitBuildEvent,
  signal: AbortSignal,
  origin: string,
): Promise<void> {
  const gameOutcome = buildGame(request, signal, origin);
  const taskCount = request.plan.tasks.length;
  const title = request.option.title;

  emit(agentEvent('prof', 'done', `${taskCount} tasks, easy to hard`));
  emit(agentEvent('spark', 'working', `Weaving the tasks into ${title}`));
  emit(agentEvent('spark', 'done', `${title}: ${request.option.pitch}`));

  await drawPreview(request, emit);

  emit(agentEvent('robo', 'working', 'Robo joins you in the game'));

  const outcome = await gameOutcome;

  if (!outcome.ok) {
    emit({ type: 'failed', message: outcome.message });
    return;
  }

  emit({ type: 'ready', game: outcome.game });
}
