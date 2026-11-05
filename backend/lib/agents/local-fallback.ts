import type { GameOption, Goal, SparkRequest, Task, TaskPlan } from '@/lib/flow/types';

const MULTIPLICATION: Task[] = [
  { id: 't1', question: '2 x 5 = ?', answer: '10', distractors: ['7', '12', '25'], difficulty: 1, skill: '2x table' },
  { id: 't2', question: '3 x 4 = ?', answer: '12', distractors: ['7', '14', '9'], difficulty: 1, skill: '3x table' },
  { id: 't3', question: '5 x 6 = ?', answer: '30', distractors: ['25', '35', '11'], difficulty: 1, skill: '5x table' },
  { id: 't4', question: '4 x 7 = ?', answer: '28', distractors: ['24', '32', '11'], difficulty: 2, skill: '4x table' },
  { id: 't5', question: '6 x 7 = ?', answer: '42', distractors: ['36', '48', '13'], difficulty: 2, skill: '7x table' },
  { id: 't6', question: '8 x 4 = ?', answer: '32', distractors: ['28', '36', '12'], difficulty: 2, skill: '8x table' },
  { id: 't7', question: '7 x 5 = ?', answer: '35', distractors: ['30', '40', '12'], difficulty: 2, skill: '7x table' },
  { id: 't8', question: '8 x 6 = ?', answer: '48', distractors: ['42', '54', '14'], difficulty: 3, skill: '8x table' },
  { id: 't9', question: '9 x 3 = ?', answer: '27', distractors: ['24', '21', '12'], difficulty: 3, skill: '9x table' },
  { id: 't10', question: '7 x 7 = ?', answer: '49', distractors: ['42', '56', '14'], difficulty: 3, skill: '7x table' },
];

const ADDITION: Task[] = [
  { id: 't1', question: '2 + 1 = ?', answer: '3', distractors: ['4', '5', '1'], difficulty: 1, skill: 'Add within 10' },
  { id: 't2', question: '2 + 2 = ?', answer: '4', distractors: ['3', '5', '6'], difficulty: 1, skill: 'Add within 10' },
  { id: 't3', question: '3 + 2 = ?', answer: '5', distractors: ['4', '6', '2'], difficulty: 1, skill: 'Add within 10' },
  { id: 't4', question: '4 + 2 = ?', answer: '6', distractors: ['5', '7', '8'], difficulty: 2, skill: 'Add within 10' },
  { id: 't5', question: '1 + 6 = ?', answer: '7', distractors: ['6', '8', '5'], difficulty: 2, skill: 'Add within 10' },
  { id: 't6', question: '4 + 4 = ?', answer: '8', distractors: ['6', '7', '9'], difficulty: 2, skill: 'Doubles' },
  { id: 't7', question: '5 + 3 = ?', answer: '8', distractors: ['7', '9', '6'], difficulty: 2, skill: 'Add within 10' },
  { id: 't8', question: '6 + 3 = ?', answer: '9', distractors: ['8', '10', '7'], difficulty: 3, skill: 'Add within 10' },
  { id: 't9', question: '7 + 3 = ?', answer: '10', distractors: ['9', '11', '8'], difficulty: 3, skill: 'Add to 10' },
  { id: 't10', question: '8 + 4 = ?', answer: '12', distractors: ['10', '11', '14'], difficulty: 3, skill: 'Add within 20' },
];

const MULTIPLICATION_TOPIC = /multipl|times table|tabliczk/i;
const UNSAFE_IDEA = /\b(porn|xxx|nsfw|suicide|nazi)\b/i;
const PITCH_MAX = 120;
const TITLE_IDEA_MAX = 24;

function cleanIdea(value: string): string {
  const text = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  if (!text || UNSAFE_IDEA.test(text)) return 'your world';
  return text.slice(0, TITLE_IDEA_MAX);
}

function cleanGoal(topic: string): string {
  const text = topic.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  return text.slice(0, 80) || 'Practice';
}

export function localTaskPlan(goal: Goal): TaskPlan {
  const bank = MULTIPLICATION_TOPIC.test(goal.topic) ? MULTIPLICATION : ADDITION;
  return {
    goal: cleanGoal(goal.topic),
    age: goal.age,
    tasks: bank.slice(0, goal.questionCount),
  };
}

export function localGameOptions(request: SparkRequest): GameOption[] {
  const idea = cleanIdea(request.kidIdea);
  const topic = cleanGoal(request.plan.goal);
  return [
    {
      template: 'collect',
      title: 'Collect',
      pitch: `Catch the right ${topic} answer in ${idea}.`.slice(0, PITCH_MAX),
    },
    {
      template: 'runner',
      title: 'Runner',
      pitch: `Jump to the right ${topic} answer in ${idea}.`.slice(0, PITCH_MAX),
    },
    {
      template: 'quiz_battle',
      title: 'Quiz battle',
      pitch: `Answer ${topic} with Robo in ${idea}.`.slice(0, PITCH_MAX),
    },
  ];
}
