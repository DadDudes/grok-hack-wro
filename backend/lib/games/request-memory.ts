import type { CreateGameTask, GameTemplate } from '@grok-hack/api-contract';

import { canonicalTemplate } from '@/lib/game-spec/request-fields';

export type StoredGameRequest = {
  template?: GameTemplate;
  questionCount?: number;
  tasks?: CreateGameTask[];
};

const pending = new Map<string, StoredGameRequest>();

export function rememberGameRequest(
  id: string,
  value: { template?: string; questionCount?: number; tasks?: CreateGameTask[] },
): void {
  const template = canonicalTemplate(value.template);
  const tasks = value.tasks && value.tasks.length > 0 ? value.tasks : undefined;
  if (template === undefined && value.questionCount === undefined && tasks === undefined) return;
  pending.set(id, {
    template,
    questionCount: value.questionCount,
    tasks,
  });
}

export function readGameRequest(id: string): StoredGameRequest | undefined {
  return pending.get(id);
}
