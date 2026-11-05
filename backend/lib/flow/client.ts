import { demoBuild, demoHint, demoOptions, demoPlan, demoReport } from './mock';
import {
  flowPaths,
  type BuildEvent,
  type BuildRequest,
  type Goal,
  type Hint,
  type HintRequest,
  type LensRequest,
  type OptionPreviewRequest,
  type OptionPreviewResponse,
  type Report,
  type SparkRequest,
  type SparkResponse,
  type TaskPlan,
  type Transcript,
} from './types';

const MOCK_DELAY_MS = 700;
const SSE_PREFIX = 'data: ';

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_FLOW_MOCK === '1';
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const payload = JSON.stringify(body);
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${path} failed with ${response.status}: ${message}`);
  }

  const data = (await response.json()) as T;
  return data;
}

export async function createPlan(goal: Goal): Promise<TaskPlan> {
  if (isMockMode()) {
    await wait(MOCK_DELAY_MS);
    return { ...demoPlan, goal: goal.topic, age: goal.age };
  }

  return postJson<TaskPlan>(flowPaths.prof, goal);
}

export async function suggestGames(request: SparkRequest): Promise<SparkResponse> {
  if (isMockMode()) {
    await wait(MOCK_DELAY_MS);
    return demoOptions;
  }

  return postJson<SparkResponse>(flowPaths.spark, request);
}

export async function previewOptions(request: OptionPreviewRequest): Promise<OptionPreviewResponse> {
  if (isMockMode()) {
    await wait(MOCK_DELAY_MS);
    const imageUrls = request.options.map(() => null);
    return { imageUrls };
  }

  return postJson<OptionPreviewResponse>(flowPaths.optionPreviews, request);
}

export async function askRobo(request: HintRequest): Promise<Hint> {
  if (isMockMode()) {
    await wait(MOCK_DELAY_MS);
    return demoHint;
  }

  return postJson<Hint>(flowPaths.robo, request);
}

export async function getReport(request: LensRequest): Promise<Report> {
  if (isMockMode()) {
    await wait(MOCK_DELAY_MS);
    return demoReport;
  }

  return postJson<Report>(flowPaths.lens, request);
}

export async function transcribe(audio: Blob): Promise<Transcript> {
  if (isMockMode()) {
    await wait(MOCK_DELAY_MS);
    return { text: 'dinosaurs in space' };
  }

  const form = new FormData();
  form.append('audio', audio, 'idea.webm');
  const response = await fetch(flowPaths.transcribe, { method: 'POST', body: form });

  if (!response.ok) {
    throw new Error(`transcribe failed with ${response.status}`);
  }

  const data = (await response.json()) as Transcript;
  return data;
}

function parseEvents(chunk: string): BuildEvent[] {
  const events: BuildEvent[] = [];

  for (const line of chunk.split('\n')) {
    if (!line.startsWith(SSE_PREFIX)) {
      continue;
    }

    const json = line.slice(SSE_PREFIX.length);
    events.push(JSON.parse(json) as BuildEvent);
  }

  return events;
}

export async function buildGame(request: BuildRequest, onEvent: (event: BuildEvent) => void): Promise<void> {
  if (isMockMode()) {
    for (const event of demoBuild) {
      await wait(MOCK_DELAY_MS);
      if (event.type !== 'agent') {
        onEvent(event);
        continue;
      }
      const at = new Date().toISOString();
      onEvent({ ...event, at });
    }
    return;
  }

  const payload = JSON.stringify(request);
  const response = await fetch(flowPaths.build, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
  });

  if (!response.ok || !response.body) {
    throw new Error(`build failed with ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const events = parseEvents(part);
      events.forEach(onEvent);
    }
  }
}
