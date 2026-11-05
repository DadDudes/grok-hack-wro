import type { LensRequest, Report, SessionResult, SkillScore, TaskPlan } from '@/lib/flow/types';

const WEAK_SKILL_THRESHOLD = 0.8;
const MAX_WEAK_SKILLS = 2;
const PERCENT = 100;

type FirstTries = Map<string, boolean>;

function roundScore(value: number): number {
  return Math.round(value * PERCENT) / PERCENT;
}

function asPercent(value: number): string {
  return `${Math.round(value * PERCENT)}%`;
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

function skillsInOrder(plan: TaskPlan): Array<{ skill: string; taskIds: string[] }> {
  const skills: Array<{ skill: string; taskIds: string[] }> = [];

  for (const task of plan.tasks) {
    const existing = skills.find((item) => item.skill === task.skill);

    if (existing === undefined) {
      skills.push({ skill: task.skill, taskIds: [task.id] });
      continue;
    }

    existing.taskIds.push(task.id);
  }

  return skills;
}

function skillScores(plan: TaskPlan, now: FirstTries, before: FirstTries | null): SkillScore[] {
  return skillsInOrder(plan).map((item) => {
    const nowScore = scoreOf(now, item.taskIds);
    const beforeScore = nowScore === null ? null : scoreOf(before, item.taskIds);
    return { skill: item.skill, before: beforeScore, now: nowScore };
  });
}

function weakSkills(scores: SkillScore[]): string[] {
  const weak = scores.filter((score) => score.now !== null && score.now < WEAK_SKILL_THRESHOLD);
  const sorted = [...weak].sort((left, right) => (left.now ?? 0) - (right.now ?? 0));
  return sorted.slice(0, MAX_WEAK_SKILLS).map((score) => score.skill);
}

function prose(plan: TaskPlan, accuracyNow: number | null, weak: string[]): Pick<Report, 'parentSummary' | 'pedagogueFeedback'> {
  if (accuracyNow === null) {
    return {
      parentSummary: 'No answers this time, so there is no score yet.',
      pedagogueFeedback: `No new answers. Keep the current tasks for: ${plan.goal}`,
    };
  }

  const now = asPercent(accuracyNow);

  if (weak.length === 0) {
    return {
      parentSummary: `First-try accuracy this session is ${now}.`,
      pedagogueFeedback: `Keep the current mix of tasks for: ${plan.goal}.`,
    };
  }

  const names = weak.join(' and ');
  return {
    parentSummary: `First-try accuracy this session is ${now}. Practise ${names} next.`,
    pedagogueFeedback: `Practise ${names} on this goal: ${plan.goal}.`,
  };
}

export function sessionReport(request: LensRequest): Report {
  const now = firstTryResults(request.session);
  const before = request.previous === null ? null : firstTryResults(request.previous);
  const answeredIds = [...now.keys()];
  const accuracyNow = scoreOf(now, null);
  const accuracyBefore = accuracyNow === null ? null : scoreOf(before, answeredIds);
  const bySkill = skillScores(request.plan, now, before);
  const weak = accuracyNow === null ? [] : weakSkills(bySkill);
  const delta =
    accuracyNow === null || accuracyBefore === null ? null : roundScore(accuracyNow - accuracyBefore);
  const words = prose(request.plan, accuracyNow, weak);

  return {
    accuracyBefore,
    accuracyNow,
    delta,
    bySkill,
    weakSkills: weak,
    parentSummary: words.parentSummary,
    pedagogueFeedback: words.pedagogueFeedback,
    measured: accuracyNow !== null,
  };
}
