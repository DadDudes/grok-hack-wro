import 'server-only';

import { errorReason } from '@/lib/xai/transport';

const SSE_HEADERS = {
  'content-type': 'text/event-stream; charset=utf-8',
  'cache-control': 'no-cache, no-transform',
  connection: 'keep-alive',
  'x-accel-buffering': 'no',
} as const;

export type SseRun<T> = (emit: (event: T) => void) => Promise<void>;

export function sseResponse<T>(run: SseRun<T>, failureEvent: T): Response {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: T) => {
        if (closed) {
          return;
        }

        const payload = JSON.stringify(event);
        const chunk = encoder.encode(`data: ${payload}\n\n`);
        controller.enqueue(chunk);
      };

      try {
        await run(emit);
      } catch (error) {
        const reason = errorReason(error);
        console.error(`[sse] stream failed: ${reason}`);
        emit(failureEvent);
      }

      if (!closed) {
        closed = true;
        controller.close();
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
