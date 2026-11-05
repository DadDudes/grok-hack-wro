import type { GameEvent, SessionResult, Task, TaskPlan } from '@/lib/flow/types';

const SECONDS_PER_MINUTE = 60;
const THREE_STAR_ACCURACY = 0.8;
const TWO_STAR_ACCURACY = 0.5;

export type SessionStats = {
  solved: number;
  total: number;
  tries: number;
  triesRight: number;
  hints: number;
  minutes: number;
};

export function answerEvents(events: GameEvent[]): GameEvent[] {
  return events.filter((event) => event.type === 'answer');
}

export function solvedTaskIds(events: GameEvent[]): Set<string> {
  const solved = new Set<string>();

  for (const event of answerEvents(events)) {
    if (event.correct === true && event.taskId !== null) {
      solved.add(event.taskId);
    }
  }

  return solved;
}

export function countCorrect(events: GameEvent[]): number {
  const correct = answerEvents(events).filter((event) => event.correct === true);
  return correct.length;
}

export function hasFinished(events: GameEvent[]): boolean {
  return events.some((event) => event.type === 'finish');
}

export function currentTaskIndex(plan: TaskPlan, events: GameEvent[]): number {
  const answers = answerEvents(events);
  const lastIndex = plan.tasks.length - 1;

  if (answers.length === 0) {
    return 0;
  }

  const last = answers[answers.length - 1];
  const index = plan.tasks.findIndex((task) => task.id === last.taskId);

  if (index < 0) {
    const solvedCount = solvedTaskIds(events).size;
    return Math.min(solvedCount, lastIndex);
  }

  if (last.correct === true) {
    return Math.min(index + 1, lastIndex);
  }

  return index;
}

export function wrongAnswersFor(task: Task, events: GameEvent[]): string[] {
  const wrong: string[] = [];

  for (const event of answerEvents(events)) {
    const isThisTask = event.taskId === task.id;
    const isWrong = event.correct === false;

    if (isThisTask && isWrong && event.answer !== null) {
      wrong.push(event.answer);
    }
  }

  return wrong;
}

export function playerNames(kidName: string, events: GameEvent[]): string[] {
  const names = [kidName];

  for (const event of events) {
    const player = event.player;
    if (player !== null && !names.includes(player)) {
      names.push(player);
    }
  }

  return names;
}

export function correctByPlayer(player: string, isMainKid: boolean, events: GameEvent[]): number {
  let count = 0;

  for (const event of answerEvents(events)) {
    const isMine = event.player === player || (isMainKid && event.player === null);
    if (isMine && event.correct === true) {
      count += 1;
    }
  }

  return count;
}

export function sessionStats(session: SessionResult, plan: TaskPlan): SessionStats {
  const answers = answerEvents(session.events);
  const triesRight = countCorrect(session.events);
  const solved = solvedTaskIds(session.events).size;
  const minutes = Math.max(1, Math.round(session.seconds / SECONDS_PER_MINUTE));

  return {
    solved,
    total: plan.tasks.length,
    tries: answers.length,
    triesRight,
    hints: session.hintsUsed,
    minutes,
  };
}

export function winHeadline(name: string, solved: number, total: number): string {
  if (total > 0 && solved >= total) {
    return `You did it, ${name}!`;
  }

  if (solved <= 0) {
    return `Good try, ${name}!`;
  }

  return `Nice work, ${name}!`;
}

export function starsFor(solved: number, total: number): number {
  if (total === 0) {
    return 1;
  }

  const accuracy = solved / total;

  if (accuracy >= THREE_STAR_ACCURACY) {
    return 3;
  }

  if (accuracy >= TWO_STAR_ACCURACY) {
    return 2;
  }

  return 1;
}

export function secondsSince(startedAt: string | null): number {
  if (startedAt === null) {
    return 0;
  }

  const started = Date.parse(startedAt);
  const elapsedMs = Date.now() - started;

  return Math.max(0, Math.round(elapsedMs / 1000));
}
