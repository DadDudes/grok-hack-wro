import { templateInstructions, uiTexts } from '@/lib/game-spec/copy';
import { fallbackGameSpec, normalizeTasks, type SpecRequest } from '@/lib/game-spec/fallback';
import { ageBand, resolveLanguage, taskCountForAge, uiLanguage } from '@/lib/game-spec/language';
import {
  gameSpecSchema,
  type DesignerOutput,
  type GameSpec,
  type ImageSlot,
  type PedagogOutput,
} from '@/lib/game-spec/schema';

import { runDesigner } from './designer';
import { runPedagog } from './pedagog';
import { assertChildSafe, cleanImagePrompt } from './safety';
import { imageModel, textModel, xaiConfigured } from './xai';

export type BuiltGame = {
  spec: GameSpec;
  imagePrompts: Record<ImageSlot, string> | null;
};

async function once<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`${label} failed, retrying once`, error);
    return fn();
  }
}

function promptsFromDesign(design: DesignerOutput, spec: GameSpec): Record<ImageSlot, string> {
  const defaults = defaultImagePrompts(spec);
  return {
    character: cleanImagePrompt(design.imagePrompts.character, defaults.character),
    background: cleanImagePrompt(design.imagePrompts.background, defaults.background),
    item: cleanImagePrompt(design.imagePrompts.item, defaults.item),
    thumbnail: cleanImagePrompt(design.imagePrompts.thumbnail, defaults.thumbnail),
    cover: cleanImagePrompt(design.imagePrompts.cover, defaults.cover),
  };
}

export function defaultImagePrompts(spec: GameSpec): Record<ImageSlot, string> {
  const theme = spec.theme.name;
  const character = spec.theme.characterName;
  return {
    character: `cute cartoon mascot ${character}, full body, centered, plain background, children's game`,
    background: `wide children's game background of ${theme}, no characters, no text`,
    item: `one cute collectible object for a children's game about ${theme}, centered, no text`,
    thumbnail: `square app icon of a cute mascot in ${theme}, no text`,
    cover: `wide cover illustration of ${theme} for a children's game, no text`,
  };
}

function specFromAgents(input: SpecRequest, pedagog: PedagogOutput, design: DesignerOutput | null): BuiltGame {
  const language = resolveLanguage(input.language);
  const ui = uiLanguage(language);
  const local = fallbackGameSpec({ ...input, language });
  const tasks = normalizeTasks(pedagog.tasks, ui, taskCountForAge(input.childAge));

  if (!design) {
    const spec = gameSpecSchema.parse({
      ...local,
      tasks,
      rules: { goal: tasks.length },
      agents: {
        pedagog: textModel(),
        designer: 'local-fallback',
        grafik: xaiConfigured() ? imageModel() : 'local-shapes',
      },
    });
    assertChildSafe(playerFacing(spec));
    return { spec, imagePrompts: xaiConfigured() ? defaultImagePrompts(spec) : null };
  }

  const spec = gameSpecSchema.parse({
    version: 1,
    gameId: input.gameId,
    template: design.template,
    language,
    ageBand: ageBand(input.childAge),
    title: design.title,
    instructions: design.instructions || templateInstructions(ui, design.template),
    theme: {
      name: design.themeName,
      characterName: design.characterName,
      palette: design.palette,
    },
    assets: local.assets,
    tasks,
    texts: design.texts ?? uiTexts(ui),
    rules: { goal: tasks.length },
    resultsUrl: `/api/games/${input.gameId}/results`,
    source: 'grok',
    agents: {
      pedagog: textModel(),
      designer: textModel(),
      grafik: imageModel(),
    },
    extensions: local.extensions,
  });
  assertChildSafe(playerFacing(spec));
  return { spec, imagePrompts: promptsFromDesign(design, spec) };
}

function playerFacing(spec: GameSpec): string[] {
  return [
    spec.title,
    spec.instructions,
    spec.theme.name,
    spec.theme.characterName,
    ...Object.values(spec.texts),
    ...spec.tasks.flatMap((item) => [item.prompt, item.answer, item.explanation, ...item.distractors]),
  ];
}

/**
 * Pedagog writes the questions. Projektant gry picks the template and theme.
 * A missing key, a failed call, or an unsafe result uses the local spec.
 */
export async function buildGameSpec(input: SpecRequest): Promise<BuiltGame> {
  if (!xaiConfigured()) {
    return { spec: fallbackGameSpec(input), imagePrompts: null };
  }

  let pedagog: PedagogOutput;
  try {
    pedagog = await once('Pedagog', () =>
      runPedagog({
        parentPrompt: input.parentPrompt,
        childAge: input.childAge,
        language: input.language,
      }),
    );
  } catch (error) {
    console.error('Pedagog unavailable, using the local lesson', { gameId: input.gameId, error });
    return { spec: fallbackGameSpec(input), imagePrompts: null };
  }

  let design: DesignerOutput | null = null;
  try {
    const tasks = normalizeTasks(
      pedagog.tasks,
      uiLanguage(resolveLanguage(input.language)),
      taskCountForAge(input.childAge),
    );
    design = await once('Projektant gry', () =>
      runDesigner({
        childPrompt: input.childPrompt,
        childAge: input.childAge,
        language: input.language,
        tasks,
      }),
    );
  } catch (error) {
    console.error('Projektant gry unavailable, keeping the local theme', {
      gameId: input.gameId,
      error,
    });
  }

  try {
    return specFromAgents(input, pedagog, design);
  } catch (error) {
    console.error('Assembled spec rejected, using the local lesson', { gameId: input.gameId, error });
    return { spec: fallbackGameSpec(input), imagePrompts: null };
  }
}
