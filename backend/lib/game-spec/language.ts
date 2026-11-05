import type { GameSpec } from './schema';

export type UiLanguage = 'pl' | 'en';
export type AgeBand = GameSpec['ageBand'];

/** Omitted language becomes Polish, the product default. */
export function resolveLanguage(language: string | null | undefined): string {
  const value = language?.trim();
  if (!value || value.length < 2) return 'pl';
  return value.slice(0, 16);
}

/**
 * Local fallback copy exists in Polish and English.
 * Any other tag is still passed to the model; the fallback uses Polish.
 */
export function uiLanguage(language: string): UiLanguage {
  return language.toLowerCase().startsWith('en') ? 'en' : 'pl';
}

export function ageBand(age: number | null): AgeBand {
  if (age !== null && age <= 6) return 'young';
  if (age !== null && age >= 13) return 'older';
  return 'mid';
}

export function taskCountForAge(age: number | null): number {
  if (age !== null && age <= 6) return 3;
  if (age !== null && age >= 13) return 5;
  return 4;
}
