import type { CreateGameTask, GameTemplate, RequestedTemplate } from '@grok-hack/api-contract';

import { isChildSafeText } from '@/lib/agents/safety';

const QUESTIONS_LINE = /^Questions:\s*(\d{1,2})\s*$/m;
const GAME_TYPE_LINE = /^Game type:\s*(collect|runner|quiz|quiz_battle)\s*$/im;
const TITLE_LINE = /^Game title:\s*(.+?)\s*$/m;
const TASK_LINE =
  /^([A-Za-z0-9_-]{1,40})\.\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*([123])\s*\|\s*(.*?)\s*$/;

export type LessonOverrides = {
  template?: GameTemplate;
  lockTemplate: boolean;
  questionCount?: number;
  tasks?: CreateGameTask[];
  title?: string;
};

export function canonicalTemplate(value: string | undefined): GameTemplate | undefined {
  const token = value?.trim().toLowerCase();
  if (token === 'quiz_battle' || token === 'quiz') return 'quiz';
  if (token === 'collect' || token === 'runner') return token;
  return undefined;
}

function parseQuestionCount(parentPrompt: string): number | undefined {
  const match = QUESTIONS_LINE.exec(parentPrompt);
  if (!match) return undefined;
  const count = Number(match[1]);
  if (!Number.isInteger(count) || count < 1 || count > 10) return undefined;
  return count;
}

function parseTitle(childPrompt: string): string | undefined {
  const match = TITLE_LINE.exec(childPrompt);
  if (!match) return undefined;
  const clean = match[1].replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  if (!clean || !isChildSafeText(clean)) return undefined;
  return clean.slice(0, 80);
}

function parseTasks(parentPrompt: string): CreateGameTask[] {
  const tasks: CreateGameTask[] = [];
  for (const line of parentPrompt.split('\n')) {
    const match = TASK_LINE.exec(line.trim());
    if (!match) continue;
    const distractors = match[4]
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 3);
    if (distractors.length < 2) continue;
    const difficulty = Number(match[5]);
    if (difficulty !== 1 && difficulty !== 2 && difficulty !== 3) continue;
    tasks.push({
      id: match[1],
      question: match[2].trim(),
      answer: match[3].trim(),
      distractors,
      difficulty,
      skill: match[6].trim() || undefined,
    });
  }
  return tasks.slice(0, 10);
}

function tasksAreSafe(tasks: CreateGameTask[]): boolean {
  return tasks.every((task) =>
    isChildSafeText([task.id, task.question, task.answer, task.skill ?? '', ...task.distractors].join('\n')),
  );
}

export function lessonOverrides(input: {
  parentPrompt: string;
  childPrompt: string;
  template?: RequestedTemplate;
  questionCount?: number;
  tasks?: CreateGameTask[];
}): LessonOverrides {
  const explicitTemplate = canonicalTemplate(input.template);
  const parsedTemplate = canonicalTemplate(GAME_TYPE_LINE.exec(input.childPrompt)?.[1]);
  const template = explicitTemplate ?? parsedTemplate;
  const lockTemplate = template !== undefined;

  const questionCount = input.questionCount ?? parseQuestionCount(input.parentPrompt);
  const supplied = input.tasks && input.tasks.length > 0 ? input.tasks : parseTasks(input.parentPrompt);
  const tasks = supplied.length > 0 && tasksAreSafe(supplied) ? supplied.slice(0, 10) : undefined;

  return {
    template,
    lockTemplate,
    questionCount,
    tasks,
    title: parseTitle(input.childPrompt),
  };
}
