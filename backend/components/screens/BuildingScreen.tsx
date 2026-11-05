'use client';

import type { Game } from '@grok-hack/api-contract';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { buildGame, isMockMode } from '@/lib/flow/client';
import type { AgentEvent, AgentKey, AgentState, BuildEvent, BuildRequest } from '@/lib/flow/types';
import { Agent, AGENT_NAMES, type AgentMotion } from '../Agent';
import { PaintingScene } from '../art/GamePreview';
import { widthClass } from '../format';
import { Icon } from '../Icon';
import { KidShell } from '../kid/KidShell';
import { IdeaPill, KidPill, KidTop } from '../kid/KidTop';
import { localDemoGame } from '../kid/localDemoGame';
import { useKidContext } from '../kid/useKidContext';
import { updateGoal } from '../state/goalsStore';
import { errorMessage } from '../state/useRequest';
import { TryAgain } from '../TryAgain';

const READY_REDIRECT_MS = 1500;
const TOTAL_STEPS = 4;
const NO_GAME_MESSAGE = 'The build ended without a game.';

type BuildPhase = 'building' | 'ready' | 'failed';
type TeamAgent = Exclude<AgentKey, 'robo' | 'lens'>;

type TeamStep = {
  agent: TeamAgent;
  busyLabel: string;
  waitingLine: string;
};

type BuildOutcome = {
  game: Game | null;
  failure: string | null;
};

const TEAM_STEPS: TeamStep[] = [
  { agent: 'prof', busyLabel: 'Checking', waitingLine: 'Gets the tasks ready' },
  { agent: 'spark', busyLabel: 'Designing', waitingLine: 'Turns the tasks into a game' },
  { agent: 'doodle', busyLabel: 'Painting', waitingLine: 'Paints the game world' },
];

const STATE_MOTION: Record<AgentState, AgentMotion> = {
  idle: 'wait',
  working: 'work',
  handoff: 'work',
  done: 'done',
};

function latestFor(agent: AgentKey, events: AgentEvent[]): AgentEvent | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.agent === agent) {
      return event;
    }
  }

  return null;
}

function statusLabel(state: AgentState, busyLabel: string): string {
  if (state === 'done') {
    return 'Done';
  }

  if (state === 'handoff') {
    return 'Passing';
  }

  if (state === 'working') {
    return busyLabel;
  }

  return 'Waiting';
}

function statusClass(state: AgentState): string {
  if (state === 'done') {
    return 'st';
  }

  if (state === 'idle') {
    return 'st wait';
  }

  return 'st now';
}

