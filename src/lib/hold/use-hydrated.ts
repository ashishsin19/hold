import { useEffect, useState } from "react";
import { useHold } from "./store";

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void useHold.persist.rehydrate();
    if (useHold.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useHold.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
