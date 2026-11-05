'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Agent } from '../Agent';
import { Icon } from '../Icon';
import { KidShell } from '../kid/KidShell';
import { KidPill } from '../kid/KidTop';
import { useKidContext } from '../kid/useKidContext';

const CODE_LENGTH = 4;
const CODE_SLOTS = Array.from({ length: CODE_LENGTH }, (_, index) => index);
const LETTER_PATTERN = /[^A-Z]/g;
const EMPTY_CODE = ['', '', '', ''];

export function JoinScreen() {
  const router = useRouter();
  const { ready, state, kid } = useKidContext();
  const [letters, setLetters] = useState<string[]>(EMPTY_CODE);
  const [tried, setTried] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const code = letters.join('');
  const isComplete = code.length === CODE_LENGTH;
  const knowsKid = ready && state.goal !== null;

  function focusSlot(index: number): void {
    const input = inputsRef.current[index];
    input?.focus();
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>): void {
    const cleaned = event.target.value.toUpperCase().replace(LETTER_PATTERN, '');
    const letter = cleaned.slice(-1);

    setTried(false);
    setLetters((previous) => {
      const next = [...previous];
      next[index] = letter;
      return next;
    });

    if (letter !== '' && index < CODE_LENGTH - 1) {
      focusSlot(index + 1);
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>): void {
    const isBackspace = event.key === 'Backspace';
    const isEmpty = letters[index] === '';

    if (isBackspace && isEmpty && index > 0) {
      focusSlot(index - 1);
    }
  }

  function goBack(): void {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/login');
  }

  const roboLine = tried
    ? 'Rooms are coming soon! For now, play your own game.'
    : 'Ask your friend for the room code!';

  return (
    <KidShell>
      <header className="kid-bar">
        <button className="round xl" type="button" aria-label="Back" onClick={goBack}>
          <Icon name="back" />
        </button>
        <div className="kid-title">
          <h1>Join a friend</h1>
          <span className="soon-badge">
            <Icon name="spark" filled={true} />
            Adding soon
          </span>
        </div>
        {knowsKid && (
          <span className="who-pill-wrap">
            <KidPill kid={kid} />
          </span>
        )}
      </header>
      <main className="join-stage">
        <div className="lead join-lead">
          <Agent agent="robo" size="s176" motion="bob" alt="Robo" />
          <p className="say l robo" aria-live="polite">
            {roboLine}
          </p>
        </div>
        <div className="codebox" role="group" aria-label="Room code">
          {CODE_SLOTS.map((index) => (
            <input
              key={index}
              ref={(element) => {
                inputsRef.current[index] = element;
              }}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={2}
              aria-label={`Letter ${index + 1}`}
              value={letters[index]}
              onChange={(event) => handleChange(index, event)}
              onKeyDown={(event) => handleKeyDown(index, event)}
            />
          ))}
        </div>
        {tried ? (
          <Link className="cta join-cta" href="/play">
            Play my own game
            <Icon name="arrow" />
          </Link>
        ) : (
          <button className="cta join-cta" type="button" disabled={!isComplete} onClick={() => setTried(true)}>
            Join the game
            <Icon name="arrow" />
          </button>
        )}
      </main>
    </KidShell>
  );
}
