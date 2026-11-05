import type {
  BuildEvent,
  Hint,
  KidProfile,
  ParentProfile,
  Report,
  SparkResponse,
  TaskPlan,
} from './types';

export const demoParent: ParentProfile = {
  name: 'Anna',
  email: 'anna@example.com',
};

export const demoKids: KidProfile[] = [
  { id: 'maja', name: 'Maja', age: 8, color: '#FF6FA5' },
  { id: 'leo', name: 'Leo', age: 9, color: '#4CC9F0' },
];

export const demoPlan: TaskPlan = {
  goal: 'Multiplication up to 50',
  age: 8,
  tasks: [
    { id: 't1', question: '2 x 5 = ?', answer: '10', distractors: ['7', '12', '25'], difficulty: 1, skill: '2x 5x 10x' },
    { id: 't2', question: '3 x 4 = ?', answer: '12', distractors: ['7', '14', '9'], difficulty: 1, skill: '3x 4x' },
    { id: 't3', question: '5 x 6 = ?', answer: '30', distractors: ['25', '35', '11'], difficulty: 1, skill: '2x 5x 10x' },
    { id: 't4', question: '4 x 7 = ?', answer: '28', distractors: ['24', '32', '11'], difficulty: 2, skill: '3x 4x' },
    { id: 't5', question: '6 x 7 = ?', answer: '42', distractors: ['36', '48', '13'], difficulty: 2, skill: '7x table' },
    { id: 't6', question: '8 x 4 = ?', answer: '32', distractors: ['28', '36', '12'], difficulty: 2, skill: '8x table' },
    { id: 't7', question: '7 x 5 = ?', answer: '35', distractors: ['30', '40', '12'], difficulty: 2, skill: '7x table' },
    { id: 't8', question: '8 x 6 = ?', answer: '48', distractors: ['42', '54', '14'], difficulty: 3, skill: '8x table' },
    { id: 't9', question: 'Rex has 6 bags of 7 star eggs. How many?', answer: '42', distractors: ['13', '36', '48'], difficulty: 3, skill: 'Word tasks' },
    { id: 't10', question: '7 x 7 = ?', answer: '49', distractors: ['42', '56', '14'], difficulty: 3, skill: '7x table' },
  ],
};

export const demoOptions: SparkResponse = {
  options: [
    { template: 'collect', title: 'Collect', pitch: 'Fly Rex around and catch the star egg with the right answer.' },
    { template: 'runner', title: 'Runner', pitch: 'Run on the moon, dodge comets and jump through the right gate.' },
    { template: 'quiz_battle', title: 'Quiz battle', pitch: 'Team up with Leo and Robo to beat the space boss.' },
  ],
};

export const demoBuild: BuildEvent[] = [
  { type: 'agent', agent: 'prof', state: 'working', message: 'Checking 10 tasks, easy to hard', at: '' },
  { type: 'agent', agent: 'prof', state: 'done', message: '10 tasks, easy to hard', at: '' },
  { type: 'agent', agent: 'spark', state: 'working', message: 'Weaving the tasks into a Collect game', at: '' },
  { type: 'agent', agent: 'spark', state: 'done', message: 'Collect game with Rex', at: '' },
  { type: 'agent', agent: 'doodle', state: 'working', message: 'Rex, his rocket and four shiny star eggs...', at: '' },
  { type: 'agent', agent: 'doodle', state: 'done', message: 'Art is ready', at: '' },
  { type: 'agent', agent: 'robo', state: 'working', message: 'Robo joins you in the game', at: '' },
];

export const demoHint: Hint = {
  type: 'hint',
  text: 'Close! Try counting by 7s. Maja, your turn!',
  nextPlayer: 'Maja',
};

export const demoReport: Report = {
  accuracyBefore: 0.4,
  accuracyNow: 0.75,
  delta: 0.35,
  bySkill: [
    { skill: '2x 5x 10x', before: 0.7, now: 0.95 },
    { skill: '3x 4x', before: 0.5, now: 0.85 },
    { skill: 'Word tasks', before: 0.4, now: 0.8 },
    { skill: '8x table', before: 0.25, now: 0.6 },
    { skill: '7x table', before: 0.2, now: 0.55 },
  ],
  weakSkills: ['7x table', '8x table'],
  parentSummary: 'Maja went from 40% to 75%. Practise 7x and 8x next.',
  pedagogueFeedback: 'Put more tasks on the 7x and 8x tables, keep the dinosaur theme.',
  measured: true,
};
