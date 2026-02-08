import { useCallback, useEffect, useState } from "react";

/**
 * SSR-safe useLocalStorage hook.
 *
 * Unlike the usehooks-ts version, this hook never attempts to read
 * localStorage during the initial server render.  It returns the
 * provided `initialValue` on the server (and during hydration) and
 * synchronises with the real localStorage value in a useEffect that
 * only fires on the client.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // After mount, read the real value from localStorage
  useEffect(() => {
    try {
      if (
        typeof window !== "undefined" &&
        typeof window.localStorage?.getItem === "function"
      ) {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item) as T);
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue =
          value instanceof Function ? value(prev) : value;

        try {
          if (
            typeof window !== "undefined" &&
            typeof window.localStorage?.setItem === "function"
          ) {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          }
        } catch (error) {
          console.warn(`Error setting localStorage key "${key}":`, error);
        }

        return nextValue;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
