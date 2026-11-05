import { promptLimits } from '@grok-hack/api-contract';

import { ENGINE_VISUAL_STYLE } from '@/lib/agents/visual-style';
import type { BuildRequest, Task } from '@/lib/flow/types';

const ENGINE_TEMPLATES = {
  collect: 'collect',
  runner: 'runner',
  quiz_battle: 'quiz',
} as const;

const TASKS_HEADER = 'Tasks (question | answer | wrong answers | difficulty | skill):';
const EVENTS_LINE =
  'Events: post every answer and the finish to the parent page as described in game-events.md.';
const FIELD_SEPARATOR = ' | ';
const LINE_BREAKS = /\s*[\r\n]+\s*/g;
const PIPE = /\|/g;

export type EnginePrompts = {
  parentPrompt: string;
  childPrompt: string;
};

export class EnginePromptTooLongError extends Error {
  constructor(field: keyof EnginePrompts, length: number) {
    super(`${field} has ${length} characters, the limit is ${promptLimits.maxLength}`);
    this.name = 'EnginePromptTooLongError';
  }
}

function oneLine(value: string): string {
  return value.replace(LINE_BREAKS, ' ').trim();
}

function cell(value: string): string {
  const flat = oneLine(value);
  return flat.replace(PIPE, '/');
}

function taskLine(task: Task): string {
  const wrongAnswers = task.distractors.map(cell).join(', ');
  const fields = [cell(task.question), cell(task.answer), wrongAnswers, String(task.difficulty)];
  const skill = cell(task.skill);
  return `${task.id}. ${fields.join(FIELD_SEPARATOR)}${FIELD_SEPARATOR}${skill}`;
}

function checkLength(field: keyof EnginePrompts, value: string): void {
  if (value.length > promptLimits.maxLength) {
    throw new EnginePromptTooLongError(field, value.length);
  }
}

export function buildEnginePrompts(request: BuildRequest): EnginePrompts {
  const taskLines = request.plan.tasks.map(taskLine);

  const parentLines = [
    `Learning goal: ${oneLine(request.plan.goal)}`,
    `Kid age: ${request.goal.age}`,
    `Questions: ${request.plan.tasks.length}`,
    `Language: ${request.goal.language}`,
    TASKS_HEADER,
    ...taskLines,
  ];

  const childLines = [
    `Kid's idea: ${oneLine(request.kidIdea)}`,
    `Game type: ${ENGINE_TEMPLATES[request.option.template]}`,
    `Game title: ${oneLine(request.option.title)}`,
    `Pitch: ${oneLine(request.option.pitch)}`,
    `Visual style: ${ENGINE_VISUAL_STYLE}`,
    EVENTS_LINE,
  ];

  const parentPrompt = parentLines.join('\n');
  const childPrompt = childLines.join('\n');

  checkLength('parentPrompt', parentPrompt);
  checkLength('childPrompt', childPrompt);

  return { parentPrompt, childPrompt };
}
