export type QuickGoal = {
  label: string;
  goal: string;
  phrase: string;
};

export const QUICK_GOALS: QuickGoal[] = [
  { label: 'Multiplication', goal: 'Multiplication up to 50', phrase: 'multiplication' },
  { label: 'Spelling', goal: 'Spelling tricky words', phrase: 'spelling' },
  { label: 'English words', goal: 'English words: animals', phrase: 'English words' },
  { label: 'Clocks', goal: 'Telling the time on a clock', phrase: 'clocks' },
];

export const GOAL_MIN_LENGTH = 3;
export const GOAL_MAX_LENGTH = 120;

function matchQuickGoal(topic: string): QuickGoal | null {
  const normalized = topic.trim().toLowerCase();

  for (const quick of QUICK_GOALS) {
    const label = quick.label.toLowerCase();
    const isSameGoal = normalized === quick.goal.toLowerCase();
    const startsWithLabel = normalized.startsWith(label);

    if (isSameGoal || startsWithLabel) {
      return quick;
    }
  }

  return null;
}

export function topicLabel(topic: string): string {
  const quick = matchQuickGoal(topic);

  if (quick === null) {
    return topic.trim();
  }

  return quick.label;
}

export function topicPhrase(topic: string): string {
  const quick = matchQuickGoal(topic);

  if (quick !== null) {
    return quick.phrase;
  }

  const trimmed = topic.trim();
  const first = trimmed.charAt(0).toLowerCase();
  return `${first}${trimmed.slice(1)}`;
}

export function sparkQuestion(topic: string): string {
  return `How should we play ${topicPhrase(topic)}?`;
}
