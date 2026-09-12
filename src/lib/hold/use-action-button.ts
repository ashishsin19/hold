import { useCallback, useEffect, useRef } from "react";
import { Haptics } from "./haptics";

export type Gesture = "press" | "double" | "triple" | "long";

const LONG_MS = 1500;
const MULTI_MS = 340;

type Options = {
  onGesture: (g: Gesture) => void;
  enabled?: boolean;
};

export function useActionButton({ onGesture, enabled = true }: Options) {
  const clickCount = useRef(0);
  const clickTimer = useRef<number | null>(null);
  const longTimer = useRef<number | null>(null);
  const longFired = useRef(false);
  const down = useRef(false);
  const gestureRef = useRef(onGesture);
  gestureRef.current = onGesture;

  const clearClick = () => {
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
  };
  const clearLong = () => {
    if (longTimer.current) {
      window.clearTimeout(longTimer.current);
      longTimer.current = null;
    }
  };

  const emit = useCallback((g: Gesture) => {
    gestureRef.current(g);
  }, []);

  const onDown = useCallback(() => {
    if (!enabled) return;
    down.current = true;
    longFired.current = false;
    Haptics.down();
    clearLong();
    longTimer.current = window.setTimeout(() => {
      longFired.current = true;
      clickCount.current = 0;
      clearClick();
      emit("long");
    }, LONG_MS);
  }, [enabled, emit]);

  const onUp = useCallback(() => {
    if (!enabled || !down.current) return;
    down.current = false;
    clearLong();
    if (longFired.current) return;
    clickCount.current += 1;
    clearClick();
    clickTimer.current = window.setTimeout(() => {
      const n = clickCount.current;
      clickCount.current = 0;
      if (n >= 3) emit("triple");
      else if (n === 2) emit("double");
      else emit("press");
    }, MULTI_MS);
  }, [enabled, emit]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      if (e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      e.preventDefault();
      onDown();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      e.preventDefault();
      onUp();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onDown, onUp]);

  useEffect(
    () => () => {
      clearClick();
      clearLong();
    },
    [],
  );

  return { onDown, onUp };
}
