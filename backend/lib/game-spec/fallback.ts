import type { GameTemplate } from '@grok-hack/api-contract';

import { templateInstructions, uiTexts } from './copy';
import { ageBand, resolveLanguage, taskCountForAge, uiLanguage, type UiLanguage } from './language';
import {
  gameSpecSchema,
  type GameSpec,
  type LearningTask,
  type Palette,
  type TemplateId,
} from './schema';

export type SpecRequest = {
  gameId: string;
  parentPrompt: string;
  childPrompt: string;
  childAge: number | null;
  language: string | null;
};

type DraftTask = Omit<LearningTask, 'id'>;

type Topic = {
  id: string;
  match: RegExp;
  title: Record<UiLanguage, string>;
  tasks: Record<UiLanguage, DraftTask[]>;
};

const body: DraftTask[] = [
  task('Jak jest po angielsku: głowa?', 'head', ['hand', 'leg', 'eye'], 'Głowa to head.', 1),
  task('Jak jest po angielsku: ręka?', 'hand', ['head', 'foot', 'nose'], 'Ręka to hand.', 1),
  task('Jak jest po angielsku: noga?', 'leg', ['arm', 'ear', 'eye'], 'Noga to leg.', 1),
  task('Jak jest po angielsku: oko?', 'eye', ['ear', 'nose', 'knee'], 'Oko to eye.', 2),
  task('Jak jest po angielsku: ucho?', 'ear', ['eye', 'mouth', 'hand'], 'Ucho to ear.', 2),
];

const bodyEn: DraftTask[] = [
  task('You think with it. Which word is it?', 'head', ['hand', 'foot', 'knee'], 'You think with your head.', 1),
  task('You wave with it. Which word is it?', 'hand', ['eye', 'ear', 'leg'], 'You wave with your hand.', 1),
  task('You walk on them. Which word is it?', 'leg', ['nose', 'arm', 'ear'], 'You walk on your legs.', 1),
  task('You see with them. Which word is it?', 'eye', ['ear', 'mouth', 'knee'], 'You see with your eyes.', 2),
  task('You hear with them. Which word is it?', 'ear', ['eye', 'nose', 'hand'], 'You hear with your ears.', 2),
];

const colors: DraftTask[] = [
  task('Jak jest po angielsku: czerwony?', 'red', ['blue', 'green', 'yellow'], 'Czerwony to red.', 1),
  task('Jak jest po angielsku: niebieski?', 'blue', ['red', 'black', 'white'], 'Niebieski to blue.', 1),
  task('Jak jest po angielsku: zielony?', 'green', ['pink', 'brown', 'red'], 'Zielony to green.', 1),
  task('Jak jest po angielsku: żółty?', 'yellow', ['purple', 'blue', 'grey'], 'Żółty to yellow.', 2),
];

const colorsEn: DraftTask[] = [
  task('A strawberry is this color.', 'red', ['blue', 'green', 'black'], 'A strawberry is red.', 1),
  task('The sky on a clear day is this color.', 'blue', ['red', 'orange', 'pink'], 'The sky is blue.', 1),
  task('Grass is this color.', 'green', ['purple', 'white', 'red'], 'Grass is green.', 1),
  task('The sun looks this color.', 'yellow', ['blue', 'brown', 'black'], 'The sun looks yellow.', 2),
];

const animals: DraftTask[] = [
  task('Jak jest po angielsku: pies?', 'dog', ['cat', 'bird', 'fish'], 'Pies to dog.', 1),
  task('Jak jest po angielsku: kot?', 'cat', ['dog', 'cow', 'frog'], 'Kot to cat.', 1),
  task('Jak jest po angielsku: ptak?', 'bird', ['fish', 'horse', 'pig'], 'Ptak to bird.', 1),
  task('Jak jest po angielsku: ryba?', 'fish', ['bird', 'duck', 'bee'], 'Ryba to fish.', 2),
];

const animalsEn: DraftTask[] = [
  task('Which animal says woof?', 'dog', ['cat', 'fish', 'bird'], 'A dog says woof.', 1),
  task('Which animal says meow?', 'cat', ['cow', 'dog', 'frog'], 'A cat says meow.', 1),
  task('Which animal can fly?', 'bird', ['fish', 'horse', 'pig'], 'A bird can fly.', 1),
  task('Which animal lives in water?', 'fish', ['cat', 'dog', 'lion'], 'A fish lives in water.', 2),
];

