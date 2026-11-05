'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPlan, getReport } from '@/lib/flow/client';
import type {
  GameOption,
  Goal,
  KidProfile,
  Report,
  SessionResult,
  TaskPlan,
} from '@/lib/flow/types';
import { Agent } from '../Agent';
import { findKid, joinWithAnd, percentOf, widthClass } from '../format';
import { Icon } from '../Icon';
import { PageHeader } from '../parent/PageHeader';
import { playerNames, sessionStats } from '../state/derive';
import { useFlow, type FlowActions } from '../state/FlowProvider';
import { createGoal, updateGoal } from '../state/goalsStore';
import { useParentSession } from '../state/useParentSession';
import { useRequest } from '../state/useRequest';
import { TryAgain } from '../TryAgain';

const NEXT_TASKS_SHOWN = 4;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function dayLabel(session: SessionResult): string {
  const last = session.events[session.events.length - 1];

  if (last === undefined) {
    return 'today';
  }

  const playedAt = new Date(last.at);
  const playedDay = new Date(playedAt.getFullYear(), playedAt.getMonth(), playedAt.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = Math.round((today.getTime() - playedDay.getTime()) / MS_PER_DAY);

  if (daysAgo <= 0) {
    return 'today';
  }

  if (daysAgo === 1) {
    return 'yesterday';
  }

  return playedAt.toLocaleDateString('en', { day: 'numeric', month: 'short' });
}

export function ReportScreen() {
  const { ready, state, actions } = useFlow();
  const session = useParentSession();

  if (!ready || !session.ready) {
    return null;
  }

  const plan = state.plan;
  const goal = state.goal;
  const lastSession = state.lastSession;
  const kid = findKid(session.kids, goal?.kidId ?? null) ?? session.kids[0];

  if (plan === null || goal === null || lastSession === null) {
    return <EmptyReport kid={kid} hasPlan={plan !== null} />;
  }

  const reportKey = `${lastSession.gameId}-${lastSession.seconds}-${lastSession.events.length}`;

  return (
    <ReportView
      key={reportKey}
      plan={plan}
      goal={goal}
      kid={kid}
      option={state.option}
      session={lastSession}
      previous={state.previousSession}
      goalId={state.goalId}
      actions={actions}
    />
  );
}

function EmptyReport({ kid, hasPlan }: { kid: KidProfile; hasPlan: boolean }) {
  return (
    <>
      <PageHeader title="Reports" sub="Lens shows what your kids learned after each game." backHref="/parent" />
      <section className="panel pad" aria-label="No report yet">
        <div className="talk">
          <Agent agent="lens" pose="idle" size="s120" motion="bob" alt="Lens" />
          <p className="say l lens par">
            No game played yet. When {kid.name} finishes a game, I show you what {kid.name} learned and
            what to practise next.
          </p>
        </div>
        <div className="oops-actions">
          {hasPlan ? (
            <Link className="cta teal sm fit" href="/play">
              <Icon name="pad" />
              Open kid mode
            </Link>
          ) : (
            <Link className="cta teal sm fit" href="/parent/goal">
              <Icon name="target" />
              Set a goal
            </Link>
          )}
        </div>
      </section>
    </>
  );
}

type ReportViewProps = {
  plan: TaskPlan;
  goal: Goal;
  kid: KidProfile;
  option: GameOption | null;
  session: SessionResult;
  previous: SessionResult | null;
  goalId: string | null;
  actions: FlowActions;
};

function ReportView({ plan, goal, kid, option, session, previous, goalId, actions }: ReportViewProps) {
  const router = useRouter();
  const report = useRequest<Report>();
  const replan = useRequest<TaskPlan>();
  const startedRef = useRef(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const runReport = report.run;

  const loadReport = useCallback(async () => {
    const made = await runReport(() => getReport({ plan, session, previous }));

    if (made === null || goalId === null) {
      return;
    }

    await updateGoal(goal.kidId, goalId, { status: 'report', report: made, session });
  }, [runReport, plan, session, previous, goalId, goal.kidId]);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    void loadReport();
  }, [loadReport]);

  async function createNextPlan(): Promise<void> {
    const feedback = report.state.status === 'done' ? report.state.data.pedagogueFeedback : undefined;
    const nextPlan = await replan.run(() => createPlan(goal, feedback));

    if (nextPlan === null) {
      return;
    }

    const record = await createGoal(goal, nextPlan);
    actions.savePlan(goal, nextPlan, record.id);
    router.push('/parent/plan');
  }

  async function shareReport(): Promise<void> {
    const link = window.location.href;

    try {
      await navigator.clipboard.writeText(link);
      setShareNote('Link copied. It opens this report on this device.');
    } catch {
      setShareNote('Could not copy the link. Copy it from the address bar.');
    }
  }

  const friends = playerNames(kid.name, session.events).filter((name) => name !== kid.name);
  const team = joinWithAnd([...friends, 'Robo']);
  const gameTitle = option?.title ?? 'The';
  const subtitle = `${goal.topic} · ${dayLabel(session)} · ${gameTitle} game with ${team}`;
  const isReplanning = replan.state.status === 'loading';
  const reportSettled = report.state.status === 'done' || report.state.status === 'failed';
  const nextPlanLabel = isReplanning ? 'Prof is making the next plan...' : 'Create next plan';

  return (
    <>
      <PageHeader title={`${kid.name}'s report`} sub={subtitle} backHref="/parent">
        <button className="round" type="button" aria-label="Share report" onClick={() => void shareReport()}>
          <Icon name="share" />
        </button>
        <button
          className="cta teal sm"
          type="button"
          disabled={isReplanning || !reportSettled}
          onClick={() => void createNextPlan()}
        >
          <Icon name="refresh" />
          {nextPlanLabel}
        </button>
      </PageHeader>

      {shareNote !== null && (
        <p className="notice" role="status">
          {shareNote}
        </p>
      )}

      {replan.state.status === 'failed' && (
        <TryAgain
          tone="parent"
          agent="prof"
          title="Prof could not make new tasks."
          text="The report is still here. Try again in a moment."
          onRetry={() => void createNextPlan()}
        />
      )}

      {report.state.status === 'failed' && (
        <TryAgain
          tone="parent"
          agent="lens"
          title="Lens could not read the game."
          text={`${kid.name}'s answers are saved. Try again in a moment.`}
          onRetry={() => void loadReport()}
        />
      )}

      {(report.state.status === 'loading' || report.state.status === 'idle') && (
        <section className="panel pad" aria-busy="true" aria-label="Report">
          <div className="talk">
            <Agent agent="lens" pose="working" size="s120" motion="work" alt="Lens, working" />
            <p className="say l lens par">Reading {kid.name}&apos;s answers. One moment...</p>
          </div>
        </section>
      )}

      {report.state.status === 'done' && (
        <ReportBody report={report.state.data} plan={plan} kid={kid} session={session} />
      )}
    </>
  );
}

