import 'server-only';

import { z } from 'zod';

import { demoReport } from '@/lib/flow/mock';
import type { LensRequest, Report, SessionResult, SkillScore, TaskPlan } from '@/lib/flow/types';
import { createStructuredResponse } from '@/lib/xai/responses';

import { type AgentResult, taggedData, UNTRUSTED_DATA_RULE } from './prompt';

const LENS_INSTRUCTIONS = [
  'You are Lens, the Analyst agent of EduBotGames. You compare this game session with the',
  'previous one and report progress to the parent.',
  'Rules:',
  '- The accuracy numbers are already computed. Use them as given; do not invent numbers.',
  '- Name the 1-2 weakest skills and one concrete next step.',
  '- parentSummary: 1 or 2 short sentences, max 35 words, plain words, positive but honest.',
  '- pedagogueFeedback: one or two sentences for Prof, the Pedagogue agent, on which skills',
  '  need more tasks and how to adjust difficulty next time.',
  '- If this is the first session, say so instead of claiming progress.',
  '- Write in the language of the learning goal.',
  UNTRUSTED_DATA_RULE,
  'Return only JSON that matches the schema.',
].join('\n');

const LENS_MAX_OUTPUT_TOKENS = 400;
const PARENT_SUMMARY_MAX_CHARS = 240;
const FEEDBACK_MAX_CHARS = 300;
const WEAK_SKILL_THRESHOLD = 0.8;
const MAX_WEAK_SKILLS = 2;
const PERCENT = 100;
const MAX_SUMMARY_SENTENCES = 2;
const SENTENCE_BREAK = /(?<=[.!?])\s+/;

const summarySchema = z.object({
  parentSummary: z.string().min(1).max(PARENT_SUMMARY_MAX_CHARS),
  pedagogueFeedback: z.string().min(1).max(FEEDBACK_MAX_CHARS),
});

type FirstTries = Map<string, boolean>;

type ReportNumbers = Omit<Report, 'parentSummary' | 'pedagogueFeedback'>;

function roundScore(value: number): number {
  return Math.round(value * PERCENT) / PERCENT;
}

function asPercent(value: number): string {
  const percent = Math.round(value * PERCENT);
  return `${percent}%`;
}

function firstTryResults(session: SessionResult): FirstTries {
  const results: FirstTries = new Map();

  for (const event of session.events) {
    if (event.type !== 'answer' || event.taskId === null || event.correct === null) {
      continue;
    }

    if (results.has(event.taskId)) {
      continue;
    }

    results.set(event.taskId, event.correct);
  }

  return results;
}

function scoreOf(results: FirstTries | null, taskIds: string[] | null): number | null {
  if (results === null) {
    return null;
  }

  let answered = 0;
  let correct = 0;

  for (const [taskId, isCorrect] of results) {
    if (taskIds !== null && !taskIds.includes(taskId)) {
      continue;
    }

    answered += 1;

    if (isCorrect) {
      correct += 1;
    }
  }

  if (answered === 0) {
    return null;
  }

  return roundScore(correct / answered);
}

function taskIdsBySkill(plan: TaskPlan): Map<string, string[]> {
  const skills = new Map<string, string[]>();

  for (const task of plan.tasks) {
    const ids = skills.get(task.skill) ?? [];
    ids.push(task.id);
    skills.set(task.skill, ids);
  }

  return skills;
}

function scoreSkills(plan: TaskPlan, now: FirstTries, before: FirstTries | null): SkillScore[] {
  const scores: SkillScore[] = [];
  const skills = taskIdsBySkill(plan);

  for (const [skill, taskIds] of skills) {
    const nowScore = scoreOf(now, taskIds);

    if (nowScore === null) {
      continue;
    }

    const beforeScore = scoreOf(before, taskIds) ?? nowScore;
    scores.push({ skill, before: beforeScore, now: nowScore });
  }

  return scores;
}

function firstSentences(text: string, count: number): string {
  const sentences = text.trim().split(SENTENCE_BREAK);
  const kept = sentences.slice(0, count);
  return kept.join(' ');
}

function findWeakSkills(scores: SkillScore[]): string[] {
  const weak = scores.filter((score) => score.now < WEAK_SKILL_THRESHOLD);
  const sorted = [...weak].sort((left, right) => left.now - right.now);
  const weakest = sorted.slice(0, MAX_WEAK_SKILLS);
  return weakest.map((score) => score.skill);
}

function computeNumbers(request: LensRequest, now: FirstTries): ReportNumbers {
  const before = request.previous === null ? null : firstTryResults(request.previous);
  const accuracyNow = scoreOf(now, null) ?? 0;
  const accuracyBefore = scoreOf(before, null) ?? accuracyNow;
  const bySkill = scoreSkills(request.plan, now, before);
  const weakSkills = findWeakSkills(bySkill);
  const delta = roundScore(accuracyNow - accuracyBefore);

  return { accuracyBefore, accuracyNow, delta, bySkill, weakSkills };
}

function buildInput(request: LensRequest, numbers: ReportNumbers): string {
  const firstSession = request.previous === null ? 'yes' : 'no';
  const weakSkills = numbers.weakSkills.length > 0 ? numbers.weakSkills.join(', ') : 'none';
  const playSeconds = Math.round(request.session.seconds);
  const skillLines = numbers.bySkill.map((score) => {
    const before = asPercent(score.before);
    const now = asPercent(score.now);
    return `- ${score.skill}: before ${before}, now ${now}`;
  });

  return [
    taggedData('goal', request.plan.goal),
    `Kid age: ${request.plan.age}`,
    `First session: ${firstSession}`,
    `First-try accuracy now: ${asPercent(numbers.accuracyNow)}`,
    `First-try accuracy before: ${asPercent(numbers.accuracyBefore)}`,
    `Hints used: ${request.session.hintsUsed}`,
    `Play time: ${playSeconds} seconds`,
    'By skill:',
    ...skillLines,
    `Weakest skills: ${weakSkills}`,
  ].join('\n');
}

export async function writeReport(request: LensRequest): Promise<AgentResult<Report>> {
  const now = firstTryResults(request.session);

  if (now.size === 0) {
    return { data: demoReport, usage: [] };
  }

  const numbers = computeNumbers(request, now);
  const input = buildInput(request, numbers);

  const result = await createStructuredResponse({
    agent: 'lens',
    instructions: LENS_INSTRUCTIONS,
    input,
    schemaName: 'lens_summary',
    schema: summarySchema,
    maxOutputTokens: LENS_MAX_OUTPUT_TOKENS,
  });

  const parentSummary = firstSentences(result.data.parentSummary, MAX_SUMMARY_SENTENCES);
  const pedagogueFeedback = result.data.pedagogueFeedback.trim();
  const report: Report = { ...numbers, parentSummary, pedagogueFeedback };
  return { data: report, usage: [result.usage] };
}
