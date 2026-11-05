import type { Game } from '@grok-hack/api-contract';

export type AgentKey = 'robo' | 'prof' | 'spark' | 'doodle' | 'lens';
export type AgentState = 'idle' | 'working' | 'handoff' | 'done';
export type GameTemplate = 'collect' | 'runner' | 'quiz_battle';
export type Difficulty = 1 | 2 | 3;
export type QuestionCount = 5 | 10;

export type ParentProfile = {
  name: string;
  email: string;
};

export type KidProfile = {
  id: string;
  name: string;
  age: number;
  color: string;
};

export type Goal = {
  kidId: string;
  topic: string;
  age: number;
  questionCount: QuestionCount;
  language: string;
};

export type Task = {
  id: string;
  question: string;
  answer: string;
  distractors: [string, string, string];
  difficulty: Difficulty;
  skill: string;
};

export type TaskPlan = {
  goal: string;
  age: number;
  tasks: Task[];
};

export type GameOption = {
  template: GameTemplate;
  title: string;
  pitch: string;
};

export type SparkRequest = {
  kidIdea: string;
  age: number;
  plan: TaskPlan;
};

export type SparkResponse = {
  options: GameOption[];
};

export type OptionPreviewRequest = {
  kidIdea: string;
  topic: string;
  options: GameOption[];
};

export type OptionPreviewResponse = {
  imageUrls: Array<string | null>;
};

export type BuildRequest = {
  goal: Goal;
  plan: TaskPlan;
  kidIdea: string;
  option: GameOption;
};

export type AgentEvent = {
  type: 'agent';
  agent: AgentKey;
  state: AgentState;
  message: string;
  at: string;
};

export type PreviewEvent = {
  type: 'preview';
  imageUrl: string;
};

export type ReadyEvent = {
  type: 'ready';
  game: Game;
};

export type FailedEvent = {
  type: 'failed';
  message: string;
};

export type BuildEvent = AgentEvent | PreviewEvent | ReadyEvent | FailedEvent;

export type HintRequest = {
  task: Task;
  wrongAnswers: string[];
  players: string[];
};

export type Hint = {
  type: 'hint' | 'cheer' | 'turn';
  text: string;
  nextPlayer: string | null;
};

export type GameEvent = {
  source: 'edubotgames-game';
  type: 'answer' | 'finish';
  taskId: string | null;
  answer: string | null;
  correct: boolean | null;
  player: string | null;
  at: string;
};

export type SessionResult = {
  gameId: string;
  kidId: string;
  events: GameEvent[];
  hintsUsed: number;
  seconds: number;
};

export type SkillScore = {
  skill: string;
  before: number;
  now: number;
};

export type LensRequest = {
  plan: TaskPlan;
  session: SessionResult;
  previous: SessionResult | null;
};

export type Report = {
  accuracyBefore: number;
  accuracyNow: number;
  delta: number;
  bySkill: SkillScore[];
  weakSkills: string[];
  parentSummary: string;
  pedagogueFeedback: string;
};

export type Transcript = {
  text: string;
};

export const flowPaths = {
  prof: '/api/agents/prof',
  spark: '/api/agents/spark',
  optionPreviews: '/api/agents/doodle/options',
  robo: '/api/agents/robo',
  lens: '/api/agents/lens',
  build: '/api/build',
  transcribe: '/api/voice/transcribe',
} as const;
