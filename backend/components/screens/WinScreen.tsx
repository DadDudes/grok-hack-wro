'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Agent } from '../Agent';
import { Icon } from '../Icon';
import { KidAvatar } from '../KidAvatar';
import { KidShell } from '../kid/KidShell';
import { useKidContext } from '../kid/useKidContext';
import { correctByPlayer, playerNames, sessionStats, starsFor } from '../state/derive';

const CONFETTI = [
  'cf w1',
  'cf w2 round-cf',
  'cf w3',
  'cf w4',
  'cf w5 round-cf',
  'cf w6',
  'cf w7',
  'cf w8',
  'cf w9 round-cf',
  'cf w10',
  'cf w11 round-cf',
  'cf w12',
  'cf w13',
  'cf w14',
  'cf w15',
  'cf w16 round-cf',
];

const ROBO_LINES: Record<number, string> = {
  1: 'Good try! Every game makes you stronger.',
  2: 'Great game! Two shiny stars!',
  3: 'Super team! I am so proud of you!',
};

function hintsLabel(count: number): string {
  if (count === 1) {
    return '1 hint';
  }

  return `${count} hints`;
}

export function WinScreen() {
  const router = useRouter();
  const { ready, state, actions, kid, kids } = useKidContext();
  const session = state.lastSession;
  const plan = state.plan;
  const missingResult = ready && (session === null || plan === null);

  useEffect(() => {
    if (missingResult) {
      router.replace('/play');
    }
  }, [missingResult, router]);

  if (!ready || session === null || plan === null) {
    return <KidShell variant="party">{null}</KidShell>;
  }

  const stats = sessionStats(session, plan);
  const stars = starsFor(stats.solved, stats.total);
  const players = playerNames(kid.name, session.events);
  const leftStarClass = stars >= 2 ? '' : 'off';
  const rightStarClass = stars >= 3 ? '' : 'off';

  function playAgain(): void {
    actions.startSession();
    router.push('/play/game');
  }

  function newGame(): void {
    actions.setIdea('');
    router.push('/play');
  }

  function colorFor(name: string): string {
    const match = kids.find((candidate) => candidate.name === name);
    return match?.color ?? '';
  }

  return (
    <KidShell variant="party">
      {CONFETTI.map((className) => (
        <i className={className} key={className} aria-hidden="true" />
      ))}
      <main className="win-stage">
        <div className="stars" role="img" aria-label={`${stars} of 3 stars`}>
          <svg className={leftStarClass} aria-hidden="true">
            <use href="#star-st" />
          </svg>
          <svg className="big" aria-hidden="true">
            <use href="#star-st" />
          </svg>
          <svg className={rightStarClass} aria-hidden="true">
            <use href="#star-st" />
          </svg>
        </div>
        <h1 className="h-kid win-title">You did it, {kid.name}!</h1>
        <div className="win-row">
          <div className="lead win-lead">
            <Agent agent="robo" pose="done" size="s240" motion="done" alt="Robo cheering" badge="ok-xl" />
            <p className="say l robo">{ROBO_LINES[stars]}</p>
          </div>
          <section className="scorecard win-score" aria-label="Team result">
            <b>
              {stats.solved} of {stats.total}
            </b>
            <span>tasks solved</span>
            <ul className="team">
              {players.map((name) => (
                <li key={name}>
                  <KidAvatar name={name} color={colorFor(name)} size="lg" />
                  {correctByPlayer(name, name === kid.name, session.events)}
                </li>
              ))}
              <li>
                <Agent agent="robo" pose="head" size="s60" alt="Robo" />
                {hintsLabel(stats.hints)}
              </li>
            </ul>
          </section>
        </div>
        <div className="kid-actions">
          <button className="cta" type="button" onClick={playAgain}>
            <Icon name="refresh" />
            Play again
          </button>
          <button className="cta white" type="button" onClick={newGame}>
            New game
          </button>
        </div>
      </main>
    </KidShell>
  );
}