export function BuildingScreen() {
  const router = useRouter();
  const { ready, state, actions, kid } = useKidContext();
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [phase, setPhase] = useState<BuildPhase>('building');
  const [attempt, setAttempt] = useState(0);
  const startedAttemptRef = useRef(-1);
  const goal = state.goal;
  const plan = state.plan;
  const option = state.option;
  const idea = state.kidIdea;
  const missingInput = ready && (goal === null || plan === null || option === null || idea === '');
  const alreadyBuilt = state.game !== null;

  useEffect(() => {
    if (missingInput) {
      router.replace('/play');
    }
  }, [missingInput, router]);

  function handleEvent(event: BuildEvent, outcome: BuildOutcome): void {
    if (event.type === 'agent') {
      setEvents((previous) => [...previous, event]);
      return;
    }

    if (event.type === 'preview') {
      actions.setPreview(event.imageUrl);
      return;
    }

    if (event.type === 'ready') {
      outcome.game = event.game;
      return;
    }

    outcome.failure = event.message;
  }

  const runBuild = useEffectEvent(async () => {
    if (goal === null || plan === null || option === null) {
      return;
    }

    setEvents([]);
    setPhase('building');

    const outcome: BuildOutcome = { game: null, failure: null };
    const request: BuildRequest = { goal, plan, kidIdea: idea, option };

    try {
      await buildGame(request, (event) => handleEvent(event, outcome));
    } catch (error) {
      outcome.failure = errorMessage(error);
    }

    const useLocalDemo = outcome.game === null && outcome.failure === null && isMockMode();

    if (useLocalDemo) {
      outcome.game = localDemoGame(goal, idea);
    }

    if (outcome.game === null) {
      console.warn(outcome.failure ?? NO_GAME_MESSAGE);
      setPhase('failed');
      return;
    }

    actions.setGame(outcome.game);
    setPhase('ready');

    if (state.goalId !== null) {
      const patch = { status: 'playing' as const, kidIdea: idea, option, gameId: outcome.game.id };
      void updateGoal(goal.kidId, state.goalId, patch);
    }
  });

  useEffect(() => {
    const canStart = ready && !missingInput && !alreadyBuilt;

    if (!canStart || startedAttemptRef.current === attempt) {
      return;
    }

    startedAttemptRef.current = attempt;
    void runBuild();
  }, [ready, missingInput, alreadyBuilt, attempt]);

  useEffect(() => {
    if (phase !== 'ready') {
      return;
    }

    const timer = window.setTimeout(() => router.push('/play/game'), READY_REDIRECT_MS);
    return () => window.clearTimeout(timer);
  }, [phase, router]);

  if (!ready || idea === '') {
    return <KidShell>{null}</KidShell>;
  }

  const isReady = phase === 'ready' || alreadyBuilt;
  const isFailed = phase === 'failed' && !alreadyBuilt;

  function stepState(agent: TeamAgent): AgentState {
    if (isReady) {
      return 'done';
    }

    const latest = latestFor(agent, events);
    return latest?.state ?? 'idle';
  }

  function stepLine(step: TeamStep): string {
    const latest = latestFor(step.agent, events);
    return latest?.message ?? step.waitingLine;
  }

  const teamDone = TEAM_STEPS.filter((step) => stepState(step.agent) === 'done').length;
  const doneCount = isReady ? TOTAL_STEPS : teamDone;
  const doodleDone = stepState('doodle') === 'done';
  const roboLine = latestFor('robo', events)?.message ?? 'Robo joins you in the game';
  const previewUrl = state.previewUrl;
  const optionIndex = state.options.findIndex(
    (candidate) => candidate.template === option?.template && candidate.title === option?.title,
  );
  const hasOptionImages = state.optionImagesFor === idea;
  const optionImage = hasOptionImages ? (state.optionImages[optionIndex] ?? null) : null;

  function retry(): void {
    setAttempt((previous) => previous + 1);
  }

  return (
    <KidShell>
      <KidTop>
        <IdeaPill idea={idea} />
        <KidPill kid={kid} />
      </KidTop>
      <main className="kid-stage build-stage">
        <h1 className="sr-only">Building your game</h1>

        {isFailed && (
          <TryAgain
            tone="kid"
            agent="robo"
            title="Oops, the build got stuck."
            text="My team can try again right now."
            onRetry={retry}
          >
            <Link className="cta white" href="/play/pick">
              Pick another game
            </Link>
          </TryAgain>
        )}

        {!isFailed && (
          <>
            <section className="build-head">
              <div className="agent-lead">
                <Agent
                  agent="robo"
                  pose={isReady ? 'done' : 'working'}
                  size="s150"
                  motion={isReady ? 'done' : 'work'}
                  alt="Robo, leading the team"
                />
                <p className="say l robo" aria-live="polite">
                  {isReady ? 'Your game is ready! Let’s play!' : 'My team is building your game!'}
                </p>
              </div>
              {isReady ? (
                <Link className="cta build-now" href="/play/game">
                  <Icon name="play" filled={true} />
                  Play now!
                </Link>
              ) : (
                <div
                  className="prog build-progress"
                  role="progressbar"
                  aria-label="Build progress"
                  aria-valuemin={0}
                  aria-valuemax={TOTAL_STEPS}
                  aria-valuenow={doneCount}
                >
                  <span className="trk">
                    <i className={widthClass(doneCount / TOTAL_STEPS)} />
                  </span>
                  <span>
                    {doneCount} of {TOTAL_STEPS}
                  </span>
                </div>
              )}
            </section>

            <ol className="timeline" aria-label="Robo's team">
              {TEAM_STEPS.map((step, index) => {
                const current = stepState(step.agent);
                const isBusy = current === 'working' || current === 'handoff';
                const stepClass = current === 'idle' ? 'timeline-step later' : 'timeline-step';
                const showFly = isBusy && index > 0;
                const badge = current === 'done' ? 'ok' : 'none';

                return (
                  <li className={stepClass} key={step.agent}>
                    {showFly && <span className="fly timeline-fly" aria-hidden="true" />}
                    <Agent
                      agent={step.agent}
                      pose="head"
                      size="s88"
                      motion={STATE_MOTION[current]}
                      alt={AGENT_NAMES[step.agent]}
                      badge={badge}
                    />
                    <span className="timeline-name">
                      {AGENT_NAMES[step.agent]}
                      <span className={statusClass(current)}>{statusLabel(current, step.busyLabel)}</span>
                    </span>
                    <span className="timeline-line">{stepLine(step)}</span>
                  </li>
                );
              })}
              <li className={isReady ? 'timeline-step' : 'timeline-step later'}>
                <span className={isReady ? 'goal-ic on' : 'goal-ic'}>
                  <Icon name="flag" />
                </span>
                <span className="timeline-name">
                  Ready to play
                  {isReady && <span className="st">Done</span>}
                </span>
                <span className="timeline-line">{roboLine}</span>
              </li>
            </ol>

            <section
              className="paint paint-canvas"
              aria-label={previewUrl === null ? 'Doodle is painting the game world' : 'Preview of your game'}
            >
              {previewUrl === null ? (
                <PaintingScene imageUrl={optionImage} done={doodleDone} />
              ) : (
                <img src={previewUrl} alt="Preview of your game" />
              )}
            </section>
          </>
        )}
      </main>
    </KidShell>
  );
}
