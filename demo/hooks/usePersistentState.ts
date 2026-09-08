"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

type Kind = "local" | "session";

const listeners = new Map<string, Set<() => void>>();

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

/**
 * useState backed by Web Storage, exposed through useSyncExternalStore so the
 * server render and the first client render both use `initial` (no hydration
 * mismatch) and the stored value takes over immediately after hydration.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  kind: Kind = "local",
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      let set = listeners.get(key);
      if (!set) listeners.set(key, (set = new Set()));
      set.add(onChange);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) onChange();
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
    const raw = getStorage(kind)?.getItem(key) ?? null;
    if (raw !== cache.raw) {
      cache.raw = raw;
      try {
        cache.value = raw === null ? initial : (JSON.parse(raw) as T);
      } catch {
        cache.value = initial;
      }
    }
    return cache.value;
  }, [initial, key, kind]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => initial);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(getSnapshot()) : next;
      try {
        getStorage(kind)?.setItem(key, JSON.stringify(resolved));
      } catch {
        // Storage full or disabled: keep going with what we have.
      }
      emit(key);
    },
    [getSnapshot, key, kind],
  );

  return [value, set, hydrated];
}
