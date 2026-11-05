'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Difficulty, Goal, KidProfile, Task, TaskPlan } from '@/lib/flow/types';
import { Agent } from '../Agent';
import { findKid } from '../format';
import { Icon } from '../Icon';
import { PageHeader } from '../parent/PageHeader';
import { useFlow, type FlowActions } from '../state/FlowProvider';
import { updateGoal } from '../state/goalsStore';
import { useParentSession } from '../state/useParentSession';

const LEVEL_NAMES: Record<Difficulty, string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
};

const DIFFICULTIES: Difficulty[] = [1, 2, 3];

type EditableField = 'question' | 'answer';

function LevelDots({ difficulty, withName }: { difficulty: Difficulty; withName: boolean }) {
  return (
    <span className="lv">
      {DIFFICULTIES.map((level) => (
        <i key={level} className={level <= difficulty ? 'on' : ''} />
      ))}
      {withName && <span>{LEVEL_NAMES[difficulty]}</span>}
    </span>
  );
}

export function PlanScreen() {
  const router = useRouter();
  const { ready, state, actions } = useFlow();
  const session = useParentSession();
  const plan = state.plan;
  const goal = state.goal;
  const missingPlan = ready && (plan === null || goal === null);

  useEffect(() => {
    if (missingPlan) {
      router.replace('/parent/goal');
    }
  }, [missingPlan, router]);

  if (plan === null || goal === null) {
    return null;
  }

  const kid = findKid(session.kids, goal.kidId) ?? session.kids[0];

  return (
    <PlanView
      plan={plan}
      goal={goal}
      goalId={state.goalId}
      kid={kid}
      sentAt={state.planSentAt}
      actions={actions}
    />
  );
}

type PlanViewProps = {
  plan: TaskPlan;
  goal: Goal;
  goalId: string | null;
  kid: KidProfile;
  sentAt: string | null;
  actions: FlowActions;
};

function PlanView({ plan, goal, goalId, kid, sentAt, actions }: PlanViewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Task[]>(plan.tasks);
  const [focusIndex, setFocusIndex] = useState(0);
  const [editError, setEditError] = useState<string | null>(null);
  const taskCount = plan.tasks.length;
  const isSent = sentAt !== null;

  function countLevel(level: Difficulty): number {
    const matching = plan.tasks.filter((task) => task.difficulty === level);
    return matching.length;
  }

  function startEditing(index: number): void {
    setDraft(plan.tasks);
    setFocusIndex(index);
    setEditError(null);
    setEditing(true);
  }

  function cancelEditing(): void {
    setEditing(false);
    setEditError(null);
  }

  function changeDraft(index: number, field: EditableField, value: string): void {
    setDraft((previous) => {
      const next = [...previous];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function saveEditing(): void {
    const cleaned = draft.map((task) => ({
      ...task,
      question: task.question.trim(),
      answer: task.answer.trim(),
    }));
    const hasEmpty = cleaned.some((task) => task.question === '' || task.answer === '');

    if (hasEmpty) {
      setEditError('Every task needs a question and an answer.');
      return;
    }

    actions.updateTasks(cleaned);
    setEditing(false);

    if (goalId !== null) {
      const editedPlan: TaskPlan = { ...plan, tasks: cleaned };
      void updateGoal(goal.kidId, goalId, { plan: editedPlan });
    }
    setEditError(null);
  }

  const rows = editing ? draft : plan.tasks;

  return (
    <>
      <PageHeader
        title={`Tasks for ${kid.name}`}
        sub={`${goal.topic} · age ${plan.age} · ${taskCount} tasks`}
        backHref="/parent/goal"
      >
        {editing && (
          <>
            <button className="cta white sm" type="button" onClick={cancelEditing}>
              Cancel
            </button>
            <button className="cta teal sm" type="button" onClick={saveEditing}>
              <Icon name="check" />
              Save tasks
            </button>
          </>
        )}
        {!editing && (
          <button className="cta white sm" type="button" onClick={() => startEditing(0)}>
            <Icon name="pencil" />
            Edit tasks
          </button>
        )}
        {!editing && !isSent && (
          <button className="cta teal sm" type="button" onClick={actions.sendPlan}>
            <Icon name="send" />
            Send to {kid.name}
          </button>
        )}
        {!editing && isSent && (
          <Link className="cta teal sm" href="/play">
            <Icon name="pad" />
            Open kid mode
          </Link>
        )}
      </PageHeader>

      {editError !== null && (
        <p className="notice bad" role="alert">
          {editError}
        </p>
      )}

      {isSent && !editing && (
        <p className="notice" role="status">
          Sent! {kid.name} can now tell Spark how to play. Open kid mode on this device.
        </p>
      )}

      <div className="cols c-side">
        <section className="panel pad helper" aria-label="Prof">
          <Agent agent="prof" pose="done" size="s150" motion="done" alt="Prof, done" />
          <div className="goal-line">
            <span>Prof&apos;s goal</span>
            <b>{plan.goal}</b>
          </div>
          <p className="say u prof par">
            I made {taskCount} tasks for age {plan.age}, easy to hard. You can change any of them.
          </p>
          <ul className="levels">
            {DIFFICULTIES.map((level) => (
              <li key={level}>
                <LevelDots difficulty={level} withName={false} />
                {LEVEL_NAMES[level]}
                <b>{countLevel(level)}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel flush" aria-label="Tasks">
          <table className="tbl">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Task</th>
                <th>Answer</th>
                <th>Skill</th>
                <th>Level</th>
                <th className="act">Edit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((task, index) => {
                const number = index + 1;

                return (
                  <tr key={task.id}>
                    <td className="num">
                      <span className="n">{number}</span>
                    </td>
                    <td>
                      {editing ? (
                        <input
                          className="cell-in"
                          type="text"
                          aria-label={`Task ${number}`}
                          autoFocus={index === focusIndex}
                          value={task.question}
                          onChange={(event) => changeDraft(index, 'question', event.target.value)}
                        />
                      ) : (
                        <b>{task.question}</b>
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          className="cell-in short"
                          type="text"
                          aria-label={`Answer ${number}`}
                          value={task.answer}
                          onChange={(event) => changeDraft(index, 'answer', event.target.value)}
                        />
                      ) : (
                        <span className="ans">{task.answer}</span>
                      )}
                    </td>
                    <td className="muted">{task.skill}</td>
                    <td>
                      <LevelDots difficulty={task.difficulty} withName={true} />
                    </td>
                    <td className="act">
                      {!editing && (
                        <button
                          className="edit"
                          type="button"
                          aria-label={`Edit task ${number}`}
                          onClick={() => startEditing(index)}
                        >
                          <Icon name="pencil" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
