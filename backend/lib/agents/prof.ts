import 'server-only';

import { z } from 'zod';

import type { Goal, QuestionCount, Task, TaskPlan } from '@/lib/flow/types';
import { XaiError } from '@/lib/xai/errors';
import { xaiIsConfigured } from '@/lib/xai/config';
import { createStructuredResponse } from '@/lib/xai/responses';

import { localTaskPlan } from './local-fallback';

import { type AgentResult, taggedData, UNTRUSTED_DATA_RULE } from './prompt';
import { difficultySchema } from './schemas';

const PROF_INSTRUCTIONS = [
  "You are Prof, the parent's agent in EduBotGames. Your job: what does the child want or need",
  'to learn?',
  'The parent writes free text that may be vague, for example "she struggles with times tables".',
  'Turn it into one clear, age-appropriate learning goal (max 8 words) and short tasks for it.',
  'Rules:',
  '- goal: one clear learning goal, max 8 words, in the language given by its code.',
  "- Match the kid's age. Keep each question under 12 words.",
  '- Make exactly the number of tasks asked for, from easy to hard (difficulty 1-3).',
  '- Each task has exactly one correct answer and 3 wrong answers that are plausible mistakes.',
  '- The wrong answers differ from the correct answer and from each other.',
  '- Keep answers short: a number, a word or a few words.',
  '- Give each task a concrete skill label of 2 to 4 words that names the sub-skill, for example',
  '  "7x table", "reading the clock" or "word problems". Tasks that train the same thing share it.',
  '- Write the goal, questions, answers and skills in the language given by its code.',
  UNTRUSTED_DATA_RULE,
  'Return only JSON that matches the schema.',
].join('\n');

const PROF_MAX_OUTPUT_TOKENS = 2500;
const GOAL_MAX_CHARS = 80;
const QUESTION_MAX_CHARS = 120;
const ANSWER_MAX_CHARS = 60;
const SKILL_MAX_CHARS = 40;
const DISTRACTOR_COUNT = 3;
const TASK_ID_PREFIX = 't';

const modelTaskSchema = z.object({
  question: z.string().min(1).max(QUESTION_MAX_CHARS),
  answer: z.string().min(1).max(ANSWER_MAX_CHARS),
  distractors: z.array(z.string().min(1).max(ANSWER_MAX_CHARS)).length(DISTRACTOR_COUNT),
  difficulty: difficultySchema,
  skill: z.string().min(1).max(SKILL_MAX_CHARS),
});

type ModelTask = z.infer<typeof modelTaskSchema>;

function planSchemaFor(count: QuestionCount) {
  return z.object({
    goal: z.string().min(1).max(GOAL_MAX_CHARS),
    tasks: z.array(modelTaskSchema).length(count),
  });
}

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

function hasDistinctAnswers(task: ModelTask): boolean {
  const answers = [task.answer, ...task.distractors];
  const normalized = new Set(answers.map(normalizeAnswer));
  return normalized.size === answers.length;
}

function toTask(task: ModelTask, index: number): Task {
  const [first, second, third] = task.distractors;

  return {
    id: `${TASK_ID_PREFIX}${index + 1}`,
    question: task.question.trim(),
    answer: task.answer.trim(),
    distractors: [first.trim(), second.trim(), third.trim()],
    difficulty: task.difficulty,
    skill: task.skill.trim(),
  };
}

function buildInput(goal: Goal): string {
  return [
    taggedData('parent_text', goal.topic),
    `Kid age: ${goal.age}`,
    `Number of tasks: ${goal.questionCount}`,
    `Language code: ${goal.language}`,
  ].join('\n');
}

export async function createTaskPlan(goal: Goal): Promise<AgentResult<TaskPlan>> {
  if (!xaiIsConfigured()) {
    return { data: localTaskPlan(goal), usage: [] };
  }

  const schema = planSchemaFor(goal.questionCount);
  const input = buildInput(goal);

  const result = await createStructuredResponse({
    agent: 'prof',
    instructions: PROF_INSTRUCTIONS,
    input,
    schemaName: 'task_plan',
    schema,
    maxOutputTokens: PROF_MAX_OUTPUT_TOKENS,
  });

  const modelTasks = result.data.tasks;
  const brokenTask = modelTasks.find((task) => !hasDistinctAnswers(task));

  if (brokenTask !== undefined) {
    throw new XaiError('invalid_output', `prof task repeats an answer: ${brokenTask.question}`);
  }

  const sortedTasks = [...modelTasks].sort((left, right) => left.difficulty - right.difficulty);
  const tasks = sortedTasks.map(toTask);

  const plan: TaskPlan = {
    goal: result.data.goal.trim(),
    age: goal.age,
    tasks,
  };

  return { data: plan, usage: [result.usage] };
}
