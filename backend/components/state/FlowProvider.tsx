'use client';

import type { Game } from '@grok-hack/api-contract';
import { createContext, useContext, type ReactNode } from 'react';
import type {
  GameEvent,
  GameOption,
  Goal,
  SessionResult,
  Task,
  TaskPlan,
} from '@/lib/flow/types';
import { secondsSince } from './derive';
import type { GoalRecord } from './goalsStore';
import { createLocalStore } from './localStore';

const FLOW_KEY = 'ebg.flow';

export type FlowState = {
  draftKidId: string | null;
  goalId: string | null;
  goal: Goal | null;
  plan: TaskPlan | null;
  planSentAt: string | null;
  kidIdea: string;
  options: GameOption[];
  optionsFor: string;
  optionImages: Array<string | null>;
  optionImagesFor: string;
  option: GameOption | null;
  game: Game | null;
  previewUrl: string | null;
  events: GameEvent[];
  hintsUsed: number;
  startedAt: string | null;
  lastSession: SessionResult | null;
  previousSession: SessionResult | null;
};

const EMPTY_FLOW: FlowState = {
  draftKidId: null,
  goalId: null,
  goal: null,
  plan: null,
  planSentAt: null,
  kidIdea: '',
  options: [],
  optionsFor: '',
  optionImages: [],
  optionImagesFor: '',
  option: null,
  game: null,
  previewUrl: null,
  events: [],
  hintsUsed: 0,
  startedAt: null,
  lastSession: null,
  previousSession: null,
};

const flowStore = createLocalStore<FlowState>(FLOW_KEY, EMPTY_FLOW);

const RESET_GAME = {
  game: null,
  previewUrl: null,
  events: [],
  hintsUsed: 0,
  startedAt: null,
} satisfies Partial<FlowState>;

const RESET_IDEA = {
  kidIdea: '',
  options: [],
  optionsFor: '',
  optionImages: [],
  optionImagesFor: '',
  option: null,
  ...RESET_GAME,
} satisfies Partial<FlowState>;

function selectKid(kidId: string): void {
  flowStore.update((previous) => ({ ...previous, draftKidId: kidId }));
}

function savePlan(goal: Goal, plan: TaskPlan, goalId: string | null): void {
  flowStore.update((previous) => ({
    ...previous,
    ...RESET_IDEA,
    goalId,
    draftKidId: goal.kidId,
    goal,
    plan,
    planSentAt: null,
  }));
}

function openGoal(record: GoalRecord): void {
  flowStore.update((previous) => ({
    ...previous,
    ...RESET_IDEA,
    goalId: record.id,
    draftKidId: record.kidId,
    goal: record.goal,
    plan: record.plan,
    planSentAt: null,
    lastSession: record.session,
    previousSession: null,
  }));
}

function updateTasks(tasks: Task[]): void {
  flowStore.update((previous) => {
    if (previous.plan === null) {
      return previous;
    }

    const plan: TaskPlan = { ...previous.plan, tasks };
    return { ...previous, plan };
  });
}

function sendPlan(): void {
  const sentAt = new Date().toISOString();
  flowStore.update((previous) => ({ ...previous, planSentAt: sentAt }));
}

const TRAILING_PUNCTUATION = /[\s.,!?;:]+$/;

function setIdea(kidIdea: string): void {
  const trimmed = kidIdea.trim().replace(TRAILING_PUNCTUATION, '');
  flowStore.update((previous) => ({ ...previous, ...RESET_IDEA, kidIdea: trimmed }));
}

function setOptions(idea: string, options: GameOption[]): void {
  flowStore.update((previous) => ({
    ...previous,
    options,
    optionsFor: idea,
    optionImages: [],
    optionImagesFor: '',
  }));
}

function setOptionImages(idea: string, optionImages: Array<string | null>): void {
  flowStore.update((previous) => ({ ...previous, optionImages, optionImagesFor: idea }));
}

function chooseOption(option: GameOption): void {
  flowStore.update((previous) => ({ ...previous, ...RESET_GAME, option }));
}

function setPreview(previewUrl: string): void {
  flowStore.update((previous) => ({ ...previous, previewUrl }));
}

function setGame(game: Game): void {
  flowStore.update((previous) => ({ ...previous, game }));
}

function startSession(): void {
  const startedAt = new Date().toISOString();
  flowStore.update((previous) => ({ ...previous, events: [], hintsUsed: 0, startedAt }));
}

function addGameEvent(event: GameEvent): void {
  flowStore.update((previous) => ({ ...previous, events: [...previous.events, event] }));
}

function addHint(): void {
  flowStore.update((previous) => ({ ...previous, hintsUsed: previous.hintsUsed + 1 }));
}

function finishSession(): SessionResult | null {
  const current = flowStore.read();

  if (current.game === null || current.goal === null) {
    return null;
  }

  const session: SessionResult = {
    gameId: current.game.id,
    kidId: current.goal.kidId,
    events: current.events,
    hintsUsed: current.hintsUsed,
    seconds: secondsSince(current.startedAt),
  };

  flowStore.update((previous) => ({
    ...previous,
    startedAt: null,
    lastSession: session,
    previousSession: previous.lastSession,
  }));

  return session;
}

export type FlowActions = {
  selectKid: typeof selectKid;
  savePlan: typeof savePlan;
  openGoal: typeof openGoal;
  updateTasks: typeof updateTasks;
  sendPlan: typeof sendPlan;
  setIdea: typeof setIdea;
  setOptions: typeof setOptions;
  setOptionImages: typeof setOptionImages;
  chooseOption: typeof chooseOption;
  setPreview: typeof setPreview;
  setGame: typeof setGame;
  startSession: typeof startSession;
  addGameEvent: typeof addGameEvent;
  addHint: typeof addHint;
  finishSession: typeof finishSession;
};

const actions: FlowActions = {
  selectKid,
  savePlan,
  openGoal,
  updateTasks,
  sendPlan,
  setIdea,
  setOptions,
  setOptionImages,
  chooseOption,
  setPreview,
  setGame,
  startSession,
  addGameEvent,
  addHint,
  finishSession,
};

export type Flow = {
  ready: boolean;
  state: FlowState;
  actions: FlowActions;
};

const FlowContext = createContext<Flow | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const value = flowStore.useValue();
  const ready = value !== null;
  const state = value ?? EMPTY_FLOW;
  const flow: Flow = { ready, state, actions };

  return <FlowContext.Provider value={flow}>{children}</FlowContext.Provider>;
}

export function useFlow(): Flow {
  const flow = useContext(FlowContext);

  if (flow === null) {
    throw new Error('useFlow must be used inside FlowProvider');
  }

  return flow;
}
