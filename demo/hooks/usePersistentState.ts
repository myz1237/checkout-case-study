"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

type Kind = "local" | "session";

const listeners = new Map<string, Set<() => void>>();
/** In-memory copy of the last value written in this tab; the source of truth when storage is unavailable. */
const memory = new Map<string, string>();

function emit(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

function getStorage(kind: Kind): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readRaw(kind: Kind, key: string): string | null {
  if (memory.has(key)) return memory.get(key)!;
  try {
    return getStorage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/**
 * useState backed by Web Storage, exposed through useSyncExternalStore so the
 * server render and the first client render both use `initial` (no hydration
 * mismatch) and the stored value takes over immediately after hydration.
 *
 * `validate` guards against stale or foreign data in storage: anything that
 * does not pass falls back to `initial` instead of crashing the page.
 * When storage is blocked or full the hook keeps working in memory.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  kind: Kind = "local",
  validate?: (value: unknown) => value is T,
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      let set = listeners.get(key);
      if (!set) listeners.set(key, (set = new Set()));
      set.add(onChange);
      const onStorage = (e: StorageEvent) => {
        if (e.key !== key) return;
        memory.delete(key); // another tab wrote; re-read from storage
        onChange();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        set!.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  // Snapshots must be referentially stable for identical content; cache by raw string.
  const cacheRef = useRef<{ raw: string | null; value: T }>({ raw: null, value: initial });
  const getSnapshot = useCallback((): T => {
    const cache = cacheRef.current;
    const raw = readRaw(kind, key);
    if (raw !== cache.raw) {
      cache.raw = raw;
      cache.value = initial;
      if (raw !== null) {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (!validate || validate(parsed)) cache.value = parsed as T;
        } catch {
          // Unreadable value: keep `initial`.
        }
      }
    }
    return cache.value;
  }, [initial, key, kind, validate]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => initial);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(getSnapshot()) : next;
      const raw = JSON.stringify(resolved);
      memory.set(key, raw);
      try {
        getStorage(kind)?.setItem(key, raw);
      } catch {
        // Storage full or disabled: the in-memory copy keeps this tab working.
      }
      emit(key);
    },
    [getSnapshot, key, kind],
  );

  return [value, set, hydrated];
}