const numbers: DraftTask[] = [
  task('Ile jest 2 + 1?', '3', ['4', '5', '1'], '2 + 1 = 3.', 1),
  task('Ile jest 2 + 2?', '4', ['3', '5', '6'], '2 + 2 = 4.', 1),
  task('Ile jest 3 + 2?', '5', ['4', '6', '2'], '3 + 2 = 5.', 2),
  task('Ile jest 4 + 2?', '6', ['5', '7', '8'], '4 + 2 = 6.', 2),
  task('Ile jest 1 + 6?', '7', ['6', '8', '5'], '1 + 6 = 7.', 2),
];

const numbersEn: DraftTask[] = [
  task('What is 2 + 1?', '3', ['4', '5', '1'], '2 + 1 = 3.', 1),
  task('What is 2 + 2?', '4', ['3', '5', '6'], '2 + 2 = 4.', 1),
  task('What is 3 + 2?', '5', ['4', '6', '2'], '3 + 2 = 5.', 2),
  task('What is 4 + 2?', '6', ['5', '7', '8'], '4 + 2 = 6.', 2),
  task('What is 1 + 6?', '7', ['6', '8', '5'], '1 + 6 = 7.', 2),
];

const topics: Topic[] = [
  {
    id: 'body',
    match: /ciał|cial|body part|anatom|głow|glowa|ręk|reka|noga/i,
    title: { pl: 'Części ciała', en: 'Body parts' },
    tasks: { pl: body, en: bodyEn },
  },
  {
    id: 'colors',
    match: /kolor|barw|color|czerwon|niebiesk|zielon/i,
    title: { pl: 'Kolory', en: 'Colors' },
    tasks: { pl: colors, en: colorsEn },
  },
  {
    id: 'animals',
    match: /zwierz|animal|pies|kot|ptak/i,
    title: { pl: 'Zwierzęta', en: 'Animals' },
    tasks: { pl: animals, en: animalsEn },
  },
  {
    id: 'numbers',
    match: /liczb|cyfr|dodaw|mnoż|mnoz|ułam|ulam|math|number|plus/i,
    title: { pl: 'Liczenie', en: 'Numbers' },
    tasks: { pl: numbers, en: numbersEn },
  },
];

type ThemeDef = {
  name: Record<UiLanguage, string>;
  characterName: string;
  palette: Palette;
};

const mountainTheme: ThemeDef = {
  name: { pl: 'Góry', en: 'Mountains' },
  characterName: 'Kozica',
  palette: {
    background: '#8ecae6',
    ground: '#588157',
    player: '#f4d35e',
    item: '#e76f51',
    accent: '#1d3557',
    text: '#1d3557',
  },
};

const spaceTheme: ThemeDef = {
  name: { pl: 'Kosmos', en: 'Space' },
  characterName: 'Iskra',
  palette: {
    background: '#1b1b3a',
    ground: '#3d348b',
    player: '#ffd166',
    item: '#ef476f',
    accent: '#c7b9ff',
    text: '#ffffff',
  },
};

const seaTheme: ThemeDef = {
  name: { pl: 'Morze', en: 'Sea' },
  characterName: 'Rybka',
  palette: {
    background: '#48cae4',
    ground: '#0077b6',
    player: '#ffd166',
    item: '#fb8500',
    accent: '#023047',
    text: '#023047',
  },
};

const forestTheme: ThemeDef = {
  name: { pl: 'Las', en: 'Forest' },
  characterName: 'Lisek',
  palette: {
    background: '#95d5b2',
    ground: '#2d6a4f',
    player: '#f4a261',
    item: '#e9c46a',
    accent: '#1b4332',
    text: '#1b4332',
  },
};

const meadowTheme: ThemeDef = {
  name: { pl: 'Łąka', en: 'Meadow' },
  characterName: 'Iskierka',
  palette: {
    background: '#bde0fe',
    ground: '#74c69d',
    player: '#ffb703',
    item: '#fb5607',
    accent: '#370617',
    text: '#370617',
  },
};

function task(
  prompt: string,
  answer: string,
  distractors: string[],
  explanation: string,
  difficulty: 1 | 2 | 3,
): DraftTask {
  return { prompt, answer, distractors, explanation, difficulty };
}

