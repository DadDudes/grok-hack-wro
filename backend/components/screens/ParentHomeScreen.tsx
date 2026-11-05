'use client';

import Link from 'next/link';
import { findKid } from '../format';
import { Icon } from '../Icon';
import { PageHeader } from '../parent/PageHeader';
import { useFlow } from '../state/FlowProvider';
import { useParentSession } from '../state/useParentSession';
import { KidGoalsCard } from '../parent/KidGoalsCard';
import { useKidGoals } from '../state/useKidGoals';

type HowStep = {
  image: string | null;
  text: string;
};

const HOW_STEPS: HowStep[] = [
  { image: null, text: 'You set a learning goal' },
  { image: '/brand/agents/prof-head.svg', text: 'Prof turns it into tasks' },
  { image: '/brand/agents/spark-head.svg', text: 'Your kid picks the game with Spark' },
  { image: '/brand/agents/robo-head.svg', text: 'Robo plays on the team, hints only' },
  { image: '/brand/agents/lens-head.svg', text: 'Lens shows you the progress' },
];

export function ParentHomeScreen() {
  const { state } = useFlow();
  const session = useParentSession();
  const parentName = session.parent?.name ?? '';
  const goal = state.goal;
  const plan = state.plan;
  const goalKid = findKid(session.kids, goal?.kidId ?? null);
  const lastSession = state.lastSession;
  const kidIds = session.kids.map((kid) => kid.id);
  const goalsByKid = useKidGoals(kidIds);

  return (
    <>
      <PageHeader title={`Hi ${parentName}!`} sub="Pick a kid, set a goal, then let them design the game.">
        <Link className="cta teal sm" href="/parent/goal">
          <Icon name="spark" />
          New goal
        </Link>
      </PageHeader>

      {goal !== null && plan !== null && goalKid !== null && (
        <section className="panel pad" aria-labelledby="today-title">
          <h2 className="h-sec" id="today-title">
            Today
          </h2>
          <div className="status-row">
            <img src="/brand/agents/prof-head.svg" alt="" width={60} height={60} />
            <div className="tx">
              <b>{plan.goal}</b>
              <span className="p-par">
                {plan.tasks.length} tasks for {goalKid.name}, age {plan.age}
              </span>
              {state.planSentAt === null ? (
                <span className="badge">Not sent yet</span>
              ) : (
                <span className="badge ok">
                  <Icon name="check" />
                  Sent to {goalKid.name}
                </span>
              )}
            </div>
            <Link className="cta white sm" href="/parent/plan">
              See tasks
            </Link>
            {lastSession !== null && (
              <Link className="cta teal sm" href="/parent/report">
                <Icon name="chart" />
                Report
              </Link>
            )}
          </div>
        </section>
      )}

      <div className="kid-cards" id="kids">
        {session.kids.map((kid) => (
          <KidGoalsCard key={kid.id} kid={kid} goals={goalsByKid?.[kid.id] ?? []} />
        ))}
      </div>

      <section className="panel pad" aria-labelledby="how-title">
        <h2 className="h-sec" id="how-title">
          How it works
        </h2>
        <ol className="how">
          {HOW_STEPS.map((step) => (
            <li key={step.text}>
              {step.image === null ? (
                <span className="goal-icon">
                  <Icon name="target" />
                </span>
              ) : (
                <img src={step.image} alt="" width={56} height={56} />
              )}
              {step.text}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
