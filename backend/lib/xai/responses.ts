import 'server-only';

import { z } from 'zod';

import { postToXai } from './client';
import { getXaiConfig } from './config';
import { XaiError } from './errors';
import { costFromTicks, logUsage, type XaiAgent, type XaiUsage } from './usage';

const RESPONSES_PATH = '/responses';
const TEXT_TIMEOUT_MS = 45_000;
const HTTP_NOT_FOUND = 404;
const MAX_LOGGED_OUTPUT_CHARS = 400;

export type ReasoningEffort = 'low' | 'medium' | 'high';

const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'low';

const KID_SAFE_GUIDELINES = [
  { type: 'policy', category: 'nsfw', behavior: 'decline' },
  { type: 'policy', category: 'violence', behavior: 'decline' },
  { type: 'policy', category: 'profanity', behavior: 'decline' },
] as const;

const contentPartSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
  refusal: z.string().optional(),
});

const outputItemSchema = z.object({
  type: z.string(),
  content: z.array(contentPartSchema).optional(),
});

const responseUsageSchema = z.object({
  input_tokens: z.number().optional(),
  output_tokens: z.number().optional(),
  input_tokens_details: z.object({ cached_tokens: z.number().optional() }).optional(),
  output_tokens_details: z.object({ reasoning_tokens: z.number().optional() }).optional(),
  cost_in_usd_ticks: z.number().nullable().optional(),
});

const responseEnvelopeSchema = z.object({
  model: z.string().optional(),
  status: z.string().optional(),
  output: z.array(outputItemSchema),
  usage: responseUsageSchema.optional(),
});

type ResponseEnvelope = z.infer<typeof responseEnvelopeSchema>;

export type StructuredRequest<T> = {
  agent: XaiAgent;
  instructions: string;
  input: string;
  schemaName: string;
  schema: z.ZodType<T>;
  maxOutputTokens: number;
  reasoningEffort?: ReasoningEffort;
  signal?: AbortSignal;
};

export type StructuredResult<T> = {
  data: T;
  usage: XaiUsage;
};

function toResponseSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema, { target: 'draft-2020-12' });
  const { $schema: _ignored, ...rest } = jsonSchema;
  return rest;
}

function toUsage(
  agent: XaiAgent,
  model: string,
  latencyMs: number,
  envelope: ResponseEnvelope,
): XaiUsage {
  const usage = envelope.usage;

  return {
    agent,
    endpoint: RESPONSES_PATH,
    model: envelope.model ?? model,
    latencyMs,
    inputTokens: usage?.input_tokens ?? 0,
    cachedTokens: usage?.input_tokens_details?.cached_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    reasoningTokens: usage?.output_tokens_details?.reasoning_tokens ?? 0,
    costUsd: costFromTicks(usage?.cost_in_usd_ticks),
  };
}

function extractOutputText(envelope: ResponseEnvelope): string {
  for (const item of envelope.output) {
    if (item.type !== 'message') {
      continue;
    }

    for (const part of item.content ?? []) {
      if (part.type === 'refusal') {
        throw new XaiError('declined', `model refused: ${part.refusal ?? ''}`);
      }

      if (part.type === 'output_text' && part.text !== undefined) {
        return part.text;
      }
    }
  }

  throw new XaiError('invalid_output', 'response has no output_text');
}

function parseStructuredOutput<T>(text: string, schema: z.ZodType<T>, schemaName: string): T {
  let json: unknown;

  try {
    json = JSON.parse(text) as unknown;
  } catch {
    const preview = text.slice(0, MAX_LOGGED_OUTPUT_CHARS);
    throw new XaiError('invalid_output', `${schemaName} output is not JSON: ${preview}`);
  }

  const result = schema.safeParse(json);

  if (!result.success) {
    const issues = JSON.stringify(result.error.issues).slice(0, MAX_LOGGED_OUTPUT_CHARS);
    throw new XaiError('invalid_output', `${schemaName} output failed validation: ${issues}`);
  }

  return result.data;
}

async function runStructured<T>(
  request: StructuredRequest<T>,
  model: string,
): Promise<StructuredResult<T>> {
  const schema = toResponseSchema(request.schema);
  const body = JSON.stringify({
    model,
    instructions: request.instructions,
    input: request.input,
    max_output_tokens: request.maxOutputTokens,
    reasoning: { effort: request.reasoningEffort ?? DEFAULT_REASONING_EFFORT },
    store: false,
    guidelines: KID_SAFE_GUIDELINES,
    text: {
      format: {
        type: 'json_schema',
        name: request.schemaName,
        schema,
        strict: true,
      },
    },
  });

  const raw = await postToXai({
    path: RESPONSES_PATH,
    body,
    timeoutMs: TEXT_TIMEOUT_MS,
    signal: request.signal,
  });

  const envelope = responseEnvelopeSchema.safeParse(raw.data);

  if (!envelope.success) {
    throw new XaiError('invalid_output', `${RESPONSES_PATH} returned an unexpected shape`);
  }

  const usage = toUsage(request.agent, model, raw.latencyMs, envelope.data);
  logUsage(usage);

  if (envelope.data.status === 'incomplete') {
    throw new XaiError('invalid_output', `${request.schemaName} output was cut off`);
  }

  const text = extractOutputText(envelope.data);
  const data = parseStructuredOutput(text, request.schema, request.schemaName);
  return { data, usage };
}

function shouldUseFallback(error: unknown): boolean {
  if (!(error instanceof XaiError)) {
    return false;
  }

  if (error.kind === 'unavailable') {
    return true;
  }

  return error.upstreamStatus === HTTP_NOT_FOUND;
}

export async function createStructuredResponse<T>(
  request: StructuredRequest<T>,
): Promise<StructuredResult<T>> {
  const config = getXaiConfig();

  try {
    return await runStructured(request, config.textModel);
  } catch (error) {
    const fallbackModel = config.fallbackTextModel;

    if (fallbackModel === null || !shouldUseFallback(error)) {
      throw error;
    }

    console.warn(
      `[xai] ${request.agent} falling back from ${config.textModel} to ${fallbackModel}`,
    );
    return runStructured(request, fallbackModel);
  }
}
