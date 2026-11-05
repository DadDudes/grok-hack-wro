'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { transcribe } from '@/lib/flow/client';
import type { Transcript } from '@/lib/flow/types';
import { Agent } from '../Agent';
import { sparkQuestion } from '../goals';
import { Icon } from '../Icon';
import { KidShell } from '../kid/KidShell';
import { KidPill, KidTop, TopicPill } from '../kid/KidTop';
import { useKidContext } from '../kid/useKidContext';
import { useVoiceRecorder } from '../kid/useVoiceRecorder';
import { useRequest } from '../state/useRequest';
import { TryAgain } from '../TryAgain';

const HOLD_MIN_MS = 400;
const WAVE_BARS = 9;
const IDEA_MAX_LENGTH = 120;
const WAVE_KEYS = Array.from({ length: WAVE_BARS }, (_, index) => index);

type Phase = 'idle' | 'recording' | 'transcribing' | 'confirm' | 'failed';

export function KidHomeScreen() {
  const router = useRouter();
  const { ready, state, actions, kid } = useKidContext();
  const recorder = useVoiceRecorder();
  const transcription = useRequest<Transcript>();
  const [typed, setTyped] = useState('');
  const pressStartRef = useRef(0);
  const lastAudioRef = useRef<Blob | null>(null);

  if (!ready) {
    return <KidShell>{null}</KidShell>;
  }

  const goal = state.goal;
  const plan = state.plan;
  const hasGoal = goal !== null && plan !== null;
  const question = goal === null ? '' : sparkQuestion(goal.topic);
  const heard = transcription.state.status === 'done' ? transcription.state.data.text.trim() : '';
  const isRecording = recorder.status !== 'idle';

  function currentPhase(): Phase {
    if (isRecording) {
      return 'recording';
    }

    if (transcription.state.status === 'loading') {
      return 'transcribing';
    }

    if (transcription.state.status === 'failed') {
      return 'failed';
    }

    if (heard !== '') {
      return 'confirm';
    }

    return 'idle';
  }

  const phase = currentPhase();

  function chooseIdea(idea: string): void {
    actions.setIdea(idea);
    router.push('/play/pick');
  }

  async function transcribeAudio(audio: Blob): Promise<void> {
    lastAudioRef.current = audio;
    await transcription.run(() => transcribe(audio));
  }

  function retryTranscribe(): void {
    const audio = lastAudioRef.current;

    if (audio === null) {
      transcription.reset();
      return;
    }

    void transcribeAudio(audio);
  }

  function beginRecording(): void {
    transcription.reset();
    void recorder.start((audio) => void transcribeAudio(audio));
  }

  function toggleRecording(): void {
    if (recorder.status === 'recording') {
      recorder.stop();
      return;
    }

    beginRecording();
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>): void {
    if (event.button !== 0) {
      return;
    }

    pressStartRef.current = Date.now();
    toggleRecording();
  }

  function handlePointerUp(): void {
    if (recorder.status !== 'recording') {
      return;
    }

    const heldMs = Date.now() - pressStartRef.current;

    if (heldMs >= HOLD_MIN_MS) {
      recorder.stop();
    }
  }

  function handleMicKey(event: KeyboardEvent<HTMLButtonElement>): void {
    const isActivation = event.key === 'Enter' || event.key === ' ';

    if (!isActivation) {
      return;
    }

    event.preventDefault();

    if (event.repeat) {
      return;
    }

    toggleRecording();
  }

  function handleTypedSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const idea = typed.trim();

    if (idea === '') {
      return;
    }

    chooseIdea(idea);
  }

  const micClass = phase === 'recording' ? 'mic huge live' : 'mic huge';
  const micLabel = phase === 'recording' ? 'Stop talking' : 'Hold to talk';
  const micProblem = recorder.problem !== null;

  return (
    <KidShell>
      <KidTop>
        {goal !== null && <TopicPill topic={goal.topic} />}
        <Link className="pill kid-button icon-first" href="/join">
          <Icon name="users" />
          Join a friend
        </Link>
        <KidPill kid={kid} />
      </KidTop>
      <main className="kid-stage home-stage">
        <section className="greeting">
          <Agent agent="robo" size="s200" motion="bob" alt="Robo" />
          <div className="greeting-text">
            <h1 className="h-kid">Hi {kid.name}!</h1>
            {hasGoal ? (
              <p className="p-kid">{question}</p>
            ) : (
              <p className="p-kid">Ask a grown-up to pick today&apos;s topic first.</p>
            )}
          </div>
        </section>

        {!hasGoal && (
          <Link className="cta fit build-cta" href="/login">
            <Icon name="users" />
            I&apos;m a grown-up
          </Link>
        )}

        {hasGoal && phase === 'failed' && (
          <TryAgain
            tone="kid"
            agent="spark"
            title="Spark could not hear that."
            text="Try again, or type your idea below."
            onRetry={retryTranscribe}
          >
            <button className="cta white" type="button" onClick={beginRecording}>
              <Icon name="mic" />
              Talk again
            </button>
          </TryAgain>
        )}

        {hasGoal && phase === 'transcribing' && (
          <div className="mic-zone" aria-live="polite">
            <div className="agent-lead">
              <Agent agent="spark" pose="working" size="s150" motion="work" alt="Spark" />
              <p className="say l spark">Spark is listening to your idea...</p>
            </div>
          </div>
        )}

        {hasGoal && phase === 'confirm' && (
          <div className="mic-zone">
            <p className="transcript" aria-live="polite">
              <span>You said</span>
              <b>{heard}</b>
            </p>
            <div className="kid-actions">
              <button className="cta" type="button" onClick={() => chooseIdea(heard)}>
                Let&apos;s go!
                <Icon name="arrow" />
              </button>
              <button className="cta white" type="button" onClick={beginRecording}>
                <Icon name="refresh" />
                Say it again
              </button>
            </div>
          </div>
        )}

        {hasGoal && (phase === 'idle' || phase === 'recording') && (
          <div className="mic-zone">
            <button
              className={micClass}
              type="button"
              aria-label={micLabel}
              aria-pressed={phase === 'recording'}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onKeyDown={handleMicKey}
            >
              <Icon name="mic" />
            </button>
            {phase === 'recording' && (
              <>
                <div className="wave" aria-hidden="true">
                  {WAVE_KEYS.map((key) => (
                    <i key={key} />
                  ))}
                </div>
                <p className="voice-hint" aria-live="polite">
                  Listening! Let go or tap when you are done.
                </p>
              </>
            )}
            {phase === 'idle' && !micProblem && (
              <p className="voice-hint">
                <img src="/brand/agents/spark-head.svg" alt="" width={44} height={44} />
                Hold and tell Spark your idea
              </p>
            )}
            {phase === 'idle' && micProblem && (
              <p className="voice-hint" role="status">
                <img src="/brand/agents/spark-head.svg" alt="" width={44} height={44} />
                No mic here. Type your idea below!
              </p>
            )}
          </div>
        )}

        {hasGoal && (
          <form className="in kid idea-input" onSubmit={handleTypedSubmit}>
            <Icon name="keyboard" />
            <input
              type="text"
              placeholder="or type it here"
              aria-label="Type your idea"
              maxLength={IDEA_MAX_LENGTH}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
            <button className="act" type="submit" aria-label="Send idea" disabled={typed.trim() === ''}>
              <Icon name="arrow" />
            </button>
          </form>
        )}
      </main>
    </KidShell>
  );
}
