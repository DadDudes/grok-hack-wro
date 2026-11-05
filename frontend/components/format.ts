import type { KidProfile } from '@/lib/flow/types';

const WIDTH_STEP = 5;
const FULL_WIDTH = 100;

const KID_COLOR_CLASSES: Record<string, string> = {
  '#ff6fa5': 'pink',
  '#4cc9f0': 'blue',
  '#2ed3a0': 'mint',
  '#ff8a3d': 'tangerine',
  '#ffb3c7': 'cheek',
};

export function percentOf(fraction: number): number {
  return Math.round(fraction * FULL_WIDTH);
}

export function widthClass(fraction: number): string {
  const clamped = Math.min(1, Math.max(0, fraction));
  const steps = Math.round((clamped * FULL_WIDTH) / WIDTH_STEP);
  return `w-${steps * WIDTH_STEP}`;
}

export function kidColorClass(color: string): string {
  const key = color.toLowerCase();
  return KID_COLOR_CLASSES[key] ?? '';
}

export function initialOf(name: string): string {
  const first = name.trim().charAt(0);
  return first.toUpperCase();
}

export function findKid(kids: KidProfile[], kidId: string | null): KidProfile | null {
  if (kidId === null) {
    return null;
  }

  const kid = kids.find((candidate) => candidate.id === kidId);
  return kid ?? null;
}

export function capitalize(text: string): string {
  const trimmed = text.trim();
  const first = trimmed.charAt(0).toUpperCase();
  return `${first}${trimmed.slice(1)}`;
}

const TRAILING_PUNCTUATION = /[\s.,!?;:]+$/;

export function ideaExclamation(idea: string): string {
  const trimmed = idea.trim().replace(TRAILING_PUNCTUATION, '');
  return `${capitalize(trimmed)}!`;
}

export function joinWithOr(items: string[]): string {
  if (items.length <= 1) {
    return items.join('');
  }

  const head = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return `${head} or ${last}`;
}

export function joinWithAnd(items: string[]): string {
  if (items.length <= 1) {
    return items.join('');
  }

  const head = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return `${head} and ${last}`;
}