type ReportBodyProps = {
  report: Report;
  plan: TaskPlan;
  kid: KidProfile;
  session: SessionResult;
};

function ReportBody({ report, plan, kid, session }: ReportBodyProps) {
  const stats = sessionStats(session, plan);
  const before = percentOf(report.accuracyBefore);
  const now = percentOf(report.accuracyNow);
  const points = percentOf(report.delta);
  const isUp = points >= 0;
  const pointsLabel = isUp ? `+${points} points` : `${points} points`;
  const upClass = isUp ? 'up' : 'up down';
  const upIcon = isUp ? 'up' : 'down';
  const weakTasks = plan.tasks.filter((task) => report.weakSkills.includes(task.skill));
  const nextTasks = weakTasks.slice(0, NEXT_TASKS_SHOWN);
  const hasWeakSkills = report.weakSkills.length > 0;

  return (
    <>
      <div className="cols c-half">
        <section className="panel pad" aria-labelledby="accuracy-title">
          <h2 className="ptitle" id="accuracy-title">
            Accuracy
          </h2>
          <div className="delta">
            <span className="was">{before}%</span>
            <Icon name="arrow" />
            <span className="now">{now}%</span>
            <span className={upClass}>
              <Icon name={upIcon} />
              {pointsLabel}
            </span>
          </div>
          <div className="talk">
            <Agent agent="lens" pose="done" size="s88" motion="done" alt="Lens, done" />
            <p className="say l lens par">{report.parentSummary}</p>
          </div>
          <dl className="stat">
            <div>
              <dt>tasks solved</dt>
              <dd>
                {stats.solved} of {stats.total}
              </dd>
            </div>
            <div>
              <dt>tries right</dt>
              <dd>
                {stats.triesRight} of {stats.tries}
              </dd>
            </div>
            <div>
              <dt>Robo hints</dt>
              <dd>{stats.hints}</dd>
            </div>
            <div>
              <dt>played</dt>
              <dd>{stats.minutes} min</dd>
            </div>
          </dl>
        </section>

        <section className="panel pad" aria-labelledby="next-title">
          <h2 className="ptitle" id="next-title">
            Next step
          </h2>
          <div className="pass">
            <Agent agent="lens" pose="head" size="s60" alt="Lens" />
            <div className="lane">
              <span className="fly" />
            </div>
            <Agent agent="prof" pose="head" size="s60" alt="Prof" />
          </div>
          <p className="p-par">
            Lens passes the weak skills to Prof. {report.pedagogueFeedback}
          </p>
          {hasWeakSkills ? (
            <div className="weak">
              <b>Weak:</b>
              {report.weakSkills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          ) : (
            <p className="p-par">No weak skills this time. {kid.name} can try a harder goal.</p>
          )}
          {nextTasks.length > 0 && (
            <ul className="minitasks" aria-label="Tasks to practise">
              {nextTasks.map((task) => (
                <li key={task.id}>{task.question}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel pad" aria-labelledby="skill-title">
        <div className="ptitle">
          <h2 className="h-sec" id="skill-title">
            By skill
          </h2>
          <span className="legend" aria-hidden="true">
            <span>
              <i />
              Before
            </span>
            <span>
              <i className="now" />
              Now
            </span>
          </span>
        </div>
        {report.bySkill.map((score) => {
            const beforePercent = percentOf(score.before);
            const nowPercent = percentOf(score.now);

            return (
              <div className="skw" key={score.skill}>
                <span>{score.skill}</span>
                <div className="bars" aria-hidden="true">
                  <i className={widthClass(score.before)} />
                  <i className={`now ${widthClass(score.now)}`} />
                </div>
                <b>
                  <small>{beforePercent}% →</small> {nowPercent}%
                </b>
              </div>
            );
          })}
      </section>
    </>
  );
}
