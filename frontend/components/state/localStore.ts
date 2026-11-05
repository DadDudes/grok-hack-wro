import { useSyncExternalStore } from 'react';

type Listener = () => void;

export type LocalStore<T extends object> = {
  useValue: () => T | null;
  read: () => T;
  update: (change: (previous: T) => T) => void;
};

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function getServerSnapshot(): null {
  return null;
}

export function createLocalStore<T extends object>(key: string, initial: T): LocalStore<T> {
  const listeners = new Set<Listener>();
  let cached: T | null = null;

  function load(): T {
    const raw = readStorage(key);
    if (raw === null) {
      return initial;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<T>;
      return { ...initial, ...parsed };
    } catch {
      return initial;
    }
  }

  function read(): T {
    if (cached === null) {
      cached = load();
    }

    return cached;
  }

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function subscribe(listener: Listener): () => void {
    function onStorage(event: StorageEvent): void {
      if (event.key !== key) {
        return;
      }

      cached = null;
      listener();
    }

    listeners.add(listener);
    window.addEventListener('storage', onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  }

  function update(change: (previous: T) => T): void {
    const previous = read();
    const next = change(previous);
    cached = next;

    const serialized = JSON.stringify(next);
    writeStorage(key, serialized);
    notify();
  }

  function useValue(): T | null {
    return useSyncExternalStore<T | null>(subscribe, read, getServerSnapshot);
  }

  return { useValue, read, update };
}
