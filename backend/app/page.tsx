'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Game } from '@grok-hack/api-contract';

type SubmitState = {
  httpStatus: number;
  body: unknown;
};

function isGame(value: unknown): value is Game {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'status' in value &&
    'graphics' in value
  );
}

export default function DeveloperTestPage() {
  const [parentPrompt, setParentPrompt] = useState('');
  const [childPrompt, setChildPrompt] = useState('');
  const [childAge, setChildAge] = useState('');
  const [language, setLanguage] = useState('');
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitState | null>(null);
  const [createStatus, setCreateStatus] = useState<number | null>(null);
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    if (!game) return;
    if (game.status === 'ready' || game.status === 'failed') return;

    let stopped = false;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/games/${game.id}`);
        const body: unknown = await response.json();
        if (stopped) return;
        setResult({ httpStatus: response.status, body });
        if (isGame(body)) setGame(body);
      } catch (error) {
        if (!stopped) {
          setSubmitError(error instanceof Error ? error.message : 'Polling failed.');
        }
      }
    }, 1500);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [game]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSubmitError(null);

    const payload: {
      parentPrompt: string;
      childPrompt: string;
      childAge?: number;
      language?: string;
    } = { parentPrompt, childPrompt };

    if (childAge.trim() !== '') payload.childAge = Number(childAge);
    if (language.trim() !== '') payload.language = language.trim();

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body: unknown = await response.json();
      setCreateStatus(response.status);
      setResult({ httpStatus: response.status, body });
      setGame(isGame(body) ? body : null);
    } catch (error) {
      setResult(null);
      setGame(null);
      setSubmitError(error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main>
      <p>
        <strong>Developer test page.</strong> Temporary UI served by this API so a deployment can
        be tried in the browser. The parent and child panels are a separate frontend.
      </p>
      <p>
        <a href="/api/health">/api/health</a>
      </p>
      <form onSubmit={onSubmit}>
        <label htmlFor="parentPrompt">parentPrompt</label>
        <textarea
          id="parentPrompt"
          name="parentPrompt"
          required
          placeholder="naucz mojego syna nazw części ciała po angielsku"
          value={parentPrompt}
          onChange={(event) => setParentPrompt(event.target.value)}
        />
        <label htmlFor="childPrompt">childPrompt</label>
        <textarea
          id="childPrompt"
          name="childPrompt"
          required
          placeholder="chcę grę w której skacze się po górach!"
          value={childPrompt}
          onChange={(event) => setChildPrompt(event.target.value)}
        />
        <label htmlFor="childAge">childAge (optional, 3–18)</label>
        <input
          id="childAge"
          name="childAge"
          type="number"
          min={3}
          max={18}
          value={childAge}
          onChange={(event) => setChildAge(event.target.value)}
        />
        <label htmlFor="language">language (optional, default pl)</label>
        <input
          id="language"
          name="language"
          type="text"
          placeholder="pl"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        />
        <button type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'POST /api/games'}
        </button>
      </form>
      {submitError ? <p>{submitError}</p> : null}
      {result ? (
        <section>
          <h2>
            {createStatus ? `POST ${createStatus}` : `Response ${result.httpStatus}`}
            {game ? ` · ${game.status}` : ''}
            {game?.template ? ` · ${game.template}` : ''}
          </h2>
          {game?.gameUrl ? (
            <p>
              gameUrl: <a href={game.gameUrl}>{game.gameUrl}</a>
              {' · '}
              <a href={`${game.gameUrl}?assets=shapes`}>shape fallback</a>
            </p>
          ) : null}
          {game?.status === 'queued' || game?.status === 'generating' ? (
            <p>Waiting for the game to finish. This page checks every few seconds.</p>
          ) : null}
          {game?.status === 'ready' && game.gameUrl ? (
            <iframe title="Generated game" src={game.gameUrl} />
          ) : null}
          {game?.graphics.thumbnailUrl ? (
            <p>
              thumbnail
              <br />
              <img src={game.graphics.thumbnailUrl} alt="Game thumbnail" />
            </p>
          ) : null}
          <pre>{JSON.stringify(result.body, null, 2)}</pre>
        </section>
      ) : null}
    </main>
  );
}
