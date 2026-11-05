'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { askRobo } from '@/lib/flow/client';
import type { GameEvent, HintRequest, KidProfile, Task, TaskPlan } from '@/lib/flow/types';
import { Agent, type AgentPose } from '../Agent';
import { Icon, StarIcon } from '../Icon';
import { KidAvatar } from '../KidAvatar';
import { KidShell } from '../kid/KidShell';
import { useKidContext } from '../kid/useKidContext';
import { countCorrect, currentTaskIndex, playerNames, wrongAnswersFor } from '../state/derive';
import { updateGoal } from '../state/goalsStore';
import { errorMessage } from '../state/useRequest';

const GAME_SOURCE = 'edubotgames-game';
const APP_SOURCE = 'edubotgames-app';
const LONG_QUESTION_LENGTH = 16;
const WELCOME_LINE = 'I am on your team! I give hints, not answers.';
const THINKING_LINE = 'Hmm, let me think...';
const HINT_FAILED_LINE = 'Oops, my hint got lost. Want me to try again?';
const CHEER_LINES = ['Yes! Team score up!', 'Great job, NAME!', 'Super! Keep going!', 'You got it, NAME!'];
const NAME_SLOT = 'NAME';
const GAME_SANDBOX = 'allow-scripts allow-same-origin allow-pointer-lock';

type RoboLine = {
  pose: AgentPose;
  text: string;
};

type AppMessage =
  | { source: typeof APP_SOURCE; type: 'start'; tasks: Task[]; players: string[] }
  | { source: typeof APP_SOURCE; type: 'hint'; text: string }
  | { source: typeof APP_SOURCE; type: 'pause' | 'resume' };

function textOrNull(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  return null;
}

function readGameEvent(data: unknown): GameEvent | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const candidate = data as Record<string, unknown>;
  const fromGame = candidate.source === GAME_SOURCE;
  const isAnswer = candidate.type === 'answer';
  const isFinish = candidate.type === 'finish';

  if (!fromGame || (!isAnswer && !isFinish)) {
    return null;
  }

  const correct = typeof candidate.correct === 'boolean' ? candidate.correct : null;
  const at = textOrNull(candidate.at) ?? new Date().toISOString();

  return {
    source: GAME_SOURCE,
    type: isAnswer ? 'answer' : 'finish',
    taskId: textOrNull(candidate.taskId),
    answer: textOrNull(candidate.answer),
    correct,
    player: textOrNull(candidate.player),
    at,
  };
}

function taskFor(plan: TaskPlan, event: GameEvent, events: GameEvent[]): Task {
  const byId = plan.tasks.find((task) => task.id === event.taskId);

  if (byId !== undefined) {
    return byId;
  }

  const index = currentTaskIndex(plan, events);
  return plan.tasks[index];
}

function cheerLine(correctCount: number, player: string): string {
  const line = CHEER_LINES[correctCount % CHEER_LINES.length];
  return line.replace(NAME_SLOT, player);
}

function colorFor(name: string, kids: KidProfile[]): string {
  const kid = kids.find((candidate) => candidate.name === name);
  return kid?.color ?? '';
}

