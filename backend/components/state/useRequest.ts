'use client';

import { useCallback, useState } from 'react';

export type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; data: T }
  | { status: 'failed'; message: string };

export type Request<T> = {
  state: RequestState<T>;
  run: (call: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
};

const IDLE = { status: 'idle' } as const;

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function useRequest<T>(): Request<T> {
  const [state, setState] = useState<RequestState<T>>(IDLE);

  const run = useCallback(async (call: () => Promise<T>): Promise<T | null> => {
    setState({ status: 'loading' });

    try {
      const data = await call();
      setState({ status: 'done', data });
      return data;
    } catch (error) {
      const message = errorMessage(error);
      console.warn(message);
      setState({ status: 'failed', message });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState(IDLE);
  }, []);

  return { state, run, reset };
}
