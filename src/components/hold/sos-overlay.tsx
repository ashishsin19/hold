import { useEffect, useRef } from "react";
import { formatCountdown } from "@/lib/hold/format";
import { useHold } from "@/lib/hold/store";
import { useSensors } from "@/lib/hold/sensors";
import { useNow } from "@/lib/hold/use-now";

export function SosOverlay() {
  const now = useNow(100);
  const phase = useHold((s) => s.sosPhase);
  const endsAt = useHold((s) => s.sosEndsAt);
  const fireSos = useHold((s) => s.fireSos);
  const cancelSos = useHold((s) => s.cancelSos);
  const { snapshot, shakeNonce, simulateShake } = useSensors();
  const baseline = useRef<number | null>(null);

  useEffect(() => {
    if (phase === "countdown") {
      if (baseline.current === null) baseline.current = shakeNonce;
      else if (shakeNonce !== baseline.current) cancelSos();
    } else {
      baseline.current = null;
    }
  }, [phase, shakeNonce, cancelSos]);

  useEffect(() => {
    if (phase !== "countdown" || !endsAt) return;
    if (now >= endsAt) fireSos(snapshot());
  }, [phase, endsAt, now, fireSos, snapshot]);

  if (phase === "idle") return null;

  if (phase === "fired") {
    return (
      <div className="sos-layer" role="alertdialog" aria-label="SOS active">
        <p className="m-0 text-sm font-medium tracking-[0.18em] text-danger uppercase">
          SOS
        </p>
        <p className="mt-4 mb-2 font-sans text-4xl font-semibold tracking-tight">
          Signed and live
        </p>
        <p className="m-0 max-w-xs text-sm leading-normal text-muted">
          Circle and Medical ID ride with the SOS. Long-press the Action Button
          to clear.
        </p>
      </div>
    );
  }

  const remain = endsAt ? endsAt - now : 0;

  return (
    <div className="sos-layer" role="alertdialog" aria-label="SOS countdown">
      <p className="m-0 text-sm font-medium tracking-[0.18em] text-danger uppercase">
        SOS
      </p>
      <p className="mt-5 mb-1 font-mono text-7xl font-medium tabular-nums tracking-tight">
        {formatCountdown(remain)}
      </p>
      <p className="m-0 max-w-xs text-sm leading-normal text-muted">
        Shake the phone to cancel. A press will not stop this.
      </p>
      <button type="button" className="ghost-cta mt-8 max-w-56" onClick={simulateShake}>
        Simulate shake
      </button>
    </div>
  );
}
