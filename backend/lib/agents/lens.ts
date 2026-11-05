import 'server-only';

import { z } from 'zod';

import { sessionReport } from '@/lib/flow/sessionReport';
import type { LensRequest, Report } from '@/lib/flow/types';
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
const PERCENT = 100;
const MAX_SUMMARY_SENTENCES = 2;
const SENTENCE_BREAK = /(?<=[.!?])\s+/;
const FOREIGN_MARKERS = ['dinosaur', '7x table', '8x table', 'multiplication', '40%', '75%'];

const summarySchema = z.object({
  parentSummary: z.string().min(1).max(PARENT_SUMMARY_MAX_CHARS),
  pedagogueFeedback: z.string().min(1).max(FEEDBACK_MAX_CHARS),
});

function asPercent(value: number): string {
  const percent = Math.round(value * PERCENT);
  return `${percent}%`;
}

function firstSentences(text: string, count: number): string {
  const sentences = text.trim().split(SENTENCE_BREAK);
  const kept = sentences.slice(0, count);
  return kept.join(' ');
}

function planContext(request: LensRequest): string {
  const tasks = request.plan.tasks.map((task) => `${task.question} ${task.skill}`).join(' ');
  return `${request.plan.goal} ${tasks}`.toLowerCase();
}

function proseStaysOnPlan(text: string, request: LensRequest): boolean {
  const context = planContext(request);
  const foreign = FOREIGN_MARKERS.some(
    (marker) => text.toLowerCase().includes(marker) && !context.includes(marker),
  );
  return !foreign;
}

function buildInput(request: LensRequest, report: Report): string {
  const firstSession = report.accuracyBefore === null ? 'yes' : 'no';
  const weakSkills = report.weakSkills.length > 0 ? report.weakSkills.join(', ') : 'none';
  const playSeconds = Math.round(request.session.seconds);
  const nowText = report.accuracyNow === null ? 'none' : asPercent(report.accuracyNow);
  const beforeText = report.accuracyBefore === null ? 'none' : asPercent(report.accuracyBefore);
  const skillLines = report.bySkill.map((score) => {
    if (score.now === null) {
      return `- ${score.skill}: not played`;
    }

    const now = asPercent(score.now);
    const before = score.before === null ? 'none' : asPercent(score.before);
    return `- ${score.skill}: before ${before}, now ${now}`;
  });

  return [
    taggedData('goal', request.plan.goal),
    `Kid age: ${request.plan.age}`,
    `First session: ${firstSession}`,
    `First-try accuracy now: ${nowText}`,
    `First-try accuracy before: ${beforeText}`,
    `Hints used: ${request.session.hintsUsed}`,
    `Play time: ${playSeconds} seconds`,
    'By skill:',
    ...skillLines,
    `Weakest skills: ${weakSkills}`,
  ].join('\n');
}

export async function writeReport(request: LensRequest): Promise<AgentResult<Report>> {
  const base = sessionReport(request);

  if (!base.measured) {
    return { data: base, usage: [] };
  }

  try {
    const input = buildInput(request, base);
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
    const prose = `${parentSummary} ${pedagogueFeedback}`;

    if (!proseStaysOnPlan(prose, request)) {
      return { data: base, usage: [result.usage] };
    }

    const report: Report = { ...base, parentSummary, pedagogueFeedback };
    return { data: report, usage: [result.usage] };
  } catch (error) {
    console.error('Lens summary unavailable, keeping the measured session', error);
    return { data: base, usage: [] };
  }
}
