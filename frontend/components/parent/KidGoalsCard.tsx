'use client';

import { useRouter } from 'next/navigation';
import type { KidProfile } from '@/lib/flow/types';
import { percentOf } from '../format';
import { Icon } from '../Icon';
import { KidAvatar } from '../KidAvatar';
import type { GoalRecord, GoalStatus } from '../state/goalsStore';
import { useFlow } from '../state/FlowProvider';

const STATUS_LABELS: Record<GoalStatus, string> = {
  planned: 'Planned',
  playing: 'Playing',
  report: 'Report ready',
};

const STATUS_CLASSES: Record<GoalStatus, string> = {
  planned: 'badge',
  playing: 'badge play',
  report: 'badge ok',
};

function shortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en', { day: 'numeric', month: 'short' });
}

function lastResult(goals: GoalRecord[]): string {
  const withReport = goals.find((record) => record.report !== null);

  if (withReport === undefined || withReport.report === null) {
    return 'No result yet';
  }

  return `Last result ${percentOf(withReport.report.accuracyNow)}%`;
}

type KidGoalsCardProps = {
  kid: KidProfile;
  goals: GoalRecord[];
};

export function KidGoalsCard({ kid, goals }: KidGoalsCardProps) {
  const router = useRouter();
  const { actions } = useFlow();

  function newGoal(): void {
    actions.selectKid(kid.id);
    router.push('/parent/goal');
  }

  function viewPlan(record: GoalRecord): void {
    actions.openGoal(record);
    router.push('/parent/plan');
  }

  function viewReport(record: GoalRecord): void {
    actions.openGoal(record);
    router.push('/parent/report');
  }

  return (
    <section className="panel pad kid-card" aria-labelledby={`kid-${kid.id}`}>
      <header className="kid-card-head">
        <KidAvatar name={kid.name} color={kid.color} size="lg" />
        <div className="tx">
          <h2 className="h-sec" id={`kid-${kid.id}`}>
            {kid.name}, {kid.age}
          </h2>
          <span className="p-par">{lastResult(goals)}</span>
        </div>
        <button className="cta teal sm fit" type="button" onClick={newGoal}>
          <Icon name="spark" />
          New goal for {kid.name}
        </button>
      </header>
      {goals.length === 0 ? (
        <p className="p-par">No goals yet. Set the first one and Prof makes the tasks.</p>
      ) : (
        <ul className="goal-list">
          {goals.map((record) => {
            const hasReport = record.session !== null || record.report !== null;

            return (
              <li key={record.id}>
                <div className="goal-main">
                  <b>{record.plan.goal}</b>
                  <span>
                    {shortDate(record.createdAt)} · {record.plan.tasks.length} questions
                  </span>
                </div>
                <span className={STATUS_CLASSES[record.status]}>{STATUS_LABELS[record.status]}</span>
                <div className="goal-acts">
                  <button className="cta white sm fit" type="button" onClick={() => viewPlan(record)}>
                    View plan
                  </button>
                  {hasReport && (
                    <button className="cta white sm fit" type="button" onClick={() => viewReport(record)}>
                      View report
                    </button>
                  )}
                  <button className="cta white sm fit" type="button" onClick={() => viewPlan(record)}>
                    <Icon name="refresh" />
                    Play again
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
