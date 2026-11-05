'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createPlan } from '@/lib/flow/client';
import type { Goal, KidProfile, QuestionCount, TaskPlan } from '@/lib/flow/types';
import { Agent } from '../Agent';
import { findKid } from '../format';
import { GOAL_MAX_LENGTH, GOAL_MIN_LENGTH, QUICK_GOALS } from '../goals';
import { Icon } from '../Icon';
import { KidAvatar } from '../KidAvatar';
import { PageHeader } from '../parent/PageHeader';
import { useFlow } from '../state/FlowProvider';
import { createGoal } from '../state/goalsStore';
import { useParentSession } from '../state/useParentSession';
import { useRequest } from '../state/useRequest';
import { TryAgain } from '../TryAgain';

const MIN_AGE = 6;
const MAX_AGE = 12;
const AGES = [6, 7, 8, 9, 10, 11, 12];
const QUESTION_COUNTS: QuestionCount[] = [5, 10];
const DEFAULT_QUESTION_COUNT: QuestionCount = 10;
const GOAL_LANGUAGE = 'en';

function clampAge(age: number): number {
  return Math.min(MAX_AGE, Math.max(MIN_AGE, age));
}

export function GoalScreen() {
  const { ready } = useFlow();
  const session = useParentSession();

  if (!ready || !session.ready) {
    return null;
  }

  return <GoalForm kids={session.kids} />;
}

