import { useEffect } from "react";
import { formatCountdown } from "@/lib/hold/format";
import { useHold } from "@/lib/hold/store";
import { useSensors } from "@/lib/hold/sensors";
import { useNow } from "@/lib/hold/use-now";

export function CrashOverlay({
  weather,
  locality,
}: {
  weather: import("@/lib/hold/types").WeatherSnap | null;
  locality: string | null;
}) {
  const now = useNow(100);
  const phase = useHold((s) => s.crashPhase);
  const endsAt = useHold((s) => s.crashEndsAt);
  const expireCrash = useHold((s) => s.expireCrash);
  const { snapshot } = useSensors();

  useEffect(() => {
    if (phase !== "countdown" || !endsAt) return;
    if (now >= endsAt) {
      expireCrash({
        ...snapshot(),
        weather,
        locality,
      });
    }
  }, [phase, endsAt, now, expireCrash, snapshot, weather, locality]);

  if (phase !== "countdown") return null;
  const remain = endsAt ? endsAt - now : 0;

  return (
    <div className="crash-layer" role="alertdialog" aria-label="Crash detection">
      <p className="m-0 text-sm font-medium tracking-[0.18em] text-warn uppercase">
        Crash Detection
      </p>
      <p className="mt-4 mb-1 font-mono text-6xl font-medium tabular-nums tracking-tight">
        {formatCountdown(remain)}
      </p>
      <p className="m-0 max-w-xs text-sm leading-normal text-muted">
        CoreMotion registered an impact. Press the Action Button if you are OK.
        If you don't, HOLD starts Emergency SOS.
      </p>
    </div>
  );
}