export function GameScreen() {
  const router = useRouter();
  const { ready, state, actions, kid, kids } = useKidContext();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const finishedRef = useRef(false);
  const [robo, setRobo] = useState<RoboLine>({ pose: 'idle', text: WELCOME_LINE });
  const [turn, setTurn] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [failedHint, setFailedHint] = useState<HintRequest | null>(null);
  const game = state.game;
  const plan = state.plan;
  const missingGame = ready && (game === null || plan === null);
  const needsSession = ready && !missingGame && state.startedAt === null;
  const startSession = actions.startSession;

  useEffect(() => {
    if (missingGame) {
      router.replace('/play');
    }
  }, [missingGame, router]);

  useEffect(() => {
    if (needsSession && !finishedRef.current) {
      startSession();
    }
  }, [needsSession, startSession]);

  function sendToGame(message: AppMessage): void {
    const target = frameRef.current?.contentWindow;

    if (target === undefined || target === null) {
      return;
    }

    target.postMessage(message, '*');
  }

  function finish(): void {
    if (finishedRef.current) {
      return;
    }

    finishedRef.current = true;
    const session = actions.finishSession();

    if (session !== null && state.goalId !== null) {
      void updateGoal(session.kidId, state.goalId, { session });
    }

    router.push('/play/win');
  }

  async function askForHint(request: HintRequest): Promise<void> {
    setRobo({ pose: 'working', text: THINKING_LINE });
    setFailedHint(null);

    try {
      const hint = await askRobo(request);
      actions.addHint();
      setRobo({ pose: 'idle', text: hint.text });
      sendToGame({ source: APP_SOURCE, type: 'hint', text: hint.text });

      if (hint.nextPlayer !== null) {
        setTurn(hint.nextPlayer);
      }
    } catch (error) {
      console.warn(errorMessage(error));
      setRobo({ pose: 'idle', text: HINT_FAILED_LINE });
      setFailedHint(request);
    }
  }

  const handleMessage = useEffectEvent((message: MessageEvent) => {
    const frame = frameRef.current;

    if (frame === null || message.source !== frame.contentWindow) {
      return;
    }

    const event = readGameEvent(message.data);

    if (event === null || plan === null) {
      return;
    }

    if (event.type === 'finish') {
      actions.addGameEvent(event);
      finish();
      return;
    }

    actions.addGameEvent(event);
    const events = [...state.events, event];
    const player = event.player ?? kid.name;

    if (event.correct === true) {
      const correctCount = countCorrect(events);
      setFailedHint(null);
      setRobo({ pose: 'done', text: cheerLine(correctCount, player) });
      return;
    }

    if (event.correct === false) {
      const task = taskFor(plan, event, events);
      const request: HintRequest = {
        task,
        wrongAnswers: wrongAnswersFor(task, events),
        players: playerNames(kid.name, events),
      };
      void askForHint(request);
    }
  });

  useEffect(() => {
    function listener(message: MessageEvent): void {
      handleMessage(message);
    }

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  if (!ready || game === null || plan === null) {
    return <KidShell variant="play">{null}</KidShell>;
  }

  const activePlan = plan;
  const players = playerNames(kid.name, state.events);
  const activeTurn = turn ?? kid.name;
  const score = countCorrect(state.events);
  const taskIndex = currentTaskIndex(activePlan, state.events);
  const task = activePlan.tasks[taskIndex];
  const questionClass = task !== undefined && task.question.length > LONG_QUESTION_LENGTH ? 'long' : '';
  const roboMotion = robo.pose === 'working' ? 'work' : 'bob';

  function handleFrameLoad(): void {
    sendToGame({ source: APP_SOURCE, type: 'start', tasks: activePlan.tasks, players });
  }

  function pause(): void {
    setPaused(true);
    sendToGame({ source: APP_SOURCE, type: 'pause' });
  }

  function resume(): void {
    setPaused(false);
    sendToGame({ source: APP_SOURCE, type: 'resume' });
  }

  function retryHint(): void {
    if (failedHint === null) {
      return;
    }

    void askForHint(failedHint);
  }

  return (
    <KidShell variant="play">
      <header className="game-bar">
        <ul className="players" aria-label="Players">
          {players.map((name) => {
            const isTurn = name === activeTurn;
            const color = name === kid.name ? kid.color : colorFor(name, kids);

            return (
              <li className={isTurn ? 'pl turn' : 'pl'} key={name}>
                <KidAvatar name={name} color={color} size="lg" />
                <span className="pn">{name}</span>
              </li>
            );
          })}
          <li className="pl">
            <Agent agent="robo" pose="head" size="s88" alt="" />
            <span className="pn">Robo</span>
          </li>
        </ul>
        {task !== undefined && (
          <section className="task" aria-label="Question" aria-live="polite">
            <b className={questionClass}>{task.question}</b>
            <span>
              {taskIndex + 1} of {activePlan.tasks.length}
            </span>
          </section>
        )}
        <span className="score" role="status" aria-label={`Team score ${score}`}>
          <StarIcon />
          {score}
        </span>
        <button className="round xl" type="button" aria-label="Pause" onClick={pause}>
          <Icon name="pause" filled={true} />
        </button>
      </header>

      <main className="game-stage">
        <section className="canvas" aria-label="Game">
          {game.gameUrl === null ? (
            <div className="canvas-empty">
              <div className="cv-label">
                <Icon name="pad" />
                <b>The game is not ready yet</b>
                <span>Robo&apos;s team needs one more try.</span>
                <Link className="cta" href="/play/pick">
                  <Icon name="refresh" />
                  Build again
                </Link>
              </div>
            </div>
          ) : (
            <iframe
              ref={frameRef}
              src={game.gameUrl}
              title="Your game"
              sandbox={GAME_SANDBOX}
              allow="autoplay; fullscreen"
              onLoad={handleFrameLoad}
            />
          )}
          {paused && (
            <div className="pause-sheet">
              <section className="pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title">
                <h2 id="pause-title">Paused</h2>
                <div className="kid-actions">
                  <button className="cta" type="button" onClick={resume} autoFocus>
                    <Icon name="play" filled={true} />
                    Keep playing
                  </button>
                  <button className="cta white" type="button" onClick={finish}>
                    <Icon name="flag" />
                    Finish game
                  </button>
                </div>
              </section>
            </div>
          )}
        </section>

        <aside className="robo-coach" aria-label="Robo's hint">
          <p className="say d robo hint-bubble" aria-live="polite" key={robo.text}>
            {robo.text}
          </p>
          {failedHint !== null && (
            <button className="cta sm fit" type="button" onClick={retryHint}>
              <Icon name="refresh" />
              Try again
            </button>
          )}
          <Agent agent="robo" pose={robo.pose} size="s240" motion={roboMotion} alt="Robo" />
        </aside>
      </main>
    </KidShell>
  );
}