function GoalForm({ kids }: { kids: KidProfile[] }) {
  const router = useRouter();
  const { state, actions } = useFlow();
  const request = useRequest<TaskPlan>();
  const startKidId = state.draftKidId ?? state.goal?.kidId ?? null;
  const startKid = findKid(kids, startKidId) ?? kids[0];
  const [kidId, setKidId] = useState(startKid.id);
  const [topic, setTopic] = useState(state.goal?.topic ?? '');
  const [age, setAge] = useState(clampAge(startKid.age));
  const [questionCount, setQuestionCount] = useState<QuestionCount>(
    state.goal?.questionCount ?? DEFAULT_QUESTION_COUNT,
  );

  const kid = findKid(kids, kidId) ?? startKid;
  const trimmedTopic = topic.trim();
  const topicIsValid = trimmedTopic.length >= GOAL_MIN_LENGTH && trimmedTopic.length <= GOAL_MAX_LENGTH;
  const isLoading = request.state.status === 'loading';
  const hasFailed = request.state.status === 'failed';
  const sliderClass = `slider at-${age - MIN_AGE}`;

  function pickKid(next: KidProfile): void {
    setKidId(next.id);
    setAge(clampAge(next.age));
  }

  async function createTasks(): Promise<void> {
    if (!topicIsValid) {
      return;
    }

    const goal: Goal = {
      kidId: kid.id,
      topic: trimmedTopic,
      age,
      questionCount,
      language: GOAL_LANGUAGE,
    };

    const plan = await request.run(() => createPlan(goal));

    if (plan === null) {
      return;
    }

    const record = await createGoal(goal, plan);
    actions.savePlan(goal, plan, record.id);
    router.push('/parent/plan');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void createTasks();
  }

  const profPose = isLoading ? 'working' : 'idle';
  const profMotion = isLoading ? 'work' : 'bob';
  const profLine = isLoading
    ? `Making ${questionCount} tasks for age ${age}...`
    : 'Write it your way. I turn it into tasks, easy to hard.';
  const submitLabel = isLoading ? 'Prof is making tasks...' : 'Create game';

  return (
    <>
      <PageHeader
        title="New goal"
        sub={`Prof turns your goal into ${questionCount} tasks, easy to hard.`}
        backHref="/parent"
      />

      {hasFailed && (
        <TryAgain
          tone="parent"
          agent="prof"
          title="Prof could not make the tasks."
          text="Nothing was lost. Check the goal and try again."
          onRetry={() => void createTasks()}
        />
      )}

      <div className="cols c-form">
        <form className="panel pad form" aria-label="Goal" onSubmit={handleSubmit}>
          <fieldset className="fld">
            <legend>For</legend>
            <div className="seg">
              {kids.map((option) => (
                <label key={option.id}>
                  <input
                    type="radio"
                    name="goal-kid"
                    value={option.id}
                    checked={option.id === kid.id}
                    onChange={() => pickKid(option)}
                  />
                  <KidAvatar name={option.name} color={option.color} size="sm" />
                  {option.name}, {option.age}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="fld">
            <div className="talk ask">
              <img src="/brand/agents/prof-head.svg" alt="Prof" width={60} height={60} />
              <label className="say l prof" htmlFor="goal-text">
                What does {kid.name} want or need to learn?
              </label>
            </div>
            <div className="in">
              <input
                id="goal-text"
                type="text"
                maxLength={GOAL_MAX_LENGTH}
                placeholder="For example: multiplication up to 50"
                value={topic}
                aria-describedby="goal-hint"
                onChange={(event) => setTopic(event.target.value)}
              />
            </div>
            <span className="hint" id="goal-hint">
              3 to 120 characters. Write it the way you would say it.
            </span>
          </div>

          <div className="chipset" role="group" aria-label="Quick answers">
            {QUICK_GOALS.map((quick) => (
              <button
                className="chip"
                type="button"
                key={quick.label}
                aria-pressed={trimmedTopic === quick.goal}
                onClick={() => setTopic(quick.goal)}
              >
                {quick.label}
              </button>
            ))}
          </div>

          <div className="cols c-half">
            <div className="fld">
              <span className="rowlbl">
                <label htmlFor="goal-age">Age</label>
                <span className="val" aria-hidden="true">
                  {age}
                </span>
              </span>
              <div className={sliderClass}>
                <span className="track" />
                <span className="fill" />
                <input
                  id="goal-age"
                  type="range"
                  min={MIN_AGE}
                  max={MAX_AGE}
                  step={1}
                  value={age}
                  aria-valuetext={`${age} years`}
                  onChange={(event) => setAge(Number(event.target.value))}
                />
              </div>
              <div className="ticks" aria-hidden="true">
                {AGES.map((tick) => (
                  <span key={tick} className={tick === age ? 'on' : ''}>
                    {tick}
                  </span>
                ))}
              </div>
            </div>
            <fieldset className="fld">
              <legend className="rowlbl">Number of questions</legend>
              <div className="seg">
                {QUESTION_COUNTS.map((count) => (
                  <label key={count}>
                    <input
                      type="radio"
                      name="goal-count"
                      value={count}
                      checked={count === questionCount}
                      onChange={() => setQuestionCount(count)}
                    />
                    {count}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <button className="cta teal" type="submit" disabled={!topicIsValid || isLoading}>
            <Icon name="spark" />
            {submitLabel}
          </button>
        </form>

        <section className="panel pad helper" aria-label="Prof">
          <Agent agent="prof" pose={profPose} size="s150" motion={profMotion} alt="Prof, the Pedagogue" />
          <p className="say u prof par" aria-live="polite">
            {profLine}
          </p>
          <h2 className="h-sec">What happens next</h2>
          <ol className="steps">
            <li>
              <img src="/brand/agents/prof-head.svg" alt="" width={48} height={48} />
              Prof makes {questionCount} tasks for age {age}
            </li>
            <li>
              <img src="/brand/agents/spark-head.svg" alt="" width={48} height={48} />
              {kid.name} tells Spark how to play
            </li>
            <li>
              <img src="/brand/agents/robo-head.svg" alt="" width={48} height={48} />
              Robo plays on {kid.name}&apos;s team, hints only
            </li>
            <li>
              <img src="/brand/agents/lens-head.svg" alt="" width={48} height={48} />
              Lens shows you the progress
            </li>
          </ol>
        </section>
      </div>
    </>
  );
}
