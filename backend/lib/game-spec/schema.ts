import { z } from 'zod';

export const templateIdSchema = z.enum(['collect', 'runner', 'quiz']);

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const paletteSchema = z.object({
  background: hexColor,
  ground: hexColor,
  player: hexColor,
  item: hexColor,
  accent: hexColor,
  text: hexColor,
});

export const learningTaskSchema = z.object({
  id: z.string().min(1).max(40),
  prompt: z.string().trim().min(1).max(280),
  answer: z.string().trim().min(1).max(40),
  distractors: z.array(z.string().trim().min(1).max(40)).min(2).max(3),
  explanation: z.string().trim().min(1).max(280),
  difficulty: z.number().int().min(1).max(3),
});

export const uiTextSchema = z.object({
  score: z.string().trim().min(1).max(40),
  correct: z.string().trim().min(1).max(80),
  wrong: z.string().trim().min(1).max(120),
  winTitle: z.string().trim().min(1).max(80),
  winBody: z.string().trim().min(1).max(160),
  playAgain: z.string().trim().min(1).max(40),
  jump: z.string().trim().min(1).max(20),
  left: z.string().trim().min(1).max(20),
  right: z.string().trim().min(1).max(20),
});

const assetUrl = z.string().min(1).max(500).nullable();

/**
 * The document a prebuilt Phaser template loads.
 * Agents fill this in. The template does not trust any other model output.
 */
export const gameSpecSchema = z.object({
  version: z.literal(1),
  gameId: z.uuid(),
  template: templateIdSchema,
  language: z.string().trim().min(2).max(16),
  ageBand: z.enum(['young', 'mid', 'older']),
  title: z.string().trim().min(1).max(80),
  instructions: z.string().trim().min(1).max(280),
  theme: z.object({
    name: z.string().trim().min(1).max(40),
    characterName: z.string().trim().min(1).max(40),
    palette: paletteSchema,
  }),
  assets: z.object({
    characterUrl: assetUrl,
    backgroundUrl: assetUrl,
    itemUrl: assetUrl,
    thumbnailUrl: assetUrl,
    coverUrl: assetUrl,
  }),
  tasks: z.array(learningTaskSchema).min(3).max(6),
  texts: uiTextSchema,
  rules: z.object({
    goal: z.number().int().min(1).max(6),
  }),
  resultsUrl: z.string().min(1).max(200),
  source: z.enum(['grok', 'fallback']),
  agents: z.object({
    pedagog: z.string().min(1).max(60),
    designer: z.string().min(1).max(60),
    grafik: z.string().min(1).max(60),
  }),
  /** Reserved for the in-game hint agent and the post-game analyst. */
  extensions: z.object({
    teammate: z.object({ enabled: z.literal(false) }),
    analyst: z.object({ enabled: z.literal(false) }),
  }),
});

export type TemplateId = z.infer<typeof templateIdSchema>;
export type Palette = z.infer<typeof paletteSchema>;
export type LearningTask = z.infer<typeof learningTaskSchema>;
export type GameSpec = z.infer<typeof gameSpecSchema>;

export const imageSlotSchema = z.enum(['character', 'background', 'item', 'thumbnail', 'cover']);
export type ImageSlot = z.infer<typeof imageSlotSchema>;

/** Model output for the pedagog agent, before ids are assigned. */
export const pedagogOutputSchema = z.object({
  tasks: z
    .array(
      z.object({
        prompt: z.string().trim().min(1).max(280),
        answer: z.string().trim().min(1).max(40),
        distractors: z.array(z.string().trim().min(1).max(40)).min(2).max(3),
        explanation: z.string().trim().min(1).max(280),
        difficulty: z.number().int().min(1).max(3),
      }),
    )
    .min(3)
    .max(6),
});

export const designerOutputSchema = z.object({
  template: templateIdSchema,
  title: z.string().trim().min(1).max(80),
  instructions: z.string().trim().min(1).max(280),
  themeName: z.string().trim().min(1).max(40),
  characterName: z.string().trim().min(1).max(40),
  palette: paletteSchema,
  texts: uiTextSchema,
  imagePrompts: z.object({
    character: z.string().trim().min(1).max(400),
    background: z.string().trim().min(1).max(400),
    item: z.string().trim().min(1).max(400),
    thumbnail: z.string().trim().min(1).max(400),
    cover: z.string().trim().min(1).max(400),
  }),
});

export type DesignerOutput = z.infer<typeof designerOutputSchema>;
export type PedagogOutput = z.infer<typeof pedagogOutputSchema>;
