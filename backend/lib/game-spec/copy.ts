import type { TemplateId } from './schema';
import type { UiLanguage } from './language';

export type UiTexts = {
  score: string;
  correct: string;
  wrong: string;
  winTitle: string;
  winBody: string;
  playAgain: string;
  jump: string;
  left: string;
  right: string;
};

const texts: Record<UiLanguage, UiTexts> = {
  pl: {
    score: 'Wynik',
    correct: 'Dobrze!',
    wrong: 'Prawie! Spróbuj jeszcze raz.',
    winTitle: 'Koniec gry',
    winBody: 'Świetnie ci poszło!',
    playAgain: 'Zagraj jeszcze raz',
    jump: 'Skok',
    left: 'Lewo',
    right: 'Prawo',
  },
  en: {
    score: 'Score',
    correct: 'Yes!',
    wrong: 'Not quite. Try again.',
    winTitle: 'Finished',
    winBody: 'You did it!',
    playAgain: 'Play again',
    jump: 'Jump',
    left: 'Left',
    right: 'Right',
  },
};

const instructions: Record<UiLanguage, Record<TemplateId, string>> = {
  pl: {
    collect: 'Złap właściwą odpowiedź. Strzałki, przyciski albo palec.',
    runner: 'Skacz po górach i wyląduj na dobrej odpowiedzi. Strzałki i spacja.',
    quiz: 'Wybierz dobrą odpowiedź. Klawisze 1–4 albo dotyk.',
  },
  en: {
    collect: 'Catch the right answer. Arrows, buttons, or your finger.',
    runner: 'Jump across the mountains onto the right answer. Arrows and space.',
    quiz: 'Pick the right answer. Keys 1–4 or tap.',
  },
};

export function uiTexts(language: UiLanguage): UiTexts {
  return texts[language];
}

export function templateInstructions(language: UiLanguage, template: TemplateId): string {
  return instructions[language][template];
}