/** The designer may only return one of these. Keyword order is fixed. */
export function pickTemplate(childPrompt: string): TemplateId {
  const text = childPrompt.toLowerCase();
  if (/quiz|pytan|test|zgadyw|milioner|question/.test(text)) return 'quiz';
  if (/bieg|skacz|skok|gór|gor|platform|runner|jump|mount|wspin/.test(text)) return 'runner';
  if (/zbier|collect|monet|łap|lap|catch|gwiazd|coin/.test(text)) return 'collect';
  return 'collect';
}

export function pickTopic(parentPrompt: string): Topic {
  return topics.find((topic) => topic.match.test(parentPrompt)) ?? topics.find((topic) => topic.id === 'colors')!;
}

function pickTheme(childPrompt: string): ThemeDef {
  const text = childPrompt.toLowerCase();
  if (/gór|gor|mount|skacz|jump|wspin/.test(text)) return mountainTheme;
  if (/kosmos|space|rakiet|planet|gwiazd/.test(text)) return spaceTheme;
  if (/morz|ocean|ryb|sea|water|fala/.test(text)) return seaTheme;
  if (/las|forest|dino|drzew/.test(text)) return forestTheme;
  return meadowTheme;
}

const fillers: Record<UiLanguage, string[]> = {
  pl: ['inne', 'żadne'],
  en: ['other', 'none'],
};

/**
 * Drop duplicate distractors and anything equal to the answer.
 * The banks are curated, but model output uses this too.
 */
export function normalizeTasks(drafts: DraftTask[], language: UiLanguage, limit: number): LearningTask[] {
  const spare = fillers[language];
  return drafts.slice(0, limit).map((draft, index) => {
    const answer = draft.answer.trim();
    const distractors: string[] = [];
    for (const value of draft.distractors) {
      const text = value.trim();
      if (!text) continue;
      if (text.toLocaleLowerCase() === answer.toLocaleLowerCase()) continue;
      if (distractors.some((item) => item.toLocaleLowerCase() === text.toLocaleLowerCase())) continue;
      distractors.push(text);
    }
    for (const filler of spare) {
      if (distractors.length >= 2) break;
      if (filler.toLocaleLowerCase() === answer.toLocaleLowerCase()) continue;
      if (!distractors.includes(filler)) distractors.push(filler);
    }
    return {
      id: `task-${index + 1}`,
      prompt: draft.prompt.trim(),
      answer,
      distractors: distractors.slice(0, 3),
      explanation: draft.explanation.trim(),
      difficulty: draft.difficulty,
    };
  });
}

export function emptyAssets(): GameSpec['assets'] {
  return {
    characterUrl: null,
    backgroundUrl: null,
    itemUrl: null,
    thumbnailUrl: null,
    coverUrl: null,
  };
}

/**
 * Deterministic spec used when XAI_API_KEY is missing or a model call fails.
 * Player-facing strings come from fixed banks. Raw prompts are not copied into the game,
 * so an untrusted prompt cannot inject markup or an off-topic lesson into the fallback.
 */
export function fallbackGameSpec(input: SpecRequest): GameSpec {
  const language = resolveLanguage(input.language);
  const ui = uiLanguage(language);
  const template = pickTemplate(input.childPrompt);
  const topic = pickTopic(input.parentPrompt);
  const theme = pickTheme(input.childPrompt);
  const band = ageBand(input.childAge);
  const tasks = normalizeTasks(topic.tasks[ui], ui, taskCountForAge(input.childAge));

  return gameSpecSchema.parse({
    version: 1,
    gameId: input.gameId,
    template,
    language,
    ageBand: band,
    title: topic.title[ui],
    instructions: templateInstructions(ui, template),
    theme: {
      name: theme.name[ui],
      characterName: theme.characterName,
      palette: theme.palette,
    },
    assets: emptyAssets(),
    tasks,
    texts: uiTexts(ui),
    rules: { goal: tasks.length },
    resultsUrl: `/api/games/${input.gameId}/results`,
    source: 'fallback',
    agents: {
      pedagog: 'local-fallback',
      designer: 'local-fallback',
      grafik: 'local-shapes',
    },
    extensions: {
      teammate: { enabled: false },
      analyst: { enabled: false },
    },
  });
}

export function isGameTemplate(value: string | null | undefined): value is GameTemplate {
  return value === 'collect' || value === 'runner' || value === 'quiz';
}
