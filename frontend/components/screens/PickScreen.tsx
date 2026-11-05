'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { previewOptions, suggestGames } from '@/lib/flow/client';
import type { GameOption, OptionPreviewResponse, SparkResponse } from '@/lib/flow/types';
import { Agent } from '../Agent';
import { GamePreview } from '../art/GamePreview';
import { ideaExclamation } from '../format';
import { topicPhrase } from '../goals';
import { Icon } from '../Icon';
import { KidShell } from '../kid/KidShell';
import { IdeaPill, KidPill, KidTop } from '../kid/KidTop';
import { useKidContext } from '../kid/useKidContext';
import { useRequest } from '../state/useRequest';
import { TryAgain } from '../TryAgain';

const TWO_OPTIONS = 2;

function startIndex(options: GameOption[], chosen: GameOption | null): number {
  if (chosen === null) {
    return 0;
  }

  const index = options.findIndex((option) => option.template === chosen.template);
  return Math.max(0, index);
}

type CardArtProps = {
  option: GameOption;
  painting: boolean;
  imageUrl: string | null;
};

function CardArt({ option, painting, imageUrl }: CardArtProps) {
  if (painting) {
    return (
      <span className="game-card-preview painting" aria-hidden="true">
        <span className="shimmer" />
        <Agent agent="doodle" pose="head" size="s88" motion="work" />
      </span>
    );
  }

  if (imageUrl !== null) {
    return (
      <span className="game-card-preview">
        <img src={imageUrl} alt="" />
      </span>
    );
  }

  return (
    <span className="game-card-preview">
      <GamePreview template={option.template} />
    </span>
  );
}

export function PickScreen() {
  const router = useRouter();
  const { ready, state, actions, kid } = useKidContext();
  const request = useRequest<SparkResponse>();
  const pictures = useRequest<OptionPreviewResponse>();
  const requestedRef = useRef('');
  const picturesRequestedRef = useRef('');
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const plan = state.plan;
  const goal = state.goal;
  const idea = state.kidIdea;
  const missingInput = ready && (plan === null || goal === null || idea === '');
  const needsOptions = ready && !missingInput && state.optionsFor !== idea;
  const hasOptionsForIdea = state.optionsFor === idea && state.options.length > 0;
  const needsPictures = ready && hasOptionsForIdea && state.optionImagesFor !== idea;
  const runRequest = request.run;
  const runPictures = pictures.run;
  const saveOptions = actions.setOptions;
  const saveOptionImages = actions.setOptionImages;

  useEffect(() => {
    if (missingInput) {
      router.replace('/play');
    }
  }, [missingInput, router]);

  const loadOptions = useCallback(async () => {
    if (plan === null) {
      return;
    }

    const response = await runRequest(() => suggestGames({ kidIdea: idea, age: plan.age, plan }));

    if (response === null) {
      return;
    }

    saveOptions(idea, response.options);
  }, [runRequest, saveOptions, idea, plan]);

  const loadPictures = useCallback(async () => {
    if (goal === null || state.options.length === 0) {
      return;
    }

    const options = state.options;
    const response = await runPictures(() => previewOptions({ kidIdea: idea, topic: goal.topic, options }));

    if (response === null) {
      return;
    }

    saveOptionImages(idea, response.imageUrls);
  }, [runPictures, saveOptionImages, idea, goal, state.options]);

  useEffect(() => {
    if (!needsOptions || requestedRef.current === idea) {
      return;
    }

    requestedRef.current = idea;
    void loadOptions();
  }, [needsOptions, idea, loadOptions]);

  useEffect(() => {
    if (!needsPictures || picturesRequestedRef.current === idea) {
      return;
    }

    picturesRequestedRef.current = idea;
    void loadPictures();
  }, [needsPictures, idea, loadPictures]);

  if (!ready || goal === null || idea === '') {
    return <KidShell>{null}</KidShell>;
  }

  const options = hasOptionsForIdea ? state.options : [];
  const hasOptions = options.length > 0;
  const isLoading = needsOptions && request.state.status !== 'failed';
  const hasFailed = request.state.status === 'failed';
  const isEmpty = !isLoading && !hasFailed && !hasOptions;
  const picturesFailed = pictures.state.status === 'failed';
  const isPainting = needsPictures && !picturesFailed;
  const selectedIndex = pickedIndex ?? startIndex(options, state.option);
  const cardsClass = options.length === TWO_OPTIONS ? 'game-cards two' : 'game-cards';
  const topic = topicPhrase(goal.topic);
  const opener = ideaExclamation(idea);

  function imageFor(index: number): string | null {
    if (state.optionImagesFor !== idea) {
      return null;
    }

    return state.optionImages[index] ?? null;
  }

  function build(): void {
    const option = options[selectedIndex];

    if (option === undefined) {
      return;
    }

    actions.chooseOption(option);
    router.push('/play/building');
  }

  function sparkLine(): string {
    if (isLoading) {
      return `${opener} Let me think of ways to play ${topic}...`;
    }

    return `${opener} Here are ${options.length} ways to play ${topic}. Pick one!`;
  }

  const sparkPose = isLoading ? 'working' : 'handoff';
  const sparkMotion = isLoading ? 'work' : 'bob';

  return (
    <KidShell>
      <KidTop backHref="/play">
        <IdeaPill idea={idea} editHref="/play" />
        <KidPill kid={kid} />
      </KidTop>
      <main className="kid-stage pick-stage">
        <h1 className="sr-only">Pick a game</h1>

        {hasFailed && (
          <TryAgain
            tone="kid"
            agent="spark"
            title="Spark got stuck."
            text="Let's ask Spark again."
            onRetry={() => void loadOptions()}
          >
            <Link className="cta white" href="/play">
              <Icon name="pencil" />
              New idea
            </Link>
          </TryAgain>
        )}

        {isEmpty && (
          <TryAgain
            tone="kid"
            agent="spark"
            title="Spark found no games for that."
            text="Ask again or try a new idea."
            onRetry={() => void loadOptions()}
          >
            <Link className="cta white" href="/play">
              <Icon name="pencil" />
              New idea
            </Link>
          </TryAgain>
        )}

        {!hasFailed && !isEmpty && (
          <>
            <section className="agent-lead" aria-live="polite">
              <Agent agent="spark" pose={sparkPose} size="s150" motion={sparkMotion} alt="Spark" />
              <p className="say l spark">{sparkLine()}</p>
            </section>

            {hasOptions && (
              <ul className={cardsClass} aria-label="Pick a game" aria-busy={isPainting}>
                {options.map((option, index) => {
                  const isPicked = index === selectedIndex;

                  return (
                    <li key={`${option.template}-${option.title}`}>
                      <button
                        className="game-card"
                        type="button"
                        aria-pressed={isPicked}
                        onClick={() => setPickedIndex(index)}
                      >
                        <CardArt option={option} painting={isPainting} imageUrl={imageFor(index)} />
                        <span className="game-card-body">
                          <span className="game-card-title">{option.title}</span>
                          <span className="game-card-text">{option.pitch}</span>
                        </span>
                        {isPicked && (
                          <span className="game-card-pick">
                            <Icon name="check" />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {picturesFailed && (
              <div className="pictures-oops" role="status">
                <img src="/brand/agents/doodle-head.svg" alt="" width={44} height={44} />
                <span>Doodle could not paint the pictures.</span>
                <button className="pill" type="button" onClick={() => void loadPictures()}>
                  <Icon name="refresh" />
                  Try again
                </button>
              </div>
            )}

            <button className="cta build-cta" type="button" disabled={!hasOptions} onClick={build}>
              <Icon name="spark" />
              Build my game!
            </button>
          </>
        )}
      </main>
    </KidShell>
  );
}
